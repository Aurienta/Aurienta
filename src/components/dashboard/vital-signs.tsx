import { db } from "@/lib/db";
import { egp, vitalSign } from "@/lib/aurienta/format";
import { Activity } from "lucide-react";

export async function VitalSigns({ enterpriseIds }: { enterpriseIds: string[] }) {
  // Aggregate the user's enterprises into a single vital-signs panel
  const enterprises = await db.enterprise.findMany({
    where: { id: { in: enterpriseIds } },
  });

  if (enterprises.length === 0) {
    return (
      <div className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">Vital signs</h2>
        </div>
        <p className="font-sans text-sm text-muted-foreground">No enterprises to monitor.</p>
      </div>
    );
  }

  const avg = (fn: (e: typeof enterprises[number]) => number) =>
    enterprises.reduce((s, e) => s + fn(e), 0) / enterprises.length;

  const runway = avg((e) => (e.monthlyBurnEgp > 0 ? e.lawFirmClientAccountBalanceEgp / e.monthlyBurnEgp : 0));
  const revenueGrowth = avg((e) => e.revenueGrowthPct);
  const grossMargin = avg((e) => e.grossMarginPct);
  const nosi = avg((e) => e.nosiCompliantPct);
  const totalEscrow = enterprises.reduce((s, e) => s + e.lawFirmClientAccountBalanceEgp, 0);

  const signs = [
    { label: "Runway", value: runway, unit: "mo", healthy: 12, alert: 6 },
    { label: "Revenue growth", value: revenueGrowth, unit: "%", healthy: 20, alert: 0 },
    { label: "Gross margin", value: grossMargin, unit: "%", healthy: 30, alert: 15 },
    { label: "Social insurance", value: nosi, unit: "%", healthy: 100, alert: 90 },
  ];

  return (
    <div className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">Vital signs</h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {enterprises.length} enterprise{enterprises.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mb-4 rounded-xl border border-gold/10 bg-background/40 p-3">
        <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
          Aggregate Law Firm Client Account balance (zero custody)
        </p>
        <p className="font-serif text-xl font-semibold text-gold-light">{egp(totalEscrow)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {signs.map((s) => {
          const status = vitalSign(s.value, s.healthy, s.alert);
          return (
            <div key={s.label} className="rounded-xl border border-gold/10 bg-background/40 p-3">
              <div className="flex items-center justify-between">
                <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <span
                  className={`h-2 w-2 rounded-full ${
                    status === "green" ? "bg-emerald-400" : status === "yellow" ? "bg-amber-400" : "bg-red-400"
                  }`}
                />
              </div>
              <p className="mt-1 font-serif text-lg font-semibold">
                {s.value.toFixed(s.unit === "%" ? 0 : 1)}
                <span className="ml-0.5 font-sans text-xs text-muted-foreground">{s.unit}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
