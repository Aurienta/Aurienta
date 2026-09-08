# AURIENTA — Cross-Module Workflow Harmony Audit

**Task ID:** AUDIT-3-WORKFLOW
**Agent:** Product Architect (Explore)
**Scope:** Cross-module workflow audit (create → validate → submit → review → approve → complete → audit), data continuity, state-machine consistency, dead-end detection, API↔UI wiring, DB↔screen consistency, notification→workflow→page linking, audit log→UI traceability.
**Status:** DOCUMENTED — NOT YET FIXED (orchestrator to batch-fix per severity).
**Codebase reviewed at:** HEAD (commits through `f5e4276`).

---

## 0. Executive summary

The platform has **8 major workflows** wired through ~25 API route handlers and ~110 dashboard pages. The Constitutional Runtime Engine (`src/lib/aurienta/cre.ts`) is correctly implemented as the single policy gatekeeper, and every state-mutating API uses `db.$transaction` + `appendLedgerEvent` + `audit()` — that part of the harmony is **strong**.

However, the **post-creation continuation** of nearly every workflow is broken. Specific systemic problems:

1. **No workflow state transition emits a `Notification` or `DashboardTask`.** Only the *Enterprise Updates* feed ever creates notifications. So when a vote passes, an expense needs a second signature, a milestone is released, a whistleblower report is validated, or graduation becomes eligible — the user has no signal. (P0)
2. **The `enforceStatusTransition` state-machine guard is defined in `cre.ts` but only enforced inside the admin override route.** All four production status-mutating endpoints (`enterprises/[id]/list`, `enterprises/[id]/close-capital-formation`, `graduation/execute`, `admin/enterprises/[id]`) bypass it. DRAFT→CLOSED is theoretically impossible today *only because* each endpoint has an ad-hoc `if (status !== "X") return 400` check. Removing or loosening any of those checks silently breaks the state machine. (P1)
3. **Three server endpoints exist with zero client callers** — `/api/enterprises/[id]/list`, `/api/enterprises/[id]/close-capital-formation`, `/api/graduation/execute`. The UI has no button for them, so the workflow dead-ends. (P0)
4. **The milestone release workflow is logically unreachable.** `enforceAccountantGate` requires `milestoneStatus ∈ {board_review, approved}`, but the only milestone mutation endpoint sets status to `evidence_submitted` — no endpoint ever advances it to `board_review` or `approved`. (P0)
5. **The whistleblower + appeals workflows have no resolution / payout / escalation endpoint.** Cases can be filed but never closed. (P1)
6. **The notifications dashboard shows no deep link to the related workflow page.** Rows only have "Mark read" / "Snooze" buttons — no `href` to `/dashboard/governance?proposal=…` etc. (P1)
7. **The audit log viewer has no drill-down to the related entity.** Each row shows `target: "enterprise:abc"` as text; no link to `/dashboard/founder` or the admin enterprise detail. (P2)
8. **The whistleblower page query leaks every report in the system** because the schema has no `filedById` column. (P0 data leak)
9. **Escrow dashboard filters ledger events by a non-existent type.** It searches for `"reservation_created"` (never written) and omits `"funds_received"` (always written) — so the live capital inflow feed on `/dashboard/escrow` is wrong. (P1)

The CRE/ledger/audit triad is excellent. The notification+task+drill-down triad is essentially missing. That asymmetry is the heart of this audit.

---

## 1. Major workflows identified

| # | Workflow | Entry UI | API | DB model(s) | State field | Final state |
|---|---|---|---|---|---|---|
| W1 | Enterprise formation (founder wizard) | `/dashboard/founder` → New Constitution wizard | `POST /api/enterprises` → `POST /api/enterprises/[id]/list` → `POST /api/enterprises/[id]/close-capital-formation` | `Enterprise`, `EnterpriseMember`, `OwnershipRecord`, `LedgerEvent` | `Enterprise.status` | `graduated` (via W7) |
| W2 | Capital participation (primary market) | `/dashboard/portfolio` + `/dashboard/opportunities` + `/dashboard/risk-disclosure` | `POST /api/reservations` → `POST /api/reservations/[id]/confirm` | `Reservation`, `OwnershipRecord` (post-confirm), `InsuranceVault` | `Reservation.status` | `settled` (or `expired`) |
| W3 | Governance (proposals + voting) | `/dashboard/governance` | `POST /api/proposals` → `POST /api/proposals/[id]/vote` | `Proposal`, `Vote` | `Proposal.status` | `executed` (auto on quorum+threshold) |
| W4 | Milestone release (law-firm client account → accountant → vendor) | `/dashboard/founder` (submit evidence) → `/dashboard/accounting` (release) | `POST /api/enterprises/[id]/milestones` → `POST /api/milestones/[id]/accountant-release` | `Milestone`, `Enterprise.lawFirmClientAccountBalanceEgp` | `Milestone.status` | `released` |
| W5 | Graduation | `/dashboard/graduation` | `POST /api/proposals` (type=graduation) → `POST /api/graduation/execute` | `Enterprise.{status,stage}`, `GraduationRecord` | `Enterprise.status` | `graduated` |
| W6 | Expense approval (CRE multi-sig) | `/dashboard/manager` (submit + approve) | `POST /api/expenses` → `POST /api/expenses/[id]/approve` | `Expense` | `Expense.status` | `approved` |
| W7 | Skill-equity claims (workforce→equity) | `/dashboard/skill-equity` (submit) → `/dashboard/manager` (review) | `POST /api/skill-equity` → `POST /api/skill-equity/[id]/review` | `SkillEquityClaim`, `Employee` | `SkillEquityClaim.status` | `approved` / `rejected` |
| W8 | Whistleblower reports (bond + AI triage + bounty) | `/dashboard/whistleblower` | `POST /api/whistleblower` + `GET /api/whistleblower` | `WhistleblowerReport` | `WhistleblowerReport.status` | `resolved` (with `bountyPaidEgp > 0`) |
| W9 | Appeals (3-stage AI→panel→final) | `/dashboard/appeals` | `POST /api/appeals` + `GET /api/appeals` | `AppealCase` | `AppealCase.status` | `final_ruling` |
| W10 | Secondary market (orders + FIFO matching) | `/dashboard/market` | `POST /api/orders` → matching engine (server-side) | `TradeOrder`, `Trade` | `TradeOrder.status` | `filled` |
| W11 | Anti-fragility vault loans | `/dashboard/vault` | `POST /api/vault/loan` → `PATCH /api/vault/loan/[id]` | `VaultLoan`, `InsuranceVault` | `VaultLoan.status` | `repaid` / `forgiven` |
| W12 | Admin enterprise freeze / unfreeze | `/dashboard/admin/enterprises/[id]` | `POST /api/admin/enterprises/[id]/freeze` + `…/unfreeze` + `PATCH /api/admin/enterprises/[id]` | `Enterprise.status` | `Enterprise.status` | `frozen` ↔ `active` |

