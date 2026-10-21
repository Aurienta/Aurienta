// AURIENTA — Dividend Distribution (STAGE A)
// ════════════════════════════════════════════════════════════════════
// Records the declaration and payout of enterprise dividends to capital
// partners. Dividends are paid from realized enterprise profit, disbursed
// by the law firm from the Law Firm Client Account (Amendment IX) — Zero
// Custody.
//
// The CRE policy `enforceDividendDistribution` enforces:
//   - Total dividend > 0.
//   - Enterprise profit > 0 (no dividends from losses).
//   - Total dividend ≤ 50% of profit (retain ≥ 50% for reinvestment).
//   - Total dividend ≤ Law Firm Client Account balance (cash on hand).
//
// Lifecycle:
//   declared → cre_approved → paid → completed

import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import {
  enforceDividendDistribution,
  logCreDecision,
  appendLedgerEvent,
  type CreVerdict,
} from "@/lib/aurienta/cre";

// ─── Types ───────────────────────────────────────────────────────────

export type DeclareDividendParams = {
  enterpriseId: string;
  totalDividendEgp: number;
  perShareDividendEgp: number;
  partnerCount: number;
  recordDate?: Date;
  declaredById: string;
};

export type DividendDistributionRecord = {
  id: string;
  enterpriseId: string;
  totalDividendEgp: number;
  perShareDividendEgp: number;
  partnerCount: number;
  status: string;
  creDecisionToken: string | null;
  declaredAt: Date;
  paidAt: Date | null;
  recordDate: Date;
};

// ─── Helpers ─────────────────────────────────────────────────────────

function toRecord(d: {
  id: string;
  enterpriseId: string;
  totalDividendEgp: number;
  perShareDividendEgp: number;
  partnerCount: number;
  status: string;
  creDecisionToken: string | null;
  declaredAt: Date;
  paidAt: Date | null;
  recordDate: Date;
}): DividendDistributionRecord {
  return { ...d };
}

/**
 * Pulls the latest quarterly net profit (proxy for "enterprise profit" in
 * the CRE policy) and the current Law Firm Client Account balance. If no
 * quarterly report exists, both default to zero — which the CRE policy
 * will reject (cannot distribute dividends from a non-profitable or
 * unfunded enterprise).
 */
async function getDividendContext(enterpriseId: string): Promise<{
  enterpriseProfitEgp: number;
  lawFirmAccountBalanceEgp: number;
}> {
  const [ent, latestQuarter] = await Promise.all([
    db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: { lawFirmClientAccountBalanceEgp: true },
    }),
    db.quarterlyReport.findFirst({
      where: { enterpriseId },
      orderBy: { createdAt: "desc" },
      select: { netProfitEgp: true },
    }),
  ]);

  return {
    enterpriseProfitEgp: latestQuarter?.netProfitEgp ?? 0,
    lawFirmAccountBalanceEgp: ent?.lawFirmClientAccountBalanceEgp ?? 0,
  };
}

// ─── declareDividend ────────────────────────────────────────────────

export async function declareDividend(
  params: DeclareDividendParams
): Promise<{
  distribution: DividendDistributionRecord | null;
  verdict: CreVerdict;
}> {
  const {
    enterpriseId,
    totalDividendEgp,
    perShareDividendEgp,
    partnerCount,
    declaredById,
  } = params;

  const { enterpriseProfitEgp, lawFirmAccountBalanceEgp } =
    await getDividendContext(enterpriseId);

  const verdict = enforceDividendDistribution({
    enterpriseId,
    totalDividendEgp,
    enterpriseProfitEgp,
    lawFirmAccountBalanceEgp,
  });

  const initialStatus = verdict.allowed ? "declared" : "rejected";
  const recordDate = params.recordDate ?? new Date();

  const distribution = await db.$transaction(async (tx) => {
    const created = await tx.dividendDistribution.create({
      data: {
        enterpriseId,
        totalDividendEgp,
        perShareDividendEgp,
        partnerCount,
        status: initialStatus,
        creDecisionToken: verdict.decisionToken,
        recordDate,
      },
    });

    await logCreDecision(tx, {
      enterpriseId,
      policy: verdict.policy,
      verdict,
      actorId: declaredById,
      payload: {
        distributionId: created.id,
        totalDividendEgp,
        perShareDividendEgp,
        partnerCount,
        enterpriseProfitEgp,
        lawFirmAccountBalanceEgp,
      },
    });

    if (verdict.allowed) {
      await appendLedgerEvent(tx, {
        enterpriseId,
        eventType: "dividend_declared",
        payload: {
          distributionId: created.id,
          totalDividendEgp,
          perShareDividendEgp,
          partnerCount,
          recordDate: recordDate.toISOString(),
          declaredBy: declaredById,
        },
        actorId: declaredById,
      });
    }

    return created;
  });

  await audit({
    actorId: declaredById,
    action: "dividend.declare",
    target: `enterprise:${enterpriseId}`,
    result: verdict.allowed ? "allowed" : "denied",
    reason: verdict.reason,
    metadata: {
      distributionId: distribution.id,
      totalDividendEgp,
      perShareDividendEgp,
      partnerCount,
      enterpriseProfitEgp,
      lawFirmAccountBalanceEgp,
    },
  });

  logger.info("dividend declared", {
    distributionId: distribution.id,
    enterpriseId,
    totalDividendEgp,
    partnerCount,
    allowed: verdict.allowed,
  });

  return { distribution: toRecord(distribution), verdict };
}

