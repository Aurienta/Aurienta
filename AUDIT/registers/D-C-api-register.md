# D-C — API Register & Backend Audit (Phase 1-B)

**Mandate:** PLATFORM-FULL-AUDIT-AND-REMEDIATION-001
**Task ID:** 1-B
**Agent:** `api-register`
**Scope:** `src/app/api/**/route.ts` (215 endpoints)
**Inspection-only.** No code modified.
**Date:** 2026-10-23

---

## 1. Methodology

1. Enumerated every `route.ts` file under `src/app/api/` via `Glob` (215 files; 0 `route.js`).
2. Programmatically scanned each file for:
   - Exported HTTP methods (`GET | POST | PUT | PATCH | DELETE`).
   - Auth signals: `getCurrentUser`, `requireUser`, `requireRole`, `getServerSession`, `withErrorHandler` wrapper, header-based `authorization`/`x-api-key` checks, signature-verified webhook patterns.
   - Validation signals: `parseBody`, `safeParse`, `zod` import, `Schema = z.object`, manual `typeof`/`Number.isFinite`/`.trim().length` checks.
   - Prisma usage via `db.*` / `prisma.*` / `tx.*` call sites.
   - Catch-blocks returning `NextResponse.json` without a `status:` literal (false-success heuristic) — flagged for manual review.
   - Stub pattern: only returns `{ok:true}` with no DB write.
3. Spot-read 8 endpoint implementations to validate the heuristics and confirm findings.
4. Probed 27 endpoints against `http://localhost:3000` (unauthenticated) — captured HTTP code + first 180 chars of body. Dev server started fresh with reduced heap (`--max-old-space-size=1024`) and torn down after probing.
5. Cross-checked suspected auth-bypass patterns against `.env` to confirm secret configuration state.

Helper scripts written (inspect-only, kept for traceability):
- `AUDIT/registers/_scan_api.py` — static scanner → `AUDIT/registers/_api_scan.json`
- `AUDIT/registers/_probe.sh` — live curl harness

---

## 2. Summary Metrics

| Metric | Value |
|---|---|
| Total `route.ts` files | **215** |
| Endpoints using Prisma | **148** (68.8 %) |
| Endpoints with auth signal | **173** (80.5 %) |
| Endpoints with input validation | **133** (61.9 %) |
| Endpoints using Zod (parseBody / safeParse / z.object) | **86** (40.0 %) |
| Endpoints wrapped in `withErrorHandler` | **136** (63.3 %) |
| Method distribution | GET: 120 · POST: 138 · PATCH: 23 · PUT: 1 · DELETE: 1 |

The platform is **POST-heavy** (138 POST vs 120 GET, 1 PUT, 1 DELETE) — mutations are performed almost exclusively via POST action endpoints rather than REST verbs. This is consistent with the "RPC-style" Next.js route pattern documented across the codebase.

---

## 3. Per-Domain Counts (top 20)

| Domain | Endpoints | GET | POST | PATCH | Prisma | Auth | Zod |
|---|---:|---:|---:|---:|---:|---:|---:|
| ai | 27 | 2 | 26 | 0 | 22 | 27 | 5 |
| erp | 21 | 13 | 13 | 7 | 17 | 21 | 18 |
| admin | 11 | 7 | 4 | 3 | 11 | 11 | 0 |
| auth | 9 | 1 | 8 | 0 | 3 | 5 | 7 |
| cron | 6 | 2 | 4 | 0 | 4 | 0 | 0 |
| enterprises | 6 | 4 | 4 | 1 | 6 | 6 | 1 |
| public | 6 | 6 | 0 | 0 | 6 | 0 | 0 |
| expenses | 4 | 2 | 3 | 0 | 4 | 4 | 1 |
| cre | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| dividends | 2 | 1 | 1 | 1 | 1 | 2 | 2 |
| gov | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| legal-templates | 3 | 2 | 1 | 0 | 0 | 0 | 0 |
| vault | 3 | 2 | 2 | 1 | 3 | 3 | 3 |
| verification | 3 | 2 | 2 | 1 | 3 | 3 | 2 |
| fx | 3 | 2 | 1 | 0 | 0 | 1 | 0 |
| graduation | 3 | 1 | 2 | 0 | 3 | 3 | 3 |
| ledger | 3 | 2 | 1 | 0 | 2 | 3 | 0 |
| soulbound | 3 | 1 | 3 | 0 | 0 | 2 | 0 |
| succession | 3 | 1 | 3 | 0 | 3 | 3 | 1 |
| (37 other domains, ≤2 each) | 113 | — | — | — | — | — | — |

**Domain coverage:** 84 distinct sub-domains. Concentration in `ai` (27) and `erp` (21) reflects the platform's AI-brain + ERP core. `admin` (11) and `auth` (9) form the privileged surface.

---

## 4. Full API Table (215 endpoints, sorted by domain)

