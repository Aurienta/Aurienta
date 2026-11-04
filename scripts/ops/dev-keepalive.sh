#!/usr/bin/env bash
# AURIENTA — Persistent dev server keep-alive loop.
# The sandbox OOM-kills the Next.js dev server during on-demand compilation.
# This loop auto-restarts it within 3 seconds of death.
#
# Usage: nohup bash scripts/ops/dev-keepalive.sh </dev/null > /tmp/keepalive.log 2>&1 & disown

PROJECT_DIR="/home/z/my-project"
MAX_RESTARTS=10000
RESTART_DELAY=2
restarts=0

cd "$PROJECT_DIR"

# Kill any existing dev servers
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "bun run dev" 2>/dev/null
sleep 2

echo "[$(date -Iseconds)] AURIENTA dev-keepalive started"

while [ $restarts -lt $MAX_RESTARTS ]; do
  echo "[$(date -Iseconds)] === attempt $((restarts + 1))/$MAX_RESTARTS ==="
  
  # Restore env from .env (sandbox can strip it)
  unset DATABASE_URL TURSO_AUTH_TOKEN FIELD_ENCRYPTION_KEY SESSION_SECRET CRON_SECRET FRA_ACCESS_TOKEN ALLOW_DEMO_SIGNIN FRED_KEY
  set -a; . "$PROJECT_DIR/.env"; set +a
  export NODE_OPTIONS="--max-old-space-size=2048"
  
  # Verify db exists; if not, run sandbox-recovery first
  if [ ! -f "$PROJECT_DIR/db/custom.db" ]; then
    echo "[$(date -Iseconds)] db missing — running sandbox-recovery..."
    bash "$PROJECT_DIR/scripts/ops/sandbox-recovery.sh" 2>&1 | tail -10
  fi
  
  echo "[$(date -Iseconds)] DATABASE_URL=$DATABASE_URL"
  echo "[$(date -Iseconds)] starting bun run dev..."
  
  # Start in foreground; this blocks until the server dies
  bun run dev >> "$PROJECT_DIR/dev.log" 2>&1
  EXIT_CODE=$?
  
  echo "[$(date -Iseconds)] dev server exited (code $EXIT_CODE). Restarting in ${RESTART_DELAY}s..."
  sleep $RESTART_DELAY
  restarts=$((restarts + 1))
done

echo "[$(date -Iseconds)] Max restarts ($MAX_RESTARTS) reached. Stopping."
