import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

const ALLOWED_ROLES = new Set([
  "capital_partner",
  "founding_operator",
  "workforce_partner",
  "manager",
  "board_member",
  "company_owner",
  "law_firm_rep",
  "accounting_firm_rep",
  "aurienta_rep",
  "university_rep",
]);

/**
 * POST /api/admin/users/[id]/role
 * — Assign or revoke an EnterpriseMember role for a user.
 *
 * Body:
 *   { enterpriseId: string, role: string, action: "assign" | "revoke", boardSeat?: boolean, reason?: string }
 *
 * Assign: create EnterpriseMember (idempotent — if it already exists, return the existing row).
 * Revoke: delete EnterpriseMember (idempotent — if it doesn't exist, return ok).
 *
 * Every change is audit-logged.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireRole("aurienta_rep");
    const { id } = await params;

    const body = await req.json().catch(() => ({})) as {
      enterpriseId?: string;
      role?: string;
      action?: string;
      boardSeat?: boolean;
      reason?: string;
    };

    const enterpriseId = body.enterpriseId?.trim();
    const role = body.role?.trim();
    const action = body.action?.trim();
    const boardSeat = Boolean(body.boardSeat);
    const reason =
      typeof body.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim()
        : action === "revoke"
          ? "Role revoked by AURIENTA Rep"
          : "Role assigned by AURIENTA Rep";

    // ── Validate ──
    if (!enterpriseId) {
      return NextResponse.json(
        { error: "enterpriseId is required.", code: "MISSING_ENTERPRISE" },
        { status: 400 }
      );
    }
    if (!role || !ALLOWED_ROLES.has(role)) {
      return NextResponse.json(
        { error: `Invalid role. Allowed: ${Array.from(ALLOWED_ROLES).join(", ")}`, code: "INVALID_ROLE" },
        { status: 400 }
      );
    }
    if (action !== "assign" && action !== "revoke") {
      return NextResponse.json(
        { error: "action must be 'assign' or 'revoke'.", code: "INVALID_ACTION" },
        { status: 400 }
      );
    }

    // ── Verify target user + enterprise exist ──
    const [target, enterprise] = await Promise.all([
      db.user.findUnique({
        where: { id },
        select: { id: true, email: true, legalName: true, verificationLevel: true },
      }),
      db.enterprise.findUnique({
        where: { id: enterpriseId },
        select: { id: true, name: true, slug: true, tier: true },
      }),
    ]);
    if (!target) {
      return NextResponse.json(
        { error: "User not found.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }
    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise not found.", code: "ENTERPRISE_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (action === "assign") {
      // Idempotent assign — find first, then create if missing.
      const existing = await db.enterpriseMember.findUnique({
        where: {
          enterpriseId_userId_role: {
            enterpriseId,
            userId: id,
            role,
          },
        },
      });
      if (existing) {
        await audit({
          actorId: actor.id,
          action: "admin.user.role.assign",
          target: `user:${id}`,
          result: "allowed",
          reason: `${reason} (already assigned — no-op)`,
          metadata: {
            enterpriseId,
            enterpriseName: enterprise.name,
            role,
            boardSeat: existing.boardSeat,
            existingMemberId: existing.id,
            actorName: actor.legalName,
          },
        });
        return NextResponse.json({
          ok: true,
          action: "assign",
          alreadyAssigned: true,
          membership: existing,
        });
      }

      const member = await db.enterpriseMember.create({
        data: { enterpriseId, userId: id, role, boardSeat },
      });

      await audit({
        actorId: actor.id,
        action: "admin.user.role.assign",
        target: `user:${id}`,
        result: "allowed",
        reason,
        metadata: {
          enterpriseId,
          enterpriseName: enterprise.name,
          role,
          boardSeat,
          memberId: member.id,
          actorName: actor.legalName,
        },
      });

      return NextResponse.json({
        ok: true,
        action: "assign",
        membership: member,
      });
    }

    // action === "revoke" — idempotent delete.
    const existing = await db.enterpriseMember.findUnique({
      where: {
        enterpriseId_userId_role: { enterpriseId, userId: id, role },
      },
    });
    if (!existing) {
      await audit({
        actorId: actor.id,
        action: "admin.user.role.revoke",
        target: `user:${id}`,
        result: "allowed",
        reason: `${reason} (not assigned — no-op)`,
        metadata: {
          enterpriseId,
          enterpriseName: enterprise.name,
          role,
          actorName: actor.legalName,
        },
      });
      return NextResponse.json({
        ok: true,
        action: "revoke",
        alreadyRevoked: true,
      });
    }

    await db.enterpriseMember.delete({ where: { id: existing.id } });

    await audit({
      actorId: actor.id,
      action: "admin.user.role.revoke",
      target: `user:${id}`,
      result: "allowed",
      reason,
      metadata: {
        enterpriseId,
        enterpriseName: enterprise.name,
        role,
        removedMemberId: existing.id,
        boardSeat: existing.boardSeat,
        actorName: actor.legalName,
      },
    });

    return NextResponse.json({
      ok: true,
      action: "revoke",
      revokedMembershipId: existing.id,
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
    logger.error("[POST /api/admin/users/[id]/role] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to update role.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
