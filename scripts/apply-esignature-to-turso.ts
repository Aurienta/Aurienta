// One-off script: apply the E-Signature schema (3 new tables) to Turso
// cloud directly via @libsql/client. Mirrors scripts/apply-schema-to-turso.ts.
//
// Run: bun run scripts/apply-esignature-to-turso.ts
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const url = "libsql://aurienta-fortleem.aws-us-east-1.turso.io";
const authToken =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODYzMjM5MjUsImlkIjoiMDE5ZmU5MzItZTIwMS03MzYwLWFkZTUtMTI2NThkNzZlMjkyIiwia2lkIjoiMlNGbjFBZlVSdTVMUXlrTGRzR3djNXdWV1V2VGVxV2FWODZRdlhST0MxYyIsInJpZCI6ImVjMzdiMjcyLTA5ZjItNDhlNy1iMWYxLTBkZWUxNjEzNjdkMSJ9.SWdaohrj5xtvI-NbLYYGaxvGEjCUbDOt15O2fxoa3V7I_WNoRGfTp1YkIFLmDWa0_sgdflC_Qy0-CQQPy9nODw";

const client = createClient({ url, authToken });

const sqlPath = join(process.cwd(), "scripts", "esignature-schema.sql");
const sql = readFileSync(sqlPath, "utf8");

const statements: string[] = [];
let current = "";
for (const line of sql.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("--")) continue;
  current += line + "\n";
  if (trimmed.endsWith(";")) {
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
    if (msg.includes("already exists")) {
      ok++;
    } else {
      failed++;
      console.error(`FAILED: ${msg.slice(0, 160)}`);
    }
  }
}

console.log(`\nDone: ${ok} ok, ${failed} failed`);

// Verify tables exist
const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'ESignature%'"
);
console.log("E-Signature tables in Turso:");
for (const row of tables.rows) {
  console.log(`  - ${(row as { name: string }).name}`);
}
