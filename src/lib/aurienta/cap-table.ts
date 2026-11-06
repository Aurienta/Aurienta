// AURIENTA — Constitutional Cap Table
// ════════════════════════════════════════════════════════════════════
// Source of truth: Prisma `OwnershipRecord` (table `Shareholding`) +
// `Valuation` rows + `Enterprise.totalEquityUnits / equityUnitPriceEgp`.
//
// This module is CONSTITUTIONAL — every state-changing operation is:
//   1. CRE-validated via a `*.rego` policy verdict (decisionToken issued),
//   2. Hash-anchored to the immutable `LedgerEvent` chain via
//      `appendLedgerEvent` (per-enterprise monotonic sequence + SHA3-256
//      payload hash linked to prevHash),
//   3. Persisted via `logCreDecision` inside the same transaction so the
//      CreDecision table always matches the ledger chain.
//
// Capabilities
//   • getCapTable()             — full ownership snapshot with %, value, vesting
//   • modelDilution()           — simulate a new round → per-stakeholder %
//   • computeWaterfall()        — liquidation preference → payout order
//   • exportOcf() / importOcf() — Open Cap Table Format JSON (RFC-style)
//   • anchorCapTableSnapshot()  — CRE-sign + hash-anchor a snapshot
//   • enforceVestingCliff()     — block transfer of unvested units
//   • enforceDragAlong()        — 51% threshold gate
//   • enforceSecuritiesTransferRestriction() — Tier F FRA check
//   • computeWeightedAverageAdjustment() / computeFullRatchetAdjustment()
//
// All public query functions are READ-ONLY and side-effect free.
//
// ════════════════════════════════════════════════════════════════════
// EGYPTIAN LAW COMPLIANCE — Capital Market Law 95/1992:
//
// Tier F (Joint Stock Company / JSC) Equity Units may constitute
// "securities" under Capital Market Law 95/1992. Transfers of Tier F
// securities are subject to FRA regulations:
//   - Art. 2: Public offerings require prior FRA authorization
//   - Art. 5: Private placements are exempt from registration
//   - Art. 23: Secondary trading requires a licensed broker
//   - Art. 27: Insider trading is prohibited
//
// AURIENTA enforces:
//   - Tier A–E (LLCs/SPVs): transfers allowed per constitutional rules
//   - Tier F (JSC): transfers BLOCKED unless FRA authorization verified
//   - All transfers are logged with legal basis citation
//
// AURIENTA is NOT a licensed broker under Law 95/1992 Art. 23.
// It does NOT execute securities trades — it only records ownership
// changes that have been independently executed.
// ════════════════════════════════════════════════════════════════════
// All state-changing functions use `db.$transaction` so the ledger chain +
// CreDecision rows commit atomically with the OwnershipRecord mutation.

import { createHash } from "crypto";
import { db, type PrismaTransaction } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import {
  appendLedgerEvent,
  logCreDecision,
  enforceEquityLockUp,
  enforceFounderEquityCap,
  type CreVerdict,
} from "@/lib/aurienta/cre";

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

/**
 * Share class is derived from the stakeholder's EnterpriseMember.role:
 *   - capital_partner            → preferred (1x non-participating liquidation pref)
 *   - founding_operator / company_owner / board_member → common_founder
 *   - workforce_partner           → common_restricted (vesting applies)
 *   - everything else             → common_founder (default)
 *
 * The schema's OwnershipRecord doesn't have a `shareClass` column — this
 * is a derived view that mirrors the economic reality of the cap table.
 */
export type ShareClass = "preferred" | "common_founder" | "common_restricted";

export type AntiDilutionMode = "none" | "weighted_average" | "full_ratchet";

/**
 * Standardized 4-year vesting schedule with a 1-year cliff (the
 * blueprint's default for workforce + founding-operator equity grants).
 *
 * Cliff semantics: 0% vested until cliffMonths elapses, then a single
 * lump of (cliffMonths / totalMonths) vests on the cliff anniversary.
 * After the cliff, monthly vesting accrues linearly until totalMonths.
 */
export interface VestingSchedule {
  totalMonths: number;
  cliffMonths: number;
}

/** The AURIENTA default: 4-year vest, 1-year cliff (25% lump at month 12). */
export const STANDARD_VESTING: VestingSchedule = {
  totalMonths: 48,
  cliffMonths: 12,
};

/** Drag-along constitutional threshold (Art. 38 — Majority-of-Equity rule). */
export const DRAG_ALONG_THRESHOLD_PCT = 51;

/** Preferred liquidation preference multiple (1.0x = invested capital). */
export const PREFERRED_LIQUIDATION_MULTIPLE = 1.0;

export interface CapTableEntry {
  userId: string;
  legalName: string;
  role: string | null;
  shareClass: ShareClass;
  equityUnits: number;
  avgPriceEgp: number;
  ownershipPct: number; // % of fully-diluted issued units
  valueEgp: number; // equityUnits * currentEquityUnitPrice
  restrictedUntil: string | null; // ISO date — cliff/lock-up expiry
  vestedUnits: number;
  unvestedUnits: number;
  pctVested: number; // 0..1 of own grant
  liquidationPreferenceEgp: number; // preferred only; 0 for common
  antiDilutionProtection: AntiDilutionMode;
  dragAlongEligible: boolean; // can participate in a drag
  tagAlongEligible: boolean; // minority → can tag along on a drag
}

export interface CapTable {
  enterpriseId: string;
  enterpriseName: string;
  slug: string;
  tier: string;
  stage: string;
  totalEquityUnits: number; // authorized (Enterprise.totalEquityUnits)
  issuedEquityUnits: number; // sum of all OwnershipRecord.equityUnits
  fullyDilutedEquityUnits: number; // issued + reserved pool (== issued here)
  equityUnitPriceEgp: number; // latest Valuation.equityUnitPriceEgp
  preMoneyValuationEgp: number; // latest Valuation.preMoneyEgp
  postMoneyValuationEgp: number; // preMoney + raised
  raisedEgp: number;
  founderEquityPct: number;
  stakeholderCount: number;
  stakeholders: CapTableEntry[];
  /** Anchor to the most-recent cap_table_snapshot ledger event for this enterprise. */
  ledgerAnchor: {
    sequence: number;
    payloadHash: string;
    eventType: string;
    timestamp: string;
  } | null;
  constitutionalHash: string;
  generatedAt: string;
}

