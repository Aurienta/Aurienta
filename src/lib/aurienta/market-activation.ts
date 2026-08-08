// AURIENTA Market Activation System (MAS) v1.0
// ═══════════════════════════════════════════════════════════════
// This is EXECUTION TOOLING — not new architecture. It extends the
// Market Execution System (MES v1.0) with the actual machinery the
// Founder uses to execute the first 100 targets, conduct outreach,
// run discovery, convert pilots, and collect revenue.
//
// REUSES (does NOT duplicate):
//   - MES v1.0 (execution engine, integrity rule, gates, score)
//   - ACS v1.0 (sales playbooks, pricing, funnel)
//   - GLS v1.0 (expansion, partner types, government)
//   - FOCC v1.0 (Founder Office, Mission Control, briefings)
//   - ITDB v1.0 (evidence, DD, trust)
//   - AOS v1.0 (processes, SOPs)
//
// HONESTY DEFAULT: All counts 0. All statuses UNKNOWN / NOT STARTED /
// COLD OUTREACH REQUIRED. No fabricated contacts, relationships,
// meetings, or commitments. Execution fills the machinery.
//
// DO NOT modify without Founder approval.
// ═══════════════════════════════════════════════════════════════

export const MAS_VERSION = "1.0";
export const MAS_FROZEN_AT = "2026-08-16";

// ═══════════════════════════════════════════════════════════════
// CURRENT FACTUAL BASELINE (unchanged from MES — honest)
// ═══════════════════════════════════════════════════════════════

export const FACTUAL_BASELINE = {
  customers: 0,
  activePilots: 0,
  collectedRevenue: 0,
  signedPartners: 0,
  regulatoryEngagements: 0,
  certificationsIssued: 0,
  caseStudies: 0,
  gatesPassed: 0,
  commercialReadiness: 11,
  targetsResearched: 0,
  outreachSent: 0,
  meetingsHeld: 0,
  opportunities: 0,
  proposals: 0,
  relationships: 0,
  highestEvidenceLevel: "E0" as const,
  statement: "Current factual baseline is unchanged from MES v1.0. The activation machinery is READY; execution fills it. No fabrication.",
};

// ═══════════════════════════════════════════════════════════════
// PART 3 — FIRST 100 TARGET ACCOUNT ENGINE (schema)
// ═══════════════════════════════════════════════════════════════

export type TargetAccountField = {
  field: string;
  required: boolean;
  defaultIfUnknown: string;
};

export const TARGET_ACCOUNT_ENGINE: TargetAccountField[] = [
  { field: "Organization name", required: true, defaultIfUnknown: "UNKNOWN / RESEARCH REQUIRED" },
  { field: "Country", required: true, defaultIfUnknown: "Egypt (default for Year 1)" },
  { field: "City", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Sector", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Website", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Organization type", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Approximate size", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Strategic importance", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Likely use case", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "ICP score", required: true, defaultIfUnknown: "Not scored" },
  { field: "Qualification score", required: true, defaultIfUnknown: "Not scored" },
  { field: "Tier (P0/P1/P2/P3)", required: true, defaultIfUnknown: "Not tiered" },
  { field: "Decision-maker role", required: true, defaultIfUnknown: "UNKNOWN / RESEARCH REQUIRED" },
  { field: "Economic buyer role", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Operational champion role", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Legal/compliance role", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Technology role", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Relationship status", required: true, defaultIfUnknown: "No relationship (0)" },
  { field: "Outreach status", required: true, defaultIfUnknown: "Not contacted" },
  { field: "Last contact", required: true, defaultIfUnknown: "Never" },
  { field: "Next action", required: true, defaultIfUnknown: "Research + outreach" },
  { field: "Owner", required: true, defaultIfUnknown: "Founder" },
  { field: "Priority", required: true, defaultIfUnknown: "Not prioritized" },
  { field: "Estimated commercial value (EGP)", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Estimated strategic value", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Evidence", required: true, defaultIfUnknown: "None yet" },
  { field: "Source", required: true, defaultIfUnknown: "UNKNOWN" },
  { field: "Research status", required: true, defaultIfUnknown: "Not researched" },
  { field: "Notes", required: false, defaultIfUnknown: "—" },
];

export const TARGET_ENGINE_RULE = "Never fill unknown fields with guesses. Unknown = UNKNOWN / RESEARCH REQUIRED. The First 100 Target Account List starts EMPTY (0 targets) and fills with real research.";

// Current state: 0 targets entered
export const TARGETS_ENTERED = 0;

// ═══════════════════════════════════════════════════════════════
// PART 4 — TARGET SEGMENTATION (P0/P1/P2/P3)
// ═══════════════════════════════════════════════════════════════

export type TargetTier = {
  tier: string;
  description: string;
  capacityRule: string;
  currentCount: number;
};

