// Capital Formation Close API — Blueprint §5
// Transitions an enterprise from "fundraising_active" → "fundraising_closed" → "active"
// when the Capital Formation goal is met (or manually closed by founder).
//
// Prerequisites:
//   - Enterprise status must be "fundraising_active"
//   - raisedEgp must be ≥ fundraisingGoalEgp (or founder can close early with reduced goal)
//   - Only founding_operator or company_owner can close
//
// Post-close:
//   - Enterprise status → "active"
//   - Stage remains "stage_1" (Protected Formation)
//   - Enterprise is now operational (can create milestones, expenses, etc.)
//   - Ledger event appended

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: enterpriseId } = await params;
  const body = await req.json().catch(() => ({}));
  const { earlyClose, adjustedGoalEgp } = body as {
    earlyClose?: boolean;
    adjustedGoalEgp?: number;
  };

  // Fetch enterprise
  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: {
      id: true,
      name: true,
      status: true,
      fundraisingGoalEgp: true,
      raisedEgp: true,
      founderId: true,
      tier: true,
    },
  });

  if (!enterprise) {
    return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
  }

  // Authorization: only founding_operator or company_owner
  const membership = user.memberships.find(
    (m) =>
      m.enterpriseId === enterpriseId &&
      (m.role === "founding_operator" || m.role === "company_owner")
  );
  if (!membership && enterprise.founderId !== user.id) {
    return NextResponse.json(
      { error: "Only the Founding Operator or Company Owner can close Capital Formation" },
      { status: 403 }
    );
  }

  // Status check
  if (enterprise.status !== "fundraising_active") {
    return NextResponse.json(
      { error: `Enterprise status is "${enterprise.status}" — only "fundraising_active" enterprises can close Capital Formation` },
      { status: 400 }
    );
  }

  // Goal check
  if (!earlyClose && enterprise.raisedEgp < enterprise.fundraisingGoalEgp) {
    return NextResponse.json(
      {
        error: `Capital Formation goal not yet met: ${enterprise.raisedEgp.toLocaleString()} / ${enterprise.fundraisingGoalEgp.toLocaleString()} EGP`,
        code: "GOAL_NOT_MET",
        raisedEgp: enterprise.raisedEgp,
        goalEgp: enterprise.fundraisingGoalEgp,
      },
      { status: 400 }
    );
  }

  const result = await db.$transaction(async (tx) => {
    // If early close with adjusted goal, update the goal
    const finalGoal = earlyClose && adjustedGoalEgp
      ? Math.min(adjustedGoalEgp, enterprise.fundraisingGoalEgp)
      : enterprise.fundraisingGoalEgp;

    if (earlyClose && adjustedGoalEgp) {
      await tx.enterprise.update({
        where: { id: enterpriseId },
        data: { fundraisingGoalEgp: finalGoal },
      });
    }

    // Transition status: fundraising_active → active
    const updated = await tx.enterprise.update({
      where: { id: enterpriseId },
      data: { status: "active" },
    });

    // Ledger event
    await appendLedgerEvent(tx, {
      enterpriseId,
      eventType: "capital_formation_closed",
      payload: {
        goalEgp: finalGoal,
        raisedEgp: enterprise.raisedEgp,
        earlyClose: !!earlyClose,
        closedBy: user.id,
        tier: enterprise.tier,
        note: earlyClose
          ? "Capital Formation closed early by founder with adjusted goal"
          : "Capital Formation goal met — enterprise is now operational",
      },
      actorId: user.id,
    });

    return updated;
  });

  await audit({
    actorId: user.id,
    action: "enterprise.close_capital_formation",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      raisedEgp: enterprise.raisedEgp,
      goalEgp: enterprise.fundraisingGoalEgp,
      earlyClose: !!earlyClose,
    },
  });

  logger.info("capital_formation_closed", {
    enterpriseId,
    raisedEgp: enterprise.raisedEgp,
    goalEgp: enterprise.fundraisingGoalEgp,
  });

  return NextResponse.json({
    ok: true,
    enterprise: {
      id: result.id,
      status: result.status,
      name: enterprise.name,
    },
  });
}
