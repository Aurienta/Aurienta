// AURIENTA — Diaspora Corridor Rounds (Phase 2)
//
// The Diaspora Corridor channels capital from Egyptian nationals abroad into
// real-economy enterprises back home. A "round" is a time-boxed window during
// which diaspora capital is collected against a specific enterprise at a
// locked FX rate (the rate prevailing at round open is held until closesAt,
// protecting the diaspora participant from intra-round EGP volatility).
//
// This module is INTENTIONALLY NARROW at launch:
//   - Egypt-only (the only jurisdiction with the regulatory plumbing we need
//     for cross-border remittance + AML 80/2002 source-of-funds checks).
//   - Round-scoped: it tracks pledges + participant counts + FX locks per
//     round. It does NOT move money — actual remittance happens through the
//     Diaspora Participation Bridge (/api/diaspora) and the (pilot) Law Firm
//     Client Account. Rounds here are an information + governance layer.
//   - Open / closed / settled lifecycle. A round is "open" between createdAt
//     and closesAt, "closed" once closesAt passes (no new pledges accepted),
//     and "settled" once the underlying capital has been deployed by the
//     enterprise and the round is reconciled.
//
// Constitutional invariants honoured here:
//   - Zero Custody (I 1.1) — AURIENTA never holds the diaspora capital. The
//     round's totalPledgedEgp field is a PLEDGE TALLY, not a custodied
//     balance. The actual money flows through regulated banks.
//   - No Speculation (I 1.3) — rounds are tied to real enterprises raising
//     real capital for real operations. No speculative instruments, no
//     derivatives, no secondary-market trading of round slots.
//   - Real Economy Only (I 1.8) — enterpriseId must reference an existing
//     Enterprise row. No synthetic counterparties.

import { db } from "@/lib/db";
import type { PrismaTransaction } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";

// ── Types ──────────────────────────────────────────────────────────────────

export type DiasporaCorridorRound = {
  id: string;
  enterpriseId: string;
  totalPledgedEgp: number;
  participantCount: number;
  fxRateLocked: number;
  status: string;
  closesAt: Date;
  createdAt: Date;
};

/** A round joined with the parent enterprise's display fields. */
export type DiasporaCorridorRoundWithEnterprise = DiasporaCorridorRound & {
  enterpriseName: string;
  enterpriseSlug: string;
  enterpriseTier: string;
  enterpriseSector: string;
};

export type CreateRoundParams = {
  enterpriseId: string;
  fxRateLocked: number;
  closesAt: Date;
  managerId: string;
};

// ── Constants ──────────────────────────────────────────────────────────────

/** A round must stay open for at least 24h to give diaspora participants fair notice. */
export const MIN_ROUND_DURATION_MS = 24 * 60 * 60 * 1000;

/** A round may not stay open longer than 90 days (after that, re-lock the FX rate). */
export const MAX_ROUND_DURATION_MS = 90 * 24 * 60 * 60 * 1000;

/** Sanity bounds on the FX rate (EGP per 1 USD). Catches unit-inversion bugs. */
export const FX_RATE_SANITY_MIN = 1;
export const FX_RATE_SANITY_MAX = 1000;

// ── Helpers ────────────────────────────────────────────────────────────────

function toExternal(r: {
  id: string;
  enterpriseId: string;
  totalPledgedEgp: number;
  participantCount: number;
  fxRateLocked: number;
  status: string;
  closesAt: Date;
  createdAt: Date;
}): DiasporaCorridorRound {
  return { ...r };
}

function validateFxRate(fxRateLocked: number): void {
  if (typeof fxRateLocked !== "number" || !Number.isFinite(fxRateLocked)) {
    throw new Error("fxRateLocked must be a finite number");
  }
  if (fxRateLocked <= 0) {
    throw new Error("fxRateLocked must be positive (units: EGP per 1 unit of foreign currency)");
  }
  if (fxRateLocked < FX_RATE_SANITY_MIN || fxRateLocked > FX_RATE_SANITY_MAX) {
    throw new Error(
      `fxRateLocked out of sanity range [${FX_RATE_SANITY_MIN}, ${FX_RATE_SANITY_MAX}] — likely unit confusion`
    );
  }
}

