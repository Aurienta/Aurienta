# AURIENTA — Route Inventory (Static Architectural Audit)

**Scope:** Every `page.tsx` under `src/app/dashboard/` (87 routes) cross-referenced against the sidebar `NAV` array (83 items).
**Audit task:** AUDIT-1-STATIC (sections 4, 11, 12, 13, 16, 17, 28, 33).
**Method:** Static file-system + source read. No runtime crawl.

---

## 1. Summary numbers

| Metric | Value |
|--------|-------|
| Sidebar `NAV` items | **83** |
| Dashboard route files (`page.tsx`) | **87** |
| Routes with a matching sidebar item | **83** |
| Broken nav (nav item → missing route) | **0** |
| Orphaned routes (route exists, no sidebar item) | **4** (3 expected drill-downs + 1 profile page) |
| Non-sidebar navigation entries | **1** (`/dashboard/profile` via avatar dropdown) |
| Server-side redirect routes | **1** (`/dashboard/admin` → `/dashboard/admin-panel`) |
| Routes with `loading.tsx` | 9 |
| Routes with `error.tsx` | 4 |

---

## 2. Route classification scheme

Every route is tagged with one of:

| Tag | Meaning |
|------|---------|
| **WORKING** | Sidebar item exists, route exists, page renders content (not a redirect), reachable. |
| **WORKING-DETAIL** | Drill-down detail page reachable from a list page; not in sidebar by design. |
| **WORKING-REDIRECT** | Server-side redirect stub; not in sidebar by design. |
| **WORKING-EXTERNAL** | Reachable only through a non-sidebar affordance (avatar dropdown, FAB, etc.). |
| **ORPHANED** | Route file exists but no nav/UI path leads to it. |
| **BROKEN** | Sidebar item exists but route file is missing. |
| **WRONG-ROUTE** | Sidebar item links to a route whose semantic content does not match its label. |
| **WRONG-DASHBOARD** | Sidebar item is grouped/placed under a role that does not own the underlying function. |

---

## 3. Master route inventory

> Sorted by URL. `NAV?` = present in sidebar `NAV` array. `Reachable via` lists every UI affordance that links to the route.

