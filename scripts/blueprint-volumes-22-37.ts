// AURIENTA Expanded Master Blueprint v2.0 — Content module (Volumes 22-37)
// Loads all institutional system exports and converts them to docx paragraphs/tables.
import {
  P, H2, H3, H4, Bullet, Quote, PLead, HorizontalRule,
  makeTable, recordsTable, kvTable, cell,
  GOLD, NEAR_BLACK, GRAY_TEXT,
} from "./blueprint-helpers";
import type { Paragraph, Table } from "docx";

import {
  GOVERNANCE_VERSION, GOVERNANCE_FROZEN_AT,
  GOVERNANCE_MANUAL, DELEGATION_OF_AUTHORITY, COMMITTEES,
  CONSTITUTIONAL_COUNCIL, FOUNDER_DEPENDENCY_PLAN,
  RISK_REGISTER, INTERNAL_CONTROLS, OPERATING_RHYTHM,
  CORPORATE_KPIS, CHANGE_MANAGEMENT,
} from "../src/lib/aurienta/institutional-governance";
import {
  ENTERPRISE_RISK_REGISTER, ENTERPRISE_CONTROLS, THREE_LINES_OF_DEFENSE,
  INTERNAL_AUDIT_FRAMEWORK, CYBERSECURITY_FRAMEWORK, COMPLIANCE_FRAMEWORK,
  BCP_DR, AI_GOVERNANCE, DATA_GOVERNANCE, CERTIFICATION_ROADMAP,
  MATURITY_MODEL, CONTINUOUS_READINESS, ADR_TEMPLATE,
} from "../src/lib/aurienta/enterprise-risk-security";
import {
  AOS_VERSION, AOS_FROZEN_AT, LEVEL_0_DOMAINS, LEVEL_1_GROUPS,
  LEVEL_2_PROCESSES, LEVEL_3_ACTIVITIES, PROCESS_LIBRARY, SOP_LIBRARY,
  SERVICE_CATALOG, CAPABILITY_MAP, OPERATING_KPIS, OPERATIONAL_DASHBOARDS,
  KNOWLEDGE_MANAGEMENT, CONTINUOUS_IMPROVEMENT, FUTURE_ROLES, CAREER_LADDER,
  SUCCESSION_PLAN, COMPETENCY_FRAMEWORK, PLANNING_SYSTEM, BALANCED_SCORECARD,
  OPERATIONAL_EXCELLENCE, ENTERPRISE_LIFECYCLE_SIMULATION, OPERATIONAL_MATURITY,
  MATURITY_GAP_ANALYSIS, EPR, CAPABILITY_HEAT_MAP, DIGITAL_TWIN,
  INSTITUTIONAL_MEMORY_ENGINE, MISSION_CONTROL, AOS_SYNCHRONIZATION,
} from "../src/lib/aurienta/operating-system";
import {
  ACS_VERSION, ACS_FROZEN_AT, COMMERCIAL_ORGANIZATION, COMMERCIAL_FUNNEL,
  SALES_PLAYBOOKS, CUSTOMER_JOURNEY, PARTNER_LIFECYCLE, GOVERNMENT_FRAMEWORK,
  PRICING_ARCHITECTURE, PRICING_CONSTRAINTS, COMMERCIAL_KPIS, GLOBAL_EXPANSION,
  INSTITUTIONAL_BRAND, COMPETITIVE_POSITIONING, COMPETITIVE_MOAT,
  COMMERCIAL_RISK_REGISTER, DUE_DILIGENCE_PACKS, COMMERCIAL_DASHBOARDS,
  COO_FRAMEWORKS, COMMERCIALIZATION_READINESS, GAP_ANALYSIS,
  EXECUTIVE_CERTIFICATION, ACS_SYNCHRONIZATION,
} from "../src/lib/aurienta/commercialization-system";
import {
  PH_VERSION, PH_FROZEN_AT, WS1_DATABASE, WS2_SECURITY, WS3_DEVSECOPS,
  WS4_OBSERVABILITY, WS5_IDENTITY, WS6_QUALITY, WS7_PERFORMANCE, WS8_OPS,
  WS9_COMPLIANCE, WS10_DOCS, WS11_PILOT, WS12_TECH_DEBT, WORKSTREAM_SCORES,
  OVERALL_READINESS_SCORE, OVERALL_READINESS_TARGET, PRODUCTION_READINESS_REPORT,
  ENTERPRISE_SECURITY_REPORT, PERFORMANCE_BENCHMARK, SOC2_READINESS,
  ISO27001_READINESS, GO_LIVE_CHECKLIST, REMAINING_GAPS, EXECUTIVE_CERTIFICATION_PH,
  ROADMAP_FORWARD, PH_SYNCHRONIZATION,
} from "../src/lib/aurienta/production-readiness";
import {
  PE_VERSION, PE_FROZEN_AT, PILOT_PMO, PILOT_SELECTION_CRITERIA,
  PILOT_SELECTION_MODEL, ONBOARDING_FACTORY, ONBOARDING_METRICS,
  PILOT_SUCCESS_KPIS, CUSTOMER_SUCCESS_OPS, FEEDBACK_CHANNELS, FEEDBACK_LOOP,
  STRATEGIC_PARTNER_EXECUTION, REGULATORY_ENGAGEMENT, REGULATOR_RELATIONSHIP_DASHBOARD,
  EVIDENCE_REPOSITORY, EVIDENCE_PROPERTIES, PILOT_MISSION_CONTROL,
  PILOT_COMPLETION_CRITERIA, PILOT_COMPLETION_RULE, READINESS_REASSESSMENT,
  PILOT_EXECUTION_REPORT, PILOT_SUCCESS_FRAMEWORK, CUSTOMER_SUCCESS_REPORT,
  STRATEGIC_PARTNERSHIP_REPORT, REGULATORY_ENGAGEMENT_REPORT,
  INSTITUTIONAL_EVIDENCE_REPORT, LESSONS_LEARNED_REPORT,
  EXECUTIVE_READINESS_ASSESSMENT, UPDATED_READINESS_SCORE,
  EXECUTIVE_CERTIFICATION_PE, COO_ROADMAP_EXECUTION, PE_SYNCHRONIZATION,
} from "../src/lib/aurienta/pilot-execution";
import {
  GLS_VERSION, GLS_FROZEN_AT, COUNTRY_READINESS_DIMENSIONS,
  GLOBAL_EXPANSION_SEQUENCE, STRATEGIC_PARTNER_TYPES, PARTNERSHIP_LIFECYCLE,
  GOVERNMENT_STAKEHOLDERS, GOV_ENGAGEMENT_PLAYBOOK_TEMPLATE, INSTITUTIONAL_SALES,
  INSTITUTIONAL_SALES_STAGES, EXPANSION_OFFICE, ALLIANCE_INSTRUMENTS,
  INSTITUTIONAL_COMMS, MESSAGING_HIERARCHY, GLOBAL_EVENTS, CERTIFICATION_ROADMAP as GLS_CERTS,
  DD_CENTER, TRUST_CENTER, GLOBAL_DEPLOYMENT_DASHBOARD, COO_RECOMMENDATIONS_GL,
  EXECUTIVE_CERTIFICATION_GLS, GLS_SYNCHRONIZATION,
} from "../src/lib/aurienta/global-launch";
import {
  FOCC_VERSION, FOCC_FROZEN_AT, FOUNDER_OFFICE, ENTERPRISE_PMO,
  DECISION_RECORD_SCHEMA, DECISION_INTELLIGENCE, MISSION_CONTROL_PANELS,
  EXECUTIVE_BRIEFINGS, CORPORATE_INTELLIGENCE, INTELLIGENCE_ASSESSMENT,
  KNOWLEDGE_GRAPH_ENTITIES, KNOWLEDGE_GRAPH_PROPERTIES, EXECUTIVE_WORKFLOWS,
  INSTITUTIONAL_MEMORY, INSTITUTIONAL_MEMORY_PROPERTIES, CEO_PERFORMANCE_DASHBOARD,
  OVERALL_INSTITUTIONAL_HEALTH, COO_RECOMMENDATIONS_FO,
  EXECUTIVE_CERTIFICATION_FOCC, FOCC_SYNCHRONIZATION,
} from "../src/lib/aurienta/founder-office";
import {
  ITDB_VERSION, ITDB_FROZEN_AT, DATA_ROOM, DOCUMENT_METADATA, BOARD_MANAGEMENT,
  BOARD_NOTE, DD_AUTOMATION, DD_AUTOMATION_PROPERTIES, TRUST_CLAIMS,
  EVIDENCE_ENGINE, EXECUTIVE_REPORTS, REPORTING_PROPERTIES,
  INSTITUTIONAL_SCORECARDS, INSTITUTIONAL_TRUST_INDEX, EXTERNAL_AUDIT_CENTER,
  AUDIT_TRACKING, ASSURANCE_FRAMEWORK, TRANSPARENCY_PORTAL, TRANSPARENCY_PRINCIPLE,
  BOARD_COMMAND_DASHBOARD, COO_RECOMMENDATIONS_IT, EXECUTIVE_CERTIFICATION_ITDB,
  COO_POST_ITDB_ROADMAP, ITDB_SYNCHRONIZATION,
} from "../src/lib/aurienta/institutional-trust";
import {
  MES_VERSION, MES_FROZEN_AT, EXECUTION_INTEGRITY_RULE, EXECUTION_STATUS_REGISTER,
  IDEAL_CUSTOMER_PROFILE, ANCHOR_QUALIFICATION_MODEL, QUALIFICATION_RULE,
  TARGET_ACCOUNT_SCHEMA, TARGET_ACCOUNT_RULE, TARGET_ACCOUNT_COUNT,
  TARGET_TIERS, SALES_PIPELINE, PIPELINE_RULE, PIPELINE_OPPORTUNITY_COUNT,
  PRICING_VALIDATION_RULE, COMMERCIAL_OFFER_VALIDATION, REVENUE_VALIDATION,
  REVENUE_RULE, PARTNER_EXECUTION, PARTNER_RULE, LAW_FIRM_CRITERIA,
  LAW_FIRM_PIPELINE, LAW_FIRM_RULE, REGULATORY_ENGAGEMENT_EXECUTION,
  REGULATORY_TERMINOLOGY_RULE, PILOT_EXECUTION_FRAMEWORK,
} from "../src/lib/aurienta/market-execution";
import {
  MAS_VERSION, MAS_FROZEN_AT, FACTUAL_BASELINE, TARGET_ACCOUNT_ENGINE,
  TARGET_ENGINE_RULE, TARGETS_ENTERED, TARGET_SEGMENTATION, CAPACITY_RULE,
  SOURCING_METHODOLOGY, EGYPT_MARKET_FOCUS, FIRST_25_PROCESS, FIRST_25_RULE,
  OUTREACH_WORKFLOW, OUTREACH_SENT, OUTREACH_QUALITY, DISCOVERY_SYSTEM,
  PROBLEM_VALIDATION, FIRST_CUSTOMER_OFFER, PILOT_CONVERSION, REVENUE_CLASSIFICATION,
  REVENUE_RULE, RELATIONSHIP_MAP_SCHEMA, RELATIONSHIP_STRENGTH_SCALE,
  RELATIONSHIP_RULE, RELATIONSHIPS_RECORDED, INTRODUCTION_ENGINE, DAILY_COMMAND,
  CONVERSION_FUNNEL, FUNNEL_RULE, WEEKLY_REVIEW, WEEKLY_REVIEW_RULE,
  MARKET_LEARNING_LOOP, LOST_DEAL_REASONS, LOST_DEAL_RULE, EVIDENCE_HIERARCHY,
  EVIDENCE_HIERARCHY_RULE, BRAIN_AI_MARKET_AGENT, WEEKLY_EXECUTION_TARGETS,
  WEEKLY_TARGET_RULE, FOUNDER_TIME_ALLOCATION, TIME_ALLOCATION_RULE,
  FIRST_CUSTOMER_STANDARD, FIRST_PARTNER_STANDARD, REGULATORY_ACTIVATION,
  REGULATORY_STATUS_LANGUAGE, REGULATORY_LANGUAGE_RULE, DATA_INTEGRITY,
  HONEST_CERTIFICATION, COO_DIRECTIVE, MAS_SYNCHRONIZATION,
} from "../src/lib/aurienta/market-activation";
import {
  CPR_VERSION, CPR_FROZEN_AT, CURRENT_BASELINE, EVIDENCE_HIERARCHY_CPR,
  INVALID_PROMOTION_EXAMPLES, PROMOTION_RULE, CUSTOMER_CONVERSION_WORKFLOW,
  CONVERSION_OPPORTUNITIES, PROBLEM_VALIDATION_STRENGTHENED, PROBLEM_VALIDATION_RULE,
  QUALIFICATION_GATE_CRITERIA, QUALIFICATION_GATE, COMMERCIAL_OFFER_STATES,
  COMMERCIAL_OFFER_RULE, PILOT_REQUIREMENTS, PILOT_RULE, PILOT_SUCCESS_PACKAGE,
  PILOT_SUCCESS_RULE, REVENUE_TRACKING, REVENUE_CRITICAL_RULE,
  REVENUE_EVIDENCE_CHAIN, OUTCOME_ENGINE, OUTCOME_METRICS,
  REFERENCE_RULE as CPR_REFERENCE_RULE, LOST_OPPORTUNITY_REASONS,
  LOST_DEAL_RULE_CPR, CUSTOMER_EVIDENCE_EVENTS, EVIDENCE_RECORD_FIELDS,
  EVIDENCE_LEDGER_RULE, FOUNDER_EXECUTION_SCORE, EXECUTION_SCORE_RULE,
  CURRENT_EXECUTION_SCORE, WEEKLY_COO_REVIEW, WEEKLY_REVIEW_RULE as CPR_WEEKLY_REVIEW_RULE,
  VALIDATION_GATES_CPR, GATE_RULE_CPR, BRAIN_AI_CONVERSION_AGENT,
  CLAIM_CONTROL_MATRIX, CLAIM_CONTROL_RULE, FOUNDER_DAILY_PRIORITIES,
  HONEST_CERTIFICATION_CPR, FINAL_COO_PRINCIPLE, CPR_SYNCHRONIZATION,
} from "../src/lib/aurienta/customer-conversion";
import {
  SPRRE_VERSION, SPRRE_FROZEN_AT, CURRENT_BASELINE_SPRRE, PARTNER_CATEGORIES,
  PARTNER_CATEGORY_RULE, PARTNER_TARGET_SCHEMA, PARTNER_SCHEMA_RULE,
  PARTNER_SCORING_DIMENSIONS, PARTNER_SCORING_MODEL, LAW_FIRM_CAMPAIGN_SCHEMA,
  LAW_FIRM_CAMPAIGN, PARTNER_OUTREACH_SCHEMA, PARTNER_OUTREACH_LIFECYCLE,
  OUTREACH_RULE, INTRODUCTION_PATHS, INTRODUCTION_ENGINE_SPRRE,
  REGULATORY_AUTHORITY_SCHEMA, EGYPT_AUTHORITY_UNIVERSE, REGULATORY_ENGINE_RULE,
  REGULATORY_STATUSES, REGULATORY_STATUS_RULE, REGULATORY_BRIEF_SECTIONS,
  REGULATORY_BRIEF_RULE, RELATIONSHIP_GRAPH_ENTITIES, RELATIONSHIP_GRAPH_EDGES,
  RELATIONSHIP_GRAPH_QUERIES, RELATIONSHIP_GRAPH_RULE, PARTNERSHIP_VALUE_TYPES,
  VALUE_CHAIN_RULE, PARTNER_DD_CHECKS, PARTNER_DD_RULE, AGREEMENT_TYPES,
  AGREEMENT_STATE_DISTINCTIONS, AGREEMENT_RULE, PARTNER_ACTIVATION_REQUIREMENTS,
  ACTIVATION_RULE, PARTNER_PERFORMANCE_METRICS, PERFORMANCE_RULE, DEPENDENCY_MAP,
  FOUNDER_DAILY_COMMAND_SPRRE, WEEKLY_REVIEW_SPRRE, WEEKLY_REVIEW_RULE as SPRRE_WEEKLY_REVIEW_RULE,
  EXECUTION_FUNNEL_SPRRE, FUNNEL_RULE as SPRRE_FUNNEL_RULE, BRAIN_AI_INSTITUTIONAL_AGENT,
  CLAIM_CONTROL_SPRRE, CLAIM_CONTROL_RULE as SPRRE_CLAIM_CONTROL_RULE,
  EXECUTION_SCORE_SPRRE, OVERALL_EXECUTION_SCORE,
  SCORE_RULE as SPRRE_SCORE_RULE, THIRTY_DAY_PLAN, PLAN_RULE,
  HONEST_CERTIFICATION_SPRRE, FINAL_COO_DIRECTIVE_SPRRE, SPRRE_SYNCHRONIZATION,
} from "../src/lib/aurienta/strategic-partners";
import {
  FIEW_VERSION, FIEW_FROZEN_AT, FOUNDER_IDENTITY, FIEW_BASELINE,
  WAR_ROOM_QUESTIONS, ACTION_RANKING_FORMULA, ACTION_FIELDS, CUSTOMER_SCOREBOARD,
  PARTNER_SCOREBOARD, REGULATORY_SCOREBOARD, THIRTY_DAY_WEEKLY_PLAN,
  WEEKLY_RULE, FOUNDER_TIME_ALLOCATION as FIEW_TIME, TIME_RULE, BLOCKER_FIELDS,
  BLOCKER_SEVERITY, TOP_5_BLOCKERS_RULE, ACTIVITY_VS_OUTCOME, OBJECTION_FIELDS,
  OBJECTION_FREQUENCY, OBJECTION_RULE, PRODUCT_CHANGE_FLOW, PRODUCT_CHANGE_RULE,
  COMMERCIAL_TRUTH_MODEL, PARTNER_TRUTH_MODEL, REGULATORY_TRUTH_MODEL,
  EVIDENCE_EVENTS, EVIDENCE_RECORD_FIELDS, EVIDENCE_RULE, BRAIN_AI_EXECUTION_COS,
  FOUNDER_EXECUTION_SCORE_FIEW, OVERALL_EXECUTION_SCORE_FIEW, SCORE_RULE_FIEW,
  SUCCESS_CRITERIA, SUCCESS_RULE, DAY_30_REVIEW, HONEST_CERTIFICATION_FIEW,
  FINAL_COO_DIRECTIVE_FIEW, FIEW_SYNCHRONIZATION,
} from "../src/lib/aurienta/execution-war-room";
import {
  RESEARCH_DATE, RESEARCHER, RESEARCH_EVIDENCE_LEVEL, RESEARCH_DISCLAIMER,
  FIRST_25_TARGETS, LAW_FIRM_CANDIDATES, REGULATORY_RESEARCH_RESULTS,
  FIRST_5_OUTREACH_DRAFTS, EXECUTION_REPORT, FINAL_HONEST_STATEMENT,
} from "../src/lib/aurienta/first-25-research";
import {
  AUDIT_DATE, CONSTITUTIONAL_ALIGNMENT_SCORE, ALIGNMENT_BREAKDOWN,
  VISION_PRESERVATION_SCORE, VISION_FINDINGS, DRIFT_SCORE, DRIFT_FINDINGS,
  CONSTITUTIONAL_INTEGRITY, INTEGRITY_FINDINGS, CORE_GAPS, DRIFT_DETAILED,
  PRESERVED_CORE, MISSING_CORE, COMMERCIALIZATION_DRIFT, ENTERPRISE_LIFECYCLE,
  GRADUATION_INTEGRITY, TERMINOLOGY_INTEGRITY, BRAIN_AI_ALIGNMENT,
  DO_NOT_CHANGE_LIST, EXECUTION_ONLY_LIST, FINAL_DECISION,
  FEATURE_PRESERVATION_MATRIX,
} from "../src/lib/aurienta/constitutional-audit";

