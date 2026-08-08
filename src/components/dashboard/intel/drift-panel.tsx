"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { egp } from "@/lib/aurienta/format";

/**
 * DriftPanel — renders the Constitutional Drift Detector for a single
 * enterprise. Calls /api/ai/drift to compute a drift score + findings,
 * with a "Run new analysis" button to regenerate.
 */

export type DriftSignals = {
  expensesAnalyzed: number;
  flaggedExpenses: number;
  flaggedPct: number;
  recentProposals: number;
  executedProposals: number;
  expiredProposals: number;
  lastEventAgeDays: number;
  nosiPct: number;
  policeClearanceValid: boolean;
};

export type DriftFinding = {
  severity: "green" | "amber" | "red";
  description: string;
  recommendation: string;
};

export type DriftResult = {
  driftScore: number;
  findings: DriftFinding[];
  summary: string;
  signals: DriftSignals;
};

export type EnterpriseLite = {
  id: string;
  name: string;
  tier: string;
  sector: string;
  healthRating: string | null;
};

const SEV_META: Record<
  DriftFinding["severity"],
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  green: {
    label: "On constitution",
    color: "#34d399",
    bg: "rgba(52,211,153,0.10)",
    border: "rgba(52,211,153,0.30)",
    icon: CheckCircle2,
  },
  amber: {
    label: "Drift emerging",
    color: "#f4d676",
    bg: "rgba(244,214,118,0.10)",
    border: "rgba(244,214,118,0.32)",
    icon: AlertTriangle,
  },
  red: {
    label: "Charter breach risk",
    color: "#f87171",
    bg: "rgba(248,113,113,0.10)",
    border: "rgba(248,113,113,0.32)",
    icon: ShieldAlert,
  },
};

function scoreBand(score: number) {
  if (score <= 25) {
    return {
      label: "Aligned",
      color: "#34d399",
      tint: "rgba(52,211,153,0.12)",
    };
  }
  if (score <= 55) {
    return {
      label: "Drift emerging",
      color: "#f4d676",
      tint: "rgba(244,214,118,0.12)",
    };
  }
  return {
    label: "Significant drift",
    color: "#f87171",
    tint: "rgba(248,113,113,0.12)",
  };
}

