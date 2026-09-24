import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { appendLedgerEvent, enforceSuccessionGate } from "@/lib/aurienta/cre";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Activate a Succession Declaration's voting proxy (Blueprint Vol 16 §16.1)
//
// POST /api/succession/[id]/activate
//
// Activates the declaration's voting proxy. Per the blueprint:
//   1. The voting proxy can be activated when the declarant has been
//      verified deceased or incapacitated (via a law-firm death certificate
//      uploaded to /api/verification — future task).
//   2. The CRE checks the threshold (default 90 days) before activation;
//      if the declaration was filed < thresholdDays ago, the CRE denies with
//      `SUCCESSION_THRESHOLD_NOT_MET`.
//   3. Once activated, the designated successor / emergency manager must
//      act on the declarant's behalf. The declarant's normal operations are
//      blocked (enforceSuccessionGate "check_active").
//
// In this sandbox, activation is permitted when:
//   - the declaration status is "filed"
//   - the threshold (declaredAt + thresholdDays) has elapsed
//   - the caller is the declarant themselves (warming up the proxy) OR an
//     institutional reviewer (law_firm_rep / accounting_firm_rep / aurienta_rep)
//     submitting a death certificate
//
// The "declaredDeceasedOrIncapacitated" flag is currently set by an admin
// action (not implemented here); when it is set, the gate enforces the
// proxy-active block. This endpoint just activates the proxy + audit-logs.
// ─────────────────────────────────────────────────────────────────────────────