> Workflows W1–W9 are the 9 specifically named in the audit task. W10–W12 are adjacent chains that interact with them and were reviewed because the audit asks for "cross-module" data continuity.

---

## 2. Workflow chain maps (UI → API → DB → state → next screen → notification → audit)

Legend for the next-step / notification columns:

- ✅ = exists and wired correctly
- ⚠️ = partially wired (e.g. log written but no UI)
- ❌ = missing entirely (dead-end)
- 🚨 = broken (the chain attempts to use a state that is never produced)

### W1 — Enterprise formation

| Stage | UI | API | DB write | Status transition | Next screen | Notification | Audit |
|---|---|---|---|---|---|---|---|
| 1. Wizard submit | `NewEnterpriseWizard.launch()` (founder/new-enterprise-wizard.tsx) | `POST /api/enterprises` | `Enterprise.create({status:'draft'})` + `EnterpriseMember` + `OwnershipRecord` + `LedgerEvent(share_issued)` | (new) → `draft` | Wizard closes + toast → returns to Founder Studio tab A | ❌ none | ✅ audit() not called (only `appendLedgerEvent`) — **P2 missing audit** |
| 2. List for Capital Formation | ❌ **NO UI button exists** | `POST /api/enterprises/[id]/list` (route exists, never called) | `Enterprise.update({status:'fundraising_active'})` + `LedgerEvent(enterprise_listed)` | `draft` → `fundraising_active` | N/A | ❌ | ✅ `audit enterprise.list` |
| 3. Partners reserve units | (via W2) | (via W2) | (via W2) | — | — | ❌ no notification to founder when a reservation arrives | ✅ `audit reservation.create` |
| 4. Law firm confirms funds | ❌ **NO UI** — only the API exists, callable by `law_firm_rep` / `aurienta_rep` | `POST /api/reservations/[id]/confirm` | `Reservation.update({status:'confirmed'})` + `Enterprise.lawFirmClientAccountBalanceEgp += amount` + `InsuranceVault += 0.5%` + `LedgerEvent(funds_confirmed, vault_contribution)` | `reserved` → `confirmed` | N/A | ❌ no notification to the Capital Partner that their funds landed | ✅ `audit reservation.confirm` |
| 5. Close Capital Formation | ❌ **NO UI button exists** | `POST /api/enterprises/[id]/close-capital-formation` (route exists, never called) | `Enterprise.update({status:'active'})` + `LedgerEvent(capital_formation_closed)` | `fundraising_active` → `active` | N/A | ❌ none | ✅ `audit enterprise.close_capital_formation` |

**Issue W1-A (P0):** Stage 2 and stage 5 are entirely dead in the UI. After the wizard closes, the founder sees a "draft" enterprise on the Founder Studio with no path to list it for Capital Formation, and no path to close Capital Formation once the goal is met. The enterprise is permanently stuck in `draft` until an AURIENTA rep manually PATCHes its status via `/api/admin/enterprises/[id]`.
**Issue W1-B (P0):** Stage 4 has no UI. The `law_firm_rep` / `aurienta_rep` role has no dedicated dashboard page; the confirmation API can only be called programmatically.
**Issue W1-C (P1):** No notification fires when a Capital Partner makes a reservation against a founder's enterprise. The founder must manually refresh the Founder Studio.

### W2 — Capital participation

| Stage | UI | API | DB write | Status transition | Next screen | Notification | Audit |
|---|---|---|---|---|---|---|---|
| 1. Risk disclosure acknowledged | `/dashboard/risk-disclosure` | `POST /api/risk-disclosure` (assumed) | `RiskDisclosure.create({acknowledged:true})` | — | ✅ cooling-off countdown then continue | ❌ no follow-up after cooling ends | ✅ |
| 2. Reserve Equity Units | `/dashboard/opportunities` → reservation dialog | `POST /api/reservations` | `Reservation.create({status:'reserved'})` + `Enterprise.raisedEgp += amount` + `LedgerEvent(funds_received)` | (new) → `reserved` | ✅ returns to opportunities grid | ❌ no confirmation to user beyond the API response | ✅ |
| 3. Law firm confirms receipt | (see W1 stage 4) | (see W1) | (see W1) | `reserved` → `confirmed` | ❌ no UI | ❌ no notification to partner | ✅ |
| 4. Settlement → OwnershipRecord | ❌ **NO endpoint transitions `confirmed → settled`** | (none) | — | `confirmed` → `settled` (never happens) | N/A | ❌ | ❌ |
| 5. Portfolio reflects new holding | `/dashboard/portfolio` (server-rendered from `user.ownershipRecords`) | (none — direct DB read) | — | — | ✅ shows once `OwnershipRecord` exists | ❌ | — |

**Issue W2-A (P0):** Stage 4 is missing. The schema says `Reservation.status` should progress `reserved → pending_validation → confirmed → settled → expired`, but no endpoint ever writes `settled`. The `OwnershipRecord` (which would be the partner's portfolio entry) is created *only at enterprise formation* (the founder's seed shares). After a `confirmed` reservation, the partner's `OwnershipRecord` is never inserted — so the partner's portfolio page never reflects the new holding. **Cross-module data continuity break:** capital that the partner paid for is invisible on `/dashboard/portfolio`.
**Issue W2-B (P1):** The 48h expiry on a `reserved` reservation has no cron / scheduler to mark `expired`. Reservations that the law firm never confirms sit in `reserved` forever.

### W3 — Governance

