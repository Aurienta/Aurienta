// AURIENTA auth API — Session-backed sign-in (REMED-1A).
//
// Hardening over the legacy route:
// - Sessions are persisted in the Session table (revocable, rotating, device-tracked).
// - Passwords are verified via Argon2id (verifyPasswordV2) with transparent upgrade
//   of legacy scrypt hashes on the next successful login (AUD-001).
// - Account lockout (5 attempts → 15-min lock) is enforced BEFORE the password
//   verify path so timing oracles cannot reveal user existence (AUD-002).
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
import { verifyPasswordV2, hashPasswordV2, isPlaintextHash } from "@/lib/aurienta/password-v2";
import { checkLockout, recordFailedAttempt, resetLockout } from "@/lib/aurienta/account-lockout";
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
  // Support both JSON (fetch API) and form-encoded (native HTML form) submissions.
  const contentType = req.headers.get("content-type") ?? "";
  const isFormSubmission = contentType.includes("application/x-www-form-urlencoded");
  let email: string;
  let password: string;
  let action: string | undefined;

  if (isFormSubmission) {
    // Native HTML form submission — parse form data directly.
    const formData = await req.formData();
    email = (formData.get("email") as string)?.trim().toLowerCase() ?? "";
    password = (formData.get("password") as string) ?? "";
    action = (formData.get("action") as string) ?? undefined;
  } else {
    // JSON API call — use zod-validated parseBody.
    const body = await parseBody(req, authSchema);
    if (body instanceof NextResponse) return body;
    email = body.email.trim().toLowerCase();
    password = body.password ?? "";
    action = body.action;
  }

  // Helper: on auth failure, redirect form submissions back to signin,
  // or return JSON for API calls. `extra` is merged into the JSON body so
  // the client can surface "X attempts remaining" (AUD-002).
  function authFail(status: number, error: string, extra?: Record<string, unknown>) {
    if (isFormSubmission) {
      return NextResponse.redirect(new URL("/signin?error=invalid_credentials", req.url), { status: 303 });
    }
    return NextResponse.json({ error, ...(extra ?? {}) }, { status });
  }

  // ── Sign-out branch (kept for backwards compatibility) ──
  if (action === "signout") {
    await signOut();
    return NextResponse.json({ ok: true });
  }

  // ── Account lockout (AUD-002) — keyed by email so it applies even
  // before user lookup, eliminating user-exists timing side-channel. ──
  const lockout = await checkLockout(email);
  if (lockout.locked) {
    const retryAfterSec = Math.ceil((lockout.remainingMs ?? 0) / 1000);
    await audit({
      action: "auth.signin",
      result: "denied",
      reason: "account_locked",
      metadata: { retryAfterSec },
      ip,
      userAgent,
    });
    logger.warn("auth refused: account locked", { email, ip, retryAfterSec });
    return NextResponse.json(
      { error: "Account locked", retryAfter: retryAfterSec },
      { status: 423, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  // ── Demo sign-in: only when ALLOW_DEMO_SIGNIN=true AND no password supplied ──
  // Sandbox convenience: lets the demo-user-picker work without a password.
  // In production this branch is unreachable (env.allowDemoSignIn is false).
  if (env.allowDemoSignIn && !password) {
    const user = await signInAs(email);
    if (!user) {
      // Record failed attempt even for demo flow so lockout triggers on
      // repeated unknown emails (timing-oracle hardening).
      const { attemptsRemaining } = await recordFailedAttempt(email);
      await audit({
        action: "auth.signin",
        result: "denied",
        reason: "demo_unknown_email",
        metadata: { attemptsRemaining },
        ip,
        userAgent,
      });
      return authFail(401, "invalid_credentials", { attemptsRemaining });
    }
    await resetLockout(email);
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
    // Record failed attempt so lockout fires for non-existent emails too
    // (prevents user-existence enumeration via lockout timing).
    const { attemptsRemaining } = await recordFailedAttempt(email);
    await audit({
      action: "auth.signin",
      result: "denied",
      reason: "unknown_email",
      metadata: { attemptsRemaining },
      ip,
      userAgent,
    });
    logger.info("auth failed: unknown email", { email, ip, attemptsRemaining });
    return authFail(401, "invalid_credentials", { attemptsRemaining });
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
        await resetLockout(email);
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
    const { attemptsRemaining } = await recordFailedAttempt(email);
    await audit({
      action: "auth.signin",
      actorId: user.id,
      result: "denied",
      reason: "plaintext_hash_refused",
      metadata: { attemptsRemaining },
      ip,
      userAgent,
    });
    return authFail(401, "invalid_credentials", { attemptsRemaining });
  }

  // ── Verify password via Argon2id (AUD-001) ──
  // verifyPasswordV2 supports BOTH argon2id$ (new) and scrypt$ (legacy).
  // On success against a legacy scrypt hash, needsUpgrade=true triggers a
  // transparent re-hash with Argon2id (lazy migration on next login).
  const passwordResult = password
    ? await verifyPasswordV2(password, user.passwordHash)
    : { valid: false, needsUpgrade: false };

  if (!passwordResult.valid) {
    const { locked, attempts, attemptsRemaining } = await recordFailedAttempt(email);
    await audit({
      action: "auth.signin",
      actorId: user.id,
      result: "denied",
      reason: "wrong_password",
      metadata: { attemptsRemaining, locked },
      ip,
      userAgent,
    });
    logger.info("auth failed: bad password", { email, ip, attempts, locked });
    // If this attempt just crossed the lockout threshold, surface the lock
    // instead of a generic 401 so the client can show a countdown.
    if (locked) {
      const retryAfterSec = Math.ceil(15 * 60); // LOCK_DURATION_MS / 1000
      return NextResponse.json(
        { error: "Account locked", retryAfter: retryAfterSec },
        { status: 423, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }
    return authFail(401, "invalid_credentials", { attemptsRemaining });
  }

  // ── Transparent hash upgrade (AUD-001): re-hash with Argon2id ──
  if (passwordResult.needsUpgrade) {
    try {
      const newHash = await hashPasswordV2(password);
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
      logger.info("password hash upgraded to argon2id", { userId: user.id });
    } catch (e) {
      // Non-fatal — user is already authenticated. Log and continue; the
      // next login will retry the upgrade.
      logger.error("failed to upgrade password hash", {
        userId: user.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // ── Success: clear lockout + create a server-side Session (AUD-002) ──
  await resetLockout(email);
  await createSession(user.id, { ip, userAgent });
  await audit({
    action: "auth.signin",
    actorId: user.id,
    result: "allowed",
    ip,
    userAgent,
  });
  logger.info("auth success", { userId: user.id, ip });

  // If this is a native HTML form submission (content-type: form-encoded),
  // redirect to the dashboard directly — no JavaScript needed.
  if (isFormSubmission) {
    return NextResponse.redirect(new URL("/dashboard/portfolio", req.url), { status: 303 });
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, legalName: user.legalName },
  });
}, "POST /api/auth");
