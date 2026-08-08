import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { askConstitutionalAI, buildEnterpriseContext } from "@/lib/aurienta/ai";
import { egp, pct } from "@/lib/aurienta/format";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Roles permitted to view the Partner CRM (per the ENGAGEMENT-FEATURES spec).
const CRM_ROLES = new Set(["founding_operator", "company_owner"]);

type PartnerRow = {
  userId: string;
  name: string;
  ownershipPct: number;
  engagementScore: number;
  churnRisk: "low" | "medium" | "high";
  recommendation: string;
  votesParticipated: number;
  sessionCount: number;
  copilotQueries: number;
  equityUnits: number;
};

/**
 * POST /api/ai/partner-insights
 * Body: { enterpriseId }
 *
 * Fetches every shareholder of the enterprise, enriches each with their
 * voting participation, session count, and copilot usage (from the
 * PartnerEngagement table, falling back to live aggregates when the row
 * is stale or missing), then asks the Brain AI (consensus mode) to
 * generate an engagement score (0–100), churn risk (low/medium/high),
 * and a one-sentence recommendation per partner.
 *
 * Persists the resulting scores back to the PartnerEngagement table so
 * the CRM dashboard can read them without re-querying the AI.
 *
 * RBAC: founding_operator + company_owner only.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const hit = limiters.ai(user.id);
    if (!hit.allowed) return rateLimitedResponse(hit.resetAt);

    const body = await req.json().catch(() => ({}));
    const enterpriseId: string = (body?.enterpriseId ?? "").toString();
    if (!enterpriseId) {
      return NextResponse.json({ error: "enterpriseId required" }, { status: 400 });
    }

    // ── RBAC ──
    const userMemberships = user.memberships.filter((m) => m.enterpriseId === enterpriseId);
    if (userMemberships.length === 0) {
      return NextResponse.json({ error: "forbidden: not a member" }, { status: 403 });
    }
    const userRoles = userMemberships.map((m) => m.role);
    if (!userRoles.some((r) => CRM_ROLES.has(r))) {
      await audit({
        actorId: user.id,
        action: "ai.partner-insights",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: "role_not_permitted",
        metadata: { userRoles },
      });
      return NextResponse.json(
        { error: "Forbidden: requires founding_operator or company_owner role" },
        { status: 403 }
      );
    }

    const ent = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: {
        id: true,
        name: true,
        totalEquityUnits: true,
        raisedEgp: true,
        fundraisingGoalEgp: true,
      },
    });
    if (!ent) {
      return NextResponse.json({ error: "enterprise_not_found" }, { status: 404 });
    }

    // ── Fetch shareholders + their engagement rows + live activity metrics ──
    const shareholders = await db.ownershipRecord.findMany({
      where: { enterpriseId, equityUnits: { gt: 0 } },
      include: {
        user: {
          select: {
            id: true,
            legalName: true,
            sovereignTrustScore: true,
            tier: true,
          },
        },
      },
    });

    if (shareholders.length === 0) {
      return NextResponse.json({
        partners: [],
        summary: {
          total: 0,
          avgEngagement: 0,
          highRisk: 0,
        },
      });
    }

    const userIds = shareholders.map((s) => s.userId);

    const [engagementRows, voteCounts, sessionCounts, copilotCounts] = await Promise.all([
      db.partnerEngagement.findMany({
        where: { enterpriseId, userId: { in: userIds } },
      }),
      db.vote.groupBy({
        by: ["userId"],
        where: {
          userId: { in: userIds },
          proposal: { enterpriseId },
        },
        _count: { _all: true },
      }),
      db.session.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, revokedAt: null },
        _count: { _all: true },
      }),
      db.copilotChat.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _count: { _all: true },
      }),
    ]);

    const engagementByUser = new Map(engagementRows.map((e) => [e.userId, e]));
    const voteByUser = new Map(voteCounts.map((v) => [v.userId, v._count._all]));
    const sessionByUser = new Map(sessionCounts.map((s) => [s.userId, s._count._all]));
    const copilotByUser = new Map(copilotCounts.map((c) => [c.userId, c._count._all]));

    const totalEquityUnits = ent.totalEquityUnits || 1;

    // ── Build the partner dossier for the Brain AI ──
    const partnerDossier = shareholders.map((s) => {
      const eng = engagementByUser.get(s.userId);
      const votes = voteByUser.get(s.userId) ?? 0;
      const sessions = sessionByUser.get(s.userId) ?? 0;
      const copilot = copilotByUser.get(s.userId) ?? 0;
      const ownershipPct = (s.equityUnits / totalEquityUnits) * 100;
      return {
        userId: s.userId,
        name: s.user.legalName,
        sts: s.user.sovereignTrustScore,
        equityUnits: s.equityUnits,
        ownershipPct: Number(ownershipPct.toFixed(2)),
        votesParticipated: votes,
        sessionCount: sessions,
        copilotQueries: copilot,
        lastActiveAt: eng?.lastActiveAt?.toISOString() ?? null,
        priorScore: eng?.engagementScore ?? null,
        priorChurnRisk: eng?.churnRisk ?? null,
      };
    });

    const ctx = await buildEnterpriseContext(enterpriseId);

    // ── Brain AI (consensus mode) — analyse every partner in one call ──
    const systemPrompt = `You are the AURIENTA Partner Engagement Analyst. For each capital partner in the dossier below, compute:
1. engagementScore (0–100) — based on vote participation, session recency/frequency, copilot usage, and ownership size.
2. churnRisk — "low" (≥70), "medium" (40–69), "high" (<40).
3. recommendation — ONE short sentence (max 120 chars) with a concrete next-step to nurture or re-engage this partner.

SCORING HEURISTIC (use as starting point, then apply judgement):
- 0 votes + 0 sessions + 0 copilot → score 15–25 (high churn risk).
- Active in last 7 days with votes + copilot → score 75+.
- Owns ≥5% but inactive 30+ days → flag as high churn risk regardless.

OUTPUT FORMAT (strict — the UI parses this). Output ONE JSON object on a single line per partner, exactly:
{"userId":"<id>","engagementScore":<int 0-100>,"churnRisk":"low|medium|high","recommendation":"<one sentence>"}

Output one partner per line. No markdown, no code fences, no preamble. If a partner's userId contains characters that break JSON, escape them properly.`;

    const userMessage = `Analyse each partner and output the JSON lines now.`;

    const userContext = `Enterprise context:
${ctx}

Capital Participated (Capital Participated): ${egp(ent.raisedEgp, { compact: true })} of ${egp(ent.fundraisingGoalEgp, { compact: true })} (${pct((ent.raisedEgp / Math.max(ent.fundraisingGoalEgp, 1)) * 100, 0)})

Partner dossier (${partnerDossier.length} partners):
${partnerDossier
  .map(
    (p) =>
      `• userId=${p.userId} | name="${p.name}" | STS=${p.sts} | shares=${p.equityUnits} | ownership=${p.ownershipPct}% | votes=${p.votesParticipated} | sessions=${p.sessionCount} | copilot=${p.copilotQueries} | lastActive=${p.lastActiveAt ?? "never"} | priorScore=${p.priorScore ?? "n/a"} | priorRisk=${p.priorChurnRisk ?? "n/a"}`
  )
  .join("\n")}`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "advisory",
      userId: user.id,
      enterpriseId,
      persist: true,
      confidence: 0.83,
    });

    // ── Parse the JSON-lines response ──
    const parsed: PartnerRow[] = [];
    const lines = (result.content ?? "").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("{")) continue;
      try {
        const obj = JSON.parse(trimmed);
        if (!obj.userId) continue;
        const dossier = partnerDossier.find((p) => p.userId === obj.userId);
        if (!dossier) continue;
        const score = Math.max(0, Math.min(100, parseInt(String(obj.engagementScore ?? 0), 10) || 0));
        const riskRaw = String(obj.churnRisk ?? "medium").toLowerCase();
        const churnRisk: PartnerRow["churnRisk"] =
          riskRaw === "low" || riskRaw === "high" ? riskRaw : "medium";
        parsed.push({
          userId: obj.userId,
          name: dossier.name,
          ownershipPct: dossier.ownershipPct,
          engagementScore: score,
          churnRisk,
          recommendation: String(obj.recommendation ?? "").slice(0, 280),
          votesParticipated: dossier.votesParticipated,
          sessionCount: dossier.sessionCount,
          copilotQueries: dossier.copilotQueries,
          equityUnits: dossier.equityUnits,
        });
      } catch {
        // Skip malformed lines — the AI sometimes wraps JSON in prose.
      }
    }

    // ── Fallback: if the AI returned no parseable rows, use a heuristic ──
    if (parsed.length === 0) {
      for (const p of partnerDossier) {
        const score = Math.min(
          100,
          25 + p.votesParticipated * 10 + p.sessionCount * 5 + p.copilotQueries * 3
        );
        const churnRisk: PartnerRow["churnRisk"] =
          score >= 70 ? "low" : score >= 40 ? "medium" : "high";
        parsed.push({
          userId: p.userId,
          name: p.name,
          ownershipPct: p.ownershipPct,
          engagementScore: score,
          churnRisk,
          recommendation:
            churnRisk === "high"
              ? "Send a personal re-engagement note and surface the latest enterprise update."
              : churnRisk === "medium"
                ? "Nudge with this quarter's board briefing and a copilot prompt."
                : "Recognise as a Constitutional Pillar — invite to next milestone celebration.",
          votesParticipated: p.votesParticipated,
          sessionCount: p.sessionCount,
          copilotQueries: p.copilotQueries,
          equityUnits: p.equityUnits,
        });
      }
    }

    // ── Persist the AI scores back to PartnerEngagement (upsert) ──
    await Promise.all(
      parsed.map((p) =>
        db.partnerEngagement.upsert({
          where: {
            enterpriseId_userId: { enterpriseId, userId: p.userId },
          },
          update: {
            engagementScore: p.engagementScore,
            churnRisk: p.churnRisk,
            aiInsight: p.recommendation,
            lastAiUpdate: new Date(),
            votesParticipated: p.votesParticipated,
            sessionCount: p.sessionCount,
            copilotQueries: p.copilotQueries,
            lastActiveAt: new Date(),
          },
          create: {
            enterpriseId,
            userId: p.userId,
            engagementScore: p.engagementScore,
            churnRisk: p.churnRisk,
            aiInsight: p.recommendation,
            lastAiUpdate: new Date(),
            votesParticipated: p.votesParticipated,
            sessionCount: p.sessionCount,
            copilotQueries: p.copilotQueries,
            lastActiveAt: new Date(),
          },
        })
      )
    );

    const avgEngagement = parsed.length
      ? Math.round(parsed.reduce((s, p) => s + p.engagementScore, 0) / parsed.length)
      : 0;
    const highRisk = parsed.filter((p) => p.churnRisk === "high").length;

    await audit({
      actorId: user.id,
      action: "ai.partner-insights",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      metadata: {
        partners: parsed.length,
        avgEngagement,
        highRisk,
        fellBack: result.fellBack,
        latencyMs: result.latencyMs,
      },
    });

    return NextResponse.json({
      partners: parsed,
      summary: {
        total: parsed.length,
        avgEngagement,
        highRisk,
      },
      generatedAt: new Date().toISOString(),
      fellBack: result.fellBack,
    });
  } catch (e) {
    logger.error("[partner-insights] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
