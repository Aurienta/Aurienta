// AURIENTA Operating System (AOS) v1.0
// ═══════════════════════════════════════════════════════════════
// This file is the single source of truth for HOW AURIENTA EXECUTES
// WORK. It defines the complete enterprise operating system: process
// architecture, process library, SOPs, service catalog, capability
// map, operating metrics, dashboards, knowledge management, continuous
// improvement, organizational design, planning, performance management,
// operational excellence, end-to-end process simulation, and maturity.
//
// SYNCHRONIZED WITH:
//   - Constitutional Terminology (terminology.ts)
//   - Institutional Architecture (institutional-architecture.ts)
//   - Governance v1.0 (institutional-governance.ts)
//   - Enterprise Risk & Compliance (enterprise-risk-security.ts)
//   - Blueprint (download/AURIENTA_Blueprint_Modified.docx)
//
// No contradictions permitted. Every process, SOP, and workflow uses
// approved constitutional terminology and respects the 3-entity
// corporate structure (Holding / Operations / Advisory).
//
// DO NOT modify without Founder approval + Operations Committee review.
// ═══════════════════════════════════════════════════════════════

export const AOS_VERSION = "1.0";
export const AOS_FROZEN_AT = "2026-08-08";

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 1 — ENTERPRISE PROCESS ARCHITECTURE (L0–L3)
// ═══════════════════════════════════════════════════════════════
// AURIENTA's enterprise process map follows a 5-domain Level 0 model
// (Govern, Operate, Advise, Support, Improve) decomposed through Level
// 1 (process groups), Level 2 (processes), and Level 3 (activities).
// Aligned with the APQC Process Classification Framework, adapted to
// AURIENTA's constitutional model.

export type ProcessLevel = 0 | 1 | 2 | 3;

export type ProcessNode = {
  id: string;            // e.g. "OPS-L2-04"
  level: ProcessLevel;
  name: string;
  parent?: string;       // parent process id
  owner: string;         // constitutional role or entity
  cadence?: string;      // recurring rhythm
  priority: "Mission Critical" | "Core" | "Standard" | "Supporting";
};

// Level 0 — Five Execution Domains
export const LEVEL_0_DOMAINS: ProcessNode[] = [
  { id: "GOV",  level: 0, name: "Govern",   owner: "Holding Group",        priority: "Mission Critical" },
  { id: "OPS",  level: 0, name: "Operate",  owner: "AURIENTA Operations",   priority: "Mission Critical" },
  { id: "ADV",  level: 0, name: "Advise",   owner: "AURIENTA Advisory",     priority: "Mission Critical" },
  { id: "SUP",  level: 0, name: "Support",  owner: "Operations + Advisory", priority: "Core" },
  { id: "IMP",  level: 0, name: "Improve",  owner: "All entities",          priority: "Core" },
];

// Level 1 — Process Groups (19)
export const LEVEL_1_GROUPS: ProcessNode[] = [
  // Govern
  { id: "GOV-L1-01", level: 1, name: "Corporate Governance",            parent: "GOV", owner: "Holding Group", priority: "Mission Critical" },
  { id: "GOV-L1-02", level: 1, name: "Constitutional Governance",       parent: "GOV", owner: "Constitutional Council (future)", priority: "Mission Critical" },
  { id: "GOV-L1-03", level: 1, name: "Risk Management",                  parent: "GOV", owner: "Risk Committee", priority: "Mission Critical" },
  { id: "GOV-L1-04", level: 1, name: "Compliance & Audit",               parent: "GOV", owner: "Audit Committee", priority: "Mission Critical" },
  // Operate
  { id: "OPS-L1-01", level: 1, name: "Enterprise Onboarding",           parent: "OPS", owner: "Operations", priority: "Mission Critical" },
  { id: "OPS-L1-02", level: 1, name: "Capital Formation",               parent: "OPS", owner: "Operations", priority: "Mission Critical" },
  { id: "OPS-L1-03", level: 1, name: "Constitution Creation & CRE",     parent: "OPS", owner: "Operations", priority: "Mission Critical" },
  { id: "OPS-L1-04", level: 1, name: "Technology Delivery",             parent: "OPS", owner: "Operations", priority: "Mission Critical" },
  { id: "OPS-L1-05", level: 1, name: "Brain AI Operations",             parent: "OPS", owner: "Operations", priority: "Mission Critical" },
  { id: "OPS-L1-06", level: 1, name: "Customer Success",                parent: "OPS", owner: "Operations", priority: "Core" },
  { id: "OPS-L1-07", level: 1, name: "Enterprise Graduation",           parent: "OPS", owner: "Operations", priority: "Mission Critical" },
  { id: "OPS-L1-08", level: 1, name: "Finance Operations",              parent: "OPS", owner: "Operations", priority: "Core" },
  // Advise
  { id: "ADV-L1-01", level: 1, name: "Partner Management",              parent: "ADV", owner: "Advisory", priority: "Mission Critical" },
  { id: "ADV-L1-02", level: 1, name: "Government Relations",            parent: "ADV", owner: "Advisory", priority: "Core" },
  { id: "ADV-L1-03", level: 1, name: "Constitutional Certification",    parent: "ADV", owner: "Advisory", priority: "Core" },
  // Support
  { id: "SUP-L1-01", level: 1, name: "Legal Coordination",              parent: "SUP", owner: "Holding Group", priority: "Core" },
  { id: "SUP-L1-02", level: 1, name: "Human Resources",                 parent: "SUP", owner: "Operations", priority: "Core" },
  { id: "SUP-L1-03", level: 1, name: "Knowledge Management",            parent: "SUP", owner: "Operations", priority: "Core" },
  { id: "SUP-L1-04", level: 1, name: "Marketing & Sales",               parent: "SUP", owner: "Operations", priority: "Standard" },
  // Improve
  { id: "IMP-L1-01", level: 1, name: "Continuous Improvement",          parent: "IMP", owner: "All entities", priority: "Core" },
  { id: "IMP-L1-02", level: 1, name: "Innovation",                      parent: "IMP", owner: "All entities", priority: "Standard" },
];

// Level 2 — Processes (representative selection, ~40)
export const LEVEL_2_PROCESSES: ProcessNode[] = [
  // Corporate Governance
  { id: "GOV-L2-01", level: 2, name: "Board / Committee Operations",          parent: "GOV-L1-01", owner: "Holding Group", cadence: "Monthly", priority: "Mission Critical" },
  { id: "GOV-L2-02", level: 2, name: "Delegation of Authority Management",     parent: "GOV-L1-01", owner: "Holding Group", cadence: "Quarterly", priority: "Mission Critical" },
  // Constitutional Governance
  { id: "GOV-L2-03", level: 2, name: "Charter Drafting & Approval",            parent: "GOV-L1-02", owner: "Operations", cadence: "On demand", priority: "Mission Critical" },
  { id: "GOV-L2-04", level: 2, name: "Constitutional Amendment Process",      parent: "GOV-L1-02", owner: "Constitutional Council", cadence: "On demand", priority: "Mission Critical" },
  // Risk
  { id: "GOV-L2-05", level: 2, name: "Risk Register Maintenance",              parent: "GOV-L1-03", owner: "Risk Committee", cadence: "Monthly", priority: "Mission Critical" },
  // Compliance & Audit
  { id: "GOV-L2-06", level: 2, name: "Internal Audit Cycle",                  parent: "GOV-L1-04", owner: "Audit Committee", cadence: "Quarterly", priority: "Mission Critical" },
  { id: "GOV-L2-07", level: 2, name: "Compliance Monitoring",                  parent: "GOV-L1-04", owner: "Compliance Committee", cadence: "Monthly", priority: "Mission Critical" },
  // Onboarding
  { id: "OPS-L2-01", level: 2, name: "Enterprise Onboarding",                 parent: "OPS-L1-01", owner: "Operations", cadence: "Daily", priority: "Mission Critical" },
  { id: "OPS-L2-02", level: 2, name: "Capital Partner Onboarding",            parent: "OPS-L1-01", owner: "Operations", cadence: "Daily", priority: "Mission Critical" },
  // Capital Formation
  { id: "OPS-L2-03", level: 2, name: "Capital Participation Workflow",         parent: "OPS-L1-02", owner: "Operations", cadence: "Daily", priority: "Mission Critical" },
  { id: "OPS-L2-04", level: 2, name: "Milestone Funding Release",              parent: "OPS-L1-02", owner: "Operations", cadence: "On milestone", priority: "Mission Critical" },
  // Constitution & CRE
  { id: "OPS-L2-05", level: 2, name: "CRE Activation & Policy Enforcement",    parent: "OPS-L1-03", owner: "Operations", cadence: "Continuous", priority: "Mission Critical" },
  { id: "OPS-L2-06", level: 2, name: "Constitutional Vote Execution",          parent: "OPS-L1-03", owner: "Operations", cadence: "On demand", priority: "Mission Critical" },
  // Technology Delivery
  { id: "OPS-L2-07", level: 2, name: "Feature Delivery (Spec→Ship)",          parent: "OPS-L1-04", owner: "Operations", cadence: "Bi-weekly", priority: "Mission Critical" },
  { id: "OPS-L2-08", level: 2, name: "Release Management",                     parent: "OPS-L1-04", owner: "Operations", cadence: "Weekly", priority: "Mission Critical" },
  { id: "OPS-L2-09", level: 2, name: "Incident Management",                    parent: "OPS-L1-04", owner: "Operations", cadence: "On demand", priority: "Mission Critical" },
  { id: "OPS-L2-10", level: 2, name: "Architecture Review",                    parent: "OPS-L1-04", owner: "Architecture Review Board", cadence: "On demand", priority: "Core" },
  // Brain AI
  { id: "OPS-L2-11", level: 2, name: "Brain AI Review & Consensus",            parent: "OPS-L1-05", owner: "Operations", cadence: "Continuous", priority: "Mission Critical" },
  { id: "OPS-L2-12", level: 2, name: "AI Provider Governance",                 parent: "OPS-L1-05", owner: "AI Ethics Committee", cadence: "Monthly", priority: "Core" },
  // Customer Success
  { id: "OPS-L2-13", level: 2, name: "Enterprise Health Monitoring",           parent: "OPS-L1-06", owner: "Operations", cadence: "Continuous", priority: "Core" },
  { id: "OPS-L2-14", level: 2, name: "Support Request Resolution",             parent: "OPS-L1-06", owner: "Operations", cadence: "Daily", priority: "Core" },
  // Graduation
  { id: "OPS-L2-15", level: 2, name: "Graduation Workflow",                    parent: "OPS-L1-07", owner: "Operations", cadence: "On readiness", priority: "Mission Critical" },
  { id: "OPS-L2-16", level: 2, name: "Alumni Relations",                        parent: "OPS-L1-07", owner: "Operations", cadence: "Quarterly", priority: "Core" },
  // Finance
  { id: "OPS-L2-17", level: 2, name: "Financial Close",                        parent: "OPS-L1-08", owner: "Operations", cadence: "Monthly", priority: "Core" },
  { id: "OPS-L2-18", level: 2, name: "Law Firm Client Account Reconciliation",  parent: "OPS-L1-08", owner: "Operations", cadence: "Daily", priority: "Mission Critical" },
  // Partner Management
  { id: "ADV-L2-01", level: 2, name: "Partner Onboarding (Law/Account/Bank)",  parent: "ADV-L1-01", owner: "Advisory", cadence: "On demand", priority: "Mission Critical" },
  { id: "ADV-L2-02", level: 2, name: "Partner Engagement & SLA",               parent: "ADV-L1-01", owner: "Advisory", cadence: "Quarterly", priority: "Core" },
  { id: "ADV-L2-03", level: 2, name: "Vendor Approval",                        parent: "ADV-L1-01", owner: "Advisory", cadence: "On demand", priority: "Core" },
  // Government
  { id: "ADV-L2-04", level: 2, name: "Government Engagement",                  parent: "ADV-L1-02", owner: "Advisory", cadence: "On demand", priority: "Core" },
  // Certification
  { id: "ADV-L2-05", level: 2, name: "CAaaS Certification Workflow",           parent: "ADV-L1-03", owner: "Advisory", cadence: "On demand", priority: "Core" },
  { id: "ADV-L2-06", level: 2, name: "Strategic Partner Certification",        parent: "ADV-L1-03", owner: "Advisory", cadence: "On demand", priority: "Core" },
  // Legal
  { id: "SUP-L2-01", level: 2, name: "Contract Lifecycle",                     parent: "SUP-L1-01", owner: "Holding Group", cadence: "On demand", priority: "Core" },
  { id: "SUP-L2-02", level: 2, name: "Dispute Resolution",                     parent: "SUP-L1-01", owner: "Holding Group", cadence: "On demand", priority: "Core" },
  // HR
  { id: "SUP-L2-03", level: 2, name: "Talent Acquisition",                     parent: "SUP-L1-02", owner: "Operations", cadence: "On demand", priority: "Core" },
  { id: "SUP-L2-04", level: 2, name: "Performance Management",                 parent: "SUP-L1-02", owner: "Operations", cadence: "Quarterly", priority: "Core" },
  // Knowledge
  { id: "SUP-L2-05", level: 2, name: "Knowledge Publishing",                   parent: "SUP-L1-03", owner: "Operations", cadence: "Weekly", priority: "Core" },
  { id: "SUP-L2-06", level: 2, name: "Policy Updates",                         parent: "SUP-L1-03", owner: "Holding Group", cadence: "On demand", priority: "Core" },
  // Marketing
  { id: "SUP-L2-07", level: 2, name: "Marketing Campaigns",                   parent: "SUP-L1-04", owner: "Operations", cadence: "Monthly", priority: "Standard" },
  { id: "SUP-L2-08", level: 2, name: "Sales Pipeline",                         parent: "SUP-L1-04", owner: "Operations", cadence: "Weekly", priority: "Standard" },
  // Improvement
  { id: "IMP-L2-01", level: 2, name: "Postmortems & Retrospectives",          parent: "IMP-L1-01", owner: "All entities", cadence: "Per incident/sprint", priority: "Core" },
  { id: "IMP-L2-02", level: 2, name: "Root Cause Analysis",                    parent: "IMP-L1-01", owner: "All entities", cadence: "On demand", priority: "Core" },
  { id: "IMP-L2-03", level: 2, name: "Operational Excellence Review",          parent: "IMP-L1-01", owner: "Operations", cadence: "Quarterly", priority: "Core" },
  // Innovation
  { id: "IMP-L2-04", level: 2, name: "Strategic Planning",                    parent: "IMP-L1-02", owner: "Holding Group", cadence: "Annual", priority: "Mission Critical" },
  { id: "IMP-L2-05", level: 2, name: "Roadmap Planning",                       parent: "IMP-L1-02", owner: "Operations", cadence: "Quarterly", priority: "Core" },
];

