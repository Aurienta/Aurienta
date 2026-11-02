import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/aurienta/logger";
import { opsCache, cacheAside } from "@/lib/aurienta/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Process start time — used to compute uptime on every health probe.
const STARTED_AT = Date.now();

/**
 * GET /api/health
 * Returns 200 { status:"ok", uptime, db:"connected"|"error" }.
 * Used by container orchestrators (Docker healthcheck, k8s liveness) and
 * by uptime monitors.
 *
 * PERFORMANCE: db state is cached for 3s (opsCache) to avoid hammering
 * the database when uptime monitors poll every 5-10s. The status field
 * is always fresh; only the DB ping is cached.
 */
export async function GET() {
  let dbState: "connected" | "error" = "error";
  try {
    // Cache the DB round-trip for 3s — health monitors poll frequently
    // and the DB state doesn't change meaningfully within that window.
    const cached = await cacheAside(opsCache, "health:db", async () => {
      await db.user.count();
      return "connected" as const;
    }, 3_000);
    dbState = cached;
  } catch (e) {
    logger.error("healthcheck db ping failed", {
      err: e instanceof Error ? e.message : String(e),
    });
  }

  const uptimeMs = Date.now() - STARTED_AT;
  const ok = dbState === "connected";

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      uptime: uptimeMs,
      uptime_human: `${Math.floor(uptimeMs / 1000)}s`,
      db: dbState,
      service: "aurienta",
      version: process.env.npm_package_version ?? "0.2.0",
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
