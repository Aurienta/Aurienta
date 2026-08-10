export const dynamic = "force-dynamic";
import Link from "next/link";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { SECTORS, CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { shortHash } from "@/lib/aurienta/format";
import { GoldStar } from "@/components/aurienta-logo";
import {
  MarketWorkspace,
  type MarketEnterprise,
  type UserOrder,
  type RecentTrade,
} from "@/components/dashboard/capital/market-workspace";
import {
  LineChart,
  ShieldCheck,
  Scale,
  Lock,
  Hourglass,
  Users,
  TrendingUp,
} from "lucide-react";

export const metadata = { title: "Enterprise Registry · AURIENTA" };

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = (await getCurrentUser())!;
  const sp = await searchParams;
  const initialSlug =
    typeof sp.enterprise === "string" ? sp.enterprise : undefined;

  // User's holdings — these define which enterprises they may trade.
  const holdings = user.ownershipRecords
    .filter((s) => s.equityUnits > 0)
    .map((s) => ({
      enterpriseId: s.enterpriseId,
      equityUnits: s.equityUnits,
      avgPriceEgp: s.avgPriceEgp,
      enterprise: s.enterprise,
    }));

  // For each holding: aggregate depth (count buy/sell open orders) for that enterprise.
  const enterpriseIds = holdings.map((h) => h.enterpriseId);
  const depthRows = enterpriseIds.length
    ? await db.tradeOrder.groupBy({
        by: ["enterpriseId", "side"],
        where: {
          enterpriseId: { in: enterpriseIds },
          status: { in: ["open", "partially_filled"] },
        },
        _count: { _all: true },
        _sum: { equityUnits: true },
      })
    : [];
  const depthByEnt = new Map<
    string,
    { buyOrders: number; sellOrders: number; buyShares: number; sellShares: number }
  >();
  for (const r of depthRows) {
    const entry = depthByEnt.get(r.enterpriseId) ?? {
      buyOrders: 0,
      sellOrders: 0,
      buyShares: 0,
      sellShares: 0,
    };
    if (r.side === "buy") {
      entry.buyOrders = r._count._all;
      entry.buyShares = r._sum.equityUnits ?? 0;
    } else if (r.side === "sell") {
      entry.sellOrders = r._count._all;
      entry.sellShares = r._sum.equityUnits ?? 0;
    }
    depthByEnt.set(r.enterpriseId, entry);
  }

  const enterprises: MarketEnterprise[] = holdings.map((h) => {
    const depth = depthByEnt.get(h.enterpriseId) ?? {
      buyOrders: 0,
      sellOrders: 0,
      buyShares: 0,
      sellShares: 0,
    };
    return {
      id: h.enterprise.id,
      slug: h.enterprise.slug,
      name: h.enterprise.name,
      tier: h.enterprise.tier,
      sector: h.enterprise.sector,
      sectorLabel: SECTORS[h.enterprise.sector]?.label ?? h.enterprise.sector,
      equityUnitPriceEgp: h.enterprise.equityUnitPriceEgp,
      totalEquityUnits: h.enterprise.totalEquityUnits,
      userShares: h.equityUnits,
      userAvgPriceEgp: h.avgPriceEgp,
      healthRating: h.enterprise.healthRating,
      depth,
    };
  });

  // User's open orders across all enterprises.
  const openOrders = await db.tradeOrder.findMany({
    where: {
      userId: user.id,
      status: { in: ["open", "partially_filled"] },
    },
    include: { enterprise: true },
    orderBy: { createdAt: "desc" },
  });
  const userOrders: UserOrder[] = openOrders.map((o) => ({
    id: o.id,
    enterpriseId: o.enterpriseId,
    enterpriseName: o.enterprise.name,
    enterpriseSlug: o.enterprise.slug,
    side: o.side as "buy" | "sell",
    equityUnits: o.equityUnits,
    priceEgp: o.priceEgp,
    phase: o.phase,
    status: o.status,
    filledEquityUnits: o.filledEquityUnits,
    feesEgp: o.feesEgp,
    createdAt: o.createdAt.toISOString(),
  }));

  // Recent share_transferred ledger events (last 5).
  const recentEvents = await db.ledgerEvent.findMany({
    where: { eventType: "share_transferred" },
    orderBy: { timestamp: "desc" },
    take: 5,
    include: { enterprise: true },
  });
  const recentTrades: RecentTrade[] = recentEvents.map((e) => ({
    id: e.id,
    enterpriseId: e.enterpriseId,
    enterpriseName: e.enterprise?.name ?? null,
    payload: e.payload,
    timestamp: e.timestamp.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-7">
      {/* Heading */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <GoldStar className="h-3.5 w-3.5" />
            <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/80">
              Constitutional Enterprise Registry
            </span>
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
            Liquidity under constitutional rules
          </h1>
          <p className="mt-1.5 max-w-2xl font-sans text-sm text-muted-foreground">
            Three-phase priority windows, AI fundamental pricing, ±5% band.
            No derivatives, no margin, no short selling — Rule I 1.8.
          </p>
        </div>
        <Link
          href="/dashboard/portfolio"
          className="inline-flex items-center gap-1.5 self-start rounded-full border border-gold/25 px-4 py-2 font-sans text-xs text-foreground transition-colors hover:bg-gold/5"
        >
          Back to Constitutional Holdings
        </Link>
      </header>

      {/* Intro card: 3-phase priority window system + ±5% band */}
      <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <LineChart className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">
            How the priority window system works
          </h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <PhaseCard
            n="Phase 1"
            duration="48 hours"
            who="Existing Constitutional Partners · pro-rata"
            icon={Users}
            body="When a Constitutional Partner lists a sell order, every other holder of that enterprise receives a pro-rata slice based on their ownership. Price equals the AI fundamental exactly."
          />
          <PhaseCard
            n="Phase 2"
            duration="24 hours"
            who="Long-term employees (≥3y) & Founding Operator"
            icon={ShieldCheck}
            body="After Phase 1, the workforce that built the enterprise gets the next window — preserving the productive community. Price still equals the AI fundamental."
          />
          <PhaseCard
            n="Phase 3"
            duration="Open"
            who="General Enterprise Registry · ±5% band"
            icon={TrendingUp}
            body="After 72 total hours, the order opens to all Constitutional Partners. Price may float within ±5% of the AI fundamental — the only flexibility the CRE permits."
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <RuleNote icon={Scale} text="fundamental_pricing.rego — ±5% band, Phase 1/2 = CPP exactly" />
          <RuleNote icon={Lock} text="no_speculation.rego — no derivatives, margin, short selling" />
          <RuleNote icon={Hourglass} text="priority_windows.rego — 48h / 24h / open ordering" />
        </div>
      </section>

      {/* Workspace */}
      <MarketWorkspace
        enterprises={enterprises}
        userOrders={userOrders}
        recentTrades={recentTrades}
        initialSlug={initialSlug}
      />

      {/* Footer */}
      <footer className="mt-2 flex flex-col items-start gap-2 border-t border-gold/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground/85">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-gold/60" /> Zero Custody
          </span>
          <span className="hidden sm:inline text-gold/15">|</span>
          <span className="inline-flex items-center gap-1">
            <Scale className="h-3 w-3 text-gold/60" /> CRE-enforced pricing
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

function PhaseCard({
  n,
  duration,
  who,
  body,
  icon: Icon,
}: {
  n: string;
  duration: string;
  who: string;
  body: string;
  icon: React.ElementType;
}) {
  return (
    <article className="rounded-xl border border-gold/12 bg-background/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gold/15 bg-gold/5">
            <Icon className="h-3.5 w-3.5 text-gold" />
          </span>
          <span className="font-serif text-sm font-semibold">{n}</span>
        </div>
        <span className="rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 font-mono text-[11px] text-gold-light">
          {duration}
        </span>
      </div>
      <p className="mt-2 font-sans text-[11px] font-medium text-foreground">
        {who}
      </p>
      <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-muted-foreground">
        {body}
      </p>
    </article>
  );
}

function RuleNote({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gold/10 bg-background/40 px-3 py-2">
      <Icon className="h-3 w-3 shrink-0 text-gold/70" />
      <span className="font-mono text-xs text-muted-foreground">{text}</span>
    </div>
  );
}
