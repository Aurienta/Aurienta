// AURIENTA Strategic Partner, Regulatory & Institutional Relationship Execution System (SPRRE) v1.0
// ═══════════════════════════════════════════════════════════════
// This is a FOCUSED EXECUTION CAPABILITY — not new architecture.
// It extends MES/MAS/CPR/GLS/FOCC/ITDB with the actual machinery to
// execute strategic partner + regulatory + institutional relationships.
//
// REUSES (does NOT duplicate):
//   - MES v1.0 (partner execution, regulatory engagement)
//   - MAS v1.0 (relationship map, introduction engine, outreach)
//   - CPR v1.0 (evidence integrity E0-E9, claim control)
//   - GLS v1.0 (partner types, government stakeholders, DD center)
//   - FOCC v1.0 (knowledge graph, daily command)
//   - ITDB v1.0 (evidence, trust)
//   - ACS v1.0 (partner lifecycle, pricing)
//   - AOS v1.0 (partner SOPs)
//
// EVIDENCE INTEGRITY (ABSOLUTE): E0-E9 hierarchy. No fabrication.
// UNKNOWN = UNKNOWN. REQUIRES COUNSEL = REQUIRES COUNSEL.
// REQUIRES REGULATORY = REQUIRES REGULATORY. No promotion without evidence.
//
// HONESTY DEFAULT: All counts 0. Evidence ceiling E0.
// Current signed partners: 0. Regulatory approvals: 0.
//
// DO NOT modify without Founder approval.
// ═══════════════════════════════════════════════════════════════

export const SPRRE_VERSION = "1.0";
export const SPRRE_FROZEN_AT = "2026-08-18";

// ═══════════════════════════════════════════════════════════════
// CURRENT HONEST BASELINE (E0 ceiling — no fabrication)
// ═══════════════════════════════════════════════════════════════

export const CURRENT_BASELINE_SPRRE = {
  signedStrategicPartners: 0,
  activeStrategicPartners: 0,
  partnerGeneratedCustomers: 0,
  partnerGeneratedRevenue: 0,
  regulatoryApprovals: 0,
  formalRegulatoryEngagements: 0,
  regulatorySubmissions: 0,
  measuredPartnerOutcomes: 0,
  institutionalReferences: 0,
  repeatableInstitutionalOutcomes: 0,
  evidenceCeiling: "E0" as const,
  statement: "Current evidence ceiling: E0. No strategic partnership, regulatory approval, institutional recognition, or commercial outcome is claimed without evidence. The system is allowed to show targets, research, planned actions, and pending outreach — but must NEVER represent them as outcomes.",
};

// ═══════════════════════════════════════════════════════════════
// PART 5 — STRATEGIC PARTNER ENGINE (16 categories, P0-P3)
// ═══════════════════════════════════════════════════════════════

export type PartnerCategory = {
  categoryId: string;
  category: string;
  priority: "P0" | "P1" | "P2" | "P3";
  signed: number;
  status: string;
};

export const PARTNER_CATEGORIES: PartnerCategory[] = [
  // P0 — highest priority
  { categoryId: "PC-01", category: "Law firms", priority: "P0", signed: 0, status: "Targeting — law-firm-first campaign pending" },
  { categoryId: "PC-02", category: "Accounting firms", priority: "P0", signed: 0, status: "Targeting — outreach pending" },
  { categoryId: "PC-03", category: "Banking institutions", priority: "P0", signed: 0, status: "Targeting — outreach pending" },
  // P1
  { categoryId: "PC-04", category: "Universities", priority: "P1", signed: 0, status: "Targeting — future" },
  { categoryId: "PC-05", category: "ERP/accounting technology providers", priority: "P1", signed: 0, status: "Targeting — future" },
  { categoryId: "PC-06", category: "Cloud/infrastructure providers", priority: "P1", signed: 0, status: "Targeting — future" },
  { categoryId: "PC-07", category: "Enterprise technology partners", priority: "P1", signed: 0, status: "Targeting — future" },
  { categoryId: "PC-08", category: "Government-linked institutions", priority: "P1", signed: 0, status: "Targeting — future" },
  // P2
  { categoryId: "PC-09", category: "Development banks", priority: "P2", signed: 0, status: "Future — post-domestic validation" },
  { categoryId: "PC-10", category: "Chambers of commerce", priority: "P2", signed: 0, status: "Future" },
  { categoryId: "PC-11", category: "Industry associations", priority: "P2", signed: 0, status: "Future" },
  { categoryId: "PC-12", category: "Professional associations", priority: "P2", signed: 0, status: "Future" },
  { categoryId: "PC-13", category: "Consulting firms", priority: "P2", signed: 0, status: "Future" },
  { categoryId: "PC-14", category: "Corporate alliances", priority: "P2", signed: 0, status: "Future" },
  // P3
  { categoryId: "PC-15", category: "International strategic alliances", priority: "P3", signed: 0, status: "Long-term" },
  { categoryId: "PC-16", category: "Global institutional partners", priority: "P3", signed: 0, status: "Long-term" },
];

export const PARTNER_CATEGORY_RULE = "Do NOT assume any partner exists. Current actual signed count: 0 until evidence proves otherwise. P0 (law/accounting/banking) is the immediate focus — law-firm-first strategy.";

// ═══════════════════════════════════════════════════════════════
// PART 6 — PARTNER TARGET SCHEMA (30 fields, UNKNOWN default)
// ═══════════════════════════════════════════════════════════════

export type PartnerTargetField = {
  field: string;
  defaultIfUnknown: string;
};

