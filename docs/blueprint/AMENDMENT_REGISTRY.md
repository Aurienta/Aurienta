# AURIENTA Constitutional Amendment Registry

**Canonical Version:** 3.0.0
**Last Updated:** 2026-08-09
**Authority:** Founder & Sole Owner — Mohamed Eltonsy
**Constitutional Hash (Root):** `0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A`

---

## Purpose

This document records all constitutional amendments to the AURIENTA blueprint. A constitutional amendment is a change that modifies, adds, or removes a non-amendable rule, a founding principle, or a core constitutional invariant.

**The original blueprint is IMMUTABLE.** All changes are recorded here as amendments with full traceability.

---

## Amendment Classification

| Class | Description | Approval Required |
|-------|-------------|-------------------|
| **Foundational** | Changes to the constitutional hash, founding principle, or non-amendable rules | Founder + Constitutional Council (when active) |
| **Structural** | Changes to the 3-entity architecture, tier system, or role definitions | Founder |
| **Operational** | Changes to CRE policies, enforcement rules, or procedural workflows | Founder |
| **Terminological** | Changes to the constitutional terminology dictionary | Founder |
| **Additive** | New volumes, systems, or capabilities that do not modify existing rules | Founder |

---

## Amendment Registry

### AM-001: Constitutional Terminology Standard
- **Class:** Terminological
- **Date:** 2026-08-07 (Prompt 1)
- **Status:** APPROVED
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Established 20 approved constitutional terms replacing legacy terminology (shares → Equity Units, investor → Capital Partner, escrow → Law Firm Client Account, etc.). 10 forbidden patterns defined with automated validation.
- **Impact:** All 17 invariants — terminological alignment
- **Implementation:** `src/lib/aurienta/terminology.ts`
- **DB Migration:** `@map` annotations preserve legacy column names while exposing constitutional names in code
- **Rollback:** Not permitted (terminological changes are foundational)

### AM-002: Three-Entity Institutional Architecture
- **Class:** Structural
- **Date:** 2026-08-07 (Prompt 2)
- **Status:** APPROVED
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Established the canonical 3-entity corporate structure: AURIENTA Holding Group (IP, governance, capital allocation) → AURIENTA Operations (tech + ops) + AURIENTA Advisory (institutional ecosystem). AURIENTA Advisory NEVER develops software.
- **Impact:** Invariant #13 (Three-Entity Structure), Invariant #14 (Founder Identity)
- **Implementation:** `src/lib/aurienta/institutional-architecture.ts`, Volume 21
- **Rollback:** Not permitted (structural foundation)

### AM-003: Institutional Governance v1.0 (Frozen)
- **Class:** Additive
- **Date:** 2026-08-07 (Prompt 6)
- **Status:** FROZEN as Constitution v1.0
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Established 11 governance committees, delegation matrix, 13 risks, 10 controls, 13 cadences, 14 KPIs, and formal change-management process. Frozen as v1.0 — all future changes require formal change management.
- **Impact:** Invariant #9 (Constitutional Supremacy), Invariant #12 (Constitutional Roles)
- **Implementation:** `src/lib/aurienta/institutional-governance.ts`
- **Rollback:** Not permitted (frozen constitution)

### AM-004: P1 Constitutional Enforcement (NOSI + Salary-to-Equity)
- **Class:** Operational
- **Date:** 2026-08-08 (Prompt 21)
- **Status:** APPROVED
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Implemented 4 new CRE enforcement functions: NOSI 30-day registration deadline (5 states: compliant, approaching, overdue, frozen, unknown), NOSI 60-day expense freeze, Salary-to-Equity conversion (10% max, 15% discount, consent required, anti-duplicate), Equity Lockup.
- **Impact:** Invariant #1 (Zero Custody), Invariant #2 (CRE), workforce/labor constitutional capability
- **Implementation:** `src/lib/aurienta/cre.ts` — functions: `enforceNosiRegistration`, `enforceNosiExpenseFreeze`, `enforceSalaryToEquity`, `enforceEquityLockUp`
- **Rollback:** Not permitted (constitutional enforcement)

