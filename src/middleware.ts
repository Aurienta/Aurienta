// AURIENTA CSRF + security middleware.
// CTO-AUDIT remediation (P0-2): CSRF protection for all state-changing requests.
//
// Strategy: same-origin validation + double-submit token for cross-origin.
// - GET/HEAD/OPTIONS: pass through (set CSRF cookie if missing).
// - POST/PATCH/PUT/DELETE: allow if the Origin matches the request's own host
//   (same-origin). If cross-origin, require X-CSRF-Token matching the cookie.
//
// This approach works in ALL environments: localhost, preview panel, production.

import { NextRequest, NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function middleware(req: NextRequest) {
  const method = req.method;

  // Always set a CSRF cookie on responses (double-submit pattern).
  const res = NextResponse.next();
  if (!req.cookies.get("aurienta_csrf")) {
    const token = crypto.randomUUID() + crypto.randomUUID();
    res.cookies.set("aurienta_csrf", token, {
      httpOnly: false, // must be readable by client JS to echo back
      sameSite: "lax",
      secure: false, // allow HTTP in dev/preview; production uses HTTPS via Caddy
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  if (SAFE_METHODS.has(method)) {
    // Security headers on all responses
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return res;
  }

  // State-changing request — validate Origin.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (origin && host) {
    // Same-origin check: extract the host from the Origin header and compare.
    // Origin is like "https://example.com:3000" or "http://localhost:3000"
    // Host is like "example.com:3000" or "localhost:3000"
    try {
      const originUrl = new URL(origin);
      const originHost = originUrl.host; // includes port
      if (originHost === host) {
        // Same-origin request — allow it.
        res.headers.set("X-Content-Type-Options", "nosniff");
        res.headers.set("X-Frame-Options", "SAMEORIGIN");
        res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        return res;
      }
    } catch {
      // Origin URL parsing failed — fall through to CSRF token check
    }
  }

  // If no Origin header, or cross-origin — require double-submit CSRF token.
  const cookieToken = req.cookies.get("aurienta_csrf")?.value;
  const headerToken = req.headers.get("x-csrf-token");
  if (cookieToken && headerToken && cookieToken === headerToken) {
    // Valid CSRF token — allow it.
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return res;
  }

  // No valid same-origin or CSRF token — reject.
  return NextResponse.json(
    { error: "csrf_validation_failed", message: "Request must be same-origin or include a valid X-CSRF-Token header" },
    { status: 403 }
  );
}

export const config = {
  // Run on all routes except static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2)$).*)"],
};
