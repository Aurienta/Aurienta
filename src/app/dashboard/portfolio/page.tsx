import Link from "next/link";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { SECTORS, CONSTITUTIONAL_HASH, TIER_META } from "@/lib/aurienta/constants";
import { egp, pct, shortHash } from "@/lib/aurienta/format";
import { GoldStar } from "@/components/aurienta-logo";
import { PortfolioAllocationChart, type AllocationSlice } from "@/components/dashboard/capital/portfolio-allocation-chart";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  HandCoins,
  Scale,
  Banknote,
  ShieldCheck,
  Lock,
} from "lucide-react";

export const metadata = { title: "Constitutional Holdings · AURIENTA" };

export default async function PortfolioPage() {
  const user = (await getCurrentUser())!;

  // User's holdings (shares > 0).
  const holdings = user.ownershipRecords
    .filter((s) => s.equityUnits > 0)
    .map((s) => ({
      id: s.id,
      equityUnits: s.equityUnits,
      avgPriceEgp: s.avgPriceEgp,
      enterprise: s.enterprise,
    }));

  // Portfolio totals.
  const portfolioValue = holdings.reduce(
    (s, h) => s + h.equityUnits * h.enterprise.equityUnitPriceEgp,
    0
  );
  const costBasis = holdings.reduce(
    (s, h) => s + h.equityUnits * h.avgPriceEgp,
    0
  );
  const unrealised = portfolioValue - costBasis;
  const unrealisedPct = costBasis > 0 ? (unrealised / costBasis) * 100 : 0;
  const enterprises = holdings.length;

  // Allocation by sector.
  const bySector = new Map<string, number>();
  for (const h of holdings) {
    const v = h.equityUnits * h.enterprise.equityUnitPriceEgp;
    bySector.set(h.enterprise.sector, (bySector.get(h.enterprise.sector) ?? 0) + v);
  }
  const allocation: AllocationSlice[] = Array.from(bySector.entries()).map(
    ([sector, value]) => ({
      sector,
      label: SECTORS[sector]?.label ?? sector,
      value,
    })
  );

  // Priority window entitlements:
  // Open sell orders in phase_1 (pro-rata window) on enterprises this user holds.
  // The user's pro-rata slice = (userShares / totalEquityUnits) × orderShares.
  const enterpriseIds = holdings.map((h) => h.enterprise.id);
  const proRataOrders = enterpriseIds.length
    ? await db.tradeOrder.findMany({
        where: {
          enterpriseId: { in: enterpriseIds },
          side: "sell",
          status: { in: ["open", "partially_filled"] },
          phase: "phase_1",
          userId: { not: user.id }, // not the user's own listing
        },
        include: { enterprise: true, user: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const entitlements = proRataOrders
    .map((o) => {
      const userHolding = holdings.find(
        (h) => h.enterprise.id === o.enterpriseId
      );
      const userShares = userHolding?.equityUnits ?? 0;
      const totalEquityUnits = o.enterprise.totalEquityUnits;
      const proRata = totalEquityUnits > 0
        ? Math.floor((userShares / totalEquityUnits) * o.equityUnits)
        : 0;
      return { order: o, proRata, userShares };
    })
    .filter((e) => e.proRata > 0);

  // Real dividend history — fetch `dividend_paid` LedgerEvents for the
  // enterprises this user holds Equity Units in. No fabrication: if there are
  // no dividend ledger events, the UI shows an honest empty state.
  const dividendEnterpriseIds = holdings.map((h) => h.enterprise.id);
  const dividendEvents = dividendEnterpriseIds.length
    ? await db.ledgerEvent.findMany({
        where: {
          eventType: "dividend_paid",
          enterpriseId: { in: dividendEnterpriseIds },
        },
        orderBy: { timestamp: "desc" },
        select: {
          id: true,
          enterpriseId: true,
          payload: true,
          payloadHash: true,
          timestamp: true,
          sequence: true,
        },
      })
    : [];

  // Build a quick lookup from enterpriseId → enterprise so we can render the
  // human-readable name + slug on each row.
  const enterpriseById = new Map(holdings.map((h) => [h.enterprise.id, h.enterprise]));

  type DividendRow = {
    id: string;
    enterpriseId: string;
    enterprise: string;
    slug: string;
    grossEgp: number;
    withholdingEgp: number;
    netEgp: number;
    date: string;
    quarter: string;
    hash: string;
  };

  const dividends: DividendRow[] = dividendEvents
    .map((ev) => {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(ev.payload);
      } catch {
        parsed = {};
      }
      const ent = ev.enterpriseId ? enterpriseById.get(ev.enterpriseId) : undefined;
      const grossEgp =
        typeof parsed.grossEgp === "number"
          ? parsed.grossEgp
          : typeof parsed.amountEgp === "number"
            ? parsed.amountEgp
            : 0;
      // Withholding tax is 10% per Egyptian law on distributed dividends.
      const withholdingEgp =
        typeof parsed.withholdingEgp === "number"
          ? parsed.withholdingEgp
          : Math.round(grossEgp * 0.1);
      const netEgp =
        typeof parsed.netEgp === "number"
          ? parsed.netEgp
          : Math.max(grossEgp - withholdingEgp, 0);
      const date =
        typeof parsed.date === "string"
          ? parsed.date
          : ev.timestamp.toISOString().slice(0, 10);
      const quarter =
        typeof parsed.quarter === "string"
          ? parsed.quarter
          : `${ev.timestamp.getFullYear()} Q${Math.floor(ev.timestamp.getMonth() / 3) + 1}`;
      return {
        id: ev.id,
        enterpriseId: ev.enterpriseId ?? "",
        enterprise: ent?.name ?? "—",
        slug: ent?.slug ?? "",
        grossEgp,
        withholdingEgp,
        netEgp,
        date,
        quarter,
        hash: ev.payloadHash,
      };
    })
    // Drop rows that have no gross amount (i.e. malformed/placeholder events).
    .filter((d) => d.grossEgp > 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Page heading */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <GoldStar className="h-3.5 w-3.5" />
            <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/80">
              Capital Partner · Constitutional Holdings
            </span>
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
            Your consolidated constitutional holdings
          </h1>
          <p className="mt-1.5 max-w-2xl font-sans text-sm text-muted-foreground">
            Equity Units across the constitutional economy. Fundamental pricing,
            hash-anchored ownership, zero custody.
          </p>
        </div>
        <Link
          href="/dashboard/opportunities"
          className="inline-flex items-center gap-1.5 self-start rounded-full bg-gold-gradient px-4 py-2 font-sans text-xs font-semibold text-black transition-transform hover:scale-[1.02]"
        >
          Discover Capital Participation <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* Hero summary */}
      <section
        aria-label="Constitutional Holdings summary"
        className="relative overflow-hidden rounded-2xl border border-gold/15 glass-gold p-5 sm:p-7"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStat
            icon={Wallet}
            label="Total Constitutional Holdings value"
            value={egp(portfolioValue, {
              compact: portfolioValue >= 1_000_000,
            })}
            sub="Mark-to-AI-fundamental-price"
          />
          <SummaryStat
            icon={unrealised >= 0 ? TrendingUp : TrendingDown}
            label="Unrealised gain / loss"
            value={`${unrealised >= 0 ? "+" : "−"}${egp(Math.abs(unrealised), {
              compact: Math.abs(unrealised) >= 1_000_000,
            })}`}
            sub={pct(unrealisedPct)}
            tone={unrealised >= 0 ? "positive" : "negative"}
          />
          <SummaryStat
            icon={Coins}
            label="Dividends received"
            value={egp(dividends.reduce((s, d) => s + d.netEgp, 0))}
            sub={dividends.length ? "Net of 10% withholding" : "No distributions yet"}
          />
          <SummaryStat
            icon={Building2}
            label="Enterprises held"
            value={`${enterprises}`}
            sub={`${allocation.length} sectors`}
          />
        </div>
      </section>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        {/* Holdings table */}
        <section
          aria-label="Holdings"
          className="rounded-2xl border border-gold/12 glass p-5 sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Wallet className="h-4 w-4 text-gold" />
              <h2 className="font-serif text-lg font-semibold">Equity holdings</h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground/85">
              {holdings.length} position{holdings.length === 1 ? "" : "s"}
            </span>
          </div>

          {holdings.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-sans text-sm text-muted-foreground">
                You do not yet hold any Equity Units.
              </p>
              <Link
                href="/dashboard/opportunities"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 font-sans text-xs font-semibold text-black"
              >
                Explore Capital Participation
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gold/10 font-sans text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2.5 pr-3 font-medium">Enterprise</th>
                    <th className="pb-2.5 pr-3 text-right font-medium">Equity Units</th>
                    <th className="pb-2.5 pr-3 text-right font-medium">Avg price</th>
                    <th className="pb-2.5 pr-3 text-right font-medium">AI fundamental price</th>
                    <th className="pb-2.5 pr-3 text-right font-medium">Value</th>
                    <th className="pb-2.5 pr-3 text-right font-medium">Return</th>
                    <th className="pb-2.5 text-right font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {holdings
                    .slice()
                    .sort(
                      (a, b) =>
                        b.equityUnits * b.enterprise.equityUnitPriceEgp -
                        a.equityUnits * a.enterprise.equityUnitPriceEgp
                    )
                    .map((h) => {
                      const value = h.equityUnits * h.enterprise.equityUnitPriceEgp;
                      const cost = h.equityUnits * h.avgPriceEgp;
                      const ret = cost > 0 ? ((value - cost) / cost) * 100 : 0;
                      const tier = TIER_META[h.enterprise.tier];
                      return (
                        <tr
                          key={h.enterprise.id}
                          className="border-b border-gold/5 transition-colors hover:bg-gold/[0.025] last:border-0"
                        >
                          <td className="py-3 pr-3">
                            <Link
                              href={`/dashboard/market?enterprise=${h.enterprise.slug}`}
                              className="group flex flex-col gap-0.5"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-serif text-sm font-medium text-foreground group-hover:text-gold-light">
                                  {h.enterprise.name}
                                </span>
                                <span className="rounded border border-gold/25 bg-gold/8 px-1.5 py-0.5 font-mono text-[11px] text-gold-light">
                                  T{h.enterprise.tier}
                                </span>
                              </div>
                              <span className="font-sans text-xs text-muted-foreground">
                                {h.enterprise.healthRating ?? "—"} ·{" "}
                                {tier?.name ?? h.enterprise.tier} ·{" "}
                                {SECTORS[h.enterprise.sector]?.label ?? h.enterprise.sector}
                              </span>
                            </Link>
                          </td>
                          <td className="py-3 pr-3 text-right font-mono text-xs text-foreground">
                            {h.equityUnits.toLocaleString()}
                          </td>
                          <td className="py-3 pr-3 text-right font-mono text-xs text-muted-foreground">
                            {egp(h.avgPriceEgp, { decimals: 0 })}
                          </td>
                          <td className="py-3 pr-3 text-right font-mono text-xs text-gold-light">
                            {egp(h.enterprise.equityUnitPriceEgp)}
                          </td>
                          <td className="py-3 pr-3 text-right font-serif font-medium text-foreground">
                            {egp(value, { compact: value >= 1_000_000 })}
                          </td>
                          <td className="py-3 pr-3 text-right">
                            <span
                              className={`inline-flex items-center gap-0.5 font-mono text-xs ${
                                ret >= 0 ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {ret >= 0 ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                              {Math.abs(ret).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Link
                              href={`/dashboard/market?enterprise=${h.enterprise.slug}`}
                              className="inline-flex items-center gap-1 rounded-full border border-gold/25 px-2.5 py-1 font-sans text-xs font-medium text-gold-light transition-colors hover:bg-gold/10"
                            >
                              Trade
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="pt-3 font-sans text-xs text-muted-foreground" colSpan={4}>
                      Total Constitutional Holdings value
                    </td>
                    <td className="pt-3 text-right font-serif text-base font-semibold text-gold-gradient">
                      {egp(portfolioValue, {
                        compact: portfolioValue >= 1_000_000,
                      })}
                    </td>
                    <td
                      className={`pt-3 text-right font-mono text-xs ${
                        unrealised >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {unrealised >= 0 ? "+" : "−"}
                      {pct(Math.abs(unrealisedPct))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        {/* Right column: allocation, dividends, entitlements */}
        <div className="flex flex-col gap-6">
          {/* Allocation donut */}
          <section className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <Wallet className="h-4 w-4 text-gold" />
              <h2 className="font-serif text-base font-semibold">Sector allocation</h2>
            </div>
            <PortfolioAllocationChart data={allocation} />
          </section>

          {/* Dividend history */}
          <section className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Coins className="h-4 w-4 text-gold" />
                <h2 className="font-serif text-base font-semibold">Dividend history</h2>
              </div>
              <span className="font-mono text-xs text-muted-foreground/85">
                10% WHT applied
              </span>
            </div>
            {dividends.length === 0 ? (
              <div className="py-6 text-center">
                <p className="font-sans text-xs text-muted-foreground">
                  No dividends distributed yet.
                </p>
                <p className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground/85">
                  Dividends are paid from realized profits after the enterprise reaches profitability — they appear here as <span className="font-mono">dividend_paid</span> ledger events sealed by the manager / board.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {dividends.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-xl border border-gold/10 bg-background/40 p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gold/15 bg-gold/5">
                          <Banknote className="h-3.5 w-3.5 text-gold" />
                        </span>
                        <div>
                          <p className="font-serif text-sm font-medium">{d.enterprise}</p>
                          <p className="font-sans text-xs text-muted-foreground">
                            {d.quarter} · paid {d.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-serif text-sm font-semibold text-gold-light">
                          {egp(d.netEgp)}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          net
                        </p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2 border-t border-gold/8 pt-2 font-mono text-xs text-muted-foreground">
                      <span>Gross {egp(d.grossEgp)}</span>
                      <span className="text-red-400/80">− WHT 10% ({egp(d.withholdingEgp)})</span>
                      <span className="ml-auto text-emerald-400/90">= {egp(d.netEgp)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Priority window entitlements */}
          <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-2.5">
              <HandCoins className="h-4 w-4 text-gold" />
              <h2 className="font-serif text-base font-semibold">
                Priority window entitlements
              </h2>
            </div>
            <p className="mb-3 font-sans text-[11px] leading-relaxed text-muted-foreground">
              Phase 1 pro-rata rights — existing Constitutional Partners may claim their slice
              of any sell order before the general market.
            </p>
            {entitlements.length === 0 ? (
              <div className="rounded-xl border border-gold/10 bg-background/30 px-3.5 py-4 text-center">
                <p className="font-sans text-xs text-muted-foreground">
                  No open Phase 1 sell orders on your holdings.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {entitlements.map(({ order, proRata, userShares }) => (
                  <li
                    key={order.id}
                    className="rounded-xl border border-gold/15 bg-background/40 p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-serif text-sm font-medium">
                          {order.enterprise.name}
                        </p>
                        <p className="font-sans text-xs text-muted-foreground">
                          Seller offering {order.equityUnits.toLocaleString()} units @{" "}
                          {egp(order.priceEgp, { decimals: 2 })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold text-gold-light">
                          {proRata.toLocaleString()}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          your pro-rata
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground/85">
                        You hold {userShares.toLocaleString()} /{" "}
                        {order.enterprise.totalEquityUnits.toLocaleString()} (
                        {(
                          (userShares / order.enterprise.totalEquityUnits) *
                          100
                        ).toFixed(2)}
                        %)
                      </span>
                      <Link
                        href={`/dashboard/market?enterprise=${order.enterprise.slug}&order=${order.id}`}
                        className="inline-flex items-center gap-1 rounded-full bg-gold-gradient px-3 py-1 font-sans text-xs font-semibold text-black transition-transform hover:scale-[1.02]"
                      >
                        Buy <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Constitutional footer note */}
      <footer className="mt-2 flex flex-col items-start gap-2 border-t border-gold/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground/85">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-gold/60" /> Zero Custody · hash-anchored
          </span>
          <span className="hidden sm:inline text-gold/15">|</span>
          <span className="inline-flex items-center gap-1">
            <Scale className="h-3 w-3 text-gold/60" /> CRE-enforced
          </span>
          <span className="hidden sm:inline text-gold/15">|</span>
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3 w-3 text-gold/60" /> Immutable ledger
          </span>
        </div>
        <span className="font-mono text-xs text-muted-foreground/80">
          Constitutional Hash: {shortHash(CONSTITUTIONAL_HASH, 14, 6)}
        </span>
      </footer>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const valueColor =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
        ? "text-red-400"
        : "text-foreground";
  return (
    <div className="relative rounded-xl border border-gold/10 bg-background/40 p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gold/15 bg-gold/5">
          <Icon className="h-3.5 w-3.5 text-gold" />
        </span>
        <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className={`mt-2 font-serif text-xl font-semibold sm:text-2xl ${valueColor}`}>
        {value}
      </p>
      {sub && (
        <p
          className={`mt-0.5 font-mono text-xs ${
            tone === "positive"
              ? "text-emerald-400/80"
              : tone === "negative"
                ? "text-red-400/80"
                : "text-muted-foreground/85"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
