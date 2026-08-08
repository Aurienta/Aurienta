import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/aurienta/logger";

/**
 * GET /api/admin/users
 * — AURIENTA Rep only (RBAC via requireRole("aurienta_rep")).
 *
 * Query params:
 *   search            — substring match on legalName / email / mobile
 *   role              — filter by EnterpriseMember.role
 *   verificationLevel — L0 | L1 | L2 | L3 | L4
 *   tier              — sovereign-trust tier (Constitutional Pillar, Ecosystem Builder, ...)
 *   page              — 1-based page index (default 1)
 *   pageSize          — page size, capped at 100 (default 25)
 *
 * Returns:
 *   {
 *     users: UserRow[],          // paginated
 *     summary: {
 *       totalUsers: number,      // global count (NOT filtered)
 *       totalMatching: number,   // count matching the filter
 *       byVerificationLevel: { L0, L1, L2, L3, L4 },  // global counts
 *       byTier: Record<string, number>,               // global counts
 *       page, pageSize, totalPages
 *     }
 *   }
 */
export async function GET(req: NextRequest) {
  try {
    const actor = await requireRole("aurienta_rep");

    const url = new URL(req.url);
    const sp = url.searchParams;

    const search = (sp.get("search") ?? "").trim();
    const role = sp.get("role")?.trim() || null;
    const verificationLevel =
      sp.get("verificationLevel")?.trim() || null;
    const tier = sp.get("tier")?.trim() || null;

    const page = Math.max(1, Number(sp.get("page") ?? "1") || 1);
    const pageSizeRaw = Number(sp.get("pageSize") ?? "25") || 25;
    const pageSize = Math.min(100, Math.max(1, pageSizeRaw));

    // ── Build the Prisma `where` filter ──
    type Clause =
      | { OR: ({ legalName: { contains: string } } | { email: { contains: string } } | { mobile: { contains: string } })[] }
      | { verificationLevel: string }
      | { tier: string }
      | { memberships: { some: { role: string } } };
    const where: { AND: Clause[] } = { AND: [] };

    if (search) {
      where.AND.push({
        OR: [
          { legalName: { contains: search } },
          { email: { contains: search } },
          { mobile: { contains: search } },
        ],
      });
    }
    if (verificationLevel) {
      where.AND.push({ verificationLevel });
    }
    if (tier) {
      where.AND.push({ tier });
    }
    if (role) {
      where.AND.push({ memberships: { some: { role } } });
    }

    // ── Run the user query and the global summary in parallel ──
    const [users, totalMatching, globalByLevel, globalByTier, totalUsers] =
      await Promise.all([
        db.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            mobile: true,
            legalName: true,
            verificationLevel: true,
            sovereignTrustScore: true,
            tier: true,
            primaryIntent: true,
            mfaEnabled: true,
            policeClearanceValid: true,
            policeClearanceExpiresAt: true,
            pledgeSignedAt: true,
            avatarColor: true,
            createdAt: true,
            _count: {
              select: {
                memberships: true,
                sessions: true,
                ownershipRecords: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.user.count({ where }),
        db.user.groupBy({
          by: ["verificationLevel"],
          _count: { _all: true },
        }),
        db.user.groupBy({
          by: ["tier"],
          _count: { _all: true },
        }),
        db.user.count(),
      ]);

    // Reshape the group-by results into plain dictionaries.
    const byVerificationLevel: Record<string, number> = {
      L0: 0,
      L1: 0,
      L2: 0,
      L3: 0,
      L4: 0,
    };
    for (const row of globalByLevel) {
      byVerificationLevel[row.verificationLevel] = row._count._all;
    }

    const byTier: Record<string, number> = {};
    for (const row of globalByTier) {
      byTier[row.tier] = row._count._all;
    }

    return NextResponse.json({
      users,
      summary: {
        totalUsers,
        totalMatching,
        byVerificationLevel,
        byTier,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalMatching / pageSize)),
      },
      actor: { id: actor.id, legalName: actor.legalName },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Not authenticated")) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    if (msg.includes("Forbidden")) {
      return NextResponse.json(
        { error: "Forbidden: requires aurienta_rep", code: "FORBIDDEN" },
        { status: 403 }
      );
    }
    logger.error("[GET /api/admin/users] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to load users.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
