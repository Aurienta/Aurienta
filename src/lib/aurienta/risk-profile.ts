// AURIENTA — Risk Profile API (Phase 4)
//
// Data service for insurance partners. AURIENTA provides enterprise risk
// data ONLY — it does NOT underwrite insurance. Insurance companies partner
// with enterprises directly. Every response carries a disclaimer and an
// Ed25519-signed decision token.
//
// COMPLIANCE: Compliant with FRA Insurance Law 10/1981. AURIENTA is a data
// provider, not an insurer. The CRE policy `enforceRiskProfileQuery`
// validates disclaimerAccepted + enterpriseId present before any data is
// served.

import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { audit } from "./audit";
import { signWithPlatformKey, platformPublicKeyHex } from "./signing";
import { calculateHealthRating, type VitalSign } from "./health-rating";
import { enforceRiskProfileQuery } from "./cre";
import type { RiskProfileQuery } from "@prisma/client";

/** Compliance disclaimer attached to every risk profile response. */
export const RISK_PROFILE_DISCLAIMER =
  "AURIENTA does NOT underwrite insurance. This API provides enterprise risk data only. Insurance companies partner with enterprises directly. Compliant with FRA Insurance Law 10/1981.";

/** Prefix + length for risk-profile API keys (issued to insurer partners). */
const KEY_PREFIX = "aur_risk-";

/**
 * Generate a new risk-profile API key + its SHA-256 hash. The raw key is
 * shown to the caller ONCE. Only the hash is used for lookups thereafter.
 */
export function generateRiskProfileApiKey(): { key: string; hash: string } {
  const key = `${KEY_PREFIX}${randomBytes(32).toString("hex")}`;
  const hash = createHash("sha256").update(key).digest("hex");
  return { key, hash };
}

/** Hash a raw risk-profile API key. */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export type RiskRecommendation = "low_risk" | "moderate_risk" | "elevated_risk";

export type RiskProfileResult = {
  healthScore: number;
  healthRating: string;
  trend: string;
  riskFactors: string; // JSON
  recommendation: RiskRecommendation;
  decisionToken: string;
  disclaimer: string;
  calculatedAt: string;
};

/**
 * Generate a risk profile for an enterprise. Calls the constitutional health
 * rating engine, builds the 9-vital-sign riskFactors JSON, derives a
 * recommendation band, and signs the result with the platform Ed25519 key.
 *
 * Caller MUST accept the disclaimer first — enforced by the CRE policy
 * `enforceRiskProfileQuery`.
 */
export async function generateRiskProfile(
  enterpriseId: string,
  requesterOrg: string,
  apiKeyHash: string
): Promise<RiskProfileResult> {
  // CRE policy — fails closed if disclaimer not accepted or enterpriseId missing.
  const verdict = enforceRiskProfileQuery({
    enterpriseId,
    requesterApiKeyHash: apiKeyHash,
    disclaimerAccepted: true,
  });

  if (!verdict.allowed) {
    throw new Error(verdict.reason ?? "Risk profile query denied by CRE");
  }

  // Compute the constitutional health rating (9 vital signs).
  const health = await calculateHealthRating(enterpriseId);

  // Build riskFactors JSON from the 9 vital signs.
  const riskFactors = buildRiskFactors(health.vitalSigns, health.score);

  // Recommendation band.
  const recommendation: RiskRecommendation =
    health.score >= 80 ? "low_risk" : health.score >= 60 ? "moderate_risk" : "elevated_risk";

  const calculatedAt = new Date().toISOString();

  // decisionToken = Ed25519 signature over the canonical risk profile envelope.
  const envelope = JSON.stringify({
    enterpriseId,
    requesterOrg,
    healthScore: health.score,
    healthRating: health.rating,
    recommendation,
    calculatedAt,
  });
  const decisionToken = signWithPlatformKey(envelope);

  // Persist the RiskProfileQuery row.
  let recordId: string | null = null;
  try {
    const record = await db.riskProfileQuery.create({
      data: {
        enterpriseId,
        requesterOrg,
        apiKeyHash,
        healthScore: health.score,
        riskFactors,
        recommendation,
        disclaimerShown: true,
      },
    });
    recordId = record.id;
  } catch (err) {
    console.error("[risk-profile] failed to persist RiskProfileQuery:", err);
  }

  await audit({
    actorId: "system",
    action: "risk_profile.generated",
    target: `risk_profile:${recordId ?? "unpersisted"}`,
    result: "allowed",
    metadata: {
      enterpriseId,
      requesterOrg,
      apiKeyHash,
      healthScore: health.score,
      recommendation,
    },
  });

  return {
    healthScore: health.score,
    healthRating: health.rating,
    trend: health.trend,
    riskFactors,
    recommendation,
    decisionToken,
    disclaimer: RISK_PROFILE_DISCLAIMER,
    calculatedAt,
  };
}

/**
 * Return prior risk profile queries for an enterprise (most recent first).
 */
export async function getQueryHistory(
  enterpriseId: string,
  limit = 50
): Promise<RiskProfileQuery[]> {
  return db.riskProfileQuery.findMany({
    where: { enterpriseId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(1, limit), 200),
  });
}

/**
 * Build the riskFactors JSON object from the 9 constitutional vital signs.
 * Insurers receive the same 9 factors the CRE uses internally — no hidden
 * data, no proprietary scoring.
 */
function buildRiskFactors(vitalSigns: VitalSign[], overallScore: number): string {
  const factors = vitalSigns.map((vs) => ({
    name: vs.name,
    score: vs.score,
    target: vs.target,
    status: vs.status,
    detail: vs.detail,
  }));

  return JSON.stringify({
    overall_score: overallScore,
    vital_signs: factors,
    risk_drivers: identifyRiskDrivers(vitalSigns),
    generated_at: new Date().toISOString(),
  });
}

/** Identify the vital signs that are warning or critical — top risk drivers. */
function identifyRiskDrivers(vitalSigns: VitalSign[]): string[] {
  return vitalSigns
    .filter((vs) => vs.status === "critical" || vs.status === "warning")
    .sort((a, b) => a.score - b.score)
    .map((vs) => `${vs.name} (${vs.status}, ${vs.score}/${vs.target})`);
}

/** Re-export the platform public key so insurers can verify decision tokens. */
export { platformPublicKeyHex };
