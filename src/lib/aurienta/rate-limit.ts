// AURIENTA rate limiting — in-memory sliding-window limiter.
// Production: swap the Map for Redis to support multiple replicas.
//
// Usage:
//   const rl = rateLimit({ windowMs: 60_000, max: 30, key: "ai" });
//   const hit = rl(userId);
//   if (!hit.allowed) return 429;

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

// ── Pre-configured limiters ──
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
};

import { NextResponse } from "next/server";

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
