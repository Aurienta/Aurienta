// AURIENTA — Tender Offers Module (Secondary Market Liquidity)
// Allows enterprises or major shareholders to offer to buy back shares.
// Legal: NOT a securities exchange. Not a licensed broker under Law 95/1992 Art. 23.
// Only records offers — execution happens via law firm escrow.

import { db } from "@/lib/db";
import { audit } from "./audit";
import { logger } from "./logger";

export type TenderOffer = {
  id: string;
  enterpriseId: string;
  initiatorId: string;
  offerType: "buyback" | "tender";
  pricePerUnitEgp: number;
  maxUnits: number;
  minUnits: number;
  status: "open" | "closed" | "executed" | "cancelled";
  opensAt: Date;
  closesAt: Date;
  responses: TenderResponse[];
};

export type TenderResponse = {
  stakeholderId: string;
  stakeholderName: string;
  unitsOffered: number;
  responseAt: Date;
};

export async function createTenderOffer(params: {
  enterpriseId: string;
  initiatorId: string;
  offerType: "buyback" | "tender";
  pricePerUnitEgp: number;
  maxUnits: number;
  minUnits?: number;
  closesInDays?: number;
}): Promise<TenderOffer> {
  const id = `tender-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const closesAt = new Date(Date.now() + (params.closesInDays || 30) * 86400000);

  const offer: TenderOffer = {
    id,
    enterpriseId: params.enterpriseId,
    initiatorId: params.initiatorId,
    offerType: params.offerType,
    pricePerUnitEgp: params.pricePerUnitEgp,
    maxUnits: params.maxUnits,
    minUnits: params.minUnits || 0,
    status: "open",
    opensAt: new Date(),
    closesAt,
    responses: [],
  };

  await audit({
    actorId: params.initiatorId,
    action: "tender_offer_created",
    target: `tender:${id}`,
    result: "allowed",
    metadata: {
      ...offer,
      legalBasis: "Law 95/1992 Art. 2 — NOT a public offering. Private tender offer to existing shareholders only.",
    },
  });

  logger.info("Tender offer created", { id, type: params.offerType, price: params.pricePerUnitEgp });
  return offer;
}

export async function respondToTender(params: {
  tenderId: string;
  stakeholderId: string;
  stakeholderName: string;
  unitsOffered: number;
}): Promise<TenderResponse> {
  const response: TenderResponse = {
    stakeholderId: params.stakeholderId,
    stakeholderName: params.stakeholderName,
    unitsOffered: params.unitsOffered,
    responseAt: new Date(),
  };

  await audit({
    actorId: params.stakeholderId,
    action: "tender_response_submitted",
    target: `tender:${params.tenderId}`,
    result: "allowed",
    metadata: { ...response },
  });

  return response;
}

export async function getTenderOffers(enterpriseId: string): Promise<TenderOffer[]> {
  const records = await db.auditLog.findMany({
    where: { action: "tender_offer_created", target: { contains: "tender:" } },
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  const offers = records.map((r) => {
    const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata as any;
    return meta as TenderOffer;
  }).filter((o) => o.enterpriseId === enterpriseId);

  // Get responses for each offer
  for (const offer of offers) {
    const responses = await db.auditLog.findMany({
      where: { action: "tender_response_submitted", target: `tender:${offer.id}` },
    });
    offer.responses = responses.map((r) => {
      const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata as any;
      return meta as TenderResponse;
    });
  }

  return offers;
}