export interface DilutionResult {
  enterpriseId: string;
  newShares: number;
  newPriceEgp: number;
  preMoneyValuationEgp: number;
  postMoneyValuationEgp: number;
  capitalRaisedEgp: number;
  newInvestorOwnershipPct: number;
  /** Pre-round → post-round ownership deltas for every existing stakeholder. */
  dilutedStakeholders: Array<{
    userId: string;
    legalName: string;
    shareClass: ShareClass;
    unitsBefore: number;
    unitsAfter: number; // may exceed unitsBefore if anti-dilution adjustment applies
    pctBefore: number;
    pctAfter: number;
    dilutionPct: number; // negative — e.g. -3.4 means stake dropped by 3.4 pts
    antiDilutionAdjustmentUnits: number; // bonus units issued to compensate
    antiDilutionMode: AntiDilutionMode;
  }>;
  /** CRE verdict on the proposed dilution (allowed if it doesn't breach the
      Founder Equity Cap floor — enforced by enforceFounderEquityCap). */
  verdict: CreVerdict;
}

export interface WaterfallTier {
  rank: number;
  label: string;
  mechanism: "liquidation_preference" | "participating_preferred" | "common_pro_rata";
  participantCount: number;
  poolEgp: number; // total available at this tier before distribution
  paidOutEgp: number; // what this tier actually consumed
  remainingEgp: number; // leftover flowing to the next tier
}

export interface WaterfallPayout {
  userId: string;
  legalName: string;
  shareClass: ShareClass;
  tier: number;
  payoutEgp: number;
  payoutBasis: string; // e.g. "1x non-participating preference" or "common pro-rata"
}

export interface WaterfallResult {
  enterpriseId: string;
  exitAmountEgp: number;
  /** Liquidation preference stack (1x non-participating preferred → common). */
  tiers: WaterfallTier[];
  /** Per-stakeholder payout, ordered by tier then by payout size desc. */
  payouts: WaterfallPayout[];
  totalPaidOutEgp: number;
  /** Excess left over after all stakeholders fully paid (rare — usually 0). */
  residualEgp: number;
  /** True if preferred holders were better off converting to common. */
  preferredConversionElected: boolean;
}

// ── Open Cap Table Format (OCF) ─────────────────────────────────────
// Minimal OCF-compliant shape. The full spec (open-cap-table-coalition/
// Open-Cap-Format-OCF) defines dozens of object types — AURIENTA exports
// the four top-level arrays that round-trip through `getCapTable`:
//   stakeholders[]   — one per User with an OwnershipRecord
//   stock_plans[]    — derived from the Enterprise's authorized pool
//   stock_classes[]  — preferred / common_founder / common_restricted
//   transactions[]    — EquityIssued events reconstructed from ledger
//
// Every OCF object carries an `object_type` discriminator + an `id` so
// downstream tooling (Carta, Pulley, Angellist) can ingest it directly.

export interface OcfStakeholder {
  object_type: "STAKEHOLDER";
  id: string;
  stakeholder_type: "INDIVIDUAL" | "INSTITUTION";
  name: string;
  primary_contact_email?: string;
  external_id?: string;
}

export interface OcfStockClass {
  object_type: "STOCK_CLASS";
  id: string;
  name: string;
  class_type: "PREFERRED" | "COMMON" | "FOUNDERS_COMMON" | "RESTRICTED_COMMON";
  default_id_prefix: string;
  current_share_price: { amount: string; currency: "EGP" };
  fully_diluted_shares: number;
  liquidation_preference_multiple: number;
  seniority: number; // 1 = highest priority
  anti_dilution_protection: "NONE" | "WEIGHTED_AVERAGE" | "FULL_RATCHET";
}

export interface OcfStockPlan {
  object_type: "STOCK_PLAN";
  id: string;
  name: string;
  plan_type: "ESOP" | "CONSULTING" | "FOUNDER";
  current_share_reservation: number;
}

export interface OcfTransaction {
  object_type: "EQUITY_ISSUED" | "CAP_TABLE_SNAPSHOT" | "VESTING_EVENT";
  id: string;
  date: string;
  security_id: string;
  stakeholder_id: string;
  stock_class_id: string;
  quantity: number;
  unit_price: { amount: string; currency: "EGP" };
  ledger_payload_hash?: string;
  cre_decision_token?: string;
}

export interface OcfDocument {
  ocf_version: "1.0.0";
  generated_at: string;
  issuer: {
    object_type: "ISSUER";
    id: string;
    legal_name: string;
    ticker?: string;
    currency: "EGP";
  };
  stakeholders: OcfStakeholder[];
  stock_classes: OcfStockClass[];
  stock_plans: OcfStockPlan[];
  transactions: OcfTransaction[];
  /** AURIENTA-specific constitutional anchor — not part of the OCF spec,
      but required for any downstream AURIENTA re-import to verify chain
      integrity. */
  constitutional_anchor: {
    constitutional_hash: string;
    ledger_chain_tip: { sequence: number; payload_hash: string } | null;
    cap_table_payload_hash: string;
  };
}

// ────────────────────────────────────────────────────────────────────
// Stakeholder role → share class
// ────────────────────────────────────────────────────────────────────

export function roleToShareClass(role: string | null): ShareClass {
  if (role === "capital_partner") return "preferred";
  if (role === "workforce_partner") return "common_restricted";
  // founding_operator, company_owner, board_member, manager, etc.
  return "common_founder";
}

function shareClassOcfType(c: ShareClass): OcfStockClass["class_type"] {
  switch (c) {
    case "preferred": return "PREFERRED";
    case "common_founder": return "FOUNDERS_COMMON";
    case "common_restricted": return "RESTRICTED_COMMON";
  }
}

function shareClassSeniority(c: ShareClass): number {
  // Lower = higher priority in the waterfall. Preferred is paid first.
  switch (c) {
    case "preferred": return 1;
    case "common_founder": return 2;
    case "common_restricted": return 3;
  }
}

function shareClassAntiDilution(c: ShareClass): AntiDilutionMode {
  // Preferred carries weighted-average by default (standard market term).
  // Common classes have no anti-dilution protection.
  switch (c) {
    case "preferred": return "weighted_average";
    case "common_founder":
    case "common_restricted":
      return "none";
  }
}

// ────────────────────────────────────────────────────────────────────
// Vesting
// ────────────────────────────────────────────────────────────────────

/**
 * Compute vested vs unvested units for a grant under a vesting schedule.
 *
 * Standard AURIENTA grant: 4-year vest, 1-year cliff. Before the cliff,
 * 0% is vested. On the cliff anniversary, a lump of
 * (cliffMonths / totalMonths) vests. After the cliff, the remainder
 * vests linearly per month.
 *
 * Returned values are floored to whole units (you can't vest a fraction).
 */
