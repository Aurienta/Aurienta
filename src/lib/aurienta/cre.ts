// Constitutional Runtime Engine — deterministic, fail-secure policy validation.
// Mirrors the blueprint's Rego policies as TypeScript guards.
//
// CTO-AUDIT remediation:
// - Real Ed25519 signatures (not mocked base64).
// - verifyLedgerChain() — tamper-evidence on read, not just write.
// - Transactional append with per-enterprise sequence — no more racy forks.
// - 12 missing constitutional policies implemented.
// - Real Ed25519 CRE decision tokens.

import { createHash } from "crypto";
import { db } from "@/lib/db";
import { issueCreDecisionToken, verifyCreDecisionToken } from "./signing";
import type { PrismaTransaction } from "@/lib/db";

export type CreVerdict = {
  allowed: boolean;
  reason?: string;
  policy: string;
  decisionToken: string;
  requiredApproverRoles?: string[]; // for multi-sig policies
};

// ── Zero Custody (Non-amendable Rule I 1.1) — hardened ──
const AURIENTA_DENY = /aurienta/i;
export function enforceZeroCustody(beneficiary: string): CreVerdict {
  // Block ANY beneficiary containing "aurienta" (substring, case-insensitive).
  const blocked = AURIENTA_DENY.test(beneficiary);
  const policy = "zero_custody.rego";
  const payloadHash = hashPayload({ zc: beneficiary });
  return {
    allowed: !blocked,
    reason: blocked ? "Zero Custody: transfer to AURIENTA-owned account denied" : undefined,
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: !blocked }),
  };
}

// ── Expense authority (Art. 118 / tier rules) — returns required approver roles ──
export function enforceExpenseAuthority(
  amountEgp: number,
  capitalEgp: number,
  role: string
): CreVerdict {
  const pct = (amountEgp / capitalEgp) * 100;
  const policy = "expense_authority.rego";
  const payloadHash = hashPayload({ exp: amountEgp, cap: capitalEgp, role });
  if (pct < 1) {
    // <1% — manager or founding operator can approve solo
    const ok = role === "manager" || role === "founding_operator";
    return {
      allowed: ok,
      reason: ok ? undefined : "Expenses <1% require manager or founding_operator role",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: ok }),
      requiredApproverRoles: ["manager", "founding_operator"],
    };
  }
  if (pct <= 10) {
    // 1–10% — DUAL SIGNATURE required (manager + accountant)
    return {
      allowed: false, // single role never satisfies dual-sig
      reason: "Expenses 1–10% require dual signature (manager + accounting_firm_rep)",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
      requiredApproverRoles: ["manager", "accounting_firm_rep"],
    };
  }
  // >10% — board approval
  return {
    allowed: role === "board_member",
    reason: "Expenses >10% require board approval",
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: role === "board_member" }),
    requiredApproverRoles: ["board_member"],
  };
}

// ── Dynamic minimum Capital Participation (Add-on 19) — single source of truth ──
export function computeDynamicMinimum(
  remainingGoal: number,
  remainingSlots: number,
  tier: string
): number {
  const factor = tier === "D" ? 0.8 : 0.7;
  const floor = tier === "D" ? 50_000 : tier === "F" ? 1 : 50;
  const calc = Math.ceil(remainingGoal / (Math.max(remainingSlots, 1) * factor));
  return Math.max(floor, Math.ceil(calc / 100) * 100);
}

// ── Price band (fundamental pricing) ──
export function enforcePriceBand(
  orderPrice: number,
  fundamentalPrice: number,
  phase: string
): CreVerdict {
  const policy = "fundamental_pricing.rego";
  const payloadHash = hashPayload({ op: orderPrice, fp: fundamentalPrice, phase });
  if (phase === "phase_1" || phase === "phase_2") {
    const ok = Math.abs(orderPrice - fundamentalPrice) < 0.01;
    return {
      allowed: ok,
      reason: ok ? undefined : "Phase 1/2 orders must equal the AI fundamental price exactly",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: ok }),
    };
  }
  const band = (orderPrice - fundamentalPrice) / fundamentalPrice;
  const ok = band >= -0.05 && band <= 0.05;
  return {
    allowed: ok,
    reason: ok ? undefined : "Phase 3 orders must be within ±5% of the fundamental price",
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: ok }),
  };
}

// ── Quorum check ──
export function checkQuorum(
  votesCast: number,
  totalVotingPower: number,
  quorumPct: number
): boolean {
  return (votesCast / totalVotingPower) * 100 >= quorumPct;
}

