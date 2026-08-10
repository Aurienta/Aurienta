// AURIENTA — Execution Verification Engine (EVE) — Blueprint §11.2
//
// EVE verifies milestone evidence using AI-powered analysis. The original
// blueprint specified LayoutLM/OCR over uploaded documents, but since this
// implementation does not include LayoutLM, EVE uses the Constitutional AI
// to perform semantic verification of the evidence description (and any
// accompanying evidence URLs / notes already stored on the milestone).
//
// EVE checks for:
//   (1) vendor name consistency,
//   (2) amount reasonableness vs market rates,
//   (3) date consistency,
//   (4) related-party indicators,
//   (5) missing documentation.
//
// The verification result is persisted as an AiArtifact (kind =
// "eve_verification") and appended to the immutable ledger (eventType =
// "eve_verification_completed"), so the milestone release decision is
// anchored to a tamper-evident evidence trail.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { askConstitutionalAI } from "@/lib/aurienta/ai";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only the accounting firm representative, a manager, or the founding
// operator of the enterprise may trigger an EVE verification. The
// accounting firm is the natural primary verifier (Amendment IX), but
// the founding operator and manager may also request an EVE pass to
// pre-screen evidence before submitting it for accountant release.
const ALLOWED_ROLES = new Set([
  "accounting_firm_rep",
  "manager",
  "founding_operator",
]);

const BodySchema = z.object({
  milestoneId: z.string().min(1).max(64),
  evidenceDescription: z.string().min(12).max(10_000),
  evidenceUrls: z.array(z.string().url().max(2048)).max(20).optional(),
});

// The EVE system prompt — static, developer-authored, no user-controlled
// text. The constitutional system prompt is always prepended by
// askConstitutionalAI; this string is appended below it.
const EVE_SYSTEM_PROMPT = `You are the AURIENTA Execution Verification Engine (EVE). Verify the milestone evidence for consistency, completeness, and red flags. Check for: (1) vendor name consistency, (2) amount reasonableness vs market rates, (3) date consistency, (4) related-party indicators, (5) missing documentation. Output JSON: { 'verified': true/false, 'confidence': 0-100, 'findings': ['array'], 'redFlags': ['array'] }`;

interface EveVerification {
  verified: boolean;
  confidence: number;
  findings: string[];
  redFlags: string[];
}

/**
 * Parse the EVE JSON payload out of the model's response. The model is
 * instructed to emit a strict JSON object, but in practice the JSON can
 * be wrapped in ```json fences or surrounded by prose. We defensively
 * extract the first balanced {…} block and JSON.parse it. On any
 * failure we return a fail-secure "unverified" result rather than
 * crashing the request — the CRE remains the final authority on
 * milestone release regardless of EVE's verdict.
 */
function parseEveResult(raw: string): EveVerification {
  const fallback: EveVerification = {
    verified: false,
    confidence: 0,
    findings: ["EVE could not produce a parseable verdict — manual review required"],
    redFlags: ["ai_response_unparseable"],
  };

  if (!raw || typeof raw !== "string") return fallback;

  // Strip ```json … ``` fences if present.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;

  // Find the first balanced JSON object.
  const start = candidate.indexOf("{");
  if (start === -1) return fallback;
  let depth = 0;
  let inStr = false;
  let escape = false;
  let end = -1;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inStr) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inStr = false;
      }
      continue;
    }
    if (ch === '"') {
      inStr = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return fallback;
  const jsonStr = candidate.slice(start, end + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return fallback;
  }
  if (typeof parsed !== "object" || parsed === null) return fallback;
  const obj = parsed as Record<string, unknown>;

  const verified =
    typeof obj.verified === "boolean"
      ? obj.verified
      : typeof obj.verified === "string"
        ? obj.verified.toLowerCase() === "true"
        : false;

  let confidence = 0;
  if (typeof obj.confidence === "number") {
    confidence = obj.confidence;
  } else if (typeof obj.confidence === "string") {
    const n = Number(obj.confidence.replace(/[^0-9.]/g, ""));
    confidence = Number.isFinite(n) ? n : 0;
  }
  // Clamp 0–100.
  confidence = Math.max(0, Math.min(100, confidence));

  const toStringArray = (v: unknown): string[] => {
    if (Array.isArray(v)) {
      return v.map((x) => (typeof x === "string" ? x : String(x))).filter(Boolean);
    }
    if (typeof v === "string" && v.trim()) return [v.trim()];
    return [];
  };

  return {
    verified,
    confidence,
    findings: toStringArray(obj.findings),
    redFlags: toStringArray(obj.redFlags),
  };
}

