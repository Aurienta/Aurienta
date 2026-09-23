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
    "avgPriceEgp" REAL NOT NULL,
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
    "priceEgp" REAL NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'phase_3',
    "status" TEXT NOT NULL DEFAULT 'open',
    "filledShares" INTEGER NOT NULL DEFAULT 0,
    "feesEgp" REAL NOT NULL DEFAULT 0,
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
    "sharePriceEgp" REAL NOT NULL,
    "cppEgp" REAL NOT NULL,
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
    "fxLockedRate" REAL,
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
    "priceEgp" REAL NOT NULL,
    "grossEgp" REAL NOT NULL,
    "platformFeeEgp" REAL NOT NULL,
    "cgtEgp" REAL NOT NULL,
    "totalEgp" REAL NOT NULL,
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
    "totalContributedEgp" REAL NOT NULL DEFAULT 0,
    "currentBalanceEgp" REAL NOT NULL DEFAULT 0,
    "totalLoanedEgp" REAL NOT NULL DEFAULT 0,
    "totalRepaidEgp" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InsuranceVault_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VaultLoan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "amountEgp" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "boardVotePct" REAL NOT NULL,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "repaidEgp" REAL NOT NULL DEFAULT 0,
    "repaymentDueAt" DATETIME,
    CONSTRAINT "VaultLoan_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SolvencyAssertion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "lawFirmBalanceEgp" REAL NOT NULL,
    "internalBalanceEgp" REAL NOT NULL,
    "varianceEgp" REAL NOT NULL,
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