| Stage | UI | API | DB write | Status transition | Next screen | Notification | Audit |
|---|---|---|---|---|---|---|---|
| 1. Create proposal | `/dashboard/governance` (New Proposal Dialog) | `POST /api/proposals` | `Proposal.create({status:'voting_open'})` + `LedgerEvent(proposal_created)` | (new) → `voting_open` | ✅ returns to Governance Board | ❌ no notification to other members that a vote opened | ✅ |
| 2. Cast vote | Voting Modal | `POST /api/proposals/[id]/vote` | `Vote.create` + `Proposal.{votesFor/Against/Abstain} += votingPower` + `LedgerEvent(vote_cast)` (or `proposal_executed` if passes) | (no change unless passes → `executed`) | ✅ UI re-renders tally | ❌ no notification to proposer that their proposal passed/failed | ✅ |
| 3. Auto-execute on pass | (auto inside vote transaction) | (same endpoint) | `Proposal.status = 'executed'` + `LedgerEvent(proposal_executed)` | `voting_open` → `executed` | N/A | ❌ no notification | ✅ |
| 4. Manual execution for type=graduation | ❌ **NO UI button** — the `/api/graduation/execute` endpoint exists but is never called | `POST /api/graduation/execute` | `Enterprise.{status,stage} = 'graduated'` + `LedgerEvent(graduation_executed)` | `active` → `graduated` | N/A | ❌ | ✅ |

**Issue W3-A (P0):** For `type: "graduation"` proposals, the vote endpoint marks the *proposal* as `executed` but never flips `Enterprise.status` to `graduated`. The `graduation_executed` ledger event is only emitted by the `/api/graduation/execute` route, which has **no caller in the UI**. Result: a graduation proposal can "pass" without the enterprise actually graduating.
**Issue W3-B (P1):** The `manager_appointment` police-clearance block (vote/route.ts lines 168–190) reverts the proposal to `evidence_submitted` — a status that the Proposal schema's documentation doesn't list (`draft, published, voting_open, quorum_reached, executed, rejected, expired`). This creates an undocumented state that no UI renders correctly.
**Issue W3-C (P1):** Proposal expiry. The `votingEndsAt` field exists but no scheduled job transitions expired proposals to `expired` status. Stale `voting_open` proposals accumulate.

### W4 — Milestone release

| Stage | UI | API | DB write | Status transition | Next screen | Notification | Audit |
|---|---|---|---|---|---|---|---|
| 1. Founder submits evidence | `/dashboard/founder` Enterprise Detail Dialog → Milestone Evidence Dialog | `POST /api/enterprises/[id]/milestones` | `Milestone.update({status:'evidence_submitted', eveConfidence})` + `LedgerEvent(milestone_released, action='evidence_submitted')` | `pending`/`rejected`/`board_review` → `evidence_submitted` | ✅ dialog closes, founder card refreshes | ❌ no notification to the accounting firm that evidence is waiting | ❌ no `audit()` call |
| 2. Board review | ❌ **NO endpoint** | (none) | — | `evidence_submitted` → `board_review` | N/A | ❌ | ❌ |
| 3. Board approval | ❌ **NO endpoint** | (none) | — | `board_review` → `approved` | N/A | ❌ | ❌ |
| 4. Accountant release | ❌ **NO UI button** (the `/dashboard/accounting` page does not call this API) | `POST /api/milestones/[id]/accountant-release` | `Milestone.update({status:'released', releasedAt})` + `Enterprise.lawFirmClientAccountBalanceEgp -= amount` + `LedgerEvent(milestone_released)` | `board_review`/`approved` → `released` | N/A | ❌ no notification to founder that funds released | ✅ |

**Issue W4-A (P0 — workflow unreachable):** `enforceAccountantGate` (cre.ts:357) requires `milestoneStatus ∈ {board_review, approved}`. The only milestone-mutating endpoint (POST `/api/enterprises/[id]/milestones`) writes `evidence_submitted`. There is no endpoint to advance to `board_review` or `approved`. Therefore the accountant-release endpoint can NEVER succeed. The entire milestone-release workflow is dead at the accountant gate.
**Issue W4-B (P1 — misleading ledger event):** Stage 1 writes `LedgerEvent(eventType='milestone_released')` with `action='evidence_submitted'`. The event type implies funds were released, but they were not. Should be `eventType='milestone_evidence_submitted'`.
**Issue W4-C (P1):** `/dashboard/accounting` page (accounting_firm_rep role) — verified to exist but does not link to the accountant-release API. The release button is missing from the UI.

### W5 — Graduation

| Stage | UI | API | DB write | Status transition | Next screen | Notification | Audit |
|---|---|---|---|---|---|---|---|
| 1. View readiness | `/dashboard/graduation` | `GET /api/graduation?enterpriseId=…` | (read-only) + audit(`graduation.read`) | — | N/A | ❌ no notification when score crosses 90 | ✅ |
| 2. Call vote | `CallVoteButton` | `POST /api/proposals` (type=graduation) | (see W3 stage 1) | — | ✅ refresh, button flips to "Vote already live" | ❌ no notification to other members | ✅ |
| 3. Partners vote | (see W3 stage 2) | (see W3) | (see W3) | `voting_open` → `executed` (proposal only) | ✅ | ❌ | ✅ |
| 4. Execute graduation | ❌ **NO UI** — `/api/graduation/execute` exists but no caller | `POST /api/graduation/execute` | `Enterprise.status='graduated'`, `stage='graduated'`, `LedgerEvent(graduation_executed)` | `active` → `graduated` | N/A | ❌ | ✅ |
| 5. Generate Sovereign Export Package | `/dashboard/graduation` ExportPackageCard | `/api/graduation/export` | `GraduationRecord.exportHash` | — | ✅ | ❌ | (route exists, not verified) |

**Issue W5-A (P0 — same root as W3-A):** Stage 4 has no UI caller. After the graduation proposal "passes" via the vote endpoint, the enterprise is stuck. The graduation execute API requires `readiness.score >= 75` AND `>=7 of 9 gates passing` — but there's no UI button to call it. The "Call graduation vote" button is the LAST UI affordance in the chain.
**Issue W5-B (P1):** The graduation page gates don't include the open-graduation-proposal gate in the UI. The CallVoteButton disables itself if `hasOpenProposal`, but the graduation readiness score from `computeGraduationReadiness` doesn't include the 75% supermajority vote as one of its 9 gates — it's enforced separately. There's no UI hint that the user needs to actually *vote* on the proposal.

### W6 — Expense approval

