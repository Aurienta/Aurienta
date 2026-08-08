import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { GovernanceBoard } from "@/components/dashboard/governance/governance-board";
import { ConstitutionalCouncil } from "@/components/dashboard/governance/constitutional-council";
import type {
  ProposalForUi,
  EnterpriseForUi,
  CouncilMemberForUi,
  Choice,
} from "@/components/dashboard/governance/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Governance · AURIENTA",
  description:
    "Constitutional consensus hub — proposals, AI risk assessment, and one-vote-per-Equity-Unit governance.",
};

export default async function GovernancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/governance");

  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);

  // Pull all proposals across the user's enterprises, newest first.
  const proposals = await db.proposal.findMany({
    where: { enterpriseId: { in: enterpriseIds } },
    include: {
      enterprise: { select: { id: true, name: true, tier: true, slug: true, sector: true } },
      votes: {
        where: { userId: user.id },
        select: { id: true, choice: true, votingPower: true, reason: true },
      },
    },
    orderBy: [{ status: "asc" }, { votingEndsAt: "asc" }],
  });

  // Build the enterprises-for-UI list with the user's voting power.
  const enterprises: EnterpriseForUi[] = user.memberships.map((m) => {
    const holding = user.ownershipRecords.find((s) => s.enterpriseId === m.enterpriseId);
    return {
      id: m.enterprise.id,
      name: m.enterprise.name,
      tier: m.enterprise.tier,
      slug: m.enterprise.slug,
      userVotingPower: holding?.equityUnits ?? 0,
      totalVotingPower: 0, // filled below
    };
  });
  // Populate totalVotingPower + stage (used to pick the primary enterprise) from one query.
  const entRows = await db.enterprise.findMany({
    where: { id: { in: enterpriseIds } },
    select: { id: true, totalEquityUnits: true, stage: true },
  });
  const stageById = new Map(entRows.map((r) => [r.id, r.stage]));
  for (const e of enterprises) {
    e.totalVotingPower = entRows.find((r) => r.id === e.id)?.totalEquityUnits ?? 0;
  }

  // Serialize proposals to plain shapes for the client component.
  const proposalsForUi: ProposalForUi[] = proposals.map((p) => ({
    id: p.id,
    enterpriseId: p.enterpriseId,
    title: p.title,
    description: p.description,
    type: p.type,
    status: p.status,
    feeEgp: p.feeEgp,
    coolingEndsAt: p.coolingEndsAt ? p.coolingEndsAt.toISOString() : null,
    votingEndsAt: p.votingEndsAt.toISOString(),
    quorumPct: p.quorumPct,
    passThreshold: p.passThreshold,
    votesFor: p.votesFor,
    votesAgainst: p.votesAgainst,
    votesAbstain: p.votesAbstain,
    totalVotingPower: p.totalVotingPower,
    aiRiskScore: p.aiRiskScore,
    aiRecommendation: p.aiRecommendation,
    aiConfidence: p.aiConfidence,
    executedAt: p.executedAt ? p.executedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    enterprise: {
      id: p.enterprise.id,
      name: p.enterprise.name,
      tier: p.enterprise.tier,
      slug: p.enterprise.slug,
      sector: p.enterprise.sector,
    },
    userVote: p.votes[0]
      ? {
          choice: p.votes[0].choice as Choice,
          votingPower: p.votes[0].votingPower,
          reason: p.votes[0].reason,
        }
      : null,
  }));

  // Pick the user's primary enterprise — prefer the one where they hold the most
  // shares among non-graduated enterprises; fall back to most shares overall,
  // then to the first membership.
  const primaryEnterprise =
    enterprises
      .slice()
      .sort((a, b) => {
        const aGrad = stageById.get(a.id) === "graduated";
        const bGrad = stageById.get(b.id) === "graduated";
        if (aGrad !== bGrad) return aGrad ? 1 : -1;
        return b.userVotingPower - a.userVotingPower;
      })[0] ?? enterprises[0];

  // Board members of the primary enterprise.
  let councilMembers: CouncilMemberForUi[] = [];
  if (primaryEnterprise) {
    const seats = await db.enterpriseMember.findMany({
      where: { enterpriseId: primaryEnterprise.id, boardSeat: true },
      include: {
        user: {
          select: {
            id: true,
            legalName: true,
            avatarColor: true,
            sovereignTrustScore: true,
            tier: true,
            primaryIntent: true,
          },
        },
        enterprise: { select: { name: true, tier: true } },
      },
      orderBy: [{ joinedAt: "asc" }],
    });
    councilMembers = seats.map((s) => ({
      id: s.user.id,
      legalName: s.user.legalName,
      role: s.role,
      avatarColor: s.user.avatarColor,
      sovereignTrustScore: s.user.sovereignTrustScore,
      tier: s.user.tier,
      primaryIntent: s.user.primaryIntent,
      enterpriseName: s.enterprise.name,
      enterpriseTier: s.enterprise.tier,
    }));
  }

  return (
    <div className="relative">
      {/* Mount sonner toasts (the radix toaster in the root layout is separate). */}
      <SonnerToaster
        position="top-center"
        toastOptions={{
          style: {
            border: "1px solid rgba(212,175,55,0.25)",
            background: "rgba(16,16,18,0.95)",
            color: "#f3eedd",
          },
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] xl:gap-8">
        <section aria-label="Proposals" className="min-w-0">
          <GovernanceBoard proposals={proposalsForUi} enterprises={enterprises} />
        </section>

        <div className="lg:sticky lg:top-20 lg:self-start">
          {primaryEnterprise ? (
            <ConstitutionalCouncil
              members={councilMembers}
              enterpriseName={primaryEnterprise.name}
              enterpriseTier={primaryEnterprise.tier}
            />
          ) : (
            <aside className="rounded-2xl glass-gold p-5">
              <p className="font-sans text-sm text-muted-foreground">
                Join an enterprise to see its constitutional council.
              </p>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
