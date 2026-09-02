// AURIENTA Brain AI — Multi-Model Consensus Orchestrator
//
// The Brain orchestrates 5 AI providers in a CONSENSUS model:
//   1. Google Gemini  — complex reasoning, feasibility, analysis
//   2. OpenAI GPT-4   — conversational copilot, explanations
//   3. Groq Llama 3.2 — low-latency: fraud, anomaly, triage
//   4. HuggingFace    — Mixtral 8x7B: sanity check, consistency review
//   5. OpenRouter     — multi-model gateway fallback
//
// CONSENSUS MODE: For critical tasks, the Brain queries multiple providers
// in PARALLEL and synthesizes their responses into a single consensus answer.
//
// CONTINUOUS LEARNING: Before each AI call, the Brain searches its memory
// (AiArtifact table) for similar past interactions and includes relevant
// context.
//
// NO Z**-sdk: the proprietary SDK has been completely removed from this router.

/* eslint-disable @typescript-eslint/no-require-imports */
let GoogleGenerativeAI: any = null;
let OpenAI: any = null;
let Groq: any = null;

export type AiProvider = "gemini" | "openai" | "groq" | "huggingface" | "openrouter";
export type AiTaskKind =
  | "feasibility" | "pitch_deck" | "copilot" | "explain" | "anomaly" | "drift"
  | "fraud" | "sanity_check" | "triage" | "general" | "multilingual" | "advisory"
  | "board_briefing" | "charter_diff" | "graduation_coach" | "graduation_simulation"
  | "milestone_design" | "precedent_match" | "survival_drill" | "succession_plan"
  | "tax_suggestion" | "ir_answer" | "skill_equity_review" | "whistleblower_credibility"
  | "mentor_matching" | "salary_engine" | "evidence_verification";

type ConsensusMode = "consensus" | "standard" | "fast";
type TaskConfig = { mode: ConsensusMode; providers: AiProvider[]; synthesize: boolean };

const TASK_CONFIG: Record<AiTaskKind, TaskConfig> = {
  feasibility:    { mode: "consensus", providers: ["gemini", "openai", "groq"], synthesize: true },
  pitch_deck:     { mode: "consensus", providers: ["gemini", "openai", "groq"], synthesize: true },
  advisory:       { mode: "consensus", providers: ["gemini", "openai", "groq"], synthesize: true },
  copilot:        { mode: "standard", providers: ["openai", "gemini"], synthesize: false },
  explain:        { mode: "standard", providers: ["openai", "gemini"], synthesize: false },
  multilingual:   { mode: "standard", providers: ["openai", "gemini"], synthesize: false },
  sanity_check:   { mode: "consensus", providers: ["huggingface", "groq", "openai"], synthesize: true },
  anomaly:        { mode: "fast", providers: ["groq", "openai", "gemini"], synthesize: false },
  drift:          { mode: "fast", providers: ["groq", "openai", "gemini"], synthesize: false },
  fraud:          { mode: "fast", providers: ["groq", "openai"], synthesize: false },
  triage:         { mode: "fast", providers: ["groq", "openai"], synthesize: false },
  general:        { mode: "standard", providers: ["gemini", "openai", "groq"], synthesize: false },
  board_briefing:       { mode: "consensus", providers: ["gemini", "openai", "groq"], synthesize: true },
  charter_diff:         { mode: "consensus", providers: ["gemini", "openai", "groq"], synthesize: true },
  graduation_coach:     { mode: "consensus", providers: ["gemini", "openai", "groq"], synthesize: true },
  graduation_simulation:{ mode: "consensus", providers: ["gemini", "openai", "groq"], synthesize: true },
  milestone_design:     { mode: "consensus", providers: ["gemini", "openai", "groq"], synthesize: true },
  survival_drill:       { mode: "consensus", providers: ["gemini", "openai", "groq"], synthesize: true },
  succession_plan:      { mode: "consensus", providers: ["gemini", "openai", "groq"], synthesize: true },
  tax_suggestion:       { mode: "consensus", providers: ["gemini", "openai", "groq"], synthesize: true },
  ir_answer:            { mode: "consensus", providers: ["gemini", "openai", "groq"], synthesize: true },
  precedent_match:      { mode: "standard", providers: ["gemini", "openai"], synthesize: false },
  skill_equity_review:  { mode: "standard", providers: ["gemini", "openai"], synthesize: false },
  mentor_matching:      { mode: "standard", providers: ["gemini", "openai"], synthesize: false },
  salary_engine:        { mode: "standard", providers: ["groq", "openai"], synthesize: false },
  whistleblower_credibility: { mode: "fast", providers: ["groq", "openai"], synthesize: false },
  evidence_verification:     { mode: "fast", providers: ["groq", "openai"], synthesize: false },
};

export type MultiModelResult = {
  content: string; provider: AiProvider; model: string; latencyMs: number;
  fellBack: boolean; error: string | null; tokensIn: number | null; tokensOut: number | null;
  consensus?: { providersQueried: AiProvider[]; providersResponded: AiProvider[]; agreements: number; disagreements: number; synthesisProvider: AiProvider; };
  learnedFrom?: { artifactCount: number; topSimilarity: number; };
};

