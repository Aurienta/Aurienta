// AURIENTA — Enterprise Discovery Engine (Roadmap Phase 1)
// ═══════════════════════════════════════════════════════════════
// Recommendation engine — NOT auto-investment. Partners manually
// select each enterprise. AURIENTA provides information only.
//
// This complies with Egyptian law (not fund management, not
// deposit-taking) because:
//   - No auto-debit, no auto-diversify
//   - Capital Partner approves each enterprise individually
//   - AURIENTA surfaces relevance, never executes a transaction
//
// Scoring (0-100) — weighted sum of 5 dimensions:
//   1. Risk appetite alignment    25 pts — tier + health rating match
//   2. Sector preference match    20 pts — explicit partner preference
//   3. Investment size fit        20 pts — budget range vs unit price
//   4. Health rating threshold     20 pts — meets minimum health gate
//   5. Diversification potential   15 pts — capital formation stage
//
// All reasons are human-readable strings surfaced in the UI.

import { db } from "@/lib/db";
import { logger } from "@/lib/aurienta/logger";

// ── Types ────────────────────────────────────────────────────────────

export type EnterpriseForScoring = {
  id: string;
  tier: string;
  sector: string;
  healthRating: string | null;
  healthScore: number;
  equityUnitPriceEgp: number;
  raisedEgp: number;
  fundraisingGoalEgp: number;
  minInvestmentEgp: number;
  status: string;
  stage: string;
};

export type DiscoveryProfileForScoring = {
  riskAppetite: string;
  preferredSectors: string;
  preferredTiers: string;
  minHealthRating: string;
  minInvestmentEgp: number;
  maxInvestmentEgp: number;
  targetDiversification: number;
};

export type MatchScoreResult = {
  score: number;
  reasons: string[];
};

// ── Constants ─────────────────────────────────────────────────────────

/** Risk appetite → preferred enterprise tiers (Tier A = Micro, F = JSC). */
const RISK_TIER_PRIMARY: Record<string, string[]> = {
  conservative: ["A", "B"],
  balanced: ["B", "C"],
  growth: ["C", "D", "E"],
  founder_aligned: ["F"],
};

/** Secondary tiers — adjacent risk band. Partial credit. */
const RISK_TIER_SECONDARY: Record<string, string[]> = {
  conservative: ["C"],
  balanced: ["A", "D"],
  growth: ["B", "F"],
  founder_aligned: ["D", "E"],
};

/** Health rating ordering (best → worst). Index 0 = best. */
const HEALTH_RATING_ORDER = [
  "AAA",
  "AA",
  "A",
  "BBB",
  "BB",
  "B",
  "CCC",
  "CC",
  "C",
] as const;

export const RISK_APPETITES = [
  "conservative",
  "balanced",
  "growth",
  "founder_aligned",
] as const;

export type RiskAppetite = (typeof RISK_APPETITES)[number];

export const ALL_TIERS = ["A", "B", "C", "D", "E", "F"] as const;

const MAX_RECOMMENDATIONS = 12;
const SCORE_QUERY_LIMIT = 200;

// ── Helpers ───────────────────────────────────────────────────────────

function parseCommaList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function healthRatingIndex(rating: string | null): number {
  if (!rating) return -1; // unknown — caller decides semantics
  const idx = HEALTH_RATING_ORDER.indexOf(
    rating as (typeof HEALTH_RATING_ORDER)[number]
  );
  return idx; // -1 if not found, else 0..8
}

/** True if `enterpriseRating` is at least as good as `minRating`. */
function healthRatingMet(
  enterpriseRating: string | null,
  minRating: string | null | undefined
): boolean {
  if (!minRating) return true; // no floor set
  if (!enterpriseRating) return false; // enterprise unrated but a floor exists
  const entIdx = healthRatingIndex(enterpriseRating);
  const minIdx = healthRatingIndex(minRating);
  if (entIdx < 0 || minIdx < 0) return false; // unknown ratings — fail safe
  return entIdx <= minIdx; // lower index = better
}

// ── Scoring ───────────────────────────────────────────────────────────

/**
 * Compute a 0-100 match score for an enterprise given a partner's
 * DiscoveryProfile. Returns the integer score plus human-readable
 * reasons explaining the score (surfaced as badges in the UI).
 *
 * This is a relevance ranking, NOT investment advice.
 */