export const TARGET_SEGMENTATION: TargetTier[] = [
  { tier: "P0 — Anchor Potential", description: "Organizations capable of becoming first customer, reference customer, institutional credibility customer, or regional expansion customer", capacityRule: "Highest Founder time allocation", currentCount: 0 },
  { tier: "P1 — High Commercial Potential", description: "Organizations with strong fit and meaningful purchasing potential", capacityRule: "Significant Founder time", currentCount: 0 },
  { tier: "P2 — Strategic Development", description: "Organizations valuable for partnerships, ecosystem development, or future customers", capacityRule: "Moderate time; nurture", currentCount: 0 },
  { tier: "P3 — Long-Term", description: "Organizations that should NOT consume significant Founder time yet", capacityRule: "Minimal time; monitor", currentCount: 0 },
];

export const CAPACITY_RULE = "The system PREVENTS low-value opportunities from consuming Founder capacity. P3 targets are monitored, not actively pursued, until they demonstrate P0/P1 potential.";

// ═══════════════════════════════════════════════════════════════
// PART 5 — TARGET ACCOUNT SOURCING (methodology + confidence)
// ═══════════════════════════════════════════════════════════════

export const SOURCING_METHODOLOGY = {
  permittedSources: [
    "Official company websites",
    "Official government websites",
    "Official regulatory websites",
    "Public company information",
    "Verified professional information",
    "Legitimate institutional directories",
    "Public procurement information",
    "Industry associations",
    "University websites",
    "Chambers of commerce",
    "Official corporate reports",
    "Public professional profiles",
  ],
  perFactRequired: ["Source", "Date researched", "Researcher", "Confidence level"],
  confidenceLevels: [
    { level: "HIGH", meaning: "Official or directly verified", treatment: "Treat as fact" },
    { level: "MEDIUM", meaning: "Reliable secondary source", treatment: "Usable; note source" },
    { level: "LOW", meaning: "Requires verification", treatment: "Do NOT treat as fact; verify before action" },
  ],
  rule: "Do NOT treat low-confidence information as fact. Every externally sourced fact must have source + date + researcher + confidence.",
};

// ═══════════════════════════════════════════════════════════════
// PART 6 — FIRST MARKET: EGYPT
// ═══════════════════════════════════════════════════════════════

export const EGYPT_MARKET_FOCUS = {
  market: "Egypt (home market — Year 1)",
  targetCategories: [
    "Egyptian enterprises with formal governance needs",
    "Family businesses with succession/growth challenges",
    "SMEs preparing for institutional growth",
    "Companies requiring stronger governance",
    "Companies seeking structured capital participation",
    "Export-oriented companies",
    "Industrial companies",
    "Professional services firms",
    "Technology companies",
    "Universities / ecosystem organizations",
    "Institutions capable of becoming strategic partners",
  ],
  rule: "Do NOT assume every company is a fit. Qualification determines fit. Disqualification is a successful outcome — it protects Founder time.",
};

// ═══════════════════════════════════════════════════════════════
// PART 7 — FIRST 25 PRIORITY PROCESS (10 steps per target)
// ═══════════════════════════════════════════════════════════════

export const FIRST_25_PROCESS = [
  { step: 1, action: "Research", detail: "Sourced from permitted sources with confidence levels" },
  { step: 2, action: "Qualify", detail: "Score against 10-criterion qualification model (threshold 3.5)" },
  { step: 3, action: "Score", detail: "Calculate weighted qualification score" },
  { step: 4, action: "Tier", detail: "Assign P0/P1/P2/P3 based on score + strategic value" },
  { step: 5, action: "Identify likely decision-maker", detail: "Research decision-maker role (UNKNOWN if not found)" },
  { step: 6, action: "Identify likely problem", detail: "Hypothesize pain point from sector + public info (mark as hypothesis)" },
  { step: 7, action: "Identify AURIENTA use case", detail: "Map problem to relevant AURIENTA capability" },
  { step: 8, action: "Prepare personalized approach", detail: "Context-aware outreach (not generic)" },
  { step: 9, action: "Assign Founder action", detail: "Specific next action + deadline" },
  { step: 10, action: "Record evidence", detail: "All research recorded with source + confidence" },
];

export const FIRST_25_RULE = "Do NOT mark an account as 'qualified' merely because it appears interesting. Qualification requires scored evidence against the 10 criteria.";

// ═══════════════════════════════════════════════════════════════
// PART 8 — FOUNDER OUTREACH SYSTEM (14 stages)
// ═══════════════════════════════════════════════════════════════

export type OutreachStage = {
  stageId: string;
  stage: string;
  owner: string;
  nextAction: string;
  evidence: string;
};

