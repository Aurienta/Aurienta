// Profit-Sharing Agreements — ROADMAP-02 (Phase 1).
//
// These are constitutional CONTRACTS, NOT securities:
//   - No fixed coupon (the partner's payout depends on actual enterprise revenue)
//   - No secondary market (no trading — the agreement is bound to one partner)
//   - No speculative instrument (CRE-enforced terms, not transferable)
//
// Compliant with Vol 25 §25.7 and Egyptian Capital Market Law 95/1992:
// a contractual profit-share agreement (مشاركة في الأرباح) is not a security
// because it is not a tradable instrument, carries no fixed return, and
// distributes only from realized enterprise revenue.
//
// The CRE policy `enforceProfitShareAgreement` validates:
//   - beneficiary != AURIENTA (Zero Custody)
//   - profitSharePct <= 30 (anti-capture)
//   - termMonths 1-60 (no perpetual instruments)
//   - contributionEgp >= 50 (Tier A accessibility)

import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import {
  appendLedgerEvent,
  enforceProfitShareAgreement,
  type CreVerdict,
} from "@/lib/aurienta/cre";

// ── Types ──
export type AgreementStatus = "active" | "fulfilled" | "terminated";

export type Agreement = {
  id: string;
  enterpriseId: string;
  partnerId: string;
  title: string;
  contributionEgp: number;
  profitSharePct: number;
  termMonths: number;
  startedAt: string;
  maturesAt: string;
  status: AgreementStatus;
  totalDistributedEgp: number;
  creDecisionToken: string | null;
  createdAt: string;
};

export type AgreementWithEnterprise = Agreement & {
  enterprise?: {
    id: string;
    name: string;
    slug: string;
    tier: string;
  } | null;
};

export type CreateAgreementParams = {
  enterpriseId: string;
  partnerId: string;
  title: string;
  contributionEgp: number;
  profitSharePct: number;
  termMonths: number;
};

export type CreateAgreementResult = {
  agreement: Agreement;
  verdict: CreVerdict;
};

/** Map a Prisma row to the public Agreement shape. */
function toAgreement(row: {
  id: string;
  enterpriseId: string;
  partnerId: string;
  title: string;
  contributionEgp: number;
  profitSharePct: number;
  termMonths: number;
  startedAt: Date;
  maturesAt: Date;
  status: string;
  totalDistributedEgp: number;
  creDecisionToken: string | null;
  createdAt: Date;
}): Agreement {
  return {
    id: row.id,
    enterpriseId: row.enterpriseId,
    partnerId: row.partnerId,
    title: row.title,
    contributionEgp: row.contributionEgp,
    profitSharePct: row.profitSharePct,
    termMonths: row.termMonths,
    startedAt: row.startedAt.toISOString(),
    maturesAt: row.maturesAt.toISOString(),
    status: normalizeStatus(row.status),
    totalDistributedEgp: row.totalDistributedEgp,
    creDecisionToken: row.creDecisionToken,
    createdAt: row.createdAt.toISOString(),
  };
}

function normalizeStatus(s: string): AgreementStatus {
  if (s === "fulfilled" || s === "terminated") return s;
  return "active";
}

/** Add N months to a date, preserving day-of-month where possible. */
function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  const originalDay = d.getDate();
  d.setMonth(d.getMonth() + months);
  // Handle month overflow (e.g. Jan 31 + 1 month → Mar 3).
  if (d.getDate() < originalDay) {
    d.setDate(0); // roll back to last day of previous month
  }
  return d;
}

