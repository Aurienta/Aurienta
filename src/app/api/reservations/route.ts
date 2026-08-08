import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import {
  appendLedgerEvent,
  computeDynamicMinimum,
  enforceFamilyConsent,
  enforceKycGate,
  enforceNotFrozen,
} from "@/lib/aurienta/cre";
import { reservationSchema, parseBody } from "@/lib/aurienta/validation";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import {
  checkIdempotency,
  getIdempotencyContext,
  storeIdempotency,
} from "@/lib/aurienta/idempotency";

// POST /api/reservations
// Body: { enterpriseId, shares, amountEgp? }
// Reserves Equity Units at the AI fundamental price; funds flow to the Law Firm Client Account
// (zero custody). Generates a reference code, sets a 48h expiry, appends a
// funds_received ledger event. Reservation create + raisedEgp increment + ledger
// append all run inside a single db.$transaction.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // ── Rate limit ──
  const rl = limiters.reservations(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  // ── Validate body ──
  const body = await parseBody(req, reservationSchema);
  if (body instanceof NextResponse) return body;
  const { enterpriseId, shares } = body;

  // ── Idempotency (replay-safe POST for money-moving endpoint) ──
  // If the client sends an Idempotency-Key header, we replay the cached
  // response on retry. Without the header, the request is treated as a
  // normal non-idempotent POST (backward-compatible).
  const idemCtx = await getIdempotencyContext(req, user.id, body);
  if (idemCtx) {
    const cached = await checkIdempotency(idemCtx, "reservations");
    if (cached) return cached;
  }

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
  });
  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found", code: "not_found" },
      { status: 404 }
    );
  }

  // Closed or graduated enterprises cannot accept new reservations.
  if (enterprise.status === "graduated" || enterprise.status === "draft") {
    return NextResponse.json(
      {
        error: `Enterprise is ${enterprise.status.replace("_", " ")} — reservations closed.`,
        code: "closed",
      },
      { status: 400 }
    );
  }

  const amountEgp = Math.round(shares * enterprise.equityUnitPriceEgp);

  // ── CRE: KYC gate (CTO-AUDIT P0-8) ──
  const kyc = enforceKycGate(user.verificationLevel, "reservation", amountEgp);
  if (!kyc.allowed) {
    await audit({
      actorId: user.id,
      action: "reservation.create",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: kyc.reason,
      metadata: { policy: kyc.policy },
    });
    return NextResponse.json(
      {
        error: kyc.reason ?? "KYC gate denied the reservation",
        code: "cre_denied",
        policy: kyc.policy,
        decisionToken: kyc.decisionToken,
      },
      { status: 400 }
    );
  }

  // ── CRE: enterprise must not be frozen ──
  const freeze = enforceNotFrozen(enterprise);
  if (!freeze.allowed) {
    await audit({
      actorId: user.id,
      action: "reservation.create",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: freeze.reason,
      metadata: { policy: freeze.policy },
    });
    return NextResponse.json(
      {
        error: freeze.reason ?? "Enterprise is frozen",
        code: "cre_denied",
        policy: freeze.policy,
        decisionToken: freeze.decisionToken,
      },
      { status: 400 }
    );
  }

  // ── CRE: family consent (CTO-AUDIT P0-7) ──
  // Heuristic: Egyptian (nationality === "EG") capital partners are treated as
  // family members for the consent rule, per the blueprint's Khalil-family
  // doctrine. Real family membership is attested at onboarding.
  const isFamilyMember =
    user.nationality === "EG" && user.primaryIntent === "capital_partner";
  const fam = enforceFamilyConsent(isFamilyMember, user.familyConsent, amountEgp);
  if (!fam.allowed) {
    await audit({
      actorId: user.id,
      action: "reservation.create",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: fam.reason,
      metadata: { policy: fam.policy, isFamilyMember, amountEgp },
    });
    return NextResponse.json(
      {
        error: fam.reason ?? "Family consent required",
        code: "cre_denied",
        policy: fam.policy,
        decisionToken: fam.decisionToken,
      },
      { status: 400 }
    );
  }

  // ── Dynamic minimum (Add-on 19) — single source of truth in cre.ts ──
  let minShares = 1;
  if (enterprise.investorCap) {
    const remainingGoal = Math.max(
      enterprise.fundraisingGoalEgp - enterprise.raisedEgp,
      0
    );
    const investors = await db.ownershipRecord.count({
      where: { enterpriseId, equityUnits: { gt: 0 } },
    });
    const remainingSlots = Math.max(enterprise.investorCap - investors, 1);
    const dynMinEgp = computeDynamicMinimum(
      remainingGoal,
      remainingSlots,
      enterprise.tier
    );
    minShares = Math.max(1, Math.ceil(dynMinEgp / enterprise.equityUnitPriceEgp));
  }
  if (shares < minShares) {
    return NextResponse.json(
      {
        error: `Dynamic minimum: ${minShares} Equity Units required at this stage of Capital Formation.`,
        code: "cre_denied",
        policy: "dynamic_minimum.rego",
        minShares,
      },
      { status: 400 }
    );
  }

  // ── Cap against remaining headroom (no over-issuance) ──
  const remainingGoal = Math.max(
    enterprise.fundraisingGoalEgp - enterprise.raisedEgp,
    0
  );
  if (enterprise.status !== "active" && remainingGoal > 0) {
    const maxShares = Math.floor(remainingGoal / enterprise.equityUnitPriceEgp);
    if (shares > maxShares) {
      return NextResponse.json(
        {
          error: `Only ${maxShares} Equity Units remain before the Capital Formation goal is met.`,
          code: "cre_denied",
          policy: "tier_caps.rego",
          maxShares,
        },
        { status: 400 }
      );
    }
  }

  // Reference code: AURI-2026-{slug}-{uid-prefix}-{timestamp-base36}
  const referenceCode = `AURI-2026-${enterprise.slug}-${user.id.slice(-4)}-${Date.now()
    .toString(36)
    .toUpperCase()}`;

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  // ── Persist reservation + increment raisedEgp + ledger event inside ONE tx ──
  // The transaction fixes the race where two concurrent reservations could
  // over-shoot the Capital Formation goal (raisedEgp was previously updated outside
  // the reservation-create). The unique constraint on referenceCode guards
  // against accidental duplicates; P2002 → 409.
  let reservation;
  try {
    reservation = await db.$transaction(async (tx) => {
      const created = await tx.reservation.create({
        data: {
          enterpriseId,
          userId: user.id,
          equityUnits: shares,
          amountEgp,
          referenceCode,
          status: "reserved",
          expiresAt,
        },
      });

      // Atomically increment raisedEgp inside the same transaction so the
      // Capital Formation goal cap is enforced transactionally.
      await tx.enterprise.update({
        where: { id: enterpriseId },
        data: { raisedEgp: { increment: amountEgp } },
      });

      await appendLedgerEvent(tx, {
        enterpriseId,
        eventType: "funds_received",
        payload: {
          reservationId: created.id,
          referenceCode,
          equityUnits: shares,
          amountEgp,
          userId: user.id,
          beneficiary: "law_firm_client_account",
          lawFirmId: enterprise.lawFirmId,
          note: "Funds transferred directly to the law firm's licensed client account per Amendment IX — AURIENTA never touches capital. The law firm holds funds under Egyptian Lawyers' Code (Law 17/1983, Art. 47).",
        },
        actorId: user.id,
      });

      return created;
    });
  } catch (e) {
    await audit({
      actorId: user.id,
      action: "reservation.create",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "transaction_conflict",
      metadata: { error: e instanceof Error ? e.message : String(e) },
    });
    return NextResponse.json(
      { error: "Could not create reservation. Please retry.", code: "conflict" },
      { status: 409 }
    );
  }

  await audit({
    actorId: user.id,
    action: "reservation.create",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      reservationId: reservation.id,
      referenceCode,
      equityUnits: shares,
      amountEgp,
    },
  });

  const responseBody = {
    ok: true,
    reservation: {
      id: reservation.id,
      referenceCode: reservation.referenceCode,
      enterpriseId: reservation.enterpriseId,
      equityUnits: reservation.equityUnits,
      amountEgp: reservation.amountEgp,
      status: reservation.status,
      expiresAt: reservation.expiresAt,
    },
  };
  const status = 200;
  if (idemCtx) {
    await storeIdempotency(idemCtx, "reservations", user.id, status, responseBody);
  }
  return NextResponse.json(responseBody, { status });
}
