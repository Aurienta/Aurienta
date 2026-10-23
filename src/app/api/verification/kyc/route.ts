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
// SECURITY FIX (PLATFORM-FULL-AUDIT-AND-REMEDIATION-001 / P0-2):
// The previous implementation defaulted missing liveness/face/document scores
// to 0.97/0.95/0.98 — meaning `POST {}` from any authenticated user
// auto-elevated them to L3. We now require the client to submit ALL three
// scores explicitly and reject the request otherwise.
//
// SANDBOX MOCK: In production, this endpoint will call real TrOCR/facenet/DFDC
// services to verify the liveness payload. In sandbox, we accept the
// client-submitted scores but require them to be present.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { getCurrentUser } = await import("@/lib/aurienta/auth");
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Bad request — JSON body required with liveness payload" },
      { status: 400 }
    );
  }

  // SECURITY: do NOT default missing scores to passing values.
  // The client MUST supply all three scores from a real liveness capture.
  const livenessScore = body.livenessScore;
  const faceMatchScore = body.faceMatchScore;
  const documentAuthenticity = body.documentAuthenticity;

  if (
    typeof livenessScore !== "number" ||
    typeof faceMatchScore !== "number" ||
    typeof documentAuthenticity !== "number" ||
    livenessScore < 0 ||
    livenessScore > 1 ||
    faceMatchScore < 0 ||
    faceMatchScore > 1 ||
    documentAuthenticity < 0 ||
    documentAuthenticity > 1
  ) {
    return NextResponse.json(
      {
        error:
          "Bad request — livenessScore, faceMatchScore, and documentAuthenticity (each 0..1) are required",
      },
      { status: 400 }
    );
  }

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
