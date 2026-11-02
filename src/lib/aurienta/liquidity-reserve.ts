// AURIENTA Liquidity Reserve — Blueprint §6.4.2 (Liquidity Reserve Model).
//
// Each secondary-market trade contributes 2% of its value to the enterprise's
// liquidity reserve. The reserve cushions against redemption pressure and
// provides intraday liquidity for the secondary market. The reserve is
// bounded:
//   • MIN_RESERVE_EGP = 100,000 — below this, trades are throttled and a
//     top-up notice is emitted to the founding operator + accounting firm.
//   • MAX_RESERVE_EGP = 5,000,000 — above this, the surplus is rebated to
//     the enterprise's Law Firm Client Account (escrow) for operating use.
//
// Projection uses a simple moving average (SMA) of recent trades. Phase 5
// will replace this with an LSTM model that incorporates seasonality + macro
// shocks (FX, CBE rate decisions, sector indices).
//
// All amounts in EGP. The reserve is a derived/projection value for now —
// Phase 5 will persist it on the Enterprise model.

import { db } from "@/lib/db";

export const RESERVE_RATIO = 0.02; // 2% of each trade's value
export const MIN_RESERVE_EGP = 100_000;
export const MAX_RESERVE_EGP = 5_000_000;
export const SMA_WINDOW_DAYS = 30; // look-back window for the moving average
export const PROJECTION_HORIZON_DAYS = 30; // how far forward to project

