import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/fx/refresh
// Auth required (any signed-in member). Rate-limited via `limiters.ai`.
//
// Triggers a REAL 4-source median consensus refresh for USD→EGP (the only
// pair the real oracle supports — CBE / ECB / CoinGecko / Binance all
// publish USD/EGP). The result is appended to the FxRate table so the
// consensus audit trail grows with every refresh.
//
// Other pairs: skipped silently. The blueprint's Vol 13 oracle is
// USD/EGP-only — the seed populates a few other pairs but those use the
// mocked oracle (the existing sandbox simulation, unchanged).
export const POST = withErrorHandler(async (_req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rlResult = limiters.ai(user.id);
  if (!rlResult.allowed) {
    return rateLimitedResponse(rlResult.resetAt);
  }

  // ── PRIMARY: real oracle for USD/EGP ──
  let refreshed: Array<{
    from: string;
    to: string;
    rate: number;
    source: string;
    sourceRef: string | null;
    fetchedAt: string;
  }> = [];
  let oracle: "real" | "mock_fallback" = "real";
  let oracleError: string | null = null;

  try {
    const { getConsensusFxRate } = await import("@/lib/aurienta/fx-oracle-real");
    const consensus = await getConsensusFxRate("USD", "EGP");
    refreshed = [
      {
        from: consensus.from,
        to: consensus.to,
        rate: consensus.rate,
        source: "consensus_median",
        sourceRef:
          consensus.sources.length > 0
            ? consensus.sources.map((s) => `${s.source}=${s.rate}`).join(", ")
            : null,
        fetchedAt: consensus.calculatedAt.toISOString(),
      },
    ];
  } catch (e) {
    oracle = "mock_fallback";
    oracleError = e instanceof Error ? e.message : String(e);
    logger.warn("fx_refresh_real_failed_falling_back_to_mock", {
      err: oracleError,
    });

    // Fall back to the existing sandbox simulation: re-persist the latest
    // cached rate per known pair with a fresh fetchedAt. This preserves the
    // audit trail behavior pre-real-oracle.
    const knownPairs = await (db as any).fxRate.groupBy({
      by: ["fromCurrency", "toCurrency"],
    });
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
          sourceRef: `sim-refresh@${now.toISOString()} (sandbox fallback)`,
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
  }

  await audit({
    actorId: user.id,
    action: "fx.refresh",
    target: "fx:USD-EGP",
    result: "allowed",
    metadata: {
      pairsRefreshed: refreshed.length,
      oracle,
      oracleError,
    },
  });

  return NextResponse.json({
    ok: true,
    refreshed,
    count: refreshed.length,
    oracle,
    oracleError,
    note:
      oracle === "real"
        ? "Live 4-source median consensus (CBE / ECB / CoinGecko / Binance) persisted to FxRate."
        : "Real oracle failed — fell back to the mocked simulation. Check network connectivity to the upstream FX APIs.",
  });
});