| # | Route | NAV? | Classification | Reachable via |
|----|------|------|----------------|---------------|
| 1 | `/dashboard` | YES (Overview) | WORKING | Sidebar, brand logo, ⌘K palette |
| 2 | `/dashboard/accounting` | YES (Accounting Firm) | WORKING | Sidebar (Platform Admin) |
| 3 | `/dashboard/admin` | NO | WORKING-REDIRECT | Direct URL only; redirects to `/dashboard/admin-panel` |
| 4 | `/dashboard/admin-panel` | YES (Platform Admin Panel) | WORKING | Sidebar (Platform Admin) |
| 5 | `/dashboard/admin/audit` | YES (Audit Log Viewer) | WORKING | Sidebar (Platform Admin) |
| 6 | `/dashboard/admin/enterprises` | YES (Enterprise Management) | WORKING | Sidebar (Platform Admin) |
| 7 | `/dashboard/admin/enterprises/[id]` | NO | WORKING-DETAIL | Drill-down from #6 |
| 8 | `/dashboard/admin/settings` | YES (Institutional Settings) | WORKING | Sidebar (Platform Admin) |
| 9 | `/dashboard/admin/users` | YES (Partner Management) | WORKING | Sidebar (Platform Admin) |
| 10 | `/dashboard/admin/users/[id]` | NO | WORKING-DETAIL | Drill-down from #9 |
| 11 | `/dashboard/alumni` | YES (Alumni Hall) | WORKING | Sidebar (Graduation & Sovereignty) |
| 12 | `/dashboard/anomalies` | YES (Anomaly Narration) | WORKING | Sidebar (Intelligence) |
| 13 | `/dashboard/antifragility` | YES (Anti-Fragility Vault) | WORKING | Sidebar (Treasury & Infrastructure) |
| 14 | `/dashboard/appeals` | YES (Appeal Court) | WORKING | Sidebar (Compliance & Transparency) |
| 15 | `/dashboard/architecture` | YES (Institutional Architecture) | WORKING | Sidebar (Platform Admin) |
| 16 | `/dashboard/board-briefings` | YES (Board Briefings) | WORKING | Sidebar (Enterprise) |
| 17 | `/dashboard/board-member` | YES (Board Member Console) | WORKING | Sidebar (Enterprise) |
| 18 | `/dashboard/brain-ai` | YES (Brain AI Status) | WORKING | Sidebar (Intelligence) |
| 19 | `/dashboard/calendar` | YES (Constitutional Calendar) | WORKING | Sidebar (Workspace), ⌘K palette, Quick Actions |
| 20 | `/dashboard/career-ledger` | YES (Career Ledger) | WORKING | Sidebar (Capital & Workforce) |
| 21 | `/dashboard/charter-diff` | YES (Charter Diff) | WORKING | Sidebar (Intelligence) |
| 22 | `/dashboard/commercialization` | YES (Commercialization (ACS)) | WORKING | Sidebar (Platform Admin) |
| 23 | `/dashboard/company-owner` | YES (Company Owner) | WORKING | Sidebar (Platform Admin) |
| 24 | `/dashboard/compliance` | YES (Compliance) | WORKING | Sidebar (Compliance & Transparency), ⌘K palette, Quick Actions (governance vote), Help button |
| 25 | `/dashboard/constitution` | YES (Constitution Guide) | WORKING | Sidebar (Intelligence), Help button |
| 26 | `/dashboard/constitutional-audit` | YES (Constitutional Audit) | WORKING | Sidebar (Platform Admin) |
| 27 | `/dashboard/copilot` | YES (AI Copilot) | WORKING | Sidebar (Intelligence), ⌘K palette, Quick Actions, Help button |
| 28 | `/dashboard/credentials` | YES (VC Wallet) | WORKING | Sidebar (Platform Admin) |
| 29 | `/dashboard/customer-conversion` | YES (Customer Conversion) | WORKING | Sidebar (Platform Admin) |
| 30 | `/dashboard/diaspora` | YES (Diaspora Bridge) | WORKING | Sidebar (Capital & Workforce) |
| 31 | `/dashboard/drift` | YES (Drift Detector) | WORKING | Sidebar (Intelligence) |
| 32 | `/dashboard/drip` | YES (DRIP (Dividend Reinvest)) | WORKING | Sidebar (Institutional Services) |
| 33 | `/dashboard/enterprise-profile` | YES (Enterprise Profile) | WORKING | Sidebar (Enterprise) |
| 34 | `/dashboard/escrow` | YES (Law Firm Client Accounts) | WORKING | Sidebar (Treasury & Infrastructure) |
| 35 | `/dashboard/execution-war-room` | YES (Execution War Room) | WORKING | Sidebar (Platform Admin) |
| 36 | `/dashboard/federation` | YES (Federation) | WORKING | Sidebar (Platform Admin) |
| 37 | `/dashboard/first-research` | YES (First 25 Research) | WORKING | Sidebar (Platform Admin) |
| 38 | `/dashboard/founder` | YES (Founding Operator Studio) | WORKING | Sidebar (Enterprise), ⌘K palette |
| 39 | `/dashboard/founder-office` | YES (Founder Office (FOCC)) | WORKING | Sidebar (Platform Admin) |
| 40 | `/dashboard/fra` | YES (FRA Regulatory) | WORKING | Sidebar (Platform Admin) |
| 41 | `/dashboard/global-launch` | YES (Global Launch (GLS)) | WORKING | Sidebar (Platform Admin) |
| 42 | `/dashboard/governance` | YES (Governance) | WORKING | Sidebar (Enterprise), ⌘K palette, Quick Actions |
| 43 | `/dashboard/governance-model` | YES (Governance System) | WORKING | Sidebar (Platform Admin) |
| 44 | `/dashboard/graduation` | YES (Graduation) | WORKING | Sidebar (Graduation & Sovereignty), ⌘K palette, Quick Actions |
| 45 | `/dashboard/graduation-coach` | YES (Graduation Coach) | WORKING | Sidebar (Graduation & Sovereignty) |
| 46 | `/dashboard/graduation-simulator` | YES (Graduation Simulator) | WORKING | Sidebar (Graduation & Sovereignty) |
| 47 | `/dashboard/industry` | YES (Industry Modules) | WORKING | Sidebar (Platform Admin) |
| 48 | `/dashboard/institutional-memory` | YES (Institutional Memory) | WORKING | Sidebar (Treasury & Infrastructure) |
| 49 | `/dashboard/institutional-readiness` | YES (Institutional Readiness) | WORKING | Sidebar (Platform Admin) |
| 50 | `/dashboard/institutional-trust` | YES (Institutional Trust (ITDB)) | WORKING | Sidebar (Platform Admin) |
| 51 | `/dashboard/ir` | YES (Capital Partner Relations) | WORKING | Sidebar (Institutional Services) |
| 52 | `/dashboard/law-firm` | YES (Law Firm Rep) | WORKING | Sidebar (Platform Admin) |
| 53 | `/dashboard/manager` | YES (Manager Console) | WORKING | Sidebar (Enterprise), ⌘K palette, Quick Actions |
| 54 | `/dashboard/market` | YES (Enterprise Registry) | WORKING | Sidebar (Workspace), ⌘K palette, Quick Actions |
| 55 | `/dashboard/market-activation` | YES (Market Activation) | WORKING | Sidebar (Platform Admin) |
| 56 | `/dashboard/market-execution` | YES (Market Execution (MES)) | WORKING | Sidebar (Platform Admin) |
| 57 | `/dashboard/mentorship` | YES (Mentorship) | WORKING | Sidebar (Capital & Workforce) |
| 58 | `/dashboard/milestone-designer` | YES (Milestone Designer) | WORKING | Sidebar (Enterprise) |
| 59 | `/dashboard/notifications` | YES (Notifications) | WORKING | Sidebar (Intelligence), top-bar bell, ⌘K palette, Quick Actions |
| 60 | `/dashboard/operating-system` | YES (Operating System (AOS)) | WORKING | Sidebar (Platform Admin) |
| 61 | `/dashboard/opportunities` | YES (Capital Participation) | WORKING | Sidebar (Workspace), ⌘K palette, Quick Actions |
| 62 | `/dashboard/oracle-mirror` | YES (Oracle Mirror) | WORKING | Sidebar (Treasury & Infrastructure) |
| 63 | `/dashboard/partner-crm` | YES (Partner CRM) | WORKING | Sidebar (Enterprise) |
| 64 | `/dashboard/pilot-execution` | YES (Pilot Execution) | WORKING | Sidebar (Platform Admin) |
| 65 | `/dashboard/pitch-deck` | YES (Pitch Deck Generator) | WORKING | Sidebar (Enterprise) |
| 66 | `/dashboard/portfolio` | YES (Constitutional Holdings) | WORKING | Sidebar (Workspace), ⌘K palette, Quick Actions |
| 67 | `/dashboard/precedents` | YES (Precedent Engine) | WORKING | Sidebar (Intelligence) |
| 68 | `/dashboard/priority-windows` | YES (Priority Windows) | WORKING | Sidebar (Workspace), ⌘K palette, Quick Actions |
| 69 | `/dashboard/production-readiness` | YES (Production Readiness) | WORKING | Sidebar (Platform Admin) |
| 70 | `/dashboard/profile` | **NO** | WORKING-EXTERNAL (P1-002) | Avatar dropdown only |
| 71 | `/dashboard/reality-sync` | YES (Reality Sync) | WORKING | Sidebar (Treasury & Infrastructure) |
| 72 | `/dashboard/risk-disclosure` | YES (Risk Disclosure) | WORKING | Sidebar (Compliance & Transparency) |
| 73 | `/dashboard/salary` | YES (AI Salary Engine) | WORKING | Sidebar (Capital & Workforce) |
| 74 | `/dashboard/skill-equity` | YES (Skill-to-Equity) | WORKING | Sidebar (Capital & Workforce) |
| 75 | `/dashboard/solvency` | YES (Proof-of-Solvency) | WORKING | Sidebar (Treasury & Infrastructure) |
| 76 | `/dashboard/steward` | YES (Steward Dashboard) | WORKING | Sidebar (Platform Admin) |
| 77 | `/dashboard/strategic-partners` | YES (Strategic Partners) | WORKING | Sidebar (Platform Admin) |
| 78 | `/dashboard/succession` | YES (Succession Planner) | WORKING | Sidebar (Enterprise) |
| 79 | `/dashboard/survival-drill` | YES (Survival Drill) | WORKING | Sidebar (Graduation & Sovereignty) |
| 80 | `/dashboard/syndicates` | YES (Syndicates) | WORKING | Sidebar (Capital & Workforce) |
| 81 | `/dashboard/tax` | YES (Tax Optimizer) | WORKING | Sidebar (Institutional Services) |
| 82 | `/dashboard/university` | YES (University Rep Console) | WORKING (but see P1-001: role gating wrong) | Sidebar (Platform Admin) |
| 83 | `/dashboard/updates` | YES (Enterprise Updates) | WORKING | Sidebar (Workspace) |
| 84 | `/dashboard/vault` | YES (Insurance Vault) | WORKING | Sidebar (Treasury & Infrastructure) |
| 85 | `/dashboard/vendor-portal` | YES (Vendor Portal) | WORKING | Sidebar (Compliance & Transparency) |
| 86 | `/dashboard/whistleblower` | YES (Whistleblower) | WORKING | Sidebar (Compliance & Transparency) |
| 87 | `/dashboard/workforce` | YES (Workforce Registry) | WORKING | Sidebar (Compliance & Transparency) |

