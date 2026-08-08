// AURIENTA Constitutional Project Evaluation Engine — REAL AI feasibility assessment.
// Implements blueprint §4.1.1: 7-stage pipeline, Feasibility Score 0-100, ≥35 to pass.
// Uses the AURIENTA Brain AI (5-provider consensus) via askConstitutionalAI.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { parseBody } from "@/lib/aurienta/validation";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import { askConstitutionalAI } from "@/lib/aurienta/ai";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIER_CAPS: Record<string, number> = {
  A: 3_000_000,
  B: 25_000_000,
  E: 5_000_000,
};

const SECTOR_PE: Record<string, number> = {
  agriculture: 8,
  manufacturing: 12,
  tourism: 9,
  technology: 22,
  retail: 10,
  logistics: 14,
  food: 11,
};

const feasibilitySchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().min(20).max(12000),
  sector: z.string().min(1).max(40),
  tier: z.enum(["A", "B", "C", "D", "E", "F"]),
  fundraisingGoalEgp: z.number().int().min(50_000).max(500_000_000),
  equityUnitPriceEgp: z.number().int().min(1).max(100_000),
  monthlyExpensesEgp: z.number().int().min(0).max(50_000_000).optional(),
  contingencyPct: z.number().min(0).max(100).optional(),
  projectedYear1RevenueEgp: z.number().int().min(0).max(500_000_000).optional(),
  projectedYear3RevenueEgp: z.number().int().min(0).max(1_000_000_000).optional(),
  feasibilityStudyText: z.string().max(50000).optional(),
  pitchDeckText: z.string().max(50000).optional(),
  pitchVideoTranscript: z.string().max(50000).optional(),
  founderExperienceYears: z.number().int().min(0).max(60).optional(),
  founderBackground: z.string().max(5000).optional(),
  tierDYearsInMarket: z.number().int().min(0).max(100).optional(),
  tierDAnnualRevenueEgp: z.number().int().min(0).max(500_000_000).optional(),
  tierDNetProfitEgp: z.number().int().max(500_000_000).optional(),
  tierDTotalAssetsEgp: z.number().int().min(0).max(500_000_000).optional(),
  tierDDebtToEquity: z.number().min(0).max(10).optional(),
});

type StageResult = {
  name: string;
  status: "PASS" | "FAIL" | "CLEAN" | "FLAG" | number;
  score?: number;
  detail: string;
};