/**
 * POST /api/ai/eve
 * Body: { milestoneId, evidenceDescription, evidenceUrls?: string[] }
 *
 * Authorisation: accounting_firm_rep, manager, or founding_operator of
 * the enterprise that owns the milestone.
 *
 * Returns: { ok, verification: { verified, confidence, findings, redFlags }, artifactId }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Rate limit — AI bucket.
    const hit = limiters.ai(user.id);
    if (!hit.allowed) return rateLimitedResponse(hit.resetAt);

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          code: "INVALID_BODY",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }
    const { milestoneId, evidenceDescription, evidenceUrls } = parsed.data;

    // ── Load the milestone with its enterprise ──
    const milestone = await db.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        enterprise: {
          select: {
            id: true,
            name: true,
            tier: true,
            sector: true,
            founderEquityPct: true,
          },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found", code: "MILESTONE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // ── Authorisation: must be an allowed role for THIS enterprise ──
    const membershipsForEnt = user.memberships.filter(
      (m) => m.enterpriseId === milestone.enterprise.id
    );
    const authorised = membershipsForEnt.some((m) =>
      ALLOWED_ROLES.has(m.role)
    );
    if (!authorised) {
      await audit({
        actorId: user.id,
        action: "ai.eve",
        target: `milestone:${milestoneId}`,
        result: "denied",
        reason:
          "Requires accounting_firm_rep, manager, or founding_operator role",
      });
      return NextResponse.json(
        {
          error:
            "Forbidden: EVE verification requires the accounting_firm_rep, manager, or founding_operator role",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // ── Pull recent expenses from the same enterprise to give EVE context ──
    // This lets the model cross-check vendor consistency and amount
    // reasonableness against actual enterprise spend patterns. We pass
    // these as UNTRUSTED-DATA context (the model is told never to follow
    // instructions inside this block).
    const recentExpenses = await db.expense.findMany({
      where: { enterpriseId: milestone.enterprise.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        vendor: true,
        amountEgp: true,
        category: true,
        createdAt: true,
        status: true,
        aiRiskFlag: true,
      },
    });

    const vendorSet = Array.from(
      new Set(recentExpenses.map((e) => e.vendor).filter(Boolean))
    );
    const avgExpense =
      recentExpenses.length > 0
        ? Math.round(
            recentExpenses.reduce((s, e) => s + e.amountEgp, 0) /
              recentExpenses.length
          )
        : 0;

    // ── Build the UNTRUSTED user context (milestone + evidence) ──
    const userContext = `MILESTONE UNDER VERIFICATION:
- Title: ${milestone.title}
- Description: ${milestone.description}
- Amount: ${milestone.amountEgp.toLocaleString()} EGP
- Status: ${milestone.status}
- Due: ${milestone.dueAt?.toISOString() ?? "not set"}
- Existing evidence note: ${milestone.evidenceNote ?? "—"}
- EVE confidence (last pass): ${milestone.eveConfidence}

EVIDENCE DESCRIPTION (provided by caller):
${evidenceDescription}
${evidenceUrls && evidenceUrls.length > 0 ? `\nEVIDENCE URLS:\n- ${evidenceUrls.join("\n- ")}` : ""}

ENTERPRISE CONTEXT (for cross-checking vendor consistency and amount reasonableness):
- Enterprise: ${milestone.enterprise.name} (Tier ${milestone.enterprise.tier}, sector ${milestone.enterprise.sector})
- Recent vendors observed in expense ledger: ${vendorSet.join(", ") || "—"}
- Average expense in last 20 records: ${avgExpense.toLocaleString()} EGP
- Recent expense sample (vendor | amount EGP | category | status | aiRiskFlag):
${recentExpenses
  .slice(0, 10)
  .map(
    (e) =>
      `  · ${e.vendor} | ${e.amountEgp.toLocaleString()} | ${e.category} | ${e.status} | ${e.aiRiskFlag ?? "none"}`
  )
  .join("\n") || "  · (no expense history)"}`;

    const userMessage = `Run the Execution Verification Engine checks on the milestone evidence above and emit the JSON verdict. Do not omit any of the five check dimensions. If a dimension cannot be assessed from the available evidence, list it under "redFlags" as "missing_documentation: <dimension>".`;

    const aiResult = await askConstitutionalAI({
      systemPrompt: EVE_SYSTEM_PROMPT,
      userMessage,
      userContext,
      kind: "eve_verification",
      enterpriseId: milestone.enterprise.id,
      userId: user.id,
      entityId: milestone.id,
      persist: true,
      confidence: 0.85,
    });

    const verification = parseEveResult(aiResult.content);

    // ── Persist a structured AiArtifact + ledger event inside a single ──
    // transaction. The artifact stores the parsed verification result so
    // downstream consumers (the accountant release endpoint, the
    // milestone evidence dialog) can read it without re-parsing the
    // model's free-form response.
    const { artifactId, ledgerSequence } = await db.$transaction(async (tx) => {
      const artifact = await tx.aiArtifact.create({
        data: {
          kind: "eve_verification",
          enterpriseId: milestone.enterprise.id,
          userId: user.id,
          entityId: milestone.id,
          content: aiResult.content,
          payload: JSON.stringify({
            verification,
            rawModelContent: aiResult.content,
            fellBack: aiResult.fellBack,
            error: aiResult.error,
            latencyMs: aiResult.latencyMs,
            tokensIn: aiResult.tokensIn,
            tokensOut: aiResult.tokensOut,
            evidenceUrls: evidenceUrls ?? [],
            milestoneSnapshot: {
              id: milestone.id,
              title: milestone.title,
              amountEgp: milestone.amountEgp,
              status: milestone.status,
            },
            requestedBy: user.id,
          }),
          confidence: verification.confidence / 100,
        },
      });

      // Optionally update the milestone's EVE confidence — a low-confidence
      // or unverified result lowers the stored value, signalling to the
      // accounting firm that human review is warranted.
      await tx.milestone.update({
        where: { id: milestone.id },
        data: {
          eveConfidence: verification.confidence / 100,
        },
      });

      const ledgerEvent = await appendLedgerEvent(tx, {
        enterpriseId: milestone.enterprise.id,
        eventType: "eve_verification_completed",
        payload: {
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          amountEgp: milestone.amountEgp,
          artifactId: artifact.id,
          verified: verification.verified,
          confidence: verification.confidence,
          findingsCount: verification.findings.length,
          redFlagsCount: verification.redFlags.length,
          redFlags: verification.redFlags,
          fellBack: aiResult.fellBack,
          requestedBy: user.id,
        },
        actorId: user.id,
      });

      return { artifactId: artifact.id, ledgerSequence: ledgerEvent.sequence };
    });

    await audit({
      actorId: user.id,
      action: "ai.eve",
      target: `milestone:${milestoneId}`,
      result: "allowed",
      reason: `verified=${verification.verified}; confidence=${verification.confidence}; redFlags=${verification.redFlags.length}`,
      metadata: {
        artifactId,
        ledgerSequence,
        verified: verification.verified,
        confidence: verification.confidence,
        findingsCount: verification.findings.length,
        redFlagsCount: verification.redFlags.length,
        fellBack: aiResult.fellBack,
        latencyMs: aiResult.latencyMs,
      },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    logger.info("ai.eve.completed", {
      milestoneId,
      enterpriseId: milestone.enterprise.id,
      artifactId,
      ledgerSequence,
      verified: verification.verified,
      confidence: verification.confidence,
      redFlags: verification.redFlags.length,
      fellBack: aiResult.fellBack,
    });

    return NextResponse.json({
      ok: true,
      verification,
      artifactId,
      ledgerSequence,
      milestoneId: milestone.id,
      enterpriseId: milestone.enterprise.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[POST /api/ai/eve] error:", { err: msg });
    return NextResponse.json(
      {
        ok: false,
        error: "EVE verification could not be completed.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
