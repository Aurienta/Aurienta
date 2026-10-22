// AURIENTA — Supply Chain Finance Detail API
// ════════════════════════════════════════════════════════════════════
// GET  /api/supply-chain/advances/[advanceId]  — fetch one advance.
// PATCH /api/supply-chain/advances/[advanceId] — fund or repay an advance.
//
// PATCH body:
//   { action: "fund"  } — capital partner wires principal through escrow.
//   { action: "repay" } — enterprise repays principal + interest through escrow.
//
// RBAC:
//   - fund:  caller is the capital partner who owns the advance (or a Rep).
//   - repay: caller is an operator of the enterprise (or a Rep).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import {
  parseBody,
  supplyChainAdvancePatchSchema,
} from "@/lib/aurienta/validation";
import { audit } from "@/lib/aurienta/audit";
import {
  getAdvance,
  fundAdvance,
  repayAdvance,
} from "@/lib/aurienta/supply-chain-finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ advanceId: string }> };

// ─── GET ─────────────────────────────────────────────────────────────

export const GET = withErrorHandler(
  async (_req: NextRequest, ctx: Params) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }
    const { advanceId } = await ctx.params;

    const advance = await getAdvance(advanceId);
    if (!advance) {
      return NextResponse.json(
        { error: "Advance not found", code: "not_found" },
        { status: 404 }
      );
    }

    const isPartner = advance.partnerId === user.id;
    const isMember = (user.memberships ?? []).some(
      (m) => m.enterpriseId === advance.enterpriseId
    );
    const isRep = (user.memberships ?? []).some(
      (m) => m.role === "aurienta_rep"
    );
    if (!isPartner && !isMember && !isRep) {
      return NextResponse.json(
        { error: "Forbidden", code: "forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({ advance });
  },
  "GET /api/supply-chain/advances/[advanceId]"
);

// ─── PATCH ──────────────────────────────────────────────────────────

export const PATCH = withErrorHandler(
  async (req: NextRequest, ctx: Params) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }
    const { advanceId } = await ctx.params;

    const body = await parseBody(req, supplyChainAdvancePatchSchema);
    if (body instanceof NextResponse) return body;

    const existing = await getAdvance(advanceId);
    if (!existing) {
      return NextResponse.json(
        { error: "Advance not found", code: "not_found" },
        { status: 404 }
      );
    }

    const isPartner = existing.partnerId === user.id;
    const membership = (user.memberships ?? []).find(
      (m) => m.enterpriseId === existing.enterpriseId
    );
    const isOperator =
      membership &&
      [
        "founding_operator",
        "manager",
        "board_member",
        "company_owner",
      ].includes(membership.role);
    const isRep = (user.memberships ?? []).some(
      (m) => m.role === "aurienta_rep"
    );

    try {
      if (body.action === "fund") {
        if (!isPartner && !isRep) {
          await audit({
            actorId: user.id,
            action: "supply_chain.advance.fund",
            target: `milestone_advance:${advanceId}`,
            result: "denied",
            reason: "partner_or_rep_required",
          });
          return NextResponse.json(
            {
              error:
                "Only the capital partner who owns this advance may fund it.",
              code: "forbidden",
            },
            { status: 403 }
          );
        }
        const updated = await fundAdvance(advanceId, user.id);
        return NextResponse.json({ advance: updated });
      }

      // action === "repay"
      if (!isOperator && !isRep) {
        await audit({
          actorId: user.id,
          action: "supply_chain.advance.repay",
          target: `milestone_advance:${advanceId}`,
          result: "denied",
          reason: "operator_or_rep_required",
        });
        return NextResponse.json(
          {
            error: "Only an enterprise operator may repay an advance.",
            code: "forbidden",
          },
          { status: 403 }
        );
      }
      const updated = await repayAdvance(advanceId, user.id);
      return NextResponse.json({ advance: updated });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not update advance.";
      return NextResponse.json(
        { error: msg, code: "invalid_state" },
        { status: 409 }
      );
    }
  },
  "PATCH /api/supply-chain/advances/[advanceId]"
);