---

## 4. Orphaned-route detail

### `/dashboard/admin`  (route #3, classification WORKING-REDIRECT)
- File: `src/app/dashboard/admin/page.tsx`
- Behaviour: server-component `redirect("/dashboard/admin-panel")`.
- Reason not in sidebar: thin redirect only — there is no "Admin root" landing page in the blueprint. Acceptable.
- **Action:** None required. Documented here for completeness.

### `/dashboard/admin/users/[id]`  (route #10, WORKING-DETAIL)
- File: `src/app/dashboard/admin/users/[id]/page.tsx`
- Reachable from: Partner Management list (`/dashboard/admin/users`).
- Reason not in sidebar: dynamic `[id]` segment; drill-down pattern.
- **Action:** None required.

### `/dashboard/admin/enterprises/[id]`  (route #7, WORKING-DETAIL)
- File: `src/app/dashboard/admin/enterprises/[id]/page.tsx`
- Reachable from: Enterprise Management list (`/dashboard/admin/enterprises`).
- Reason not in sidebar: dynamic `[id]` segment; drill-down pattern.
- **Action:** None required.

### `/dashboard/profile`  (route #70, WORKING-EXTERNAL — P1-002)
- File: `src/app/dashboard/profile/page.tsx` (231 lines, fully implemented).
- Reachable from: **only** the avatar dropdown (`dashboard-shell.tsx` line 626, `Profile & Identity`).
- Issue: There is no sidebar entry for Profile. Users on small screens (where the avatar dropdown is hidden behind a hamburger) and users navigating by sidebar never discover this page. The Breadcrumbs component renders "Workspace / Profile" with no matching sidebar highlight. See P1-002 in §7.

