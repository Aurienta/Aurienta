// AURIENTA — FRED (Federal Reserve Economic Data) Integration
// ═══════════════════════════════════════════════════════════════
// Live macroeconomic indicators for the Egyptian market from the
// St. Louis Fed's FRED API (https://fred.stlouisfed.org/).
//
// Two data groups:
//   1. EGYPT macro — inflation, GDP, GDP/capita, population,
//      youth unemployment, uncertainty index (annual/quarterly)
//   2. US macro (EGP drivers) — Fed funds rate, 10Y treasury,
//      CPI, unemployment, breakeven inflation (daily/monthly)
//
// The US series are the global capital-flow drivers that move
// EGP/USD: when the Fed raises rates (DFF↑), capital flows out of
// emerging markets like Egypt, pressuring EGP. These belong in
// every feasibility study and FX risk assessment.
//
// API key: FRED_API_KEY env var (required — set in .env)
// Caching: referenceCache (60 min TTL — macro data changes slowly)
// Rate limits: FRED free tier = 120 requests/minute (we cache, so
//              we use ~12 requests per hour worst-case)

import { referenceCache, LruCache } from "@/lib/aurienta/cache";
import { logger } from "@/lib/aurienta/logger";

// ── Types ──────────────────────────────────────────────────────────────────

export type MacroSeries = {
  id: string;              // FRED series ID
  name: string;
  category: "egypt" | "us_rates" | "us_inflation" | "us_labor";
  unit: string;            // display unit
  frequency: string;       // Daily | Monthly | Quarterly | Annual
  description: string;
  higherIsBetter?: boolean; // for UI arrows
};

export type MacroObservation = {
  seriesId: string;
  date: string;            // ISO date
  value: number;
};

export type MacroIndicator = MacroObservation & {
  name: string;
  category: MacroSeries["category"];
  unit: string;
  frequency: string;
  description: string;
  higherIsBetter?: boolean;
  fetchedAt: string;
};

// ── Series catalog (verified 2026-11 — all return live data) ───────────────

export const MACRO_SERIES: MacroSeries[] = [
  // ── Egypt macro (IMF/World Bank via FRED) ──
  {
    id: "FPCPITOTLZGEGY",
    name: "Egypt Inflation Rate (CPI, annual %)",
    category: "egypt",
    unit: "%",
    frequency: "Annual",
    description: "Consumer price inflation for Egypt. 14.07% in 2025. Drives CBE policy rate and EGP purchasing power.",
    higherIsBetter: false,
  },
  {
    id: "MKTGDPEGA646NWDB",
    name: "Egypt GDP (current US$)",
    category: "egypt",
    unit: "US$",
    frequency: "Annual",
    description: "Total gross domestic product for Egypt. $365.25B in 2025 — the total addressable market for the economy.",
    higherIsBetter: true,
  },
  {
    id: "NYGDPPCAPKDEGY",
    name: "Egypt GDP per Capita (constant 2017 US$)",
    category: "egypt",
    unit: "US$",
    frequency: "Annual",
    description: "GDP per capita for Egypt. $4,252.64 in 2025. Determines consumer purchasing power and price points.",
    higherIsBetter: true,
  },
  {
    id: "POPTOTEGA647NWDB",
    name: "Egypt Population",
    category: "egypt",
    unit: "persons",
    frequency: "Annual",
    description: "Total population of Egypt. 118.37M in 2025 — the largest market in the Arab world.",
    higherIsBetter: true,
  },
  {
    id: "SLUEM1524ZSEGY",
    name: "Egypt Youth Unemployment (ages 15-24)",
    category: "egypt",
    unit: "%",
    frequency: "Annual",
    description: "Youth unemployment rate for Egypt. 18.29% in 2025. Indicates labor availability for Tier A-B enterprises.",
    higherIsBetter: false,
  },
  {
    id: "WUIEGY",
    name: "World Uncertainty Index — Egypt",
    category: "egypt",
    unit: "index",
    frequency: "Quarterly",
    description: "Uncertainty index for Egypt (0.609 as of Q3 2026). Higher uncertainty = higher risk premium on EGP assets.",
    higherIsBetter: false,
  },
  // ── US rates (capital-flow drivers for EGP) ──
  {
    id: "DFF",
    name: "US Federal Funds Effective Rate",
    category: "us_rates",
    unit: "%",
    frequency: "Daily",
    description: "The Fed's policy rate. 3.88% (Oct 2026). Higher US rates pull capital out of emerging markets like Egypt.",
    higherIsBetter: false,
  },
  {
    id: "DGS10",
    name: "US 10-Year Treasury Yield",
    category: "us_rates",
    unit: "%",
    frequency: "Daily",
    description: "The global risk-free benchmark. 4.98% (Oct 2026). Sets the discount rate for EGP asset valuation.",
    higherIsBetter: false,
  },
  // ── US inflation ──
  {
    id: "T5YIE",
    name: "US 5-Year Breakeven Inflation",
    category: "us_inflation",
    unit: "%",
    frequency: "Daily",
    description: "Market-implied US inflation expectations. 2.46% (Oct 2026). Anchors global inflation expectations.",
    higherIsBetter: false,
  },
  {
    id: "CPIAUCSL",
    name: "US CPI (all items, index)",
    category: "us_inflation",
    unit: "index",
    frequency: "Monthly",
    description: "US consumer price index. 336.298 (Sep 2026). US inflation drives Fed policy and USD strength.",
    higherIsBetter: false,
  },
  // ── US labor ──
  {
    id: "UNRATE",
    name: "US Unemployment Rate",
    category: "us_labor",
    unit: "%",
    frequency: "Monthly",
    description: "US unemployment. 4.2% (Sep 2026). Strong US labor market = hawkish Fed = EGP pressure.",
    higherIsBetter: false,
  },
];

