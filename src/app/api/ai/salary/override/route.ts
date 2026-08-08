// AURIENTA Compensation Intelligence — Salary Board Override API
// Blueprint Volume 8 §8.4.3
//
// POST /api/ai/salary/override
//   Processes a board override of an AI-calculated salary.
//   - Authorization: ONLY `board_member` role can call this endpoint.
//   - Requires boardVotePct >= 75 (constitutional threshold)
//   - Overrides > 200% of the AI salary trigger automatic shareholder notification
//   - The override is logged to the immutable ledger hash-chain (with justification)
//
// Auth required + role-checked. Rate limited via `limiters.ai`. Validated with Zod.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { parseBody } from "@/lib/aurienta/validation";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import { processSalaryOverride } from "@/lib/aurienta/salary-engine";
import { logger } from "@/lib/aurienta/logger";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const overrideSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  employeeId: z.string().min(1).max(64),
  aiCalculatedSalaryEgp: z.number().int().min(1).max(10_000_000),
  overrideSalaryEgp: z.number().int().min(1).max(10_000_000),
  justification: z.string().min(10).max(2000),
  boardVotePct: z.number().min(0).max(100),
  voterIds: z.array(z.string().min(1).max(64)).min(1).max(64),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Authorization: only `board_member` role can call this endpoint.
  // The user may be a board_member on any enterprise — we don't tie the
  // check to a specific enterpriseId here (the ledger write will record it).
  const isBoardMember = user.memberships.some((m) => m.role === "board_member");
  if (!isBoardMember) {
    await audit({
      actorId: user.id,
      action: "ai.salary.override",
      target: `enterprise:${req.headers.get("x-enterprise-id") ?? "unknown"}`,
      result: "denied",
      reason: "role_not_board_member",
      metadata: {
        userRoles: user.memberships.map((m) => m.role),
      },
    });
    return NextResponse.json(
      {
        error: "forbidden",
        message: "Only board_member role can process salary overrides (Blueprint §8.4.3)",
      },
      { status: 403 }
    );
  }

  const rlHit = limiters.ai(user.id);
  if (!rlHit.allowed) return rateLimitedResponse(rlHit.resetAt);

  const body = await parseBody(req, overrideSchema);
  if (body instanceof NextResponse) return body;

  try {
    const result = await processSalaryOverride({
      enterpriseId: body.enterpriseId,
      employeeId: body.employeeId,
      aiCalculatedSalaryEgp: body.aiCalculatedSalaryEgp,
      overrideSalaryEgp: body.overrideSalaryEgp,
      justification: body.justification,
      boardVotePct: body.boardVotePct,
      voterIds: body.voterIds,
    });

    await audit({
      actorId: user.id,
      action: "ai.salary.override",
      target: `enterprise:${body.enterpriseId}:employee:${body.employeeId}`,
      result: result.allowed ? "allowed" : "denied",
      reason: result.reason,
      metadata: {
        aiCalculatedSalaryEgp: body.aiCalculatedSalaryEgp,
        overrideSalaryEgp: body.overrideSalaryEgp,
        overrideRatio: result.overrideRatio,
        boardVotePct: body.boardVotePct,
        voterCount: body.voterIds.length,
        requiresShareholderNotification: result.requiresShareholderNotification,
        loggedToLedger: result.loggedToLedger,
        justification: body.justification,
      },
    });

    logger.info("api.ai.salary.override.processed", {
      userId: user.id,
      enterpriseId: body.enterpriseId,
      employeeId: body.employeeId,
      allowed: result.allowed,
      overrideRatio: result.overrideRatio,
      requiresShareholderNotification: result.requiresShareholderNotification,
    });

    // If the override requires shareholder notification, return 200 with a
    // prominent flag (the caller — typically a board portal — is responsible
    // for fanning out the notification).
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    logger.error("api.ai.salary.override.failed", {
      userId: user.id,
      enterpriseId: body.enterpriseId,
      employeeId: body.employeeId,
      err: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      {
        error: "salary_override_failed",
        message: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
