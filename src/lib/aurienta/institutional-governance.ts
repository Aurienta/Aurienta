// AURIENTA Institutional Governance System — Constitution v1.0
// ═══════════════════════════════════════════════════════════════
// This file is the single source of truth for AURIENTA's corporate
// governance, operating model, and management system.
//
// FROZEN as Constitution v1.0 — all future changes must follow the
// formal change-management process (§15.1) with versioning, impact
// assessments, approval records, and immutable audit trails.
//
// DO NOT modify without Founder & Sole Owner approval + Constitutional
// Council review (when active).
// ═══════════════════════════════════════════════════════════════

export const GOVERNANCE_VERSION = "1.0";
export const GOVERNANCE_FROZEN_AT = "2026-08-07";

// ═══════════════════════════════════════════════════════════════
// 1. CORPORATE GOVERNANCE MANUAL
// ═══════════════════════════════════════════════════════════════

export const GOVERNANCE_MANUAL = {
  mission: "To transform everyday capital into real-economy corporate ownership through constitutional infrastructure that cannot be bent, bypassed, or broken — building enterprises that graduate to sovereign independence.",
  vision: "To become the global standard for constitutional enterprise governance — the infrastructure through which productive enterprises are constituted, governed, and graduated worldwide.",
  purpose: "AURIENTA exists to eliminate corporate friction through AI-enforced governance, enabling partners to build, own, and scale real businesses until they graduate into sovereign independence.",

  governingPrinciples: [
    "Constitutional Supremacy: The constitutional charter and the CRE are the highest authority. No human — including the Founder — can override enforced rules.",
    "Zero Custody: AURIENTA never holds, touches, or controls partner funds. This is non-amendable.",
    "Founder Authority: The Founder & Sole Owner holds ultimate authority over all non-constitutional decisions until institutional maturity is reached.",
    "Delegation by Design: Authority is delegated through a documented matrix, not by ad-hoc decisions.",
    "Auditability: Every governance decision is recorded on the immutable ledger with Ed25519 signatures.",
    "Institutional Continuity: The governance model must survive the Founder's unavailability.",
    "Scalable Governance: The model must scale from 1 person to 10,000+ without structural redesign.",
    "No Conflicts of Interest: All partners must disclose conflicts; material conflicts require recusal.",
    "Transparency by Default: Governance decisions are visible to all Constitutional Partners unless legally restricted.",
    "Constitutional Graduation: AURIENTA succeeds when enterprises no longer need it.",
  ],

  decisionHierarchy: [
    { level: 0, authority: "Constitutional Charter (non-amendable rules)", override: "None — not even the Founder can override" },
    { level: 1, authority: "Founder & Sole Owner", override: "Can override any non-constitutional decision" },
    { level: 2, authority: "AURIENTA Holding S.A.E. (Board, when constituted)", override: "Subject to Founder approval until institutional maturity" },
    { level: 3, authority: "AURIENTA Operations (CEO/COO, when appointed)", override: "Within delegated authority limits" },
    { level: 4, authority: "AURIENTA Advisory (Advisory Director, when appointed)", override: "Within partnership/ecosystem scope" },
    { level: 5, authority: "Committee Chairs", override: "Within committee charter" },
    { level: 6, authority: "Regional Directors (when appointed)", override: "Within regional authority limits" },
    { level: 7, authority: "Individual contributors", override: "Within role authority" },
  ],

  institutionalEthics: {
    principle: "AURIENTA operates with the highest institutional integrity, comparable to the World Bank, BIS, or a central bank.",
    code: [
      "Never accept bribes, kickbacks, or improper benefits",
      "Never use partner data for personal gain",
      "Never allow AI to be biased by commercial pressure",
      "Never compromise the constitutional charter for expediency",
      "Always disclose conflicts of interest",
      "Always act in the long-term interest of the institution",
      "Always maintain confidentiality of partner data",
      "Always cooperate with regulators and auditors",
    ],
  },

  conflictOfInterestPolicy: {
    disclosure: "All partners, employees, and advisors must disclose any financial interest, family relationship, or business affiliation that could create a conflict with AURIENTA's constitutional duties.",
    recusal: "Any person with a material conflict must recuse from the relevant decision and be replaced by an unconflicted party.",
    register: "A Conflicts Register is maintained by the Holding Group and audited annually.",
  },

  antiCorruptionFramework: {
    zeroTolerance: "AURIENTA maintains a zero-tolerance policy for corruption, bribery, and fraud.",
    reporting: "All suspected violations must be reported through the whistleblower channel.",
    investigation: "All reports are investigated by the Audit Committee (or Founder until constituted).",
    consequences: "Confirmed violations result in immediate termination and legal action.",
  },

  whistleblowerPolicy: {
    channel: "Anonymous whistleblower reports are accepted through the constitutional infrastructure at /dashboard/whistleblower.",
    protection: "Whistleblowers are protected from retaliation. Retaliation is itself a constitutional violation.",
    investigation: "Reports are investigated within 72 hours. Credible reports trigger CRE-led evidence collection.",
    reward: "Whistleblowers whose reports lead to confirmed violations receive a bounty from the constitutional bounty fund.",
  },

  policyLifecycle: {
    stages: ["Draft", "Review", "Consultation", "Approval", "Publication", "Enforcement", "Review (Annual)", "Amendment or Retirement"],
    approvalAuthority: "Founder (until Constitutional Council is active) → Constitutional Council (when active)",
    versioning: "Every policy has a version number, effective date, and next review date.",
    auditTrail: "Every policy change is recorded on the immutable ledger.",
  },

  governanceReviewCycle: "Annual constitutional review conducted by the Founder (until Constitutional Council is active). The review examines every governance principle, policy, and committee for continued relevance and effectiveness.",
} as const;