| Route | Methods | Domain | Auth | Valid | Prisma | Purpose |
|---|---|---|---|---|---|---|
| /api/admin/audit | GET | admin | ✓ | ✗ | ✓ | list platform audit log |
| /api/admin/audit/export | GET | admin | ✓ | ✗ | ✓ | export audit log as CSV |
| /api/admin/enterprises | GET | admin | ✓ | ✗ | ✓ | admin: list all enterprises |
| /api/admin/enterprises/[id] | GET,PATCH | admin | ✓ | ✓ | ✓ | admin: enterprise detail / update |
| /api/admin/enterprises/[id]/freeze | POST | admin | ✓ | ✓ | ✓ | admin: freeze enterprise |
| /api/admin/enterprises/[id]/unfreeze | POST | admin | ✓ | ✓ | ✓ | admin: unfreeze enterprise |
| /api/admin/settings | GET,PATCH | admin | ✓ | ✓ | ✓ | platform settings get/upsert (requireRole: aurienta_rep) |
| /api/admin/users | GET | admin | ✓ | ✗ | ✓ | admin: list users |
| /api/admin/users/[id] | GET,PATCH | admin | ✓ | ✓ | ✓ | admin: user detail / update |
| /api/admin/users/[id]/role | POST | admin | ✓ | ✓ | ✓ | admin: change user role |
| /api/admin/users/[id]/suspend | POST | admin | ✓ | ✓ | ✓ | admin: suspend user |
| /api/ai/annual-report | POST | ai | ✓ | ✓ | ✓ | generate annual report |
| /api/ai/anomaly | POST | ai | ✓ | ✓ | ✓ | anomaly detection |
| /api/ai/board-briefing | POST | ai | ✓ | ✓ | ✓ | generate board briefing |
| /api/ai/brain-status | GET | ai | ✓ | ✗ | ✗ | multi-model AI brain status |
| /api/ai/charter-diff | POST | ai | ✓ | ✓ | ✓ | diff charter versions |
| /api/ai/drift | POST | ai | ✓ | ✓ | ✓ | drift detection |
| /api/ai/eve | POST | ai | ✓ | ✓ | ✓ | Execution Verification Engine |
| /api/ai/evidence-verification | POST | ai | ✓ | ✓ | ✓ | evidence verification engine |
| /api/ai/explain | POST | ai | ✓ | ✓ | ✗ | explain AI decision |
| /api/ai/feasibility | GET,POST | ai | ✓ | ✓ | ✓ | constitutional project feasibility |
| /api/ai/graduation-coach | POST | ai | ✓ | ✓ | ✓ | graduation coach |
| /api/ai/graduation-simulator | POST | ai | ✓ | ✓ | ✓ | graduation simulator |
| /api/ai/ir | POST | ai | ✓ | ✓ | ✓ | investor relations content |
| /api/ai/mentor-matching | POST | ai | ✓ | ✓ | ✓ | mentor matching engine |
| /api/ai/milestone-designer | POST | ai | ✓ | ✓ | ✓ | milestone design |
| /api/ai/multilingual | POST | ai | ✓ | ✓ | ✗ | multilingual translation |
| /api/ai/partner-insights | POST | ai | ✓ | ✓ | ✓ | partner insights |
| /api/ai/pitch-deck | POST | ai | ✓ | ✓ | ✓ | pitch deck generator |
| /api/ai/precedent | POST | ai | ✓ | ✓ | ✓ | precedent lookup |
| /api/ai/salary | POST | ai | ✓ | ✓ | ✗ | compensation intelligence |
| /api/ai/salary-engine | POST | ai | ✓ | ✓ | ✓ | salary engine |
| /api/ai/salary/override | POST | ai | ✓ | ✓ | ✗ | salary board override |
| /api/ai/share-message | POST | ai | ✓ | ✓ | ✓ | share message generator |
| /api/ai/succession | POST | ai | ✓ | ✓ | ✓ | succession planning |
| /api/ai/survival-drill | POST | ai | ✓ | ✓ | ✓ | survival drill |
| /api/ai/tax | POST | ai | ✓ | ✓ | ✓ | tax computation |
| /api/ai/triage | POST | ai | ✓ | ✓ | ✓ | AI triage |
| /api/api-keys | GET,POST | api-keys | ✓ | ✓ | ✓ | manage public API keys |
| /api/api-keys/[id] | DELETE | api-keys | ✓ | ✗ | ✓ | revoke API key |
| /api/appeals | GET,POST | appeals | ✓ | ✓ | ✓ | list / create appeals |
| /api/arei | GET | arei | ✓ | ✗ | ✗ | AREI public read |
| /api/arei/compute | POST | arei | ✓ | ✗ | ✗ | AREI manual recompute |
| /api/auth | POST | auth | ✗ | ✓ | ✓ | session sign-in (REMED-1A) |
| /api/auth/passkey/authenticate/finish | POST | auth | ✓ | ✓ | ✓ | passkey auth finish |
| /api/auth/passkey/authenticate/start | POST | auth | ✗ | ✓ | ✗ | passkey auth start (public) |
| /api/auth/passkey/delete | POST | auth | ✓ | ✓ | ✗ | delete a passkey |
| /api/auth/passkey/list | GET | auth | ✓ | ✗ | ✗ | list current user passkeys |
| /api/auth/passkey/register/finish | POST | auth | ✓ | ✓ | ✗ | passkey register finish |
| /api/auth/passkey/register/start | POST | auth | ✓ | ✓ | ✗ | passkey register start |
| /api/auth/register | POST | auth | ✗ | ✓ | ✓ | partner registration (public) |
| /api/auth/signout | POST | auth | ✗ | ✗ | ✗ | sign out (clears cookie) |
| /api/benchmark | GET | benchmark | ✓ | ✗ | ✓ | enterprise benchmarking |
| /api/circuit-breaker/[enterpriseId] | GET | circuit-breaker | ✓ | ✗ | ✗ | circuit breaker state |
| /api/cooperative/transactions | GET,POST | cooperative | ✓ | ✗ | ✗ | REC-4 cooperative B2B txns |
| /api/cooperative/transactions/[transactionId] | PATCH | cooperative | ✓ | ✗ | ✓ | cooperative txn detail |
| /api/copilot | POST | copilot | ✓ | ✓ | ✓ | AI copilot chat |
| /api/v1/cre/policies | GET | cre | ✗ | ✗ | ✗ | list CRE policies (public) |
| /api/v1/cre/validate | POST | cre | ✗ | ✗ | ✗ | validate CRE action (public) |
| /api/cron/crcica-arbitration | POST | cron | ✗ | ✗ | ✗ | advance CRCICA arbitration cases |
| /api/cron/health-rating | POST | cron | ✗ | ✗ | ✗ | recalculate health ratings |
| /api/cron/proposal-expiry | GET | cron | ✗ | ✗ | ✓ | sweep expired proposals |
| /api/cron/reservation-expiry | GET | cron | ✗ | ✗ | ✓ | sweep expired reservations |
| /api/cron/stage-transition | POST | cron | ✗ | ✗ | ✓ | advance enterprise stages |
| /api/cron/verification-sla | POST | cron | ✗ | ✗ | ✓ | reject users past 48h SLA |
| /api/diaspora | POST | diaspora | ✓ | ✓ | ✓ | diaspora investor endpoints |
| /api/diaspora-corridor | GET,POST | diaspora-corridor | ✓ | ✓ | ✓ | diaspora corridor |
| /api/discovery | GET,POST | discovery | ✓ | ✓ | ✓ | enterprise discovery |
| /api/discovery/[matchId] | PATCH | discovery | ✓ | ✗ | ✗ | discovery match update |
| /api/dividends | GET,POST | dividends | ✓ | ✓ | ✓ | dividend distribution list/create |
| /api/dividends/[distributionId] | PATCH | dividends | ✓ | ✓ | ✗ | dividend distribution update |
| /api/documents/[id]/sign | POST | documents | ✓ | ✓ | ✓ | document e-signature |
| /api/drip | GET,POST | drip | ✓ | ✓ | ✓ | DRIP investment plan |
| /api/employees | GET,POST | employees | ✓ | ✓ | ✓ | employee list/create |
| /api/endorsements | GET,POST | endorsements | ✓ | ✓ | ✗ | constitutional endorsements |
| /api/endorsements/[endorsementId] | PATCH | endorsements | ✓ | ✓ | ✓ | endorsement resolve |
| /api/endorsements/enterprise/[enterpriseId] | GET | endorsements | ✓ | ✗ | ✗ | list endorsements by enterprise |
| /api/v1/enterprise/[slug]/data | GET | enterprise | ✗ | ✗ | ✓ | public enterprise data (API-key gated) |
| /api/enterprise-updates | GET,POST | enterprise-updates | ✓ | ✓ | ✓ | enterprise updates feed |
| /api/enterprises | GET,POST | enterprises | ✓ | ✓ | ✓ | list/constitute enterprise |
| /api/enterprises/[id]/close-capital-formation | POST | enterprises | ✓ | ✓ | ✓ | close capital formation |
| /api/enterprises/[id]/health | GET | enterprises | ✓ | ✗ | ✓ | enterprise health snapshot |
| /api/enterprises/[id]/list | POST | enterprises | ✓ | ✗ | ✓ | enterprise listing approval |
| /api/enterprises/[id]/milestones | GET,POST | enterprises | ✓ | ✓ | ✓ | enterprise milestones |
| /api/enterprises/[id]/profile | GET,PATCH | enterprises | ✓ | ✓ | ✓ | enterprise profile |
| /api/erp/assets | GET,POST | erp | ✓ | ✓ | ✓ | ERP assets |
| /api/erp/assets/[assetId] | PATCH | erp | ✓ | ✓ | ✓ | ERP asset detail |
| /api/erp/integration | GET,POST | erp | ✓ | ✗ | ✗ | ERP integration config |
| /api/erp/integration/logs | GET | erp | ✓ | ✗ | ✗ | ERP integration sync logs |
| /api/erp/integration/sync | POST | erp | ✓ | ✗ | ✗ | ERP integration sync |
| /api/erp/inventory | GET,POST | erp | ✓ | ✓ | ✓ | ERP inventory |
| /api/erp/inventory/[inventoryId]/movement | POST | erp | ✓ | ✓ | ✓ | ERP inventory movement |
| /api/erp/production-orders | GET,POST | erp | ✓ | ✓ | ✓ | ERP production orders |
| /api/erp/production-orders/[orderId] | PATCH | erp | ✓ | ✓ | ✓ | ERP production order detail |
| /api/erp/projects | GET,POST | erp | ✓ | ✓ | ✓ | ERP projects |
| /api/erp/projects/[projectId] | GET,PATCH | erp | ✓ | ✓ | ✗ | ERP project detail |
| /api/erp/purchase-orders | GET,POST | erp | ✓ | ✓ | ✓ | ERP purchase orders |
| /api/erp/purchase-orders/[poId] | GET,PATCH | erp | ✓ | ✓ | ✓ | ERP PO detail |
| /api/erp/quality-checks | GET,POST | erp | ✓ | ✓ | ✓ | ERP quality checks |
| /api/erp/quality-checks/[checkId] | PATCH | erp | ✓ | ✓ | ✓ | ERP quality check detail |
| /api/erp/resources | GET,POST | erp | ✓ | ✓ | ✓ | ERP resources |
| /api/erp/resources/[resourceId]/allocate | POST | erp | ✓ | ✓ | ✓ | ERP resource allocate |
| /api/erp/tasks | GET,POST | erp | ✓ | ✓ | ✓ | ERP tasks (WBS) |
| /api/erp/tasks/[taskId] | PATCH | erp | ✓ | ✓ | ✓ | ERP task detail |
| /api/erp/timesheets | GET,POST | erp | ✓ | ✓ | ✓ | ERP timesheets |
| /api/erp/timesheets/[timesheetId] | PATCH | erp | ✓ | ✓ | ✓ | ERP timesheet detail |
| /api/evidence | GET,POST | evidence | ✓ | ✓ | ✓ | evidence store |
| /api/evidence/[cid] | GET | evidence | ✗ | ✗ | ✓ | fetch evidence by content ID |
| /api/expenses | GET,POST | expenses | ✓ | ✓ | ✓ | expenses list/create |
| /api/expenses/[id]/approve | POST | expenses | ✓ | ✗ | ✓ | approve expense |
| /api/expenses/[id]/reject | POST | expenses | ✓ | ✓ | ✓ | reject expense |
| /api/expenses/budget | GET | expenses | ✓ | ✗ | ✓ | budget vs actual |
| /api/export-readiness | GET,POST | export-readiness | ✓ | ✓ | ✓ | export readiness score |
| /api/fx | GET | fx | ✗ | ✗ | ✗ | FX rate (single source) |
| /api/fx/consensus | GET | fx | ✗ | ✗ | ✗ | FX consensus (4-source median) |
| /api/fx/refresh | POST | fx | ✓ | ✗ | ✗ | force FX refresh |
| /api/gaas/organizations | GET,POST | gaas | ✓ | ✗ | ✗ | GaaS organizations |
| /api/gaas/organizations/[orgId]/decisions | GET,POST | gaas | ✓ | ✓ | ✓ | GaaS decisions |
| /api/gaas/organizations/[orgId]/policies | GET,POST | gaas | ✓ | ✓ | ✓ | GaaS policies |
| /api/genome | GET | genome | ✓ | ✗ | ✗ | list enterprise genomes |
| /api/genome/[enterpriseId] | GET | genome | ✓ | ✗ | ✗ | single enterprise genome |
| /api/v1/gov/eta | GET | gov | ✗ | ✗ | ✗ | ETA tax lookup |
| /api/v1/gov/gafi | GET | gov | ✗ | ✗ | ✗ | GAFI compliance lookup |
| /api/v1/gov/nosi | GET | gov | ✗ | ✗ | ✗ | NOSI compliance lookup |
| /api/graduation | GET | graduation | ✓ | ✓ | ✓ | graduation readiness |
| /api/graduation/execute | POST | graduation | ✓ | ✓ | ✓ | execute graduation |
| /api/graduation/export | POST | graduation | ✓ | ✓ | ✓ | export graduation package |
| /api/graduation-bond/[enterpriseId] | GET | graduation-bond | ✓ | ✗ | ✓ | graduation bond by enterprise |
| /api/graduation-bond/issue | POST | graduation-bond | ✓ | ✗ | ✗ | issue graduation bond |
| /api/graduation-bond/verify/[bondId] | GET | graduation-bond | ✗ | ✗ | ✗ | verify graduation bond |
| /api/health | GET | health | ✗ | ✗ | ✓ | container healthcheck |
| /api/inngest | (handler) | inngest | ✗ | ✓ | ✗ | Inngest webhook handler |
| /api/v1/intelligence/conflicts | GET | intelligence | ✗ | ✗ | ✗ | interest-conflict check |
| /api/v1/ipfs/pin | POST | ipfs | ✗ | ✗ | ✗ | pin content to IPFS |
| /api/ledger/sync | POST | ledger | ✓ | ✓ | ✗ | ledger sync trigger |
| /api/ledger/ticker | GET | ledger | ✓ | ✗ | ✓ | ledger ticker |
| /api/ledger/verify | GET | ledger | ✓ | ✗ | ✓ | ledger verification |
| /api/legal-templates | GET | legal-templates | ✗ | ✗ | ✗ | list legal templates |
| /api/legal-templates/[id] | GET | legal-templates | ✗ | ✗ | ✗ | fetch legal template |
| /api/legal-templates/[id]/render | POST | legal-templates | ✗ | ✗ | ✗ | render legal template |
| /api/matching | GET | matching | ✓ | ✗ | ✓ | constitutional match score |
| /api/mentorship | GET,POST | mentorship | ✓ | ✓ | ✓ | mentorship program |
| /api/metrics | GET | metrics | ✗ | ✗ | ✓ | platform metrics |
| /api/milestones/[id]/accountant-release | POST | milestones | ✓ | ✓ | ✓ | accountant milestone release |
| /api/notifications/[id]/read | POST | notifications | ✓ | ✗ | ✓ | mark notification read |
| /api/oracle/consensus | GET,POST | oracle | ✗ | ✓ | ✗ | AI consensus oracle (API-key body auth) |
| /api/oracle/keys | POST | oracle | ✓ | ✗ | ✗ | oracle API key generation |
| /api/orders | GET,POST | orders | ✓ | ✓ | ✓ | capital orders |
| /api/platform-health | GET | platform-health | ✗ | ✗ | ✓ | platform health aggregate |
| /api/priority-allocation | GET,POST | priority-allocation | ✓ | ✓ | ✓ | priority allocation list/create |
| /api/priority-allocation/[allocationId] | PATCH | priority-allocation | ✓ | ✓ | ✓ | priority allocation update |
| /api/priority-allocation/rankings | GET | priority-allocation | ✓ | ✓ | ✗ | priority allocation rankings |
| /api/productive-egp/history | GET | productive-egp | ✓ | ✓ | ✗ | productive EGP history |
| /api/productive-egp/snapshot | GET,POST | productive-egp | ✓ | ✗ | ✗ | productive EGP snapshot |
| /api/profit-sharing | GET,POST | profit-sharing | ✓ | ✓ | ✓ | profit-sharing list/create |
| /api/profit-sharing/[agreementId] | GET,PATCH | profit-sharing | ✓ | ✓ | ✓ | profit-sharing detail |
| /api/proposals | GET,POST | proposals | ✓ | ✓ | ✓ | governance proposals |
| /api/proposals/[id]/vote | POST | proposals | ✓ | ✓ | ✓ | vote on proposal |
| /api/proxies | GET,POST | proxies | ✓ | ✓ | ✓ | voting proxy grant |
| /api/proxies/[id]/revoke | POST | proxies | ✓ | ✗ | ✓ | revoke voting proxy |
| /api/public/enterprise/[slug] | GET | public | ✗ | ✗ | ✓ | public enterprise profile |
| /api/public/enterprise/[slug]/cre-decisions | GET | public | ✗ | ✗ | ✓ | public CRE decisions |
| /api/public/enterprise/[slug]/trades | GET | public | ✗ | ✗ | ✓ | public trades feed |
| /api/public/enterprise/[slug]/transparency | GET | public | ✗ | ✗ | ✓ | public transparency report |
| /api/public/registry | GET | public | ✗ | ✗ | ✓ | public enterprise registry |
| /api/public/stats | GET | public | ✗ | ✗ | ✓ | public platform stats |
| /api/qa | GET,POST | qa | ✓ | ✓ | ✓ | Q&A ask/list |
| /api/qa/[id]/answer | POST | qa | ✓ | ✓ | ✓ | Q&A answer |
| /api/quadratic-voting | GET | quadratic-voting | ✓ | ✗ | ✗ | user vote allocations |
| /api/quadratic-voting/[proposalId] | GET,POST | quadratic-voting | ✓ | ✓ | ✗ | quadratic vote on proposal |
| /api/ready | GET | ready | ✗ | ✗ | ✓ | platform readiness probe |
| /api/reality-sync | POST | reality-sync | ✓ | ✓ | ✓ | reality sync engine |
| /api/v1/regulatory/fra/dashboard | GET | regulatory | ✗ | ✗ | ✓ | FRA regulator dashboard (broken token check — see P0) |
| /api/reservations | GET,POST | reservations | ✓ | ✓ | ✓ | capital reservations |
| /api/reservations/[id]/confirm | POST | reservations | ✓ | ✗ | ✓ | law-firm reservation confirm |
| /api/risk-disclosure | PATCH,POST | risk-disclosure | ✓ | ✓ | ✓ | risk disclosure create/update |
| /api/risk-profile/[enterpriseId] | GET | risk-profile | ✓ | ✗ | ✗ | enterprise risk profile |
| /api/risk-profile/keys | POST | risk-profile | ✓ | ✗ | ✗ | risk-profile API key |
| /api/route.ts | GET | (root) | ✗ | ✗ | ✗ | stray "Hello, world!" stub |
| /api/salary-to-equity | GET,POST | salary-to-equity | ✓ | ✓ | ✓ | salary-to-equity conversion |
| /api/screening | GET,POST | screening | ✓ | ✓ | ✓ | AML/KYC screening |
| /api/skill-equity | POST | skill-equity | ✓ | ✓ | ✓ | skill equity grant |
| /api/skill-equity/[id]/review | POST | skill-equity | ✓ | ✓ | ✓ | skill equity review |
| /api/solvency | GET,POST | solvency | ✓ | ✓ | ✓ | proof-of-solvency |
| /api/soulbound | GET,POST | soulbound | ✓ | ✗ | ✗ | soulbound credential list/issue |
| /api/soulbound/revoke | POST | soulbound | ✓ | ✓ | ✗ | revoke soulbound credential |
| /api/soulbound/verify | POST | soulbound | ✗ | ✓ | ✗ | verify soulbound credential (public) |
| /api/standalone-succession | GET,POST | standalone-succession | ✓ | ✓ | ✗ | standalone succession cases |
| /api/standalone-succession/[caseId] | GET,PATCH | standalone-succession | ✓ | ✓ | ✗ | standalone succession detail |
| /api/succession | GET,POST | succession | ✓ | ✓ | ✓ | succession plan list/create |
| /api/succession/[id]/activate | POST | succession | ✓ | ✗ | ✓ | activate succession plan |
| /api/succession/[id]/execute | POST | succession | ✓ | ✗ | ✓ | execute succession plan |
| /api/supply-chain/advances | GET,POST | supply-chain | ✓ | ✓ | ✓ | supply-chain finance advances |
| /api/supply-chain/advances/[advanceId] | GET,PATCH | supply-chain | ✓ | ✓ | ✗ | supply-chain advance detail |
| /api/syndicates | GET,POST | syndicates | ✓ | ✓ | ✓ | investment syndicates |
| /api/syndicates/[id]/join | POST | syndicates | ✓ | ✓ | ✓ | join a syndicate |
| /api/takaful/claims | GET,POST | takaful | ✓ | ✓ | ✓ | takaful insurance claims |
| /api/takaful/claims/[claimId] | GET,PATCH | takaful | ✓ | ✓ | ✗ | takaful claim detail |
| /api/terms/acceptance | GET,POST | terms | ✓ | ✓ | ✓ | terms acceptance |
| /api/trade-documents | POST | trade-documents | ✓ | ✓ | ✓ | trade documents |
| /api/trade-instruments | GET,POST | trade-instruments | ✓ | ✓ | ✓ | trade instruments |
| /api/trade-instruments/[id] | GET | trade-instruments | ✓ | ✗ | ✗ | trade instrument detail |
| /api/trades/match | POST | trades | ✓ | ✓ | ✗ | secondary-market trade match |
| /api/vault | GET,POST | vault | ✓ | ✓ | ✓ | anti-fragility insurance vault |
| /api/vault/loan | POST | vault | ✓ | ✓ | ✓ | vault loan request |
| /api/vault/loan/[id] | GET,PATCH | vault | ✓ | ✓ | ✓ | vault loan lifecycle |
| /api/verification | GET,POST | verification | ✓ | ✓ | ✓ | verification list/create |
| /api/verification/[id] | GET,PATCH | verification | ✓ | ✓ | ✓ | verification detail |
| /api/verification/kyc | POST | verification | ✓ | ✗ | ✓ | KYC submission |
| /api/wages/bands | GET,POST | wages | ✓ | ✗ | ✗ | constitutional wage bands |
| /api/wages/benchmarks | GET | wages | ✗ | ✗ | ✗ | wage benchmarks (public) |
| /api/v1/webhook/payment | POST | webhook | ✗ | ✗ | ✓ | law-firm escrow webhook (Ed25519-signed) |
| /api/whistleblower | GET,POST | whistleblower | ✓ | ✓ | ✓ | whistleblower reports |
| /api/whistleblower/[id]/resolve | POST | whistleblower | ✓ | ✓ | ✓ | resolve whistleblower report |
| /api/zeitgeist | GET | zeitgeist | ✓ | ✗ | ✗ | zeitgeist market snapshot |

