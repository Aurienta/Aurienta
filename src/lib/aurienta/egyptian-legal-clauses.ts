// AURIENTA Egyptian Law Legal Clauses
// ═══════════════════════════════════════════════════════════════
// Egypt-specific legal clauses covering every regulated activity on
// the platform. Each clause cites the exact Egyptian law number + year.
//
// These clauses are embedded into:
//   - Registration flow (must accept before account creation)
//   - Capital Partner activation (before any investment)
//   - Workforce Partner activation (before employment records)
//   - Founder/Enterprise formation (before enterprise creation)
//   - Graduation flow (before JSC conversion)
//   - Dividend distribution (before payout)
//
// All clauses enforce Egyptian mandatory law — they CANNOT be overridden
// by the CRE or any platform rule.
// ═══════════════════════════════════════════════════════════════

export interface EgyptianLegalClause {
  clauseId: string;
  title: string;
  category:
    | "registration"
    | "capital_partner"
    | "workforce"
    | "founder"
    | "graduation"
    | "dividend"
    | "data_protection"
    | "aml"
    | "tax"
    | "consumer_protection";
  legalBasis: string; // e.g. "Law 159/1981 Art. 4"
  text: string;
  mustAccept: boolean; // true = blocking (cannot proceed without accepting)
}

// ═══════════════════════════════════════════════════════════════
// REGISTRATION CLAUSES (accepted at account creation)
// ═══════════════════════════════════════════════════════════════

export const REGISTRATION_IDENTITY_VERIFICATION: EgyptianLegalClause = {
  clauseId: "EG-REG-001",
  title: "Identity Verification Consent",
  category: "registration",
  legalBasis: "Law 143/1994 (Civil Registry) + Law 151/2020 (PDPL) Art. 7",
  mustAccept: true,
  text: `I confirm that the national ID number (last 4 digits) and mobile number I provided are my own, registered under my legal name with the Egyptian Civil Registry (Law 143/1994). I consent to AURIENTA verifying my identity against government databases (NOSI, ETA, GAFI) where applicable, and to the processing of my personal data in accordance with the Personal Data Protection Law No. 151 of 2020. I understand that providing false identity information is a criminal offense under the Egyptian Penal Code (Art. 211).`,
};

export const REGISTRATION_ED25519_ANCHOR: EgyptianLegalClause = {
  clauseId: "EG-REG-002",
  title: "Ed25519 Identity Anchor Acceptance",
  category: "registration",
  legalBasis: "Law 15/2004 (E-Signature Law) Art. 14 + Law 151/2020 Art. 4",
  mustAccept: true,
  text: `I acknowledge that AURIENTA generates an Ed25519 cryptographic key pair on my behalf. The public key (Identity Anchor) is stored on the platform and used to verify my signatures on governance votes, investment instructions, and legal documents. The private key is encrypted with my password-derived key and stored server-side. I understand this constitutes a simple electronic signature under Law 15/2004 Art. 14, not a qualified electronic signature. Where Egyptian law requires a qualified e-signature (e.g. real estate transfers, government filings), I must use a separate qualified-signature workflow.`,
};

export const REGISTRATION_AML_KYC: EgyptianLegalClause = {
  clauseId: "EG-REG-003",
  title: "Anti-Money Laundering (AML) & KYC Consent",
  category: "aml",
  legalBasis: "Law 80/2002 (AML) as amended by Law 78/2023 + CBE Instructions 2024",
  mustAccept: true,
  text: `I consent to AURIENTA conducting Know Your Customer (KYC) and Customer Due Diligence (CDD) checks as required by Law 80/2002 (as amended by Law 78/2023) and the Central Bank of Egypt's AML/CFT Instructions. I understand that: (a) my transactions may be monitored for suspicious activity; (b) suspicious transactions will be reported to the Egyptian Money Laundering Combating Unit (EMLCU); (c) I may be required to provide source-of-funds documentation for transactions exceeding EGP 100,000; and (d) providing false information or engaging in money laundering is punishable by imprisonment under Law 80/2002 Art. 2.`,
};

// ═══════════════════════════════════════════════════════════════
// CAPITAL PARTNER CLAUSES (accepted before any investment)
// ═══════════════════════════════════════════════════════════════

