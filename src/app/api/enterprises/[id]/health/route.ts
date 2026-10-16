import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/enterprises/[id]/health
// Returns the Constitutional Health Rating for an enterprise (Vol 16 §16.3).
// AUD-028: requires authentication + enterprise membership. The health rating
// is a derived summary but it is scoped to one enterprise — non-members have
// no business reading it, so we enforce both auth and membership.
export const GET = withErrorHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const { id } = await params;

  // AUD-028: only members of this enterprise (or AURIENTA Reps performing
  // platform-admin duties) may read its health rating.
  const isMember = (user.memberships ?? []).some((m) => m.enterpriseId === id);
  const isPlatformAdmin =
    user.primaryIntent === "aurienta_rep" ||
    (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isPlatformAdmin) {
    return NextResponse.json(
      { error: "Forbidden: not a member of this enterprise", code: "forbidden" },
      { status: 403 }
    );
  }

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
