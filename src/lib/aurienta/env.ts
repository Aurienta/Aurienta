// AURIENTA env validation — 4 native AI providers (Groq, NVIDIA, Gemini, HuggingFace).
// NO OpenRouter. 4 native AI providers only.

type EnvShape = {
  databaseUrl: string;
  nodeEnv: string;
  logLevel: "debug" | "info" | "warn" | "error";
  cookieSecure: boolean;
  publicBaseUrl: string;
  allowDemoSignIn: boolean;
  fieldEncryptionKey: string;
  // AI provider keys (AI-REBUILD): loaded from env and exposed on `env` so
  // that ai-router.ts and the readiness/health endpoints can read them
  // without re-walking process.env. A key is `null` when not set — callers
  // must handle that (the router skips un-configured providers in consensus).
  groqApiKey: string | null;
  nvidiaApiKey: string | null;
  geminiApiKey: string | null;
  huggingfaceApiKey: string | null;
  openrouterApiKey: string | null;
  // Number of AI providers with a key present (0..5). Used by /api/ready.
  aiProvidersConfigured: number;
};

function read(): EnvShape {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const rawLevel = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  const level = (["debug", "info", "warn", "error"].includes(rawLevel) ? rawLevel : "info") as EnvShape["logLevel"];
  const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? "http://localhost:3000";
  const cookieSecure = true;
  const allowDemoSignIn = process.env.ALLOW_DEMO_SIGNIN === "true";
  let fieldEncryptionKey = process.env.FIELD_ENCRYPTION_KEY ?? "";
  // SECURITY FIX (PLATFORM-FULL-AUDIT-AND-REMEDIATION-001 / P0-3):
  // Previously this branch fell back to a hardcoded dev key
  // (`aurienta-dev-field-key-32bytes!!`) which actually decoded to 32 bytes
  // and SILENTLY passed encryption.ts's length check — meaning production
  // PII was being encrypted with a publicly-known key whenever the env var
  // was missing. We now leave it empty; encryption.ts getKey() throws
  // loudly on first use ("must decode to 32 bytes, got 0"). This is the
  // correct lazy-fail behavior — module load (and therefore `next build`)
  // stays green, but any code path that actually encrypts/decrypts PII
  // refuses to run without a real key.
  if (!fieldEncryptionKey) {
    if (nodeEnv === "production") {
      console.error("[env] FATAL: FIELD_ENCRYPTION_KEY is not set — encryption will fail at runtime.");
    } else {
      console.warn("[env] WARNING: FIELD_ENCRYPTION_KEY is not set — field encryption is disabled until set.");
    }
  }
  if (!databaseUrl) console.error("[env] FATAL: DATABASE_URL is not set");
  if (nodeEnv === "production" && allowDemoSignIn) console.warn("[env] WARNING: ALLOW_DEMO_SIGNIN=true in production — sandbox/pilot mode.");

  // ── AI provider keys (AI-REBUILD) ──
  // All 4 keys are read from environment and exposed via `env`. ai-router.ts
  // also reads process.env directly (for backward compat / lazy loading) so
  // both paths agree. A null value means "key not configured" — the AI router
  // will skip that provider in consensus and report it as unconfigured in
  // getAiProviderStatus().
  const groqApiKey = process.env.GROQ_API_KEY || null;
  const nvidiaApiKey = process.env.NVIDIA_API_KEY || null;
  const geminiApiKey = process.env.GEMINI_API_KEY || null;
  const huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY || null;
  const openrouterApiKey = process.env.OPENROUTER_API_KEY || null;
  const aiProvidersConfigured = [
    groqApiKey, nvidiaApiKey, geminiApiKey, huggingfaceApiKey, openrouterApiKey,
  ].filter(k => !!k).length;
  if (aiProvidersConfigured === 0) {
    console.error("[env] FATAL: 0 AI provider API keys are configured — Brain AI will always return AI_FALLBACK.");
  } else if (aiProvidersConfigured < 5) {
    console.warn(`[env] WARNING: ${aiProvidersConfigured}/5 AI provider API keys are configured — consensus will degrade for some tasks.`);
  }

  return {
    databaseUrl, nodeEnv, logLevel: level, cookieSecure, publicBaseUrl, allowDemoSignIn, fieldEncryptionKey,
    groqApiKey, nvidiaApiKey, geminiApiKey, huggingfaceApiKey, openrouterApiKey, aiProvidersConfigured,
  };
}

export const env = read();
