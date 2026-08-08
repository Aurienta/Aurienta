import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  askConstitutionalAI,
  buildEnterpriseContext,
} from "@/lib/aurienta/ai";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/explain
 * Body: { label: string, value: string|number, enterpriseId?: string }
 *
 * Produces a plain-language explanation of a single metric/number, grounded
 * in the enterprise's actual ledger context. Persisted as an AiArtifact
 * (kind = "explain_number") for court admissibility.
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
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const value = body?.value ?? "";
    const enterpriseId =
      typeof body?.enterpriseId === "string" ? body.enterpriseId : undefined;

    if (!label) {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }

    // Build enterprise context if provided (and the user is a member).
    let enterpriseContext = "No enterprise context provided — explain generically.";
    if (enterpriseId) {
      const isMember = user.memberships.some(
        (m) => m.enterpriseId === enterpriseId
      );
      if (isMember) {
        enterpriseContext = await buildEnterpriseContext(enterpriseId);
      } else {
        enterpriseContext =
          "User is not a member of the requested enterprise — explain generically.";
      }
    }

    // Clean, developer-authored system prompt — NO user-controlled text.
    // (Previously the label was interpolated here; it now flows through
    // `userContext` as UNTRUSTED DATA to prevent prompt injection.)
    const systemPrompt = `You are the AURIENTA Constitutional AI — Explain mode.
Your job: take a single institutional metric and its value, then explain
in plain language WHY the number is what it is — grounded in the enterprise context
provided. Reference the underlying formula or rule where relevant.

Output format (3–5 short paragraphs, no headings, no markdown):
1. The number itself, restated.
2. The arithmetic / source (e.g. "revenue 2.4M EGP − COGS 1.58M EGP = gross profit 0.82M EGP; 0.82M ÷ 2.4M = 34%").
3. Constitutional or sector context ("sector median 31%", "Tier C mandatory ERP", "Rule I 1.7 immutable audit").
4. One concrete recommendation or caveat.

Never invent numbers not in the context. If a comparison is missing, say "no sector benchmark available".
Keep total length under 90 words. No emojis, no marketing language.`;

    // User-controlled data (label, value, enterprise context) — UNTRUSTED.
    const userContext = `METRIC: ${label}
VALUE: ${value}

ENTERPRISE CONTEXT:
${enterpriseContext}`;

    const userMessage = `Explain this number to a new constitutional partner in plain language, with sources.`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "explain_number",
      enterpriseId,
      userId: user.id,
      persist: true,
      confidence: 0.86,
    });

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.explain",
      target: enterpriseId,
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs },
    });

    return NextResponse.json({ explanation: result.content });
  } catch (e) {
    logger.error("[ai/explain] route error:", { err: e instanceof Error ? e.message : String(e) });
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
