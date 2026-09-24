import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/gov/gafi?crNumber=...&name=...
// Verifies enterprise registration with GAFI.
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const crNumber = url.searchParams.get("crNumber") ?? "";
  const name = url.searchParams.get("name") ?? "";

  if (!crNumber || !name) {
    return NextResponse.json(
      { error: "Missing query params: crNumber, name" },
      { status: 400 }
    );
  }

  const { verifyGafiEnterprise } = await import("@/lib/aurienta/gov-api");
  const result = await verifyGafiEnterprise({
    commercialRegistrationNumber: crNumber,
    enterpriseName: name,
  });

  return NextResponse.json(result);
});
