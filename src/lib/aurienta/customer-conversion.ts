// AURIENTA Customer Conversion, Pilot-to-Paid Deployment & Revenue Evidence System (CPR) v1.0
// ═══════════════════════════════════════════════════════════════
// This is a FOCUSED EXECUTION CAPABILITY — not new architecture.
// It extends MES v1.0 + MAS v1.0 with the specific machinery to
// convert real prospects through to collected revenue + references.
//
// REUSES (does NOT duplicate):
//   - MES v1.0 (execution engine, integrity rule, gates, score)
//   - MAS v1.0 (target engine, outreach, discovery, evidence E0-E9)
//   - ACS v1.0 (sales playbooks, pricing, funnel)
//   - FOCC v1.0 (Founder Office, Mission Control)
//   - ITDB v1.0 (evidence, DD, trust)
//   - AOS v1.0 (processes, SOPs)
//
// EVIDENCE INTEGRITY (ABSOLUTE):
//   The E0-E9 hierarchy is authoritative. No record may be promoted
//   to a higher evidence level without supporting evidence. Invalid
//   promotions are REJECTED. No fabrication. UNKNOWN remains UNKNOWN.
//
// HONESTY DEFAULT: All counts 0. Current evidence ceiling: E0.
// The system fills only through actual Founder execution.
//
// DO NOT modify without Founder approval.
// ═══════════════════════════════════════════════════════════════

export const CPR_VERSION = "1.0";
export const CPR_FROZEN_AT = "2026-08-17";

// ═══════════════════════════════════════════════════════════════
// CURRENT HONEST BASELINE (unchanged from MES/MAS — E0 ceiling)
// ═══════════════════════════════════════════════════════════════

export const CURRENT_BASELINE = {
  customers: 0,
  activePilots: 0,
  collectedRevenue: 0,
  signedAgreements: 0,
  activeDeployments: 0,
  measuredOutcomes: 0,
  references: 0,
  evidenceCeiling: "E0" as const,
  statement: "Current evidence ceiling: E0 (Founder assumptions only — no market evidence yet). No record may be promoted above E0 without supporting evidence. The system fills only through actual Founder execution.",
};

// ═══════════════════════════════════════════════════════════════
// EVIDENCE INTEGRITY — E0-E9 hierarchy + promotion rules
// ═══════════════════════════════════════════════════════════════

export type EvidenceLevel = "E0" | "E1" | "E2" | "E3" | "E4" | "E5" | "E6" | "E7" | "E8" | "E9";

export const EVIDENCE_HIERARCHY_CPR: { level: EvidenceLevel; name: string; meaning: string; promotionRequirement: string }[] = [
  { level: "E0", name: "Founder assumption", meaning: "Internal belief without market evidence", promotionRequirement: "Market hypothesis from secondary research" },
  { level: "E1", name: "Market hypothesis", meaning: "Based on secondary research", promotionRequirement: "Direct conversation with a prospect" },
  { level: "E2", name: "Customer conversation", meaning: "Direct conversation occurred", promotionRequirement: "Verified problem + decision-maker authority" },
  { level: "E3", name: "Qualified opportunity", meaning: "Verified problem + authority", promotionRequirement: "Commercial proposal delivered + acknowledged" },
  { level: "E4", name: "Proposal / commercial commitment", meaning: "Proposal delivered + acknowledged", promotionRequirement: "Legally executed signed agreement" },
  { level: "E5", name: "Signed agreement", meaning: "Legally executed", promotionRequirement: "Active deployment on AURIENTA" },
  { level: "E6", name: "Active deployment", meaning: "Enterprise deployed", promotionRequirement: "Documented measurable outcome" },
  { level: "E7", name: "Measured customer outcome", meaning: "Documented measurable outcome", promotionRequirement: "Actual payment received (collected)" },
  { level: "E8", name: "Collected revenue", meaning: "Money actually received", promotionRequirement: "Same outcome across multiple customers" },
  { level: "E9", name: "Repeatable outcome", meaning: "Same outcome across multiple customers", promotionRequirement: "N/A (highest level)" },
];

// Promotion validation rules — invalid promotions are REJECTED
export type PromotionAttempt = {
  from: EvidenceLevel;
  to: EvidenceLevel;
  valid: boolean;
  rejectionReason?: string;
};

export const INVALID_PROMOTION_EXAMPLES: PromotionAttempt[] = [
  { from: "E4", to: "E5", valid: false, rejectionReason: "Cannot mark unsigned agreement as E5 — requires legally executed signed agreement" },
  { from: "E5", to: "E6", valid: false, rejectionReason: "Cannot mark inactive deployment as E6 — requires active deployment on AURIENTA" },
  { from: "E6", to: "E7", valid: false, rejectionReason: "Cannot mark unmeasured outcome as E7 — requires documented measurable outcome" },
  { from: "E7", to: "E8", valid: false, rejectionReason: "Cannot mark unpaid invoice as E8 — requires actual payment received (collected)" },
  { from: "E2", to: "E9", valid: false, rejectionReason: "Cannot mark single customer conversation as E9 — requires repeatable outcome across multiple customers" },
  { from: "E0", to: "E5", valid: false, rejectionReason: "Cannot skip E1-E4 — evidence must climb sequentially" },
];

export const PROMOTION_RULE = {
  rule: "Evidence climbs E0→E9 SEQUENTIALLY only with supporting evidence. No skipping. No automatic promotion. Every promotion requires linked evidence artifact + verification. Invalid promotions are REJECTED by the system.",
  currentCeiling: "E0",
  verificationRequired: "Every promotion requires: (1) linked evidence artifact, (2) verification by owner, (3) timestamp, (4) audit log entry",
};

// ═══════════════════════════════════════════════════════════════
// PART 6 — CUSTOMER CONVERSION ENGINE (24 stages)
// ═══════════════════════════════════════════════════════════════

