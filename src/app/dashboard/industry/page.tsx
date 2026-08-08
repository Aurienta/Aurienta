import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { egp, pct } from "@/lib/aurienta/format";
import {
  Wheat,
  Factory,
  Palmtree,
  Cpu,
  TrendingUp,
  Building2,
  Users,
  Sprout,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Industry Modules · AURIENTA",
  description:
    "Sector-specific constitutional modules — Agriculture, Manufacturing, Tourism, Technology — with tailored KPIs, compliance, and AI oversight.",
};

const MODULES = [
  {
    key: "agriculture",
    label: "Agriculture",
    icon: Wheat,
    accent: "#8a6d1f",
    description: "Land-leased cooperatives, irrigation compliance, harvest insurance, and crop-equity units.",
    kpis: [
      { label: "Active enterprises", value: "—", hint: "across your portfolio" },
      { label: "Avg yield index", value: "104.2", hint: "vs 5-yr district avg" },
      { label: "NOSI compliance", value: "100%", hint: "seasonal workers enrolled" },
    ],
    rules: [
      "Land lease registered with GAFI + Ministry of Agriculture",
      "NOSI mandatory for all seasonal workers (no exceptions)",
      "Irrigation water metering + monthly log on ledger",
      "Crop insurance via Egyptian Agricultural Insurance Fund",
      "Equity Units tied to harvest-cycle liquidity windows",
    ],
  },
  {
    key: "manufacturing",
    label: "Manufacturing",
    icon: Factory,
    accent: "#d4af37",
    description: "Industrial Output Index, capacity utilisation, ISO 9001 audit cadence, and dual-source raw-material policy.",
    kpis: [
      { label: "Industrial Output Index", value: "112.8", hint: "QoQ (CAPMAS-aligned)" },
      { label: "Capacity utilisation", value: "73.5%", hint: "vs 80% sector benchmark" },
      { label: "ISO 9001 audits due", value: "0", hint: "all current" },
    ],
    rules: [
      "ISO 9001 quality management system mandatory",
      "Dual-source policy: no single vendor >40% of raw materials",
      "Capacity utilisation reported monthly on the ledger",
      "Environmental compliance with EEAA Law 4/1994",
      "Worker safety per Labour Law 12/2003 + monthly safety audit",
    ],
  },
  {
    key: "tourism",
    label: "Tourism & Hospitality",
    icon: Palmtree,
    accent: "#f4d676",
    description: "ETA licensing, seasonal cashflow smoothing, guest-satisfaction NPS, and cultural-heritage protection covenants.",
    kpis: [
      { label: "ETA license status", value: "current", hint: "all properties" },
      { label: "Guest NPS", value: "+62", hint: "trailing 90 days" },
      { label: "Occupancy rate", value: "71.8%", hint: "vs 68% sector" },
    ],
    rules: [
      "Egyptian Tourism Authority (ETA) license verified quarterly",
      "Seasonal cashflow smoothing via law firm client account reserves ≥3 months OpEx",
      "Cultural-heritage protection covenant (UNESCO alignment)",
      "Guest-satisfaction NPS reported monthly",
      "Local-employment ratio ≥65% (Luxor/Aswan covenants)",
    ],
  },
  {
    key: "technology",
    label: "Technology",
    icon: Cpu,
    accent: "#c9a03d",
    description: "ITIDA registration, IP assignment cliffs, source-code law firm client account, and dual-cloud failover for SaaS-tier enterprises.",
    kpis: [
      { label: "ITIDA registration", value: "verified", hint: "active members" },
      { label: "Source-code law firm client account", value: "Q2 2026", hint: "last deposit" },
      { label: "Uptime (90d)", value: "99.97%", hint: "SLA 99.9%" },
    ],
    rules: [
      "ITIDA registration required for all Tier C+ tech enterprises",
      "IP assignment: 4-year cliff, 1-year vest, founder-aligned",
      "Source-code law firm client account with Egyptian Software Law Firm Client Account Association",
      "Dual-cloud failover (AWS + local Egyptian cloud)",
      "Open-source license audit on every release",
    ],
  },
];

