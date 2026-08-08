import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import {
  askConstitutionalAI,
  buildEnterpriseContext,
} from "@/lib/aurienta/ai";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/anomaly
 * Body: { expenseId: string, flag: string, enterpriseId?: string }
 *
 * Loads the expense + sibling expenses from the same enterprise / vendor /
 * amount-band, then asks the constitutional AI to write a plain-language
 * investigation brief. Persisted as an AiArtifact (kind = "anomaly_narration")
 * — court-admissible, ledger-immutable.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limit — AI bucket.
    const hit = limiters.ai(user.id);
    if (!hit.allowed) return rateLimitedResponse(hit.resetAt);

    const body = await req.json().catch(() => ({}));
    const expenseId = typeof body?.expenseId === "string" ? body.expenseId : "";
    const flag = typeof body?.flag === "string" ? body.flag : "";
    const enterpriseId =
      typeof body?.enterpriseId === "string" ? body.enterpriseId : undefined;

    if (!expenseId || !flag) {
      return NextResponse.json(
        { error: "expenseId and flag are required" },
        { status: 400 }
      );
    }

    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      include: {
        enterprise: { select: { id: true, name: true, tier: true } },
        submitter: { select: { legalName: true } },
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    // Pull sibling expenses from the same enterprise for pattern analysis.
    const siblings = await db.expense.findMany({
      where: {
        enterpriseId: expense.enterpriseId,
        id: { not: expense.id },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        category: true,
        description: true,
        vendor: true,
        amountEgp: true,
        status: true,
        aiRiskFlag: true,
        createdAt: true,
      },
    });

    // Pattern signals
    const sameVendor = siblings.filter((s) => s.vendor === expense.vendor);
    const sameVendorCount = sameVendor.length;
    const nearThreshold = siblings.filter(
      (s) => Math.abs(s.amountEgp - 50000) < 5000
    ).length;
    const totalFlagged = siblings.filter(
      (s) => s.aiRiskFlag && s.aiRiskFlag !== "none"
    ).length;
    const totalSpend = siblings.reduce((s, e) => s + e.amountEgp, 0);

    // Enterprise context (if the user is a member).
    let enterpriseContext = "";
    if (enterpriseId) {
      const isMember = user.memberships.some(
        (m) => m.enterpriseId === enterpriseId
      );
      if (isMember) {
        enterpriseContext = await buildEnterpriseContext(enterpriseId);
      }
    }

    const systemPrompt = `You are the AURIENTA Constitutional AI — Anomaly Narration mode.
Your task: turn a cryptic AI risk flag into a plain-language investigation brief
that a non-technical board member could read in 30 seconds and know exactly what
to do next.

Format requirements:
- Open with the headline finding in ONE sentence (numbers + time window).
- 2–3 short paragraphs of supporting pattern analysis.
- Close with a numbered "Recommended next steps" line (max 3 actions).
- Cite the relevant constitutional rule where it applies (e.g. dual-signature
  threshold 50,000 EGP per Rego policy, related-party disclosure Article III,
  NOSI compliance Article 26).
- No emojis, no markdown headings. Keep under 180 words.
- Always note that the brief is persisted as a ledger-immutable AiArtifact
  and may be tendered as evidence.`;

    const userMessage = `Write the plain-language investigation brief now. Reference the constitutional
rule(s) the pattern may be circumventing.`;

    // User-controlled metric data → UNTRUSTED-DATA delimiters.
    const userContext = `FLAGGED EXPENSE:
- ID: ${expense.id}
- Enterprise: ${expense.enterprise.name} (Tier ${expense.enterprise.tier})
- Category: ${expense.category}
- Vendor: ${expense.vendor}
- Amount: ${expense.amountEgp.toLocaleString()} EGP
- Description: ${expense.description}
- Submitter: ${expense.submitter?.legalName ?? "—"}
- Flag: ${flag}
- Submitted: ${expense.createdAt.toISOString()}

PATTERN SIGNALS (this enterprise, last 50 expenses):
- Same vendor "${expense.vendor}" appeared in ${sameVendorCount} other expense(s).
- ${nearThreshold} expense(s) clustered within 5,000 EGP of the 50,000 dual-signature threshold.
- ${totalFlagged} of ${siblings.length} sibling expenses carry a non-"none" AI risk flag.
- Total spend in window: ${totalSpend.toLocaleString()} EGP.

${enterpriseContext ? "ENTERPRISE CONTEXT:\n" + enterpriseContext : ""}`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "anomaly_narration",
      enterpriseId: expense.enterpriseId,
      userId: user.id,
      entityId: expense.id,
      persist: true,
      confidence: 0.9,
    });

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.anomaly",
      target: expense.enterpriseId,
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs, expenseId: expense.id },
    });

    return NextResponse.json({
      narration: result.content,
      flag,
      expenseId,
      patterns: {
        sameVendorCount,
        nearThreshold,
        totalFlagged,
        totalSiblings: siblings.length,
      },
    });
  } catch (e) {
    logger.error("[ai/anomaly] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      {
        error: "internal_error",
        narration:
          "The Constitutional AI could not be reached. The CRE remains online — the underlying risk flag is still enforced regardless.",
      },
      { status: 500 }
    );
  }
}