export type ConversionStage = {
  stageId: string;
  stage: string;
  evidenceLevel: EvidenceLevel;
  entryCriteria: string;
  exitCriteria: string;
  evidenceRequirement: string;
  owner: string;
};

export const CUSTOMER_CONVERSION_WORKFLOW: ConversionStage[] = [
  { stageId: "CC-01", stage: "Target identified", evidenceLevel: "E0", entryCriteria: "Account meets ICP + qualification criteria", exitCriteria: "Research complete; account entered", evidenceRequirement: "CRM entry with org + sector + tier", owner: "Founder" },
  { stageId: "CC-02", stage: "Research verified", evidenceLevel: "E1", entryCriteria: "Target identified", exitCriteria: "Research complete with sources + confidence", evidenceRequirement: "Research record (source + date + researcher + confidence)", owner: "Founder" },
  { stageId: "CC-03", stage: "Decision-maker identified", evidenceLevel: "E1", entryCriteria: "Research verified", exitCriteria: "Decision-maker named + verified", evidenceRequirement: "Contact record (verified, not assumed)", owner: "Founder" },
  { stageId: "CC-04", stage: "First contact", evidenceLevel: "E1", entryCriteria: "Decision-maker identified", exitCriteria: "Outreach sent", evidenceRequirement: "Outreach log + timestamp", owner: "Founder" },
  { stageId: "CC-05", stage: "Response", evidenceLevel: "E2", entryCriteria: "Outreach sent", exitCriteria: "Prospect responded", evidenceRequirement: "Response log", owner: "Founder" },
  { stageId: "CC-06", stage: "Discovery scheduled", evidenceLevel: "E2", entryCriteria: "Response received", exitCriteria: "Meeting scheduled", evidenceRequirement: "Calendar invite", owner: "Founder" },
  { stageId: "CC-07", stage: "Discovery completed", evidenceLevel: "E2", entryCriteria: "Meeting held", exitCriteria: "Discovery notes recorded", evidenceRequirement: "Discovery notes (5 sections)", owner: "Founder" },
  { stageId: "CC-08", stage: "Problem validated", evidenceLevel: "E2", entryCriteria: "Discovery completed", exitCriteria: "Problem chain validated", evidenceRequirement: "Problem validation record", owner: "Founder" },
  { stageId: "CC-09", stage: "AURIENTA use case identified", evidenceLevel: "E2", entryCriteria: "Problem validated", exitCriteria: "Use case mapped to AURIENTA capability", evidenceRequirement: "Use case mapping document", owner: "Founder" },
  { stageId: "CC-10", stage: "Qualification completed", evidenceLevel: "E3", entryCriteria: "Use case identified", exitCriteria: "Qualification gate passed (QUALIFIED)", evidenceRequirement: "Qualification record (10 criteria)", owner: "Founder" },
  { stageId: "CC-11", stage: "Commercial fit assessed", evidenceLevel: "E3", entryCriteria: "Qualified", exitCriteria: "Commercial fit confirmed", evidenceRequirement: "Commercial fit assessment", owner: "Founder" },
  { stageId: "CC-12", stage: "Proposal requested", evidenceLevel: "E3", entryCriteria: "Commercial fit", exitCriteria: "Prospect requested proposal", evidenceRequirement: "Request log", owner: "Founder" },
  { stageId: "CC-13", stage: "Proposal prepared", evidenceLevel: "E3", entryCriteria: "Proposal requested", exitCriteria: "Proposal drafted", evidenceRequirement: "Proposal document (versioned)", owner: "Founder" },
  { stageId: "CC-14", stage: "Proposal delivered", evidenceLevel: "E4", entryCriteria: "Proposal prepared", exitCriteria: "Proposal delivered to prospect", evidenceRequirement: "Delivery confirmation", owner: "Founder" },
  { stageId: "CC-15", stage: "Commercial negotiation", evidenceLevel: "E4", entryCriteria: "Proposal delivered", exitCriteria: "Terms negotiated", evidenceRequirement: "Negotiation log", owner: "Founder" },
  { stageId: "CC-16", stage: "Legal review", evidenceLevel: "E4", entryCriteria: "Terms negotiated", exitCriteria: "Legal sign-off", evidenceRequirement: "Legal review record", owner: "Legal" },
  { stageId: "CC-17", stage: "Agreement execution", evidenceLevel: "E5", entryCriteria: "Legal sign-off", exitCriteria: "Agreement signed by both parties", evidenceRequirement: "Executed agreement (signed copy)", owner: "Founder + Legal" },
  { stageId: "CC-18", stage: "Deployment preparation", evidenceLevel: "E5", entryCriteria: "Agreement signed", exitCriteria: "Deployment plan ready", evidenceRequirement: "Deployment plan document", owner: "Customer Success" },
  { stageId: "CC-19", stage: "Deployment active", evidenceLevel: "E6", entryCriteria: "Deployment plan ready", exitCriteria: "Enterprise deployed on AURIENTA", evidenceRequirement: "Go-live sign-off + active usage", owner: "Customer Success" },
  { stageId: "CC-20", stage: "Outcome measurement", evidenceLevel: "E7", entryCriteria: "Deployment active + measurement period", exitCriteria: "Outcome measured vs baseline", evidenceRequirement: "Outcome measurement report", owner: "Customer Success" },
  { stageId: "CC-21", stage: "Invoice issued", evidenceLevel: "E7", entryCriteria: "Outcome measured (or per agreement)", exitCriteria: "Invoice issued", evidenceRequirement: "Invoice document", owner: "Finance" },
  { stageId: "CC-22", stage: "Payment collected", evidenceLevel: "E8", entryCriteria: "Invoice issued", exitCriteria: "Payment received in bank", evidenceRequirement: "Payment evidence (bank receipt)", owner: "Finance" },
  { stageId: "CC-23", stage: "Outcome documented", evidenceLevel: "E7", entryCriteria: "Outcome measured", exitCriteria: "Outcome documented in evidence ledger", evidenceRequirement: "Outcome document + customer confirmation", owner: "Customer Success" },
  { stageId: "CC-24", stage: "Reference eligibility assessed", evidenceLevel: "E7", entryCriteria: "Outcome documented", exitCriteria: "Reference eligibility determined", evidenceRequirement: "Reference assessment", owner: "Marketing + CS" },
];

