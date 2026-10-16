// AURIENTA Brain AI — Multi-Model Consensus Orchestrator (2026 Upgrade, AI-FIX)
//
// 5 AI providers with multiple models each — all work in CONSENSUS:
//   1. Google Gemini  — gemini-2.0-flash (fast), gemini-2.5-flash (balanced)
//   2. Groq          — llama-3.3-70b-versatile (reasoning), llama-3.1-8b-instant (fast)
//   3. OpenRouter    — multi-model gateway: llama-3.3-70b:free, gemini-2.0-flash:free
//   4. NVIDIA NIM    — llama-3.3-nemotron-super-49b-v1, mistral-small-24b-instruct
//   5. HuggingFace   — Meta-Llama-3.1-8B-Instruct, Mistral-7B-Instruct-v0.3
//
// CONSENSUS MODE: For critical tasks, the Brain queries multiple providers +
// multiple models in PARALLEL and synthesizes their responses into one answer.
//
// MULTI-MODEL WITHIN PROVIDER: Each provider can contribute multiple models
// to the consensus (e.g., Gemini-2.0-flash + Gemini-2.5-pro for complex tasks).
//
// NO z.ai / NO OpenAI direct — OpenAI is accessed via OpenRouter gateway.
//
// ROBUST CONSENSUS (AI-FIX):
//   - All configured models are queried in parallel via Promise.allSettled.
//   - Per-provider failures are logged (provider + model + reason) but DO NOT
//     abort the consensus. As long as ≥1 provider returns content, synthesis
//     proceeds with the survivors.
//   - If ALL providers fail, askMultiModel returns a clear `[AI_FALLBACK]`
//     response whose `error` field lists every provider/model + the underlying
//     HTTP status or exception message, so operators can see exactly which
//     provider is down and why.
//   - getAiProviderStatus() pings each provider with a tiny "ping" request
//     and returns {configured, connected, latencyMs, lastError} per provider.

/* eslint-disable @typescript-eslint/no-require-imports */
import { logger } from "./logger";

let GoogleGenerativeAI: any = null;
let Groq: any = null;

export type AiProvider = "gemini" | "groq" | "huggingface" | "openrouter" | "nvidia";
export type AiTaskKind =
  | "feasibility" | "pitch_deck" | "copilot" | "explain" | "anomaly" | "drift"
  | "fraud" | "sanity_check" | "triage" | "general" | "multilingual" | "advisory"
  | "board_briefing" | "charter_diff" | "graduation_coach" | "graduation_simulation"
  | "milestone_design" | "precedent_match" | "survival_drill" | "succession_plan"
  | "tax_suggestion" | "ir_answer" | "skill_equity_review" | "whistleblower_credibility"
  | "mentor_matching" | "salary_engine" | "evidence_verification";

type ConsensusMode = "consensus" | "standard" | "fast";

// A model entry specifies which provider + which specific model to call
type ModelEntry = { provider: AiProvider; model: string };

type TaskConfig = {
  mode: ConsensusMode;
  models: ModelEntry[]; // multiple models from multiple providers
  synthesize: boolean;
};

// ═══════════════════════════════════════════════════════════════════
// 2026 BEST MODELS PER PROVIDER + PER TASK
// ═══════════════════════════════════════════════════════════════════

