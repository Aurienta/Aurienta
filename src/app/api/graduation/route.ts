// AURIENTA — Graduation Readiness API (Blueprint §15.10 / §16.4)
//
// Graduation is the moment a constitutional enterprise transitions from a
// stage-3 AURIENTA-nurtured entity into a sovereign, self-governing JSC. The
// decision is gated by nine constitutional readiness checks (runway, health
// rating, NOSI compliance, police clearance, stage tenure, revenue growth,
// a 75% supermajority graduation vote, no open whistleblower reports, and
// no outstanding appeals).
//
// This endpoint is the single, canonical READ boundary for that readiness
// state. It supersedes the scattered graduation logic that previously lived
// inside proposals and AI endpoints, giving the institutional-readiness UI,
// the graduation simulator, and the founder studio one consistent source of
// truth.
//
// GET /api/graduation?enterpriseId=xxx
//   - Auth required (getCurrentUser).
//   - Caller must be a member of the enterprise (any role).
//   - Returns the live readiness score, the nine gates, and a slim
//     enterprise profile (id, name, tier, stage, healthScore) so the UI
//     can render the full graduation dashboard in a single round-trip.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { computeGraduationReadiness } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  enterpriseId: z.string().min(1).max(64),
});

/**
 * GET /api/graduation?enterpriseId=xxx
 *
 * Returns the live graduation readiness for an enterprise.
 *
 * Response shape:
 *   {
 *     ok: true,
 *     readiness: { score: number, gates: { label: string, passed: boolean }[] },
 *     enterprise: { id, name, tier, stage, healthScore }
 *   }
 */
export async function GET(req: NextRequest) {
  try {
    // ── Auth ──
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // ── Parse + validate query ──
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      enterpriseId: url.searchParams.get("enterpriseId") ?? "",
    });
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          code: "INVALID_QUERY",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }
    const { enterpriseId } = parsed.data;

    // ── Membership check: any role suffices to READ readiness ──
    // (Executing graduation is gated separately by the /execute route.)
    const isMember = user.memberships.some(
      (m) => m.enterpriseId === enterpriseId
    );
    if (!isMember) {
      await audit({
        actorId: user.id,
        action: "graduation.read",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: "Caller is not a member of this enterprise",
      });
      return NextResponse.json(
        {
          error: "Forbidden: you are not a member of this enterprise.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // ── Load the enterprise (slim projection — only what the UI needs) ──
    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: {
        id: true,
        name: true,
        tier: true,
        stage: true,
        healthScore: true,
      },
    });
    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise not found", code: "ENTERPRISE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // ── Compute graduation readiness (9 constitutional gates) ──
    const readiness = await computeGraduationReadiness(enterpriseId);

    await audit({
      actorId: user.id,
      action: "graduation.read",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      reason: `Readiness score=${readiness.score}`,
      metadata: {
        score: readiness.score,
        gatesPassed: readiness.gates.filter((g) => g.passed).length,
        gatesTotal: readiness.gates.length,
      },
      ip:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    logger.info("graduation.readiness", {
      enterpriseId,
      score: readiness.score,
      userId: user.id,
    });

    return NextResponse.json({
      ok: true,
      readiness,
      enterprise,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[GET /api/graduation] error:", { err: msg });
    return NextResponse.json(
      {
        error: "Failed to compute graduation readiness.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
