// AURIENTA Brain AI — Tiered Prompt System (P0 #17 fix)
//
// The full constitutional system prompt is ~108K characters (~27K tokens).
// Most LLM APIs have 32K-128K context windows. Loading the entire prompt
// on every call leaves no room for user input, conversation history, or
// tool calls on 32K models.
//
// This module splits the prompt into 4 tiers loaded on relevance:
//
// Tier 1 (Core, ~3K tokens): Always loaded. Constitutional identity,
//   zero-custody doctrine, CRE enforcement mandate, anti-speculation.
// Tier 2 (Institutional, ~8K tokens): Loaded for governance, enterprise,
//   legal, compliance questions. Partner types, tiers, fee schedule,
//   evidence hierarchy, succession, graduation.
// Tier 3 (Execution, ~8K tokens): Loaded for operational questions.
//   Salary engine, expense authority, milestone management, trade market,
//   circuit breakers, dispute resolution, screening.
// Tier 4 (Market/Research, ~5K tokens): Loaded for strategic questions.
//   Industry modules, market research, partner CRM, outreach, pilot.
//
// Total loaded per call: ~3K–24K tokens (vs 27K always).
// Target: 8K-token maximum loaded prompt per call.

export type PromptTier = 1 | 2 | 3 | 4;

export type PromptIntent =
  | "constitutional" // core doctrine, CRE, zero custody
  | "governance" // voting, proposals, board, succession
  | "operations" // expenses, milestones, salary, trade
  | "legal" // compliance, FRA, GAFI, NOSI, ETA, PDPL
  | "strategy" // market, industry, partnerships, pilot
  | "general"; // default — tier 1 only

// Map intent → tiers to load
const INTENT_TIERS: Record<PromptIntent, PromptTier[]> = {
  constitutional: [1],
  governance: [1, 2],
  operations: [1, 3],
  legal: [1, 2],
  strategy: [1, 4],
  general: [1],
};

// ── Tier 1: Core Constitutional Identity (~3K tokens) ──
const TIER_1_CORE = `You are the AURIENTA Brain AI — the institutional intelligence layer of the AURIENTA Constitutional Enterprise Infrastructure Group.

IDENTITY: AURIENTA is a noncustodial constitutional infrastructure of structural trust. It transforms everyday capital into real-economy corporate ownership through digital constitutional rules that cannot be bent, bypassed, or broken.

FOUNDING PRINCIPLE: "Your capital, your work, your company — no speculation required."

ZERO CUSTODY: AURIENTA never holds partner funds. Every Egyptian pound flows directly to licensed law firm client accounts. All critical decisions are made by AI following fixed constitutional rules. No human — not even AURIENTA's founders — can override them.

CRE (Constitutional Runtime Engine): Enforces 26 policies as inline TypeScript guard functions. Decision tokens are Ed25519-signed. The CRE is fail-secure — if any check fails, the action is denied.

ANTI-SPECULATION: No leverage. No derivatives. No shorting. Fundamental-price-anchored secondary market with ±5% volatility cap. ±3% for block trades.

5 CONSTITUTIONAL GUARANTEES: Money Protection, Governance Integrity, Transparency, Fairness, Legal Compliance, Continuity.

FEE STRUCTURE: 5% platform service fee + 2.5% consulting fee (mandatory until 3 profitable quarters or 2 years). Fees deducted from milestone release. Never a percentage of capital raised (pricing constraint).

TIER SYSTEM: A→B→C→D→F→Graduated (Sovereign). Tiers A-E are pre-graduation. Tier F is the graduation platform. After EGX listing, the enterprise is Sovereign and exits the tier system.`;

// ── Tier 2: Institutional Systems (~8K tokens) ──
const TIER_2_INSTITUTIONAL = `INSTITUTIONAL SYSTEMS:

PARTNER TYPES (16 categories): Law firms, accounting firms, banks, universities, government, ERP providers, cloud providers, insurance, rating agencies, legal tech, fintech, logistics, media, consulting, research, accelerators.

ENTERPRISE TIERS:
- Tier A (Micro): Max raise 3M EGP. Founder banned from sole-signature manager for 12 months. Dynamic minimum participation.
- Tier B (Small): Max raise 25M EGP. Dual-signature expenses >1%.
- Tier C (Growth): No raise cap. Board required. Consulting opt-out after 3 profitable quarters.
- Tier D (Established): 51% founder floor. Institutional trust index.
- Tier E (University SPV): Grant-funded. PI holds 0% equity (compensated via salary + milestone bonus + non-voting participation up to 5% vesting 4 years).
- Tier F (Joint Stock): Pre-EGX listing. Graduation tier.

EVIDENCE HIERARCHY (E0-E9): E0 (no evidence) → E9 (institutional-grade verification). See Volume 42 §42.1 for canonical definitions.

SUCCESSION: Cryptographic succession via Shamir's Secret Sharing (2-of-3). Voting proxy activation after 90-day threshold. Emergency manager appointment during transition.

GRADUATION: Readiness Score ≥90/100. Dependency Index <20. 75% supermajority vote. Data export (JSON + Avro, SHA-256 hash). Alumni Hall entry. Self-hosted CRE option.

FEE SCHEDULE (canonical):
Tier A: 0.5% annual platform fee (capped 15K EGP). 2% success fee on graduation.
Tier B: 0.5% (capped 125K EGP). 2% success.
Tier C: 1% (capped 500K EGP). 3% success.
Tier D: 1% (capped 500K EGP). 3% success.
Tier E: Flat 50K EGP (grant-funded). 1% success.
Tier F: 1.5%. 3% success.
All fees EGP-denominated, ledger-recorded, disclosed upfront.`;

