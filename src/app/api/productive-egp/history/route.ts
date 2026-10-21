// AURIENTA — REC-2 Productive EGP API · GET /api/productive-egp/history
//
// Query: ?enterpriseId=<id>&days=<n>
//
// Returns the last N days of Productive EGP snapshots for an enterprise,
// oldest→newest (so the SVG line chart renders left-to-right).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { getHistory } from "@/lib/aurienta/productive-egp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  if (!enterpriseId) {
    return NextResponse.json(
      { error: "enterpriseId query param is required" },
      { status: 400 }
    );
  }
  const daysRaw = Number(url.searchParams.get("days") ?? "30");
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 365) : 30;

  const history = await getHistory(enterpriseId, days);
  return NextResponse.json({ enterpriseId, days, history });
}, "GET /api/productive-egp/history");
