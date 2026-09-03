# AURIENTA — Canonical Navigation Map

**Source of truth:** `src/components/dashboard/dashboard-shell.tsx` — `NAV` array (lines 145–246), `visibleGroupsForRoles()` (lines 288–342), `groupOrderForRoles()` (lines 260–266).
**Audit task:** AUDIT-1-STATIC (sections 4, 5, 11, 12, 13, 16, 17, 28, 33)
**Captured at:** Static read of the repo — no runtime crawl.
**Total nav items:** 83 across 9 groups.
**Total dashboard routes:** 87 (83 nav-linked + 4 orphan detail/redirect routes).

---

## 1. Sidebar architecture summary

The dashboard shell renders a single fixed sidebar for ALL authenticated users. Visibility of nav groups is filtered by the user's role set (`visibleGroupsForRoles()`); the order of groups is reordered for operators (`groupOrderForRoles()`); individual nav items are NOT filtered — only whole groups. Sidebar groups are collapsible; the active group auto-expands. A separate **RoleSwitcher** in the top bar lets a multi-role user pick which role they're acting as (client-only — every API call still enforces server-side authorization).

**Auth guard:** `src/app/dashboard/layout.tsx` calls `getCurrentUser()` and `redirect("/signin?next=/dashboard/portfolio")` on failure. There is no per-route role middleware beyond the layout — individual pages must self-guard. (See `src/middleware.ts` for the global edge middleware, which is a session gate only.)

---

## 2. Group order & universal visibility

Default group order (capital partners and most roles):

```
1. Workspace
2. Capital & Workforce
3. Enterprise
4. Intelligence
5. Compliance & Transparency
6. Treasury & Infrastructure
7. Graduation & Sovereignty
8. Institutional Services
9. Platform Admin
```

Reordered for operators (manager, founding_operator):

```
1. Enterprise          ← surfaces first
2. Workspace
3. Intelligence
4. Capital & Workforce
5. Compliance & Transparency
6. Treasury & Infrastructure
7. Graduation & Sovereignty
8. Institutional Services
9. Platform Admin
```

**Universal groups** (visible to every authenticated user regardless of role):
- Workspace
- Capital & Workforce
- Intelligence
- Compliance & Transparency
- Institutional Services

**Role-gated groups** — see §4 (Tab Availability Matrix).

---

## 3. Full NAV inventory (canonical)

> Schema: `# | href | label | icon | group`

### Group 1 — Workspace (7 items, universal)

| # | href | label | icon | i18n key |
|---|------|-------|------|----------|
| 1 | `/dashboard` | Overview | `LayoutDashboard` | `nav.overview` |
| 2 | `/dashboard/portfolio` | Constitutional Holdings | `Wallet` | `nav.portfolio` |
| 3 | `/dashboard/opportunities` | Capital Participation | `Compass` | `nav.opportunities` |
| 4 | `/dashboard/market` | Enterprise Registry | `LineChart` | `nav.market` |
| 5 | `/dashboard/priority-windows` | Priority Windows | `Hourglass` | `nav.priorityWindows` |
| 6 | `/dashboard/calendar` | Constitutional Calendar | `CalendarDays` | `nav.calendar` |
| 7 | `/dashboard/updates` | Enterprise Updates | `Newspaper` | `nav.updates` |

### Group 2 — Capital & Workforce (6 items, universal)

| # | href | label | icon | i18n key |
|---|------|-------|------|----------|
| 8 | `/dashboard/syndicates` | Syndicates | `Users` | `nav.syndicates` |
| 9 | `/dashboard/career-ledger` | Career Ledger | `HardHat` | `nav.careerLedger` |
| 10 | `/dashboard/mentorship` | Mentorship | `UserCheck` | `nav.mentorship` |
| 11 | `/dashboard/skill-equity` | Skill-to-Equity | `Award` | `nav.skillEquity` |
| 12 | `/dashboard/salary` | AI Salary Engine | `Calculator` | `nav.salary` |
| 13 | `/dashboard/diaspora` | Diaspora Bridge | `Globe` | `nav.diaspora` |

### Group 3 — Enterprise (10 items, role-gated)