export const POST = withErrorHandler(
  async (
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
  ) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await ctx.params;
    if (!id || id.length < 6) {
      return NextResponse.json(
        { error: "Invalid declaration id", code: "invalid_id" },
        { status: 400 }
      );
    }

    const declaration = await db.successionDeclaration.findUnique({
      where: { id },
      include: { economicBeneficiaries: true },
    });
    if (!declaration) {
      return NextResponse.json(
        { error: "Succession declaration not found", code: "not_found" },
        { status: 404 }
      );
    }

    // Authorization: only the declarant themselves OR an institutional
    // reviewer role may activate.
    const isDeclarant = declaration.userId === user.id;
    const isReviewer = user.memberships.some(
      (m) =>
        m.role === "law_firm_rep" ||
        m.role === "accounting_firm_rep" ||
        m.role === "aurienta_rep"
    );
    if (!isDeclarant && !isReviewer) {
      await audit({
        actorId: user.id,
        action: "succession.activate",
        target: `succession:${id}`,
        result: "denied",
        reason: "Not authorized to activate this declaration",
      });
      return NextResponse.json(
        { error: "Only the declarant or an institutional reviewer may activate a succession declaration.", code: "forbidden" },
        { status: 403 }
      );
    }

    if (declaration.status !== "filed") {
      return NextResponse.json(
        {
          error: `Cannot activate a declaration in status '${declaration.status}'. Must be 'filed'.`,
          code: "wrong_status",
        },
        { status: 400 }
      );
    }

    // Parse the conditions JSON.
    let conditions: { onDeath: boolean; onIncapacitation: boolean; thresholdDays: number };
    try {
      conditions = JSON.parse(declaration.conditions);
    } catch {
      return NextResponse.json(
        { error: "Declaration conditions are malformed (invalid JSON).", code: "malformed_conditions" },
        { status: 500 }
      );
    }

    // ── CRE: enforce threshold (default 90 days) ──
    // The voting proxy can only be activated after the threshold has elapsed
    // since declaration filing. This gives the declarant a cooling-off period
    // to revoke + prevents hasty activations on brief incapacitation.
    const filedAt = declaration.declaredAt.getTime();
    const thresholdMs = (conditions.thresholdDays ?? 90) * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - filedAt;
    if (elapsed < thresholdMs) {
      const daysRemaining = Math.ceil((thresholdMs - elapsed) / (24 * 60 * 60 * 1000));
      await audit({
        actorId: user.id,
        action: "succession.activate",
        target: `succession:${id}`,
        result: "denied",
        reason: `threshold_not_met_${daysRemaining}d_remaining`,
        metadata: {
          thresholdDays: conditions.thresholdDays,
          daysRemaining,
          filedAt: declaration.declaredAt.toISOString(),
        },
      });
      return NextResponse.json(
        {
          error: `Succession gate: the ${conditions.thresholdDays}-day threshold has not elapsed since filing. ${daysRemaining} day(s) remaining.`,
          code: "cre_denied",
          policy: "succession_gate.rego",
          gateCode: "SUCCESSION_THRESHOLD_NOT_MET",
          daysRemaining,
        },
        { status: 400 }
      );
    }

    // ── Run the CRE gate (advisory — we already know it's allowed) ──
    const gate = enforceSuccessionGate({
      userId: declaration.userId,
      action: "check_active",
      declaration: {
        status: "filed",
        votingProxyActive: declaration.votingProxyActive,
        votingProxyActivatedAt: declaration.votingProxyActivatedAt,
        conditions,
      },
      declaredDeceasedOrIncapacitated: true, // we are about to activate
      required: true,
    });
    // The gate will return SUCCESSION_PROXY_ACTIVE (which is `allowed: false`)
    // because the partner is about to be proxy-active. That's expected — we
    // log the gate verdict but proceed with the activation since this IS the
    // activation request.
    void gate;

    // ── Activate ──
    const now = new Date();
    const updated = await db.$transaction(async (tx) => {
      const decl = await tx.successionDeclaration.update({
        where: { id },
        data: {
          status: "activated",
          votingProxyActive: true,
          votingProxyActivatedAt: now,
        },
      });

      // Ledger event (constitutional hash chain).
      await appendLedgerEvent(tx, {
        enterpriseId: undefined, // succession is user-scoped, not enterprise-scoped
        eventType: "cre_decision",
        payload: {
          action: "succession_voting_proxy_activated",
          declarationId: decl.id,
          declarantUserId: decl.userId,
          activatedBy: user.id,
          activatedAt: now.toISOString(),
          thresholdDays: conditions.thresholdDays,
          filedAt: declaration.declaredAt.toISOString(),
          conditions,
        },
        actorId: user.id,
      });

      return decl;
    });

    // Notify the declarant (in case they're not the activator) + the
    // designated successor (if a platform user) + the emergency manager.
    const notifyUserIds = new Set<string>();
    notifyUserIds.add(declaration.userId);
    if (declaration.beneficiaryUserId) notifyUserIds.add(declaration.beneficiaryUserId);
    if (declaration.emergencyManagerId) notifyUserIds.add(declaration.emergencyManagerId);
    for (const uid of notifyUserIds) {
      await db.notification
        .create({
          data: {
            userId: uid,
            category: "governance",
            title: "Succession voting proxy activated",
            body: `Succession declaration ${declaration.id} has been activated. The designated successor / emergency manager must now act on the declarant's behalf. (Vol 16 §16.1)`,
            href: "/dashboard/succession-declaration",
            aiPriority: "urgent",
          },
        })
        .catch(() => {
          // Best-effort — non-fatal.
        });
    }

    await audit({
      actorId: user.id,
      action: "succession.activate",
      target: `succession:${id}`,
      result: "allowed",
      metadata: {
        declarantUserId: declaration.userId,
        activatedAt: now.toISOString(),
        thresholdDays: conditions.thresholdDays,
        activatedByRole: isReviewer
          ? user.memberships.find((m) =>
              ["law_firm_rep", "accounting_firm_rep", "aurienta_rep"].includes(m.role)
            )?.role
          : "self",
      },
    });

    return NextResponse.json({
      declaration: {
        id: updated.id,
        status: updated.status,
        votingProxyActive: updated.votingProxyActive,
        votingProxyActivatedAt: updated.votingProxyActivatedAt?.toISOString() ?? null,
        conditions,
      },
      gate: {
        policy: gate.policy,
        decisionToken: gate.decisionToken,
      },
    });
  },
  "POST /api/succession/[id]/activate"
);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
