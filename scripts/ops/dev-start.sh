#!/usr/bin/env bash
# AURIENTA dev-start: self-heals .env from canonical, then starts dev server
CANONICAL=/home/z/my-project/scripts/ops/.env-canonical
if [ ! -f "$CANONICAL" ]; then echo "FATAL: canonical env missing"; exit 1; fi
cp "$CANONICAL" /home/z/my-project/.env
chmod 444 /home/z/my-project/.env
cd /home/z/my-project
unset DATABASE_URL TURSO_AUTH_TOKEN FIELD_ENCRYPTION_KEY SESSION_SECRET CRON_SECRET FRA_ACCESS_TOKEN
set -a; . /home/z/my-project/.env; set +a
echo "[dev-start] env restored: DATABASE_URL=$DATABASE_URL"
export NODE_OPTIONS="--max-old-space-size=2048"
exec bun run dev