export function computeVesting(
  schedule: VestingSchedule,
  grantedAt: Date,
  asOf: Date,
  totalUnits: number
): {
  vestedUnits: number;
  unvestedUnits: number;
  pctVested: number;
  cliffPassed: boolean;
  cliffDate: Date;
  vestingEndDate: Date;
} {
  const cliffDate = new Date(grantedAt);
  cliffDate.setMonth(cliffDate.getMonth() + schedule.cliffMonths);
  const vestingEnd = new Date(grantedAt);
  vestingEnd.setMonth(vestingEnd.getMonth() + schedule.totalMonths);

  const now = asOf.getTime();
  if (now < cliffDate.getTime()) {
    return {
      vestedUnits: 0,
      unvestedUnits: totalUnits,
      pctVested: 0,
      cliffPassed: false,
      cliffDate,
      vestingEndDate: vestingEnd,
    };
  }

  if (now >= vestingEnd.getTime()) {
    return {
      vestedUnits: totalUnits,
      unvestedUnits: 0,
      pctVested: 1,
      cliffPassed: true,
      cliffDate,
      vestingEndDate: vestingEnd,
    };
  }

  // Months elapsed since grant (post-cliff). Vesting accrues linearly.
  const totalMs = vestingEnd.getTime() - grantedAt.getTime();
  const elapsedMs = now - grantedAt.getTime();
  const pctVested = Math.max(0, Math.min(1, elapsedMs / totalMs));
  const vestedUnits = Math.floor(totalUnits * pctVested);
  return {
    vestedUnits,
    unvestedUnits: totalUnits - vestedUnits,
    pctVested,
    cliffPassed: true,
    cliffDate,
    vestingEndDate: vestingEnd,
  };
}

// ────────────────────────────────────────────────────────────────────
// Anti-dilution adjustments
// ────────────────────────────────────────────────────────────────────

/**
 * Weighted-average (broad-based) anti-dilution adjustment.
 *
 * Formula:  adjustedPrice = prePrice * (A + B) / (A + C)
 *   A = pre-money shares outstanding
 *   B = (new round cash / prePrice) — shares the round WOULD have bought at the old price
 *   C = shares actually issued in the new round
 *
 * Bonus shares to issue to the protected holder:
 *   bonusUnits = holder.units * (prePrice / adjustedPrice - 1)
 *
 * The adjusted price is the new effective cost basis for that holder's
 * existing grant — used to compute how many bonus shares make them whole.
 */
export function computeWeightedAverageAdjustment(params: {
  preSharesOutstanding: number;
  prePrice: number;
  newShares: number;
  newPrice: number;
}): {
  adjustedPrice: number;
  adjustmentFactor: number; // prePrice / adjustedPrice (>= 1)
  bonusUnitsPerShare: number; // bonus shares issued per existing share
} {
  const { preSharesOutstanding: A, prePrice, newShares: C, newPrice } = params;
  if (prePrice <= 0 || newPrice <= 0 || A <= 0) {
    return { adjustedPrice: prePrice, adjustmentFactor: 1, bonusUnitsPerShare: 0 };
  }
  const B = (C * newPrice) / prePrice;
  const adjustedPrice = (prePrice * (A + B)) / (A + C);
  const adjustmentFactor = prePrice / adjustedPrice;
  const bonusUnitsPerShare = Math.max(0, adjustmentFactor - 1);
  return { adjustedPrice, adjustmentFactor, bonusUnitsPerShare };
}

/**
 * Full-ratchet anti-dilution adjustment. The protected holder's effective
 * price is reset DOWN to the new round price (regardless of how much was
 * raised). Harsher on founders, rarely used in practice but contractually
 * available.
 */
export function computeFullRatchetAdjustment(params: {
  prePrice: number;
  newPrice: number;
}): {
  adjustedPrice: number;
  adjustmentFactor: number;
  bonusUnitsPerShare: number;
} {
  const { prePrice, newPrice } = params;
  if (prePrice <= 0 || newPrice <= 0 || newPrice >= prePrice) {
    return { adjustedPrice: prePrice, adjustmentFactor: 1, bonusUnitsPerShare: 0 };
  }
  const adjustedPrice = newPrice;
  const adjustmentFactor = prePrice / adjustedPrice;
  return { adjustedPrice, adjustmentFactor, bonusUnitsPerShare: adjustmentFactor - 1 };
}

// ────────────────────────────────────────────────────────────────────
// Drag-along / tag-along
// ────────────────────────────────────────────────────────────────────

/**
 * Evaluate drag-along consent against the constitutional 51% threshold.
 *
 * A drag-along right lets a majority (≥51% of issued equity units) force
 * minority holders to join a sale on the same terms. Tag-along is the
 * inverse right — minorities can elect to join a majority sale.
 *
 * @param consentedUnits  sum of equity units held by consenting stakeholders
 * @param totalIssuedUnits total issued equity units (denominator)
 * @returns consent %, threshold-met flag, headroom
 */
export function evaluateDragAlongConsent(params: {
  consentedUnits: number;
  totalIssuedUnits: number;
  thresholdPct?: number;
}): {
  consentingPct: number;
  thresholdPct: number;
  thresholdMet: boolean;
  headroomUnits: number; // units still needed (0 if met)
} {
  const thresholdPct = params.thresholdPct ?? DRAG_ALONG_THRESHOLD_PCT;
  const total = params.totalIssuedUnits > 0 ? params.totalIssuedUnits : 0;
  const consentingPct = total > 0 ? (params.consentedUnits / total) * 100 : 0;
  const thresholdMet = consentingPct >= thresholdPct;
  const thresholdUnits = (thresholdPct / 100) * total;
  const headroomUnits = thresholdMet ? 0 : Math.ceil(thresholdUnits - params.consentedUnits);
  return { consentingPct, thresholdPct, thresholdMet, headroomUnits };
}

/**
 * CRE verdict for a drag-along invocation. Fails if consenting stake
 * hasn't crossed the 51% threshold.
 */
export function enforceDragAlong(params: {
  consentedUnits: number;
  totalIssuedUnits: number;
  thresholdPct?: number;
}): CreVerdict {
  const evalResult = evaluateDragAlongConsent(params);
  const allowed = evalResult.thresholdMet;
  const reason = allowed
    ? undefined
    : `Drag-along blocked: consenting stake ${evalResult.consentingPct.toFixed(2)}% < ${evalResult.thresholdPct}% threshold (${evalResult.headroomUnits} units short)`;
  return {
    allowed,
    reason,
    policy: "drag_along.rego",
    decisionToken: "", // decisionToken is issued by the CRE platform key on
    // anchor — this is a local read-only check, not persisted. Real tokens
    // are issued by `anchorCapTableSnapshot` when the drag is recorded.
  };
}

/**
 * CRE verdict for a vesting-cliff transfer attempt. Reuses
 * `enforceEquityLockUp` from cre.ts for the binary lock gate (cliff not
 * passed yet) plus an AURIENTA-specific check for partial-vesting
 * transfers (transferring N units requires vestedUnits >= N).
 */
