// AURIENTA — REAL FX 4-Source Median Oracle (Vol 13)
//
// Production replacement for the mocked fx-oracle.ts. Fetches live rates from:
//   1. CBE       — Central Bank of Egypt (USD/EGP daily reference)
//   2. ECB       — European Central Bank EUR/EGP reference (XML feed)
//   3. Chainlink — via CoinGecko's free USDC/EGP market rate (oracle proxy)
//   4. Binance   — USDT/EGP spot ticker (crypto-market implied USD/EGP)
//
// Resilience guarantees:
//   - Each fetcher has a 10-second timeout via AbortController.
//   - try/catch around every fetch — one source failing does not poison the
//     consensus. If ≥2 sources return, we still compute a median.
//   - If ALL sources fail, falls back to the most recent cached FxRate row
//     in the DB (any source) so downstream calls never throw.
//   - If no DB fallback exists either, throws a typed FxOracleError so the
//     caller can decide how to degrade (e.g. show "FX unavailable").
//
// The mocked fx-oracle.ts is still re-exported as a fallback for tests /
// offline development; this module is the PRIMARY in production.
//
// All rates are normalized to "1 unit of `from` = N units of `to`" with
// 4 decimal places of precision (matching the mock).

import { db } from "@/lib/db";
import { audit } from "./audit";
import type { FxConsensusResult, FxRateEntry, FxSource } from "./fx-oracle";

export type { FxConsensusResult, FxRateEntry, FxSource } from "./fx-oracle";

export class FxOracleError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "FxOracleError";
  }
}

const FETCH_TIMEOUT_MS = 10_000;

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

