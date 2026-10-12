import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { priorityAllocationRankingsQuerySchema } from "@/lib/aurienta/validation";
import { getRankings } from "@/lib/aurienta/priority-allocation";

// GET /api/priority-allocation/rankings?enterpriseId=...&windowPhase=1|2|3
// Returns the deterministic STS-weighted ranking for the given enterprise +
// phase. Sorted by allocationRank ASC (then by createdAt ASC on ties).
//
// The caller must be authenticated — rankings reveal participant legal
// names, which are PII under PDPL. Any authenticated user may view any
// enterprise's ranking (transparency is constitutional), but anonymous
// access is denied.
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // ── Rate limit ──
  const rl = limiters.priorityAllocation(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  // ── Parse query ──
  const url = new URL(req.url);
  const rawQuery: Record<string, string> = {
    enterpriseId: url.searchParams.get("enterpriseId") ?? "",
    windowPhase: url.searchParams.get("windowPhase") ?? "",
  };
  const parsed = priorityAllocationRankingsQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_query",
        message: "enterpriseId (string) and windowPhase (1|2|3) are required",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }
  const { enterpriseId, windowPhase } = parsed.data;

  const rankings = await getRankings(enterpriseId, windowPhase);

  return NextResponse.json({
    rankings,
    currentUserId: user.id,
    count: rankings.length,
  });
}, "GET /api/priority-allocation/rankings");
