// AURIENTA — Predictive Enterprise Genome (Phase 3, ROADMAP-08)
//
// A statistical ML surface that projects enterprise graduation readiness from
// 50+ constitutional attributes (health, fundraising, revenue, governance,
// transparency, runway, etc.). Predictions are NOT guarantees — they are
// informational estimates derived from internal model v1.
//
// Constitutional compliance:
// - No speculation (Rule I-1.3): outputs are descriptive, not prescriptive.
// - Real economy only (Rule I-1.8): attributes come from real ledger /
//   ownership / report rows — never synthetic.
// - No financial advice: the disclaimer is surfaced on every UI that consumes
//   these scores.

import { db } from "@/lib/db";
import type { EnterpriseGenome } from "@prisma/client";

// ── Model versioning ──
// Bump when the heuristic weighting changes so consumers can compare across versions.
export const GENOME_MODEL_VERSION = "genome-v1";

// ── Type: 50+ attribute JSON ──
export type GenomeAttributes = Record<string, number | string | boolean | null>;

export type GenomeComputation = {
  attributes: GenomeAttributes;
  graduationProbability: number; // 0..1
  riskScore: number; // 0..1 (= 1 - graduationProbability)
  modelVersion: string;
  trainedOnCount: number;
};

// ── Stage → progress (0..1) map ──
// stage_1: 0.20, stage_2: 0.45, stage_3: 0.75, stage_4: 0.92, graduated: 1.0
const STAGE_PROGRESS: Record<string, number> = {
  stage_1: 0.2,
  stage_2: 0.45,
  stage_3: 0.75,
  stage_4: 0.92,
  graduated: 1.0,
};

// ── Tier → feeSignal map (lower-tier = higher barrier to graduation) ──
// Used only as a soft prior in the heuristic — not a hard rule.
const TIER_GRADUATION_PRIOR: Record<string, number> = {
  A: 0.85,
  B: 0.75,
  C: 0.65,
  D: 0.55,
  E: 0.45,
  F: 0.35,
};

// ── Helpers ──
function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function pctToFraction(p: number): number {
  return clamp01(p / 100);
}

