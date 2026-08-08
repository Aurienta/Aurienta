import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { askConstitutionalAI } from "@/lib/aurienta/ai";
import { timeAgo } from "@/lib/aurienta/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TickerEvent = {
  id: string;
  eventType: string;
  enterpriseName: string;
  enterpriseSlug: string | null;
  timestamp: string;
  payloadHash: string;
  sequence: number;
  narration: string;
};

/**
 * GET /api/ledger/ticker?enterpriseId=...
 *
 * Returns the last 20 ledger events for an enterprise (or infrastructure-wide
 * if `enterpriseId` is omitted), each annotated with a one-sentence Brain
 * AI narration generated on-the-fly using fast (non-persisted) mode.
 *
 * Authentication required. When `enterpriseId` is provided, the requester
 * must be a member or shareholder of that enterprise. Platform-wide mode
 * is restricted to authenticated users (no cross-enterprise data leak
 * beyond what's already visible on the dashboard).
 *
 * The narration call uses `kind: "explain"` and `persist: false` per the
 * ENGAGEMENT-FEATURES spec — these are ephemeral lines for the ticker UI
 * and are not written to AiArtifact.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const enterpriseId = url.searchParams.get("enterpriseId");

    // ── Resolve enterprise + membership ──
    let enterprise: { id: string; name: string; slug: string } | null = null;
    if (enterpriseId) {
      enterprise = await db.enterprise.findUnique({
        where: { id: enterpriseId },
        select: { id: true, name: true, slug: true },
      });
      if (!enterprise) {
        return NextResponse.json({ error: "enterprise_not_found" }, { status: 404 });
      }
      const isMember = user.memberships.some((m) => m.enterpriseId === enterprise!.id);
      const isShareholder = user.ownershipRecords.some((s) => s.enterprise.id === enterprise!.id);
      if (!isMember && !isShareholder) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    // ── Fetch last 20 ledger events ──
    const events = await db.ledgerEvent.findMany({
      where: enterprise ? { enterpriseId: enterprise.id } : {},
      orderBy: { timestamp: "desc" },
      take: 20,
      include: {
        enterprise: { select: { name: true, slug: true } },
      },
    });

    if (events.length === 0) {
      return NextResponse.json({
        events: [],
        scope: enterprise ? "enterprise" : "constitutional infrastructure",
        enterpriseName: enterprise?.name ?? null,
        generatedAt: new Date().toISOString(),
      });
    }

    // ── Brain AI narration (fast, non-persisted) ──
    // We batch all 20 events into a single AI call to keep latency reasonable.
    // Each event is described as a single line; the AI returns a JSON-lines
    // response with one narrated line per event.
    const eventsBrief = events.map((e, i) => ({
      i,
      id: e.id,
      eventType: e.eventType,
      enterpriseName: e.enterprise?.name ?? "—",
      payload: e.payload,
      timestamp: e.timestamp.toISOString(),
    }));

    const systemPrompt =
      "You are the AURIENTA Live Ledger Narrator. For each ledger event, write ONE short sentence (max 100 chars) describing what happened for a live ticker. Active, journalistic voice. Reference the enterprise name and the event type. No emojis, no hashtags, no quotes.";
    const userMessage = `For each event below, output ONE JSON line: {"i":<index>,"narration":"<one sentence>"}.
Output one line per event. No markdown, no preamble, no code fences.

Events:
${eventsBrief
  .map(
    (e) =>
      `#${e.i} | enterprise="${e.enterpriseName}" | type=${e.eventType} | ts=${e.timestamp} | payload=${e.payload.slice(0, 200)}`
  )
  .join("\n")}`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      kind: "explain",
      userId: user.id,
      enterpriseId: enterprise?.id,
      persist: false,
    });

    // ── Parse narrations ──
    const narrationByIndex = new Map<number, string>();
    for (const line of (result.content ?? "").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("{")) continue;
      try {
        const obj = JSON.parse(trimmed);
        if (typeof obj.i === "number" && typeof obj.narration === "string") {
          narrationByIndex.set(obj.i, String(obj.narration).slice(0, 280));
        }
      } catch {
        // skip malformed
      }
    }

    // Fallback narration if the AI didn't return a line for an event.
    const fallback = (eventType: string, name: string) =>
      `${name}: ${eventType.replace(/_/g, " ")} recorded on the constitutional ledger.`;

    const tickerEvents: TickerEvent[] = events.map((e, i) => ({
      id: e.id,
      eventType: e.eventType,
      enterpriseName: e.enterprise?.name ?? "—",
      enterpriseSlug: e.enterprise?.slug ?? null,
      timestamp: e.timestamp.toISOString(),
      payloadHash: e.payloadHash,
      sequence: e.sequence,
      narration:
        narrationByIndex.get(i) ?? fallback(e.eventType, e.enterprise?.name ?? "—"),
    }));

    return NextResponse.json({
      events: tickerEvents,
      scope: enterprise ? "enterprise" : "constitutional infrastructure",
      enterpriseName: enterprise?.name ?? null,
      generatedAt: new Date().toISOString(),
      fellBack: result.fellBack,
      latencyMs: result.latencyMs,
    });
  } catch (e) {
    logger.error("[ledger/ticker] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// Suppress unused-import warning for timeAgo (retained for downstream
// consumers that may import it via this module's surface).
void timeAgo;
