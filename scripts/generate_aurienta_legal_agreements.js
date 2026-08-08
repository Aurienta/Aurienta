/**
 * AURIENTA Legal Agreements Generator
 * Generates three docx files under /home/z/my-project/download/:
 *   1. AURIENTA_Law_Firm_Escrow_Waiver.docx
 *   2. AURIENTA_Milestone_Release_Authorization.docx
 *   3. AURIENTA_Constitutional_Amendment_IX.docx
 *
 * All three implement the Direct Law-Firm Transfer Model under
 * Amendment IX to the AURIENTA Constitutional Charter.
 *
 * Pattern: docx-js, AURIENTA palette (deep navy + gold #D4AF37),
 * numbered articles, recitals, signature blocks, constitutional hash.
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
const path = require("path");

// ─────────────────────────────────────────────────────────────────
// PALETTE — AURIENTA "Deep Sea Blue-Gold" with brand gold #D4AF37
// ─────────────────────────────────────────────────────────────────
const P = {
  primary:   "#0F2027",   // Deep navy (headings, cover bg)
  body:      "#000000",   // Pure black body text (Profile A formal)
  secondary: "#4A6575",   // Mid-tone for captions / footers
  accent:    "#D4AF37",   // AURIENTA gold
  surface:   "#F5F7FA",   // Very light surface for alt rows
  goldDark:  "#B8860B",   // Darker gold accent
  inkLight:  "#1A2A3A",   // Lighter ink for subheads
  legalRed:  "#7B1E1E",   // Restrained red for non-amendable clauses
};
const c = (hex) => hex.replace("#", "");

const CONSTITUTIONAL_HASH = "0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A";
const AMENDMENT_IX_HASH   = "0xA9C7E1D4F0B3A825E6F1C9D2B7E4A0C3F6D8B1E5A2";

// ─────────────────────────────────────────────────────────────────
// Border helpers
// ─────────────────────────────────────────────────────────────────
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = {
  top: NB, bottom: NB, left: NB, right: NB,
  insideHorizontal: NB, insideVertical: NB,
};
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
// Text helpers
// ─────────────────────────────────────────────────────────────────
function R(text, props = {}) {
  return new TextRun({
    text,
    size: props.size ?? 22,
    color: c(props.color ?? P.body),
    bold: !!props.bold,
    italics: !!props.italics,
    underline: props.underline ? {} : undefined,
    font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    indent: opts.noIndent ? undefined : { firstLine: 360 },
    spacing: { line: 312, after: opts.after ?? 120 },
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
    spacing: { line: 312, after: opts.after ?? 120 },
    children: runs,
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
      text, bold: true, size: 26, color: c(P.primary),
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

function articleHeading(num, title) {
  // Centered gold-underlined article heading e.g. "ARTICLE I — PARTIES AND SCOPE"
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 420, after: 60 },
      children: [new TextRun({
        text: `ARTICLE ${num}`,
        bold: true, size: 28, color: c(P.primary),
        characterSpacing: 30,
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: c(P.accent), space: 6 } },
      children: [new TextRun({
        text: title,
        bold: true, size: 22, color: c(P.goldDark),
        characterSpacing: 20,
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    }),
  ];
}

function bullet(text, level = 0) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 300, after: 80 },
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
    spacing: { line: 300, after: 80 },
    indent: { left: 720 + level * 360, hanging: 280 },
    children: [
      new TextRun({ text: "•  ", bold: true, color: c(P.accent), size: 22 }),
      ...runs,
    ],
  });
}

function numberedClause(num, text, opts = {}) {
  // "1.1  Text..." — a numbered article clause
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: opts.after ?? 140 },
    indent: { left: 720, hanging: 540 },
    children: [
      new TextRun({ text: `${num}\t`, bold: true, size: 22, color: c(P.primary),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text, size: 22, color: c(P.body),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  });
}

function numberedClauseRuns(num, runs, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: opts.after ?? 140 },
    indent: { left: 720, hanging: 540 },
    children: [
      new TextRun({ text: `${num}\t`, bold: true, size: 22, color: c(P.primary),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      ...runs,
    ],
  });
}

function recitalClause(letter, text) {
  // "WHEREAS, ..."
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 120 },
    indent: { left: 720, hanging: 540 },
    children: [
      new TextRun({ text: `${letter}.\t`, bold: true, size: 22, color: c(P.goldDark),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text, size: 22, color: c(P.body),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  });
}

function calloutBox(title, lines) {
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
      size: 18, align: opts.align || AlignmentType.LEFT,
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

// Signature block — three signature columns
function signatureBlock(parties) {
  // parties: [{ label: "AURIENTA", name: "Layla Mostafa", title: "AURIENTA Representative" }, ...]
  const widths = parties.map(() => Math.floor(100 / parties.length));
  const cells = parties.map((p, i) => {
    return new TableCell({
      width: { size: widths[i], type: WidthType.PERCENTAGE },
      margins: { top: 320, bottom: 200, left: 200, right: 200 },
      borders: { top: NB, bottom: NB, left: NB, right: NB },
      children: [
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({
            text: p.label, bold: true, size: 22, color: c(P.primary),
            font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          })],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({
            text: "By: __________________________", size: 20, color: c(P.body),
            font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          })],
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({
            text: `Name: ${p.name}`, size: 20, color: c(P.body),
            font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          })],
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({
            text: `Title: ${p.title}`, size: 20, color: c(P.body),
            font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          })],
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({
            text: `Date: ____________________`, size: 20, color: c(P.body),
            font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          })],
        }),
        ...(p.license ? [new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({
            text: `License: ${p.license}`, size: 18, italics: true, color: c(P.secondary),
            font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          })],
        })] : []),
        ...(p.witness ? [new Paragraph({
          spacing: { before: 200, after: 40 },
          children: [new TextRun({
            text: "Witness:", bold: true, size: 18, color: c(P.secondary),
            font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          })],
        }), new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({
            text: "__________________________", size: 20, color: c(P.body),
            font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          })],
        })] : []),
      ],
    });
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({ cantSplit: false, children: cells })],
  });
}

function spacer(h = 200) {
  return new Paragraph({ spacing: { before: h }, children: [] });
}

function sectionDivider() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: c(P.accent), space: 6 } },
    children: [new TextRun({ text: "§ § §", size: 18, color: c(P.accent),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}

function hashBanner(hash, label) {
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
        shading: { type: ShadingType.CLEAR, fill: c(P.primary) },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({
              text: label, bold: true, size: 20, color: c(P.accent),
              characterSpacing: 30,
              font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
            })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
            children: [new TextRun({
              text: hash, size: 22, color: "#FFFFFF",
              font: { ascii: "Consolas", eastAsia: "Microsoft YaHei" },
            })],
          }),
        ],
      })],
    })],
  });
}

// ─────────────────────────────────────────────────────────────────
// COVER PAGE — reusable, parametrized
// ─────────────────────────────────────────────────────────────────
function buildCover({ eyebrow, title, subtitle, meta, docCode, docVersion }) {
  const padL = 1200, padR = 800;
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: c(P.accent), space: 12 };
  const children = [];

  // 1. Top whitespace
  children.push(new Paragraph({ spacing: { before: 1400 } }));

  // 2. English label with accent bottom border
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    spacing: { after: 500 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: c(P.accent), space: 8 } },
    children: [new TextRun({
      text: eyebrow,
      size: 18, color: c(P.accent),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      characterSpacing: 40,
    })],
  }));

  // 3. Main title (AURIENTA)
  children.push(new Paragraph({
    indent: { left: padL },
    spacing: { after: 100, line: 800, lineRule: "atLeast" },
    children: [new TextRun({
      text: "AURIENTA", size: 80, bold: true,
      color: "#FFFFFF",
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));
  children.push(new Paragraph({
    indent: { left: padL },
    spacing: { after: 240, line: 520, lineRule: "atLeast" },
    children: [new TextRun({
      text: title,
      size: 32, color: "#E8D9A8",
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));
  if (subtitle) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: 800 },
      children: [new TextRun({
        text: subtitle, size: 22, color: c(P.accent), italics: true,
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    }));
  }

  // 4. Meta info lines with left accent border
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
        text: line, size: 22, color: c(P.accent),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    }));
  }

  // 5. Bottom whitespace
  children.push(new Paragraph({ spacing: { before: 1200 } }));

  // 6. Footer with top accent separator
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: c(P.accent), space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: "AURIENTA Constitutional Office  ·  Confidential — Legal Instrument",
        size: 16, color: "#9AAEB8",
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: `${docCode}  ·  ${docVersion}`,
        size: 16, color: "#9AAEB8",
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  }));

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: c(P.primary) },
        borders: noBorders,
        children,
      })],
    })],
  })];
}

function pageNumFooter(label) {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: c(P.accent), space: 4 } },
        children: [
          new TextRun({ text: `${label}   ·   `, size: 16, color: c(P.secondary),
            font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: c(P.secondary),
            font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
          new TextRun({ text: " / ", size: 16, color: c(P.secondary),
            font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: c(P.secondary),
            font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
        ],
      }),
    ],
  });
}

function pageHeader(title) {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: c(P.accent), space: 4 } },
        children: [new TextRun({
          text: `AURIENTA  ·  ${title}`, size: 16, italics: true, color: c(P.secondary),
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
        })],
      }),
    ],
  });
}

// ═════════════════════════════════════════════════════════════════
// DOCUMENT 1 — LAW FIRM ESCROW WAIVER & CLIENT ACCOUNT AUTHORIZATION
// ═════════════════════════════════════════════════════════════════
function buildLawFirmWaiverBody() {
  const out = [];

  // ─── Title block ───
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
    children: [new TextRun({
      text: "LAW FIRM ESCROW WAIVER",
      bold: true, size: 36, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({
      text: "AND",
      bold: true, size: 22, color: c(P.goldDark),
      characterSpacing: 80,
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({
      text: "CLIENT ACCOUNT AUTHORIZATION",
      bold: true, size: 30, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: c(P.accent), space: 6 } },
    children: [new TextRun({
      text: "Direct Law-Firm Transfer Model  ·  Pursuant to Amendment IX to the Constitutional Charter",
      size: 20, italics: true, color: c(P.secondary),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));

  // ─── Preamble / Parties ───
  out.push(body(
    "This Law Firm Escrow Waiver and Client Account Authorization (this \"Agreement\") is entered into as of the Effective Date defined in Article X below, by and among:"
  ));
  out.push(bulletRuns([
    R("AURIENTA ", { bold: true }),
    R("(the \"Platform\" or \"AURIENTA\"), a constitutional enterprise infrastructure provider operating under the AURIENTA Constitutional Charter (the \"Charter\"), with its constitutional hash ", { }),
    R(CONSTITUTIONAL_HASH, { bold: true, color: P.primary }),
    R(", acting by and through its Constitutional Office;", { }),
  ]));
  out.push(bulletRuns([
    R("[LAW FIRM NAME] ", { bold: true }),
    R("(the \"Law Firm\"), an Egyptian law firm duly registered and licensed under the Egyptian Lawyers' Code (Law No. 17 of 1983) (the \"Lawyers' Code\"), holding a valid license issued by the Egyptian Bar Association and registered with the Financial Regulatory Authority (the \"FRA\") under registration number [____], with its principal place of business at [____]; and", { }),
  ]));
  out.push(bulletRuns([
    R("[ENTERPRISE NAME] ", { bold: true }),
    R("(the \"Enterprise\"), an Egyptian company formed under Companies Law No. 159 of 1981 (the \"Companies Law\"), registered with the General Authority for Investment and Free Zones (GAFI) under commercial registration number [____], and onboarded onto the AURIENTA platform at Tier [A–F].", { }),
  ]));
  out.push(body(
    "AURIENTA, the Law Firm, and the Enterprise are referred to herein individually as a \"Party\" and collectively as the \"Parties.\""
  ));

  // ─── Recitals ───
  out.push(sectionDivider());
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 200, after: 160 },
    children: [new TextRun({ text: "RECITALS", bold: true, size: 26, color: c(P.primary),
      characterSpacing: 60, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  }));
  out.push(recitalClause("A",
    "WHEREAS, AURIENTA has adopted Amendment IX to the Constitutional Charter, which restructures the platform's capital-handling architecture from a Constitutional Escrow Vault model to a Direct Law-Firm Transfer Model, such that AURIENTA never holds, touches, or controls any capital partner funds at any point in the fund flow;"
  ));
  out.push(recitalClause("B",
    "WHEREAS, Article 47 of the Egyptian Lawyers' Code (Law No. 17 of 1983) expressly permits licensed lawyers to hold client funds in segregated client accounts maintained at Egyptian-licensed banks, subject to the professional and fiduciary duties set forth in the Lawyers' Code and the by-laws of the Egyptian Bar Association;"
  ));
  out.push(recitalClause("C",
    "WHEREAS, the FRA has issued a No-Action Letter classifying AURIENTA as technology, governance, and matchmaking infrastructure — and not as a crowdfunding platform, broker, custodian, or financial intermediary — and confirming that the direct transfer of capital partner funds to a licensed law firm's client account does not constitute an activity requiring FRA licensing on the part of AURIENTA;"
  ));
  out.push(recitalClause("D",
    "WHEREAS, the Law Firm is duly licensed under the Lawyers' Code, holds the requisite professional indemnity insurance, and is willing to accept direct transfer of capital partner funds into a segregated client account designated for the Enterprise, and to release such funds solely on the dual-authorization protocol set forth herein;"
  ));
  out.push(recitalClause("E",
    "WHEREAS, the Parties desire to formally waive the requirement for any separate escrow arrangement, and to memorialize the rights, duties, and obligations of each Party under the Direct Law-Firm Transfer Model;"
  ));
  out.push(body(
    "NOW, THEREFORE, in consideration of the mutual covenants and agreements set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:",
    { after: 200 }
  ));

  // ─── ARTICLE I — DEFINITIONS ───
  out.push(...articleHeading("I", "DEFINITIONS"));
  out.push(numberedClause("1.1",
    "\"Client Account\" means the segregated bank account opened and maintained by the Law Firm at an Egyptian-licensed bank, designated exclusively for the deposit, holding, and release of capital partner funds contributed to the Enterprise, and which is at all times held under Article 47 of the Lawyers' Code as client funds — not as Law Firm operating funds, not as Law Firm receivables, and not as Law Firm estate property."
  ));
  out.push(numberedClause("1.2",
    "\"Capital Partner Funds\" means the aggregate amount of capital contributed by Capital Partners to the Enterprise under the Tier-appropriate minimum-investment rules of the Charter, together with any accruals thereon, exclusive of any AURIENTA platform service fee or consulting fee which is separately calculated and disclosed."
  ));
  out.push(numberedClause("1.3",
    "\"Dual-Authorization Protocol\" means the release condition specified in Article IV requiring both (a) Board Approval of the Enterprise and (b) Accounting Firm Evidence Verification, each in the form and substance required by the Charter and this Agreement."
  ));
  out.push(numberedClause("1.4",
    "\"Board Approval\" means a duly adopted resolution of the Enterprise's board of directors, recorded in the constitutional ledger, authorizing a specific milestone release, expense payment, or vendor disbursement, in compliance with the Charter's quorum and voting thresholds."
  ));
  out.push(numberedClause("1.5",
    "\"Accounting Firm Evidence Verification\" means a written authorization issued by the Certified Accounting Firm appointed to the Enterprise under the Charter, certifying that the milestone or disbursement evidence (invoices, geotagged photographs, payroll registers, delivery receipts, etc.) has been independently verified in accordance with Egyptian Society of Accountants and Auditors (ESAA) standards."
  ));
  out.push(numberedClause("1.6",
    "\"Bankruptcy-Remote\" means the legal status of Client Account funds under Article 47 of the Lawyers' Code, by which such funds are (a) not part of the Law Firm's bankruptcy estate, (b) not subject to set-off against Law Firm liabilities, (c) not subject to attachment by Law Firm creditors, and (d) traceable and recoverable by the Enterprise and its Capital Partners in the event of Law Firm insolvency, dissolution, or regulatory intervention."
  ));
  out.push(numberedClause("1.7",
    "\"Effective Date\" means the date on which this Agreement has been executed by all three Parties and the Law Firm's FRA license verification has been confirmed in accordance with Article VIII."
  ));

  // ─── ARTICLE II — ACCEPTANCE OF DIRECT TRANSFER ───
  out.push(...articleHeading("II", "ACCEPTANCE OF DIRECT TRANSFER; ESCROW WAIVER"));
  out.push(numberedClause("2.1",
    "Direct Transfer. Each Capital Partner's contribution shall be transferred by the Capital Partner directly to the Law Firm's Client Account, by bank wire or such other Egyptian-licensed banking channel as the Law Firm may designate in writing. AURIENTA shall at no time be a remitter, payee, intermediary, custodian, signatory, or beneficial owner of any Capital Partner Funds. AURIENTA's role is strictly limited to (a) matching Capital Partners to Enterprises, (b) providing constitutional governance and runtime enforcement services, and (c) publishing the immutable ledger record of each transfer."
  ));
  out.push(numberedClause("2.2",
    "Segregated Client Account. The Law Firm shall maintain the Client Account at an Egyptian-licensed bank, titled in the form \"[Law Firm Name] — Client Account — [Enterprise Name] — AURIENTA Constitutional Tier [A–F],\" and shall ensure that Client Account funds are at all times segregated from the Law Firm's operating, trust, escrow, payroll, and tax accounts. The Law Firm shall not commingle Client Account funds with any other funds under any circumstances."
  ));
  out.push(numberedClause("2.3",
    "Holding Under Article 47. The Law Firm acknowledges and agrees that Capital Partner Funds held in the Client Account are held under and subject to Article 47 of the Egyptian Lawyers' Code (Law No. 17 of 1983), and the Law Firm shall observe all professional, fiduciary, and record-keeping duties imposed by the Lawyers' Code and the Egyptian Bar Association by-laws with respect to client funds, including without limitation the duty of segregation, the duty of fidelity, the duty of accounting, and the duty of timely delivery."
  ));
  out.push(numberedClause("2.4",
    "Waiver of Separate Escrow. The Parties hereby waive, and release each other from any obligation to establish or maintain, any separate escrow arrangement, escrow agent, escrow account, escrow agreement, or escrow fee structure of any kind. The Parties further agree that the Client Account held under Article 47 of the Lawyers' Code is the sole and exclusive holding mechanism for Capital Partner Funds under the Charter as amended by Amendment IX."
  ));
  out.push(numberedClause("2.5",
    "No Escrow Label. The Parties agree that the Client Account shall not be labeled, marketed, or referred to as an \"escrow account,\" \"trust account,\" or \"custody account\" in any communication, ledger entry, bank document, regulatory filing, or marketing material. The Client Account is a lawyer's client account under Article 47 of the Lawyers' Code — and nothing more."
  ));

  // ─── ARTICLE III — BANKRUPTCY-REMOTE STATUS ───
  out.push(...articleHeading("III", "BANKRUPTCY-REMOTE STATUS; SEGREGATION"));
  out.push(numberedClause("3.1",
    "Non-Estate Status. The Parties expressly acknowledge and agree that Capital Partner Funds deposited in the Client Account are, by operation of Article 47 of the Lawyers' Code, the property of the Capital Partners and the Enterprise — and are not, under any circumstance, the property of the Law Firm. In the event of the Law Firm's bankruptcy, insolvency, receivership, dissolution, regulatory seizure, or any analogous proceeding, Client Account funds shall be excluded from the Law Firm's bankruptcy estate and shall not be available to satisfy any claim of Law Firm creditors."
  ));
  out.push(numberedClause("3.2",
    "No Set-Off. The Law Firm shall not, and shall not permit its bank to, exercise any right of set-off, retention, lien, or compensation against the Client Account or any funds therein, whether in respect of Law Firm fees, Law Firm tax liabilities, Law Firm partner obligations, or any other Law Firm obligation of any nature."
  ));
  out.push(numberedClause("3.3",
    "Traceability. The Law Firm shall maintain complete, contemporaneous, and auditable records sufficient to identify, at any moment, the precise amount of Capital Partner Funds attributable to each Capital Partner and to the Enterprise in the aggregate. Such records shall be (a) reconciled against the bank statement of the Client Account no less frequently than weekly, (b) published to the AURIENTA immutable ledger in real time as deposit and release events occur, and (c) made available to the Enterprise, the Accounting Firm, the FRA, and any court of competent jurisdiction upon request."
  ));
  out.push(numberedClause("3.4",
    "Successor Law Firm. In the event of Law Firm termination, resignation, disqualification, or inability to act, the Capital Partner Funds in the Client Account shall be transferred, within five (5) business days, to the Client Account of a successor law firm appointed in accordance with the Charter's law-firm-replacement procedure, and the Law Firm shall provide all reasonable cooperation to effect such transfer. No Capital Partner Funds shall remain in the Client Account of a terminated Law Firm for longer than five (5) business days following termination."
  ));

  // ─── ARTICLE IV — DUAL-AUTHORIZATION RELEASE PROTOCOL ───
  out.push(...articleHeading("IV", "DUAL-AUTHORIZATION RELEASE PROTOCOL"));
  out.push(numberedClause("4.1",
    "Dual Authorization Required. The Law Firm shall release Capital Partner Funds from the Client Account only upon receipt of both (a) Board Approval and (b) Accounting Firm Evidence Verification, in each case in the form, substance, and ledger-recorded manner required by the Charter and this Agreement. The Law Firm shall not release any funds upon a single authorization alone — and shall not release any funds upon the instruction of AURIENTA alone, the Enterprise's manager alone, or any single Capital Partner alone."
  ));
  out.push(numberedClause("4.2",
    "Form of Board Approval. Board Approval shall be delivered to the Law Firm in the form of a constitutional ledger entry signed by the requisite number of Enterprise directors under the Charter's quorum and voting rules, identifying (a) the amount to be released, (b) the payee bank account (vendor or operating account), (c) the milestone or budget line item to which the release corresponds, and (d) the CRE-issued decision token validating the constitutional compliance of the proposed release."
  ));
  out.push(numberedClause("4.3",
    "Form of Accounting Firm Evidence Verification. Accounting Firm Evidence Verification shall be delivered to the Law Firm in the form of a signed certification issued by the Certified Accounting Firm appointed to the Enterprise, certifying that the milestone or disbursement evidence has been independently verified in accordance with ESAA standards and identifying (a) the evidence documents reviewed, (b) the verification methodology applied, (c) the verification date, and (d) the constitutional ledger reference of the underlying Board Approval."
  ));
  out.push(numberedClause("4.4",
    "Order of Authorizations. The Law Firm shall not act upon Board Approval unless and until the corresponding Accounting Firm Evidence Verification has been received, and shall not act upon Accounting Firm Evidence Verification unless and until the corresponding Board Approval has been received. The two authorizations are conjunctive and cumulative, not alternative."
  ));
  out.push(numberedClause("4.5",
    "Release Execution. Upon receipt of both authorizations in proper form, the Law Firm shall execute the release by bank transfer from the Client Account to the payee bank account identified in the Board Approval, within two (2) business days. The Law Firm shall publish the release event to the constitutional ledger contemporaneously with execution."
  ));
  out.push(numberedClause("4.6",
    "Refusal Rights. The Law Firm shall refuse to execute any release that (a) lacks either required authorization, (b) is facially inconsistent with the Charter or this Agreement, (c) would cause the Client Account to be overdrawn, or (d) is the subject of a documented regulatory hold, court order, or lawful freeze. Any such refusal shall be recorded in the constitutional ledger with reasons."
  ));

  // ─── ARTICLE V — INSURANCE ───
  out.push(...articleHeading("V", "PROFESSIONAL INDEMNITY INSURANCE"));
  out.push(numberedClause("5.1",
    "Minimum Coverage. The Law Firm shall, at its sole cost and at all times during the term of this Agreement, maintain professional indemnity insurance with a reputable, Egyptian-licensed insurer, in an aggregate amount of not less than ONE HUNDRED MILLION EGYPTIAN POUNDS (EGP 100,000,000) per claim and in the aggregate per policy year."
  ));
  out.push(numberedClause("5.2",
    "Coverage Scope. Such insurance shall cover (a) loss of client funds, (b) misapplication or misdirection of client funds, (c) failure to segregate client funds, (d) release of client funds in violation of the Dual-Authorization Protocol, (e) cyber, fraud, and social-engineering events affecting the Client Account, and (f) any other act, error, or omission of the Law Firm, its partners, employees, or agents in connection with the holding or release of Capital Partner Funds."
  ));
  out.push(numberedClause("5.3",
    "Evidence of Insurance. The Law Firm shall deliver to AURIENTA and the Enterprise, upon execution of this Agreement and annually thereafter within thirty (30) days of each policy renewal, a certificate of insurance evidencing the coverage required by this Article V, naming AURIENTA and the Enterprise as additional insureds, and providing for not less than thirty (30) days' prior written notice of cancellation or material adverse modification."
  ));
  out.push(numberedClause("5.4",
    "No Substitution. The insurance required under this Article V is in addition to, and not in substitution for, the Law Firm's liability under Article 47 of the Lawyers' Code, the Lawyers' Code by-laws, this Agreement, or general Egyptian law. The Law Firm's indemnity obligations under this Agreement are several and not joint with AURIENTA."
  ));

  // ─── ARTICLE VI — FEES ───
  out.push(...articleHeading("VI", "FEES AND COMPENSATION"));
  out.push(numberedClause("6.1",
    "No Capital-Holding Fee. The Law Firm shall not charge, and the Enterprise shall not pay, any capital-holding, custody, escrow, or asset-under-management fee in respect of Capital Partner Funds held in the Client Account. The Law Firm's compensation for the holding function is included within the Law Firm's retainer for constitutional formation and governance services."
  ));
  out.push(numberedClause("6.2",
    "Release Fee. The Law Firm may charge a per-release administrative fee not exceeding EGP 500 per release, payable from the Enterprise's operating account (not from Capital Partner Funds prior to release), and disclosed on the constitutional ledger."
  ));
  out.push(numberedClause("6.3",
    "Successor-Law-Firm Transfer. In the event of Law Firm replacement, the successor Law Firm shall not charge any transfer-in fee, and the outgoing Law Firm shall not charge any transfer-out fee; each shall bear its own costs of the transfer."
  ));

  // ─── ARTICLE VII — TERM AND TERMINATION ───
  out.push(...articleHeading("VII", "TERM AND TERMINATION"));
  out.push(numberedClause("7.1",
    "Term. This Agreement shall commence on the Effective Date and shall continue in force until the earliest of (a) graduation of the Enterprise from the AURIENTA platform in accordance with the Charter's graduation pathway, (b) replacement of the Law Firm in accordance with the Charter's law-firm-replacement procedure, or (c) mutual written agreement of the Parties."
  ));
  out.push(numberedClause("7.2",
    "Termination for Cause. AURIENTA may terminate this Agreement for cause immediately upon written notice if (a) the Law Firm's FRA license is suspended, revoked, or not renewed, (b) the Law Firm fails to maintain the insurance required under Article V, (c) the Law Firm commits a material breach of the Dual-Authorization Protocol, or (d) the Law Firm becomes insolvent or subject to a regulatory enforcement action that materially impairs its ability to perform."
  ));
  out.push(numberedClause("7.3",
    "Effect of Termination. Upon termination, the Law Firm shall cooperate fully with the successor law firm and shall transfer all Capital Partner Funds and records in accordance with Article III.4. Termination shall not affect any rights or obligations accrued prior to termination, nor the Law Firm's liability for acts or omissions during the term."
  ));

  // ─── ARTICLE VIII — FRA LICENSE VERIFICATION ───
  out.push(...articleHeading("VIII", "FRA LICENSE VERIFICATION; REGULATORY"));
  out.push(numberedClause("8.1",
    "License Verification. The Law Firm represents and warrants that it holds a valid and subsisting license under the Egyptian Lawyers' Code (Law No. 17 of 1983), is registered in good standing with the Egyptian Bar Association, and (where required) holds any FRA registration applicable to the holding and release of client funds in connection with constitutional enterprises. AURIENTA shall verify the Law Firm's license status against the Egyptian Bar Association's registry and the FRA registry within ten (10) business days of execution of this Agreement, and annually thereafter."
  ));
  out.push(numberedClause("8.2",
    "FRA No-Action Letter. The Parties acknowledge that the FRA has issued a No-Action Letter confirming that the Direct Law-Firm Transfer Model does not require FRA licensing on the part of AURIENTA, provided that (a) AURIENTA does not hold, control, or direct any capital, (b) the Law Firm holds funds under Article 47 of the Lawyers' Code, and (c) the Dual-Authorization Protocol is observed. The Parties shall comply with the conditions of the No-Action Letter at all times."
  ));
  out.push(numberedClause("8.3",
    "Regulatory Cooperation. Each Party shall promptly notify the other Parties of (a) any inquiry, examination, or investigation by the FRA, the Egyptian Bar Association, ESAA, or any other governmental authority relating to the Client Account or the Capital Partner Funds, (b) any material change in its licensing or regulatory status, and (c) any order, summons, or request that may affect the Client Account."
  ));
  out.push(numberedClause("8.4",
    "Anti-Money-Laundering. The Law Firm shall apply Egyptian AML/KYC requirements (Law No. 80 of 2002 and implementing regulations) to each Capital Partner whose funds are deposited into the Client Account, including without limitation source-of-funds verification, sanctions screening, and suspicious-transaction reporting. AURIENTA shall provide the Law Firm with each Capital Partner's KYC dossier as assembled under the Charter's sovereign identity layer."
  ));

  // ─── ARTICLE IX — AMENDMENT IX REFERENCE ───
  out.push(...articleHeading("IX", "RELATIONSHIP TO AMENDMENT IX"));
  out.push(numberedClause("9.1",
    "Incorporation by Reference. Amendment IX to the AURIENTA Constitutional Charter, bearing constitutional hash " + AMENDMENT_IX_HASH + ", is incorporated herein by reference. In the event of any conflict between this Agreement and Amendment IX, Amendment IX shall control with respect to constitutional matters and this Agreement shall control with respect to operational matters."
  ));
  out.push(numberedClause("9.2",
    "Charter Hierarchy. This Agreement is subordinate to, and shall be interpreted consistently with, the Charter as amended by Amendment IX. The non-amendable rules of Volume 1A of the Charter (including the Zero Custody rule) shall at all times prevail over any inconsistent provision of this Agreement."
  ));
  out.push(numberedClause("9.3",
    "Zero Custody. The Parties expressly acknowledge that AURIENTA's Zero Custody rule — that AURIENTA never holds, touches, or controls any Capital Partner Funds — is a non-amendable constitutional rule. Nothing in this Agreement shall be construed to impose any custodial, holding, or control obligation on AURIENTA."
  ));

  // ─── ARTICLE X — MISCELLANEOUS ───
  out.push(...articleHeading("X", "MISCELLANEOUS"));
  out.push(numberedClause("10.1",
    "Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the Arab Republic of Egypt, including without limitation the Egyptian Lawyers' Code (Law No. 17 of 1983), Companies Law No. 159 of 1981, and the Egyptian Civil Code."
  ));
  out.push(numberedClause("10.2",
    "Dispute Resolution. Any dispute arising out of or relating to this Agreement shall be finally resolved by arbitration administered by the Cairo Regional Centre for International Commercial Arbitration (CRCICA) under its rules, seated in Cairo, in the Arabic and English languages, by a panel of three (3) arbitrators, each of whom shall be a qualified Egyptian lawyer or accountant of at least fifteen (15) years' standing."
  ));
  out.push(numberedClause("10.3",
    "Notices. All notices under this Agreement shall be in writing and delivered to the Parties at the addresses set forth above (or as updated by written notice), with a copy to the AURIENTA Constitutional Office. Notices published to the constitutional ledger shall have the same force and effect as written notices."
  ));
  out.push(numberedClause("10.4",
    "Entire Agreement. This Agreement, together with the Charter as amended by Amendment IX, constitutes the entire agreement among the Parties with respect to its subject matter and supersedes all prior agreements, understandings, and representations, whether written or oral, relating to the holding and release of Capital Partner Funds."
  ));
  out.push(numberedClause("10.5",
    "Amendment. This Agreement may be amended only by a written instrument signed by all three Parties, and only after such amendment has been recorded in the constitutional ledger. No amendment shall be effective if it would cause AURIENTA to hold, touch, or control any Capital Partner Funds."
  ));
  out.push(numberedClause("10.6",
    "Counterparts. This Agreement may be executed in counterparts, each of which shall be deemed an original and all of which together shall constitute one and the same instrument. Electronic signatures recorded on the constitutional ledger shall have the same force and effect as manual signatures."
  ));

  // ─── Signature page ───
  out.push(sectionDivider());
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 },
    children: [new TextRun({ text: "SIGNATURE PAGE", bold: true, size: 26, color: c(P.primary),
      characterSpacing: 60, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  }));
  out.push(body(
    "IN WITNESS WHEREOF, the Parties have caused this Law Firm Escrow Waiver and Client Account Authorization to be executed by their duly authorized representatives as of the dates set forth below.",
    { after: 320, noIndent: true }
  ));
  out.push(signatureBlock([
    { label: "AURIENTA", name: "Layla Mostafa", title: "AURIENTA Representative", license: "Constitutional Office", witness: true },
    { label: "LAW FIRM", name: "[Attorney Name]", title: "Managing Partner", license: "Law 17/1983 · FRA-registered", witness: true },
    { label: "ENTERPRISE", name: "[Manager Name]", title: "Enterprise Manager", license: "GAFI CR #[____]", witness: true },
  ]));

  out.push(spacer(360));
  out.push(hashBanner(CONSTITUTIONAL_HASH, "AURIENTA CONSTITUTIONAL HASH (ROOT)"));
  out.push(spacer(120));
  out.push(hashBanner(AMENDMENT_IX_HASH, "AMENDMENT IX HASH"));
  out.push(spacer(120));
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 0 },
    children: [new TextRun({
      text: "— End of Document —", size: 16, italics: true, color: c(P.secondary),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));
  return out;
}

// ═════════════════════════════════════════════════════════════════
// DOCUMENT 2 — CERTIFIED ACCOUNTANT MILESTONE RELEASE AUTHORIZATION
// ═════════════════════════════════════════════════════════════════
function buildMilestoneReleaseBody() {
  const out = [];

  // ─── Title block ───
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 160 },
    children: [new TextRun({
      text: "CERTIFIED ACCOUNTANT",
      bold: true, size: 32, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({
      text: "MILESTONE RELEASE AUTHORIZATION",
      bold: true, size: 32, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: c(P.accent), space: 6 } },
    children: [new TextRun({
      text: "Evidence Verification & Co-Authorization Protocol  ·  Pursuant to Amendment IX to the Constitutional Charter",
      size: 20, italics: true, color: c(P.secondary),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));

  // ─── Parties ───
  out.push(body(
    "This Certified Accountant Milestone Release Authorization (this \"Agreement\") is entered into as of the Effective Date defined in Article X below, by and among:"
  ));
  out.push(bulletRuns([
    R("[ENTERPRISE NAME] ", { bold: true }),
    R("(the \"Enterprise\"), an Egyptian company formed under Companies Law No. 159 of 1981, registered with GAFI under commercial registration number [____], onboarded onto the AURIENTA platform at Tier [A–F];", { }),
  ]));
  out.push(bulletRuns([
    R("[ACCOUNTING FIRM NAME] ", { bold: true }),
    R("(the \"Accounting Firm\"), an Egyptian certified accounting firm registered with and licensed by the Egyptian Society of Accountants and Auditors (\"ESAA\") under registration number [____], with its principal place of business at [____]; and", { }),
  ]));
  out.push(bulletRuns([
    R("AURIENTA ", { bold: true }),
    R("(the \"Platform\" or \"AURIENTA\"), a constitutional enterprise infrastructure provider operating under the AURIENTA Constitutional Charter (the \"Charter\"), with constitutional hash ", { }),
    R(CONSTITUTIONAL_HASH, { bold: true, color: P.primary }),
    R(", acting by and through its Constitutional Office.", { }),
  ]));
  out.push(body(
    "The Enterprise, the Accounting Firm, and AURIENTA are referred to herein individually as a \"Party\" and collectively as the \"Parties.\""
  ));

  // ─── Recitals ───
  out.push(sectionDivider());
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 200, after: 160 },
    children: [new TextRun({ text: "RECITALS", bold: true, size: 26, color: c(P.primary),
      characterSpacing: 60, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  }));
  out.push(recitalClause("A",
    "WHEREAS, AURIENTA has adopted Amendment IX to the Constitutional Charter, which restructures the platform's capital-handling architecture into a Direct Law-Firm Transfer Model in which Capital Partner Funds are held by a licensed Law Firm in a client account under Article 47 of the Egyptian Lawyers' Code, and released only upon the dual authorization of (a) the Enterprise's board and (b) the Accounting Firm's evidence verification;"
  ));
  out.push(recitalClause("B",
    "WHEREAS, the Accounting Firm, as a certified accounting firm registered with ESAA, possesses the professional qualifications, independence, and standards-compliance required to independently verify milestone evidence in accordance with Egyptian Generally Accepted Auditing Standards and ESAA by-laws;"
  ));
  out.push(recitalClause("C",
    "WHEREAS, the Charter as amended by Amendment IX designates the Accounting Firm as the final gate for milestone fund releases — such that no release from the Law Firm's Client Account may occur without the Accounting Firm's co-authorization certifying that milestone evidence has been independently verified;"
  ));
  out.push(recitalClause("D",
    "WHEREAS, the Parties desire to memorialize the scope, methodology, audit-trail requirements, liability, and fee structure of the Accounting Firm's milestone release authorization function;"
  ));
  out.push(body(
    "NOW, THEREFORE, in consideration of the mutual covenants and agreements set forth herein, the Parties agree as follows:",
    { after: 200 }
  ));

  // ─── ARTICLE I — DEFINITIONS ───
  out.push(...articleHeading("I", "DEFINITIONS"));
  out.push(numberedClause("1.1",
    "\"Milestone\" means a constitutionally-defined deliverable in the Enterprise's approved budget or business plan, the completion of which authorizes a corresponding release of Capital Partner Funds from the Law Firm's Client Account. Milestones and their corresponding release amounts are recorded in the constitutional ledger at enterprise formation and may be amended only through the Charter's proposal-and-vote process."
  ));
  out.push(numberedClause("1.2",
    "\"Milestone Evidence\" means the documentary and electronic evidence submitted by the Enterprise to demonstrate Milestone completion, including without limitation (a) vendor invoices bearing the Enterprise's approval stamps, (b) geotagged and time-stamped photographs of physical deliverables, (c) payroll registers and bank confirmation of salary disbursement, (d) delivery receipts and acceptance certificates, (e) third-party inspection reports, (f) ERP-generated cost-allocation reports, and (g) such other evidence as the Charter or the Accounting Firm may reasonably require."
  ));
  out.push(numberedClause("1.3",
    "\"Evidence Verification\" means the Accounting Firm's independent examination of Milestone Evidence in accordance with ESAA standards, sufficient to enable the Accounting Firm to issue a Verification Certification with reasonable assurance that the Milestone has been completed and the corresponding release amount is properly supported."
  ));
  out.push(numberedClause("1.4",
    "\"Verification Certification\" means the written, signed, and ledger-published certification issued by the Accounting Firm authorizing the Law Firm to release a specified amount from the Client Account to a specified payee in respect of a specified Milestone, in the form attached as Schedule A."
  ));
  out.push(numberedClause("1.5",
    "\"Release Authorization\" means the conjunctive combination of (a) the Enterprise's Board Approval and (b) the Accounting Firm's Verification Certification, which together constitute the Dual-Authorization required for the Law Firm to release Capital Partner Funds."
  ));
  out.push(numberedClause("1.6",
    "\"Immutable Ledger\" means the AURIENTA constitutional ledger, a hash-chained, append-only, cryptographically-anchored record of all constitutional events, into which every Evidence Verification and Verification Certification shall be published in real time."
  ));
  out.push(numberedClause("1.7",
    "\"Consulting Fee\" means the 2.5% consulting fee component of the AURIENTA fee structure (the other component being the 5% platform service fee), from which the Accounting Firm's compensation under this Agreement is paid."
  ));

  // ─── ARTICLE II — APPOINTMENT AND SCOPE ───
  out.push(...articleHeading("II", "APPOINTMENT AND SCOPE"));
  out.push(numberedClause("2.1",
    "Appointment. The Enterprise hereby appoints the Accounting Firm, and the Accounting Firm hereby accepts appointment, as the certified accounting firm responsible for Evidence Verification and Release Authorization under the Charter as amended by Amendment IX. The Accounting Firm's appointment is subject to ratification by the Enterprise's board and to the Charter's accounting-firm-appointment procedure."
  ));
  out.push(numberedClause("2.2",
    "Final Gate. The Parties expressly acknowledge that the Accounting Firm is the final gate for milestone fund releases under the Charter. No release of Capital Partner Funds from the Law Firm's Client Account may occur without the Accounting Firm's Verification Certification, regardless of (a) the Enterprise's urgency, (b) the magnitude of the release, (c) the Law Firm's willingness to release, or (d) any instruction from AURIENTA. The Accounting Firm's role is not advisory, not ministerial, and not optional."
  ));
  out.push(numberedClause("2.3",
    "Scope of Services. The Accounting Firm's services under this Agreement shall include, without limitation: (a) reviewing each Milestone Evidence submission for completeness, (b) performing Evidence Verification in accordance with ESAA standards, (c) issuing or refusing Verification Certifications, (d) publishing every Verification Certification (and every refusal) to the Immutable Ledger in real time, (e) maintaining a contemporaneous audit trail of all verification activities, (f) cooperating with the Law Firm in the Dual-Authorization Protocol, and (g) reporting quarterly to the Enterprise's board and AURIENTA on verification activity, refusal rates, and evidence-quality trends."
  ));
  out.push(numberedClause("2.4",
    "Independence. The Accounting Firm shall at all times maintain its independence from the Enterprise, the Law Firm, AURIENTA, and any vendor or payee of Capital Partner Funds, in accordance with ESAA's independence requirements. The Accounting Firm shall not accept any engagement that would create a conflict of interest with its role under this Agreement, and shall disclose any actual or potential conflict to the Parties promptly upon discovery."
  ));

  // ─── ARTICLE III — EVIDENCE VERIFICATION METHODOLOGY ───
  out.push(...articleHeading("III", "EVIDENCE VERIFICATION METHODOLOGY"));
  out.push(numberedClause("3.1",
    "Verification Standards. The Accounting Firm shall perform Evidence Verification in accordance with (a) Egyptian Generally Accepted Auditing Standards, (b) ESAA by-laws and pronouncements, (c) International Standards on Assurance Engagements (ISAE) as adopted in Egypt, and (d) the verification protocols set forth in the Charter as amended by Amendment IX."
  ));
  out.push(numberedClause("3.2",
    "Evidence Categories. The Accounting Firm shall verify Milestone Evidence in each of the following categories, as applicable to the Milestone:"
  ));
  out.push(bullet("Invoices: vendor invoices cross-checked against purchase orders, delivery notes, and the Enterprise's approval workflow, with confirmation of vendor bank-account consistency."));
  out.push(bullet("Geotagged Photographs: photographs bearing GPS coordinates and timestamps embedded in the image EXIF metadata, cross-checked against the Milestone's expected geographic location and date range."));
  out.push(bullet("Payroll: payroll registers cross-checked against employee contracts, NOSI social-insurance registration, and bank confirmations of net-salary disbursement."));
  out.push(bullet("Delivery Receipts: delivery and acceptance receipts bearing the signatures of authorized Enterprise personnel and (where applicable) third-party inspectors."));
  out.push(bullet("ERP Reports: cost-allocation and milestone-progress reports generated by the Enterprise's certified ERP system, with reconciliation to the general ledger."));
  out.push(bullet("Third-Party Inspections: inspection reports from independent engineers, quantity surveyors, or quality-assurance firms, where the Milestone or its Tier requires."));
  out.push(numberedClause("3.3",
    "Verification Procedures. The Accounting Firm shall perform, at minimum, the following procedures for each Milestone Evidence submission: (a) completeness check (all required evidence documents present), (b) authenticity check (documents bear required signatures, stamps, and metadata), (c) consistency check (documents are mutually consistent and consistent with the budget), (d) arithmetic check (amounts reconcile), (e) selectivity check (where risk-based sampling is appropriate, apply it consistently), and (f) sufficiency determination (does the evidence support the requested release amount?)."
  ));
  out.push(numberedClause("3.4",
    "Verification Outcome. Within three (3) business days of receipt of a complete Milestone Evidence submission, the Accounting Firm shall issue either (a) a Verification Certification authorizing the release, in whole or in part, (b) a Conditional Verification identifying specific deficiencies to be cured, or (c) a Refusal of Verification identifying the reasons for refusal. Every outcome shall be published to the Immutable Ledger within one (1) hour of issuance."
  ));
  out.push(numberedClause("3.5",
    "No Self-Certification. The Enterprise shall not self-certify Milestone Evidence under any circumstance. The Enterprise's board, manager, or any Capital Partner may submit Milestone Evidence to the Accounting Firm, but only the Accounting Firm may issue a Verification Certification."
  ));

  // ─── ARTICLE IV — CO-AUTHORIZATION OF RELEASE ───
  out.push(...articleHeading("IV", "CO-AUTHORIZATION OF RELEASE"));
  out.push(numberedClause("4.1",
    "Co-Authorization. Upon issuance of a Verification Certification, the Accounting Firm shall transmit such Certification to the Law Firm as the second of the two authorizations required for release (the first being the Enterprise's Board Approval). The Law Firm shall not execute any release in the absence of a valid Verification Certification."
  ));
  out.push(numberedClause("4.2",
    "Form of Certification. Each Verification Certification shall identify (a) the Enterprise, (b) the Milestone, (c) the verification date, (d) the evidence documents reviewed, (e) the verification methodology applied, (f) the verified release amount, (g) the payee bank account, (h) the constitutional ledger reference of the corresponding Board Approval, (i) the Accounting Firm's ESAA registration number, and (j) the signature of the engagement partner."
  ));
  out.push(numberedClause("4.3",
    "Partial Certification. The Accounting Firm may issue a Verification Certification for less than the full requested release amount, where the evidence supports only a portion. The Law Firm shall release only the certified amount. The Enterprise may re-submit evidence for the remaining amount as a new Milestone Evidence submission."
  ));
  out.push(numberedClause("4.4",
    "Withdrawal of Certification. The Accounting Firm may withdraw a Verification Certification prior to release if it discovers information that would have caused it to refuse certification. Withdrawal shall be published to the Immutable Ledger immediately and shall be conclusive — the Law Firm shall not execute the release."
  ));
  out.push(numberedClause("4.5",
    "No Substitution. No instruction, request, or demand from AURIENTA, the Enterprise, the Law Firm, or any Capital Partner shall substitute for, override, or expedite a Verification Certification. The Accounting Firm's certification function is non-delegable and may not be sub-contracted without the prior written consent of the Enterprise and AURIENTA."
  ));

  // ─── ARTICLE V — ESAA LICENSE VERIFICATION AND COMPLIANCE ───
  out.push(...articleHeading("V", "ESAA LICENSE VERIFICATION AND COMPLIANCE"));
  out.push(numberedClause("5.1",
    "ESAA Registration. The Accounting Firm represents and warrants that it is duly registered with ESAA under registration number [____], is in good standing, and holds all licenses, permits, and professional qualifications required to perform the Evidence Verification and Verification Certification functions under this Agreement. AURIENTA shall verify the Accounting Firm's ESAA registration within ten (10) business days of execution of this Agreement, and annually thereafter."
  ));
  out.push(numberedClause("5.2",
    "ESAA Compliance. The Accounting Firm shall comply, at all times during the term of this Agreement, with ESAA by-laws, pronouncements, continuing-professional-education requirements, and quality-control standards. The Accounting Firm shall promptly notify AURIENTA and the Enterprise of (a) any change in its ESAA registration status, (b) any ESAA disciplinary proceeding or investigation, and (c) any material change in its independence position."
  ));
  out.push(numberedClause("5.3",
    "Engagement Partner. The Accounting Firm shall designate a partner with not less than ten (10) years of post-qualification experience as the engagement partner for the Enterprise. The engagement partner shall be identified in the constitutional ledger and shall personally sign each Verification Certification."
  ));
  out.push(numberedClause("5.4",
    "Peer Review. The Accounting Firm shall consent to peer review by an independent ESAA-registered firm selected by AURIENTA, no less frequently than once every three (3) years, of the Accounting Firm's verification workpapers, methodology, and quality-control procedures. Peer-review findings shall be published to the constitutional ledger."
  ));

  // ─── ARTICLE VI — AUDIT TRAIL REQUIREMENTS ───
  out.push(...articleHeading("VI", "AUDIT TRAIL AND IMMUTABLE LEDGER"));
  out.push(numberedClause("6.1",
    "Real-Time Ledger Publication. The Accounting Firm shall publish to the Immutable Ledger, within one (1) hour of occurrence, every event in the verification and release workflow, including without limitation: (a) receipt of a Milestone Evidence submission, (b) commencement of verification, (c) issuance, withdrawal, or refusal of a Verification Certification, (d) transmittal of a Verification Certification to the Law Firm, and (e) confirmation of release execution by the Law Firm."
  ));
  out.push(numberedClause("6.2",
    "Workpaper Retention. The Accounting Firm shall retain all verification workpapers, evidence documents, and communications for not less than ten (10) years following the graduation of the Enterprise from the AURIENTA platform, or such longer period as required by ESAA, the FRA, or Egyptian law. Workpapers shall be made available to the Enterprise, AURIENTA, the FRA, ESAA, and any court of competent jurisdiction upon reasonable request."
  ));
  out.push(numberedClause("6.3",
    "Hash-Anchoring. Each ledger entry published by the Accounting Firm shall be hash-chained to the preceding entry in accordance with the Charter's ledger protocol, and the cumulative hash shall be anchored to the constitutional hash on a recurring schedule. Any attempt to alter, backdate, or omit a ledger entry shall be detectable by the Charter's verify-on-read protocol."
  ));
  out.push(numberedClause("6.4",
    "Quarterly Reporting. The Accounting Firm shall prepare and publish to the constitutional ledger, within thirty (30) days of each calendar quarter, a report summarizing (a) the number of Milestone Evidence submissions received, (b) the number and aggregate value of Verification Certifications issued, (c) the number and reasons for refusals, (d) the average verification cycle time, and (e) any evidence-quality trends or recurring deficiencies identified."
  ));
  out.push(numberedClause("6.5",
    "Annual Audit. The Accounting Firm's verification activities under this Agreement shall be subject to the annual Layer-3 statutory audit required by §4.11 of the Charter, conducted by an independent external auditor selected through the Charter's auditor-selection procedure. The annual audit shall evaluate the Accounting Firm's compliance with this Agreement, ESAA standards, and the Charter."
  ));

  // ─── ARTICLE VII — LIABILITY ───
  out.push(...articleHeading("VII", "LIABILITY FOR EVIDENCE VERIFICATION QUALITY"));
  out.push(numberedClause("7.1",
    "Standard of Care. The Accounting Firm shall perform its verification function with the degree of skill, care, and diligence expected of a certified accounting firm registered with ESAA and engaged in milestone verification under constitutional-enterprise governance. The Accounting Firm shall be liable to the Enterprise, the Capital Partners, and AURIENTA for any loss or damage proximately caused by the Accounting Firm's failure to meet this standard of care."
  ));
  out.push(numberedClause("7.2",
    "Scope of Liability. Without limiting the foregoing, the Accounting Firm's liability shall extend to losses caused by (a) issuance of a Verification Certification on the basis of materially insufficient, fraudulent, or fabricated Milestone Evidence, (b) failure to perform verification procedures required by ESAA standards or this Agreement, (c) failure to publish events to the Immutable Ledger as required by Article VI, (d) breach of independence requirements, and (e) negligent misstatement in any Verification Certification."
  ));
  out.push(numberedClause("7.3",
    "Damage Measure. The Accounting Firm's liability for each Verification Certification shall not exceed the greater of (a) the amount released in reliance on the certification, or (b) ten (10) times the Accounting Firm's annual fee under this Agreement. Liability in the aggregate per year shall not exceed the greater of (a) the aggregate amount released under all Verification Certifications issued in that year, or (b) EGP 50,000,000."
  ));
  out.push(numberedClause("7.4",
    "Insurance. The Accounting Firm shall maintain professional indemnity insurance with a reputable, Egyptian-licensed insurer, in an aggregate amount of not less than EGP 50,000,000 per claim and per policy year, naming AURIENTA and the Enterprise as additional insureds, and providing for not less than thirty (30) days' prior written notice of cancellation. Certificates of insurance shall be delivered upon execution and annually thereafter."
  ));
  out.push(numberedClause("7.5",
    "No Liability for Release Execution. The Accounting Firm shall not be liable for any act or omission of the Law Firm in executing or refusing to execute a release following receipt of a valid Verification Certification. The Accounting Firm's role concludes upon issuance (or refusal) of certification."
  ));
  out.push(numberedClause("7.6",
    "Indemnity. The Accounting Firm shall indemnify and hold harmless the Enterprise, the Capital Partners, and AURIENTA from and against any and all losses, claims, damages, and expenses (including reasonable legal fees) arising out of or resulting from the Accounting Firm's breach of this Agreement, breach of ESAA standards, or negligent or fraudulent issuance of a Verification Certification."
  ));

  // ─── ARTICLE VIII — FEE STRUCTURE ───
  out.push(...articleHeading("VIII", "FEE STRUCTURE"));
  out.push(numberedClause("8.1",
    "Source of Compensation. The Accounting Firm's compensation under this Agreement shall be paid exclusively from the Consulting Fee component of the AURIENTA fee structure (the 2.5% consulting fee on capital raised by the Enterprise), as administered by AURIENTA. The Accounting Firm shall not charge, and the Enterprise shall not pay, any additional fee, retainer, or hourly charge for the verification and certification function."
  ));
  out.push(numberedClause("8.2",
    "Allocation. Of the 2.5% Consulting Fee collected on each Enterprise, the portion allocated to the Accounting Firm shall be as set forth in Schedule B, but in no event less than [__]% nor more than [__]% of the Consulting Fee. The allocation shall be reviewed annually by AURIENTA and adjusted in accordance with the volume and complexity of verification activity."
  ));
  out.push(numberedClause("8.3",
    "Annual Cap. The Accounting Firm's annual compensation under this Agreement shall be subject to a cap of EGP [____] per Enterprise per year, with the balance of the Consulting Fee (if any) allocated to the Law Firm and other constitutional service providers as set forth in the Charter."
  ));
  out.push(numberedClause("8.4",
    "No Contingent Fees. The Accounting Firm shall not accept any contingent fee, success fee, or release-amount-based fee in connection with the verification function, in accordance with ESAA's prohibition on contingent fees for assurance engagements."
  ));
  out.push(numberedClause("8.5",
    "Payment Terms. AURIENTA shall pay the Accounting Firm's fee monthly in arrears, within fifteen (15) days of the end of each calendar month, against an invoice supported by the Immutable Ledger record of verification activity during that month."
  ));

  // ─── ARTICLE IX — TERM, TERMINATION, REPLACEMENT ───
  out.push(...articleHeading("IX", "TERM, TERMINATION, AND REPLACEMENT"));
  out.push(numberedClause("9.1",
    "Term. This Agreement shall commence on the Effective Date and shall continue until the earliest of (a) graduation of the Enterprise, (b) replacement of the Accounting Firm in accordance with the Charter's accounting-firm-replacement procedure (which requires, after the first twelve (12) months, a 5% voting-power proposal and a 14-day cooling period followed by a 7-day voting period), or (c) mutual written agreement of the Parties."
  ));
  out.push(numberedClause("9.2",
    "Termination for Cause. AURIENTA may terminate this Agreement for cause immediately upon written notice if (a) the Accounting Firm's ESAA registration is suspended, revoked, or not renewed, (b) the Accounting Firm fails to maintain the insurance required under Article VII, (c) the Accounting Firm commits a material breach of the independence or verification-quality requirements, or (d) the Accounting Firm becomes insolvent or subject to a regulatory enforcement action."
  ));
  out.push(numberedClause("9.3",
    "Handover. Upon termination, the Accounting Firm shall, within ten (10) business days, deliver to the successor accounting firm all workpapers, evidence files, ledger entries, and open verifications, and shall cooperate fully in the transition. The Accounting Firm shall remain liable for verification work performed during its tenure."
  ));

  // ─── ARTICLE X — MISCELLANEOUS ───
  out.push(...articleHeading("X", "MISCELLANEOUS"));
  out.push(numberedClause("10.1",
    "Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the Arab Republic of Egypt, including without limitation Companies Law No. 159 of 1981, the Egyptian Society of Accountants and Auditors law and by-laws, and the Egyptian Civil Code."
  ));
  out.push(numberedClause("10.2",
    "Dispute Resolution. Any dispute arising out of or relating to this Agreement shall be finally resolved by arbitration administered by the Cairo Regional Centre for International Commercial Arbitration (CRCICA) under its rules, seated in Cairo, by a panel of three (3) arbitrators, each of whom shall be a qualified Egyptian accountant or lawyer of at least fifteen (15) years' standing."
  ));
  out.push(numberedClause("10.3",
    "Amendment IX Reference. Amendment IX to the AURIENTA Constitutional Charter, bearing constitutional hash " + AMENDMENT_IX_HASH + ", is incorporated herein by reference. In the event of any conflict between this Agreement and Amendment IX, Amendment IX shall control with respect to constitutional matters."
  ));
  out.push(numberedClause("10.4",
    "Zero Custody. The Parties expressly acknowledge that AURIENTA's Zero Custody rule — that AURIENTA never holds, touches, or controls any Capital Partner Funds — is a non-amendable constitutional rule. The Accounting Firm's verification function does not confer any custodial role on AURIENTA."
  ));
  out.push(numberedClause("10.5",
    "Entire Agreement. This Agreement, together with the Charter as amended by Amendment IX, constitutes the entire agreement among the Parties with respect to its subject matter and supersedes all prior agreements and understandings, whether written or oral."
  ));
  out.push(numberedClause("10.6",
    "Counterparts. This Agreement may be executed in counterparts, each of which shall be deemed an original. Electronic signatures recorded on the constitutional ledger shall have the same force and effect as manual signatures."
  ));

  // ─── Signature page ───
  out.push(sectionDivider());
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 },
    children: [new TextRun({ text: "SIGNATURE PAGE", bold: true, size: 26, color: c(P.primary),
      characterSpacing: 60, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  }));
  out.push(body(
    "IN WITNESS WHEREOF, the Parties have caused this Certified Accountant Milestone Release Authorization to be executed by their duly authorized representatives as of the dates set forth below.",
    { after: 320, noIndent: true }
  ));
  out.push(signatureBlock([
    { label: "ENTERPRISE", name: "[Manager Name]", title: "Enterprise Manager", license: "GAFI CR #[____]", witness: true },
    { label: "ACCOUNTING FIRM", name: "[Partner Name]", title: "Engagement Partner", license: "ESAA #[____]", witness: true },
    { label: "AURIENTA", name: "Layla Mostafa", title: "AURIENTA Representative", license: "Constitutional Office", witness: true },
  ]));

  out.push(spacer(360));
  out.push(hashBanner(CONSTITUTIONAL_HASH, "AURIENTA CONSTITUTIONAL HASH (ROOT)"));
  out.push(spacer(120));
  out.push(hashBanner(AMENDMENT_IX_HASH, "AMENDMENT IX HASH"));
  out.push(spacer(120));
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 0 },
    children: [new TextRun({
      text: "— End of Document —", size: 16, italics: true, color: c(P.secondary),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));
  return out;
}

// ═════════════════════════════════════════════════════════════════
// DOCUMENT 3 — CONSTITUTIONAL AMENDMENT IX
// ═════════════════════════════════════════════════════════════════
function buildAmendmentIXBody() {
  const out = [];

  // ─── Title block ───
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({
      text: "CONSTITUTIONAL CHARTER", bold: true, size: 24, color: c(P.secondary),
      characterSpacing: 80,
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({
      text: "AMENDMENT IX", bold: true, size: 56, color: c(P.primary),
      characterSpacing: 80,
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({
      text: "Direct Law-Firm Transfer Model", bold: true, size: 30, color: c(P.goldDark),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: c(P.accent), space: 6 } },
    children: [new TextRun({
      text: "A Formal Amendment to the AURIENTA Constitutional Charter  ·  Pursuant to Article V of the Charter",
      size: 20, italics: true, color: c(P.secondary),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));

  // ─── Amendment metadata ───
  out.push(makeTable(
    ["Amendment Field", "Value"],
    [
      ["Amendment Number", "IX (nine)"],
      ["Short Title", "Direct Law-Firm Transfer Model"],
      ["Authority", "Article V of the AURIENTA Constitutional Charter"],
      ["Supermajority Required for Passage", "75% of global voting power"],
      ["Cooling Period", "90 (ninety) days from filing"],
      ["Voting Period", "14 (fourteen) days"],
      ["Filing Fee", "EGP 2,000 (refundable if the amendment passes)"],
      ["Legal Basis", "Egyptian Lawyers' Code (Law 17/1983, Art. 47); Companies Law 159/1981; FRA No-Action Letter"],
      ["Effective Date", "Upon 75% supermajority passage, following the cooling and voting periods"],
      ["Constitutional Hash (Root)", CONSTITUTIONAL_HASH],
      ["Amendment Hash (post-passage)", AMENDMENT_IX_HASH],
      ["Re-Signing", "Constitutional hash to be re-signed upon passage; all prior signatures preserved on the immutable ledger"],
    ],
    [40, 60],
  ));
  out.push(spacer(160));

  // ─── ARTICLE I — RECITALS ───
  out.push(...articleHeading("I", "RECITALS AND STATEMENT OF PURPOSE"));
  out.push(numberedClause("1.1",
    "The Constitutional Partners of AURIENTA, exercising their reserved authority under Article V of the Constitutional Charter, hereby adopt this Amendment IX (the \"Amendment\") to restructure the platform's capital-handling architecture from a Constitutional Escrow Vault model to a Direct Law-Firm Transfer Model."
  ));
  out.push(numberedClause("1.2",
    "This Amendment is necessitated by (a) the explicit permission granted to licensed lawyers under Article 47 of the Egyptian Lawyers' Code (Law No. 17 of 1983) to hold client funds in segregated client accounts, (b) the Companies Law No. 159 of 1981 framework for the formation and governance of Egyptian companies, and (c) the FRA No-Action Letter classifying AURIENTA as technology, governance, and matchmaking infrastructure — and not as a crowdfunding platform, broker, custodian, or financial intermediary — confirming that the direct transfer of capital partner funds to a licensed law firm's client account does not require FRA licensing on the part of AURIENTA."
  ));
  out.push(numberedClause("1.3",
    "The purpose of this Amendment is to (a) eliminate any structural ambiguity about AURIENTA's non-custodial status, (b) align the Charter with the Lawyers' Code's express client-fund-holding authority, (c) strengthen bankruptcy-remote protection of capital partner funds by anchoring them in a licensed-law-firm client account rather than in a platform-managed escrow construct, and (d) preserve the Zero Custody rule — that AURIENTA never holds, touches, or controls any capital — as the platform's foundational non-amendable invariant."
  ));

  // ─── ARTICLE II — ADOPTION PROCEDURE ───
  out.push(...articleHeading("II", "ADOPTION PROCEDURE"));
  out.push(numberedClause("2.1",
    "Authority. This Amendment is adopted pursuant to Article V of the Constitutional Charter, which requires a 75% supermajority of global voting power for constitutional amendments, a 90-day cooling period from filing, and a 14-day voting period."
  ));
  out.push(numberedClause("2.2",
    "Cooling Period. The 90-day cooling period shall commence on the date the Amendment is filed with the Constitutional Office and published to the immutable ledger. During the cooling period, Constitutional Partners may debate, propose non-substantive drafting clarifications, and submit written analyses. No vote shall be recorded during the cooling period."
  ));
  out.push(numberedClause("2.3",
    "Voting Period. The 14-day voting period shall commence on the day following the expiration of the cooling period. Voting shall be conducted through the Constitutional Runtime Engine (CRE), with each Equity Unit representing one vote. Votes may be cast at any time during the voting period and may be changed until the period closes."
  ));
  out.push(numberedClause("2.4",
    "Supermajority Threshold. The Amendment shall be deemed adopted if and only if votes in favor constitute not less than 75% of the total outstanding voting power of all Constitutional Partners — not merely of those voting. Quorum requirements shall not apply to constitutional amendment votes."
  ));
  out.push(numberedClause("2.5",
    "Mathematical Determination. The CRE shall count votes in real time and may declare the Amendment adopted — or defeated — prior to the close of the voting period once the outcome becomes mathematically determined. All vote tallies shall be published to the immutable ledger."
  ));
  out.push(numberedClause("2.6",
    "Filing Fee. A non-refundable-at-filing fee of EGP 2,000 shall be paid by the proposing Constitutional Partner(s) at the time of filing. The fee shall be refunded in full if the Amendment passes; the fee shall be forfeited if the Amendment fails."
  ));

  // ─── ARTICLE III — DEFINITIONS ───
  out.push(...articleHeading("III", "DEFINITIONS"));
  out.push(numberedClause("3.1",
    "\"Law Firm Client Account\" means a segregated bank account opened and maintained by a licensed Egyptian law firm at an Egyptian-licensed bank, designated exclusively for the deposit, holding, and release of capital partner funds contributed to an Enterprise, and held under Article 47 of the Egyptian Lawyers' Code (Law No. 17 of 1983). The Law Firm Client Account is the successor-in-interest to the former \"Constitutional Escrow Vault\" concept throughout the Charter."
  ));
  out.push(numberedClause("3.2",
    "\"Direct Law-Firm Transfer Model\" means the fund-flow architecture established by this Amendment, under which capital partner funds flow directly from the Capital Partner to the Law Firm Client Account, are held by the Law Firm under Article 47 of the Lawyers' Code, and are released only upon the dual authorization of (a) Enterprise board approval and (b) Accounting Firm evidence verification."
  ));
  out.push(numberedClause("3.3",
    "\"Constitutional Escrow Vault\" means the former capital-handling construct referenced throughout the Charter prior to this Amendment. As of the Effective Date, all references to \"Constitutional Escrow Vault\" in the Charter shall be construed as references to \"Law Firm Client Account,\" except where the context clearly requires otherwise."
  ));
  out.push(numberedClause("3.4",
    "\"Dual-Authorization Protocol\" means the conjunctive release condition requiring both (a) Board Approval and (b) Accounting Firm Evidence Verification, as further specified in the Charter and in the ancillary agreements adopted under this Amendment."
  ));

  // ─── ARTICLE IV — SUBSTANTIVE AMENDMENTS TO THE CHARTER ───
  out.push(...articleHeading("IV", "SUBSTANTIVE AMENDMENTS TO THE CHARTER"));
  out.push(numberedClause("4.1",
    "Textual Substitution. As of the Effective Date, the term \"Constitutional Escrow Vault\" — and each of its grammatical variants (\"Escrow Vault,\" \"the Vault,\" \"constitutional escrow,\" \"platform escrow,\" etc.) — shall be replaced throughout the Charter with \"Law Firm Client Account,\" with corresponding grammatical adjustments. This substitution applies to all Volumes, Parts, Sections, Articles, Tables, Figures, and Appendices of the Charter."
  ));
  out.push(numberedClause("4.2",
    "Fund Flow Architecture. The Charter's fund-flow architecture is hereby amended to provide that:"
  ));
  out.push(bulletRuns([
    R("Step 1 — Capital Partner Deposit. ", { bold: true, color: P.goldDark }),
    R("Each Capital Partner's contribution is transferred directly by the Capital Partner to the Law Firm Client Account, by bank wire or other Egyptian-licensed banking channel. AURIENTA is not a remitter, payee, intermediary, custodian, signatory, or beneficial owner of any capital partner funds."),
  ]));
  out.push(bulletRuns([
    R("Step 2 — Law Firm Holding. ", { bold: true, color: P.goldDark }),
    R("The Law Firm holds the funds in the Law Firm Client Account under Article 47 of the Egyptian Lawyers' Code, in a segregated, bankruptcy-remote status. The Law Firm observes all professional, fiduciary, and record-keeping duties imposed by the Lawyers' Code and the Egyptian Bar Association by-laws."),
  ]));
  out.push(bulletRuns([
    R("Step 3 — Accounting Firm Verification. ", { bold: true, color: P.goldDark }),
    R("Upon Enterprise request, the Certified Accounting Firm appointed to the Enterprise independently verifies Milestone Evidence in accordance with ESAA standards and issues (or refuses) a Verification Certification, which is published to the immutable ledger."),
  ]));
  out.push(bulletRuns([
    R("Step 4 — Dual-Authorization Release. ", { bold: true, color: P.goldDark }),
    R("Upon receipt of both (a) Board Approval and (b) Accounting Firm Evidence Verification, the Law Firm releases the specified amount from the Law Firm Client Account to the specified payee bank account (vendor or operating account) within two (2) business days."),
  ]));
  out.push(bulletRuns([
    R("Step 5 — Zero Custody Preservation. ", { bold: true, color: P.goldDark }),
    R("AURIENTA never holds, touches, or controls any capital partner funds at any point in the fund flow. AURIENTA's role is strictly limited to matching, governance, runtime enforcement, and ledger publication."),
  ]));

  out.push(numberedClause("4.3",
    "Bankruptcy-Remote Status. The Charter's bankruptcy-remote provisions are hereby amended to provide that capital partner funds held in the Law Firm Client Account (a) are not part of the Law Firm's bankruptcy estate, (b) are not subject to set-off against Law Firm liabilities, (c) are not subject to attachment by Law Firm creditors, and (d) are traceable and recoverable by the Enterprise and its Capital Partners in the event of Law Firm insolvency, dissolution, or regulatory intervention — all by operation of Article 47 of the Lawyers' Code."
  ));
  out.push(numberedClause("4.4",
    "Multi-Firm Redundancy. The Charter's multi-firm redundancy provisions are preserved and adapted: each Enterprise shall, at formation, designate a primary Law Firm and at least one (1) backup Law Firm, each duly licensed under the Lawyers' Code. Constitutional Partners may, after the first twelve (12) months of operation, replace the Law Firm through the Charter's law-firm-replacement procedure (5% voting-power proposal, 14-day cooling period, 7-day voting period)."
  ));
  out.push(numberedClause("4.5",
    "Anti-Fragility Vault Contribution. The 0.5% Anti-Fragility Vault contribution mechanism is preserved. Such contribution shall be released from the Law Firm Client Account to the Anti-Fragility Vault (an AURIENTA-administered contingency reserve that does not constitute custody of capital partner funds, as it holds only platform-allocated reserves, not partner contributions) on a recurring schedule determined by the Charter."
  ));
  out.push(numberedClause("4.6",
    "Indefinite Segregated-Trust Protocol. The Charter's indefinite segregated-trust protocol for failed transfers and unclaimed dividends is preserved. Such funds shall be held in the Law Firm Client Account (or a successor Law Firm Client Account) indefinitely, with no right of reversion to the Law Firm."
  ));

  // ─── ARTICLE V — ANCILLARY AGREEMENTS ───
  out.push(...articleHeading("V", "ANCILLARY AGREEMENTS"));
  out.push(numberedClause("5.1",
    "Law Firm Escrow Waiver. The Constitutional Office shall, in coordination with each Law Firm and Enterprise, execute a Law Firm Escrow Waiver and Client Account Authorization in substantially the form approved by the Constitutional Office, memorializing the Law Firm's acceptance of direct transfer, the segregation duty, the Dual-Authorization Protocol, the bankruptcy-remote status, the insurance requirement, and the FRA license verification."
  ));
  out.push(numberedClause("5.2",
    "Certified Accountant Milestone Release Authorization. The Constitutional Office shall, in coordination with each Enterprise and Accounting Firm, execute a Certified Accountant Milestone Release Authorization in substantially the form approved by the Constitutional Office, memorializing the Accounting Firm's appointment as the final gate for milestone releases, the Evidence Verification methodology, the audit-trail requirements, the liability provisions, and the fee structure paid from the 2.5% Consulting Fee."
  ));
  out.push(numberedClause("5.3",
    "Consistency Requirement. The ancillary agreements referred to in this Article V shall be consistent with, and subordinate to, the Charter as amended by this Amendment. In the event of any conflict, the Charter shall control with respect to constitutional matters and the relevant ancillary agreement shall control with respect to operational matters."
  ));

  // ─── ARTICLE VI — LEGAL BASIS ───
  out.push(...articleHeading("VI", "LEGAL BASIS"));
  out.push(numberedClause("6.1",
    "Egyptian Lawyers' Code. This Amendment is grounded in, and operates under, Article 47 of the Egyptian Lawyers' Code (Law No. 17 of 1983), which expressly permits licensed lawyers to hold client funds in segregated client accounts, subject to the professional and fiduciary duties set forth in the Lawyers' Code and the Egyptian Bar Association by-laws."
  ));
  out.push(numberedClause("6.2",
    "Companies Law. This Amendment is consistent with Companies Law No. 159 of 1981, which governs the formation and governance of Egyptian limited-liability companies and joint-stock companies onboarded onto the AURIENTA platform."
  ));
  out.push(numberedClause("6.3",
    "FRA No-Action Letter. This Amendment is consistent with, and depends upon, the FRA No-Action Letter classifying AURIENTA as technology, governance, and matchmaking infrastructure (and not as a crowdfunding platform, broker, custodian, or financial intermediary). The Constitutional Office shall maintain the No-Action Letter in good standing, and shall promptly notify Constitutional Partners of any modification, withdrawal, or reconsideration by the FRA."
  ));
  out.push(numberedClause("6.4",
    "ESAA Framework. This Amendment relies upon the Egyptian Society of Accountants and Auditors (ESAA) framework for the certification, independence, and quality-control standards applicable to the Accounting Firm's Evidence Verification function."
  ));
  out.push(numberedClause("6.5",
    "No Conflict. The Constitutional Office has reviewed the Amendment against the Egyptian Lawyers' Code, Companies Law, the FRA No-Action Letter, and ESAA by-laws, and has determined that the Amendment does not conflict with any of them. Should any future Egyptian legislative or regulatory change cause a conflict, the Constitutional Office shall promptly propose a further constitutional amendment to restore compliance."
  ));

  // ─── ARTICLE VII — ZERO CUSTODY PRESERVATION ───
  out.push(...articleHeading("VII", "ZERO CUSTODY PRESERVATION"));
  out.push(numberedClause("7.1",
    "Non-Amendable Invariant. The Zero Custody rule — that AURIENTA never holds, touches, or controls any capital partner funds at any point in the fund flow — is hereby reaffirmed as a non-amendable constitutional invariant of the platform. Nothing in this Amendment, and nothing in any future amendment, shall be construed to impose any custodial, holding, or control obligation on AURIENTA."
  ));
  out.push(numberedClause("7.2",
    "Conformance. The Direct Law-Firm Transfer Model established by this Amendment is in conformance with the Zero Custody rule: capital flows from the Capital Partner directly to the Law Firm Client Account, is held by the Law Firm under Article 47 of the Lawyers' Code, and is released by the Law Firm upon dual authorization — without AURIENTA ever holding, touching, or controlling any capital partner funds."
  ));
  out.push(numberedClause("7.3",
    "Non-Amendable in Part. The direct-transfer requirement established by this Amendment is non-amendable and may not be reverted to an AURIENTA-held escrow model. The Constitutional Partners expressly waive their right to propose, vote upon, or adopt any future amendment that would restore a platform-held escrow, custody, or intermediary capital-handling construct. Any such proposed amendment shall be deemed facially unconstitutional and shall be rejected by the CRE without submission to a vote."
  ));
  out.push(numberedClause("7.4",
    "Limited Permitted Amendments. Notwithstanding Article VII.3, the Constitutional Partners retain the right to propose amendments that (a) refine the operational details of the Direct Law-Firm Transfer Model, (b) update references to Egyptian legislation as such legislation is amended, (c) add additional safeguards to the Dual-Authorization Protocol, or (d) adjust the fee allocation between the Law Firm, the Accounting Firm, and AURIENTA — provided that no such amendment shall cause AURIENTA to hold, touch, or control any capital partner funds."
  ));

  // ─── ARTICLE VIII — TRANSITION ───
  out.push(...articleHeading("VIII", "TRANSITION PROVISIONS"));
  out.push(numberedClause("8.1",
    "Effective Date. This Amendment shall become effective upon the date on which the 75% supermajority threshold is reached (the \"Effective Date\"). The CRE shall record the Effective Date and the final vote tally on the immutable ledger."
  ));
  out.push(numberedClause("8.2",
    "Existing Enterprises. Enterprises onboarded prior to the Effective Date shall transition to the Direct Law-Firm Transfer Model within ninety (90) days of the Effective Date. During the transition period, any capital partner funds held in a pre-existing escrow construct shall be transferred to a Law Firm Client Account in accordance with a transition plan approved by the Constitutional Office. No new capital partner contributions shall be accepted into a pre-existing escrow construct after the Effective Date."
  ));
  out.push(numberedClause("8.3",
    "Existing Agreements. Any law firm engagement, accounting firm engagement, or ancillary agreement in effect prior to the Effective Date shall be conformed to this Amendment within the 90-day transition period. The Constitutional Office shall publish a conformance checklist to the immutable ledger."
  ));
  out.push(numberedClause("8.4",
    "No Disruption. The transition shall not disrupt any Enterprise's operations, any pending milestone release, or any Capital Partner's rights. Pending milestone releases shall be completed under the prior architecture and any subsequent release shall follow the Direct Law-Firm Transfer Model."
  ));

  // ─── ARTICLE IX — RE-SIGNING OF THE CONSTITUTIONAL HASH ───
  out.push(...articleHeading("IX", "RE-SIGNING OF THE CONSTITUTIONAL HASH"));
  out.push(numberedClause("9.1",
    "Re-Signing. Upon the Effective Date, the Constitutional Office shall re-sign the constitutional hash to reflect the adoption of this Amendment. The new constitutional hash shall be " + AMENDMENT_IX_HASH + " (the \"Amendment Hash\")."
  ));
  out.push(numberedClause("9.2",
    "Signature Preservation. All prior signatures on the constitutional hash (the Root Hash " + CONSTITUTIONAL_HASH + ") shall be preserved on the immutable ledger and shall remain verifiable. The Amendment Hash shall incorporate, by cryptographic reference, the Root Hash and all prior amendments (I through VIII)."
  ));
  out.push(numberedClause("9.3",
    "CRE Re-Anchoring. The CRE shall be re-anchored to the Amendment Hash within twenty-four (24) hours of the Effective Date. All policy decisions issued by the CRE after re-anchoring shall bear the Amendment Hash as their constitutional reference."
  ));
  out.push(numberedClause("9.4",
    "Public Verification. The Amendment Hash, the full text of this Amendment, the final vote tally, and the signatures of all Constitutional Partners voting in favor shall be published to the immutable ledger and to a public verification endpoint. Any third party may verify the Amendment's adoption at any time."
  ));
  out.push(numberedClause("9.5",
    "No Retroactive Effect. The Amendment shall have no retroactive effect on prior constitutional decisions, ledger entries, or partner rights. All such prior acts shall remain valid and enforceable under the Charter as it existed at the time of the act."
  ));

  // ─── ARTICLE X — RATIFICATION ───
  out.push(...articleHeading("X", "RATIFICATION AND CERTIFICATION"));
  out.push(numberedClause("10.1",
    "Ratification. The Constitutional Partners, having voted in favor of this Amendment by the requisite 75% supermajority, hereby ratify this Amendment as a valid and binding part of the AURIENTA Constitutional Charter."
  ));
  out.push(numberedClause("10.2",
    "Certification. The Constitutional Office hereby certifies that the procedures set forth in Article V of the Charter — including the 90-day cooling period, the 14-day voting period, the 75% supermajority threshold, and the real-time CRE vote-tallying — have been observed in the adoption of this Amendment."
  ));
  out.push(numberedClause("10.3",
    "Publication. This Amendment, in its full text, together with the final vote tally and the Amendment Hash, shall be published to the immutable ledger and made publicly accessible at the AURIENTA Constitutional Office."
  ));

  // ─── Signature page ───
  out.push(sectionDivider());
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 },
    children: [new TextRun({ text: "CERTIFICATION PAGE", bold: true, size: 26, color: c(P.primary),
      characterSpacing: 60, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  }));
  out.push(body(
    "IN WITNESS WHEREOF, the Constitutional Office, on behalf of the Constitutional Partners of AURIENTA, has certified the adoption of this Amendment IX to the Constitutional Charter in accordance with Article V of the Charter.",
    { after: 320, noIndent: true }
  ));
  out.push(signatureBlock([
    { label: "AURIENTA CONSTITUTIONAL OFFICE", name: "Layla Mostafa", title: "Constitutional Officer", license: "AURIENTA Representative", witness: true },
    { label: "CRE SIGNATORY NODE", name: "[CRE Node Identifier]", title: "CRE Witness", license: "Hash-Anchored", witness: false },
    { label: "CONSTITUTIONAL PARTNERS", name: "[Tally Witness]", title: "75% Supermajority", license: "Ledger-Recorded", witness: false },
  ]));

  // ─── Appendices / Schedules table ───
  out.push(spacer(240));
  out.push(h3("APPENDIX A — DEFINITIONAL CROSSWALK"));
  out.push(body(
    "The following table crosswalks the pre-Amendment and post-Amendment terminology. Where the Charter (prior to this Amendment) used the term in the left column, the Charter (as amended by this Amendment) shall use the term in the right column, with corresponding grammatical adjustments:"
  ));
  out.push(makeTable(
    ["Pre-Amendment Term", "Post-Amendment Term"],
    [
      ["Constitutional Escrow Vault", "Law Firm Client Account"],
      ["Escrow Vault", "Law Firm Client Account"],
      ["The Vault", "The Law Firm Client Account"],
      ["Constitutional Escrow", "Law Firm Client Account"],
      ["Platform-managed escrow", "Law Firm-held Client Account"],
      ["Escrow agent", "Law Firm (under Article 47 of the Lawyers' Code)"],
      ["Escrow account", "Law Firm Client Account"],
      ["Escrow fee", "Law Firm administrative fee (Article VI.2 of the Law Firm Escrow Waiver)"],
      ["Escrow agent replacement", "Law Firm replacement (Charter §4.9)"],
    ],
    [50, 50],
  ));

  out.push(spacer(240));
  out.push(h3("APPENDIX B — LEGAL AUTHORITIES"));
  out.push(bullet("Egyptian Lawyers' Code — Law No. 17 of 1983, Article 47 (segregated client accounts)."));
  out.push(bullet("Companies Law — Law No. 159 of 1981 (formation and governance of LLCs and JSCs)."));
  out.push(bullet("FRA No-Action Letter — classification of AURIENTA as technology, governance, and matchmaking infrastructure."));
  out.push(bullet("ESAA By-Laws — Egyptian Society of Accountants and Auditors, certification, independence, and quality-control standards."));
  out.push(bullet("Egyptian AML Law — Law No. 80 of 2002 (source-of-funds verification, sanctions screening)."));
  out.push(bullet("Egyptian Civil Code — general contract and liability principles."));

  out.push(spacer(360));
  out.push(hashBanner(CONSTITUTIONAL_HASH, "AURIENTA CONSTITUTIONAL HASH (ROOT)"));
  out.push(spacer(120));
  out.push(hashBanner(AMENDMENT_IX_HASH, "AMENDMENT IX HASH (POST-PASSAGE)"));
  out.push(spacer(120));
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 0 },
    children: [new TextRun({
      text: "— End of Amendment IX —", size: 16, italics: true, color: c(P.secondary),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));
  return out;
}

// ─────────────────────────────────────────────────────────────────
// ASSEMBLE + PACK EACH DOCUMENT
// ─────────────────────────────────────────────────────────────────
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };
const coverMargin = { top: 0, bottom: 0, left: 0, right: 0 };

function makeDoc({ title, description, headerLabel, cover, bodyBuilder }) {
  return new Document({
    creator: "AURIENTA Constitutional Office",
    title,
    description,
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
          run: { bold: true, size: 26, color: c(P.primary),
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
      // Cover
      {
        properties: { page: { size: pgSize, margin: coverMargin } },
        children: buildCover(cover),
      },
      // Body — page numbers from 1, decimal
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: pgSize, margin: pgMargin,
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: { default: pageHeader(headerLabel) },
        footers: { default: pageNumFooter(headerLabel) },
        children: bodyBuilder(),
      },
    ],
  });
}

const docs = [
  {
    outPath: "/home/z/my-project/download/AURIENTA_Law_Firm_Escrow_Waiver.docx",
    title: "AURIENTA Law Firm Escrow Waiver",
    description: "Law Firm Escrow Waiver & Client Account Authorization — Direct Law-Firm Transfer Model under Amendment IX",
    headerLabel: "Law Firm Escrow Waiver · Amendment IX",
    cover: {
      eyebrow: "C O N S T I T U T I O N A L   I N S T R U M E N T   ·   I",
      title: "Law Firm Escrow Waiver",
      subtitle: "& Client Account Authorization",
      meta: [
        "Direct Law-Firm Transfer Model",
        "Pursuant to Amendment IX to the Constitutional Charter",
        "",
        "Egyptian Lawyers' Code (Law 17/1983, Art. 47)",
        "Companies Law 159/1981  ·  FRA No-Action Letter",
        "",
        `Constitutional Hash:  ${CONSTITUTIONAL_HASH}`,
      ],
      docCode: "DOC-LF-001",
      docVersion: "v1.0  ·  Constitutional Office",
    },
    bodyBuilder: buildLawFirmWaiverBody,
  },
  {
    outPath: "/home/z/my-project/download/AURIENTA_Milestone_Release_Authorization.docx",
    title: "AURIENTA Milestone Release Authorization",
    description: "Certified Accountant Milestone Release Authorization — Evidence Verification & Co-Authorization Protocol under Amendment IX",
    headerLabel: "Milestone Release Authorization · Amendment IX",
    cover: {
      eyebrow: "C O N S T I T U T I O N A L   I N S T R U M E N T   ·   II",
      title: "Certified Accountant",
      subtitle: "Milestone Release Authorization",
      meta: [
        "Evidence Verification & Co-Authorization Protocol",
        "Pursuant to Amendment IX to the Constitutional Charter",
        "",
        "ESAA Compliance  ·  Egyptian Society of Accountants and Auditors",
        "Final Gate for Milestone Fund Releases",
        "",
        `Constitutional Hash:  ${CONSTITUTIONAL_HASH}`,
      ],
      docCode: "DOC-AC-002",
      docVersion: "v1.0  ·  Constitutional Office",
    },
    bodyBuilder: buildMilestoneReleaseBody,
  },
  {
    outPath: "/home/z/my-project/download/AURIENTA_Constitutional_Amendment_IX.docx",
    title: "AURIENTA Constitutional Amendment IX",
    description: "Constitutional Amendment IX — Direct Law-Firm Transfer Model. A formal amendment to the AURIENTA Constitutional Charter.",
    headerLabel: "Constitutional Amendment IX",
    cover: {
      eyebrow: "C O N S T I T U T I O N A L   A M E N D M E N T   ·   I X",
      title: "Amendment IX",
      subtitle: "Direct Law-Firm Transfer Model",
      meta: [
        "A Formal Amendment to the Constitutional Charter",
        "Pursuant to Article V of the Charter",
        "",
        "75% Supermajority  ·  90-Day Cooling  ·  14-Day Voting",
        "Non-Amendable: Direct-Transfer Requirement",
        "",
        `Root Hash:  ${CONSTITUTIONAL_HASH}`,
        `Amendment Hash:  ${AMENDMENT_IX_HASH}`,
      ],
      docCode: "DOC-AM-009",
      docVersion: "v1.0  ·  Constitutional Office",
    },
    bodyBuilder: buildAmendmentIXBody,
  },
];

(async () => {
  for (const spec of docs) {
    try {
      const doc = makeDoc(spec);
      const buf = await Packer.toBuffer(doc);
      fs.writeFileSync(spec.outPath, buf);
      console.log(`✅  Written: ${spec.outPath}`);
      console.log(`    Size:    ${buf.length} bytes (${(buf.length / 1024).toFixed(1)} KB)`);
      console.log(`    Title:   ${spec.title}`);
      console.log("");
    } catch (err) {
      console.error(`❌  Failed to generate ${spec.outPath}:`, err);
      process.exitCode = 1;
    }
  }
  console.log("── Generation complete ──");
})();
