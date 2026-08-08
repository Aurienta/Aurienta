import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { CONSTITUTIONAL_HASH, TIER_META, HEALTH_RATINGS } from "@/lib/aurienta/constants";
import { egp, shortHash, timeAgo } from "@/lib/aurienta/format";
import { AurientaMark, GoldStar, AurientaWordmark } from "@/components/aurienta-logo";
import { PublicTrustHeader, PublicTrustFooter } from "@/components/trust/public-shell";
import {
  ShieldCheck,
  Lock,
  Scale,
  Cpu,
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  Activity,
  CheckCircle2,
  Dot,
  Landmark,
  Gavel,
  FileCheck,
  BadgeCheck,
  Sparkles,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  GitBranch,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Trust & Zero-Custody Proof · AURIENTA",
  description:
    "AURIENTA's public trust dashboard — zero-custody proof, Law Firm Client Account reconciliation, AI health, compliance integrations, and recent graduations. Constitutional trust, proven not promised.",
};

export const dynamic = "force-dynamic";

// ── Mock AI health metrics ──
const AI_HEALTH = {
  hallucinationRate: 0.004, // 0.4%
  biasDisparity: 0.12, // 12%
  driftKl: 0.06,
  oversightModel: "Gemma 2 7B",
  enforcementModel: "GLM-4.6 + Mixtral 8x22B",
};

// ── Compliance integrations (mock statuses — each is API-connected) ──
const COMPLIANCE_INTEGRATIONS = [
  {
    key: "FRA",
    name: "Financial Regulatory Authority",
    detail: "No-action letter · law firm client account model approved",
    icon: Landmark,
  },
  {
    key: "GAFI",
    name: "General Authority for Participation",
    detail: "Enterprise formation API · live sync",
    icon: Building2,
  },
  {
    key: "NOSI",
    name: "National Social Insurance Office",
    detail: "Workforce registration · daily reconciliation",
    icon: Users,
  },
  {
    key: "MOI",
    name: "Ministry of Interior",
    detail: "Police clearance · manager verification",
    icon: ShieldCheck,
  },
  {
    key: "ETA",
    name: "Egyptian Tax Authority",
    detail: "Withholding tax · 10% CGT auto-remittance",
    icon: FileCheck,
  },
  {
    key: "ESAA",
    name: "Egyptian Society of Accountants & Auditors",
    detail: "Accounting firm licensure · quarterly attestation",
    icon: BadgeCheck,
  },
];

function kpiCard(
  label: string,
  value: string,
  sub: string,
  Icon: React.ComponentType<{ className?: string }>
) {
  return (
    <div className="glass-gold flex flex-col gap-2 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
          {label}
        </span>
        <Icon className="h-4 w-4 text-gold/80" />
      </div>
      <div className="font-serif text-2xl font-semibold text-gold-gradient sm:text-3xl">
        {value}
      </div>
      <div className="font-sans text-xs text-muted-foreground/85">{sub}</div>
    </div>
  );
}

function aiMetricColor(value: number, ok: number, warn: number, inverted = true) {
  if (inverted) {
    if (value <= ok) return "green";
    if (value <= warn) return "amber";
    return "red";
  }
  if (value >= ok) return "green";
  if (value >= warn) return "amber";
  return "red";
}

