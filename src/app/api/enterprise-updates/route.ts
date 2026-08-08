import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { askConstitutionalAI } from "@/lib/aurienta/ai";
import { egp, pct } from "@/lib/aurienta/format";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Roles allowed to post enterprise updates (per the ENGAGEMENT-FEATURES spec).
const UPDATE_AUTHOR_ROLES = new Set([
  "founding_operator",
  "manager",
  "board_member",
  "company_owner",
]);

// Milestone thresholds (in % of Capital Formation goal). Crossing any of these
// auto-triggers a celebratory update with `isMilestone: true`.
const MILESTONE_THRESHOLDS = [25, 50, 75, 100] as const;

/**
 * GET /api/enterprise-updates?enterpriseId=...&page=1&pageSize=20
 *
 * Lists updates for an enterprise, newest first. Each row includes the
 * author's legal name, AI summary, and AI sentiment (positive / neutral /
 * negative). Authentication is required; the requester must be a member
 * of the enterprise OR hold shares in it.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const enterpriseId = url.searchParams.get("enterpriseId");
    if (!enterpriseId) {
      return NextResponse.json({ error: "enterpriseId required" }, { status: 400 });
    }
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20", 10) || 20));

    // Membership OR shareholding check — capital partners who own shares can
    // read updates even without an explicit EnterpriseMember row.
    const isMember = user.memberships.some((m) => m.enterpriseId === enterpriseId);
    const isShareholder = user.ownershipRecords.some((s) => s.enterprise.id === enterpriseId);
    if (!isMember && !isShareholder) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const [updates, total] = await Promise.all([
      db.enterpriseUpdate.findMany({
        where: { enterpriseId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: {
            select: { legalName: true, avatarColor: true, primaryIntent: true },
          },
        },
      }),
      db.enterpriseUpdate.count({ where: { enterpriseId } }),
    ]);

    return NextResponse.json({
      updates: updates.map((u) => ({
        id: u.id,
        enterpriseId: u.enterpriseId,
        title: u.title,
        body: u.body,
        attachmentsCid: u.attachmentsCid,
        aiSummary: u.aiSummary,
        aiAudienceCapital: u.aiAudienceCapital,
        aiAudienceCompliance: u.aiAudienceCompliance,
        aiSentiment: u.aiSentiment,
        isMilestone: u.isMilestone,
        milestoneType: u.milestoneType,
        createdAt: u.createdAt.toISOString(),
        author: {
          legalName: u.author.legalName,
          avatarColor: u.author.avatarColor,
          primaryIntent: u.author.primaryIntent,
        },
      })),
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    });
  } catch (e) {
    logger.error("[enterprise-updates] GET error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

/**
 * POST /api/enterprise-updates
 * Body: { enterpriseId, title, body, attachmentsCid? }
 *
 * Creates a new update. RBAC: founding_operator / manager / board_member /
 * company_owner only. After persisting, the Brain AI generates a one-sentence
 * summary for capital partners (stored in `aiSummary` + `aiAudienceCapital`)
 * and a sentiment tag (`aiSentiment`). All capital partners of the enterprise
 * receive a notification. The write is wrapped in a single transaction with
 * `appendLedgerEvent`. If the enterprise has just crossed a Capital Formation
 * milestone (25/50/75/100%), a second celebratory update is auto-created
 * with `isMilestone: true` and a Brain-AI-generated message.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    // ── Rate limit — governance bucket (updates are governance-class) ──
    const rl = limiters.governance(user.id);
    if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

    const body = await req.json().catch(() => ({}));
    const enterpriseId: string = (body?.enterpriseId ?? "").toString();
    const title: string = (body?.title ?? "").toString().trim();
    const rawBody: string = (body?.body ?? "").toString().trim();
    const attachmentsCid: string | null = body?.attachmentsCid ? String(body.attachmentsCid).trim() : null;
    if (!enterpriseId || !title || !rawBody) {
      return NextResponse.json(
        { error: "enterpriseId + title + body required" },
        { status: 400 }
      );
    }
    if (title.length > 200 || rawBody.length > 16000) {
      return NextResponse.json(
        { error: "title (≤200 chars) or body (≤16000 chars) too long" },
        { status: 400 }
      );
    }

    // ── RBAC ──
    const userMemberships = user.memberships.filter((m) => m.enterpriseId === enterpriseId);
    if (userMemberships.length === 0) {
      return NextResponse.json({ error: "forbidden: not a member" }, { status: 403 });
    }
    const userRoles = userMemberships.map((m) => m.role);
    const hasAuthorRole = userRoles.some((r) => UPDATE_AUTHOR_ROLES.has(r));
    if (!hasAuthorRole) {
      await audit({
        actorId: user.id,
        action: "enterprise-update.create",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: "role_not_permitted",
        metadata: { userRoles },
      });
      return NextResponse.json(
        { error: "Forbidden: requires founding_operator, manager, board_member, or company_owner role" },
        { status: 403 }
      );
    }

    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: {
        id: true,
        name: true,
        slug: true,
        raisedEgp: true,
        fundraisingGoalEgp: true,
        totalEquityUnits: true,
        equityUnitPriceEgp: true,
      },
    });
    if (!enterprise) {
      return NextResponse.json({ error: "enterprise_not_found" }, { status: 404 });
    }

    // ── Resolve all capital partners (members with capital_partner role +
    //     shareholders) for notification fan-out. ──
    const [partnerMembers, shareholders] = await Promise.all([
      db.enterpriseMember.findMany({
        where: { enterpriseId, role: "capital_partner" },
        select: { userId: true },
      }),
      db.ownershipRecord.findMany({
        where: { enterpriseId, equityUnits: { gt: 0 } },
        select: { userId: true },
      }),
    ]);
    const partnerUserIds = Array.from(
      new Set([
        ...partnerMembers.map((m) => m.userId),
        ...shareholders.map((s) => s.userId),
      ])
    ).filter((id) => id !== user.id);

    // ── Brain AI: generate summary + sentiment (advisory, persisted) ──
    // The title + body are user-controlled text → passed via userContext.
    const summaryPrompt =
      "Summarize this enterprise update in 1 sentence for capital partners. Then on a new line write 'SENTIMENT: positive|neutral|negative' reflecting the tone of the update.";
    const aiResult = await askConstitutionalAI({
      systemPrompt: summaryPrompt,
      userMessage: "Output the 1-sentence summary and the sentiment label.",
      userContext: `Update title: ${title}\n\nUpdate body:\n${rawBody}`,
      kind: "advisory",
      userId: user.id,
      enterpriseId,
      persist: true,
      confidence: 0.82,
    });

    // Parse the AI response: first line(s) = summary, last line = SENTIMENT: <label>.
    const aiText = aiResult.content?.trim() ?? "";
    const sentimentMatch = aiText.match(/SENTIMENT:\s*(positive|neutral|negative)\b/i);
    const aiSentiment = sentimentMatch
      ? sentimentMatch[1].toLowerCase()
      : "neutral";
    // Strip the sentiment line from the summary if present.
    const aiSummary = aiText
      .replace(/SENTIMENT:\s*(positive|neutral|negative)\b.*$/im, "")
      .replace(/\n{2,}/g, " ")
      .trim()
      .slice(0, 600);
    const aiAudienceCapital = aiSummary || "Update posted for capital partners.";

    // ── Persist update + ledger event + notifications inside ONE transaction ──
    const created = await db.$transaction(async (tx) => {
      const update = await tx.enterpriseUpdate.create({
        data: {
          enterpriseId,
          authorId: user.id,
          title,
          body: rawBody,
          attachmentsCid,
          aiSummary,
          aiAudienceCapital,
          aiAudienceCompliance: aiSummary, // same summary, surfaced separately for FRA
          aiSentiment,
        },
      });

      await appendLedgerEvent(tx, {
        enterpriseId,
        eventType: "enterprise_update_posted",
        payload: {
          updateId: update.id,
          title,
          sentiment: aiSentiment,
          authorId: user.id,
          attachmentCid: attachmentsCid,
        },
        actorId: user.id,
      });

      // Fan-out notifications to all capital partners.
      if (partnerUserIds.length > 0) {
        await tx.notification.createMany({
          data: partnerUserIds.map((uid) => ({
            userId: uid,
            enterpriseId,
            title: `New update: ${title.slice(0, 80)}`,
            body: aiAudienceCapital.slice(0, 280),
            category: "governance",
            aiPriority: aiSentiment === "negative" ? "high" : "medium",
            aiSummary: aiAudienceCapital.slice(0, 280),
          })),
        });
      }

      return update;
    });

    // ── Milestone celebration check ──
    // If the enterprise just crossed 25/50/75/100% of its Capital Formation goal,
    // auto-create a celebratory milestone update. We detect a fresh crossing
    // by checking that no milestone update of that type already exists for
    // this enterprise.
    const goalPct =
      enterprise.fundraisingGoalEgp > 0
        ? (enterprise.raisedEgp / enterprise.fundraisingGoalEgp) * 100
        : 0;
    let milestoneUpdate: { id: string; milestoneType: string | null } | null = null;
    const crossed = MILESTONE_THRESHOLDS.find((t) => goalPct >= t);
    if (crossed) {
      const milestoneType = `${crossed}pct`;
      const existing = await db.enterpriseUpdate.findFirst({
        where: { enterpriseId, isMilestone: true, milestoneType },
        select: { id: true },
      });
      if (!existing) {
        const celeb = await askConstitutionalAI({
          systemPrompt:
            "You are the AURIENTA milestone celebrator. Generate a 2-sentence celebratory update for capital partners announcing that the enterprise has crossed a Capital Formation milestone. Be warm, dignified, and reference the constitutional partnership. No emojis.",
          userMessage: `Announce that ${enterprise.name} has crossed ${crossed}% of its Capital Formation goal (${egp(enterprise.raisedEgp, { compact: true })} Capital Participated of ${egp(enterprise.fundraisingGoalEgp, { compact: true })}). Output ONLY the 2-sentence celebration message.`,
          kind: "advisory",
          userId: user.id,
          enterpriseId,
          persist: true,
          confidence: 0.85,
        });
        const celebBody =
          celeb.content?.trim().slice(0, 2000) ||
          `${enterprise.name} has crossed ${crossed}% of its Capital Formation goal. Thank you to every Constitutional Partner who made this possible.`;

        milestoneUpdate = await db.$transaction(async (tx) => {
          const m = await tx.enterpriseUpdate.create({
            data: {
              enterpriseId,
              authorId: user.id,
              title: `Milestone reached — ${pct(crossed, 0)} of goal`,
              body: celebBody,
              aiSummary: celebBody.slice(0, 280),
              aiAudienceCapital: celebBody.slice(0, 280),
              aiAudienceCompliance: celebBody.slice(0, 280),
              aiSentiment: "positive",
              isMilestone: true,
              milestoneType,
            },
          });

          await appendLedgerEvent(tx, {
            enterpriseId,
            eventType: "milestone_celebration",
            payload: {
              updateId: m.id,
              milestoneType,
              raisedEgp: enterprise.raisedEgp,
              goalEgp: enterprise.fundraisingGoalEgp,
              goalPct: Number(goalPct.toFixed(2)),
            },
            actorId: user.id,
          });

          return { id: m.id, milestoneType: m.milestoneType };
        });
      }
    }

    await audit({
      actorId: user.id,
      action: "enterprise-update.create",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      metadata: {
        updateId: created.id,
        sentiment: aiSentiment,
        notifiedPartners: partnerUserIds.length,
        milestone: milestoneUpdate?.milestoneType ?? null,
        fellBack: aiResult.fellBack,
        latencyMs: aiResult.latencyMs,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        update: {
          id: created.id,
          title: created.title,
          aiSummary: created.aiSummary,
          aiSentiment: created.aiSentiment,
          isMilestone: created.isMilestone,
          createdAt: created.createdAt.toISOString(),
        },
        milestone: milestoneUpdate,
        notifiedPartners: partnerUserIds.length,
      },
      { status: 201 }
    );
  } catch (e) {
    logger.error("[enterprise-updates] POST error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
