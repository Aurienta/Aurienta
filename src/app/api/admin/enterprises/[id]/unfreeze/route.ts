import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { logger } from "@/lib/aurienta/logger";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/enterprises/[id]/unfreeze
// Body: { reason?: string }
// Lifts the emergency freeze — sets status="active" + clears frozenAt.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole("aurienta_rep");
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    const enterprise = await db.enterprise.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, status: true, frozenAt: true },
    });
    if (!enterprise) {
      return NextResponse.json({ error: "Enterprise not found", code: "NOT_FOUND" }, { status: 404 });
    }

    if (enterprise.status !== "frozen") {
      await audit({
        actorId: user.id,
        action: "admin.enterprise.unfreeze",
        target: `enterprise:${id}`,
        result: "allowed",
        reason: "not_frozen",
        metadata: { status: enterprise.status },
      });
      return NextResponse.json({
        ok: true,
        notFrozen: true,
        status: enterprise.status,
      });
    }

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.enterprise.update({
        where: { id },
        data: { status: "active", frozenAt: null },
        select: { id: true, status: true, frozenAt: true },
      });

      await appendLedgerEvent(tx, {
        enterpriseId: id,
        eventType: "cre_decision",
        payload: {
          action: "emergency_unfreeze",
          actorId: user.id,
          reason: reason || "lifted by AURIENTA Rep",
          priorStatus: "frozen",
          priorFrozenAt: enterprise.frozenAt,
          newStatus: "active",
        },
        actorId: user.id,
      });

      return updated;
    });

    await audit({
      actorId: user.id,
      action: "admin.enterprise.unfreeze",
      target: `enterprise:${id}`,
      result: "allowed",
      reason: reason || "lifted by AURIENTA Rep",
      metadata: {
        priorStatus: "frozen",
        priorFrozenAt: enterprise.frozenAt,
        newStatus: "active",
      },
    });

    return NextResponse.json({
      ok: true,
      enterprise: result,
      reason: reason || "lifted by AURIENTA Rep",
      actor: { id: user.id, legalName: user.legalName },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[POST /api/admin/enterprises/[id]/unfreeze] error:", { err: msg });
    if (msg === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated", code: "UNAUTHORIZED" }, { status: 401 });
    }
    if (msg.startsWith("Forbidden:")) {
      return NextResponse.json({ error: msg, code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to unfreeze enterprise.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
