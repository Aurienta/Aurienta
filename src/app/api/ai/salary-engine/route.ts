// AURIENTA Brain AI — Salary Engine
// Uses the Brain (standard mode: Groq + OpenAI) to calculate a fair salary
// for a position based on sector, tier, market data, and enterprise financials.

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
  const { enterpriseId, position, department, experienceYears } = body as {
    enterpriseId: string; position: string; department?: string; experienceYears?: number;
  };

  const ent = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { name: true, tier: true, sector: true, monthlyRevenueEgp: true, employeeCount: true, grossMarginPct: true },
  });
  if (!ent) return NextResponse.json({ error: "enterprise_not_found" }, { status: 404 });

  const ai = await askConstitutionalAI({
    systemPrompt: `You are the AURIENTA Brain AI salary engine. Calculate a fair monthly salary (in EGP) for the given position based on:
1. Egyptian market rates (CAPMAS data) for the sector and position
2. Enterprise tier (A-F) and financial capacity
3. Candidate experience level
4. The enterprise's gross margin and revenue
Output JSON: {"salaryEgp": number, "justification": "one paragraph", "marketRangeLow": number, "marketRangeHigh": number, "redFlags": ["array"]}.`,
    userMessage: `Calculate salary for this position.`,
    userContext: `ENTERPRISE: ${ent.name} (Tier ${ent.tier}, ${ent.sector})
Monthly revenue: ${ent.monthlyRevenueEgp.toLocaleString()} EGP | Employees: ${ent.employeeCount} | Gross margin: ${ent.grossMarginPct}%
POSITION: ${position} | Department: ${department ?? "—"} | Experience: ${experienceYears ?? "not specified"} years`,
    kind: "salary_engine",
    userId: user.id,
    enterpriseId,
    persist: true,
    confidence: 0.85,
  });

  let salaryData = null;
  const jsonMatch = ai.content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { salaryData = JSON.parse(jsonMatch[0]); } catch {}
  }

  return NextResponse.json({ ok: true, salary: salaryData, raw: ai.content.slice(0, 500), fellBack: ai.fellBack });
}