// ═══════════════════════════════════════════════════════════════
// 2. DELEGATION OF AUTHORITY MATRIX
// ═══════════════════════════════════════════════════════════════

export type AuthorityEntry = {
  decision: string;
  responsible: string;
  accountable: string;
  consulted: string;
  informed: string;
  approvalThreshold: string;
  escalationTrigger: string;
  emergencyOverride: string;
  constitutionalOverride: string;
};

export const DELEGATION_OF_AUTHORITY: AuthorityEntry[] = [
  { decision: "Constitutional amendment proposal", responsible: "Founder", accountable: "Founder", consulted: "Holding Group", informed: "All Partners", approvalThreshold: "75% supermajority vote", escalationTrigger: "N/A", emergencyOverride: "None — constitutional", constitutionalOverride: "Non-amendable rules cannot be changed" },
  { decision: "Blueprint modification", responsible: "Founder", accountable: "Founder", consulted: "Operations CTO", informed: "All Partners", approvalThreshold: "Founder approval", escalationTrigger: "If Founder unavailable → Holding Group", emergencyOverride: "None", constitutionalOverride: "Must not contradict charter" },
  { decision: "CRE policy modification", responsible: "Operations (CTO)", accountable: "Founder", consulted: "Constitutional Committee", informed: "Holding Group", approvalThreshold: "Founder + CTO approval", escalationTrigger: "If constitutional impact → Founder", emergencyOverride: "None — CRE changes require full review", constitutionalOverride: "Must preserve non-amendable rules" },
  { decision: "AI policy modification", responsible: "Operations (CTO)", accountable: "Founder", consulted: "AI Ethics Committee", informed: "Holding Group", approvalThreshold: "Founder + CTO approval", escalationTrigger: "If ethical concern → AI Ethics Committee", emergencyOverride: "CTO may disable AI features temporarily", constitutionalOverride: "AI cannot override CRE" },
  { decision: "Executive hiring (C-suite)", responsible: "Founder", accountable: "Founder", consulted: "Holding Group", informed: "Operations", approvalThreshold: "Founder approval", escalationTrigger: "N/A", emergencyOverride: "None", constitutionalOverride: "Police clearance required for all executives" },
  { decision: "Standard hiring", responsible: "Operations (HR)", accountable: "Operations (COO)", consulted: "Department head", informed: "HR", approvalThreshold: "COO approval (within budget)", escalationTrigger: ">budget → Founder", emergencyOverride: "Interim hiring by department head", constitutionalOverride: "All hires require KYC" },
  { decision: "Vendor approval", responsible: "Operations (Procurement)", accountable: "Operations (COO)", consulted: "Finance", informed: "Audit Committee", approvalThreshold: "<100K EGP: COO; <1M: Founder; ≥1M: Holding Group", escalationTrigger: "Related party → Audit Committee", emergencyOverride: "COO may approve emergency vendors <50K", constitutionalOverride: "Zero Custody applies to all vendors" },
  { decision: "Partner onboarding (law firm)", responsible: "Advisory", accountable: "Founder", consulted: "Holding Group Legal", informed: "Operations", approvalThreshold: "Founder approval + license verification", escalationTrigger: "Insurance <100M EGP → reject", emergencyOverride: "None", constitutionalOverride: "FRA license required" },
  { decision: "Partner onboarding (accounting firm)", responsible: "Advisory", accountable: "Founder", consulted: "Holding Group Legal", informed: "Operations", approvalThreshold: "Founder approval + ESAA verification", escalationTrigger: "License invalid → reject", emergencyOverride: "None", constitutionalOverride: "ESAA license required" },
  { decision: "Government engagement", responsible: "Advisory", accountable: "Founder", consulted: "Holding Group", informed: "Operations", approvalThreshold: "Founder approval", escalationTrigger: "Cross-border → Holding Group", emergencyOverride: "None", constitutionalOverride: "Must align with constitutional charter" },
  { decision: "Large expenditure (>1M EGP)", responsible: "Operations (Finance)", accountable: "Founder", consulted: "Holding Group", informed: "Audit Committee", approvalThreshold: "Founder approval", escalationTrigger: ">10M EGP → Holding Group board", emergencyOverride: "COO may authorize <500K emergency", constitutionalOverride: "Zero Custody — AURIENTA never holds partner funds" },
  { decision: "Product launch", responsible: "Operations (Product)", accountable: "Operations (COO)", consulted: "Founder, CTO", informed: "Advisory", approvalThreshold: "COO + CTO approval; major launch → Founder", escalationTrigger: "Constitutional impact → Founder", emergencyOverride: "CTO may halt launches", constitutionalOverride: "Must pass CRE compatibility check" },
  { decision: "Feature approval", responsible: "Operations (Engineering)", accountable: "Operations (CTO)", consulted: "Product, Security", informed: "COO", approvalThreshold: "CTO approval", escalationTrigger: "Constitutional impact → Founder", emergencyOverride: "CTO may block features", constitutionalOverride: "Must not contradict terminology standard" },
  { decision: "Emergency decisions", responsible: "On-call executive", accountable: "Founder (or COO if Founder unavailable)", consulted: "CTO, Legal", informed: "Holding Group", approvalThreshold: "Any executive may declare emergency", escalationTrigger: "Automatic escalation to Founder", emergencyOverride: "Executive may take any non-constitutional action", constitutionalOverride: "Cannot override non-amendable rules" },
  { decision: "Crisis management", responsible: "Founder (or COO if Founder unavailable)", accountable: "Founder", consulted: "Risk Committee, Legal, CTO", informed: "All Partners (if material)", approvalThreshold: "Founder approval", escalationTrigger: "Existential threat → full mobilization", emergencyOverride: "Founder may take any non-constitutional action", constitutionalOverride: "CRE must remain online or Oracle Mirror activates" },
  { decision: "Risk acceptance", responsible: "Risk Committee", accountable: "Founder", consulted: "CTO, COO, Legal", informed: "Holding Group", approvalThreshold: "<Medium: Risk Committee; High: Founder; Critical: Founder + Holding Group", escalationTrigger: "Critical risk → emergency session", emergencyOverride: "Founder may accept any risk", constitutionalOverride: "Cannot accept risk to non-amendable rules" },
  { decision: "Legal review", responsible: "Holding Group Legal", accountable: "Founder", consulted: "Operations, Advisory", informed: "Audit Committee", approvalThreshold: "Founder approval for major legal actions", escalationTrigger: "Litigation → Founder + Holding Group", emergencyOverride: "General Counsel may file emergency injunctions", constitutionalOverride: "Must align with constitutional charter" },
  { decision: "Strategic partnership", responsible: "Advisory", accountable: "Founder", consulted: "Holding Group, Operations", informed: "Audit Committee", approvalThreshold: "Founder approval", escalationTrigger: "Exclusive partnership → Holding Group", emergencyOverride: "None", constitutionalOverride: "Must not create custody relationship" },
  { decision: "IP licensing", responsible: "Holding Group", accountable: "Founder", consulted: "Legal, Operations", informed: "Advisory", approvalThreshold: "Founder approval", escalationTrigger: "Cross-border licensing → Holding Group", emergencyOverride: "None", constitutionalOverride: "CRE remains under Holding Group ownership" },
  { decision: "Trademark registration", responsible: "Holding Group Legal", accountable: "Founder", consulted: "Advisory", informed: "Operations", approvalThreshold: "Founder approval", escalationTrigger: "Opposition → Legal review", emergencyOverride: "None", constitutionalOverride: "N/A" },
  { decision: "Public statements", responsible: "Operations (Communications)", accountable: "Founder", consulted: "Legal, Advisory", informed: "Holding Group", approvalThreshold: "Founder approval for major statements", escalationTrigger: "Regulatory implications → Legal", emergencyOverride: "COO may issue emergency statements", constitutionalOverride: "Must use constitutional terminology" },
  { decision: "Open-source publication (CRE)", responsible: "Founder", accountable: "Founder", consulted: "Holding Group, CTO, Legal", informed: "All Partners", approvalThreshold: "Founder approval only", escalationTrigger: "N/A", emergencyOverride: "None", constitutionalOverride: "Must preserve non-amendable rules" },
];