const TASK_CONFIG: Record<AiTaskKind, TaskConfig> = {
  // CONSENSUS tasks — query multiple models in parallel + synthesize
  feasibility:    { mode: "consensus", models: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free" },
  ], synthesize: true },
  pitch_deck:    { mode: "consensus", models: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1" },
  ], synthesize: true },
  advisory:      { mode: "consensus", models: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free" },
  ], synthesize: true },
  board_briefing:    { mode: "consensus", models: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1" },
  ], synthesize: true },
  charter_diff:      { mode: "consensus", models: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
  ], synthesize: true },
  graduation_coach:  { mode: "consensus", models: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1" },
  ], synthesize: true },
  graduation_simulation: { mode: "consensus", models: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "openrouter", model: "google/gemini-2.0-flash-exp:free" },
  ], synthesize: true },
  milestone_design:  { mode: "consensus", models: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
  ], synthesize: true },
  survival_drill:    { mode: "consensus", models: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1" },
  ], synthesize: true },
  succession_plan:   { mode: "consensus", models: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
  ], synthesize: true },
  tax_suggestion:    { mode: "consensus", models: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
  ], synthesize: true },
  ir_answer:          { mode: "consensus", models: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
  ], synthesize: true },
  sanity_check:   { mode: "consensus", models: [
    { provider: "huggingface", model: "meta-llama/Meta-Llama-3.1-8B-Instruct" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "nvidia", model: "mistralai/mistral-small-24b-instruct" },
  ], synthesize: true },

  // STANDARD tasks — try providers in order, use first success
  copilot:        { mode: "standard", models: [
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemini-2.0-flash-exp:free" },
  ], synthesize: false },
  explain:        { mode: "standard", models: [
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
  ], synthesize: false },
  multilingual:   { mode: "standard", models: [
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
  ], synthesize: false },
  general:        { mode: "standard", models: [
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "openrouter", model: "google/gemini-2.0-flash-exp:free" },
  ], synthesize: false },
  precedent_match:    { mode: "standard", models: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
  ], synthesize: false },
  skill_equity_review: { mode: "standard", models: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
  ], synthesize: false },
  mentor_matching:    { mode: "standard", models: [
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
  ], synthesize: false },
  salary_engine:      { mode: "standard", models: [
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ], synthesize: false },

  // FAST tasks — low-latency providers first
  anomaly:        { mode: "fast", models: [
    { provider: "groq", model: "llama-3.1-8b-instant" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ], synthesize: false },
  drift:          { mode: "fast", models: [
    { provider: "groq", model: "llama-3.1-8b-instant" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ], synthesize: false },
  fraud:          { mode: "fast", models: [
    { provider: "groq", model: "llama-3.1-8b-instant" },
    { provider: "groq", model: "llama-3.3-70b-versatile" },
  ], synthesize: false },
  triage:         { mode: "fast", models: [
    { provider: "groq", model: "llama-3.1-8b-instant" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ], synthesize: false },
  whistleblower_credibility: { mode: "fast", models: [
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ], synthesize: false },
  evidence_verification:     { mode: "fast", models: [
    { provider: "groq", model: "llama-3.3-70b-versatile" },
    { provider: "huggingface", model: "mistralai/Mistral-7B-Instruct-v0.3" },
  ], synthesize: false },
};

export type MultiModelResult = {
  content: string; provider: AiProvider; model: string; latencyMs: number;
  fellBack: boolean; error: string | null; tokensIn: number | null; tokensOut: number | null;
  consensus?: { providersQueried: string[]; providersResponded: string[]; agreements: number; disagreements: number; synthesisProvider: AiProvider; modelsQueried: string[]; };
  learnedFrom?: { artifactCount: number; topSimilarity: number; };
};

// ── Provider clients (lazy-loaded) ──
let geminiClient: any = null;
function getGemini() {
  if (geminiClient) return geminiClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!GoogleGenerativeAI) GoogleGenerativeAI = require("@google/generative-ai").GoogleGenerativeAI;
  geminiClient = new GoogleGenerativeAI(key);
  return geminiClient;
}
let groqClient: any = null;
function getGroq() {
  if (groqClient) return groqClient;
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  if (!Groq) Groq = require("groq-sdk").default;
  groqClient = new Groq({ apiKey: key });
  return groqClient;
}
function getHfKey() { return process.env.HUGGINGFACE_API_KEY ?? null; }
function getOrKey() { return process.env.OPENROUTER_API_KEY ?? null; }
function getNvidiaKey() { return process.env.NVIDIA_API_KEY ?? null; }

// ═══════════════════════════════════════════════════════════════════
// PROVIDER CALL FUNCTIONS — each accepts a specific model
// ═══════════════════════════════════════════════════════════════════

async function callGemini(system: string, user: string, model: string = "gemini-2.0-flash"): Promise<MultiModelResult> {
  const client = getGemini(); if (!client) throw new Error("Gemini API key not configured");
  const start = Date.now();
  const genModel = client.getGenerativeModel({ model, systemInstruction: system });
  const result = await genModel.generateContent(user);
  const usage = result.response.usageMetadata;
  return { content: result.response.text(), provider: "gemini", model, latencyMs: Date.now() - start, fellBack: false, error: null, tokensIn: usage?.promptTokenCount ?? null, tokensOut: usage?.candidatesTokenCount ?? null };
}

async function callGroq(system: string, user: string, model: string = "llama-3.3-70b-versatile"): Promise<MultiModelResult> {
  const client = getGroq(); if (!client) throw new Error("Groq API key not configured");
  const start = Date.now();
  const c = await client.chat.completions.create({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }] });
  return { content: c.choices[0]?.message?.content ?? "", provider: "groq", model, latencyMs: Date.now() - start, fellBack: false, error: null, tokensIn: c.usage?.prompt_tokens ?? null, tokensOut: c.usage?.completion_tokens ?? null };
}

