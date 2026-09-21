// AURIENTA Brain AI — Mentor Matching Engine
// Uses the Brain (consensus) to match workforce partners with mentors based on
// skills, career goals, and Sovereign Trust Score.

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
  const { menteeId, skills, goals } = body as { menteeId?: string; skills?: string; goals?: string };

  // Fetch available mentors (STS >= 85)
  const mentors = await db.enterpriseMember.findMany({
    where: { role: { in: ["founding_operator", "manager", "board_member"] } },
    include: {
      user: { select: { id: true, legalName: true, sovereignTrustScore: true, tier: true, primaryIntent: true } },
      enterprise: { select: { name: true, sector: true, tier: true } },
    },
    take: 20,
  });

  if (mentors.length === 0) {
    return NextResponse.json({ matches: [], message: "No mentors available (requires STS ≥ 85)" });
  }

  const mentorContext = mentors.map((m, i) =>
    `Mentor ${i + 1}: ${m.user.legalName} | STS: ${m.user.sovereignTrustScore} | Role: ${m.role} | Enterprise: ${m.enterprise.name} (${m.enterprise.sector}, Tier ${m.enterprise.tier}) | Intent: ${m.user.primaryIntent ?? "—"}`
  ).join("\n");

  const ai = await askConstitutionalAI({
    systemPrompt: "You are the AURIENTA Brain AI mentor matching engine. Match the mentee with the best 3 mentors based on skills, goals, and sector alignment. Output JSON: {\"matches\": [{\"mentorIndex\": 1, \"reason\": \"...\", \"fitScore\": 85}]}.",
    userMessage: `Mentee skills: ${skills ?? "not specified"}\nMentee goals: ${goals ?? "not specified"}\n\nAvailable mentors:\n${mentorContext}\n\nReturn the top 3 matches as JSON.`,
    kind: "mentor_matching",
    userId: user.id,
    persist: true,
    confidence: 0.85,
  });

  // Parse AI response
  let matches: Array<{ mentorIndex: number; reason: string; fitScore: number }> = [];
  const jsonMatch = ai.content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      matches = parsed.matches ?? [];
    } catch {}
  }

  // Map back to mentor data
  const result = matches.slice(0, 3).map(m => {
    const mentor = mentors[m.mentorIndex - 1];
    if (!mentor) return null;
    return {
      mentorId: mentor.user.id,
      mentorName: mentor.user.legalName,
      sts: mentor.user.sovereignTrustScore,
      role: mentor.role,
      enterprise: mentor.enterprise.name,
      sector: mentor.enterprise.sector,
      reason: m.reason,
      fitScore: m.fitScore,
    };
  }).filter(Boolean);

  return NextResponse.json({ ok: true, matches: result, fellBack: ai.fellBack });
}
