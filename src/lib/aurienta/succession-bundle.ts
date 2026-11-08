// AURIENTA — Succession + EWA + Diaspora Bundle
// Unique B2C super-app: combines succession planning, earned wage access,
// and diaspora investment corridor into one product for Egyptian middle class.
// Legal: Law 12/2003 (Labour), Law 151/2020 (PDPL), Law 95/1992 (Securities).

import { db } from "@/lib/db";
import { audit } from "./audit";
import { logger } from "./logger";

export type SuccessionBundle = {
  userId: string;
  hasSuccessionPlan: boolean;
  hasEwaAccess: boolean;
  hasDiasporaProfile: boolean;
  totalNetWorthEgp: number;
  liquidAssetsEgp: number;
  equityHoldingsEgp: number;
  insuranceCoverageEgp: number;
  monthlyEwaAvailableEgp: number;
  diasporaRemittancePotentialEgp: number;
  bundleScore: number; // 0-100, how complete the user's financial picture is
  recommendations: string[];
};

export async function generateSuccessionBundle(userId: string): Promise<SuccessionBundle> {
  // Check what the user has
  const successionRecords = await db.auditLog.findFirst({
    where: { actorId: userId, action: { contains: "succession" } },
  });

  const ewaRecords = await db.auditLog.findFirst({
    where: { actorId: userId, action: "ewa_requested" },
  });

  const diasporaRecords = await db.auditLog.findFirst({
    where: { actorId: userId, action: { contains: "diaspora" } },
  });

  const hasSuccessionPlan = !!successionRecords;
  const hasEwaAccess = !!ewaRecords;
  const hasDiasporaProfile = !!diasporaRecords;

  // Sandbox values
  const equityHoldingsEgp = 50000;
  const liquidAssetsEgp = 15000;
  const insuranceCoverageEgp = 100000;
  const monthlyEwaAvailableEgp = hasEwaAccess ? 7500 : 0;
  const diasporaRemittancePotentialEgp = hasDiasporaProfile ? 20000 : 0;
  const totalNetWorthEgp = equityHoldingsEgp + liquidAssetsEgp + insuranceCoverageEgp;

  // Bundle score: how many components are active
  const components = [hasSuccessionPlan, hasEwaAccess, hasDiasporaProfile, equityHoldingsEgp > 0, insuranceCoverageEgp > 0];
  const bundleScore = Math.round(components.filter(Boolean).length / components.length * 100);

  const recommendations: string[] = [];
  if (!hasSuccessionPlan) recommendations.push("Create a succession plan to protect your assets for your family (Law 12/2003 Art. 122 — end-of-service).");
  if (!hasEwaAccess) recommendations.push("Activate Earned Wage Access for financial flexibility between paydays.");
  if (!hasDiasporaProfile) recommendations.push("Set up a Diaspora profile to receive remittances and invest in Egyptian enterprises.");
  if (equityHoldingsEgp < 100000) recommendations.push("Increase equity holdings to build long-term wealth through productive enterprises.");
  if (insuranceCoverageEgp < 500000) recommendations.push("Increase insurance coverage to protect against unforeseen events.");

  if (recommendations.length === 0) {
    recommendations.push("Excellent! Your financial bundle is complete. Consider diversifying across more enterprise sectors.");
  }

  const bundle: SuccessionBundle = {
    userId,
    hasSuccessionPlan,
    hasEwaAccess,
    hasDiasporaProfile,
    totalNetWorthEgp,
    liquidAssetsEgp,
    equityHoldingsEgp,
    insuranceCoverageEgp,
    monthlyEwaAvailableEgp,
    diasporaRemittancePotentialEgp,
    bundleScore,
    recommendations,
  };

  await audit({
    actorId: userId,
    action: "succession_bundle_generated",
    target: `bundle:${userId}`,
    result: "allowed",
    metadata: { ...bundle },
  });

  return bundle;
}
