"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TIER_META } from "@/lib/aurienta/constants";
import { Crown, Info, Layers, Sparkles } from "lucide-react";
import type { WizardState } from "../types";

const TIER_ORDER = ["A", "B", "C", "D", "E", "F"] as const;

const TIER_MAX_RAISE: Record<string, number | null> = {
  A: 3_000_000,
  B: 25_000_000,
  C: null,
  D: null,
  E: 5_000_000,
  F: null,
};

function parseFounderEquity(raw: string): number {
  const m = raw.match(/(\d+(?:\.\d+)?)/);
  if (!m) return 0;
  return parseFloat(m[1]);
}

export function StepTierStructure({
  state,
  update,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}) {
  const goal = Number(state.fundraisingGoalEgp) || 0;
  const price = Number(state.equityUnitPriceEgp) || 0;
  const totalEquityUnits = price > 0 ? Math.floor(goal / price) : 0;
  const founderEquity = state.tier ? parseFounderEquity(TIER_META[state.tier].founderEquity) : 0;
  const founderShares = Math.floor((totalEquityUnits * founderEquity) / 100);

  const cap = state.tier ? TIER_MAX_RAISE[state.tier] : null;
  const overCap = cap !== null && cap !== undefined && goal > cap;

  return (
    <div className="flex flex-col gap-6">
      {/* Tier radio cards */}
      <div className="flex flex-col gap-2">
        <Label className="font-sans text-xs font-medium text-foreground">
          Constitutional tier
        </Label>
        <p className="font-sans text-[11px] text-muted-foreground">
          Each tier binds the enterprise to specific legal form, fees, and graduation path.
        </p>
        <RadioGroup
          value={state.tier}
          onValueChange={(v) => update({ tier: v })}
          className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3"
        >
          {TIER_ORDER.map((t) => {
            const meta = TIER_META[t];
            const selected = state.tier === t;
            return (
              <Label
                key={t}
                htmlFor={`tier-${t}`}
                className={cn(
                  "group relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3.5 transition-all",
                  selected
                    ? "border-gold/55 bg-gold/[0.06] shadow-[0_0_22px_-8px_rgba(212,175,55,0.55)]"
                    : "border-gold/12 bg-background/40 hover:border-gold/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full font-serif text-sm font-semibold",
                        selected ? "bg-gold-gradient text-black" : "bg-gold/10 text-gold-light"
                      )}
                    >
                      {t}
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="font-serif text-sm font-semibold">{meta.name}</span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {meta.legalForm}
                      </span>
                    </div>
                  </div>
                  <RadioGroupItem
                    id={`tier-${t}`}
                    value={t}
                    className="border-gold/40 text-gold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 font-sans text-xs text-muted-foreground">
                  <span>
                    Raise <span className="text-foreground/80">{meta.maxRaise}</span>
                  </span>
                  <span>
                    Fee <span className="text-foreground/80">{meta.fee}</span>
                  </span>
                  <span>
                    Founder <span className="text-foreground/80">{meta.founderEquity}</span>
                  </span>
                  <span>
                    Audit <span className="text-foreground/80">{meta.audit}</span>
                  </span>
                </div>
                <p className="font-sans text-xs italic text-muted-foreground/80">
                  {meta.trait}
                </p>
              </Label>
            );
          })}
        </RadioGroup>
      </div>

      {/* Selected tier constraints */}
      {state.tier && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-gold/15 bg-gold/[0.03] p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-gold">
            <Crown className="h-3.5 w-3.5" />
            <span className="font-sans text-xs uppercase tracking-[0.22em] text-gold-light">
              Tier {state.tier} — {TIER_META[state.tier].name} constraints
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 font-sans text-xs sm:grid-cols-3">
            <Constraint label="Legal form" value={TIER_META[state.tier].legalForm} />
            <Constraint label="Max raise" value={TIER_META[state.tier].maxRaise} />
            <Constraint label="Min invest" value={TIER_META[state.tier].minInvest} />
            <Constraint label="Founder equity" value={TIER_META[state.tier].founderEquity} />
            <Constraint label="Total fee" value={TIER_META[state.tier].fee} />
            <Constraint label="ERP" value={TIER_META[state.tier].erp} />
          </div>
        </motion.div>
      )}

      {/* Capital Formation & Equity Units */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="w-goal" className="font-sans text-xs font-medium">
            Capital Formation goal (EGP)
          </Label>
          <Input
            id="w-goal"
            type="number"
            min={1000}
            step={1000}
            value={state.fundraisingGoalEgp}
            onChange={(e) => update({ fundraisingGoalEgp: e.target.value })}
            placeholder="e.g. 1500000"
            className={cn(
              "h-11 border-gold/15 bg-background/60 font-sans text-base",
              overCap && "border-destructive/60 focus-visible:ring-destructive/30"
            )}
          />
          {cap !== null && cap !== undefined && (
            <p
              className={cn(
                "flex items-center gap-1.5 font-sans text-xs",
                overCap ? "text-destructive" : "text-muted-foreground"
              )}
            >
              <Info className="h-3 w-3" />
              {overCap
                ? `Exceeds Tier ${state.tier} cap of ${cap.toLocaleString()} EGP.`
                : `Tier ${state.tier} cap: ${cap.toLocaleString()} EGP.`}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="w-price" className="font-sans text-xs font-medium">
            Share price (EGP / unit)
          </Label>
          <Input
            id="w-price"
            type="number"
            min={1}
            value={state.equityUnitPriceEgp}
            onChange={(e) => update({ equityUnitPriceEgp: e.target.value })}
            placeholder="50"
            className="h-11 border-gold/15 bg-background/60 font-sans text-base"
          />
          <p className="font-sans text-xs text-muted-foreground">
            Default 50 EGP — the blueprint's Layla example.
          </p>
        </div>
      </div>

      {/* Capital Partner cap toggle */}
      <div className="rounded-xl border border-gold/12 bg-background/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <Label
              htmlFor="w-cap-toggle"
              className="font-sans text-xs font-medium text-foreground"
            >
              Limit number of investors
            </Label>
            <span className="font-sans text-xs text-muted-foreground">
              Cap the constitutional partner count.
            </span>
          </div>
          <Switch
            id="w-cap-toggle"
            checked={state.investorCapEnabled}
            onCheckedChange={(v) => update({ investorCapEnabled: v, investorCap: v ? state.investorCap : "" })}
          />
        </div>
        {state.investorCapEnabled && (
          <div className="mt-3 flex flex-col gap-1.5">
            <Label htmlFor="w-cap" className="font-sans text-[11px] text-muted-foreground">
              Maximum investors
            </Label>
            <Input
              id="w-cap"
              type="number"
              min={1}
              value={state.investorCap}
              onChange={(e) => update({ investorCap: e.target.value })}
              placeholder="e.g. 100"
              className="h-10 border-gold/15 bg-background/60 font-sans text-sm"
            />
          </div>
        )}
      </div>

      {/* Derived preview */}
      {totalEquityUnits > 0 && (
        <div className="grid gap-2.5 sm:grid-cols-3">
          <PreviewTile
            icon={Layers}
            label="Total units"
            value={totalEquityUnits.toLocaleString()}
          />
          <PreviewTile
            icon={Crown}
            label="Founder seed"
            value={
              founderShares > 0
                ? `${founderShares.toLocaleString()} (${founderEquity}%)`
                : "—"
            }
          />
          <PreviewTile
            icon={Sparkles}
            label="Implied valuation"
            value={`${(totalEquityUnits * price).toLocaleString()} EGP`}
          />
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-gold/10 bg-background/40 p-3">
        <Badge variant="outline" className="border-gold/20 text-xs text-gold-light">
          Zero Custody
        </Badge>
        <p className="font-sans text-[11px] text-muted-foreground">
          Funds raised will sit in the Law Firm Client Account — AURIENTA never touches custody.
        </p>
      </div>
    </div>
  );
}

function Constraint({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/80">
        {label}
      </span>
      <span className="font-sans text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}

function PreviewTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-gold/12 bg-background/40 p-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-gold/70" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-1 font-serif text-base font-semibold text-gold-light">{value}</p>
    </div>
  );
}
