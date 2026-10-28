#!/usr/bin/env bash
# AURIENTA — Pre-warm all critical routes to populate the .next cache.
# The sandbox OOM-kills the dev server when compiling multiple routes in one
# process. This script compiles each route in a SEPARATE server process,
# restarting between each. The .next cache persists, so after this script
# runs, the dev server can serve all pre-warmed routes without compiling.

PROJECT_DIR="/home/z/my-project"
cd "$PROJECT_DIR"

ROUTES=(
  "/"
  "/signin"
  "/register"
  "/trust"
  "/api/health"
  "/api/public/stats"
  "/dashboard"
  "/dashboard/portfolio"
  "/dashboard/profile"
  "/dashboard/founder"
  "/dashboard/governance"
  "/dashboard/manager"
  "/dashboard/graduation"
  "/dashboard/board-member"
  "/dashboard/university"
  "/dashboard/pitch-deck"
  "/dashboard/oracle-mirror"
  "/dashboard/compliance"
  "/dashboard/steward"
  "/dashboard/fra"
  "/dashboard/copilot"
  "/dashboard/notifications"
)

echo "[$(date -Iseconds)] Pre-warming ${#ROUTES[@]} routes..."

for route in "${ROUTES[@]}"; do
  # Kill any existing server
  pkill -f "next-server" 2>/dev/null
  pkill -f "next dev" 2>/dev/null
  sleep 2

  # Start fresh server
  > dev.log
  setsid bash -c 'NODE_OPTIONS="--max-old-space-size=512" exec bunx next dev --webpack -p 3000 >> dev.log 2>&1' & disown
  sleep 8

  # Hit the route to compile it
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 90 "http://localhost:3000${route}" 2>/dev/null)
  echo "[$(date -Iseconds)] $route → $CODE"
done

# Kill the last warmup server
pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Start the final dev server that will serve the preview
echo "[$(date -Iseconds)] Starting final dev server..."
> dev.log
setsid bash -c 'NODE_OPTIONS="--max-old-space-size=512" exec bunx next dev --webpack -p 3000 >> dev.log 2>&1' & disown
sleep 8

echo "[$(date -Iseconds)] Pre-warm complete. Dev server running."
