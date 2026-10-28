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
# TURSO_AUTH_TOKEN is only required for remote libsql:// or https:// URLs.
# Local file: URLs (used in sandbox/dev) don't need a token.
case "$DATABASE_URL" in
  file:*)
    TURSO_AUTH_TOKEN="${TURSO_AUTH_TOKEN:-}"
    # Prisma's runtime may use a different file than DATABASE_URL (see
    # prisma.config.ts → datasource.url). Resolve the actual on-disk file:
    # prefer the path in DATABASE_URL, fall back to the prisma.config.ts file.
    DB_FILE_FROM_ENV="${DATABASE_URL#file:}"
    if [ -f "$DB_FILE_FROM_ENV" ]; then
      DB_FILE="$DB_FILE_FROM_ENV"
    elif [ -f "prisma/.provider-placeholder.db" ]; then
      DB_FILE="prisma/.provider-placeholder.db"
    else
      echo "[$(date -u +%FT%TZ)] FATAL: local SQLite file not found at $DB_FILE_FROM_ENV or prisma/.provider-placeholder.db" >&2
      exit 1
    fi
    echo "[$(date -u +%FT%TZ)] Local SQLite detected: $DB_FILE"
    ;;
  *)
    : "${TURSO_AUTH_TOKEN:?TURSO_AUTH_TOKEN is required for remote Turso databases}"
    DB_FILE=""
    ;;
esac

BACKUP_DIR=".backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
OUT_FILE="$BACKUP_DIR/aurienta-${TIMESTAMP}.sql"
GZ_FILE="$OUT_FILE.gz"

echo "[$(date -u +%FT%TZ)] Starting Turso backup → $GZ_FILE"

# Write the backup script to a temp .mjs file in the project root (so
# node can resolve @libsql/client from node_modules) and run it.
# For local file: URLs we use bun:sqlite (built-in, no native compile, and
# libsql's file: open can fail on paths that Prisma created). For remote
# Turso URLs we use @libsql/client over HTTP.
SCRIPT_FILE=$(mktemp /home/z/my-project/.turso-backup-XXXXXX.mjs)
cat > "$SCRIPT_FILE" << 'BACKUP_SCRIPT'
import { writeFileSync } from "fs";

const url = process.env.DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;
const dbFile = process.env.DB_FILE || "";  // empty = remote Turso
const outFile = process.argv[2];

function sqlEscape(val) {
  if (val === null) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "bigint") return String(val);
  if (val instanceof Uint8Array) return `X'${Buffer.from(val).toString("hex")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

// ── Choose DB driver ──
// bun:sqlite for local files; @libsql/client for remote Turso.
let client, db;  // one or the other
let driverLabel;
if (dbFile) {
  const { Database } = await import("bun:sqlite");
  db = new Database(dbFile, { readonly: true });
  driverLabel = `bun:sqlite:${dbFile}`;
} else {
  const { createClient } = await import("@libsql/client");
  client = token
    ? createClient({ url, authToken: token })
    : createClient({ url });
  driverLabel = `libsql:${url}`;
}

async function rawQuery(sql, opts = {}) {
  if (db) {
    // bun:sqlite
    return {
      rows: db.prepare(sql).all(),
      columns: Object.keys(db.prepare(sql).get() ?? {}),
    };
  } else {
    const r = await client.execute({ sql, ...opts });
    return { rows: r.rows, columns: r.columns };
  }
}

let sqlHeader = `-- AURIENTA DB backup\n-- Driver: ${driverLabel}\n-- URL: ${url}\n-- Generated: ${new Date().toISOString()}\n-- Format: SQLite SQL (schema + data)\n\nPRAGMA foreign_keys=OFF;\nBEGIN TRANSACTION;\n\n`;

// ── SCHEMA ──
const tablesRes = await rawQuery(
  "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name"
);
const tables = tablesRes.rows;
let sql = sqlHeader + `-- SCHEMA (${tables.length} tables)\n\n`;
for (const t of tables) {
  const tableName = String(t.name);
  sql += `DROP TABLE IF EXISTS "${tableName}";\n${String(t.sql)};\n\n`;
}

// ── DATA ──
sql += `\n-- DATA\n\n`;
let totalRows = 0;
for (const t of tables) {
  const tableName = String(t.name);
  const rowsRes = await rawQuery(`SELECT * FROM "${tableName}"`);
  const rows = rowsRes.rows;
  const cols = rowsRes.columns;
  if (rows.length === 0) { sql += `-- ${tableName}: 0 rows\n\n`; continue; }
  sql += `-- ${tableName}: ${rows.length} rows\n`;
  for (const row of rows) {
    const values = cols.map(c => sqlEscape(row[c]));
    sql += `INSERT INTO "${tableName}" ("${cols.join('","')}") VALUES (${values.join(",")});\n`;
    totalRows++;
  }
  sql += `\n`;
}

// ── INDEXES ──
const indexesRes = await rawQuery(
  "SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY name"
);
sql += `\n-- INDEXES (${indexesRes.rows.length})\n\n`;
for (const idx of indexesRes.rows) { sql += `${String(idx.sql)};\n`; }

sql += `\nCOMMIT;\n`;
writeFileSync(outFile, sql);
console.log(`Driver: ${driverLabel}`);
console.log(`Tables: ${tables.length}, Rows: ${totalRows}, Indexes: ${indexesRes.rows.length}, Size: ${Buffer.byteLength(sql)} bytes`);
if (db) db.close();
BACKUP_SCRIPT

# Pass DB_FILE (if set) into the script's env
export DB_FILE

# Run with bun (supports both bun:sqlite built-in AND @libsql/client)
bun "$SCRIPT_FILE" "$OUT_FILE" 2>&1 || {
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
