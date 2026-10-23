-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "verificationLevel" TEXT NOT NULL DEFAULT 'L2',
    "nationality" TEXT NOT NULL DEFAULT 'EG',
    "nationalIdLast4" TEXT,
    "identityHash" TEXT,
    "identityAnchor" TEXT,
    "identitySecretEnc" TEXT,
    "sovereignTrustScore" INTEGER NOT NULL DEFAULT 65,
    "tier" TEXT NOT NULL DEFAULT 'Emerging Participant',
    "avatarColor" TEXT NOT NULL DEFAULT '#d4af37',
    "primaryIntent" TEXT,
    "riskProfile" TEXT,
    "familyConsent" BOOLEAN NOT NULL DEFAULT false,
    "totpSecretEnc" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "policeClearanceValid" BOOLEAN NOT NULL DEFAULT false,
    "policeClearanceExpiresAt" DATETIME,
    "pledgeSignedAt" DATETIME,
    "pledgeSignature" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "verificationRejectedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "updatedById" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlatformSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LawFirm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "frLicenseNumber" TEXT NOT NULL,
    "insuranceEgp" INTEGER NOT NULL DEFAULT 100000000,
    "expertiseScore" INTEGER NOT NULL DEFAULT 80,
    "status" TEXT NOT NULL DEFAULT 'active',
    "publicKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AccountingFirm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "esaaLicense" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Enterprise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'stage_1',
    "stageSince" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "legalForm" TEXT NOT NULL DEFAULT 'LLC',
    "healthRating" TEXT,
    "healthScore" INTEGER NOT NULL DEFAULT 75,
    "healthScoreUpdatedAt" DATETIME,
    "fundraisingGoalEgp" INTEGER NOT NULL,
    "raisedEgp" INTEGER NOT NULL DEFAULT 0,
    "minInvestmentEgp" INTEGER NOT NULL DEFAULT 50,
    "investorCap" INTEGER,
    "minParticipationEgp" INTEGER NOT NULL DEFAULT 50,
    "sharePriceEgp" INTEGER NOT NULL DEFAULT 50,
    "totalShares" INTEGER NOT NULL,
    "founderEquityPct" REAL NOT NULL DEFAULT 5,
    "platformFeePct" REAL NOT NULL DEFAULT 5,
    "consultingFeePct" REAL NOT NULL DEFAULT 2.5,
    "consultingOptOut" BOOLEAN NOT NULL DEFAULT false,
    "monthlyRevenueEgp" INTEGER NOT NULL DEFAULT 0,
    "monthlyBurnEgp" INTEGER NOT NULL DEFAULT 0,
    "escrowBalanceEgp" INTEGER NOT NULL DEFAULT 0,
    "grossMarginPct" REAL NOT NULL DEFAULT 30,
    "revenueGrowthPct" REAL NOT NULL DEFAULT 20,
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "nosiCompliantPct" REAL NOT NULL DEFAULT 100,
    "policeClearanceValid" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "frozenAt" DATETIME,
    "graduationReadiness" INTEGER NOT NULL DEFAULT 0,
    "transparencyScore" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "website" TEXT,
    "logoUrl" TEXT,
    "mission" TEXT,
    "vision" TEXT,
    "problem" TEXT,
    "solution" TEXT,
    "productService" TEXT,
    "targetMarket" TEXT,
    "revenueModel" TEXT,
    "currentCustomers" TEXT,
    "pitchDeckUrl" TEXT,
    "founderVideoUrl" TEXT,
    "githubUrl" TEXT,
    "linkedinUrl" TEXT,
    "twitterUrl" TEXT,
    "founderBio" TEXT,
    "founderStatement" TEXT,
    "founderRequest" TEXT,
    "evidenceLevel" TEXT NOT NULL DEFAULT 'E0',
    "submissionStatus" TEXT NOT NULL DEFAULT 'draft',
    "founderId" TEXT NOT NULL,
    "lawFirmId" TEXT,
    "accountingFirmId" TEXT,
    CONSTRAINT "Enterprise_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Enterprise_lawFirmId_fkey" FOREIGN KEY ("lawFirmId") REFERENCES "LawFirm" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Enterprise_accountingFirmId_fkey" FOREIGN KEY ("accountingFirmId") REFERENCES "AccountingFirm" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnterpriseMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "boardSeat" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EnterpriseMember_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EnterpriseMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shareholding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shares" INTEGER NOT NULL,
    "avgPriceEgp" DECIMAL NOT NULL,
    "restrictedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shareholding_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Shareholding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedgerEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT,
    "eventType" TEXT NOT NULL,
    "prevHash" TEXT,
    "payloadHash" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "creDecisionToken" TEXT,
    "actorId" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LedgerEvent_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "result" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'voting_open',
    "feeEgp" INTEGER NOT NULL DEFAULT 0,
    "coolingEndsAt" DATETIME,
    "votingEndsAt" DATETIME NOT NULL,
    "quorumPct" REAL NOT NULL DEFAULT 51,
    "passThreshold" REAL NOT NULL DEFAULT 50,
    "votesFor" INTEGER NOT NULL DEFAULT 0,
    "votesAgainst" INTEGER NOT NULL DEFAULT 0,
    "votesAbstain" INTEGER NOT NULL DEFAULT 0,
    "totalVotingPower" INTEGER NOT NULL,
    "aiRiskScore" INTEGER NOT NULL DEFAULT 20,
    "aiRecommendation" TEXT,
    "aiConfidence" REAL NOT NULL DEFAULT 0.8,
    "executedAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Proposal_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Proposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "votingPower" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountEgp" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "eveConfidence" REAL NOT NULL DEFAULT 0.85,
    "evidenceNote" TEXT,
    "dueAt" DATETIME,
    "releasedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Milestone_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "amountEgp" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approver1Id" TEXT,
    "approver2Id" TEXT,
    "submittedById" TEXT NOT NULL,
    "receiptNote" TEXT,
    "aiRiskFlag" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    CONSTRAINT "Expense_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Expense_approver1Id_fkey" FOREIGN KEY ("approver1Id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "hireDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employmentType" TEXT NOT NULL DEFAULT 'full_time',
    "compensationBand" TEXT NOT NULL,
    "monthlySalaryEgp" INTEGER NOT NULL,
    "nosiStatus" TEXT NOT NULL DEFAULT 'registered',
    "nosiNumber" TEXT,
    "nosiRegisteredAt" DATETIME,
    "keyPerson" BOOLEAN NOT NULL DEFAULT false,
    "equityConversionPct" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Employee_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shares" INTEGER NOT NULL,
    "amountEgp" INTEGER NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'reserved',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradeOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "shares" INTEGER NOT NULL,
    "priceEgp" DECIMAL NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'phase_3',
    "status" TEXT NOT NULL DEFAULT 'open',
    "filledShares" INTEGER NOT NULL DEFAULT 0,
    "feesEgp" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TradeOrder_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TradeOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Valuation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "preMoneyEgp" INTEGER NOT NULL,
    "sharePriceEgp" DECIMAL NOT NULL,
    "cppEgp" DECIMAL NOT NULL,
    "growthMultiplier" REAL NOT NULL,
    "founderPremium" REAL NOT NULL,
    "aiConfidence" REAL NOT NULL DEFAULT 0.85,
    "modelVersion" TEXT NOT NULL DEFAULT 'JOZOUR v3',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Valuation_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DashboardTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "enterpriseId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueAt" DATETIME,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DashboardTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "enterpriseId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "href" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "aiPriority" TEXT,
    "aiSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CopilotChat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "content" TEXT NOT NULL,
    "context" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CopilotChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GraduationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "enterpriseName" TEXT NOT NULL,
    "tierAtGraduation" TEXT NOT NULL,
    "finalHealthScore" INTEGER NOT NULL,
    "finalMaturityScore" INTEGER NOT NULL,
    "readinessScore" INTEGER NOT NULL,
    "graduationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sovereignCert" BOOLEAN NOT NULL DEFAULT true,
    "testimonial" TEXT,
    "website" TEXT,
    "exportHash" TEXT
);

