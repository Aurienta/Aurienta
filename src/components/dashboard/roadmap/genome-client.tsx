"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Dna,
  AlertTriangle,
  ChevronDown,
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  Cpu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { EmptyState } from "@/components/dashboard/ux/empty-state";

// ── Types ──
export type GenomeCard = {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  enterpriseSlug: string;
  tier: string;
  stage: string;
  healthRating: string | null;
  graduationProbability: number; // 0..1
  riskScore: number; // 0..1
  modelVersion: string;
  trainedOnCount: number;
  predictedAt: string;
};

type AttributeRow = [string, string | number | boolean | null];

// ── Helpers ──
function pct(n: number): string {
  return `${Math.round(n * 1000) / 10}%`;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "number") return v.toLocaleString("en-US");
  return String(v);
}

function stageLabel(stage: string): string {
  return stage.replace("_", " ");
}

function tierColor(tier: string): string {
  switch (tier) {
    case "A":
      return "border-gold/30 bg-gold/12 text-gold-light";
    case "B":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case "C":
      return "border-indigo-400/30 bg-indigo-400/10 text-indigo-300";
    case "D":
      return "border-violet-400/30 bg-violet-400/10 text-violet-300";
    case "E":
      // AUD-UX-2: previously amber-* — brand violation. Use a muted indigo
      // to keep within the brand palette while remaining distinct from A–D.
      return "border-indigo-300 bg-indigo-200/30 text-indigo-200";
    case "F":
      return "border-rose-400/30 bg-rose-400/10 text-rose-300";
    default:
      return "border-gold/20 bg-foreground/5 text-muted-foreground";
  }
}

function healthColor(rating: string | null): string {
  if (!rating) return "border-gold/20 bg-foreground/5 text-muted-foreground";
  const first = rating[0]?.toUpperCase();
  if (first === "A") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  if (first === "B") return "border-gold/30 bg-gold/12 text-gold-light";
  // AUD-UX-2: previously amber-* — brand violation. C-rated enterprises
  // use a deeper indigo to flag elevated risk without leaking the amber palette.
  if (first === "C") return "border-indigo-400/40 bg-indigo-400/15 text-indigo-200";
  return "border-rose-400/30 bg-rose-400/10 text-rose-300";
}

// ── Circular progress (graduation probability) ──
function CircularProgress({ value, size = 88 }: { value: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);
  const pctStr = pct(value);
  const color =
    value >= 0.7 ? "#10b981" : value >= 0.4 ? "#4F46E5" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          className="text-muted/40"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-lg font-semibold" style={{ color }}>
          {pctStr}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground/80">
          grad.
        </span>
      </div>
    </div>
  );
}