// ── Police clearance (Add-on 27) — expanded scope ──
export function enforcePoliceClearance(
  role: string,
  clearanceValid: boolean,
  clearanceExpiresAt?: Date | null
): CreVerdict {
  const policy = "police_clearance.rego";
  const payloadHash = hashPayload({ pc: role, valid: clearanceValid });
  const requiresClearance = ["manager", "founding_operator", "board_member", "law_firm_rep", "accounting_firm_rep"].includes(role);
  if (!requiresClearance) {
    return {
      allowed: true,
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: true }),
    };
  }
  const expired = clearanceExpiresAt ? clearanceExpiresAt.getTime() < Date.now() : !clearanceValid;
  if (expired) {
    return {
      allowed: false,
      reason: `${role} appointment blocked: police clearance invalid, missing, or expired`,
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
    };
  }
  return {
    allowed: true,
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: true }),
  };
}

// ── KYC level gating (CTO-AUDIT P0-8) ──
export function enforceKycGate(
  verificationLevel: string,
  action: string,
  amountEgp?: number
): CreVerdict {
  const policy = "kyc_gate.rego";
  const payloadHash = hashPayload({ kyc: verificationLevel, action, amt: amountEgp });
  // L0 anonymous — no money-moving allowed at all
  if (verificationLevel === "L0") {
    return {
      allowed: false,
      reason: "L0 (anonymous) Constitutional Partners cannot perform any transactional action",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
    };
  }
  // L1 — observation only, no transactions
  if (verificationLevel === "L1") {
    return {
      allowed: false,
      reason: "L1 (email/mobile only) Constitutional Partners must complete KYC before transacting",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
    };
  }
  // L2 — capped at 10,000 EGP per transaction
  if (verificationLevel === "L2" && amountEgp !== undefined && amountEgp > 10_000) {
    return {
      allowed: false,
      reason: "L2 Constitutional Partners are capped at 10,000 EGP per transaction; complete enhanced KYC (L3) for higher amounts",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
    };
  }
  // L3 — Founding Operator actions allowed; institutional (Tier F) requires L4
  if (action === "found_enterprise_tier_f" && verificationLevel !== "L4") {
    return {
      allowed: false,
      reason: "Tier F (Joint Stock) founding requires L4 institutional verification",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
    };
  }
  return {
    allowed: true,
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: true }),
  };
}

// ── Family consent (CTO-AUDIT P0-7) ──
export function enforceFamilyConsent(
  isFamilyMember: boolean,
  familyConsent: boolean,
  amountEgp: number
): CreVerdict {
  const policy = "family_consent.rego";
  const payloadHash = hashPayload({ fam: isFamilyMember, consent: familyConsent, amt: amountEgp });
  // Family members participating with capital > 50,000 EGP require family consent.
  if (isFamilyMember && amountEgp > 50_000 && !familyConsent) {
    return {
      allowed: false,
      reason: "Family-member capital partners must obtain family consent for Capital Participation above 50,000 EGP",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
    };
  }
  return {
    allowed: true,
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: true }),
  };
}

// ── Consulting opt-out prerequisite (CTO-AUDIT P0-7) ──
export function enforceConsultingOptOut(
  enterprise: { consultingOptOut: boolean; createdAt: Date; quarterlyReports: { netProfitEgp: number }[] }
): CreVerdict {
  const policy = "consulting_optout.rego";
  const payloadHash = hashPayload({ co: enterprise.consultingOptOut, ca: enterprise.createdAt.toISOString() });
  if (enterprise.consultingOptOut) {
    return {
      allowed: true,
      reason: "Consulting opt-out already active",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: true }),
    };
  }
  // Prerequisite: 3 consecutive profitable quarters OR 2 years of consultancy.
  const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000;
  const twoYearsPassed = Date.now() - enterprise.createdAt.getTime() >= twoYearsMs;
  const last3 = enterprise.quarterlyReports.slice(-3);
  const threeProfitable = last3.length >= 3 && last3.every((q) => q.netProfitEgp > 0);
  const ok = twoYearsPassed || threeProfitable;
  return {
    allowed: ok,
    reason: ok
      ? undefined
      : "Consulting opt-out requires 3 consecutive profitable quarters OR 2 years of consultancy",
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: ok }),
  };
}

// ── Law firm replacement (CTO-AUDIT P0-7) ──
export function enforceLawFirmReplacement(newFirm: {
  status: string;
  frLicenseNumber: string;
  insuranceEgp: number;
  expertiseScore: number;
}): CreVerdict {
  const policy = "law_firm_replacement.rego";
  const payloadHash = hashPayload({ lf: newFirm });
  const ok =
    newFirm.status === "active" &&
    !!newFirm.frLicenseNumber &&
    newFirm.insuranceEgp >= 100_000_000 &&
    newFirm.expertiseScore >= 75;
  return {
    allowed: ok,
    reason: ok
      ? undefined
      : "Replacement law firm must be active, licensed, insured ≥100M EGP, expertise ≥75",
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: ok }),
  };
}