---

## 5. Wrong-route / wrong-dashboard mappings

None confirmed as truly wrong (i.e. user clicks label A and lands on page B with different semantic content). However, the following items have a **label↔slug semantic mismatch** (label uses different terminology than the route slug). They are functional but the discrepancy should be documented and reconciled:

| Sidebar label | Route slug | Notes |
|---------------|------------|-------|
| Constitutional Holdings | `/portfolio` | Slug `portfolio` is legacy; label was renamed. |
| Capital Participation | `/opportunities` | Slug `opportunities` is legacy; label was renamed. |
| Enterprise Registry | `/market` | Slug `market` is legacy; label was renamed. |
| Founding Operator Studio | `/founder` | Slug `founder` is legacy; label was renamed. |
| Law Firm Client Accounts | `/escrow` | Slug `escrow` is legacy; label was renamed. |
| Partner Management | `/admin/users` | Slug `users`; label "Partner Management". |
| Audit Log Viewer | `/admin/audit` | OK |
| Institutional Settings | `/admin/settings` | OK |
| Platform Admin Panel | `/admin-panel` | Slug `admin-panel`; label "Platform Admin Panel". |
| FRA Regulatory | `/fra` | OK |
| VC Wallet | `/credentials` | Slug `credentials`; label "VC Wallet" (Verifiable Credentials). |
| University Rep Console | `/university` | OK |
| First 25 Research | `/first-research` | Slug drops "25"; label includes it. |
| Anti-Fragility Vault | `/antifragility` | OK |
| Insurance Vault | `/vault` | OK |
| Constitutional Audit | `/constitutional-audit` | OK |