export const CAPITAL_PARTNER_NOT_SECURITIES_OFFERING: EgyptianLegalClause = {
  clauseId: "EG-CP-001",
  title: "Not a Public Securities Offering",
  category: "capital_partner",
  legalBasis: "Capital Market Law 95/1992 + FRA Decree 107/2024 (Crowdfunding)",
  mustAccept: true,
  text: `I acknowledge that the Equity Units offered on AURIENTA for Tiers A–E (LLCs and SPVs) are ownership interests in private enterprises under Companies Law 159/1981, NOT publicly traded securities. They are not offered pursuant to a public offering license from the Financial Regulatory Authority (FRA). I understand that: (a) these Equity Units are not freely transferable; (b) secondary transfers are restricted by the enterprise's constitutional rules and applicable law; (c) Tier F (Joint Stock Company) Equity Units may constitute securities under Capital Market Law 95/1992 and any public offering requires prior FRA authorization; and (d) participating as a Capital Partner does not constitute investment advice from AURIENTA.`,
};

export const CAPITAL_PARTNER_RISK_DISCLOSURE: EgyptianLegalClause = {
  clauseId: "EG-CP-002",
  title: "Investment Risk Disclosure",
  category: "capital_partner",
  legalBasis: "Consumer Protection Law 67/2006 Art. 12 + FRA Regulations on Disclosure",
  mustAccept: true,
  text: `I acknowledge that investing in enterprises carries substantial risk, including the potential loss of my entire investment. I understand that: (a) AURIENTA's Fundamental Pricing is an internal constitutional mechanism, not a market valuation; (b) there is no guarantee of liquidity, resale value, or profit; (c) early-stage enterprises have a high failure rate; (d) past performance does not indicate future results; and (e) I should not invest more than I can afford to lose. I confirm I have sufficient financial knowledge to evaluate these risks, or I have consulted a licensed financial advisor. This disclosure is provided in accordance with Consumer Protection Law 67/2006 Art. 12.`,
};

export const CAPITAL_PARTNER_ZERO_CUSTODY: EgyptianLegalClause = {
  clauseId: "EG-CP-003",
  title: "Zero Custody — Law Firm Escrow Acknowledgment",
  category: "capital_partner",
  legalBasis: "Law 17/1983 (Lawyers' Code) Art. 47 + Law 194/2020 (Banking)",
  mustAccept: true,
  text: `I acknowledge that AURIENTA operates on a Zero Custody principle. When I commit capital to an enterprise, my funds are transferred directly to a licensed law firm's client account (escrow) maintained at a CBE-regulated bank, NOT to AURIENTA. The law firm acts as fiduciary custodian under Law 17/1983 Art. 47. AURIENTA is a software provider under Law 194/2020 and Law 5/2022, NOT a Payment Service Provider. I understand that fund releases require dual-signature authorization (CRE key + Law Firm HSM key) and that the law firm has a unilateral kill-switch right.`,
};

// ═══════════════════════════════════════════════════════════════
// WORKFORCE PARTNER CLAUSES (accepted before employment records)
// ═══════════════════════════════════════════════════════════════

export const WORKFORCE_NOSI_COMPLIANCE: EgyptianLegalClause = {
  clauseId: "EG-WF-001",
  title: "NOSI Registration Compliance",
  category: "workforce",
  legalBasis: "Social Insurance Law 135/2010 + Law 148/2019 (Comprehensive Health Insurance)",
  mustAccept: true,
  text: `I acknowledge that enterprises employing personnel in Egypt must register with the National Organization for Social Insurance (NOSI) under Social Insurance Law 135/2010. I understand that: (a) the enterprise (not AURIENTA) is responsible for NOSI registration, monthly contributions, and compliance; (b) AURIENTA's NOSI status indicators are workflow aids, not legal compliance certifications; (c) failure to register or pay contributions is a criminal offense under Law 135/2010 Art. 83; and (d) the enterprise must also comply with the Comprehensive Health Insurance Law 148/2019 where applicable.`,
};

export const WORKFORCE_LABOUR_LAW: EgyptianLegalClause = {
  clauseId: "EG-WF-002",
  title: "Labour Law Compliance",
  category: "workforce",
  legalBasis: "Labour Law 12/2003 + Ministerial Decrees on Minimum Wage",
  mustAccept: true,
  text: `I acknowledge that employment relationships on AURIENTA are subject to Egyptian Labour Law 12/2003. The enterprise (not AURIENTA) is responsible for: (a) written employment contracts in Arabic (Law 12/2003 Art. 32); (b) compliance with minimum wage decrees (currently EGP 6,000/month as of 2024); (c) maximum working hours (8 hours/day, 48 hours/week — Art. 146); (d) annual leave (21 days, 30 days after 10 years of service — Art. 47); (e) end-of-service gratuity calculation (Art. 122); and (f) occupational safety and health standards. AURIENTA's workforce modules are administrative tools, not a substitute for legal compliance.`,
};

// ═══════════════════════════════════════════════════════════════
// FOUNDER / ENTERPRISE FORMATION CLAUSES
// ═══════════════════════════════════════════════════════════════

