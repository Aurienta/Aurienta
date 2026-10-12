// AURIENTA — Soulbound Credential Revocation API
// ─────────────────────────────────────────────────────────────────────────
// POST /api/soulbound/revoke
// Body: { userId, reason }
//
// AURIENTA-only endpoint — only callers holding the `aurienta_rep` role may
// revoke a credential. The credential remains in the database (it is NOT
// deleted) so that external verifiers continue to receive a structured
// "revoked on {date}" response.
//
// Returns:
//   200 — { ok, revoked: true, credential } on success
//   403 — caller is not aurienta_rep
//   404 — user has no credential to revoke
//   400 — missing userId / reason

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { revokeCredential } from "@/lib/aurienta/soulbound-credential";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  let actor;
  try {
    actor = await requireRole("aurienta_rep");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Not authenticated")) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Forbidden: requires aurienta_rep role", code: "forbidden" },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    userId?: string;
    reason?: string;
  };
  const userId =
    typeof body.userId === "string" ? body.userId.trim() : "";
  const reason =
    typeof body.reason === "string" && body.reason.trim().length > 0
      ? body.reason.trim()
      : "No reason supplied.";

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required", code: "missing_user_id" },
      { status: 400 }
    );
  }

  const credential = await revokeCredential(userId, reason, actor.id);
  if (!credential) {
    return NextResponse.json(
      { error: "User has no soulbound credential", code: "not_found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    revoked: credential.isRevoked,
    credential,
  });
}, "POST /api/soulbound/revoke");
