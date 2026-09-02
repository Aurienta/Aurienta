import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: false },
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
  // CRITICAL: Prevent trailing-slash redirect loops behind the Caddy gateway.
  // Without this, Next.js creates: /dashboard → /dashboard/ → /dashboard → ... (infinite loop)
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  // Security headers (OWASP recommended)
  async headers() {
    // Drop 'unsafe-eval' from script-src in production — it's only needed in
    // Next.js dev mode. Keeping 'unsafe-inline' for now (removing it requires
    // per-request CSP nonces, a follow-up P2 task).
    const isProd = process.env.NODE_ENV === "production";
    const scriptSrc = isProd
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
    return [
      {
        source: "/sw.js",
        headers: [
          // The service worker file MUST never be cached — browsers need to
          // fetch the latest version on every navigation so they pick up
          // cache-version bumps (e.g. aurienta-v1 → aurienta-v2-csrf-fix)
          // and purge stale caches. Without this, a browser may run an old
          // SW indefinitely, serving stale client JS that lacks fixes.
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'self'`,
          },
          // Prevent Safari from caching 301 redirects (which caused the redirect loop)
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },
  allowedDevOrigins: ["https://preview-chat-a441ad48-0757-4444-a5f1-f6618b1b9116.space-z.ai"],
};

export default nextConfig;