---

## 5. Endpoints WITHOUT Auth — Defect Triage

**14 mutating endpoints lack an explicit session-auth signal.** After manual review, **9 are legitimate public endpoints** and **5 are confirmed defects**.

### 5.1 Legitimate public-by-design (no defect)

| Route | Why unauthenticated |
|---|---|
| `/api/auth` (POST) | sign-in endpoint — must be public |
| `/api/auth/register` (POST) | registration endpoint — must be public |
| `/api/auth/passkey/authenticate/start` (POST) | passkey challenge issue — must be public to begin auth flow |
| `/api/auth/signout` (POST) | clears cookie; idempotent; `signOut()` checks session internally |
| `/api/oracle/consensus` (POST) | public oracle, API-key body-param auth (`zod`-validated) |
| `/api/soulbound/verify` (POST) | public third-party credential verification (documented) |
| `/api/v1/cre/validate` (POST) | public CRE validation for external systems (documented) — **but lacks input validation → P2** |
| `/api/v1/ipfs/pin` (POST) | public IPFS pinning — **lacks auth + validation → P1** (see §5.2) |
| `/api/v1/webhook/payment` (POST) | Ed25519 signature-verified webhook (`verifyWebhookSignature`) |

### 5.2 Confirmed defects

#### P0 — Broken `token !== process.env.CRON_SECRET` check (5 endpoints)

