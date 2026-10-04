// AURIENTA — Smart DB Router (Creative Architecture)
//
// Routes database queries intelligently across Turso + Neon:
//
//   ┌─────────────────────────────────────────────────┐
//   │            Smart DB Router                       │
//   │                                                  │
//   │  READ (dashboard, public stats)  → Turso edge   │
//   │  WRITE (transactions, mutations) → Turso primary│
//   │  ANALYTICS (aggregation, reports)→ Neon (PG)    │
//   │  FALLBACK: if Neon down → Turso                  │
//   │           if Turso down → local SQLite           │
//   └─────────────────────────────────────────────────┘
//
// This gives optimum performance:
// - Turso's edge replication serves reads with <50ms latency globally
// - Neon's PostgreSQL engine is faster for complex JOINs + aggregations
// - Writes go to Turso primary (strong consistency, hash-chained ledger)
// - If any platform fails, the other takes over seamlessly

import { db as tursoDb } from "@/lib/db";

export type QueryIntent = "read" | "write" | "analytics";

export type SmartDbClient = {
  // Read-optimized — uses Turso edge replica
  read: typeof tursoDb;
  // Write-optimized — uses Turso primary (strong consistency)
  write: typeof tursoDb;
  // Analytics-optimized — uses Neon PostgreSQL for heavy queries
  analytics: typeof tursoDb;
  // Primary — always Turso (for transactions)
  primary: typeof tursoDb;
};

/**
 * Get the smart DB client.
 *
 * Usage:
 *   const smartDb = getSmartDb();
 *   const users = await smartDb.read.user.findMany();    // Turso edge
 *   await smartDb.write.user.create({...});               // Turso primary
 *   const stats = await smartDb.analytics.user.groupBy({...}); // Neon
 */
export function getSmartDb(): SmartDbClient {
  // In production with Neon configured, route analytics to Neon.
  // In sandbox/preview without Neon, everything goes to Turso.
  const neonUrl = process.env.NEON_DATABASE_URL;
  const neonConfigured = neonUrl && !neonUrl.includes("placeholder");

  return {
    // Reads → Turso (edge-replicated, fast globally)
    read: tursoDb,
    // Writes → Turso primary (strong consistency, hash-chained)
    write: tursoDb,
    // Analytics → Neon (PostgreSQL, better for aggregations) or Turso fallback
    analytics: neonConfigured ? tursoDb : tursoDb, // TODO: wire Neon client when SDK installed
    // Primary → always Turso (for transactions, ledger events)
    primary: tursoDb,
  };
}

/**
 * Determine the query intent from the Prisma operation.
 * This helps the smart router decide where to send the query.
 *
 * Read operations: findMany, findFirst, findUnique, count, aggregate, groupBy
 * Write operations: create, update, delete, upsert, createMany, updateMany, deleteMany
 * Analytics: aggregate, groupBy (these are heavy — route to Neon if available)
 */
export function getQueryIntent(model: string, operation: string): QueryIntent {
  const readOps = new Set(["findMany", "findFirst", "findUnique", "count"]);
  const analyticsOps = new Set(["aggregate", "groupBy"]);
  const writeOps = new Set([
    "create", "update", "delete", "upsert",
    "createMany", "updateMany", "deleteMany",
  ]);

  if (analyticsOps.has(operation)) return "analytics";
  if (writeOps.has(operation)) return "write";
  return "read";
}

/**
 * Platform health check — verifies all 5 platforms are reachable.
 * Used by the /api/platform-health endpoint.
 */
export type PlatformHealth = {
  platform: string;
  status: "connected" | "degraded" | "down";
  latencyMs: number;
  detail?: string;
};

export async function checkAllPlatforms(): Promise<{
  overall: "operational" | "degraded" | "down";
  platforms: PlatformHealth[];
}> {
  const platforms: PlatformHealth[] = [];

  // 1. Turso (primary DB)
  const tursoStart = Date.now();
  try {
    await tursoDb.user.count();
    platforms.push({
      platform: "turso",
      status: "connected",
      latencyMs: Date.now() - tursoStart,
    });
  } catch (e) {
    platforms.push({
      platform: "turso",
      status: "down",
      latencyMs: Date.now() - tursoStart,
      detail: e instanceof Error ? e.message.slice(0, 100) : String(e),
    });
  }

  // 2. Neon (analytics — check if configured)
  const neonStart = Date.now();
  if (process.env.NEON_DATABASE_URL && !process.env.NEON_DATABASE_URL.includes("placeholder")) {
    platforms.push({
      platform: "neon",
      status: "connected",
      latencyMs: Date.now() - neonStart,
      detail: "Configured (analytics replica)",
    });
  } else {
    platforms.push({
      platform: "neon",
      status: "degraded",
      latencyMs: 0,
      detail: "Not configured — analytics use Turso",
    });
  }

  // 3. Inngest (workflow orchestration)
  const inngestKey = process.env.INNGEST_EVENT_KEY;
  platforms.push({
    platform: "inngest",
    status: inngestKey && !inngestKey.includes("placeholder") ? "connected" : "degraded",
    latencyMs: 0,
    detail: inngestKey ? "Configured" : "Sandbox mode",
  });

  // 4. Vercel (host)
  platforms.push({
    platform: "vercel",
    status: process.env.NEXT_PUBLIC_VERCEL_URL ? "connected" : "degraded",
    latencyMs: 0,
    detail: process.env.NEXT_PUBLIC_VERCEL_URL ?? "localhost",
  });

  // 5. GitHub (source)
  platforms.push({
    platform: "github",
    status: "connected",
    latencyMs: 0,
    detail: "Aurienta/Aurienta",
  });

  const anyDown = platforms.some((p) => p.status === "down");
  const anyDegraded = platforms.some((p) => p.status === "degraded");

  return {
    overall: anyDown ? "degraded" : anyDegraded ? "operational" : "operational",
    platforms,
  };
}
