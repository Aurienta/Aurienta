// AURIENTA — REC-2: Productive EGP (dual-currency valuation snapshots)
//
// "Don't save EGP. Own EGP." — احفظ جنيهك. امتلك جنيهك.
//
// Productive EGP is the dual-currency valuation of an Aurienta enterprise
// Equity Unit. Each snapshot captures:
//   - The Equity Unit price in EGP (from Enterprise.equityUnitPriceEgp)
//   - The current USD/EGP FX rate (latest FxRate row, consensus_median)
//   - The monthly inflation rate (configurable, default 30%)
//   - The USD-equivalent price = EGP price / FX rate
//   - The REAL return = nominal return − inflation
//       nominal return = enterprise.revenueGrowthPct (proxy for unit-price
//       growth, since fundamental pricing uses revenueGrowthPct as the
//       growth factor — see economic-model.ts)
//
// The snapshot is CRE-validated by `enforceProductiveEgpSnapshot` before
// it is persisted. Denials are surfaced as thrown Errors.
//
// Constitutional intent (Strategic Recommendation #1, STRATEGIC_RECOMMENDATIONS.md):
//   - EGP bank deposits lose ~3% real return (27% nominal − 30% inflation).
//   - Aurienta Equity Units give real return = revenueGrowthPct − inflation.
//   - For a growth-stage enterprise (revenueGrowthPct = 50%), real return
//     is +20% — a 23-point advantage over a bank deposit.
//   - This module makes that comparison visible to every partner.

import { db } from "@/lib/db";
import type { PrismaTransaction } from "@/lib/db";
import {
  appendLedgerEvent,
  enforceProductiveEgpSnapshot,
} from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

// ── Types ──────────────────────────────────────────────────────────────────

export type ProductiveEgpSnapshotRow = {
  id: string;
  enterpriseId: string;
  equityUnitPriceEgp: number;
  equityUnitPriceUsd: number;
  fxRateUsdToEgp: number;
  inflationRatePct: number;
  realReturnPct: number;
  nominalReturnPct: number;
  snapshotDate: string;
  createdAt: string;
};

export type SnapshotContext = {
  enterpriseName: string;
  enterpriseTier: string;
  enterpriseSector: string;
  bankDepositNominalPct: number; // typical bank deposit rate (configurable)
  bankDepositRealReturnPct: number; // nominal − inflation
};

export type SnapshotWithEnterprise = ProductiveEgpSnapshotRow &
  SnapshotContext;

// ── Constants ──────────────────────────────────────────────────────────────

/** Default monthly inflation rate (EGP, 2026 baseline). Overridable per-call. */
export const DEFAULT_INFLATION_RATE_PCT = 30;

/** Typical Egyptian bank deposit rate (12-month EGP certificate of deposit). */
export const BANK_DEPOSIT_NOMINAL_PCT = 27;

/** Sanity floor for FX rate (EGP per 1 USD). */
export const FX_RATE_FLOOR = 1;

/** Sanity ceiling for FX rate. */
export const FX_RATE_CEILING = 100;

/** Fallback FX rate when no FxRate rows exist (CBE reference rate, 2026). */
export const FALLBACK_FX_RATE_USD_TO_EGP = 48.5;

// ── Helpers ────────────────────────────────────────────────────────────────

function toExternal(r: {
  id: string;
  enterpriseId: string;
  equityUnitPriceEgp: number;
  equityUnitPriceUsd: number;
  fxRateUsdToEgp: number;
  inflationRatePct: number;
  realReturnPct: number;
  snapshotDate: string;
  createdAt: Date;
}): ProductiveEgpSnapshotRow {
  return {
    id: r.id,
    enterpriseId: r.enterpriseId,
    equityUnitPriceEgp: r.equityUnitPriceEgp,
    equityUnitPriceUsd: r.equityUnitPriceUsd,
    fxRateUsdToEgp: r.fxRateUsdToEgp,
    inflationRatePct: r.inflationRatePct,
    realReturnPct: r.realReturnPct,
    nominalReturnPct: 0, // populated by caller — see computeSnapshot
    snapshotDate: r.snapshotDate,
    createdAt: r.createdAt.toISOString(),
  };
}