| Stage | UI | API | DB write | Status transition | Next screen | Notification | Audit |
|---|---|---|---|---|---|---|---|
| 1. Submit expense | `/dashboard/manager` Submit Expense Dialog | `POST /api/expenses` | `Expense.create` + `LedgerEvent(expense_submitted or expense_approved)` | (new) → `pending` / `dual_signature_pending` / `approved` (auto if <1% solo) | ✅ dialog closes, list refreshes | ❌ no notification to the second required approver | ✅ |
| 2. Approve (dual-sig or board) | `ApproveExpenseButton` | `POST /api/expenses/[id]/approve` | `Expense.update({approver1Id/2Id, status:'approved'})` + `LedgerEvent(expense_approved or cre_decision)` | `pending` / `dual_signature_pending` → `approved` | ✅ list refreshes | ❌ no notification to submitter that expense was approved | ✅ |
| 3. Reject | ❌ **NO endpoint** | (none) | — | `pending` → `rejected` (never happens) | N/A | ❌ | ❌ |
| 4. Flag | ❌ **NO endpoint** | (none) | — | `pending` → `flagged` (never happens) | N/A | ❌ | ❌ |

**Issue W6-A (P1):** The `Expense.status` enum in the schema includes `rejected` and `flagged`, but no API endpoint ever writes them. The approve endpoint only handles the "approve" path. Submitters can never get a "rejected" expense — they're left in `pending` indefinitely.
**Issue W6-B (P1):** No notification fires to the second required approver when a dual-sig expense is awaiting their signature. The CRE requires `manager + accounting_firm_rep` for 1–10% expenses, but neither party gets notified.

### W7 — Skill-equity claims

| Stage | UI | API | DB write | Status transition | Next screen | Notification | Audit |
|---|---|---|---|---|---|---|---|
| 1. Submit claim | `/dashboard/skill-equity` form | `POST /api/skill-equity` | `SkillEquityClaim.create({status:'pending'})` + `LedgerEvent(cre_decision, action='skill_equity_claim_submitted')` | (new) → `pending` | ✅ form refreshes | ❌ no notification to board that a claim is awaiting review | ❌ no `audit()` call |
| 2. Board review | ❌ **NO UI** — the `/dashboard/manager` does not expose a skill-equity review queue | `POST /api/skill-equity/[id]/review` | `SkillEquityClaim.update({status:'approved'/'rejected', reviewedById, aiAssessment})` + `LedgerEvent(cre_decision, action='skill_equity_reviewed')` | `pending` → `approved` / `rejected` | N/A | ❌ no notification to claimant | ❌ no `audit()` call |

**Issue W7-A (P0):** Stage 2 has no UI. The review API requires `board_member`/`company_owner`/`founding_operator`/`aurienta_rep` role but no dashboard page surfaces a "claims awaiting review" queue. Claims can be filed but never reviewed through the UI.
**Issue W7-B (P1):** No `audit()` call on either the submit or review endpoint. The skill-equity workflow is invisible to the Steward audit log.
**Issue W7-C (P1):** On approval, the API does not actually create an `OwnershipRecord` for the claimant (the schema implies the equity grant should be reflected in ownership, and `enforceSalaryToEquity` computes `equityUnitsToIssue`, but the units are never written to `OwnershipRecord`). **Cross-module data continuity break:** approved skill-equity does not appear on `/dashboard/portfolio`.

### W8 — Whistleblower reports

| Stage | UI | API | DB write | Status transition | Next screen | Notification | Audit |
|---|---|---|---|---|---|---|---|
| 1. File report | `/dashboard/whistleblower` | `POST /api/whistleblower` | `WhistleblowerReport.create({status:'submitted'/'validated'/'investigating'})` + `LedgerEvent(whistleblower_filed)` (only if `enterpriseId` provided) | (new) → `submitted`/`validated`/`investigating` (auto by AI credibility) | ✅ toast with tracking code | ❌ no notification to enterprise board | ✅ |
| 2. Investigate | ❌ **NO endpoint** | (none) | — | `submitted` → `investigating` (never happens — initial status is set once by AI, never advanced) | N/A | ❌ | ❌ |
| 3. Resolve + payout | ❌ **NO endpoint** | (none) | — | `*` → `resolved` + `bountyPaidEgp = X` (never happens) | N/A | ❌ no notification to filer | ❌ |

**Issue W8-A (P0 — schema gap):** `WhistleblowerReport` has NO `filedById` field. The `/dashboard/whistleblower` page query (line 26–34) uses `where: {}` (empty filter) — fetching **every report in the system** and displaying them all. The page comment admits: *"We can't easily map report→filer by userId directly (no userId field)."* This is a confidentiality breach — a partner filing a report against Enterprise A can read reports about Enterprise B, C, D… The API GET endpoint was hardened (returns `[]` for users with no memberships) but the **dashboard page** bypasses the API and queries the DB directly with an unfiltered where clause.
**Issue W8-B (P1):** No resolve/payout endpoint exists. The `bountyPaidEgp` field is always 0. The 5,000 EGP bond is "locked" but never released or forfeited. Validated reports stay `validated` forever — no SLA, no follow-up.
**Issue W8-C (P1):** No UI on the steward / `aurienta_rep` side to triage or resolve reports.

### W9 — Appeals

| Stage | UI | API | DB write | Status transition | Next screen | Notification | Audit |
|---|---|---|---|---|---|---|---|
| 1. File appeal | `/dashboard/appeals` form | `POST /api/appeals` | `AppealCase.create({status:'ai_ruling', stage:1})` + `LedgerEvent(appeal_filed)` | (new) → `ai_ruling` | ✅ | ❌ no notification to enterprise | ✅ |
| 2. Escalate to human panel | ❌ **NO endpoint** | (none) | — | `ai_ruling` → `human_panel` (never happens) | N/A | ❌ | ❌ |
| 3. Final binding ruling | ❌ **NO endpoint** | (none) | — | `human_panel` → `final_ruling` (never happens) | N/A | ❌ | ❌ |

**Issue W9-A (P1):** Stages 2 and 3 are missing. The 3-stage appeals workflow described in the page subtitle ("AI ruling, human panel, final binding arbitration") has only stage 1 implemented. Cases pile up in `ai_ruling` forever.
**Issue W9-B (P2 — status enum mismatch):** The page reads `stats.filed = cases.filter(c => c.status === 'filed').length` but the API writes `status: 'ai_ruling'` (never 'filed'). The stat is always 0.
**Issue W9-C (P1):** `appealCase.status === 'resolved'` is referenced in `computeGraduationReadiness` (cre.ts:588 — filters unresolved cases as a graduation gate), but no endpoint ever writes `resolved`. This means open appeals will block graduation forever, with no way to close them.

