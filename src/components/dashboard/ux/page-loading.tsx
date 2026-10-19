import { AurientaMark } from "@/components/aurienta-logo";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * UX-AUDIT-3 — Shared loading skeleton for dashboard pages.
 *
 * Branded AURIENTA mark spinner with a 4-card skeleton grid + content row,
 * matching the institutional theme (indigo / purple, no gold/amber).
 *
 * Used by every dashboard page's `loading.tsx` so first-paint and route
 * transitions feel intentional rather than blank.
 *
 * Accessibility:
 *  - The spinner wrapper carries `role="status"` + `aria-live="polite"` so
 *    screen-readers announce the loading state.
 *  - Decorative skeleton blocks are `aria-hidden`.
 */
export function PageLoading({
  label = "Loading",
  hint,
}: {
  label?: string;
  hint?: string;
}) {
  return (
    <div
      className="mx-auto max-w-7xl px-5 py-8 sm:px-8"
      role="status"
      aria-live="polite"
      aria-label={`${label} — loading`}
    >
      {/* Branded spinner */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="relative">
          <div
            className="absolute inset-0 -m-4 animate-spin-slow rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, rgba(79,70,229,0.0) 60%, rgba(79,70,229,0.4) 85%, transparent 100%)",
              filter: "blur(6px)",
            }}
            aria-hidden
          />
          <AurientaMark className="relative h-9 w-9" withGlow />
        </div>
        <p className="font-serif text-sm italic text-muted-foreground">
          {label}…
        </p>
        {hint ? (
          <p className="font-mono text-[11px] text-muted-foreground/80">{hint}</p>
        ) : null}
      </div>

      {/* Page header placeholder */}
      <div className="mb-6 space-y-2" aria-hidden>
        <Skeleton className="h-2.5 w-40 rounded-full bg-gold/15" />
        <Skeleton className="h-7 w-96 max-w-full rounded-md bg-foreground/[0.08]" />
        <Skeleton className="h-2.5 w-full max-w-3xl rounded-full bg-foreground/[0.06]" />
      </div>

      {/* KPI strip */}
      <div
        className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-hidden
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-gold/12 glass p-5"
          >
            <Skeleton className="mb-3 h-3 w-1/2 rounded-full bg-foreground/10" />
            <Skeleton className="mb-2 h-5 w-3/4 rounded-full bg-foreground/[0.08]" />
            <Skeleton className="h-3 w-2/3 rounded-full bg-foreground/[0.06]" />
          </div>
        ))}
      </div>

      {/* Body content placeholder (table or cards) */}
      <div className="rounded-2xl border border-gold/12 glass p-5 sm:p-6" aria-hidden>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-40 rounded-md bg-foreground/10" />
          <Skeleton className="h-2.5 w-20 rounded-full bg-foreground/[0.06]" />
        </div>
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-gold/5 py-3 last:border-0"
            >
              <Skeleton className="h-6 w-6 rounded-md bg-gold/15" />
              <Skeleton className="h-3 w-40 rounded-full bg-foreground/[0.08]" />
              <Skeleton className="ml-auto h-2.5 w-24 rounded-full bg-foreground/10" />
              <Skeleton className="h-2.5 w-16 rounded-full bg-foreground/10" />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center font-mono text-[11px] text-muted-foreground/70">
        CRE online · sovereign mode
      </p>
    </div>
  );
}