export function computeMatchScore(
  enterprise: EnterpriseForScoring,
  profile: DiscoveryProfileForScoring
): MatchScoreResult {
  const reasons: string[] = [];
  let score = 0;

  // ── 1. Risk appetite alignment (tier + health) — 25 pts ──
  const primary = RISK_TIER_PRIMARY[profile.riskAppetite] ?? [];
  const secondary = RISK_TIER_SECONDARY[profile.riskAppetite] ?? [];
  const meetsHealth = healthRatingMet(
    enterprise.healthRating,
    profile.minHealthRating
  );
  const isPrimaryTier = primary.includes(enterprise.tier);
  const isSecondaryTier = secondary.includes(enterprise.tier);

  let riskAlign = 0.15;
  if (isPrimaryTier && meetsHealth) {
    riskAlign = 1.0;
    reasons.push(
      `Tier ${enterprise.tier} matches your ${profile.riskAppetite.replace("_", " ")} risk appetite`
    );
  } else if (isPrimaryTier) {
    riskAlign = 0.7;
    reasons.push(`Tier ${enterprise.tier} fits your risk appetite`);
  } else if (isSecondaryTier && meetsHealth) {
    riskAlign = 0.55;
    reasons.push(
      `Tier ${enterprise.tier} is adjacent to your ${profile.riskAppetite.replace("_", " ")} preference`
    );
  } else if (isSecondaryTier) {
    riskAlign = 0.35;
  }
  score += Math.round(riskAlign * 25);

  // ── 2. Sector preference match — 20 pts ──
  const preferredSectors = parseCommaList(profile.preferredSectors);
  if (preferredSectors.length === 0) {
    score += 10; // neutral — no preference declared
  } else if (preferredSectors.includes(enterprise.sector)) {
    score += 20;
    reasons.push(`Sector "${enterprise.sector}" is in your preferences`);
  } else {
    score += 4;
  }

  // ── 3. Investment size fit — 20 pts ──
  // The minimum amount the partner must commit to enter this enterprise:
  const minEntryEgp = Math.max(
    enterprise.minInvestmentEgp,
    enterprise.equityUnitPriceEgp
  );
  const budgetFloor = profile.minInvestmentEgp;
  const budgetCeiling = profile.maxInvestmentEgp;

  if (budgetCeiling < minEntryEgp) {
    score += 2; // partner cannot afford minimum entry
    reasons.push(`Minimum entry (${egpShort(minEntryEgp)}) exceeds your max budget`);
  } else if (
    budgetFloor <= enterprise.equityUnitPriceEgp &&
    enterprise.equityUnitPriceEgp <= budgetCeiling
  ) {
    score += 20;
    reasons.push("Equity unit price fits your budget range");
  } else if (budgetFloor <= minEntryEgp && minEntryEgp <= budgetCeiling) {
    score += 14;
    reasons.push("Minimum investment fits your budget");
  } else {
    score += 8;
  }

  // ── 4. Health rating threshold — 20 pts ──
  if (meetsHealth) {
    score += 20;
    if (
      enterprise.healthRating &&
      profile.minHealthRating &&
      enterprise.healthRating !== profile.minHealthRating
    ) {
      reasons.push(
        `Health rating ${enterprise.healthRating} exceeds your ${profile.minHealthRating} minimum`
      );
    } else if (enterprise.healthRating) {
      reasons.push(`Health rating ${enterprise.healthRating} meets your threshold`);
    }
  } else {
    // Below threshold — penalize but don't fully exclude; partner may still choose to see it.
    score += 0;
    if (enterprise.healthRating) {
      reasons.push(
        `Below your ${profile.minHealthRating || "—"} health rating threshold (${enterprise.healthRating})`
      );
    } else {
      reasons.push("Enterprise has no health rating yet");
    }
  }

  // ── 5. Diversification potential — 15 pts ──
  // Active capital formation = high growth/diversification potential.
  // Lower raise progress = earlier entry opportunity.
  if (enterprise.status === "fundraising_active") {
    score += 8;
    reasons.push("Active capital formation — early entry window");
  } else if (enterprise.status === "active") {
    score += 5;
  } else {
    score += 2;
  }

  const goal = enterprise.fundraisingGoalEgp > 0 ? enterprise.fundraisingGoalEgp : 1;
  const raisedPct = Math.min(enterprise.raisedEgp / goal, 1);
  if (raisedPct < 0.25) {
    score += 7;
    reasons.push(`Early in capital formation (${Math.round(raisedPct * 100)}% raised)`);
  } else if (raisedPct < 0.5) {
    score += 5;
  } else if (raisedPct < 0.8) {
    score += 3;
  } else {
    score += 1;
  }

  // Clamp 0-100 (rounding already applied per-stage).
  score = Math.max(0, Math.min(100, score));
  return { score, reasons };
}

// Small EGP formatter for reasons — keeps them readable in narrow badges.
function egpShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M EGP`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k EGP`;
  return `${n} EGP`;
}

// ── Recommendation Engine ─────────────────────────────────────────────

/** Default balanced profile for first-time users. */
export const DEFAULT_PROFILE = {
  riskAppetite: "balanced" as const,
  preferredSectors: "",
  preferredTiers: "A,B,C",
  minHealthRating: "BBB",
  minInvestmentEgp: 50,
  maxInvestmentEgp: 10000,
  targetDiversification: 5,
} satisfies DiscoveryProfileForScoring;

/**
 * Load (or create) the partner's DiscoveryProfile and compute the
 * current set of recommendations. DiscoveryMatch rows are upserted so
 * that `dismissed` and `invested` flags survive re-scoring.
 *
 * Returns at most MAX_RECOMMENDATIONS matches sorted by score desc.
 */