---

## 3. Dead ends found

| ID | Location | Type | Severity | Description |
|---|---|---|---|---|
| DE-01 | `POST /api/enterprises` (success) | Missing next-step UI | P0 | Wizard closes; enterprise sits in `draft` forever. No "List for Capital Formation" button anywhere. |
| DE-02 | `POST /api/enterprises/[id]/list` (success) | Missing next-step UI | P0 | Even if called programmatically, no UI surfaces the now-listed enterprise to Capital Partners via a CTA — they'd have to discover it on `/dashboard/opportunities`. |
| DE-03 | `POST /api/enterprises/[id]/close-capital-formation` (success) | Missing next-step UI | P0 | No button to close Capital Formation when goal met. Enterprise stuck in `fundraising_active`. |
| DE-04 | `POST /api/reservations/[id]/confirm` (success) | Missing data propagation | P0 | No `OwnershipRecord` is created for the partner post-confirmation. Portfolio never reflects the holding. |
| DE-05 | `POST /api/enterprises/[id]/milestones` (success) | State-machine gap | P0 | Milestone lands in `evidence_submitted` with no path to `board_review`/`approved` → accountant-release endpoint can never run. |
| DE-06 | `POST /api/milestones/[id]/accountant-release` (verify) | No UI button | P0 | Endpoint exists; no `/dashboard/accounting` button calls it. |
| DE-07 | `POST /api/graduation/execute` (success) | No UI button | P0 | Endpoint exists; no graduation page button calls it. Enterprise never actually graduates. |
| DE-08 | `POST /api/skill-equity/[id]/review` | No UI queue | P0 | Review API exists; no manager/board dashboard surfaces pending claims. |
| DE-09 | `POST /api/whistleblower` (filed) | No resolve endpoint | P1 | Reports pile up in `submitted`/`validated`/`investigating` with no SLA, no resolve, no bounty payout. |
| DE-10 | `POST /api/appeals` (filed) | No escalation endpoint | P1 | Cases stuck in `ai_ruling`. Human panel and final ruling never happen. |
| DE-11 | `/dashboard/whistleblower` (page load) | Data leak | P0 | Page query has empty `where: {}` — fetches all reports system-wide. |
| DE-12 | `/dashboard/notifications` (notification row) | No deep link | P1 | Notifications have no `href` to the related workflow page. Only "mark read" / "snooze" buttons. |
| DE-13 | `/dashboard/admin/audit` (audit row) | No drill-down | P2 | Audit entries show `target: "expense:abc"` as plain text. No link to the expense or enterprise detail. |
| DE-14 | `/dashboard/escrow` (ledger feed) | Wrong filter | P1 | Filters by `["share_transferred", "expense_approved", "milestone_released", "reservation_created"]`. `reservation_created` is never written; `funds_received` (always written) is filtered out. Live capital inflow feed is wrong. |
| DE-15 | `Expense` reject / flag | Missing endpoint | P1 | No API to reject or flag an expense. Status enum documents `rejected`/`flagged` but neither is ever written. |
| DE-16 | `Proposal` expiry | Missing scheduler | P1 | `votingEndsAt` exists; no cron transitions `voting_open` → `expired`. Stale proposals accumulate. |
| DE-17 | `Reservation` expiry | Missing scheduler | P1 | `expiresAt` exists; no cron marks `reserved` → `expired`. Stale reservations hold `raisedEgp` hostage. |
| DE-18 | `POST /api/skill-equity` and `POST /api/skill-equity/[id]/review` | Missing `audit()` | P1 | Neither endpoint calls `audit()`. Skill-equity workflow is invisible to the Steward audit log. |
| DE-19 | `POST /api/enterprises` (founder wizard submit) | Missing `audit()` | P2 | The endpoint that creates an enterprise writes a ledger event but does not call `audit()`. |
| DE-20 | `POST /api/enterprises/[id]/milestones` (evidence submit) | Missing `audit()` | P2 | Writes ledger event but does not call `audit()`. |
| DE-21 | `manager_appointment` proposal with failed police clearance | Undocumented state | P1 | Vote endpoint reverts to `evidence_submitted` — a status the Proposal schema doesn't list. UI rendering unverified. |
| DE-22 | Skill-equity approval | No ownership propagation | P1 | On approval, `enforceSalaryToEquity` computes `equityUnitsToIssue` but the units are never written to `OwnershipRecord`. Portfolio doesn't reflect the grant. |
| DE-23 | Vault loan forgiven / repaid | Missing UI button | P2 | The `PATCH /api/vault/loan/[id]` endpoint exists with `repay`/`forgive` actions, but the vault page only shows a "request loan" form. No steward UI to mark repaid/forgiven. |

---

## 4. API ↔ UI wiring audit (10 major pages)

| Page | Server data source | Client fetch calls | Tenant filter | Verdict |
|---|---|---|---|---|
| `/dashboard/portfolio` | `db.enterprise.findMany` via `user.ownershipRecords` (no `where` filter — relies on eager-loaded relation) | none (server-rendered) | ✅ user-scoped via Prisma relation | ✅ correct, but **DE-04** means new reservations never reach this page |
| `/dashboard/founder` | `db.enterprise.findMany({where:{founderId:user.id}})` + memberships | none | ✅ user-scoped | ✅ correct; data continuity broken downstream by DE-04/05/07 |
| `/dashboard/governance` | `db.proposal.findMany({where:{enterpriseId:{in:enterpriseIds}}})` | none | ✅ membership-scoped | ✅ correct |
| `/dashboard/graduation` | `db.enterprise.findMany({where:{id:{in:enterpriseIds}}})` + `computeGraduationReadiness` | `CallVoteButton` → `POST /api/proposals` | ✅ membership-scoped | ⚠️ missing execute call (DE-07) |
| `/dashboard/manager` | `db.expense.findMany({where:{enterpriseId:selected.id}})` + employees + milestones | `SubmitExpenseDialog` → `POST /api/expenses`; `ApproveExpenseButton` → `POST /api/expenses/[id]/approve` | ✅ role-scoped (manager or founding_operator) | ✅ correct |
| `/dashboard/skill-equity` | `db.employee.findMany({where:{userId:user.id}})` + `db.skillEquityClaim.findMany({where:{userId:user.id}})` | `SkillEquityClient` → `POST /api/skill-equity` | ✅ user-scoped | ⚠️ review path has no UI (DE-08) |
| `/dashboard/whistleblower` | `db.whistleblowerReport.findMany({where:{}})` — **empty filter** | `WhistleblowerClient` → `POST /api/whistleblower` | 🚨 **NO TENANT FILTER** | ❌ **DE-11 — leaks every report system-wide** |
| `/dashboard/admin/audit` | `db.auditLog.findMany({where: buildWhere(sp)})` | none (server-rendered); `ExportPackageCard` links to `/api/admin/audit/export` | ✅ role-gated to `aurienta_rep` | ✅ correct; no drill-down (DE-13) |
| `/dashboard/escrow` | `db.enterprise.findMany({where:{founderId:user.id}})` + member enterprises + `ledgerEvents({where:{eventType:{in:[...]}})` | none | ✅ user-scoped | ⚠️ ledger event filter is wrong (DE-14) |
| `/dashboard/notifications` | `db.notification.findMany({where:{userId:user.id}})` | `NotificationCenter` → `POST /api/notifications/[id]/read` + `POST /api/ai/triage` | ✅ user-scoped | ✅ correct read path; no deep links (DE-12) |