These are documentation-grade inconsistencies — **not** broken routes.

---

## 6. Breadcrumb vs. NAV label mismatches

The `Breadcrumbs` component (`ux/enhancements.tsx` lines 11–42) derives labels from URL slugs (`split("-").map(titleCase).join(" ")`) and therefore drifts from the humanized NAV labels on many routes. Examples:

| Route | Breadcrumb label | NAV label | Severity |
|-------|------------------|-----------|----------|
| `/dashboard/portfolio` | "Portfolio" | "Constitutional Holdings" | P3 |
| `/dashboard/opportunities` | "Opportunities" | "Capital Participation" | P3 |
| `/dashboard/market` | "Market" | "Enterprise Registry" | P3 |
| `/dashboard/priority-windows` | "Priority Windows" | "Priority Windows" | OK |
| `/dashboard/board-member` | "Board Member" | "Board Member Console" | P3 |
| `/dashboard/admin-panel` | "Admin Panel" | "Platform Admin Panel" | P3 |
| `/dashboard/first-research` | "First Research" | "First 25 Research" | P3 |
| `/dashboard/admin/users` | "Workspace / Admin / Users" | (in sidebar as "Partner Management") | P3 |
| `/dashboard/founder-office` | "Founder Office" | "Founder Office (FOCC)" | P3 |
| `/dashboard/institutional-trust` | "Institutional Trust" | "Institutional Trust (ITDB)" | P3 |
| `/dashboard/market-execution` | "Market Execution" | "Market Execution (MES)" | P3 |
| `/dashboard/commercialization` | "Commercialization" | "Commercialization (ACS)" | P3 |
| `/dashboard/global-launch` | "Global Launch" | "Global Launch (GLS)" | P3 |
| `/dashboard/operating-system` | "Operating System" | "Operating System (AOS)" | P3 |
| `/dashboard/profile` | "Workspace / Profile" | (not in sidebar — orphaned) | P1-002 |
| `/dashboard/admin` | (redirect — never reaches breadcrumb) | n/a | OK |

**Root cause:** breadcrumbs are computed from the URL slug rather than looked up against `NAV`. Fix proposal: replace the slug-derived label with a `NAV_I18N`-driven lookup so breadcrumb labels mirror sidebar labels exactly. (See P2-002.)

