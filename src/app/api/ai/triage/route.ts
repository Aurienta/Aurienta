import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { askConstitutionalAI } from "@/lib/aurienta/ai";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Priority = "urgent" | "high" | "medium" | "low";

const VALID_PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];

// Rule-based fallback if the model output cannot be parsed. Keeps the
// UI functional even when the AI is unavailable.
function ruleBasedPriority(
  category: string,
  body: string
): { priority: Priority; summary: string } {
  const urgentRegex = /(ends in \d+h|expired|violation|freeze|fraud|removal|emergency)/i;
  if (category === "compliance" || urgentRegex.test(body)) {
    return { priority: "urgent", summary: "Compliance-critical — review immediately." };
  }
  if (category === "governance") {
    return { priority: "high", summary: "Governance action required — cast your vote." };
  }
  if (category === "dividend") {
    return { priority: "medium", summary: "Dividend ready — claim from portfolio." };
  }
  if (category === "treasury") {
    return { priority: "medium", summary: "Treasury update — review when convenient." };
  }
  if (category === "milestone") {
    return { priority: "medium", summary: "Milestone awaiting board review." };
  }
  return { priority: "low", summary: "Informational system update." };
}

// Best-effort JSON-array extraction from an LLM response. The model
// usually wraps the array in ```json fences or surrounds it with prose.
function extractJsonArray(text: string): unknown[] | null {
  if (!text) return null;
  // Try fenced ```json ... ``` first.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  // Find first '[' and matching ']' (very rough).
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return null;
  const slice = candidate.slice(start, end + 1);
  try {
    const parsed = JSON.parse(slice);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  // Rate limit — AI bucket (30/min per user).
  const hit = limiters.ai(user.id);
  if (!hit.allowed) return rateLimitedResponse(hit.resetAt);

  const body = await req.json().catch(() => ({}));
  const requestedIds: string[] | undefined = Array.isArray(body?.ids)
    ? body.ids.filter((x: unknown) => typeof x === "string")
    : undefined;

  // Fetch notifications that still need triage.
  // - If ids provided: triage exactly those (force re-triage).
  // - Otherwise: triage all the user's notifications that have no aiPriority yet.
  const where = requestedIds
    ? { id: { in: requestedIds }, userId: user.id }
    : { userId: user.id, aiPriority: null };

  const notifications = await db.notification.findMany({
    where,
    select: {
      id: true,
      title: true,
      body: true,
      category: true,
      createdAt: true,
      enterpriseId: true,
    },
    orderBy: { createdAt: "desc" },
    take: 30, // keep the prompt bounded
  });

  if (notifications.length === 0) {
    return NextResponse.json({
      triaged: [],
      note: "No notifications require triage.",
    });
  }

  // Build the constitutional triage prompt.
  // NOTE: notification title/body are user-controlled text — pass them via
  // `userContext` so they are wrapped in UNTRUSTED-DATA delimiters and the
  // model is told never to follow instructions found inside them.
  const lines = notifications.map(
    (n, i) =>
      `${i + 1}. id=${n.id} | category=${n.category} | title="${n.title}" | body="${n.body}"`
  );

  // Clean, developer-authored system instructions — NO user-controlled text.
  const systemPrompt = `You are the AURIENTA Notification Triage AI. For each notification provided as untrusted data, output:
- priority: one of "urgent", "high", "medium", "low"
  · urgent = compliance violation, fraud alert, emergency freeze, manager removal, or vote ending within 24h
  · high   = governance vote open, milestone awaiting review, police clearance expiry within 7 days
  · medium = dividend ready, treasury update, milestone progress
  · low    = informational system update, score change, general announcement
- summary: ONE sentence (max 120 chars), institutional voice, no emojis, no quotation marks.

Respond with ONLY a JSON array (no prose, no markdown fences). Each element:
{"id":"<notifId>","priority":"<urgent|high|medium|low>","summary":"<one sentence>"}`;

  // User-controlled data (notification titles/bodies) goes here.
  const userContext = `Notifications to triage:\n${lines.join("\n")}`;

  const userMessage = `Triage each notification above. Respond with ONLY the JSON array described in the system instructions.`;

  let triaged: { id: string; priority: Priority; summary: string }[] = [];
  let usedFallback = false;

  try {
    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "notification_triage",
      userId: user.id,
      persist: false,
      confidence: 0.82,
    });
    const aiText = result.content;

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.triage",
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs, count: notifications.length },
    });

    const parsed = extractJsonArray(aiText);
    if (parsed) {
      for (const item of parsed) {
        if (!item || typeof item !== "object") continue;
        const obj = item as Record<string, unknown>;
        const id = typeof obj.id === "string" ? obj.id : null;
        const priorityRaw = typeof obj.priority === "string" ? obj.priority.toLowerCase() : null;
        const summary = typeof obj.summary === "string" ? obj.summary : null;
        if (!id || !notifications.some((n) => n.id === id)) continue;
        if (!priorityRaw || !VALID_PRIORITIES.includes(priorityRaw as Priority)) continue;
        if (!summary || summary.length === 0) continue;
        triaged.push({
          id,
          priority: priorityRaw as Priority,
          summary: summary.slice(0, 160),
        });
      }
    }

    // If the AI completely failed to parse, fall back to rule-based for all.
    if (triaged.length === 0) {
      usedFallback = true;
      triaged = notifications.map((n) => ({
        id: n.id,
        ...ruleBasedPriority(n.category, n.body),
      }));
    } else {
      // Backfill any notifications the AI skipped with rule-based triage.
      const seen = new Set(triaged.map((t) => t.id));
      for (const n of notifications) {
        if (seen.has(n.id)) continue;
        triaged.push({ id: n.id, ...ruleBasedPriority(n.category, n.body) });
        usedFallback = true;
      }
    }
  } catch {
    usedFallback = true;
    triaged = notifications.map((n) => ({
      id: n.id,
      ...ruleBasedPriority(n.category, n.body),
    }));
  }

  // Persist to DB — one update per notification (small N).
  await Promise.all(
    triaged.map((t) =>
      db.notification.update({
        where: { id: t.id },
        data: { aiPriority: t.priority, aiSummary: t.summary },
      })
    )
  );

  return NextResponse.json({
    triaged,
    fallbackUsed: usedFallback,
    count: triaged.length,
  });
}
