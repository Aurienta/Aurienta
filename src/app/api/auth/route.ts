// AURIENTA auth API — Session-backed sign-in (REMED-1A).
//
// Hardening over the legacy route:
// - Sessions are persisted in the Session table (revocable, rotating, device-tracked).
// - Passwords are verified against scrypt hashes via verifyPassword().
// - Plaintext / `$mock$` hashes are refused in production (hard 500) and only
//   accepted in dev when ALLOW_DEMO_SIGNIN=true (sandbox convenience).
// - Rate-limited via the shared `limiters.signin` limiter.
// - Every sign-in attempt is audit-logged (allowed / denied).
// - The CSRF cookie is issued by middleware.ts (double-submit pattern); this
//   route does NOT set X-CSRF-Token on the response. Same-origin fetches under
//   the lax same-site cookie + Origin check are CSRF-protected by middleware.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/aurienta/env";
import { logger } from "@/lib/aurienta/logger";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import { authSchema, parseBody } from "@/lib/aurienta/validation";
import { createSession, signOut, signInAs } from "@/lib/aurienta/auth";
import { verifyPassword, isPlaintextHash } from "@/lib/aurienta/password";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return "unknown";
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // ── Rate-limit: 10 attempts / 60s / IP ──
  const rl = limiters.signin(ip);
  if (!rl.allowed) {
    logger.warn("auth rate-limited", { ip, resetAt: rl.resetAt });
    return rateLimitedResponse(rl.resetAt);
  }

  // ── Parse body ──
  const body = await parseBody(req, authSchema);
  if (body instanceof NextResponse) return body;

  // ── Sign-out branch (kept for backwards compatibility) ──
  if (body.action === "signout") {
    await signOut();
    return NextResponse.json({ ok: true });
  }

  const email = body.email.trim().toLowerCase();
  const password = body.password ?? "";

  // ── Demo sign-in: only when ALLOW_DEMO_SIGNIN=true AND no password supplied ──
  // Sandbox convenience: lets the demo-user-picker work without a password.
  // In production this branch is unreachable (env.allowDemoSignIn is false).
  if (env.allowDemoSignIn && !password) {
    const user = await signInAs(email);
    if (!user) {
      await audit({
        action: "auth.signin",
        result: "denied",
        reason: "demo_unknown_email",
        ip,
        userAgent,
      });
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    await audit({
      action: "auth.signin",
      actorId: user.id,
      result: "allowed",
      reason: "demo_signin",
      ip,
      userAgent,
    });
    logger.info("auth success (demo)", { userId: user.id, ip });
    return NextResponse.json({
      user: { id: user.id, email: user.email, legalName: user.legalName },
    });
  }

  // ── Real password authentication ──
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    // Deliberately do NOT reveal which of email/password failed.
    await audit({
      action: "auth.signin",
      result: "denied",
      reason: "unknown_email",
      ip,
      userAgent,
    });
    logger.info("auth failed: unknown email", { email, ip });
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  // Legacy / mocked hash handling. In production a plaintext hash means the
  // account is unprovisioned — refuse with a hard 500 (operator must fix).
  // In dev with allowDemoSignIn, fall through to demo sign-in so the sandbox
  // still works for un-migrated seed data.
  if (isPlaintextHash(user.passwordHash)) {
    if (env.nodeEnv === "production") {
      logger.error("auth refused: user has no real password hash", { userId: user.id });
      return NextResponse.json(
        { error: "server_error", message: "Account password hash is not provisioned." },
        { status: 500 }
      );
    }
    if (env.allowDemoSignIn) {
      const demoUser = await signInAs(email);
      if (demoUser) {
        await audit({
          action: "auth.signin",
          actorId: demoUser.id,
          result: "allowed",
          reason: "demo_plaintext_hash",
          ip,
          userAgent,
        });
        logger.info("auth success (demo, plaintext hash)", { userId: demoUser.id, ip });
        return NextResponse.json({
          user: { id: demoUser.id, email: demoUser.email, legalName: demoUser.legalName },
        });
      }
    }
    await audit({
      action: "auth.signin",
      actorId: user.id,
      result: "denied",
      reason: "plaintext_hash_refused",
      ip,
      userAgent,
    });
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  // ── Verify password ──
  const passwordOk = password ? verifyPassword(password, user.passwordHash) : false;
  if (!passwordOk) {
    await audit({
      action: "auth.signin",
      actorId: user.id,
      result: "denied",
      reason: "wrong_password",
      ip,
      userAgent,
    });
    logger.info("auth failed: bad password", { email, ip });
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  // ── Success — create a server-side Session ──
  await createSession(user.id, { ip, userAgent });
  await audit({
    action: "auth.signin",
    actorId: user.id,
    result: "allowed",
    ip,
    userAgent,
  });
  logger.info("auth success", { userId: user.id, ip });
  return NextResponse.json({
    user: { id: user.id, email: user.email, legalName: user.legalName },
  });
}, "POST /api/auth");
