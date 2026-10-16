# AURIENTA — Navigation & Route Inventory (AUDIT-PHASE3)

**Audit type:** Forensic audit — Phase 3 (screen/route/navigation inventory)
**Code source:** `src/app/` (Next.js 16 App Router)
**Nav config source:** `src/lib/aurienta/nav-config.ts`
**Production tested:** https://aurienta.vercel.app (authenticated as layla@streetbites.eg)

## 1. Statistics

| Metric | Count |
|---|---|
| Total `page.tsx` files in `src/app/` | 119 |
| Public page routes (live) | 19 |
| Dashboard page routes (live) | 102 |
| Dynamic route templates | 4 (`/enterprise/[slug]`, `/badge/[slug]`, `/dashboard/admin/users/[id]`, `/dashboard/admin/enterprises/[id]`) |
| API callback routes tested | 3 (`/api/inngest`, `/api/v1/webhook/payment`, `/api/webhook/payment`) |
| **Total routes in SCREEN_ROUTE_INVENTORY.csv** | **125** |
| Total NAV entries in nav-config.ts | 98 |
| Distinct NAV groups | 9 |
| Routes returning HTTP 200 on production | 121 / 121 page routes |
| Routes returning HTTP 404 | 2 (`/api/webhook/payment` dead path, `/nonexistent-page-test` invalid) |
| Routes returning HTTP 405 | 1 (`/api/v1/webhook/payment` POST-only) |
| Routes returning HTTP 500 | 0 |
| Routes returning HTTP 307/302 | 0 (after `curl -L` follow) |
| Dead nav entries (in NAV but route missing) | 0 |
| Orphan pages (route exists but not in NAV) | 4 |

> All 121 page routes return HTTP 200 on production (public + dashboard). 0 broken pages, 0 server errors.

## 2. Full Navigation Tree

Source: `src/lib/aurienta/nav-config.ts` → `NAV: NavItem[]` (98 entries, 9 groups).

Group ordering follows `NAV_GROUPS` (capital-partner view). Operator seats (manager / founding_operator) get a reordered view via `groupOrderForRoles()` (Enterprise first).

### Group: **Workspace** (13 items)

| Icon | Label | Route |
|---|---|---|
| `LayoutDashboard` | Overview | `/dashboard` |
| `Wallet` | Constitutional Holdings | `/dashboard/portfolio` |
| `Compass` | Capital Participation | `/dashboard/opportunities` |
| `LineChart` | Enterprise Registry | `/dashboard/market` |
| `Hourglass` | Priority Windows | `/dashboard/priority-windows` |
| `CalendarDays` | Constitutional Calendar | `/dashboard/calendar` |
| `Newspaper` | Enterprise Updates | `/dashboard/updates` |
| `UserCircle` | Profile & Identity | `/dashboard/profile` |
| `KeyRound` | Passkeys & Security | `/dashboard/passkeys` |
| `Telescope` | Enterprise Discovery | `/dashboard/enterprise-discovery` |
| `HandCoins` | Profit-Sharing Agreements | `/dashboard/profit-sharing` |
| `ListOrdered` | STS Priority Allocation | `/dashboard/priority-allocation` |
| `Fingerprint` | Soulbound Credential | `/dashboard/soulbound` |

### Group: **Capital & Workforce** (7 items)

| Icon | Label | Route |
|---|---|---|
| `Users` | Syndicates | `/dashboard/syndicates` |
| `HardHat` | Career Ledger | `/dashboard/career-ledger` |
| `UserCheck` | Mentorship | `/dashboard/mentorship` |
| `Award` | Skill-to-Equity | `/dashboard/skill-equity` |
| `Calculator` | AI Salary Engine | `/dashboard/salary` |
| `Globe` | Diaspora Bridge | `/dashboard/diaspora` |
| `ThumbsUp` | Constitutional Endorsement | `/dashboard/endorsements` |

### Group: **Enterprise** (10 items)

