import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/enterprises/[id]/health
// Returns the Constitutional Health Rating for an enterprise (Vol 16 §16.3).
export const GET = withErrorHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const enterprise = await db.enterprise.findUnique({
    where: { id },
    select: { id: true, name: true, healthScore: true },
  });

  if (!enterprise) {
    return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
  }

  const { calculateHealthRating } = await import("@/lib/aurienta/health-rating");
  const result = await calculateHealthRating(id);

  return NextResponse.json({
    enterpriseId: id,
    enterpriseName: enterprise.name,
    ...result,
  });
});
