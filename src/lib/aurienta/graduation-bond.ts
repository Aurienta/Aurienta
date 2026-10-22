// AURIENTA — REC-6: Graduation Bond (cryptographic certificate)
//
// When an enterprise graduates, AURIENTA issues a cryptographic Graduation
// Bond — a tamper-evident certificate that binds the enterprise's full
// constitutional history (ledger events, CRE decisions, audit logs) to a
// SHA-256 hash. The bond also snapshots the graduation context (health
// score, vital signs, partner count, capital raised, CRE decision count).
//
// Constitutional invariants honoured here:
//   - Graduation Threshold (Vol 16 §16.4) — only an enterprise with
//     status='graduated' AND healthScore >= 90 AND ≥ 7 of 9 vital signs
//     healthy may receive a bond. Enforced by `enforceGraduationBond`.
//   - Irrevocability — constitutional bonds are irrevocable (isRevocable=false).
//     Once issued, the bond cannot be unwound without a constitutional
//     amendment.
//   - Public Verifiability — anyone (no auth) can verify a bond by ID at
//     /api/graduation-bond/verify/[bondId]. The verifier checks the bond
//     exists, is not revoked, and the enterprise is still graduated.

import { createHash } from "crypto";
import { db } from "@/lib/db";
import type { PrismaTransaction } from "@/lib/db";
import {
  appendLedgerEvent,
  enforceGraduationBond,
} from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

// ── Types ──────────────────────────────────────────────────────────────────

export type GraduationBondRow = {
  id: string;
  enterpriseId: string;
  bondHash: string;
  graduationDate: string;
  constitutionHash: string;
  healthScoreAtGraduation: number;
  vitalSignsSummary: string;
  partnerCount: number;
  capitalRaisedTotal: number;
  creDecisionsCount: number;
  isRevocable: boolean;
  verificationUrl: string | null;
  creDecisionToken: string | null;
};

export type BondVerification = {
  valid: boolean;
  reason?: string;
  bond?: GraduationBondRow;
  enterprise?: {
    id: string;
    name: string;
    slug: string;
    tier: string;
    sector: string;
    status: string;
    healthScore: number;
  };
};

export type VitalSignSummary = {
  name: string;
  healthy: boolean;
  detail: string;
};

// ── Constants ──────────────────────────────────────────────────────────────

export const TOTAL_VITAL_SIGNS = 9;
export const MIN_HEALTHY_VITAL_SIGNS = 7; // 7 of 9 — REC-6 graduation threshold
export const GRADUATION_MIN_HEALTH_SCORE = 90;

// ── Helpers ────────────────────────────────────────────────────────────────

function toExternal(r: {
  id: string;
  enterpriseId: string;
  bondHash: string;
  graduationDate: Date;
  constitutionHash: string;
  healthScoreAtGraduation: number;
  vitalSignsSummary: string;
  partnerCount: number;
  capitalRaisedTotal: number;
  creDecisionsCount: number;
  isRevocable: boolean;
  verificationUrl: string | null;
  creDecisionToken: string | null;
}): GraduationBondRow {
  return {
    id: r.id,
    enterpriseId: r.enterpriseId,
    bondHash: r.bondHash,
    graduationDate: r.graduationDate.toISOString(),
    constitutionHash: r.constitutionHash,
    healthScoreAtGraduation: r.healthScoreAtGraduation,
    vitalSignsSummary: r.vitalSignsSummary,
    partnerCount: r.partnerCount,
    capitalRaisedTotal: r.capitalRaisedTotal,
    creDecisionsCount: r.creDecisionsCount,
    isRevocable: r.isRevocable,
    verificationUrl: r.verificationUrl,
    creDecisionToken: r.creDecisionToken,
  };
}

/**
 * Compute the 9 constitutional vital signs for an enterprise at graduation.
 * Each sign is healthy (true) or not (false). The bond requires ≥ 7 of 9
 * healthy.
 */