| # | href | label | icon | i18n key |
|---|------|-------|------|----------|
| 14 | `/dashboard/governance` | Governance | `Scale` | `nav.governance` |
| 15 | `/dashboard/manager` | Manager Console | `Settings2` | `nav.manager` |
| 16 | `/dashboard/founder` | Founding Operator Studio | `Rocket` | `nav.founder` |
| 17 | `/dashboard/enterprise-profile` | Enterprise Profile | `Building2` | `nav.enterpriseProfile` |
| 18 | `/dashboard/pitch-deck` | Pitch Deck Generator | `Presentation` | `nav.pitchDeck` |
| 19 | `/dashboard/milestone-designer` | Milestone Designer | `Target` | `nav.milestoneDesigner` |
| 20 | `/dashboard/board-member` | Board Member Console | `Gavel` | `nav.boardMember` |
| 21 | `/dashboard/board-briefings` | Board Briefings | `ClipboardList` | `nav.boardBriefings` |
| 22 | `/dashboard/succession` | Succession Planner | `UserCheck` | `nav.succession` |
| 23 | `/dashboard/partner-crm` | Partner CRM | `Contact` | `nav.partnerCrm` |

### Group 4 — Intelligence (8 items, universal)

| # | href | label | icon | i18n key |
|---|------|-------|------|----------|
| 24 | `/dashboard/brain-ai` | Brain AI Status | `Brain` | `nav.brainAi` |
| 25 | `/dashboard/precedents` | Precedent Engine | `FileSearch` | `nav.precedents` |
| 26 | `/dashboard/drift` | Drift Detector | `TrendingUp` | `nav.drift` |
| 27 | `/dashboard/anomalies` | Anomaly Narration | `AlertTriangle` | `nav.anomalies` |
| 28 | `/dashboard/charter-diff` | Charter Diff | `GitCompare` | `nav.charterDiff` |
| 29 | `/dashboard/constitution` | Constitution Guide | `Languages` | `nav.constitutionGuide` |
| 30 | `/dashboard/notifications` | Notifications | `Bell` | `nav.notifications` |
| 31 | `/dashboard/copilot` | AI Copilot | `Bot` | `nav.copilot` |

### Group 5 — Compliance & Transparency (6 items, universal)

| # | href | label | icon | i18n key |
|---|------|-------|------|----------|
| 32 | `/dashboard/compliance` | Compliance | `ShieldCheck` | `nav.compliance` |
| 33 | `/dashboard/workforce` | Workforce Registry | `Users` | `nav.workforce` |
| 34 | `/dashboard/whistleblower` | Whistleblower | `ShieldAlert` | `nav.whistleblower` |
| 35 | `/dashboard/appeals` | Appeal Court | `Gavel` | `nav.appeals` |
| 36 | `/dashboard/risk-disclosure` | Risk Disclosure | `AlertTriangle` | `nav.riskDisclosure` |
| 37 | `/dashboard/vendor-portal` | Vendor Portal | `Truck` | `nav.vendorPortal` |

### Group 6 — Treasury & Infrastructure (7 items, role-gated)

| # | href | label | icon | i18n key |
|---|------|-------|------|----------|
| 38 | `/dashboard/escrow` | Law Firm Client Accounts | `Vault` | `nav.escrow` |
| 39 | `/dashboard/antifragility` | Anti-Fragility Vault | `Database` | `nav.antifragility` |
| 40 | `/dashboard/vault` | Insurance Vault | `Database` | `nav.vault` |
| 41 | `/dashboard/solvency` | Proof-of-Solvency | `ShieldCheck` | `nav.solvency` |
| 42 | `/dashboard/oracle-mirror` | Oracle Mirror | `FileText` | `nav.oracleMirror` |
| 43 | `/dashboard/reality-sync` | Reality Sync | `Activity` | `nav.realitySync` |
| 44 | `/dashboard/institutional-memory` | Institutional Memory | `Layers` | `nav.institutionalMemory` |

### Group 7 — Graduation & Sovereignty (5 items, role-gated)

