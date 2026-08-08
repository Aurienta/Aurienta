"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  Gavel,
  ChevronDown,
  ShieldCheck,
  Vote as VoteIcon,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { egp, pct, timeRemaining } from "@/lib/aurienta/format";
import { PROPOSAL_TYPES } from "@/lib/aurienta/constants";
import { AiRiskBadge } from "./ai-risk-badge";
import { VoteTallyBar } from "./vote-tally-bar";
import {
  statusMeta,
  isExpired,
  type ProposalForUi,
  type Choice,
} from "./types";

type Props = {
  proposal: ProposalForUi;
  userVotingPower: number; // Equity Units the user holds in this enterprise
  onCastVote: (proposal: ProposalForUi) => void;
};

const SECTOR_LABEL: Record<string, string> = {
  food: "Food & Beverage",
  manufacturing: "Manufacturing",
  tourism: "Tourism & Hospitality",
  technology: "Technology",
  retail: "Retail",
  logistics: "Logistics",
  agriculture: "Agriculture",
};

export function ProposalCard({ proposal, userVotingPower, onCastVote }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const meta = PROPOSAL_TYPES[proposal.type];
  const status = statusMeta(proposal.status);
  const expired = isExpired(proposal.votingEndsAt) && proposal.status !== "executed";
  const totalCast = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  const turnoutPct =
    proposal.totalVotingPower > 0
      ? (totalCast / proposal.totalVotingPower) * 100
      : 0;
  const quorumPct = proposal.quorumPct;
  const quorumReached = turnoutPct >= quorumPct;
  const forPctOfCast = totalCast > 0 ? (proposal.votesFor / totalCast) * 100 : 0;
  const needsSuper = proposal.passThreshold > 50;
  const superMajorityMet = forPctOfCast >= proposal.passThreshold;

  const userVote = proposal.userVote;
  const canVote =
    proposal.status === "voting_open" &&
    !expired &&
    !userVote &&
    userVotingPower > 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl glass-gold p-5 sm:p-6",
        status.pulse && "ring-1 ring-gold/15"
      )}
    >
      {/* Status ribbon */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${status.color}, transparent)` }}
        aria-hidden
      />

      {/* Header row */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-gold/25 bg-gold/[0.06] font-mono text-xs text-gold-light"
            >
              {meta?.label ?? proposal.type}
            </Badge>
            <Badge
              variant="outline"
              className="border-foreground/15 bg-foreground/[0.03] text-xs text-muted-foreground"
            >
              Tier {proposal.enterprise.tier}
            </Badge>
            {SECTOR_LABEL[proposal.enterprise.sector] && (
              <span className="font-sans text-xs text-muted-foreground/80">
                · {SECTOR_LABEL[proposal.enterprise.sector]}
              </span>
            )}
          </div>
          <h3 className="mt-2 font-serif text-lg font-semibold leading-snug text-foreground sm:text-xl">
            {proposal.title}
          </h3>
          <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
            <span className="text-gold-light/80">{proposal.enterprise.name}</span>
            {" · "}
            <span>created {timeAgoLabel(proposal.createdAt)}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-medium",
              status.pulse && "animate-pulse"
            )}
            style={{
              background: status.bg,
              color: status.color,
              border: `1px solid ${status.border}`,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.color }} />
            {status.label}
          </span>
          {expired && proposal.status !== "executed" && (
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
              window ended
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mt-4">
        <p
          className={cn(
            "font-sans text-sm leading-relaxed text-muted-foreground",
            !expanded && "line-clamp-3"
          )}
        >
          {proposal.description}
        </p>
        {proposal.description.length > 180 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 inline-flex items-center gap-1 font-sans text-[11px] text-gold/80 transition-colors hover:text-gold"
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : "Read more"}
            <ChevronDown
              className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")}
            />
          </button>
        )}
      </div>

      {/* AI risk block */}
      <div className="mt-4">
        <AiRiskBadge
          score={proposal.aiRiskScore}
          recommendation={proposal.aiRecommendation}
          confidence={proposal.aiConfidence}
        />
      </div>

      {/* Voting progress */}
      <div className="mt-4">
        <VoteTallyBar
          votesFor={proposal.votesFor}
          votesAgainst={proposal.votesAgainst}
          votesAbstain={proposal.votesAbstain}
          totalVotingPower={proposal.totalVotingPower}
          userChoice={userVote?.choice}
        />
      </div>

      {/* Quorum + threshold row */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gold/10 bg-foreground/[0.02] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-gold/70" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Quorum {quorumPct}%
              </span>
            </div>
            <span
              className={cn(
                "font-mono text-xs",
                quorumReached ? "text-emerald-400" : "text-gold-light"
              )}
            >
              {quorumReached ? "reached" : "pending"}
            </span>
          </div>
          <p className="mt-1.5 font-serif text-sm font-semibold tabular-nums">
            {egp(totalCast, { compact: true })}{" "}
            <span className="font-sans text-[11px] font-normal text-muted-foreground">
              / {egp(proposal.totalVotingPower, { compact: true })}
            </span>
          </p>
          <Progress
            value={turnoutPct}
            className="mt-2 h-1.5 bg-foreground/10"
          />
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            Turnout {pct(turnoutPct)}
          </p>
        </div>

        <div className="rounded-lg border border-gold/10 bg-foreground/[0.02] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Gavel className="h-3 w-3 text-gold/70" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Pass {proposal.passThreshold}%
              </span>
            </div>
            <span
              className={cn(
                "font-mono text-xs",
                superMajorityMet ? "text-emerald-400" : "text-muted-foreground"
              )}
            >
              {forPctOfCast.toFixed(1)}% for
            </span>
          </div>
          <p className="mt-1.5 font-serif text-sm font-semibold">
            {needsSuper ? "Supermajority required" : "Simple majority"}
          </p>
          <Progress
            value={forPctOfCast}
            className="mt-2 h-1.5 bg-foreground/10"
          />
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            of cast votes · needs {proposal.passThreshold}%
          </p>
        </div>
      </div>

      {/* Footer — time remaining + vote CTA */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gold/8 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gold/70" />
            <span className="font-mono text-[11px] text-muted-foreground">
              {proposal.status === "executed"
                ? `executed ${timeAgoLabel(proposal.executedAt ?? proposal.createdAt)}`
                : expired
                ? "window ended"
                : `${timeRemaining(new Date(proposal.votingEndsAt))} left`}
            </span>
          </div>
          {proposal.coolingEndsAt && new Date(proposal.coolingEndsAt).getTime() > Date.now() && (
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-gold/50" />
              <span className="font-mono text-[11px] text-muted-foreground/80">
                cooling {timeRemaining(new Date(proposal.coolingEndsAt))}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {userVote ? (
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
              style={{
                borderColor: choiceColor(userVote.choice).border,
                background: choiceColor(userVote.choice).bg,
              }}
            >
              <CheckCircle2
                className="h-3.5 w-3.5"
                style={{ color: choiceColor(userVote.choice).text }}
              />
              <span className="font-sans text-[11px] text-muted-foreground">You voted</span>
              <span
                className="font-serif text-sm font-semibold"
                style={{ color: choiceColor(userVote.choice).text }}
              >
                {labelForChoice(userVote.choice)}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                · {egp(userVote.votingPower, { compact: true })}
              </span>
            </div>
          ) : proposal.status === "executed" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-1.5 font-mono text-[11px] text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Passed & executed
            </span>
          ) : canVote ? (
            <Button
              size="sm"
              onClick={() => onCastVote(proposal)}
              className="h-9 gap-1.5 rounded-full bg-gold-gradient px-4 text-black hover:opacity-95"
            >
              <VoteIcon className="h-3.5 w-3.5" />
              Cast vote
              <span className="ml-1 rounded-full bg-black/15 px-1.5 py-0.5 font-mono text-[11px]">
                {egp(userVotingPower, { compact: true })}
              </span>
            </Button>
          ) : expired ? (
            <span className="font-mono text-xs text-muted-foreground/85">
              window ended
            </span>
          ) : userVotingPower <= 0 ? (
            <span className="font-mono text-xs text-muted-foreground/85">
              no voting power
            </span>
          ) : (
            <span className="font-mono text-xs text-muted-foreground/85">
              —
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function labelForChoice(c: Choice): string {
  return c === "for" ? "For" : c === "against" ? "Against" : "Abstain";
}

function choiceColor(c: Choice): { text: string; bg: string; border: string } {
  if (c === "for")
    return {
      text: "#f4d676",
      bg: "rgba(244,214,118,0.10)",
      border: "rgba(244,214,118,0.35)",
    };
  if (c === "against")
    return {
      text: "#f87171",
      bg: "rgba(248,113,113,0.10)",
      border: "rgba(248,113,113,0.35)",
    };
  return {
    text: "#9ca3af",
    bg: "rgba(156,163,175,0.10)",
    border: "rgba(156,163,175,0.3)",
  };
}

function timeAgoLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
