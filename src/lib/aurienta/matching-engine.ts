// AURIENTA FIFO Matching Engine — Blueprint §9.6
// ═══════════════════════════════════════════════════════════════
// Strict FIFO (first-in, first-out) matching engine for the
// constitutional secondary market (Phase 3 — general market).
//
// Algorithm (per blueprint §9.6.1):
//   1. Sell orders are queued by timestamp (oldest first).
//   2. Buy orders are matched against the oldest sell order that
//      satisfies price (within band).
//   3. Partial fills are allowed; remaining portion stays at front
//      of queue.
//   4. If multiple buy orders at same price, they are matched in
//      timestamp order.
//
// This engine runs AFTER a new order is created. If the new order
// is a BUY, it matches against existing SELL orders (oldest first).
// If the new order is a SELL, it matches against existing BUY orders
// (oldest first). The match price is the price of the order that was
// in the book first (the "maker" order), not the incoming "taker".
//
// All matches are recorded as Trade records + ledger events inside a
// single transaction. Ownership records are updated atomically.

import { db } from "@/lib/db";
import type { PrismaTransaction } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";

export type MatchResult = {
  tradesCreated: number;
  totalEquityUnitsMatched: number;
  totalValueEgp: number;
  newOrderFullyFilled: boolean;
  newOrderRemainingUnits: number;
};

/**
 * Run the FIFO matching engine for a newly created order.
 *
 * @param newOrderId — the ID of the just-created TradeOrder
 * @returns match summary
 */