### AM-005: AI Salary Engine (Compensation Intelligence)
- **Class:** Additive
- **Date:** 2026-08-08 (P1-4 Remediation)
- **Status:** APPROVED
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Implemented the blueprint Volume 8 §8.4 AI Salary Engine. Formula: Salary = Base × Tier_multiplier × Performance_score × Regional_adjustment × Profit_factor. Tier multipliers (A=0.8, B=1.0, C=1.3, D=1.5, E=0.9, F=1.5), regional adjustments (Cairo=1.0 through Upper Egypt=0.8), AI validation via Brain AI, board override (75% vote, >200% triggers shareholder notification), public logging of all overrides.
- **Impact:** Workforce/Labor constitutional capability, Invariant #2 (CRE)
- **Implementation:** `src/lib/aurienta/salary-engine.ts`, `src/app/api/ai/salary/route.ts`, `src/app/api/ai/salary/override/route.ts`, `enforceSalaryConstitutionality()` in `cre.ts`
- **Rollback:** Not permitted (constitutional workforce capability)

### AM-006: Tier/Role-Specific Transparency Authorization
- **Class:** Operational
- **Date:** 2026-08-08 (P1-5 Remediation)
- **Status:** APPROVED
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Implemented the blueprint Volume 8 §8.6.2 transparency model. Constitutional Partners see compensation bands only; Constitutional Council (board) and AI Salary Engine see exact salary; law firm sees contractual information; managers see exact salary for direct reports. Expense visibility is category-aware: salary expenses are aggregated for non-board viewers; all other categories are visible to all shareholders.
- **Impact:** Invariant #8 (Transparency), employee privacy (Law 151/2020), Labour Law 12/2003
- **Implementation:** `src/lib/aurienta/transparency.ts`, applied to enterprise profile GET, employees GET, expenses GET
- **Rollback:** Not permitted (constitutional transparency + legal compliance)

### AM-007: Enterprise Profile Ledger Transaction Fix
- **Class:** Operational
- **Date:** 2026-08-08 (P1-1 Remediation)
- **Status:** APPROVED
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Fixed a P1 runtime defect in the Enterprise Profile PATCH handler where `appendLedgerEvent(undefined, ...)` was called instead of wrapping the update + ledger event in `db.$transaction()`. The `undefined` transaction client would crash at runtime because `appendLedgerEvent` calls `tx.ledgerEvent.findFirst()` and `tx.ledgerEvent.create()`.
- **Impact:** Enterprise Profile system reliability, ledger integrity
- **Implementation:** `src/app/api/enterprises/[id]/profile/route.ts` — PATCH handler now uses `db.$transaction(async (tx) => { ... })`
- **Rollback:** N/A (bug fix)

### AM-008: Tier System Review — RECLASSIFIED (v3.0 → v3.1 CORRECTION)
- **Class:** Structural
- **Date:** 2026-08-09 (v3.0) → RECLASSIFIED 2026-08-09 (v3.1)
- **Status:** REJECTED (audit recommendations — NOT constitutional amendments)
- **Approved By:** N/A — reclassified after v4.0 audit found these were audit recommendations improperly constitutionalized without Founder approval
- **Summary:** The v3.0 audit proposed 7 tier-capital changes: (1) Tier A min 100,000 EGP; (2) Tier B min 500,000 EGP; (3) Tier C min 2,000,000 EGP; (4) Tier E max 7.5M→20M; (5) Tier F display; (6) Dynamic min transparency; (7) Non-custodial badge.
- **RECLASSIFICATION RATIONALE:** The original blueprint specifies:
  - Tier A: LLC minimum capital 5,000 EGP (Egyptian Companies Law 159/1981), "Zero prior business experience permitted," target founder is "a 22-year-old university student"
  - Tier B: "LLC with minimum capital sufficient for operations"
  - Tier C: No minimum enterprise capital specified — feasibility evaluation + ERP + statutory audit are the gates
  - The 50 EGP minimum is the minimum INVESTMENT per Capital Partner, not the minimum enterprise capital
  - Imposing 100K/500K/2M floors would block the exact founders the blueprint is designed for and violate the mission "enterprise creation > artificial capital barriers"
