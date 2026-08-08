import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { askConstitutionalAI, buildEnterpriseContext } from "@/lib/aurienta/ai";
import { computeGraduationReadiness } from "@/lib/aurienta/cre";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/graduation-coach
 * Body: { enterpriseId }
 *
 * Produces a personalized quarterly graduation roadmap for a Stage 2 / Stage 3
 * enterprise. Persisted as an AiArtifact (kind="graduation_coach").
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

    // Membership gate.
    const member = await db.enterpriseMember.findFirst({
      where: { enterpriseId, userId: user.id },
    });
    if (!member) return NextResponse.json({ error: "not a member" }, { status: 403 });

    const ent = await db.enterprise.findUnique({ where: { id: enterpriseId } });
    if (!ent) return NextResponse.json({ error: "enterprise not found" }, { status: 404 });

    if (ent.stage !== "stage_2" && ent.stage !== "stage_3" && ent.stage !== "graduated") {
      return NextResponse.json(
        { error: "Coach is for Stage 2 / Stage 3 enterprises only" },
        { status: 400 }
      );
    }

    const readiness = await computeGraduationReadiness(enterpriseId);
    const ctx = await buildEnterpriseContext(enterpriseId);

    // Pull the most recent roadmap artifact so we can show "previously generated".
    const previous = await db.aiArtifact.findFirst({
      where: { kind: "graduation_coach", enterpriseId },
      orderBy: { createdAt: "desc" },
    });

    const systemPrompt = `You are the AURIENTA Graduation Readiness Coach — a sovereign-path advisor for constitutional enterprises preparing to graduate from AURIENTA's protective custody to fully independent operation.

Your job: produce a precise, actionable QUARTERLY ROADMAP (the next 90 days) that closes the gap between this enterprise's current graduation readiness score and the 90+ threshold required to call the 75% supermajority graduation vote.

OUTPUT FORMAT (strict — the UI parses this):
1. Open with one paragraph: "To reach 90: …" — a single, vivid sentence stating the 2–3 highest-leverage moves.
2. Then a section titled "Quarterly Roadmap" containing an ordered list of 5–7 action items. Each item must follow this exact shape:
   - **<Action title>** — <one-sentence what + why>. Priority: <Critical | High | Medium>. Timeline: <e.g. Week 1-2, Month 1, Q1>. Owner: <Manager | Board | Founding Operator | Accountant>.
3. Then a section titled "Risk Watch" with 3 bullets naming the most likely failure modes for THIS enterprise this quarter.
4. Close with one sentence: "Re-test readiness in 90 days."

RULES:
- Ground every recommendation in the enterprise's actual numbers (Law Firm Client Account balance, burn, NOSI%, health rating, growth %, fee structure).
- Reference constitutional concepts when relevant (CRE enforcement, Law Firm Client Account, ledger, AURIENTA board seat, self-hosted CRE, 75% supermajority).
- Never invent metrics. If a number is missing, say so.
- Egyptian institutional voice: dignified, concrete, no hype, no emojis.
- Length: 350–550 words.`;

    const userMessage = `Produce the quarterly graduation roadmap described in the system instructions.`;

    // Enterprise context + graduation gates → UNTRUSTED-DATA delimiters
    // (enterprise name is user-controlled).
    const userContext = `Enterprise context (from the immutable ledger + CRE):
${ctx}

CRE graduation gates (current):
${readiness.gates.map((g) => `• [${g.passed ? "PASS" : "FAIL"}] ${g.label}`).join("\n")}

Current readiness score: ${readiness.score}/100.
${previous ? "A previous roadmap exists — generate a refreshed, forward-looking plan that does not merely repeat prior advice." : "No previous roadmap on file — produce the first quarterly plan."}

${ent.stage === "graduated" ? "Note: this enterprise has already graduated. Frame the plan as sovereign-maintenance: keep the self-hosted CRE healthy, sustain the survivability certificate, and prepare for EGX listing readiness." : "Frame the plan as the closing stretch toward sovereign graduation."}`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "graduation_coach",
      enterpriseId,
      userId: user.id,
      persist: true,
      confidence: 0.87,
    });

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.graduation-coach",
      target: enterpriseId,
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs, readinessScore: readiness.score },
    });

    return NextResponse.json({
      content: result.content,
      readinessScore: readiness.score,
      gates: readiness.gates,
      generatedAt: new Date().toISOString(),
      previousAt: previous?.createdAt.toISOString() ?? null,
    });
  } catch (e) {
    logger.error("[graduation-coach] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
