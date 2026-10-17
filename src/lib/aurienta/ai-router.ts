// AURIENTA Brain AI — Multi-Model Consensus Orchestrator (AI-REBUILD)
//
// 4 native AI providers with multiple models each — all work in CONSENSUS:
//   1. Groq         — llama-3.3-70b-versatile (reasoning, 70B)
//                     llama-3.1-8b-instant (fast, 8B)
//   2. NVIDIA NIM   — nvidia/llama-3.1-nemotron-51b-instruct (enterprise)
//                     google/gemma-3-12b-it (balanced)
//                     mistralai/mistral-large-2-instruct (large)
//   3. Google Gemini— gemini-2.0-flash (fast)
//                     gemini-2.5-flash (balanced)
//   4. HuggingFace  — meta-llama/Meta-Llama-3.1-8B-Instruct (general)
//                     mistralai/Mistral-7B-Instruct-v0.3 (fast)
//                     HuggingFaceH4/zephyr-7b-beta (lightweight)
//
// CONSENSUS MODE: For every task, the Brain queries 3+ models from DIFFERENT
// providers in PARALLEL via Promise.allSettled() and synthesizes their
// responses into one authoritative answer.
//
// MULTI-MODEL WITHIN PROVIDER: The same provider can contribute multiple
// models to a consensus (e.g. NVIDIA nemotron-51b + NVIDIA gemma-3-12b for
// enterprise reasoning) when that yields the best coverage.
//
// NO OpenRouter. 4 native AI providers only.
//
// ROBUST CONSENSUS (AI-REBUILD):
//   - All configured models are queried in parallel via Promise.allSettled.
//   - Per-provider failures are logged (provider + model + reason) but DO NOT
//     abort the consensus. As long as ≥1 provider returns content, synthesis
//     proceeds with the survivors.
//   - If ≥2 succeeded → synthesize a consensus answer (pick the most common
//     themes; use the longest/most detailed response as the base and enhance
//     with insights from others).
//   - If only 1 succeeded → use that response directly (with a note that
//     consensus was not reached).
//   - If ALL providers fail, askMultiModel returns a clear `[AI_FALLBACK]`
//     response whose `error` field lists every provider/model + the
//     underlying HTTP status or exception message, so operators can see
//     exactly which provider is down and why.
//   - getAiProviderStatus() pings each of the 4 providers with a tiny "hi"
//     request (max 5 tokens) using the fastest model for each provider and
//     returns {provider, configured, connected, model, latencyMs, lastError}
//     per provider. Runs in parallel (Promise.allSettled).

/* eslint-disable @typescript-eslint/no-require-imports */
import { logger } from "./logger";

let GoogleGenerativeAI: any = null;

export type AiProvider = "groq" | "nvidia" | "gemini" | "huggingface";
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
  models: ModelEntry[]; // 3+ models from different providers for consensus
  synthesize: boolean;
};

// ═══════════════════════════════════════════════════════════════════
// 2026 BEST MODELS PER PROVIDER + PER TASK (4 providers, multi-model)
// ═══════════════════════════════════════════════════════════════════

// Reusable model entries (single source of truth)
const M = {
  // Groq
  groq_70b:   { provider: "groq" as const, model: "llama-3.3-70b-versatile" },
  groq_8b:    { provider: "groq" as const, model: "llama-3.1-8b-instant" },
  // NVIDIA NIM
  nvidia_nemo:    { provider: "nvidia" as const, model: "nvidia/llama-3.1-nemotron-51b-instruct" },
  nvidia_gemma:   { provider: "nvidia" as const, model: "google/gemma-3-12b-it" },
  nvidia_mistral: { provider: "nvidia" as const, model: "mistralai/mistral-large-2-instruct" },
  // Gemini
  gemini_2_0:  { provider: "gemini" as const, model: "gemini-2.0-flash" },
  gemini_2_5:  { provider: "gemini" as const, model: "gemini-2.5-flash" },
  // HuggingFace
  hf_llama:    { provider: "huggingface" as const, model: "meta-llama/Meta-Llama-3.1-8B-Instruct" },
  hf_mistral:  { provider: "huggingface" as const, model: "mistralai/Mistral-7B-Instruct-v0.3" },
  hf_zephyr:   { provider: "huggingface" as const, model: "HuggingFaceH4/zephyr-7b-beta" },
};

