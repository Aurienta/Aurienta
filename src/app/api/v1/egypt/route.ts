// AURIENTA — Unified Egyptian Market Reference Data API
// ═══════════════════════════════════════════════════════════════
// GET /api/v1/egypt                          → overview + stats from all 9 DBs
// GET /api/v1/egypt/sectors                  → all 36 Egyptian economic sectors
// GET /api/v1/egypt/sectors/[id]             → single sector detail
// GET /api/v1/egypt/governorates             → all 27 governorates
// GET /api/v1/egypt/governorates/[id]        → single governorate detail
// GET /api/v1/egypt/projects                 → 20 national megaprojects
// GET /api/v1/egypt/projects/[id]            → single project detail
// GET /api/v1/egypt/regulatory               → 32 regulatory bodies
// GET /api/v1/egypt/banks                    → 31 banks & financial institutions
// GET /api/v1/egypt/benchmarks               → 36 sector feasibility benchmarks
// GET /api/v1/egypt/salary-bands              → 780 salary bands
// GET /api/v1/egypt/legal-forms              → 15 legal entity types
// GET /api/v1/egypt/fx-history               → 120 historical FX snapshots
//
// Public read-only API — no auth required (all data is publicly available
// reference information from CAPMAS, GAFI, CBE, and official Egyptian sources).
// CORS-enabled for external integration. Cached via referenceCache (5 min TTL).

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { referenceCache, cacheAside } from "@/lib/aurienta/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Overview endpoint ──────────────────────────────────────────────────────
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const dataset = url.searchParams.get("dataset") ?? "overview";
  const id = url.searchParams.get("id");

  // Cache overview for 5 min, individual lookups for 10 min
  const cacheKey = id ? `egypt:${dataset}:${id}` : `egypt:${dataset}`;
  const ttlMs = id ? 600_000 : 300_000;

  const result = await cacheAside(referenceCache, cacheKey, async () => {
    switch (dataset) {
      case "overview":
        return buildOverview();
      case "sectors":
        return id ? await getSector(id) : await getAllSectors();
      case "governorates":
        return id ? await getGovernorate(id) : await getAllGovernorates();
      case "projects":
        return id ? await getProject(id) : await getAllProjects();
      case "regulatory":
        return id ? await getRegulatoryBody(id) : await getAllRegulatory();
      case "banks":
        return id ? await getBank(id) : await getAllBanks();
      case "benchmarks":
        return id ? await getBenchmark(id) : await getAllBenchmarks();
      case "salary-bands":
        return await getSalaryBands(url.searchParams);
      case "legal-forms":
        return id ? await getLegalForm(id) : await getAllLegalForms();
      case "fx-history":
        return await getFxHistory(url.searchParams);
      default:
        return { error: `Unknown dataset: ${dataset}. Valid: overview, sectors, governorates, projects, regulatory, banks, benchmarks, salary-bands, legal-forms, fx-history` };
    }
  }, ttlMs);

  return NextResponse.json(result, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "X-Cache": "aurienta-reference",
      "X-Aurienta-DataSource": "egyptian-market-reference",
    },
  });
}, "GET /api/v1/egypt");

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// ── Data loaders (lazy import to keep bundle small) ───────────────────────

