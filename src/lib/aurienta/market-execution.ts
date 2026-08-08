// AURIENTA Market Execution, Anchor Customer Acquisition & Revenue Validation System (MES) v1.0
// ═══════════════════════════════════════════════════════════════
// This is the EXECUTION ENGINE. The 11 prior systems are FROZEN
// FOUNDATIONAL SYSTEMS — do not redesign them.
//
// OBJECTIVE: Turn existing architecture into REAL PARTNERS → REAL
// ENTERPRISES → REAL DEPLOYMENTS → REAL EVIDENCE → REAL REVENUE →
// REAL INSTITUTIONAL CREDIBILITY.
//
// EXECUTION INTEGRITY RULE (non-negotiable):
//   CLAIM    = what AURIENTA says
//   EVIDENCE = what proves the claim
//   STATUS   = current factual state
//   TARGET   = desired future state
//   FORECAST = expected future result
//   These must NEVER be conflated. "ISO 27001 Certified" is PROHIBITED
//   unless certification has actually occurred. Correct: "ISO 27001
//   preparation underway — certification pending." Unknown information
//   must be labeled UNKNOWN / NOT ACHIEVED / INSUFFICIENT DATA.
//
// HONESTY DEFAULT: This system starts EMPTY. All counts are 0. All
// statuses are NOT ACHIEVED / UNKNOWN. The machinery is ready; the
// evidence fills as real execution happens. No fabricated data.
//
// DO NOT modify without Founder approval.
// ═══════════════════════════════════════════════════════════════

export const MES_VERSION = "1.0";
export const MES_FROZEN_AT = "2026-08-15";

// ═══════════════════════════════════════════════════════════════
// EXECUTION INTEGRITY RULE — the 5 states that must never be conflated
// ═══════════════════════════════════════════════════════════════

export type IntegrityState = "CLAIM" | "EVIDENCE" | "STATUS" | "TARGET" | "FORECAST";

export const EXECUTION_INTEGRITY_RULE = {
  states: ["CLAIM", "EVIDENCE", "STATUS", "TARGET", "FORECAST"] as IntegrityState[],
  definitions: {
    CLAIM: "What AURIENTA says.",
    EVIDENCE: "What proves the claim.",
    STATUS: "Current factual state.",
    TARGET: "Desired future state.",
    FORECAST: "Expected future result.",
  },
  rule: "These must never be conflated. A claim is not evidence. A target is not a status. A forecast is not an achievement.",
  examples: [
    { prohibited: "ISO 27001 Certified", correct: "ISO 27001 preparation underway — certification pending (target Q4 2027)", reason: "No certificate issued yet." },
    { prohibited: "Global Partner", correct: "Partner target — outreach pending", reason: "No signed agreement yet." },
    { prohibited: "10 active pilots", correct: "0 active pilots — pipeline building", reason: "No signed pilot agreements yet." },
    { prohibited: "FRA approved", correct: "FRA engagement pending — not submitted", reason: "No formal regulatory engagement yet." },
    { prohibited: "Trusted by enterprises", correct: "0 signed enterprises — target list in development", reason: "No signed customers yet." },
  ],
  fabricationProhibition: "Brain AI and all systems must NEVER fabricate: customers, partners, revenue, regulatory approval, certifications, contracts, meetings, testimonials, performance statistics, or institutional relationships. Unknown = UNKNOWN.",
};

// ═══════════════════════════════════════════════════════════════
// HONEST EXECUTION STATUS REGISTER — the current factual state (all zeros)
// ═══════════════════════════════════════════════════════════════

export type ExecutionStatus = {
  capability: string;
  count: number | string;
  status: "ACHIEVED" | "NOT ACHIEVED" | "IN PROGRESS" | "PENDING" | "INSUFFICIENT DATA";
  evidence: string;
  target: string;
};

export const EXECUTION_STATUS_REGISTER: ExecutionStatus[] = [
  { capability: "Anchor customers signed", count: 0, status: "NOT ACHIEVED", evidence: "No signed customer agreements", target: "5-10 in Egypt (Year 1)" },
  { capability: "Active pilots", count: 0, status: "NOT ACHIEVED", evidence: "No signed pilot agreements", target: "5-10 pilots" },
  { capability: "Successful pilots (graduated)", count: 0, status: "NOT ACHIEVED", evidence: "No completed pilots", target: "First pilot success" },
  { capability: "Collected revenue (EGP)", count: 0, status: "NOT ACHIEVED", evidence: "No invoices paid", target: "First collected revenue Q1-Q2" },
  { capability: "Recurring revenue (ARR)", count: 0, status: "NOT ACHIEVED", evidence: "No recurring contracts", target: "NRR ≥ 110% post-pilots" },
  { capability: "Strategic law firm signed", count: 0, status: "NOT ACHIEVED", evidence: "No signed law firm MSA", target: "1-3 law firms (P0 priority)" },
  { capability: "Accounting partner signed", count: 0, status: "NOT ACHIEVED", evidence: "No signed accounting MSA", target: "1-2 accounting firms (P0)" },
  { capability: "Banking partner signed", count: 0, status: "NOT ACHIEVED", evidence: "No signed banking agreement", target: "1 banking partner (P0)" },
  { capability: "University partner signed", count: 0, status: "NOT ACHIEVED", evidence: "No signed university MoU", target: "1+ universities (P1)" },
  { capability: "Government/institutional formal engagement", count: 0, status: "NOT ACHIEVED", evidence: "No formal government engagement", target: "FRA engagement initiated" },
  { capability: "FRA formal recognition", count: 0, status: "NOT ACHIEVED", evidence: "Not submitted; engagement pending", target: "Formal FRA engagement" },
  { capability: "SOC 2 Type II certified", count: 0, status: "PENDING", evidence: "Readiness 82/100; no certificate issued", target: "Q2 2027" },
  { capability: "ISO 27001 certified", count: 0, status: "PENDING", evidence: "Readiness 81/100; no certificate issued", target: "Q4 2027" },
  { capability: "Published case studies", count: 0, status: "NOT ACHIEVED", evidence: "No completed pilots to study", target: "First case study after pilot success" },
  { capability: "Customer references", count: 0, status: "NOT ACHIEVED", evidence: "No reference-eligible customers", target: "Reference portfolio post-pilots" },
  { capability: "Market Validation Gates passed", count: 0, status: "NOT ACHIEVED", evidence: "Gate 1 (Market Interest) not yet passed", target: "Sequential gate passage" },
  { capability: "Target account list (qualified)", count: 0, status: "IN PROGRESS", evidence: "Methodology defined; list being built", target: "First 25-50 qualified (Day 30)" },
  { capability: "Commercial Readiness Score", count: "Low (honest)", status: "INSUFFICIENT DATA", evidence: "Calculated from actual evidence (which is zero)", target: "Rise with real execution" },
];

// ═══════════════════════════════════════════════════════════════
// PART 4 — ANCHOR CUSTOMER STRATEGY (ICP + qualification model)
// ═══════════════════════════════════════════════════════════════

export type ICPAttribute = {
  attribute: string;
  definition: string;
};

