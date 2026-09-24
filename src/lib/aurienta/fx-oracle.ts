// AURIENTA — FX 4-Source Median Oracle (Vol 13)
// Implements the blueprint's 4-source FX rate consensus mechanism.
// Sources: CBE (Central Bank of Egypt), ECB (European Central Bank),
// Chainlink (oracle), Binance (crypto market implied).
// The median of 4 rates is used as the canonical rate to prevent
// single-source manipulation.

import { db } from "@/lib/db";
import { audit } from "./audit";

export type FxSource = "cbe" | "ecb" | "chainlink" | "binance";

export type FxRateEntry = {
  source: FxSource;
  rate: number;
  timestamp: Date;
  sourceRef?: string;
};

export type FxConsensusResult = {
  from: string;
  to: string;
  rate: number; // median
  sources: FxRateEntry[];
  median: number;
  min: number;
  max: number;
  spread: number;
  consensus: boolean;
  calculatedAt: Date;
};

// ── Mock fetchers (sandbox) ──
// In production, each of these calls the real API:
//   CBE: https://www.cbe.org.eg/_layouts/15/CBE/EcnRates/ECNRates.aspx
//   ECB: https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
//   Chainlink: ETH/USD feed → USD/EGP implied
//   Binance: USDT/EGP ticker
// In sandbox, we generate deterministic rates with small variance.

function mockRate(base: number, variance: number): number {
  // Deterministic pseudo-random based on the date (stable within a day).
  const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 6)); // changes every 6h
  const jitter = ((seed * 9301 + 49297) % 233280) / 233280; // LCG
  return base * (1 + (jitter - 0.5) * variance);
}

async function fetchCbeRate(from: string, to: string): Promise<FxRateEntry> {
  const baseRate = from === "USD" && to === "EGP" ? 48.5 : 1;
  return {
    source: "cbe",
    rate: Math.round(mockRate(baseRate, 0.01) * 10000) / 10000,
    timestamp: new Date(),
    sourceRef: "CBE daily reference rate",
  };
}

async function fetchEcbRate(from: string, to: string): Promise<FxRateEntry> {
  // ECB publishes EUR-based rates. For USD→EGP, we'd convert via EUR.
  // In sandbox, use a slightly different base.
  const baseRate = from === "USD" && to === "EGP" ? 48.7 : 1;
  return {
    source: "ecb",
    rate: Math.round(mockRate(baseRate, 0.012) * 10000) / 10000,
    timestamp: new Date(),
    sourceRef: "ECB eurofxref-daily",
  };
}

async function fetchChainlinkRate(from: string, to: string): Promise<FxRateEntry> {
  const baseRate = from === "USD" && to === "EGP" ? 48.3 : 1;
  return {
    source: "chainlink",
    rate: Math.round(mockRate(baseRate, 0.008) * 10000) / 10000,
    timestamp: new Date(),
    sourceRef: "Chainlink USD/EGP oracle",
  };
}

async function fetchBinanceRate(from: string, to: string): Promise<FxRateEntry> {
  // Binance USDT/EGP implied rate
  const baseRate = from === "USD" && to === "EGP" ? 48.6 : 1;
  return {
    source: "binance",
    rate: Math.round(mockRate(baseRate, 0.015) * 10000) / 10000,
    timestamp: new Date(),
    sourceRef: "Binance USDT/EGP ticker (implied USD)",
  };
}

/**
 * Fetch the median FX rate from 4 sources.
 * The median is resistant to outliers — if one source is compromised,
 * the consensus rate remains accurate.
 */
export async function fetchMedianRate(from: string, to: string): Promise<FxConsensusResult> {
  const [cbe, ecb, chainlink, binance] = await Promise.all([
    fetchCbeRate(from, to),
    fetchEcbRate(from, to),
    fetchChainlinkRate(from, to),
    fetchBinanceRate(from, to),
  ]);

  const sources = [cbe, ecb, chainlink, binance];
  const rates = sources.map((s) => s.rate).sort((a, b) => a - b);

  // Median of 4 = average of the 2 middle values
  const median = Math.round(((rates[1]! + rates[2]!) / 2) * 10000) / 10000;
  const min = rates[0]!;
  const max = rates[3]!;
  const spread = Math.round((max - min) * 10000) / 10000;

  // Consensus is valid if spread is < 2% of median
  const consensus = spread / median < 0.02;

  const result: FxConsensusResult = {
    from,
    to,
    rate: median,
    sources,
    median,
    min,
    max,
    spread,
    consensus,
    calculatedAt: new Date(),
  };

  // Persist the consensus rate as a new FxRate row
  await (db as any).fxRate.create({
    data: {
      fromCurrency: from,
      toCurrency: to,
      rate: median,
      source: "consensus_median",
      sourceRef: `4-source median: CBE=${cbe.rate}, ECB=${ecb.rate}, CL=${chainlink.rate}, BIN=${binance.rate}`,
      fetchedAt: new Date(),
    },
  });

  await audit({
    actorId: "system",
    action: "fx.consensus_calculated",
    target: `fx:${from}-${to}`,
    result: "allowed",
    metadata: {
      median,
      sources: sources.map((s) => ({ source: s.source, rate: s.rate })),
      spread,
      consensus,
    },
  });

  return result;
}

/**
 * Get the latest cached consensus rate for a pair.
 * Falls back to fetching a fresh one if no cached rate exists.
 */
export async function getLatestConsensus(from: string, to: string): Promise<FxConsensusResult> {
  // Try to get the latest cached consensus rate (less than 6 hours old)
  const cached = await (db as any).fxRate.findFirst({
    where: {
      fromCurrency: from,
      toCurrency: to,
      source: "consensus_median",
      fetchedAt: { gt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
    },
    orderBy: { fetchedAt: "desc" },
  });

  if (cached) {
    // Parse the source breakdown from sourceRef
    const sources: FxRateEntry[] = cached.sourceRef
      ? cached.sourceRef.match(/CBE=([\d.]+).*ECB=([\d.]+).*CL=([\d.]+).*BIN=([\d.]+)/)
        ? [
            { source: "cbe" as const, rate: parseFloat(RegExp.$1), timestamp: cached.fetchedAt },
            { source: "ecb" as const, rate: parseFloat(RegExp.$2), timestamp: cached.fetchedAt },
            { source: "chainlink" as const, rate: parseFloat(RegExp.$3), timestamp: cached.fetchedAt },
            { source: "binance" as const, rate: parseFloat(RegExp.$4), timestamp: cached.fetchedAt },
          ]
        : []
      : [];

    return {
      from,
      to,
      rate: cached.rate,
      sources,
      median: cached.rate,
      min: Math.min(...sources.map((s) => s.rate)),
      max: Math.max(...sources.map((s) => s.rate)),
      spread: 0,
      consensus: true,
      calculatedAt: cached.fetchedAt,
    };
  }

  // No fresh cached rate — fetch a new one
  return fetchMedianRate(from, to);
}
