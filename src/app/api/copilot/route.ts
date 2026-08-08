import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { CONSTITUTIONAL_HASH, stsLevel, TIER_META, STAGE_META } from "@/lib/aurienta/constants";
import { egp } from "@/lib/aurienta/format";
import { askConstitutionalAI } from "@/lib/aurienta/ai";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK_REPLY =
  "I'm operating in fail-secure mode and cannot reach the constitutional model right now. " +
  "Per Article III, all high-risk decisions still require human confirmation in the meantime. " +
  "Please retry in a moment — the CRE remains online and your ledger is intact.";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "not authenticated" }, { status: 401 });
    }

    // Rate limit — copilot has its own (tighter) bucket.
    const hit = limiters.copilot(user.id);
    if (!hit.allowed) return rateLimitedResponse(hit.resetAt);

    const body = await req.json().catch(() => ({}));
    const message: string = (body?.message ?? "").toString().trim();
    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    // Persist the user's message immediately (immutable audit trail).
    await db.copilotChat.create({
      data: {
        userId: user.id,
        role: "user",
        content: message,
        context: JSON.stringify({ source: "dashboard" }),
      },
    });

    // Load the user's constitutional context: memberships, shareholdings,
    // open proposals they can vote on. Ground the AI in real ledger data.
    // NOTE: these are USER-CONTROLLED / user-specific values — they must
    // be passed via `userContext` (delimited UNTRUSTED DATA) so a malicious
    // enterprise name or proposal title cannot inject instructions.
    const enterpriseIds = user.memberships.map((m) => m.enterpriseId);
    const enterprises = enterpriseIds.length
      ? await db.enterprise.findMany({
          where: { id: { in: enterpriseIds } },
          select: {
            id: true,
            name: true,
            tier: true,
            stage: true,
            sector: true,
            healthRating: true,
            healthScore: true,
            graduationReadiness: true,
            lawFirmClientAccountBalanceEgp: true,
            monthlyBurnEgp: true,
            monthlyRevenueEgp: true,
            revenueGrowthPct: true,
            grossMarginPct: true,
            nosiCompliantPct: true,
            policeClearanceValid: true,
            platformFeePct: true,
            consultingFeePct: true,
            equityUnitPriceEgp: true,
            totalEquityUnits: true,
            status: true,
          },
        })
      : [];

    const shareholdings = await db.ownershipRecord.findMany({
      where: { userId: user.id, equityUnits: { gt: 0 } },
      include: { enterprise: { select: { name: true, tier: true, equityUnitPriceEgp: true } } },
    });

    const openProposals = await db.proposal.findMany({
      where: { enterpriseId: { in: enterpriseIds }, status: "voting_open" },
      include: { enterprise: { select: { name: true } } },
      orderBy: { votingEndsAt: "asc" },
      take: 6,
    });

    const sts = stsLevel(user.sovereignTrustScore);

    // Clean, developer-authored system prompt. No user-controlled text here.
    const systemPrompt = [
      "You are the AURIENTA Constitutional Copilot — an institutional AI assistant embedded in",
      "AURIENTA, the world's first constitutional enterprise infrastructure.",
      "",
      "CORE PRINCIPLES (never contradict these):",
      "1. Zero Custody (Rule I 1.1, non-amendable): AURIENTA never holds enterprise funds. All capital sits",
      "   in Law Firm Client Accounts. CRE rejects any transfer to an AURIENTA-owned account.",
      "2. AI as Enforcer, Not Decider: you (the CRE) enforce constitutional rules deterministically,",
      "   but high-risk actions (large expenses, share transfers, graduation) REQUIRE human confirmation.",
      "3. Immutable ledger: every action — share issued, expense approved, proposal executed, dividend paid —",
      "   is appended to a SHA3-256 hash-chained ledger that cannot be edited or reversed.",
      "4. Constitutional tiers A-F govern Capital Formation caps, Founding Operator equity, audit frequency and ERP needs.",
      "5. Graduation: enterprises reaching Stage 3 + readiness ≥90 + 75% supermajority may graduate from the Constitutional Infrastructure",
      "   with a signed Sovereign Export Package (cap table + ledger + verification script).",
      "",
      "INSTITUTIONAL VOICE:",
      "- Concise, dignified, Egyptian-institutional. No hype, no emojis, no marketing language.",
      "- Cite the relevant constitutional concept (CRE, Law Firm Client Account, ledger, Zero Custody, Article I/III/VII,",
      "  NOSI, police clearance, graduation gates) when relevant.",
      "- Quantify in EGP. Use the user's real numbers when available.",
      "- If a request would violate a constitutional rule, refuse and explain which rule.",
      "- Never invent enterprises, share counts, or balances not provided in the context.",
      "",
      `CONSTITUTIONAL ANCHOR: ${CONSTITUTIONAL_HASH}`,
      "",
      "Answer the user's latest message. Be specific, grounded, and refuse any action that violates the",
      "constitution. If the user asks for an action requiring human confirmation (e.g. approve an expense,",
      "publish a proposal, call a graduation vote), give them the precise constitutional path — never",
      "execute the action yourself.",
    ].join("\n");

    // User-controlled / user-specific context — passed as UNTRUSTED DATA.
    // Enterprise names, proposal titles, and the user's own message all
    // flow through this delimited section so the model cannot be prompt-
    // injected by a malicious value.
    const userContext = [
      "USER CONTEXT:",
      `- Name: ${user.legalName}`,
      `- Email: ${user.email}`,
      `- Sovereign Trust Score: ${user.sovereignTrustScore}/100 — ${sts.name}`,
      `- Verification level: ${user.verificationLevel}`,
      `- Active role(s): ${[...new Set(user.memberships.map((m) => m.role))].join(", ") || "none"}`,
      "",
      enterprises.length
        ? "ENTERPRISES (this user is a member):"
        : "ENTERPRISES: none yet — the user has not joined or founded any enterprise.",
      ...enterprises.map(
        (e) =>
          `• ${e.name} — Tier ${e.tier} (${TIER_META[e.tier]?.name ?? "—"}), stage ${e.stage} ` +
          `(${STAGE_META[e.stage]?.name ?? e.stage}), sector ${e.sector}, health ${e.healthRating ?? "—"} ` +
          `(${e.healthScore}/100), readiness ${e.graduationReadiness}/100, Law Firm Client Account balance ${egp(e.lawFirmClientAccountBalanceEgp)}, ` +
          `monthly burn ${egp(e.monthlyBurnEgp)}, revenue ${egp(e.monthlyRevenueEgp)} (growth ${e.revenueGrowthPct}%, ` +
          `margin ${e.grossMarginPct}%), NOSI ${e.nosiCompliantPct}%, police clearance ${e.policeClearanceValid ? "valid" : "invalid"}, ` +
          `fees ${e.platformFeePct}% + ${e.consultingFeePct}% consulting, CPP (Equity Unit Price) ${egp(e.equityUnitPriceEgp)}, ` +
          `${e.totalEquityUnits.toLocaleString()} Equity Units, status ${e.status}.`
      ),
      "",
      shareholdings.length
        ? "SHAREHOLDINGS:"
        : "SHAREHOLDINGS: none yet.",
      ...shareholdings.map(
        (s) => `• ${s.equityUnits.toLocaleString()} Equity Units of ${s.enterprise.name} (Tier ${s.enterprise.tier}) ` +
          `@ ${egp(s.enterprise.equityUnitPriceEgp)} = ${egp(s.equityUnits * s.enterprise.equityUnitPriceEgp)} market value.`
      ),
      "",
      openProposals.length
        ? "OPEN PROPOSALS (voting now):"
        : "OPEN PROPOSALS: none currently open.",
      ...openProposals.map(
        (p) => `• ${p.enterprise.name} — "${p.title}" [type ${p.type}, threshold ${p.passThreshold}%, ` +
          `quorum ${p.quorumPct}%, voting ends ${p.votingEndsAt.toISOString()}, for ${p.votesFor.toLocaleString()} ` +
          `of ${p.totalVotingPower.toLocaleString()} power].`
      ),
    ].join("\n");

    // Call the constitutional AI — system prompt is always the constitutional
    // one (cannot be overridden); user context is delivered as UNTRUSTED DATA.
    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage: message,
      userContext,
      kind: "copilot",
      userId: user.id,
      persist: true,
      confidence: 0.85,
    });

    let reply = result.content;
    if (result.fellBack || !reply) reply = FALLBACK_REPLY;

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.copilot",
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs },
    });

    // Persist the assistant's reply.
    await db.copilotChat.create({
      data: {
        userId: user.id,
        role: "assistant",
        content: reply,
        context: JSON.stringify({
          model: "z-ai",
          anchor: CONSTITUTIONAL_HASH.slice(0, 12),
          fellBack: result.fellBack,
        }),
      },
    });

    return NextResponse.json({ reply });
  } catch (err) {
    logger.error("[copilot] route error:", { err: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: "internal_error", reply: FALLBACK_REPLY },
      { status: 500 }
    );
  }
}
