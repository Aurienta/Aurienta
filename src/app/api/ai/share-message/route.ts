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

/**
 * POST /api/ai/share-message
 * Body: { enterpriseId }
 *
 * The Brain AI generates a personalized social-share message based on the
 * enterprise's current Capital Formation state (Capital Participated / Capital Participation Goal, health, tier, sector).
 * Returns the message plus the list of supported share channels.
 *
 * RBAC: open to any authenticated user — the share button is surfaced on the
 * public enterprise profile page and on dashboard cards. Members get a richer
 * message; non-members get a public-facing variant.
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

    const ent = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: {
        id: true,
        name: true,
        slug: true,
        sector: true,
        tier: true,
        stage: true,
        healthRating: true,
        raisedEgp: true,
        fundraisingGoalEgp: true,
        equityUnitPriceEgp: true,
        tagline: true,
        description: true,
      },
    });
    if (!ent) {
      return NextResponse.json({ error: "enterprise_not_found" }, { status: 404 });
    }

    const ctx = await buildEnterpriseContext(enterpriseId);
    const goalPct = ent.fundraisingGoalEgp > 0
      ? (ent.raisedEgp / ent.fundraisingGoalEgp) * 100
      : 0;

    const isMember = user.memberships.some((m) => m.enterpriseId === enterpriseId);
    const isShareholder = user.ownershipRecords.some((s) => s.enterprise.id === enterpriseId);

    const systemPrompt = `You are the AURIENTA Social Share Composer. Generate a short, dignified social-share message (max 280 characters) that a ${isMember || isShareholder ? "Constitutional Partner" : "community supporter"} can post to invite others to learn about this enterprise on AURIENTA.

HARD RULES:
- Stay under 280 characters (Twitter-safe).
- Egyptian institutional voice: warm, dignified, no hype, no emojis, no "#hashtags" spam (max 2 hashtags).
- NEVER promise returns, guaranteed profits, or speculate. Reference "constitutional partnership" or "real-economy ownership" instead.
- Reference ONE concrete number from the context (raised amount, % of goal, health rating, or tier) to ground the message.
- End with "→ aorienta.eg/enterprise/<slug>" placeholder if no slug available — otherwise omit the link (the UI appends it).

OUTPUT: the share message text ONLY. No quotes, no preamble, no explanations.`;

    const userMessage = `Compose the share message now.`;

    // Enterprise context (live numbers) → UNTRUSTED-DATA delimiters since
    // the enterprise name + tagline are user-controlled text.
    const userContext = `Enterprise: ${ent.name}
Slug: ${ent.slug}
Tagline: ${ent.tagline ?? "—"}
Sector: ${ent.sector}
Tier: ${ent.tier} · Stage: ${ent.stage}
Health rating: ${ent.healthRating ?? "—"}
Capital Participated (Capital Participated): ${egp(ent.raisedEgp, { compact: true })} of ${egp(ent.fundraisingGoalEgp, { compact: true })} (${pct(goalPct, 0)})
Equity Unit price: ${egp(ent.equityUnitPriceEgp)} per Equity Unit

Live enterprise context:
${ctx}

Sharer relationship: ${isMember || isShareholder ? "Constitutional Partner" : "community supporter"}
Sharer name: ${user.legalName}`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "advisory",
      userId: user.id,
      enterpriseId,
      persist: true,
      confidence: 0.8,
    });

    // Clean up the AI response — strip wrapping quotes, leading labels, etc.
    const message = (result.content ?? "")
      .trim()
      .replace(/^["'`]|["'`]$/g, "")
      .replace(/^(share message|message):\s*/i, "")
      .slice(0, 600);

    await audit({
      actorId: user.id,
      action: "ai.share-message",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      metadata: {
        fellBack: result.fellBack,
        latencyMs: result.latencyMs,
        isMember,
        isShareholder,
      },
    });

    return NextResponse.json({
      message,
      channels: ["whatsapp", "twitter", "facebook", "linkedin", "telegram", "email"],
      enterprise: {
        name: ent.name,
        slug: ent.slug,
        raisedPct: Number(goalPct.toFixed(1)),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    logger.error("[share-message] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
