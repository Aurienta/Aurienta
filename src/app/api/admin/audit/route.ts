import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/aurienta/logger";
import { Prisma } from "@prisma/client";
import { audit as writeAudit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/audit
 * AURIENTA Rep — searchable, paginated audit log.
 *
 * Query params:
 *  - actor    : filter by AuditLog.actorId (exact match)
 *  - action   : filter by AuditLog.action (exact match, e.g. "auth.signin")
 *  - result   : filter by AuditLog.result ("allowed" | "denied")
 *  - target   : filter by AuditLog.target (substring match)
 *  - from     : ISO date — timestamp >= from
 *  - to       : ISO date — timestamp <= to
 *  - search   : substring across action + target + reason (OR / contains)
 *  - page     : 1-based page index (default 1)
 *  - pageSize : entries per page (default 50, max 200)
 *
 * Response:
 *  - rows[]           : paginated audit entries (incl. actor.legalName)
 *  - total, page, pageSize, totalPages
 *  - summary.totalEntries
 *  - summary.byResult  { allowed, denied }
 *  - summary.byAction  : top 10 actions by count (over the SAME filter window)
 *  - summary.deniedCount (over the SAME filter window)
 */
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

    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      200,
      Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "50", 10) || 50)
    );

    // ── Build the where clause ──
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

    // ── Parallel: page rows + counts + summaries ──
    const [
      rows,
      total,
      byResultAgg,
      byActionAgg,
      deniedCount,
    ] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { timestamp: "desc" },
        select: {
          id: true,
          actorId: true,
          action: true,
          target: true,
          result: true,
          reason: true,
          ip: true,
          userAgent: true,
          timestamp: true,
          actor: { select: { id: true, legalName: true, email: true } },
        },
      }),
      db.auditLog.count({ where }),
      db.auditLog.groupBy({
        by: ["result"],
        _count: { _all: true },
        where,
      }),
      db.auditLog.groupBy({
        by: ["action"],
        _count: { _all: true },
        where,
        orderBy: { _count: { action: "desc" } },
        take: 10,
      }),
      db.auditLog.count({ where: { ...where, result: "denied" } }),
    ]);

    // Normalize result buckets.
    const byResult: Record<string, number> = { allowed: 0, denied: 0 };
    for (const r of byResultAgg) {
      if (r.result === "allowed" || r.result === "denied") {
        byResult[r.result] = r._count._all;
      } else {
        // bucket any non-canonical result under "denied" for safety.
        byResult.denied += r._count._all;
      }
    }
    const byAction = byActionAgg.map((r) => ({ action: r.action, count: r._count._all }));

    // Auditing the auditor — Steward viewing the log is itself an audit event.
    await writeAudit({
      actorId: user.id,
      action: "admin.audit.view",
      target: "audit_log",
      result: "allowed",
      reason: `page=${page} pageSize=${pageSize} total=${total}`,
      metadata: {
        filters: { actor, action, result, target, from, to, search },
        summary: { total, deniedCount, allowedCount: byResult.allowed },
      },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: req.headers.get("user-agent") ?? null,
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      entries: rows,
      summary: {
        totalEntries: total,
        byResult,
        byAction,
        deniedCount,
      },
      actor: { id: user.id, legalName: user.legalName },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[GET /api/admin/audit] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to query audit log.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