---

## 7. P0 / P1 / P2 / P3 findings (numbered)

### P0 — broken / blocking
- **None found.** All 83 sidebar items resolve to an existing `page.tsx`. No broken nav.

### P1 — wrong-dashboard / role-gating defects

**P1-001 — `university_rep` cannot reach its own console via the sidebar.**
- The role `university_rep` exists in `ROLE_META` and in the Prisma schema (`prisma/schema.prisma` line 253) and is selectable in the `RoleSwitcher`.
- The page `/dashboard/university` ("University Rep Console") lives in the **Platform Admin** group.
- `visibleGroupsForRoles()` only unlocks Platform Admin for `aurienta_rep`, `law_firm_rep`, `accounting_firm_rep`, `company_owner`. **`university_rep` is NOT in that list.**
- A user whose only role is `university_rep` will see only the 5 universal groups (Workspace / Capital & Workforce / Intelligence / Compliance & Transparency / Institutional Services) — i.e. 30 routes, none of which is the University Rep Console.
- Impact: university reps lose their primary tool. They can still reach it via ⌘K palette if they know the URL, or by direct URL entry. Neither path is discoverable.
- Recommended fix: add `university_rep` to the Platform Admin visibility rule in `visibleGroupsForRoles()`. (Do NOT fix in this audit pass — orchestrator batches fixes.)

**P1-002 — `/dashboard/profile` has no sidebar entry.**
- The page exists, is fully implemented (231 lines, fetches audit/ledger/proposal/vote counts), and is the user's only way to view their Sovereign Trust Score detail, pledge signature date, police-clearance expiry, KYC verification status, and audit/ledger counts.
- The only path to it is the avatar dropdown ("Profile & Identity", `dashboard-shell.tsx` line 626).
- On mobile, the avatar dropdown collapses into a hamburger menu — users navigating by hamburger → sidebar will never find Profile.
- When the user lands on `/dashboard/profile`, no sidebar item highlights as active (the active-state check `pathname === item.href` finds no match), so the user loses their place in the navigation tree.
- Recommended fix: add a "Profile & Identity" item to the Workspace (or Institutional Services) group, OR ensure the avatar dropdown is reachable from the mobile sidebar header.

### P2 — coverage / consistency gaps

**P2-001 — ⌘K Command Palette exposes only 14 of 83 routes.**
- File: `src/components/dashboard/ux/command-palette.tsx`, `COMMANDS` const (lines 47–80).
- Listed destinations: Overview, Portfolio, Opportunities, Market, Governance, Manager, Founder, Compliance, Graduation, Alumni, Copilot, Calendar, Notifications, Priority Windows.
- Missing 69 routes including: Enterprise Profile, Pitch Deck, Milestone Designer, Board Member, Board Briefings, Succession, Partner CRM, Syndicates, Career Ledger, Mentorship, Skill-to-Equity, Salary, Diaspora, Brain AI, Precedents, Drift, Anomalies, Charter Diff, Constitution, Workforce, Whistleblower, Appeals, Risk Disclosure, Vendor Portal, Escrow, Antifragility, Vault, Solvency, Oracle Mirror, Reality Sync, Institutional Memory, Graduation Coach, Graduation Simulator, Survival Drill, Tax, IR, DRIP, and all 31 Platform Admin routes.
- Impact: power users who rely on ⌘K cannot reach most features without remembering URLs.
- Recommended fix: derive the COMMANDS list programmatically from the same `NAV` array the sidebar uses (perhaps in a shared `nav-config.ts` module), so palette coverage is always 1:1 with the sidebar.

**P2-002 — Breadcrumbs derive labels from URL slugs, not NAV labels.**
- File: `src/components/dashboard/ux/enhancements.tsx` lines 11–42.
- Causes label drift documented in §6.
- Recommended fix: look up each pathname segment against the `NAV` array (after stripping dynamic `[id]` segments) and fall back to titleCase only for unknown paths.

