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
 * POST /api/ai/precedent
 * Body: { query: string, enterpriseId?: string }
 *
 * Semantic precedent search across every past proposal, vote, dispute, and
 * appeal in the seeded ledger. Returns 3 similar past decisions with
 * similarity scores, outcomes, and key factors. Persisted as an AiArtifact
 * (kind = "precedent_match").
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
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const enterpriseId =
      typeof body?.enterpriseId === "string" ? body.enterpriseId : undefined;

    if (!query) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    // Load the precedent library — every proposal across the platform
    // (institutional observer view; no cross-enterprise confidentiality
    // issue since all proposals are visible to all Constitutional Partners per Art. III).
    const proposals = await db.proposal.findMany({
      where: {
        status: { in: ["executed", "rejected", "expired", "voting_open", "published"] },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        enterprise: { select: { id: true, name: true, tier: true, sector: true } },
        votes: {
          select: { choice: true, votingPower: true, reason: true },
          take: 3,
        },
      },
    });

    if (proposals.length === 0) {
      return NextResponse.json({
        summary:
          "No past decisions in the precedent library yet. Raise the first constitutional proposal to seed the library.",
        matches: [],
      });
    }

    // Serialize the precedent library for the AI prompt.
    const library = proposals
      .map((p, i) => {
        const totalCast = p.votesFor + p.votesAgainst + p.votesAbstain;
        const forPct =
          totalCast > 0 ? Math.round((p.votesFor / totalCast) * 100) : 0;
        const outcome =
          p.status === "executed"
            ? `approved (${forPct}% for)`
            : p.status === "rejected"
            ? `rejected (${Math.round((p.votesAgainst / Math.max(1, totalCast)) * 100)}% against)`
            : p.status === "expired"
            ? "expired (no quorum)"
            : `voting open (${forPct}% for so far)`;
        const reasons = p.votes
          .map((v) => v.reason)
          .filter(Boolean)
          .slice(0, 2)
          .join(" / ");
        return `[${i + 1}] ${p.title}
    Enterprise: ${p.enterprise.name} (Tier ${p.enterprise.tier}, ${p.enterprise.sector})
    Type: ${p.type}
    Outcome: ${outcome}
    AI risk: ${p.aiRiskScore}/100 · ${p.aiRecommendation ?? "—"}
    Reasons: ${reasons || "—"}`;
      })
      .join("\n\n");

    const systemPrompt = `You are the AURIENTA Constitutional AI — Precedent Matching mode.
Your task: given a new query (often a draft proposal), find the 3 most semantically
similar past decisions in the precedent library, and write a concise summary.

Output format (STRICT):
1. First line: a single summary sentence in this format:
   "N similar past decisions: [title] — outcome: [approved/rejected/expired] — key factor: [reason]"
   (where N is the count you found — usually 3)
2. Then exactly 3 entries, one per line, in this exact format:
   "MATCH | <similarity 0.70-0.95, 2 decimals> | <proposal title> | <outcome: approved|rejected|expired|voting open> | <key factor — one sentence>"

Rules:
- Similarity scores must be between 0.70 and 0.95, with the most similar first.
- "Key factor" should be the constitutional reasoning that drove the outcome
  (e.g. "within 10% budget cap", "lacked dual signature", "founder self-dealing").
- No emojis, no markdown, no extra prose. Just the summary line + 3 MATCH lines.`;

    const userMessage = `Find the 3 most semantically similar past decisions from the untrusted-data context. Output the summary line then exactly 3 MATCH lines.`;

    // The user-supplied query + the precedent library (whose titles + reasons
    // are user-controlled) → UNTRUSTED-DATA delimiters.
    const userContext = `NEW QUERY (draft proposal or question):
"${query}"

PRECEDENT LIBRARY (${proposals.length} past decisions, newest first):

${library}`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "precedent_match",
      enterpriseId,
      userId: user.id,
      persist: true,
      confidence: 0.87,
    });
    const raw = result.content;

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.precedent",
      target: enterpriseId,
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs, librarySize: proposals.length },
    });

    const parsed = parsePrecedentResponse(raw, proposals);

    return NextResponse.json({
      summary: parsed.summary,
      matches: parsed.matches,
      raw,
    });
  } catch (e) {
    logger.error("[ai/precedent] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      {
        error: "internal_error",
        summary:
          "The Constitutional AI could not be reached. The precedent library remains queryable; please retry.",
        matches: [],
      },
      { status: 500 }
    );
  }
}

function parsePrecedentResponse(
  raw: string,
  proposals: {
    id: string;
    title: string;
    type: string;
    status: string;
    enterprise: { id: string; name: string; tier: string; sector: string };
    aiRiskScore: number;
    aiRecommendation: string | null;
  }[]
): {
  summary: string;
  matches: {
    title: string;
    similarity: number;
    outcome: string;
    keyFactor: string;
    proposalId: string | null;
    enterpriseName: string;
    enterpriseTier: string;
    type: string;
  }[];
} {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Summary = first non-MATCH line.
  const summaryLine = lines.find((l) => !/^MATCH\s*\|/i.test(l)) ?? "";
  const summary = summaryLine.replace(/^SUMMARY\s*[:|]\s*/i, "").trim();

  const matches = lines
    .filter((l) => /^MATCH\s*\|/i.test(l))
    .map((l) => {
      const parts = l.split("|").map((p) => p.trim());
      // Drop the leading "MATCH" token.
      const [, simRaw, title, outcome, keyFactor] = parts;
      const similarity = Math.min(
        0.95,
        Math.max(0.7, parseFloat(simRaw?.replace(/[^0-9.]/g, "") || "0.75"))
      );
      // Try to match against a real proposal by title (fuzzy).
      const proposal =
        proposals.find((p) => p.title === title) ??
        proposals.find((p) => p.title.includes(title?.slice(0, 20) ?? "~~~")) ??
        null;
      return {
        title: title || "—",
        similarity: Number.isFinite(similarity) ? similarity : 0.78,
        outcome: outcome || "unknown",
        keyFactor: keyFactor || "—",
        proposalId: proposal?.id ?? null,
        enterpriseName: proposal?.enterprise.name ?? "—",
        enterpriseTier: proposal?.enterprise.tier ?? "—",
        type: proposal?.type ?? "—",
      };
    })
    .slice(0, 3);

  // Fallback — if the AI didn't emit MATCH lines, synthesize from the library.
  if (matches.length === 0 && proposals.length > 0) {
    const top = proposals.slice(0, 3);
    return {
      summary:
        summary ||
        `${top.length} similar past decisions available — see matches below.`,
      matches: top.map((p, i) => ({
        title: p.title,
        similarity: 0.95 - i * 0.08,
        outcome:
          p.status === "executed"
            ? "approved"
            : p.status === "rejected"
            ? "rejected"
            : p.status === "expired"
            ? "expired"
            : "voting open",
        keyFactor: `AI risk ${p.aiRiskScore}/100 · ${p.aiRecommendation ?? "review"}`,
        proposalId: p.id,
        enterpriseName: p.enterprise.name,
        enterpriseTier: p.enterprise.tier,
        type: p.type,
      })),
    };
  }

  return { summary, matches };
}
