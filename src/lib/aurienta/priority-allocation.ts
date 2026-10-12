// AURIENTA Priority Window Allocation — STS-weighted deterministic access
// to capital formation rounds.
//
// DETERMINISTIC — NOT a lottery. Higher Sovereign Trust Score = earlier
// (lower-rank) access. No random element. Transparent + constitutional.
// This module was restructured from the original "Constitutional Lottery"
// design (which would breach Egyptian Gambling Law 10/1956).
//
// Three fundraising phases — each progressively more permissive:
//   Phase 1 (STS >= 50) — Trusted Contributor+ get earliest access.
//   Phase 2 (STS >= 35) — Active Member+ join after Phase 1 closes.
//   Phase 3 (open)     — All verified partners may participate.
//
// The allocation rank is computed deterministically at registration time:
//   rank = (count of existing allocations for this enterprise+phase with
//          stsAtAllocation strictly greater than the new registrant's STS) + 1
//
// So rank 1 = highest STS at the moment of registration. Ties share the
// same rank number (standard competition ranking: 1, 1, 3, 4). The
// getRankings view sorts by rank ASC then createdAt ASC so earlier
// registrants appear first on ties.

import { db } from "@/lib/db";
import type { PrismaTransaction } from "@/lib/db";
import {
  appendLedgerEvent,
  enforcePriorityWindowAllocation,
  type CreVerdict,
} from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";

// ── Public types ──
export type PriorityAllocation = {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  windowPhase: 1 | 2 | 3;
  userId: string;
  stsAtAllocation: number;
  allocationRank: number;
  allocatedEgp: number;
  allocatedAt: string | null;
  createdAt: string;
};

export type RankingRow = {
  userId: string;
  legalName: string;
  stsAtAllocation: number;
  allocationRank: number;
  allocatedEgp: number;
  allocatedAt: string | null;
};

// ── Phase eligibility table (mirrors enforcePriorityWindowAllocation) ──
// Kept here so the UI can show eligibility without round-tripping through
// the CRE verdict. The CRE policy remains the single source of truth on
// the server side.
export const PHASE_MIN_STS: Record<number, number> = {
  1: 50, // Trusted Contributor+
  2: 35, // Active Member+
  3: 0, // open to all verified
};

export function isPhaseEligible(userSts: number, windowPhase: number): boolean {
  const min = PHASE_MIN_STS[windowPhase];
  if (min === undefined) return false;
  return userSts >= min;
}

export function isValidPhase(phase: number): phase is 1 | 2 | 3 {
  return phase === 1 || phase === 2 || phase === 3;
}

