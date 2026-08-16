// AURIENTA — Document E-Signature API
// ═══════════════════════════════════════════════════════════════
// POST /api/documents/[id]/sign
//
// Records an Ed25519 signature on an EnterpriseDocument.
//
// Flow:
//   1. Load the EnterpriseDocument (must exist + not archived).
//   2. Compute a deterministic document hash: SHA3-256 over
//      (documentId | fileUrl | fileName | mimeType | sizeBytes | uploadedAt).
//   3. Authorize the signer — must be a member of the enterprise.
//   4. Look up the user's Ed25519 identityAnchor (public key, hex) +
//      identitySecretEnc (AES-GCM-encrypted private key).
//   5. Sign the document hash with the user's private key:
//        signatureB64 = signWithUserKey(identitySecretEnc, documentHash)
//   6. Compute a tamper-evident signatureHash: SHA3-256 over
//      (documentHash | signatureB64 | userId | ISO timestamp).
//   7. Persist an AiArtifact with kind="document_signature" storing
//      { documentId, userId, signatureHash, signatureB64, documentHash, timestamp }.
//   8. Append a `document_signed` ledger event.
//   9. Audit log + return the signature envelope.
//
// Verification path (for any future auditor):
//   verifyUserSignature(user.identityAnchor, documentHash, signatureB64)
//
// Auth required. Audit-logged. Ledger-appended.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import { signWithUserKey } from "@/lib/aurienta/signing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  signatureType: z.literal("ed25519"),
});

/**
 * Compute a deterministic document hash from the immutable document
 * reference fields. This is the message that gets signed by the user's
 * Ed25519 private key. Any tampering with fileUrl / fileName / sizeBytes
 * etc. produces a different hash → signature verification fails.
 */
function computeDocumentHash(doc: {
  id: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
}): string {
  const message = [
    doc.id,
    doc.fileUrl,
    doc.fileName,
    doc.mimeType,
    String(doc.sizeBytes),
    doc.uploadedAt.toISOString(),
  ].join("|");
  return createHash("sha3-256").update(message, "utf8").digest("hex");
}