// ── Main: compute genome from enterprise + related rows ──
export async function computeGenome(
  enterpriseId: string
): Promise<GenomeComputation> {
  // Load enterprise with all dependent rows used for the attribute vector.
  const ent = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    include: {
      quarterlyReports: {
        orderBy: { year: "asc" },
        take: 12,
        select: {
          id: true,
          quarter: true,
          year: true,
          revenueEgp: true,
          cogsEgp: true,
          grossProfitEgp: true,
          opexEgp: true,
          netProfitEgp: true,
          monthlyBurnEgp: true,
          runwayMonths: true,
          grossMarginPct: true,
          revenueGrowthPct: true,
          aiRiskFlag: true,
          aiAssessment: true,
        },
      },
    },
  });

  if (!ent) {
    throw new Error(`Enterprise not found: ${enterpriseId}`);
  }

  // Parallel counts for the genome's "governance / activity" axis.
  const [ledgerEventCount, ownershipRecordCount, proposalCount, reportCount, employeeCount] =
    await Promise.all([
      db.ledgerEvent.count({ where: { enterpriseId } }),
      db.ownershipRecord.count({ where: { enterpriseId } }),
      db.proposal.count({ where: { enterpriseId } }),
      db.quarterlyReport.count({ where: { enterpriseId } }),
      db.employee.count({ where: { enterpriseId } }),
    ]);

  // ── Derived financial signals ──
  const fundraisingGoal = ent.fundraisingGoalEgp;
  const raisedEgp = ent.raisedEgp;
  const fundraisingProgress =
    fundraisingGoal > 0 ? clamp01(raisedEgp / fundraisingGoal) : 0;

  const monthlyBurn = Math.max(0, ent.monthlyBurnEgp);
  const monthlyRevenue = Math.max(0, ent.monthlyRevenueEgp);
  // Runway (months the law-firm-client-account + cash balance can sustain burn).
  const runwayMonths =
    monthlyBurn > 0
      ? Math.min(36, ent.lawFirmClientAccountBalanceEgp / monthlyBurn)
      : 36;
  // Runway factor: 12+ months is "safe" (1.0); 0 months is "critical" (0.0).
  const runwayFactor = clamp01(runwayMonths / 12);

  // Governance maturity — proxy from activity: proposals + ledger events +
  // ownership records. Each adds logarithmic weight so a single noisy event
  // does not dominate.
  const governanceMaturity = clamp01(
    Math.log10(1 + proposalCount) / 2 + // ~2 => 0.5
      Math.log10(1 + ledgerEventCount) / 3 + // ~3 => 0.5
      Math.log10(1 + ownershipRecordCount) / 2 // ~2 => 0.5
  );

  // Transparency — normalized 0..1 (already 0..100 in DB).
  const transparency = pctToFraction(ent.transparencyScore);

  // Health — already 0..100; normalize.
  const healthScore = ent.healthScore; // int 0..100
  const healthFactor = clamp01(healthScore / 100);

  // Revenue growth (already a % in DB).
  const revenueGrowth = pctToFraction(ent.revenueGrowthPct);

  // Gross margin (% in DB).
  const grossMargin = pctToFraction(ent.grossMarginPct);

  // NOSI compliance (%).
  const nosiCompliant = pctToFraction(ent.nosiCompliantPct);

  // Stage progress.
  const stageProgress = STAGE_PROGRESS[ent.stage] ?? 0.2;

  // Tier prior.
  const tierPrior = TIER_GRADUATION_PRIOR[ent.tier] ?? 0.5;

  // Founder equity concentration (lower is generally healthier for governance).
  const founderEquityPct = ent.founderEquityPct;
  const founderEquityDilution = clamp01(1 - founderEquityPct / 100);

  // Consulting opt-out (sign of independence).
  const consultingOptOut = ent.consultingOptOut;

  // Police clearance (binary compliance gate).
  const policeClearanceValid = ent.policeClearanceValid;

  // ── 50+ attribute JSON ──
  const attributes: GenomeAttributes = {
    // Identity
    enterpriseId: ent.id,
    enterpriseName: ent.name,
    enterpriseSlug: ent.slug,
    sector: ent.sector,
    tier: ent.tier,
    stage: ent.stage,
    legalForm: ent.legalForm,
    status: ent.status,
    stageProgress,

    // Founder & structure
    founderEquityPct,
    platformFeePct: ent.platformFeePct,
    consultingFeePct: ent.consultingFeePct,
    consultingOptOut,
    founderEquityDilution,

    // Health
    healthScore,
    healthRating: ent.healthRating ?? "—",
    healthFactor,
    nosiCompliantPct: ent.nosiCompliantPct,
    nosiCompliant,
    policeClearanceValid,
    transparencyScore: ent.transparencyScore,
    transparency,

    // Fundraising
    fundraisingGoalEgp: fundraisingGoal,
    raisedEgp,
    fundraisingProgress,
    minInvestmentEgp: ent.minInvestmentEgp,
    investorCap: ent.investorCap,
    equityUnitPriceEgp: ent.equityUnitPriceEgp,
    totalEquityUnits: ent.totalEquityUnits,

    // Financials
    monthlyRevenueEgp: monthlyRevenue,
    monthlyBurnEgp: monthlyBurn,
    runwayMonths: Math.round(runwayMonths * 10) / 10,
    runwayFactor,
    grossMarginPct: ent.grossMarginPct,
    grossMargin,
    revenueGrowthPct: ent.revenueGrowthPct,
    revenueGrowth,
    lawFirmClientAccountBalanceEgp: ent.lawFirmClientAccountBalanceEgp,

    // Workforce
    employeeCount: ent.employeeCount,
    employeeCountDirect: employeeCount,

    // Governance / activity
    ledgerEventCount,
    ownershipRecordCount,
    proposalCount,
    reportCount,
    governanceMaturity,
    graduationReadiness: ent.graduationReadiness,

    // Reports (most recent quarter)
    lastReportQuarter: ent.quarterlyReports.at(-1)?.quarter ?? null,
    lastReportYear: ent.quarterlyReports.at(-1)?.year ?? null,
    lastReportNetProfitEgp: ent.quarterlyReports.at(-1)?.netProfitEgp ?? 0,
    lastReportRunwayMonths: ent.quarterlyReports.at(-1)?.runwayMonths ?? 0,
    lastReportGrossMarginPct: ent.quarterlyReports.at(-1)?.grossMarginPct ?? 0,
    lastReportRevenueGrowthPct:
      ent.quarterlyReports.at(-1)?.revenueGrowthPct ?? 0,
    profitableQuartersCount: ent.quarterlyReports.filter(
      (q) => q.netProfitEgp > 0
    ).length,
    totalQuartersReported: ent.quarterlyReports.length,

    // Profile richness (institutional due diligence surface)
    hasWebsite: !!ent.website,
    hasMission: !!ent.mission,
    hasVision: !!ent.vision,
    hasProblemStatement: !!ent.problem,
    hasSolutionStatement: !!ent.solution,
    hasRevenueModel: !!ent.revenueModel,
    hasTargetMarket: !!ent.targetMarket,
    hasPitchDeck: !!ent.pitchDeckUrl,
    hasFounderBio: !!ent.founderBio,
    hasFounderVideo: !!ent.founderVideoUrl,
    evidenceLevel: ent.evidenceLevel,
    submissionStatus: ent.submissionStatus,
    profileRichness: [
      !!ent.website,
      !!ent.mission,
      !!ent.vision,
      !!ent.problem,
      !!ent.solution,
      !!ent.revenueModel,
      !!ent.targetMarket,
      !!ent.pitchDeckUrl,
      !!ent.founderBio,
      !!ent.founderVideoUrl,
    ].filter(Boolean).length / 10,

    // Tier prior (soft signal — informational only)
    tierPrior,

    // Lifecycle timestamps (epoch ms) — used for drift analysis downstream
    createdAt: ent.createdAt.getTime(),
    stageSince: ent.stageSince.getTime(),
    frozenAt: ent.frozenAt?.getTime() ?? null,
    archivedAt: ent.archivedAt?.getTime() ?? null,
  };

  // ── Heuristic graduation probability ──
  // Weighted blend of the six constitutional pillars:
  //   health          30%
  //   fundraising     20%
  //   revenue growth  15%
  //   governance      15%
  //   transparency    10%
  //   runway factor   10%
  // Plus a small prior tilt (max ±0.05) from tier + stage progress +
  // consulting-opt-out (signals of maturity).
  const base =
    healthFactor * 0.3 +
    fundraisingProgress * 0.2 +
    revenueGrowth * 0.15 +
    governanceMaturity * 0.15 +
    transparency * 0.1 +
    runwayFactor * 0.1;

  const priorAdjust =
    (stageProgress - 0.5) * 0.04 +
    (tierPrior - 0.5) * 0.04 +
    (consultingOptOut ? 0.02 : 0);

  const graduationProbability = clamp01(base + priorAdjust);
  const riskScore = clamp01(1 - graduationProbability);

  // Trained-on count: how many rows of evidence the prediction was derived
  // from (a rough proxy for confidence; the more data, the more reliable
  // the statistical estimate — though it remains an estimate, not a guarantee).
  const trainedOnCount =
    ledgerEventCount +
    ownershipRecordCount +
    proposalCount +
    reportCount +
    ent.quarterlyReports.length +
    (ent.healthScoreUpdatedAt ? 1 : 0);

  return {
    attributes,
    graduationProbability,
    riskScore,
    modelVersion: GENOME_MODEL_VERSION,
    trainedOnCount,
  };
}

