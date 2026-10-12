// GET  /api/quadratic-voting/[proposalId] — proposal results + caller's allocation
// POST /api/quadratic-voting/[proposalId] — cast a quadratic vote

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  allocateCredits,
  castVote,
  getProposalResults,
} from "@/lib/aurienta/quadratic-voting";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const dynamic = "force-dynamic";

const castVoteSchema = z.object({
  creditsSpent: z.number().int().min(0).max(1000),
});

// ── GET — proposal results + caller's allocation ──
export const GET = withErrorHandler(
  async (
    _req: NextRequest,
    ctx: { params: Promise<{ proposalId: string }> }
  ) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }

    const { proposalId } = await ctx.params;
    if (!proposalId) {
      return NextResponse.json(
        { error: "proposalId is required", code: "invalid_body" },
        { status: 400 }
      );
    }

    const [results, myAllocation] = await Promise.all([
      getProposalResults(proposalId),
      allocateCredits(user.id, proposalId),
    ]);

    await audit({
      actorId: user.id,
      action: "quadratic_voting.results_read",
      target: `proposal:${proposalId}`,
      result: "allowed",
      metadata: {
        totalWeight: results.totalWeight,
        voterCount: results.voterCount,
        myVoteWeight: myAllocation.voteWeight,
      },
    });

    return NextResponse.json({
      results,
      myAllocation: {
        id: myAllocation.id,
        proposalId: myAllocation.proposalId,
        voiceCredits: myAllocation.voiceCredits,
        creditsSpent: myAllocation.creditsSpent,
        voteWeight: myAllocation.voteWeight,
        remainingCredits: myAllocation.voiceCredits - myAllocation.creditsSpent,
      },
      disclaimer:
        "Voice credits are governance units, NOT currency. No financial value.",
    });
  },
  "GET /api/quadratic-voting/[proposalId]"
);

// ── POST — cast a quadratic vote ──
export const POST = withErrorHandler(
  async (
    req: NextRequest,
    ctx: { params: Promise<{ proposalId: string }> }
  ) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }

    const { proposalId } = await ctx.params;
    if (!proposalId) {
      return NextResponse.json(
        { error: "proposalId is required", code: "invalid_body" },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "invalid_body", message: "Body must be valid JSON" },
        { status: 400 }
      );
    }
    const parsed = castVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "invalid_body",
          message: "creditsSpent must be a non-negative integer ≤ 1000",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }
    const { creditsSpent } = parsed.data;

    if (creditsSpent === 0) {
      return NextResponse.json(
        {
          error: "creditsSpent must be greater than zero to cast a vote",
          code: "invalid_body",
        },
        { status: 400 }
      );
    }

    let outcome: Awaited<ReturnType<typeof castVote>>;
    try {
      outcome = await castVote(user.id, proposalId, creditsSpent);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await audit({
        actorId: user.id,
        action: "quadratic_voting.cast",
        target: `proposal:${proposalId}`,
        result: "denied",
        reason: msg,
        metadata: { creditsSpent },
      });
      return NextResponse.json(
        { error: msg || "Failed to cast vote", code: "internal_error" },
        { status: 500 }
      );
    }

    if (!outcome.verdict.allowed) {
      await audit({
        actorId: user.id,
        action: "quadratic_voting.cast",
        target: `proposal:${proposalId}`,
        result: "denied",
        reason: outcome.verdict.reason ?? "cre_denied",
        metadata: {
          creditsSpent,
          policy: outcome.verdict.policy,
        },
      });
      return NextResponse.json(
        {
          error: outcome.verdict.reason ?? "CRE policy denied the vote",
          code: "cre_denied",
          policy: outcome.verdict.policy,
          decisionToken: outcome.verdict.decisionToken,
        },
        { status: 400 }
      );
    }

    await audit({
      actorId: user.id,
      action: "quadratic_voting.cast",
      target: `proposal:${proposalId}`,
      result: "allowed",
      metadata: {
        creditsSpent,
        totalCreditsSpent: outcome.allocation.creditsSpent,
        voteWeight: outcome.allocation.voteWeight,
        voiceCredits: outcome.allocation.voiceCredits,
      },
    });

    return NextResponse.json({
      allocation: {
        id: outcome.allocation.id,
        proposalId: outcome.allocation.proposalId,
        voiceCredits: outcome.allocation.voiceCredits,
        creditsSpent: outcome.allocation.creditsSpent,
        voteWeight: outcome.allocation.voteWeight,
        remainingCredits:
          outcome.allocation.voiceCredits - outcome.allocation.creditsSpent,
      },
      verdict: {
        allowed: outcome.verdict.allowed,
        policy: outcome.verdict.policy,
      },
      disclaimer:
        "Voice credits are governance units, NOT currency. No financial value.",
    });
  },
  "POST /api/quadratic-voting/[proposalId]"
);
