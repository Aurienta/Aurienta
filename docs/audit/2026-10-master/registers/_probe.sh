#!/bin/bash
# Probe script for Phase 1-B API audit
set +e
cd /home/z/my-project

# Kill old dev servers
pkill -f 'next dev' 2>/dev/null
sleep 2

# Start dev server with smaller heap
DATABASE_URL="file:/home/z/my-project/prisma/.provider-placeholder.db" \
  NODE_OPTIONS='--max-old-space-size=1024' \
  ./node_modules/.bin/next dev --webpack -p 3000 > /tmp/aurienta-dev.log 2>&1 &
DEV_PID=$!
echo "Dev PID: $DEV_PID"

# Wait for readiness (up to 60s)
ready=0
for i in $(seq 1 60); do
  code=$(curl -s -o /tmp/b -w "%{http_code}" --max-time 3 http://localhost:3000/api/health 2>/dev/null)
  if [ "$code" = "200" ]; then echo "Ready after ${i}s"; ready=1; break; fi
  sleep 1
done
if [ "$ready" != "1" ]; then
  echo "Server did NOT become ready"
  tail -30 /tmp/aurienta-dev.log
  kill -TERM $DEV_PID 2>/dev/null
  wait $DEV_PID 2>/dev/null
  exit 1
fi

probe() {
  local method="$1"; local path="$2"; local data="$3"; local hdr="$4"
  if [ -n "$data" ]; then
    code=$(curl -s -o /tmp/body.txt -w "%{http_code}" --max-time 25 -X "$method" \
      -H "Content-Type: application/json" ${hdr:+-H "$hdr"} -d "$data" "http://localhost:3000$path")
  else
    code=$(curl -s -o /tmp/body.txt -w "%{http_code}" --max-time 25 -X "$method" \
      ${hdr:+-H "$hdr"} "http://localhost:3000$path")
  fi
  body=$(head -c 180 /tmp/body.txt 2>/dev/null | tr '\n' ' ' | sed 's/  */ /g')
  printf "%-50s %-5s HTTP %s  %s\n" "$path" "$method" "$code" "$body"
}

echo ""
echo "=== SECTION 1: Cron endpoints (no auth) ==="
probe POST "/api/cron/health-rating" "" ""
probe POST "/api/cron/crcica-arbitration" "" ""
probe POST "/api/cron/stage-transition" "" ""
probe POST "/api/cron/verification-sla" "" ""
probe GET  "/api/cron/proposal-expiry" "" ""
probe GET  "/api/cron/reservation-expiry" "" ""

echo ""
echo "=== SECTION 2: Cron endpoints (bogus Bearer) ==="
probe POST "/api/cron/health-rating" "" "Authorization: Bearer bogus"
probe POST "/api/cron/stage-transition" "" "Authorization: Bearer bogus"

echo ""
echo "=== SECTION 3: Cron endpoints (dev-cron-secret token) ==="
probe GET  "/api/cron/proposal-expiry?token=dev-cron-secret" "" ""
probe GET  "/api/cron/reservation-expiry?token=dev-cron-secret" "" ""

echo ""
echo "=== SECTION 4: Public-by-design GET endpoints ==="
probe GET "/api/v1/cre/policies" "" ""
probe GET "/api/legal-templates" "" ""
probe GET "/api/oracle/consensus" "" ""
probe GET "/api/public/stats" "" ""
probe GET "/api/health" "" ""

echo ""
echo "=== SECTION 5: Auth-protected GET endpoints (expect 401) ==="
probe GET "/api/enterprises" "" ""
probe GET "/api/admin/users" "" ""
probe GET "/api/dividends" "" ""
probe GET "/api/expenses" "" ""
probe GET "/api/erp/inventory" "" ""
probe GET "/api/proposals" "" ""
probe GET "/api/soulbound" "" ""
probe GET "/api/ai/brain-status" "" ""

echo ""
echo "=== SECTION 6: POST endpoints (expect 403 CSRF or 401) ==="
probe POST "/api/enterprises" "{}" ""
probe POST "/api/dividends" "{}" ""
probe POST "/api/v1/ipfs/pin" '{"content":"x"}' ""
probe POST "/api/soulbound/verify" '{"credentialId":"x"}' ""
probe POST "/api/v1/cre/validate" '{"policy":"zero_custody","params":{"beneficiary":"x"}}' ""
probe POST "/api/oracle/consensus" '{"query":"hello","apiKey":"x"}' ""
probe POST "/api/v1/webhook/payment" "{}" ""
probe POST "/api/auth/register" "{}" ""

echo ""
echo "=== SECTION 7: Remaining GET-no-auth endpoints ==="
probe GET "/api/v1/gov/gafi" "" ""
probe GET "/api/v1/gov/nosi" "" ""
probe GET "/api/v1/gov/eta" "" ""
probe GET "/api/v1/intelligence/conflicts" "" ""
probe GET "/api/v1/regulatory/fra/dashboard" "" ""
probe GET "/api/v1/enterprise/test/data" "" ""
probe GET "/api/fx/consensus" "" ""
probe GET "/api/legal-templates/tpl-constitutional-pledge" "" ""

# Cleanup
kill -TERM $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null
echo ""
echo "---PROBE COMPLETE---"
