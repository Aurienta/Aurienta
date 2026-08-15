// AURIENTA — Public API Key System (management endpoints)
// ═══════════════════════════════════════════════════════════════
// POST   /api/api-keys                  — Generate a new API key
// GET    /api/api-keys?enterpriseId=xxx — List API keys for an enterprise
//
// API keys are stored as PlatformSetting rows:
//   key   = `api_key_${enterpriseId}_${uuid}`
//   value = JSON.stringify({
//     key,             // the actual API key (randomUUID) — only shown once at creation
//     name,            // human label e.g. "QuickBooks Integration"
//     enterpriseId,
//     createdAt,
//     createdBy,
//     active,
//   })
//
// The actual key value is NEVER returned by the GET endpoint — only metadata
// (id, name, createdAt, active, prefix of the key for recognition).
//
// DELETE /api/api-keys/[id]  (see ./[id]/route.ts) — sets active=false
//
// Auth required on every route. Audit-logged.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
});

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
 * POST /api/api-keys — generate a new API key.
 *
 * Authorization: caller must hold founding_operator, company_owner, or
 * board_member on the target enterprise (or be aurienta_rep).
 *
 * Body: { enterpriseId, name }
 *
 * Returns the actual key value ONCE. Subsequent GET requests never
 * include the key value — only the PlatformSetting.id + metadata.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          code: "INVALID_BODY",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }
    const { enterpriseId, name } = parsed.data;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: { id: true, name: true, slug: true, status: true },
    });
    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise not found", code: "ENTERPRISE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Authorization.
    const membershipsForEnt = user.memberships.filter(
      (m) => m.enterpriseId === enterpriseId
    );
    const authorised =
      membershipsForEnt.some((m) => ALLOWED_ROLES.has(m.role)) ||
      user.memberships.some((m) => m.role === "aurienta_rep");
    if (!authorised) {
      await audit({
        actorId: user.id,
        action: "api_key.create",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason:
          "Requires founding_operator, company_owner, or board_member role",
        metadata: { userRoles: membershipsForEnt.map((m) => m.role) },
        ip,
        userAgent,
      });
      return NextResponse.json(
        {
          error:
            "Forbidden: only founding_operator, company_owner, or board_member may create API keys",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // Refuse to issue keys for frozen enterprises.
    if (enterprise.status === "frozen") {
      await audit({
        actorId: user.id,
        action: "api_key.create",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: "Enterprise is frozen",
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "Enterprise is frozen; API keys cannot be issued", code: "ENTERPRISE_FROZEN" },
        { status: 400 }
      );
    }

    // ── Generate the key + persist as a PlatformSetting ──
    // The actual key is a randomUUID. We never store it in plaintext
    // outside the PlatformSetting JSON value (which is already a JSON
    // blob in the DB). In production this would be hashed at rest; here
    // we keep it readable so the GET endpoint can compare a provided key
    // against the stored value during validation.
    const rawKey = randomUUID();
    const settingKey = `api_key_${enterpriseId}_${randomUUID()}`;
    const createdAt = new Date().toISOString();

    const record: ApiKeyRecord = {
      key: rawKey,
      name,
      enterpriseId,
      createdAt,
      createdBy: user.id,
      createdByName: user.legalName,
      active: true,
      revokedAt: null,
    };

    const setting = await db.platformSetting.create({
      data: {
        key: settingKey,
        value: JSON.stringify(record),
        category: "api_key",
        updatedById: user.id,
      },
    });

    await audit({
      actorId: user.id,
      action: "api_key.create",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      metadata: {
        settingId: setting.id,
        settingKey,
        name,
        // Never log the actual key value — only a prefix for recognition.
        keyPrefix: rawKey.slice(0, 8),
      },
      ip,
      userAgent,
    });

    logger.info("api_key.created", {
      enterpriseId,
      settingId: setting.id,
      userId: user.id,
    });

    return NextResponse.json(
      {
        ok: true,
        // The actual key is returned ONCE. The frontend should display it
        // and warn the user to save it — they will not see it again.
        key: rawKey,
        keyId: setting.id,
        name,
        enterpriseId,
        createdAt,
        active: true,
        // Hint for the listing endpoint — the first 8 chars of the key
        // so the user can recognise which key is which later.
        keyPrefix: rawKey.slice(0, 8),
        warning:
          "This key will only be shown once. Store it securely — you will not be able to retrieve it again.",
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[POST /api/api-keys] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to create API key", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/api-keys?enterpriseId=xxx — list API keys for an enterprise.
 *
 * Authorization: founding_operator or company_owner only.
 *
 * Returns metadata only — the actual key value is NEVER included in the
 * response (only the first 8 chars as a recognition prefix).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const enterpriseId = url.searchParams.get("enterpriseId");
    if (!enterpriseId) {
      return NextResponse.json(
        { error: "Provide ?enterpriseId=xxx", code: "MISSING_QUERY_PARAM" },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: { id: true, name: true, slug: true },
    });
    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise not found", code: "ENTERPRISE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Authorization — stricter than POST: only founding_operator / company_owner
    // (or aurienta_rep) may LIST keys. Board members may create but not list,
    // because listing reveals key prefixes + metadata.
    const membershipsForEnt = user.memberships.filter(
      (m) => m.enterpriseId === enterpriseId
    );
    const authorised =
      membershipsForEnt.some(
        (m) => m.role === "founding_operator" || m.role === "company_owner"
      ) || user.memberships.some((m) => m.role === "aurienta_rep");
    if (!authorised) {
      await audit({
        actorId: user.id,
        action: "api_key.list",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: "Requires founding_operator or company_owner role",
        metadata: { userRoles: membershipsForEnt.map((m) => m.role) },
        ip,
        userAgent,
      });
      return NextResponse.json(
        {
          error:
            "Forbidden: only founding_operator or company_owner may list API keys",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // All keys for this enterprise are stored with the prefix
    // `api_key_${enterpriseId}_`.
    const prefix = `api_key_${enterpriseId}_`;
    const rows = await db.platformSetting.findMany({
      where: {
        key: { startsWith: prefix },
        category: "api_key",
      },
      orderBy: { updatedAt: "desc" },
    });

    const keys = rows.map((r) => {
      let rec: ApiKeyRecord;
      try {
        rec = JSON.parse(r.value) as ApiKeyRecord;
      } catch {
        rec = {
          key: "",
          name: "(corrupt)",
          enterpriseId,
          createdAt: r.updatedAt.toISOString(),
          active: false,
        };
      }
      return {
        id: r.id,
        name: rec.name,
        enterpriseId: rec.enterpriseId,
        // Never include the full key value — only the first 8 chars for
        // visual recognition in the management UI.
        keyPrefix: rec.key ? rec.key.slice(0, 8) + "…" : "(unknown)",
        active: rec.active,
        createdAt: rec.createdAt,
        createdBy: rec.createdBy ?? null,
        createdByName: rec.createdByName ?? null,
        revokedAt: rec.revokedAt ?? null,
      };
    });

    await audit({
      actorId: user.id,
      action: "api_key.list",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      metadata: { returned: keys.length },
      ip,
      userAgent,
    });

    return NextResponse.json({
      ok: true,
      enterprise: {
        id: enterprise.id,
        name: enterprise.name,
        slug: enterprise.slug,
      },
      count: keys.length,
      keys,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[GET /api/api-keys] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to list API keys", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
