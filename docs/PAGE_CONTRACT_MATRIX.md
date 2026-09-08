# AURIENTA Page Contract Matrix

> Companion document to **AUDIT-4-SECURITY** (Security + Tenant Isolation audit).
> Frozen at the same commit (post `DASHBOARD-TABS-LOGOUT-FIX`, worklog line ~12533).
>
> **Authority:** Application Security Engineer.
> **Purpose:** A single matrix every reviewer/QA engineer can consult to know —
> for each major page — (a) who is allowed in, (b) which tenant's data is
> rendered, (c) what happens on each error class, and (d) what the read/create/
> update/delete surface is.
>
> **Tenant model:** AURIENTA's tenant is the **Enterprise** (via `EnterpriseMember`).
> `getCurrentUser()` loads `memberships[].enterpriseId` — every per-enterprise
> query MUST filter by `enterpriseId: { in: user.memberships.map(m => m.enterpriseId) }`
> or by an explicit `memberships.some(...)` role/seat check.

---

## Legend

| Cell | Meaning |
| --- | --- |
| ✅ | Correctly enforced (filtered by tenant / role) |
| ⚠️ | Partial enforcement — see notes |
| ❌ | **Open finding** — see Severity column (P0/P1/P2) |
| N/A | Not applicable to this page |
| pub | Public/unauthenticated endpoint |

**Severity:**
- **P0** = exploitable today by any signed-in user → cross-tenant data leak or privilege escalation. Ship blocker.
- **P1** = exploitable with mild effort, leaks sensitive metadata, or breaks the error contract. Fix before pilot.
- **P2** = UX inconsistency, defense-in-depth gap, no immediate data leak.

**Auth flow on dashboard pages:**
- **401 (unauth)**: page calls `getCurrentUser()`; if null → `redirect("/signin?next=<page>")`.
- **403 (forbidden)**: page checks `user.memberships.some(m => m.role === "<required>")`. Currently → `redirect("/dashboard")` (silent bounce). **Should** render a 403 Forbidden screen.
- **404 (not found)**: dynamic `[id]` page renders a "not found" panel (no redirect).
- **500 (server error)**: caught by `error.tsx` boundary (per-page `error.tsx` where present, root `global-error.tsx` otherwise).

**API error contract** (`src/lib/aurienta/api-handler.ts` `withErrorHandler`):
- 401 → `{ error: "Not authenticated", code: "UNAUTHORIZED" }`
- 403 → `{ error: "...", code: "FORBIDDEN" | "forbidden" }`
- 404 → `{ error: "Resource not found", code: "NOT_FOUND" | "not_found" }`
- 409 → `{ error: "Resource already exists", code: "conflict" }` (Prisma P2002)
- 500 → `{ error: "Internal server error" }` — **no stack trace leaked**.

The wrapper is solid; the gaps are in dashboard server components that don't
use it (they `redirect()` instead of throwing an `HttpError`).

---

## 1. Public + auth pages

