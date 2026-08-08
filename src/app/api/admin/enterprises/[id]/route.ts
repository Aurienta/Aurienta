import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import { computeGraduationReadiness } from "@/lib/aurienta/cre";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/enterprises/[id]
// Full enterprise detail — founder, law firm, accounting firm, members,
// recent ledger events (20), recent proposals (5), milestones (5).
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole("aurienta_rep");
    const { id } = await params;

    const enterprise = await db.enterprise.findUnique({
      where: { id },
      include: {
        founder: {
          select: {
            id: true,
            legalName: true,
            email: true,
            mobile: true,
            verificationLevel: true,
            sovereignTrustScore: true,
          },
        },
        lawFirm: { select: { id: true, name: true, frLicenseNumber: true, insuranceEgp: true, expertiseScore: true, status: true } },
        accountingFirm: { select: { id: true, name: true, esaaLicense: true, status: true } },
        members: {
          orderBy: { joinedAt: "asc" },
          include: {
            user: { select: { id: true, legalName: true, email: true, sovereignTrustScore: true, verificationLevel: true } },
          },
        },
        ledgerEvents: {
          orderBy: { timestamp: "desc" },
          take: 20,
          select: {
            id: true,
            eventType: true,
            payloadHash: true,
            actorId: true,
            sequence: true,
            timestamp: true,
          },
        },
        proposals: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            votesFor: true,
            votesAgainst: true,
            passThreshold: true,
            votingEndsAt: true,
            createdAt: true,
          },
        },
        milestones: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            status: true,
            amountEgp: true,
            eveConfidence: true,
            dueAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!enterprise) {
      return NextResponse.json({ error: "Enterprise not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, enterprise });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[GET /api/admin/enterprises/[id]] error:", { err: msg });
    if (msg === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated", code: "UNAUTHORIZED" }, { status: 401 });
    }
    if (msg.startsWith("Forbidden:")) {
      return NextResponse.json({ error: msg, code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to load enterprise.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/enterprises/[id]
// Body: any subset of { status, tier, stage, healthScore, healthRating, lawFirmId, accountingFirmId }
// Audit-logs every change.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole("aurienta_rep");
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const allowed = [
      "status",
      "tier",
      "stage",
      "healthScore",
      "healthRating",
      "lawFirmId",
      "accountingFirmId",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined && body[key] !== null && body[key] !== "") {
        updates[key] = body[key];
      }
    }

    const isRecomputeOnly = body?.__recompute === true && Object.keys(updates).length === 0;

    if (Object.keys(updates).length === 0 && !isRecomputeOnly) {
      return NextResponse.json(
        { error: "No updatable fields supplied.", code: "NO_FIELDS" },
        { status: 400 }
      );
    }

    // If the caller just wants to recompute graduation readiness, short-circuit
    // after the existence check (no DB write, no audit entry needed).
    if (isRecomputeOnly) {
      const exists = await db.enterprise.findUnique({ where: { id }, select: { id: true } });
      if (!exists) {
        return NextResponse.json({ error: "Enterprise not found", code: "NOT_FOUND" }, { status: 404 });
      }
      const readiness = await computeGraduationReadiness(id);
      return NextResponse.json({ ok: true, readiness });
    }

    // Validate types.
    if (updates.healthScore !== undefined) {
      const hs = Number(updates.healthScore);
      if (!Number.isFinite(hs) || hs < 0 || hs > 100) {
        return NextResponse.json(
          { error: "healthScore must be 0–100.", code: "INVALID_HEALTH_SCORE" },
          { status: 400 }
        );
      }
      updates.healthScore = Math.round(hs);
    }
    if (updates.tier !== undefined && !["A", "B", "C", "D", "E", "F"].includes(String(updates.tier))) {
      return NextResponse.json({ error: "Invalid tier.", code: "INVALID_TIER" }, { status: 400 });
    }
    if (
      updates.status !== undefined &&
      !["draft", "fundraising_active", "fundraising_closed", "active", "frozen", "graduation_pending", "graduated"].includes(
        String(updates.status)
      )
    ) {
      return NextResponse.json({ error: "Invalid status.", code: "INVALID_STATUS" }, { status: 400 });
    }
    if (
      updates.stage !== undefined &&
      !["stage_1", "stage_2", "stage_3", "stage_4", "graduated"].includes(String(updates.stage))
    ) {
      return NextResponse.json({ error: "Invalid stage.", code: "INVALID_STAGE" }, { status: 400 });
    }

    // Stage transitions update stageSince automatically.
    const existing = await db.enterprise.findUnique({
      where: { id },
      select: { stage: true, status: true, healthScore: true, healthRating: true, lawFirmId: true, accountingFirmId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Enterprise not found", code: "NOT_FOUND" }, { status: 404 });
    }

    // If stage is changing, also reset stageSince.
    if (updates.stage !== undefined && updates.stage !== existing.stage) {
      updates.stageSince = new Date();
    }

    const updated = await db.enterprise.update({
      where: { id },
      data: updates as Record<string, never>,
    });

    // Audit-log every change as a single entry with the diff.
    const diff: Record<string, { from: unknown; to: unknown }> = {};
    for (const key of Object.keys(updates)) {
      if (key === "stageSince") continue;
      const k = key as keyof typeof existing;
      diff[k] = { from: existing[k], to: updates[key] };
    }

    await audit({
      actorId: user.id,
      action: "admin.enterprise.update",
      target: `enterprise:${id}`,
      result: "allowed",
      metadata: { diff },
    });

    // Recompute graduation readiness so the patch reflects latest health.
    const readiness = await computeGraduationReadiness(id);

    return NextResponse.json({
      ok: true,
      enterprise: {
        id: updated.id,
        status: updated.status,
        tier: updated.tier,
        stage: updated.stage,
        healthScore: updated.healthScore,
        healthRating: updated.healthRating,
        lawFirmId: updated.lawFirmId,
        accountingFirmId: updated.accountingFirmId,
        stageSince: updated.stageSince,
      },
      readiness,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[PATCH /api/admin/enterprises/[id]] error:", { err: msg });
    if (msg === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated", code: "UNAUTHORIZED" }, { status: 401 });
    }
    if (msg.startsWith("Forbidden:")) {
      return NextResponse.json({ error: msg, code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to update enterprise.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
