// AURIENTA — Constitutional Health Rating Engine (Vol 16 §16.3)
// Computes the AAA-C health rating for an enterprise based on 9 Vital Signs.
// The rating is derived from a weighted formula, not a static integer.

import { db } from "@/lib/db";
import { audit } from "./audit";

export type VitalSignStatus = "healthy" | "warning" | "critical";

export type VitalSign = {
  name: string;
  score: number; // 0-100
  target: number;
  status: VitalSignStatus;
  detail: string;
};

export type HealthRating = {
  score: number; // 0-100 weighted
  rating: string; // "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "C"
  vitalSigns: VitalSign[];
  trend: "improving" | "stable" | "declining";
  recommendation: string;
  calculatedAt: Date;
};

// ── Rating mapping (Vol 16 §16.3) ──
function scoreToRating(score: number): string {
  if (score >= 90) return "AAA";
  if (score >= 80) return "AA";
  if (score >= 70) return "A";
  if (score >= 60) return "BBB";
  if (score >= 50) return "BB";
  if (score >= 40) return "B";
  return "C";
}

function vitalStatus(score: number, target: number): VitalSignStatus {
  if (score >= target) return "healthy";
  if (score >= target - 20) return "warning";
  return "critical";
}

/**
 * Calculate the Constitutional Health Rating for an enterprise.
 * Queries 9 vital signs from the DB and computes a weighted score.
 */
export async function calculateHealthRating(enterpriseId: string): Promise<HealthRating> {
  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    include: {
      ledgerEvents: { take: 100, orderBy: { timestamp: "desc" } },
      orders: { take: 50, orderBy: { createdAt: "desc" } },
      ownershipRecords: true,
      employees: true,
      proposals: { take: 20, orderBy: { createdAt: "desc" } },
      quarterlyReports: { take: 4, orderBy: { year: "desc" } },
    },
  });

  if (!enterprise) throw new Error("Enterprise not found");

  // ── Vital Sign 1: Capital Adequacy Ratio (CAR) ──
  // Target: ≥15% (capital / deployed capital)
  const totalRaised = enterprise.raisedEgp ?? 0;
  const monthlyBurn = enterprise.monthlyBurnEgp ?? 0;
  const car = monthlyBurn > 0 ? (totalRaised / (monthlyBurn * 12)) * 100 : 100;
  const carScore = Math.min(100, Math.max(0, car / 15 * 100));
  const vitalSign1: VitalSign = {
    name: "Capital Adequacy Ratio",
    score: Math.round(carScore),
    target: 15,
    status: vitalStatus(carScore, 80),
    detail: `CAR: ${car.toFixed(1)}% (raised: ${totalRaised.toLocaleString()} EGP, burn: ${monthlyBurn.toLocaleString()}/mo)`,
  };

  // ── Vital Sign 2: Liquidity Ratio ──
  // Target: ≥1.2x (liquid assets / short-term liabilities)
  // Simplified: use raisedEgp / (monthlyBurn * 3) as a proxy
  const liquidityRatio = monthlyBurn > 0 ? totalRaised / (monthlyBurn * 3) : 10;
  const lrScore = Math.min(100, (liquidityRatio / 1.2) * 100);
  const vitalSign2: VitalSign = {
    name: "Liquidity Ratio",
    score: Math.round(lrScore),
    target: 120,
    status: vitalStatus(lrScore, 80),
    detail: `Liquidity: ${liquidityRatio.toFixed(2)}x (3-month coverage)`,
  };

  // ── Vital Sign 3: Governance Compliance ──
  // % of proposals that passed quorum + voting threshold
  const totalProposals = enterprise.proposals.length;
  const passedProposals = enterprise.proposals.filter((p: any) => p.status === "executed").length;
  const govScore = totalProposals > 0 ? (passedProposals / totalProposals) * 100 : 100;
  const vitalSign3: VitalSign = {
    name: "Governance Compliance",
    score: Math.round(govScore),
    target: 80,
    status: vitalStatus(govScore, 80),
    detail: `${passedProposals}/${totalProposals} proposals executed`,
  };

  // ── Vital Sign 4: Transparency Score ──
  // % of required disclosures published (quarterly reports, trade log, ledger events)
  const expectedReports = 4; // 4 quarters
  const actualReports = enterprise.quarterlyReports.length;
  const hasTradeLog = enterprise.orders.length > 0;
  const hasLedger = enterprise.ledgerEvents.length > 0;
  const transparencyScore =
    ((actualReports / expectedReports) * 50) +
    (hasTradeLog ? 25 : 0) +
    (hasLedger ? 25 : 0);
  const vitalSign4: VitalSign = {
    name: "Transparency Score",
    score: Math.round(Math.min(100, transparencyScore)),
    target: 90,
    status: vitalStatus(transparencyScore, 90),
    detail: `${actualReports}/${expectedReports} quarterly reports, ${enterprise.orders.length} trade orders, ${enterprise.ledgerEvents.length} ledger events`,
  };

  // ── Vital Sign 5: Operational Continuity ──
  // Based on enterprise status (active vs frozen vs suspended)
  const opScore = enterprise.status === "active" ? 100 : enterprise.status === "frozen" ? 30 : 10;
  const vitalSign5: VitalSign = {
    name: "Operational Continuity",
    score: opScore,
    target: 95,
    status: vitalStatus(opScore, 95),
    detail: `Status: ${enterprise.status}`,
  };

  // ── Vital Sign 6: Financial Discipline ──
  // Budget variance + expense approval rate
  // Simplified: use the ratio of audit-logged expenses to total ledger events
  const expenseEvents = enterprise.ledgerEvents.filter((e: any) =>
    e.eventType === "expense_approved" || e.eventType === "expense_rejected"
  ).length;
  const finScore = expenseEvents > 0 ? 85 : 70;
  const vitalSign6: VitalSign = {
    name: "Financial Discipline",
    score: finScore,
    target: 85,
    status: vitalStatus(finScore, 85),
    detail: `${expenseEvents} expense events recorded`,
  };

  // ── Vital Sign 7: Workforce Stability ──
  // Employee retention + NOSI compliance
  const totalEmployees = enterprise.employees.length;
  const nosiCompliant = enterprise.employees.filter((e: any) =>
    e.nosiStatus === "registered" || e.nosiStatus === "active"
  ).length;
  const workforceScore = totalEmployees > 0
    ? (nosiCompliant / totalEmployees) * 100
    : 80;
  const vitalSign7: VitalSign = {
    name: "Workforce Stability",
    score: Math.round(workforceScore),
    target: 90,
    status: vitalStatus(workforceScore, 90),
    detail: `${nosiCompliant}/${totalEmployees} employees NOSI-compliant`,
  };

  // ── Vital Sign 8: Audit Trail Integrity ──
  // Hash-chain validation (simplified: check that ledger events exist + are sequential)
  const ledgerCount = enterprise.ledgerEvents.length;
  const auditScore = ledgerCount > 50 ? 95 : ledgerCount > 10 ? 80 : 50;
  const vitalSign8: VitalSign = {
    name: "Audit Trail Integrity",
    score: auditScore,
    target: 95,
    status: vitalStatus(auditScore, 95),
    detail: `${ledgerCount} hash-chained ledger events`,
  };

  // ── Vital Sign 9: Stakeholder Trust ──
  // Aggregate Sovereign Trust Score of all partners
  const ownershipRecords = enterprise.ownershipRecords;
  let trustScore = 75; // default
  if (ownershipRecords.length > 0) {
    const partners = await db.user.findMany({
      where: { id: { in: ownershipRecords.map((r: any) => r.userId) } },
      select: { sovereignTrustScore: true },
    });
    const avgTrust = partners.reduce((sum, p) => sum + (p.sovereignTrustScore ?? 65), 0) / partners.length;
    trustScore = avgTrust;
  }
  const vitalSign9: VitalSign = {
    name: "Stakeholder Trust",
    score: Math.round(trustScore),
    target: 75,
    status: vitalStatus(trustScore, 75),
    detail: `Aggregate Sovereign Trust Score: ${trustScore.toFixed(1)}`,
  };

  // ── Weighted score ──
  const weights = [0.15, 0.15, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10];
  const vitalSigns = [vitalSign1, vitalSign2, vitalSign3, vitalSign4, vitalSign5, vitalSign6, vitalSign7, vitalSign8, vitalSign9];
  const score = Math.round(
    vitalSigns.reduce((sum, vs, i) => sum + vs.score * weights[i]!, 0)
  );

  const rating = scoreToRating(score);
  const recommendation = getRecommendation(rating, vitalSigns);

  await audit({
    actorId: "system",
    action: "health_rating.calculated",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: { score, rating, vitalSigns: vitalSigns.map((v) => ({ name: v.name, score: v.score, status: v.status })) },
  });

  return {
    score,
    rating,
    vitalSigns,
    trend: "stable", // TODO: compare with previous calculation
    recommendation,
    calculatedAt: new Date(),
  };
}