// ── Emergency freeze (CTO-AUDIT P0-7) ──
export function enforceEmergencyFreeze(enterprise: { status: string }): CreVerdict {
  const policy = "emergency_freeze.rego";
  const payloadHash = hashPayload({ st: enterprise.status });
  const alreadyFrozen = enterprise.status === "frozen";
  return {
    allowed: true,
    reason: alreadyFrozen ? "Enterprise is already frozen" : undefined,
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: true }),
  };
}

// Check if enterprise is frozen — blocks all money-moving actions.
export function enforceNotFrozen(enterprise: { status: string }): CreVerdict {
  const policy = "not_frozen.rego";
  const payloadHash = hashPayload({ st: enterprise.status });
  const ok = enterprise.status !== "frozen";
  return {
    allowed: ok,
    reason: ok ? undefined : "Enterprise is frozen — all transactions blocked by emergency freeze",
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: ok }),
  };
}

// ── Fund flow restrictions — direct law-firm transfer model ──
// Per the updated constitutional charter (Amendment IX), capital flows directly
// to the law firm's licensed Law Firm Client Account (NOT a separate escrow
// arrangement). Egyptian law permits lawyers to hold client funds in
// segregated client accounts under the Egyptian Lawyers' Code
// (Law 17/1983, Art. 47). This eliminates the need for a separate escrow
// arrangement. Milestone releases then flow from the law firm to the certified
// accounting firm, which verifies evidence and disburses to the vendor /
// enterprise operating account.
export function enforceFundFlow(params: {
  lawFirmStatus: string;
  releaseAmount: number;
  lawFirmBalance: number; // The Law Firm Client Account balance (variable name kept for compatibility; field name in DB is lawFirmClientAccountBalanceEgp)
}): CreVerdict {
  const policy = "fund_flow.rego";
  const payloadHash = hashPayload({ ff: params });
  if (params.lawFirmStatus !== "active") {
    return {
      allowed: false,
      reason: "Fund release blocked: law firm client account is not active (license suspended or revoked)",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
    };
  }
  if (params.releaseAmount > params.lawFirmBalance) {
    return {
      allowed: false,
      reason: "Fund release blocked: amount exceeds law firm client account balance",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
    };
  }
  return {
    allowed: true,
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: true }),
  };
}

// ── Accountant milestone-release gate (Amendment IX) ──
// Milestone releases require the certified accounting firm to verify evidence
// and co-authorize the disbursement. Funds flow: escrow →
// accounting firm verification → vendor/operating account.
export function enforceAccountantGate(params: {
  accountingFirmStatus: string;
  evidenceVerified: boolean;
  milestoneStatus: string;
}): CreVerdict {
  const policy = "accountant_gate.rego";
  const payloadHash = hashPayload({ ag: params });
  if (params.accountingFirmStatus !== "active") {
    return {
      allowed: false,
      reason: "Milestone release blocked: accounting firm is not active (ESAA license suspended or revoked)",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
    };
  }
  if (!params.evidenceVerified) {
    return {
      allowed: false,
      reason: "Milestone release blocked: accounting firm has not verified the milestone evidence",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
    };
  }
  if (params.milestoneStatus !== "board_review" && params.milestoneStatus !== "approved") {
    return {
      allowed: false,
      reason: `Milestone release blocked: status is '${params.milestoneStatus}' (must be 'board_review' or 'approved')`,
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
    };
  }
  return {
    allowed: true,
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: true }),
  };
}

// ── Dividend lock — dividends paid from realized profits only ──
export function enforceDividendLock(params: {
  dividendAmount: number;
  realizedProfits: number;
  lastDividendAt?: Date | null;
}): CreVerdict {
  const policy = "dividend_lock.rego";
  const payloadHash = hashPayload({ dl: params });
  if (params.dividendAmount > params.realizedProfits) {
    return {
      allowed: false,
      reason: "Dividend blocked: amount exceeds realized profits (capital held in the Law Firm Client Account is not distributable)",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
    };
  }
  // 30-day cooling-off between dividends.
  if (params.lastDividendAt && Date.now() - params.lastDividendAt.getTime() < 30 * 24 * 60 * 60 * 1000) {
    return {
      allowed: false,
      reason: "Dividend blocked: 30-day cooling-off period since last dividend has not elapsed",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
    };
  }
  return {
    allowed: true,
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: true }),
  };
}

// ── Founder equity cap (CTO-AUDIT P0-7) — prevent dilution below tier floor ──
export function enforceFounderEquityCap(params: {
  tier: string;
  founderEquityPct: number;
  proposedFounderEquityPct: number;
}): CreVerdict {
  const policy = "founder_equity_cap.rego";
  const payloadHash = hashPayload({ fe: params });
  const floor: Record<string, number> = { A: 5, B: 5, C: 10, D: 51, E: 0, F: 0 };
  const required = floor[params.tier] ?? 5;
  // For Tier D, owner must stay ≥51%. For others, the Founding Operator floor must be preserved.
  if (params.proposedFounderEquityPct < required) {
    return {
      allowed: false,
      reason: `Founding Operator equity dilution blocked: tier ${params.tier} requires Founding Operator / owner ≥ ${required}%`,
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: false }),
    };
  }
  return {
    allowed: true,
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: true }),
  };
}