type Block = Paragraph | Table;

// ───────────────────────────────────────────────────────────────────
// VOLUME 22 — INSTITUTIONAL GOVERNANCE v1.0
// ───────────────────────────────────────────────────────────────────
export function vol22(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 22 — Institutional Governance v1.0"));
  out.push(P([
    `Constitution version: ${GOVERNANCE_VERSION} (frozen ${GOVERNANCE_FROZEN_AT}). `,
    `This volume is the single source of truth for AURIENTA's corporate governance, operating model, and management system. `,
    `It is FROZEN as Constitution v1.0 — all future changes must follow the formal change-management process (§15.1) with versioning, impact assessments, approval records, and immutable audit trails.`,
  ]));
  out.push(P("Source: src/lib/aurienta/institutional-governance.ts (359 lines)."));

  out.push(H3("22.1 Mission, Vision & Purpose"));
  const m: any = GOVERNANCE_MANUAL;
  out.push(PLead("Mission", m.mission));
  out.push(PLead("Vision", m.vision));
  out.push(PLead("Purpose", m.purpose));

  out.push(H3("22.2 Governing Principles"));
  out.push(P("The following ten governing principles form the constitutional backbone of the institution:"));
  for (const p of m.governingPrinciples) out.push(Bullet(p));

  out.push(H3("22.3 Decision Hierarchy (8 Levels)"));
  out.push(makeTable(
    ["Level", "Authority", "Override Boundary"],
    (m.decisionHierarchy as any[]).map((d) => [String(d.level), d.authority, d.override]),
    { widths: [10, 50, 40], zebra: true }
  ));

  out.push(H3("22.4 Institutional Ethics Code"));
  out.push(PLead("Principle", m.institutionalEthics.principle));
  for (const c of m.institutionalEthics.code) out.push(Bullet(c));

  out.push(H3("22.5 Conflict-of-Interest Policy"));
  out.push(PLead("Disclosure", m.conflictOfInterestPolicy.disclosure));
  out.push(PLead("Recusal", m.conflictOfInterestPolicy.recusal));
  out.push(PLead("Register", m.conflictOfInterestPolicy.register));

  out.push(H3("22.6 Anti-Corruption Framework"));
  out.push(PLead("Zero Tolerance", m.antiCorruptionFramework.zeroTolerance));
  out.push(PLead("Reporting", m.antiCorruptionFramework.reporting));
  out.push(PLead("Investigation", m.antiCorruptionFramework.investigation));
  out.push(PLead("Consequences", m.antiCorruptionFramework.consequences));

  out.push(H3("22.7 Whistleblower Policy"));
  out.push(PLead("Channel", m.whistleblowerPolicy.channel));
  out.push(PLead("Protection", m.whistleblowerPolicy.protection));
  out.push(PLead("Investigation", m.whistleblowerPolicy.investigation));
  out.push(PLead("Reward", m.whistleblowerPolicy.reward));

  out.push(H3("22.8 Policy Lifecycle"));
  out.push(PLead("Stages", (m.policyLifecycle.stages as any[]).join(" → ")));
  out.push(PLead("Approval Authority", m.policyLifecycle.approvalAuthority));
  out.push(PLead("Versioning", m.policyLifecycle.versioning));
  out.push(PLead("Audit Trail", m.policyLifecycle.auditTrail));
  out.push(PLead("Review Cycle", m.governanceReviewCycle));

  out.push(H3("22.9 Delegation of Authority Matrix (22 Decision Types)"));
  out.push(P("Every constitutional, operational, financial, and strategic decision type carries an explicit RACI assignment, approval threshold, escalation trigger, emergency override, and constitutional override. The full matrix is reproduced below."));
  out.push(recordsTable(
    DELEGATION_OF_AUTHORITY as any[],
    [
      ["Decision", (r) => r.decision],
      ["Responsible", (r) => r.responsible],
      ["Accountable", (r) => r.accountable],
      ["Consulted", (r) => r.consulted],
      ["Informed", (r) => r.informed],
      ["Approval Threshold", (r) => r.approvalThreshold],
      ["Escalation Trigger", (r) => r.escalationTrigger],
      ["Emergency Override", (r) => r.emergencyOverride],
      ["Constitutional Override", (r) => r.constitutionalOverride],
    ],
    { widths: [14, 9, 9, 9, 9, 14, 12, 12, 12], zebra: true }
  ));

  out.push(H3("22.10 Executive Committee Structure (11 Committees)"));
  out.push(P("All committees are active now with the Founder as chair until executives are formally appointed. Each committee has a defined purpose, chair, member roster, voting rules, quorum, meeting frequency, and escalation path."));
  out.push(recordsTable(
    COMMITTEES,
    [
      ["Committee", (c) => c.name],
      ["Purpose", (c) => c.purpose],
      ["Chair", (c) => c.chair],
      ["Members", (c) => c.members.join("; ")],
      ["Voting Rules", (c) => c.votingRules],
      ["Quorum", (c) => c.quorum],
      ["Frequency", (c) => c.meetingFrequency],
      ["Escalation", (c) => c.escalationPath],
      ["Active Now", (c) => (c.activeNow ? "Yes" : "No")],
    ],
    { widths: [13, 16, 8, 18, 12, 8, 9, 11, 5], zebra: true }
  ));

  out.push(H3("22.11 Constitutional Council (Future)"));
  const cc: any = CONSTITUTIONAL_COUNCIL;
  out.push(PLead("Status", cc.status));
  out.push(P("Responsibilities of the Constitutional Council once activated:"));
  for (const r of cc.responsibilities) out.push(Bullet(r));
  out.push(H4("Membership"));
  out.push(PLead("Size", String(cc.membership.size)));
  out.push(PLead("Composition", cc.membership.composition));
  out.push(PLead("Selection", cc.membership.selection));
  out.push(PLead("Rotation", cc.membership.rotation));
  out.push(PLead("Removal", cc.membership.removal));
  out.push(PLead("Chair", cc.membership.chair));
  out.push(PLead("Deadlock Handling", cc.deadlockHandling));
  out.push(PLead("Emergency Powers", cc.emergencyPowers));
  out.push(PLead("Relationship with Founder", cc.relationshipWithFounder));
  out.push(PLead("Activation Trigger", cc.activationTrigger));

  out.push(H3("22.12 Founder Dependency Reduction Plan"));
  const fp: any = FOUNDER_DEPENDENCY_PLAN;
  out.push(H4("Current Founder Responsibilities"));
  for (const r of fp.currentFounderResponsibilities) out.push(Bullet(r));
  out.push(H4("Delegation Timeline (5 Phases)"));
  out.push(recordsTable(
    fp.delegationTimeline as any[],
    [
      ["Phase", (p) => p.phase],
      ["Delegation", (p) => p.delegation],
      ["Outcome", (p) => p.outcome],
    ],
    { widths: [18, 50, 32], zebra: true }
  ));
  out.push(H4("Emergency Succession"));
  out.push(PLead("Trigger", fp.emergencySuccession.trigger));
  out.push(PLead("Immediate Actions", fp.emergencySuccession.immediateActions));
  out.push(PLead("Constitutional Authority", fp.emergencySuccession.constitutionalAuthority));
  out.push(PLead("Key-Person Insurance", fp.emergencySuccession.keyPersonInsurance));
  out.push(PLead("Communication Plan", fp.emergencySuccession.communicationPlan));
  out.push(H4("Knowledge Transfer"));
  out.push(PLead("Documentation", fp.knowledgeTransfer.documentation));
  out.push(PLead("Runbooks", fp.knowledgeTransfer.runbooks));
  out.push(PLead("Institutional Memory", fp.knowledgeTransfer.institutionalMemory));
  out.push(PLead("Cross-Training", fp.knowledgeTransfer.crossTraining));

  out.push(H3("22.13 Enterprise Risk Register (13 Risks)"));
  out.push(P("Risks are reviewed monthly by the Risk Committee. Each entry has likelihood, impact, owner, mitigation, early-warning indicators, and recovery actions."));
  out.push(recordsTable(
    RISK_REGISTER,
    [
      ["Category", (r) => r.category],
      ["Risk", (r) => r.risk],
      ["Likelihood", (r) => r.likelihood],
      ["Impact", (r) => r.impact],
      ["Owner", (r) => r.owner],
      ["Mitigation", (r) => r.mitigation],
      ["Early Warning", (r) => r.earlyWarning],
      ["Recovery", (r) => r.recovery],
    ],
    { widths: [9, 16, 8, 8, 10, 18, 14, 17], zebra: true }
  ));

  out.push(H3("22.14 Internal Control Framework (10 Controls)"));
  out.push(recordsTable(
    INTERNAL_CONTROLS,
    [
      ["Control", (c) => c.control],
      ["Type", (c) => c.type],
      ["Enforced By", (c) => c.enforcedBy],
      ["Frequency", (c) => c.frequency],
      ["Evidence", (c) => c.evidence],
    ],
    { widths: [25, 12, 22, 18, 23], zebra: true }
  ));

  out.push(H3("22.15 Operating Rhythm (13 Cadences)"));
  out.push(recordsTable(
    OPERATING_RHYTHM,
    [
      ["Cadence", (c) => c.cadence],
      ["Activity", (c) => c.activity],
      ["Attendees", (c) => c.attendees],
      ["Duration", (c) => c.duration],
    ],
    { widths: [12, 36, 32, 20], zebra: true }
  ));

  out.push(H3("22.16 Corporate KPIs (14 Indicators)"));
  out.push(recordsTable(
    CORPORATE_KPIS,
    [
      ["KPI", (k) => k.kpi],
      ["Target", (k) => k.target],
      ["Measurement", (k) => k.measurement],
      ["Audience", (k) => k.audience],
    ],
    { widths: [22, 18, 32, 28], zebra: true }
  ));

  out.push(H3("22.17 Change Management (Constitution v1.0 Freeze)"));
  const cm: any = CHANGE_MANAGEMENT;
  out.push(PLead("Version", cm.version));
  out.push(PLead("Frozen At", cm.frozenAt));
  out.push(PLead("Principle", cm.principle));
  out.push(H4("Change-Management Process"));
  for (const step of cm.process) out.push(Bullet(step));
  out.push(PLead("Rollback Plan", cm.rollbackPlan));
  out.push(H4("Versioning Policy"));
  out.push(PLead("Major", cm.versioning.major));
  out.push(PLead("Minor", cm.versioning.minor));
  out.push(PLead("Patch", cm.versioning.patch));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 23 — ENTERPRISE RISK, SECURITY & COMPLIANCE
// ───────────────────────────────────────────────────────────────────
export function vol23(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 23 — Enterprise Risk, Security & Compliance"));
  out.push(P([
    `Aligned with NIST CSF 2.0, ISO 27001, ISO 22301, ISO 31000, ISO 42001 (AI), SOC 2, CIS Controls, and OWASP ASVS. `,
    `Source: src/lib/aurienta/enterprise-risk-security.ts (305 lines).`,
  ]));

  out.push(H3("23.1 Enterprise Risk Register v2.0 (28 Risks)"));
  out.push(P("Each risk carries likelihood, impact, velocity (speed of onset), early-warning signals, mitigation, residual risk, recovery plan, risk appetite, and board reporting cadence."));
  out.push(recordsTable(
    ENTERPRISE_RISK_REGISTER,
    [
      ["ID", (r) => r.id],
      ["Category", (r) => r.category],
      ["Risk", (r) => r.risk],
      ["Owner", (r) => r.owner],
      ["Likelihood", (r) => r.likelihood],
      ["Impact", (r) => r.impact],
      ["Velocity", (r) => r.velocity],
      ["Mitigation", (r) => r.mitigation],
      ["Residual", (r) => r.residualRisk],
      ["Recovery", (r) => r.recoveryPlan],
      ["Appetite", (r) => r.riskAppetite],
      ["Board Rpt", (r) => r.boardReporting],
    ],
    { widths: [5, 7, 14, 8, 6, 6, 6, 16, 6, 12, 6, 8], zebra: true }
  ));

  out.push(H3("23.2 Enterprise Control Framework (30 Controls)"));
  out.push(P("Controls span 22 domains: financial, technology, engineering, deployment, AI, data, partners, legal, compliance, operations, brand, IP, cloud, cybersecurity, identity, access, change management, source code, production releases, secrets, backups, vendor onboarding, audit logging, evidence retention, government, business continuity."));
  out.push(recordsTable(
    ENTERPRISE_CONTROLS,
    [
      ["ID", (c) => c.id],
      ["Domain", (c) => c.domain],
      ["Control", (c) => c.control],
      ["Owner", (c) => c.owner],
      ["Frequency", (c) => c.frequency],
      ["Evidence", (c) => c.evidence],
      ["Automation", (c) => c.automation],
      ["Testing", (c) => c.testingProcedure],
      ["Failure Response", (c) => c.failureResponse],
    ],
    { widths: [5, 9, 16, 9, 8, 11, 8, 17, 17], zebra: true }
  ));

  out.push(H3("23.3 Three Lines of Defense"));
  const tl: any = THREE_LINES_OF_DEFENSE;
  out.push(P("The three lines of defense model assigns risk ownership, oversight, and independent assurance to distinct organizational layers."));
  out.push(recordsTable(
    [
      { line: tl.firstLine?.name ?? "First Line", entities: cell(tl.firstLine?.entities), responsibilities: cell(tl.firstLine?.responsibilities) },
      { line: tl.secondLine?.name ?? "Second Line", entities: cell(tl.secondLine?.entities), responsibilities: cell(tl.secondLine?.responsibilities) },
      { line: tl.thirdLine?.name ?? "Third Line", entities: cell(tl.thirdLine?.entities), responsibilities: cell(tl.thirdLine?.responsibilities) },
    ],
    [
      ["Line", (l) => l.line],
      ["Entities", (l) => l.entities],
      ["Responsibilities", (l) => l.responsibilities],
    ],
    { widths: [25, 30, 45], zebra: true }
  ));

  out.push(H3("23.4 Internal Audit Framework"));
  out.push(kvTable(INTERNAL_AUDIT_FRAMEWORK as any, { widths: [25, 75], zebra: true }));

  out.push(H3("23.5 Cybersecurity Framework (NIST CSF 2.0 + ISO 27001 + CIS)"));
  const cf: any = CYBERSECURITY_FRAMEWORK;
  out.push(PLead("Standard", cf.standard));
  out.push(PLead("Current Maturity", String(cf.currentMaturity)));
  out.push(PLead("Target Maturity", String(cf.targetMaturity)));
  out.push(H4("Functions"));
  out.push(kvTable(cf.functions as any, { widths: [20, 80], zebra: true, keyHeader: "Function", valueHeader: "Controls" }));

  out.push(H3("23.6 Compliance Framework"));
  out.push(recordsTable(
    COMPLIANCE_FRAMEWORK as any[],
    [
      ["Framework", (c) => c.framework],
      ["Applicable Controls", (c) => c.applicableControls],
      ["Current Level", (c) => String(c.currentMaturity)],
      ["Target Level", (c) => String(c.targetMaturity)],
      ["Evidence", (c) => c.evidence],
      ["Gap", (c) => c.gap],
    ],
    { widths: [16, 22, 8, 8, 22, 24], zebra: true }
  ));

  out.push(H3("23.7 Business Continuity & Disaster Recovery"));
  out.push(kvTable(BCP_DR as any, { widths: [25, 75], zebra: true }));

  out.push(H3("23.8 AI Governance Framework"));
  out.push(kvTable(AI_GOVERNANCE as any, { widths: [25, 75], zebra: true }));

  out.push(H3("23.9 Data Governance"));
  const dg: any = DATA_GOVERNANCE;
  out.push(H4("Classification Levels"));
  out.push(recordsTable(
    (dg.classification as any[]) ?? [],
    [
      ["Level", (c) => c.level],
      ["Examples", (c) => c.examples],
      ["Encryption", (c) => c.encryption],
      ["Access", (c) => c.access],
    ],
    { widths: [15, 35, 25, 25], zebra: true }
  ));
  out.push(H4("Retention & Residency"));
  out.push(kvTable({ retention: dg.retention, residency: dg.residency, crossBorder: dg.crossBorder } as any, { widths: [25, 75], zebra: true }));

  out.push(H3("23.10 Certification Roadmap"));
  out.push(recordsTable(
    CERTIFICATION_ROADMAP as any[],
    [
      ["Certification", (c) => c.certification],
      ["Target Date", (c) => c.targetDate],
      ["Effort", (c) => c.effort ?? "—"],
      ["Dependencies", (c) => cell((c as any).dependencies)],
      ["Current", (c) => String(c.currentMaturity)],
      ["Target", (c) => String(c.targetMaturity)],
    ],
    { widths: [18, 12, 18, 30, 11, 11], zebra: true }
  ));

  out.push(H3("23.11 Operational Maturity Model"));
  out.push(recordsTable(
    MATURITY_MODEL as any[],
    [
      ["Capability", (m) => m.capability],
      ["Current", (m) => String(m.currentLevel)],
      ["Target", (m) => String(m.targetLevel)],
      ["Roadmap", (m) => m.roadmap],
    ],
    { widths: [20, 8, 8, 64], zebra: true }
  ));

  out.push(H3("23.12 Continuous Readiness Score"));
  const cr: any = CONTINUOUS_READINESS;
  out.push(PLead("Overall Score", `${cr.overallScore}/100`));
  out.push(PLead("Target Score", `${cr.targetScore}/100`));
  out.push(PLead("Scoring Methodology", cr.scoringMethodology));
  out.push(H4("Sub-Scores"));
  out.push(kvTable(cr.subScores as any, { widths: [50, 50], zebra: true, keyHeader: "Dimension", valueHeader: "Score" }));

  out.push(H3("23.13 Architecture Decision Records (ADR Template)"));
  const at: any = ADR_TEMPLATE;
  out.push(PLead("Format", at.format));
  out.push(H4("ADR Registry"));
  out.push(recordsTable(
    (at.registry as any[]).map((r, i) => ({ idx: i + 1, c: r })),
    [
      ["#", (x) => String(x.idx)],
      ["ADR", (x) => x.c],
    ],
    { widths: [6, 94], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 24 — AURIENTA OPERATING SYSTEM (AOS v1.0)
// ───────────────────────────────────────────────────────────────────
export function vol24(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 24 — AURIENTA Operating System (AOS v1.0)"));
  out.push(P([
    `Version: ${AOS_VERSION} (frozen ${AOS_FROZEN_AT}). `,
    `Source: src/lib/aurienta/operating-system.ts (1,214 lines). `,
    `The AOS is the canonical operating system that turns AURIENTA from a collection of departments into an executable institution. `,
    `It scales from Founder-only → 10 → 100 → 1,000 → 10,000 employees without structural redesign. `,
    `Synchronized with the Constitution, institutional architecture, governance v1.0, enterprise risk & compliance, and the blueprint — no contradictions permitted.`,
  ]));

  out.push(H3("24.1 Process Architecture (L0–L3)"));
  out.push(H4("Level 0 Domains (5)"));
  out.push(recordsTable(
    LEVEL_0_DOMAINS as any[],
    [
      ["ID", (d) => d.id],
      ["Domain", (d) => d.name],
      ["Description", (d) => d.description ?? "—"],
    ],
    { widths: [10, 25, 65], zebra: true }
  ));
  out.push(H4("Level 1 Groups (21)"));
  out.push(recordsTable(
    LEVEL_1_GROUPS as any[],
    [
      ["ID", (g) => g.id],
      ["Group", (g) => g.name],
      ["Parent Domain", (g) => g.parent ?? g.domain ?? "—"],
      ["Description", (g) => g.description ?? "—"],
    ],
    { widths: [10, 22, 18, 50], zebra: true }
  ));
  out.push(H4("Level 2 Processes (44)"));
  out.push(recordsTable(
    LEVEL_2_PROCESSES as any[],
    [
      ["ID", (p) => p.id],
      ["Process", (p) => p.name],
      ["Parent Group", (p) => p.parent ?? p.group ?? "—"],
      ["Description", (p) => p.description ?? "—"],
    ],
    { widths: [10, 24, 18, 48], zebra: true }
  ));
  out.push(H4("Level 3 Activities"));
  out.push(recordsTable(
    LEVEL_3_ACTIVITIES as any[],
    [
      ["ID", (a) => a.id],
      ["Activity", (a) => a.name],
      ["Parent Process", (a) => a.parent ?? a.process ?? "—"],
      ["Description", (a) => a.description ?? "—"],
    ],
    { widths: [10, 25, 20, 45], zebra: true }
  ));

  out.push(H3("24.2 Process Library (24 Processes — PRC-001..024)"));
  out.push(P("Each process defines owner, trigger, cadence, inputs, outputs, steps, systems, controls, evidence, KPIs, escalation path, and automation level."));
  out.push(recordsTable(
    PROCESS_LIBRARY as any[],
    [
      ["ID", (p) => p.id],
      ["Process", (p) => p.name],
      ["Owner", (p) => p.owner],
      ["Trigger", (p) => p.trigger],
      ["Cadence", (p) => p.cadence],
      ["Automation", (p) => p.automation ?? p.automationLevel ?? "—"],
    ],
    { widths: [8, 22, 14, 18, 12, 26], zebra: true }
  ));

  out.push(H3("24.3 SOP Library"));
  out.push(recordsTable(
    SOP_LIBRARY as any[],
    [
      ["ID", (s) => s.id],
      ["SOP", (s) => s.name ?? s.title],
      ["Owner", (s) => s.owner],
      ["Trigger", (s) => s.trigger],
      ["Purpose", (s) => s.purpose],
    ],
    { widths: [8, 22, 14, 18, 38], zebra: true }
  ));

  out.push(H3("24.4 Service Catalog (SVC-001..012)"));
  out.push(recordsTable(
    SERVICE_CATALOG as any[],
    [
      ["ID", (s) => s.id],
      ["Service", (s) => s.name],
      ["Provider", (s) => s.provider],
      ["Consumer", (s) => s.consumer],
      ["SLA", (s) => s.serviceLevel ?? s.sla ?? "—"],
    ],
    { widths: [8, 22, 18, 22, 30], zebra: true }
  ));

  out.push(H3("24.5 Enterprise Capability Map (20 Capabilities — CAP-01..20)"));
  out.push(recordsTable(
    CAPABILITY_MAP as any[],
    [
      ["ID", (c) => c.id],
      ["Capability", (c) => c.name],
      ["Owner", (c) => c.owner],
      ["Current", (c) => String(c.currentMaturity ?? c.current ?? "—")],
      ["Target", (c) => String(c.targetMaturity ?? c.target ?? "—")],
      ["Dependencies", (c) => cell((c as any).dependencies)],
    ],
    { widths: [7, 22, 14, 8, 8, 41], zebra: true }
  ));

  out.push(H3("24.6 Operating Metrics (20 KPIs)"));
  out.push(recordsTable(
    OPERATING_KPIS as any[],
    [
      ["KPI", (k) => k.name ?? k.kpi],
      ["Target", (k) => k.target],
      ["Measurement", (k) => k.measurement ?? "—"],
      ["Owner", (k) => k.owner ?? "—"],
    ],
    { widths: [28, 20, 32, 20], zebra: true }
  ));

  out.push(H3("24.7 Operational Dashboards (10)"));
  out.push(recordsTable(
    OPERATIONAL_DASHBOARDS as any[],
    [
      ["Dashboard", (d) => d.name],
      ["Audience", (d) => d.audience],
      ["Refresh", (d) => d.refresh ?? "—"],
      ["Key Metrics", (d) => cell((d as any).metrics ?? (d as any).kpis)],
    ],
    { widths: [25, 25, 15, 35], zebra: true }
  ));

  out.push(H3("24.8 Knowledge Management"));
  const km: any = KNOWLEDGE_MANAGEMENT;
  out.push(recordsTable(
    Object.entries(km).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("24.9 Continuous Improvement System"));
  const ci: any = CONTINUOUS_IMPROVEMENT;
  out.push(recordsTable(
    Object.entries(ci).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("24.10 Future Executive Roles"));
  out.push(recordsTable(
    FUTURE_ROLES as any[],
    [
      ["Role", (r) => r.role ?? r.title],
      ["Activation Trigger", (r) => r.trigger ?? r.activationTrigger ?? "—"],
      ["Responsibility", (r) => r.responsibility ?? "—"],
    ],
    { widths: [25, 35, 40], zebra: true }
  ));

  out.push(H3("24.11 Career Ladder, Succession & Competency"));
  for (const [name, val] of Object.entries({ CAREER_LADDER, SUCCESSION_PLAN, COMPETENCY_FRAMEWORK, PLANNING_SYSTEM } as Record<string, any>)) {
    out.push(H4(name.replace(/_/g, " ").toLowerCase().replace(/^./, (s) => s.toUpperCase())));
    out.push(recordsTable(
      Object.entries(val).map(([k, v]) => ({ k, v: v as any })),
      [
        ["Field", (r) => r.k],
        ["Detail", (r) => cell(r.v)],
      ],
      { widths: [25, 75], zebra: true }
    ));
  }

  out.push(H3("24.12 Balanced Scorecard"));
  out.push(recordsTable(
    BALANCED_SCORECARD as any[],
    [
      ["Perspective", (s) => s.perspective],
      ["KPI", (s) => s.kpi ?? s.name],
      ["Target", (s) => s.target ?? "—"],
      ["Current", (s) => s.current ?? "—"],
    ],
    { widths: [25, 30, 22, 23], zebra: true }
  ));

  out.push(H3("24.13 Operational Excellence Framework"));
  out.push(recordsTable(
    Object.entries(OPERATIONAL_EXCELLENCE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("24.14 Enterprise Lifecycle Simulation (20 Steps)"));
  out.push(recordsTable(
    ENTERPRISE_LIFECYCLE_SIMULATION as any[],
    [
      ["Step", (s) => String(s.step ?? s.order ?? "—")],
      ["Action", (s) => s.action ?? s.name],
      ["Actor", (s) => s.actor ?? "—"],
      ["System", (s) => s.system ?? "—"],
      ["Control", (s) => s.control ?? "—"],
      ["Evidence", (s) => s.evidence ?? "—"],
    ],
    { widths: [6, 22, 14, 14, 14, 30], zebra: true }
  ));

  out.push(H3("24.15 Operational Maturity Assessment"));
  out.push(recordsTable(
    OPERATIONAL_MATURITY as any[],
    [
      ["Framework", (m) => m.framework],
      ["Current", (m) => String(m.current)],
      ["Target", (m) => String(m.target)],
      ["Gap", (m) => m.gap ?? "—"],
    ],
    { widths: [40, 12, 12, 36], zebra: true }
  ));
  out.push(H4("Maturity Gap Analysis"));
  out.push(recordsTable(
    Object.entries(MATURITY_GAP_ANALYSIS as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("24.16 Five Institutional Components"));
  out.push(H4("Enterprise Process Repository (EPR)"));
  out.push(recordsTable(
    Object.entries(EPR as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(H4("Capability Heat Map"));
  out.push(recordsTable(
    CAPABILITY_HEAT_MAP as any[],
    [
      ["Capability", (c) => c.name ?? c.capability],
      ["Maturity", (c) => String(c.maturity ?? "—")],
      ["Risk", (c) => c.risk ?? "—"],
      ["Priority", (c) => c.priority ?? "—"],
    ],
    { widths: [40, 15, 20, 25], zebra: true }
  ));
  out.push(H4("Digital Twin, Memory Engine, Mission Control"));
  out.push(recordsTable(
    Object.entries({ DIGITAL_TWIN, INSTITUTIONAL_MEMORY_ENGINE, MISSION_CONTROL } as Record<string, any>).flatMap(([group, def]) => Object.entries(def).map(([k, v]) => ({ group, k, v: v as any }))),
    [
      ["Component", (r) => r.group],
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 25, 50], zebra: true }
  ));

  out.push(H3("24.17 AOS Synchronization"));
  out.push(recordsTable(
    Object.entries(AOS_SYNCHRONIZATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 25 — COMMERCIALIZATION SYSTEM (ACS v1.0)
// ───────────────────────────────────────────────────────────────────
export function vol25(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 25 — Commercialization System (ACS v1.0)"));
  out.push(P([
    `Version: ${ACS_VERSION} (frozen ${ACS_FROZEN_AT}). `,
    `Source: src/lib/aurienta/commercialization-system.ts (887 lines). `,
    `The ACS defines how AURIENTA goes to market and generates revenue: commercial organization, 18-stage funnel, 14 sales playbooks, pricing architecture, 110 KPIs, and 16-country global expansion.`,
  ]));

  out.push(H3("25.1 Commercial Organization"));
  out.push(recordsTable(
    COMMERCIAL_ORGANIZATION as any[],
    [
      ["Function", (o) => o.function ?? o.name ?? o.role],
      ["Headcount (Future)", (o) => String(o.headcount ?? o.targetHeadcount ?? "—")],
      ["Responsibility", (o) => o.responsibility ?? o.role ?? "—"],
    ],
    { widths: [25, 18, 57], zebra: true }
  ));

  out.push(H3("25.2 Commercial Funnel (18 Stages)"));
  out.push(recordsTable(
    COMMERCIAL_FUNNEL as any[],
    [
      ["#", (s) => String(s.stage ?? s.order ?? s.step ?? "—")],
      ["Stage", (s) => s.name ?? s.stage ?? "—"],
      ["Entry Criteria", (s) => s.entryCriteria ?? s.entry ?? "—"],
      ["Exit Criteria", (s) => s.exitCriteria ?? s.exit ?? "—"],
      ["Owner", (s) => s.owner ?? "—"],
    ],
    { widths: [6, 22, 24, 24, 24], zebra: true }
  ));

  out.push(H3("25.3 Sales Playbooks (14)"));
  out.push(recordsTable(
    SALES_PLAYBOOKS as any[],
    [
      ["Playbook", (p) => p.name ?? p.title],
      ["Segment", (p) => p.segment ?? "—"],
      ["Objective", (p) => p.objective ?? "—"],
      ["Key Activities", (p) => cell((p as any).activities ?? (p as any).steps)],
    ],
    { widths: [22, 16, 22, 40], zebra: true }
  ));

  out.push(H3("25.4 Customer Journey Touchpoints"));
  out.push(recordsTable(
    CUSTOMER_JOURNEY as any[],
    [
      ["Stage", (t) => t.stage ?? t.name],
      ["Touchpoint", (t) => t.touchpoint ?? t.name],
      ["Channel", (t) => t.channel ?? "—"],
      ["Owner", (t) => t.owner ?? "—"],
    ],
    { widths: [20, 30, 25, 25], zebra: true }
  ));

  out.push(H3("25.5 Partner Lifecycle Stages"));
  out.push(recordsTable(
    PARTNER_LIFECYCLE as any[],
    [
      ["Stage", (s) => s.stage ?? s.name],
      ["Definition", (s) => s.definition ?? s.description ?? "—"],
      ["Owner", (s) => s.owner ?? "—"],
    ],
    { widths: [25, 50, 25], zebra: true }
  ));

  out.push(H3("25.6 Government Stakeholder Framework"));
  out.push(recordsTable(
    GOVERNMENT_FRAMEWORK as any[],
    [
      ["Stakeholder", (g) => g.stakeholder ?? g.name],
      ["Relevance", (g) => g.relevance ?? "—"],
      ["Engagement Approach", (g) => g.engagement ?? g.approach ?? "—"],
    ],
    { widths: [25, 35, 40], zebra: true }
  ));

  out.push(H3("25.7 Pricing Architecture (13 Lines)"));
  out.push(recordsTable(
    PRICING_ARCHITECTURE as any[],
    [
      ["Line", (p) => p.name ?? p.line ?? p.product],
      ["Model", (p) => p.model ?? "—"],
      ["Pricing", (p) => p.pricing ?? "—"],
      ["Target", (p) => p.target ?? "—"],
    ],
    { widths: [25, 18, 30, 27], zebra: true }
  ));
  out.push(H4("Pricing Constraints"));
  out.push(P(cell(PRICING_CONSTRAINTS)));

  out.push(H3("25.8 Commercial KPIs"));
  out.push(P(`Total: ${COMMERCIAL_KPIS.length} KPIs covering pipeline, conversion, revenue, retention, partner success, and operational efficiency.`));
  out.push(recordsTable(
    COMMERCIAL_KPIS as any[],
    [
      ["Category", (k) => k.category ?? "—"],
      ["KPI", (k) => k.name ?? k.kpi],
      ["Target", (k) => k.target ?? "—"],
      ["Measurement", (k) => k.measurement ?? "—"],
      ["Owner", (k) => k.owner ?? "—"],
    ],
    { widths: [12, 22, 16, 30, 20], zebra: true }
  ));

  out.push(H3("25.9 Global Expansion (16 Countries)"));
  out.push(recordsTable(
    GLOBAL_EXPANSION as any[],
    [
      ["Country", (r) => r.country ?? r.name],
      ["Phase", (r) => r.phase ?? "—"],
      ["Entry Strategy", (r) => r.entryStrategy ?? r.strategy ?? "—"],
      ["Target Year", (r) => String(r.targetYear ?? r.year ?? "—")],
    ],
    { widths: [20, 12, 48, 20], zebra: true }
  ));

  out.push(H3("25.10 Institutional Brand"));
  out.push(recordsTable(
    Object.entries(INSTITUTIONAL_BRAND as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Element", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("25.11 Competitive Positioning"));
  out.push(recordsTable(
    COMPETITIVE_POSITIONING as any[],
    [
      ["Competitor", (c) => c.competitor ?? c.name],
      ["Strength", (c) => c.strength ?? "—"],
      ["Weakness", (c) => c.weakness ?? "—"],
      ["AURIENTA Advantage", (c) => c.aurientaAdvantage ?? c.advantage ?? "—"],
    ],
    { widths: [22, 22, 22, 34], zebra: true }
  ));
  out.push(PLead("Competitive Moat", cell(COMPETITIVE_MOAT)));

  out.push(H3("25.12 Commercial Risk Register"));
  out.push(recordsTable(
    COMMERCIAL_RISK_REGISTER as any[],
    [
      ["Risk", (r) => r.risk ?? r.name],
      ["Likelihood", (r) => r.likelihood ?? "—"],
      ["Impact", (r) => r.impact ?? "—"],
      ["Mitigation", (r) => r.mitigation ?? "—"],
    ],
    { widths: [25, 12, 12, 51], zebra: true }
  ));

  out.push(H3("25.13 Due Diligence Packs"));
  out.push(recordsTable(
    DUE_DILIGENCE_PACKS as any[],
    [
      ["Pack", (p) => p.name ?? p.pack],
      ["Audience", (p) => p.audience ?? "—"],
      ["Contents", (p) => cell((p as any).contents)],
    ],
    { widths: [22, 22, 56], zebra: true }
  ));

  out.push(H3("25.14 Commercial Dashboards"));
  out.push(recordsTable(
    COMMERCIAL_DASHBOARDS as any[],
    [
      ["Dashboard", (d) => d.name ?? d.dashboard],
      ["Audience", (d) => d.audience ?? "—"],
      ["Refresh", (d) => d.refresh ?? "—"],
    ],
    { widths: [30, 40, 30], zebra: true }
  ));

  out.push(H3("25.15 COO Frameworks"));
  out.push(recordsTable(
    Object.entries(COO_FRAMEWORKS as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Framework", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("25.16 Commercialization Readiness"));
  out.push(recordsTable(
    COMMERCIALIZATION_READINESS as any[],
    [
      ["Dimension", (d) => d.dimension ?? d.name],
      ["Current", (d) => String(d.current ?? "—")],
      ["Target", (d) => String(d.target ?? "—")],
      ["Gap", (d) => d.gap ?? "—"],
    ],
    { widths: [30, 15, 15, 40], zebra: true }
  ));
  out.push(H4("Gap Analysis"));
  out.push(recordsTable(
    Object.entries(GAP_ANALYSIS as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("25.17 Executive Certification"));
  out.push(recordsTable(
    Object.entries(EXECUTIVE_CERTIFICATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("25.18 ACS Synchronization"));
  out.push(recordsTable(
    Object.entries(ACS_SYNCHRONIZATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 26 — PRODUCTION HARDENING (PH-ER v1.0)
// ───────────────────────────────────────────────────────────────────
export function vol26(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 26 — Production Hardening (PH-ER v1.0)"));
  out.push(P([
    `Version: ${PH_VERSION} (frozen ${PH_FROZEN_AT}). `,
    `Source: src/lib/aurienta/production-readiness.ts (616 lines). `,
    `12 workstreams, 160 items, 8 final reports. The PH-ER establishes the engineering readiness criteria for AURIENTA to operate as a production-grade constitutional infrastructure.`,
  ]));

  const workstreams: [string, any[]][] = [
    ["WS1 — Database", WS1_DATABASE as any[]],
    ["WS2 — Security", WS2_SECURITY as any[]],
    ["WS3 — DevSecOps", WS3_DEVSECOPS as any[]],
    ["WS4 — Observability", WS4_OBSERVABILITY as any[]],
    ["WS5 — Identity", WS5_IDENTITY as any[]],
    ["WS6 — Quality", WS6_QUALITY as any[]],
    ["WS7 — Performance", WS7_PERFORMANCE as any[]],
    ["WS8 — Operations", WS8_OPS as any[]],
    ["WS9 — Compliance", WS9_COMPLIANCE as any[]],
    ["WS10 — Documentation", WS10_DOCS as any[]],
    ["WS11 — Pilot Readiness", WS11_PILOT as any[]],
    ["WS12 — Technical Debt", WS12_TECH_DEBT as any[]],
  ];

  out.push(H3("26.1 Workstream Inventory"));
  for (const [name, items] of workstreams) {
    out.push(H4(`${name} (${items.length} items)`));
    out.push(recordsTable(
      items,
      [
        ["ID", (i: any) => i.id ?? "—"],
        ["Item", (i: any) => i.item ?? i.name ?? i.title ?? "—"],
        ["Status", (i: any) => i.status ?? "—"],
        ["Owner", (i: any) => i.owner ?? "—"],
        ["Notes", (i: any) => i.notes ?? i.description ?? "—"],
      ],
      { widths: [8, 25, 10, 15, 42], zebra: true }
    ));
  }

  out.push(H3("26.2 Workstream Scores"));
  out.push(recordsTable(
    WORKSTREAM_SCORES as any[],
    [
      ["Workstream", (s) => s.workstream ?? s.name],
      ["Current", (s) => String(s.current ?? s.score ?? "—")],
      ["Target", (s) => String(s.target ?? "—")],
      ["Gap", (s) => s.gap ?? "—"],
    ],
    { widths: [40, 18, 18, 24], zebra: true }
  ));
  out.push(PLead("Overall Readiness Score", `${OVERALL_READINESS_SCORE} / 100`));
  out.push(PLead("Overall Readiness Target", `${OVERALL_READINESS_TARGET} / 100`));

  out.push(H3("26.3 Final Reports (8)"));
  const reports: [string, any][] = [
    ["Production Readiness Report", PRODUCTION_READINESS_REPORT],
    ["Enterprise Security Report", ENTERPRISE_SECURITY_REPORT],
    ["Performance Benchmark", PERFORMANCE_BENCHMARK],
    ["SOC 2 Readiness", SOC2_READINESS],
    ["ISO 27001 Readiness", ISO27001_READINESS],
    ["Executive Certification (PH)", EXECUTIVE_CERTIFICATION_PH],
  ];
  for (const [name, def] of reports) {
    out.push(H4(name));
    out.push(recordsTable(
      Object.entries(def as any).map(([k, v]) => ({ k, v: v as any })),
      [
        ["Field", (r) => r.k],
        ["Detail", (r) => cell(r.v)],
      ],
      { widths: [25, 75], zebra: true }
    ));
  }

  out.push(H3("26.4 Go-Live Checklist"));
  out.push(recordsTable(
    GO_LIVE_CHECKLIST as any[],
    [
      ["#", (i) => String(i.id ?? i.order ?? "—")],
      ["Item", (i) => i.item ?? i.name],
      ["Required", (i) => (i.required ? "Yes" : "—")],
      ["Status", (i) => i.status ?? "—"],
      ["Owner", (i) => i.owner ?? "—"],
    ],
    { widths: [6, 35, 12, 20, 27], zebra: true }
  ));

  out.push(H3("26.5 Remaining Gaps"));
  for (const g of REMAINING_GAPS as any[]) out.push(Bullet(typeof g === "string" ? g : JSON.stringify(g)));

  out.push(H3("26.6 Roadmap Forward"));
  out.push(recordsTable(
    ROADMAP_FORWARD as any[],
    [
      ["Phase", (p) => p.phase ?? p.name],
      ["Focus", (p) => p.focus ?? "—"],
      ["Outcome", (p) => p.outcome ?? "—"],
    ],
    { widths: [25, 40, 35], zebra: true }
  ));

  out.push(H3("26.7 PH Synchronization"));
  out.push(recordsTable(
    Object.entries(PH_SYNCHRONIZATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 27 — PILOT EXECUTION (PE v1.0)
// ───────────────────────────────────────────────────────────────────
export function vol27(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 27 — Pilot Execution (PE v1.0)"));
  out.push(P([
    `Version: ${PE_VERSION} (frozen ${PE_FROZEN_AT}). `,
    `Source: src/lib/aurienta/pilot-execution.ts (481 lines). `,
    `Defines the PMO, selection framework, onboarding factory, 15 KPIs, CS operations, 7 partner types, 5 regulators, 10 evidence types, and 8 completion criteria.`,
  ]));

  out.push(H3("27.1 Pilot PMO"));
  out.push(recordsTable(
    PILOT_PMO as any[],
    [
      ["Function", (f) => f.function ?? f.name],
      ["Owner", (f) => f.owner ?? "—"],
      ["Responsibility", (f) => f.responsibility ?? f.role ?? "—"],
    ],
    { widths: [25, 20, 55], zebra: true }
  ));

  out.push(H3("27.2 Pilot Selection Criteria"));
  out.push(recordsTable(
    PILOT_SELECTION_CRITERIA as any[],
    [
      ["Criterion", (c) => c.criterion ?? c.name],
      ["Weight", (c) => String(c.weight ?? "—")],
      ["Description", (c) => c.description ?? "—"],
    ],
    { widths: [25, 12, 63], zebra: true }
  ));
  out.push(H4("Selection Model"));
  out.push(recordsTable(
    Object.entries(PILOT_SELECTION_MODEL as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("27.3 Onboarding Factory"));
  out.push(recordsTable(
    ONBOARDING_FACTORY as any[],
    [
      ["Step", (s) => String(s.step ?? s.order ?? "—")],
      ["Activity", (s) => s.activity ?? s.name],
      ["Owner", (s) => s.owner ?? "—"],
      ["Duration", (s) => s.duration ?? "—"],
    ],
    { widths: [8, 45, 22, 25], zebra: true }
  ));
  out.push(H4("Onboarding Metrics"));
  out.push(recordsTable(
    Object.entries(ONBOARDING_METRICS as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Metric", (r) => r.k],
      ["Target", (r) => cell(r.v)],
    ],
    { widths: [40, 60], zebra: true }
  ));

  out.push(H3("27.4 Pilot Success KPIs (15)"));
  out.push(recordsTable(
    PILOT_SUCCESS_KPIS as any[],
    [
      ["KPI", (k) => k.kpi ?? k.name],
      ["Target", (k) => k.target ?? "—"],
      ["Measurement", (k) => k.measurement ?? "—"],
      ["Owner", (k) => k.owner ?? "—"],
    ],
    { widths: [25, 18, 35, 22], zebra: true }
  ));

  out.push(H3("27.5 Customer Success Operations"));
  out.push(recordsTable(
    CUSTOMER_SUCCESS_OPS as any[],
    [
      ["Operation", (o) => o.operation ?? o.name],
      ["Owner", (o) => o.owner ?? "—"],
      ["Frequency", (o) => o.frequency ?? "—"],
      ["Output", (o) => o.output ?? "—"],
    ],
    { widths: [25, 20, 18, 37], zebra: true }
  ));

  out.push(H3("27.6 Feedback Channels & Loop"));
  out.push(recordsTable(
    FEEDBACK_CHANNELS as any[],
    [
      ["Channel", (c) => c.channel ?? c.name],
      ["Purpose", (c) => c.purpose ?? "—"],
      ["Owner", (c) => c.owner ?? "—"],
    ],
    { widths: [25, 50, 25], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(FEEDBACK_LOOP as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("27.7 Strategic Partner Execution (7 Partner Types)"));
  out.push(recordsTable(
    STRATEGIC_PARTNER_EXECUTION as any[],
    [
      ["Partner Type", (p) => p.partnerType ?? p.type ?? p.name],
      ["Role", (p) => p.role ?? "—"],
      ["Engagement", (p) => p.engagement ?? "—"],
      ["KPI", (p) => p.kpi ?? "—"],
    ],
    { widths: [22, 25, 30, 23], zebra: true }
  ));

  out.push(H3("27.8 Regulatory Engagement (5 Regulators)"));
  out.push(recordsTable(
    REGULATORY_ENGAGEMENT as any[],
    [
      ["Regulator", (r) => r.regulator ?? r.name],
      ["Scope", (r) => r.scope ?? "—"],
      ["Engagement Approach", (r) => r.engagement ?? r.approach ?? "—"],
      ["Status", (r) => r.status ?? "—"],
    ],
    { widths: [20, 22, 38, 20], zebra: true }
  ));
  out.push(H4("Regulator Relationship Dashboard"));
  out.push(recordsTable(
    Object.entries(REGULATOR_RELATIONSHIP_DASHBOARD as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("27.9 Evidence Repository (10 Evidence Types)"));
  out.push(recordsTable(
    EVIDENCE_REPOSITORY as any[],
    [
      ["Type", (e) => e.type ?? e.name],
      ["Purpose", (e) => e.purpose ?? "—"],
      ["Storage", (e) => e.storage ?? "—"],
      ["Retention", (e) => e.retention ?? "—"],
    ],
    { widths: [20, 35, 25, 20], zebra: true }
  ));
  out.push(H4("Evidence Properties"));
  out.push(recordsTable(
    Object.entries(EVIDENCE_PROPERTIES as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("27.10 Pilot Mission Control"));
  out.push(recordsTable(
    Object.entries(PILOT_MISSION_CONTROL as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("27.11 Pilot Completion Criteria (8)"));
  out.push(recordsTable(
    PILOT_COMPLETION_CRITERIA as any[],
    [
      ["Criterion", (c) => c.criterion ?? c.name],
      ["Required", (c) => (c.required ? "Yes" : "—")],
      ["Evidence", (c) => c.evidence ?? "—"],
      ["Owner", (c) => c.owner ?? "—"],
    ],
    { widths: [28, 12, 35, 25], zebra: true }
  ));
  out.push(Quote(PILOT_COMPLETION_RULE));

  out.push(H3("27.12 Readiness Reassessment"));
  out.push(recordsTable(
    READINESS_REASSESSMENT as any[],
    [
      ["Dimension", (r) => r.dimension ?? r.name],
      ["Before", (r) => String(r.before ?? "—")],
      ["After", (r) => String(r.after ?? "—")],
    ],
    { widths: [50, 25, 25], zebra: true }
  ));

  out.push(H3("27.13 Final Reports"));
  const reports: [string, any][] = [
    ["Pilot Execution Report", PILOT_EXECUTION_REPORT],
    ["Pilot Success Framework", PILOT_SUCCESS_FRAMEWORK],
    ["Customer Success Report", CUSTOMER_SUCCESS_REPORT],
    ["Strategic Partnership Report", STRATEGIC_PARTNERSHIP_REPORT],
    ["Regulatory Engagement Report", REGULATORY_ENGAGEMENT_REPORT],
    ["Institutional Evidence Report", INSTITUTIONAL_EVIDENCE_REPORT],
    ["Lessons Learned Report", LESSONS_LEARNED_REPORT],
    ["Executive Readiness Assessment", EXECUTIVE_READINESS_ASSESSMENT],
  ];
  for (const [name, def] of reports) {
    out.push(H4(name));
    out.push(recordsTable(
      Object.entries(def as any).map(([k, v]) => ({ k, v: v as any })),
      [
        ["Field", (r) => r.k],
        ["Detail", (r) => cell(r.v)],
      ],
      { widths: [25, 75], zebra: true }
    ));
  }
  out.push(PLead("Updated Readiness Score", String(UPDATED_READINESS_SCORE)));

  out.push(H3("27.14 Executive Certification"));
  out.push(recordsTable(
    Object.entries(EXECUTIVE_CERTIFICATION_PE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("27.15 COO Roadmap Execution"));
  out.push(recordsTable(
    COO_ROADMAP_EXECUTION as any[],
    [
      ["Phase", (p) => p.phase ?? p.name],
      ["Action", (p) => p.action ?? "—"],
      ["Owner", (p) => p.owner ?? "—"],
      ["Outcome", (p) => p.outcome ?? "—"],
    ],
    { widths: [22, 35, 18, 25], zebra: true }
  ));

  out.push(H3("27.16 PE Synchronization"));
  out.push(recordsTable(
    Object.entries(PE_SYNCHRONIZATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 28 — GLOBAL LAUNCH SEQUENCE (GLS v1.0)
// ───────────────────────────────────────────────────────────────────
export function vol28(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 28 — Global Launch Sequence (GLS v1.0)"));
  out.push(P([
    `Version: ${GLS_VERSION} (frozen ${GLS_FROZEN_AT}). `,
    `Source: src/lib/aurienta/global-launch.ts (451 lines). `,
    `16-country sequence, 16 partner types, 11 government stakeholders, 12 certifications, 11 DD packages, 10 trust pillars.`,
  ]));

  out.push(H3("28.1 Country Readiness Dimensions"));
  out.push(recordsTable(
    COUNTRY_READINESS_DIMENSIONS as any[],
    [
      ["Dimension", (d) => d.dimension ?? d.name],
      ["Weight", (d) => String(d.weight ?? "—")],
      ["Description", (d) => d.description ?? "—"],
    ],
    { widths: [25, 12, 63], zebra: true }
  ));

  out.push(H3("28.2 Global Expansion Sequence (16 Countries)"));
  out.push(recordsTable(
    GLOBAL_EXPANSION_SEQUENCE as any[],
    [
      ["Country", (c) => c.country ?? c.name],
      ["Phase", (c) => String(c.phase ?? c.order ?? "—")],
      ["Entry Mode", (c) => c.entryMode ?? c.entry ?? "—"],
      ["Target Year", (c) => String(c.targetYear ?? c.year ?? "—")],
      ["Key Partners", (c) => cell((c as any).partners)],
    ],
    { widths: [15, 8, 20, 12, 45], zebra: true }
  ));

  out.push(H3("28.3 Strategic Partner Types (16)"));
  out.push(recordsTable(
    STRATEGIC_PARTNER_TYPES as any[],
    [
      ["Type", (t) => t.type ?? t.name],
      ["Role", (t) => t.role ?? "—"],
      ["Value", (t) => t.value ?? "—"],
    ],
    { widths: [22, 33, 45], zebra: true }
  ));
  out.push(H4("Partnership Lifecycle"));
  for (const s of PARTNERSHIP_LIFECYCLE as any[]) out.push(Bullet(typeof s === "string" ? s : JSON.stringify(s)));

  out.push(H3("28.4 Government Stakeholders (11)"));
  out.push(recordsTable(
    GOVERNMENT_STAKEHOLDERS as any[],
    [
      ["Stakeholder", (s) => s.stakeholder ?? s.name],
      ["Jurisdiction", (s) => s.jurisdiction ?? s.scope ?? "—"],
      ["Engagement", (s) => s.engagement ?? s.approach ?? "—"],
    ],
    { widths: [25, 25, 50], zebra: true }
  ));
  out.push(H4("Engagement Playbook Template"));
  out.push(recordsTable(
    Object.entries(GOV_ENGAGEMENT_PLAYBOOK_TEMPLATE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("28.5 Institutional Sales Segments"));
  out.push(recordsTable(
    INSTITUTIONAL_SALES as any[],
    [
      ["Segment", (s) => s.segment ?? s.name],
      ["Profile", (s) => s.profile ?? "—"],
      ["Entry Strategy", (s) => s.entryStrategy ?? s.strategy ?? "—"],
    ],
    { widths: [25, 35, 40], zebra: true }
  ));
  out.push(H4("Institutional Sales Stages"));
  for (const s of INSTITUTIONAL_SALES_STAGES as any[]) out.push(Bullet(typeof s === "string" ? s : JSON.stringify(s)));

  out.push(H3("28.6 Expansion Office Roles"));
  out.push(recordsTable(
    EXPANSION_OFFICE as any[],
    [
      ["Role", (r) => r.role ?? r.name],
      ["Activation", (r) => r.activation ?? r.trigger ?? "—"],
      ["Responsibility", (r) => r.responsibility ?? "—"],
    ],
    { widths: [25, 25, 50], zebra: true }
  ));

  out.push(H3("28.7 Alliance Instruments"));
  out.push(recordsTable(
    ALLIANCE_INSTRUMENTS as any[],
    [
      ["Instrument", (a) => a.instrument ?? a.name],
      ["Use Case", (a) => a.useCase ?? "—"],
      ["Legal Form", (a) => a.legalForm ?? "—"],
    ],
    { widths: [25, 40, 35], zebra: true }
  ));

  out.push(H3("28.8 Institutional Communications"));
  out.push(recordsTable(
    INSTITUTIONAL_COMMS as any[],
    [
      ["Track", (c) => c.track ?? c.name],
      ["Audience", (c) => c.audience ?? "—"],
      ["Cadence", (c) => c.cadence ?? "—"],
    ],
    { widths: [25, 40, 35], zebra: true }
  ));
  out.push(H4("Messaging Hierarchy"));
  for (const m of MESSAGING_HIERARCHY as any[]) out.push(Bullet(typeof m === "string" ? m : JSON.stringify(m)));

  out.push(H3("28.9 Global Events"));
  out.push(recordsTable(
    GLOBAL_EVENTS as any[],
    [
      ["Event", (e) => e.event ?? e.name],
      ["Audience", (e) => e.audience ?? "—"],
      ["Frequency", (e) => e.frequency ?? "—"],
    ],
    { widths: [30, 35, 35], zebra: true }
  ));

  out.push(H3("28.10 Certification Roadmap (12 Certifications)"));
  out.push(recordsTable(
    GLS_CERTS as any[],
    [
      ["Certification", (c) => c.certification ?? c.name],
      ["Target Date", (c) => c.targetDate ?? "—"],
      ["Scope", (c) => c.scope ?? "—"],
      ["Owner", (c) => c.owner ?? "—"],
    ],
    { widths: [25, 15, 35, 25], zebra: true }
  ));

  out.push(H3("28.11 Due Diligence Center (11 Packages)"));
  out.push(recordsTable(
    DD_CENTER as any[],
    [
      ["Package", (p) => p.package ?? p.name],
      ["Audience", (p) => p.audience ?? "—"],
      ["Contents", (p) => cell((p as any).contents)],
    ],
    { widths: [22, 22, 56], zebra: true }
  ));

  out.push(H3("28.12 Trust Center (10 Pillars)"));
  out.push(recordsTable(
    TRUST_CENTER as any[],
    [
      ["Pillar", (p) => p.pillar ?? p.name],
      ["Description", (p) => p.description ?? "—"],
      ["Evidence", (p) => p.evidence ?? "—"],
    ],
    { widths: [22, 50, 28], zebra: true }
  ));

  out.push(H3("28.13 Global Deployment Dashboard"));
  out.push(recordsTable(
    Object.entries(GLOBAL_DEPLOYMENT_DASHBOARD as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("28.14 COO Recommendations"));
  out.push(recordsTable(
    COO_RECOMMENDATIONS_GL as any[],
    [
      ["#", (r) => String(r.id ?? r.order ?? "—")],
      ["Recommendation", (r) => r.recommendation ?? r.text ?? "—"],
      ["Priority", (r) => r.priority ?? "—"],
    ],
    { widths: [8, 72, 20], zebra: true }
  ));

  out.push(H3("28.15 Executive Certification"));
  out.push(recordsTable(
    Object.entries(EXECUTIVE_CERTIFICATION_GLS as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("28.16 GLS Synchronization"));
  out.push(recordsTable(
    Object.entries(GLS_SYNCHRONIZATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 29 — FOUNDER OFFICE (FOCC v1.0)
// ───────────────────────────────────────────────────────────────────
export function vol29(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 29 — Founder Office Command Center (FOCC v1.0)"));
  out.push(P([
    `Version: ${FOCC_VERSION} (frozen ${FOCC_FROZEN_AT}). `,
    `Source: src/lib/aurienta/founder-office.ts (391 lines). `,
    `14 Founder Office modules, 12 PMO modules, 15-field decision schema, 20 Mission Control panels, 12 briefing types, 17 performance dimensions.`,
  ]));

  out.push(H3("29.1 Founder Office Modules (14)"));
  out.push(recordsTable(
    FOUNDER_OFFICE as any[],
    [
      ["Module", (m) => m.module ?? m.name],
      ["Purpose", (m) => m.purpose ?? "—"],
      ["Owner", (m) => m.owner ?? "—"],
    ],
    { widths: [25, 50, 25], zebra: true }
  ));

  out.push(H3("29.2 Enterprise PMO Modules (12)"));
  out.push(recordsTable(
    ENTERPRISE_PMO as any[],
    [
      ["Module", (m) => m.module ?? m.name],
      ["Purpose", (m) => m.purpose ?? "—"],
      ["Owner", (m) => m.owner ?? "—"],
    ],
    { widths: [25, 50, 25], zebra: true }
  ));

  out.push(H3("29.3 Decision Record Schema (15 Fields)"));
  out.push(recordsTable(
    DECISION_RECORD_SCHEMA as any[],
    [
      ["Field", (f) => f.field ?? f.name],
      ["Type", (f) => f.type ?? "—"],
      ["Description", (f) => f.description ?? "—"],
      ["Required", (f) => (f.required ? "Yes" : "—")],
    ],
    { widths: [22, 18, 45, 15], zebra: true }
  ));
  out.push(H4("Decision Intelligence"));
  out.push(recordsTable(
    Object.entries(DECISION_INTELLIGENCE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("29.4 Mission Control Panels (20)"));
  out.push(recordsTable(
    MISSION_CONTROL_PANELS as any[],
    [
      ["Panel", (p) => p.panel ?? p.name],
      ["Audience", (p) => p.audience ?? "—"],
      ["Refresh", (p) => p.refresh ?? "—"],
      ["Key Metrics", (p) => cell((p as any).metrics ?? (p as any).kpis)],
    ],
    { widths: [25, 22, 13, 40], zebra: true }
  ));

  out.push(H3("29.5 Executive Briefing Types (12)"));
  out.push(recordsTable(
    EXECUTIVE_BRIEFINGS as any[],
    [
      ["Type", (b) => b.type ?? b.name],
      ["Audience", (b) => b.audience ?? "—"],
      ["Frequency", (b) => b.frequency ?? "—"],
      ["Purpose", (b) => b.purpose ?? "—"],
    ],
    { widths: [22, 22, 18, 38], zebra: true }
  ));

  out.push(H3("29.6 Corporate Intelligence Domains"));
  out.push(recordsTable(
    CORPORATE_INTELLIGENCE as any[],
    [
      ["Domain", (d) => d.domain ?? d.name],
      ["Description", (d) => d.description ?? "—"],
      ["Sources", (d) => cell((d as any).sources)],
    ],
    { widths: [22, 48, 30], zebra: true }
  ));
  out.push(H4("Intelligence Assessment"));
  out.push(recordsTable(
    Object.entries(INTELLIGENCE_ASSESSMENT as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("29.7 Knowledge Graph"));
  out.push(H4("Entities"));
  out.push(recordsTable(
    KNOWLEDGE_GRAPH_ENTITIES as any[],
    [
      ["Entity", (e) => e.entity ?? e.name],
      ["Description", (e) => e.description ?? "—"],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(H4("Properties"));
  out.push(recordsTable(
    Object.entries(KNOWLEDGE_GRAPH_PROPERTIES as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("29.8 Executive Workflows"));
  out.push(recordsTable(
    EXECUTIVE_WORKFLOWS as any[],
    [
      ["Workflow", (w) => w.workflow ?? w.name],
      ["Trigger", (w) => w.trigger ?? "—"],
      ["Steps", (w) => cell((w as any).steps)],
    ],
    { widths: [25, 25, 50], zebra: true }
  ));

  out.push(H3("29.9 Institutional Memory"));
  out.push(recordsTable(
    INSTITUTIONAL_MEMORY as any[],
    [
      ["Category", (m) => m.category ?? m.name],
      ["Retention", (m) => m.retention ?? "—"],
      ["Owner", (m) => m.owner ?? "—"],
    ],
    { widths: [30, 30, 40], zebra: true }
  ));
  out.push(H4("Memory Properties"));
  out.push(recordsTable(
    Object.entries(INSTITUTIONAL_MEMORY_PROPERTIES as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("29.10 CEO Performance Dashboard (17 Dimensions)"));
  out.push(recordsTable(
    CEO_PERFORMANCE_DASHBOARD as any[],
    [
      ["Dimension", (d) => d.dimension ?? d.name],
      ["Target", (d) => String(d.target ?? "—")],
      ["Current", (d) => String(d.current ?? "—")],
      ["Weight", (d) => String(d.weight ?? "—")],
    ],
    { widths: [40, 20, 20, 20], zebra: true }
  ));
  out.push(PLead("Overall Institutional Health", String(OVERALL_INSTITUTIONAL_HEALTH)));

  out.push(H3("29.11 COO Recommendations"));
  out.push(recordsTable(
    COO_RECOMMENDATIONS_FO as any[],
    [
      ["#", (r) => String(r.id ?? r.order ?? "—")],
      ["Recommendation", (r) => r.recommendation ?? r.text ?? "—"],
      ["Priority", (r) => r.priority ?? "—"],
    ],
    { widths: [8, 72, 20], zebra: true }
  ));

  out.push(H3("29.12 Executive Certification"));
  out.push(recordsTable(
    Object.entries(EXECUTIVE_CERTIFICATION_FOCC as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("29.13 FOCC Synchronization"));
  out.push(recordsTable(
    Object.entries(FOCC_SYNCHRONIZATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 30 — INSTITUTIONAL TRUST (ITDB v1.0)
// ───────────────────────────────────────────────────────────────────
export function vol30(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 30 — Institutional Trust Database (ITDB v1.0)"));
  out.push(P([
    `Version: ${ITDB_VERSION} (frozen ${ITDB_FROZEN_AT}). `,
    `Source: src/lib/aurienta/institutional-trust.ts (427 lines). `,
    `21 data room repositories, 12 DD audiences, 10 claim types, 12 scorecards, 9 audit types, 15 assurance capabilities, 12 transparency sections.`,
  ]));

  out.push(H3("30.1 Data Room Repositories (21)"));
  out.push(recordsTable(
    DATA_ROOM as any[],
    [
      ["ID", (r) => r.id ?? "—"],
      ["Repository", (r) => r.name ?? r.repository],
      ["Contents", (r) => cell((r as any).contents)],
      ["Owner", (r) => r.owner ?? "—"],
    ],
    { widths: [8, 22, 50, 20], zebra: true }
  ));
  out.push(H4("Document Metadata"));
  out.push(recordsTable(
    Object.entries(DOCUMENT_METADATA as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("30.2 Board Management Modules"));
  out.push(recordsTable(
    BOARD_MANAGEMENT as any[],
    [
      ["Module", (m) => m.module ?? m.name],
      ["Purpose", (m) => m.purpose ?? "—"],
      ["Owner", (m) => m.owner ?? "—"],
    ],
    { widths: [25, 50, 25], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(BOARD_NOTE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("30.3 DD Automation Packages"));
  out.push(recordsTable(
    DD_AUTOMATION as any[],
    [
      ["Package", (p) => p.package ?? p.name],
      ["Audience", (p) => p.audience ?? "—"],
      ["Automation Level", (p) => p.automation ?? p.automationLevel ?? "—"],
    ],
    { widths: [25, 35, 40], zebra: true }
  ));
  out.push(H4("DD Automation Properties"));
  out.push(recordsTable(
    Object.entries(DD_AUTOMATION_PROPERTIES as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("30.4 Trust Claims (10 Claim Types)"));
  out.push(recordsTable(
    TRUST_CLAIMS as any[],
    [
      ["Claim", (c) => c.claim ?? c.name],
      ["Evidence Required", (c) => cell((c as any).evidenceRequired ?? (c as any).evidence)],
      ["Verification", (c) => c.verification ?? "—"],
    ],
    { widths: [25, 45, 30], zebra: true }
  ));
  out.push(H4("Evidence Engine"));
  out.push(recordsTable(
    Object.entries(EVIDENCE_ENGINE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("30.5 Executive Reports"));
  out.push(recordsTable(
    EXECUTIVE_REPORTS as any[],
    [
      ["Report", (r) => r.report ?? r.name],
      ["Audience", (r) => r.audience ?? "—"],
      ["Frequency", (r) => r.frequency ?? "—"],
    ],
    { widths: [30, 35, 35], zebra: true }
  ));
  out.push(H4("Reporting Properties"));
  out.push(recordsTable(
    Object.entries(REPORTING_PROPERTIES as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("30.6 Institutional Scorecards (12)"));
  out.push(recordsTable(
    INSTITUTIONAL_SCORECARDS as any[],
    [
      ["Scorecard", (s) => s.scorecard ?? s.name],
      ["Audience", (s) => s.audience ?? "—"],
      ["Score Range", (s) => s.scoreRange ?? s.range ?? "—"],
    ],
    { widths: [30, 35, 35], zebra: true }
  ));
  out.push(PLead("Institutional Trust Index", String(INSTITUTIONAL_TRUST_INDEX)));

  out.push(H3("30.7 External Audit Center (9 Audit Types)"));
  out.push(recordsTable(
    EXTERNAL_AUDIT_CENTER as any[],
    [
      ["Audit Type", (a) => a.auditType ?? a.type ?? a.name],
      ["Frequency", (a) => a.frequency ?? "—"],
      ["Scope", (a) => a.scope ?? "—"],
      ["Owner", (a) => a.owner ?? "—"],
    ],
    { widths: [22, 15, 40, 23], zebra: true }
  ));
  out.push(H4("Audit Tracking"));
  out.push(recordsTable(
    Object.entries(AUDIT_TRACKING as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("30.8 Assurance Framework (15 Capabilities)"));
  out.push(recordsTable(
    ASSURANCE_FRAMEWORK as any[],
    [
      ["Capability", (c) => c.capability ?? c.name],
      ["Type", (c) => c.type ?? "—"],
      ["Owner", (c) => c.owner ?? "—"],
      ["Evidence", (c) => c.evidence ?? "—"],
    ],
    { widths: [25, 18, 22, 35], zebra: true }
  ));

  out.push(H3("30.9 Transparency Portal (12 Sections)"));
  out.push(recordsTable(
    TRANSPARENCY_PORTAL as any[],
    [
      ["Section", (s) => s.section ?? s.name],
      ["Audience", (s) => s.audience ?? "—"],
      ["Contents", (s) => cell((s as any).contents)],
    ],
    { widths: [22, 20, 58], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(TRANSPARENCY_PRINCIPLE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("30.10 Board Command Dashboard"));
  out.push(recordsTable(
    BOARD_COMMAND_DASHBOARD as any[],
    [
      ["Panel", (p) => p.panel ?? p.name],
      ["Metrics", (p) => cell((p as any).metrics)],
    ],
    { widths: [30, 70], zebra: true }
  ));

  out.push(H3("30.11 COO Recommendations"));
  out.push(recordsTable(
    COO_RECOMMENDATIONS_IT as any[],
    [
      ["#", (r) => String(r.id ?? r.order ?? "—")],
      ["Recommendation", (r) => r.recommendation ?? r.text ?? "—"],
      ["Priority", (r) => r.priority ?? "—"],
    ],
    { widths: [8, 72, 20], zebra: true }
  ));

  out.push(H3("30.12 Executive Certification"));
  out.push(recordsTable(
    Object.entries(EXECUTIVE_CERTIFICATION_ITDB as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("30.13 COO Post-ITDB Roadmap"));
  out.push(recordsTable(
    COO_POST_ITDB_ROADMAP as any[],
    [
      ["Phase", (p) => p.phase ?? p.name],
      ["Focus", (p) => p.focus ?? "—"],
      ["Outcome", (p) => p.outcome ?? "—"],
    ],
    { widths: [25, 40, 35], zebra: true }
  ));

  out.push(H3("30.14 ITDB Synchronization"));
  out.push(recordsTable(
    Object.entries(ITDB_SYNCHRONIZATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 31 — MARKET EXECUTION SYSTEM (MES v1.0)
// ───────────────────────────────────────────────────────────────────
export function vol31(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 31 — Market Execution System (MES v1.0)"));
  out.push(P([
    `Version: ${MES_VERSION} (frozen ${MES_FROZEN_AT}). `,
    `Source: src/lib/aurienta/market-execution.ts (888 lines). `,
    `Defines the execution engine, the integrity rule (CLAIM ≠ EVIDENCE ≠ STATUS ≠ TARGET ≠ FORECAST), 18-item status register, 15-criterion qualification, 22-stage pipeline, 13 pricing lines, 110 KPIs, 7 validation gates.`,
  ]));

  out.push(H3("31.1 Execution Integrity Rule"));
  out.push(Quote("CLAIM ≠ EVIDENCE ≠ STATUS ≠ TARGET ≠ FORECAST. The system must never collapse these states. A claim is what we say. Evidence is what we can prove. Status is what is actually true. A target is what we aim for. A forecast is what we predict."));
  out.push(recordsTable(
    Object.entries(EXECUTION_INTEGRITY_RULE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("31.2 Execution Status Register (18 Items)"));
  out.push(recordsTable(
    EXECUTION_STATUS_REGISTER as any[],
    [
      ["Status", (s) => s.status ?? s.name],
      ["Definition", (s) => s.definition ?? "—"],
      ["Evidence Required", (s) => cell((s as any).evidenceRequired ?? (s as any).evidence)],
    ],
    { widths: [25, 45, 30], zebra: true }
  ));

  out.push(H3("31.3 Ideal Customer Profile"));
  out.push(recordsTable(
    IDEAL_CUSTOMER_PROFILE as any[],
    [
      ["Attribute", (a) => a.attribute ?? a.name],
      ["Value", (a) => a.value ?? "—"],
    ],
    { widths: [35, 65], zebra: true }
  ));

  out.push(H3("31.4 Anchor Qualification Model (15 Criteria)"));
  out.push(recordsTable(
    ANCHOR_QUALIFICATION_MODEL as any[],
    [
      ["Criterion", (c) => c.criterion ?? c.name],
      ["Weight", (c) => String(c.weight ?? "—")],
      ["Description", (c) => c.description ?? "—"],
    ],
    { widths: [25, 12, 63], zebra: true }
  ));
  out.push(H4("Qualification Rule"));
  out.push(recordsTable(
    Object.entries(QUALIFICATION_RULE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("31.5 Target Account Schema"));
  out.push(recordsTable(
    TARGET_ACCOUNT_SCHEMA as any[],
    [
      ["Field", (f) => f.field ?? f.name],
      ["Type", (f) => f.type ?? "—"],
      ["Description", (f) => f.description ?? "—"],
    ],
    { widths: [25, 18, 57], zebra: true }
  ));
  out.push(Quote(TARGET_ACCOUNT_RULE));
  out.push(PLead("Target Account Count", String(TARGET_ACCOUNT_COUNT)));

  out.push(H3("31.6 Target Tiers"));
  out.push(recordsTable(
    TARGET_TIERS as any[],
    [
      ["Tier", (t) => t.tier ?? t.name],
      ["Definition", (t) => t.definition ?? t.description ?? "—"],
      ["Capacity Allocation", (t) => t.capacity ?? "—"],
    ],
    { widths: [15, 55, 30], zebra: true }
  ));

  out.push(H3("31.7 Sales Pipeline (22 Stages)"));
  out.push(recordsTable(
    SALES_PIPELINE as any[],
    [
      ["#", (s) => String(s.stage ?? s.order ?? s.step ?? "—")],
      ["Stage", (s) => s.name ?? s.stage],
      ["Entry Criteria", (s) => s.entryCriteria ?? s.entry ?? "—"],
      ["Exit Criteria", (s) => s.exitCriteria ?? s.exit ?? "—"],
      ["Owner", (s) => s.owner ?? "—"],
      ["Evidence", (s) => s.evidence ?? "—"],
    ],
    { widths: [5, 17, 22, 22, 14, 20], zebra: true }
  ));
  out.push(Quote(PIPELINE_RULE));
  out.push(PLead("Pipeline Opportunity Count", String(PIPELINE_OPPORTUNITY_COUNT)));

  out.push(H3("31.8 Commercial Offer Validation"));
  out.push(recordsTable(
    COMMERCIAL_OFFER_VALIDATION as any[],
    [
      ["Validation", (v) => v.validation ?? v.name],
      ["Required Evidence", (v) => v.evidence ?? v.requiredEvidence ?? "—"],
      ["Status", (v) => v.status ?? "—"],
    ],
    { widths: [30, 45, 25], zebra: true }
  ));
  out.push(Quote(PRICING_VALIDATION_RULE));

  out.push(H3("31.9 Revenue Validation"));
  out.push(recordsTable(
    REVENUE_VALIDATION as any[],
    [
      ["Metric", (m) => m.metric ?? m.name],
      ["Definition", (m) => m.definition ?? "—"],
      ["Current Value", (m) => String(m.current ?? m.value ?? "—")],
    ],
    { widths: [25, 50, 25], zebra: true }
  ));
  out.push(Quote(REVENUE_RULE));

  out.push(H3("31.10 Partner Execution Targets"));
  out.push(recordsTable(
    PARTNER_EXECUTION as any[],
    [
      ["Partner Type", (p) => p.partnerType ?? p.type ?? p.name],
      ["Strategic Rationale", (p) => p.rationale ?? "—"],
      ["Stage", (p) => p.stage ?? "—"],
    ],
    { widths: [25, 50, 25], zebra: true }
  ));
  out.push(Quote(PARTNER_RULE));

  out.push(H3("31.11 Law Firm Criteria & Pipeline"));
  out.push(recordsTable(
    LAW_FIRM_CRITERIA as any[],
    [
      ["Criterion", (c) => c.criterion ?? c.name],
      ["Threshold", (c) => String(c.threshold ?? "—")],
      ["Description", (c) => c.description ?? "—"],
    ],
    { widths: [25, 18, 57], zebra: true }
  ));
  out.push(PLead("Law Firm Pipeline", (LAW_FIRM_PIPELINE as any[]).join(" → ")));
  out.push(Quote(LAW_FIRM_RULE));

  out.push(H3("31.12 Regulatory Engagement Execution"));
  out.push(recordsTable(
    REGULATORY_ENGAGEMENT_EXECUTION as any[],
    [
      ["Regulator", (r) => r.regulator ?? r.name],
      ["Status", (r) => r.status ?? "—"],
      ["Next Step", (r) => r.nextStep ?? "—"],
    ],
    { widths: [25, 30, 45], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(REGULATORY_TERMINOLOGY_RULE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("31.13 Pilot Execution Framework"));
  out.push(recordsTable(
    Object.entries(PILOT_EXECUTION_FRAMEWORK as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 32 — MARKET ACTIVATION SYSTEM (MAS v1.0)
// ───────────────────────────────────────────────────────────────────
export function vol32(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 32 — Market Activation System (MAS v1.0)"));
  out.push(P([
    `Version: ${MAS_VERSION} (frozen ${MAS_FROZEN_AT}). `,
    `Source: src/lib/aurienta/market-activation.ts (707 lines). `,
    `First 100 target engine (29 fields), 4 tiers, sourcing methodology, 14-stage outreach, 10-section discovery, E0-E9 evidence hierarchy, relationship map, daily command, 14-stage funnel.`,
  ]));

  out.push(H3("32.1 Factual Baseline"));
  out.push(recordsTable(
    Object.entries(FACTUAL_BASELINE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Metric", (r) => r.k],
      ["Value", (r) => cell(r.v)],
    ],
    { widths: [40, 60], zebra: true }
  ));

  out.push(H3("32.2 First 100 Target Account Engine (29 Fields)"));
  out.push(recordsTable(
    TARGET_ACCOUNT_ENGINE as any[],
    [
      ["Field", (f) => f.field ?? f.name],
      ["Type", (f) => f.type ?? "—"],
      ["Description", (f) => f.description ?? "—"],
    ],
    { widths: [25, 18, 57], zebra: true }
  ));
  out.push(Quote(TARGET_ENGINE_RULE));
  out.push(PLead("Targets Entered", String(TARGETS_ENTERED)));

  out.push(H3("32.3 Target Segmentation (4 Tiers)"));
  out.push(recordsTable(
    TARGET_SEGMENTATION as any[],
    [
      ["Tier", (t) => t.tier ?? t.name],
      ["Definition", (t) => t.definition ?? "—"],
      ["Capacity Allocation", (t) => t.capacity ?? "—"],
    ],
    { widths: [15, 55, 30], zebra: true }
  ));
  out.push(Quote(CAPACITY_RULE));

  out.push(H3("32.4 Sourcing Methodology"));
  out.push(recordsTable(
    Object.entries(SOURCING_METHODOLOGY as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(H4("Egypt Market Focus"));
  out.push(recordsTable(
    Object.entries(EGYPT_MARKET_FOCUS as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("32.5 First-25 Process"));
  for (const step of FIRST_25_PROCESS as any[]) out.push(Bullet(typeof step === "string" ? step : JSON.stringify(step)));
  out.push(Quote(FIRST_25_RULE));

  out.push(H3("32.6 Outreach Workflow (14 Stages)"));
  out.push(recordsTable(
    OUTREACH_WORKFLOW as any[],
    [
      ["Stage", (s) => s.stage ?? s.name],
      ["Action", (s) => s.action ?? "—"],
      ["Owner", (s) => s.owner ?? "—"],
    ],
    { widths: [25, 50, 25], zebra: true }
  ));
  out.push(PLead("Outreach Sent", String(OUTREACH_SENT)));
  out.push(H4("Outreach Quality"));
  out.push(recordsTable(
    Object.entries(OUTREACH_QUALITY as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("32.7 Discovery System (10 Sections)"));
  out.push(recordsTable(
    DISCOVERY_SYSTEM as any[],
    [
      ["Section", (s) => s.section ?? s.name],
      ["Purpose", (s) => s.purpose ?? "—"],
    ],
    { widths: [30, 70], zebra: true }
  ));
  out.push(H4("Problem Validation"));
  out.push(recordsTable(
    Object.entries(PROBLEM_VALIDATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(H4("First Customer Offer"));
  out.push(recordsTable(
    Object.entries(FIRST_CUSTOMER_OFFER as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(H4("Pilot Conversion"));
  out.push(recordsTable(
    Object.entries(PILOT_CONVERSION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("32.8 Revenue Classification"));
  out.push(recordsTable(
    REVENUE_CLASSIFICATION as any[],
    [
      ["Class", (c) => c.class ?? c.name],
      ["Definition", (c) => c.definition ?? "—"],
      ["Current Value", (c) => String(c.current ?? "—")],
    ],
    { widths: [25, 55, 20], zebra: true }
  ));
  out.push(Quote(REVENUE_RULE));

  out.push(H3("32.9 Relationship Map Schema"));
  out.push(recordsTable(
    RELATIONSHIP_MAP_SCHEMA as any[],
    [
      ["Field", (f) => f.field ?? f.name],
      ["Type", (f) => f.type ?? "—"],
      ["Description", (f) => f.description ?? "—"],
    ],
    { widths: [25, 18, 57], zebra: true }
  ));
  out.push(PLead("Strength Scale", (RELATIONSHIP_STRENGTH_SCALE as any[]).join(", ")));
  out.push(Quote(RELATIONSHIP_RULE));
  out.push(PLead("Relationships Recorded", String(RELATIONSHIPS_RECORDED)));

  out.push(H3("32.10 Introduction Engine"));
  out.push(recordsTable(
    Object.entries(INTRODUCTION_ENGINE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("32.11 Daily Command"));
  out.push(recordsTable(
    Object.entries(DAILY_COMMAND as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("32.12 Conversion Funnel (14 Stages)"));
  out.push(recordsTable(
    CONVERSION_FUNNEL as any[],
    [
      ["Stage", (s) => s.stage ?? s.name],
      ["Definition", (s) => s.definition ?? "—"],
      ["Conversion Rate", (s) => String(s.conversionRate ?? "—")],
    ],
    { widths: [25, 50, 25], zebra: true }
  ));
  out.push(Quote(FUNNEL_RULE));

  out.push(H3("32.13 Weekly Review"));
  out.push(recordsTable(
    WEEKLY_REVIEW as any[],
    [
      ["Section", (s) => s.section ?? s.name],
      ["Purpose", (s) => s.purpose ?? "—"],
    ],
    { widths: [30, 70], zebra: true }
  ));
  out.push(Quote(WEEKLY_REVIEW_RULE));

  out.push(H3("32.14 Market Learning Loop & Lost Deal Reasons"));
  out.push(recordsTable(
    Object.entries(MARKET_LEARNING_LOOP as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(PLead("Lost Deal Reasons", (LOST_DEAL_REASONS as any[]).join(", ")));
  out.push(recordsTable(
    Object.entries(LOST_DEAL_RULE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("32.15 Evidence Hierarchy (E0-E9)"));
  out.push(recordsTable(
    EVIDENCE_HIERARCHY as any[],
    [
      ["Level", (e) => e.level ?? e.name],
      ["Name", (e) => e.name ?? "—"],
      ["Meaning", (e) => e.meaning ?? "—"],
    ],
    { widths: [12, 28, 60], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(EVIDENCE_HIERARCHY_RULE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("32.16 Brain AI Market Agent"));
  out.push(recordsTable(
    Object.entries(BRAIN_AI_MARKET_AGENT as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("32.17 Weekly Execution Targets"));
  out.push(recordsTable(
    WEEKLY_EXECUTION_TARGETS as any[],
    [
      ["Section", (s) => s.section ?? s.name],
      ["Target", (s) => cell((s as any).target)],
    ],
    { widths: [40, 60], zebra: true }
  ));
  out.push(Quote(WEEKLY_TARGET_RULE));

  out.push(H3("32.18 Founder Time Allocation"));
  out.push(recordsTable(
    FOUNDER_TIME_ALLOCATION as any[],
    [
      ["Activity", (a) => a.activity ?? a.name],
      ["Target %", (a) => String(a.target ?? a.pct ?? "—")],
    ],
    { widths: [60, 40], zebra: true }
  ));
  out.push(Quote(TIME_ALLOCATION_RULE));

  out.push(H3("32.19 First Customer / Partner Standards"));
  out.push(recordsTable(
    Object.entries(FIRST_CUSTOMER_STANDARD as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(FIRST_PARTNER_STANDARD as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("32.20 Regulatory Activation & Language"));
  out.push(recordsTable(
    Object.entries(REGULATORY_ACTIVATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(PLead("Regulatory Status Language", (REGULATORY_STATUS_LANGUAGE as any[]).join(" | ")));
  out.push(Quote(REGULATORY_LANGUAGE_RULE));

  out.push(H3("32.21 Data Integrity & Honest Certification"));
  out.push(recordsTable(
    Object.entries(DATA_INTEGRITY as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(HONEST_CERTIFICATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("32.22 COO Directive & Synchronization"));
  out.push(recordsTable(
    Object.entries(COO_DIRECTIVE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(MAS_SYNCHRONIZATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 33 — CUSTOMER CONVERSION (CPR v1.0)
// ───────────────────────────────────────────────────────────────────
export function vol33(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 33 — Customer Conversion & Revenue Evidence (CPR v1.0)"));
  out.push(P([
    `Version: ${CPR_VERSION} (frozen ${CPR_FROZEN_AT}). `,
    `Source: src/lib/aurienta/customer-conversion.ts (694 lines). `,
    `24-stage conversion workflow, 10-field problem validation, 10-criterion qualification gate, 6 commercial offer states, 7-element pilot success, revenue evidence chain, 8-state reference engine, E0-E9 promotion rejection.`,
  ]));

  out.push(H3("33.1 Current Baseline"));
  out.push(recordsTable(
    Object.entries(CURRENT_BASELINE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Metric", (r) => r.k],
      ["Value", (r) => cell(r.v)],
    ],
    { widths: [40, 60], zebra: true }
  ));

  out.push(H3("33.2 Evidence Hierarchy (E0-E9)"));
  out.push(recordsTable(
    EVIDENCE_HIERARCHY_CPR as any[],
    [
      ["Level", (e) => e.level],
      ["Name", (e) => e.name],
      ["Meaning", (e) => e.meaning],
      ["Promotion Requirement", (e) => e.promotionRequirement],
    ],
    { widths: [8, 18, 35, 39], zebra: true }
  ));
  out.push(H4("Invalid Promotion Examples"));
  out.push(recordsTable(
    INVALID_PROMOTION_EXAMPLES as any[],
    [
      ["From", (e) => e.from ?? e.claimedLevel ?? "—"],
      ["To", (e) => e.to ?? e.attemptedLevel ?? "—"],
      ["Reason", (e) => e.reason ?? "—"],
    ],
    { widths: [15, 15, 70], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(PROMOTION_RULE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("33.3 Customer Conversion Workflow (24 Stages)"));
  out.push(recordsTable(
    CUSTOMER_CONVERSION_WORKFLOW as any[],
    [
      ["#", (s) => String(s.stage ?? s.order ?? s.step ?? "—")],
      ["Stage", (s) => s.name ?? s.stage],
      ["Entry Criteria", (s) => s.entryCriteria ?? s.entry ?? "—"],
      ["Exit Criteria", (s) => s.exitCriteria ?? s.exit ?? "—"],
      ["Owner", (s) => s.owner ?? "—"],
      ["Evidence", (s) => s.evidence ?? "—"],
    ],
    { widths: [5, 18, 22, 22, 13, 20], zebra: true }
  ));
  out.push(PLead("Conversion Opportunities", String(CONVERSION_OPPORTUNITIES)));

  out.push(H3("33.4 Problem Validation (10 Fields)"));
  out.push(recordsTable(
    PROBLEM_VALIDATION_STRENGTHENED as any[],
    [
      ["Field", (f) => f.field ?? f.name],
      ["Type", (f) => f.type ?? "—"],
      ["Description", (f) => f.description ?? "—"],
    ],
    { widths: [25, 18, 57], zebra: true }
  ));
  out.push(Quote(PROBLEM_VALIDATION_RULE));

  out.push(H3("33.5 Qualification Gate (10 Criteria)"));
  out.push(recordsTable(
    QUALIFICATION_GATE_CRITERIA as any[],
    [
      ["Criterion", (c) => c.criterion ?? c.name],
      ["Required Evidence", (c) => c.evidence ?? c.requiredEvidence ?? "—"],
      ["Pass Threshold", (c) => String(c.threshold ?? "—")],
    ],
    { widths: [25, 50, 25], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(QUALIFICATION_GATE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("33.6 Commercial Offer States (6)"));
  out.push(recordsTable(
    COMMERCIAL_OFFER_STATES as any[],
    [
      ["State", (s) => s.state ?? s.name],
      ["Definition", (s) => s.definition ?? "—"],
      ["Transition Requirement", (s) => s.transitionRequirement ?? s.transition ?? "—"],
    ],
    { widths: [25, 35, 40], zebra: true }
  ));
  out.push(Quote(COMMERCIAL_OFFER_RULE));

  out.push(H3("33.7 Pilot Requirements & Success Package"));
  out.push(recordsTable(
    PILOT_REQUIREMENTS as any[],
    [
      ["Requirement", (r) => r.requirement ?? r.name],
      ["Description", (r) => r.description ?? "—"],
    ],
    { widths: [30, 70], zebra: true }
  ));
  out.push(Quote(PILOT_RULE));
  out.push(H4("Pilot Success Package (7 Elements)"));
  out.push(recordsTable(
    PILOT_SUCCESS_PACKAGE as any[],
    [
      ["Element", (e) => e.element ?? e.name],
      ["Required Evidence", (e) => e.evidence ?? e.requiredEvidence ?? "—"],
    ],
    { widths: [30, 70], zebra: true }
  ));
  out.push(Quote(PILOT_SUCCESS_RULE));

  out.push(H3("33.8 Revenue Tracking & Evidence Chain"));
  out.push(recordsTable(
    REVENUE_TRACKING as any[],
    [
      ["Field", (f) => f.field ?? f.name],
      ["Type", (f) => f.type ?? "—"],
      ["Description", (f) => f.description ?? "—"],
    ],
    { widths: [25, 18, 57], zebra: true }
  ));
  out.push(Quote(REVENUE_CRITICAL_RULE));
  out.push(recordsTable(
    Object.entries(REVENUE_EVIDENCE_CHAIN as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("33.9 Outcome Engine & Metrics"));
  out.push(recordsTable(
    OUTCOME_ENGINE as any[],
    [
      ["Phase", (p) => p.phase ?? p.name],
      ["Definition", (p) => p.definition ?? "—"],
    ],
    { widths: [30, 70], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(OUTCOME_METRICS as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Metric", (r) => r.k],
      ["Target", (r) => cell(r.v)],
    ],
    { widths: [50, 50], zebra: true }
  ));

  out.push(H3("33.10 Reference Engine"));
  out.push(Quote(CPR_REFERENCE_RULE));
  out.push(H4("Lost Opportunity Reasons"));
  out.push(recordsTable(
    LOST_OPPORTUNITY_REASONS as any[],
    [
      ["Reason", (r) => r.reason ?? r.name],
      ["Description", (r) => r.description ?? "—"],
    ],
    { widths: [30, 70], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(LOST_DEAL_RULE_CPR as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("33.11 Customer Evidence Events"));
  out.push(recordsTable(
    CUSTOMER_EVIDENCE_EVENTS as any[],
    [
      ["Event", (e) => e.event ?? e.name],
      ["Trigger", (e) => e.trigger ?? "—"],
      ["Evidence Generated", (e) => e.evidence ?? "—"],
    ],
    { widths: [25, 35, 40], zebra: true }
  ));
  out.push(H4("Evidence Record Fields"));
  out.push(recordsTable(
    EVIDENCE_RECORD_FIELDS as any[],
    [
      ["Field", (f) => f.field ?? f.name],
      ["Type", (f) => f.type ?? "—"],
      ["Description", (f) => f.description ?? "—"],
    ],
    { widths: [25, 18, 57], zebra: true }
  ));
  out.push(Quote(EVIDENCE_LEDGER_RULE));

  out.push(H3("33.12 Founder Execution Score"));
  out.push(recordsTable(
    FOUNDER_EXECUTION_SCORE as any[],
    [
      ["Activity", (a) => a.activity ?? a.name],
      ["Weight", (a) => String(a.weight ?? "—")],
      ["Current Count", (a) => String(a.currentCount ?? a.current ?? "—")],
    ],
    { widths: [50, 20, 30], zebra: true }
  ));
  out.push(Quote(EXECUTION_SCORE_RULE));
  out.push(PLead("Current Execution Score", String(CURRENT_EXECUTION_SCORE)));

  out.push(H3("33.13 Weekly COO Review"));
  out.push(recordsTable(
    WEEKLY_COO_REVIEW as any[],
    [
      ["Metric", (m) => m.metric ?? m.name],
      ["Target", (m) => String(m.target ?? "—")],
      ["Current", (m) => String(m.current ?? "—")],
    ],
    { widths: [50, 25, 25], zebra: true }
  ));
  out.push(Quote(CPR_WEEKLY_REVIEW_RULE));

  out.push(H3("33.14 Validation Gates (7)"));
  out.push(recordsTable(
    VALIDATION_GATES_CPR as any[],
    [
      ["Gate", (g) => g.gate ?? g.name],
      ["Pass Criteria", (g) => g.passCriteria ?? g.criteria ?? "—"],
      ["Status", (g) => g.status ?? "—"],
    ],
    { widths: [25, 55, 20], zebra: true }
  ));
  out.push(Quote(GATE_RULE_CPR));

  out.push(H3("33.15 Brain AI Conversion Agent"));
  out.push(recordsTable(
    Object.entries(BRAIN_AI_CONVERSION_AGENT as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("33.16 Claim Control Matrix"));
  out.push(recordsTable(
    CLAIM_CONTROL_MATRIX as any[],
    [
      ["Claim", (c) => c.claim ?? c.name],
      ["Honest Phrasing", (c) => c.honestPhrasing ?? "—"],
      ["Evidence Required", (c) => c.evidence ?? "—"],
    ],
    { widths: [25, 45, 30], zebra: true }
  ));
  out.push(Quote(CLAIM_CONTROL_RULE));

  out.push(H3("33.17 Founder Daily Priorities"));
  out.push(recordsTable(
    Object.entries(FOUNDER_DAILY_PRIORITIES as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("33.18 Honest Certification & Final COO Principle"));
  out.push(recordsTable(
    Object.entries(HONEST_CERTIFICATION_CPR as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(FINAL_COO_PRINCIPLE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("33.19 CPR Synchronization"));
  out.push(recordsTable(
    Object.entries(CPR_SYNCHRONIZATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 34 — STRATEGIC PARTNERS (SPRRE v1.0)
// ───────────────────────────────────────────────────────────────────
export function vol34(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 34 — Strategic Partners, Regulatory & Relationship Engine (SPRRE v1.0)"));
  out.push(P([
    `Version: ${SPRRE_VERSION} (frozen ${SPRRE_FROZEN_AT}). `,
    `Source: src/lib/aurienta/strategic-partners.ts (814 lines). `,
    `16 partner categories, 30-field schema, 10-dimension scoring, law-firm-first campaign, 12-state outreach, 15-status regulatory model, 17-section brief generator, 20-entity relationship graph, 18 DD checks, 10 agreement types, 9 activation requirements.`,
  ]));

  out.push(H3("34.1 Current Baseline"));
  out.push(recordsTable(
    Object.entries(CURRENT_BASELINE_SPRRE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Metric", (r) => r.k],
      ["Value", (r) => cell(r.v)],
    ],
    { widths: [40, 60], zebra: true }
  ));

  out.push(H3("34.2 Partner Categories (16)"));
  out.push(recordsTable(
    PARTNER_CATEGORIES as any[],
    [
      ["Category", (c) => c.category ?? c.name],
      ["Type", (c) => c.type ?? "—"],
      ["Strategic Role", (c) => c.strategicRole ?? c.role ?? "—"],
    ],
    { widths: [25, 18, 57], zebra: true }
  ));
  out.push(Quote(PARTNER_CATEGORY_RULE));

  out.push(H3("34.3 Partner Target Schema (30 Fields)"));
  out.push(recordsTable(
    PARTNER_TARGET_SCHEMA as any[],
    [
      ["Field", (f) => f.field ?? f.name],
      ["Type", (f) => f.type ?? "—"],
      ["Description", (f) => f.description ?? "—"],
    ],
    { widths: [25, 18, 57], zebra: true }
  ));
  out.push(Quote(PARTNER_SCHEMA_RULE));

  out.push(H3("34.4 Partner Scoring Dimensions (10)"));
  out.push(recordsTable(
    PARTNER_SCORING_DIMENSIONS as any[],
    [
      ["Dimension", (d) => d.dimension ?? d.name],
      ["Weight", (d) => String(d.weight ?? "—")],
      ["Description", (d) => d.description ?? "—"],
    ],
    { widths: [25, 12, 63], zebra: true }
  ));
  out.push(H4("Scoring Model"));
  out.push(recordsTable(
    Object.entries(PARTNER_SCORING_MODEL as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("34.5 Law-Firm-First Campaign"));
  out.push(recordsTable(
    LAW_FIRM_CAMPAIGN_SCHEMA as any[],
    [
      ["Field", (f) => f.field ?? f.name],
      ["Type", (f) => f.type ?? "—"],
      ["Description", (f) => f.description ?? "—"],
    ],
    { widths: [25, 18, 57], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(LAW_FIRM_CAMPAIGN as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("34.6 Partner Outreach (12-State Lifecycle)"));
  out.push(recordsTable(
    PARTNER_OUTREACH_SCHEMA as any[],
    [
      ["Field", (f) => f.field ?? f.name],
      ["Type", (f) => f.type ?? "—"],
      ["Description", (f) => f.description ?? "—"],
    ],
    { widths: [25, 18, 57], zebra: true }
  ));
  out.push(PLead("Outreach Lifecycle", (PARTNER_OUTREACH_LIFECYCLE as any[]).join(" → ")));
  out.push(Quote(OUTREACH_RULE));
  out.push(H4("Introduction Paths"));
  for (const p of INTRODUCTION_PATHS as any[]) out.push(Bullet(typeof p === "string" ? p : JSON.stringify(p)));
  out.push(recordsTable(
    Object.entries(INTRODUCTION_ENGINE_SPRRE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("34.7 Regulatory Authority Schema & 15-Status Model"));
  out.push(recordsTable(
    REGULATORY_AUTHORITY_SCHEMA as any[],
    [
      ["Field", (f) => f.field ?? f.name],
      ["Type", (f) => f.type ?? "—"],
      ["Description", (f) => f.description ?? "—"],
    ],
    { widths: [25, 18, 57], zebra: true }
  ));
  out.push(PLead("Egypt Authority Universe", (EGYPT_AUTHORITY_UNIVERSE as any[]).join(", ")));
  out.push(Quote(REGULATORY_ENGINE_RULE));
  out.push(PLead("Regulatory Statuses", (REGULATORY_STATUSES as any[]).join(" | ")));
  out.push(recordsTable(
    Object.entries(REGULATORY_STATUS_RULE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("34.8 Regulatory Brief Generator (17 Sections)"));
  out.push(recordsTable(
    REGULATORY_BRIEF_SECTIONS as any[],
    [
      ["Section", (s) => s.section ?? s.name],
      ["Purpose", (s) => s.purpose ?? "—"],
    ],
    { widths: [30, 70], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(REGULATORY_BRIEF_RULE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("34.9 Relationship Graph"));
  out.push(PLead("Entities", (RELATIONSHIP_GRAPH_ENTITIES as any[]).join(", ")));
  out.push(PLead("Edges", (RELATIONSHIP_GRAPH_EDGES as any[]).join(", ")));
  out.push(H4("Queries"));
  for (const q of RELATIONSHIP_GRAPH_QUERIES as any[]) out.push(Bullet(typeof q === "string" ? q : JSON.stringify(q)));
  out.push(recordsTable(
    Object.entries(RELATIONSHIP_GRAPH_RULE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("34.10 Partnership Value Types & DD Checks"));
  out.push(PLead("Value Types", (PARTNERSHIP_VALUE_TYPES as any[]).join(", ")));
  out.push(Quote(VALUE_CHAIN_RULE));
  out.push(H4("DD Checks (18)"));
  out.push(recordsTable(
    (PARTNER_DD_CHECKS as any[]).map((c, i) => ({ idx: i + 1, c: typeof c === "string" ? c : JSON.stringify(c) })),
    [
      ["#", (r) => String(r.idx)],
      ["Check", (r) => r.c],
    ],
    { widths: [8, 92], zebra: true }
  ));
  out.push(Quote(PARTNER_DD_RULE));

  out.push(H3("34.11 Agreement Types (10) & State Distinctions"));
  out.push(PLead("Agreement Types", (AGREEMENT_TYPES as any[]).join(", ")));
  out.push(recordsTable(
    Object.entries(AGREEMENT_STATE_DISTINCTIONS as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["State", (r) => r.k],
      ["Definition", (r) => cell(r.v)],
    ],
    { widths: [30, 70], zebra: true }
  ));
  out.push(Quote(AGREEMENT_RULE));

  out.push(H3("34.12 Activation Requirements (9)"));
  out.push(recordsTable(
    (PARTNER_ACTIVATION_REQUIREMENTS as any[]).map((c, i) => ({ idx: i + 1, c: typeof c === "string" ? c : JSON.stringify(c) })),
    [
      ["#", (r) => String(r.idx)],
      ["Requirement", (r) => r.c],
    ],
    { widths: [8, 92], zebra: true }
  ));
  out.push(Quote(ACTIVATION_RULE));

  out.push(H3("34.13 Partner Performance Metrics & Dependency Map"));
  out.push(PLead("Performance Metrics", (PARTNER_PERFORMANCE_METRICS as any[]).join(", ")));
  out.push(Quote(PERFORMANCE_RULE));
  out.push(recordsTable(
    Object.entries(DEPENDENCY_MAP as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("34.14 Founder Daily Command"));
  out.push(recordsTable(
    Object.entries(FOUNDER_DAILY_COMMAND_SPRRE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("34.15 Weekly Review"));
  out.push(recordsTable(
    WEEKLY_REVIEW_SPRRE as any[],
    [
      ["Metric", (m) => m.metric ?? m.name],
      ["Actual", (m) => String(m.actual ?? "—")],
      ["Target", (m) => String(m.target ?? "—")],
      ["Forecast", (m) => String(m.forecast ?? "—")],
    ],
    { widths: [40, 20, 20, 20], zebra: true }
  ));
  out.push(Quote(SPRRE_WEEKLY_REVIEW_RULE));

  out.push(H3("34.16 Execution Funnel"));
  out.push(recordsTable(
    EXECUTION_FUNNEL_SPRRE as any[],
    [
      ["Stage", (s) => s.stage ?? s.name],
      ["Current", (s) => String(s.current ?? "—")],
      ["Target", (s) => String(s.target ?? "—")],
    ],
    { widths: [50, 25, 25], zebra: true }
  ));
  out.push(Quote(SPRRE_FUNNEL_RULE));

  out.push(H3("34.17 Brain AI Institutional Agent"));
  out.push(recordsTable(
    Object.entries(BRAIN_AI_INSTITUTIONAL_AGENT as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("34.18 Claim Control & Execution Score"));
  out.push(recordsTable(
    CLAIM_CONTROL_SPRRE as any[],
    [
      ["Claim", (c) => c.claim ?? c.name],
      ["Honest Phrasing", (c) => c.honestPhrasing ?? "—"],
      ["Evidence Required", (c) => c.evidence ?? "—"],
    ],
    { widths: [25, 45, 30], zebra: true }
  ));
  out.push(Quote(SPRRE_CLAIM_CONTROL_RULE));
  out.push(recordsTable(
    EXECUTION_SCORE_SPRRE as any[],
    [
      ["Dimension", (d) => d.dimension ?? d.name],
      ["Weight", (d) => String(d.weight ?? "—")],
      ["Current", (d) => String(d.current ?? "—")],
    ],
    { widths: [50, 20, 30], zebra: true }
  ));
  out.push(PLead("Overall Execution Score", String(OVERALL_EXECUTION_SCORE)));
  out.push(Quote(SPRRE_SCORE_RULE));

  out.push(H3("34.19 30-Day Plan"));
  out.push(recordsTable(
    THIRTY_DAY_PLAN as any[],
    [
      ["Phase", (p) => p.phase ?? p.name],
      ["Focus", (p) => p.focus ?? "—"],
      ["Status", (p) => p.status ?? "—"],
    ],
    { widths: [25, 50, 25], zebra: true }
  ));
  out.push(Quote(PLAN_RULE));

  out.push(H3("34.20 Honest Certification & Final COO Directive"));
  out.push(recordsTable(
    Object.entries(HONEST_CERTIFICATION_SPRRE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(FINAL_COO_DIRECTIVE_SPRRE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("34.21 SPRRE Synchronization"));
  out.push(recordsTable(
    Object.entries(SPRRE_SYNCHRONIZATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 35 — EXECUTION WAR ROOM (FIEW v1.0)
// ───────────────────────────────────────────────────────────────────
export function vol35(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 35 — Founder Institutional Execution War Room (FIEW v1.0)"));
  out.push(P([
    `Version: ${FIEW_VERSION} (frozen ${FIEW_FROZEN_AT}). `,
    `Source: src/lib/aurienta/execution-war-room.ts (568 lines). `,
    `Founder identity (Mohamed Eltonsy), 4-week plan, Top 5 ranking formula, 35 metrics across 3 scoreboards, blocker engine, execution vs activity, truth models, 16 success criteria.`,
  ]));

  out.push(H3("35.1 Founder Identity"));
  out.push(recordsTable(
    Object.entries(FOUNDER_IDENTITY as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("35.2 FIEW Baseline"));
  out.push(recordsTable(
    Object.entries(FIEW_BASELINE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("35.3 War Room Questions"));
  out.push(recordsTable(
    Object.entries(WAR_ROOM_QUESTIONS as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Question", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [30, 70], zebra: true }
  ));

  out.push(H3("35.4 Action Ranking Formula"));
  out.push(recordsTable(
    Object.entries(ACTION_RANKING_FORMULA as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(PLead("Action Fields", (ACTION_FIELDS as any[]).join(", ")));

  out.push(H3("35.5 Three Scoreboards (35 Metrics)"));
  out.push(H4("Customer Scoreboard"));
  out.push(recordsTable(
    CUSTOMER_SCOREBOARD as any[],
    [
      ["Metric", (m) => m.metric ?? m.name],
      ["Current", (m) => String(m.current ?? "—")],
      ["Target", (m) => String(m.target ?? "—")],
    ],
    { widths: [50, 25, 25], zebra: true }
  ));
  out.push(H4("Partner Scoreboard"));
  out.push(recordsTable(
    PARTNER_SCOREBOARD as any[],
    [
      ["Metric", (m) => m.metric ?? m.name],
      ["Current", (m) => String(m.current ?? "—")],
      ["Target", (m) => String(m.target ?? "—")],
    ],
    { widths: [50, 25, 25], zebra: true }
  ));
  out.push(H4("Regulatory Scoreboard"));
  out.push(recordsTable(
    REGULATORY_SCOREBOARD as any[],
    [
      ["Metric", (m) => m.metric ?? m.name],
      ["Current", (m) => String(m.current ?? "—")],
      ["Target", (m) => String(m.target ?? "—")],
    ],
    { widths: [50, 25, 25], zebra: true }
  ));

  out.push(H3("35.6 30-Day Weekly Plan (4 Weeks)"));
  out.push(recordsTable(
    THIRTY_DAY_WEEKLY_PLAN as any[],
    [
      ["Week", (w) => String(w.week ?? w.order ?? "—")],
      ["Focus", (w) => w.focus ?? "—"],
      ["Activities", (w) => cell((w as any).activities)],
      ["Outcome", (w) => w.outcome ?? "—"],
    ],
    { widths: [8, 22, 45, 25], zebra: true }
  ));
  out.push(Quote(WEEKLY_RULE));

  out.push(H3("35.7 Founder Time Allocation"));
  out.push(recordsTable(
    FIEW_TIME as any[],
    [
      ["Activity", (a) => a.activity ?? a.name],
      ["Target %", (a) => String(a.target ?? a.pct ?? "—")],
    ],
    { widths: [60, 40], zebra: true }
  ));
  out.push(Quote(TIME_RULE));

  out.push(H3("35.8 Blocker Engine"));
  out.push(recordsTable(
    BLOCKER_FIELDS as any[],
    [
      ["Field", (f) => f.field ?? f.name],
      ["Description", (f) => f.description ?? "—"],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(PLead("Blocker Severity Levels", (BLOCKER_SEVERITY as any[]).join(", ")));
  out.push(Quote(TOP_5_BLOCKERS_RULE));

  out.push(H3("35.9 Activity vs Outcome"));
  out.push(recordsTable(
    Object.entries(ACTIVITY_VS_OUTCOME as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("35.10 Objection Engine"));
  out.push(recordsTable(
    OBJECTION_FIELDS as any[],
    [
      ["Field", (f) => f.field ?? f.name],
      ["Description", (f) => f.description ?? "—"],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(PLead("Objection Frequency Thresholds", (OBJECTION_FREQUENCY as any[]).join(", ")));
  out.push(Quote(OBJECTION_RULE));
  out.push(PLead("Product Change Flow", (PRODUCT_CHANGE_FLOW as any[]).join(" → ")));
  out.push(Quote(PRODUCT_CHANGE_RULE));

  out.push(H3("35.11 Truth Models"));
  out.push(recordsTable(
    Object.entries(COMMERCIAL_TRUTH_MODEL as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(PARTNER_TRUTH_MODEL as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(REGULATORY_TRUTH_MODEL as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("35.12 Evidence Records"));
  out.push(PLead("Evidence Events", (EVIDENCE_EVENTS as any[]).join(", ")));
  out.push(recordsTable(
    EVIDENCE_RECORD_FIELDS as any[],
    [
      ["Field", (f) => f.field ?? f.name],
      ["Description", (f) => f.description ?? "—"],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(Quote(EVIDENCE_RULE));

  out.push(H3("35.13 Brain AI Execution Chief of Staff"));
  out.push(recordsTable(
    Object.entries(BRAIN_AI_EXECUTION_COS as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("35.14 Founder Execution Score"));
  out.push(recordsTable(
    FOUNDER_EXECUTION_SCORE_FIEW as any[],
    [
      ["Dimension", (d) => d.dimension ?? d.name],
      ["Weight", (d) => String(d.weight ?? "—")],
      ["Current", (d) => String(d.current ?? "—")],
    ],
    { widths: [50, 20, 30], zebra: true }
  ));
  out.push(PLead("Overall Execution Score", String(OVERALL_EXECUTION_SCORE_FIEW)));
  out.push(Quote(SCORE_RULE_FIEW));

  out.push(H3("35.15 Success Criteria (16)"));
  out.push(recordsTable(
    SUCCESS_CRITERIA as any[],
    [
      ["#", (c) => String(c.id ?? c.order ?? "—")],
      ["Criterion", (c) => c.criterion ?? c.name],
      ["Target", (c) => c.target ?? "—"],
    ],
    { widths: [6, 60, 34], zebra: true }
  ));
  out.push(Quote(SUCCESS_RULE));

  out.push(H3("35.16 Day-30 Review"));
  out.push(recordsTable(
    (DAY_30_REVIEW as any[]).map((r, i) => ({ idx: i + 1, r: typeof r === "string" ? r : JSON.stringify(r) })),
    [
      ["#", (x) => String(x.idx)],
      ["Item", (x) => x.r],
    ],
    { widths: [8, 92], zebra: true }
  ));

  out.push(H3("35.17 Honest Certification & Final COO Directive"));
  out.push(recordsTable(
    Object.entries(HONEST_CERTIFICATION_FIEW as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  out.push(recordsTable(
    Object.entries(FINAL_COO_DIRECTIVE_FIEW as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("35.18 FIEW Synchronization"));
  out.push(recordsTable(
    Object.entries(FIEW_SYNCHRONIZATION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 36 — FIRST-25 REAL MARKET RESEARCH
// ───────────────────────────────────────────────────────────────────
export function vol36(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 36 — First-25 Real Market Research"));
  out.push(P([
    `Date: ${RESEARCH_DATE}. Researcher: ${RESEARCHER}. Evidence level: ${RESEARCH_EVIDENCE_LEVEL}. `,
    `Source: src/lib/aurienta/first-25-research.ts (718 lines). `,
    `25 Egyptian targets (2 P0, 7 P1, 12 P2, 4 P3), 5 law firms (all PARTNER TARGETS), 3 regulatory authorities, 5 outreach drafts, 4 verified decision-makers.`,
  ]));
  out.push(Quote(RESEARCH_DISCLAIMER));

  out.push(H3("36.1 25 Egyptian Target Accounts"));
  out.push(P("The full target account list, including organization, sector, source, tier, qualification score, decision-maker (where verified), and notes."));
  out.push(recordsTable(
    FIRST_25_TARGETS,
    [
      ["ID", (t) => t.id],
      ["Organization", (t) => t.organization],
      ["Sector", (t) => t.sector],
      ["Tier", (t) => t.tier],
      ["Score", (t) => t.qualificationScore.toFixed(1)],
      ["Decision Maker", (t) => t.decisionMaker],
      ["Role", (t) => t.decisionMakerRole],
      ["Confidence", (t) => t.decisionMakerConfidence],
      ["Status", (t) => t.status],
    ],
    { widths: [5, 16, 12, 5, 6, 14, 16, 8, 8], zebra: true }
  ));

  out.push(H3("36.2 Target Detail (with Problem Hypotheses)"));
  for (const t of FIRST_25_TARGETS) {
    out.push(H4(`${t.id} — ${t.organization} (${t.tier})`));
    out.push(PLead("Sector", t.sector));
    out.push(PLead("Source", t.source));
    out.push(PLead("Source Confidence", t.sourceConfidence));
    out.push(PLead("Organization Type", t.organizationType));
    out.push(PLead("Approximate Size", t.approximateSize));
    out.push(PLead("City", t.city));
    out.push(PLead("Qualification Score", t.qualificationScore.toFixed(2)));
    out.push(PLead("Decision Maker", t.decisionMaker));
    out.push(PLead("Decision Maker Role", t.decisionMakerRole));
    out.push(PLead("Decision Maker Source", t.decisionMakerSource));
    out.push(PLead("Decision Maker Confidence", t.decisionMakerConfidence));
    out.push(PLead("Likely Use Case", t.likelyUseCase));
    out.push(PLead("Problem Hypothesis", t.problemHypothesis));
    out.push(PLead("Evidence Level", t.evidenceLevel));
    out.push(PLead("Status", t.status));
    out.push(PLead("Notes", t.notes));
  }

  out.push(H3("36.3 Law Firm Candidates (5 — All Partner Targets)"));
  out.push(recordsTable(
    LAW_FIRM_CANDIDATES,
    [
      ["ID", (l) => l.id ?? "—"],
      ["Firm", (l) => l.firm ?? l.name],
      ["Specialization", (l) => l.specialization ?? "—"],
      ["Status", (l) => l.status ?? "—"],
    ],
    { widths: [8, 30, 40, 22], zebra: true }
  ));
  out.push(H4("Law Firm Candidate Detail"));
  for (const l of LAW_FIRM_CANDIDATES as any[]) {
    out.push(H4(`${l.id ?? "—"} — ${l.firm ?? l.name}`));
    out.push(recordsTable(
      Object.entries(l).filter(([k]) => k !== "id" && k !== "firm" && k !== "name").map(([k, v]) => ({ k, v: v as any })),
      [
        ["Field", (r) => r.k],
        ["Detail", (r) => cell(r.v)],
      ],
      { widths: [25, 75], zebra: true }
    ));
  }

  out.push(H3("36.4 Regulatory Research (3 Authorities)"));
  out.push(recordsTable(
    REGULATORY_RESEARCH_RESULTS,
    [
      ["Authority", (r) => r.authority ?? r.name],
      ["Engagement Approach", (r) => r.engagement ?? r.approach ?? "—"],
      ["Status", (r) => r.status ?? "—"],
    ],
    { widths: [25, 50, 25], zebra: true }
  ));
  out.push(H4("Regulatory Detail"));
  for (const r of REGULATORY_RESEARCH_RESULTS as any[]) {
    out.push(H4(r.authority ?? r.name));
    out.push(recordsTable(
      Object.entries(r).filter(([k]) => k !== "authority" && k !== "name").map(([k, v]) => ({ k, v: v as any })),
      [
        ["Field", (x) => x.k],
        ["Detail", (x) => cell(x.v)],
      ],
      { widths: [25, 75], zebra: true }
    ));
  }

  out.push(H3("36.5 First 5 Outreach Drafts"));
  for (const d of FIRST_5_OUTREACH_DRAFTS) {
    out.push(H4(`${d.id} — ${d.target}`));
    out.push(PLead("Channel", d.channel ?? "—"));
    out.push(PLead("Subject", d.subject ?? "—"));
    out.push(PLead("Body", d.body ?? d.message ?? "—"));
  }

  out.push(H3("36.6 Execution Report"));
  out.push(recordsTable(
    Object.entries(EXECUTION_REPORT as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("36.7 Final Honest Statement"));
  out.push(recordsTable(
    Object.entries(FINAL_HONEST_STATEMENT as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// VOLUME 37 — CONSTITUTIONAL AUDIT & REALIGNMENT
// ───────────────────────────────────────────────────────────────────
export function vol37(): Block[] {
  const out: Block[] = [];
  out.push(H2("Volume 37 — Constitutional Audit & Realignment"));
  out.push(P([
    `Audit date: ${AUDIT_DATE}. Source: src/lib/aurienta/constitutional-audit.ts (452 lines). `,
    `16-section audit report (A-P), 17 invariants verification, drift remediation, center-of-gravity restoration.`,
  ]));

  out.push(H3("37.1 Constitutional Alignment Score"));
  out.push(PLead("Score", `${CONSTITUTIONAL_ALIGNMENT_SCORE}/100`));
  out.push(recordsTable(
    Object.entries(ALIGNMENT_BREAKDOWN as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Dimension", (r) => r.k],
      ["Score", (r) => cell(r.v)],
    ],
    { widths: [50, 50], zebra: true }
  ));

  out.push(H3("37.2 Vision Preservation Score"));
  out.push(PLead("Score", `${VISION_PRESERVATION_SCORE}/100`));
  out.push(recordsTable(
    Object.entries(VISION_FINDINGS as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("37.3 Drift Score"));
  out.push(PLead("Score", `${DRIFT_SCORE}/100 (lower is better)`));
  for (const f of DRIFT_FINDINGS as any[]) out.push(Bullet(typeof f === "string" ? f : JSON.stringify(f)));

  out.push(H3("37.4 Constitutional Integrity"));
  out.push(PLead("Integrity", String(CONSTITUTIONAL_INTEGRITY)));
  out.push(recordsTable(
    Object.entries(INTEGRITY_FINDINGS as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("37.5 Core Gaps"));
  for (const g of CORE_GAPS as any[]) out.push(Bullet(typeof g === "string" ? g : JSON.stringify(g)));

  out.push(H3("37.6 Drift (Detailed)"));
  for (const d of DRIFT_DETAILED as any[]) out.push(Bullet(typeof d === "string" ? d : JSON.stringify(d)));

  out.push(H3("37.7 Preserved Core"));
  for (const p of PRESERVED_CORE as any[]) out.push(Bullet(typeof p === "string" ? p : JSON.stringify(p)));

  out.push(H3("37.8 Missing Core"));
  for (const m of MISSING_CORE as any[]) out.push(Bullet(typeof m === "string" ? m : JSON.stringify(m)));

  out.push(H3("37.9 Commercialization Drift"));
  out.push(recordsTable(
    Object.entries(COMMERCIALIZATION_DRIFT as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("37.10 Enterprise Lifecycle Drift"));
  out.push(recordsTable(
    Object.entries(ENTERPRISE_LIFECYCLE as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("37.11 Graduation Integrity"));
  out.push(recordsTable(
    Object.entries(GRADUATION_INTEGRITY as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("37.12 Terminology Integrity"));
  out.push(recordsTable(
    Object.entries(TERMINOLOGY_INTEGRITY as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("37.13 Brain AI Alignment"));
  out.push(recordsTable(
    Object.entries(BRAIN_AI_ALIGNMENT as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("37.14 Do-Not-Change List"));
  out.push(recordsTable(
    (DO_NOT_CHANGE_LIST as any[]).map((c, i) => ({ idx: i + 1, c: typeof c === "string" ? c : JSON.stringify(c) })),
    [
      ["#", (r) => String(r.idx)],
      ["Item", (r) => r.c],
    ],
    { widths: [8, 92], zebra: true }
  ));

  out.push(H3("37.15 Execution-Only List"));
  out.push(recordsTable(
    (EXECUTION_ONLY_LIST as any[]).map((c, i) => ({ idx: i + 1, c: typeof c === "string" ? c : JSON.stringify(c) })),
    [
      ["#", (r) => String(r.idx)],
      ["Item", (r) => r.c],
    ],
    { widths: [8, 92], zebra: true }
  ));

  out.push(H3("37.16 Final Decision"));
  out.push(recordsTable(
    Object.entries(FINAL_DECISION as any).map(([k, v]) => ({ k, v: v as any })),
    [
      ["Field", (r) => r.k],
      ["Detail", (r) => cell(r.v)],
    ],
    { widths: [25, 75], zebra: true }
  ));

  out.push(H3("37.17 Feature Preservation Matrix"));
  out.push(recordsTable(
    FEATURE_PRESERVATION_MATRIX as any[],
    [
      ["Feature", (f) => f.feature ?? f.name],
      ["Status", (f) => f.status ?? "—"],
      ["Evidence", (f) => f.evidence ?? "—"],
      ["Action", (f) => f.action ?? "—"],
    ],
    { widths: [25, 22, 30, 23], zebra: true }
  ));
  return out;
}

export const volumes22to37: Array<{ title: string; fn: () => Block[] }> = [
  { title: "Volume 22", fn: vol22 },
  { title: "Volume 23", fn: vol23 },
  { title: "Volume 24", fn: vol24 },
  { title: "Volume 25", fn: vol25 },
  { title: "Volume 26", fn: vol26 },
  { title: "Volume 27", fn: vol27 },
  { title: "Volume 28", fn: vol28 },
  { title: "Volume 29", fn: vol29 },
  { title: "Volume 30", fn: vol30 },
  { title: "Volume 31", fn: vol31 },
  { title: "Volume 32", fn: vol32 },
  { title: "Volume 33", fn: vol33 },
  { title: "Volume 34", fn: vol34 },
  { title: "Volume 35", fn: vol35 },
  { title: "Volume 36", fn: vol36 },
  { title: "Volume 37", fn: vol37 },
];
