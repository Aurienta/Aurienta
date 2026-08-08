"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  ListOrdered,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Scale,
  Lock,
  ShieldCheck,
  Hourglass,
  Percent,
  Coins,
  LineChart,
} from "lucide-react";
import { egp, pct, timeAgo } from "@/lib/aurienta/format";

export type MarketEnterprise = {
  id: string;
  slug: string;
  name: string;
  tier: string;
  sector: string;
  sectorLabel: string;
  equityUnitPriceEgp: number;
  totalEquityUnits: number;
  userShares: number;
  userAvgPriceEgp: number;
  healthRating: string | null;
  depth: {
    buyOrders: number;
    sellOrders: number;
    buyShares: number;
    sellShares: number;
  };
};

export type UserOrder = {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  enterpriseSlug: string;
  side: "buy" | "sell";
  equityUnits: number;
  priceEgp: number;
  phase: string;
  status: string;
  filledEquityUnits: number;
  feesEgp: number;
  createdAt: string;
};

export type RecentTrade = {
  id: string;
  enterpriseId: string | null;
  enterpriseName: string | null;
  payload: string;
  timestamp: string;
};

const PHASES = [
  {
    value: "phase_1",
    label: "Phase 1 · Pro-rata",
    note: "Existing Constitutional Partners only. Price = AI fundamental. Window: 48h.",
  },
  {
    value: "phase_2",
    label: "Phase 2 · Employee/Founder",
    note: "Long-term employees & founder. Price = AI fundamental. Window: 24h.",
  },
  {
    value: "phase_3",
    label: "Phase 3 · General market",
    note: "Open to all partners. Price within ±5% of AI fundamental.",
  },
] as const;

