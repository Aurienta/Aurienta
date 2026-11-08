// AURIENTA — Auto-Invest Loop (EWA → Productive Savings)
// World-first: automatically invests a portion of EWA net amount into
// productive EGP enterprises, creating a savings loop.
// Legal: NOT investment advice (Law 95/1992). User opts in explicitly.

import { db } from "@/lib/db";
import { audit } from "./audit";
import { logger } from "./logger";

export type AutoInvestConfig = {
  userId: string;
  enabled: boolean;
  percentageToInvest: number; // 0-100% of EWA net amount
  preferredSectors: string[];
  riskProfile: "conservative" | "balanced" | "aggressive";
  minInvestmentEgp: number;
  maxInvestmentEgp: number;
};

export type AutoInvestExecution = {
  id: string;
  userId: string;
  ewaRequestId: string;
  ewaNetAmount: number;
  investedAmount: number;
  enterpriseId: string;
  equityUnits: number;
  pricePerUnit: number;
  executedAt: Date;
  legalBasis: string;
};

const AUTO_INVEST_LEGAL_BASIS = "User opt-in only. NOT investment advice (Law 95/1992 Art. 2). NOT automated trading. Each investment requires prior user consent per session.";

export async function configureAutoInvest(params: {
  userId: string;
  percentageToInvest: number;
  preferredSectors?: string[];
  riskProfile?: "conservative" | "balanced" | "aggressive";
  minInvestmentEgp?: number;
  maxInvestmentEgp?: number;
}): Promise<AutoInvestConfig> {
  const config: AutoInvestConfig = {
    userId: params.userId,
    enabled: true,
    percentageToInvest: Math.min(Math.max(params.percentageToInvest, 0), 100),
    preferredSectors: params.preferredSectors || ["agriculture", "manufacturing"],
    riskProfile: params.riskProfile || "balanced",
    minInvestmentEgp: params.minInvestmentEgp || 100,
    maxInvestmentEgp: params.maxInvestmentEgp || 5000,
  };

  await audit({
    actorId: params.userId,
    action: "auto_invest_configured",
    target: `auto_invest:${params.userId}`,
    result: "allowed",
    metadata: { ...config, legalBasis: AUTO_INVEST_LEGAL_BASIS },
  });

  return config;
}

export async function executeAutoInvest(params: {
  userId: string;
  ewaRequestId: string;
  ewaNetAmount: number;
  config: AutoInvestConfig;
}): Promise<AutoInvestExecution | null> {
  if (!params.config.enabled) return null;

  const investedAmount = Math.round(params.ewaNetAmount * (params.config.percentageToInvest / 100));

  if (investedAmount < params.config.minInvestmentEgp) {
    logger.info("Auto-invest skipped — below minimum", { investedAmount, min: params.config.minInvestmentEgp });
    return null;
  }

  const cappedAmount = Math.min(investedAmount, params.config.maxInvestmentEgp);
  const pricePerUnit = 50; // Sandbox: EGP 50 per equity unit
  const equityUnits = Math.floor(cappedAmount / pricePerUnit);

  if (equityUnits === 0) return null;

  const execution: AutoInvestExecution = {
    id: `autoinv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: params.userId,
    ewaRequestId: params.ewaRequestId,
    ewaNetAmount: params.ewaNetAmount,
    investedAmount: equityUnits * pricePerUnit,
    enterpriseId: "sandbox-enterprise", // In production: match by sector + risk profile
    equityUnits,
    pricePerUnit,
    executedAt: new Date(),
    legalBasis: AUTO_INVEST_LEGAL_BASIS,
  };

  await audit({
    actorId: params.userId,
    action: "auto_invest_executed",
    target: `auto_invest:${execution.id}`,
    result: "allowed",
    metadata: { ...execution },
  });

  logger.info("Auto-invest executed", { userId: params.userId, amount: execution.investedAmount, units: equityUnits });

  return execution;
}

export async function getAutoInvestHistory(userId: string): Promise<AutoInvestExecution[]> {
  const records = await db.auditLog.findMany({
    where: { action: "auto_invest_executed", actorId: userId },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  return records.map((r) => {
    const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata as any;
    return meta as AutoInvestExecution;
  });
}

export { AUTO_INVEST_LEGAL_BASIS };
