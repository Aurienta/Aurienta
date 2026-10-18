// Passkey registration — start.
//
// Generates WebAuthn registration options for the authenticated user and
// stashes the challenge in a signed HttpOnly cookie. The browser passes
// the returned options to `startRegistration()` from @simplewebauthn/browser.
//
// Auth required: the user must already be signed in (via password or
// existing session) to add a new passkey. This is the standard pattern —
// passkey enrollment is a privileged action.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { getRpConfig, generateRegistrationOptionsForUser } from "@/lib/aurienta/passkey";
import { setChallengeCookie } from "@/lib/aurienta/passkey-challenge";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1).max(80).optional(),
});

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // ── Rate-limit (DB-backed — AUD-030 / AUD-031) ──
  // Passkey enrollment is a privileged action; rate-limit per-user so a
  // compromised session can't enumerate enrollments.
  const rl = await limiters.passkeyDb(`${user.id}:${ip}`);
  if (!rl.allowed) {
    logger.warn("passkey register/start rate-limited", { ip, userId: user.id, resetAt: rl.resetAt });
    return rateLimitedResponse(rl.resetAt);
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    parsed = bodySchema.parse(raw);
  } catch {
    parsed = {};
  }

  const host = req.headers.get("host");
  const rpConfig = getRpConfig(host);
  const options = await generateRegistrationOptionsForUser(
    user.id,
    user.email,
    user.legalName,
    rpConfig
  );

  await setChallengeCookie(options.challenge);

  // Stash the optional label in a separate short-lived cookie so /finish can
  // persist it without re-trusting client input. The label is non-secret and
  // only used as a UI hint (e.g. "MacBook Pro Touch ID").
  if (parsed.name) {
    const store = await cookies();
    store.set("aurienta_passkey_name", parsed.name, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 300,
    });
  }

  await audit({
    action: "auth.passkey.register.start",
    actorId: user.id,
    result: "allowed",
    ip,
    userAgent,
    metadata: { rpID: rpConfig.rpID, name: parsed.name ?? null },
  });
  logger.info("passkey register start", { userId: user.id, ip });

  return NextResponse.json({ options });
}, "POST /api/auth/passkey/register/start");
