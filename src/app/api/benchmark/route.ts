// AURIENTA — Enterprise Benchmarking API
// ═══════════════════════════════════════════════════════════════
// GET /api/benchmark?enterpriseId=xxx
//
// Compares an enterprise's vital signs against the sector averages
// published in `INDUSTRY_MODULES` (Blueprint Volume 20). Each sector's
// `vitalSigns` array exposes `healthy` (target good value) thresholds —
// these are used as the sector-average benchmark.
//
// Response:
//   {
//     enterprise: { runway, revenueGrowth, grossMargin, turnover,
//                    nosiCompliance, healthScore },
//     sector:     { avgRunway, avgRevenueGrowth, avgGrossMargin,
//                    avgTurnover, avgNosiCompliance, ...benchmarks },
//     deltas:     { ... enterprise-minus-sector, signed },
//     label:      "Sector benchmark — not investment advice"
//   }
//
// Auth required. Audit-logged.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import { INDUSTRY_MODULES, getModuleForSector } from "@/lib/aurienta/industry-modules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LABEL = "Sector benchmark — not investment advice";

// ── Default sector averages ──
// Used when an industry module's vitalSigns don't expose a directly
// comparable healthy threshold for the requested benchmark field, or
// when the enterprise's sector doesn't map to any activated module.
// These defaults mirror the constitutional baseline enterprise (Tier B,
// 75 health score, 12-month runway, 30% gross margin).
const DEFAULT_SECTOR_AVERAGES = {
  avgRunway: 12, // months
  avgRevenueGrowth: 20, // %
  avgGrossMargin: 30, // %
  avgTurnover: 50_000, // EGP per employee per month
  avgNosiCompliance: 100, // %
  avgHealthScore: 75, // 0–100
};

// Map an industry module's vitalSigns healthy thresholds onto the
// 5 benchmark fields requested by the spec. Each field is resolved
// from the matching vitalSign key when present, else falls back to
// the constitutional default.
type SectorAverages = typeof DEFAULT_SECTOR_AVERAGES;

function resolveSectorAverages(sector: string): SectorAverages & {
  moduleId: string | null;
  moduleName: string | null;
  sources: { label: string; value: string; source: string }[];
} {
  const indModule = getModuleForSector(sector);
  if (!indModule) {
    return {
      ...DEFAULT_SECTOR_AVERAGES,
      moduleId: null,
      moduleName: null,
      sources: [],
    };
  }

  // Index the module's vitalSigns by key for O(1) lookup.
  const vsMap = new Map(
    indModule.vitalSigns.map((v) => [v.key, v])
  );

  // For each benchmark field, pick the most-applicable vitalSign.
  // - runway (months) — technology module exposes `runway` directly
  // - revenueGrowth (%) — no direct vitalSign; fall back to default
  // - grossMargin (%)   — no direct vitalSign; fall back to default
  // - turnover (EGP/emp/mo) — no direct vitalSign; fall back to default
  // - nosiCompliance (%) — agriculture exposes `subsidyCompliance`;
  //                        healthcare exposes `staffCertification`
  const runwayVs = vsMap.get("runway");
  const subsidyVs = vsMap.get("subsidyCompliance");
  const staffCertVs = vsMap.get("staffCertification");

  const sectorAverages: SectorAverages = {
    avgRunway: runwayVs ? runwayVs.healthy : DEFAULT_SECTOR_AVERAGES.avgRunway,
    avgRevenueGrowth: DEFAULT_SECTOR_AVERAGES.avgRevenueGrowth,
    avgGrossMargin: DEFAULT_SECTOR_AVERAGES.avgGrossMargin,
    avgTurnover: DEFAULT_SECTOR_AVERAGES.avgTurnover,
    avgNosiCompliance:
      subsidyVs?.healthy ?? staffCertVs?.healthy ?? DEFAULT_SECTOR_AVERAGES.avgNosiCompliance,
    avgHealthScore: DEFAULT_SECTOR_AVERAGES.avgHealthScore,
  };

  return {
    ...sectorAverages,
    moduleId: indModule.id,
    moduleName: indModule.name,
    sources: indModule.benchmarks,
  };
}