function roundEgp(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Reserve contribution from a single trade ──
// 2% of the trade value (gross, before fees). Capped at the per-trade limit
// implied by the enterprise's MAX_RESERVE — but since the cap is enterprise-
// level (not per-trade), this helper just returns the gross 2% contribution.
// The cap is enforced in checkReserveHealth() below.
export function calculateReserveContribution(tradeValue: number): {
  contribution: number;
  ratio: number;
  capped: boolean;
  // If applied to a trade that would push the enterprise over the ceiling,
  // the surplus is what gets rebated (rather than added to the reserve).
  surplusRebate: number;
} {
  const base = Math.max(0, tradeValue);
  const gross = base * RESERVE_RATIO;
  // Per-trade cap: a single trade can never push the reserve contribution
  // beyond (MAX - MIN). This prevents a single large block trade from
  // over-funding the reserve in one shot.
  const perTradeCap = MAX_RESERVE_EGP - MIN_RESERVE_EGP;
  const capped = gross > perTradeCap;
  const contribution = Math.min(gross, perTradeCap);
  return {
    contribution: roundEgp(contribution),
    ratio: RESERVE_RATIO,
    capped,
    surplusRebate: roundEgp(Math.max(0, gross - perTradeCap)),
  };
}

export type ReserveHealth = {
  enterpriseId: string;
  // Sum of (RESERVE_RATIO × trade gross) over the last SMA_WINDOW_DAYS days.
  currentReserveEgp: number;
  // Simple moving average of daily trade gross value.
  dailySmaEgp: number;
  // Projected reserve at the end of the projection horizon, assuming the SMA
  // continues. Linear projection — no seasonality (Phase 5).
  projectedReserveEgp: number;
  // Days until the reserve hits the floor (Infinity if it's growing away).
  daysToFloor: number;
  // Days until the reserve hits the ceiling (Infinity if shrinking).
  daysToCeiling: number;
  status: "below_floor" | "healthy" | "above_ceiling";
  tradeCountInWindow: number;
  windowDays: number;
  recommendation?: string;
};

// ── Check the health of an enterprise's liquidity reserve ──
// Pulls the last SMA_WINDOW_DAYS days of Trade rows, sums the gross value,
// applies RESERVE_RATIO to compute the running reserve, then projects forward
// using the daily SMA. Returns a status flag + day-counts-to-boundary so the
// UI can warn before the floor is breached.
export async function checkReserveHealth(
  enterpriseId: string
): Promise<ReserveHealth> {
  const since = new Date(Date.now() - SMA_WINDOW_DAYS * 86_400_000);

  const trades = await db.trade.findMany({
    where: { enterpriseId, matchedAt: { gte: since } },
    select: { grossEgp: true, matchedAt: true },
    orderBy: { matchedAt: "asc" },
  });

  const tradeCount = trades.length;
  const grossSum = trades.reduce((sum, t) => sum + (t.grossEgp ?? 0), 0);
  const currentReserve = roundEgp(grossSum * RESERVE_RATIO);
  const dailySma = roundEgp(grossSum / SMA_WINDOW_DAYS);

  // Linear projection: each future day accrues (dailySma × RESERVE_RATIO).
  const dailyAccrual = dailySma * RESERVE_RATIO;
  const projectedReserve = roundEgp(
    currentReserve + dailyAccrual * PROJECTION_HORIZON_DAYS
  );

  // Status + days-to-boundary.
  let status: ReserveHealth["status"] = "healthy";
  if (currentReserve < MIN_RESERVE_EGP) status = "below_floor";
  else if (currentReserve > MAX_RESERVE_EGP) status = "above_ceiling";

  // Days to floor: how many days of accrual until we drop to the floor.
  // If accruing positive, we're moving away from the floor (Infinity).
  // If accruing zero, we're static — count as Infinity (not approaching).
  let daysToFloor: number;
  if (dailyAccrual > 0) {
    daysToFloor = Infinity; // growing, not approaching floor
  } else if (dailyAccrual < 0) {
    // Negative accrual — can't happen with RESERVE_RATIO > 0, but guard.
    const deficit = currentReserve - MIN_RESERVE_EGP;
    daysToFloor = dailyAccrual !== 0 ? Math.ceil(deficit / Math.abs(dailyAccrual)) : Infinity;
  } else {
    daysToFloor = Infinity; // static
  }

  // Days to ceiling: only relevant if accruing positive.
  let daysToCeiling: number;
  if (dailyAccrual > 0 && currentReserve < MAX_RESERVE_EGP) {
    const headroom = MAX_RESERVE_EGP - currentReserve;
    daysToCeiling = Math.ceil(headroom / dailyAccrual);
  } else {
    daysToCeiling = Infinity;
  }

  let recommendation: string | undefined;
  if (status === "below_floor") {
    recommendation = `Reserve ${currentReserve} EGP below floor ${MIN_RESERVE_EGP} EGP — top up required (suggestReserveTopup below) to restore secondary-market liquidity.`;
  } else if (status === "above_ceiling") {
    recommendation = `Reserve ${currentReserve} EGP above ceiling ${MAX_RESERVE_EGP} EGP — rebate surplus of ${roundEgp(currentReserve - MAX_RESERVE_EGP)} EGP to the Law Firm Client Account.`;
  } else if (daysToFloor !== Infinity && daysToFloor <= 7) {
    recommendation = `Reserve approaching floor in ${daysToFloor}d at current SMA — proactive top-up recommended.`;
  }

  return {
    enterpriseId,
    currentReserveEgp: currentReserve,
    dailySmaEgp: dailySma,
    projectedReserveEgp: projectedReserve,
    daysToFloor,
    daysToCeiling,
    status,
    tradeCountInWindow: tradeCount,
    windowDays: SMA_WINDOW_DAYS,
    recommendation,
  };
}

export type ReserveTopup = {
  // Absolute top-up amount in EGP (always ≥ 0).
  topupEgp: number;
  // The target reserve level the top-up brings the enterprise to.
  targetReserveEgp: number;
  // Whether the target is the floor (recommended minimum) or a custom target.
  basis: "floor" | "custom";
  // Whether a top-up is actually needed (false if current ≥ target).
  needed: boolean;
  // Suggested funding source — the Law Firm Client Account is the canonical
  // source for operating shortfalls per Amendment IX.
  suggestedSource: string;
};

// ── Suggest a top-up amount ──
// Pure function — no DB hit. The caller computes the current reserve (via
// checkReserveHealth above) and supplies a target. If `targetReserve` is
// omitted, the floor (MIN_RESERVE_EGP) is used as the default target.
export function suggestReserveTopup(
  currentReserve: number,
  targetReserve?: number
): ReserveTopup {
  const current = Math.max(0, currentReserve);
  const target = Math.max(targetReserve ?? MIN_RESERVE_EGP, MIN_RESERVE_EGP);
  const topup = Math.max(0, target - current);
  return {
    topupEgp: roundEgp(topup),
    targetReserveEgp: roundEgp(target),
    basis: targetReserve == null ? "floor" : "custom",
    needed: topup > 0,
    suggestedSource: "Law Firm Client Account (Amendment IX)",
  };
}
