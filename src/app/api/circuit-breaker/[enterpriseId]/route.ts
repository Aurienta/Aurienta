import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/circuit-breaker/[enterpriseId]
// Returns the current circuit breaker status for an enterprise.
// AUD-028: requires authentication. Any authenticated user may read the
// circuit-breaker status — no membership check needed for this read-only endpoint.
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
  const { getHaltStatus } = await import("@/lib/aurienta/circuit-breaker");
  const status = await getHaltStatus(enterpriseId);
  return NextResponse.json({ enterpriseId, ...status });
});