export const PARTNER_TARGET_SCHEMA: PartnerTargetField[] = [
  { field: "Partner ID", defaultIfUnknown: "Auto-generated" },
  { field: "Organization name", defaultIfUnknown: "UNKNOWN / RESEARCH REQUIRED" },
  { field: "Organization type", defaultIfUnknown: "UNKNOWN" },
  { field: "Country", defaultIfUnknown: "Egypt (default Year 1)" },
  { field: "Region", defaultIfUnknown: "UNKNOWN" },
  { field: "Website", defaultIfUnknown: "UNKNOWN" },
  { field: "Source", defaultIfUnknown: "UNKNOWN / RESEARCH REQUIRED" },
  { field: "Source confidence", defaultIfUnknown: "UNKNOWN (HIGH/MEDIUM/LOW once researched)" },
  { field: "Organization size", defaultIfUnknown: "UNKNOWN" },
  { field: "Strategic relevance", defaultIfUnknown: "UNKNOWN" },
  { field: "Geographic relevance", defaultIfUnknown: "UNKNOWN" },
  { field: "Sector relevance", defaultIfUnknown: "UNKNOWN" },
  { field: "Legal/regulatory relevance", defaultIfUnknown: "UNKNOWN" },
  { field: "Customer access potential", defaultIfUnknown: "UNKNOWN" },
  { field: "Institutional credibility", defaultIfUnknown: "UNKNOWN" },
  { field: "Technical compatibility", defaultIfUnknown: "UNKNOWN" },
  { field: "Commercial potential", defaultIfUnknown: "UNKNOWN" },
  { field: "Introduction path", defaultIfUnknown: "COLD OUTREACH REQUIRED (no introduction path identified)" },
  { field: "Decision-maker", defaultIfUnknown: "UNKNOWN / RESEARCH REQUIRED" },
  { field: "Decision-maker role", defaultIfUnknown: "UNKNOWN" },
  { field: "Contact status", defaultIfUnknown: "Not contacted" },
  { field: "Relationship strength (0-5)", defaultIfUnknown: "0 (unknown)" },
  { field: "Current evidence level", defaultIfUnknown: "E0" },
  { field: "Current lifecycle stage", defaultIfUnknown: "TARGET" },
  { field: "Last interaction", defaultIfUnknown: "Never" },
  { field: "Next action", defaultIfUnknown: "Research + outreach" },
  { field: "Owner", defaultIfUnknown: "Founder (Advisory)" },
  { field: "Priority", defaultIfUnknown: "Not prioritized" },
  { field: "Risk", defaultIfUnknown: "UNKNOWN" },
  { field: "Notes", defaultIfUnknown: "—" },
  { field: "Evidence references", defaultIfUnknown: "None yet" },
];

export const PARTNER_SCHEMA_RULE = "UNKNOWN must be the default. Never infer missing facts. Every field fills only through actual research + evidence.";

// ═══════════════════════════════════════════════════════════════
// PART 7 — PARTNER SCORING (transparent, weighted, 0-5)
// ═══════════════════════════════════════════════════════════════

export type ScoringDimension = {
  dimension: string;
  weight: number;
};

export const PARTNER_SCORING_DIMENSIONS: ScoringDimension[] = [
  { dimension: "Strategic relevance", weight: 5 },
  { dimension: "Customer access", weight: 5 },
  { dimension: "Institutional credibility", weight: 4 },
  { dimension: "Geographic value", weight: 3 },
  { dimension: "Regulatory value", weight: 4 },
  { dimension: "Complementarity", weight: 4 },
  { dimension: "Technical compatibility", weight: 3 },
  { dimension: "Commercial potential", weight: 4 },
  { dimension: "Introduction probability", weight: 3 },
  { dimension: "Execution feasibility", weight: 4 },
];

export const PARTNER_SCORING_MODEL = {
  method: "Each dimension scored 0-5. Weighted score = Σ(score × weight) / Σ(weights). Range 0.0-5.0.",
  tierMapping: [
    { range: "4.0-5.0", tier: "P0", meaning: "Highest priority — anchor potential" },
    { range: "3.0-3.9", tier: "P1", meaning: "High potential" },
    { range: "2.0-2.9", tier: "P2", meaning: "Strategic development" },
    { range: "0.0-1.9", tier: "P3", meaning: "Long-term" },
  ],
  perScoreRequired: ["Score", "Rationale", "Evidence", "Date", "Reviewer"],
  rule: "Do NOT allow the score to become a fabricated fact. Every score shows score + rationale + evidence + date + reviewer. Current scored partners: 0.",
};

// ═══════════════════════════════════════════════════════════════
// PART 8 — LAW-FIRM-FIRST EXECUTION (campaign)
// ═══════════════════════════════════════════════════════════════

export type LawFirmField = {
  field: string;
  defaultIfUnknown: string;
};

export const LAW_FIRM_CAMPAIGN_SCHEMA: LawFirmField[] = [
  { field: "Legal name", defaultIfUnknown: "UNKNOWN / RESEARCH REQUIRED" },
  { field: "Relevant practice areas", defaultIfUnknown: "UNKNOWN" },
  { field: "Corporate law capability", defaultIfUnknown: "UNKNOWN" },
  { field: "Financial-regulatory capability", defaultIfUnknown: "UNKNOWN" },
  { field: "Technology/IP capability", defaultIfUnknown: "UNKNOWN" },
  { field: "Cross-border capability", defaultIfUnknown: "UNKNOWN" },
  { field: "Relevant institutional clients (publicly verifiable only)", defaultIfUnknown: "UNKNOWN / RESEARCH REQUIRED" },
  { field: "Partner/contact", defaultIfUnknown: "UNKNOWN / RESEARCH REQUIRED" },
  { field: "Source", defaultIfUnknown: "UNKNOWN" },
  { field: "Confidence", defaultIfUnknown: "UNKNOWN (HIGH/MEDIUM/LOW)" },
  { field: "Why AURIENTA may be relevant", defaultIfUnknown: "UNKNOWN (hypothesis — mark as such)" },
  { field: "Potential role", defaultIfUnknown: "UNKNOWN" },
  { field: "Risk", defaultIfUnknown: "UNKNOWN" },
  { field: "Evidence level", defaultIfUnknown: "E0" },
  { field: "Next action", defaultIfUnknown: "Research + outreach" },
];

