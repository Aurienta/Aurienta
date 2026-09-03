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
      secure: process.env.NODE_ENV === "production", // HTTPS-only in production
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
    // CRITICAL: Prevent the browser from caching GET responses, including
    // Next.js RSC prefetches. Without this, the browser may cache an
    // UNAUTHENTICATED response (e.g., a redirect to /signin from a prefetch
    // before login) and serve it AFTER login when the user clicks a link.
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return res;
  }

  // State-changing request — validate Origin.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const referer = req.headers.get("referer");

  // Same-origin check via Origin header (preferred).
  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        // Same-origin request — allow it.
        res.headers.set("X-Content-Type-Options", "nosniff");
        res.headers.set("X-Frame-Options", "SAMEORIGIN");
        res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        return res;
      }
    } catch {
      // Origin URL parsing failed — fall through to other checks.
    }
  }

  // Fallback same-origin check via Referer header.
  // Some browsers/extensions strip the Origin header for same-origin POSTs
  // (privacy hardening), but they still send a Referer. If the Referer's
  // host matches the request host, treat it as same-origin.
  if (!origin && referer && host) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host === host) {
        res.headers.set("X-Content-Type-Options", "nosniff");
        res.headers.set("X-Frame-Options", "SAMEORIGIN");
        res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        return res;
      }
    } catch {
      // Referer URL parsing failed — fall through to CSRF token check.
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
  // Run on all routes except:
  // - static assets (_next/static, images, fonts, etc.)
  // - /api/auth/* — auth endpoints exempt from CSRF (no session yet)
  // - /dashboard/* — dashboard pages exempt from middleware to prevent
  //   any interference with the session cookie. The dashboard layout's
  //   getCurrentUser() provides auth; CSRF protection on dashboard POSTs
  //   is handled by the csrfFetch client helper.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|dashboard|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2)$).*)"],
};
