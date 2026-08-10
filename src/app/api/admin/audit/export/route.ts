import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/aurienta/logger";
import { Prisma } from "@prisma/client";
import { audit as writeAudit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/audit/export
 * AURIENTA Rep — export the matching audit log slice as a CSV download.
 *
 * Same query params as /api/admin/audit (actor, action, result, target,
 * from, to, search). Ignores page/pageSize — exports the full matching set,
 * capped at EXPORT_CAP rows to keep the response bounded.
 *
 * Columns (in order):
 *   timestamp, actorId, actorName, action, target, result, reason, ip
 */
const EXPORT_CAP = 10_000;

function csvCell(value: string | null | undefined): string {
  // RFC 4180 — quote any cell that contains a comma, quote, newline, or CR.
  const v = value ?? "";
  if (/[",\r\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export async function GET(req: NextRequest) {
  let user: Awaited<ReturnType<typeof requireRole>>;
  try {
    user = await requireRole("aurienta_rep");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Not authenticated") {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: msg, code: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const url = req.nextUrl;
    const actor = url.searchParams.get("actor")?.trim() ?? "";
    const action = url.searchParams.get("action")?.trim() ?? "";
    const result = url.searchParams.get("result")?.trim() ?? "";
    const target = url.searchParams.get("target")?.trim() ?? "";
    const from = url.searchParams.get("from")?.trim() ?? "";
    const to = url.searchParams.get("to")?.trim() ?? "";
    const search = url.searchParams.get("search")?.trim() ?? "";

    // ── Build the same where clause as the list endpoint ──
    const where: Prisma.AuditLogWhereInput = {};

    if (actor) where.actorId = actor;
    if (action) where.action = action;
    if (result === "allowed" || result === "denied") where.result = result;
    if (target) where.target = { contains: target };

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { target: { contains: search } },
        { reason: { contains: search } },
      ];
    }

    const tsRange: Prisma.DateTimeFilter = {};
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) tsRange.gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!isNaN(d.getTime())) tsRange.lte = d;
    }
    if (Object.keys(tsRange).length > 0) where.timestamp = tsRange;

    const rows = await db.auditLog.findMany({
      where,
      take: EXPORT_CAP,
      orderBy: { timestamp: "desc" },
      select: {
        id: true,
        actorId: true,
        action: true,
        target: true,
        result: true,
        reason: true,
        ip: true,
        timestamp: true,
        actor: { select: { legalName: true, email: true } },
      },
    });

    // ── Compose CSV ──
    const header = [
      "timestamp",
      "actorId",
      "actorName",
      "action",
      "target",
      "result",
      "reason",
      "ip",
    ];
    const lines: string[] = [header.map(csvCell).join(",")];

    for (const r of rows) {
      lines.push(
        [
          new Date(r.timestamp).toISOString(),
          r.actorId ?? "",
          r.actor?.legalName ?? "",
          r.action,
          r.target ?? "",
          r.result,
          r.reason ?? "",
          r.ip ?? "",
        ]
          .map(csvCell)
          .join(",")
      );
    }

    const csv = lines.join("\r\n");

    // Auditing the auditor — exporting the log is itself audited.
    await writeAudit({
      actorId: user.id,
      action: "admin.audit.export",
      target: "audit_log",
      result: "allowed",
      reason: `exported ${rows.length} rows`,
      metadata: {
        filters: { actor, action, result, target, from, to, search },
        rowCount: rows.length,
        cap: EXPORT_CAP,
        truncated: rows.length >= EXPORT_CAP,
      },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    }).catch(() => {});

    const filename = `aurienta-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "X-Aurienta-Export-Rows": String(rows.length),
        "X-Aurienta-Export-Truncated": String(rows.length >= EXPORT_CAP),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[GET /api/admin/audit/export] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to export audit log.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
