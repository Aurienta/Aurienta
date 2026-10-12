import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { audit } from "@/lib/aurienta/audit";
import {
  createRound,
  listOpenRounds,
  type DiasporaCorridorRoundWithEnterprise,
} from "@/lib/aurienta/diaspora-corridor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Diaspora Corridor — Rounds collection route.
//
// GET  /api/diaspora-corridor        — list open rounds (any authenticated
//                                       user may browse).
// POST /api/diaspora-corridor        — open a new round. Enterprise MANAGER
//                                       or FOUNDING_OPERATOR only.
//
// Egypt-only at launch. A "round" is a time-boxed window during which
// diaspora capital is pledged against a specific enterprise at a locked FX
// rate. AURIENTA never holds the capital — pledges settle via regulated
// bank rails (Zero Custody I 1.1). AML Law 80/2002 source-of-funds checks
// apply at the per-participant level (handled by the Diaspora Profile API,
// NOT by this route).
// ─────────────────────────────────────────────────────────────────────────────

const createRoundSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  fxRateLocked: z.number().positive().max(1000),
  closesAt: z.string().min(1),
});

function isManagerOf(user: { id: string; memberships: Array<{ role: string; enterpriseId: string }> }, enterpriseId: string): boolean {
  return user.memberships.some(
    (m) =>
      m.enterpriseId === enterpriseId &&
      (m.role === "manager" || m.role === "founding_operator" || m.role === "company_owner" || m.role === "board_member")
  );
}

function serializeRound(r: DiasporaCorridorRoundWithEnterprise) {
  return {
    id: r.id,
    enterpriseId: r.enterpriseId,
    enterpriseName: r.enterpriseName,
    enterpriseSlug: r.enterpriseSlug,
    enterpriseTier: r.enterpriseTier,
    enterpriseSector: r.enterpriseSector,
    totalPledgedEgp: r.totalPledgedEgp,
    participantCount: r.participantCount,
    fxRateLocked: r.fxRateLocked,
    status: r.status,
    closesAt: r.closesAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  };
}

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const rounds = await listOpenRounds();

  return NextResponse.json({ rounds: rounds.map(serializeRound) });
}, "GET /api/diaspora-corridor");

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createRoundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        code: "invalid_body",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  // Authorization: caller must be a manager / founding_operator / company_owner /
  // board_member of the target enterprise.
  if (!isManagerOf(user, parsed.data.enterpriseId)) {
    await audit({
      actorId: user.id,
      action: "diaspora_corridor.round_open",
      target: `enterprise:${parsed.data.enterpriseId}`,
      result: "denied",
      reason: "not_enterprise_manager",
    });
    return NextResponse.json(
      { error: "Only the enterprise manager / board may open a diaspora corridor round", code: "forbidden" },
      { status: 403 }
    );
  }

  // Parse + sanity-check the closesAt date.
  const closesAtMs = Date.parse(parsed.data.closesAt);
  if (!Number.isFinite(closesAtMs)) {
    return NextResponse.json(
      { error: "closesAt must be a valid ISO 8601 date string", code: "invalid_body" },
      { status: 400 }
    );
  }
  const closesAt = new Date(closesAtMs);

  let created;
  try {
    created = await createRound({
      enterpriseId: parsed.data.enterpriseId,
      fxRateLocked: parsed.data.fxRateLocked,
      closesAt,
      managerId: user.id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "create_failed";
    // Lookup the enterprise name (for the audit target label) best-effort.
    const ent = await db.enterprise.findUnique({
      where: { id: parsed.data.enterpriseId },
      select: { name: true },
    }).catch(() => null);
    await audit({
      actorId: user.id,
      action: "diaspora_corridor.round_open",
      target: `enterprise:${parsed.data.enterpriseId}`,
      result: "denied",
      reason: message,
      metadata: { enterpriseName: ent?.name },
    });
    return NextResponse.json(
      { error: message, code: "create_failed" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { round: serializeRound(created) },
    { status: 201 }
  );
}, "POST /api/diaspora-corridor");

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
