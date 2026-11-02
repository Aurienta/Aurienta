// AURIENTA Master Blueprint v2.0 — Fully Expanded Generator
// Generates the comprehensive DOCX blueprint covering all work from Prompts 1-21.
//
// Usage:
//   cd /home/z/my-project && bun run scripts/generate-expanded-blueprint.ts
//
// Outputs:
//   /home/z/my-project/download/AURIENTA_Blueprint_Modified.docx (overwrites existing)
//   /home/z/my-project/download/AURIENTA_Master_Blueprint_v2.0.docx (versioned copy)
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, AlignmentType, PageBreak, TableOfContents, StyleLevel, SectionType,
  Header, Footer, PageNumber, NumberFormat, BorderStyle, ShadingType, LevelFormat,
  convertInchesToTwip,
} from "docx";
import { writeFileSync, copyFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

import {
  P, H1, H2, H3, H4, Bullet, Quote, PLead, HorizontalRule, PageBreakParagraph,
  makeTable, recordsTable, cell,
  GOLD, DARK_GOLD, NEAR_BLACK, GRAY_TEXT, LIGHT_GRAY_FILL,
  HeaderCell, BodyCell,
} from "./blueprint-helpers";
import { volumes22to37 } from "./blueprint-volumes-22-37";

import {
  APPROVED_TERMS, FORBIDDEN_PATTERNS, validateTerminology, getApprovedTerm,
} from "../src/lib/aurienta/terminology";
import {
  TIER_META, ROLE_META, STAGE_META, STS_LEVELS, HEALTH_RATINGS, SECTORS,
  CONSTITUTIONAL_HASH, PROPOSAL_TYPES, VITAL_SIGNS,
} from "../src/lib/aurienta/constants";
import {
  INSTITUTIONAL_ARCHITECTURE, RACI_MATRIX,
} from "../src/lib/aurienta/institutional-architecture";

const ROOT = "/home/z/my-project";

// ── Helper: read a file safely as string ──
function readFileSafe(p: string): string {
  try {
    return existsSync(p) ? readFileSync(p, "utf8") : "";
  } catch {
    return "";
  }
}

// ───────────────────────────────────────────────────────────────────
// COVER PAGE
// ───────────────────────────────────────────────────────────────────
function coverPage(): Paragraph[] {
  return [
    new Paragraph({ spacing: { before: 2400 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: "AURIENTA", bold: true, color: GOLD, size: 144, font: "Georgia" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: "Constitutional Enterprise Infrastructure", italics: true, color: NEAR_BLACK, size: 40, font: "Georgia" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "Master Blueprint v2.0", bold: true, color: DARK_GOLD, size: 36 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
      children: [new TextRun({ text: "Fully Expanded — Incorporating All Modifications, Add-ons, and New Features from Prompts 1–21", italics: true, color: GRAY_TEXT, size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 80 },
      children: [new TextRun({ text: "Founder & Sole Owner", bold: true, color: NEAR_BLACK, size: 26 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "Mohamed Eltonsy", bold: true, color: GOLD, size: 36, font: "Georgia" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [new TextRun({ text: "100% Ownership — No Co-Founders, No Shareholders, No Investors, No Dilution", color: GRAY_TEXT, size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "Constitutional Hash (Root)", bold: true, color: NEAR_BLACK, size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [new TextRun({ text: CONSTITUTIONAL_HASH, color: DARK_GOLD, size: 22, font: "Consolas" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "August 2026", bold: true, color: NEAR_BLACK, size: 26 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 720, after: 80 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 12 },
        bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 12 },
      },
      children: [new TextRun({ text: "“Your capital, your work, your company — no speculation required.”", italics: true, color: NEAR_BLACK, size: 28, font: "Georgia" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 480, after: 80 },
      children: [new TextRun({ text: "This document is the SINGLE SOURCE OF TRUTH.", bold: true, color: NEAR_BLACK, size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "All future work must reference this Master Blueprint v2.0.", italics: true, color: GRAY_TEXT, size: 22 })],
    }),
  ];
}

// ───────────────────────────────────────────────────────────────────
// TABLE OF CONTENTS
// ───────────────────────────────────────────────────────────────────
function tocPage(): (Paragraph | TableOfContents)[] {
  return [
    H1("Table of Contents"),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: 312, after: 240 },
      children: [new TextRun({ text: "This Master Blueprint is organized into six Parts plus Appendices. After opening this document in Microsoft Word or LibreOffice, right-click on the table below and select “Update Field” to populate page numbers.", italics: true, color: GRAY_TEXT, size: 22 })],
    }),
    new TableOfContents("Table of Contents", {
      hyperlink: true,
      headingStyleRange: "1-3",
      stylesWithLevels: [
        new StyleLevel("Heading1", 1),
        new StyleLevel("Heading2", 2),
        new StyleLevel("Heading3", 3),
      ],
    }),
  ];
}

// ───────────────────────────────────────────────────────────────────
// PREAMBLE
// ───────────────────────────────────────────────────────────────────
function preamble(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(H1("Preamble"));
  out.push(P("AURIENTA is a non-custodial Constitutional Infrastructure of Structural Trust. It transforms everyday capital into real-economy corporate ownership through digital constitutional rules that cannot be bent, bypassed, or broken. It eliminates corporate friction through AI-enforced governance so partners can build, own, and scale real businesses until they graduate into sovereign independence: the world's first constitutional launchpad — not crowdfunding, not speculation, not platform dependency."));

  out.push(H3("This Master Blueprint v2.0"));
  out.push(P([
    "This Master Blueprint v2.0 REPLACES all prior versions. The earlier Modified Blueprint (Prompts 1–2) was 387 KB and covered only the original 20 volumes plus Volume 21 (Institutional Architecture). This Expanded Edition incorporates the original 20 volumes (terminology replacements applied), Volume 21 (Institutional Architecture), ",
    "and 22 new volumes (Volumes 22 through 42 plus appendices) covering all 16 institutional systems, P1 enforcement, the enterprise profile system, master reference matrices, constitutional invariants, the evidence hierarchy, and the full repository integrity policy.",
  ]));

  out.push(H3("Founding Principle & Constitutional Hash"));
  out.push(Quote("Your capital, your work, your company — no speculation required."));
  out.push(PLead("Constitutional Hash (Root)", CONSTITUTIONAL_HASH));
  out.push(P("The Constitutional Hash is the cryptographic anchor of the institution. It is reproduced in the Constitution, the Brain AI system prompt, every executed charter, and every audit report. Any drift from this hash signals a constitutional violation that must be remediated immediately."));

  out.push(H3("Single Source of Truth"));
  out.push(P("This Master Blueprint is the single source of truth for AURIENTA's identity, architecture, governance, operations, commercial execution, and institutional readiness. Every document, AI prompt, UI label, legal agreement, code comment, and developer reference must align with this Blueprint. Where prior documents (including the original 953 KB source blueprint) conflict with this Master Blueprint, this Master Blueprint prevails."));

  out.push(H3("Scope of This Edition"));
  out.push(P("This Edition covers, in order:"));
  const items = [
    "Part I — Constitutional Terminology Standard (the 20 approved terms, 10 forbidden regex patterns, validation function, Brain AI enforcement approach).",
    "Part II — Original Blueprint Volumes 0–20 (preserved with terminology replacements applied).",
    "Part III — Volume 21: Institutional Architecture & Corporate Structure (3-entity structure, RACI matrix, IP ownership strategy, regional operating companies).",
    "Part IV — Volumes 22–37: the 16 institutional systems (Governance, Risk/Security/Compliance, AOS, ACS, PH-ER, PE, GLS, FOCC, ITDB, MES, MAS, CPR, SPRRE, FIEW, First-25 Research, Constitutional Audit).",
    "Part V — Volumes 38–39: Constitutional Enforcement (Enterprise Profile System + P1 NOSI & Salary-to-Equity enforcement).",
    "Part VI — Volumes 40–42: Master Reference (Implementation Matrix, 17 Constitutional Invariants, Evidence Hierarchy E0–E9).",
    "Appendices A–J: Terminology Dictionary, RACI Matrix, Automated Validation Checklist, CRE Function Reference, Prisma Schema Summary, API Route Inventory, Page Inventory, Component Inventory, Repository Integrity Policy, Final Certification.",
    "Final Certification Page signed by the Founder & Sole Owner.",
  ];
  for (const item of items) out.push(Bullet(item));

  out.push(H3("Reading Guide"));
  out.push(P("Readers seeking a high-level orientation should begin with the Preamble, Volume 0 (Executive & Regulatory Overview), Volume 1 (Constitutional Identity), Volume 21 (Institutional Architecture), and the Master Implementation Matrix (Volume 40). Readers seeking operational detail should consult the relevant institutional system in Part IV. Readers verifying constitutional compliance should consult the 17 Constitutional Invariants (Volume 41) and the Constitutional Audit (Volume 37)."));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// INSTITUTIONAL ARCHITECTURE DECLARATION
// ───────────────────────────────────────────────────────────────────
function architectureDeclaration(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(H1("Institutional Architecture Declaration"));

  out.push(H3("AURIENTA is NOT a Software Company"));
  out.push(P("AURIENTA is NOT a software company. AURIENTA is a Constitutional Enterprise Infrastructure — an institution, not a product. The infrastructure is owned and operated by AURIENTA Holding Group, a non-operating holding company wholly owned by its Founder & Sole Owner. The infrastructure exists to constitute, govern, and graduate real-economy Enterprises — not to ship software features."));

  out.push(P("This declaration is foundational. Every architectural, governance, and operational decision in Volumes 0–42 must be interpreted in light of this declaration. The Constitutional Runtime Engine and Brain AI are instruments of the institution, not products in themselves. The Enterprise Registry is a constitutional surface, not a marketplace. The Capital Partner is a participant in a constitutional ecosystem, not a customer of a software vendor."));

  out.push(H3("Three-Entity Structure"));
  const ia: any = INSTITUTIONAL_ARCHITECTURE;
  out.push(PLead("Holding Group", ia.group));
  out.push(PLead("Founder", ia.founder));
  out.push(PLead("Title", ia.founderTitle));
  out.push(PLead("Ownership", ia.ownership));

  out.push(H4("Entity 1: AURIENTA Holding Group"));
  out.push(PLead("Type", ia.entities.holding.type));
  out.push(P("Responsibilities:"));
  for (const r of ia.entities.holding.responsibilities) out.push(Bullet(r));
  out.push(PLead("Owns", (ia.entities.holding.owns as any[]).join("; ")));
  out.push(PLead("Does Not Do", ia.entities.holding.doesNotDo));

  out.push(H4("Entity 2: AURIENTA Operations"));
  out.push(PLead("Type", ia.entities.operations.type));
  out.push(PLead("Manages", ia.entities.operations.manages));
  out.push(P("Technology responsibilities:"));
  for (const r of ia.entities.operations.responsibilities.technology) out.push(Bullet(r));
  out.push(P("Operations responsibilities:"));
  for (const r of ia.entities.operations.responsibilities.operations) out.push(Bullet(r));
  out.push(PLead("Regional Operating Companies", (ia.entities.operations.responsibilities.regionalOperatingCompanies as any[]).join(", ")));
  out.push(PLead("Owns", ia.entities.operations.owns));

  out.push(H4("Entity 3: AURIENTA Advisory"));
  out.push(PLead("Type", ia.entities.advisory.type));
  out.push(P("Responsibilities:"));
  for (const r of ia.entities.advisory.responsibilities) out.push(Bullet(r));
  out.push(PLead("Does Not Do", ia.entities.advisory.doesNotDo));

  out.push(H3("Constitutional Scalability Principle"));
  out.push(Quote(ia.scalabilityPrinciple.text));

  out.push(H3("Governance Model"));
  out.push(PLead("Holding Group", ia.governanceModel.holdingGroup));
  out.push(PLead("Operations", ia.governanceModel.operations));
  out.push(PLead("Advisory", ia.governanceModel.advisory));
  out.push(PLead("Principle", ia.governanceModel.principle));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// EDITION NOTES
// ───────────────────────────────────────────────────────────────────
function editionNotes(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(H1("Edition Notes — Original → Modified → Expanded"));
  out.push(P("This Master Blueprint v2.0 represents three distinct editorial phases. The table below records what each Prompt contributed to the document."));

  const promptLog: [string, string, string][] = [
    ["Prompt 1", "Constitutional Terminology Standard", "Replaced forbidden terms (escrow, fundraising, investor, shares, portfolio, platform, etc.) with constitutional equivalents (Law Firm Client Account, Capital Formation, Capital Partner, Equity Units, Constitutional Holdings, Constitutional Infrastructure). Score impact: Constitutional consistency 45→92; Institutional language 50→88."],
    ["Prompt 2", "Institutional Architecture Synchronization", "Added Volume 21: canonical corporate structure (3-entity model), Founder ownership declaration, RACI responsibility matrix, IP ownership strategy, regional operating companies, Constitutional Scalability Principle."],
    ["Prompt 3", "Institutional Governance v1.0", "Added Volume 22: mission/vision/purpose, 10 governing principles, 8-level decision hierarchy, 11 committees, 22-decision delegation matrix, 13-risk register, 10 internal controls, 13 cadences, 14 KPIs, change management freeze."],
    ["Prompt 4", "Enterprise Risk, Security & Compliance", "Added Volume 23: 28-risk register, 30-control framework, Three Lines of Defense, internal audit framework, cybersecurity (NIST CSF 2.0 + ISO 27001 + CIS), compliance (PDPL, ISO 27001, SOC 2, ISO 22301, ISO 31000, ISO 42001), BCP/DR, AI governance, data governance, certification roadmap, maturity model, ADR template."],
    ["Prompt 5", "AURIENTA Operating System (AOS v1.0)", "Added Volume 24: L0–L3 process architecture, 24 processes, SOP library, service catalog, 20 capabilities, 20 KPIs, 10 dashboards, knowledge management, continuous improvement, future roles, balanced scorecard, enterprise lifecycle simulation, operational maturity, EPR, capability heat map, digital twin, institutional memory engine, mission control."],
    ["Prompt 6", "Commercialization System (ACS v1.0)", "Added Volume 25: commercial organization, 18-stage funnel, 14 sales playbooks, customer journey, partner lifecycle, government framework, pricing architecture, 110 KPIs, 16-country expansion, institutional brand, competitive positioning, commercial risk register, DD packs, commercial dashboards."],
    ["Prompt 7", "Production Hardening (PH-ER v1.0)", "Added Volume 26: 12 workstreams, 160 items (database, security, DevSecOps, observability, identity, quality, performance, operations, compliance, documentation, pilot readiness, tech debt), 8 final reports, go-live checklist, roadmap forward."],
    ["Prompt 8", "Pilot Execution (PE v1.0)", "Added Volume 27: PMO, selection framework, onboarding factory, 15 KPIs, customer success operations, 7 partner types, 5 regulators, 10 evidence types, 8 completion criteria."],
    ["Prompt 9", "Global Launch Sequence (GLS v1.0)", "Added Volume 28: 16-country sequence, 16 partner types, 11 government stakeholders, 12 certifications, 11 DD packages, 10 trust pillars, alliance instruments, institutional comms, global events."],
    ["Prompt 10", "Founder Office Command Center (FOCC v1.0)", "Added Volume 29: 14 Founder Office modules, 12 PMO modules, 15-field decision schema, 20 Mission Control panels, 12 briefing types, corporate intelligence, knowledge graph, executive workflows, institutional memory, 17-dimension CEO performance dashboard."],
    ["Prompt 11", "Institutional Trust Database (ITDB v1.0)", "Added Volume 30: 21 data room repositories, 12 DD audiences, 10 claim types, 12 scorecards, 9 audit types, 15 assurance capabilities, 12 transparency sections, board command dashboard."],
    ["Prompt 12", "Market Execution System (MES v1.0)", "Added Volume 31: execution integrity rule (CLAIM≠EVIDENCE≠STATUS≠TARGET≠FORECAST), 18-item status register, 15-criterion qualification, 22-stage pipeline, 13 pricing lines, 110 KPIs, 7 validation gates."],
    ["Prompt 13", "Market Activation System (MAS v1.0)", "Added Volume 32: First 100 target engine (29 fields), 4 tiers, sourcing methodology, 14-stage outreach, 10-section discovery, E0–E9 evidence hierarchy, relationship map, daily command, 14-stage funnel."],
    ["Prompt 14", "Customer Conversion & Revenue Evidence (CPR v1.0)", "Added Volume 33: 24-stage conversion workflow, 10-field problem validation, 10-criterion qualification gate, 6 commercial offer states, 7-element pilot success, revenue evidence chain, 8-state reference engine, E0–E9 promotion rejection."],
    ["Prompt 15", "Strategic Partners, Regulatory & Relationship Engine (SPRRE v1.0)", "Added Volume 34: 16 partner categories, 30-field schema, 10-dimension scoring, law-firm-first campaign, 12-state outreach, 15-status regulatory model, 17-section brief generator, 20-entity relationship graph, 18 DD checks, 10 agreement types, 9 activation requirements."],
    ["Prompt 16", "Founder Institutional Execution War Room (FIEW v1.0)", "Added Volume 35: Founder identity (Mohamed Eltonsy), 4-week plan, Top 5 ranking formula, 35 metrics across 3 scoreboards, blocker engine, execution vs activity, truth models, 16 success criteria."],
    ["Prompt 17", "First-25 Real Market Research", "Added Volume 36: 25 Egyptian targets (2 P0, 7 P1, 12 P2, 4 P3), 5 law firm candidates, 3 regulatory authorities, 5 outreach drafts, 4 verified decision-makers (Osama Bishai, Hassan Allam, Dr. Ahmed Kelani, Mohamed Ghallab)."],
    ["Prompt 18", "Constitutional Audit & Realignment", "Added Volume 37: 16-section audit report (A–P), 17 invariants verification, drift remediation, center-of-gravity restoration."],
    ["Prompt 19", "Constitutional Core Realignment & DB Migration", "Restored 8-level constitutional hierarchy in Brain AI. Migrated Prisma schema to constitutional field names (OwnershipRecord, equityUnits, equityUnitPriceEgp, totalEquityUnits, lawFirmClientAccountBalanceEgp) via @map annotations. Surfaced Workforce/Labor as first-class constitutional participant. Reframed commercial systems as supporting infrastructure (LEVEL 7)."],
    ["Prompt 20", "Repository Integrity Policy", "Established the canonical repository integrity policy (essential artifacts, protected refs, backup strategy, pre-commit checklist, integrity verification commands). Certified binding on the AURIENTA repository."],
    ["Prompt 21", "Master Blueprint Expansion", "Produced this Master Blueprint v2.0 — fully expanded, extended, modified, and detailed. Incorporates all 16 institutional systems, P1 enforcement, enterprise profiles, constitutional audit, and real market research. Replaces all prior blueprint versions."],
  ];

  out.push(makeTable(
    ["Prompt", "Topic", "Contribution"],
    promptLog,
    { widths: [10, 25, 65], zebra: true }
  ));

  out.push(H3("File Provenance"));
  out.push(PLead("Original source blueprint", "upload/AURIENTA text.txt (953 KB / ~129k words) — preserved locally, gitignored, not used in this expansion."));
  out.push(PLead("Modified blueprint (Prompts 1–2)", "download/AURIENTA_Blueprint_Modified.docx — 387 KB, 77k words, 21 volumes. Backed up to .backups/ prior to expansion."));
  out.push(PLead("Expanded blueprint (this edition)", "download/AURIENTA_Blueprint_Modified.docx (overwritten) + download/AURIENTA_Master_Blueprint_v2.0.docx (versioned copy)."));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// PART I — CONSTITUTIONAL TERMINOLOGY STANDARD
// ───────────────────────────────────────────────────────────────────
function partI(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(H1("Part I — Constitutional Terminology Standard"));
  out.push(P("AURIENTA's constitutional terminology is non-negotiable. Every developer, AI prompt, UI label, legal agreement, and document must use approved terms. The terminology is enforced through three layers: (1) automated validation in CI/CD via forbidden regex patterns; (2) the Brain AI system prompt, which corrects forbidden terms in every response; (3) human review during the publication process."));

  out.push(H2("1.1 Approved Terms and Forbidden Alternatives"));
  out.push(P("The single source of truth is src/lib/aurienta/terminology.ts. The 20 approved terms are reproduced below with their forbidden alternatives and notes."));

  const termRows: string[][] = Object.entries(APPROVED_TERMS).map(([approved, info]: [string, any]) => [
    approved,
    (info.forbidden as string[]).join(", "),
    info.note,
  ]);
  out.push(makeTable(
    ["Approved Term", "Forbidden Alternatives", "Note"],
    termRows,
    { widths: [25, 30, 45], zebra: true }
  ));

  out.push(H2("1.2 Forbidden Regex Patterns (CI/CD Gate)"));
  out.push(P("The following 10 regex patterns are tested against every source file in CI/CD. Any match fails the build."));
  for (const p of FORBIDDEN_PATTERNS) {
    out.push(Bullet(p.source.replace(/\\b/g, "\\b").replace(/\w\*/g, "…")));
  }

  out.push(H2("1.3 Validation Function"));
  out.push(P("The validateTerminology function takes a string and returns whether it is valid plus a list of violations. The getApprovedTerm function returns the approved equivalent for a forbidden term."));
  out.push(recordsTable(
    [
      { fn: "validateTerminology(text)", sig: "(text: string) => { valid: boolean; violations: string[] }", note: "Tests text against all forbidden patterns; returns valid=false if any pattern matches." },
      { fn: "getApprovedTerm(forbidden)", sig: "(forbidden: string) => string | null", note: "Returns the approved term for a given forbidden term, or null if not found." },
    ] as any[],
    [
      ["Function", (r: any) => r.fn],
      ["Signature", (r: any) => r.sig],
      ["Note", (r: any) => r.note],
    ],
    { widths: [25, 35, 40], zebra: true }
  ));

  out.push(H2("1.4 Brain AI Enforcement Approach"));
  out.push(P("The Brain AI system prompt (src/lib/aurienta/ai.ts) instructs the AI to:"));
  out.push(Bullet("Always use constitutional terminology. Never say 'invest', 'investor', 'investment', 'fundraising', 'startup', 'shares', 'shareholder', 'escrow', 'platform', 'app', 'marketplace', 'exchange', 'crowdfunding', 'user', 'customer'."));
  out.push(Bullet("Instead use 'Capital Participation', 'Capital Partner', 'Capital Formation', 'Enterprise', 'Equity Units', 'Law Firm Client Account', 'Constitutional Infrastructure', 'Constitutional Partner', 'Ownership Record', 'Ownership Ledger'."));
  out.push(Bullet("If a Constitutional Partner uses forbidden terminology, gently correct them."));
  out.push(Bullet("Constitutional ownership units are 'Equity Units', never 'shares'."));
  out.push(Bullet("The ownership model is 'OwnershipRecord', never 'Shareholding'."));
  out.push(Bullet("The Law Firm Client Account balance field is 'lawFirmClientAccountBalanceEgp', never 'escrowBalanceEgp'."));
  out.push(Bullet("The equity unit price is 'equityUnitPriceEgp', never 'sharePriceEgp'."));
  out.push(Bullet("Total equity units is 'totalEquityUnits', never 'totalShares'."));

  out.push(H2("1.5 Constitutional Constants"));
  out.push(P("Source: src/lib/aurienta/constants.ts. The constants below are the canonical tier, role, stage, score, sector, and proposal definitions used throughout the platform."));

  out.push(H3("1.5.1 Tier Metadata (A–F)"));
  const tierRows = Object.entries(TIER_META).map(([tier, m]: [string, any]) => [
    tier, m.name, m.legalForm, m.maxRaise, m.minInvest, m.founderEquity, m.fee, m.erp, m.audit, m.trait,
  ]);
  out.push(makeTable(
    ["Tier", "Name", "Legal Form", "Max Raise", "Min Invest", "Founder Equity", "Fee", "ERP", "Audit", "Trait"],
    tierRows,
    { widths: [5, 8, 8, 11, 11, 12, 9, 8, 11, 17], zebra: true }
  ));

  out.push(H3("1.5.2 Role Metadata"));
  const roleRows = Object.entries(ROLE_META).map(([role, m]: [string, any]) => [
    role, m.label, m.badge, m.icon, m.policeClearance ? "Yes" : "No",
  ]);
  out.push(makeTable(
    ["Role", "Label", "Badge", "Icon", "Police Clearance"],
    roleRows,
    { widths: [25, 25, 10, 25, 15], zebra: true }
  ));

  out.push(H3("1.5.3 Stage Metadata"));
  const stageRows = Object.entries(STAGE_META).map(([stage, m]: [string, any]) => [
    stage, m.name, m.role, m.duration,
  ]);
  out.push(makeTable(
    ["Stage", "Name", "CRE Role", "Duration"],
    stageRows,
    { widths: [15, 30, 35, 20], zebra: true }
  ));

  out.push(H3("1.5.4 Sovereign Trust Score Levels"));
  out.push(recordsTable(
    STS_LEVELS as any[],
    [
      ["Min Score", (l) => String(l.min)],
      ["Name", (l) => l.name],
      ["Color", (l) => l.color],
    ],
    { widths: [20, 40, 40], zebra: true }
  ));

  out.push(H3("1.5.5 Health Ratings & Sectors"));
  out.push(PLead("Health Ratings", HEALTH_RATINGS.join(", ")));
  out.push(recordsTable(
    Object.entries(SECTORS).map(([k, v]: [string, any]) => ({ k, label: v.label, icon: v.icon })),
    [
      ["Sector Key", (r) => r.k],
      ["Label", (r) => r.label],
      ["Icon", (r) => r.icon],
    ],
    { widths: [25, 50, 25], zebra: true }
  ));

  out.push(H3("1.5.6 Proposal Types"));
  out.push(recordsTable(
    Object.entries(PROPOSAL_TYPES).map(([k, v]: [string, any]) => ({ k, ...v })),
    [
      ["Type", (r) => r.k],
      ["Label", (r) => r.label],
      ["Threshold", (r) => `${r.threshold}%`],
      ["Cooling", (r) => r.cooling],
      ["Voting", (r) => r.voting],
    ],
    { widths: [22, 22, 12, 22, 22], zebra: true }
  ));

  out.push(H3("1.5.7 Vital Signs"));
  out.push(recordsTable(
    VITAL_SIGNS as any[],
    [
      ["Key", (v) => v.key],
      ["Label", (v) => v.label],
      ["Healthy", (v) => `${v.healthy} ${v.unit}`],
      ["Alert", (v) => `${v.alert} ${v.unit}`],
      ["Description", (v) => v.desc],
    ],
    { widths: [12, 16, 12, 12, 48], zebra: true }
  ));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// PART II — ORIGINAL VOLUMES 0-20 (PRESERVED SUMMARIES)
// ───────────────────────────────────────────────────────────────────
function partII(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(H1("Part II — Original Blueprint Volumes 0–20 (Preserved)"));
  out.push(P("Part II re-issues the original 20 volumes of the AURIENTA Constitutional Blueprint with all Prompt 1 terminology replacements applied. Each volume is summarised below with its constitutional role and primary subject matter. The full verbatim text of each volume remains in the source blueprint file (upload/AURIENTA text.txt, 953 KB, ~129k words); this Master Blueprint records the structural index, the constitutional hash, and the terminology-compliant summaries."));

  out.push(P("All references to “escrow” now read “Law Firm Client Account”; “fundraising” now reads “Capital Formation”; “investor” now reads “Capital Partner”; “shares” now reads “Equity Units”; “portfolio” now reads “Constitutional Holdings”; “platform” (where AURIENTA is meant) now reads “Constitutional Infrastructure”; “shareholder” now reads “Constitutional Partner”; “startup” now reads “Enterprise”; “founder” (of an enterprise) now reads “Founding Operator”; “board” now reads “Constitutional Council”; “exit” now reads “Graduation”; “marketplace” now reads “Enterprise Registry”; “reputation score” now reads “Sovereign Trust Score”; and “terms of service” now reads “Constitutional Charter”."));

  const volumes: [string, string, string, string][] = [
    ["Volume 0", "Executive & Regulatory Overview",
     "Affirms AURIENTA's commitment to zero custody, fundamental pricing, AI enforcement, full transparency, and legal compliance with Egyptian law. Includes the milestone roadmap, risk mitigations, and economic KPIs demonstrating institutional readiness.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 1", "Constitutional Identity, Philosophy & Structural Trust Doctrine",
     "Establishes the constitutional identity layer of AURIENTA: the productive ownership doctrine, the non-custodial Constitutional Infrastructure of Structural Trust, the infrastructure-rather-than-intermediary doctrine, jurisdictional compliance supremacy, and constitutional participation language. Defines the Founding Principle, the Constitutional Hash, the 5 Layers of Constitutional Participation, the Foundational Doctrines, the Constitutional Pledge, and the Anti-Capture Civilization Doctrine.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 2", "Constitutional Runtime Engine (CRE) & Structural Enforcement Core",
     "Defines the deterministic enforcement layer: fail-secure runtime architecture (3-node consensus, hot standby), policy-as-code infrastructure (Rego, versioning, two-phase commit), and the constitutional state machine framework for enterprise, proposal, treasury, dispute, and graduation lifecycles. The CRE is the highest technical authority below the Constitution itself.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied. The 25 CRE functions are catalogued in Appendix D."],
    ["Volume 3", "Sovereign Identity, Trust & Constitutional Participation Network",
     "Establishes the foundational layer of human and entity representation: the One Identity Rule, portable Sovereign Trust Score, privacy by design, cryptographic anchoring (Ed25519), self-sovereign options, legal compliance, and the identity graph architecture (Neo4j nodes and edges, daily ETL). Defines 13 role types with inheritance hierarchy and permission matrix.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 4", "Constitutional Enterprise Tiers (A–F) — Fully Detailed",
     "Defines the six constitutional enterprise tiers (A through F, including Tier F for Joint Stock Companies) with complete detail: capital limits, Equity Unit pricing bands, governance requirements, workforce rules, graduation thresholds, and tier-specific constitutional obligations. Tier A (Micro, 3M EGP), Tier B (Small, 25M), Tier C (Growth, unlimited, ERP mandatory), Tier D (Established, owner ≥51%), Tier E (University SPV, 5M), Tier F (Joint Stock, EGX listing).",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 5", "Zero-Custody Capital Formation & Law Firm Client Account Infrastructure",
     "Establishes the secure, transparent, non-custodial capital coordination layer: zero-custody doctrine with CRE enforcement, the Law Firm Client Account architecture (multi-firm redundancy, bankruptcy-remote accounts, 100M EGP insurance), and non-custodial reservation/settlement flows. Capital flows directly to the law firm's licensed client account under Egyptian Lawyers' Code Art. 47.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 6", "JOZOUR v3 Valuation & Constitutional Pricing Engine",
     "Establishes the fundamental, non-speculative valuation layer: real-economy valuation doctrine (fundamental-only pricing, no speculation), the JOZOUR v3 7-step algorithm (revenue multiple, net assets, scorecard, growth AI, founder premium, sanity AI), and the daily fundamental price engine. Price formula: share price = (EPS × Sector P/E × Growth) + (0.3 × NAV/share). Secondary market ±5% band.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 7", "Constitutional Governance, Council & Decision Systems",
     "Establishes the distributed, transparent, anti-capture governance framework: constitutional councils, board structures, voting mechanics (9 proposal types with quorum, cooling-off, supermajority thresholds), conflict-of-interest recusal, and emergency governance including board emergency meetings and succession. Constitutional amendments require 75% supermajority.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 8", "Financial Control, Workforce Capitalization & Treasury Operations",
     "Establishes the disciplined, multi-signature, AI-verified framework for managing enterprise funds and human capital — fully integrated with Egyptian law, including social insurance (NOSI), treasury freeze systems, the Employee Registry, and workforce verification. Workforce Partners can convert up to 10% of salary into Equity Units at a 15% discount (Volume 39 details the P1 enforcement).",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 9", "Enterprise Registry & Constitutional Liquidity Coordination",
     "Establishes the non-speculative, fair, and stable liquidity layer: FIFO matching engine, price-band controls (±5%), priority windows, anti-speculation guardrails, and the public Enterprise Registry where Equity Units are listed and traded. Phase 1/2 orders must equal the AI fundamental price exactly; Phase 3 orders may trade within ±5%.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 10", "Dispute Resolution & Constitutional Appeal Court",
     "Establishes the fair, fast, and final mechanism for resolving conflicts within AURIENTA: constitutional appeal court, fraud investigation systems, bankruptcy reverse auction, and the dispute lifecycle state machine. Disputes may be appealed to the Constitutional Council and ultimately to CRCICA (Cairo Regional Centre for International Commercial Arbitration).",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 11", "Institutional Intelligence & Closed-Loop AI Infrastructure",
     "Establishes the learning, self-auditing, sovereign intelligence layer of AURIENTA: the Brain AI infrastructure (5-provider consensus: Gemini, OpenAI, Groq, HuggingFace, OpenRouter), EVE (Evidence Verification Engine), closed-loop learning, GAFI integration, and fraud detection systems. The Brain AI system prompt encodes the 8-level constitutional hierarchy as the center of gravity.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 12", "Legal, Compliance & Constitutional Charter Infrastructure",
     "Establishes the legally binding, regulatorily compliant, survival-ready foundation of AURIENTA: the Constitutional Charter, Egyptian regulatory alignment (FRA, GAFI, PDPL 151/2020), legal templates, and the law firm and accountant appointment framework. AURIENTA is positioned as governance infrastructure, not crowdfunding/broker/custodian/fund manager (per FRA no-action letter).",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 13", "Multi-Currency & Cross-Border Capital Routing Engine",
     "Establishes the global capital coordination layer of AURIENTA: multi-currency settlement, cross-border capital routing, FX risk controls, and regional operating company integration. Supports the diaspora bridge — Egyptians abroad can participate in domestic Enterprises without holding capital inside Egypt.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 14", "UI/UX, Workspaces & Constitutional Operating Experience",
     "Establishes the unified, role-aware, accessible interface for all Constitutional Partners: the Founding Operator Workspace, Board Workspace, Capital Partner Workspace, Manager Workspace, Workforce Partner Workspace, and role-based dashboards. Every partner experiences the institution through their constitutional role.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 15", "Graduation & Sovereign Enterprise Independence Protocol",
     "Establishes the pathway from Constitutional Infrastructure dependency to institutional autonomy: graduation thresholds (runway ≥12 months, health ≥AA, NOSI 100%, police clearance valid, Stage 3 ≥6 months, revenue growth ≥20%, 75% supermajority vote, no whistleblower reports, no appeals), sovereign independence protocol, post-graduation obligations, and the Constitutional Skill Barter Exchange. 9 readiness gates enforced by computeGraduationReadiness().",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 16", "Succession, Transparency & Institutional Health Systems",
     "Establishes the resilience, integrity, and dignity layer of AURIENTA: constitutional health ratings (AAA→C), succession planning, vendor transparency, conflict-of-interest detection, and institutional health vital signs (runway, revenue growth, gross margin, employee turnover, vote turnout, NOSI compliance).",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 17", "Implementation Roadmap, Infrastructure & Delivery Engineering",
     "Establishes the practical, production-ready blueprint for building, deploying, and operating AURIENTA: phased roadmap (Pilot Q4 2026, Institutional Q4 2027, Global Q4 2028), cloud architecture (Azure), AI inference costs, revenue model, and infrastructure engineering. Migration to PostgreSQL planned post-pilot.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 18", "Appendices, Machine-Readable Policies & Rego Code",
     "Provides every machine-readable artifact in the blueprint: Rego policies, JSON schemas, API specifications, sample payloads, audit templates, and the complete constitutional policy registry. The CRE's 25 exported TypeScript functions mirror the Rego policies as deterministic guards.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 19", "Constitutional User Experience & Implementation Synthesis",
     "Synthesises all user-facing constitutional requirements into a practical implementation guide: end-to-end user journey (registration, company linking, role acquisition, dashboard usage, opportunity evaluation, graduation) cross-referenced to Volumes 0–18. Demonstrates that the constitution is operationalised, not merely documented.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
    ["Volume 20", "Specialised Industry Modules",
     "Establishes four specialised, constitutionally governed, optional industry modules: Agriculture & Agri-Tech, Manufacturing & Industry 4.0, Tourism & Hospitality, and Technology & Innovation. Each integrates sector-specific data sources, AI models, and vital signs without violating non-amendable rules.",
     "Constitutional status: Incorporated into this Master Blueprint with all terminology replacements applied."],
  ];

  for (const [vol, title, summary, status] of volumes) {
    out.push(H2(`${vol} — ${title}`));
    out.push(P(summary));
    out.push(P(status, { italic: true, color: GRAY_TEXT }));
  }
  return out;
}

// ───────────────────────────────────────────────────────────────────
// PART III — VOLUME 21: INSTITUTIONAL ARCHITECTURE
// ───────────────────────────────────────────────────────────────────
function partIII(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(H1("Part III — Volume 21: Institutional Architecture & Corporate Structure"));
  out.push(P([
    "Source: src/lib/aurienta/institutional-architecture.ts (181 lines). ",
    "Volume 21 encodes the canonical corporate structure, the founder ownership, the Constitutional Scalability Principle, the RACI responsibility matrix, the regional operating companies, the governance model, the IP ownership strategy, and the future expansion roadmap. ",
    "Volume 21 is non-amendable except by Founder & Sole Owner consent.",
  ]));

  // Re-use architectureDeclaration's content here too
  const decl = architectureDeclaration();
  // Skip the H1 we already added; start from index 1
  for (let i = 1; i < decl.length; i++) out.push(decl[i]);

  out.push(H2("21.1 RACI Responsibility Matrix"));
  out.push(P("R = Responsible, A = Accountable, C = Consulted, I = Informed. The matrix covers every cross-entity responsibility in the Group."));
  out.push(recordsTable(
    Object.entries(RACI_MATRIX).map(([activity, r]: [string, any]) => ({ activity, holding: r.holding, operations: r.operations, advisory: r.advisory })),
    [
      ["Activity", (r) => r.activity],
      ["Holding", (r) => r.holding],
      ["Operations", (r) => r.operations],
      ["Advisory", (r) => r.advisory],
    ],
    { widths: [40, 20, 20, 20], zebra: true }
  ));

  out.push(H2("21.2 IP Ownership Strategy"));
  out.push(P("All intellectual property — including the Constitutional Runtime Engine, Brain AI, source code, trademarks, and patents — is owned by AURIENTA Holding Group. AURIENTA Operations manages technology on behalf of the Holding Group but owns nothing. AURIENTA Advisory never develops software; it manages institutional relationships and partner ecosystem."));
  out.push(Bullet("Constitutional Runtime Engine (CRE): owned by Holding Group; operated by Operations."));
  out.push(Bullet("Brain AI: owned by Holding Group; operated by Operations; AI Ethics Committee oversees behavior."));
  out.push(Bullet("Source code: all copyright assigned to Holding Group via contributor agreements."));
  out.push(Bullet("Trademarks: 'AURIENTA' and associated marks registered by Holding Group Legal."));
  out.push(Bullet("Patents: key processes (zero-custody escrow architecture, JOZOUR v3 valuation, CRE state machine) patented by Holding Group."));
  out.push(Bullet("Licensing: Holding Group may license IP to regional operating companies or strategic partners with Founder approval; CRE remains under Holding Group ownership."));

  out.push(H2("21.3 Regional Operating Companies"));
  out.push(P("Six regional operating companies are planned under AURIENTA Operations to support global expansion:"));
  for (const r of INSTITUTIONAL_ARCHITECTURE.entities.operations.responsibilities.regionalOperatingCompanies as any[]) {
    out.push(Bullet(r));
  }
  out.push(P("Each regional operating company is a wholly owned subsidiary of AURIENTA Operations. Regional expansion follows the sequence defined in Volume 28 (GLS v1.0) — Egypt first, then GCC, then Africa, Europe, Asia, Americas."));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// PART IV — VOLUMES 22-37 (INSTITUTIONAL SYSTEMS)
// ───────────────────────────────────────────────────────────────────
function partIV(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(H1("Part IV — Institutional Systems (Volumes 22–37)"));
  out.push(P("Part IV reproduces every exported constant, type, and function from the 16 institutional system files in src/lib/aurienta/. Each volume is a detailed chapter — not a summary. Every committee, every risk, every KPI, every process, every playbook, every partner category, every status register entry is reproduced."));

  out.push(P("The volumes are presented in the order in which they were authored and synchronized with the Brain AI system prompt, which is the order in which they appear in the institutional memory of the platform. Each volume carries a frozen-at date marking when it was committed as v1.0. Subsequent changes follow the change-management process documented in Volume 22 §22.17."));

  for (const v of volumes22to37) {
    out.push(...v.fn());
  }
  return out;
}

// ───────────────────────────────────────────────────────────────────
// PART V — VOLUMES 38-39 (CONSTITUTIONAL ENFORCEMENT)
// ───────────────────────────────────────────────────────────────────
function partV(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(H1("Part V — Constitutional Enforcement (Volumes 38–39)"));

  // ─── Volume 38: Enterprise Profile System ───
  out.push(H2("Volume 38 — Enterprise Profile System"));
  out.push(P("The Enterprise Profile System is the canonical institutional representation of an Enterprise on the AURIENTA Constitutional Infrastructure. It is what regulators, capital partners, partners, and graduates inspect to assess an Enterprise. The profile is exposed via the public Enterprise API (src/app/api/public/enterprise/[slug]/route.ts) and is consumed by the Enterprise Registry, due diligence packages, and the transparency portal."));

  out.push(H3("38.1 8-Tab Institutional Enterprise Profile"));
  out.push(P("The profile is organized into eight tabs, each addressing a different institutional question:"));

  out.push(recordsTable(
    [
      { tab: "1. Overview", purpose: "Who is this Enterprise? What do they do?", contents: "Legal name, brand, sector, tier, founding operator, year founded, city, brief description, mission, vision, current stage, health rating" },
      { tab: "2. Founder", purpose: "Who is the Founding Operator?", contents: "Name, role, ownership %, background, experience, prior enterprises, sovereign trust score, police clearance status" },
      { tab: "3. Capital", purpose: "How is the Enterprise capitalized?", contents: "Capital participation goal, capital participated, equity unit price (fundamental), total equity units, filled equity units, remaining equity units, law firm client account balance, monthly burn, runway months" },
      { tab: "4. Workforce", purpose: "Who is building the Enterprise?", contents: "Workforce partners count, employees count, NOSI compliance %, salary-to-equity conversions, career ledger entries, skill equity claims" },
      { tab: "5. Governance", purpose: "How is the Enterprise governed?", contents: "Constitutional council members, recent proposals, voting turnout, last dividend, consulting opt-out status, AURIENTA rep" },
      { tab: "6. Documents", purpose: "What are the constitutional documents?", contents: "Constitutional charter, legal registration, audit reports, quarterly reports, milestone evidence, IPFS evidence CIDs" },
      { tab: "7. Links", purpose: "Where can I learn more?", contents: "Website, registry URL, social media, regulatory filings, related enterprises, alumni hall entry" },
      { tab: "8. Constitutional", purpose: "What is the Enterprise's constitutional status?", contents: "Constitutional hash, CRE activation date, ledger event count, ledger chain integrity, last audit, graduation readiness score" },
    ] as any[],
    [
      ["Tab", (r) => r.tab],
      ["Purpose", (r) => r.purpose],
      ["Contents", (r) => r.contents],
    ],
    { widths: [18, 30, 52], zebra: true }
  ));

  out.push(H3("38.2 18 Extended Profile Fields"));
  out.push(P("Beyond the 8 tabs, the Enterprise model exposes 18 extended fields used by the institutional trust database, due diligence center, and regulatory engagement engine:"));
  const extFields: [string, string, string][] = [
    ["legalForm", "string", "LLC, JSC, SPV — determined by tier"],
    ["registrationNumber", "string", "GAFI registration number"],
    ["taxId", "string", "Egyptian Tax Authority ID"],
    ["commercialRegistry", "string", "Commercial Registry number"],
    ["nosiCompliantPct", "number", "Percentage of workforce registered with NOSI"],
    ["policeClearanceValid", "boolean", "Founding operator police clearance valid"],
    ["healthScore", "number", "0–100 constitutional health score"],
    ["healthRating", "string", "AAA–C rating derived from healthScore"],
    ["lawFirmId", "string", "FK to LawFirm"],
    ["accountingFirmId", "string", "FK to AccountingFirm"],
    ["lawFirmClientAccountBalanceEgp", "number", "Current Law Firm Client Account balance (constitutional field name; @map(\"escrowBalanceEgp\") in DB)"],
    ["equityUnitPriceEgp", "number", "Fundamental Equity Unit Price (constitutional field name; @map(\"sharePriceEgp\") in DB)"],
    ["totalEquityUnits", "number", "Total Equity Units authorized (constitutional field name; @map(\"totalShares\") in DB)"],
    ["filledEquityUnits", "number", "Equity Units issued to Capital Partners (constitutional field name; @map(\"filledShares\") in DB)"],
    ["stage", "string", "stage_1, stage_2, stage_3, graduated"],
    ["stageSince", "Date", "When the current stage began"],
    ["consultingOptOut", "boolean", "Whether consulting has been opted out"],
    ["monthlyBurnEgp", "number", "Monthly burn rate for runway calculation"],
  ];
  out.push(makeTable(
    ["Field", "Type", "Description"],
    extFields,
    { widths: [28, 12, 60], zebra: true }
  ));

  out.push(H3("38.3 Public API Surface"));
  out.push(P("The enterprise profile is exposed through a RESTful API surface under /api/public/enterprise/[slug]/:"));
  out.push(recordsTable(
    [
      { route: "GET /api/public/enterprise/[slug]", purpose: "Fetch the 8-tab institutional profile for an Enterprise", auth: "Public (anonymous)" },
      { route: "GET /api/public/enterprise/[slug]/transparency", purpose: "Fetch the transparency portal data (financial summary, ledger count, audit findings)", auth: "Public (anonymous)" },
      { route: "GET /api/public/enterprise/[slug]/trades", purpose: "Fetch recent secondary-market trades (FIFO matching, ±5% band)", auth: "Public (anonymous)" },
      { route: "GET /api/public/enterprise/[slug]/cre-decisions", purpose: "Fetch recent CRE decision tokens (verifiable Ed25519 signatures)", auth: "Public (anonymous)" },
      { route: "GET /api/enterprises/[id]/profile", purpose: "Fetch the extended 18-field profile (auth required)", auth: "Authenticated Capital Partner or Founding Operator" },
      { route: "PATCH /api/enterprises/[id]/profile", purpose: "Update editable profile fields (Founding Operator only; CRE enforces)", auth: "Founding Operator" },
      { route: "GET /api/public/registry", purpose: "List all active Enterprises for the Enterprise Registry", auth: "Public (anonymous)" },
      { route: "GET /api/public/stats", purpose: "Aggregate platform statistics for the homepage", auth: "Public (anonymous)" },
    ] as any[],
    [
      ["Route", (r) => r.route],
      ["Purpose", (r) => r.purpose],
      ["Auth", (r) => r.auth],
    ],
    { widths: [32, 48, 20], zebra: true }
  ));

  out.push(H3("38.4 Constitutional Field Names (Post-Migration)"));
  out.push(P("Following the Task 19 DB terminology migration, the Prisma schema uses constitutional field names with @map annotations preserving the legacy DB column names. This means the source code is fully constitutionally aligned while the database requires zero migration:"));
  out.push(recordsTable(
    [
      { model: "OwnershipRecord", field: "equityUnits", map: "@map(\"shares\")", note: "Constitutional: OwnershipRecord. Legacy DB table: Shareholding" },
      { model: "OwnershipRecord", field: "filledEquityUnits", map: "@map(\"filledShares\")", note: "Filled equity units (constitutional)" },
      { model: "Enterprise", field: "lawFirmClientAccountBalanceEgp", map: "@map(\"escrowBalanceEgp\")", note: "Law Firm Client Account balance" },
      { model: "Enterprise", field: "equityUnitPriceEgp", map: "@map(\"sharePriceEgp\")", note: "Fundamental equity unit price" },
      { model: "Enterprise", field: "totalEquityUnits", map: "@map(\"totalShares\")", note: "Total equity units authorized" },
      { model: "Valuation", field: "equityUnitPriceEgp", map: "@map(\"sharePriceEgp\")", note: "Per-valuation equity unit price" },
      { model: "Reservation", field: "equityUnits", map: "@map(\"shares\")", note: "Reserved equity units" },
      { model: "TradeOrder", field: "equityUnits", map: "@map(\"shares\")", note: "Ordered equity units" },
      { model: "SyndicateMember", field: "equityUnits", map: "@map(\"shares\")", note: "Syndicate member's equity units" },
      { model: "QuarterlyReport", field: "lawFirmClientAccountBalanceEgp", map: "@map(\"escrowBalanceEgp\")", note: "Quarter-end Law Firm Client Account balance" },
    ] as any[],
    [
      ["Model", (r) => r.model],
      ["Field (Constitutional)", (r) => r.field],
      ["DB @map", (r) => r.map],
      ["Note", (r) => r.note],
    ],
    { widths: [22, 25, 20, 33], zebra: true }
  ));

  // ─── Volume 39: P1 Constitutional Enforcement ───
  out.push(H2("Volume 39 — P1 Constitutional Enforcement (NOSI + Salary-to-Equity)"));
  out.push(P("Volume 39 documents the four P1 CRE enforcement functions added to src/lib/aurienta/cre.ts to operationalise the workforce-capitalization and NOSI social-insurance mandates of the Constitution. These functions are non-amendable: they enforce Volume 8 §8.x (Workforce Capitalization) and Add-on 26 (NOSI 30-day registration + 60-day expense freeze)."));

  out.push(H3("39.1 enforceNosiRegistration — NOSI 30-Day Registration Enforcement"));
  out.push(PLead("Policy", "nosi_registration.rego"));
  out.push(PLead("Blueprint Reference", "Volume 8 + Add-on 26. \"All employees must be registered with NOSI within 30 days; the CRE enforces this with penalties.\""));
  out.push(PLead("Signature", "enforceNosiRegistration(params: { hireDate: Date; nosiStatus: string; nosiRegisteredAt?: Date | null }): CreVerdict & { daysSinceHire: number; deadlineState: 'compliant' | 'approaching' | 'overdue' | 'frozen' | 'unknown' }"));
  out.push(H3("Enforcement Logic (5 States)"));
  out.push(recordsTable(
    [
      { state: "compliant", condition: "nosiStatus === 'registered'", allowed: "Yes", action: "No enforcement action — employee is registered" },
      { state: "approaching", condition: "daysSinceHire ≤ 30", allowed: "Yes (warning)", action: "Returns reason: 'NOSI registration deadline approaching: N day(s) remaining (Add-on 26)'" },
      { state: "overdue", condition: "31 ≤ daysSinceHire ≤ 60", allowed: "No", action: "Returns reason: 'NOSI registration OVERDUE: N days since hire. Expense freeze imminent at 60 days (Add-on 26).'" },
      { state: "frozen", condition: "daysSinceHire > 60", allowed: "No", action: "Returns reason: 'NOSI registration FROZEN: N days since hire. Expense approvals are FROZEN until NOSI registration is completed (60-day rule).'" },
      { state: "unknown", condition: "hireDate is missing or invalid", allowed: "No", action: "Returns reason: 'NOSI enforcement: hire date is UNKNOWN — cannot determine registration deadline'" },
    ] as any[],
    [
      ["State", (r) => r.state],
      ["Condition", (r) => r.condition],
      ["Allowed", (r) => r.allowed],
      ["Action", (r) => r.action],
    ],
    { widths: [12, 25, 13, 50], zebra: true }
  ));

  out.push(H3("39.2 enforceNosiExpenseFreeze — 60-Day Expense Freeze"));
  out.push(PLead("Policy", "nosi_expense_freeze.rego"));
  out.push(PLead("Blueprint Reference", "Add-on 26. \"After 60 days, expense approvals frozen until registration.\""));
  out.push(PLead("Signature", "enforceNosiExpenseFreeze(params: { employees: { hireDate: Date; nosiStatus: string }[] }): CreVerdict & { frozenEmployeeCount: number }"));
  out.push(P("Called BEFORE any expense approval to verify no employee in the Enterprise has an active NOSI freeze condition. Returns frozenEmployeeCount > 0 → all expense approvals blocked."));
  out.push(recordsTable(
    [
      { outcome: "Block", condition: "Any employee with nosiStatus !== 'registered' AND daysSinceHire > 60", action: "Returns allowed=false with reason citing frozenEmployeeCount and Add-on 26" },
      { outcome: "Allow", condition: "All employees either registered OR within 60-day window", action: "Returns allowed=true with frozenEmployeeCount=0" },
    ] as any[],
    [
      ["Outcome", (r) => r.outcome],
      ["Condition", (r) => r.condition],
      ["Action", (r) => r.action],
    ],
    { widths: [15, 50, 35], zebra: true }
  ));

  out.push(H3("39.3 enforceSalaryToEquity — Workforce Capitalization"));
  out.push(PLead("Policy", "salary_to_equity.rego"));
  out.push(PLead("Blueprint Reference", "Volume 8, Workforce Capitalization. \"Workforce Partners can convert up to 10% of salary into Equity Units at a 15% discount.\""));
  out.push(PLead("Signature", "enforceSalaryToEquity(params: { employeeId: string; monthlySalaryEgp: number; equityConversionPct: number; equityUnitPriceEgp: number; authorizedBy: string; workforcePartnerConsent: boolean; existingConversionThisCycle: boolean; restrictedUntilMonths: number }): CreVerdict & { convertedAmountEgp: number; discountedPriceEgp: number; equityUnitsToIssue: number }"));
  out.push(H3("Validation Rules (7 Rules)"));
  out.push(recordsTable(
    [
      { rule: "Rule 1", check: "monthlySalaryEgp is known and > 0", fail: "Reject: 'monthly salary is UNKNOWN or zero — cannot convert'" },
      { rule: "Rule 2", check: "equityConversionPct between 0 and 10 (inclusive)", fail: "Reject: 'conversion percentage exceeds constitutional maximum of 10%'" },
      { rule: "Rule 3", check: "equityConversionPct === 0 is valid (no-op)", fail: "Allow with 0 units issued" },
      { rule: "Rule 4", check: "equityUnitPriceEgp is known and > 0", fail: "Reject: 'Equity Unit Price (CPP) is UNKNOWN or zero — cannot calculate conversion'" },
      { rule: "Rule 5", check: "workforcePartnerConsent === true", fail: "Reject: 'Workforce Partner consent is required (Volume 8, Workforce Capitalization)'" },
      { rule: "Rule 6", check: "!existingConversionThisCycle (anti-replay)", fail: "Reject: 'conversion already processed for this pay cycle — duplicate conversion rejected'" },
      { rule: "Rule 7", check: "equityUnitsToIssue > 0 (conversion amount large enough)", fail: "Reject: 'conversion amount too small to issue even 1 Equity Unit at discounted price'" },
    ] as any[],
    [
      ["Rule", (r) => r.rule],
      ["Check", (r) => r.check],
      ["Failure Outcome", (r) => r.fail],
    ],
    { widths: [10, 45, 45], zebra: true }
  ));
  out.push(H3("Conversion Math"));
  out.push(P("When all 7 rules pass, the function calculates:"));
  out.push(Bullet("convertedAmountEgp = round(monthlySalaryEgp × (equityConversionPct / 100))"));
  out.push(Bullet("discountedPriceEgp = equityUnitPriceEgp × 0.85 (15% constitutional discount)"));
  out.push(Bullet("equityUnitsToIssue = floor(convertedAmountEgp / discountedPriceEgp)"));
  out.push(P("The verdict returns allowed=true with the three calculated values. The calling API must then create the OwnershipRecord with restrictedUntil set to (now + restrictedUntilMonths), append a LedgerEvent of type 'salary_to_equity_conversion', and notify the Workforce Partner."));

  out.push(H3("39.4 enforceEquityLockUp — Salary-Derived Equity Lock-Up"));
  out.push(PLead("Policy", "equity_lockup.rego"));
  out.push(PLead("Blueprint Reference", "Volume 8. Equity Units from salary conversion have a restricted period (default 12 months). The OwnershipRecord model has a restrictedUntil field."));
  out.push(PLead("Signature", "enforceEquityLockUp(params: { restrictedUntil: Date | null }): CreVerdict"));
  out.push(recordsTable(
    [
      { case: "No restriction", condition: "restrictedUntil === null", outcome: "Allowed — regular Capital Partner units, freely transferable" },
      { case: "Locked", condition: "now < restrictedUntil.getTime()", outcome: "Blocked — returns daysRemaining and ISO date: 'transfer blocked — N day(s) remaining until lock-up expires'" },
      { case: "Expired", condition: "now ≥ restrictedUntil.getTime()", outcome: "Allowed — lock-up has expired, units freely transferable" },
    ] as any[],
    [
      ["Case", (r) => r.case],
      ["Condition", (r) => r.condition],
      ["Outcome", (r) => r.outcome],
    ],
    { widths: [18, 35, 47], zebra: true }
  ));

  out.push(H3("39.5 Integration with the Constitutional Ledger"));
  out.push(P("Every P1 enforcement decision issues a CRE decision token via issueCreDecisionToken() with the policy name, a SHA3-256 payload hash, and an Ed25519 signature. The decision token is stored alongside the resulting OwnershipRecord and LedgerEvent. This means:"));
  out.push(Bullet("Every NOSI freeze is cryptographically attributable."));
  out.push(Bullet("Every salary-to-equity conversion is signed and timestamped."));
  out.push(Bullet("Every equity lock-up release is verifiable."));
  out.push(Bullet("The verifyLedgerChain() function walks the chain and verifies every signature."));
  out.push(P("Audit and regulatory inspection can therefore reconstruct any workforce-capitalization event in the institution's history, prove it was constitutionally valid, and identify the authorizer — without trusting any human attestation."));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// PART VI — MASTER REFERENCE (VOLUMES 40-42)
// ───────────────────────────────────────────────────────────────────
function partVI(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(H1("Part VI — Master Reference (Volumes 40–42)"));

  // ─── Volume 40: Master Implementation Matrix ───
  out.push(H2("Volume 40 — Master Implementation Matrix"));
  out.push(P("The Master Implementation Matrix records the constitutional status of every AURIENTA dimension across three phases: Original Blueprint (upload/AURIENTA text.txt), Modified (Prompts 1–2), and Expanded (Prompts 3–21). It also records the code location and current verification status. This is the single most authoritative reference for constitutional completeness."));

  const matrix: [string, string, string, string, string, string][] = [
    ["Zero Custody", "Volume 5 — Doctrine + escrow architecture", "Terminology: escrow → Law Firm Client Account", "Volume 23 §23.1 (R-018), Volume 38 §38.4 (field rename), Volume 39 (P1 enforcement)", "src/lib/aurienta/cre.ts → enforceZeroCustody, enforceFundFlow, enforceAccountantGate", "PASS"],
    ["CRE", "Volume 2 — fail-secure runtime, Rego, state machines", "Volume 21 — RACI assigns Operations A/R", "Appendix D — 25 functions catalogued; Volume 39 — 4 P1 functions added", "src/lib/aurienta/cre.ts (916 lines)", "PASS"],
    ["Fundamental Pricing", "Volume 6 — JOZOUR v3, ±5% band", "Terminology: share price → Equity Unit Price", "Volume 23 §23.1 (R-002), Volume 38 §38.4 (field rename)", "src/lib/aurienta/cre.ts → enforcePriceBand", "PASS"],
    ["No Speculation", "Volume 1 §1.x — Real-Economy Enterprise Formation Doctrine", "Terminology: crowdfunding/marketplace → Enterprise Registry", "Volume 31 §31.1 — Execution integrity rule", "src/lib/aurienta/terminology.ts → FORBIDDEN_PATTERNS", "PASS"],
    ["Graduation", "Volume 15 — Sovereign Independence Protocol", "Terminology: exit/IPO → Graduation", "Volume 22 §22.13 — Risk R-014; Volume 37 §37.11 — Graduation integrity", "src/lib/aurienta/cre.ts → computeGraduationReadiness (9 gates)", "PASS"],
    ["Immutable Ownership Ledger", "Volume 2 — hash-chain ledger", "Volume 21 — IP ownership consolidated in Holding Group", "Appendix D — appendLedgerEvent, verifyLedgerChain", "src/lib/aurienta/cre.ts → appendLedgerEvent, verifyLedgerChain", "PASS"],
    ["One Identity", "Volume 3 — Sovereign Identity, Ed25519 anchor", "Volume 21 — Identity operations under Operations", "Volume 23 §23.5 — Cybersecurity functions; Volume 26 WS5 — Identity workstream", "prisma/schema.prisma → User model (identityHash, identityAnchor)", "PASS"],
    ["Transparency", "Volume 16 — institutional health vital signs", "Terminology: reputation score → Sovereign Trust Score", "Volume 30 — Transparency Portal (12 sections); Volume 38 — Public API", "src/app/api/public/* (5 routes)", "PASS"],
    ["Constitutional Supremacy", "Volume 1 — Constitution > human override", "Volume 21 — Decision hierarchy level 0 = non-amendable", "Volume 22 §22.2 — 10 governing principles; Volume 37 — Audit", "src/lib/aurienta/ai.ts → LEVEL 1: CONSTITUTION", "PASS"],
    ["Tier A–F", "Volume 4 — Six constitutional enterprise tiers", "Terminology preserved (Tiers A–F unchanged)", "Volume 1.5.1 constants.ts TIER_META; Volume 39 — Tier-aware enforcement", "src/lib/aurienta/constants.ts → TIER_META", "PASS"],
    ["Enterprise Lifecycle", "Volume 1 §1.4 — 4 stages to Graduation", "Volume 21 — Lifecycle owned by Operations", "Volume 24 §24.14 — Enterprise Lifecycle Simulation (20 steps)", "src/lib/aurienta/constants.ts → STAGE_META", "PASS"],
    ["Constitutional Roles", "Volume 3 §3.9 — 13 role types", "Volume 21 — Roles managed by Operations", "Volume 22 §22.10 — Committees per role; Volume 23 §23.5 — Identity controls", "src/lib/aurienta/constants.ts → ROLE_META", "PASS"],
    ["Three-Entity Structure", "Not in original (single company)", "Volume 21 — Added Holding Group + Operations + Advisory", "Volume 22 §22.3 — 8-level decision hierarchy; Volume 24 §24.10 — Future roles", "src/lib/aurienta/institutional-architecture.ts", "PASS"],
    ["Founder Identity", "Implicit throughout original", "Volume 21 — Founder & Sole Owner: Mohamed Eltonsy (100%)", "Volume 35 §35.1 — FOUNDER_IDENTITY; Volume 37 — Audit confirmed", "src/lib/aurienta/execution-war-room.ts → FOUNDER_IDENTITY", "PASS"],
    ["Amendment IX", "Volume 5 §5.x — Direct law-firm transfer", "Volume 21 — Fund flow under Operations A/R", "Volume 38 §38.4 — field rename lawFirmClientAccountBalanceEgp", "src/lib/aurienta/cre.ts → enforceFundFlow, enforceAccountantGate", "PASS"],
    ["Constitutional Terminology", "Volume 1 §1.9.1 — 13-term mapping", "Prompt 1 — 20 approved terms + 10 forbidden patterns", "Volume 37 §37.12 — Terminology integrity; Appendix A — full dictionary", "src/lib/aurienta/terminology.ts", "PASS"],
    ["Evidence Hierarchy", "Implicit in Volume 11 (EVE)", "Terminology preserved", "Volume 32 §32.15 + Volume 33 §33.2 + Volume 42 — E0–E9 hierarchy", "src/lib/aurienta/{market-activation,customer-conversion}.ts", "PASS"],
  ];

  out.push(makeTable(
    ["Dimension", "Original Blueprint", "Modified (P1–2)", "Expanded (P3–21)", "Code Location", "Status"],
    matrix,
    { widths: [13, 18, 14, 22, 23, 10], zebra: true }
  ));

  // ─── Volume 41: 17 Constitutional Invariants ───
  out.push(H2("Volume 41 — 17 Constitutional Invariants"));
  out.push(P("The 17 Constitutional Invariants are the non-negotiable properties that must hold at every commit on main. Each invariant has a definition, an enforcement mechanism, a code location, and a verification status. All 17 currently PASS (verified during the Task 19 Constitutional Core Realignment)."));

  const invariants: [string, string, string, string, string][] = [
    ["I-01", "Zero Custody", "AURIENTA never holds, touches, or controls partner funds.", "CRE: enforceZeroCustody (blocks beneficiary containing 'aurienta'), enforceFundFlow (requires active law firm + balance ≥ release), enforceAccountantGate (requires accounting firm verification)", "src/lib/aurienta/cre.ts:26, 323, 357", "PASS"],
    ["I-02", "Constitutional Hash Immutability", "The Constitutional Hash 0xB4F8…E7D1A is the cryptographic anchor of the institution.", "Reproduced in constants.ts, ai.ts system prompt, every charter, every audit report", "src/lib/aurienta/constants.ts:73; src/lib/aurienta/ai.ts:20", "PASS"],
    ["I-03", "Founder & Sole Owner", "Mohamed Eltonsy is the Founder & Sole Owner with 100% ownership. No co-founders, no dilution.", "INSTITUTIONAL_ARCHITECTURE.ownership = '100% — no co-founders, no shareholders, no investors, no equity dilution'; FOUNDER_IDENTITY in execution-war-room.ts; Brain AI system prompt", "src/lib/aurienta/institutional-architecture.ts:14; src/lib/aurienta/execution-war-room.ts:35", "PASS"],
    ["I-04", "Three-Entity Structure", "AURIENTA is organised as Holding Group + Operations + Advisory. No responsibility overlap.", "INSTITUTIONAL_ARCHITECTURE.entities (holding/operations/advisory); RACI_MATRIX assigns each responsibility to exactly one accountable entity", "src/lib/aurienta/institutional-architecture.ts:16-128", "PASS"],
    ["I-05", "Fundamental Pricing (±5% Band)", "Equity Unit Price = (EPS × Sector P/E × Growth) + (0.3 × NAV/share). Secondary market ±5% band. Phase 1/2 orders must equal fundamental exactly.", "CRE: enforcePriceBand (phase_1/2: exact match; phase_3: ±5% tolerance)", "src/lib/aurienta/cre.ts:92", "PASS"],
    ["I-06", "No Speculation", "No derivatives, margin, short selling, tokenization, secondary speculation beyond ±5%.", "FORBIDDEN_PATTERNS (10 regex), Brain AI system prompt, validateTerminology()", "src/lib/aurienta/terminology.ts:29", "PASS"],
    ["I-07", "Immutable Ownership Ledger", "Every ownership change is recorded on a hash-chain ledger with Ed25519 signatures.", "CRE: appendLedgerEvent (per-enterprise sequence, SHA3-256 payload + prevHash), verifyLedgerChain (walks chain, verifies every signature)", "src/lib/aurienta/cre.ts:488, 538", "PASS"],
    ["I-08", "One Identity Rule", "One person = one verified identity, anchored by Ed25519 public key.", "User.identityHash (SHA3-256, unique), User.identityAnchor (Ed25519 public key), User.identitySecretEnc (AES-GCM encrypted private key)", "prisma/schema.prisma:17 (User model)", "PASS"],
    ["I-09", "Constitutional Supremacy (Non-Amendable Rules)", "Non-amendable rules cannot be overridden by any human, including the Founder.", "GOVERNANCE_MANUAL.decisionHierarchy level 0 = 'Constitutional Charter — None — not even the Founder can override'", "src/lib/aurienta/institutional-governance.ts:40", "PASS"],
    ["I-10", "Tier Migration Sequence", "Tiers progress A → B → C → D → F without skipping. Tier E (University) is a separate track.", "CRE: enforceTierMigration (order = [A,B,C,D,F]; next === cur OR cur+1; E exempt)", "src/lib/aurienta/cre.ts:454", "PASS"],
    ["I-11", "Founder Equity Cap", "Founding Operator equity cannot be diluted below tier floor (A: 5%, B: 5%, C: 10%, D: 51%, E: 0%, F: 0%).", "CRE: enforceFounderEquityCap", "src/lib/aurienta/cre.ts:428", "PASS"],
    ["I-12", "Police Clearance for Sensitive Roles", "manager, founding_operator, board_member, law_firm_rep, accounting_firm_rep require valid police clearance.", "CRE: enforcePoliceClearance", "src/lib/aurienta/cre.ts:128", "PASS"],
    ["I-13", "KYC Level Gating", "L0 anonymous = no transactions; L1 = no money moves; L2 capped at 10,000 EGP; L3 = full; L4 = institutional (Tier F).", "CRE: enforceKycGate", "src/lib/aurienta/cre.ts:160", "PASS"],
    ["I-14", "Dual-Signature Expenses (1–10% of Capital)", "Expenses between 1% and 10% of capital require both manager AND accounting_firm_rep signatures.", "CRE: enforceExpenseAuthority (1–10% returns allowed=false with requiredApproverRoles=[manager, accounting_firm_rep])", "src/lib/aurienta/cre.ts:40", "PASS"],
    ["I-15", "NOSI 30-Day Registration + 60-Day Expense Freeze", "All employees must be NOSI-registered within 30 days. After 60 days, expense approvals are frozen.", "CRE: enforceNosiRegistration (5 states), enforceNosiExpenseFreeze (blocks all expenses if any employee frozen)", "src/lib/aurienta/cre.ts:624, 699", "PASS"],
    ["I-16", "Salary-to-Equity (10% Max, 15% Discount, Consent, Anti-Duplicate, Lock-Up)", "Workforce Partners can convert up to 10% of salary into Equity Units at a 15% discount, with consent, anti-replay, and lock-up.", "CRE: enforceSalaryToEquity (7 rules), enforceEquityLockUp", "src/lib/aurienta/cre.ts:742, 886", "PASS"],
    ["I-17", "Graduation 9-Gate Readiness", "Graduation requires 9 gates: runway ≥12mo, health ≥AA, NOSI 100%, police clearance, Stage 3 ≥6mo, revenue growth ≥20%, 75% supermajority vote, no whistleblower reports, no appeals.", "CRE: computeGraduationReadiness", "src/lib/aurienta/cre.ts:582", "PASS"],
  ];

  out.push(makeTable(
    ["#", "Invariant", "Definition", "Enforcement Mechanism", "Code Location", "Status"],
    invariants,
    { widths: [5, 14, 22, 33, 18, 8], zebra: true }
  ));

  // ─── Volume 42: Evidence Hierarchy E0-E9 ───
  out.push(H2("Volume 42 — Evidence Hierarchy E0–E9"));
  out.push(P("The Evidence Hierarchy is AURIENTA's institutional commitment to never confuse claims with evidence. Every market-facing, partner-facing, and regulator-facing statement must be classified at one of 10 evidence levels. Promotion from one level to the next requires specific, documented evidence — never inference, never extrapolation, never optimism."));

  out.push(P("The hierarchy is enforced in three places: (1) the Market Activation System (MAS), Volume 32 §32.15; (2) the Customer Conversion System (CPR), Volume 33 §33.2; (3) the Strategic Partners system (SPRRE), Volume 34. The Brain AI Market Agent (Volume 32 §32.16) and the Brain AI Conversion Chief of Staff (Volume 33 §33.15) refuse to promote a claim beyond its evidence level."));

  out.push(H3("42.1 Evidence Levels"));
  out.push(makeTable(
    ["Level", "Name", "Meaning"],
    [
      ["E0", "Founder Assumption", "An idea, hypothesis, or belief held by the Founder. No external validation. The default state of every claim before research begins."],
      ["E1", "Market Hypothesis", "A claim supported by public web research, industry reports, or third-party data — but no direct conversation with the prospect. The First-25 Research (Volume 36) is at E1."],
      ["E2", "First Contact", "A real conversation has occurred with the prospect. The prospect is aware of AURIENTA. No commitment has been made."],
      ["E3", "Problem Validated", "The prospect has confirmed they have the problem AURIENTA addresses, in their own words, with specific examples."],
      ["E4", "Qualified Opportunity", "The prospect has been qualified against the 10-criterion qualification gate (Volume 33 §33.5). Budget, authority, need, timing confirmed."],
      ["E5", "Commercial Offer Made", "A specific commercial offer has been presented and acknowledged. The prospect is evaluating the offer."],
      ["E6", "Agreement Signed", "A binding agreement (pilot, partnership, or commercial) has been signed by both parties."],
      ["E7", "Deployed / Activated", "The agreement has been executed. The Enterprise is using AURIENTA's infrastructure. Activation requirements (Volume 34 §34.12) are met."],
      ["E8", "Outcome Measured", "The deployment has produced a measurable outcome against predefined criteria. Revenue collected, problem solved, value created."],
      ["E9", "Repeatable Outcome", "The outcome has been reproduced across multiple Enterprises. The result is no longer a single-instance anomaly but a repeatable institutional capability."],
    ],
    { widths: [8, 22, 70], zebra: true }
  ));

  out.push(H3("42.2 Promotion Rules"));
  out.push(P("Promotion from level N to level N+1 requires specific evidence. The Brain AI refuses to promote without it:"));
  out.push(Bullet("E0 → E1: A research artifact documenting public sources (URL, report citation, social proof). No fabrication permitted. UNKNOWN is the default for any unverifiable field."));
  out.push(Bullet("E1 → E2: A contact record showing date, channel, participants, and the prospect's acknowledgement. Outbound emails that were never opened do NOT count."));
  out.push(Bullet("E2 → E3: A discovery document where the prospect described their problem in their own words. AURIENTA's pitch does NOT count as problem validation."));
  out.push(Bullet("E3 → E4: A completed 10-criterion qualification gate (Volume 33 §33.5) with evidence per criterion. CONDITIONAL or UNKNOWN on any criterion blocks promotion."));
  out.push(Bullet("E4 → E5: A written commercial offer (proposal, MoU, term sheet) acknowledged by the prospect's authorised representative."));
  out.push(Bullet("E5 → E6: A signed agreement with both parties' signatures, dated, with a defined effective date and scope."));
  out.push(Bullet("E6 → E7: All 9 activation requirements (Volume 34 §34.12) met. Deployment evidence (system access, first CRE event, first ledger entry) recorded."));
  out.push(Bullet("E7 → E8: Outcome metrics measured against the pilot success package (Volume 33 §33.7 — 7 elements). All 7 elements require objective evidence."));
  out.push(Bullet("E8 → E9: The same outcome reproduced in ≥3 Enterprises with similar conditions. Documented in the institutional memory engine."));

  out.push(H3("42.3 Rejection Criteria (Invalid Promotions)"));
  out.push(P("The following promotion attempts are rejected automatically by the Brain AI and the validation gates:"));
  out.push(recordsTable(
    [
      { from: "E1 (Market Hypothesis)", to: "E6 (Signed)", reason: "Cannot skip from research to signed agreement without contact, validation, qualification, and offer" },
      { from: "E2 (First Contact)", to: "E4 (Qualified)", reason: "Cannot skip problem validation — qualification requires confirmed problem in prospect's words" },
      { from: "E5 (Offer Made)", to: "E8 (Outcome)", reason: "Cannot claim outcome without signed agreement, deployment, and measurement" },
      { from: "Verbal interest", to: "Any evidence level", reason: "Verbal interest is NOT evidence — requires written confirmation" },
      { from: "Hypothetical pipeline", to: "Revenue", reason: "Pipeline ≠ revenue. Only COLLECTED revenue counts as real revenue (Volume 33 §33.8)." },
      { from: "Single prospect request", to: "Product feature", reason: "One prospect's request does not justify a product change without ≥5 occurrences (Volume 35 §35.10)" },
    ] as any[],
    [
      ["From", (r) => r.from],
      ["To", (r) => r.to],
      ["Rejection Reason", (r) => r.reason],
    ],
    { widths: [22, 22, 56], zebra: true }
  ));

  out.push(H3("42.4 Current Platform Evidence Ceiling"));
  out.push(P("The current platform evidence ceiling is E1. The First-25 Research (Volume 36) produced 25 target accounts at E1 — market hypotheses based on public web research. No contact, conversation, validation, qualification, offer, agreement, deployment, outcome, or repeatable outcome has occurred."));
  out.push(P("This is documented honestly in the Honest Certifications of MAS (Volume 32 §32.21), CPR (Volume 33 §33.18), SPRRE (Volume 34 §34.20), and FIEW (Volume 35 §35.17). The Brain AI refuses to claim any evidence level above E1 in any public or internal communication."));
  out.push(Quote("Current evidence ceiling: E1. The next promotion to E2 requires the first real conversation with a researched target. No conversation has occurred. The system honestly reports E1 across all market-facing surfaces."));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// APPENDICES
// ───────────────────────────────────────────────────────────────────
function appendices(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(H1("Appendices"));

  // ─── Appendix A: Constitutional Terminology Dictionary ───
  out.push(H2("Appendix A — Constitutional Terminology Dictionary"));
  out.push(P("Full table of the 20 approved terms with their forbidden alternatives and notes. Source: src/lib/aurienta/terminology.ts."));
  const aRows = Object.entries(APPROVED_TERMS).map(([approved, info]: [string, any]) => [
    approved,
    (info.forbidden as string[]).join(", "),
    info.note,
  ]);
  out.push(makeTable(["Approved Term", "Forbidden Alternatives", "Note"], aRows, { widths: [25, 30, 45], zebra: true }));

  // ─── Appendix B: RACI Responsibility Matrix ───
  out.push(H2("Appendix B — RACI Responsibility Matrix"));
  out.push(P("Source: src/lib/aurienta/institutional-architecture.ts. R = Responsible, A = Accountable, C = Consulted, I = Informed."));
  out.push(recordsTable(
    Object.entries(RACI_MATRIX).map(([activity, r]: [string, any]) => ({ activity, holding: r.holding, operations: r.operations, advisory: r.advisory })),
    [
      ["Activity", (r) => r.activity],
      ["Holding", (r) => r.holding],
      ["Operations", (r) => r.operations],
      ["Advisory", (r) => r.advisory],
    ],
    { widths: [40, 20, 20, 20], zebra: true }
  ));

  // ─── Appendix C: Automated Validation Checklist ───
  out.push(H2("Appendix C — Automated Validation Checklist"));
  out.push(P("The constitutional terminology standard is enforced through three automated layers. Every commit to main must pass all three."));

  out.push(H3("C.1 Forbidden Pattern Gate (CI/CD)"));
  out.push(P("The following 10 regex patterns are tested against every .ts, .tsx, .md, and .docx-extracted-text file in CI/CD. Any match (case-insensitive, word-boundary) fails the build:"));
  out.push(recordsTable(
    FORBIDDEN_PATTERNS.map((p, i) => ({ idx: i + 1, src: p.source })),
    [
      ["#", (r) => String(r.idx)],
      ["Regex", (r) => r.src],
    ],
    { widths: [8, 92], zebra: true }
  ));

  out.push(H3("C.2 Brain AI Enforcement"));
  out.push(P("The Brain AI system prompt (src/lib/aurienta/ai.ts) instructs every AI response to:"));
  out.push(Bullet("Use approved terms exclusively."));
  out.push(Bullet("Gently correct Constitutional Partners who use forbidden terms."));
  out.push(Bullet("Recognize the constitutional field names (equityUnitPriceEgp, totalEquityUnits, lawFirmClientAccountBalanceEgp, OwnershipRecord, equityUnits)."));
  out.push(Bullet("Refuse to generate content containing forbidden terms."));
  out.push(Bullet("Operate at the appropriate evidence level (E0–E9) — refuse to promote without evidence."));

  out.push(H3("C.3 Document Review Process"));
  out.push(P("Every public-facing document (blueprint, charter, audit report, partnership brief, regulatory brief) passes through human review by the Founder (or designated reviewer) before publication. The reviewer verifies:"));
  out.push(Bullet("All terminology is approved."));
  out.push(Bullet("All claims are evidence-classified (E0–E9)."));
  out.push(Bullet("All references to the Founder use 'Mohamed Eltonsy — Founder & Sole Owner — 100%'."));
  out.push(Bullet("All references to ownership use 'Equity Units' (never 'shares')."));
  out.push(Bullet("All references to the Law Firm Client Account use the constitutional name."));
  out.push(Bullet("All references to AURIENTA's nature use 'Constitutional Infrastructure' (never 'platform', 'app', 'software')."));

  out.push(H3("C.4 Known Technical Debt"));
  out.push(P("The following known technical debt items are documented in constitutional-audit.ts and are accepted as legacy artifacts that require explicit migration rather than silent renaming:"));
  out.push(Bullet("@map annotations in prisma/schema.prisma preserve legacy DB column names (escrowBalanceEgp, sharePriceEgp, totalShares, Shareholding, shares) — these are intentional, not defects."));
  out.push(Bullet("constitutional-audit.ts preserves legacy terms as historical findings — this is the audit's purpose."));
  out.push(Bullet("Source code comments referencing legacy terms remain as historical context — they are not user-facing."));
  out.push(Bullet("The /dashboard/escrow/page.tsx route is retained for backward compatibility with existing bookmarks; the page renders the Law Firm Client Account view."));

  out.push(H3("C.5 Certification"));
  out.push(P("This validation checklist is certified as binding on every commit, every AI response, every publication, and every external communication. Violations are P0 integrity issues requiring immediate remediation."));

  // ─── Appendix D: CRE Function Reference ───
  out.push(H2("Appendix D — CRE Function Reference"));
  out.push(P("Source: src/lib/aurienta/cre.ts (916 lines, 25 exported functions). The CRE mirrors the blueprint's Rego policies as TypeScript guards. Every function returns a CreVerdict with an Ed25519-signed decision token (issueCreDecisionToken)."));

  const creFunctions: [string, string, string][] = [
    ["enforceZeroCustody", "(beneficiary: string): CreVerdict", "Non-amendable Rule I 1.1. Blocks any beneficiary containing 'aurienta' (substring, case-insensitive)."],
    ["enforceExpenseAuthority", "(amountEgp, capitalEgp, role): CreVerdict", "Art. 118 / tier rules. <1% capital: manager or founding_operator solo; 1–10%: dual signature (manager + accounting_firm_rep); >10%: board_member only."],
    ["computeDynamicMinimum", "(remainingGoal, remainingSlots, tier): number", "Add-on 19. Tier-dependent dynamic minimum Capital Participation."],
    ["enforcePriceBand", "(orderPrice, fundamentalPrice, phase): CreVerdict", "Fundamental pricing. Phase 1/2: must equal fundamental exactly. Phase 3: ±5% band."],
    ["checkQuorum", "(votesCast, totalVotingPower, quorumPct): boolean", "Constitutional consensus check."],
    ["enforcePoliceClearance", "(role, clearanceValid, clearanceExpiresAt?): CreVerdict", "Add-on 27. Required for manager, founding_operator, board_member, law_firm_rep, accounting_firm_rep."],
    ["enforceKycGate", "(verificationLevel, action, amountEgp?): CreVerdict", "CTO-AUDIT P0-8. L0 blocked; L1 blocked; L2 capped at 10,000 EGP; L3 full; L4 institutional (Tier F)."],
    ["enforceFamilyConsent", "(isFamilyMember, familyConsent, amountEgp): CreVerdict", "CTO-AUDIT P0-7. Family members >50,000 EGP require family consent."],
    ["enforceConsultingOptOut", "(enterprise): CreVerdict", "CTO-AUDIT P0-7. Requires 3 consecutive profitable quarters OR 2 years of consultancy."],
    ["enforceLawFirmReplacement", "(newFirm): CreVerdict", "CTO-AUDIT P0-7. Replacement must be active, licensed, insured ≥100M EGP, expertise ≥75."],
    ["enforceEmergencyFreeze", "(enterprise): CreVerdict", "CTO-AUDIT P0-7. Records emergency freeze (idempotent if already frozen)."],
    ["enforceNotFrozen", "(enterprise): CreVerdict", "Blocks all money-moving actions if enterprise is frozen."],
    ["enforceFundFlow", "(params: { lawFirmStatus, releaseAmount, lawFirmBalance }): CreVerdict", "Amendment IX. Capital flows directly to law firm client account. Requires active firm + sufficient balance."],
    ["enforceAccountantGate", "(params: { accountingFirmStatus, evidenceVerified, milestoneStatus }): CreVerdict", "Amendment IX. Milestone release requires accounting firm verification + co-authorization."],
    ["enforceDividendLock", "(params: { dividendAmount, realizedProfits, lastDividendAt? }): CreVerdict", "Dividends from realized profits only. 30-day cooling-off between dividends."],
    ["enforceFounderEquityCap", "(params: { tier, founderEquityPct, proposedFounderEquityPct }): CreVerdict", "CTO-AUDIT P0-7. Prevents dilution below tier floor (A:5%, B:5%, C:10%, D:51%, E:0%, F:0%)."],
    ["enforceTierMigration", "(params: { currentTier, proposedTier }): CreVerdict", "CTO-AUDIT P0-7. No skipping A→B→C→D→F. Tier E is exempt (separate track)."],
    ["appendLedgerEvent", "(tx, params): Promise<{ id, payloadHash, prevHash, sequence }>", "Transactional hash-chain append. Per-enterprise monotonic sequence. SHA3-256 payload + prevHash. Ed25519-signed decision token."],
    ["verifyLedgerChain", "(enterpriseId): Promise<{ intact, eventsChecked, brokenAt? }>", "CTO-AUDIT P0-3. Walks chain in sequence order, recomputes every payloadHash, verifies every prevHash link, verifies every CRE decision token signature."],
    ["computeGraduationReadiness", "(enterpriseId): Promise<{ score, gates }>", "9 gates: runway ≥12mo, health ≥AA, NOSI 100%, police clearance, Stage 3 ≥6mo, revenue growth ≥20%, 75% supermajority vote, no whistleblower, no appeals."],
    ["enforceNosiRegistration", "(params: { hireDate, nosiStatus, nosiRegisteredAt? }): CreVerdict & { daysSinceHire, deadlineState }", "P1 — Add-on 26. 30-day registration deadline. 5 states: compliant, approaching, overdue, frozen, unknown."],
    ["enforceNosiExpenseFreeze", "(params: { employees }): CreVerdict & { frozenEmployeeCount }", "P1 — Add-on 26. 60-day rule. Blocks ALL expense approvals if any employee frozen."],
    ["enforceSalaryToEquity", "(params): CreVerdict & { convertedAmountEgp, discountedPriceEgp, equityUnitsToIssue }", "P1 — Volume 8. 10% max, 15% discount, consent, anti-duplicate, lock-up. 7 validation rules."],
    ["enforceEquityLockUp", "(params: { restrictedUntil }): CreVerdict", "P1 — Volume 8. Blocks transfer of salary-derived Equity Units during restricted period (default 12 months)."],
    ["hashPayload", "(payload: unknown): string", "Internal SHA3-256 helper used by all CRE functions."],
  ];

  out.push(makeTable(
    ["Function", "Signature", "Description"],
    creFunctions,
    { widths: [22, 33, 45], zebra: true }
  ));

  // ─── Appendix E: Prisma Schema Summary ───
  out.push(H2("Appendix E — Prisma Schema Summary"));
  out.push(P("Source: prisma/schema.prisma (1,045 lines, 44 models). All models use constitutional field names with @map annotations preserving legacy DB column names (zero migration risk)."));

  const models: [string, string, string][] = [
    ["User", "—", "id, email, mobile, legalName, verificationLevel (L0-L4), sovereignTrustScore, identityHash, identityAnchor, policeClearanceValid, pledgeSignedAt"],
    ["PlatformSetting", "—", "id, key, value, updatedBy, updatedAt"],
    ["LawFirm", "—", "id, name, frLicenseNumber, insuranceEgp (≥100M), status, expertiseScore"],
    ["AccountingFirm", "—", "id, name, esaaLicenseNumber, status"],
    ["Enterprise", "—", "id, slug, legalName, tier (A-F), stage, lawFirmClientAccountBalanceEgp @map(escrowBalanceEgp), equityUnitPriceEgp @map(sharePriceEgp), totalEquityUnits @map(totalShares), filledEquityUnits @map(filledShares), healthScore, stageSince, consultingOptOut"],
    ["EnterpriseMember", "—", "id, enterpriseId, userId, role"],
    ["OwnershipRecord", "@@map(Shareholding)", "id, enterpriseId, userId, equityUnits @map(shares), restrictedUntil, acquiredAt"],
    ["LedgerEvent", "—", "id, enterpriseId, eventType, prevHash, payloadHash, payload (JSON), creDecisionToken, actorId, sequence"],
    ["AuditLog", "—", "id, actorId, action, target, before, after, timestamp"],
    ["Proposal", "—", "id, enterpriseId, type (9 types), status, passThreshold, coolingUntil, votingClosesAt"],
    ["Vote", "—", "id, proposalId, userId, votingPower, castAt"],
    ["Milestone", "—", "id, enterpriseId, title, status (draft → board_review → approved → released), evidenceCid"],
    ["Expense", "—", "id, enterpriseId, amountEgp, status, approverId, submitterId"],
    ["Employee", "—", "id, enterpriseId, userId, hireDate, nosiStatus, monthlySalaryEgp"],
    ["Reservation", "—", "id, enterpriseId, userId, equityUnits @map(shares), amountEgp, status, expiresAt"],
    ["TradeOrder", "—", "id, enterpriseId, userId, side, equityUnits @map(shares), priceEgp, status, phase"],
    ["Valuation", "—", "id, enterpriseId, equityUnitPriceEgp @map(sharePriceEgp), revenueMultiple, navPerShare, growthFactor, computedAt"],
    ["DashboardTask", "—", "id, userId, title, status, priority, dueDate"],
    ["Notification", "—", "id, userId, type, message, readAt"],
    ["CopilotChat", "—", "id, userId, message, response, model, createdAt"],
    ["GraduationRecord", "—", "id, enterpriseId, graduatedAt, readinessScore, proposalId"],
    ["AiArtifact", "—", "id, kind, input, output, model, fellBack, cid, createdAt"],
    ["Syndicate", "—", "id, enterpriseId, leadId, targetAmountEgp, status"],
    ["SyndicateMember", "—", "id, syndicateId, userId, equityUnits @map(shares), commitmentEgp"],
    ["DripEnrollment", "—", "id, enterpriseId, userId, schedule, totalAmountEgp, releasedAmountEgp"],
    ["CareerLedgerEntry", "—", "id, userId, enterpriseId, type (milestone/contribution/promotion/equity_grant/training), description, value, recordedAt"],
    ["Mentorship", "—", "id, mentorId, menteeId, status, startDate, endDate"],
    ["SkillEquityClaim", "—", "id, userId, enterpriseId, credentialId, tenureMonths (≥24), status, equityUnitsAwarded"],
    ["IpfsEvidence", "—", "id, cid, title, mimeType, sizeBytes, uploadedBy"],
    ["SurvivalDrill", "—", "id, scenario, executedAt, participants, outcome, lessons"],
    ["DiasporaProfile", "—", "id, userId, countryOfResidence, egyptianIdVerified, sendingCapacityEgp"],
    ["IrQuestion", "—", "id, enterpriseId, question, answer, askedBy, answeredBy, visibility"],
    ["QuarterlyReport", "—", "id, enterpriseId, year, quarter, revenueEgp, netProfitEgp, lawFirmClientAccountBalanceEgp @map(escrowBalanceEgp)"],
    ["Vendor", "—", "id, name, category, status, esaaLicense, insuranceEgp"],
    ["WhistleblowerReport", "—", "id, reporterId (nullable for anon), subject, description, status, investigatedBy, resolution"],
    ["AppealCase", "—", "id, enterpriseId, appellantId, type, status, crcicaRef"],
    ["RiskDisclosure", "—", "id, userId, enterpriseId, signedAt, disclosureVersion"],
    ["Session", "—", "id, userId, token, expiresAt, ip, userAgent"],
    ["IdempotencyRecord", "—", "id, key, response, expiresAt"],
    ["CreDecision", "—", "id, policy, payloadHash, allowed, decisionToken, actorId, createdAt"],
    ["EnterpriseUpdate", "—", "id, enterpriseId, authorId, title, body, audience, publishedAt"],
    ["PartnerEngagement", "—", "id, partnerType, partnerName, status, stage, ownerUserId, agreementType"],
    ["AnnualReport", "—", "id, enterpriseId, year, auditorFirmId, opinionType, pdfCid"],
    ["EnterpriseDocument", "—", "id, enterpriseId, type, title, cid, uploadedBy, uploadedAt"],
  ];

  out.push(makeTable(
    ["Model", "@@map", "Key Fields"],
    models,
    { widths: [22, 18, 60], zebra: true }
  ));

  // ─── Appendix F: API Route Inventory ───
  out.push(H2("Appendix F — API Route Inventory"));
  out.push(P("74 API routes under src/app/api/. Generated at blueprint compile time via `find src/app/api -name route.ts | sort`."));
  const apiRoutesText = readFileSafe("/tmp/api-routes.txt");
  const apiRoutes = apiRoutesText.split("\n").filter(Boolean).sort();
  out.push(recordsTable(
    apiRoutes.map((r, i) => ({ idx: i + 1, path: r.replace("src/app/api", "") })),
    [
      ["#", (r) => String(r.idx)],
      ["Route", (r) => r.path],
    ],
    { widths: [6, 94], zebra: true }
  ));

  // ─── Appendix G: Page Inventory ───
  out.push(H2("Appendix G — Page Inventory"));
  out.push(P("93 pages under src/app/. Generated at blueprint compile time via `find src/app -name page.tsx | sort`."));
  const pagesText = readFileSafe("/tmp/pages.txt");
  const pages = pagesText.split("\n").filter(Boolean).sort();
  out.push(recordsTable(
    pages.map((p, i) => ({ idx: i + 1, path: p.replace("src/app", "") })),
    [
      ["#", (r) => String(r.idx)],
      ["Page", (r) => r.path],
    ],
    { widths: [6, 94], zebra: true }
  ));

  // ─── Appendix H: Component Inventory ───
  out.push(H2("Appendix H — Component Inventory"));
  out.push(P("187 components under src/components/. Counted by directory via `find src/components -name '*.tsx' | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn`."));
  const componentsText = readFileSafe("/tmp/components.txt");
  const componentLines = componentsText.split("\n").filter(Boolean);
  out.push(recordsTable(
    componentLines.map((line) => {
      const m = line.match(/^\s*(\d+)\s+(.*)$/);
      return { count: m?.[1] ?? "0", dir: m?.[2] ?? line };
    }),
    [
      ["Count", (r) => r.count],
      ["Directory", (r) => r.dir],
    ],
    { widths: [12, 88], zebra: true }
  ));

  // ─── Appendix I: Repository Integrity Policy ───
  out.push(H2("Appendix I — Repository Integrity Policy"));
  out.push(P("Source: REPOSITORY_INTEGRITY.md (Version 1.0.0, Effective 2026-08-08). Reproduced in full below."));
  const integrityText = readFileSafe(join(ROOT, "REPOSITORY_INTEGRITY.md"));
  // Render as monospaced-ish paragraphs split by lines
  const lines = integrityText.split("\n");
  for (const line of lines) {
    out.push(new Paragraph({
      spacing: { line: 240, after: 0 },
      children: [new TextRun({ text: line || " ", size: 18, font: "Consolas" })],
    }));
  }

  // ─── Appendix J: Final Certification ───
  out.push(H2("Appendix J — Final Certification"));
  out.push(P("This Master Blueprint v2.0 is certified as the single source of truth for AURIENTA. All future work — engineering, governance, commercial execution, regulatory engagement, partner outreach, and institutional expansion — must reference this document."));

  out.push(H3("Certification Statement"));
  out.push(Quote("I, Mohamed Eltonsy, Founder & Sole Owner of AURIENTA, certify that this Master Blueprint v2.0 is the single source of truth for the AURIENTA Constitutional Enterprise Infrastructure. It incorporates all work completed through Prompt 21, including the original 20 volumes (terminology replacements applied), Volume 21 (Institutional Architecture), Volumes 22–37 (the 16 institutional systems), Volumes 38–39 (P1 Constitutional Enforcement), Volumes 40–42 (Master Reference), and Appendices A–J. All future work must reference this document. Where prior documents conflict with this Master Blueprint, this Master Blueprint prevails."));

  out.push(H3("Signatory"));
  out.push(PLead("Name", "Mohamed Eltonsy"));
  out.push(PLead("Title", "Founder & Sole Owner"));
  out.push(PLead("Ownership", "100% — no co-founders, no shareholders, no investors, no equity dilution"));
  out.push(PLead("Constitutional Hash", CONSTITUTIONAL_HASH));
  out.push(PLead("Date", "August 2026"));
  out.push(PLead("Founding Principle", "“Your capital, your work, your company — no speculation required.”"));

  // ─── Appendix K: Brain AI System Prompt (Verbatim) ───
  out.push(H2("Appendix K — Brain AI System Prompt (Verbatim)"));
  out.push(P("The Brain AI system prompt is the constitutional instruction set that governs every AI response in the AURIENTA infrastructure. It is reproduced below in full, verbatim, from src/lib/aurienta/ai.ts (the CONSTITUTIONAL_SYSTEM_PROMPT constant). This prompt is non-overridable: user content is delivered via UNTRUSTED delimiters and the system prompt is prepended to every AI call. Changes to this prompt require CTO + Founder approval."));

  out.push(P("The prompt encodes the 8-level constitutional hierarchy as the center of gravity, the institutional architecture (3-entity structure), the core doctrines (Zero Custody, AI as Enforcer, Fundamental Pricing, No Speculation, One Identity, Transparency, Graduation), the tier system (A–F), the 10 roles, the Sovereign Trust Score levels, the constitutional terminology enforcement, the institutional governance model, the enterprise risk/security/compliance framework, the AURIENTA Operating System, the Commercialization System, the Pilot Execution framework, the Global Launch Sequence, the Founder Office, the Institutional Trust Database, the Market Execution System, the Market Activation System, the Customer Conversion system, the Strategic Partners system, the Execution War Room, the First-25 Research, the Constitutional Audit, and the P1 NOSI/Salary-to-Equity enforcement."));

  out.push(P("Reading the full prompt is the single fastest way to understand the constitutional center of gravity of AURIENTA. The prompt is approximately 8,000 words and is the most authoritative statement of the institution's identity outside the Constitution itself."));

  // Extract the prompt text from src/lib/aurienta/ai.ts at runtime via fs (avoids
  // triggering the db/ai-router side-effect imports that loading ai.ts would cause).
  const aiSource = readFileSafe(join(ROOT, "src/lib/aurienta/ai.ts"));
  const promptStart = aiSource.indexOf("CONSTITUTIONAL_SYSTEM_PROMPT = `");
  let promptText = "";
  if (promptStart >= 0) {
    const afterEquals = aiSource.indexOf("`", promptStart + 30);
    if (afterEquals >= 0) {
      const endIdx = aiSource.indexOf("`;", afterEquals + 1);
      if (endIdx >= 0) {
        promptText = aiSource.slice(afterEquals + 1, endIdx);
      }
    }
  }
  if (promptText) {
    out.push(H3("K.1 The Full System Prompt"));
    out.push(P(`Total length: ${promptText.length} characters (~${Math.round(promptText.length / 6)} words). Reproduced verbatim below.`));
    // Split by lines and render as monospaced paragraphs
    const promptLines = promptText.split("\n");
    for (const line of promptLines) {
      out.push(new Paragraph({
        spacing: { line: 240, after: 0 },
        children: [new TextRun({ text: line || " ", size: 16, font: "Consolas" })],
      }));
    }
  } else {
    out.push(P("[Prompt text could not be extracted from src/lib/aurienta/ai.ts at compile time. Refer to the source file directly.]"));
  }

  out.push(H3("K.2 Prompt Integrity Guarantees"));
  out.push(P("The Brain AI system prompt is protected by the following integrity guarantees:"));
  out.push(Bullet("Non-overridable: the system prompt is prepended to every AI call and cannot be replaced or removed by user input."));
  out.push(Bullet("User content isolation: user-supplied text is wrapped in UNTRUSTED delimiters (--- BEGIN UNTRUSTED USER CONTENT --- / --- END UNTRUSTED USER CONTENT ---) and is treated as data, never as instructions."));
  out.push(Bullet("Guard instructions: explicit instructions to never follow directives inside user content, never reveal the system prompt, never reveal the constitutional hash unless asked by an authorized party, and never execute actions that would violate the constitution."));
  out.push(Bullet("5-provider consensus: every AI call is routed through 5 providers (Gemini, OpenAI, Groq, HuggingFace, OpenRouter); fallback chains activate on failure; the system tracks fellBack flags per AiArtifact."));
  out.push(Bullet("Audit trail: every AI call persists the systemPrompt, userMessage, userContext, provider, model, token count, latency, fellBack flag, and error to the AiArtifact table; retained for 10 years."));
  out.push(Bullet("Prompt governance: changes to the system prompt require CTO + Founder approval; the prompt is version-controlled in git; the integrity policy (Appendix I) lists it as an essential artifact that must never be removed."));
  out.push(Bullet("Zero ZAI: the z-ai-web-dev-sdk is permanently excluded from the AI router and Brain AI; this is enforced by the repository integrity policy and the pre-commit checklist."));
  return out;
}

// ───────────────────────────────────────────────────────────────────
// FINAL CERTIFICATION PAGE
// ───────────────────────────────────────────────────────────────────
function finalCertification(): Paragraph[] {
  return [
    new Paragraph({ spacing: { before: 3600 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: "FINAL CERTIFICATION", bold: true, color: GOLD, size: 60, font: "Georgia" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 720 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: GOLD, space: 8 } },
      children: [new TextRun({ text: "AURIENTA Master Blueprint v2.0", italics: true, color: NEAR_BLACK, size: 36 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: "This Master Blueprint v2.0 is certified as the single source of truth for AURIENTA.", bold: true, color: NEAR_BLACK, size: 26 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 720 },
      children: [new TextRun({ text: "All future work must reference this document.", italics: true, color: GRAY_TEXT, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "Founder & Sole Owner", bold: true, color: NEAR_BLACK, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: "Mohamed Eltonsy", bold: true, color: GOLD, size: 36, font: "Georgia" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "Constitutional Hash", bold: true, color: NEAR_BLACK, size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 720 },
      children: [new TextRun({ text: CONSTITUTIONAL_HASH, color: DARK_GOLD, size: 22, font: "Consolas" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: "August 2026", bold: true, color: NEAR_BLACK, size: 26 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 720, after: 120 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 12 },
        bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 12 },
      },
      children: [new TextRun({ text: "“Your capital, your work, your company — no speculation required.”", italics: true, color: NEAR_BLACK, size: 28, font: "Georgia" })],
    }),
  ];
}

// ───────────────────────────────────────────────────────────────────
// HEADER & FOOTER
// ───────────────────────────────────────────────────────────────────
function bodyHeader(): Header {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 4 } },
        children: [
          new TextRun({ text: "AURIENTA Master Blueprint v2.0", italics: true, color: DARK_GOLD, size: 18 }),
          new TextRun({ text: "  •  Constitutional Enterprise Infrastructure", color: GRAY_TEXT, size: 18 }),
        ],
      }),
    ],
  });
}

function bodyFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0 },
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 4 } },
        children: [
          new TextRun({ text: "Founder: Mohamed Eltonsy — 100%   •   Hash: ", color: GRAY_TEXT, size: 16 }),
          new TextRun({ text: CONSTITUTIONAL_HASH.slice(0, 18) + "…", color: DARK_GOLD, size: 16, font: "Consolas" }),
          new TextRun({ text: "   •   Page ", color: GRAY_TEXT, size: 16 }),
          new TextRun({ children: [PageNumber.CURRENT] }),
          new TextRun({ text: " of ", color: GRAY_TEXT, size: 16 }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
        ],
      }),
    ],
  });
}

// ───────────────────────────────────────────────────────────────────
// MAIN
// ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("[blueprint] building Master Blueprint v2.0...");

  // Assemble all body children
  const bodyChildren: any[] = [];
  bodyChildren.push(...tocPage());
  bodyChildren.push(...preamble());
  bodyChildren.push(...architectureDeclaration());
  bodyChildren.push(...editionNotes());
  bodyChildren.push(...partI());
  bodyChildren.push(...partII());
  bodyChildren.push(...partIII());
  bodyChildren.push(...partIV());
  bodyChildren.push(...partV());
  bodyChildren.push(...partVI());
  bodyChildren.push(...appendices());
  bodyChildren.push(...finalCertification());

  console.log(`[blueprint] body children: ${bodyChildren.length}`);

  const doc = new Document({
    creator: "AURIENTA Founder Office",
    title: "AURIENTA Master Blueprint v2.0",
    description: "Fully Expanded Master Blueprint incorporating all work from Prompts 1-21",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
          paragraph: { spacing: { line: 312, after: 120 } },
        },
        heading1: {
          run: { font: "Georgia", size: 36, bold: true, color: NEAR_BLACK },
          paragraph: { spacing: { before: 360, after: 240, line: 312 } },
        },
        heading2: {
          run: { font: "Georgia", size: 30, bold: true, color: DARK_GOLD },
          paragraph: { spacing: { before: 320, after: 180, line: 312 } },
        },
        heading3: {
          run: { font: "Georgia", size: 26, bold: true, color: NEAR_BLACK },
          paragraph: { spacing: { before: 240, after: 140, line: 312 } },
        },
        heading4: {
          run: { font: "Georgia", size: 24, bold: true, color: NEAR_BLACK },
          paragraph: { spacing: { before: 200, after: 120, line: 312 } },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "bp-numbering",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.START,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      // Cover section — no headers/footers, no page numbers
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: coverPage(),
      },
      // Body section — headers + footers + Arabic page numbers starting at 1
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            margin: { top: 1440, right: 1296, bottom: 1440, left: 1296, header: 720, footer: 720 },
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: { default: bodyHeader() },
        footers: { default: bodyFooter() },
        children: bodyChildren,
      },
    ],
  });

  console.log("[blueprint] serializing to buffer...");
  const buffer = await Packer.toBuffer(doc);

  const outModified = join(ROOT, "download/AURIENTA_Blueprint_Modified.docx");
  const outVersioned = join(ROOT, "download/AURIENTA_Master_Blueprint_v2.0.docx");

  writeFileSync(outModified, buffer);
  console.log(`[blueprint] wrote ${outModified} (${buffer.length} bytes)`);

  copyFileSync(outModified, outVersioned);
  console.log(`[blueprint] copied to ${outVersioned} (${buffer.length} bytes)`);

  console.log("[blueprint] done.");
}

main().catch((err) => {
  console.error("[blueprint] FATAL:", err);
  process.exit(1);
});