/**
 * Resolve the most recent USD→EGP FX rate from the FxRate table. Prefers
 * the consensus_median source; falls back to any source if no median is
 * available. If no FxRate rows exist at all, returns FALLBACK_FX_RATE_USD_TO_EGP.
 */
export async function getUsdToEgpRate(): Promise<{
  rate: number;
  source: string;
}> {
  const consensus = await db.fxRate.findFirst({
    where: {
      fromCurrency: "USD",
      toCurrency: "EGP",
      source: "consensus_median",
    },
    orderBy: { fetchedAt: "desc" },
  });
  if (consensus) {
    return { rate: consensus.rate, source: consensus.source };
  }
  const any = await db.fxRate.findFirst({
    where: { fromCurrency: "USD", toCurrency: "EGP" },
    orderBy: { fetchedAt: "desc" },
  });
  if (any) {
    return { rate: any.rate, source: any.source };
  }
  return { rate: FALLBACK_FX_RATE_USD_TO_EGP, source: "fallback" };
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Compute and persist a new Productive EGP snapshot for an enterprise.
 *
 *   equityUnitPriceEgp   = Enterprise.equityUnitPriceEgp
 *   fxRateUsdToEgp       = latest FxRate (USD→EGP)
 *   inflationRatePct     = configurable, default 30%
 *   equityUnitPriceUsd   = equityUnitPriceEgp / fxRateUsdToEgp
 *   nominalReturnPct     = Enterprise.revenueGrowthPct (proxy for unit-price growth)
 *   realReturnPct        = nominalReturnPct − inflationRatePct
 *
 * CRE policy `enforceProductiveEgpSnapshot` validates the price + FX +
 * inflation before persisting. Denials throw.
 */
export async function computeSnapshot(
  enterpriseId: string,
  opts: { inflationRatePct?: number; actorId?: string } = {}
): Promise<SnapshotWithEnterprise> {
  const inflationRatePct =
    opts.inflationRatePct ?? DEFAULT_INFLATION_RATE_PCT;

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: {
      id: true,
      name: true,
      tier: true,
      sector: true,
      equityUnitPriceEgp: true,
      revenueGrowthPct: true,
    },
  });
  if (!enterprise) throw new Error("enterprise_not_found");

  const { rate: fxRateUsdToEgp, source: fxSource } =
    await getUsdToEgpRate();

  const verdict = enforceProductiveEgpSnapshot({
    equityUnitPriceEgp: enterprise.equityUnitPriceEgp,
    fxRateUsdToEgp,
    inflationRatePct,
  });
  if (!verdict.allowed) {
    await audit({
      actorId: opts.actorId ?? "system",
      action: "productive_egp.snapshot",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: verdict.reason,
      metadata: {
        equityUnitPriceEgp: enterprise.equityUnitPriceEgp,
        fxRateUsdToEgp,
        inflationRatePct,
        fxSource,
      },
    });
    throw new Error(verdict.reason ?? "Productive EGP snapshot denied by CRE");
  }

  const equityUnitPriceUsd =
    fxRateUsdToEgp > 0
      ? Number(
          (enterprise.equityUnitPriceEgp / fxRateUsdToEgp).toFixed(4)
        )
      : 0;
  const nominalReturnPct = Number(enterprise.revenueGrowthPct.toFixed(2));
  const realReturnPct = Number(
    (nominalReturnPct - inflationRatePct).toFixed(2)
  );
  const snapshotDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const created = await db.$transaction(async (tx: PrismaTransaction) => {
    const row = await tx.productiveEgpSnapshot.create({
      data: {
        enterpriseId,
        equityUnitPriceEgp: enterprise.equityUnitPriceEgp,
        equityUnitPriceUsd,
        fxRateUsdToEgp,
        inflationRatePct,
        realReturnPct,
        snapshotDate,
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId,
      eventType: "productive_egp_snapshot",
      payload: {
        snapshotId: row.id,
        equityUnitPriceEgp: row.equityUnitPriceEgp,
        equityUnitPriceUsd: row.equityUnitPriceUsd,
        fxRateUsdToEgp: row.fxRateUsdToEgp,
        fxSource,
        inflationRatePct: row.inflationRatePct,
        nominalReturnPct,
        realReturnPct: row.realReturnPct,
        snapshotDate,
        note:
          "REC-2 Productive EGP snapshot. Real return = nominal return " +
          "(enterprise revenue growth) − inflation. Compare to bank " +
          "deposit real return (≈ " +
          (BANK_DEPOSIT_NOMINAL_PCT - inflationRatePct).toFixed(1) +
          "%).",
      },
      actorId: opts.actorId,
    });

    return row;
  });

  await audit({
    actorId: opts.actorId ?? "system",
    action: "productive_egp.snapshot",
    target: `productive_egp_snapshot:${created.id}`,
    result: "allowed",
    metadata: {
      enterpriseId,
      equityUnitPriceEgp: enterprise.equityUnitPriceEgp,
      equityUnitPriceUsd,
      fxRateUsdToEgp,
      fxSource,
      inflationRatePct,
      nominalReturnPct,
      realReturnPct,
    },
  });

  logger.info("productive_egp.snapshot_created", {
    snapshotId: created.id,
    enterpriseId,
    realReturnPct,
    fxSource,
  });

  const external = toExternal(created);
  return {
    ...external,
    nominalReturnPct,
    enterpriseName: enterprise.name,
    enterpriseTier: enterprise.tier,
    enterpriseSector: enterprise.sector,
    bankDepositNominalPct: BANK_DEPOSIT_NOMINAL_PCT,
    bankDepositRealReturnPct: Number(
      (BANK_DEPOSIT_NOMINAL_PCT - inflationRatePct).toFixed(2)
    ),
  };
}