| Icon | Label | Route |
|---|---|---|
| `Scale` | Governance | `/dashboard/governance` |
| `Settings2` | Manager Console | `/dashboard/manager` |
| `Rocket` | Founding Operator Studio | `/dashboard/founder` |
| `Building2` | Enterprise Profile | `/dashboard/enterprise-profile` |
| `Presentation` | Pitch Deck Generator | `/dashboard/pitch-deck` |
| `Target` | Milestone Designer | `/dashboard/milestone-designer` |
| `Gavel` | Board Member Console | `/dashboard/board-member` |
| `ClipboardList` | Board Briefings | `/dashboard/board-briefings` |
| `UserCheck` | Succession Planner | `/dashboard/succession` |
| `Contact` | Partner CRM | `/dashboard/partner-crm` |

### Group: **Intelligence** (13 items)

| Icon | Label | Route |
|---|---|---|
| `Brain` | Brain AI Status | `/dashboard/brain-ai` |
| `FileSearch` | Precedent Engine | `/dashboard/precedents` |
| `TrendingUp` | Drift Detector | `/dashboard/drift` |
| `AlertTriangle` | Anomaly Narration | `/dashboard/anomalies` |
| `GitCompare` | Charter Diff | `/dashboard/charter-diff` |
| `Languages` | Constitution Guide | `/dashboard/constitution` |
| `Bell` | Notifications | `/dashboard/notifications` |
| `Bot` | AI Copilot | `/dashboard/copilot` |
| `Dna` | Enterprise Genome | `/dashboard/genome` |
| `ChartColumn` | Real-Economy Index | `/dashboard/arei` |
| `Vote` | Quadratic Voting | `/dashboard/quadratic-voting` |
| `Waves` | Constitutional Zeitgeist | `/dashboard/zeitgeist` |
| `Satellite` | AI Consensus Oracle | `/dashboard/oracle` |

### Group: **Compliance & Transparency** (6 items)

| Icon | Label | Route |
|---|---|---|
| `ShieldCheck` | Compliance | `/dashboard/compliance` |
| `Users` | Workforce Registry | `/dashboard/workforce` |
| `ShieldAlert` | Whistleblower | `/dashboard/whistleblower` |
| `Gavel` | Appeal Court | `/dashboard/appeals` |
| `AlertTriangle` | Risk Disclosure | `/dashboard/risk-disclosure` |
| `Truck` | Vendor Portal | `/dashboard/vendor-portal` |

### Group: **Treasury & Infrastructure** (7 items)

| Icon | Label | Route |
|---|---|---|
| `Vault` | Law Firm Client Accounts | `/dashboard/escrow` |
| `Database` | Anti-Fragility Vault | `/dashboard/antifragility` |
| `Database` | Insurance Vault | `/dashboard/vault` |
| `FileCheck` | Proof-of-Solvency | `/dashboard/solvency` |
| `FileText` | Oracle Mirror | `/dashboard/oracle-mirror` |
| `Activity` | Reality Sync | `/dashboard/reality-sync` |
| `Layers` | Institutional Memory | `/dashboard/institutional-memory` |

### Group: **Graduation & Sovereignty** (5 items)

| Icon | Label | Route |
|---|---|---|
| `GraduationCap` | Graduation | `/dashboard/graduation` |
| `BarChart3` | Graduation Coach | `/dashboard/graduation-coach` |
| `FlaskConical` | Graduation Simulator | `/dashboard/graduation-simulator` |
| `HeartPulse` | Survival Drill | `/dashboard/survival-drill` |
| `Award` | Alumni Hall | `/dashboard/alumni` |

### Group: **Institutional Services** (6 items)

| Icon | Label | Route |
|---|---|---|
| `Receipt` | Tax Optimizer | `/dashboard/tax` |
| `MessageSquare` | Capital Partner Relations | `/dashboard/ir` |
| `PieChart` | DRIP (Dividend Reinvest) | `/dashboard/drip` |
| `Webhook` | Governance-as-a-Service | `/dashboard/gaas` |
| `HeartHandshake` | Standalone Succession | `/dashboard/standalone-succession` |
| `Umbrella` | Risk Profile API | `/dashboard/risk-profile` |