- **Decision:** Recommendations 1-3 are REJECTED (would block Egyptian founders, contradict blueprint). Recommendation 4 (Tier E max raise increase) is classified OPTIONAL ENHANCEMENT (defer to Founder decision when first university spinout approaches the 5M ceiling). Recommendations 5-7 are classified OPTIONAL ENHANCEMENT (display improvements, not constitutional).
- **Impact:** No change to tier system. Original blueprint tier requirements stand as-is.
- **Implementation:** None. `constants.ts` and `computeDynamicMinimum` remain unchanged.
- **Rollback:** N/A — recommendations were never implemented in code, only documented in Volume 43 of v3.0 blueprint.
- **Source:** v4.0 Master Constitutional Fidelity Audit
- **Lesson:** Audit recommendations must be classified A-E before being recorded as amendments. This was a process failure corrected by the v4.0 audit.

### AM-009: Comprehensive Platform Audit Results (v3.0 → v3.1 CORRECTED)
- **Class:** Operational
- **Date:** 2026-08-09 (v3.0) → CORRECTED 2026-08-09 (v3.1)
- **Status:** APPROVED (with corrections)
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Recorded the comprehensive end-to-end platform audit conducted August 2026. The v3.0 audit reported "26 CRE functions (10 unwired)" — the v4.0 verification found this was inaccurate. The actual count is **25 CRE functions** (the type `CreVerdict` was miscounted as a function). Of these 25, **6 are unwired**: `enforceZeroCustody` (invariant preserved by architecture; function is defense-in-depth), `enforcePoliceClearance` (P1 — comment says "MUST call" but not invoked), `enforceLawFirmReplacement`, `enforceDividendLock`, `enforceTierMigration`, `enforceEquityLockUp`. The v3.0 audit scores (9 dimensions, overall 82/100, drift 12/100) stand as recorded but should not be treated as constitutional — they are operational snapshots.
- **Corrections:** (1) CRE function count: 25 (not 26). (2) Unwired count: 6 (not 10). (3) `enforceZeroCustody` is unwired as a FUNCTION but the Zero Custody INVARIANT is preserved by the architecture (funds only move between law firm accounts and enterprise accounts via DB relationships — no beneficiary field exists where "aurienta" could be specified). (4) The audit's Norway-transparency score (72/100) should not be interpreted as a mandate to copy Norwegian public-salary disclosure — Egyptian PDPL (Law 151/2020) and the blueprint's own §8.6.2 table govern transparency, not foreign norms.
- **Impact:** All 17 invariants PASS. 19 of 25 CRE functions are wired and enforced. 6 unwired functions classified: 1 P1 (`enforcePoliceClearance`), 5 P2/P3.
- **Implementation:** Volume 44 of Master Blueprint v3.0 documents the audit. Corrections recorded here.
- **Rollback:** N/A (audit is a snapshot in time; corrections are factual)
- **Source:** v4.0 Master Constitutional Fidelity Audit

### AM-010: FIFO Matching Engine (Blueprint §9.6)
- **Class:** Operational
- **Date:** 2026-08-09 (v3.2)
- **Status:** APPROVED + IMPLEMENTED
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Implemented the strict FIFO (first-in, first-out) matching engine for the constitutional secondary market (Phase 3). Orders are no longer just listed — they now execute. The engine matches buy orders against the oldest sell orders (and vice versa) that satisfy price crossing within the ±5% fundamental pricing band. Partial fills are supported. Each match atomically: creates a Trade record, updates both orders' filled quantities + status, transfers ownership (decrements seller, increments buyer, recalculates buyer avgPrice), appends a `trade_matched` ledger event — all inside one `db.$transaction`.
- **Impact:** Invariant #3 (Fundamental Pricing), Invariant #4 (No Speculation), secondary market liquidity. The secondary market is now FUNCTIONAL — Capital Partners can sell Equity Units.
- **Implementation:** `src/lib/aurienta/matching-engine.ts` + `POST /api/orders` (matching runs after order creation) + `GET /api/orders` (order book). Trade model added to Prisma schema.
- **Rollback:** Not permitted (core market infrastructure)

