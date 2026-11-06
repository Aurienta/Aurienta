// AURIENTA — Earned Wage Access (EWA) Module
// Allows employees to access earned-but-unpaid wages before payday.
// Egyptian law compliant: based on actual hours worked, not a loan.

import { db } from "@/lib/db";
import { logger } from "./logger";
import { audit } from "./audit";

export type EwaRequest = {
  id: string;
  employeeId: string;
  enterpriseId: string;
  requestedAmount: number;
  fee: number; // EWA fee (typically 1-2% of amount)
  netAmount: number;
  status: "pending" | "approved" | "disbursed" | "rejected";
  requestedAt: Date;
  processedAt?: Date;
};

/**
 * Calculate how much an employee has earned but not yet been paid.
 * Based on: daily rate × days worked since last payday.
 */
export async function calculateAvailableWage(employeeId: string): Promise<{
  dailyRate: number;
  daysSinceLastPay: number;
  earnedAmount: number;
  maxAccessible: number; // Typically 50% of earned, capped at EGP 10,000
}> {
  // In production, query Employee + Payroll tables
  // For now, use a reasonable default
  const dailyRate = 500; // EGP 500/day = EGP 15,000/month
  const daysSinceLastPay = 15; // Mid-month
  const earnedAmount = dailyRate * daysSinceLastPay;
  const maxAccessible = Math.min(earnedAmount * 0.5, 10000); // 50% cap, max 10K

  return { dailyRate, daysSinceLastPay, earnedAmount, maxAccessible };
}

/**
 * Request EWA (Earned Wage Access).
 */
export async function requestEwa(params: {
  employeeId: string;
  enterpriseId: string;
  amount: number;
}): Promise<EwaRequest> {
  const available = await calculateAvailableWage(params.employeeId);

  if (params.amount > available.maxAccessible) {
    throw new Error(`Amount exceeds available wage (max EGP ${available.maxAccessible})`);
  }

  const fee = Math.round(params.amount * 0.015); // 1.5% fee
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
  };

  await audit({
    actorId: params.employeeId,
    action: "ewa_requested",
    action: "ewa_requested",
    target: `ewa:${id}`,
    metadata: { ...request, available: available.maxAccessible },
    ip: null,
  });

  logger.info("EWA request approved", {
    id,
    employeeId: params.employeeId,
    amount: params.amount,
    fee,
    net: netAmount,
  });

  return request;
}

/**
 * Get EWA history for an employee.
 */
export async function getEwaHistory(employeeId: string): Promise<EwaRequest[]> {
  const records = await db.auditLog.findMany({
    where: {
      userId: employeeId,
      action: "ewa_requested",
      action: "ewa_requested",
    },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  return records.map((r) => typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata as any);
}
