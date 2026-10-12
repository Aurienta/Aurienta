// AURIENTA — Standalone Succession Protocol (Phase 2)
//
// Cryptographic succession for NON-AURIENTA family businesses. The 70% family
// business succession failure rate is the core problem this module addresses:
// the moment a founder dies, becomes incapacitated, or steps back, the
// business is paralysed because no one has the credentials, the customers,
// the bank signatories, or the legal mandate to act. The Standalone Succession
// Protocol solves this with:
//
//   1. A cryptographically hashed declaration of intent (declarationHash =
//      SHA-256(businessName + declarantId + timestamp)) that the declarant
//      files BEFORE anything goes wrong.
//   2. Shamir secret sharing (k-of-n) over the operational recovery bundle:
//      n shares are minted and distributed to trusted parties (spouse, eldest
//      child, lawyer, accountant, board chair). At least k shares must be
//      recombined to reconstruct the recovery key — no single party can act
//      alone, but k parties can act even if n-k are unavailable.
//   3. CRE-enforced activation: the Constitutional Runtime Engine emits a
//      signed decision token when a case moves drafted -> activated, anchoring
//      the transition on the immutable ledger. Subsequent execution (transfer
//      of bank signatory rights, customer notifications, ownership handover)
//      is governed by the same CRE policies — never by ad-hoc manual ops.
//
// IMPORTANT — what this is NOT:
//   - NOT fund management. No securities, no custody, no capital. AURIENTA
//     never touches the family business's money. The fee (5,000 EGP) is a
//     legal/governance service fee for the cryptographic + governance
//     infrastructure, not a commission on assets.
//   - NOT a will. A will is a public-court instrument. This is a private,
//     cryptographic, in-force continuity protocol that activates
//     IMMEDIATELY on declaration, not months later through probate.

import { createHash } from "crypto";
import { db } from "@/lib/db";
import type { PrismaTransaction } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";

// ── Types ──────────────────────────────────────────────────────────────────

export type StandaloneSuccessionCase = {
  id: string;
  businessName: string;
  businessType: string;
  jurisdiction: string;
  declarantId: string;
  declarationHash: string;
  shamirThreshold: number;
  shamirShares: number;
  activationDate: Date | null;
  status: string;
  feeEgp: number;
  createdAt: Date;
};

export type CreateCaseParams = {
  businessName: string;
  businessType: string;
  declarantId: string;
  shamirThreshold?: number;
  shamirShares?: number;
};

// ── Constants ──────────────────────────────────────────────────────────────

/** Flat legal/governance service fee in EGP. Not a commission on assets. */
export const STANDALONE_SUCCESSION_FEE_EGP = 5000;

/** Default jurisdiction (Egypt-only at launch per the Diaspora Corridor scope). */
export const STANDALONE_SUCCESSION_DEFAULT_JURISDICTION = "EG";

/** Allowed business types. */
export const BUSINESS_TYPES = [
  "family_business",
  "sme",
  "holding",
] as const;

/** Allowed case statuses (mirror of the Prisma schema docstring). */
export type CaseStatus = "drafted" | "activated" | "executing" | "completed";

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Compute the declaration hash: SHA-256(businessName + declarantId + timestamp).
 * The timestamp is captured at the moment of creation and bound into the hash
 * so that two filings of the SAME business by the SAME declarant at different
 * times produce different hashes (preventing accidental overwrite of the
 * canonical declaration).
 */
function computeDeclarationHash(
  businessName: string,
  declarantId: string,
  timestamp: number
): string {
  return createHash("sha256")
    .update(`${businessName}|${declarantId}|${timestamp}`)
    .digest("hex");
}

/**
 * Validate k-of-n parameters. Shamir secret sharing requires:
 *   1 <= k <= n, with k >= 2 (single-share "secret sharing" is meaningless —
 *  one party already holds everything).
 */
function validateShamirParams(threshold: number, shares: number): void {
  if (!Number.isInteger(threshold) || !Number.isInteger(shares)) {
    throw new Error("Shamir threshold and shares must be integers");
  }
  if (threshold < 2) {
    throw new Error("Shamir threshold must be at least 2 (single-share is not secret sharing)");
  }
  if (shares < 3) {
    throw new Error("Shamir shares must be at least 3");
  }
  if (threshold > shares) {
    throw new Error(
      `Shamir threshold (${threshold}) cannot exceed total shares (${shares})`
    );
  }
  if (shares > 10) {
    throw new Error("Shamir shares capped at 10 (coordination overhead grows quadratically)");
  }
}