**Tenant-filter summary:** 9/10 pages apply the correct tenant filter. The whistleblower page is the only leak (P0). The escrow page is the only filter-mismatch (P1).

---

## 5. Workflow state consistency

### 5.1 The `enforceStatusTransition` state machine (cre.ts:1064)

The function exists and is correct:

```ts
const VALID_TRANSITIONS = {
  draft: ["fundraising_active", "frozen"],
  fundraising_active: ["active", "frozen", "draft"],
  active: ["frozen", "graduation_pending"],
  frozen: ["active", "draft", "fundraising_active"],
  graduation_pending: ["graduated", "active", "frozen"],
  graduated: [], // terminal
};
```

`graduated` is correctly terminal. `draft → graduated` is impossible. `frozen → graduated` is impossible. The blueprint's "no DRAFT→CLOSED" rule is enforced *if this function is called*.

### 5.2 Where it's actually called

| Endpoint | Calls `enforceStatusTransition`? | Ad-hoc check |
|---|---|---|
| `POST /api/enterprises/[id]/list` | ❌ NO | `if (enterprise.status !== "draft") return 400` |
| `POST /api/enterprises/[id]/close-capital-formation` | ❌ NO | `if (enterprise.status !== "fundraising_active") return 400` |
| `POST /api/graduation/execute` | ❌ NO | `if (status === "graduated" \|\| stage === "graduated") return alreadyGraduated` |
| `POST /api/admin/enterprises/[id]/freeze` + `…/unfreeze` | ❌ NO (ad-hoc; verified by inspection) | sets `status:'frozen'` directly |
| `PATCH /api/admin/enterprises/[id]` (admin override) | ✅ YES | `enforceStatusTransition({currentStatus, proposedStatus})` |

**Issue SC-A (P1):** The state machine exists but is only enforced on the admin override endpoint. The four production state-mutating endpoints bypass it. A future refactor that loosens the ad-hoc `if (status !== "X")` check on any of them would silently break the state machine. The guard should be called inside every status-mutating transaction.

### 5.3 Other state fields and their transitions

| Model | Field | Enum | Transition enforcement |
|---|---|---|---|
| `Reservation` | `status` | `reserved, pending_validation, confirmed, settled, expired` | ✅ `reserved → confirmed` enforced in confirm endpoint. ❌ No `confirmed → settled`. ❌ No `reserved → expired` (no scheduler). |
| `Proposal` | `status` | `draft, published, voting_open, quorum_reached, executed, rejected, expired` | ✅ Auto-transition `voting_open → executed` on pass. ❌ No `voting_open → expired`. ❌ Writes undocumented `evidence_submitted` state (manager_appointment police block). |
| `Milestone` | `status` | `pending, evidence_submitted, board_review, approved, released, rejected` | ✅ `pending → evidence_submitted`. ❌ No `evidence_submitted → board_review`. ❌ No `board_review → approved`. ✅ `* → released` in accountant-release endpoint, but **the gate rejects anything not in `board_review`/`approved`**, so it never fires. |
| `Expense` | `status` | `pending, dual_signature_pending, approved, rejected, flagged` | ✅ `pending → approved` (board) and `dual_signature_pending → approved` (dual sig). ❌ No `* → rejected`. ❌ No `* → flagged`. |
| `SkillEquityClaim` | `status` | `pending, approved, rejected` | ✅ `pending → approved/rejected` (review endpoint). Functional but unreachable from UI (DE-08). |
| `WhistleblowerReport` | `status` | `submitted, validated, investigating, resolved` (implied) | ✅ Initial status set by AI credibility. ❌ No `* → resolved`. ❌ No `bountyPaidEgp` ever written. |
| `AppealCase` | `status` | `filed, ai_ruling, human_panel, resolved, final_ruling` (implied) | ✅ Initial `ai_ruling`. ❌ No `ai_ruling → human_panel`. ❌ No `human_panel → final_ruling`. ❌ No `* → resolved`. |
| `TradeOrder` | `status` | `open, partially_filled, filled, cancelled` | ✅ Open → partially_filled → filled via FIFO matching engine. ❌ No `* → cancelled` (no cancel endpoint). |
| `VaultLoan` | `status` | `pending, approved, repaid, forgiven` | ✅ `pending → approved/repaid/forgiven` via PATCH endpoint. UI missing (DE-23). |
| `Syndicate` | `status` | `forming, active, completed, dissolved` | Not deeply audited — appears to use a single mutation endpoint; recommend follow-up. |

---

## 6. Notification → workflow → page linking

**Issue NL-A (P0):** Workflow state transitions do not create `Notification` rows. Verified across all 9 workflows — `db.notification.create` / `notification.createMany` is called in exactly ONE file: `src/app/api/enterprise-updates/route.ts` (founder posts update → notification to enterprise members). No other state-mutating endpoint writes a notification.

The notifications dashboard (`/dashboard/notifications`) is functionally an empty inbox for everyone except enterprise-update subscribers. The Constitutional AI triage button runs against a near-empty dataset.

**Specific missing notifications (high-impact examples):**

