#!/bin/bash
cd /home/z/my-project
while true; do
  pkill -f "next-server" 2>/dev/null
  sleep 1
  DATABASE_URL=file:/home/z/my-project/prisma/.provider-placeholder.db NODE_OPTIONS="--max-old-space-size=1536" node node_modules/next/dist/bin/next dev --webpack -p 3000 >> /home/z/my-project/dev.log 2>&1
  STATUS=$?
  echo "[$(date)] Server exited with $STATUS, restarting in 3s..." >> /home/z/my-project/dev.log
  sleep 3
done