-- CreateTable
CREATE TABLE "AiArtifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "enterpriseId" TEXT,
    "userId" TEXT,
    "entityId" TEXT,
    "content" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "modelVersion" TEXT NOT NULL DEFAULT 'glm-4.6',
    "confidence" REAL NOT NULL DEFAULT 0.85,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiArtifact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiArtifact_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Syndicate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "leadPartnerId" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "targetShares" INTEGER NOT NULL,
    "committedShares" INTEGER NOT NULL DEFAULT 0,
    "riskProfile" TEXT NOT NULL DEFAULT 'balanced',
    "status" TEXT NOT NULL DEFAULT 'forming',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Syndicate_leadPartnerId_fkey" FOREIGN KEY ("leadPartnerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Syndicate_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyndicateMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "syndicateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shares" INTEGER NOT NULL,
    "amountEgp" INTEGER NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyndicateMember_syndicateId_fkey" FOREIGN KEY ("syndicateId") REFERENCES "Syndicate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SyndicateMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DripEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "reinvestPct" REAL NOT NULL DEFAULT 100,
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "DripEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CareerLedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vcCid" TEXT,
    "vcIssuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valueEgp" INTEGER,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "CareerLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CareerLedgerEntry_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mentorship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "menteeEnterpriseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "equityGrantPct" REAL NOT NULL DEFAULT 0,
    "focusAreas" TEXT NOT NULL DEFAULT '[]',
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mentorship_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mentorship_menteeEnterpriseId_fkey" FOREIGN KEY ("menteeEnterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillEquityClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "tenureMonths" INTEGER NOT NULL,
    "tenureVerified" BOOLEAN NOT NULL DEFAULT false,
    "credentialType" TEXT NOT NULL,
    "credentialName" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "credentialId" TEXT,
    "issueDate" DATETIME NOT NULL,
    "documentCid" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "equityGrantPct" REAL NOT NULL DEFAULT 0,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "aiAssessment" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkillEquityClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkillEquityClaim_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IpfsEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "milestoneId" TEXT,
    "enterpriseId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "description" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IpfsEvidence_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurvivalDrill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "drillDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" TEXT NOT NULL DEFAULT 'passed',
    "durationHours" INTEGER NOT NULL DEFAULT 168,
    "findings" TEXT NOT NULL DEFAULT '{}',
    "certificateExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurvivalDrill_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiasporaProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "countryOfResidence" TEXT NOT NULL,
    "remittanceIntentEgp" INTEGER NOT NULL DEFAULT 0,
    "fxLockedRate" DECIMAL,
    "fxLockedUntil" DATETIME,
    "documentsVerified" BOOLEAN NOT NULL DEFAULT false,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "sourceOfFundsDeclared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DiasporaProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IrQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "sources" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'answered',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IrQuestion_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IrQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuarterlyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "revenueEgp" INTEGER NOT NULL,
    "cogsEgp" INTEGER NOT NULL,
    "grossProfitEgp" INTEGER NOT NULL,
    "opexEgp" INTEGER NOT NULL,
    "netProfitEgp" INTEGER NOT NULL,
    "escrowBalanceEgp" INTEGER NOT NULL,
    "monthlyBurnEgp" INTEGER NOT NULL,
    "runwayMonths" REAL NOT NULL,
    "grossMarginPct" REAL NOT NULL,
    "revenueGrowthPct" REAL NOT NULL,
    "aiRiskFlag" TEXT,
    "aiAssessment" TEXT,
    "ipfsCid" TEXT,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuarterlyReport_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commercialRegister" TEXT,
    "category" TEXT NOT NULL,
    "totalPaidYtdEgp" INTEGER NOT NULL DEFAULT 0,
    "riskScore" INTEGER NOT NULL DEFAULT 10,
    "relatedParty" BOOLEAN NOT NULL DEFAULT false,
    "uboOverlapNote" TEXT,
    "firstTransactionAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vendor_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WhistleblowerReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackingCode" TEXT NOT NULL,
    "enterpriseId" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attachmentsCid" TEXT,
    "credibilityScore" REAL,
    "aiSummary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "bondEgp" INTEGER NOT NULL DEFAULT 0,
    "bountyPaidEgp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "WhistleblowerReport_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppealCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filedById" TEXT NOT NULL,
    "enterpriseId" TEXT,
    "caseType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "feeEgp" INTEGER NOT NULL DEFAULT 500,
    "stage" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'filed',
    "aiRuling" TEXT,
    "humanRuling" TEXT,
    "finalRuling" TEXT,
    "precedentNote" TEXT,
    "filedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "AppealCase_filedById_fkey" FOREIGN KEY ("filedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AppealCase_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiskDisclosure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "amountEgp" INTEGER NOT NULL,
    "riskProfile" TEXT NOT NULL,
    "stressLossEstimateEgp" INTEGER NOT NULL,
    "stressScenario" TEXT NOT NULL,
    "coolingEndsAt" DATETIME NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiskDisclosure_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RiskDisclosure_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "ip" TEXT,
    "userAgent" TEXT,
    "mfaVerifiedAt" DATETIME,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "requestBodyHash" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "responseBody" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CreDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policy" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "reason" TEXT,
    "decisionToken" TEXT NOT NULL,
    "actorId" TEXT,
    "enterpriseId" TEXT,
    "payloadHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EnterpriseUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentsCid" TEXT,
    "aiSummary" TEXT,
    "aiAudienceCapital" TEXT,
    "aiAudienceCompliance" TEXT,
    "aiSentiment" TEXT,
    "isMilestone" BOOLEAN NOT NULL DEFAULT false,
    "milestoneType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EnterpriseUpdate_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EnterpriseUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PartnerEngagement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "churnRisk" TEXT NOT NULL DEFAULT 'low',
    "aiInsight" TEXT,
    "lastAiUpdate" DATETIME,
    "votesParticipated" INTEGER NOT NULL DEFAULT 0,
    "updatesRead" INTEGER NOT NULL DEFAULT 0,
    "copilotQueries" INTEGER NOT NULL DEFAULT 0,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PartnerEngagement_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PartnerEngagement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnnualReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "fiscalYearEnd" DATETIME NOT NULL,
    "revenueEgp" INTEGER NOT NULL,
    "netProfitEgp" INTEGER NOT NULL,
    "totalAssetsEgp" INTEGER NOT NULL,
    "totalLiabilitiesEgp" INTEGER NOT NULL,
    "auditStatus" TEXT NOT NULL DEFAULT 'pending',
    "auditorName" TEXT,
    "auditorLicense" TEXT,
    "brainAiAssessment" TEXT,
    "ipfsCid" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnnualReport_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnterpriseDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "evidenceLevel" TEXT NOT NULL DEFAULT 'E0',
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "visibilityClass" TEXT NOT NULL DEFAULT 'enterprise_members',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EnterpriseDocument_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TermsAcceptance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "acceptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "acceptanceType" TEXT NOT NULL DEFAULT 'core_terms',
    "affirmationText" TEXT NOT NULL,
    "preSelected" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TermsAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "buyOrderId" TEXT NOT NULL,
    "sellOrderId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "equityUnits" INTEGER NOT NULL,
    "priceEgp" DECIMAL NOT NULL,
    "grossEgp" DECIMAL NOT NULL,
    "platformFeeEgp" DECIMAL NOT NULL,
    "cgtEgp" DECIMAL NOT NULL,
    "totalEgp" DECIMAL NOT NULL,
    "phase" TEXT NOT NULL,
    "matchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trade_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trade_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trade_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InsuranceVault" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "totalContributedEgp" DECIMAL NOT NULL DEFAULT 0,
    "currentBalanceEgp" DECIMAL NOT NULL DEFAULT 0,
    "totalLoanedEgp" DECIMAL NOT NULL DEFAULT 0,
    "totalRepaidEgp" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InsuranceVault_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VaultLoan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "amountEgp" DECIMAL NOT NULL,
    "reason" TEXT NOT NULL,
    "boardVotePct" REAL NOT NULL,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "repaidEgp" DECIMAL NOT NULL DEFAULT 0,
    "repaymentDueAt" DATETIME,
    CONSTRAINT "VaultLoan_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SolvencyAssertion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "lawFirmBalanceEgp" DECIMAL NOT NULL,
    "internalBalanceEgp" DECIMAL NOT NULL,
    "varianceEgp" DECIMAL NOT NULL,
    "variancePct" REAL NOT NULL,
    "healthLevel" INTEGER NOT NULL DEFAULT 1,
    "assertionHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SolvencyAssertion_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GovApiVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT,
    "userId" TEXT,
    "verificationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "documentUrl" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "expiresAt" DATETIME,
    CONSTRAINT "GovApiVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VotingProxy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "delegatorId" TEXT NOT NULL,
    "delegateeId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'all',
    "proposalId" TEXT,
    "proposalType" TEXT,
    "votingPowerDelegated" REAL NOT NULL,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VotingProxy_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VotingProxy_delegatorId_fkey" FOREIGN KEY ("delegatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VotingProxy_delegateeId_fkey" FOREIGN KEY ("delegateeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SuccessionDeclaration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "beneficiaryUserId" TEXT,
    "beneficiaryName" TEXT,
    "beneficiaryNationalId" TEXT,
    "conditions" TEXT NOT NULL,
    "votingProxyActive" BOOLEAN NOT NULL DEFAULT false,
    "votingProxyActivatedAt" DATETIME,
    "emergencyManagerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "declaredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SuccessionDeclaration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EconomicBeneficiary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "successionDeclarationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    "nationalIdLast4" TEXT,
    CONSTRAINT "EconomicBeneficiary_successionDeclarationId_fkey" FOREIGN KEY ("successionDeclarationId") REFERENCES "SuccessionDeclaration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LawFirmWebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lawFirmId" TEXT NOT NULL,
    "enterpriseId" TEXT,
    "eventType" TEXT NOT NULL,
    "amountEgp" DECIMAL,
    "reference" TEXT,
    "rawPayload" TEXT NOT NULL,
    "signatureValid" BOOLEAN NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LawFirmWebhookEvent_lawFirmId_fkey" FOREIGN KEY ("lawFirmId") REFERENCES "LawFirm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CircuitBreakerHalt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "triggeredByPrice" DECIMAL,
    "referencePrice" DECIMAL,
    "deviationPct" REAL,
    "reason" TEXT NOT NULL,
    "triggeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resumeAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CircuitBreakerHalt_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FxRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DiscoveryProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "riskAppetite" TEXT NOT NULL DEFAULT 'balanced',
    "preferredSectors" TEXT NOT NULL DEFAULT '',
    "preferredTiers" TEXT NOT NULL DEFAULT 'A,B,C',
    "minHealthRating" TEXT NOT NULL DEFAULT 'BBB',
    "minInvestmentEgp" INTEGER NOT NULL DEFAULT 50,
    "maxInvestmentEgp" INTEGER NOT NULL DEFAULT 10000,
    "targetDiversification" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DiscoveryMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "matchReasons" TEXT NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "invested" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProfitShareAgreement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contributionEgp" INTEGER NOT NULL,
    "profitSharePct" REAL NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maturesAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalDistributedEgp" INTEGER NOT NULL DEFAULT 0,
    "creDecisionToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GaasOrganization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'standard',
    "monthlyFeeEgp" INTEGER NOT NULL DEFAULT 2500,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GaasPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleText" TEXT NOT NULL,
    "ruleHash" TEXT NOT NULL,
    "enforcementLogic" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GaasDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "decisionText" TEXT NOT NULL,
    "decisionHash" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "reason" TEXT,
    "decisionToken" TEXT,
    "actorEmail" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StandaloneSuccessionCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'EG',
    "declarantId" TEXT NOT NULL,
    "declarationHash" TEXT NOT NULL,
    "shamirThreshold" INTEGER NOT NULL DEFAULT 2,
    "shamirShares" INTEGER NOT NULL DEFAULT 3,
    "activationDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'drafted',
    "feeEgp" INTEGER NOT NULL DEFAULT 5000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DiasporaCorridorRound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "totalPledgedEgp" INTEGER NOT NULL DEFAULT 0,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "fxRateLocked" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "closesAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AreiSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "indexValue" REAL NOT NULL,
    "changePct" REAL NOT NULL,
    "constituentCount" INTEGER NOT NULL,
    "topMoverId" TEXT,
    "bottomMoverId" TEXT,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ConstitutionalEndorsement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endorserId" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "stakeSts" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "outcome" TEXT NOT NULL DEFAULT 'pending',
    "stsDelta" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "EnterpriseGenome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "attributesJson" TEXT NOT NULL,
    "graduationProbability" REAL NOT NULL DEFAULT 0.5,
    "riskScore" REAL NOT NULL DEFAULT 0.5,
    "modelVersion" TEXT NOT NULL DEFAULT 'genome-v1',
    "trainedOnCount" INTEGER NOT NULL DEFAULT 0,
    "predictedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "QuadraticVoteAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "voiceCredits" INTEGER NOT NULL,
    "creditsSpent" INTEGER NOT NULL DEFAULT 0,
    "voteWeight" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ZeitgeistSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "sentimentScore" REAL NOT NULL,
    "confidencePct" REAL NOT NULL,
    "signalCount" INTEGER NOT NULL,
    "topTheme" TEXT,
    "summaryText" TEXT NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PriorityWindowAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "windowPhase" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "stsAtAllocation" INTEGER NOT NULL,
    "allocationRank" INTEGER NOT NULL,
    "allocatedEgp" INTEGER NOT NULL DEFAULT 0,
    "allocatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OracleQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKeyHash" TEXT NOT NULL,
    "queryText" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "consensusVerdict" TEXT NOT NULL,
    "decisionToken" TEXT,
    "modelsConsulted" TEXT NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "disclaimerShown" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SoulboundCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL DEFAULT 'identity',
    "verificationLevel" TEXT NOT NULL,
    "sovereignTrustScore" INTEGER NOT NULL,
    "anchorPublicKey" TEXT NOT NULL,
    "tokenUri" TEXT NOT NULL,
    "isTransferable" BOOLEAN NOT NULL DEFAULT false,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "mintedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME
);

