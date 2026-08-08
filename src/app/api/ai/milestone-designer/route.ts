import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { askConstitutionalAI, buildEnterpriseContext } from "@/lib/aurienta/ai";
import { egp } from "@/lib/aurienta/format";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/milestone-designer
 * Body: { enterpriseId, title, description, sector }
 *
 * Returns an AI-designed milestone spec: evidence requirements, realistic
 * amount, dependency ordering, and sector-specific gates.
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
    const title: string = (body?.title ?? "").toString().trim();
    const description: string = (body?.description ?? "").toString().trim();

    if (!enterpriseId || !title || !description) {
      return NextResponse.json(
        { error: "enterpriseId, title, and description are required" },
        { status: 400 }
      );
    }

    // Only Founding Operators + managers may design milestones.
    const member = await db.enterpriseMember.findFirst({
      where: {
        enterpriseId,
        userId: user.id,
        role: { in: ["founding_operator", "manager", "company_owner", "board_member"] },
      },
    });
    if (!member) {
      return NextResponse.json(
        { error: "Only Founding Operators, managers, board members, or company owners may design milestones" },
        { status: 403 }
      );
    }

    const ent = await db.enterprise.findUnique({ where: { id: enterpriseId } });
    if (!ent) return NextResponse.json({ error: "enterprise not found" }, { status: 404 });

    const sector = (body?.sector ?? ent.sector).toString();
    const ctx = await buildEnterpriseContext(enterpriseId);

    // Pull existing milestones so the AI can suggest dependency ordering.
    const existing = await db.milestone.findMany({
      where: { enterpriseId },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, status: true, amountEgp: true, dueAt: true },
    });

    // Realistic-amount math — anchor on monthly revenue and outstanding Law Firm Client Account balance.
    const monthlyRev = ent.monthlyRevenueEgp;
    const escrow = ent.lawFirmClientAccountBalanceEgp;
    const suggestedAnchor = Math.min(
      Math.max(Math.round(monthlyRev * 0.5), 50_000),
      Math.max(escrow, 100_000)
    );

    // Clean, developer-authored system prompt — NO user-controlled text.
    // The monthly revenue / Law Firm Client Account balance / suggested-anchor numbers are passed
    // via `userContext` below.
    const systemPrompt = `You are the AURIENTA AI Milestone Designer — a sector-playbook-aware advisor that helps Founding Operators structure constitutional milestones for fund releases.

AURIENTA milestones are CRE-gated fund releases from the Law Firm Client Account. Each milestone requires:
- Evidence (geotagged photos, invoices, delivery confirmation, IPFS-pinned documents).
- A realistic amount consistent with the enterprise's monthly revenue + outstanding Law Firm Client Account balance.
- Dependency ordering (which existing milestones must complete first).
- Sector-specific gates:
  • agriculture → weather-indexed (rainfall / NDVI threshold)
  • manufacturing → OEE-gated (overall equipment effectiveness ≥ 75%)
  • tourism → occupancy-gated (occupancy rate ≥ 60%)
  • technology → dNPS-gated (delta net promoter score ≥ +5)
  • food → unit-economics-gated (gross margin per unit ≥ 35%)
  • retail → sell-through-gated (sell-through rate ≥ 70%)
  • logistics → on-time-delivery-gated (≥ 95%)

OUTPUT FORMAT (strict — the UI parses this):
## Milestone Design
A short intro paragraph naming the milestone + sector + the gate that applies.

## Realistic Amount
**Suggested amount:** <EGP figure, integer> — one-sentence justification grounded in monthly revenue + Law Firm Client Account balance.

## Evidence Requirements
A bulleted list of 3–5 evidence items, each prefixed with the type (Geotagged photo | Invoice | Delivery confirmation | Third-party audit | Sensor reading | Survey result).

## Dependency Ordering
A bulleted list of which existing milestones must be "approved" or "released" before this one starts. If none, write "No dependencies — this milestone can start immediately."

## Sector Gate
**Sector:** <sector>
**Gate type:** <e.g. weather-indexed, OEE-gated, etc.>
**Threshold:** <concrete numeric threshold>
A one-paragraph note on how the gate is measured + verified (sensor source, third-party auditor, EVE confidence target).

## CRE Pre-Check
One paragraph: which Rego policies will the CRE enforce on this milestone's release (zero_custody, expense_authority, evidence_verification), and what could trip a denial.

RULES:
- Ground the suggested amount in the monthly revenue and outstanding Law Firm Client Account balance provided in context. Adjust based on the milestone's actual scope.
- If the milestone description implies a larger amount than the Law Firm Client Account balance can cover, flag it explicitly.
- Egyptian institutional voice: precise, no hype, no emojis.
- Length: 400–550 words.`;

    const userMessage = `Output ONLY the formatted Milestone Design described above.`;

    // Enterprise context + existing milestones + new milestone details + financial
    // anchors → UNTRUSTED-DATA delimiters (title, description, enterprise name,
    // and existing milestone titles are all user-controlled).
    const userContext = `Enterprise context:
${ctx}

Sector (use for the sector-gate): ${sector}

Existing milestones (for dependency ordering):
${existing.length ? existing.map((m) => `• [${m.status}] ${m.title} — ${egp(m.amountEgp)}${m.dueAt ? ` · due ${m.dueAt.toISOString().slice(0, 10)}` : ""}`).join("\n") : "• (no existing milestones)"}

New milestone to design:
- Title: ${title}
- Description: ${description}

Financial anchors (for the realistic-amount section):
- Monthly revenue: ${egp(monthlyRev)}
- Outstanding Law Firm Client Account balance: ${egp(escrow)}
- Suggested anchor (~50% of monthly revenue, bounded by Law Firm Client Account balance): ${egp(suggestedAnchor)}`;

    const result = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "milestone_design",
      enterpriseId,
      userId: user.id,
      persist: true,
      confidence: 0.84,
    });

    // Audit the AI call (lightweight — does not fire on rate-limit hits).
    await audit({
      actorId: user.id,
      action: "ai.milestone-designer",
      target: enterpriseId,
      result: "allowed",
      metadata: { fellBack: result.fellBack, latencyMs: result.latencyMs },
    });

    return NextResponse.json({
      content: result.content,
      sector,
      suggestedAnchor,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    logger.error("[milestone-designer] route error:", { err: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