export function MarketWorkspace({
  enterprises,
  userOrders,
  recentTrades,
  initialSlug,
}: {
  enterprises: MarketEnterprise[];
  userOrders: UserOrder[];
  recentTrades: RecentTrade[];
  initialSlug?: string;
}) {
  const initialIdx = Math.max(
    0,
    enterprises.findIndex((e) => e.slug === initialSlug)
  );
  const [activeSlug, setActiveSlug] = React.useState<string>(
    enterprises[initialIdx]?.slug ?? enterprises[0]?.slug ?? ""
  );
  const active =
    enterprises.find((e) => e.slug === activeSlug) ?? enterprises[0];

  if (enterprises.length === 0) {
    return (
      <div className="rounded-2xl border border-gold/12 glass p-10 text-center">
        <p className="font-serif text-lg font-semibold">
          No secondary market access yet
        </p>
        <p className="mt-2 font-sans text-xs text-muted-foreground">
          Acquire Equity Units first — the secondary market opens with your first
          holding.
        </p>
        <Link
          href="/dashboard/opportunities"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 font-sans text-xs font-semibold text-black"
        >
          Explore opportunities
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Enterprise selector */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <Layers className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">
            Select an enterprise
          </h2>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {enterprises.map((e) => {
            const isActive = e.slug === active.slug;
            return (
              <button
                key={e.id}
                onClick={() => setActiveSlug(e.slug)}
                className={`group flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                  isActive
                    ? "border-gold/40 bg-gold-gradient text-black shadow-[0_4px_20px_-6px_rgba(212,175,55,0.4)]"
                    : "border-gold/12 glass text-foreground hover:border-gold/25"
                }`}
                aria-pressed={isActive}
              >
                <span
                  className={`font-mono text-[11px] ${
                    isActive ? "text-black/70" : "text-gold-light/80"
                  }`}
                >
                  T{e.tier}
                </span>
                <span className="font-serif text-sm font-medium">
                  {e.name}
                </span>
                <span
                  className={`font-mono text-xs ${
                    isActive ? "text-black/60" : "text-muted-foreground"
                  }`}
                >
                  {e.userShares > 0 ? (((e.userShares / e.totalEquityUnits) * 100).toFixed(2) + "%") : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        key={active.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"
      >
        {/* Left column: price band + order form */}
        <div className="flex flex-col gap-6">
          <PriceBandCard ent={active} />
          <OrderFormCard
            ent={active}
            onPlaced={(order) => {
              toast.success("Order listed", {
                description: `${order.side === "buy" ? "Buy" : "Sell"} ${order.equityUnits.toLocaleString()} ${active.name} @ ${egp(order.priceEgp, { decimals: 2 })}`,
              });
            }}
          />
        </div>

        {/* Right column: depth + open orders */}
        <div className="flex flex-col gap-6">
          <MarketDepthCard ent={active} />
          <OpenOrdersCard orders={userOrders} />
        </div>
      </motion.div>

      {/* Recent trades — full width */}
      <RecentTradesCard trades={recentTrades} />
    </div>
  );
}

// ── Price band card ──
function PriceBandCard({ ent }: { ent: MarketEnterprise }) {
  const price = ent.equityUnitPriceEgp;
  const min = +(price * 0.95).toFixed(2);
  const max = +(price * 1.05).toFixed(2);
  const ownershipPct =
    ent.totalEquityUnits > 0 ? (ent.userShares / ent.totalEquityUnits) * 100 : 0;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-xl font-semibold">{ent.name}</h3>
            <span className="rounded border border-gold/25 bg-gold/8 px-1.5 py-0.5 font-mono text-[11px] text-gold-light">
              T{ent.tier}
            </span>
            {ent.healthRating && (
              <span className="font-mono text-xs text-muted-foreground">
                {ent.healthRating}
              </span>
            )}
          </div>
          <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
            {ent.sectorLabel} · {ent.totalEquityUnits.toLocaleString()} total Equity Units
          </p>
        </div>
        <div className="text-right">
          <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
            AI fundamental price
          </p>
          <p className="font-serif text-3xl font-semibold text-gold-gradient">
            {egp(price)}
          </p>
          <p className="font-mono text-xs text-muted-foreground/85">
            JOZOUR v3 · refreshed 02:00 Cairo
          </p>
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
        <BandStat label="Band minimum" value={egp(min, { decimals: 2 })} tone="low" />
        <BandStat label="Fundamental" value={egp(price, { decimals: 2 })} tone="mid" />
        <BandStat label="Band maximum" value={egp(max, { decimals: 2 })} tone="high" />
      </div>

      <div className="relative mt-3 rounded-lg border border-gold/10 bg-background/40 p-3">
        <div className="flex items-center justify-between gap-2 font-sans text-[11px]">
          <span className="text-muted-foreground">Your holding</span>
          <span className="font-mono text-foreground">
            {ownershipPct.toFixed(2)}% ownership · {pct(ownershipPct, 2)}
          </span>
        </div>
        <Progress
          value={Math.min(100, ownershipPct)}
          className="mt-1.5 h-1 bg-gold/10 [&>div]:bg-gold-gradient"
        />
        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground/85">
          Avg cost {egp(ent.userAvgPriceEgp, { decimals: 0 })} ·{" "}
          {ent.userShares > 0 ? "active position" : "no position"}
        </p>
      </div>
    </section>
  );
}

function BandStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "low" | "mid" | "high";
}) {
  const color =
    tone === "low"
      ? "text-red-400/90"
      : tone === "high"
        ? "text-emerald-400/90"
        : "text-gold-light";
  return (
    <div className="rounded-lg border border-gold/10 bg-background/40 p-3 text-center">
      <p className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 font-mono text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}

// ── Order form ──
function OrderFormCard({
  ent,
  onPlaced,
}: {
  ent: MarketEnterprise;
  onPlaced: (order: {
    side: "buy" | "sell";
    equityUnits: number;
    priceEgp: number;
  }) => void;
}) {
  const [side, setSide] = React.useState<"buy" | "sell">("buy");
  const [phase, setPhase] = React.useState<string>("phase_3");
  const [shares, setShares] = React.useState<string>("1");
  const [submitting, setSubmitting] = React.useState(false);

  const sharesNum = Math.max(0, Math.floor(Number(shares) || 0));
  const price = ent.equityUnitPriceEgp; // read-only fundamental
  const gross = sharesNum * price;
  const platformFee = +(gross * 0.005).toFixed(2);
  const cgt = side === "sell" ? +(gross * 0.1).toFixed(2) : 0;
  const fees = +(platformFee + cgt).toFixed(2);
  const net = side === "buy" ? gross + fees : gross - fees;

  const phaseMeta = PHASES.find((p) => p.value === phase) ?? PHASES[2];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sharesNum <= 0) {
      toast.error("Enter a positive share count");
      return;
    }
    if (side === "sell" && sharesNum > ent.userShares) {
      toast.error("No-speculation rule", {
        description: `You own ${ent.userShares.toLocaleString()} units — cannot sell ${sharesNum.toLocaleString()}.`,
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          enterpriseId: ent.id,
          side,
          shares: sharesNum,
          priceEgp: price,
          phase,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Order denied", {
          description: data.policy
            ? `CRE policy: ${data.policy}`
            : "Adjust your order and retry.",
        });
        setSubmitting(false);
        return;
      }
      onPlaced({
        side: data.order.side,
        equityUnits: data.order.equityUnits,
        priceEgp: data.order.priceEgp,
      });
      setShares("1");
    } catch {
      toast.error("Network error", {
        description: "Could not reach the constitutional runtime.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <LineChart className="h-4 w-4 text-gold" />
          <h3 className="font-serif text-base font-semibold">Place an order</h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground/85">
          {ent.slug}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Side toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide("buy")}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 font-sans text-sm font-medium transition-all ${
              side === "buy"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-gold/12 bg-background/40 text-muted-foreground hover:border-gold/25"
            }`}
            aria-pressed={side === "buy"}
          >
            <TrendingUp className="h-4 w-4" /> Buy
          </button>
          <button
            type="button"
            onClick={() => setSide("sell")}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 font-sans text-sm font-medium transition-all ${
              side === "sell"
                ? "border-red-500/40 bg-red-500/10 text-red-300"
                : "border-gold/12 bg-background/40 text-muted-foreground hover:border-gold/25"
            }`}
            aria-pressed={side === "sell"}
          >
            <TrendingDown className="h-4 w-4" /> Sell
          </button>
        </div>

        {/* Phase selector */}
        <div className="grid gap-1.5">
          <Label className="font-sans text-[11px] text-muted-foreground">
            Priority window phase
          </Label>
          <Tabs value={phase} onValueChange={setPhase}>
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-gold/[0.04] p-1">
              {PHASES.map((p) => (
                <TabsTrigger
                  key={p.value}
                  value={p.value}
                  className="px-2 py-1.5 font-sans text-xs leading-tight data-[state=active]:bg-gold-gradient data-[state=active]:text-black"
                >
                  {p.label.split(" · ")[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="font-sans text-xs leading-relaxed text-muted-foreground/80">
            {phaseMeta.note}
          </p>
        </div>

        {/* Equity Units + price */}
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="equityUnits" className="font-sans text-[11px] text-muted-foreground">
              Shares
            </Label>
            <Input
              id="equityUnits"
              type="number"
              inputMode="numeric"
              min={1}
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="price" className="font-sans text-[11px] text-muted-foreground">
              Price per unit
            </Label>
            <Input
              id="price"
              type="text"
              value={`${price.toFixed(2)} EGP`}
              readOnly
              aria-readonly
              className="cursor-not-allowed font-mono text-sm text-muted-foreground"
            />
          </div>
        </div>
        <p className="-mt-1 flex items-center gap-1.5 font-sans text-xs text-muted-foreground/85">
          <Lock className="h-3 w-3 text-gold/60" />
          Price locked to AI fundamental — ±5% band enforced by the CRE for Phase 3.
        </p>

        <Separator className="bg-gold/10" />

        {/* Cost breakdown */}
        <dl className="grid grid-cols-2 gap-y-2 font-sans text-xs">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Coins className="h-3 w-3 text-gold/60" /> Gross
          </dt>
          <dd className="text-right font-mono text-foreground">{egp(gross, { decimals: 2 })}</dd>
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Percent className="h-3 w-3 text-gold/60" /> Platform fee (0.5%)
          </dt>
          <dd className="text-right font-mono text-muted-foreground">
            {egp(platformFee, { decimals: 2 })}
          </dd>
          {side === "sell" && (
            <>
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Scale className="h-3 w-3 text-gold/60" /> CGT (10%)
              </dt>
              <dd className="text-right font-mono text-red-400/80">
                −{egp(cgt, { decimals: 2 })}
              </dd>
            </>
          )}
          <dt className="font-medium text-foreground">
            {side === "buy" ? "Total cost" : "Net proceeds"}
          </dt>
          <dd className="text-right font-serif text-sm font-semibold text-gold-light">
            {egp(net, { decimals: 2 })}
          </dd>
        </dl>

        <Button
          type="submit"
          disabled={submitting}
          className={`w-full font-sans text-sm font-semibold transition-all ${
            side === "buy"
              ? "bg-emerald-500/90 text-white hover:bg-emerald-500"
              : "bg-red-500/90 text-white hover:bg-red-500"
          } disabled:opacity-60`}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Placing order…
            </>
          ) : (
            <>
              {side === "buy" ? "Place buy order" : "Place sell order"}
            </>
          )}
        </Button>
      </form>
    </section>
  );
}

// ── Market depth ──
function MarketDepthCard({ ent }: { ent: MarketEnterprise }) {
  const { buyOrders, sellOrders, buyShares, sellShares } = ent.depth;
  const total = buyShares + sellShares;
  const buyPct = total > 0 ? (buyShares / total) * 100 : 50;
  const sellPct = 100 - buyPct;
  const imbalance = buyShares - sellShares;

  return (
    <section className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <Activity className="h-4 w-4 text-gold" />
        <h3 className="font-serif text-base font-semibold">Market depth</h3>
      </div>
      <p className="mb-3 font-sans text-[11px] leading-relaxed text-muted-foreground">
        Aggregate order interest only — no order book. Anti-speculation rule
        forbids derivatives, margin, and short selling.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <DepthStat
          icon={TrendingUp}
          tone="buy"
          count={buyOrders}
          equityUnits={buyShares}
        />
        <DepthStat
          icon={TrendingDown}
          tone="sell"
          count={sellOrders}
          equityUnits={sellShares}
        />
      </div>

      <div className="mt-3">
        <div className="flex h-2 overflow-hidden rounded-full bg-gold/10">
          <div
            className="bg-emerald-500/70 transition-all"
            style={{ width: `${buyPct}%` }}
          />
          <div
            className="bg-red-500/70 transition-all"
            style={{ width: `${sellPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between font-mono text-xs text-muted-foreground/80">
          <span>{pct(buyPct, 0)} buy</span>
          <span>{pct(sellPct, 0)} sell</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-gold/10 bg-background/40 px-3 py-2">
        <span className="flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground">
          <Hourglass className="h-3 w-3 text-gold/60" /> Est. fill time
        </span>
        <span className="font-mono text-[11px] text-foreground">
          {imbalance > 0
            ? `${imbalance.toLocaleString()}u net buy · FIFO`
            : imbalance < 0
              ? `${Math.abs(imbalance).toLocaleString()}u net sell · FIFO`
              : "Balanced · FIFO"}
        </span>
      </div>
    </section>
  );
}

function DepthStat({
  icon: Icon,
  tone,
  count,
  equityUnits,
}: {
  icon: React.ElementType;
  tone: "buy" | "sell";
  count: number;
  equityUnits: number;
}) {
  const color = tone === "buy" ? "text-emerald-400" : "text-red-400";
  return (
    <div className="rounded-lg border border-gold/10 bg-background/40 p-3">
      <div className={`flex items-center gap-1.5 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        <span className="font-sans text-xs uppercase tracking-wider">
          {tone === "buy" ? "Buy-side" : "Sell-side"}
        </span>
      </div>
      <p className="mt-1 font-serif text-lg font-semibold text-foreground">
        {count} order{count === 1 ? "" : "s"}
      </p>
      <p className="font-mono text-xs text-muted-foreground">
        {equityUnits.toLocaleString()} units
      </p>
    </div>
  );
}

// ── Open orders ──
function OpenOrdersCard({ orders }: { orders: UserOrder[] }) {
  return (
    <section className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ListOrdered className="h-4 w-4 text-gold" />
          <h3 className="font-serif text-base font-semibold">Your open orders</h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground/85">
          {orders.length} active
        </span>
      </div>
      {orders.length === 0 ? (
        <div className="py-6 text-center">
          <p className="font-sans text-xs text-muted-foreground">
            No open orders. Place your first order above.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map((o) => {
            const isBuy = o.side === "buy";
            return (
              <li
                key={o.id}
                className="rounded-lg border border-gold/10 bg-background/40 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${
                        isBuy
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {isBuy ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                    </span>
                    <div>
                      <p className="font-serif text-sm font-medium">
                        {o.enterpriseName}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {o.phase.replace("_", " ")} · {timeAgo(new Date(o.createdAt))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs text-foreground">
                      {o.equityUnits.toLocaleString()}u @ {egp(o.priceEgp, { decimals: 2 })}
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-0.5 border-gold/15 px-1.5 py-0 font-mono text-[11px] text-muted-foreground"
                    >
                      {o.status.replace("_", " ")}
                      {o.filledEquityUnits > 0
                        ? ` · ${o.filledEquityUnits.toLocaleString()} filled`
                        : ""}
                    </Badge>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ── Recent trades ──
function RecentTradesCard({ trades }: { trades: RecentTrade[] }) {
  return (
    <section className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-gold" />
          <h3 className="font-serif text-base font-semibold">
            Recent trades · immutable ledger
          </h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground/85">
          share_transferred events
        </span>
      </div>
      {trades.length === 0 ? (
        <div className="py-6 text-center">
          <p className="font-sans text-xs text-muted-foreground">
            No share transfers recorded yet. The first trade on this market will
            appear here, hash-anchored to the immutable ledger.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-gold/10 font-sans text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Side</th>
                <th className="pb-2 pr-3 font-medium">Enterprise</th>
                <th className="pb-2 pr-3 text-right font-medium">Equity Units</th>
                <th className="pb-2 pr-3 text-right font-medium">Price</th>
                <th className="pb-2 pr-3 text-right font-medium">Gross</th>
                <th className="pb-2 text-right font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => {
                let side = "—";
                let shares = 0;
                let priceEgp = 0;
                let gross = 0;
                try {
                  const p = JSON.parse(t.payload);
                  side = p.side ?? "—";
                  shares = p.equityUnits ?? 0;
                  priceEgp = p.priceEgp ?? 0;
                  gross = p.gross ?? shares * priceEgp;
                } catch {}
                const isBuy = side === "buy";
                return (
                  <tr
                    key={t.id}
                    className="border-b border-gold/5 last:border-0"
                  >
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-flex items-center gap-0.5 font-mono text-xs ${
                          isBuy ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {isBuy ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {side}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-sans text-xs text-foreground">
                      {t.enterpriseName ?? "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs">
                      {shares.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs text-muted-foreground">
                      {egp(priceEgp, { decimals: 2 })}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs text-gold-light">
                      {egp(gross, { decimals: 2 })}
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs text-muted-foreground/85">
                      {timeAgo(new Date(t.timestamp))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
