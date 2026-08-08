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