| Workflow event | Should notify | Currently notifies |
|---|---|---|
| New reservation on my enterprise | Founder + board | ❌ |
| Reservation confirmed by law firm | The reserving partner | ❌ |
| New proposal opened | All enterprise members | ❌ |
| Proposal passed/quorum reached | Proposer + all voters | ❌ |
| Expense needs my second signature | The 2nd required approver | ❌ |
| Expense approved | Submitter | ❌ |
| Milestone evidence submitted | Accounting firm | ❌ |
| Milestone released | Founder + board | ❌ |
| Skill-equity claim filed | Board / company owner | ❌ |
| Skill-equity claim reviewed | Claimant | ❌ |
| Whistleblower report filed against my enterprise | Enterprise board (redacted) | ❌ |
| Whistleblower report resolved | Filer | ❌ |
| Appeal filed against my enterprise | Enterprise board | ❌ |
| Graduation readiness crossed 90 | Founder + board | ❌ |
| Graduation vote passed | All enterprise members | ❌ |
| Vault loan request received | Steward / AURIENTA rep | ❌ |

**Issue NL-B (P1):** Even when notifications DO exist (enterprise updates), the notification-center UI has no deep link to the related workflow page. Each row only has "Mark read" and "Snooze" buttons (verified: `notification-center.tsx` lines 78–86 — only `onClick={onMarkRead}` and `onClick={onSnooze}`). The notification `category` field is set but never used to route the user to `/dashboard/governance` (for `category:'governance'`) etc.

**Issue NL-C (P1):** No `DashboardTask` rows are ever created. The schema includes a `DashboardTask` model with fields `ctaLabel`, `ctaHref`, `priority`, `dueAt` — clearly designed to drive the user to their next workflow step. Zero `dashboardTask.create` calls exist in the codebase (verified via grep). The `/dashboard/calendar` page is the only consumer.

---

## 7. Audit log → UI traceability

**Issue AL-A (P2):** The audit log viewer (`/dashboard/admin/audit`) renders each entry's `target` field as plain text in a `<TableCell>`. The `target` field uses the format `enterprise:${id}`, `expense:${id}`, `proposal:${id}`, `milestone:${id}`, `reservation:${id}`, `claim:${id}` — but none of these are hyperlinked. The Steward cannot click through to the related entity.

**Issue AL-B (P1):** Several state-mutating endpoints don't call `audit()` at all (verified by grep — see DE-18/19/20):
- `POST /api/enterprises` (founder wizard submit)
- `POST /api/enterprises/[id]/milestones` (evidence submit)
- `POST /api/skill-equity` (claim submit)
- `POST /api/skill-equity/[id]/review` (claim review)

These workflows write `LedgerEvent` rows but skip the `AuditLog` table entirely. The ledger is immutable and tamper-evident, but the Steward's searchable audit console cannot find these events.

**Issue AL-C (P2):** The audit table doesn't render the `metadata` JSON. Even when an event IS audited, the Steward sees only `action + target + result + reason + ip`. The metadata blob (which carries the actual context — amount, vote tallies, etc.) is hidden.

---

## 8. Cross-module data continuity

| Data created in | Should appear in | Currently appears in | Status |
|---|---|---|---|
| `POST /api/enterprises` → `Enterprise` | Founder Studio, Opportunities Grid, Escrow, Graduation | Founder Studio ✅, Opportunities ❌ (draft not shown), Escrow ✅ (if founder), Graduation ✅ | ⚠️ Partial — draft enterprises hidden from Opportunities (correct per state machine, but no UI to flip them out of draft) |
| `POST /api/reservations` → `Reservation` + `Enterprise.raisedEgp += amount` | Portfolio, Escrow balance, Founder Studio raised counter | Escrow balance ✅, Founder Studio raised counter ✅, Portfolio ❌ | ❌ Portfolio missing — partner's paid reservation never becomes an `OwnershipRecord` (DE-04) |
| `POST /api/reservations/[id]/confirm` → `Enterprise.lawFirmClientAccountBalanceEgp += amount` + `InsuranceVault` | Escrow page balance, Vault page | Escrow page ✅, Vault page (unverified) | ✅ correct |
| `POST /api/proposals` → `Proposal` | Governance board, Audit log | Governance ✅, Audit ❌ (no `audit()` call) | ⚠️ Audit log gap |
| `POST /api/proposals/[id]/vote` → `Vote` + `Proposal.{votesFor/Against}` | Governance tally, Audit | Governance ✅, Audit ✅ | ✅ |
| `POST /api/expenses` → `Expense` | Manager console, Audit | Manager ✅, Audit ✅ | ✅ |
| `POST /api/expenses/[id]/approve` → `Expense.update` + LedgerEvent | Manager console, Audit, Escrow ledger feed | Manager ✅, Audit ✅, Escrow feed ✅ (event type matches filter) | ✅ |
| `POST /api/enterprises/[id]/milestones` → `Milestone.update({status:'evidence_submitted'})` | Founder Studio milestones, Manager milestones mini-panel, Audit | Founder ✅, Manager ✅, Audit ❌ | ⚠️ Audit gap |
| `POST /api/milestones/[id]/accountant-release` → `Milestone.update({status:'released'})` + LedgerEvent + balance decrement | Escrow page balance, Founder Studio, Audit | (unreachable — DE-05) | ❌ Workflow dead |
| `POST /api/skill-equity` → `SkillEquityClaim` | Skill-equity page, Audit | Skill-equity ✅, Audit ❌ | ⚠️ Audit gap |
| `POST /api/skill-equity/[id]/review` → `SkillEquityClaim.update({status:'approved'})` + computed `equityUnitsToIssue` | Skill-equity page, Portfolio, Audit | Skill-equity ✅ (after refresh), Portfolio ❌, Audit ❌ | ❌ Portfolio doesn't reflect approved equity (DE-22) |
| `POST /api/whistleblower` → `WhistleblowerReport` | Whistleblower page, Audit | Whistleblower ✅ (all reports — DE-11), Audit ✅ | 🚨 Data leak |
| `POST /api/appeals` → `AppealCase` | Appeals page, Audit, Graduation readiness gate | Appeals ✅, Audit ✅, Graduation gate ✅ (but never closes — DE-10 blocks graduation) | ⚠️ Graduation gate poison |
| `POST /api/graduation/execute` → `Enterprise.{status,stage}='graduated'` + `GraduationRecord` | Graduation page, Portfolio, Founder Studio | (unreachable — DE-07) | ❌ Workflow dead |
| `POST /api/vault/loan` → `VaultLoan` | Vault page, Audit | Vault ✅, Audit ✅ | ✅ |
| `PATCH /api/vault/loan/[id]` → `VaultLoan.update` + balance mutation | Vault page | (UI missing — DE-23) | ⚠️ UI gap |

