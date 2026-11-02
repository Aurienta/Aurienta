// AURIENTA — Constitutional Match Score API
// ═══════════════════════════════════════════════════════════════
// GET /api/matching?enterpriseId=xxx  → returns Capital Partners sorted by match score
// GET /api/matching?userId=xxx        → returns enterprises sorted by match score
//
// Match score = weighted sum of:
//   sector_preference           30%  — prior ownership in the same sector
//   tier_preference             20%  — riskProfile ↔ enterprise tier alignment
//   STS alignment               15%  — Sovereign Trust Score ↔ enterprise healthScore
//   risk_profile_match          15%  — riskProfile ↔ runway + grossMargin bands
//   past_participation_history  10%  — already an owner/member of the target
//   geographic_proximity        10%  — nationality EG → full; abroad → reduced
//
// NOT investment advice. Every response carries:
//   label: "Constitutional Match Score — relevance ranking, not investment recommendation"
//
// Auth required. Audit-logged on every read.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RESULTS = 20;
const LABEL =
  "Constitutional Match Score — relevance ranking, not investment recommendation";

// ── Weighting (must sum to 1.0) ──
const WEIGHTS = {
  sector_preference: 0.30,
  tier_preference: 0.20,
  sts_alignment: 0.15,
  risk_profile_match: 0.15,
  past_participation_history: 0.10,
  geographic_proximity: 0.10,
} as const;

// ── riskProfile → preferred tier mapping ──
// Conservative partners favour low-volatility small raises (A/B);
// aggressive partners seek growth capital (D/E); founder_aligned favours JSC (F);
// balanced sits in the middle (C).
const RISK_TO_TIER: Record<string, string[]> = {
  conservative: ["A", "B"],
  balanced: ["C"],
  aggressive: ["D", "E"],
  founder_aligned: ["F"],
};

function tierMatchScore(riskProfile: string | null, tier: string): number {
  if (!riskProfile) return 0.5;
  const preferred = RISK_TO_TIER[riskProfile];
  if (!preferred) return 0.5;
  return preferred.includes(tier) ? 1.0 : 0.3;
}

function stsAlignmentScore(userSts: number, entHealth: number): number {
  const diff = Math.abs(userSts - entHealth);
  return Math.max(0, 1 - diff / 100);
}

// Risk profile ↔ enterprise financial health (runway in months + gross margin %).
function riskProfileMatchScore(
  riskProfile: string | null,
  runwayMonths: number | null,
  grossMarginPct: number
): number {
  if (!riskProfile) return 0.5;
  if (runwayMonths === null) return 0.5;
  switch (riskProfile) {
    case "conservative":
      if (runwayMonths >= 12 && grossMarginPct >= 35) return 1.0;
      if (runwayMonths >= 6 && grossMarginPct >= 25) return 0.6;
      return 0.2;
    case "balanced":
      if (runwayMonths >= 6 && grossMarginPct >= 25) return 1.0;
      if (runwayMonths >= 3) return 0.6;
      return 0.3;
    case "aggressive":
      if (runwayMonths >= 3 && grossMarginPct >= 15) return 1.0;
      if (runwayMonths >= 1) return 0.6;
      return 0.3;
    case "founder_aligned":
      return grossMarginPct > 0 ? 0.9 : 0.4;
    default:
      return 0.5;
  }
}

function geoProximityScore(nationality: string | null): number {
  // Egypt-based partners have full proximity to Egyptian enterprises.
  // Diaspora partners get a reduced (but non-zero) score.
  if (!nationality) return 0.5;
  if (nationality === "EG") return 1.0;
  return 0.6;
}

function sectorPreferenceScore(
  userSectors: Set<string>,
  enterpriseSector: string
): number {
  if (userSectors.size === 0) return 0.5; // neutral when no history
  return userSectors.has(enterpriseSector) ? 1.0 : 0.3;
}

function pastParticipationScore(hasHistory: boolean): number {
  // Prior participation signals sustained engagement (positive signal for
  // further involvement — not a contra-indicator).
  return hasHistory ? 1.0 : 0.3;
}

function computeRunwayMonths(
  balanceEgp: number,
  monthlyBurnEgp: number
): number | null {
  if (monthlyBurnEgp <= 0) return null;
  return balanceEgp / monthlyBurnEgp;
}

