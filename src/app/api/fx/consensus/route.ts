import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/fx/consensus?from=USD&to=EGP
// Returns the 4-source median FX rate consensus (Vol 13).
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const from = (url.searchParams.get("from") ?? "USD").toUpperCase().trim();
  const to = (url.searchParams.get("to") ?? "EGP").toUpperCase().trim();

  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
    return NextResponse.json(
      { error: "Currency codes must be 3-letter ISO 4217 codes" },
      { status: 400 }
    );
  }

  const { getLatestConsensus } = await import("@/lib/aurienta/fx-oracle");
  const result = await getLatestConsensus(from, to);

  return NextResponse.json(result);
});
