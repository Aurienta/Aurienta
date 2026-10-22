"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRightLeft,
  Loader2,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { egp } from "@/lib/aurienta/format";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { cn } from "@/lib/utils";

// ── Salary-to-Equity Converter (Volume 8, Workforce Capitalization) ──
//
// Lets a Workforce Partner convert up to 10% of their monthly salary into
// Equity Units at a 15% discount to the enterprise's fundamental CPP price.
// The CRE policy `enforceSalaryToEquity` (cre.ts) validates the request on
// the server; the resulting Equity Units carry a 12-month lock-up enforced
// by `enforceEquityLockUp` via OwnershipRecord.restrictedUntil.
//
// Indigo theme — this is a "debt-like" financial instrument, distinct from
// the gold-themed Capital Partner flows. The indigo accent marks salary-derived
// equity as workforce capital, not investor capital.

export type SalaryToEquityContext = {
  employeeId: string;
  enterpriseId: string;
  enterpriseName: string;
  monthlySalaryEgp: number;
  equityUnitPriceEgp: number; // fundamental CPP (full, undiscounted)
  currentEquityConversionPct: number; // already-set % for this cycle (0-10)
  restrictedUntilMonths: number; // default 12 per blueprint
};

type ConversionResult = {
  ok: boolean;
  message?: string;
  result?: {
    employeeId: string;
    enterpriseId: string;
    convertedAmountEgp: number;
    discountedPriceEgp: number;
    equityUnitsIssued: number;
    restrictedUntil: string;
    creDecisionToken: string;
  };
};

const MAX_PCT = 10; // blueprint constitutional max (Vol 8)
const DISCOUNT = 0.15; // 15% off fundamental price

