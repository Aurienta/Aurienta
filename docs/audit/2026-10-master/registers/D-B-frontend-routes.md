# D-B — Frontend Routes Inventory & Inspection Register

**Mandate:** PLATFORM-FULL-AUDIT-AND-REMEDIATION-001
**Phase:** 1-A (routes inventory & inspection)
**Agent:** routes-inventory
**Date:** 2026-10-23
**Scope:** Next.js 16 App Router pages under `src/app/**/page.tsx`
**Mode:** Inspect-only (no code modifications)

---

## 1. Inventory Summary

| Metric | Count |
|---|---|
| Total `page.tsx` files in `src/app` | **135** |
| Dashboard pages (`src/app/dashboard/**`) | **118** |
| Public pages (non-dashboard) | **17** |
| Dynamic segment pages (`[slug]` / `[id]`) | **5** (`/badge/[slug]`, `/enterprise/[slug]`, `/enterprise/[slug]/{annual-report,financials,governance-log,trades}`, `/dashboard/admin/enterprises/[id]`, `/dashboard/admin/users/[id]`) |
| Pages using `export const dynamic = "force-dynamic"` | **126 / 135** (93%) |
| Pages with `"use client"` directive at top of file | **0** (all routes are Server Components; client interactivity lives in imported `*-client.tsx` components) |
| Dashboard pages calling `getCurrentUser()` directly | **117 / 118** (the 1 exception is `/dashboard/alumni`, see §6) |
| Nav items in `src/lib/aurienta/nav-config.ts` (`NAV` array) | **111** (plus 4 sub-groups under "Platform Admin") |
| `error.tsx` siblings in `src/app` | 98 |
| `loading.tsx` siblings in `src/app` | 99 |
| Root-level error boundaries (`error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx`) | 4 ✅ |

---

## 2. Auth & Middleware Architecture (observed)

