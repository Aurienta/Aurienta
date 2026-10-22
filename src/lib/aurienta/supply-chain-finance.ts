// AURIENTA — Constitutional Supply Chain Finance (REC-3)
// ════════════════════════════════════════════════════════════════════
// Milestone-backed working-capital advances for enterprises that need to
// bridge cash between milestone approval and customer payment. The CRE
// policy `enforceMilestoneAdvance` enforces:
//   - Constitutional rate ≤ 8% APR (usury cap).
//   - Advance ≤ 80% of milestone value.
//   - Enterprise runway ≥ 3 months (no advances to dying enterprises).
//
// Funds flow through the Law Firm Client Account (Amendment IX) — Zero
// Custody. AURIENTA only records the obligation on the ledger.
//
// Lifecycle:
//   pending → cre_approved → funded → repaid
//                       ↘ defaulted

import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import {
  enforceMilestoneAdvance,
  logCreDecision,
  appendLedgerEvent,
  type CreVerdict,
} from "@/lib/aurienta/cre";

// ─── Types ───────────────────────────────────────────────────────────

export type RequestAdvanceParams = {
  enterpriseId: string;
  partnerId: string;
  milestoneId?: string;
  advanceAmountEgp: number;
  constitutionalRate: number; // annualized, must be ≤ 8
  termDays: number;
};

export type MilestoneAdvanceRecord = {
  id: string;
  enterpriseId: string;
  partnerId: string;
  milestoneId: string | null;
  advanceAmountEgp: number;
  constitutionalRate: number;
  termDays: number;
  status: string;
  creDecisionToken: string | null;
  fundedAt: Date | null;
  repaidAt: Date | null;
  createdAt: Date;
};

// ─── Helpers ─────────────────────────────────────────────────────────

function toRecord(a: {
  id: string;
  enterpriseId: string;
  partnerId: string;
  milestoneId: string | null;
  advanceAmountEgp: number;
  constitutionalRate: number;
  termDays: number;
  status: string;
  creDecisionToken: string | null;
  fundedAt: Date | null;
  repaidAt: Date | null;
  createdAt: Date;
}): MilestoneAdvanceRecord {
  return { ...a };
}

/**
 * Pulls the milestone value (if a milestoneId is provided) and a rough
 * runway estimate from the enterprise's monthly burn. Used as inputs to
 * the CRE policy.
 */
async function getAdvanceContext(
  enterpriseId: string,
  milestoneId?: string
): Promise<{ milestoneValueEgp: number; runwayMonths: number }> {
  const ent = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: {
      lawFirmClientAccountBalanceEgp: true,
      monthlyBurnEgp: true,
    },
  });

  let milestoneValueEgp = 0;
  if (milestoneId) {
    const ms = await db.milestone.findUnique({
      where: { id: milestoneId },
      select: { amountEgp: true, enterpriseId: true },
    });
    // Guard against cross-enterprise milestone ID injection.
    if (ms && ms.enterpriseId === enterpriseId) {
      milestoneValueEgp = ms.amountEgp;
    }
  }

  // Runway = (law firm account balance) / (monthly burn). Falls back to a
  // large number when burn is zero so the CRE policy's 3-month floor is
  // satisfied for pre-revenue enterprises with capital on hand.
  const burn = ent?.monthlyBurnEgp ?? 0;
  const balance = ent?.lawFirmClientAccountBalanceEgp ?? 0;
  const runwayMonths = burn > 0 ? Math.floor(balance / burn) : 99;

  return { milestoneValueEgp, runwayMonths };
}

// ─── requestAdvance ───────────────────────────────────────────────────