function computeScore(breakdown: Record<string, number>): number {
  let s = 0;
  for (const k of Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]) {
    s += (breakdown[k] ?? 0) * WEIGHTS[k];
  }
  return Math.round(s * 100) / 100; // 0–100, 2dp
}

/**
 * GET /api/matching
 * Query: `?enterpriseId=xxx` OR `?userId=xxx` (mutually exclusive — enterpriseId wins).
 *
 * - `userId`       → enterprises sorted by match score for that Capital Partner
 * - `enterpriseId` → Capital Partners sorted by match score for that enterprise
 *
 * Auth required. The caller may pass their own userId, or pass an enterpriseId
 * they are a member of. Either way, every call is audit-logged.
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
    const userIdParam = url.searchParams.get("userId");

    if (!enterpriseId && !userIdParam) {
      return NextResponse.json(
        {
          error: "Provide either ?enterpriseId=xxx or ?userId=xxx",
          code: "MISSING_QUERY_PARAM",
        },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    // ── Branch 1: enterprises ranked for a Capital Partner ──
    if (userIdParam) {
      const targetUser = await db.user.findUnique({
        where: { id: userIdParam },
        select: {
          id: true,
          legalName: true,
          primaryIntent: true,
          riskProfile: true,
          sovereignTrustScore: true,
          nationality: true,
          ownershipRecords: {
            select: {
              enterpriseId: true,
              enterprise: { select: { id: true, sector: true } },
            },
          },
        },
      });

      if (!targetUser) {
        return NextResponse.json(
          { error: "User not found", code: "USER_NOT_FOUND" },
          { status: 404 }
        );
      }

      // Authorization: either the caller is the user themselves, or the caller
      // is an aurienta_rep doing due-diligence on a partner's match list.
      const isSelf = user.id === userIdParam;
      const isRep = user.memberships.some((m) => m.role === "aurienta_rep");
      if (!isSelf && !isRep) {
        await audit({
          actorId: user.id,
          action: "matching.read",
          target: `user:${userIdParam}`,
          result: "denied",
          reason: "Can only view own matches (or be aurienta_rep)",
          ip,
          userAgent,
        });
        return NextResponse.json(
          {
            error: "Forbidden: can only view your own match list",
            code: "FORBIDDEN",
          },
          { status: 403 }
        );
      }

      // Build the user's sector history from their ownership records.
      const userSectors = new Set(
        targetUser.ownershipRecords
          .map((o) => o.enterprise.sector)
          .filter(Boolean)
      );
      const ownedEnterpriseIds = new Set(
        targetUser.ownershipRecords.map((o) => o.enterpriseId)
      );

      const enterprises = await db.enterprise.findMany({
        where: {
          status: { in: ["fundraising_active", "active", "fundraising_closed"] },
          archivedAt: null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          sector: true,
          tier: true,
          stage: true,
          healthScore: true,
          fundraisingGoalEgp: true,
          raisedEgp: true,
          equityUnitPriceEgp: true,
          monthlyRevenueEgp: true,
          monthlyBurnEgp: true,
          grossMarginPct: true,
          lawFirmClientAccountBalanceEgp: true,
        },
        take: 500, // upper bound on scoring set
      });

      const matches = enterprises
        .map((ent) => {
          const runway = computeRunwayMonths(
            ent.lawFirmClientAccountBalanceEgp,
            ent.monthlyBurnEgp
          );
          const breakdown = {
            sector_preference: sectorPreferenceScore(userSectors, ent.sector),
            tier_preference: tierMatchScore(targetUser.riskProfile, ent.tier),
            sts_alignment: stsAlignmentScore(
              targetUser.sovereignTrustScore,
              ent.healthScore
            ),
            risk_profile_match: riskProfileMatchScore(
              targetUser.riskProfile,
              runway,
              ent.grossMarginPct
            ),
            past_participation_history: pastParticipationScore(
              ownedEnterpriseIds.has(ent.id)
            ),
            geographic_proximity: geoProximityScore(targetUser.nationality),
          };
          const score = computeScore(breakdown);
          return {
            enterprise: {
              id: ent.id,
              name: ent.name,
              slug: ent.slug,
              sector: ent.sector,
              tier: ent.tier,
              stage: ent.stage,
              healthScore: ent.healthScore,
            },
            score,
            breakdown,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_RESULTS);

      await audit({
        actorId: user.id,
        action: "matching.read",
        target: `user:${userIdParam}`,
        result: "allowed",
        metadata: {
          mode: "user_to_enterprises",
          scored: enterprises.length,
          returned: matches.length,
        },
        ip,
        userAgent,
      });

      return NextResponse.json({
        ok: true,
        label: LABEL,
        mode: "user_to_enterprises",
        user: {
          id: targetUser.id,
          legalName: targetUser.legalName,
          primaryIntent: targetUser.primaryIntent,
          riskProfile: targetUser.riskProfile,
          sovereignTrustScore: targetUser.sovereignTrustScore,
          nationality: targetUser.nationality,
        },
        weights: WEIGHTS,
        matches,
      });
    }

    // ── Branch 2: Capital Partners ranked for an enterprise ──
    const enterpriseIdVal = enterpriseId as string;
    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseIdVal },
      select: {
        id: true,
        name: true,
        slug: true,
        sector: true,
        tier: true,
        stage: true,
        healthScore: true,
        monthlyBurnEgp: true,
        grossMarginPct: true,
        lawFirmClientAccountBalanceEgp: true,
      },
    });
    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise not found", code: "ENTERPRISE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Authorization: caller must be a member of the enterprise OR an aurienta_rep.
    const isMember = user.memberships.some(
      (m) => m.enterpriseId === enterpriseIdVal
    );
    const isRep = user.memberships.some((m) => m.role === "aurienta_rep");
    if (!isMember && !isRep) {
      await audit({
        actorId: user.id,
        action: "matching.read",
        target: `enterprise:${enterpriseIdVal}`,
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

    const entRunway = computeRunwayMonths(
      enterprise.lawFirmClientAccountBalanceEgp,
      enterprise.monthlyBurnEgp
    );

    // Pull all capital_partner users + their ownership records (sector history).
    const partners = await db.user.findMany({
      where: {
        primaryIntent: "capital_partner",
      },
      select: {
        id: true,
        legalName: true,
        primaryIntent: true,
        riskProfile: true,
        sovereignTrustScore: true,
        nationality: true,
        ownershipRecords: {
          select: {
            enterpriseId: true,
            enterprise: { select: { id: true, sector: true } },
          },
        },
      },
      take: 500, // upper bound
    });

    const matches = partners
      .map((p) => {
        const userSectors = new Set(
          p.ownershipRecords.map((o) => o.enterprise.sector).filter(Boolean)
        );
        const hasHistory = p.ownershipRecords.some(
          (o) => o.enterpriseId === enterpriseIdVal
        );
        const breakdown = {
          sector_preference: sectorPreferenceScore(
            userSectors,
            enterprise.sector
          ),
          tier_preference: tierMatchScore(p.riskProfile, enterprise.tier),
          sts_alignment: stsAlignmentScore(
            p.sovereignTrustScore,
            enterprise.healthScore
          ),
          risk_profile_match: riskProfileMatchScore(
            p.riskProfile,
            entRunway,
            enterprise.grossMarginPct
          ),
          past_participation_history: pastParticipationScore(hasHistory),
          geographic_proximity: geoProximityScore(p.nationality),
        };
        const score = computeScore(breakdown);
        return {
          user: {
            id: p.id,
            legalName: p.legalName,
            primaryIntent: p.primaryIntent,
            riskProfile: p.riskProfile,
            sovereignTrustScore: p.sovereignTrustScore,
            nationality: p.nationality,
          },
          score,
          breakdown,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);

    await audit({
      actorId: user.id,
      action: "matching.read",
      target: `enterprise:${enterpriseIdVal}`,
      result: "allowed",
      metadata: {
        mode: "enterprise_to_users",
        scored: partners.length,
        returned: matches.length,
      },
      ip,
      userAgent,
    });

    return NextResponse.json({
      ok: true,
      label: LABEL,
      mode: "enterprise_to_users",
      enterprise: {
        id: enterprise.id,
        name: enterprise.name,
        slug: enterprise.slug,
        sector: enterprise.sector,
        tier: enterprise.tier,
        stage: enterprise.stage,
        healthScore: enterprise.healthScore,
      },
      weights: WEIGHTS,
      matches,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[GET /api/matching] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to compute match scores", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
