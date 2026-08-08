import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: false },
  reactStrictMode: true,
  // CRITICAL: Prevent trailing-slash redirect loops behind the Caddy gateway.
  // Without this, Next.js creates: /dashboard → /dashboard/ → /dashboard → ... (infinite loop)
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  // Security headers (OWASP recommended)
  async headers() {
    return [
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'self'",
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
