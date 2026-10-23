import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { requireCronToken } from "@/lib/aurienta/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/cron/health-rating
// Daily cron — recalculates health ratings for all active enterprises.
// Token-auth via CRON_SECRET (same as other cron endpoints).
export const POST = withErrorHandler(async (req: NextRequest) => {
  const unauthorized = requireCronToken(req);
  if (unauthorized) return unauthorized;

  const { recalculateAllHealthRatings } = await import("@/lib/aurienta/health-rating");
  await recalculateAllHealthRatings();

  return NextResponse.json({
    ok: true,
    recalculatedAt: new Date().toISOString(),
    message: "Health ratings recalculated for all active enterprises.",
  });
});
