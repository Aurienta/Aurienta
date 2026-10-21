// AURIENTA — REC-5: Constitutional Wages (salary transparency bands)
//
// Constitutional wage bands are the public, AI-generated salary ranges an
// enterprise pays for each role (founding_operator, manager, employee,
// board_member). They are derived from the same salary engine that powers
// the AI Salary Engine (/dashboard/salary) but persisted as banded ranges
// so partners can see — at a glance — what each role earns without
// exposing individual compensation figures.
//
// Constitutional invariants honoured here:
//   - Transparency (Vol 8 §8.6.2) — once `publishWageBands` is called,
//     the bands become public (publishedAt != null). Unpublished bands
//     are private to the enterprise.
//   - Constitutional Wage Floor (§8.4) — every band must clear the
//     national minimum wage (4000 EGP/month, 2026) and respect
//     min < median < max. Enforced by `enforceConstitutionalWageBand`.
//   - Sector benchmark comparison — partners can compare an enterprise's
//     bands against the published median wage by role across all
//     enterprises in the same sector (getSectorBenchmarks).

import { db } from "@/lib/db";
import type { PrismaTransaction } from "@/lib/db";
import { enforceConstitutionalWageBand } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import {
  TIER_MULTIPLIERS,
  REGIONAL_ADJUSTMENTS,
  MARKET_RATES,
  MINIMUM_WAGE_EGP,
  SALARY_ROUNDING_EGP,
} from "@/lib/aurienta/salary-engine";

// ── Types ──────────────────────────────────────────────────────────────────

export type WageRole =
  | "founding_operator"
  | "manager"
  | "employee"
  | "board_member";

export const WAGE_ROLES: WageRole[] = [
  "founding_operator",
  "manager",
  "employee",
  "board_member",
];

export type WageBand = {
  id: string;
  enterpriseId: string;
  role: string;
  tier: string;
  sector: string;
  minSalaryEgp: number;
  medianSalaryEgp: number;
  maxSalaryEgp: number;
  regionalAdjustment: number;
  aiGenerated: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SectorBenchmark = {
  sector: string;
  role: string;
  enterpriseCount: number;
  medianOfMedians: number;
  minMedian: number;
  maxMedian: number;
};

// ── Constants ──────────────────────────────────────────────────────────────

/**
 * Mapping from the 4 constitutional wage roles to the AI Salary Engine's
 * market-rate position keys. The salary engine has a richer position set
 * (software_engineer, accountant, etc.) — we map the 4 constitutional
 * role buckets to representative positions for AI band generation.
 */
const ROLE_TO_MARKET_POSITION: Record<WageRole, string> = {
  founding_operator: "chief_executive_officer",
  manager: "operations_manager",
  employee: "other",
  board_member: "consultant",
};

/**
 * Band spread: min = median × 0.85, max = median × 1.30 (rounded to nearest 100).
 * This mirrors the salary engine's COMPENSATION_BAND_UPPER_FACTOR (1.3) and
 * adds a symmetric lower bound (0.85 = -15% below median).
 */
const BAND_LOWER_FACTOR = 0.85;
const BAND_UPPER_FACTOR = 1.30;

// ── Helpers ────────────────────────────────────────────────────────────────

function roundToHundred(n: number): number {
  return Math.round(n / SALARY_ROUNDING_EGP) * SALARY_ROUNDING_EGP;
}

function toExternal(r: {
  id: string;
  enterpriseId: string;
  role: string;
  tier: string;
  sector: string;
  minSalaryEgp: number;
  medianSalaryEgp: number;
  maxSalaryEgp: number;
  regionalAdjustment: number;
  aiGenerated: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): WageBand {
  return {
    id: r.id,
    enterpriseId: r.enterpriseId,
    role: r.role,
    tier: r.tier,
    sector: r.sector,
    minSalaryEgp: r.minSalaryEgp,
    medianSalaryEgp: r.medianSalaryEgp,
    maxSalaryEgp: r.maxSalaryEgp,
    regionalAdjustment: r.regionalAdjustment,
    aiGenerated: r.aiGenerated,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * AI-generate the 4 constitutional wage bands for an enterprise. Uses the
 * salary engine's market-rate table + the enterprise's tier multiplier +
 * the Cairo regional adjustment (1.0). The bands are:
 *
 *   median = market_base × tier_multiplier × regional_adjustment
 *   min    = median × 0.85  (≥ national minimum wage)
 *   max    = median × 1.30
 *
 * Each band is validated by `enforceConstitutionalWageBand` BEFORE the row
 * is written. Denials are audit-logged and surfaced as thrown Errors.
 *
 * If bands already exist for this enterprise, they are REPLACED (deleted +
 * recreated) — the AI generation is idempotent and reflects the latest
 * tier/sector assignment. Unpublished legacy bands are discarded.
 */
export async function generateWageBands(
  enterpriseId: string
): Promise<WageBand[]> {
  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { id: true, name: true, tier: true, sector: true },
  });
  if (!enterprise) throw new Error("enterprise_not_found");

  const tierKey = enterprise.tier.toUpperCase();
  const tierMultiplier = TIER_MULTIPLIERS[tierKey] ?? 1.0;
  const regionalAdjustment = REGIONAL_ADJUSTMENTS.cairo; // 1.0 default

  const bands: Array<{
    role: WageRole;
    min: number;
    median: number;
    max: number;
  }> = [];

  for (const role of WAGE_ROLES) {
    const positionKey = ROLE_TO_MARKET_POSITION[role];
    const baseEgp = MARKET_RATES[positionKey] ?? MARKET_RATES.other;

    const medianRaw = baseEgp * tierMultiplier * regionalAdjustment;
    const median = Math.max(roundToHundred(medianRaw), MINIMUM_WAGE_EGP);
    const min = Math.max(roundToHundred(median * BAND_LOWER_FACTOR), MINIMUM_WAGE_EGP);
    const max = roundToHundred(median * BAND_UPPER_FACTOR);

    // The CRE requires min < median < max. If rounding collapses them,
    // widen the spread by SALARY_ROUNDING_EGP on either side.
    const safeMin = min < median ? min : Math.max(min - SALARY_ROUNDING_EGP, MINIMUM_WAGE_EGP);
    const safeMax = max > median ? max : max + SALARY_ROUNDING_EGP;

    const verdict = enforceConstitutionalWageBand({
      enterpriseId,
      role,
      tier: tierKey,
      minSalaryEgp: safeMin,
      medianSalaryEgp: median,
      maxSalaryEgp: safeMax,
      nationalMinimumWage: MINIMUM_WAGE_EGP,
    });
    if (!verdict.allowed) {
      await audit({
        actorId: "system",
        action: "wage_band.generate",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: verdict.reason,
        metadata: { role, tier: tierKey, min: safeMin, median, max: safeMax },
      });
      throw new Error(verdict.reason ?? `Wage band for role ${role} denied by CRE`);
    }

    bands.push({ role, min: safeMin, median, max: safeMax });
  }

  // Replace any prior bands for this enterprise (idempotent AI regeneration).
  const created = await db.$transaction(async (tx: PrismaTransaction) => {
    await tx.constitutionalWageBand.deleteMany({
      where: { enterpriseId },
    });

    const rows = await Promise.all(
      bands.map((b) =>
        tx.constitutionalWageBand.create({
          data: {
            enterpriseId,
            role: b.role,
            tier: tierKey,
            sector: enterprise.sector,
            minSalaryEgp: b.min,
            medianSalaryEgp: b.median,
            maxSalaryEgp: b.max,
            regionalAdjustment,
            aiGenerated: true,
          },
        })
      )
    );
    return rows;
  });

  await audit({
    actorId: "system",
    action: "wage_band.generate",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      enterpriseName: enterprise.name,
      tier: tierKey,
      sector: enterprise.sector,
      roles: bands.map((b) => `${b.role}=${b.median}`),
    },
  });

  logger.info("wage_band.generated", {
    enterpriseId,
    tier: tierKey,
    sector: enterprise.sector,
    count: created.length,
  });

  return created.map(toExternal);
}

/**
 * Publish all wage bands for an enterprise (set publishedAt=now). After
 * this call the bands are PUBLIC — visible to any partner viewing the
 * enterprise's wage transparency page, and aggregated into sector
 * benchmarks.
 */
export async function publishWageBands(
  enterpriseId: string
): Promise<WageBand[]> {
  const existing = await db.constitutionalWageBand.findMany({
    where: { enterpriseId },
  });
  if (existing.length === 0) {
    throw new Error("No wage bands to publish — generate them first");
  }

  await db.constitutionalWageBand.updateMany({
    where: { enterpriseId, publishedAt: null },
    data: { publishedAt: new Date() },
  });

  const updated = await db.constitutionalWageBand.findMany({
    where: { enterpriseId },
    orderBy: { role: "asc" },
  });

  await audit({
    actorId: "system",
    action: "wage_band.publish",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      count: updated.length,
      publishedCount: updated.filter((b) => b.publishedAt).length,
    },
  });

  logger.info("wage_band.published", {
    enterpriseId,
    count: updated.length,
  });

  return updated.map(toExternal);
}

