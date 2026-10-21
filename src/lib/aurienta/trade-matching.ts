// AURIENTA — Secondary Market Trade Matching (STAGE A)
// ════════════════════════════════════════════════════════════════════
// Discrete trade-matching pass for an enterprise: finds the best open
// buy + sell order pair, validates it against the CRE ±5% price-band
// policy (`enforceTradeMatch`), and — if allowed — records a TradeMatch
// row, marks the orders partially / fully filled, and appends a ledger
// event. Runs as a single transaction; partial fills leave the residual
// quantity on the order for the next matching pass.
//
// The fundamental price is the enterprise's `equityUnitPriceEgp`
// (constitutional Equity Unit Price) — falling back to the latest
// Valuation.equityUnitPriceEgp if present.
//
// NOTE: This is the strategic-economic-model matching pass (STAGE A
// `TradeMatch` records). It is complementary to the high-frequency FIFO
// engine in `matching-engine.ts` — that one runs synchronously after
// each order placement, this one is an on-demand batch reconciliation
// that can be triggered by an operator or a scheduled job.

import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import {
  enforceTradeMatch,
  logCreDecision,
  appendLedgerEvent,
  type CreVerdict,
} from "@/lib/aurienta/cre";

// ─── Types ───────────────────────────────────────────────────────────

export type TradeMatchRecord = {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  enterpriseId: string;
  matchedPriceEgp: number;
  matchedShares: number;
  buyerFeeEgp: number;
  sellerFeeEgp: number;
  creDecisionToken: string | null;
  matchedAt: Date;
};

export type MatchRunSummary = {
  enterpriseId: string;
  matchesCreated: number;
  totalMatchedShares: number;
  totalValueEgp: number;
  verdicts: CreVerdict[]; // every verdict (allowed + denied) for audit
  matchedPriceEgp: number | null; // last successful match price
};

// ─── Helpers ─────────────────────────────────────────────────────────

function toRecord(m: {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  enterpriseId: string;
  matchedPriceEgp: number;
  matchedShares: number;
  buyerFeeEgp: number;
  sellerFeeEgp: number;
  creDecisionToken: string | null;
  matchedAt: Date;
}): TradeMatchRecord {
  return { ...m };
}

/**
 * Pulls the fundamental price used by `enforceTradeMatch` to enforce the
 * ±5% band. Preference order:
 *   1. Latest Valuation.equityUnitPriceEgp (fundamental AI valuation).
 *   2. Enterprise.equityUnitPriceEgp (constitutional Equity Unit Price).
 * Returns null when the enterprise doesn't exist.
 */
export async function getFundamentalPrice(
  enterpriseId: string
): Promise<number | null> {
  const ent = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { equityUnitPriceEgp: true },
  });
  if (!ent) return null;

  const latestValuation = await db.valuation.findFirst({
    where: { enterpriseId },
    orderBy: { createdAt: "desc" },
    select: { equityUnitPriceEgp: true },
  });

  return latestValuation?.equityUnitPriceEgp ?? ent.equityUnitPriceEgp;
}

// ─── matchOrders ────────────────────────────────────────────────────

/**
 * Runs ONE matching pass over the open order book for an enterprise.
 *
 * Algorithm:
 *   1. Read the fundamental price.
 *   2. Pull the highest-priced open BUY order and the lowest-priced open
 *      SELL order (best prices cross first).
 *   3. While a crossing pair exists (buy.price >= sell.price):
 *      a. Call enforceTradeMatch(buy, sell, fundamental).
 *      b. If allowed: match the smaller residual quantity, write TradeMatch,
 *         bump filledEquityUnits on both orders, append a ledger event.
 *      c. If denied: break (the band has been breached — no further
 *         matches possible until orders are amended or cancelled).
 *   4. Return the run summary.
 *
 * The matching is bounded by a `maxMatches` cap (default 50) to keep the
 * transaction size reasonable for a single HTTP request.
 */
