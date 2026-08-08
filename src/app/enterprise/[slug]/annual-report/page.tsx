import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { PublicTrustHeader, PublicTrustFooter } from "@/components/trust/public-shell";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { CONSTITUTIONAL_HASH, TIER_META, STAGE_META } from "@/lib/aurienta/constants";
import { egp, shortHash, timeAgo } from "@/lib/aurienta/format";
import {
  ArrowLeft,
  ShieldCheck,
  Scale,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  FileText,
  Building2,
  Calendar,
  TrendingUp,
  Award,
  FileCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { AnnualReportGenerator } from "@/components/transparency/annual-report-generator";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ent = await db.enterprise.findUnique({
    where: { slug },
    select: { name: true },
  });
  if (!ent) return { title: "Annual report not found · AURIENTA" };
  return {
    title: `${ent.name} · Annual Constitutional Report · AURIENTA`,
    description: `Annual constitutional report for ${ent.name} — enterprise-level financials, Brain AI assessment, and auditor attestation. Article XIV public disclosure.`,
  };
}

export default async function AnnualReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ent = await db.enterprise.findUnique({
    where: { slug },
    include: {
      lawFirm: { select: { name: true, frLicenseNumber: true } },
      accountingFirm: { select: { name: true, esaaLicense: true } },
      annualReports: { orderBy: { year: "desc" }, take: 5 },
    },
  });

  if (!ent) notFound();

  const tierMeta = TIER_META[ent.tier];
  const stageMeta = STAGE_META[ent.stage] ?? STAGE_META.stage_1;
  const latestReport = ent.annualReports[0];
  const currentYear = new Date().getFullYear();

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
            <span className="text-gold-light/85">Annual report</span>
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
                  Annual constitutional report
                </span>
              </h1>
              <p className="mt-3 max-w-3xl font-sans text-sm leading-relaxed text-muted-foreground">
                The annual constitutional report — required by Article XIV of the constitutional charter.
                Combines enterprise-level financials, the Brain AI annual assessment (consensus mode),
                and the auditor&apos;s attestation. No personal data; published per Egyptian PDPL Law 151/2020.
              </p>
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
                  The annual report contains enterprise-level data only. Partner identities are
                  anonymized. Personal data is protected under Egyptian PDPL Law 151/2020; enterprise
                  data is published per constitutional charter Article XIV.
                </p>
              </div>
            </div>
          </div>

          {latestReport ? (
            <>
              {/* Report header */}
              <section className="mt-8 rounded-2xl border border-gold/15 glass p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/8">
                      <FileText className="h-5 w-5 text-gold" />
                    </span>
                    <div>
                      <div className="font-serif text-xl font-semibold">Fiscal year {latestReport.year}</div>
                      <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-muted-foreground/85">
                        <Calendar className="h-3 w-3" />
                        Year-end {new Date(latestReport.fiscalYearEnd).toISOString().slice(0, 10)}
                        · Generated {timeAgo(latestReport.createdAt)}
                      </div>
                    </div>
                  </div>
                  <AuditStatusBadge status={latestReport.auditStatus} />
                </div>

                {/* Financial summary grid */}
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <FinancialStat
                    icon={TrendingUp}
                    label="Annual revenue"
                    value={egp(latestReport.revenueEgp)}
                  />
                  <FinancialStat
                    icon={Award}
                    label="Net profit"
                    value={egp(latestReport.netProfitEgp)}
                    tone={latestReport.netProfitEgp >= 0 ? "ok" : "alert"}
                  />
                  <FinancialStat
                    icon={Building2}
                    label="Total assets"
                    value={egp(latestReport.totalAssetsEgp, { compact: true })}
                  />
                  <FinancialStat
                    icon={Scale}
                    label="Total liabilities"
                    value={egp(latestReport.totalLiabilitiesEgp, { compact: true })}
                  />
                </div>
              </section>

              {/* Auditor info */}
              <section className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-gold/15 glass p-5">
                  <div className="flex items-center gap-2">
                    <Scale className="h-3.5 w-3.5 text-gold" />
                    <span className="font-sans text-xs uppercase tracking-[0.16em] text-muted-foreground/85">
                      Auditor (accounting firm)
                    </span>
                  </div>
                  <div className="mt-1.5 font-serif text-base font-semibold">
                    {latestReport.auditorName ?? ent.accountingFirm?.name ?? "Pending assignment"}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground/85">
                    ESAA License {latestReport.auditorLicense ?? ent.accountingFirm?.esaaLicense ?? "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-gold/15 glass p-5">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-3.5 w-3.5 text-gold" />
                    <span className="font-sans text-xs uppercase tracking-[0.16em] text-muted-foreground/85">
                      Audit status
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <AuditStatusBadge status={latestReport.auditStatus} compact />
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground/85">
                    {latestReport.publishedAt
                      ? `Published ${timeAgo(latestReport.publishedAt)}`
                      : "Pending publication"}
                  </div>
                </div>
              </section>

              {/* Brain AI assessment */}
              {latestReport.brainAiAssessment && (
                <section className="mt-6 rounded-2xl border border-gold/15 glass p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold" />
                    <h2 className="font-serif text-lg font-semibold">Brain AI annual assessment</h2>
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-gold/15 bg-background/50 px-2.5 py-1 font-mono text-[10px] text-muted-foreground/85">
                      Consensus mode · advisory
                    </span>
                  </div>
                  <div className="mt-4 max-h-[40rem] overflow-y-auto pr-2">
                    <article className="whitespace-pre-line font-sans text-sm leading-relaxed text-foreground/90">
                      {latestReport.brainAiAssessment}
                    </article>
                  </div>
                  <p className="mt-4 border-t border-gold/10 pt-3 font-sans text-[11px] leading-relaxed text-muted-foreground/80">
                    The Brain AI assessment is advisory — generated by the 5-provider consensus
                    Brain (Gemini + GPT-4 + Groq + HuggingFace + OpenRouter). The CRE remains the
                    single source of truth for constitutional enforcement. The assessment is
                    persisted as an AiArtifact for court admissibility.
                  </p>
                </section>
              )}

              {/* Prior reports */}
              {ent.annualReports.length > 1 && (
                <section className="mt-8 rounded-2xl border border-gold/15 glass p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gold" />
                    <h2 className="font-serif text-lg font-semibold">Prior annual reports</h2>
                  </div>
                  <ul className="mt-3 divide-y divide-gold/8">
                    {ent.annualReports.slice(1).map((r) => (
                      <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                        <div>
                          <div className="font-serif text-sm font-semibold">FY {r.year}</div>
                          <div className="font-mono text-xs text-muted-foreground/85">
                            Revenue {egp(r.revenueEgp, { compact: true })} · Net {egp(r.netProfitEgp, { compact: true })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <AuditStatusBadge status={r.auditStatus} compact />
                          <span className="font-mono text-[10px] text-muted-foreground/70">
                            {timeAgo(r.createdAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          ) : (
            <section className="mt-8 rounded-2xl border border-gold/15 glass p-10 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <h2 className="mt-3 font-serif text-xl font-semibold">No annual report published yet</h2>
              <p className="mt-2 max-w-md mx-auto font-sans text-xs leading-relaxed text-muted-foreground/85">
                The constitutional charter requires an annual report per fiscal year, generated
                by the Brain AI (consensus mode) and attested by the enterprise&apos;s accounting firm.
              </p>
              <AnnualReportGenerator
                enterpriseId={ent.id}
                enterpriseName={ent.name}
                defaultYear={currentYear}
              />
            </section>
          )}

          {/* If there's a latest report, also show the generator for the current year (regenerate) */}
          {latestReport && (
            <section className="mt-6">
              <AnnualReportGenerator
                enterpriseId={ent.id}
                enterpriseName={ent.name}
                defaultYear={Math.max(latestReport.year, currentYear)}
                regenerate
              />
            </section>
          )}

          {/* Disclaimer */}
          <section className="mt-8 rounded-2xl border border-gold/12 bg-foreground/[0.02] p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
              <div className="space-y-2">
                <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                  The annual report is enterprise-level public disclosure modeled on Egyptian
                  Companies Law 159/1981 and the FRA annual-report format. Audited annually per
                  constitutional charter Article XIV. The Brain AI assessment is advisory and does
                  not constitute Participation advice.
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
                    Article XIV · Annual disclosure
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
              <ArrowLeft className="h-3.5 w-3.5" /> Enterprise profile
            </Link>
            <Link
              href={`/enterprise/${ent.slug}/financials`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-2 font-sans text-xs text-foreground transition-colors hover:bg-gold/5"
            >
              Real-time financials <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/enterprise/${ent.slug}/governance-log`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-2 font-sans text-xs text-foreground transition-colors hover:bg-gold/5"
            >
              CRE decision log <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        </div>
      </main>

      <PublicTrustFooter />
    </div>
  );
}

function FinancialStat({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone?: "default" | "ok" | "alert";
}) {
  const toneCls =
    tone === "ok" ? "text-emerald-300" : tone === "alert" ? "text-amber-300" : "text-foreground";
  return (
    <div className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-4">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/85">
        <Icon className="h-3 w-3 text-gold/80" /> {label}
      </div>
      <div className={`mt-1.5 font-serif text-lg font-bold ${toneCls}`}>{value}</div>
    </div>
  );
}

function AuditStatusBadge({ status, compact }: { status: string; compact?: boolean }) {
  const map: Record<string, { tone: string; label: string; icon: React.ElementType }> = {
    pending: { tone: "border-amber-400/30 text-amber-300 bg-amber-400/5", label: "Pending audit", icon: Clock },
    audited: { tone: "border-gold/30 text-gold-light bg-gold/8", label: "Audited", icon: FileCheck },
    published: { tone: "border-emerald-400/30 text-emerald-300 bg-emerald-400/5", label: "Published", icon: CheckCircle2 },
  };
  const meta = map[status] ?? map.pending;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${meta.tone}`}>
      <Icon className="h-3 w-3" /> {compact ? meta.label : `Audit: ${meta.label}`}
    </span>
  );
}
