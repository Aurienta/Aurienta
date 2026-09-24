import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/gov/eta?taxId=...&name=...&period=...
// Verifies tax filing + clearance with the Egyptian Tax Authority.
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const taxId = url.searchParams.get("taxId") ?? "";
  const name = url.searchParams.get("name") ?? "";
  const period = url.searchParams.get("period") ?? undefined;

  if (!taxId || !name) {
    return NextResponse.json(
      { error: "Missing query params: taxId, name" },
      { status: 400 }
    );
  }

  const { verifyEtaTaxClearance } = await import("@/lib/aurienta/gov-api");
  const result = await verifyEtaTaxClearance({
    taxId,
    enterpriseName: name,
    period,
  });

  return NextResponse.json(result);
});
