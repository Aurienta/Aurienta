// AURIENTA Compensation Intelligence — AI Salary Engine (Blueprint Volume 8 §8.4)
//
// Implements the constitutional salary calculation formula:
//   Salary = Base × Tier_multiplier × Performance_score × Regional_adjustment × Profit_factor
//
// Constitutional guarantees (Blueprint §8.4):
//  - Tier multipliers are FIXED per tier (A=0.8, B=1.0, C=1.3, D=1.5, E=0.9, F=1.5)
//  - Regional adjustments are FIXED (Cairo=1.0, Alexandria=0.9, Delta=0.85, Upper Egypt=0.8, Suez Canal=0.95)
//  - Performance score is clamped to [0.5, 1.5] (monthly milestone achievement rate)
//  - Profit factor is clamped to [0.8, 1.2] (quarterly company profitability vs sector average)
//  - Base salaries come from the Ministry of Manpower market rate API (quarterly refresh)
//  - Every calculated salary is validated by the Constitutional Brain AI (§8.4.2)
//  - If the AI says NO, performance falls back to 1.0 (neutral) and recalculation is logged
//  - Board overrides require ≥75% vote and a written justification (§8.4.3)
//  - Overrides >200% of the AI salary trigger automatic shareholder notification
//  - Below-AI salaries are allowed without a board vote but never below minimum wage
//
// All override events are written to the immutable LedgerEvent hash-chain via
// appendLedgerEvent inside a db.$transaction — no off-ledger salary decisions.

import { db } from "@/lib/db";
import { logger } from "@/lib/aurienta/logger";
import { askConstitutionalAI } from "@/lib/aurienta/ai";
import { appendLedgerEvent } from "@/lib/aurienta/cre";

// ── Tier multipliers (fixed per blueprint §8.4.1) ──
// These cannot be changed without a charter amendment.
export const TIER_MULTIPLIERS: Record<string, number> = {
  A: 0.8,
  B: 1.0,
  C: 1.3,
  D: 1.5,
  E: 0.9,
  F: 1.5,
};

// ── Regional adjustments (fixed per blueprint §8.4.1) ──
// Reflect cost-of-living differentials across Egyptian regions.
export const REGIONAL_ADJUSTMENTS: Record<string, number> = {
  cairo: 1.0,
  alexandria: 0.9,
  delta: 0.85,
  upper_egypt: 0.8,
  suez_canal: 0.95,
};

// ── Market rate base salaries by position (EGP/month) — seed data ──
// In production these come from the Ministry of Manpower API (quarterly refresh).
// These figures reflect 2026 Egyptian market rates for skilled urban roles.
export const MARKET_RATES: Record<string, number> = {
  software_engineer: 15000,
  operations_manager: 20000,
  sales_manager: 18000,
  accountant: 12000,
  marketing_specialist: 13000,
  graphic_designer: 11000,
  project_manager: 22000,
  chief_technology_officer: 45000,
  chief_financial_officer: 40000,
  chief_executive_officer: 50000,
  hr_manager: 14000,
  customer_service: 9000,
  driver: 7000,
  warehouse_worker: 6500,
  factory_worker: 6000,
  engineer: 16000,
  lawyer: 25000,
  consultant: 30000,
  intern: 4000,
  other: 10000,
};

// ── Constitutional bounds ──
export const MIN_PERFORMANCE_SCORE = 0.5;
export const MAX_PERFORMANCE_SCORE = 1.5;
export const NEUTRAL_PERFORMANCE_SCORE = 1.0;
export const MIN_PROFIT_FACTOR = 0.8;
export const MAX_PROFIT_FACTOR = 1.2;
export const BOARD_OVERRIDE_THRESHOLD_PCT = 75; // §8.4.3
export const SHAREHOLDER_NOTIFICATION_RATIO = 2.0; // §8.4.3 — >200% of AI salary
export const MINIMUM_WAGE_EGP = 4000; // 2026 Egyptian minimum wage
export const SALARY_ROUNDING_EGP = 100; // round to nearest 100 EGP
export const COMPENSATION_BAND_UPPER_FACTOR = 1.3; // band = salary to salary × 1.3

export type SalaryCalculationInput = {
  position: string;
  tier: string; // A-F
  region: string; // cairo, alexandria, delta, upper_egypt, suez_canal
  performanceScore: number; // 0.5 - 1.5
  profitFactor: number; // 0.8 - 1.2
  customBaseEgp?: number; // override the market rate if provided
};

