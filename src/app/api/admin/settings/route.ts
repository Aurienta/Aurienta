import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// Default settings — seeded on first GET if absent. The defaults
// mirror the constitutional constants in TIER_META / PROPOSAL_TYPES
// so the Steward can tune them at runtime without code changes.
// ─────────────────────────────────────────────────────────────
const DEFAULTS: { key: string; value: unknown; category: string }[] = [
  // Fees
  { key: "fee.platformPct",         value: 5,     category: "fee" },
  { key: "fee.consultingPct",       value: 2.5,   category: "fee" },
  { key: "fee.antifragilityPct",    value: 1,     category: "fee" },
  // Tier caps — max Capital Formation (EGP) and min Capital Participation (EGP) per tier
  { key: "tier.A.maxRaise",         value: 3_000_000,        category: "tier" },
  { key: "tier.A.minInvest",        value: 50,               category: "tier" },
  { key: "tier.B.maxRaise",         value: 25_000_000,       category: "tier" },
  { key: "tier.B.minInvest",        value: 50,               category: "tier" },
  { key: "tier.C.maxRaise",         value: 0,                category: "tier" }, // 0 = unlimited
  { key: "tier.C.minInvest",        value: 50,               category: "tier" },
  { key: "tier.D.maxRaise",         value: 0,                category: "tier" },
  { key: "tier.D.minInvest",        value: 50_000,           category: "tier" },
  { key: "tier.E.maxRaise",         value: 5_000_000,        category: "tier" },
  { key: "tier.E.minInvest",        value: 50,               category: "tier" },
  { key: "tier.F.maxRaise",         value: 0,                category: "tier" },
  { key: "tier.F.minInvest",        value: 1,                category: "tier" },
  // Timing rules (hours)
  { key: "timing.coolingBudgetHours",          value: 48,  category: "timing" },
  { key: "timing.coolingManagerAppointmentH",  value: 24,  category: "timing" },
  { key: "timing.coolingManagerRemovalH",      value: 48,  category: "timing" },
  { key: "timing.coolingDividendDays",         value: 7,   category: "timing" },
  { key: "timing.coolingConstitutionalDays",   value: 90,  category: "timing" },
  { key: "timing.coolingGraduationDays",       value: 30,  category: "timing" },
  { key: "timing.votingBudgetHours",           value: 48,  category: "timing" },
  { key: "timing.votingManagerRemovalHours",   value: 72,  category: "timing" },
  { key: "timing.votingDividendHours",         value: 24,  category: "timing" },
  { key: "timing.votingConstitutionalDays",    value: 14,  category: "timing" },
  { key: "timing.votingGraduationDays",        value: 14,  category: "timing" },
  { key: "timing.sessionExpiryHours",          value: 168, category: "timing" }, // 7 days
  // Feature flags
  { key: "feature.aiEnabled",       value: true,  category: "feature_flag" },
  { key: "feature.diasporaEnabled", value: true,  category: "feature_flag" },
  { key: "feature.graduationEnabled", value: true, category: "feature_flag" },
  { key: "feature.syndicatesEnabled", value: true, category: "feature_flag" },
  { key: "feature.oracleMirrorArmed", value: true, category: "feature_flag" },
];

async function seedDefaults() {
  // Upsert each default; missing settings are created with their default value.
  // Existing settings are left untouched (Steward overrides win).
  for (const d of DEFAULTS) {
    await db.platformSetting.upsert({
      where: { key: d.key },
      update: {},
      create: {
        key: d.key,
        value: JSON.stringify(d.value),
        category: d.category,
      },
    });
  }
}

/**
 * GET /api/admin/settings
 * Returns all platform settings grouped by category. Requires `aurienta_rep`.
 */
export async function GET() {
  try {
    await requireRole("aurienta_rep");

    // Seed any missing defaults on first read so the console always has the
    // full set of knobs available.
    await seedDefaults();

    const rows = await db.platformSetting.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
      include: { updatedBy: { select: { legalName: true, email: true } } },
    });

    const grouped: Record<string, { key: string; value: unknown; updatedAt: Date; updatedBy?: string }[]> = {};
    for (const r of rows) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(r.value);
      } catch {
        parsed = r.value;
      }
      const cat = grouped[r.category] ?? (grouped[r.category] = []);
      cat.push({
        key: r.key,
        value: parsed,
        updatedAt: r.updatedAt,
        updatedBy: r.updatedBy?.legalName,
      });
    }

    return NextResponse.json({ categories: grouped, total: rows.length });
  } catch (err) {
    logger.error("settings.get", { err: err instanceof Error ? err.message : String(err) });
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg.includes("Not authenticated") ? 401 : msg.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: msg, code: status === 401 ? "unauthenticated" : status === 403 ? "forbidden" : "server_error" }, { status });
  }
}

/**
 * PATCH /api/admin/settings
 * Body: { key, value }
 * Upserts the setting, writes an audit-log entry, and returns the new row.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole("aurienta_rep");

    let body: { key?: unknown; value?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body", code: "bad_request" }, { status: 400 });
    }

    const { key, value } = body;
    if (typeof key !== "string" || !key.trim()) {
      return NextResponse.json({ error: "Missing or invalid 'key'", code: "bad_request" }, { status: 400 });
    }
    if (value === undefined || value === null) {
      return NextResponse.json({ error: "Missing 'value'", code: "bad_request" }, { status: 400 });
    }

    // Validate scalar value type — only numbers, booleans, and short strings
    // are permitted (no nested objects/arrays — settings are flat knobs).
    if (typeof value !== "number" && typeof value !== "boolean" && typeof value !== "string") {
      return NextResponse.json({ error: "'value' must be a number, boolean, or string", code: "bad_request" }, { status: 400 });
    }
    if (typeof value === "string" && value.length > 256) {
      return NextResponse.json({ error: "String 'value' too long (max 256 chars)", code: "bad_request" }, { status: 400 });
    }

    // Infer category from the key prefix if creating a new setting.
    const category = key.startsWith("fee.") ? "fee"
      : key.startsWith("tier.") ? "tier"
      : key.startsWith("timing.") ? "timing"
      : key.startsWith("feature.") ? "feature_flag"
      : "general";

    const previous = await db.platformSetting.findUnique({ where: { key } });

    const row = await db.platformSetting.upsert({
      where: { key },
      update: {
        value: JSON.stringify(value),
        updatedById: user.id,
      },
      create: {
        key,
        value: JSON.stringify(value),
        category,
        updatedById: user.id,
      },
    });

    await audit({
      actorId: user.id,
      action: "admin.settings.update",
      target: `platform:setting:${key}`,
      result: "allowed",
      metadata: {
        key,
        previous: previous ? (() => { try { return JSON.parse(previous.value); } catch { return previous.value; } })() : null,
        next: value,
        category,
      },
    });

    return NextResponse.json({
      key: row.key,
      value,
      category: row.category,
      updatedAt: row.updatedAt,
      updatedBy: user.legalName,
    });
  } catch (err) {
    logger.error("settings.patch", { err: err instanceof Error ? err.message : String(err) });
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg.includes("Not authenticated") ? 401 : msg.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: msg, code: status === 401 ? "unauthenticated" : status === 403 ? "forbidden" : "server_error" }, { status });
  }
}
