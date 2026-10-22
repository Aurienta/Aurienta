// AURIENTA — REC-5 Constitutional Wages API · GET /api/wages/benchmarks
//
// Public endpoint — no auth required. Returns the median-of-medians wage
// for each constitutional role across all PUBLISHED wage bands in a sector.
//
// Query: ?sector=<sector>
//
// Used by the dashboard's sector-benchmark comparison view. Public because
// only PUBLISHED bands are aggregated — constitutional transparency.

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { getSectorBenchmarks } from "@/lib/aurienta/constitutional-wages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const sector = url.searchParams.get("sector");
  if (!sector) {
    return NextResponse.json(
      { error: "sector query param is required" },
      { status: 400 }
    );
  }
  const benchmarks = await getSectorBenchmarks(sector);
  return NextResponse.json({ sector, benchmarks });
}, "GET /api/wages/benchmarks");
