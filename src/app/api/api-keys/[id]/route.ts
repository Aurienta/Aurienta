// AURIENTA — Public API Key Revoke API
// ═══════════════════════════════════════════════════════════════
// DELETE /api/api-keys/[id]
//
// `id` is the PlatformSetting.id (cuid) returned by GET /api/api-keys.
//
// Sets the key's `active` flag to false (soft revoke). The PlatformSetting
// row is preserved for audit trail — never hard-deleted.
//
// Authorization: founding_operator, company_owner, or board_member of the
// enterprise that owns the key (or aurienta_rep).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set([
  "founding_operator",
  "company_owner",
  "board_member",
  "aurienta_rep",
]);

type ApiKeyRecord = {
  key: string;
  name: string;
  enterpriseId: string;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
  active: boolean;
  revokedAt?: string | null;
};

/**
 * DELETE /api/api-keys/[id]
 *
 * Soft-revokes the key. The row is preserved (for audit) but `active=false`
 * — the public v1 endpoint refuses to authenticate revoked keys.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { id: settingId } = await params;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const setting = await db.platformSetting.findUnique({
      where: { id: settingId },
    });
    if (!setting || setting.category !== "api_key") {
      return NextResponse.json(
        { error: "API key not found", code: "API_KEY_NOT_FOUND" },
        { status: 404 }
      );
    }

    let rec: ApiKeyRecord;
    try {
      rec = JSON.parse(setting.value) as ApiKeyRecord;
    } catch {
      return NextResponse.json(
        { error: "API key record is corrupt", code: "API_KEY_CORRUPT" },
        { status: 500 }
      );
    }

    // Authorization: caller must hold an allowed role on the enterprise
    // that owns this key.
    const membershipsForEnt = user.memberships.filter(
      (m) => m.enterpriseId === rec.enterpriseId
    );
    const authorised =
      membershipsForEnt.some((m) => ALLOWED_ROLES.has(m.role)) ||
      user.memberships.some((m) => m.role === "aurienta_rep");
    if (!authorised) {
      await audit({
        actorId: user.id,
        action: "api_key.revoke",
        target: `platform:setting:${settingId}`,
        result: "denied",
        reason:
          "Requires founding_operator, company_owner, or board_member role",
        metadata: {
          userRoles: membershipsForEnt.map((m) => m.role),
          enterpriseId: rec.enterpriseId,
        },
        ip,
        userAgent,
      });
      return NextResponse.json(
        {
          error:
            "Forbidden: only founding_operator, company_owner, or board_member may revoke API keys",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    if (!rec.active) {
      // Idempotent: revoking an already-revoked key is a no-op (still 200).
      return NextResponse.json({
        ok: true,
        alreadyRevoked: true,
        keyId: settingId,
        active: false,
        revokedAt: rec.revokedAt ?? null,
      });
    }

    const revokedAt = new Date().toISOString();
    const nextRec: ApiKeyRecord = {
      ...rec,
      active: false,
      revokedAt,
    };

    await db.platformSetting.update({
      where: { id: settingId },
      data: {
        value: JSON.stringify(nextRec),
        updatedById: user.id,
      },
    });

    await audit({
      actorId: user.id,
      action: "api_key.revoke",
      target: `platform:setting:${settingId}`,
      result: "allowed",
      metadata: {
        enterpriseId: rec.enterpriseId,
        name: rec.name,
        keyPrefix: rec.key ? rec.key.slice(0, 8) : "(unknown)",
        revokedAt,
      },
      ip,
      userAgent,
    });

    logger.info("api_key.revoked", {
      settingId,
      enterpriseId: rec.enterpriseId,
      userId: user.id,
    });

    return NextResponse.json({
      ok: true,
      keyId: settingId,
      active: false,
      revokedAt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[DELETE /api/api-keys/[id]] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to revoke API key", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