export const LAW_FIRM_CAMPAIGN = {
  objective: "Research 3-5 credible Egyptian law-firm candidates as the FIRST partner campaign (law-firm-first strategy).",
  reason: "AURIENTA's immediate institutional strategy requires legal/regulatory credibility. Law firms provide Amendment IX compliance, Law Firm Client Account network, and constitutional model legal foundation.",
  currentCandidatesResearched: 0,
  rule: "No fabricated reputation claims. Every fact sourced with confidence level. Current candidates: 0 (research pending).",
};

// ═══════════════════════════════════════════════════════════════
// PART 9 — PARTNER OUTREACH ENGINE (12 states)
// ═══════════════════════════════════════════════════════════════

export type OutreachRecordField = {
  field: string;
  defaultIfUnknown: string;
};

export const PARTNER_OUTREACH_SCHEMA: OutreachRecordField[] = [
  { field: "Target", defaultIfUnknown: "UNKNOWN" },
  { field: "Recipient", defaultIfUnknown: "UNKNOWN / RESEARCH REQUIRED" },
  { field: "Why this organization", defaultIfUnknown: "UNKNOWN" },
  { field: "Why this person", defaultIfUnknown: "UNKNOWN" },
  { field: "Relevant AURIENTA problem/solution", defaultIfUnknown: "UNKNOWN" },
  { field: "Specific reason for contact", defaultIfUnknown: "UNKNOWN" },
  { field: "Proposed next step", defaultIfUnknown: "UNKNOWN" },
  { field: "Date", defaultIfUnknown: "Not sent" },
  { field: "Channel", defaultIfUnknown: "UNKNOWN" },
  { field: "Status", defaultIfUnknown: "NOT PREPARED" },
  { field: "Response", defaultIfUnknown: "No response" },
  { field: "Evidence", defaultIfUnknown: "None" },
  { field: "Follow-up date", defaultIfUnknown: "Not scheduled" },
];

export const PARTNER_OUTREACH_LIFECYCLE = [
  "NOT PREPARED", "PREPARED", "APPROVED", "SENT", "DELIVERED", "RESPONDED",
  "MEETING", "FOLLOW-UP", "QUALIFIED", "DISQUALIFIED", "NEGOTIATION", "AGREEMENT",
];

export const OUTREACH_RULE = "No mass spam. Each outreach is context-aware. Current outreach sent: 0.";

// ═══════════════════════════════════════════════════════════════
// PART 10 — INTRODUCTION ENGINE (extends MAS Relationship Map)
// ═══════════════════════════════════════════════════════════════

export const INTRODUCTION_PATHS = [
  "Founder network",
  "Existing partner",
  "Lawyer",
  "Accountant",
  "Banker",
  "University",
  "Government contact",
  "Industry association",
  "Chamber",
  "Professional network",
  "Cold outreach",
];

export const INTRODUCTION_ENGINE_SPRRE = {
  question: "Who can introduce AURIENTA to this institution?",
  method: "Extend MAS Relationship Map. Traverse graph for introduction paths. Use ACTUAL relationship data only.",
  rule: "NEVER fabricate an introduction path. If none exists: COLD OUTREACH REQUIRED.",
  currentStatus: "0 relationships recorded. All introductions require COLD OUTREACH until relationships are built.",
};

// ═══════════════════════════════════════════════════════════════
// PART 11 — REGULATORY ENGAGEMENT ENGINE
// ═══════════════════════════════════════════════════════════════

export type AuthorityField = {
  field: string;
  defaultIfUnknown: string;
};

export const REGULATORY_AUTHORITY_SCHEMA: AuthorityField[] = [
  { field: "Authority", defaultIfUnknown: "UNKNOWN / RESEARCH REQUIRED" },
  { field: "Legal mandate", defaultIfUnknown: "UNKNOWN" },
  { field: "Relevant laws/regulations", defaultIfUnknown: "UNKNOWN" },
  { field: "Why AURIENTA may fall within scope", defaultIfUnknown: "UNKNOWN (hypothesis)" },
  { field: "Why AURIENTA may NOT fall within scope", defaultIfUnknown: "UNKNOWN (hypothesis)" },
  { field: "Licensing question", defaultIfUnknown: "UNKNOWN" },
  { field: "Registration question", defaultIfUnknown: "UNKNOWN" },
  { field: "No-action / interpretive question", defaultIfUnknown: "UNKNOWN" },
  { field: "Data protection relevance", defaultIfUnknown: "UNKNOWN" },
  { field: "Payment/financial relevance", defaultIfUnknown: "UNKNOWN" },
  { field: "Corporate relevance", defaultIfUnknown: "UNKNOWN" },
  { field: "Current status", defaultIfUnknown: "NOT RESEARCHED" },
  { field: "Legal basis", defaultIfUnknown: "UNKNOWN (REQUIRES COUNSEL)" },
  { field: "Responsible owner", defaultIfUnknown: "Founder (Advisory + Legal)" },
  { field: "Next action", defaultIfUnknown: "Research legal basis" },
  { field: "Evidence", defaultIfUnknown: "None" },
  { field: "Date verified", defaultIfUnknown: "Not verified" },
  { field: "External counsel review status", defaultIfUnknown: "NOT ENGAGED" },
];

export const EGYPT_AUTHORITY_UNIVERSE = [
  { authority: "FRA (Financial Regulatory Authority)", status: "NOT RESEARCHED", evidence: "No engagement" },
  { authority: "Central Bank of Egypt", status: "NOT RESEARCHED", evidence: "No engagement" },
  { authority: "Data Protection Authority (PDPL)", status: "NOT RESEARCHED", evidence: "No engagement" },
  { authority: "Companies Authority", status: "APPROVED", evidence: "Entity registered (operational)" },
  { authority: "Tax Authority", status: "APPROVED", evidence: "Tax registration complete (operational)" },
  { authority: "Other authorities (identified through legal research)", status: "NOT RESEARCHED", evidence: "TBD via legal research" },
];

export const REGULATORY_ENGINE_RULE = "Do NOT assume regulatory applicability. Every authority requires legal basis verification. Current formal engagements: 0 (Companies + Tax are operational registrations, not regulatory engagement).";

