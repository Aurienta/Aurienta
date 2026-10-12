// AURIENTA — Soulbound Credential Verification API
// ─────────────────────────────────────────────────────────────────────────
// POST /api/soulbound/verify
// Body: { credentialId }
//
// Public verification endpoint — any third party can verify a credential
// without authenticating. Returns:
//   200 — { valid: true, credential }   on a valid credential
//   200 — { valid: false, reason }      on an invalid / revoked one
//   400 — missing credentialId
//
// The endpoint never returns 404 for a missing credential — instead it
// returns 200 with `valid: false` so external verifiers get a structured
// response shape they can rely on without exception handling.

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { verifyCredential } from "@/lib/aurienta/soulbound-credential";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = (await req.json().catch(() => ({}))) as {
    credentialId?: string;
  };
  const credentialId =
    typeof body.credentialId === "string" ? body.credentialId.trim() : "";
  if (!credentialId) {
    return NextResponse.json(
      { error: "credentialId is required", code: "missing_credential_id" },
      { status: 400 }
    );
  }

  const result = await verifyCredential(credentialId);
  return NextResponse.json(result, { status: 200 });
}, "POST /api/soulbound/verify");