---

## 9. Severity-ranked summary

### P0 — blocks the workflow entirely (must fix before launch)

| ID | Title | Files |
|---|---|---|
| P0-1 | No "List for Capital Formation" UI button — enterprises stuck in `draft` | `src/components/dashboard/founder/enterprise-detail-dialog.tsx`, `src/components/dashboard/founder/enterprise-card.tsx` |
| P0-2 | No "Close Capital Formation" UI button — enterprises stuck in `fundraising_active` | `src/components/dashboard/founder/enterprise-detail-dialog.tsx` |
| P0-3 | No `OwnershipRecord` creation on reservation confirm — portfolio broken | `src/app/api/reservations/[id]/confirm/route.ts` |
| P0-4 | Milestone workflow unreachable — `evidence_submitted` never advances to `board_review`/`approved`, so accountant-release gate always rejects | `src/app/api/milestones/[id]/accountant-release/route.ts`, `src/lib/aurienta/cre.ts:357` |
| P0-5 | No "Execute Graduation" UI button — graduation proposal passes but enterprise never graduates | `src/components/dashboard/institutional/call-vote-button.tsx`, `src/app/dashboard/graduation/page.tsx` |
| P0-6 | No skill-equity review queue UI — claims can be filed but never reviewed | `src/app/dashboard/manager/page.tsx` (or new page) |
| P0-7 | Whistleblower page query has empty `where: {}` — leaks every report system-wide | `src/app/dashboard/whistleblower/page.tsx:25-34` |
| P0-8 | No workflow transition emits a `Notification` — notifications inbox is empty for all real workflow events | all state-mutating API routes |
| P0-9 | Milestone accountant-release endpoint has no UI caller | `src/app/dashboard/accounting/page.tsx` (add button) |
| P0-10 | Reservation confirm endpoint has no UI caller (law-firm-rep dashboard missing) | new page needed |

### P1 — workflow continues but with broken UX or data integrity

| ID | Title |
|---|---|
| P1-1 | `enforceStatusTransition` state machine only called in admin override route; production routes bypass it |
| P1-2 | No expense reject / flag endpoint |
| P1-3 | No appeal escalation endpoint (ai_ruling → human_panel → final_ruling) |
| P1-4 | No whistleblower resolve / bounty payout endpoint |
| P1-5 | No scheduler to expire `voting_open` proposals |
| P1-6 | No scheduler to expire `reserved` reservations |
| P1-7 | Escrow dashboard filters by non-existent ledger event type `reservation_created` |
| P1-8 | Notification rows have no deep link to workflow page |
| P1-9 | Manager_appointment proposal reverts to undocumented `evidence_submitted` state on police clearance block |
| P1-10 | Skill-equity approval doesn't create `OwnershipRecord` — portfolio doesn't reflect grant |
| P1-11 | Open appeals block graduation forever (no resolve endpoint) |
| P1-12 | No `audit()` calls on `POST /api/enterprises/[id]/milestones`, `POST /api/skill-equity`, `POST /api/skill-equity/[id]/review` |
| P1-13 | No notification to 2nd required approver on dual-sig expenses |
| P1-14 | No `DashboardTask` rows ever created — schema and `/dashboard/calendar` page are dead code |
| P1-15 | Misleading ledger event: `POST /api/enterprises/[id]/milestones` writes `eventType:'milestone_released'` for an evidence submission |
| P1-16 | Vault loan repay / forgive UI missing (endpoint exists) |

### P2 — cosmetic / polish

| ID | Title |
|---|---|
| P2-1 | Audit log viewer has no drill-down to related entity |
| P2-2 | Audit log viewer doesn't render `metadata` JSON |
| P2-3 | Appeals page reads `status === 'filed'` but API writes `status: 'ai_ruling'` — `filed` stat always 0 |
| P2-4 | `POST /api/enterprises` (founder wizard submit) missing `audit()` call |
| P2-5 | Escrow page nested `<span>` rendering bug at line 113 (cosmetic, not functional) |

---

## 10. Recommended batch-fix order (for orchestrator)

The orchestrator should batch these in dependency order. Recommended sequence:

1. **Schema migrations first:** Add `filedById` to `WhistleblowerReport` (P0-7). Add `OwnershipRecord` write to reservation-confirm (P0-3). Add `OwnershipRecord` write to skill-equity review approve (P1-10).
2. **State-machine gaps second:** Add `POST /api/milestones/[id]/board-review` and `POST /api/milestones/[id]/approve` endpoints, OR loosen `enforceAccountantGate` to accept `evidence_submitted` (P0-4).
3. **Missing endpoints third:** `POST /api/expenses/[id]/reject`, `POST /api/appeals/[id]/escalate`, `POST /api/appeals/[id]/final-ruling`, `POST /api/whistleblower/[id]/resolve`, `POST /api/orders/[id]/cancel`.
4. **UI buttons fourth:** List-for-Capital-Formation, Close-Capital-Formation, Execute-Graduation, Accountant-Release, Skill-Equity-Review-Queue, Law-Firm-Confirm-Funds, Vault-Loan-Repay.
5. **Notifications fifth:** Centralize a `notify(userId, { category, title, body, ctaHref })` helper in `src/lib/aurienta/notifications.ts`. Call it from every state-mutating endpoint.
6. **Dashboard tasks sixth:** Centralize a `createTask(userId, { type, title, ctaHref, dueAt })` helper. Call it on the same hooks.
7. **State-machine guard seventh:** Wrap every status-mutating endpoint with `enforceStatusTransition` inside the same `db.$transaction` as the mutation.
8. **Schedulers eighth:** Add a Vercel cron (or manual `/api/cron/expire-proposals` + `/api/cron/expire-reservations`) — already pattern exists for `/api/drip`.
9. **Drill-downs ninth:** Audit log viewer → hyperlink `target:` field. Notification center → hyperlink `category` → page.
10. **`audit()` gaps tenth:** Add `audit()` calls to the 4 missing endpoints.

---

**End of audit.** No code changes were made. All findings are documented for the orchestrator to batch-fix.
