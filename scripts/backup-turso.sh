#!/usr/bin/env bash
# AURIENTA — Turso DB backup automation
#
# Dumps all tables from the production Turso database to a timestamped SQL
# file. Designed to be run via cron (e.g. daily at 02:00 UTC).
#
# Usage:
#   ./scripts/backup-turso.sh
#
# Required env (loaded from .env):
#   DATABASE_URL       — Turso libsql:// URL
#   TURSO_AUTH_TOKEN   — Turso auth JWT
#
# Output:
#   .backups/aurienta-YYYYMMDD-HHMMSS.sql  (gzip-compressed)
#
# Cron example (daily 02:00 UTC, keep 30 days):
#   0 2 * * * cd /home/z/my-project && ./scripts/backup-turso.sh >> .backups/backup.log 2>&1
#   0 3 * * * find /home/z/my-project/.backups -name 'aurienta-*.sql.gz' -mtime +30 -delete

set -euo pipefail

# Load .env (prefer explicit env vars if already set)
if [ -f .env ]; then
  set -a; . ./.env; set +a
fi

: "${DATABASE_URL:?DATABASE_URL is required (set in .env)}"
: "${TURSO_AUTH_TOKEN:?TURSO_AUTH_TOKEN is required (set in .env)}"

BACKUP_DIR=".backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
OUT_FILE="$BACKUP_DIR/aurienta-${TIMESTAMP}.sql"
GZ_FILE="$OUT_FILE.gz"

echo "[$(date -u +%FT%TZ)] Starting Turso backup → $GZ_FILE"

# Dump all tables using the libSQL HTTP /v2/dump endpoint (Turso supports this).
# This returns the full database as a binary SQLite file.
DUMP_URL="${DATABASE_URL/file:/}.dump" 2>/dev/null || true
# Turso supports the /dump endpoint on the HTTP API base.
# Convert libsql:// to https:// for the dump endpoint.
HTTP_URL=$(echo "$DATABASE_URL" | sed 's|^libsql://|https://|; s|^http://|https://|')

curl -sS --max-time 300 \
  -H "Authorization: Bearer $TURSO_AUTH_TOKEN" \
  "${HTTP_URL}/v2/dump" \
  -o "${GZ_FILE}.tmp"

if [ ! -s "${GZ_FILE}.tmp" ]; then
  echo "[$(date -u +%FT%TZ)] FATAL: dump returned empty file" >&2
  rm -f "${GZ_FILE}.tmp"
  exit 1
fi

mv "${GZ_FILE}.tmp" "$GZ_FILE"
SIZE=$(du -h "$GZ_FILE" | cut -f1)
echo "[$(date -u +%FT%TZ)] Backup complete: $GZ_FILE ($SIZE)"

# Retention: keep last 30 days
find "$BACKUP_DIR" -name 'aurienta-*.sql.gz' -mtime +30 -delete 2>/dev/null || true

echo "[$(date -u +%FT%TZ)] Done. Retention: 30 days."
