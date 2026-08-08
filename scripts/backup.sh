#!/usr/bin/env bash
# AURIENTA — Automated backup script with retention policy.
# Creates a timestamped backup of the database + schema + seed + critical lib files.
# Keeps only the last 5 backups; older ones are auto-deleted.
#
# Usage:
#   bash scripts/backup.sh           # create backup + prune old
#   bash scripts/backup.sh --prune   # prune only (no new backup)
#
# Recommended cron (daily at 02:00):
#   0 2 * * * cd /home/z/my-project && bash scripts/backup.sh >> backups/backup.log 2>&1

set -euo pipefail

PROJECT_DIR="/home/z/my-project"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
MAX_BACKUPS=5

mkdir -p "$BACKUP_DIR"

# ── Prune old backups (keep last MAX_BACKUPS) ──
prune_old_backups() {
  echo "[$(date -Iseconds)] Pruning backups (keeping last $MAX_BACKUPS)..."
  cd "$BACKUP_DIR"
  # List timestamped backup files (exclude backup.log), sorted oldest first
  mapfile -t old_backups < <(ls -1t aurienta-backup-*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)))
  if [ ${#old_backups[@]} -eq 0 ]; then
    echo "[$(date -Iseconds)] No old backups to prune."
  else
    for old in "${old_backups[@]}"; do
      echo "[$(date -Iseconds)] Deleting: $old"
      rm -f "$old"
    done
  fi
}

# ── Prune-only mode ──
if [ "${1:-}" = "--prune" ]; then
  prune_old_backups
  echo "[$(date -Iseconds)] Prune-only complete."
  exit 0
fi

# ── Create new backup ──
BACKUP_FILE="$BACKUP_DIR/aurienta-backup-$TIMESTAMP.tar.gz"
echo "[$(date -Iseconds)] Creating backup: $BACKUP_FILE"

cd "$PROJECT_DIR"

# Create a tarball with:
# - The SQLite database (primary data)
# - The Prisma schema (structure)
# - The seed script (reproducibility)
# - The critical lib files (business logic)
# - package.json + bun.lock (dependency lock)
tar -czf "$BACKUP_FILE" \
  db/custom.db \
  prisma/schema.prisma \
  prisma/seed.ts \
  src/lib/aurienta/ \
  src/lib/db.ts \
  src/middleware.ts \
  package.json \
  bun.lock \
  2>/dev/null || {
    echo "[$(date -Iseconds)] ERROR: tar failed"
    exit 1
  }

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date -Iseconds)] Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# ── Prune old backups ──
prune_old_backups

# ── Summary ──
echo "[$(date -Iseconds)] Backup complete. Current backups:"
ls -lh "$BACKUP_DIR"/aurienta-backup-*.tar.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo "[$(date -Iseconds)] Done."