-- CreateTable
CREATE TABLE "RiskProfileQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "requesterOrg" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "healthScore" INTEGER NOT NULL,
    "riskFactors" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "disclaimerShown" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PasskeyCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT NOT NULL DEFAULT '',
    "deviceType" TEXT NOT NULL DEFAULT 'singleDevice',
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME
);

-- CreateTable
CREATE TABLE "AccountLockout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "lastFailedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RateLimitEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TakafulClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "claimType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceCid" TEXT,
    "amountRequested" INTEGER NOT NULL,
    "amountApproved" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "creDecisionToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "MilestoneAdvance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "advanceAmountEgp" INTEGER NOT NULL,
    "constitutionalRate" REAL NOT NULL,
    "termDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "creDecisionToken" TEXT,
    "fundedAt" DATETIME,
    "repaidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CooperativeTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerEnterpriseId" TEXT NOT NULL,
    "sellerEnterpriseId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountEgp" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "creDecisionToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "GraduationBond" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "bondHash" TEXT NOT NULL,
    "graduationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creDecisionToken" TEXT,
    "constitutionHash" TEXT NOT NULL,
    "healthScoreAtGraduation" INTEGER NOT NULL,
    "vitalSignsSummary" TEXT NOT NULL,
    "partnerCount" INTEGER NOT NULL,
    "capitalRaisedTotal" INTEGER NOT NULL,
    "creDecisionsCount" INTEGER NOT NULL,
    "isRevocable" BOOLEAN NOT NULL DEFAULT false,
    "verificationUrl" TEXT
);

