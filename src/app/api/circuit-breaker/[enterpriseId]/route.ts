import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/circuit-breaker/[enterpriseId]
// Returns the current circuit breaker status for an enterprise.
// AUD-028: requires authentication + enterprise membership. The circuit
// breaker status is enterprise-scoped — non-members have no business reading
// it, so we enforce both auth and membership.
export const GET = withErrorHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ enterpriseId: string }> }
) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const { enterpriseId } = await params;

  // AUD-028: only members of this enterprise (or AURIENTA Reps performing
  // platform-admin duties) may read its circuit-breaker status.
  const isMember = (user.memberships ?? []).some((m) => m.enterpriseId === enterpriseId);
  const isPlatformAdmin =
    user.primaryIntent === "aurienta_rep" ||
    (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isPlatformAdmin) {
    return NextResponse.json(
      { error: "Forbidden: not a member of this enterprise", code: "forbidden" },
      { status: 403 }
    );
  }

  const { getHaltStatus } = await import("@/lib/aurienta/circuit-breaker");
  const status = await getHaltStatus(enterpriseId);
  return NextResponse.json({ enterpriseId, ...status });
});