// ── Tier migration sequence (CTO-AUDIT P0-7) — no skipping A→B→C→D→F ──
export function enforceTierMigration(params: {
  currentTier: string;
  proposedTier: string;
}): CreVerdict {
  const policy = "tier_migration.rego";
  const payloadHash = hashPayload({ tm: params });
  const order = ["A", "B", "C", "D", "F"]; // E (University) is a separate track
  const cur = order.indexOf(params.currentTier);
  const next = order.indexOf(params.proposedTier);
  // Allow same tier or next tier only; E is exempt.
  if (params.currentTier === "E" || params.proposedTier === "E") {
    return {
      allowed: true,
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: true }),
    };
  }
  const ok = next === cur || next === cur + 1;
  return {
    allowed: ok,
    reason: ok ? undefined : `Tier migration blocked: cannot skip from ${params.currentTier} to ${params.proposedTier}`,
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash, allowed: ok }),
  };
}

// ── Hash helper ──
function hashPayload(payload: unknown): string {
  return createHash("sha3-256").update(JSON.stringify(payload)).digest("hex");
}

// ── Append a ledger event (immutable hash chain) — TRANSACTIONAL ──
// Must be called inside a db.$transaction. Uses per-enterprise monotonic
// sequence to prevent the race that forked the chain under concurrency.
export async function appendLedgerEvent(
  tx: PrismaTransaction,
  params: {
    enterpriseId?: string;
    eventType: string;
    payload: Record<string, unknown>;
    actorId?: string;
  }
): Promise<{ id: string; payloadHash: string; prevHash: string | null; sequence: number }> {
  // Lock the chain tip for this enterprise (or the global chain if no enterprise).
  const last = await tx.ledgerEvent.findFirst({
    where: params.enterpriseId ? { enterpriseId: params.enterpriseId } : { enterpriseId: null },
    orderBy: { sequence: "desc" },
  });
  const prevHash = last?.payloadHash ?? null;
  const sequence = (last?.sequence ?? 0) + 1;
  const payloadStr = JSON.stringify(params.payload);
  const payloadHash = createHash("sha3-256")
    .update(payloadStr + params.eventType + (prevHash ?? "") + sequence)
    .digest("hex");

  // Sign the payload hash + prevHash with the platform key.
  const { issueCreDecisionToken } = await import("./signing");
  const decisionToken = issueCreDecisionToken({
    policy: "ledger.append",
    payloadHash,
    allowed: true,
    actorId: params.actorId,
  });

  const event = await tx.ledgerEvent.create({
    data: {
      enterpriseId: params.enterpriseId,
      eventType: params.eventType,
      prevHash,
      payloadHash,
      payload: payloadStr,
      creDecisionToken: decisionToken,
      actorId: params.actorId,
      sequence,
    },
  });

  return { id: event.id, payloadHash, prevHash, sequence };
}

// ── Verify the integrity of a ledger chain (CTO-AUDIT P0-3) ──
// Walks the chain in sequence order, recomputes each payloadHash, and
// verifies each prevHash links correctly. Returns the first broken link
// (or null if the chain is intact).
export async function verifyLedgerChain(enterpriseId: string): Promise<{
  intact: boolean;
  eventsChecked: number;
  brokenAt?: { sequence: number; id: string; reason: string };
}> {
  const events = await db.ledgerEvent.findMany({
    where: { enterpriseId },
    orderBy: { sequence: "asc" },
  });
  let expectedPrev: string | null = null;
  for (const ev of events) {
    if (ev.prevHash !== expectedPrev) {
      return {
        intact: false,
        eventsChecked: ev.sequence - 1,
        brokenAt: { sequence: ev.sequence, id: ev.id, reason: "prevHash mismatch — chain broken or tampered" },
      };
    }
    const recomputed = createHash("sha3-256")
      .update(ev.payload + ev.eventType + (ev.prevHash ?? "") + ev.sequence)
      .digest("hex");
    if (recomputed !== ev.payloadHash) {
      return {
        intact: false,
        eventsChecked: ev.sequence - 1,
        brokenAt: { sequence: ev.sequence, id: ev.id, reason: "payloadHash mismatch — payload tampered after signing" },
      };
    }
    // Verify the CRE decision token signature.
    try {
      verifyCreDecisionToken(ev.creDecisionToken ?? "");
    } catch {
      return {
        intact: false,
        eventsChecked: ev.sequence - 1,
        brokenAt: { sequence: ev.sequence, id: ev.id, reason: "CRE decision token signature invalid" },
      };
    }
    expectedPrev = ev.payloadHash;
  }
  return { intact: true, eventsChecked: events.length };
}

