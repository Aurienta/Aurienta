"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCompareArrows,
  Sparkles,
  Loader2,
  ShieldCheck,
  Plus,
  Minus,
  FileText,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * CharterDiffViewer — renders a git-style before/after text diff for a
 * constitutional amendment, plus an AI implications panel.
 *
 * The diff is computed client-side with a simple line-by-line comparison.
 * Additions = green, deletions = red, unchanged = neutral.
 */

export type CharterAmendment = {
  id: string;
  title: string;
  enterpriseName: string;
  enterpriseTier: string;
  summary: string; // short summary of the change
  beforeText: string;
  afterText: string;
};

type DiffLine = {
  type: "add" | "del" | "ctx";
  text: string;
  beforeLineNo?: number;
  afterLineNo?: number;
};

/**
 * Compute a simple LCS-based line diff between two strings.
 * Falls back to a naive set-diff if either side is empty.
 */
function computeDiff(before: string, after: string): DiffLine[] {
  const beforeLines = before.split(/\r?\n/);
  const afterLines = after.split(/\r?\n/);
  const m = beforeLines.length;
  const n = afterLines.length;

  // LCS DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (beforeLines[i] === afterLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let beforeLineNo = 0;
  let afterLineNo = 0;
  while (i < m && j < n) {
    if (beforeLines[i] === afterLines[j]) {
      beforeLineNo++;
      afterLineNo++;
      result.push({
        type: "ctx",
        text: beforeLines[i],
        beforeLineNo,
        afterLineNo,
      });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      beforeLineNo++;
      result.push({ type: "del", text: beforeLines[i], beforeLineNo });
      i++;
    } else {
      afterLineNo++;
      result.push({ type: "add", text: afterLines[j], afterLineNo });
      j++;
    }
  }
  while (i < m) {
    beforeLineNo++;
    result.push({ type: "del", text: beforeLines[i], beforeLineNo });
    i++;
  }
  while (j < n) {
    afterLineNo++;
    result.push({ type: "add", text: afterLines[j], afterLineNo });
    j++;
  }
  return result;
}

