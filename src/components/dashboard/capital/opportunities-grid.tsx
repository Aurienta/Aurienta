"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed,
  Factory,
  Palmtree,
  Cpu,
  ShoppingBag,
  Truck,
  Wheat,
  TrendingUp,
  ShieldCheck,
  Coins,
  ArrowRight,
  Compass,
  Building2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { egp, pct } from "@/lib/aurienta/format";
import { TIER_META } from "@/lib/aurienta/constants";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  ReserveSharesDialog,
  type ReserveTarget,
} from "./reserve-shares-dialog";

const SECTOR_ICONS: Record<string, React.ElementType> = {
  food: UtensilsCrossed,
  manufacturing: Factory,
  tourism: Palmtree,
  technology: Cpu,
  retail: ShoppingBag,
  logistics: Truck,
  agriculture: Wheat,
};

export type Opportunity = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  sector: string;
  sectorLabel: string;
  tier: string;
  healthRating: string | null;
  healthScore: number;
  fundraisingGoalEgp: number;
  raisedEgp: number;
  equityUnitPriceEgp: number;
  minShares: number;
  minParticipationEgp: number;
  status: string;
  stage: string;
};

const PHASE_TABS = [
  { value: "all", label: "All", tKey: "common.all", status: ["active", "fundraising_active", "fundraising_closed", "graduation_pending"] },
  { value: "active", label: "Active Capital Formation", status: ["fundraising_active"] },
  { value: "closed", label: "Closed Capital Formation", status: ["fundraising_closed", "graduation_pending"] },
  { value: "milestone", label: "Milestone unlock", status: ["active"] },
] as const;

export function OpportunitiesGrid({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const [phase, setPhase] = React.useState<string>("all");
  const [target, setTarget] = React.useState<Opportunity | null>(null);
  const [open, setOpen] = React.useState(false);
  const { t } = useLanguage();

  const activeTab = PHASE_TABS.find((tab) => tab.value === phase) ?? PHASE_TABS[0];
  const filtered = opportunities.filter((o) =>
    (activeTab.status as readonly string[]).includes(o.status)
  );

  function handleReserve(o: Opportunity) {
    setTarget(o);
    setOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Phase filter tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={phase} onValueChange={setPhase}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-gold/[0.04] p-1 sm:flex sm:w-auto sm:grid-cols-4">
            {PHASE_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="font-sans text-[11px] data-[state=active]:bg-gold-gradient data-[state=active]:text-black"
              >
                {"tKey" in tab ? t(tab.tKey) : tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <span className="font-mono text-xs text-muted-foreground/85">
          {filtered.length} opportunit{filtered.length === 1 ? "y" : "ies"} ·{" "}
          {opportunities.length} total
        </span>
      </div>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <EmptyState phase={phase} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((o) => (
              <motion.div
                key={o.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <OppCard o={o} onReserve={() => handleReserve(o)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Reservation dialog */}
      <ReserveSharesDialog
        target={
          target
            ? {
                id: target.id,
                slug: target.slug,
                name: target.name,
                tier: target.tier,
                equityUnitPriceEgp: target.equityUnitPriceEgp,
                minShares: target.minShares,
                sectorLabel: target.sectorLabel,
              }
            : null
        }
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setTarget(null);
        }}
      />
    </div>
  );
}

function OppCard({
  o,
  onReserve,
}: {
  o: Opportunity;
  onReserve: () => void;
}) {
  const SectorIcon = SECTOR_ICONS[o.sector] ?? Building2;
  const tier = TIER_META[o.tier];
  const raisedPct =
    o.fundraisingGoalEgp > 0
      ? Math.min(100, (o.raisedEgp / o.fundraisingGoalEgp) * 100)
      : 0;
  const remainingGoal = Math.max(o.fundraisingGoalEgp - o.raisedEgp, 0);
  const statusLabel =
    o.status === "fundraising_active"
      ? "Active Capital Formation"
      : o.status === "fundraising_closed"
        ? "Capital Formation closed"
        : o.status === "graduation_pending"
          ? "Graduation pending"
          : "Milestone unlock";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gold/12 glass transition-colors hover:border-gold/25">
      {/* Header */}
      <div className="relative flex items-start justify-between gap-3 p-5 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/15 bg-gold-gradient-soft">
            <SectorIcon className="h-5 w-5 text-gold-light" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-serif text-base font-semibold leading-tight">
              {o.name}
            </h3>
            <p className="mt-0.5 line-clamp-2 font-sans text-[11px] text-muted-foreground">
              {o.tagline ?? o.sectorLabel}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded border border-gold/25 bg-gold/8 px-1.5 py-0.5 font-mono text-[11px] text-gold-light">
            T{o.tier}
          </span>
          {o.healthRating && (
            <span className="font-mono text-xs text-muted-foreground">
              {o.healthRating}
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="px-5 pb-3">
        <div className="mb-1.5 flex items-center justify-between font-sans text-xs">
          <span className="text-muted-foreground">
            {statusLabel} · {tier?.name ?? o.tier}
          </span>
          <span className="font-mono text-gold-light">{pct(raisedPct, 0)} raised</span>
        </div>
        <Progress
          value={raisedPct}
          className="h-1.5 bg-gold/10 [&>div]:bg-gold-gradient"
        />
        <div className="mt-1.5 flex items-center justify-between font-mono text-xs text-muted-foreground/80">
          <span>{egp(o.raisedEgp, { compact: o.raisedEgp >= 1_000_000 })}</span>
          <span>of {egp(o.fundraisingGoalEgp, { compact: o.fundraisingGoalEgp >= 1_000_000 })}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px bg-gold/8 px-5 py-3">
        <Stat
          label="AI fundamental price / unit"
          value={egp(o.equityUnitPriceEgp)}
          icon={TrendingUp}
        />
        <Stat
          label="Min Participation"
          value={
            remainingGoal > 0
              ? `${o.minShares.toLocaleString()}u · ${egp(o.minShares * o.equityUnitPriceEgp, { compact: o.minShares * o.equityUnitPriceEgp >= 100_000 })}`
              : egp(o.minParticipationEgp, { compact: o.minParticipationEgp >= 100_000 })
          }
          icon={Coins}
        />
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-gold/10 p-4">
        <Link
          href={`/dashboard/market?enterprise=${o.slug}`}
          className="inline-flex items-center gap-1 font-sans text-[11px] text-muted-foreground transition-colors hover:text-gold"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-gold/70" /> View on market
        </Link>
        <Button
          type="button"
          onClick={onReserve}
          className="bg-gold-gradient font-sans text-xs font-semibold text-black hover:opacity-90"
          size="sm"
        >
          Reserve Equity Units <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 bg-background/40 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-gold/70" />
        <span className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <span className="font-mono text-xs text-foreground">{value}</span>
    </div>
  );
}

function EmptyState({ phase }: { phase: string }) {
  const label =
    PHASE_TABS.find((t) => t.value === phase)?.label ?? "this phase";
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gold/10 glass px-6 py-16 text-center">
      <div className="pointer-events-none absolute opacity-50 blur-2xl" aria-hidden />
      <div className="relative mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5">
        <Compass className="h-6 w-6 text-gold" />
      </div>
      <h3 className="font-serif text-lg font-semibold">No {label.toLowerCase()} opportunities</h3>
      <p className="mt-2 max-w-sm font-sans text-xs text-muted-foreground">
        New enterprises enter the Capital Coordination Layer weekly. Switch to
        another phase to see what&apos;s active right now.
      </p>
    </div>
  );
}