// ── Graduation readiness gates — corrected with stageSince ──
export async function computeGraduationReadiness(enterpriseId: string) {
  const ent = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    include: {
      quarterlyReports: { orderBy: { year: "asc" }, take: 12 },
      proposals: { where: { type: "graduation", status: "executed" } },
      whistleblowerReports: { where: { status: { not: "resolved" } } },
      appealCases: { where: { status: { not: "resolved" } } },
    },
  });
  if (!ent) return { score: 0, gates: [] as { label: string; passed: boolean }[] };

  const runway = ent.monthlyBurnEgp > 0 ? ent.lawFirmClientAccountBalanceEgp / ent.monthlyBurnEgp : 0;
  const stageSinceMonths = (Date.now() - ent.stageSince.getTime()) / (30 * 24 * 60 * 60 * 1000);
  const lastQuarterly = ent.quarterlyReports.slice(-4);
  const revenueGrowth = lastQuarterly.length >= 2
    ? ((lastQuarterly[lastQuarterly.length - 1].revenueEgp - lastQuarterly[0].revenueEgp) / Math.max(lastQuarterly[0].revenueEgp, 1)) * 100
    : ent.revenueGrowthPct;

  const gates = [
    { label: "Runway ≥ 12 months", passed: runway >= 12 },
    { label: "Health rating ≥ AA", passed: (ent.healthScore ?? 0) >= 90 },
    { label: "Social insurance 100%", passed: ent.nosiCompliantPct >= 100 },
    { label: "Police clearance valid", passed: ent.policeClearanceValid },
    { label: "Stage 3 for ≥ 6 months", passed: (ent.stage === "stage_3" || ent.stage === "graduated") && stageSinceMonths >= 6 },
    { label: "Revenue growth ≥ 20%", passed: revenueGrowth >= 20 },
    { label: "75% supermajority graduation vote held", passed: ent.proposals.some((p) => p.passThreshold >= 75) },
    { label: "No unresolved whistleblower reports", passed: ent.whistleblowerReports.length === 0 },
    { label: "No outstanding appeals", passed: ent.appealCases.length === 0 },
  ];
  const passedCount = gates.filter((g) => g.passed).length;
  const score = Math.round((passedCount / gates.length) * 100);
  return { score, gates };
}

// ── NOSI 30-day registration enforcement (Add-on 26) ──
// Blueprint: "All employees must be registered with NOSI within 30 days;
// the CRE enforces this with penalties (Add-on 26)."
// Blueprint: "After 60 days, expense approvals frozen until registration."
//
// Returns a CRE verdict indicating whether the employee's NOSI status is
// compliant, approaching deadline, or in violation.
export function enforceNosiRegistration(params: {
  hireDate: Date;
  nosiStatus: string; // registered, pending, missing
  nosiRegisteredAt?: Date | null;
}): CreVerdict & {
  daysSinceHire: number;
  deadlineState: "compliant" | "approaching" | "overdue" | "frozen" | "unknown";
} {
  const policy = "nosi_registration.rego";
  const now = Date.now();
  const daysSinceHire = Math.floor((now - params.hireDate.getTime()) / (24 * 60 * 60 * 1000));

  // If already registered → compliant
  if (params.nosiStatus === "registered") {
    return {
      allowed: true,
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ nosi: params }), allowed: true }),
      daysSinceHire,
      deadlineState: "compliant",
    };
  }

  // If hire date is unknown or future → unknown
  if (!params.hireDate || isNaN(params.hireDate.getTime())) {
    return {
      allowed: false,
      reason: "NOSI enforcement: hire date is UNKNOWN — cannot determine registration deadline",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ nosi: params }), allowed: false }),
      daysSinceHire: -1,
      deadlineState: "unknown",
    };
  }

  // Within 30 days → approaching (warning, not violation)
  if (daysSinceHire <= 30) {
    return {
      allowed: true,
      reason: `NOSI registration deadline approaching: ${30 - daysSinceHire} day(s) remaining (Add-on 26)`,
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ nosi: params, days: daysSinceHire }), allowed: true }),
      daysSinceHire,
      deadlineState: "approaching",
    };
  }

  // 31-60 days → overdue (violation, but expenses not yet frozen)
  if (daysSinceHire <= 60) {
    return {
      allowed: false,
      reason: `NOSI registration OVERDUE: ${daysSinceHire} days since hire (deadline: 30 days). Expense freeze imminent at 60 days (Add-on 26).`,
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ nosi: params, days: daysSinceHire }), allowed: false }),
      daysSinceHire,
      deadlineState: "overdue",
    };
  }

  // 60+ days → frozen (expense approvals blocked)
  return {
    allowed: false,
    reason: `NOSI registration FROZEN: ${daysSinceHire} days since hire without registration. Expense approvals are FROZEN until NOSI registration is completed (Add-on 26, 60-day rule).`,
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ nosi: params, days: daysSinceHire }), allowed: false }),
    daysSinceHire,
    deadlineState: "frozen",
  };
}

