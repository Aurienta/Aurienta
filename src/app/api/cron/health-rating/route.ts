import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/cron/health-rating
// Daily cron — recalculates health ratings for all active enterprises.
// Token-auth via CRON_SECRET (same as other cron endpoints).
export const POST = withErrorHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recalculateAllHealthRatings } = await import("@/lib/aurienta/health-rating");
  await recalculateAllHealthRatings();

  return NextResponse.json({
    ok: true,
    recalculatedAt: new Date().toISOString(),
    message: "Health ratings recalculated for all active enterprises.",
  });
});
