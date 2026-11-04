#!/usr/bin/env bash
# AURIENTA — Sandbox recovery script.
# The sandbox periodically wipes db/ and strips .env to just DATABASE_URL.
# This script restores both before starting the dev server.
#
# Usage: bash scripts/ops/sandbox-recovery.sh

set -e
PROJECT_DIR="/home/z/my-project"
cd "$PROJECT_DIR"

echo "[$(date -Iseconds)] AURIENTA sandbox recovery starting..."

# ─── 1. Restore .env if stripped ───
ENV_LINES=$(wc -l < .env 2>/dev/null || echo 0)
if [ "$ENV_LINES" -lt 5 ]; then
  echo "[$(date -Iseconds)] .env has only $ENV_LINES lines — restoring full config..."
  cat > .env << 'ENVEOF'
DATABASE_URL=file:/home/z/my-project/db/custom.db
SESSION_SECRET=aurienta-session-secret-2026-production-turso
CRON_SECRET=aurienta-cron-secret-2026
FRA_ACCESS_TOKEN=test-fra-token
FIELD_ENCRYPTION_KEY=Qm9FUVlJUnN5UWlobXN4ZE9TQnpNSllVRklZdnFzY2M=
FRED_KEY=369eee7bb9170bcb9d5c7244912f2e08
ALLOW_DEMO_SIGNIN=true
NODE_OPTIONS=--max-old-space-size=2048
ENVEOF
  echo "[$(date -Iseconds)] ✅ .env restored (9 lines)"
else
  echo "[$(date -Iseconds)] ✅ .env intact ($ENV_LINES lines)"
fi

# ─── 2. Restore db/ if missing ───
if [ ! -f db/custom.db ]; then
  echo "[$(date -Iseconds)] db/custom.db missing — recreating schema + syncing from Turso..."
  mkdir -p db
  
  # Create all 99 tables via Prisma
  bunx prisma db push --accept-data-loss 2>&1 | tail -5
  
  # Sync all data from Turso cloud
  echo "[$(date -Iseconds)] Syncing data from Turso..."
  bun run scripts/ops/sync-turso-to-local.ts 2>&1 | tail -15
  
  echo "[$(date -Iseconds)] ✅ Database restored"
else
  # Verify db is readable
  TABLE_COUNT=$(bun -e "
    import { createClient } from '@libsql/client';
    const c = createClient({ url: 'file:' + process.cwd() + '/db/custom.db' });
    try {
      const r = await c.execute(\"SELECT COUNT(*) as c FROM sqlite_master WHERE type='table'\");
      console.log(r.rows[0].c);
    } catch(e) { console.log('0'); }
  " 2>/dev/null || echo "0")
  
  if [ "$TABLE_COUNT" -lt 90 ]; then
    echo "[$(date -Iseconds)] db has only $TABLE_COUNT tables (expected 99) — re-syncing..."
    bunx prisma db push --accept-data-loss 2>&1 | tail -3
    bun run scripts/ops/sync-turso-to-local.ts 2>&1 | tail -10
    echo "[$(date -Iseconds)] ✅ Database re-synced"
  else
    echo "[$(date -Iseconds)] ✅ Database intact ($TABLE_COUNT tables)"
  fi
fi

# ─── 3. Start dev server ───
echo "[$(date -Iseconds)] Starting dev server..."
pkill -9 -f "next" 2>/dev/null || true
pkill -9 -f "bun.*dev" 2>/dev/null || true
sleep 2

export $(grep -v '^#' .env | xargs)
nohup bun run dev </dev/null > dev.log 2>&1 &
disown

# Wait for health
for i in $(seq 1 30); do
  sleep 1
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/api/health 2>/dev/null || echo "000")
  if [ "$CODE" = "200" ]; then
    echo "[$(date -Iseconds)] ✅ Dev server ready (HTTP 200 after ${i}s)"
    exit 0
  fi
done

echo "[$(date -Iseconds)] ❌ Dev server failed to start within 30s"
exit 1
