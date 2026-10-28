#!/usr/bin/env bash
# AURIENTA — Background backup scheduler.
# Runs the backup script every 24 hours in a loop.
# Starts on boot via setsid; kills any existing instance first (except itself).
#
# Usage:
#   nohup bash scripts/backup-scheduler.sh >/dev/null 2>&1 &

PROJECT_DIR="/home/z/my-project"
INTERVAL_SECONDS=86400  # 24 hours

# Kill any existing backup scheduler EXCEPT this process.
# (A naive `pkill -f backup-scheduler.sh` would match this very script
# and suicide before entering the loop.)
SELF_PID=$$
for pid in $(pgrep -f "backup-scheduler.sh" 2>/dev/null); do
  if [ "$pid" != "$SELF_PID" ]; then
    kill "$pid" 2>/dev/null || true
  fi
done
sleep 1

echo "[$(date -Iseconds)] Backup scheduler started (pid=$SELF_PID) — running every ${INTERVAL_SECONDS}s"

# Run an initial backup immediately, then every 24h.
while true; do
  bash "$PROJECT_DIR/scripts/backup.sh" >> "$PROJECT_DIR/backups/backup.log" 2>&1 || true
  sleep "$INTERVAL_SECONDS"
done