// ── registerInterest ──
// Loads user STS, checks if already allocated (via unique constraint on
// [enterpriseId, windowPhase, userId]). Calls the CRE policy. If allowed,
// computes deterministic allocationRank and creates the PriorityWindowAllocation
// row (allocatedEgp=0, allocatedAt=null) inside a single db.$transaction
// alongside the appendLedgerEvent call.
//
// Returns the new allocation + the CRE verdict (always returned, even on
// denial — callers surface the verdict to the user).
export async function registerInterest(
  userId: string,
  enterpriseId: string,
  windowPhase: number
): Promise<{ allocation: PriorityAllocation | null; verdict: CreVerdict }> {
  if (!isValidPhase(windowPhase)) {
    return {
      allocation: null,
      verdict: {
        allowed: false,
        reason: "Invalid window phase — must be 1, 2, or 3",
        policy: "priority_window_allocation.rego",
        decisionToken: "",
      },
    };
  }

  // ── Load user + enterprise ──
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, legalName: true, sovereignTrustScore: true },
  });
  if (!user) {
    return {
      allocation: null,
      verdict: {
        allowed: false,
        reason: "User not found",
        policy: "priority_window_allocation.rego",
        decisionToken: "",
      },
    };
  }

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { id: true, name: true, status: true },
  });
  if (!enterprise) {
    return {
      allocation: null,
      verdict: {
        allowed: false,
        reason: "Enterprise not found",
        policy: "priority_window_allocation.rego",
        decisionToken: "",
      },
    };
  }

  // ── CRE: check existing allocation via unique constraint ──
  const existing = await db.priorityWindowAllocation.findUnique({
    where: {
      enterpriseId_windowPhase_userId: {
        enterpriseId,
        windowPhase,
        userId,
      },
    },
  });

  const verdict = enforcePriorityWindowAllocation({
    userSts: user.sovereignTrustScore,
    windowPhase,
    alreadyAllocatedThisPhase: Boolean(existing),
  });

  if (!verdict.allowed) {
    await audit({
      actorId: userId,
      action: "priority_allocation.register",
      target: `enterprise:${enterpriseId}:phase:${windowPhase}`,
      result: "denied",
      reason: verdict.reason,
      metadata: {
        policy: verdict.policy,
        userSts: user.sovereignTrustScore,
        windowPhase,
      },
    });
    return { allocation: null, verdict };
  }

  // ── Compute deterministic rank ──
  // Higher STS = lower rank number. Count existing allocations for this
  // enterprise+phase with STRICTLY higher STS, then add 1.
  const higherStsCount = await db.priorityWindowAllocation.count({
    where: {
      enterpriseId,
      windowPhase,
      stsAtAllocation: { gt: user.sovereignTrustScore },
    },
  });
  const allocationRank = higherStsCount + 1;

  // ── Persist allocation + ledger event inside ONE transaction ──
  // P2002 (unique constraint) surfaces to the caller as a 409 — concurrent
  // register-interest requests for the same user+phase resolve to a single
  // allocation row, the second is rejected with the "already allocated"
  // CRE verdict.
  let allocation;
  try {
    allocation = await db.$transaction(async (tx: PrismaTransaction) => {
      const created = await tx.priorityWindowAllocation.create({
        data: {
          enterpriseId,
          windowPhase,
          userId,
          stsAtAllocation: user.sovereignTrustScore,
          allocationRank,
          allocatedEgp: 0,
          allocatedAt: null,
        },
      });

      await appendLedgerEvent(tx, {
        enterpriseId,
        eventType: "priority_allocation_registered",
        payload: {
          action: "register_interest",
          allocationId: created.id,
          userId,
          windowPhase,
          stsAtAllocation: user.sovereignTrustScore,
          allocationRank,
          enterpriseName: enterprise.name,
          note:
            "STS-weighted priority allocation registered. Deterministic rank — " +
            "no lottery, no randomness. Compliant with Egyptian law " +
            "(Gambling Law 10/1956).",
        },
        actorId: userId,
      });

      return created;
    });
  } catch (e) {
    // P2002 — concurrent registration from the same user.
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return {
        allocation: null,
        verdict: {
          allowed: false,
          reason: "User already allocated in this phase",
          policy: "priority_window_allocation.rego",
          decisionToken: "",
        },
      };
    }
    throw e;
  }

  await audit({
    actorId: userId,
    action: "priority_allocation.register",
    target: `enterprise:${enterpriseId}:phase:${windowPhase}`,
    result: "allowed",
    metadata: {
      allocationId: allocation.id,
      windowPhase,
      stsAtAllocation: user.sovereignTrustScore,
      allocationRank,
    },
  });

  return {
    allocation: {
      id: allocation.id,
      enterpriseId,
      enterpriseName: enterprise.name,
      windowPhase: windowPhase as 1 | 2 | 3,
      userId,
      stsAtAllocation: allocation.stsAtAllocation,
      allocationRank: allocation.allocationRank,
      allocatedEgp: allocation.allocatedEgp,
      allocatedAt: allocation.allocatedAt
        ? allocation.allocatedAt.toISOString()
        : null,
      createdAt: allocation.createdAt.toISOString(),
    },
    verdict,
  };
}