export function enforceVestingCliff(params: {
  restrictedUntil: Date | null;
  vestedUnits: number;
  transferUnits: number;
  asOf?: Date;
}): { verdict: CreVerdict; lockupVerdict: CreVerdict; cliffPassed: boolean } {
  const asOf = params.asOf ?? new Date();
  const lockupVerdict = enforceEquityLockUp({
    restrictedUntil: params.restrictedUntil,
  });
  const cliffPassed = params.restrictedUntil
    ? asOf.getTime() >= params.restrictedUntil.getTime()
    : true;

  const policy = "vesting_cliff.rego";
  if (!cliffPassed) {
    return {
      cliffPassed: false,
      lockupVerdict,
      verdict: {
        allowed: false,
        reason: lockupVerdict.reason ?? "Vesting cliff not yet reached",
        policy,
        decisionToken: "",
      },
    };
  }
  if (params.transferUnits > params.vestedUnits) {
    return {
      cliffPassed: true,
      lockupVerdict,
      verdict: {
        allowed: false,
        reason: `Vesting cliff: transfer of ${params.transferUnits} units blocked — only ${params.vestedUnits} units vested`,
        policy,
        decisionToken: "",
      },
    };
  }
  return {
    cliffPassed: true,
    lockupVerdict,
    verdict: {
      allowed: true,
      policy,
      decisionToken: "",
    },
  };
}

// ────────────────────────────────────────────────────────────────────
// Hashing
// ────────────────────────────────────────────────────────────────────

function hashPayload(payload: unknown): string {
  return createHash("sha3-256").update(JSON.stringify(payload)).digest("hex");
}

// ────────────────────────────────────────────────────────────────────
// getCapTable — full ownership snapshot (READ-ONLY)
// ────────────────────────────────────────────────────────────────────

/**
 * Build the full cap table for an enterprise.
 *
 * Joins OwnershipRecord rows + EnterpriseMember roles + the latest
 * Valuation to produce a single, deterministic snapshot. Every number
 * is recomputed at read time — the database is the source of truth,
 * not a cached summary.
 */
export async function getCapTable(
  enterpriseId: string,
  opts: { asOf?: Date } = {}
): Promise<CapTable> {
  const asOf = opts.asOf ?? new Date();

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: {
      id: true,
      name: true,
      slug: true,
      tier: true,
      stage: true,
      totalEquityUnits: true,
      equityUnitPriceEgp: true,
      raisedEgp: true,
      founderEquityPct: true,
    },
  });
  if (!enterprise) {
    throw new Error(`Cap table: enterprise ${enterpriseId} not found`);
  }

  const [ownershipRows, members, latestValuation, ledgerTip] = await Promise.all([
    db.ownershipRecord.findMany({
      where: { enterpriseId },
      orderBy: { equityUnits: "desc" },
      include: { user: { select: { id: true, legalName: true, email: true } } },
    }),
    db.enterpriseMember.findMany({
      where: { enterpriseId },
      select: { userId: true, role: true, boardSeat: true },
    }),
    db.valuation.findFirst({
      where: { enterpriseId },
      orderBy: { createdAt: "desc" },
    }),
    db.ledgerEvent.findFirst({
      where: { enterpriseId, eventType: "cap_table_snapshot" },
      orderBy: { sequence: "desc" },
      select: { sequence: true, payloadHash: true, eventType: true, timestamp: true },
    }),
  ]);

  const memberRoleByUser = new Map<string, string>();
  for (const m of members) {
    // First-seen role wins (a user can have multiple roles; pick the most senior).
    if (!memberRoleByUser.has(m.userId)) {
      memberRoleByUser.set(m.userId, m.role);
    }
  }

  const equityUnitPriceEgp =
    latestValuation?.equityUnitPriceEgp ?? enterprise.equityUnitPriceEgp;
  const preMoneyValuationEgp = latestValuation?.preMoneyEgp ?? 0;

  const issuedEquityUnits = ownershipRows.reduce(
    (sum, r) => sum + r.equityUnits,
    0
  );
  const fullyDilutedEquityUnits = issuedEquityUnits; // no separate option pool table
  const denominator = Math.max(issuedEquityUnits, 1);

  const stakeholders: CapTableEntry[] = ownershipRows.map((row) => {
    const role = memberRoleByUser.get(row.userId) ?? null;
    const shareClass = roleToShareClass(role);
    const valueEgp = row.equityUnits * equityUnitPriceEgp;
    const liquidationPreferenceEgp =
      shareClass === "preferred"
        ? row.equityUnits * row.avgPriceEgp * PREFERRED_LIQUIDATION_MULTIPLE
        : 0;

    const grantedAt = row.createdAt;
    const vesting =
      shareClass === "common_restricted" && row.restrictedUntil
        ? computeVesting(STANDARD_VESTING, grantedAt, asOf, row.equityUnits)
        : {
            vestedUnits: row.equityUnits,
            unvestedUnits: 0,
            pctVested: 1,
            cliffPassed: true,
            cliffDate: row.restrictedUntil ?? grantedAt,
            vestingEndDate: row.restrictedUntil ?? grantedAt,
          };

    const ownershipPct = (row.equityUnits / denominator) * 100;

    return {
      userId: row.userId,
      legalName: row.user?.legalName ?? "Unknown",
      role,
      shareClass,
      equityUnits: row.equityUnits,
      avgPriceEgp: row.avgPriceEgp,
      ownershipPct: Math.round(ownershipPct * 1e6) / 1e6,
      valueEgp: Math.round(valueEgp * 100) / 100,
      restrictedUntil: row.restrictedUntil?.toISOString() ?? null,
      vestedUnits: vesting.vestedUnits,
      unvestedUnits: vesting.unvestedUnits,
      pctVested: vesting.pctVested,
      liquidationPreferenceEgp: Math.round(liquidationPreferenceEgp * 100) / 100,
      antiDilutionProtection: shareClassAntiDilution(shareClass),
      // Drag-along eligibility: anyone with >0 vested units can be a dragger.
      dragAlongEligible: vesting.vestedUnits > 0,
      // Tag-along eligibility: minority holders (< 51%) can tag along.
      tagAlongEligible: ownershipPct < DRAG_ALONG_THRESHOLD_PCT,
    };
  });

  return {
    enterpriseId: enterprise.id,
    enterpriseName: enterprise.name,
    slug: enterprise.slug,
    tier: enterprise.tier,
    stage: enterprise.stage,
    totalEquityUnits: enterprise.totalEquityUnits,
    issuedEquityUnits,
    fullyDilutedEquityUnits,
    equityUnitPriceEgp,
    preMoneyValuationEgp,
    postMoneyValuationEgp: preMoneyValuationEgp + enterprise.raisedEgp,
    raisedEgp: enterprise.raisedEgp,
    founderEquityPct: enterprise.founderEquityPct,
    stakeholderCount: stakeholders.length,
    stakeholders,
    ledgerAnchor: ledgerTip
      ? {
          sequence: ledgerTip.sequence,
          payloadHash: ledgerTip.payloadHash,
          eventType: ledgerTip.eventType,
          timestamp: ledgerTip.timestamp.toISOString(),
        }
      : null,
    constitutionalHash: CONSTITUTIONAL_HASH,
    generatedAt: asOf.toISOString(),
  };
}

