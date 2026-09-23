// AURIENTA Block Trade Rules — Blueprint §6.4 (Secondary Market).
//
// Block trades are large Equity Unit orders that bypass the standard order
// book and its ±5% price band. Per the blueprint:
//   • MIN_BLOCK_SIZE = 1000 Equity Units — below this, the order is a standard
//     market order routed through the matching engine.
//   • MAX_BLOCK_DISCOUNT = 3% — block trades can be priced up to 3% below
//     the fundamental price (institutional discount for size). Premium-priced
//     blocks (above fundamental) are also capped at +3%.
//   • BLOCK_SETTLEMENT_DAYS = 3 — T+3 settlement for block trades (vs. T+2
//     for standard trades).
//
// Block trades skip the ±5% price band enforced by matching-engine.ts and
// use the block-specific ±3% band instead.

export const MIN_BLOCK_SIZE = 1000; // Equity Units — below this, standard order
export const MAX_BLOCK_DISCOUNT = 0.03; // 3% — block trades can be ±3% off fundamental
export const BLOCK_SETTLEMENT_DAYS = 3; // T+3 settlement (vs T+2 standard)
export const STANDARD_SETTLEMENT_DAYS = 2; // T+2 for non-block trades
export const BLOCK_PRICE_BAND = 0.03; // ±3% band for block trades
export const STANDARD_PRICE_BAND = 0.05; // ±5% band for standard trades

// ── Is this a block trade? ──
// Returns true when the quantity meets or exceeds the minimum block size.
// Equity Units are integers (you cannot own a fractional Equity Unit on the
// AURIENTA ledger), so we round before comparing.
export function isBlockTrade(quantity: number): boolean {
  if (!Number.isFinite(quantity) || quantity <= 0) return false;
  return Math.floor(quantity) >= MIN_BLOCK_SIZE;
}

export type BlockPriceValidation = {
  valid: boolean;
  blockTrade: boolean;
  fundamentalPrice: number;
  proposedPrice: number;
  deviationPct: number; // signed: negative = below fundamental, positive = above
  reason?: string;
  // Which band was applied (for audit transparency)
  bandApplied: "block" | "standard";
  bandLower: number;
  bandUpper: number;
};

// ── Validate a proposed price against the applicable band ──
// If the order is a block trade (quantity is unknown here — caller decides
// which band to apply via the `blockTrade` flag), the ±3% block band is used.
// Otherwise the ±5% standard band applies. The band is computed from the
// fundamental (NAV-based) Equity Unit Price.
//
// Use the `blockTrade` flag explicitly. The block band ±3% is stricter than
// the standard band ±5%, so block trades that "graduate" to block size cannot
// sneak under the looser band.
export function validateBlockPrice(
  price: number,
  fundamentalPrice: number,
  blockTrade = true
): BlockPriceValidation {
  const safeFundamental = Math.max(0, fundamentalPrice);
  const safePrice = Math.max(0, price);

  const band = blockTrade ? BLOCK_PRICE_BAND : STANDARD_PRICE_BAND;
  const bandLower = safeFundamental * (1 - band);
  const bandUpper = safeFundamental * (1 + band);
  const deviationPct =
    safeFundamental > 0 ? (safePrice - safeFundamental) / safeFundamental : 0;

  const withinBand = safePrice >= bandLower - 1e-9 && safePrice <= bandUpper + 1e-9;

  if (!withinBand) {
    const direction = safePrice < bandLower ? "below" : "above";
    return {
      valid: false,
      blockTrade,
      fundamentalPrice: safeFundamental,
      proposedPrice: safePrice,
      deviationPct: Number(deviationPct.toFixed(6)),
      reason: `Block trade price ${safePrice.toFixed(2)} EGP is ${direction} the ${blockTrade ? "block" : "standard"} ±${(band * 100).toFixed(0)}% band [${bandLower.toFixed(2)}, ${bandUpper.toFixed(2)}] EGP — fundamentals gate (Blueprint §6.4).`,
      bandApplied: blockTrade ? "block" : "standard",
      bandLower: Number(bandLower.toFixed(4)),
      bandUpper: Number(bandUpper.toFixed(4)),
    };
  }

  return {
    valid: true,
    blockTrade,
    fundamentalPrice: safeFundamental,
    proposedPrice: safePrice,
    deviationPct: Number(deviationPct.toFixed(6)),
    bandApplied: blockTrade ? "block" : "standard",
    bandLower: Number(bandLower.toFixed(4)),
    bandUpper: Number(bandUpper.toFixed(4)),
  };
}

export type BlockSettlement = {
  blockTrade: boolean;
  settlementDays: number;
  settlementDate: string; // ISO 8601
  tradeDate: string; // ISO 8601
  // Discount applied (if any) for audit transparency — negative = discount, positive = premium
  discountPct: number;
  // The fees applied — block trades use the same fee schedule as standard
  // (5% platform + 2.5% advisory + 0.5% antifragility reserve = 8% total).
  // This module does not recompute fees; it returns the structure the
  // executor should record on the Trade row.
  grossEgp: number;
  netToSellerEgp: number;
  buyerPaysEgp: number;
};

// ── Calculate the settlement terms for a trade ──
// Accepts the minimal trade shape and returns the settlement date + the
// post-fee cash flows. Block trades settle T+3; standard trades T+2.
//
// The `trade` arg is deliberately a plain interface so this helper can be
// called both BEFORE persistence (for preview/validation) and AFTER (for
// settlement scheduling) without coupling to the Prisma Trade type.
export function calculateBlockSettlement(trade: {
  quantity: number;
  priceEgp: number;
  fundamentalPrice?: number;
  totalFeesRate?: number; // decimal — default 0.08 (8% split-settlement)
  tradeDate?: Date;
}): BlockSettlement {
  const block = isBlockTrade(trade.quantity);
  const settlementDays = block ? BLOCK_SETTLEMENT_DAYS : STANDARD_SETTLEMENT_DAYS;
  const tradeDate = trade.tradeDate ?? new Date();
  const settlementDate = new Date(
    tradeDate.getTime() + settlementDays * 86_400_000
  );

  const grossEgp = Math.max(0, trade.quantity) * Math.max(0, trade.priceEgp);
  const feesRate = trade.totalFeesRate ?? 0.08;
  const feesEgp = grossEgp * feesRate;

  // Block discount is informational here — the actual price has already been
  // validated against the band by validateBlockPrice() above. We compute it
  // only for audit transparency in the settlement record.
  const discountPct =
    trade.fundamentalPrice && trade.fundamentalPrice > 0
      ? (trade.priceEgp - trade.fundamentalPrice) / trade.fundamentalPrice
      : 0;

  return {
    blockTrade: block,
    settlementDays,
    settlementDate: settlementDate.toISOString(),
    tradeDate: tradeDate.toISOString(),
    discountPct: Number(discountPct.toFixed(6)),
    grossEgp: Number(grossEgp.toFixed(2)),
    netToSellerEgp: Number((grossEgp - feesEgp).toFixed(2)),
    buyerPaysEgp: Number((grossEgp + feesEgp).toFixed(2)),
  };
}