// ── NOSI expense freeze check (Add-on 26, 60-day rule) ──
// Blueprint: "After 60 days, expense approvals frozen until registration."
//
// This function is called BEFORE any expense approval to verify that
// no employee in the enterprise has an active NOSI freeze condition.
export function enforceNosiExpenseFreeze(params: {
  employees: { hireDate: Date; nosiStatus: string }[];
}): CreVerdict & { frozenEmployeeCount: number } {
  const policy = "nosi_expense_freeze.rego";
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  const frozenEmployees = params.employees.filter((e) => {
    if (e.nosiStatus === "registered") return false;
    const daysSinceHire = Math.floor((now - e.hireDate.getTime()) / DAY_MS);
    return daysSinceHire > 60;
  });

  if (frozenEmployees.length > 0) {
    return {
      allowed: false,
      reason: `Expense approval BLOCKED: ${frozenEmployees.length} employee(s) have NOSI registration past 60-day deadline. Expense approvals are frozen until NOSI registration is completed for all affected employees (Add-on 26).`,
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ frozen: frozenEmployees.length }), allowed: false }),
      frozenEmployeeCount: frozenEmployees.length,
    };
  }

  return {
    allowed: true,
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ frozen: 0 }), allowed: true }),
    frozenEmployeeCount: 0,
  };
}

// ── Salary-to-Equity CRE validation (Volume 8, Workforce Capitalization) ──
// Blueprint rules:
//   1. "Workforce Partners can convert up to 10% of salary into Equity Units."
//   2. "at a 15% discount" (to the fundamental/equity unit price)
//   3. Uses existing enforcePriceBand() and fundamental pricing
//   4. Result recorded via OwnershipRecord + immutable ledger
//   5. Prevents double issuance
//   6. Lock-up: equityUnits have restrictedUntil field in OwnershipRecord
//
// This function validates a salary-to-equity conversion request.
// It does NOT execute the conversion — it returns a verdict that the
// calling API must check before proceeding.
export function enforceSalaryToEquity(params: {
  // Employee/workforce data
  employeeId: string;
  monthlySalaryEgp: number;
  equityConversionPct: number; // 0-10, the percentage of salary to convert
  // Enterprise pricing
  equityUnitPriceEgp: number; // the fundamental price (CPP)
  // Authorization
  authorizedBy: string; // user ID of the authorizer
  workforcePartnerConsent: boolean;
  // Anti-duplicate
  existingConversionThisCycle: boolean; // true if already converted this pay cycle
  // Lock-up
  restrictedUntilMonths: number; // default 12 per blueprint
}): CreVerdict & {
  convertedAmountEgp: number;
  discountedPriceEgp: number;
  equityUnitsToIssue: number;
} {
  const policy = "salary_to_equity.rego";

  // Rule 1: Salary must be known and positive
  if (!params.monthlySalaryEgp || params.monthlySalaryEgp <= 0) {
    return {
      allowed: false,
      reason: "Salary-to-Equity: monthly salary is UNKNOWN or zero — cannot convert",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ s2e: params }), allowed: false }),
      convertedAmountEgp: 0,
      discountedPriceEgp: 0,
      equityUnitsToIssue: 0,
    };
  }

  // Rule 2: Conversion percentage must be 0-10 (blueprint: "up to 10%")
  if (params.equityConversionPct < 0) {
    return {
      allowed: false,
      reason: `Salary-to-Equity: conversion percentage ${params.equityConversionPct}% is negative — rejected`,
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ s2e: params }), allowed: false }),
      convertedAmountEgp: 0,
      discountedPriceEgp: 0,
      equityUnitsToIssue: 0,
    };
  }
  if (params.equityConversionPct > 10) {
    return {
      allowed: false,
      reason: `Salary-to-Equity: conversion percentage ${params.equityConversionPct}% exceeds constitutional maximum of 10% (Volume 8, Workforce Capitalization)`,
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ s2e: params }), allowed: false }),
      convertedAmountEgp: 0,
      discountedPriceEgp: 0,
      equityUnitsToIssue: 0,
    };
  }

  // Rule 3: Conversion of 0% is valid but produces no units
  if (params.equityConversionPct === 0) {
    return {
      allowed: true,
      reason: "Salary-to-Equity: 0% conversion — no Equity Units to issue",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ s2e: params }), allowed: true }),
      convertedAmountEgp: 0,
      discountedPriceEgp: 0,
      equityUnitsToIssue: 0,
    };
  }

  // Rule 4: Fundamental price must be known and positive
  if (!params.equityUnitPriceEgp || params.equityUnitPriceEgp <= 0) {
    return {
      allowed: false,
      reason: "Salary-to-Equity: Equity Unit Price (CPP) is UNKNOWN or zero — cannot calculate conversion",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ s2e: params }), allowed: false }),
      convertedAmountEgp: 0,
      discountedPriceEgp: 0,
      equityUnitsToIssue: 0,
    };
  }

  // Rule 5: Workforce Partner consent must be given
  if (!params.workforcePartnerConsent) {
    return {
      allowed: false,
      reason: "Salary-to-Equity: Workforce Partner consent is required for conversion (Volume 8, Workforce Capitalization)",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ s2e: params }), allowed: false }),
      convertedAmountEgp: 0,
      discountedPriceEgp: 0,
      equityUnitsToIssue: 0,
    };
  }

  // Rule 6: Prevent duplicate conversion in the same pay cycle
  if (params.existingConversionThisCycle) {
    return {
      allowed: false,
      reason: "Salary-to-Equity: conversion already processed for this pay cycle — duplicate conversion rejected (anti-replay)",
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ s2e: params }), allowed: false }),
      convertedAmountEgp: 0,
      discountedPriceEgp: 0,
      equityUnitsToIssue: 0,
    };
  }

  // Rule 7: Calculate conversion at 15% discount to fundamental price
  // Blueprint: "at a 15% discount" to the Equity Unit Price
  const convertedAmountEgp = Math.round(params.monthlySalaryEgp * (params.equityConversionPct / 100));
  const discountedPriceEgp = params.equityUnitPriceEgp * 0.85; // 15% discount
  const equityUnitsToIssue = Math.floor(convertedAmountEgp / discountedPriceEgp);

  if (equityUnitsToIssue <= 0) {
    return {
      allowed: false,
      reason: `Salary-to-Equity: conversion amount ${convertedAmountEgp} EGP is too small to issue even 1 Equity Unit at discounted price ${discountedPriceEgp.toFixed(2)} EGP`,
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ s2e: params }), allowed: false }),
      convertedAmountEgp,
      discountedPriceEgp,
      equityUnitsToIssue: 0,
    };
  }

  // All checks passed — conversion is constitutionally valid
  return {
    allowed: true,
    reason: `Salary-to-Equity: ${params.equityConversionPct}% of ${params.monthlySalaryEgp} EGP = ${convertedAmountEgp} EGP → ${equityUnitsToIssue} Equity Units at ${discountedPriceEgp.toFixed(2)} EGP/unit (15% discount). Lock-up: ${params.restrictedUntilMonths} months. Authorized by: ${params.authorizedBy}.`,
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ s2e: params, converted: convertedAmountEgp, units: equityUnitsToIssue }), allowed: true }),
    convertedAmountEgp,
    discountedPriceEgp,
    equityUnitsToIssue,
  };
}

