// AURIENTA Blueprint generator — formatting helpers.
// Centralizes Paragraph / Heading / Table builders used by the main script.
import {
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
} from "docx";

// ── Color palette ──
export const GOLD = "D4AF37";
export const DARK_GOLD = "B8860B";
export const NEAR_BLACK = "1A1A1A";
export const GRAY_TEXT = "555555";
export const LIGHT_GRAY_FILL = "F4F1E8";
export const HEADER_FILL = "D4AF37";
export const SUBTLE_FILL = "FAF7EE";

// ── Body paragraph (1.3x line spacing = 312 twips) ──
export function P(text: string | string[], opts: { bold?: boolean; italic?: boolean; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; size?: number; spacing?: number } = {}): Paragraph {
  const runs = Array.isArray(text) ? text : [text];
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { line: opts.spacing ?? 312, after: 120 },
    children: runs.map(
      (t) =>
        new TextRun({
          text: t,
          bold: opts.bold,
          italics: opts.italic,
          color: opts.color,
          size: opts.size ?? 22, // half-points; 22 = 11pt
        })
    ),
  });
}

// Bold lead-in paragraph: "**Label:** body text" style
export function PLead(label: string, body: string, opts: { color?: string } = {}): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 120 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, color: opts.color ?? NEAR_BLACK, size: 22 }),
      new TextRun({ text: body, size: 22 }),
    ],
  });
}

export function H1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    spacing: { before: 360, after: 240, line: 312 },
    children: [new TextRun({ text, bold: true, color: NEAR_BLACK, size: 36 })],
  });
}

export function H2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 180, line: 312 },
    children: [new TextRun({ text, bold: true, color: DARK_GOLD, size: 30 })],
  });
}

export function H3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 140, line: 312 },
    children: [new TextRun({ text, bold: true, color: NEAR_BLACK, size: 26 })],
  });
}

export function H4(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_4,
    spacing: { before: 200, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, color: NEAR_BLACK, size: 24 })],
  });
}

// Bullet item (uses bullet style built-in to docx via "ListBullet")
export function Bullet(text: string, opts: { bold?: boolean } = {}): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, bold: opts.bold, size: 22 })],
  });
}

export function Numbered(text: string): Paragraph {
  return new Paragraph({
    numbering: { reference: "bp-numbering", level: 0 },
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 22 })],
  });
}

export function Quote(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, before: 160, after: 160 },
    indent: { left: 720, right: 720 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 18, color: GOLD, space: 12 },
    },
    children: [new TextRun({ text, italics: true, color: NEAR_BLACK, size: 22 })],
  });
}

export function PageBreakParagraph(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

export function HorizontalRule(): Paragraph {
  return new Paragraph({
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 4 },
    },
    spacing: { before: 120, after: 120 },
  });
}

// ── Table cell builders ──
function cellText(text: string, opts: { bold?: boolean; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; size?: number } = {}): TextRun[] {
  const value = text === "" || text === null || text === undefined ? "—" : String(text);
  return [
    new TextRun({
      text: value,
      bold: opts.bold,
      color: opts.color,
      size: opts.size ?? 18, // 9pt for tables
    }),
  ];
}

export function HeaderCell(text: string, widthPct?: number): TableCell {
  return new TableCell({
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    shading: { type: ShadingType.CLEAR, color: "auto", fill: HEADER_FILL },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 240, after: 0 },
        children: cellText(text, { bold: true, color: "FFFFFF" }),
      }),
    ],
  });
}

export function BodyCell(text: string, opts: { bold?: boolean; fill?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; widthPct?: number } = {}): TableCell {
  return new TableCell({
    width: opts.widthPct ? { size: opts.widthPct, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.fill ? { type: ShadingType.CLEAR, color: "auto", fill: opts.fill } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        spacing: { line: 260, after: 0 },
        children: cellText(text, { bold: opts.bold }),
      }),
    ],
  });
}

// Multi-line cell where the value is an array of strings (each becomes its own paragraph)
export function MultiCell(lines: string[], opts: { bold?: boolean; fill?: string; widthPct?: number } = {}): TableCell {
  return new TableCell({
    width: opts.widthPct ? { size: opts.widthPct, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.fill ? { type: ShadingType.CLEAR, color: "auto", fill: opts.fill } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: lines.map(
      (line) =>
        new Paragraph({
          spacing: { line: 240, after: 40 },
          children: cellText(line, { bold: opts.bold }),
        })
    ),
  });
}

// Build a simple table from headers + rows of strings (or string arrays for multi-line cells)
export function makeTable(
  headers: string[],
  rows: (string | string[])[],
  opts: { widths?: number[]; zebra?: boolean } = {}
): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) => HeaderCell(h, opts.widths?.[i])),
  });

  const bodyRows = rows.map(
    (row, rIdx) =>
      new TableRow({
        cantSplit: true,
        children: row.map((cell, cIdx) => {
          const fill = opts.zebra && rIdx % 2 === 1 ? SUBTLE_FILL : undefined;
          const widthPct = opts.widths?.[cIdx];
          if (Array.isArray(cell)) {
            return MultiCell(cell, { fill, widthPct });
          }
          return BodyCell(cell, { fill, widthPct });
        }),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: GOLD },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD },
      left: { style: BorderStyle.SINGLE, size: 4, color: GOLD },
      right: { style: BorderStyle.SINGLE, size: 4, color: GOLD },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "C9A03D" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "C9A03D" },
    },
  });
}

// Convert any value to a string for table cell rendering
export function cell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

// Convert an array of records to a table given a list of [header, accessor] pairs.
// Defensive: undefined/null/empty records produce an empty-state table.
export function recordsTable<T>(
  records: T[] | undefined | null,
  columns: [string, (r: T) => string | string[]][],
  opts: { widths?: number[]; zebra?: boolean } = {}
): Table {
  if (!records || !Array.isArray(records) || records.length === 0) {
    return makeTable(
      columns.map((c) => c[0]),
      [["— No data —", ...columns.slice(1).map(() => "—")]],
      opts
    );
  }
  const headers = columns.map((c) => c[0]);
  const rows = records.map((r) =>
    columns.map((c) => {
      try {
        return c[1](r);
      } catch (e) {
        return "—";
      }
    })
  );
  return makeTable(headers, rows, opts);
}

// Generic object-to-key-value-table: renders any object's entries as a 2-column table.
// Recursively flattens nested objects.
export function kvTable(
  obj: Record<string, unknown> | undefined | null,
  opts: { widths?: number[]; zebra?: boolean; keyHeader?: string; valueHeader?: string } = {}
): Table {
  if (!obj || typeof obj !== "object") {
    return makeTable(
      [opts.keyHeader ?? "Field", opts.valueHeader ?? "Detail"],
      [["—", "—"]],
      opts
    );
  }
  const rows: (string | string[])[][] = [];
  for (const [k, v] of Object.entries(obj)) {
    const label = k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
    if (Array.isArray(v)) {
      rows.push([label, v.length ? v.map((x) => typeof x === "string" ? x : JSON.stringify(x)) : "—"]);
    } else if (v !== null && typeof v === "object") {
      // Flatten one level deep
      const sub = Object.entries(v as Record<string, unknown>)
        .map(([kk, vv]) => `${kk}: ${cell(vv)}`)
        .join("\n");
      rows.push([label, sub]);
    } else {
      rows.push([label, cell(v)]);
    }
  }
  return makeTable(
    [opts.keyHeader ?? "Field", opts.valueHeader ?? "Detail"],
    rows,
    opts
  );
}
