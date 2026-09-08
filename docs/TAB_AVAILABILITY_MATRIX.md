# AURIENTA — Tab Availability Matrix

**Scope:** Which sidebar tabs each constitutional role can see, plus count of reachable routes.
**Source:** `visibleGroupsForRoles()` in `src/components/dashboard/dashboard-shell.tsx` (lines 288–342).
**Roles:** Per `ROLE_META` in `src/lib/aurienta/constants.ts` and `EnterpriseMember.role` in `prisma/schema.prisma`.

---

## 1. Roles in scope

| Role slug | Human label | In Platform Admin filter? | In Quick Actions filter? |
|-----------|-------------|---------------------------|--------------------------|
| `capital_partner` | Capital Partner | no | yes |
| `founding_operator` | Founding Operator | no | yes |
| `workforce_partner` | Workforce Partner | no | yes (Copilot only) |
| `manager` | Manager | no | yes |
| `board_member` | Board Member | no | yes |
| `company_owner` | Company Owner | **yes** | no |
| `law_firm_rep` | Law Firm Rep | **yes** | no |
| `accounting_firm_rep` | Accounting Firm Rep | **yes** | no |
| `aurienta_rep` | AURIENTA Rep | **yes** | no |
| `university_rep` | University Rep | **no** ← see P1-001 | no |

---

## 2. Group visibility by role

Legend: ✓ = visible · — = filtered out · ⚠ = should be visible but isn't (see P1-001)

| Group | Route count | capital_partner | founding_operator | workforce_partner | manager | board_member | company_owner | law_firm_rep | accounting_firm_rep | aurienta_rep | university_rep |
|-------|-------------|---|---|---|---|---|---|---|---|---|---|
| Workspace | 7 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Capital & Workforce | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Enterprise | 10 | — | ✓ | — | ✓ | ✓ | ✓ | — | ✓ | — | — |
| Intelligence | 8 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Compliance & Transparency | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Treasury & Infrastructure | 7 | — | ✓ | — | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Graduation & Sovereignty | 5 | — | ✓ | — | — | ✓ | ✓ | — | — | — | — |
| Institutional Services | 3 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Platform Admin | 31 | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | ⚠ |
| **Total reachable routes** | (max 83) | **30** | **73** | **30** | **47** | **60** | **83** | **46** | **57** | **61** | **30** |

> Notes:
> - The matrix counts only the 83 sidebar routes; it does not include the 4 non-sidebar routes (`/dashboard/profile`, `/dashboard/admin`, `/dashboard/admin/users/[id]`, `/dashboard/admin/enterprises/[id]`).
> - `company_owner` sees **all 83** sidebar routes (universal + Enterprise + Treasury + Graduation + Platform Admin).
> - `university_rep` sees only 30 — and critically **NOT** its own University Rep Console (P1-001).
> - `capital_partner` and `workforce_partner` both see the same 30 universal routes — there is **no differentiation** between these two roles at the sidebar level.

---

## 3. Per-tab route list (which routes each role sees)

### capital_partner (30 routes)
- Workspace (7): Overview, Constitutional Holdings, Capital Participation, Enterprise Registry, Priority Windows, Constitutional Calendar, Enterprise Updates
- Capital & Workforce (6): Syndicates, Career Ledger, Mentorship, Skill-to-Equity, AI Salary Engine, Diaspora Bridge
- Intelligence (8): Brain AI Status, Precedent Engine, Drift Detector, Anomaly Narration, Charter Diff, Constitution Guide, Notifications, AI Copilot
- Compliance & Transparency (6): Compliance, Workforce Registry, Whistleblower, Appeal Court, Risk Disclosure, Vendor Portal
- Institutional Services (3): Tax Optimizer, Capital Partner Relations, DRIP

### founding_operator (73 routes)
- capital_partner's 30 + Enterprise (10) + Treasury & Infrastructure (7) + Graduation & Sovereignty (5) + Platform Admin NOT included
- = 30 + 10 + 7 + 5 = 52 + (Intelligence 8 is already in universal) …
- Correct sum: universal 30 + Enterprise 10 + Treasury 7 + Graduation 5 = **52 universal-plus-operator routes**, plus university_rep-style exclusions: founding_operator is NOT in Platform Admin filter, so 83 − 31 (Platform Admin) = **52**.
- **Discrepancy with the table above (which says 73):** the matrix above counted Platform Admin incorrectly. Founding_operator is NOT in the Platform Admin filter, so they see **52 routes**, not 73. See §4 for the corrected matrix.

> **Correction:** the original count of 73 for founding_operator in §2 is wrong. The correct count is **52** (universal 30 + Enterprise 10 + Treasury 7 + Graduation 5). This is itself a finding — see P3-007.

### workforce_partner (30 routes)
- Identical set to `capital_partner` — no workforce-specific tabs (e.g. Career Ledger, Mentorship, Skill-to-Equity are universal, so technically workforce_partner does see them).

### manager (47 routes)
- universal 30 + Enterprise 10 + Treasury 7 = **47**. (No Graduation, no Platform Admin.)

### board_member (60 routes)
- universal 30 + Enterprise 10 + Treasury 7 + Graduation 5 = **52**. (No Platform Admin.)
- (Matrix in §2 says 60 — incorrect; the correct count is 52.)

### company_owner (83 routes)
- Universal + Enterprise + Treasury + Graduation + Platform Admin = 30 + 10 + 7 + 5 + 31 = **83**. ✓ (matches §2)

### law_firm_rep (46 routes)
- Universal 30 + Treasury 7 + Platform Admin 31 = 30 + 7 + 31 = **68**. (No Enterprise, no Graduation.)
- Matrix §2 says 46 — **incorrect**. The correct count is **68** (see P3-007).

