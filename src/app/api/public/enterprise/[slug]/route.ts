import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/public/enterprise/[slug]
 * Open Constitutional API — public enterprise profile JSON.
 * CORS-enabled for cross-origin embedding.  No auth required.
 */
export const GET = withErrorHandler(async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const { params } = ctx;
  const { slug } = await params;
  const ent = await db.enterprise.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      description: true,
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
      founderEquityPct: true,
      lawFirmClientAccountBalanceEgp: true,
      monthlyBurnEgp: true,
      monthlyRevenueEgp: true,
      grossMarginPct: true,
      revenueGrowthPct: true,
      employeeCount: true,
      nosiCompliantPct: true,
      policeClearanceValid: true,
      status: true,
      graduationReadiness: true,
      createdAt: true,
      lawFirm: { select: { name: true, frLicenseNumber: true } },
      accountingFirm: { select: { name: true, esaaLicense: true } },
      _count: { select: { ownershipRecords: true, employees: true, ledgerEvents: true } },
    },
  });

  if (!ent) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const runway = ent.monthlyBurnEgp > 0 ? ent.lawFirmClientAccountBalanceEgp / ent.monthlyBurnEgp : null;

  const body = {
    ...ent,
    escrow: {
      balanceEgp: ent.lawFirmClientAccountBalanceEgp,
      monthlyBurnEgp: ent.monthlyBurnEgp,
      runwayMonths: runway ? Math.round(runway * 10) / 10 : null,
    },
    counts: ent._count,
    _count: undefined,
    zero_custody: true, // Constitutional Infrastructure-wide rule
    cre_online: true,
    constitutional_hash: "0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A",
    fetched_at: new Date().toISOString(),
  };

  const res = NextResponse.json(body);
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Aurienta-Constitutional-Api", "v1");
  return res;
}, "GET /api/public/enterprise/[slug]");