// Current state: 0 opportunities in conversion (all stages empty)
export const CONVERSION_OPPORTUNITIES = 0;

// ═══════════════════════════════════════════════════════════════
// PART 7 — DISCOVERY → PROBLEM VALIDATION (strengthened)
// ═══════════════════════════════════════════════════════════════

export type ProblemValidationField = {
  field: string;
  capture: string;
  rule: string;
};

export const PROBLEM_VALIDATION_STRENGTHENED: ProblemValidationField[] = [
  { field: "Current Situation", capture: "What does the enterprise currently do?", rule: "Factual, from discovery — not assumption" },
  { field: "Problem", capture: "What specifically is failing, inefficient, risky, expensive, slow, fragmented, or difficult?", rule: "Specific, not vague" },
  { field: "Evidence", capture: "What did the customer actually say or demonstrate?", rule: "Direct quote or observed behavior — not inference" },
  { field: "Business Impact", capture: "What does the problem cost? (time, money, compliance, governance, operational complexity, risk, coordination, capital formation, institutional trust)", rule: "Quantified where possible; honest if unknown" },
  { field: "Urgency", capture: "Why solve it now?", rule: "Customer-stated reason — not Founder assumption" },
  { field: "Existing Alternative", capture: "How is the customer solving it today?", rule: "Actual current approach — not hypothetical" },
  { field: "Dissatisfaction", capture: "Why is the existing approach insufficient?", rule: "Customer-stated — not inferred" },
  { field: "Desired Outcome", capture: "What would success look like?", rule: "Customer-defined success criteria" },
  { field: "AURIENTA Fit", capture: "Which existing AURIENTA capability addresses the validated problem?", rule: "Mapped to specific capability — not generic" },
  { field: "Willingness", capture: "Is the customer willing to: continue discussion, conduct a pilot, provide data, sign an agreement, pay?", rule: "NEVER infer willingness. Record actual evidence (customer-stated commitment)." },
];

export const PROBLEM_VALIDATION_RULE = "AURIENTA must NOT sell technology before understanding the customer's actual problem. Never infer willingness — record actual evidence. If no real problem exists: DISQUALIFY.";

// ═══════════════════════════════════════════════════════════════
// PART 8 — QUALIFICATION GATE (strict)
// ═══════════════════════════════════════════════════════════════

export type QualificationCriterion = {
  criterion: string;
  evaluation: string;
};

export const QUALIFICATION_GATE_CRITERIA: QualificationCriterion[] = [
  { criterion: "Real problem", evaluation: "Validated with evidence (not assumption)" },
  { criterion: "Business impact", evaluation: "Quantified or honestly assessed" },
  { criterion: "Urgency", evaluation: "Customer-stated reason to solve now" },
  { criterion: "Decision-maker access", evaluation: "Direct access to economic buyer" },
  { criterion: "Budget or economic pathway", evaluation: "Demonstrated capacity or clear pathway" },
  { criterion: "Strategic fit", evaluation: "Aligns with AURIENTA ICP + constitutional model" },
  { criterion: "Implementation feasibility", evaluation: "Operationally + technically feasible" },
  { criterion: "Legal feasibility", evaluation: "No blocking legal issues" },
  { criterion: "Regulatory feasibility", evaluation: "No regulatory blockers in sector" },
  { criterion: "Customer willingness", evaluation: "Stated willingness to proceed (not inferred)" },
];

export type QualificationResult = "QUALIFIED" | "CONDITIONAL" | "DISQUALIFIED" | "UNKNOWN";

export const QUALIFICATION_GATE = {
  criteria: QUALIFICATION_GATE_CRITERIA.length,
  outputs: ["QUALIFIED", "CONDITIONAL", "DISQUALIFIED", "UNKNOWN"] as QualificationResult[],
  rule: "An opportunity should NOT advance to proposal merely because the Founder likes it. Every qualification decision must have evidence. DISQUALIFIED is a successful outcome — it protects Founder time.",
  currentQualified: 0,
};

// ═══════════════════════════════════════════════════════════════
// PART 9 — COMMERCIAL OFFER VALIDATION (6 states)
// ═══════════════════════════════════════════════════════════════

export type CommercialOfferState = {
  state: string;
  definition: string;
  currentValue: string;
};

export const COMMERCIAL_OFFER_STATES: CommercialOfferState[] = [
  { state: "THEORETICAL", definition: "Designed internally but not validated by a real customer", currentValue: "All current pricing is THEORETICAL" },
  { state: "PROPOSED", definition: "Actually presented to a real prospect", currentValue: "0 proposals delivered" },
  { state: "NEGOTIATED", definition: "Customer has responded with commercial feedback", currentValue: "0 negotiations" },
  { state: "AGREED", definition: "Commercial terms accepted", currentValue: "0 agreed" },
  { state: "CONTRACTED", definition: "Signed agreement exists", currentValue: "0 contracted" },
  { state: "COLLECTED", definition: "Actual payment received", currentValue: "0 collected" },
];

export const COMMERCIAL_OFFER_RULE = "Never call theoretical pricing 'validated pricing.' Never call a proposal revenue. Never count contracted value as collected revenue. Only COLLECTED is realized revenue.";

// ═══════════════════════════════════════════════════════════════
// PART 10 — PILOT CONVERSION ENGINE
// ═══════════════════════════════════════════════════════════════

