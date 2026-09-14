// Cron: Reservation Expiry (DE-17)
//
// GET /api/cron/reservation-expiry?token=<CRON_SECRET>
//
// Scheduled by Vercel Cron (or any external scheduler) to sweep reservations
// that have passed their 48h confirmation window without the law firm / rep
// confirming fund receipt. Each swept reservation is:
//   - transitioned to status = "expired"
//   - paired with enterprise.raisedEgp decrement (the capital is released back
//     into the Capital Formation pool so other partners can reserve)
//   - recorded via audit()
//
// No notification is emitted here — the blueprint treats expired reservations
// as silently released (the partner sees the status change in their portfolio).
//
// This route uses a secret token query parameter (NOT a session cookie) and is
// therefore added to the CSRF middleware exclusion list. The dev fallback keeps
// local development ergonomic when CRON_SECRET is not set.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dev fallback so the endpoint still works locally when CRON_SECRET is unset.
// In production Vercel Cron sets CRON_SECRET — a non-matching token yields 401.
const DEV_FALLBACK_SECRET = "dev-cron-secret";

export const GET = withErrorHandler(
  async (req: NextRequest) => {
    // ── Token auth (NOT session auth) ──
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? "";
    const expected =
      process.env.CRON_SECRET && process.env.CRON_SECRET.length > 0
        ? process.env.CRON_SECRET
        : DEV_FALLBACK_SECRET;

    if (!token || token !== expected) {
      await audit({
        action: "cron.reservation_expiry",
        result: "denied",
        reason: "invalid_token",
      });
      return NextResponse.json(
        { error: "Unauthorized — invalid or missing cron token" },
        { status: 401 }
      );
    }

    const now = new Date();

    // Find every still-reserved (unconfirmed) reservation whose window closed.
    // status "expired" / "confirmed" / "settled" are terminal-ish — excluded.
    const expired = await db.reservation.findMany({
      where: {
        status: "reserved",
        expiresAt: { lt: now },
      },
      include: {
        enterprise: { select: { id: true, name: true } },
      },
      take: 500, // safety cap per sweep
    });

    if (expired.length === 0) {
      return NextResponse.json({ expired: 0 });
    }

    let processed = 0;
    for (const reservation of expired) {
      try {
        await db.$transaction(async (tx) => {
          // Transition to expired — race-safe: only if still "reserved".
          const updated = await tx.reservation.updateMany({
            where: { id: reservation.id, status: "reserved" },
            data: { status: "expired" },
          });
          if (updated.count === 0) return; // someone else changed it mid-sweep

          // Free up the capital: decrement raisedEgp so other partners can
          // reserve against the released headroom. The reservation create
          // route incremented raisedEgp transactionally — this is the
          // matching decrement on the no-pay path.
          await tx.enterprise.update({
            where: { id: reservation.enterpriseId },
            data: { raisedEgp: { decrement: reservation.amountEgp } },
          });
        });

        await audit({
          action: "reservation.expire",
          target: `reservation:${reservation.id}`,
          result: "allowed",
          metadata: {
            reservationId: reservation.id,
            enterpriseId: reservation.enterpriseId,
            enterpriseName: reservation.enterprise.name,
            referenceCode: reservation.referenceCode,
            amountEgp: reservation.amountEgp,
            equityUnits: reservation.equityUnits,
            userId: reservation.userId,
            expiresAt: reservation.expiresAt.toISOString(),
          },
        });

        processed += 1;
      } catch (err) {
        // A single reservation failure must NOT abort the rest of the sweep.
        logger.error("cron.reservation_expiry: failed to expire reservation", {
          reservationId: reservation.id,
          err: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({ expired: processed });
  },
  "GET /api/cron/reservation-expiry"
);