export const OUTREACH_WORKFLOW: OutreachStage[] = [
  { stageId: "OW-01", stage: "Research", owner: "Founder", nextAction: "Complete research with sources + confidence", evidence: "Research record" },
  { stageId: "OW-02", stage: "Personalized message prepared", owner: "Founder", nextAction: "Draft context-aware outreach", evidence: "Draft message" },
  { stageId: "OW-03", stage: "Outreach approved", owner: "Founder", nextAction: "Review + approve message", evidence: "Approval record" },
  { stageId: "OW-04", stage: "Outreach sent", owner: "Founder", nextAction: "Await response (follow up if no reply in 7 days)", evidence: "Sent log + timestamp" },
  { stageId: "OW-05", stage: "Response", owner: "Founder", nextAction: "Respond + propose meeting", evidence: "Response log" },
  { stageId: "OW-06", stage: "Meeting requested", owner: "Founder", nextAction: "Schedule meeting", evidence: "Meeting request" },
  { stageId: "OW-07", stage: "Meeting scheduled", owner: "Founder", nextAction: "Prepare discovery", evidence: "Calendar invite" },
  { stageId: "OW-08", stage: "Discovery completed", owner: "Founder", nextAction: "Validate problem + qualify", evidence: "Discovery notes" },
  { stageId: "OW-09", stage: "Qualified", owner: "Founder", nextAction: "Create opportunity", evidence: "Qualification record" },
  { stageId: "OW-10", stage: "Opportunity created", owner: "Founder", nextAction: "Develop solution hypothesis", evidence: "Opportunity record" },
  { stageId: "OW-11", stage: "Proposal", owner: "Founder", nextAction: "Deliver commercial proposal", evidence: "Proposal document" },
  { stageId: "OW-12", stage: "Negotiation", owner: "Founder", nextAction: "Negotiate terms", evidence: "Negotiation log" },
  { stageId: "OW-13", stage: "Agreement", owner: "Founder", nextAction: "Execute agreement", evidence: "Signed agreement" },
  { stageId: "OW-14", stage: "Pilot", owner: "Founder + CS", nextAction: "Begin pilot onboarding", evidence: "Pilot SOW signed" },
];

// Current state: 0 outreach sent
export const OUTREACH_SENT = 0;

// ═══════════════════════════════════════════════════════════════
// PART 9 — OUTREACH QUALITY CONTROL
// ═══════════════════════════════════════════════════════════════

export const OUTREACH_QUALITY = {
  rule: "No mass generic spam. Every P0/P1 target receives a context-aware approach.",
  perTargetBasis: ["Organization", "Sector", "Likely problem", "Strategic situation", "Relevant AURIENTA capability", "Expected institutional value"],
  founderQuestions: [
    "Why this organization?",
    "Why AURIENTA?",
    "Why now?",
    "What problem are we asking them to solve?",
    "What is the smallest credible first engagement?",
  ],
  principle: "Outreach quality > outreach quantity. 10 context-aware outreach attempts are worth more than 100 generic messages.",
};

// ═══════════════════════════════════════════════════════════════
// PART 10 — FOUNDER DISCOVERY MEETING SYSTEM
// ═══════════════════════════════════════════════════════════════

export type DiscoverySection = {
  section: string;
  captureItems: string[];
};

export const DISCOVERY_SYSTEM: DiscoverySection[] = [
  {
    section: "Current Situation",
    captureItems: ["Organizational structure", "Governance", "Capital structure", "Operational challenges", "Technology", "Compliance", "Growth ambitions"],
  },
  {
    section: "Problems",
    captureItems: ["Most expensive problem", "Most urgent problem", "Recurring problem", "Institutional bottleneck", "Governance bottleneck", "Capital bottleneck", "Operational bottleneck"],
  },
  {
    section: "Existing Alternatives",
    captureItems: ["Internal solution", "Consultants", "ERP", "Legal firm", "Accounting firm", "Software", "Manual processes", "Competitor"],
  },
  {
    section: "Buying Readiness",
    captureItems: ["Urgency", "Budget", "Authority", "Timeline", "Procurement process", "Legal constraints"],
  },
  {
    section: "AURIENTA Fit",
    captureItems: ["Relevant module", "Expected value", "Implementation complexity", "Partner dependencies", "Regulatory implications"],
  },
];

// ═══════════════════════════════════════════════════════════════
// PART 11 — CUSTOMER PROBLEM VALIDATION
// ═══════════════════════════════════════════════════════════════

export const PROBLEM_VALIDATION = {
  sequence: "Problem → Evidence → Cost → Urgency → Existing Alternative → Willingness to Change",
  rule: "The Founder must NOT pitch prematurely. First establish the problem chain. Only then determine whether AURIENTA is appropriate.",
  disqualificationRule: "If no real problem exists: DISQUALIFY. A disqualified prospect is a SUCCESSFUL execution outcome because it protects Founder time.",
  pitchRule: "Pitch only after problem is validated with evidence.",
};

// ═══════════════════════════════════════════════════════════════
// PART 12 — FIRST CUSTOMER OFFER (minimum credible engagement)
// ═══════════════════════════════════════════════════════════════

export const FIRST_CUSTOMER_OFFER = {
  rule: "Do NOT sell the entire AURIENTA vision immediately. Determine the minimum credible first engagement that solves a real problem with measurable value.",
  offerTypes: [
    "Diagnostic (assess governance/capital/operations)",
    "Constitutional design (charter + CRE policy bundle)",
    "Enterprise formation support",
    "Governance implementation",
    "Operational infrastructure",
    "Compliance infrastructure",
    "Technology implementation",
    "Pilot (time-boxed, success-criteria-defined)",
    "Advisory engagement",
    "Broader institutional deployment",
  ],
  principle: "The initial offer solves a real problem with measurable value. The full vision unfolds as trust + evidence build.",
};

// ═══════════════════════════════════════════════════════════════
// PART 13 — PILOT CONVERSION WORKFLOW
// ═══════════════════════════════════════════════════════════════

