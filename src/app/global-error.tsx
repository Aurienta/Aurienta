"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Global error fallback — replaces <html><body> entirely on a root-level
 * render failure.  Cannot rely on the layout, fonts, or shadcn theme tokens,
 * so we inline the brand gold palette and an SVG AurientaMark.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
     
    console.error("[global-error]", error.message, error.digest);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08080a",
          color: "#f3eedd",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 520 }}>
          {/* Inline AurientaMark — no external assets, no React useId. */}
          <svg
            viewBox="0 0 120 130"
            width="72"
            height="78"
            aria-label="AURIENTA emblem"
            style={{
              filter: "drop-shadow(0 0 18px rgba(212,175,55,0.45))",
              display: "block",
              margin: "0 auto",
            }}
          >
            <defs>
              <linearGradient id="gm" x1="60" y1="6" x2="60" y2="124" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#f7e9a6" />
                <stop offset="0.55" stopColor="#d4af37" />
                <stop offset="1" stopColor="#8a6d1f" />
              </linearGradient>
            </defs>
            <path d="M60 12 L20 118 L30.5 118 L60 33 Z" fill="url(#gm)" />
            <path d="M60 12 L100 118 L89.5 118 L60 33 Z" fill="url(#gm)" />
            <path
              d="M34.2 73 Q60 96 85.8 73"
              stroke="#d4af37"
              strokeWidth="6.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M60 60.5 L62.35 67.75 L70 67.75 L63.82 72.25 L66.18 79.5 L60 75 L53.82 79.5 L56.18 72.25 L50 67.75 L57.65 67.75 Z"
              fill="url(#gm)"
            />
          </svg>

          <div
            style={{
              marginTop: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <span style={{ width: 24, height: 1, background: "linear-gradient(to right, transparent, rgba(212,175,55,0.6))" }} />
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(244,214,118,0.85)",
              }}
            >
              Constitutional Boundary
            </span>
            <span style={{ width: 24, height: 1, background: "linear-gradient(to left, transparent, rgba(212,175,55,0.6))" }} />
          </div>

          <h1
            style={{
              margin: "16px 0 0",
              fontSize: 28,
              fontWeight: 600,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
            }}
          >
            The application reached a fatal boundary
          </h1>

          <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: "#a89f86" }}>
            A root-level render error was caught. The ledger remains immutable,
            no partner funds were touched, and the Constitutional Runtime Engine
            continues to enforce every rule regardless of any UI failure.
          </p>

          {error.digest && (
            <p
              style={{
                marginTop: 16,
                fontSize: 10,
                fontFamily: "ui-monospace, monospace",
                color: "rgba(168,159,134,0.6)",
              }}
            >
              digest: {error.digest}
            </p>
          )}

          <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "10px 22px",
                borderRadius: 999,
                border: "none",
                background: "linear-gradient(135deg, #f4d676, #d4af37 45%, #b8860b)",
                color: "#0a0a0b",
                fontWeight: 500,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: "10px 22px",
                borderRadius: 999,
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#f3eedd",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              AURIENTA home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