async function callHuggingFace(system: string, user: string, model: string = "meta-llama/Meta-Llama-3.1-8B-Instruct"): Promise<MultiModelResult> {
  const key = getHfKey(); if (!key) throw new Error("HuggingFace API key not configured");
  const start = Date.now();
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: `<s>[INST] ${system}\n\n${user} [/INST]`, parameters: { max_new_tokens: 2048, temperature: 0.7, return_full_text: false } }),
  });
  if (!response.ok) throw new Error(`HuggingFace API error: ${response.status}`);
  const data = await response.json();
  return { content: Array.isArray(data) ? data[0]?.generated_text ?? "" : data.generated_text ?? "", provider: "huggingface", model, latencyMs: Date.now() - start, fellBack: false, error: null, tokensIn: null, tokensOut: null };
}

async function callOpenRouter(system: string, user: string, model: string = "google/gemini-2.0-flash-exp:free"): Promise<MultiModelResult> {
  const key = getOrKey(); if (!key) throw new Error("OpenRouter API key not configured");
  const start = Date.now();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://aurienta.vercel.app", "X-Title": "AURIENTA Constitutional AI" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
  const data = await response.json();
  return { content: data.choices?.[0]?.message?.content ?? "", provider: "openrouter", model, latencyMs: Date.now() - start, fellBack: false, error: null, tokensIn: data.usage?.prompt_tokens ?? null, tokensOut: data.usage?.completion_tokens ?? null };
}

async function callNvidia(system: string, user: string, model: string = "nvidia/llama-3.3-nemotron-super-49b-v1"): Promise<MultiModelResult> {
  const key = getNvidiaKey(); if (!key) throw new Error("NVIDIA API key not configured");
  const start = Date.now();
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: 2048, temperature: 0.7 }),
  });
  if (!response.ok) throw new Error(`NVIDIA API error: ${response.status}`);
  const data = await response.json();
  return { content: data.choices?.[0]?.message?.content ?? "", provider: "nvidia", model, latencyMs: Date.now() - start, fellBack: false, error: null, tokensIn: data.usage?.prompt_tokens ?? null, tokensOut: data.usage?.completion_tokens ?? null };
}

// ── Provider dispatch table ──
const PROVIDERS: Record<AiProvider, (system: string, user: string, model?: string) => Promise<MultiModelResult>> = {
  gemini: callGemini,
  groq: callGroq,
  huggingface: callHuggingFace,
  openrouter: callOpenRouter,
  nvidia: callNvidia,
};