// ═══════════════════════════════════════════════════════════════
// 3. EXECUTIVE COMMITTEE STRUCTURE
// ═══════════════════════════════════════════════════════════════

export type Committee = {
  name: string;
  purpose: string;
  chair: string;
  members: string[];
  votingRules: string;
  quorum: string;
  meetingFrequency: string;
  escalationPath: string;
  activeNow: boolean; // false = will be constituted at institutional maturity
};

export const COMMITTEES: Committee[] = [
  { name: "Executive Committee", purpose: "Strategic decision-making and cross-entity coordination", chair: "Founder", members: ["Founder", "Future COO", "Future CTO", "Future CFO", "Future General Counsel", "Future Advisory Director"], votingRules: "Majority vote; Founder has veto until institutional maturity", quorum: "3 members including Founder", meetingFrequency: "Weekly", escalationPath: "Founder → Holding Group Board (when constituted)", activeNow: true },
  { name: "Constitutional Committee", purpose: "Interpret constitutional charter; review amendments; resolve constitutional disputes", chair: "Founder", members: ["Founder", "Future General Counsel", "Future Constitutional Scholar (external)"], votingRules: "Unanimous for amendments; majority for interpretations", quorum: "All members", meetingFrequency: "Monthly + ad-hoc", escalationPath: "Founder → Constitutional Council (when active)", activeNow: true },
  { name: "Risk Committee", purpose: "Identify, assess, and mitigate enterprise risks", chair: "Founder", members: ["Founder", "Future CFO", "Future CTO", "Future Chief Risk Officer"], votingRules: "Majority vote; Founder may override", quorum: "2 members including Founder", meetingFrequency: "Monthly", escalationPath: "Executive Committee", activeNow: true },
  { name: "Audit Committee", purpose: "Internal audit, external audit liaison, financial controls", chair: "Founder", members: ["Founder", "Future CFO", "Future External Auditor (independent)"], votingRules: "Majority vote; independent auditor has veto on audit findings", quorum: "2 members", meetingFrequency: "Quarterly", escalationPath: "Executive Committee → Holding Group", activeNow: true },
  { name: "AI Ethics Committee", purpose: "Review AI policies, bias audits, Brain AI behavior, prompt integrity", chair: "Future CTO", members: ["CTO (or Founder)", "Future Chief AI Officer", "Future Ethics Officer", "External AI Ethics Advisor"], votingRules: "Unanimous for AI policy changes; majority for operational decisions", quorum: "3 members", meetingFrequency: "Monthly", escalationPath: "Executive Committee", activeNow: true },
  { name: "Advisory Committee", purpose: "Partner ecosystem governance, certification standards, partner quality", chair: "Future Advisory Director", members: ["Advisory Director (or Founder)", "Future Partner Success Lead", "Future Certification Lead"], votingRules: "Majority vote", quorum: "2 members", meetingFrequency: "Monthly", escalationPath: "Executive Committee", activeNow: true },
  { name: "Investment Committee", purpose: "Capital allocation, Sovereign Wealth Fund decisions, acquisition review", chair: "Founder", members: ["Founder", "Future CFO", "Future Investment Advisor"], votingRules: "Founder approval required for all investments", quorum: "2 members including Founder", meetingFrequency: "Monthly", escalationPath: "Holding Group Board", activeNow: true },
  { name: "Security Committee", purpose: "Cybersecurity, data protection, incident response", chair: "Future CTO", members: ["CTO (or Founder)", "Future Chief Information Security Officer", "Future Legal Counsel"], votingRules: "Majority vote; CTO may declare security emergency", quorum: "2 members", meetingFrequency: "Monthly + ad-hoc for incidents", escalationPath: "Executive Committee", activeNow: true },
  { name: "Compliance Committee", purpose: "Regulatory compliance, PDPL, AML, FRA reporting", chair: "Future General Counsel", members: ["General Counsel (or Founder)", "Future Compliance Officer", "Future Regulatory Liaison"], votingRules: "Majority vote", quorum: "2 members", meetingFrequency: "Monthly", escalationPath: "Executive Committee", activeNow: true },
  { name: "Architecture Review Board", purpose: "Technical architecture decisions, CRE modifications, Brain AI architecture", chair: "Future CTO", members: ["CTO (or Founder)", "Future Chief Architect", "Future Lead Engineer"], votingRules: "Unanimous for CRE changes; majority for architecture decisions", quorum: "All members", meetingFrequency: "Bi-weekly", escalationPath: "Executive Committee → Constitutional Committee (if constitutional impact)", activeNow: true },
  { name: "Partnership Committee", purpose: "Strategic partnership review, Big Four relationships, government partnerships", chair: "Future Advisory Director", members: ["Advisory Director (or Founder)", "Future BD Lead", "Future Legal Counsel"], votingRules: "Majority vote; Founder approval for exclusive partnerships", quorum: "2 members", meetingFrequency: "Monthly", escalationPath: "Executive Committee", activeNow: true },
];

