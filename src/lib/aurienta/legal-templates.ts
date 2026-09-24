// AURIENTA Legal Templates — Appendices N-EE (Vol 18)
// Full legal document templates for the constitutional enterprise infrastructure.
// Each template has variables ({{enterpriseName}}, {{founderName}}, etc.) that
// are rendered at generation time.

export interface LegalTemplate {
  id: string;
  appendix: string;
  title: string;
  jurisdiction: string;
  category: "constitutional" | "corporate" | "escrow" | "governance" | "dispute" | "succession" | "regulatory";
  content: string;
  variables: string[];
}

export const LEGAL_TEMPLATES: LegalTemplate[] = [
  {
    id: "tpl-constitutional-pledge",
    appendix: "N",
    title: "Constitutional Pledge",
    jurisdiction: "Egypt",
    category: "constitutional",
    content: `CONSTITUTIONAL PLEDGE — AURIENTA

I, {{founderName}}, hereby pledge to abide by the AURIENTA Constitutional Rules as the supreme governance framework for {{enterpriseName}}. I acknowledge that these rules cannot be bent, bypassed, or broken — they are enforced by the Constitutional Runtime Engine (CRE).

I commit to:
1. Zero Custody: All funds flow directly to licensed law firm client accounts. AURIENTA never holds partner funds.
2. AI-Enforced Governance: Critical decisions (valuation, salary, profit sharing) are made by AI following fixed constitutional rules.
3. Transparency: Every action is permanently recorded and auditable by me, the regulator, or any court.
4. Fairness: Fundamental pricing (±5% band), priority windows, and pro-rata rights apply to all partners equally.
5. Legal Compliance: GAFI registration, NOSI social insurance, and ETA tax filing are mandatory.

Pledger: {{founderName}}
National ID: {{nationalId}}
Enterprise: {{enterpriseName}}
Date: {{date}}

This pledge is cryptographically signed with my Ed25519 identity anchor and recorded on the immutable ownership ledger.`,
    variables: ["founderName", "nationalId", "enterpriseName", "date"],
  },
  {
    id: "tpl-shareholder-agreement",
    appendix: "O",
    title: "Shareholder Agreement",
    jurisdiction: "Egypt (Law 159/1981)",
    category: "corporate",
    content: `SHAREHOLDER AGREEMENT — {{enterpriseName}}

This Shareholder Agreement is entered into between {{founderName}} (the "Founder") and the partners of {{enterpriseName}} (the "Partners").

1. EQUITY STRUCTURE
   - Total Equity Units: {{totalEquityUnits}}
   - Founder Equity: {{founderEquityPct}}% (capped at 49% per Non-Amendable Rule I-1.3)
   - Partner Equity: {{partnerEquityPct}}%

2. VOTING RIGHTS
   - One Share, One Vote (Vol 7 §7.1)
   - Quorum: 50% + 1 share
   - AURIENTA veto categories: 6 (cap table manipulation, equity dilution, etc.)

3. TRANSFER RESTRICTIONS
   - 12-month lock-up on all Equity Units (Vol 9 §9.2)
   - ±5% price band on secondary market transfers
   - Priority windows: Phase 1 (48h pro-rata), Phase 2 (24h employees), Phase 3 (general)

4. PROFIT DISTRIBUTION
   - Dividends declared by shareholder vote (51% threshold)
   - 10% withholding tax at source (Vol 8 §8.5)
   - Law Firm Client Account disburses within 5 business days

5. GOVERNING LAW
   This agreement is governed by Egyptian law (Law 159/1981) and disputes are resolved per the 6-stage dispute resolution protocol.`,
    variables: ["enterpriseName", "founderName", "totalEquityUnits", "founderEquityPct", "partnerEquityPct"],
  },
  {
    id: "tpl-law-firm-escrow",
    appendix: "P",
    title: "Law Firm Escrow Agreement",
    jurisdiction: "Egypt",
    category: "escrow",
    content: `LAW FIRM ESCROW AGREEMENT

Between: {{lawFirmName}} (the "Escrow Agent")
And: {{enterpriseName}} (the "Enterprise")
And: AURIENTA (the "Platform")

1. ESCROW ACCOUNT
   The Escrow Agent maintains a segregated client account for the Enterprise. Funds are held in trust and are bankruptcy-remote.

2. FUND FLOW
   - Partner capital → Escrow Agent (directly, never via AURIENTA)
   - Milestone release → Escrow Agent → Enterprise (upon CRE approval)
   - Fee deduction → 5% platform + 2.5% consulting (from milestone release)

3. WEBHOOK INTEGRATION
   The Escrow Agent sends signed webhook events to AURIENTA for:
   - escrow_received (capital deposited)
   - escrow_released (milestone approved)
   - escrow_refunded (failed transfer)
   - balance_assertion (60-second balance assertions, Vol 5 §5.3)

4. SIGNATURE VERIFICATION
   All webhooks are Ed25519-signed. The Escrow Agent's public key is registered with AURIENTA.

5. INSURANCE
   The Escrow Agent maintains professional indemnity insurance of {{insuranceEgp}} EGP.`,
    variables: ["lawFirmName", "enterpriseName", "insuranceEgp"],
  },
  {
    id: "tpl-enterprise-formation",
    appendix: "Q",
    title: "Enterprise Formation Articles",
    jurisdiction: "Egypt (Law 159/1981)",
    category: "corporate",
    content: `ENTERPRISE FORMATION ARTICLES — {{enterpriseName}}

1. LEGAL FORM: Egyptian LLC (شركة ذات مسؤولية محدودة) under Companies Law 159/1981
2. FOUNDING CAPITAL: {{foundingCapitalEgp}} EGP
3. FOUNDER: {{founderName}} (National ID: {{nationalId}})
4. GAFI REGISTRATION: {{gafiCrNumber}}
5. TAX ID: {{taxId}}
6. TIER: {{tier}} (per AURIENTA Tier Classification)
7. MINIMUM INVESTMENT: {{minInvestmentEgp}} EGP (dynamic per Add-on 19)

The enterprise is bound by the AURIENTA Constitutional Rules and the CRE enforces all governance decisions.`,
    variables: ["enterpriseName", "foundingCapitalEgp", "founderName", "nationalId", "gafiCrNumber", "taxId", "tier", "minInvestmentEgp"],
  },
  {
    id: "tpl-manager-appointment",
    appendix: "R",
    title: "Manager Appointment Letter",
    jurisdiction: "Egypt (Art. 118, Law 159/1981)",
    category: "governance",
    content: `MANAGER APPOINTMENT LETTER

To: {{managerName}}

You are hereby appointed as Manager of {{enterpriseName}} effective {{effectiveDate}}.

TERMS:
1. Monthly Salary: {{monthlySalaryEgp}} EGP (per CRE salary constitutionality check)
2. NOSI Registration: Required within 7 days of appointment
3. Authority: Expenses <1% of capital (solo), 1-10% require dual signature with accounting firm
4. Removal: Per Art. 118 — 48h cooling, 72h voting, 50% shareholder threshold
5. Salary-to-Equity: Optional after 12 months (10% discount, 12-month vesting)

This appointment is recorded on the immutable ownership ledger and is enforceable by the CRE.`,
    variables: ["managerName", "enterpriseName", "effectiveDate", "monthlySalaryEgp"],
  },
  {
    id: "tpl-voting-proxy",
    appendix: "S",
    title: "Voting Proxy Form",
    jurisdiction: "Egypt",
    category: "governance",
    content: `VOTING PROXY FORM — {{enterpriseName}}

I, {{principalName}}, hereby appoint {{proxyName}} as my voting proxy for {{enterpriseName}}.

SCOPE:
- All shareholder votes for a period of {{durationDays}} days
- Effective from: {{effectiveDate}}
- Expiry: {{expiryDate}}

LIMITATIONS:
- Proxy cannot vote on manager removal (requires personal vote per Art. 118)
- Proxy cannot vote on cap table changes (Non-Amendable Rule I-1.3)
- Proxy must disclose any conflict of interest before voting

This proxy is cryptographically signed and recorded on the immutable ledger.`,
    variables: ["enterpriseName", "principalName", "proxyName", "durationDays", "effectiveDate", "expiryDate"],
  },
  {
    id: "tpl-succession-declaration",
    appendix: "T",
    title: "Succession Declaration Form",
    jurisdiction: "Egypt (Vol 16 §16.1)",
    category: "succession",
    content: `SUCCESSION DECLARATION — {{declarantName}}

I, {{declarantName}}, declare the following succession arrangements for my equity in {{enterpriseName}}:

1. PRIMARY BENEFICIARY: {{beneficiaryName}} (Relationship: {{relationship}})
   - Percentage: {{percentage}}%
   - National ID: {{beneficiaryNationalId}}

2. VOTING PROXY ACTIVATION:
   - Upon my death or incapacitation, my voting proxy activates for {{proxyDurationDays}} days
   - Emergency Manager: {{emergencyManagerName}} (appointed during transition)

3. CONDITIONS:
   - Shamir's Secret Sharing (2-of-3) protects the succession key
   - 90-day threshold for voting proxy activation
   - Economic beneficiaries receive equity per the stated percentages

This declaration is cryptographically signed and recorded on the immutable ledger. It can only be revoked by filing a new declaration that supersedes this one.`,
    variables: ["declarantName", "enterpriseName", "beneficiaryName", "relationship", "percentage", "beneficiaryNationalId", "proxyDurationDays", "emergencyManagerName"],
  },
  {
    id: "tpl-graduation-certificate",
    appendix: "U",
    title: "Graduation Certificate",
    jurisdiction: "Egypt",
    category: "constitutional",
    content: `GRADUATION CERTIFICATE — {{enterpriseName}}

This certifies that {{enterpriseName}} has successfully graduated from the AURIENTA Constitutional Launchpad.

GRADUATION CRITERIA MET:
1. Readiness Score: {{readinessScore}}/100 (threshold: 90)
2. Dependency Index: {{dependencyIndex}}/100 (threshold: <20)
3. Shareholder Vote: {{votePct}}% approved (threshold: 75%)
4. Stage 4 completed: {{stage4CompletedDate}}

DATA EXPORT:
- Export Package Hash: {{exportHash}}
- Export Date: {{exportDate}}
- Verified by: AURIENTA CRE

The enterprise is now a sovereign independent entity. AURIENTA's governance role transitions to alumni status. The enterprise retains access to the Alumni Hall and Oracle Mirror for continuity.

This certificate is non-revocable and recorded on the immutable ledger.`,
    variables: ["enterpriseName", "readinessScore", "dependencyIndex", "votePct", "stage4CompletedDate", "exportHash", "exportDate"],
  },
  {
    id: "tpl-dispute-resolution",
    appendix: "V",
    title: "Dispute Resolution Agreement",
    jurisdiction: "Egypt",
    category: "dispute",
    content: `DISPUTE RESOLUTION AGREEMENT — {{enterpriseName}}

All disputes between partners of {{enterpriseName}} are resolved through the 6-stage protocol:

STAGE 1: AI Mediation (72 hours)
- CRE issues a non-binding recommendation
- Both parties may accept or reject

STAGE 2: Board Review (7 days)
- 3-member panel reviews the AI recommendation
- Issues a binding ruling

STAGE 3: Shareholder Vote (14 days)
- 51% threshold to override the board ruling
- One share, one vote

STAGE 4: CRCICA Arbitration (90 days)
- Cairo Regional Centre for International Commercial Arbitration
- Binding arbitral award

STAGE 5: Enforcement
- Award is enforced by the CRE
- Law firm disburses funds per the award

STAGE 6: Closure
- Case recorded on the immutable ledger
- Precedent note added for future reference

Filing fee: {{filingFeeEgp}} EGP (non-refundable)`,
    variables: ["enterpriseName", "filingFeeEgp"],
  },
  {
    id: "tpl-crcica-arbitration",
    appendix: "W",
    title: "CRCICA Arbitration Clause",
    jurisdiction: "CRCICA Rules",
    category: "dispute",
    content: `CRCICA ARBITRATION CLAUSE

Any dispute, controversy, or claim arising out of or relating to this agreement, including the breach, termination, or validity thereof, shall be finally resolved by arbitration administered by the Cairo Regional Centre for International Commercial Arbitration (CRCICA) in accordance with its Rules of Arbitration.

1. NUMBER OF ARBITRATORS: 3 (three)
2. SEAT OF ARBITRATION: Cairo, Arab Republic of Egypt
3. LANGUAGE: Arabic (with English translation if required)
4. GOVERNING LAW: Egyptian law (Law 159/1981 + Law 27/1994 on Arbitration)
5. AWARD: Final and binding on all parties
6. ENFORCEMENT: Per the New York Convention 1958 (Egypt acceded 1959)

The arbitral award is enforceable through the CRE, which directs the law firm to disburse funds per the award terms.`,
    variables: [],
  },
  {
    id: "tpl-data-export-auth",
    appendix: "X",
    title: "Data Export Authorization",
    jurisdiction: "Egypt",
    category: "constitutional",
    content: `DATA EXPORT AUTHORIZATION — {{enterpriseName}}

I, {{authorizerName}}, authorize the export of all enterprise data for {{enterpriseName}} as part of the graduation protocol.

DATA SCOPE:
1. Ownership Ledger (all equity records + transfer history)
2. Trade History (all secondary market transactions)
3. Financial Reports (quarterly + annual)
4. CRE Decisions (all constitutional rulings)
5. Screening Events (AML + sanctions checks)
6. Audit Log (all recorded actions)

FORMAT: JSON + Avro (per Vol 18 Appendix)
HASH: SHA-256 content hash recorded on the immutable ledger
VERIFICATION: Independent verification tool provided

This export is non-revocable. The data package is cryptographically signed and timestamped.`,
    variables: ["enterpriseName", "authorizerName"],
  },
  {
    id: "tpl-whistleblower-notice",
    appendix: "Y",
    title: "Whistleblower Protection Notice",
    jurisdiction: "Egypt",
    category: "constitutional",
    content: `WHISTLEBLOWER PROTECTION NOTICE — {{enterpriseName}}

AURIENTA provides a secure, anonymous whistleblowing channel for all partners, employees, and stakeholders of {{enterpriseName}}.

PROTECTIONS:
1. ANONYMITY: Reports are encrypted and cannot be traced to the filer
2. RETALIATION PROHIBITED: Any retaliation against a whistleblower is a Non-Amendable Rule violation
3. BOUNTY: Confirmed fraud reports receive 5% of recovered funds (capped at {{bountyCapEgp}} EGP)
4. CRE ENFORCEMENT: Whistleblower protections are enforced by the CRE

REPORT CATEGORIES:
- Fraud (embezzlement, misappropriation)
- Constitutional violations (rule bypass attempts)
- AML/sanctions violations
- Conflict of interest (undisclosed)
- Manager misconduct

Reports are filed via the Whistleblower Dashboard and are routed to the Constitutional Council for review.`,
    variables: ["enterpriseName", "bountyCapEgp"],
  },
  {
    id: "tpl-related-party-disclosure",
    appendix: "Z",
    title: "Related Party Transaction Disclosure",
    jurisdiction: "Egypt (Vol 11 §11.1.4)",
    category: "governance",
    content: `RELATED PARTY TRANSACTION DISCLOSURE

Filed by: {{filerName}}
Enterprise: {{enterpriseName}}
Date: {{date}}

TRANSACTION DETAILS:
- Counterparty: {{counterpartyName}}
- Relationship: {{relationshipType}} (family / ownership / financial)
- Transaction Value: {{transactionValueEgp}} EGP
- Transaction Type: {{transactionType}}

DISCLOSURE:
I, {{filerName}}, disclose that I have a {{relationshipType}} relationship with the counterparty in this transaction. I acknowledge that:
1. The CRE has flagged this as a related-party transaction
2. I am recused from voting on this transaction
3. The transaction requires board approval (not just manager approval)
4. The transaction is recorded on the immutable ledger with the related-party flag

This disclosure is cryptographically signed and recorded.`,
    variables: ["filerName", "enterpriseName", "date", "counterpartyName", "relationshipType", "transactionValueEgp", "transactionType"],
  },
  {
    id: "tpl-anti-capture",
    appendix: "AA",
    title: "Anti-Capture Undertaking",
    jurisdiction: "Egypt (Non-Amendable Rule I-1.3)",
    category: "constitutional",
    content: `ANTI-CAPTURE UNDERTAKING — {{enterpriseName}}

I, {{signatoryName}}, undertake that no single shareholder (including myself) shall acquire more than 49% of the equity of {{enterpriseName}}.

This undertaking enforces Non-Amendable Rule I-1.3 (Anti-Capture):
1. No shareholder may hold ≥50% of equity units
2. The CRE blocks any transfer that would result in a ≥50% concentration
3. Any attempt to circumvent this rule (via syndicates, proxies, or nominees) is a constitutional violation
4. Violations are recorded on the immutable ledger and trigger a CRE freeze

Signatory: {{signatoryName}}
Current holding: {{currentHoldingPct}}%
Date: {{date}}`,
    variables: ["enterpriseName", "signatoryName", "currentHoldingPct", "date"],
  },
  {
    id: "tpl-fee-structure",
    appendix: "BB",
    title: "Fee Structure Schedule",
    jurisdiction: "Egypt",
    category: "constitutional",
    content: `FEE STRUCTURE SCHEDULE — AURIENTA

1. PLATFORM SERVICE FEE: 5% of each milestone release
   - Deducted from escrow at milestone approval
   - VAT 14% applies (Law 67/2016)
   - Subject to VAT: YES

2. CONSULTING FEE: 2.5% of each milestone release
   - Mandatory until 3 consecutive profitable quarters OR 2 years of consultancy
   - After which shareholders may vote to discontinue (Vol 4 §4.11)
   - Subject to VAT: YES

3. EQUITY FEES: None (eliminated in current fee structure)

4. TRADE FEES: 0.5% of secondary market trade value
   - Paid by both buyer and seller (0.25% each)
   - Subject to VAT: YES

5. NO HIDDEN FEES:
   - All fees are published in the constitutional rules
   - The CRE enforces the fee structure
   - Any attempt to charge additional fees is a constitutional violation

For {{enterpriseName}}:
- Estimated monthly fees: {{estimatedMonthlyFeesEgp}} EGP
- Based on milestone cadence: {{milestoneCadence}}`,
    variables: ["enterpriseName", "estimatedMonthlyFeesEgp", "milestoneCadence"],
  },
  {
    id: "tpl-graduation-readiness",
    appendix: "CC",
    title: "Graduation Readiness Assessment",
    jurisdiction: "Egypt (Vol 15 §15.2)",
    category: "constitutional",
    content: `GRADUATION READINESS ASSESSMENT — {{enterpriseName}}

1. READINESS SCORE: {{readinessScore}}/100 (threshold: 90)
   - Constitutional Compliance: {{complianceScore}}/100
   - Financial Independence: {{financialScore}}/100
   - Governance Maturity: {{governanceScore}}/100
   - Operational Autonomy: {{autonomyScore}}/100

2. DEPENDENCY INDEX: {{dependencyIndex}}/100 (threshold: <20)
   - AURIENTA platform dependency: {{platformDependency}}%
   - Law firm dependency: {{lawFirmDependency}}%
   - Consulting dependency: {{consultingDependency}}%

3. SHAREHOLDER VOTE: {{votePct}}% approved (threshold: 75%)

4. STAGE PROGRESSION:
   - Stage 1 (Formation): Completed {{stage1Date}}
   - Stage 2 (Capital Formation): Completed {{stage2Date}}
   - Stage 3 (Operations): Completed {{stage3Date}}
   - Stage 4 (Graduation Readiness): Completed {{stage4Date}}

5. DATA EXPORT: Ready (hash: {{exportHash}})

RECOMMENDATION: {{recommendation}}`,
    variables: ["enterpriseName", "readinessScore", "complianceScore", "financialScore", "governanceScore", "autonomyScore", "dependencyIndex", "platformDependency", "lawFirmDependency", "consultingDependency", "votePct", "stage1Date", "stage2Date", "stage3Date", "stage4Date", "exportHash", "recommendation"],
  },
];

/**
 * Get a legal template by ID.
 */
export function getTemplate(id: string): LegalTemplate | undefined {
  return LEGAL_TEMPLATES.find((t) => t.id === id);
}

/**
 * List all legal templates (metadata only — no content).
 */
export function listTemplates(): Array<Omit<LegalTemplate, "content">> {
  return LEGAL_TEMPLATES.map(({ content, ...meta }) => meta);
}

/**
 * Render a template with the given variables.
 */
export function renderTemplate(id: string, variables: Record<string, string>): string {
  const template = getTemplate(id);
  if (!template) {
    throw new Error(`Template not found: ${id}`);
  }

  let rendered = template.content;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  // Check for unrendered variables
  const unrendered = rendered.match(/\{\{(\w+)\}\}/g);
  if (unrendered) {
    throw new Error(
      `Unrendered variables: ${unrendered.join(", ")}. Provided: ${Object.keys(variables).join(", ")}`
    );
  }

  return rendered;
}
