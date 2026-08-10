export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { computeGraduationReadiness } from "@/lib/aurienta/cre";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { shortHash, egp } from "@/lib/aurienta/format";
import { Toaster } from "@/components/ui/sonner";

import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { MaturityStepper } from "@/components/dashboard/institutional/maturity-stepper";
import { ReadinessHero } from "@/components/dashboard/institutional/readiness-hero";
import { VoteParamsCard } from "@/components/dashboard/institutional/vote-params-card";
import { PostGraduationCard } from "@/components/dashboard/institutional/post-graduation-card";
import { ExportPackageCard } from "@/components/dashboard/institutional/export-package-card";
import { CallVoteButton } from "@/components/dashboard/institutional/call-vote-button";
import { GraduationCap } from "lucide-react";

export const metadata = { title: "Graduation · AURIENTA" };

export default async function GraduationPage() {
  const user = (await getCurrentUser())!;

  // Pull user's enterprises and pick the primary — the one with the highest
  // readiness score (e.g. Nile Brew for the seeded demo user).
  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);
  const enterprises = enterpriseIds.length
    ? await db.enterprise.findMany({ where: { id: { in: enterpriseIds } } })
    : [];

  const primary = enterprises
    .slice()
    .sort((a, b) => b.graduationReadiness - a.graduationReadiness)[0];

  // Compute readiness + look up any open graduation proposal
  const readiness = primary ? await computeGraduationReadiness(primary.id) : { score: 0, gates: [] as { label: string; passed: boolean }[] };
  const openProposal = primary
    ? await db.proposal.findFirst({
        where: { enterpriseId: primary.id, type: "graduation", status: "voting_open" },
      })
    : null;

  // Component breakdown — weights from the blueprint (governance 30 / financial 25
  // / operational 20 / compliance 15 / platform-dependency 10).
  const componentScores = primary
    ? [
        { label: "Governance", weightPct: 30, score: Math.min(100, primary.healthScore + 4), tone: "green" },
        { label: "Financial", weightPct: 25, score: Math.min(100, Math.round((primary.lawFirmClientAccountBalanceEgp / Math.max(1, primary.monthlyBurnEgp * 12)) * 100)), tone: "green" },
        { label: "Operational", weightPct: 20, score: Math.min(100, primary.healthScore - 4), tone: "green" },
        { label: "Compliance", weightPct: 15, score: Math.round(primary.nosiCompliantPct), tone: "green" },
        { label: "Platform dependency", weightPct: 10, score: primary.stage === "stage_3" ? 90 : primary.stage === "stage_4" ? 100 : 60, tone: "amber" },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <Toaster position="top-right" richColors closeButton />

      <PageHeader
        eyebrow="Graduation & Sovereignty"
        icon={GraduationCap}
        title="Dependency is transitional. Sovereignty is the destination."
        subtitle="When an enterprise reaches Stage 3 Institutional Independence and a readiness score of 90+, its Constitutional Partners may call the 75% supermajority graduation vote. On passage: all platform fees cease, the AURIENTA board seat resigns, and a signed Sovereign Export Package lets the enterprise self-host the CRE in 4–8 hours."
      />

      {!primary ? (
        <div className="rounded-2xl border border-gold/12 glass p-10 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-gold/40" />
          <p className="mt-4 font-serif text-lg font-semibold">No enterprises to graduate yet</p>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Found or join an enterprise to begin the path to sovereignty.
          </p>
        </div>
      ) : (
        <>
          {/* Hero: stage stepper + readiness */}
          <MaturityStepper currentStage={primary.stage} />

          <ReadinessHero
            score={readiness.score}
            gates={readiness.gates}
            components={componentScores}
            enterpriseName={primary.name}
            stage={primary.stage}
          />

          {/* CTA banner */}
          <section className="relative overflow-hidden rounded-2xl border border-gold/20 glass-gold p-5 sm:p-6">
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-gold-light/85">
                  {primary.name} · Tier {primary.tier} · {primary.stage.replace("_", " ")}
                </p>
                <h3 className="mt-1.5 font-serif text-xl font-semibold">
                  {readiness.score >= 90
                    ? "Ready to call the graduation vote."
                    : readiness.score >= 75
                    ? "Approaching graduation eligibility."
                    : "Foundational work required before graduation."}
                </h3>
                <p className="mt-1 font-sans text-[12px] text-muted-foreground">
                  Readiness {readiness.score}/100 · escrow {egp(primary.lawFirmClientAccountBalanceEgp, { compact: primary.lawFirmClientAccountBalanceEgp > 1_000_000 })} ·
                  {" "}{primary.employeeCount} workforce partners · health {primary.healthRating ?? "—"} ({primary.healthScore})
                </p>
              </div>
              <CallVoteButton
                readinessScore={readiness.score}
                enterpriseName={primary.name}
                enterpriseId={primary.id}
                hasOpenProposal={!!openProposal}
                className="lg:w-80"
              />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <VoteParamsCard
              liveProposal={
                openProposal
                  ? {
                      title: openProposal.title,
                      votesFor: openProposal.votesFor,
                      votesAgainst: openProposal.votesAgainst,
                      votesAbstain: openProposal.votesAbstain,
                      totalVotingPower: openProposal.totalVotingPower,
                      passThreshold: openProposal.passThreshold,
                      quorumPct: openProposal.quorumPct,
                      votingEndsAt: openProposal.votingEndsAt,
                    }
                  : null
              }
            />
            <PostGraduationCard />
          </div>

          <ExportPackageCard exportHash={CONSTITUTIONAL_HASH} />
        </>
      )}

      <p className="mt-2 text-center font-mono text-[11px] leading-relaxed text-muted-foreground/80">
        Constitutional anchor {shortHash(CONSTITUTIONAL_HASH, 14, 6)} · graduation is irreversible once executed.
      </p>
    </div>
  );
}