export const PILOT_CONVERSION = {
  stages: ["Discovery", "Qualified problem", "Solution hypothesis", "Commercial proposal", "Pilot agreement", "Baseline measurement", "Implementation", "Measurement", "Outcome assessment", "Commercial conversion"],
  rule: "The pilot must have PREDEFINED success criteria agreed before implementation begins. No pilot starts without a signed pilot agreement + baseline + success criteria.",
  conversionGate: "Commercial conversion requires demonstrated outcome against predefined criteria + customer agreement to recurring commercial relationship.",
};

// ═══════════════════════════════════════════════════════════════
// PART 14 — FIRST REVENUE (revenue classification)
// ═══════════════════════════════════════════════════════════════

export type RevenueClass = {
  classification: string;
  definition: string;
  currentValue: string;
};

export const REVENUE_CLASSIFICATION: RevenueClass[] = [
  { classification: "Pipeline", definition: "Potential money (qualified opportunities)", currentValue: "0 EGP" },
  { classification: "Proposal", definition: "Commercial offer delivered", currentValue: "0 EGP" },
  { classification: "Contracted", definition: "Legally committed (signed agreement)", currentValue: "0 EGP" },
  { classification: "Invoiced", definition: "Invoice issued", currentValue: "0 EGP" },
  { classification: "Collected", definition: "Money actually received in bank", currentValue: "0 EGP" },
];

export const REVENUE_RULE = "Only COLLECTED counts as realized revenue. Pipeline/Proposal/Contracted/Invoiced are progress indicators, NOT revenue. Current collected: 0 EGP.";

// ═══════════════════════════════════════════════════════════════
// PART 21 — FOUNDER RELATIONSHIP MAP
// ═══════════════════════════════════════════════════════════════

export type RelationshipField = {
  field: string;
  defaultIfUnknown: string;
};

export const RELATIONSHIP_MAP_SCHEMA: RelationshipField[] = [
  { field: "Person", defaultIfUnknown: "UNKNOWN / RESEARCH REQUIRED" },
  { field: "Organization", defaultIfUnknown: "UNKNOWN" },
  { field: "Role", defaultIfUnknown: "UNKNOWN" },
  { field: "Relationship strength (0-5)", defaultIfUnknown: "0 (unknown)" },
  { field: "Source", defaultIfUnknown: "UNKNOWN" },
  { field: "Last interaction", defaultIfUnknown: "Never" },
  { field: "Next interaction", defaultIfUnknown: "Not scheduled" },
  { field: "Mutual connections", defaultIfUnknown: "UNKNOWN" },
  { field: "Strategic relevance", defaultIfUnknown: "UNKNOWN" },
  { field: "Opportunities", defaultIfUnknown: "None identified" },
  { field: "Commitments", defaultIfUnknown: "None" },
];

export const RELATIONSHIP_STRENGTH_SCALE = [
  { score: 0, meaning: "Unknown — no data", evidenceRequired: "None (default)" },
  { score: 1, meaning: "Identified — person known to exist", evidenceRequired: "Research record" },
  { score: 2, meaning: "Contacted — outreach sent", evidenceRequired: "Outreach log" },
  { score: 3, meaning: "Conversation — meaningful exchange", evidenceRequired: "Meeting/correspondence record" },
  { score: 4, meaning: "Active relationship — ongoing engagement", evidenceRequired: "Multiple interactions + mutual value" },
  { score: 5, meaning: "Strategic relationship — trusted partner/advocate", evidenceRequired: "Documented strategic alignment + commitments" },
];

export const RELATIONSHIP_RULE = "Never assign a relationship score without evidence. 0 = unknown (default). Scores rise only with documented interactions.";

// Current state: 0 relationships recorded
export const RELATIONSHIPS_RECORDED = 0;

// ═══════════════════════════════════════════════════════════════
// PART 22 — INTRODUCTION ENGINE
// ═══════════════════════════════════════════════════════════════

export const INTRODUCTION_ENGINE = {
  question: "Who can introduce the Founder to this target?",
  method: "Use ACTUAL relationship data from the Relationship Map. Traverse the graph for mutual connections.",
  rule: "Never fabricate introductions. If no introduction path exists: COLD OUTREACH REQUIRED.",
  currentStatus: "0 relationships recorded. All introductions require COLD OUTREACH until relationships are built.",
};

// ═══════════════════════════════════════════════════════════════
// PART 25 — DAILY EXECUTION MODE (Top 5 each)
// ═══════════════════════════════════════════════════════════════

export type DailyItem = {
  item: string;
  detail: string;
  currentValue: string;
};

export const DAILY_COMMAND = {
  top5Actions: {
    fields: ["Action", "Organization", "Reason", "Expected value", "Deadline", "Evidence", "Next step"],
    current: "EMPTY — execution begins. Founder populates daily from 90-day plan + target list.",
  },
  top5Blockers: {
    fields: ["Blocker", "Owner", "Severity", "Impact", "Resolution"],
    current: "Current blockers: 0 targets researched, 0 outreach sent, 0 partners signed, 0 regulatory engagement, 0 revenue. These are the real blockers.",
  },
  top5Opportunities: {
    fields: ["Organization", "Stage", "Value", "Probability", "Next action"],
    current: "EMPTY — 0 opportunities. Opportunities emerge from outreach + discovery.",
  },
  top5Relationships: {
    fields: ["Person", "Organization", "Strategic relevance", "Next action"],
    current: "EMPTY — 0 relationships recorded. Relationships build through execution.",
  },
  rule: "The Founder dashboard answers immediately: what to do today, what's blocking, what's the biggest opportunity, who to contact. All start EMPTY and fill with real execution.",
};

