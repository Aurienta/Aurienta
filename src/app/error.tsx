"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AurientaMark } from "@/components/aurienta-logo";
import { logger } from "@/lib/aurienta/logger";

/**
 * Route-level error boundary — rendered when a page or layout throws.
 * Branded gold-on-near-black UI; offers "Try again" (reload) + back-to-dashboard.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("route error boundary", {
      msg: error.message,
      digest: error.digest,
      stack: error.stack?.slice(0, 1200),
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 aurienta-radial opacity-60" />
      <div className="relative flex flex-col items-center">
        <AurientaMark className="h-16 w-16" withGlow />

        <div className="mt-6 flex items-center gap-2">
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold/60" />
          <span className="font-sans text-xs uppercase tracking-[0.28em] text-gold-light/80">
            Constitutional Boundary
          </span>
          <span className="h-px w-6 bg-gradient-to-l from-transparent to-gold/60" />
        </div>

        <h1 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
          The CRE halted this request
        </h1>

        <p className="mt-3 max-w-md font-sans text-sm leading-relaxed text-muted-foreground">
          An unexpected error was caught by the route-level boundary. The
          ledger remains immutable, no funds were touched, and the
          constitutional rules continue to be enforced regardless.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-xs text-muted-foreground/80">
            digest: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 font-sans text-sm font-medium text-[#0a0a0b] transition-transform hover:scale-[1.02]"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-gold/25 px-6 py-2.5 font-sans text-sm text-foreground transition-colors hover:bg-gold/5"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
