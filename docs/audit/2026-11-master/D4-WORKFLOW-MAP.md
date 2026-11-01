# DELIVERABLE 4 — END-TO-END WORKFLOW MAP
**Method:** workflows traced through code (entry → API → CRE → DB → notification → outcome) and exercised live where seed data permits. Prior workflow audit (Phase C, coo-audit) validated 7/10 E2E; this cycle re-verified the golden paths and fixed the blockers found.

## W1 — Identity: Register → Verify → Operate
1. Visitor `/register` → 5-step wizard (intent → role → tier → KYC sandbox → pledge)
2. `POST /api/auth/register` → zod validation → scrypt hash → Ed25519 keypair (AES-GCM at rest) → L1 user + session
3. `POST /api/verification/kyc` (client scores in sandbox; P0-2 fix: no default elevation) → verificationStatus queue → 48h SLA cron (`/api/cron/verification-sla`, CRON_SECRET)
4. Login → session (SHA3-256 tokenHash) → dashboard (MFA gates for privileged roles)
**Live-verified:** sign-in ×5 users, wrong-password 401, sign-out revocation. Register flow validated in prior cycle (L1 creation verified).
**Exit states:** L0 suspended (admin) · L1 email · L2 KYC · L3 enhanced · L4 institutional.

## W2 — Capital: Discover → Reserve → Escrow → Close
1. Investor `/dashboard/opportunities` (server component, live enterprise data) → discovery API (5-dimension scoring)
2. `POST /api/reservations` (session + rate 30/min + CRE tier-cap + KYC gate) → Reservation row
3. Law-firm client account webhook `POST /api/v1/webhook/payment` (Ed25519 sig vs LawFirm.publicKey) → funds_received ledger event
4. Escrow tracked per law firm (public zero-custody proof) → `POST /api/enterprises/[id]/close-capital-formation` → ownership records + share_issued ledger
**Live-verified:** opportunities page 200 with real data; reservation API tested (validation path); webhook signature verification code-audited; zero-custody stats live.

## W3 — Governance: Proposal → Vote → Execute
1. Member `/dashboard/governance` → `POST /api/proposals` (type from 9 constitutional types, aiRiskScore)
2. Quorum check (computeQuorum; 75% supermajority for constitutional amendments) → `POST /api/proposals/[id]/vote` (one-vote unique, CRE-gated)
3. `/api/cron/proposal-expiry` (daily 02:00, CRON_SECRET) → expired proposals
4. Executed → ledger event + notifications + (manager appointments → EnterpriseMember)
**Live-verified:** proposals list 200 (4 seeded), RBAC on vote endpoint (403 unauth), CRE vote policy unit-tested. Vote on open proposal: no voting_open proposal in seed — data condition documented.

## W4 — Operations: Expense → Dual Signature → Ledger
1. Employee submits expense (tier-banded authority `enforceExpenseAuthority`)
2. Approver 1 + Approver 2 (dual signature above threshold) → approved → expense_approved ledger event
3. Flagged anomalies → anomaly narration (AI consensus, 28-model registry)
**Verified:** endpoint probe (401/405 correct), CRE authority policy unit-tested, expense seed rows present.

## W5 — Milestone: Evidence → Board Review → Release
1. Founder uploads evidence `POST /api/evidence` (real CIDv1 computed; pin mock-gated B5)
2. Board review (board-briefing AI consensus) → approved → accountant release `/api/milestones/[id]/accountant-release` (accounting-firm gate) → milestone_released ledger + escrow draw
**Verified:** evidence + accountant-release endpoints probed (auth correct); milestone seed data present.

## W6 — Graduation: Readiness → Execute → Bond
1. Genome (50+ attributes) + graduation readiness score → simulator (AI)
2. `POST /api/graduation/execute` → GraduationRecord + graduation ledger event + tier F/JSC status
3. `POST /api/graduation-bond/issue` → cryptographic bond; public verify `/api/graduation-bond/verify/[bondId]`
**Live-verified:** graduation pages 200; SmartFarm seeded graduated with record + bond fields; verify endpoint 404 on fake ID (correct).

## W7 — Trading: Order → Match → Settle
1. `POST /api/orders` (CRE price band ±5%, KYC gate, rate-limited)
2. FIFO matching engine (§9.6) → atomic Trade + ledger + ownership update; circuit-breaker 3-level halts
3. Public trade log `/enterprise/[slug]/trades` + `/api/public/enterprise/[slug]/trades`
**Live-verified:** orders endpoint CSRF+auth (403), market page 200 with order book data, public trades API 200.

## W8 — Succession: Declare → Activate → Execute
1. `POST /api/succession` (beneficiary nationalId AES-GCM encrypted) → declaration
2. Activate (death/incapacity verification) → execute → ownership transfer per EconomicBeneficiary
**Verified:** endpoints probed; encryption code-audited; standalone succession (family business, Shamir k-of-n) separate stack.

## W9 — Redress: Whistleblower → Appeal → Arbitration
1. `POST /api/whistleblower` (trackingCode, encrypted, 5/min) → resolve
2. `POST /api/appeals` → 6-stage dispute resolution (Inngest workflow #1, 72h auto-escalate CRCICA)
**Verified:** endpoints probed; Inngest function defensive init fixed this cycle.

## W10 — Admin: Steward operations
Users (role assign/revoke, suspend) · enterprises (freeze/unfreeze) · audit log viewer + export · settings. All requireRole("aurienta_rep") + audit-logged + **now rate-limited**.
**Live-verified:** all 4 denials for member (403); rep path validated in prior cycle.

## Workflow health summary
| Workflow | Status |
|---|---|
| W1 Identity | PASS (live) |
| W2 Capital | PASS (live + code-trace; webhook external leg = law-firm manual process) |
| W3 Governance | PASS (list/RBAC live; vote execution covered by unit tests — no open proposal in seed) |
| W4 Expenses | PASS (code-trace + unit) |
| W5 Milestones | PASS (code-trace) |
| W6 Graduation | PASS (live + seed) |
| W7 Trading | PASS (live read path; match engine unit-tested prior cycle) |
| W8 Succession | PASS (code-trace) |
| W9 Redress | PASS (code-trace) |
| W10 Admin | PASS (live RBAC) |

No dead ends, no circular navigation, no contradictory status transitions found. Nav now exposes all 11 groups to entitled roles (this cycle's P1 fix).
