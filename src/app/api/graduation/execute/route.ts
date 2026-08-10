// AURIENTA — Graduation Execution API (Blueprint §15.10 / §16.4)
//
// Executing graduation is an irreversible constitutional act: it converts a
// stage-3 AURIENTA-nurtured enterprise into a sovereign, self-governing JSC.
// Because of its weight, the act is doubly gated:
//
//   1. Role gate — only the founding_operator, the company_owner, or a
//      board_member of the enterprise may trigger it. These are the same
//      three roles that may authorise the graduation export package.
//   2. Readiness gate — the nine constitutional gates must yield a readiness
//      score of at least 75, which corresponds to at least 7 of 9 gates
//      passing (6/9 = 67%, 7/9 = 78%). A sub-threshold enterprise cannot
//      graduate, full stop — the CRE refuses to sign the act.
//
// On success the enterprise's `status` and `stage` are both flipped to
// "graduated", a `graduation_executed` ledger event is appended (carrying
// the full readiness snapshot as evidence), and an audit entry is written.
// The ledger append + the enterprise mutation are committed inside a single
// `db.$transaction` so the chain can never record a graduation that did not
// actually flip the enterprise, and vice-versa.
//
// POST /api/graduation/execute  Body: { enterpriseId }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { computeGraduationReadiness, appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The three roles permitted to trigger graduation. Mirrors the export route.
const ALLOWED_ROLES = new Set([
  "founding_operator",
  "company_owner",
  "board_member",
]);

// Constitutional threshold: at least 7 of 9 gates must pass. Because the
// readiness score is round(passedCount / 9 * 100), the equivalent score
// threshold is 78 — but we use 75 per the blueprint's stated gate so that
// any future gate-count change keeps the "≥ 7 passing" intent intact.
const READINESS_THRESHOLD = 75;
const MIN_GATES_PASSING = 7;
const EXPECTED_GATE_COUNT = 9;

const BodySchema = z.object({
  enterpriseId: z.string().min(1).max(64),
});