// Level 3 — Activities (representative subset for the highest-priority processes)
export const LEVEL_3_ACTIVITIES: ProcessNode[] = [
  // Enterprise Onboarding L3
  { id: "OPS-L3-01", level: 3, name: "Receive application & validate identity anchor", parent: "OPS-L2-01", owner: "Operations", priority: "Mission Critical" },
  { id: "OPS-L3-02", level: 3, name: "Brain AI risk review",                        parent: "OPS-L2-01", owner: "Brain AI", priority: "Mission Critical" },
  { id: "OPS-L3-03", level: 3, name: "Law firm assignment & Law Firm Client Account setup", parent: "OPS-L2-01", owner: "Advisory + Law Firm", priority: "Mission Critical" },
  { id: "OPS-L3-04", level: 3, name: "Charter drafting & Constitutional Partner sign-off", parent: "OPS-L2-01", owner: "Operations", priority: "Mission Critical" },
  { id: "OPS-L3-05", level: 3, name: "CRE activation & ledger genesis",              parent: "OPS-L2-01", owner: "CRE", priority: "Mission Critical" },
  // Capital Formation L3
  { id: "OPS-L3-06", level: 3, name: "Capital Partner authentication & eligibility check", parent: "OPS-L2-03", owner: "CRE", priority: "Mission Critical" },
  { id: "OPS-L3-07", level: 3, name: "CPP calculation & ±5% band enforcement",      parent: "OPS-L2-03", owner: "CRE", priority: "Mission Critical" },
  { id: "OPS-L3-08", level: 3, name: "Capital transfer to Law Firm Client Account", parent: "OPS-L2-03", owner: "Capital Partner → Law Firm", priority: "Mission Critical" },
  { id: "OPS-L3-09", level: 3, name: "Equity Unit issuance & Ownership Ledger append", parent: "OPS-L2-03", owner: "CRE", priority: "Mission Critical" },
  // Feature Delivery L3
  { id: "OPS-L3-10", level: 3, name: "Requirement intake & spec",                   parent: "OPS-L2-07", owner: "Operations", priority: "Core" },
  { id: "OPS-L3-11", level: 3, name: "Architecture Review Board sign-off",          parent: "OPS-L2-07", owner: "ARB", priority: "Core" },
  { id: "OPS-L3-12", level: 3, name: "Implementation & peer review",                parent: "OPS-L2-07", owner: "Operations", priority: "Core" },
  { id: "OPS-L3-13", level: 3, name: "CRE policy gate & staging deploy",            parent: "OPS-L2-07", owner: "CRE", priority: "Core" },
  { id: "OPS-L3-14", level: 3, name: "Release management sign-off & production deploy", parent: "OPS-L2-07", owner: "Operations", priority: "Mission Critical" },
  // Graduation L3
  { id: "OPS-L3-15", level: 3, name: "Graduation readiness score ≥ 90",             parent: "OPS-L2-15", owner: "CRE", priority: "Mission Critical" },
  { id: "OPS-L3-16", level: 3, name: "Constitutional Council ratification",         parent: "OPS-L2-15", owner: "Constitutional Council", priority: "Mission Critical" },
  { id: "OPS-L3-17", level: 3, name: "Final financial settlement & Ownership Ledger freeze", parent: "OPS-L2-15", owner: "Operations", priority: "Mission Critical" },
  { id: "OPS-L3-18", level: 3, name: "Alumni onboarding & handoff",                 parent: "OPS-L2-15", owner: "Operations", priority: "Core" },
];

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 2 — PROCESS LIBRARY (24 processes)
// ═══════════════════════════════════════════════════════════════

export type ProcessRecord = {
  id: string;
  name: string;
  domain: "Govern" | "Operate" | "Advise" | "Support" | "Improve";
  owner: string;
  trigger: string;
  cadence: string;
  inputs: string[];
  outputs: string[];
  steps: string[];
  systems: string[];
  controls: string[];
  evidence: string[];
  kpis: string[];
  escalation: string;
  automationLevel: "Manual" | "Semi-Automated" | "Automated" | "Autonomous";
};

