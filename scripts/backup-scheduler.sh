#!/usr/bin/env bash
# AURIENTA — Background backup scheduler.
# Runs the backup script every 24 hours in a loop.
# Starts on boot via setsid; kills any existing instance first.
#
# Usage:
#   bash scripts/backup-scheduler.sh &

PROJECT_DIR="/home/z/my-project"
INTERVAL_SECONDS=86400  # 24 hours

# Kill any existing backup scheduler
pkill -f "backup-scheduler.sh" 2>/dev/null || true
sleep 1

echo "[$(date -Iseconds)] Backup scheduler started — running every ${INTERVAL_SECONDS}s"

while true; do
  bash "$PROJECT_DIR/scripts/backup.sh" >> "$PROJECT_DIR/backups/backup.log" 2>&1
  sleep "$INTERVAL_SECONDS"
done
