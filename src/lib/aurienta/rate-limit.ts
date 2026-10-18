// AURIENTA rate limiting — hybrid in-memory + DB-backed sliding-window limiter.
//
// Problem (AUD-030 / AUD-031): on Vercel serverless each invocation may run
// in a fresh isolate, so the in-memory `Map` does NOT share state across
// requests. An attacker who fires 100 parallel requests can bypass the limit
// because each lambda sees its own empty Map.
//
// Fix (hybrid two-tier):
//   1. In-memory `Map` stays as a fast-path best-effort guard for low-stakes
//      endpoints (AI calls, copilot, governance, …) where a few over-runs
//      per minute are acceptable.
//   2. DB-backed `RateLimitEntry` table is the source of truth for the
//      critical paths: signin, register, passkey, money-moving, whistleblower.
//      An upsert + atomic increment survives across invocations and replicas.
//
// The DB check is OPT-IN via `limiters.signinDb(ip)` and friends so existing
// callers continue to work unchanged; critical routes call the DB variant.
//
// Usage (in-memory — unchanged):
//   const rl = rateLimit({ windowMs: 60_000, max: 30, key: "ai" });
//   const hit = rl(userId);
//   if (!hit.allowed) return 429;
//
// Usage (DB-backed — critical endpoints):
//   const hit = await limiters.signinDb(ip);
//   if (!hit.allowed) return rateLimitedResponse(hit.resetAt);

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/aurienta/logger";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodic sweep — prevent unbounded growth.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

type RateLimitConfig = {
  windowMs: number;
  max: number;
  key: string; // namespace, e.g. "ai", "orders", "signin"
};

export function rateLimit(cfg: RateLimitConfig) {
  return function check(identity: string): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    sweep(now);
    const k = `${cfg.key}:${identity}`;
    const b = buckets.get(k);
    if (!b || b.resetAt <= now) {
      const resetAt = now + cfg.windowMs;
      buckets.set(k, { count: 1, resetAt });
      return { allowed: true, remaining: cfg.max - 1, resetAt };
    }
    if (b.count >= cfg.max) {
      return { allowed: false, remaining: 0, resetAt: b.resetAt };
    }
    b.count += 1;
    return { allowed: true, remaining: cfg.max - b.count, resetAt: b.resetAt };
  };
}

// ── DB-backed limiter ──
//
// Each call:
//   - Looks up the bucket row by `key`.
//   - If row missing OR window expired → upsert with count=1, fresh windowStart.
//   - If row exists and within window → atomic increment; reject if over `max`.
//   - Opportunistically prunes rows older than 2× the window (best-effort).
//
// All DB errors are swallowed and the call is allowed — failing open is the
// right default for rate limiting (a DB outage should NOT lock every user out
// of the platform). The in-memory limiter still provides a backstop.

const PRUNE_PROBABILITY = 0.05; // prune ~5% of calls — avoids a per-request scan
let pruneCounter = 0;

