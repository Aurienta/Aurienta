"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Users, Crown, TrendingUp, TrendingDown, Scale, ShieldCheck } from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { cn } from "@/lib/utils";
import { egp, pct } from "@/lib/aurienta/format";
import { stsLevel } from "@/lib/aurienta/constants";
import {
  type SyndicateForUi,
  riskMeta,
  statusMeta,
  sectorLabel,
} from "./types";

export function SyndicateCard({
  syndicate,
  onJoin,
  joining,
}: {
  syndicate: SyndicateForUi;
  onJoin?: (s: SyndicateForUi) => void;
  joining?: boolean;
}) {
  const risk = riskMeta(syndicate.riskProfile);
  const status = statusMeta(syndicate.status);
  const fillPct =
    syndicate.targetShares > 0
      ? Math.min(100, (syndicate.committedShares / syndicate.targetShares) * 100)
      : 0;
  const remaining = Math.max(syndicate.targetShares - syndicate.committedShares, 0);
  const leadLevel = stsLevel(syndicate.leadPartner.sovereignTrustScore);
  const canJoin =
    syndicate.status === "forming" && !syndicate.isMember && !syndicate.isLead && remaining > 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", damping: 26, stiffness: 240 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 sm:p-6",
        syndicate.isMember || syndicate.isLead
          ? "border-gold/30 glass-gold"
          : "border-gold/12 glass"
      )}
    >
      {/* Lead partner badge */}
      <div className="absolute right-5 top-5 flex items-center gap-1.5">
        <Crown className="h-3 w-3 text-gold" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Lead
        </span>
      </div>

      {/* Header row */}
      <div className="flex items-start gap-3 pr-12">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/5"
          style={{ boxShadow: "0 0 18px -6px rgba(212,175,55,0.45)" }}
        >
          <Users className="h-4 w-4 text-gold" />
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-base font-semibold leading-tight sm:text-lg">
            {syndicate.name}
          </h3>
          <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
            {syndicate.enterprise.name}
            <span className="ml-1.5 rounded border border-gold/25 bg-gold/8 px-1.5 py-0.5 font-mono text-[11px] text-gold-light">
              T{syndicate.enterprise.tier}
            </span>
            <span className="ml-1.5 font-mono text-xs text-muted-foreground/85">
              {sectorLabel(syndicate.enterprise.sector)}
            </span>
          </p>
        </div>
      </div>

      {/* Risk profile + status */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-gold/[0.04] px-2.5 py-1 font-sans text-xs text-gold-light">
          {risk.label}
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs"
          style={{ background: `${status.color}1a`, color: status.color }}
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full", status.pulse && "animate-pulse-gold")}
            style={{ background: status.color }}
          />
          {status.label}
        </span>
        {syndicate.isLead && (
          <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-mono text-[11px] text-gold-light">
            <Crown className="h-2.5 w-2.5" /> You lead
          </span>
        )}
        {syndicate.isMember && !syndicate.isLead && (
          <span className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-gold/8 px-2 py-0.5 font-mono text-[11px] text-gold-light">
            <GoldStar className="h-2.5 w-2.5" /> Member
          </span>
        )}
      </div>

      {/* Description */}
      {syndicate.description && (
        <p className="mt-3 font-sans text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
          {syndicate.description}
        </p>
      )}

      {/* Fill bar */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between font-mono text-xs text-muted-foreground">
          <span>
            Committed{" "}
            <span className="text-foreground">
              {syndicate.committedShares.toLocaleString()}
            </span>{" "}
            / {syndicate.targetShares.toLocaleString()} units
          </span>
          <span className="text-gold-light">{pct(fillPct, 1)}</span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gold-gradient"
            initial={{ width: 0 }}
            animate={{ width: `${fillPct}%` }}
            transition={{ type: "spring", damping: 24, stiffness: 200 }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-xs">
        <div className="rounded-lg border border-gold/10 bg-background/30 p-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">AI fundamental price</p>
          <p className="mt-0.5 text-[12px] text-foreground">
            {egp(syndicate.enterprise.equityUnitPriceEgp)}
          </p>
        </div>
        <div className="rounded-lg border border-gold/10 bg-background/30 p-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Members</p>
          <p className="mt-0.5 text-[12px] text-foreground">{syndicate.members.length}</p>
        </div>
        <div className="rounded-lg border border-gold/10 bg-background/30 p-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Remaining</p>
          <p className="mt-0.5 text-[12px] text-gold-light">{remaining.toLocaleString()}</p>
        </div>
      </div>

      {/* Lead partner */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-gold/10 bg-background/30 p-2.5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full font-serif text-xs font-semibold text-black"
          style={{ background: `linear-gradient(135deg, ${syndicate.leadPartner.avatarColor}, #b8860b)` }}
        >
          {syndicate.leadPartner.legalName
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-[11px] font-medium">
            {syndicate.leadPartner.legalName}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            STS {syndicate.leadPartner.sovereignTrustScore} · {leadLevel.name}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
          {syndicate.leadPartner.sovereignTrustScore >= 85 ? (
            <TrendingUp className="h-3 w-3 text-emerald-400" />
          ) : (
            <TrendingDown className="h-3 w-3 text-muted-foreground" />
          )}
        </span>
      </div>

      {/* Zero custody note */}
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-gold/12 bg-gold/[0.03] p-2.5">
        <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-gold" />
        <p className="font-sans text-xs leading-relaxed text-muted-foreground">
          Coordination only — no pooled custody. Each member&apos;s funds flow to the law-firm
           law firm client account with an individual reference. AURIENTA touches zero capital.
        </p>
      </div>

      {/* Footer CTA */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground/85">
          <Scale className="h-3 w-3 text-gold/60" /> CRE-enforced
        </span>
        {canJoin && onJoin ? (
          <button
            type="button"
            onClick={() => onJoin(syndicate)}
            disabled={joining}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-3.5 py-1.5 font-sans text-[11px] font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {joining ? "Joining…" : "Join syndicate"}
          </button>
        ) : syndicate.isLead ? (
          <span className="font-mono text-xs text-gold-light">Awaiting partners</span>
        ) : syndicate.isMember ? (
          <span className="font-mono text-xs text-emerald-400">Joined ✓</span>
        ) : remaining === 0 ? (
          <span className="font-mono text-xs text-muted-foreground">Fully committed</span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">Closed</span>
        )}
      </div>
    </motion.article>
  );
}
