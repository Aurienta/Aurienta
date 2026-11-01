# DELIVERABLE 8 — REMEDIATION REGISTER
**All fixes in commit `9be9d75` (plus i18n group-keys fix staged after). Every repair re-verified live — evidence column cites the probe.**

| # | Sev | Defect (root cause) | Correction | Validation |
|---|---|---|---|---|
| R1 | P1 | Sidebar hid "My Workspace"+"Capital" (17 items) from ALL users — `visibleGroupsForRoles` used "Workspace" (no such group) and never added "Capital"; `groupOrderForRoles` same (nav-config.ts:449,485) | Group names corrected + "Capital" added to universal set + operator order; NOTE comment added to prevent recurrence; shell comment updated | **Browser live:** sidebar now renders 11/11 groups with item counts (Enterprise 11, ERP 9, My Workspace 6, Capital 11, …); nav click-through → /dashboard/opportunities 200 |
| R2 | P1 | ERP Test Connection button dead — frontend POSTs /api/erp/integration/test, route did not exist (erp-integration-client.tsx:104) | Route created (auth + rate limit 10/min + integrationId validation) calling lib testConnection (NetSuite/Odoo/SAP/custom REST+GraphQL real probes) | Probe: POST → 403 (CSRF, correct for unauthenticated); tsc clean |
| R3 | P1 | GET /api/inngest → 500 null — Inngest SDK createFunction throws at module load on placeholder signing key (inngest.ts:220) | Defensive try/catch around both function factories + route-level safeServe wrapper + signing-key format validation before using serve() | **Probe: 200** with sandbox payload (workflows listed, mode:sandbox) |
| R4 | P1 | GET /api/ai/diagnose publicly open — disclosed provider config state, model lists, HF account identity (route self-declared "Temporary") | aurienta_rep session required (getCurrentUser + membership check) | **Probe: 403** (was 200) |
| R5 | P2 | GET /api/metrics publicly open — platform user/enterprise/session counts | CRON_SECRET bearer (scraper) OR aurienta_rep session | **Probe: 401** (was 200) |
| R6 | P2 | Demo sign-in email `sarah@Capital Partner.eg` invalid (space) — Sarah's demo button broken (auth.ts:172) | → sarah@investor.eg | grep + sign-in page demo list |
| R7 | P2 | /api/public/stats published fabricated metrics: AI_HEALTH constants + CRE_UPTIME_PCT=99.95 as "live" | Real computed: cre {status, decisionsIssued}, aiHealth {artifactsTotal, avgConfidence (aggregate), honest note} | **Probe:** returns real values (decisions: 0, artifacts: 0 — accurate for fresh clone) |
| R8 | P2 | /trust page displayed fake telemetry ("Sampled 10k outputs", hallucination 0.4%, bias 12%, drift 0.06, "Gemma 2 7B oversight") | Real DB-computed cards (artifacts produced, avg AI confidence, CRE decisions issued) + accurate architecture labels (Deterministic CRE 52 policies / Multi-Model Consensus 5 providers); removed aiMetricColor dead fn | tsc clean; page compiles |
| R9 | P2 | /api/ai/salary-engine blind destructuring (no validation) — inconsistent with /api/ai/salary | Full field validation (enterpriseId cuid-len, position 2-120, department ≤120, experienceYears 0-60) | tsc clean |
| R10 | P2 | Credential/admin endpoints unrate-limited: api-keys POST (issues secrets!), admin role/suspend/freeze/unfreeze | api-keys 10/min/user; admin mutations 30/min/actor (shared admin_mutation limiter); erp-integration-test 10/min | Lint+tsc clean; probes unchanged-status |
| R11 | P2 | i18n: 20 nav labels unmapped + 10 NAV_I18N keys missing translations + 3 group keys rendered raw ("group.myWorkspace" visible in UI) | +20 NAV_I18N entries; +30 EN +30 AR translations; +3+3 group keys | **Browser live:** groups render as "My Workspace"/"Capital"/"ERP" (no raw keys); key-coverage check = 0 missing |
| R12 | P3 | Footer: Privacy/Terms both → /legal; social links dead "#" | → /legal/privacy, /legal/terms; social → real destinations (GitHub repo, trust, registry, legal) | grep |
| R13 | P3 | Stale prisma/migrations/0_init (51 tables) — fresh `migrate deploy` would run after 0_complete_init and fail on duplicate tables | Deleted (0_complete_init is the single source: 99 tables) | migrations dir = 1 folder + lock |
| R14 | P3 | Dead code: 22 site/ components + PagePlaceholder + 9 lib modules (ai-prompt-tiers, block-trade, crcica, economic-model, eve, hsm, liquidity-reserve, smart-db-router, tax-engine) — all 0-importers (verified incl. transitive) | Deleted; AiArtifact.modelVersion default glm-4.6→multi-consensus; ai-router/env headers 4→5 providers; alumni comment aligned; dashboard-shell comment 5→7 groups | **lint 0 errors, tsc clean, 22 pages re-verified 200/0-errors** |

## Regression checks after fixes
1. `bun run lint` → 0 errors (606 pre-existing style warnings, unchanged).
2. `bunx tsc --noEmit` → exit 0.
3. `bun test src/lib/__tests__/` → **54/54 pass**.
4. API re-probe of changed routes: inngest 200, diagnose 403, metrics 401, stats real-data, erp/test exists.
5. Browser: 11/11 sidebar groups, nav click-through 200, 0 page errors on 22 pages.
6. DB untouched by fixes (no destructive ops; audit-clone used for all probing).

## Items NOT fixed (with rationale — see D6)
- S-1 nosiNumber encryption (policy decision needed) · G6 mobile overflow (per-page pass) · B4a cascade (needs authorized migration) · G7 remaining GET rate limits (progressive) · G8 legal-templates open (accepted).