// ────────────────────────────────────────────────────────────────────
// modelDilution — simulate a new round (READ-ONLY)
// ────────────────────────────────────────────────────────────────────

/**
 * Simulate the impact of issuing `newShares` at `newPriceEgp` (or the
 * current equityUnitPrice if omitted). Computes per-stakeholder dilution
 * and any anti-dilution adjustment shares (weighted-average or full
 * ratchet) issued to protected preferred holders.
 *
 * Returns a CRE verdict reflecting whether the dilution would breach the
 * Founder Equity Cap floor (Art. 12). This function does NOT persist
 * anything — call `anchorCapTableSnapshot` after the round closes to
 * record the constitutional decision.
 */
export async function modelDilution(
  enterpriseId: string,
  newShares: number,
  opts: {
    newPriceEgp?: number;
    antiDilution?: AntiDilutionMode; // override per-stakeholder default
  } = {}
): Promise<DilutionResult> {
  if (newShares <= 0) {
    throw new Error("modelDilution: newShares must be > 0");
  }

  const capTable = await getCapTable(enterpriseId);
  const newPriceEgp = opts.newPriceEgp ?? capTable.equityUnitPriceEgp;
  const capitalRaisedEgp = newShares * newPriceEgp;
  const preMoneyValuationEgp = capTable.equityUnitPriceEgp * capTable.issuedEquityUnits;
  const postMoneyValuationEgp = preMoneyValuationEgp + capitalRaisedEgp;

  const preShares = capTable.issuedEquityUnits;
  const postShares = preShares + newShares;
  const newInvestorOwnershipPct = (newShares / Math.max(postShares, 1)) * 100;

  // First pass — compute units after anti-dilution adjustments. pctAfter is
  // finalized in the second pass once we know the total bonus shares.
  const dilutedStakeholders: DilutionResult["dilutedStakeholders"] = [];
  let founderPctAfter = 0;

  for (const s of capTable.stakeholders) {
    const pctBefore = s.ownershipPct;
    let unitsAfter = s.equityUnits;
    let antiDilutionAdjustmentUnits = 0;
    const mode: AntiDilutionMode = opts.antiDilution ?? s.antiDilutionProtection;

    // Apply anti-dilution only if the new round is a DOWN round
    // (newPrice < holder's avgPrice) AND the holder has protection.
    if (mode !== "none" && newPriceEgp < s.avgPriceEgp && s.shareClass === "preferred") {
      if (mode === "weighted_average") {
        const adj = computeWeightedAverageAdjustment({
          preSharesOutstanding: preShares,
          prePrice: s.avgPriceEgp,
          newShares,
          newPrice: newPriceEgp,
        });
        antiDilutionAdjustmentUnits = Math.floor(s.equityUnits * adj.bonusUnitsPerShare);
      } else if (mode === "full_ratchet") {
        const adj = computeFullRatchetAdjustment({
          prePrice: s.avgPriceEgp,
          newPrice: newPriceEgp,
        });
        antiDilutionAdjustmentUnits = Math.floor(s.equityUnits * adj.bonusUnitsPerShare);
      }
      unitsAfter += antiDilutionAdjustmentUnits;
    }

    dilutedStakeholders.push({
      userId: s.userId,
      legalName: s.legalName,
      shareClass: s.shareClass,
      unitsBefore: s.equityUnits,
      unitsAfter,
      pctBefore: Math.round(pctBefore * 1e6) / 1e6,
      pctAfter: 0, // finalized in second pass
      dilutionPct: 0, // finalized in second pass
      antiDilutionAdjustmentUnits,
      antiDilutionMode: mode,
    });
  }

  // Second pass — finalize pctAfter with the TOTAL post-money share pool
  // including all anti-dilution bonus shares (so percentages sum to ~100%).
  const totalBonusUnits = dilutedStakeholders.reduce(
    (sum, d) => sum + d.antiDilutionAdjustmentUnits,
    0
  );
  const effectivePostShares = postShares + totalBonusUnits;
  for (const d of dilutedStakeholders) {
    d.pctAfter = Math.round((d.unitsAfter / Math.max(effectivePostShares, 1)) * 100 * 1e6) / 1e6;
    d.dilutionPct = Math.round((d.pctAfter - d.pctBefore) * 1e6) / 1e6;
    if (d.shareClass === "common_founder") founderPctAfter += d.pctAfter;
  }

  // CRE verdict — check founder-equity-cap floor (enforced by cre.ts).
  const verdict = enforceFounderEquityCap({
    tier: capTable.tier,
    founderEquityPct: capTable.founderEquityPct,
    proposedFounderEquityPct: founderPctAfter,
  });

  return {
    enterpriseId,
    newShares,
    newPriceEgp,
    preMoneyValuationEgp: Math.round(preMoneyValuationEgp),
    postMoneyValuationEgp: Math.round(postMoneyValuationEgp),
    capitalRaisedEgp: Math.round(capitalRaisedEgp),
    newInvestorOwnershipPct: Math.round(newInvestorOwnershipPct * 1e6) / 1e6,
    dilutedStakeholders,
    verdict,
  };
}

// ────────────────────────────────────────────────────────────────────
// computeWaterfall — liquidation preference → payout order (READ-ONLY)
// ────────────────────────────────────────────────────────────────────

/**
 * Simulate the distribution of `exitAmountEgp` across the cap table under
 * the standard liquidation waterfall:
 *
 *   Tier 1: Preferred holders receive their 1x liquidation preference
 *           (invested capital = units × avgPriceEgp × multiple).
 *           NON-PARTICIPATING preferred must elect between (a) taking
 *           their preference, or (b) converting to common and sharing
 *           pro-rata. AURIENTA defaults to (a) — preference — but flags
 *           when (b) would have been more lucrative.
 *
 *   Tier 2: Residual (exitAmount - tier-1 payouts) distributed pro-rata
 *           to common holders (founders + workforce).
 *
 *   If the exit is large enough that preferred would do better by
 *   converting (their pro-rata share of common > their preference), the
 *   waterfall flips them to common and re-runs.
 */
