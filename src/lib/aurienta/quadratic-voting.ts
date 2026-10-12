// AURIENTA — Quadratic Voting (Phase 3, ROADMAP-09)
//
// Voice credits proportional to Sovereign Trust Score (STS); cost curve is
// quadratic: voteWeight = sqrt(totalCreditsSpent). 4 credits = 2x influence,
// 9 credits = 3x, 16 credits = 4x. This favors broad consensus over concentrated
// preference intensity, preventing a single wealthy actor from dominating
// governance.
//
// Constitutional compliance:
// - Voice credits are governance units, NOT currency. No financial value.
// - STS is reputation, not capital — keeps governance aligned with contribution,
//   not with wealth.
// - All casts run through enforceQuadraticVote() (CRE policy) inside a
//   db.$transaction, and every state change appends a tamper-evident ledger
//   event. No transfer of funds occurs.

import { db } from "@/lib/db";
import type { PrismaTransaction } from "@/lib/db";
import type { QuadraticVoteAllocation } from "@prisma/client";
import {
  appendLedgerEvent,
  enforceQuadraticVote,
  type CreVerdict,
} from "@/lib/aurienta/cre";

// ── Public constants (mirrors enforceQuadraticVote policy) ──
export const VOICE_CREDIT_DIVISOR = 5; // floor(STS / 5)
export const VOICE_CREDIT_CAP = 20; // capped at 20

// ── Type: results aggregation ──
export type ProposalResults = {
  proposalId: string;
  totalWeight: number;
  voterCount: number;
  allocations: Array<{
    id: string;
    voterId: string;
    voiceCredits: number;
    creditsSpent: number;
    voteWeight: number;
    createdAt: Date;
  }>;
};

// ── Compute voice credits from STS ──
// Voice credits = floor(STS / 5), capped at 20.
export function computeVoiceCredits(sovereignTrustScore: number): number {
  const sts = Math.max(0, Math.floor(sovereignTrustScore));
  return Math.min(VOICE_CREDIT_CAP, Math.floor(sts / VOICE_CREDIT_DIVISOR));
}

// ── Allocate (or refresh) credits for a voter on a proposal ──
// Upserter: if the allocation row already exists, it is left as-is (we don't
// retroactively mutate spent budgets — only the available cap refreshes when
// the user's STS changes). If a brand-new row, set creditsSpent=0 + voteWeight=0.
export async function allocateCredits(
  userId: string,
  proposalId: string
): Promise<QuadraticVoteAllocation> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { sovereignTrustScore: true },
  });
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const voiceCredits = computeVoiceCredits(user.sovereignTrustScore);

  return db.quadraticVoteAllocation.upsert({
    where: { proposalId_voterId: { proposalId, voterId: userId } },
    create: {
      proposalId,
      voterId: userId,
      voiceCredits,
      creditsSpent: 0,
      voteWeight: 0,
    },
    update: {
      // Only refresh the available cap; do not touch spent/weight (those are
      // the user's committed votes on this proposal).
      voiceCredits,
    },
  });
}

// ── Cast a vote (add creditsSpent) ──
// Returns the updated allocation + the CRE verdict.
export async function castVote(
  userId: string,
  proposalId: string,
  creditsSpent: number
): Promise<{ allocation: QuadraticVoteAllocation; verdict: CreVerdict }> {
  // Refresh / create the allocation first (cheap upsert; if it already exists
  // this is a no-op on spent fields).
  const existing = await allocateCredits(userId, proposalId);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { sovereignTrustScore: true },
  });
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Run the CRE policy: validates that voiceCredits matches floor(STS/5) cap,
  // totalSpent <= available, creditsSpent >= 0.
  const verdict = enforceQuadraticVote({
    voterSts: user.sovereignTrustScore,
    voiceCreditsAvailable: existing.voiceCredits,
    creditsSpent,
    alreadySpent: existing.creditsSpent,
  });

  if (!verdict.allowed) {
    // Audit + ledger entry for the denial (no state change).
    await db.$transaction(async (tx) => {
      await appendLedgerEvent(tx, {
        enterpriseId: undefined, // governance-level event
        eventType: "quadratic_vote_denied",
        payload: {
          proposalId,
          voterId: userId,
          creditsSpent,
          alreadySpent: existing.creditsSpent,
          voiceCreditsAvailable: existing.voiceCredits,
          reason: verdict.reason ?? "denied",
          policy: verdict.policy,
        },
        actorId: userId,
      });
    });
    return { allocation: existing, verdict };
  }

  // ── Apply the vote atomically: re-read inside the transaction ──
  const allocation = await db.$transaction(async (tx) => {
    const fresh = await tx.quadraticVoteAllocation.findUnique({
      where: { proposalId_voterId: { proposalId, voterId: userId } },
    });
    if (!fresh) {
      // Race: allocation was deleted between the upsert above and now.
      // Recreate inside the transaction.
      const recreated = await tx.quadraticVoteAllocation.create({
        data: {
          proposalId,
          voterId: userId,
          voiceCredits: existing.voiceCredits,
          creditsSpent: 0,
          voteWeight: 0,
        },
      });
      return applyVote(tx, recreated, creditsSpent, userId, proposalId);
    }

    // Double-check inside the transaction (in case STS changed concurrently).
    const totalSpent = fresh.creditsSpent + creditsSpent;
    if (totalSpent > fresh.voiceCredits) {
      // Should never happen — the CRE policy already guarded — but be paranoid.
      throw new Error("Quadratic vote would exceed available voice credits");
    }

    return applyVote(tx, fresh, creditsSpent, userId, proposalId);
  });

  return { allocation, verdict };
}

