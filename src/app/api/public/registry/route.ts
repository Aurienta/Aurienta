import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/public/registry
 * Public Constitutional Registry — PDPL-compliant enterprise-level data only.
 *
 * Query params:
 *   q     — full-text search over name/tagline/sector
 *   tier  — filter by tier (A,B,C,D,E,F)
 *   sector — filter by sector
 *   status — filter by status (active, frozen, graduated, fundraising_active, ...)
 *   limit — page size (default 50, max 200)
 *   cursor — opaque pagination cursor (createdAt)
 *
 * NO personal data is returned. Partner counts are COUNTS ONLY.
 * Law firm + accounting firm names are returned (institutions, not personal data).
 *
 * Legal basis: Egyptian PDPL Law 151/2020 permits publication of enterprise-
 * level financial & governance data with the enterprise's constitutional
 * consent (Article XIV of the constitutional charter).
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const tier = (url.searchParams.get("tier") ?? "").trim().toUpperCase();
  const sector = (url.searchParams.get("sector") ?? "").trim().toLowerCase();
  const status = (url.searchParams.get("status") ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1), 200);
  const cursorCreatedAt = url.searchParams.get("cursor")
    ? new Date(url.searchParams.get("cursor") as string)
    : null;

  // Build the where clause — only public, non-draft enterprises.
  const where: Record<string, unknown> = {
    status: { notIn: ["draft"] },
  };

  if (tier && /^[A-F]$/.test(tier)) {
    where.tier = tier;
  }
  if (sector) {
    where.sector = { contains: sector };
  }
  if (status) {
    where.status = status;
  }
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { tagline: { contains: q } },
      { description: { contains: q } },
      { sector: { contains: q } },
    ];
  }

  // Cursor-based pagination on createdAt.
  if (cursorCreatedAt && !Number.isNaN(cursorCreatedAt.getTime())) {
    where.createdAt = { lt: cursorCreatedAt };
  }

  const enterprises = await db.enterprise.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1, // fetch one extra to know if there's a next page
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      sector: true,
      tier: true,
      stage: true,
      legalForm: true,
      healthRating: true,
      healthScore: true,
      fundraisingGoalEgp: true,
      raisedEgp: true,
      equityUnitPriceEgp: true,
      totalEquityUnits: true,
      employeeCount: true,
      nosiCompliantPct: true,
      policeClearanceValid: true,
      graduationReadiness: true,
      transparencyScore: true,
      status: true,
      createdAt: true,
      lawFirm: { select: { name: true, frLicenseNumber: true } },
      accountingFirm: { select: { name: true, esaaLicense: true } },
      _count: {
        select: {
          ownershipRecords: true,
          employees: true,
        },
      },
    },
  });

  const hasMore = enterprises.length > limit;
  const items = enterprises.slice(0, limit).map((e) => ({
    slug: e.slug,
    name: e.name,
    tagline: e.tagline,
    sector: e.sector,
    tier: e.tier,
    stage: e.stage,
    legalForm: e.legalForm,
    healthRating: e.healthRating,
    healthScore: e.healthScore,
    fundraisingGoalEgp: e.fundraisingGoalEgp,
    raisedEgp: e.raisedEgp,
    equityUnitPriceEgp: e.equityUnitPriceEgp,
    totalEquityUnits: e.totalEquityUnits,
    partnerCount: e._count.ownershipRecords,
    employeeCount: e.employeeCount,
    nosiCompliantPct: e.nosiCompliantPct,
    policeClearanceValid: e.policeClearanceValid,
    graduationReadiness: e.graduationReadiness,
    transparencyScore: e.transparencyScore,
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    lawFirm: e.lawFirm
      ? { name: e.lawFirm.name, license: e.lawFirm.frLicenseNumber }
      : null,
    accountingFirm: e.accountingFirm
      ? { name: e.accountingFirm.name, esaaLicense: e.accountingFirm.esaaLicense }
      : null,
  }));

  const body = {
    enterprises: items,
    pagination: {
      count: items.length,
      hasMore,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1].createdAt : null,
      limit,
    },
    filters: { q, tier, sector, status },
    constitutionalHash: CONSTITUTIONAL_HASH,
    legalNotice:
      "Personal data is protected under Egyptian PDPL Law 151/2020. Enterprise data is published per constitutional charter Article XIV.",
    disclaimer:
      "AURIENTA is a constitutional constitutional infrastructure, not an official government registry. Data is self-reported by enterprises and verified by the CRE.",
    fetchedAt: new Date().toISOString(),
  };

  const res = NextResponse.json(body);
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Aurienta-Constitutional-Api", "v1");
  res.headers.set("X-Aurienta-PDPL-Compliant", "151/2020");
  return res;
}, "GET /api/public/registry");
