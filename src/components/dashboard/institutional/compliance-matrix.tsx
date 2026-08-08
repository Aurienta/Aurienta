import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { StatusBadge, type ComplianceStatus } from "./status-badge";
import { pct } from "@/lib/aurienta/format";

type Row = {
  id: string;
  name: string;
  tier: string;
  sector: string;
  healthRating: string | null;
  healthScore: number;
  nosiCompliantPct: number;
  policeClearanceValid: boolean;
  policeExpiryDays?: number; // optional expiry window
};

function policeStatus(valid: boolean, days?: number): ComplianceStatus {
  if (!valid) return "red";
  if (typeof days === "number" && days <= 14) return "amber";
  return "green";
}

function healthStatus(rating: string | null, score: number): ComplianceStatus {
  if (!rating) return "neutral";
  if (rating.startsWith("AA") || rating.startsWith("AAA")) return "green";
  if (rating.startsWith("A") || rating.startsWith("BBB")) return "amber";
  return "red";
}

function nosiStatus(p: number): ComplianceStatus {
  if (p >= 100) return "green";
  if (p >= 90) return "amber";
  return "red";
}

export function ComplianceMatrix({ rows }: { rows: Row[] }) {
  return (
    <section
      aria-label="Compliance matrix"
      className="rounded-2xl border border-gold/12 glass p-5 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">Compliance matrix</h2>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
          {rows.length} enterprise{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center font-sans text-sm text-muted-foreground">
          No enterprises to monitor yet. Join or found an enterprise to populate the matrix.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gold/10 font-sans text-xs uppercase tracking-wider text-muted-foreground/80">
                <th className="pb-2 pr-3 font-medium">Enterprise</th>
                <th className="pb-2 pr-3 font-medium">NOSI</th>
                <th className="pb-2 pr-3 font-medium">Police clearance</th>
                <th className="pb-2 pr-3 font-medium">Health</th>
                <th className="pb-2 pr-3 font-medium">Tax filing <span className="font-mono text-[11px] normal-case text-muted-foreground/85">(roadmap)</span></th>
                <th className="pb-2 font-medium">Audit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const ps = policeStatus(r.policeClearanceValid, r.policeExpiryDays);
                const hs = healthStatus(r.healthRating, r.healthScore);
                const ns = nosiStatus(r.nosiCompliantPct);
                return (
                  <tr key={r.id} className="border-b border-gold/5 last:border-0 align-middle">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-medium text-foreground">{r.name}</span>
                        <span className="rounded border border-gold/20 bg-gold/5 px-1.5 py-0.5 font-mono text-[11px] text-gold/70">
                          T{r.tier}
                        </span>
                      </div>
                      <span className="font-sans text-xs text-muted-foreground">
                        {r.sector} · {r.healthRating ?? "—"} ({r.healthScore})
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge
                        status={ns}
                        label={pct(r.nosiCompliantPct, 0)}
                        detail={`Tracked on-platform — NOSI live API verification is roadmap`}
                      />
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge
                        status={ps}
                        label={
                          ps === "red"
                            ? "Invalid"
                            : ps === "amber"
                            ? `Expiring ${r.policeExpiryDays ?? 14}d`
                            : "Valid"
                        }
                        detail="Manager + key-person police clearance (MOI live API is roadmap)"
                      />
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge
                        status={hs}
                        label={r.healthRating ?? "—"}
                        detail={`AI health score ${r.healthScore}/100`}
                      />
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge status="green" label="Computed" detail="Returns computed on-platform; live ETA auto-submit is roadmap" />
                    </td>
                    <td className="py-3">
                      <StatusBadge status="green" label="Closed" detail="Statutory review by ESAE-licensed firm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