| Route | Auth | Role | Tenant | Read | Create | Update | Delete | Errors | Severity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` (landing) | pub | pub | pub | ✅ page content | N/A | N/A | N/A | ✅ no auth needed | — |
| `/signin` | pub | pub | pub | ✅ form | ✅ creates Session via `/api/auth` POST | N/A | ✅ signout via `/api/auth` POST `action: "signout"` | ✅ failure → toast "Signature rejected"; success → `window.location.assign(next)` | — |
| `/register` | pub | pub | pub | ✅ wizard | ✅ POST `/api/auth/register` | N/A | N/A | ✅ per-step zod validation | — |
| `/legal/**` | pub | pub | pub | ✅ static legal copy | N/A | N/A | N/A | ✅ | — |
| `/enterprise/[slug]` | pub | pub | pub | ✅ public enterprise profile | N/A | N/A | N/A | ✅ 404 on unknown slug | — |
| `/registry` | pub | pub | pub | ✅ public registry | N/A | N/A | N/A | ✅ | — |

---

## 2. Dashboard core pages (any authenticated user)

| Route | Auth | Role | Tenant filter | Read | Create | Update | Delete | Errors | Severity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/dashboard` (Overview) | ✅ signin | any | ✅ uses `user.memberships` + `user.ownershipRecords` only | ✅ derived from user | N/A | N/A | N/A | ✅ `redirect("/signin?next=/dashboard")` if !user | — |
| `/dashboard/portfolio` | ✅ signin | any | ✅ `user.ownershipRecords` only | ✅ holdings, allocation | N/A (orders via `/market`) | ⚠️ sell orders via `/api/orders` (separate route) | N/A | ❌ `(await getCurrentUser())!` non-null assertion — throws 500 if user is null instead of redirecting to signin | **P2** |
| `/dashboard/notifications` | ✅ signin | any | ✅ `where: { userId: user.id }` | ✅ user's notifs only | N/A | ✅ mark-read via `/api/notifications/[id]/read` (verifies ownership) | N/A | ✅ explicit redirect | — |
| `/dashboard/governance` | ✅ signin | any (member of enterprise) | ✅ `where: { enterpriseId: { in: enterpriseIds } }` | ✅ proposals across user's enterprises | ✅ vote via `/api/proposals/[id]/vote` (verifies membership + voting power) | N/A | N/A | ✅ explicit redirect | — |
| `/dashboard/vault` | ✅ signin | any (member) | ✅ `enterpriseId: { in: enterpriseIds }` | ✅ vault loans for user's enterprises | ✅ loan request via `/api/vault/loan` (route verifies role) | ✅ approve/repay via `/api/vault/loan/[id]` (verifies role) | N/A | ✅ explicit redirect | — |
| `/dashboard/escrow` | ✅ signin | any (founder or member) | ✅ `founderId: user.id` + `memberships` | ✅ law-firm balances for user's enterprises | N/A | N/A | N/A | ✅ explicit redirect | — |
| `/dashboard/founder` | ✅ signin | founding_operator | ✅ `founderId: user.id` OR `EnterpriseMember.role === "founding_operator"` | ✅ enterprises user founded | ✅ via `/api/enterprises` POST (creates new enterprise) | ✅ via `/api/enterprises/[id]/profile` PATCH (verifies founder/owner) | N/A | ⚠️ `if (!user) return null` — relies on layout.tsx redirect; acceptable but inconsistent | P2 |
| `/dashboard/manager` | ✅ signin | manager OR founding_operator | ✅ filters `managerMemberships` first; falls back to "no seats" empty state | ✅ expenses/employees/milestones for filtered enterprises | ✅ expenses via `/api/expenses` | ✅ approve via `/api/expenses/[id]/approve` (verifies role) | N/A | ❌ `(await getCurrentUser())!` AND no role check — any authed user can render; falls back to empty state (no leak) but UX inconsistent | **P2** |
| `/dashboard/board-member` | ✅ signin | board_member | ✅ `role: "board_member", boardSeat: true` | ✅ board-relevant data per enterprise | ✅ vote via `/api/proposals/[id]/vote` | N/A | N/A | ✅ explicit redirect; falls back to "no board seats" empty state | — |
| `/dashboard/copilot` | ✅ signin | any | ✅ chat history `userId: user.id`; enterprises `enterpriseId: { in: enterpriseIds }` | ✅ user's chat + user's enterprises | ✅ POST `/api/copilot` (rate-limited) | N/A | N/A | ❌ `(await getCurrentUser())!` non-null assertion | **P2** |
| `/dashboard/mentorship` | ✅ signin | any | ✅ mentors filter by STS+intent (platform-wide by design — public mentor directory); mentees by tier/stage | ✅ mentor directory + user's mentorships | ✅ POST `/api/mentorship` | N/A | N/A | ✅ explicit redirect | — |
| `/dashboard/profile` | ✅ signin | any | ✅ user's own profile + memberships | ✅ user profile | N/A | ✅ via `/api/...` (TBD) | N/A | ✅ explicit redirect | — |
| `/dashboard/opportunities` | ✅ signin | any | ✅ lists public enterprises `status: { notIn: ["draft", "graduated"] }` (intentionally cross-tenant — public registry) | ✅ all fundraising enterprises | ✅ reserve via `/api/reservations` | N/A | N/A | ❌ `(await getCurrentUser())!` non-null assertion | **P2** |
| `/dashboard/market` | ✅ signin | any | ✅ `user.ownershipRecords` (holdings) — only enterprises user holds shares in | ✅ user's tradeable enterprises | ✅ POST `/api/orders` | ✅ cancel via `/api/orders` | N/A | ❌ `(await getCurrentUser())!` non-null assertion | **P2** |
| `/dashboard/graduation` | ✅ signin | any | ✅ `enterpriseId: { in: enterpriseIds }` | ✅ user's enterprises, primary by readiness | ✅ call vote via `/api/graduation/execute` | N/A | N/A | ❌ `(await getCurrentUser())!` non-null assertion | **P2** |
| `/dashboard/skill-equity` | ✅ signin | any (member) | ✅ filters by user's memberships | ✅ claims across user's enterprises | ✅ POST `/api/skill-equity` | ✅ review via `/api/skill-equity/[id]/review` (verifies role) | N/A | ❌ `(await getCurrentUser())!` non-null assertion | **P2** |
| `/dashboard/syndicates` | ✅ signin | any | ✅ user's syndicates + public forming syndicates | ✅ user's syndicates | ✅ join via `/api/syndicates/[id]/join` (verifies unique membership) | N/A | N/A | ✅ explicit redirect | — |
| `/dashboard/updates` (engagement feed) | ✅ signin | any | ✅ `userId: user.id` | ✅ user's enterprise updates | N/A | N/A | N/A | ✅ explicit redirect | — |
| `/dashboard/whistleblower` | ✅ signin | any (member) | ❌ **`myReports` query has empty `where: {}`** — comment in code admits "We can't easily map report→filer by userId directly... For now show all reports the user can see". Returns ALL whistleblower reports platform-wide to ANY authenticated user. | ❌ leaks tracking codes + descriptions + enterprise IDs + bounty amounts cross-tenant | ✅ POST `/api/whistleblower` | N/A | N/A | ✅ explicit redirect | **P0** |
| `/dashboard/compliance` | ✅ signin | any | ❌ **`db.auditLog.findMany({ orderBy: { timestamp: "desc" }, take: 12, include: { actor: true } })` — NO filter.** Returns platform-wide audit log (incl. actor's full User PII) to ANY authenticated user. Also uses `(await getCurrentUser())!`. | ❌ leaks audit log entries across all tenants | N/A | N/A | N/A | ❌ non-null assertion + missing tenant filter | **P0** |
| `/dashboard/enterprise-profile` | ✅ signin | any | ❌ **IDOR**: accepts arbitrary `?id=<enterpriseId>` from URL search params, fetches full enterprise record WITHOUT verifying membership. Any authenticated user can enumerate cuid IDs to view any enterprise's full profile (founder, employees, ownership records, documents, milestones, financials). | ❌ full enterprise profile by ID | N/A | ✅ via `/api/enterprises/[id]/profile` PATCH (verifies founder/owner — but GET endpoint also has IDOR, see API section) | N/A | ✅ explicit redirect on !user | **P0** |

---

## 3. Role-gated consoles (single role required)

| Route | Auth | Required role | Tenant filter | Errors | Severity |
| --- | --- | --- | --- | --- | --- |
| `/dashboard/law-firm` | ✅ signin | `law_firm_rep` | ✅ `userId: user.id, role: "law_firm_rep"` | ❌ forbidden → `redirect("/dashboard")` (silent bounce) | **P2** |
| `/dashboard/accounting` | ✅ signin | `accounting_firm_rep` | ✅ `userId: user.id, role: "accounting_firm_rep"` | ❌ forbidden → `redirect("/dashboard")` (silent bounce) | **P2** |
| `/dashboard/company-owner` | ✅ signin | `company_owner` | ✅ `role: { in: ["company_owner", "board_member"] }` | ❌ forbidden → `redirect("/dashboard")` (silent bounce) | **P2** |
| `/dashboard/university` | ✅ signin | `university_rep` | ✅ | ❌ forbidden → `redirect("/dashboard")` | **P2** |
| `/dashboard/fra` | ✅ signin | `aurienta_rep` (FRA liaison) | ✅ read-only aggregate queries | ❌ forbidden → `redirect("/dashboard")` (silent bounce) | **P2** |
| `/dashboard/steward` | ✅ signin | `aurienta_rep` | ✅ platform-wide (by design — Steward role) | ❌ forbidden → `redirect("/dashboard")` (silent bounce) | **P2** |
| `/dashboard/partner-crm` | ✅ signin | TBD | TBD | ❌ forbidden → `redirect("/dashboard")` | **P2** |
| `/dashboard/admin-panel` | ✅ signin | **NONE — any authenticated user** | ❌ platform-wide queries (`db.user.count()`, `db.enterprise.findMany({ take: 10 })` etc.) | ❌ code comment: *"During build phase: no password required, any authenticated user can access. TODO: Add admin password gate before production"* | **P0** |
| `/dashboard/admin` | ✅ signin | N/A — redirects to `/dashboard/admin-panel` | N/A | ✅ redirect (but target has P0 issue) | **P0** (inherits) |
| `/dashboard/admin/users` | ✅ signin | `aurienta_rep` | ✅ platform-wide (by design) | ❌ forbidden → `redirect("/dashboard")` (silent bounce) | **P2** |
| `/dashboard/admin/users/[id]` | ✅ signin | `aurienta_rep` | ✅ platform-wide (by design) | ✅ 404 panel on unknown user; ❌ forbidden → `redirect("/dashboard")` | **P2** |
| `/dashboard/admin/enterprises` | ✅ signin | `aurienta_rep` | ✅ platform-wide (by design) | ❌ forbidden → `redirect("/dashboard")` (silent bounce) | **P2** |
| `/dashboard/admin/enterprises/[id]` | ✅ signin | `aurienta_rep` | ✅ platform-wide (by design) | ✅ 404 panel on unknown enterprise; ❌ forbidden → `redirect("/dashboard")` | **P2** |
| `/dashboard/admin/audit` | ✅ signin | `aurienta_rep` | ✅ platform-wide (by design) | ❌ forbidden → `redirect("/dashboard")` (silent bounce) | **P2** |
| `/dashboard/admin/settings` | ✅ signin | `aurienta_rep` | ✅ platform-wide settings | ❌ forbidden → `redirect("/dashboard")` (silent bounce) | **P2** |

> **Note on the silent-bounce pattern:** the comment in `src/lib/aurienta/auth.ts`
> documents this as intentional ("server components typically `redirect("/dashboard")`
> before reaching this throw via an explicit `user.memberships.some(...)` guard").
> That is the wrong UX. A user who clicks an admin link they don't have access
> to should see a 403 Forbidden screen explaining the denial — not a silent
> redirect that looks like the link is broken.

---

## 4. API routes — dynamic `[id]` handlers

> Read = GET; Create = POST; Update = PATCH/PUT; Delete = DELETE.
> Auth column = authentication check. **Authz** column = tenant/role authorization.

| Route | Method | Auth | **Authz** | Errors (401/403/404/500) | Severity |
| --- | --- | --- | --- | --- | --- |
| `/api/enterprises/[id]/profile` | GET | ✅ | ❌ **IDOR** — returns full enterprise record (employees with userIds, ownershipRecords with userIds, documents, milestones, financials) to ANY authenticated user. `buildViewerContext` sanitizes only employee salary/band fields — does NOT restrict the rest. | ✅ 401 if !user, 404 if !enterprise, 500 fallback | **P0** |
| `/api/enterprises/[id]/profile` | PATCH | ✅ | ✅ verifies `founderId === user.id` OR membership with `founding_operator`/`company_owner` role | ✅ 401/403/404/500 | — |
| `/api/enterprises/[id]/milestones` | GET | ✅ | ❌ **IDOR** — returns all milestones for any enterprise to any authenticated user (no membership check). | ✅ 401 if !user; ❌ no 403 (just returns data) | **P1** |
| `/api/enterprises/[id]/milestones` | POST | ✅ | ✅ verifies membership with `founding_operator`/`manager`/`board_member` role + milestone belongs to enterprise | ✅ 401/403/404/400/500 | — |
| `/api/enterprises/[id]/list` | POST | ✅ | ✅ verifies founder/owner/aurienta_rep membership | ✅ 401/403/404/400/500 | — |
| `/api/enterprises/[id]/close-capital-formation` | POST | ✅ | ✅ verifies founder/owner membership | ✅ 401/403/404/400/500 | — |
| `/api/enterprises` | GET | ✅ | ✅ `where: { founderId: user.id }` | ✅ 401 | — |
| `/api/enterprises` | POST | ✅ | ✅ any authenticated user may found an enterprise (creator becomes founding_operator) | ✅ 401/400/500 | — |
| `/api/admin/enterprises/[id]` | GET, PATCH | ✅ | ✅ `requireRole("aurienta_rep")` | ✅ 401/403/404/400/500 — error mapping explicit | — |
| `/api/admin/enterprises` | GET | ✅ | ✅ `requireRole("aurienta_rep")` | ✅ 401/403/500 | — |
| `/api/admin/enterprises/[id]/freeze` `/unfreeze` | POST | ✅ | ✅ `requireRole("aurienta_rep")` (per code in audit; route not re-read but pattern matches) | ✅ | — |
| `/api/admin/users` | GET | ✅ | ✅ `requireRole("aurienta_rep")` | ✅ 401/403/500 | — |
| `/api/admin/users/[id]` | GET, PATCH | ✅ | ✅ `requireRole("aurienta_rep")` + audit-logs the read | ✅ 401/403/404/400/500 | — |
| `/api/admin/users/[id]/suspend` | POST | ✅ | ✅ `requireRole("aurienta_rep")` + prevents self-suspend | ✅ 401/403/404/400/500 | — |
| `/api/admin/users/[id]/role` | POST | ✅ | ✅ `requireRole("aurienta_rep")` + idempotent assign/revoke | ✅ 401/403/404/400/500 | — |
| `/api/admin/audit` | GET | ✅ | ✅ `requireRole("aurienta_rep")` + audits the audit-view | ✅ 401/403/500 | — |
| `/api/admin/audit/export` | GET | ✅ | ✅ `requireRole("aurienta_rep")` (per code; not re-read) | ✅ | — |
| `/api/admin/settings` | GET, PATCH | ✅ | ✅ `requireRole("aurienta_rep")` (per code; not re-read) | ✅ | — |
| `/api/notifications/[id]/read` | POST | ✅ | ✅ verifies `notif.userId === user.id` before flipping read flag; returns 404 (not 403) if not owner — defense-in-depth: doesn't reveal existence | ✅ 401/404 | — |
| `/api/proxies/[id]/revoke` | POST | ✅ | ✅ verifies `proxy.delegatorId === user.id` | ✅ 401/403/404/400 | — |
| `/api/reservations/[id]/confirm` | POST | ✅ | ✅ verifies `law_firm_rep` OR `aurienta_rep` role (no enterprise-scope check — any law_firm_rep can confirm any reservation. **Mild IDOR** — depends on whether law_firm_rep role implies platform-wide law-firm scope.) | ✅ 401/403/404/400/500 | **P2** (inspect) |
| `/api/api-keys` | GET, POST | ✅ | ✅ verifies `founding_operator`/`company_owner`/`board_member` membership on the target enterprise | ✅ 401/403/404/400/500 | — |
| `/api/api-keys/[id]` | DELETE | ✅ | ✅ verifies caller holds allowed role on the enterprise that owns the key | ✅ 401/403/404/500 | — |
| `/api/vault/loan/[id]` | GET | ✅ | ❌ **IDOR** — returns any vault loan (amount, reason, enterpriseId, repayment status) to ANY authenticated user. No membership check. | ✅ 401/404; ❌ no 403 | **P1** |
| `/api/vault/loan/[id]` | PATCH | ✅ | ✅ verifies `aurienta_rep` for approve/reject; verifies REPAY_ROLES membership on the enterprise for repay | ✅ 401/403/404/400/500 | — |
| `/api/expenses/[id]/approve` | POST | ✅ | ✅ verifies membership with manager/board_member/accounting_firm_rep/founding_operator role on the expense's enterprise + CRE dual-sig rules + NOSI freeze check + submitter cannot self-approve | ✅ 401/403/404/400/500 — exemplary | — |
| `/api/skill-equity/[id]/review` | POST | ✅ | ✅ verifies membership with board_member/company_owner/founding_operator/aurienta_rep role on the claim's enterprise + cannot review own claim + CRE salary-to-equity enforcement | ✅ 401/403/404/400/500 | — |
| `/api/syndicates/[id]/join` | POST | ✅ | ✅ verifies syndicate is forming + unique membership (P2002 → 409) + amount within ±5% of fundamental price | ✅ 401/404/400/409/500 | — |
| `/api/proposals/[id]/vote` | POST | ✅ | ✅ verifies membership on enterprise + voting power > 0 + unique vote per user (P2002 → 409) + CRE quorum + police clearance for manager_appointment | ✅ 401/403/404/400/409/500 — exemplary | — |
| `/api/qa/[id]/answer` | POST | ✅ | ✅ verifies `founding_operator`/`company_owner`/`board_member` membership on the question's enterprise | ✅ 401/403/404/400/500 | — |
| `/api/documents/[id]/sign` | POST | ✅ | ✅ verifies membership on the enterprise that owns the document + Ed25519 identity anchor required + refuses if enterprise frozen | ✅ 401/403/404/400/500 | — |
| `/api/milestones/[id]/accountant-release` | POST | ✅ | ✅ verifies `accounting_firm_rep` membership on the enterprise + CRE accountant gate + fund flow + zero-custody | ✅ 401/403/404/400/500 | — |
| `/api/evidence/[cid]` | GET | pub | pub (declared "radical transparency" per Blueprint §8.6) — **CORS `*`** — IPFS CIDs may be guessable, allowing unauthenticated enumeration of evidence metadata (filename, MIME, size, milestoneId, enterpriseId, enterprise name) | ✅ 404 if not found; ⚠️ no audit log of access | **P2** (inspect) |
| `/api/verification/[id]` | GET, PATCH | ✅ | ✅ GET: verifies caller owns record OR is member of target enterprise OR holds reviewer role. PATCH: requires reviewer role. | ✅ 401/403/404/400/500 — exemplary | — |
| `/api/auth` | POST | pub (no session yet) | N/A — rate-limited by IP; CSRF-exempt in middleware; verifies password hash (refuses plaintext in prod) | ✅ 401 on bad creds; 500 on unprovisioned hash | — |
| `/api/auth/signout` | POST | pub (CSRF-exempt) | ✅ idempotent signout | ✅ | — |
| `/api/auth/register` | POST | pub | N/A — creates user | ✅ 400 on validation; 409 on duplicate email | — |

---

## 5. Cache isolation summary

| Surface | Pattern | Verdict |
| --- | --- | --- |
| ~30 dashboard `page.tsx` | `export const dynamic = "force-dynamic"` | ✅ No page is ever statically cached. RSC payload is regenerated per request. |
| Middleware on all GETs | `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` | ✅ Browser never caches an authenticated response; also blocks stale RSC prefetches. |
| `getCurrentUser()` | wrapped in `React.cache()` | ✅ Per-request memoization — layout + page + components share ONE DB lookup. No cross-request leak. |
| Session token | SHA3-256 hash stored in DB; cookie holds the raw token | ✅ DB read doesn't yield usable tokens. |
| Service worker | disabled (`RegisterSW` unregisters) | ✅ No SW cache to leak across users. |
| `/dashboard/admin/audit/page.tsx` | sets BOTH `dynamic = "force-dynamic"` AND `revalidate = 0` | ⚠️ Redundant — `force-dynamic` already implies no caching. Not a bug; just noise. |

---

## 6. Cross-cutting gaps

1. **`(await getCurrentUser())!` non-null assertion (8 pages).** If `getCurrentUser()`
   ever returns null on a page that does NOT first call `if (!user) redirect("/signin")`,
   the page throws 500 → Next.js error boundary. This was the root cause of the
   historical "tabs cause logout" bug (worklog `DASHBOARD-TABS-LOGOUT-FIX`),
   where the second DB call inside `getCurrentUser` could fail on Vercel
   serverless. React.cache() fixed the immediate cause, but the non-null
   assertion remains a footgun. **Pages: portfolio, manager, copilot,
   opportunities, market, graduation, skill-equity, compliance.**

2. **Silent `redirect("/dashboard")` on RBAC denial (13 pages).** A user who
   clicks a sidebar link they lack the role for is bounced to `/dashboard`
   with no explanation. The pattern is documented in `auth.ts` but is the
   wrong UX. Should render a 403 Forbidden screen.

3. **Mixed error semantics on dashboard pages:**
   - 401 (unauth) → redirect to `/signin?next=<page>` ✅
   - 403 (forbidden) → redirect to `/dashboard` ❌ (should be 403 screen)
   - 404 (resource not found) → render in-page "not found" panel ✅
   - 500 (server error) → caught by `error.tsx` boundary ✅

4. **The `aurienta_rep` role doubles as Steward + FRA liaison + admin.**
   Every role-gated page checks `m.role === "aurienta_rep"` directly instead
   of going through a single `requireRole("aurienta_rep")` helper (which only
   the API routes use). The dashboard should adopt the same helper or a
   `requireRoleOrRedirect("aurienta_rep", { redirectTo: "/dashboard/forbidden" })`
   wrapper that renders a 403 screen on denial.

---

## 7. Open findings (sorted by severity)

### P0 — ship blockers

| # | Finding | Location | Fix sketch |
| --- | --- | --- | --- |
| P0-1 | `/dashboard/admin-panel` has NO RBAC — any signed-in user sees platform-wide stats, recent users (email + verificationLevel + STS), recent enterprises, recent ledger events | `src/app/dashboard/admin-panel/page.tsx` lines 14-77 | Add `const hasRole = user.memberships.some(m => m.role === "aurienta_rep"); if (!hasRole) return <ForbiddenScreen/>` before the parallel DB queries. Remove the "TODO: Add admin password gate before production" comment. |
| P0-2 | `/dashboard/compliance` runs `db.auditLog.findMany({ orderBy: ..., take: 12, include: { actor: true } })` with NO tenant filter — leaks platform-wide audit log + actor PII to any signed-in user | `src/app/dashboard/compliance/page.tsx` lines 15-28 | Gate the page behind `aurienta_rep` (it's a Steward compliance console) OR filter by `where: { actorId: user.id }` for member view. At minimum strip `actor: true` and only show the user's own actions. |
| P0-3 | `/dashboard/whistleblower` runs a `myReports` query with empty `where: {}` — code comment admits the bug. Returns ALL whistleblower reports (tracking codes, descriptions, enterprise IDs, bounty amounts) to ANY signed-in user | `src/app/dashboard/whistleblower/page.tsx` lines 25-49 | Add `userId` column to `WhistleblowerReport` schema (or join via tracking code → user mapping table) and filter `where: { OR: [{ filerId: user.id }, { enterpriseId: { in: enterpriseIds } }] }`. Until then, restrict the page to `aurienta_rep` + `law_firm_rep` only. |
| P0-4 | `/dashboard/enterprise-profile?id=<enterpriseId>` accepts arbitrary ID — IDOR. Any signed-in user can fetch any enterprise's full profile (founder, employees with userIds, ownership records, documents, milestones, financials) | `src/app/dashboard/enterprise-profile/page.tsx` lines 22-100 | After `getCurrentUser()`, verify `user.memberships.some(m => m.enterpriseId === id)` before fetching. Render a 403 screen if not a member. |
| P0-5 | `/api/enterprises/[id]/profile` GET returns full enterprise record to ANY signed-in user — `buildViewerContext` sanitizes only employee salary/band fields, not the rest of the relations | `src/app/api/enterprises/[id]/profile/route.ts` lines 142-265 | Reject non-members with 403 OR move the route to a public-read pattern that returns only the public enterprise card (name, slug, tagline, tier, sector, fundraising progress) without relations. The current "everyone authenticated + sanitize employees" model is the wrong tradeoff. |

### P1 — fix before pilot

| # | Finding | Location | Fix sketch |
| --- | --- | --- | --- |
| P1-1 | `/api/enterprises/[id]/milestones` GET returns all milestones for any enterprise to any signed-in user — no membership check | `src/app/api/enterprises/[id]/milestones/route.ts` lines 149-163 | Add membership check: `if (!user.memberships.some(m => m.enterpriseId === enterpriseId)) return 403;` |
| P1-2 | `/api/vault/loan/[id]` GET returns any vault loan (amount, reason, enterpriseId, repayment status) to any signed-in user — no membership check on read (PATCH correctly checks) | `src/app/api/vault/loan/[id]/route.ts` lines 58-83 | Add: `if (!user.memberships.some(m => m.enterpriseId === loan.enterpriseId)) return 403;` |
| P1-3 | `/api/evidence/[cid]` is public + CORS `*` — anyone (unauthenticated) can enumerate evidence metadata by guessing/scraping CIDs | `src/app/api/evidence/[cid]/route.ts` lines 1-86 | Require authentication + audit-log every read. If transparency is intentional per Blueprint §8.6, document the decision in a SECURITY.md and rate-limit unauthenticated access by IP. |
| P1-4 | 13 dashboard pages silently `redirect("/dashboard")` on RBAC denial — no 403 screen | law-firm, accounting, company-owner, university, fra, steward, partner-crm, admin/users, admin/users/[id], admin/enterprises, admin/enterprises/[id], admin/audit, admin/settings | Replace `if (!hasRole) redirect("/dashboard")` with `if (!hasRole) return <ForbiddenScreen requiredRole="aurienta_rep" />`. Create `src/components/dashboard/forbidden-screen.tsx`. |

### P2 — defense-in-depth + UX

| # | Finding | Location | Fix sketch |
| --- | --- | --- | --- |
| P2-1 | 8 dashboard pages use `(await getCurrentUser())!` non-null assertion — throws 500 if user is null instead of redirecting to signin | portfolio, manager, copilot, opportunities, market, graduation, skill-equity, compliance | Replace with `const user = await getCurrentUser(); if (!user) redirect("/signin?next=...");` |
| P2-2 | `/api/reservations/[id]/confirm` allows any `law_firm_rep` to confirm any reservation (no enterprise-scope check on the membership) | `src/app/api/reservations/[id]/confirm/route.ts` lines 40-56 | Add: `if (!user.memberships.some(m => m.enterpriseId === reservation.enterpriseId && m.role === "law_firm_rep")) return 403;` |
| P2-3 | `/dashboard/admin/audit/page.tsx` sets `revalidate = 0` redundantly alongside `dynamic = "force-dynamic"` | line 42 | Remove the `revalidate` line; `force-dynamic` already disables caching. |
| P2-4 | Dashboard pages each check `m.role === "aurienta_rep"` inline. Should use a `requireRoleOrForbidden("aurienta_rep")` server-component helper to standardize the 403 screen | all role-gated dashboard pages | Add `src/lib/aurienta/server-rbac.ts` exporting `requireRoleOrForbidden(role)` that throws a typed `ForbiddenError` caught by a new `forbidden.tsx` boundary (Next 15 supports `forbidden()` natively). |
| P2-5 | `/dashboard/manager` has NO role check — any signed-in user can render the page (falls back to "no manager seats" empty state, so no data leak, but UX is inconsistent) | `src/app/dashboard/manager/page.tsx` lines 14-48 | Add the same `manager` OR `founding_operator` role check the page uses for `managerMemberships`. |

---

## 8. What's already strong

- **CSRF middleware** (`src/middleware.ts`): same-origin OR double-submit token; security headers on every response.
- **`withErrorHandler`** wraps most API routes; never leaks stack traces; translates Prisma codes (P2002 → 409, P2025 → 404, P2003 → 400).
- **`requireRole()`** helper throws typed errors that API routes translate to 401/403.
- **Session model**: server-side Session table with revocation, rotation, device tracking; SHA3-256 token hash; httpOnly + sameSite=lax cookie; `sameSite=strict` would break some auth flows but lax is sufficient given the CSRF middleware.
- **Money-moving routes** (`/api/expenses/[id]/approve`, `/api/proposals/[id]/vote`, `/api/milestones/[id]/accountant-release`, `/api/vault/loan/[id]` PATCH, `/api/skill-equity/[id]/review`, `/api/reservations/[id]/confirm`) all do explicit per-enterprise RBAC + CRE policy enforcement + audit log + ledger event in one transaction. **Exemplary.**
- **Read endpoints on private user data** (`/api/notifications/[id]/read`, `/api/proxies/[id]/revoke`, `/api/api-keys/[id]` DELETE) all verify ownership.
- **No hardcoded secrets** in tracked files (verified by `TASK-1-SECRET-ISOLATION`).
- **Service worker disabled** + `Cache-Control: no-store` middleware → no cross-user cache leak.

---

_End of `PAGE_CONTRACT_MATRIX.md`. Update this file whenever a new dashboard page or `[id]` API route is added._