function validateClosesAt(closesAt: Date): void {
  const now = Date.now();
  const close = closesAt.getTime();
  if (!Number.isFinite(close)) {
    throw new Error("closesAt must be a valid date");
  }
  if (close - now < MIN_ROUND_DURATION_MS) {
    throw new Error(
      `closesAt must be at least 24h in the future (min round duration for fair diaspora notice)`
    );
  }
  if (close - now > MAX_ROUND_DURATION_MS) {
    throw new Error(
      `closesAt must be at most 90 days in the future (re-lock the FX rate after that)`
    );
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Open a new diaspora capital round for an enterprise. Only the enterprise's
 * manager (or founding_operator) may open a round — callers must verify
 * authorization before invoking.
 *
 * The round opens with status='open', totalPledgedEgp=0, participantCount=0.
 * The fxRateLocked + closesAt are validated against sanity bounds.
 *
 * Returns the created round. Throws on invalid params or unknown enterprise.
 */
export async function createRound(
  params: CreateRoundParams
): Promise<DiasporaCorridorRoundWithEnterprise> {
  validateFxRate(params.fxRateLocked);
  validateClosesAt(params.closesAt);

  // Verify enterprise exists (Real Economy Only — I 1.8).
  const enterprise = await db.enterprise.findUnique({
    where: { id: params.enterpriseId },
    select: { id: true, name: true, slug: true, tier: true, sector: true },
  });
  if (!enterprise) {
    throw new Error("enterprise_not_found");
  }

  const created = await db.$transaction(async (tx: PrismaTransaction) => {
    const row = await tx.diasporaCorridorRound.create({
      data: {
        enterpriseId: params.enterpriseId,
        totalPledgedEgp: 0,
        participantCount: 0,
        fxRateLocked: params.fxRateLocked,
        status: "open",
        closesAt: params.closesAt,
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: params.enterpriseId,
      eventType: "diaspora_corridor_round_opened",
      payload: {
        roundId: row.id,
        enterpriseId: params.enterpriseId,
        enterpriseName: enterprise.name,
        fxRateLocked: row.fxRateLocked,
        closesAt: row.closesAt.toISOString(),
        note:
          "Diaspora Corridor round opened. Capital pledges are accepted " +
          "until closesAt; the FX rate is locked for the full duration of " +
          "the round. AURIENTA never holds the pledged capital — pledges " +
          "settle via regulated bank rails (Zero Custody I 1.1). Egypt-only " +
          "at launch; cross-border remittance subject to AML Law 80/2002.",
      },
      actorId: params.managerId,
    });

    return row;
  });

  await audit({
    actorId: params.managerId,
    action: "diaspora_corridor.round_open",
    target: `diaspora_corridor_round:${created.id}`,
    result: "allowed",
    metadata: {
      enterpriseId: params.enterpriseId,
      enterpriseName: enterprise.name,
      fxRateLocked: created.fxRateLocked,
      closesAt: created.closesAt.toISOString(),
    },
  });

  // createRound already loaded the enterprise above; attach its display
  // fields so the API route can serialize without a second lookup.
  return {
    ...toExternal(created),
    enterpriseName: enterprise.name,
    enterpriseSlug: enterprise.slug,
    enterpriseTier: enterprise.tier,
    enterpriseSector: enterprise.sector,
  };
}

/**
 * List all currently-open rounds, joined with their parent enterprise's
 * display fields. Sorted by closesAt ascending (soonest-closing first).
 *
 * Rounds whose closesAt has already passed but whose status is still "open"
 * are NOT returned here — they should be swept to status='closed' by a
 * separate cron job (not in this gap).
 */
export async function listOpenRounds(): Promise<
  DiasporaCorridorRoundWithEnterprise[]
> {
  const now = new Date();
  const rows = await db.diasporaCorridorRound.findMany({
    where: {
      status: "open",
      closesAt: { gt: now },
    },
    orderBy: { closesAt: "asc" },
    take: 50,
  });
  if (rows.length === 0) return [];

  const enterpriseIds = Array.from(new Set(rows.map((r) => r.enterpriseId)));
  const enterprises = await db.enterprise.findMany({
    where: { id: { in: enterpriseIds } },
    select: { id: true, name: true, slug: true, tier: true, sector: true },
  });
  const byId = new Map(enterprises.map((e) => [e.id, e]));

  return rows.map((r) => {
    const e = byId.get(r.enterpriseId);
    return {
      ...toExternal(r),
      enterpriseName: e?.name ?? "Unknown enterprise",
      enterpriseSlug: e?.slug ?? "",
      enterpriseTier: e?.tier ?? "?",
      enterpriseSector: e?.sector ?? "—",
    };
  });
}

/**
 * List all rounds (any status) for a given enterprise, newest-first. Used by
 * the enterprise manager to track historical + active capital-raising rounds.
 */
export async function listRoundsForEnterprise(
  enterpriseId: string
): Promise<DiasporaCorridorRoundWithEnterprise[]> {
  const rows = await db.diasporaCorridorRound.findMany({
    where: { enterpriseId },
    orderBy: { createdAt: "desc" },
  });
  if (rows.length === 0) return [];

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { id: true, name: true, slug: true, tier: true, sector: true },
  });

  return rows.map((r) => ({
    ...toExternal(r),
    enterpriseName: enterprise?.name ?? "Unknown enterprise",
    enterpriseSlug: enterprise?.slug ?? "",
    enterpriseTier: enterprise?.tier ?? "?",
    enterpriseSector: enterprise?.sector ?? "—",
  }));
}
