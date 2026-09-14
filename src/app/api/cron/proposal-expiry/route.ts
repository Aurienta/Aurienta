// Cron: Proposal Expiry (DE-16)
//
// GET /api/cron/proposal-expiry?token=<CRON_SECRET>
//
// Scheduled by Vercel Cron (or any external scheduler) to sweep proposals whose
// voting window has elapsed without reaching quorum or execution. Each swept
// proposal is:
//   - transitioned to status = "expired"
//   - recorded via audit()
//   - paired with a Notification to the proposal creator so the governance
//     inbox reflects the closure
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
      // Best-effort audit so failed cron attempts are visible in the audit log.
      // actorId is intentionally null — we don't know who (or what) called.
      await audit({
        action: "cron.proposal_expiry",
        result: "denied",
        reason: "invalid_token",
      });
      return NextResponse.json(
        { error: "Unauthorized — invalid or missing cron token" },
        { status: 401 }
      );
    }

    const now = new Date();

    // Find every open-voting proposal whose voting window has closed.
    // status "expired" is terminal — these are excluded from the sweep.
    const expired = await db.proposal.findMany({
      where: {
        status: "voting_open",
        votingEndsAt: { lt: now },
      },
      include: {
        enterprise: { select: { id: true, name: true } },
      },
      take: 500, // safety cap per sweep — protects against an unbounded single run
    });

    if (expired.length === 0) {
      return NextResponse.json({ expired: 0 });
    }

    let processed = 0;
    for (const proposal of expired) {
      try {
        await db.$transaction(async (tx) => {
          // Transition to expired — only if still in voting_open (race-safe).
          const updated = await tx.proposal.updateMany({
            where: { id: proposal.id, status: "voting_open" },
            data: { status: "expired" },
          });
          if (updated.count === 0) return; // someone else changed it mid-sweep

          // Notify the proposal creator (best-effort, inside the same tx).
          await tx.notification.create({
            data: {
              userId: proposal.createdById,
              enterpriseId: proposal.enterpriseId,
              category: "governance",
              title: "Proposal voting window expired",
              body:
                `Proposal "${proposal.title}" for ${proposal.enterprise.name} ` +
                `has expired without execution. Voting closed on ` +
                `${proposal.votingEndsAt.toISOString().slice(0, 16).replace("T", " ")}.`,
              href: "/dashboard/governance",
              aiPriority: "medium",
            },
          });
        });

        await audit({
          action: "proposal.expire",
          target: `proposal:${proposal.id}`,
          result: "allowed",
          metadata: {
            proposalId: proposal.id,
            enterpriseId: proposal.enterpriseId,
            enterpriseName: proposal.enterprise.name,
            title: proposal.title,
            votingEndsAt: proposal.votingEndsAt.toISOString(),
            type: proposal.type,
          },
        });

        processed += 1;
      } catch (err) {
        // A single proposal failure must NOT abort the rest of the sweep.
        logger.error("cron.proposal_expiry: failed to expire proposal", {
          proposalId: proposal.id,
          err: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({ expired: processed });
  },
  "GET /api/cron/proposal-expiry"
);
