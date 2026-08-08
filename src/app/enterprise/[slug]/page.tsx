import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { PublicTrustHeader, PublicTrustFooter } from "@/components/trust/public-shell";
import { QuarterlyFinancialsChart } from "@/components/transparency/quarterly-financials-chart";
import { OwnershipSunburst } from "@/components/transparency/ownership-sunburst";
import { HealthRadar } from "@/components/transparency/health-radar";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { ShareButton } from "@/components/dashboard/share-button";
import { LiveLedgerTicker } from "@/components/dashboard/live-ticker";
import { TIER_META, STAGE_META } from "@/lib/aurienta/constants";
import { egp, pct, shortHash, timeAgo } from "@/lib/aurienta/format";
import { ArrowLeft, Building2, HeartPulse, Scale, ShieldCheck, TrendingUp, Users, FileText, ScrollText, Activity } from "lucide-react";
import { TransparencyScoreBadge } from "@/components/transparency/transparency-score-badge";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ent = await db.enterprise.findUnique({ where: { slug }, select: { name: true, tagline: true, description: true } });
  if (!ent) return { title: "Enterprise not found · AURIENTA" };
  return {
    title: `${ent.name} · Enterprise Profile · AURIENTA`,
    description: ent.tagline ?? ent.description.slice(0, 160),
  };
}

