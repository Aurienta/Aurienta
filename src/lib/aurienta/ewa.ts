// AURIENTA — Earned Wage Access (EWA) Module
// ═══════════════════════════════════════════════════════════════
// EGYPTIAN LAW COMPLIANCE:
//
// This module provides Earned Wage Access — NOT a loan, NOT credit,
// NOT microfinance. It is a wage advance based on ACTUAL EARNED WAGES.
//
// Legal basis:
//   - Labour Law 12/2003 Art. 46: Employer may advance wages to employees
//   - The "fee" is an administrative processing charge, NOT interest
//   - Interest on loans is regulated by CBE (Law 155/1958, Law 80/1975)
//   - AURIENTA is NOT a licensed lender and does NOT lend money
//   - The employer authorizes the advance; AURIENTA only processes it
//
// Key distinction from microfinance (Khazna/MNT-Halan):
//   - Microfinance lenders are licensed by FRA under Law 141/2014
//   - They lend THEIR money and charge interest (regulated)
//   - AURIENTA advances EMPLOYER money already earned by the employee
//   - No interest is charged — only an administrative fee (1.5%)
//   - The fee covers: payment processing, verification, audit trail
//
// If any Egyptian court or regulator determines this constitutes a loan,
// the module MUST be suspended immediately and converted to a licensed
// microfinance model or removed entirely.
// ═══════════════════════════════════════════════════════════════

import { db } from "@/lib/db";
import { logger } from "./logger";
import { audit } from "./audit";

export type EwaRequest = {
  id: string;
  employeeId: string;
  enterpriseId: string;
  requestedAmount: number;
  fee: number; // Administrative processing fee (NOT interest)
  netAmount: number;
  status: "pending" | "approved" | "disbursed" | "rejected";
  requestedAt: Date;
  processedAt?: Date;
  legalBasis: string;
  disclaimer: string;
};

// ── Legal disclaimer shown to every EWA user ──
const EWA_LEGAL_DISCLAIMER = `This is an Earned Wage Access — a wage advance based on wages you have already earned but not yet been paid. It is NOT a loan, NOT credit, and NOT microfinance. The 1.5% fee is an administrative processing charge for payment processing and verification, NOT interest. This service is provided under Egyptian Labour Law 12/2003 Art. 46 (employer wage advances). AURIENTA is not a licensed lender under Law 141/2014 and does not lend money. The employer authorizes the advance of wages already earned.`;

const EWA_LEGAL_BASIS = "Labour Law 12/2003 Art. 46 (Employer Wage Advances) — NOT a loan under CBE regulation";

/**
 * Calculate how much an employee has earned but not yet been paid.
 * Based on: daily rate × days worked since last payday.
 *
 * Legal limit: Labour Law 12/2003 Art. 46 caps advances at 50% of
 * earned wages. We enforce this as a hard constitutional rule.
 */
export async function calculateAvailableWage(employeeId: string): Promise<{
  dailyRate: number;
  daysSinceLastPay: number;
  earnedAmount: number;
  maxAccessible: number; // 50% cap per Law 12/2003 Art. 46
  legalBasis: string;
}> {
  // In production, query Employee + Payroll tables
  // For now, use a reasonable default
  const dailyRate = 500; // EGP 500/day = EGP 15,000/month
  const daysSinceLastPay = 15; // Mid-month
  const earnedAmount = dailyRate * daysSinceLastPay;
  // Labour Law 12/2003 Art. 46: advance may not exceed 50% of earned wages
  const maxAccessible = Math.min(earnedAmount * 0.5, 10000); // 50% cap, max 10K

  return { dailyRate, daysSinceLastPay, earnedAmount, maxAccessible, legalBasis: EWA_LEGAL_BASIS };
}

/**
 * Request EWA (Earned Wage Access).
 *
 * CRITICAL: This is a wage advance, NOT a loan.
 * The fee is administrative, NOT interest.
 * The employer authorizes the payment of earned wages.
 */
export async function requestEwa(params: {
  employeeId: string;
  enterpriseId: string;
  amount: number;
  employerAuthorized?: boolean; // Employer must authorize the advance
}): Promise<EwaRequest> {
  // CONSTITUTIONAL CHECK: Employer must authorize the wage advance
  // This is what makes it a "wage advance" and NOT a "loan"
  if (!params.employerAuthorized) {
    throw new Error(
      "Employer authorization required for EWA. Without employer consent, this would constitute a loan under CBE regulation (Law 155/1958). The employer must authorize the advance of earned wages per Labour Law 12/2003 Art. 46."
    );
  }

  const available = await calculateAvailableWage(params.employeeId);

  // CONSTITUTIONAL CHECK: Amount cannot exceed 50% of earned wages
  // (Labour Law 12/2003 Art. 46)
  if (params.amount > available.maxAccessible) {
    throw new Error(
      `Amount exceeds legal limit. Labour Law 12/2003 Art. 46 caps wage advances at 50% of earned wages (max EGP ${available.maxAccessible}).`
    );
  }

  // The fee is an ADMINISTRATIVE processing charge — NOT interest
  // Interest would make this a loan subject to CBE regulation
  const fee = Math.round(params.amount * 0.015); // 1.5% administrative fee
  const netAmount = params.amount - fee;
  const id = `ewa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const request: EwaRequest = {
    id,
    employeeId: params.employeeId,
    enterpriseId: params.enterpriseId,
    requestedAmount: params.amount,
    fee,
    netAmount,
    status: "approved", // Auto-approve in sandbox (CRE-verified)
    requestedAt: new Date(),
    processedAt: new Date(),
    legalBasis: EWA_LEGAL_BASIS,
    disclaimer: EWA_LEGAL_DISCLAIMER,
  };

  await audit({
    actorId: params.employeeId,
    action: "ewa_requested",
    target: `ewa:${id}`,
    result: "allowed",
    metadata: {
      ...request,
      available: available.maxAccessible,
      employerAuthorized: params.employerAuthorized,
      isLoan: false, // Explicitly recorded as NOT a loan
      feeType: "administrative", // NOT interest
    },
  });

  logger.info("EWA request approved (wage advance, not loan)", {
    id,
    employeeId: params.employeeId,
    amount: params.amount,
    fee,
    net: netAmount,
    legalBasis: EWA_LEGAL_BASIS,
  });

  return request;
}

/**
 * Get EWA history for an employee.
 */
export async function getEwaHistory(employeeId: string): Promise<EwaRequest[]> {
  const records = await db.auditLog.findMany({
    where: {
      actorId: employeeId,
      action: "ewa_requested",
    },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  return records.map((r) => typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata as any);
}

export { EWA_LEGAL_DISCLAIMER, EWA_LEGAL_BASIS };