export const IDEAL_CUSTOMER_PROFILE: ICPAttribute[] = [
  { attribute: "Priority sectors", definition: "Real-economy productive enterprises: manufacturing, agriculture, logistics, healthcare, education, energy, food processing, industrial services" },
  { attribute: "Enterprise size", definition: "Tier B/C (SME to growth): 25M-250M EGP capital formation capacity; established operations; 10-200 employees" },
  { attribute: "Geography", definition: "Egypt (home market, Year 1); GCC next" },
  { attribute: "Decision-maker", definition: "Founder/CEO or COO (economic buyer + operational champion)" },
  { attribute: "Economic buyer", definition: "Founder/Owner (signs MSA + approves spend)" },
  { attribute: "Legal approver", definition: "General Counsel / external law firm / owner" },
  { attribute: "Technology approver", definition: "CTO / Head of IT / Founder (if tech-savvy)" },
  { attribute: "Compliance approver", definition: "Compliance Officer / CFO / external auditor" },
  { attribute: "Operational champion", definition: "COO / Head of Operations / Founder (internal sponsor)" },
  { attribute: "Buying trigger", definition: "Capital formation need; governance maturity desire; graduation ambition; transparency requirement; partner/bank introduction" },
  { attribute: "Pain points", definition: "No clean governance; capital fragmentation; no transparent cap table; founder burnout; no graduation path; investor distrust" },
  { attribute: "Objections", definition: "Constitutional overhead; zero-custody unfamiliarity; internal change mgmt; legal review time; price; trust in new platform" },
  { attribute: "Required evidence", definition: "Constitutional model proof; CRE enforcement; Zero Custody proof; security posture; pilot references (when available); legal opinion" },
  { attribute: "Implementation timeline", definition: "5 business days to go-live; 30 days to first milestone; 90 days to first measurable outcome" },
  { attribute: "Commercial value", definition: "50K-500K EGP/yr subscription + implementation + expansion" },
  { attribute: "Expansion potential", definition: "Tier upgrade; cross-sell certification/advisory; multi-entity; regional" },
  { attribute: "Reference value", definition: "HIGH — first anchor customers become case studies + references" },
];

export type QualificationCriterion = {
  criterion: string;
  weight: number;
  minimumThreshold: string;
};

export const ANCHOR_QUALIFICATION_MODEL: QualificationCriterion[] = [
  { criterion: "Strategic fit", weight: 5, minimumThreshold: "Aligns with constitutional model + real-economy focus" },
  { criterion: "Real problem", weight: 5, minimumThreshold: "Verified governance/capital/transparency pain" },
  { criterion: "Ability to pay", weight: 4, minimumThreshold: "Demonstrated financial capacity" },
  { criterion: "Decision authority", weight: 5, minimumThreshold: "Direct access to economic buyer" },
  { criterion: "Implementation readiness", weight: 4, minimumThreshold: "Operational + technical readiness within 30 days" },
  { criterion: "Governance maturity", weight: 4, minimumThreshold: "Welcomes constitutional governance (not resistant)" },
  { criterion: "Legal feasibility", weight: 4, minimumThreshold: "Legal entity formed; no blocking legal issues" },
  { criterion: "Regulatory feasibility", weight: 3, minimumThreshold: "No regulatory blockers in sector" },
  { criterion: "Technology readiness", weight: 3, minimumThreshold: "Digital-capable or willing to adopt" },
  { criterion: "Reference potential", weight: 5, minimumThreshold: "Will become case study + reference if successful" },
];

export const QUALIFICATION_RULE = {
  method: "Each criterion scored 1-5. Weighted score = Σ(score × weight) / Σ(weights). Minimum threshold: 3.5 to qualify as anchor candidate. 4.0+ for P0 tier.",
  threshold: 3.5,
  p0Threshold: 4.0,
  rule: "Do NOT pursue customers simply because they are interested. Prioritize customers capable of becoming anchor/reference/case-study/regional/credibility customers.",
};

// ═══════════════════════════════════════════════════════════════
// PART 5 — TARGET ACCOUNT LIST (structure; data is UNKNOWN/empty)
// ═══════════════════════════════════════════════════════════════

export type TargetAccountField = {
  field: string;
  required: boolean;
  defaultIfUnknown: string;
};

