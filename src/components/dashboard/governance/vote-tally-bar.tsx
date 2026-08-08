"use client";

import { motion } from "framer-motion";
import { egp } from "@/lib/aurienta/format";
import type { Choice } from "./types";

type Props = {
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotingPower: number;
  className?: string;
  // Highlight the user's choice bar (e.g. amber ring).
  userChoice?: Choice;
};

// VoteTallyBar — horizontal stacked bar showing For / Against / Abstain proportions.
// Animated with framer-motion on mount.
export function VoteTallyBar({
  votesFor,
  votesAgainst,
  votesAbstain,
  totalVotingPower,
  className,
  userChoice,
}: Props) {
  const totalCast = votesFor + votesAgainst + votesAbstain;
  const pctOf = (n: number) => (totalCast > 0 ? (n / totalCast) * 100 : 0);
  const pctOfTotal = (n: number) => (totalVotingPower > 0 ? (n / totalVotingPower) * 100 : 0);

  const segments: {
    key: Choice;
    label: string;
    count: number;
    color: string;
    glow: string;
  }[] = [
    {
      key: "for",
      label: "For",
      count: votesFor,
      color: "linear-gradient(90deg, #f4d676, #d4af37)",
      glow: "rgba(244,214,118,0.45)",
    },
    {
      key: "against",
      label: "Against",
      count: votesAgainst,
      color: "linear-gradient(90deg, #f87171, #ef4444)",
      glow: "rgba(248,113,113,0.4)",
    },
    {
      key: "abstain",
      label: "Abstain",
      count: votesAbstain,
      color: "linear-gradient(90deg, rgba(156,163,175,0.6), rgba(156,163,175,0.4))",
      glow: "rgba(156,163,175,0.25)",
    },
  ];

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Vote tally
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {egp(totalCast, { compact: true })} cast ·{" "}
          {pctOfTotal(totalCast).toFixed(1)}% of power
        </span>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full border border-gold/10 bg-foreground/[0.04]">
        <div className="absolute inset-0 flex">
          {segments.map((seg, i) => {
            const w = pctOf(seg.count);
            const isUser = userChoice === seg.key;
            return (
              <motion.div
                key={seg.key}
                initial={{ width: 0 }}
                animate={{ width: `${w}%` }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.12, ease: "easeOut" }}
                className="h-full"
                style={{
                  background: seg.color,
                  boxShadow: isUser ? `inset 0 0 0 1.5px #fff, 0 0 12px 0 ${seg.glow}` : undefined,
                }}
                aria-hidden
              />
            );
          })}
        </div>
        {totalCast === 0 && (
          <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-muted-foreground/80">
            no votes yet
          </div>
        )}
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className="rounded-md border border-gold/8 bg-foreground/[0.02] px-2 py-1.5"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background:
                    seg.key === "for"
                      ? "#d4af37"
                      : seg.key === "against"
                      ? "#f87171"
                      : "#9ca3af",
                }}
              />
              <span className="font-sans text-xs text-muted-foreground">{seg.label}</span>
              {userChoice === seg.key && (
                <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-gold">
                  you
                </span>
              )}
            </div>
            <p className="mt-0.5 font-serif text-sm font-semibold tabular-nums">
              {egp(seg.count, { compact: true })}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {pctOf(seg.count).toFixed(1)}% · {pctOfTotal(seg.count).toFixed(1)}% power
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
