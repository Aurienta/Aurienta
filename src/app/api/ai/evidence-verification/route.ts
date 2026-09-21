// AURIENTA Brain AI — Evidence Verification Engine
// Uses the Brain (fast mode: Groq + OpenAI) to verify milestone evidence.
// The accounting firm calls this to get an AI assessment of submitted evidence
// before authorizing fund release.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { askConstitutionalAI } from "@/lib/aurienta/ai";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = limiters.ai(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  const body = await req.json().catch(() => ({}));
  const { milestoneId } = body as { milestoneId: string };

  const milestone = await db.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      enterprise: {
        select: { name: true, tier: true, sector: true, accountingFirm: { select: { name: true, status: true } } },
      },
    },
  });
  if (!milestone) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const ai = await askConstitutionalAI({
    systemPrompt: `You are the AURIENTA Brain AI evidence verification engine. Verify the milestone evidence and assess:
1. Is the evidence note sufficient to justify the milestone amount?
2. Are there any red flags (missing documentation, unrealistic costs, related-party transactions)?
3. What is your confidence level (0-1) that the milestone is genuinely completed?
Output JSON: {"verified": boolean, "confidence": 0-1, "assessment": "one paragraph", "redFlags": ["array"], "recommendation": "approve" | "conditional" | "reject"}.`,
    userMessage: `Verify this milestone evidence.`,
    userContext: `MILESTONE: ${milestone.title}
Amount: ${milestone.amountEgp.toLocaleString()} EGP
Status: ${milestone.status}
EVE Confidence: ${milestone.eveConfidence}
Evidence note: ${milestone.evidenceNote ?? "no evidence submitted"}
Enterprise: ${milestone.enterprise.name} (Tier ${milestone.enterprise.tier}, ${milestone.enterprise.sector})
Accounting firm: ${milestone.enterprise.accountingFirm?.name ?? "not assigned"}`,
    kind: "evidence_verification",
    userId: user.id,
    entityId: milestoneId,
    persist: true,
    confidence: 0.85,
  });

  let verification = null;
  const jsonMatch = ai.content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { verification = JSON.parse(jsonMatch[0]); } catch {}
  }

  return NextResponse.json({ ok: true, verification, raw: ai.content.slice(0, 500), fellBack: ai.fellBack });
}
