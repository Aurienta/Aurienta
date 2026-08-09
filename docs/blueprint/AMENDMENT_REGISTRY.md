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

### AM-008: Tier System Review & Minimum Capital Recommendations (v3.0 NEW)
- **Class:** Structural
- **Date:** 2026-08-09 (v3.0)
- **Status:** APPROVED (recommendations pending implementation)
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Audit-driven review of AURIENTA's six-tier enterprise classification (A–F). Produced 7 minimum-capital recommendations: (1) Tier A minimum Capital Participation 50 EGP → 100,000 EGP; (2) Tier B minimum 50 EGP → 500,000 EGP; (3) Tier C minimum 50 EGP → 2,000,000 EGP; (4) Tier E maximum raise 5M EGP → 20M EGP; (5) Tier F display update "1 Equity Unit" → "1 Equity Unit (par value per bylaws)"; (6) Dynamic minimum transparency — display formula + inputs; (7) Non-custodial verification prominence — badge on every tier surface.
- **Impact:** Invariant #10 (Tier System A–F), Invariant #11 (Enterprise Lifecycle), Capital Partner accessibility (Tier A/B/C), deep-tech/biotech spinout viability (Tier E), UI transparency, Zero Custody invariant reinforcement
- **Implementation:** Recommendations 1-4 require changes to TIER_META in `src/lib/aurienta/constants.ts` and the floor values in `computeDynamicMinimum` (`src/lib/aurienta/cre.ts`). Recommendations 5-7 are display/UI changes only. All 7 recommendations are documented in Volume 43 of the Master Blueprint v3.0.
- **Rollback:** Per-recommendation rollback permitted (each recommendation is independently reversible). Existing Capital Partners are grandfathered at their original minimum; new minimums apply to new Capital Formation rounds only.
- **Source:** Volume 43 of Master Blueprint v3.0

### AM-009: Comprehensive Platform Audit Results (v3.0 NEW)
- **Class:** Operational
- **Date:** 2026-08-09 (v3.0)
- **Status:** APPROVED
- **Approved By:** Mohamed Eltonsy, Founder & Sole Owner
- **Summary:** Recorded the comprehensive end-to-end platform audit conducted August 4-8, 2026. The audit assessed 9 dimensions: Pages & Screens (88/100), Roles & Role Visibility (82/100), Dashboards (85/100), Wiring & Mapping (78/100), Features (90/100), UI Quality (73/100), Tab Mapping (87/100), Role Visibility (84/100), Norway-Grade Transparency (72/100). Overall Score: 82/100. Drift Score: 12/100. All 17 constitutional invariants PASS. 26 CRE functions implemented (10 unwired). 5 P1 enforcement functions wired and operational. 9 unsanitised transparency surfaces identified. Prioritised remediation backlog: 2 P0 items (5 engineering days), 4 P1 items (9 days), 4 P2 items (12 days). Audit verdict: PRODUCTION-READY FOR PILOT conditional on P0 remediation.
- **Impact:** All 17 invariants (audit confirms PASS), engineering backlog priorities, pilot launch readiness, transparency authorization scope
- **Implementation:** Volume 44 of Master Blueprint v3.0 documents the full audit findings, scorecard, role visibility matrix, 10 unwired CRE functions, 9 unsanitised transparency surfaces, and prioritised remediation backlog. The remediation backlog is tracked in the engineering project management system.
- **Rollback:** N/A (audit is a snapshot in time; cannot be rolled back)
- **Source:** Volume 44 of Master Blueprint v3.0

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
