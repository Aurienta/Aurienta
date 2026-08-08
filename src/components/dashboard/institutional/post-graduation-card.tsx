import * as React from "react";
import { ArrowRight, ServerCog, Building, ShieldCheck, Database } from "lucide-react";

type Change = {
  icon: React.ElementType;
  label: string;
  before: string;
  after: string;
  note: string;
};

const CHANGES: Change[] = [
  {
    icon: Building,
    label: "Platform fees",
    before: "5% raise + 2.5% consulting",
    after: "0%",
    note: "All platform fees cease on passage of the graduation vote.",
  },
  {
    icon: ShieldCheck,
    label: "AURIENTA board seat",
    before: "1 observer seat",
    after: "Resigned",
    note: "Platform governance withdraws; enterprise assumes full authority.",
  },
  {
    icon: ServerCog,
    label: "CRE enforcement",
    before: "Full enforcement",
    after: "Self-host option",
    note: "Self-hosted CRE in 4–8 hours via Sovereign Export Package.",
  },
  {
    icon: Database,
    label: "Data hosting",
    before: "AURIENTA-controlled",
    after: "Enterprise-controlled",
    note: "All ledgers, KYC, and analytics migrate to enterprise infrastructure.",
  },
];

export function PostGraduationCard() {
  return (
    <section
      aria-label="Post-graduation changes"
      className="rounded-2xl border border-gold/12 glass p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ArrowRight className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">What changes on graduation</h2>
        </div>
        <span className="rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold/70">
          irreversible
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {CHANGES.map((c) => (
          <li
            key={c.label}
            className="rounded-xl border border-gold/10 bg-background/40 p-4 transition-colors hover:border-gold/25"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/15 bg-gold/5">
                <c.icon className="h-4 w-4 text-gold" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[12px]">
                  <span className="rounded border border-gold/15 bg-gold/[0.04] px-2 py-0.5 text-muted-foreground line-through decoration-gold/40">
                    {c.before}
                  </span>
                  <ArrowRight className="h-3 w-3 text-gold" />
                  <span className="rounded border border-emerald-400/25 bg-emerald-400/[0.06] px-2 py-0.5 font-semibold text-emerald-300">
                    {c.after}
                  </span>
                </div>
                <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-muted-foreground/80">{c.note}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