export async function recommendEnterprises(userId: string) {
  // 1. Load or create profile (resolve to a definite non-null value so the
  //    closure inside .map() below can use it without non-null assertions).
  const loaded = await db.discoveryProfile.findUnique({
    where: { userId },
  });
  const profile: DiscoveryProfileForScoring = loaded ?? (await db.discoveryProfile.create({
    data: { userId, ...DEFAULT_PROFILE },
  }));
  if (!loaded) {
    logger.info("discovery.profile.created", { userId });
  }

  // 2. Determine tier filter
  const preferredTiers = parseCommaList(profile.preferredTiers);
  const tiersToQuery =
    preferredTiers.length > 0 ? preferredTiers : [...ALL_TIERS];

  // 3. Query candidate enterprises
  const enterprises = await db.enterprise.findMany({
    where: {
      status: { in: ["active", "fundraising_active"] },
      archivedAt: null,
      tier: { in: tiersToQuery },
    },
    select: {
      id: true,
      tier: true,
      sector: true,
      healthRating: true,
      healthScore: true,
      equityUnitPriceEgp: true,
      raisedEgp: true,
      fundraisingGoalEgp: true,
      minInvestmentEgp: true,
      status: true,
      stage: true,
    },
    take: SCORE_QUERY_LIMIT,
  });

  // 4. Score each enterprise
  const scored = enterprises
    .map((ent) => {
      const result = computeMatchScore(ent, profile);
      return { enterprise: ent, score: result.score, reasons: result.reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RECOMMENDATIONS);

  // 5. Upsert DiscoveryMatch rows (preserve dismissed/invested flags)
  const matches = await db.$transaction(async (tx) => {
    const existing = await tx.discoveryMatch.findMany({
      where: { userId },
      select: { id: true, enterpriseId: true, dismissed: true, invested: true },
    });
    const existingByEnt = new Map(existing.map((m) => [m.enterpriseId, m]));

    const results: Array<{
      id: string;
      enterpriseId: string;
      matchScore: number;
      matchReasons: string;
      dismissed: boolean;
      invested: boolean;
      createdAt: Date;
    }> = [];

    for (const s of scored) {
      const reasonsJson = JSON.stringify(s.reasons);
      const existingMatch = existingByEnt.get(s.enterprise.id);
      if (existingMatch) {
        const updated = await tx.discoveryMatch.update({
          where: { id: existingMatch.id },
          data: {
            matchScore: s.score,
            matchReasons: reasonsJson,
          },
        });
        results.push({
          id: updated.id,
          enterpriseId: updated.enterpriseId,
          matchScore: updated.matchScore,
          matchReasons: updated.matchReasons,
          dismissed: updated.dismissed,
          invested: updated.invested,
          createdAt: updated.createdAt,
        });
      } else {
        const created = await tx.discoveryMatch.create({
          data: {
            userId,
            enterpriseId: s.enterprise.id,
            matchScore: s.score,
            matchReasons: reasonsJson,
          },
        });
        results.push({
          id: created.id,
          enterpriseId: created.enterpriseId,
          matchScore: created.matchScore,
          matchReasons: created.matchReasons,
          dismissed: created.dismissed,
          invested: created.invested,
          createdAt: created.createdAt,
        });
      }
    }
    return results;
  });

  logger.info("discovery.recommend", {
    userId,
    candidates: enterprises.length,
    returned: matches.length,
  });

  return matches;
}

// ── Match lifecycle helpers ────────────────────────────────────────────

/** Error thrown by dismissMatch / markInvested — translated to HTTP by API route. */
export class DiscoveryMatchError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "DiscoveryMatchError";
  }
}

/**
 * Mark a DiscoveryMatch as dismissed (hidden from the active list).
 * Verifies ownership — throws DiscoveryMatchError(404) if not found,
 * or DiscoveryMatchError(403) if the match belongs to another user.
 */
export async function dismissMatch(
  matchId: string,
  userId: string
): Promise<void> {
  const match = await db.discoveryMatch.findUnique({
    where: { id: matchId },
    select: { userId: true, dismissed: true },
  });
  if (!match) {
    throw new DiscoveryMatchError(404, "Match not found");
  }
  if (match.userId !== userId) {
    throw new DiscoveryMatchError(403, "Forbidden: not your match");
  }
  if (match.dismissed) return; // idempotent
  await db.discoveryMatch.update({
    where: { id: matchId },
    data: { dismissed: true },
  });
}

/**
 * Mark a DiscoveryMatch as invested (partner manually invested off-platform
 * or via a separate opportunities flow). Verifies ownership.
 */
export async function markInvested(
  matchId: string,
  userId: string
): Promise<void> {
  const match = await db.discoveryMatch.findUnique({
    where: { id: matchId },
    select: { userId: true, invested: true },
  });
  if (!match) {
    throw new DiscoveryMatchError(404, "Match not found");
  }
  if (match.userId !== userId) {
    throw new DiscoveryMatchError(403, "Forbidden: not your match");
  }
  if (match.invested) return; // idempotent
  await db.discoveryMatch.update({
    where: { id: matchId },
    data: { invested: true },
  });
}