export const TARGET_ACCOUNT_SCHEMA: TargetAccountField[] = [
  { field: "Organization", required: true, defaultIfUnknown: "UNKNOWN / RESEARCH REQUIRED" },
  { field: "Country", required: true, defaultIfUnknown: "Egypt (default for Year 1)" },
  { field: "Sector", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Size (tier)", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Website/domain", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Decision-maker", required: true, defaultIfUnknown: "UNKNOWN / RESEARCH REQUIRED" },
  { field: "Role", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Contact status", required: true, defaultIfUnknown: "Not contacted" },
  { field: "Relationship status", required: true, defaultIfUnknown: "No relationship" },
  { field: "Strategic value", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Estimated opportunity value (EGP)", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Qualification score", required: true, defaultIfUnknown: "Not scored" },
  { field: "Current stage", required: true, defaultIfUnknown: "Target identified" },
  { field: "Next action", required: true, defaultIfUnknown: "Research + outreach" },
  { field: "Owner", required: true, defaultIfUnknown: "Founder (until delegated)" },
  { field: "Deadline", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Probability", required: true, defaultIfUnknown: "0% (no contact)" },
  { field: "Blocker", required: false, defaultIfUnknown: "None identified" },
  { field: "Evidence", required: true, defaultIfUnknown: "None yet" },
  { field: "Notes", required: false, defaultIfUnknown: "—" },
];

export const TARGET_ACCOUNT_RULE = "Never invent contacts, relationships, meetings, or commitments. If information is unknown, explicitly mark UNKNOWN / RESEARCH REQUIRED. The target account list starts EMPTY and fills with real research.";

// Current state: 0 target accounts entered (methodology ready, research pending)
export const TARGET_ACCOUNT_COUNT = 0;

// ═══════════════════════════════════════════════════════════════
// PART 6 — FIRST 100 TARGET ACCOUNT STRATEGY (tiering methodology)
// ═══════════════════════════════════════════════════════════════

export type AccountTier = {
  tier: string;
  description: string;
  qualificationScore: string;
  expectedCount: string;
  currentCount: number;
};

export const TARGET_TIERS: AccountTier[] = [
  { tier: "P0", description: "Highest strategic value — anchor/reference/case-study potential", qualificationScore: "≥ 4.0", expectedCount: "10-15 accounts", currentCount: 0 },
  { tier: "P1", description: "Strong commercial potential — likely to sign within 90 days", qualificationScore: "3.5-4.0", expectedCount: "20-30 accounts", currentCount: 0 },
  { tier: "P2", description: "Secondary opportunities — viable but longer cycle", qualificationScore: "3.0-3.5", expectedCount: "30-40 accounts", currentCount: 0 },
  { tier: "P3", description: "Long-term opportunities — nurture for future", qualificationScore: "2.5-3.0", expectedCount: "20-30 accounts", currentCount: 0 },
];

// ═══════════════════════════════════════════════════════════════
// PART 7 — SALES EXECUTION PIPELINE (22 stages)
// ═══════════════════════════════════════════════════════════════

export type PipelineStage = {
  stageId: string;
  stage: string;
  entryCriteria: string;
  exitCriteria: string;
  owner: string;
  evidence: string;
  expectedDuration: string;
};

export const SALES_PIPELINE: PipelineStage[] = [
  { stageId: "SP-01", stage: "Target identified", entryCriteria: "Account meets ICP + qualification criteria", exitCriteria: "Research complete; account entered in CRM", owner: "Founder/Sales", evidence: "CRM entry with org + sector + tier", expectedDuration: "Day 1" },
  { stageId: "SP-02", stage: "Account qualified", entryCriteria: "Qualification score ≥ 3.5", exitCriteria: "Qualification recorded", owner: "Founder/Sales", evidence: "Qualification scorecard", expectedDuration: "1-3 days" },
  { stageId: "SP-03", stage: "Contact identified", entryCriteria: "Decision-maker named + reachable", exitCriteria: "Contact verified", owner: "Founder/Sales", evidence: "Contact record (verified, not assumed)", expectedDuration: "1-5 days" },
  { stageId: "SP-04", stage: "Initial outreach", entryCriteria: "Contact identified", exitCriteria: "Outreach sent", owner: "Founder/Sales", evidence: "Outreach log", expectedDuration: "1 day" },
  { stageId: "SP-05", stage: "Response", entryCriteria: "Outreach sent", exitCriteria: "Prospect responded", owner: "Founder/Sales", evidence: "Response log", expectedDuration: "1-14 days" },
  { stageId: "SP-06", stage: "Discovery meeting", entryCriteria: "Prospect agreed to meet", exitCriteria: "Meeting held + notes recorded", owner: "Founder/Sales", evidence: "Meeting notes + recording (consent)", expectedDuration: "1-2 weeks" },
  { stageId: "SP-07", stage: "Problem validation", entryCriteria: "Discovery complete", exitCriteria: "Verified pain + use case", owner: "Founder/Sales", evidence: "Problem validation document", expectedDuration: "1 meeting" },
  { stageId: "SP-08", stage: "Institutional presentation", entryCriteria: "Problem validated", exitCriteria: "AURIENTA presented; prospect engaged", owner: "Founder", evidence: "Presentation + attendee list", expectedDuration: "1 meeting" },
  { stageId: "SP-09", stage: "Technical review", entryCriteria: "Prospect engaged", exitCriteria: "Technical fit confirmed", owner: "Operations/CTO", evidence: "Technical review document", expectedDuration: "1-2 weeks" },
  { stageId: "SP-10", stage: "Legal review", entryCriteria: "Technical fit", exitCriteria: "Legal sign-off (or issues identified)", owner: "Legal/Holding", evidence: "Legal review record", expectedDuration: "1-3 weeks" },
  { stageId: "SP-11", stage: "Compliance review", entryCriteria: "Legal review", exitCriteria: "Compliance sign-off", owner: "Compliance", evidence: "Compliance review record", expectedDuration: "1-2 weeks" },
  { stageId: "SP-12", stage: "Commercial proposal", entryCriteria: "All reviews passed", exitCriteria: "Proposal delivered", owner: "Founder/Sales", evidence: "Proposal document (versioned)", expectedDuration: "1 week" },
  { stageId: "SP-13", stage: "Negotiation", entryCriteria: "Proposal delivered", exitCriteria: "Terms agreed", owner: "Founder", evidence: "Negotiation log + revised proposal", expectedDuration: "1-4 weeks" },
  { stageId: "SP-14", stage: "MSA / agreement", entryCriteria: "Terms agreed", exitCriteria: "MSA signed by both parties", owner: "Founder/Legal", evidence: "Signed MSA (executed copy)", expectedDuration: "1-2 weeks" },
  { stageId: "SP-15", stage: "Pilot agreement", entryCriteria: "MSA signed", exitCriteria: "Pilot SOW signed", owner: "Founder", evidence: "Signed pilot SOW", expectedDuration: "1 week" },
  { stageId: "SP-16", stage: "Onboarding", entryCriteria: "Pilot SOW signed", exitCriteria: "Onboarding complete (charter, Law Firm Client Account, CRE)", owner: "Customer Success", evidence: "Onboarding checklist (all PASS)", expectedDuration: "5 business days" },
  { stageId: "SP-17", stage: "Implementation", entryCriteria: "Onboarding complete", exitCriteria: "Implementation complete", owner: "Customer Success/Operations", evidence: "Implementation record", expectedDuration: "1-2 weeks" },
  { stageId: "SP-18", stage: "Go-live", entryCriteria: "Implementation complete", exitCriteria: "Enterprise operational on AURIENTA", owner: "Customer Success", evidence: "Go-live sign-off", expectedDuration: "1 day" },
  { stageId: "SP-19", stage: "Success measurement", entryCriteria: "Go-live + 90 days", exitCriteria: "Predefined success criteria met", owner: "Customer Success", evidence: "Success assessment document", expectedDuration: "90 days" },
  { stageId: "SP-20", stage: "Conversion to recurring commercial", entryCriteria: "Success demonstrated", exitCriteria: "Recurring commercial agreement signed", owner: "Founder/Sales", evidence: "Signed recurring agreement + first invoice", expectedDuration: "1-2 weeks" },
  { stageId: "SP-21", stage: "Expansion", entryCriteria: "Recurring customer", exitCriteria: "Expansion (tier/module/entity) signed", owner: "Customer Success/Sales", evidence: "Expansion agreement", expectedDuration: "Ongoing" },
  { stageId: "SP-22", stage: "Reference / case study", entryCriteria: "Successful customer + consent", exitCriteria: "Case study published + reference available", owner: "Marketing/CS", evidence: "Published case study + reference consent", expectedDuration: "Post-success" },
];

export const PIPELINE_RULE = "Every stage has entry criteria, exit criteria, owner, evidence, required documents, expected duration, blocker, next action. No stage skipped. No stage marked complete without evidence.";

// Current pipeline state: 0 opportunities (all stages empty)
export const PIPELINE_OPPORTUNITY_COUNT = 0;

// ═══════════════════════════════════════════════════════════════
// PART 8 — COMMERCIAL OFFER VALIDATION (THEORETICAL vs VALIDATED)
// ═══════════════════════════════════════════════════════════════

export type PricingValidation = {
  package: string;
  theoreticalPrice: string;
  validatedPrice: string;
  willingnessToPay: string;
  status: "THEORETICAL" | "BEING TESTED" | "VALIDATED" | "REVISED";
};

export const COMMERCIAL_OFFER_VALIDATION: PricingValidation[] = [
  { package: "Subscription (SME Tier A/B)", theoreticalPrice: "50K-150K EGP/yr", validatedPrice: "INSUFFICIENT DATA", willingnessToPay: "UNKNOWN", status: "THEORETICAL" },
  { package: "Subscription (Growth Tier C)", theoreticalPrice: "150K-300K EGP/yr", validatedPrice: "INSUFFICIENT DATA", willingnessToPay: "UNKNOWN", status: "THEORETICAL" },
  { package: "Implementation", theoreticalPrice: "25K-100K EGP one-time", validatedPrice: "INSUFFICIENT DATA", willingnessToPay: "UNKNOWN", status: "THEORETICAL" },
  { package: "Certification (CAaaS)", theoreticalPrice: "100K-500K EGP/yr", validatedPrice: "INSUFFICIENT DATA", willingnessToPay: "UNKNOWN", status: "THEORETICAL" },
  { package: "Enterprise (Tier D)", theoreticalPrice: "200K-1M EGP/yr", validatedPrice: "INSUFFICIENT DATA", willingnessToPay: "UNKNOWN", status: "THEORETICAL" },
  { package: "University (Tier E 1%)", theoreticalPrice: "1% of SPV", validatedPrice: "INSUFFICIENT DATA", willingnessToPay: "UNKNOWN", status: "THEORETICAL" },
];

export const PRICING_VALIDATION_RULE = "Distinguish THEORETICAL PRICING from VALIDATED PRICING. Do not assume the existing pricing model is correct simply because it exists in the blueprint. Test it against real customers. Measure actual willingness to pay. Only after 5-10 real customer interactions may pricing be considered VALIDATED.";

// ═══════════════════════════════════════════════════════════════
// PART 9 — REVENUE VALIDATION (only collected revenue counts)
// ═══════════════════════════════════════════════════════════════

export type RevenueMetric = {
  metric: string;
  value: string;
  evidence: string;
};

export const REVENUE_VALIDATION: RevenueMetric[] = [
  { metric: "Contracted revenue (EGP)", value: "0", evidence: "No signed contracts" },
  { metric: "Invoiced revenue (EGP)", value: "0", evidence: "No invoices issued" },
  { metric: "Collected revenue (EGP)", value: "0", evidence: "No payments received" },
  { metric: "Recurring revenue (ARR)", value: "0", evidence: "No recurring contracts" },
  { metric: "Implementation revenue", value: "0", evidence: "No implementations" },
  { metric: "Advisory revenue", value: "0", evidence: "No advisory engagements" },
  { metric: "Certification revenue", value: "0", evidence: "No certifications delivered" },
  { metric: "Enterprise services revenue", value: "0", evidence: "No enterprise services" },
  { metric: "Partner-generated revenue", value: "0", evidence: "No active partners" },
  { metric: "Expansion revenue", value: "0", evidence: "No expansion" },
  { metric: "Churn", value: "N/A (no customers)", evidence: "INSUFFICIENT DATA" },
  { metric: "Retention", value: "N/A (no customers)", evidence: "INSUFFICIENT DATA" },
  { metric: "Gross margin", value: "INSUFFICIENT DATA", evidence: "No revenue data" },
  { metric: "CAC", value: "INSUFFICIENT DATA", evidence: "No customers acquired" },
  { metric: "Payback period", value: "INSUFFICIENT DATA", evidence: "No customers" },
  { metric: "Pipeline value", value: "0", evidence: "No opportunities in pipeline" },
  { metric: "Weighted pipeline", value: "0", evidence: "No opportunities" },
  { metric: "Forecast accuracy", value: "INSUFFICIENT DATA", evidence: "No historical data" },
];

export const REVENUE_RULE = "Do NOT count verbal interest, unsigned proposals, hypothetical pipeline, or projected customers as revenue. Revenue is classified honestly: CONTRACTED (signed) → INVOICED (billed) → COLLECTED (cash received). Only COLLECTED revenue is real revenue.";

// ═══════════════════════════════════════════════════════════════
// PART 10 — PARTNER EXECUTION (priority sequence; all 0 secured)
// ═══════════════════════════════════════════════════════════════

export type PartnerTarget = {
  priority: "P0" | "P1" | "P2";
  partnerType: string;
  target: string;
  signed: number;
  status: string;
  rationale: string;
};

export const PARTNER_EXECUTION: PartnerTarget[] = [
  { priority: "P0", partnerType: "Strategic law firm", target: "1-3 firms", signed: 0, status: "Targeting — outreach pending", rationale: "Amendment IX compliance; Law Firm Client Account network; constitutional model legal foundation" },
  { priority: "P0", partnerType: "Accounting/audit partner", target: "1-2 firms", signed: 0, status: "Targeting — outreach pending", rationale: "Audit, reconciliation, certification network" },
  { priority: "P0", partnerType: "Banking partner", target: "1 bank", signed: 0, status: "Targeting — outreach pending", rationale: "Banking integration for Law Firm Client Account flows" },
  { priority: "P1", partnerType: "University", target: "1+ universities", signed: 0, status: "Targeting — outreach pending", rationale: "Tier E SPV model; talent; spin-outs" },
  { priority: "P1", partnerType: "ERP/technology ecosystem partner", target: "1+", signed: 0, status: "Targeting — pending", rationale: "Joint solution; co-sell; integration" },
  { priority: "P1", partnerType: "Government/institutional relationship", target: "1+ formal engagement", signed: 0, status: "Engagement pending", rationale: "Regulatory clarity; national program potential" },
  { priority: "P1", partnerType: "Cloud/infrastructure partner", target: "1+", signed: 0, status: "Targeting — pending", rationale: "Infrastructure; co-marketing" },
  { priority: "P2", partnerType: "Regional strategic partners", target: "Per region", signed: 0, status: "Future — post-domestic validation", rationale: "Regional expansion support" },
  { priority: "P2", partnerType: "Industry associations", target: "1+", signed: 0, status: "Future", rationale: "Credibility; network access" },
  { priority: "P2", partnerType: "International institutional partners", target: "1+", signed: 0, status: "Future — post-domestic", rationale: "International credibility" },
];

export const PARTNER_RULE = "Do NOT mark a partner as 'secured' until a real agreement or other objectively defined commitment exists. Track: target, strategic rationale, relationship owner, contact, stage, DD, NDA, MoU, commercial agreement, responsibilities, economics, referrals, implementation role, KPIs, activation date, review cadence, termination conditions.";

// ═══════════════════════════════════════════════════════════════
// PART 11 — LAW FIRM FIRST (detailed strategy)
// ═══════════════════════════════════════════════════════════════

export type LawFirmCriterion = {
  criterion: string;
  evaluation: string;
};

export const LAW_FIRM_CRITERIA: LawFirmCriterion[] = [
  { criterion: "Corporate law", evaluation: "Strength in corporate formation, governance, M&A" },
  { criterion: "Financial regulation", evaluation: "Understanding of FRA, CBE, non-banking perimeter" },
  { criterion: "Fintech/technology regulation", evaluation: "Experience with tech-enabled infrastructure" },
  { criterion: "Data protection", evaluation: "PDPL expertise; data residency; cross-border" },
  { criterion: "Contracts", evaluation: "Commercial contract strength" },
  { criterion: "Employment", evaluation: "Employment law (for HR-related matters)" },
  { criterion: "Cross-border", evaluation: "International capability (for future expansion)" },
  { criterion: "Government relations", evaluation: "Access to government/legal ecosystem" },
  { criterion: "Institutional credibility", evaluation: "Reputation that lends credibility to AURIENTA" },
  { criterion: "Willingness to work with emerging infrastructure", evaluation: "Openness to a new model (not only established clients)" },
  { criterion: "Conflict-of-interest considerations", evaluation: "No conflicts with AURIENTA's model or customers" },
];

export const LAW_FIRM_PIPELINE = ["Qualification", "Outreach", "Meeting", "Due Diligence", "Engagement", "Agreement", "Activation"];

export const LAW_FIRM_RULE = "Execute the law-firm strategy FIRST because AURIENTA's constitutional model relies on legal architecture. Do NOT claim regulatory approval or legal validation without actual evidence.";

// ═══════════════════════════════════════════════════════════════
// PART 12 — REGULATORY ENGAGEMENT (honest status tracking)
// ═══════════════════════════════════════════════════════════════

export type RegulatoryInteraction = {
  authority: string;
  department: string;
  purpose: string;
  status: "NOT SUBMITTED" | "SUBMITTED" | "UNDER REVIEW" | "ENGAGED" | "FORMAL RECOGNITION" | "APPROVED" | "PENDING";
  evidence: string;
  nextAction: string;
};

export const REGULATORY_ENGAGEMENT_EXECUTION: RegulatoryInteraction[] = [
  { authority: "FRA (Financial Regulatory Authority)", department: "UNKNOWN / RESEARCH REQUIRED", purpose: "Clarify non-banking status; constitutional model recognition", status: "NOT SUBMITTED", evidence: "No formal engagement yet", nextAction: "Identify correct department + contact; prepare engagement brief" },
  { authority: "Central Bank of Egypt", department: "UNKNOWN", purpose: "Clarify AURIENTA is not a banking entity (Zero Custody)", status: "NOT SUBMITTED", evidence: "No engagement", nextAction: "Prepare Zero Custody briefing; identify if engagement needed" },
  { authority: "Data Protection Authority (PDPL)", department: "UNKNOWN", purpose: "PDPL compliance confirmation; data residency", status: "NOT SUBMITTED", evidence: "Compliance preparation underway; no formal submission", nextAction: "Complete PDPL compliance review; formal engagement" },
  { authority: "Companies Authority", department: "Corporate Registry", purpose: "Entity registration + ongoing compliance", status: "APPROVED", evidence: "Entity registered (operational)", nextAction: "Ongoing filings" },
  { authority: "Tax Authority", department: "Tax", purpose: "Tax registration + compliance", status: "APPROVED", evidence: "Tax registration complete (operational)", nextAction: "Ongoing filings" },
];

export const REGULATORY_TERMINOLOGY_RULE = {
  rule: "Use 'regulatory engagement' until actual formal recognition, approval, no-action letter, license, exemption, registration, or other legally valid status exists.",
  prohibited: "Never represent 'approved' when the actual status is 'submitted', 'under review', 'engaged', 'discussed', or 'pending'.",
  currentHonestStatus: "Companies + Tax: APPROVED (operational). FRA, CBE, PDPL: NOT SUBMITTED / engagement pending.",
};

// ═══════════════════════════════════════════════════════════════
// PART 13 — PILOT EXECUTION (before/during/after)
// ═══════════════════════════════════════════════════════════════

export const PILOT_EXECUTION_FRAMEWORK = {
  before: ["Qualification (score ≥ 3.5)", "Pilot agreement signed", "Success criteria defined + agreed", "Baseline measurement", "Legal review complete", "Security review complete", "Onboarding plan", "Implementation plan"],
  during: ["Weekly health check", "Milestone tracking", "CRE performance monitoring", "Brain AI usage tracking", "Operational metrics", "Incident tracking", "Customer feedback (weekly)", "Blocker tracking", "Support", "Compliance evidence collection"],
  after: ["Success assessment vs predefined criteria", "Measurable outcomes documented", "Customer satisfaction (CSAT)", "NPS", "Retention intention", "Expansion potential assessment", "Testimonial request (if successful)", "Case-study eligibility assessment", "Commercial conversion"],
  rule: "A pilot is NOT successful because the software works. It is successful only when predefined business AND constitutional outcomes are demonstrated.",
  currentPilots: 0,
};

// ═══════════════════════════════════════════════════════════════
// PART 14 — CASE STUDY FACTORY
// ═══════════════════════════════════════════════════════════════

export type CaseStudyElement = {
  element: string;
  requirement: string;
};

export const CASE_STUDY_TEMPLATE: CaseStudyElement[] = [
  { element: "Customer context", requirement: "Real customer (named, with consent) or anonymized with legal justification" },
  { element: "Original problem", requirement: "Verified pain (from discovery + baseline)" },
  { element: "Baseline", requirement: "Measured pre-AURIENTA state" },
  { element: "Implementation", requirement: "Documented implementation (timeline, steps, roles)" },
  { element: "Timeline", requirement: "Actual dates (not estimated)" },
  { element: "Solution", requirement: "What AURIENTA delivered (specific modules, CRE policies, Brain AI)" },
  { element: "Measurable results", requirement: "Quantified outcomes (revenue, efficiency, governance, compliance)" },
  { element: "Operational outcomes", requirement: "Operational metrics before/after" },
  { element: "Governance outcomes", requirement: "Constitutional governance improvements" },
  { element: "Compliance outcomes", requirement: "Compliance improvements" },
  { element: "Customer feedback", requirement: "Direct quotes (with consent)" },
  { element: "Limitations", requirement: "Honest limitations (what didn't work perfectly)" },
  { element: "Lessons learned", requirement: "What AURIENTA learned" },
];

export const CASE_STUDY_RULE = "No fabricated statistics. No anonymous 'enterprise success' claims unless legally justified. No marketing claim without evidence. Current published case studies: 0.";

// ═══════════════════════════════════════════════════════════════
// PART 18 — PRODUCT-MARKET FIT VALIDATION
// ═══════════════════════════════════════════════════════════════

export const PMF_TRACKING = {
  metrics: ["Repeated customer problem (frequency)", "Willingness to pay (measured)", "Sales cycle (actual)", "Implementation effort (actual)", "Adoption (depth + breadth)", "Retention", "Expansion", "Referral", "Customer satisfaction", "Economic value delivered", "Competitive alternatives encountered", "Reasons for rejection"],
  evidenceThreshold: "At least 5-10 pilots should generate enough evidence to identify KEEP/CHANGE/REMOVE/ACCELERATE/INVESTIGATE.",
  classifications: [
    { label: "KEEP", meaning: "What is clearly working" },
    { label: "CHANGE", meaning: "What repeatedly creates friction" },
    { label: "REMOVE", meaning: "What customers do not value" },
    { label: "ACCELERATE", meaning: "What customers repeatedly request" },
    { label: "INVESTIGATE", meaning: "What remains uncertain" },
  ],
  currentStatus: "INSUFFICIENT DATA — no pilots completed yet. PMF assessment requires real customer evidence.",
};

// ═══════════════════════════════════════════════════════════════
// PART 19 — LOST OPPORTUNITY INTELLIGENCE
// ═══════════════════════════════════════════════════════════════

export type LossReason = {
  reason: string;
  captured: string;
};

export const LOST_OPPORTUNITY_REASONS: LossReason[] = [
  { reason: "Reason lost", captured: "Specific reason (not just 'lost')" },
  { reason: "Competitor", captured: "Which competitor won + why" },
  { reason: "Price objection", captured: "Specific price feedback" },
  { reason: "Legal objection", captured: "Specific legal concern" },
  { reason: "Regulatory objection", captured: "Specific regulatory concern" },
  { reason: "Technology objection", captured: "Specific tech concern" },
  { reason: "Trust objection", captured: "Specific trust concern" },
  { reason: "Timing", captured: "Why timing was wrong" },
  { reason: "Internal politics", captured: "Internal dynamics" },
  { reason: "Missing feature", captured: "What feature was needed" },
  { reason: "Implementation concern", captured: "Specific implementation worry" },
  { reason: "Procurement issue", captured: "Procurement process blocker" },
];

export const LOSS_RULE = "Do NOT hide losses. Brain AI must learn from losses as aggressively as successes. Every lost prospect produces structured evidence. Current lost opportunities: 0 (no opportunities yet).";

// ═══════════════════════════════════════════════════════════════
// PART 20 — CUSTOMER HEALTH
// ═══════════════════════════════════════════════════════════════

export const CUSTOMER_HEALTH_MODEL = {
  dimensions: ["Adoption", "Engagement", "Operational health", "Support load", "Compliance health", "Relationship strength", "Satisfaction", "Commercial health", "Expansion probability", "Churn risk"],
  scoring: "0-100 composite. GREEN ≥ 75 (healthy). AMBER 50-74 (attention required). RED < 50 (executive intervention required).",
  rule: "All alerts have owners and deadlines. No customer = no health score (INSUFFICIENT DATA).",
  currentCustomers: 0,
};

// ═══════════════════════════════════════════════════════════════
// PART 21 — REAL-WORLD EXECUTION BOARD (TODAY/WEEK/MONTH/QUARTER)
// ═══════════════════════════════════════════════════════════════

export const EXECUTION_BOARD = {
  today: ["What must happen today? (Founder's top execution actions)"],
  thisWeek: ["What commitments must be completed this week?"],
  thisMonth: ["What commercial outcomes must be achieved this month?"],
  thisQuarter: ["What institutional milestones must be achieved this quarter?"],
  displays: [
    "Target accounts (count + status)",
    "Active opportunities (count + stage + value)",
    "Meetings (scheduled + held)",
    "Proposals (out + in negotiation)",
    "Contracts (signed this period)",
    "Signed partners (count + type)",
    "Active pilots (count + health)",
    "Successful pilots (count)",
    "Revenue (contracted/invoiced/collected)",
    "Collections (cash received)",
    "Regulatory engagements (count + status)",
    "Blockers (count + owner)",
    "Overdue actions (count + owner)",
    "Customer health (distribution)",
    "Evidence generated (count + type)",
  ],
  currentHonestState: "All counts: 0. All statuses: NOT ACHIEVED / IN PROGRESS / PENDING. The board is ready; execution fills it.",
};

// ═══════════════════════════════════════════════════════════════
// PART 23 — FOUNDER WEEKLY SCORECARD
// ═══════════════════════════════════════════════════════════════

export type ScorecardSection = {
  section: string;
  metrics: string[];
};

export const FOUNDER_WEEKLY_SCORECARD: ScorecardSection[] = [
  { section: "Commercial", metrics: ["New qualified accounts", "Meetings held", "Proposals delivered", "Contracts signed", "Revenue (collected)", "Collections"] },
  { section: "Customers", metrics: ["Active pilots", "Successful pilots", "Customer health (G/A/R)", "NPS / CSAT", "Expansion opportunities"] },
  { section: "Partnerships", metrics: ["Law firms (outreach/meeting/signed)", "Accounting firms", "Banks", "Universities", "Government", "Technology partners"] },
  { section: "Regulatory", metrics: ["Engagements", "Submissions", "Responses received", "Pending issues"] },
  { section: "Product", metrics: ["Critical customer blockers", "Defects (Sev1/2)", "Performance", "Security"] },
  { section: "Evidence", metrics: ["Case studies", "Testimonials", "Audit evidence", "Customer outcomes documented"] },
  { section: "Founder", metrics: ["Strategic hours", "Operational hours", "Unresolved decisions", "Overdue commitments"] },
];

// ═══════════════════════════════════════════════════════════════
// PART 24 — 90-DAY EXECUTION PLAN (with honest NOT ACHIEVED markers)
// ═══════════════════════════════════════════════════════════════

export type PlanItem = {
  day: string;
  priority: string;
  status: "NOT STARTED" | "IN PROGRESS" | "ACHIEVED" | "NOT ACHIEVED";
};

export const NINETY_DAY_PLAN: PlanItem[] = [
  // Days 1-30
  { day: "Days 1-30", priority: "Build target account list (25-50 qualified)", status: "NOT STARTED" },
  { day: "Days 1-30", priority: "Identify first 25-50 qualified enterprises", status: "NOT STARTED" },
  { day: "Days 1-30", priority: "Identify law-firm candidates", status: "NOT STARTED" },
  { day: "Days 1-30", priority: "Identify accounting candidates", status: "NOT STARTED" },
  { day: "Days 1-30", priority: "Identify banking candidates", status: "NOT STARTED" },
  { day: "Days 1-30", priority: "Begin institutional outreach", status: "NOT STARTED" },
  { day: "Days 1-30", priority: "Begin regulatory engagement (FRA preparation)", status: "NOT STARTED" },
  { day: "Days 1-30", priority: "Establish CRM execution discipline", status: "NOT STARTED" },
  { day: "Days 1-30", priority: "Begin first customer meetings", status: "NOT STARTED" },
  { day: "Days 1-30", priority: "Finalize pilot commercial package", status: "IN PROGRESS" },
  // Days 31-60
  { day: "Days 31-60", priority: "Conduct discovery meetings", status: "NOT STARTED" },
  { day: "Days 31-60", priority: "Sign first strategic partner", status: "NOT STARTED" },
  { day: "Days 31-60", priority: "Sign first pilot", status: "NOT STARTED" },
  { day: "Days 31-60", priority: "Begin first enterprise onboarding", status: "NOT STARTED" },
  { day: "Days 31-60", priority: "Establish first regulatory interaction evidence", status: "NOT STARTED" },
  { day: "Days 31-60", priority: "Begin measurable pilot execution", status: "NOT STARTED" },
  { day: "Days 31-60", priority: "Refine pricing based on real objections", status: "NOT STARTED" },
  { day: "Days 31-60", priority: "Produce first institutional DD package", status: "NOT STARTED" },
  // Days 61-90
  { day: "Days 61-90", priority: "Secure additional pilots", status: "NOT STARTED" },
  { day: "Days 61-90", priority: "Convert first pilot toward commercial relationship", status: "NOT STARTED" },
  { day: "Days 61-90", priority: "Secure additional strategic partners", status: "NOT STARTED" },
  { day: "Days 61-90", priority: "Produce first measurable case-study evidence", status: "NOT STARTED" },
  { day: "Days 61-90", priority: "Establish recurring revenue evidence", status: "NOT STARTED" },
  { day: "Days 61-90", priority: "Reassess product-market fit", status: "NOT STARTED" },
  { day: "Days 61-90", priority: "Reassess commercial readiness using real data", status: "NOT STARTED" },
];

export const NINETY_DAY_RULE = "Do NOT fabricate achievement of any milestone. If a milestone is incomplete, display NOT ACHIEVED. Current state: all NOT STARTED (execution begins now).";

// ═══════════════════════════════════════════════════════════════
// PART 25 — 12-MONTH EXECUTION ROADMAP (TARGET vs ACTUAL vs FORECAST)
// ═══════════════════════════════════════════════════════════════

export type RoadmapQuarter = {
  quarter: string;
  target: string;
  actual: string;
  forecast: string;
  status: "NOT STARTED" | "IN PROGRESS" | "ON TRACK" | "BEHIND" | "ACHIEVED";
};

export const TWELVE_MONTH_ROADMAP: RoadmapQuarter[] = [
  { quarter: "Q1", target: "First anchor customers + strategic partners + regulatory engagement", actual: "0 customers, 0 partners, 0 regulatory engagement", forecast: "First engagements initiated", status: "NOT STARTED" },
  { quarter: "Q2", target: "5-10 pilots + measurable evidence + first recurring revenue", actual: "0 pilots, 0 revenue", forecast: "Pilots initiated if Q1 succeeds", status: "NOT STARTED" },
  { quarter: "Q3", target: "Case studies + certifications progressing + regional partner preparation", actual: "0 case studies", forecast: "Case studies if Q2 pilots succeed", status: "NOT STARTED" },
  { quarter: "Q4", target: "Commercial scaling + validated expansion into next market", actual: "0 scaling", forecast: "Scaling if Q3 evidence supports", status: "NOT STARTED" },
];

export const ROADMAP_RULE = "The system automatically distinguishes TARGET (desired) from ACTUAL (current factual) from FORECAST (expected). These must never be conflated. Current ACTUAL: all zeros. No milestone is ACHIEVED without evidence.";

// ═══════════════════════════════════════════════════════════════
// PART 26 — COMMERCIAL UNIT ECONOMICS (INSUFFICIENT DATA where appropriate)
// ═══════════════════════════════════════════════════════════════

export type UnitEconomic = {
  metric: string;
  value: string;
  evidence: string;
};

export const UNIT_ECONOMICS: UnitEconomic[] = [
  { metric: "CAC (Customer Acquisition Cost)", value: "INSUFFICIENT DATA", evidence: "No customers acquired yet" },
  { metric: "Implementation cost per customer", value: "INSUFFICIENT DATA", evidence: "No implementations" },
  { metric: "Support cost per customer", value: "INSUFFICIENT DATA", evidence: "No customers" },
  { metric: "Gross margin", value: "INSUFFICIENT DATA", evidence: "No revenue" },
  { metric: "Contribution margin", value: "INSUFFICIENT DATA", evidence: "No revenue" },
  { metric: "Annual Contract Value (ACV)", value: "INSUFFICIENT DATA", evidence: "No contracts" },
  { metric: "Monthly Recurring Revenue (MRR)", value: "0", evidence: "No recurring contracts" },
  { metric: "Lifetime Value (LTV)", value: "INSUFFICIENT DATA", evidence: "No customer history" },
  { metric: "Payback period", value: "INSUFFICIENT DATA", evidence: "No customers" },
  { metric: "Churn rate", value: "INSUFFICIENT DATA", evidence: "No customers" },
  { metric: "Expansion rate", value: "INSUFFICIENT DATA", evidence: "No customers" },
  { metric: "Partner acquisition cost", value: "INSUFFICIENT DATA", evidence: "No partners acquired" },
];

export const UNIT_ECONOMICS_RULE = "Do NOT create false precision when there is insufficient data. Use INSUFFICIENT DATA where appropriate. Unit economics become meaningful only after 5-10 real customers.";

// ═══════════════════════════════════════════════════════════════
// PART 27 — CASH & FINANCIAL SURVIVAL
// ═══════════════════════════════════════════════════════════════

export type FinancialControl = {
  metric: string;
  value: string;
  alert: string;
};

export const FINANCIAL_SURVIVAL: FinancialControl[] = [
  { metric: "Cash balance (EGP)", value: "Founder-managed (private)", alert: "Founder-only visibility" },
  { metric: "Monthly burn (EGP)", value: "Founder-managed (private)", alert: "Track monthly" },
  { metric: "Committed expenses", value: "Founder-managed (private)", alert: "Track monthly" },
  { metric: "Expected revenue (EGP)", value: "0 (forecast)", alert: "0 expected until first customer" },
  { metric: "Collected revenue (EGP)", value: "0", alert: "0 collected" },
  { metric: "Runway (months)", value: "Founder-managed (private)", alert: "Alert if < 9 months" },
  { metric: "Unpaid invoices", value: "0", alert: "Track if invoices issued" },
  { metric: "Upcoming obligations", value: "Founder-managed (private)", alert: "Track monthly" },
  { metric: "Certification costs", value: "Forecast (SOC 2, ISO)", alert: "Budget for Q2-Q4 2027" },
  { metric: "Legal costs", value: "Forecast (law firm engagement)", alert: "Budget for partner engagement" },
  { metric: "Infrastructure costs", value: "Current (dev)", alert: "Scale with customers" },
  { metric: "Sales costs", value: "0 (Founder-led)", alert: "Scale with team" },
];

export const FINANCIAL_RULE = "The system must alert the Founder before financial constraints threaten execution. Cash + runway are Founder-private; the system tracks the discipline, not the private numbers.";

// ═══════════════════════════════════════════════════════════════
// PART 28 — NO-COST / LOW-COST EXECUTION PRIORITY
// ═══════════════════════════════════════════════════════════════

export type CostPriority = {
  priority: string;
  activities: string[];
  principle: string;
};

export const COST_PRIORITY: CostPriority[] = [
  {
    priority: "P0 — Free / near-free",
    activities: ["Direct outreach", "Founder-led meetings", "Strategic introductions", "Partner conversations", "Regulatory preparation", "Customer discovery", "Case-study preparation", "Documentation", "Evidence collection"],
    principle: "Prioritize free activities. Execution does not require expensive infrastructure.",
  },
  {
    priority: "P1 — Modest expenditure (revenue/credibility-linked)",
    activities: ["Legal fees for partner agreements", "Compliance/certification preparation", "Modest travel for high-value meetings", "CRM tooling"],
    principle: "Only spend where directly linked to revenue or institutional credibility.",
  },
  {
    priority: "P2 — Wait until revenue/funding",
    activities: ["Expensive infrastructure", "Large team hiring", "Premium tooling", "Paid marketing campaigns", "Office space"],
    principle: "Do NOT recommend expensive infrastructure merely because it is architecturally desirable.",
  },
];

// ═══════════════════════════════════════════════════════════════
// PART 29 — EXECUTION EVIDENCE LEDGER
// ═══════════════════════════════════════════════════════════════

export type EvidenceEvent = {
  eventType: string;
  fields: string[];
};

export const EVIDENCE_LEDGER_EVENTS: EvidenceEvent[] = [
  { eventType: "Meeting", fields: ["timestamp", "actor", "organization", "attendees", "purpose", "outcome", "next action", "evidence (notes/recording)"] },
  { eventType: "Proposal", fields: ["timestamp", "customer", "value", "terms", "status", "evidence (document)"] },
  { eventType: "Signed agreement", fields: ["timestamp", "counterparty", "type (MSA/pilot/partner)", "value", "evidence (executed copy)"] },
  { eventType: "Regulatory submission", fields: ["timestamp", "authority", "submission", "status", "evidence"] },
  { eventType: "Regulatory response", fields: ["timestamp", "authority", "response", "interpretation", "next action", "evidence"] },
  { eventType: "Customer onboarding", fields: ["timestamp", "customer", "milestones", "evidence (checklist)"] },
  { eventType: "Pilot milestone", fields: ["timestamp", "pilot", "milestone", "outcome", "evidence"] },
  { eventType: "Customer outcome", fields: ["timestamp", "customer", "outcome", "measurement", "evidence"] },
  { eventType: "Payment", fields: ["timestamp", "customer", "amount", "invoice", "evidence (receipt)"] },
  { eventType: "Incident", fields: ["timestamp", "severity", "description", "resolution", "evidence (postmortem)"] },
  { eventType: "Partnership activation", fields: ["timestamp", "partner", "type", "agreement", "evidence"] },
  { eventType: "Case study", fields: ["timestamp", "customer", "results", "consent", "evidence (published)"] },
  { eventType: "Certification milestone", fields: ["timestamp", "certification", "milestone", "evidence"] },
];

export const EVIDENCE_LEDGER_RULE = "Every material execution event creates evidence. Use the existing immutable/auditable infrastructure (CRE ledger, AuditLog) where appropriate. Current evidence events: 0 (execution begins now).";

// ═══════════════════════════════════════════════════════════════
// PART 30 — BRAIN AI EXECUTION CHIEF OF STAFF
// ═══════════════════════════════════════════════════════════════

export const BRAIN_AI_EXECUTION_ROLE = {
  role: "Execution Chief of Staff (not framework explainer)",
  behaviors: [
    { question: "What should I do today?", response: "Prioritize actual execution actions from the 90-day plan + Founder scorecard" },
    { question: "What is blocking AURIENTA?", response: "Identify actual blockers from the execution board + regulatory status + partner pipeline" },
    { question: "Who should I contact?", response: "Use actual relationship + account records (NEVER fabricate contacts)" },
    { question: "What evidence do we have?", response: "Retrieve approved evidence from Evidence Ledger" },
    { question: "What are we claiming without evidence?", response: "Identify unsupported claims (Execution Integrity Rule)" },
    { question: "Are we ready to scale?", response: "Use actual commercial, customer, regulatory, security, financial evidence (currently: NO)" },
    { question: "What should I stop doing?", response: "Identify low-value activities" },
    { question: "What is the highest-value Founder action?", response: "Prioritize by strategic impact + urgency" },
  ],
  fabricationProhibition: "Brain AI must NEVER fabricate: customers, partners, revenue, regulatory approval, certifications, contracts, meetings, testimonials, performance statistics, institutional relationships. Unknown information = UNKNOWN.",
};

// ═══════════════════════════════════════════════════════════════
// PART 32 — COMMERCIAL READINESS SCORE (evidence-driven, no inflation)
// ═══════════════════════════════════════════════════════════════

export type ReadinessCategory = {
  category: string;
  score: number; // 0-100, calculated from actual evidence
  evidence: string;
};

export const COMMERCIAL_READINESS_SCORE: ReadinessCategory[] = [
  { category: "Qualified pipeline", score: 0, evidence: "0 qualified accounts (methodology ready, research pending)" },
  { category: "Signed customers", score: 0, evidence: "0 signed customers" },
  { category: "Active pilots", score: 0, evidence: "0 active pilots" },
  { category: "Successful pilots", score: 0, evidence: "0 successful pilots" },
  { category: "Recurring revenue", score: 0, evidence: "0 recurring revenue" },
  { category: "Collections", score: 0, evidence: "0 collected revenue" },
  { category: "Customer retention", score: 0, evidence: "INSUFFICIENT DATA (no customers)" },
  { category: "Customer satisfaction", score: 0, evidence: "INSUFFICIENT DATA (no customers)" },
  { category: "Strategic partners", score: 0, evidence: "0 signed partners" },
  { category: "Regulatory engagement", score: 5, evidence: "Companies + Tax approved; FRA/CBE/PDPL pending" },
  { category: "Security readiness", score: 74, evidence: "PH-ER security score (existing)" },
  { category: "Evidence quality", score: 0, evidence: "0 execution evidence events" },
  { category: "Sales cycle", score: 0, evidence: "INSUFFICIENT DATA (no sales yet)" },
  { category: "Unit economics", score: 0, evidence: "INSUFFICIENT DATA" },
  { category: "Founder execution capacity", score: 80, evidence: "Founder fully engaged; architecture complete; execution beginning" },
];

export const OVERALL_COMMERCIAL_READINESS =
  Math.round(COMMERCIAL_READINESS_SCORE.reduce((s, c) => s + c.score, 0) / COMMERCIAL_READINESS_SCORE.length);

export const READINESS_RULE = "No subjective inflation. Score calculated from actual evidence. Current overall: LOW (honest). Will rise only with real execution outcomes.";

// ═══════════════════════════════════════════════════════════════
// PART 33 — MARKET VALIDATION GATES (7 gates)
// ═══════════════════════════════════════════════════════════════

export type ValidationGate = {
  gate: string;
  name: string;
  criteria: string;
  status: "NOT PASSED" | "IN PROGRESS" | "PASSED";
  evidence: string;
};

export const MARKET_VALIDATION_GATES: ValidationGate[] = [
  { gate: "GATE 1", name: "Market Interest", criteria: "Meaningful qualified customer discovery", status: "IN PROGRESS", evidence: "Methodology defined; outreach beginning" },
  { gate: "GATE 2", name: "Commercial Validation", criteria: "Customers demonstrate willingness to sign/pay", status: "NOT PASSED", evidence: "0 signed customers" },
  { gate: "GATE 3", name: "Pilot Validation", criteria: "Real enterprises successfully deploy AURIENTA", status: "NOT PASSED", evidence: "0 pilots" },
  { gate: "GATE 4", name: "Revenue Validation", criteria: "Actual money is collected", status: "NOT PASSED", evidence: "0 collected revenue" },
  { gate: "GATE 5", name: "Repeatability", criteria: "Multiple customers achieve similar outcomes", status: "NOT PASSED", evidence: "INSUFFICIENT DATA" },
  { gate: "GATE 6", name: "Institutional Validation", criteria: "Partners/regulators/institutions recognize credibility", status: "NOT PASSED", evidence: "0 formal institutional recognition" },
  { gate: "GATE 7", name: "Scale", criteria: "Unit economics + operational capacity support expansion", status: "NOT PASSED", evidence: "INSUFFICIENT DATA" },
];

export const GATE_RULE = "AURIENTA must NOT advance to a gate based solely on management opinion. Gates pass only with objective evidence. Current: Gate 1 IN PROGRESS; Gates 2-7 NOT PASSED.";

// ═══════════════════════════════════════════════════════════════
// PART 34 — GLOBAL EXPANSION RULE
// ═══════════════════════════════════════════════════════════════

export const GLOBAL_EXPANSION_RULE = {
  rule: "Do NOT expand internationally simply because the roadmap says to. A country becomes eligible only when ALL of the following are true:",
  eligibilityCriteria: [
    "Domestic execution evidence exists (successful pilots + revenue)",
    "Customer demand exists in target country",
    "Partner support exists in target country",
    "Legal feasibility exists (local law firm + entity)",
    "Regulatory feasibility exists (no blockers)",
    "Commercial economics make sense",
    "Operational support exists (team + infrastructure)",
  ],
  currentStatus: "NOT ELIGIBLE for any international market. Domestic (Egypt) execution must produce evidence first.",
};

// ═══════════════════════════════════════════════════════════════
// PART 40 — FINAL EXECUTION CERTIFICATION STANDARD (honest)
// ═══════════════════════════════════════════════════════════════

export type CertificationLevel = {
  level: string;
  requirement: string;
  achieved: boolean;
  evidence: string;
};

export const CERTIFICATION_LEVELS: CertificationLevel[] = [
  { level: "ARCHITECTURALLY COMPLETE", requirement: "All 11 architecture phases complete", achieved: true, evidence: "Phases 1-11 frozen + synchronized" },
  { level: "EXECUTION-READY", requirement: "Execution machinery works (this phase)", achieved: true, evidence: "MES v1.0 complete: CRM schema, pipeline, trackers, board, scorecard, 90-day plan" },
  { level: "PILOT-VALIDATED", requirement: "Objective pilot evidence", achieved: false, evidence: "0 pilots completed" },
  { level: "COMMERCIALLY VALIDATED", requirement: "Real paying customers + repeatable outcomes", achieved: false, evidence: "0 paying customers; 0 collected revenue" },
  { level: "INSTITUTIONALLY VALIDATED", requirement: "Substantial external institutional evidence", achieved: false, evidence: "0 formal institutional recognition; 0 certifications issued" },
  { level: "SCALE-READY", requirement: "Commercial + operational + regulatory + financial + security evidence supports scaling", achieved: false, evidence: "INSUFFICIENT DATA — requires Gates 1-7 passage" },
];

export const FINAL_CERTIFICATION_MES = {
  title: "AURIENTA MARKET EXECUTION SYSTEM v1.0 — HONEST EXECUTIVE CERTIFICATION",
  statement: "Per the Final Execution Certification Standard, the strongest certification the evidence supports is:",
  achievedLevels: CERTIFICATION_LEVELS.filter(l => l.achieved).map(l => l.level),
  notAchievedLevels: CERTIFICATION_LEVELS.filter(l => !l.achieved).map(l => l.level),
  verdict: "ARCHITECTURALLY COMPLETE + EXECUTION-READY",
  honestStatement: "AURIENTA is ARCHITECTURALLY COMPLETE (11 phases) and EXECUTION-READY (market execution machinery works). AURIENTA is NOT pilot-validated, NOT commercially validated, NOT institutionally validated, and NOT scale-ready. These levels require real-world evidence that does not yet exist. No claim of commercial validation, customer traction, revenue, regulatory approval, or certification may be made without evidence. EXECUTION NOW HAS PRIORITY OVER ARCHITECTURE.",
  metrics: {
    customers: 0,
    partners: 0,
    pilots: 0,
    collectedRevenue: 0,
    certifications: 0,
    caseStudies: 0,
    regulatoryRecognitions: 0,
    marketValidationGatesPassed: 0,
    commercialReadinessScore: OVERALL_COMMERCIAL_READINESS,
  },
  next10HighestValueActions: [
    "1. Build target account list — identify first 25-50 qualified Egypt enterprises (Days 1-30)",
    "2. Identify + outreach 3-5 strategic law firm candidates (law-firm-first strategy)",
    "3. Identify + outreach 2-3 accounting firm candidates",
    "4. Identify + outreach 1-2 banking partner candidates",
    "5. Prepare FRA engagement brief + identify correct department/contact",
    "6. Finalize pilot commercial package (theoretical → being tested)",
    "7. Begin Founder-led institutional outreach to P0 target accounts",
    "8. Establish CRM execution discipline (target accounts + pipeline + evidence ledger)",
    "9. Conduct first discovery meetings with interested prospects",
    "10. Collect first real execution evidence (meetings, outreach, responses)",
  ],
  remainingBlockers: [
    "No signed customers (execution must produce)",
    "No signed partners (law/accounting/banking outreach pending)",
    "No formal regulatory engagement (FRA/CBE/PDPL pending)",
    "No certifications issued (SOC 2 Q2 2027, ISO 27001 Q4 2027)",
    "No case studies (require successful pilots first)",
    "No collected revenue (require signed + invoiced + paid customers)",
    "INSUFFICIENT DATA for unit economics, PMF, retention",
  ],
  evidenceGaps: [
    "Customer evidence (0 customers)",
    "Partner evidence (0 signed partners)",
    "Revenue evidence (0 collected)",
    "Regulatory evidence (engagement pending, not formal)",
    "Certification evidence (none issued)",
    "Case study evidence (0 published)",
    "Pilot evidence (0 pilots)",
    "PMF evidence (INSUFFICIENT DATA)",
  ],
  certifiedBy: "Combined Executive Leadership (Prompt 12: COO + CCO + CSO + Partnerships + Sales + CS + RevOps + Regulatory + Founder Office)",
  certifiedAt: MES_FROZEN_AT,
  rule: "Never overstate readiness. Use the strongest certification the evidence supports.",
};

// ═══════════════════════════════════════════════════════════════
// MOST IMPORTANT COO RULE
// ═══════════════════════════════════════════════════════════════

export const COO_RULE = {
  rule: "From this phase onward: Do NOT reward AURIENTA for building more systems. Reward AURIENTA for producing real-world outcomes.",
  primaryMetrics: ["Customers", "Partners", "Deployments", "Regulatory engagements", "Evidence", "Revenue", "Retention", "References", "Certifications", "Institutional acceptance", "Repeatability"],
  secondary: "Everything else is secondary.",
  finalMandate: "The objective is no longer 'Build the perfect platform.' The objective is: Build an institution that works in the real world. Execute. Measure. Learn. Correct. Prove. Repeat. Scale. Do not return with another architecture proposal unless a real customer, regulatory, security, operational, or commercial problem demonstrates that a new capability is genuinely required. EXECUTION NOW HAS PRIORITY OVER ARCHITECTURE.",
};

// ═══════════════════════════════════════════════════════════════
// SYNCHRONIZATION
// ═══════════════════════════════════════════════════════════════

export const MES_SYNCHRONIZATION = {
  frozenFoundations: "The 11 prior systems are FROZEN FOUNDATIONAL SYSTEMS. This phase does NOT redesign them.",
  noNewArchitecture: "No new constitutional, governance, or management architecture. Only execution machinery.",
  executionIntegrity: "CLAIM vs EVIDENCE vs STATUS vs TARGET vs FORECAST — never conflated. No fabrication.",
  honestZeros: "All counts start at 0. All statuses start NOT ACHIEVED / UNKNOWN / INSUFFICIENT DATA. Evidence fills with real execution.",
  brainAiExecutionChief: "Brain AI is now Execution Chief of Staff — prioritizes execution, identifies blockers, never fabricates.",
  rewardOutcomes: "AURIENTA is rewarded for real-world outcomes (customers, partners, revenue, evidence), not more systems.",
};
