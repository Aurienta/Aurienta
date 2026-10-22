// AURIENTA — Constitutional Takaful Pool (REC-1)
// ════════════════════════════════════════════════════════════════════
// A cooperative risk-pool built on the Law Firm Client Account balance
// (Amendment IX). Members pay contributions; claims are paid out by the
// law firm (Zero Custody — AURIENTA never holds the funds) after the
// Constitutional Runtime Engine has verified the claim gate.
//
// The CRE policy `enforceTakafulClaim` validates:
//   - Enterprise ID present.
//   - Claim type is one of: milestone_failure | supply_disruption |
//     force_majeure | key_person_loss.
//   - Amount is positive and ≤ min(30% of vault balance, 500,000 EGP).
//
// Lifecycle:
//   submitted → cre_verified → voting → approved → paid
//                       ↘ rejected
//
// This module is the single source of truth for takaful-claim business
// logic. API routes and dashboard pages import these functions directly.

import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import {
  enforceTakafulClaim,
  logCreDecision,
  appendLedgerEvent,
  type CreVerdict,
} from "@/lib/aurienta/cre";

// ─── Types ───────────────────────────────────────────────────────────

export type TakafulClaimType =
  | "milestone_failure"
  | "supply_disruption"
  | "force_majeure"
  | "key_person_loss";

export const TAKAFUL_CLAIM_TYPES: TakafulClaimType[] = [
  "milestone_failure",
  "supply_disruption",
  "force_majeure",
  "key_person_loss",
];

export type SubmitClaimParams = {
  enterpriseId: string;
  claimantId: string;
  claimType: TakafulClaimType;
  description: string;
  amountRequested: number;
  evidenceCid?: string;
};

export type TakafulClaimRecord = {
  id: string;
  enterpriseId: string;
  claimantId: string;
  claimType: string;
  description: string;
  evidenceCid: string | null;
  amountRequested: number;
  amountApproved: number;
  status: string;
  creDecisionToken: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────

function toRecord(c: {
  id: string;
  enterpriseId: string;
  claimantId: string;
  claimType: string;
  description: string;
  evidenceCid: string | null;
  amountRequested: number;
  amountApproved: number;
  status: string;
  creDecisionToken: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}): TakafulClaimRecord {
  return { ...c };
}

/**
 * Reads the enterprise's current Law Firm Client Account balance + health
 * score — both required by the CRE policy. Returns 0 if the enterprise
 * does not exist.
 */
async function getEnterpriseContext(enterpriseId: string): Promise<{
  vaultBalance: number;
  healthScore: number;
}> {
  const ent = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: {
      lawFirmClientAccountBalanceEgp: true,
      healthScore: true,
    },
  });
  return {
    vaultBalance: ent?.lawFirmClientAccountBalanceEgp ?? 0,
    healthScore: ent?.healthScore ?? 0,
  };
}

// ─── submitClaim ────────────────────────────────────────────────────

export async function submitClaim(
  params: SubmitClaimParams
): Promise<{ claim: TakafulClaimRecord | null; verdict: CreVerdict }> {
  const { enterpriseId, claimantId, claimType, description, amountRequested } =
    params;

  const { vaultBalance, healthScore } = await getEnterpriseContext(enterpriseId);

  const verdict = enforceTakafulClaim({
    enterpriseId,
    claimType,
    amountRequested,
    vaultBalance,
    enterpriseHealthScore: healthScore,
  });

  // Even when the CRE denies, we persist a `submitted` claim row so the
  // claimant has a record and AURIENTA Reps can audit the denial. The
  // status reflects the verdict: `submitted` if allowed, `rejected` if
  // denied. The decision token is stored for tamper-evidence.
  const initialStatus = verdict.allowed ? "submitted" : "rejected";

  const claim = await db.$transaction(async (tx) => {
    const created = await tx.takafulClaim.create({
      data: {
        enterpriseId,
        claimantId,
        claimType,
        description,
        evidenceCid: params.evidenceCid ?? null,
        amountRequested,
        amountApproved: 0,
        status: initialStatus,
        creDecisionToken: verdict.decisionToken,
      },
    });

    await logCreDecision(tx, {
      enterpriseId,
      policy: verdict.policy,
      verdict,
      actorId: claimantId,
      payload: {
        claimId: created.id,
        claimType,
        amountRequested,
        vaultBalance,
        healthScore,
      },
    });

    if (verdict.allowed) {
      await appendLedgerEvent(tx, {
        enterpriseId,
        eventType: "takaful_claim_submitted",
        payload: {
          claimId: created.id,
          claimType,
          amountRequested,
          vaultBalance,
          claimantId,
        },
        actorId: claimantId,
      });
    }

    return created;
  });

  await audit({
    actorId: claimantId,
    action: "takaful.claim.submit",
    target: `enterprise:${enterpriseId}`,
    result: verdict.allowed ? "allowed" : "denied",
    reason: verdict.reason,
    metadata: {
      claimId: claim.id,
      claimType,
      amountRequested,
      vaultBalance,
      healthScore,
    },
  });

  logger.info("takaful claim submitted", {
    claimId: claim.id,
    enterpriseId,
    claimType,
    amountRequested,
    allowed: verdict.allowed,
  });

  return { claim: toRecord(claim), verdict };
}

// ─── listClaims (for an enterprise) ──────────────────────────────────