export async function runFifoMatching(newOrderId: string): Promise<MatchResult> {
  return db.$transaction(async (tx) => {
    // Fetch the new order with lock-like semantics (re-read inside tx)
    const newOrder = await tx.tradeOrder.findUnique({
      where: { id: newOrderId },
      include: { enterprise: true },
    });
    if (!newOrder) {
      return {
        tradesCreated: 0,
        totalEquityUnitsMatched: 0,
        totalValueEgp: 0,
        newOrderFullyFilled: false,
        newOrderRemainingUnits: 0,
      };
    }

    // Skip if already fully filled or cancelled
    if (newOrder.status === "filled" || newOrder.status === "cancelled") {
      return {
        tradesCreated: 0,
        totalEquityUnitsMatched: 0,
        totalValueEgp: 0,
        newOrderFullyFilled: newOrder.status === "filled",
        newOrderRemainingUnits: 0,
      };
    }

    const remainingNew = newOrder.equityUnits - newOrder.filledEquityUnits;
    if (remainingNew <= 0) {
      return {
        tradesCreated: 0,
        totalEquityUnitsMatched: 0,
        totalValueEgp: 0,
        newOrderFullyFilled: true,
        newOrderRemainingUnits: 0,
      };
    }

    // Find matching counterparties.
    // If new order is BUY, match against SELL orders (oldest first).
    // If new order is SELL, match against BUY orders (oldest first).
    // Match condition: counterparty price is within the ±5% band of
    // the fundamental price AND the prices cross (buy price >= sell price).
    const oppositeSide = newOrder.side === "buy" ? "sell" : "buy";
    const fundamentalPrice = newOrder.enterprise.equityUnitPriceEgp;
    const bandLower = fundamentalPrice * 0.95;
    const bandUpper = fundamentalPrice * 1.05;

    const candidates = await tx.tradeOrder.findMany({
      where: {
        enterpriseId: newOrder.enterpriseId,
        side: oppositeSide,
        status: { in: ["open", "partially_filled"] },
        phase: newOrder.phase,
        // Price must be within band
        priceEgp: { gte: bandLower, lte: bandUpper },
        // Exclude the new order itself (shouldn't match, but safety check)
        id: { not: newOrder.id },
      },
      orderBy: { createdAt: "asc" }, // FIFO — oldest first
    });

    let tradesCreated = 0;
    let totalMatched = 0;
    let totalValue = 0;
    let newOrderFilled = newOrder.filledEquityUnits;

    for (const counterOrder of candidates) {
      if (newOrderFilled >= newOrder.equityUnits) break; // new order fully filled

      // Check price crossing:
      // If new is BUY: newOrder.priceEgp >= counterOrder.priceEgp (buyer willing to pay at least seller's ask)
      // If new is SELL: newOrder.priceEgp <= counterOrder.priceEgp (seller willing to accept at least buyer's bid)
      const pricesCross =
        newOrder.side === "buy"
          ? newOrder.priceEgp >= counterOrder.priceEgp
          : newOrder.priceEgp <= counterOrder.priceEgp;

      if (!pricesCross) continue;

      // Calculate match quantity
      const counterRemaining = counterOrder.equityUnits - counterOrder.filledEquityUnits;
      if (counterRemaining <= 0) continue;

      const matchQty = Math.min(
        newOrder.equityUnits - newOrderFilled,
        counterRemaining
      );

      // Match price = the maker order's price (the one that was in the book first)
      // The counterOrder is older (it was in the book first), so its price is the match price.
      const matchPrice = counterOrder.priceEgp;
      const grossEgp = +(matchPrice * matchQty).toFixed(2);
      const platformFeeEgp = +(grossEgp * 0.005).toFixed(2); // 0.5%

      // CGT only on sells (capital gains tax — 10%)
      const sellerId = newOrder.side === "buy" ? counterOrder.userId : newOrder.userId;
      const cgtEgp = +(grossEgp * 0.1).toFixed(2);

      // Buyer pays gross + platformFee
      // Seller receives gross - platformFee - cgt
      const buyerId = newOrder.side === "buy" ? newOrder.userId : counterOrder.userId;
      const buyOrderId = newOrder.side === "buy" ? newOrder.id : counterOrder.id;
      const sellOrderId = newOrder.side === "buy" ? counterOrder.id : newOrder.id;

      // Create the Trade record
      const trade = await tx.trade.create({
        data: {
          enterpriseId: newOrder.enterpriseId,
          buyOrderId,
          sellOrderId,
          buyerId,
          sellerId,
          equityUnits: matchQty,
          priceEgp: matchPrice,
          grossEgp,
          platformFeeEgp,
          cgtEgp,
          totalEgp: grossEgp, // stored as gross for simplicity
          phase: newOrder.phase,
        },
      });

      // Update the counter-order's filled quantity + status
      const counterNewFilled = counterOrder.filledEquityUnits + matchQty;
      const counterNewStatus =
        counterNewFilled >= counterOrder.equityUnits ? "filled" : "partially_filled";
      await tx.tradeOrder.update({
        where: { id: counterOrder.id },
        data: {
          filledEquityUnits: counterNewFilled,
          status: counterNewStatus,
        },
      });

      // Update the new order's filled quantity
      newOrderFilled += matchQty;

      // Transfer ownership: update the seller's and buyer's OwnershipRecords
      // Seller: decrement equityUnits
      // Buyer: increment equityUnits (or create if doesn't exist)
      const sellerHolding = await tx.ownershipRecord.findUnique({
        where: {
          enterpriseId_userId: {
            enterpriseId: newOrder.enterpriseId,
            userId: sellerId,
          },
        },
      });

      if (sellerHolding) {
        await tx.ownershipRecord.update({
          where: { id: sellerHolding.id },
          data: {
            equityUnits: { decrement: matchQty },
          },
        });
      }

      const buyerHolding = await tx.ownershipRecord.findUnique({
        where: {
          enterpriseId_userId: {
            enterpriseId: newOrder.enterpriseId,
            userId: buyerId,
          },
        },
      });

      if (buyerHolding) {
        await tx.ownershipRecord.update({
          where: { id: buyerHolding.id },
          data: {
            equityUnits: { increment: matchQty },
            avgPriceEgp:
              (buyerHolding.avgPriceEgp * buyerHolding.equityUnits +
                matchPrice * matchQty) /
              (buyerHolding.equityUnits + matchQty),
          },
        });
      } else {
        await tx.ownershipRecord.create({
          data: {
            enterpriseId: newOrder.enterpriseId,
            userId: buyerId,
            equityUnits: matchQty,
            avgPriceEgp: matchPrice,
            acquiredAt: new Date(),
          },
        });
      }

      // Append ledger event for the match
      await appendLedgerEvent(tx, {
        enterpriseId: newOrder.enterpriseId,
        eventType: "trade_matched",
        payload: {
          tradeId: trade.id,
          buyOrderId,
          sellOrderId,
          buyerId,
          sellerId,
          equityUnits: matchQty,
          priceEgp: matchPrice,
          grossEgp,
          platformFeeEgp,
          cgtEgp,
          phase: newOrder.phase,
          matchingEngine: "FIFO",
          note: `FIFO match: ${matchQty} units at ${matchPrice} EGP`,
        },
        actorId: buyerId, // the taker triggered the match
      });

      tradesCreated++;
      totalMatched += matchQty;
      totalValue += grossEgp;
    }

    // Update the new order's status
    const newOrderStatus =
      newOrderFilled >= newOrder.equityUnits ? "filled" : "partially_filled";
    await tx.tradeOrder.update({
      where: { id: newOrder.id },
      data: {
        filledEquityUnits: newOrderFilled,
        status: newOrderStatus,
      },
    });

    return {
      tradesCreated,
      totalEquityUnitsMatched: totalMatched,
      totalValueEgp: +totalValue.toFixed(2),
      newOrderFullyFilled: newOrderFilled >= newOrder.equityUnits,
      newOrderRemainingUnits: newOrder.equityUnits - newOrderFilled,
    };
  });
}

/**
 * Cancel an open order. Only the order owner can cancel.
 * Orders that are partially filled keep their filled portion;
 * only the remaining open quantity is cancelled.
 */
export async function cancelOrder(
  orderId: string,
  userId: string
): Promise<{ ok: boolean; reason?: string }> {
  const order = await db.tradeOrder.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, reason: "Order not found" };
  if (order.userId !== userId) return { ok: false, reason: "Not the order owner" };
  if (order.status === "filled") return { ok: false, reason: "Order already fully filled" };
  if (order.status === "cancelled") return { ok: false, reason: "Order already cancelled" };

  await db.tradeOrder.update({
    where: { id: orderId },
    data: { status: "cancelled" },
  });

  await db.$transaction(async (tx) => {
    await appendLedgerEvent(tx, {
      enterpriseId: order.enterpriseId,
      eventType: "order_cancelled",
      payload: {
        orderId: order.id,
        side: order.side,
        originalUnits: order.equityUnits,
        filledUnits: order.filledEquityUnits,
        cancelledUnits: order.equityUnits - order.filledEquityUnits,
        userId,
      },
      actorId: userId,
    });
  });

  return { ok: true };
}