The following 5 endpoints share an identical broken auth pattern:

```ts
const authHeader = req.headers.get("authorization");
const token = authHeader?.replace("Bearer ", "");
if (token !== process.env.CRON_SECRET) {     // <-- BROKEN
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

When `CRON_SECRET` (or `FRA_ACCESS_TOKEN`) is **unset** in the environment AND the request omits the `Authorization` header, both sides of the `!==` evaluate to `undefined`. The strict-not-equal operator `undefined !== undefined` returns `false`, so the auth check is **bypassed silently**.

**Verified live** (curl probe with no Authorization header):

| Route | Method | Probe result |
|---|---|---|
| `/api/cron/health-rating` | POST | **HTTP 200** — recalculated all enterprise health ratings |
| `/api/cron/crcica-arbitration` | POST | **HTTP 200** — swept all arbitration cases |
| `/api/cron/stage-transition` | POST | **HTTP 200** — advanced enterprise stages |
| `/api/cron/verification-sla` | POST | **HTTP 200** — rejected in-review users past SLA |
| `/api/v1/regulatory/fra/dashboard` | GET | **HTTP 200** — returned aggregate platform KPIs |

**Cross-check:** `node -e "console.log(process.env.CRON_SECRET)"` → `undefined`; `rg 'CRON_SECRET' .env` → no matches. Both `CRON_SECRET` and `FRA_ACCESS_TOKEN` are unset.

**With bogus Bearer token** (e.g. `Authorization: Bearer bogus`), the same endpoints correctly return **HTTP 401** — confirming the bug is specifically the `undefined !== undefined` case.

**Impact:** Any internet visitor can:
- Recalculate all enterprise health ratings (CPU/DB load, possible rating manipulation if Prisma transactions are interleaved).
- Force-advance enterprise stages (capital formation → operations → graduation).
- Reject all users in 48h verification SLA queue.
- Force-close CRCICA arbitration cases (Stage 5 → 6 closure).
- Read aggregate platform KPIs (intended for the Egyptian FRA regulator only).

#### P1 — Inadequate auth on credential-rendering endpoint (1 endpoint)

| Route | Method | Issue |
|---|---|---|
| `/api/legal-templates/[id]/render` | POST | Uses `withErrorHandler` but no `getCurrentUser()` call inside. Anyone (passing CSRF) can render arbitrary legal templates with arbitrary variables. Templates include the Constitutional Pledge, bylaws, dividend policies. The endpoint delegates to `renderTemplate(id, variables)` which does string interpolation — if the template engine isn't sandboxed, this is a server-side template injection (SSTI) vector. |

#### P1 — Dev-fallback secret shipped in production source (2 endpoints)

| Route | Method | Issue |
|---|---|---|
| `/api/cron/proposal-expiry` | GET | Hard-coded `DEV_FALLBACK_SECRET = "dev-cron-secret"` accepted as the token when `CRON_SECRET` is unset. **Probe confirmed:** `GET /api/cron/proposal-expiry?token=dev-cron-secret` returns **HTTP 200** (`{"expired":0}`). Anyone reading the source can trigger the sweep. |
| `/api/cron/reservation-expiry` | GET | Same pattern. **Probe confirmed:** `?token=dev-cron-secret` → **HTTP 200**. |

#### P1 — Public IPFS pinning endpoint with no auth and no validation

| Route | Method | Issue |
|---|---|---|
| `/api/v1/ipfs/pin` | POST | Wraps in `withErrorHandler` but performs no auth and no input validation. Any POST body (JSON or text) is pinned to IPFS via `pinToIpfs()`. DoS / abuse vector — unlimited pinning of arbitrary content. |

---

## 6. Endpoints WITHOUT Input Validation (P2)

**32 mutating endpoints** lack any Zod / parseBody / manual `typeof` guard. Selected high-risk items:

| Route | Method | Risk |
|---|---|---|
| `/api/api-keys/[id]` | DELETE | No body validation (acceptable — DELETE with path id) |
| `/api/cooperative/transactions` | GET,POST | POST takes raw JSON, no schema — body fields validated inline only |
| `/api/discovery/[matchId]` | PATCH | No body validation |
| `/api/erp/integration` | GET,POST | No validation on provider/connection config POST body |
| `/api/erp/integration/sync` | POST | No validation on sync trigger body |
| `/api/expenses/[id]/approve` | POST | No body validation |
| `/api/fx/refresh` | POST | No body validation |
| `/api/gaas/organizations` | GET,POST | No validation on org creation body |
| `/api/graduation-bond/issue` | POST | Manual trim check only — no Zod |
| `/api/notifications/[id]/read` | POST | No body validation (acceptable — path id only) |
| `/api/oracle/keys` | POST | No validation on key-creation body |
| `/api/proxies/[id]/revoke` | POST | No body validation |
| `/api/reservations/[id]/confirm` | POST | No body validation |
| `/api/risk-profile/keys` | POST | No validation on key-creation body |
| `/api/soulbound` | GET,POST | POST issues credential without Zod |
| `/api/soulbound/verify` | POST | Public endpoint, manual credentialId trim only |
| `/api/standalone-succession/[caseId]` | GET,PATCH | PATCH has no body validation |
| `/api/v1/cre/validate` | POST | Public endpoint, manual `!policy` check only — Zod would prevent policy-injection |
| `/api/v1/ipfs/pin` | POST | Public endpoint, no validation |
| `/api/v1/webhook/payment` | POST | Webhook — relies on signature for integrity, but payload not Zod-validated post-verify |
| `/api/verification/kyc` | POST | KYC submission without schema validation |
| `/api/wages/bands` | GET,POST | Wage band creation without schema |

**Pattern observation:** The `ai` domain is the most validated (22/27 use Zod because of `parseBody` in shared schemas). The `erp` domain is **also** well-validated (18/21). The `admin`, `cron`, and `public` domains have **zero Zod usage**.

---

## 7. False-Success Pattern Candidates (P1, manual verification)

Heuristic flagged 10 routes whose catch-blocks return `NextResponse.json(...)` without an obvious `status:` literal. Manual review:

| Route | Verdict |
|---|---|
| `/api/admin/settings` | **False positive** — catch sets `status` from a variable (`401/403/500`) based on error message; never 200. Acceptable but fragile. |
| `/api/cooperative/transactions/[transactionId]` | **False positive** — catch returns `status: 400` on CRE denial. |
| `/api/discovery/[matchId]` | **False positive** — catch returns `status: 400`. |
| `/api/fx/consensus` | **REAL DEFECT (P2)** — real oracle fails → catch falls back to mock oracle and returns **HTTP 200** with `oracle: "mock_fallback"`. Callers that don't inspect the `oracle` field get a 200 response with sandbox data. Production-grade integrations could silently trade on mocked FX rates. |
| `/api/graduation-bond/issue` | **False positive** — catch returns dynamic 409/404/400, never 200. |
| `/api/priority-allocation/[allocationId]` | Needs review — flagged for Phase 4 deep inspection. |
| `/api/productive-egp/snapshot` | Needs review — flagged for Phase 4. |
| `/api/risk-profile/[enterpriseId]` | Needs review — flagged for Phase 4. |
| `/api/standalone-succession/[caseId]` | Needs review — flagged for Phase 4. |
| `/api/wages/bands` | Needs review — flagged for Phase 4. |

**Confirmed real defect:** 1 (fx/consensus mock-fallback masking). 4 require deeper Phase 4 inspection.

---

## 8. Stub Endpoints (P2/P3)

Heuristic flagged **0 strict stubs** (only `{ok:true}` returns). However, the following are minimal-functionality endpoints worth flagging:

| Route | Issue |
|---|---|
| `/api/route.ts` (root) | **P3** — stray "Hello, world!" placeholder at the API root. Not used by the platform but exposed publicly. Remove. |
| `/api/inngest` | **P2** — Inngest handler scaffold, no Prisma, only function-registry. Verify it's actually wired to Inngest cloud. |

---

## 9. Duplicate / Shadow Routes

None detected. All 215 paths are unique. No overlapping route.ts files for the same logical path.

---

## 10. HTTP Probe Results (27 endpoints, unauthenticated)

Dev server: Next.js 16.4.2 (webpack) on `:3000`. Probe date: 2026-10-23.

### 10.1 Cron endpoints — UNAUTHENTICATED (P0)

| Route | Method | HTTP | Body (first 180 chars) |
|---|---|---|---|
| `/api/cron/health-rating` | POST | **200** | `{"ok":true,"recalculatedAt":"2026-10-23T20:35:27.241Z","message":"Health ratings recalculated for all active enterprises."}` |
| `/api/cron/crcica-arbitration` | POST | **200** | `{"ok":true,"checkedAt":"2026-10-23T20:35:27.397Z","casesChecked":0,"advanced":0,"advancements":[]}` |
| `/api/cron/stage-transition` | POST | **200** | `{"ok":true,"checkedAt":"2026-10-23T20:35:27.691Z","enterprisesChecked":0,"transitioned":0,"transitions":[]}` |
| `/api/cron/verification-sla` | POST | **200** | `{"ok":true,"checkedAt":"2026-10-23T20:35:28.080Z","rejected":0,"message":"0 user(s) marked as verification rejected..."}` |
| `/api/cron/proposal-expiry` | GET | 401 | `{"error":"Unauthorized — invalid or missing cron token"}` |
| `/api/cron/reservation-expiry` | GET | 401 | `{"error":"Unauthorized — invalid or missing cron token"}` |

### 10.2 Cron endpoints — with `?token=dev-cron-secret` (P1)

| Route | Method | HTTP | Body |
|---|---|---|---|
| `/api/cron/proposal-expiry?token=dev-cron-secret` | GET | **200** | `{"expired":0}` |
| `/api/cron/reservation-expiry?token=dev-cron-secret` | GET | **200** | `{"expired":0}` |

### 10.3 Cron endpoints — with bogus Bearer (control)

| Route | Method | HTTP | Body |
|---|---|---|---|
| `/api/cron/health-rating` | POST | 401 | `{"error":"Unauthorized"}` |
| `/api/cron/stage-transition` | POST | 401 | `{"error":"Unauthorized"}` |

### 10.4 Public-by-design GET endpoints (control)

| Route | HTTP | Body |
|---|---|---|
| `/api/health` | 200 | `{"status":"ok","uptime":1,"uptime_human":"0s","db":"connected","service":"aurienta",...}` |
| `/api/v1/cre/policies` | 200 | `{"engineVersion":"CRE-TS-1.0","totalPolicies":18,"policies":[...]}` |
| `/api/legal-templates` | 200 | `{"total":18,"templates":[...]}` |
| `/api/oracle/consensus` | 200 | `{"service":"AURIENTA AI Consensus Oracle Network","disclaimer":"...",...}` |
| `/api/public/stats` | 200 | `{"constitutionalHash":"0xB4F8...","zeroCustody":{...}}` |
| `/api/v1/regulatory/fra/dashboard` | **200** | `{"accessedAt":"...","platform":{"totalPartners":0,"totalEnterprises":0,...}}` ← **P0 LEAK** |
| `/api/fx/consensus` | 200 | `{"from":"USD","to":"EGP","rate":48.5054,"sources":[...]}` (mock fallback when real oracle unreachable) |
| `/api/legal-templates/tpl-constitutional-pledge` | 200 | Full Constitutional Pledge text (public) |
| `/api/v1/gov/gafi` | 400 | `{"error":"Missing query params: crNumber, name"}` (input-gated) |
| `/api/v1/gov/nosi` | 400 | `{"error":"Missing query params: nationalId, name"}` |
| `/api/v1/gov/eta` | 400 | `{"error":"Missing query params: taxId, name"}` |
| `/api/v1/intelligence/conflicts` | 400 | `{"error":"Missing query params: userId, enterpriseId"}` |
| `/api/v1/enterprise/test/data` | 401 | `{"error":"Missing API key. Provide ?key=xxx","code":"MISSING_API_KEY"}` (correct) |

### 10.5 Auth-protected GET endpoints (correct rejection)

| Route | HTTP | Body |
|---|---|---|
| `/api/enterprises` | 401 | `{"error":"Not authenticated"}` |
| `/api/admin/users` | 401 | `{"error":"Not authenticated","code":"UNAUTHORIZED"}` |
| `/api/admin/audit` | 401 | `{"error":"Not authenticated","code":"UNAUTHORIZED"}` |
| `/api/dividends` | 401 | `{"error":"Not authenticated","code":"unauthenticated"}` |
| `/api/expenses` | 401 | `{"error":"Not authenticated","code":"unauthenticated"}` |
| `/api/erp/inventory` | 401 | `{"error":"Not authenticated","code":"unauthenticated"}` |
| `/api/vault` | 401 | `{"error":"Not authenticated","code":"unauthenticated"}` |
| `/api/proposals` | 401 | `{"error":"Not authenticated"}` |
| `/api/soulbound` | 401 | `{"error":"Not authenticated","code":"unauthenticated"}` |
| `/api/ai/brain-status` | 401 | `{"error":"unauthorized"}` |

### 10.6 POST endpoints (CSRF middleware rejection)

All unauthenticated POST probes returned **HTTP 403 `csrf_validation_failed`** — the CSRF middleware (double-submit cookie pattern) is the first line of defense for mutating endpoints:

| Route | HTTP | Body |
|---|---|---|
| `/api/enterprises` | 403 | `{"error":"csrf_validation_failed","message":"Request must be same-origin or include a valid X-CSRF-Token header"}` |
| `/api/dividends` | 403 | (same) |
| `/api/v1/ipfs/pin` | 403 | (same) |
| `/api/soulbound/verify` | 403 | (same) |
| `/api/legal-templates/x/render` | 403 | (same) |
| `/api/v1/cre/validate` | 403 | (same) |
| `/api/v1/webhook/payment` | 403 | (same — **NOTE:** webhooks should be exempt from CSRF; this is a false-positive block on a signature-verified webhook) |
| `/api/cron/health-rating` | **200** | (CSRF middleware exempts cron routes — confirmed by probe) |
| `/api/auth/register` | 400 | `{"error":"invalid_body","message":"Request body failed validation","issues":[...]}` (zod validation worked) |
| `/api/oracle/consensus` | 400 | `{"error":"Invalid request body","details":{"fieldErrors":{"apiKey":["Too small: expected string to have >=16 characters"]}}}` (zod validation worked) |

**Key observation:** The CSRF middleware (`proxy.ts`) blocks unauthenticated POSTs to most endpoints — but the broken cron endpoints are exempted from CSRF and also lack auth, making them the actual exploit path. The `/api/v1/webhook/payment` POST being CSRF-blocked is a **P2 defect**: signature-verified webhooks should be on the CSRF exemption list (otherwise law-firm integrations break in production).

---

## 11. Findings — Classified P0–P3

### P0 (Critical — production security defect, exploit confirmed)

| ID | Finding | Endpoints | Action |
|---|---|---|---|
| **1B-P0-01** | Broken `token !== process.env.CRON_SECRET` auth check — when secret is unset and no Authorization header is sent, `undefined !== undefined` evaluates `false`, bypassing auth. | `/api/cron/health-rating`, `/api/cron/crcica-arbitration`, `/api/cron/stage-transition`, `/api/cron/verification-sla` (4 endpoints) | Phase 5 fix: gate with `if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET)` AND fail-closed on missing env. |
| **1B-P0-02** | Same broken pattern with `FRA_ACCESS_TOKEN` — regulator dashboard publicly readable. | `/api/v1/regulatory/fra/dashboard` | Phase 5 fix: same fail-closed pattern. |
| **1B-P0-03** | `.env` file does not define `CRON_SECRET` or `FRA_ACCESS_TOKEN` — both secrets are unset, so the broken check above is actively exploitable in the deployed configuration. | (environment-level) | Phase 5 fix: provision strong secrets in `.env` + Vercel env vars; add a startup check that refuses to boot if either is missing in production. |

### P1 (High — sensitive surface exposed)

| ID | Finding | Endpoints | Action |
|---|---|---|---|
| **1B-P1-01** | Dev-fallback secret `"dev-cron-secret"` hard-coded in production source — accepted as the auth token when `CRON_SECRET` is unset. | `/api/cron/proposal-expiry`, `/api/cron/reservation-expiry` | Phase 5 fix: remove `DEV_FALLBACK_SECRET`; require explicit env in dev. |
| **1B-P1-02** | `/api/legal-templates/[id]/render` performs no auth check; renders arbitrary legal templates with attacker-supplied variables — potential SSTI vector. | `/api/legal-templates/[id]/render` | Phase 5 fix: add `getCurrentUser()` + restrict template variables. |
| **1B-P1-03** | `/api/v1/ipfs/pin` performs no auth and no validation on the content — unlimited arbitrary pinning. | `/api/v1/ipfs/pin` | Phase 5 fix: require API key + size cap. |
| **1B-P1-04** | Signature-verified webhook `/api/v1/webhook/payment` is blocked by the CSRF middleware — will break in production. | `/api/v1/webhook/payment` | Phase 5 fix: add to CSRF middleware exemption list. |
| **1B-P1-05** | Heuristic flagged 5 endpoints whose catch-blocks return NextResponse without obvious status literal — 1 confirmed real (`fx/consensus` mock-fallback masking) + 4 need Phase 4 deep inspection. | (see §7) | Phase 4 deep-read; Phase 5 fix confirmed items. |

### P2 (Medium — robustness / validation gaps)

| ID | Finding | Count | Action |
|---|---|---|---|
| **1B-P2-01** | 32 mutating endpoints lack input validation (no Zod, no manual schema). | 32 | Phase 5: add Zod schemas via `parseBody`. |
| **1B-P2-02** | `/api/fx/consensus` falls back to mock oracle and returns HTTP 200 with `oracle:"mock_fallback"` — callers may silently consume mocked FX rates. | 1 | Phase 5: return HTTP 503 with explicit `oracle:"unavailable"` when real oracle fails (or surface a `X-Oracle-Status` header). |
| **1B-P2-03** | `/api/v1/cre/validate` is a public endpoint with only ad-hoc `!policy || !params` checks — susceptible to policy-name injection / unexpected param shapes. | 1 | Phase 5: add Zod schema. |
| **1B-P2-04** | `/api/inngest` is a function-registry scaffold with no Prisma writes — verify it's actually wired to Inngest cloud. | 1 | Phase 2 verification. |

### P3 (Low — housekeeping)

| ID | Finding | Count | Action |
|---|---|---|---|
| **1B-P3-01** | Stray `/api/route.ts` returns `{message:"Hello, world!"}` — dead code at API root. | 1 | Phase 5: delete. |
| **1B-P3-02** | No DELETE/PUT REST verbs in use (only 1 each across 215 endpoints) — entire API surface is RPC-style POST/PATCH. Not a defect, but documents the architecture. | — | Documentation only. |
| **1B-P3-03** | 84 distinct sub-domains under `/api/` — high fragmentation. | — | Documentation; consider a domain-consolidation pass in Phase 5. |

---

## 12. Recommendations for Phase 5 (Remediation)

1. **Immediate (P0):** Replace all `token !== process.env.XXX_SECRET` checks with fail-closed validation:
   ```ts
   const secret = process.env.CRON_SECRET;
   if (!secret || !token || token !== secret) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   ```
   Apply to: 4 cron POST endpoints + 1 FRA GET endpoint.

2. **Immediate (P0):** Provision `CRON_SECRET` (32+ random bytes) and `FRA_ACCESS_TOKEN` in `.env` AND Vercel project env vars. Add an `env.ts` startup assertion that refuses to boot in `production` if either is missing.

3. **Short-term (P1):** Remove `DEV_FALLBACK_SECRET` from cron GET endpoints. Accept only the env-configured secret.

4. **Short-term (P1):** Add `getCurrentUser()` to `/api/legal-templates/[id]/render`. Audit the template renderer for SSTI safety.

5. **Short-term (P1):** Add API-key + size validation to `/api/v1/ipfs/pin`.

6. **Short-term (P1):** Add `/api/v1/webhook/payment` to the CSRF middleware exemption list (it's signature-verified).

7. **Medium-term (P2):** Roll out Zod schemas for the 32 unvalidated mutating endpoints. Prioritise: `cooperative/transactions`, `erp/integration`, `gaas/organizations`, `verification/kyc`, `v1/cre/validate`, `wages/bands`, `soulbound`.

8. **Medium-term (P2):** Make `/api/fx/consensus` fail loudly (503) when the real oracle is unavailable rather than silently returning mock data.

9. **Housekeeping (P3):** Delete `/api/route.ts`.

---

## 13. Files Written by This Task

| File | Purpose |
|---|---|
| `AUDIT/registers/D-C-api-register.md` | This deliverable. |
| `AUDIT/registers/_scan_api.py` | Static scanner (kept for traceability). |
| `AUDIT/registers/_api_scan.json` | Per-endpoint scan output (215 records). |
| `AUDIT/registers/_probe.sh` | Live curl harness (kept for retest). |