// ── Card ──
function GenomeCardItem({ genome, index }: { genome: GenomeCard; index: number }) {
  const [expanded, setExpanded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [attributes, setAttributes] = React.useState<AttributeRow[] | null>(null);

  async function toggleExpand() {
    if (!expanded && !attributes) {
      setLoading(true);
      try {
        const res = await csrfFetch(`/api/genome/${genome.enterpriseId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch genome");
        const attrs = data.genome?.attributes;
        if (attrs && typeof attrs === "object") {
          setAttributes(Object.entries(attrs) as AttributeRow[]);
        }
      } catch (e) {
        toast.error("Failed to load attributes", {
          description: e instanceof Error ? e.message : "Unknown error",
        });
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    setExpanded((e) => !e);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.6) }}
      className="overflow-hidden rounded-2xl border border-gold/15 glass"
    >
      <button
        onClick={toggleExpand}
        className="flex w-full items-start gap-4 p-5 text-left"
      >
        {/* Circular graduation probability */}
        <CircularProgress value={genome.graduationProbability} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-serif text-base font-semibold">
              {genome.enterpriseName}
            </h3>
            <Badge
              variant="outline"
              className={cn("text-[10px] uppercase", tierColor(genome.tier))}
            >
              Tier {genome.tier}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-[10px] uppercase", healthColor(genome.healthRating))}
            >
              {genome.healthRating ?? "Unrated"}
            </Badge>
            <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground/80">
              <Cpu className="h-3 w-3" />
              {genome.modelVersion}
            </span>
          </div>

          <p className="mt-1 font-sans text-xs text-muted-foreground">
            {stageLabel(genome.stage)} · trained on{" "}
            <span className="font-mono text-gold-light">
              {genome.trainedOnCount}
            </span>{" "}
            data points
          </p>

          {/* Risk score progress */}
          <div className="mt-3 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/80">
              Risk
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${genome.riskScore * 100}%` }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={cn(
                  "h-full",
                  genome.riskScore < 0.4
                    ? "bg-emerald-400"
                    : genome.riskScore < 0.7
                    ? "bg-gold"
                    : "bg-rose-400"
                )}
              />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {pct(genome.riskScore)}
            </span>
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground/80">
              {genome.graduationProbability >= 0.5 ? (
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-400" />
              )}
              predicted {new Date(genome.predictedAt).toLocaleDateString()}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-gold-light">
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    expanded && "rotate-180"
                  )}
                />
              )}
              {expanded ? "Hide attributes" : "View attributes"}
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-gold/10 bg-foreground/[0.02] p-5"
        >
          {attributes ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {attributes.map(([key, value]) => (
                <div
                  key={key}
                  className="flex flex-col gap-0.5 border-b border-gold/8 pb-1.5"
                >
                  <span className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground/70">
                    {key}
                  </span>
                  <span className="font-sans text-xs text-foreground break-words">
                    {formatValue(value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading attribute vector...
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Main component ──
export function GenomeClient({ genomes }: { genomes: GenomeCard[] }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Indigo disclaimer (AUD-UX-2: was amber, brand violation) */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-400/30 bg-indigo-400/[0.06] p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
        <div>
          <p className="font-sans text-sm font-medium text-indigo-700 dark:text-indigo-300">
            Predictions are statistical estimates, NOT guarantees of success.
          </p>
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            Based on internal model v1. Past performance does not predict future
            outcomes. Treat the graduation probability as a directional signal,
            not a deterministic forecast.
          </p>
        </div>
      </div>

      {genomes.length === 0 ? (
        <EmptyState
          icon={Dna}
          title="No Genome Data"
          description="Enterprise genome predictions will appear here once enterprises are active."
        />
      ) : (
        <>
          {/* Top performer banner */}
          {genomes[0] && (
            <section className="relative overflow-hidden rounded-2xl border border-gold/30 glass-gold p-5 sm:p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gold/10 blur-3xl" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-gold/10">
                    <Activity className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold-light/85">
                      Top predicted performer
                    </p>
                    <h2 className="mt-0.5 font-serif text-xl font-semibold">
                      {genomes[0].enterpriseName}
                    </h2>
                    <p className="font-sans text-xs text-muted-foreground">
                      Tier {genomes[0].tier} · {stageLabel(genomes[0].stage)} ·{" "}
                      {genomes[0].healthRating ?? "Unrated"} health
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="font-serif text-2xl font-semibold text-emerald-400">
                      {pct(genomes[0].graduationProbability)}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      graduation
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-serif text-2xl font-semibold text-gold-light">
                      {pct(genomes[0].riskScore)}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      risk
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            {genomes.map((g, i) => (
              <GenomeCardItem key={g.id} genome={g} index={i} />
            ))}
          </div>

          {/* Top performers list (sorted desc) */}
          <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
            <div className="border-b border-gold/12 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-gold" />
                <h2 className="font-serif text-base font-semibold">
                  Top performers by graduation probability
                </h2>
                <span className="ml-auto font-mono text-xs text-muted-foreground/80">
                  {genomes.length} ranked · {genomes[0]?.modelVersion}
                </span>
              </div>
            </div>
            <ol className="divide-y divide-gold/8">
              {genomes
                .slice()
                .sort((a, b) => b.graduationProbability - a.graduationProbability)
                .map((g, i) => (
                  <li
                    key={g.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
                        i === 0
                          ? "border-gold/40 bg-gold/15 text-gold-light"
                          : "border-gold/15 bg-foreground/[0.02] text-muted-foreground"
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-serif text-sm font-medium">
                        {g.enterpriseName}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground/80">
                        Tier {g.tier} · {stageLabel(g.stage)} · {g.trainedOnCount}{" "}
                        data points
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono text-xs text-emerald-400">
                          {pct(g.graduationProbability)}
                        </div>
                        <div className="font-mono text-[9px] uppercase text-muted-foreground/80">
                          grad.
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs text-gold-light">
                          {pct(g.riskScore)}
                        </div>
                        <div className="font-mono text-[9px] uppercase text-muted-foreground/80">
                          risk
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
