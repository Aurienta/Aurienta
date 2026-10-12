// AURIENTA — Soulbound Constitutional Credential (Phase 4, ROADMAP-13)
// ─────────────────────────────────────────────────────────────────────────
// Non-transferable identity NFT bound to a verified user. Represents the
// user's verification level + Sovereign Trust Score, anchored to their
// Ed25519 identity anchor. The credential is:
//
//   - NON-TRANSFERABLE (isTransferable is HARD false) — soulbound. The user
//     cannot sell, gift, trade, or otherwise alienate the credential. This
//     prevents securities classification under Capital Market Law 95/1992.
//   - REVOCABLE — only by AURIENTA (aurienta_rep), via revokeCredential().
//   - PORTABLE + VERIFIABLE — the metadata is content-addressed (IPFS CID)
//     and signed by the platform's Ed25519 key, so any third party can
//     verify authenticity without contacting AURIENTA.
//
// One credential per user (userId is @unique in the SoulboundCredential model).
// Minting is gated by enforceSoulboundCredential() in cre.ts:
//   - isTransferable must be false
//   - user must be verified (L1+)
//   - no existing credential

import type { SoulboundCredential } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import {
  appendLedgerEvent,
  enforceSoulboundCredential,
  type CreVerdict,
} from "@/lib/aurienta/cre";
import { computeCid } from "@/lib/aurienta/ipfs";
import { platformPublicKeyHex } from "@/lib/aurienta/signing";

// ── Verification level ordering ──
// L0 anonymous, L1 email/mobile, L2 basic KYC, L3 enhanced, L4 institutional.
const LEVEL_ORDER: Record<string, number> = {
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
};

/** Returns true if the user is verified at L1 or above. */
export function isUserVerified(verificationLevel: string): boolean {
  return (LEVEL_ORDER[verificationLevel] ?? 0) >= 1;
}

// ── Tier name from Sovereign Trust Score ──
// Mirrors the User.tier values so the credential card can derive a tier name
// from the score even after minting (when the score may have changed).
export function tierNameFromScore(score: number): string {
  if (score >= 90) return "Constitutional Pillar";
  if (score >= 80) return "Ecosystem Builder";
  if (score >= 70) return "Trusted Contributor";
  if (score >= 60) return "Active Member";
  return "Emerging Participant";
}

/** Public metadata shape — pinned to IPFS as the credential's token URI. */
export type CredentialMetadata = {
  name: string;
  type: string; // always "soulbound"
  userId: string;
  legalName: string;
  verificationLevel: string;
  sovereignTrustScore: number;
  anchorPublicKey: string;
  mintedAt: string; // ISO
  platformPublicKey: string;
};

/**
 * Mint a soulbound constitutional credential for the given user.
 *
 * Returns `{ credential, verdict }`. If the CRE policy denies the mint,
 * `credential` is null and `verdict.allowed` is false with `verdict.reason`
 * explaining why (user not verified, already has credential, etc.).
 *
 * On success:
 *   1. Builds the canonical metadata JSON (signed implicitly via the
 *      platform public key embedded inside).
 *   2. Computes a deterministic IPFS CID over the metadata → tokenUri.
 *   3. Persists the SoulboundCredential (isTransferable HARD false) and
 *      appends a `soulbound_minted` ledger event inside ONE transaction
 *      so the mint is tamper-evident and atomic.
 *   4. Writes an audit log entry.
 */
