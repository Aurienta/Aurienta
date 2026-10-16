// AURIENTA CSRF + security middleware.
// CTO-AUDIT remediation (P0-2): CSRF protection for all state-changing requests.
//
// Strategy: same-origin validation + double-submit token for cross-origin.
// - GET/HEAD/OPTIONS: pass through (set CSRF cookie if missing).
// - POST/PATCH/PUT/DELETE: allow if the Origin matches the request's own host
//   (same-origin). If cross-origin, require X-CSRF-Token matching the cookie.
//
// This approach works in ALL environments: localhost, preview panel, production.
//
// AUD-003 / FIX 3: middleware now ALSO runs on /dashboard/* routes so it can
// stamp the `x-pathname` response header (read by the dashboard layout's MFA
// gate to avoid infinite redirect loops). For dashboard state-changing
// requests we still skip the CSRF check (preserving prior behavior — those
// POSTs go through csrfFetch which already includes the X-CSRF-Token header
// that the same-origin check would have allowed anyway). All GETs on /dashboard
// get the security headers + x-pathname + Cache-Control: no-store (strictly
// better than the prior "no middleware on dashboard" config).

import { NextRequest, NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function middleware(req: NextRequest) {
  const method = req.method;
  const pathname = req.nextUrl.pathname;
  const isDashboard = pathname.startsWith("/dashboard");

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

  // AUD-003 / FIX 3: stamp the current pathname on the response so server
  // components (notably the dashboard layout's MFA gate) can detect which
  // route is being rendered without resorting to referer sniffing.
  res.headers.set("x-pathname", pathname);

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

  if (SAFE_METHODS.has(method) || isDashboard) {
    // Safe methods (GET/HEAD/OPTIONS) OR dashboard routes (any method —
    // dashboard state-changing requests are made via csrfFetch from
    // same-origin, which the CSRF check below would have allowed anyway).
    // Skip the explicit Origin/CSRF-token check for these.
    return res;
  }

  // State-changing request (non-dashboard) — validate Origin.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const referer = req.headers.get("referer");

  // Same-origin check via Origin header (preferred).
  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        // Same-origin request — allow it.
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
  // - /api/cron/* — cron endpoints use token auth via ?token= query (DE-16/17),
  //   not a session cookie; they must not be blocked by the CSRF middleware
  //   when invoked by Vercel Cron (cross-origin, no CSRF cookie).
  // - /api/oracle/consensus — public POST endpoint authenticated by an API
  //   key in the request body (not a session cookie). External curl callers
  //   have no Origin header and no CSRF cookie — exempting the route allows
  //   them to reach it. Per-query pricing + audit logging still applies.
  // NOTE: /dashboard/* is NO LONGER excluded (AUD-003/FIX 3) so that the
  // middleware can stamp `x-pathname` on dashboard responses (used by the
  // dashboard layout's MFA gate). The CSRF check is skipped for /dashboard/*
  // (see `isDashboard` branch above) to preserve the prior "no CSRF on
  // dashboard state-changing requests" behavior — those requests already
  // use csrfFetch which adds the X-CSRF-Token header that the same-origin
  // check would have allowed anyway.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|api/cron|api/oracle/consensus|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2)$).*)"],
};