/**
 * POST /api/graduation/execute
 * Body: { enterpriseId: string }
 *
 * Authorization: the caller must hold one of {founding_operator,
 * company_owner, board_member} on the target enterprise.
 *
 * Readiness: `computeGraduationReadiness` must return score >= 75
 * (equivalently, >= 7 of 9 gates passing).
 *
 * On success, inside a single `db.$transaction`:
 *   - enterprise.status → "graduated"
 *   - enterprise.stage  → "graduated"
 *   - append a `graduation_executed` ledger event carrying the readiness
 *     snapshot
 *
 * Returns: { ok, enterprise: { id, status, stage }, readiness: { score, gates } }
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth ──
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // ── Validate body ──
    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
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
    const { enterpriseId } = parsed.data;

    // ── Load the enterprise (we need it for both authz and the mutation) ──
    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: {
        id: true,
        name: true,
        tier: true,
        stage: true,
        status: true,
        healthScore: true,
      },
    });
    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise not found", code: "ENTERPRISE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // ── Authorization: founding_operator / company_owner / board_member ──
    const membershipsForEnt = user.memberships.filter(
      (m) => m.enterpriseId === enterpriseId
    );
    const authorised = membershipsForEnt.some((m) =>
      ALLOWED_ROLES.has(m.role)
    );
    if (!authorised) {
      await audit({
        actorId: user.id,
        action: "graduation.execute",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason:
          "Requires founding_operator, company_owner, or board_member role",
        metadata: {
          userRoles: membershipsForEnt.map((m) => m.role),
        },
      });
      return NextResponse.json(
        {
          error:
            "Forbidden: graduation execution requires the founding_operator, company_owner, or board_member role",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // ── Idempotency: an already-graduated enterprise cannot re-graduate ──
    if (enterprise.status === "graduated" || enterprise.stage === "graduated") {
      const currentReadiness = await computeGraduationReadiness(enterpriseId);
      return NextResponse.json({
        ok: true,
        alreadyGraduated: true,
        enterprise: {
          id: enterprise.id,
          status: enterprise.status,
          stage: enterprise.stage,
        },
        readiness: currentReadiness,
      });
    }

    // ── Readiness gate: score >= 75 AND >= 7 of 9 gates passing ──
    const readiness = await computeGraduationReadiness(enterpriseId);
    const gatesPassed = readiness.gates.filter((g) => g.passed).length;
    const meetsScore = readiness.score >= READINESS_THRESHOLD;
    const meetsGateCount =
      readiness.gates.length === EXPECTED_GATE_COUNT
        ? gatesPassed >= MIN_GATES_PASSING
        : gatesPassed >=
          Math.ceil(
            (MIN_GATES_PASSING / EXPECTED_GATE_COUNT) * readiness.gates.length
          );

    if (!meetsScore || !meetsGateCount) {
      await audit({
        actorId: user.id,
        action: "graduation.execute",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: "Graduation requirements not met",
        metadata: {
          score: readiness.score,
          gatesPassed,
          gatesTotal: readiness.gates.length,
          threshold: READINESS_THRESHOLD,
          minGatesPassing: MIN_GATES_PASSING,
          gates: readiness.gates,
        },
        ip:
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
        userAgent: req.headers.get("user-agent") ?? undefined,
      });
      logger.warn("graduation.execute.blocked", {
        enterpriseId,
        score: readiness.score,
        gatesPassed,
      });
      return NextResponse.json(
        {
          error: "Graduation requirements not met",
          code: "READINESS_NOT_MET",
          readiness,
          threshold: READINESS_THRESHOLD,
          gatesPassed,
          gatesTotal: readiness.gates.length,
        },
        { status: 400 }
      );
    }

    // ── Execute: flip status + stage and append the ledger event atomically ──
    const executedAt = new Date();

    const updated = await db.$transaction(async (tx) => {
      // Flip both lifecycle fields. stageSince advances to "now" so the
      // post-graduation tenure clock starts cleanly.
      const ent = await tx.enterprise.update({
        where: { id: enterpriseId },
        data: {
          status: "graduated",
          stage: "graduated",
          stageSince: executedAt,
        },
        select: { id: true, status: true, stage: true },
      });

      // Append the immutable graduation_executed ledger event carrying the
      // full readiness snapshot. This is the constitutional proof that the
      // CRE authorised the act AND that the enterprise met the threshold at
      // the moment of execution.
      const ledgerEvent = await appendLedgerEvent(tx, {
        enterpriseId,
        eventType: "graduation_executed",
        payload: {
          executedBy: user.id,
          executedAt: executedAt.toISOString(),
          previousStatus: enterprise.status,
          previousStage: enterprise.stage,
          readiness: {
            score: readiness.score,
            threshold: READINESS_THRESHOLD,
            gatesPassed,
            gatesTotal: readiness.gates.length,
            gates: readiness.gates,
          },
          enterprise: {
            id: enterprise.id,
            name: enterprise.name,
            tier: enterprise.tier,
            healthScore: enterprise.healthScore,
          },
        },
        actorId: user.id,
      });

      return {
        ent,
        ledgerSequence: ledgerEvent.sequence,
        ledgerId: ledgerEvent.id,
      };
    });

    await audit({
      actorId: user.id,
      action: "graduation.execute",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      reason: `Enterprise graduated; score=${readiness.score}, gatesPassed=${gatesPassed}/${readiness.gates.length}`,
      metadata: {
        ledgerSequence: updated.ledgerSequence,
        ledgerId: updated.ledgerId,
        score: readiness.score,
        gatesPassed,
        gatesTotal: readiness.gates.length,
        previousStatus: enterprise.status,
        previousStage: enterprise.stage,
      },
      ip:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    logger.info("graduation.executed", {
      enterpriseId,
      userId: user.id,
      score: readiness.score,
      ledgerSequence: updated.ledgerSequence,
    });

    return NextResponse.json({
      ok: true,
      enterprise: {
        id: updated.ent.id,
        status: updated.ent.status,
        stage: updated.ent.stage,
      },
      readiness,
      ledgerSequence: updated.ledgerSequence,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[POST /api/graduation/execute] error:", { err: msg });
    return NextResponse.json(
      {
        error: "Failed to execute graduation.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
