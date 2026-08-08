import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/aurienta/logger";
import { Prisma } from "@prisma/client";

// GET /api/admin/enterprises
// AURIENTA Rep — list enterprises with filters + summary.
// Query params: search, tier, stage, status, sector, page, pageSize
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole("aurienta_rep");

    const url = req.nextUrl;
    const search = url.searchParams.get("search")?.trim() ?? "";
    const tier = url.searchParams.get("tier")?.trim() ?? "";
    const stage = url.searchParams.get("stage")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const sector = url.searchParams.get("sector")?.trim() ?? "";

    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "25", 10) || 25)
    );

    // Build the where clause.
    const where: Prisma.EnterpriseWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ];
    }
    if (tier) where.tier = tier;
    if (stage) where.stage = stage;
    if (status) where.status = status;
    if (sector) where.sector = sector;

    const [rows, total, byTierAgg, byStageAgg, byStatusAgg, totalEnterprises] = await Promise.all([
      db.enterprise.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          stage: true,
          status: true,
          sector: true,
          healthRating: true,
          healthScore: true,
          raisedEgp: true,
          fundraisingGoalEgp: true,
          lawFirmClientAccountBalanceEgp: true,
          employeeCount: true,
          nosiCompliantPct: true,
          graduationReadiness: true,
          frozenAt: true,
          createdAt: true,
          founder: { select: { id: true, legalName: true } },
          lawFirm: { select: { id: true, name: true } },
          accountingFirm: { select: { id: true, name: true } },
          _count: {
            select: {
              members: true,
              ownershipRecords: true,
              ledgerEvents: true,
            },
          },
        },
      }),
      db.enterprise.count({ where }),
      db.enterprise.groupBy({ by: ["tier"], _count: { _all: true } }),
      db.enterprise.groupBy({ by: ["stage"], _count: { _all: true } }),
      db.enterprise.groupBy({ by: ["status"], _count: { _all: true } }),
      db.enterprise.count(),
    ]);

    // Normalize groupBy buckets into plain maps for the client.
    const byTier: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    for (const r of byTierAgg) byTier[r.tier] = (byTier[r.tier] ?? 0) + r._count._all;
    const byStage: Record<string, number> = {};
    for (const r of byStageAgg) byStage[r.stage] = r._count._all;
    const byStatus: Record<string, number> = {};
    for (const r of byStatusAgg) byStatus[r.status] = r._count._all;

    return NextResponse.json({
      ok: true,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      enterprises: rows,
      summary: {
        totalEnterprises,
        byTier,
        byStage,
        byStatus,
      },
      actor: { id: user.id, legalName: user.legalName },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[GET /api/admin/enterprises] error:", { err: msg });
    if (msg === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated", code: "UNAUTHORIZED" }, { status: 401 });
    }
    if (msg.startsWith("Forbidden:")) {
      return NextResponse.json({ error: msg, code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to list enterprises.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