### 2.1 `src/middleware.ts`
- **File path:** `src/middleware.ts` (Next.js middleware convention — note Next.js 16 prefers `src/proxy.ts`, see Finding P3-1).
- **Match scope:** all routes except static assets, `/api/auth/*`, `/api/cron/*`, `/api/oracle/consensus`.
- **Behavior:** sets CSRF cookie, security headers (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cache-Control: no-store`), and the `x-pathname` response header (used by the dashboard layout's MFA gate).
- **CSRF enforcement:** state-changing requests (POST/PATCH/PUT/DELETE) from cross-origin require a valid `X-CSRF-Token` header matching the `aurienta_csrf` cookie. Same-origin (via `Origin` or `Referer` host match) is allowed.
- **Authentication:** middleware does **not** enforce authentication — it is delegated to per-route / per-layout Server Components.

### 2.2 `src/app/dashboard/layout.tsx` (auth gate)
- Calls `getCurrentUser()` (cached via React `cache()`).
- If `null` → `redirect(\`/signin?next=\${encodeURIComponent(pathname)}\`)` where `pathname` comes from the `x-pathname` header.
- **MFA hard gate:** if `user.mfaEnabled === true && !user.mfaVerifiedAt` (and not already on `/dashboard/passkeys`) → `redirect("/dashboard/passkeys")`.
- **MFA soft banner:** for privileged roles (`manager`, `founding_operator`, `board_member`, `law_firm_rep`, `accounting_firm_rep`, `aurienta_rep`) without MFA enrolled → displays destructive `<Alert>` banner with link to `/dashboard/passkeys` (does NOT hard-block — see Finding P2-4).

### 2.3 Per-page auth enforcement
- All 117 dashboard pages (except `/dashboard/alumni`) call `getCurrentUser()` and `redirect("/signin?next=...")` if no user — defense-in-depth on top of the layout gate.
- Public pages (`/`, `/legal/*`, `/signin`, `/register`, `/trust`, `/registry`, `/enterprise`, `/enterprise/[slug]/*`, `/badge/[slug]`) do **not** call `getCurrentUser()` (correct — these are intentionally public).

---

## 3. Full Routes Table

### 3.1 Public routes (17)

| Route | File | Auth | Dynamic | Client/Server | Purpose |
|---|---|---|---|---|---|
| `/` | `src/app/page.tsx` | ❌ | ❌ | Server | Landing page (marketing hero, platform modules, tier system, process lifecycle) |
| `/legal` | `src/app/legal/page.tsx` | ❌ | ❌ | Server | Legal hub (links to constitution/privacy/terms/cookies) |
| `/legal/constitution` | `src/app/legal/constitution/page.tsx` | ❌ | ❌ | Server | Constitutional document viewer |
| `/legal/cookies` | `src/app/legal/cookies/page.tsx` | ❌ | ❌ | Server | Cookie policy |
| `/legal/privacy` | `src/app/legal/privacy/page.tsx` | ❌ | ❌ | Server | Privacy policy |
| `/legal/terms` | `src/app/legal/terms/page.tsx` | ❌ | ❌ | Server | Terms of service |
| `/signin` | `src/app/signin/page.tsx` | ❌ | ❌ | Server | Sign-in form (sets `aurienta_session` cookie via `/api/auth/*`) |
| `/register` | `src/app/register/page.tsx` | ❌ | ❌ | Server | Registration form |
| `/trust` | `src/app/trust/page.tsx` | ❌ | ❌ | Server | Public trust/transparency overview |
| `/registry` | `src/app/registry/page.tsx` | ❌ | ❌ | Server | Public enterprise registry directory |
| `/enterprise` | `src/app/enterprise/page.tsx` | ❌ | ❌ | Server | Public enterprise directory (list) |
| `/enterprise/[slug]` | `src/app/enterprise/[slug]/page.tsx` | ❌ | ✅ `[slug]` | Server | Public enterprise profile (single) |
| `/enterprise/[slug]/annual-report` | `src/app/enterprise/[slug]/annual-report/page.tsx` | ❌ | ✅ `[slug]` | Server | Public enterprise annual report |
| `/enterprise/[slug]/financials` | `src/app/enterprise/[slug]/financials/page.tsx` | ❌ | ✅ `[slug]` | Server | Public enterprise financials |
| `/enterprise/[slug]/governance-log` | `src/app/enterprise/[slug]/governance-log/page.tsx` | ❌ | ✅ `[slug]` | Server | Public governance log |
| `/enterprise/[slug]/trades` | `src/app/enterprise/[slug]/trades/page.tsx` | ❌ | ✅ `[slug]` | Server | Public trade history |
| `/badge/[slug]` | `src/app/badge/[slug]/page.tsx` | ❌ | ✅ `[slug]` | Server | Public enterprise badge/credential |

### 3.2 Dashboard routes (118) — grouped by nav group

> Auth = ✅ for all (layout gate + page-level `getCurrentUser()` check), except `/dashboard/alumni` (see §6).

| Route | File (relative to `src/app`) | Nav group | Purpose |
|---|---|---|---|
| `/dashboard` | `dashboard/page.tsx` | My Workspace | Overview hero, quick actions, task list, starter banner |
| `/dashboard/profile` | `dashboard/profile/page.tsx` | My Workspace | Profile & identity |
| `/dashboard/passkeys` | `dashboard/passkeys/page.tsx` | My Workspace | Passkey enrollment / MFA verification (exempt from MFA redirect) |
| `/dashboard/calendar` | `dashboard/calendar/page.tsx` | My Workspace | Constitutional calendar |
| `/dashboard/updates` | `dashboard/updates/page.tsx` | My Workspace | Enterprise updates feed |
| `/dashboard/notifications` | `dashboard/notifications/page.tsx` | My Workspace | User notifications |
| `/dashboard/portfolio` | `dashboard/portfolio/page.tsx` | Capital | Constitutional holdings (609 lines — largest dashboard page) |
| `/dashboard/opportunities` | `dashboard/opportunities/page.tsx` | Capital | Capital participation opportunities |
| `/dashboard/market` | `dashboard/market/page.tsx` | Capital | Enterprise registry (market view) |
| `/dashboard/priority-windows` | `dashboard/priority-windows/page.tsx` | Capital | Priority windows |
| `/dashboard/enterprise-discovery` | `dashboard/enterprise-discovery/page.tsx` | Capital | Enterprise discovery / search |
| `/dashboard/profit-sharing` | `dashboard/profit-sharing/page.tsx` | Capital | Profit-sharing agreements |
| `/dashboard/dividends` | `dashboard/dividends/page.tsx` | Capital | Dividend distributions |
| `/dashboard/productive-egp` | `dashboard/productive-egp/page.tsx` | Capital | Productive EGP instruments |
| `/dashboard/priority-allocation` | `dashboard/priority-allocation/page.tsx` | Capital | STS priority allocation |
| `/dashboard/soulbound` | `dashboard/soulbound/page.tsx` | Capital | Soulbound credentials |
| `/dashboard/syndicates` | `dashboard/syndicates/page.tsx` | Capital | Capital syndicates |
| `/dashboard/career-ledger` | `dashboard/career-ledger/page.tsx` | Capital & Workforce | Career ledger |
| `/dashboard/mentorship` | `dashboard/mentorship/page.tsx` | Capital & Workforce | Mentorship program |
| `/dashboard/skill-equity` | `dashboard/skill-equity/page.tsx` | Capital & Workforce | Skill-to-equity conversion (69 lines) |
| `/dashboard/salary` | `dashboard/salary/page.tsx` | Capital & Workforce | AI salary engine |
| `/dashboard/diaspora` | `dashboard/diaspora/page.tsx` | Capital & Workforce | Diaspora bridge |
| `/dashboard/constitutional-wages` | `dashboard/constitutional-wages/page.tsx` | Capital & Workforce | Constitutional wages |
| `/dashboard/endorsements` | `dashboard/endorsements/page.tsx` | Capital & Workforce | Constitutional endorsements |
| `/dashboard/governance` | `dashboard/governance/page.tsx` | Enterprise | Governance console (228 lines) |
| `/dashboard/manager` | `dashboard/manager/page.tsx` | Enterprise | Manager console |
| `/dashboard/founder` | `dashboard/founder/page.tsx` | Enterprise | Founding operator studio |
| `/dashboard/enterprise-profile` | `dashboard/enterprise-profile/page.tsx` | Enterprise | Enterprise profile editor |
| `/dashboard/pitch-deck` | `dashboard/pitch-deck/page.tsx` | Enterprise | Pitch deck generator |
| `/dashboard/milestone-designer` | `dashboard/milestone-designer/page.tsx` | Enterprise | Milestone designer |
| `/dashboard/board-member` | `dashboard/board-member/page.tsx` | Enterprise | Board member console |
| `/dashboard/board-briefings` | `dashboard/board-briefings/page.tsx` | Enterprise | Board briefings |
| `/dashboard/succession` | `dashboard/succession/page.tsx` | Enterprise | Succession planner |
| `/dashboard/partner-crm` | `dashboard/partner-crm/page.tsx` | Enterprise | Partner CRM |
| `/dashboard/cooperative-network` | `dashboard/cooperative-network/page.tsx` | Enterprise | Cooperative network |
| `/dashboard/erp` | `dashboard/erp/page.tsx` | ERP | ERP hub (52 lines, delegates to `ErpDashboardClient`) |
| `/dashboard/erp/projects` | `dashboard/erp/projects/page.tsx` | ERP | ERP projects |
| `/dashboard/erp/tasks` | `dashboard/erp/tasks/page.tsx` | ERP | ERP tasks (WBS) |
| `/dashboard/erp/inventory` | `dashboard/erp/inventory/page.tsx` | ERP | ERP inventory |
| `/dashboard/erp/procurement` | `dashboard/erp/procurement/page.tsx` | ERP | ERP procurement |
| `/dashboard/erp/assets` | `dashboard/erp/assets/page.tsx` | ERP | ERP fixed assets |
| `/dashboard/erp/production` | `dashboard/erp/production/page.tsx` | ERP | ERP manufacturing |
| `/dashboard/erp/quality` | `dashboard/erp/quality/page.tsx` | ERP | ERP quality control |
| `/dashboard/erp/integration` | `dashboard/erp/integration/page.tsx` | ERP | ERP integration (external providers) |
| `/dashboard/brain-ai` | `dashboard/brain-ai/page.tsx` | Intelligence | Brain AI status |
| `/dashboard/copilot` | `dashboard/copilot/page.tsx` | Intelligence | AI Copilot chat (59 lines) |
| `/dashboard/precedents` | `dashboard/precedents/page.tsx` | Intelligence | Precedent engine |
| `/dashboard/drift` | `dashboard/drift/page.tsx` | Intelligence | Drift detector |
| `/dashboard/anomalies` | `dashboard/anomalies/page.tsx` | Intelligence | Anomaly narration |
| `/dashboard/charter-diff` | `dashboard/charter-diff/page.tsx` | Intelligence | Charter diff viewer |
| `/dashboard/constitution` | `dashboard/constitution/page.tsx` | Intelligence | Constitution guide |
| `/dashboard/genome` | `dashboard/genome/page.tsx` | Intelligence | Enterprise genome |
| `/dashboard/arei` | `dashboard/arei/page.tsx` | Intelligence | Real-economy index |
| `/dashboard/quadratic-voting` | `dashboard/quadratic-voting/page.tsx` | Intelligence | Quadratic voting |
| `/dashboard/zeitgeist` | `dashboard/zeitgeist/page.tsx` | Intelligence | Constitutional zeitgeist |
| `/dashboard/oracle` | `dashboard/oracle/page.tsx` | Intelligence | AI consensus oracle |
| `/dashboard/compliance` | `dashboard/compliance/page.tsx` | Compliance & Transparency | Compliance console |
| `/dashboard/workforce` | `dashboard/workforce/page.tsx` | Compliance & Transparency | Workforce registry |
| `/dashboard/whistleblower` | `dashboard/whistleblower/page.tsx` | Compliance & Transparency | Whistleblower submissions (105 lines) |
| `/dashboard/appeals` | `dashboard/appeals/page.tsx` | Compliance & Transparency | Appeal court |
| `/dashboard/risk-disclosure` | `dashboard/risk-disclosure/page.tsx` | Compliance & Transparency | Risk disclosure |
| `/dashboard/vendor-portal` | `dashboard/vendor-portal/page.tsx` | Compliance & Transparency | Vendor portal |
| `/dashboard/escrow` | `dashboard/escrow/page.tsx` | Treasury & Infrastructure | Law-firm client escrow accounts |
| `/dashboard/antifragility` | `dashboard/antifragility/page.tsx` | Treasury & Infrastructure | Anti-fragility vault |
| `/dashboard/vault` | `dashboard/vault/page.tsx` | Treasury & Infrastructure | Insurance vault (87 lines) |
| `/dashboard/solvency` | `dashboard/solvency/page.tsx` | Treasury & Infrastructure | Proof-of-solvency |
| `/dashboard/takaful-pool` | `dashboard/takaful-pool/page.tsx` | Treasury & Infrastructure | Takaful pool |
| `/dashboard/supply-chain-finance` | `dashboard/supply-chain-finance/page.tsx` | Treasury & Infrastructure | Supply chain finance |
| `/dashboard/oracle-mirror` | `dashboard/oracle-mirror/page.tsx` | Treasury & Infrastructure | Oracle mirror |
| `/dashboard/reality-sync` | `dashboard/reality-sync/page.tsx` | Treasury & Infrastructure | Reality sync |
| `/dashboard/institutional-memory` | `dashboard/institutional-memory/page.tsx` | Treasury & Infrastructure | Institutional memory |
| `/dashboard/graduation` | `dashboard/graduation/page.tsx` | Graduation & Sovereignty | Graduation process (195 lines) |
| `/dashboard/graduation-coach` | `dashboard/graduation-coach/page.tsx` | Graduation & Sovereignty | Graduation coach |
| `/dashboard/graduation-simulator` | `dashboard/graduation-simulator/page.tsx` | Graduation & Sovereignty | Graduation simulator |
| `/dashboard/survival-drill` | `dashboard/survival-drill/page.tsx` | Graduation & Sovereignty | Survival drill |
| `/dashboard/alumni` | `dashboard/alumni/page.tsx` | Graduation & Sovereignty | **Alumni Hall — see Finding P2-3** (does NOT call `getCurrentUser`, claims "intentionally public" but gated by dashboard layout) |
| `/dashboard/succession-declaration` | `dashboard/succession-declaration/page.tsx` | Graduation & Sovereignty | Succession declaration |
| `/dashboard/graduation-bond` | `dashboard/graduation-bond/page.tsx` | Graduation & Sovereignty | Graduation bond |
| `/dashboard/tax` | `dashboard/tax/page.tsx` | Institutional Services | Tax optimizer (54 lines) |
| `/dashboard/ir` | `dashboard/ir/page.tsx` | Institutional Services | Capital partner relations |
| `/dashboard/drip` | `dashboard/drip/page.tsx` | Institutional Services | DRIP (dividend reinvest) |
| `/dashboard/gaas` | `dashboard/gaas/page.tsx` | Institutional Services | Governance-as-a-Service |
| `/dashboard/standalone-succession` | `dashboard/standalone-succession/page.tsx` | Institutional Services | Standalone succession |
| `/dashboard/risk-profile` | `dashboard/risk-profile/page.tsx` | Institutional Services | Risk profile API |
| `/dashboard/admin/users` | `dashboard/admin/users/page.tsx` | Platform Admin → Users & Enterprises | Partner management (listing) |
| `/dashboard/admin/users/[id]` | `dashboard/admin/users/[id]/page.tsx` | (orphan — accessed via link) | Partner detail (dynamic) |
| `/dashboard/admin/enterprises` | `dashboard/admin/enterprises/page.tsx` | Platform Admin → Users & Enterprises | Enterprise management (listing) |
| `/dashboard/admin/enterprises/[id]` | `dashboard/admin/enterprises/[id]/page.tsx` | (orphan — accessed via link) | Enterprise detail (dynamic) |
| `/dashboard/admin/audit` | `dashboard/admin/audit/page.tsx` | Platform Admin → Users & Enterprises | Audit log viewer |
| `/dashboard/admin` | `dashboard/admin/page.tsx` | (orphan — redirect hub) | Redirects to `/dashboard/admin-panel` |
| `/dashboard/steward` | `dashboard/steward/page.tsx` | Platform Admin → Platform Operations | Steward dashboard |
| `/dashboard/architecture` | `dashboard/architecture/page.tsx` | Platform Admin → Platform Operations | Institutional architecture |
| `/dashboard/governance-model` | `dashboard/governance-model/page.tsx` | Platform Admin → Platform Operations | Governance system |
| `/dashboard/institutional-readiness` | `dashboard/institutional-readiness/page.tsx` | Platform Admin → Platform Operations | Institutional readiness |
| `/dashboard/operating-system` | `dashboard/operating-system/page.tsx` | Platform Admin → Platform Operations | Operating System (AOS) |
| `/dashboard/admin-panel` | `dashboard/admin-panel/page.tsx` | Platform Admin → Platform Operations | Platform admin panel (83 lines, 18 `db.` calls — heaviest DB consumer) |
| `/dashboard/admin/settings` | `dashboard/admin/settings/page.tsx` | Platform Admin → Platform Operations | Institutional settings |
| `/dashboard/constitutional-audit` | `dashboard/constitutional-audit/page.tsx` | Platform Admin → Platform Operations | Constitutional audit |
| `/dashboard/commercialization` | `dashboard/commercialization/page.tsx` | Platform Admin → Go-to-Market | Commercialization (ACS) |
| `/dashboard/production-readiness` | `dashboard/production-readiness/page.tsx` | Platform Admin → Go-to-Market | Production readiness |
| `/dashboard/pilot-execution` | `dashboard/pilot-execution/page.tsx` | Platform Admin → Go-to-Market | Pilot execution |
| `/dashboard/global-launch` | `dashboard/global-launch/page.tsx` | Platform Admin → Go-to-Market | Global launch (GLS) |
| `/dashboard/market-execution` | `dashboard/market-execution/page.tsx` | Platform Admin → Go-to-Market | Market execution (MES) |
| `/dashboard/market-activation` | `dashboard/market-activation/page.tsx` | Platform Admin → Go-to-Market | Market activation |
| `/dashboard/customer-conversion` | `dashboard/customer-conversion/page.tsx` | Platform Admin → Go-to-Market | Customer conversion |
| `/dashboard/strategic-partners` | `dashboard/strategic-partners/page.tsx` | Platform Admin → Go-to-Market | Strategic partners |
| `/dashboard/execution-war-room` | `dashboard/execution-war-room/page.tsx` | Platform Admin → Go-to-Market | Execution war room |
| `/dashboard/first-research` | `dashboard/first-research/page.tsx` | Platform Admin → Go-to-Market | First 25 research |
| `/dashboard/founder-office` | `dashboard/founder-office/page.tsx` | Platform Admin → Institutional | Founder Landmark (FOCC) |
| `/dashboard/institutional-trust` | `dashboard/institutional-trust/page.tsx` | Platform Admin → Institutional | Institutional Trust (ITDB) |
| `/dashboard/company-owner` | `dashboard/company-owner/page.tsx` | Platform Admin → Role Portals | Company owner portal |
| `/dashboard/law-firm` | `dashboard/law-firm/page.tsx` | Platform Admin → Role Portals | Law firm rep portal (uses gold/amber theme classes — see Finding P3-3) |
| `/dashboard/accounting` | `dashboard/accounting/page.tsx` | Platform Admin → Role Portals | Accounting firm portal |
| `/dashboard/university` | `dashboard/university/page.tsx` | Platform Admin → Role Portals | University rep console |
| `/dashboard/fra` | `dashboard/fra/page.tsx` | Platform Admin → Role Portals | FRA regulatory portal |
| `/dashboard/industry` | `dashboard/industry/page.tsx` | Platform Admin → Ecosystem | Industry modules |
| `/dashboard/federation` | `dashboard/federation/page.tsx` | Platform Admin → Ecosystem | Federation |
| `/dashboard/credentials` | `dashboard/credentials/page.tsx` | Platform Admin → Ecosystem | VC wallet |

---

## 4. Orphan Routes (page exists, no nav-config entry)

| Route | Reason / Verdict |
|---|---|
| `/dashboard/admin` | **Intentional** — redirect hub (auth-gated, redirects to `/dashboard/admin-panel`). Sub-routes (audit, enterprises, settings, users) are individually in nav. Acceptable. |
| `/dashboard/admin/enterprises/[id]` | **Acceptable** — dynamic detail page, reached via link from listing. |
| `/dashboard/admin/users/[id]` | **Acceptable** — dynamic detail page, reached via link from listing. |
| `/badge/[slug]`, `/enterprise`, `/enterprise/[slug]`, `/enterprise/[slug]/{annual-report,financials,governance-log,trades}`, `/legal`, `/legal/{constitution,cookies,privacy,terms}`, `/register`, `/registry`, `/signin`, `/trust` | **Intentional** — public pages linked from the landing header / footer (not part of dashboard nav). Acceptable. |

**Net orphan dashboard routes needing nav-config entry:** 0 (all 3 dashboard "orphans" are intentional redirect hubs or dynamic detail pages).

---

## 5. Broken Nav Links (nav-config href without matching `page.tsx`)

**None.** All 111 nav hrefs in `src/lib/aurienta/nav-config.ts` resolve to an existing `page.tsx` file.

Cross-check method: extracted `href:` values via `rg -oP 'href: "([^"]+)"'` → sorted unique → compared against normalized `page.tsx` paths (dynamic segments `[slug]`/`[id]` stripped). 100% match.

---

## 6. Sample Inspection (10 dashboard pages × checks)

| Route | Lines | `db.` calls | `fetch()` calls | Empty-state markers | `loading.tsx` sibling | `error.tsx` sibling | `force-dynamic` | JSX `return (` count | `getCurrentUser` | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| `/dashboard` (Overview) | n/a | ✅ | 0 | ✅ | ✅ | ✅ (root) | ✅ | ✅ | ✅ | OK |
| `/dashboard/portfolio` | 609 | 2 | 0 | 3 | ✅ | ❌ | ✅ | 3 | ✅ | OK — missing per-route `error.tsx` (P3-4) |
| `/dashboard/skill-equity` | 69 | 2 | 0 | 0 | ✅ | ✅ | ✅ | 1 | ✅ | OK |
| `/dashboard/governance` | 228 | 4 | 0 | 0 | ✅ | ✅ | ✅ | 1 | ✅ | OK |
| `/dashboard/erp` | 52 | 1 | 0 | 0 | ❌ | ❌ | ✅ | 1 | ✅ | OK — missing `loading.tsx` + `error.tsx` (P3-4) |
| `/dashboard/copilot` | 59 | 2 | 0 | 0 | ✅ | ✅ | ✅ | 1 | ✅ | OK |
| `/dashboard/whistleblower` | 105 | 3 | 0 | 1 | ✅ | ✅ | ✅ | 1 | ✅ | OK |
| `/dashboard/vault` | 87 | 2 | 0 | 0 | ✅ | ✅ | ✅ | 1 | ✅ | OK — but uses legacy `text-gold/10` color (P3-3) |
| `/dashboard/graduation` | 195 | 3 | 0 | 1 | ✅ | ✅ | ✅ | 1 | ✅ | OK |
| `/dashboard/tax` | 54 | 2 | 0 | 0 | ✅ | ✅ | ✅ | 1 | ✅ | OK |
| `/dashboard/admin-panel` | 83 | 18 | 0 | 0 | ✅ | ✅ | ✅ | 1 | ✅ | OK — 18 DB calls (heaviest page, may need query batching review) |

**Summary:** All 10 sampled pages are well-formed Server Components with auth gate, real Prisma DB access (no `fetch()` to internal APIs — direct `db.*` calls), and proper `force-dynamic` directive. No obvious JSX errors. Most have proper `loading.tsx` + `error.tsx` siblings. **All 10 fetch from a real DB via Prisma** (no mock/stub data). The platform is genuinely wired — not a mockup.

---

## 7. HTTP Probe Results (30 routes)

> Probe environment: Next.js 16 dev server (`next dev --webpack -p 3000`) on `http://localhost:3000`, anon `curl` (no session cookie), 30s timeout per request.

| # | Route | HTTP status | Notes |
|---|---|---|---|
| 1 | `/` | **200** | Public landing ✅ |
| 2 | `/legal` | **200** | ✅ |
| 3 | `/legal/privacy` | **200** | ✅ |
| 4 | `/legal/terms` | **200** | ✅ |
| 5 | `/legal/cookies` | **200** | ✅ |
| 6 | `/legal/constitution` | **200** | ✅ |
| 7 | `/signin` | **200** | ✅ |
| 8 | `/register` | **200** | ✅ |
| 9 | `/trust` | **200** | ✅ |
| 10 | `/registry` | **200** | ✅ |
| 11 | `/enterprise` | **200** | ✅ |
| 12 | `/enterprise/street-bites` | **200** | Dynamic ✅ |
| 13 | `/enterprise/ecopack-solutions/financials` | **200** | Dynamic nested ✅ |
| 14 | `/enterprise/nile-brew-cafe/governance-log` | **200** | Dynamic nested ✅ |
| 15 | `/enterprise/smartfarm-egypt/annual-report` | **200** | Dynamic nested ✅ |
| 16 | `/enterprise/smartfarm-egypt/trades` | **200** | Dynamic nested ✅ |
| 17 | `/badge/street-bites` | **200** | Dynamic ✅ |
| 18 | `/dashboard` | **200** ⚠️ | See Finding P3-2 — body contains RSC redirect signal to `/signin?next=/dashboard` (no actual dashboard content rendered); HTTP 200 (not 307) due to Next.js 16 RSC streaming. Auth gate IS firing. |
| 19 | `/dashboard/portfolio` | **200** ⚠️ | Same RSC-redirect-200 pattern |
| 20 | `/dashboard/copilot` | **200** ⚠️ | Same |
| 21 | `/dashboard/erp` | **200** ⚠️ | Same |
| 22 | `/dashboard/erp/integration` | **200** ⚠️ | Same |
| 23 | `/dashboard/admin/users` | **200** ⚠️ | Same |
| 24 | `/dashboard/admin/enterprises` | **200** ⚠️ | Same |
| 25 | `/dashboard/notifications` | **200** ⚠️ | Same |
| 26 | `/dashboard/profile` | **200** ⚠️ | Same |
| 27 | `/dashboard/passkeys` | **200** ⚠️ | Same (but `/dashboard/passkeys` is the MFA verification target — see layout gate logic) |
| 28 | `/dashboard/credentials` | **200** ⚠️ | Same |
| 29 | `/dashboard/institutional-trust` | **200** ⚠️ | Same |
| 30 | `/dashboard/solvency` | **200** ⚠️ | Same |

**Curl body inspection of `/dashboard` (45 KB body):**
- Title tag: `Overview · AURIENTA` (metadata from `dashboard/page.tsx`).
- Body contains 4 occurrences of `/signin?next` (the redirect URL the dashboard layout emits).
- Body does **not** contain `OverviewHero`, `TaskList`, or `QuickActions` component markers → confirms auth-gate redirect fired before dashboard content rendered.
- Compare: `/signin` body is 83 KB and contains the actual sign-in form.

**Conclusion:** Auth gate IS being enforced (redirect to `/signin` is signaled via the RSC payload). HTTP status is 200 instead of 307 because Next.js 16 streams the RSC response and the redirect marker is part of the streamed body — a real browser executes the redirect client-side. This is **not** an auth bypass; it is a tooling/scanner-compatibility concern (see Finding P3-2).

**Infrastructure observation:** Dev server repeatedly crashed with `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory` under repeated route probing. Default `NODE_OPTIONS='--max-old-space-size=2048'` was insufficient; raised to 8192 still crashed after ~30 page compiles. This is a dev-only stability concern (see Finding P1-2); production `next start` is unaffected.

---

## 8. Findings (defects classified P0/P1/P2/P3 with evidence)

### P0 (critical / blocks mandate) — **0 found**

No critical defects observed. Auth gate is enforced, all 30 probed routes returned HTTP 200, no broken nav links, no auth bypass.

### P1 (high severity) — **2 found**

#### P1-1: `/dashboard/alumni` page claims "intentionally public" but is actually auth-gated by the dashboard layout
- **File:** `src/app/dashboard/alumni/page.tsx` (lines 11–17 comment).
- **Evidence:** Page comment reads `"P0 #15 (audit review): This page is INTENTIONALLY PUBLIC — it is a read-only directory of graduated sovereign enterprises. No PII is exposed... This is by design (Vol 15 §15.5 — Alumni Hall is public)."` However, the page is located under `src/app/dashboard/`, which is wrapped by `src/app/dashboard/layout.tsx` — the layout calls `getCurrentUser()` and `redirect("/signin?next=...")` if no user. So the page is **NOT public** in practice.
- **Impact:** Two-sided: (a) doc/intent mismatch (the spec says it should be public, the implementation gates it), (b) the public can't view graduated enterprises without signing in, breaking the Vol 15 §15.5 contract.
- **Recommended fix:** Move `src/app/dashboard/alumni/page.tsx` to `src/app/alumni/page.tsx` (sibling to `/trust`, `/registry`) so it bypasses the dashboard layout, AND audit the page's Prisma queries to ensure no PII is exposed.

#### P1-2: Dev server (`next dev --webpack`) OOMs under repeated page compiles
- **File:** `dev.log` (V8 heap OOM stack traces).
- **Evidence:** During the 30-route probe, the dev server crashed 3+ times with `"FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory"` even with `NODE_OPTIONS='--max-old-space-size=8192'`. Each fresh route compile accumulates V8 heap; after ~15–30 compiles the server dies. The Phase-0 baseline confirms `GET /` returned 200 in 130 ms with default `--max-old-space-size=2048`, but sustained probing exhausts memory.
- **Impact:** Will block Phase 2 (browser golden-path verification) and Phase 3 (live API endpoint functional testing) if not addressed. May indicate per-route memory leak in `getCurrentUser()` (cached via React `cache()` — should be GC'd per-request, but may be retaining the entire user graph including nested `memberships.enterprise`, `ownershipRecords`, `tasks`, `notifications`).
- **Recommended fix:** Either (a) run `next build && next start` (production server — no on-demand compiles), or (b) profile `getCurrentUser()` for memory retention, or (c) bump dev heap to 16 GB if available.

### P2 (medium severity) — **4 found**

#### P2-1: MFA gate uses soft banner instead of hard redirect for privileged roles without MFA enrolled
- **File:** `src/app/dashboard/layout.tsx` (lines 79–109).
- **Evidence:** For privileged roles (`manager`, `founding_operator`, `board_member`, `law_firm_rep`, `accounting_firm_rep`, `aurienta_rep`) with `mfaEnabled !== true`, the layout shows an `<Alert>` banner but does **not** hard-redirect to `/dashboard/passkeys`. The code comment explicitly says: *"We don't hard-block these users because (until the passkey enrollment flow is fully shipped + every demo user has mfaEnabled=true) doing so would lock them out of the platform entirely."*
- **Impact:** Privileged roles can perform money-moving / document-signing / PII-access actions without enrolling in MFA. Session-cookie theft → full account compromise for these roles. The hard gate only covers the user-controlled half (post-enrollment MFA verification), not the enrollment half.
- **Recommended fix:** Once the passkey enrollment flow is fully shipped AND every seeded demo privileged user has `mfaEnabled=true` + ≥1 registered passkey, upgrade the soft banner to `redirect("/dashboard/passkeys")` for privileged roles. Track this as a deferred remediation item.

#### P2-2: 20 dashboard pages lack a sibling `error.tsx`
- **Files (sample):** `dashboard/portfolio`, `dashboard/erp` and all 8 `/dashboard/erp/*` subroutes, `dashboard/supply-chain-finance`, `dashboard/graduation-bond`, `dashboard/succession-declaration`, `dashboard/admin` (+ dynamic `/dashboard/admin/enterprises/[id]`, `/dashboard/admin/users/[id]`), `dashboard/dividends`, `dashboard/productive-egp`, `dashboard/constitutional-wages`, `dashboard/takaful-pool`, `dashboard/cooperative-network`.
- **Evidence:** `find src/app -name "error.tsx" | wc -l` = 98; total dashboard pages = 118; gap ≈ 20 pages without route-level error boundaries. Errors in these pages propagate to the parent `/dashboard/error.tsx` (root dashboard boundary), which provides a less-specific UX.
- **Impact:** Suboptimal error UX on 17% of dashboard routes. Not a security issue.
- **Recommended fix:** Add a per-route `error.tsx` for each of the 20 affected pages (copy from a similar page like `dashboard/copilot/error.tsx`).

#### P2-3: `/dashboard/erp` hub and all 8 `/dashboard/erp/*` subroutes lack `loading.tsx`
- **Files:** `src/app/dashboard/erp/`, `src/app/dashboard/erp/projects/`, `src/app/dashboard/erp/tasks/`, `src/app/dashboard/erp/inventory/`, `src/app/dashboard/erp/procurement/`, `src/app/dashboard/erp/assets/`, `src/app/dashboard/erp/production/`, `src/app/dashboard/erp/quality/`, `src/app/dashboard/erp/integration/`.
- **Evidence:** `ls src/app/dashboard/erp/` shows no `loading.tsx` in the hub or any subroute (only `page.tsx` and child dirs).
- **Impact:** No streaming loading skeleton for ERP routes — user sees blank page during DB fetch (ERP hub calls `getErpDashboardStats(e.id)` for each of up to 100 enterprises sequentially in a `for...of` loop — see `dashboard/erp/page.tsx` lines 35–37).
- **Recommended fix:** Add `loading.tsx` to `src/app/dashboard/erp/` (covers all subroutes by inheritance) OR per-subroute for finer-grained skeletons. Also consider `Promise.all` instead of sequential `for...of` for the stats-by-enterprise loop.

#### P2-4: Worklog claim "Theme: 100% indigo (0 amber/gold)" is inaccurate
- **Evidence:** `rg -l "text-gold|bg-gold|amber-" src/app --glob "*.tsx"` returns **81 files**. Spot-checked: `dashboard/law-firm/page.tsx` uses `text-gold`, `border-gold/30`, `bg-gold/10`, `text-gold-light/85`, `glass-gold`; `dashboard/vault/page.tsx` uses `border-gold/10`.
- **Impact:** The platform's documented theme direction (indigo-only per `ULTRA-UI-IMPLEMENTED` worklog entry) is not enforced. Brand consistency issue.
- **Recommended fix:** Sweep all 81 files for `*-gold` / `amber-*` classes and replace with indigo equivalents (`*-indigo-*` or `*-primary-*`).

### P3 (low severity / cosmetic) — **4 found**

#### P3-1: `src/middleware.ts` uses deprecated "middleware" file convention
- **File:** `src/middleware.ts` (whole file).
- **Evidence:** Dev server log emits `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead in next.config.ts.` Next.js 16 prefers `src/proxy.ts`.
- **Impact:** Cosmetic / forward-compat warning only. Functionality unaffected.
- **Recommended fix:** Run `npx @next/codemod@canary middleware-to-proxy .` to auto-migrate.

#### P3-2: Dashboard routes return HTTP 200 (not 307) to anonymous `curl`
- **Evidence:** All 13 dashboard routes probed returned HTTP 200 to unauth `curl` (no `aurienta_session` cookie). Body inspection of `/dashboard` confirmed: body contains `/signin?next` redirect markers (4 occurrences) but NO actual dashboard content (no `OverviewHero`, `TaskList`, `QuickActions` markers) — i.e., the auth gate's `redirect("/signin?next=...")` IS firing, but the redirect is delivered via RSC streaming payload (not HTTP 307).
- **Impact:** (a) Naive HTTP-status-only security scanners will misclassify dashboard routes as "publicly accessible" (false positive). (b) `curl`-based auth smoke-tests cannot distinguish authed vs unauthed responses by status code alone — must inspect body.
- **Recommended fix:** Document this as a known Next.js 16 RSC streaming behavior. If 307 status is desired for tooling compatibility, consider moving the auth check into `middleware.ts` (which CAN issue a `NextResponse.redirect()` with proper 307 status) for `/dashboard/*` routes — but this would lose the React `cache()` benefit on `getCurrentUser()`.

#### P3-3: Gold/amber theme classes persist in 81 TSX files (duplicate of P2-4 but lower-priority instances)
- (See P2-4 for evidence.) Listing as P3 separately to distinguish "brand inconsistency in role portals" (P3) from "the worklog claim is wrong" (P2). 80 of the 81 files are cosmetic; 1 (`vault/page.tsx`) was specifically called out in the worklog as already-fixed.

#### P3-4: Per-route `error.tsx` coverage gap on 20 dashboard pages
- (See P2-2.) Listed as P3 also because the root `/dashboard/error.tsx` does catch uncaught errors — the missing per-route boundaries only affect error UX granularity, not safety.

### P0 count: **0**
### P1 count: **2**
### P2 count: **4**
### P3 count: **4**

---

## 9. Cross-references to other registers

- Auth/permission model: see `AUDIT_AUTH_PERMISSIONS.md` (root) — confirms `requireRole()` and `getCurrentUser()` patterns.
- Navigation map: see `AUDIT_NAVIGATION_MAP.md` (root) — historical nav documentation; this register supersedes it for the post-`UX-RESTRUCTURE-IMPLEMENTED` 11-group nav.
- UI/UX audit: see `AUDIT_UX_FULL.md` — last UX audit (118 dashboard pages tested: 115/115 HTTP 200, 2 dynamic skipped). This register's 30-route probe confirms continued HTTP 200 across a fresh sample including dynamic routes.

---

## 10. Next-phase hand-off

- **Phase 1-B (API routes inventory):** Should enumerate `src/app/api/**/route.ts` (worklog claims 216 API routes) and verify auth on each (the dashboard pages here call `db.*` directly, not via API — so API auth is independent).
- **Phase 2 (browser golden-path):** Will need either production `next start` or a more heap-tolerant dev server (see P1-2).
- **Phase 3 (live API functional testing):** Dev server OOM may also affect this; recommend pre-compiling via `next build`.

---

**Register complete. No code was modified (inspect-only phase).**
