/**
 * AURIENTA Blueprint Analysis — CTO-Level Strategic Document
 * Generator using docx-js. Follows docx skill design-system (R1 cover, 3-section
 * architecture, TOC placeholders, postcheck compliance).
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, PageBreak,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, TableLayoutType, SectionType, NumberFormat,
  TableOfContents, LevelFormat, convertInchesToTwip,
} = require("docx");
const fs = require("fs");

// ─────────────────────────────────────────────────────────────────
// PALETTE — AURIENTA "Deep Sea Blue-Gold" (Finance/Premium) with
// brand gold #D4AF37 accent.
// ─────────────────────────────────────────────────────────────────
const P = {
  primary: "#0F2027",   // Deep navy (headings, cover bg)
  body: "#000000",      // Pure black body text (Profile A formal)
  secondary: "#4A6575", // Mid-tone for captions / footers
  accent: "#D4AF37",    // AURIENTA gold
  surface: "#F5F7FA",   // Very light surface for alt rows
  goldDark: "#B8860B",  // Darker gold accent
  inkLight: "#1A2A3A",  // Lighter ink for subheads
};

const cover = {
  bg: P.primary,
  titleColor: "#FFFFFF",
  subtitleColor: "#E8D9A8",  // Soft champagne
  metaColor: "#D4AF37",
  footerColor: "#9AAEB8",
  accent: P.accent,
};

const c = (hex) => hex.replace("#", "");

// ─────────────────────────────────────────────────────────────────
// Border helpers
// ─────────────────────────────────────────────────────────────────
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = {
  top: NB, bottom: NB, left: NB, right: NB,
  insideHorizontal: NB, insideVertical: NB,
};

// Light gold border for body tables
const goldBorder = (sz = 4) => ({
  style: BorderStyle.SINGLE, size: sz, color: c(P.accent),
});
const lightLine = (sz = 4) => ({
  style: BorderStyle.SINGLE, size: sz, color: "D6D6D6",
});
const tableBorders = {
  top: lightLine(6), bottom: lightLine(6),
  left: lightLine(4), right: lightLine(4),
  insideHorizontal: lightLine(4), insideVertical: lightLine(4),
};

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function body(text, opts = {}) {
  return new Paragraph({
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    indent: opts.noIndent ? undefined : { firstLine: 360 },
    spacing: { line: 312, after: opts.after ?? 100 },
    children: [new TextRun({
      text,
      size: 22, color: c(P.body),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  });
}

function bodyRuns(runs, opts = {}) {
  return new Paragraph({
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    indent: opts.noIndent ? undefined : { firstLine: 360 },
    spacing: { line: 312, after: opts.after ?? 100 },
    children: runs,
  });
}

function R(text, props = {}) {
  return new TextRun({
    text,
    size: props.size ?? 22,
    color: c(props.color ?? P.body),
    bold: !!props.bold,
    italics: !!props.italics,
    font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    children: [new TextRun({
      text, bold: true, size: 32, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 140 },
    children: [new TextRun({
      text, bold: true, size: 28, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({
      text, bold: true, size: 24, color: c(P.goldDark),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 80 },
    indent: { left: 720 + level * 360, hanging: 280 },
    children: [
      new TextRun({ text: "•  ", bold: true, color: c(P.accent), size: 22 }),
      new TextRun({ text, size: 22, color: c(P.body),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  });
}

function bulletRuns(runs, level = 0) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 80 },
    indent: { left: 720 + level * 360, hanging: 280 },
    children: [
      new TextRun({ text: "•  ", bold: true, color: c(P.accent), size: 22 }),
      ...runs,
    ],
  });
}

function calloutBox(title, lines) {
  // A single-cell shaded box for key callouts.
  const cellChildren = [
    new Paragraph({
      spacing: { before: 100, after: 80 },
      children: [new TextRun({
        text: title, bold: true, size: 22, color: c(P.primary),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    }),
    ...lines.map((ln) => new Paragraph({
      spacing: { line: 280, after: 60 },
      children: [new TextRun({
        text: ln, size: 20, color: c(P.body),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    })),
  ];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: goldBorder(12), bottom: goldBorder(12),
      left: goldBorder(12), right: goldBorder(12),
      insideHorizontal: NB, insideVertical: NB,
    },
    rows: [new TableRow({
      cantSplit: true,
      children: [new TableCell({
        width: { size: 100, type: WidthType.PERCENTAGE },
        margins: { top: 160, bottom: 160, left: 220, right: 220 },
        shading: { type: ShadingType.CLEAR, fill: c(P.surface) },
        children: cellChildren,
      })],
    })],
  });
}

// Table cell helpers
function cellText(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    shading: opts.fill
      ? { type: ShadingType.CLEAR, fill: c(opts.fill) }
      : undefined,
    verticalAlign: "center",
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      spacing: { line: 260, after: 0 },
      children: [new TextRun({
        text: String(text ?? ""),
        size: opts.size ?? 18,
        bold: !!opts.bold,
        color: c(opts.color ?? P.body),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    })],
  });
}

function headerRow(cells, widths) {
  return new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: cells.map((t, i) => cellText(t, {
      width: widths[i], bold: true, align: AlignmentType.CENTER,
      color: "#FFFFFF", fill: P.primary, size: 18,
    })),
  });
}

function dataRow(cells, widths, opts = {}) {
  return new TableRow({
    cantSplit: true,
    children: cells.map((t, i) => cellText(t, {
      width: widths[i], fill: opts.alt ? P.surface : undefined,
      size: 18,
      align: opts.align || AlignmentType.LEFT,
    })),
  });
}

function makeTable(headers, rows, widths) {
  const trs = [headerRow(headers, widths)];
  rows.forEach((r, i) => trs.push(dataRow(r, widths, { alt: i % 2 === 1 })));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: tableBorders,
    rows: trs,
  });
}

// ─────────────────────────────────────────────────────────────────
// COVER PAGE — R1 Pure Paragraph Cover (left-aligned, dark bg + gold)
// ─────────────────────────────────────────────────────────────────
function buildCover() {
  const padL = 1200, padR = 800;
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: c(P.accent), space: 12 };
  const children = [];

  // 1. Top whitespace
  children.push(new Paragraph({ spacing: { before: 1600 } }));

  // 2. English label with accent bottom border
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    spacing: { after: 500 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: c(P.accent), space: 8 } },
    children: [new TextRun({
      text: "C O N S T I T U T I O N A L   E N T E R P R I S E   I N F R A S T R U C T U R E",
      size: 18, color: c(P.accent),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      characterSpacing: 40,
    })],
  }));

  // 3. Main title
  children.push(new Paragraph({
    indent: { left: padL },
    spacing: { after: 100, line: 800, lineRule: "atLeast" },
    children: [new TextRun({
      text: "AURIENTA", size: 80, bold: true,
      color: c(cover.titleColor),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));
  children.push(new Paragraph({
    indent: { left: padL },
    spacing: { after: 300, line: 600, lineRule: "atLeast" },
    children: [new TextRun({
      text: "Constitutional Enterprise Infrastructure",
      size: 36, color: c(cover.subtitleColor),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));

  // 4. Subtitle
  children.push(new Paragraph({
    indent: { left: padL },
    spacing: { after: 800 },
    children: [new TextRun({
      text: "CTO Blueprint Analysis  ·  Strategic Review & Implementation Assessment",
      size: 26, color: c(cover.metaColor),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));

  // 5. Meta info lines with left accent border
  const meta = [
    "Constitutional Hash (Root)",
    "0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A",
    "",
    "Platform Score (Post-Remediation):  78 / 100",
    "Core Launch:  January 2026   ·   Institutional Framework:  Q4 2026",
    "Founding Principle:  Your capital, your work, your company — no speculation required.",
  ];
  for (const line of meta) {
    if (line === "") {
      children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: " " })] }));
      continue;
    }
    children.push(new Paragraph({
      indent: { left: padL + 200 },
      spacing: { after: 100 },
      border: { left: accentLeft },
      children: [new TextRun({
        text: line, size: 22, color: c(cover.metaColor),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    }));
  }

  // 6. Bottom whitespace
  children.push(new Paragraph({ spacing: { before: 1400 } }));

  // 7. Footer with top accent separator
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: c(P.accent), space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: "CTO Office  ·  Confidential — Internal Strategic Review",
        size: 16, color: c(cover.footerColor),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: "Document v1.0  ·  Post-Remediation Synthesis",
        size: 16, color: c(cover.footerColor),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  }));

  // Single 16838 wrapper
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: c(cover.bg) },
        borders: noBorders,
        children,
      })],
    })],
  })];
}

// ─────────────────────────────────────────────────────────────────
// FOOTERS (page numbers)
// ─────────────────────────────────────────────────────────────────
function pageNumFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ children: [PageNumber.CURRENT], size: 18,
          color: c(P.secondary),
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      ],
    })],
  });
}

// ─────────────────────────────────────────────────────────────────
// TOC SECTION
// ─────────────────────────────────────────────────────────────────
function buildTocSection() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 480, after: 360 },
      children: [new TextRun({
        text: "Table of Contents",
        bold: true, size: 36, color: c(P.primary),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 320 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: c(P.accent), space: 8 } },
      children: [new TextRun({ text: "", size: 4 })],
    }),
    new TableOfContents("Table of Contents", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }),
    new Paragraph({
      spacing: { before: 200 },
      children: [new TextRun({
        text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \"Update Field.\"",
        italics: true, size: 18, color: "888888",
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    }),
    new Paragraph({
      spacing: { before: 0 },
      children: [
        new TextRun({ text: "— End of Table of Contents —", size: 16,
          color: c(P.secondary), italics: true,
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
        new PageBreak(),
      ],
    }),
  ];
}

// ─────────────────────────────────────────────────────────────────
// BODY CONTENT — 13 sections
// ─────────────────────────────────────────────────────────────────
function buildBody() {
  const out = [];

  // ============== 1. EXECUTIVE SUMMARY ==============
  out.push(h1("1.  Executive Summary"));
  out.push(body(
    "AURIENTA is the world's first constitutional launchpad — a noncustodial infrastructure of structural trust that transforms everyday capital into real-economy corporate ownership through digital constitutional rules that cannot be bent, bypassed, or broken. The platform sits at the intersection of three ordinarily competing primitives: (1) zero-custody investor protection, (2) AI-enforced governance that removes human discretion from valuation, salary, expense, and dividend decisions, and (3) a graduated sovereignty pathway that transitions mature enterprises off the platform entirely. AURIENTA holds no funds, makes no discretionary decisions, and never contracts platform dependency as the price of participation."
  ));
  out.push(body(
    "The constitutional thesis is straightforward: ownership without governance becomes speculation, and governance without enforcement becomes institutional theatre. AURIENTA's answer is the Constitutional Runtime Engine (CRE) — a deterministic, policy-as-code enforcement layer intermediating every state transition with a fail-secure 500ms consensus window. Combined with a sovereign identity layer, a six-tier enterprise ladder (A through F), a 7-stage Project Evaluation Engine, and a multi-firm Constitutional Escrow Vault, the platform converts constitutional text into operational, machine-enforceable reality. No human — not the founder, not the largest capital partner, not even AURIENTA's own stewards — can override the CRE."
  ));

  out.push(h2("1.1  Current Implementation State"));
  out.push(body(
    "Following the four-wave CTO audit (CTO-AUDIT-1 through -4) and the orchestrated remediation programme (REMED-1A through REMED-1F + orchestrator fixes), the platform stands at a post-remediation score of 78 / 100. The pre-remediation score of 58 / 100 reflected three existential risks: (1) demo passwordless sign-in enabled by default with mocked Ed25519 signing, (2) a hash-chain ledger with no verify-on-read and a racy append path, and (3) several UI claims (regulated cross-border escrow, real-time OFAC/EU/EG sanctions screening, FX-locked routes) that were mocked at the presentation layer — exposing the platform to regulator misrepresentation risk. All fourteen P0 blockers have been addressed: real Ed25519 signing via tweetnacl, transactional ledger append with verifyLedgerChain, CSRF middleware with SameSite=Lax sessions, full Zod parseBody on every money/AI/governance route, AES-GCM PII encryption, per-user police-clearance wiring, and truth-in-UX relabelling of mocked subsystems as pilot/roadmap."
  ));
  out.push(body(
    "The world-trade layer — scored at 18 / 100 pre-remediation — now has a working foundation: a Currency primitive, a real FX rate service backed by Central Bank of Egypt rates, BankPartner entities, UCP 600 Letter-of-Credit instruments, trade-document models with Nafeza ACI numbers, sanctions screening audit trails, export-readiness graduation gates, escrow waterfall and force-majeure event schemas, and a public ledger-verify endpoint. The Diaspora Bridge page now uses the real FxRate table instead of Math.random."
  ));

  out.push(h2("1.2  Three Most Important Strategic Priorities"));
  out.push(body(
    "Despite the remediation lift, three strategic priorities dominate the path from current state to a credible Q4 2026 institutional launch. They are listed in priority order."
  ));
  out.push(bulletRuns([
    R("PRIORITY 1 — Migrate from SQLite to PostgreSQL and execute prisma migrate. ", { bold: true }),
    R("The platform currently runs on SQLite with db:push, which is unsuitable for concurrent transactional workloads at scale. The hash-chain ledger, escrow waterfall, and vote-tally atomic increments all depend on serialisable isolation that SQLite cannot guarantee under load. This is the single largest production-readiness gap.", { color: P.body }),
  ]));
  out.push(bulletRuns([
    R("PRIORITY 2 — Complete the world-trade vertical. ", { bold: true }),
    R("Multi-currency primitives, FX rates, and L/C document models exist as schema and stubs, but the actual banking-partner integration (CIB, NBE), Nafeza ACI pre-registration, real-time sanctions screening via a third-party (Refinitiv / Dow Jones Risk), and the SCF waterfall orchestration are not yet operational. Without this, the Diaspora Bridge — AURIENTA's primary growth vector into USD/GBP/CAD/AED/SAR-denominated capital — cannot onboard a real investor.", { color: P.body }),
  ]));
  out.push(bulletRuns([
    R("PRIORITY 3 — Close the role-architecture console gap. ", { bold: true }),
    R("Two of the ten ROLE_META roles (board_member, university_rep) have no dedicated dashboard page, and five admin pages (steward, fra, law-firm, accounting, company-owner) lack RBAC gating — any signed-in user can currently view another role's console. This is both a UX completeness issue and a security/privacy gap that must be closed before institutional launch.", { color: P.body }),
  ]));

  out.push(calloutBox("Bottom Line", [
    "AURIENTA is a genuinely state-of-the-art concept (vision/architecture score: 82/100) that is approximately 78% of the way to a credible institutional launch. The remaining 22% is execution, not invention: database migration, third-party integrations, RBAC completion, and a 6-month institutional hardening sprint. The constitutional design is sound; the engineering is increasingly so.",
  ]));
  out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  // ============== 2. PLATFORM ARCHITECTURE ==============
  out.push(h1("2.  Platform Architecture Overview"));
  out.push(body(
    "AURIENTA's architecture is organised around six interdependent pillars. Each pillar is independently auditable, but they are designed to interlock: identity authorises participation; tiers bound the rules; escrow protects the capital; CRE enforces the rules; graduation returns sovereignty; and the Oracle Mirror guarantees continuity even if the platform itself fails. The diagram of relationships is best read as a directed cycle: Identity → Tier Selection → Escrow & Capital Formation → CRE Enforcement → Maturity Accumulation → Graduation → Alumni / Sovereign Operation, with the Oracle Mirror wrapping the entire loop as a continuity guarantee."
  ));

  out.push(h2("2.1  The Six Pillars"));

  out.push(h3("Pillar 1 — Constitutional Runtime Engine (CRE)"));
  out.push(body(
    "The CRE is AURIENTA's enforcement core. It runs as three isolated WebAssembly modules executing Rego policies, with no external network calls permitted during validation. A fail-secure consensus mesh requires agreement within 500ms; silence is denial. Every state transition — investment, milestone release, expense approval, salary calculation, vote tally, dividend distribution, secondary-market trade — must obtain a signed CRE decision token before the underlying service may execute. The CRE does not make discretionary decisions: it validates against the non-amendable constitutional rules (Volume 1A) and constitutionally approved policies, returning either a token or an explainable rejection."
  ));

  out.push(h3("Pillar 2 — Sovereign Identity & Trust Network"));
  out.push(body(
    "Identity is anchored cryptographically to an Ed25519 keypair generated at registration. Three verification levels (L1 basic, L2 KYC with liveness + deepfake detection, L3 enhanced for foreign investors and large transactions) gate progressively more privileged actions. A Sovereign Trust Score (0–100) accumulates across roles and enterprises, producing five reputation tiers from Emerging Participant (0–49) to Constitutional Pillar (90–100). Every role grant produces a W3C Verifiable Credential signed by AURIENTA (or by a law firm for escrow credentials), portable to external verifiers without calling back to AURIENTA APIs."
  ));

  out.push(h3("Pillar 3 — Constitutional Tiers (A–F)"));
  out.push(body(
    "Six tiers match governance complexity to enterprise maturity: Tier A (micro, ≤3M EGP), Tier B (small, ≤25M), Tier C (growth, unlimited), Tier D (established LLC, owner-control preserved), Tier E (university research SPV), and Tier F (Joint Stock Company with public listing). Each tier defines its own legal form, founder-equity split, board composition, fee structure, ERP requirement, audit regime, and graduation pathway. Tier migration (A→B→C→D→F) is governed by objective thresholds and shareholder vote, not by AURIENTA discretion."
  ));

  out.push(h3("Pillar 4 — Constitutional Escrow Vault"));
  out.push(body(
    "All capital flows directly from the investor to a licensed Egyptian law firm's escrow account. AURIENTA never holds, moves, or delays funds. The 0xB4F8…D1A constitutional hash anchors the bankruptcy-remote escrow architecture: multi-firm redundancy (three FRA-licensed firms per enterprise at formation, replaceable by shareholder vote after 12 months), dual-signature bank transfers (manager + accountant), automatic 0.5% Anti-Fragility Vault contribution, and an indefinite segregated-trust protocol for failed transfers and unclaimed dividends. The CRE issues a token; the law firm executes; the ledger records. None of these three actors can act alone."
  ));

  out.push(h3("Pillar 5 — Graduation & Sovereignty"));
  out.push(body(
    "Dependency is transitional; sovereignty is the destination. Enterprises progress through four maturity stages — Stage 1 Protected Formation, Stage 2 Structured Growth, Stage 3 Institutional Independence, Stage 4 Sovereign Independence — each with objective thresholds (operating months, governance score, profitable quarters, audit cleanliness). Stage 4 graduation requires a 75% supermajority shareholder vote, a 30-day cooling period, and triggers the Sovereign Export Package: governance records, ownership ledger, runtime logic, audit lineage, and the CRE Docker image itself, all exportable to the enterprise's own infrastructure. The Alumni Hall preserves a public record of graduated enterprises."
  ));

  out.push(h3("Pillar 6 — Oracle Mirror"));
  out.push(body(
    "If AURIENTA becomes unreachable for 7 consecutive days — internet outage, cyberattack, government shutdown, or entity failure — the Oracle Mirror protocol activates automatically. Enterprises continue operating using a legally binding physical hardcopy constitution: emergency boards meet physically, paper ballots are signed, and when connectivity returns the accountant inputs the decisions for CRE validation and ledger backfill. The open-source CRE code is archived with a neutral foundation; enterprises may continue operating indefinitely without AURIENTA."
  ));

  out.push(h2("2.2  How the Pillars Interconnect"));
  out.push(body(
    "The pillars form a closed-loop trust architecture. Identity (Pillar 2) authenticates the participant; the Tier system (Pillar 3) bounds the rules that apply; the Escrow Vault (Pillar 4) protects the capital that flows; the CRE (Pillar 1) enforces every rule on every flow; Graduation (Pillar 5) returns sovereignty once maturity thresholds are met; and the Oracle Mirror (Pillar 6) wraps the entire loop with a survival guarantee. Removing any single pillar collapses the value proposition: without the CRE, governance is theatre; without the Escrow Vault, the platform becomes a custodian; without Graduation, dependency is permanent; without the Oracle Mirror, the entire stack has a single point of failure."
  ));

  // ============== 3. CONSTITUTIONAL GOVERNANCE ==============
  out.push(h1("3.  Constitutional Governance Model"));
  out.push(body(
    "AURIENTA's governance model differs from traditional corporate governance in three structural ways. First, the constitution is non-amendable in its core rules; amendments to peripheral rules require a 75% supermajority of global voting power, a 90-day cooling period, and law-firm review. Second, governance is executed by software (the CRE), not by humans — the board proposes, but the CRE disposes. Third, every governance action is published on an immutable ledger in real time, with a 51% quorum threshold and automatic execution once outcomes are mathematically determined."
  ));

  out.push(h2("3.1  Non-Amendable Constitutional Rules"));
  out.push(body(
    "The non-amendable rules (Volume 1A) define the structural invariants of the platform. They cannot be changed by any vote, by any steward, or by AURIENTA itself. They include: zero custody (AURIENTA never holds investor funds), the ±5% fundamental pricing band (speculation is constitutionally prohibited), the 5%+2.5% fee structure (with the consulting opt-out path), the 75% supermajority requirement for constitutional amendments, the 14-day preemptive rights window (or longer if local law mandates), the 30-day NOSI social-insurance registration requirement, police-clearance requirements for managers, the Anti-Fragility Vault contribution mechanism, and the graduation pathway itself."
  ));

  out.push(h2("3.2  The Nine Proposal Types"));
  out.push(body(
    "All governance flows through nine constitutionally-defined proposal types. Each has its own proposer-eligibility threshold, filing fee (refundable if the proposal passes), cooling period, and voting period — designed to balance access (anyone can propose) with friction (frivolous proposals cost money and time)."
  ));

  out.push(makeTable(
    ["Proposal Type", "Min. Support to Propose", "Fee (EGP)", "Cooling", "Voting"],
    [
      ["Manager appointment", "Any board member", "0", "24h", "48h"],
      ["Manager removal", "≥5% voting power OR any board member", "500 (refundable if passes)", "48h", "72h"],
      ["Budget (>10% capital)", "Manager or board", "0", "48h", "48h"],
      ["Dividend declaration", "Board", "0", "7 days notice", "24h (board)"],
      ["Constitutional amendment (enterprise)", "≥10% voting power", "2,000", "90 days", "14 days"],
      ["Graduation", "≥5% voting power", "1,000 (refundable if passes)", "30 days", "14 days"],
      ["Emergency freeze override", "Any board member", "0", "0", "24h (board)"],
      ["Law firm / accountant replacement", "≥5% voting power (after 12 months)", "500", "14 days", "7 days"],
      ["Consulting opt-out (post 3q profit / 2y)", "Any shareholder ≥5%", "0", "14 days", "7 days"],
    ],
    [22, 25, 16, 14, 13],
  ));
  out.push(new Paragraph({ spacing: { after: 160 }, children: [] }));

  out.push(h2("3.3  Voting Thresholds & Execution"));
  out.push(body(
    "Quorum is 51% of total voting power. Most proposals pass by simple majority of votes cast. Constitutional amendments require 75% supermajority of global voting power — not merely of those voting, but of all outstanding voting power. The CRE counts votes in real time and may execute immediately when the outcome becomes mathematically determined, even if the voting period has not elapsed. All votes are weighted by Equity Units held (one unit = one vote), with the exception of the six constitutional veto categories reserved for the AURIENTA representative (which exist to block constitutional violations, not to participate in commercial decisions)."
  ));

  out.push(h2("3.4  The AI-Enforced Policy Engine"));
  out.push(body(
    "The CRE's Rego policies are public, auditable, and version-controlled. Policy updates follow a staged rollout: a new policy is tested against historical transactions (all past trades must remain valid under the new rule), staged in a quarantine environment, then activated at midnight across all three CRE nodes simultaneously. Once activated, a policy cannot be changed except through the constitutional amendment process. Every policy decision is logged with its inputs, the policy version, and the resulting token or rejection — providing a complete audit lineage that the FRA, any court, or any Constitutional Partner may inspect."
  ));

  out.push(h2("3.5  Contrast with Traditional Corporate Governance"));
  out.push(body(
    "Traditional corporate governance is slow: weeks to schedule meetings, days to collect votes, hours to count ballots. Ambiguity is the norm — \"reasonable,\" \"good faith,\" \"market salary,\" \"excessive expense\" are all subject to interpretation and dispute. AURIENTA replaces this with deterministic, machine-enforced rules: \"market salary\" becomes an AI-calculated number (Base × Tier_multiplier × Performance_score × Regional_adjustment × Profit_factor); \"excessive expense\" becomes a dual-signature threshold (>10% of capital requires board vote); \"reasonable notice\" becomes a 14-day cooling period. Decision latency collapses from weeks to minutes; ambiguity is engineered out, not managed."
  ));

  // ============== 4. TIER SYSTEM DEEP DIVE ==============
  out.push(h1("4.  Tier System Deep Dive"));
  out.push(body(
    "The six-tier ladder matches governance complexity, investor protection, and operational requirements to enterprise maturity. A microenterprise (Tier A) should not be burdened with the governance requirements of a Joint Stock Company (Tier F); but a JSC must have the governance infrastructure appropriate for public markets. Tier is not a static classification — enterprises may migrate upward through constitutional maturity stages and tier-upgrade votes, but never downward (a graduated Tier F cannot return to Tier A)."
  ));

  out.push(h2("4.1  Tier Reference Table (A–F)"));
  out.push(makeTable(
    ["Parameter", "Tier A (Micro)", "Tier B (Small)", "Tier C (Growth)", "Tier D (Established)", "Tier E (University)", "Tier F (JSC)"],
    [
      ["Legal Form", "LLC", "LLC", "LLC", "LLC", "University SPV", "Joint Stock Co."],
      ["Max Raise (EGP)", "3M hard cap", "25M", "Unlimited", "Unlimited", "5M (→15M by 75% vote)", "Unlimited (incl. IPO)"],
      ["Min Investment", "50 EGP", "50 EGP", "50 EGP", "50,000 EGP", "50 EGP", "1 share / agreement"],
      ["Founder Equity", "5% permanent + 5% profit share", "5% + 5% after 12 profit-months / 120% revenue milestone", "10% + 25% vesting (4y, 1y cliff)", "AI dilution — owner ≥51% preserved", "0% (university owns IP)", "By JSC bylaws (market)"],
      ["Service Fee", "5%", "5%", "5%", "5%", "1% (discounted)", "5%"],
      ["Consulting Fee", "2.5%", "2.5%", "2.5%", "2.5%", "None", "2.5%"],
      ["Consulting Opt-Out", "After 3 profitable qtrs / 2y", "Same", "Same", "Same", "N/A", "Same"],
      ["ERP Required", "No (AURIENTA Lite)", "Optional (Lite Enhanced)", "Yes (AURIENTA / certified)", "Yes", "No (grant reporting)", "Yes"],
      ["Annual Audit", "Compilation (5–15k EGP)", "Review (15–40k)", "Full statutory (40–150k+)", "Full statutory", "Grant compliance (10–30k)", "Full statutory (FRA)"],
      ["Manager Default", "Independent (founder banned 12mo)", "Elected (simple majority)", "Founder default", "Owner default", "PI (university-appointed)", "CEO (board-appointed)"],
      ["Police Clearance (Manager)", "Yes", "Yes", "Yes", "Yes", "No", "Yes"],
      ["Board Size", "3", "3–5", "5–7", "5–9", "3–4", "Min 3 (+1 independent)"],
      ["Use Case", "First-time founders, micro", "Experienced operators", "High-growth", "Existing LLCs", "University research spinouts", "Public-listing candidates"],
    ],
    [16, 14, 14, 14, 14, 14, 14],
  ));
  out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  out.push(h2("4.2  Tier Migration Path A → B → C → D → F"));
  out.push(body(
    "Tier progression is governed by objective thresholds and shareholder vote. Tier A enterprises may fast-track to Tier B after 6 profitable months and revenue above 500,000 EGP (simple majority). Tier B may fast-track to Tier C after 24 months, a governance score ≥90, four profitable quarters, and a clean audit (75% supermajority). Tier C and Tier D progress automatically to Stage 3 Institutional Independence upon threshold achievement; Stage 4 Sovereign Independence requires a 75% vote. Tier E (university SPVs) follow a separate spinout pathway: a Tier E → Tier C/D conversion via university vote, with a perpetual 25% gross-revenue royalty stream back to the university. Tier F (JSC) graduation requires FRA/EGX disclosure compliance and a 75% shareholder vote."
  ));
  out.push(body(
    "Tier D deserves special attention: it is the on-ramp for existing Egyptian LLCs (≥2 years operating, verified via GAFI commercial register). Owner control is preserved (>51% post-formation, unless waived by 75% vote), and the dynamic-minimum-investment formula uses a 0.8 safety factor with a 50,000 EGP institutional floor. Tier D proposals must additionally pass the Tier D Viability Score (≥40/100), which scores historical financial health; below 40, the proposal is auto-rejected even if the overall Feasibility Score is ≥35."
  ));

  // ============== 5. FEASIBILITY & ENTERPRISE FORMATION ==============
  out.push(h1("5.  Feasibility & Enterprise Formation"));
  out.push(body(
    "Every enterprise proposal submitted to AURIENTA (Tiers A–F) must pass through a multi-stage AI evaluation pipeline that produces a Feasibility Score (0–100). A score of ≥35 allows progression to the Pre-Partnership Constitutional Consensus Phase; a score below 35 results in auto-rejection with a 30-day cooling period and AI-generated improvement recommendations. The evaluation is deterministic, explainable, and fully logged on the immutable ledger. All AI models are bounded with fallback to human review."
  ));

  out.push(h2("5.1  The 7-Stage Project Evaluation Engine"));
  out.push(body(
    "The pipeline is implemented as seven sequential stages, each logged with its inputs, model version, and outputs. Failure at any stage produces a structured rejection."
  ));
  out.push(makeTable(
    ["#", "Stage", "Engine", "Purpose / Key Rule"],
    [
      ["1", "Business Type & Tier Validation", "Rule-based", "Tier must match founder eligibility. Sector P/E loaded from CAPMAS/EGX. Tier D requires ≥2y operating (GAFI verify)."],
      ["2", "1-Year Expense Feasibility", "Gemma 2 27B (HF)", "Runway analysis. Reject if <12 months. Flags outliers >3σ. Fee impact modelled. 5% contingency minimum."],
      ["3", "Financial Consistency Check", "Rule-based", "3-year P&L, cash flow, balance sheet must reconcile. Unrealistic growth (>200% YoY) triggers sanity flag."],
      ["4", "Founder Credibility", "Llama 3.2 70B (Groq)", "Pattern match on trust score, exits, experience, team, Tier D history. 0–12% founder premium bonus."],
      ["5", "Fraud & Duplicate Detection", "Llama 3.2 (Groq)", "Plagiarism against existing proposals. Duplicate founder identity check. Sanctions screening (OFAC/EU/UN/EG FIU)."],
      ["6", "Optional Material Scoring", "Gemma 2 27B", "Feasibility study (+10), pitch deck (+8), pitch video (+7). Cap +25. AI justifies each score."],
      ["7", "Sanity Check & Final Score", "Mixtral 8x22B (HF)", "Consistency review, ±10 adjustment to raw score. Tier D Viability Score (≥40) check. Final Feasibility Score = adjusted raw + bonus (cap 100)."],
    ],
    [6, 24, 22, 48],
  ));
  out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  out.push(h2("5.2  The ≥35 Threshold"));
  out.push(body(
    "The ≥35 threshold is the constitutional gate between proposal and capital formation. Below 35, the proposal is rejected with a 30-day cooling period during which the founder may not re-submit. The AI generates a written improvement report citing specific weaknesses — typically insufficient runway, inconsistent financial projections, or weak founder credibility signals. The threshold is intentionally low enough to permit first-time founders with reasonable plans (Tier A) while filtering out proposals that fail the most basic viability tests."
  ));

  out.push(h2("5.3  Optional Materials (Bonus System)"));
  out.push(body(
    "Founders may upload three optional materials to increase their Feasibility Score. No penalty applies for omission. The total bonus is capped at +25 points, and the final score cannot exceed 100."
  ));
  out.push(makeTable(
    ["Material", "Format", "Max Bonus", "Evaluation Criteria (Gemma 2 27B)"],
    [
      ["Feasibility study", "PDF (≤30 pages)", "+10", "Depth of market research, risk analysis, regulatory assessment, sensitivity analysis, scenario planning."],
      ["Pitch deck", "PDF/PPT (≤20 slides, 20 MB)", "+8", "Clarity of business model, market opportunity, competitive advantage, team credibility, financial realism, visual design."],
      ["Pitch video", "MP4 (≤3 min, 100 MB)", "+7", "Founder confidence, communication clarity, production quality, authenticity, ability to articulate value proposition."],
    ],
    [22, 26, 12, 40],
  ));
  out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  out.push(body(
    "Worked example: a founder uploads a feasibility study scored 85/100 (+8.5 points), a pitch deck scored 90/100 (+7.2 points), and a pitch video scored 70/100 (+4.9 points). Total bonus = 8.5 + 7.2 + 4.9 = 20.6 points. If the raw mandatory score was 78, the final Feasibility Score = 78 + 20.6 = 98.6 → rounded to 99 → PASS (≥35). The AI also flags cross-material contradictions (e.g., pitch deck claims 50% market share while feasibility study forecasts 10%); such contradictions reduce the bonus by 20%."
  ));

  out.push(h2("5.4  Constitutional Evaluation Report (CER)"));
  out.push(body(
    "After each evaluation, the system generates a Constitutional Evaluation Report that is: (a) stored permanently on the immutable ledger, (b) visible to the founding operator with full detail, (c) visible to the public with sensitive founder data redacted, and (d) exportable as a PDF for regulator review. The CER includes the final Feasibility Score, the per-stage scores, the AI's written justification for each stage, any flags or contradictions detected, and a recommendation (PASS / REJECT / RESUBMIT). The CER becomes part of the enterprise's permanent record and is referenced at each subsequent maturity-stage transition."
  ));

  // ============== 6. ROLE ARCHITECTURE ==============
  out.push(h1("6.  Role Architecture"));
  out.push(body(
    "AURIENTA defines ten constitutional roles, each with explicit scope, inheritance, granting authority, and police-clearance requirements. Roles are not job titles — they are permissioned capabilities enforced by the CRE. Every role grant produces a W3C Verifiable Credential signed by AURIENTA (or by a law firm for escrow credentials) and is recorded on the immutable ledger. No role may exercise permissions beyond its constitutional definition, regardless of UI or API access."
  ));

  out.push(h2("6.1  The Ten Roles"));
  out.push(makeTable(
    ["Role", "Scope", "Inherits From", "Granted By", "Police Clearance", "Dashboard Page Status"],
    [
      ["capital_partner", "Per enterprise", "constitutional_partner", "Investment (auto)", "No", "Live (/portfolio)"],
      ["founding_operator", "Per enterprise", "constitutional_partner", "Enterprise creation", "No", "Live (/founder + /manager)"],
      ["workforce_partner", "Per enterprise", "constitutional_partner", "Employment (hire event)", "No", "Live (/workforce)"],
      ["manager", "Per enterprise", "founding_operator / workforce_partner", "Shareholder vote / board appointment", "Yes (6-month validity)", "Live (/manager)"],
      ["board_member", "Per enterprise", "constitutional_partner", "Shareholder vote / board appointment", "No (except AURIENTA rep)", "MISSING — no dedicated page"],
      ["company_owner", "Platform (entity)", "constitutional_partner", "Company linking + UBO verification (GAFI)", "No", "Live (/company-owner)"],
      ["law_firm_rep", "Platform (firm)", "constitutional_partner", "Firm registration + Steward approval", "No (firm responsible)", "Live (/law-firm)"],
      ["accounting_firm_rep", "Platform (firm)", "constitutional_partner", "Firm registration + Steward approval", "No", "Live (/accounting)"],
      ["aurienta_rep", "Per enterprise", "board_member (special)", "AURIENTA Steward appointment", "No (platform-appointed)", "Live (/steward + /fra)"],
      ["university_rep", "Per enterprise (Tier E)", "board_member (advisory)", "University TTO", "No", "MISSING — no dedicated page"],
    ],
    [16, 14, 18, 22, 14, 16],
  ));
  out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  out.push(h2("6.2  Permission Matrix (Constitutional Actions)"));
  out.push(body(
    "The CRE enforces a strict permission matrix on every constitutional action. The following table summarises the key action-role mapping; the full matrix is implemented in Rego and audited by the FRA."
  ));
  out.push(makeTable(
    ["Action", "Capital Partner", "Founding Operator", "Manager", "Board Member", "Steward", "Company Owner"],
    [
      ["Browse public projects", "✓", "✓", "✓", "✓", "✓", "✓"],
      ["Invest in enterprise", "✓", "—", "—", "—", "—", "✓ (as entity)"],
      ["Create enterprise", "—", "✓", "—", "—", "—", "✓ (if company rep)"],
      ["Approve expense <1% capital", "—", "—", "✓", "—", "—", "—"],
      ["Approve expense 1–10% capital", "—", "—", "✓ (dual-sig w/ accountant)", "—", "—", "—"],
      ["Approve expense >10% capital", "—", "—", "—", "✓", "—", "—"],
      ["Vote on governance proposal", "✓ (if shareholder)", "✓ (if shareholder)", "—", "✓", "—", "✓ (company votes)"],
      ["Propose manager removal", "— (unless ≥5% voting power)", "—", "—", "✓", "—", "—"],
      ["Veto constitutional violation", "—", "—", "—", "✓ (aurienta_rep; 6 categories)", "—", "—"],
      ["Suspend user account", "—", "—", "—", "—", "✓", "—"],
      ["Override CRE decision", "—", "—", "—", "—", "✓ (limited conditions)", "—"],
      ["Link company to account", "—", "—", "—", "—", "—", "✓ (self)"],
    ],
    [28, 12, 12, 12, 12, 12, 12],
  ));
  out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  out.push(h2("6.3  Police Clearance Requirements"));
  out.push(body(
    "All manager-role appointments (Tiers A, B, C, D, F) require a valid police clearance certificate, verified by the law firm via the Ministry of Interior API where available, otherwise manually. The clearance is valid for six months; the CRE sends reminders 30, 14, and 7 days before expiry. If expired, manager privileges are auto-suspended until renewed. Tier E (university SPVs) exempts the PI from police clearance — that responsibility lies with the university. The Steward role requires an enhanced background check beyond standard police clearance."
  ));

  out.push(h2("6.4  Dashboard Coverage — Current State"));
  out.push(body(
    "Following the ROLE-AUDIT, eight of ten roles have at least one working dashboard page. Two roles — board_member and university_rep — have no dedicated console. The closest pages (board-briefings and alumni) are not role-gated. Additionally, five admin pages (steward, fra, law-firm, accounting, company-owner) lack RBAC enforcement: any signed-in user can currently view another role's console. The most urgent single-line fix is the credentials/page.tsx line-47 operator-precedence bug that produces \"ed25519:undefined\" for users without an Ed25519 keypair. The most impactful structural fix is creating the two missing role pages with RBAC and role-appropriate actions."
  ));

  // ============== 7. FINANCIAL MECHANICS ==============
  out.push(h1("7.  Financial Mechanics"));
  out.push(body(
    "AURIENTA's financial mechanics are designed to eliminate speculation, protect capital, and align incentives across investors, founders, and the platform. The system's fundamental pricing formula replaces market discovery with AI-computed valuation; the ±5% secondary-market band prohibits speculative trading; the milestone-based fee structure aligns AURIENTA's revenue with enterprise success; the DRIP programme compounds investor capital; and the Anti-Fragility Vault provides collective insurance against exogenous shocks."
  ));

  out.push(h2("7.1  Fundamental Pricing Formula"));
  out.push(body(
    "Every share price on AURIENTA is computed by the JOZOUR v3 valuation engine, not by market discovery. The formula:"
  ));
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120, line: 320 },
    children: [new TextRun({
      text: "share price = ( EPS × Sector P/E × Growth multiplier ) + ( 0.3 × NAV / share )",
      bold: true, size: 24, color: c(P.primary),
      font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" },
    })],
  }));
  out.push(body(
    "The price is updated daily by a scheduled job and is the sole reference for primary issuance and secondary-market trading. The secondary market operates within a ±5% price band around the AI fundamental price; trades outside the band are CRE-rejected. An exceptional-news band of ±10% exists for material events (merger, audit qualification, regulatory action) and requires board approval. Speculation — buying low to sell high on sentiment rather than fundamentals — is constitutionally prohibited and enforced by the CRE policy no_speculation.rego."
  ));

  out.push(h2("7.2  Fee Structure"));
  out.push(body(
    "Fees are deducted from each milestone release (or annually upfront for consulting) — never as a percentage of capital raised, never as a performance fee, and never as carried interest. The structure is transparent, uniform across tiers (except Tier E at 1%), and capped."
  ));
  out.push(makeTable(
    ["Fee Component", "Rate", "Timing", "VAT Treatment", "Opt-Out Path"],
    [
      ["Platform service fee", "5% (Tier E: 1%)", "Deducted from each milestone release", "14% VAT on cash fees", "None (constitutional)"],
      ["Consulting fee", "2.5%", "Annual upfront from first milestone of fiscal year", "14% VAT", "Shareholder vote after 3 profitable quarters OR 2 years consultancy"],
      ["Equity fee", "0% (abolished v7.1)", "—", "—", "—"],
      ["Anti-Fragility Vault", "0.5%", "Deducted at investment, not milestone", "Not VAT-applicable (insurance reserve)", "None (constitutional)"],
      ["Escrow fee (law firm)", "≤0.5% of funds raised, capped 10k EGP", "Per raise", "Per law-firm invoice", "Negotiated by Federation"],
      ["Audit fee", "Per tier (5k–150k+ EGP)", "Annual", "Standard", "Subsidised 50% for Tier A first 2 years"],
    ],
    [24, 18, 22, 16, 20],
  ));
  out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  out.push(h2("7.3  Consulting Opt-Out"));
  out.push(body(
    "Consulting fees are mandatory until the enterprise achieves three consecutive net-profit quarters OR completes two years of consultancy, after which any shareholder with ≥5% voting power may propose discontinuation. Vote: 14-day cooling, 7-day voting, 51% quorum, simple majority passes. If passed, consulting fees stop at the next fiscal year with no refund for the current prepaid period. The enterprise continues to receive platform service (CRE enforcement, secondary market) without dedicated consulting — an explicit \"training wheels off\" mechanism."
  ));

  out.push(h2("7.4  Dividend Reinvestment Programme (DRIP)"));
  out.push(body(
    "Capital Partners may elect to automatically reinvest dividends into additional Equity Units at the AI fundamental price (within the ±5% CRE band), bypassing the secondary market. The reinvestment calculation uses a 4% annual yield on cost basis, with 10% withholding tax deducted at source. Resulting shares = floor(reinvestAmount / sharePrice). The DRIP dashboard (now live at /dashboard/drip after REMED-1D) shows YTD projected gross dividends, reinvested capital, and reinvested shares per holding. The DRIP is opt-in per holding and may be toggled or revoked at any time."
  ));

  out.push(h2("7.5  Anti-Fragility Vault"));
  out.push(body(
    "The Anti-Fragility Insurance Vault is a collective reserve funded by 0.5% of each investment (cash, deducted at investment time, not at milestone release). The vault is held in a bankruptcy-remote subaccount separate from any enterprise's primary escrow. Disbursement requires a 2/3 majority of a three-Steward committee and provides interest-free loans to enterprises hit by exogenous shocks (natural disaster, currency crisis, supply-chain disruption), repayable over 24 months. Excess distribution funds the Tier A audit subsidy (50% of compilation engagement for first two years) — a deliberate wealth transfer from mature enterprises to first-time founders."
  ));

  // ============== 8. GRADUATION & SOVERIGNTY ==============
  out.push(h1("8.  Graduation & Sovereignty"));
  out.push(body(
    "Graduation is the destination, not a feature. AURIENTA's entire value proposition rests on the credible promise that mature enterprises can leave — taking their governance records, ownership ledger, and the CRE itself with them. Without this promise, AURIENTA would be just another platform extracting perpetual rents. The graduation pathway is therefore the most carefully guarded constitutional process in the system."
  ));

  out.push(h2("8.1  The Four Maturity Stages"));
  out.push(makeTable(
    ["Stage", "Name", "Trigger", "CRE Role", "AURIENTA Board Seat"],
    [
      ["1", "Protected Formation", "Funding closed", "Full enforcement (all policies)", "Active, advisory non-fiduciary"],
      ["2", "Structured Growth", "Auto at 12 months + governance score ≥70", "Reduced enforcement — alerting only", "Active"],
      ["3", "Institutional Independence", "Auto at 24 months + score ≥90 + 4 profitable qtrs + clean audit", "Read-only auditor", "Active (wind-down begins)"],
      ["4", "Sovereign Independence", "75% shareholder vote + 30-day cooling + data export", "Self-hosted by enterprise", "Resigned"],
    ],
    [8, 22, 32, 22, 16],
  ));
  out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  out.push(h2("8.2  Readiness Gates"));
  out.push(body(
    "Stage transitions are gated by objective, CRE-verifiable thresholds. Stage 1 → 2 requires 12 months of operation and a governance score ≥70. Stage 2 → 3 requires 24 months, a governance score ≥90, four consecutive profitable quarters, and a clean annual audit. Stage 3 → 4 requires the active shareholder vote (75% supermajority) — this is the only stage transition that is not automatic. For Tier D, the additional condition applies that the owner must still hold ≥51% (or have a board-approved succession plan) at Stage 3 transition. For Tier F graduation, FRA/EGX disclosure compliance is required."
  ));

  out.push(h2("8.3  The Graduation Vote (75% Supermajority)"));
  out.push(body(
    "The graduation vote is the highest-stakes governance action in AURIENTA. A 75% supermajority of total voting power (not merely of votes cast) is required to pass. A 30-day cooling period follows the vote before the Sovereign Export Package is released. Any shareholder with ≥5% voting power may propose graduation; the 1,000 EGP filing fee is refunded if the vote passes. AURIENTA's board observer seat (Tier F) or advisory seat (Tiers A–D) resigns upon graduation. Any remaining platform equity from the legacy fee structure is bought back; under the current v7.1 fee structure there is no equity fee, so no buyback is required."
  ));

  out.push(h2("8.4  Sovereign Export Package"));
  out.push(body(
    "Upon graduation, the enterprise receives the Sovereign Export Package, containing: (a) the complete Ownership Ledger with audit lineage, (b) the enterprise's Constitutional Charter and all policy versions ever applied, (c) the CRE Docker image configured for self-hosting, (d) all governance records (proposals, votes, decisions), (e) all financial records (milestones, expenses, dividends), and (f) all credentials (W3C VCs) issued to the enterprise's participants. The package is delivered as an encrypted archive with a manifest signed by the law firm. The enterprise may import it into a self-hosted CRE instance, migrate to another compliant governance infrastructure, or continue using the hardcopy Oracle Mirror constitution indefinitely."
  ));

  out.push(h2("8.5  Alumni Hall"));
  out.push(body(
    "The Alumni Hall is a public, immutable registry of graduated enterprises — a proof-of-sovereignty billboard. Each entry records the enterprise name, graduation date, original tier, final tier, capital raised, jobs created, taxes paid, and a sovereign-certified badge. The Alumni Hall is read-only, public (no authentication required), and serves three functions: (1) it demonstrates that AURIENTA's sovereignty promise is real, (2) it provides social proof for prospective investors and founders, and (3) it preserves a permanent historical record independent of any individual enterprise's continued operation."
  ));

  // ============== 9. WORLD-TRADE & CROSS-BORDER ==============
  out.push(h1("9.  World-Trade & Cross-Border"));
  out.push(body(
    "The Diaspora Bridge is AURIENTA's primary growth vector into the Egyptian diaspora — an estimated 10 million Egyptians abroad (UAE, KSA, UK, US, Canada, Kuwait) representing significant investable capital seeking productive deployment in the home country. The Multi-Currency & Cross-Border Capital Routing Engine enables Constitutional Partners from any jurisdiction to invest in any enterprise while protecting the enterprise from currency risk. It locks exchange rates at the moment of commitment, routes funds through compliant banking corridors, automatically handles tax withholding, and screens against international sanctions lists."
  ));

  out.push(h2("9.1  Current Readiness: 18 / 100 → Foundation Laid"));
  out.push(body(
    "Pre-remediation, world-trade readiness was scored at 18 / 100. The REMED-1E wave established the schema foundation: a Currency primitive, an FxRate table (seeded with Central Bank of Egypt rates), BankPartner entities (CIB + NBE seeded), UCP 600 Letter-of-Credit TradeInstrument and TradeDocument models with Nafeza ACI numbers, a ScreeningEvent audit trail, ExportReadinessCheck graduation gates, EscrowWaterfall and ForceMajeureEvent schemas, a disputeResolutionSeat field on Enterprise, and a public ledger-verify endpoint. Eight new API routes (fx, fx/refresh, trade-instruments, trade-documents, screening, export-readiness, ledger/verify) are wired with parseBody + rate limiting + transactions + audit."
  ));

  out.push(h2("9.2  Gap Analysis — What Remains"));
  out.push(body(
    "Despite the foundation, the world-trade vertical remains operationally incomplete. The following gaps must be closed before a real diaspora investor can onboard."
  ));
  out.push(bullet("Real banking-partner integration: CIB and NBE are seeded as BankPartner records, but no actual API connection exists for escrow account opening, SWIFT messaging, or L/C issuance confirmation."));
  out.push(bullet("Real FX rate service: the FxRate table is seeded with CBE rates but has no automated refresh job; rates must be refreshed via /api/fx/refresh manually or by a cron that does not yet exist."));
  out.push(bullet("Real sanctions screening: the ScreeningEvent table exists, but no third-party screening provider (Refinitiv World-Check, Dow Jones Risk, LexisNexis) is integrated. The current implementation logs screening events but cannot actually screen."));
  out.push(bullet("Nafeza ACI pre-registration: the trade-document schema includes a nafezaAciNumber field, but no integration with Egypt's single-window customs system exists. ACI pre-registration is mandatory for imports as of October 2021."));
  out.push(bullet("SCF waterfall orchestration: the EscrowWaterfall model exists, but no route implements the actual waterfall (costs → senior lender → subordinated → equity) for structured trade finance."));
  out.push(bullet("Force-majeure protocol: the ForceMajeureEvent model exists, but no route implements the declaration, notification, and dispute-resolution workflow."));
  out.push(bullet("Export-readiness gates: the ExportReadinessCheck model exists with seeded data, but no CRE policy enforces the gates as a precondition for Tier D/F graduation."));

  out.push(h2("9.3  P0 / P1 Roadmap"));
  out.push(makeTable(
    ["Phase", "Workstream", "Deliverables", "Estimated Duration"],
    [
      ["P0", "Multi-currency primitive", "Currency model live, FX rate refresh cron, /api/fx rate-locked endpoint", "Complete (REMED-1E)"],
      ["P0", "Banking partner integration", "CIB escrow API + NBE escrow API, account-opening workflow, SWIFT message types", "8 weeks"],
      ["P0", "Sanctions screening", "Refinitiv World-Check or Dow Jones Risk integration; ScreeningEvent populated by real provider", "6 weeks"],
      ["P0", "Trade instruments", "UCP 600 L/C model live, issuance workflow, document checker (ISBP 745 rules)", "10 weeks"],
      ["P1", "Nafeza ACI integration", "ACI pre-registration API, cargo manifest sync, customs duty calculation", "8 weeks"],
      ["P1", "Tax treaty application", "Withholding tax engine per treaty (Egypt-UK, Egypt-US, etc.), diaspora tax receipts", "6 weeks"],
      ["P1", "SCF waterfall", "EscrowWaterfall API route, senior/subordinated/equity tranche logic", "8 weeks"],
      ["P1", "Force-majeure & dispute resolution", "ForceMajeureEvent declaration workflow, arbitration seat (Cairo / Dubai / Singapore)", "4 weeks"],
      ["P1", "Export-readiness gates", "CRE policies gating Tier D/F graduation on ExportReadinessCheck", "3 weeks"],
    ],
    [8, 28, 44, 20],
  ));
  out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  out.push(h2("9.4  Constitutional Conflict Reconciliations"));
  out.push(body(
    "Four constitutional conflicts arise when extending AURIENTA to cross-border flows and require explicit reconciliation: (1) the Zero-Custody rule must accommodate correspondent-banking chains where the investor's bank, a correspondent bank, the Egyptian receiving bank, and the law-firm escrow all briefly touch the funds — the reconciliation is that AURIENTA itself still holds nothing, but the law-firm escrow is no longer the only non-investor party; (2) the ±5% fundamental pricing band must accommodate FX volatility — the reconciliation is that the band applies to the EGP-equivalent price at the locked FX rate, not the original currency; (3) the 14-day preemptive rights window must accommodate diaspora time zones and banking lag — the reconciliation is a 21-day window for cross-border transactions; (4) the consulting opt-out trigger (3 profitable quarters) must accommodate currency-translation effects on profitability — the reconciliation is that profitability is measured in EGP at the locked rate, not in the investor's home currency."
  ));

  // ============== 10. RISK & COMPLIANCE ==============
  out.push(h1("10.  Risk & Compliance Posture"));
  out.push(body(
    "AURIENTA's regulatory posture rests on a single foundational instrument: the FRA no-action letter confirming that AURIENTA operates as a technology + governance + matchmaking infrastructure, NOT as a crowdfunding platform, broker, custodian, or fund manager. This classification determines the entire compliance regime: AURIENTA does not hold client funds (the law firms do, under FRA-licensed escrow), does not execute trades (the CRE issues tokens that authorise execution by licensed parties), and does not provide investment advice (the AI computes fundamental prices but does not recommend actions). All UI claims must be reconciled to this classification — a regulator misrepresentation risk identified in the CTO audit and addressed by the truth-in-UX relabelling wave."
  ));

  out.push(h2("10.1  Regulatory Integrations"));
  out.push(makeTable(
    ["Regulator / System", "Integration", "Status", "Purpose"],
    [
      ["FRA (Financial Regulatory Authority)", "No-action letter + read-only dashboard", "Letter obtained; dashboard live (/dashboard/fra)", "Confirms non-crowdfunding classification; FRA can audit ledger, escrow, AI decisions"],
      ["GAFI (General Authority for Investment)", "Real-time commercial register API", "Schema field exists (gafiCommercialRegister); live API pending P1", "Company linking, UBO disclosure, foreign-investment registration, Tier D ≥2y verification"],
      ["NOSI (National Social Insurance)", "API validation + 30-day enforcement", "CRE policy exists (nosi_compliance.rego); live API pending", "All employees registered within 30 days; non-compliance → manager reputation penalty → 60-day escrow freeze"],
      ["ETA (Egyptian Tax Authority)", "Automatic tax filing engine", "Schema + tax-transparency engine designed; live API pending P5", "Corporate tax, VAT (14% on cash fees), withholding (10% dividends), payroll taxes — automated Form 41 generation"],
      ["MOI (Ministry of Interior)", "Police clearance API", "Per-user policeClearance field wired; live API pending P3", "Manager vetting (6-month validity), Steward enhanced background check"],
      ["ESAA (Egyptian Society of Accountants & Auditors)", "Accounting firm registry", "AccountingFirm model live; ESAA validation pending P5", "Independent accountant on each board; audit coordination"],
    ],
    [22, 26, 26, 26],
  ));
  out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  out.push(h2("10.2  AML Law 80/2002 Compliance"));
  out.push(body(
    "AURIENTA complies with Egyptian AML Law 80/2002 (as amended by Law 136/2014) through layered controls: (1) KYC at L2 verification (National ID + liveness + deepfake detection) for all Egyptian participants, with L3 enhanced due diligence (passport + proof of address + sanctions screening) for foreign investors and large transactions; (2) sanctions screening against OFAC, EU, UN, and Egyptian FIU lists at onboarding and ongoing monitoring — name matches trigger a 2-hour hold pending Steward review; (3) suspicious-transaction reporting via the whistleblower channel, with Mixtral credibility scoring (≥70% validated) and anonymised reporting to the board within 7 days; (4) record-keeping on the immutable ledger for the statutory minimum (5 years) and indefinitely for graduated enterprises; (5) cash-transaction thresholds aligned with Law 80/2002 (>100,000 EGP triggers enhanced review)."
  ));

  out.push(h2("10.3  PDPL (Personal Data Protection Law 158/2020) Compliance"));
  out.push(body(
    "All PII is encrypted at rest with AES-GCM (encryption.ts in lib/aurienta/), with keys managed via environment variables (HashiCorp Vault planned for institutional launch). The Constitutional Identity Anchor is a cryptographic hash, not raw PII — AURIENTA cannot reconstruct National ID numbers from the anchor. Selective disclosure is implemented via W3C Verifiable Credentials: a third party verifies a credential (e.g., manager role, police clearance valid) without receiving the underlying identity data. Data subject rights (access, rectification, erasure) are mediated by the CRE — erasure is constrained by the immutable ledger (the right to be forgotten is implemented as cryptographic redaction, not deletion, preserving audit lineage)."
  ));

  out.push(h2("10.4  Six Risk Categories & Mitigations"));
  out.push(makeTable(
    ["Risk Category", "Specific Risk", "Mitigation"],
    [
      ["Capital / Custody", "Platform misappropriation of funds", "Zero custody (constitutional); multi-firm escrow; dual-signature bank transfers; Anti-Fragility Vault"],
      ["Governance / Capture", "Board capture by related parties", "Independent accountant on every board; AURIENTA rep non-fiduciary advisory; 6 veto categories only; 75% supermajority for amendments"],
      ["Market / Speculation", "Pump-and-dump on secondary market", "Fundamental-only pricing (±5% band); no derivatives; liquidity reserve LSTM; real-time fraud detection (Llama 3.2)"],
      ["Manager Misconduct", "Self-dealing, expense fraud, salary inflation", "Police clearance (6-month validity); AI salary calculation; dual-signature expenses (>1%); shareholder removal (Art. 118)"],
      ["AI / Model Failure", "Hallucination, bias, drift, unavailability", "Multi-model redundancy (Llama + Gemma + Mixtral); confidence thresholds (>0.85); human-in-the-loop for critical decisions; quarterly bias audits"],
      ["Compliance / Regulatory", "Sanctions evasion, AML failure, tax non-compliance", "OFAC/EU/UN/EG screening; NOSI enforcement; ETA automatic filing; FRA no-action letter; FRA read-only dashboard"],
    ],
    [22, 32, 46],
  ));
  out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  // ============== 11. IMPLEMENTATION ROADMAP ==============
  out.push(h1("11.  Implementation Roadmap"));
  out.push(body(
    "AURIENTA's delivery roadmap is organised as seven phases (P0–P6) over approximately 14 months from core infrastructure to continuous operation, with institutional framework completion targeted for Q4 2026. Each phase has explicit monthly deliverables, legal milestones, and exit criteria. The current state (post-remediation) places the platform at approximately P3 (Governance & Treasury) with substantial work remaining in P4 (Secondary Market), P5 (Institutional AI), and P6 (Graduation & Continuous)."
  ));

  out.push(h2("11.1  P0–P6 Phased Plan"));
  out.push(makeTable(
    ["Phase", "Months", "Focus", "Key Deliverables", "Legal Milestone", "Status"],
    [
      ["P0", "1–2", "Core infrastructure", "CRE policy engine (Rego), PostgreSQL append-only logging, hash-chain implementation, basic user table", "FRA no-action letter", "DONE (SQLite → pending PG migration)"],
      ["P1", "3–4", "Identity & formation", "HF OCR + liveness models, registration flows for all user types, Gemma 2 feasibility scoring, Tier E/F onboarding, GAFI API MOU", "GAFI API MOU", "DONE (liveness mock; GAFI live pending)"],
      ["P2", "5–6", "Fundraising & escrow", "Law firm API (3 firms), payment webhook handlers, escrow reconciliation, reservation system, Anti-Fragility Vault (0.5%)", "Escrow agreement templates", "DONE (3 firms seeded; live API pending)"],
      ["P3", "7–8", "Governance & treasury", "Voting smart contract, manager removal (Art. 118), Llama 3.2 salary engine, employee registry, police clearance, JSC board automation", "Shareholder agreement review", "PARTIAL (salary engine mock; police clearance wired)"],
      ["P4", "9–10", "Secondary market", "Daily AI price job, FIFO matching engine, liquidity reserve LSTM, priority windows, block trades, MCDR integration (JSC)", "Secondary market legal opinion", "PARTIAL (price engine mock; matching live)"],
      ["P5", "11–14", "Institutional AI", "Neo4j Intelligence Graph, multimodal EVE, W3C VC issuance, systemic-risk Monte Carlo, FRA JSC sandbox, automatic tax filing", "Full production audit", "NOT STARTED"],
      ["P6", "15+", "Graduation & continuous", "GAFI real-time sync, Form 41 automation, FRA read-only dashboard, quarterly bias audits, NOSI validation, consulting opt-out automation, ERP for Tiers C–F", "Annual compliance review", "NOT STARTED"],
    ],
    [6, 8, 14, 30, 18, 24],
  ));
  out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  out.push(h2("11.2  Current Status (Post-Remediation)"));
  out.push(body(
    "P0 is functionally complete with one critical caveat: the platform runs on SQLite, not PostgreSQL, and uses db:push rather than prisma migrate. This is acceptable for development but is the single largest production-readiness gap. P1 is functionally complete with liveness/deepfake running in mock mode pending IBM DFDC integration. P2 is functionally complete with three law firms seeded; the live escrow API integration with each firm remains. P3 is partial: the salary engine is mocked, but the manager removal protocol, expense dual-signature workflow, and employee registry are live. P4 is partial: the matching engine is live, but the daily AI price job, liquidity reserve LSTM, and MCDR integration are not. P5 and P6 have not been started."
  ));

  out.push(h2("11.3  Remaining Work to Q4 2026 Institutional Launch"));
  out.push(body(
    "The path from current state to Q4 2026 institutional launch requires six concurrent workstreams, each with explicit dependencies."
  ));
  out.push(bullet("Workstream A — Database migration: SQLite → PostgreSQL, db:push → prisma migrate, automated backup cron, point-in-time recovery. Dependency: none. Estimated 2 weeks."));
  out.push(bullet("Workstream B — World-trade vertical: complete P0/P1 roadmap items from Section 9.3 (banking partner, sanctions, Nafeza ACI, SCF, force-majeure, export-readiness gates). Dependency: Workstream A. Estimated 12–18 weeks."));
  out.push(bullet("Workstream C — Role architecture completion: build /dashboard/board-member and /dashboard/university pages; add RBAC to 5 admin pages; fix credentials/page.tsx line-47 bug. Dependency: none. Estimated 2 weeks."));
  out.push(bullet("Workstream D — Institutional hardening: TOTP MFA enrollment UI (infra exists, route missing), HSM procurement for Ed25519 production keys, automated quarterly bias audits, real liveness/deepfake (IBM DFDC), FRA JSC sandbox participation. Dependency: none for MFA; 8 weeks for HSM procurement. Estimated 8–12 weeks."));
  out.push(bullet("Workstream E — P5 institutional AI: Neo4j Intelligence Graph, multimodal EVE, W3C VC issuance pipeline, systemic-risk Monte Carlo, automatic tax filing engine. Dependency: Workstream A. Estimated 14–16 weeks."));
  out.push(bullet("Workstream F — Graduation & continuous (P6): sovereign export package implementation, alumni hall UI refresh, GAFI real-time sync, NOSI validation, ERP integration for Tiers C–F, consulting opt-out vote automation. Dependency: Workstream E for graduation prerequisites. Estimated 8–10 weeks."));

  // ============== 12. STRATEGIC RECOMMENDATIONS ==============
  out.push(h1("12.  Strategic Recommendations"));
  out.push(body(
    "The following ten recommendations are prioritised by impact-on-institutional-launch-readiness and effort-to-deliver. The impact/effort ratings are calibrated against the Q4 2026 target: a \"High Impact / Low Effort\" item should be executed immediately; a \"High Impact / High Effort\" item should begin immediately but expect a multi-quarter delivery."
  ));

  out.push(makeTable(
    ["#", "Recommendation", "Impact", "Effort", "Rationale"],
    [
      ["1", "Migrate SQLite → PostgreSQL + prisma migrate", "Critical", "Low (2 wk)", "Largest production-readiness gap. Concurrent transactional workloads (hash-chain ledger, escrow, vote tallies) require serialisable isolation SQLite cannot provide."],
      ["2", "Complete world-trade vertical (Section 9.3 P0 items)", "Critical", "High (12–18 wk)", "Diaspora Bridge is the primary growth vector. Without it, AURIENTA cannot onboard a single real foreign investor."],
      ["3", "Build /dashboard/board-member and /dashboard/university_rep pages with RBAC", "High", "Low (2 wk)", "2 of 10 roles have no console. Add RBAC to 5 admin pages. Credibility gap for institutional due diligence."],
      ["4", "Procure HSM for production Ed25519 keys; replace tweetnacl for signing authority", "High", "Medium (8 wk procurement)", "Currently using software keys for the constitutional signing authority. HSM is required for institutional trust and audit."],
      ["5", "Wire IBM DFDC real liveness + deepfake detection (replace mock)", "High", "Medium (4 wk)", "Liveness currently runs in mock mode. Real DFDC (real score >0.85, facenet cosine >0.6) is required for KYC compliance."],
      ["6", "Implement real GAFI commercial register API integration", "High", "Medium (6 wk)", "Tier D verification, company linking, and UBO disclosure all depend on GAFI. Currently a derived/mock field."],
      ["7", "Build TOTP MFA enrollment + verify routes", "Medium", "Low (1 wk)", "Infra exists (totpSecretEnc field, otplib installed) but no enroll/verify route. Required for Steward and manager roles."],
      ["8", "Implement real-time sanctions screening via third-party (Refinitiv or Dow Jones)", "High", "Medium (6 wk)", "ScreeningEvent logs exist but no real screening. AML Law 80/2002 compliance requires real-time screening at onboarding + ongoing."],
      ["9", "Build automated quarterly bias-audit pipeline (P6 deliverable, pull forward)", "Medium", "Medium (4 wk)", "AI hallucination/bias/drift currently hard-coded constants. Real aggregates from AuditLog + AiArtifact required for FRA trust."],
      ["10", "Execute FRA JSC sandbox application for Tier F graduation pathway", "High", "Low (4 wk legal)", "Tier F (JSC) graduation requires FRA/EGX disclosure. Sandbox participation de-risks the institutional framework Q4 2026 launch."],
    ],
    [4, 36, 10, 14, 36],
  ));
  out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  out.push(h2("12.1  Sequencing Logic"));
  out.push(body(
    "Recommendations 1, 3, 7, and 10 should begin immediately — they have low effort and unblock other workstreams. Recommendation 2 (world-trade vertical) is the longest pole and should begin immediately, sequenced behind Recommendation 1. Recommendations 4, 5, 6, and 8 are procurement- or integration-heavy and should be initiated in parallel as soon as their dependencies clear. Recommendation 9 (bias-audit pipeline) can be pulled forward to P3–P4 since the schema (AuditLog, AiArtifact) already exists. If all ten recommendations are sequenced correctly, the platform reaches institutional-launch readiness within the Q4 2026 window with approximately 6–8 weeks of schedule slack."
  ));

  // ============== 13. SCORING ==============
  out.push(h1("13.  Scoring — Ten-Dimension Assessment"));
  out.push(body(
    "The current platform score is 78 / 100 (post-remediation), up from 58 / 100 (pre-remediation). The scoring is decomposed across ten dimensions, weighted to reflect institutional-launch priorities. The vision and architecture dimensions score highest (genuinely state-of-the-art concept); the API and frontend dimensions show the largest gains from the remediation wave; the AI and compliance dimensions remain the primary drags on the overall score, awaiting third-party integrations (IBM DFDC, Refinitiv, GAFI live API)."
  ));

  out.push(makeTable(
    ["#", "Dimension", "Score", "Weight", "Weighted", "Justification"],
    [
      ["1", "Vision & Concept", "92", "10%", "9.2", "Genuinely novel — world's first constitutional launchpad. Founding doctrine, graduation pathway, and Oracle Mirror are uniquely differentiated."],
      ["2", "Architecture (CRE, Escrow, Identity, Tiers, Graduation, Mirror)", "85", "12%", "10.2", "Six-pillar architecture is sound and internally consistent. 3-node CRE consensus mesh, fail-secure 500ms, transactional ledger append all post-remediation."],
      ["3", "CRE Policy Engine (Rego)", "80", "10%", "8.0", "12 policies wired (post-REMED). verifyLedgerChain() live. Remaining: full policy library (currently ~12 of ~30 spec'd policies implemented)."],
      ["4", "Data Layer (Prisma schema, migrations, integrity)", "70", "10%", "7.0", "33 models, well-designed. SQLite (not PostgreSQL); db:push (not migrate); no automated backups. Schema integrity strong, operational readiness weak."],
      ["5", "Security (auth, signing, encryption, RBAC)", "82", "10%", "8.2", "Session table with revocation/rotation, real Ed25519 (tweetnacl), AES-GCM PII, CSRF middleware, rate limiting. Drags: software keys (no HSM), no TOTP MFA enroll route, 5 admin pages lack RBAC."],
      ["6", "API Surface (routes, validation, audit)", "85", "8%", "6.8", "All money/AI/governance routes hardened with parseBody + rate limiting + transactions + audit. Largest gain from remediation (was 55)."],
      ["7", "Frontend (UX, a11y, role-based nav, truth-in-UX)", "78", "8%", "6.2", "Real Overview page, /dashboard/drip, EnterpriseSwitcher context, role-based nav filtering (27 of 51 routes for capital_partner). Drags: 2 missing role pages, mock subsystems in 3 pages."],
      ["8", "AI Layer (feasibility, salary, risk, EVE)", "65", "10%", "6.5", "15 AI routes use userContext delimiters (prompt-injection defence). Drags: confidence values are decorative (0.78–0.9 hardcoded), liveness in mock mode, no real bias auditing, no EVE multimodal verification."],
      ["9", "Compliance (FRA, GAFI, NOSI, ETA, AML, PDPL)", "68", "12%", "8.2", "FRA no-action letter obtained; AML/PDPL controls designed; schema fields wired. Drags: GAFI/NOSI/ETA live APIs pending; sanctions screening provider not integrated; tax filing engine not built."],
      ["10", "Reliability (observability, DR, Oracle Mirror)", "75", "10%", "7.5", "Oracle Mirror protocol designed (7-day trigger, hardcopy constitution, paper ballots). Drags: no automated backup cron; no point-in-time recovery; no DR drill cadence; SEV incident log is mock."],
    ],
    [4, 30, 8, 8, 8, 42],
  ));
  out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  out.push(h2("13.1  Weighted Total"));
  out.push(body(
    "Weighted total: 78.0 / 100. Rounded to 78 / 100. This represents a platform that is approximately 78% of the way to institutional-launch readiness, with the remaining 22% concentrated in third-party integrations (GAFI, NOSI, ETA, Refinitiv, IBM DFDC, banking partners), infrastructure migration (PostgreSQL + HSM), and completion of the role-architecture console surface."
  ));

  out.push(h2("13.2  Trajectory"));
  out.push(body(
    "The pre-remediation trajectory was 58 / 100 with a downward bias (three existential risks identified). The post-remediation trajectory is 78 / 100 with an upward bias: all P0 blockers are addressed, the world-trade foundation is laid, and the remaining work is execution against a clear specification rather than invention. If the ten strategic recommendations in Section 12 are sequenced correctly, the platform reaches 88–92 / 100 (institutional-launch ready) within the Q4 2026 window."
  ));

  out.push(calloutBox("Final Assessment", [
    "AURIENTA is a credible, differentiated, and increasingly production-ready constitutional enterprise infrastructure. The constitutional design is sound; the engineering is now increasingly so. The remaining work is execution against a clear specification, not invention. With disciplined sequencing of the ten strategic recommendations, the platform will be institutional-launch ready within the Q4 2026 target window.",
    "",
    "Constitutional Hash: 0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A",
    "Founding Principle: Your capital, your work, your company — no speculation required.",
  ]));

  return out;
}

// ─────────────────────────────────────────────────────────────────
// DOCUMENT ASSEMBLY
// ─────────────────────────────────────────────────────────────────
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };
const coverMargin = { top: 0, bottom: 0, left: 0, right: 0 };

const doc = new Document({
  creator: "AURIENTA CTO Office",
  title: "AURIENTA Blueprint Analysis",
  description: "CTO-level strategic analysis of the AURIENTA constitutional enterprise infrastructure platform",
  styles: {
    default: {
      document: {
        run: {
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          size: 22, color: c(P.body),
        },
        paragraph: { spacing: { line: 312 } },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal",
        quickFormat: true,
        run: { bold: true, size: 32, color: c(P.primary),
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } },
        paragraph: { spacing: { before: 480, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal",
        quickFormat: true,
        run: { bold: true, size: 28, color: c(P.primary),
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } },
        paragraph: { spacing: { before: 320, after: 140 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal",
        quickFormat: true,
        run: { bold: true, size: 24, color: c(P.goldDark),
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [
    // Section 1: Cover — no page number
    {
      properties: {
        page: { size: pgSize, margin: coverMargin },
      },
      children: buildCover(),
    },
    // Section 2: Front matter (TOC) — Roman numerals
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: pgSize, margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      footers: { default: pageNumFooter() },
      children: buildTocSection(),
    },
    // Section 3: Body — Arabic, reset to 1
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: pgSize, margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      footers: { default: pageNumFooter() },
      children: buildBody(),
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const outPath = "/home/z/my-project/download/AURIENTA_Blueprint_Analysis.docx";
  fs.writeFileSync(outPath, buf);
  console.log("✅ Written:", outPath);
  console.log("   Size:", buf.length, "bytes");
}).catch((err) => {
  console.error("❌ Generation failed:", err);
  process.exit(1);
});
