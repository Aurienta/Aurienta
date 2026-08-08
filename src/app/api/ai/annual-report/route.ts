import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireRole } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { askConstitutionalAI } from "@/lib/aurienta/ai";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { egp } from "@/lib/aurienta/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/annual-report
 * Body: { enterpriseId, year }
 *
 * Generates (or regenerates) the Brain AI annual assessment for an enterprise.
 * The Brain (consensus mode) analyzes the enterprise's full year of:
 *   - Ledger events
 *   - Proposals (governance)
 *   - Expenses (treasury)
 *   - Milestones (capital releases)
 *   - Quarterly reports (financial disclosures)
 *
 * Persists the result as an AnnualReport row + an AiArtifact (kind=advisory)
 * for the audit trail. Also appends a `cre_decision` ledger event recording
 * that the annual report was generated.
 *
 * RBAC: founding_operator / company_owner / board_member / accounting_firm_rep / aurienta_rep.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    // RBAC — only enterprise officers can trigger the annual report.
    const body = await req.json().catch(() => ({}));
    const enterpriseId: string = (body?.enterpriseId ?? "").toString();
    const year: number = Number(body?.year ?? new Date().getFullYear());

    if (!enterpriseId || !Number.isInteger(year) || year < 2018 || year > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { error: "enterpriseId (string) + year (integer) required" },
        { status: 400 }
      );
    }

    const member = await db.enterpriseMember.findFirst({
      where: { enterpriseId, userId: user.id },
    });
    if (!member) {
      return NextResponse.json({ error: "not_a_member" }, { status: 403 });
    }
    const allowedRoles = [
      "founding_operator",
      "company_owner",
      "board_member",
      "accounting_firm_rep",
      "aurienta_rep",
    ];
    if (!allowedRoles.includes(member.role)) {
      try {
        await requireRole("aurienta_rep");
      } catch {
        return NextResponse.json(
          { error: `forbidden: requires one of ${allowedRoles.join(", ")}` },
          { status: 403 }
        );
      }
    }

    // Rate limit — AI bucket.
    const hit = limiters.ai(user.id);
    if (!hit.allowed) return rateLimitedResponse(hit.resetAt);

    const ent = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      include: {
        lawFirm: { select: { name: true, frLicenseNumber: true } },
        accountingFirm: { select: { name: true, esaaLicense: true } },
      },
    });
    if (!ent) {
      return NextResponse.json({ error: "enterprise_not_found" }, { status: 404 });
    }

    // ── Pull the enterprise's full year of records for the Brain AI to analyze ──
    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const [
      ledgerEvents,
      proposals,
      expenses,
      milestones,
      quarterlyReports,
      valuations,
      filledOrders,
    ] = await Promise.all([
      db.ledgerEvent.findMany({
        where: { enterpriseId, timestamp: { gte: yearStart, lt: yearEnd } },
        orderBy: { timestamp: "asc" },
        select: { eventType: true, timestamp: true, payloadHash: true, payload: true },
      }),
      db.proposal.findMany({
        where: { enterpriseId, createdAt: { gte: yearStart, lt: yearEnd } },
        select: { title: true, type: true, status: true, votesFor: true, votesAgainst: true, aiRiskScore: true, createdAt: true },
      }),
      db.expense.findMany({
        where: { enterpriseId, createdAt: { gte: yearStart, lt: yearEnd } },
        select: { category: true, amountEgp: true, status: true, aiRiskFlag: true, createdAt: true },
      }),
      db.milestone.findMany({
        where: { enterpriseId, createdAt: { gte: yearStart, lt: yearEnd } },
        select: { title: true, amountEgp: true, status: true, releasedAt: true, createdAt: true },
      }),
      db.quarterlyReport.findMany({
        where: { enterpriseId, year },
        orderBy: { quarter: "asc" },
      }),
      db.valuation.findMany({
        where: { enterpriseId, createdAt: { gte: yearStart, lt: yearEnd } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      db.tradeOrder.count({
        where: { enterpriseId, status: "filled", createdAt: { gte: yearStart, lt: yearEnd } },
      }),
    ]);

    // Aggregate financials for the year.
    const totalRevenue = quarterlyReports.reduce((s, q) => s + q.revenueEgp, 0);
    const totalNetProfit = quarterlyReports.reduce((s, q) => s + q.netProfitEgp, 0);
    const totalExpensesApproved = expenses
      .filter((e) => e.status === "approved")
      .reduce((s, e) => s + e.amountEgp, 0);
    const totalMilestonesReleased = milestones
      .filter((m) => m.status === "released")
      .reduce((s, m) => s + m.amountEgp, 0);

    // Build the enterprise context for the Brain AI — UNTRUSTED DATA delimiters.
    const systemPrompt = `You are the AURIENTA Constitutional AI — Annual Report mode (consensus).

Your job: produce a comprehensive annual assessment for the enterprise specified in the
untrusted-data context. This is the constitutional annual report required by Article XIV
of the constitutional charter, modeled on the Egyptian Companies Law 159/1981 annual
report format and the FRA disclosure regime.

OUTPUT FORMAT (strict):

## Executive Summary
2-3 paragraphs. Open with the year's defining number (revenue, graduation, or capital
raised). State the enterprise's constitutional stage and tier. Highlight one structural
achievement and one structural risk.

## Financial Performance
1-2 paragraphs. Cite the aggregated revenue, net profit, gross margin, and any valuation
changes. Reference quarterly trends. No projections — past performance only.

## Governance Activity
1 paragraph. Number of proposals, vote turnout patterns, any constitutional amendments,
and the AI risk profile of the year's governance decisions.

## Treasury & Capital Discipline
1 paragraph. Capital released via milestones, expense approval rate, Law Firm Client Account balance,
runway. Note any CRE denials or related-party flags.

## Compliance Posture
1 paragraph. NOSI registration, police clearance status, law firm + accounting firm
tenure, audit status for the year.

## Constitutional Maturity
1 paragraph. Progress along the graduation trajectory. Readiness score trajectory.
Specific next-stage requirements (ERP, statutory audit, board independence, etc.).

## Brain AI Recommendations
3-5 numbered, actionable recommendations for the coming year. Each tied to a specific
constitutional rule or Article.

Length: 600-900 words total. No emojis. Egyptian institutional voice. Cite Article
numbers where relevant. NEVER invent numbers not in the context.`;

    const userContext = `ENTERPRISE: ${ent.name} (Tier ${ent.tier}, ${ent.stage}, ${ent.legalForm})
Sector: ${ent.sector}
Reporting year: ${year}
Founded: ${ent.createdAt.toISOString().slice(0, 10)}
Current health: ${ent.healthRating ?? "—"} (${ent.healthScore}/100)
Graduation readiness: ${ent.graduationReadiness}/100

LAW FIRM: ${ent.lawFirm?.name ?? "Pending"} (License ${ent.lawFirm?.frLicenseNumber ?? "—"})
ACCOUNTING FIRM: ${ent.accountingFirm?.name ?? "Pending"} (ESAA ${ent.accountingFirm?.esaaLicense ?? "—"})

LEDGER EVENTS (${ledgerEvents.length} this year):
${summarizeEvents(ledgerEvents)}

PROPOSALS (${proposals.length} this year):
${proposals.length === 0 ? "• (none)" : proposals.slice(0, 20).map(p => `• [${p.createdAt.toISOString().slice(0, 10)}] ${p.type} — "${p.title}" — ${p.status} (for ${p.votesFor} / against ${p.votesAgainst}, AI risk ${p.aiRiskScore})`).join("\n")}

EXPENSES (${expenses.length} this year, ${expenses.filter(e=>e.status==="approved").length} approved, total approved ${egp(totalExpensesApproved)}):
${summarizeExpenses(expenses)}

MILESTONES (${milestones.length} this year, ${milestones.filter(m=>m.status==="released").length} released, total released ${egp(totalMilestonesReleased)}):
${milestones.length === 0 ? "• (none)" : milestones.slice(0, 20).map(m => `• [${m.createdAt.toISOString().slice(0, 10)}] "${m.title}" — ${m.status} (${egp(m.amountEgp)})`).join("\n")}

QUARTERLY REPORTS (${quarterlyReports.length} for ${year}):
${quarterlyReports.length === 0 ? "• (none)" : quarterlyReports.map(q => `• ${q.quarter} ${q.year}: revenue ${egp(q.revenueEgp)} | net profit ${egp(q.netProfitEgp)} | gross margin ${q.grossMarginPct.toFixed(1)}% | Law Firm Client Account balance ${egp(q.lawFirmClientAccountBalanceEgp)} | runway ${q.runwayMonths.toFixed(1)}mo`).join("\n")}

VALUATIONS (${valuations.length} this year):
${valuations.length === 0 ? "• (none)" : valuations.map(v => `• Pre-money ${egp(v.preMoneyEgp)} | Equity Unit price ${egp(v.equityUnitPriceEgp)} | CPP ${egp(v.cppEgp)} | confidence ${(v.aiConfidence * 100).toFixed(0)}% | model ${v.modelVersion}`).join("\n")}

SECONDARY ENTERPRISE REGISTRY: ${filledOrders} filled trades this year

AGGREGATES:
- Total annual revenue: ${egp(totalRevenue)}
- Total annual net profit: ${egp(totalNetProfit)}
- Total expenses approved: ${egp(totalExpensesApproved)}
- Total capital released via milestones: ${egp(totalMilestonesReleased)}`;

    const userMessage = `Generate the AURIENTA Constitutional Annual Report for ${ent.name} for fiscal year ${year}. Follow the strict output format described in the system instructions.`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "advisory",
      enterpriseId,
      userId: user.id,
      persist: true,
      confidence: 0.88,
    });

    // Compute fiscal year end (calendar year-end by default).
    const fiscalYearEnd = new Date(`${year}-12-31T23:59:59.000Z`);

    // Upsert the AnnualReport row. If the year already has a report, refresh
    // the Brain AI assessment + audit status (back to "pending" if previously audited).
    const annualReport = await db.$transaction(async (tx) => {
      const upserted = await tx.annualReport.upsert({
        where: { enterpriseId_year: { enterpriseId, year } },
        create: {
          enterpriseId,
          year,
          fiscalYearEnd,
          revenueEgp: totalRevenue,
          netProfitEgp: totalNetProfit,
          totalAssetsEgp: ent.lawFirmClientAccountBalanceEgp + totalRevenue, // best-effort estimate
          totalLiabilitiesEgp: Math.max(0, totalExpensesApproved - totalMilestonesReleased),
          auditStatus: "pending",
          auditorName: ent.accountingFirm?.name ?? null,
          auditorLicense: ent.accountingFirm?.esaaLicense ?? null,
          brainAiAssessment: result.content,
        },
        update: {
          fiscalYearEnd,
          revenueEgp: totalRevenue,
          netProfitEgp: totalNetProfit,
          totalAssetsEgp: ent.lawFirmClientAccountBalanceEgp + totalRevenue,
          totalLiabilitiesEgp: Math.max(0, totalExpensesApproved - totalMilestonesReleased),
          auditorName: ent.accountingFirm?.name ?? null,
          auditorLicense: ent.accountingFirm?.esaaLicense ?? null,
          brainAiAssessment: result.content,
        },
      });

      // Append a ledger event recording the annual report generation.
      await appendLedgerEvent(tx, {
        enterpriseId,
        eventType: "cre_decision",
        payload: {
          action: "annual_report_generated",
          year,
          annualReportId: upserted.id,
          actorId: user.id,
          totals: {
            revenueEgp: totalRevenue,
            netProfitEgp: totalNetProfit,
            expensesApprovedEgp: totalExpensesApproved,
            milestonesReleasedEgp: totalMilestonesReleased,
            filledTrades: filledOrders,
            proposals: proposals.length,
            ledgerEvents: ledgerEvents.length,
          },
          aiFellBack: result.fellBack,
          aiLatencyMs: result.latencyMs,
        },
        actorId: user.id,
      });

      return upserted;
    });

    await audit({
      actorId: user.id,
      action: "ai.annual_report",
      target: enterpriseId,
      result: "allowed",
      metadata: {
        year,
        annualReportId: annualReport.id,
        fellBack: result.fellBack,
        latencyMs: result.latencyMs,
        totals: {
          revenueEgp: totalRevenue,
          netProfitEgp: totalNetProfit,
          proposals: proposals.length,
          ledgerEvents: ledgerEvents.length,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      annualReport: {
        id: annualReport.id,
        year: annualReport.year,
        fiscalYearEnd: annualReport.fiscalYearEnd.toISOString(),
        revenueEgp: annualReport.revenueEgp,
        netProfitEgp: annualReport.netProfitEgp,
        totalAssetsEgp: annualReport.totalAssetsEgp,
        totalLiabilitiesEgp: annualReport.totalLiabilitiesEgp,
        auditStatus: annualReport.auditStatus,
        auditorName: annualReport.auditorName,
        auditorLicense: annualReport.auditorLicense,
        brainAiAssessment: annualReport.brainAiAssessment,
        publishedAt: annualReport.publishedAt?.toISOString() ?? null,
        createdAt: annualReport.createdAt.toISOString(),
      },
      ai: {
        fellBack: result.fellBack,
        latencyMs: result.latencyMs,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
      },
    });
  } catch (e) {
    logger.error("[ai/annual-report] route error:", {
      err: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "internal_error", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

/** Build a one-line summary of ledger events by type for the AI context. */
function summarizeEvents(events: { eventType: string; timestamp: { toISOString: () => string }; payload: string }[]): string {
  if (events.length === 0) return "• (none)";
  const byType = new Map<string, number>();
  for (const e of events) {
    byType.set(e.eventType, (byType.get(e.eventType) ?? 0) + 1);
  }
  const lines = Array.from(byType.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `• ${t}: ${n}`);
  return lines.join("\n");
}

function summarizeExpenses(expenses: { category: string; amountEgp: number; status: string; aiRiskFlag: string | null; createdAt: { toISOString: () => string } }[]): string {
  if (expenses.length === 0) return "• (none)";
  const byCategory = new Map<string, { count: number; total: number; approved: number; flagged: number }>();
  for (const e of expenses) {
    const cur = byCategory.get(e.category) ?? { count: 0, total: 0, approved: 0, flagged: 0 };
    cur.count += 1;
    cur.total += e.amountEgp;
    if (e.status === "approved") cur.approved += e.amountEgp;
    if (e.aiRiskFlag && e.aiRiskFlag !== "none") cur.flagged += 1;
    byCategory.set(e.category, cur);
  }
  return Array.from(byCategory.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([cat, agg]) => `• ${cat}: ${agg.count} expenses, total ${egp(agg.total)}, approved ${egp(agg.approved)}${agg.flagged > 0 ? `, ${agg.flagged} AI-flagged` : ""}`)
    .join("\n");
}
