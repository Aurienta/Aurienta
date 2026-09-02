import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CONSTITUTIONAL_HASH, TIER_META } from "@/lib/aurienta/constants";
import { egp, shortHash, timeAgo } from "@/lib/aurienta/format";
import { AurientaMark, GoldStar, AurientaWordmark } from "@/components/aurienta-logo";
import { PublicTrustHeader, PublicTrustFooter } from "@/components/trust/public-shell";
import { EmbedSnippet } from "@/components/trust/embed-snippet";
import { TransparencyScoreBadge } from "@/components/transparency/transparency-score-badge";
import {
  ShieldCheck,
  Lock,
  Cpu,
  Scale,
  CheckCircle2,
  BadgeCheck,
  Award,
  Link2,
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Hash,
  FileBox,
  Activity,
} from "lucide-react";

// ISR: public constitutional badge. The badge reflects the enterprise's tier,
// health rating, and constitutional compliance flags — all of which change
// infrequently (tier transitions and compliance attestations are rare
// constitutional events). A 5-minute stale-while-revalidate window is safe
// because this page reads only the `slug` route param (no cookies/headers/
// searchParams) and the underlying data mutates slowly. Public embed
// consumers benefit massively from edge caching.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ent = await db.enterprise.findUnique({
    where: { slug },
    select: { name: true, tier: true, healthRating: true },
  });
  if (!ent) return { title: "Badge not found · AURIENTA" };
  return {
    title: `${ent.name} · Constitutional Badge · AURIENTA`,
    description: `${ent.name} — Tier ${ent.tier} enterprise on AURIENTA. Health ${ent.healthRating ?? "—"}. Zero Custody · AI Enforced · verified on the immutable ledger.`,
  };
}

const COMPLIANCE_BADGES = [
  {
    key: "zero-custody",
    label: "Zero Custody",
    detail: "AURIENTA never holds partner funds. Capital flows to escrow.",
    icon: Lock,
    alwaysOn: true,
  },
  {
    key: "ai-enforced",
    label: "AI Enforced",
    detail: "Every action validated by the CRE against Rego policies.",
    icon: Cpu,
    alwaysOn: true,
  },
  {
    key: "nosi",
    label: "NOSI Compliant",
    detail: "100% workforce social-insurance registration verified daily.",
    icon: ShieldCheck,
    alwaysOn: false,
    check: (e: { nosiCompliantPct: number }) => e.nosiCompliantPct >= 100,
  },
  {
    key: "police",
    label: "Police Clearance Verified",
    detail: "Manager police clearance on file with the Ministry of Interior.",
    icon: BadgeCheck,
    alwaysOn: false,
    check: (e: { policeClearanceValid: boolean }) => e.policeClearanceValid,
  },
];

function badgeColor(rating: string | null | undefined) {
  if (!rating) return "text-muted-foreground border-muted-foreground/30";
  if (rating.startsWith("AAA") || rating.startsWith("AA")) return "text-emerald-300 border-emerald-400/40";
  if (rating.startsWith("A") || rating.startsWith("BBB")) return "text-gold-light border-gold/40";
  if (rating.startsWith("BB") || rating.startsWith("B")) return "text-amber-300 border-amber-400/40";
  return "text-red-300 border-red-400/40";
}

