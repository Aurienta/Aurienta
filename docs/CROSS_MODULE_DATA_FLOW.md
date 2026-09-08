# AURIENTA — Cross-Module Data Flow Map

**Task ID:** AUDIT-3-WORKFLOW (companion to `WORKFLOW_HARMONY_AUDIT.md`)
**Purpose:** Single source of truth for how a record created in Module A propagates to Modules B/C/D, and where the chain breaks.
**Scope:** The 12 workflows identified in the harmony audit. This document is the *data-continuity* companion; for state-machine and dead-end analysis see the harmony audit.

---

## 0. Module map

| Module (folder) | Primary Prisma models | Primary pages | Primary APIs |
|---|---|---|---|
| Identity | `User`, `Session`, `TermsAcceptance`, `GovApiVerification` | `/signin`, `/register`, `/dashboard/profile` | `/api/auth/*`, `/api/verification/*`, `/api/terms/acceptance` |
| Enterprise (formation) | `Enterprise`, `EnterpriseMember`, `OwnershipRecord`, `LawFirm`, `AccountingFirm` | `/dashboard/founder`, `/dashboard/enterprise-profile`, `/enterprise/[slug]` | `/api/enterprises/*` |
| Capital (primary market) | `Reservation`, `OwnershipRecord`, `InsuranceVault`, `RiskDisclosure` | `/dashboard/portfolio`, `/dashboard/opportunities`, `/dashboard/risk-disclosure`, `/dashboard/escrow` | `/api/reservations/*`, `/api/risk-disclosure`, `/api/vault/*` |
| Capital (secondary market) | `TradeOrder`, `Trade`, `Valuation` | `/dashboard/market` | `/api/orders` |
| Governance | `Proposal`, `Vote`, `VotingProxy` | `/dashboard/governance` | `/api/proposals/*`, `/api/proxies/*` |
| Treasury (milestones + expenses) | `Milestone`, `Expense`, `Employee`, `Vendor` | `/dashboard/manager`, `/dashboard/accounting` (missing), `/dashboard/founder` (milestone dialog) | `/api/expenses/*`, `/api/enterprises/[id]/milestones`, `/api/milestones/[id]/accountant-release`, `/api/employees` |
| Workforce | `SkillEquityClaim`, `CareerLedgerEntry`, `Mentorship`, `DiasporaProfile` | `/dashboard/workforce`, `/dashboard/skill-equity`, `/dashboard/career-ledger`, `/dashboard/mentorship`, `/dashboard/diaspora` | `/api/skill-equity/*`, `/api/diaspora`, `/api/mentorship` |
| Transparency | `WhistleblowerReport`, `AppealCase`, `SolvencyAssertion`, `IpfsEvidence`, `QuarterlyReport`, `AnnualReport`, `EnterpriseUpdate`, `PartnerEngagement` | `/dashboard/whistleblower`, `/dashboard/appeals`, `/dashboard/solvency`, `/dashboard/vault`, `/dashboard/updates`, `/dashboard/risk-disclosure` | `/api/whistleblower`, `/api/appeals`, `/api/solvency`, `/api/evidence/*`, `/api/enterprise-updates` |
| Graduation | `GraduationRecord` (extends `Enterprise`) | `/dashboard/graduation`, `/dashboard/graduation-coach`, `/dashboard/graduation-simulator` | `/api/graduation`, `/api/graduation/execute`, `/api/graduation/export`, `/api/ai/graduation-*` |
| Syndicates | `Syndicate`, `SyndicateMember` | `/dashboard/syndicates` | `/api/syndicates`, `/api/syndicates/[id]/join` |
| Admin | `AuditLog`, `PlatformSetting`, `IdempotencyRecord`, `CreDecision`, `DashboardTask` | `/dashboard/admin/*` | `/api/admin/*`, `/api/admin/audit` |
| Notifications | `Notification`, `CopilotChat` | `/dashboard/notifications`, `/dashboard/copilot` | `/api/notifications/[id]/read`, `/api/ai/triage`, `/api/copilot` |
| Immutable ledger | `LedgerEvent`, `CreDecision` | (consumed by 6 dashboards) | internal — `appendLedgerEvent(tx, …)` called from every state-mutating endpoint |

---

## 1. The four canonical side-effects of every state-mutating API

Every constitutional write endpoint follows the same pattern (verified across `reservations`, `proposals`, `expenses`, `enterprises`, `milestones`, `skill-equity`, `whistleblower`, `appeals`, `orders`, `vault/loan`, `graduation/execute`):

```ts
await db.$transaction(async (tx) => {
  // 1. Mutate the domain model (status, amount, etc.)
  // 2. appendLedgerEvent(tx, { enterpriseId, eventType, payload, actorId })
  //    — appends to the per-enterprise hash chain with a real Ed25519 CRE
  //      decision token (issueCreDecisionToken) over payloadHash + prevHash.
});
await audit({ actorId, action, target, result, metadata });
//        ↑ writes to AuditLog (separate from LedgerEvent)
```

