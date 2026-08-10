"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Gavel, CheckCircle2, Clock, Inbox } from "lucide-react";
import { NewProposalDialog } from "./new-proposal-dialog";
import { ProposalCard } from "./proposal-card";
import { VotingModal } from "./voting-modal";
import { isExpired, type ProposalForUi, type EnterpriseForUi } from "./types";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

type Props = {
  proposals: ProposalForUi[];
  enterprises: EnterpriseForUi[];
};

type FilterKey = "all" | "open" | "executed" | "expired";

const FILTERS: { key: FilterKey; label: string; tKey?: string; icon: React.ElementType }[] = [
  { key: "all", label: "All", tKey: "common.all", icon: Scale },
  { key: "open", label: "Voting open", tKey: "gov.votingOpen", icon: Gavel },
  { key: "executed", label: "Executed", tKey: "gov.executed", icon: CheckCircle2 },
  { key: "expired", label: "Expired", icon: Clock },
];

export function GovernanceBoard({ proposals, enterprises }: Props) {
  const { t } = useLanguage();
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [votingProposal, setVotingProposal] = React.useState<ProposalForUi | null>(null);

  const filtered = React.useMemo(() => {
    const list = proposals.slice();
    switch (filter) {
      case "all":
        return list;
      case "open":
        return list.filter((p) => p.status === "voting_open" && !isExpired(p.votingEndsAt));
      case "executed":
        return list.filter((p) => p.status === "executed");
      case "expired":
        return list.filter(
          (p) => p.status !== "executed" && isExpired(p.votingEndsAt)
        );
    }
  }, [filter, proposals]);

  const counts = React.useMemo(() => {
    return {
      all: proposals.length,
      open: proposals.filter((p) => p.status === "voting_open" && !isExpired(p.votingEndsAt)).length,
      executed: proposals.filter((p) => p.status === "executed").length,
      expired: proposals.filter((p) => p.status !== "executed" && isExpired(p.votingEndsAt)).length,
    } as Record<FilterKey, number>;
  }, [proposals]);

  // Lookup for the voting modal — the user's voting power in the proposal's enterprise.
  const votingEnterprise = votingProposal
    ? enterprises.find((e) => e.id === votingProposal.enterpriseId)
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Header — eyebrow, title, subtitle, new proposal */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold/60" />
              <span className="font-mono text-xs uppercase tracking-[0.28em] text-gold-light/80">
                Constitutional Consensus
              </span>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-gold-gradient sm:text-4xl">
              Governance
            </h1>
            <p className="mt-2 max-w-2xl font-sans text-sm text-muted-foreground">
              1 Equity Unit = 1 vote · quorum 51% · AI risk-scored by{" "}
              <span className="font-mono text-[12px] text-gold-light">Mixtral 8x22B</span>
              {" · "}passed proposals auto-execute on the immutable ledger.
            </p>
          </div>
          <NewProposalDialog enterprises={enterprises} />
        </div>

        {/* Constitutional hash strip */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gold/10 bg-foreground/[0.02] px-3 py-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.4)]" />
            Constitution live
          </span>
          <span className="font-mono text-xs text-muted-foreground/85">
            hash {CONSTITUTIONAL_HASH.slice(0, 18)}…
          </span>
          <span className="ml-auto hidden items-center gap-3 font-mono text-[11px] text-muted-foreground/85 sm:flex">
            <span>{proposals.length} proposals</span>
            <span className="text-gold/40">·</span>
            <span>{counts.open} open</span>
            <span className="text-gold/40">·</span>
            <span>{counts.executed} executed</span>
          </span>
        </div>
      </header>

      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="Filter proposals by status"
        className="flex w-full gap-1 overflow-x-auto rounded-xl border border-gold/10 bg-foreground/[0.02] p-1"
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.key)}
              className={cn(
                "relative inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 font-sans text-[12px] font-medium transition-colors sm:text-sm",
                active
                  ? "text-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="gov-filter-pill"
                  className="absolute inset-0 rounded-lg bg-gold-gradient shadow-[0_4px_18px_-6px_rgba(212,175,55,0.6)]"
                  transition={{ type: "spring", damping: 24, stiffness: 280 }}
                />
              )}
              <f.icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{f.tKey ? t(f.tKey) : f.label}</span>
              <span
                className={cn(
                  "relative z-10 ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[11px]",
                  active ? "bg-black/15 text-black" : "bg-foreground/10 text-muted-foreground"
                )}
              >
                {counts[f.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Proposal cards list */}
      <div className="flex flex-col gap-5">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gold/10 bg-foreground/[0.02] py-16 text-center"
            >
              <div className="relative">
                <div className="pointer-events-none absolute inset-0 rounded-full bg-gold/10 blur-xl" />
                <Inbox className="relative h-8 w-8 text-gold/60" />
              </div>
              <p className="font-serif text-base font-semibold text-foreground">
                No proposals in this view
              </p>
              <p className="max-w-sm font-sans text-[12px] text-muted-foreground">
                {filter === "all"
                  ? "Raise the first constitutional proposal for your enterprise."
                  : filter === "open"
                  ? "No active votes. New proposals appear here when cooling completes."
                  : filter === "executed"
                  ? "No proposals have been executed yet. Passed votes auto-execute here."
                  : "No expired proposals. Voting windows close automatically when the clock runs out."}
              </p>
            </motion.div>
          ) : (
            filtered.map((p) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                userVotingPower={
                  enterprises.find((e) => e.id === p.enterpriseId)?.userVotingPower ?? 0
                }
                onCastVote={(prop) => setVotingProposal(prop)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Voting modal — controlled at board level so any card can open it. */}
      <VotingModal
        proposal={votingProposal}
        open={!!votingProposal}
        onOpenChange={(v) => {
          if (!v) setVotingProposal(null);
        }}
        userVotingPower={votingEnterprise?.userVotingPower ?? 0}
        totalVotingPower={votingEnterprise?.totalVotingPower ?? 0}
      />
    </div>
  );
}