// ── createAgreement ──
// Validates via the CRE policy `enforceProfitShareAgreement`. If allowed,
// persists the ProfitShareAgreement + appends a ledger event inside ONE
// db.$transaction (so the agreement row + immutable ledger entry commit
// atomically). Throws Error with verdict.reason if the CRE denies.
export async function createAgreement(
  params: CreateAgreementParams
): Promise<CreateAgreementResult> {
  // The beneficiary is the partner (never AURIENTA — Zero Custody).
  // The CRE uses the beneficiary string only to enforce Zero Custody; we
  // pass the partnerId, which is a platform user id that can never be "aurienta".
  const verdict = enforceProfitShareAgreement({
    contributionEgp: params.contributionEgp,
    profitSharePct: params.profitSharePct,
    termMonths: params.termMonths,
    beneficiary: params.partnerId,
  });

  if (!verdict.allowed) {
    await audit({
      actorId: params.partnerId,
      action: "profit_share.create",
      target: `enterprise:${params.enterpriseId}`,
      result: "denied",
      reason: verdict.reason ?? "CRE denied",
      metadata: {
        policy: verdict.policy,
        contributionEgp: params.contributionEgp,
        profitSharePct: params.profitSharePct,
        termMonths: params.termMonths,
      },
    });
    throw new Error(verdict.reason ?? "CRE denied profit-share agreement");
  }

  const now = new Date();
  const maturesAt = addMonths(now, params.termMonths);

  const created = await db.$transaction(async (tx) => {
    const row = await tx.profitShareAgreement.create({
      data: {
        enterpriseId: params.enterpriseId,
        partnerId: params.partnerId,
        title: params.title.trim().slice(0, 200),
        contributionEgp: params.contributionEgp,
        profitSharePct: params.profitSharePct,
        termMonths: params.termMonths,
        startedAt: now,
        maturesAt,
        status: "active",
        totalDistributedEgp: 0,
        creDecisionToken: verdict.decisionToken,
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: params.enterpriseId,
      eventType: "cre_decision",
      payload: {
        action: "profit_share_agreement_created",
        agreementId: row.id,
        title: row.title,
        partnerId: params.partnerId,
        contributionEgp: params.contributionEgp,
        profitSharePct: params.profitSharePct,
        termMonths: params.termMonths,
        maturesAt: maturesAt.toISOString(),
        creDecisionToken: verdict.decisionToken,
        policy: verdict.policy,
        note: "Constitutional profit-share agreement (مشاركة في الأرباح). Not a security under Egyptian Capital Market Law 95/1992 — no fixed coupon, no secondary market, no trading.",
      },
      actorId: params.partnerId,
    });

    return row;
  });

  await audit({
    actorId: params.partnerId,
    action: "profit_share.create",
    target: `enterprise:${params.enterpriseId}`,
    result: "allowed",
    metadata: {
      agreementId: created.id,
      contributionEgp: params.contributionEgp,
      profitSharePct: params.profitSharePct,
      termMonths: params.termMonths,
      policy: verdict.policy,
    },
  });

  return {
    agreement: toAgreement(created),
    verdict,
  };
}

// ── listAgreementsForUser ──
// Returns agreements where partnerId = userId. Each agreement is enriched
// with the enterprise's name/slug/tier via a separate lookup (the schema
// uses plain String FKs without Prisma relations to keep the model
// isolated from the larger User/Enterprise graphs).
export async function listAgreementsForUser(
  userId: string
): Promise<AgreementWithEnterprise[]> {
  const rows = await db.profitShareAgreement.findMany({
    where: { partnerId: userId },
    orderBy: { createdAt: "desc" },
  });

  if (rows.length === 0) return [];

  const enterpriseIds = Array.from(
    new Set(rows.map((r) => r.enterpriseId))
  );
  const enterprises = await db.enterprise.findMany({
    where: { id: { in: enterpriseIds } },
    select: { id: true, name: true, slug: true, tier: true },
  });
  const entById = new Map(enterprises.map((e) => [e.id, e]));

  return rows.map((r) => ({
    ...toAgreement(r),
    enterprise: entById.get(r.enterpriseId) ?? null,
  }));
}

// ── listAgreementsForEnterprise ──
// For enterprise managers / partners reviewing the agreements bound to
// their enterprise.
export async function listAgreementsForEnterprise(
  enterpriseId: string
): Promise<AgreementWithEnterprise[]> {
  const rows = await db.profitShareAgreement.findMany({
    where: { enterpriseId },
    orderBy: { createdAt: "desc" },
  });

  if (rows.length === 0) return [];

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { id: true, name: true, slug: true, tier: true },
  });

  return rows.map((r) => ({
    ...toAgreement(r),
    enterprise: enterprise,
  }));
}