export const PROCESS_LIBRARY: ProcessRecord[] = [
  {
    id: "PRC-001", name: "Enterprise Onboarding", domain: "Operate",
    owner: "AURIENTA Operations", trigger: "Founder/Operator submits enterprise application",
    cadence: "Daily",
    inputs: ["Identity Anchor", "Business plan", "Sector classification", "Police clearance (Manager)"],
    outputs: ["Active enterprise", "CRE ledger genesis", "Law Firm Client Account", "Charter"],
    steps: [
      "1. Receive & validate application",
      "2. Brain AI risk & sector review",
      "3. Law firm assignment & Law Firm Client Account setup",
      "4. Charter drafting & Constitutional Partner sign-off",
      "5. CRE activation & ledger genesis",
      "6. Ownership Ledger initialization",
      "7. Welcome packet & operator orientation",
    ],
    systems: ["CRE", "Brain AI", "Ownership Ledger", "Prisma DB"],
    controls: ["CRE-POL-001 Identity", "CRE-POL-002 Eligibility", "Audit log"],
    evidence: ["Application record", "Brain AI artifact", "Charter hash", "Ledger genesis block"],
    kpis: ["Onboarding time (target ≤ 5 business days)", "First-time acceptance rate"],
    escalation: "Operations Lead → COO → Founder",
    automationLevel: "Semi-Automated",
  },
  {
    id: "PRC-002", name: "Capital Formation Workflow", domain: "Operate",
    owner: "AURIENTA Operations", trigger: "Capital Partner requests participation",
    cadence: "Daily",
    inputs: ["Capital Partner identity", "Target enterprise", "Participation amount"],
    outputs: ["Equity Units issued", "Ledger entry", "Law Firm Client Account credit"],
    steps: [
      "1. Capital Partner authentication & eligibility",
      "2. CPP calculation & ±5% band enforcement",
      "3. Capital transfer instruction to Law Firm Client Account",
      "4. Law firm confirms receipt",
      "5. CRE issues Equity Units & appends Ownership Ledger",
      "6. Real-time transparency broadcast to Constitutional Partners",
    ],
    systems: ["CRE", "Brain AI", "Law Firm portal", "Ownership Ledger"],
    controls: ["CRE-POL-003 Zero Custody", "CRE-POL-005 Price Band", "CRE-POL-009 Transparency"],
    evidence: ["Law firm receipt", "Ledger entry hash", "Brain AI consensus record"],
    kpis: ["Cycle time (target ≤ 24h)", "Reconciliation accuracy 100%"],
    escalation: "Operations Lead → COO → Risk Committee",
    automationLevel: "Automated",
  },
  {
    id: "PRC-003", name: "Constitution Creation", domain: "Govern",
    owner: "AURIENTA Operations (draft) → Constitutional Council (ratify)",
    trigger: "Enterprise onboarding milestone 4",
    cadence: "On demand",
    inputs: ["Enterprise profile", "Tier rules", "Founder preferences"],
    outputs: ["Constitutional Charter", "CRE policy bundle", "Genesis ledger block"],
    steps: [
      "1. Template selection by tier (A–F)",
      "2. Customize charter clauses",
      "3. Brain AI compliance review",
      "4. Founder/Operator sign-off",
      "5. CRE policy compilation",
      "6. Charter hash & ledger genesis",
    ],
    systems: ["CRE", "Brain AI", "Charter editor"],
    controls: ["CRE-POL-004 Charter Integrity", "CRE-POL-015 Amendment Process"],
    evidence: ["Charter document hash", "Brain AI review artifact", "Signature records"],
    kpis: ["Charter quality score", "Amendment rate (target low)"],
    escalation: "Operations → Constitutional Council → Founder",
    automationLevel: "Semi-Automated",
  },
  {
    id: "PRC-004", name: "CRE Activation & Enforcement", domain: "Operate",
    owner: "AURIENTA Operations", trigger: "Charter ratification",
    cadence: "Continuous",
    inputs: ["Charter", "Policy bundle", "Runtime events"],
    outputs: ["Enforced decisions", "Ledger entries", "Decision tokens"],
    steps: [
      "1. Load compiled Rego policies",
      "2. Bind to enterprise context",
      "3. Evaluate every transactional event",
      "4. Sign approved decisions (Ed25519)",
      "5. Append to tamper-evident ledger",
      "6. Reject & log violations",
    ],
    systems: ["CRE", "Ed25519 signer", "Hash-chain ledger"],
    controls: ["CRE-POL-001..015 (all 15 policies)", "verifyLedgerChain()"],
    evidence: ["Decision tokens", "Ledger blocks", "Violation log"],
    kpis: ["Enforcement latency (target < 50ms)", "Ledger integrity 100%", "Violation rate"],
    escalation: "Auto → Operations Lead → Architecture Review Board",
    automationLevel: "Autonomous",
  },
  {
    id: "PRC-005", name: "Law Firm Onboarding", domain: "Advise",
    owner: "AURIENTA Advisory", trigger: "Capacity expansion or partner replacement",
    cadence: "On demand",
    inputs: ["Law firm credentials", "Bar registration", "Amendment IX compliance"],
    outputs: ["Accredited law firm partner", "Law Firm Client Account template"],
    steps: [
      "1. Due diligence (credentials, conflicts, reputation)",
      "2. Amendment IX compliance verification (Law 17/1983 Art. 47)",
      "3. Master services agreement",
      "4. Law Firm Client Account opening",
      "5. CRE partner registration",
      "6. Training on AURIENTA reconciliation protocol",
    ],
    systems: ["Partner CRM", "CRE", "Advisory registry"],
    controls: ["Amendment IX Zero Custody", "Partner accreditation control"],
    evidence: ["Due diligence report", "Signed MSA", "Account opening confirmation"],
    kpis: ["Onboarding time (target ≤ 21 days)", "Partner SLA compliance"],
    escalation: "Advisory Director → Founder",
    automationLevel: "Manual",
  },
  {
    id: "PRC-006", name: "Accountant Onboarding", domain: "Advise",
    owner: "AURIENTA Advisory", trigger: "Capacity expansion",
    cadence: "On demand",
    inputs: ["Accountant credentials", "Audit firm registration"],
    outputs: ["Accredited accounting partner"],
    steps: ["1. Due diligence", "2. Independence verification", "3. MSA", "4. CRE registration", "5. Training"],
    systems: ["Partner CRM", "CRE"],
    controls: ["Independence control", "Partner accreditation"],
    evidence: ["DD report", "Signed MSA"],
    kpis: ["Onboarding time ≤ 14 days"],
    escalation: "Advisory Director → Audit Committee",
    automationLevel: "Manual",
  },
  {
    id: "PRC-007", name: "Partner Onboarding (General)", domain: "Advise",
    owner: "AURIENTA Advisory", trigger: "Ecosystem expansion",
    cadence: "On demand",
    inputs: ["Partner profile", "Use case", "Compliance posture"],
    outputs: ["Accredited partner with defined role"],
    steps: ["1. Application intake", "2. Brain AI fit assessment", "3. Due diligence", "4. Classification (Law/Account/Bank/University/ERP/Gov)", "5. MSA", "6. CRE registration"],
    systems: ["Partner CRM", "Brain AI", "CRE"],
    controls: ["Partner accreditation", "Conflict of interest check"],
    evidence: ["Application", "DD report", "MSA"],
    kpis: ["Onboarding time ≤ 30 days", "Partner satisfaction"],
    escalation: "Advisory Director → Partnership Committee",
    automationLevel: "Semi-Automated",
  },
  {
    id: "PRC-008", name: "Brain AI Review & Consensus", domain: "Operate",
    owner: "AURIENTA Operations", trigger: "Any AI-assisted decision request",
    cadence: "Continuous",
    inputs: ["Task kind", "Context", "User message"],
    outputs: ["Consensus response", "Artifact record", "Confidence score"],
    steps: [
      "1. Route task to provider ordering by kind",
      "2. Call up to 5 providers (consensus mode)",
      "3. Synthesize consensus",
      "4. Constitutional prompt validation",
      "5. Persist artifact with full audit trail",
      "6. Return response with confidence",
    ],
    systems: ["Brain AI router", "5 providers", "AiArtifact store"],
    controls: ["Non-overridable system prompt", "Hallucination monitor", "Bias monitor"],
    evidence: ["AiArtifact rows (10-yr retention)"],
    kpis: ["Consensus rate", "Hallucination rate < 1%", "P95 latency"],
    escalation: "AI Ethics Committee → Founder",
    automationLevel: "Autonomous",
  },
  {
    id: "PRC-009", name: "Graduation Workflow", domain: "Operate",
    owner: "AURIENTA Operations", trigger: "Enterprise readiness score ≥ 90",
    cadence: "On readiness",
    inputs: ["Enterprise health", "Financial settlement", "Charter status"],
    outputs: ["Graduated enterprise", "Frozen ledger", "Alumni record"],
    steps: [
      "1. Graduation readiness assessment",
      "2. Final financial reconciliation",
      "3. Constitutional Council ratification",
      "4. Ownership Ledger freeze & snapshot",
      "5. Final settlement to Law Firm Client Account",
      "6. Alumni onboarding & handoff",
      "7. CRE archival",
    ],
    systems: ["CRE", "Ownership Ledger", "Brain AI"],
    controls: ["CRE-POL-014 Graduation Gate", "Constitutional Council ratification"],
    evidence: ["Readiness report", "Council minutes", "Frozen ledger hash"],
    kpis: ["Graduation cycle time", "Alumni satisfaction"],
    escalation: "Operations → Constitutional Council → Founder",
    automationLevel: "Semi-Automated",
  },
  {
    id: "PRC-010", name: "CAaaS Certification Workflow", domain: "Advise",
    owner: "AURIENTA Advisory", trigger: "Graduated enterprise applies for CAaaS",
    cadence: "On demand",
    inputs: ["Graduation record", "Enterprise request", "Audit evidence"],
    outputs: ["Constitutional Advisory certification"],
    steps: ["1. Application", "2. Compliance audit", "3. Brain AI assessment", "4. Certification decision", "5. Issuance & registry"],
    systems: ["Partner CRM", "Brain AI", "CRE"],
    controls: ["Certification control", "Audit Committee oversight"],
    evidence: ["Audit report", "Certificate hash"],
    kpis: ["Certification time ≤ 60 days"],
    escalation: "Advisory Director → Audit Committee",
    automationLevel: "Semi-Automated",
  },
  {
    id: "PRC-011", name: "Dispute Resolution", domain: "Govern",
    owner: "Holding Group Legal", trigger: "Constitutional Partner files dispute",
    cadence: "On demand",
    inputs: ["Dispute filing", "Evidence", "Charter clauses"],
    outputs: ["Binding resolution", "Ledger entry"],
    steps: ["1. Intake & triage", "2. Brain AI precedent analysis", "3. Mediation", "4. Constitutional Council ruling (if escalated)", "5. Enforcement via CRE", "6. Appeal window"],
    systems: ["CRE", "Brain AI", "Dispute registry"],
    controls: ["Due process control", "Appeals control"],
    evidence: ["Filing", "Ruling", "Enforcement record"],
    kpis: ["Resolution time ≤ 30 days", "Appeal rate"],
    escalation: "Legal → Constitutional Council → Founder (final)",
    automationLevel: "Manual",
  },
  {
    id: "PRC-012", name: "Feature Delivery (Spec→Ship)", domain: "Operate",
    owner: "AURIENTA Operations", trigger: "Roadmap item or partner request",
    cadence: "Bi-weekly sprint",
    inputs: ["Requirement", "Architecture context", "CRE policies"],
    outputs: ["Deployed feature", "Documentation", "Test evidence"],
    steps: ["1. Spec & acceptance criteria", "2. ARB review", "3. Implementation", "4. Peer review", "5. CRE policy gate", "6. Staging", "7. Release sign-off", "8. Production deploy", "9. Post-deploy monitoring"],
    systems: ["Git", "CRE", "CI/CD", "Brain AI (code review)"],
    controls: ["Source code control", "Deployment gate", "ARB control"],
    evidence: ["PRs", "ARB minutes", "Deployment record"],
    kpis: ["Lead time", "Deployment frequency", "Change failure rate < 5%"],
    escalation: "Eng Lead → COO → Founder",
    automationLevel: "Automated",
  },
  {
    id: "PRC-013", name: "Release Management", domain: "Operate",
    owner: "AURIENTA Operations", trigger: "Sprint cadence or hotfix",
    cadence: "Weekly",
    inputs: ["Merged PRs", "Release notes", "CRE verification"],
    outputs: ["Tagged release", "Deployment", "Announcement"],
    steps: ["1. Release candidate build", "2. CRE verifyLedgerChain()", "3. Staging smoke test", "4. Release sign-off", "5. Blue/green deploy", "6. Post-deploy verification", "7. Announcement"],
    systems: ["CI/CD", "CRE", "Notifications"],
    controls: ["Deployment gate", "Rollback runbook"],
    evidence: ["Release tag", "Deployment log", "Smoke test result"],
    kpis: ["Deployment frequency", "MTTR"],
    escalation: "Release Manager → COO",
    automationLevel: "Automated",
  },
  {
    id: "PRC-014", name: "Incident Management", domain: "Operate",
    owner: "AURIENTA Operations", trigger: "Alert or partner report",
    cadence: "On demand",
    inputs: ["Alert", "Initial triage", "CRE status"],
    outputs: ["Resolution", "Postmortem", "Improvement actions"],
    steps: ["1. Detect & classify (Sev 1-4)", "2. Mobilize response team", "3. Mitigate", "4. Resolve", "5. Postmortem within 48h", "6. Improvement backlog update", "7. Knowledge base update"],
    systems: ["Monitoring", "CRE", "Brain AI (triage assist)"],
    controls: ["BCP/DR runbook", "Evidence retention"],
    evidence: ["Incident ticket", "Postmortem doc", "Timeline"],
    kpis: ["MTTR (Sev1 ≤ 4h)", "Incident rate", "Postmortem completion 100%"],
    escalation: "On-call → Eng Lead → COO → Founder (Sev1)",
    automationLevel: "Semi-Automated",
  },
  {
    id: "PRC-015", name: "Vendor Approval", domain: "Advise",
    owner: "AURIENTA Advisory", trigger: "Operations request or partner need",
    cadence: "On demand",
    inputs: ["Vendor profile", "Security questionnaire", "Use case"],
    outputs: ["Approved/rejected vendor", "MSA"],
    steps: ["1. Intake", "2. Security & compliance review", "3. Brain AI risk assessment", "4. Reference checks", "5. Decision (delegated < 100K EGP, Founder > 1M)", "6. MSA & CRE registration"],
    systems: ["Partner CRM", "Brain AI", "CRE"],
    controls: ["Vendor onboarding control", "SOC2 evidence"],
    evidence: ["Questionnaire", "Decision record"],
    kpis: ["Approval cycle ≤ 21 days"],
    escalation: "Advisory → Risk Committee → Founder",
    automationLevel: "Semi-Automated",
  },
  {
    id: "PRC-016", name: "Government Engagement", domain: "Advise",
    owner: "AURIENTA Advisory", trigger: "Regulatory change or strategic opportunity",
    cadence: "On demand",
    inputs: ["Regulatory development", "Engagement objective"],
    outputs: ["Engagement record", "Policy position", "Relationship update"],
    steps: ["1. Objective definition", "2. Briefing preparation", "3. Brain AI policy analysis", "4. Engagement (Founder/Advisory)", "5. Follow-up & documentation", "6. Knowledge base update"],
    systems: ["Partner CRM", "Brain AI"],
    controls: ["Brand control", "Compliance control"],
    evidence: ["Briefing", "Meeting record"],
    kpis: ["Engagement outcome score"],
    escalation: "Advisory Director → Founder",
    automationLevel: "Manual",
  },
  {
    id: "PRC-017", name: "Contract Lifecycle", domain: "Support",
    owner: "Holding Group Legal", trigger: "New relationship or renewal",
    cadence: "On demand",
    inputs: ["Counterparty", "Terms", "CRE compliance check"],
    outputs: ["Executed contract", "Obligation register"],
    steps: ["1. Draft", "2. Brain AI compliance review", "3. Negotiation", "4. Sign-off (delegation matrix)", "5. Execution", "6. Obligation tracking", "7. Renewal calendar"],
    systems: ["Contract repository", "Brain AI", "CRE"],
    controls: ["Sign-off control", "Obligation tracking"],
    evidence: ["Contract hash", "Sign-off record"],
    kpis: ["Cycle time ≤ 14 days", "Obligation compliance 100%"],
    escalation: "Legal → Holding Group → Founder",
    automationLevel: "Semi-Automated",
  },
  {
    id: "PRC-018", name: "Financial Close", domain: "Operate",
    owner: "AURIENTA Operations Finance", trigger: "Month-end",
    cadence: "Monthly",
    inputs: ["Ledger data", "Bank statements", "Law Firm Client Account reconciliations"],
    outputs: ["Financial statements", "KPI pack", "Audit trail"],
    steps: ["1. Reconcile all Law Firm Client Accounts", "2. Reconcile operating accounts", "3. Accruals", "4. Brain AI anomaly scan", "5. Statement preparation", "6. Founder review", "7. Archive with hash"],
    systems: ["Prisma DB", "Brain AI", "Accounting"],
    controls: ["Financial control", "Audit log"],
    evidence: ["Statements", "Reconciliation", "Hash archive"],
    kpis: ["Close cycle ≤ 5 business days", "Anomaly rate < 0.1%"],
    escalation: "Finance Lead → COO → Founder",
    automationLevel: "Semi-Automated",
  },
  {
    id: "PRC-019", name: "Strategic Planning", domain: "Improve",
    owner: "Holding Group", trigger: "Annual cycle",
    cadence: "Annual",
    inputs: ["Market analysis", "Performance data", "Brain AI scenario analysis"],
    outputs: ["3-year strategy", "Annual plan", "OKRs"],
    steps: ["1. Environmental scan", "2. Brain AI scenario modeling", "3. Strategy draft", "4. Executive committee review", "5. Founder approval", "6. Cascade to OKRs", "7. Communication"],
    systems: ["Brain AI", "Knowledge base"],
    controls: ["Strategic control", "Founder approval"],
    evidence: ["Strategy doc", "OKR tree"],
    kpis: ["Plan completion", "OKR achievement"],
    escalation: "Executive Committee → Founder",
    automationLevel: "Manual",
  },
  {
    id: "PRC-020", name: "Architecture Review", domain: "Govern",
    owner: "Architecture Review Board", trigger: "New system or major change",
    cadence: "On demand",
    inputs: ["Architecture proposal", "ADR", "Risk assessment"],
    outputs: ["Approved/rejected architecture", "ADR record"],
    steps: ["1. ADR submission", "2. Brain AI impact analysis", "3. ARB review", "4. Decision", "5. ADR registry update", "6. Communication"],
    systems: ["ADR registry", "Brain AI"],
    controls: ["ARB control", "Source code control"],
    evidence: ["ADR", "ARB minutes"],
    kpis: ["Review cycle ≤ 10 days"],
    escalation: "ARB → CTO/COO → Founder",
    automationLevel: "Manual",
  },
  {
    id: "PRC-021", name: "Change Management (Constitutional)", domain: "Govern",
    owner: "Constitutional Council (future) / Founder", trigger: "Proposed charter or governance change",
    cadence: "On demand",
    inputs: ["Change proposal", "Impact assessment"],
    outputs: ["Approved/rejected change", "Versioned constitution"],
    steps: ["1. Proposal", "2. Impact assessment", "3. Consultation", "4. Approval (75% supermajority for major)", "5. Versioning", "6. Audit trail", "7. Notification", "8. Implementation"],
    systems: ["CRE", "Knowledge base"],
    controls: ["Constitutional amendment control", "Audit log"],
    evidence: ["Proposal", "Impact assessment", "Vote record", "Versioned doc"],
    kpis: ["Change cycle time", "Approval rate"],
    escalation: "Constitutional Council → Founder (final)",
    automationLevel: "Manual",
  },
  {
    id: "PRC-022", name: "Knowledge Publishing", domain: "Support",
    owner: "AURIENTA Operations", trigger: "New knowledge artifact or review cycle",
    cadence: "Weekly",
    inputs: ["Draft document", "Owner", "Classification"],
    outputs: ["Versioned knowledge artifact", "Indexed search record"],
    steps: ["1. Draft", "2. Peer review", "3. Brain AI indexing", "4. Approval", "5. Publish", "6. Version tag", "7. Review calendar"],
    systems: ["Knowledge base", "Brain AI"],
    controls: ["Knowledge control", "Classification control"],
    evidence: ["Version history", "Approval record"],
    kpis: ["Documentation coverage", "Knowledge freshness"],
    escalation: "Knowledge Lead → COO",
    automationLevel: "Semi-Automated",
  },
  {
    id: "PRC-023", name: "Quarterly Planning", domain: "Improve",
    owner: "AURIENTA Operations", trigger: "Quarterly cycle",
    cadence: "Quarterly",
    inputs: ["Annual plan", "Prior quarter results", "Roadmap"],
    outputs: ["Quarterly OKRs", "Capacity plan", "Budget allocation"],
    steps: ["1. Retrospective", "2. Brain AI trend analysis", "3. OKR draft", "4. Resource allocation", "5. Approval", "6. Cascade"],
    systems: ["Knowledge base", "Brain AI"],
    controls: ["Planning control", "Founder approval (major)"],
    evidence: ["OKR doc", "Capacity plan"],
    kpis: ["Plan vs actual variance"],
    escalation: "COO → Founder",
    automationLevel: "Manual",
  },
  {
    id: "PRC-024", name: "Policy Updates", domain: "Support",
    owner: "Holding Group", trigger: "Regulatory change or internal need",
    cadence: "On demand",
    inputs: ["Trigger", "Draft policy", "Impact analysis"],
    outputs: ["Versioned policy", "Communication", "Training plan"],
    steps: ["1. Trigger documentation", "2. Draft", "3. Brain AI compliance review", "4. Stakeholder consultation", "5. Approval (delegation matrix)", "6. Version & publish", "7. Training", "8. Audit"],
    systems: ["Knowledge base", "Brain AI", "CRE"],
    controls: ["Policy control", "Audit log"],
    evidence: ["Versioned policy", "Approval record", "Training completion"],
    kpis: ["Policy currency", "Training completion 100%"],
    escalation: "Compliance → Founder",
    automationLevel: "Semi-Automated",
  },
];

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 3 — STANDARD OPERATING PROCEDURES (SOPs)
// ═══════════════════════════════════════════════════════════════
// Each SOP carries the 13 mandatory fields. The PROCESS_LIBRARY
// above already carries purpose (name), owner, trigger, inputs,
// outputs, steps, controls, evidence, KPIs, escalation. The SOP
// records below add the remaining fields: exceptions and automation
// opportunities, plus a SOP identifier linking to the process.