async function buildOverview() {
  const [
    { SECTOR_STATS, EGYPT_SECTORS },
    { GOVERNORATE_STATS, EGYPT_GOVERNORATES },
    { PROJECT_STATS, EGYPT_NATIONAL_PROJECTS },
    { REGULATORY_STATS, EGYPT_REGULATORY_BODIES },
    { BANK_STATS, EGYPT_BANKS },
    { BENCHMARK_STATS, FEASIBILITY_BENCHMARKS },
    { SALARY_STATS, EGYPT_SALARY_BANDS },
    { LEGAL_FORM_STATS, EGYPT_LEGAL_FORMS },
    { FX_STATS, FX_HISTORY },
  ] = await Promise.all([
    import("@/lib/aurienta/data/egypt-sectors"),
    import("@/lib/aurienta/data/egypt-governorates"),
    import("@/lib/aurienta/data/egypt-national-projects"),
    import("@/lib/aurienta/data/egypt-regulatory-bodies"),
    import("@/lib/aurienta/data/egypt-banks"),
    import("@/lib/aurienta/data/egypt-feasibility-benchmarks"),
    import("@/lib/aurienta/data/egypt-salary-bands"),
    import("@/lib/aurienta/data/egypt-legal-forms"),
    import("@/lib/aurienta/data/egypt-fx-history"),
  ]);

  return {
    service: "aurienta-egypt-market-reference",
    version: "1.0.0",
    description: "Comprehensive Egyptian market reference data for enterprise formation, feasibility analysis, and compliance.",
    datasets: {
      sectors: { count: SECTOR_STATS.total, stats: SECTOR_STATS, endpoint: "/api/v1/egypt?dataset=sectors" },
      governorates: { count: GOVERNORATE_STATS.total, stats: GOVERNORATE_STATS, endpoint: "/api/v1/egypt?dataset=governorates" },
      nationalProjects: { count: PROJECT_STATS.total, stats: { totalInvestmentEgp: PROJECT_STATS.totalInvestmentEgp, byStatus: PROJECT_STATS.byStatus }, endpoint: "/api/v1/egypt?dataset=projects" },
      regulatoryBodies: { count: REGULATORY_STATS.total, stats: REGULATORY_STATS, endpoint: "/api/v1/egypt?dataset=regulatory" },
      banks: { count: BANK_STATS.total, stats: { totalAssetsEgpBn: BANK_STATS.totalAssetsEgpBn, totalBranches: BANK_STATS.totalBranches }, endpoint: "/api/v1/egypt?dataset=banks" },
      feasibilityBenchmarks: { count: BENCHMARK_STATS.total, stats: BENCHMARK_STATS, endpoint: "/api/v1/egypt?dataset=benchmarks" },
      salaryBands: { count: SALARY_STATS.totalBands, stats: SALARY_STATS, endpoint: "/api/v1/egypt?dataset=salary-bands" },
      legalForms: { count: LEGAL_FORM_STATS.total, stats: LEGAL_FORM_STATS, endpoint: "/api/v1/egypt?dataset=legal-forms" },
      fxHistory: { count: FX_STATS.total, stats: FX_STATS, endpoint: "/api/v1/egypt?dataset=fx-history" },
    },
    totalRecords:
      EGYPT_SECTORS.length +
      EGYPT_GOVERNORATES.length +
      EGYPT_NATIONAL_PROJECTS.length +
      EGYPT_REGULATORY_BODIES.length +
      EGYPT_BANKS.length +
      FEASIBILITY_BENCHMARKS.length +
      EGYPT_SALARY_BANDS.length +
      EGYPT_LEGAL_FORMS.length +
      FX_HISTORY.length,
    sources: [
      "CAPMAS (Central Agency for Public Mobilization & Statistics)",
      "GAFI (General Authority for Investment & Free Zones)",
      "CBE (Central Bank of Egypt)",
      "FRA (Financial Regulatory Authority)",
      "NUCA (New Urban Communities Authority)",
      "IDA (Industrial Development Authority)",
      "SCZone (Suez Canal Economic Zone)",
      "Ministry of Planning — Egypt Vision 2030",
      "NTRA, NREA, EMRA, EEAA, NFSA, EDA",
    ],
    legalNotice: "Egyptian market reference data — publicly available from official sources. AURIENTA aggregates for enterprise feasibility analysis. Not investment advice.",
    cached: true,
    cachedForSeconds: 300,
    lastUpdated: new Date().toISOString(),
  };
}

async function getAllSectors() {
  const { EGYPT_SECTORS, SECTOR_STATS } = await import("@/lib/aurienta/data/egypt-sectors");
  return { dataset: "sectors", count: EGYPT_SECTORS.length, stats: SECTOR_STATS, sectors: EGYPT_SECTORS };
}

async function getSector(id: string) {
  const { getSectorById } = await import("@/lib/aurienta/data/egypt-sectors");
  const sector = getSectorById(id);
  if (!sector) return { error: `Sector not found: ${id}` };
  return { dataset: "sector", sector };
}

async function getAllGovernorates() {
  const { EGYPT_GOVERNORATES, GOVERNORATE_STATS } = await import("@/lib/aurienta/data/egypt-governorates");
  return { dataset: "governorates", count: EGYPT_GOVERNORATES.length, stats: GOVERNORATE_STATS, governorates: EGYPT_GOVERNORATES };
}

async function getGovernorate(id: string) {
  const { getGovernorateById } = await import("@/lib/aurienta/data/egypt-governorates");
  const gov = getGovernorateById(id);
  if (!gov) return { error: `Governorate not found: ${id}` };
  return { dataset: "governorate", governorate: gov };
}

async function getAllProjects() {
  const { EGYPT_NATIONAL_PROJECTS, PROJECT_STATS } = await import("@/lib/aurienta/data/egypt-national-projects");
  return { dataset: "national-projects", count: EGYPT_NATIONAL_PROJECTS.length, stats: PROJECT_STATS, projects: EGYPT_NATIONAL_PROJECTS };
}