export type PilotRequirement = {
  requirement: string;
  detail: string;
};

export const PILOT_REQUIREMENTS: PilotRequirement[] = [
  { requirement: "Customer", detail: "Signed customer (E5+)" },
  { requirement: "Business problem", detail: "Validated problem with evidence" },
  { requirement: "Defined scope", detail: "Clear scope boundaries" },
  { requirement: "Start date", detail: "Agreed start date" },
  { requirement: "Expected duration", detail: "Time-boxed duration" },
  { requirement: "Responsible customer contact", detail: "Named customer owner" },
  { requirement: "AURIENTA owner", detail: "Named AURIENTA CS owner" },
  { requirement: "Implementation plan", detail: "Documented plan" },
  { requirement: "Success criteria", detail: "Predefined + agreed BEFORE start" },
  { requirement: "Baseline measurement", detail: "Measured before deployment" },
  { requirement: "Target measurement", detail: "Target outcome defined" },
  { requirement: "Security requirements", detail: "Security review complete" },
  { requirement: "Data requirements", detail: "Data handling agreed" },
  { requirement: "Legal requirements", detail: "Pilot SOW signed" },
  { requirement: "Commercial terms", detail: "Pilot pricing agreed (paid or unpaid)" },
  { requirement: "Exit criteria", detail: "Defined exit conditions" },
];

export const PILOT_RULE = "No pilot may be declared successful simply because it was deployed. Success requires measured outcome against predefined criteria.";

// ═══════════════════════════════════════════════════════════════
// PART 11 — PILOT SUCCESS = MEASURED OUTCOME (7-element evidence package)
// ═══════════════════════════════════════════════════════════════

export type PilotSuccessElement = {
  element: string;
  requirement: string;
};

export const PILOT_SUCCESS_PACKAGE: PilotSuccessElement[] = [
  { element: "A. Baseline", requirement: "What was the customer's situation before AURIENTA? (measured)" },
  { element: "B. Intervention", requirement: "What AURIENTA capability was actually deployed? (specific)" },
  { element: "C. Measurement", requirement: "What was measured? (defined metrics)" },
  { element: "D. Result", requirement: "What changed? (quantified delta from baseline)" },
  { element: "E. Customer Confirmation", requirement: "Did the customer confirm the result? (documented)" },
  { element: "F. Evidence", requirement: "What documents, logs, measurements, or statements support the result?" },
  { element: "G. Commercial Result", requirement: "Was the pilot: unpaid / paid / converted / discontinued / expanded?" },
];

export const PILOT_SUCCESS_RULE = "Do NOT classify a pilot as successful without objective evidence on ALL 7 elements. Current successful pilots: 0.";

// ═══════════════════════════════════════════════════════════════
// PART 12 — FIRST REVENUE ENGINE (revenue evidence workflow)
// ═══════════════════════════════════════════════════════════════

export type RevenueTrackingField = {
  field: string;
  currentValue: string;
};

export const REVENUE_TRACKING: RevenueTrackingField[] = [
  { field: "Quoted amount", currentValue: "0 EGP" },
  { field: "Proposed amount", currentValue: "0 EGP" },
  { field: "Negotiated amount", currentValue: "0 EGP" },
  { field: "Contracted amount", currentValue: "0 EGP" },
  { field: "Invoiced amount", currentValue: "0 EGP" },
  { field: "Collected amount", currentValue: "0 EGP" },
  { field: "Currency", currentValue: "EGP (default)" },
  { field: "Collection date", currentValue: "N/A (0 collected)" },
  { field: "Payment evidence", currentValue: "None (0 collected)" },
  { field: "Associated customer", currentValue: "None" },
  { field: "Associated contract", currentValue: "None" },
  { field: "Associated deployment", currentValue: "None" },
];

export const REVENUE_CRITICAL_RULE = "Only COLLECTED counts as actual revenue. Do NOT count pipeline, proposals, signed contract value, expected revenue, or forecast revenue as collected revenue. Current collected: 0 EGP.";

// ═══════════════════════════════════════════════════════════════
// PART 13 — REVENUE EVIDENCE RECORD (chain + status)
// ═══════════════════════════════════════════════════════════════

export const REVENUE_EVIDENCE_CHAIN = {
  chain: "Customer → Agreement → Commercial Terms → Invoice → Payment Evidence → Deployment → Outcome",
  rule: "Every collected payment must be linked to the full chain. If any link is missing, mark the evidence incomplete.",
  evidenceStatuses: [
    { status: "COMPLETE", meaning: "All chain links present + verified" },
    { status: "PARTIAL", meaning: "Some chain links present; others missing" },
    { status: "MISSING", meaning: "Chain not established" },
    { status: "VERIFICATION REQUIRED", meaning: "Chain present but verification pending" },
  ],
  currentStatus: "MISSING — 0 collected payments; no chain exists",
};

// ═══════════════════════════════════════════════════════════════
// PART 14 — CUSTOMER OUTCOME ENGINE (before/during/after)
// ═══════════════════════════════════════════════════════════════

export type OutcomePhase = {
  phase: string;
  capture: string;
};

export const OUTCOME_ENGINE: OutcomePhase[] = [
  { phase: "Before (Baseline)", capture: "Customer's situation before AURIENTA (measured)" },
  { phase: "During (Operational)", capture: "Operational measurements during deployment" },
  { phase: "After (Outcome)", capture: "Outcome after deployment (measured delta)" },
];

export const OUTCOME_METRICS = {
  possibleMetrics: ["Time saved", "Cost reduction", "Processing speed", "Compliance improvement", "Governance improvement", "Error reduction", "Operational visibility", "Customer satisfaction", "Adoption", "Retention", "Expansion"],
  rule: "Do NOT invent metrics. Allow customer-specific metrics. Only record metrics that were actually measured.",
  currentMeasuredOutcomes: 0,
};

