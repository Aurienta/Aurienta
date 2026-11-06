// AURIENTA — Egyptian Payments Provider Scaffold (Fawry + Paymob)
// ═══════════════════════════════════════════════════════════════
// EGYPTIAN LAW COMPLIANCE:
//
// AURIENTA is NOT a Payment Service Provider (PSP) under any Egyptian law:
//   - NOT a PSP under Law 194/2020 (Banking Law) Art. 1
//   - NOT a PISP under Law 5/2022 (FinTech Law)
//   - NOT an e-payment service under CBE Decree 2703/2020
//
// AURIENTA operates as a SOFTWARE VENDOR (outsourced software provider)
// under Law 194/2020 Art. 3. It does NOT:
//   - Hold, clear, or settle any funds
//   - Operate any escrow account
//   - Issue payment instruments
//   - Execute payment orders
//   - Hold client money
//
// All funds flow DIRECTLY from the payer to the law firm's client account
// (escrow) at a CBE-regulated bank. The law firm is the fiduciary custodian
// under Law 17/1983 (Lawyers' Code) Art. 47.
//
// Fawry and Paymob are used as PAYMENT ROUTING services — the payment
// gateway routes funds to the law firm's bank account, NOT to AURIENTA.
// AURIENTA never touches the money.
//
// This module generates payment REFERENCES and ROUTING instructions only.
// It does NOT process, hold, or transfer any funds.
// ═══════════════════════════════════════════════════════════════

import { db } from "@/lib/db";
import { logger } from "./logger";
import { audit } from "./audit";

export const PAYMENTS_LEGAL_DISCLAIMER = `AURIENTA is NOT a Payment Service Provider (PSP) under Law 194/2020 (Banking Law) or Law 5/2022 (FinTech Law). AURIENTA operates as a software vendor under Law 194/2020 Art. 3 and does NOT hold, clear, settle, or transfer any funds. All payments are routed DIRECTLY to the law firm's client account (escrow) at a CBE-regulated bank. The law firm is the fiduciary custodian under Law 17/1983 (Lawyers' Code) Art. 47. Fawry and Paymob are used as payment routing services — funds go to the law firm, NOT to AURIENTA.`;

export const PAYMENTS_LEGAL_BASIS = "Law 194/2020 Art. 3 (Software Vendor — NOT PSP) + Law 17/1983 Art. 47 (Law Firm Escrow) + Law 5/2022 (FinTech exemption)";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type PaymentResult = {
  reference: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: "fawry" | "paymob" | "bank_transfer";
  payUrl?: string;
  expiresAt?: Date;
  routingDestination: string; // Law firm escrow account (NOT AURIENTA)
  legalBasis: string;
  disclaimer: string;
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