| # | href | label | icon | i18n key |
|---|------|-------|------|----------|
| 45 | `/dashboard/graduation` | Graduation | `GraduationCap` | `nav.graduation` |
| 46 | `/dashboard/graduation-coach` | Graduation Coach | `TrendingUp` | `nav.graduationCoach` |
| 47 | `/dashboard/graduation-simulator` | Graduation Simulator | `FlaskConical` | `nav.graduationSimulator` |
| 48 | `/dashboard/survival-drill` | Survival Drill | `HeartPulse` | `nav.survivalDrill` |
| 49 | `/dashboard/alumni` | Alumni Hall | `Award` | `nav.alumni` |

### Group 8 — Platform Admin (31 items, role-gated)

| # | href | label | icon | i18n key |
|---|------|-------|------|----------|
| 50 | `/dashboard/admin/users` | Partner Management | `Users` | `nav.adminUsers` |
| 51 | `/dashboard/admin/enterprises` | Enterprise Management | `Building2` | `nav.adminEnterprises` |
| 52 | `/dashboard/steward` | Steward Dashboard | `Cpu` | `nav.steward` |
| 53 | `/dashboard/architecture` | Institutional Architecture | `Building2` | `nav.architecture` |
| 54 | `/dashboard/governance-model` | Governance System | `ScrollText` | `nav.governanceModel` |
| 55 | `/dashboard/institutional-readiness` | Institutional Readiness | `Shield` | `nav.institutionalReadiness` |
| 56 | `/dashboard/operating-system` | Operating System (AOS) | `Workflow` | `nav.operatingSystem` |
| 57 | `/dashboard/commercialization` | Commercialization (ACS) | `TrendingUp` | `nav.commercialization` |
| 58 | `/dashboard/production-readiness` | Production Readiness | `ShieldCheck` | `nav.productionReadiness` |
| 59 | `/dashboard/pilot-execution` | Pilot Execution | `ClipboardCheck` | `nav.pilotExecution` |
| 60 | `/dashboard/global-launch` | Global Launch (GLS) | `Flag` | `nav.globalLaunch` |
| 61 | `/dashboard/founder-office` | Founder Office (FOCC) | `Crown` | `nav.founderOffice` |
| 62 | `/dashboard/institutional-trust` | Institutional Trust (ITDB) | `BadgeCheck` | `nav.institutionalTrust` |
| 63 | `/dashboard/market-execution` | Market Execution (MES) | `Zap` | `nav.marketExecution` |
| 64 | `/dashboard/market-activation` | Market Activation | `Megaphone` | `nav.marketActivation` |
| 65 | `/dashboard/customer-conversion` | Customer Conversion | `GitBranch` | `nav.customerConversion` |
| 66 | `/dashboard/strategic-partners` | Strategic Partners | `Handshake` | `nav.strategicPartners` |
| 67 | `/dashboard/execution-war-room` | Execution War Room | `Crosshair` | `nav.executionWarRoom` |
| 68 | `/dashboard/first-research` | First 25 Research | `Target` | `nav.firstResearch` |
| 69 | `/dashboard/constitutional-audit` | Constitutional Audit | `Scale` | `nav.constitutionalAudit` |
| 70 | `/dashboard/admin/audit` | Audit Log Viewer | `ScrollText` | `nav.auditLog` |
| 71 | `/dashboard/admin/settings` | Institutional Settings | `SlidersHorizontal` | `nav.adminSettings` |
| 72 | `/dashboard/admin-panel` | Platform Admin Panel | `ShieldAlert` | `nav.adminPanel` |
| 73 | `/dashboard/fra` | FRA Regulatory | `Landmark` | `nav.fra` |
| 74 | `/dashboard/company-owner` | Company Owner | `Building2` | `nav.companyOwner` |
| 75 | `/dashboard/law-firm` | Law Firm Rep | `Scale` | `nav.lawFirm` |
| 76 | `/dashboard/accounting` | Accounting Firm | `Calculator` | `nav.accounting` |
| 77 | `/dashboard/industry` | Industry Modules | `FlaskConical` | `nav.industry` |
| 78 | `/dashboard/federation` | Federation | `Network` | `nav.federation` |
| 79 | `/dashboard/credentials` | VC Wallet | `KeyRound` | `nav.credentials` |
| 80 | `/dashboard/university` | University Rep Console | `GraduationCap` | `nav.university` |