export const FOUNDER_GAFI_REGISTRATION: EgyptianLegalClause = {
  clauseId: "EG-FO-001",
  title: "GAFI Enterprise Registration",
  category: "founder",
  legalBasis: "Companies Law 159/1981 + Law 3/1998 (GAFI) + Investment Law 72/2017",
  mustAccept: true,
  text: `I acknowledge that formal enterprise formation in Egypt requires registration with the General Authority for Investment and Free Zones (GAFI) under Companies Law 159/1981 and Law 3/1998. AURIENTA's "Founding Studio" is a preparation tool — it does NOT constitute legal enterprise formation. I understand that: (a) the enterprise becomes a legal person only upon GAFI registration; (b) AURIENTA can prepare the constitutional documents but the founder must file with GAFI; (c) Investment Law 72/2017 may provide incentives for qualifying enterprises; and (d) the enterprise's legal form (LLC, JSC, SPV) determines its regulatory obligations.`,
};

export const FOUNDER_TAX_REGISTRATION: EgyptianLegalClause = {
  clauseId: "EG-FO-002",
  title: "Tax Registration Obligation",
  category: "tax",
  legalBasis: "Income Tax Law 91/2005 + VAT Law 67/2016 + Tax Procedures Law 91/2005",
  mustAccept: true,
  text: `I acknowledge that the enterprise must register with the Egyptian Tax Authority (ETA) for: (a) Corporate Income Tax under Law 91/2005 (22.5% rate); (b) Value Added Tax (VAT) under Law 67/2016 if annual revenue exceeds EGP 500,000; (c) Stamp Duty under Law 111/1980 where applicable; and (d) Salary Withholding Tax for employees. AURIENTA's tax modules are estimation tools — actual tax filings must be made by the enterprise or a licensed accountant. Tax evasion is punishable under Law 91/2005 Art. 138.`,
};

// ═══════════════════════════════════════════════════════════════
// GRADUATION CLAUSES (before JSC conversion)
// ═══════════════════════════════════════════════════════════════

export const GRADUATION_JSC_FRA: EgyptianLegalClause = {
  clauseId: "EG-GR-001",
  title: "FRA Authorization for Public Offering",
  category: "graduation",
  legalBasis: "Capital Market Law 95/1992 + FRA Board Decrees on Public Offerings",
  mustAccept: true,
  text: `I acknowledge that graduation to a Joint Stock Company (JSC) and any public offering of securities requires prior authorization from the Financial Regulatory Authority (FRA) under Capital Market Law 95/1992. I understand that: (a) a public offering requires filing a prospectus approved by the FRA; (b) the JSC must have minimum capital of EGP 250,000 (Companies Law 159/1981 Art. 68); (c) at least 25% of shares must be offered to the public for a listing; (d) the Egyptian Exchange (EGX) listing rules apply; and (e) AURIENTA does not facilitate public offerings without FRA authorization.`,
};

// ═══════════════════════════════════════════════════════════════
// DIVIDEND CLAUSES (before any payout)
// ═══════════════════════════════════════════════════════════════

export const DIVIDEND_TAX_WITHHOLDING: EgyptianLegalClause = {
  clauseId: "EG-DV-001",
  title: "Dividend Withholding Tax",
  category: "dividend",
  legalBasis: "Income Tax Law 91/2005 Art. 56 + CBE Instructions on Withholding",
  mustAccept: true,
  text: `I acknowledge that dividend distributions are subject to Egyptian withholding tax under Income Tax Law 91/2005 Art. 56. I understand that: (a) the withholding rate is 10% for resident individuals; (b) non-residents are subject to 20% withholding; (c) the enterprise (not AURIENTA) is responsible for withholding and remitting to the ETA within 30 days; (d) dividends must be declared by a valid general assembly resolution under Companies Law 159/1981 Art. 90; and (e) AURIENTA's dividend modules calculate gross amounts — tax withholding is the enterprise's legal obligation.`,
};

// ═══════════════════════════════════════════════════════════════
// DATA PROTECTION CLAUSES
// ═══════════════════════════════════════════════════════════════

export const PDPL_DATA_PROCESSING: EgyptianLegalClause = {
  clauseId: "EG-PDPL-001",
  title: "Personal Data Protection Consent",
  category: "data_protection",
  legalBasis: "Law 151/2020 (Personal Data Protection) Arts. 2, 7, 13, 17",
  mustAccept: true,
  text: `I consent to the processing of my personal data by AURIENTA in accordance with Law 151/2020 (Personal Data Protection Law). I understand that: (a) AURIENTA acts as a data controller for account data and a data processor for enterprise data; (b) my data may be transferred outside Egypt only if the recipient country provides adequate protection (Law 151/2020 Art. 17); (c) I have the right to access, rectify, and erase my data (Arts. 13–14); (d) sensitive data (national ID, biometrics) is encrypted at rest; and (e) data breaches will be notified to the Personal Data Protection Center within 72 hours (Art. 24).`,
};

