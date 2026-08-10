import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

const ALLOWED_LEVELS = new Set(["L0", "L1", "L2", "L3", "L4"]);
const ALLOWED_TIERS = new Set([
  "Constitutional Pillar",
  "Ecosystem Builder",
  "Trusted Contributor",
  "Active Member",
  "Emerging Participant",
]);
const ALLOWED_INTENTS = new Set([
  "capital_partner",
  "founding_operator",
  "workforce_partner",
  "institution",
]);

/**
 * GET /api/admin/users/[id]
 * — Full user detail for the admin console:
 *   - identity fields
 *   - memberships (incl. enterprise name/slug/tier)
 *   - sessions (id, ip, userAgent, issuedAt, expiresAt, revokedAt)
 *   - recent audit logs (last 20)
 *   - recent ledger events (last 10)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("aurienta_rep");
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        mobile: true,
        legalName: true,
        verificationLevel: true,
        sovereignTrustScore: true,
        tier: true,
        primaryIntent: true,
        mfaEnabled: true,
        policeClearanceValid: true,
        policeClearanceExpiresAt: true,
        pledgeSignedAt: true,
        pledgeSignature: true,
        nationality: true,
        riskProfile: true,
        familyConsent: true,
        avatarColor: true,
        identityAnchor: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            id: true,
            role: true,
            boardSeat: true,
            joinedAt: true,
            enterprise: {
              select: { id: true, name: true, slug: true, tier: true, stage: true, status: true },
            },
          },
          orderBy: { joinedAt: "desc" },
        },
        sessions: {
          select: {
            id: true,
            ip: true,
            userAgent: true,
            issuedAt: true,
            lastSeenAt: true,
            expiresAt: true,
            revokedAt: true,
            mfaVerifiedAt: true,
          },
          orderBy: { issuedAt: "desc" },
          take: 50,
        },
        ownershipRecords: {
          select: {
            id: true,
            equityUnits: true,
            avgPriceEgp: true,
            restrictedUntil: true,
            enterprise: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        auditLogs: {
          select: {
            id: true,
            action: true,
            target: true,
            result: true,
            reason: true,
            metadata: true,
            ip: true,
            timestamp: true,
          },
          orderBy: { timestamp: "desc" },
          take: 20,
        },
        ledEvents: {
          select: {
            id: true,
            eventType: true,
            sequence: true,
            payloadHash: true,
            timestamp: true,
            enterprise: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { timestamp: "desc" },
          take: 10,
        },
        _count: {
          select: {
            memberships: true,
            sessions: true,
            ownershipRecords: true,
            proposals: true,
            votes: true,
            auditLogs: true,
            ledEvents: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Audit-log the admin read access.
    await audit({
      action: "admin.user.read",
      target: `user:${user.id}`,
      result: "allowed",
      metadata: { email: user.email, verificationLevel: user.verificationLevel },
    });

    return NextResponse.json({ user });
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
    logger.error("[GET /api/admin/users/[id]] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to load user.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * — Update identity-compliance fields:
 *   verificationLevel (L1–L4), tier, primaryIntent,
 *   policeClearanceValid, policeClearanceExpiresAt.
 *
 * Every change is audit-logged with before/after values.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireRole("aurienta_rep");
    const { id } = await params;

    const body = await req.json().catch(() => ({})) as {
      verificationLevel?: string;
      tier?: string;
      primaryIntent?: string;
      policeClearanceValid?: boolean;
      policeClearanceExpiresAt?: string | null;
      reason?: string;
    };

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        legalName: true,
        verificationLevel: true,
        tier: true,
        primaryIntent: true,
        policeClearanceValid: true,
        policeClearanceExpiresAt: true,
      },
    });
    if (!user) {
      return NextResponse.json(
        { error: "User not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Build the patch + a structured diff for audit.
    const data: {
      verificationLevel?: string;
      tier?: string;
      primaryIntent?: string | null;
      policeClearanceValid?: boolean;
      policeClearanceExpiresAt?: Date | null;
    } = {};
    const changes: { field: string; from: unknown; to: unknown }[] = [];

    if (
      body.verificationLevel !== undefined &&
      typeof body.verificationLevel === "string"
    ) {
      const lvl = body.verificationLevel.toUpperCase();
      // Per task spec: PATCH only allows L1–L4 (L0 is reserved for suspension).
      if (!ALLOWED_LEVELS.has(lvl) || lvl === "L0") {
        return NextResponse.json(
          {
            error: "verificationLevel must be one of L1, L2, L3, L4 (use the suspend endpoint to set L0).",
            code: "INVALID_VERIFICATION_LEVEL",
          },
          { status: 400 }
        );
      }
      if (lvl !== user.verificationLevel) {
        changes.push({ field: "verificationLevel", from: user.verificationLevel, to: lvl });
        data.verificationLevel = lvl;
      }
    }

    if (body.tier !== undefined && typeof body.tier === "string") {
      if (!ALLOWED_TIERS.has(body.tier)) {
        return NextResponse.json(
          { error: "Invalid tier value.", code: "INVALID_TIER" },
          { status: 400 }
        );
      }
      if (body.tier !== user.tier) {
        changes.push({ field: "tier", from: user.tier, to: body.tier });
        data.tier = body.tier;
      }
    }

    if (body.primaryIntent !== undefined) {
      if (body.primaryIntent === null) {
        if (user.primaryIntent !== null) {
          changes.push({ field: "primaryIntent", from: user.primaryIntent, to: null });
          data.primaryIntent = null;
        }
      } else if (typeof body.primaryIntent === "string") {
        if (!ALLOWED_INTENTS.has(body.primaryIntent)) {
          return NextResponse.json(
            { error: "Invalid primaryIntent value.", code: "INVALID_INTENT" },
            { status: 400 }
          );
        }
        if (body.primaryIntent !== user.primaryIntent) {
          changes.push({ field: "primaryIntent", from: user.primaryIntent, to: body.primaryIntent });
          data.primaryIntent = body.primaryIntent;
        }
      }
    }

    if (body.policeClearanceValid !== undefined) {
      const v = Boolean(body.policeClearanceValid);
      if (v !== user.policeClearanceValid) {
        changes.push({ field: "policeClearanceValid", from: user.policeClearanceValid, to: v });
        data.policeClearanceValid = v;
      }
    }

    if (body.policeClearanceExpiresAt !== undefined) {
      const raw = body.policeClearanceExpiresAt;
      const parsed: Date | null = raw === null || raw === "" ? null : new Date(raw);
      if (parsed !== null && Number.isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "policeClearanceExpiresAt must be an ISO date string or null.", code: "INVALID_DATE" },
          { status: 400 }
        );
      }
      const prev = user.policeClearanceExpiresAt;
      const same =
        (prev === null && parsed === null) ||
        (prev !== null && parsed !== null && prev.getTime() === parsed.getTime());
      if (!same) {
        changes.push({ field: "policeClearanceExpiresAt", from: prev, to: parsed });
        data.policeClearanceExpiresAt = parsed;
      }
    }

    if (changes.length === 0) {
      return NextResponse.json({
        ok: true,
        user,
        message: "No changes — patch was a no-op.",
      });
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        legalName: true,
        verificationLevel: true,
        tier: true,
        primaryIntent: true,
        policeClearanceValid: true,
        policeClearanceExpiresAt: true,
        updatedAt: true,
      },
    });

    await audit({
      actorId: actor.id,
      action: "admin.user.update",
      target: `user:${id}`,
      result: "allowed",
      reason: body.reason ?? "Admin compliance update",
      metadata: { changes, before: user, after: updated },
    });

    return NextResponse.json({ ok: true, user: updated, changes });
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
    logger.error("[PATCH /api/admin/users/[id]] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to update user.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
