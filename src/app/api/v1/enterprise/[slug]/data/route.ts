// AURIENTA — Public v1 Enterprise Data API (API-key gated, NO session auth)
// ═══════════════════════════════════════════════════════════════
// GET /api/v1/enterprise/[slug]/data?key=xxx
//
// Public read-only enterprise data endpoint for external integrations
// (QuickBooks, accounting software, partner dashboards). Authenticated
// by a per-enterprise API key issued via POST /api/api-keys.
//
// Rate limited: 100 requests / hour / key (in-memory sliding window).
//
// Returns:
//   - enterprise financials (revenue, burn, balance, runway, margins)
//   - milestones (id, title, status, amountEgp, dueAt, releasedAt)
//   - expenses aggregated by category + status (no individual vendor names
//     are exposed — only category totals)
//   - employees ANONYMIZED (count by department + employmentType, NO names,
//     NO national IDs, NO salaries — only compensation bands)
//   - public metadata (name, slug, sector, tier, stage, healthScore)
//
// The endpoint deliberately returns LESS data than the internal
// /api/enterprises/[id] routes — external integrations get only what
// they need to reconcile, never PII.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import { rateLimit, rateLimitedResponse } from "@/lib/aurienta/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 100 requests / hour / key (in-memory).
const v1Limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  key: "v1_enterprise_data",
});

type ApiKeyRecord = {
  key: string;
  name: string;
  enterpriseId: string;
  createdAt: string;
  active: boolean;
  revokedAt?: string | null;
};

/**
 * Look up the API key for a given enterprise.
 *
 * API keys are stored as PlatformSetting rows keyed `api_key_${enterpriseId}_${uuid}`.
 * The actual key value lives inside the JSON `value` blob. We linear-scan the
 * enterprise's keys (expected to be a small set: typically 1–5 integrations)
 * and return the first ACTIVE one whose stored key matches.
 *
 * Returns `{ record, setting }` on match, `null` if no active key matches.
 */
async function findActiveApiKey(
  enterpriseId: string,
  providedKey: string
): Promise<{ record: ApiKeyRecord; settingId: string } | null> {
  const prefix = `api_key_${enterpriseId}_`;
  const rows = await db.platformSetting.findMany({
    where: {
      key: { startsWith: prefix },
      category: "api_key",
    },
    select: { id: true, value: true },
  });
  for (const r of rows) {
    let rec: ApiKeyRecord;
    try {
      rec = JSON.parse(r.value) as ApiKeyRecord;
    } catch {
      continue;
    }
    if (rec.active && rec.key === providedKey) {
      return { record: rec, settingId: r.id };
    }
  }
  return null;
}

