import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { dripSchema, parseBody } from "@/lib/aurienta/validation";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

// GET /api/drip?enterpriseId=...
// Returns the caller's DRIP enrollment for the given enterprise (or all if no filter).
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");

  const enrollments = await db.dripEnrollment.findMany({
    where: { userId: user.id, ...(enterpriseId ? { enterpriseId } : {}) },
  });

  // Fetch enterprises separately (DripEnrollment has no enterprise relation)
  const entIds = [...new Set(enrollments.map((e) => e.enterpriseId))];
  const enterprises = await db.enterprise.findMany({
    where: { id: { in: entIds } },
    select: { id: true, name: true, slug: true, tier: true, equityUnitPriceEgp: true, sector: true },
  });
  const entMap = new Map(enterprises.map((e) => [e.id, e]));

  return NextResponse.json({
    enrollments: enrollments.map((e) => ({
      id: e.id,
      enterpriseId: e.enterpriseId,
      enterprise: entMap.get(e.enterpriseId),
      reinvestPct: e.reinvestPct,
      active: e.active,
      enrolledAt: e.enrolledAt.toISOString(),
    })),
  });
}

// POST /api/drip
// Body: { enterpriseId, reinvestPct?, action } where action = "enroll" | "unenroll" | "update"
// The enroll / update flow uses db.$transaction so the find-then-create race
// (TOCTOU) is closed; the unique constraint on (userId, enterpriseId) is the
// last line of defense — a P2002 collision returns 409.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // ── Rate limit ──
  const rl = limiters.orders(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  // ── Validate body ──
  const body = await parseBody(req, dripSchema);
  if (body instanceof NextResponse) return body;
  const { enterpriseId, action } = body;
  const pctNum = Math.max(0, Math.min(100, Number(body.reinvestPct ?? 0)));

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: {
      id: true,
      name: true,
      slug: true,
      tier: true,
      equityUnitPriceEgp: true,
      status: true,
    },
  });
  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found", code: "not_found" },
      { status: 404 }
    );
  }

  // Verify the user actually holds shares in this enterprise (DRIP requires a real holding).
  const holding = await db.ownershipRecord.findUnique({
    where: {
      enterpriseId_userId: { enterpriseId, userId: user.id },
    },
  });
  if (!holding || holding.equityUnits <= 0) {
    return NextResponse.json(
      {
        error:
          "You must hold Equity Units in this enterprise to enroll in its Dividend ReParticipation Plan.",
        code: "no_holding",
      },
      { status: 403 }
    );
  }

  // ── Unenroll: best-effort inside a transaction ──
  if (action === "unenroll") {
    let unenrolledOk = false;
    try {
      await db.$transaction(async (tx) => {
        const existing = await tx.dripEnrollment.findUnique({
          where: {
            userId_enterpriseId: { userId: user.id, enterpriseId },
          },
        });
        if (!existing) {
          throw new Error("__NO_ENROLLMENT__");
        }
        await tx.dripEnrollment.update({
          where: { id: existing.id },
          data: { active: false, reinvestPct: 0 },
        });
        await appendLedgerEvent(tx, {
          enterpriseId,
          eventType: "cre_decision",
          payload: {
            action: "drip_unenroll",
            userId: user.id,
            enterpriseId,
            note: "DRIP enrollment deactivated. Future dividends will be paid in cash.",
          },
          actorId: user.id,
        });
      });
      unenrolledOk = true;
    } catch (e) {
      if (e instanceof Error && e.message === "__NO_ENROLLMENT__") {
        return NextResponse.json(
          { error: "No active enrollment to unenroll.", code: "not_found" },
          { status: 400 }
        );
      }
      throw e;
    }

    if (unenrolledOk) {
      await audit({
        actorId: user.id,
        action: "drip.unenroll",
        target: `enterprise:${enterpriseId}`,
        result: "allowed",
      });
      return NextResponse.json({ ok: true, active: false });
    }
  }

  // ── Enroll / update: find-then-create inside ONE transaction ──
  // Catches P2002 (unique constraint on userId+enterpriseId) from a concurrent
  // enroll attempt and returns 409.
  let result:
    | { kind: "created"; enrollment: { id: string; enterpriseId: string; reinvestPct: number; active: boolean; enrolledAt: string } }
    | { kind: "updated"; enrollment: { id: string; enterpriseId: string; reinvestPct: number; active: boolean; enrolledAt: string } }
    | { kind: "conflict" };

  try {
    result = await db.$transaction(async (tx) => {
      const existing = await tx.dripEnrollment.findUnique({
        where: {
          userId_enterpriseId: { userId: user.id, enterpriseId },
        },
      });

      if (existing) {
        const updated = await tx.dripEnrollment.update({
          where: { id: existing.id },
          data: { reinvestPct: pctNum, active: true },
        });
        await appendLedgerEvent(tx, {
          enterpriseId,
          eventType: "cre_decision",
          payload: {
            action: "drip_update",
            userId: user.id,
            enterpriseId,
            reinvestPct: pctNum,
            note: "DRIP enrollment updated. ReParticipation will route through the standard Law Firm Client Account + CRE path at the AI fundamental price.",
          },
          actorId: user.id,
        });
        return {
          kind: "updated" as const,
          enrollment: {
            id: updated.id,
            enterpriseId: updated.enterpriseId,
            reinvestPct: updated.reinvestPct,
            active: updated.active,
            enrolledAt: updated.enrolledAt.toISOString(),
          },
        };
      }

      const created = await tx.dripEnrollment.create({
        data: {
          userId: user.id,
          enterpriseId,
          reinvestPct: pctNum,
          active: true,
        },
      });
      await appendLedgerEvent(tx, {
        enterpriseId,
        eventType: "cre_decision",
        payload: {
          action: "drip_enroll",
          userId: user.id,
          enterpriseId,
          reinvestPct: pctNum,
          note: "DRIP enrollment created. Auto-reParticipation at AI fundamental price within ±5% band through the standard Law Firm Client Account + CRE path.",
        },
        actorId: user.id,
      });
      return {
        kind: "created" as const,
        enrollment: {
          id: created.id,
          enterpriseId: created.enterpriseId,
          reinvestPct: created.reinvestPct,
          active: created.active,
          enrolledAt: created.enrolledAt.toISOString(),
        },
      };
    });
  } catch (e: unknown) {
    // P2002 = unique constraint on (userId, enterpriseId) — concurrent enroll.
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      result = { kind: "conflict" };
    } else {
      throw e;
    }
  }

  if (result.kind === "conflict") {
    await audit({
      actorId: user.id,
      action: "drip.enroll",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "duplicate_concurrent_enroll",
    });
    return NextResponse.json(
      { error: "Enrollment already exists. Retry to update.", code: "conflict" },
      { status: 409 }
    );
  }

  await audit({
    actorId: user.id,
    action: result.kind === "created" ? "drip.enroll" : "drip.update",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: { reinvestPct: pctNum },
  });

  return NextResponse.json({ ok: true, enrollment: result.enrollment });
}
