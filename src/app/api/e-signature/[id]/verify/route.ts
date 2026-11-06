// AURIENTA — E-Signature Verification API
// ════════════════════════════════════════════════════════════════════
// GET  /api/e-signature/[id]/verify           — verify ALL signatures
//                                                 on the document.
// GET  /api/e-signature/[id]/verify?signerId= — verify a specific signer's
//                                                 signature only.
//
// Public trust surface — does NOT require auth (any auditor with a
// document ID can verify). The signature envelope is self-contained:
// the document hash is re-derived from stored immutable fields, then
// verifyUserSignature(signerIdentityAnchor, documentHash, signatureB64)
// is called per signer. Returns a structured per-signer verdict.

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import {
  getDocument,
  verifySignature,
} from "@/lib/aurienta/e-signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id: documentId } = await params;
    const signerId = req.nextUrl.searchParams.get("signerId");

    const doc = await getDocument(documentId);
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found", code: "not_found" },
        { status: 404 }
      );
    }

    // If a specific signer was requested, verify only that signer.
    if (signerId) {
      const verification = await verifySignature(documentId, signerId);
      return NextResponse.json({
        documentId,
        documentHash: doc.documentHash,
        documentStatus: doc.status,
        ledgerAnchorHash: doc.ledgerAnchorHash,
        ledgerSequence: doc.ledgerSequence,
        signatureType: "ed25519",
        legalClassification: "simple",
        jurisdiction: "EG",
        verification,
      });
    }

    // Otherwise verify every signer on the document.
    const verifications = await Promise.all(
      doc.signers.map(async (s) => ({
        signerId: s.signerId,
        status: s.status,
        ...(
          await verifySignature(documentId, s.signerId)
        ),
      }))
    );

    const allValid =
      verifications.length > 0 &&
      verifications.every((v) => v.valid);

    return NextResponse.json({
      documentId,
      documentHash: doc.documentHash,
      documentStatus: doc.status,
      ledgerAnchorHash: doc.ledgerAnchorHash,
      ledgerSequence: doc.ledgerSequence,
      signatureType: "ed25519",
      legalClassification: "simple",
      jurisdiction: "EG",
      allSignaturesValid: allValid,
      signerCount: verifications.length,
      signedCount: verifications.filter((v) => v.valid).length,
      verifications,
    });
  },
  "GET /api/e-signature/[id]/verify"
);
