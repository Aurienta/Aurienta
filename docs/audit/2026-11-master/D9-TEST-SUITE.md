# DELIVERABLE 9 — AUTOMATED TEST SUITE

## Location & usage

| Suite | Path | Run |
|---|---|---|
| Unit (CRE + formatters) | `src/lib/__tests__/{cre,format}.test.ts` | `bun test src/lib/__tests__/` |
| API connectivity probe (216 routes) | `scripts/audit/e2e/api-probe.mjs` | `BATCH=115 bun scripts/audit/e2e/api-probe.mjs` |
| Authenticated role/workflow suite | `scripts/audit/e2e/auth-role-test.mjs` | `bun scripts/audit/e2e/auth-role-test.mjs` |
| Resilient page tester (browser) | `scripts/audit/e2e/page-test.sh` | `bash scripts/audit/e2e/page-test.sh /dashboard /dashboard/erp …` |
| Docs | `scripts/audit/e2e/README.md` | — |
| Raw evidence | `docs/audit/2026-11-master/api-probe-results.jsonl` (216 records), `auth-test-results.json` | — |

## Design notes
- **api-probe.mjs** — enumerates every route.ts, extracts exported methods, substitutes seed-data values for dynamic segments, probes the primary method with an inert marker payload (`{"__audit_probe__":true}` — fails validation by design, proving validation exists), records status/latency/body. Self-healing: restarts the dev server on connection failure (sandbox OOM), checkpoint/resume via JSONL (survives interruptions).
- **auth-role-test.mjs** — full CSRF double-submit client (reads aurienta_csrf cookie → X-CSRF-Token header), session cookie management, tests: 5 sign-ins, negative auth (2), RBAC denials (5), member data access, governance list/vote, investor capital endpoints, sign-out + revocation.
- **page-test.sh** — agent-browser driven; ensures server health between page loads; asserts real title (not chrome-error), counts page errors.
- All probes run against the **audit clone** (`db/audit-clone.db` — byte-copy of production Turso taken this cycle) so production data is never touched by testing.

## Current results
- Unit: **54/54 pass** (CRE zero-custody, expense authority, dynamic minimum, price bands, quorum incl. 75% supermajority, police clearance; formatters).
- API probe: 216/216 routes respond; 0 dead; 0 5xx post-fix; latency profile captured.
- Auth suite: 19/19 valid cases pass.
- Pages: 22/22 tested pages render with 0 page errors.

## Regression policy
Every future repair touching APIs should re-run: probe (changed routes), auth suite (if auth-adjacent), unit tests. The probe script's JSONL output enables before/after diffing.
