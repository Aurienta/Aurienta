import { AurientaMark } from "@/components/aurienta-logo";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Escrow (Law Firm Client Accounts) loading skeleton — shaped like the real
 * Escrow page: zero-custody proof banner, a 3-block funds-flow diagram
 * placeholder, per-enterprise account cards, and a transactions table.
 */
export default function EscrowLoading() {
  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-8">
      {/* AURIENTA mark spinner */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="relative">
          <div
            className="absolute inset-0 -m-4 animate-spin-slow rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, rgba(212,175,55,0.0) 60%, rgba(212,175,55,0.4) 85%, transparent 100%)",
              filter: "blur(6px)",
            }}
            aria-hidden
          />
          <AurientaMark className="relative h-9 w-9" withGlow />
        </div>
        <p className="font-serif text-sm italic text-muted-foreground">
          Verifying Law Firm Client Accounts…
        </p>
      </div>

      {/* Page header placeholder */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-2.5 w-48 rounded-full bg-gold/15" />
        <Skeleton className="h-7 w-96 max-w-full rounded-md bg-foreground/[0.08]" />
        <Skeleton className="h-2.5 w-full max-w-3xl rounded-full bg-foreground/[0.06]" />
      </div>

      {/* Zero custody proof banner */}
      <div className="mb-6 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.04] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl bg-emerald-400/15" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-56 rounded-md bg-foreground/10" />
            <Skeleton className="h-2.5 w-full rounded-full bg-foreground/[0.06]" />
            <Skeleton className="h-2.5 w-3/4 rounded-full bg-foreground/[0.06]" />
          </div>
          <Skeleton className="h-2.5 w-24 rounded-full bg-foreground/10" />
        </div>
      </div>

      {/* Funds-flow diagram — 3 connected blocks */}
      <div className="mb-6 rounded-2xl border border-gold/12 glass p-5 sm:p-6">
        <Skeleton className="mb-5 h-4 w-64 rounded-md bg-foreground/10" />
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          {/* Block 1 — Capital Partners */}
          <div className="flex-1 rounded-xl border border-gold/12 bg-background/40 p-4">
            <Skeleton className="mb-2 h-7 w-7 rounded-md bg-gold/15" />
            <Skeleton className="h-3 w-28 rounded-full bg-foreground/[0.08]" />
            <Skeleton className="mt-1 h-2 w-20 rounded-full bg-foreground/[0.06]" />
          </div>

          {/* Connector */}
          <div className="flex items-center justify-center" aria-hidden>
            <div className="relative h-8 w-full sm:h-px sm:w-12">
              <Skeleton className="absolute inset-0 rounded-full bg-gold/20" />
            </div>
          </div>

          {/* Block 2 — AURIENTA (zero custody) */}
          <div className="flex-1 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
            <Skeleton className="mb-2 h-7 w-7 rounded-md bg-emerald-400/15" />
            <Skeleton className="h-3 w-28 rounded-full bg-foreground/[0.08]" />
            <Skeleton className="mt-1 h-2 w-20 rounded-full bg-foreground/[0.06]" />
            <Skeleton className="mt-2 h-2.5 w-16 rounded-full bg-emerald-400/30" />
          </div>

          {/* Connector */}
          <div className="flex items-center justify-center" aria-hidden>
            <div className="relative h-8 w-full sm:h-px sm:w-12">
              <Skeleton className="absolute inset-0 rounded-full bg-gold/20" />
            </div>
          </div>

          {/* Block 3 — Law Firm Client Account */}
          <div className="flex-1 rounded-xl border border-gold/15 glass-gold p-4">
            <Skeleton className="mb-2 h-7 w-7 rounded-md bg-gold/15" />
            <Skeleton className="h-3 w-28 rounded-full bg-foreground/[0.08]" />
            <Skeleton className="mt-1 h-2 w-20 rounded-full bg-foreground/[0.06]" />
          </div>
        </div>
      </div>

      {/* Per-enterprise account cards (3) */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-gold/15 glass p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded bg-gold/15" />
                <Skeleton className="h-3 w-28 rounded-md bg-foreground/[0.08]" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full bg-emerald-400/15" />
            </div>
            <Skeleton className="mb-1 h-7 w-32 rounded-md bg-gold/15" />
            <Skeleton className="h-2.5 w-44 rounded-full bg-foreground/[0.06]" />
            <div className="mt-3 space-y-2">
              {[0, 1, 2].map((j) => (
                <div
                  key={j}
                  className="flex items-center justify-between"
                >
                  <Skeleton className="h-2.5 w-20 rounded-full bg-foreground/10" />
                  <Skeleton className="h-2.5 w-24 rounded-full bg-foreground/[0.08]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Transactions table skeleton */}
      <div className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-40 rounded-md bg-foreground/10" />
          <Skeleton className="h-2.5 w-20 rounded-full bg-foreground/[0.06]" />
        </div>
        <div className="space-y-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-gold/5 py-3 last:border-0"
            >
              <Skeleton className="h-6 w-6 rounded-md bg-gold/15" />
              <Skeleton className="h-3 w-40 rounded-full bg-foreground/[0.08]" />
              <Skeleton className="ml-auto h-2.5 w-20 rounded-full bg-foreground/10" />
              <Skeleton className="h-2.5 w-16 rounded-full bg-foreground/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