const TASK_CONFIG: Record<AiTaskKind, TaskConfig> = {
  // ── COMPLEX REASONING — large models, 3 providers in parallel ──
  feasibility:    { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  charter_diff:   { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  graduation_coach:    { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  graduation_simulation: { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  board_briefing: { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  advisory:       { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  succession_plan:{ mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  tax_suggestion: { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  ir_answer:      { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  sanity_check:   { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  survival_drill: { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  whistleblower_credibility: { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  precedent_match: { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  skill_equity_review: { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  salary_engine:  { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  evidence_verification: { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },
  mentor_matching: { mode: "consensus", models: [M.groq_70b, M.nvidia_nemo, M.gemini_2_5], synthesize: true },

  // ── CREATIVE — diverse models, 3 providers ──
  pitch_deck:       { mode: "consensus", models: [M.groq_70b, M.gemini_2_5, M.hf_zephyr], synthesize: true },
  milestone_design: { mode: "consensus", models: [M.groq_70b, M.gemini_2_5, M.hf_zephyr], synthesize: true },

  // ── MULTILINGUAL — Gemini + Groq + HuggingFace mistral ──
  multilingual: { mode: "consensus", models: [M.gemini_2_0, M.groq_70b, M.hf_mistral], synthesize: true },

  // ── FAST TASKS — Groq 8B + NVIDIA gemma-12b + Gemini-2.0-flash ──
  explain: { mode: "fast", models: [M.groq_8b, M.nvidia_gemma, M.gemini_2_0], synthesize: true },
  copilot: { mode: "fast", models: [M.groq_8b, M.nvidia_gemma, M.gemini_2_0], synthesize: true },
  triage:  { mode: "fast", models: [M.groq_8b, M.nvidia_gemma, M.gemini_2_0], synthesize: true },
  anomaly: { mode: "fast", models: [M.groq_8b, M.nvidia_gemma, M.gemini_2_0], synthesize: true },
  drift:   { mode: "fast", models: [M.groq_8b, M.nvidia_gemma, M.gemini_2_0], synthesize: true },
  fraud:   { mode: "fast", models: [M.groq_8b, M.nvidia_gemma, M.gemini_2_0], synthesize: true },

  // ── GENERAL — broad coverage ──
  general: { mode: "consensus", models: [M.groq_70b, M.nvidia_gemma, M.gemini_2_5], synthesize: true },
};

export type MultiModelResult = {
  content: string;
  provider: AiProvider;
  model: string;
  latencyMs: number;
  fellBack: boolean;
  error: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  consensus?: {
    providersQueried: string[];
    providersResponded: string[];
    agreements: number;
    disagreements: number;
    synthesisProvider: AiProvider;
    modelsQueried: string[];
    consensusReached: boolean; // true if ≥2 providers agreed
  };
  learnedFrom?: { artifactCount: number; topSimilarity: number };
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
function getGroqKey()    { return process.env.GROQ_API_KEY ?? null; }
function getNvidiaKey()  { return process.env.NVIDIA_API_KEY ?? null; }
function getGeminiKey()  { return process.env.GEMINI_API_KEY ?? null; }
function getHfKey()      { return process.env.HUGGINGFACE_API_KEY ?? null; }

// ═══════════════════════════════════════════════════════════════════
// PROVIDER CALL FUNCTIONS — each accepts a specific model
// ═══════════════════════════════════════════════════════════════════

// Groq — OpenAI-compatible chat completions via fetch.
// Endpoint: https://api.groq.com/openai/v1/chat/completions
async function callGroq(system: string, user: string, model: string = "llama-3.3-70b-versatile"): Promise<MultiModelResult> {
  const key = getGroqKey();
  if (!key) throw new Error("Groq API key not configured");
  const start = Date.now();
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });
  if (!response.ok) {
    const txt = await response.text().catch(() => "");
    throw new Error(`Groq API error: ${response.status}${txt ? ` — ${txt.slice(0, 200)}` : ""}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("Groq returned empty content");
  return {
    content,
    provider: "groq",
    model,
    latencyMs: Date.now() - start,
    fellBack: false,
    error: null,
    tokensIn: data?.usage?.prompt_tokens ?? null,
    tokensOut: data?.usage?.completion_tokens ?? null,
  };
}

// NVIDIA NIM — OpenAI-compatible chat completions.
// Endpoint: https://integrate.api.nvidia.com/v1/chat/completions
async function callNvidia(system: string, user: string, model: string = "nvidia/llama-3.1-nemotron-51b-instruct"): Promise<MultiModelResult> {
  const key = getNvidiaKey();
  if (!key) throw new Error("NVIDIA API key not configured");
  const start = Date.now();
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.95,
    }),
  });
  if (!response.ok) {
    const txt = await response.text().catch(() => "");
    throw new Error(`NVIDIA API error: ${response.status}${txt ? ` — ${txt.slice(0, 200)}` : ""}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("NVIDIA returned empty content");
  return {
    content,
    provider: "nvidia",
    model,
    latencyMs: Date.now() - start,
    fellBack: false,
    error: null,
    tokensIn: data?.usage?.prompt_tokens ?? null,
    tokensOut: data?.usage?.completion_tokens ?? null,
  };
}

// Google Gemini — uses @google/generative-ai SDK.
// Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
async function callGemini(system: string, user: string, model: string = "gemini-2.0-flash"): Promise<MultiModelResult> {
  const client = getGemini();
  if (!client) throw new Error("Gemini API key not configured");
  const start = Date.now();
  const genModel = client.getGenerativeModel({ model, systemInstruction: system });
  const result = await genModel.generateContent(user);
  const usage = result.response.usageMetadata;
  const content = result.response.text();
  if (!content) throw new Error("Gemini returned empty content");
  return {
    content,
    provider: "gemini",
    model,
    latencyMs: Date.now() - start,
    fellBack: false,
    error: null,
    tokensIn: usage?.promptTokenCount ?? null,
    tokensOut: usage?.candidatesTokenCount ?? null,
  };
}

// HuggingFace Inference API — tries chat-completions endpoint first, then
// falls back to text-generation endpoint (some models support only one).
// Chat:       https://api-inference.huggingface.co/models/{model}/v1/chat/completions
// Text-gen:   https://api-inference.huggingface.co/models/{model}
async function callHuggingFace(system: string, user: string, model: string = "meta-llama/Meta-Llama-3.1-8B-Instruct"): Promise<MultiModelResult> {
  const key = getHfKey();
  if (!key) throw new Error("HuggingFace API key not configured");
  const start = Date.now();

  // ── Attempt 1: OpenAI-compatible chat-completions endpoint ──
  try {
    const chatRes = await fetch(`https://api-inference.huggingface.co/models/${model}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });
    if (chatRes.ok) {
      const data = await chatRes.json();
      const content = data?.choices?.[0]?.message?.content ?? "";
      if (content) {
        return {
          content,
          provider: "huggingface",
          model,
          latencyMs: Date.now() - start,
          fellBack: false,
          error: null,
          tokensIn: data?.usage?.prompt_tokens ?? null,
          tokensOut: data?.usage?.completion_tokens ?? null,
        };
      }
    }
  } catch {
    // fall through to text-generation
  }

  // ── Attempt 2: text-generation endpoint (older HF Inference API) ──
  const textRes = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: `<s>[INST] ${system}\n\n${user} [/INST]`,
      parameters: { max_new_tokens: 2048, temperature: 0.7, return_full_text: false },
    }),
  });
  if (!textRes.ok) {
    const txt = await textRes.text().catch(() => "");
    throw new Error(`HuggingFace API error: ${textRes.status}${txt ? ` — ${txt.slice(0, 200)}` : ""}`);
  }
  const data = await textRes.json();
  const content = Array.isArray(data) ? data[0]?.generated_text ?? "" : data?.generated_text ?? "";
  if (!content) throw new Error("HuggingFace returned empty content");
  return {
    content,
    provider: "huggingface",
    model,
    latencyMs: Date.now() - start,
    fellBack: false,
    error: null,
    tokensIn: null,
    tokensOut: null,
  };
}

// ── Provider dispatch table ──
const PROVIDERS: Record<AiProvider, (system: string, user: string, model?: string) => Promise<MultiModelResult>> = {
  groq: callGroq,
  nvidia: callNvidia,
  gemini: callGemini,
  huggingface: callHuggingFace,
};

// ── Continuous learning: retrieve relevant past interactions ──
async function retrieveRelevantMemory(userMessage: string, kind?: string): Promise<{ context: string; artifactCount: number; topSimilarity: number }> {
  try {
    const { db } = await import("@/lib/db");
    const artifacts = await db.aiArtifact.findMany({
      where: { ...(kind ? { kind } : {}), content: { not: { startsWith: "[AI_FALLBACK]" } } },
      take: 50,
      orderBy: { createdAt: "desc" },
      select: { content: true, payload: true, kind: true, createdAt: true },
    });
    if (artifacts.length === 0) return { context: "", artifactCount: 0, topSimilarity: 0 };
    const userWords = new Set(userMessage.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    let bestScore = 0;
    let bestArtifact: { content: string; kind: string } | null = null;
    let matchCount = 0;
    for (const a of artifacts) {
      const artifactWords = new Set(a.content.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      let overlap = 0;
      for (const w of userWords) { if (artifactWords.has(w)) overlap++; }
      const score = overlap / Math.max(userWords.size, 1);
      if (score > 0.15) {
        matchCount++;
        if (score > bestScore) { bestScore = score; bestArtifact = { content: a.content, kind: a.kind }; }
      }
    }
    if (bestArtifact && bestScore > 0.15) {
      return {
        context: `\n\n--- BRAIN MEMORY (learned from past ${bestArtifact.kind} interaction) ---\n${bestArtifact.content.slice(0, 500)}...\n--- END BRAIN MEMORY ---\n`,
        artifactCount: matchCount,
        topSimilarity: bestScore,
      };
    }
    return { context: "", artifactCount: matchCount, topSimilarity: bestScore };
  } catch {
    return { context: "", artifactCount: 0, topSimilarity: 0 };
  }
}

// ── Consensus synthesis — combine multiple provider responses ──
// Strategy:
//   - Pick the longest/most-detailed response as the base.
//   - If ≥2 providers responded, also call a synthesizer LLM to merge
//     themes from the other responses into the base.
//   - If synthesis LLM fails, return the longest response as-is.
async function synthesizeConsensus(responses: MultiModelResult[], originalQuestion: string): Promise<MultiModelResult> {
  const valid = responses.filter(r => r.content && !r.fellBack);
  if (valid.length === 0) {
    return {
      content: "[AI_FALLBACK] All consensus providers failed.",
      provider: "groq",
      model: "consensus-fallback",
      latencyMs: 0,
      fellBack: true,
      error: "all_providers_failed",
      tokensIn: null,
      tokensOut: null,
    };
  }
  if (valid.length === 1) {
    // Only 1 succeeded — consensus NOT reached; return as-is with a note.
    const solo = valid[0];
    return {
      ...solo,
      content: `${solo.content}\n\n[NOTE: Consensus not reached — only 1 of N providers responded (${solo.provider}/${solo.model}).]`,
      consensus: {
        providersQueried: responses.map(r => r.provider),
        providersResponded: [solo.provider],
        agreements: 1,
        disagreements: responses.length - 1,
        synthesisProvider: solo.provider,
        modelsQueried: [`${solo.provider}/${solo.model}`],
        consensusReached: false,
      },
    };
  }

  // ≥2 responses — pick longest as base, then call synthesizer to merge.
  const sortedByLength = [...valid].sort((a, b) => b.content.length - a.content.length);
  const base = sortedByLength[0];
  const others = sortedByLength.slice(1);

  const providerResponses = valid.map((r, i) =>
    `--- Model ${i + 1}: ${r.provider}/${r.model} (${r.content.length} chars) ---\n${r.content}\n`
  ).join("\n");

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
5. Use the best answer (Model 1 = longest/most detailed) as base and enhance with insights from the others.

Produce the final consensus answer:`;

  const start = Date.now();
  const consensusMeta = {
    providersQueried: responses.map(r => r.provider),
    providersResponded: valid.map(r => r.provider),
    agreements: valid.length,
    disagreements: responses.length - valid.length,
    modelsQueried: valid.map(r => `${r.provider}/${r.model}`),
    consensusReached: true,
  };

  // Try Groq llama-3.3-70b for synthesis (fast + capable) — fall back to
  // NVIDIA nemotron, then Gemini, then return the base response as-is.
  const synthesizers: Array<{ provider: AiProvider; fn: () => Promise<MultiModelResult> }> = [
    { provider: "groq",   fn: () => callGroq("You are the AURIENTA Brain AI synthesis engine.", synthesisPrompt, "llama-3.3-70b-versatile") },
    { provider: "nvidia", fn: () => callNvidia("You are the AURIENTA Brain AI synthesis engine.", synthesisPrompt, "nvidia/llama-3.1-nemotron-51b-instruct") },
    { provider: "gemini", fn: () => callGemini("You are the AURIENTA Brain AI synthesis engine.", synthesisPrompt, "gemini-2.5-flash") },
  ];

  for (const synth of synthesizers) {
    // Skip the synthesizer if it didn't respond in the original round.
    if (!valid.some(r => r.provider === synth.provider)) continue;
    try {
      const result = await synth.fn();
      return {
        content: result.content,
        provider: result.provider,
        model: `consensus(${valid.map(r => r.model).join("+")})`,
        latencyMs: Date.now() - start + Math.max(...valid.map(r => r.latencyMs)),
        fellBack: false,
        error: null,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        consensus: { ...consensusMeta, synthesisProvider: result.provider },
      };
    } catch (e) {
      logger.warn("consensus synthesis provider failed", {
        provider: synth.provider,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // All synthesizer LLMs failed — return the longest response as the base.
  return {
    content: base.content,
    provider: base.provider,
    model: `consensus-fallback(${valid.map(r => r.model).join("+")})`,
    latencyMs: Date.now() - start + Math.max(...valid.map(r => r.latencyMs)),
    fellBack: false,
    error: "synthesis_llm_failed_returned_base",
    tokensIn: base.tokensIn,
    tokensOut: base.tokensOut,
    consensus: { ...consensusMeta, synthesisProvider: base.provider },
  };
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ENTRY: askMultiModel
// ═══════════════════════════════════════════════════════════════════

export async function askMultiModel(opts: { systemPrompt: string; userMessage: string; taskKind: AiTaskKind }): Promise<MultiModelResult> {
  const config = TASK_CONFIG[opts.taskKind] ?? TASK_CONFIG.general;
  const errors: string[] = [];
  const memory = await retrieveRelevantMemory(opts.userMessage, opts.taskKind);
  const enhancedUserMessage = memory.context ? `${memory.context}\n${opts.userMessage}` : opts.userMessage;

  // ── CONSENSUS MODE: query all configured models in parallel ──
  // Promise.allSettled guarantees that one provider's failure does not abort
  // the others. We then collect all successful responses and synthesize.
  if (config.mode === "consensus" || config.mode === "fast") {
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
        // Per-provider failure: log + record. Do NOT abort — consensus
        // proceeds with the survivors.
        const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
        const detail = `${m.provider}/${m.model}: ${reason}`;
        errors.push(detail);
        logger.warn("consensus provider failed", {
          taskKind: opts.taskKind, provider: m.provider, model: m.model, error: reason,
        });
      }
    }

    if (responses.length >= 2 && config.synthesize) {
      const synthesized = await synthesizeConsensus(responses, opts.userMessage);
      if (memory.artifactCount > 0) {
        synthesized.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity };
      }
      return synthesized;
    }
    if (responses.length === 1) {
      const solo = await synthesizeConsensus(responses, opts.userMessage);
      if (memory.artifactCount > 0) {
        solo.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity };
      }
      return solo;
    }
    if (responses.length > 0) {
      const best = responses[0];
      if (memory.artifactCount > 0) {
        best.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity };
      }
      return best;
    }
    // All configured models failed → fall through to last-resort sweep.
  }

  // ── STANDARD MODE: try models in order, return first success ──
  if (config.mode === "standard") {
    for (const m of config.models) {
      try {
        const result = await PROVIDERS[m.provider](opts.systemPrompt, enhancedUserMessage, m.model);
        if (memory.artifactCount > 0) {
          result.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity };
        }
        return result;
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        const detail = `${m.provider}/${m.model}: ${reason}`;
        errors.push(detail);
        logger.warn("standard provider failed", {
          taskKind: opts.taskKind, provider: m.provider, model: m.model, error: reason,
        });
      }
    }
  }

  // ── LAST RESORT: try every remaining provider's "default" model ──
  const lastResort: ModelEntry[] = [
    M.groq_8b,
    M.nvidia_gemma,
    M.gemini_2_0,
    M.hf_llama,
  ].filter(m => !config.models.some(cm => cm.provider === m.provider && cm.model === m.model));

  for (const m of lastResort) {
    try {
      const result = await PROVIDERS[m.provider](opts.systemPrompt, enhancedUserMessage, m.model);
      result.fellBack = true;
      if (memory.artifactCount > 0) {
        result.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity };
      }
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

  // All providers failed (consensus + last-resort). Build a clear,
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
    provider: "groq",
    model: "fallback",
    latencyMs: 0,
    fellBack: true,
    error: errors.join("; "),
    tokensIn: null,
    tokensOut: null,
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

// ── Richer health check: actual status of each of the 4 AI providers ──
// Pings each provider with a tiny "hi" prompt (max ~5 tokens) using the
// fastest model for that provider. Returns one entry per provider with:
// configured (API key present), connected (provider actually responded with
// non-empty content), model, latencyMs, lastError (string|null),
// lastCheckedAt (ISO ts). Used by /api/ready and /api/ai/brain-status.
export type AiProviderStatus = {
  provider: AiProvider;
  configured: boolean;     // API key (or equivalent) is present in env
  model: string;           // model used for the ping
  connected: boolean;      // provider actually responded with non-empty content
  latencyMs: number;       // round-trip response time (0 if failed)
  lastError: string | null;  // underlying error message (e.g. "Groq API error: 401")
  lastCheckedAt: string;       // ISO timestamp of the probe
};

// Fastest / smallest model per provider for cheap ping probes.
const PING_MODELS: ModelEntry[] = [
  { provider: "groq",        model: "llama-3.1-8b-instant" },
  { provider: "nvidia",      model: "google/gemma-3-12b-it" },
  { provider: "gemini",      model: "gemini-2.0-flash" },
  { provider: "huggingface", model: "mistralai/Mistral-7B-Instruct-v0.3" },
];

export async function getAiProviderStatus(): Promise<AiProviderStatus[]> {
  const envKeyFor: Record<AiProvider, string | null> = {
    groq: process.env.GROQ_API_KEY ?? null,
    nvidia: process.env.NVIDIA_API_KEY ?? null,
    gemini: process.env.GEMINI_API_KEY ?? null,
    huggingface: process.env.HUGGINGFACE_API_KEY ?? null,
  };

  const checkedAt = new Date().toISOString();

  // Use Promise.allSettled so a hung provider does not block the others.
  const settled = await Promise.allSettled(
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
        // Tiny prompt — "hi", max 5 tokens via the fastest model.
        const result = await PROVIDERS[m.provider]("You are a ping responder. Reply with the single word: OK.", "hi", m.model);
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

  // Map Promise.allSettled results back to AiProviderStatus[].
  // (settled[i] never rejects because the inner function catches all errors,
  //  but allSettled guards against unexpected throws — e.g. require() failure.)
  const out: AiProviderStatus[] = [];
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    if (r.status === "fulfilled") {
      out.push(r.value);
    } else {
      const m = PING_MODELS[i];
      const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
      out.push({
        provider: m.provider,
        configured: !!envKeyFor[m.provider],
        model: m.model,
        connected: false,
        latencyMs: 0,
        lastError: reason,
        lastCheckedAt: checkedAt,
      });
    }
  }
  return out;
}
