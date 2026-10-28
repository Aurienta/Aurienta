#!/usr/bin/env bash
# AURIENTA — CI Count Check (P0 #8, #9)
# Fails CI if API route count or CRE function count is stale.
# Run: bash scripts/ci-count-check.sh

set -euo pipefail
cd "$(dirname "$0")/.."

# P0 #8: API route count — auto-generated, never hand-typed
API_COUNT=$(find src/app/api -name route.ts | wc -l)
echo "API routes: $API_COUNT"

# P0 #9: CRE function count — must be 26+
CRE_COUNT=$(grep -c "^export function\|^export async function" src/lib/aurienta/cre.ts)
echo "CRE functions: $CRE_COUNT"

# P0 #14: Dashboard pages missing auth check
MISSING_AUTH=0
for f in $(find src/app/dashboard -name page.tsx); do
  # Skip alumni (intentionally public, Vol 15 §15.5)
  if echo "$f" | grep -q "alumni"; then continue; fi
  if ! grep -q "getCurrentUser\|requireAuth\|requireRole" "$f" 2>/dev/null; then
    echo "❌ NO AUTH: $f"
    MISSING_AUTH=$((MISSING_AUTH + 1))
  fi
done
echo "Dashboard pages missing auth: $MISSING_AUTH"

# Exit with error if any check fails
if [ "$MISSING_AUTH" -gt 0 ]; then
  echo "❌ CI FAILED: $MISSING_AUTH dashboard pages missing auth"
  exit 1
fi

if [ "$CRE_COUNT" -lt 26 ]; then
  echo "❌ CI FAILED: CRE function count is $CRE_COUNT, expected ≥26"
  exit 1
fi

echo "✅ All CI count checks passed"