export async function listClaims(
  enterpriseId: string,
  limit = 50
): Promise<TakafulClaimRecord[]> {
  const rows = await db.takafulClaim.findMany({
    where: { enterpriseId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
  return rows.map(toRecord);
}

// ─── listClaimsForUser ───────────────────────────────────────────────

export async function listClaimsForUser(
  userId: string,
  limit = 50
): Promise<TakafulClaimRecord[]> {
  const rows = await db.takafulClaim.findMany({
    where: { claimantId: userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
  return rows.map(toRecord);
}

/**
 * Lists claims visible to a user: their own submitted claims + claims for
 * any enterprise they're a member of (so operators/board can see what's
 * filed against their enterprise).
 */
export async function listClaimsVisibleToUser(
  userId: string,
  enterpriseIds: string[],
  limit = 50
): Promise<TakafulClaimRecord[]> {
  if (enterpriseIds.length === 0) {
    return listClaimsForUser(userId, limit);
  }
  const rows = await db.takafulClaim.findMany({
    where: {
      OR: [{ claimantId: userId }, { enterpriseId: { in: enterpriseIds } }],
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
  return rows.map(toRecord);
}

// ─── approveClaim ────────────────────────────────────────────────────

/**
 * Sets the CRE-approved payout amount and flips status to `cre_verified`.
 * Restricted to AURIENTA Reps / board members (the API route enforces RBAC;
 * this function performs only the data mutation).
 */
export async function approveClaim(
  claimId: string,
  amountApproved: number,
  approverId: string
): Promise<TakafulClaimRecord | null> {
  const existing = await db.takafulClaim.findUnique({ where: { id: claimId } });
  if (!existing) return null;

  if (existing.status !== "submitted") {
    throw new Error(
      `Claim ${claimId} cannot be approved from status '${existing.status}'`
    );
  }

  if (!Number.isFinite(amountApproved) || amountApproved <= 0) {
    throw new Error("amountApproved must be a positive number");
  }
  if (amountApproved > existing.amountRequested) {
    throw new Error(
      `Approved amount ${amountApproved} cannot exceed requested ${existing.amountRequested}`
    );
  }

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.takafulClaim.update({
      where: { id: claimId },
      data: {
        amountApproved: Math.floor(amountApproved),
        status: "cre_verified",
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "takaful_claim_approved",
      payload: {
        claimId: existing.id,
        amountRequested: existing.amountRequested,
        amountApproved: Math.floor(amountApproved),
        approvedBy: approverId,
      },
      actorId: approverId,
    });

    return u;
  });

  await audit({
    actorId: approverId,
    action: "takaful.claim.approve",
    target: `takaful_claim:${claimId}`,
    result: "allowed",
    metadata: {
      claimId: existing.id,
      enterpriseId: existing.enterpriseId,
      amountRequested: existing.amountRequested,
      amountApproved: Math.floor(amountApproved),
    },
  });

  return toRecord(updated);
}

// ─── payClaim ────────────────────────────────────────────────────────

/**
 * Marks a previously-approved claim as `paid`. The actual disbursement is
 * performed by the law firm (Zero Custody — AURIENTA never moves funds);
 * this function only records the resolution on the platform ledger.
 */
export async function payClaim(
  claimId: string,
  disbursedBy: string
): Promise<TakafulClaimRecord | null> {
  const existing = await db.takafulClaim.findUnique({ where: { id: claimId } });
  if (!existing) return null;

  if (existing.status !== "cre_verified") {
    throw new Error(
      `Claim ${claimId} cannot be paid from status '${existing.status}' — must be 'cre_verified' first`
    );
  }

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.takafulClaim.update({
      where: { id: claimId },
      data: {
        status: "paid",
        resolvedAt: new Date(),
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "takaful_claim_paid",
      payload: {
        claimId: existing.id,
        amountPaid: existing.amountApproved,
        disbursedBy,
      },
      actorId: disbursedBy,
    });

    return u;
  });

  await audit({
    actorId: disbursedBy,
    action: "takaful.claim.pay",
    target: `takaful_claim:${claimId}`,
    result: "allowed",
    metadata: {
      claimId: existing.id,
      enterpriseId: existing.enterpriseId,
      amountPaid: existing.amountApproved,
    },
  });

  return toRecord(updated);
}

// ─── getClaim ────────────────────────────────────────────────────────

export async function getClaim(
  claimId: string
): Promise<TakafulClaimRecord | null> {
  const row = await db.takafulClaim.findUnique({ where: { id: claimId } });
  return row ? toRecord(row) : null;
}

// ─── Pool stats (for dashboard header) ────────────────────────────────

export type TakafulPoolStats = {
  vaultBalanceEgp: number;
  totalClaims: number;
  activeClaims: number;
  paidClaims: number;
  totalPaidOutEgp: number;
};

/**
 * Aggregates the takaful pool header numbers for an enterprise:
 *  - vaultBalanceEgp: current Law Firm Client Account balance.
 *  - totalClaims: every claim filed against the enterprise.
 *  - activeClaims: claims in submitted / cre_verified / voting status.
 *  - paidClaims: claims that reached `paid` status.
 *  - totalPaidOutEgp: sum of amountApproved across paid claims.
 */
export async function getTakafulPoolStats(
  enterpriseId: string
): Promise<TakafulPoolStats> {
  const ent = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { lawFirmClientAccountBalanceEgp: true },
  });

  const [total, active, paid, paidSum] = await Promise.all([
    db.takafulClaim.count({ where: { enterpriseId } }),
    db.takafulClaim.count({
      where: {
        enterpriseId,
        status: { in: ["submitted", "cre_verified", "voting", "approved"] },
      },
    }),
    db.takafulClaim.count({ where: { enterpriseId, status: "paid" } }),
    db.takafulClaim.aggregate({
      where: { enterpriseId, status: "paid" },
      _sum: { amountApproved: true },
    }),
  ]);

  return {
    vaultBalanceEgp: ent?.lawFirmClientAccountBalanceEgp ?? 0,
    totalClaims: total,
    activeClaims: active,
    paidClaims: paid,
    totalPaidOutEgp: paidSum._sum.amountApproved ?? 0,
  };
}
