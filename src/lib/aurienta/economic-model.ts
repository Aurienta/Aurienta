// AURIENTA — Economic Model Fixes (P0 #10, #11, #12, M-01, M-02, M-03, M-04)
//
// These functions implement the economic model corrections from the
// line-by-line audit. They are the canonical implementations referenced
// by the documentation.

import { db } from "@/lib/db";

// ═══════════════════════════════════════════════════════════════════
// M-01: Fundamental Pricing — Growth factor definition + clamp
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate the Growth factor for the fundamental pricing formula.
 *
 * Formula: Price = (EPS × Sector P/E × Growth) + (0.3 × NAV/share)
 *
 * Growth = 1 + (YoY_revenue_growth_pct / 100), clamped to [0.8, 1.5]
 *
 * - Growth of 0% → factor 1.0 (no adjustment)
 * - Growth of 15% → factor 1.15 (15% premium)
 * - Growth of 50% → factor 1.5 (capped — prevents speculative pricing)
 * - Growth of -20% → factor 0.8 (floored — prevents undervaluation)
 *
 * The clamp is NON-NEGOTIABLE. Without it, a 200% growth year produces
 * a 3× multiplier, which is speculative.
 */
export function calculateGrowthFactor(yoyRevenueGrowthPct: number): number {
  const raw = 1 + (yoyRevenueGrowthPct / 100);
  return Math.max(0.8, Math.min(1.5, raw));
}

/**
 * Full fundamental pricing formula with clamped Growth.
 */
export function calculateFundamentalPrice(params: {
  eps: number; // earnings per share (EGP)
  sectorPE: number; // sector P/E ratio
  yoyRevenueGrowthPct: number; // year-over-year revenue growth (%)
  navPerShare: number; // net asset value per share (EGP)
}): number {
  const growth = calculateGrowthFactor(params.yoyRevenueGrowthPct);
  return (params.eps * params.sectorPE * growth) + (0.3 * params.navPerShare);
}

// ═══════════════════════════════════════════════════════════════════
// M-02: Pre-Revenue Valuation Protocol (PVP) — Volume 6 §6.8
// ═══════════════════════════════════════════════════════════════════

export type PvpMethod = "cost_to_date" | "milestone_indexed";

/**
 * Calculate the price per Equity Unit for a pre-revenue enterprise.
 *
 * Method A (Cost-to-Date, default):
 *   Price = (Founder capital + verified sweat-equity at market rate + grants)
 *           / total Equity Units issued
 *
 * Method B (Milestone-Indexed, requires Constitutional Council approval):
 *   Price = Base × (1 + 0.15 × verified_milestones)
 *   Base set at incorporation, capped at 10× base
 */
