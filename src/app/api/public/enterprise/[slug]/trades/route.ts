import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/public/enterprise/[slug]/trades
 *
 * Public, PDPL-compliant secondary-market trade log. Returns filled
 * trade orders for this enterprise. Partner references are ANONYMIZED
 * as "Partner #NNNN" (sequential index per enterprise) — never the
 * real user ID or personal name.
 *
 * CRE price-band verification result is included (the constitutional
 * rule: ±5% price band).
 *
 * Legal basis: market transparency (Article XIV); aggregate activity
 * is published, personal identities are masked.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1), 200);
  const cursorTs = url.searchParams.get("cursor")
    ? new Date(url.searchParams.get("cursor") as string)
    : null;

  const ent = await db.enterprise.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, equityUnitPriceEgp: true },
  });
  if (!ent) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Build a stable partner index for this enterprise so the same user
  // always appears as the same "Partner #NNNN". We fetch all filled
  // orders' userIds in stable insertion order.
  const allOrders = await db.tradeOrder.findMany({
    where: { enterpriseId: ent.id, status: "filled" },
    orderBy: { createdAt: "asc" },
    select: { id: true, userId: true, createdAt: true },
  });

  // Map userId → Partner #NNNN (sequential, stable per enterprise).
  const partnerIndex = new Map<string, number>();
  for (const o of allOrders) {
    if (!partnerIndex.has(o.userId)) {
      partnerIndex.set(o.userId, partnerIndex.size + 1);
    }
  }

  // Apply cursor + limit on the actual filled orders.
  const where: Record<string, unknown> = {
    enterpriseId: ent.id,
    status: "filled",
  };
  if (cursorTs && !Number.isNaN(cursorTs.getTime())) {
    where.createdAt = { lt: cursorTs };
  }

  const orders = await db.tradeOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: {
      id: true,
      side: true,
      equityUnits: true,
      priceEgp: true,
      filledEquityUnits: true,
      feesEgp: true,
      phase: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
    },
  });

  const hasMore = orders.length > limit;
  const items = orders.slice(0, limit).map((o) => {
    const idx = partnerIndex.get(o.userId) ?? 0;
    const partnerRef = `Partner #${String(idx).padStart(4, "0")}`;

    // CRE price-band verification (constitutional Rule I 1.5: ±5% band).
    const referencePrice = ent.equityUnitPriceEgp;
    const deviationPct = referencePrice > 0
      ? ((o.priceEgp - referencePrice) / referencePrice) * 100
      : 0;
    const withinBand = Math.abs(deviationPct) <= 5;
    const priceBandResult = withinBand
      ? "verified"
      : deviationPct > 0
      ? "exceeded_upper_band"
      : "breached_lower_band";

    return {
      id: o.id,
      timestamp: o.createdAt.toISOString(),
      side: o.side,
      units: o.filledEquityUnits,
      priceEgp: o.priceEgp,
      totalValueEgp: o.filledEquityUnits * o.priceEgp,
      feesEgp: o.feesEgp,
      phase: o.phase,
      partnerRef,
      crePriceBandVerification: {
        result: priceBandResult,
        referencePriceEgp: referencePrice,
        deviationPct: Number(deviationPct.toFixed(2)),
        bandPct: 5,
      },
    };
  });

  const body = {
    enterprise: { slug: ent.slug, name: ent.name, equityUnitPriceEgp: ent.equityUnitPriceEgp },
    trades: items,
    pagination: {
      count: items.length,
      hasMore,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1].timestamp : null,
      limit,
    },
    totalTrades: allOrders.length,
    uniquePartners: partnerIndex.size,
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
}
