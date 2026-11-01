#!/usr/bin/env bash
# AURIENTA dev starter with Turso production database
cd /home/z/my-project
unset DATABASE_URL TURSO_AUTH_TOKEN FIELD_ENCRYPTION_KEY SESSION_SECRET CRON_SECRET FRA_ACCESS_TOKEN
set -a; . /home/z/my-project/.env; set +a
echo "[dev-turso] DATABASE_URL=$DATABASE_URL"
export NODE_OPTIONS="--max-old-space-size=2048"
exec bun run dev
