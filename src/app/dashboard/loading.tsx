import { AurientaMark } from "@/components/aurienta-logo";

/**
 * Dashboard loading skeleton — smaller variant for in-shell route transitions.
 * Branded gold mark + 3 skeleton cards aligned with the dashboard grid.
 */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-5 py-12">
      <div className="relative">
        <div
          className="absolute inset-0 -m-5 animate-spin-slow rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, rgba(212,175,55,0.0) 60%, rgba(212,175,55,0.4) 85%, transparent 100%)",
            filter: "blur(6px)",
          }}
          aria-hidden
        />
        <AurientaMark className="relative h-10 w-10" withGlow />
      </div>

      <p className="font-serif text-sm italic text-muted-foreground">
        Consulting the constitutional ledger…
      </p>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-gold/12 glass-gold p-4"
          >
            <div className="mb-3 h-3 w-1/2 rounded-full bg-foreground/10" />
            <div className="mb-2 h-5 w-3/4 rounded-full bg-foreground/[0.07]" />
            <div className="h-3 w-2/3 rounded-full bg-foreground/[0.05]" />
          </div>
        ))}
      </div>

      <p className="font-mono text-xs text-muted-foreground/80">
        CRE online · sovereign mode
      </p>
    </div>
  );
}