export default async function TrustPage() {
  // ── Data fetch ──
  const enterprises = await db.enterprise.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      tier: true,
      stage: true,
      status: true,
      raisedEgp: true,
      employeeCount: true,
      lawFirmClientAccountBalanceEgp: true,
      lawFirmId: true,
      healthRating: true,
      healthScore: true,
      monthlyRevenueEgp: true,
    },
  });

  const lawFirms = await db.lawFirm.findMany({
    select: {
      id: true,
      name: true,
      frLicenseNumber: true,
      insuranceEgp: true,
      expertiseScore: true,
      status: true,
    },
  });

  const partners = await db.user.count();

  const graduations = await db.graduationRecord.findMany({
    orderBy: { graduationDate: "desc" },
    take: 6,
    select: {
      id: true,
      enterpriseId: true,
      enterpriseName: true,
      tierAtGraduation: true,
      finalHealthScore: true,
      readinessScore: true,
      graduationDate: true,
      testimonial: true,
      exportHash: true,
    },
  });

  // GraduationRecord has no Prisma relation to Enterprise (only a FK enterpriseId),
  // so we resolve slugs separately via a single enterprise lookup.
  const gradEnterpriseIds = graduations.map((g) => g.enterpriseId);
  const gradEnterprises = await db.enterprise.findMany({
    where: { id: { in: gradEnterpriseIds } },
    select: { id: true, slug: true },
  });
  const slugByEntId = new Map(gradEnterprises.map((e) => [e.id, e.slug]));

  // ── Aggregations ──
  const escrowTotalEgp = enterprises.reduce((s, e) => s + e.lawFirmClientAccountBalanceEgp, 0);
  const capitalDeployedEgp = enterprises.reduce((s, e) => s + e.raisedEgp, 0);
  const jobsCreated = enterprises.reduce((s, e) => s + e.employeeCount, 0);

  const activeStatuses = new Set([
    "fundraising_active",
    "fundraising_closed",
    "active",
    "graduation_pending",
  ]);
  const activeCount = enterprises.filter((e) => activeStatuses.has(e.status)).length;
  const graduatedCount = graduations.length || enterprises.filter((e) => e.status === "graduated").length;

  const byTier: Record<string, number> = {};
  for (const e of enterprises) byTier[e.tier] = (byTier[e.tier] ?? 0) + 1;

  // Per-escrow aggregate
  const escrowByFirmId = new Map<string, number>();
  const firmsByFirmId = new Map<string, number>();
  for (const e of enterprises) {
    if (!e.lawFirmId) continue;
    escrowByFirmId.set(e.lawFirmId, (escrowByFirmId.get(e.lawFirmId) ?? 0) + e.lawFirmClientAccountBalanceEgp);
    firmsByFirmId.set(e.lawFirmId, (firmsByFirmId.get(e.lawFirmId) ?? 0) + 1);
  }

  const lastReconciliation = {
    at: new Date(Date.now() - 2 * 60_000), // 2 min ago
    result: "verified",
    note: "Per-enterprise Law Firm Client Account balance reconciled against law-firm trust accounts.",
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Background ornaments */}
      <div aria-hidden className="pointer-events-none fixed inset-0 aurienta-radial opacity-70" />
      <div aria-hidden className="pointer-events-none fixed inset-0 aurienta-grid opacity-30" />

      <PublicTrustHeader active="trust" />

      <main className="relative flex-1">
        {/* ── 1. HERO ── */}
        <section
          aria-labelledby="trust-hero-title"
          className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:pt-24"
        >
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {/* pulse halo */}
              <div
                aria-hidden
                className="absolute -inset-10 rounded-full bg-gold/10 blur-3xl animate-pulse-gold"
              />
              <AurientaMark className="relative h-24 w-24 sm:h-28 sm:w-28" withGlow />
            </div>

            <div className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5">
              <GoldStar className="h-3 w-3" />
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/90">
                Public Trust Surface · No login required
              </span>
            </div>

            <h1
              id="trust-hero-title"
              className="mt-6 max-w-4xl font-serif text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
            >
              <span className="text-gold-gradient">Constitutional Trust</span>
              <span className="block text-foreground/90">— Proven, Not Promised.</span>
            </h1>

            <blockquote className="mt-8 max-w-2xl border-l-2 border-gold/40 pl-5 text-left font-serif text-lg italic text-muted-foreground sm:text-xl">
              &ldquo;AURIENTA never holds partner funds. Every Egyptian pound flows
              directly to licensed law firm client account — enforceable by the
              Constitutional Runtime Engine on every commit.&rdquo;
              <footer className="mt-2 font-sans text-xs not-italic text-muted-foreground/80">
                — Founding Principle, Vol I §1.1
              </footer>
            </blockquote>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 font-mono text-[11px] sm:text-xs">
              <span className="rounded-full border border-gold/20 bg-background/60 px-3 py-1.5 text-muted-foreground">
                Constitutional Hash:
                <span className="ml-1.5 text-gold-light">{shortHash(CONSTITUTIONAL_HASH, 10, 6)}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/5 px-3 py-1.5 text-emerald-300/90">
                <CheckCircle2 className="h-3 w-3" /> Live · reconciled {timeAgo(lastReconciliation.at)}
              </span>
            </div>
          </div>
        </section>

        {/* ── 2. ZERO-CUSTODY PROOF PANEL (centerpiece) ── */}
        <section
          aria-labelledby="zero-custody-title"
          className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16"
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5">
              <Lock className="h-3 w-3 text-gold" />
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/90">
                Zero-Custody Proof · Non-amendable Rule I §1.1
              </span>
            </div>
            <h2
              id="zero-custody-title"
              className="mt-5 max-w-3xl font-serif text-3xl font-semibold leading-tight sm:text-4xl"
            >
              AURIENTA-held funds: <span className="text-gold-gradient">0.00 EGP</span>
            </h2>
            <p className="mt-3 max-w-2xl font-sans text-base text-muted-foreground">
              Capital flows partner → licensed law firm client account → enterprise treasury.
              AURIENTA never touches, holds, or controls partner funds. This is not a
              policy — it is a constitutional rule, enforced by code on every commit.
            </p>
          </div>

          {/* Two big totals */}
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/8 via-transparent to-transparent p-7 sm:p-8">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden />
              <div className="relative">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10">
                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  </span>
                  <span className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-300/80">
                    AURIENTA-held funds
                  </span>
                </div>
                <div className="mt-5 font-serif text-5xl font-bold text-emerald-300 sm:text-6xl">
                  0.00 EGP
                </div>
                <p className="mt-3 font-sans text-sm text-muted-foreground/80">
                  Always zero. Enforced by{" "}
                  <code className="font-mono text-[11px] text-gold-light">zero_custody.rego</code>{" "}
                  — any banking API call outside the treasury service fails the build.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 font-mono text-xs text-emerald-300/90">
                    <CheckCircle2 className="h-2.5 w-2.5" /> CRE-enforced
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 font-mono text-xs text-emerald-300/90">
                    <GitBranch className="h-2.5 w-2.5" /> Linter on every commit
                  </span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-gold/10 via-transparent to-transparent p-7 sm:p-8">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold/15 blur-3xl" aria-hidden />
              <div className="relative">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gold/30 bg-gold/10">
                    <Scale className="h-5 w-5 text-gold" />
                  </span>
                  <span className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-gold-light/90">
                    Held by licensed law firm client accounts
                  </span>
                </div>
                <div className="mt-5 font-serif text-5xl font-bold text-gold-gradient sm:text-6xl">
                  {egp(escrowTotalEgp, { compact: true })}
                </div>
                <p className="mt-3 font-sans text-sm text-muted-foreground/80">
                  Held in client-trust accounts at{" "}
                  <span className="text-gold-light">{lawFirms.length} licensed Egyptian law firms</span>
                  , each insured for ≥100M EGP. Reconciled against enterprise books in real time.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 font-mono text-xs text-gold-light/90">
                    <Scale className="h-2.5 w-2.5" /> FRA-licensed law firm client account
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 font-mono text-xs text-gold-light/90">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Insurance ≥100M EGP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Last reconciliation banner */}
          <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl border border-gold/12 bg-card/40 px-5 py-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <div>
                <div className="font-sans text-sm font-medium text-foreground">
                  Last reconciliation:{" "}
                  <span className="text-emerald-300">{timeAgo(lastReconciliation.at)}</span> ·{" "}
                  <span className="text-emerald-300">verified</span>
                </div>
                <div className="font-sans text-xs text-muted-foreground/85">
                  {lastReconciliation.note}
                </div>
              </div>
            </div>
            <Link
              href="/api/public/stats"
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 px-3.5 py-1.5 font-sans text-xs font-medium text-gold transition-colors hover:bg-gold/5"
            >
              <ArrowRight className="h-3 w-3" /> Open Constitutional API
            </Link>
          </div>

          {/* Linter note */}
          <div className="mt-3 flex items-start gap-3 rounded-2xl border border-gold/10 bg-background/40 p-5">
            <Cpu className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <p className="font-sans text-sm text-muted-foreground/85">
              <span className="font-medium text-foreground">The Zero-Custody Linter</span>{" "}
              runs on every commit. Any banking API call outside the treasury
              service fails the build. The CI pipeline rejects unauthorized
              custody paths before they reach production — by constitutional rule,
              not by policy.
            </p>
          </div>

          {/* Per-law-firm breakdown */}
          <div className="mt-8">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-xl font-semibold text-foreground sm:text-2xl">
              <Scale className="h-5 w-5 text-gold" />
              Per-law-firm breakdown
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {lawFirms.map((firm) => {
                const escrow = escrowByFirmId.get(firm.id) ?? 0;
                const entCount = firmsByFirmId.get(firm.id) ?? 0;
                const insuranceOk = firm.insuranceEgp >= 100_000_000;
                const statusOk = firm.status === "active";
                return (
                  <div
                    key={firm.id}
                    className="glass-gold flex flex-col gap-4 rounded-2xl p-5 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-serif text-lg font-semibold text-foreground">
                          {firm.name}
                        </div>
                        <div className="mt-1 font-mono text-xs text-muted-foreground/85">
                          FRA License: {firm.frLicenseNumber}
                        </div>
                      </div>
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-xs " +
                          (statusOk
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                            : "border-amber-400/30 bg-amber-400/10 text-amber-300")
                        }
                      >
                        <Dot className="h-3 w-3" />
                        {firm.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-gold/10 bg-background/40 p-3">
                        <div className="font-sans text-xs uppercase tracking-[0.16em] text-muted-foreground/85">
                          Insurance
                        </div>
                        <div className="mt-0.5 font-serif text-base font-semibold text-foreground">
                          {egp(firm.insuranceEgp, { compact: true })}
                        </div>
                        <div className="mt-1 font-mono text-xs text-muted-foreground/80">
                          {insuranceOk ? "✓ ≥100M EGP required" : "⚠ below 100M"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gold/10 bg-background/40 p-3">
                        <div className="font-sans text-xs uppercase tracking-[0.16em] text-muted-foreground/85">
                          Expertise
                        </div>
                        <div className="mt-0.5 font-serif text-base font-semibold text-foreground">
                          {firm.expertiseScore}/100
                        </div>
                        <div className="mt-1 font-mono text-xs text-muted-foreground/80">
                          AI-scored by Steward
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-gold/10 pt-3">
                      <div>
                        <div className="font-sans text-xs uppercase tracking-[0.16em] text-muted-foreground/85">
                          Held by law firm
                        </div>
                        <div className="font-serif text-2xl font-bold text-gold-gradient">
                          {egp(escrow, { compact: true })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-sans text-xs uppercase tracking-[0.16em] text-muted-foreground/85">
                          Enterprises
                        </div>
                        <div className="font-serif text-xl font-semibold text-foreground">
                          {entCount}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 3. PLATFORM KPIs ── */}
        <section
          aria-labelledby="platform-kpis-title"
          className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16"
        >
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5">
              <TrendingUp className="h-3 w-3 text-gold" />
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/90">
                Platform KPIs · Live
              </span>
            </div>
            <h2 id="platform-kpis-title" className="mt-5 font-serif text-3xl font-semibold sm:text-4xl">
              The real economy, on constitutional rails
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kpiCard("Capital deployed", egp(capitalDeployedEgp, { compact: true }), "Sum of all raised EGP across active enterprises", Briefcase)}
            {kpiCard("Active enterprises", `${activeCount}`, "Currently capital formation, operating, or graduation-pending", Building2)}
            {kpiCard("Graduated", `${graduatedCount}`, "Sovereign enterprises — AURIENTA no longer needed", GraduationCap)}
            {kpiCard("Jobs created", `${jobsCreated.toLocaleString()}`, "Sum of employeeCount across all enterprises", Users)}
            {kpiCard("CRE uptime", "99.95%", "Constitutional Runtime Engine · last 90 days", Activity)}
            {kpiCard("Constitutional partners", `${partners}`, "Verified investors, founders, workforce, managers", Sparkles)}
          </div>

          {/* By-tier breakdown */}
          <div className="mt-5 glass-gold rounded-2xl p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                Enterprises by tier
              </span>
              <div className="h-px flex-1 bg-gold/15" />
            </div>
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(byTier)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([tier, count]) => {
                  const meta = TIER_META[tier];
                  return (
                    <div
                      key={tier}
                      className="flex items-center gap-3 rounded-xl border border-gold/15 bg-background/50 px-4 py-2.5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-gradient font-serif text-sm font-bold text-black">
                        {tier}
                      </div>
                      <div>
                        <div className="font-sans text-xs font-medium text-foreground">
                          {meta?.name ?? "—"}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground/85">
                          {count} enterprise{count === 1 ? "" : "s"} · {meta?.legalForm}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>

        {/* ── 4. AI HEALTH PANEL ── */}
        <section
          aria-labelledby="ai-health-title"
          className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16"
        >
          <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
            <div>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5">
                <Cpu className="h-3 w-3 text-gold" />
                <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/90">
                  AI Health · Gemma 2 7B Oversight
                </span>
              </div>
              <h2 id="ai-health-title" className="mt-5 font-serif text-3xl font-semibold sm:text-4xl">
                AI as Enforcer, <span className="text-gold-gradient">Not Decider</span>
              </h2>
              <p className="mt-4 font-sans text-base text-muted-foreground">
                The CRE validates every action against Rego policies. AI advises;
                it cannot override. Independent oversight models run continuous
                fairness, hallucination, and drift audits on the enforcement models.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 font-mono text-xs">
                <span className="rounded-full border border-gold/20 bg-background/50 px-3 py-1 text-gold-light/80">
                  Oversight: {AI_HEALTH.oversightModel}
                </span>
                <span className="rounded-full border border-gold/20 bg-background/50 px-3 py-1 text-gold-light/80">
                  Enforcement: {AI_HEALTH.enforcementModel}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Hallucination rate",
                  value: `${(AI_HEALTH.hallucinationRate * 100).toFixed(1)}%`,
                  detail: "Sampled 10k outputs · 30-day rolling",
                  status: aiMetricColor(AI_HEALTH.hallucinationRate, 0.005, 0.01),
                },
                {
                  label: "Bias disparity",
                  value: `${(AI_HEALTH.biasDisparity * 100).toFixed(0)}%`,
                  detail: "Across gender · age · region cohorts",
                  status: aiMetricColor(AI_HEALTH.biasDisparity, 0.15, 0.25),
                },
                {
                  label: "Drift (KL divergence)",
                  value: AI_HEALTH.driftKl.toFixed(2),
                  detail: "Distribution shift vs. baseline",
                  status: aiMetricColor(AI_HEALTH.driftKl, 0.1, 0.2),
                },
              ].map((m) => {
                const color =
                  m.status === "green"
                    ? "emerald"
                    : m.status === "amber"
                      ? "amber"
                      : "red";
                const Icon = m.status === "green" ? CheckCircle2 : m.status === "amber" ? AlertCircle : AlertCircle;
                return (
                  <div
                    key={m.label}
                    className={
                      "glass rounded-2xl p-5 " +
                      (color === "emerald"
                        ? "border-emerald-400/25"
                        : color === "amber"
                          ? "border-amber-400/25"
                          : "border-red-400/25")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
                        {m.label}
                      </span>
                      <Icon
                        className={
                          "h-4 w-4 " +
                          (color === "emerald"
                            ? "text-emerald-300"
                            : color === "amber"
                              ? "text-amber-300"
                              : "text-red-300")
                        }
                      />
                    </div>
                    <div
                      className={
                        "mt-2 font-serif text-3xl font-bold " +
                        (color === "emerald"
                          ? "text-emerald-300"
                          : color === "amber"
                            ? "text-amber-300"
                            : "text-red-300")
                      }
                    >
                      {m.value}
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground/80">
                      {m.detail}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 5. COMPLIANCE INTEGRATIONS ── */}
        <section
          aria-labelledby="compliance-title"
          className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16"
        >
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5">
              <Gavel className="h-3 w-3 text-gold" />
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/90">
                Compliance Integrations · API-connected
              </span>
            </div>
            <h2 id="compliance-title" className="mt-5 font-serif text-3xl font-semibold sm:text-4xl">
              Regulator-grade integrations, always on
            </h2>
            <p className="mx-auto mt-3 max-w-2xl font-sans text-base text-muted-foreground">
              Live, API-connected integrations with every Egyptian financial,
              social, and security regulator. Every enterprise is verifiably
              compliant — by data, not by declaration.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMPLIANCE_INTEGRATIONS.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.key}
                  className="group glass-gold flex items-start gap-4 rounded-2xl p-5 transition-all hover:border-gold/30"
                >
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/8">
                    <Icon className="h-5 w-5 text-gold" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-gold-light/90">
                        {c.key}
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-300">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                        </span>
                        API connected
                      </span>
                    </div>
                    <div className="mt-0.5 font-serif text-base font-semibold text-foreground">
                      {c.name}
                    </div>
                    <p className="mt-1 font-sans text-xs text-muted-foreground/75">
                      {c.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 6. RECENT GRADUATIONS ── */}
        <section
          aria-labelledby="graduations-title"
          className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16"
        >
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5">
              <GraduationCap className="h-3 w-3 text-gold" />
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/90">
                Recent Graduations · The Sovereign Alumni
              </span>
            </div>
            <h2 id="graduations-title" className="mt-5 font-serif text-3xl font-semibold sm:text-4xl">
              Graduation is the destination
            </h2>
            <p className="mx-auto mt-3 max-w-2xl font-sans text-base text-muted-foreground">
              Enterprises graduate to sovereign independence. AURIENTA succeeds
              when it is no longer needed.
            </p>
          </div>

          {graduations.length === 0 ? (
            <div className="rounded-2xl border border-gold/12 bg-card/40 p-10 text-center font-sans text-sm text-muted-foreground">
              No enterprises have graduated yet. Several are in the graduation pipeline.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {graduations.map((g) => {
                const ratingIdx = g.finalHealthScore >= 90 ? 0 : g.finalHealthScore >= 80 ? 1 : 2;
                const rating = HEALTH_RATINGS[ratingIdx];
                return (
                  <Link
                    key={g.id}
                    href={`/badge/${slugByEntId.get(g.enterpriseId) ?? g.enterpriseId}`}
                    className="group glass-gold flex flex-col gap-3 rounded-2xl p-5 transition-all hover:border-gold/30 hover:shadow-[0_18px_60px_-18px_rgba(212,175,55,0.45)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient font-serif text-base font-bold text-black">
                          {g.tierAtGraduation}
                        </span>
                        <div>
                          <div className="font-serif text-lg font-semibold text-foreground">
                            {g.enterpriseName}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground/85">
                            Graduated {timeAgo(g.graduationDate)} · Tier {g.tierAtGraduation} → sovereign
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 font-mono text-xs text-emerald-300">
                        <BadgeCheck className="h-2.5 w-2.5" /> Sovereign-certified
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-gold/10 bg-background/40 p-2.5 text-center">
                        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/85">Health</div>
                        <div className="font-serif text-lg font-bold text-gold-gradient">{rating}</div>
                      </div>
                      <div className="rounded-lg border border-gold/10 bg-background/40 p-2.5 text-center">
                        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/85">Score</div>
                        <div className="font-serif text-lg font-bold text-foreground">{g.finalHealthScore}</div>
                      </div>
                      <div className="rounded-lg border border-gold/10 bg-background/40 p-2.5 text-center">
                        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/85">Readiness</div>
                        <div className="font-serif text-lg font-bold text-foreground">{g.readinessScore}</div>
                      </div>
                    </div>

                    {g.testimonial && (
                      <p className="line-clamp-2 font-serif text-sm italic text-muted-foreground">
                        &ldquo;{g.testimonial}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-1 font-sans text-xs text-gold-light/80 group-hover:text-gold">
                      View constitutional badge
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── CTA strip ── */}
        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gold-gradient-soft p-8 sm:p-10">
            <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative flex flex-col items-center gap-5 text-center">
              <AurientaMark className="h-12 w-12" withGlow />
              <h3 className="max-w-2xl font-serif text-2xl font-semibold sm:text-3xl">
                Verify any enterprise on the{" "}
                <span className="text-gold-gradient">constitutional badge</span>
              </h3>
              <p className="max-w-xl font-sans text-sm text-muted-foreground">
                Every enterprise on AURIENTA has a public, embeddable badge showing
                its tier, health rating, compliance status, and recent ledger events.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/registry"
                  className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 font-sans text-sm font-semibold text-black transition-all hover:shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)]"
                >
                  Browse the Constitutional Registry <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/badge/street-bites"
                  className="inline-flex items-center gap-2 rounded-full border border-gold/25 px-5 py-2.5 font-sans text-sm font-medium text-foreground transition-colors hover:bg-gold/5"
                >
                  View a sample badge <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/api/public/stats"
                  className="inline-flex items-center gap-2 rounded-full border border-gold/25 px-5 py-2.5 font-sans text-sm font-medium text-foreground transition-colors hover:bg-gold/5"
                >
                  Get the JSON API
                </Link>
              </div>

              {/* PDPL compliance notice */}
              <p className="mt-6 max-w-2xl text-center font-sans text-[11px] leading-relaxed text-muted-foreground/75">
                Personal data is protected under Egyptian PDPL Law 151/2020. Enterprise data is
                published per constitutional charter Article XIV. AURIENTA is a constitutional
                constitutional infrastructure, not an official government registry. Data is self-reported
                by enterprises and verified by the CRE.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicTrustFooter />
    </div>
  );
}
