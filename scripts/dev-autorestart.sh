#!/usr/bin/env bash
# AURIENTA — Dev server auto-restart wrapper.
# The sandbox OOM-kills the Next.js dev server during on-demand compilation.
# This wrapper detects the death and restarts immediately, so the preview
# is always available (the .next cache makes subsequent compiles faster).

PROJECT_DIR="/home/z/my-project"
MAX_RESTARTS=100
RESTART_DELAY=3
restarts=0

cd "$PROJECT_DIR"

# Kill any existing dev server
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2

echo "[$(date -Iseconds)] Auto-restart wrapper started"

while [ $restarts -lt $MAX_RESTARTS ]; do
  echo "[$(date -Iseconds)] Starting dev server (attempt $((restarts + 1))/$MAX_RESTARTS)..."

  # Run env-guardian to ensure .env is correct + DB has users before starting.
  bash "$PROJECT_DIR/scripts/env-guardian.sh" 2>&1 || true

  # Start dev server in foreground (wrapper blocks until it dies).
  # `bun run dev` now includes DATABASE_URL explicitly in the script.
  bun run dev >> dev.log 2>&1
  EXIT_CODE=$?

  echo "[$(date -Iseconds)] Dev server exited (code $EXIT_CODE). Restarting in ${RESTART_DELAY}s..."
  sleep $RESTART_DELAY
  restarts=$((restarts + 1))
done

echo "[$(date -Iseconds)] Max restarts ($MAX_RESTARTS) reached. Stopping."
