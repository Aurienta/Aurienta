import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/fx?from=USD&to=EGP
// Public endpoint — exchange rates are public information (CBE publishes
// daily reference rates).  Returns the latest cached rate for the pair.
//
// Source priority in production: CBE daily > ECB > Refinitiv.  The seed
// populates both CBE and ECB rows for the USD→EGP pair so callers can see
// which source is being read.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const from = (url.searchParams.get("from") ?? "").toUpperCase().trim();
  const to = (url.searchParams.get("to") ?? "EGP").toUpperCase().trim();

  if (!from) {
    return NextResponse.json(
      { error: "missing_param", message: "'from' query parameter is required" },
      { status: 400 }
    );
  }
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
    return NextResponse.json(
      {
        error: "invalid_param",
        message: "Currency codes must be 3-letter ISO 4217 codes (e.g. USD, EGP)",
      },
      { status: 400 }
    );
  }

  const rate = await db.fxRate.findFirst({
    where: { fromCurrency: from, toCurrency: to },
    orderBy: { fetchedAt: "desc" },
  });

  if (!rate) {
    return NextResponse.json(
      {
        error: "fx_rate_not_found",
        message: `No cached FX rate for ${from}→${to}`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    from: rate.fromCurrency,
    to: rate.toCurrency,
    rate: rate.rate,
    source: rate.source,
    sourceRef: rate.sourceRef,
    fetchedAt: rate.fetchedAt.toISOString(),
  });
}