export type Sop = {
  sopId: string;       // SOP-001
  processId: string;   // links to PROCESS_LIBRARY
  title: string;
  owner: string;
  trigger: string;
  inputs: string[];
  outputs: string[];
  steps: string[];
  controls: string[];
  evidence: string[];
  kpis: string[];
  escalation: string;
  exceptions: string;
  automationOpportunities: string;
};

export const SOP_LIBRARY: Sop[] = [
  {
    sopId: "SOP-001", processId: "PRC-001", title: "Enterprise Onboarding SOP",
    owner: "AURIENTA Operations", trigger: "Application submission",
    inputs: ["Identity Anchor", "Business plan", "Sector", "Police clearance (Manager)"],
    outputs: ["Active enterprise", "CRE genesis", "Law Firm Client Account", "Charter"],
    steps: PROCESS_LIBRARY[0].steps,
    controls: ["CRE-POL-001 Identity", "CRE-POL-002 Eligibility", "Audit log"],
    evidence: ["Application", "Brain AI artifact", "Charter hash", "Genesis block"],
    kpis: ["Onboarding ≤ 5 business days", "First-time acceptance rate ≥ 80%"],
    escalation: "Operations Lead → COO → Founder",
    exceptions: "If identity verification fails, escalate to Compliance for manual KYC. If sector is restricted, reject with documented rationale. Tier upgrades require re-onboarding.",
    automationOpportunities: "Auto-validate identity anchor against issuer; auto-generate charter from tier template; auto-open Law Firm Client Account via law firm API; Brain AI pre-screening.",
  },
  {
    sopId: "SOP-002", processId: "PRC-002", title: "Capital Formation SOP",
    owner: "AURIENTA Operations", trigger: "Participation request",
    inputs: ["Capital Partner identity", "Enterprise", "Amount"],
    outputs: ["Equity Units", "Ledger entry", "Law Firm Client Account credit"],
    steps: PROCESS_LIBRARY[1].steps,
    controls: ["CRE-POL-003 Zero Custody", "CRE-POL-005 Price Band", "CRE-POL-009 Transparency"],
    evidence: ["Law firm receipt", "Ledger hash", "Brain AI consensus"],
    kpis: ["Cycle ≤ 24h", "Reconciliation 100%"],
    escalation: "Operations Lead → COO → Risk Committee",
    exceptions: "If CPP outside ±5% band, CRE auto-rejects. If Law Firm Client Account credit not received within 24h, hold issuance and escalate to law firm. If Capital Partner fails re-KYC, freeze participation.",
    automationOpportunities: "Auto-reconcile Law Firm Client Account credits against ledger; auto-issue Equity Units on confirmed receipt; real-time transparency broadcast; Brain AI anomaly detection on participation patterns.",
  },
  {
    sopId: "SOP-003", processId: "PRC-008", title: "Brain AI Review & Consensus SOP",
    owner: "AURIENTA Operations", trigger: "AI task request",
    inputs: ["Task kind", "Context", "User message"],
    outputs: ["Consensus response", "Artifact", "Confidence"],
    steps: PROCESS_LIBRARY[7].steps,
    controls: ["Non-overridable system prompt", "Hallucination monitor", "Bias monitor"],
    evidence: ["AiArtifact rows (10-yr retention)"],
    kpis: ["Consensus rate", "Hallucination < 1%", "P95 latency"],
    escalation: "AI Ethics Committee → Founder",
    exceptions: "If 2+ providers disagree materially, flag for human review. If consensus confidence < 0.7, require human sign-off. If hallucination detected, quarantine response and retrain guard.",
    automationOpportunities: "Auto-route by task kind; auto-persist artifacts; auto-detect hallucination via cross-provider contradiction; auto-fallback to standard mode if consensus fails.",
  },
  {
    sopId: "SOP-004", processId: "PRC-009", title: "Graduation SOP",
    owner: "AURIENTA Operations", trigger: "Readiness ≥ 90",
    inputs: ["Health", "Financial settlement", "Charter status"],
    outputs: ["Graduated enterprise", "Frozen ledger", "Alumni record"],
    steps: PROCESS_LIBRARY[8].steps,
    controls: ["CRE-POL-014 Graduation Gate", "Constitutional Council ratification"],
    evidence: ["Readiness report", "Council minutes", "Frozen ledger hash"],
    kpis: ["Graduation cycle time", "Alumni satisfaction"],
    escalation: "Operations → Constitutional Council → Founder",
    exceptions: "If readiness score drops below 90 during process, pause and remediate. If Constitutional Council rejects, return to enterprise with improvement plan. If financial settlement disputed, escalate to dispute resolution.",
    automationOpportunities: "Auto-monitor readiness score; auto-generate settlement reconciliation; auto-snapshot ledger on ratification; auto-create alumni record.",
  },
  {
    sopId: "SOP-005", processId: "PRC-014", title: "Incident Management SOP",
    owner: "AURIENTA Operations", trigger: "Alert or partner report",
    inputs: ["Alert", "Triage", "CRE status"],
    outputs: ["Resolution", "Postmortem", "Improvements"],
    steps: PROCESS_LIBRARY[13].steps,
    controls: ["BCP/DR runbook", "Evidence retention"],
    evidence: ["Ticket", "Postmortem", "Timeline"],
    kpis: ["MTTR Sev1 ≤ 4h", "Incident rate", "Postmortem 100%"],
    escalation: "On-call → Eng Lead → COO → Founder (Sev1)",
    exceptions: "Sev1 incidents auto-page Founder. If CRE ledger compromised, invoke BCP Oracle Mirror. If data breach suspected, invoke PDPL notification within 72h. If Brain AI unavailable, graceful degradation to single-provider.",
    automationOpportunities: "Auto-classify severity; auto-mobilize on-call; auto-generate timeline from logs; Brain AI draft postmortem; auto-create improvement backlog items.",
  },
  {
    sopId: "SOP-006", processId: "PRC-018", title: "Financial Close SOP",
    owner: "AURIENTA Operations Finance", trigger: "Month-end",
    inputs: ["Ledger", "Bank statements", "Reconciliations"],
    outputs: ["Statements", "KPI pack", "Audit trail"],
    steps: PROCESS_LIBRARY[17].steps,
    controls: ["Financial control", "Audit log"],
    evidence: ["Statements", "Reconciliation", "Hash archive"],
    kpis: ["Close ≤ 5 business days", "Anomaly < 0.1%"],
    escalation: "Finance Lead → COO → Founder",
    exceptions: "If unreconciled difference > 1 EGP, halt close and investigate. If Law Firm Client Account mismatch, escalate to law firm within 24h. If Brain AI anomaly flagged, manual review required before close.",
    automationOpportunities: "Auto-reconcile Law Firm Client Accounts; auto-match bank statements; Brain AI anomaly scan; auto-generate KPI pack; auto-hash archive.",
  },
];

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 4 — SERVICE CATALOG
// ═══════════════════════════════════════════════════════════════

