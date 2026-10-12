// GET /api/quadratic-voting — list the current user's vote allocations.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  computeVoiceCredits,
  getUserAllocations,
} from "@/lib/aurienta/quadratic-voting";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const allocations = await getUserAllocations(user.id);
  const voiceCreditsAvailable = computeVoiceCredits(user.sovereignTrustScore);

  await audit({
    actorId: user.id,
    action: "quadratic_voting.allocations_read",
    target: `user:${user.id}`,
    result: "allowed",
    metadata: {
      count: allocations.length,
      voiceCreditsAvailable,
      sovereignTrustScore: user.sovereignTrustScore,
    },
  });

  return NextResponse.json({
    allocations: allocations.map((a) => ({
      id: a.id,
      proposalId: a.proposalId,
      proposalTitle: a.proposalTitle,
      proposalStatus: a.proposalStatus,
      enterpriseId: a.enterpriseId,
      enterpriseName: a.enterpriseName,
      voiceCredits: a.voiceCredits,
      creditsSpent: a.creditsSpent,
      voteWeight: a.voteWeight,
      remainingCredits: a.voiceCredits - a.creditsSpent,
      createdAt: a.createdAt.toISOString(),
    })),
    user: {
      id: user.id,
      sovereignTrustScore: user.sovereignTrustScore,
      voiceCreditsAvailable,
    },
    disclaimer:
      "Voice credits are governance units, NOT currency. No financial value.",
    count: allocations.length,
  });
}, "GET /api/quadratic-voting");
