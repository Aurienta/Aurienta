import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Process start time
const STARTED_AT = Date.now();

type CheckResult = { name: string; status: "ok" | "degraded" | "down"; latencyMs: number; detail?: string };

/**
 * GET /api/ready
 * Readiness probe — checks ALL critical dependencies (DB, AI config, CRE).
 * Returns 200 if all critical checks pass, 503 if any are down.
 * Used by orchestrators to decide whether to route traffic to this instance.
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

  // 3. AI providers — non-critical (degraded mode if down)
  const aiStart = Date.now();
  const aiKeys = ["GEMINI_API_KEY", "OPENAI_API_KEY", "GROQ_API_KEY"].filter(k => !!process.env[k]);
  checks.push({
    name: "ai_providers",
    status: aiKeys.length >= 1 ? "ok" : "degraded",
    latencyMs: Date.now() - aiStart,
    detail: `${aiKeys.length}/3 primary providers configured`,
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
