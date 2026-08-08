import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { askConstitutionalAI, buildEnterpriseContext } from "@/lib/aurienta/ai";
import { egp, timeAgo } from "@/lib/aurienta/format";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/board-briefing
 * Body: { enterpriseId }
 *
 * Assembles a board-meeting briefing pack: financial summary, open proposals,
 * compliance status, key person risks, action items, draft agenda. Persisted
 * as AiArtifact (kind="board_briefing").
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

    const ent = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      include: {
        members: { include: { user: { select: { legalName: true, sovereignTrustScore: true } } } },
        employees: { where: { keyPerson: true }, take: 5 },
      },
    });
    if (!ent) return NextResponse.json({ error: "enterprise not found" }, { status: 404 });

    const ctx = await buildEnterpriseContext(enterpriseId);

    const openProposals = await db.proposal.findMany({
      where: { enterpriseId, status: "voting_open" },
      orderBy: { votingEndsAt: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        votesFor: true,
        votesAgainst: true,
        votesAbstain: true,
        totalVotingPower: true,
        passThreshold: true,
        votingEndsAt: true,
      },
    });

    const recentExpenses = await db.expense.findMany({
      where: { enterpriseId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { category: true, description: true, amountEgp: true, status: true, createdAt: true },
    });

    const boardMembers = ent.members.filter((m) => m.boardSeat);
    const runwayMonths =
      ent.monthlyBurnEgp > 0 ? (ent.lawFirmClientAccountBalanceEgp / ent.monthlyBurnEgp).toFixed(1) : "—";

    const systemPrompt = `You are the AURIENTA Board Briefing Assembler — an institutional-grade assistant that prepares a board meeting pack from the enterprise's live ledger + CRE state.

Your output is a structured briefing document with the following sections (in this exact order):

## Board Briefing — <enterprise name>
**Meeting date:** <today>
**Tier / Stage / Legal form:** <from context>
**Quorum required:** 51% · expenses >10% of capital require board approval (Art. 118).

## 1. Financial Summary
A 4–5 line paragraph: monthly revenue, monthly burn, Law Firm Client Account balance, runway (months), gross margin %, revenue growth %, and one trend observation. Ground every number in the provided context.

## 2. Open Proposals
For each open proposal: title, type, current vote split (for / against / abstain / total power), pass threshold, voting ends. If none, write "No open proposals — the docket is clear."

## 3. Compliance Status
A 3-bullet block: NOSI compliance %, police clearance validity, and a recent-expense flag (any 'flagged' expenses from the list).

## 4. Key Person Risks
Name the key-person employees (if any) and assess succession-readiness in 1–2 lines each. If none are flagged keyPerson, write "No formal key-person designations on file — consider documenting at least COO and CTO succession paths."

## 5. Action Items
3–5 numbered action items the board should resolve this meeting. Each item should be concrete and reference a real number (e.g. "Approve Q3 marketing budget of 350,000 EGP — vote live, ends <date>").

## 6. Draft Agenda
A 6-item numbered agenda derived from the enterprise's constitutional cadence: 1) Quorum call, 2) Approval of prior minutes, 3) Financial review, 4) Open proposals vote, 5) Compliance + key-person review, 6) Adjournment + next meeting date.

RULES:
- Egyptian institutional voice: precise, dignified, no hype, no emojis.
- Never invent numbers. If a metric is missing, write "—".
- Length: 500–700 words.`;

    const userMessage = `Output ONLY the formatted board briefing described above.`;

    // Enterprise context + board roster + key-person list + open proposals +
    // recent expenses → UNTRUSTED-DATA delimiters (names, proposal titles,
    // expense descriptions are all user-controlled).
    const userContext = `Enterprise context (live):
${ctx}

Board members (${boardMembers.length}):
${boardMembers.map((m) => `• ${m.user.legalName} — ${m.role} (STS ${m.user.sovereignTrustScore})`).join("\n") || "• (no board seats registered)"}

Key-person employees (${ent.employees.length}):
${ent.employees.map((e) => `• ${e.position} (department ${e.department})`).join("\n") || "• (none flagged)"}

Open proposals (${openProposals.length}):
${openProposals.map((p) => `• [${p.type}] ${p.title} — for ${p.votesFor} / against ${p.votesAgainst} / abstain ${p.votesAbstain} of ${p.totalVotingPower} (threshold ${p.passThreshold}%, ends ${p.votingEndsAt.toISOString()})`).join("\n") || "• (no open proposals)"}

Recent expenses (last 5):
${recentExpenses.map((e) => `• [${e.status}] ${e.category} — ${e.description} — ${egp(e.amountEgp)} (${timeAgo(e.createdAt)})`).join("\n") || "• (no recent expenses)"}

Computed runway: ${runwayMonths} months.`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "board_briefing",
      enterpriseId,
      userId: user.id,
      persist: true,
      confidence: 0.86,
    });

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.board-briefing",
      target: enterpriseId,
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs },
    });

    return NextResponse.json({
      content: result.content,
      generatedAt: new Date().toISOString(),
      meetingDate: new Date().toISOString(),
      boardMemberCount: boardMembers.length,
      openProposalCount: openProposals.length,
    });
  } catch (e) {
    logger.error("[board-briefing] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
