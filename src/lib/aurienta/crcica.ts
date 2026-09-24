// AURIENTA — CRCICA Arbitration Integration (Vol 10 §10.5)
// Implements Stage 4 of the 6-stage dispute resolution state machine:
//   Stage 1: AI Mediation (exists)
//   Stage 2: Board Review (exists)
//   Stage 3: Shareholder Vote (exists)
//   Stage 4: CRCICA Arbitration (this module — external)
//   Stage 5: Enforcement (binding outcome)
//   Stage 6: Closure (record + audit)
//
// CRCICA = Cairo Regional Centre for International Commercial Arbitration.
// In the sandbox, arbitration cases are registered with deterministic case IDs.
// Production wiring: CRCICA e-filing system (requires institutional agreement).

import { db } from "@/lib/db";
import { audit } from "./audit";
import { appendLedgerEvent } from "./cre";

export type CrcicaCaseStatus =
  | "filed"
  | "tribunal_constituted"
  | "hearings_scheduled"
  | "in_progress"
  | "award_issued"
  | "enforced"
  | "closed";

export type CrcicaCase = {
  caseId: string;
  appealCaseId: string;
  enterpriseId: string;
  claimantId: string;
  respondentId: string;
  claimAmountEgp: number;
  subjectMatter: string;
  status: CrcicaCaseStatus;
  filedAt: Date;
  tribunalMembers?: string[];
  award?: string;
  awardIssuedAt?: Date;
};

/**
 * File a CRCICA arbitration case (Stage 4 of dispute resolution).
 * Called when Stages 1-3 fail to resolve the dispute.
 */
export async function fileCrcicaArbitration(params: {
  appealCaseId: string;
  enterpriseId: string;
  claimantId: string;
  respondentId: string;
  claimAmountEgp: number;
  subjectMatter: string;
}): Promise<CrcicaCase> {
  const caseId = `CRCICA-${new Date().getFullYear()}-${params.appealCaseId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  // SANDBOX MOCK: create the case record with "filed" status.
  // Production: POST to CRCICA e-filing system.
  const newCase: CrcicaCase = {
    caseId,
    appealCaseId: params.appealCaseId,
    enterpriseId: params.enterpriseId,
    claimantId: params.claimantId,
    respondentId: params.respondentId,
    claimAmountEgp: params.claimAmountEgp,
    subjectMatter: params.subjectMatter,
    status: "filed",
    filedAt: new Date(),
  };

  // Update the appeal case to Stage 4
  await (db as any).appealCase.update({
    where: { id: params.appealCaseId },
    data: {
      stage: 4,
      status: "crcica_arbitration",
    },
  });

  // Append to the enterprise ledger
  await appendLedgerEvent(db as any, {
    enterpriseId: params.enterpriseId,
    eventType: "crcica_arbitration_filed",
    payload: {
      action: "crcica_arbitration_filed",
      caseId,
      appealCaseId: params.appealCaseId,
      claimAmountEgp: params.claimAmountEgp,
      subjectMatter: params.subjectMatter,
      note: `CRCICA arbitration case filed. Claim: ${params.claimAmountEgp.toLocaleString()} EGP. Subject: ${params.subjectMatter}.`,
    },
    actorId: params.claimantId,
  });

  await audit({
    actorId: params.claimantId,
    action: "crcica.arbitration_filed",
    target: `appeal:${params.appealCaseId}`,
    result: "allowed",
    metadata: {
      caseId,
      claimAmountEgp: params.claimAmountEgp,
      subjectMatter: params.subjectMatter,
    },
  });

  return newCase;
}

/**
 * Advance a CRCICA case to the next status.
 * Called by the cron job or by the arbitration dashboard.
 */
export async function advanceCrcicaCase(caseId: string): Promise<CrcicaCase> {
  // SANDBOCK MOCK: deterministic status progression.
  // Production: poll CRCICA e-filing system for status updates.

  const progression: Record<CrcicaCaseStatus, CrcicaCaseStatus> = {
    filed: "tribunal_constituted",
    tribunal_constituted: "hearings_scheduled",
    hearings_scheduled: "in_progress",
    in_progress: "award_issued",
    award_issued: "enforced",
    enforced: "closed",
    closed: "closed",
  };

  // In the sandbox, we need to retrieve the case. Since CrcicaCase isn't a
  // Prisma model yet, we reconstruct from the audit log.
  const caseEvents = await db.auditLog.findMany({
    where: {
      action: "crcica.arbitration_filed",
      metadata: { path: ["caseId"], string_equals: caseId },
    },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  if (caseEvents.length === 0) {
    throw new Error(`CRCICA case ${caseId} not found`);
  }

  const currentStatus: CrcicaCaseStatus = "filed"; // sandbox: always start at filed
  const nextStatus = progression[currentStatus];

  await audit({
    actorId: "system",
    action: "crcica.case_advanced",
    target: `crcica:${caseId}`,
    result: "allowed",
    metadata: {
      fromStatus: currentStatus,
      toStatus: nextStatus,
    },
  });

  return {
    caseId,
    appealCaseId: caseEvents[0]!.target!.replace("appeal:", ""),
    enterpriseId: "",
    claimantId: caseEvents[0]!.actorId!,
    respondentId: "",
    claimAmountEgp: 0,
    subjectMatter: "",
    status: nextStatus,
    filedAt: caseEvents[0]!.createdAt,
  };
}

/**
 * Issue a binding arbitral award (Stage 4 → 5).
 * The award is binding and enforceable in Egyptian courts.
 */
export async function issueCrcicaAward(
  caseId: string,
  award: string,
  enforceable: boolean = true
): Promise<void> {
  await audit({
    actorId: "system",
    action: "crcica.award_issued",
    target: `crcica:${caseId}`,
    result: enforceable ? "allowed" : "denied",
    metadata: {
      award,
      enforceable,
      awardIssuedAt: new Date().toISOString(),
    },
  });
}
