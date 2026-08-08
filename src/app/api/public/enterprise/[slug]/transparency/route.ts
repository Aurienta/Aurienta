import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/public/enterprise/[slug]/transparency
 *
 * Computes a 0-100 PDPL-aware public transparency score for an enterprise.
 * Public — no auth required. Returns the score breakdown so the public can
 * see HOW the score was derived (Norway-style openness).
 *
 * Scoring rubric (per Article XIV, constitutional charter):
 *   - Quarterly reports filed on time       (20 pts)
 *   - CRE decision log exists               (15 pts)
 *   - Annual report published               (20 pts)
 *   - Real-time financial dashboard accessible (10 pts) — always true
 *   - Trade log exists                      (10 pts)
 *   - Partner count visible                 (10 pts) — always true (>0 partners)
 *   - Brain AI assessment exists            (15 pts)
 *
 * Legal basis: enterprise-level governance metadata, no personal data.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const ent = await db.enterprise.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      transparencyScore: true,
      createdAt: true,
      _count: {
        select: {
          ownershipRecords: true,
          quarterlyReports: true,
          ledgerEvents: true,
          annualReports: true,
          aiArtifacts: true,
          orders: true,
        },
      },
    },
  });

  if (!ent) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Quarterly reports filed (any in the last 12 months gets full credit).
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [recentQuarterly, creDecisions, publishedAnnual, aiAssessments, filledOrders] =
    await Promise.all([
      db.quarterlyReport.count({
        where: { enterpriseId: ent.id, publishedAt: { gte: twelveMonthsAgo } },
      }),
      db.ledgerEvent.count({
        where: { enterpriseId: ent.id, eventType: "cre_decision" },
      }),
      db.annualReport.count({
        where: {
          enterpriseId: ent.id,
          auditStatus: "published",
          publishedAt: { not: null },
        },
      }),
      db.aiArtifact.count({
        where: {
          enterpriseId: ent.id,
          kind: { in: ["annual_report", "board_briefing", "ir_answer", "advisory", "explain_number"] },
        },
      }),
      db.tradeOrder.count({
        where: { enterpriseId: ent.id, status: "filled" },
      }),
    ]);

  const breakdown = [
    {
      key: "quarterly_reports",
      label: "Quarterly reports filed (last 12 months)",
      points: 20,
      earned: recentQuarterly >= 4 ? 20 : Math.min(20, recentQuarterly * 5),
      detail: `${recentQuarterly} of 4 expected quarterly reports`,
    },
    {
      key: "cre_decision_log",
      label: "CRE decision log exists",
      points: 15,
      earned: creDecisions > 0 ? 15 : 0,
      detail: `${creDecisions} CRE decisions recorded`,
    },
    {
      key: "annual_report",
      label: "Annual report published",
      points: 20,
      earned: publishedAnnual > 0 ? 20 : 0,
      detail: publishedAnnual > 0 ? "Published & audited" : "Not yet published",
    },
    {
      key: "financial_dashboard",
      label: "Real-time financial dashboard accessible",
      points: 10,
      earned: 10,
      detail: "Always accessible per charter Article XIV",
    },
    {
      key: "trade_log",
      label: "Trade log exists",
      points: 10,
      earned: filledOrders > 0 ? 10 : 0,
      detail: `${filledOrders} filled trades on record`,
    },
    {
      key: "partner_count",
      label: "Partner count visible (aggregated)",
      points: 10,
      earned: ent._count.ownershipRecords > 0 ? 10 : 0,
      detail: `${ent._count.ownershipRecords} partners (count only — no names)`,
    },
    {
      key: "brain_ai_assessment",
      label: "Brain AI assessment exists",
      points: 15,
      earned: aiAssessments > 0 ? 15 : 0,
      detail: `${aiAssessments} AI artifacts on record`,
    },
  ];

  const computedScore = breakdown.reduce((sum, b) => sum + b.earned, 0);

  // Persist the freshly computed score (best-effort — never block on this).
  if (computedScore !== ent.transparencyScore) {
    db.enterprise
      .update({
        where: { id: ent.id },
        data: { transparencyScore: computedScore },
      })
      .catch(() => {});
  }

  const tier =
    computedScore >= 90 ? "Platinum"
    : computedScore >= 75 ? "Gold"
    : computedScore >= 50 ? "Silver"
    : "Bronze";

  const body = {
    enterprise: {
      slug: ent.slug,
      name: ent.name,
    },
    score: computedScore,
    tier,
    storedScore: ent.transparencyScore,
    breakdown,
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
