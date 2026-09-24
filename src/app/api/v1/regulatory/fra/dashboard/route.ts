import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/regulatory/fra/dashboard
// FRA Regulatory Shadow Mode (Vol 12 §12.4)
// Returns aggregate platform metrics for FRA regulators.
// Requires FRA_ACCESS_TOKEN (different from CRON_SECRET).
export const GET = withErrorHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token !== process.env.FRA_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Unauthorized — FRA access required" }, { status: 401 });
  }

  // Aggregate metrics — NO PII, only counts and amounts
  // Use audit log counts for entities that may not have their own model.
  const [
    totalPartners,
    totalEnterprises,
    activeEnterprises,
    graduatedEnterprises,
    totalProposals,
  ] = await Promise.all([
    db.user.count(),
    db.enterprise.count(),
    db.enterprise.count({ where: { status: "active" } }),
    db.enterprise.count({ where: { stage: "graduated" } }),
    db.proposal.count(),
  ]);

  // Trades, appeals, and screening events may use different model names.
  // Use audit log counts as a reliable fallback.
  const totalTrades = await db.auditLog.count({ where: { action: "trade.executed" } });
  const totalAppeals = await db.auditLog.count({ where: { action: { startsWith: "appeal" } } });
  const totalScreeningEvents = await db.auditLog.count({ where: { action: "screening.create" } });
  const screeningBlocked = await db.auditLog.count({
    where: { action: "screening.create", result: "denied" },
  });

  // Capital deployed (sum of raisedEgp)
  const capitalResult = await db.enterprise.aggregate({
    _sum: { raisedEgp: true },
  });
  const capitalDeployedEgp = capitalResult._sum.raisedEgp ?? 0;

  // Enterprises by tier
  const tierCounts = await db.enterprise.groupBy({
    by: ["tier"],
    _count: true,
  });

  // CRE policy pass rate (from audit log)
  const creDecisions = await db.auditLog.groupBy({
    by: ["result"],
    where: { action: { startsWith: "cre." } },
    _count: true,
  });
  const creAllowed = creDecisions.find((d) => d.result === "allowed")?._count ?? 0;
  const creDenied = creDecisions.find((d) => d.result === "denied")?._count ?? 0;
  const creTotal = creAllowed + creDenied;
  const crePassRate = creTotal > 0 ? (creAllowed / creTotal) * 100 : 100;

  await audit({
    actorId: "fra_regulator",
    action: "fra.dashboard_accessed",
    target: "platform:all",
    result: "allowed",
    metadata: {
      accessedAt: new Date().toISOString(),
      endpoint: "/api/v1/regulatory/fra/dashboard",
    },
  });

  return NextResponse.json({
    accessedAt: new Date().toISOString(),
    platform: {
      totalPartners,
      totalEnterprises,
      activeEnterprises,
      graduatedEnterprises,
      totalTrades,
      totalProposals,
      totalScreeningEvents,
      totalAppeals,
      screeningBlocked,
    },
    capital: {
      deployedEgp: capitalDeployedEgp,
    },
    enterprisesByTier: tierCounts.reduce((acc, t) => {
      acc[t.tier] = t._count;
      return acc;
    }, {} as Record<string, number>),
    cre: {
      totalDecisions: creTotal,
      allowed: creAllowed,
      denied: creDenied,
      passRate: Math.round(crePassRate * 100) / 100,
    },
    note: "FRA Shadow Mode — read-only aggregate view. No PII exposed.",
  });
});
