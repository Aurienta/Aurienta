// AURIENTA — Push the RateLimitEntry table (AUD-030 / AUD-031) to Turso via DDL.
//
// The Prisma 7 CLI does not natively push schema changes to a libsql://
// datasource, so we apply the DDL directly via @libsql/client. Idempotent —
// every statement uses IF NOT EXISTS.
//
// Usage:
//   DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... bun run scripts/push-rate-limit-table.ts
//
// If credentials are missing the script prints the DDL so the operator can
// apply it manually via the Turso shell.

import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

const DDL = [
  `CREATE TABLE IF NOT EXISTS "RateLimitEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "RateLimitEntry_key_key" ON "RateLimitEntry"("key")`,
  `CREATE INDEX IF NOT EXISTS "RateLimitEntry_windowStart_idx" ON "RateLimitEntry"("windowStart")`,
];

// If DATABASE_URL points to a local file or no token is provided, print DDL
// and exit 0 so CI / build pipelines don't fail.
if (!url || (!token && (url.startsWith("libsql://") || url.startsWith("https://")))) {
  console.warn(
    "⚠️  DATABASE_URL/TURSO_AUTH_TOKEN not configured for a remote Turso DB."
  );
  console.warn("   DDL to apply manually (idempotent):\n");
  for (const stmt of DDL) console.log(stmt + ";\n");
  process.exit(0);
}

console.log(`🔗 Connecting to ${url}`);
const client = createClient({ url, authToken: token ?? "" });

async function main() {
  let ok = 0;
  let skip = 0;
  let fail = 0;
  for (const sql of DDL) {
    try {
      await client.execute(sql);
      console.log(`  ✓ ${sql.match(/(?:INDEX|TABLE) IF NOT EXISTS "([^"]+)"/)?.[1] ?? "?"}`);
      ok++;
    } catch (e: any) {
      if (e.message?.includes("already exists")) {
        console.log(`  ⊙ ${sql.match(/(?:INDEX|TABLE) IF NOT EXISTS "([^"]+)"/)?.[1]} (already exists)`);
        skip++;
      } else {
        console.error(`  ✗ ${sql}: ${e.message}`);
        fail++;
      }
    }
  }
  console.log(`\nDone: ${ok} created, ${skip} skipped, ${fail} failed.`);

  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='RateLimitEntry'"
  );
  if (result.rows.length === 1) {
    console.log("✅ RateLimitEntry table verified present.");
  } else {
    console.error("❌ RateLimitEntry table NOT found after DDL.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