// ── Continuous learning: retrieve relevant past interactions ──
async function retrieveRelevantMemory(userMessage: string, kind?: string): Promise<{ context: string; artifactCount: number; topSimilarity: number }> {
  try {
    const { db } = await import("@/lib/db");
    const artifacts = await db.aiArtifact.findMany({ where: { ...(kind ? { kind } : {}), content: { not: { startsWith: "[AI_FALLBACK]" } } }, take: 50, orderBy: { createdAt: "desc" }, select: { content: true, payload: true, kind: true, createdAt: true } });
    if (artifacts.length === 0) return { context: "", artifactCount: 0, topSimilarity: 0 };
    const userWords = new Set(userMessage.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    let bestScore = 0; let bestArtifact: { content: string; kind: string } | null = null; let matchCount = 0;
    for (const a of artifacts) {
      const artifactWords = new Set(a.content.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      let overlap = 0; for (const w of userWords) { if (artifactWords.has(w)) overlap++; }
      const score = overlap / Math.max(userWords.size, 1);
      if (score > 0.15) { matchCount++; if (score > bestScore) { bestScore = score; bestArtifact = { content: a.content, kind: a.kind }; } }
    }
    if (bestArtifact && bestScore > 0.15) return { context: `\n\n--- BRAIN MEMORY (learned from past ${bestArtifact.kind} interaction) ---\n${bestArtifact.content.slice(0, 500)}...\n--- END BRAIN MEMORY ---\n`, artifactCount: matchCount, topSimilarity: bestScore };
    return { context: "", artifactCount: matchCount, topSimilarity: bestScore };
  } catch { return { context: "", artifactCount: 0, topSimilarity: 0 }; }
}

// ── Consensus synthesis — combine multiple provider responses ──
async function synthesizeConsensus(responses: MultiModelResult[], system: string, originalQuestion: string): Promise<MultiModelResult> {
  const validResponses = responses.filter(r => r.content && !r.fellBack);
  if (validResponses.length === 0) return responses[0] ?? { content: "[AI_FALLBACK] All consensus providers failed.", provider: "gemini", model: "consensus-fallback", latencyMs: 0, fellBack: true, error: "all_providers_failed", tokensIn: null, tokensOut: null };
  if (validResponses.length === 1) return validResponses[0];

  const providerResponses = validResponses.map((r, i) => `--- Model ${i + 1}: ${r.provider}/${r.model} ---\n${r.content}\n`).join("\n");
  const synthesisPrompt = `You are the AURIENTA Brain AI synthesis engine. Multiple AI models have responded to the same constitutional question. Synthesize their responses into a single, authoritative consensus answer.

ORIGINAL QUESTION:
${originalQuestion}

MODEL RESPONSES:
${providerResponses}

SYNTHESIS RULES:
1. If models agree, produce a unified answer.
2. If they disagree, note the disagreement and take the majority position.
3. Never include provider/model names in the output.
4. Keep the constitutional tone.
5. Use the best answer as base and enhance with insights from others.

Produce the final consensus answer:`;

  const start = Date.now();
  try {
    // Use Groq for synthesis (fast + capable) — falls back to Gemini
    const synthesisResult = await callGroq("You are the AURIENTA Brain AI synthesis engine.", synthesisPrompt, "llama-3.3-70b-versatile");
    return {
      content: synthesisResult.content,
      provider: synthesisResult.provider,
      model: `consensus(${validResponses.map(r => r.model).join("+")})`,
      latencyMs: Date.now() - start + Math.max(...validResponses.map(r => r.latencyMs)),
      fellBack: false, error: null,
      tokensIn: synthesisResult.tokensIn, tokensOut: synthesisResult.tokensOut,
      consensus: {
        providersQueried: responses.map(r => r.provider),
        providersResponded: validResponses.map(r => r.provider),
        agreements: validResponses.length,
        disagreements: responses.length - validResponses.length,
        synthesisProvider: synthesisResult.provider,
        modelsQueried: validResponses.map(r => `${r.provider}/${r.model}`),
      },
    };
  } catch {
    // If Groq fails, try Gemini for synthesis
    try {
      const synthesisResult = await callGemini("You are the AURIENTA Brain AI synthesis engine.", synthesisPrompt, "gemini-2.0-flash");
      return {
        content: synthesisResult.content,
        provider: synthesisResult.provider,
        model: `consensus(${validResponses.map(r => r.model).join("+")})`,
        latencyMs: Date.now() - start + Math.max(...validResponses.map(r => r.latencyMs)),
        fellBack: false, error: null,
        tokensIn: synthesisResult.tokensIn, tokensOut: synthesisResult.tokensOut,
        consensus: {
          providersQueried: responses.map(r => r.provider),
          providersResponded: validResponses.map(r => r.provider),
          agreements: validResponses.length,
          disagreements: responses.length - validResponses.length,
          synthesisProvider: synthesisResult.provider,
          modelsQueried: validResponses.map(r => `${r.provider}/${r.model}`),
        },
      };
    } catch {
      return validResponses[0];
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ENTRY: askMultiModel
// ═══════════════════════════════════════════════════════════════════

export async function askMultiModel(opts: { systemPrompt: string; userMessage: string; taskKind: AiTaskKind }): Promise<MultiModelResult> {
  const config = TASK_CONFIG[opts.taskKind] ?? TASK_CONFIG.general;
  const errors: string[] = [];
  const memory = await retrieveRelevantMemory(opts.userMessage, opts.taskKind);
  const enhancedUserMessage = memory.context ? `${memory.context}\n${opts.userMessage}` : opts.userMessage;

  // ── CONSENSUS MODE: query multiple models in parallel + synthesize ──
  if (config.mode === "consensus" && config.models.length >= 2) {
    const results = await Promise.allSettled(
      config.models.map(m => PROVIDERS[m.provider](opts.systemPrompt, enhancedUserMessage, m.model))
    );
    const responses: MultiModelResult[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const m = config.models[i];
      if (r.status === "fulfilled") {
        responses.push(r.value);
      } else {
        // Per-provider failure: log + record. Do NOT abort — consensus proceeds
        // with the survivors. The reason may be 401/403 (bad key), 402 (no
        // credits), 404 (deprecated model id), 503 (cold-start), or network.
        const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
        const detail = `${m.provider}/${m.model}: ${reason}`;
        errors.push(detail);
        logger.warn("consensus provider failed", {
          taskKind: opts.taskKind, provider: m.provider, model: m.model, error: reason,
        });
      }
    }

    if (config.synthesize && responses.length >= 2) {
      const synthesized = await synthesizeConsensus(responses, opts.systemPrompt, opts.userMessage);
      if (memory.artifactCount > 0) synthesized.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity };
      return synthesized;
    }
    if (responses.length > 0) {
      const best = responses[0];
      if (memory.artifactCount > 0) best.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity };
      return best;
    }

    // All consensus models failed → fall back to remaining providers
    const fallbackModels = ([
      { provider: "openrouter" as const, model: "google/gemini-2.0-flash-exp:free" },
      { provider: "nvidia" as const, model: "nvidia/llama-3.3-nemotron-super-49b-v1" },
      { provider: "huggingface" as const, model: "meta-llama/Meta-Llama-3.1-8B-Instruct" },
    ] as ModelEntry[]).filter(m => !config.models.some(cm => cm.provider === m.provider));

    for (const m of fallbackModels) {
      try {
        const result = await PROVIDERS[m.provider](opts.systemPrompt, enhancedUserMessage, m.model);
        result.fellBack = true;
        if (memory.artifactCount > 0) result.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity };
        return result;
      } catch (e) {
        errors.push(`${m.provider}/${m.model}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // ── STANDARD / FAST MODE: try models in order, return first success ──
  for (const m of config.models) {
    try {
      const result = await PROVIDERS[m.provider](opts.systemPrompt, enhancedUserMessage, m.model);
      if (memory.artifactCount > 0) result.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity };
      return result;
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      const detail = `${m.provider}/${m.model}: ${reason}`;
      errors.push(detail);
      logger.warn("standard/fast provider failed", {
        taskKind: opts.taskKind, provider: m.provider, model: m.model, error: reason,
      });
    }
  }

  // ── LAST RESORT: try OpenRouter + NVIDIA + HuggingFace ──
  const lastResort = ([
    { provider: "openrouter" as const, model: "google/gemini-2.0-flash-exp:free" },
    { provider: "nvidia" as const, model: "nvidia/llama-3.3-nemotron-super-49b-v1" },
    { provider: "huggingface" as const, model: "mistralai/Mistral-7B-Instruct-v0.3" },
  ] as ModelEntry[]);
  for (const m of lastResort) {
    if (config.models.some(cm => cm.provider === m.provider && cm.model === m.model)) continue;
    try {
      const result = await PROVIDERS[m.provider](opts.systemPrompt, enhancedUserMessage, m.model);
      result.fellBack = true;
      if (memory.artifactCount > 0) result.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity };
      return result;
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      const detail = `${m.provider}/${m.model}: ${reason}`;
      errors.push(detail);
      logger.warn("last-resort provider failed", {
        taskKind: opts.taskKind, provider: m.provider, model: m.model, error: reason,
      });
    }
  }

  // All providers failed (consensus + fallback + last-resort). Build a clear,
  // operator-readable error message that names each failing provider + the
  // underlying HTTP status / exception message.
  const total = errors.length;
  logger.error("all AI providers failed — returning AI_FALLBACK", {
    taskKind: opts.taskKind, failureCount: total, errors,
  });
  return {
    content: `[AI_FALLBACK] All AI providers unavailable (${total} failure${total === 1 ? "" : "s"}). ` +
             `Per-provider reasons: ${errors.join(" | ")}. ` +
             `The constitutional rules remain enforced by the CRE regardless.`,
    provider: "gemini", model: "fallback", latencyMs: 0, fellBack: true,
    error: errors.join("; "), tokensIn: null, tokensOut: null,
  };
}

// ── Health check: ping all configured providers ──
// Legacy shape (kept for backward-compat with any external callers). Returns
// only {connected, model, latencyMs}. For richer status (with lastError,
// configured flag, lastCheckedAt), use getAiProviderStatus().
export async function checkAiProviders(): Promise<Record<string, { connected: boolean; model: string; latencyMs: number }>> {
  const statuses = await getAiProviderStatus();
  const out: Record<string, { connected: boolean; model: string; latencyMs: number }> = {};
  for (const s of statuses) {
    out[s.provider] = { connected: s.connected, model: s.model, latencyMs: s.latencyMs };
  }
  return out;
}

// ── Richer health check: actual status of each AI provider (AI-FIX) ──
// Pings each provider with a tiny "Reply with OK" / "ping" request using the
// smallest/most-available model on that provider. Returns one entry per
// provider with: configured (API key present), connected (provider actually
// responded with non-empty content), latencyMs, lastError (string|nnull),
// lastCheckedAt (ISO ts). Used by /api/ready and /api/ai/brain-status.
export type AiProviderStatus = {
  provider: AiProvider;
  configured: boolean;   // API key (or equivalent) is present in env
  model: string;         // model used for the ping
  connected: boolean;    // provider actually responded with non-empty content
  latencyMs: number;     // round-trip response time (0 if failed)
  lastError: string | null;  // underlying error message (e.g. "OpenRouter API error: 402")
  lastCheckedAt: string;     // ISO timestamp of the probe
};

// Smallest / most-available model per provider for cheap ping probes.
const PING_MODELS: ModelEntry[] = [
  { provider: "gemini",      model: "gemini-2.0-flash" },
  { provider: "groq",        model: "llama-3.1-8b-instant" },
  { provider: "huggingface", model: "meta-llama/Meta-Llama-3.1-8B-Instruct" },
  { provider: "openrouter",  model: "google/gemini-2.0-flash-exp:free" },
  { provider: "nvidia",      model: "nvidia/llama-3.3-nemotron-super-49b-v1" },
];

export async function getAiProviderStatus(): Promise<AiProviderStatus[]> {
  const envKeyFor: Record<AiProvider, string | null> = {
    gemini: process.env.GEMINI_API_KEY ?? null,
    groq: process.env.GROQ_API_KEY ?? null,
    huggingface: process.env.HUGGINGFACE_API_KEY ?? null,
    openrouter: process.env.OPENROUTER_API_KEY ?? null,
    nvidia: process.env.NVIDIA_API_KEY ?? null,
  };

  const checkedAt = new Date().toISOString();

  const results = await Promise.all(
    PING_MODELS.map(async (m): Promise<AiProviderStatus> => {
      const configured = !!envKeyFor[m.provider];
      if (!configured) {
        return {
          provider: m.provider,
          configured: false,
          model: m.model,
          connected: false,
          latencyMs: 0,
          lastError: "API key not configured",
          lastCheckedAt: checkedAt,
        };
      }
      try {
        const result = await PROVIDERS[m.provider]("Reply with OK.", "ping", m.model);
        const connected = !result.fellBack && !!result.content && result.content.length > 0;
        return {
          provider: m.provider,
          configured: true,
          model: m.model,
          connected,
          latencyMs: result.latencyMs,
          lastError: connected ? null : "empty response",
          lastCheckedAt: checkedAt,
        };
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        logger.warn("provider ping failed", { provider: m.provider, model: m.model, error: reason });
        return {
          provider: m.provider,
          configured: true,
          model: m.model,
          connected: false,
          latencyMs: 0,
          lastError: reason,
          lastCheckedAt: checkedAt,
        };
      }
    })
  );
  return results;
}