// ═══════════════════════════════════════════════════════════════
// 4. CONSTITUTIONAL COUNCIL (FUTURE)
// ═══════════════════════════════════════════════════════════════

export const CONSTITUTIONAL_COUNCIL = {
  status: "Not yet constituted — activates at institutional maturity (defined as: 50+ employees, 500+ enterprises, or Founder's written declaration)",

  responsibilities: [
    "Interpret the constitutional charter when ambiguity arises",
    "Review and approve constitutional amendments (75% supermajority)",
    "Resolve constitutional disputes between entities",
    "Override operational decisions that violate the constitution",
    "Approve the graduation of enterprises to sovereignty",
    "Certify constitutional compliance annually",
    "Authorize emergency constitutional measures",
    "Review Brain AI constitutional alignment",
  ],

  membership: {
    size: 7,
    composition: "3 independent members (constitutional scholars/judges), 2 Founder-appointed, 1 Operations-appointed, 1 Advisory-appointed",
    selection: "Independent members selected by consensus of existing council; appointed members by their respective entities",
    rotation: "Members serve 4-year terms, staggered. No member may serve more than 2 consecutive terms.",
    removal: "A member may be removed by 5/7 council vote for cause (violation, incapacity, conflict).",
    chair: "Rotated annually among members.",
  },

  deadlockHandling: "If the council is deadlocked (3-3 with 1 abstention), the matter is referred to independent arbitration at CRCICA (Cairo Regional Centre for International Commercial Arbitration).",

  emergencyPowers: "In a declared constitutional emergency, the council may: (a) freeze all non-essential operations, (b) activate the Oracle Mirror protocol, (c) suspend non-constitutional policies, (d) convene an emergency partner vote.",

  relationshipWithFounder: "The Founder may attend council meetings but does not have a vote (once the council is active). The Founder may propose amendments but cannot unilaterally enact them. The Founder retains authority over non-constitutional decisions.",

  activationTrigger: "The Constitutional Council activates when ANY of the following occurs: (a) Founder's written declaration, (b) 50+ full-time employees, (c) 500+ active enterprises, (d) Founder's confirmed incapacity for 90+ days.",
} as const;

