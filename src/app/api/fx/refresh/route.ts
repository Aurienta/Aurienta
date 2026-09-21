import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/fx/refresh
// Auth required (any signed-in member).  Rate-limited via `limiters.ai`.
//
// PRODUCTION WIRING (comment):
//   This endpoint pulls the latest CBE daily reference rates from the
//   Central Bank of Egypt's published FX endpoint (https://www.cbe.org.eg/
//   _layouts/15/CBE/EcnRates/ECNRates.aspx or the JSON API used by
//   treasury workstations).  The fetched rates are upserted as new
//   FxRate rows (append-only — never overwrite — so we keep an audit
//   trail of every published rate over time).  We also fetch ECB and
//   Refinitiv as cross-source verification.
//
// SANDBOX BEHAVIOUR:
//   We cannot call the real CBE API from the sandbox.  Instead we
//   SIMULATE a refresh by reading the most recent cached rate for each
//   pair we already know about and re-persisting it with a fresh
//   `fetchedAt` timestamp and a note in `sourceRef` saying it was
//   simulated.  This keeps the audit trail honest: every FxRate row
//   is real-world data we previously cached, not Math.random() noise.
// @ts-ignore
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rlResult = limiters.ai(user.id);
  if (!rlResult.allowed) {
    return rateLimitedResponse(rlResult.resetAt);
  }

  // Pull the most recent rate per (from, to) pair we know about, then
  // re-persist each one with a new fetchedAt + simulated-source note.
  const knownPairs = await (db as any).fxRate.groupBy({
    by: ["fromCurrency", "toCurrency"],
  });

  const refreshed: Array<{
    from: string;
    to: string;
    rate: number;
    source: string;
    sourceRef: string | null;
    fetchedAt: string;
  }> = [];

  for (const pair of knownPairs) {
    const latest = await (db as any).fxRate.findFirst({
      where: {
        fromCurrency: pair.fromCurrency,
        toCurrency: pair.toCurrency,
      },
      orderBy: { fetchedAt: "desc" },
    });
    if (!latest) continue;

    const now = new Date();
    const created = await (db as any).fxRate.create({
      data: {
        fromCurrency: latest.fromCurrency,
        toCurrency: latest.toCurrency,
        rate: latest.rate,
        source: latest.source,
        sourceRef: `sim-refresh@${now.toISOString()} (sandbox)`,
        fetchedAt: now,
      },
    });

    refreshed.push({
      from: created.fromCurrency,
      to: created.toCurrency,
      rate: created.rate,
      source: created.source,
      sourceRef: created.sourceRef,
      fetchedAt: created.fetchedAt.toISOString(),
    });
  }

  await audit({
    actorId: user.id,
    action: "fx.refresh",
    target: "fx:all",
    result: "allowed",
    metadata: { pairsRefreshed: refreshed.length },
  });

  return NextResponse.json({
    ok: true,
    refreshed,
    count: refreshed.length,
    note:
      "Sandbox simulation: re-persisted the latest cached rate for each pair with a new fetchedAt. " +
      "Production wires this to the real CBE daily rate API + ECB + Refinitiv cross-source verification.",
  });
}