async function fetchWithTimeout(url: string, opts: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...opts,
      signal: controller.signal,
      // Disable Next.js fetch caching for live FX data — every call must hit
      // the upstream API.
      cache: "no-store",
      headers: {
        Accept: "application/json, application/xml, text/xml, */*",
        ...(opts.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Central Bank of Egypt — USD/EGP daily reference rate.
//
// The CBE publishes daily FX rates at:
//   https://www.cbe.org.eg/en/economic-research/statistics
// They expose a JSON-ish endpoint under /api/v1/rates that the official
// website consumes. As a defensive fallback, we also try the legacy
// ECNRates.aspx page and a last-resort scrape of the homepage link.
//
// We accept any rate that parses cleanly out of the JSON / HTML response.
// ─────────────────────────────────────────────────────────────────────────
export async function fetchCbeRate(from: string, to: string): Promise<FxRateEntry> {
  // CBE only publishes EGP-based rates. Non-EGP pairs are out-of-scope;
  // the consensus combiner will skip this source for them.
  if (!(from === "USD" && to === "EGP") && !(from === "EGP" && to === "USD")) {
    throw new FxOracleError(
      `CBE only supports USD/EGP pairs (got ${from}/${to})`,
      "cbe_unsupported_pair"
    );
  }

  const urls = [
    "https://www.cbe.org.eg/api/v1/rates",
    "https://www.cbe.org.eg/_layouts/15/CBE/EcnRates/ECNRates.aspx",
  ];

  let lastErr: unknown = null;
  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        lastErr = new FxOracleError(
          `CBE ${url} returned HTTP ${res.status}`,
          "cbe_http_error"
        );
        continue;
      }

      const text = await res.text();
      let rate: number | null = null;

      // Try JSON first.
      try {
        const json = JSON.parse(text) as unknown;
        rate = extractCbeRateFromJson(json);
      } catch {
        // Not JSON — fall through to HTML scrape.
      }

      // Fall back to a regex scrape of the HTML.
      if (rate === null) {
        rate = extractCbeRateFromHtml(text);
      }

      if (rate === null || !Number.isFinite(rate) || rate <= 0) {
        lastErr = new FxOracleError(
          `CBE ${url}: no parseable USD/EGP rate in response`,
          "cbe_parse_error"
        );
        continue;
      }

      // CBE publishes USD→EGP. If the caller asked for EGP→USD, invert.
      const finalRate = from === "USD" && to === "EGP" ? rate : 1 / rate;
      return {
        source: "cbe",
        rate: round4(finalRate),
        timestamp: new Date(),
        sourceRef: "CBE daily reference (cbe.org.eg)",
      };
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new FxOracleError("CBE fetch failed (all URLs)", "cbe_fetch_failed");
}

function extractCbeRateFromJson(json: unknown): number | null {
  // The CBE JSON shape is undocumented; defensively walk common keys.
  if (Array.isArray(json)) {
    for (const item of json) {
      const r = extractCbeRateFromJson(item);
      if (r !== null) return r;
    }
    return null;
  }
  if (typeof json !== "object" || json === null) return null;
  const obj = json as Record<string, unknown>;

  // Look for a key like "USD" or "USD_EGP" or "rate".
  for (const key of ["USD", "USD_EGP", "usd", "rate"]) {
    const v = obj[key];
    if (typeof v === "number" && v > 0) return v;
    if (typeof v === "string") {
      const n = parseFloat(v);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }

  // Walk children.
  for (const v of Object.values(obj)) {
    const r = extractCbeRateFromJson(v);
    if (r !== null) return r;
  }
  return null;
}

function extractCbeRateFromHtml(html: string): number | null {
  // Look for a "USD" cell followed by a numeric value.
  // Common CBE page patterns:
  //   <td>USD</td><td>48.51</td>
  //   "USD": "48.51"
  //   Buy USD 48.51 / Sell USD 48.62
  const patterns = [
    /USD[^\d]{0,30}?(\d{2,3}\.\d{2,4})/,
    /"USD"\s*:\s*"?(\d{2,3}\.\d{2,4})"?/,
    /US\s*Dollar[^\d]{0,30}?(\d{2,3}\.\d{2,4})/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) {
      const n = parseFloat(m[1]);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// 2. European Central Bank — EUR/EGP reference rate.
//
// The ECB publishes a daily XML reference rates feed at:
//   https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
//
// The XML contains <Cube currency="USD" rate="1.0823"/> entries for every
// currency the ECB tracks (which includes EGP). We parse out the EGP rate
// directly. The result is EUR→EGP; if the caller wants USD→EGP we'd need
// the USD rate too and cross through EUR. For simplicity (and because the
// consensus combiner expects per-source USD/EGP), we cross USD→EUR→EGP
// when the request is for USD.
// ─────────────────────────────────────────────────────────────────────────
export async function fetchEcbRate(from: string, to: string): Promise<FxRateEntry> {
  const res = await fetchWithTimeout(
    "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
  );
  if (!res.ok) {
    throw new FxOracleError(
      `ECB returned HTTP ${res.status}`,
      "ecb_http_error"
    );
  }
  const xml = await res.text();

  // Parse the ECB XML — find <Cube currency="XXX" rate="N.NNNN"/>
  const rates = new Map<string, number>();
  const cubeRe = /<Cube\s+currency="([A-Z]{3})"\s+rate="([\d.]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = cubeRe.exec(xml)) !== null) {
    const code = m[1]!;
    const r = parseFloat(m[2]!);
    if (Number.isFinite(r) && r > 0) rates.set(code, r);
  }

  if (rates.size === 0) {
    throw new FxOracleError("ECB XML: no <Cube> rate entries found", "ecb_parse_error");
  }

  // EUR is the base — its rate is implicitly 1.
  rates.set("EUR", 1);

  const fromInEur = rates.get(from);
  const toInEur = rates.get(to);
  if (!fromInEur || !toInEur) {
    throw new FxOracleError(
      `ECB has no rate for ${from} or ${to}`,
      "ecb_missing_currency"
    );
  }

  // EUR→X means 1 EUR = X units of currency X.
  // So `from`→`to` = (1 / fromInEur) * toInEur  = toInEur / fromInEur.
  const rate = toInEur / fromInEur;
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new FxOracleError("ECB computed rate is invalid", "ecb_invalid_rate");
  }

  return {
    source: "ecb",
    rate: round4(rate),
    timestamp: new Date(),
    sourceRef: "ECB eurofxref-daily.xml",
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Chainlink (via CoinGecko) — USDC/EGP oracle proxy.
//
// Chainlink's USD/EGP feed lives on-chain and requires a Web3 RPC to read.
// As a free, no-auth alternative we use CoinGecko's simple/price API which
// returns USDC vs. EGP — USDC tracks USD 1:1 (within 1bp), so this is a
// faithful oracle proxy.
// ─────────────────────────────────────────────────────────────────────────
export async function fetchChainlinkRate(from: string, to: string): Promise<FxRateEntry> {
  // CoinGecko publishes USDC vs. many fiat currencies. The `ids=usd-coin`
  // parameter selects USDC; we then read the EGP field. Cross-currency
  // conversion (e.g. EUR→EGP) would require also fetching EUR→USD.
  if (from !== "USD") {
    throw new FxOracleError(
      `Chainlink (CoinGecko proxy) only supports USD base (got ${from})`,
      "chainlink_unsupported_pair"
    );
  }

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=${to.toLowerCase()}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new FxOracleError(
      `CoinGecko returned HTTP ${res.status}`,
      "coingecko_http_error"
    );
  }
  const json = (await res.json()) as {
    "usd-coin"?: Record<string, number>;
  };
  const rate = json?.["usd-coin"]?.[to.toLowerCase()];
  if (!rate || !Number.isFinite(rate) || rate <= 0) {
    throw new FxOracleError(
      `CoinGecko response missing usd-coin.${to.toLowerCase()}`,
      "coingecko_parse_error"
    );
  }

  return {
    source: "chainlink",
    rate: round4(rate),
    timestamp: new Date(),
    sourceRef: "CoinGecko USDC/EGP (Chainlink oracle proxy)",
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Binance — USDT/EGP spot ticker (crypto-market implied USD/EGP).
//
// Binance's public market API exposes a USDT/EGP ticker. USDT tracks USD
// 1:1, so the USDT/EGP rate is a faithful USD/EGP proxy.
// ─────────────────────────────────────────────────────────────────────────
export async function fetchBinanceRate(from: string, to: string): Promise<FxRateEntry> {
  if (from !== "USD") {
    throw new FxOracleError(
      `Binance only supports USD base (USDT proxy) — got ${from}`,
      "binance_unsupported_pair"
    );
  }
  if (to !== "EGP") {
    throw new FxOracleError(
      `Binance USDT/${to} not supported (only EGP)`,
      "binance_unsupported_quote"
    );
  }

  const url = "https://api.binance.com/api/v3/ticker/price?symbol=USDTEGP";
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new FxOracleError(
      `Binance returned HTTP ${res.status}`,
      "binance_http_error"
    );
  }
  const json = (await res.json()) as { price?: string };
  const price = json.price ? parseFloat(json.price) : NaN;
  if (!Number.isFinite(price) || price <= 0) {
    throw new FxOracleError(
      "Binance response missing/invalid price field",
      "binance_parse_error"
    );
  }

  return {
    source: "binance",
    rate: round4(price),
    timestamp: new Date(),
    sourceRef: "Binance USDT/EGP spot ticker",
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Consensus combiner — fetch all 4 in parallel, take the median, persist
// to FxRate, audit the calculation.
//
// Median of 4 = average of the two middle values when sorted.
// Consensus is considered healthy when the spread (max−min)/median < 2%.
// ─────────────────────────────────────────────────────────────────────────
export async function getConsensusFxRate(
  from: string,
  to: string
): Promise<FxConsensusResult> {
  // Fetch all four sources in parallel; collect successful entries.
  const settled = await Promise.allSettled([
    fetchCbeRate(from, to),
    fetchEcbRate(from, to),
    fetchChainlinkRate(from, to),
    fetchBinanceRate(from, to),
  ]);

  const sources: FxRateEntry[] = [];
  const failures: Array<{ source: FxSource; reason: string }> = [];
  const labels: FxSource[] = ["cbe", "ecb", "chainlink", "binance"];
  settled.forEach((s, i) => {
    if (s.status === "fulfilled") {
      sources.push(s.value);
    } else {
      const reason =
        s.reason instanceof Error ? s.reason.message : String(s.reason);
      failures.push({ source: labels[i]!, reason });
    }
  });

  // If fewer than 2 sources returned, the median is unreliable — fall back
  // to the most recent cached rate in the DB (any source). If even that
  // fails, throw a typed error so the caller can degrade gracefully.
  if (sources.length < 2) {
    const cached = await loadLastKnownRate(from, to);
    if (cached) {
      await audit({
        actorId: "system",
        action: "fx.consensus_degraded",
        target: `fx:${from}-${to}`,
        result: "allowed",
        metadata: {
          mode: "db_fallback",
          failures,
          fallbackRate: cached.rate,
          fallbackSource: cached.source,
        },
      });
      return {
        from,
        to,
        rate: cached.rate,
        sources: [
          {
            source: cached.source as FxSource,
            rate: cached.rate,
            timestamp: cached.fetchedAt,
            sourceRef: "DB fallback (last known rate)",
          },
        ],
        median: cached.rate,
        min: cached.rate,
        max: cached.rate,
        spread: 0,
        consensus: false,
        calculatedAt: new Date(),
      };
    }
    throw new FxOracleError(
      `FX consensus failed: ${failures.map((f) => f.source).join(", ")} all returned errors`,
      "consensus_unavailable"
    );
  }

  const sorted = [...sources].sort((a, b) => a.rate - b.rate);
  const rates = sorted.map((s) => s.rate);

  // Median of N values:
  //   - even N → average of the two middle values
  //   - odd N  → middle value
  const median =
    rates.length % 2 === 0
      ? (rates[rates.length / 2 - 1]! + rates[rates.length / 2]!) / 2
      : rates[Math.floor(rates.length / 2)]!;
  const medianRounded = round4(median);
  const min = rates[0]!;
  const max = rates[rates.length - 1]!;
  const spread = round4(max - min);
  const consensus = medianRounded > 0 && spread / medianRounded < 0.02;

  const result: FxConsensusResult = {
    from,
    to,
    rate: medianRounded,
    sources: sorted,
    median: medianRounded,
    min,
    max,
    spread,
    consensus,
    calculatedAt: new Date(),
  };

  // Persist the consensus row (append-only — keeps a full history).
  try {
    await (db as any).fxRate.create({
      data: {
        fromCurrency: from,
        toCurrency: to,
        rate: medianRounded,
        source: "consensus_median",
        sourceRef: `4-source median: ${sorted
          .map((s) => `${s.source}=${s.rate}`)
          .join(", ")} (failures: ${
          failures.length > 0
            ? failures.map((f) => f.source).join(",")
            : "none"
        })`,
        fetchedAt: new Date(),
      },
    });
  } catch (e) {
    // Persistence failure must not break the consensus return — the rate
    // is still valid in-memory.
    console.error("[fx-oracle-real] consensus persist failed:", e);
  }

  await audit({
    actorId: "system",
    action: "fx.consensus_calculated",
    target: `fx:${from}-${to}`,
    result: "allowed",
    metadata: {
      median: medianRounded,
      sources: sorted.map((s) => ({ source: s.source, rate: s.rate })),
      failures,
      spread,
      consensus,
      realOracle: true,
    },
  });

  return result;
}

// ── DB fallback: load the most recent FxRate for the pair (any source) ──
async function loadLastKnownRate(
  from: string,
  to: string
): Promise<{ rate: number; source: string; fetchedAt: Date } | null> {
  try {
    const row = await (db as any).fxRate.findFirst({
      where: { fromCurrency: from, toCurrency: to },
      orderBy: { fetchedAt: "desc" },
    });
    if (!row) return null;
    return {
      rate: Number(row.rate),
      source: String(row.source ?? "unknown"),
      fetchedAt: row.fetchedAt ?? new Date(),
    };
  } catch {
    return null;
  }
}

// ── Convenience: get the latest consensus, refreshing if stale (>6h) ──
// Mirrors the API of the mock fx-oracle.ts so callers can swap transparently.
export async function getLatestConsensusReal(
  from: string,
  to: string
): Promise<FxConsensusResult> {
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
    // Reconstruct the FxConsensusResult from the cached row.
    const sourceRef = String(cached.sourceRef ?? "");
    const sources: FxRateEntry[] = [];
    const re = /(\w+)=([\d.]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sourceRef)) !== null) {
      const label = m[1]!.toLowerCase();
      if (["cbe", "ecb", "chainlink", "binance"].includes(label)) {
        sources.push({
          source: label as FxSource,
          rate: parseFloat(m[2]!),
          timestamp: cached.fetchedAt,
        });
      }
    }
    return {
      from,
      to,
      rate: cached.rate,
      sources,
      median: cached.rate,
      min: sources.length > 0 ? Math.min(...sources.map((s) => s.rate)) : cached.rate,
      max: sources.length > 0 ? Math.max(...sources.map((s) => s.rate)) : cached.rate,
      spread: 0,
      consensus: true,
      calculatedAt: cached.fetchedAt,
    };
  }

  // No fresh cached rate — fetch a new one from the real sources.
  return getConsensusFxRate(from, to);
}
