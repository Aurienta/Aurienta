// AURIENTA — Investor CRM Module
// Tracks the fundraising pipeline from intro → diligence → wire.

import { db } from "@/lib/db";
import { logger } from "./logger";
import { audit } from "./audit";

export type InvestorStage = "intro" | "interested" | "diligence" | "committed" | "wired" | "passed";

export type InvestorContact = {
  id: string;
  enterpriseId: string;
  name: string;
  email: string;
  phone?: string;
  firm?: string;
  stage: InvestorStage;
  checkSizeEgp?: number;
  notes?: string;
  nextFollowUp?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const STAGE_ORDER: InvestorStage[] = ["intro", "interested", "diligence", "committed", "wired", "passed"];

/**
 * Add an investor contact to the CRM.
 */
export async function addInvestorContact(params: {
  enterpriseId: string;
  name: string;
  email: string;
  phone?: string;
  firm?: string;
  notes?: string;
}): Promise<InvestorContact> {
  const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date();

  // Store in AuditLog (production: separate InvestorContact table)
  await audit({
    actorId: null,
    action: "investor_contact_added",
    action: action,
    target: `investor_crm:${id}`,
    metadata: {
      ...params,
      stage: "intro",
      createdAt: now.toISOString(),
    } as any,
    ip: null,
  });

  return {
    id,
    enterpriseId: params.enterpriseId,
    name: params.name,
    email: params.email,
    phone: params.phone,
    firm: params.firm,
    stage: "intro",
    notes: params.notes,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update investor stage.
 */
export async function updateInvestorStage(
  contactId: string,
  stage: InvestorStage,
  notes?: string
): Promise<void> {
  await audit({
    actorId: null,
    action: "investor_stage_updated",
    action: action,
    target: `investor_crm:${contactId}`,
    metadata: { stage, notes, updatedAt: new Date().toISOString() },
    ip: null,
  });

  logger.info("Investor stage updated", { contactId, stage });
}

/**
 * Get the fundraising pipeline for an enterprise.
 */
export async function getFundraisingPipeline(enterpriseId: string): Promise<{
  contacts: InvestorContact[];
  totalCommitted: number;
  totalWired: number;
  byStage: Record<InvestorStage, number>;
}> {
  const records = await db.auditLog.findMany({
    where: {
      action: { in: ["investor_contact_added", "investor_stage_updated"] },
    },
    orderBy: { timestamp: "desc" },
    take: 200,
  });

  // Build contacts from audit log
  const contactsMap = new Map<string, InvestorContact>();
  for (const r of records) {
    const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata as any;
    if (!meta?.enterpriseId || meta.enterpriseId !== enterpriseId) continue;
    const id = r.resourceId;
    if (r.action === "investor_contact_added") {
      contactsMap.set(id, {
        id,
        enterpriseId: meta.enterpriseId,
        name: meta.name,
        email: meta.email,
        phone: meta.phone,
        firm: meta.firm,
        stage: meta.stage || "intro",
        notes: meta.notes,
        createdAt: r.timestamp,
        updatedAt: r.timestamp,
      });
    } else if (r.action === "investor_stage_updated" && contactsMap.has(id)) {
      const contact = contactsMap.get(id)!;
      contact.stage = meta.stage;
      contact.updatedAt = r.timestamp;
      if (meta.notes) contact.notes = meta.notes;
    }
  }

  const contacts = [...contactsMap.values()];
  const byStage = {} as Record<InvestorStage, number>;
  for (const s of STAGE_ORDER) byStage[s] = 0;
  for (const c of contacts) byStage[c.stage]++;

  const totalCommitted = contacts
    .filter((c) => c.stage === "committed" || c.stage === "wired")
    .reduce((sum, c) => sum + (c.checkSizeEgp || 0), 0);
  const totalWired = contacts
    .filter((c) => c.stage === "wired")
    .reduce((sum, c) => sum + (c.checkSizeEgp || 0), 0);

  return { contacts, totalCommitted, totalWired, byStage };
}