export type ServiceRecord = {
  serviceId: string;
  name: string;
  provider: "Holding" | "Operations" | "Advisory";
  consumer: string;
  inputs: string[];
  outputs: string[];
  serviceLevels: string;
  dependencies: string[];
};

export const SERVICE_CATALOG: ServiceRecord[] = [
  { serviceId: "SVC-001", name: "Engineering Services", provider: "Operations", consumer: "All entities", inputs: ["Requirements"], outputs: ["Software deliverables"], serviceLevels: "Bi-weekly sprint cadence, Sev1 MTTR 4h", dependencies: ["CRE", "Brain AI", "CI/CD"] },
  { serviceId: "SVC-002", name: "AI Services (Brain AI)", provider: "Operations", consumer: "All entities + enterprises", inputs: ["Task kind", "Context"], outputs: ["Consensus responses", "Artifacts"], serviceLevels: "P95 < 5s, 99.5% availability", dependencies: ["5 AI providers", "AiArtifact store"] },
  { serviceId: "SVC-003", name: "CRE Services", provider: "Operations", consumer: "All enterprises", inputs: ["Charter", "Events"], outputs: ["Enforced decisions", "Ledger"], serviceLevels: "< 50ms enforcement, 100% ledger integrity", dependencies: ["Ed25519 signer", "Hash-chain ledger"] },
  { serviceId: "SVC-004", name: "Legal Coordination", provider: "Holding", consumer: "All entities", inputs: ["Legal request"], outputs: ["Contracts", "Opinions"], serviceLevels: "Cycle ≤ 14 days", dependencies: ["Law firm network"] },
  { serviceId: "SVC-005", name: "Partner Management", provider: "Advisory", consumer: "All entities", inputs: ["Partner request"], outputs: ["Accredited partners"], serviceLevels: "Onboarding ≤ 30 days", dependencies: ["Partner CRM", "Brain AI"] },
  { serviceId: "SVC-006", name: "Certification (CAaaS)", provider: "Advisory", consumer: "Graduated enterprises", inputs: ["Application", "Audit evidence"], outputs: ["Certification"], serviceLevels: "Cycle ≤ 60 days", dependencies: ["Audit Committee", "Brain AI"] },
  { serviceId: "SVC-007", name: "Compliance Support", provider: "Operations", consumer: "All entities", inputs: ["Compliance question"], outputs: ["Guidance", "Filings"], serviceLevels: "Response ≤ 2 business days", dependencies: ["Knowledge base", "Brain AI"] },
  { serviceId: "SVC-008", name: "Risk Advisory", provider: "Holding", consumer: "All entities", inputs: ["Risk question"], outputs: ["Assessment", "Mitigation"], serviceLevels: "Response ≤ 3 business days", dependencies: ["Risk Committee", "Brain AI"] },
  { serviceId: "SVC-009", name: "Architecture Review", provider: "Operations", consumer: "Engineering", inputs: ["ADR"], outputs: ["Decision"], serviceLevels: "Cycle ≤ 10 days", dependencies: ["ARB", "Brain AI"] },
  { serviceId: "SVC-010", name: "Knowledge Management", provider: "Operations", consumer: "All entities + enterprises", inputs: ["Draft"], outputs: ["Versioned artifact"], serviceLevels: "Publish ≤ 3 days post-approval", dependencies: ["Knowledge base", "Brain AI"] },
  { serviceId: "SVC-011", name: "Training", provider: "Advisory", consumer: "All entities + partners", inputs: ["Training need"], outputs: ["Certified participants"], serviceLevels: "Per training calendar", dependencies: ["Knowledge base"] },
  { serviceId: "SVC-012", name: "Customer Success", provider: "Operations", consumer: "Enterprises", inputs: ["Support request"], outputs: ["Resolution"], serviceLevels: "First response ≤ 4h, resolution ≤ 2 business days", dependencies: ["Brain AI", "Knowledge base"] },
];

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 5 — ENTERPRISE CAPABILITY MAP
// ═══════════════════════════════════════════════════════════════

export type Capability = {
  capabilityId: string;
  name: string;
  domain: string;
  owner: string;
  currentMaturity: 1 | 2 | 3 | 4 | 5;
  targetMaturity: 1 | 2 | 3 | 4 | 5;
  dependencies: string[];
  roadmap: string;
  strategicImportance: "Critical" | "High" | "Medium" | "Supporting";
};

export const CAPABILITY_MAP: Capability[] = [
  { capabilityId: "CAP-01", name: "Governance", domain: "Govern", owner: "Holding Group", currentMaturity: 4, targetMaturity: 5, dependencies: ["Constitutional Council"], roadmap: "Activate Constitutional Council at 50+ employees", strategicImportance: "Critical" },
  { capabilityId: "CAP-02", name: "Engineering", domain: "Operate", owner: "Operations", currentMaturity: 4, targetMaturity: 5, dependencies: ["CRE", "CI/CD"], roadmap: "Platform engineering guild; internal platform", strategicImportance: "Critical" },
  { capabilityId: "CAP-03", name: "Cloud Infrastructure", domain: "Operate", owner: "Operations", currentMaturity: 3, targetMaturity: 5, dependencies: ["Vendor"], roadmap: "Multi-region; cost optimization", strategicImportance: "Critical" },
  { capabilityId: "CAP-04", name: "Brain AI", domain: "Operate", owner: "Operations", currentMaturity: 4, targetMaturity: 5, dependencies: ["5 providers"], roadmap: "Continuous learning; consensus tuning", strategicImportance: "Critical" },
  { capabilityId: "CAP-05", name: "CRE", domain: "Operate", owner: "Operations", currentMaturity: 5, targetMaturity: 5, dependencies: ["Ed25519"], roadmap: "Maintain; expand policy library", strategicImportance: "Critical" },
  { capabilityId: "CAP-06", name: "Legal Coordination", domain: "Support", owner: "Holding Group", currentMaturity: 3, targetMaturity: 5, dependencies: ["Law firm network"], roadmap: "Expand law firm network; in-house counsel at 50+ employees", strategicImportance: "High" },
  { capabilityId: "CAP-07", name: "Risk Management", domain: "Govern", owner: "Risk Committee", currentMaturity: 3, targetMaturity: 5, dependencies: ["Risk register"], roadmap: "Quantitative risk modeling; KRIs", strategicImportance: "Critical" },
  { capabilityId: "CAP-08", name: "Compliance", domain: "Govern", owner: "Compliance Committee", currentMaturity: 3, targetMaturity: 5, dependencies: ["Frameworks"], roadmap: "SOC 2 Q2 2027, ISO 27001 Q4 2027", strategicImportance: "Critical" },
  { capabilityId: "CAP-09", name: "Finance Operations", domain: "Operate", owner: "Operations", currentMaturity: 3, targetMaturity: 5, dependencies: ["Accounting network"], roadmap: "CFO at 30+ employees; FP&A", strategicImportance: "High" },
  { capabilityId: "CAP-10", name: "Partner Ecosystem", domain: "Advise", owner: "Advisory", currentMaturity: 3, targetMaturity: 5, dependencies: ["Partner CRM"], roadmap: "Expand across regions; partner success program", strategicImportance: "Critical" },
  { capabilityId: "CAP-11", name: "Government Relations", domain: "Advise", owner: "Advisory", currentMaturity: 2, targetMaturity: 5, dependencies: ["Advisory team"], roadmap: "Dedicated GR lead; regional coverage", strategicImportance: "High" },
  { capabilityId: "CAP-12", name: "Marketing & Brand", domain: "Support", owner: "Operations", currentMaturity: 2, targetMaturity: 4, dependencies: ["Brand"], roadmap: "CMO at 30+ employees; content engine", strategicImportance: "Medium" },
  { capabilityId: "CAP-13", name: "Training", domain: "Support", owner: "Advisory", currentMaturity: 2, targetMaturity: 4, dependencies: ["Knowledge base"], roadmap: "Academy; certification programs", strategicImportance: "Medium" },
  { capabilityId: "CAP-14", name: "Knowledge Management", domain: "Support", owner: "Operations", currentMaturity: 3, targetMaturity: 5, dependencies: ["Brain AI"], roadmap: "Institutional Memory Engine; taxonomy v2", strategicImportance: "High" },
  { capabilityId: "CAP-15", name: "Innovation", domain: "Improve", owner: "All entities", currentMaturity: 2, targetMaturity: 4, dependencies: ["Brain AI"], roadmap: "Innovation lab; quarterly hackathons", strategicImportance: "Medium" },
  { capabilityId: "CAP-16", name: "Security", domain: "Govern", owner: "Security Committee", currentMaturity: 2, targetMaturity: 5, dependencies: ["NIST CSF"], roadmap: "CISO at 20+ employees; SOC", strategicImportance: "Critical" },
  { capabilityId: "CAP-17", name: "Architecture", domain: "Govern", owner: "ARB", currentMaturity: 4, targetMaturity: 5, dependencies: ["ADR registry"], roadmap: "Enterprise architecture framework", strategicImportance: "Critical" },
  { capabilityId: "CAP-18", name: "Operations", domain: "Operate", owner: "Operations", currentMaturity: 3, targetMaturity: 5, dependencies: ["Process library"], roadmap: "AOS v1.0 → continuous optimization", strategicImportance: "Critical" },
  { capabilityId: "CAP-19", name: "Customer Success", domain: "Operate", owner: "Operations", currentMaturity: 2, targetMaturity: 4, dependencies: ["Brain AI"], roadmap: "CS team; success plays", strategicImportance: "High" },
  { capabilityId: "CAP-20", name: "Business Continuity", domain: "Govern", owner: "Risk Committee", currentMaturity: 2, targetMaturity: 4, dependencies: ["BCP/DR"], roadmap: "ISO 22301 Q2 2028; annual testing", strategicImportance: "Critical" },
];

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 6 — OPERATING METRICS (KPIs)
// ═══════════════════════════════════════════════════════════════

export type OperatingKpi = {
  kpiId: string;
  name: string;
  category: "Delivery" | "Onboarding" | "AI" | "CRE" | "Support" | "Knowledge" | "Efficiency" | "Satisfaction";
  definition: string;
  target: string;
  current: string;
  owner: string;
  cadence: string;
};