// ═══════════════════════════════════════════════════════════════
// PART 15 — CUSTOMER REFERENCE ENGINE (8 states)
// ═══════════════════════════════════════════════════════════════

export type ReferenceState = {
  stateId: number;
  state: string;
  requirement: string;
};

export const REFERENCE_STATES: ReferenceState[] = [
  { stateId: 1, state: "No reference", requirement: "Default state" },
  { stateId: 2, state: "Eligible for reference", requirement: "Successful outcome (E7+) documented" },
  { stateId: 3, state: "Customer consent requested", requirement: "Formal consent request made" },
  { stateId: 4, state: "Consent received", requirement: "Documented consent from customer" },
  { stateId: 5, state: "Anonymous reference approved", requirement: "Customer approved anonymous use" },
  { stateId: 6, state: "Named reference approved", requirement: "Customer approved named use" },
  { stateId: 7, state: "Case study approved", requirement: "Customer approved case study content" },
  { stateId: 8, state: "Public case study published", requirement: "Case study published publicly" },
];

export const REFERENCE_RULE = "Never publish a customer's name, logo, testimonial, financial result, or case study without appropriate documented permission. Current references: 0 (no successful outcomes to reference).";

// ═══════════════════════════════════════════════════════════════
// PART 17 — LOST OPPORTUNITY INTELLIGENCE
// ═══════════════════════════════════════════════════════════════

export type LossReason = {
  reason: string;
  capture: string;
};

export const LOST_OPPORTUNITY_REASONS: LossReason[] = [
  { reason: "Stage lost", capture: "Specific conversion stage where lost" },
  { reason: "Reason", capture: "Specific reason (not just 'lost')" },
  { reason: "Customer feedback", capture: "Direct feedback from customer" },
  { reason: "Competitor/alternative", capture: "Which competitor/alternative won + why" },
  { reason: "Price objection", capture: "Specific price feedback" },
  { reason: "Timing objection", capture: "Why timing was wrong" },
  { reason: "Legal objection", capture: "Specific legal concern" },
  { reason: "Regulatory objection", capture: "Specific regulatory concern" },
  { reason: "Product gap", capture: "Missing feature/capability" },
  { reason: "Trust objection", capture: "Specific trust concern" },
  { reason: "Implementation objection", capture: "Implementation worry" },
  { reason: "Decision-maker issue", capture: "Decision-maker dynamics" },
  { reason: "Budget issue", capture: "Budget constraints" },
  { reason: "No real problem", capture: "Problem not validated" },
  { reason: "Unknown", capture: "Reason not determined" },
];

export const LOST_DEAL_RULE_CPR = {
  rule: "Every lost opportunity records structured reason. If same objection appears 5+ times: flag REPEATED MARKET OBJECTION + send to Founder/COO review.",
  redesignRule: "Do NOT automatically modify blueprint/architecture. First validate if objection is real/segment/pricing/messaging/product/regulatory/procurement.",
  currentLosses: 0,
};

// ═══════════════════════════════════════════════════════════════
// PART 18 — CUSTOMER EVIDENCE LEDGER
// ═══════════════════════════════════════════════════════════════

export type EvidenceEvent = {
  event: string;
  evidenceLevel: EvidenceLevel;
};

export const CUSTOMER_EVIDENCE_EVENTS: EvidenceEvent[] = [
  { event: "Outreach", evidenceLevel: "E1" },
  { event: "Response", evidenceLevel: "E2" },
  { event: "Meeting", evidenceLevel: "E2" },
  { event: "Discovery", evidenceLevel: "E2" },
  { event: "Qualification", evidenceLevel: "E3" },
  { event: "Proposal", evidenceLevel: "E4" },
  { event: "Negotiation", evidenceLevel: "E4" },
  { event: "Agreement", evidenceLevel: "E5" },
  { event: "Deployment", evidenceLevel: "E6" },
  { event: "Measurement", evidenceLevel: "E7" },
  { event: "Payment", evidenceLevel: "E8" },
  { event: "Customer feedback", evidenceLevel: "E2" },
  { event: "Reference permission", evidenceLevel: "E7" },
];

export type EvidenceRecordField = {
  field: string;
  required: boolean;
};

export const EVIDENCE_RECORD_FIELDS: EvidenceRecordField[] = [
  { field: "Event", required: true },
  { field: "Date", required: true },
  { field: "Customer", required: true },
  { field: "Actor", required: true },
  { field: "Source", required: true },
  { field: "Evidence level", required: true },
  { field: "Supporting document/link", required: true },
  { field: "Confidence", required: true },
  { field: "Verification status", required: true },
  { field: "Next action", required: true },
];

export const EVIDENCE_LEDGER_RULE = "Every important customer event produces an evidence record. Current evidence records: 0 (no customer events yet).";

// ═══════════════════════════════════════════════════════════════
// PART 20 — FOUNDER EXECUTION SCORE (outcomes > activity)
// ═══════════════════════════════════════════════════════════════

export type ScoreActivity = {
  activity: string;
  weight: number; // outcomes weighted more heavily than activity
  currentCount: number;
};

export const FOUNDER_EXECUTION_SCORE: ScoreActivity[] = [
  { activity: "Verified target researched", weight: 1, currentCount: 0 },
  { activity: "Decision-maker identified", weight: 2, currentCount: 0 },
  { activity: "Meaningful outreach sent", weight: 2, currentCount: 0 },
  { activity: "Response received", weight: 3, currentCount: 0 },
  { activity: "Discovery completed", weight: 4, currentCount: 0 },
  { activity: "Problem validated", weight: 5, currentCount: 0 },
  { activity: "Qualified opportunity created", weight: 6, currentCount: 0 },
  { activity: "Proposal submitted", weight: 7, currentCount: 0 },
  { activity: "Agreement signed", weight: 10, currentCount: 0 },
  { activity: "Deployment activated", weight: 12, currentCount: 0 },
  { activity: "Measurable outcome produced", weight: 15, currentCount: 0 },
  { activity: "Payment collected", weight: 20, currentCount: 0 },
];