/**
 * GET /api/benchmark?enterpriseId=xxx
 *
 * Returns the enterprise's vital signs alongside the sector averages
 * from the matching INDUSTRY_MODULE, plus signed deltas (enterprise − sector).
 * Labeled "Sector benchmark — not investment advice".
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const enterpriseId = url.searchParams.get("enterpriseId");
    if (!enterpriseId) {
      return NextResponse.json(
        { error: "Provide ?enterpriseId=xxx", code: "MISSING_QUERY_PARAM" },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: {
        id: true,
        name: true,
        slug: true,
        sector: true,
        tier: true,
        stage: true,
        status: true,
        healthScore: true,
        monthlyRevenueEgp: true,
        monthlyBurnEgp: true,
        lawFirmClientAccountBalanceEgp: true,
        grossMarginPct: true,
        revenueGrowthPct: true,
        employeeCount: true,
        nosiCompliantPct: true,
      },
    });

    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise not found", code: "ENTERPRISE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Authorization: must be a member of the enterprise OR an aurienta_rep.
    const isMember = user.memberships.some(
      (m) => m.enterpriseId === enterpriseId
    );
    const isRep = user.memberships.some((m) => m.role === "aurienta_rep");
    if (!isMember && !isRep) {
      await audit({
        actorId: user.id,
        action: "benchmark.read",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: "Not a member of the enterprise",
        ip,
        userAgent,
      });
      return NextResponse.json(
        {
          error: "Forbidden: must be a member of the enterprise",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // ── Compute enterprise vital signs ──
    const runwayMonths =
      enterprise.monthlyBurnEgp > 0
        ? Math.round(
            (enterprise.lawFirmClientAccountBalanceEgp /
              enterprise.monthlyBurnEgp) *
              10
          ) / 10
        : null;

    // Turnover = monthly revenue per employee (EGP/employee/month).
    const turnoverPerEmployee =
      enterprise.employeeCount > 0
        ? Math.round(enterprise.monthlyRevenueEgp / enterprise.employeeCount)
        : null;

    const entVitals = {
      runway: runwayMonths,
      revenueGrowth: enterprise.revenueGrowthPct,
      grossMargin: enterprise.grossMarginPct,
      turnover: turnoverPerEmployee,
      nosiCompliance: enterprise.nosiCompliantPct,
      healthScore: enterprise.healthScore,
    };

    // ── Resolve sector averages ──
    const sector = resolveSectorAverages(enterprise.sector);

    // ── Compute signed deltas (enterprise − sector) ──
    // For inverted metrics (runway missing is bad), null deltas are surfaced as
    // null rather than 0 to preserve the "no data" signal.
    const deltas = {
      runway:
        entVitals.runway !== null
          ? Math.round((entVitals.runway - sector.avgRunway) * 10) / 10
          : null,
      revenueGrowth:
        Math.round((entVitals.revenueGrowth - sector.avgRevenueGrowth) * 10) /
        10,
      grossMargin:
        Math.round((entVitals.grossMargin - sector.avgGrossMargin) * 10) / 10,
      turnover:
        entVitals.turnover !== null
          ? entVitals.turnover - sector.avgTurnover
          : null,
      nosiCompliance:
        Math.round((entVitals.nosiCompliance - sector.avgNosiCompliance) * 10) /
        10,
      healthScore: entVitals.healthScore - sector.avgHealthScore,
    };

    await audit({
      actorId: user.id,
      action: "benchmark.read",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      metadata: {
        sector: enterprise.sector,
        moduleId: sector.moduleId,
        deltasSummary: {
          runway: deltas.runway,
          healthScore: deltas.healthScore,
          nosiCompliance: deltas.nosiCompliance,
        },
      },
      ip,
      userAgent,
    });

    // Echo the available industry modules count so the frontend can show
    // "Benchmarked against N sector modules" context.
    const availableModuleCount = INDUSTRY_MODULES.filter((m) => m.activated).length;

    return NextResponse.json({
      ok: true,
      label: LABEL,
      enterprise: {
        id: enterprise.id,
        name: enterprise.name,
        slug: enterprise.slug,
        sector: enterprise.sector,
        tier: enterprise.tier,
        stage: enterprise.stage,
        ...entVitals,
      },
      sector: {
        moduleId: sector.moduleId,
        moduleName: sector.moduleName,
        avgRunway: sector.avgRunway,
        avgRevenueGrowth: sector.avgRevenueGrowth,
        avgGrossMargin: sector.avgGrossMargin,
        avgTurnover: sector.avgTurnover,
        avgNosiCompliance: sector.avgNosiCompliance,
        avgHealthScore: sector.avgHealthScore,
        benchmarks: sector.sources,
        availableModuleCount,
      },
      deltas,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[GET /api/benchmark] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to compute benchmark", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
