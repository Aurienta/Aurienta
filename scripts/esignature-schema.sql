-- E-Signature + Document Automation (Law 15/2004) — new tables for Turso

CREATE TABLE IF NOT EXISTS "ESignatureTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "variables" TEXT NOT NULL DEFAULT '[]',
  "requiredSigners" TEXT NOT NULL DEFAULT '[]',
  "ownerId" TEXT NOT NULL,
  "enterpriseId" TEXT,
  "category" TEXT NOT NULL DEFAULT 'general',
  "jurisdiction" TEXT NOT NULL DEFAULT 'EG',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "ESignatureTemplate_ownerId_idx" ON "ESignatureTemplate"("ownerId");
CREATE INDEX IF NOT EXISTS "ESignatureTemplate_enterpriseId_idx" ON "ESignatureTemplate"("enterpriseId");
CREATE INDEX IF NOT EXISTS "ESignatureTemplate_category_idx" ON "ESignatureTemplate"("category");

CREATE TABLE IF NOT EXISTS "ESignatureDocument" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "templateId" TEXT,
  "ownerId" TEXT NOT NULL,
  "enterpriseId" TEXT,
  "title" TEXT NOT NULL,
  "filledBody" TEXT NOT NULL,
  "variablesUsed" TEXT NOT NULL DEFAULT '{}',
  "documentHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "ledgerAnchorHash" TEXT,
  "ledgerSequence" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "expiresAt" DATETIME,
  FOREIGN KEY ("templateId") REFERENCES "ESignatureTemplate"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "ESignatureDocument_ownerId_idx" ON "ESignatureDocument"("ownerId");
CREATE INDEX IF NOT EXISTS "ESignatureDocument_enterpriseId_idx" ON "ESignatureDocument"("enterpriseId");
CREATE INDEX IF NOT EXISTS "ESignatureDocument_templateId_idx" ON "ESignatureDocument"("templateId");
CREATE INDEX IF NOT EXISTS "ESignatureDocument_status_idx" ON "ESignatureDocument"("status");

CREATE TABLE IF NOT EXISTS "ESignatureRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "documentId" TEXT NOT NULL,
  "signerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "signatureB64" TEXT,
  "signatureHash" TEXT,
  "signedAt" DATETIME,
  "declinedAt" DATETIME,
  "declinedReason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("documentId") REFERENCES "ESignatureDocument"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ESignatureRequest_documentId_signerId_key" ON "ESignatureRequest"("documentId", "signerId");
CREATE INDEX IF NOT EXISTS "ESignatureRequest_documentId_idx" ON "ESignatureRequest"("documentId");
CREATE INDEX IF NOT EXISTS "ESignatureRequest_signerId_idx" ON "ESignatureRequest"("signerId");
CREATE INDEX IF NOT EXISTS "ESignatureRequest_status_idx" ON "ESignatureRequest"("status");