// ═══════════════════════════════════════════════════════════════
// PART 12 — REGULATORY STATUS MODEL (15 explicit statuses)
// ═══════════════════════════════════════════════════════════════

export const REGULATORY_STATUSES = [
  "NOT RESEARCHED",
  "RESEARCHED",
  "LEGAL BASIS VERIFIED",
  "ENGAGEMENT PREPARED",
  "CONTACT IDENTIFIED",
  "OUTREACH SENT",
  "MEETING REQUESTED",
  "MEETING HELD",
  "INFORMATION REQUESTED",
  "FORMAL SUBMISSION",
  "UNDER REVIEW",
  "GUIDANCE RECEIVED",
  "APPROVED",
  "REJECTED",
  "CLOSED",
];

export const REGULATORY_STATUS_RULE = {
  rule: "Do NOT collapse these states. Do NOT label an authority 'partner.' Do NOT label engagement 'approval.' Do NOT label legal research 'regulatory clearance.'",
  currentHonestStatus: "FRA: NOT RESEARCHED. CBE: NOT RESEARCHED. PDPL: NOT RESEARCHED. Companies: APPROVED (operational). Tax: APPROVED (operational).",
};

// ═══════════════════════════════════════════════════════════════
// PART 13 — REGULATORY BRIEF GENERATOR (17 sections)
// ═══════════════════════════════════════════════════════════════

export type BriefSection = {
  section: string;
  classification: "FACT" | "LEGAL QUESTION" | "ASSUMPTION" | "REQUIRES COUNSEL" | "REQUIRES REGULATOR";
};

export const REGULATORY_BRIEF_SECTIONS: BriefSection[] = [
  { section: "1. AURIENTA description", classification: "FACT" },
  { section: "2. Constitutional model", classification: "FACT" },
  { section: "3. Business model", classification: "FACT" },
  { section: "4. What AURIENTA does", classification: "FACT" },
  { section: "5. What AURIENTA does NOT do", classification: "FACT" },
  { section: "6. Custody model (Zero Custody)", classification: "FACT" },
  { section: "7. Capital architecture", classification: "FACT" },
  { section: "8. Technology architecture", classification: "FACT" },
  { section: "9. Data architecture", classification: "FACT" },
  { section: "10. Relevant jurisdiction", classification: "FACT" },
  { section: "11. Regulatory questions", classification: "LEGAL QUESTION" },
  { section: "12. Specific clarification requested", classification: "REQUIRES REGULATOR" },
  { section: "13. Supporting documents", classification: "FACT" },
  { section: "14. Evidence", classification: "FACT" },
  { section: "15. Questions for counsel", classification: "REQUIRES COUNSEL" },
  { section: "16. Questions for regulator", classification: "REQUIRES REGULATOR" },
  { section: "17. Open uncertainties", classification: "ASSUMPTION" },
];

export const REGULATORY_BRIEF_RULE = {
  rule: "Brain AI generates regulatory briefs with 17 sections. Each section classified as FACT / LEGAL QUESTION / ASSUMPTION / REQUIRES COUNSEL / REQUIRES REGULATOR. NEVER generate legal conclusions as established facts.",
  currentBriefs: 0,
};

// ═══════════════════════════════════════════════════════════════
// PART 14 — INSTITUTIONAL RELATIONSHIP GRAPH
// ═══════════════════════════════════════════════════════════════

export const RELATIONSHIP_GRAPH_ENTITIES = [
  "Founder", "Holding", "Operations", "Advisory", "Enterprise", "Partner",
  "Government", "Regulator", "Law firm", "Accounting firm", "Bank",
  "University", "Association", "Contact", "Meeting", "Agreement",
  "Regulatory matter", "Evidence", "Opportunity", "Introduction",
];

export const RELATIONSHIP_GRAPH_EDGES = [
  "INTRODUCED_BY", "CONTACTED", "MET", "ADVISED", "PARTNERED_WITH",
  "NEGOTIATING_WITH", "LICENSED_TO", "REFERRED_BY", "REGULATED_BY",
  "ENGAGED_WITH", "SUPPORTS", "BLOCKS", "CONNECTED_TO",
];

export const RELATIONSHIP_GRAPH_QUERIES = [
  "Who knows whom?",
  "Who can introduce us?",
  "Which relationships are weak?",
  "Which institutions have multiple connections to AURIENTA?",
  "Which partner could accelerate customer acquisition?",
  "Which regulatory matter is blocked?",
  "Who owns the next action?",
];

export const RELATIONSHIP_GRAPH_RULE = {
  rule: "Extend FOCC Executive Knowledge Graph. Brain AI traverses for warm intros, conflict detection, dependency analysis, blocker identification. Current relationships in graph: 0.",
  currentNodes: 0,
  currentEdges: 0,
};

// ═══════════════════════════════════════════════════════════════
// PART 15 — PARTNERSHIP VALUE CHAIN (15 value types)
// ═══════════════════════════════════════════════════════════════

export const PARTNERSHIP_VALUE_TYPES = [
  "Customer access", "Legal capability", "Regulatory capability", "Institutional credibility",
  "Distribution", "Technology", "Implementation", "Certification", "Training",
  "Geographic expansion", "Government access", "Capital access", "Infrastructure",
  "Data", "Market intelligence",
];

export const VALUE_CHAIN_RULE = "No partnership should exist merely because it 'looks prestigious.' The system must answer: What measurable value could this relationship create? Every proposed partner identifies expected value type(s).";

// ═══════════════════════════════════════════════════════════════
// PART 16 — PARTNER DUE DILIGENCE (18 checks)
// ═══════════════════════════════════════════════════════════════

export const PARTNER_DD_CHECKS = [
  "Legal identity verification",
  "Ownership verification (where appropriate)",
  "Reputation review",
  "Conflict check",
  "Regulatory status",
  "Sanctions screening (where appropriate)",
  "AML/KYC requirements (where applicable)",
  "Cybersecurity review (where relevant)",
  "Data protection review",
  "Commercial rationale",
  "Scope definition",
  "Responsibilities",
  "Termination rights",
  "IP rights",
  "Confidentiality",
  "Publicity rights",
  "Compliance obligations",
  "Evidence requirements",
];