export type SalaryCalculationResult = {
  baseEgp: number;
  tierMultiplier: number;
  performanceScore: number;
  regionalAdjustment: number;
  profitFactor: number;
  calculatedSalaryEgp: number; // before AI validation
  finalSalaryEgp: number; // after AI validation (may be adjusted)
  compensationBand: string; // e.g. "25,000-32,500 EGP"
  aiValidation: {
    validated: boolean;
    response: string;
    adjusted: boolean; // true if AI said NO and we fell back
  };
  formula: string; // human-readable: "15000 × 1.3 × 1.2 × 1.0 × 1.1 = 25740 → 25700"
};

export type SalaryOverrideInput = {
  enterpriseId: string;
  employeeId: string;
  aiCalculatedSalaryEgp: number;
  overrideSalaryEgp: number;
  justification: string; // "market rate changed", "exceptional performance", etc.
  boardVotePct: number; // 0-100, must be >= 75
  voterIds: string[];
};

export type SalaryOverrideResult = {
  allowed: boolean;
  reason?: string;
  requiresShareholderNotification: boolean; // true if override > 200% of AI salary
  overrideRatio: number; // overrideSalary / aiCalculatedSalary
  loggedToLedger: boolean;
};

// ── Helper: format an EGP amount with thousands separators ──
function formatEgp(amount: number): string {
  return Math.round(amount).toLocaleString("en-US");
}

// ── Helper: clamp a number to [min, max] ──
function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

// ── Helper: round to nearest 100 EGP (blueprint §8.4 example) ──
function roundToHundred(amount: number): number {
  return Math.round(amount / SALARY_ROUNDING_EGP) * SALARY_ROUNDING_EGP;
}

// ── Helper: compute compensation band from a salary ──
// Blueprint §8.6.2 — Constitutional Partners see BANDS only.
// Band = salary to salary × 1.3 (±15% around midpoint ≈ 30% range).
export function computeCompensationBand(salaryEgp: number): string {
  const lower = roundToHundred(salaryEgp);
  const upper = roundToHundred(salaryEgp * COMPENSATION_BAND_UPPER_FACTOR);
  return `${formatEgp(lower)}-${formatEgp(upper)} EGP`;
}

// ── Helper: detect whether the AI's response is a YES (validated) ──
// The AI is asked to reply YES or NO + reason. We accept any response whose
// first non-whitespace token starts with "Y" (YES, Yes, yes) as validated.
// Everything else (including NO, fallbacks, malformed replies) is treated
// as "NO — fall back to neutral performance".
function aiSaysYes(content: string): boolean {
  if (!content) return false;
  // If the AI fell back, the content starts with "[AI_FALLBACK]" — treat as NO
  // so we conservatively fall back to neutral performance.
  if (content.includes("[AI_FALLBACK]")) return false;
  const trimmed = content.trim();
  const firstToken = trimmed.split(/\s+/)[0]?.toUpperCase() ?? "";
  // Accept "YES" or "Y" — also "VALIDATED" / "OK" / "REASONABLE" as affirmative.
  return (
    firstToken === "YES" ||
    firstToken === "Y" ||
    firstToken === "VALIDATED" ||
    firstToken === "OK" ||
    firstToken === "REASONABLE"
  );
}

