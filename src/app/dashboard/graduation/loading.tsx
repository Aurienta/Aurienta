import { AurientaMark } from "@/components/aurienta-logo";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Graduation loading skeleton — shaped like the real Graduation page:
 * a readiness progress ring placeholder (circle) + a checklist of 7
 * skeleton rows + a 2-col card row below.
 */
export default function GraduationLoading() {
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
          Measuring graduation readiness…
        </p>
      </div>

      {/* Page header placeholder */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-2.5 w-40 rounded-full bg-gold/15" />
        <Skeleton className="h-7 w-96 max-w-full rounded-md bg-foreground/[0.08]" />
        <Skeleton className="h-2.5 w-full max-w-3xl rounded-full bg-foreground/[0.06]" />
      </div>

      {/* Readiness hero: progress ring + checklist */}
      <div className="mb-6 grid gap-6 rounded-2xl border border-gold/15 glass-gold p-5 sm:p-7 lg:grid-cols-[280px_1fr]">
        {/* Progress ring placeholder */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative">
            <Skeleton className="h-40 w-40 rounded-full bg-foreground/[0.06]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Skeleton className="h-8 w-20 rounded-md bg-gold/20" />
              <Skeleton className="mt-1.5 h-2 w-14 rounded-full bg-foreground/10" />
            </div>
          </div>
          <Skeleton className="h-3 w-24 rounded-full bg-foreground/10" />
        </div>

        {/* Readiness checklist (7 rows) */}
        <div className="space-y-2.5">
          <Skeleton className="mb-3 h-4 w-44 rounded-md bg-foreground/10" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-gold/8 bg-background/40 px-3.5 py-2.5"
            >
              <Skeleton className="h-5 w-5 rounded-full bg-gold/15" />
              <Skeleton className="h-2.5 flex-1 rounded-full bg-foreground/[0.07]" />
              <Skeleton className="h-4 w-10 rounded-full bg-foreground/10" />
            </div>
          ))}
        </div>
      </div>

      {/* CTA banner placeholder */}
      <div className="mb-6 rounded-2xl border border-gold/20 glass-gold p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-48 rounded-full bg-gold/20" />
            <Skeleton className="h-5 w-72 max-w-full rounded-md bg-foreground/[0.08]" />
            <Skeleton className="h-2.5 w-96 max-w-full rounded-full bg-foreground/[0.06]" />
          </div>
          <Skeleton className="h-10 w-full max-w-xs rounded-full bg-gold/20" />
        </div>
      </div>

      {/* 2-col card row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-gold/12 glass p-5 sm:p-6"
          >
            <Skeleton className="mb-4 h-4 w-40 rounded-md bg-foreground/10" />
            <div className="space-y-3">
              {[0, 1, 2].map((j) => (
                <Skeleton
                  key={j}
                  className="h-12 w-full rounded-xl bg-foreground/[0.06]"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