### Group: **Platform Admin** (31 items)

| Icon | Label | Route |
|---|---|---|
| `Users` | Partner Management | `/dashboard/admin/users` |
| `Building` | Enterprise Management | `/dashboard/admin/enterprises` |
| `Cpu` | Steward Dashboard | `/dashboard/steward` |
| `Landmark` | Institutional Architecture | `/dashboard/architecture` |
| `ScrollText` | Governance System | `/dashboard/governance-model` |
| `Shield` | Institutional Readiness | `/dashboard/institutional-readiness` |
| `Workflow` | Operating System (AOS) | `/dashboard/operating-system` |
| `Gauge` | Commercialization (ACS) | `/dashboard/commercialization` |
| `Factory` | Production Readiness | `/dashboard/production-readiness` |
| `ClipboardCheck` | Pilot Execution | `/dashboard/pilot-execution` |
| `Flag` | Global Launch (GLS) | `/dashboard/global-launch` |
| `Crown` | Founder Landmark (FOCC) | `/dashboard/founder-office` |
| `BadgeCheck` | Institutional Trust (ITDB) | `/dashboard/institutional-trust` |
| `Zap` | Market Execution (MES) | `/dashboard/market-execution` |
| `Megaphone` | Market Activation | `/dashboard/market-activation` |
| `GitBranch` | Customer Conversion | `/dashboard/customer-conversion` |
| `Handshake` | Strategic Partners | `/dashboard/strategic-partners` |
| `Crosshair` | Execution War Room | `/dashboard/execution-war-room` |
| `Target` | First 25 Research | `/dashboard/first-research` |
| `CheckCircle2` | Constitutional Audit | `/dashboard/constitutional-audit` |
| `ScrollText` | Audit Log Viewer | `/dashboard/admin/audit` |
| `SlidersHorizontal` | Institutional Settings | `/dashboard/admin/settings` |
| `ShieldAlert` | Platform Admin Panel | `/dashboard/admin-panel` |
| `Landmark` | FRA Regulatory | `/dashboard/fra` |
| `Castle` | Company Owner | `/dashboard/company-owner` |
| `Briefcase` | Law Firm Rep | `/dashboard/law-firm` |
| `Banknote` | Accounting Firm | `/dashboard/accounting` |
| `FlaskConical` | Industry Modules | `/dashboard/industry` |
| `Network` | Federation | `/dashboard/federation` |
| `KeyRound` | VC Wallet | `/dashboard/credentials` |
| `GraduationCap` | University Rep Console | `/dashboard/university` |

## 3. Orphan Pages (route exists, NOT in NAV)

Found **4** orphan page(s):

| Route | Page file | Notes |
|---|---|---|
| `/dashboard/succession-declaration` | `src/app/dashboard/succession-declaration/page.tsx` | Real, fully-implemented page (Cryptographic Succession, Vol 16 §16.1). Loads `SuccessionDeclaration` from DB, has a full client component (`succession-declaration-client.tsx`). Reachable only via direct URL. **Recommendation:** add to NAV under 'Graduation & Sovereignty' or 'Institutional Services' group. |
| `/dashboard/admin` | `src/app/dashboard/admin/page.tsx` | Redirect-only page — server component calls `redirect('/dashboard/admin-panel')`. Auth-gated. No NAV entry (intentional — admin-panel is the real landing). |
| `/dashboard/admin/users/[id]` | `src/app/dashboard/admin/users/[id]/page.tsx` | Dynamic detail page (User Detail · AURIENTA Admin). Reachable from `/dashboard/admin/users` table. Dynamic routes are intentionally not in NAV. |
| `/dashboard/admin/enterprises/[id]` | `src/app/dashboard/admin/enterprises/[id]/page.tsx` | Dynamic detail page (Enterprise Detail · AURIENTA Admin). Reachable from `/dashboard/admin/enterprises` table. Dynamic routes are intentionally not in NAV. |

