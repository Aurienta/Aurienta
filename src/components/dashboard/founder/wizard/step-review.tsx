"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollText, ShieldCheck, Crown, Sparkles, Layers } from "lucide-react";
import { TIER_META, SECTORS, CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import type { WizardState } from "../types";

export function StepReview({
  state,
  update,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}) {
  const goal = Number(state.fundraisingGoalEgp) || 0;
  const price = Number(state.equityUnitPriceEgp) || 0;
  const totalEquityUnits = price > 0 ? Math.floor(goal / price) : 0;
  const meta = state.tier ? TIER_META[state.tier] : null;
  const sectorLabel = state.sector ? SECTORS[state.sector]?.label : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Summary grid */}
      <div className="rounded-xl border border-gold/12 bg-background/40 p-4">
        <div className="mb-3 flex items-center gap-2 text-gold">
          <Layers className="h-3.5 w-3.5" />
          <span className="font-sans text-xs uppercase tracking-[0.22em] text-gold-light">
            Charter summary
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryRow label="Name" value={state.name} />
          <SummaryRow label="Sector" value={sectorLabel ?? "—"} />
          {state.tagline && <SummaryRow label="Tagline" value={state.tagline} />}
          <SummaryRow
            label="Tier"
            value={
              meta ? `${state.tier} · ${meta.name} (${meta.legalForm})` : "—"
            }
          />
          <SummaryRow
            label="Goal"
            value={`${goal.toLocaleString()} EGP`}
          />
          <SummaryRow label="Share price" value={`${price.toLocaleString()} EGP`} />
          <SummaryRow label="Total units" value={totalEquityUnits.toLocaleString()} />
          <SummaryRow
            label="Founder equity"
            value={meta?.founderEquity ?? "—"}
          />
          <SummaryRow label="Platform fee" value={meta?.fee ?? "—"} />
          <SummaryRow
            label="Capital Partner cap"
            value={
              state.investorCapEnabled && state.investorCap
                ? `${state.investorCap}`
                : "Unlimited"
            }
          />
          <SummaryRow
            label="Feasibility"
            value={
              state.feasibilityScore !== null
                ? `${state.feasibilityScore} / 100`
                : "Not run"
            }
          />
        </div>
        <Separator className="my-3 bg-gold/10" />
        <p className="line-clamp-3 font-sans text-xs text-muted-foreground">
          {state.description}
        </p>
      </div>

      {/* Charter excerpt */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ScrollText className="h-3.5 w-3.5 text-gold" />
          <span className="font-sans text-xs uppercase tracking-[0.22em] text-gold-light">
            Constitutional Charter (excerpt)
          </span>
        </div>
        <div className="max-h-56 overflow-y-auto rounded-xl border border-gold/15 bg-[#08080a] p-4 font-mono text-[11px] leading-relaxed text-foreground/80">
          <pre className="whitespace-pre-wrap">{CHARTER_EXCERPT}</pre>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className="border-gold/20 bg-transparent font-mono text-xs text-gold-light"
          >
            SHA3-256 · {CONSTITUTIONAL_HASH.slice(0, 18)}…
          </Badge>
          <span>·</span>
          <span>Version 8.2 · Sovereign</span>
        </div>
      </div>

      {/* Acceptance */}
      <div className="rounded-xl border border-gold/15 glass-gold p-4">
        <Label
          htmlFor="accept-charter"
          className="flex cursor-pointer items-start gap-3 font-sans text-sm font-medium text-foreground"
        >
          <Checkbox
            id="accept-charter"
            checked={state.acceptedCharter}
            onCheckedChange={(v) => update({ acceptedCharter: v === true })}
            className="mt-0.5 border-gold/40 data-[state=checked]:bg-gold-gradient data-[state=checked]:text-black"
          />
          <span className="leading-snug">
            I accept the Constitutional Charter. I understand the CRE will enforce every
            rule on this enterprise — including Zero Custody, expense authority, and the
            7-stage graduation path — and that this signature is{" "}
            <span className="text-gold-light">legally binding</span> on the immutable ledger.
          </span>
        </Label>
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gold/10 pt-3">
          <span className="inline-flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-gold/70" /> FRA No-Action Letter
          </span>
          <span className="inline-flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground">
            <Crown className="h-3 w-3 text-gold/70" /> Founder vesting locked
          </span>
          <span className="inline-flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-gold/70" /> Zero Custody · Non-amendable Rule I 1.1
          </span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-gold/8 pb-2">
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground/80">
        {label}
      </span>
      <span className="text-right font-sans text-xs font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

const CHARTER_EXCERPT = `AURIENTA CONSTITUTIONAL CHARTER · v8.2

Preamble
  We, the Constitutional Partners of AURIENTA, ordain this Charter
  to convert everyday capital into sovereign enterprises — productive,
  transparent, and free of speculation.

Article I — Sovereign Identity
  1.1  Zero Custody. AURIENTA shall never hold partner funds. All
       capital is held in the Law Firm Client Account at FRA-licensed firms.
       This rule is non-amendable.
  1.6  One Identity. One person, one verified identity. SHA3-256
       duplicate prevention · Ed25519 identity anchor sealed in HSM.

Article II — Constitutional Runtime Engine (CRE)
  2.1  Every transfer, expense, and proposal shall pass the CRE
       Rego policies before ledger commit.
  2.4  CRE decisions are signed with Ed25519 and stored on the
       immutable hash-chained ledger.

Article III — Founding Operators
  3.1  Founders receive equity per their tier schedule, vested over
       the constitutional timeline.
  3.2  Founders are banned from the manager seat for 12 months at
       Tier A; independent manager appointed thereafter.

Article IV — Graduation
  4.1  An enterprise may graduate to sovereign independence after
       readiness ≥ 90, 75% supermajority, 30-day cooling, 14-day vote.
  4.3  Graduated enterprises receive a self-hostable CRE export
       package (tar.gz, SHA3-hashed, Ed25519-signed).

Article V — Amendments
  5.1  Articles I.1 (Zero Custody) and I.6 (One Identity) are
       non-amendable. All other articles require 75% supermajority.`;
