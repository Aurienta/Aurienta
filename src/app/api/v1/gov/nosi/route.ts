import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/gov/nosi?nationalId=...&name=...
// Verifies employee social insurance registration with NOSI.
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const nationalId = url.searchParams.get("nationalId") ?? "";
  const name = url.searchParams.get("name") ?? "";

  if (!nationalId || !name) {
    return NextResponse.json(
      { error: "Missing query params: nationalId, name" },
      { status: 400 }
    );
  }

  const { verifyNosiEmployee } = await import("@/lib/aurienta/gov-api");
  const result = await verifyNosiEmployee({
    nationalId,
    employeeName: name,
  });

  return NextResponse.json(result);
});
