#!/usr/bin/env bash
# AURIENTA — Turso DB backup automation
#
# Dumps all tables (schema + data) from the production Turso database to a
# timestamped SQL file. Uses the libSQL client to query table-by-table.
#
# Usage: ./scripts/backup-turso.sh
# Required env (loaded from .env): DATABASE_URL, TURSO_AUTH_TOKEN
# Output: .backups/aurienta-YYYYMMDD-HHMMSS.sql.gz

set -euo pipefail

if [ -f .env ]; then set -a; . ./.env; set +a; fi

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${TURSO_AUTH_TOKEN:?TURSO_AUTH_TOKEN is required}"

BACKUP_DIR=".backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
OUT_FILE="$BACKUP_DIR/aurienta-${TIMESTAMP}.sql"
GZ_FILE="$OUT_FILE.gz"

echo "[$(date -u +%FT%TZ)] Starting Turso backup → $GZ_FILE"

# Write the backup script to a temp .mjs file in the project root (so
# node can resolve @libsql/client from node_modules) and run it.
SCRIPT_FILE=$(mktemp /home/z/my-project/.turso-backup-XXXXXX.mjs)
cat > "$SCRIPT_FILE" << 'BACKUP_SCRIPT'
import { createClient } from "@libsql/client";
import { writeFileSync } from "fs";

const url = process.env.DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;
const outFile = process.argv[2];

const client = createClient({ url, authToken: token });

function sqlEscape(val) {
  if (val === null) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "bigint") return String(val);
  if (val instanceof Uint8Array) return `X'${Buffer.from(val).toString("hex")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

let sql = `-- AURIENTA Turso DB backup\n-- URL: ${url}\n-- Generated: ${new Date().toISOString()}\n-- Format: SQLite SQL (schema + data)\n\nPRAGMA foreign_keys=OFF;\nBEGIN TRANSACTION;\n\n`;

const tables = await client.execute(
  "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name"
);

sql += `-- SCHEMA (${tables.rows.length} tables)\n\n`;
for (const t of tables.rows) {
  const tableName = String(t.name);
  sql += `DROP TABLE IF EXISTS "${tableName}";\n${String(t.sql)};\n\n`;
}

sql += `\n-- DATA\n\n`;
let totalRows = 0;
for (const t of tables.rows) {
  const tableName = String(t.name);
  const rows = await client.execute(`SELECT * FROM "${tableName}"`);
  if (rows.rows.length === 0) { sql += `-- ${tableName}: 0 rows\n\n`; continue; }
  const cols = rows.columns;
  sql += `-- ${tableName}: ${rows.rows.length} rows\n`;
  for (const row of rows.rows) {
    const values = cols.map(c => sqlEscape(row[c]));
    sql += `INSERT INTO "${tableName}" ("${cols.join('","')}") VALUES (${values.join(",")});\n`;
    totalRows++;
  }
  sql += `\n`;
}

const indexes = await client.execute(
  "SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY name"
);
sql += `\n-- INDEXES (${indexes.rows.length})\n\n`;
for (const idx of indexes.rows) { sql += `${String(idx.sql)};\n`; }

sql += `\nCOMMIT;\n`;
writeFileSync(outFile, sql);
console.log(`Tables: ${tables.rows.length}, Rows: ${totalRows}, Indexes: ${indexes.rows.length}, Size: ${Buffer.byteLength(sql)} bytes`);
BACKUP_SCRIPT

# Run from project root so @libsql/client resolves
node "$SCRIPT_FILE" "$OUT_FILE" 2>&1 || {
  echo "[$(date -u +%FT%TZ)] FATAL: backup failed" >&2
  rm -f "$SCRIPT_FILE"
  exit 1
}
rm -f "$SCRIPT_FILE"

if [ ! -s "$OUT_FILE" ]; then
  echo "[$(date -u +%FT%TZ)] FATAL: backup file is empty" >&2
  exit 1
fi

gzip -f "$OUT_FILE"
SIZE=$(du -h "$GZ_FILE" | cut -f1)
echo "[$(date -u +%FT%TZ)] Backup complete: $GZ_FILE ($SIZE)"
find "$BACKUP_DIR" -name 'aurienta-*.sql.gz' -mtime +30 -delete 2>/dev/null || true
echo "[$(date -u +%FT%TZ)] Done. Retention: 30 days."
