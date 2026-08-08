"use client";

import * as React from "react";
import { Sparkles, Loader2, BookOpen, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * ExplainNumber — a self-contained, reusable "Explain This Number" widget.
 *
 * Renders as a small gold Sparkles button beside any metric. When clicked,
 * calls POST /api/ai/explain with { label, value, enterpriseId } and shows
 * the AI's plain-language explanation in a popover (with sources and a
 * ledger-immutable seal).
 *
 * Usage:
 *   <ExplainNumber label="Gross margin" value="34%" enterpriseId="abc" />
 *   <ExplainNumber label="Law Firm Client Account balance" value={egp(2_400_000)} enterpriseId="abc" />
 *
 * No external imports required — drop into any client component.
 */
export function ExplainNumber({
  label,
  value,
  enterpriseId,
  className,
  variant = "icon",
}: {
  label: string;
  value: string | number;
  enterpriseId?: string;
  className?: string;
  /**
   * - "icon"  → just a small Sparkles icon button (default)
   * - "pill"  → a wider pill with "Explain" label
   */
  variant?: "icon" | "pill";
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [explanation, setExplanation] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const runExplain = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setExplanation(null);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label, value, enterpriseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "request failed");
      setExplanation(typeof data?.explanation === "string" ? data.explanation : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate explanation.");
    } finally {
      setLoading(false);
    }
  }, [label, value, enterpriseId]);

  // Trigger fetch on first open only.
  React.useEffect(() => {
    if (open && explanation === null && !loading && error === null) {
      void runExplain();
    }
  }, [open, explanation, loading, error, runExplain]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Explain ${label}`}
          className={cn(
            "group inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/[0.06] font-mono text-xs font-medium text-gold-light transition-all hover:border-gold/45 hover:bg-gold/[0.12] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
            variant === "icon" ? "h-6 px-1.5" : "h-7 px-2.5",
            className
          )}
        >
          <Sparkles className="h-3 w-3 text-gold transition-transform group-hover:scale-110" />
          {variant === "pill" && <span>Explain</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[20rem] max-w-[calc(100vw-2rem)] rounded-xl border border-gold/25 bg-popover p-0 text-popover-foreground shadow-xl"
      >
        <div className="flex items-start gap-2.5 border-b border-gold/12 px-4 py-3">
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
            <BookOpen className="h-3.5 w-3.5 text-gold" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
              Explain this number
            </p>
            <p className="truncate font-serif text-sm font-semibold text-foreground">
              {label}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-gold/20 bg-gold/[0.04] px-2 py-0.5 font-mono text-xs text-gold-light">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
        </div>

        <div className="px-4 py-3">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 py-2"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                <span className="font-sans text-[12px] text-muted-foreground">
                  Constitutional AI is reading the ledger…
                </span>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border border-red-400/25 bg-red-400/[0.06] px-3 py-2"
              >
                <p className="font-sans text-[12px] text-red-300">{error}</p>
                <button
                  onClick={() => void runExplain()}
                  className="mt-1.5 font-mono text-xs text-gold hover:underline"
                >
                  Retry
                </button>
              </motion.div>
            ) : explanation ? (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <p className="whitespace-pre-line font-sans text-[12.5px] leading-relaxed text-foreground/90">
                  {explanation}
                </p>
                <div className="flex items-center gap-1.5 pt-1.5">
                  <ShieldCheck className="h-3 w-3 text-gold/70" />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
                    Ledger-immutable · AiArtifact persisted
                  </span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
}