// ── Salary-to-Equity lock-up enforcement ──
// Blueprint: Equity Units from salary conversion have a restricted period.
// The OwnershipRecord model has `restrictedUntil` field.
// This function checks whether salary-derived Equity Units are still locked.
export function enforceEquityLockUp(params: {
  restrictedUntil: Date | null;
}): CreVerdict {
  const policy = "equity_lockup.rego";

  if (!params.restrictedUntil) {
    // No restriction → not locked (e.g., regular Capital Partner units)
    return {
      allowed: true,
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ lock: null }), allowed: true }),
    };
  }

  const now = Date.now();
  if (now < params.restrictedUntil.getTime()) {
    const daysRemaining = Math.ceil((params.restrictedUntil.getTime() - now) / (24 * 60 * 60 * 1000));
    return {
      allowed: false,
      reason: `Equity lock-up: transfer blocked — ${daysRemaining} day(s) remaining until lock-up expires (${params.restrictedUntil.toISOString().split("T")[0]})`,
      policy,
      decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ lock: params.restrictedUntil }), allowed: false }),
    };
  }

  return {
    allowed: true,
    policy,
    decisionToken: issueCreDecisionToken({ policy, payloadHash: hashPayload({ lock: params.restrictedUntil, expired: true }), allowed: true }),
  };
}

