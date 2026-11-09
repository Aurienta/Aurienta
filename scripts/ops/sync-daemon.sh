#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# sync-daemon.sh — Periodic 2-way sync between local SQLite ↔ Turso
# ═══════════════════════════════════════════════════════════════════
# Runs scripts/sync-2way.ts every 5 minutes. If local DB is missing
# (sandbox wipe), the sync script will fail gracefully and retry next
# cycle — env-guardian + dev-keepalive will have recreated it by then.
#
# Logs to /tmp/sync-daemon.log. Started by: setsid bash scripts/ops/sync-daemon.sh &
# ═══════════════════════════════════════════════════════════════════
set -u
cd /home/z/my-project
LOG=/tmp/sync-daemon.log
INTERVAL=300  # 5 minutes

echo "[sync-daemon] started at $(date -Iseconds), interval=${INTERVAL}s" >> "$LOG"

while true; do
  if [ -f /home/z/my-project/db/custom.db ]; then
    echo "[sync-daemon] running sync at $(date -Iseconds)" >> "$LOG"
    if bun run scripts/sync-2way.ts >> "$LOG" 2>&1; then
      echo "[sync-daemon] sync OK at $(date -Iseconds)" >> "$LOG"
    else
      echo "[sync-daemon] sync FAILED at $(date -Iseconds) — will retry next cycle" >> "$LOG"
    fi
  else
    echo "[sync-daemon] local DB missing at $(date -Iseconds) — skipping (guardian will recreate)" >> "$LOG"
  fi
  sleep "$INTERVAL"
done
