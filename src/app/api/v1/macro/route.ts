// AURIENTA — Live Macro Indicators API (FRED)
// ═══════════════════════════════════════════════════════════════
// GET /api/v1/macro                       → all indicators (latest values)
// GET /api/v1/macro?category=egypt        → Egypt macro only
// GET /api/v1/macro?category=us_rates     → US rates only
// GET /api/v1/macro?series=DFF            → single series detail
// GET /api/v1/macro?series=DFF&history=24 → series with history (for charts)
//
// Data source: St. Louis Fed FRED API (live).
// Public read-only — macro indicators are public economic data.
// Cached 60 minutes (macro data changes slowly).

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import {
  isFredConfigured,
  getAllMacroIndicators,
  getObservationHistory,
  MACRO_SERIES,
} from "@/lib/aurienta/fred";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const series = url.searchParams.get("series");
  const historyParam = url.searchParams.get("history");
  const history = historyParam ? Math.min(Math.max(parseInt(historyParam, 10) || 24, 1), 120) : null;

  // ── Single-series detail (with optional history) ──
  if (series) {
    const meta = MACRO_SERIES.find((s) => s.id === series.toUpperCase());
    if (!meta) {
      return NextResponse.json(
        {
          error: `Unknown series: ${series}`,
          available: MACRO_SERIES.map((s) => s.id),
        },
        { status: 404 },
      );
    }

    const [allResult, historyData] = await Promise.all([
      getAllMacroIndicators(),
      history ? getObservationHistory(meta.id, history) : Promise.resolve([]),
    ]);

    const indicator = allResult.indicators.find((i) => i.seriesId === meta.id);

    return NextResponse.json(
      {
        dataset: "macro-series",
        series: meta,
        latest: indicator ?? null,
        history: historyData,
        configured: allResult.configured,
        source: "St. Louis Fed FRED API",
        sourceUrl: `https://fred.stlouisfed.org/series/${meta.id}`,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=600, stale-while-revalidate=1200",
        },
      },
    );
  }

  // ── All indicators (optionally filtered by category) ──
  const result = await getAllMacroIndicators();

  const indicators = category
    ? result.indicators.filter((i) => i.category === category)
    : result.indicators;

  const categories = Array.from(new Set(MACRO_SERIES.map((s) => s.category)));

  return NextResponse.json(
    {
      dataset: "macro-indicators",
      configured: result.configured,
      count: indicators.length,
      totalSeries: MACRO_SERIES.length,
      categories,
      filter: category ?? null,
      indicators,
      errors: result.errors.length > 0 ? result.errors : undefined,
      source: "St. Louis Fed FRED API",
      sourceUrl: "https://fred.stlouisfed.org/",
      legalNotice:
        "Macroeconomic data from the Federal Reserve Economic Data (FRED) API. Public domain data — FRED terms of use apply. Not investment advice.",
      fetchedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=1200",
        "X-Cache": "aurienta-fred",
      },
    },
  );
}, "GET /api/v1/macro");

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
