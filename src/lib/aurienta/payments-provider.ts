// AURIENTA — Egyptian Payments Provider Scaffold (Fawry + Paymob)
// Integrates with Egyptian payment gateways for fund collection.
// All funds go to law-firm escrow (Zero Custody principle).

import { db } from "@/lib/db";
import { logger } from "./logger";
import { audit } from "./audit";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type PaymentResult = {
  reference: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: "fawry" | "paymob" | "bank_transfer";
  payUrl?: string; // URL for user to complete payment
  expiresAt?: Date;
};

/**
 * Initiate a payment via Fawry (Egypt's largest payment network).
 * In production: POST https://atfawry.fawrystaging.com/EBSWebApp/rest/fawrypay
 * In sandbox: returns a mock reference.
 */
export async function initiateFawryPayment(params: {
  userId: string;
  amount: number;
  description: string;
  merchantRefNum: string;
}): Promise<PaymentResult> {
  const reference = `fawry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // In production:
  // const res = await fetch("https://atfawry.fawrystaging.com/EBSWebApp/rest/fawrypay", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     merchantCode: process.env.FAWRY_MERCHANT_CODE,
  //     merchantRefNum: params.merchantRefNum,
  //     customerProfileId: params.userId,
  //     amount: params.amount,
  //     paymentMethod: "PAYATFAWRY", // or "CARD"
  //     description: params.description,
  //     signature: hmac(process.env.FAWRY_SECRET, ...),
  //   }),
  // });

  const result: PaymentResult = {
    reference,
    status: "pending",
    amount: params.amount,
    currency: "EGP",
    method: "fawry",
    payUrl: undefined, // Fawry returns a reference number, not a URL
    expiresAt: new Date(Date.now() + 24 * 3600000), // 24h to pay
  };

  await audit({
    actorId: params.userId,
    action: "payment_initiated_fawry",
    action: action,
    target: `payment:${reference}`,
    metadata: { ...result, description: params.description },
    ip: null,
  });

  return result;
}

/**
 * Initiate a payment via Paymob (Egyptian payment gateway).
 * In production: uses Paymob's API with API key.
 */
export async function initiatePaymobPayment(params: {
  userId: string;
  amount: number;
  description: string;
}): Promise<PaymentResult> {
  const reference = `paymob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // In production:
  // 1. POST https://accept.paymob.com/api/auth/tokens → get auth token
  // 2. POST https://accept.paymob.com/api/ecommerce/orders → create order
  // 3. POST https://accept.paymob.com/api/acceptance/payment_keys → get payment key
  // 4. Redirect to https://accept.paymob.com/api/acceptance/iframes/{iframe_id}?payment_token={token}

  const result: PaymentResult = {
    reference,
    status: "pending",
    amount: params.amount,
    currency: "EGP",
    method: "paymob",
    payUrl: `https://accept.paymob.com/api/acceptance/iframes/000000?payment_token=sandbox-${reference}`,
    expiresAt: new Date(Date.now() + 3600000), // 1h to pay
  };

  await audit({
    actorId: params.userId,
    action: "payment_initiated_paymob",
    action: action,
    target: `payment:${reference}`,
    metadata: { ...result, description: params.description },
    ip: null,
  });

  return result;
}

/**
 * Get payment status.
 */
export async function getPaymentStatus(reference: string, userId: string): Promise<PaymentResult | null> {
  const record = await db.auditLog.findFirst({
    where: {
      action: action,
      target: `payment:${reference}`,
      userId,
    },
    orderBy: { timestamp: "desc" },
  });

  if (!record) return null;
  return typeof record.metadata === "string" ? JSON.parse(record.metadata) : record.metadata as any;
}

/**
 * Confirm payment (webhook callback from Fawry/Paymob).
 */
export async function confirmPayment(reference: string, status: PaymentStatus): Promise<void> {
  await audit({
    actorId: null,
    action: `payment_${status}`,
    action: action,
    target: `payment:${reference}`,
    metadata: { status, confirmedAt: new Date().toISOString() },
    ip: null,
  });

  logger.info("Payment confirmed", { reference, status });
}
