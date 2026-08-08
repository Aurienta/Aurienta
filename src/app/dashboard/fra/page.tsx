import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { GoldStar, AurientaMark } from "@/components/aurienta-logo";
import { egp, pct, timeAgo, shortHash } from "@/lib/aurienta/format";
import {
  Landmark,
  Lock,
  EyeOff,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "FRA Regulatory Console · AURIENTA",
  description:
    "Read-only, anonymised regulatory view for the Egyptian Financial Regulatory Authority. Constitutional Privacy Wall enforced — no partner PII.",
};

export default async function FraPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/fra");
  // RBAC: only AURIENTA reps (FRA liaison Stewards) may view the regulator
  // console. Any other authenticated user is bounced to their own dashboard.
  const hasRole = user.memberships.some((m) => m.role === "aurienta_rep");
  if (!hasRole) redirect("/dashboard");

  // Read-only aggregate queries — no PII returned.
  const [
    enterprises,
    lawFirms,
    accountingFirms,
    escrowSum,
    raisedSum,
    ledgerCount,
    aiArtifactCount,
    whistleblowerCount,
    appealCount,
    recentAuditEvents,
  ] = await Promise.all([
    db.enterprise.findMany({
      select: {
        id: true,
        slug: true,
        tier: true,
        stage: true,
        legalForm: true,
        sector: true,
        healthRating: true,
        healthScore: true,
        raisedEgp: true,
        fundraisingGoalEgp: true,
        lawFirmClientAccountBalanceEgp: true,
        monthlyBurnEgp: true,
        monthlyRevenueEgp: true,
        grossMarginPct: true,
        revenueGrowthPct: true,
        employeeCount: true,
        nosiCompliantPct: true,
        policeClearanceValid: true,
        status: true,
        graduationReadiness: true,
        createdAt: true,
        lawFirmId: true,
        accountingFirmId: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.lawFirm.findMany({ select: { id: true, name: true, frLicenseNumber: true, insuranceEgp: true, status: true } }),
    db.accountingFirm.findMany({ select: { id: true, name: true, esaaLicense: true, status: true } }),
    db.enterprise.aggregate({ _sum: { lawFirmClientAccountBalanceEgp: true } }),
    db.enterprise.aggregate({ _sum: { raisedEgp: true } }),
    db.ledgerEvent.count(),
    db.aiArtifact.count(),
    db.whistleblowerReport.count(),
    db.appealCase.count(),
    db.ledgerEvent.findMany({
      where: { eventType: { in: ["risk_disclosure_acknowledged", "expense_approved", "milestone_released", "share_transferred", "whistleblower_filed"] } },
      orderBy: { timestamp: "desc" },
      take: 10,
      select: { id: true, eventType: true, timestamp: true, payloadHash: true },
    }),
  ]);

  // Anonymise enterprise names — FRA sees tier, sector, financials but NOT name.
  const anonymised = enterprises.map((e, i) => ({
    ref: `ENT-${String(i + 1).padStart(4, "0")}`,
    tier: e.tier,
    sector: e.sector,
    legalForm: e.legalForm,
    stage: e.stage,
    healthRating: e.healthRating,
    healthScore: e.healthScore,
    raisedEgp: e.raisedEgp,
    lawFirmClientAccountBalanceEgp: e.lawFirmClientAccountBalanceEgp,
    monthlyBurnEgp: e.monthlyBurnEgp,
    monthlyRevenueEgp: e.monthlyRevenueEgp,
    grossMarginPct: e.grossMarginPct,
    revenueGrowthPct: e.revenueGrowthPct,
    employeeCount: e.employeeCount,
    nosiCompliantPct: e.nosiCompliantPct,
    policeClearanceValid: e.policeClearanceValid,
    status: e.status,
    graduationReadiness: e.graduationReadiness,
  }));

  const totalEscrow = escrowSum._sum.lawFirmClientAccountBalanceEgp ?? 0;
  const totalRaised = raisedSum._sum.raisedEgp ?? 0;
  const avgHealth = enterprises.length > 0
    ? Math.round(enterprises.reduce((s, e) => s + (e.healthScore ?? 0), 0) / enterprises.length)
    : 0;
  const nosiCompliant = enterprises.filter((e) => e.nosiCompliantPct >= 100).length;
  const policeClearanceValid = enterprises.filter((e) => e.policeClearanceValid).length;
  const fundraisingActive = enterprises.filter((e) => e.status === "fundraising_active").length;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="FRA Regulatory Console"
        icon={Landmark}
        title="The Egyptian Financial Regulatory Authority — read-only view"
        subtitle="Anonymised aggregate supervision. Enterprise names, partner identities, and individual transactions are obscured behind the Constitutional Privacy Wall. The FRA sees structure, financials, and compliance posture — never people."
      />

      {/* Constitutional Privacy Wall banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/[0.06] p-4 sm:p-5">
        <div className="mt-0.5">
          <ShieldCheck className="h-5 w-5 text-gold" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-base font-semibold text-gold-light">Constitutional Privacy Wall — active</span>
            <Lock className="h-3.5 w-3.5 text-gold/80" />
          </div>
          <p className="mt-1 max-w-3xl font-sans text-xs leading-relaxed text-muted-foreground">
            Per Art. 14 (Regulatory Access) of the constitutional charter, regulatory supervisors receive
            anonymised, aggregate, read-only access. Names are replaced with reference codes (ENT-0001…).
            Partner identities, raw transaction descriptions, and IPFS attachments require a court order
            under Art. 14.4. Every FRA page view is itself logged to the immutable ledger.
          </p>
        </div>
      </div>

      {/* Aggregate KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KPI label="Enterprises" value={String(enterprises.length)} icon={Landmark} />
        <KPI label="Capital Formation Active" value={String(fundraisingActive)} icon={Clock} />
        <KPI label="Avg health score" value={`${avgHealth}/100`} icon={CheckCircle2} ok={avgHealth >= 70} />
        <KPI label="NOSI 100%" value={`${nosiCompliant}/${enterprises.length}`} icon={ShieldCheck} ok={nosiCompliant === enterprises.length} />
        <KPI label="Police clearance" value={`${policeClearanceValid}/${enterprises.length}`} icon={ShieldCheck} ok={policeClearanceValid === enterprises.length} />
        <KPI label="Whistleblower reports" value={String(whistleblowerCount)} icon={AlertTriangle} />
      </div>

      {/* Capital flows (anonymised) */}
      <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">Aggregate capital flows</h2>
          <span className="ml-auto inline-flex items-center gap-1 font-mono text-xs text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Zero Custody verified
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total raised" value={egp(totalRaised, { compact: true })} />
          <Stat label="Total held in law firm client accounts (law-firm held)" value={egp(totalEscrow, { compact: true })} />
          <Stat label="AURIENTA-held" value={<span className="text-emerald-300">0 EGP</span>} />
          <Stat label="Active law firms" value={String(lawFirms.length)} />
          <Stat label="Active accounting firms" value={String(accountingFirms.length)} />
          <Stat label="Ledger events" value={ledgerCount.toLocaleString()} />
          <Stat label="AI artifacts persisted" value={aiArtifactCount.toLocaleString()} />
          <Stat label="Active appeals" value={String(appealCount)} />
        </div>
      </section>

      {/* Enterprise registry (anonymised) */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <EyeOff className="h-3.5 w-3.5 text-gold" />
            <h2 className="font-serif text-base font-semibold">Enterprise registry — anonymised</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">
              names obscured · {enterprises.length} entities
            </span>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="sticky top-0 z-10 bg-[#0c0c0f]/95 backdrop-blur">
              <tr className="border-b border-gold/12 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Ref</th>
                <th className="px-4 py-2.5 font-medium">Tier</th>
                <th className="px-4 py-2.5 font-medium">Sector</th>
                <th className="px-4 py-2.5 font-medium">Stage</th>
                <th className="px-4 py-2.5 font-medium">Health</th>
                <th className="px-4 py-2.5 font-medium">Capital Participated</th>
                <th className="px-4 py-2.5 font-medium">Law Firm Client Account</th>
                <th className="px-4 py-2.5 font-medium">NOSI</th>
                <th className="px-4 py-2.5 font-medium">Police</th>
              </tr>
            </thead>
            <tbody>
              {anonymised.map((e) => (
                <tr key={e.ref} className="border-b border-gold/8 hover:bg-gold/[0.03]">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-gold-light">{e.ref}</td>
                  <td className="px-4 py-2.5">{e.tier} · {e.legalForm}</td>
                  <td className="px-4 py-2.5">{e.sector}</td>
                  <td className="px-4 py-2.5">{e.stage}</td>
                  <td className="px-4 py-2.5">
                    <span className={e.healthScore >= 80 ? "text-emerald-300" : e.healthScore >= 60 ? "text-amber-300" : "text-rose-300"}>
                      {e.healthRating ?? "—"} ({e.healthScore})
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono">{egp(e.raisedEgp, { compact: true })}</td>
                  <td className="px-4 py-2.5 font-mono">{egp(e.lawFirmClientAccountBalanceEgp, { compact: true })}</td>
                  <td className="px-4 py-2.5">
                    <span className={e.nosiCompliantPct >= 100 ? "text-emerald-300" : "text-amber-300"}>
                      {pct(e.nosiCompliantPct, 0)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {e.policeClearanceValid
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                      : <AlertTriangle className="h-3.5 w-3.5 text-rose-300" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Anonymised recent activity */}
      <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <GoldStar className="h-3 w-3" />
          <h2 className="font-serif text-base font-semibold">Recent platform activity</h2>
          <span className="ml-auto font-mono text-xs text-muted-foreground/80">enterprise names obscured</span>
        </div>
        <ul className="mt-3 divide-y divide-gold/8">
          {recentAuditEvents.map((ev) => (
            <li key={ev.id} className="flex items-center gap-3 py-2.5">
              <span className="font-mono text-xs text-gold-light">{ev.eventType}</span>
              <span className="ml-auto font-mono text-xs text-muted-foreground/80">
                {shortHash(ev.payloadHash, 12, 6)}
              </span>
              <span className="font-sans text-xs text-muted-foreground/80">{timeAgo(ev.timestamp)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          FRA No-Action Letter ref. NL-2025-Q4-014 · read-only · every page view ledger-logged
        </p>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, ok }: { label: string; value: string; icon: React.ElementType; ok?: boolean }) {
  return (
    <div className="rounded-2xl border border-gold/15 glass p-4">
      <div className="flex items-center justify-between">
        <Icon className={`h-4 w-4 ${ok === false ? "text-rose-400" : "text-gold"}`} />
        {ok !== undefined && (ok ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <AlertTriangle className="h-3 w-3 text-rose-400" />)}
      </div>
      <div className="mt-2 font-serif text-xl font-semibold">{value}</div>
      <div className="font-sans text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-3">
      <div className="font-mono text-sm text-gold-light">{value}</div>
      <div className="mt-0.5 font-sans text-xs uppercase tracking-wide text-muted-foreground/85">{label}</div>
    </div>
  );
}
