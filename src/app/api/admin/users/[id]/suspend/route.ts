import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

/**
 * POST /api/admin/users/[id]/suspend
 * — Suspend a user:
 *   1. Revoke ALL active sessions (revokedAt = now).
 *   2. Set verificationLevel = "L0" (anonymous = suspended).
 *
 * Body: { reason: string }
 * Audit: action="admin.user.suspend", result="allowed", reason.
 *
 * The previous verification level is preserved in the audit metadata so the
 * user can be restored by re-patching their verificationLevel via PATCH.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireRole("aurienta_rep");
    const { id } = await params;

    const body = await req.json().catch(() => ({})) as { reason?: string };
    const reason =
      typeof body.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim()
        : "No reason supplied.";

    const target = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        legalName: true,
        verificationLevel: true,
      },
    });
    if (!target) {
      return NextResponse.json(
        { error: "User not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Prevent self-suspension — an aurienta_rep cannot lock themselves out.
    if (target.id === actor.id) {
      return NextResponse.json(
        { error: "You cannot suspend your own account.", code: "SELF_SUSPEND_DENIED" },
        { status: 400 }
      );
    }

    // Count active sessions (for the audit metadata) before revoking.
    const activeSessions = await db.session.count({
      where: { userId: id, revokedAt: null },
    });

    // Atomic: revoke all sessions + drop verificationLevel to L0.
    const [revoked, updated] = await db.$transaction([
      db.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      db.user.update({
        where: { id },
        data: { verificationLevel: "L0" },
        select: {
          id: true,
          email: true,
          legalName: true,
          verificationLevel: true,
        },
      }),
    ]);

    await audit({
      actorId: actor.id,
      action: "admin.user.suspend",
      target: `user:${id}`,
      result: "allowed",
      reason,
      metadata: {
        email: target.email,
        previousVerificationLevel: target.verificationLevel,
        sessionsRevoked: revoked.count,
        activeSessionsBefore: activeSessions,
        newVerificationLevel: "L0",
        actorName: actor.legalName,
      },
    });

    return NextResponse.json({
      ok: true,
      suspended: true,
      user: updated,
      sessionsRevoked: revoked.count,
      previousVerificationLevel: target.verificationLevel,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Not authenticated")) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    if (msg.includes("Forbidden")) {
      return NextResponse.json(
        { error: "Forbidden: requires aurienta_rep", code: "FORBIDDEN" },
        { status: 403 }
      );
    }
    logger.error("[POST /api/admin/users/[id]/suspend] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to suspend user.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
