// AURIENTA — Soulbound Credential API
// ─────────────────────────────────────────────────────────────────────────
// GET  /api/soulbound        — return the caller's credential (or null).
// POST /api/soulbound        — mint a new credential for the caller.
//
// The credential is non-transferable (soulbound). One credential per user.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { mintCredential, getCredential } from "@/lib/aurienta/soulbound-credential";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/soulbound — current user's credential, or null.
export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const credential = await getCredential(user.id);
  return NextResponse.json({ credential });
}, "GET /api/soulbound");

// POST /api/soulbound — mint a soulbound credential for the current user.
//
// Returns:
//   200 — { credential, verdict } on success
//   400 — { error, verdict } when the CRE policy denies the mint
//   401 — not authenticated
//   429 — rate limited
export const POST = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // Rate limit: 5 mint attempts per minute per user. Mints are cheap but the
  // CRE policy will reject any second attempt anyway.
  const rl = limiters.diaspora(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  const { credential, verdict } = await mintCredential(user.id);

  if (!verdict.allowed || !credential) {
    return NextResponse.json(
      {
        error: verdict.reason ?? "Mint denied",
        code: "mint_denied",
        verdict,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ credential, verdict }, { status: 200 });
}, "POST /api/soulbound");