export const OPERATING_KPIS: OperatingKpi[] = [
  { kpiId: "KPI-01", name: "Lead Time (Spec→Ship)", category: "Delivery", definition: "Median time from spec approval to production deploy", target: "≤ 10 days", current: "14 days", owner: "Operations", cadence: "Bi-weekly" },
  { kpiId: "KPI-02", name: "Cycle Time (PR open→merge)", category: "Delivery", definition: "Median PR cycle time", target: "≤ 2 days", current: "3 days", owner: "Operations", cadence: "Weekly" },
  { kpiId: "KPI-03", name: "Deployment Frequency", category: "Delivery", definition: "Production deploys per week", target: "≥ 3/week", current: "2/week", owner: "Operations", cadence: "Weekly" },
  { kpiId: "KPI-04", name: "Change Failure Rate", category: "Delivery", definition: "% of deploys causing incident", target: "< 5%", current: "8%", owner: "Operations", cadence: "Monthly" },
  { kpiId: "KPI-05", name: "Partner Onboarding Time", category: "Onboarding", definition: "Median partner onboarding cycle", target: "≤ 30 days", current: "35 days", owner: "Advisory", cadence: "Monthly" },
  { kpiId: "KPI-06", name: "Enterprise Onboarding Time", category: "Onboarding", definition: "Median enterprise onboarding cycle", target: "≤ 5 business days", current: "6 days", owner: "Operations", cadence: "Monthly" },
  { kpiId: "KPI-07", name: "AI Response Quality", category: "AI", definition: "Consensus rate + hallucination inverse", target: "≥ 95%", current: "92%", owner: "Operations", cadence: "Weekly" },
  { kpiId: "KPI-08", name: "AI Hallucination Rate", category: "AI", definition: "% of responses flagged hallucination", target: "< 1%", current: "1.5%", owner: "AI Ethics Committee", cadence: "Weekly" },
  { kpiId: "KPI-09", name: "CRE Execution Time", category: "CRE", definition: "Median enforcement latency", target: "< 50ms", current: "35ms", owner: "Operations", cadence: "Continuous" },
  { kpiId: "KPI-10", name: "Ledger Integrity", category: "CRE", definition: "verifyLedgerChain() pass rate", target: "100%", current: "100%", owner: "Operations", cadence: "Daily" },
  { kpiId: "KPI-11", name: "Support First Response", category: "Support", definition: "Median first response time", target: "≤ 4h", current: "5h", owner: "Operations", cadence: "Weekly" },
  { kpiId: "KPI-12", name: "Support Resolution", category: "Support", definition: "Median resolution time", target: "≤ 2 business days", current: "3 days", owner: "Operations", cadence: "Weekly" },
  { kpiId: "KPI-13", name: "Knowledge Freshness", category: "Knowledge", definition: "% docs reviewed in last 90 days", target: "≥ 90%", current: "70%", owner: "Operations", cadence: "Monthly" },
  { kpiId: "KPI-14", name: "Documentation Coverage", category: "Knowledge", definition: "% processes with SOP", target: "100%", current: "65%", owner: "Operations", cadence: "Monthly" },
  { kpiId: "KPI-15", name: "Automation Percentage", category: "Efficiency", definition: "% processes automated or autonomous", target: "≥ 70%", current: "45%", owner: "Operations", cadence: "Quarterly" },
  { kpiId: "KPI-16", name: "Operational Efficiency", category: "Efficiency", definition: "Throughput per FTE", target: "+15% YoY", current: "baseline", owner: "COO", cadence: "Quarterly" },
  { kpiId: "KPI-17", name: "Employee Productivity", category: "Efficiency", definition: "Output per FTE (indexed)", target: "+10% YoY", current: "baseline", owner: "COO", cadence: "Quarterly" },
  { kpiId: "KPI-18", name: "Customer Satisfaction (CSAT)", category: "Satisfaction", definition: "Enterprise CSAT score", target: "≥ 4.5/5", current: "4.1/5", owner: "Operations", cadence: "Monthly" },
  { kpiId: "KPI-19", name: "Partner Satisfaction", category: "Satisfaction", definition: "Partner NPS", target: "≥ 50", current: "35", owner: "Advisory", cadence: "Quarterly" },
  { kpiId: "KPI-20", name: "MTTR (Sev1)", category: "Delivery", definition: "Mean time to restore Sev1 incidents", target: "≤ 4h", current: "5h", owner: "Operations", cadence: "Per incident" },
];

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 7 — OPERATIONAL DASHBOARDS (designs)
// ═══════════════════════════════════════════════════════════════

export type DashboardSpec = {
  dashboardId: string;
  audience: string;
  purpose: string;
  widgets: string[];
  refresh: string;
};

export const OPERATIONAL_DASHBOARDS: DashboardSpec[] = [
  { dashboardId: "DASH-01", audience: "Founder", purpose: "Single cockpit for the entire institution", widgets: ["Continuous Readiness Score", "Institutional KPIs (14)", "Risk register summary", "Financial summary", "Graduation pipeline", "Brain AI health", "Mission Control"], refresh: "Real-time" },
  { dashboardId: "DASH-02", audience: "Holding Group", purpose: "Governance, IP, capital allocation oversight", widgets: ["Committee status", "Delegation matrix", "Risk register", "Audit findings", "IP portfolio", "Financial sustainability"], refresh: "Daily" },
  { dashboardId: "DASH-03", audience: "Operations", purpose: "Engineering + operations command", widgets: ["Delivery KPIs", "Deployment frequency", "Incident board", "CRE health", "Brain AI health", "Capability maturity"], refresh: "Real-time" },
  { dashboardId: "DASH-04", audience: "Advisory", purpose: "Partner ecosystem & government relations", widgets: ["Partner pipeline", "Partner SLA", "Certification queue", "Government engagements", "Ecosystem health"], refresh: "Daily" },
  { dashboardId: "DASH-05", audience: "Department Heads", purpose: "Departmental execution", widgets: ["Department KPIs", "Team capacity", "Backlog", "Quality metrics", "Hiring plan"], refresh: "Daily" },
  { dashboardId: "DASH-06", audience: "Country Managers", purpose: "Regional execution", widgets: ["Regional enterprises", "Regional partners", "Regulatory status", "Local KPIs"], refresh: "Daily" },
  { dashboardId: "DASH-07", audience: "Regional Directors", purpose: "Multi-country oversight", widgets: ["Regional rollup", "Cross-country benchmarks", "Risk heatmap"], refresh: "Daily" },
  { dashboardId: "DASH-08", audience: "Future Board", purpose: "Board governance view", widgets: ["Strategy progress", "Risk", "Financials", "Compliance", "Audit", "Constitutional amendments"], refresh: "Monthly" },
  { dashboardId: "DASH-09", audience: "Future Investors", purpose: "Institutional investor relations", widgets: ["Growth metrics", "Financial performance", "Graduation rate", "Market expansion", "ESG"], refresh: "Quarterly" },
  { dashboardId: "DASH-10", audience: "Executive Mission Control", purpose: "Constitutional command center combining all", widgets: ["All governance", "All operations", "All risk", "All finance", "All partnerships", "All technology", "All performance"], refresh: "Real-time" },
];

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 8 — ENTERPRISE KNOWLEDGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export const KNOWLEDGE_MANAGEMENT = {
  taxonomy: [
    "Constitutional (charters, amendments, council minutes)",
    "Governance (manual, delegation matrix, committee charters)",
    "Operations (SOPs, process library, runbooks)",
    "Engineering (ADRs, RFCs, architecture, code docs)",
    "AI (Brain AI artifacts, prompts, evaluations)",
    "Risk (register, KRIs, postmortems)",
    "Compliance (frameworks, evidence, audit reports)",
    "Legal (contracts, opinions, regulatory)",
    "Finance (statements, reconciliations, budgets)",
    "Partner (MSAs, SLAs, due diligence)",
    "Knowledge (this taxonomy, training material)",
    "Innovation (research, experiments, hackathons)",
  ],
  documentOwnership: "Every document has a single accountable owner (DRI) and a review cadence.",
  approvalWorkflow: "Draft → Peer review → Brain AI indexing → Owner approval → Publish → Version tag → Review calendar.",
  versioning: "Semantic versioning for policies and SOPs (MAJOR.MINOR.PATCH). Immutable version history with hash. Superseded versions archived but never deleted.",
  archiving: "Superseded documents archived with retention per data governance (10 years default, indefinite for ledger/constitutional).",
  search: "Brain AI semantic indexing across all knowledge artifacts. Full-text + semantic + metadata search.",
  aiIndexing: "Brain AI indexes every approved document for semantic retrieval. Embeddings refreshed on publish.",
  retention: "10 years default. Indefinite for constitutional, ledger, audit, legal. PDPL-aligned deletion for personal data on request.",
  reviewCycles: "Constitutional: annual. Governance: annual. SOPs: annual or on process change. Technical docs: on change. Knowledge: 90-day freshness target.",
};

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 9 — CONTINUOUS IMPROVEMENT SYSTEM
// ═══════════════════════════════════════════════════════════════

export const CONTINUOUS_IMPROVEMENT = {
  principles: [
    "Lean: eliminate waste (muda), unevenness (mura), overburden (muri).",
    "Kaizen: small, continuous improvements by everyone, every day.",
    "Six Sigma: reduce variation and defects (DMAIC).",
    "Respect for people: those who do the work improve the work.",
    "Genchi genbutsu: go and see for yourself.",
    "Constitutional alignment: improvements must never weaken constitutional controls.",
  ],
  practices: [
    { practice: "Lessons Learned", cadence: "Per project/milestone", owner: "Project lead" },
    { practice: "Postmortems", cadence: "Per incident (within 48h)", owner: "Incident commander" },
    { practice: "Retrospectives", cadence: "Per sprint", owner: "Eng lead" },
    { practice: "Root Cause Analysis (5 Whys + Fishbone)", cadence: "On defect/incident", owner: "Quality" },
    { practice: "Corrective Actions (CAPA)", cadence: "On finding", owner: "Finding owner" },
    { practice: "Preventive Actions", cadence: "On risk identified", owner: "Risk owner" },
    { practice: "Improvement Backlog", cadence: "Continuous", owner: "COO" },
    { practice: "Operational Excellence Review", cadence: "Quarterly", owner: "COO" },
    { practice: "Kaizen Events", cadence: "Quarterly", owner: "Department heads" },
    { practice: "Value Stream Mapping", cadence: "Annual per value stream", owner: "Operations" },
  ],
  improvementBacklog: "A single prioritized backlog of improvement items with owner, impact, effort, and constitutional-impact assessment. Reviewed weekly by COO.",
  qualityAssurance: "Every process has defined quality criteria. Brain AI samples outputs and flags deviations. Quarterly QA audit by Audit Committee.",
};

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 10 — ORGANIZATIONAL DESIGN
// ═══════════════════════════════════════════════════════════════

export type FutureRole = {
  roleId: string;
  title: string;
  reportsTo: string;
  activatesAt: string; // trigger for creating the role
  responsibilities: string;
  spanOfControl: string;
};

