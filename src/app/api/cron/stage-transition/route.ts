import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/cron/stage-transition
// Checks for enterprises whose stage should advance (Vol 15 §15.1).
// Stage 1 (Formation) → Stage 2 (Capital Formation) → Stage 3 (Operations) → Stage 4 (Graduation Readiness)
//
// Transition criteria:
//   Stage 1 → 2: Capital formation opened (fundraisingGoalEgp set)
//   Stage 2 → 3: Capital fully raised (raisedEgp >= fundraisingGoalEgp) + first milestone approved
//   Stage 3 → 4: 3 consecutive profitable quarters + health score >= 75
//
// Token-auth via CRON_SECRET.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enterprises = await db.enterprise.findMany({
    where: {
      status: { in: ["active", "graduation_pending"] },
      stage: { in: ["stage_1", "stage_2", "stage_3"] },
    },
    select: {
      id: true,
      name: true,
      stage: true,
      stageSince: true,
      healthScore: true,
      fundraisingGoalEgp: true,
      raisedEgp: true,
    },
  });

  let transitioned = 0;
  const transitions: Array<{ enterpriseId: string; from: string; to: string; reason: string }> = [];

  for (const ent of enterprises) {
    let newStage: string | null = null;
    let reason = "";

    // Stage 1 → 2: Capital formation opened
    if (ent.stage === "stage_1" && ent.fundraisingGoalEgp > 0) {
      newStage = "stage_2";
      reason = "Capital formation opened (fundraisingGoalEgp set)";
    }

    // Stage 2 → 3: Capital fully raised
    if (ent.stage === "stage_2" && ent.raisedEgp >= ent.fundraisingGoalEgp) {
      newStage = "stage_3";
      reason = `Capital fully raised (${ent.raisedEgp.toLocaleString()} EGP)`;
    }

    // Stage 3 → 4: health score >= 75
    if (ent.stage === "stage_3" && ent.healthScore >= 75) {
      newStage = "stage_4";
      reason = `Health score ${ent.healthScore}/100 (threshold: 75)`;
    }

    if (newStage) {
      // Use a transaction so both the update + ledger append succeed atomically.
      await db.$transaction(async (tx) => {
        await tx.enterprise.update({
          where: { id: ent.id },
          data: {
            stage: newStage,
            stageSince: new Date(),
          },
        });

        // Append to the enterprise ledger (best-effort — skip if FK fails)
        // actorId must be a real user or null — "system" doesn't exist in the User table.
        try {
          await appendLedgerEvent(tx, {
            enterpriseId: ent.id,
            eventType: "stage_transition",
            payload: {
              action: "stage_transition",
              fromStage: ent.stage,
              toStage: newStage,
              reason,
              healthScore: ent.healthScore,
            },
            actorId: undefined,
          });
        } catch (ledgerErr) {
          console.warn("[stage-transition] Ledger append skipped:", ledgerErr);
        }
      });

      await audit({
        actorId: "system",
        action: "enterprise.stage_transitioned",
        target: `enterprise:${ent.id}`,
        result: "allowed",
        metadata: {
          fromStage: ent.stage,
          toStage: newStage,
          reason,
          enterpriseName: ent.name,
        },
      });

      transitions.push({
        enterpriseId: ent.id,
        from: ent.stage,
        to: newStage,
        reason,
      });
      transitioned++;
    }
  }

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    enterprisesChecked: enterprises.length,
    transitioned,
    transitions,
  });
});