-- CreateTable
CREATE TABLE "ProductiveEgpSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "equityUnitPriceEgp" DECIMAL NOT NULL,
    "equityUnitPriceUsd" DECIMAL NOT NULL,
    "fxRateUsdToEgp" DECIMAL NOT NULL,
    "inflationRatePct" REAL NOT NULL,
    "realReturnPct" REAL NOT NULL,
    "snapshotDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ConstitutionalWageBand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "minSalaryEgp" INTEGER NOT NULL,
    "medianSalaryEgp" INTEGER NOT NULL,
    "maxSalaryEgp" INTEGER NOT NULL,
    "regionalAdjustment" REAL NOT NULL DEFAULT 1.0,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TradeMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyOrderId" TEXT NOT NULL,
    "sellOrderId" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "matchedPriceEgp" DECIMAL NOT NULL,
    "matchedShares" INTEGER NOT NULL,
    "buyerFeeEgp" INTEGER NOT NULL DEFAULT 0,
    "sellerFeeEgp" INTEGER NOT NULL DEFAULT 0,
    "creDecisionToken" TEXT,
    "matchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DividendDistribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "totalDividendEgp" INTEGER NOT NULL,
    "perShareDividendEgp" DECIMAL NOT NULL,
    "partnerCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'declared',
    "creDecisionToken" TEXT,
    "declaredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME,
    "recordDate" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ErpProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'internal',
    "status" TEXT NOT NULL DEFAULT 'planning',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "budgetEgp" INTEGER NOT NULL DEFAULT 0,
    "spentEgp" INTEGER NOT NULL DEFAULT 0,
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "managerId" TEXT,
    "clientId" TEXT,
    "healthScore" INTEGER NOT NULL DEFAULT 75,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "creDecisionToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ErpTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "wbsCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assigneeId" TEXT,
    "estimatedHours" REAL NOT NULL DEFAULT 0,
    "actualHours" REAL NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "blockedReason" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ErpResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "capacity" REAL NOT NULL DEFAULT 1,
    "allocated" REAL NOT NULL DEFAULT 0,
    "available" REAL NOT NULL DEFAULT 1,
    "costPerUnitEgp" DECIMAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'hour',
    "status" TEXT NOT NULL DEFAULT 'active',
    "location" TEXT,
    "skills" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ErpAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "projectId" TEXT,
    "taskId" TEXT,
    "enterpriseId" TEXT NOT NULL,
    "allocatedQty" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "costEgp" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ErpTimesheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "taskId" TEXT,
    "date" DATETIME NOT NULL,
    "hours" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "hourlyRateEgp" DECIMAL NOT NULL DEFAULT 0,
    "totalCostEgp" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ErpInventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'piece',
    "quantityOnHand" REAL NOT NULL DEFAULT 0,
    "quantityReserved" REAL NOT NULL DEFAULT 0,
    "quantityAvailable" REAL NOT NULL DEFAULT 0,
    "reorderPoint" REAL NOT NULL DEFAULT 0,
    "maxStock" REAL NOT NULL DEFAULT 0,
    "costPerUnitEgp" DECIMAL NOT NULL DEFAULT 0,
    "sellPriceEgp" DECIMAL NOT NULL DEFAULT 0,
    "warehouseLocation" TEXT,
    "barcode" TEXT,
    "supplierId" TEXT,
    "lastStockIn" DATETIME,
    "lastStockOut" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ErpInventoryMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryId" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "notes" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ErpPurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "vendorId" TEXT,
    "vendorName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalEgp" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "expectedDate" DATETIME,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "projectId" TEXT,
    "creDecisionToken" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ErpPurchaseOrderLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseOrderId" TEXT NOT NULL,
    "inventoryId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'piece',
    "unitPriceEgp" DECIMAL NOT NULL,
    "totalPriceEgp" DECIMAL NOT NULL,
    "receivedQty" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ErpAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "acquisitionDate" DATETIME NOT NULL,
    "acquisitionCostEgp" INTEGER NOT NULL,
    "currentValueEgp" INTEGER NOT NULL,
    "depreciationMethod" TEXT NOT NULL DEFAULT 'straight_line',
    "depreciationRate" REAL NOT NULL DEFAULT 0.1,
    "accumulatedDepreciationEgp" INTEGER NOT NULL DEFAULT 0,
    "netBookValueEgp" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "location" TEXT,
    "assignedTo" TEXT,
    "warrantyExpiry" DATETIME,
    "insuranceExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ErpProductionOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'piece',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "completedQty" REAL NOT NULL DEFAULT 0,
    "projectId" TEXT,
    "costEgp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ErpBom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productionOrderId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantityRequired" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'piece',
    "quantityIssued" REAL NOT NULL DEFAULT 0,
    "costPerUnitEgp" DECIMAL NOT NULL DEFAULT 0,
    "totalCostEgp" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ErpQualityCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "productionOrderId" TEXT,
    "projectId" TEXT,
    "inventoryId" TEXT,
    "checkType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "inspectorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "defectsFound" INTEGER NOT NULL DEFAULT 0,
    "passRate" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "checkedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ErpIntegration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'native',
    "name" TEXT NOT NULL DEFAULT 'AURIENTA Native ERP',
    "status" TEXT NOT NULL DEFAULT 'active',
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "configJson" TEXT NOT NULL DEFAULT '{}',
    "configHash" TEXT,
    "syncDirection" TEXT NOT NULL DEFAULT 'bidirectional',
    "syncInterval" TEXT NOT NULL DEFAULT 'hourly',
    "lastSyncAt" DATETIME,
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "modulesJson" TEXT NOT NULL DEFAULT '["projects","tasks","inventory","procurement","assets","production","quality","timesheets"]',
    "fieldMappingJson" TEXT NOT NULL DEFAULT '{}',
    "creEnforcementEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ErpSyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "module" TEXT,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'started',
    "recordsIn" INTEGER NOT NULL DEFAULT 0,
    "recordsOut" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT NOT NULL DEFAULT '[]',
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "creDecisions" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "User_identityHash_key" ON "User"("identityHash");

-- CreateIndex
CREATE INDEX "User_tier_idx" ON "User"("tier");

