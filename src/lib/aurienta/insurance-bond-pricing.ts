// AURIENTA — Health Score → Insurance → Bond Pricing Closed Loop
// Uses enterprise health score to dynamically price insurance premiums
// and graduation bond yields. Lower health = higher premium = higher yield.
// Legal: NOT insurance underwriting (Law 10/1981). Advisory model only.

import { db } from "@/lib/db";
import { audit } from "./audit";
import { logger } from "./logger";

export type InsurancePricing = {
  enterpriseId: string;
  healthScore: number; // 0-100
  basePremiumRate: number; // % of insured amount
  adjustedPremiumRate: number; // health-adjusted
  riskMultiplier: number;
  maxInsurableAmount: number;
  deductibleRate: number;
  legalBasis: string;
};

export type BondPricing = {
  enterpriseId: string;
  healthScore: number;
  baseYield: number; // % annual
  adjustedYield: number; // health-adjusted
  creditSpread: number; // basis points over risk-free
  bondRating: string;
  maxBondAmount: number;
  legalBasis: string;
};

const INSURANCE_LEGAL_BASIS = "Advisory pricing model only. NOT insurance underwriting under Law 10/1981 (Insurance Supervision). AURIENTA is not a licensed insurer.";
const BOND_LEGAL_BASIS = "Advisory pricing model only. NOT a securities offering under Law 95/1992. Bond issuance requires FRA authorization.";

export function calculateInsurancePricing(params: {
  enterpriseId: string;
  healthScore: number;
  insuredAmount: number;
}): InsurancePricing {
  const basePremiumRate = 2.0; // 2% base
  // Lower health score → higher risk → higher premium
  const riskMultiplier = Math.max(0.5, (100 - params.healthScore) / 50 + 1);
  const adjustedPremiumRate = Math.round(basePremiumRate * riskMultiplier * 100) / 100;
  const maxInsurableAmount = Math.round(params.insuredAmount * (params.healthScore / 100));
  const deductibleRate = Math.max(1, Math.round((100 - params.healthScore) / 10));

  return {
    enterpriseId: params.enterpriseId,
    healthScore: params.healthScore,
    basePremiumRate,
    adjustedPremiumRate,
    riskMultiplier: Math.round(riskMultiplier * 100) / 100,
    maxInsurableAmount,
    deductibleRate,
    legalBasis: INSURANCE_LEGAL_BASIS,
  };
}

export function calculateBondPricing(params: {
  enterpriseId: string;
  healthScore: number;
  bondTermYears: number;
}): BondPricing {
  const riskFreeRate = 3.88; // US Fed Funds Rate (FRED)
  const baseYield = riskFreeRate + 3; // 3% base spread
  // Lower health score → higher risk → higher yield
  const creditSpread = Math.round((100 - params.healthScore) * 5); // basis points
  const adjustedYield = Math.round((baseYield + creditSpread / 100) * 100) / 100;

  const rating =
    params.healthScore >= 90 ? "AAA" :
    params.healthScore >= 80 ? "AA" :
    params.healthScore >= 70 ? "A" :
    params.healthScore >= 60 ? "BBB" :
    params.healthScore >= 50 ? "BB" :
    params.healthScore >= 40 ? "B" :
    "CCC";

  const maxBondAmount = Math.round(params.healthScore * 100000);

  return {
    enterpriseId: params.enterpriseId,
    healthScore: params.healthScore,
    baseYield,
    adjustedYield,
    creditSpread,
    bondRating: rating,
    maxBondAmount,
    legalBasis: BOND_LEGAL_BASIS,
  };
}

export async function generatePricingReport(enterpriseId: string, healthScore: number, insuredAmount: number = 1000000) {
  const insurance = calculateInsurancePricing({ enterpriseId, healthScore, insuredAmount });
  const bond = calculateBondPricing({ enterpriseId, healthScore, bondTermYears: 5 });

  await audit({
    actorId: null,
    action: "pricing_report_generated",
    target: `pricing:${enterpriseId}`,
    result: "allowed",
    metadata: { insurance, bond },
  });

  logger.info("Pricing report generated", { enterpriseId, healthScore, insuranceRate: insurance.adjustedPremiumRate, bondYield: bond.adjustedYield });

  return { insurance, bond };
}
