"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Sparkles,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Building2,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { egp, timeAgo } from "@/lib/aurienta/format";

/**
 * AnomalyCard — renders a single expense with a non-"none" AI risk flag.
 * The "Generate narration" button calls /api/ai/anomaly to write a
 * plain-language investigation brief (persisted as a ledger-immutable
 * AiArtifact — court-admissible).
 */

export type Anomaly = {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  enterpriseTier: string;
  category: string;
  description: string;
  vendor: string;
  amountEgp: number;
  flag: string; // threshold_gaming | related_party | duplicate | ...
  createdAt: string; // ISO
  submitterName: string | null;
};

const FLAG_META: Record<
  string,
  { label: string; tone: "red" | "amber"; icon: React.ElementType }
> = {
  threshold_gaming: { label: "Threshold gaming", tone: "amber", icon: AlertTriangle },
  related_party: { label: "Related party", tone: "red", icon: ShieldAlert },
  duplicate: { label: "Duplicate", tone: "amber", icon: AlertTriangle },
  unusual_vendor: { label: "Unusual vendor", tone: "amber", icon: AlertTriangle },
  off_hours: { label: "Off-hours", tone: "amber", icon: AlertTriangle },
};

function flagMeta(flag: string) {
  return FLAG_META[flag] ?? { label: flag.replace(/_/g, " "), tone: "amber" as const, icon: AlertTriangle };
}

export function AnomalyCard({
  anomaly,
  onNarrated,
}: {
  anomaly: Anomaly;
  onNarrated?: (expenseId: string, narration: string) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [narration, setNarration] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fm = flagMeta(anomaly.flag);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/anomaly", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expenseId: anomaly.id,
          flag: anomaly.flag,
          enterpriseId: anomaly.enterpriseId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "request failed");
      setNarration(data?.narration ?? null);
      onNarrated?.(anomaly.id, data?.narration ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate narration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl glass-gold p-5 sm:p-6"
    >
      {/* Status ribbon */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-px",
          fm.tone === "red"
            ? "bg-gradient-to-r from-transparent via-red-400/80 to-transparent"
            : "bg-gradient-to-r from-transparent via-amber-400/80 to-transparent"
        )}
        aria-hidden
      />

      {/* Header */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border-0 font-mono text-xs",
                fm.tone === "red"
                  ? "bg-red-400/12 text-red-300"
                  : "bg-amber-400/12 text-amber-300"
              )}
            >
              <fm.icon className="mr-1 h-3 w-3" />
              {fm.label}
            </Badge>
            <Badge
              variant="outline"
              className="border-gold/20 bg-gold/[0.04] text-xs text-muted-foreground"
            >
              Tier {anomaly.enterpriseTier}
            </Badge>
            <span className="inline-flex items-center gap-1 font-sans text-xs text-muted-foreground/80">
              <Building2 className="h-3 w-3" /> {anomaly.enterpriseName}
            </span>
          </div>
          <h3 className="mt-2 font-serif text-base font-semibold leading-snug text-foreground sm:text-lg">
            {anomaly.description}
          </h3>
          <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
            {anomaly.category} · vendor{" "}
            <span className="text-gold-light/80">{anomaly.vendor}</span> ·{" "}
            {timeAgo(new Date(anomaly.createdAt))}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="font-serif text-xl font-semibold text-gold-gradient">
            {egp(anomaly.amountEgp)}
          </span>
          {anomaly.submitterName && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
              <User className="h-2.5 w-2.5" /> {anomaly.submitterName}
            </span>
          )}
        </div>
      </div>

      {/* Action row */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => void generate()}
          disabled={loading}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[11.5px] font-medium transition-all",
            narration
              ? "border border-gold/25 bg-gold/[0.04] text-gold-light hover:bg-gold/[0.08]"
              : "bg-gold-gradient text-black shadow-[0_4px_18px_-6px_rgba(212,175,55,0.6)] hover:opacity-95",
            loading && "opacity-70"
          )}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {narration ? "Regenerate narration" : "Generate narration"}
        </button>
        {narration && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-emerald-300">
            <ShieldCheck className="h-3 w-3" /> Ledger-immutable
          </span>
        )}
      </div>

      {/* Narration / error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="rounded-lg border border-red-400/25 bg-red-400/[0.06] px-3 py-2">
              <p className="font-sans text-[12px] text-red-300">{error}</p>
            </div>
          </motion.div>
        )}
        {narration && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="rounded-lg border border-gold/15 bg-background/40 p-3.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-gold/80" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                  Constitutional investigation brief
                </span>
              </div>
              <p className="whitespace-pre-line font-sans text-[12.5px] leading-relaxed text-foreground/90">
                {narration}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