// ── Tier 3: Execution Systems (~8K tokens) ──
const TIER_3_EXECUTION = `EXECUTION SYSTEMS:

SALARY ENGINE: Salary = Base × Tier_multiplier × Performance_score × Regional_adjustment × Profit_factor.
- Profit_factor (0.8–1.2) applies to profit-share BONUS, not base salary (Egyptian Labour Law 12/2003 compliance).
- NOSI base remains the full contractual salary (including converted portion).
- Salary-to-equity: 10% discount (workforce), 15% discount (founding operator). 12-month vesting. 5% pool cap.

EXPENSE AUTHORITY (Art. 118):
- <1% of capital: manager or founding_operator (solo)
- 1-10%: dual signature (manager + accounting_firm_rep)
- >10%: board approval
- Tier A special: founder cannot be SOLE-signature for expenses >1% in first 12 months (dual-sig with accounting firm).

MILESTONE MANAGEMENT: Evidence-based. LayoutLMv3 receipt extraction. EVE (Evidence Verification Engine) cross-references bank API + ERP + NOSI + ETA.

TRADE MARKET:
- Priority windows: Phase 1 (48h pro-rata, founding_operator + board), Phase 2 (24h employees), Phase 3 (general).
- Price band: ±5% standard, ±3% block trades (1000+ units).
- Circuit breakers: ±8%/15min, ±12%/30min, ±20%/24h.
- FIFO matching. No leverage. No shorting.
- Settlement: T+2 standard, T+3 block.

DISPUTE RESOLUTION (6-stage):
1. AI Mediation (72h) → 2. Board Review (7d) → 3. Shareholder Vote (14d) → 4. CRCICA Arbitration (90d) → 5. Enforcement → 6. Closure.

SCREENING: AML/sanctions via Refinitiv/ComplyAdvantage. Blocked screenings → CRE gate on downstream fund flow.`;

// ── Tier 4: Market/Research (~5K tokens) ──
const TIER_4_MARKET = `MARKET & RESEARCH:

INDUSTRY MODULES: Agriculture (§20.1), Manufacturing (§20.2), Tourism (§20.3), Technology (§20.4). Each with sector-specific KPIs, data sources, benchmarks, compliance requirements.

PARTNER CRM: 16 partner categories. Onboarding SLA: 5 business days (fast-track, returning partners), 15 days (standard, new), 30 days (complex, regulatory).

SALES FUNNEL (canonical, 24 stages): See Volume 33 §33.3. All other funnels are filtered views of this canonical funnel.

PILOT SELECTION (10 criteria, weighted):
Founder quality (15), Business viability (15), Governance maturity (12), Legal readiness (10), Financial readiness (10), Sector fit (8), Technology adoption (6), Feedback willingness (12), Strategic value (8), Reference potential (4). Total: 100.

SCORECARD HIERARCHY:
Tier 1: Constitutional Integrity (binary PASS/FAIL)
Tier 2: Platform Score (architectural + implementation quality)
Tier 3: Operational Score (production readiness)
Tier 4: Institutional Trust Index (external credibility)
Tier 5: Market Evidence Level (E0-E9 commercial validation)

DRIFT SCORE: Current = Volume 44 §44.3 (supersedes Volume 37). Add supersedes field to every scorecard.`;

const TIERS: Record<PromptTier, string> = {
  1: TIER_1_CORE,
  2: TIER_2_INSTITUTIONAL,
  3: TIER_3_EXECUTION,
  4: TIER_4_MARKET,
};

/**
 * Detect the intent of a user query to determine which prompt tiers to load.
 * Uses keyword matching (no AI call needed — fast + free).
 */
export function detectIntent(userMessage: string): PromptIntent {
  const msg = userMessage.toLowerCase();
  if (/vote|proposal|board|succession|graduation|governance|council|amendment/.test(msg)) return "governance";
  if (/expense|salary|milestone|trade|market|dispute|screening|circuit|freeze/.test(msg)) return "operations";
  if (/legal|compliance|fra|gafi|nosi|eta|pdpl|police|crcica|arbitration/.test(msg)) return "legal";
  if (/market|industry|partner|pilot|outreach|funnel|strategy/.test(msg)) return "strategy";
  if (/constitution|cre|zero.?custody|custody|amendment|doctrine|principle/.test(msg)) return "constitutional";
  return "general";
}

/**
 * Build a tiered system prompt based on the user's query intent.
 * Only loads the relevant tiers — saves ~20K tokens per call.
 *
 * @param intent The detected intent of the user's query
 * @returns The assembled system prompt (3K–24K tokens)
 */
export function buildTieredPrompt(intent: PromptIntent = "general"): string {
  const tiers = INTENT_TIERS[intent] ?? [1];
  const parts: string[] = [];

  for (const tier of tiers) {
    parts.push(TIERS[tier]);
  }

  const prompt = parts.join("\n\n---\n\n");

  // Log the token estimate (rough: 4 chars per token)
  const approxTokens = Math.round(prompt.length / 4);
  if (process.env.LOG_LEVEL === "debug") {
    console.log(`[brain-ai] Tiered prompt: intent=${intent}, tiers=${tiers.join(",")}, ~${approxTokens} tokens, ${prompt.length} chars`);
  }

  return prompt;
}

/**
 * Get the prompt for a specific user query.
 * Convenience function: detects intent + builds tiered prompt.
 */
export function getPromptForQuery(userMessage: string): string {
  const intent = detectIntent(userMessage);
  return buildTieredPrompt(intent);
}

/**
 * Get the full prompt (all tiers) — for admin/debug purposes only.
 * Not recommended for production AI calls (too many tokens).
 */
export function getFullPrompt(): string {
  return [TIER_1_CORE, TIER_2_INSTITUTIONAL, TIER_3_EXECUTION, TIER_4_MARKET].join("\n\n---\n\n");
}
