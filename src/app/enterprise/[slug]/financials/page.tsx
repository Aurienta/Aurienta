import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { PublicTrustHeader, PublicTrustFooter } from "@/components/trust/public-shell";
import { QuarterlyFinancialsChart } from "@/components/transparency/quarterly-financials-chart";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { TIER_META, STAGE_META, CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { egp, pct, shortHash } from "@/lib/aurienta/format";
import {
  ArrowLeft,
  Building2,
  HeartPulse,
  Scale,
  ShieldCheck,
  TrendingUp,
  Users,
  Activity,
  AlertCircle,
  Sparkles,
  Gauge,
  FileBox,
  Wallet,
  Flame,
} from "lucide-react";
import { BrainAiFinancialNarrative } from "@/components/transparency/brain-ai-financial-narrative";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ent = await db.enterprise.findUnique({
    where: { slug },
    select: { name: true, tagline: true },
  });
  if (!ent) return { title: "Financials not found · AURIENTA" };
  return {
    title: `${ent.name} · Real-Time Financials · AURIENTA`,
    description: `Real-time enterprise financials for ${ent.name} — revenue, burn, runway, Law Firm Client Account balance, health rating. Constitutionally disclosed per Article XIV.`,
  };
}

export default async function EnterpriseFinancialsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ent = await db.enterprise.findUnique({
    where: { slug },
    include: {
      lawFirm: { select: { name: true, frLicenseNumber: true } },
      accountingFirm: { select: { name: true, esaaLicense: true } },
      quarterlyReports: { orderBy: [{ year: "desc" }, { quarter: "asc" }], take: 8 },
    },
  });

  if (!ent) notFound();

  const tierMeta = TIER_META[ent.tier];
  const stageMeta = STAGE_META[ent.stage] ?? STAGE_META.stage_1;
  const runwayMonths =
    ent.monthlyBurnEgp > 0 ? ent.lawFirmClientAccountBalanceEgp / ent.monthlyBurnEgp : null;

  const quarterly = ent.quarterlyReports.slice().reverse().slice(-6);

  // Build the public financial snapshot that the Brain AI client will explain.
  const financialsSnapshot = {
    name: ent.name,
    tier: ent.tier,
    stage: ent.stage,
    sector: ent.sector,
    monthlyRevenueEgp: ent.monthlyRevenueEgp,
    monthlyBurnEgp: ent.monthlyBurnEgp,
    lawFirmClientAccountBalanceEgp: ent.lawFirmClientAccountBalanceEgp,
    runwayMonths: runwayMonths ? Number(runwayMonths.toFixed(1)) : null,
    grossMarginPct: ent.grossMarginPct,
    revenueGrowthPct: ent.revenueGrowthPct,
    employeeCount: ent.employeeCount,
    nosiCompliantPct: ent.nosiCompliantPct,
    healthScore: ent.healthScore,
    healthRating: ent.healthRating,
    raisedEgp: ent.raisedEgp,
    fundraisingGoalEgp: ent.fundraisingGoalEgp,
    equityUnitPriceEgp: ent.equityUnitPriceEgp,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicTrustHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 font-sans text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href={`/enterprise/${ent.slug}`} className="transition-colors hover:text-gold">
              <span className="inline-flex items-center gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> {ent.name}
              </span>
            </Link>
            <span aria-hidden>/</span>
            <span className="text-gold-light/85">Real-time financials</span>
          </nav>

          {/* Hero */}
          <section className="mt-6 overflow-hidden rounded-3xl border border-gold/15 glass-gold p-6 sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2.5">
                <AurientaMark className="h-8 w-8" />
                <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-gold-light/85">
                  Tier {ent.tier} · {tierMeta?.legalForm ?? ent.legalForm} · {stageMeta.name}
                </span>
              </div>
              <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.05] sm:text-5xl">
                {ent.name}
                <span className="ml-3 font-sans text-sm font-normal text-muted-foreground">
                  Real-time financials
                </span>
              </h1>
              <p className="mt-3 max-w-3xl font-sans text-sm leading-relaxed text-muted-foreground">
                Enterprise-level financial data published under constitutional charter Article XIV.
                Like a company&apos;s public annual report — refreshed per milestone release, audited annually.
              </p>

              {/* Vital signs row */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <VitalSign
                  icon={Wallet}
                  label="Monthly revenue"
                  value={egp(ent.monthlyRevenueEgp)}
                  hint={`Gross margin ${pct(ent.grossMarginPct, 0)}`}
                />
                <VitalSign
                  icon={Flame}
                  label="Monthly burn"
                  value={egp(ent.monthlyBurnEgp)}
                  hint={`YoY growth ${pct(ent.revenueGrowthPct, 0)}`}
                />
                <VitalSign
                  icon={Scale}
                  label="Law Firm Client Account balance"
                  value={egp(ent.lawFirmClientAccountBalanceEgp)}
                  hint="Law-firm controlled · Zero Custody"
                />
                <VitalSign
                  icon={Gauge}
                  label="Runway"
                  value={runwayMonths !== null ? `${runwayMonths.toFixed(1)} months` : "—"}
                  hint={runwayMonths !== null && runwayMonths < 6 ? "⚠ Below 6-month alert" : "Above 6-month floor"}
                />
              </div>
            </div>
          </section>

          {/* PDPL notice */}
          <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.04] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <div>
                <div className="font-sans text-xs font-semibold uppercase tracking-wide text-emerald-200/90">
                  PDPL Compliance — Egyptian Law 151/2020
                </div>
                <p className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground/85">
                  Personal data is protected under Egyptian PDPL Law 151/2020. Enterprise data is
                  published per constitutional charter Article XIV. Partner identities are anonymized.
                </p>
              </div>
            </div>
          </div>

          {/* Health + key metrics */}
          <section className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-gold" />
                <h2 className="font-serif text-lg font-semibold">Health rating</h2>
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-serif text-5xl font-bold text-gold-gradient">
                  {ent.healthRating ?? "—"}
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  {ent.healthScore}/100
                </span>
              </div>
              <p className="mt-3 font-sans text-xs leading-relaxed text-muted-foreground/85">
                AAA–CCC constitutional rating derived from runway, revenue growth, gross margin,
                NOSI compliance, and police clearance. Recomputed per milestone release.
              </p>
            </div>

            <div className="rounded-2xl border border-gold/15 glass p-5 sm:p-6 lg:col-span-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gold" />
                <h2 className="font-serif text-lg font-semibold">Vital signs</h2>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <VitalMetric label="Gross margin" value={pct(ent.grossMarginPct, 1)} />
                <VitalMetric label="Revenue growth" value={pct(ent.revenueGrowthPct, 1)} />
                <VitalMetric label="NOSI compliance" value={pct(ent.nosiCompliantPct, 0)} />
                <VitalMetric
                  label="Police clearance"
                  value={ent.policeClearanceValid ? "Valid" : "Expired"}
                  tone={ent.policeClearanceValid ? "ok" : "alert"}
                />
                <VitalMetric label="Employees" value={`${ent.employeeCount}`} />
                <VitalMetric label="Share price (CPP)" value={egp(ent.equityUnitPriceEgp)} />
                <VitalMetric label="Capital Participated" value={egp(ent.raisedEgp, { compact: true })} />
                <VitalMetric label="Goal" value={egp(ent.fundraisingGoalEgp, { compact: true })} />
              </div>
            </div>
          </section>

          {/* Quarterly chart */}
          <section className="mt-8">
            <QuarterlyFinancialsChart
              reports={quarterly.map((q) => ({
                quarter: `${q.year} ${q.quarter}`,
                revenue: q.revenueEgp,
                grossProfit: q.grossProfitEgp,
                netProfit: q.netProfitEgp,
                grossMarginPct: q.grossMarginPct,
              }))}
            />
          </section>

          {/* Brain AI narrative */}
          <section className="mt-8">
            <BrainAiFinancialNarrative
              enterpriseId={ent.id}
              enterpriseName={ent.name}
              financials={financialsSnapshot}
            />
          </section>

          {/* Counterparties */}
          <section className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-gold/15 glass p-5">
              <div className="flex items-center gap-2">
                <Scale className="h-3.5 w-3.5 text-gold" />
                <span className="font-sans text-xs uppercase tracking-[0.16em] text-muted-foreground/85">
                  Law firm client account
                </span>
              </div>
              <div className="mt-1 font-serif text-base font-semibold">{ent.lawFirm?.name ?? "Pending assignment"}</div>
              <div className="font-mono text-xs text-muted-foreground/85">
                {ent.lawFirm ? `FRA License ${ent.lawFirm.frLicenseNumber}` : "—"}
              </div>
            </div>
            <div className="rounded-2xl border border-gold/15 glass p-5">
              <div className="flex items-center gap-2">
                <FileBox className="h-3.5 w-3.5 text-gold" />
                <span className="font-sans text-xs uppercase tracking-[0.16em] text-muted-foreground/85">
                  Accounting firm
                </span>
              </div>
              <div className="mt-1 font-serif text-base font-semibold">{ent.accountingFirm?.name ?? "Pending assignment"}</div>
              <div className="font-mono text-xs text-muted-foreground/85">
                {ent.accountingFirm ? `ESAA ${ent.accountingFirm.esaaLicense}` : "—"}
              </div>
            </div>
          </section>

          {/* Disclaimer + hash */}
          <section className="mt-8 rounded-2xl border border-gold/12 bg-foreground/[0.02] p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
              <div className="space-y-2">
                <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                  <strong className="text-foreground/90">Data updated per milestone release.</strong>{" "}
                  Audited annually per constitutional charter. The Brain AI narrative is advisory —
                  the CRE remains the single source of truth for constitutional enforcement.
                </p>
                <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                  AURIENTA is a constitutional constitutional infrastructure, not an official government
                  registry. Data is self-reported by enterprises and verified by the CRE.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px] text-muted-foreground/85">
                  <span className="rounded-full border border-gold/15 bg-background/50 px-2.5 py-1">
                    Constitutional Hash: <span className="text-gold-light">{shortHash(CONSTITUTIONAL_HASH, 10, 6)}</span>
                  </span>
                  <span className="rounded-full border border-gold/15 bg-background/50 px-2.5 py-1">
                    Article XIV · Real-time transparency
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Quick links */}
          <section className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/enterprise/${ent.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-2 font-sans text-xs text-foreground transition-colors hover:bg-gold/5"
            >
              <Building2 className="h-3.5 w-3.5" /> Enterprise profile
            </Link>
            <Link
              href={`/enterprise/${ent.slug}/governance-log`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-2 font-sans text-xs text-foreground transition-colors hover:bg-gold/5"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> CRE decision log
            </Link>
            <Link
              href={`/enterprise/${ent.slug}/trades`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-2 font-sans text-xs text-foreground transition-colors hover:bg-gold/5"
            >
              <TrendingUp className="h-3.5 w-3.5" /> Trade log
            </Link>
            <Link
              href={`/enterprise/${ent.slug}/annual-report`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-2 font-sans text-xs text-foreground transition-colors hover:bg-gold/5"
            >
              <Sparkles className="h-3.5 w-3.5" /> Annual report
            </Link>
            <Link
              href={`/badge/${ent.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-2 font-sans text-xs text-foreground transition-colors hover:bg-gold/5"
            >
              <Users className="h-3.5 w-3.5" /> Constitutional badge
            </Link>
          </section>
        </div>
      </main>

      <PublicTrustFooter />
    </div>
  );
}

function VitalSign({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-4">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/85">
        <Icon className="h-3 w-3 text-gold/80" /> {label}
      </div>
      <div className="mt-1.5 font-serif text-xl font-bold text-gold-gradient">{value}</div>
      {hint && <div className="mt-0.5 font-mono text-[11px] text-muted-foreground/80">{hint}</div>}
    </div>
  );
}

function VitalMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "alert";
}) {
  const toneCls =
    tone === "ok"
      ? "text-emerald-300"
      : tone === "alert"
      ? "text-amber-300"
      : "text-foreground";
  return (
    <div className="rounded-lg border border-gold/12 bg-foreground/[0.02] p-3">
      <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/85">
        {label}
      </div>
      <div className={`mt-1 font-mono text-sm ${toneCls}`}>{value}</div>
    </div>
  );
}
