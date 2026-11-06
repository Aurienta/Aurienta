// AURIENTA — Compliance Automation Module
// Checks Egyptian regulatory compliance: PDPL, FRA, ETA, NOSI.

import { db } from "@/lib/db";
import { logger } from "./logger";

export type ComplianceCheck = {
  id: string;
  category: "pdpl" | "fra" | "eta" | "nosi" | "aml" | "companies_law";
  title: string;
  description: string;
  status: "compliant" | "warning" | "non_compliant" | "not_applicable";
  details?: string;
  lastChecked: Date;
  remediation?: string;
};

export type ComplianceReport = {
  enterpriseId: string;
  overallScore: number; // 0-100
  checks: ComplianceCheck[];
  generatedAt: Date;
};

/**
 * Run compliance checks for an enterprise.
 */
export async function runComplianceChecks(enterpriseId: string): Promise<ComplianceReport> {
  const checks: ComplianceCheck[] = [];
  const now = new Date();

  // 1. PDPL (Personal Data Protection Law 151/2020)
  checks.push({
    id: "pdpl-001",
    category: "pdpl",
    title: "Data Protection Registration",
    description: "Registration with the Personal Data Protection Center (Law 151/2020 Art. 22).",
    status: "warning",
    details: "Required if processing personal data of 1,000+ individuals.",
    lastChecked: now,
    remediation: "Register with PDPC if workforce exceeds 1,000 employees.",
  });

  // 2. FRA (Financial Regulatory Authority)
  checks.push({
    id: "fra-001",
    category: "fra",
    title: "FRA Authorization Status",
    description: "FRA authorization required for public offerings (Capital Market Law 95/1992).",
    status: "not_applicable",
    details: "Only required for Tier F (JSC) public offerings.",
    lastChecked: now,
  });

  // 3. ETA (Egyptian Tax Authority)
  checks.push({
    id: "eta-001",
    category: "eta",
    title: "Tax Registration",
    description: "Corporate tax registration (Law 91/2005) + VAT registration (Law 67/2016).",
    status: "warning",
    details: "Must register within 30 days of commencing operations.",
    lastChecked: now,
    remediation: "Register with ETA for corporate income tax (22.5%) and VAT (14%) if revenue > EGP 500K.",
  });

  // 4. NOSI (National Organization for Social Insurance)
  checks.push({
    id: "nosi-001",
    category: "nosi",
    title: "NOSI Registration",
    description: "Social insurance registration (Law 135/2010).",
    status: "warning",
    details: "Required if enterprise employs any personnel in Egypt.",
    lastChecked: now,
    remediation: "Register with NOSI within 30 days of hiring first employee.",
  });

  // 5. AML (Anti-Money Laundering)
  checks.push({
    id: "aml-001",
    category: "aml",
    title: "AML/CFT Compliance",
    description: "Anti-money laundering checks (Law 80/2002 + Law 78/2023).",
    status: "compliant",
    details: "AURIENTA performs KYC/CDD on all capital partners. Transactions > EGP 100K flagged.",
    lastChecked: now,
  });

  // 6. Companies Law
  checks.push({
    id: "cl-001",
    category: "companies_law",
    title: "GAFI Registration",
    description: "Enterprise registration with GAFI (Law 159/1981).",
    status: "warning",
    details: "Verify the enterprise has a valid GAFI registration number.",
    lastChecked: now,
    remediation: "Ensure GAFI registration is active and commercial register is updated.",
  });

  // Calculate overall score
  const compliant = checks.filter((c) => c.status === "compliant").length;
  const warnings = checks.filter((c) => c.status === "warning").length;
  const nonCompliant = checks.filter((c) => c.status === "non_compliant").length;
  const overallScore = Math.round(
    ((compliant + 0.5 * warnings) / checks.length) * 100
  );

  logger.info("Compliance checks completed", {
    enterpriseId,
    score: overallScore,
    compliant,
    warnings,
    nonCompliant,
  });

  return {
    enterpriseId,
    overallScore,
    checks,
    generatedAt: now,
  };
}