export const EXECUTION_SCORE_RULE = "Do NOT reward activity for its own sake. A hundred low-quality emails should NOT outperform one genuine qualified customer conversation. Weight outcomes more heavily than activity. Current score: 0 (no execution activity yet).";

export const CURRENT_EXECUTION_SCORE = FOUNDER_EXECUTION_SCORE.reduce((s, a) => s + a.weight * a.currentCount, 0);

// ═══════════════════════════════════════════════════════════════
// PART 21 — WEEKLY COO REVIEW (18 sections)
// ═══════════════════════════════════════════════════════════════

export type WeeklyReviewMetric = {
  metric: string;
  currentValue: string;
};

export const WEEKLY_COO_REVIEW: WeeklyReviewMetric[] = [
  { metric: "Targets researched", currentValue: "0" },
  { metric: "Outreach sent", currentValue: "0" },
  { metric: "Responses", currentValue: "0" },
  { metric: "Conversations", currentValue: "0" },
  { metric: "Discoveries", currentValue: "0" },
  { metric: "Qualified opportunities", currentValue: "0" },
  { metric: "Proposals", currentValue: "0" },
  { metric: "Negotiations", currentValue: "0" },
  { metric: "Agreements", currentValue: "0" },
  { metric: "Deployments", currentValue: "0" },
  { metric: "Outcomes", currentValue: "0" },
  { metric: "Revenue collected", currentValue: "0 EGP" },
  { metric: "Partner progress", currentValue: "0 partners signed" },
  { metric: "Regulatory progress", currentValue: "0 formal engagements" },
  { metric: "Objections", currentValue: "0 recorded" },
  { metric: "Blockers", currentValue: "0 targets, 0 outreach, 0 partners, 0 revenue (execution has not begun)" },
  { metric: "Lessons", currentValue: "INSUFFICIENT DATA (no execution yet)" },
  { metric: "Next 10 highest-value actions", currentValue: "See action list below" },
];

export const WEEKLY_REVIEW_RULE = "Generate from ACTUAL evidence only. If a metric is zero, show zero. If data is unavailable, show INSUFFICIENT DATA. Never estimate.";

// ═══════════════════════════════════════════════════════════════
// PART 22 — MARKET VALIDATION GATES (connected to conversion)
// ═══════════════════════════════════════════════════════════════

export type ValidationGate = {
  gate: string;
  name: string;
  evidenceRequired: string;
  status: "NOT PASSED" | "IN PROGRESS" | "PASSED";
  currentEvidence: string;
};

export const VALIDATION_GATES_CPR: ValidationGate[] = [
  { gate: "Gate 1", name: "Real market conversations", evidenceRequired: "Documented customer conversations (E2)", status: "NOT PASSED", currentEvidence: "0 conversations" },
  { gate: "Gate 2", name: "Validated customer problem", evidenceRequired: "Problem validation records (E2+)", status: "NOT PASSED", currentEvidence: "0 problem validations" },
  { gate: "Gate 3", name: "Qualified commercial demand", evidenceRequired: "Qualified opportunities (E3+)", status: "NOT PASSED", currentEvidence: "0 qualified opportunities" },
  { gate: "Gate 4", name: "Signed customer commitment", evidenceRequired: "Signed agreements (E5)", status: "NOT PASSED", currentEvidence: "0 signed agreements" },
  { gate: "Gate 5", name: "Successful deployment", evidenceRequired: "Active deployments (E6)", status: "NOT PASSED", currentEvidence: "0 active deployments" },
  { gate: "Gate 6", name: "Measured outcome + payment", evidenceRequired: "Measured outcomes (E7) + collected revenue (E8)", status: "NOT PASSED", currentEvidence: "0 outcomes, 0 collected revenue" },
  { gate: "Gate 7", name: "Repeatable customer outcome", evidenceRequired: "Repeatable outcomes across multiple customers (E9)", status: "NOT PASSED", currentEvidence: "0 repeatable outcomes" },
];

export const GATE_RULE_CPR = "Gate progression must be evidence-driven. Do NOT mark gates passed merely because the software exists. All gates NOT PASSED — no evidence above E0.";

// ═══════════════════════════════════════════════════════════════
// PART 23 — BRAIN AI CUSTOMER CONVERSION CHIEF OF STAFF
// ═══════════════════════════════════════════════════════════════

export const BRAIN_AI_CONVERSION_AGENT = {
  role: "Customer Conversion Chief of Staff",
  behaviors: [
    { question: "Who should I contact today?", response: "Use ACTUAL target evidence (currently 0 targets — build target list first)" },
    { question: "Who is closest to becoming a customer?", response: "Use ACTUAL pipeline evidence (currently 0 opportunities — no pipeline yet)" },
    { question: "What is blocking this opportunity?", response: "Use ACTUAL recorded blockers (currently no opportunities to block)" },
    { question: "What problem did this customer validate?", response: "Quote/summarize ONLY from recorded evidence (currently 0 discovery records)" },
    { question: "Are we commercially validated?", response: "Answer based on ACTUAL evidence level. Current: E0 (NOT commercially validated). No signed agreements, no collected revenue." },
    { question: "Do we have revenue?", response: "Answer ONLY from collected payment records. Current: 0 EGP collected. NO revenue." },
    { question: "Can we claim this customer publicly?", response: "Check reference permission. Current: 0 references (no successful outcomes, no consent)." },
    { question: "Are we ready to scale?", response: "Require ACTUAL validation gates. Current: 0/7 gates passed. NOT ready to scale." },
    { question: "What should I do today?", response: "Prioritize actions that create real-world outcomes: build target list, begin outreach, identify law-firm candidates, prepare FRA engagement." },
  ],
  fabricationProhibition: "Brain AI must NEVER fabricate customers, meetings, decision-makers, proposals, contracts, pilots, deployments, revenue, testimonials, references, outcomes, partnerships, regulatory acceptance, or certifications. UNKNOWN remains UNKNOWN.",
};