export const FUTURE_ROLES: FutureRole[] = [
  { roleId: "ROLE-01", title: "Chief Operating Officer (COO)", reportsTo: "Founder", activatesAt: "10+ employees", responsibilities: "Day-to-day operations, process execution, AOS ownership", spanOfControl: "All operations functions" },
  { roleId: "ROLE-02", title: "Chief Technology Officer (CTO)", reportsTo: "Founder", activatesAt: "15+ engineers (or AURIENTA Technologies spin-out)", responsibilities: "Technology strategy, architecture, engineering", spanOfControl: "Engineering, architecture, cloud" },
  { roleId: "ROLE-03", title: "Chief Financial Officer (CFO)", reportsTo: "Founder", activatesAt: "30+ employees", responsibilities: "Finance, FP&A, audit liaison", spanOfControl: "Finance function" },
  { roleId: "ROLE-04", title: "Chief Risk Officer (CRO)", reportsTo: "Founder", activatesAt: "20+ employees", responsibilities: "Risk, compliance, BCP", spanOfControl: "Risk, compliance, security" },
  { roleId: "ROLE-05", title: "Chief Information Security Officer (CISO)", reportsTo: "CRO", activatesAt: "20+ employees", responsibilities: "Cybersecurity, SOC", spanOfControl: "Security function" },
  { roleId: "ROLE-06", title: "Chief Marketing Officer (CMO)", reportsTo: "COO", activatesAt: "30+ employees", responsibilities: "Brand, marketing, sales", spanOfControl: "Marketing, sales" },
  { roleId: "ROLE-07", title: "Chief People Officer (CPO)", reportsTo: "COO", activatesAt: "25+ employees", responsibilities: "HR, talent, culture", spanOfControl: "HR function" },
  { roleId: "ROLE-08", title: "Advisory Director", reportsTo: "Founder", activatesAt: "Now (designate)", responsibilities: "Advisory entity, partnerships, government relations", spanOfControl: "Advisory entity" },
  { roleId: "ROLE-09", title: "General Counsel", reportsTo: "Founder", activatesAt: "30+ employees", responsibilities: "Legal, contracts, regulatory", spanOfControl: "Legal function" },
  { roleId: "ROLE-10", title: "Head of Customer Success", reportsTo: "COO", activatesAt: "20+ employees", responsibilities: "Enterprise success, support, graduation", spanOfControl: "CS function" },
  { roleId: "ROLE-11", title: "Head of Knowledge", reportsTo: "COO", activatesAt: "15+ employees", responsibilities: "Knowledge management, documentation, training", spanOfControl: "Knowledge function" },
  { roleId: "ROLE-12", title: "Regional Directors (Egypt, GCC, Africa, Europe, Asia, Americas)", reportsTo: "COO", activatesAt: "Per regional expansion", responsibilities: "Regional operations, partners, government relations", spanOfControl: "Regional teams" },
];

export const CAREER_LADDER = {
  engineering: ["IC1 Engineer", "IC2 Engineer", "IC3 Senior Engineer", "IC4 Staff Engineer", "IC5 Principal Engineer", "Distinguished Engineer"],
  management: ["Lead", "Manager", "Senior Manager", "Director", "Senior Director", "VP", "C-suite"],
  individual: ["Associate", "Specialist", "Senior Specialist", "Expert", "Principal"],
};

export const SUCCESSION_PLAN = {
  founder: "Founder → COO (operations) + Advisory Director (advisory) + Holding Group Chair (governance). Emergency: COO assumes operations if Founder unavailable 72+ hours.",
  coo: "COO → Senior Director of Operations or VP Engineering (interim).",
  cto: "CTO → Principal Engineer or VP Engineering (interim).",
  cfo: "CFO → Finance Director (interim).",
};

export const COMPETENCY_FRAMEWORK = {
  leadership: ["Constitutional judgment", "Strategic thinking", "People leadership", "Decision quality", "Executive presence"],
  functional: ["Domain expertise", "Analytical thinking", "Process design", "Quality orientation"],
  institutional: ["Constitutional literacy", "Risk awareness", "Compliance mindset", "Stewardship"],
  behavioral: ["Integrity", "Collaboration", "Adaptability", "Continuous learning"],
};

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 11 — ENTERPRISE PLANNING SYSTEM
// ═══════════════════════════════════════════════════════════════

export const PLANNING_SYSTEM = {
  annualPlanning: "Annual strategic planning cycle (Q4). Founder-led. Produces 3-year strategy refresh + annual plan + annual OKRs + budget envelope. Approved by Founder.",
  quarterlyOkrs: "Quarterly OKR cycle. Department OKRs cascade from annual. Reviewed monthly, reset quarterly. Brain AI assists with trend analysis.",
  monthlyReviews: "Monthly business reviews (MBR). Department heads present KPIs, risks, decisions needed. COO chairs.",
  capacityPlanning: "Quarterly capacity planning. Maps demand (roadmap + partner commitments) to supply (FTEs + partners + automation). Identifies hiring + automation triggers.",
  resourcePlanning: "Resource allocation tied to OKRs. Founder approves major reallocations. COO manages within-department.",
  roadmapPlanning: "Quarterly roadmap planning. Operations owns technology roadmap. Advisory owns ecosystem roadmap. Holding owns strategic roadmap.",
  budgetPlanning: "Annual budget + quarterly reforecast. Zero-based for new initiatives. Founder approves > 1M EGP.",
  strategicPlanning: "3-year rolling strategy. Annual refresh. Scenario planning (3 scenarios). Brain AI assists.",
  scenarioPlanning: "Three scenarios annually: base, upside, downside. Each with triggers, responses, and financial model.",
};

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 12 — BUSINESS PERFORMANCE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export type Scorecard = {
  perspective: string;
  objectives: string[];
  measures: string[];
  targets: string[];
};

export const BALANCED_SCORECARD: Scorecard[] = [
  { perspective: "Financial", objectives: ["Sustainable unit economics", "Revenue growth", "Cost discipline"], measures: ["Gross margin", "Revenue growth %", "Cost per enterprise"], targets: ["> 60%", "+25% YoY", "↓ 10% YoY"] },
  { perspective: "Customer (Enterprise)", objectives: ["Enterprise success", "Graduation readiness", "Satisfaction"], measures: ["Graduation rate", "Avg readiness score", "CSAT"], targets: ["> 20%/yr", "> 75", "> 4.5/5"] },
  { perspective: "Internal Process", objectives: ["Operational excellence", "Compliance", "Innovation"], measures: ["Lead time", "Audit findings", "Automation %"], targets: ["≤ 10 days", "0 critical", "> 70%"] },
  { perspective: "Learning & Growth", objectives: ["Talent development", "Knowledge freshness", "Constitutional literacy"], measures: ["Training completion", "Doc freshness", "Constitutional assessment"], targets: ["100%", "> 90%", "> 95% pass"] },
  { perspective: "Constitutional (AURIENTA-specific)", objectives: ["Constitutional integrity", "Zero custody", "Transparency"], measures: ["CRE enforcement %", "Custody violations", "Transparency coverage"], targets: ["100%", "0", "100%"] },
];

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 13 — OPERATIONAL EXCELLENCE FRAMEWORK
// ═══════════════════════════════════════════════════════════════

export const OPERATIONAL_EXCELLENCE = {
  principles: [
    "Constitutional Supremacy: Excellence never overrides constitutional controls.",
    "Customer (Enterprise) Value: Every process must create value for enterprises.",
    "Standardization then Improvement: Standardize work, then improve the standard.",
    "Data-Driven: Decisions based on evidence, not opinion.",
    "Respect for People: Operators improve their own work.",
    "Continuous Flow: Eliminate handoff delays and rework.",
    "Built-in Quality: Quality at the source, not inspection at the end.",
    "Pull over Push: Work pulled by demand, not pushed by capacity.",
  ],
  wasteReduction: [
    "Defects (CRE violations, rework)",
    "Overproduction (features no one uses)",
    "Waiting (handoff delays)",
    "Non-utilized talent (Brain AI underused)",
    "Transportation (unnecessary data movement)",
    "Inventory (stale knowledge, idle capital)",
    "Motion (context switching)",
    "Excess processing (over-engineering)",
  ],
  standardization: "Every recurring activity has an SOP. SOPs are versioned. Deviations require documented exception.",
  qualityAssurance: "In-process quality checks via CRE + Brain AI sampling. Quarterly QA audit.",
  automationStrategy: "Automate deterministic, high-volume, error-prone tasks first. Use Brain AI for judgment tasks with human review. Never automate constitutional decisions.",
  continuousOptimization: "Quarterly value stream reviews. Kaizen events. Improvement backlog prioritized by impact/effort.",
  operationalResilience: "BCP/DR tested annually. Oracle Mirror for constitutional continuity. Graceful degradation for AI. CRE deterministic restart.",
};

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 17 — ENTERPRISE PROCESS SIMULATION
// ═══════════════════════════════════════════════════════════════
// End-to-end lifecycle: Founder creates enterprise → ... → strategic partner.

export type SimulationStep = {
  step: number;
  phase: string;
  actor: string;
  action: string;
  system: string;
  control: string;
  evidence: string;
  timing: string;
};

export const ENTERPRISE_LIFECYCLE_SIMULATION: SimulationStep[] = [
  { step: 1, phase: "Creation", actor: "Founder", action: "Creates enterprise application", system: "Onboarding portal", control: "CRE-POL-001 Identity", evidence: "Application record", timing: "Day 0" },
  { step: 2, phase: "Creation", actor: "Operations", action: "Validates identity anchor", system: "CRE", control: "CRE-POL-001", evidence: "Anchor hash", timing: "Day 0" },
  { step: 3, phase: "Creation", actor: "Brain AI", action: "Risk & sector review", system: "Brain AI", control: "AI Ethics", evidence: "AI artifact", timing: "Day 0-1" },
  { step: 4, phase: "Creation", actor: "Advisory + Law Firm", action: "Law firm assigned; Law Firm Client Account opened", system: "Partner CRM", control: "Amendment IX", evidence: "Account confirmation", timing: "Day 1-2" },
  { step: 5, phase: "Charter", actor: "Operations + Founder/Operator", action: "Charter drafted & signed", system: "Charter editor", control: "CRE-POL-004", evidence: "Charter hash", timing: "Day 2-3" },
  { step: 6, phase: "Charter", actor: "CRE", action: "Charter ratified; ledger genesis", system: "CRE", control: "CRE-POL-015", evidence: "Genesis block", timing: "Day 3" },
  { step: 7, phase: "Capital Formation", actor: "Capital Partners", action: "Request participation", system: "Portal", control: "CRE-POL-002 Eligibility", evidence: "Request log", timing: "Day 3+" },
  { step: 8, phase: "Capital Formation", actor: "CRE", action: "CPP calc & ±5% enforcement", system: "CRE", control: "CRE-POL-005", evidence: "Price record", timing: "Day 3+" },
  { step: 9, phase: "Capital Formation", actor: "Capital Partner → Law Firm", action: "Capital to Law Firm Client Account", system: "Banking", control: "CRE-POL-003 Zero Custody", evidence: "Law firm receipt", timing: "Day 3+" },
  { step: 10, phase: "Capital Formation", actor: "CRE", action: "Equity Units issued; ledger append", system: "CRE + Ownership Ledger", control: "CRE-POL-009 Transparency", evidence: "Ledger hash", timing: "Day 3+" },
  { step: 11, phase: "Operations", actor: "Operations + Enterprise", action: "Milestone execution; milestone votes", system: "CRE", control: "CRE-POL-010 Quorum", evidence: "Vote records", timing: "Months 1-N" },
  { step: 12, phase: "Milestone Funding", actor: "Constitutional Council / Founder", action: "Milestone approved; funding released", system: "CRE", control: "CRE-POL-011 Milestone", evidence: "Release record", timing: "Per milestone" },
  { step: 13, phase: "Graduation", actor: "CRE", action: "Readiness score ≥ 90", system: "CRE", control: "CRE-POL-014", evidence: "Readiness report", timing: "Year N" },
  { step: 14, phase: "Graduation", actor: "Constitutional Council", action: "Ratifies graduation", system: "Governance", control: "Council ratification", evidence: "Council minutes", timing: "Year N" },
  { step: 15, phase: "Graduation", actor: "Operations", action: "Final settlement; ledger freeze; alumni onboarding", system: "CRE + Ownership Ledger", control: "CRE-POL-014", evidence: "Frozen ledger hash", timing: "Year N" },
  { step: 16, phase: "Alumni", actor: "Operations + Alumni", action: "Alumni relations; CAaaS eligibility", system: "Alumni registry", control: "Alumni control", evidence: "Alumni record", timing: "Year N+" },
  { step: 17, phase: "CAaaS", actor: "Graduated Enterprise", action: "Applies for CAaaS certification", system: "Advisory portal", control: "Certification control", evidence: "Application", timing: "Year N+" },
  { step: 18, phase: "CAaaS", actor: "Advisory + Audit Committee", action: "Compliance audit; certification decision", system: "Brain AI + CRE", control: "Audit oversight", evidence: "Audit report + certificate", timing: "Year N+" },
  { step: 19, phase: "Strategic Partner", actor: "Advisory", action: "Strategic partner certification", system: "Partner CRM", control: "Partner accreditation", evidence: "Partner record", timing: "Year N+" },
  { step: 20, phase: "Strategic Partner", actor: "Partner + AURIENTA", action: "Ongoing partnership; ecosystem contribution", system: "All", control: "Partner SLA", evidence: "Engagement records", timing: "Ongoing" },
];

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 18 — OPERATIONAL MATURITY ASSESSMENT
// ═══════════════════════════════════════════════════════════════