/**
 * Return the most recent Productive EGP snapshot for an enterprise. If no
 * snapshot exists, returns null (caller decides whether to auto-compute).
 */
export async function getLatestSnapshot(
  enterpriseId: string
): Promise<SnapshotWithEnterprise | null> {
  const row = await db.productiveEgpSnapshot.findFirst({
    where: { enterpriseId },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: {
      name: true,
      tier: true,
      sector: true,
      revenueGrowthPct: true,
    },
  });
  if (!enterprise) return null;

  const external = toExternal(row);
  const nominalReturnPct = Number(enterprise.revenueGrowthPct.toFixed(2));
  return {
    ...external,
    nominalReturnPct,
    enterpriseName: enterprise.name,
    enterpriseTier: enterprise.tier,
    enterpriseSector: enterprise.sector,
    bankDepositNominalPct: BANK_DEPOSIT_NOMINAL_PCT,
    bankDepositRealReturnPct: Number(
      (BANK_DEPOSIT_NOMINAL_PCT - row.inflationRatePct).toFixed(2)
    ),
  };
}

/**
 * Return the last N days of Productive EGP snapshots for an enterprise.
 * Used by the dashboard history chart. Ordered oldest→newest so the SVG
 * line chart renders left-to-right.
 */
export async function getHistory(
  enterpriseId: string,
  days = 30
): Promise<SnapshotWithEnterprise[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db.productiveEgpSnapshot.findMany({
    where: { enterpriseId, createdAt: { gte: cutoff } },
    orderBy: { createdAt: "asc" },
    take: 500,
  });
  if (rows.length === 0) return [];

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: {
      name: true,
      tier: true,
      sector: true,
      revenueGrowthPct: true,
    },
  });
  if (!enterprise) return [];

  return rows.map((r) => {
    const external = toExternal(r);
    const nominalReturnPct = Number(enterprise.revenueGrowthPct.toFixed(2));
    return {
      ...external,
      nominalReturnPct,
      enterpriseName: enterprise.name,
      enterpriseTier: enterprise.tier,
      enterpriseSector: enterprise.sector,
      bankDepositNominalPct: BANK_DEPOSIT_NOMINAL_PCT,
      bankDepositRealReturnPct: Number(
        (BANK_DEPOSIT_NOMINAL_PCT - r.inflationRatePct).toFixed(2)
      ),
    };
  });
}
