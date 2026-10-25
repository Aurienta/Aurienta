// One-off script: apply schema.sql to Turso via @libsql/client.
// Run: bun run scripts/apply-schema-to-turso.ts
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !url.startsWith("libsql://")) {
  console.error("DATABASE_URL must be a libsql:// URL");
  process.exit(1);
}
if (!authToken) {
  console.error("TURSO_AUTH_TOKEN must be set");
  process.exit(1);
}

const client = createClient({ url, authToken });

const sql = readFileSync("/tmp/schema.sql", "utf8");

// Split into statements (each ends with ;). Handle multi-line statements.
const statements: string[] = [];
let current = "";
let inString = false;
for (const line of sql.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("--")) continue;
  current += line + "\n";
  // Simple heuristic: a statement ends at a line that ends with ;
  if (trimmed.endsWith(";") && !inString) {
    statements.push(current.trim());
    current = "";
  }
}

console.log(`Found ${statements.length} SQL statements to execute`);

let ok = 0;
let failed = 0;
for (const stmt of statements) {
  try {
    await client.execute(stmt);
    ok++;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Ignore "already exists" errors
    if (msg.includes("already exists")) {
      ok++;
    } else {
      failed++;
      console.error(`FAILED: ${msg.slice(0, 120)}`);
      console.error(`  stmt: ${stmt.slice(0, 80)}...`);
    }
  }
}

console.log(`\nDone: ${ok} ok, ${failed} failed`);

// Verify: count tables
const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name"
);
console.log(`Tables in Turso: ${tables.rows.length}`);
