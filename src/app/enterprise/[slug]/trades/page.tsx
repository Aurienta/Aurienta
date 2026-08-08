import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { PublicTrustHeader, PublicTrustFooter } from "@/components/trust/public-shell";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { CONSTITUTIONAL_HASH, TIER_META, STAGE_META } from "@/lib/aurienta/constants";
import { egp, shortHash } from "@/lib/aurienta/format";
import {
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Activity,
} from "lucide-react";
import { PublicTradeLog } from "@/components/transparency/public-trade-log";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ent = await db.enterprise.findUnique({
    where: { slug },
    select: { name: true },
  });
  if (!ent) return { title: "Trade log not found · AURIENTA" };
  return {
    title: `${ent.name} · Trade Log · AURIENTA`,
    description: `Public, anonymized secondary-market trade log for ${ent.name}. Every filled order, with CRE price-band verification.`,
  };
}

export default async function TradeLogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ent = await db.enterprise.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      tier: true,
      stage: true,
      legalForm: true,
      sector: true,
      equityUnitPriceEgp: true,
    },
  });

  if (!ent) notFound();

  const tierMeta = TIER_META[ent.tier];
  const stageMeta = STAGE_META[ent.stage] ?? STAGE_META.stage_1;

  // Aggregate stats.
  const totalTrades = await db.tradeOrder.count({
    where: { enterpriseId: ent.id, status: "filled" },
  });
  const uniquePartners = await db.tradeOrder.groupBy({
    by: ["userId"],
    where: { enterpriseId: ent.id, status: "filled" },
    _count: { _all: true },
  });

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
            <span className="text-gold-light/85">Trade log</span>
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
                  Secondary-market trade log
                </span>
              </h1>
              <p className="mt-3 max-w-3xl font-sans text-sm leading-relaxed text-muted-foreground">
                Every filled secondary-market trade for this enterprise — timestamp, side, units,
                price, total value, and CRE price-band verification. Partner references are
                anonymized as &quot;Partner #NNNN&quot; per Egyptian PDPL Law 151/2020. Real-time,
                ledger-anchored, court-admissible.
              </p>

              {/* Summary stats */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  label="Filled trades"
                  value={totalTrades.toString()}
                  icon={TrendingUp}
                />
                <StatCard
                  label="Unique partners"
                  value={uniquePartners.length.toString()}
                  icon={ShieldCheck}
                />
                <StatCard
                  label="Constitutional price (CPP)"
                  value={egp(ent.equityUnitPriceEgp)}
                  icon={Activity}
                />
                <StatCard
                  label="Price band"
                  value="±5%"
                  icon={AlertCircle}
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
                  Partner references are anonymized as &quot;Partner #NNNN&quot; (stable, sequential
                  index per enterprise). No personal names, national IDs, or contact details are
                  published. Aggregate trade activity is disclosed per constitutional charter Article XIV.
                </p>
              </div>
            </div>
          </div>

          {/* Trade log (client component fetches from public API) */}
          <section className="mt-8">
            <PublicTradeLog slug={ent.slug} enterpriseName={ent.name} referencePriceEgp={ent.equityUnitPriceEgp} />
          </section>

          {/* Disclaimer */}
          <section className="mt-8 rounded-2xl border border-gold/12 bg-foreground/[0.02] p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
              <div className="space-y-2">
                <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                  Every trade is verified against the constitutional price band (Rule I 1.5: ±5%
                  around the CPP — Constitutional Percentage Price). Trades exceeding the band are
                  flagged but recorded for transparency. The hash-chained ledger ensures no trade
                  can be hidden or altered after the fact.
                </p>
                <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                  AURIENTA is a constitutional constitutional infrastructure, not an official government
                  registry. Data is self-reported by enterprises and verified by the CRE.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px] text-muted-foreground/85">
                  <span className="rounded-full border border-gold/15 bg-background/50 px-2.5 py-1">
                    Constitutional Hash: <span className="text-gold-light">{shortHash(CONSTITUTIONAL_HASH, 10, 6)}</span>
                  </span>
                  <a
                    href={`/api/public/enterprise/${ent.slug}/trades`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-gold/15 bg-background/50 px-2.5 py-1 transition-colors hover:text-gold-light"
                  >
                    JSON API <ExternalLink className="h-2.5 w-2.5" />
                  </a>
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

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-4">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/85">
        <Icon className="h-3 w-3 text-gold/80" /> {label}
      </div>
      <div className="mt-1.5 font-serif text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}
