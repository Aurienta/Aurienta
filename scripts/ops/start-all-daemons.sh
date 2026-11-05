#!/usr/bin/env bash
# AURIENTA — Master startup script.
# Launches all root-cause-fix daemons:
#   1. env-guardian.py — watches .env and restores it if stripped
#   2. dev-keepalive.py — keeps dev server alive (auto-restarts on OOM)
#
# This script is idempotent — safe to run multiple times.
# It kills existing daemons before starting fresh ones.
#
# Usage: bash scripts/ops/start-all-daemons.sh

PROJECT_DIR="/home/z/my-project"

echo "[$(date -Iseconds)] AURIENTA — Starting all root-cause-fix daemons..."

# ─── 1. Kill any existing daemons ───
echo "[$(date -Iseconds)] Killing existing daemons..."
pkill -9 -f "env-guardian" 2>/dev/null
pkill -9 -f "dev-keepalive" 2>/dev/null
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "bun.*dev" 2>/dev/null
sleep 3

# ─── 2. Restore .env immediately (in case it's already stripped) ───
if [ ! -f "$PROJECT_DIR/.env" ] || [ $(wc -l < "$PROJECT_DIR/.env") -lt 5 ]; then
  echo "[$(date -Iseconds)] .env missing/stripped — restoring canonical version..."
  cat > "$PROJECT_DIR/.env" << 'ENVEOF'
DATABASE_URL=libsql://aurienta-fortleem.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODYzMjM5MjUsImlkIjoiMDE5ZmU5MzItZTIwMS03MzYwLWFkZTUtMTI2NThkNzZlMjkyIiwia2lkIjoiMlNGbjFBZlVSdTVMUXlrTGRzR3djNXdWV1V2VGVxV2FWODZRdlhST0MxYyIsInJpZCI6ImVjMzdiMjcyLTA5ZjItNDhlNy1iMWYxLTBkZWUxNjEzNjdkMSJ9.SWdaohrj5xtvI-NbLYYGaxvGEjCUbDOt15O2fxoa3V7I_WNoRGfTp1YkIFLmDWa0_sgdflC_Qy0-CQQPy9nODw
SESSION_SECRET=aurienta-session-secret-2026-production-turso
CRON_SECRET=aurienta-cron-secret-2026
FRA_ACCESS_TOKEN=test-fra-token
FIELD_ENCRYPTION_KEY=Qm9FUVlJUnN5UWlobXN4ZE9TQnpNSllVRklZdnFzY2M=
FRED_KEY=369eee7bb9170bcb9d5c7244912f2e08
ALLOW_DEMO_SIGNIN=true
NODE_OPTIONS=--max-old-space-size=2048
ENVEOF
  chmod 755 "$PROJECT_DIR/.env"
  echo "[$(date -Iseconds)] ✅ .env restored"
else
  echo "[$(date -Iseconds)] ✅ .env intact"
fi

# ─── 3. Start env-guardian daemon ───
echo "[$(date -Iseconds)] Starting env-guardian daemon..."
setsid python3 "$PROJECT_DIR/scripts/ops/env-guardian.py" </dev/null >/tmp/env-guardian.log 2>&1 &
disown
echo "[$(date -Iseconds)] ✅ env-guardian started (watches .env every 5s)"

# ─── 4. Start dev-keepalive daemon ───
echo "[$(date -Iseconds)] Starting dev-keepalive daemon..."
setsid python3 "$PROJECT_DIR/scripts/ops/dev-keepalive.py" </dev/null >/tmp/keepalive.log 2>&1 &
disown
echo "[$(date -Iseconds)] ✅ dev-keepalive started (auto-restarts dev server on OOM)"

# ─── 5. Wait for dev server to come up ───
echo "[$(date -Iseconds)] Waiting for dev server..."
for i in $(seq 1 40); do
  sleep 1
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/api/health 2>/dev/null || echo "000")
  if [ "$CODE" = "200" ]; then
    echo "[$(date -Iseconds)] ✅ Dev server ready (HTTP 200 after ${i}s)"
    echo ""
    echo "=== Running daemons ==="
    ps -ef | grep -E "env-guardian|dev-keepalive|next-server" | grep -v grep
    echo ""
    echo "=== Health check ==="
    curl -s http://localhost:3000/api/health | head -c 200
    echo ""
    exit 0
  fi
done

echo "[$(date -Iseconds)] ⚠️  Dev server didn't become healthy within 40s"
echo "=== Keepalive log ==="
tail -10 /tmp/keepalive.log
exit 1