export const PARTNER_DD_RULE = "Do NOT sign a partner merely because they are well known. All 18 DD checks required before signing. Current DD completed: 0.";

// ═══════════════════════════════════════════════════════════════
// PART 17 — PARTNER AGREEMENT CONTROL (10 types + 5 state distinctions)
// ═══════════════════════════════════════════════════════════════

export const AGREEMENT_TYPES = [
  "NDA", "MoU", "Strategic Partnership Agreement", "Referral Agreement",
  "Framework Agreement", "Technology Partnership", "Academic Partnership",
  "Government Cooperation Agreement", "Certified Partner Agreement",
  "Implementation Partnership",
];

export const AGREEMENT_STATE_DISTINCTIONS = [
  { state: "TARGET", meaning: "Identified but no contact" },
  { state: "NEGOTIATION", meaning: "In active negotiation (no signed agreement)" },
  { state: "SIGNED AGREEMENT", meaning: "Legally executed agreement exists" },
  { state: "ACTIVE PARTNER", meaning: "Activated per 9 activation requirements" },
  { state: "MEASURED PARTNER OUTCOME", meaning: "Produced measurable value" },
];

export const AGREEMENT_RULE = "The system MUST distinguish TARGET from NEGOTIATION from SIGNED AGREEMENT from ACTIVE PARTNER from MEASURED PARTNER OUTCOME. A signed agreement does NOT automatically equal an active partnership. Current signed: 0. Current active: 0.";

// ═══════════════════════════════════════════════════════════════
// PART 18 — PARTNER ACTIVATION (9 requirements)
// ═══════════════════════════════════════════════════════════════

export const PARTNER_ACTIVATION_REQUIREMENTS = [
  "Agreement verified",
  "Responsible owners assigned",
  "Joint objective defined",
  "Joint operating plan",
  "Communication channel established",
  "First activity completed",
  "First measurable outcome produced",
  "Review cadence established",
  "Evidence recorded",
];

export const ACTIVATION_RULE = "A signed agreement does NOT automatically equal an active partnership. Only when ALL 9 activation requirements are met can the partner be marked ACTIVE. Current active partners: 0.";

// ═══════════════════════════════════════════════════════════════
// PART 19 — PARTNER PERFORMANCE
// ═══════════════════════════════════════════════════════════════

export const PARTNER_PERFORMANCE_METRICS = [
  "Introductions", "Qualified opportunities", "Meetings", "Referrals",
  "Customers", "Deployments", "Revenue", "Regulatory access",
  "Institutional outcomes", "Response time", "Commitment completion",
  "Partner health", "Strategic value",
];

export const PERFORMANCE_RULE = "Partner claims must be evidence-backed. Current partner-generated outcomes: 0 (no active partners).";

// ═══════════════════════════════════════════════════════════════
// PART 20 — REGULATORY + PARTNER DEPENDENCY MAP
// ═══════════════════════════════════════════════════════════════

export const DEPENDENCY_MAP = {
  structure: "AURIENTA → Law Firm (legal validation, regulatory interpretation) + Accounting Partner (accounting model, financial controls) + Banking Partner (banking architecture) + Regulator (regulatory clarity) + Enterprise (market validation)",
  blockerChainExample: "Customer deployment blocked → Regulatory uncertainty → Legal question unresolved → Law firm engagement required",
  rule: "The system surfaces dependencies + blockers to the Founder. Identifies which partner/regulator unblocks which customer/opportunity.",
  currentBlockers: "All paths blocked at the first step — 0 partners signed, 0 regulatory engagement. Law-firm-first is the critical path.",
};

// ═══════════════════════════════════════════════════════════════
// PART 21 — FOUNDER DAILY COMMAND
// ═══════════════════════════════════════════════════════════════

export const FOUNDER_DAILY_COMMAND_SPRRE = {
  sections: [
    "TOP 5 PARTNER ACTIONS",
    "TOP 5 REGULATORY ACTIONS",
    "TOP 5 INSTITUTIONAL ACTIONS",
    "BLOCKERS",
    "FOLLOW-UPS DUE",
    "HIGH-VALUE INTRODUCTIONS",
    "DECISIONS REQUIRED FROM FOUNDER",
  ],
  rule: "Generated from ACTUAL records. No generic motivational tasks. Current state: all empty (execution begins).",
  currentTopActions: [
    "1. Research 3-5 Egyptian law-firm candidates (law-firm-first)",
    "2. Research 3 accounting firm candidates",
    "3. Research 3 banking candidates",
    "4. Research FRA legal basis + mandate (REQUIRES COUNSEL)",
    "5. Research CBE legal basis (Zero Custody positioning)",
    "6. Research PDPL compliance requirements",
    "7. Identify decision-makers for law-firm candidates",
    "8. Prepare first law-firm outreach (context-aware)",
    "9. Prepare regulatory brief draft (17 sections)",
    "10. Establish partner CRM discipline (targets + outreach + evidence)",
  ],
};

// ═══════════════════════════════════════════════════════════════
// PART 22 — WEEKLY INSTITUTIONAL RELATIONSHIP REVIEW
// ═══════════════════════════════════════════════════════════════

export type WeeklyMetric = {
  metric: string;
  actual: string;
  target: string;
  forecast: string;
};

