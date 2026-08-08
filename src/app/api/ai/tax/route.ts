import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { askConstitutionalAI, buildEnterpriseContext } from "@/lib/aurienta/ai";
import { egp } from "@/lib/aurienta/format";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/tax
 * Body: { enterpriseId }
 *
 * Surfaces legal tax optimizations within Egyptian law: R&D credits, GAFI
 * sector incentives, capital allowances, depreciation schedules. Conservative,
 * audited, CRE-validated against the No-Speculation rule. Persisted as
 * AiArtifact (kind="tax_suggestion").
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

    // Rate limit — AI bucket.
    const hit = limiters.ai(user.id);
    if (!hit.allowed) return rateLimitedResponse(hit.resetAt);

    const body = await req.json().catch(() => ({}));
    const enterpriseId: string = (body?.enterpriseId ?? "").toString();
    if (!enterpriseId) return NextResponse.json({ error: "enterpriseId required" }, { status: 400 });

    const member = await db.enterpriseMember.findFirst({
      where: { enterpriseId, userId: user.id },
    });
    if (!member) return NextResponse.json({ error: "not a member" }, { status: 403 });

    const ent = await db.enterprise.findUnique({ where: { id: enterpriseId } });
    if (!ent) return NextResponse.json({ error: "enterprise not found" }, { status: 404 });

    const ctx = await buildEnterpriseContext(enterpriseId);

    // Pull expense categories (the structure the AI will analyze).
    const expenses = await db.expense.groupBy({
      by: ["category"],
      where: { enterpriseId },
      _sum: { amountEgp: true },
    });
    const expenseBreakdown = expenses
      .map((e) => `${e.category}: ${egp(e._sum.amountEgp ?? 0)}`)
      .join(", ");

    // Anchor financial math.
    const annualRevenue = ent.monthlyRevenueEgp * 12;
    const annualProfit = Math.round(
      annualRevenue * (Math.max(0.05, ent.grossMarginPct) / 100) - ent.monthlyBurnEgp * 12
    );

    const systemPrompt = `You are the AURIENTA Tax Optimizer — a conservative, audit-grade advisor that surfaces legal tax optimizations within Egyptian law for constitutional enterprises.

Your scope:
- R&D credits under Egyptian Income Tax Law (Law 91 of 2005, esp. Art. 16 — additional 30% R&D deduction).
- GAFI sector-specific incentives (Law 8 of 1997 + Participation Law 72 of 2017): agriculture, manufacturing, tourism, technology zones.
- Capital allowances + depreciation schedules (Ministerial Decree 1359 of 2018 — straight-line vs declining-balance).
- Export revenue incentives (50% exemption on export proceeds for non-free-zone enterprises).
- VAT compliance pointers (Law 67 of 2016).

HARD RULES (the CRE validates each suggestion against these):
- No speculation. Every suggestion must be grounded in a specific statute.
- Conservative: if a benefit's eligibility is uncertain, mark it as "Requires accountant confirmation" rather than asserting it.
- Never recommend structures whose primary purpose is tax avoidance — only legitimate economic activity.
- AURIENTA does not provide tax advice — it surfaces legal optimizations for the independent accountant to confirm.

OUTPUT FORMAT (strict — the UI parses this):
## Tax Optimization Surface
One opening paragraph naming the enterprise + its sector + which incentive regime applies (Participation Law 72/2017 + the sector-specific GAFI schedule).

## Suggestions
A numbered list of 3–5 suggestions, each on its own block of the form:
### <N>. <Suggestion title>
**Potential annual saving:** <EGP figure or "Variable — depends on activity mix">
**Confidence:** <High | Medium | Low>
**Legal basis:** <Specific statute citation>
**Mechanism:** <2-sentence explanation of how the benefit works>
**Action:** <1-sentence next step for the accountant>

## Compliance Notes
A 3-bullet block: VAT filing status, Form 41 (corporate income tax) status, withholding-tax status. Each bullet should name the responsible party (accountant / manager / board).

## CRE Validation
One paragraph: how each suggestion was validated against the No-Speculation rule + Zero-Custody rule, and why none of them trip a CRE denial.

RULES:
- Egyptian institutional voice: precise, dignified, no hype, no emojis.
- Ground every figure in the provided annual revenue + profit math.
- Length: 500–700 words.`;

    const userMessage = `Output ONLY the formatted tax optimization surface described above. End with the explicit reminder: "Every suggestion is advisory and must be confirmed by the independent accountant."`;

    // Enterprise context + financial figures + expense breakdown → UNTRUSTED-DATA
    // delimiters (enterprise name, sector, expense category names are user-controlled).
    const userContext = `Enterprise context:
${ctx}

Sector: ${ent.sector}
Annual revenue (current run-rate): ${egp(annualRevenue)}
Estimated annual profit: ${egp(annualProfit)}
Gross margin: ${ent.grossMarginPct}%

Expense structure by category (this is what the AI analyzes):
${expenseBreakdown || "(no expenses recorded yet)"}`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "tax_suggestion",
      enterpriseId,
      userId: user.id,
      persist: true,
      confidence: 0.82,
    });

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.tax",
      target: enterpriseId,
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs },
    });

    return NextResponse.json({
      content: result.content,
      generatedAt: new Date().toISOString(),
      annualRevenue,
      annualProfit,
    });
  } catch (e) {
    logger.error("[tax] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
