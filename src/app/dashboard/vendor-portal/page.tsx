import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { egp, pct, timeAgo } from "@/lib/aurienta/format";
import {
  Truck,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vendor Portal · AURIENTA",
  description:
    "Vendor registry, AI risk scores, related-party flags, and concentration-risk monitoring across enterprises.",
};

function riskBand(score: number): { label: string; cls: string } {
  if (score >= 70) return { label: "High", cls: "text-rose-300 border-rose-400/30 bg-rose-400/10" };
  if (score >= 30) return { label: "Watch", cls: "text-amber-300 border-amber-400/30 bg-amber-400/10" };
  return { label: "Low", cls: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" };
}

export default async function VendorPortalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/vendor-portal");

  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);

  const vendors = await db.vendor.findMany({
    where: { enterpriseId: { in: enterpriseIds } },
    include: { enterprise: { select: { id: true, name: true, slug: true, tier: true } } },
    orderBy: [{ relatedParty: "desc" }, { totalPaidYtdEgp: "desc" }],
    take: 100,
  });

  const totalSpend = vendors.reduce((s, v) => s + v.totalPaidYtdEgp, 0);
  const relatedPartyCount = vendors.filter((v) => v.relatedParty).length;
  const highRiskCount = vendors.filter((v) => v.riskScore >= 70).length;

  // Concentration: top vendor share per enterprise.
  const byEnt = new Map<string, typeof vendors>();
  for (const v of vendors) {
    const arr = byEnt.get(v.enterpriseId) ?? [];
    arr.push(v);
    byEnt.set(v.enterpriseId, arr);
  }
  const concentration = Array.from(byEnt.entries()).map(([entId, list]) => {
    const entTotal = list.reduce((s, v) => s + v.totalPaidYtdEgp, 0) || 1;
    const top = list[0];
    const topShare = top ? (top.totalPaidYtdEgp / entTotal) * 100 : 0;
    return {
      enterpriseId: entId,
      enterpriseName: top?.enterprise.name ?? "—",
      enterpriseTier: top?.enterprise.tier ?? "—",
      vendorCount: list.length,
      totalSpend: entTotal,
      topVendor: top?.name ?? "—",
      topShare,
    };
  });

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Vendor Portal"
        icon={Truck}
        title="Every piastre paid out, scored and visible"
        subtitle="The vendor registry lists every supplier, contractor, and service provider paid from an enterprise's escrow. The Constitutional AI scores each vendor for related-party overlap, threshold-gaming patterns, and concentration risk — every red flag visible to all Equity-Unit holders."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Vendors" value={String(vendors.length)} icon={Truck} />
        <KPI label="Total YTD spend" value={egp(totalSpend, { compact: true })} icon={TrendingUp} />
        <KPI label="Related-party" value={String(relatedPartyCount)} icon={ShieldAlert} danger={relatedPartyCount > 0} />
        <KPI label="High risk" value={String(highRiskCount)} icon={AlertTriangle} danger={highRiskCount > 0} />
      </div>

      {/* Concentration risk */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <GoldStar className="h-3 w-3" />
            <h2 className="font-serif text-base font-semibold">Concentration risk by enterprise</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">top-vendor share of total spend</span>
          </div>
        </div>
        <div className="max-h-[40vh] overflow-y-auto">
          <ul className="divide-y divide-gold/8">
            {concentration.map((c) => {
              const danger = c.topShare >= 40;
              const watch = c.topShare >= 25 && c.topShare < 40;
              return (
                <li key={c.enterpriseId} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-sm font-semibold">{c.enterpriseName}</span>
                    <span className="font-mono text-xs text-muted-foreground">· T{c.enterpriseTier} · {c.vendorCount} vendors</span>
                    <span className="ml-auto font-mono text-xs text-gold-light">{egp(c.totalSpend, { compact: true })} YTD</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-sans text-[11px] text-muted-foreground">Top: {c.topVendor}</span>
                    <span className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${
                      danger ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
                      : watch ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                      : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    }`}>
                      {pct(c.topShare, 1)} of spend
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className={`h-full rounded-full ${danger ? "bg-rose-400/60" : watch ? "bg-amber-400/60" : "bg-emerald-400/60"}`}
                      style={{ width: `${Math.min(c.topShare, 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
            {concentration.length === 0 && (
              <li className="px-5 py-12 text-center font-sans text-xs text-muted-foreground">No vendor data.</li>
            )}
          </ul>
        </div>
      </section>

      {/* Full vendor registry */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-gold" />
            <h2 className="font-serif text-base font-semibold">Vendor registry</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">{vendors.length} vendors · YTD</span>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="sticky top-0 z-10 bg-[#0c0c0f]/95 backdrop-blur">
              <tr className="border-b border-gold/12 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Vendor</th>
                <th className="px-4 py-2.5 font-medium">Enterprise</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">YTD paid</th>
                <th className="px-4 py-2.5 font-medium">Risk</th>
                <th className="px-4 py-2.5 font-medium">Related party</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => {
                const rb = riskBand(v.riskScore);
                return (
                  <tr key={v.id} className="border-b border-gold/8 hover:bg-gold/[0.03]">
                    <td className="px-4 py-2.5">
                      <div className="font-serif text-sm font-medium">{v.name}</div>
                      {v.commercialRegister && (
                        <div className="font-mono text-[11px] text-muted-foreground/80">{v.commercialRegister}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {v.enterprise.name} · T{v.enterprise.tier}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{v.category}</td>
                    <td className="px-4 py-2.5 font-mono text-gold-light">{egp(v.totalPaidYtdEgp, { compact: true })}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${rb.cls}`}>
                        {v.riskScore} · {rb.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {v.relatedParty ? (
                        <div>
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-rose-300">
                            <AlertTriangle className="h-3 w-3" /> YES
                          </span>
                          {v.uboOverlapNote && (
                            <div className="mt-0.5 font-sans text-[11px] text-muted-foreground/85">{v.uboOverlapNote}</div>
                          )}
                        </div>
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                      )}
                    </td>
                  </tr>
                );
              })}
              {vendors.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No vendors recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Vendor risk per Vol 8 Procurement framework · concentration &gt;40% triggers dual-sig requirement on all spend
        </p>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, danger }: { label: string; value: string; icon: React.ElementType; danger?: boolean }) {
  return (
    <div className="rounded-2xl border border-gold/15 glass p-4">
      <div className="flex items-center justify-between">
        <Icon className={`h-4 w-4 ${danger ? "text-rose-400" : "text-gold"}`} />
        {danger && <AlertTriangle className="h-3 w-3 text-rose-400" />}
      </div>
      <div className={`mt-2 font-serif text-xl font-semibold ${danger ? "text-rose-300" : ""}`}>{value}</div>
      <div className="font-sans text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
