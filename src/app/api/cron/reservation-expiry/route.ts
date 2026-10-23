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
import { requireCronToken } from "@/lib/aurienta/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SECURITY FIX (PLATFORM-FULL-AUDIT-AND-REMEDIATION-001 / P1-2):
// The previous DEV_FALLBACK_SECRET = "dev-cron-secret" was live-exploitable via
// `?token=dev-cron-secret`. Removed. CRON_SECRET MUST be set in the environment.
// When unset, the helper returns 503 (configuration error) instead of allowing
// the request through.

export const GET = withErrorHandler(
  async (req: NextRequest) => {
    const unauthorized = requireCronToken(req);
    if (unauthorized) return unauthorized;

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