### P3 — cosmetic / documentation

**P3-001 — Stale comment in `dashboard-shell.tsx` line 209.**
- Comment says `// ── Platform Admin (10) ──` but the group actually contains **31** items.
- Other group count comments are also stale (e.g. line 155 says `(5)` but Capital & Workforce has 6; line 193 says `(5)` but Treasury has 7).
- Recommended fix: re-count, or delete the inline count comments.

**P3-002 — Onboarding tour copy is outdated.**
- File: `src/components/dashboard/ux/enhancements.tsx` line 167.
- Text: "9 groups, 51 features."
- Reality: 9 groups, **83** features.
- Recommended fix: either update the literal to 83 or compute it from `NAV.length`.

**P3-003 — Quick Actions has no entry for institutional reps.**
- File: `src/components/dashboard/ux/enhancements.tsx` lines 295–301.
- Roles covered: `capital_partner`, `board_member`, `founding_operator`, `manager`, `workforce_partner`.
- Roles NOT covered: `company_owner`, `law_firm_rep`, `accounting_firm_rep`, `aurienta_rep`, `university_rep`.
- A pure `law_firm_rep` or `accounting_firm_rep` lands with a floating "+" button that, when opened, yields zero actions.
- Recommended fix: add at least one role-appropriate action per institutional-rep role (e.g. "Review escrow releases" → `/dashboard/escrow` for `law_firm_rep`; "Approve milestone releases" → `/dashboard/admin/audit` for `accounting_firm_rep`).

**P3-004 — Sign-in redirect target outdated.**
- File: `src/app/dashboard/layout.tsx` line 8.
- Code: `redirect("/signin?next=/dashboard/portfolio")`.
- After the REMED-1D fix that turned `/dashboard` into a real Overview page, signed-out users hitting `/dashboard/*` are sent to `/signin?next=/dashboard/portfolio` regardless of which sub-route they tried. The `next=` should be `next=/dashboard` (Overview) or, better, `next=${pathname}` to preserve intent.
- Recommended fix: capture the requested pathname and pass it as `next=`.

**P3-005 — Duplicate icons across nav items.**
- Not a functional defect, but listed here for the design-system audit.
- Duplicates: `Building2` (×3), `ShieldCheck` (×3), `Calculator` (×3), `TrendingUp` (×5), `Scale` (×3), `Award` (×2), `Users` (×2), `UserCheck` (×2), `AlertTriangle` (×2), `Database` (×2), `GraduationCap` (×2), `ShieldAlert` (×2), `FileText` (×1, used once), `Crown` (×1, used once).
- Recommended fix: introduce a per-item icon pass in a follow-up design audit.

**P3-006 — Group-order reorder logic is operator-only.**
- File: `src/components/dashboard/dashboard-shell.tsx` `groupOrderForRoles()` (lines 260–266).
- Only `manager` / `founding_operator` get Enterprise-first ordering.
- `board_member` (who also lives in Enterprise) and `company_owner` (who has Platform Admin) keep the default Workspace-first order.
- This may be intentional, but should be confirmed by product.
- Recommended action: confirm with product whether Enterprise-first should apply to all Enterprise-group roles.

---

## 8. Per-page auth-guard coverage (out of scope for this static pass)

The dashboard layout (`src/app/dashboard/layout.tsx`) gates the entire dashboard at the **session** level only. Per-route role enforcement is the responsibility of each `page.tsx` (and its underlying API routes). A spot-check of several pages showed they typically call `getCurrentUser()` and re-fetch data; they do NOT appear to call a `requireRole()` helper.

A dedicated runtime/behavioural audit (Section B) should verify, for each of the 31 Platform Admin routes, that a non-admin user (e.g. pure `capital_partner`) cannot load the page content. This is captured as a follow-up — out of scope for AUDIT-1-STATIC.
