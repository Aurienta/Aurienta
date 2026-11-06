// AURIENTA — E-Signature Single-Document API
// ════════════════════════════════════════════════════════════════════
// GET  /api/e-signature/[id]    — get document details (owner, signers, status, body).
// POST /api/e-signature/[id]    — sign the document as the current user.
//                                 Optional body: { action: "decline", reason: "..." }
//                                          OR   { action: "void" }
//                                          OR   { signatureB64: "<base64>" }
//                                          OR   {} (server-side Ed25519 with the
//                                                 caller's identitySecretEnc).
// PATCH /api/e-signature/[id]   — alias for POST (some clients prefer PATCH
//                                 for state transitions). Same body schema.
//
// Auth required. Audit-logged. Ledger-anchored.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody } from "@/lib/aurienta/validation";
import {
  declineSignature,
  getDocument,
  getDocumentStatus,
  requestSignature,
  signDocument,
  voidDocument,
  type DocumentInstance,
} from "@/lib/aurienta/e-signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET: document details ───────────────────────────────────────────

export const GET = withErrorHandler(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const doc = await getDocument(id);
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found", code: "not_found" },
        { status: 404 }
      );
    }

    // Visibility: caller is owner, a requested signer, a member of the
    // enterprise, or an AURIENTA Rep.
    const isOwner = doc.ownerId === user.id;
    const isSigner = doc.signers.some((s) => s.signerId === user.id);
    const isMember = (user.memberships ?? []).some(
      (m) => m.enterpriseId && m.enterpriseId === doc.enterpriseId
    );
    const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
    if (!isOwner && !isSigner && !isMember && !isRep) {
      return NextResponse.json(
        { error: "Forbidden — not authorized to view this document", code: "forbidden" },
        { status: 403 }
      );
    }

    const status = await getDocumentStatus(id);

    return NextResponse.json({
      document: serializeDocument(doc),
      statusSummary: status,
    });
  },
  "GET /api/e-signature/[id]"
);

// ─── POST: sign / decline / void / request ───────────────────────────

const SignBodySchema = z.object({
  action: z
    .enum(["sign", "decline", "void", "request"])
    .default("sign"),
  // For action="sign": caller may supply a pre-computed signature (the
  // server will verify it against the signer's identityAnchor before
  // trusting it). If omitted, the server signs with the caller's
  // identitySecretEnc.
  signatureB64: z.string().optional(),
  // For action="decline":
  reason: z.string().max(1000).optional(),
  // For action="request": the user ID to request a signature from.
  signerId: z.string().optional(),
  // For action="request": an optional expiry date for the document.
  expiresAt: z.string().datetime().optional(),
});

export const POST = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }

    const { id: documentId } = await params;

    const body = await parseBody(req, SignBodySchema);
    if (body instanceof NextResponse) return body;

    // Verify document exists and the caller is authorized to act on it.
    const doc = await getDocument(documentId);
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found", code: "not_found" },
        { status: 404 }
      );
    }

    const isOwner = doc.ownerId === user.id;
    const isSigner = doc.signers.some((s) => s.signerId === user.id);
    const isMember = (user.memberships ?? []).some(
      (m) => m.enterpriseId && m.enterpriseId === doc.enterpriseId
    );
    const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");

    if (body.action === "void") {
      // Only the owner or an AURIENTA Rep can void.
      if (!isOwner && !isRep) {
        return NextResponse.json(
          { error: "Only the document owner may void it", code: "forbidden" },
          { status: 403 }
        );
      }
      const updated = await voidDocument(documentId, user.id);
      return NextResponse.json({ document: serializeDocument(updated) });
    }

    if (body.action === "request") {
      // Only the owner (or a Rep) can request a new signer.
      if (!isOwner && !isRep) {
        return NextResponse.json(
          {
            error: "Only the document owner may request new signers",
            code: "forbidden",
          },
          { status: 403 }
        );
      }
      if (!body.signerId) {
        return NextResponse.json(
          {
            error: "signerId is required for action=request",
            code: "invalid_body",
          },
          { status: 400 }
        );
      }
      const signer = await requestSignature(documentId, body.signerId, {
        requestedById: user.id,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      });
      const updated = await getDocument(documentId);
      return NextResponse.json({
        document: updated ? serializeDocument(updated) : null,
        signer,
      });
    }

    // action === "sign" or "decline" — caller must be a requested signer
    // OR an AURIENTA Rep acting on behalf of a specific signer (Reps
    // typically only inspect, but the existing /api/documents/[id]/sign
    // route allows Reps to sign on behalf of members).
    if (!isSigner && !isMember && !isRep) {
      return NextResponse.json(
        {
          error:
            "You are not an authorized signer for this document",
          code: "forbidden",
        },
        { status: 403 }
      );
    }

    if (body.action === "decline") {
      const { document: updated } = await declineSignature(
        documentId,
        user.id,
        body.reason
      );
      return NextResponse.json({ document: serializeDocument(updated) });
    }

    // action === "sign"
    try {
      const result = await signDocument(documentId, user.id, {
        signatureB64: body.signatureB64,
      });
      return NextResponse.json({
        document: serializeDocument(result.document),
        signer: {
          id: result.signer.id,
          signerId: result.signer.signerId,
          status: result.signer.status,
          signatureB64: result.signer.signatureB64,
          signatureHash: result.signer.signatureHash,
          signedAt: result.signer.signedAt ? result.signer.signedAt.toISOString() : null,
        },
        fullySigned: result.fullySigned,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Map known lifecycle errors to 400 (bad request) instead of 500.
      const isUserError =
        msg.includes("already fully signed") ||
        msg.includes("already signed") ||
        msg.includes("voided") ||
        msg.includes("declined") ||
        msg.includes("expired") ||
        msg.includes("no Ed25519 identity anchor") ||
        msg.includes("failed verification") ||
        msg.includes("Self-verification failed");
      return NextResponse.json(
        { error: msg, code: isUserError ? "invalid_action" : "internal_error" },
        { status: isUserError ? 400 : 500 }
      );
    }
  },
  "POST /api/e-signature/[id]"
);

// ─── PATCH: alias for POST (some clients prefer PATCH for transitions) ──

export const PATCH = POST;

// ─── Serializer ──────────────────────────────────────────────────────

function serializeDocument(doc: DocumentInstance) {
  return {
    id: doc.id,
    templateId: doc.templateId,
    ownerId: doc.ownerId,
    enterpriseId: doc.enterpriseId,
    title: doc.title,
    filledBody: doc.filledBody,
    variablesUsed: doc.variablesUsed,
    documentHash: doc.documentHash,
    status: doc.status,
    ledgerAnchorHash: doc.ledgerAnchorHash,
    ledgerSequence: doc.ledgerSequence,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
    signers: doc.signers.map((s) => ({
      id: s.id,
      signerId: s.signerId,
      status: s.status,
      signatureB64: s.signatureB64,
      signatureHash: s.signatureHash,
      signedAt: s.signedAt ? s.signedAt.toISOString() : null,
      declinedAt: s.declinedAt ? s.declinedAt.toISOString() : null,
      declinedReason: s.declinedReason,
      createdAt: s.createdAt.toISOString(),
    })),
  };
}