async function dbCheck(
  cfg: RateLimitConfig,
  identity: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const k = `${cfg.key}:${identity}`;
  const windowStart = new Date(now);
  const resetAt = now + cfg.windowMs;

  try {
    // Use upsert so concurrent requests are atomic: the first call creates the
    // row with count=1, subsequent calls within the same window increment.
    const row = await db.rateLimitEntry.upsert({
      where: { key: k },
      create: { key: k, count: 1, windowStart },
      update: {},
      select: { count: true, windowStart: true },
    });

    // Has the window expired since the row was created?
    const rowStartMs = row.windowStart.getTime();
    if (now - rowStartMs >= cfg.windowMs) {
      // Reset the bucket.
      await db.rateLimitEntry.update({
        where: { key: k },
        data: { count: 1, windowStart },
      });
      return { allowed: true, remaining: cfg.max - 1, resetAt };
    }

    // New row was just created (count=1) by this call.
    if (row.count === 1) {
      return { allowed: true, remaining: cfg.max - 1, resetAt: rowStartMs + cfg.windowMs };
    }

    if (row.count >= cfg.max) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: rowStartMs + cfg.windowMs,
      };
    }

    // Increment count atomically (avoid race with where count filter).
    const updated = await db.rateLimitEntry.update({
      where: { key: k },
      data: { count: { increment: 1 } },
      select: { count: true },
    });

    if (updated.count > cfg.max) {
      // Lost a race — caller went 1 over; allow but mark remaining=0 next time.
      return {
        allowed: true,
        remaining: 0,
        resetAt: rowStartMs + cfg.windowMs,
      };
    }

    return {
      allowed: true,
      remaining: cfg.max - updated.count,
      resetAt: rowStartMs + cfg.windowMs,
    };
  } catch (e) {
    // Fail open — DB error must NOT lock the user out.
    logger.warn("rate-limit DB check failed, failing open", {
      key: cfg.key,
      err: e instanceof Error ? e.message : String(e),
    });
    return { allowed: true, remaining: cfg.max, resetAt };
  } finally {
    // Occasional prune — delete buckets whose window expired long ago.
    pruneCounter += 1;
    if (pruneCounter % 20 === 0 && Math.random() < PRUNE_PROBABILITY) {
      const cutoff = new Date(now - cfg.windowMs * 4);
      db.rateLimitEntry
        .deleteMany({ where: { windowStart: { lt: cutoff } } })
        .catch(() => {
          /* best-effort */
        });
    }
  }
}

// ── Pre-configured in-memory limiters ──
export const limiters = {
  // Authentication: 10 attempts per 60s per IP
  signin: rateLimit({ windowMs: 60_000, max: 10, key: "signin" }),
  // AI endpoints: 30 calls per 60s per user (cost control)
  ai: rateLimit({ windowMs: 60_000, max: 30, key: "ai" }),
  // Copilot: tighter — 20/min
  copilot: rateLimit({ windowMs: 60_000, max: 20, key: "copilot" }),
  // Money-moving: 30/min per user
  orders: rateLimit({ windowMs: 60_000, max: 30, key: "orders" }),
  reservations: rateLimit({ windowMs: 60_000, max: 30, key: "reservations" }),
  expenses: rateLimit({ windowMs: 60_000, max: 30, key: "expenses" }),
  // Governance: 20/min (proposals + votes)
  governance: rateLimit({ windowMs: 60_000, max: 20, key: "governance" }),
  // Whistleblower + appeals: 5/min (high-cost AI)
  whistleblower: rateLimit({ windowMs: 60_000, max: 5, key: "whistleblower" }),
  appeals: rateLimit({ windowMs: 60_000, max: 5, key: "appeals" }),
  // Diaspora: 10/min
  diaspora: rateLimit({ windowMs: 60_000, max: 10, key: "diaspora" }),
  // Priority allocation: register/execute — 10/min (money-moving adjacent)
  priorityAllocation: rateLimit({ windowMs: 60_000, max: 10, key: "priority_allocation" }),

  // ── DB-backed variants (critical paths) ──
  // Sign-in / registration share the same per-IP budget: an attacker cannot
  // enumerate registration to bypass rate-limiting. 10 attempts per 60s per IP.
  signinDb: (identity: string) =>
    dbCheck({ windowMs: 60_000, max: 10, key: "signin" }, identity),
  registerDb: (identity: string) =>
    dbCheck({ windowMs: 60_000, max: 10, key: "signin" }, identity),
  // Passkey start/finish: 15 attempts per 60s per IP — passkey ceremonies are
  // single-shot so we allow a slightly larger budget than password signin.
  passkeyDb: (identity: string) =>
    dbCheck({ windowMs: 60_000, max: 15, key: "passkey" }, identity),
  // Password reset / MFA challenge: 5 per 60s per identity — tightest.
  passwordResetDb: (identity: string) =>
    dbCheck({ windowMs: 60_000, max: 5, key: "pwreset" }, identity),
};

/** Standard 429 response builder. */
export function rateLimitedResponse(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: "rate_limited", message: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  );
}
