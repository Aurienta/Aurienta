# AURIENTA Automated Audit Test Suite

Runnable end-to-end test scripts used by the 2026-11 master audit.

## 1. API Connectivity Probe (`api-probe.mjs`)
Probes ALL enumerated API routes (216) with safe, unauthenticated requests.
Records status codes, latency, and response shapes. Self-healing: restarts
the dev server when it dies (webpack OOM in sandbox), checkpoint/resume
via JSONL output.

```bash
BATCH=115 bun scripts/audit/e2e/api-probe.mjs   # probe up to 115 routes
# results append to /tmp/api-probe-results.jsonl
```

## 2. Authenticated Role + Workflow Test (`auth-role-test.mjs`)
Signs in as all 5 seeded users, tests RBAC enforcement (admin endpoints as
member → 403), the governance workflow (proposals list/vote), capital flows,
sign-out + session revocation. Full CSRF double-submit handling.

```bash
bun scripts/audit/e2e/auth-role-test.mjs
```

## 3. Resilient Page Test (`page-test.sh`)
Loads pages in a headless browser via agent-browser, verifies titles render,
counts page errors, restarts the dev server between pages when needed.

```bash
bash scripts/audit/e2e/page-test.sh /dashboard /dashboard/erp /registry
```

## Prerequisites
- Dev server managed by `scripts/ops/dev-start.sh` (self-healing .env)
- Seed data present (5 users, password `aurienta2026`)
- agent-browser installed (for page-test.sh)

## Existing unit tests
- `src/lib/__tests__/cre.test.ts` — 261 lines, pure CRE guards (bun:test)
- `src/lib/__tests__/format.test.ts` — formatters

Run: `bun test src/lib/__tests__/`
