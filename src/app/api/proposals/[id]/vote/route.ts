import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { checkQuorum, appendLedgerEvent } from "@/lib/aurienta/cre";
import { voteSchema, parseBody } from "@/lib/aurienta/validation";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

// POST /api/proposals/[id]/vote — cast a constitutional vote.
// 1 Equity Unit = 1 vote. Vote is immutable (one per user per proposal).
// On quorum + pass threshold, the proposal auto-executes and a ledger event is appended.
//
// RACE FIX (CTO-AUDIT): the previous implementation did a read-modify-write on
// votesFor/votesAgainst/votesAbstain — two concurrent voters could both read
// the same tally and one would clobber the other. This version uses atomic
// `{ increment: votingPower }` inside a db.$transaction, then re-reads the
// proposal AFTER the increment to recompute quorumMet + passed.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // ── Rate limit ──
  const rl = limiters.governance(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  const { id } = await params;

  // ── Validate body ──
  const body = await parseBody(req, voteSchema);
  if (body instanceof NextResponse) return body;
  const { choice, reason } = body;

  const proposal = await db.proposal.findUnique({
    where: { id },
    include: { enterprise: true },
  });
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found", code: "not_found" }, { status: 404 });
  }

  // Membership gate — must belong to the enterprise to vote.
  const isMember = user.memberships.some((m) => m.enterpriseId === proposal.enterpriseId);
  if (!isMember) {
    return NextResponse.json(
      { error: "Not a member of this enterprise", code: "forbidden" },
      { status: 403 }
    );
  }

  if (proposal.status !== "voting_open") {
    return NextResponse.json(
      { error: `Proposal is ${proposal.status.replace("_", " ")} — voting closed`, code: "conflict" },
      { status: 409 }
    );
  }

  // Voting power = Equity Units held in the enterprise.
  const shareholding = await db.ownershipRecord.findUnique({
    where: {
      enterpriseId_userId: {
        enterpriseId: proposal.enterpriseId,
        userId: user.id,
      },
    },
  });
  const votingPower = shareholding?.equityUnits ?? 0;
  if (votingPower <= 0) {
    return NextResponse.json(
      { error: "No voting power — you must hold Equity Units in this enterprise", code: "forbidden" },
      { status: 403 }
    );
  }

  // Idempotency: one vote per user per proposal. Check before entering the
  // transaction to give a fast 409, but the unique constraint on
  // (proposalId, userId) is the source of truth — the transaction also handles it.
  const existing = await db.vote.findUnique({
    where: {
      proposalId_userId: { proposalId: id, userId: user.id },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "Already voted", code: "conflict" }, { status: 409 });
  }

  // ── Atomic vote + tally increment + ledger event inside ONE transaction ──
  // The increment is unconditional and atomic; the tally is re-read after the
  // increment to compute quorum + pass status from the freshest state.
  type VoteSuccess = {
    vote: {
      id: string;
      proposalId: string;
      userId: string;
      choice: string;
      votingPower: number;
      reason: string | null;
    };
    updated: {
      id: string;
      status: string;
      votesFor: number;
      votesAgainst: number;
      votesAbstain: number;
      executedAt: Date | null;
    };
    tally: { for: number; against: number; abstain: number; totalCast: number };
    quorumMet: boolean;
    passPct: number;
    passed: boolean;
  };

  let outcome: VoteSuccess | "already_voted";

  try {
    outcome = await db.$transaction(async (tx) => {
      // Create the vote first. If another concurrent transaction already inserted
      // a vote for this (proposalId, userId), the unique constraint throws
      // P2002 — we surface that as a 409 below.
      const created = await tx.vote.create({
        data: {
          proposalId: id,
          userId: user.id,
          choice,
          votingPower,
          reason: reason ? String(reason).trim().slice(0, 500) : null,
        },
      });

      // Atomic increment of the matching tally column.
      const increment = { increment: votingPower };
      const intermediate = await tx.proposal.update({
        where: { id },
        data: {
          votesFor: choice === "for" ? increment : undefined,
          votesAgainst: choice === "against" ? increment : undefined,
          votesAbstain: choice === "abstain" ? increment : undefined,
        },
      });

      // Recompute quorum + pass threshold from the fresh post-increment tallies.
      const totalCast =
        intermediate.votesFor + intermediate.votesAgainst + intermediate.votesAbstain;
      const qMet = checkQuorum(totalCast, intermediate.totalVotingPower, intermediate.quorumPct);
      const pPct = totalCast > 0 ? (intermediate.votesFor / totalCast) * 100 : 0;
      const pPassed = qMet && pPct >= intermediate.passThreshold;

      const u = await tx.proposal.update({
        where: { id },
        data: {
          status: pPassed ? "executed" : intermediate.status,
          executedAt: pPassed ? new Date() : null,
        },
      });

      await appendLedgerEvent(tx, {
        enterpriseId: proposal.enterpriseId,
        eventType: pPassed ? "proposal_executed" : "vote_cast",
        payload: {
          proposalId: id,
          proposalTitle: proposal.title,
          voterId: user.id,
          choice,
          votingPower,
          tally: {
            for: intermediate.votesFor,
            against: intermediate.votesAgainst,
            abstain: intermediate.votesAbstain,
            totalCast,
          },
          quorumMet: qMet,
          passPct: Math.round(pPct * 100) / 100,
          passThreshold: intermediate.passThreshold,
          executed: pPassed,
        },
        actorId: user.id,
      });

      return {
        vote: {
          id: created.id,
          proposalId: created.proposalId,
          userId: created.userId,
          choice: created.choice,
          votingPower: created.votingPower,
          reason: created.reason,
        },
        updated: {
          id: u.id,
          status: u.status,
          votesFor: u.votesFor,
          votesAgainst: u.votesAgainst,
          votesAbstain: u.votesAbstain,
          executedAt: u.executedAt,
        },
        tally: {
          for: intermediate.votesFor,
          against: intermediate.votesAgainst,
          abstain: intermediate.votesAbstain,
          totalCast,
        },
        quorumMet: qMet,
        passPct: Math.round(pPct * 100) / 100,
        passed: pPassed,
      } satisfies VoteSuccess;
    });
  } catch (e: unknown) {
    // P2002 = unique constraint on (proposalId, userId) — concurrent double-vote.
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      outcome = "already_voted";
    } else {
      throw e;
    }
  }

  if (outcome === "already_voted") {
    return NextResponse.json({ error: "Already voted", code: "conflict" }, { status: 409 });
  }

  const { vote, updated, tally, quorumMet, passPct, passed } = outcome;

  await audit({
    actorId: user.id,
    action: "proposal.vote",
    target: `proposal:${id}`,
    result: "allowed",
    metadata: {
      choice,
      votingPower,
      quorumMet,
      passPct,
      executed: passed,
    },
  });

  return NextResponse.json({
    proposal: { ...proposal, ...updated },
    vote,
    executed: passed,
    tally: { ...tally, quorumMet, passPct },
  });
}