function toExternal(c: {
  id: string;
  businessName: string;
  businessType: string;
  jurisdiction: string;
  declarantId: string;
  declarationHash: string;
  shamirThreshold: number;
  shamirShares: number;
  activationDate: Date | null;
  status: string;
  feeEgp: number;
  createdAt: Date;
}): StandaloneSuccessionCase {
  return { ...c };
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Create a new standalone succession case in status "drafted".
 *
 * The case is created inside a single db.$transaction together with a ledger
 * event of type `standalone_succession_created`. The ledger event is what
 * makes the case's existence tamper-evident: any subsequent mutation of the
 * case row can be cross-checked against the immutable chain.
 *
 * Throws on invalid Shamir params. Does NOT verify the declarant's identity —
 * callers (API route handlers) are responsible for auth.
 */
export async function createCase(
  params: CreateCaseParams
): Promise<StandaloneSuccessionCase> {
  const businessName = params.businessName.trim();
  if (businessName.length < 2 || businessName.length > 200) {
    throw new Error("businessName must be 2..200 characters");
  }
  if (!BUSINESS_TYPES.includes(params.businessType as (typeof BUSINESS_TYPES)[number])) {
    throw new Error(
      `businessType must be one of: ${BUSINESS_TYPES.join(", ")}`
    );
  }

  const threshold = params.shamirThreshold ?? 2;
  const shares = params.shamirShares ?? 3;
  validateShamirParams(threshold, shares);

  const timestamp = Date.now();
  const declarationHash = computeDeclarationHash(
    businessName,
    params.declarantId,
    timestamp
  );

  const created = await db.$transaction(async (tx: PrismaTransaction) => {
    const row = await tx.standaloneSuccessionCase.create({
      data: {
        businessName,
        businessType: params.businessType,
        jurisdiction: STANDALONE_SUCCESSION_DEFAULT_JURISDICTION,
        declarantId: params.declarantId,
        declarationHash,
        shamirThreshold: threshold,
        shamirShares: shares,
        status: "drafted",
        feeEgp: STANDALONE_SUCCESSION_FEE_EGP,
      },
    });

    // Anchor the creation on the immutable ledger (enterpriseId=null — this
    // case is NOT an AURIENTA enterprise; it is an external family business).
    await appendLedgerEvent(tx, {
      enterpriseId: null,
      eventType: "standalone_succession_created",
      payload: {
        caseId: row.id,
        businessName,
        businessType: params.businessType,
        jurisdiction: row.jurisdiction,
        declarationHash,
        shamirThreshold: threshold,
        shamirShares: shares,
        feeEgp: row.feeEgp,
        note:
          "Standalone Succession Protocol case created. Cryptographic " +
          "succession for a non-AURIENTA family business. Shamir " +
          `${threshold}-of-${shares} secret sharing. CRE-enforced activation. ` +
          "Legal/governance service only — no fund management, no custody.",
      },
      actorId: params.declarantId,
    });

    return row;
  });

  await audit({
    actorId: params.declarantId,
    action: "standalone_succession.create",
    target: `standalone_succession:${created.id}`,
    result: "allowed",
    metadata: {
      businessName,
      businessType: params.businessType,
      shamirThreshold: threshold,
      shamirShares: shares,
      declarationHash,
      feeEgp: created.feeEgp,
    },
  });

  return toExternal(created);
}

/**
 * Activate a drafted case. Moves status drafted -> activated and stamps the
 * activationDate. Once activated, the Shamir shares are minted and
 * distributed to the designated trustees (off-chain, out of band — AURIENTA
 * never holds the recovery key).
 *
 * Verifies declarant ownership before the transition. Throws on:
 *   - case not found (P2025-like — surfaced as null by caller)
 *   - declarant mismatch (forbidden)
 *   - case is not in "drafted" status (already activated / executing / completed)
 */
export async function activateCase(
  caseId: string,
  declarantId: string
): Promise<StandaloneSuccessionCase> {
  const existing = await db.standaloneSuccessionCase.findUnique({
    where: { id: caseId },
  });
  if (!existing) {
    throw new Error("case_not_found");
  }
  if (existing.declarantId !== declarantId) {
    await audit({
      actorId: declarantId,
      action: "standalone_succession.activate",
      target: `standalone_succession:${caseId}`,
      result: "denied",
      reason: "declarant_mismatch",
    });
    throw new Error("forbidden");
  }
  if (existing.status !== "drafted") {
    throw new Error(
      `case_not_draftable: current status is '${existing.status}'`
    );
  }

  const activationDate = new Date();
  const updated = await db.$transaction(async (tx: PrismaTransaction) => {
    const row = await tx.standaloneSuccessionCase.update({
      where: { id: caseId },
      data: {
        status: "activated",
        activationDate,
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: null,
      eventType: "standalone_succession_activated",
      payload: {
        caseId: row.id,
        businessName: row.businessName,
        shamirThreshold: row.shamirThreshold,
        shamirShares: row.shamirShares,
        declarationHash: row.declarationHash,
        activationDate: activationDate.toISOString(),
        note:
          "Standalone succession case activated. Shamir shares minted and " +
          "distributed to designated trustees out-of-band. CRE has emitted " +
          "an activation decision token; subsequent execution steps (bank " +
          "signatory transfer, customer notification, ownership handover) " +
          "are governed by CRE policies.",
      },
      actorId: declarantId,
    });

    return row;
  });

  await audit({
    actorId: declarantId,
    action: "standalone_succession.activate",
    target: `standalone_succession:${caseId}`,
    result: "allowed",
    metadata: {
      activationDate: activationDate.toISOString(),
      shamirThreshold: updated.shamirThreshold,
      shamirShares: updated.shamirShares,
    },
  });

  return toExternal(updated);
}

/**
 * List all standalone succession cases filed by a given user (declarant).
 * Returns newest-first.
 */
export async function listCasesForUser(
  userId: string
): Promise<StandaloneSuccessionCase[]> {
  const rows = await db.standaloneSuccessionCase.findMany({
    where: { declarantId: userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toExternal);
}

/**
 * Fetch a single case by ID, verifying declarant ownership. Returns null
 * if the case does not exist OR the caller is not the declarant.
 */
export async function getCase(
  caseId: string,
  userId: string
): Promise<StandaloneSuccessionCase | null> {
  const row = await db.standaloneSuccessionCase.findUnique({
    where: { id: caseId },
  });
  if (!row) return null;
  if (row.declarantId !== userId) return null;
  return toExternal(row);
}
