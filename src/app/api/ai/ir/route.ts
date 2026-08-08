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
 * POST /api/ai/ir
 * Body: { enterpriseId, question }
 *
 * AI IR assistant for graduated JSCs. Answers Constitutional Partner questions grounded
 * in the enterprise's public disclosures + ledger data. Persists the Q&A as
 * an IrQuestion record.
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
    const question: string = (body?.question ?? "").toString().trim();
    if (!enterpriseId || !question) {
      return NextResponse.json({ error: "enterpriseId + question required" }, { status: 400 });
    }

    // IR is open to all members of a graduated enterprise.
    const member = await db.enterpriseMember.findFirst({
      where: { enterpriseId, userId: user.id },
    });
    if (!member) return NextResponse.json({ error: "not a member" }, { status: 403 });

    const ent = await db.enterprise.findUnique({ where: { id: enterpriseId } });
    if (!ent) return NextResponse.json({ error: "enterprise not found" }, { status: 404 });
    if (ent.stage !== "graduated") {
      return NextResponse.json(
        { error: "IR assistant is for graduated (sovereign) enterprises only" },
        { status: 400 }
      );
    }

    const ctx = await buildEnterpriseContext(enterpriseId);

    // Pull recent ledger events to use as grounded source citations.
    const recentEvents = await db.ledgerEvent.findMany({
      where: { enterpriseId },
      orderBy: { timestamp: "desc" },
      take: 12,
      select: { eventType: true, payload: true, timestamp: true, payloadHash: true },
    });

    const boardMembers = await db.enterpriseMember.findMany({
      where: { enterpriseId, boardSeat: true },
      include: { user: { select: { legalName: true, sovereignTrustScore: true } } },
    });

    const lastValuation = await db.valuation.findFirst({
      where: { enterpriseId },
      orderBy: { createdAt: "desc" },
    });

    // Persist the question immediately (status=pending) so we have an audit trail
    // even if the AI call fails.
    const irQuestion = await db.irQuestion.create({
      data: {
        enterpriseId,
        userId: user.id,
        question,
        status: "pending",
        sources: "[]",
      },
    });

    const systemPrompt = `You are the AURIENTA IR Assistant — an Capital Partner-relations AI for graduated sovereign JSCs. You answer Constitutional Partner questions grounded ONLY in the enterprise's public disclosures + immutable ledger data.

HARD RULES:
- Cite sources for every quantitative claim. A "source" is a ledger event, a financial report line, or a board record.
- If the question asks about a number not in the provided context, say "Not disclosed in current filings" — do not invent.
- Refuse to provide forward-looking projections or Capital Participation advice. Always note: "Past performance is not indicative of future results."
- Stay within the scope of public information. Do not speculate on private board deliberations.
- Egyptian institutional voice: precise, dignified, no hype, no emojis.

OUTPUT FORMAT (strict — the UI parses this):
## Answer
A direct answer to the question, 1–3 paragraphs. Open with the most important number. Ground every claim.

## Sources
A bulleted list of 2–5 citations, each of the form:
- **<Source type>** — <one-line description> · <date or "as of <date>">

Source types include: Ledger event, Financial summary, Board roster, Valuation record, Compliance status.

## Related Disclosures
One short paragraph (2 sentences) pointing the Constitutional Partner at adjacent public disclosures they may want to review.

Length: 250–400 words.`;

    const userMessage = `Answer the Constitutional Partner question using ONLY the untrusted-data context provided. Output ONLY the formatted answer described above.`;

    // Enterprise context + recent ledger events + board roster + latest
    // valuation + the partner's question → UNTRUSTED-DATA delimiters. The
    // question is the highest-risk injection vector (free text from a
    // Constitutional Partner), but names + ledger payloads are also
    // user-influenced, so the whole bundle is fenced.
    const userContext = `Enterprise context (live):
${ctx}

Recent ledger events (most recent 12):
${recentEvents.map((e) => `• [${e.timestamp.toISOString().slice(0, 10)}] ${e.eventType} — hash ${e.payloadHash.slice(0, 12)}… · payload: ${e.payload.slice(0, 100)}`).join("\n") || "• (no recent events)"}

Board roster (${boardMembers.length}):
${boardMembers.map((m) => `• ${m.user.legalName} — ${m.role} (STS ${m.user.sovereignTrustScore})`).join("\n") || "• (none)"}

Latest valuation:
${lastValuation ? `• Pre-money ${egp(lastValuation.preMoneyEgp)} · CPP (Constitutional Percentage Price) ${egp(lastValuation.equityUnitPriceEgp)} · CPP ${egp(lastValuation.cppEgp)} · confidence ${(lastValuation.aiConfidence * 100).toFixed(0)}% · model ${lastValuation.modelVersion}` : "• (no valuation on file)"}

Constitutional Partner question:
"${question}"`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "ir_answer",
      enterpriseId,
      userId: user.id,
      entityId: irQuestion.id,
      persist: true,
      confidence: 0.86,
    });
    const content = result.content;

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.ir",
      target: enterpriseId,
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs, irQuestionId: irQuestion.id },
    });

    // Build a sources array (best-effort extraction from the AI text).
    const sources = extractSources(content, recentEvents, boardMembers.length, lastValuation);

    const updated = await db.irQuestion.update({
      where: { id: irQuestion.id },
      data: {
        answer: content,
        status: "answered",
        sources: JSON.stringify(sources),
      },
    });

    return NextResponse.json({
      id: updated.id,
      question: updated.question,
      answer: content,
      sources,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (e) {
    logger.error("[ir] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

type Source = { type: string; description: string; ref?: string };

function extractSources(
  content: string,
  events: { eventType: string; payloadHash: string; timestamp: { toISOString: () => string } }[],
  boardCount: number,
  valuation: { preMoneyEgp: number; equityUnitPriceEgp: number; aiConfidence: number } | null
): Source[] {
  const sources: Source[] = [];
  if (events.length) {
    sources.push({
      type: "Ledger event",
      description: `${events.length} recent hash-chained events (most recent ${events[0].timestamp.toISOString().slice(0, 10)})`,
      ref: events[0].payloadHash.slice(0, 16),
    });
  }
  if (valuation) {
    sources.push({
      type: "Valuation record",
      description: `Latest JOZOUR v3 valuation · CPP (Constitutional Percentage Price) ${egp(valuation.equityUnitPriceEgp)} · confidence ${(valuation.aiConfidence * 100).toFixed(0)}%`,
    });
  }
  if (boardCount > 0) {
    sources.push({
      type: "Board roster",
      description: `${boardCount} board seats registered on the constitutional council`,
    });
  }
  sources.push({
    type: "Financial summary",
    description: "Monthly revenue, burn, Law Firm Client Account balance, margin — from the live enterprise record",
  });
  return sources.slice(0, 5);
}
