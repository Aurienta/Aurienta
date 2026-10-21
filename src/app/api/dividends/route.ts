// AURIENTA — Dividend Distribution API
// ════════════════════════════════════════════════════════════════════
// GET  /api/dividends        — list distributions visible to the caller.
// POST /api/dividends        — declare a new dividend distribution.
//
// Visibility (GET):
//   - Capital partners + operators / board members see distributions for
//     every enterprise they're a member of.
//   - AURIENTA Reps see everything.
//
// Declaration (POST):
//   - Caller must be an operator / board member of the enterprise.
//   - The CRE policy `enforceDividendDistribution` enforces:
//       total > 0, profit > 0, total ≤ 50% of profit, total ≤ escrow balance.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, dividendDeclareSchema } from "@/lib/aurienta/validation";
import {
  declareDividend,
  listDividendsForUserEnterprises,
  type DividendDistributionRecord,
} from "@/lib/aurienta/dividend-distribution";

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

  let distributions: DividendDistributionRecord[];
  if (isRep) {
    const { db } = await import("@/lib/db");
    const rows = await db.dividendDistribution.findMany({
      orderBy: { declaredAt: "desc" },
      take: 100,
    });
    distributions = rows as DividendDistributionRecord[];
  } else {
    distributions = await listDividendsForUserEnterprises(enterpriseIds, 100);
  }

  return NextResponse.json({ distributions });
}, "GET /api/dividends");

// ─── POST ───────────────────────────────────────────────────────────

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const body = await parseBody(req, dividendDeclareSchema);
  if (body instanceof NextResponse) return body;

  // Only operators / board members may declare dividends.
  const membership = (user.memberships ?? []).find(
    (m) => m.enterpriseId === body.enterpriseId
  );
  const isOperator =
    membership &&
    [
      "founding_operator",
      "manager",
      "board_member",
      "company_owner",
    ].includes(membership.role);
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isOperator && !isRep) {
    return NextResponse.json(
      {
        error:
          "Only an enterprise operator or board member may declare dividends.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  const { distribution, verdict } = await declareDividend({
    enterpriseId: body.enterpriseId,
    totalDividendEgp: body.totalDividendEgp,
    perShareDividendEgp: body.perShareDividendEgp,
    partnerCount: body.partnerCount,
    declaredById: user.id,
  });

  if (!verdict.allowed) {
    return NextResponse.json(
      {
        error: verdict.reason ?? "Dividend denied by CRE policy.",
        code: "cre_denied",
        verdict,
        distribution,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ distribution, verdict }, { status: 201 });
}, "POST /api/dividends");