export default async function EnterpriseProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ent = await db.enterprise.findUnique({
    where: { slug },
    include: {
      founder: { select: { legalName: true, avatarColor: true, sovereignTrustScore: true, tier: true } },
      lawFirm: { select: { name: true, frLicenseNumber: true, insuranceEgp: true } },
      accountingFirm: { select: { name: true, esaaLicense: true } },
      ownershipRecords: { take: 200, orderBy: { equityUnits: "desc" }, include: { user: { select: { legalName: true, avatarColor: true, primaryIntent: true } } } },
      quarterlyReports: { orderBy: [{ year: "desc" }, { quarter: "asc" }], take: 8 },
      ledgerEvents: { orderBy: { timestamp: "desc" }, take: 6, select: { id: true, eventType: true, timestamp: true, payloadHash: true, payload: true } },
      vendors: { take: 30, orderBy: { totalPaidYtdEgp: "desc" } },
    },
  });

  if (!ent) notFound();

  const tierMeta = TIER_META[ent.tier];
  const stageMeta = STAGE_META[ent.stage] ?? STAGE_META.stage_1;
  const totalEquityUnits = ent.totalEquityUnits;
  const founderShares = Math.round((totalEquityUnits * ent.founderEquityPct) / 100);
  const partnerShares = ent.ownershipRecords.reduce((s, h) => s + h.equityUnits, 0);
  const reserveShares = Math.max(0, totalEquityUnits - founderShares - partnerShares);
  const partnerCount = ent.ownershipRecords.filter((h) => h.equityUnits > 0).length;
  const goalPct = ent.fundraisingGoalEgp > 0
    ? (ent.raisedEgp / ent.fundraisingGoalEgp) * 100
    : 0;

  const ownershipSlices = [
    { label: "Founder", value: founderShares, color: "#d4af37" },
    { label: "investors", value: partnerShares, color: "#f4d676" },
    { label: "Reserve pool", value: reserveShares, color: "#8a6d1f" },
  ].filter((s) => s.value > 0);

  // Last 6 quarterly reports for the chart (oldest → newest).
  const quarterly = ent.quarterlyReports.slice().reverse().slice(-6);

  // Health radar metrics.
  const runway = ent.monthlyBurnEgp > 0 ? ent.lawFirmClientAccountBalanceEgp / ent.monthlyBurnEgp : 99;
  const radarAxes = [
    { axis: "Runway", value: Math.min(runway / 18, 1) },
    { axis: "Revenue growth", value: Math.min(ent.revenueGrowthPct / 40, 1) },
    { axis: "Gross margin", value: Math.min(ent.grossMarginPct / 50, 1) },
    { axis: "NOSI", value: ent.nosiCompliantPct / 100 },
    { axis: "Health score", value: (ent.healthScore ?? 0) / 100 },
    { axis: "Police clearance", value: ent.policeClearanceValid ? 1 : 0 },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicTrustHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          {/* Breadcrumb */}
          <Link
            href="/trust"
            className="inline-flex items-center gap-1.5 font-sans text-xs text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Trust Dashboard
          </Link>

          {/* Hero */}
          <section className="mt-6 overflow-hidden rounded-3xl border border-gold/15 glass-gold p-6 sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <AurientaMark className="h-8 w-8" />
                  <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-gold-light/85">
                    Tier {ent.tier} · {tierMeta?.legalForm ?? ent.legalForm} · {stageMeta.name}
                  </span>
                </div>
                <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.05] sm:text-5xl">
                  {ent.name}
                </h1>
                {ent.tagline && (
                  <p className="mt-2 font-serif text-lg italic text-gold-light/80">{ent.tagline}</p>
                )}
                <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-muted-foreground">
                  {ent.description}
                </p>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-md">
                <HeroStat label="Health rating" value={ent.healthRating ?? "—"} icon={HeartPulse} />
                <HeroStat label="Share price" value={egp(ent.equityUnitPriceEgp)} icon={TrendingUp} />
                <HeroStat label="Capital Participated" value={egp(ent.raisedEgp, { compact: true })} icon={Building2} />
                <HeroStat label="Goal" value={egp(ent.fundraisingGoalEgp, { compact: true })} icon={Scale} />
              </div>
            </div>

            {/* Share button — Brain AI composes a constitutional share message */}
            <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gold/10 pt-5">
              <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/85">
                <GoldStar className="h-2.5 w-2.5 text-gold/70" />
                Noncustodial · Law Firm Client Account · AI-enforced governance
              </div>
              <ShareButton
                enterpriseId={ent.id}
                enterpriseSlug={ent.slug}
                enterpriseName={ent.name}
                size="sm"
                label="Share this enterprise"
              />
            </div>
          </section>

          {/* Constitutional Partners section — partner wall + progress bar */}
          <section className="mt-8 rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/8">
                  <Users className="h-4 w-4 text-gold" />
                </span>
                <div>
                  <h2 className="font-serif text-lg font-semibold">Constitutional Partners</h2>
                  <p className="font-sans text-xs text-muted-foreground">
                    Real-economy owners, not speculators — every partner is hash-anchored on the ledger.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="text-right">
                  <div className="font-serif text-base font-semibold text-gold-light">{partnerCount}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/85">Partner{partnerCount === 1 ? "" : "s"}</div>
                </div>
                <div className="h-8 w-px bg-gold/15" />
                <div className="text-right">
                  <div className="font-serif text-base font-semibold text-gold-light">{egp(ent.raisedEgp, { compact: true })}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/85">Total raised</div>
                </div>
              </div>
            </div>

            {/* PDPL compliance notice */}
            <p className="mt-3 font-sans text-[11px] leading-relaxed text-muted-foreground/80">
              Personal data is protected under Egyptian PDPL Law 151/2020. Enterprise data is published
              per constitutional charter Article XIV. Individual partner names are not displayed publicly
              unless a partner opts in via the partner-wall setting (rolling out Q1 2026). The
              constitutional ledger transparently records every equity transfer without exposing
              personal identity.
            </p>

            {/* Gold-themed progress bar — raised / goal */}
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-xs">
                <span className="text-muted-foreground/85">
                  {pct(goalPct, 1)} of capital participation goal
                </span>
                <span className="text-gold-light">
                  {egp(ent.raisedEgp, { compact: true })} / {egp(ent.fundraisingGoalEgp, { compact: true })}
                </span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full border border-gold/20 bg-background/50">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#8a6d1f] via-[#d4af37] to-[#f4d676] transition-all"
                  style={{ width: `${Math.min(100, goalPct).toFixed(2)}%` }}
                  role="progressbar"
                  aria-valuenow={Number(goalPct.toFixed(1))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Capital Formation progress"
                >
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              </div>
              {/* Milestone markers */}
              <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground/70">
                {[25, 50, 75, 100].map((m) => (
                  <span
                    key={m}
                    className={goalPct >= m ? "font-semibold text-gold-light" : ""}
                  >
                    {m}%
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Public transparency quick-links — financials, governance log, trades, annual report */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PublicLinkCard
              href={`/enterprise/${ent.slug}/financials`}
              icon={TrendingUp}
              label="Real-time financials"
              hint="Revenue · burn · runway · Brain AI narrative"
            />
            <PublicLinkCard
              href={`/enterprise/${ent.slug}/governance-log`}
              icon={ScrollText}
              label="CRE decision log"
              hint="Every policy verdict · Ed25519-signed"
            />
            <PublicLinkCard
              href={`/enterprise/${ent.slug}/trades`}
              icon={Activity}
              label="Trade log"
              hint="Filled orders · ±5% price band · anonymized"
            />
            <PublicLinkCard
              href={`/enterprise/${ent.slug}/annual-report`}
              icon={FileText}
              label="Annual report"
              hint="Brain AI assessment · auditor attestation"
            />
          </section>

          {/* Transparency score (live from public API) */}
          <section className="mt-6">
            <TransparencyScoreBadge slug={ent.slug} />
          </section>

          {/* Charts row */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <QuarterlyFinancialsChart reports={quarterly.map((q) => ({
                quarter: `${q.year} ${q.quarter}`,
                revenue: q.revenueEgp,
                grossProfit: q.grossProfitEgp,
                netProfit: q.netProfitEgp,
                grossMarginPct: q.grossMarginPct,
              }))} />
            </div>
            <HealthRadar axes={radarAxes} healthScore={ent.healthScore ?? 0} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <OwnershipSunburst slices={ownershipSlices} totalEquityUnits={totalEquityUnits} />

            {/* Counterparties */}
            <div className="lg:col-span-2 rounded-2xl border border-gold/15 glass p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gold" />
                <h2 className="font-serif text-lg font-semibold">Counterparties & custody</h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <CounterpartyCard
                  label="Law firm client account"
                  name={ent.lawFirm?.name ?? "Pending assignment"}
                  sub={ent.lawFirm ? `FRA Lic. ${ent.lawFirm.frLicenseNumber}` : "—"}
                  stat={ent.lawFirm ? `Insured ${egp(ent.lawFirm.insuranceEgp, { compact: true })}` : ""}
                  ok={!!ent.lawFirm}
                />
                <CounterpartyCard
                  label="Accounting firm"
                  name={ent.accountingFirm?.name ?? "Pending assignment"}
                  sub={ent.accountingFirm ? `ESAA ${ent.accountingFirm.esaaLicense}` : "—"}
                  ok={!!ent.accountingFirm}
                />
                <CounterpartyCard
                  label="Founder"
                  name={ent.founder.legalName}
                  sub={`STS ${ent.founder.sovereignTrustScore} · ${ent.founder.tier}`}
                  ok
                />
                <CounterpartyCard
                  label="Law Firm Client Account balance"
                  name={egp(ent.lawFirmClientAccountBalanceEgp)}
                  sub={`Runway ${runway.toFixed(1)} mo @ ${egp(ent.monthlyBurnEgp, { compact: true })}/mo burn`}
                  ok={ent.lawFirmClientAccountBalanceEgp > 0}
                />
              </div>

              {/* Vendor concentration preview */}
              {ent.vendors.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center gap-2">
                    <GoldStar className="h-3 w-3" />
                    <h3 className="font-serif text-sm font-semibold">Top vendors (YTD)</h3>
                    <span className="ml-auto font-mono text-xs text-muted-foreground/80">
                      {ent.vendors.length} vendor{ent.vendors.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <ul className="mt-2 divide-y divide-gold/8">
                    {ent.vendors.slice(0, 4).map((v) => {
                      const totalPaid = ent.vendors.reduce((s, x) => s + x.totalPaidYtdEgp, 0) || 1;
                      const share = (v.totalPaidYtdEgp / totalPaid) * 100;
                      return (
                        <li key={v.id} className="flex items-center gap-3 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-sans text-sm">{v.name}</div>
                            <div className="font-mono text-xs text-muted-foreground/85">
                              {v.category} · risk score {v.riskScore}
                              {v.relatedParty && " · RELATED PARTY"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-xs text-gold-light">{egp(v.totalPaidYtdEgp, { compact: true })}</div>
                            <div className="font-mono text-xs text-muted-foreground/80">{pct(share, 0)} of spend</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Hash-chained ledger preview */}
          <div className="mt-8 rounded-2xl border border-gold/15 glass p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <GoldStar className="h-3 w-3" />
              <h2 className="font-serif text-base font-semibold">Latest ledger events</h2>
              <span className="ml-auto font-mono text-xs text-muted-foreground/80">
                hash-chained · SHA3-256 · IPFS-mirrored
              </span>
            </div>
            <ul className="mt-3 divide-y divide-gold/8">
              {ent.ledgerEvents.map((ev) => (
                <li key={ev.id} className="flex items-center gap-3 py-2.5">
                  <span className="font-mono text-xs text-gold-light">{ev.eventType}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground/80">
                    {shortHash(ev.payloadHash, 12, 6)}
                  </span>
                  <span className="font-sans text-xs text-muted-foreground/80">
                    {timeAgo(ev.timestamp)}
                  </span>
                </li>
              ))}
              {ent.ledgerEvents.length === 0 && (
                <li className="py-6 text-center font-sans text-xs text-muted-foreground">
                  No ledger events recorded yet.
                </li>
              )}
            </ul>
          </div>

          {/* Live AI-narrated ledger ticker (signed-in members + shareholders only) */}
          <div className="mt-6">
            <LiveLedgerTicker enterpriseId={ent.id} maxVisible={6} />
          </div>

          {/* Constitutional anchor */}
          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold/50" />
              <GoldStar className="h-3 w-3" />
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold/50" />
            </div>
            <p className="font-serif text-sm italic text-gold-light/80">
              Zero Custody · AI Enforced · Constitutionally Bound
            </p>
            <Link
              href={`/badge/${ent.slug}`}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-1.5 font-sans text-xs text-foreground transition-colors hover:bg-gold/5"
            >
              View Constitutional Guarantee Badge →
            </Link>
          </div>
        </div>
      </main>

      <PublicTrustFooter />
    </div>
  );
}

function HeroStat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-3">
      <Icon className="h-3.5 w-3.5 text-gold/80" />
      <div className="mt-1.5 font-mono text-sm text-gold-light">{value}</div>
      <div className="font-sans text-xs uppercase tracking-wide text-muted-foreground/85">{label}</div>
    </div>
  );
}

function CounterpartyCard({ label, name, sub, stat, ok }: { label: string; name: string; sub: string; stat?: string; ok: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${ok ? "border-gold/15 bg-foreground/[0.02]" : "border-rose-400/20 bg-rose-400/[0.04]"}`}>
      <div className="font-sans text-xs uppercase tracking-wide text-muted-foreground/85">{label}</div>
      <div className="mt-1 font-serif text-base font-semibold">{name}</div>
      <div className="font-sans text-[11px] text-muted-foreground">{sub}</div>
      {stat && <div className="mt-1 font-mono text-xs text-gold-light/80">{stat}</div>}
    </div>
  );
}

function PublicLinkCard({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-2xl border border-gold/15 glass p-4 transition-all hover:border-gold/30 hover:shadow-[0_8px_30px_-12px_rgba(212,175,55,0.4)]"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gold/20 bg-gold/8">
          <Icon className="h-3.5 w-3.5 text-gold" />
        </span>
        <span className="font-serif text-sm font-semibold text-foreground group-hover:text-gold-light">
          {label}
        </span>
      </div>
      <p className="font-sans text-[11px] leading-relaxed text-muted-foreground/80">
        {hint}
      </p>
    </Link>
  );
}
