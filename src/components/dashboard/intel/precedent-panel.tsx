"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  Loader2,
  Scale,
  CheckCircle2,
  XCircle,
  Clock,
  GitCompareArrows,
  ShieldCheck,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/aurienta/format";

/**
 * PrecedentPanel — searchable semantic precedent engine UI.
 *
 * Renders the full precedent library as a list, a search input that calls
 * /api/ai/precedent, and a "Compare" button on each match to open a
 * diff view between two proposals.
 */

export type PrecedentProposal = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  enterpriseId: string;
  enterpriseName: string;
  enterpriseTier: string;
  enterpriseSector: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotingPower: number;
  aiRiskScore: number;
  aiRecommendation: string | null;
  createdAt: string;
  executedAt: string | null;
};

export type PrecedentMatch = {
  title: string;
  similarity: number;
  outcome: string;
  keyFactor: string;
  proposalId: string | null;
  enterpriseName: string;
  enterpriseTier: string;
  type: string;
};

export type PrecedentResult = {
  summary: string;
  matches: PrecedentMatch[];
};

const SUGGESTED_QUERIES = [
  "Increase marketing budget by 75%",
  "Replace the law firm",
  "Graduate to sovereign independence",
  "Appoint an independent manager",
  "Discontinue the consulting fee",
];