function computeVitalSigns(enterprise: {
  healthScore: number;
  raisedEgp: number;
  fundraisingGoalEgp: number;
  monthlyRevenueEgp: number;
  monthlyBurnEgp: number;
  employeeCount: number;
  nosiCompliantPct: number;
  policeClearanceValid: boolean;
  transparencyScore: number;
}): VitalSignSummary[] {
  const runway = enterprise.monthlyBurnEgp > 0
    ? Math.floor(enterprise.monthlyRevenueEgp / enterprise.monthlyBurnEgp)
    : 0;
  const fundraisingPct =
    enterprise.fundraisingGoalEgp > 0
      ? (enterprise.raisedEgp / enterprise.fundraisingGoalEgp) * 100
      : 0;

  return [
    {
      name: "health_score",
      healthy: enterprise.healthScore >= 90,
      detail: `Health score ${enterprise.healthScore} (≥90 required)`,
    },
    {
      name: "capital_raised",
      healthy: fundraisingPct >= 100,
      detail: `${fundraisingPct.toFixed(0)}% of fundraising goal reached`,
    },
    {
      name: "revenue_active",
      healthy: enterprise.monthlyRevenueEgp > 0,
      detail: `Monthly revenue ${enterprise.monthlyRevenueEgp.toLocaleString()} EGP`,
    },
    {
      name: "runway",
      healthy: runway >= 6,
      detail: `Runway ≈ ${runway} months (≥6 required)`,
    },
    {
      name: "workforce",
      healthy: enterprise.employeeCount > 0,
      detail: `${enterprise.employeeCount} employees registered`,
    },
    {
      name: "nosi_compliance",
      healthy: enterprise.nosiCompliantPct >= 80,
      detail: `NOSI compliance ${enterprise.nosiCompliantPct}% (≥80% required)`,
    },
    {
      name: "police_clearance",
      healthy: enterprise.policeClearanceValid,
      detail: enterprise.policeClearanceValid
        ? "Police clearance valid"
        : "Police clearance expired",
    },
    {
      name: "transparency_score",
      healthy: enterprise.transparencyScore >= 60,
      detail: `Transparency score ${enterprise.transparencyScore} (≥60 required)`,
    },
    {
      name: "graduation_status",
      healthy: true, // status === 'graduated' is checked separately by CRE
      detail: "Enterprise has reached 'graduated' stage",
    },
  ];
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Compute the SHA-256 hash of an enterprise's full constitutional history.
 * The hash covers:
 *   - All LedgerEvent rows for this enterprise (in sequence order)
 *   - All AuditLog rows whose `target` references this enterprise
 *
 * The hash is deterministic given the same set of events — re-issuing a
 * bond (e.g. after a missing-bond recovery) produces the same hash IF the
 * underlying ledger has not changed, which is the tamper-evidence guarantee.
 *
 * Also returns the count of CRE decision ledger events (eventType='cre_decision').
 */
export async function getBondHash(
  enterpriseId: string
): Promise<{ hash: string; creDecisionsCount: number }> {
  const [ledgerEvents, auditLogs] = await Promise.all([
    db.ledgerEvent.findMany({
      where: { enterpriseId },
      orderBy: [{ sequence: "asc" }],
      select: {
        id: true,
        payloadHash: true,
        eventType: true,
        sequence: true,
        timestamp: true,
      },
    }),
    db.auditLog.findMany({
      where: { target: { contains: enterpriseId } },
      orderBy: { timestamp: "asc" },
      select: { id: true, action: true, target: true, timestamp: true },
    }),
  ]);

  const creDecisionsCount = ledgerEvents.filter(
    (e) => e.eventType === "cre_decision"
  ).length;

  // Build a canonical, deterministic JSON document — keys in stable order,
  // timestamps as ISO strings. Hash with SHA-256.
  const canonical = JSON.stringify({
    v: 1,
    enterpriseId,
    ledgerEvents: ledgerEvents.map((e) => ({
      s: e.sequence,
      h: e.payloadHash,
      t: e.eventType,
      at: e.timestamp.toISOString(),
    })),
    auditLogs: auditLogs.map((a) => ({
      a: a.action,
      t: a.target,
      at: a.timestamp.toISOString(),
    })),
  });

  const hash = createHash("sha256").update(canonical).digest("hex");
  return { hash, creDecisionsCount };
}

/**
 * Issue a Graduation Bond for an enterprise. Validates that the enterprise
 * is graduated, has healthScore >= 90, and ≥ 7 of 9 vital signs healthy
 * (enforced by `enforceGraduationBond`). Computes the bond hash of the
 * full constitutional history, snapshots the graduation context, and
 * persists the bond row. The bond is irrevocable.
 *
 * Each enterprise may hold AT MOST one bond — the schema enforces this via
 * `enterpriseId @unique`. Calling `issueBond` twice for the same enterprise
 * is a 409 (caller should look up the existing bond first).
 */
export async function issueBond(
  enterpriseId: string,
  actorId: string
): Promise<GraduationBondRow> {
  // Real Economy Only — enterprise must exist.
  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: {
      id: true,
      name: true,
      slug: true,
      tier: true,
      sector: true,
      status: true,
      stage: true,
      healthScore: true,
      raisedEgp: true,
      fundraisingGoalEgp: true,
      monthlyRevenueEgp: true,
      monthlyBurnEgp: true,
      employeeCount: true,
      nosiCompliantPct: true,
      policeClearanceValid: true,
      transparencyScore: true,
      stageSince: true,
    },
  });
  if (!enterprise) throw new Error("enterprise_not_found");

  // Already-issued bond → conflict (caller should look up first).
  const existing = await db.graduationBond.findUnique({
    where: { enterpriseId },
  });
  if (existing) {
    throw new Error("Graduation bond already issued for this enterprise");
  }

  // Vital signs + CRE graduation gate.
  const vitalSigns = computeVitalSigns(enterprise);
  const vitalSignsHealthy = vitalSigns.filter((v) => v.healthy).length;
  const stageMonths = Math.floor(
    (Date.now() - enterprise.stageSince.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );

  const verdict = enforceGraduationBond({
    enterpriseId,
    enterpriseStatus: enterprise.status,
    healthScore: enterprise.healthScore,
    stageMonths,
    vitalSignsHealthy,
    totalVitalSigns: TOTAL_VITAL_SIGNS,
  });

  if (!verdict.allowed) {
    await audit({
      actorId,
      action: "graduation_bond.issue",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: verdict.reason,
      metadata: {
        status: enterprise.status,
        healthScore: enterprise.healthScore,
        vitalSignsHealthy,
        stageMonths,
      },
    });
    logger.warn("graduation_bond.denied", {
      enterpriseId,
      reason: verdict.reason,
      vitalSignsHealthy,
    });
    throw new Error(verdict.reason ?? "Graduation bond denied by CRE");
  }

  // Bond hash + CRE decision count from the constitutional history.
  const { hash: bondHash, creDecisionsCount } = await getBondHash(enterpriseId);

  // Constitution hash = SHA-256 of the enterprise's name + tier + sector +
  // legalForm + stage + slug. This is the enterprise's "charter digest".
  const constitutionHash = createHash("sha256")
    .update(
      JSON.stringify({
        name: enterprise.name,
        slug: enterprise.slug,
        tier: enterprise.tier,
        sector: enterprise.sector,
        stage: enterprise.stage,
      })
    )
    .digest("hex");

  // Partner count = total capital partners (members + ownership records).
  const [memberCount, ownershipCount] = await Promise.all([
    db.enterpriseMember.count({ where: { enterpriseId } }),
    db.ownershipRecord.count({ where: { enterpriseId } }),
  ]);
  const partnerCount = Math.max(memberCount, ownershipCount);

  const created = await db.$transaction(async (tx: PrismaTransaction) => {
    const row = await tx.graduationBond.create({
      data: {
        enterpriseId,
        bondHash,
        constitutionHash,
        healthScoreAtGraduation: enterprise.healthScore,
        vitalSignsSummary: JSON.stringify({
          total: TOTAL_VITAL_SIGNS,
          healthy: vitalSignsHealthy,
          signs: vitalSigns,
        }),
        partnerCount,
        capitalRaisedTotal: enterprise.raisedEgp,
        creDecisionsCount,
        isRevocable: false,
        verificationUrl: null,
        creDecisionToken: verdict.decisionToken,
      },
    });

    // Set the public verification URL now that we have the bond ID.
    const verificationUrl = `/api/graduation-bond/verify/${row.id}`;
    const finalRow = await tx.graduationBond.update({
      where: { id: row.id },
      data: { verificationUrl },
    });

    await appendLedgerEvent(tx, {
      enterpriseId,
      eventType: "graduation",
      payload: {
        bondId: finalRow.id,
        bondHash,
        constitutionHash,
        healthScoreAtGraduation: enterprise.healthScore,
        vitalSignsHealthy,
        totalVitalSigns: TOTAL_VITAL_SIGNS,
        partnerCount,
        capitalRaisedTotal: enterprise.raisedEgp,
        creDecisionsCount,
        isRevocable: false,
        verificationUrl,
        note:
          "REC-6 Graduation Bond issued. Cryptographic certificate of " +
          "constitutional compliance. Bond is irrevocable — verified " +
          "publicly at /api/graduation-bond/verify/<bondId>.",
      },
      actorId,
    });

    return finalRow;
  });

  await audit({
    actorId,
    action: "graduation_bond.issue",
    target: `graduation_bond:${created.id}`,
    result: "allowed",
    metadata: {
      enterpriseId,
      enterpriseName: enterprise.name,
      bondHash,
      healthScore: enterprise.healthScore,
      vitalSignsHealthy,
      partnerCount,
      capitalRaisedTotal: enterprise.raisedEgp,
      creDecisionsCount,
    },
  });

  logger.info("graduation_bond.issued", {
    bondId: created.id,
    enterpriseId,
    bondHash,
    creDecisionsCount,
  });

  return toExternal(created);
}