export type MaturityAssessment = {
  framework: string;
  capability: string;
  currentLevel: number; // 1-5
  targetLevel: number;
  gap: string;
  threeYearRoadmap: string;
  fiveYearRoadmap: string;
};

export const OPERATIONAL_MATURITY: MaturityAssessment[] = [
  { framework: "APQC", capability: "Process Classification", currentLevel: 3, targetLevel: 5, gap: "L3-L5: partial process library → full L0-L3 mapped + measured", threeYearRoadmap: "Complete L0-L3 map; SOPs for 100% processes; process mining", fiveYearRoadmap: "Real-time process analytics; predictive process optimization" },
  { framework: "Lean Enterprise", capability: "Flow & Waste Reduction", currentLevel: 2, targetLevel: 5, gap: "L2-L5: identify waste → systematic elimination + pull", threeYearRoadmap: "Value stream maps for top 10 processes; Kaizen program", fiveYearRoadmap: "Continuous flow; < 1 day lead time end-to-end" },
  { framework: "High-Performance Organization", capability: "Execution Discipline", currentLevel: 3, targetLevel: 5, gap: "L3-L5: defined cadence → data-driven execution culture", threeYearRoadmap: "MBR + QBR discipline; OKR maturity; scorecards live", fiveYearRoadmap: "Self-managing teams; autonomous execution within constitutional bounds" },
  { framework: "McKinsey Operating Model", capability: "Operating Model Coherence", currentLevel: 3, targetLevel: 5, gap: "L3-L5: documented model → fully coherent + continuously tested", threeYearRoadmap: "AOS v1.0 institutionalized; org design v1; capability heat map live", fiveYearRoadmap: "Operating model tested via digital twin; structural redesign avoided" },
  { framework: "Deloitte Operational Excellence", capability: "Excellence System", currentLevel: 2, targetLevel: 5, gap: "L2-L5: pockets of excellence → enterprise excellence system", threeYearRoadmap: "OpEx framework adopted; improvement backlog live; QA program", fiveYearRoadmap: "Excellence culture; zero-defect constitutional operations" },
];

export const MATURITY_GAP_ANALYSIS = {
  currentAverage: 2.6,
  targetAverage: 5.0,
  biggestGaps: ["Lean flow (L2)", "OpEx system (L2)", "Process mining (L3)"],
  priorityInvestments: [
    "Process library completion + SOP coverage (L3→L4)",
    "Value stream mapping program (L2→L4)",
    "MBR/QBR discipline + scorecards (L3→L4)",
    "Improvement backlog + Kaizen (L2→L4)",
    "Digital twin pilot (L1→L3)",
  ],
};

// ═══════════════════════════════════════════════════════════════
// ADDITIONAL RECOMMENDATION 1 — ENTERPRISE PROCESS REPOSITORY (EPR)
// ═══════════════════════════════════════════════════════════════
// Canonical repository where every process, SOP, policy, and workflow
// has a unique identifier, owner, version, dependencies, and approval
// history. The PROCESS_LIBRARY + SOP_LIBRARY + IDs above ARE the EPR.
// In production, this is persisted in a Prisma-backed table with
// versioning, dependency graph, and approval workflow.

export const EPR = {
  description: "Canonical repository of every process, SOP, policy, and workflow. Each artifact has a unique ID (PRC-###, SOP-###), owner, semantic version, dependencies, and approval history.",
  identifierScheme: "PRC-### (process) | SOP-### (SOP) | POL-### (CRE policy) | SVC-### (service) | CAP-## (capability) | ADR-### (architecture decision) | KPI-## (metric) | DASH-## (dashboard)",
  versioning: "Semantic versioning (MAJOR.MINOR.PATCH). Immutable history. Superseded versions archived.",
  dependencyGraph: "Each artifact lists dependencies on other artifacts. Changes propagate via impact analysis (Brain AI assists).",
  approvalWorkflow: "Draft → Peer review → Brain AI impact analysis → Owner approval → Version → Publish → Notify stakeholders.",
  search: "Brain AI semantic search across all EPR artifacts.",
  coverage: {
    processes: PROCESS_LIBRARY.length,
    sops: SOP_LIBRARY.length,
    services: SERVICE_CATALOG.length,
    capabilities: CAPABILITY_MAP.length,
    kpis: OPERATING_KPIS.length,
    dashboards: OPERATIONAL_DASHBOARDS.length,
  },
};

// ═══════════════════════════════════════════════════════════════
// ADDITIONAL RECOMMENDATION 2 — BUSINESS CAPABILITY HEAT MAP
// ═══════════════════════════════════════════════════════════════

export type CapabilityHeatCell = {
  capability: string;
  maturity: number;     // 1-5
  risk: "Low" | "Medium" | "High";
  strategicImportance: "Critical" | "High" | "Medium" | "Supporting";
  investmentPriority: "P0" | "P1" | "P2" | "P3";
};

export const CAPABILITY_HEAT_MAP: CapabilityHeatCell[] = CAPABILITY_MAP.map(c => {
  const risk = c.currentMaturity <= 2 ? "High" : c.currentMaturity === 3 ? "Medium" : "Low";
  const investmentPriority: CapabilityHeatCell["investmentPriority"] =
    c.strategicImportance === "Critical" && c.currentMaturity <= 3 ? "P0" :
    c.strategicImportance === "Critical" ? "P1" :
    c.strategicImportance === "High" && c.currentMaturity <= 3 ? "P1" :
    c.strategicImportance === "High" ? "P2" : "P3";
  return {
    capability: c.name,
    maturity: c.currentMaturity,
    risk: risk as CapabilityHeatCell["risk"],
    strategicImportance: c.strategicImportance,
    investmentPriority,
  };
});

// ═══════════════════════════════════════════════════════════════
// ADDITIONAL RECOMMENDATION 3 — OPERATIONAL DIGITAL TWIN
// ═══════════════════════════════════════════════════════════════

export const DIGITAL_TWIN = {
  purpose: "Simulate end-to-end business operations BEFORE deploying process changes, allowing AURIENTA to test organizational changes safely.",
  model: "Each process is a node; each handoff an edge. Brain AI simulates demand, capacity, cycle time, and control points. Outputs: predicted lead time, bottleneck, risk, control coverage.",
  inputs: ["Process library (nodes/edges)", "Demand scenarios", "Capacity model", "CRE policy set", "Historical metrics"],
  outputs: ["Predicted cycle time", "Bottleneck identification", "Risk exposure", "Control coverage", "What-if comparisons"],
  useCases: [
    "Test process changes before deployment",
    "Capacity planning under demand scenarios",
    "Identify single points of failure",
    "Test BCP/DR scenarios without disruption",
    "Evaluate automation ROI",
  ],
  currentMaturity: 1,
  targetMaturity: 3,
  roadmap: "Year 1: model top 5 processes. Year 2: full process library. Year 3: real-time twin with live data feed.",
};

// ═══════════════════════════════════════════════════════════════
// ADDITIONAL RECOMMENDATION 4 — INSTITUTIONAL MEMORY ENGINE
// ═══════════════════════════════════════════════════════════════

export const INSTITUTIONAL_MEMORY_ENGINE = {
  purpose: "Extend Brain AI so every approved decision, lesson learned, ADR, policy change, audit finding, and operational improvement becomes searchable institutional memory.",
  sources: [
    "ADRs (architecture decisions)",
    "Postmortems & lessons learned",
    "Audit findings & corrective actions",
    "Policy changes & version history",
    "Operational improvements",
    "Council & committee minutes",
    "Brain AI artifacts",
    "CRE ledger entries (selective)",
  ],
  indexing: "Brain AI semantic indexing + metadata (date, owner, type, status). Searchable by natural language.",
  query: "Constitutional Partners can ask: 'What did we decide about X last year?' or 'What were the lessons from incident Y?' and Brain AI retrieves institutional memory.",
  retention: "Indefinite for decisions, ADRs, postmortems, audit findings, policy history. 10 years for general artifacts.",
  access: "Role-based. Sensitive items (personnel, legal) restricted. Audit trail on every query.",
};

// ═══════════════════════════════════════════════════════════════
// ADDITIONAL RECOMMENDATION 5 — EXECUTIVE MISSION CONTROL CENTER
// ═══════════════════════════════════════════════════════════════

export const MISSION_CONTROL = {
  purpose: "Single executive cockpit combining governance, operations, risk, finance, partnerships, technology, and enterprise performance into one constitutional command dashboard.",
  audience: "Founder (now), executives + future Board (later)",
  panels: [
    "Constitutional: charter status, amendments, council, ledger integrity, CRE enforcement",
    "Governance: committees, delegation, decisions pending/approved",
    "Operations: delivery KPIs, incident board, capacity, automation %",
    "Risk: register, KRIs, residual risk, BCP/DR status",
    "Finance: sustainability, close status, reconciliations, budget",
    "Partnerships: pipeline, SLA, certifications, government engagements",
    "Technology: Brain AI health, CRE health, deployments, security posture",
    "Performance: balanced scorecard, OKRs, capability maturity heat map",
    "Mission: graduation pipeline, alumni, strategic partners, ecosystem health",
  ],
  refresh: "Real-time (except board/investor panels: monthly/quarterly)",
  alerts: "Constitutional violations → immediate. Risk threshold breaches → immediate. KPI misses → daily. Audit findings → on creation.",
  access: "Founder + COO + CRO (full). Other executives: their domains. Board: board panel. Investors: investor panel.",
};

// ═══════════════════════════════════════════════════════════════
// CROSS-REFERENCE INTEGRITY
// ═══════════════════════════════════════════════════════════════
// Verifies the AOS is internally consistent and synchronized with
// the institutional architecture, governance, and risk systems.

export const AOS_SYNCHRONIZATION = {
  terminologyCompliance: "All process, SOP, service, capability, and KPI names use approved constitutional terminology (Capital Partner, Equity Units, Law Firm Client Account, Constitutional Partner, etc.). No forbidden terms.",
  institutionalArchitectureAlignment: "Every owner field references one of: Holding Group, Operations, Advisory, a committee, Constitutional Council, or Founder. No orphan ownership.",
  governanceAlignment: "Escalation paths respect the delegation-of-authority matrix from Constitution v1.0. Committee references match the 11 committees.",
  riskAlignment: "Process controls reference CRE policies (CRE-POL-001..015) and enterprise controls. No process operates outside the control framework.",
  blueprintAlignment: "AOS v1.0 is the canonical operations layer referenced by the blueprint. No contradictions permitted.",
  scalability: "Designed to scale from Founder-only (now) → 10 → 100 → 1,000 → 10,000 employees without structural redesign. Role activation triggers define when each executive role is created.",
};
