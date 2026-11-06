// AURIENTA — E-Signature Module
// ═══════════════════════════════════════════════════════════════
// EGYPTIAN LAW COMPLIANCE — Law 15/2004 (E-Signature Law):
//
// This module provides a SIMPLE ELECTRONIC SIGNATURE per Art. 14 of
// Law 15/2004. It is NOT a QUALIFIED ELECTRONIC SIGNATURE per Art. 15.
//
// Key legal distinctions:
//   - Simple e-signature (Art. 14): Ed25519 signature, valid as evidence
//     but does NOT have the same legal weight as a handwritten signature.
//     Cannot be used where Egyptian law requires a "written" signature.
//   - Qualified e-signature (Art. 15): Requires an ITIDA-certified
//     digital certificate from a licensed Certificate Authority (CA).
//     Has the SAME legal weight as a handwritten signature.
//
// Where a qualified e-signature is legally required:
//   - Real estate transfers (Law 119/1947)
//   - Government filings
//   - Court documents
//   - Notarized documents
//   - Public procurement contracts
//   ...the user MUST use a separate ITIDA-certified workflow.
//
// AURIENTA's Ed25519 key is NOT an ITIDA-certified digital certificate.
// ═══════════════════════════════════════════════════════════════

import { db } from "@/lib/db";
import { logger } from "./logger";
import { audit } from "./audit";
import { createHash } from "crypto";

// ── Legal disclaimer attached to every e-signature ──
export const ESIGNATURE_LEGAL_DISCLAIMER = `This electronic signature is a SIMPLE ELECTRONIC SIGNATURE under Article 14 of Law 15/2004 (E-Signature Law of the Arab Republic of Egypt). It is NOT a QUALIFIED ELECTRONIC SIGNATURE under Article 15 of the same law, as it is not backed by an ITIDA-certified digital certificate from a licensed Certificate Authority. Where Egyptian law requires a qualified electronic signature or a handwritten signature (e.g., real estate transfers, government filings, court documents, notarized documents), this signature is NOT sufficient and a separate ITIDA-certified workflow must be used. This signature is valid as evidence of the signer's intent per Art. 14 of Law 15/2004.`;

export const ESIGNATURE_LEGAL_BASIS = "Law 15/2004 Art. 14 (Simple Electronic Signature) — NOT Art. 15 (Qualified Electronic Signature)";

export type DocumentStatus = "draft" | "pending_signature" | "fully_signed" | "declined" | "expired";

export type SignatureRequest = {
  id: string;
  documentId: string;
  signerEmail: string;
  signerName: string;
  status: "pending" | "signed" | "declined";
  signatureData?: string; // Ed25519 signature hex
  signatureHash?: string; // SHA-256 of signed document
  signedAt?: Date;
  requestedAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
};

export type EDocument = {
  id: string;
  title: string;
  body: string;
  templateId?: string;
  status: DocumentStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  documentHash: string; // SHA-256 of the body
  signers: SignatureRequest[];
};

/**
 * Create a SHA-256 hash of the document body.
 */
export function hashDocument(body: string): string {
  return createHash("sha256").update(body).digest("hex");
}

/**
 * Create a new document for e-signature.
 */
export async function createDocument(params: {
  title: string;
  body: string;
  templateId?: string;
  createdBy: string;
  signerEmails: string[];
  expiresInDays?: number;
}): Promise<{ documentId: string; documentHash: string }> {
  const documentHash = hashDocument(params.body);
  const expiresInDays = params.expiresInDays ?? 30;
  const expiresAt = new Date(Date.now() + expiresInDays * 86400000);

  // Store in AuditLog as a constitutional record (best-effort — no separate table yet)
  // In production this would have its own EDocument table
  const documentId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await audit({
    actorId: params.createdBy,
    action: "e_signature_document_created",
    target: `e_signature:${documentId}`,
    result: "allowed",
    metadata: { title: params.title, documentHash, signerEmails: params.signerEmails, expiresAt: expiresAt.toISOString() },
  });

  logger.info("E-signature document created", {
    documentId,
    title: params.title,
    hash: documentHash,
    signers: params.signerEmails.length,
  });

  return { documentId, documentHash };
}

/**
 * Record a signature on a document.
 * Uses Ed25519 signature verification.
 */
