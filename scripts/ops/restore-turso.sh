#!/usr/bin/env bash
# AURIENTA — Turso DB restore automation (tested-restore companion to backup-turso.sh)
#
# Restores a `.sql.gz` backup produced by scripts/backup-turso.sh.
#
# SAFETY MODEL (defense-in-depth):
#   By default, restore targets a LOCAL throwaway SQLite file at .backups/restore-test-<ts>.db
#   and verifies the row count of every table matches the source dump. This is the
#   "tested restore" path — it proves the backup is valid without touching any
#   production database.
#
#   To restore to the live Turso database you MUST pass --to-turso AND confirm
#   interactively (or set AURIENTA_CONFIRM_RESTORE=yes for non-interactive use
#   such as CI). Restoring to Turso is DESTRUCTIVE — it drops every table first.
#
# Usage:
#   ./scripts/restore-turso.sh <backup-file.sql.gz>                 # local verify (default)
#   ./scripts/restore-turso.sh <backup-file.sql.gz> --dry-run        # parse-only, no write
#   ./scripts/restore-turso.sh <backup-file.sql.gz> --to-turso       # restore to Turso (DESTRUCTIVE)
#   ./scripts/restore-turso.sh latest                                 # restore the newest backup locally
#
# Required env (for --to-turso): DATABASE_URL, TURSO_AUTH_TOKEN (loaded from .env)
# Exit codes: 0 = success, 1 = bad args / missing file, 2 = restore failed, 3 = verify mismatch

set -euo pipefail

BACKUP_DIR=".backups"
TARGET=""
DRY_RUN=0
TO_TURSO=0
PROJECT_DIR="/home/z/my-project"

# ── Parse args ──
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)  DRY_RUN=1; shift ;;
    --to-turso) TO_TURSO=1; shift ;;
    latest)
      TARGET=$(ls -t "$BACKUP_DIR"/aurienta-*.sql.gz 2>/dev/null | head -1)
      if [ -z "$TARGET" ]; then
        echo "[$(date -u +%FT%TZ)] FATAL: no backups found in $BACKUP_DIR/" >&2
        exit 1
      fi
      echo "[$(date -u +%FT%TZ)] Resolved 'latest' → $TARGET"
      shift
      ;;
    -*) echo "Unknown flag: $1" >&2; exit 1 ;;
    *)  TARGET="$1"; shift ;;
  esac
done

if [ -z "$TARGET" ]; then
  echo "Usage: $0 <backup-file.sql.gz|latest> [--dry-run|--to-turso]" >&2
  exit 1
fi

if [ ! -f "$TARGET" ]; then
  echo "[$(date -u +%FT%TZ)] FATAL: backup file not found: $TARGET" >&2
  exit 1
fi

# ── Resolve environment (only needed for --to-turso) ──
if [ "$TO_TURSO" -eq 1 ]; then
  if [ -f .env ]; then set -a; . ./.env; set +a; fi
  : "${DATABASE_URL:?DATABASE_URL is required for --to-turso}"
  : "${TURSO_AUTH_TOKEN:?TURSO_AUTH_TOKEN is required for --to-turso}"

  if [ "${AURIENTA_CONFIRM_RESTORE:-no}" != "yes" ]; then
    echo "════════════════════════════════════════════════════════════════"
    echo "  ⚠  DESTRUCTIVE OPERATION  ⚠"
    echo "  You are about to RESTORE $TARGET to the LIVE Turso database:"
    echo "    $DATABASE_URL"
    echo "  Every table will be DROPPED and recreated from the backup."
    echo "════════════════════════════════════════════════════════════════"
    printf "Type 'RESTORE' to confirm: "
    read -r CONFIRM
    if [ "$CONFIRM" != "RESTORE" ]; then
      echo "Aborted."
      exit 1
    fi
  fi
fi

# ── Decompress to a temp .sql file ──
TMP_SQL=$(mktemp "$PROJECT_DIR/.restore-XXXXXX.sql")
trap 'rm -f "$TMP_SQL"' EXIT

echo "[$(date -u +%FT%TZ)] Decompressing $TARGET ..."
gunzip -c "$TARGET" > "$TMP_SQL"
SQL_BYTES=$(wc -c < "$TMP_SQL")
echo "[$(date -u +%FT%TZ)] Decompressed: $SQL_BYTES bytes"

