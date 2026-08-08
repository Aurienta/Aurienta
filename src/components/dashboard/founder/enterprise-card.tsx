"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { egp, pct } from "@/lib/aurienta/format";
import {
  Building2,
  ChevronRight,
  Clock,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { FounderEnterprise } from "./types";
import { enterpriseStatus, HealthPill, TierBadge } from "./badges";

export function EnterpriseCard({
  enterprise,
  onOpen,
}: {
  enterprise: FounderEnterprise;
  onOpen: () => void;
}) {
  const raisedPct = enterprise.fundraisingGoalEgp > 0
    ? Math.min(100, (enterprise.raisedEgp / enterprise.fundraisingGoalEgp) * 100)
    : 0;
  const runway =
    enterprise.monthlyBurnEgp > 0
      ? enterprise.lawFirmClientAccountBalanceEgp / enterprise.monthlyBurnEgp
      : 0;
  const s = enterpriseStatus(enterprise.status);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gold/10 blur-3xl transition-opacity group-hover:bg-gold/15" />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <TierBadge tier={enterprise.tier} />
            <HealthPill rating={enterprise.healthRating} />
          </div>
          <h3 className="truncate font-serif text-xl font-semibold leading-tight text-foreground">
            {enterprise.name}
          </h3>
          {enterprise.tagline && (
            <p className="mt-1 line-clamp-2 font-sans text-xs text-muted-foreground">
              {enterprise.tagline}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-background/50 px-2 py-0.5 font-sans text-xs font-medium",
              s.text
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
            {s.label}
          </span>
          <Badge
            variant="outline"
            className="border-gold/15 bg-transparent text-xs text-muted-foreground"
          >
            {enterprise.sector}
          </Badge>
        </div>
      </div>

      {/* Capital Formation progress */}
      <div className="relative">
        <div className="mb-1.5 flex items-center justify-between font-sans text-[11px]">
          <span className="text-muted-foreground">Capital Formation</span>
          <span className="font-mono text-gold-light">{raisedPct.toFixed(1)}%</span>
        </div>
        <Progress value={raisedPct} className="h-2 bg-gold/10" />
        <div className="mt-1.5 flex items-center justify-between font-sans text-[11px] text-muted-foreground">
          <span>{egp(enterprise.raisedEgp, { compact: true })} raised</span>
          <span>{egp(enterprise.fundraisingGoalEgp, { compact: true })} goal</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="relative grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <MiniStat
          icon={Wallet}
          label="Law Firm Client Account"
          value={egp(enterprise.lawFirmClientAccountBalanceEgp, { compact: true })}
        />
        <MiniStat
          icon={TrendingUp}
          label="Revenue/mo"
          value={egp(enterprise.monthlyRevenueEgp, { compact: true })}
        />
        <MiniStat
          icon={Clock}
          label="Runway"
          value={runway > 0 ? `${runway.toFixed(1)} mo` : "—"}
        />
        <MiniStat
          icon={Users}
          label="Workforce"
          value={`${enterprise.employeeCount}`}
        />
      </div>

      {/* Footer */}
      <div className="relative mt-auto flex items-center justify-between border-t border-gold/8 pt-3">
        <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-gold/70" />
            {pct(enterprise.founderEquityPct, 0)} founder
          </span>
          <span className="inline-flex items-center gap-1">
            <Target className="h-3 w-3 text-gold/70" />
            {enterprise.milestones.length} milestones
          </span>
        </div>
        <Button
          onClick={onOpen}
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-3 text-xs font-medium text-gold-light hover:bg-gold/5 hover:text-gold"
        >
          View details
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </motion.article>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-gold/10 bg-background/40 p-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-gold/70" />
        <p className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-1 font-serif text-sm font-semibold">{value}</p>
    </div>
  );
}