export function SalaryToEquityConverter({ ctx }: { ctx: SalaryToEquityContext }) {
  const { toast } = useToast();
  const [pct, setPct] = React.useState<number>(ctx.currentEquityConversionPct ?? 0);
  const [submitting, setSubmitting] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<ConversionResult["result"] | null>(null);

  // Live calculation — mirrors the CRE math so the UI is honest before submit.
  const convertedAmountEgp = Math.round(ctx.monthlySalaryEgp * (pct / 100));
  const discountedPriceEgp = ctx.equityUnitPriceEgp * (1 - DISCOUNT);
  const equityUnitsToIssue = discountedPriceEgp > 0
    ? Math.floor(convertedAmountEgp / discountedPriceEgp)
    : 0;
  const restrictedUntilDate = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + ctx.restrictedUntilMonths);
    return d;
  }, [ctx.restrictedUntilMonths]);

  const canConvert = pct > 0 && pct <= MAX_PCT && equityUnitsToIssue > 0 && !submitting;

  async function handleConvert() {
    if (!canConvert) return;
    setSubmitting(true);
    setLastResult(null);
    try {
      const res = await csrfFetch("/api/salary-to-equity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: ctx.employeeId,
          equityConversionPct: pct,
        }),
      });
      const data = (await res.json()) as ConversionResult;
      if (!res.ok || !data.ok) {
        throw new Error(data.message ?? "Salary-to-Equity conversion failed");
      }
      setLastResult(data.result ?? null);
      toast({
        title: "Equity Units issued",
        description: `${data.result?.equityUnitsIssued ?? 0} Equity Units locked for ${ctx.restrictedUntilMonths} months.`,
      });
    } catch (e) {
      toast({
        title: "Conversion failed",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-indigo-400/25 bg-card/60">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-400/30 bg-indigo-500/10">
            <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-300" />
          </span>
          <div className="flex flex-col">
            <span className="font-sans text-[11px] font-medium uppercase tracking-[0.24em] text-indigo-300/85">
              Salary → Equity Converter
            </span>
            <CardTitle className="font-serif text-base font-semibold text-indigo-100">
              Capitalize up to {MAX_PCT}% of your salary
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <p className="font-sans text-xs leading-relaxed text-muted-foreground">
          Convert a slice of your monthly salary into Equity Units of{" "}
          <span className="text-indigo-200">{ctx.enterpriseName}</span> at a{" "}
          <span className="text-indigo-200">15% discount</span> to the fundamental
          CPP price. The CRE policy{" "}
          <code className="rounded bg-foreground/[0.04] px-1 py-0.5 font-mono text-[11px]">
            salary_to_equity.rego
          </code>{" "}
          enforces the 10% cap and issues the units atomically. Equity Units
          carry a {ctx.restrictedUntilMonths}-month lock-up.
        </p>

        {/* Current salary display */}
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Monthly salary"
            value={egp(ctx.monthlySalaryEgp)}
          />
          <Stat
            label="Fundamental price (CPP)"
            value={egp(ctx.equityUnitPriceEgp, { decimals: 2 })}
          />
        </div>

        {/* Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
              Conversion percentage
            </span>
            <span className="font-mono text-sm text-indigo-200">
              {pct.toFixed(1)}%
            </span>
          </div>
          <Slider
            min={0}
            max={MAX_PCT}
            step={0.5}
            value={[pct]}
            onValueChange={(v) => setPct(v[0] ?? 0)}
            className="py-2 [&_[data-slot=slider-range]]:bg-indigo-400 [&_[data-slot=slider-thumb]]:border-indigo-400"
          />
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground/80">
            <span>0% · cash only</span>
            <span>5% · balanced</span>
            <span>{MAX_PCT}% · constitutional max</span>
          </div>
        </div>

        {/* Live calculation */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-indigo-400/25 bg-indigo-500/[0.06] p-4"
        >
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-indigo-300" />
            <span className="font-sans text-xs uppercase tracking-wide text-indigo-200/85">
              Live calculation
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Converted"
              value={egp(convertedAmountEgp, { compact: true })}
              accent="indigo"
            />
            <Stat
              label="Discounted price"
              value={egp(discountedPriceEgp, { decimals: 2 })}
              accent="indigo"
            />
            <Stat
              label="Equity Units"
              value={equityUnitsToIssue.toLocaleString("en-US")}
              accent="indigo"
            />
            <Stat
              label="Lock-up"
              value={`${ctx.restrictedUntilMonths}mo`}
              accent="indigo"
            />
          </div>
        </motion.div>

        {/* Lock-up notice */}
        <div className="rounded-lg border border-amber-400/20 bg-amber-500/[0.04] p-3">
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
            <p className="font-sans text-xs leading-relaxed text-amber-100/85">
              Equity Units are locked until{" "}
              <span className="font-mono text-amber-200">
                {restrictedUntilDate.toISOString().split("T")[0]}
              </span>
              . Transfers are blocked by{" "}
              <code className="rounded bg-foreground/[0.06] px-1 py-0.5 font-mono text-[11px]">
                equity_lockup.rego
              </code>{" "}
              until expiry.
            </p>
          </div>
        </div>

        {/* Convert button */}
        <Button
          onClick={handleConvert}
          disabled={!canConvert}
          className={cn(
            "self-stretch bg-indigo-600 text-white hover:bg-indigo-500 sm:self-end",
            "disabled:bg-indigo-900/40 disabled:text-indigo-200/50"
          )}
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRightLeft className="mr-2 h-4 w-4" />
          )}
          {submitting
            ? "Converting…"
            : pct === 0
              ? "Set a conversion percentage"
              : `Convert ${egp(convertedAmountEgp, { compact: true })} → ${equityUnitsToIssue.toLocaleString("en-US")} units`}
        </Button>

        {/* Success state */}
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-400/30 bg-emerald-500/[0.06] p-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <span className="font-sans text-xs uppercase tracking-wide text-emerald-200/90">
                Conversion recorded
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-indigo-400/40 bg-indigo-500/10 text-[11px] text-indigo-200">
                {lastResult.equityUnitsIssued.toLocaleString("en-US")} Equity Units
              </Badge>
              <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/10 text-[11px] text-emerald-200">
                <ShieldCheck className="mr-1 h-3 w-3" /> CRE-validated
              </Badge>
              <Badge variant="outline" className="border-amber-400/40 bg-amber-500/10 text-[11px] text-amber-200">
                <Lock className="mr-1 h-3 w-3" /> Locked until {lastResult.restrictedUntil.split("T")[0]}
              </Badge>
            </div>
            <div className="mt-3 flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
              <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
                Decision token{" "}
                <code className="rounded bg-foreground/[0.04] px-1 py-0.5 font-mono text-[11px]">
                  {lastResult.creDecisionToken.slice(0, 16)}…
                </code>{" "}
                is anchored to the immutable ledger. Verify on your enterprise&apos;s
                Governance Log.
              </p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: string;
  accent?: "default" | "indigo";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-foreground/[0.02] p-3",
        accent === "indigo" ? "border-indigo-400/20" : "border-gold/12"
      )}
    >
      <div
        className={cn(
          "font-mono text-sm",
          accent === "indigo" ? "text-indigo-200" : "text-gold-light"
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 font-sans text-[11px] uppercase tracking-wide text-muted-foreground/85">
        {label}
      </div>
    </div>
  );
}
