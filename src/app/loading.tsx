"use client";

/**
 * Root loading skeleton — gold AurientaMark with rotating conic glow + brand
 * wordmark. Shown by Next.js App Router while a route segment streams in.
 *
 * ROOT-CAUSE FIX: Added a client-side timeout (15s). If the route takes
 * longer than 15s to load, shows a "Taking longer than expected..." message
 * with a retry button. This prevents the user from being stuck on a
 * loading screen forever if the server is slow or hangs.
 */

import { useEffect, useState } from "react";
import { AurientaMark } from "@/components/aurienta-logo";

export default function Loading() {
  const [slow, setSlow] = useState(false);
  const [verySlow, setVerySlow] = useState(false);

  useEffect(() => {
    // After 8s, show "taking longer than expected"
    const t1 = setTimeout(() => setSlow(true), 8000);
    // After 15s, show retry button
    const t2 = setTimeout(() => setVerySlow(true), 15000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#EEF2FF] to-[#F8FAFC] opacity-50" />

      <div className="relative flex flex-col items-center">
        <div className="relative">
          <div
            className="absolute inset-0 -m-6 animate-spin-slow rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, rgba(79,70,229,0.0) 60%, rgba(79,70,229,0.45) 85%, transparent 100%)",
              filter: "blur(8px)",
            }}
            aria-hidden
          />
          <AurientaMark className="relative h-14 w-14" withGlow />
        </div>

        <div className="mt-6 flex items-center gap-2.5">
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold/60" />
          <span className="font-mono text-xs uppercase tracking-[0.28em] text-gold-light/80">
            AURIENTA
          </span>
          <span className="h-px w-6 bg-gradient-to-l from-transparent to-gold/60" />
        </div>

        <p className="mt-3 font-serif text-base italic text-muted-foreground">
          {verySlow
            ? "This is taking longer than usual."
            : slow
              ? "Still consulting the constitutional ledger…"
              : "Consulting the constitutional ledger…"}
        </p>

        <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-foreground/[0.06]">
          <div
            className="h-full w-1/3 animate-shimmer-line rounded-full bg-gold-gradient"
            aria-hidden
          />
        </div>

        <p className="mt-4 font-sans text-xs text-muted-foreground/80">
          Zero Custody · AI Enforced · CRE online
        </p>

        {/* ROOT-CAUSE FIX: retry button after 15s */}
        {verySlow && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="max-w-xs text-center font-sans text-xs text-muted-foreground">
              The server may be slow or unresponsive. You can retry the
              navigation.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 font-sans text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
              >
                Retry now
              </button>
              <a
                href="/signin"
                className="rounded-lg border border-foreground/15 px-4 py-2 font-sans text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5"
              >
                Back to sign in
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
