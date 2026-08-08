// AURIENTA AI Pitch Deck Generator — generates a constitutional Capital Partner pitch deck
// for a new enterprise. Produces a structured 10-slide deck that Founding Operators can present
// to potential investors during the Pre-Partnership Constitutional Consensus Phase.
//
// Blueprint ref: §4.1.1 — pitch decks are optional materials (+8 bonus) for the
// feasibility engine, and the Diaspora / Capital Partner matching features reference a
// "free pitch deck AI scoring" for Tier D (Add-on 19).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { parseBody } from "@/lib/aurienta/validation";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import { askConstitutionalAI } from "@/lib/aurienta/ai";
import { db } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pitchDeckSchema = z.object({
  enterpriseId: z.string().max(64).optional(),
  name: z.string().min(3).max(120),
  tagline: z.string().max(200).optional(),
  description: z.string().min(20).max(12000),
  sector: z.string().min(1).max(40),
  tier: z.enum(["A", "B", "C", "D", "E", "F"]),
  fundraisingGoalEgp: z.number().int().min(50_000).max(500_000_000),
  equityUnitPriceEgp: z.number().int().min(1).max(100_000),
  // Optional context to make the deck richer
  competitiveAdvantage: z.string().max(5000).optional(),
  targetMarket: z.string().max(2000).optional(),
  teamDescription: z.string().max(3000).optional(),
  milestones: z.string().max(3000).optional(),
  useOfFunds: z.string().max(3000).optional(),
});

type Slide = {
  number: number;
  title: string;
  content: string;
  bullets: string[];
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rlHit = limiters.copilot(user.id);
  if (!rlHit.allowed) return rateLimitedResponse(rlHit.resetAt);

  const body = await parseBody(req, pitchDeckSchema);
  if (body instanceof NextResponse) return body;

  const enterpriseContext = `ENTERPRISE: ${body.name}
Tagline: ${body.tagline ?? "—"}
Sector: ${body.sector}
Tier: ${body.tier}
Capital Formation goal: ${body.fundraisingGoalEgp.toLocaleString()} EGP
Equity Unit price: ${body.equityUnitPriceEgp.toLocaleString()} EGP
Description: ${body.description}
Competitive advantage: ${body.competitiveAdvantage ?? "—"}
Target market: ${body.targetMarket ?? "—"}
Team: ${body.teamDescription ?? "—"}
Milestones: ${body.milestones ?? "—"}
Use of funds: ${body.useOfFunds ?? "—"}`;

  const ai = await askConstitutionalAI({
    systemPrompt: `You are the AURIENTA AI Pitch Deck Generator. Generate a professional, institutional-grade 10-slide Capital Partner pitch deck for a constitutional enterprise. The deck must be suitable for presenting to investors during the Pre-Partnership Constitutional Consensus Phase.

The 10 slides MUST be:
1. Title — enterprise name, tagline, tier, sector
2. Problem — the market problem being solved
3. Solution — the enterprise's product/service and how it solves the problem
4. Market Opportunity — market size, growth, target segment (Egyptian + regional context)
5. Business Model — revenue model, unit economics, pricing
6. Competitive Advantage — moat, differentiation, barriers to entry
7. Team — Founding Operator(s) background, relevant experience, key hires needed
8. Financial Projections — 3-year revenue, expenses, profitability, key assumptions
9. Use of Funds — milestone-based breakdown (tied to the Law Firm Client Account release schedule)
10. The Ask — Capital Formation goal, Equity Unit price, equity offered, constitutional terms (Zero Custody, CRE-enforced, graduation path)

Output a JSON object: {"slides": [{"number": 1, "title": "...", "content": "2-3 sentence narrative", "bullets": ["4-6 bullet points"]}]}
Each slide must be substantive and specific to this enterprise. Reference AURIENTA constitutional concepts where relevant (Zero Custody, CRE, Equity Units, graduation, milestone-release Law Firm Client Account). Use constitutional terminology — never say 'Capital Partner', 'Participation', 'capital formation', 'enterprise', 'shares', 'escrow'. Instead use 'Capital Partner', 'Capital Participation', 'Capital Formation', 'Enterprise', 'Equity Units', 'Law Firm Client Account'.`,
    userMessage: "Generate the 10-slide pitch deck. Return ONLY a JSON object with the slides array.",
    userContext: enterpriseContext,
    kind: "pitch_deck_generation",
    userId: user.id,
    enterpriseId: body.enterpriseId,
    persist: true,
    confidence: 0.9,
  });

  // Parse the AI response
  const jsonMatch = ai.content.match(/\{[\s\S]*\}/);
  let slides: Slide[] = [];
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      slides = parsed.slides ?? [];
    } catch {
      // fall through to generated fallback
    }
  }

  // Fallback: if AI didn't return valid JSON, generate a structured deck from the inputs
  if (slides.length === 0) {
    slides = generateFallbackDeck(body);
  }

  // Persist the deck as an AiArtifact
  const artifact = await db.aiArtifact.create({
    data: {
      kind: "pitch_deck",
      userId: user.id,
      enterpriseId: body.enterpriseId,
      content: JSON.stringify({ slides, enterpriseName: body.name }),
      confidence: 0.88,
      payload: JSON.stringify({
        systemPrompt: "AURIENTA AI Pitch Deck Generator",
        userMessage: enterpriseContext.slice(0, 500),
        modelVersion: "zai-constitutional-ai",
        slideCount: slides.length,
        fellBack: ai.fellBack,
      }),
    },
  });

  await audit({
    actorId: user.id,
    action: "ai.pitch_deck",
    target: body.enterpriseId ? `enterprise:${body.enterpriseId}` : `enterprise:${body.name}`,
    result: "allowed",
    metadata: { slideCount: slides.length, fellBack: ai.fellBack },
  });

  return NextResponse.json({
    ok: true,
    slides,
    artifactId: artifact.id,
    enterpriseName: body.name,
    fellBack: ai.fellBack,
  });
}