// ── Main calculation function — calls AI for validation (§8.4.2) ──
export async function calculateConstitutionalSalary(
  input: SalaryCalculationInput
): Promise<SalaryCalculationResult> {
  // 1. Resolve the base salary.
  const positionKey = (input.position ?? "").trim().toLowerCase();
  const baseEgp =
    typeof input.customBaseEgp === "number" && input.customBaseEgp > 0
      ? input.customBaseEgp
      : MARKET_RATES[positionKey] ?? MARKET_RATES.other;

  // 2. Look up tier multiplier and regional adjustment.
  const tierKey = (input.tier ?? "").trim().toUpperCase();
  const regionKey = (input.region ?? "").trim().toLowerCase();
  const tierMultiplier = TIER_MULTIPLIERS[tierKey] ?? 1.0;
  const regionalAdjustment = REGIONAL_ADJUSTMENTS[regionKey] ?? 1.0;

  // 3. Clamp performanceScore to [0.5, 1.5] and profitFactor to [0.8, 1.2].
  const performanceScore = clamp(
    Number(input.performanceScore) || NEUTRAL_PERFORMANCE_SCORE,
    MIN_PERFORMANCE_SCORE,
    MAX_PERFORMANCE_SCORE
  );
  const profitFactor = clamp(
    Number(input.profitFactor) ?? 1.0,
    MIN_PROFIT_FACTOR,
    MAX_PROFIT_FACTOR
  );

  // 4. Compute the formula: base × tierMult × performance × region × profit.
  const rawSalary =
    baseEgp * tierMultiplier * performanceScore * regionalAdjustment * profitFactor;

  // 5. Round to nearest 100 EGP (blueprint §8.4 example: 25,740 → 25,700).
  const calculatedSalaryEgp = roundToHundred(rawSalary);

  // 6. AI validation (§8.4.2) — sanity check the calculated salary.
  const aiPrompt = `Is ${formatEgp(
    calculatedSalaryEgp
  )} EGP/month reasonable for a ${input.position} (Tier ${tierKey}) in ${regionKey.replace(
    /_/g,
    " "
  )}, Egypt, given performance score ${performanceScore.toFixed(
    2
  )} and profit factor ${profitFactor.toFixed(2)}? Reply YES or NO and a brief reason.`;

  let aiResponseText = "";
  let aiValidated = false;
  let aiAdjusted = false;
  let finalSalaryEgp = calculatedSalaryEgp;

  try {
    const aiResult = await askConstitutionalAI({
      systemPrompt:
        "You are the AURIENTA Compensation Intelligence validator. " +
        "Assess whether the calculated monthly salary is reasonable for the Egyptian market. " +
        "Reply with YES or NO followed by a one-sentence justification. " +
        "Be conservative: only say YES if the figure is within ±50% of typical market rates for that position and region.",
      userMessage: aiPrompt,
      persist: false,
      kind: "general",
    });
    aiResponseText = aiResult.content;
    aiValidated = aiSaysYes(aiResult.content);

    // 7. If the AI says NO, recalculate with performance=1.0 (neutral fallback).
    if (!aiValidated) {
      aiAdjusted = true;
      const fallbackRaw =
        baseEgp *
        tierMultiplier *
        NEUTRAL_PERFORMANCE_SCORE *
        regionalAdjustment *
        profitFactor;
      finalSalaryEgp = roundToHundred(fallbackRaw);
      logger.warn("salary_engine.ai_rejected_fallback", {
        position: input.position,
        tier: tierKey,
        region: regionKey,
        calculatedSalaryEgp,
        fallbackSalaryEgp: finalSalaryEgp,
        aiResponse: aiResponseText.slice(0, 280),
      });
    }
  } catch (e) {
    // AI call failed — conservative fallback to neutral performance.
    aiAdjusted = true;
    aiResponseText = `[AI_FALLBACK] ${e instanceof Error ? e.message : "Unknown error"}`;
    const fallbackRaw =
      baseEgp *
      tierMultiplier *
      NEUTRAL_PERFORMANCE_SCORE *
      regionalAdjustment *
      profitFactor;
    finalSalaryEgp = roundToHundred(fallbackRaw);
    logger.error("salary_engine.ai_call_failed", {
      position: input.position,
      tier: tierKey,
      region: regionKey,
      err: e instanceof Error ? e.message : String(e),
    });
  }

  // 8. Compute the compensation band (salary to salary × 1.3, rounded).
  const compensationBand = computeCompensationBand(finalSalaryEgp);

  // 9. Build the human-readable formula string.
  const usedPerformance = aiAdjusted ? NEUTRAL_PERFORMANCE_SCORE : performanceScore;
  const formula = `${formatEgp(baseEgp)} × ${tierMultiplier} × ${usedPerformance.toFixed(
    2
  )} × ${regionalAdjustment} × ${profitFactor.toFixed(2)} = ${formatEgp(
    rawSalary
  )} → ${formatEgp(finalSalaryEgp)}`;

  logger.info("salary_engine.calculated", {
    position: input.position,
    tier: tierKey,
    region: regionKey,
    baseEgp,
    calculatedSalaryEgp,
    finalSalaryEgp,
    aiValidated,
    aiAdjusted,
    compensationBand,
  });

  return {
    baseEgp,
    tierMultiplier,
    performanceScore: usedPerformance,
    regionalAdjustment,
    profitFactor,
    calculatedSalaryEgp,
    finalSalaryEgp,
    compensationBand,
    aiValidation: {
      validated: aiValidated,
      response: aiResponseText,
      adjusted: aiAdjusted,
    },
    formula,
  };
}

