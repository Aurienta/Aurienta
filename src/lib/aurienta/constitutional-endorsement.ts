// ROADMAP-07: Constitutional Endorsement — Reputation-as-Collateral.
//
// Partners ENDORSE enterprises (NOT financial staking). The "stake" is STS
// points (reputation), not money. Endorsements affect Sovereign Trust Score
// (reputation only) on resolution. No dividends, no financial value, no
// derivatives, no securities. This is a merit-based trust network.
//
// Layered on top of:
//  - db.ConstitutionalEndorsement (id, endorserId, enterpriseId, stakeSts,
//    active, outcome='pending'|'success'|'failure', stsDelta, createdAt,
//    resolvedAt)
//  - cre.enforceConstitutionalEndorsement (enterprise active, STS >= 40,
//    stakeSts <= 15, existingStakesByUser < 5)
//  - cre.appendLedgerEvent (transactional, per-enterprise hash-chained)
//
// All exports are pure data-flow functions: read → CRE verdict → tx write →
// ledger event → audit. The caller (API route / server component) is
// responsible for auth + HTTP response shaping.

import { db } from "@/lib/db";
import type { PrismaTransaction } from "@/lib/db";
import {
  appendLedgerEvent,
  enforceConstitutionalEndorsement,
} from "@/lib/aurienta/cre";
import type { CreVerdict } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";

// ── Types ──
// Prisma generates its own Endorsement type, but to keep this module's
// public surface stable across schema renames we export a structural alias
// that mirrors the ConstitutionalEndorsement row + the joined enterprise
// name (always present in list responses).
export type Endorsement = {
  id: string;
  endorserId: string;
  enterpriseId: string;
  enterpriseName: string;
  enterpriseTier: string;
  stakeSts: number;
  active: boolean;
  outcome: "pending" | "success" | "failure";
  stsDelta: number;
  createdAt: string; // ISO
  resolvedAt: string | null; // ISO
};

export type EndorsementStats = {
  totalSts: number; // sum of stakeSts across ALL endorsements (incl. resolved)
  endorserCount: number; // distinct endorserId values across ALL endorsements
  successRate: number; // resolved-success / resolved-total (0-100, 0 if none)
  activeSts: number; // sum of stakeSts across ACTIVE endorsements only
  total: number; // total rows
  resolvedCount: number; // total resolved rows (success + failure)
  successCount: number; // resolved with outcome='success'
};

export type CreateEndorsementInput = {
  endorserId: string;
  enterpriseId: string;
  stakeSts: number;
};

export type CreateEndorsementResult = {
  endorsement: Endorsement;
  verdict: CreVerdict;
};

// ── Constants — mirror cre.enforceConstitutionalEndorsement ──
export const ENDORSEMENT_MAX_PER_USER = 5;
export const ENDORSEMENT_STAKE_CAP = 15;
export const ENDORSEMENT_MIN_STS = 40;

// ── Internal: map a Prisma row + joined enterprise to Endorsement ──
function mapRow<
  T extends {
    id: string;
    endorserId: string;
    enterpriseId: string;
    stakeSts: number;
    active: boolean;
    outcome: string;
    stsDelta: number;
    createdAt: Date;
    resolvedAt: Date | null;
  },
>(row: T, enterprise: { name: string; tier: string }): Endorsement {
  return {
    id: row.id,
    endorserId: row.endorserId,
    enterpriseId: row.enterpriseId,
    enterpriseName: enterprise.name,
    enterpriseTier: enterprise.tier,
    stakeSts: row.stakeSts,
    active: row.active,
    outcome: row.outcome as Endorsement["outcome"],
    stsDelta: row.stsDelta,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
  };
}

