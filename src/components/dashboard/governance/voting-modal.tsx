"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { egp, pct } from "@/lib/aurienta/format";
import { PROPOSAL_TYPES } from "@/lib/aurienta/constants";
import { AiRiskBadge } from "./ai-risk-badge";
import type { Choice, ProposalForUi } from "./types";

type Props = {
  proposal: ProposalForUi | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userVotingPower: number;
  totalVotingPower: number;
};

export function VotingModal({
  proposal,
  open,
  onOpenChange,
  userVotingPower,
  totalVotingPower,
}: Props) {
  const router = useRouter();
  const [choice, setChoice] = React.useState<Choice | "">("");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Reset when the modal closes or the proposal changes.
  React.useEffect(() => {
    if (!open) {
      setChoice("");
      setReason("");
    }
  }, [open]);

  const userSharePct =
    totalVotingPower > 0 ? (userVotingPower / totalVotingPower) * 100 : 0;

  // Projected post-vote tally (live tally preview).
  const projected = React.useMemo(() => {
    if (!proposal) return null;
    const t = {
      for: proposal.votesFor,
      against: proposal.votesAgainst,
      abstain: proposal.votesAbstain,
    };
    if (choice === "for") t.for += userVotingPower;
    if (choice === "against") t.against += userVotingPower;
    if (choice === "abstain") t.abstain += userVotingPower;
    const totalCast = t.for + t.against + t.abstain;
    const turnoutPct =
      proposal.totalVotingPower > 0
        ? (totalCast / proposal.totalVotingPower) * 100
        : 0;
    const quorumMet = turnoutPct >= proposal.quorumPct;
    const forPct = totalCast > 0 ? (t.for / totalCast) * 100 : 0;
    const passProjected = quorumMet && forPct >= proposal.passThreshold;
    return { t, totalCast, turnoutPct, quorumMet, forPct, passProjected };
  }, [proposal, choice, userVotingPower]);

  async function handleSubmit() {
    if (!proposal || !choice) return;
    if (userVotingPower <= 0) {
      toast.error("No voting power", {
        description: "You must hold Equity Units in this enterprise.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice, reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        const description =
          res.status === 409
            ? "You have already cast a vote on this proposal."
            : res.status === 403
            ? "Vote rejected by the Constitutional Runtime Engine."
            : data?.error || "Please try again.";
        toast.error("Vote rejected", { description });
        return;
      }
      if (data.executed) {
        toast.success("Vote recorded — proposal executed", {
          description:
            "Quorum reached and pass threshold met. Ledger event appended.",
        });
      } else {
        toast.success("Vote recorded on immutable ledger", {
          description: "1 Equity Unit = 1 vote · hash-chained and signed.",
        });
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error("Network error", {
        description: "Could not reach the constitutional ledger.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const meta = proposal ? PROPOSAL_TYPES[proposal.type] : null;
  const totalCastNow = proposal
    ? proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 border-gold/20 bg-popover/95 p-0 backdrop-blur-xl sm:max-w-xl">
        <DialogHeader className="space-y-2 border-b border-gold/10 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            {meta && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/[0.06] px-2.5 py-0.5 font-mono text-xs text-gold-light">
                {meta.label}
              </span>
            )}
            {proposal && (
              <span className="font-sans text-[11px] text-muted-foreground">
                {proposal.enterprise.name} · Tier {proposal.enterprise.tier}
              </span>
            )}
          </div>
          <DialogTitle className="font-serif text-xl leading-snug text-foreground">
            {proposal?.title}
          </DialogTitle>
          <DialogDescription className="line-clamp-2 font-sans text-[12px] text-muted-foreground">
            {proposal?.description}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 sm:px-6">
          {/* Voting power */}
          <div className="rounded-xl border border-gold/15 bg-gold/[0.04] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gold" />
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Your voting power
                </span>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {userSharePct.toFixed(2)}% of total
              </span>
            </div>
            <p className="mt-1.5 font-serif text-2xl font-semibold tabular-nums text-gold-gradient">
              {egp(userVotingPower, { compact: false })}
              <span className="ml-2 font-sans text-[11px] font-normal text-muted-foreground">
                Equity Units
              </span>
            </p>
            <p className="mt-1 font-sans text-[11px] text-muted-foreground/80">
              1 Equity Unit = 1 vote · weight {pct(userSharePct, 2)} of{" "}
              {egp(totalVotingPower, { compact: true })}
            </p>
          </div>

          {/* AI risk */}
          {proposal && (
            <div className="mt-4">
              <AiRiskBadge
                score={proposal.aiRiskScore}
                recommendation={proposal.aiRecommendation}
                confidence={proposal.aiConfidence}
              />
            </div>
          )}

          {/* Choice radio */}
          <div className="mt-5">
            <Label className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Cast your vote
            </Label>
            <RadioGroup
              value={choice}
              onValueChange={(v) => setChoice(v as Choice)}
              className="grid gap-2"
            >
              <ChoiceOption
                value="for"
                title="For"
                description="Support the proposal as written."
                icon={<ThumbsUp className="h-4 w-4" />}
                accent="#f4d676"
                bg="rgba(244,214,118,0.08)"
                border="rgba(244,214,118,0.3)"
                selected={choice === "for"}
              />
              <ChoiceOption
                value="against"
                title="Against"
                description="Reject the proposal."
                icon={<ThumbsDown className="h-4 w-4" />}
                accent="#f87171"
                bg="rgba(248,113,113,0.08)"
                border="rgba(248,113,113,0.3)"
                selected={choice === "against"}
              />
              <ChoiceOption
                value="abstain"
                title="Abstain"
                description="Withhold judgement — counts toward quorum only."
                icon={<Minus className="h-4 w-4" />}
                accent="#9ca3af"
                bg="rgba(156,163,175,0.06)"
                border="rgba(156,163,175,0.25)"
                selected={choice === "abstain"}
              />
            </RadioGroup>
          </div>

          {/* Reason (optional) */}
          <div className="mt-4">
            <Label
              htmlFor="vote-reason"
              className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
            >
              Reasoning (optional · published on ledger)
            </Label>
            <Textarea
              id="vote-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain your position for the constitutional record…"
              maxLength={500}
              className="min-h-20 resize-none border-gold/15 bg-foreground/[0.02] font-sans text-sm placeholder:text-muted-foreground/75"
            />
            <p className="mt-1 text-right font-mono text-[11px] text-muted-foreground/80">
              {reason.length}/500
            </p>
          </div>

          {/* Live tally preview */}
          <Separator className="my-4 bg-gold/10" />
          <div aria-live="polite">
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-gold/70" />
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Live tally preview
              </span>
            </div>
            {projected && proposal ? (
              <div className="rounded-lg border border-gold/10 bg-foreground/[0.02] p-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <TallyCell
                    label="For"
                    value={projected.t.for}
                    delta={choice === "for" ? userVotingPower : 0}
                    color="#f4d676"
                  />
                  <TallyCell
                    label="Against"
                    value={projected.t.against}
                    delta={choice === "against" ? userVotingPower : 0}
                    color="#f87171"
                  />
                  <TallyCell
                    label="Abstain"
                    value={projected.t.abstain}
                    delta={choice === "abstain" ? userVotingPower : 0}
                    color="#9ca3af"
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gold/8 pt-3">
                  <div className="text-center">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      Turnout
                    </p>
                    <p
                      className={cn(
                        "font-serif text-sm font-semibold",
                        projected.quorumMet ? "text-emerald-400" : "text-gold-light"
                      )}
                    >
                      {pct(projected.turnoutPct)} · {projected.quorumMet ? "quorum ✓" : `need ${proposal.quorumPct}%`}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      For-share of cast
                    </p>
                    <p
                      className={cn(
                        "font-serif text-sm font-semibold",
                        projected.passProjected ? "text-emerald-400" : "text-foreground"
                      )}
                    >
                      {pct(projected.forPct)} · {projected.passProjected ? "passes ✓" : `need ${proposal.passThreshold}%`}
                    </p>
                  </div>
                </div>
                <AnimatePresence>
                  {choice && projected.passProjected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.08] p-2.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="font-sans text-[11px] text-emerald-300">
                        Your vote is projected to satisfy quorum and pass threshold — proposal will auto-execute.
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <p className="mt-2 text-center font-mono text-[11px] text-muted-foreground/85">
                  Current cast: {egp(totalCastNow, { compact: true })} · this vote adds{" "}
                  {egp(userVotingPower, { compact: true })}
                </p>
              </div>
            ) : null}
          </div>

          {userVotingPower <= 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] p-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <p className="font-sans text-[11px] text-amber-300">
                You hold no Equity Units in this enterprise. Acquire shares to participate in governance.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-gold/10 p-5 sm:px-6">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-lg text-muted-foreground hover:text-foreground"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!choice || submitting || userVotingPower <= 0}
            className="h-10 gap-2 rounded-lg bg-gold-gradient px-5 text-black hover:opacity-95 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Submit vote
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceOption({
  value,
  title,
  description,
  icon,
  accent,
  bg,
  border,
  selected,
}: {
  value: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  bg: string;
  border: string;
  selected: boolean;
}) {
  return (
    <Label
      htmlFor={`vote-${value}`}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
        selected ? "ring-1" : "hover:bg-foreground/[0.02]"
      )}
      style={{
        background: selected ? bg : "rgba(255,255,255,0.01)",
        borderColor: selected ? border : "rgba(212,175,55,0.10)",
        ...(selected ? { boxShadow: `0 0 0 1px ${border}` } : {}),
      }}
    >
      <RadioGroupItem
        id={`vote-${value}`}
        value={value}
        className="border-gold/30 text-gold"
        style={selected ? { borderColor: accent } : undefined}
      />
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ background: bg, color: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="font-serif text-sm font-semibold"
          style={{ color: selected ? accent : "var(--foreground)" }}
        >
          {title}
        </p>
        <p className="font-sans text-[11px] text-muted-foreground">{description}</p>
      </div>
    </Label>
  );
}

function TallyCell({
  label,
  value,
  delta,
  color,
}: {
  label: string;
  value: number;
  delta: number;
  color: string;
}) {
  return (
    <div className="rounded-md border border-gold/8 bg-foreground/[0.02] py-2">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-serif text-base font-semibold tabular-nums" style={{ color }}>
        {egp(value, { compact: true })}
      </p>
      {delta > 0 && (
        <p className="font-mono text-[11px]" style={{ color }}>
          +{egp(delta, { compact: true })}
        </p>
      )}
    </div>
  );
}