// ── Inner transaction helper: apply the increment + ledger event ──
async function applyVote(
  tx: PrismaTransaction,
  current: QuadraticVoteAllocation,
  increment: number,
  userId: string,
  proposalId: string
): Promise<QuadraticVoteAllocation> {
  const totalCreditsSpent = current.creditsSpent + increment;
  // Quadratic cost: voteWeight = sqrt(totalCreditsSpent).
  // 4 credits => 2.0, 9 => 3.0, 16 => 4.0.
  const voteWeight = Math.sqrt(totalCreditsSpent);

  const updated = await tx.quadraticVoteAllocation.update({
    where: { id: current.id },
    data: {
      creditsSpent: totalCreditsSpent,
      voteWeight: Math.round(voteWeight * 1000) / 1000, // 3-decimal precision
    },
  });

  // Ledger event — every vote cast is part of the immutable hash chain.
  // We use enterpriseId: undefined because quadratic voting is a governance-
  // level concern; the proposalId carries the binding context.
  await appendLedgerEvent(tx, {
    enterpriseId: undefined,
    eventType: "quadratic_vote_cast",
    payload: {
      proposalId,
      voterId: userId,
      creditsAdded: increment,
      totalCreditsSpent,
      voteWeight: updated.voteWeight,
      voiceCreditsAvailable: updated.voiceCredits,
      remainingCredits: updated.voiceCredits - totalCreditsSpent,
    },
    actorId: userId,
  });

  return updated;
}

// ── Read: get a user's allocation on a proposal ──
export async function getAllocation(
  userId: string,
  proposalId: string
): Promise<QuadraticVoteAllocation | null> {
  return db.quadraticVoteAllocation.findUnique({
    where: { proposalId_voterId: { proposalId, voterId: userId } },
  });
}

// ── Read: aggregate results for a proposal ──
export async function getProposalResults(
  proposalId: string
): Promise<ProposalResults> {
  const allocations = await db.quadraticVoteAllocation.findMany({
    where: { proposalId },
    orderBy: { voteWeight: "desc" },
  });

  const totalWeight = allocations.reduce((s, a) => s + a.voteWeight, 0);

  return {
    proposalId,
    totalWeight: Math.round(totalWeight * 1000) / 1000,
    voterCount: allocations.length,
    allocations: allocations.map((a) => ({
      id: a.id,
      voterId: a.voterId,
      voiceCredits: a.voiceCredits,
      creditsSpent: a.creditsSpent,
      voteWeight: a.voteWeight,
      createdAt: a.createdAt,
    })),
  };
}

// ── Read: all of a user's allocations ──
export async function getUserAllocations(
  userId: string
): Promise<Array<QuadraticVoteAllocation & { proposalTitle: string; proposalStatus: string; enterpriseName: string; enterpriseId: string }>> {
  const allocations = await db.quadraticVoteAllocation.findMany({
    where: { voterId: userId },
    orderBy: { createdAt: "desc" },
  });

  if (allocations.length === 0) return [];

  const proposals = await db.proposal.findMany({
    where: { id: { in: allocations.map((a) => a.proposalId) } },
    include: { enterprise: { select: { id: true, name: true } } },
  });
  type ProposalRow = {
    id: string;
    title: string;
    status: string;
    enterprise: { id: string; name: string };
  };
  const proposalById = new Map<string, ProposalRow>(
    proposals.map((p) => [p.id, p] as const)
  );

  return allocations
    .map((a) => {
      const p = proposalById.get(a.proposalId);
      if (!p) return null;
      return {
        ...a,
        proposalTitle: p.title,
        proposalStatus: p.status,
        enterpriseName: p.enterprise.name,
        enterpriseId: p.enterprise.id,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);
}