// ── recordDistribution ──
// Records a profit distribution from enterprise revenue against the agreement.
// Increments totalDistributedEgp and appends a ledger event inside ONE
// transaction. If totalDistributed >= contribution * 2, the agreement is
// auto-transitioned to status='fulfilled'.
//
// NOTE: This function does NOT move funds — funds flow through the law firm
// client account (Zero Custody). It only records the distribution on the
// agreement ledger so the partner's payout history is transparent.
export async function recordDistribution(
  agreementId: string,
  amountEgp: number
): Promise<void> {
  if (!Number.isFinite(amountEgp) || amountEgp <= 0) {
    throw new Error("Distribution amount must be a positive number");
  }

  const existing = await db.profitShareAgreement.findUnique({
    where: { id: agreementId },
  });
  if (!existing) {
    throw new Error("Agreement not found");
  }
  if (existing.status !== "active") {
    throw new Error(
      `Cannot record distribution on agreement with status '${existing.status}'`
    );
  }

  const newTotal = existing.totalDistributedEgp + Math.round(amountEgp);
  const fulfillThreshold = existing.contributionEgp * 2;
  const willFulfill = newTotal >= fulfillThreshold;

  await db.$transaction(async (tx) => {
    const updated = await tx.profitShareAgreement.update({
      where: { id: agreementId },
      data: {
        totalDistributedEgp: newTotal,
        ...(willFulfill ? { status: "fulfilled" } : {}),
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "cre_decision",
      payload: {
        action: "profit_share_distribution_recorded",
        agreementId: existing.id,
        partnerId: existing.partnerId,
        amountEgp: Math.round(amountEgp),
        previousTotalEgp: existing.totalDistributedEgp,
        newTotalEgp: updated.totalDistributedEgp,
        contributionEgp: existing.contributionEgp,
        fulfillThresholdEgp: fulfillThreshold,
        fulfilled: willFulfill,
        note: willFulfill
          ? "Agreement fulfilled — total distributions reached 2x contribution."
          : "Profit-share distribution recorded from enterprise revenue.",
      },
    });
  });

  await audit({
    actorId: existing.partnerId,
    action: "profit_share.distribute",
    target: `profit_share:${agreementId}`,
    result: "allowed",
    metadata: {
      amountEgp: Math.round(amountEgp),
      newTotalEgp: newTotal,
      fulfilled: willFulfill,
    },
  });
}

// ── terminateAgreement ──
// Sets status='terminated' and appends a ledger event. Only active
// agreements can be terminated. Once terminated, no further distributions
// may be recorded against the agreement.
export async function terminateAgreement(
  agreementId: string,
  actorId: string
): Promise<void> {
  const existing = await db.profitShareAgreement.findUnique({
    where: { id: agreementId },
  });
  if (!existing) {
    throw new Error("Agreement not found");
  }
  if (existing.status !== "active") {
    throw new Error(
      `Agreement is already in status '${existing.status}' — cannot terminate`
    );
  }

  await db.$transaction(async (tx) => {
    await tx.profitShareAgreement.update({
      where: { id: agreementId },
      data: { status: "terminated" },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "cre_decision",
      payload: {
        action: "profit_share_agreement_terminated",
        agreementId: existing.id,
        partnerId: existing.partnerId,
        terminatedBy: actorId,
        title: existing.title,
        totalDistributedEgp: existing.totalDistributedEgp,
        contributionEgp: existing.contributionEgp,
        note: "Profit-share agreement terminated by partner. No further distributions will be recorded.",
      },
      actorId,
    });
  });

  await audit({
    actorId,
    action: "profit_share.terminate",
    target: `profit_share:${agreementId}`,
    result: "allowed",
    metadata: {
      partnerId: existing.partnerId,
      enterpriseId: existing.enterpriseId,
    },
  });
}
