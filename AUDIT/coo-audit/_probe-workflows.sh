#!/bin/bash
# C-WORKFLOWS probe helper
COOKIE_JAR=/tmp/aurienta-cookies/layla.txt
OUT_DIR=/tmp/wf-results
mkdir -p "$OUT_DIR"

probe() {
  local name="$1"
  local url="$2"
  local fname="$3"
  echo "=========================================="
  echo "WORKFLOW: $name"
  echo "URL: $url"
  curl -s --max-time 90 -b "$COOKIE_JAR" -o "$OUT_DIR/$fname.html" -w "HTTP %{http_code} | size %{size_download} | time %{time_total}s\n" "$url"
  echo "--- title ---"
  grep -oE '<title>[^<]*</title>' "$OUT_DIR/$fname.html" | head -1
  echo "--- first 500 chars ---"
  head -c 500 "$OUT_DIR/$fname.html"
  echo
  echo "--- error/exception indicators (non-script) ---"
  grep -ioE '(error|exception|failed|undefined|fallback|mock)' "$OUT_DIR/$fname.html" 2>/dev/null | sort | uniq -c | sort -rn | head -8
  echo "--- real data search ---"
  grep -oE '(Street Bites|EcoPack|Nile Brew|SmartFarm|Mohamed|Ahmed|Sarah|Khalil|Layla|EGP|[0-9]{3,}|tier|stage|graduat|pending|verified)' "$OUT_DIR/$fname.html" 2>/dev/null | sort -u | head -20
  echo
}

probe "1. Authentication" "http://localhost:3000/dashboard" "wf1-dashboard"
probe "2. Dashboard Overview" "http://localhost:3000/dashboard" "wf2-dashboard-overview"
probe "3. Enterprise Profile" "http://localhost:3000/dashboard/enterprise-profile" "wf3-enterprise-profile"
probe "4. CRE Constitution" "http://localhost:3000/dashboard/constitution" "wf4-constitution"
probe "5. Capital Holdings" "http://localhost:3000/dashboard/capital/holdings" "wf5-capital-holdings"
probe "6. ERP Hub" "http://localhost:3000/dashboard/erp" "wf6-erp"
probe "7. AI Copilot" "http://localhost:3000/dashboard/copilot" "wf7-copilot"
probe "8. AI Router Status" "http://localhost:3000/api/ai/router-status" "wf8-ai-router"
probe "9. Compliance" "http://localhost:3000/dashboard/compliance" "wf9-compliance"
probe "10. Graduation" "http://localhost:3000/dashboard/graduation" "wf10-graduation"
echo "=========================================="
echo "ALL PROBES COMPLETE - files in $OUT_DIR"
ls -la "$OUT_DIR"
