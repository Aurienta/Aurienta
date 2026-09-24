// AURIENTA — Circuit Breaker Engine (Vol 9 §9.7)
// Implements 3-level price halt logic for the secondary market.
// Prevents market manipulation and flash crashes.

import { db } from "@/lib/db";
import { audit } from "./audit";
import { appendLedgerEvent } from "./cre";

export const CIRCUIT_BREAKER_CONFIG = {
  LEVEL_1_THRESHOLD_PCT: 8,    // ±8% → 15-minute halt
  LEVEL_2_THRESHOLD_PCT: 12,  // ±12% → 30-minute halt
  LEVEL_3_THRESHOLD_PCT: 20,  // ±20% → daily halt
  LEVEL_1_DURATION_MIN: 15,
  LEVEL_2_DURATION_MIN: 30,
  LEVEL_3_DURATION_MIN: 1440,  // 24 hours
} as const;

export type CircuitBreakerLevel = 1 | 2 | 3;

export type CircuitBreakerStatus = {
  halted: boolean;
  level?: CircuitBreakerLevel;
  resumeAt?: Date;
  reason?: string;
  triggeredByPrice?: number;
  referencePrice?: number;
  deviationPct?: number;
};

/**
 * Check if an enterprise's secondary market is currently halted.
 * Queries the CircuitBreakerHalt table for active (non-expired) halts.
 */
export async function isHalted(enterpriseId: string): Promise<boolean> {
  const activeHalt = await (db as any).circuitBreakerHalt.findFirst({
    where: {
      enterpriseId,
      isActive: true,
      resumeAt: { gt: new Date() },
    },
    orderBy: { triggeredAt: "desc" },
  });
  return !!activeHalt;
}

/**
 * Get the current halt status for an enterprise (if any).
 */
export async function getHaltStatus(enterpriseId: string): Promise<CircuitBreakerStatus> {
  const halt = await (db as any).circuitBreakerHalt.findFirst({
    where: {
      enterpriseId,
      isActive: true,
      resumeAt: { gt: new Date() },
    },
    orderBy: { triggeredAt: "desc" },
  });
  if (!halt) return { halted: false };
  return {
    halted: true,
    level: halt.level,
    resumeAt: halt.resumeAt,
    reason: halt.reason,
    triggeredByPrice: halt.triggeredByPrice,
    referencePrice: halt.referencePrice,
    deviationPct: halt.deviationPct,
  };
}

/**
 * Check if a proposed trade would trigger a circuit breaker.
 * Compares the proposed price against the last executed trade price.
 *
 * Returns the breaker status: if halted, the trade must NOT execute.
 * If the deviation exceeds a threshold, a new halt is triggered.
 */
export async function checkCircuitBreaker(
  enterpriseId: string,
  proposedPrice: number
): Promise<CircuitBreakerStatus> {
  // First check if there's already an active halt
  const existing = await getHaltStatus(enterpriseId);
  if (existing.halted) {
    return existing;
  }

  // Get the last executed trade price for this enterprise
  const lastTrade = await (db as any).trade.findFirst({
    where: { enterpriseId, status: "executed" },
    orderBy: { executedAt: "desc" },
    select: { pricePerUnit: true },
  });

  if (!lastTrade) {
    // No prior trades — no reference price to compare against
    return { halted: false };
  }

  const lastPrice = lastTrade.pricePerUnit as number;
  const deviationPct = Math.abs((proposedPrice - lastPrice) / lastPrice) * 100;

  // Determine which level is triggered
  let level: CircuitBreakerLevel | null = null;
  if (deviationPct >= CIRCUIT_BREAKER_CONFIG.LEVEL_3_THRESHOLD_PCT) {
    level = 3;
  } else if (deviationPct >= CIRCUIT_BREAKER_CONFIG.LEVEL_2_THRESHOLD_PCT) {
    level = 2;
  } else if (deviationPct >= CIRCUIT_BREAKER_CONFIG.LEVEL_1_THRESHOLD_PCT) {
    level = 1;
  }

  if (!level) {
    return { halted: false, deviationPct };
  }

  // Trigger the halt
  return triggerHalt(enterpriseId, level, deviationPct, proposedPrice, lastPrice);
}

/**
 * Trigger a circuit breaker halt. Creates the halt record + audit log + ledger event.
 */
async function triggerHalt(
  enterpriseId: string,
  level: CircuitBreakerLevel,
  deviationPct: number,
  triggeredByPrice: number,
  referencePrice: number
): Promise<CircuitBreakerStatus> {
  const durations: Record<CircuitBreakerLevel, number> = {
    1: CIRCUIT_BREAKER_CONFIG.LEVEL_1_DURATION_MIN,
    2: CIRCUIT_BREAKER_CONFIG.LEVEL_2_DURATION_MIN,
    3: CIRCUIT_BREAKER_CONFIG.LEVEL_3_DURATION_MIN,
  };
  const durationMin = durations[level];
  const resumeAt = new Date(Date.now() + durationMin * 60 * 1000);
  const reason = `Level ${level} circuit breaker: ±${deviationPct.toFixed(2)}% price deviation from last trade (threshold: ±${
    level === 1 ? CIRCUIT_BREAKER_CONFIG.LEVEL_1_THRESHOLD_PCT : level === 2 ? CIRCUIT_BREAKER_CONFIG.LEVEL_2_THRESHOLD_PCT : CIRCUIT_BREAKER_CONFIG.LEVEL_3_THRESHOLD_PCT
  }%)`;

  // Create the halt record
  await (db as any).circuitBreakerHalt.create({
    data: {
      enterpriseId,
      level,
      triggeredByPrice,
      referencePrice,
      deviationPct,
      reason,
      resumeAt,
      isActive: true,
    },
  });

  // Append to the enterprise ledger
  await appendLedgerEvent(db as any, {
    enterpriseId,
    eventType: "circuit_breaker_triggered",
    payload: {
      level,
      deviationPct,
      triggeredByPrice,
      referencePrice,
      resumeAt: resumeAt.toISOString(),
      reason,
    },
    actorId: "system",
  });

  await audit({
    actorId: "system",
    action: "circuit_breaker.triggered",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: { level, deviationPct, resumeAt: resumeAt.toISOString() },
  });

  return {
    halted: true,
    level,
    resumeAt,
    reason,
    triggeredByPrice,
    referencePrice,
    deviationPct,
  };
}

/**
 * Manually lift a circuit breaker halt (admin/emergency only).
 */
export async function liftHalt(enterpriseId: string, liftedBy: string): Promise<void> {
  await (db as any).circuitBreakerHalt.updateMany({
    where: { enterpriseId, isActive: true },
    data: { isActive: false },
  });

  await audit({
    actorId: liftedBy,
    action: "circuit_breaker.lifted",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: { liftedAt: new Date().toISOString() },
  });
}