export const WEEKLY_REVIEW_SPRRE: WeeklyMetric[] = [
  { metric: "New targets", actual: "0", target: "5-10/week", forecast: "Building" },
  { metric: "Targets researched", actual: "0", target: "5-10/week", forecast: "Building" },
  { metric: "Contacts identified", actual: "0", target: "5/week", forecast: "Building" },
  { metric: "Outreach sent", actual: "0", target: "5/week", forecast: "Building" },
  { metric: "Responses", actual: "0", target: "2-3/week", forecast: "Depends on outreach" },
  { metric: "Meetings", actual: "0", target: "1-2/week", forecast: "Depends on responses" },
  { metric: "Qualified relationships", actual: "0", target: "1-2/week", forecast: "Depends on meetings" },
  { metric: "Disqualified relationships", actual: "0", target: "As needed", forecast: "Healthy disqualification" },
  { metric: "Agreements in negotiation", actual: "0", target: "1/month", forecast: "Weeks away" },
  { metric: "Agreements signed", actual: "0", target: "1/month", forecast: "Weeks-months away" },
  { metric: "Active partners", actual: "0", target: "1/quarter", forecast: "Months away" },
  { metric: "Partner-generated opportunities", actual: "0", target: "Post-activation", forecast: "Depends on activation" },
  { metric: "Regulatory contacts", actual: "0", target: "1-2/quarter", forecast: "After legal basis" },
  { metric: "Regulatory meetings", actual: "0", target: "1/quarter", forecast: "After contact" },
  { metric: "Regulatory submissions", actual: "0", target: "As needed", forecast: "After meeting" },
  { metric: "Regulatory responses", actual: "0", target: "As received", forecast: "After submission" },
  { metric: "Open regulatory questions", actual: "0", target: "Decreasing", forecast: "Will increase then decrease" },
  { metric: "Founder follow-ups overdue", actual: "0", target: "0", forecast: "Discipline-dependent" },
  { metric: "Evidence generated", actual: "0", target: "Increasing", forecast: "With execution" },
];

export const WEEKLY_REVIEW_RULE = "All metrics distinguish ACTUAL / TARGET / FORECAST. Current ACTUAL: all 0. Never estimate. Never conflate.";

// ═══════════════════════════════════════════════════════════════
// PART 23 — EXECUTION FUNNEL (12 stages, all 0)
// ═══════════════════════════════════════════════════════════════

export type FunnelStage = {
  stage: string;
  currentCount: number;
};

export const EXECUTION_FUNNEL_SPRRE: FunnelStage[] = [
  { stage: "Targets", currentCount: 0 },
  { stage: "Researched", currentCount: 0 },
  { stage: "Qualified", currentCount: 0 },
  { stage: "Contacted", currentCount: 0 },
  { stage: "Conversation", currentCount: 0 },
  { stage: "Meeting", currentCount: 0 },
  { stage: "Qualified relationship", currentCount: 0 },
  { stage: "Negotiation", currentCount: 0 },
  { stage: "Signed", currentCount: 0 },
  { stage: "Activated", currentCount: 0 },
  { stage: "First outcome", currentCount: 0 },
  { stage: "Repeatable outcome", currentCount: 0 },
];

export const FUNNEL_RULE = "Initial values remain 0 unless actual evidence exists. The system is allowed to show targets/research/planned actions but must NEVER represent them as outcomes.";

// ═══════════════════════════════════════════════════════════════
// PART 24 — BRAIN AI INSTITUTIONAL RELATIONSHIP CHIEF OF STAFF
// ═══════════════════════════════════════════════════════════════

export const BRAIN_AI_INSTITUTIONAL_AGENT = {
  role: "Institutional Relationship Chief of Staff",
  behaviors: [
    { question: "Who should I contact today?", response: "Use ACTUAL target evidence (currently 0 targets — build list first)" },
    { question: "Which law firms should I prioritize?", response: "Use ACTUAL law-firm research (currently 0 researched — research 3-5 Egyptian candidates first)" },
    { question: "Who can introduce me?", response: "Use ACTUAL relationship graph (currently 0 relationships — COLD OUTREACH REQUIRED for all)" },
    { question: "Which partner target has the highest strategic value?", response: "Use ACTUAL scoring (currently 0 scored — research + score first)" },
    { question: "Which follow-ups are overdue?", response: "Use ACTUAL outreach log (currently 0 outreach — nothing overdue yet)" },
    { question: "What regulatory questions remain unanswered?", response: "Use ACTUAL regulatory tracker (currently 0 engagements — FRA/CBE/PDPL NOT RESEARCHED)" },
    { question: "Which authority should be engaged first?", response: "Based on legal research (REQUIRES COUNSEL). FRA likely first for financial-regulatory clarity." },
    { question: "What evidence supports this relationship?", response: "Retrieve from Evidence Ledger (currently 0 evidence records)" },
    { question: "What is blocking this partnership?", response: "Use ACTUAL blocker records (currently: 0 outreach, 0 DD, 0 agreements — execution has not begun)" },
    { question: "Which partnerships are producing measurable outcomes?", response: "Use ACTUAL partner performance (currently 0 active partners — no outcomes)" },
    { question: "Which partner should be deprioritized?", response: "Use ACTUAL scoring + engagement data (currently 0 partners — nothing to deprioritize)" },
    { question: "What does the Founder need to do today?", response: "Top 10 actions: research law firms, accounting, banks, FRA/CBE/PDPL legal basis, prepare outreach, establish CRM discipline" },
  ],
  neverFabricate: [
    "relationships", "meetings", "introductions", "regulatory approvals",
    "partner agreements", "legal advice", "customer referrals", "institutional recognition",
  ],
  unknownHandling: "Unknown = UNKNOWN. Insufficient evidence = INSUFFICIENT EVIDENCE. Legal uncertainty = REQUIRES COUNSEL. Regulatory uncertainty = REQUIRES REGULATORY ENGAGEMENT. Never convert a target into a partner without evidence.",
};

// ═══════════════════════════════════════════════════════════════
// PART 25 — CLAIM CONTROL (institutional claims)
// ═══════════════════════════════════════════════════════════════

export type InstitutionalClaim = {
  prohibited: string;
  correct: string;
  condition: string;
};

