import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { appendLedgerEvent, enforceEmergencyFreeze } from "@/lib/aurienta/cre";
import { logger } from "@/lib/aurienta/logger";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/enterprises/[id]/freeze
// Body: { reason: string }
// Emergency-freeze an enterprise — blocks ALL money-moving actions
// (enforceNotFrozen already checks this across the CRE).
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole("aurienta_rep");
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    if (reason.length < 4) {
      return NextResponse.json(
        { error: "A freeze reason (≥ 4 chars) is required for the audit log.", code: "INVALID_REASON" },
        { status: 400 }
      );
    }

    const enterprise = await db.enterprise.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, status: true, frozenAt: true },
    });
    if (!enterprise) {
      return NextResponse.json({ error: "Enterprise not found", code: "NOT_FOUND" }, { status: 404 });
    }

    // CRE policy check — allowed even if already frozen (idempotent), but flagged.
    const verdict = enforceEmergencyFreeze(enterprise);
    if (!verdict.allowed) {
      await audit({
        actorId: user.id,
        action: "admin.enterprise.freeze",
        target: `enterprise:${id}`,
        result: "denied",
        reason: verdict.reason,
        metadata: { policy: verdict.policy },
      });
      return NextResponse.json(
        { error: verdict.reason ?? "Freeze denied by CRE.", code: "cre_denied", policy: verdict.policy },
        { status: 400 }
      );
    }

    if (enterprise.status === "frozen") {
      // Idempotent — still record the attempt for the audit trail.
      await audit({
        actorId: user.id,
        action: "admin.enterprise.freeze",
        target: `enterprise:${id}`,
        result: "allowed",
        reason: "already_frozen",
        metadata: { reason, frozenAt: enterprise.frozenAt },
      });
      return NextResponse.json({
        ok: true,
        alreadyFrozen: true,
        frozenAt: enterprise.frozenAt,
      });
    }

    // Wrap the freeze + ledger event in a single transaction.
    const result = await db.$transaction(async (tx) => {
      const updated = await tx.enterprise.update({
        where: { id },
        data: { status: "frozen", frozenAt: new Date() },
        select: { id: true, status: true, frozenAt: true },
      });

      await appendLedgerEvent(tx, {
        enterpriseId: id,
        eventType: "cre_decision",
        payload: {
          action: "emergency_freeze",
          actorId: user.id,
          reason,
          priorStatus: enterprise.status,
          newStatus: "frozen",
          policy: verdict.policy,
          decisionToken: verdict.decisionToken,
        },
        actorId: user.id,
      });

      return updated;
    });

    await audit({
      actorId: user.id,
      action: "admin.enterprise.freeze",
      target: `enterprise:${id}`,
      result: "allowed",
      reason,
      metadata: {
        priorStatus: enterprise.status,
        newStatus: "frozen",
        policy: verdict.policy,
      },
    });

    return NextResponse.json({
      ok: true,
      enterprise: result,
      reason,
      actor: { id: user.id, legalName: user.legalName },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[POST /api/admin/enterprises/[id]/freeze] error:", { err: msg });
    if (msg === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated", code: "UNAUTHORIZED" }, { status: 401 });
    }
    if (msg.startsWith("Forbidden:")) {
      return NextResponse.json({ error: msg, code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to freeze enterprise.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
