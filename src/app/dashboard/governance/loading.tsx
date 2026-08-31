import { AurientaMark } from "@/components/aurienta-logo";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Governance loading skeleton — shaped like the real Governance page:
 * a 2-column grid of proposal cards (3 cards) + a vote breakdown bar +
 * a sticky constitutional-council rail.
 */
export default function GovernanceLoading() {
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
          Convening the constitutional council…
        </p>
      </div>

      {/* 2-col grid: proposals (left) + council rail (right) */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] xl:gap-8">
        {/* Proposal cards */}
        <section className="min-w-0 space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-gold/12 glass p-5 sm:p-6"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-7 w-7 rounded-md bg-gold/15" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-44 rounded-md bg-foreground/[0.08]" />
                    <Skeleton className="h-2 w-28 rounded-full bg-foreground/[0.06]" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-full bg-gold/15" />
              </div>
              <Skeleton className="mb-2 h-3 w-3/4 rounded-full bg-foreground/[0.07]" />
              <Skeleton className="mb-4 h-3 w-1/2 rounded-full bg-foreground/[0.06]" />

              {/* Vote breakdown bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-2.5 w-20 rounded-full bg-foreground/10" />
                  <Skeleton className="h-2.5 w-16 rounded-full bg-foreground/[0.06]" />
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-foreground/[0.05]">
                  <Skeleton className="h-full w-[42%] rounded-full bg-emerald-400/30" />
                  <Skeleton className="ml-px h-full w-[28%] rounded-full bg-red-400/30" />
                  <Skeleton className="ml-px h-full w-[18%] rounded-full bg-foreground/20" />
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Skeleton className="h-2 w-12 rounded-full bg-foreground/10" />
                  <Skeleton className="h-2 w-12 rounded-full bg-foreground/10" />
                  <Skeleton className="h-2 w-12 rounded-full bg-foreground/10" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gold/8 pt-3">
                <Skeleton className="h-2.5 w-32 rounded-full bg-foreground/[0.06]" />
                <Skeleton className="h-7 w-24 rounded-full bg-gold/15" />
              </div>
            </div>
          ))}
        </section>

        {/* Constitutional council rail */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-gold/15 glass-gold p-5">
            <Skeleton className="mb-4 h-4 w-40 rounded-md bg-foreground/10" />
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-gold/8 bg-background/40 p-3"
                >
                  <Skeleton className="h-9 w-9 rounded-full bg-gold/15" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-2.5 w-24 rounded-full bg-foreground/[0.08]" />
                    <Skeleton className="h-2 w-16 rounded-full bg-foreground/[0.06]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
