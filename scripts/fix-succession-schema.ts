// AURIENTA — Fix SuccessionDeclaration schema drift (AUD-023).
//
// PROBLEM:
//   Turso production DB has a legacy `SuccessionDeclaration` table created
//   by an early migration with a `declarantId TEXT NOT NULL` column. Prisma 7
//   expects the column to be named `userId` (matching the model in
//   `prisma/schema.prisma`). Inserts issued by the Prisma client fail with
//   `SQLITE_CONSTRAINT_NOTNULL: declarantId` because Prisma never sets the
//   legacy `declarantId` column.
//
// FIX:
//   SQLite does not support `ALTER TABLE ... DROP COLUMN` reliably before
//   SQLite 3.35.0 (Turso ships libsql which is built on a recent SQLite, but
//   `DROP COLUMN` on a table referenced by foreign keys / indexes can still
//   misbehave). The safest path is the canonical SQLite "12-step" rebuild:
//
//     1. BEGIN;
//     2. CREATE TABLE SuccessionDeclaration_new (... correct schema ...);
//     3. INSERT INTO SuccessionDeclaration_new SELECT (mapped columns) FROM SuccessionDeclaration;
//     4. DROP TABLE SuccessionDeclaration;
//     5. ALTER TABLE SuccessionDeclaration_new RENAME TO SuccessionDeclaration;
//     6. Recreate indexes;
//     7. PRAGMA foreign_key_check;
//     8. COMMIT;
//
//   The script is IDEMPOTENT — if the legacy `declarantId` column is already
//   gone (or the table doesn't exist), it exits without changes. Run it once
//   against Turso; re-running it is a no-op.
//
// USAGE:
//   DATABASE_URL=libsql://aurienta-xxx.turso.io \
//   TURSO_AUTH_TOKEN=... \
//   bunx tsx scripts/fix-succession-schema.ts
//
// AUDIT-007: token is read from env, never hardcoded.

import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL ?? "";
const token = process.env.TURSO_AUTH_TOKEN ?? "";

if (!url || !token) {
  console.error(
    "DATABASE_URL and TURSO_AUTH_TOKEN must be set. Example:\n" +
      "  DATABASE_URL=libsql://aurienta-xxx.turso.io \\\n" +
      "  TURSO_AUTH_TOKEN=... \\\n" +
      "  bunx tsx scripts/fix-succession-schema.ts"
  );
  process.exit(1);
}

const client = createClient({ url, authToken: token });

/**
 * Inspect the live table's CREATE statement and return:
 *   - hasLegacyDeclarantId: true if `declarantId` column exists and is NOT NULL
 *   - createSql: the original CREATE TABLE statement (for index rebuild)
 */
async function inspectSuccessionDeclaration(): Promise<{
  hasLegacyDeclarantId: boolean;
  createSql: string | null;
}> {
  const res = await client.execute(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='SuccessionDeclaration'"
  );
  if (res.rows.length === 0) {
    return { hasLegacyDeclarantId: false, createSql: null };
  }
  const createSql = String(res.rows[0].sql ?? "");
  // Match `declarantId` as a column definition. We treat NOT NULL as the
  // breaking condition — a nullable `declarantId` doesn't block Prisma inserts
  // because Prisma just omits the column.
  const hasLegacyDeclarantId =
    /["\[]?declarantId["\]]?\s+TEXT\s+NOT\s+NULL/i.test(createSql);
  return { hasLegacyDeclarantId, createSql };
}

/**
 * List indexes on SuccessionDeclaration so we can recreate them after the
 * table rebuild. SQLite drops indexes when the parent table is dropped.
 */
async function listSuccessionIndexes(): Promise<
  { name: string; sql: string }[]
> {
  const res = await client.execute(
    "SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='SuccessionDeclaration' AND sql IS NOT NULL ORDER BY name"
  );
  return res.rows.map((r) => ({
    name: String(r.name),
    sql: String(r.sql),
  }));
}

/**
 * Canonical SQLite "rebuild table" approach to drop the legacy NOT NULL
 * `declarantId` column without losing data. Mirrors Prisma's `declarantId →
 * userId` rename so existing rows are preserved (declarantId's value becomes
 * userId on the new table).
 *
 * Inside a single transaction so a failure rolls back cleanly.
 */