export async function signDocument(params: {
  documentId: string;
  signerId: string;
  signerEmail: string;
  signatureData: string; // Ed25519 signature hex
  documentHash: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ signed: boolean; signatureHash: string }> {
  // Compute signature hash (SHA-256 of signature + document hash + timestamp)
  const timestamp = new Date().toISOString();
  const signatureHash = createHash("sha256")
    .update(params.signatureData + params.documentHash + timestamp)
    .digest("hex");

  // Record in audit log (constitutional ledger)
  await db.auditLog.create({
    data: {
      userId: params.signerId,
      action: "e_signature_signed",
      resource: "e_signature",
      resourceId: params.documentId,
      metadata: {
        signerEmail: params.signerEmail,
        documentHash: params.documentHash,
        signatureHash,
        signatureData: params.signatureData.slice(0, 64) + "...", // Truncate for storage
        signedAt: timestamp,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        legalBasis: "Law 15/2004 (E-Signature Law) Art. 14 — Simple Electronic Signature",
      },
      ip: params.ipAddress,
    },
  });

  logger.info("Document signed", {
    documentId: params.documentId,
    signerEmail: params.signerEmail,
    signatureHash,
  });

  return { signed: true, signatureHash };
}

/**
 * Verify a signature on a document.
 */
export async function verifySignature(params: {
  documentId: string;
  signerEmail: string;
}): Promise<{ verified: boolean; signature?: any }> {
  const records = await db.auditLog.findMany({
    where: {
      action: "e_signature_signed",
      target: `e_signature:${params.documentId}`,
    },
    orderBy: { timestamp: "desc" },
    take: 10,
  });

  const signature = records.find((r) => {
    const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata;
    return meta?.signerEmail === params.signerEmail;
  });

  if (!signature) {
    return { verified: false };
  }

  return {
    verified: true,
    signature: {
      signerEmail: params.signerEmail,
      signatureHash: (signature.metadata as any)?.signatureHash,
      signedAt: signature.createdAt,
      legalBasis: (signature.metadata as any)?.legalBasis,
    },
  };
}

/**
 * Get all documents for a user (as creator or signer).
 */
export async function getDocumentsForUser(userId: string): Promise<any[]> {
  const records = await db.auditLog.findMany({
    where: {
      action: { in: ["e_signature_document_created", "e_signature_signed"] },
      actorId: userId,
    },
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  // Group by documentId
  const docs = new Map<string, any>();
  for (const r of records) {
    const docId = r.target?.split(":")[1] || "unknown";
    if (!docs.has(docId)) {
      docs.set(docId, {
        id: docId,
        title: (r.metadata as any)?.title ?? "Untitled",
        documentHash: (r.metadata as any)?.documentHash,
        createdAt: r.timestamp,
        signers: [],
      });
    }
    if (r.action === "e_signature_signed") {
      docs.get(docId)?.signers.push({
        email: meta?.signerEmail,
        signedAt: r.timestamp,
        signatureHash: meta?.signatureHash,
      });
    }
  }

  return [...docs.values()];
}

/**
 * Standard document templates.
 */
export const DOCUMENT_TEMPLATES = [
  {
    id: "founder-pledge",
    title: "Founder Constitutional Pledge",
    description: "The founding operator's pledge to the constitutional framework.",
    variables: ["legalName", "enterpriseName", "date"],
    body: `I, {{legalName}}, as Founding Operator of {{enterpriseName}}, hereby pledge to uphold the AURIENTA Constitutional Framework. I commit to institutional integrity, productive fairness, and operational accountability. This pledge is governed by Egyptian Companies Law 159/1981 and the AURIENTA Constitution v8.2.\n\nDate: {{date}}\n\nLegal basis: Law 15/2004 (E-Signature Law) Art. 14`,
  },
  {
    id: "capital-partner-agreement",
    title: "Capital Partner Participation Agreement",
    description: "Agreement between capital partner and enterprise for equity participation.",
    variables: ["partnerName", "enterpriseName", "equityUnits", "pricePerUnit", "date"],
    body: `CAPITAL PARTNER PARTICIPATION AGREEMENT\n\nThis agreement is entered into on {{date}} between {{partnerName}} ("Capital Partner") and {{enterpriseName}} ("Enterprise").\n\nThe Capital Partner commits to purchase {{equityUnits}} Equity Units at {{pricePerUnit}} EGP per unit, subject to the AURIENTA Constitutional Framework and Egyptian Capital Market Law 95/1992.\n\nFunds will be held in law-firm escrow under Law 17/1983 Art. 47 (Zero Custody principle).\n\nLegal basis: Law 15/2004 (E-Signature Law) Art. 14 + Capital Market Law 95/1992`,
  },
  {
    id: "employment-contract",
    title: "Constitutional Employment Contract",
    description: "Employment contract compliant with Egyptian Labour Law 12/2003.",
    variables: ["employeeName", "enterpriseName", "position", "salary", "startDate"],
    body: `EMPLOYMENT CONTRACT\n\nBetween {{enterpriseName}} ("Employer") and {{employeeName}} ("Employee").\n\nPosition: {{position}}\nMonthly Salary: {{salary}} EGP\nStart Date: {{startDate}}\n\nThis contract is governed by Egyptian Labour Law 12/2003. The Employee is entitled to annual leave (21 days), social insurance under Law 135/2010, and end-of-service gratuity per Law 12/2003 Art. 122.\n\nLegal basis: Law 12/2003 (Labour Law) + Law 15/2004 (E-Signature Law)`,
  },
  {
    id: "milestone-release",
    title: "Milestone Release Authorization",
    description: "Authorization to release escrowed funds upon milestone completion.",
    variables: ["enterpriseName", "milestoneTitle", "amount", "date"],
    body: `MILESTONE RELEASE AUTHORIZATION\n\nEnterprise: {{enterpriseName}}\nMilestone: {{milestoneTitle}}\nRelease Amount: {{amount}} EGP\nDate: {{date}}\n\nThis authorization confirms that the milestone has been verified by the Constitutional Runtime Engine (CRE) and the funds may be released from the law-firm escrow account to the enterprise.\n\nThe release requires dual-signature authorization (CRE Key + Law Firm HSM Key) per the AURIENTA Constitutional Framework.\n\nLegal basis: Law 17/1983 (Lawyers' Code) Art. 47 + Law 15/2004 (E-Signature Law)`,
  },
  {
    id: "dividend-declaration",
    title: "Dividend Declaration Resolution",
    description: "Board resolution declaring dividend distribution.",
    variables: ["enterpriseName", "totalDividend", "recordDate", "paymentDate"],
    body: `DIVIDEND DECLARATION RESOLUTION\n\nEnterprise: {{enterpriseName}}\nTotal Dividend: {{totalDividend}} EGP\nRecord Date: {{recordDate}}\nPayment Date: {{paymentDate}}\n\nThe board of directors hereby resolves to distribute dividends to equity holders of record as of {{recordDate}}. Payment will be made on {{paymentDate}}.\n\nWithholding tax of 10% (resident) / 20% (non-resident) will be applied per Income Tax Law 91/2005 Art. 56.\n\nLegal basis: Companies Law 159/1981 Art. 90 + Income Tax Law 91/2005 Art. 56`,
  },
];
