"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Vote,
  AlertCircle,
  Loader2,
  Calculator,
  Users,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { EmptyState } from "@/components/dashboard/ux/empty-state";

// ── Types ──
type Proposal = {
  id: string;
  title: string;
  type: string;
  status: string;
  votingEndsAt: string;
  enterprise: {
    id: string;
    name: string;
    slug: string;
    tier: string;
  };
  myAllocation: {
    voiceCredits: number;
    creditsSpent: number;
    voteWeight: number;
    remainingCredits: number;
  } | null;
  results: {
    totalWeight: number;
    voterCount: number;
  };
};

// ── Helpers ──
function timeRemaining(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "ended";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function proposalTypeLabel(t: string): string {
  return t.replace(/_/g, " ");
}

// ── Vote caster ──
function CastVoteControl({
  proposal,
  voiceCreditsAvailable,
  onVoted,
}: {
  proposal: Proposal;
  voiceCreditsAvailable: number;
  onVoted: () => void;
}) {
  // Compute the credits remaining for THIS proposal:
  // - If the user has an allocation, it's voiceCredits - creditsSpent.
  // - Otherwise it's the STS-derived cap.
  const alreadySpent = proposal.myAllocation?.creditsSpent ?? 0;
  const proposalCap = proposal.myAllocation?.voiceCredits ?? voiceCreditsAvailable;
  const available = Math.max(0, proposalCap - alreadySpent);

  const [credits, setCredits] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);

  // Reset slider when available changes (e.g. after a successful vote).
  React.useEffect(() => {
    setCredits(Math.min(1, available));
  }, [available]);

  const resultingWeight = Math.sqrt(alreadySpent + credits);
  const resultingTotalCredits = alreadySpent + credits;
  const disabled = available <= 0 || submitting || credits <= 0;

  async function submit() {
    if (credits <= 0) {
      toast.error("Select at least 1 credit", {
        description: "Drag the slider to choose how many voice credits to spend.",
      });
      return;
    }
    if (credits > available) {
      toast.error("Not enough voice credits", {
        description: `You have ${available} credits remaining on this proposal.`,
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await csrfFetch(`/api/quadratic-voting/${proposal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsSpent: credits }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? data.message ?? "Vote failed");
      }
      toast.success("Vote cast", {
        description: `+${credits} credits · total weight ${data.allocation.voteWeight.toFixed(3)} · ${data.allocation.remainingCredits} credits remaining.`,
      });
      onVoted();
    } catch (e) {
      toast.error("Vote failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gold/15 bg-foreground/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-3.5 w-3.5 text-gold" />
          <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            Cast quadratic vote
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/80">
          {available} credits available
        </span>
      </div>

      {available <= 0 ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-400/[0.06] p-3">
          <AlertCircle className="h-3.5 w-3.5 text-indigo-500" />
          <span className="font-sans text-xs text-indigo-700 dark:text-indigo-300">
            You have spent all your voice credits on this proposal.
          </span>
        </div>
      ) : (
        <>
          <div className="mt-4 px-1">
            <Slider
              min={1}
              max={available}
              step={1}
              value={[credits]}
              onValueChange={(v) => setCredits(v[0] ?? 1)}
            />
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
              <span>1 credit</span>
              <span className="text-gold-light">{credits} credits</span>
              <span>{available} credits</span>
            </div>
          </div>

          {/* Influence preview */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-gold/10 bg-foreground/[0.02] p-2 text-center">
              <div className="font-mono text-xs text-gold-light">{credits}</div>
              <div className="font-mono text-[9px] uppercase text-muted-foreground/80">
                credits
              </div>
            </div>
            <div className="rounded-lg border border-gold/10 bg-foreground/[0.02] p-2 text-center">
              <div className="font-mono text-xs text-emerald-400">
                {resultingWeight.toFixed(3)}
              </div>
              <div className="font-mono text-[9px] uppercase text-muted-foreground/80">
                weight
              </div>
            </div>
            <div className="rounded-lg border border-gold/10 bg-foreground/[0.02] p-2 text-center">
              <div className="font-mono text-xs text-muted-foreground">
                {resultingTotalCredits}
              </div>
              <div className="font-mono text-[9px] uppercase text-muted-foreground/80">
                total spent
              </div>
            </div>
          </div>

          <Button
            onClick={submit}
            disabled={disabled}
            className="mt-4 w-full bg-gold-gradient text-[#0a0a0b] hover:opacity-90"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Vote className="mr-2 h-4 w-4" />
            )}
            Cast {credits} credit{credits === 1 ? "" : "s"} →{" "}
            {resultingWeight.toFixed(2)} weight
          </Button>
        </>
      )}
    </div>
  );
}

// ── Proposal row ──
function ProposalRow({
  proposal,
  voiceCreditsAvailable,
  onVoted,
  index,
}: {
  proposal: Proposal;
  voiceCreditsAvailable: number;
  onVoted: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="overflow-hidden rounded-2xl border border-gold/15 glass"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 border-b border-gold/10 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase border-gold/20 bg-foreground/5">
              {proposalTypeLabel(proposal.type)}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] uppercase",
                proposal.status === "voting_open"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : "border-gold/20 bg-foreground/5 text-muted-foreground"
              )}
            >
              {proposal.status.replace(/_/g, " ")}
            </Badge>
            <span className="font-mono text-[10px] text-muted-foreground/80">
              {proposal.enterprise.name} · Tier {proposal.enterprise.tier}
            </span>
          </div>
          <h3 className="mt-2 font-serif text-base font-semibold">
            {proposal.title}
          </h3>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
            voting ends in {timeRemaining(proposal.votingEndsAt)}
          </p>
        </div>

        {/* Results sidebar */}
        <div className="flex items-center gap-4 rounded-xl border border-gold/10 bg-foreground/[0.02] p-3">
          <div className="text-center">
            <div className="font-mono text-sm text-gold-light">
              {proposal.results.totalWeight.toFixed(2)}
            </div>
            <div className="font-mono text-[9px] uppercase text-muted-foreground/80">
              total weight
            </div>
          </div>
          <div className="text-center">
            <div className="font-mono text-sm text-foreground">
              {proposal.results.voterCount}
            </div>
            <div className="font-mono text-[9px] uppercase text-muted-foreground/80">
              voters
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-4 p-5 lg:grid-cols-2">
        {/* My allocation summary */}
        <div className="flex flex-col gap-3 rounded-xl border border-gold/10 bg-foreground/[0.02] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Your allocation
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/80">
              weight = sqrt(spent)
            </span>
          </div>
          {proposal.myAllocation ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="font-serif text-lg font-semibold text-gold-light">
                    {proposal.myAllocation.voiceCredits}
                  </div>
                  <div className="font-mono text-[9px] uppercase text-muted-foreground/80">
                    voice credits
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-serif text-lg font-semibold text-foreground">
                    {proposal.myAllocation.creditsSpent}
                  </div>
                  <div className="font-mono text-[9px] uppercase text-muted-foreground/80">
                    spent
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-serif text-lg font-semibold text-emerald-400">
                    {proposal.myAllocation.voteWeight.toFixed(3)}
                  </div>
                  <div className="font-mono text-[9px] uppercase text-muted-foreground/80">
                    weight
                  </div>
                </div>
              </div>
              <div className="mt-1">
                <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground/80">
                  <span>budget used</span>
                  <span>
                    {proposal.myAllocation.creditsSpent}/
                    {proposal.myAllocation.voiceCredits}
                  </span>
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        (proposal.myAllocation.creditsSpent /
                          Math.max(proposal.myAllocation.voiceCredits, 1)) *
                        100
                      }%`,
                    }}
                    transition={{ duration: 0.4 }}
                    className="h-full bg-gold-gradient"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="py-2 text-center">
              <Sparkles className="mx-auto h-5 w-5 text-gold/40" />
              <p className="mt-1 font-sans text-xs text-muted-foreground">
                No allocation yet — cast a vote below to begin.
              </p>
            </div>
          )}
        </div>

        {/* Cast vote control */}
        <CastVoteControl
          proposal={proposal}
          voiceCreditsAvailable={voiceCreditsAvailable}
          onVoted={onVoted}
        />
      </div>
    </motion.div>
  );
}