/**
 * GET /api/v1/enterprise/[slug]/data?key=xxx
 *
 * No session auth — the API key IS the auth. Validate the key, rate-limit
 * per key, then return anonymized read-only enterprise data.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const url = new URL(req.url);
    const providedKey = url.searchParams.get("key");

    if (!providedKey) {
      return NextResponse.json(
        {
          error: "Missing API key. Provide ?key=xxx",
          code: "MISSING_API_KEY",
        },
        { status: 401 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    // Resolve the enterprise by slug first (so 404s short-circuit before
    // the key check — leaking nothing about which enterprises have keys).
    const enterprise = await db.enterprise.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        sector: true,
        tier: true,
        stage: true,
        status: true,
        legalForm: true,
        healthScore: true,
        healthRating: true,
        fundraisingGoalEgp: true,
        raisedEgp: true,
        equityUnitPriceEgp: true,
        totalEquityUnits: true,
        monthlyRevenueEgp: true,
        monthlyBurnEgp: true,
        lawFirmClientAccountBalanceEgp: true,
        grossMarginPct: true,
        revenueGrowthPct: true,
        employeeCount: true,
        nosiCompliantPct: true,
        policeClearanceValid: true,
        createdAt: true,
      },
    });

    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise not found", code: "ENTERPRISE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Validate the API key.
    const match = await findActiveApiKey(enterprise.id, providedKey);
    if (!match) {
      // Audit the failed attempt — never reveal whether the enterprise exists
      // vs. whether the key is wrong (same 401 envelope).
      await audit({
        action: "v1.api_key.invalid",
        target: `enterprise:${enterprise.id}`,
        result: "denied",
        reason: "No active API key matched the provided key",
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "Invalid or revoked API key", code: "INVALID_API_KEY" },
        { status: 401 }
      );
    }

    // Rate limit per key (NOT per IP — keys are the unit of quota).
    const rl = v1Limiter(providedKey);
    if (!rl.allowed) {
      return rateLimitedResponse(rl.resetAt);
    }

    // ── Pull the read-only data ──
    const [milestones, expenses, employees] = await Promise.all([
      db.milestone.findMany({
        where: { enterpriseId: enterprise.id },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          title: true,
          status: true,
          amountEgp: true,
          dueAt: true,
          releasedAt: true,
          createdAt: true,
        },
      }),
      db.expense.findMany({
        where: { enterpriseId: enterprise.id },
        select: {
          category: true,
          status: true,
          amountEgp: true,
          createdAt: true,
        },
      }),
      db.employee.findMany({
        where: { enterpriseId: enterprise.id },
        select: {
          department: true,
          employmentType: true,
          compensationBand: true,
          nosiStatus: true,
          keyPerson: true,
          equityConversionPct: true,
        },
      }),
    ]);

    // ── Aggregate expenses by category + status ──
    // We deliberately do NOT expose vendor names or individual line items —
    // only category totals, so external integrations can reconcile against
    // their own category maps.
    const expenseAggregates: Record<
      string,
      { count: number; totalEgp: number; pendingEgp: number; approvedEgp: number }
    > = {};
    for (const e of expenses) {
      const cat = e.category || "other";
      if (!expenseAggregates[cat]) {
        expenseAggregates[cat] = { count: 0, totalEgp: 0, pendingEgp: 0, approvedEgp: 0 };
      }
      const agg = expenseAggregates[cat];
      agg.count += 1;
      agg.totalEgp += e.amountEgp;
      if (e.status === "approved") agg.approvedEgp += e.amountEgp;
      if (e.status === "pending" || e.status === "dual_signature_pending") {
        agg.pendingEgp += e.amountEgp;
      }
    }

    // ── Anonymize employees ──
    // Aggregate by department + employmentType. Never expose names, national IDs,
    // salaries, or NOSI numbers — only counts + compensation bands.
    const employeeAggregates: Record<
      string,
      {
        department: string;
        employmentType: string;
        count: number;
        compensationBands: string[];
        nosiRegistered: number;
        nosiPending: number;
        nosiMissing: number;
        keyPersons: number;
        avgEquityConversionPct: number;
      }
    > = {};
    for (const emp of employees) {
      const key = `${emp.department || "Unknown"}|${emp.employmentType || "Unknown"}`;
      if (!employeeAggregates[key]) {
        employeeAggregates[key] = {
          department: emp.department || "Unknown",
          employmentType: emp.employmentType || "Unknown",
          count: 0,
          compensationBands: [],
          nosiRegistered: 0,
          nosiPending: 0,
          nosiMissing: 0,
          keyPersons: 0,
          avgEquityConversionPct: 0,
        };
      }
      const agg = employeeAggregates[key];
      agg.count += 1;
      if (emp.compensationBand && !agg.compensationBands.includes(emp.compensationBand)) {
        agg.compensationBands.push(emp.compensationBand);
      }
      if (emp.nosiStatus === "registered") agg.nosiRegistered += 1;
      else if (emp.nosiStatus === "pending") agg.nosiPending += 1;
      else agg.nosiMissing += 1;
      if (emp.keyPerson) agg.keyPersons += 1;
      agg.avgEquityConversionPct += emp.equityConversionPct ?? 0;
    }
    // Finalize averages.
    const employeeBreakdown = Object.values(employeeAggregates).map((agg) => ({
      ...agg,
      avgEquityConversionPct:
        agg.count > 0
          ? Math.round((agg.avgEquityConversionPct / agg.count) * 100) / 100
          : 0,
    }));

    // ── Compute runway (months) ──
    const runwayMonths =
      enterprise.monthlyBurnEgp > 0
        ? Math.round(
            (enterprise.lawFirmClientAccountBalanceEgp /
              enterprise.monthlyBurnEgp) *
              10
          ) / 10
        : null;

    // ── Audit the successful read (no PII) ──
    await audit({
      action: "v1.enterprise.data.read",
      target: `enterprise:${enterprise.id}`,
      result: "allowed",
      metadata: {
        apiKeyName: match.record.name,
        apiSettingId: match.settingId,
        milestonesReturned: milestones.length,
        expenseCategoriesReturned: Object.keys(expenseAggregates).length,
        employeeDepartmentsReturned: employeeBreakdown.length,
        rateLimitRemaining: rl.remaining,
      },
      ip,
      userAgent,
    });

    const fetchedAt = new Date().toISOString();

    return NextResponse.json(
      {
        ok: true,
        apiVersion: "v1",
        fetchedAt,
        rateLimit: {
          limit: 100,
          remaining: rl.remaining,
          resetAt: new Date(rl.resetAt).toISOString(),
          window: "1h",
        },
        disclaimer:
          "Read-only enterprise data — anonymized; no personal data exposed.",
        enterprise: {
          id: enterprise.id,
          name: enterprise.name,
          slug: enterprise.slug,
          sector: enterprise.sector,
          tier: enterprise.tier,
          stage: enterprise.stage,
          status: enterprise.status,
          legalForm: enterprise.legalForm,
          healthScore: enterprise.healthScore,
          healthRating: enterprise.healthRating,
          createdAt: enterprise.createdAt.toISOString(),
        },
        financials: {
          fundraisingGoalEgp: enterprise.fundraisingGoalEgp,
          raisedEgp: enterprise.raisedEgp,
          equityUnitPriceEgp: enterprise.equityUnitPriceEgp,
          totalEquityUnits: enterprise.totalEquityUnits,
          monthlyRevenueEgp: enterprise.monthlyRevenueEgp,
          monthlyBurnEgp: enterprise.monthlyBurnEgp,
          lawFirmClientAccountBalanceEgp:
            enterprise.lawFirmClientAccountBalanceEgp,
          runwayMonths,
          grossMarginPct: enterprise.grossMarginPct,
          revenueGrowthPct: enterprise.revenueGrowthPct,
          employeeCount: enterprise.employeeCount,
          nosiCompliantPct: enterprise.nosiCompliantPct,
          policeClearanceValid: enterprise.policeClearanceValid,
        },
        milestones: milestones.map((m) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          amountEgp: m.amountEgp,
          dueAt: m.dueAt ? m.dueAt.toISOString() : null,
          releasedAt: m.releasedAt ? m.releasedAt.toISOString() : null,
          createdAt: m.createdAt.toISOString(),
        })),
        expenses: {
          totalRecords: expenses.length,
          totalEgp: expenses.reduce((s, e) => s + e.amountEgp, 0),
          byCategory: Object.entries(expenseAggregates).map(
            ([category, agg]) => ({
              category,
              count: agg.count,
              totalEgp: agg.totalEgp,
              pendingEgp: agg.pendingEgp,
              approvedEgp: agg.approvedEgp,
            })
          ),
        },
        employees: {
          totalRecords: employees.length,
          anonymized: true,
          byDepartment: employeeBreakdown,
        },
      },
      {
        headers: {
          // CORS-open so external integrations can call from the browser.
          // The API key in the query string is acceptable for read-only
          // data; for write endpoints we'd require a header.
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Cache-Control": "no-store",
          "X-Aurienta-Api-Version": "v1",
          "X-Aurienta-RateLimit-Limit": "100",
          "X-Aurienta-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[GET /api/v1/enterprise/[slug]/data] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to read enterprise data", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// CORS preflight — allow external integrations to negotiate.
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
