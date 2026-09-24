import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/circuit-breaker/[enterpriseId]
// Returns the current circuit breaker status for an enterprise.
export const GET = withErrorHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ enterpriseId: string }> }
) => {
  const { enterpriseId } = await params;
  const { getHaltStatus } = await import("@/lib/aurienta/circuit-breaker");
  const status = await getHaltStatus(enterpriseId);
  return NextResponse.json({ enterpriseId, ...status });
});