export async function matchOrders(
  enterpriseId: string,
  triggeredBy: string,
  maxMatches = 50
): Promise<MatchRunSummary> {
  const fundamentalPrice = await getFundamentalPrice(enterpriseId);
  if (fundamentalPrice === null) {
    return {
      enterpriseId,
      matchesCreated: 0,
      totalMatchedShares: 0,
      totalValueEgp: 0,
      verdicts: [],
      matchedPriceEgp: null,
    };
  }

  const verdicts: CreVerdict[] = [];
  let matchesCreated = 0;
  let totalMatchedShares = 0;
  let totalValueEgp = 0;
  let lastMatchedPrice: number | null = null;

  // Run the entire pass inside one transaction so partial states are
  // never observable mid-run.
  await db.$transaction(async (tx) => {
    for (let i = 0; i < maxMatches; i++) {
      // Best buy = highest price; best sell = lowest price.
      const buy = await tx.tradeOrder.findFirst({
        where: {
          enterpriseId,
          side: "buy",
          status: { in: ["open", "partially_filled"] },
        },
        orderBy: { priceEgp: "desc" },
      });
      const sell = await tx.tradeOrder.findFirst({
        where: {
          enterpriseId,
          side: "sell",
          status: { in: ["open", "partially_filled"] },
        },
        orderBy: { priceEgp: "asc" },
      });

      // No crossing pair (or no orders) → done.
      if (!buy || !sell) break;
      if (buy.priceEgp < sell.priceEgp) break;

      const verdict = enforceTradeMatch({
        enterpriseId,
        buyPrice: buy.priceEgp,
        sellPrice: sell.priceEgp,
        fundamentalPrice,
      });
      verdicts.push(verdict);

      if (!verdict.allowed) {
        // Band breached — stop the matching pass for this run.
        await logCreDecision(tx, {
          enterpriseId,
          policy: verdict.policy,
          verdict,
          actorId: triggeredBy,
          payload: {
            buyOrderId: buy.id,
            sellOrderId: sell.id,
            buyPrice: buy.priceEgp,
            sellPrice: sell.priceEgp,
            fundamentalPrice,
          },
        });
        break;
      }

      const matchedPrice = (buy.priceEgp + sell.priceEgp) / 2;
      const buyRemaining = buy.equityUnits - buy.filledEquityUnits;
      const sellRemaining = sell.equityUnits - sell.filledEquityUnits;
      const matchedShares = Math.min(buyRemaining, sellRemaining);
      if (matchedShares <= 0) break;

      // Constitutional uniform fee: 0.5% on each side (matches the
      // existing orders route convention).
      const buyerFeeEgp = Math.floor(matchedShares * matchedPrice * 0.005);
      const sellerFeeEgp = Math.floor(matchedShares * matchedPrice * 0.005);

      const tradeMatch = await tx.tradeMatch.create({
        data: {
          buyOrderId: buy.id,
          sellOrderId: sell.id,
          enterpriseId,
          matchedPriceEgp: matchedPrice,
          matchedShares,
          buyerFeeEgp,
          sellerFeeEgp,
          creDecisionToken: verdict.decisionToken,
        },
      });

      // Bump fill counts on both orders + flip status when fully filled.
      const newBuyFilled = buy.filledEquityUnits + matchedShares;
      const newSellFilled = sell.filledEquityUnits + matchedShares;
      await tx.tradeOrder.update({
        where: { id: buy.id },
        data: {
          filledEquityUnits: newBuyFilled,
          status:
            newBuyFilled >= buy.equityUnits ? "filled" : "partially_filled",
          feesEgp: { increment: buyerFeeEgp },
        },
      });
      await tx.tradeOrder.update({
        where: { id: sell.id },
        data: {
          filledEquityUnits: newSellFilled,
          status:
            newSellFilled >= sell.equityUnits ? "filled" : "partially_filled",
          feesEgp: { increment: sellerFeeEgp },
        },
      });

      await logCreDecision(tx, {
        enterpriseId,
        policy: verdict.policy,
        verdict,
        actorId: triggeredBy,
        payload: {
          tradeMatchId: tradeMatch.id,
          buyOrderId: buy.id,
          sellOrderId: sell.id,
          matchedPrice,
          matchedShares,
          fundamentalPrice,
        },
      });

      await appendLedgerEvent(tx, {
        enterpriseId,
        eventType: "trade_matched",
        payload: {
          tradeMatchId: tradeMatch.id,
          buyOrderId: buy.id,
          sellOrderId: sell.id,
          matchedPrice,
          matchedShares,
          buyerFeeEgp,
          sellerFeeEgp,
          triggeredBy,
        },
        actorId: triggeredBy,
      });

      matchesCreated++;
      totalMatchedShares += matchedShares;
      totalValueEgp += matchedShares * matchedPrice;
      lastMatchedPrice = matchedPrice;
    }
  });

  await audit({
    actorId: triggeredBy,
    action: "trade.match",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      matchesCreated,
      totalMatchedShares,
      totalValueEgp,
      fundamentalPrice,
      lastMatchedPrice,
    },
  });

  logger.info("trade match pass complete", {
    enterpriseId,
    matchesCreated,
    totalMatchedShares,
    totalValueEgp,
    lastMatchedPrice,
  });

  return {
    enterpriseId,
    matchesCreated,
    totalMatchedShares,
    totalValueEgp,
    verdicts,
    matchedPriceEgp: lastMatchedPrice,
  };
}

// ─── getTradeHistory ────────────────────────────────────────────────

export async function getTradeHistory(
  enterpriseId: string,
  limit = 50
): Promise<TradeMatchRecord[]> {
  const rows = await db.tradeMatch.findMany({
    where: { enterpriseId },
    orderBy: { matchedAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
  return rows.map(toRecord);
}

// ─── getMatchedPrice ────────────────────────────────────────────────

/**
 * Returns the last matched price for an enterprise (the most recent
 * TradeMatch.matchedPriceEgp), or null if no trades have ever matched.
 * Used by the market workspace as the live "last price" feed.
 */
export async function getMatchedPrice(
  enterpriseId: string
): Promise<number | null> {
  const last = await db.tradeMatch.findFirst({
    where: { enterpriseId },
    orderBy: { matchedAt: "desc" },
    select: { matchedPriceEgp: true },
  });
  return last?.matchedPriceEgp ?? null;
}