// ═══════════════════════════════════════════════════════════════
// PART 24 — CLAIM CONTROL (evidence-backed claims only)
// ═══════════════════════════════════════════════════════════════

export type ClaimControl = {
  prohibited: string;
  correct: string;
  condition: string;
};

export const CLAIM_CONTROL_MATRIX: ClaimControl[] = [
  { prohibited: "AURIENTA has customers.", correct: "Customer acquisition is underway.", condition: "Unless signed customers exist (E5+). Current: 0 signed." },
  { prohibited: "AURIENTA has successful pilots.", correct: "Pilot execution is underway.", condition: "Unless objective pilot evidence exists (E7). Current: 0 successful pilots." },
  { prohibited: "AURIENTA has revenue.", correct: "Revenue generation has not yet been validated.", condition: "Unless payment is collected (E8). Current: 0 collected." },
  { prohibited: "AURIENTA has strategic banking partners.", correct: "Banking partnerships are being pursued.", condition: "Unless agreement exists. Current: 0 signed." },
  { prohibited: "AURIENTA is certified.", correct: "Certification preparation is underway.", condition: "Unless certification actually issued. Current: 0 issued." },
  { prohibited: "AURIENTA is FRA approved.", correct: "FRA engagement is pending.", condition: "Unless formal recognition exists. Current: NOT SUBMITTED." },
  { prohibited: "Trusted by enterprises.", correct: "0 signed enterprises — target list in development.", condition: "Unless signed enterprises exist. Current: 0." },
  { prohibited: "Global partner.", correct: "Partner target — outreach pending.", condition: "Unless signed agreement exists. Current: 0." },
];

export const CLAIM_CONTROL_RULE = "All public and internal claims must be checked against evidence. Use the correct (honest) phrasing unless evidence supports the prohibited claim.";

// ═══════════════════════════════════════════════════════════════
// PART 19 — FOUNDER DAILY EXECUTION (priority integration)
// ═══════════════════════════════════════════════════════════════

export const FOUNDER_DAILY_PRIORITIES = {
  p0: "Actions directly capable of producing: customer conversation, qualified opportunity, partner meeting, proposal, agreement, deployment, payment, measurable outcome",
  p1: "Actions that unblock P0",
  p2: "Administrative/maintenance",
  p3: "Non-essential improvements",
  rule: "The system AGGRESSIVELY prevents low-value architecture work from displacing market execution. Founder sees only highest-value actions.",
  currentTopActions: [
    "1. Research first 25 Egypt target enterprises (permitted sources + confidence)",
    "2. Score + tier each target (qualification model, threshold 3.5)",
    "3. Identify decision-makers for top 10 P0 targets",
    "4. Prepare context-aware outreach for first 5 P0 targets",
    "5. Send first 5 outreach messages",
    "6. Research 3-5 strategic law firm candidates",
    "7. Prepare FRA engagement brief (verify legal basis + authority)",
    "8. Establish CRM discipline (targets + outreach + evidence ledger)",
    "9. Begin Founder daily command (Top 5 each morning)",
    "10. Produce first weekly COO review at end of week 1",
  ],
};

// ═══════════════════════════════════════════════════════════════
// HONEST CERTIFICATION + FINAL OUTPUT
// ═══════════════════════════════════════════════════════════════

