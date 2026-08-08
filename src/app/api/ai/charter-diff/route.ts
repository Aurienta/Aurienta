import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { askConstitutionalAI } from "@/lib/aurienta/ai";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/charter-diff
 * Body: { proposalId: string, beforeText: string, afterText: string }
 *
 * Explains the constitutional implications of a charter amendment: counts
 * how many past expenses / proposals would have had different approval
 * paths under the new text. Persisted as an AiArtifact (kind = "charter_diff").
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
    const proposalId =
      typeof body?.proposalId === "string" ? body.proposalId : "";
    const beforeText =
      typeof body?.beforeText === "string" ? body.beforeText : "";
    const afterText =
      typeof body?.afterText === "string" ? body.afterText : "";

    if (!proposalId || !beforeText || !afterText) {
      return NextResponse.json(
        { error: "proposalId, beforeText and afterText are required" },
        { status: 400 }
      );
    }

    // Load the proposal + its enterprise + that enterprise's expenses (for
    // impact counting).
    const proposal = await db.proposal.findUnique({
      where: { id: proposalId },
      include: {
        enterprise: {
          select: {
            id: true,
            name: true,
            tier: true,
            totalEquityUnits: true,
            equityUnitPriceEgp: true,
            monthlyBurnEgp: true,
            lawFirmClientAccountBalanceEgp: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    const expenses = proposal.enterprise
      ? await db.expense.findMany({
          where: { enterpriseId: proposal.enterprise.id },
          orderBy: { createdAt: "desc" },
          take: 200,
          select: {
            id: true,
            amountEgp: true,
            category: true,
            status: true,
            aiRiskFlag: true,
            createdAt: true,
          },
        })
      : [];

    // Build impact signals from real ledger data.
    const totalExpenses = expenses.length;
    const dualSignatureBypassed = expenses.filter(
      (e) => e.amountEgp < 50_000 && e.status !== "flagged"
    ).length;
    const aboveNewThreshold = expenses.filter(
      (e) => e.amountEgp >= 50_000
    ).length;
    const flaggedExpenses = expenses.filter(
      (e) => e.aiRiskFlag && e.aiRiskFlag !== "none"
    ).length;

    const systemPrompt = `You are the AURIENTA Constitutional AI — Charter Diff mode.
Your task: explain the constitutional implications of a charter amendment in
plain language. Quantify the impact on PAST decisions where possible.

Output format (STRICT):
1. One headline sentence summarizing the change.
2. 2–3 short paragraphs of implication analysis.
3. A bullet list of "Impact on past decisions:" with concrete counts (use the
   signals provided).
4. A closing "Constitutional risk:" line rating the change as low | medium | high.

Rules:
- Cite the relevant rule/article (Zero Custody, dual-signature Rego, Art. 118,
  NOSI Art. 26, tier-specific rules).
- No emojis, no markdown headings (use plain text bullets with "•").
- Keep under 220 words.
- Always note that the diff is sealed to the immutable ledger as an AiArtifact.`;

    const userMessage = `Explain the implications of the charter diff. Reference the relevant
constitutional rule(s). Quantify the impact on past decisions where possible.`;

    // Charter text + proposal metadata + impact signals → UNTRUSTED-DATA
    // delimiters (charter text and proposal titles are user-controlled).
    const userContext = `PROPOSAL: ${proposal.title}
Type: ${proposal.type}
Enterprise: ${proposal.enterprise?.name ?? "—"} (Tier ${proposal.enterprise?.tier ?? "—"})

=== CHARTER TEXT — BEFORE ===
${beforeText}

=== CHARTER TEXT — AFTER ===
${afterText}

LEDGER IMPACT SIGNALS (this enterprise, last 200 expenses):
- Total expenses analyzed: ${totalExpenses}
- Expenses that would have bypassed dual signature under a higher threshold: ${dualSignatureBypassed}
- Expenses above 50,000 EGP (currently dual-signature): ${aboveNewThreshold}
- Expenses carrying a non-"none" AI risk flag: ${flaggedExpenses}`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "charter_diff",
      enterpriseId: proposal.enterpriseId,
      userId: user.id,
      entityId: proposal.id,
      persist: true,
      confidence: 0.88,
    });

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.charter-diff",
      target: proposal.enterpriseId ?? undefined,
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs, proposalId: proposal.id },
    });

    return NextResponse.json({
      implications: result.content,
      impact: {
        totalExpenses,
        dualSignatureBypassed,
        aboveNewThreshold,
        flaggedExpenses,
      },
    });
  } catch (e) {
    logger.error("[ai/charter-diff] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      {
        error: "internal_error",
        implications:
          "The Constitutional AI could not be reached. The charter text diff is preserved on the immutable ledger regardless.",
      },
      { status: 500 }
    );
  }
}