### AM-011: Government API Verification — Manual Upload Fallback (Blueprint §12.3, §12.6, §12.7)
- **Class:** Operational
- **Date:** 2026-08-09 (v3.2)
- **Status:** APPROVED + IMPLEMENTED
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Implemented the manual upload fallback for government verifications (GAFI commercial registration, GAFI UBO, NOSI social insurance registration, tax clearance, police clearance) with 48h SLA for human review, as specified in the blueprint when automated APIs are unavailable. Institutional roles (`aurienta_rep`, `law_firm_rep`, `accounting_firm_rep`) can review and approve/reject submissions. Police clearance verifications auto-expire after 6 months. On police clearance verification, the User's `policeClearanceValid` and `policeClearanceExpiresAt` fields are updated.
- **Impact:** Invariant #9 (Constitutional Supremacy — mandatory law compliance), enterprise onboarding compliance, NOSI enforcement chain.
- **Implementation:** `POST/GET /api/verification`, `GET/PATCH /api/verification/[id]`. GovApiVerification model added to Prisma schema.
- **Rollback:** Not permitted (legal compliance)

### AM-012: Anti-Fragility Insurance Vault (Blueprint §5.4)
- **Class:** Additive
- **Date:** 2026-08-09 (v3.2)
- **Status:** APPROVED + IMPLEMENTED
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Implemented the collective reserve that provides interest-free loans to enterprises hit by exogenous shocks. Funded by 0.5% of each Capital Formation close. Loans capped at 20% of last raised capital, repayable over 24 months (10% of each milestone release). Non-recourse (forgiven if enterprise fails). Board vote (simple majority) required to request a loan. The vault balance is tracked per-enterprise.
- **Impact:** Enterprise resilience, anti-fragility doctrine, exogenous shock protection.
- **Implementation:** `GET/POST /api/vault`, `POST /api/vault/loan`, `GET/PATCH /api/vault/loan/[id]`. InsuranceVault + VaultLoan models added to Prisma schema.
- **Rollback:** Permitted per-enterprise (vault can be wound down)

### AM-013: Proof-of-Solvency Infrastructure (Blueprint §5.5)
- **Class:** Operational
- **Date:** 2026-08-09 (v3.2)
- **Status:** APPROVED + IMPLEMENTED
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Implemented the 3-level health flag system for Law Firm Client Account reconciliation. Level 1 (>0.1% variance, internal only), Level 2 (>2% variance, all partners notified), Level 3 (>10% variance or unauthorized withdrawal, system freeze + regulator). Level 3 automatically triggers `enforceEmergencyFreeze`. Each assertion records the law firm balance, internal balance, variance, health level, and a SHA-256 assertion hash.
- **Impact:** Invariant #1 (Zero Custody), financial integrity, partner transparency.
- **Implementation:** `GET/POST /api/solvency`. SolvencyAssertion model added to Prisma schema.
- **Rollback:** Not permitted (financial integrity safeguard)

### AM-014: EVE AI Verification + Reality Sync Engine (Blueprint §11.2, §11.8)
- **Class:** Additive
- **Date:** 2026-08-09 (v3.2)
- **Status:** APPROVED + IMPLEMENTED
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Implemented two institutional intelligence features: (1) EVE (Execution Verification Engine) — AI-powered evidence verification that replaces the blueprint's LayoutLM/OCR approach with Brain AI analysis. Verifies vendor consistency, amount reasonableness, date consistency, related-party indicators, and missing documentation. Returns verified/confidence/findings/redFlags. (2) Reality Sync Engine — 6-check internal consistency sync: NOSI compliance, ledger integrity (`verifyLedgerChain`), ownership consistency, milestone staleness, expense freeze condition, health score drift. Returns overall status: healthy/warning/critical.
- **Impact:** Invariant #2 (CRE), evidence integrity, institutional intelligence.
- **Implementation:** `POST /api/ai/eve`, `POST /api/reality-sync`.
- **Rollback:** Not permitted (verification infrastructure)