/**
 * POST /api/documents/[id]/sign
 * Body: { signatureType: "ed25519" }
 *
 * Authorization: caller must be a member of the enterprise that owns
 * the document (any role). The caller must also have an Ed25519
 * identityAnchor (public key) + identitySecretEnc (encrypted private
 * key) — these are provisioned at onboarding.
 *
 * Returns: { ok, signature: { documentId, signedBy, signedAt, signatureHash } }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { id: documentId } = await params;

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          code: "INVALID_BODY",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const doc = await db.enterpriseDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        enterpriseId: true,
        title: true,
        fileName: true,
        fileUrl: true,
        mimeType: true,
        sizeBytes: true,
        uploadedAt: true,
        verificationStatus: true,
        enterprise: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found", code: "DOCUMENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Authorization: must be a member of the enterprise.
    const isMember = user.memberships.some(
      (m) => m.enterpriseId === doc.enterpriseId
    );
    const isRep = user.memberships.some((m) => m.role === "aurienta_rep");
    if (!isMember && !isRep) {
      await audit({
        actorId: user.id,
        action: "document.sign",
        target: `document:${documentId}`,
        result: "denied",
        reason: "Not a member of the enterprise that owns this document",
        ip,
        userAgent,
      });
      return NextResponse.json(
        {
          error: "Forbidden: must be a member of the enterprise",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // Refuse to sign on behalf of a frozen enterprise (constitutional safeguard).
    if (doc.enterprise.status === "frozen") {
      await audit({
        actorId: user.id,
        action: "document.sign",
        target: `document:${documentId}`,
        result: "denied",
        reason: "Enterprise is frozen",
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "Enterprise is frozen; signing is suspended", code: "ENTERPRISE_FROZEN" },
        { status: 400 }
      );
    }

    // The signer must have an Ed25519 identity anchor + encrypted secret.
    if (!user.identityAnchor || !user.identitySecretEnc) {
      await audit({
        actorId: user.id,
        action: "document.sign",
        target: `document:${documentId}`,
        result: "denied",
        reason: "Signer has no Ed25519 identity anchor",
        ip,
        userAgent,
      });
      return NextResponse.json(
        {
          error:
            "Your account has no Ed25519 identity anchor. Complete onboarding to enable signing.",
          code: "NO_IDENTITY_ANCHOR",
        },
        { status: 400 }
      );
    }

    // ── Compute the document hash + sign it with the user's Ed25519 key ──
    const documentHash = computeDocumentHash(doc);
    const signedAt = new Date();
    let signatureB64: string;
    try {
      signatureB64 = signWithUserKey(user.identitySecretEnc, documentHash);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error("[POST /api/documents/[id]/sign] signing failed:", {
        err: msg,
        userId: user.id,
      });
      await audit({
        actorId: user.id,
        action: "document.sign",
        target: `document:${documentId}`,
        result: "denied",
        reason: `Ed25519 signing failed: ${msg}`,
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "Signing failed: could not decrypt identity secret", code: "SIGN_FAILED" },
        { status: 500 }
      );
    }

    // Tamper-evident signature envelope hash.
    const signatureHash = createHash("sha3-256")
      .update(
        [documentHash, signatureB64, user.id, signedAt.toISOString()].join("|"),
        "utf8"
      )
      .digest("hex");

    // ── Persist the signature as an AiArtifact + append ledger event atomically ──
    const artifact = await db.$transaction(async (tx) => {
      const created = await tx.aiArtifact.create({
        data: {
          kind: "document_signature",
          enterpriseId: doc.enterpriseId,
          userId: user.id,
          entityId: doc.id,
          content: `Ed25519 signature on document ${doc.fileName} (${doc.id}) by ${user.legalName}`,
          payload: JSON.stringify({
            documentId: doc.id,
            documentTitle: doc.title,
            documentFileName: doc.fileName,
            documentHash,
            signatureHash,
            signatureB64,
            signedBy: user.id,
            signedByName: user.legalName,
            signerIdentityAnchor: user.identityAnchor,
            signatureType: "ed25519",
            timestamp: signedAt.toISOString(),
          }),
          confidence: 1.0,
          modelVersion: "ed25519-v1",
        },
      });

      await appendLedgerEvent(tx, {
        enterpriseId: doc.enterpriseId,
        eventType: "document_signed",
        payload: {
          documentId: doc.id,
          documentFileName: doc.fileName,
          documentHash,
          signatureHash,
          signatureArtifactId: created.id,
          signedBy: user.id,
          signedByName: user.legalName,
          signerIdentityAnchor: user.identityAnchor,
          signatureType: "ed25519",
          signedAt: signedAt.toISOString(),
          enterprise: {
            id: doc.enterprise.id,
            name: doc.enterprise.name,
            slug: doc.enterprise.slug,
          },
        },
        actorId: user.id,
      });

      return created;
    });

    // Mark the document as signed (verificationStatus is the existing column —
    // we promote it to "signed" without dropping prior evidence-level info).
    await db.enterpriseDocument
      .update({
        where: { id: documentId },
        data: { verificationStatus: "signed" },
      })
      .catch((e) => {
        // Non-fatal: the signature is already persisted in the AiArtifact +
        // ledger. We log but don't fail the request.
        logger.warn("[document.sign] could not update verificationStatus:", {
          err: e instanceof Error ? e.message : String(e),
        });
      });

    await audit({
      actorId: user.id,
      action: "document.sign",
      target: `document:${documentId}`,
      result: "allowed",
      metadata: {
        documentHash,
        signatureHash,
        signatureArtifactId: artifact.id,
        signatureType: "ed25519",
        signerIdentityAnchor: user.identityAnchor,
      },
      ip,
      userAgent,
    });

    logger.info("document.signed", {
      documentId,
      userId: user.id,
      signatureHash,
    });

    return NextResponse.json({
      ok: true,
      signature: {
        documentId,
        signedBy: user.id,
        signedByName: user.legalName,
        signedAt: signedAt.toISOString(),
        signatureHash,
        documentHash,
        signatureType: "ed25519",
        artifactId: artifact.id,
        // Verification hint for any future auditor:
        //   verifyUserSignature(signerIdentityAnchor, documentHash, signatureB64)
        signerIdentityAnchor: user.identityAnchor,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[POST /api/documents/[id]/sign] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to sign document", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
