import { AurientaMark } from "@/components/aurienta-logo";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Portfolio loading skeleton — shaped like the real Constitutional Holdings
 * page: header row, summary stat cards, holdings table (5 rows), and a
 * right-column chart placeholder.
 */
export default function PortfolioLoading() {
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
          Loading your constitutional holdings…
        </p>
      </div>

      {/* Header row */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-48 rounded-full bg-gold/15" />
          <Skeleton className="h-8 w-80 max-w-full rounded-md bg-foreground/[0.08]" />
          <Skeleton className="h-2.5 w-96 max-w-full rounded-full bg-foreground/[0.06]" />
        </div>
        <Skeleton className="h-9 w-56 rounded-full bg-gold/15" />
      </div>

      {/* Summary stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gold/12 glass-gold p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-md bg-foreground/10" />
              <Skeleton className="h-2.5 w-24 rounded-full bg-foreground/10" />
            </div>
            <Skeleton className="mb-1.5 h-6 w-24 rounded-md bg-foreground/[0.08]" />
            <Skeleton className="h-2.5 w-16 rounded-full bg-foreground/[0.06]" />
          </div>
        ))}
      </div>

      {/* Main grid: holdings table + chart column */}
      <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        {/* Holdings table skeleton */}
        <div className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-4 w-36 rounded-md bg-foreground/10" />
            <Skeleton className="h-2.5 w-16 rounded-full bg-foreground/[0.06]" />
          </div>
          <div className="space-y-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-gold/5 py-3 last:border-0"
              >
                <Skeleton className="h-8 w-40 rounded-md bg-foreground/[0.07]" />
                <Skeleton className="ml-auto h-2.5 w-14 rounded-full bg-foreground/10" />
                <Skeleton className="h-2.5 w-16 rounded-full bg-foreground/10" />
                <Skeleton className="h-2.5 w-20 rounded-full bg-gold/15" />
                <Skeleton className="h-2.5 w-16 rounded-full bg-foreground/10" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column: chart + dividends */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-gold/12 glass p-5">
            <Skeleton className="mb-4 h-4 w-32 rounded-md bg-foreground/10" />
            {/* Allocation donut placeholder */}
            <div className="flex items-center justify-center py-2">
              <Skeleton className="h-32 w-32 rounded-full bg-foreground/[0.06]" />
            </div>
          </div>
          <div className="rounded-2xl border border-gold/12 glass p-5">
            <Skeleton className="mb-4 h-4 w-32 rounded-md bg-foreground/10" />
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => (
                <Skeleton
                  key={i}
                  className="h-12 w-full rounded-xl bg-foreground/[0.06]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