-- CreateIndex
CREATE INDEX "User_verificationLevel_idx" ON "User"("verificationLevel");

-- CreateIndex
CREATE INDEX "User_nationality_idx" ON "User"("nationality");

-- CreateIndex
CREATE INDEX "User_primaryIntent_idx" ON "User"("primaryIntent");

-- CreateIndex
CREATE INDEX "User_sovereignTrustScore_idx" ON "User"("sovereignTrustScore");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");

-- CreateIndex
CREATE INDEX "PlatformSetting_category_idx" ON "PlatformSetting"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Enterprise_slug_key" ON "Enterprise"("slug");

-- CreateIndex
CREATE INDEX "Enterprise_founderId_idx" ON "Enterprise"("founderId");

-- CreateIndex
CREATE INDEX "Enterprise_lawFirmId_idx" ON "Enterprise"("lawFirmId");

-- CreateIndex
CREATE INDEX "Enterprise_accountingFirmId_idx" ON "Enterprise"("accountingFirmId");

-- CreateIndex
CREATE INDEX "EnterpriseMember_userId_idx" ON "EnterpriseMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EnterpriseMember_enterpriseId_userId_role_key" ON "EnterpriseMember"("enterpriseId", "userId", "role");

-- CreateIndex
CREATE INDEX "Shareholding_enterpriseId_idx" ON "Shareholding"("enterpriseId");

-- CreateIndex
CREATE INDEX "Shareholding_userId_idx" ON "Shareholding"("userId");

-- CreateIndex
CREATE INDEX "Shareholding_createdAt_idx" ON "Shareholding"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Shareholding_enterpriseId_userId_key" ON "Shareholding"("enterpriseId", "userId");

-- CreateIndex
CREATE INDEX "LedgerEvent_enterpriseId_timestamp_idx" ON "LedgerEvent"("enterpriseId", "timestamp");

-- CreateIndex
CREATE INDEX "LedgerEvent_enterpriseId_prevHash_idx" ON "LedgerEvent"("enterpriseId", "prevHash");

-- CreateIndex
CREATE INDEX "LedgerEvent_eventType_idx" ON "LedgerEvent"("eventType");

-- CreateIndex
CREATE INDEX "LedgerEvent_actorId_idx" ON "LedgerEvent"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEvent_enterpriseId_sequence_key" ON "LedgerEvent"("enterpriseId", "sequence");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "Proposal_enterpriseId_idx" ON "Proposal"("enterpriseId");

-- CreateIndex
CREATE INDEX "Proposal_createdById_idx" ON "Proposal"("createdById");

-- CreateIndex
CREATE INDEX "Vote_proposalId_idx" ON "Vote"("proposalId");

-- CreateIndex
CREATE INDEX "Vote_userId_idx" ON "Vote"("userId");

-- CreateIndex
CREATE INDEX "Vote_createdAt_idx" ON "Vote"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_proposalId_userId_key" ON "Vote"("proposalId", "userId");

-- CreateIndex
CREATE INDEX "Milestone_enterpriseId_idx" ON "Milestone"("enterpriseId");

-- CreateIndex
CREATE INDEX "Expense_enterpriseId_idx" ON "Expense"("enterpriseId");

-- CreateIndex
CREATE INDEX "Expense_approver1Id_idx" ON "Expense"("approver1Id");

-- CreateIndex
CREATE INDEX "Expense_approver2Id_idx" ON "Expense"("approver2Id");

-- CreateIndex
CREATE INDEX "Expense_submittedById_idx" ON "Expense"("submittedById");

-- CreateIndex
CREATE INDEX "Employee_enterpriseId_idx" ON "Employee"("enterpriseId");

-- CreateIndex
CREATE INDEX "Employee_userId_idx" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_referenceCode_key" ON "Reservation"("referenceCode");

-- CreateIndex
CREATE INDEX "Reservation_enterpriseId_idx" ON "Reservation"("enterpriseId");

-- CreateIndex
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");

-- CreateIndex
CREATE INDEX "TradeOrder_enterpriseId_idx" ON "TradeOrder"("enterpriseId");

-- CreateIndex
CREATE INDEX "TradeOrder_userId_idx" ON "TradeOrder"("userId");

-- CreateIndex
CREATE INDEX "Valuation_enterpriseId_idx" ON "Valuation"("enterpriseId");

-- CreateIndex
CREATE INDEX "DashboardTask_userId_idx" ON "DashboardTask"("userId");

