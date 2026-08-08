import { db } from "@/lib/db";
import { egp } from "@/lib/aurienta/format";
import { Brain, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";

export async function AiInsights({
  user,
  holdings,
}: {
  user: { id: string; sovereignTrustScore: number };
  holdings: { equityUnits: number; enterprise: { name: string; sector: string; equityUnitPriceEgp: number } }[];
}) {
  // Compute sector allocation
  const sectorTotals: Record<string, number> = {};
  let total = 0;
  for (const h of holdings) {
    const v = h.equityUnits * h.enterprise.equityUnitPriceEgp;
    sectorTotals[h.enterprise.sector] = (sectorTotals[h.enterprise.sector] ?? 0) + v;
    total += v;
  }
  const topSector = Object.entries(sectorTotals).sort((a, b) => b[1] - a[1])[0];
  const topPct = total > 0 && topSector ? (topSector[1] / total) * 100 : 0;

  const insights = [
    {
      icon: topPct > 50 ? AlertTriangle : TrendingUp,
      tone: topPct > 50 ? "warn" : "ok",
      title: topPct > 50 ? "Concentration risk detected" : "Diversification on track",
      body:
        topPct > 50
          ? `${topSector ? topSector[0] : ""} represents ${topPct.toFixed(0)}% of your portfolio. Consider reallocating to another sector.`
          : `Your largest sector exposure is ${topSector ? topSector[0] : "n/a"} at ${topPct.toFixed(0)}%. Within healthy bounds.`,
    },
    {
      icon: Lightbulb,
      tone: "info",
      title: "Sovereign Trust Score trajectory",
      body: `At ${user.sovereignTrustScore}/100 you are ${user.sovereignTrustScore >= 80 ? "an Ecosystem Builder" : "a Trusted Contributor"}. Voting on the open EcoPack proposal would add +2 points.`,
    },
  ];

  return (
    <div className="rounded-2xl border border-gold/12 glass-gold p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <Brain className="h-4 w-4 text-gold" />
        <h2 className="font-serif text-lg font-semibold">AI Insights</h2>
        <span className="ml-auto rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 font-mono text-[11px] text-gold/70">
          Mixtral 8x22B
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {insights.map((i, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-3.5 ${
              i.tone === "warn"
                ? "border-amber-400/30 bg-amber-400/5"
                : i.tone === "ok"
                ? "border-emerald-400/25 bg-emerald-400/5"
                : "border-gold/15 bg-gold/[0.03]"
            }`}
          >
            <div className="flex items-center gap-2">
              <i.icon
                className={`h-4 w-4 ${
                  i.tone === "warn" ? "text-amber-400" : i.tone === "ok" ? "text-emerald-400" : "text-gold"
                }`}
              />
              <p className="font-sans text-xs font-semibold text-foreground">{i.title}</p>
            </div>
            <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-muted-foreground">{i.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