function generateFallbackDeck(body: z.infer<typeof pitchDeckSchema>): Slide[] {
  const totalEquityUnits = Math.floor(body.fundraisingGoalEgp / body.equityUnitPriceEgp);
  return [
    {
      number: 1,
      title: body.name,
      content: `${body.tagline ?? "A constitutional enterprise"} — Tier ${body.tier} ${body.sector} enterprise seeking ${body.fundraisingGoalEgp.toLocaleString()} EGP in Capital Participation through the AURIENTA constitutional infrastructure.`,
      bullets: [
        `${body.sector.charAt(0).toUpperCase() + body.sector.slice(1)} sector · Tier ${body.tier}`,
        `Capital Formation goal: ${body.fundraisingGoalEgp.toLocaleString()} EGP`,
        `Equity Units: ${totalEquityUnits.toLocaleString()} at ${body.equityUnitPriceEgp.toLocaleString()} EGP each`,
        "Zero Custody — funds go directly to FRA-licensed Law Firm Client Account",
        "CRE-enforced governance — AI-locked constitutional rules",
      ],
    },
    {
      number: 2,
      title: "The Problem",
      content: body.description.slice(0, 300),
      bullets: [
        "Market gap identified in the Egyptian " + body.sector + " sector",
        "Existing solutions are inaccessible, inefficient, or speculative",
        "Everyday capital lacks a path to real-economy ownership",
        "Governance friction prevents productive enterprise formation",
      ],
    },
    {
      number: 3,
      title: "The Solution",
      content: body.description.slice(0, 400),
      bullets: [
        body.competitiveAdvantage ?? "A constitutionally-governed enterprise model",
        "Productive real-economy operation, not speculation",
        "Transparent milestone-based fund releases",
        "AI-enforced governance eliminates corporate friction",
      ],
    },
    {
      number: 4,
      title: "Market Opportunity",
      content: body.targetMarket ?? `The Egyptian ${body.sector} market represents a significant opportunity for a constitutionally-governed enterprise.`,
      bullets: [
        `Target market: ${body.targetMarket ?? "Egyptian " + body.sector + " sector"}`,
        "Growing demand for transparent, productive enterprises",
        "Regional expansion potential via GAFTA, COMESA, AfCFTA",
        "Diaspora capital bridge for cross-border participation",
      ],
    },
    {
      number: 5,
      title: "Business Model",
      content: `Revenue model with milestone-based capital releases from the Law Firm Client Account.`,
      bullets: [
        "Milestone-based fund releases (5% Constitutional Infrastructure + 2.5% consulting fee)",
        "Fundamental pricing: Equity Unit price = (EPS × P/E × Growth) + 0.3 × NAV",
        "±5% Enterprise Registry band — no speculation",
        "Dividend distribution from realized profits (30-day cooling)",
      ],
    },
    {
      number: 6,
      title: "Competitive Advantage",
      content: body.competitiveAdvantage ?? "The constitutional governance model itself is the moat.",
      bullets: [
        "Zero Custody — investors never send money to the Constitutional Infrastructure",
        "Immutable hash-chained ledger — full transparency",
        "AI-enforced rules cannot be bent, bypassed, or broken",
        "Graduation path to sovereign independence",
      ],
    },
    {
      number: 7,
      title: "Team",
      content: body.teamDescription ?? "The Founding Operator team brings sector expertise and operational experience.",
      bullets: [
        `Founding Operator: ${body.teamDescription ? "experienced operator" : "profile to be detailed"}`,
        "Police-clearance verified (if manager role)",
        "Sovereign Trust Score tracked on the Constitutional Infrastructure",
        "Key hires planned post-Capital Formation",
      ],
    },
    {
      number: 8,
      title: "Financial Projections",
      content: "3-year projections with conservative growth assumptions and milestone-based capital deployment.",
      bullets: [
        `Year 1: deploy ${body.fundraisingGoalEgp.toLocaleString()} EGP across milestones`,
        "Year 2: achieve operational break-even",
        "Year 3: profitability and consulting opt-out eligibility",
        "All projections AI-validated by the Project Evaluation Engine",
      ],
    },
    {
      number: 9,
      title: "Use of Funds",
      content: body.useOfFunds ?? "Milestone-based fund releases from the Law Firm Client Account, each verified by evidence.",
      bullets: [
        body.milestones ?? "Milestone 1: initial operations setup",
        "Each milestone requires evidence submission + board review",
        "Funds released only on CRE validation",
        "0.5% to Anti-Fragility Vault on each Capital Formation close",
      ],
    },
    {
      number: 10,
      title: "The Constitutional Ask",
      content: `${body.name} seeks ${body.fundraisingGoalEgp.toLocaleString()} EGP in Capital Participation from Constitutional Partners in exchange for ${totalEquityUnits.toLocaleString()} Equity Units at ${body.equityUnitPriceEgp.toLocaleString()} EGP each.`,
      bullets: [
        `Capital Formation goal: ${body.fundraisingGoalEgp.toLocaleString()} EGP`,
        `Equity Units: ${totalEquityUnits.toLocaleString()} at ${body.equityUnitPriceEgp.toLocaleString()} EGP`,
        `Tier ${body.tier} · ${body.sector} · Zero Custody`,
        "Graduation to sovereign independence on maturity",
        "Contact the Founding Operator to participate",
      ],
    },
  ];
}
