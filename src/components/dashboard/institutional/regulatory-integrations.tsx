import * as React from "react";
import { Building2, Wifi } from "lucide-react";

type Integration = {
  code: string;
  name: string;
  mode: string;
  detail: string;
};

const INTEGRATIONS: Integration[] = [
  {
    code: "FRA",
    name: "Financial Regulatory Authority",
    mode: "Regulatory Shadow Mode",
    detail: "Read-only dashboard active. No-action letter in force.",
  },
  {
    code: "GAFI",
    name: "General Authority for Free Zones & Participation",
    mode: "Registry sync (roadmap)",
    detail: "Company registry sync · live API integration pending; manual verification in pilot",
  },
  {
    code: "NOSI",
    name: "National Social Insurance",
    mode: "Status tracking (roadmap)",
    detail: "NOSI compliance tracked on-platform; live API verification pending",
  },
  {
    code: "MOI",
    name: "Ministry of Interior",
    mode: "Police clearance attestation (pilot)",
    detail: "Manager clearance status recorded on-platform; live MOI API integration is roadmap",
  },
  {
    code: "ETA",
    name: "Egyptian Tax Authority",
    mode: "Auto-filing (roadmap)",
    detail: "Withholding + payroll tax computed on-platform; live auto-submit integration pending",
  },
  {
    code: "AML",
    name: "Sanctions / PEP screening",
    mode: "Audit-log (provider integration pending)",
    detail: "OFAC + EU + EG lists · screening events recorded; live provider (Refinitiv/ComplyAdvantage) is roadmap",
  },
];

export function RegulatoryIntegrations() {
  return (
    <section
      aria-label="Regulatory integration status"
      className="rounded-2xl border border-gold/12 glass p-5 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Building2 className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">Regulatory integration status</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/8 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold-light">
          <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_2px_rgba(212,175,55,0.5)]" />
          Pilot — integrations roadmap
        </span>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {INTEGRATIONS.map((it) => (
          <li
            key={it.code}
            className="group flex items-start gap-3 rounded-xl border border-gold/10 bg-background/40 p-3 transition-colors hover:border-gold/25 hover:bg-gold/[0.03]"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/5">
              <Wifi className="h-4 w-4 text-gold/70" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-mono text-[11px] uppercase tracking-wider text-gold/70">{it.code}</p>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-gold/80">
                  <span className="h-1 w-1 rounded-full bg-gold" /> pilot
                </span>
              </div>
              <p className="font-serif text-sm font-semibold leading-tight text-foreground">{it.name}</p>
              <p className="font-sans text-xs text-gold-light/80">{it.mode}</p>
              <p className="mt-0.5 font-sans text-xs leading-relaxed text-muted-foreground/80">{it.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