type FeasibilityReport = {
  evaluationId: string;
  feasibilityScore: number;
  tierDViabilityScore: number | null;
  rawMandatoryScore: number;
  optionalBonus: number;
  sanityAdjustment: number;
  passed: boolean;
  stepBreakdown: Record<string, StageResult>;
  aiJustifications: Record<string, string>;
  redFlags: string[];
  recommendations: string[];
  remediationPlan?: string[];
  timestamp: string;
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rlHit = limiters.ai(user.id);
  if (!rlHit.allowed) return rateLimitedResponse(rlHit.resetAt);

  const body = await parseBody(req, feasibilitySchema);
  if (body instanceof NextResponse) return body;

  const evaluationId = `eval_${Date.now().toString(36)}_${user.id.slice(-6)}`;
  const report: FeasibilityReport = {
    evaluationId,
    feasibilityScore: 0,
    tierDViabilityScore: null,
    rawMandatoryScore: 0,
    optionalBonus: 0,
    sanityAdjustment: 0,
    passed: false,
    stepBreakdown: {},
    aiJustifications: {},
    redFlags: [],
    recommendations: [],
    timestamp: new Date().toISOString(),
  };

  // ── STEP 1: Business Type & Tier Validation (rule-based) ──
  const sectorPe = SECTOR_PE[body.sector] ?? null;
  const tierCap = TIER_CAPS[body.tier];
  if (!sectorPe) {
    report.stepBreakdown.step1_tier_validation = {
      name: "Business Type & Tier Validation",
      status: "FAIL",
      detail: `Sector "${body.sector}" not recognised.`,
    };
    report.redFlags.push("Unrecognised sector");
    return finalizeReport(report, user.id);
  }
  if (tierCap && body.fundraisingGoalEgp > tierCap) {
    report.stepBreakdown.step1_tier_validation = {
      name: "Business Type & Tier Validation",
      status: "FAIL",
      detail: `Tier ${body.tier} cap is ${tierCap.toLocaleString()} EGP; Capital Formation goal is ${body.fundraisingGoalEgp.toLocaleString()} EGP.`,
    };
    report.redFlags.push(`Goal exceeds Tier ${body.tier} cap`);
    return finalizeReport(report, user.id);
  }
  if (body.tier === "D" && (body.tierDYearsInMarket ?? 0) < 2) {
    report.stepBreakdown.step1_tier_validation = {
      name: "Business Type & Tier Validation",
      status: "FAIL",
      detail: `Tier D requires ≥2 years in market. Found ${body.tierDYearsInMarket ?? 0} years.`,
    };
    report.redFlags.push("Tier D in-market < 2 years — downgrade to Tier C");
    return finalizeReport(report, user.id);
  }
  report.stepBreakdown.step1_tier_validation = {
    name: "Business Type & Tier Validation",
    status: "PASS",
    detail: `Sector ${body.sector} (P/E ${sectorPe}x). Tier ${body.tier} eligible. Goal within cap.`,
  };

  // ── STEP 2: 1-Year Expense Feasibility (AI) ──
  const monthlyExpenses = body.monthlyExpensesEgp ?? Math.round(body.fundraisingGoalEgp / 12);
  const contingencyPct = body.contingencyPct ?? 0;
  const runwayMonths = monthlyExpenses > 0 ? Math.floor(body.fundraisingGoalEgp / monthlyExpenses) : 99;
  const contingencyFlag = contingencyPct < 5;

  const step2Context = `ENTERPRISE: ${body.name}
Sector: ${body.sector} (Tier ${body.tier})
Capital Formation goal: ${body.fundraisingGoalEgp.toLocaleString()} EGP
Monthly expenses (projected): ${monthlyExpenses.toLocaleString()} EGP
Contingency: ${contingencyPct}%
Runway (zero-revenue): ${runwayMonths} months
Description: ${body.description}`;

  const step2Ai = await askConstitutionalAI({
    systemPrompt: `You are the AURIENTA Constitutional Project Evaluation Engine — Step 2: Expense Feasibility.
Evaluate the enterprise's 1-year expense projection for reasonableness, runway (≥12 months minimum), and red flags (missing contingency <5%, unrealistic salaries).
Output a JSON object: {"score": 0-100, "justification": "one paragraph", "redFlags": ["array of strings"]}.
Score 70+ = strong; 50-69 = acceptable; 35-49 = marginal; <35 = reject.`,
    userMessage: "Evaluate this enterprise's expense feasibility. Return ONLY a JSON object, no other text.",
    userContext: step2Context,
    persist: false,
  });

  const step2 = parseJsonResponse(step2Ai.content, { score: 60, justification: step2Ai.content.slice(0, 300), redFlags: [] as string[] });
  if (runwayMonths < 12) {
    step2.score = Math.min(step2.score, 34);
    step2.redFlags.push(`Runway ${runwayMonths} months < 12-month minimum — auto-reject`);
    report.redFlags.push(`Runway ${runwayMonths} months < 12 months`);
  }
  if (contingencyFlag) {
    step2.redFlags.push("Contingency < 5% — missing critical buffer");
    report.redFlags.push("Contingency < 5%");
  }
  report.stepBreakdown.step2_expense_feasibility = {
    name: "1-Year Expense Feasibility",
    status: step2.score >= 35 ? "PASS" : "FAIL",
    score: step2.score,
    detail: step2.justification,
  };
  report.aiJustifications.step2 = step2.justification;
  report.redFlags.push(...step2.redFlags);

  // ── STEP 3: Financial Consistency Check (rule-based + AI) ──
  const y1Rev = body.projectedYear1RevenueEgp ?? body.fundraisingGoalEgp;
  const y3Rev = body.projectedYear3RevenueEgp ?? y1Rev * 2;
  const growthRate = y1Rev > 0 ? ((y3Rev - y1Rev) / y1Rev) * 100 : 0;
  const growthFlag = growthRate > 200;

  const step3Context = `Year 1 revenue projection: ${y1Rev.toLocaleString()} EGP
Year 3 revenue projection: ${y3Rev.toLocaleString()} EGP
Implied YoY growth: ${growthRate.toFixed(1)}%`;

  const step3Ai = await askConstitutionalAI({
    systemPrompt: `You are the AURIENTA Project Evaluation Engine — Step 3: Financial Consistency.
Check the 3-year financial projections for mathematical consistency, growth realism (growth >200% YoY triggers sanity flag), and margin benchmarking.
Output JSON: {"score": 0-100, "justification": "one paragraph", "flags": ["array"]}.`,
    userMessage: "Evaluate financial consistency. Return ONLY a JSON object.",
    userContext: step3Context,
    persist: false,
  });

  const step3 = parseJsonResponse(step3Ai.content, { score: 70, justification: step3Ai.content.slice(0, 300), flags: [] as string[] });
  if (growthFlag) {
    step3.score = Math.min(step3.score, 50);
    step3.flags.push(`Growth ${growthRate.toFixed(0)}% > 200% — sanity flag`);
    report.redFlags.push("Unrealistic growth projection");
  }
  report.stepBreakdown.step3_financial_consistency = {
    name: "Financial Consistency Check",
    status: step3.score >= 35 ? "PASS" : "FLAG",
    score: step3.score,
    detail: step3.justification,
  };
  report.aiJustifications.step3 = step3.justification;

  // ── STEP 4: Founder Credibility (AI) ──
  const step4Context = `FOUNDER: ${user.legalName}
Sovereign Trust Score: ${user.sovereignTrustScore}/100 (${user.tier})
Verification level: ${user.verificationLevel}
Experience: ${body.founderExperienceYears ?? "not specified"} years
Background: ${body.founderBackground ?? "not provided"}
Primary intent: ${user.primaryIntent ?? "—"}`;

  const step4Ai = await askConstitutionalAI({
    systemPrompt: `You are the AURIENTA Project Evaluation Engine — Step 4: Founder Credibility.
Assess founder credibility based on experience, Sovereign Trust Score (90+ Pillar, 65+ Trusted, <50 Emerging), verification level, and red flags.
Output JSON: {"score": 0-100, "justification": "one paragraph"}.`,
    userMessage: "Assess founder credibility. Return ONLY a JSON object.",
    userContext: step4Context,
    persist: false,
  });

  const step4 = parseJsonResponse(step4Ai.content, { score: user.sovereignTrustScore, justification: step4Ai.content.slice(0, 300) });
  report.stepBreakdown.step4_founder_credibility = {
    name: "Founder Credibility",
    status: step4.score >= 35 ? "PASS" : "FLAG",
    score: step4.score,
    detail: step4.justification,
  };
  report.aiJustifications.step4 = step4.justification;

  // ── STEP 5: Fraud & Duplicate Detection ──
  const existingProposals = await db.enterprise.count({
    where: { founderId: user.id, status: { in: ["active", "fundraising_active", "graduation_pending"] } },
  });
  const dupFlag = existingProposals >= 3;
  const step5Context = `Founder active enterprises: ${existingProposals}
Business plan excerpt: ${body.description.slice(0, 500)}`;

  const step5Ai = await askConstitutionalAI({
    systemPrompt: `You are the AURIENTA Project Evaluation Engine — Step 5: Fraud & Duplicate Detection.
Check for text similarity to known templates, contradictions, and pattern matching against fraudulent proposals.
Output JSON: {"status": "CLEAN" or "FLAG", "justification": "one paragraph", "flags": ["array"]}.`,
    userMessage: "Scan for fraud indicators. Return ONLY a JSON object.",
    userContext: step5Context,
    persist: false,
  });

  const step5 = parseJsonResponse(step5Ai.content, { status: "CLEAN", justification: step5Ai.content.slice(0, 300), flags: [] as string[] });
  if (dupFlag) {
    step5.status = "FLAG";
    step5.flags.push(`Founder already operates ${existingProposals} active enterprises — concentration risk`);
    report.redFlags.push("Founder over-concentrated");
  }
  report.stepBreakdown.step5_fraud_detection = {
    name: "Fraud & Duplicate Detection",
    status: step5.status as "CLEAN" | "FLAG",
    detail: step5.justification,
  };
  report.aiJustifications.step5 = step5.justification;

  // ── STEP 6: Optional Material Scoring (AI) ──
  const optionalScores: Record<string, { score: number; bonus: number; justification: string }> = {};
  let totalBonus = 0;

  if (body.feasibilityStudyText) {
    const r = await scoreOptionalMaterial("feasibility study", body.feasibilityStudyText, "Depth of market research, risk analysis, regulatory assessment, sensitivity analysis, scenario planning.", 10);
    optionalScores.feasibility_study = r;
    totalBonus += r.bonus;
  }
  if (body.pitchDeckText) {
    const r = await scoreOptionalMaterial("pitch deck", body.pitchDeckText, "Clarity of business model, market opportunity, competitive advantage, team credibility, financial realism, visual design.", 8);
    optionalScores.pitch_deck = r;
    totalBonus += r.bonus;
  }
  if (body.pitchVideoTranscript) {
    const r = await scoreOptionalMaterial("pitch video", body.pitchVideoTranscript, "Founder confidence, communication clarity, production quality, authenticity, ability to articulate value proposition.", 7);
    optionalScores.pitch_video = r;
    totalBonus += r.bonus;
  }
  totalBonus = Math.min(totalBonus, 25);

  report.optionalBonus = Math.round(totalBonus * 10) / 10;
  report.stepBreakdown.step6_optional_materials = {
    name: "Optional Material Scoring",
    status: Object.keys(optionalScores).length > 0 ? "PASS" : "CLEAN",
    score: report.optionalBonus,
    detail: Object.entries(optionalScores).length > 0
      ? Object.entries(optionalScores).map(([k, v]) => `${k}: ${v.score}/100 → +${v.bonus}`).join("; ")
      : "No optional materials uploaded (no penalty)",
  };

  // ── STEP 7: Sanity Check & Final Score (AI) ──
  const rawMandatory = Math.round((step2.score + step3.score + step4.score) / 3);

  const step7Context = `RAW MANDATORY SCORE: ${rawMandatory}/100
Step 2 (Expense): ${step2.score}
Step 3 (Financial): ${step3.score}
Step 4 (Founder): ${step4.score}
Step 5 (Fraud): ${step5.status}
Step 6 (Optional bonus): +${report.optionalBonus}
Red flags: ${report.redFlags.length > 0 ? report.redFlags.join("; ") : "none"}`;

  const step7Ai = await askConstitutionalAI({
    systemPrompt: `You are the AURIENTA Project Evaluation Engine — Step 7: Sanity Check (Mixtral equivalent).
Review all preceding steps. You may adjust the raw score by up to ±10 points with a full written explanation.
Output JSON: {"adjustment": -10 to +10, "justification": "one paragraph", "recommendations": ["array of actionable strings"]}.`,
    userMessage: "Perform the sanity check. Return ONLY a JSON object.",
    userContext: step7Context,
    persist: false,
  });

  const step7 = parseJsonResponse(step7Ai.content, { adjustment: 0, justification: step7Ai.content.slice(0, 300), recommendations: [] as string[] });
  report.sanityAdjustment = Math.max(-10, Math.min(10, Number(step7.adjustment) || 0));
  report.recommendations = step7.recommendations ?? [];

  const adjustedRaw = Math.max(0, Math.min(100, rawMandatory + report.sanityAdjustment));
  report.rawMandatoryScore = adjustedRaw;
  report.feasibilityScore = Math.min(100, Math.round((adjustedRaw + report.optionalBonus) * 10) / 10);
  report.passed = report.feasibilityScore >= 35;
  report.stepBreakdown.step7_sanity_check = {
    name: "Sanity Check & Final Score",
    status: "PASS",
    score: report.feasibilityScore,
    detail: `Adjustment ${report.sanityAdjustment >= 0 ? "+" : ""}${report.sanityAdjustment}. ${step7.justification}`,
  };
  report.aiJustifications.step7 = step7.justification;

  // ── Tier D Viability Score (if applicable) ──
  if (body.tier === "D" && body.tierDYearsInMarket) {
    const viabilityContext = `Tier D Historical Data:
Years in market: ${body.tierDYearsInMarket}
Annual revenue: ${(body.tierDAnnualRevenueEgp ?? 0).toLocaleString()} EGP
Net profit: ${(body.tierDNetProfitEgp ?? 0).toLocaleString()} EGP
Total assets: ${(body.tierDTotalAssetsEgp ?? 0).toLocaleString()} EGP
Debt-to-equity: ${body.tierDDebtToEquity ?? "—"}`;

    const vdAi = await askConstitutionalAI({
      systemPrompt: `You are the AURIENTA Project Evaluation Engine — Tier D Viability Score.
Assess the existing company's historical financial health. Score 0-100.
If Viability Score <40, the project is auto-rejected even if Feasibility Score ≥35.
Output JSON: {"score": 0-100, "justification": "one paragraph"}.`,
      userMessage: "Assess Tier D viability. Return ONLY a JSON object.",
      userContext: viabilityContext,
      persist: false,
    });

    const vd = parseJsonResponse(vdAi.content, { score: 70, justification: vdAi.content.slice(0, 300) });
    report.tierDViabilityScore = vd.score;
    if (vd.score < 40) {
      report.passed = false;
      report.redFlags.push(`Tier D Viability Score ${vd.score} < 40 — auto-reject`);
    }
  }

  // ── Remediation plan (if rejected) ──
  if (!report.passed) {
    report.remediationPlan = generateRemediationPlan(report);
  }

  return finalizeReport(report, user.id);
}

