import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/whistleblower/[id]/resolve
// Body: { resolution: "resolved" | "dismissed", bountyEgp?: number }
//
// DE-09 — Whistleblower reports previously piled up with no resolve path.
// This route is the missing resolve hook. It is restricted to AURIENTA Reps
// (RBAC via EnterpriseMember.role === "aurienta_rep"), who are the only role
// authorised under the Constitution to close out an Integrity-Bond case.
//
// On success it:
//   - Flips the WhistleblowerReport status to "resolved" or "dismissed".
//   - Optionally sets the bounty amount (bountyPaidEgp) when a bounty is awarded.
//   - Appends a ledger event for the constitutional audit trail.
//   - Calls audit() with the decision.
//   - Notifies the original filer — looked up from the prior
//     `whistleblower.file` audit log entry (the report itself is intentionally
//     anonymous; the schema has no filerId column).
//   - Returns the updated report.
type Params = { params: Promise<{ id: string }> };

export const POST = withErrorHandler(
  async (req: NextRequest, ctx: Params) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }

    const { params } = ctx;
    const { id } = await params;

    // ── RBAC: only an AURIENTA Rep may resolve whistleblower reports. ──
    const isAurientaRep = user.memberships.some((m) => m.role === "aurienta_rep");
    if (!isAurientaRep) {
      await audit({
        actorId: user.id,
        action: "whistleblower.resolve",
        target: `whistleblower:${id}`,
        result: "denied",
        reason: "aurienta_rep_required",
      });
      return NextResponse.json(
        {
          error:
            "Only an AURIENTA Representative may resolve whistleblower reports.",
          code: "forbidden",
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const resolution = body?.resolution;
    if (resolution !== "resolved" && resolution !== "dismissed") {
      return NextResponse.json(
        {
          error: "resolution must be 'resolved' or 'dismissed'.",
          code: "invalid_body",
        },
        { status: 400 }
      );
    }

    let bountyEgp: number | undefined;
    if (body?.bountyEgp !== undefined && body?.bountyEgp !== null) {
      bountyEgp = Math.floor(Number(body.bountyEgp));
      if (!Number.isFinite(bountyEgp) || bountyEgp < 0) {
        return NextResponse.json(
          { error: "bountyEgp must be a non-negative integer.", code: "invalid_body" },
          { status: 400 }
        );
      }
    }

    const report = await db.whistleblowerReport.findUnique({
      where: { id },
      include: { enterprise: { select: { id: true, name: true, slug: true } } },
    });
    if (!report) {
      return NextResponse.json(
        { error: "Whistleblower report not found", code: "not_found" },
        { status: 404 }
      );
    }

    // Already resolved / dismissed → 409 (idempotent reject).
    if (report.status === "resolved" || report.status === "dismissed") {
      return NextResponse.json(
        {
          error: `Report is already ${report.status}.`,
          code: "conflict",
        },
        { status: 409 }
      );
    }

    // ── Resolve the report + append ledger event inside ONE transaction ──
    const updated = await db.$transaction(async (tx) => {
      const u = await tx.whistleblowerReport.update({
        where: { id },
        data: {
          status: resolution,
          resolvedAt: new Date(),
          ...(bountyEgp !== undefined ? { bountyPaidEgp: bountyEgp } : {}),
        },
      });

      // Append a constitutional ledger event for the resolution.
      if (report.enterpriseId) {
        await appendLedgerEvent(tx, {
          enterpriseId: report.enterpriseId,
          eventType: "whistleblower_resolved",
          payload: {
            reportId: report.id,
            trackingCode: report.trackingCode,
            resolution,
            bountyEgp: bountyEgp ?? 0,
            resolvedBy: user.id,
            previousStatus: report.status,
            note: `Whistleblower ${report.trackingCode} (${report.category}) ${resolution} by AURIENTA Rep.`,
          },
          actorId: user.id,
        });
      }

      return u;
    });

    // ── Audit the resolution. ──
    await audit({
      actorId: user.id,
      action: "whistleblower.resolve",
      target: `whistleblower:${id}`,
      result: "allowed",
      metadata: {
        reportId: report.id,
        trackingCode: report.trackingCode,
        enterpriseId: report.enterpriseId ?? null,
        resolution,
        bountyEgp: bountyEgp ?? 0,
        previousStatus: report.status,
      },
    });

    // ── Notify the original filer. ──
    // The WhistleblowerReport schema has no filerId column (intentional —
    // anonymity). The prior `whistleblower.file` audit log entry stored the
    // filer's user ID as actorId + metadata.reportId. We look it up by
    // matching action + a JSON-string_contains on the metadata field. If the
    // audit log row is missing or the metadata was altered, the notification
    // silently no-ops (never blocks the resolution itself).
    try {
      const filerAudit = await db.auditLog.findFirst({
        where: {
          action: "whistleblower.file",
          metadata: { contains: `"reportId":"${report.id}"` },
        },
        orderBy: { timestamp: "asc" },
        select: { actorId: true },
      });
      const filerId = filerAudit?.actorId ?? null;
      if (filerId) {
        const title =
          resolution === "resolved"
            ? "Whistleblower report resolved"
            : "Whistleblower report dismissed";
        const bodyText =
          resolution === "resolved"
            ? `Your report ${report.trackingCode} has been resolved by an AURIENTA Representative.` +
              (bountyEgp && bountyEgp > 0
                ? ` A bounty of ${bountyEgp.toLocaleString()} EGP has been awarded.`
                : "")
            : `Your report ${report.trackingCode} has been dismissed. No bounty will be paid.`;

        await db.notification.create({
          data: {
            userId: filerId,
            enterpriseId: report.enterpriseId ?? null,
            category: "compliance",
            title,
            body: bodyText,
            aiPriority: resolution === "resolved" ? "high" : "medium",
          },
        });
      }
    } catch (notifyErr) {
      // Notification failures must never block the resolution itself.
      logger.error("whistleblower resolve: filer notification failed", {
        reportId: report.id,
        err: notifyErr instanceof Error ? notifyErr.message : String(notifyErr),
      });
    }

    return NextResponse.json({ ok: true, report: updated });
  },
  "POST /api/whistleblower/[id]/resolve"
);