// ── API client ─────────────────────────────────────────────────────────────

const FRED_BASE = "https://api.stlouisfed.org/fred";
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 min — macro data changes slowly

// Dedicated cache for FRED (isolated from reference data so it can be
// invalidated independently)
const fredCache = new LruCache<unknown>({ maxEntries: 64, defaultTtlMs: CACHE_TTL_MS });

export function isFredConfigured(): boolean {
  return Boolean(process.env.FRED_API_KEY);
}

type FredObservation = { date: string; value: string };

async function fredFetch(path: string, params: Record<string, string>): Promise<unknown> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new Error("FRED_API_KEY not configured");
  }
  const url = new URL(`${FRED_BASE}${path}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("file_type", "json");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`FRED API HTTP ${res.status}`);
    }
    const json = (await res.json()) as { error_code?: number; error_message?: string };
    if (json.error_code) {
      throw new Error(`FRED API error ${json.error_code}: ${json.error_message}`);
    }
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Get the latest observation for a FRED series.
 * Cached for 60 minutes.
 */
export async function getLatestObservation(seriesId: string): Promise<MacroObservation | null> {
  const cacheKey = `fred:latest:${seriesId}`;
  const cached = fredCache.get(cacheKey) as MacroObservation | undefined;
  if (cached) return cached;

  try {
    const result = (await fredFetch("/series/observations", {
      series_id: seriesId,
      sort_order: "desc",
      limit: "1",
    })) as { observations?: FredObservation[] };

    const obs = result.observations?.[0];
    if (!obs || obs.value === "." || isNaN(Number(obs.value))) {
      return null;
    }
    const observation: MacroObservation = {
      seriesId,
      date: obs.date,
      value: Number(obs.value),
    };
    fredCache.set(cacheKey, observation);
    return observation;
  } catch (e) {
    logger.warn("fred_latest_failed", {
      seriesId,
      err: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

/**
 * Get historical observations for a FRED series (for charts).
 * Cached for 60 minutes.
 */
export async function getObservationHistory(
  seriesId: string,
  limit = 24,
): Promise<MacroObservation[]> {
  const cacheKey = `fred:history:${seriesId}:${limit}`;
  const cached = fredCache.get(cacheKey) as MacroObservation[] | undefined;
  if (cached) return cached;

  try {
    const result = (await fredFetch("/series/observations", {
      series_id: seriesId,
      sort_order: "desc",
      limit: String(limit),
    })) as { observations?: FredObservation[] };

    const observations = (result.observations ?? [])
      .filter((o) => o.value !== "." && !isNaN(Number(o.value)))
      .map((o) => ({ seriesId, date: o.date, value: Number(o.value) }));

    fredCache.set(cacheKey, observations);
    return observations;
  } catch (e) {
    logger.warn("fred_history_failed", {
      seriesId,
      err: e instanceof Error ? e.message : String(e),
    });
    return [];
  }
}

/**
 * Get all configured macro indicators with their latest values.
 * Single call → returns everything the dashboard needs.
 */
export async function getAllMacroIndicators(): Promise<{
  configured: boolean;
  indicators: MacroIndicator[];
  errors: string[];
}> {
  if (!isFredConfigured()) {
    return {
      configured: false,
      indicators: [],
      errors: ["FRED_API_KEY not configured"],
    };
  }

  // Fetch all series in parallel (11 series → 11 requests, well within limits)
  const results = await Promise.allSettled(
    MACRO_SERIES.map(async (series) => {
      const obs = await getLatestObservation(series.id);
      if (!obs) return null;
      return {
        seriesId: obs.seriesId,
        date: obs.date,
        value: obs.value,
        name: series.name,
        category: series.category,
        unit: series.unit,
        frequency: series.frequency,
        description: series.description,
        higherIsBetter: series.higherIsBetter,
        fetchedAt: new Date().toISOString(),
      } satisfies MacroIndicator;
    }),
  );

  const indicators: MacroIndicator[] = [];
  const errors: string[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled" && r.value !== null) {
      indicators.push(r.value);
    } else if (r.status === "rejected") {
      errors.push(`${MACRO_SERIES[i].id}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
    }
  }

  return { configured: true, indicators, errors };
}