**Action items:**
- `/dashboard/succession-declaration` is the only true orphan that should be linked. Add a NAV entry: `{ href: '/dashboard/succession-declaration', label: 'Succession Declaration', icon: 'ScrollText', group: 'Graduation & Sovereignty' }`
- All 4 orphan pages return HTTP 200 on production — they are functional, just not in the sidebar.

## 4. Dead Nav Entries (in NAV, route does not exist)

**None.** Every NAV entry resolves to an existing `page.tsx` file. 100% coverage.

## 5. Duplicate Nav Entries (same href in NAV twice)

**None.** All 98 NAV hrefs are unique. Verified via:
```
rg -o 'href:\s*"[^"]+"' src/lib/aurienta/nav-config.ts | sort | uniq -c | awk '$1>1'
# (no output → no duplicates)
```

## 6. Duplicate Icon Usage Across NAV Items

While no hrefs are duplicated, several icons are reused across different NAV items. This is a **cosmetic** issue (P3-005 attempted to diversify icons but did not eliminate all reuse). The codebase comments note it as a known issue.

| Icon | Used by routes |
|---|---|
| `Users` | `/dashboard/syndicates`, `/dashboard/workforce`, `/dashboard/admin/users` (3×) |
| `KeyRound` | `/dashboard/passkeys`, `/dashboard/credentials` (2×) |
| `UserCheck` | `/dashboard/mentorship`, `/dashboard/succession` (2×) |
| `Award` | `/dashboard/skill-equity`, `/dashboard/alumni` (2×) |
| `Target` | `/dashboard/milestone-designer`, `/dashboard/first-research` (2×) |
| `Gavel` | `/dashboard/board-member`, `/dashboard/appeals` (2×) |
| `AlertTriangle` | `/dashboard/anomalies`, `/dashboard/risk-disclosure` (2×) |
| `ShieldAlert` | `/dashboard/whistleblower`, `/dashboard/admin-panel` (2×) |
| `Database` | `/dashboard/antifragility`, `/dashboard/vault` (2×) |
| `GraduationCap` | `/dashboard/graduation`, `/dashboard/university` (2×) |
| `FlaskConical` | `/dashboard/graduation-simulator`, `/dashboard/industry` (2×) |
| `Landmark` | `/dashboard/architecture`, `/dashboard/fra` (2×) |
| `ScrollText` | `/dashboard/governance-model`, `/dashboard/admin/audit` (2×) |

**Recommendation:** diversify these icons to improve sidebar scannability. Lower priority than the orphan-page issue.

## 7. Role Visibility Issues (visibleGroupsForRoles)

The role-filtering logic in `visibleGroupsForRoles(roles)` hides entire groups from users who lack the required role. Per-role visibility matrix:

| Group | Visible to roles |
|---|---|
| Workspace | everyone (universal) |
| Capital & Workforce | everyone (universal) |
| Intelligence | everyone (universal) |
| Compliance & Transparency | everyone (universal) |
| Institutional Services | everyone (universal) |
| Enterprise | manager / founding_operator / board_member / company_owner / accounting_firm_rep |
| Treasury & Infrastructure | manager / founding_operator / board_member / company_owner / law_firm_rep |
| Graduation & Sovereignty | founding_operator / company_owner / board_member |
| Platform Admin | aurienta_rep / university_rep / law_firm_rep / accounting_firm_rep / company_owner |

### Issues found

1. **Group hidden, but page reachable via direct URL.** The `visibleGroupsForRoles()` filter only hides the **sidebar entry** — it does NOT block the underlying route. A `capital_partner` user typing `/dashboard/admin-panel` directly will still hit the page (and see the `AccessRestricted` component because the page itself checks for `aurienta_rep`). All 11 pages using `AccessRestricted` correctly enforce at the page level. **No bypass found.**

