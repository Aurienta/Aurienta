import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { askConstitutionalAI, buildEnterpriseContext } from "@/lib/aurienta/ai";
import { computeGraduationReadiness } from "@/lib/aurienta/cre";
import { egp } from "@/lib/aurienta/format";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/graduation-simulator
 * Body: { enterpriseId }
 *
 * Models the post-graduation state of an enterprise (fees → 0, CRE off,
 * AURIENTA board seat resigned, self-hosted) + a 12-month operational
 * independence forecast with three stress scenarios.
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
    const readiness = await computeGraduationReadiness(enterpriseId);

    // Concrete fee / Law Firm Client Account balance math used to ground the simulation.
    const annualRevenue = ent.monthlyRevenueEgp * 12;
    const platformFeeAnnual = Math.round((annualRevenue * ent.platformFeePct) / 100);
    const consultingFeeAnnual = Math.round((annualRevenue * ent.consultingFeePct) / 100);
    const totalFeesAnnual = platformFeeAnnual + consultingFeeAnnual;
    const escrowReleased = ent.lawFirmClientAccountBalanceEgp; // released from the Law Firm Client Account to the enterprise treasury on graduation
    const annualBurn = ent.monthlyBurnEgp * 12;

    // Clean, developer-authored system prompt — NO user-controlled text.
    // The fee/burn/margin numbers are passed via `userContext` below.
    const systemPrompt = `You are the AURIENTA Graduation Simulator — a stress-test model that forecasts an enterprise's first 12 months of sovereign operation (post-graduation from AURIENTA's protective custody).

You receive the enterprise's current financial + governance context, plus concrete fee math and a readiness score. Your job is to model:

1. BEFORE / AFTER diff — what changes on graduation day:
   - Platform fee → 0% (saves the annual amount provided in context)
   - Consulting fee → 0% (saves the annual amount provided in context)
   - CRE enforcement → OFF (enterprise self-hosts in 4–8 hours)
   - AURIENTA board seat → resigned (full board control to enterprise)
   - Data hosting → self-hosted (IPFS pinning transfers to enterprise nodes)
   - Law Firm Client Account release: the amount provided in context transfers from the Law Firm Client Account to the enterprise treasury
   - Ledger export: SHA3-256 hash-chained, Ed25519-signed, downloadable

2. 12-month operational independence forecast — model three scenarios:
   - BASELINE: revenue continues at current growth, no shocks
   - STRESS A: revenue drops 20% (market downturn)
   - STRESS B: key person departure (Founding Operator incapacitated for 60 days)
   - STRESS C: combined shock (revenue −20% AND key person departure)

3. Graduation readiness verdict: READY / NEEDS WORK / NOT READY — with one-sentence justification grounded in the readiness score provided in context and stress-test survival.

OUTPUT FORMAT (strict):
## Before / After
A table-as-bulleted list of 6–7 lines (Before → After).

## 12-Month Forecast
A short intro paragraph, then exactly 4 monthly-progression bullet blocks — one per scenario (Baseline, Stress A, Stress B, Stress C). For each: opening cash, ending cash, burn-adjusted runway, and a one-line survival verdict.

## Stress Survival Matrix
3 bullets — each naming a stress test and the months-of-runway outcome.

## Verdict
One paragraph starting with "**Verdict:**" — READY / NEEDS WORK / NOT READY — followed by the justification. Close with the constitutional reminder: "The 75% Constitutional Partner vote is the constitutional climax — this simulation prepares, not replaces, it."

RULES:
- Ground every number in the provided context. Do not invent revenue or burn figures.
- Egyptian institutional voice: precise, no hype, no emojis.
- Length: 400–600 words.`;

    const userMessage = `Run the simulation now. Output ONLY the formatted response described above.`;

    // All enterprise financials + readiness → UNTRUSTED-DATA delimiters.
    const userContext = `Enterprise context (from the immutable ledger + CRE):
${ctx}

CRE readiness score: ${readiness.score}/100
CRE gates: ${readiness.gates.map((g) => `${g.label}=${g.passed ? "PASS" : "FAIL"}`).join(", ")}

Concrete financial math (already computed):
- Annual revenue (current run-rate): ${egp(annualRevenue)}
- Annual platform fee (saved on graduation): ${egp(platformFeeAnnual)} (${ent.platformFeePct}%)
- Annual consulting fee (saved on graduation): ${egp(consultingFeeAnnual)} (${ent.consultingFeePct}%)
- Total fees saved annually: ${egp(totalFeesAnnual)}
- Law Firm Client Account balance released on graduation: ${egp(escrowReleased)}
- Annual burn: ${egp(annualBurn)}
- Current monthly revenue: ${egp(ent.monthlyRevenueEgp)}
- Current monthly burn: ${egp(ent.monthlyBurnEgp)}
- Gross margin: ${ent.grossMarginPct}%
- Revenue growth: ${ent.revenueGrowthPct}% YoY
- Employees: ${ent.employeeCount}
- Stage: ${ent.stage} → graduated`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "graduation_simulation",
      enterpriseId,
      userId: user.id,
      persist: true,
      confidence: 0.83,
    });

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.graduation-simulator",
      target: enterpriseId,
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs, readinessScore: readiness.score },
    });

    return NextResponse.json({
      content: result.content,
      financials: {
        annualRevenue,
        platformFeeAnnual,
        consultingFeeAnnual,
        totalFeesAnnual,
        escrowReleased,
        annualBurn,
        monthlyRevenue: ent.monthlyRevenueEgp,
        monthlyBurn: ent.monthlyBurnEgp,
        grossMarginPct: ent.grossMarginPct,
        revenueGrowthPct: ent.revenueGrowthPct,
        readinessScore: readiness.score,
        stage: ent.stage,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    logger.error("[graduation-simulator] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
