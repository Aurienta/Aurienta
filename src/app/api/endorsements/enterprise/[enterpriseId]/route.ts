// /api/endorsements/enterprise/[enterpriseId] — list an enterprise's
// endorsements + aggregate stats.
//
// GET — public-ish (any authenticated partner may view an enterprise's
// endorsement footprint — reputation surfaces are public-by-default in the
// transparency protocol). Returns { endorsements, stats }.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import {
  getEndorsementStats,
  listEndorsementsForEnterprise,
} from "@/lib/aurienta/constitutional-endorsement";

// ── GET /api/endorsements/enterprise/[enterpriseId] ──
export const GET = withErrorHandler(
  async (
    _req: NextRequest,
    ctx: { params: Promise<{ enterpriseId: string }> }
  ) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { params } = ctx;
    const { enterpriseId } = await params;

    const [endorsements, stats] = await Promise.all([
      listEndorsementsForEnterprise(enterpriseId),
      getEndorsementStats(enterpriseId),
    ]);

    return NextResponse.json({ endorsements, stats });
  },
  "GET /api/endorsements/enterprise/[enterpriseId]"
);
