// AURIENTA — Supply Chain Finance API
// ════════════════════════════════════════════════════════════════════
// GET  /api/supply-chain/advances        — list advances visible to caller.
// POST /api/supply-chain/advances        — request a new milestone advance.
//
// Visibility (GET):
//   - Capital partners see advances where they're the lender.
//   - Operators / board members see advances for their enterprises.
//   - AURIENTA Reps see everything.
//
// Request (POST):
//   - Caller must be a member of the enterprise requesting the advance
//     (operator seat) OR the capital partner who will fund it.
//   - The CRE policy `enforceMilestoneAdvance` enforces the 8% usury cap,
//     the 80%-of-milestone limit, and the 3-month minimum runway.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import {
  parseBody,
  supplyChainAdvanceRequestSchema,
} from "@/lib/aurienta/validation";
import {
  requestAdvance,
  listAdvancesVisibleToUser,
  type MilestoneAdvanceRecord,
} from "@/lib/aurienta/supply-chain-finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET ─────────────────────────────────────────────────────────────

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const enterpriseIds = (user.memberships ?? []).map((m) => m.enterpriseId);
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");

  let advances: MilestoneAdvanceRecord[];
  if (isRep) {
    const { db } = await import("@/lib/db");
    const rows = await db.milestoneAdvance.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    advances = rows as MilestoneAdvanceRecord[];
  } else {
    advances = await listAdvancesVisibleToUser(user.id, enterpriseIds, 100);
  }

  return NextResponse.json({ advances });
}, "GET /api/supply-chain/advances");

// ─── POST ───────────────────────────────────────────────────────────

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const body = await parseBody(req, supplyChainAdvanceRequestSchema);
  if (body instanceof NextResponse) return body;

  // Caller must be an operator of the enterprise requesting the advance.
  // Capital partners may not unilaterally create advances for an enterprise.
  const membership = (user.memberships ?? []).find(
    (m) => m.enterpriseId === body.enterpriseId
  );
  const isOperator =
    membership &&
    ["founding_operator", "manager", "board_member", "company_owner"].includes(
      membership.role
    );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isOperator && !isRep) {
    return NextResponse.json(
      {
        error:
          "Only an enterprise operator may request a working-capital advance.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  // The capital partner (lender) is the calling user for now. In the full
  // implementation, the operator selects a partner from a marketplace; here
  // we record the requester as the partner so the link is established.
  const { advance, verdict } = await requestAdvance({
    enterpriseId: body.enterpriseId,
    partnerId: user.id,
    milestoneId: body.milestoneId,
    advanceAmountEgp: body.advanceAmountEgp,
    constitutionalRate: body.constitutionalRate,
    termDays: body.termDays,
  });

  if (!verdict.allowed) {
    return NextResponse.json(
      {
        error: verdict.reason ?? "Advance denied by CRE policy.",
        code: "cre_denied",
        verdict,
        advance,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ advance, verdict }, { status: 201 });
}, "POST /api/supply-chain/advances");