> Source comment claims "(10)" items in this group — actual count is **31**. Comment is stale (see P3-001).

### Group 9 — Institutional Services (3 items, universal)

| # | href | label | icon | i18n key |
|---|------|-------|------|----------|
| 81 | `/dashboard/tax` | Tax Optimizer | `Calculator` | `nav.tax` |
| 82 | `/dashboard/ir` | Capital Partner Relations | `MessageSquare` | `nav.ir` |
| 83 | `/dashboard/drip` | DRIP (Dividend Reinvest) | `TrendingUp` | `nav.drip` |

---

## 4. Role-based visibility (groups)

Implementation: `visibleGroupsForRoles(roles: Set<string>): Set<string>` in `dashboard-shell.tsx`.

| Group | Visible to roles |
|------|------------------|
| Workspace | everyone (universal) |
| Capital & Workforce | everyone (universal) |
| Enterprise | `manager` · `founding_operator` · `board_member` · `company_owner` · `accounting_firm_rep` |
| Intelligence | everyone (universal) |
| Compliance & Transparency | everyone (universal) |
| Treasury & Infrastructure | `manager` · `founding_operator` · `board_member` · `company_owner` · `law_firm_rep` |
| Graduation & Sovereignty | `founding_operator` · `company_owner` · `board_member` |
| Institutional Services | everyone (universal) |
| Platform Admin | `aurienta_rep` · `law_firm_rep` · `accounting_firm_rep` · `company_owner` |

**Roles that DO NOT unlock any gated group** (i.e. only see the 5 universal groups / 30 routes):
- `capital_partner`
- `workforce_partner`
- `university_rep`  ← see **P1-001**: this role owns `/dashboard/university` but cannot reach it via the sidebar.

---

## 5. Non-sidebar navigation entries

These routes are reachable but **not** listed in the sidebar `NAV` array:

| href | Reachable via | Notes |
|------|---------------|-------|
| `/dashboard/profile` | Avatar dropdown menu ("Profile & Identity" item, dashboard-shell.tsx line 626) | Real page (`src/app/dashboard/profile/page.tsx`). See P1-002. |
| `/dashboard/admin` | Direct URL only | Server-component redirect → `/dashboard/admin-panel` (`src/app/dashboard/admin/page.tsx`). Not broken, just a thin redirect. |
| `/dashboard/admin/users/[id]` | Drill-down from Partner Management list | Detail page; no nav item — expected. |
| `/dashboard/admin/enterprises/[id]` | Drill-down from Enterprise Management list | Detail page; no nav item — expected. |

---

## 6. Top-bar / floating navigation affordances

| Affordance | Component | Notes |
|-----------|-----------|-------|
| Brand logo (top-left) | `<Link href="/dashboard">` | Always goes to Overview. |
| Search / ⌘K palette | `CommandPalette` (`ux/command-palette.tsx`) | Exposes only **14 of 83** nav destinations — see P2-001. |
| Enterprise Switcher | `EnterpriseSwitcher` (`ux/enhancements.tsx`) | Picks `selectedEntId`; persisted to `localStorage["aurienta_active_ent"]`. |
| Role Switcher | `RoleSwitcher` (`role-switcher.tsx`) | Picks `activeRole`; persisted to `localStorage["aurienta_active_role"]`. Hidden if user has ≤1 role. |
| Notifications bell | `<Link href="/dashboard/notifications">` | Always visible; gold pulse dot if `user.notifications.length > 0`. |
| Avatar dropdown | Profile / Public site / Sign out | Profile link is the **only** path to `/dashboard/profile`. |
| Floating Help button | `HelpButton` | Opens onboarding tour, links to Constitution guide + Copilot. |
| Floating Quick Actions | `QuickActions` | Role-filtered (see §7). |
| OnboardingTour | `OnboardingTour` | Shows on first visit; text says "9 groups, 51 features" — **outdated**, actual is 83 (see P3-002). |

---

## 7. Quick Actions — role-filtered shortcuts

Source: `QuickActions` in `ux/enhancements.tsx` (lines 292–341).

