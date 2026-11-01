#!/bin/bash
# Resilient page tester: ensures server between each page
BASE="http://localhost:3000"
ensure_server() {
  for i in $(seq 1 3); do
    H=$(curl -s --max-time 5 $BASE/api/health 2>/dev/null | grep -o '"db":"connected"' | head -1)
    if [ "$H" = '"db":"connected"' ]; then return 0; fi
    # check if dev process exists; if not start it
    if ! pgrep -f "next dev" > /dev/null; then
      (setsid bash -c '/home/z/my-project/scripts/ops/dev-start.sh > /home/z/my-project/dev.log 2>&1' &)
    fi
    sleep 8
  done
  return 1
}
for page in "$@"; do
  ensure_server
  agent-browser open "$BASE$page" > /dev/null 2>&1
  # wait up to 30s for real title
  for i in $(seq 1 15); do
    T=$(agent-browser get title 2>/dev/null)
    if [ "$T" != "localhost" ] && [ -n "$T" ]; then break; fi
    ensure_server; sleep 2
    agent-browser open "$BASE$page" > /dev/null 2>&1
  done
  T=$(agent-browser get title 2>/dev/null)
  E=$(agent-browser errors 2>/dev/null | grep -ciE "error" || echo 0)
  echo "$page → ${T:-FAILED} | err-lines: $E"
  agent-browser errors --clear > /dev/null 2>&1
done