// ─── listDividends ───────────────────────────────────────────────────

export async function listDividends(
  enterpriseId: string,
  limit = 50
): Promise<DividendDistributionRecord[]> {
  const rows = await db.dividendDistribution.findMany({
    where: { enterpriseId },
    orderBy: { declaredAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
  return rows.map(toRecord);
}

/**
 * Lists dividend distributions visible to a user — for every enterprise
 * they're a member of (capital partners receive dividends).
 */
export async function listDividendsForUserEnterprises(
  enterpriseIds: string[],
  limit = 50
): Promise<DividendDistributionRecord[]> {
  if (enterpriseIds.length === 0) return [];
  const rows = await db.dividendDistribution.findMany({
    where: { enterpriseId: { in: enterpriseIds } },
    orderBy: { declaredAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
  return rows.map(toRecord);
}

// ─── payDividend ────────────────────────────────────────────────────

/**
 * Marks a previously-declared dividend as `paid`. The actual cash
 * disbursement to capital partners is performed by the law firm from the
 * Law Firm Client Account (Zero Custody).
 */
export async function payDividend(
  distributionId: string,
  paidBy: string
): Promise<DividendDistributionRecord | null> {
  const existing = await db.dividendDistribution.findUnique({
    where: { id: distributionId },
  });
  if (!existing) return null;

  if (existing.status !== "declared" && existing.status !== "cre_approved") {
    throw new Error(
      `Dividend ${distributionId} cannot be paid from status '${existing.status}'`
    );
  }

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.dividendDistribution.update({
      where: { id: distributionId },
      data: {
        status: "paid",
        paidAt: new Date(),
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "dividend_paid",
      payload: {
        distributionId: existing.id,
        totalDividendEgp: existing.totalDividendEgp,
        perShareDividendEgp: existing.perShareDividendEgp,
        partnerCount: existing.partnerCount,
        paidBy,
      },
      actorId: paidBy,
    });

    return u;
  });

  await audit({
    actorId: paidBy,
    action: "dividend.pay",
    target: `dividend:${distributionId}`,
    result: "allowed",
    metadata: {
      distributionId: existing.id,
      enterpriseId: existing.enterpriseId,
      totalDividendEgp: existing.totalDividendEgp,
    },
  });

  return toRecord(updated);
}

// ─── getDividend ─────────────────────────────────────────────────────

export async function getDividend(
  distributionId: string
): Promise<DividendDistributionRecord | null> {
  const row = await db.dividendDistribution.findUnique({
    where: { id: distributionId },
  });
  return row ? toRecord(row) : null;
}

// ─── Distribution stats ──────────────────────────────────────────────

export type DividendStats = {
  totalDistributions: number;
  paidDistributions: number;
  pendingDistributions: number;
  totalPaidOutEgp: number;
};

export async function getDividendStats(
  enterpriseId: string
): Promise<DividendStats> {
  const [total, paid, pending, paidSum] = await Promise.all([
    db.dividendDistribution.count({ where: { enterpriseId } }),
    db.dividendDistribution.count({
      where: { enterpriseId, status: "paid" },
    }),
    db.dividendDistribution.count({
      where: {
        enterpriseId,
        status: { in: ["declared", "cre_approved"] },
      },
    }),
    db.dividendDistribution.aggregate({
      where: { enterpriseId, status: "paid" },
      _sum: { totalDividendEgp: true },
    }),
  ]);

  return {
    totalDistributions: total,
    paidDistributions: paid,
    pendingDistributions: pending,
    totalPaidOutEgp: paidSum._sum.totalDividendEgp ?? 0,
  };
}