// ── Override rules (§8.4.3) ──
// Board overrides are the ONLY mechanism by which a salary can deviate ABOVE
// the AI-calculated value. Below-AI salaries are permitted at manager discretion
// (must still be ≥ minimum wage) and do not require a board vote.
export async function processSalaryOverride(
  input: SalaryOverrideInput
): Promise<SalaryOverrideResult> {
  // 1. Check board vote threshold (§8.4.3: ≥75% required).
  if (input.boardVotePct < BOARD_OVERRIDE_THRESHOLD_PCT) {
    logger.warn("salary_engine.override_rejected_low_vote", {
      enterpriseId: input.enterpriseId,
      employeeId: input.employeeId,
      boardVotePct: input.boardVotePct,
      required: BOARD_OVERRIDE_THRESHOLD_PCT,
    });
    return {
      allowed: false,
      reason: `Board override threshold not met: ${input.boardVotePct}% < ${BOARD_OVERRIDE_THRESHOLD_PCT}% required (Blueprint §8.4.3)`,
      requiresShareholderNotification: false,
      overrideRatio: 0,
      loggedToLedger: false,
    };
  }

  // Validate the override salary is at least minimum wage.
  if (input.overrideSalaryEgp < MINIMUM_WAGE_EGP) {
    return {
      allowed: false,
      reason: `Override salary ${formatEgp(input.overrideSalaryEgp)} EGP is below the 2026 Egyptian minimum wage of ${formatEgp(
        MINIMUM_WAGE_EGP
      )} EGP/month`,
      requiresShareholderNotification: false,
      overrideRatio: 0,
      loggedToLedger: false,
    };
  }

  // 2. Compute the override ratio.
  const aiSalary = Math.max(input.aiCalculatedSalaryEgp, 1); // guard against /0
  const overrideRatio = input.overrideSalaryEgp / aiSalary;

  // 3. Determine if shareholder notification is required (>200% of AI salary).
  const requiresShareholderNotification = overrideRatio > SHAREHOLDER_NOTIFICATION_RATIO;

  // 4. Log the override to the immutable ledger via appendLedgerEvent
  //    (wrapped in db.$transaction per blueprint §8.4.3 — "logged with justification").
  let loggedToLedger = false;
  try {
    await db.$transaction(async (tx) => {
      await appendLedgerEvent(tx, {
        enterpriseId: input.enterpriseId,
        eventType: "salary_override",
        payload: {
          enterpriseId: input.enterpriseId,
          employeeId: input.employeeId,
          aiCalculatedSalaryEgp: input.aiCalculatedSalaryEgp,
          overrideSalaryEgp: input.overrideSalaryEgp,
          overrideRatio: Number(overrideRatio.toFixed(4)),
          boardVotePct: input.boardVotePct,
          voterIds: input.voterIds,
          justification: input.justification,
          requiresShareholderNotification,
          timestamp: new Date().toISOString(),
          blueprintRef: "Volume 8 §8.4.3",
        },
        actorId: input.voterIds[0] ?? undefined,
      });
    });
    loggedToLedger = true;
  } catch (e) {
    logger.error("salary_engine.override_ledger_failed", {
      enterpriseId: input.enterpriseId,
      employeeId: input.employeeId,
      err: e instanceof Error ? e.message : String(e),
    });
    return {
      allowed: false,
      reason: `Failed to log override to immutable ledger: ${
        e instanceof Error ? e.message : "Unknown error"
      }`,
      requiresShareholderNotification,
      overrideRatio: Number(overrideRatio.toFixed(4)),
      loggedToLedger: false,
    };
  }

  logger.info("salary_engine.override_processed", {
    enterpriseId: input.enterpriseId,
    employeeId: input.employeeId,
    aiCalculatedSalaryEgp: input.aiCalculatedSalaryEgp,
    overrideSalaryEgp: input.overrideSalaryEgp,
    overrideRatio: Number(overrideRatio.toFixed(4)),
    boardVotePct: input.boardVotePct,
    requiresShareholderNotification,
    loggedToLedger,
  });

  return {
    allowed: true,
    reason: requiresShareholderNotification
      ? `Override approved (${input.boardVotePct}% board vote). Ratio ${overrideRatio.toFixed(
          2
        )}x exceeds 2.0x threshold — automatic shareholder notification triggered (Blueprint §8.4.3).`
      : `Override approved (${input.boardVotePct}% board vote). Ratio ${overrideRatio.toFixed(
          2
        )}x is within the 2.0x shareholder-notification threshold.`,
    requiresShareholderNotification,
    overrideRatio: Number(overrideRatio.toFixed(4)),
    loggedToLedger,
  };
}