### AM-015: Graduation Export API + Voting Proxy System (Blueprint §15.11, §16.2)
- **Class:** Additive
- **Date:** 2026-08-09 (v3.2)
- **Status:** APPROVED + IMPLEMENTED
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Implemented two sovereignty features: (1) Graduation Export API — allows a graduated enterprise to extract their full data package: enterprise profile, cap table (OwnershipRecords), full immutable ledger (ordered by sequence), quarterly reports, milestones, employees (anonymised — no nationalId/nosiNumber), proposals+votes, constitutional charter hash. SHA-256 package hash for third-party verification. (2) Voting Proxy System — allows a Constitutional Partner to delegate their voting power to another partner. Scope: all proposals / specific proposal / proposal type. Delegator's voting power = equity units. Delegatee must be an enterprise member. Revocable at any time.
- **Impact:** Invariant #5 (Graduation Doctrine), Invariant #12 (Constitutional Roles), sovereign independence.
- **Implementation:** `POST /api/graduation/export`, `GET/POST /api/proxies`, `POST /api/proxies/[id]/revoke`. VotingProxy model added to Prisma schema.
- **Rollback:** Not permitted (sovereignty infrastructure)

### AM-016: Police Clearance Enforcement + Expenses Dashboard (Blueprint §7.5, §8.14)
- **Class:** Operational
- **Date:** 2026-08-09 (v3.2)
- **Status:** APPROVED + IMPLEMENTED
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Implemented two operational features: (1) `enforcePoliceClearance` wired into manager appointment proposal execution — when a `manager_appointment` proposal passes the vote, the CRE verifies the target user has valid police clearance (Add-on 27). If invalid/expired, the proposal is placed in `evidence_submitted` status pending renewal rather than being executed. (2) Constitutional Expenses Dashboard API — provides budget vs actual by category, summary cards (total month/quarter, budget utilization %, pending approvals), category breakdown with role-aware visibility (salary expenses aggregated for non-board), and budget status indicators (🟢 ≤80% / 🟡 80-100% / 🔴 >100%).
- **Impact:** Invariant #2 (CRE), workforce compliance, financial transparency.
- **Implementation:** `POST /api/proposals/[id]/vote` (police clearance check), `GET /api/expenses/budget`.
- **Rollback:** Not permitted (constitutional enforcement + financial transparency)

---

## Deprecated Provisions

None. No constitutional provisions have been deprecated.

---

## Superseded Provisions

| Provision | Superseded By | Date | Notes |
|-----------|--------------|------|-------|
| Legacy terminology (shares, investor, escrow, etc.) | AM-001: Constitutional Terminology Standard | 2026-08-07 | DB fields retained via @map for backward compatibility |
| Single-entity corporate structure | AM-002: Three-Entity Institutional Architecture | 2026-08-07 | Holding Group + Operations + Advisory |
| Ad-hoc salary negotiation | AM-005: AI Salary Engine | 2026-08-08 | Replaced by deterministic formula + AI validation |
| Open salary visibility to all Capital Partners | AM-006: Tier/Role-Specific Transparency Authorization | 2026-08-08 | Now role-aware: bands vs exact per §8.6.2 matrix |
| Tier minimum capital floors (50 EGP for A/B/C) | AM-008: Tier System Review (pending implementation) | 2026-08-09 | Recommended floors: 100K/500K/2M EGP for A/B/C |

---

## Constitutional Invariants (Immutable)

The following 17 invariants are non-negotiable and cannot be amended without Founder approval + Constitutional Council review:

1. Zero Custody — AURIENTA never holds funds (Amendment IX)
2. Constitutional Runtime Engine (CRE) — deterministic, AI-enforced
3. Fundamental Pricing — EPS × P/E × Growth + 0.3×NAV, ±5% band
4. No Speculation — price band enforced
5. Graduation Doctrine — sovereignty is the destination
6. Immutable Ownership Ledger — hash-chain, tamper-evident
7. One Identity — Sovereign Trust Score, portable
8. Transparency — immutable ledger, public rules
9. Constitutional Supremacy — constitution > all human decisions
10. Tier System A-F — structured enterprise classification
11. Enterprise Lifecycle — Formation → Growth → Independence → Sovereign
12. Constitutional Roles — 10+ defined roles with specific rights
13. Three-Entity Structure — Holding → Operations + Advisory
14. Founder Identity — Mohamed Eltonsy, 100% ownership
15. Amendment IX — Zero Custody guarantee
16. Constitutional Terminology — 20 approved terms
17. Evidence Hierarchy E0-E9 — CLAIM ≠ EVIDENCE ≠ STATUS ≠ TARGET ≠ FORECAST

**All 17 invariants verified PASS as of v3.0 (2026-08-09).**

---

*"Your capital, your work, your company — no speculation required."*