export function DriftPanel({
  enterprise,
  initialResult = null,
}: {
  enterprise: EnterpriseLite;
  initialResult?: DriftResult | null;
}) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<DriftResult | null>(initialResult);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/drift", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enterpriseId: enterprise.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "request failed");
      setResult(data as DriftResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not run drift analysis.");
    } finally {
      setLoading(false);
    }
  }, [enterprise.id]);

  // Auto-run once on mount if no initial result.
  React.useEffect(() => {
    if (!initialResult) void run();
    // Mount-only — explicit "Run new analysis" button handles subsequent runs.
  }, []);

  const band = result ? scoreBand(result.driftScore) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Header card with score */}
      <section className="relative overflow-hidden rounded-2xl border border-gold/22 glass-gold p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
                <Activity className="h-4 w-4 text-gold" />
              </span>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold-light/85">
                  Constitutional drift detector
                </p>
                <p className="font-serif text-base font-semibold text-foreground">
                  {enterprise.name}{" "}
                  <span className="text-muted-foreground">· Tier {enterprise.tier}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-end gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground/85">
                  Drift score
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-serif text-5xl font-semibold leading-none"
                    style={{ color: band?.color ?? "#a89f86" }}
                  >
                    {loading ? "—" : result ? result.driftScore : "·"}
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">/100</span>
                </div>
              </div>
              {band && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs font-medium"
                  style={{
                    color: band.color,
                    background: band.tint,
                    borderColor: band.color + "55",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: band.color }}
                  />
                  {band.label}
                </span>
              )}
            </div>

            {/* Score bar */}
            <div className="mt-4 max-w-md">
              <Progress
                value={result?.driftScore ?? 0}
                className="h-2 bg-foreground/10"
              />
              <div className="mt-1 flex justify-between font-mono text-[11px] text-muted-foreground/85">
                <span>0 · aligned</span>
                <span>50 · drift</span>
                <span>100 · breach</span>
              </div>
            </div>
          </div>

          {/* Run button */}
          <div className="shrink-0">
            <Button
              onClick={() => void run()}
              disabled={loading}
              className="h-10 gap-1.5 rounded-full bg-gold-gradient px-5 text-black hover:opacity-95"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {loading ? "Analyzing…" : "Run new analysis"}
            </Button>
            <p className="mt-2 text-right font-mono text-[11px] text-muted-foreground/80">
              CRE-enforced · AiArtifact persisted
            </p>
          </div>
        </div>

        {/* Summary */}
        {result?.summary && (
          <p className="relative mt-4 max-w-3xl font-sans text-[13px] leading-relaxed text-foreground/85">
            {result.summary}
          </p>
        )}
        {error && (
          <div className="relative mt-4 rounded-lg border border-red-400/25 bg-red-400/[0.06] px-3 py-2">
            <p className="font-sans text-[12px] text-red-300">{error}</p>
          </div>
        )}
      </section>

      {/* Signal cards */}
      {result?.signals && (
        <section
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Drift signals"
        >
          <SignalCard
            icon={ShieldAlert}
            label="Flagged expenses"
            value={`${result.signals.flaggedExpenses} / ${result.signals.expensesAnalyzed}`}
            sub={`${result.signals.flaggedPct.toFixed(1)}% carry an AI risk flag`}
            tone={
              result.signals.flaggedPct > 15
                ? "red"
                : result.signals.flaggedPct > 5
                ? "amber"
                : "green"
            }
          />
          <SignalCard
            icon={Sparkles}
            label="Governance cadence"
            value={`${result.signals.recentProposals} proposals`}
            sub={`Last 90 days · ${result.signals.executedProposals} executed, ${result.signals.expiredProposals} expired`}
            tone={
              result.signals.recentProposals === 0
                ? "red"
                : result.signals.recentProposals < 2
                ? "amber"
                : "green"
            }
          />
          <SignalCard
            icon={Clock}
            label="Reporting timeliness"
            value={`${result.signals.lastEventAgeDays}d`}
            sub={`Since last ledger event`}
            tone={
              result.signals.lastEventAgeDays > 14
                ? "red"
                : result.signals.lastEventAgeDays > 7
                ? "amber"
                : "green"
            }
          />
          <SignalCard
            icon={ShieldCheck}
            label="NOSI compliance"
            value={`${result.signals.nosiPct.toFixed(0)}%`}
            sub="Social insurance registration"
            tone={
              result.signals.nosiPct < 90
                ? "red"
                : result.signals.nosiPct < 100
                ? "amber"
                : "green"
            }
          />
          <SignalCard
            icon={ShieldCheck}
            label="Police clearance"
            value={result.signals.policeClearanceValid ? "Valid" : "Expired"}
            sub="Manager police clearance status"
            tone={result.signals.policeClearanceValid ? "green" : "red"}
          />
          <SignalCard
            icon={enterprise.tier === "C" ? TrendingUp : TrendingDown}
            label="Tier C ERP mandate"
            value={enterprise.tier === "C" ? "Required" : "N/A"}
            sub="Statutory audit + ERP for Tier C"
            tone={enterprise.tier === "C" ? "amber" : "green"}
          />
        </section>
      )}

      {/* Findings list */}
      <section aria-label="Drift findings">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-lg font-semibold">Findings</h2>
          </div>
          <span className="rounded-full border border-gold/20 bg-gold/[0.04] px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold/70">
            Severity-rated
          </span>
        </div>

        {loading && !result ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gold/12 bg-foreground/[0.02] py-12">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
            <p className="font-sans text-[12px] text-muted-foreground">
              Reading the ledger, expenses, proposals, and compliance signals…
            </p>
          </div>
        ) : result?.findings?.length ? (
          <ul className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {result.findings.map((f, i) => {
                const m = SEV_META[f.severity];
                return (
                  <motion.li
                    key={i + f.description.slice(0, 24)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative overflow-hidden rounded-xl border p-4"
                    style={{
                      borderColor: m.border,
                      background: m.bg,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                        style={{ borderColor: m.border, background: m.bg }}
                      >
                        <m.icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider"
                            style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
                          >
                            {m.label}
                          </span>
                        </div>
                        <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-foreground/90">
                          {f.description}
                        </p>
                        <p className="mt-1.5 font-sans text-[12px] leading-relaxed text-muted-foreground">
                          <span className="font-medium text-gold-light/80">Recommendation · </span>
                          {f.recommendation}
                        </p>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-gold/15 bg-foreground/[0.01] py-10 text-center">
            <p className="font-sans text-[12px] text-muted-foreground">
              No findings yet. Run a new analysis to compute drift.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function SignalCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  tone: "green" | "amber" | "red";
}) {
  const toneClasses = {
    green: "border-emerald-400/25 text-emerald-300",
    amber: "border-amber-400/25 text-amber-300",
    red: "border-red-400/25 text-red-300",
  }[tone];
  return (
    <div className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-4">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-lg border",
            toneClasses
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground/80">
          {label}
        </p>
      </div>
      <p className="mt-2 font-serif text-lg font-semibold text-foreground">
        {value}
      </p>
      <p className="mt-0.5 font-sans text-[10.5px] leading-relaxed text-muted-foreground">
        {sub}
      </p>
    </div>
  );
}
