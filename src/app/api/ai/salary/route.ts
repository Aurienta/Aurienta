// AURIENTA Compensation Intelligence — AI Salary Engine API
// Blueprint Volume 8 §8.4
//
// POST /api/ai/salary
//   Calculates a constitutionally-compliant salary using the formula:
//   Salary = Base × Tier_multiplier × Performance_score × Regional_adjustment × Profit_factor
//   The calculated salary is validated by the Constitutional Brain AI (§8.4.2).
//
// Auth required. Rate limited via `limiters.ai`. Validated with Zod.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { parseBody } from "@/lib/aurienta/validation";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import { calculateConstitutionalSalary } from "@/lib/aurienta/salary-engine";
import { logger } from "@/lib/aurienta/logger";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const salarySchema = z.object({
  position: z.string().min(1).max(120),
  tier: z.enum(["A", "B", "C", "D", "E", "F"]),
  region: z.enum(["cairo", "alexandria", "delta", "upper_egypt", "suez_canal"]),
  performanceScore: z.number().min(0.5).max(1.5),
  profitFactor: z.number().min(0.8).max(1.2),
  customBaseEgp: z.number().int().min(1_000).max(1_000_000).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rlHit = limiters.ai(user.id);
  if (!rlHit.allowed) return rateLimitedResponse(rlHit.resetAt);

  const body = await parseBody(req, salarySchema);
  if (body instanceof NextResponse) return body;

  try {
    const result = await calculateConstitutionalSalary({
      position: body.position,
      tier: body.tier,
      region: body.region,
      performanceScore: body.performanceScore,
      profitFactor: body.profitFactor,
      customBaseEgp: body.customBaseEgp,
    });

    await audit({
      actorId: user.id,
      action: "ai.salary.calculate",
      target: `position:${body.position}`,
      result: "allowed",
      metadata: {
        tier: body.tier,
        region: body.region,
        baseEgp: result.baseEgp,
        calculatedSalaryEgp: result.calculatedSalaryEgp,
        finalSalaryEgp: result.finalSalaryEgp,
        compensationBand: result.compensationBand,
        aiValidated: result.aiValidation.validated,
        aiAdjusted: result.aiValidation.adjusted,
      },
    });

    logger.info("api.ai.salary.calculate.ok", {
      userId: user.id,
      position: body.position,
      tier: body.tier,
      region: body.region,
      finalSalaryEgp: result.finalSalaryEgp,
    });

    return NextResponse.json({ ok: true, result });
  } catch (e) {
    logger.error("api.ai.salary.calculate.failed", {
      userId: user.id,
      position: body.position,
      err: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      {
        error: "salary_calculation_failed",
        message: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