// ═══════════════════════════════════════════════════════════════
// PART 26 — EXECUTION CONVERSION FUNNEL
// ═══════════════════════════════════════════════════════════════

export type FunnelStage = {
  stage: string;
  currentCount: number;
  conversionRate: string;
};

export const CONVERSION_FUNNEL: FunnelStage[] = [
  { stage: "Researched targets", currentCount: 0, conversionRate: "INSUFFICIENT DATA" },
  { stage: "Qualified targets", currentCount: 0, conversionRate: "INSUFFICIENT DATA" },
  { stage: "Contacts identified", currentCount: 0, conversionRate: "INSUFFICIENT DATA" },
  { stage: "Responses received", currentCount: 0, conversionRate: "INSUFFICIENT DATA" },
  { stage: "Meetings held", currentCount: 0, conversionRate: "INSUFFICIENT DATA" },
  { stage: "Qualified opportunities", currentCount: 0, conversionRate: "INSUFFICIENT DATA" },
  { stage: "Proposals delivered", currentCount: 0, conversionRate: "INSUFFICIENT DATA" },
  { stage: "Contracts signed", currentCount: 0, conversionRate: "INSUFFICIENT DATA" },
  { stage: "Pilots started", currentCount: 0, conversionRate: "INSUFFICIENT DATA" },
  { stage: "Successful pilots", currentCount: 0, conversionRate: "INSUFFICIENT DATA" },
  { stage: "Paying customers", currentCount: 0, conversionRate: "INSUFFICIENT DATA" },
  { stage: "Retained customers", currentCount: 0, conversionRate: "INSUFFICIENT DATA" },
  { stage: "References", currentCount: 0, conversionRate: "INSUFFICIENT DATA" },
  { stage: "Expansion", currentCount: 0, conversionRate: "INSUFFICIENT DATA" },
];

export const FUNNEL_RULE = "Every conversion rate calculated from ACTUAL data. If insufficient data: INSUFFICIENT DATA. No estimated/fabricated rates.";

// ═══════════════════════════════════════════════════════════════
// PART 27 — FOUNDER WEEKLY REVIEW
// ═══════════════════════════════════════════════════════════════

export type WeeklyReviewSection = {
  section: string;
  content: string;
};

export const WEEKLY_REVIEW: WeeklyReviewSection[] = [
  { section: "WHAT HAPPENED", content: "Actual events (meetings, outreach, responses, submissions)" },
  { section: "WHAT CHANGED", content: "Actual status changes (target tier changes, stage transitions, new evidence)" },
  { section: "WHAT WAS LEARNED", content: "Customer/partner/regulatory lessons" },
  { section: "WHAT FAILED", content: "Lost opportunities, rejected outreach, blockers encountered" },
  { section: "WHAT WORKED", content: "Positive evidence (responses, meetings, agreements)" },
  { section: "WHAT REQUIRES DECISION", content: "Founder decisions pending" },
  { section: "WHAT MUST HAPPEN NEXT WEEK", content: "Prioritized actions" },
  { section: "WHAT SHOULD STOP", content: "Low-value activity to discontinue" },
];

export const WEEKLY_REVIEW_RULE = "Brain AI produces weekly review from ACTUAL execution data. No fabrication. If nothing happened: 'No execution events this week.' Current reviews produced: 0.";

// ═══════════════════════════════════════════════════════════════
// PART 28 — MARKET LEARNING LOOP
// ═══════════════════════════════════════════════════════════════

export const MARKET_LEARNING_LOOP = {
  flow: "Customer evidence → Problem intelligence → Commercial intelligence → Product feedback → Pricing intelligence → Partner intelligence → Regulatory intelligence → Strategy refinement",
  distinctions: [
    "CUSTOMER REQUEST ≠ CUSTOMER COMMITMENT (request is interest; commitment is signed)",
    "FOUNDER ASSUMPTION ≠ MARKET EVIDENCE (assumption is internal; evidence is from the market)",
  ],
  rule: "Every meaningful interaction feeds the learning loop. The system distinguishes requests from commitments and assumptions from evidence.",
};

// ═══════════════════════════════════════════════════════════════
// PART 29 — LOST DEAL ANALYSIS
// ═══════════════════════════════════════════════════════════════

export const LOST_DEAL_REASONS = [
  "No problem", "No urgency", "Price", "Trust", "Regulation", "Legal", "Procurement", "Competitor",
  "Internal politics", "Technology", "Timing", "Insufficient ROI", "Implementation complexity",
];