export default async function IndustryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/industry");

  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);
  const enterprises = await db.enterprise.findMany({
    where: { id: { in: enterpriseIds } },
    select: { id: true, name: true, tier: true, sector: true, slug: true, monthlyRevenueEgp: true, employeeCount: true },
  });

  // Count enterprises per sector.
  const bySector = new Map<string, typeof enterprises>();
  for (const e of enterprises) {
    const arr = bySector.get(e.sector) ?? [];
    arr.push(e);
    bySector.set(e.sector, arr);
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Industry Modules"
        icon={Sprout}
        title="Constitutional rules, sector-specific"
        subtitle="Every sector has its own constitutional addendum — agriculture, manufacturing, tourism, technology. The base rules (Zero Custody, Fundamental Pricing, CRE enforcement) are universal; the addenda layer sector-specific KPIs, regulatory hooks, and AI oversight."
      />

      {/* Portfolio at a glance */}
      <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">Your sector exposure</h2>
          <span className="ml-auto font-mono text-xs text-muted-foreground/80">{enterprises.length} enterprises</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MODULES.map((m) => {
            const list = bySector.get(m.key) ?? [];
            return (
              <div key={m.key} className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-3">
                <div className="flex items-center gap-2">
                  <m.icon className="h-3.5 w-3.5" style={{ color: m.accent }} />
                  <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">{m.label}</span>
                </div>
                <div className="mt-1.5 font-serif text-2xl font-semibold">{list.length}</div>
                <div className="font-sans text-xs text-muted-foreground/85">
                  {list.length === 0 ? "no exposure" : list.map((e) => e.name).join(", ").slice(0, 60)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sector modules */}
      <div className="grid gap-6 lg:grid-cols-2">
        {MODULES.map((m) => {
          const list = bySector.get(m.key) ?? [];
          const totalRev = list.reduce((s, e) => s + e.monthlyRevenueEgp, 0);
          const totalEmp = list.reduce((s, e) => s + e.employeeCount, 0);
          return (
            <section key={m.key} className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{ borderColor: `${m.accent}40`, background: `${m.accent}15` }}
                >
                  <m.icon className="h-5 w-5" style={{ color: m.accent }} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif text-lg font-semibold">{m.label}</h2>
                  <p className="font-sans text-[11px] text-muted-foreground line-clamp-2">{m.description}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {m.kpis.map((k) => (
                  <div key={k.label} className="rounded-lg border border-gold/10 bg-foreground/[0.02] p-2.5">
                    <div className="font-mono text-xs text-gold-light">{k.value}</div>
                    <div className="mt-0.5 font-sans text-[11px] uppercase tracking-wide text-muted-foreground/85">{k.label}</div>
                    <div className="font-sans text-[11px] text-muted-foreground/75">{k.hint}</div>
                  </div>
                ))}
              </div>

              {list.length > 0 && (
                <div className="mt-4 rounded-xl border border-gold/12 bg-foreground/[0.02] p-3">
                  <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground/80">
                    <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3 text-gold" /> {egp(totalRev, { compact: true })}/mo</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3 text-gold" /> {totalEmp} employees</span>
                  </div>
                  <ul className="mt-2 space-y-1 font-sans text-[11px]">
                    {list.map((e) => (
                      <li key={e.id} className="flex items-center justify-between">
                        <span className="truncate">{e.name}</span>
                        <span className="font-mono text-xs text-gold-light">T{e.tier}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <details className="mt-4 group">
                <summary className="cursor-pointer list-none">
                  <span className="inline-flex items-center gap-1.5 font-sans text-[11px] text-gold/80 hover:text-gold">
                    <GoldStar className="h-3 w-3" /> Sector constitutional rules ({m.rules.length})
                  </span>
                </summary>
                <ol className="mt-3 space-y-1.5 font-sans text-[11px] leading-relaxed text-foreground/90">
                  {m.rules.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-mono text-xs text-gold-light">{i + 1}.</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ol>
              </details>
            </section>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Sector addenda per Vol 16 · base constitution universal, sector overlays layered · reviewed annually by the Constitutional Council
        </p>
      </div>
    </div>
  );
}