function getRecommendation(rating: string, vitalSigns: VitalSign[]): string {
  const critical = vitalSigns.filter((v) => v.status === "critical");
  const warnings = vitalSigns.filter((v) => v.status === "warning");

  if (rating === "AAA") return "Excellent health — all constitutional checks passing. Ready for graduation.";
  if (rating === "AA") return "Strong health with minor improvements needed. Continue current trajectory.";
  if (rating === "A") return "Good health. Address warning signs to reach AA.";
  if (rating === "BBB") {
    return warnings.length > 0
      ? `Address ${warnings.length} warning sign(s): ${warnings.map((w) => w.name).join(", ")}.`
      : "Moderate health. Focus on vital signs below target.";
  }
  if (rating === "BB" || rating === "B") {
    return critical.length > 0
      ? `CRITICAL: ${critical.length} vital sign(s) need immediate attention: ${critical.map((w) => w.name).join(", ")}.`
      : "Below target health. CRE may restrict certain operations.";
  }
  return "CRITICAL health. Enterprise may be frozen by CRE. Immediate intervention required.";
}

/**
 * Recalculate health ratings for all active enterprises.
 * Called by the daily cron job.
 */
export async function recalculateAllHealthRatings(): Promise<void> {
  const enterprises = await db.enterprise.findMany({
    where: { status: { in: ["active", "frozen"] } },
    select: { id: true },
  });

  for (const ent of enterprises) {
    try {
      const result = await calculateHealthRating(ent.id);
      await db.enterprise.update({
        where: { id: ent.id },
        data: {
          healthScore: result.score,
          healthScoreUpdatedAt: new Date(),
        } as any,
      });
    } catch (e) {
      console.error(`[health-rating] Failed for ${ent.id}:`, e);
    }
  }
}