export function PrecedentPanel({
  proposals,
  enterprises,
}: {
  proposals: PrecedentProposal[];
  enterprises: { id: string; name: string; tier: string }[];
}) {
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<PrecedentResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [compareLeft, setCompareLeft] = React.useState<PrecedentProposal | null>(null);
  const [compareRight, setCompareRight] = React.useState<PrecedentProposal | null>(null);

  const run = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/precedent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "request failed");
      setResult({
        summary: data?.summary ?? "",
        matches: Array.isArray(data?.matches) ? data.matches : [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not search precedents.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(query);
  };

  // Resolve a match back to a real proposal (for Compare).
  const resolveMatch = (m: PrecedentMatch): PrecedentProposal | null => {
    if (!m.proposalId) return null;
    return proposals.find((p) => p.id === m.proposalId) ?? null;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search bar */}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/70" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe a new proposal — the engine surfaces similar past decisions…"
            aria-label="Search precedents"
            className="h-12 w-full rounded-xl border border-gold/20 bg-foreground/[0.02] pl-11 pr-32 font-sans text-sm text-foreground placeholder:text-muted-foreground/80 focus:border-gold/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/30"
          />
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 h-8 -translate-y-1/2 gap-1.5 rounded-lg bg-gold-gradient px-4 text-black hover:opacity-95"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {loading ? "Searching…" : "Find precedents"}
          </Button>
        </div>

        {/* Suggested queries */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground/85">
            Try:
          </span>
          {SUGGESTED_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setQuery(q);
                void run(q);
              }}
              className="rounded-full border border-gold/15 bg-gold/[0.03] px-2.5 py-1 font-sans text-[11px] text-muted-foreground transition-colors hover:border-gold/30 hover:text-gold-light"
            >
              {q}
            </button>
          ))}
        </div>
      </form>

      {/* Search results */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-red-400/25 bg-red-400/[0.06] p-4"
          >
            <p className="font-sans text-[12px] text-red-300">{error}</p>
          </motion.div>
        )}

        {result && (
          <motion.section
            key={result.summary + result.matches.length}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-gold/22 glass-gold p-5 sm:p-6"
          >
            <div className="mb-4 flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
                <Sparkles className="h-4 w-4 text-gold" />
              </span>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold-light/85">
                  Constitutional AI · precedent_match
                </p>
                <p className="font-serif text-base font-semibold text-foreground">
                  Semantic matches
                </p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/[0.04] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-gold/70">
                <ShieldCheck className="h-3 w-3" /> Ledger-immutable
              </span>
            </div>

            <p className="font-sans text-[13px] leading-relaxed text-foreground/90">
              {result.summary}
            </p>

            {result.matches.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-3">
                {result.matches.map((m, i) => (
                  <li
                    key={i + m.title.slice(0, 24)}
                    className="rounded-xl border border-gold/12 bg-background/40 p-4"
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <SimilarityPill value={m.similarity} />
                          <OutcomeBadge outcome={m.outcome} />
                          <Badge
                            variant="outline"
                            className="border-gold/20 bg-gold/[0.04] text-xs text-muted-foreground"
                          >
                            {m.type.replace(/_/g, " ")}
                          </Badge>
                          <span className="font-sans text-xs text-muted-foreground/80">
                            {m.enterpriseName} · Tier {m.enterpriseTier}
                          </span>
                        </div>
                        <p className="mt-1.5 font-serif text-sm font-semibold leading-snug text-foreground">
                          {m.title}
                        </p>
                        <p className="mt-1 font-sans text-[12px] leading-relaxed text-muted-foreground">
                          <span className="font-medium text-gold-light/80">Key factor · </span>
                          {m.keyFactor}
                        </p>
                      </div>
                      {m.proposalId && resolveMatch(m) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const left = resolveMatch(m);
                            if (left) {
                              setCompareLeft(left);
                              // Default right = first other proposal in the library.
                              setCompareRight(
                                proposals.find((p) => p.id !== left.id) ?? null
                              );
                            }
                          }}
                          className="h-8 gap-1.5 rounded-full border-gold/25 bg-gold/[0.04] text-gold-light hover:bg-gold/[0.10]"
                        >
                          <GitCompareArrows className="h-3.5 w-3.5" /> Compare
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 font-sans text-[12px] text-muted-foreground">
                No matches surfaced. Try a more specific query.
              </p>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Precedent library */}
      <section aria-label="Precedent library">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Scale className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-lg font-semibold">
              Precedent library
            </h2>
          </div>
          <span className="font-mono text-xs text-muted-foreground/85">
            {proposals.length} decisions · hash-chained
          </span>
        </div>

        {proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gold/15 bg-foreground/[0.01] py-12 text-center">
            <Inbox className="h-8 w-8 text-gold/60" />
            <p className="font-sans text-[12px] text-muted-foreground">
              No past decisions yet. The library is populated as proposals
              execute, expire, or are rejected.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {proposals.map((p) => (
              <li key={p.id}>
                <ProposalLibraryCard
                  proposal={p}
                  onCompare={(left) => {
                    setCompareLeft(left);
                    setCompareRight(
                      proposals.find((x) => x.id !== left.id) ?? null
                    );
                  }}
                  compareDisabled={proposals.length < 2}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Compare dialog */}
      <CompareDialog
        left={compareLeft}
        right={compareRight}
        proposals={proposals}
        open={!!compareLeft}
        onOpenChange={(v) => {
          if (!v) {
            setCompareLeft(null);
            setCompareRight(null);
          }
        }}
        onRightChange={setCompareRight}
      />
    </div>
  );
}

function ProposalLibraryCard({
  proposal,
  onCompare,
  compareDisabled,
}: {
  proposal: PrecedentProposal;
  onCompare: (p: PrecedentProposal) => void;
  compareDisabled?: boolean;
}) {
  const totalCast =
    proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  const forPct =
    totalCast > 0 ? Math.round((proposal.votesFor / totalCast) * 100) : 0;
  const outcome =
    proposal.status === "executed"
      ? "approved"
      : proposal.status === "rejected"
      ? "rejected"
      : proposal.status === "expired"
      ? "expired"
      : "voting open";

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gold/12 bg-foreground/[0.02] p-4 transition-colors hover:border-gold/25">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-gold/25 bg-gold/[0.06] font-mono text-xs text-gold-light"
        >
          {proposal.type.replace(/_/g, " ")}
        </Badge>
        <OutcomeBadge outcome={outcome} />
        <span className="font-sans text-xs text-muted-foreground/80">
          Tier {proposal.enterpriseTier}
        </span>
      </div>
      <h3 className="mt-2 line-clamp-2 font-serif text-sm font-semibold leading-snug text-foreground">
        {proposal.title}
      </h3>
      <p className="mt-1 line-clamp-2 font-sans text-[11.5px] leading-relaxed text-muted-foreground">
        {proposal.description}
      </p>
      <div className="mt-auto flex items-center justify-between pt-3">
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground/85">
          <span>{proposal.enterpriseName}</span>
          <span className="text-gold/30">·</span>
          <span>{forPct}% for</span>
          <span className="text-gold/30">·</span>
          <span>AI {proposal.aiRiskScore}/100</span>
        </div>
        <button
          onClick={() => onCompare(proposal)}
          disabled={compareDisabled}
          className="inline-flex items-center gap-1 rounded-full border border-gold/20 bg-gold/[0.04] px-2.5 py-1 font-sans text-xs text-gold-light transition-colors hover:bg-gold/[0.10] disabled:opacity-40"
        >
          <GitCompareArrows className="h-3 w-3" /> Compare
        </button>
      </div>
    </article>
  );
}

function SimilarityPill({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.9 ? "#34d399" : value >= 0.8 ? "#f4d676" : "#c9a03d";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-xs font-medium"
      style={{
        color,
        background: color + "22",
        border: `1px solid ${color}55`,
      }}
    >
      <Sparkles className="h-2.5 w-2.5" />
      {pct}% match
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
    approved: {
      label: "Approved",
      color: "#34d399",
      bg: "rgba(52,211,153,0.10)",
      border: "rgba(52,211,153,0.32)",
      icon: CheckCircle2,
    },
    rejected: {
      label: "Rejected",
      color: "#f87171",
      bg: "rgba(248,113,113,0.10)",
      border: "rgba(248,113,113,0.32)",
      icon: XCircle,
    },
    expired: {
      label: "Expired",
      color: "#9ca3af",
      bg: "rgba(156,163,175,0.10)",
      border: "rgba(156,163,175,0.30)",
      icon: Clock,
    },
    "voting open": {
      label: "Voting open",
      color: "#f4d676",
      bg: "rgba(244,214,118,0.10)",
      border: "rgba(244,214,118,0.32)",
      icon: Clock,
    },
    unknown: {
      label: outcome,
      color: "#9ca3af",
      bg: "rgba(156,163,175,0.10)",
      border: "rgba(156,163,175,0.30)",
      icon: Clock,
    },
  };
  const m = map[outcome] ?? map.unknown;
  const Icon = m.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-medium"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      <Icon className="h-2.5 w-2.5" /> {m.label}
    </span>
  );
}

function CompareDialog({
  left,
  right,
  proposals,
  open,
  onOpenChange,
  onRightChange,
}: {
  left: PrecedentProposal | null;
  right: PrecedentProposal | null;
  proposals: PrecedentProposal[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRightChange: (p: PrecedentProposal | null) => void;
}) {
  if (!left) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border border-gold/25 bg-background p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-gold/12 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 font-serif text-base font-semibold">
            <GitCompareArrows className="h-4 w-4 text-gold" />
            Constitutional diff
          </DialogTitle>
          <DialogDescription className="font-sans text-[12px] text-muted-foreground">
            Side-by-side comparison of two proposals. The CRE preserves both
            versions on the immutable ledger.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-6 py-5 lg:grid-cols-2">
          {/* Left */}
          <ProposalCompareBlock label="A" proposal={left} tone="gold" />

          {/* Right + selector */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="compare-right"
                className="font-mono text-xs uppercase tracking-wider text-muted-foreground/80"
              >
                Compare against:
              </label>
              <select
                id="compare-right"
                value={right?.id ?? ""}
                onChange={(e) => {
                  const p = proposals.find((x) => x.id === e.target.value) ?? null;
                  onRightChange(p);
                }}
                className="h-8 flex-1 rounded-lg border border-gold/20 bg-foreground/[0.04] px-2 font-sans text-[12px] text-foreground focus:border-gold/45 focus:outline-none"
              >
                {proposals
                  .filter((p) => p.id !== left.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title.slice(0, 60)}
                    </option>
                  ))}
              </select>
            </div>
            {right ? (
              <ProposalCompareBlock label="B" proposal={right} tone="muted" />
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gold/15 py-10 text-center">
                <p className="font-sans text-[12px] text-muted-foreground">
                  Select a proposal to compare.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Diff summary */}
        {right && (
          <div className="border-t border-gold/12 px-6 py-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground/85">
              Diff summary
            </p>
            <p className="mt-1 font-sans text-[12.5px] leading-relaxed text-foreground/85">
              <span className="text-gold-light">{left.enterpriseName}</span>{" "}
              ({left.type.replace(/_/g, " ")}, AI risk {left.aiRiskScore}/100)
              {" → "}
              <span className="text-gold-light">{right.enterpriseName}</span>{" "}
              ({right.type.replace(/_/g, " ")}, AI risk {right.aiRiskScore}/100).
              Type {left.type === right.type ? "matches" : "differs"}; AI risk
              delta {right.aiRiskScore - left.aiRiskScore > 0 ? "+" : ""}
              {right.aiRiskScore - left.aiRiskScore} points; same enterprise:{" "}
              {left.enterpriseId === right.enterpriseId ? "yes" : "no"}.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProposalCompareBlock({
  label,
  proposal,
  tone,
}: {
  label: string;
  proposal: PrecedentProposal;
  tone: "gold" | "muted";
}) {
  const totalCast =
    proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  const forPct =
    totalCast > 0 ? Math.round((proposal.votesFor / totalCast) * 100) : 0;
  const outcome =
    proposal.status === "executed"
      ? "approved"
      : proposal.status === "rejected"
      ? "rejected"
      : proposal.status === "expired"
      ? "expired"
      : "voting open";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-4",
        tone === "gold"
          ? "border-gold/30 bg-gold/[0.05]"
          : "border-gold/12 bg-foreground/[0.02]"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-md font-mono text-[11px] font-semibold",
            tone === "gold" ? "bg-gold-gradient text-black" : "border border-gold/20 bg-gold/[0.04] text-gold-light"
          )}
        >
          {label}
        </span>
        <Badge
          variant="outline"
          className="border-gold/20 bg-gold/[0.04] font-mono text-xs text-gold-light"
        >
          {proposal.type.replace(/_/g, " ")}
        </Badge>
        <OutcomeBadge outcome={outcome} />
      </div>
      <h4 className="font-serif text-sm font-semibold leading-snug text-foreground">
        {proposal.title}
      </h4>
      <p className="line-clamp-4 font-sans text-[11.5px] leading-relaxed text-muted-foreground">
        {proposal.description}
      </p>
      <div className="mt-1 grid grid-cols-3 gap-2 font-mono text-xs">
        <Stat label="For" value={`${forPct}%`} />
        <Stat label="AI risk" value={`${proposal.aiRiskScore}/100`} />
        <Stat label="Enterprise" value={`T${proposal.enterpriseTier}`} />
      </div>
      <p className="font-mono text-[11px] text-muted-foreground/80">
        {proposal.enterpriseName} · {timeAgo(new Date(proposal.createdAt))}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gold/10 bg-background/40 px-2 py-1.5">
      <p className="uppercase tracking-wider text-muted-foreground/85">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
