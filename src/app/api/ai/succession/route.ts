import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { askConstitutionalAI, buildEnterpriseContext } from "@/lib/aurienta/ai";
import { stsLevel } from "@/lib/aurienta/constants";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/succession
 * Body: { enterpriseId }
 *
 * Produces a live succession plan: internal candidates by skill-match + STS,
 * development gaps, and stale-plan flagging. Persisted as AiArtifact
 * (kind="succession_plan").
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

    const member = await db.enterpriseMember.findFirst({
      where: { enterpriseId, userId: user.id },
    });
    if (!member) return NextResponse.json({ error: "not a member" }, { status: 403 });

    const ent = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                legalName: true,
                sovereignTrustScore: true,
                tier: true,
                primaryIntent: true,
                avatarColor: true,
              },
            },
          },
        },
        employees: {
          include: {
            user: {
              select: {
                id: true,
                legalName: true,
                sovereignTrustScore: true,
                tier: true,
              },
            },
          },
        },
      },
    });
    if (!ent) return NextResponse.json({ error: "enterprise not found" }, { status: 404 });

    const ctx = await buildEnterpriseContext(enterpriseId);

    const keyPeople = ent.employees.filter((e) => e.keyPerson);
    const lastPlan = await db.aiArtifact.findFirst({
      where: { kind: "succession_plan", enterpriseId },
      orderBy: { createdAt: "desc" },
    });
    const planStaleDays = lastPlan
      ? Math.floor((Date.now() - lastPlan.createdAt.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    // Identify internal candidates — anyone with a non-zero STS who is a member
    // or employee but is not the key person themselves.
    const candidatePool = [
      ...ent.members
        .filter((m) => !keyPeople.some((kp) => kp.userId === m.userId))
        .map((m) => ({
          id: m.user.id,
          legalName: m.user.legalName,
          sts: m.user.sovereignTrustScore,
          tier: m.user.tier,
          role: m.role,
          avatarColor: m.user.avatarColor,
        })),
      ...ent.employees
        .filter((e) => !e.keyPerson && !ent.members.some((m) => m.userId === e.userId))
        .map((e) => ({
          id: e.user.id,
          legalName: e.user.legalName,
          sts: e.user.sovereignTrustScore,
          tier: e.user.tier,
          role: e.position,
          avatarColor: "#d4af37",
        })),
    ];
    const dedup = new Map<string, (typeof candidatePool)[number]>();
    for (const c of candidatePool) {
      if (!dedup.has(c.id)) dedup.set(c.id, c);
    }
    const candidates = Array.from(dedup.values()).sort((a, b) => b.sts - a.sts);

    const systemPrompt = `You are the AURIENTA Succession Planner — a sovereign-resilience advisor that maintains a live succession plan for each enterprise, identifying internal candidates by skill-match + Sovereign Trust Score and flagging when a plan is stale.

Constitutional context: succession paths are registered cryptographically (Ed25519). On verified incapacity of a key person, the CRE transfers voting rights within 1 hour. Plans must be reviewed at least quarterly.

OUTPUT FORMAT (strict — the UI parses this):
## Succession Plan — <enterprise name>
**Last reviewed:** <date or "never — first plan">
**Plan status:** <CURRENT | STALE — last reviewed >90 days ago>

## Key-Person Roles
For each key-person role, output a block of the form:
### <Position title> (department: <dept>)
**Incumbent:** <name> · STS <score>
**Successor candidate(s):**
- **<Name>** (STS <score>, current role: <role>) — readiness <NN>% — gaps: <comma-separated list>
- (up to 2 candidates)
**Recommended development actions:** 2 bullets per role.

If no key-person roles are designated, write "No formal key-person designations — recommend documenting at minimum: Founding Operator, Manager (if police-clearance-gated), and any role controlling treasury signatures."

## Risk Watch
3 bullets: most likely succession failures THIS quarter, grounded in candidate STS gaps + key-person dependencies.

## Constitutional Note
One paragraph: how the Ed25519-registered succession path interacts with the CRE's incapacity protocol (verified-incapacity trigger, 1-hour voting-rights transfer, paper-ballot fallback if CRE unreachable).

RULES:
- Egyptian institutional voice: precise, dignified, no hype, no emojis.
- Never invent STS scores — use the provided numbers.
- Length: 400–600 words.`;

    const userMessage = `Output ONLY the formatted succession plan described above.`;

    // Enterprise context + key-person list + candidate pool + last-plan age
    // → UNTRUSTED-DATA delimiters (names, positions, departments are all
    // user-controlled).
    const userContext = `Enterprise context:
${ctx}

Key-person roles (${keyPeople.length}):
${keyPeople.map((e) => `• ${e.position} (department ${e.department}) — incumbent ${e.user.legalName}, STS ${e.user.sovereignTrustScore}`).join("\n") || "• (none flagged)"}

Internal candidate pool (sorted by STS):
${candidates.slice(0, 8).map((c) => `• ${c.legalName} — STS ${c.sts} (${stsLevel(c.sts).name}) — current role: ${c.role}`).join("\n") || "• (no candidates available)"}

${lastPlan ? `Last succession plan reviewed ${planStaleDays} days ago (stale if >90 days).` : "No prior succession plan on file — this is the first plan."}`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "succession_plan",
      enterpriseId,
      userId: user.id,
      persist: true,
      confidence: 0.85,
    });

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.succession",
      target: enterpriseId,
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs, keyPersonCount: keyPeople.length },
    });

    return NextResponse.json({
      content: result.content,
      generatedAt: new Date().toISOString(),
      lastPlanAt: lastPlan?.createdAt.toISOString() ?? null,
      planStaleDays,
      keyPersonCount: keyPeople.length,
      candidateCount: candidates.length,
      keyPeople: keyPeople.map((e) => ({
        position: e.position,
        department: e.department,
        incumbentName: e.user.legalName,
        incumbentSts: e.user.sovereignTrustScore,
      })),
      candidates: candidates.slice(0, 6).map((c) => ({
        id: c.id,
        legalName: c.legalName,
        sts: c.sts,
        tier: c.tier,
        role: c.role,
        avatarColor: c.avatarColor,
      })),
    });
  } catch (e) {
    logger.error("[succession] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