export default async function BadgePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const enterprise = await db.enterprise.findUnique({
    where: { slug },
    include: {
      lawFirm: { select: { name: true, frLicenseNumber: true, insuranceEgp: true } },
      accountingFirm: { select: { name: true, esaaLicense: true } },
    },
  });

  if (!enterprise) {
    notFound();
  }

  // GraduationRecord has no Prisma relation on Enterprise — query it separately.
  const graduationRecord = await db.graduationRecord.findUnique({
    where: { enterpriseId: enterprise.id },
    select: {
      id: true,
      tierAtGraduation: true,
      finalHealthScore: true,
      finalMaturityScore: true,
      readinessScore: true,
      graduationDate: true,
      sovereignCert: true,
      exportHash: true,
      testimonial: true,
    },
  });

  // Latest 3 ledger events for hash-chain verification
  const ledgerEvents = await db.ledgerEvent.findMany({
    where: { enterpriseId: enterprise.id },
    orderBy: { timestamp: "desc" },
    take: 3,
    select: {
      id: true,
      eventType: true,
      prevHash: true,
      payloadHash: true,
      creDecisionToken: true,
      timestamp: true,
      payload: true,
    },
  });

  const isGraduated = enterprise.status === "graduated" || !!graduationRecord;
  const graduation = graduationRecord;
  const tierMeta = TIER_META[enterprise.tier];

  // Compliance badges resolved against enterprise state
  const resolvedBadges = COMPLIANCE_BADGES.map((b) => {
    if (b.alwaysOn) return { ...b, on: true };
    // check is optional and typed per-badge
    return { ...b, on: b.check ? b.check(enterprise) : true };
  });

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div aria-hidden className="pointer-events-none fixed inset-0 aurienta-radial opacity-70" />
      <div aria-hidden className="pointer-events-none fixed inset-0 aurienta-grid opacity-30" />

      <PublicTrustHeader active="badge" />

      <main className="relative flex-1">
        <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
          {/* ── Breadcrumb ── */}
          <nav className="mb-8 flex items-center gap-2 font-sans text-xs text-muted-foreground/85" aria-label="Breadcrumb">
            <Link href="/trust" className="transition-colors hover:text-gold-light">
              Trust
            </Link>
            <span aria-hidden>/</span>
            <span className="text-gold-light/80">Badge</span>
            <span aria-hidden>/</span>
            <span className="font-mono text-[11px] text-foreground/80">{enterprise.slug}</span>
          </nav>

          {/* ── Badge card ── */}
          <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-gold/8 via-card/60 to-transparent p-7 sm:p-10">
            <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
            <div aria-hidden className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <AurientaMark className="h-16 w-16 sm:h-20 sm:w-20" withGlow />

                <div className="mt-4 inline-flex items-center gap-2.5 rounded-full border border-gold/20 bg-background/60 px-4 py-1.5">
                  <GoldStar className="h-3 w-3" />
                  <span className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-gold-light/90">
                    AURIENTA Constitutional Guarantee Badge
                  </span>
                </div>

                <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                  {enterprise.name}
                </h1>
                {enterprise.tagline && (
                  <p className="mt-2 max-w-xl font-serif text-base italic text-muted-foreground">
                    {enterprise.tagline}
                  </p>
                )}

                {/* Tier + Health row */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/8 px-3.5 py-1.5">
                    <span className="font-serif text-sm font-bold text-gold-gradient">
                      Tier {enterprise.tier}
                    </span>
                    <span className="font-sans text-[11px] text-muted-foreground/80">
                      {tierMeta?.name} · {tierMeta?.legalForm}
                    </span>
                  </span>
                  <span
                    className={
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 " +
                      badgeColor(enterprise.healthRating)
                    }
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span className="font-serif text-sm font-bold">
                      Health: {enterprise.healthRating ?? "—"}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-background/50 px-3.5 py-1.5 font-mono text-[11px] text-muted-foreground/80">
                    <Activity className="h-3 w-3 text-gold/70" />
                    Score {enterprise.healthScore}/100
                  </span>
                </div>

                {/* Constitutional hash */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 font-mono text-xs sm:text-[11px] text-muted-foreground/85">
                  <span className="rounded-full border border-gold/15 bg-background/50 px-3 py-1.5">
                    Constitutional Hash:
                    <span className="ml-1.5 text-gold-light">{shortHash(CONSTITUTIONAL_HASH, 10, 6)}</span>
                  </span>
                  <span className="rounded-full border border-gold/15 bg-background/50 px-3 py-1.5">
                    Enterprise ID:
                    <span className="ml-1.5 text-gold-light">{shortHash(enterprise.id, 8, 4)}</span>
                  </span>
                </div>

                {/* Transparency score badge */}
                <div className="mt-4 flex justify-center">
                  <TransparencyScoreBadge slug={enterprise.slug} variant="compact" />
                </div>
              </div>

              {/* ── Sovereign Survivability Certified badge ── */}
              {isGraduated && graduation && (
                <div className="mt-8 overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-400/10 to-transparent p-5 sm:p-6">
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 border border-emerald-400/40">
                      <GraduationCap className="h-6 w-6 text-emerald-300" />
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif text-lg font-semibold text-emerald-200">
                          Sovereign Survivability Certified
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 font-mono text-xs text-emerald-300">
                          <CheckCircle2 className="h-2.5 w-2.5" /> 7-day drill passed
                        </span>
                      </div>
                      <p className="mt-1 font-sans text-sm text-muted-foreground/85">
                        Graduated {timeAgo(graduation.graduationDate)} · Tier {graduation.tierAtGraduation ?? enterprise.tier} → sovereign operation. AURIENTA no longer required. Full ledger export available.
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-emerald-400/15 bg-background/40 p-2 text-center">
                          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/85">Final health</div>
                          <div className="font-serif text-base font-bold text-emerald-200">{graduation.finalHealthScore}</div>
                        </div>
                        <div className="rounded-lg border border-emerald-400/15 bg-background/40 p-2 text-center">
                          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/85">Maturity</div>
                          <div className="font-serif text-base font-bold text-emerald-200">{graduation.finalMaturityScore}</div>
                        </div>
                        <div className="rounded-lg border border-emerald-400/15 bg-background/40 p-2 text-center">
                          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/85">Readiness</div>
                          <div className="font-serif text-base font-bold text-emerald-200">{graduation.readinessScore}/100</div>
                        </div>
                      </div>
                      {graduation.exportHash && (
                        <div className="mt-3 font-mono text-xs text-muted-foreground/80">
                          Export hash: <span className="text-emerald-300/80">{graduation.exportHash}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Compliance badges grid ── */}
              <div className="mt-7">
                <div className="mb-3 flex items-center gap-2">
                  <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                    Compliance badges
                  </span>
                  <div className="h-px flex-1 bg-gold/15" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {resolvedBadges.map((b) => {
                    const Icon = b.icon;
                    return (
                      <div
                        key={b.key}
                        className={
                          "flex items-start gap-3 rounded-2xl border p-4 transition-colors " +
                          (b.on
                            ? "border-emerald-400/25 bg-emerald-400/5"
                            : "border-red-400/20 bg-red-400/5")
                        }
                      >
                        <span
                          className={
                            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " +
                            (b.on ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300")
                          }
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-serif text-sm font-semibold text-foreground">
                              {b.label}
                            </span>
                            {b.on ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                            ) : (
                              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-red-300/80">
                                pending
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 font-sans text-xs text-muted-foreground/75">
                            {b.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Quick stats ── */}
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-gold/12 bg-background/40 p-3.5">
                  <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/85">Capital raised</div>
                  <div className="mt-0.5 font-serif text-lg font-bold text-gold-gradient">{egp(enterprise.raisedEgp, { compact: true })}</div>
                </div>
                <div className="rounded-xl border border-gold/12 bg-background/40 p-3.5">
                  <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/85">Law Firm Client Account held</div>
                  <div className="mt-0.5 font-serif text-lg font-bold text-foreground">{egp(enterprise.lawFirmClientAccountBalanceEgp, { compact: true })}</div>
                </div>
                <div className="rounded-xl border border-gold/12 bg-background/40 p-3.5">
                  <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/85">Workforce</div>
                  <div className="mt-0.5 font-serif text-lg font-bold text-foreground">{enterprise.employeeCount}</div>
                </div>
                <div className="rounded-xl border border-gold/12 bg-background/40 p-3.5">
                  <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/85">Stage</div>
                  <div className="mt-0.5 font-serif text-lg font-bold text-foreground capitalize">{enterprise.stage.replace("_", " ")}</div>
                </div>
              </div>

              {/* ── Service providers ── */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {enterprise.lawFirm && (
                  <div className="rounded-2xl border border-gold/12 bg-background/40 p-4">
                    <div className="flex items-center gap-2">
                      <Scale className="h-3.5 w-3.5 text-gold" />
                      <span className="font-sans text-xs uppercase tracking-[0.16em] text-muted-foreground/85">Law Firm Client Account law firm</span>
                    </div>
                    <div className="mt-1 font-serif text-sm font-semibold text-foreground">{enterprise.lawFirm.name}</div>
                    <div className="mt-0.5 font-mono text-xs text-muted-foreground/85">
                      License {enterprise.lawFirm.frLicenseNumber} · Insurance {egp(enterprise.lawFirm.insuranceEgp, { compact: true })}
                    </div>
                  </div>
                )}
                {enterprise.accountingFirm && (
                  <div className="rounded-2xl border border-gold/12 bg-background/40 p-4">
                    <div className="flex items-center gap-2">
                      <FileBox className="h-3.5 w-3.5 text-gold" />
                      <span className="font-sans text-xs uppercase tracking-[0.16em] text-muted-foreground/85">Accounting firm</span>
                    </div>
                    <div className="mt-1 font-serif text-sm font-semibold text-foreground">{enterprise.accountingFirm.name}</div>
                    <div className="mt-0.5 font-mono text-xs text-muted-foreground/85">
                      ESAA License {enterprise.accountingFirm.esaaLicense}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Verify on ledger ── */}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2.5 rounded-full border border-gold/20 bg-gold/5 px-3.5 py-1.5">
                  <Link2 className="h-3 w-3 text-gold" />
                  <span className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-gold-light/90">
                    Verify on ledger · hash-chained
                  </span>
                </div>
                <h2 className="mt-3 font-serif text-2xl font-semibold sm:text-3xl">
                  Latest 3 events on the immutable ledger
                </h2>
              </div>
              <a
                href={`/api/evidence?enterpriseId=${enterprise.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden shrink-0 items-center gap-1.5 rounded-full border border-gold/20 px-3.5 py-1.5 font-sans text-xs font-medium text-gold transition-colors hover:bg-gold/5 sm:inline-flex"
              >
                <ExternalLink className="h-3 w-3" /> Evidence API
              </a>
            </div>

            {ledgerEvents.length === 0 ? (
              <div className="rounded-2xl border border-gold/12 bg-card/40 p-8 text-center font-sans text-sm text-muted-foreground">
                No ledger events on record yet.
              </div>
            ) : (
              <ol className="relative flex flex-col gap-3">
                {ledgerEvents.map((ev, idx) => {
                  const parsed = (() => {
                    try {
                      return JSON.parse(ev.payload) as Record<string, unknown>;
                    } catch {
                      return null;
                    }
                  })();
                  return (
                    <li
                      key={ev.id}
                      className="relative flex flex-col gap-3 rounded-2xl border border-gold/12 bg-card/40 p-4 sm:flex-row sm:items-start sm:gap-4"
                    >
                      {/* Connector dot */}
                      <div className="flex items-center gap-3 sm:flex-col sm:items-center">
                        <span
                          className={
                            "inline-flex h-9 w-9 items-center justify-center rounded-full font-mono text-xs font-bold " +
                            (idx === 0
                              ? "bg-gold-gradient text-black"
                              : "border border-gold/25 bg-background/60 text-gold-light")
                          }
                        >
                          {ledgerEvents.length - idx}
                        </span>
                        {idx < ledgerEvents.length - 1 && (
                          <span aria-hidden className="hidden h-px w-px bg-gold/20 sm:block" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-serif text-base font-semibold text-gold-gradient">
                            {ev.eventType.replace(/_/g, " ")}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground/85">
                            {timeAgo(ev.timestamp)} · {new Date(ev.timestamp).toISOString().slice(0, 19).replace("T", " ")} UTC
                          </span>
                        </div>

                        {parsed && (
                          <pre className="mt-2 overflow-x-auto rounded-xl border border-gold/10 bg-[#06060a] p-3 font-mono text-xs leading-relaxed text-gold-light/80">
                            <code>{JSON.stringify(parsed, null, 2)}</code>
                          </pre>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground/85">
                          <span className="inline-flex items-center gap-1 text-gold-light/80">
                            <Hash className="h-2.5 w-2.5" />
                            payload: {shortHash(ev.payloadHash, 12, 6)}
                          </span>
                          {ev.prevHash && (
                            <span className="inline-flex items-center gap-1">
                              <Link2 className="h-2.5 w-2.5" />
                              prev: {shortHash(ev.prevHash, 8, 4)}
                            </span>
                          )}
                          {ev.creDecisionToken && (
                            <span className="inline-flex items-center gap-1 text-emerald-300/80">
                              <ShieldCheck className="h-2.5 w-2.5" />
                              {ev.creDecisionToken}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <p className="mt-4 flex items-start gap-2 font-sans text-[11px] text-muted-foreground/65">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
              Every event references the previous event&apos;s hash, forming a tamper-evident
              chain back to the enterprise&apos;s first issued share. Recompute the chain at any
              time — any modified event breaks the hash.
            </p>
          </div>

          {/* ── Embed snippet ── */}
          <div className="mt-8 rounded-3xl border border-gold/15 bg-card/40 p-6 sm:p-7">
            <EmbedSnippet slug={enterprise.slug} />
          </div>

          {/* ── PDPL notice ── */}
          <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.04] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <div>
                <div className="font-sans text-xs font-semibold uppercase tracking-wide text-emerald-200/90">
                  PDPL Compliance — Egyptian Law 151/2020
                </div>
                <p className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground/85">
                  Personal data is protected under Egyptian PDPL Law 151/2020. Enterprise data is
                  published per constitutional charter Article XIV. AURIENTA is a constitutional
                  constitutional infrastructure, not an official government registry. Data is self-reported
                  by enterprises and verified by the CRE.
                </p>
              </div>
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <AurientaWordmark className="text-sm" />
              <span className="font-mono text-xs text-muted-foreground/80">
                · {shortHash(CONSTITUTIONAL_HASH, 8, 4)}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/trust"
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-2 font-sans text-sm text-foreground transition-colors hover:bg-gold/5"
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Public Trust Dashboard
              </Link>
              <Link
                href="/api/public/stats"
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-2 font-sans text-sm text-foreground transition-colors hover:bg-gold/5"
              >
                Constitutional API <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicTrustFooter />
    </div>
  );
}