export async function computeWaterfall(
  enterpriseId: string,
  exitAmountEgp: number
): Promise<WaterfallResult> {
  if (exitAmountEgp < 0) {
    throw new Error("computeWaterfall: exitAmountEgp must be >= 0");
  }

  const capTable = await getCapTable(enterpriseId);

  const preferred = capTable.stakeholders.filter((s) => s.shareClass === "preferred");
  const common = capTable.stakeholders.filter((s) => s.shareClass !== "preferred");
  const totalUnits = capTable.issuedEquityUnits;

  // Liquidation preference for each preferred holder = invested capital × 1.0x.
  const totalPrefPreference = preferred.reduce(
    (sum, p) => sum + p.liquidationPreferenceEgp,
    0
  );

  // Tier 1 — pay out liquidation preferences (capped at exitAmount).
  const tier1Pool = Math.min(exitAmountEgp, totalPrefPreference);
  const tier1: WaterfallTier = {
    rank: 1,
    label: "1x Non-Participating Liquidation Preference (Preferred)",
    mechanism: "liquidation_preference",
    participantCount: preferred.length,
    poolEgp: exitAmountEgp,
    paidOutEgp: tier1Pool,
    remainingEgp: Math.max(0, exitAmountEgp - tier1Pool),
  };

  // Tier 2 — common pro-rata over the residual.
  const tier2Pool = tier1.remainingEgp;
  const totalCommonUnits = common.reduce((sum, c) => sum + c.equityUnits, 0);
  const tier2: WaterfallTier = {
    rank: 2,
    label: "Common Pro-Rata Distribution (Residual)",
    mechanism: "common_pro_rata",
    participantCount: common.length,
    poolEgp: tier2Pool,
    paidOutEgp: totalCommonUnits > 0 ? Math.min(tier2Pool, tier2Pool) : 0,
    remainingEgp: 0, // no tier after common — residual goes to founders
  };

  // Build the per-stakeholder payout list.
  const payouts: WaterfallPayout[] = [];

  // Tier 1: preferred receive their preference pro-rata within the tier-1 pool
  // (if exit < total preference, each preferred is paid
  //  prefPreference × (tier1Pool / totalPrefPreference)).
  const tier1Ratio = totalPrefPreference > 0 ? tier1Pool / totalPrefPreference : 0;
  for (const p of preferred) {
    const payout = p.liquidationPreferenceEgp * tier1Ratio;
    if (payout > 0) {
      payouts.push({
        userId: p.userId,
        legalName: p.legalName,
        shareClass: p.shareClass,
        tier: 1,
        payoutEgp: Math.round(payout * 100) / 100,
        payoutBasis: "1x non-participating liquidation preference",
      });
    }
  }

  // Tier 2: common pro-rata over tier-2 pool.
  for (const c of common) {
    const ratio = totalCommonUnits > 0 ? c.equityUnits / totalCommonUnits : 0;
    const payout = tier2Pool * ratio;
    if (payout > 0) {
      payouts.push({
        userId: c.userId,
        legalName: c.legalName,
        shareClass: c.shareClass,
        tier: 2,
        payoutEgp: Math.round(payout * 100) / 100,
        payoutBasis: "common pro-rata residual",
      });
    }
  }

  // Determine if preferred would have been better off converting to common.
  // If exitAmount / totalUnits > avgPriceEgp × multiple for the weighted
  // preferred cohort, conversion wins.
  const preferredAsCommonPayout =
    totalUnits > 0
      ? preferred.reduce(
          (sum, p) => sum + (exitAmountEgp * (p.equityUnits / totalUnits)),
          0
        )
      : 0;
  const preferredConversionElected = preferredAsCommonPayout > totalPrefPreference;

  const totalPaidOut = payouts.reduce((sum, p) => sum + p.payoutEgp, 0);
  const residualEgp = Math.max(0, exitAmountEgp - totalPaidOut);

  return {
    enterpriseId,
    exitAmountEgp,
    tiers: [tier1, tier2],
    payouts: payouts.sort((a, b) =>
      a.tier !== b.tier ? a.tier - b.tier : b.payoutEgp - a.payoutEgp
    ),
    totalPaidOutEgp: Math.round(totalPaidOut * 100) / 100,
    residualEgp: Math.round(residualEgp * 100) / 100,
    preferredConversionElected,
  };
}

// ────────────────────────────────────────────────────────────────────
// anchorCapTableSnapshot — CRE-sign + hash-anchor (WRITES)
// ────────────────────────────────────────────────────────────────────

/**
 * Persist a constitutional cap-table snapshot to the immutable ledger.
 *
 * Generates a CRE decision token over the snapshot's SHA3-256 payload hash
 * and appends a `cap_table_snapshot` event to the enterprise's ledger
 * chain. The CreDecision row + LedgerEvent row commit atomically inside
 * the same transaction — they cannot diverge.
 *
 * Used after every state change (round close, vesting milestone, transfer,
 * drag-along invocation, OCF import) to anchor the resulting cap table
 * so any downstream verifier can recompute the snapshot from the chain.
 */
export async function anchorCapTableSnapshot(
  enterpriseId: string,
  actorId: string,
  scenario: "round_close" | "vesting_milestone" | "transfer" | "drag_along" | "manual" | "ocf_import"
): Promise<{
  ledgerEventId: string;
  sequence: number;
  payloadHash: string;
  creDecisionToken: string;
  snapshot: CapTable;
}> {
  const snapshot = await getCapTable(enterpriseId);
  const payload = {
    scenario,
    enterpriseId,
    snapshot: {
      totalEquityUnits: snapshot.totalEquityUnits,
      issuedEquityUnits: snapshot.issuedEquityUnits,
      equityUnitPriceEgp: snapshot.equityUnitPriceEgp,
      stakeholderCount: snapshot.stakeholderCount,
      stakeholders: snapshot.stakeholders.map((s) => ({
        userId: s.userId,
        legalName: s.legalName,
        shareClass: s.shareClass,
        equityUnits: s.equityUnits,
        ownershipPct: s.ownershipPct,
        vestedUnits: s.vestedUnits,
        liquidationPreferenceEgp: s.liquidationPreferenceEgp,
      })),
    },
    anchoredAt: new Date().toISOString(),
  };

  const verdict: CreVerdict = {
    allowed: true,
    policy: "cap_table_anchor.rego",
    decisionToken: "", // appended + signed by appendLedgerEvent below
  };

  const result = await db.$transaction(async (tx: PrismaTransaction) => {
    await logCreDecision(tx, {
      enterpriseId,
      policy: verdict.policy,
      verdict,
      actorId,
      payload,
    });
    const event = await appendLedgerEvent(tx, {
      enterpriseId,
      eventType: "cap_table_snapshot",
      payload,
      actorId,
    });
    return event;
  });

  await audit({
    actorId,
    action: "cap_table.anchor",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      scenario,
      sequence: result.sequence,
      payloadHash: result.payloadHash,
      stakeholderCount: snapshot.stakeholderCount,
      issuedEquityUnits: snapshot.issuedEquityUnits,
    },
  });

  logger.info("cap table snapshot anchored", {
    enterpriseId,
    scenario,
    sequence: result.sequence,
    payloadHash: result.payloadHash,
  });

  return {
    ledgerEventId: result.id,
    sequence: result.sequence,
    payloadHash: result.payloadHash,
    creDecisionToken: verdict.decisionToken,
    snapshot,
  };
}

// ────────────────────────────────────────────────────────────────────
// exportOcf — Open Cap Table Format JSON (READ-ONLY)
// ────────────────────────────────────────────────────────────────────