export const CLAIM_CONTROL_SPRRE: InstitutionalClaim[] = [
  { prohibited: "AURIENTA partners with leading banks.", correct: "AURIENTA is currently evaluating banking institutions for strategic partnerships.", condition: "Unless signed agreements exist. Current: 0 signed." },
  { prohibited: "AURIENTA is regulator-approved.", correct: "Regulatory engagement is being evaluated / prepared / submitted.", condition: "Unless formal approval exists. Current: 0 approvals (FRA/CBE/PDPL NOT RESEARCHED)." },
  { prohibited: "Trusted by leading enterprises.", correct: "0 signed enterprises — target list in development.", condition: "Unless actual evidence supports the claim. Current: 0." },
  { prohibited: "AURIENTA has strategic law firm partners.", correct: "Law firm candidates are being researched for strategic partnership.", condition: "Unless signed law firm agreement exists. Current: 0." },
  { prohibited: "AURIENTA has institutional recognition.", correct: "Institutional relationships are being developed.", condition: "Unless actual recognition exists. Current: 0." },
  { prohibited: "Working with the FRA.", correct: "FRA engagement status: NOT RESEARCHED.", condition: "Unless formal engagement exists. Current: NOT RESEARCHED." },
  { prohibited: "Law Firm X is our strategic partner.", correct: "Law Firm X is a qualified partner target / active negotiation / signed partner — whichever is supported by evidence.", condition: "Unless evidence supports the specific state." },
];

export const CLAIM_CONTROL_FLOW = ["CLAIM", "SOURCE", "EVIDENCE", "STATUS", "APPROVAL", "PUBLICATION"];
export const CLAIM_CONTROL_RULE = "Every public-facing institutional statement must pass the claim control flow. Use the correct (honest) phrasing unless evidence supports the prohibited claim.";

// ═══════════════════════════════════════════════════════════════
// PART 27 — INSTITUTIONAL RELATIONSHIP EXECUTION SCORE
// ═══════════════════════════════════════════════════════════════

export type ScoreDimension = {
  dimension: string;
  score: number;
  evidence: string;
};

export const EXECUTION_SCORE_SPRRE: ScoreDimension[] = [
  { dimension: "Target research", score: 0, evidence: "0 targets researched" },
  { dimension: "Contact identification", score: 0, evidence: "0 contacts identified" },
  { dimension: "Outreach activity", score: 0, evidence: "0 outreach sent" },
  { dimension: "Conversation activity", score: 0, evidence: "0 conversations" },
  { dimension: "Qualified relationships", score: 0, evidence: "0 qualified relationships" },
  { dimension: "Partner negotiations", score: 0, evidence: "0 negotiations" },
  { dimension: "Signed agreements", score: 0, evidence: "0 signed" },
  { dimension: "Partner activation", score: 0, evidence: "0 active partners" },
  { dimension: "Partner outcomes", score: 0, evidence: "0 measured outcomes" },
  { dimension: "Regulatory engagement", score: 5, evidence: "Companies + Tax operational; FRA/CBE/PDPL NOT RESEARCHED" },
  { dimension: "Regulatory evidence", score: 0, evidence: "0 regulatory evidence records" },
  { dimension: "Institutional introductions", score: 0, evidence: "0 introductions" },
  { dimension: "Follow-up discipline", score: 0, evidence: "0 follow-ups (nothing to follow up yet)" },
  { dimension: "Evidence quality", score: 0, evidence: "0 evidence records above E0" },
];

export const OVERALL_EXECUTION_SCORE =
  Math.round(EXECUTION_SCORE_SPRRE.reduce((s, d) => s + d.score, 0) / EXECUTION_SCORE_SPRRE.length);

export const SCORE_RULE = "Do NOT create an optimistic 'readiness score.' Score only from actual execution data. No subjective inflation. Current overall: LOW (honest).";

// ═══════════════════════════════════════════════════════════════
// PART 28 — FIRST 30-DAY EXECUTION PLAN
// ═══════════════════════════════════════════════════════════════

export type PlanPhase = {
  days: string;
  activities: string[];
  status: "NOT STARTED" | "IN PROGRESS" | "ACHIEVED" | "NOT ACHIEVED";
};

export const THIRTY_DAY_PLAN: PlanPhase[] = [
  {
    days: "Days 1-5",
    activities: ["Research 5 law firms", "Research 3 accounting firms", "Research 3 banks", "Research 5 institutional prospects"],
    status: "NOT STARTED",
  },
  {
    days: "Days 6-10",
    activities: ["Identify decision-makers", "Identify introduction paths", "Identify relevant practice areas", "Assess strategic fit", "Identify regulatory questions"],
    status: "NOT STARTED",
  },
  {
    days: "Days 11-15",
    activities: ["Prepare 5 law-firm approaches", "Prepare 3 accounting approaches", "Prepare 3 banking approaches", "Prepare regulatory brief"],
    status: "NOT STARTED",
  },
  {
    days: "Days 16-20",
    activities: ["Execute first outreach", "Follow-ups", "Introductory calls", "Discovery meetings"],
    status: "NOT STARTED",
  },
  {
    days: "Days 21-25",
    activities: ["Qualify strategic fit", "Assess capability", "Assess willingness", "Define next steps", "Identify legal requirements", "Define commercial model"],
    status: "NOT STARTED",
  },
  {
    days: "Days 26-30",
    activities: ["First institutional relationship report", "First partner shortlist", "First regulatory engagement decision", "Founder decisions", "Lessons learned", "Evidence report"],
    status: "NOT STARTED",
  },
];

export const PLAN_RULE = "Do NOT declare success because activities occurred. Success requires EVIDENCE of actual progress. Current: all NOT STARTED.";

// ═══════════════════════════════════════════════════════════════
// HONEST CERTIFICATION + FINAL REPORT
// ═══════════════════════════════════════════════════════════════