| Action | href | Roles allowed |
|--------|------|---------------|
| Vote on open proposals | `/dashboard/governance` | `capital_partner` · `board_member` · `founding_operator` · `manager` |
| Place a trade | `/dashboard/market` | `capital_partner` · `board_member` · `founding_operator` |
| Create proposal | `/dashboard/governance` | `board_member` · `founding_operator` · `capital_partner` |
| Submit expense | `/dashboard/manager` | `manager` · `founding_operator` |
| Ask AI Copilot | `/dashboard/copilot` | `capital_partner` · `board_member` · `founding_operator` · `manager` · `workforce_partner` |

**Issue:** Quick Actions has no entry for `law_firm_rep`, `accounting_firm_rep`, `aurienta_rep`, `company_owner`, `university_rep`. Pure institutional-rep users land with a FAB that yields zero actions. See P3-003.

---

## 8. Breadcrumbs

Source: `Breadcrumbs` in `ux/enhancements.tsx` (lines 11–42).

Algorithm:
1. Split `pathname` by `/`, drop empties.
2. If `segments.length <= 1` (i.e. just `/dashboard`) → render nothing.
3. Otherwise, build a trail where each segment's label is `seg.split("-").map(titleCase).join(" ")`, except segment `dashboard` → `"Workspace"`.
4. Last segment is rendered as a non-link (gold text); prior segments are `<Link>`.

**Consequence:** Breadcrumb labels are derived from URL slugs, **not** from the `NAV` label. This produces visible label drift on several routes — see ROUTE_INVENTORY.md §6 for the full mismatch list (e.g. `/dashboard/admin-panel` → "Admin Panel" vs nav "Platform Admin Panel").

---

## 9. Auth guard

`src/app/dashboard/layout.tsx`:
```tsx
const user = await getCurrentUser();
if (!user) redirect("/signin?next=/dashboard/portfolio");
```

- Session-only gate. There is **no per-route role middleware**.
- Per-route role enforcement must be done inside each `page.tsx` (and/or via the API routes the page calls). Audit of per-page guards is out of scope for this static pass — flagged for Section B (runtime audit).
- Note: the `next=/dashboard/portfolio` redirect target means after sign-in users who tried to hit `/dashboard` directly land on `/dashboard/portfolio`. The Overview redirect (REMED-1D comment in `src/app/dashboard/page.tsx` lines 30–38) confirms this was a historical bug that has been resolved by making `/dashboard` a real Overview page. The `?next=` value, however, was **not** updated — see P3-004.

---

## 10. Ownership / responsibility matrix

| Concern | File | Function |
|--------|------|----------|
| Sidebar item list | `src/components/dashboard/dashboard-shell.tsx` | `NAV` const (lines 145–246) |
| Group order (operator reorder) | `src/components/dashboard/dashboard-shell.tsx` | `groupOrderForRoles` (lines 260–266) |
| Group visibility filter | `src/components/dashboard/dashboard-shell.tsx` | `visibleGroupsForRoles` (lines 288–342) |
| Sidebar rendering | `src/components/dashboard/dashboard-shell.tsx` | `SidebarContent` (lines 717–899) |
| Top bar / shell | `src/components/dashboard/dashboard-shell.tsx` | `DashboardShell` (lines 344–715) |
| Auth guard | `src/app/dashboard/layout.tsx` | default export |
| Edge middleware | `src/middleware.ts` | (read separately — session gate only) |
| Breadcrumbs | `src/components/dashboard/ux/enhancements.tsx` | `Breadcrumbs` (lines 11–42) |
| Enterprise switcher | `src/components/dashboard/ux/enhancements.tsx` | `EnterpriseSwitcher` (lines 45–102) |
| Role switcher | `src/components/dashboard/role-switcher.tsx` | `RoleSwitcher` |
| Command palette | `src/components/dashboard/ux/command-palette.tsx` | `COMMANDS` const |
| Quick actions | `src/components/dashboard/ux/enhancements.tsx` | `QuickActions` (lines 292–341) |
| Onboarding tour | `src/components/dashboard/ux/enhancements.tsx` | `OnboardingTour` (lines 160–242) |
| Role metadata | `src/lib/aurienta/constants.ts` | `ROLE_META` (lines 25–39) |
| i18n keys (nav) | `src/lib/i18n/translations.ts` | `nav.*`, `group.*`, `role.*` |
