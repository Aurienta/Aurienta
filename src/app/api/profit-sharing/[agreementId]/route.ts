import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import {
  parseBody,
  profitSharePatchSchema,
} from "@/lib/aurienta/validation";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { terminateAgreement } from "@/lib/aurienta/profit-sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/profit-sharing/[agreementId]
// Returns a single profit-share agreement with the enterprise enriched.
// Authorization: the caller must be either the partner on the agreement OR
// a member of the enterprise the agreement belongs to.
export const GET = withErrorHandler(
  async (
    _req: NextRequest,
    ctx: { params: Promise<{ agreementId: string }> }
  ) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }

    const { agreementId } = await ctx.params;
    if (!agreementId || agreementId.length < 6) {
      return NextResponse.json(
        { error: "Invalid agreement id", code: "invalid_id" },
        { status: 400 }
      );
    }

    const agreement = await db.profitShareAgreement.findUnique({
      where: { id: agreementId },
    });
    if (!agreement) {
      return NextResponse.json(
        { error: "Agreement not found", code: "not_found" },
        { status: 404 }
      );
    }

    // ── Authorization ──
    const isPartner = agreement.partnerId === user.id;
    const isEnterpriseMember = user.memberships.some(
      (m) => m.enterpriseId === agreement.enterpriseId
    );
    if (!isPartner && !isEnterpriseMember) {
      await audit({
        actorId: user.id,
        action: "profit_share.view",
        target: `profit_share:${agreementId}`,
        result: "denied",
        reason: "not_authorized",
      });
      return NextResponse.json(
        {
          error:
            "Only the partner or a member of the agreement's enterprise may view this agreement.",
          code: "forbidden",
        },
        { status: 403 }
      );
    }

    const enterprise = await db.enterprise.findUnique({
      where: { id: agreement.enterpriseId },
      select: { id: true, name: true, slug: true, tier: true },
    });

    return NextResponse.json({
      agreement: {
        id: agreement.id,
        enterpriseId: agreement.enterpriseId,
        partnerId: agreement.partnerId,
        title: agreement.title,
        contributionEgp: agreement.contributionEgp,
        profitSharePct: agreement.profitSharePct,
        termMonths: agreement.termMonths,
        startedAt: agreement.startedAt.toISOString(),
        maturesAt: agreement.maturesAt.toISOString(),
        status: agreement.status,
        totalDistributedEgp: agreement.totalDistributedEgp,
        creDecisionToken: agreement.creDecisionToken,
        createdAt: agreement.createdAt.toISOString(),
        enterprise: enterprise
          ? {
              id: enterprise.id,
              name: enterprise.name,
              slug: enterprise.slug,
              tier: enterprise.tier,
            }
          : null,
      },
    });
  },
  "GET /api/profit-sharing/[agreementId]"
);

// PATCH /api/profit-sharing/[agreementId]
// Body: { action: "terminate", reason?: string }
//
// Currently supports a single action: "terminate" — sets the agreement status
// to "terminated" and appends a ledger event. Only the partner or an
// enterprise manager / institutional reviewer may terminate.
//
// Future actions (recordDistribution) will be added when the distribution
// flow is wired (out of scope for this Phase 1 task).
export const PATCH = withErrorHandler(
  async (
    req: NextRequest,
    ctx: { params: Promise<{ agreementId: string }> }
  ) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }

    const { agreementId } = await ctx.params;
    if (!agreementId || agreementId.length < 6) {
      return NextResponse.json(
        { error: "Invalid agreement id", code: "invalid_id" },
        { status: 400 }
      );
    }

    const body = await parseBody(req, profitSharePatchSchema);
    if (body instanceof NextResponse) return body;

    const existing = await db.profitShareAgreement.findUnique({
      where: { id: agreementId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Agreement not found", code: "not_found" },
        { status: 404 }
      );
    }

    // ── Authorization ──
    // Partner may terminate their own agreement. Enterprise managers and
    // institutional reviewers (law_firm_rep, accounting_firm_rep,
    // aurienta_rep) may terminate if the agreement is in bad faith (CRE
    // enforced, not discretionary).
    const isPartner = existing.partnerId === user.id;
    const membership = user.memberships.find(
      (m) => m.enterpriseId === existing.enterpriseId
    );
    const isManagerOrAbove =
      membership &&
      ["manager", "board_member", "law_firm_rep", "accounting_firm_rep", "aurienta_rep"].includes(
        membership.role
      );

    if (!isPartner && !isManagerOrAbove) {
      await audit({
        actorId: user.id,
        action: "profit_share.terminate",
        target: `profit_share:${agreementId}`,
        result: "denied",
        reason: "not_authorized",
      });
      return NextResponse.json(
        {
          error:
            "Only the partner or an enterprise manager may terminate this agreement.",
          code: "forbidden",
        },
        { status: 403 }
      );
    }

    try {
      await terminateAgreement(agreementId, user.id);
    } catch (e) {
      const message = e instanceof Error ? e.message : "terminate_failed";
      return NextResponse.json(
        { error: message, code: "conflict" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, status: "terminated" });
  },
  "PATCH /api/profit-sharing/[agreementId]"
);