export async function requestAdvance(
  params: RequestAdvanceParams
): Promise<{
  advance: MilestoneAdvanceRecord | null;
  verdict: CreVerdict;
}> {
  const {
    enterpriseId,
    partnerId,
    milestoneId,
    advanceAmountEgp,
    constitutionalRate,
    termDays,
  } = params;

  const { milestoneValueEgp, runwayMonths } = await getAdvanceContext(
    enterpriseId,
    milestoneId
  );

  const verdict = enforceMilestoneAdvance({
    enterpriseId,
    advanceAmountEgp,
    milestoneValueEgp,
    constitutionalRate,
    enterpriseRunwayMonths: runwayMonths,
  });

  // Persist a row even when the CRE denies (for the audit trail). Status
  // reflects the verdict: `pending` if allowed, `defaulted` if denied —
  // `defaulted` here means "rejected at gate, never funded".
  const initialStatus = verdict.allowed ? "pending" : "defaulted";

  const advance = await db.$transaction(async (tx) => {
    const created = await tx.milestoneAdvance.create({
      data: {
        enterpriseId,
        partnerId,
        milestoneId: milestoneId ?? null,
        advanceAmountEgp,
        constitutionalRate,
        termDays,
        status: initialStatus,
        creDecisionToken: verdict.decisionToken,
      },
    });

    await logCreDecision(tx, {
      enterpriseId,
      policy: verdict.policy,
      verdict,
      actorId: partnerId,
      payload: {
        advanceId: created.id,
        advanceAmountEgp,
        milestoneValueEgp,
        constitutionalRate,
        runwayMonths,
        termDays,
      },
    });

    if (verdict.allowed) {
      await appendLedgerEvent(tx, {
        enterpriseId,
        eventType: "milestone_advance_requested",
        payload: {
          advanceId: created.id,
          partnerId,
          milestoneId: milestoneId ?? null,
          advanceAmountEgp,
          constitutionalRate,
          termDays,
        },
        actorId: partnerId,
      });
    }

    return created;
  });

  await audit({
    actorId: partnerId,
    action: "supply_chain.advance.request",
    target: `enterprise:${enterpriseId}`,
    result: verdict.allowed ? "allowed" : "denied",
    reason: verdict.reason,
    metadata: {
      advanceId: advance.id,
      advanceAmountEgp,
      constitutionalRate,
      termDays,
      milestoneValueEgp,
      runwayMonths,
    },
  });

  logger.info("milestone advance requested", {
    advanceId: advance.id,
    enterpriseId,
    partnerId,
    advanceAmountEgp,
    allowed: verdict.allowed,
  });

  return { advance: toRecord(advance), verdict };
}

// ─── listAdvances ────────────────────────────────────────────────────