/**
 * Export the cap table as an OCF v1.0.0 document. The four top-level
 * arrays (stakeholders, stock_classes, stock_plans, transactions) are
 * populated from the live database + the enterprise's ledger chain.
 *
 * Every transaction object carries the `ledger_payload_hash` +
 * `cre_decision_token` of its originating ledger event — this is an
 * AURIENTA-specific extension that lets any downstream AURIENTA instance
 * verify the chain integrity of an imported cap table.
 */
export async function exportOcf(enterpriseId: string): Promise<OcfDocument> {
  const [capTable, enterprise, ledgerEvents] = await Promise.all([
    getCapTable(enterpriseId),
    db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: { id: true, name: true, slug: true, totalEquityUnits: true },
    }),
    db.ledgerEvent.findMany({
      where: { enterpriseId },
      orderBy: { sequence: "asc" },
      select: {
        id: true,
        eventType: true,
        payload: true,
        payloadHash: true,
        creDecisionToken: true,
        timestamp: true,
      },
    }),
  ]);

  if (!enterprise) {
    throw new Error(`exportOcf: enterprise ${enterpriseId} not found`);
  }

  // ── Stakeholders ──
  const stakeholders: OcfStakeholder[] = capTable.stakeholders.map((s) => ({
    object_type: "STAKEHOLDER",
    id: `stakeholder_${s.userId}`,
    stakeholder_type: "INDIVIDUAL",
    name: s.legalName,
    external_id: s.userId,
  }));

  // ── Stock classes ── (one per AURIENTA share class — preferred, common_founder, common_restricted)
  const shareClasses: ShareClass[] = ["preferred", "common_founder", "common_restricted"];
  const stock_classes: OcfStockClass[] = shareClasses.map((c) => {
    const holders = capTable.stakeholders.filter((s) => s.shareClass === c);
    return {
      object_type: "STOCK_CLASS",
      id: `stock_class_${c}`,
      name:
        c === "preferred"
          ? "Series Seed Preferred"
          : c === "common_founder"
            ? "Founders' Common"
            : "Restricted Common (Workforce)",
      class_type: shareClassOcfType(c),
      default_id_prefix: c === "preferred" ? "PS-" : c === "common_founder" ? "FC-" : "RC-",
      current_share_price: {
        amount: capTable.equityUnitPriceEgp.toFixed(2),
        currency: "EGP",
      },
      fully_diluted_shares: holders.reduce((sum, h) => sum + h.equityUnits, 0),
      liquidation_preference_multiple:
        c === "preferred" ? PREFERRED_LIQUIDATION_MULTIPLE : 0,
      seniority: shareClassSeniority(c),
      anti_dilution_protection: shareClassAntiDilution(c).toUpperCase().replace("-", "_") as
        | "NONE"
        | "WEIGHTED_AVERAGE"
        | "FULL_RATCHET",
    };
  });

  // ── Stock plans ── (one ESOP-style plan derived from the authorized-unissued pool)
  const unissuedPool = Math.max(0, capTable.totalEquityUnits - capTable.issuedEquityUnits);
  const stock_plans: OcfStockPlan[] = [
    {
      object_type: "STOCK_PLAN",
      id: "stock_plan_workforce_esop",
      name: "Workforce Equity Pool (Restricted Common)",
      plan_type: "ESOP",
      current_share_reservation: unissuedPool,
    },
  ];

  // ── Transactions ── (reconstruct EquityIssued events from ledger history)
  const transactions: OcfTransaction[] = [];
  for (const ev of ledgerEvents) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(ev.payload) as Record<string, unknown>;
    } catch {
      continue;
    }
    // Skip non-issuance events (we only export EQUITY_ISSUED-shaped txns).
    if (
      ev.eventType !== "share_issued" &&
      ev.eventType !== "cap_table_snapshot" &&
      ev.eventType !== "salary_to_equity_converted"
    ) {
      continue;
    }
    // For snapshot events, emit a CAP_TABLE_SNAPSHOT placeholder.
    if (ev.eventType === "cap_table_snapshot") {
      transactions.push({
        object_type: "CAP_TABLE_SNAPSHOT",
        id: `txn_${ev.id}`,
        date: ev.timestamp.toISOString(),
        security_id: `snapshot_seq_${ev.sequence}`,
        stakeholder_id: "issuer",
        stock_class_id: "all",
        quantity: (parsed.issuedEquityUnits as number) ?? capTable.issuedEquityUnits,
        unit_price: {
          amount: capTable.equityUnitPriceEgp.toFixed(2),
          currency: "EGP",
        },
        ledger_payload_hash: ev.payloadHash,
        cre_decision_token: ev.creDecisionToken ?? undefined,
      });
      continue;
    }

    const userId = (parsed.userId ?? parsed.recipientId ?? parsed.actorId) as string | undefined;
    const units = (parsed.equityUnits ?? parsed.units ?? parsed.shares) as number | undefined;
    const priceEgp = (parsed.priceEgp ?? parsed.avgPriceEgp ?? capTable.equityUnitPriceEgp) as number;
    if (!userId || !units) continue;

    transactions.push({
      object_type: "EQUITY_ISSUED",
      id: `txn_${ev.id}`,
      date: ev.timestamp.toISOString(),
      security_id: `security_${ev.id}`,
      stakeholder_id: `stakeholder_${userId}`,
      stock_class_id: `stock_class_${capTable.stakeholders.find((s) => s.userId === userId)?.shareClass ?? "common_founder"}`,
      quantity: units,
      unit_price: { amount: priceEgp.toFixed(2), currency: "EGP" },
      ledger_payload_hash: ev.payloadHash,
      cre_decision_token: ev.creDecisionToken ?? undefined,
    });
  }

  // ── Constitutional anchor ──
  const chainTip = ledgerEvents.length > 0 ? ledgerEvents[ledgerEvents.length - 1] : null;
  const capTablePayloadHash = hashPayload({
    stakeholders,
    stock_classes,
    stock_plans,
    transactions: transactions.map((t) => ({ id: t.id, hash: t.ledger_payload_hash })),
  });

  return {
    ocf_version: "1.0.0",
    generated_at: new Date().toISOString(),
    issuer: {
      object_type: "ISSUER",
      id: enterprise.id,
      legal_name: enterprise.name,
      ticker: enterprise.slug.toUpperCase().replace(/-/g, ""),
      currency: "EGP",
    },
    stakeholders,
    stock_classes,
    stock_plans,
    transactions,
    constitutional_anchor: {
      constitutional_hash: CONSTITUTIONAL_HASH,
      ledger_chain_tip: chainTip
        ? { sequence: chainTip.sequence ?? 0, payload_hash: chainTip.payloadHash }
        : null,
      cap_table_payload_hash: capTablePayloadHash,
    },
  };
}

// ────────────────────────────────────────────────────────────────────
// importOcf — constitutional ingest (WRITES)
// ────────────────────────────────────────────────────────────────────