export const LOST_DEAL_RULE = {
  rule: "Every lost opportunity must be recorded with structured reason. Brain AI identifies patterns.",
  escalationThreshold: 5,
  escalationAction: "If 5+ qualified prospects reject AURIENTA for the SAME reason: flag REPEATED MARKET OBJECTION + escalate to Founder review.",
  redesignRule: "Do NOT automatically redesign the product. First validate whether the objection is: real / segment-specific / pricing-related / messaging-related / product-related / regulatory / procurement-related.",
  currentLosses: 0,
};

// ═══════════════════════════════════════════════════════════════
// PART 32 — COMMERCIAL EVIDENCE QUALITY (E0-E9 hierarchy)
// ═══════════════════════════════════════════════════════════════

export type EvidenceLevel = {
  level: string;
  name: string;
  description: string;
};

export const EVIDENCE_HIERARCHY: EvidenceLevel[] = [
  { level: "E0", name: "Founder assumption", description: "Internal belief without market evidence" },
  { level: "E1", name: "Market hypothesis", description: "Hypothesis based on secondary research" },
  { level: "E2", name: "Customer conversation", description: "Direct conversation with a prospect" },
  { level: "E3", name: "Qualified opportunity", description: "Qualified prospect with verified problem + authority" },
  { level: "E4", name: "Proposal / commercial commitment", description: "Commercial proposal delivered + acknowledged" },
  { level: "E5", name: "Signed agreement", description: "Legally executed agreement" },
  { level: "E6", name: "Active deployment", description: "Enterprise actively deployed on AURIENTA" },
  { level: "E7", name: "Measured customer outcome", description: "Documented measurable outcome" },
  { level: "E8", name: "Collected revenue", description: "Money actually received" },
  { level: "E9", name: "Repeatable outcome", description: "Same outcome achieved across multiple customers" },
];

export const EVIDENCE_HIERARCHY_RULE = {
  rule: "This hierarchy is visible to Brain AI. Every claim is tagged with its evidence level. No claim may be represented at a higher level than its evidence supports.",
  currentHighest: "E0 (no market evidence yet — all current claims are Founder assumptions or architecture evidence from phases 1-12)",
  climbRule: "Evidence climbs E0→E9 only with real execution. No skipping levels. No claiming E5 (signed) without an actual signed agreement.",
};

// ═══════════════════════════════════════════════════════════════
// PART 34 — BRAIN AI FOUNDER MARKET AGENT
// ═══════════════════════════════════════════════════════════════

export const BRAIN_AI_MARKET_AGENT = {
  role: "Founder Market Agent (action-oriented, not framework-explainer)",
  behaviors: [
    { question: "Who should I contact today?", response: "Return highest-priority ACTUAL targets from the target list (currently 0 — build the list first)" },
    { question: "Who owes me a response?", response: "Return ACTUAL overdue relationships (outreach sent + no response in 7+ days). Currently 0 outreach sent." },
    { question: "Who should I follow up with?", response: "Return ACTUAL follow-ups due (based on last contact + next action). Currently 0 relationships." },
    { question: "Which prospect is closest to signing?", response: "Use ACTUAL pipeline evidence (highest stage reached). Currently 0 opportunities." },
    { question: "Why are we not closing?", response: "Analyze ACTUAL data: 0 targets researched, 0 outreach, 0 meetings, 0 proposals. The answer: execution has not begun." },
    { question: "What is our biggest market objection?", response: "Use ACTUAL lost-opportunity evidence. Currently 0 losses (no opportunities yet). INSUFFICIENT DATA." },
    { question: "Who should I meet this week?", response: "Prioritize ACTUAL relationships + P0 targets. Currently 0 relationships; build target list first." },
    { question: "What is the highest-value action?", response: "Optimize for actual expected institutional/commercial impact. Current highest-value: build target list + begin outreach." },
  ],
  fabricationProhibition: "NEVER invent information. NEVER fabricate contacts, relationships, meetings, or commitments. If no data exists: state that clearly (0, UNKNOWN, INSUFFICIENT DATA).",
};

// ═══════════════════════════════════════════════════════════════
// PART 23 — WEEKLY FOUNDER EXECUTION TARGETS (adjustable)
// ═══════════════════════════════════════════════════════════════

export type WeeklyTargetSection = {
  section: string;
  targets: string[];
  currentWeek: string;
};

export const WEEKLY_EXECUTION_TARGETS: WeeklyTargetSection[] = [
  { section: "Commercial", targets: ["Target accounts researched", "Qualified accounts", "Outreach sent", "Responses", "Meetings", "Discovery calls", "Proposals", "Pilot discussions"], currentWeek: "All 0 (execution begins)" },
  { section: "Partnerships", targets: ["Law firm targets identified", "Accounting targets identified", "Banking targets identified", "Partner meetings"], currentWeek: "All 0" },
  { section: "Regulatory", targets: ["Research completed", "Legal questions prepared", "Engagements initiated"], currentWeek: "All 0" },
  { section: "Evidence", targets: ["New evidence records", "DD materials prepared", "Customer feedback captured"], currentWeek: "All 0" },
];

export const WEEKLY_TARGET_RULE = "Targets are ADJUSTABLE based on actual conversion data. Do NOT create arbitrary targets that ignore Founder capacity. Targets refine as real data accumulates.";