async function scoreOptionalMaterial(
  materialName: string,
  content: string,
  criteria: string,
  maxBonus: number
): Promise<{ score: number; bonus: number; justification: string }> {
  const ai = await askConstitutionalAI({
    systemPrompt: `You are the AURIENTA Project Evaluation Engine — Optional Material Scoring.
Evaluate this ${materialName} on a 0-100 scale based on: ${criteria}
Output JSON: {"score": 0-100, "justification": "one paragraph"}.`,
    userMessage: `Score this ${materialName}. Return ONLY a JSON object.`,
    userContext: content.slice(0, 8000),
    persist: false,
  });
  const parsed = parseJsonResponse(ai.content, { score: 70, justification: ai.content.slice(0, 300) });
  const bonus = Math.round((parsed.score / 100) * maxBonus * 10) / 10;
  return { score: parsed.score, bonus, justification: parsed.justification };
}

function parseJsonResponse<T>(content: string, fallback: T): T {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return fallback;
  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return fallback;
  }
}

function generateRemediationPlan(report: FeasibilityReport): string[] {
  const plan: string[] = [];
  if (report.redFlags.some((f) => f.includes("Runway"))) {
    plan.push("Reduce monthly expenses by 20-30% or increase Capital Formation goal to achieve ≥12 months runway");
  }
  if (report.redFlags.some((f) => f.includes("Contingency"))) {
    plan.push("Add a contingency line item of at least 5% of total expenses");
  }
  if (report.redFlags.some((f) => f.includes("growth"))) {
    plan.push("Revise revenue projections to realistic sector-normal growth (≤100% YoY for early stage)");
  }
  if (report.redFlags.some((f) => f.includes("Tier D"))) {
    plan.push("Improve financial health: reduce debt, register employees with NOSI, obtain tax clearance");
  }
  if (report.optionalBonus < 10) {
    plan.push("Upload optional materials (feasibility study, pitch deck) to increase score by up to +25 points");
  }
  plan.push("Resubmit after 30-day cooling period per constitutional rule §4.1.1.5");
  return plan;
}

async function finalizeReport(report: FeasibilityReport, userId: string) {
  const artifact = await db.aiArtifact.create({
    data: {
      kind: "feasibility_evaluation",
      userId,
      content: JSON.stringify(report),
      confidence: report.feasibilityScore / 100,
      payload: JSON.stringify({
        evaluationId: report.evaluationId,
        systemPrompt: "AURIENTA Constitutional Project Evaluation Engine §4.1.1",
        userMessage: "7-stage feasibility pipeline",
        modelVersion: "zai-constitutional-ai",
        feasibilityScore: report.feasibilityScore,
        passed: report.passed,
      }),
    },
  });

  await db.$transaction(async (tx) => {
    await appendLedgerEvent(tx, {
      eventType: "cre_decision",
      payload: {
        evaluationId: report.evaluationId,
        feasibilityScore: report.feasibilityScore,
        passed: report.passed,
        artifactId: artifact.id,
      },
      actorId: userId,
    });
  });

  await audit({
    actorId: userId,
    action: "ai.feasibility",
    target: `evaluation:${report.evaluationId}`,
    result: "allowed",
    metadata: { score: report.feasibilityScore, passed: report.passed },
  });

  return NextResponse.json({ ok: true, report, artifactId: artifact.id });
}