-- CreateIndex
CREATE INDEX "DashboardTask_enterpriseId_idx" ON "DashboardTask"("enterpriseId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_enterpriseId_idx" ON "Notification"("enterpriseId");

-- CreateIndex
CREATE INDEX "CopilotChat_userId_idx" ON "CopilotChat"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationRecord_enterpriseId_key" ON "GraduationRecord"("enterpriseId");

-- CreateIndex
CREATE INDEX "GraduationRecord_enterpriseId_idx" ON "GraduationRecord"("enterpriseId");

-- CreateIndex
CREATE INDEX "AiArtifact_kind_enterpriseId_idx" ON "AiArtifact"("kind", "enterpriseId");

-- CreateIndex
CREATE INDEX "AiArtifact_kind_userId_idx" ON "AiArtifact"("kind", "userId");

-- CreateIndex
CREATE INDEX "AiArtifact_entityId_idx" ON "AiArtifact"("entityId");

-- CreateIndex
CREATE INDEX "Syndicate_leadPartnerId_idx" ON "Syndicate"("leadPartnerId");

-- CreateIndex
CREATE INDEX "Syndicate_enterpriseId_idx" ON "Syndicate"("enterpriseId");

-- CreateIndex
CREATE INDEX "SyndicateMember_syndicateId_idx" ON "SyndicateMember"("syndicateId");

-- CreateIndex
CREATE INDEX "SyndicateMember_userId_idx" ON "SyndicateMember"("userId");

-- CreateIndex
CREATE INDEX "SyndicateMember_joinedAt_idx" ON "SyndicateMember"("joinedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SyndicateMember_syndicateId_userId_key" ON "SyndicateMember"("syndicateId", "userId");

-- CreateIndex
CREATE INDEX "DripEnrollment_userId_idx" ON "DripEnrollment"("userId");

-- CreateIndex
CREATE INDEX "DripEnrollment_enterpriseId_idx" ON "DripEnrollment"("enterpriseId");

-- CreateIndex
CREATE INDEX "DripEnrollment_active_idx" ON "DripEnrollment"("active");

-- CreateIndex
CREATE UNIQUE INDEX "DripEnrollment_userId_enterpriseId_key" ON "DripEnrollment"("userId", "enterpriseId");

-- CreateIndex
CREATE INDEX "CareerLedgerEntry_userId_idx" ON "CareerLedgerEntry"("userId");

-- CreateIndex
CREATE INDEX "CareerLedgerEntry_enterpriseId_idx" ON "CareerLedgerEntry"("enterpriseId");

-- CreateIndex
CREATE INDEX "Mentorship_mentorId_idx" ON "Mentorship"("mentorId");

-- CreateIndex
CREATE INDEX "Mentorship_menteeEnterpriseId_idx" ON "Mentorship"("menteeEnterpriseId");

-- CreateIndex
CREATE INDEX "SkillEquityClaim_employeeId_idx" ON "SkillEquityClaim"("employeeId");

-- CreateIndex
CREATE INDEX "SkillEquityClaim_userId_idx" ON "SkillEquityClaim"("userId");

-- CreateIndex
CREATE INDEX "SkillEquityClaim_enterpriseId_idx" ON "SkillEquityClaim"("enterpriseId");

-- CreateIndex
CREATE INDEX "SkillEquityClaim_credentialId_idx" ON "SkillEquityClaim"("credentialId");

-- CreateIndex
CREATE INDEX "SkillEquityClaim_reviewedById_idx" ON "SkillEquityClaim"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "IpfsEvidence_cid_key" ON "IpfsEvidence"("cid");

-- CreateIndex
CREATE INDEX "IpfsEvidence_milestoneId_idx" ON "IpfsEvidence"("milestoneId");

-- CreateIndex
CREATE INDEX "IpfsEvidence_enterpriseId_idx" ON "IpfsEvidence"("enterpriseId");

-- CreateIndex
CREATE INDEX "IpfsEvidence_uploadedById_idx" ON "IpfsEvidence"("uploadedById");

-- CreateIndex
CREATE INDEX "SurvivalDrill_enterpriseId_idx" ON "SurvivalDrill"("enterpriseId");

-- CreateIndex
CREATE UNIQUE INDEX "DiasporaProfile_userId_key" ON "DiasporaProfile"("userId");

-- CreateIndex
CREATE INDEX "DiasporaProfile_userId_idx" ON "DiasporaProfile"("userId");

-- CreateIndex
CREATE INDEX "IrQuestion_enterpriseId_idx" ON "IrQuestion"("enterpriseId");

-- CreateIndex
CREATE INDEX "IrQuestion_userId_idx" ON "IrQuestion"("userId");

-- CreateIndex
CREATE INDEX "QuarterlyReport_enterpriseId_year_idx" ON "QuarterlyReport"("enterpriseId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterlyReport_enterpriseId_quarter_year_key" ON "QuarterlyReport"("enterpriseId", "quarter", "year");

-- CreateIndex
CREATE INDEX "Vendor_enterpriseId_idx" ON "Vendor"("enterpriseId");

-- CreateIndex
CREATE UNIQUE INDEX "WhistleblowerReport_trackingCode_key" ON "WhistleblowerReport"("trackingCode");

-- CreateIndex
CREATE INDEX "WhistleblowerReport_enterpriseId_idx" ON "WhistleblowerReport"("enterpriseId");

-- CreateIndex
CREATE INDEX "AppealCase_filedById_idx" ON "AppealCase"("filedById");

-- CreateIndex
CREATE INDEX "AppealCase_enterpriseId_idx" ON "AppealCase"("enterpriseId");

-- CreateIndex
CREATE INDEX "RiskDisclosure_userId_idx" ON "RiskDisclosure"("userId");

-- CreateIndex
CREATE INDEX "RiskDisclosure_enterpriseId_idx" ON "RiskDisclosure"("enterpriseId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_key_key" ON "IdempotencyRecord"("key");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_userId_idx" ON "IdempotencyRecord"("userId");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_createdAt_idx" ON "IdempotencyRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreDecision_decisionToken_key" ON "CreDecision"("decisionToken");

-- CreateIndex
CREATE INDEX "CreDecision_actorId_idx" ON "CreDecision"("actorId");

-- CreateIndex
CREATE INDEX "CreDecision_enterpriseId_idx" ON "CreDecision"("enterpriseId");

-- CreateIndex
CREATE INDEX "CreDecision_policy_idx" ON "CreDecision"("policy");

-- CreateIndex
CREATE INDEX "EnterpriseUpdate_enterpriseId_createdAt_idx" ON "EnterpriseUpdate"("enterpriseId", "createdAt");

-- CreateIndex
CREATE INDEX "EnterpriseUpdate_authorId_idx" ON "EnterpriseUpdate"("authorId");

-- CreateIndex
CREATE INDEX "PartnerEngagement_enterpriseId_idx" ON "PartnerEngagement"("enterpriseId");

-- CreateIndex
CREATE INDEX "PartnerEngagement_userId_idx" ON "PartnerEngagement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerEngagement_enterpriseId_userId_key" ON "PartnerEngagement"("enterpriseId", "userId");

-- CreateIndex
CREATE INDEX "AnnualReport_enterpriseId_idx" ON "AnnualReport"("enterpriseId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualReport_enterpriseId_year_key" ON "AnnualReport"("enterpriseId", "year");

-- CreateIndex
CREATE INDEX "EnterpriseDocument_enterpriseId_idx" ON "EnterpriseDocument"("enterpriseId");

-- CreateIndex
CREATE INDEX "EnterpriseDocument_documentType_idx" ON "EnterpriseDocument"("documentType");

-- CreateIndex
CREATE INDEX "TermsAcceptance_userId_idx" ON "TermsAcceptance"("userId");

-- CreateIndex
CREATE INDEX "TermsAcceptance_documentType_documentVersion_idx" ON "TermsAcceptance"("documentType", "documentVersion");

-- CreateIndex
CREATE INDEX "Trade_enterpriseId_idx" ON "Trade"("enterpriseId");

-- CreateIndex
CREATE INDEX "Trade_buyOrderId_idx" ON "Trade"("buyOrderId");

-- CreateIndex
CREATE INDEX "Trade_sellOrderId_idx" ON "Trade"("sellOrderId");

-- CreateIndex
CREATE INDEX "Trade_buyerId_idx" ON "Trade"("buyerId");

-- CreateIndex
CREATE INDEX "Trade_sellerId_idx" ON "Trade"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceVault_enterpriseId_key" ON "InsuranceVault"("enterpriseId");

-- CreateIndex
CREATE INDEX "VaultLoan_enterpriseId_idx" ON "VaultLoan"("enterpriseId");

-- CreateIndex
CREATE INDEX "VaultLoan_status_idx" ON "VaultLoan"("status");

-- CreateIndex
CREATE INDEX "SolvencyAssertion_enterpriseId_idx" ON "SolvencyAssertion"("enterpriseId");

-- CreateIndex
CREATE INDEX "SolvencyAssertion_healthLevel_idx" ON "SolvencyAssertion"("healthLevel");

-- CreateIndex
CREATE INDEX "GovApiVerification_verificationType_status_idx" ON "GovApiVerification"("verificationType", "status");

-- CreateIndex
CREATE INDEX "GovApiVerification_enterpriseId_idx" ON "GovApiVerification"("enterpriseId");

-- CreateIndex
CREATE INDEX "GovApiVerification_userId_idx" ON "GovApiVerification"("userId");

-- CreateIndex
CREATE INDEX "VotingProxy_enterpriseId_idx" ON "VotingProxy"("enterpriseId");

-- CreateIndex
CREATE INDEX "VotingProxy_delegatorId_idx" ON "VotingProxy"("delegatorId");

-- CreateIndex
CREATE INDEX "VotingProxy_delegateeId_idx" ON "VotingProxy"("delegateeId");

-- CreateIndex
CREATE INDEX "SuccessionDeclaration_userId_idx" ON "SuccessionDeclaration"("userId");

-- CreateIndex
CREATE INDEX "SuccessionDeclaration_status_idx" ON "SuccessionDeclaration"("status");

-- CreateIndex
CREATE INDEX "EconomicBeneficiary_successionDeclarationId_idx" ON "EconomicBeneficiary"("successionDeclarationId");

-- CreateIndex
CREATE UNIQUE INDEX "LawFirmWebhookEvent_reference_key" ON "LawFirmWebhookEvent"("reference");

-- CreateIndex
CREATE INDEX "LawFirmWebhookEvent_lawFirmId_idx" ON "LawFirmWebhookEvent"("lawFirmId");

-- CreateIndex
CREATE INDEX "LawFirmWebhookEvent_enterpriseId_idx" ON "LawFirmWebhookEvent"("enterpriseId");

-- CreateIndex
CREATE INDEX "LawFirmWebhookEvent_eventType_idx" ON "LawFirmWebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "CircuitBreakerHalt_enterpriseId_idx" ON "CircuitBreakerHalt"("enterpriseId");

-- CreateIndex
CREATE INDEX "CircuitBreakerHalt_isActive_idx" ON "CircuitBreakerHalt"("isActive");

-- CreateIndex
CREATE INDEX "FxRate_fromCurrency_toCurrency_fetchedAt_idx" ON "FxRate"("fromCurrency", "toCurrency", "fetchedAt");

-- CreateIndex
CREATE INDEX "FxRate_source_idx" ON "FxRate"("source");

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveryProfile_userId_key" ON "DiscoveryProfile"("userId");

-- CreateIndex
CREATE INDEX "DiscoveryProfile_riskAppetite_idx" ON "DiscoveryProfile"("riskAppetite");

-- CreateIndex
CREATE INDEX "DiscoveryMatch_userId_idx" ON "DiscoveryMatch"("userId");

-- CreateIndex
CREATE INDEX "DiscoveryMatch_enterpriseId_idx" ON "DiscoveryMatch"("enterpriseId");

-- CreateIndex
CREATE INDEX "ProfitShareAgreement_enterpriseId_idx" ON "ProfitShareAgreement"("enterpriseId");

-- CreateIndex
CREATE INDEX "ProfitShareAgreement_partnerId_idx" ON "ProfitShareAgreement"("partnerId");

-- CreateIndex
CREATE INDEX "ProfitShareAgreement_status_idx" ON "ProfitShareAgreement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GaasOrganization_slug_key" ON "GaasOrganization"("slug");

-- CreateIndex
CREATE INDEX "GaasOrganization_slug_idx" ON "GaasOrganization"("slug");

-- CreateIndex
CREATE INDEX "GaasPolicy_organizationId_idx" ON "GaasPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "GaasDecision_organizationId_idx" ON "GaasDecision"("organizationId");

-- CreateIndex
CREATE INDEX "GaasDecision_policyId_idx" ON "GaasDecision"("policyId");

-- CreateIndex
CREATE INDEX "GaasDecision_verdict_idx" ON "GaasDecision"("verdict");

-- CreateIndex
CREATE INDEX "StandaloneSuccessionCase_declarantId_idx" ON "StandaloneSuccessionCase"("declarantId");

-- CreateIndex
CREATE INDEX "StandaloneSuccessionCase_status_idx" ON "StandaloneSuccessionCase"("status");

-- CreateIndex
CREATE INDEX "DiasporaCorridorRound_enterpriseId_idx" ON "DiasporaCorridorRound"("enterpriseId");

-- CreateIndex
CREATE INDEX "DiasporaCorridorRound_status_idx" ON "DiasporaCorridorRound"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AreiSnapshot_date_key" ON "AreiSnapshot"("date");

-- CreateIndex
CREATE INDEX "ConstitutionalEndorsement_endorserId_idx" ON "ConstitutionalEndorsement"("endorserId");

-- CreateIndex
CREATE INDEX "ConstitutionalEndorsement_enterpriseId_idx" ON "ConstitutionalEndorsement"("enterpriseId");

-- CreateIndex
CREATE INDEX "ConstitutionalEndorsement_active_idx" ON "ConstitutionalEndorsement"("active");

-- CreateIndex
CREATE UNIQUE INDEX "EnterpriseGenome_enterpriseId_key" ON "EnterpriseGenome"("enterpriseId");

-- CreateIndex
CREATE INDEX "EnterpriseGenome_graduationProbability_idx" ON "EnterpriseGenome"("graduationProbability");

-- CreateIndex
CREATE INDEX "QuadraticVoteAllocation_proposalId_idx" ON "QuadraticVoteAllocation"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "QuadraticVoteAllocation_proposalId_voterId_key" ON "QuadraticVoteAllocation"("proposalId", "voterId");

-- CreateIndex
CREATE UNIQUE INDEX "ZeitgeistSnapshot_date_key" ON "ZeitgeistSnapshot"("date");

-- CreateIndex
CREATE INDEX "PriorityWindowAllocation_enterpriseId_windowPhase_idx" ON "PriorityWindowAllocation"("enterpriseId", "windowPhase");

-- CreateIndex
CREATE UNIQUE INDEX "PriorityWindowAllocation_enterpriseId_windowPhase_userId_key" ON "PriorityWindowAllocation"("enterpriseId", "windowPhase", "userId");

-- CreateIndex
CREATE INDEX "OracleQuery_apiKeyHash_idx" ON "OracleQuery"("apiKeyHash");

-- CreateIndex
CREATE INDEX "OracleQuery_createdAt_idx" ON "OracleQuery"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SoulboundCredential_userId_key" ON "SoulboundCredential"("userId");

-- CreateIndex
CREATE INDEX "SoulboundCredential_credentialType_idx" ON "SoulboundCredential"("credentialType");

-- CreateIndex
CREATE INDEX "SoulboundCredential_isRevoked_idx" ON "SoulboundCredential"("isRevoked");

-- CreateIndex
CREATE INDEX "RiskProfileQuery_enterpriseId_idx" ON "RiskProfileQuery"("enterpriseId");

-- CreateIndex
CREATE INDEX "RiskProfileQuery_requesterOrg_idx" ON "RiskProfileQuery"("requesterOrg");

-- CreateIndex
CREATE UNIQUE INDEX "PasskeyCredential_credentialId_key" ON "PasskeyCredential"("credentialId");

-- CreateIndex
CREATE INDEX "PasskeyCredential_userId_idx" ON "PasskeyCredential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountLockout_email_key" ON "AccountLockout"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitEntry_key_key" ON "RateLimitEntry"("key");

-- CreateIndex
CREATE INDEX "RateLimitEntry_windowStart_idx" ON "RateLimitEntry"("windowStart");

-- CreateIndex
CREATE INDEX "TakafulClaim_enterpriseId_idx" ON "TakafulClaim"("enterpriseId");

-- CreateIndex
CREATE INDEX "TakafulClaim_status_idx" ON "TakafulClaim"("status");

-- CreateIndex
CREATE INDEX "MilestoneAdvance_enterpriseId_idx" ON "MilestoneAdvance"("enterpriseId");

-- CreateIndex
CREATE INDEX "MilestoneAdvance_partnerId_idx" ON "MilestoneAdvance"("partnerId");

-- CreateIndex
CREATE INDEX "MilestoneAdvance_status_idx" ON "MilestoneAdvance"("status");

-- CreateIndex
CREATE INDEX "CooperativeTransaction_buyerEnterpriseId_idx" ON "CooperativeTransaction"("buyerEnterpriseId");

-- CreateIndex
CREATE INDEX "CooperativeTransaction_sellerEnterpriseId_idx" ON "CooperativeTransaction"("sellerEnterpriseId");

-- CreateIndex
CREATE INDEX "CooperativeTransaction_status_idx" ON "CooperativeTransaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationBond_enterpriseId_key" ON "GraduationBond"("enterpriseId");

-- CreateIndex
CREATE INDEX "GraduationBond_enterpriseId_idx" ON "GraduationBond"("enterpriseId");

-- CreateIndex
CREATE INDEX "ProductiveEgpSnapshot_enterpriseId_idx" ON "ProductiveEgpSnapshot"("enterpriseId");

-- CreateIndex
CREATE INDEX "ProductiveEgpSnapshot_snapshotDate_idx" ON "ProductiveEgpSnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "ConstitutionalWageBand_enterpriseId_idx" ON "ConstitutionalWageBand"("enterpriseId");

-- CreateIndex
CREATE INDEX "ConstitutionalWageBand_role_idx" ON "ConstitutionalWageBand"("role");

-- CreateIndex
CREATE INDEX "ConstitutionalWageBand_tier_idx" ON "ConstitutionalWageBand"("tier");

-- CreateIndex
CREATE INDEX "TradeMatch_enterpriseId_idx" ON "TradeMatch"("enterpriseId");

-- CreateIndex
CREATE INDEX "TradeMatch_matchedAt_idx" ON "TradeMatch"("matchedAt");

-- CreateIndex
CREATE INDEX "DividendDistribution_enterpriseId_idx" ON "DividendDistribution"("enterpriseId");

-- CreateIndex
CREATE INDEX "DividendDistribution_status_idx" ON "DividendDistribution"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ErpProject_code_key" ON "ErpProject"("code");

-- CreateIndex
CREATE INDEX "ErpProject_enterpriseId_idx" ON "ErpProject"("enterpriseId");

-- CreateIndex
CREATE INDEX "ErpProject_status_idx" ON "ErpProject"("status");

-- CreateIndex
CREATE INDEX "ErpProject_managerId_idx" ON "ErpProject"("managerId");

-- CreateIndex
CREATE INDEX "ErpTask_projectId_idx" ON "ErpTask"("projectId");

-- CreateIndex
CREATE INDEX "ErpTask_assigneeId_idx" ON "ErpTask"("assigneeId");

-- CreateIndex
CREATE INDEX "ErpTask_status_idx" ON "ErpTask"("status");

-- CreateIndex
CREATE INDEX "ErpTask_parentId_idx" ON "ErpTask"("parentId");

-- CreateIndex
CREATE INDEX "ErpResource_enterpriseId_idx" ON "ErpResource"("enterpriseId");

-- CreateIndex
CREATE INDEX "ErpResource_type_idx" ON "ErpResource"("type");

-- CreateIndex
CREATE INDEX "ErpResource_status_idx" ON "ErpResource"("status");

-- CreateIndex
CREATE INDEX "ErpAllocation_resourceId_idx" ON "ErpAllocation"("resourceId");

-- CreateIndex
CREATE INDEX "ErpAllocation_projectId_idx" ON "ErpAllocation"("projectId");

-- CreateIndex
CREATE INDEX "ErpAllocation_enterpriseId_idx" ON "ErpAllocation"("enterpriseId");

-- CreateIndex
CREATE INDEX "ErpTimesheet_enterpriseId_idx" ON "ErpTimesheet"("enterpriseId");

-- CreateIndex
CREATE INDEX "ErpTimesheet_userId_idx" ON "ErpTimesheet"("userId");

-- CreateIndex
CREATE INDEX "ErpTimesheet_projectId_idx" ON "ErpTimesheet"("projectId");

-- CreateIndex
CREATE INDEX "ErpTimesheet_date_idx" ON "ErpTimesheet"("date");

-- CreateIndex
CREATE INDEX "ErpTimesheet_status_idx" ON "ErpTimesheet"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ErpInventory_sku_key" ON "ErpInventory"("sku");

-- CreateIndex
CREATE INDEX "ErpInventory_enterpriseId_idx" ON "ErpInventory"("enterpriseId");

-- CreateIndex
CREATE INDEX "ErpInventory_sku_idx" ON "ErpInventory"("sku");

-- CreateIndex
CREATE INDEX "ErpInventory_category_idx" ON "ErpInventory"("category");

-- CreateIndex
CREATE INDEX "ErpInventoryMovement_inventoryId_idx" ON "ErpInventoryMovement"("inventoryId");

-- CreateIndex
CREATE INDEX "ErpInventoryMovement_enterpriseId_idx" ON "ErpInventoryMovement"("enterpriseId");

-- CreateIndex
CREATE INDEX "ErpInventoryMovement_type_idx" ON "ErpInventoryMovement"("type");

-- CreateIndex
CREATE INDEX "ErpInventoryMovement_createdAt_idx" ON "ErpInventoryMovement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ErpPurchaseOrder_poNumber_key" ON "ErpPurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "ErpPurchaseOrder_enterpriseId_idx" ON "ErpPurchaseOrder"("enterpriseId");

-- CreateIndex
CREATE INDEX "ErpPurchaseOrder_status_idx" ON "ErpPurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "ErpPurchaseOrder_vendorId_idx" ON "ErpPurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "ErpPurchaseOrder_projectId_idx" ON "ErpPurchaseOrder"("projectId");

-- CreateIndex
CREATE INDEX "ErpPurchaseOrderLine_purchaseOrderId_idx" ON "ErpPurchaseOrderLine"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "ErpPurchaseOrderLine_inventoryId_idx" ON "ErpPurchaseOrderLine"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ErpAsset_assetCode_key" ON "ErpAsset"("assetCode");

-- CreateIndex
CREATE INDEX "ErpAsset_enterpriseId_idx" ON "ErpAsset"("enterpriseId");

-- CreateIndex
CREATE INDEX "ErpAsset_category_idx" ON "ErpAsset"("category");

-- CreateIndex
CREATE INDEX "ErpAsset_status_idx" ON "ErpAsset"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ErpProductionOrder_orderNumber_key" ON "ErpProductionOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "ErpProductionOrder_enterpriseId_idx" ON "ErpProductionOrder"("enterpriseId");

-- CreateIndex
CREATE INDEX "ErpProductionOrder_status_idx" ON "ErpProductionOrder"("status");

-- CreateIndex
CREATE INDEX "ErpProductionOrder_projectId_idx" ON "ErpProductionOrder"("projectId");

-- CreateIndex
CREATE INDEX "ErpBom_productionOrderId_idx" ON "ErpBom"("productionOrderId");

-- CreateIndex
CREATE INDEX "ErpBom_inventoryId_idx" ON "ErpBom"("inventoryId");

-- CreateIndex
CREATE INDEX "ErpQualityCheck_enterpriseId_idx" ON "ErpQualityCheck"("enterpriseId");

-- CreateIndex
CREATE INDEX "ErpQualityCheck_status_idx" ON "ErpQualityCheck"("status");

-- CreateIndex
CREATE INDEX "ErpQualityCheck_checkType_idx" ON "ErpQualityCheck"("checkType");

-- CreateIndex
CREATE INDEX "ErpIntegration_enterpriseId_idx" ON "ErpIntegration"("enterpriseId");

-- CreateIndex
CREATE INDEX "ErpIntegration_provider_idx" ON "ErpIntegration"("provider");

-- CreateIndex
CREATE INDEX "ErpIntegration_status_idx" ON "ErpIntegration"("status");

-- CreateIndex
CREATE INDEX "ErpSyncLog_integrationId_idx" ON "ErpSyncLog"("integrationId");

-- CreateIndex
CREATE INDEX "ErpSyncLog_enterpriseId_idx" ON "ErpSyncLog"("enterpriseId");

-- CreateIndex
CREATE INDEX "ErpSyncLog_status_idx" ON "ErpSyncLog"("status");

-- CreateIndex
CREATE INDEX "ErpSyncLog_startedAt_idx" ON "ErpSyncLog"("startedAt");

