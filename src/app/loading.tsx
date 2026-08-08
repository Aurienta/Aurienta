import { AurientaMark } from "@/components/aurienta-logo";

/**
 * Root loading skeleton — gold AurientaMark with rotating conic glow + brand
 * wordmark.  Shown by Next.js App Router while a route segment streams in.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-16">
      <div className="pointer-events-none absolute inset-0 aurienta-radial opacity-50" />

      <div className="relative flex flex-col items-center">
        <div className="relative">
          <div
            className="absolute inset-0 -m-6 animate-spin-slow rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, rgba(212,175,55,0.0) 60%, rgba(212,175,55,0.45) 85%, transparent 100%)",
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
          Consulting the constitutional ledger…
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
      </div>
    </div>
  );
}
