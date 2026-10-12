import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { computeVoiceCredits } from "@/lib/aurienta/quadratic-voting";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { QuadraticVotingClient } from "@/components/dashboard/roadmap/quadratic-voting-client";
import { Vote } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quadratic Voting · AURIENTA",
  description:
    "Voice credits proportional to STS. Quadratic cost curve. Credits are governance units, NOT currency.",
};

export default async function QuadraticVotingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/quadratic-voting");

  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);

  // Fetch active proposals across the user's enterprises.
  // "Active" = voting_open or quorum_reached (still accepting votes).
  const proposals = enterpriseIds.length
    ? await db.proposal.findMany({
        where: {
          enterpriseId: { in: enterpriseIds },
          status: { in: ["voting_open", "quorum_reached", "published"] },
        },
        include: {
          enterprise: { select: { id: true, name: true, slug: true, tier: true } },
        },
        orderBy: { votingEndsAt: "asc" },
        take: 50,
      })
    : [];

  // Fetch the user's allocations for those proposals in a single round-trip.
  const proposalIds = proposals.map((p) => p.id);
  const allocations = proposalIds.length
    ? await db.quadraticVoteAllocation.findMany({
        where: { proposalId: { in: proposalIds }, voterId: user.id },
      })
    : [];
  const allocationByProposal = new Map(allocations.map((a) => [a.proposalId, a]));

  // Aggregate results per proposal (sum of voteWeight + voter count).
  const allAllocations = proposalIds.length
    ? await db.quadraticVoteAllocation.findMany({
        where: { proposalId: { in: proposalIds } },
        select: {
          proposalId: true,
          voteWeight: true,
          creditsSpent: true,
          voterId: true,
        },
      })
    : [];
  const resultsByProposal = new Map<
    string,
    { totalWeight: number; voterCount: number }
  >();
  for (const a of allAllocations) {
    const cur = resultsByProposal.get(a.proposalId) ?? {
      totalWeight: 0,
      voterCount: 0,
    };
    cur.totalWeight += a.voteWeight;
    cur.voterCount += 1;
    resultsByProposal.set(a.proposalId, cur);
  }

  const voiceCreditsAvailable = computeVoiceCredits(user.sovereignTrustScore);

  const serializedProposals = proposals.map((p) => {
    const alloc = allocationByProposal.get(p.id);
    const result = resultsByProposal.get(p.id) ?? { totalWeight: 0, voterCount: 0 };
    return {
      id: p.id,
      title: p.title,
      type: p.type,
      status: p.status,
      votingEndsAt: p.votingEndsAt.toISOString(),
      enterprise: {
        id: p.enterprise.id,
        name: p.enterprise.name,
        slug: p.enterprise.slug,
        tier: p.enterprise.tier,
      },
      myAllocation: alloc
        ? {
            voiceCredits: alloc.voiceCredits,
            creditsSpent: alloc.creditsSpent,
            voteWeight: alloc.voteWeight,
            remainingCredits: alloc.voiceCredits - alloc.creditsSpent,
          }
        : null,
      results: {
        totalWeight: Math.round(result.totalWeight * 1000) / 1000,
        voterCount: result.voterCount,
      },
    };
  });

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Quadratic Voting"
        icon={Vote}
        title="Voice that scales with reputation, not wealth"
        subtitle="Voice credits proportional to Sovereign Trust Score (STS). Quadratic cost curve: 4 credits = 2x influence, 9 = 3x, 16 = 4x. This favors broad consensus over concentrated preference intensity."
      />

      <QuadraticVotingClient
        userId={user.id}
        sovereignTrustScore={user.sovereignTrustScore}
        voiceCreditsAvailable={voiceCreditsAvailable}
        proposals={serializedProposals}
      />
    </div>
  );
}