export async function listAdvances(
  enterpriseId: string,
  limit = 50
): Promise<MilestoneAdvanceRecord[]> {
  const rows = await db.milestoneAdvance.findMany({
    where: { enterpriseId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
  return rows.map(toRecord);
}

/**
 * Lists advances where the user is the capital partner (lender).
 */
export async function listAdvancesForPartner(
  partnerId: string,
  limit = 50
): Promise<MilestoneAdvanceRecord[]> {
  const rows = await db.milestoneAdvance.findMany({
    where: { partnerId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
  return rows.map(toRecord);
}

/**
 * Lists advances visible to a user: advances for their enterprises +
 * advances where they're the partner.
 */
export async function listAdvancesVisibleToUser(
  userId: string,
  enterpriseIds: string[],
  limit = 50
): Promise<MilestoneAdvanceRecord[]> {
  const rows = await db.milestoneAdvance.findMany({
    where: {
      OR: [
        { partnerId: userId },
        ...(enterpriseIds.length > 0
          ? [{ enterpriseId: { in: enterpriseIds } }]
          : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
  return rows.map(toRecord);
}

// ─── fundAdvance ─────────────────────────────────────────────────────

/**
 * Marks a previously-approved advance as `funded`. Funds have been wired
 * from the capital partner through the law firm escrow to the enterprise
 * Law Firm Client Account (Zero Custody).
 */
export async function fundAdvance(
  advanceId: string,
  funderId: string
): Promise<MilestoneAdvanceRecord | null> {
  const existing = await db.milestoneAdvance.findUnique({
    where: { id: advanceId },
  });
  if (!existing) return null;

  if (existing.status !== "pending") {
    throw new Error(
      `Advance ${advanceId} cannot be funded from status '${existing.status}'`
    );
  }

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.milestoneAdvance.update({
      where: { id: advanceId },
      data: {
        status: "funded",
        fundedAt: new Date(),
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "milestone_advance_funded",
      payload: {
        advanceId: existing.id,
        amountEgp: existing.advanceAmountEgp,
        rate: existing.constitutionalRate,
        termDays: existing.termDays,
        funderId,
      },
      actorId: funderId,
    });

    return u;
  });

  await audit({
    actorId: funderId,
    action: "supply_chain.advance.fund",
    target: `milestone_advance:${advanceId}`,
    result: "allowed",
    metadata: {
      advanceId: existing.id,
      enterpriseId: existing.enterpriseId,
      amountEgp: existing.advanceAmountEgp,
    },
  });

  return toRecord(updated);
}

// ─── repayAdvance ────────────────────────────────────────────────────

/**
 * Marks a funded advance as `repaid`. Repayment (principal + constitutional
 * interest) flows back through the law firm escrow to the capital partner.
 */
export async function repayAdvance(
  advanceId: string,
  repayerId: string
): Promise<MilestoneAdvanceRecord | null> {
  const existing = await db.milestoneAdvance.findUnique({
    where: { id: advanceId },
  });
  if (!existing) return null;

  if (existing.status !== "funded") {
    throw new Error(
      `Advance ${advanceId} cannot be repaid from status '${existing.status}'`
    );
  }

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.milestoneAdvance.update({
      where: { id: advanceId },
      data: {
        status: "repaid",
        repaidAt: new Date(),
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "milestone_advance_repaid",
      payload: {
        advanceId: existing.id,
        principalEgp: existing.advanceAmountEgp,
        rate: existing.constitutionalRate,
        termDays: existing.termDays,
        repayerId,
      },
      actorId: repayerId,
    });

    return u;
  });

  await audit({
    actorId: repayerId,
    action: "supply_chain.advance.repay",
    target: `milestone_advance:${advanceId}`,
    result: "allowed",
    metadata: {
      advanceId: existing.id,
      enterpriseId: existing.enterpriseId,
      principalEgp: existing.advanceAmountEgp,
    },
  });

  return toRecord(updated);
}

// ─── getAdvance ──────────────────────────────────────────────────────

export async function getAdvance(
  advanceId: string
): Promise<MilestoneAdvanceRecord | null> {
  const row = await db.milestoneAdvance.findUnique({
    where: { id: advanceId },
  });
  return row ? toRecord(row) : null;
}

// ─── Portfolio stats (for dashboard header) ──────────────────────────

export type SupplyChainStats = {
  totalAdvances: number;
  activeAdvances: number; // funded but not repaid
  repaidAdvances: number;
  totalFundedEgp: number;
  totalOutstandingEgp: number;
};

export async function getSupplyChainStats(
  enterpriseId: string
): Promise<SupplyChainStats> {
  const [total, active, repaid, fundedSum] = await Promise.all([
    db.milestoneAdvance.count({ where: { enterpriseId } }),
    db.milestoneAdvance.count({
      where: { enterpriseId, status: "funded" },
    }),
    db.milestoneAdvance.count({
      where: { enterpriseId, status: "repaid" },
    }),
    db.milestoneAdvance.aggregate({
      where: { enterpriseId, status: { in: ["funded", "repaid"] } },
      _sum: { advanceAmountEgp: true },
    }),
  ]);

  const totalFunded = fundedSum._sum.advanceAmountEgp ?? 0;
  const totalOutstanding = await db.milestoneAdvance
    .aggregate({
      where: { enterpriseId, status: "funded" },
      _sum: { advanceAmountEgp: true },
    })
    .then((r) => r._sum.advanceAmountEgp ?? 0);

  return {
    totalAdvances: total,
    activeAdvances: active,
    repaidAdvances: repaid,
    totalFundedEgp: totalFunded,
    totalOutstandingEgp: totalOutstanding,
  };
}
