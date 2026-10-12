// AURIENTA — Enterprise Discovery API (Roadmap Phase 1)
// ═══════════════════════════════════════════════════════════════
// GET  /api/discovery          → { profile, matches } for current user
// POST /api/discovery          → upsert DiscoveryProfile, return updated profile
//
// Recommendation engine — NOT auto-investment. Partners manually select
// each enterprise. AURIENTA provides information only.
//
// Auth required. Audit-logged on every state-changing request.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import { recommendEnterprises, RISK_APPETITES } from "@/lib/aurienta/enterprise-discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_INVESTMENT_EGP = 50;
const MAX_INVESTMENT_EGP = 1_000_000_000; // sanity ceiling (1B EGP)
const DIVERSIFICATION_MIN = 1;
const DIVERSIFICATION_MAX = 10;
const MAX_STRING_LEN = 500;

type ProfileInput = {
  riskAppetite?: unknown;
  preferredSectors?: unknown;
  preferredTiers?: unknown;
  minHealthRating?: unknown;
  minInvestmentEgp?: unknown;
  maxInvestmentEgp?: unknown;
  targetDiversification?: unknown;
};

type ValidationError = { field: string; message: string };

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** Validate a profile POST body. Returns null if valid, else first error. */
function validateProfileInput(
  body: ProfileInput
): ValidationError | null {
  if (!RISK_APPETITES.includes(body.riskAppetite as never)) {
    return {
      field: "riskAppetite",
      message: `riskAppetite must be one of: ${RISK_APPETITES.join(", ")}`,
    };
  }
  if (body.preferredSectors !== undefined && !isString(body.preferredSectors)) {
    return { field: "preferredSectors", message: "preferredSectors must be a string" };
  }
  if (body.preferredTiers !== undefined && !isString(body.preferredTiers)) {
    return { field: "preferredTiers", message: "preferredTiers must be a string" };
  }
  if (body.minHealthRating !== undefined && !isString(body.minHealthRating)) {
    return { field: "minHealthRating", message: "minHealthRating must be a string" };
  }
  if (!isNumber(body.minInvestmentEgp) || body.minInvestmentEgp < MIN_INVESTMENT_EGP) {
    return {
      field: "minInvestmentEgp",
      message: `minInvestmentEgp must be a number >= ${MIN_INVESTMENT_EGP}`,
    };
  }
  if (!isNumber(body.maxInvestmentEgp) || body.maxInvestmentEgp > MAX_INVESTMENT_EGP) {
    return {
      field: "maxInvestmentEgp",
      message: `maxInvestmentEgp must be a number <= ${MAX_INVESTMENT_EGP}`,
    };
  }
  if (body.maxInvestmentEgp < body.minInvestmentEgp) {
    return {
      field: "maxInvestmentEgp",
      message: "maxInvestmentEgp must be >= minInvestmentEgp",
    };
  }
  if (
    !isNumber(body.targetDiversification) ||
    body.targetDiversification < DIVERSIFICATION_MIN ||
    body.targetDiversification > DIVERSIFICATION_MAX
  ) {
    return {
      field: "targetDiversification",
      message: `targetDiversification must be between ${DIVERSIFICATION_MIN} and ${DIVERSIFICATION_MAX}`,
    };
  }
  return null;
}

/** Coerce + clamp strings to safe lengths. */
function sanitizeString(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, MAX_STRING_LEN);
}

// ── GET /api/discovery ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const profile = await db.discoveryProfile.findUnique({
      where: { userId: user.id },
    });
    const matches = await recommendEnterprises(user.id);

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    await audit({
      actorId: user.id,
      action: "discovery.read",
      result: "allowed",
      metadata: {
        matchCount: matches.length,
        hasProfile: Boolean(profile),
      },
      ip,
      userAgent,
    });

    return NextResponse.json({
      ok: true,
      profile,
      matches,
      label:
        "Constitutional Match Score — relevance ranking, not investment recommendation",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[GET /api/discovery] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to load discovery data", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// ── POST /api/discovery ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    let body: ProfileInput;
    try {
      body = (await req.json()) as ProfileInput;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const validationError = validateProfileInput(body);
    if (validationError) {
      return NextResponse.json(
        {
          error: validationError.message,
          code: "VALIDATION_ERROR",
          field: validationError.field,
        },
        { status: 400 }
      );
    }

    // Build the upsert payload (sanitized).
    const data = {
      riskAppetite: body.riskAppetite as string,
      preferredSectors: sanitizeString(body.preferredSectors ?? ""),
      preferredTiers: sanitizeString(body.preferredTiers ?? "A,B,C"),
      minHealthRating: sanitizeString(body.minHealthRating ?? "BBB"),
      minInvestmentEgp: body.minInvestmentEgp as number,
      maxInvestmentEgp: body.maxInvestmentEgp as number,
      targetDiversification: body.targetDiversification as number,
    };

    const profile = await db.discoveryProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    await audit({
      actorId: user.id,
      action: "discovery.profile.update",
      result: "allowed",
      metadata: {
        riskAppetite: profile.riskAppetite,
        preferredTiers: profile.preferredTiers,
        minInvestmentEgp: profile.minInvestmentEgp,
        maxInvestmentEgp: profile.maxInvestmentEgp,
      },
      ip,
      userAgent,
    });

    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[POST /api/discovery] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to update discovery profile", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
