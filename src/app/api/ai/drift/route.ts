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
 * POST /api/ai/drift
 * Body: { enterpriseId: string }
 *
 * Analyzes whether the enterprise is still operating as constituted.
 * Compares actual expense patterns, governance cadence, and reporting
 * timeliness against the constitutional charter. Returns findings + a
 * drift score (0–100, higher = more drift). Persisted as an AiArtifact
 * (kind = "drift_report").
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
    const enterpriseId =
      typeof body?.enterpriseId === "string" ? body.enterpriseId : "";

    if (!enterpriseId) {
      return NextResponse.json(
        { error: "enterpriseId is required" },
        { status: 400 }
      );
    }

    const isMember = user.memberships.some(
      (m) => m.enterpriseId === enterpriseId
    );
    if (!isMember) {
      return NextResponse.json(
        { error: "Not a member of this enterprise" },
        { status: 403 }
      );
    }

    // Compute drift signals from real ledger data.
    const [enterprise, expenses, proposals, ledgerEvents] = await Promise.all([
      db.enterprise.findUnique({
        where: { id: enterpriseId },
        include: { members: { select: { role: true, boardSeat: true } } },
      }),
      db.expense.findMany({
        where: { enterpriseId },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: {
          id: true,
          amountEgp: true,
          status: true,
          aiRiskFlag: true,
          category: true,
          createdAt: true,
        },
      }),
      db.proposal.findMany({
        where: { enterpriseId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          aiRiskScore: true,
          createdAt: true,
          votingEndsAt: true,
          executedAt: true,
        },
      }),
      db.ledgerEvent.findMany({
        where: { enterpriseId },
        orderBy: { timestamp: "desc" },
        take: 30,
        select: { id: true, eventType: true, timestamp: true },
      }),
    ]);

    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise not found" },
        { status: 404 }
      );
    }

    // === Drift signals ===
    const flaggedExpenses = expenses.filter(
      (e) => e.aiRiskFlag && e.aiRiskFlag !== "none"
    ).length;
    const flaggedPct = expenses.length
      ? (flaggedExpenses / expenses.length) * 100
      : 0;

    // Governance cadence — how many proposals in the last 90 days?
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000);
    const recentProposals = proposals.filter(
      (p) => new Date(p.createdAt) >= ninetyDaysAgo
    ).length;
    const executedProposals = proposals.filter(
      (p) => p.status === "executed"
    ).length;
    const expiredProposals = proposals.filter(
      (p) => p.status === "expired" || p.status === "rejected"
    ).length;

    // Reporting timeliness — last ledger event age (days)
    const lastEvent = ledgerEvents[0];
    const lastEventAgeDays = lastEvent
      ? Math.floor((Date.now() - new Date(lastEvent.timestamp).getTime()) / 86_400_000)
      : 999;

    // Compliance signals
    const nosiPct = enterprise.nosiCompliantPct;
    const policeClearanceValid = enterprise.policeClearanceValid;

    // Compose a deterministic drift score (0–100, higher = worse drift)
    let driftScore = 0;
    driftScore += Math.min(35, flaggedPct * 4); // up to 35 from flagged expenses
    driftScore += recentProposals === 0 ? 20 : Math.max(0, 15 - recentProposals * 2); // governance cadence
    driftScore += Math.min(20, Math.max(0, lastEventAgeDays - 7) * 1.5); // reporting timeliness
    driftScore += (100 - nosiPct) * 0.15; // NOSI compliance
    driftScore += policeClearanceValid ? 0 : 8; // police clearance
    driftScore = Math.min(100, Math.round(driftScore));

    const enterpriseContext = await buildEnterpriseContext(enterpriseId);

    const systemPrompt = `You are the AURIENTA Constitutional AI — Drift Detection mode.
Your task: determine whether the enterprise is still operating as constituted.
Compare ACTUAL behavior (expense patterns, governance cadence, reporting timeliness,
compliance signals) against the constitutional charter and the tier-specific rules.

Output format (STRICT — must be parseable):
1. First, write a single line: "DRIFT_SCORE: <integer 0-100>" (higher = more drift).
2. Then 3–6 findings, one per line, in this exact format:
   "FINDING | <green|amber|red> | <one-sentence description> | <one-sentence recommendation>"
3. End with a 2-sentence executive summary.

Rules:
- Severity green = on-constitution; amber = drift emerging; red = charter breach risk.
- Reference the relevant rule/article (Zero Custody, NOSI Art. 26, police clearance
  Add-on 27, Tier C ERP mandate, dual-signature threshold 50k, etc.).
- No emojis. No markdown. Be concise and institutional.`;

    const userMessage = `Analyze constitutional drift now. Return the DRIFT_SCORE line, then 3–6 FINDING
lines, then the executive summary.`;

    // Enterprise context + computed drift signals → UNTRUSTED-DATA delimiters.
    const userContext = `ENTERPRISE CONTEXT:
${enterpriseContext}

DRIFT SIGNALS (computed from the immutable ledger):
- ${expenses.length} recent expenses (last 60); ${flaggedExpenses} carry a non-"none" AI risk flag (${flaggedPct.toFixed(1)}%).
- Governance cadence: ${recentProposals} proposals in the last 90 days; ${executedProposals} executed, ${expiredProposals} expired/rejected of ${proposals.length} total.
- Reporting timeliness: last ledger event ${lastEventAgeDays} day(s) ago; ${ledgerEvents.length} events in the analyzed window.
- NOSI compliance: ${nosiPct}% (target 100%).
- Police clearance: ${policeClearanceValid ? "valid" : "EXPIRED"}.
- Board seats filled: ${enterprise.members.filter((m) => m.boardSeat).length}.

Computed preliminary drift score (informational — your final DRIFT_SCORE may differ
by up to ±10 points based on qualitative judgment): ${driftScore}/100.`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "drift_report",
      enterpriseId,
      userId: user.id,
      persist: true,
      confidence: 0.85,
    });
    const report = result.content;

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.drift",
      target: enterpriseId,
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs, driftScore },
    });

    // Parse the AI output into structured findings + score.
    const parsed = parseDriftReport(report, driftScore);

    return NextResponse.json({
      ...parsed,
      raw: report,
      signals: {
        expensesAnalyzed: expenses.length,
        flaggedExpenses,
        flaggedPct: Number(flaggedPct.toFixed(1)),
        recentProposals,
        executedProposals,
        expiredProposals,
        lastEventAgeDays,
        nosiPct,
        policeClearanceValid,
      },
    });
  } catch (e) {
    logger.error("[ai/drift] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}

function parseDriftReport(
  raw: string,
  fallbackScore: number
): {
  driftScore: number;
  findings: {
    severity: "green" | "amber" | "red";
    description: string;
    recommendation: string;
  }[];
  summary: string;
} {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Find DRIFT_SCORE line.
  const scoreLine = lines.find((l) =>
    /^DRIFT_SCORE:\s*\d+/i.test(l)
  );
  let driftScore = fallbackScore;
  if (scoreLine) {
    const m = scoreLine.match(/(\d+)/);
    if (m) driftScore = Math.min(100, Math.max(0, parseInt(m[1], 10)));
  }

  // Find FINDING lines.
  const findings: {
    severity: "green" | "amber" | "red";
    description: string;
    recommendation: string;
  }[] = [];
  for (const l of lines) {
    if (!/^FINDING\s*\|/i.test(l)) continue;
    const parts = l.split("|").map((p) => p.trim());
    if (parts.length < 4) continue;
    // Drop the leading "FINDING" token.
    const [, sevRaw, desc, rec] = parts;
    const severity =
      sevRaw.toLowerCase() === "red"
        ? "red"
        : sevRaw.toLowerCase() === "amber"
        ? "amber"
        : "green";
    findings.push({
      severity,
      description: desc,
      recommendation: rec,
    });
  }

  // Summary = all non-FINDING, non-DRIFT_SCORE, non-empty lines joined.
  const summary = lines
    .filter((l) => !/^FINDING\s*\|/i.test(l) && !/^DRIFT_SCORE:/i.test(l))
    .join(" ")
    .trim();

  return {
    driftScore,
    findings,
    summary:
      summary ||
      "Drift analysis complete. See findings above for severity-rated recommendations.",
  };
}
