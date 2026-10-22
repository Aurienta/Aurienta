import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/fx/consensus?from=USD&to=EGP
// Returns the 4-source median FX rate consensus (Vol 13).
//
// PRIMARY: the real FX oracle (fx-oracle-real.ts) which hits CBE, ECB,
// CoinGecko (Chainlink proxy), and Binance live APIs in parallel.
// FALLBACK: the mocked oracle (fx-oracle.ts) which generates deterministic
// sandbox rates. The fallback only runs if the real oracle throws — this
// preserves the sandbox's "always-works" guarantee without silently
// masking real-API failures (the deprecation note is returned in the
// response payload so callers know which path served the rate).
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

  // ── PRIMARY: real oracle ──
  try {
    const { getLatestConsensusReal } = await import("@/lib/aurienta/fx-oracle-real");
    const result = await getLatestConsensusReal(from, to);
    return NextResponse.json({
      ...result,
      oracle: "real",
      oracleNote:
        "Fetched live from CBE / ECB / CoinGecko (Chainlink proxy) / Binance with 10s timeouts. Median is taken of the responding sources; spread < 2% of median = consensus healthy.",
    });
  } catch (e) {
    // ── FALLBACK: mocked oracle ──
    logger.warn("fx_consensus_real_failed_falling_back_to_mock", {
      from,
      to,
      err: e instanceof Error ? e.message : String(e),
    });

    const { getLatestConsensus } = await import("@/lib/aurienta/fx-oracle");
    const result = await getLatestConsensus(from, to);
    return NextResponse.json({
      ...result,
      oracle: "mock_fallback",
      oracleNote:
        "Real FX oracle failed — falling back to the deterministic mocked oracle (sandbox mode). Check network connectivity to CBE / ECB / CoinGecko / Binance.",
      oracleError: e instanceof Error ? e.message : String(e),
    });
  }
});