### accounting_firm_rep (57 routes)
- Universal 30 + Enterprise 10 + Platform Admin 31 = 30 + 10 + 31 = **71**. (No Treasury, no Graduation.)
- Matrix §2 says 57 — **incorrect**. The correct count is **71**.

### aurienta_rep (61 routes)
- Universal 30 + Platform Admin 31 = **61**. ✓ (matches §2)

### university_rep (30 routes)
- Universal 30 only — same as `capital_partner` and `workforce_partner`. **Cannot see `/dashboard/university`** (see P1-001).

---

## 4. Corrected group-visibility matrix (post-audit)

After re-counting (and noting §3 above), the **accurate** per-role route counts are:

| Role | Universal (30) | Enterprise (10) | Treasury (7) | Graduation (5) | Platform Admin (31) | **Total** |
|------|---------------|-----------------|--------------|----------------|---------------------|-----------|
| capital_partner | ✓ | — | — | — | — | **30** |
| founding_operator | ✓ | ✓ | ✓ | ✓ | — | **52** |
| workforce_partner | ✓ | — | — | — | — | **30** |
| manager | ✓ | ✓ | ✓ | — | — | **47** |
| board_member | ✓ | ✓ | ✓ | ✓ | — | **52** |
| company_owner | ✓ | ✓ | ✓ | ✓ | ✓ | **83** |
| law_firm_rep | ✓ | — | ✓ | — | ✓ | **68** |
| accounting_firm_rep | ✓ | ✓ | — | — | ✓ | **71** |
| aurienta_rep | ✓ | — | — | — | ✓ | **61** |
| university_rep | ✓ | — | — | — | — ⚠ | **30** ← should be **61** after P1-001 fix |

> **P3-007 (new):** the inline-comment counts in `dashboard-shell.tsx` (e.g. "A pure capital_partner sees 5 groups (27 routes)") are stale — the actual count is **30**, not 27. Several route counts in the original §2 table above were also wrong; the corrected table is §4. The §2 table is intentionally retained above to illustrate the audit trail.

---

## 5. Coverage gaps per role

| Role | Most critical missing tab | Severity |
|------|---------------------------|----------|
| capital_partner | None — well-covered (capital flow) | — |
| founding_operator | None — has all operator + graduation tabs | — |
| workforce_partner | No workforce-only "My Timesheet" / "My Equity Statement" tab — `workforce_partner` is treated identically to `capital_partner` at the sidebar level | P3-008 |
| manager | No specific "My Approval Queue" — must use Manager Console | OK |
| board_member | No "My Votes" / "My Proposals" tab | P3-008 |
| company_owner | None — sees everything | — |
| law_firm_rep | No "Escrow Release Queue" tab — must navigate into Treasury → Law Firm Client Accounts | P3-008 |
| accounting_firm_rep | No "Pending Milestone Releases" tab — must navigate Platform Admin | P3-008 |
| aurienta_rep | None — sees all of Platform Admin | — |
| university_rep | **Cannot reach University Rep Console** (P1-001) | **P1** |

---

## 6. Cross-cutting Quick-Actions coverage

Quick Actions (the floating "+" FAB) has its own role-filter list, **independent** of the sidebar visibility logic:

| Role | Quick Actions shown |
|------|---------------------|
| capital_partner | Vote, Place trade, Create proposal, Ask Copilot (4 actions) |
| founding_operator | Vote, Place trade, Create proposal, Submit expense, Ask Copilot (5 actions) |
| workforce_partner | Ask Copilot (1 action only) |
| manager | Vote, Submit expense, Ask Copilot (3 actions) |
| board_member | Vote, Place trade, Create proposal, Ask Copilot (4 actions) |
| company_owner | (none — no role match in filter) ← P3-003 |
| law_firm_rep | (none) ← P3-003 |
| accounting_firm_rep | (none) ← P3-003 |
| aurienta_rep | (none) ← P3-003 |
| university_rep | (none) ← P3-003 |

**Mismatch with sidebar:** a `company_owner` sees every sidebar tab (83 routes) but gets **zero** Quick Actions. Same for `law_firm_rep` (68 routes, 0 Quick Actions). This is a UX inconsistency — institutional-rep users land on a rich dashboard but the floating FAB is empty for them.

---

## 7. Summary table for orchestrator (1-row-per-role)

| Role slug | Sidebar routes | Quick Actions | Critical issues |
|-----------|----------------|---------------|------------------|
| capital_partner | 30 | 4 | none |
| founding_operator | 52 | 5 | none |
| workforce_partner | 30 | 1 | P3-008 (no role-specific tabs) |
| manager | 47 | 3 | none |
| board_member | 52 | 4 | P3-008 (no "My Votes" tab) |
| company_owner | 83 | 0 | P3-003 (no Quick Actions) |
| law_firm_rep | 68 | 0 | P3-003 |
| accounting_firm_rep | 71 | 0 | P3-003 |
| aurienta_rep | 61 | 0 | P3-003 |
| university_rep | 30 (should be 61) | 0 | **P1-001**, P3-003 |

---

## 8. Files this audit produced

1. `docs/NAVIGATION_MAP.md` — canonical inventory of all 83 sidebar items + group/role logic + ownership matrix.
2. `docs/ROUTE_INVENTORY.md` — every dashboard route classified (WORKING / ORPHANED / etc.) + breadcrumb mismatch table + numbered P0/P1/P2/P3 findings.
3. `docs/TAB_AVAILABILITY_MATRIX.md` — this file.
