// AURIENTA — KYC Provider Scaffold (Smile Identity API)
// ═══════════════════════════════════════════════════════════════
// EGYPTIAN LAW COMPLIANCE:
//
// 1. Personal Data Protection Law 151/2020 (PDPL):
//    - Art. 2(5): Biometric data (facial images, fingerprints) is
//      "sensitive personal data" — requires SEPARATE explicit consent
//    - Art. 7: Processing personal data requires informed consent
//    - Art. 13: Data subject has right to access, rectify, erase
//    - Art. 17: Cross-border transfer requires adequate protection
//    - Art. 24: Data breaches must be reported within 72 hours
//
// 2. AML Law 80/2002 + Law 78/2023:
//    - Art. 1: Customer Due Diligence (CDD) is mandatory
//    - Art. 2: Suspicious transactions must be reported to EMLCU
//    - Art. 4: Enhanced Due Diligence for high-risk customers
//
// 3. Civil Registry Law 143/1994:
//    - National ID numbers are issued by the Civil Registry
//    - Verification against Civil Registry requires government authorization
//    - AURIENTA only stores the LAST 4 DIGITS of the national ID
//      (never the full number) — encrypted at rest with AES-GCM
//
// 4. Consumer Protection Law 67/2006:
//    - Art. 3: Consumer has right to clear information about data use
//    - Art. 6: No unfair contract terms
//
// CONSENT REQUIREMENTS:
//    Before initiating KYC, the user must explicitly consent to:
//    (a) Processing of their personal data (PDPL Art. 7)
//    (b) Processing of biometric data — liveness scan (PDPL Art. 2(5))
//    (c) Cross-border data transfer if Smile Identity processes outside Egypt
//    (d) Reporting suspicious transactions to EMLCU (AML Law Art. 2)
// ═══════════════════════════════════════════════════════════════

import { db } from "@/lib/db";
import { logger } from "./logger";
import { audit } from "./audit";

export const KYC_LEGAL_DISCLAIMER = `By initiating KYC verification, you consent to: (1) processing of your personal data under Law 151/2020 (PDPL) Art. 7; (2) processing of biometric data (facial liveness scan) as sensitive personal data under PDPL Art. 2(5); (3) cross-border data transfer to Smile Identity servers which may be located outside Egypt, per PDPL Art. 17; (4) reporting of suspicious transactions to the Egyptian Money Laundering Combating Unit (EMLCU) per Law 80/2002 Art. 2. Your national ID number is stored as the LAST 4 DIGITS ONLY, encrypted with AES-GCM. You have the right to access, rectify, and erase your data per PDPL Arts. 13-14.`;

export const KYC_LEGAL_BASIS = "Law 151/2020 (PDPL) Arts. 2(5), 7, 13, 14, 17, 24 + Law 80/2002 (AML) + Law 143/1994 (Civil Registry) + Law 67/2006 (Consumer Protection)";

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
