import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SovereigntyHeader } from "@/components/dashboard/sovereignty2/header";
import { DripCard } from "@/components/dashboard/capital2/drip-card";
import { GoldStar } from "@/components/aurienta-logo";
import { egp, pct } from "@/lib/aurienta/format";
import {
  TrendingUp,
  Coins,
  Building2,
  Sparkles,
  ShieldCheck,
  Scale,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "DRIP · Dividend ReParticipation · AURIENTA" };

// REMED-1D — fixes the CTO audit CRITICAL #3: the `/dashboard/drip` route was
// declared in the dashboard NAV array but had no page.tsx, so clicking it 404'd.
//
// This is a real Dividend ReParticipation Plan dashboard. It reuses the existing
// <DripCard /> client component for the per-enterprise enroll/unenroll UI
// (which calls POST /api/drip with the action payload), and adds a YTD summary
// card showing enrolled enterprises, projected reinvested dividends, and the
// total shares that would be acquired this year at the AI fundamental price.

export default async function DripDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/drip");

  // Only Equity Unit holders can enroll in DRIP — filter to live positions.
  const holdings = user.ownershipRecords
    .filter((s) => s.equityUnits > 0)
    .map((s) => ({
      id: s.id,
      equityUnits: s.equityUnits,
      avgPriceEgp: s.avgPriceEgp,
      enterprise: s.enterprise,
    }));

  // Fetch all of the user's DRIP enrollments. NOTE: the DripEnrollment model
  // has no `enterprise` relation (only `user`), so we don't `include` it here
  // — we join the enterprise data from `holdings` by `enterpriseId` instead,
  // exactly like /dashboard/syndicates does.
  const enrollments = holdings.length
    ? await db.dripEnrollment.findMany({
        where: {
          userId: user.id,
          enterpriseId: { in: holdings.map((h) => h.enterprise.id) },
        },
      })
    : [];

  const enrollmentByEntId = new Map(enrollments.map((e) => [e.enterpriseId, e]));
  const activeEnrollments = enrollments.filter((e) => e.active);

  // YTD projection: for each active enrollment, simulate the next 4 quarterly
  // dividends at 4% annual yield on cost basis, reinvested at the AI fundamental
  // price (±5% CRE band, no speculation). This mirrors the projection logic in
  // the existing DripCard so the summary is consistent with the per-card numbers.
  const ytdProjection = activeEnrollments
    .map((enr) => {
      const holding = holdings.find((h) => h.enterprise.id === enr.enterpriseId);
      if (!holding) return null;
      const annualDividendPerShare = holding.avgPriceEgp * 0.04;
      const grossAnnual = annualDividendPerShare * holding.equityUnits;
      const netAnnual = grossAnnual * 0.9; // 10% WHT
      const reinvestedAnnual = (netAnnual * enr.reinvestPct) / 100;
      const resultingShares = Math.floor(
        reinvestedAnnual / holding.enterprise.equityUnitPriceEgp
      );
      return {
        enrollment: enr,
        enterprise: holding.enterprise,
        grossAnnual,
        netAnnual,
        reinvestedAnnual,
        resultingShares,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const ytdReinvestedAmount = ytdProjection.reduce(
    (s, x) => s + x.reinvestedAnnual,
    0
  );
  const ytdReinvestedShares = ytdProjection.reduce(
    (s, x) => s + x.resultingShares,
    0
  );
  const ytdGrossDividends = ytdProjection.reduce(
    (s, x) => s + x.grossAnnual,
    0
  );

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SonnerToaster
        position="top-center"
        toastOptions={{
          style: {
            border: "1px solid rgba(212,175,55,0.25)",
            background: "rgba(16,16,18,0.95)",
            color: "#f3eedd",
          },
        }}
      />

      <SovereigntyHeader
        eyebrow="Institutional Services · Capital Partner"
        icon={TrendingUp}
        title="Dividend ReParticipation Plan (DRIP)"
        subtitle="Auto-reinvest enterprise dividends into the same enterprise at the AI fundamental price, within the ±5% CRE band. Zero custody — every reParticipation routes through the standard law firm client account path with a unique reference on the immutable ledger."
      />

      {/* YTD summary cards */}
      <section
        aria-label="DRIP year-to-date summary"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <SummaryCard
          icon={Building2}
          label="Enrolled enterprises"
          value={`${activeEnrollments.length}`}
          sub={`of ${holdings.length} holding${holdings.length === 1 ? "" : "s"}`}
          accent
        />
        <SummaryCard
          icon={Coins}
          label="Projected gross dividends (YTD)"
          value={egp(ytdGrossDividends, {
            compact: ytdGrossDividends >= 1_000_000,
          })}
          sub="4% annual yield on cost basis"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Reinvested capital (YTD)"
          value={egp(ytdReinvestedAmount, {
            compact: ytdReinvestedAmount >= 1_000_000,
          })}
          sub="Net of 10% WHT · routed via law firm client account"
          accent
        />
        <SummaryCard
          icon={Sparkles}
          label="Reinvested shares (YTD)"
          value={`+${ytdReinvestedShares.toLocaleString()}`}
          sub="Acquired at AI fundamental price"
        />
      </section>

      {/* Constitutional explanation strip */}
      <Card className="border-gold/15 bg-gold/[0.03] py-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
              <Scale className="h-4 w-4 text-gold" />
            </span>
            <div className="min-w-0">
              <p className="font-serif text-sm font-semibold text-foreground">
                Every DRIP reParticipation is a real capital deployment.
              </p>
              <p className="mt-0.5 font-sans text-xs leading-relaxed text-muted-foreground">
                No speculation, no synthetic exposure. ReParticipations execute at the
                AI fundamental price within the constitutional ±5% band, through
                the standard law firm client account + CRE path — exactly like a fresh capital
                contribution. Each event is hash-anchored on the immutable ledger.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground/80">
            <ShieldCheck className="h-3 w-3 text-gold/60" />
            <span>CRE-enforced · Zero Custody</span>
          </div>
        </CardContent>
      </Card>

      {/* Per-enterprise DRIP cards */}
      <section aria-label="DRIP enrollments per enterprise" className="flex flex-col gap-5">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GoldStar className="h-3.5 w-3.5" />
              <span className="font-mono text-xs uppercase tracking-[0.22em] text-gold-light/80">
                Your Dividend ReParticipation Plans
              </span>
            </div>
            <h2 className="mt-1.5 font-serif text-xl font-semibold sm:text-2xl">
              Enroll per holding
            </h2>
            <p className="mt-1 max-w-2xl font-sans text-sm text-muted-foreground">
              Toggle DRIP for each enterprise you hold Equity Units in. Adjust the
              reParticipation percentage — the rest is paid in cash to your wallet.
            </p>
          </div>
          {holdings.length > 0 && (
            <Badge
              variant="outline"
              className="self-start border-gold/25 bg-transparent text-[11px] text-muted-foreground"
            >
              {activeEnrollments.length} active · {holdings.length - activeEnrollments.length} cash
            </Badge>
          )}
        </header>

        {holdings.length === 0 ? (
          <Card className="border-gold/12">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Coins className="h-10 w-10 text-gold/40" />
              <p className="font-serif text-base font-medium text-foreground">
                You don&apos;t hold any Equity Units yet.
              </p>
              <p className="max-w-md font-sans text-xs text-muted-foreground">
                DRIP enrollment requires a real shareholding — dividends are
                calculated on your unit count and the AI fundamental price.
              </p>
              <a
                href="/dashboard/opportunities"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 font-sans text-xs font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Explore opportunities <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {holdings.map((h) => {
              const enr = enrollmentByEntId.get(h.enterprise.id);
              return (
                <DripCard
                  key={h.enterprise.id}
                  userId={user.id}
                  enterpriseId={h.enterprise.id}
                  shareholding={{
                    equityUnits: h.equityUnits,
                    avgPriceEgp: h.avgPriceEgp,
                  }}
                  enterprise={{
                    id: h.enterprise.id,
                    name: h.enterprise.name,
                    slug: h.enterprise.slug,
                    tier: h.enterprise.tier,
                    sector: h.enterprise.sector,
                    equityUnitPriceEgp: h.enterprise.equityUnitPriceEgp,
                  }}
                  enrollment={
                    enr
                      ? {
                          id: enr.id,
                          enterpriseId: enr.enterpriseId,
                          reinvestPct: enr.reinvestPct,
                          active: enr.active,
                          enrolledAt: enr.enrolledAt.toISOString(),
                        }
                      : null
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Footnote */}
      <footer className="mt-2 flex flex-col items-start gap-2 border-t border-gold/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground/85">
          <span className="inline-flex items-center gap-1">
            <Scale className="h-3 w-3 text-gold/60" /> CRE ±5% band enforced
          </span>
          <span className="hidden sm:inline text-gold/15">|</span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-gold/60" /> Zero Custody · Law Firm Client Account
          </span>
          <span className="hidden sm:inline text-gold/15">|</span>
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-gold/60" />{" "}
            {activeEnrollments.length > 0
              ? `${pct(
                  ytdProjection.reduce((s, x) => s + x.enrollment.reinvestPct, 0) /
                    Math.max(activeEnrollments.length, 1)
                )} avg reinvest rate`
              : "No active enrollments"}
          </span>
        </div>
      </footer>
    </div>
  );
}

// Local summary card — gold-themed, distinct from the standard shadcn Card to
// match the dashboard's institutional aesthetic.
function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={
        accent
          ? "border-gold/25 bg-gold/[0.05] py-4"
          : "border-gold/12 bg-background/40 py-4"
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${
              accent ? "border-gold/30 bg-gold/8" : "border-gold/15 bg-gold/5"
            }`}
          >
            <Icon className="h-3.5 w-3.5 text-gold" />
          </span>
          <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p
          className={`font-serif text-xl font-semibold sm:text-2xl ${
            accent ? "text-gold-light" : "text-foreground"
          }`}
        >
          {value}
        </p>
        {sub && (
          <p className="mt-0.5 font-mono text-xs text-muted-foreground/85">
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