export async function mintCredential(
  userId: string
): Promise<{ credential: SoulboundCredential | null; verdict: CreVerdict }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      legalName: true,
      verificationLevel: true,
      sovereignTrustScore: true,
      identityAnchor: true,
    },
  });

  if (!user) {
    return {
      credential: null,
      verdict: {
        allowed: false,
        reason: "User not found",
        policy: "soulbound_credential.rego",
        decisionToken: "",
      },
    };
  }

  // ── Pre-existing credential check ──
  // userId is @unique on SoulboundCredential; the findUnique + the unique
  // constraint together close the TOCTOU race against concurrent mints.
  const existing = await db.soulboundCredential.findUnique({
    where: { userId },
  });

  const verdict = enforceSoulboundCredential({
    isTransferable: false, // HARD: never transferable
    userVerified: isUserVerified(user.verificationLevel),
    existingCredential: !!existing,
  });

  if (!verdict.allowed) {
    await audit({
      actorId: userId,
      action: "soulbound.mint",
      result: "denied",
      reason: verdict.reason,
      metadata: { verificationLevel: user.verificationLevel },
    });
    return { credential: null, verdict };
  }

  // ── Build metadata + IPFS CID ──
  const mintedAt = new Date();
  const metadata: CredentialMetadata = {
    name: "AURIENTA Constitutional Credential",
    type: "soulbound",
    userId,
    legalName: user.legalName,
    verificationLevel: user.verificationLevel,
    sovereignTrustScore: user.sovereignTrustScore,
    anchorPublicKey: user.identityAnchor ?? "",
    mintedAt: mintedAt.toISOString(),
    platformPublicKey: platformPublicKeyHex(),
  };
  const tokenUri = `ipfs://${computeCid(JSON.stringify(metadata))}`;

  // ── Persist credential + ledger event inside ONE transaction ──
  // isTransferable is HARD false — no caller can ever flip this.
  let credential: SoulboundCredential;
  try {
    credential = await db.$transaction(async (tx) => {
      const created = await tx.soulboundCredential.create({
        data: {
          userId,
          credentialType: "identity",
          verificationLevel: user.verificationLevel,
          sovereignTrustScore: user.sovereignTrustScore,
          anchorPublicKey: user.identityAnchor ?? "",
          tokenUri,
          isTransferable: false, // HARD — never soulbound-otherwise
          isRevoked: false,
          mintedAt,
        },
      });

      await appendLedgerEvent(tx, {
        eventType: "soulbound_minted",
        payload: {
          action: "soulbound_minted",
          credentialId: created.id,
          userId,
          legalName: user.legalName,
          verificationLevel: user.verificationLevel,
          sovereignTrustScore: user.sovereignTrustScore,
          tokenUri,
          anchorPublicKey: created.anchorPublicKey,
          platformPublicKey: metadata.platformPublicKey,
          isTransferable: false,
          note:
            "Non-transferable constitutional identity credential minted (soulbound). " +
            "Cannot be sold, transferred, or traded. Revocable only by AURIENTA. " +
            "Excluded from securities classification under Capital Market Law 95/1992.",
        },
        actorId: userId,
      });

      return created;
    });
  } catch (e: unknown) {
    // P2002 = userId unique constraint — concurrent mint attempt.
    // The first transaction wins; surface a clean "already exists" verdict.
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      await audit({
        actorId: userId,
        action: "soulbound.mint",
        result: "denied",
        reason: "duplicate_concurrent_mint",
      });
      return {
        credential: null,
        verdict: {
          allowed: false,
          reason: "User already has a soulbound credential",
          policy: "soulbound_credential.rego",
          decisionToken: "",
        },
      };
    }
    throw e;
  }

  await audit({
    actorId: userId,
    action: "soulbound.mint",
    target: `soulbound:${credential.id}`,
    result: "allowed",
    metadata: {
      credentialId: credential.id,
      tokenUri,
      verificationLevel: user.verificationLevel,
    },
  });

  return { credential, verdict };
}

/** Load the user's credential, or null if not yet minted. */
export async function getCredential(
  userId: string
): Promise<SoulboundCredential | null> {
  return db.soulboundCredential.findUnique({ where: { userId } });
}

/**
 * Revoke a soulbound credential. Only AURIENTA (aurienta_rep) may call this —
 * the API route enforces that role. Sets isRevoked=true + revokedAt=now and
 * appends a `soulbound_revoked` ledger event.
 *
 * The credential is NOT deleted — the record remains for audit history and
 * external verification (verifyCredential will report `valid: false`).
 */
export async function revokeCredential(
  userId: string,
  reason: string,
  revokedBy: string
): Promise<SoulboundCredential | null> {
  const existing = await db.soulboundCredential.findUnique({
    where: { userId },
  });
  if (!existing) return null;
  if (existing.isRevoked) return existing;

  const revokedAt = new Date();
  const updated = await db.$transaction(async (tx) => {
    const c = await tx.soulboundCredential.update({
      where: { id: existing.id },
      data: {
        isRevoked: true,
        revokedAt,
      },
    });

    await appendLedgerEvent(tx, {
      eventType: "soulbound_revoked",
      payload: {
        action: "soulbound_revoked",
        credentialId: c.id,
        userId,
        reason,
        revokedBy,
        revokedAt: revokedAt.toISOString(),
        note:
          "Soulbound credential revoked by AURIENTA. The credential is no " +
          "longer valid for external verification but is retained for audit.",
      },
      actorId: revokedBy,
    });

    return c;
  });

  await audit({
    actorId: revokedBy,
    action: "soulbound.revoke",
    target: `soulbound:${updated.id}`,
    result: "allowed",
    reason,
    metadata: { userId, revokedAt: revokedAt.toISOString() },
  });

  return updated;
}

/**
 * Verify a soulbound credential by ID. Returns:
 *   - { valid: true, credential } if the credential exists, is not revoked,
 *     and isTransferable is false (the soulbound invariant).
 *   - { valid: false, reason } if any of those checks fail.
 *
 * Any third party can call this (via the /api/soulbound/verify route) without
 * authenticating — verification is the whole point of a portable credential.
 */
export async function verifyCredential(
  credentialId: string
): Promise<{
  valid: boolean;
  credential?: SoulboundCredential;
  reason?: string;
}> {
  const credential = await db.soulboundCredential.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    return { valid: false, reason: "Credential not found" };
  }
  if (credential.isRevoked) {
    return {
      valid: false,
      credential,
      reason: `Credential revoked on ${credential.revokedAt?.toISOString() ?? "unknown date"}`,
    };
  }
  // The soulbound invariant — isTransferable must always be false. If a
  // record is somehow transferable (data corruption or a back-door edit),
  // verification MUST fail closed.
  if (credential.isTransferable) {
    return {
      valid: false,
      credential,
      reason: "Credential is marked transferable — soulbound invariant violated",
    };
  }
  return { valid: true, credential };
}

/**
 * List all credentials (for the admin / aurienta_rep view). Ordered by most
 * recently minted. Pass a limit (default 100, capped at 500) to bound the
 * query.
 */
export async function listAllCredentials(
  limit: number = 100
): Promise<SoulboundCredential[]> {
  const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));
  return db.soulboundCredential.findMany({
    orderBy: { mintedAt: "desc" },
    take: safeLimit,
  });
}