The **LedgerEvent** chain is the *enterprise-scoped immutable proof* of what happened. The **AuditLog** is the *actor-scoped Steward audit trail* of who did what. They are intentionally separate — `appendLedgerEvent` runs *inside* the same `db.$transaction` as the domain mutation (atomic), `audit()` runs *outside* (best-effort, never blocks the user's success).

### What's missing from the canonical pattern

| Missing side-effect | Where it should be added | Impact |
|---|---|---|
| `db.notification.create` | Inside the `tx` block, when the event should notify a user | P0 — see harmony audit NL-A |
| `db.dashboardTask.create` | Inside the `tx` block, when the event creates a user to-do | P1 — see harmony audit NL-C |
| `db.creDecision.create` | Inside the `tx` block (optional — the CRE decision token is already in `LedgerEvent.creDecisionToken`, but the dedicated table allows cross-enterprise policy analytics) | P2 |
| `db.partnerEngagement.update` | Inside the `tx` block, to bump `votesParticipated` / `updatesRead` / `lastActiveAt` | P2 — engagement scores never update |

---

## 2. Data flow maps per workflow

Each map shows: **created in → expected to appear in → actually appears in → break point**.

### 2.1 Enterprise formation (W1)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Founder Wizard                                                              │
│ src/components/dashboard/founder/new-enterprise-wizard.tsx                  │
│   POST /api/enterprises                                                     │
│     → Enterprise.create({ status:'draft', founderId, … })                   │
│     → EnterpriseMember.create({ role:'founding_operator', boardSeat:true}) │
│     → OwnershipRecord.create({ founderShares, avgPriceEgp })               │
│     → LedgerEvent(share_issued)                                            │
│                                                                             │
│   Created in Module:  Enterprise, EnterpriseMember, OwnershipRecord,        │
│                       LedgerEvent                                           │
│   Should appear in:    /dashboard/founder (Founder Studio)                  │
│                        /dashboard/portfolio (founder's own holdings)        │
│                        /dashboard/opportunities (Capital Partners discover)│
│                        /dashboard/escrow (Law Firm Client Account balance)   │
│                        /dashboard/graduation (readiness)                    │
│   Actually appears in: Founder Studio ✅, Portfolio ✅, Escrow ✅,           │
│                        Graduation ✅                                        │
│   BREAK: Opportunities ❌ (status='draft' filters it out, but no UI button   │
│          to transition draft → fundraising_active — see W1-A in harmony    │
│          audit)                                                             │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  (missing — POST /api/enterprises/[id]/list not called from UI)
┌──────────────────────────────────────────────────────────────────────────────┐
│ status = 'fundraising_active' (intended next state — never reached from UI) │
│   Should appear in:    /dashboard/opportunities (Capital Partners discover)  │
│                        /dashboard/risk-disclosure (allows investment)       │
│   Actually appears in: nowhere                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Capital participation (W2) — primary market

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Capital Partner reserves units                                              │
│   POST /api/reservations                                                     │
│     → Reservation.create({ status:'reserved', expiresAt:+48h })             │
│     → Enterprise.raisedEgp += amount                                        │
│     → LedgerEvent(funds_received, beneficiary:'law_firm_client_account')     │
│                                                                             │
│   Created in Module:  Reservation, Enterprise (raisedEgp), LedgerEvent     │
│   Should appear in:    /dashboard/portfolio (partner's pending reservation)│
│                        /dashboard/founder (founder's raised counter)         │
│                        /dashboard/escrow (Law Firm Client Account balance)  │
│   Actually appears in: Founder ✅ (raisedEgp), Escrow ✅ (balance incl.)    │
│   BREAK: Portfolio ❌ — Reservation isn't surfaced as a pending holding    │
│          on the partner's Portfolio page. The `OwnershipRecord` is created │
│          only at enterprise formation (founder's seed). Post-confirmation   │
│          there is NO OwnershipRecord.insert for the partner.                │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  (POST /api/reservations/[id]/confirm — no UI caller)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Law firm confirms receipt of funds                                          │
│   POST /api/reservations/[id]/confirm                                       │
│     → Reservation.update({ status:'confirmed' })                            │
│     → Enterprise.lawFirmClientAccountBalanceEgp += amount                   │
│     → InsuranceVault.currentBalanceEgp += 0.5% × amount                     │
│     → LedgerEvent(funds_confirmed)                                          │
│     → LedgerEvent(vault_contribution)                                       │
│                                                                             │
│   Created in Module:  Reservation, Enterprise (balance), InsuranceVault,   │
│                       LedgerEvent                                           │
│   Should appear in:    /dashboard/escrow (balance increased)                │
│                        /dashboard/vault (vault contribution)                │
│                        /dashboard/portfolio (partner's holding) ← MISSING  │
│                        /dashboard/notifications (partner notified) ← MISSING│
│   Actually appears in: Escrow ✅, Vault (unverified — page exists)           │
│   BREAK: Portfolio ❌ — see W2-A in harmony audit. No OwnershipRecord       │
│          created. The partner's paid capital never appears as a holding.    │
│   BREAK: Notifications ❌ — no notification fires to the partner.           │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  (missing endpoint — 'settled' state never reached)
┌──────────────────────────────────────────────────────────────────────────────┐
│ status = 'settled' (intended final state — schema-allowed, never written)  │
│   This state would correspond to:                                            │
│     OwnershipRecord.create({ enterpriseId, userId, equityUnits, avgPrice })│
│     LedgerEvent(share_issued, reason:'reservation settled')                 │
│   Should appear in:    /dashboard/portfolio (finally)                       │
│   Actually appears in: nowhere                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Cross-module data flow chain broken at:** `Reservation.confirmed → OwnershipRecord.create`. The Capital Partner's portfolio never reflects their paid investment.

### 2.3 Governance (W3)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Proposal creation                                                           │
│   POST /api/proposals                                                       │
│     → Proposal.create({ status:'voting_open', votingEndsAt, quorumPct:51,  │
│                         passThreshold:meta.threshold, totalVotingPower })   │
│     → LedgerEvent(proposal_created)                                         │
│                                                                             │
│   Created in Module:  Proposal, LedgerEvent                                 │
│   Should appear in:    /dashboard/governance (board)                        │
│                        /dashboard/notifications (members alerted) ← MISSING│
│   Actually appears in: Governance ✅                                       │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Partner casts vote                                                          │
│   POST /api/proposals/[id]/vote                                             │
│     → Vote.create({ choice, votingPower: holding.equityUnits })             │
│     → Proposal.{votesFor/Against/Abstain} += votingPower  (atomic increment)│
│     → if (quorumMet && passPct >= threshold):                               │
│           Proposal.status = 'executed'                                      │
│           if (type === 'manager_appointment' && policeClearance invalid):  │
│             Proposal.status = 'evidence_submitted' (undocumented state)    │
│     → LedgerEvent(vote_cast | proposal_executed)                            │
│                                                                             │
│   Created in Module:  Vote, Proposal (tally + status), LedgerEvent         │
│   Should appear in:    /dashboard/governance (tally updates)               │
│                        /dashboard/notifications (proposer notified) ← MISSING│
│   Actually appears in: Governance ✅                                       │
│                                                                             │
│   NOTE: Proposal auto-executes on pass, but 'execute' only flips the       │
│   Proposal.status. It does NOT perform the proposal's intended side-effect │
│   (e.g., for type='graduation', it does NOT call graduation/execute; for    │
│   type='dividend', it does NOT create DividendLedger entries). The actual  │
│   side-effect must be done separately — and for graduation, no UI calls it. │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Cross-module data flow chain broken at:** `Proposal.executed → actual side-effect`. For most proposal types, the "executed" state is performative — the ledger records the decision but the platform doesn't act on it. (Exception: `manager_appointment` does run `enforcePoliceClearance` inline.)

### 2.4 Milestone release (W4)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Founder submits evidence                                                    │
│   POST /api/enterprises/[id]/milestones                                     │
│     → Milestone.update({ status:'evidence_submitted', eveConfidence,       │
│                          evidenceNote })                                    │
│     → LedgerEvent(milestone_released, action:'evidence_submitted')          │
│                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^         │
│                          Misleading event type — funds not actually         │
│                          released; should be 'milestone_evidence_submitted'│
│                                                                             │
│   Created in Module:  Milestone, LedgerEvent                               │
│   Should appear in:    /dashboard/founder (Milestone status badge)         │
│                        /dashboard/manager (milestones mini-panel)          │
│                        /dashboard/accounting (evidence awaiting review) ← MISSING UI│
│                        /dashboard/notifications (accounting firm) ← MISSING│
│                        /dashboard/admin/audit ← MISSING audit() call        │
│   Actually appears in: Founder ✅, Manager ✅                              │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  (missing endpoints)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Board review (status: 'evidence_submitted' → 'board_review') ← NO ENDPOINT │
│ Board approval (status: 'board_review' → 'approved')           ← NO ENDPOINT │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  (POST /api/milestones/[id]/accountant-release — no UI caller)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Accountant releases funds                                                   │
│   POST /api/milestones/[id]/accountant-release                              │
│     → enforceAccountantGate({ milestoneStatus })                           │
│         REQUIRES status ∈ { 'board_review', 'approved' }                   │
│         CURRENT status is always 'evidence_submitted'                      │
│         → GATE ALWAYS REJECTS → workflow dead                              │
│     → enforceFundFlow, enforceZeroCustody                                  │
│     → Milestone.update({ status:'released', releasedAt })                   │
│     → Enterprise.lawFirmClientAccountBalanceEgp -= amount                  │
│     → LedgerEvent(milestone_released, full fee breakdown)                  │
│                                                                             │
│   Created in Module:  (nothing — endpoint unreachable)                      │
│   Should appear in:    /dashboard/escrow (balance decremented)             │
│                        /dashboard/founder (milestone 'released' badge)     │
│                        /dashboard/manager (milestone 'released' badge)     │
│   Actually appears in: nowhere                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Cross-module data flow chain broken at:** `evidence_submitted → board_review`. No endpoint, no UI. Downstream modules (Escrow balance decrement, Founder's milestone badge) never receive the released state.

### 2.5 Graduation (W5)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Readiness computed                                                          │
│   GET /api/graduation?enterpriseId=…                                        │
│     → computeGraduationReadiness(enterpriseId)                              │
│       (9 gates: runway, health rating, NOSI, police clearance, stage        │
│        tenure, revenue growth, graduation vote, no open whistleblower,       │
│        no outstanding appeals)                                              │
│     → audit(graduation.read)                                               │
│                                                                             │
│   Created in Module:  (read-only — no DB write; audit only)                │
│   Should appear in:    /dashboard/graduation (ReadinessHero)               │
│   Actually appears in: Graduation ✅                                       │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Call graduation vote                                                        │
│   CallVoteButton → POST /api/proposals (type='graduation')                  │
│     → Proposal.create({ status:'voting_open', type:'graduation' })          │
│     → LedgerEvent(proposal_created)                                        │
│                                                                             │
│   Created in Module:  Proposal, LedgerEvent                                │
│   Should appear in:    /dashboard/governance (board)                       │
│                        /dashboard/notifications (members) ← MISSING         │
│   Actually appears in: Governance ✅, Graduation page (button flips)      │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  (POST /api/proposals/[id]/vote)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Vote passes                                                                 │
│   Proposal.status = 'executed' (auto)                                       │
│   LedgerEvent(proposal_executed)                                            │
│                                                                             │
│   Created in Module:  Proposal (status only)                               │
│   Should appear in:    /dashboard/governance (tally + 'executed' badge)    │
│                        /dashboard/graduation (ready to execute)             │
│   Actually appears in: Governance ✅                                       │
│   BREAK: Graduation page does NOT detect 'graduation proposal executed'    │
│          state and offer an "Execute Graduation" button.                    │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  (POST /api/graduation/execute — NO UI CALLER)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Execute graduation                                                          │
│   POST /api/graduation/execute                                             │
│     → enforce readiness >= 75 AND >=7/9 gates                              │
│     → Enterprise.{ status, stage } = 'graduated'                           │
│     → LedgerEvent(graduation_executed, full readiness snapshot)             │
│     → audit(graduation.execute)                                            │
│                                                                             │
│   Created in Module:  Enterprise (status+stage), LedgerEvent               │
│   Should appear in:    /dashboard/graduation (final 'graduated' state)     │
│                        /dashboard/portfolio (enterprise shows graduated)   │
│                        /dashboard/founder (enterprise shows graduated)    │
│                        /dashboard/notifications (members) ← MISSING         │
│   Actually appears in: nowhere — endpoint is never called                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Cross-module data flow chain broken at:** `Proposal.executed (type=graduation) → Enterprise.status='graduated'`. The vote endpoint auto-flips the proposal but doesn't trigger graduation/execute. No UI calls graduation/execute. Enterprise can "pass" graduation without graduating.

### 2.6 Expense approval (W6)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Submit expense                                                              │
│   POST /api/expenses                                                        │
│     → enforceExpenseAuthority (CRE: <1% solo, 1-10% dual-sig, >10% board)   │
│     → Expense.create({ status:                                              │
│         pct < 1 ? 'approved' (auto, if submitter role satisfies) :          │
│         pct <= 10 ? 'dual_signature_pending' :                              │
│         'pending' })                                                        │
│     → LedgerEvent(expense_approved | expense_submitted)                     │
│                                                                             │
│   Created in Module:  Expense, LedgerEvent                                 │
│   Should appear in:    /dashboard/manager (expense dashboard)               │
│                        /dashboard/notifications (2nd approver if dual-sig) ← MISSING│
│   Actually appears in: Manager ✅                                          │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  (POST /api/expenses/[id]/approve)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Approve (1st sig → still dual_signature_pending OR final → approved)        │
│   → Expense.update({ approver1Id, approver2Id, status:'approved' })         │
│   → LedgerEvent(expense_approved | cre_decision expense_signature_added)    │
│                                                                             │
│   Created in Module:  Expense (status + approver IDs), LedgerEvent         │
│   Should appear in:    /dashboard/manager (badge 'approved')               │
│                        /dashboard/escrow (ledger feed) ← works if eventType matches filter│
│                        /dashboard/notifications (submitter notified) ← MISSING│
│   Actually appears in: Manager ✅, Escrow ✅ (event type matches filter)   │
│                                                                             │
│   No reject path:  Expense.status='rejected' is in the schema enum but     │
│   no endpoint ever writes it.                                              │
│   No flag path:    Expense.status='flagged' is in the schema enum but     │
│   no endpoint ever writes it.                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Cross-module data flow:** functional for the approve happy path. Broken for reject / flag (no endpoint).

### 2.7 Skill-equity claims (W7)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Claim submitted                                                             │
│   POST /api/skill-equity                                                    │
│     → Employee lookup + tenureMonths verification (>= 24 months required)   │
│     → SkillEquityClaim.create({ status:'pending', tenureVerified:true,      │
│                                 documentCid, documentHash })                │
│     → LedgerEvent(cre_decision, action:'skill_equity_claim_submitted')     │
│                                                                             │
│   Created in Module:  SkillEquityClaim, LedgerEvent                        │
│   Should appear in:    /dashboard/skill-equity (claimant's claims list)    │
│                        /dashboard/manager (board review queue) ← MISSING UI│
│                        /dashboard/notifications (board members) ← MISSING   │
│                        /dashboard/admin/audit ← MISSING audit() call        │
│   Actually appears in: Skill-Equity ✅                                     │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  (POST /api/skill-equity/[id]/review — NO UI CALLER)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Board reviews claim                                                         │
│   POST /api/skill-equity/[id]/review                                       │
│     → enforceSalaryToEquity (CRE: ≤10% of salary, 15% discount, consent,  │
│       anti-duplicate, 12-month lockup) → computes equityUnitsToIssue       │
│     → askConstitutionalAI (skill_equity_assessment)                         │
│     → SkillEquityClaim.update({ status:'approved'/'rejected',               │
│                                 equityGrantPct, reviewedById, aiAssessment})│
│     → LedgerEvent(cre_decision, action:'skill_equity_reviewed')            │
│                                                                             │
│   Created in Module:  SkillEquityClaim (status update), LedgerEvent        │
│   SHOULD ALSO CREATE:  OwnershipRecord.create({                            │
│       enterpriseId, userId, equityUnits: equityUnitsToIssue,               │
│       avgPriceEgp: discountedPriceEgp,                                     │
│       restrictedUntil: now + 12 months })  ← MISSING                        │
│                                                                             │
│   Should appear in:    /dashboard/skill-equity (claimant's claim updated)  │
│                        /dashboard/portfolio (new equity units) ← MISSING    │
│                        /dashboard/notifications (claimant notified) ← MISSING│
│                        /dashboard/admin/audit ← MISSING audit() call        │
│   Actually appears in: Skill-Equity ✅ (after refresh)                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Cross-module data flow chain broken at:** `SkillEquityClaim.approved → OwnershipRecord.create`. The CRE computes `equityUnitsToIssue` and `discountedPriceEgp`, but no `OwnershipRecord` is written. The claimant's portfolio never reflects the grant.

### 2.8 Whistleblower (W8)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ File report                                                                 │
│   POST /api/whistleblower                                                   │
│     → askConstitutionalAI (whistleblower_triage) → credibility + aiSummary  │
│     → WhistleblowerReport.create({ trackingCode, status:'submitted'/'validated'/'investigating', bondEgp:5000 })│
│     → LedgerEvent(whistleblower_filed) [only if enterpriseId provided]      │
│     → audit(whistleblower.file)                                            │
│                                                                             │
│   Created in Module:  WhistleblowerReport (NO filedById field!), LedgerEvent│
│   Should appear in:    /dashboard/whistleblower (filer's own reports)       │
│                        /dashboard/whistleblower (enterprise board — redacted)│
│                        /dashboard/admin (steward triage queue) ← MISSING UI│
│   Actually appears in: Whistleblower page shows ALL reports system-wide 🚨  │
│                                                                             │
│   The /dashboard/whistleblower page query is:                              │
│     db.whistleblowerReport.findMany({ where: {} })  // empty filter!        │
│   The API GET endpoint is hardened (returns [] for users with no            │
│   memberships) but the dashboard bypasses the API and queries the DB        │
│   directly with no filter.                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  (missing endpoints)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Investigate (status → 'investigating')    ← NO ENDPOINT (initial only)      │
│ Resolve    (status → 'resolved', bountyPaidEgp = X) ← NO ENDPOINT           │
│                                                                             │
│   Created in Module:  (nothing — no resolution path)                       │
│   Should appear in:    /dashboard/whistleblower (status badge update)      │
│                        /dashboard/notifications (filer notified) ← MISSING │
│   Actually appears in: nowhere                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Cross-module data flow chain broken at:** `WhistleblowerReport.filed → filer linkage`. No `filedById` column. The page cannot show the filer their own reports.

### 2.9 Appeals (W9)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ File appeal                                                                 │
│   POST /api/appeals                                                         │
│     → askConstitutionalAI (appeal_ai_ruling) → aiRuling                    │
│     → AppealCase.create({ status:'ai_ruling', stage:1, feeEgp:500,         │
│                           aiRuling, precedentNote })                       │
│     → LedgerEvent(appeal_filed) [if enterpriseId]                          │
│     → audit(appeal.file)                                                   │
│                                                                             │
│   Created in Module:  AppealCase, LedgerEvent                               │
│   Should appear in:    /dashboard/appeals (filer's cases + enterprise's)   │
│                        /dashboard/graduation (open appeals block readiness) ✅│
│                        /dashboard/notifications (enterprise board) ← MISSING│
│   Actually appears in: Appeals ✅, Graduation gate ✅                      │
│                                                                             │
│   ⚠️ Page reads `status === 'filed'` for the "filed" stat, but the API     │
│   writes `status: 'ai_ruling'`. The stat is always 0.                      │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  (missing endpoints)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Escalate to human panel (status → 'human_panel')  ← NO ENDPOINT            │
│ Final binding ruling   (status → 'final_ruling')  ← NO ENDPOINT             │
│ Resolve                (status → 'resolved')      ← NO ENDPOINT             │
│                                                                             │
│   Created in Module:  (nothing — no escalation path)                       │
│   Should appear in:    /dashboard/appeals (status badge)                   │
│                        /dashboard/graduation (resolved appeals no longer   │
│                        block readiness) ← MISSING                          │
│   Actually appears in: nowhere                                              │
│                                                                             │
│   ⚠️ Because `computeGraduationReadiness` filters `status != 'resolved'`,  │
│   and no endpoint ever writes 'resolved', open appeals PERMANENTLY block   │
│   graduation for any enterprise with an open case.                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Cross-module data flow chain broken at:** `AppealCase.filed → resolution`. No escalation endpoint. Side effect: poisons graduation readiness gate.

### 2.10 Secondary market (W10)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Place order                                                                  │
│   POST /api/orders                                                           │
│     → enforceKycGate, enforceNotFrozen, enforcePriceBand                    │
│     → if sell: enforceEquityLockUp + check OwnershipRecord.equityUnits     │
│     → TradeOrder.create({ status:'open' })                                 │
│     → LedgerEvent(share_transferred, note: 'order listed')                 │
│     → runFifoMatching(order.id)  ← server-side, after the tx commits       │
│                                                                             │
│   Created in Module:  TradeOrder, LedgerEvent                              │
│   Should appear in:    /dashboard/market (order book)                       │
│                        /dashboard/portfolio (my orders)                    │
│   Actually appears in: Market ✅                                            │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  (runFifoMatching — server-side)
┌──────────────────────────────────────────────────────────────────────────────┐
│ FIFO matching                                                                │
│   runFifoMatching(order.id)  (src/lib/aurienta/matching-engine.ts)          │
│     → finds counterparty order(s), creates Trade rows                      │
│     → TradeOrder.{filledEquityUnits, status:'partially_filled'|'filled'}   │
│     → LedgerEvent(share_transferred, note: 'trade matched')               │
│     → OwnershipRecord updates (buyer gets +units, seller gets -units)      │
│                                                                             │
│   Created in Module:  Trade, TradeOrder (filled status), OwnershipRecord  │
│   Should appear in:    /dashboard/market (recent trades)                  │
│                        /dashboard/portfolio (updated holdings)             │
│   Actually appears in: Market ✅, Portfolio ✅                             │
│                                                                             │
│   Missing: TradeOrder.cancel — orders cannot be cancelled by the user.    │
│   Stale 'open' orders accumulate forever.                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Cross-module data flow:** functional for the happy path. Missing cancel endpoint.

### 2.11 Anti-fragility vault loans (W11)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Enterprise requests loan                                                    │
│   POST /api/vault/loan                                                       │
│     → VaultLoan.create({ status:'pending', amountEgp, reason,             │
│                          boardVotePct, repaymentDueAt })                   │
│     → LedgerEvent(vault_loan_requested)                                    │
│                                                                             │
│   Created in Module:  VaultLoan, LedgerEvent                              │
│   Should appear in:    /dashboard/vault (loan requests list)               │
│                        /dashboard/notifications (steward) ← MISSING         │
│   Actually appears in: Vault ✅                                            │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  (PATCH /api/vault/loan/[id] — exists but NO UI caller)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Steward approves / rejects / records repayment                              │
│   PATCH /api/vault/loan/[id]  Body: { action: 'approve'|'reject'|'repay' } │
│     → VaultLoan.update({ status:'approved'/'rejected'/'repaid'/'forgiven'})│
│     → if approved: Enterprise.InsuranceVault.currentBalanceEgp -= amount   │
│                    Enterprise.InsuranceVault.totalLoanedEgp += amount       │
│     → if repaid:   Enterprise.InsuranceVault.currentBalanceEgp += amount   │
│                    Enterprise.InsuranceVault.totalRepaidEgp += amount       │
│                    VaultLoan.repaidEgp += amount                            │
│     → LedgerEvent(vault_loan_approved / vault_loan_repaid / …)             │
│                                                                             │
│   Created in Module:  VaultLoan, InsuranceVault, LedgerEvent               │
│   Should appear in:    /dashboard/vault (status updates)                   │
│                        /dashboard/notifications (enterprise notified) ← MISSING│
│   Actually appears in: nowhere — endpoint never called from UI             │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Cross-module data flow chain broken at:** `VaultLoan.pending → approved/repaid`. Endpoint exists; no UI button.

### 2.12 Admin enterprise freeze / unfreeze (W12)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Admin freezes enterprise                                                    │
│   POST /api/admin/enterprises/[id]/freeze                                  │
│     → Enterprise.update({ status:'frozen', frozenAt:now })                │
│     → LedgerEvent(enterprise_frozen)                                       │
│                                                                             │
│   Created in Module:  Enterprise (status), LedgerEvent                    │
│   Should appear in:    /dashboard/admin/enterprises/[id] (status badge)    │
│                        All other dashboards (every API checks enforceNotFrozen)│
│   Actually appears in: Admin ✅, all other dashboards correctly reject    │
│   transactions on frozen enterprises (CRE gate).                            │
│                                                                             │
│   ✅ This is the one workflow with correct cross-module propagation —       │
│   every state-mutating API calls enforceNotFrozen.                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Cross-module propagation matrix

For each domain event, which downstream modules should observe it and which actually do:

| Event (LedgerEvent type) | Source module | Founder | Portfolio | Manager | Escrow | Graduation | Notifications | Audit | Admin Audit |
|---|---|---|---|---|---|---|---|---|---|
| `share_issued` (founder seed) | Enterprise | ✅ | ✅ | — | ✅ | ✅ | ❌ | ❌ | ❌ |
| `share_issued` (post-confirm settlement) | Capital | ❌ | ❌ | — | — | — | ❌ | ❌ | ❌ |
| `funds_received` (reservation) | Capital | ✅ | ❌ | — | ✅ | — | ❌ | ✅ | ✅ |
| `funds_confirmed` (law firm) | Capital | ✅ | ❌ | — | ✅ | — | ❌ | ✅ | ✅ |
| `vault_contribution` | Capital | — | — | — | ✅ | — | ❌ | — | ✅ |
| `capital_formation_closed` | Enterprise | ✅ | — | — | ✅ | — | ❌ | ✅ | ✅ |
| `proposal_created` | Governance | — | — | — | — | — | ❌ | ✅ | ✅ |
| `vote_cast` / `proposal_executed` | Governance | — | — | — | — | — | ❌ | ✅ | ✅ |
| `expense_submitted` / `expense_approved` | Treasury | — | — | ✅ | ✅ (filter matches) | — | ❌ | ✅ | ✅ |
| `milestone_released` (evidence_submitted — misnamed) | Treasury | ✅ | — | ✅ | ❌ (filter mismatch) | — | ❌ | ❌ | ❌ |
| `milestone_released` (actual release — unreachable) | Treasury | ❌ | — | ❌ | ❌ | — | ❌ | ✅ | ✅ |
| `graduation_executed` (unreachable) | Graduation | ❌ | ❌ | — | — | ❌ | ❌ | ✅ | ✅ |
| `whistleblower_filed` | Transparency | — | — | — | — | ❌ (gate poisoned by appeals instead) | ❌ | ✅ | ✅ |
| `appeal_filed` | Transparency | — | — | — | — | ❌ (gate poisons — open appeals block) | ❌ | ✅ | ✅ |
| `skill_equity_claim_submitted` | Workforce | — | — | ❌ (no review queue) | — | — | ❌ | ❌ | ❌ |
| `skill_equity_reviewed` | Workforce | — | ❌ (no OwnershipRecord) | — | — | — | ❌ | ❌ | ❌ |
| `vault_loan_*` | Capital | — | — | — | ✅ | — | ❌ | ✅ | ✅ |
| `share_transferred` (secondary market) | Capital | — | ✅ | — | ✅ | — | ❌ | ✅ | ✅ |
| `enterprise_frozen` / `unfreeze` | Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| `cre_decision` (generic) | all | — | — | — | — | — | ❌ | — | — |

**Cells marked ❌** are the cross-module propagation gaps. Each is a finding in `WORKFLOW_HARMONY_AUDIT.md`.

---

## 4. Tenant-filter matrix

For each dashboard page, how data is scoped to the calling user / enterprise:

| Page | Tenant filter | Verified correct? |
|---|---|---|
| `/dashboard/portfolio` | `user.ownershipRecords` (Prisma relation) | ✅ |
| `/dashboard/founder` | `where:{founderId:user.id}` + memberships | ✅ |
| `/dashboard/governance` | `where:{enterpriseId:{in:enterpriseIds}}` | ✅ |
| `/dashboard/graduation` | `where:{id:{in:enterpriseIds}}` | ✅ |
| `/dashboard/manager` | `where:{id:{in:managerMemberships.enterpriseId}}` | ✅ |
| `/dashboard/skill-equity` | `where:{userId:user.id}` | ✅ |
| `/dashboard/whistleblower` | `where:{}` (empty filter — fetches ALL reports) | 🚨 NO |
| `/dashboard/admin/audit` | role-gated to `aurienta_rep` + filter built from search params | ✅ |
| `/dashboard/escrow` | `where:{founderId:user.id}` + member enterprises | ✅ |
| `/dashboard/notifications` | `where:{userId:user.id}` | ✅ |
| `/dashboard/appeals` | `OR:[{filedById:user.id},{enterpriseId:{in:enterpriseIds}}]` | ✅ |
| `/dashboard/admin/enterprises` | role-gated to `aurienta_rep` | ✅ |
| `/dashboard/admin/users` | role-gated to `aurienta_rep` | ✅ |
| `/dashboard/vault` | `where:{enterpriseId:{in:enterpriseIds}}` | ✅ |

**Only one page has a tenant-filter bug:** `/dashboard/whistleblower` (P0 — see harmony audit DE-11).

---

## 5. End-to-end example traces

### 5.1 Happy path: a partner invests 5,000 EGP in an active enterprise

1. **Partner visits `/dashboard/opportunities`** → server fetches `db.enterprise.findMany({where:{status:{in:['active','fundraising_active']}}})` → renders cards.
2. **Partner clicks "Reserve 100 Equity Units"** → dialog POSTs to `/api/reservations` with `{enterpriseId, shares:100, amountEgp:5000}`.
3. **API** validates KYC, price band, family consent, dynamic minimum; creates `Reservation({status:'reserved', expiresAt:+48h})`; increments `Enterprise.raisedEgp += 5000`; appends `LedgerEvent(funds_received)`; calls `audit(reservation.create)`. Returns 200 with `referenceCode`.
4. **Partner sees toast** "Reservation created — reference AURI-2026-…"
5. **🚨 BREAK:** No `OwnershipRecord` is created. The partner's `/dashboard/portfolio` does not show this pending investment. No notification to the founder. The partner must remember their `referenceCode` to track.
6. **Law firm rep** (separately) would call `/api/reservations/[id]/confirm` — but **there is no UI for them** to do this. They'd have to construct the request programmatically.
7. **🚨 BREAK:** Reservation stays `reserved` until either confirmed (manual API call) or expired (no scheduler exists to mark `expired` after 48h).

**Data continuity verdict:** broken at 4 points (steps 5, 6, 7, plus the missing `settled → OwnershipRecord` step that should follow confirmation).

### 5.2 Happy path: an enterprise graduates

1. **Founder visits `/dashboard/graduation`** → server computes `computeGraduationReadiness` → renders score + 9 gates. Suppose score = 92.
2. **Founder clicks "Call graduation vote"** → `CallVoteButton` POSTs to `/api/proposals` with `type:'graduation'`.
3. **API** creates `Proposal({status:'voting_open', type:'graduation', passThreshold:75, votingEndsAt:+14d})`, appends `LedgerEvent(proposal_created)`, calls `audit(proposal.create)`. Returns 201.
4. **UI** refreshes; button flips to "Vote already live".
5. **🚨 BREAK:** No notification to other enterprise members. They must discover the proposal on `/dashboard/governance` themselves.
6. **Members vote** over the next 14 days via `/dashboard/governance` → VotingModal → POST `/api/proposals/[id]/vote`.
7. **When the final vote pushes tallies over quorum+threshold**, the vote endpoint sets `Proposal.status='executed'` and appends `LedgerEvent(proposal_executed)`.
8. **🚨 BREAK:** The vote endpoint does NOT trigger `graduation/execute`. The enterprise's `status` and `stage` remain `active` / `stage_3`. The `GraduationRecord` is never created.
9. **🚨 BREAK:** No UI surfaces a "Execute Graduation" button. The `/api/graduation/execute` endpoint exists but no caller exists in the codebase (verified by grep).
10. Even if step 9 were fixed, the API requires `readiness.score >= 75` AND `>= 7 of 9 gates passing` — but `computeGraduationReadiness` counts open `appealCases` and `whistleblowerReports` against the enterprise, and since neither has a resolution endpoint (see W8/W9), any open case permanently blocks graduation.

**Data continuity verdict:** broken at 4 points (steps 5, 8, 9, 10).

### 5.3 Happy path: founder releases a milestone

1. **Founder visits `/dashboard/founder`** → opens Enterprise Detail Dialog → clicks "Submit Evidence" on a milestone.
2. **MilestoneEvidenceDialog** POSTs to `/api/enterprises/[id]/milestones` with `{milestoneId, evidenceNote}`.
3. **API** sets `Milestone.status='evidence_submitted'`, sets `eveConfidence`, appends `LedgerEvent(milestone_released, action:'evidence_submitted')` (misleading event type). Does NOT call `audit()`.
4. **🚨 BREAK:** No notification to the accounting firm. No `audit()` call. The accountant's `/dashboard/accounting` page (if it existed) would have no "evidence awaiting review" queue.
5. **Accounting firm rep** (separately) would need to call `/api/milestones/[id]/accountant-release` with `{action:'verify'}`.
6. **🚨 BREAK:** `enforceAccountantGate` REQUIRES `milestoneStatus ∈ {board_review, approved}`. The current status is `evidence_submitted` (just set by step 3). The gate REJECTS. **The accountant-release endpoint can NEVER succeed.**
7. There is no endpoint to transition `evidence_submitted → board_review` or `board_review → approved`.
8. The milestone stays in `evidence_submitted` forever. The law firm client account balance is never decremented. The vendor never gets paid.

**Data continuity verdict:** workflow dead at the accountant gate.

---

## 6. The "missing endpoints" inventory

Endpoints the schema/UI implies should exist but don't:

| Missing endpoint | Why needed | Severity |
|---|---|---|
| `POST /api/milestones/[id]/board-review` | evidence_submitted → board_review transition | P0 |
| `POST /api/milestones/[id]/approve` | board_review → approved transition | P0 |
| `POST /api/expenses/[id]/reject` | * → rejected transition | P1 |
| `POST /api/expenses/[id]/flag` | * → flagged transition | P1 |
| `POST /api/proposals/[id]/execute` (manual) | for type=graduation where auto-execute doesn't perform the actual side-effect | P0 (or alternatively wire CallVoteButton to call graduation/execute) |
| `POST /api/appeals/[id]/escalate` | ai_ruling → human_panel transition | P1 |
| `POST /api/appeals/[id]/final-ruling` | human_panel → final_ruling transition | P1 |
| `POST /api/appeals/[id]/resolve` | * → resolved transition (also unblocks graduation gate) | P1 |
| `POST /api/whistleblower/[id]/resolve` | * → resolved transition + bountyPaidEgp | P1 |
| `POST /api/orders/[id]/cancel` | open → cancelled transition | P2 |
| `POST /api/reservations/[id]/settle` (or hook inside confirm) | confirmed → settled + OwnershipRecord.create | P0 |
| UI button calling `POST /api/enterprises/[id]/list` | draft → fundraising_active | P0 |
| UI button calling `POST /api/enterprises/[id]/close-capital-formation` | fundraising_active → active | P0 |
| UI button calling `POST /api/graduation/execute` | active → graduated | P0 |
| UI button calling `POST /api/milestones/[id]/accountant-release` | milestone → released | P0 |
| UI button calling `POST /api/skill-equity/[id]/review` | claim → approved/rejected | P0 |
| UI button calling `PATCH /api/vault/loan/[id]` | loan → approved/repaid/forgiven | P2 |

---

## 7. The "missing side-effects" inventory

Side-effects that should fire inside the `db.$transaction` of state-mutating endpoints but don't:

| Endpoint | Missing side-effect | Affected downstream module | Severity |
|---|---|---|---|
| `POST /api/reservations/[id]/confirm` | `OwnershipRecord.create` for the partner | Portfolio | P0 |
| `POST /api/reservations/[id]/confirm` | `Notification.create` to the partner | Notifications | P0 |
| `POST /api/reservations` | `Notification.create` to the founder | Notifications | P1 |
| `POST /api/proposals` | `Notification.create` to enterprise members | Notifications | P0 |
| `POST /api/proposals/[id]/vote` (on pass) | `Notification.create` to proposer + members | Notifications | P1 |
| `POST /api/expenses` (dual-sig path) | `Notification.create` to 2nd required approver | Notifications | P1 |
| `POST /api/expenses/[id]/approve` | `Notification.create` to submitter | Notifications | P1 |
| `POST /api/enterprises/[id]/milestones` | `Notification.create` to accounting firm | Notifications | P1 |
| `POST /api/milestones/[id]/accountant-release` | `Notification.create` to founder + board | Notifications | P1 |
| `POST /api/skill-equity` | `Notification.create` to board | Notifications | P1 |
| `POST /api/skill-equity/[id]/review` | `Notification.create` to claimant + `OwnershipRecord.create` | Notifications, Portfolio | P1 |
| `POST /api/whistleblower` | `Notification.create` to enterprise board (redacted) | Notifications | P1 |
| `POST /api/appeals` | `Notification.create` to enterprise board | Notifications | P1 |
| `POST /api/graduation/execute` | `Notification.create` to all enterprise members + `GraduationRecord.create` | Notifications, Graduation | P0 |
| `POST /api/vault/loan` | `Notification.create` to steward | Notifications | P1 |
| `POST /api/enterprises` | `audit()` call | Audit | P2 |
| `POST /api/enterprises/[id]/milestones` | `audit()` call + correct event type | Audit, Ledger | P1 |
| `POST /api/skill-equity` | `audit()` call | Audit | P1 |
| `POST /api/skill-equity/[id]/review` | `audit()` call | Audit | P1 |

---

## 8. Recommended central helpers

To fix the systemic notification+task gaps without touching every endpoint individually, create two shared helpers and call them from every state-mutating endpoint's `db.$transaction`:

```ts
// src/lib/aurienta/notifications.ts  (proposed)
export async function notify(
  tx: PrismaTransaction,
  recipient: { userId: string; enterpriseId?: string },
  payload: {
    category: 'governance' | 'treasury' | 'compliance' | 'milestone' | 'dividend' | 'system';
    title: string;
    body: string;
    ctaHref?: string;  // ← deep link to the related workflow page
    ctaLabel?: string;
  },
): Promise<void> {
  await tx.notification.create({
    data: {
      userId: recipient.userId,
      enterpriseId: recipient.enterpriseId ?? null,
      title: payload.title,
      body: payload.body,
      category: payload.category,
      // persist the CTA in the body so the notification center can render it
      // once the UI is updated to deep-link:
      body: payload.ctaHref
        ? `${payload.body}\n\n→ ${payload.ctaHref}`
        : payload.body,
    },
  });
}
```

```ts
// src/lib/aurienta/tasks.ts  (proposed)
export async function createTask(
  tx: PrismaTransaction,
  userId: string,
  payload: {
    enterpriseId?: string;
    title: string;
    description: string;
    type: 'vote' | 'milestone' | 'police_clearance' | 'nosi' | 'review' | 'signature' | 'dividend';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueAt?: Date;
    ctaLabel?: string;
    ctaHref?: string;
  },
): Promise<void> {
  await tx.dashboardTask.create({ data: { userId, ...payload } });
}
```

Both helpers run **inside** the caller's existing `db.$transaction` so they commit atomically with the domain mutation — no notification can leak if the transaction rolls back.

The notification-center UI then needs a follow-up change to render `ctaHref` as a clickable button (see harmony audit NL-B).

---

**End of cross-module data flow map.** Companion to `WORKFLOW_HARMONY_AUDIT.md`. No code changes were made.