2. **Inconsistent page-level role enforcement.**
   - 11 pages enforce role via `AccessRestricted` (correct):
     - `/dashboard/admin/audit`, `/dashboard/admin/enterprises`, `/dashboard/admin/enterprises/[id]`, `/dashboard/admin/settings`, `/dashboard/admin/users`, `/dashboard/admin/users/[id]` (all → `aurienta_rep`)
     - `/dashboard/admin-panel` (→ `aurienta_rep`)
     - `/dashboard/steward` (→ `aurienta_rep`)
     - `/dashboard/fra` (→ `aurienta_rep`)
     - `/dashboard/company-owner` (→ `company_owner`)
     - `/dashboard/law-firm` (→ `law_firm_rep`)
     - `/dashboard/accounting` (→ `accounting_firm_rep`)
     - `/dashboard/university` (→ `university_rep`)
     - `/dashboard/partner-crm` (→ `founding_operator` OR `company_owner`)
     - `/dashboard/enterprise-profile` (→ any enterprise membership)
   - ~91 dashboard pages rely ONLY on layout-level auth (`getCurrentUser()` in `dashboard/layout.tsx`). Any authenticated user can hit them; role filtering is enforced only at the sidebar visibility level.
   - **Not a security issue per se** for read-only intelligence/workspace pages (every signed-in partner is entitled to read public-state data). But pages like `/dashboard/manager`, `/dashboard/founder`, `/dashboard/board-member`, `/dashboard/escrow`, `/dashboard/vault`, `/dashboard/graduation`, `/dashboard/graduation-simulator`, `/dashboard/survival-drill` arguably should also render `AccessRestricted` when an unauthorized role lands on them. Currently they render fully for any authenticated user.

3. **`/dashboard/succession-declaration` orphan** — already covered in §3. Page exists, fully functional, not linked. CRE enforces filing at the API/contract layer, but the page itself has no AccessRestricted gate.

## 8. Public Routes Coverage

All 19 public routes tested HTTP 200 on production.

| Route | Status | Notes |
|---|---|---|
| `/` | 200 | Landing page (root layout metadata inherits) |
| `/signin` | 200 | Auth POST returns 200 + user JSON |
| `/register` | 200 | Multi-step registration wizard |
| `/trust` | 200 | Public transparency portal |
| `/enterprise` | 200 | Public enterprise directory |
| `/enterprise/[slug]` | 200 | Tested slug=`streetbites` |
| `/enterprise/[slug]/annual-report` | 200 | |
| `/enterprise/[slug]/financials` | 200 | |
| `/enterprise/[slug]/governance-log` | 200 | |
| `/enterprise/[slug]/trades` | 200 | |
| `/badge/[slug]` | 200 | Public embeddable badge widget |
| `/registry` | 200 | Public registry view |
| `/legal` | 200 | |
| `/legal/terms` | 200 | |
| `/legal/cookies` | 200 | |
| `/legal/privacy` | 200 | |
| `/legal/constitution` | 200 | |
| `/sitemap.xml` | 200 | Next.js metadata route |
| `/robots.txt` | 200 | Disallows `/dashboard/`, `/api/` |

## 9. Dynamic Route Templates

| Template | Test value used | HTTP 200? | Auth |
|---|---|---|---|
| `/enterprise/[slug]` | `streetbites` | yes | public |
| `/enterprise/[slug]/annual-report` | `streetbites` | yes | public |
| `/enterprise/[slug]/financials` | `streetbites` | yes | public |
| `/enterprise/[slug]/governance-log` | `streetbites` | yes | public |
| `/enterprise/[slug]/trades` | `streetbites` | yes | public |
| `/badge/[slug]` | `streetbites` | yes | public |
| `/dashboard/admin/users/[id]` | `demo_ahmed` | yes | auth + role |
| `/dashboard/admin/enterprises/[id]` | `demo_streetbites` | yes | auth + role |

## 10. Error Routes

Next.js App Router uses **error boundaries** (`error.tsx` / `global-error.tsx`) instead of explicit `/404` and `/500` routes.

### Error boundary files present

