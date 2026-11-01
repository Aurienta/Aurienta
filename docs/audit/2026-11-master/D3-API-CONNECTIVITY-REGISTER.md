# DELIVERABLE 3 — API CONNECTIVITY REGISTER
**Evidence:** `api-probe-results.jsonl` (216 records, this directory) — unauthenticated probes with status/latency/body, plus authenticated suite results.

## Summary matrix (216 routes, primary method, unauthenticated)

| Response | Count | Meaning |
|---|---|---|
| 401 Unauthorized | 84 | Session-protected — correct |
| 403 Forbidden | 54 | CSRF double-submit on POSTs — correct (middleware) |
| 405 Method Not Allowed | 50 | GET on POST-only routes — correct |
| 200 Open | 15 | Public-by-design (see list) |
| 400 Bad Request | 7 | Validation rejects probe payload — correct |
| 404 Not Found | 4 | Probe used fake IDs — correct behavior |
| 500 Server Error | 0 | **(was 1: /api/inngest — FIXED)** |
| 503 Service Unavailable | 1 | /api/ready — AI keys unconfigured locally (environmental, see note) |
| Dead/timeout | 0 | — |

## The 15 open-200 routes — reviewed one by one

| Route | Verdict |
|---|---|
| /api/health, /api/platform-health | Ops endpoints — BY DESIGN |
| /api/ready | Ops — 503 while AI keys absent (correct readiness semantics) |
| /api/fx/consensus | Public FX median (4 public sources) — BY DESIGN |
| /api/v1/cre/policies | CRE rule enumeration for auditors — BY DESIGN (read-only) |
| /api/legal-templates | Platform legal document library — public legal transparency; render is server-side templating only — ACCEPTED |
| /api/evidence | IPFS evidence metadata list ("radical transparency") — no PII fields — ACCEPTED |
| /api/public/registry, /stats, /enterprise/[slug]{,/transparency,/trades,/cre-decisions} (6) | Public constitutional API — BY DESIGN (matches public pages' disclosure level; employee data anonymized via §8.6.2 sanitization) |

**Changed from open to protected this cycle:** /api/ai/diagnose (→403 rep-only), /api/metrics (→401 cron-or-rep).

## Authenticated suite results (23 cases)

| Case | Result |
|---|---|
| Sign-in ×5 users (Layla/Ahmed/Sarah/Mohamed/Khalil) | 5/5 PASS (200 + session cookie) |
| Wrong password | PASS (401) |
| Nonexistent user | PASS (401) |
| Member → admin/users, admin/enterprises, admin/settings, admin/audit | 4/4 PASS (403) |
| Member → FRA dashboard | PASS (401 — bearer required, session not accepted) |
| Member → proposals (own data) | PASS (200, wrapped `{proposals:[...]}`) |
| Proposals list + vote flow | List PASS; no open proposal in seed for live vote (data condition, not defect — proposal voting logic covered by unit tests + prior workflow audit 7/10) |
| Investor → syndicates, dividends, drip | 3/3 PASS (200) |
| Sign-out + session revocation | 2/2 PASS (401 after) |
| **Total** | **19/19 valid cases PASS** (4 test-script path assumptions corrected: notifications/opportunities/market are server-component pages with direct DB access — verified) |

## Latency (dev sandbox, includes first-compile)

p50 443ms · p90 1,207ms · p99 2,639ms · max 6,459ms (erp/integration/logs first compile). Production Vercel (prior cycle): DB RTT 238ms, Groq 1,189ms.

## Route-by-route
See `api-probe-results.jsonl` (machine-readable, 216 lines: route, method, status, ms, body sample).