/**
 * Get a summary of key macro metrics for AI context (Brain AI).
 * Returns a compact object suitable for embedding in AI prompts.
 */
export async function getMacroContextForAI(): Promise<string> {
  const { indicators } = await getAllMacroIndicators();
  if (indicators.length === 0) return "Macro data unavailable (FRED not configured or unreachable).";

  const egyptInflation = indicators.find((i) => i.seriesId === "FPCPITOTLZGEGY");
  const egyptGdp = indicators.find((i) => i.seriesId === "MKTGDPEGA646NWDB");
  const egyptGdpCapita = indicators.find((i) => i.seriesId === "NYGDPPCAPKDEGY");
  const egyptPop = indicators.find((i) => i.seriesId === "POPTOTEGA647NWDB");
  const egyptYouthUnemp = indicators.find((i) => i.seriesId === "SLUEM1524ZSEGY");
  const fedFunds = indicators.find((i) => i.seriesId === "DFF");
  const treasury10y = indicators.find((i) => i.seriesId === "DGS10");

  const lines = [
    "EGYPT MACRO CONTEXT (FRED, live):",
    egyptInflation ? `- Inflation: ${egyptInflation.value.toFixed(1)}% (Egypt, annual, ${egyptInflation.date.slice(0, 4)})` : null,
    egyptGdp ? `- GDP: $${(egyptGdp.value / 1e9).toFixed(1)}B (Egypt, ${egyptGdp.date.slice(0, 4)})` : null,
    egyptGdpCapita ? `- GDP per capita: $${egyptGdpCapita.value.toFixed(0)} (constant 2017 US$, ${egyptGdpCapita.date.slice(0, 4)})` : null,
    egyptPop ? `- Population: ${(egyptPop.value / 1e6).toFixed(1)}M (${egyptPop.date.slice(0, 4)})` : null,
    egyptYouthUnemp ? `- Youth unemployment: ${egyptYouthUnemp.value.toFixed(1)}% (${egyptYouthUnemp.date.slice(0, 4)})` : null,
    "GLOBAL RATE CONTEXT (EGP drivers):",
    fedFunds ? `- Fed funds rate: ${fedFunds.value.toFixed(2)}% (${fedFunds.date})` : null,
    treasury10y ? `- US 10Y treasury: ${treasury10y.value.toFixed(2)}% (${treasury10y.date})` : null,
  ].filter(Boolean);

  return lines.join("\n");
}