async function getProject(id: string) {
  const { getProjectById } = await import("@/lib/aurienta/data/egypt-national-projects");
  const project = getProjectById(id);
  if (!project) return { error: `Project not found: ${id}` };
  return { dataset: "national-project", project };
}

async function getAllRegulatory() {
  const { EGYPT_REGULATORY_BODIES, REGULATORY_STATS } = await import("@/lib/aurienta/data/egypt-regulatory-bodies");
  return { dataset: "regulatory-bodies", count: EGYPT_REGULATORY_BODIES.length, stats: REGULATORY_STATS, bodies: EGYPT_REGULATORY_BODIES };
}

async function getRegulatoryBody(id: string) {
  const { getBodyById } = await import("@/lib/aurienta/data/egypt-regulatory-bodies");
  const body = getBodyById(id);
  if (!body) return { error: `Regulatory body not found: ${id}` };
  return { dataset: "regulatory-body", body };
}

async function getAllBanks() {
  const { EGYPT_BANKS, BANK_STATS } = await import("@/lib/aurienta/data/egypt-banks");
  return { dataset: "banks", count: EGYPT_BANKS.length, stats: BANK_STATS, banks: EGYPT_BANKS };
}

async function getBank(id: string) {
  const { getBankById } = await import("@/lib/aurienta/data/egypt-banks");
  const bank = getBankById(id);
  if (!bank) return { error: `Bank not found: ${id}` };
  return { dataset: "bank", bank };
}

async function getAllBenchmarks() {
  const { FEASIBILITY_BENCHMARKS, BENCHMARK_STATS } = await import("@/lib/aurienta/data/egypt-feasibility-benchmarks");
  return { dataset: "feasibility-benchmarks", count: FEASIBILITY_BENCHMARKS.length, stats: BENCHMARK_STATS, benchmarks: FEASIBILITY_BENCHMARKS };
}

async function getBenchmark(id: string) {
  const { getBenchmarkBySector } = await import("@/lib/aurienta/data/egypt-feasibility-benchmarks");
  const benchmark = getBenchmarkBySector(id);
  if (!benchmark) return { error: `Benchmark not found for sector: ${id}` };
  return { dataset: "feasibility-benchmark", benchmark };
}

async function getSalaryBands(params: URLSearchParams) {
  const { EGYPT_SALARY_BANDS, SALARY_STATS } = await import("@/lib/aurienta/data/egypt-salary-bands");
  const sectorId = params.get("sectorId");
  const positionCode = params.get("positionCode");
  const region = params.get("region");
  const tier = params.get("tier");

  let bands = EGYPT_SALARY_BANDS;
  if (sectorId) bands = bands.filter((b) => b.sectorId === sectorId);
  if (positionCode) bands = bands.filter((b) => b.positionCode === positionCode);
  if (region) bands = bands.filter((b) => b.region === region);
  if (tier) bands = bands.filter((b) => b.tier === tier);

  return {
    dataset: "salary-bands",
    count: bands.length,
    stats: SALARY_STATS,
    filters: { sectorId, positionCode, region, tier },
    bands,
  };
}

async function getAllLegalForms() {
  const { EGYPT_LEGAL_FORMS, LEGAL_FORM_STATS } = await import("@/lib/aurienta/data/egypt-legal-forms");
  return { dataset: "legal-forms", count: EGYPT_LEGAL_FORMS.length, stats: LEGAL_FORM_STATS, legalForms: EGYPT_LEGAL_FORMS };
}

async function getLegalForm(id: string) {
  const { getLegalFormById } = await import("@/lib/aurienta/data/egypt-legal-forms");
  const form = getLegalFormById(id);
  if (!form) return { error: `Legal form not found: ${id}` };
  return { dataset: "legal-form", legalForm: form };
}

async function getFxHistory(params: URLSearchParams) {
  const { FX_HISTORY, FX_STATS } = await import("@/lib/aurienta/data/egypt-fx-history");
  const pair = params.get("pair");
  const monthsBack = params.get("monthsBack") ? parseInt(params.get("monthsBack") as string, 10) : undefined;

  let history = FX_HISTORY;
  if (pair) history = history.filter((r) => r.pair === pair);
  if (monthsBack) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - monthsBack);
    history = history.filter((r) => new Date(r.date) >= cutoff);
  }

  return {
    dataset: "fx-history",
    count: history.length,
    stats: FX_STATS,
    filters: { pair, monthsBack },
    rates: history,
  };
}