// ═══════════════════════════════════════════════════════════════
// 5. FOUNDER DEPENDENCY REDUCTION PLAN
// ═══════════════════════════════════════════════════════════════

export const FOUNDER_DEPENDENCY_PLAN = {
  currentFounderResponsibilities: [
    "All strategic decisions",
    "All executive hiring",
    "All partnership approvals",
    "All expenditure approvals >1M EGP",
    "All public statements",
    "All IP licensing",
    "All constitutional interpretation",
    "All emergency decisions",
    "All blueprint modifications",
    "All CRE modifications",
    "All AI policy decisions",
    "All government engagement",
  ],

  delegationTimeline: [
    { phase: "Phase 1 (0-3 months)", delegation: "Document all decisions in the Delegation of Authority Matrix; create decision playbooks for top 20 recurring decisions", outcome: "Decisions can be made by reading the playbook" },
    { phase: "Phase 2 (3-6 months)", delegation: "Appoint COO (operations delegate); delegate standard hiring, vendor approval <100K, routine expenditures", outcome: "70% of operational decisions delegated" },
    { phase: "Phase 3 (6-12 months)", delegation: "Appoint CTO (technology delegate); delegate feature approval, deployment, architecture decisions within policy", outcome: "85% of decisions delegated" },
    { phase: "Phase 4 (12-24 months)", delegation: "Appoint General Counsel, CFO, Advisory Director; constitute committees; activate risk and audit processes", outcome: "95% of decisions delegated; Founder focuses on strategy + constitution only" },
    { phase: "Phase 5 (24+ months)", delegation: "Activate Constitutional Council; Founder transitions to Chairman role", outcome: "Institution can operate without Founder's daily involvement" },
  ],

  emergencySuccession: {
    trigger: "Founder's confirmed incapacity for 72+ hours",
    immediateActions: "COO (if appointed) assumes operational authority; otherwise, the Executive Committee convenes within 24 hours to appoint an interim operational leader",
    constitutionalAuthority: "Constitutional decisions are suspended until the Founder recovers OR the Constitutional Council is activated early (requires 4/7 pre-appointed members' agreement)",
    keyPersonInsurance: "Key-person insurance of $5M+ to be obtained on the Founder's life",
    communicationPlan: "Within 48 hours, all partners, employees, and key stakeholders are informed of the succession plan",
  },

  knowledgeTransfer: {
    documentation: "Every Founder-only decision must be documented in a decision playbook within 7 days of being made",
    runbooks: "Runbooks for all critical operations must be created and tested quarterly",
    institutionalMemory: "The worklog (9,000+ lines) serves as the institutional memory; it must be backed up to 3 locations",
    crossTraining: "No critical system should have a bus factor of 1; every role must have a documented backup",
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// 6. ENTERPRISE RISK MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export type Risk = {
  category: string;
  risk: string;
  likelihood: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High" | "Critical";
  owner: string;
  mitigation: string;
  earlyWarning: string;
  recovery: string;
};

export const RISK_REGISTER: Risk[] = [
  { category: "Strategic", risk: "Competitor replicates the constitutional model", likelihood: "Medium", impact: "High", owner: "Founder", mitigation: "Open-source CRE as global standard; brand moat; first-mover advantage; patent key processes", earlyWarning: "Competitor launches similar governance model", recovery: "Accelerate open-source strategy; differentiate through Brain AI and partner network" },
  { category: "Strategic", risk: "Regulatory classification as exchange/broker", likelihood: "Medium", impact: "Critical", owner: "Founder", mitigation: "Position as governance infrastructure; FRA no-action letter; avoid exchange terminology", earlyWarning: "Regulator inquiry about secondary market", recovery: "Suspend secondary market; reposition; obtain legal opinion" },
  { category: "Operational", risk: "SQLite corruption — data loss", likelihood: "Low", impact: "Critical", owner: "Operations (CTO)", mitigation: "Daily backups; migrate to PostgreSQL; 5-copy retention", earlyWarning: "Database query errors; file size anomalies", recovery: "Restore from backup; rebuild from ledger hash chain" },
  { category: "Operational", risk: "Founder unavailable for extended period", likelihood: "Low", impact: "High", owner: "Founder", mitigation: "Delegation matrix; decision playbooks; key-person insurance; succession plan", earlyWarning: "Founder health issues; travel restrictions", recovery: "Activate emergency succession plan; COO assumes operations" },
  { category: "Technology", risk: "AI provider failure (all 5 providers unavailable)", likelihood: "Low", impact: "High", owner: "Operations (CTO)", mitigation: "5-provider redundancy; graceful fallback; CRE continues without AI", earlyWarning: "Multiple provider errors in 24h", recovery: "AI enters read-only mode; human review activated" },
  { category: "Technology", risk: "CRE vulnerability discovered", likelihood: "Low", impact: "Critical", owner: "Operations (CTO)", mitigation: "Code review; security audits; bug bounty; Ed25519 signatures", earlyWarning: "Security researcher report; anomalous CRE denials", recovery: "Emergency CRE patch; ledger verification; partner notification" },
  { category: "Legal", risk: "PDPL enforcement action for data breach", likelihood: "Medium", impact: "High", owner: "Holding Group Legal", mitigation: "AES-256-GCM encryption; PDPL compliance; data minimization; audit trail", earlyWarning: "PDPC inquiry; partner complaint", recovery: "Breach notification; remediation plan; legal defense" },
  { category: "Regulatory", risk: "Egyptian government restricts AURIENTA operations", likelihood: "Low", impact: "Critical", owner: "Founder", mitigation: "FRA no-action letter; government engagement; Oracle Mirror protocol", earlyWarning: "Regulatory pressure; unfavorable policy signals", recovery: "Activate Oracle Mirror; relocate operations; legal challenge" },
  { category: "Financial", risk: "Revenue model self-liquidates (enterprises graduate, fees stop)", likelihood: "Medium", impact: "High", owner: "Founder", mitigation: "CAaaS revenue; certification; SWF; alumni network membership", earlyWarning: "Graduation rate exceeds new enterprise formation rate", recovery: "Accelerate post-graduation revenue streams" },
  { category: "Cyber", risk: "Supply chain attack via npm dependency", likelihood: "Medium", impact: "High", owner: "Operations (CTO)", mitigation: "Dependency audit; lockfile; minimal dependencies; SCA scanning", earlyWarning: "npm advisory; anomalous package behavior", recovery: "Revert to clean lockfile; audit all dependencies; rebuild" },
  { category: "AI", risk: "Brain AI produces biased or harmful output", likelihood: "Medium", impact: "High", owner: "AI Ethics Committee", mitigation: "5-provider consensus; prompt injection defense; quarterly bias audit; human review for critical decisions", earlyWarning: "Bias audit findings; partner complaints about AI output", recovery: "Disable AI feature; review prompts; retrain with corrected context" },
  { category: "Reputation", risk: "Enterprise fraud damages AURIENTA reputation", likelihood: "Medium", impact: "High", owner: "Founder", mitigation: "CRE enforcement; KYC; police clearance; milestone-gated releases; dual-signature expenses", earlyWarning: "Whistleblower report; anomaly detection; CRE denial spike", recovery: "Freeze enterprise; investigate; partner notification; legal action" },
  { category: "Country", risk: "Egyptian devaluation/capital controls", likelihood: "Medium", impact: "Medium", owner: "Founder", mitigation: "Diversify to GCC; diaspora bridge; multi-currency readiness", earlyWarning: "EGP volatility; CBE policy changes", recovery: "Accelerate GCC expansion; hedge exposure" },
];

// ═══════════════════════════════════════════════════════════════
// 7. INTERNAL CONTROL FRAMEWORK
// ═══════════════════════════════════════════════════════════════

export const INTERNAL_CONTROLS = [
  { control: "Financial approval — dual signature for expenses 1-10% of capital", type: "Preventive", enforcedBy: "CRE (enforceExpenseAuthority)", frequency: "Every transaction", evidence: "LedgerEvent + AuditLog" },
  { control: "Engineering approval — code review required for all merges to main", type: "Preventive", enforcedBy: "Git branch protection (when CI/CD active)", frequency: "Every merge", evidence: "Git commit history" },
  { control: "Deployment approval — CTO or Founder approval for production deploys", type: "Preventive", enforcedBy: "Manual + future CI/CD gate", frequency: "Every deployment", evidence: "AuditLog" },
  { control: "AI deployment — AI Ethics Committee review for new AI features", type: "Preventive", enforcedBy: "Committee charter", frequency: "Per new AI feature", evidence: "Committee minutes" },
  { control: "Blueprint modification — Founder approval + impact assessment", type: "Preventive", enforcedBy: "Governance policy", frequency: "Per modification", evidence: "Version history + AuditLog" },
  { control: "Source code ownership — all code owned by Holding Group", type: "Directive", enforcedBy: "Legal agreement + git ownership", frequency: "Continuous", evidence: "IP register" },
  { control: "Partner onboarding — license verification + Founder approval", type: "Preventive", enforcedBy: "Advisory process + CRE", frequency: "Per partner", evidence: "Partner registry + AuditLog" },
  { control: "Brand usage — constitutional terminology required in all public materials", type: "Directive", enforcedBy: "Terminology validation + review process", frequency: "Every publication", evidence: "Publication log" },
  { control: "Audit logging — every state-changing action logged to immutable ledger", type: "Detective", enforcedBy: "CRE (appendLedgerEvent)", frequency: "Every action", evidence: "LedgerEvent hash chain" },
  { control: "Evidence retention — all evidence retained for 10 years", type: "Directive", enforcedBy: "Data retention policy", frequency: "Continuous", evidence: "IPFS + backup archives" },
];

// ═══════════════════════════════════════════════════════════════
// 8. OPERATING RHYTHM
// ═══════════════════════════════════════════════════════════════

export const OPERATING_RHYTHM = [
  { cadence: "Daily", activity: "Operations standup (engineering + ops)", attendees: "Operations team", duration: "15 min" },
  { cadence: "Weekly", activity: "Executive Committee meeting", attendees: "Founder + executives (when appointed)", duration: "60 min" },
  { cadence: "Weekly", activity: "Engineering sprint review", attendees: "Engineering team", duration: "30 min" },
  { cadence: "Monthly", activity: "Risk Committee review", attendees: "Risk Committee", duration: "60 min" },
  { cadence: "Monthly", activity: "AI Ethics Committee review", attendees: "AI Ethics Committee", duration: "60 min" },
  { cadence: "Monthly", activity: "Advisory partner review", attendees: "Advisory team", duration: "60 min" },
  { cadence: "Quarterly", activity: "Strategy review (Executive Committee)", attendees: "Executive Committee", duration: "Half-day" },
  { cadence: "Quarterly", activity: "Audit Committee review", attendees: "Audit Committee", duration: "90 min" },
  { cadence: "Quarterly", activity: "Architecture Review Board", attendees: "ARB members", duration: "90 min" },
  { cadence: "Annual", activity: "Constitutional review", attendees: "Founder + Constitutional Committee", duration: "Full day" },
  { cadence: "Annual", activity: "Enterprise risk assessment", attendees: "Risk Committee + executives", duration: "Full day" },
  { cadence: "Annual", activity: "Governance effectiveness review", attendees: "Founder + committees", duration: "Half-day" },
  { cadence: "Annual", activity: "Partner satisfaction survey", attendees: "All partners", duration: "Async" },
];

// ═══════════════════════════════════════════════════════════════
// 9. CORPORATE KPIs
// ═══════════════════════════════════════════════════════════════

export const CORPORATE_KPIS = [
  { kpi: "Governance Maturity", target: "85+ by Year 2", measurement: "Delegation matrix completeness + committee activity + policy coverage", audience: "Founder, Board" },
  { kpi: "Enterprise Success Rate", target: ">70% reach graduation readiness", measurement: "Enterprises with readiness ≥70 / total active enterprises", audience: "Founder, Operations, Advisory" },
  { kpi: "Graduation Rate", target: "10+ per year by Year 3", measurement: "Enterprises graduated / year", audience: "Founder, Board, Public" },
  { kpi: "Institutional Trust Score (platform)", target: ">90/100", measurement: "Partner survey + CRE uptime + audit findings", audience: "Founder, Board, Public" },
  { kpi: "Compliance Score", target: "100%", measurement: "PDPL compliance + FRA reporting + AML screening coverage", audience: "Compliance Committee, Founder" },
  { kpi: "Audit Readiness", target: "SOC 2 Type II by Year 2", measurement: "Controls implemented / controls required", audience: "Audit Committee, Founder" },
  { kpi: "CRE Reliability", target: "99.95% uptime", measurement: "CRE decision latency + uptime monitoring", audience: "Operations, Founder" },
  { kpi: "Brain AI Reliability", target: "<1% fallback rate", measurement: "AI artifacts with fellBack=true / total", audience: "AI Ethics Committee, Operations" },
  { kpi: "Advisory Effectiveness", target: ">90% partner satisfaction", measurement: "Partner survey + partner retention rate", audience: "Advisory Director, Founder" },
  { kpi: "Risk Exposure Index", target: "<Medium overall", measurement: "Weighted average of risk register likelihood × impact", audience: "Risk Committee, Founder" },
  { kpi: "Financial Sustainability", target: "Break-even by Year 3", measurement: "Revenue / operating costs", audience: "Founder, Board" },
  { kpi: "Documentation Completeness", target: "95%+", measurement: "Documented decisions / total decisions", audience: "Audit Committee, Founder" },
  { kpi: "Decision Speed", target: "<48h for standard decisions", measurement: "Time from decision request to approval", audience: "Operations, Founder" },
  { kpi: "Global Expansion Readiness", target: "2+ countries by Year 2", measurement: "Licensed jurisdictions + operational regional companies", audience: "Founder, Board" },
];

// ═══════════════════════════════════════════════════════════════
// 10. CHANGE MANAGEMENT (Constitution v1.0 Freeze)
// ═══════════════════════════════════════════════════════════════

export const CHANGE_MANAGEMENT = {
  version: GOVERNANCE_VERSION,
  frozenAt: GOVERNANCE_FROZEN_AT,
  principle: "The governance model is frozen as Constitution v1.0. All future changes must follow the formal change-management process.",
  process: [
    "1. Change proposal submitted to Constitutional Committee (or Founder until committee is active)",
    "2. Impact assessment conducted (constitutional, operational, legal, financial, reputational)",
    "3. Consultation period (minimum 14 days for non-urgent changes)",
    "4. Approval by Founder (until Constitutional Council active) or 75% supermajority of Constitutional Council",
    "5. Version increment (v1.0 → v1.1 for minor, v2.0 for major)",
    "6. Immutable audit trail on the ledger with Ed25519 signature",
    "7. Notification to all partners",
    "8. Implementation with rollback plan",
  ],
  rollbackPlan: "Every governance change must have a documented rollback plan. If the change causes unintended consequences, it must be revertible within 72 hours.",
  versioning: {
    major: "Constitutional amendment (requires 75% supermajority)",
    minor: "Policy or procedural change (requires Founder or Council approval)",
    patch: "Clarification or typo fix (requires committee chair approval)",
  },
} as const;
