import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/cron/crcica-arbitration
// Advances CRCICA arbitration cases that are past their stage time limit.
// Also advances appeal cases through Stages 1→2→3→4 (Vol 10 §10.5).
//
// Stage time limits:
//   Stage 1 (AI Mediation): 72 hours → advance to Stage 2
//   Stage 2 (Board Review): 7 days → advance to Stage 3
//   Stage 3 (Shareholder Vote): 14 days → advance to Stage 4 (CRCICA)
//   Stage 4 (CRCICA): 90 days → advance to Stage 5 (Enforcement)
//   Stage 5 (Enforcement): immediate → advance to Stage 6 (Closure)
//
// Token-auth via CRON_SECRET.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Stage time limits in hours
  const stageDurations: Record<number, number> = {
    1: 72,    // 3 days
    2: 168,   // 7 days
    3: 336,   // 14 days
    4: 2160,  // 90 days
    5: 0,     // immediate (enforcement → closure)
  };

  // Find all active appeal cases
  const activeCases = await (db as any).appealCase.findMany({
    where: {
      status: { not: "closed" },
    },
  });

  let advanced = 0;
  const advancements: Array<{ caseId: string; fromStage: number; toStage: number; reason: string }> = [];

  for (const caseRow of activeCases) {
    const currentStage = caseRow.stage ?? 1;
    const stageDurationHours = stageDurations[currentStage] ?? 0;

    if (stageDurationHours === 0 && currentStage === 5) {
      // Stage 5 → 6 (closure)
      await (db as any).appealCase.update({
        where: { id: caseRow.id },
        data: {
          stage: 6,
          status: "closed",
          resolvedAt: now,
        },
      });

      await audit({
        actorId: "system",
        action: "appeal.case_closed",
        target: `appeal:${caseRow.id}`,
        result: "allowed",
        metadata: {
          fromStage: 5,
          toStage: 6,
          closedAt: now.toISOString(),
        },
      });

      advancements.push({
        caseId: caseRow.id,
        fromStage: 5,
        toStage: 6,
        reason: "Enforcement complete — case closed",
      });
      advanced++;
      continue;
    }

    // Check if the stage duration has elapsed
    const filedAt = caseRow.filedAt ?? now;
    const hoursElapsed = (now.getTime() - filedAt.getTime()) / (1000 * 60 * 60);

    if (hoursElapsed >= stageDurationHours && currentStage < 5) {
      const nextStage = currentStage + 1;
      const nextStatus = nextStage === 4 ? "crcica_arbitration" : nextStage === 6 ? "closed" : "in_progress";

      await (db as any).appealCase.update({
        where: { id: caseRow.id },
        data: {
          stage: nextStage,
          status: nextStatus,
        },
      });

      await audit({
        actorId: "system",
        action: "appeal.stage_advanced",
        target: `appeal:${caseRow.id}`,
        result: "allowed",
        metadata: {
          fromStage: currentStage,
          toStage: nextStage,
          hoursElapsed: Math.round(hoursElapsed),
          reason: `Stage ${currentStage} time limit (${stageDurationHours}h) elapsed`,
        },
      });

      advancements.push({
        caseId: caseRow.id,
        fromStage: currentStage,
        toStage: nextStage,
        reason: `Stage ${currentStage} time limit (${stageDurationHours}h) elapsed`,
      });
      advanced++;
    }
  }

  return NextResponse.json({
    ok: true,
    checkedAt: now.toISOString(),
    casesChecked: activeCases.length,
    advanced,
    advancements,
  });
});
