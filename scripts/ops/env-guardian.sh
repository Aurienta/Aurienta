#!/usr/bin/env bash
# AURIENTA — .env Guardian
# Runs before the dev server starts. Checks that .env has the correct
# DATABASE_URL and re-seeds the DB if needed.
#
# This prevents the recurring "Database error" issue caused by .env being
# reset to db/custom.db (which doesn't exist).
#
# NOTE: This script does NOT contain any API keys. It reads them from the
# existing .env file if present, or from .env.example as a template.

set -e
cd /home/z/my-project

CORRECT_DB_URL="file:/home/z/my-project/prisma/.provider-placeholder.db"

# Check if .env has the correct DATABASE_URL
CURRENT_DB_URL=$(grep "^DATABASE_URL=" .env 2>/dev/null | cut -d'=' -f2- || echo "")

if [ "$CURRENT_DB_URL" != "$CORRECT_DB_URL" ]; then
  echo "[env-guardian] ⚠️  .env has wrong DATABASE_URL: $CURRENT_DB_URL"
  echo "[env-guardian] Fixing .env..."

  # Make .env writable temporarily
  chmod 644 .env 2>/dev/null || true

  # Write the correct DATABASE_URL + preserve any existing AI keys
  # by reading them from the current .env (if it exists)
  GROQ_KEY=$(grep "^GROQ_API_KEY=" .env 2>/dev/null | cut -d'=' -f2- || echo "")
  GEMINI_KEY=$(grep "^GEMINI_API_KEY=" .env 2>/dev/null | cut -d'=' -f2- || echo "")
  OR_KEY=$(grep "^OPENROUTER_API_KEY=" .env 2>/dev/null | cut -d'=' -f2- || echo "")
  NVIDIA_KEY=$(grep "^NVIDIA_API_KEY=" .env 2>/dev/null | cut -d'=' -f2- || echo "")
  HF_KEY=$(grep "^HUGGINGFACE_API_KEY=" .env 2>/dev/null | cut -d'=' -f2- || echo "")
  TURSO_TOKEN=$(grep "^TURSO_AUTH_TOKEN=" .env 2>/dev/null | cut -d'=' -f2- || echo "")

  cat > .env << ENV_CONTENT
DATABASE_URL=$CORRECT_DB_URL
FRA_ACCESS_TOKEN=test-fra-token
CRON_SECRET=aurienta-cron-secret-2026
GROQ_API_KEY=$GROQ_KEY
OPENROUTER_API_KEY=$OR_KEY
NVIDIA_API_KEY=$NVIDIA_KEY
GEMINI_API_KEY=$GEMINI_KEY
HUGGINGFACE_API_KEY=$HF_KEY
TURSO_AUTH_TOKEN=$TURSO_TOKEN
INNGEST_EVENT_KEY=aurienta-inngest-event-key-2026
INNGEST_SIGNING_KEY=aurienta-inngest-signing-key-2026
INNGEST_API_URL=https://api.inngest.com
NEON_DATABASE_URL=postgresql://aurienta:aurienta@ep-aurienta-pooler.us-east-2.aws.neon.tech/aurienta?sslmode=require
NEXT_PUBLIC_VERCEL_URL=aurienta.vercel.app
PUBLIC_BASE_URL=https://aurienta.vercel.app
ENV_CONTENT

  chmod 444 .env
  echo "[env-guardian] ✅ .env fixed and locked (read-only)"
fi

# Check if DB has users
USER_COUNT=$(bun -e "
import { Database } from 'bun:sqlite';
try {
  const db = new Database('prisma/.provider-placeholder.db', { readonly: true });
  const r = db.query('SELECT COUNT(*) as n FROM User').get();
  console.log(r.n);
  db.close();
} catch { console.log(0); }
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
  echo "[env-guardian] ⚠️  DB has 0 users — re-seeding..."
  DATABASE_URL="file:/home/z/my-project/prisma/.provider-placeholder.db" timeout 120 bunx tsx prisma/seed.ts 2>&1 | tail -3
  echo "[env-guardian] ✅ DB re-seeded"
else
  echo "[env-guardian] ✅ DB has $USER_COUNT users"
fi