export const HONEST_CERTIFICATION_SPRRE = {
  title: "AURIENTA STRATEGIC PARTNER, REGULATORY & INSTITUTIONAL RELATIONSHIP EXECUTION SYSTEM (SPRRE) v1.0 — HONEST CERTIFICATION",
  verdict: "STRATEGIC RELATIONSHIP EXECUTION-READY",
  statement: "The machinery required to identify, qualify, contact, engage, negotiate with, activate, and measure strategic partners and regulatory relationships is operational. No strategic partnership, regulatory approval, institutional recognition, or commercial outcome is claimed without evidence.",
  evidenceCeiling: "E0",
  strategicPartnerExecution: {
    targets: 0,
    researched: 0,
    contacted: 0,
    responses: 0,
    meetings: 0,
    qualified: 0,
    negotiations: 0,
    signed: 0,
    active: 0,
    outcomes: 0,
  },
  regulatoryExecution: {
    authoritiesResearched: 0,
    legalQuestions: 0,
    contacts: 0,
    meetings: 0,
    submissions: 0,
    responses: 0,
    approvals: 0,
    unresolvedIssues: 0,
  },
  institutionalRelationships: {
    totalRelationships: 0,
    relationshipStrength: "0 (unknown — no relationships recorded)",
    introductions: 0,
    strategicRelationships: 0,
    blockers: "All paths blocked at first step — 0 partners, 0 regulatory engagement, 0 relationships. Law-firm-first is the critical path.",
  },
  evidence: {
    currentMaximum: "E0 (no market evidence yet)",
    evidenceRecords: 0,
  },
  executionReadiness: {
    toolingReadiness: "READY (SPRRE v1.0 machinery operational)",
    executionReadiness: "READY (Founder can begin executing immediately)",
    relationshipValidation: "NOT VALIDATED (0 relationships)",
    institutionalValidation: "NOT VALIDATED (0 institutional recognition)",
  },
  blueprint: {
    decision: "UNCHANGED",
    reason: "Per Rule 31: NO EVIDENCE → NO BLUEPRINT CHANGE. Current evidence ceiling: E0. No real partners, regulatory engagements, or institutional relationships to justify modification.",
  },
  remainingBlockers: [
    "0 targets researched (must build target list — law-firm-first)",
    "0 outreach sent (must begin contact)",
    "0 conversations (must reach Gate 1)",
    "0 qualified relationships (must qualify)",
    "0 signed agreements (must reach E5)",
    "0 active partners (must activate per 9 requirements)",
    "0 measured outcomes (must produce value)",
    "0 regulatory engagement (FRA/CBE/PDPL NOT RESEARCHED — REQUIRES COUNSEL)",
    "0 regulatory submissions (must engage after legal basis)",
    "0 institutional references (must reach E7+ with consent)",
  ],
  top10FounderActions: FOUNDER_DAILY_COMMAND_SPRRE.currentTopActions,
  executionScore: OVERALL_EXECUTION_SCORE,
  certifiedBy: "COO + Chief Institutional Strategy Officer + Strategic Partnerships Director + Regulatory Engagement Lead + Founder Chief of Staff + Enterprise Execution Auditor (Prompt 15)",
  certifiedAt: SPRRE_FROZEN_AT,
  rule: "Do NOT issue 'AURIENTA has strategic partners' unless signed evidence exists. Do NOT issue 'AURIENTA has regulatory approval' unless official evidence exists. Do NOT issue 'AURIENTA has institutional recognition' unless actual evidence exists.",
};

// ═══════════════════════════════════════════════════════════════
// FINAL COO DIRECTIVE — THE EXECUTION FLYWHEEL
// ═══════════════════════════════════════════════════════════════

export const FINAL_COO_DIRECTIVE_SPRRE = {
  rule: "DO NOT BUILD FOR THE SAKE OF BUILDING. The Founder does not need another architecture. The Founder needs: 5 law-firm targets, 3 accounting targets, 3 banking targets, 5 institutional targets. Then: Research → Contact → Conversation → Meeting → Qualification → Relationship → Agreement → Activation → Outcome. At the same time: Research regulator → verify legal basis → prepare question → engage counsel → engage authority → obtain response → record evidence.",
  flywheel: "TARGET → RESEARCH → INTRODUCTION → CONTACT → CONVERSATION → RELATIONSHIP → COMMITMENT → AGREEMENT → ACTIVATION → OUTCOME → EVIDENCE → REPEATABILITY → SCALE",
  ultimateRule: "AURIENTA's next breakthrough will not come from another framework. It will come from the first real institutional relationship. Then the first real partner. Then the first real customer. Then the first real deployment. Then the first measurable outcome. Then the first real payment. Then repeatability. Then scale.",
  principles: [
    "REALITY > ARCHITECTURE",
    "EVIDENCE > CLAIMS",
    "RELATIONSHIPS > RELATIONSHIP PLANS",
    "SIGNED PARTNERS > PARTNER TARGETS",
    "REGULATORY ENGAGEMENT > REGULATORY THEORY",
    "CUSTOMERS > FEATURES",
    "REVENUE > FORECASTS",
    "OUTCOMES > ACTIVITY",
  ],
  mandate: "Execute. Measure. Learn. Correct. Prove. Repeat. Scale. Do not fabricate execution. Do not fabricate partners. Do not fabricate regulators. Do not fabricate approvals. Do not fabricate revenue. Do not expand the blueprint without evidence.",
};

// ═══════════════════════════════════════════════════════════════
// SYNCHRONIZATION
// ═══════════════════════════════════════════════════════════════

export const SPRRE_SYNCHRONIZATION = {
  extendsExisting: "SPRRE v1.0 extends MES/MAS/CPR/GLS/FOCC/ITDB/ACS/AOS — no duplication of partner lifecycle, relationship map, evidence hierarchy, or claim control.",
  noNewArchitecture: "No new architecture. Focused execution capability for strategic partners + regulatory + institutional relationships.",
  evidenceIntegrityAbsolute: "E0-E9 hierarchy authoritative. No promotion without evidence. No fabrication. UNKNOWN/REQUIRES COUNSEL/REQUIRES REGULATORY enforced.",
  honestZeros: "All counts 0. Evidence ceiling E0. No fabricated partners, regulators, approvals, or relationships.",
  brainAiInstitutionalAgent: "Brain AI is Institutional Relationship Chief of Staff — never fabricates, returns UNKNOWN/INSUFFICIENT EVIDENCE/REQUIRES COUNSEL/REQUIRES REGULATORY.",
  realityOverArchitecture: "REALITY > ARCHITECTURE. RELATIONSHIPS > RELATIONSHIP PLANS. SIGNED PARTNERS > PARTNER TARGETS. The next breakthrough comes from the first real institutional relationship, not another framework.",
};