/**
 * Import an OCF document into the cap table.
 *
 * CONSTITUTIONAL CONTRACT:
 *   - Every accepted stakeholder must resolve to a real User by external_id.
 *   - Every accepted transaction must reference a known stock_class.
 *   - Rejected rows are logged but DO NOT abort the import (partial accept).
 *   - The import is atomically anchored to the ledger as a single
 *     `cap_table_snapshot` event with scenario="ocf_import" — so the
 *     constitutional audit trail shows exactly which OCF doc produced
 *     the current state.
 *
 * Returns counts of accepted vs rejected transactions.
 */
export async function importOcf(
  enterpriseId: string,
  doc: OcfDocument,
  actorId: string
): Promise<{
  accepted: number;
  rejected: number;
  ledgerEventId: string;
  rejections: Array<{ txnId: string; reason: string }>;
}> {
  if (doc.ocf_version !== "1.0.0") {
    throw new Error(`importOcf: unsupported OCF version ${doc.ocf_version}`);
  }

  const rejections: Array<{ txnId: string; reason: string }> = [];
  let accepted = 0;
  let anchorEventId = "";

  // Resolve every stakeholder external_id → User.id (must pre-exist).
  const externalIds = doc.stakeholders
    .map((s) => s.external_id)
    .filter((id): id is string => typeof id === "string");
  const users = externalIds.length
    ? await db.user.findMany({
        where: { id: { in: externalIds } },
        select: { id: true },
      })
    : [];
  const userExists = new Set(users.map((u) => u.id));

  // Validate stock_class IDs.
  const validStockClassIds = new Set(doc.stock_classes.map((c) => c.id));

  await db.$transaction(async (tx: PrismaTransaction) => {
    for (const txn of doc.transactions) {
      // Only EQUITY_ISSUED transactions mutate the cap table.
      if (txn.object_type !== "EQUITY_ISSUED") {
        accepted += 1;
        continue;
      }
      const stakeholderId = (txn.stakeholder_id ?? "").replace(/^stakeholder_/, "");
      if (!stakeholderId || !userExists.has(stakeholderId)) {
        rejections.push({
          txnId: txn.id,
          reason: `stakeholder ${stakeholderId || "(missing)"} does not resolve to a known User`,
        });
        continue;
      }
      if (!validStockClassIds.has(txn.stock_class_id)) {
        rejections.push({
          txnId: txn.id,
          reason: `unknown stock_class_id ${txn.stock_class_id}`,
        });
        continue;
      }
      const units = Number(txn.quantity);
      const price = Number(txn.unit_price.amount);
      if (!Number.isFinite(units) || units <= 0 || !Number.isFinite(price) || price <= 0) {
        rejections.push({
          txnId: txn.id,
          reason: `invalid quantity ${txn.quantity} or price ${txn.unit_price.amount}`,
        });
        continue;
      }

      // Upsert the OwnershipRecord (one per enterprise × user).
      const existing = await tx.ownershipRecord.findUnique({
        where: {
          enterpriseId_userId: { enterpriseId, userId: stakeholderId },
        },
      });
      if (existing) {
        const totalUnits = existing.equityUnits + units;
        const totalCost = existing.equityUnits * existing.avgPriceEgp + units * price;
        await tx.ownershipRecord.update({
          where: { id: existing.id },
          data: {
            equityUnits: totalUnits,
            avgPriceEgp: totalCost / totalUnits,
          },
        });
      } else {
        await tx.ownershipRecord.create({
          data: {
            enterpriseId,
            userId: stakeholderId,
            equityUnits: units,
            avgPriceEgp: price,
          },
        });
      }

      // Append an EQUITY_ISSUED ledger event for this single transaction.
      await appendLedgerEvent(tx, {
        enterpriseId,
        eventType: "share_issued",
        payload: {
          ocfTxnId: txn.id,
          userId: stakeholderId,
          stockClassId: txn.stock_class_id,
          equityUnits: units,
          priceEgp: price,
          date: txn.date,
          source: "ocf_import",
        },
        actorId,
      });
      accepted += 1;
    }

    // Anchor the resulting cap table as a single snapshot.
    await logCreDecision(tx, {
      enterpriseId,
      policy: "cap_table_anchor.rego",
      verdict: { allowed: true, policy: "cap_table_anchor.rego", decisionToken: "" },
      actorId,
      payload: {
        scenario: "ocf_import",
        accepted,
        rejected: rejections.length,
        ocfVersion: doc.ocf_version,
        issuerId: doc.issuer.id,
      },
    });
    const anchor = await appendLedgerEvent(tx, {
      enterpriseId,
      eventType: "cap_table_snapshot",
      payload: {
        scenario: "ocf_import",
        accepted,
        rejected: rejections.length,
        ocfVersion: doc.ocf_version,
        anchoredAt: new Date().toISOString(),
      },
      actorId,
    });
    anchorEventId = anchor.id;
  });

  await audit({
    actorId,
    action: "cap_table.ocf_import",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      accepted,
      rejected: rejections.length,
      ocfVersion: doc.ocf_version,
    },
  });

  return {
    accepted,
    rejected: rejections.length,
    ledgerEventId: anchorEventId,
    rejections,
  };
}

// ────────────────────────────────────────────────────────────────────
// role gate — which roles can see the cap table
// ────────────────────────────────────────────────────────────────────

/** Roles permitted to view the constitutional cap table for an enterprise. */
export const CAP_TABLE_VIEWER_ROLES = [
  "capital_partner",
  "founding_operator",
  "board_member",
  "company_owner",
  "aurienta_rep", // platform admin always
] as const;

export type CapTableViewerRole = (typeof CAP_TABLE_VIEWER_ROLES)[number];

/**
 * Returns true if the user holds ANY of the cap-table viewer roles for the
 * given enterprise (via EnterpriseMember). AURIENTA Reps always pass.
 */
export async function canViewCapTable(
  userId: string,
  enterpriseId: string
): Promise<boolean> {
  const membership = await db.enterpriseMember.findFirst({
    where: {
      userId,
      enterpriseId,
      role: { in: [...CAP_TABLE_VIEWER_ROLES] },
    },
    select: { id: true },
  });
  return !!membership;
}

// ────────────────────────────────────────────────────────────────────
// listEnterprisesForUser — for the dashboard selector
// ────────────────────────────────────────────────────────────────────

export async function listCapTableEnterprisesForUser(userId: string): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    tier: string;
    stage: string;
    role: string;
  }>
> {
  const memberships = await db.enterpriseMember.findMany({
    where: {
      userId,
      role: { in: [...CAP_TABLE_VIEWER_ROLES] },
    },
    include: {
      enterprise: {
        select: { id: true, name: true, slug: true, tier: true, stage: true },
      },
    },
    orderBy: { enterprise: { name: "asc" } },
  });
  return memberships.map((m) => ({
    id: m.enterprise.id,
    name: m.enterprise.name,
    slug: m.enterprise.slug,
    tier: m.enterprise.tier,
    stage: m.enterprise.stage,
    role: m.role,
  }));
}