async function rebuildSuccessionDeclaration(): Promise<void> {
  const indexes = await listSuccessionIndexes();

  // The new schema matches `prisma/schema.prisma`'s SuccessionDeclaration model.
  const newTableSql = `CREATE TABLE SuccessionDeclaration_new (
    id                     TEXT PRIMARY KEY NOT NULL,
    userId                 TEXT NOT NULL,
    beneficiaryUserId      TEXT,
    beneficiaryName        TEXT,
    beneficiaryNationalId  TEXT,
    conditions              TEXT NOT NULL,
    votingProxyActive      BOOLEAN NOT NULL DEFAULT false,
    votingProxyActivatedAt DATETIME,
    emergencyManagerId     TEXT,
    status                 TEXT NOT NULL DEFAULT 'draft',
    declaredAt             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt              DATETIME NOT NULL,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (beneficiaryUserId) REFERENCES User(id) ON DELETE SET NULL,
    FOREIGN KEY (emergencyManagerId) REFERENCES User(id) ON DELETE SET NULL
  )`;

  // Map legacy declarantId → userId when copying rows. If the source table
  // is missing declarantId entirely (already migrated), fall back to userId.
  const hasDeclarantIdCol = await (async () => {
    const cols = await client.execute("PRAGMA table_info(SuccessionDeclaration)");
    return cols.rows.some((r) => String(r.name) === "declarantId");
  })();

  const columnList = hasDeclarantIdCol
    ? `id, declarantId AS userId, beneficiaryUserId, beneficiaryName, beneficiaryNationalId,
       conditions, votingProxyActive, votingProxyActivatedAt, emergencyManagerId,
       status, declaredAt, updatedAt`
    : `id, userId, beneficiaryUserId, beneficiaryName, beneficiaryNationalId,
       conditions, votingProxyActive, votingProxyActivatedAt, emergencyManagerId,
       status, declaredAt, updatedAt`;

  await client.execute("BEGIN");
  try {
    await client.execute(newTableSql);
    await client.execute(
      `INSERT INTO SuccessionDeclaration_new (${columnList}) SELECT ${columnList} FROM SuccessionDeclaration`
    );
    await client.execute("DROP TABLE SuccessionDeclaration");
    await client.execute(
      "ALTER TABLE SuccessionDeclaration_new RENAME TO SuccessionDeclaration"
    );
    // Recreate indexes (sqlite_autoindex_* primary-key indexes are recreated
    // implicitly; we only need to recreate explicit ones with their original SQL).
    for (const idx of indexes) {
      await client.execute(idx.sql);
    }
    // Foreign-key integrity check — fails the transaction if any are broken.
    const fkCheck = await client.execute("PRAGMA foreign_key_check");
    if (fkCheck.rows.length > 0) {
      throw new Error(
        `foreign_key_check failed: ${JSON.stringify(fkCheck.rows)}`
      );
    }
    await client.execute("COMMIT");
  } catch (e) {
    await client.execute("ROLLBACK");
    throw e;
  }
}

async function main() {
  console.log(`Connecting to Turso: ${url}`);

  // Test connection.
  try {
    await client.execute("SELECT 1 AS ok");
    console.log("Connected.");
  } catch (e) {
    console.error(
      "Connection failed:",
      e instanceof Error ? e.message : String(e)
    );
    console.error(
      "\nThe Turso auth token may be expired or invalid. Generate a new one at:\n" +
        "  https://app.turso.app → your DB → Settings → Tokens"
    );
    process.exit(1);
  }

  const { hasLegacyDeclarantId, createSql } = await inspectSuccessionDeclaration();

  if (createSql === null) {
    console.log(
      "SuccessionDeclaration table does not exist — nothing to fix. Run `bun run db:migrate` first."
    );
    return;
  }

  if (!hasLegacyDeclarantId) {
    console.log(
      "SuccessionDeclaration has no legacy NOT NULL `declarantId` column — schema is already correct. No-op."
    );
    return;
  }

  console.log(
    "Detected legacy `declarantId TEXT NOT NULL` column in SuccessionDeclaration."
  );
  console.log("Original CREATE statement:");
  console.log(createSql);
  console.log("\nRebuilding table (declarantId → userId) inside a transaction…");

  await rebuildSuccessionDeclaration();

  const after = await inspectSuccessionDeclaration();
  console.log(
    "\nDone. Post-fix legacy `declarantId NOT NULL` present? " +
      `${after.hasLegacyDeclarantId}`
  );
  if (after.hasLegacyDeclarantId) {
    console.error("FAILED: legacy column still present after rebuild.");
    process.exit(1);
  }
  console.log("✅ SuccessionDeclaration schema is now Prisma-compatible.");
}

main().catch((e) => {
  console.error("FATAL:", e instanceof Error ? e.message : String(e));
  console.error(e instanceof Error ? e.stack ?? "" : "");
  process.exit(1);
});