// ── Math explainer ──
function MathExplainer() {
  const rows = [
    { credits: 1, weight: 1, label: "1 credit" },
    { credits: 4, weight: 2, label: "4 credits" },
    { credits: 9, weight: 3, label: "9 credits" },
    { credits: 16, weight: 4, label: "16 credits" },
    { credits: 25, weight: 5, label: "25 credits" },
  ];
  return (
    <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
      <div className="border-b border-gold/12 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Calculator className="h-3.5 w-3.5 text-gold" />
          <h2 className="font-serif text-base font-semibold">
            How quadratic voting works
          </h2>
        </div>
      </div>
      <div className="p-5">
        <p className="font-sans text-xs leading-relaxed text-muted-foreground">
          Vote weight = <span className="font-mono text-gold-light">sqrt(credits spent)</span>.
          Each additional credit costs more influence than the last — favoring
          broad consensus over concentrated preference intensity. A voter who
          feels strongly about 5 proposals can cast a 1-credit vote on each (5
          weight total), outperforming a single 25-credit vote on one proposal
          (5 weight on that proposal only).
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {rows.map((r) => (
            <div
              key={r.credits}
              className="rounded-lg border border-gold/10 bg-foreground/[0.02] p-3 text-center"
            >
              <div className="font-mono text-[10px] text-muted-foreground/80">
                {r.label}
              </div>
              <div className="mt-1 font-serif text-lg font-semibold text-gold-light">
                {r.weight}x
              </div>
              <div className="font-mono text-[9px] uppercase text-muted-foreground/80">
                influence
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 font-sans text-[11px] text-muted-foreground/80">
          Voice credits are non-transferable and reset per proposal. Unused
          credits do not roll over. Credits are governance units, NOT currency.
        </p>
      </div>
    </section>
  );
}

// ── Results visualization ──
function ResultsBarChart({ proposals }: { proposals: Proposal[] }) {
  const max = Math.max(1, ...proposals.map((p) => p.results.totalWeight));
  return (
    <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
      <div className="border-b border-gold/12 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-gold" />
          <h2 className="font-serif text-base font-semibold">
            Vote weight per proposal
          </h2>
          <span className="ml-auto font-mono text-xs text-muted-foreground/80">
            {proposals.length} active
          </span>
        </div>
      </div>
      <div className="p-5">
        {proposals.length === 0 ? (
          <p className="py-6 text-center font-sans text-xs text-muted-foreground">
            No active proposals to visualize.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {proposals.map((p) => {
              const widthPct = (p.results.totalWeight / max) * 100;
              return (
                <li key={p.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-sans text-xs text-foreground">
                      {p.title}
                    </span>
                    <span className="ml-2 font-mono text-[10px] text-gold-light">
                      {p.results.totalWeight.toFixed(2)} · {p.results.voterCount}{" "}
                      voters
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gold-gradient"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

// ── Main component ──
export function QuadraticVotingClient({
  sovereignTrustScore,
  voiceCreditsAvailable,
  proposals,
}: {
  userId: string;
  sovereignTrustScore: number;
  voiceCreditsAvailable: number;
  proposals: Proposal[];
}) {
  const [proposalsState, setProposalsState] = React.useState(proposals);

  // Reload the page data after a vote (simplest: refetch via the API list
  // endpoint and merge). The page server-component is the source of truth —
  // we trigger a router refresh on next paint by reloading allocations.
  const reload = React.useCallback(async () => {
    try {
      // Pull fresh allocations for the current proposals.
      const ids = proposalsState.map((p) => p.id);
      const results = await Promise.all(
        ids.map(async (proposalId) => {
          const res = await csrfFetch(`/api/quadratic-voting/${proposalId}`);
          if (!res.ok) return null;
          const data = await res.json();
          return { proposalId, data };
        })
      );
      const byProposal = new Map(
        results
          .filter((r): r is NonNullable<typeof r> => r !== null)
          .map((r) => [r.proposalId, r.data])
      );
      setProposalsState((prev) =>
        prev.map((p) => {
          const fresh = byProposal.get(p.id);
          if (!fresh) return p;
          return {
            ...p,
            myAllocation: fresh.myAllocation
              ? {
                  voiceCredits: fresh.myAllocation.voiceCredits,
                  creditsSpent: fresh.myAllocation.creditsSpent,
                  voteWeight: fresh.myAllocation.voteWeight,
                  remainingCredits: fresh.myAllocation.remainingCredits,
                }
              : p.myAllocation,
            results: fresh.results
              ? {
                  totalWeight: fresh.results.totalWeight,
                  voterCount: fresh.results.voterCount,
                }
              : p.results,
          };
        })
      );
    } catch (e) {
      console.error("[quadratic-voting] reload failed:", e);
    }
  }, [proposalsState]);

  return (
    <div className="flex flex-col gap-6">
      {/* Indigo disclaimer (AUD-UX-2: was amber, brand violation) */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-400/30 bg-indigo-400/[0.06] p-4">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
        <div>
          <p className="font-sans text-sm font-medium text-indigo-700 dark:text-indigo-300">
            Voice credits are governance units, NOT currency. No financial value.
          </p>
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            Credits derive from your Sovereign Trust Score (floor(STS/5), capped
            at 20) and are non-transferable. They cannot be bought, sold, or
            redeemed. They exist solely to weight governance preferences.
          </p>
        </div>
      </div>

      {/* Voice credits summary */}
      <section className="relative overflow-hidden rounded-2xl border border-gold/30 glass-gold p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative grid gap-6 sm:grid-cols-3 sm:items-center">
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2">
              <Vote className="h-4 w-4 text-gold" />
              <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-gold-light/85">
                Your voice
              </span>
            </div>
            <div className="mt-2 font-serif text-4xl font-semibold text-gold-gradient">
              {voiceCreditsAvailable}
            </div>
            <p className="mt-1 font-sans text-xs text-muted-foreground">
              voice credits per proposal
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-2">
            <div className="rounded-xl border border-gold/15 bg-foreground/[0.02] p-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-gold" />
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  Sovereign Trust
                </span>
              </div>
              <div className="mt-1.5 font-serif text-xl font-semibold">
                {sovereignTrustScore}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground/80">
                floor({sovereignTrustScore}/5) = {voiceCreditsAvailable}
              </p>
            </div>
            <div className="rounded-xl border border-gold/15 bg-foreground/[0.02] p-3">
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3 text-gold" />
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  Active proposals
                </span>
              </div>
              <div className="mt-1.5 font-serif text-xl font-semibold">
                {proposalsState.length}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground/80">
                {proposalsState.filter((p) => p.myAllocation).length} voted ·{" "}
                {proposalsState.filter((p) => !p.myAllocation).length} pending
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proposals */}
      {proposalsState.length === 0 ? (
        <EmptyState
          icon={Vote}
          title="No Active Proposals"
          description="Quadratic voting proposals will appear here when enterprises create governance proposals."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {proposalsState.map((p, i) => (
            <ProposalRow
              key={p.id}
              proposal={p}
              voiceCreditsAvailable={voiceCreditsAvailable}
              onVoted={reload}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Results visualization */}
      <ResultsBarChart proposals={proposalsState} />

      {/* Math explainer */}
      <MathExplainer />
    </div>
  );
}
