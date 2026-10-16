// AUDIT-ONLY script to inspect Turso production DB schema. Read-only queries.
//
// AUD-007: Turso auth token is read from process.env.TURSO_AUTH_TOKEN at
// runtime. Hardcoded tokens in source files are a credential leak and are
// revoked. The script refuses to run if the env var is unset.
import { createClient } from "@libsql/client";

const token = process.env.TURSO_AUTH_TOKEN ?? "";
if (!token) {
  console.error("TURSO_AUTH_TOKEN not set");
  process.exit(1);
}

const client = createClient({
  url: "libsql://aurienta-fortleem.aws-us-east-1.turso.io",
  authToken: token,
});

async function main() {
  // 1) List all tables
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log("=== TABLES ===");
  for (const row of tables.rows) {
    console.log(row.name);
  }
  console.log(`Total tables: ${tables.rows.length}`);

  // 2) Get schema (CREATE statements) for each table
  const schema = await client.execute(
    "SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log("\n=== FULL CREATE STATEMENTS ===");
  for (const row of schema.rows) {
    console.log(`\n--- ${row.name} ---`);
    console.log(row.sql);
  }

  // 3) List indexes
  const indexes = await client.execute(
    "SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' ORDER BY tbl_name, name"
  );
  console.log("\n=== INDEXES ===");
  for (const row of indexes.rows) {
    console.log(`${row.tbl_name}.${row.name} -> ${row.sql || "(auto)"}`);
  }
  console.log(`Total indexes: ${indexes.rows.length}`);

  // 4) Foreign key enforcement check (PRAGMA foreign_keys is per-connection)
  const fk = await client.execute("PRAGMA foreign_keys");
  console.log("\n=== PRAGMA foreign_keys ===");
  console.log(JSON.stringify(fk.rows));

  // 5) Quick row counts per table
  console.log("\n=== ROW COUNTS ===");
  for (const row of tables.rows) {
    const t = row.name;
    if (t.startsWith("_prisma_") || t.startsWith("sqlite_")) continue;
    try {
      const c = await client.execute(`SELECT COUNT(*) AS n FROM "${t}"`);
      console.log(`${t}: ${c.rows[0].n}`);
    } catch (e) {
      console.log(`${t}: ERR ${e.message}`);
    }
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