// ═══════════════════════════════════════════════════════════════
// PART 24 — FOUNDER TIME ALLOCATION
// ═══════════════════════════════════════════════════════════════

export const FOUNDER_TIME_ALLOCATION = [
  { priority: "P0", activity: "Direct customer conversations", principle: "Highest value — revenue + evidence" },
  { priority: "P0", activity: "Strategic partner conversations", principle: "Law/accounting/banking first" },
  { priority: "P0", activity: "Regulatory/institutional relationships", principle: "FRA, CBE, PDPL engagement" },
  { priority: "P1", activity: "High-value product decisions", principle: "Only what customers/partners need" },
  { priority: "P1", activity: "Commercial proposals", principle: "Revenue-linked" },
  { priority: "P2", activity: "Administrative work", principle: "Minimize; automate/delegate" },
  { priority: "P3", activity: "Tasks that can be automated/delegated", principle: "Do NOT do; delegate" },
];

export const TIME_ALLOCATION_RULE = "The Founder should spend INCREASING time on external value creation (customers, partners, regulators) rather than internal framework development. Architecture is complete; execution is the product.";

// ═══════════════════════════════════════════════════════════════
// PART 30-31 — FIRST CUSTOMER + FIRST PARTNER SUCCESS STANDARDS
// ═══════════════════════════════════════════════════════════════

export const FIRST_CUSTOMER_STANDARD = {
  idealTraits: ["Real problem", "Willingness to collaborate", "Measurable outcome potential", "Reasonable implementation scope", "Reference potential", "Strategic credibility"],
  rule: "Do NOT pursue vanity customers. However, do NOT reject a viable customer solely because it is not prestigious. Revenue and learning matter.",
};

export const FIRST_PARTNER_STANDARD = {
  successRequires: ["Qualified introduction", "Customer referral", "Legal validation", "Accounting support", "Banking access", "Institutional introduction", "Deployment support", "Regulatory navigation", "Technology integration"],
  rule: "A strategic partner is successful ONLY if it produces measurable value. An MoU without activity is NOT meaningful traction.",
};

// ═══════════════════════════════════════════════════════════════
// PART 19-20 — REGULATORY ACTIVATION + STATUS LANGUAGE
// ═══════════════════════════════════════════════════════════════

export const REGULATORY_ACTIVATION = {
  moveFrom: "REGULATORY PLAN → REGULATORY PREPARATION → ACTUAL ENGAGEMENT",
  beforeSubmission: ["Verify legal basis", "Verify responsible authority", "Verify required documentation", "Obtain legal review where appropriate", "Document the question", "Document the intended outcome"],
  rule: "Never submit something simply to claim 'regulatory engagement.' Every engagement must have a legitimate purpose.",
};

export const REGULATORY_STATUS_LANGUAGE = [
  { status: "NOT SUBMITTED", meaning: "No formal submission" },
  { status: "PREPARING", meaning: "Materials being prepared" },
  { status: "SUBMITTED", meaning: "Actual submission occurred" },
  { status: "ACKNOWLEDGED", meaning: "Authority acknowledged receipt" },
  { status: "UNDER REVIEW", meaning: "Evidence exists that review is occurring" },
  { status: "RESPONSE RECEIVED", meaning: "Actual response received" },
  { status: "APPROVED / REGISTERED / LICENSED", meaning: "Only when legally documented" },
];

export const REGULATORY_LANGUAGE_RULE = "Strictly enforce these statuses. NEVER collapse them. NEVER represent 'approved' when status is 'submitted', 'under review', 'engaged', 'discussed', or 'pending'. Current: Companies + Tax APPROVED; FRA/CBE/PDPL NOT SUBMITTED.";

// ═══════════════════════════════════════════════════════════════
// PART 36 — DATA INTEGRITY
// ═══════════════════════════════════════════════════════════════

export const DATA_INTEGRITY = {
  requiredFields: ["created_at", "updated_at", "owner", "source", "evidence", "status", "next_action"],
  optionalLinks: ["relationship", "organization", "opportunity", "partner", "customer", "regulatory_body", "document"],
  verificationRule: "Do NOT allow users to mark a claim as 'verified' without evidence. Verification requires linked evidence artifact.",
  auditTrail: "All execution records auditable. Sensitive information (customer, legal, regulatory, financial, DD, partner contracts, personal contacts) restricted + RBAC enforced.",
};

// ═══════════════════════════════════════════════════════════════
// HONEST CERTIFICATION
// ═══════════════════════════════════════════════════════════════