// ── executeAllocation ──
// Manager-only — sets allocatedEgp + allocatedAt=now. Appends a ledger event
// so the allocation is auditable on the immutable chain.
//
// Authorisation (role check) is performed by the API route, not here — this
// function trusts the caller to have verified the manager role. The function
// still verifies that the allocation exists and is not already executed.
export async function executeAllocation(
  allocationId: string,
  amountEgp: number,
  actorId: string
): Promise<void> {
  const safeAmount = Math.max(0, Math.floor(Number(amountEgp) || 0));

  const existing = await db.priorityWindowAllocation.findUnique({
    where: { id: allocationId },
  });
  if (!existing) {
    throw new Error("Allocation not found");
  }
  if (existing.allocatedAt) {
    throw new Error("Allocation already executed");
  }

  // Manual join — PriorityWindowAllocation has no relation directive to
  // Enterprise (kept isolated from the large Enterprise model per the
  // foundation note). We fetch the enterprise name separately for the
  // immutable ledger payload.
  const enterprise = await db.enterprise.findUnique({
    where: { id: existing.enterpriseId },
    select: { id: true, name: true },
  });
  const enterpriseName = enterprise?.name ?? "Unknown enterprise";

  await db.$transaction(async (tx: PrismaTransaction) => {
    await tx.priorityWindowAllocation.update({
      where: { id: allocationId },
      data: {
        allocatedEgp: safeAmount,
        allocatedAt: new Date(),
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "priority_allocation_executed",
      payload: {
        action: "execute_allocation",
        allocationId,
        enterpriseId: existing.enterpriseId,
        enterpriseName,
        userId: existing.userId,
        windowPhase: existing.windowPhase,
        stsAtAllocation: existing.stsAtAllocation,
        allocationRank: existing.allocationRank,
        allocatedEgp: safeAmount,
        executedBy: actorId,
        note:
          "Capital allocation executed for STS-priority-ranked participant. " +
          "Deterministic — no lottery, no randomness.",
      },
      actorId,
    });
  });

  await audit({
    actorId,
    action: "priority_allocation.execute",
    target: `allocation:${allocationId}`,
    result: "allowed",
    metadata: {
      allocationId,
      userId: existing.userId,
      enterpriseId: existing.enterpriseId,
      windowPhase: existing.windowPhase,
      allocationRank: existing.allocationRank,
      allocatedEgp: safeAmount,
    },
  });
}

// ── getRankings ──
// Returns all allocations for the given enterprise+phase, sorted by rank ASC
// (then by createdAt ASC for tie-breaking on equal STS). Joins the User table
// to surface legalName for the ranking table.
export async function getRankings(
  enterpriseId: string,
  windowPhase: number
): Promise<RankingRow[]> {
  if (!isValidPhase(windowPhase)) return [];

  const allocations = await db.priorityWindowAllocation.findMany({
    where: { enterpriseId, windowPhase },
    orderBy: [{ allocationRank: "asc" }, { createdAt: "asc" }],
    take: 500,
  });

  if (allocations.length === 0) return [];

  // Manual join — PriorityWindowAllocation has no relation directive to User
  // (kept isolated from the large User model per the foundation note).
  const userIds = Array.from(new Set(allocations.map((a) => a.userId)));
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, legalName: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.legalName]));

  return allocations.map((a) => ({
    userId: a.userId,
    legalName: userMap.get(a.userId) ?? "Unknown",
    stsAtAllocation: a.stsAtAllocation,
    allocationRank: a.allocationRank,
    allocatedEgp: a.allocatedEgp,
    allocatedAt: a.allocatedAt ? a.allocatedAt.toISOString() : null,
  }));
}

// ── getUserAllocations ──
// Returns all allocations for a single user, with the enterprise name joined
// in. Sorted by createdAt DESC so the most recent registration is on top.
export async function getUserAllocations(
  userId: string
): Promise<PriorityAllocation[]> {
  const allocations = await db.priorityWindowAllocation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  if (allocations.length === 0) return [];

  const enterpriseIds = Array.from(new Set(allocations.map((a) => a.enterpriseId)));
  const enterprises = await db.enterprise.findMany({
    where: { id: { in: enterpriseIds } },
    select: { id: true, name: true },
  });
  const entMap = new Map(enterprises.map((e) => [e.id, e.name]));

  return allocations.map((a) => ({
    id: a.id,
    enterpriseId: a.enterpriseId,
    enterpriseName: entMap.get(a.enterpriseId) ?? "Unknown enterprise",
    windowPhase: a.windowPhase as 1 | 2 | 3,
    userId,
    stsAtAllocation: a.stsAtAllocation,
    allocationRank: a.allocationRank,
    allocatedEgp: a.allocatedEgp,
    allocatedAt: a.allocatedAt ? a.allocatedAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  }));
}
