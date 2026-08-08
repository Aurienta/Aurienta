import * as React from "react";
import { Vote, Timer, Users2, Coins, ShieldHalf, Sparkles } from "lucide-react";
import { egp } from "@/lib/aurienta/format";

type LiveProposal = {
  title: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotingPower: number;
  passThreshold: number;
  quorumPct: number;
  votingEndsAt: Date;
};

const PARAMS = [
  { icon: Users2, label: "Proposer threshold", value: "≥ 5% voting power", note: "Any Constitutional Partner above this line may publish" },
  { icon: Coins, label: "Filing fee", value: egp(1000), note: "Refundable on quorum reached" },
  { icon: Timer, label: "Cooling period", value: "30 days", note: "Reversibility window before voting opens" },
  { icon: Vote, label: "Voting window", value: "14 days", note: "On-chain vote cast weighted by Equity Units (1 Unit = 1 vote)" },
  { icon: Users2, label: "Quorum", value: "51%", note: "Of total voting power must cast a ballot" },
  { icon: ShieldHalf, label: "Pass threshold", value: "75% supermajority", note: "Non-amendable Article VII rule" },
];

function pct(v: number, total: number) {
  return total > 0 ? (v / total) * 100 : 0;
}

export function VoteParamsCard({ liveProposal }: { liveProposal?: LiveProposal | null }) {
  const forPct = liveProposal ? pct(liveProposal.votesFor, liveProposal.totalVotingPower) : 0;
  const againstPct = liveProposal ? pct(liveProposal.votesAgainst, liveProposal.totalVotingPower) : 0;
  const totalCast = liveProposal
    ? liveProposal.votesFor + liveProposal.votesAgainst + liveProposal.votesAbstain
    : 0;
  const turnout = liveProposal ? pct(totalCast, liveProposal.totalVotingPower) : 0;
  const meetsQuorum = turnout >= (liveProposal?.quorumPct ?? 51);
  const meetsPass = forPct >= (liveProposal?.passThreshold ?? 75);

  return (
    <section
      aria-label="Graduation vote parameters"
      className="rounded-2xl border border-gold/12 glass p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Vote className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">Graduation vote parameters</h2>
        </div>
        <span className="rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold/70">
          Article VII · non-amendable
        </span>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {PARAMS.map((p) => (
          <li
            key={p.label}
            className="rounded-xl border border-gold/10 bg-background/40 p-3.5 transition-colors hover:border-gold/25"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gold/15 bg-gold/5">
                <p.icon className="h-3.5 w-3.5 text-gold" />
              </span>
              <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">{p.label}</p>
            </div>
            <p className="mt-2 font-serif text-base font-semibold text-gold-light">{p.value}</p>
            <p className="mt-0.5 font-sans text-xs leading-relaxed text-muted-foreground/80">{p.note}</p>
          </li>
        ))}
      </ul>

      {liveProposal && (
        <div className="mt-5 rounded-xl border border-gold/20 bg-gold/[0.04] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <p className="font-serif text-sm font-semibold text-foreground">Live graduation proposal</p>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
              ends {liveProposal.votingEndsAt.toLocaleDateString()} · supermajority {liveProposal.passThreshold}%
            </span>
          </div>
          <p className="mt-1 font-sans text-[11px] text-muted-foreground">{liveProposal.title}</p>

          {/* tally bars */}
          <div className="mt-3 space-y-2">
            <TallyBar label="For" valuePct={forPct} color="linear-gradient(90deg,#34d399,#10b981)" threshold={liveProposal.passThreshold} />
            <TallyBar label="Against" valuePct={againstPct} color="linear-gradient(90deg,#f87171,#e0584b)" />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="Turnout" value={`${turnout.toFixed(1)}%`} ok={meetsQuorum} sub={`quorum ${liveProposal.quorumPct}%`} />
            <Stat label="For (voting power)" value={liveProposal.votesFor.toLocaleString()} ok={meetsPass} sub={`${forPct.toFixed(1)}% of power`} />
            <Stat label="Total power" value={liveProposal.totalVotingPower.toLocaleString()} sub="Equity Units outstanding" />
          </div>
        </div>
      )}
    </section>
  );
}

function TallyBar({
  label,
  valuePct,
  color,
  threshold,
}: {
  label: string;
  valuePct: number;
  color: string;
  threshold?: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-sans text-[11px] text-muted-foreground">{label}</span>
        <span className="font-mono text-xs text-foreground/80">{valuePct.toFixed(1)}%</span>
      </div>
      <div className="relative mt-1 h-2 overflow-hidden rounded-full bg-gold/10">
        <div className="h-full rounded-full" style={{ width: `${Math.min(valuePct, 100)}%`, background: color }} />
        {typeof threshold === "number" && (
          <span
            aria-hidden
            className="absolute top-0 bottom-0 w-px bg-foreground/60"
            style={{ left: `${threshold}%` }}
            title={`pass threshold ${threshold}%`}
          />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, ok }: { label: string; value: string; sub: string; ok?: boolean }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-background/40 p-2.5">
      <p className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-serif text-sm font-semibold ${ok === undefined ? "text-foreground" : ok ? "text-emerald-300" : "text-amber-300"}`}>
        {value}
      </p>
      <p className="font-mono text-[11px] text-muted-foreground/85">{sub}</p>
    </div>
  );
}