// ── Upsert ──
export async function upsertGenome(
  enterpriseId: string
): Promise<EnterpriseGenome> {
  const computation = await computeGenome(enterpriseId);
  return db.enterpriseGenome.upsert({
    where: { enterpriseId },
    create: {
      enterpriseId,
      attributesJson: JSON.stringify(computation.attributes),
      graduationProbability: computation.graduationProbability,
      riskScore: computation.riskScore,
      modelVersion: computation.modelVersion,
      trainedOnCount: computation.trainedOnCount,
      predictedAt: new Date(),
    },
    update: {
      attributesJson: JSON.stringify(computation.attributes),
      graduationProbability: computation.graduationProbability,
      riskScore: computation.riskScore,
      modelVersion: computation.modelVersion,
      trainedOnCount: computation.trainedOnCount,
      predictedAt: new Date(),
    },
  });
}

// ── Read ──
export async function getGenome(
  enterpriseId: string
): Promise<EnterpriseGenome | null> {
  return db.enterpriseGenome.findUnique({ where: { enterpriseId } });
}

// ── Top performers by graduation probability ──
export async function listTopGenomes(
  limit = 12
): Promise<Array<EnterpriseGenome & { enterpriseName: string; enterpriseSlug: string; tier: string; stage: string; healthRating: string | null }>> {
  const genomes = await db.enterpriseGenome.findMany({
    orderBy: { graduationProbability: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
  });

  if (genomes.length === 0) return [];

  // Hydrate enterprise names (the genome row only stores enterpriseId).
  const enterprises = await db.enterprise.findMany({
    where: { id: { in: genomes.map((g) => g.enterpriseId) } },
    select: { id: true, name: true, slug: true, tier: true, stage: true, healthRating: true },
  });
  type EntRow = { id: string; name: string; slug: string; tier: string; stage: string; healthRating: string | null };
  const entById = new Map<string, EntRow>(
    enterprises.map((e) => [e.id, e] as const)
  );

  return genomes
    .map((g) => {
      const ent = entById.get(g.enterpriseId);
      if (!ent) return null;
      return {
        ...g,
        enterpriseName: ent.name,
        enterpriseSlug: ent.slug,
        tier: ent.tier,
        stage: ent.stage,
        healthRating: ent.healthRating,
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);
}