export function CharterDiffViewer({
  amendment,
  defaultOpen = false,
}: {
  amendment: CharterAmendment;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [loading, setLoading] = React.useState(false);
  const [implications, setImplications] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const diff = React.useMemo(
    () => computeDiff(amendment.beforeText, amendment.afterText),
    [amendment.beforeText, amendment.afterText]
  );

  const stats = React.useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const d of diff) {
      if (d.type === "add") added++;
      else if (d.type === "del") removed++;
    }
    return { added, removed };
  }, [diff]);

  const runAi = async () => {
    setLoading(true);
    setError(null);
    setImplications(null);
    try {
      const res = await fetch("/api/ai/charter-diff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          proposalId: amendment.id,
          beforeText: amendment.beforeText,
          afterText: amendment.afterText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "request failed");
      setImplications(data?.implications ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate implications.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-run AI when expanded for the first time.
  React.useEffect(() => {
    if (open && implications === null && !loading && error === null) {
      void runAi();
    }
    // Intentionally fire only on `open` toggle; re-runs handled by button.
  }, [open]);

  return (
    <article className="relative overflow-hidden rounded-2xl border border-gold/15 glass-gold">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gold/[0.03] sm:px-6"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
          <FileText className="h-4 w-4 text-gold" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-gold/25 bg-gold/[0.06] font-mono text-xs text-gold-light"
            >
              constitutional amendment
            </Badge>
            <Badge
              variant="outline"
              className="border-gold/20 bg-gold/[0.04] text-xs text-muted-foreground"
            >
              Tier {amendment.enterpriseTier}
            </Badge>
            <span className="font-sans text-xs text-muted-foreground/80">
              {amendment.enterpriseName}
            </span>
          </div>
          <h3 className="mt-1.5 font-serif text-base font-semibold leading-snug text-foreground sm:text-lg">
            {amendment.title}
          </h3>
          <p className="mt-0.5 line-clamp-2 font-sans text-[11.5px] leading-relaxed text-muted-foreground">
            {amendment.summary}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
              Lines changed
            </p>
            <p className="font-mono text-[12px]">
              <span className="text-emerald-300">+{stats.added}</span>{" "}
              <span className="text-red-300">−{stats.removed}</span>
            </p>
          </div>
          <GitCompareArrows
            className={cn(
              "h-4 w-4 text-gold transition-transform",
              open && "rotate-90"
            )}
          />
        </div>
      </button>

      {/* Expanded body */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-gold/12 px-5 py-5 sm:px-6">
              {/* Diff viewer */}
              <div className="mb-4 flex items-center gap-2">
                <ScrollText className="h-3.5 w-3.5 text-gold/80" />
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
                  Charter text diff
                </span>
                <span className="ml-auto flex items-center gap-3 font-mono text-xs">
                  <span className="text-emerald-300">+{stats.added} added</span>
                  <span className="text-red-300">−{stats.removed} removed</span>
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gold/12 bg-[#06060a] font-mono text-[12px] leading-relaxed">
                <div className="grid grid-cols-[2.5rem_2.5rem_1fr] sm:grid-cols-[3rem_3rem_1fr]">
                  {diff.map((d, i) => (
                    <DiffRow key={i} line={d} />
                  ))}
                </div>
              </div>

              {/* AI implications */}
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-gold" />
                    <h4 className="font-serif text-sm font-semibold">
                      AI-explained implications
                    </h4>
                  </div>
                  <Button
                    onClick={() => void runAi()}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 rounded-full border-gold/25 bg-gold/[0.04] text-gold-light hover:bg-gold/[0.10]"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {loading ? "Analyzing…" : "Regenerate"}
                  </Button>
                </div>

                <div className="rounded-xl border border-gold/15 bg-background/40 p-4">
                  {loading ? (
                    <div className="flex items-center gap-2.5 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-gold" />
                      <span className="font-sans text-[12px] text-muted-foreground">
                        Constitutional AI is counting impact on past decisions…
                      </span>
                    </div>
                  ) : error ? (
                    <p className="font-sans text-[12px] text-red-300">{error}</p>
                  ) : implications ? (
                    <>
                      <p className="whitespace-pre-line font-sans text-[12.5px] leading-relaxed text-foreground/90">
                        {implications}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5 border-t border-gold/10 pt-2.5">
                        <ShieldCheck className="h-3 w-3 text-gold/70" />
                        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
                          Ledger-immutable · AiArtifact · court-admissible
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function DiffRow({ line }: { line: DiffLine }) {
  const isAdd = line.type === "add";
  const isDel = line.type === "del";
  return (
    <>
      {/* Before line number */}
      <div
        className={cn(
          "select-none border-r border-gold/8 px-2 py-0.5 text-right text-xs",
          isAdd
            ? "bg-emerald-400/[0.04] text-muted-foreground/85"
            : isDel
            ? "bg-red-400/[0.08] text-red-300/60"
            : "text-muted-foreground/85"
        )}
      >
        {line.beforeLineNo ?? ""}
      </div>
      {/* After line number */}
      <div
        className={cn(
          "select-none border-r border-gold/8 px-2 py-0.5 text-right text-xs",
          isAdd
            ? "bg-emerald-400/[0.08] text-emerald-300/60"
            : isDel
            ? "bg-red-400/[0.04] text-muted-foreground/85"
            : "text-muted-foreground/85"
        )}
      >
        {line.afterLineNo ?? ""}
      </div>
      {/* Content */}
      <div
        className={cn(
          "flex items-start gap-2 px-3 py-0.5",
          isAdd && "bg-emerald-400/[0.08]",
          isDel && "bg-red-400/[0.08]"
        )}
      >
        {isAdd && <Plus className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />}
        {isDel && <Minus className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />}
        {!isAdd && !isDel && (
          <span className="mt-0.5 inline-block h-3 w-3 shrink-0 text-muted-foreground/30">
            {" "}
          </span>
        )}
        <span
          className={cn(
            "whitespace-pre-wrap break-words",
            isAdd && "text-emerald-200",
            isDel && "text-red-200",
            !isAdd && !isDel && "text-foreground/80"
          )}
        >
          {line.text || " "}
        </span>
      </div>
    </>
  );
}
