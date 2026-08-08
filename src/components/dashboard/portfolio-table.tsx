import Link from "next/link";
import { egp } from "@/lib/aurienta/format";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

export function PortfolioTable({
  holdings,
}: {
  holdings: {
    equityUnits: number;
    avgPriceEgp: number;
    enterprise: {
      id: string;
      slug: string;
      name: string;
      tier: string;
      equityUnitPriceEgp: number;
      totalEquityUnits: number;
      sector: string;
      healthRating: string | null;
    };
  }[];
}) {
  const total = holdings.reduce((s, h) => s + h.equityUnits * h.enterprise.equityUnitPriceEgp, 0);

  return (
    <div className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Wallet className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">Portfolio</h2>
        </div>
        <Link href="/dashboard/portfolio" className="font-sans text-xs text-gold/80 hover:text-gold">
          View all →
        </Link>
      </div>

      {holdings.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-sans text-sm text-muted-foreground">No equity holdings yet.</p>
          <Link
            href="/dashboard/opportunities"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 font-sans text-xs font-semibold text-black"
          >
            Explore opportunities
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gold/10 font-sans text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Enterprise</th>
                <th className="pb-2 pr-3 text-right font-medium">Ownership</th>
                <th className="pb-2 pr-3 text-right font-medium">Value</th>
                <th className="pb-2 text-right font-medium">Return</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const value = h.equityUnits * h.enterprise.equityUnitPriceEgp;
                const cost = h.equityUnits * h.avgPriceEgp;
                const ret = cost > 0 ? ((value - cost) / cost) * 100 : 0;
                const ownershipPct = h.enterprise.totalEquityUnits > 0 ? (h.equityUnits / h.enterprise.totalEquityUnits) * 100 : 0;
                return (
                  <tr key={h.enterprise.id} className="border-b border-gold/5 last:border-0">
                    <td className="py-3 pr-3">
                      <Link href={`/dashboard/portfolio`} className="group flex items-center gap-2">
                        <span className="font-serif font-medium text-foreground group-hover:text-gold-light">
                          {h.enterprise.name}
                        </span>
                        <span className="rounded border border-gold/20 bg-gold/5 px-1.5 py-0.5 font-mono text-[11px] text-gold/70">
                          T{h.enterprise.tier}
                        </span>
                      </Link>
                      <span className="font-sans text-xs text-muted-foreground">
                        {h.enterprise.healthRating ?? "—"} · {h.enterprise.sector}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-right font-mono text-xs text-gold/80">
                      {ownershipPct.toFixed(2)}%
                    </td>
                    <td className="py-3 pr-3 text-right font-serif font-medium text-gold-light">
                      {egp(value, { compact: value > 1_000_000 })}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 font-mono text-xs ${
                          ret >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {ret >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(ret).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-3 font-sans text-xs text-muted-foreground" colSpan={2}>Total portfolio value</td>
                <td className="pt-3 text-right font-serif text-base font-semibold text-gold-gradient">
                  {egp(total, { compact: total > 1_000_000 })}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