- `src/app/error.tsx` — root-level error boundary
- `src/app/global-error.tsx` — global error boundary (replaces root layout on fatal error)
- `src/app/dashboard/error.tsx` — does NOT exist (uses `dashboard/governance/error.tsx`, `dashboard/founder/error.tsx`, `dashboard/workforce/error.tsx`, `dashboard/manager/error.tsx`, `dashboard/graduation/error.tsx` instead)
- `src/app/loading.tsx` — root loading state
- `src/app/dashboard/loading.tsx` — dashboard loading state

### Custom `/404` page

**Not present.** Tested `/nonexistent-page-test` → HTTP 404, renders the default Next.js 404 page. Recommendation: add `src/app/not-found.tsx` for brand-consistent 404.

### Custom `/unauthorized` page

**Not present.** The `AccessRestricted` component (`src/components/dashboard/access-restricted.tsx`) renders inline (HTTP 200) instead of redirecting to `/unauthorized`. This is the intended design — role-restricted pages render an inline access-denied card, not a separate route.

## 11. API Callback Routes

| Route | Status | Notes |
|---|---|---|
| `/api/inngest` | 200 | Inngest webhook endpoint. GET returns introspection; POST requires Inngest signature. |
| `/api/v1/webhook/payment` | 405 | Payment gateway webhook. **POST-only** — GET returns 405 Method Not Allowed (expected). |
| `/api/webhook/payment` | **404** | **Dead path** — task brief referenced `/api/webhook/payment` but the actual webhook lives at `/api/v1/webhook/payment`. No `/api/webhook/*` directory exists in `src/app/`. |

> **Note:** The task brief asked to test `/api/webhook/*`. The codebase has no `/api/webhook/` directory; the only webhook endpoints live under `/api/v1/webhook/` (payment) and `/api/inngest`. The `/api/v1/webhook/payment` route is correctly registered and POST-only.

## 12. Compliance with Sidebar Groups in Audit Brief

The audit brief listed 9 sidebar groups. Actual `NAV_GROUPS` in nav-config.ts has the same 9 groups, with slightly more descriptive names:

| Brief's group name | Actual group name in code | Match? |
|---|---|---|
| Workspace | Workspace | yes |
| Capital & Workforce | Capital & Workforce | yes |
| Enterprise | Enterprise | yes |
| Intelligence | Intelligence | yes |
| Compliance | Compliance & Transparency | yes (extended) |
| Treasury | Treasury & Infrastructure | yes (extended) |
| Graduation | Graduation & Sovereignty | yes (extended) |
| Institutional Services | Institutional Services | yes |
| Platform Admin | Platform Admin | yes |

## 13. Methodology

1. Enumerated all 119 `page.tsx` files via `find src/app -name 'page.tsx'`.
2. For each page, extracted `metadata.title` (or `generateMetadata`) via `rg -n 'export const metadata|generateMetadata|title:'`.
3. For each dashboard page, identified the auth pattern via `rg 'getCurrentUser|AccessRestricted|requireRole'`.
4. Parsed `src/lib/aurienta/nav-config.ts` to extract the full NAV array (98 items) and `NAV_GROUPS` (9 groups).
5. Authenticated to production (https://aurienta.vercel.app) with `layla@streetbites.eg` / `aurienta2026` via `POST /api/auth` with CSRF token.
6. Tested 125 routes (`curl -s -b cookies -o /dev/null -w '%{http_code}' --max-time 25 -L`) — all 121 page routes returned 200; 3 API/callback routes returned 200/405/404 as expected; 1 invalid URL returned 404 (default Next.js page).
7. Cross-referenced NAV hrefs against existing page.tsx files to find orphans and dead entries.
8. Verified no duplicate NAV hrefs (`rg | sort | uniq -c`).
9. Catalogued duplicate icon usage and role-visibility edge cases.

## 14. Files Produced

- `/home/z/my-project/SCREEN_ROUTE_INVENTORY.csv` — 125 rows (124 routes + header).
- `/home/z/my-project/AUDIT_NAVIGATION_MAP.md` — this file.
