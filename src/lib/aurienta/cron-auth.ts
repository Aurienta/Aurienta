// Shared cron-token authentication helper.
//
// SECURITY FIX (PLATFORM-FULL-AUDIT-AND-REMEDIATION-001 / Finding P0-1, P1-2):
// The previous pattern `if (token !== process.env.CRON_SECRET)` evaluated to
// `false` when BOTH sides were `undefined` (env var unset AND no Authorization
// header), silently bypassing auth. The previous `dev-cron-secret` fallback
// was also live-exploitable via `?token=dev-cron-secret`.
//
// This helper enforces: (1) CRON_SECRET MUST be set in the environment,
// (2) the request MUST supply a matching token. No silent fallbacks.

import { NextRequest, NextResponse } from "next/server";

export const CRON_TOKEN_HEADER = "authorization";
export const CRON_TOKEN_QUERY = "token";

/**
 * Reads the cron token from either `?token=` query param or
 * `Authorization: Bearer <token>` header (query wins for manual testing).
 */
export function readCronToken(req: NextRequest): string {
  const url = new URL(req.url);
  const queryToken = url.searchParams.get(CRON_TOKEN_QUERY) ?? "";
  if (queryToken) return queryToken;

  const authHeader = req.headers.get(CRON_TOKEN_HEADER) ?? "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return "";
}

/**
 * Enforces that the request carries a valid cron token.
 * Returns `null` if authorized (caller proceeds), or a 401 NextResponse if not.
 *
 * Rejects when:
 *   - CRON_SECRET env var is missing/empty (configuration error)
 *   - No token supplied on the request
 *   - Token does not match (constant-time-ish comparison via length+char check)
 */
export function requireCronToken(req: NextRequest): NextResponse | null {
  const expected = process.env.CRON_SECRET ?? "";
  if (!expected) {
    // Do NOT fall back to any hardcoded value. Fail closed.
    return NextResponse.json(
      {
        error:
          "Server misconfiguration: CRON_SECRET is not set. Refusing to authenticate cron request.",
      },
      { status: 503 }
    );
  }

  const supplied = readCronToken(req);
  if (!supplied || supplied.length !== expected.length) {
    return NextResponse.json(
      { error: "Unauthorized — invalid or missing cron token" },
      { status: 401 }
    );
  }

  // Constant-time comparison to avoid timing-based token discovery.
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= supplied.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) {
    return NextResponse.json(
      { error: "Unauthorized — invalid or missing cron token" },
      { status: 401 }
    );
  }

  return null; // authorized
}

/**
 * Same shape but for FRA regulator token (separate secret, same hardening).
 */
export function requireFraToken(req: NextRequest): NextResponse | null {
  const expected = process.env.FRA_ACCESS_TOKEN ?? "";
  if (!expected) {
    return NextResponse.json(
      {
        error:
          "Server misconfiguration: FRA_ACCESS_TOKEN is not set. Refusing to authenticate FRA request.",
      },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const supplied = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  if (!supplied || supplied.length !== expected.length) {
    return NextResponse.json(
      { error: "Unauthorized — FRA access required" },
      { status: 401 }
    );
  }

  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= supplied.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) {
    return NextResponse.json(
      { error: "Unauthorized — FRA access required" },
      { status: 401 }
    );
  }

  return null;
}