let geminiClient: any = null;
function getGemini() {
  if (geminiClient) return geminiClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!GoogleGenerativeAI) GoogleGenerativeAI = require("@google/generative-ai").GoogleGenerativeAI;
  geminiClient = new GoogleGenerativeAI(key);
  return geminiClient;
}
let openaiClient: any = null;
function getOpenAI() {
  if (openaiClient) return openaiClient;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!OpenAI) OpenAI = require("openai").default;
  openaiClient = new OpenAI({ apiKey: key });
  return openaiClient;
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

async function callGemini(system: string, user: string): Promise<MultiModelResult> {
  const client = getGemini(); if (!client) throw new Error("Gemini API key not configured");
  const start = Date.now();
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: system });
  const result = await model.generateContent(user);
  const usage = result.response.usageMetadata;
  return { content: result.response.text(), provider: "gemini", model: "gemini-2.0-flash", latencyMs: Date.now() - start, fellBack: false, error: null, tokensIn: usage?.promptTokenCount ?? null, tokensOut: usage?.candidatesTokenCount ?? null };
}
async function callOpenAI(system: string, user: string): Promise<MultiModelResult> {
  const client = getOpenAI(); if (!client) throw new Error("OpenAI API key not configured");
  const start = Date.now();
  const c = await client.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "system", content: system }, { role: "user", content: user }] });
  return { content: c.choices[0]?.message?.content ?? "", provider: "openai", model: "gpt-4o-mini", latencyMs: Date.now() - start, fellBack: false, error: null, tokensIn: c.usage?.prompt_tokens ?? null, tokensOut: c.usage?.completion_tokens ?? null };
}
async function callGroq(system: string, user: string): Promise<MultiModelResult> {
  const client = getGroq(); if (!client) throw new Error("Groq API key not configured");
  const start = Date.now();
  const c = await client.chat.completions.create({ model: "llama-3.1-8b-instant", messages: [{ role: "system", content: system }, { role: "user", content: user }] });
  return { content: c.choices[0]?.message?.content ?? "", provider: "groq", model: "llama-3.1-8b-instant", latencyMs: Date.now() - start, fellBack: false, error: null, tokensIn: c.usage?.prompt_tokens ?? null, tokensOut: c.usage?.completion_tokens ?? null };
}
async function callHuggingFace(system: string, user: string): Promise<MultiModelResult> {
  const key = getHfKey(); if (!key) throw new Error("HuggingFace API key not configured");
  const start = Date.now();
  const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ inputs: `<s>[INST] ${system}\n\n${user} [/INST]`, parameters: { max_new_tokens: 2048, temperature: 0.7, return_full_text: false } }) });
  if (!response.ok) throw new Error(`HuggingFace API error: ${response.status}`);
  const data = await response.json();
  return { content: Array.isArray(data) ? data[0]?.generated_text ?? "" : data.generated_text ?? "", provider: "huggingface", model: "mixtral-8x7b-instruct", latencyMs: Date.now() - start, fellBack: false, error: null, tokensIn: null, tokensOut: null };
}
async function callOpenRouter(system: string, user: string): Promise<MultiModelResult> {
  const key = getOrKey(); if (!key) throw new Error("OpenRouter API key not configured");
  const start = Date.now();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://aurienta.eg", "X-Title": "AURIENTA Constitutional AI" }, body: JSON.stringify({ model: "meta-llama/llama-3.3-70b-instruct", messages: [{ role: "system", content: system }, { role: "user", content: user }] }) });
  if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
  const data = await response.json();
  return { content: data.choices?.[0]?.message?.content ?? "", provider: "openrouter", model: "llama-3.3-70b-instruct", latencyMs: Date.now() - start, fellBack: false, error: null, tokensIn: data.usage?.prompt_tokens ?? null, tokensOut: data.usage?.completion_tokens ?? null };
}

const PROVIDERS: Record<AiProvider, (system: string, user: string) => Promise<MultiModelResult>> = {
  gemini: callGemini, openai: callOpenAI, groq: callGroq, huggingface: callHuggingFace, openrouter: callOpenRouter,
};

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

