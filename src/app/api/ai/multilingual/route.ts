import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { askConstitutionalAI } from "@/lib/aurienta/ai";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED = new Set(["en", "ar", "fr", "sw"]);
const LANG_NAMES: Record<string, string> = {
  en: "English",
  ar: "Arabic (العربية)",
  fr: "French (Français)",
  sw: "Swahili (Kiswahili)",
};

/**
 * POST /api/ai/multilingual
 * Body: { concept: string, language: "en"|"ar"|"fr"|"sw" }
 *
 * Explains a constitutional concept in the user's selected language,
 * in plain terms suitable for a new partner. Persisted as an AiArtifact
 * (kind = "multilingual_explain").
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
    const concept = typeof body?.concept === "string" ? body.concept.trim() : "";
    const language = typeof body?.language === "string" ? body.language : "en";

    if (!concept) {
      return NextResponse.json({ error: "concept is required" }, { status: 400 });
    }
    if (!SUPPORTED.has(language)) {
      return NextResponse.json(
        { error: `language must be one of: ${[...SUPPORTED].join(", ")}` },
        { status: 400 }
      );
    }

    const isArabic = language === "ar";
    const langName = LANG_NAMES[language];

    // Clean, developer-authored system prompt — NO user-controlled text.
    // (Previously the concept was concatenated into the user message; it now
    // flows through `userContext` as UNTRUSTED DATA.)
    const systemPrompt = `You are the AURIENTA Constitutional AI — Multilingual mode.
Your task: explain the requested AURIENTA constitutional concept in ${langName}, in
plain language suitable for a new partner who has never read the constitutional
blueprint. Reference the relevant rule or article where possible.

Hard requirements:
- Write the ENTIRE explanation in ${langName}. Do not mix languages.
- Reference the relevant rule/article (e.g. "Rule I 1.1", "Article III", "Art. 118", "CRE", "graduation gates").
- Use 3–5 short paragraphs. No markdown headings. No emojis.
- Keep under 160 words.
- ${isArabic ? "The output will be rendered right-to-left — write natural MSA Arabic." : "Write naturally for the target language."}
- Never promise guaranteed returns. Never speculate. Always note when human confirmation is required for high-risk decisions.`;

    const userMessage = `Explain the AURIENTA constitutional concept provided in the untrusted-data context, in ${langName}, in plain language suitable for a new partner. Reference the relevant rule or article.`;

    // User-supplied concept → UNTRUSTED-DATA delimiters.
    const userContext = `CONCEPT: ${concept}`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "multilingual_explain",
      userId: user.id,
      persist: true,
      confidence: 0.88,
    });

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.multilingual",
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs, language },
    });

    return NextResponse.json({ explanation: result.content, language });
  } catch (e) {
    logger.error("[ai/multilingual] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      {
        error: "internal_error",
        explanation:
          "The Constitutional AI could not be reached. The CRE remains online — the rules are still enforced regardless.",
      },
      { status: 500 }
    );
  }
}