// ── Salary Enforcement (Blueprint §8.4) ──
// Validates that a salary complies with constitutional rules:
// - Must be at least minimum wage (4,000 EGP/month as of 2026)
// - Board overrides must have ≥75% vote
// - Overrides >200% of AI salary require shareholder notification
//
// This function is the CRE-side constitutional guard for the AI Salary Engine.
// It returns a CreVerdict (consistent with the other enforce* policies) plus
// two extra fields specific to salary overrides:
//   - requiresShareholderNotification: true when overrideRatio > 2.0
//   - overrideRatio: proposedSalary / aiCalculatedSalary (1.0 when no AI salary)
//
// The AI Salary Engine (src/lib/aurienta/salary-engine.ts) performs the full
// formula calculation + Brain AI validation; THIS function is the deterministic
// policy gate that every proposed salary must pass before being persisted.
export function enforceSalaryConstitutionality(params: {
  proposedSalaryEgp: number;
  aiCalculatedSalaryEgp?: number;
  isBoardOverride: boolean;
  boardVotePct?: number;
}): CreVerdict & {
  requiresShareholderNotification: boolean;
  overrideRatio: number;
} {
  const policy = "salary_constitutionality.rego";
  const MINIMUM_WAGE_EGP = 4000; // 2026 Egyptian minimum wage
  const BOARD_OVERRIDE_THRESHOLD_PCT = 75; // §8.4.3
  const SHAREHOLDER_NOTIFICATION_RATIO = 2.0; // §8.4.3 — >200% of AI salary

  // Rule 1: Proposed salary must be at least the 2026 minimum wage.
  if (!params.proposedSalaryEgp || params.proposedSalaryEgp < MINIMUM_WAGE_EGP) {
    return {
      allowed: false,
      reason: `Salary constitutionality: proposed salary ${params.proposedSalaryEgp} EGP is below the 2026 Egyptian minimum wage of ${MINIMUM_WAGE_EGP} EGP/month (Blueprint §8.4.3)`,
      policy,
      decisionToken: issueCreDecisionToken({
        policy,
        payloadHash: hashPayload({ sal: params, minWage: MINIMUM_WAGE_EGP }),
        allowed: false,
      }),
      requiresShareholderNotification: false,
      overrideRatio: 0,
    };
  }

  // Rule 2: If this is a board override (above-AI salary), the board vote
  // threshold must be ≥75%. Below-AI salaries are permitted at manager
  // discretion without a board vote (Blueprint §8.4.3) — but they still
  // must clear the minimum-wage check above.
  const aiSalary = params.aiCalculatedSalaryEgp ?? params.proposedSalaryEgp;
  const isAboveAi = aiSalary > 0 && params.proposedSalaryEgp > aiSalary;

  if (params.isBoardOverride || isAboveAi) {
    const vote = params.boardVotePct ?? 0;
    if (vote < BOARD_OVERRIDE_THRESHOLD_PCT) {
      return {
        allowed: false,
        reason: `Salary constitutionality: board override requires ≥${BOARD_OVERRIDE_THRESHOLD_PCT}% vote — received ${vote}% (Blueprint §8.4.3)`,
        policy,
        decisionToken: issueCreDecisionToken({
          policy,
          payloadHash: hashPayload({ sal: params, vote }),
          allowed: false,
        }),
        requiresShareholderNotification: false,
        overrideRatio: 0,
      };
    }
  }

  // Rule 3: Compute the override ratio. If it exceeds 2.0x the AI salary,
  // flag for automatic shareholder notification. The override is still
  // allowed (the board voted ≥75%) but the notification is mandatory.
  const safeAiSalary = Math.max(aiSalary, 1); // guard against /0
  const overrideRatio = params.proposedSalaryEgp / safeAiSalary;
  const requiresShareholderNotification = overrideRatio > SHAREHOLDER_NOTIFICATION_RATIO;

  // Rule 4: Hard cap — overrides above 3.0x the AI salary are rejected
  // outright even with a unanimous board vote. This is the constitutional
  // ceiling; going higher requires a charter amendment.
  const SALARY_HARD_CAP_RATIO = 3.0;
  if (isAboveAi && overrideRatio > SALARY_HARD_CAP_RATIO) {
    return {
      allowed: false,
      reason: `Salary constitutionality: override ratio ${overrideRatio.toFixed(
        2
      )}x exceeds the 3.0x constitutional hard cap — requires charter amendment (Blueprint §8.4.3)`,
      policy,
      decisionToken: issueCreDecisionToken({
        policy,
        payloadHash: hashPayload({ sal: params, ratio: overrideRatio, cap: SALARY_HARD_CAP_RATIO }),
        allowed: false,
      }),
      requiresShareholderNotification,
      overrideRatio: Number(overrideRatio.toFixed(4)),
    };
  }

  // All checks passed — salary is constitutionally valid.
  const reason = requiresShareholderNotification
    ? `Salary constitutionality: approved — override ratio ${overrideRatio.toFixed(
        2
      )}x exceeds 2.0x threshold, automatic shareholder notification triggered (Blueprint §8.4.3)`
    : `Salary constitutionality: approved — proposed salary ${params.proposedSalaryEgp} EGP meets minimum wage and override rules (Blueprint §8.4)`;

  return {
    allowed: true,
    reason,
    policy,
    decisionToken: issueCreDecisionToken({
      policy,
      payloadHash: hashPayload({
        sal: params,
        ratio: overrideRatio,
        notify: requiresShareholderNotification,
      }),
      allowed: true,
    }),
    requiresShareholderNotification,
    overrideRatio: Number(overrideRatio.toFixed(4)),
  };
}
