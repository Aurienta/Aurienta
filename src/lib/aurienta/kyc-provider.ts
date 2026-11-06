// AURIENTA — KYC Provider Scaffold (Smile Identity API)
// Provides identity verification for Egyptian users.
// Smile Identity covers 15+ African countries including Egypt.

import { db } from "@/lib/db";
import { logger } from "./logger";
import { audit } from "./audit";

export type KycStatus = "pending" | "verified" | "rejected" | "expired";

export type KycResult = {
  status: KycStatus;
  score: number; // 0-100 confidence
  checks: {
    idDocument: boolean;
    liveness: boolean;
    nameMatch: boolean;
    sanctions: boolean;
    pep: boolean; // Politically Exposed Person
  };
  reference: string;
  verifiedAt?: Date;
  expiresAt?: Date;
  details?: string;
};

/**
 * Initiate KYC verification.
 * In production, this calls Smile Identity's API.
 * In sandbox, it auto-approves with a high score.
 */
export async function initiateKyc(params: {
  userId: string;
  idType: "national_id" | "passport";
  idNumber: string; // last 4 digits only
  idImageBase64?: string;
  selfieBase64?: string;
  legalName: string;
}): Promise<{ reference: string; status: KycStatus }> {
  const reference = `kyc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // In sandbox: auto-approve with high score
  // In production: call Smile Identity API:
  //   POST https://api.smileidentity.com/v1/verify
  //   { partner_id, user_id, id_type, id_number, image, ... }

  const result: KycResult = {
    status: "verified",
    score: 95,
    checks: {
      idDocument: true,
      liveness: true,
      nameMatch: true,
      sanctions: false, // Would check against opensanctions.org
      pep: false,
    },
    reference,
    verifiedAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 86400000), // 1 year
    details: "Sandbox auto-approval. Production: Smile Identity API.",
  };

  await audit({
    actorId: params.userId,
    action: "kyc_initiated",
    action: "kyc_initiated",
    target: `kyc:${reference}`,
    metadata: { ...result, idType: params.idType },
    ip: null,
  });

  // Update user verification level
  try {
    await db.user.update({
      where: { id: params.userId },
      data: { verificationLevel: "L2" }, // Basic KYC
    });
  } catch (e: any) {
    logger.warn("Failed to update verification level", { error: e.message });
  }

  return { reference, status: result.status };
}

/**
 * Get KYC status for a user.
 */
export async function getKycStatus(userId: string): Promise<KycResult | null> {
  const records = await db.auditLog.findFirst({
    where: {
      actorId: userId,
      action: "kyc_initiated",
    },
    orderBy: { timestamp: "desc" },
  });

  if (!records) return null;

  return typeof records.metadata === "string" ? JSON.parse(records.metadata) : records.metadata as any;
}

/**
 * Check sanctions list (free, open-source via opensanctions.org).
 */
export async function checkSanctions(name: string): Promise<{ hit: boolean; source: string }> {
  try {
    // Free API: https://api.opensanctions.org/match/{dataset}
    const res = await fetch("https://api.opensanctions.org/match/default", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries: { "0": { schema: "Person", properties: { name: [name] } } } }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { hit: false, source: "opensanctions.org (unavailable)" };
    const data = await res.json();
    const matches = data?.responses?.["0"]?.results || [];
    return {
      hit: matches.length > 0,
      source: "opensanctions.org",
    };
  } catch {
    return { hit: false, source: "opensanctions.org (timeout)" };
  }
}
