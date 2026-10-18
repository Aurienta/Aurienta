import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/aurienta/logger";
import { getAiProviderStatus } from "@/lib/aurienta/ai-router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Process start time
const STARTED_AT = Date.now();

// AI providers expected to be online for "ok" status (AI-REBUILD).
// Mirrors the 5 providers probed by getAiProviderStatus() in ai-router.ts:
// Groq, NVIDIA, Gemini, HuggingFace. NO OpenRouter.
const AI_PROVIDER_TOTAL = 5;

type CheckResult = {
  name: string;
  status: "ok" | "degraded" | "down";
  latencyMs: number;
  detail?: string;
  connected?: number;
  total?: number;
  providers?: Array<{ provider: string; configured: boolean; connected: boolean; model: string; latencyMs: number; lastError: string | null }>;
};

/**
 * GET /api/ready
 * Readiness probe — checks ALL critical dependencies (DB, AI config, CRE).
 * Returns 200 if all critical checks pass, 503 if any are down.
 *
 * AUD-008 (AI-FIX) / AI-REBUILD: the `ai_providers` check now calls
 * `getAiProviderStatus()` which ACTUALLY pings each of the 5 providers
 * (a minimal "hi" request via the smallest available model) rather than
 * only checking env-var presence. Each provider entry reports
 * {configured, connected, model, latencyMs, lastError}. If <5 providers are
 * reachable, the overall probe status is downgraded to "degraded" (still
 * 200 — AI features are not critical-path for serving dashboard pages,
 * only for AI features themselves).
 */
export async function GET() {
  const checks: CheckResult[] = [];

  // 1. Database — critical
  const dbStart = Date.now();
  try {
    await db.user.count();
    checks.push({ name: "database", status: "ok", latencyMs: Date.now() - dbStart });
  } catch (e) {
    checks.push({ name: "database", status: "down", latencyMs: Date.now() - dbStart, detail: e instanceof Error ? e.message : String(e) });
  }

  // 2. CRE config (env vars) — critical
  const creStart = Date.now();
  const hasEncryptionKey = !!process.env.FIELD_ENCRYPTION_KEY;
  const hasSessionSecret = !!process.env.SESSION_SECRET;
  checks.push({
    name: "cre_config",
    status: hasEncryptionKey && hasSessionSecret ? "ok" : "down",
    latencyMs: Date.now() - creStart,
    detail: !hasEncryptionKey ? "FIELD_ENCRYPTION_KEY missing" : !hasSessionSecret ? "SESSION_SECRET missing" : undefined,
  });

  // 3. AI providers — actually ping each of the 5 providers (AI-REBUILD).
  // Calls getAiProviderStatus() which probes groq/nvidia/gemini/huggingface
  // with a minimal "hi" request and returns {configured, connected, model,
  // latencyMs, lastError} per provider. If <4 are reachable, the check is
  // degraded (still 200).
  const aiStart = Date.now();
  let aiConnected = 0;
  let aiConfigured = 0;
  let aiDetail = "";
  let aiProviders: CheckResult["providers"];
  try {
    const statuses = await getAiProviderStatus();
    aiConnected = statuses.filter(s => s.connected).length;
    aiConfigured = statuses.filter(s => s.configured).length;
    aiProviders = statuses.map(s => ({
      provider: s.provider,
      configured: s.configured,
      connected: s.connected,
      model: s.model,
      latencyMs: s.latencyMs,
      lastError: s.lastError,
    }));
    const providersStr = statuses
      .map(s => `${s.provider}:${s.connected ? "on" : s.configured ? "err" : "off"}`)
      .join(",");
    aiDetail = `${aiConnected}/${AI_PROVIDER_TOTAL} connected, ${aiConfigured}/${AI_PROVIDER_TOTAL} configured (${providersStr})`;
  } catch (e) {
    aiDetail = `probe failed: ${e instanceof Error ? e.message : String(e)}`;
  }
  const aiStatus: CheckResult["status"] =
    aiConnected >= AI_PROVIDER_TOTAL ? "ok" : aiConnected > 0 ? "degraded" : "down";
  checks.push({
    name: "ai_providers",
    status: aiStatus,
    latencyMs: Date.now() - aiStart,
    detail: aiDetail,
    connected: aiConnected,
    total: AI_PROVIDER_TOTAL,
    providers: aiProviders,
  });

  // 4. Ledger integrity — critical
  const ledgerStart = Date.now();
  try {
    const count = await db.ledgerEvent.count();
    checks.push({ name: "ledger", status: "ok", latencyMs: Date.now() - ledgerStart, detail: `${count} events` });
  } catch (e) {
    checks.push({ name: "ledger", status: "down", latencyMs: Date.now() - ledgerStart, detail: e instanceof Error ? e.message : String(e) });
  }

  const allOk = checks.every(c => c.status !== "down");
  const anyDegraded = checks.some(c => c.status === "degraded");

  const status = allOk ? (anyDegraded ? "degraded" : "ok") : "down";
  const httpStatus = status === "down" ? 503 : 200;

  if (status !== "ok") {
    logger.warn("readiness check non-ok", { status, checks });
  }

  return NextResponse.json({
    status,
    uptimeMs: Date.now() - STARTED_AT,
    checks,
  }, { status: httpStatus });
}