export const HONEST_CERTIFICATION = {
  title: "AURIENTA MARKET ACTIVATION SYSTEM v1.0 — HONEST CERTIFICATION",
  verdict: "EXECUTION-READY",
  achieved: [
    "ARCHITECTURALLY COMPLETE (phases 1-12 frozen)",
    "EXECUTION-READY (MES v1.0 + MAS v1.0 machinery works)",
  ],
  notAchieved: [
    "CUSTOMER TRACTION (0 customers — not validated)",
    "PILOT VALIDATION (0 pilots — not validated)",
    "COMMERCIAL VALIDATION (0 collected revenue — not validated)",
    "INSTITUTIONAL VALIDATION (0 formal institutional recognition — not validated)",
    "SCALE READINESS (INSUFFICIENT DATA — not validated)",
  ],
  factualBaseline: FACTUAL_BASELINE,
  evidenceLevel: "E0 (Founder assumptions only — no market evidence yet)",
  statement: "AURIENTA's Market Activation System is EXECUTION-READY. The machinery to execute the first 100 targets, conduct outreach, run discovery, convert pilots, and collect revenue is complete and operational. However, AURIENTA has NOT yet executed. All counts are 0. All evidence is E0. No claim of customer traction, pilot validation, commercial validation, institutional validation, or scale readiness may be made without evidence. The next step is NOT more architecture — it is real market contact: CONTACT → CONVERSATION → COMMITMENT → DEPLOYMENT → OUTCOME → REVENUE → EVIDENCE → REPEATABILITY → SCALE.",
  next10Actions: [
    "1. Research first 25 Egypt target enterprises (permitted sources + confidence levels)",
    "2. Score + tier each target (qualification model, threshold 3.5)",
    "3. Identify decision-makers for top 10 P0 targets",
    "4. Prepare context-aware outreach for first 5 P0 targets (not generic)",
    "5. Send first 5 outreach messages",
    "6. Research 3-5 strategic law firm candidates (law-firm-first strategy)",
    "7. Prepare FRA engagement brief (verify legal basis + responsible authority)",
    "8. Establish CRM discipline (target accounts + outreach log + evidence ledger)",
    "9. Begin Founder daily command (Top 5 actions each morning)",
    "10. Produce first weekly review at end of week 1",
  ],
  actualBlockers: [
    "0 targets researched (must build target list)",
    "0 outreach sent (must begin contact)",
    "0 partners signed (must execute partner campaigns)",
    "0 regulatory engagement (FRA/CBE/PDPL not submitted)",
    "0 revenue (must reach Gate 4 — collected revenue)",
    "0 evidence above E0 (must generate market evidence)",
  ],
  evidenceGaps: [
    "Customer evidence (E2-E9 — none exists)",
    "Partner evidence (no signed partners)",
    "Revenue evidence (0 collected)",
    "Regulatory evidence (engagement pending, not formal)",
    "Pilot evidence (0 pilots)",
    "Case study evidence (0 published)",
    "Market objection evidence (0 losses analyzed)",
    "PMF evidence (INSUFFICIENT DATA)",
  ],
  readinessScore: FACTUAL_BASELINE.commercialReadiness,
  certifiedBy: "Combined Executive Leadership (Prompt 13: COO + CCO + CSO + Sales + CS + RevOps + Founder Office)",
  certifiedAt: MAS_FROZEN_AT,
  rule: "Issue only the certification supported by evidence. Do NOT certify customer traction, pilot validation, commercial validation, institutional validation, or scale readiness unless actual evidence supports them.",
};

// ═══════════════════════════════════════════════════════════════
// COO DIRECTIVE — THE EXECUTION FLYWHEEL
// ═══════════════════════════════════════════════════════════════

export const COO_DIRECTIVE = {
  rule: "STOP BUILDING FOR THE SAKE OF BUILDING. AURIENTA does not need another sophisticated architecture to prove it can design sophisticated architecture.",
  whatAURIENTANeeds: [
    "1 real conversation",
    "Then 10 real conversations",
    "Then 1 real partner",
    "Then 1 real customer",
    "Then 1 real deployment",
    "Then 1 real payment",
    "Then 1 measurable customer outcome",
    "Then repeatability",
    "Then scale",
  ],
  flywheel: "CONTACT → CONVERSATION → COMMITMENT → DEPLOYMENT → OUTCOME → REVENUE → EVIDENCE → REPEATABILITY → SCALE",
  mandate: "The next stage of AURIENTA's maturity must come from REALITY. Do NOT return with another architecture expansion unless real-world evidence proves that an actual capability is missing. MARKET EXECUTION IS NOW THE PRODUCT.",
};

// ═══════════════════════════════════════════════════════════════
// SYNCHRONIZATION
// ═══════════════════════════════════════════════════════════════

export const MAS_SYNCHRONIZATION = {
  extendsMES: "MAS v1.0 extends MES v1.0 — same execution engine, same integrity rule, same gates, same honest zeros.",
  noNewArchitecture: "No new architecture. Reuses MES, ACS, GLS, FOCC, ITDB, AOS, Governance, Risk/Security/Compliance.",
  executionTooling: "This is execution TOOLING (target engine, outreach, discovery, evidence, daily command) — not a new framework.",
  honestZeros: "All counts 0. All statuses UNKNOWN / NOT STARTED / COLD OUTREACH REQUIRED. No fabrication.",
  brainAiMarketAgent: "Brain AI is Founder Market Agent — action-oriented, never invents, returns actual targets/blockers/follow-ups.",
  marketExecutionIsProduct: "MARKET EXECUTION IS NOW THE PRODUCT. The execution flywheel: CONTACT → CONVERSATION → COMMITMENT → DEPLOYMENT → OUTCOME → REVENUE → EVIDENCE → REPEATABILITY → SCALE.",
};
