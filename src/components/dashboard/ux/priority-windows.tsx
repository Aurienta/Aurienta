"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Hourglass,
  TrendingUp,
  Building2,
  ArrowRight,
  Clock,
  HandCoins,
  AlertCircle,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TIER_META } from "@/lib/aurienta/constants";

export type PriorityWindow = {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  enterpriseSlug: string;
  enterpriseTier: string;
  sharesForSale: number;
  priceEgp: number;
  userShares: number;
  totalEquityUnits: number;
  proRataShares: number; // floor(userShares / totalEquityUnits × orderShares)
  proRataValueEgp: number;
  windowClosesAt: string; // ISO — order.createdAt + 48h
  sellerInitials: string;
};

export function PriorityWindows({
  windows,
  summary,
}: {
  windows: PriorityWindow[];
  summary: { count: number; totalEquityUnits: number; totalEntitlementEgp: number };
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Summary card */}
      <SummaryCard summary={summary} />

      {/* Windows */}
      {windows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {windows.map((w, i) => (
            <WindowCard key={w.id} w={w} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  summary,
}: {
  summary: { count: number; totalEquityUnits: number; totalEntitlementEgp: number };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-gold/22 bg-gradient-to-br from-gold/[0.08] via-background to-background p-5"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-gold/10">
            <Hourglass className="h-5 w-5 text-gold" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
              Phase 1 — Pro-Rata Priority
            </p>
            <h2 className="mt-0.5 font-serif text-xl font-semibold text-foreground">
              {summary.count} active window{summary.count === 1 ? "" : "s"}
            </h2>
            <p className="mt-0.5 font-sans text-xs text-muted-foreground">
              Existing Constitutional Partners get first refusal before Phase 2 (employees) and Phase 3 (general market).
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Stat label="Shares available" value={summary.totalEquityUnits.toLocaleString()} />
          <Stat
            label="Your entitlements"
            value={`${summary.totalEntitlementEgp.toLocaleString()} EGP`}
            accent
          />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gold/15 bg-background/60 p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/85">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-serif text-lg font-semibold",
          accent ? "text-gold-light" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function WindowCard({ w, index }: { w: PriorityWindow; index: number }) {
  const closesAt = new Date(w.windowClosesAt);
  const ownershipPct = w.totalEquityUnits > 0 ? (w.userShares / w.totalEquityUnits) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative flex flex-col gap-4 rounded-2xl border border-gold/15 bg-background/50 p-5 transition-colors hover:border-gold/30 hover:bg-background/70"
    >
      {/* Header: enterprise + tier */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/[0.05]">
            <Building2 className="h-4 w-4 text-gold" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-serif text-sm font-semibold text-foreground">
              {w.enterpriseName}
            </p>
            <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground/85">
              <span>Tier {w.enterpriseTier}</span>
              <span>·</span>
              <span>{TIER_META[w.enterpriseTier]?.legalForm ?? "LLC"}</span>
              <span>·</span>
              <span>{ownershipPct.toFixed(2)}% owned</span>
            </div>
          </div>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 border-gold/25 bg-gold/[0.06] font-mono text-xs text-gold-light"
        >
          Phase 1
        </Badge>
      </div>

      {/* Sell order details */}
      <div className="grid grid-cols-2 gap-3">
        <DetailTile
          label="Shares for sale"
          value={w.sharesForSale.toLocaleString()}
          icon={Layers}
        />
        <DetailTile
          label="Price per share"
          value={`${w.priceEgp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`}
          icon={TrendingUp}
        />
      </div>

      {/* Pro-rata entitlement */}
      <div className="rounded-xl border border-gold/25 bg-gold/[0.05] p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-gold/80">
              <HandCoins className="h-3 w-3" />
              Your pro-rata entitlement
            </p>
            <p className="mt-1 font-serif text-2xl font-semibold text-gold-light">
              {w.proRataShares.toLocaleString()} share{w.proRataShares === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
              ≈ {w.proRataValueEgp.toLocaleString()} EGP · computed from your {w.userShares.toLocaleString()}-share stake ({ownershipPct.toFixed(2)}%)
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80">
              Seller
            </p>
            <p className="mt-1 font-serif text-sm font-semibold text-foreground">
              {w.sellerInitials}
            </p>
          </div>
        </div>
      </div>

      {/* Countdown + CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CountdownTimer closesAt={closesAt} />
        <Link
          href={`/dashboard/market?enterprise=${w.enterpriseSlug}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold-gradient px-4 font-sans text-sm font-semibold text-black shadow-[0_4px_20px_-6px_rgba(212,175,55,0.6)] transition-transform hover:scale-[1.02]"
        >
          Exercise pro-rata
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

function DetailTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-gold/10 bg-gold/[0.02] p-2.5">
      <p className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/85">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-1 font-serif text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function CountdownTimer({ closesAt }: { closesAt: Date }) {
  // Re-render every second for a live feel.
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    const id = setInterval(force, 1000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const ms = closesAt.getTime() - now;
  const expired = ms <= 0;

  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const urgent = ms < 6 * 3600 * 1000; // <6h → red

  return (
    <div className="flex items-center gap-2">
      <Clock
        className={cn(
          "h-3.5 w-3.5",
          expired ? "text-muted-foreground/85" : urgent ? "text-red-400" : "text-gold"
        )}
      />
      <span
        className={cn(
          "font-mono text-xs uppercase tracking-[0.2em]",
          expired ? "text-muted-foreground/75" : urgent ? "text-red-300" : "text-muted-foreground/80"
        )}
      >
        {expired ? "Window closed" : "Closes in"}
      </span>
      {!expired && (
        <span
          className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            urgent ? "text-red-300" : "text-foreground"
          )}
          aria-live="polite"
        >
          {days > 0 && `${days}d `}
          {String(hours).padStart(2, "0")}h {String(minutes).padStart(2, "0")}m{" "}
          <span className="text-muted-foreground/85">{String(seconds).padStart(2, "0")}s</span>
        </span>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-gold/12 bg-gold/[0.02] px-6 py-16 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.05]">
        <AlertCircle className="h-5 w-5 text-gold/60" />
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
        No active priority windows
      </h3>
      <p className="mt-1 max-w-sm font-sans text-xs text-muted-foreground">
        You'll be notified when Constitutional Partners place sell orders. Phase 1 pro-rata windows
        give existing Constitutional Partners first refusal — keep an eye on your inbox.
      </p>
      <Link
        href="/dashboard/portfolio"
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-gold/20 bg-gold/[0.04] px-4 font-sans text-xs text-muted-foreground transition-colors hover:border-gold/30 hover:text-foreground"
      >
        View your portfolio
        <ArrowRight className="h-3 w-3" />
      </Link>
    </motion.div>
  );
}
