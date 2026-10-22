// AURIENTA — Secondary Market Trade Matching API
// ════════════════════════════════════════════════════════════════════
// POST /api/trades/match — trigger a discrete matching pass for an
// enterprise's open order book. The pass finds crossing buy/sell pairs,
// validates each against `enforceTradeMatch` (±5% price-band vs the
// fundamental Equity Unit Price), records TradeMatch rows, and bumps
// filledEquityUnits on both orders atomically.
//
// RBAC: open to any authenticated member of the enterprise (operators,
// capital partners, board members) — anyone with a stake in seeing the
// book clear. AURIENTA Reps may match any enterprise.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, tradeMatchSchema } from "@/lib/aurienta/validation";
import { matchOrders } from "@/lib/aurienta/trade-matching";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const body = await parseBody(req, tradeMatchSchema);
  if (body instanceof NextResponse) return body;

  // Caller must be a member of the enterprise (so they have a stake in
  // seeing the book clear) OR an AURIENTA Rep.
  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === body.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isRep) {
    return NextResponse.json(
      {
        error:
          "Only members of the enterprise may trigger a matching pass.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  const summary = await matchOrders(body.enterpriseId, user.id);

  return NextResponse.json({ summary });
}, "POST /api/trades/match");