// ── createEndorsement ──
// Loads endorser STS, enterprise status, counts existing active
// endorsements by this user. Runs `enforceConstitutionalEndorsement`. If
// allowed, creates the row inside a db.$transaction with an immutable ledger
// event (enterpriseId, eventType='endorsement_created', payload=
// {endorserId, stakeSts}). Throws an Error with `verdict.reason` in its
// message if denied — callers should translate that into a 4xx.
export async function createEndorsement(
  params: CreateEndorsementInput
): Promise<CreateEndorsementResult> {
  // Clamp + coerce stakeSts (defence-in-depth — the route also validates).
  const stakeSts = Math.max(1, Math.min(ENDORSEMENT_STAKE_CAP, Math.floor(Number(params.stakeSts) || 0)));

  // Parallel reads — endorser + enterprise + existing count.
  const [endorser, enterprise, existingCount] = await Promise.all([
    db.user.findUnique({
      where: { id: params.endorserId },
      select: { id: true, sovereignTrustScore: true, legalName: true },
    }),
    db.enterprise.findUnique({
      where: { id: params.enterpriseId },
      select: { id: true, name: true, tier: true, status: true },
    }),
    db.constitutionalEndorsement.count({
      where: { endorserId: params.endorserId, active: true },
    }),
  ]);

  if (!endorser) {
    throw new Error("Endorser not found");
  }
  if (!enterprise) {
    throw new Error("Enterprise not found");
  }

  // Also block self-endorsement (founder endorsing own enterprise).
  // The CRE policy does not encode this (it cannot — it has no endorserId
  // context), so we enforce it here at the service layer.
  const isSelfEndorse = await db.enterprise
    .findFirst({
      where: { id: params.enterpriseId, founderId: params.endorserId },
      select: { id: true },
    })
    .then((r) => r !== null);

  // Also block duplicate active endorsements of the SAME enterprise by the
  // same user (would otherwise let one user dump 5×15 = 75 STS on a single
  // enterprise).
  const alreadyEndorsedThisEnterprise = await db.constitutionalEndorsement.findFirst({
    where: {
      endorserId: params.endorserId,
      enterpriseId: params.enterpriseId,
      active: true,
    },
    select: { id: true },
  });

  const verdict = enforceConstitutionalEndorsement({
    endorserSts: endorser.sovereignTrustScore,
    stakeSts,
    enterpriseStatus: enterprise.status,
    existingStakesByUser: existingCount,
  });

  if (!verdict.allowed) {
    // Audit the CRE denial so it shows up in the audit-log feed.
    await audit({
      actorId: params.endorserId,
      action: "endorsement.create",
      target: `enterprise:${params.enterpriseId}`,
      result: "denied",
      reason: verdict.reason,
      metadata: {
        policy: verdict.policy,
        stakeSts,
        endorserSts: endorser.sovereignTrustScore,
      },
    });
    throw new DenialError(verdict.reason ?? "Endorsement denied by CRE", verdict);
  }

  if (isSelfEndorse) {
    throw new DenialError(
      "Cannot endorse an enterprise you founded — self-endorsement is forbidden",
      {
        ...verdict,
        allowed: false,
        reason: "self_endorsement_forbidden",
      }
    );
  }

  if (alreadyEndorsedThisEnterprise) {
    throw new DenialError(
      "You already have an active endorsement for this enterprise — resolve it first",
      {
        ...verdict,
        allowed: false,
        reason: "duplicate_active_endorsement",
      }
    );
  }

  // ── Transactional write: row + ledger event ──
  const created = await db.$transaction(async (tx: PrismaTransaction) => {
    const row = await tx.constitutionalEndorsement.create({
      data: {
        endorserId: params.endorserId,
        enterpriseId: params.enterpriseId,
        stakeSts,
        active: true,
        outcome: "pending",
        stsDelta: 0,
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: params.enterpriseId,
      eventType: "endorsement_created",
      payload: {
        endorsementId: row.id,
        endorserId: params.endorserId,
        stakeSts,
        endorserSts: endorser.sovereignTrustScore,
        enterpriseTier: enterprise.tier,
        policy: verdict.policy,
        decisionToken: verdict.decisionToken,
        note:
          "Reputation-as-collateral endorsement created. STS points staked " +
          "for reputation only — no financial value, no dividends, no derivatives.",
      },
      actorId: params.endorserId,
    });

    return row;
  });

  // Audit the successful creation (best-effort, outside tx — never break flow).
  await audit({
    actorId: params.endorserId,
    action: "endorsement.created",
    target: `enterprise:${params.enterpriseId}`,
    result: "allowed",
    metadata: {
      endorsementId: created.id,
      stakeSts,
      endorserSts: endorser.sovereignTrustScore,
      enterpriseTier: enterprise.tier,
      policy: verdict.policy,
    },
  });

  return {
    endorsement: mapRow(created, { name: enterprise.name, tier: enterprise.tier }),
    verdict,
  };
}

// ── listEndorsementsByUser ──
// Returns ALL of a user's endorsements (active + resolved) with enterprise
// names, newest first. Used by the dashboard.
export async function listEndorsementsByUser(userId: string): Promise<Endorsement[]> {
  const rows = await db.constitutionalEndorsement.findMany({
    where: { endorserId: userId },
    include: {
      enterprise: { select: { name: true, tier: true } },
    },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((r) => mapRow(r, r.enterprise));
}

// ── listEndorsementsForEnterprise ──
// Returns ALL endorsements of an enterprise (active + resolved). Used by the
// public-ish enterprise endorsement endpoint + manager resolve UI.
export async function listEndorsementsForEnterprise(
  enterpriseId: string
): Promise<Endorsement[]> {
  const rows = await db.constitutionalEndorsement.findMany({
    where: { enterpriseId },
    include: {
      enterprise: { select: { name: true, tier: true } },
    },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((r) => mapRow(r, r.enterprise));
}

// ── resolveEndorsement ──
// Marks an endorsement as resolved: active=false, resolvedAt=now, outcome
// set, stsDelta = outcome==='success' ? +stakeSts : -stakeSts. Updates the
// endorser's sovereignTrustScore (clamped to [0, 100]) inside the same
// transaction as the endorsement update + ledger event. Idempotent — calling
// resolve on an already-resolved endorsement throws.
export async function resolveEndorsement(
  endorsementId: string,
  outcome: "success" | "failure",
  resolvedBy: string
): Promise<void> {
  const existing = await db.constitutionalEndorsement.findUnique({
    where: { id: endorsementId },
    include: {
      enterprise: { select: { id: true, name: true, tier: true } },
    },
  });

  if (!existing) {
    throw new Error("Endorsement not found");
  }
  if (!existing.active) {
    throw new Error(`Endorsement already resolved as ${existing.outcome}`);
  }

  const stsDelta = outcome === "success" ? existing.stakeSts : -existing.stakeSts;

  await db.$transaction(async (tx: PrismaTransaction) => {
    // 1. Resolve the endorsement row.
    await tx.constitutionalEndorsement.update({
      where: { id: endorsementId },
      data: {
        active: false,
        outcome,
        stsDelta,
        resolvedAt: new Date(),
      },
    });

    // 2. Apply the reputation delta to the endorser's STS, clamped to [0, 100].
    //    We do this inside the tx so the STS change is atomic with the row
    //    update — no partial state visible to a concurrent read.
    const endorser = await tx.user.findUnique({
      where: { id: existing.endorserId },
      select: { id: true, sovereignTrustScore: true, legalName: true },
    });
    if (endorser) {
      const newSts = Math.max(0, Math.min(100, endorser.sovereignTrustScore + stsDelta));
      await tx.user.update({
        where: { id: endorser.id },
        data: { sovereignTrustScore: newSts },
      });
    }

    // 3. Ledger event — immutable record of the resolution + STS mutation.
    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "endorsement_resolved",
      payload: {
        endorsementId: existing.id,
        endorserId: existing.endorserId,
        outcome,
        stakeSts: existing.stakeSts,
        stsDelta,
        resolvedBy,
        note:
          outcome === "success"
            ? "Endorsement succeeded — STS reputation awarded to endorser (reputation only, not financial)."
            : "Endorsement failed — STS reputation forfeited by endorser (reputation only, not financial).",
      },
      actorId: resolvedBy,
    });
  });

  // Audit (best-effort, outside tx).
  await audit({
    actorId: resolvedBy,
    action: "endorsement.resolved",
    target: `endorsement:${endorsementId}`,
    result: "allowed",
    metadata: {
      endorsementId,
      endorserId: existing.endorserId,
      enterpriseId: existing.enterpriseId,
      outcome,
      stakeSts: existing.stakeSts,
      stsDelta,
    },
  });
}

// ── getEndorsementStats ──
// Aggregate metrics for an enterprise: total STS staked across all
// endorsements, distinct endorsers, success rate among resolved ones.
export async function getEndorsementStats(
  enterpriseId: string
): Promise<EndorsementStats> {
  const rows = await db.constitutionalEndorsement.findMany({
    where: { enterpriseId },
    select: {
      stakeSts: true,
      active: true,
      outcome: true,
      endorserId: true,
    },
  });

  const total = rows.length;
  const totalSts = rows.reduce((s, r) => s + r.stakeSts, 0);
  const activeSts = rows
    .filter((r) => r.active)
    .reduce((s, r) => s + r.stakeSts, 0);
  const distinctEndorsers = new Set(rows.map((r) => r.endorserId));
  const resolved = rows.filter((r) => !r.active);
  const successes = resolved.filter((r) => r.outcome === "success");

  return {
    totalSts,
    endorserCount: distinctEndorsers.size,
    successRate: resolved.length === 0 ? 0 : (successes.length / resolved.length) * 100,
    activeSts,
    total,
    resolvedCount: resolved.length,
    successCount: successes.length,
  };
}

// ── DenialError — carries the CRE verdict so API routes can return it ──
// verbatim (reason + policy + decisionToken) instead of a generic 400.
export class DenialError extends Error {
  verdict: CreVerdict;
  constructor(message: string, verdict: CreVerdict) {
    super(message);
    this.name = "DenialError";
    this.verdict = verdict;
  }
}
