// Reservation Confirmation API — Law firm confirms receipt of funds
// Blueprint §5: When the Capital Partner transfers funds to the law firm
// client account, the law firm (or authorized AURIENTA rep) confirms
// receipt. This:
//   1. Updates reservation.status → "confirmed"
//   2. Increments enterprise.lawFirmClientAccountBalanceEgp
//   3. Appends a "funds_confirmed" ledger event
//   4. Triggers the 0.5% Anti-Fragility Vault contribution
//
// This is the missing link between "reservation created" and "funds
// actually in the law firm account." Without this, the law firm
// balance never reflects received capital.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/reservations/[id]/confirm
// Only law_firm_rep or aurienta_rep can confirm fund receipt.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: reservationId } = await params;

  // Authorization: only law_firm_rep or aurienta_rep can confirm
  const canConfirm = user.memberships.some(
    (m) => m.role === "law_firm_rep" || m.role === "aurienta_rep"
  );
  if (!canConfirm) {
    await audit({
      actorId: user.id,
      action: "reservation.confirm",
      target: `reservation:${reservationId}`,
      result: "denied",
      reason: "not_authorized",
    });
    return NextResponse.json(
      { error: "Only Law Firm Representatives or AURIENTA Representatives can confirm fund receipt" },
      { status: 403 }
    );
  }

  // Fetch the reservation
  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    include: { enterprise: true },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  if (reservation.status !== "reserved") {
    return NextResponse.json(
      { error: `Reservation status is "${reservation.status}" — only "reserved" reservations can be confirmed` },
      { status: 400 }
    );
  }

  // Check if expired
  if (reservation.expiresAt && reservation.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Reservation has expired — Capital Partner must re-reserve" },
      { status: 400 }
    );
  }

  // Atomic transaction:
  // 1. Update reservation status → confirmed
  // 2. Increment law firm client account balance
  // 3. Append ledger event
  // 4. Contribute 0.5% to Anti-Fragility Vault
  const vaultContribution = Math.round(reservation.amountEgp * 0.005);

  const result = await db.$transaction(async (tx) => {
    // 1. Confirm reservation
    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "confirmed" },
    });

    // 2. Increment law firm client account balance
    await tx.enterprise.update({
      where: { id: reservation.enterpriseId },
      data: {
        lawFirmClientAccountBalanceEgp: { increment: reservation.amountEgp },
      },
    });

    // 3. Append ledger event
    await appendLedgerEvent(tx, {
      enterpriseId: reservation.enterpriseId,
      eventType: "funds_confirmed",
      payload: {
        reservationId: reservation.id,
        referenceCode: reservation.referenceCode,
        amountEgp: reservation.amountEgp,
        equityUnits: reservation.equityUnits,
        confirmedBy: user.id,
        lawFirmAccountBalanceBefore: reservation.enterprise.lawFirmClientAccountBalanceEgp,
        lawFirmAccountBalanceAfter: reservation.enterprise.lawFirmClientAccountBalanceEgp + reservation.amountEgp,
      },
      actorId: user.id,
    });

    // 4. Anti-Fragility Vault contribution (0.5%)
    if (vaultContribution > 0) {
      const vault = await tx.insuranceVault.upsert({
        where: { enterpriseId: reservation.enterpriseId },
        create: {
          enterpriseId: reservation.enterpriseId,
          totalContributedEgp: vaultContribution,
          currentBalanceEgp: vaultContribution,
        },
        update: {
          totalContributedEgp: { increment: vaultContribution },
          currentBalanceEgp: { increment: vaultContribution },
        },
      });

      await appendLedgerEvent(tx, {
        enterpriseId: reservation.enterpriseId,
        eventType: "vault_contribution",
        payload: {
          amountEgp: vaultContribution,
          vaultId: vault.id,
          sourceReservationId: reservation.id,
          note: "0.5% Anti-Fragility Vault contribution on Capital Formation",
        },
        actorId: user.id,
      });
    }

    return updated;
  });

  await audit({
    actorId: user.id,
    action: "reservation.confirm",
    target: `reservation:${reservationId}`,
    result: "allowed",
    metadata: {
      amountEgp: reservation.amountEgp,
      vaultContribution,
    },
  });

  logger.info("reservation.confirmed", {
    reservationId,
    amountEgp: reservation.amountEgp,
    vaultContribution,
  });

  return NextResponse.json({
    ok: true,
    reservation: {
      id: result.id,
      status: result.status,
      amountEgp: reservation.amountEgp,
      vaultContribution,
    },
  });
}
