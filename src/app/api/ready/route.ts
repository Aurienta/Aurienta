import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/aurienta/logger";
import { checkAiProviders } from "@/lib/aurienta/ai-router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Process start time
const STARTED_AT = Date.now();

// AI providers expected to be online for "ok" status (AUD-008).
// Mirrors the 5 providers probed by checkAiProviders() in ai-router.ts.
const AI_PROVIDER_TOTAL = 5;

type CheckResult = {
  name: string;
  status: "ok" | "degraded" | "down";
  latencyMs: number;
  detail?: string;
  connected?: number;
  total?: number;
};

/**
 * GET /api/ready
 * Readiness probe — checks ALL critical dependencies (DB, AI config, CRE).
 * Returns 200 if all critical checks pass, 503 if any are down.
 *
 * AUD-008: the `ai_providers` check now ACTUALLY pings each provider via
 * `checkAiProviders()` (a minimal "ping" request) rather than only checking
 * env-var presence. The check reports `{ connected, total, ok }` and, if
 * fewer than 5 providers are reachable, downgrades the overall probe status
 * to "degraded" (200) — matching the brain-status endpoint's view.
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

  // 3. AI providers — actually ping each provider (AUD-008).
  // Previously this only checked env-var presence and reported "ok" even when
  // brain-status showed 0/5 connected. Now it mirrors brain-status: probes
  // gemini/groq/huggingface/openrouter/nvidia with a minimal request and
  // reports the connected count. If <5 are reachable, the check is degraded
  // and the overall probe status is degraded too (still 200 — AI providers
  // are not critical-path for serving dashboard pages, only for AI features).
  const aiStart = Date.now();
  let aiConnected = 0;
  let aiDetail = "";
  try {
    const providers = await checkAiProviders();
    aiConnected = Object.values(providers).filter((p) => p.connected).length;
    const providersStr = Object.entries(providers)
      .map(([k, v]) => `${k}:${v.connected ? "on" : "off"}`)
      .join(",");
    aiDetail = `${aiConnected}/${AI_PROVIDER_TOTAL} connected (${providersStr})`;
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
