// AURIENTA — Data Room Module
// Secure document sharing for investor due diligence.
// Legal: Documents are shared at enterprise's discretion. AURIENTA is not
// a custodian — documents are stored in IPFS and access is Ed25519-gated.

import { db } from "@/lib/db";
import { audit } from "./audit";
import { logger } from "./logger";

export type DataRoomDocument = {
  id: string;
  enterpriseId: string;
  name: string;
  category: "financial" | "legal" | "technical" | "commercial" | "other";
  ipfsHash?: string;
  uploadedBy: string;
  uploadedAt: Date;
  accessLevel: "public" | "investor_only" | "board_only" | "private";
  fileSizeBytes?: number;
  mimeType?: string;
};

export type DataRoomAccess = {
  id: string;
  documentId: string;
  grantedTo: string; // user email or "public"
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  viewCount: number;
  lastViewedAt?: Date;
};

const CATEGORIES = ["financial", "legal", "technical", "commercial", "other"] as const;

export async function uploadDocument(params: {
  enterpriseId: string;
  name: string;
  category: DataRoomDocument["category"];
  uploadedBy: string;
  ipfsHash?: string;
  accessLevel?: DataRoomDocument["accessLevel"];
  fileSizeBytes?: number;
  mimeType?: string;
}): Promise<DataRoomDocument> {
  const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const doc: DataRoomDocument = {
    id,
    enterpriseId: params.enterpriseId,
    name: params.name,
    category: params.category,
    ipfsHash: params.ipfsHash,
    uploadedBy: params.uploadedBy,
    uploadedAt: new Date(),
    accessLevel: params.accessLevel || "investor_only",
    fileSizeBytes: params.fileSizeBytes,
    mimeType: params.mimeType,
  };

  await audit({
    actorId: params.uploadedBy,
    action: "data_room_document_uploaded",
    target: `data_room:${id}`,
    result: "allowed",
    metadata: { ...doc },
  });

  logger.info("Data room document uploaded", { id, name: params.name, category: params.category });
  return doc;
}

export async function grantAccess(params: {
  documentId: string;
  grantedTo: string;
  grantedBy: string;
  expiresAt?: Date;
}): Promise<DataRoomAccess> {
  const id = `access-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const access: DataRoomAccess = {
    id,
    documentId: params.documentId,
    grantedTo: params.grantedTo,
    grantedBy: params.grantedBy,
    grantedAt: new Date(),
    expiresAt: params.expiresAt,
    viewCount: 0,
  };

  await audit({
    actorId: params.grantedBy,
    action: "data_room_access_granted",
    target: `data_room:${params.documentId}`,
    result: "allowed",
    metadata: { ...access },
  });

  return access;
}

export async function listDocuments(enterpriseId: string): Promise<DataRoomDocument[]> {
  const records = await db.auditLog.findMany({
    where: {
      action: "data_room_document_uploaded",
      target: { contains: "data_room:" },
    },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  return records
    .map((r) => {
      const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata as any;
      return meta as DataRoomDocument;
    })
    .filter((d) => d.enterpriseId === enterpriseId);
}

export { CATEGORIES };