export function calculatePreRevenuePrice(params: {
  method: PvpMethod;
  // Method A
  founderCapitalEgp?: number;
  verifiedSweatEquityEgp?: number;
  grantsEgp?: number;
  totalEquityUnits?: number;
  // Method B
  basePriceEgp?: number;
  verifiedMilestones?: number;
}): { pricePerUnit: number; method: PvpMethod; detail: string } {
  if (params.method === "cost_to_date") {
    const totalCapital =
      (params.founderCapitalEgp ?? 0) +
      (params.verifiedSweatEquityEgp ?? 0) +
      (params.grantsEgp ?? 0);
    const units = params.totalEquityUnits ?? 1;
    const price = totalCapital / units;
    return {
      pricePerUnit: Math.round(price * 100) / 100,
      method: "cost_to_date",
      detail: `Cost-to-Date: ${(totalCapital / 1000).toFixed(0)}K EGP / ${units} units = ${price.toFixed(2)} EGP/unit`,
    };
  }

  // Method B: Milestone-Indexed
  const base = params.basePriceEgp ?? 50; // default 50 EGP
  const milestones = params.verifiedMilestones ?? 0;
  const rawPrice = base * (1 + 0.15 * milestones);
  const cappedPrice = Math.min(rawPrice, base * 10); // cap at 10× base
  return {
    pricePerUnit: Math.round(cappedPrice * 100) / 100,
    method: "milestone_indexed",
    detail: `Milestone-Indexed: ${base} EGP × (1 + 0.15 × ${milestones}) = ${rawPrice.toFixed(2)} EGP (capped at ${base * 10})`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// M-03: Tier E PI Compensation — Volume 4 §4.6.1
// ═══════════════════════════════════════════════════════════════════

export type PICompensationPlan = {
  baseSalaryEgp: number;
  tierMultiplier: number;
  milestoneBonusStructure: { milestone: string; bonusEgp: number }[];
  equityParticipation: {
    type: "non_voting_equity" | "revenue_share" | "none";
    percentage: number;
    vestingYears: number;
    note: string;
  };
};

/**
 * Calculate the compensation plan for a Tier E Principal Investigator (PI).
 *
 * The PI holds 0% voting equity (university TTO holds the equity).
 * Compensation is:
 * 1. Salary (AI Salary Engine, Tier E multiplier 0.9)
 * 2. Milestone bonus structure
 * 3. Non-voting equity participation (up to 5%, vesting 4 years)
 *    OR revenue share (0.5-2% of revenue for 5 years post-graduation)
 *    (if university does not permit PI equity)
 */
export function calculatePICompensation(params: {
  baseSalaryEgp: number;
  performanceScore: number; // 0-100
  regionalAdjustment: number; // 0.8-1.2
  universityPermitsEquity: boolean;
  verifiedMilestones: number;
}): PICompensationPlan {
  const tierMultiplier = 0.9; // Tier E
  const profitFactor = 1.0; // pre-revenue, no profit adjustment

  const baseSalary = Math.round(
    params.baseSalaryEgp * tierMultiplier *
    (params.performanceScore / 100) *
    params.regionalAdjustment *
    profitFactor
  );

  const milestoneBonusStructure = [
    { milestone: "MVP completion", bonusEgp: 10000 },
    { milestone: "First customer", bonusEgp: 15000 },
    { milestone: "Patent filing", bonusEgp: 20000 },
    { milestone: "Pre-seed round", bonusEgp: 25000 },
    { milestone: "Graduation readiness", bonusEgp: 50000 },
  ].slice(0, Math.min(params.verifiedMilestones + 2, 5));

  const equityParticipation = params.universityPermitsEquity
    ? {
        type: "non_voting_equity" as const,
        percentage: Math.min(5, 2 + params.verifiedMilestones * 0.5),
        vestingYears: 4,
        note: "Non-voting equity participation, vesting over 4 years, subject to university TTO agreement.",
      }
    : {
        type: "revenue_share" as const,
        percentage: Math.min(2, 0.5 + params.verifiedMilestones * 0.3),
        vestingYears: 5,
        note: "Revenue share (0.5-2% of enterprise revenue) for 5 years post-graduation.",
      };

  return {
    baseSalaryEgp: baseSalary,
    tierMultiplier,
    milestoneBonusStructure,
    equityParticipation,
  };
}

// ═══════════════════════════════════════════════════════════════════
// M-04: Tier A Manager Rule — Reframed (anti-fraud without ungovernable)
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if a Tier A founder can approve an expense as sole-signature.
 *
 * REFRAMED RULE (M-04):
 * "Tier A founder cannot serve as SOLE-SIGNATURE manager for expenses
 *  >1% of capital in the first 12 months. Dual-signature with
 *  accounting_firm_rep is required."
 *
 * This preserves the anti-fraud intent without making the enterprise
 * ungovernable (hiring a manager for a 3M EGP micro-enterprise is
 * economically impossible).
 */
export function checkTierAFounderExpenseAuthority(params: {
  tier: string;
  role: string;
  isFounder: boolean;
  expenseAmountEgp: number;
  capitalEgp: number;
  monthsSinceIncorporation: number;
}): { canApproveSolo: boolean; requiresDualSig: boolean; reason: string } {
  const { tier, role, isFounder, expenseAmountEgp, capitalEgp, monthsSinceIncorporation } = params;
  const pctOfCapital = (expenseAmountEgp / capitalEgp) * 100;

  // Only applies to Tier A founders in the first 12 months
  if (tier !== "A" || !isFounder || monthsSinceIncorporation >= 12) {
    return {
      canApproveSolo: pctOfCapital < 1,
      requiresDualSig: pctOfCapital >= 1 && pctOfCapital <= 10,
      reason: "Standard expense authority rules apply.",
    };
  }

  // Tier A founder, first 12 months:
  if (pctOfCapital < 1) {
    return {
      canApproveSolo: true,
      requiresDualSig: false,
      reason: `Expense <1% of capital (${pctOfCapital.toFixed(2)}%) — founder can approve solo.`,
    };
  }

  return {
    canApproveSolo: false,
    requiresDualSig: true,
    reason: `Tier A founder (first 12 months): expense is ${pctOfCapital.toFixed(2)}% of capital — dual signature with accounting_firm_rep required (M-04 reframed rule).`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// E-04: Canonical Fee Schedule
// ═══════════════════════════════════════════════════════════════════

export type FeeSchedule = {
  tier: string;
  establishmentFee: number;
  annualPlatformFeePct: number;
  annualPlatformFeeCapEgp: number;
  successFeePct: number;
  note: string;
};

export const CANONICAL_FEE_SCHEDULE: FeeSchedule[] = [
  { tier: "A", establishmentFee: 0, annualPlatformFeePct: 0.5, annualPlatformFeeCapEgp: 15000, successFeePct: 2, note: "Micro-enterprise. Capped at 15K EGP annual." },
  { tier: "B", establishmentFee: 0, annualPlatformFeePct: 0.5, annualPlatformFeeCapEgp: 125000, successFeePct: 2, note: "Small enterprise. Capped at 125K EGP annual." },
  { tier: "C", establishmentFee: 0, annualPlatformFeePct: 1.0, annualPlatformFeeCapEgp: 500000, successFeePct: 3, note: "Growth enterprise. Capped at 500K EGP annual." },
  { tier: "D", establishmentFee: 0, annualPlatformFeePct: 1.0, annualPlatformFeeCapEgp: 500000, successFeePct: 3, note: "Established enterprise. Capped at 500K EGP annual." },
  { tier: "E", establishmentFee: 0, annualPlatformFeePct: 0, annualPlatformFeeCapEgp: 50000, successFeePct: 1, note: "University SPV. Grant-funded, flat 50K EGP. Does NOT violate pricing constraint (grant budget, not capital raised)." },
  { tier: "F", establishmentFee: 0, annualPlatformFeePct: 1.5, annualPlatformFeeCapEgp: 0, successFeePct: 3, note: "Joint Stock (pre-EGX). No cap on annual fee." },
];

export function getFeeForTier(tier: string): FeeSchedule | undefined {
  return CANONICAL_FEE_SCHEDULE.find(f => f.tier === tier);
}