export const PDPL_CROSS_BORDER_TRANSFER: EgyptianLegalClause = {
  clauseId: "EG-PDPL-002",
  title: "Cross-Border Data Transfer Acknowledgment",
  category: "data_protection",
  legalBasis: "Law 151/2020 Art. 17 + PDPA Implementing Decree",
  mustAccept: true,
  text: `I acknowledge that AURIENTA uses cloud infrastructure (Turso, hosted on AWS us-east-1) which may involve cross-border data transfer. This transfer is permitted under Law 151/2020 Art. 17 on the basis that: (a) I have given explicit consent; (b) the data is necessary for the performance of the platform services; (c) appropriate safeguards (encryption, access controls) are in place; and (d) the transfer is limited to the minimum data necessary for service operation. I understand I may withdraw this consent, which will result in account closure and data deletion within 30 days.`,
};

// ═══════════════════════════════════════════════════════════════
// CONSUMER PROTECTION
// ═══════════════════════════════════════════════════════════════

export const CONSUMER_PROTECTION_RIGHTS: EgyptianLegalClause = {
  clauseId: "EG-CP-003",
  title: "Consumer Protection Rights",
  category: "consumer_protection",
  legalBasis: "Law 67/2006 (Consumer Protection) + CPA Decrees",
  mustAccept: true,
  text: `I acknowledge my rights under Egyptian Consumer Protection Law 67/2006, including: (a) the right to clear and accurate information about services (Art. 3); (b) the right to cancel a subscription within 14 days of acceptance (Art. 12); (c) protection against unfair contract terms (Art. 6); (d) the right to file complaints with the Consumer Protection Agency (CPA); and (e) the right to seek judicial remedy for damages caused by AURIENTA's services. AURIENTA's services are provided "as is" with no guarantee of profit, liquidity, or enterprise success.`,
};

// ═══════════════════════════════════════════════════════════════
// ALL CLAUSES REGISTRY
// ═══════════════════════════════════════════════════════════════

export const ALL_EGYPTIAN_LEGAL_CLAUSES: EgyptianLegalClause[] = [
  REGISTRATION_IDENTITY_VERIFICATION,
  REGISTRATION_ED25519_ANCHOR,
  REGISTRATION_AML_KYC,
  CAPITAL_PARTNER_NOT_SECURITIES_OFFERING,
  CAPITAL_PARTNER_RISK_DISCLOSURE,
  CAPITAL_PARTNER_ZERO_CUSTODY,
  WORKFORCE_NOSI_COMPLIANCE,
  WORKFORCE_LABOUR_LAW,
  FOUNDER_GAFI_REGISTRATION,
  FOUNDER_TAX_REGISTRATION,
  GRADUATION_JSC_FRA,
  DIVIDEND_TAX_WITHHOLDING,
  PDPL_DATA_PROCESSING,
  PDPL_CROSS_BORDER_TRANSFER,
  CONSUMER_PROTECTION_RIGHTS,
];

/**
 * Get clauses required for a specific user action.
 * Returns only `mustAccept: true` clauses for the given categories.
 */
export function getClausesForAction(
  ...categories: EgyptianLegalClause["category"][]
): EgyptianLegalClause[] {
  return ALL_EGYPTIAN_LEGAL_CLAUSES.filter(
    (c) => c.mustAccept && categories.includes(c.category)
  );
}

/**
 * Get all clauses required at registration.
 */
export function getRegistrationClauses(): EgyptianLegalClause[] {
  return getClausesForAction("registration", "aml", "data_protection", "consumer_protection");
}

/**
 * Get all clauses required to activate the Capital Partner role.
 */
export function getCapitalPartnerClauses(): EgyptianLegalClause[] {
  return getClausesForAction("capital_partner");
}

/**
 * Get all clauses required to activate the Workforce Partner role.
 */
export function getWorkforcePartnerClauses(): EgyptianLegalClause[] {
  return getClausesForAction("workforce");
}

/**
 * Get all clauses required to create/found an enterprise.
 */
export function getFounderClauses(): EgyptianLegalClause[] {
  return getClausesForAction("founder", "tax");
}

/**
 * Get all clauses required for graduation (JSC conversion).
 */
export function getGraduationClauses(): EgyptianLegalClause[] {
  return getClausesForAction("graduation");
}

/**
 * Get all clauses required before dividend distribution.
 */
export function getDividendClauses(): EgyptianLegalClause[] {
  return getClausesForAction("dividend", "tax");
}