async function synthesizeConsensus(responses: MultiModelResult[], system: string, originalQuestion: string): Promise<MultiModelResult> {
  const validResponses = responses.filter(r => r.content && !r.fellBack);
  if (validResponses.length === 0) return responses[0] ?? { content: "[AI_FALLBACK] All consensus providers failed.", provider: "gemini", model: "consensus-fallback", latencyMs: 0, fellBack: true, error: "all_providers_failed", tokensIn: null, tokensOut: null };
  if (validResponses.length === 1) return validResponses[0];
  const providerResponses = validResponses.map((r, i) => `--- Provider ${i + 1}: ${r.provider} (${r.model}) ---\n${r.content}\n`).join("\n");
  const synthesisPrompt = `You are the AURIENTA Brain AI synthesis engine. Multiple AI providers have responded to the same constitutional question. Synthesize their responses into a single, authoritative consensus answer.\n\nORIGINAL QUESTION:\n${originalQuestion}\n\nPROVIDER RESPONSES:\n${providerResponses}\n\nSYNTHESIS RULES:\n1. If providers agree, produce a unified answer.\n2. If they disagree, note the disagreement and take the majority position.\n3. Never include provider names in the output.\n4. Keep the constitutional tone.\n5. Use the best answer as base and enhance with insights from others.\n\nProduce the final consensus answer:`;
  const start = Date.now();
  try {
    const synthesisResult = await callOpenAI("You are the AURIENTA Brain AI synthesis engine.", synthesisPrompt);
    return { content: synthesisResult.content, provider: synthesisResult.provider, model: `${synthesisResult.model} (consensus of ${validResponses.map(r => r.provider).join("+")})`, latencyMs: Date.now() - start + Math.max(...validResponses.map(r => r.latencyMs)), fellBack: false, error: null, tokensIn: synthesisResult.tokensIn, tokensOut: synthesisResult.tokensOut, consensus: { providersQueried: responses.map(r => r.provider), providersResponded: validResponses.map(r => r.provider), agreements: validResponses.length, disagreements: responses.length - validResponses.length, synthesisProvider: synthesisResult.provider } };
  } catch { return validResponses[0]; }
}

export async function askMultiModel(opts: { systemPrompt: string; userMessage: string; taskKind: AiTaskKind; }): Promise<MultiModelResult> {
  const config = TASK_CONFIG[opts.taskKind] ?? TASK_CONFIG.general;
  const errors: string[] = [];
  const memory = await retrieveRelevantMemory(opts.userMessage, opts.taskKind);
  const enhancedUserMessage = memory.context ? `${memory.context}\n${opts.userMessage}` : opts.userMessage;

  if (config.mode === "consensus" && config.providers.length >= 2) {
    const providersToQuery = config.providers.slice(0, 3);
    const results = await Promise.allSettled(providersToQuery.map(p => PROVIDERS[p](opts.systemPrompt, enhancedUserMessage)));
    const responses: MultiModelResult[] = [];
    for (let i = 0; i < results.length; i++) { const r = results[i]; if (r.status === "fulfilled") { responses.push(r.value); } else { errors.push(`${providersToQuery[i]}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`); } }
    if (config.synthesize && responses.length >= 2) { const synthesized = await synthesizeConsensus(responses, opts.systemPrompt, opts.userMessage); if (memory.artifactCount > 0) { synthesized.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity }; } return synthesized; }
    if (responses.length > 0) { const best = responses[0]; if (memory.artifactCount > 0) { best.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity }; } return best; }
    const remaining = ["openrouter"].filter(p => !providersToQuery.includes(p as AiProvider)) as AiProvider[];
    for (const p of remaining) { try { const result = await PROVIDERS[p](opts.systemPrompt, enhancedUserMessage); result.fellBack = true; if (memory.artifactCount > 0) { result.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity }; } return result; } catch (e) { errors.push(`${p}: ${e instanceof Error ? e.message : String(e)}`); } }
  }
  if (config.mode === "standard") { for (const provider of config.providers) { try { const result = await PROVIDERS[provider](opts.systemPrompt, enhancedUserMessage); if (memory.artifactCount > 0) { result.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity }; } return result; } catch (e) { errors.push(`${provider}: ${e instanceof Error ? e.message : String(e)}`); } } }
  if (config.mode === "fast") { for (const provider of config.providers) { try { const result = await PROVIDERS[provider](opts.systemPrompt, enhancedUserMessage); if (memory.artifactCount > 0) { result.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity }; } return result; } catch (e) { errors.push(`${provider}: ${e instanceof Error ? e.message : String(e)}`); } } }
  if (!config.providers.includes("openrouter")) { try { const result = await callOpenRouter(opts.systemPrompt, enhancedUserMessage); result.fellBack = true; if (memory.artifactCount > 0) { result.learnedFrom = { artifactCount: memory.artifactCount, topSimilarity: memory.topSimilarity }; } return result; } catch (e) { errors.push(`openrouter: ${e instanceof Error ? e.message : String(e)}`); } }
  return { content: `[AI_FALLBACK] All AI providers unavailable. Errors: ${errors.join("; ")}. The constitutional rules remain enforced by the CRE regardless.`, provider: "gemini", model: "fallback", latencyMs: 0, fellBack: true, error: errors.join("; "), tokensIn: null, tokensOut: null };
}

export async function checkAiProviders(): Promise<Record<AiProvider, { connected: boolean; model: string; latencyMs: number }>> {
  const results: Record<string, { connected: boolean; model: string; latencyMs: number }> = {};
  const providers: AiProvider[] = ["gemini", "openai", "groq", "huggingface", "openrouter"];
  await Promise.all(providers.map(async (p) => { try { const result = await PROVIDERS[p]("Reply with OK", "ping"); results[p] = { connected: !result.fellBack && result.content.length > 0, model: result.model, latencyMs: result.latencyMs }; } catch { results[p] = { connected: false, model: "—", latencyMs: 0 }; } }));
  return results as Record<AiProvider, { connected: boolean; model: string; latencyMs: number }>;
}