/**
 * Return the graduation bond for an enterprise, or null if no bond has been
 * issued.
 */
export async function getBond(
  enterpriseId: string
): Promise<GraduationBondRow | null> {
  const row = await db.graduationBond.findUnique({
    where: { enterpriseId },
  });
  return row ? toExternal(row) : null;
}

/**
 * Public bond verification. Anyone — no auth — can verify a bond by ID.
 *
 * Returns valid=true if:
 *   - The bond exists.
 *   - The bond is not revoked (currently always true — bonds are
 *     irrevocable, but this hook is here for future constitutional
 *     amendment workflows).
 *   - The enterprise still has status='graduated' (i.e. it has not been
 *     post-graduation demoted / frozen / archived).
 *
 * Returns valid=false with a reason otherwise.
 */
export async function verifyBond(
  bondId: string
): Promise<BondVerification> {
  const bond = await db.graduationBond.findUnique({
    where: { id: bondId },
  });
  if (!bond) {
    return { valid: false, reason: "Bond not found" };
  }
  if (bond.isRevocable) {
    // Currently never true — but reserved for future amendment-driven revocation.
    return { valid: false, reason: "Bond has been revoked" };
  }

  const enterprise = await db.enterprise.findUnique({
    where: { id: bond.enterpriseId },
    select: {
      id: true,
      name: true,
      slug: true,
      tier: true,
      sector: true,
      status: true,
      healthScore: true,
    },
  });
  if (!enterprise) {
    return { valid: false, reason: "Enterprise no longer exists" };
  }
  if (enterprise.status !== "graduated") {
    return {
      valid: false,
      reason: `Enterprise is no longer graduated (current status: ${enterprise.status})`,
      bond: toExternal(bond),
      enterprise: {
        id: enterprise.id,
        name: enterprise.name,
        slug: enterprise.slug,
        tier: enterprise.tier,
        sector: enterprise.sector,
        status: enterprise.status,
        healthScore: enterprise.healthScore,
      },
    };
  }

  return {
    valid: true,
    bond: toExternal(bond),
    enterprise: {
      id: enterprise.id,
      name: enterprise.name,
      slug: enterprise.slug,
      tier: enterprise.tier,
      sector: enterprise.sector,
      status: enterprise.status,
      healthScore: enterprise.healthScore,
    },
  };
}