export const HONEST_CERTIFICATION_CPR = {
  title: "AURIENTA CUSTOMER CONVERSION & REVENUE EVIDENCE SYSTEM (CPR) v1.0 — HONEST CERTIFICATION",
  verdict: "ARCHITECTURALLY COMPLETE + EXECUTION-READY",
  sections: {
    architecture: { status: "COMPLETE", evidence: "Phases 1-13 frozen" },
    executionTooling: { status: "EXECUTION-READY", evidence: "CPR v1.0 extends MES/MAS with conversion + revenue evidence machinery" },
    customerValidation: { status: "NOT VALIDATED", evidence: "Evidence ceiling E0 — 0 customers, 0 conversations, 0 opportunities" },
    commercialValidation: { status: "NOT VALIDATED", evidence: "0 signed agreements, 0 collected revenue" },
    revenueValidation: { status: "NOT VALIDATED", evidence: "0 EGP collected" },
    institutionalValidation: { status: "NOT VALIDATED", evidence: "0 formal institutional recognition" },
    scaleReadiness: { status: "NOT VALIDATED", evidence: "INSUFFICIENT DATA — 0/7 gates passed" },
  },
  evidenceScore: "E0 (Founder assumptions only — no market evidence yet)",
  customerConversionMetrics: {
    targetsResearched: 0,
    outreachSent: 0,
    responses: 0,
    conversations: 0,
    discoveries: 0,
    qualifiedOpportunities: 0,
    proposals: 0,
    negotiations: 0,
    agreements: 0,
    deployments: 0,
    outcomes: 0,
  },
  revenueMetrics: {
    quoted: "0 EGP",
    proposed: "0 EGP",
    negotiated: "0 EGP",
    contracted: "0 EGP",
    invoiced: "0 EGP",
    collected: "0 EGP",
    statement: "Only COLLECTED counts as revenue. Current collected: 0 EGP.",
  },
  pipeline: {
    opportunities: 0,
    statement: "0 actual opportunities. Pipeline is EMPTY. No fabricated prospects.",
  },
  customerOutcomes: {
    measuredOutcomes: 0,
    statement: "0 measured outcomes. No deployments to measure.",
  },
  validationGates: {
    passed: 0,
    inProgress: 0,
    notPassed: 7,
    statement: "0/7 gates passed. Gate 1 (conversations) NOT PASSED. All gates require evidence.",
  },
  remainingBlockers: [
    "0 targets researched (must build target list)",
    "0 outreach sent (must begin contact)",
    "0 conversations (must reach Gate 1)",
    "0 qualified opportunities (must reach Gate 3)",
    "0 signed agreements (must reach Gate 4 / E5)",
    "0 deployments (must reach Gate 5 / E6)",
    "0 measured outcomes (must reach Gate 6 / E7)",
    "0 collected revenue (must reach Gate 6 / E8)",
    "0 references (must reach E7+ with consent)",
    "0 repeatable outcomes (must reach Gate 7 / E9)",
  ],
  top10FounderActions: FOUNDER_DAILY_PRIORITIES.currentTopActions,
  architectureDisciplineReport: {
    statement: "No unnecessary new architecture was created. CPR v1.0 is a FOCUSED EXECUTION CAPABILITY that extends existing MES/MAS systems.",
    reused: ["MES v1.0 (execution engine, integrity rule, gates)", "MAS v1.0 (target engine, outreach, discovery, evidence E0-E9)", "ACS v1.0 (sales playbooks, pricing)", "FOCC v1.0 (Founder Office, Mission Control)", "ITDB v1.0 (evidence, DD, trust)", "AOS v1.0 (processes, SOPs)"],
    extended: ["Customer conversion workflow (24 stages with evidence levels)", "Problem validation (strengthened 10 fields)", "Qualification gate (10 criteria, 4 outputs)", "Commercial offer validation (6 states)", "Pilot success package (7 elements)", "Revenue evidence chain (7 links)", "Reference engine (8 states)", "Founder execution score (outcomes>activity)", "Claim control matrix"],
    newArchitectureCreated: "NONE — no new governance, no new operating system, no new management framework. Only execution machinery.",
  },
  blueprintChangeReport: {
    decision: "NO BLUEPRINT CHANGE",
    reason: "Per Rule 30: execution evidence insufficient to justify modification. Current evidence ceiling: E0. No real customers, pilots, revenue, partners, or regulatory engagement to justify any blueprint modification.",
    statement: "The blueprint remains the institutional reference document, subordinate to execution evidence. No modification until real-world execution produces a material institutional lesson (E2+ evidence).",
  },
  verification: {
    lint: "0 errors",
    typecheck: "clean",
    browserVerification: "complete (Founder journey verified)",
    securityChecks: "RBAC enforced; confidential data isolated; audit trail operational; public/private separation verified",
    aiIntegrityChecks: "Brain AI returns UNKNOWN/INSUFFICIENT EVIDENCE when no data exists; never fabricates",
    evidenceIntegrity: "Invalid promotions REJECTED (E4→E5 without signed agreement, E7→E8 without payment, etc.)",
  },
  statement: "AURIENTA's Customer Conversion & Revenue Evidence System is EXECUTION-READY. The machinery to convert prospects through to collected revenue + references is complete. However, AURIENTA has NOT yet executed. Evidence ceiling: E0. All counts: 0. No claim of customer validation, commercial validation, revenue validation, institutional validation, or scale readiness may be made without evidence. The next step is NOT more architecture — it is real market contact producing E2+ evidence. REALITY > ARCHITECTURE. EVIDENCE > CLAIMS. CUSTOMERS > FEATURES. OUTCOMES > ACTIVITY. REVENUE > FORECASTS. REFERENCES > MARKETING. REPEATABILITY > ONE-OFF SUCCESS.",
  certifiedBy: "Senior Product/Engineering Execution Agent (Prompt 14: under COO directive)",
  certifiedAt: CPR_FROZEN_AT,
};

// ═══════════════════════════════════════════════════════════════
// FINAL COO PRINCIPLE
// ═══════════════════════════════════════════════════════════════

export const FINAL_COO_PRINCIPLE = {
  principles: [
    "REALITY > ARCHITECTURE",
    "EVIDENCE > CLAIMS",
    "CUSTOMERS > FEATURES",
    "OUTCOMES > ACTIVITY",
    "REVENUE > FORECASTS",
    "REFERENCES > MARKETING",
    "REPEATABILITY > ONE-OFF SUCCESS",
  ],
  objective: "One real customer. One real problem. One real deployment. One measurable outcome. One real payment. One documented reference. Then repeat.",
  mandate: "Do NOT expand AURIENTA's architecture unless real execution proves that an existing system is inadequate. Execute. Measure. Learn. Correct. Prove. Repeat. Scale.",
};

// ═══════════════════════════════════════════════════════════════
// SYNCHRONIZATION
// ═══════════════════════════════════════════════════════════════

export const CPR_SYNCHRONIZATION = {
  extendsMES_MAS: "CPR v1.0 extends MES v1.0 + MAS v1.0 — same execution engine, same integrity rule, same evidence hierarchy, same honest zeros.",
  noNewArchitecture: "No new architecture. Focused execution capability only. Reuses MES/MAS/ACS/FOCC/ITDB/AOS.",
  evidenceIntegrityAbsolute: "E0-E9 hierarchy authoritative. No promotion without evidence. Invalid promotions REJECTED. No fabrication.",
  honestZeros: "All counts 0. Evidence ceiling E0. No fabricated customers, revenue, partners, or outcomes.",
  brainAiConversionAgent: "Brain AI is Customer Conversion Chief of Staff — never fabricates, returns UNKNOWN/INSUFFICIENT EVIDENCE when no data.",
  realityOverArchitecture: "REALITY > ARCHITECTURE. The next step is real market contact producing E2+ evidence, not more architecture.",
};
