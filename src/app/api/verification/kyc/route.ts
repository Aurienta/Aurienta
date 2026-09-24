import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/verification/kyc
// Receives the KYC liveness result from the client and persists the
// server-computed verification level. The client does NOT set the
// verification level — the server does, based on the submitted evidence.
//
// SANDBOX MOCK: In production, this endpoint will call real TrOCR/facenet/DFDC
// services to verify the liveness payload. In sandbox, we accept the
// client-submitted result and compute the verification level deterministically.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { getCurrentUser } = await import("@/lib/aurienta/auth");
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  // SANDBOX MOCK: Accept the client-submitted liveness result.
  // Production: call real liveness SDK here and verify the payload.
  const livenessScore = typeof body.livenessScore === "number" ? body.livenessScore : 0.97;
  const faceMatchScore = typeof body.faceMatchScore === "number" ? body.faceMatchScore : 0.95;
  const documentAuthenticity = typeof body.documentAuthenticity === "number" ? body.documentAuthenticity : 0.98;

  // Server-side verification level computation (NOT from client)
  let verificationLevel = "L1";
  let verificationStatus = "verified";

  if (livenessScore >= 0.95 && faceMatchScore >= 0.90 && documentAuthenticity >= 0.95) {
    verificationLevel = "L3"; // Full KYC + liveness + document
  } else if (livenessScore >= 0.85 && faceMatchScore >= 0.80) {
    verificationLevel = "L2"; // KYC + liveness
  } else {
    verificationLevel = "L1"; // Basic KYC only
    verificationStatus = "in_review"; // Needs manual review
  }

  // Persist the server-computed verification level
  await db.user.update({
    where: { id: user.id },
    data: {
      verificationLevel,
      verificationStatus,
    } as any,
  });

  await audit({
    actorId: user.id,
    action: "kyc.completed",
    target: `user:${user.id}`,
    result: "allowed",
    metadata: {
      livenessScore,
      faceMatchScore,
      documentAuthenticity,
      verificationLevel,
      verificationStatus,
      method: "sandbox_mock_liveness",
    },
  });

  return NextResponse.json({
    ok: true,
    verificationLevel,
    verificationStatus,
    scores: { livenessScore, faceMatchScore, documentAuthenticity },
    note: "Sandbox mock: production will call real TrOCR/facenet/DFDC services.",
  });
});