/**
 * Get the wage bands for an enterprise. By default returns ONLY published
 * bands (the constitutional transparency view). Pass `includeUnpublished=true`
 * to also return draft / private bands (used by the enterprise's own
 * manager console).
 */
export async function getWageBands(
  enterpriseId: string,
  opts: { includeUnpublished?: boolean } = {}
): Promise<WageBand[]> {
  const rows = await db.constitutionalWageBand.findMany({
    where: opts.includeUnpublished
      ? { enterpriseId }
      : { enterpriseId, publishedAt: { not: null } },
    orderBy: { role: "asc" },
  });
  return rows.map(toExternal);
}

/**
 * Sector benchmarks — for each role, return the median-of-medians across
 * all PUBLISHED wage bands in the given sector. This is the constitutional
 * sector-comparison view: partners can see how an enterprise's pay
 * compares to its peers.
 */
export async function getSectorBenchmarks(
  sector: string
): Promise<SectorBenchmark[]> {
  const rows = await db.constitutionalWageBand.findMany({
    where: { sector, publishedAt: { not: null } },
    select: { role: true, medianSalaryEgp: true, enterpriseId: true },
  });

  // Group by role.
  const byRole = new Map<string, number[]>();
  const enterpriseIdsByRole = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!byRole.has(r.role)) {
      byRole.set(r.role, []);
      enterpriseIdsByRole.set(r.role, new Set());
    }
    byRole.get(r.role)!.push(r.medianSalaryEgp);
    enterpriseIdsByRole.get(r.role)!.add(r.enterpriseId);
  }

  const benchmarks: SectorBenchmark[] = [];
  for (const role of WAGE_ROLES) {
    const medians = byRole.get(role) ?? [];
    if (medians.length === 0) {
      benchmarks.push({
        sector,
        role,
        enterpriseCount: 0,
        medianOfMedians: 0,
        minMedian: 0,
        maxMedian: 0,
      });
      continue;
    }
    const sorted = [...medians].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianOfMedians =
      sorted.length % 2 === 0
        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
        : sorted[mid];
    benchmarks.push({
      sector,
      role,
      enterpriseCount: enterpriseIdsByRole.get(role)!.size,
      medianOfMedians,
      minMedian: sorted[0],
      maxMedian: sorted[sorted.length - 1],
    });
  }

  return benchmarks;
}