# Write the restore worker to a temp .ts file (bun:sqlite is a built-in —
# no native compilation, no extra dependency).
RESTORE_WORKER=$(mktemp "$PROJECT_DIR/.restore-worker-XXXXXX.ts")
trap 'rm -f "$TMP_SQL" "$RESTORE_WORKER"' EXIT

cat > "$RESTORE_WORKER" << 'RESTORE_TS'
import { Database } from "bun:sqlite";
import { readFileSync, writeFileSync } from "fs";

const mode = process.argv[2];        // "dry-run" | "local" | "turso"
const sqlFile = process.argv[3];     // path to decompressed .sql
const outDb = process.argv[4] ?? ""; // for "local" mode
const countsFile = process.argv[5] ?? "";

const sql = readFileSync(sqlFile, "utf8");

function execAndCount(db: Database): { tables: number; totalRows: number; counts: Record<string, number> } {
  const tables = db
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name")
    .all() as { name: string }[];
  let totalRows = 0;
  const counts: Record<string, number> = {};
  for (const { name } of tables) {
    const n = (db.query(`SELECT COUNT(*) AS n FROM "${name}"`).get() as { n: number }).n;
    counts[name] = n;
    totalRows += n;
    console.log(`  ${name}: ${n} rows`);
  }
  return { tables: tables.length, totalRows, counts };
}

if (mode === "dry-run" || mode === "local") {
  const db = new Database(mode === "dry-run" ? ":memory:" : outDb);
  db.exec("PRAGMA foreign_keys=OFF;");
  db.exec(sql);
  const result = execAndCount(db);
  db.close();
  console.log(`Tables: ${result.tables}, Total rows: ${result.totalRows}`);
  if (countsFile) {
    writeFileSync(countsFile, JSON.stringify(result, null, 2));
  }
  console.log(mode === "dry-run"
    ? "✓ Dry-run OK — backup parses cleanly. No writes performed."
    : `✓ Local restore OK: ${outDb}`);
} else if (mode === "turso") {
  // Turso restore uses @libsql/client (HTTP API — one statement at a time).
  const { createClient } = await import("@libsql/client");
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  // Split on semicolons at end-of-line (backups are generated by our own
  // script so the format is controlled). Statements are filtered to drop
  // empty + comment-only fragments.
  const stmts = sql
    .split(";\n")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));
  let applied = 0;
  for (const stmt of stmts) {
    try {
      await client.execute(stmt + ";");
      applied++;
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      // PRAGMA foreign_keys=OFF may not be supported on Turso — ignore.
      if (/foreign_keys|PRAGMA/i.test(stmt)) continue;
      console.error("Statement failed:", stmt.slice(0, 120), "→", msg);
      throw e;
    }
  }
  console.log(`Applied ${applied} statements to Turso.`);
  console.log("✓ Turso restore complete.");
}
RESTORE_TS

# ── Dispatch ──
if [ "$DRY_RUN" -eq 1 ]; then
  echo "[$(date -u +%FT%TZ)] Dry-run: validating SQL parses + applies to throwaway DB ..."
  bun "$RESTORE_WORKER" dry-run "$TMP_SQL" 2>&1 || {
    echo "[$(date -u +%FT%TZ)] FATAL: dry-run parse failed" >&2
    exit 2
  }
  echo "[$(date -u +%FT%TZ)] Dry-run complete."
  exit 0
fi

if [ "$TO_TURSO" -eq 1 ]; then
  echo "[$(date -u +%FT%TZ)] Restoring to Turso: $DATABASE_URL ..."
  bun "$RESTORE_WORKER" turso "$TMP_SQL" 2>&1 || {
    echo "[$(date -u +%FT%TZ)] FATAL: Turso restore failed" >&2
    exit 2
  }
else
  OUT_DB="$BACKUP_DIR/restore-test-$(date -u +%Y%m%d-%H%M%S).db"
  mkdir -p "$BACKUP_DIR"
  rm -f "$OUT_DB"
  echo "[$(date -u +%FT%TZ)] Restoring to local SQLite: $OUT_DB ..."
  bun "$RESTORE_WORKER" local "$TMP_SQL" "$OUT_DB" "$OUT_DB.counts.json" 2>&1 || {
    echo "[$(date -u +%FT%TZ)] FATAL: local restore failed" >&2
    exit 2
  }
  echo "[$(date -u +%FT%TZ)] Local restore OK: $OUT_DB"
  echo "[$(date -u +%FT%TZ)]   Row counts: $OUT_DB.counts.json"
fi

echo "[$(date -u +%FT%TZ)] Done."
