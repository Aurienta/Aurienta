# AURIENTA — Blueprint Requirements Register

**Phase 2 Forensic Audit Output**
**Date:** October 2026
**Auditor:** general-purpose (Forensic Audit Agent)
**Blueprint Version:** 3.2.0 (Master Blueprint v3.2 — Gap Closure Edition)
**Constitutional Hash:** `0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A`

---

## Purpose

This register catalogues **every functional and non-functional requirement** extracted from the ten authoritative blueprint sources, each assigned a unique ID and an observable acceptance criterion. It is the traceable foundation for all subsequent audit phases (gap analysis, evidence collection, conformance verification).

**Audit scope:** READ-ONLY. No source code was modified. All requirements are stated as-is from the blueprint.

---

## Summary Table

| Category | Prefix | Count | Primary Sources |
|---|---|---:|---|
| Business Requirements | BR- | 86 | ai.ts, AMENDMENT_REGISTRY, LEGAL_COMPLIANCE_AUDIT, STRATEGIC_ANALYSIS, constants.ts, legal-disclaimer.ts |
| Interface Requirements | UI- | 22 | ai.ts (Enterprise Profile A-K), terminology.ts, legal-disclaimer.ts |
| Workflow Requirements | WF- | 25 | ai.ts (CRE/AOS/ACS), cre.ts, inngest.ts |
| API Requirements | API- | 30 | LEGAL_COMPLIANCE_AUDIT, AM-010..016, cre.ts, ai.ts |
| Data Requirements | DB- | 18 | cre.ts (LedgerChain, OwnershipRecord), constants.ts (TIER_META), BLUEPRINT_VERSION.json |
| Security Requirements | SEC- | 28 | ai.ts (PH-ER, Cybersecurity), password-v2.ts, account-lockout.ts, passkey.ts |
| Integration Requirements | INT- | 22 | ai-router.ts, inngest.ts, neon.ts, gov-api.ts, crcica.ts, law-firm-webhook.ts |
| Operational Requirements | OPS- | 26 | ai.ts (AOS, Governance v1.0, PH-ER, PE, FOCC), constants.ts (Vital Signs, Proposal Types) |
| **TOTAL** | | **257** | |

---

## Source Priority Order (Conflict Resolution)

1. `docs/blueprint/AMENDMENT_REGISTRY.md` — amendment decisions (REJECTED/APPROVED/OPTIONAL)
2. `docs/blueprint/BLUEPRINT_CHANGELOG.md` — change history
3. `docs/blueprint/BLUEPRINT_VERSION.json` — version metadata
4. `src/lib/aurienta/ai.ts` — CONSTITUTIONAL_SYSTEM_PROMPT (most comprehensive single-source)
5. `src/lib/aurienta/terminology.ts` — approved/forbidden terms
6. `src/lib/aurienta/legal-disclaimer.ts` — legal classification + regulatory position
7. `src/lib/aurienta/constants.ts` — tier/role/fee/STS metadata
8. `src/lib/aurienta/cre.ts` — 37 constitutional enforcement policies
9. `LEGAL_COMPLIANCE_AUDIT.md` — 15 compliance-cleared features + NEVER-BUILD list
10. `STRATEGIC_ANALYSIS.md` — gap analysis + modified roadmap

---

# 1. BUSINESS REQUIREMENTS (BR-001 .. BR-086)

## 1.1 Constitutional Invariants (Non-Amendable)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **BR-001** | Invariant #1 / I-1.1 / Amendment IX | Zero Custody — AURIENTA must never hold, touch, move, or control partner funds. All capital flows directly to a licensed law firm's Law Firm Client Account (lawFirmClientAccountBalanceEgp). | No transaction log row contains a `beneficiary` matching `/aurienta/i`; no AURIENTA-owned bank account number appears in any fund-flow record; `enforceZeroCustody()` returns `allowed:false` for any AURIENTA-named beneficiary. |
| **BR-002** | Invariant #2 / I-1.2 | Constitutional Runtime Engine (CRE) — deterministic, AI-enforced. The CRE validates every action. AI may advise but cannot override. | Every state-changing write to enterprise data is preceded by a `CreVerdict` with `allowed:true`; Brain AI output never directly mutates DB without passing through a `enforce*` policy. |
| **BR-003** | Invariant #3 / I-1.3 | Fundamental Pricing — Valuation = EPS × sector P/E × growth + 0.3×NAV. ±5% band enforced (Phase 3). Phase 1/2 orders must equal the AI fundamental price exactly. | `enforcePriceBand()` returns `allowed:false` for any Phase-3 order outside ±5% or any Phase-1/2 order differing from fundamental by ≥0.01. |
| **BR-004** | Invariant #4 | No Speculation — No derivatives, margin, short selling, tokenization, synthetic instruments, or tokenized debt. | No code path creates a derivative, margin, short, or tokenized-debt instrument; forbidden-feature test suite passes. |
| **BR-005** | Invariant #5 / I-1.7 | Graduation Doctrine — Sovereignty is the destination; enterprises graduate to sovereign independence. AURIENTA succeeds when no longer needed. 4 stages, 9 readiness gates, consulting opt-out path. | `computeGraduationReadiness()` returns ≥90 only when all 9 gates pass; graduated enterprises can export full data package via `/api/graduation/export`. |
| **BR-006** | Invariant #6 | Immutable Ownership Ledger — hash-chain, tamper-evident, SHA3-256 + Ed25519-signed, per-enterprise sequence. | `verifyLedgerChain()` returns `intact:true, eventsChecked=N` for any enterprise; any tampered row yields `brokenAt:{...}`. |
| **BR-007** | Invariant #7 / I-1.6 | One Identity — One person, one verified identity. Ed25519 Identity Anchor. Sovereign Trust Score portable. | A user account cannot hold >1 active Ed25519 identity anchor; STS score is single-valued per user; KYC level is enforced via `enforceKycGate()`. |
| **BR-008** | Invariant #8 | Transparency — every financial event visible to all Constitutional Partners in real time. | All ledger events of type `*financial*` are queryable by every Capital Partner of the enterprise within 1 second of commit. |
| **BR-009** | Invariant #9 | Constitutional Supremacy — Constitution > all human decisions (including Founder). | `CreVerdict.allowed=false` blocks the calling mutation even when issued by Founder role; audit log shows the block. |
| **BR-010** | Invariant #10 | Tier System A-F — structured enterprise classification. | `TIER_META` exists for each of A,B,C,D,E,F with all 9 fields populated; tier assigned at enterprise creation cannot be skipped (see BR-063). |
| **BR-011** | Invariant #11 | Enterprise Lifecycle — Formation → Growth → Independence → Sovereign. | `STAGE_META` defines stages 1..4 + graduated; transitions enforced via `enforceStatusTransition()`. |
| **BR-012** | Invariant #12 | Constitutional Roles — 10 defined roles with specific rights. | `ROLE_META` defines exactly: capital_partner, founding_operator, workforce_partner, manager, board_member, company_owner, law_firm_rep, accounting_firm_rep, aurienta_rep, university_rep. |
| **BR-013** | Invariant #13 / AM-002 | Three-Entity Structure — Holding S.A.E. (JSC) → Tech LLC + OpCo LLC + Advisory LLC + Middleware LLC. | `INSTITUTIONAL_ARCHITECTURE.entities` contains 5 entities (Holding + 4 subsidiaries) with `parent` relationships and IP-licensing chain documented. |
| **BR-014** | Invariant #14 | Founder Identity — Mohamed Eltonsy, 100% ownership. No second owner; no board controlling Founder. | All references to "Founder" in DB, UI, and AI prompts resolve to a single user record; "Layla Mostafa" is tagged demo Capital Partner. |
| **BR-015** | Invariant #15 / Amendment IX | Zero Custody Guarantee (Amendment IX) — Same as I-1.1 but explicitly constitutionally entrenched. | The string "Amendment IX" appears in legal-disclaimer.ts §4 and ai.ts; Zero Custody tests pass with verdict allowed=false for AURIENTA beneficiaries. |
| **BR-016** | Invariant #16 / AM-001 | Constitutional Terminology — 20 approved terms; 10 forbidden patterns enforced. | `validateTerminology(text).valid === true` for all UI strings + AI outputs; FORBIDDEN_PATTERNS regex list matches no occurrence. |
| **BR-017** | Invariant #17 | Evidence Hierarchy E0-E9 — CLAIM ≠ EVIDENCE ≠ STATUS ≠ TARGET ≠ FORECAST. | Every claim record carries an `evidenceLevel` ∈ {E0..E9}; no record can be promoted from En to Em (m>n) without a linked evidence artifact + verification timestamp. |

## 1.2 Core Doctrines (never violate — from CONSTITUTIONAL_SYSTEM_PROMPT)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **BR-018** | Core Doctrine 1 | Zero Custody (restated as Doctrine) — capital flows to law firm's Law Firm Client Account. | Same as BR-001; also: AI prompt contains the doctrine verbatim. |
| **BR-019** | Core Doctrine 2 | AI as Enforcer, Not Decider — CRE validates every action; AI advises only. | No AI artifact row directly mutates enterprise state without an intervening `CreVerdict`. |
| **BR-020** | Core Doctrine 3 | Fundamental Pricing (restated) — ±5% band, no speculation. | Same as BR-003. |
| **BR-021** | Core Doctrine 4 | No Speculation (restated) — no derivatives/margin/shorts/tokenization. | Same as BR-004. |
| **BR-022** | Core Doctrine 5 | One Identity (restated) — Ed25519 Identity Anchor. | Same as BR-007. |
| **BR-023** | Core Doctrine 6 | Transparency — every financial event visible to all partners in real time. | Same as BR-008. |
| **BR-024** | Core Doctrine 7 | Graduation — 4 stages: Protected Formation → Structured Growth → Institutional Independence → Sovereign Enterprise. 9 readiness gates. Consulting opt-out. No permanent dependency. | STAGE_META + computeGraduationReadiness implement 4 stages + 9 gates; consulting opt-out enforceable via `enforceConsultingOptOut()`. |

## 1.3 Constitutional Hierarchy (8 Levels from CONSTITUTIONAL_SYSTEM_PROMPT)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **BR-025** | Constitutional Hierarchy L1 | Constitution is highest authority — no human (including Founder) can override enforced rules. | All `enforce*` functions return `CreVerdict` independently of caller's role; tests pass for Founder attempting override. |
| **BR-026** | Constitutional Hierarchy L2 | PRIMARY PURPOSE: Constitutional enterprise creation. NOT B2B SaaS, CRM, sales automation, consulting management. AURIENTA is a constitutional launchpad. | Product positioning statement in landing page hero matches: "noncustodial constitutional infrastructure of structural trust…"; no SaaS/CRM positioning in copy. |
| **BR-027** | Constitutional Hierarchy L3 | CRE / Enforcement — 15+ enforced policies, Ed25519 signing, hash-chain ledger, verifyLedgerChain(). AI cannot override. | cre.ts exports ≥25 enforce/verify functions; verifyLedgerChain() walks chain on read. |
| **BR-028** | Constitutional Hierarchy L4 | Enterprise Lifecycle — 17-stage Research→Constitutional Formation→…→Sovereign Enterprise. | Process Simulation 20-step flow documented; each step has actor/action/system/control/evidence/timing. |
| **BR-029** | Constitutional Hierarchy L5 | Capital + Workforce + Ownership + Governance model — Capital Partners → Equity Units → Ownership Ledger → milestone release → fundamental pricing → secondary market. | All five economic primitives exist as models and APIs. |
| **BR-030** | Constitutional Hierarchy L6 | Operations — milestones, expenses, employees, vital signs, health ratings. | Vital Signs endpoint exposes all 6 metrics; Health Score endpoint returns AAA-CCC rating. |
| **BR-031** | Constitutional Hierarchy L7 | Commercial Execution — supporting infrastructure, NOT the constitutional purpose. | Commercial systems (MES, MAS, CPR, SPRRE, FIEW, ACS) are clearly subordinated in product hierarchy. |
| **BR-032** | Constitutional Hierarchy L8 | Institutional Expansion — global launch, certifications, trust center, due diligence at scale. | GLS, ITDB modules documented; global-launch.ts exists. |

## 1.4 Tier System (6 Tiers — TIER_META, constants.ts)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **BR-033** | Tier A | Micro / LLC / 3M EGP max raise / 50 EGP min participation / 5%+5% Founding Operator equity / 5%+2.5% fee / Lite ERP / Compilation audit / "First-time founders". | TIER_META.A matches all 9 fields exactly; new enterprise with tier="A" rejected if raise>3M EGP. |
| **BR-034** | Tier B | Small / LLC / 25M EGP max / 50 EGP min / 5%+5% founder / 5%+2.5% fee / Optional ERP / Review audit / "Experienced operators". | TIER_META.B matches; raise>25M EGP blocked at Tier B. |
| **BR-035** | Tier C | Growth / LLC / Unlimited / 50 EGP min / 10%+25% vest founder / 5%+2.5% fee / Mandatory ERP / Statutory audit / "ERP mandatory". | TIER_META.C matches; enterprise cannot activate Tier C without ERP integration record. |
| **BR-036** | Tier D | Established / LLC / Unlimited / 50,000 EGP min / Owner ≥51% / 5%+2.5% fee / Mandatory ERP / Statutory audit / "Existing companies". | TIER_META.D matches; `enforceFounderEquityCap()` rejects dilution below 51% for Tier D. |
| **BR-037** | Tier E | University / SPV / 5M EGP max / 50 EGP min / 0% founder equity / 1% fee / Grant audit / "Research spinouts". | TIER_META.E matches; fee=1% (not 5%+2.5%); raise>5M EGP blocked. |
| **BR-038** | Tier F | Joint Stock / JSC / Unlimited / 1 share min / By bylaws founder equity / 5%+2.5% fee / Mandatory ERP / FRA statutory audit / "EGX listing". | TIER_META.F matches; founding requires L4 verification (enforceVerificationGate). |
| **BR-039** | AM-008 (REJECTED) | Original tier minimums preserved — Tier A: 5,000 EGP LLC minimum (Egyptian Companies Law 159/1981); 50 EGP is minimum INVESTMENT per Capital Partner, NOT enterprise capital. Audit recommendations to raise floors to 100K/500K/2M were REJECTED. | `computeDynamicMinimum()` uses floor=50 for A/B/C and floor=50000 for D; no floor changes implemented. |
| **BR-040** | AM-008 (OPTIONAL) | Tier E max 5M→20M is OPTIONAL ENHANCEMENT deferred to Founder decision when first university spinout approaches ceiling. | No code change required until Founder decision; documented in AMENDMENT_REGISTRY. |

## 1.5 Roles & Permissions

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **BR-041** | ROLE_META / Constitutional Roles | Capital Partner — provides capital to enterprises. | ROLE_META.capital_partner defined; UI badge 💼; icon Wallet. |
| **BR-042** | ROLE_META | Founding Operator — constitutes the enterprise. | ROLE_META.founding_operator defined; 👑 Crown; police clearance required. |
| **BR-043** | ROLE_META | Workforce Partner — labor participation in ownership. | ROLE_META.workforce_partner defined; 🛠️ HardHat; eligible for salary-to-equity conversion. |
| **BR-044** | ROLE_META | Manager — police clearance required. | ROLE_META.manager.policeClearance=true; appointment proposal gated by `enforcePoliceClearance()`. |
| **BR-045** | ROLE_META | Board Member (Constitutional Council). | ROLE_META.board_member defined; 🪑 Users icon; sees exact salary per transparency rules. |
| **BR-046** | ROLE_META | Company Owner. | ROLE_META.company_owner defined; 🏢 Building2; Tier D ≥51%. |
| **BR-047** | ROLE_META | Law Firm Rep. | ROLE_META.law_firm_rep defined; ⚖️ Scale; police clearance required; signs Law Firm Client Account releases. |
| **BR-048** | ROLE_META | Accounting Firm Rep. | ROLE_META.accounting_firm_rep defined; 📊 Calculator; police clearance required; co-signs milestone releases. |
| **BR-049** | ROLE_META | AURIENTA Rep. | ROLE_META.aurienta_rep defined; 🛡️ ShieldCheck; institutional role for verification reviews. |
| **BR-050** | ROLE_META | University Rep. | ROLE_META.university_rep defined; 🎓 GraduationCap; for Tier E. |

## 1.6 Fee Structure & Anti-Capture

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **BR-051** | I-1.4 / I-1.9 / FEE_STRUCTURE | Uniform Fee = 5% platform (OpCo) + 2.5% advisory (Advisory LLC) + 0.5% antifragility reserve (Law Firm fiduciary) = 8% per milestone release. | FEE_STRUCTURE.totalDeduction === 0.08; recipients differ per entity; never % of capital raised. |
| **BR-052** | Vol 25 §25.7 | NEVER charge a percentage of capital raised. Success fees ONLY on graduation. All fees disclosed upfront and recorded on ledger. | No fee line item in commercial model is `% of capital`; every fee event creates a `ledgerEvent.fee_disbursed` row. |
| **BR-053** | Tier E | Tier E (University) fee = 1% only (not 5%+2.5%). | TIER_META.E.fee === "1%". |
| **BR-054** | Anti-Capture | No shareholder ≥50% (anti-capture rule). | `enforceFounderEquityCap()` rejects dilution below tier floor; cap table validator rejects any single non-founder owner ≥50% (except Founder 100% in Holding). |
| **BR-055** | AM-005 / §8.4 | AI Salary Engine — Salary = Base × Tier_multiplier × Performance_score × Regional_adjustment × Profit_factor. Tier multipliers A=0.8,B=1.0,C=1.3,D=1.5,E=0.9,F=1.5. Regional: Cairo=1.0,Alex=0.9,Delta=0.85,Suez=0.95,Upper Egypt=0.8. Performance clamped [0.5,1.5]. Profit factor clamped [0.8,1.2]. | salary-engine.ts implements formula with documented multipliers; unit tests cover all 6 tiers × 5 regions. |
| **BR-056** | §8.4.3 | Board override rules: ≥75% vote required; >200% of AI salary triggers automatic shareholder notification; >300% hard cap requires charter amendment. | `enforceSalaryConstitutionality()` returns `requiresShareholderNotification:true` when overrideRatio>2.0; rejects when >3.0. |
| **BR-057** | §8.4 / §39.6 | Minimum wage floor: 4,000 EGP/month (AURIENTA CONSTITUTIONAL FLOOR — REQUIRES LEGAL VERIFICATION per AM-009 correction). | `enforceSalaryConstitutionality()` rejects proposed salary < 4000 EGP with reason citing legal verification caveat. |

## 1.7 Sovereign Trust Score (STS)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **BR-058** | STS_LEVELS | 5 STS bands: 90+ Constitutional Pillar, 80-89 Ecosystem Builder, 65-79 Trusted Contributor, 50-64 Active Member, 0-49 Emerging Participant. | `stsLevel(score)` returns the correct band for each threshold; STS score range [0,100]. |

## 1.8 Constitutional Amendments (16 in registry — APPROVED status enforced)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **BR-059** | AM-001 APPROVED | Constitutional Terminology Standard (20 approved terms; 10 forbidden patterns; @map DB backward compat). | terminology.ts exports both dictionaries; validateTerminology() enforces patterns. |
| **BR-060** | AM-002 APPROVED | Three-Entity Institutional Architecture (Holding + Tech + OpCo + Advisory + Middleware). | institutional-architecture.ts defines 5 entities; AMENDMENT_REGISTRY records AM-002 as APPROVED. |
| **BR-061** | AM-003 FROZEN | Institutional Governance v1.0 (11 committees, 13 risks, 10 controls, 14 KPIs). Frozen as v1.0. | institutional-governance.ts exports the frozen model; changes require formal change management. |
| **BR-062** | AM-004 APPROVED | P1 Constitutional Enforcement: NOSI 30-day deadline, 60-day expense freeze, Salary-to-Equity, Equity Lockup. | cre.ts exports enforceNosiRegistration, enforceNosiExpenseFreeze, enforceSalaryToEquity, enforceEquityLockUp. |
| **BR-063** | AM-006 APPROVED | Tier/Role-Specific Transparency Authorization (§8.6.2 matrix). Partners see bands; board sees exact; managers see direct reports. | transparency.ts exports canSeeExactSalary, canSeeSalaryBand, sanitizeEmployeeForViewer; tests cover matrix. |
| **BR-064** | AM-007 APPROVED | Enterprise Profile Ledger Transaction Fix (PATCH uses db.$transaction). | PATCH /api/enterprises/[id]/profile wraps update + ledger in single transaction. |
| **BR-065** | AM-010 APPROVED + IMPLEMENTED | FIFO Matching Engine (§9.6) — Phase 3 secondary market now functional; orders execute; partial fills supported; atomic ownership transfer + ledger event in one transaction. | matching-engine.ts matches buy/sell within ±5% band; Trade model + ledgerEvent created atomically. |
| **BR-066** | AM-011 APPROVED + IMPLEMENTED | Government API Verification Manual Upload Fallback (§12.3, §12.6, §12.7) — GAFI, NOSI, Tax, Police. 48h SLA for human review. Institutional roles can approve/reject. Police clearance auto-expires after 6 months. | /api/verification POST/GET + /api/verification/[id] PATCH exist; GovApiVerification model exists; policeClearanceExpiresAt field updated on approval. |
| **BR-067** | AM-012 APPROVED + IMPLEMENTED | Anti-Fragility Insurance Vault (§5.4) — 0.5% deduction per Capital Formation close. Interest-free loans (≤20% last raise, 24mo, 10% of each milestone release). Non-recourse. Board simple-majority required. | /api/vault + /api/vault/loan + /api/vault/loan/[id] exist; InsuranceVault + VaultLoan models exist. |
| **BR-068** | AM-013 APPROVED + IMPLEMENTED | Proof-of-Solvency Infrastructure (§5.5) — 3-level health flags. Level 1 (>0.1% variance, internal), Level 2 (>2%, partners notified), Level 3 (>10% or unauthorized withdrawal, system freeze + regulator). Level 3 auto-triggers enforceEmergencyFreeze. SHA-256 assertion hash. | /api/solvency exists; SolvencyAssertion model exists; Level 3 triggers enforceEmergencyFreeze + notification. |
| **BR-069** | AM-014 APPROVED + IMPLEMENTED | EVE AI Verification + Reality Sync Engine (§11.2, §11.8). EVE = AI evidence verification (vendor consistency, amount reasonableness, date consistency, related-party, missing docs). Reality Sync = 6-check internal consistency (NOSI, ledger integrity via verifyLedgerChain, ownership consistency, milestone staleness, expense freeze, health score drift). | /api/ai/eve + /api/reality-sync exist; both return verdicts/findings/redFlags. |
| **BR-070** | AM-015 APPROVED + IMPLEMENTED | Graduation Export API + Voting Proxy System (§15.11, §16.2). Export = full data package (profile, cap table, ledger, quarterly reports, milestones, employees anonymised, proposals+votes, charter hash, SHA-256 package hash). Voting Proxy = delegate voting power (scope: all/specific/type, revocable). | /api/graduation/export + /api/proxies + /api/proxies/[id]/revoke exist; VotingProxy model exists. |
| **BR-071** | AM-016 APPROVED + IMPLEMENTED | Police Clearance Enforcement + Expenses Dashboard (§7.5, §8.14). Police clearance wired into manager_appointment proposal execution (proposal → evidence_submitted status if invalid). Expenses Dashboard: budget vs actual by category, summary cards, role-aware visibility, 🟢≤80% / 🟡80-100% / 🔴>100%. | enforcePoliceClearance wired in /api/proposals/[id]/vote; /api/expenses/budget returns the dashboard data. |

## 1.9 Modified Roadmap (15 Compliance-Cleared Features — LEGAL_COMPLIANCE_AUDIT.md)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **BR-072** | Phase 1 / Modified Roadmap #1 | Enterprise Discovery Engine (restructured from Productive Savings) — recommendation engine, NOT auto-investment. Partner manually selects + manually invests in each enterprise. | enterprise-discovery.ts exists; no auto-allocation code path; UI requires explicit per-enterprise confirmation. |
| **BR-073** | Phase 1 / #2 | Profit-Sharing Agreements (restructured from Bonds) — constitutional contracts, NOT securities. CRE enforces profit distribution from enterprise revenue. | profit-sharing.ts + enforceProfitShareAgreement exist; instrument type recorded as "constitutional_contract" not "security". |
| **BR-074** | Phase 1 / #3 | Governance-as-a-Service API (GaaS) — pure technology infrastructure. External orgs register governance rules; CRE validates decisions. Subscription/per-decision pricing. | gaas.ts + enforceGaasDecision exist; /api/v1/gaas/* endpoints registered. |
| **BR-075** | Phase 2 / #4 | Succession Protocol as Standalone — legal/governance service for non-AURIENTA enterprises. Shamir 2/3, voting proxy activation, CRE-enforced execution. | standalone-succession.ts exists; enforceSuccessionGate implements check_filed + check_active. |
| **BR-076** | Phase 2 / #5 | Diaspora Corridor — Egypt-only initially; expand with legal counsel per jurisdiction. | diaspora-corridor.ts exists; cross-border activation requires per-jurisdiction legal counsel sign-off (recorded). |
| **BR-077** | Phase 2 / #6 | Real-Economy Index (AREI) — informational benchmark published daily via API. Weighted by Constitutional Health Score. Disclaimer: "Not investment advice". | arei.ts + /api/v1/arei endpoint exist; every response includes disclaimer string. |
| **BR-078** | Phase 3 / #7 | Constitutional Endorsement (restructured from Staking) — reputation-as-collateral via STS points. No financial value. Max 15 STS per endorsement, max 5 active per user. | constitutional-endorsement.ts + enforceConstitutionalEndorsement exist. |
| **BR-079** | Phase 3 / #8 | Predictive Enterprise Genome — ML analysis with disclaimer "Predictions are not guarantees of success". | enterprise-genome.ts exists; prediction API responses include disclaimer. |
| **BR-080** | Phase 3 / #9 | Quadratic Voting — voice credits = floor(STS/5), capped at 20. Quadratic cost. No financial value. | quadratic-voting.ts + enforceQuadraticVote exist. |
| **BR-081** | Phase 3 / #10 | Constitutional Zeitgeist — platform sentiment analysis (informational). Disclaimer required. | zeitgeist.ts exists; daily cron computes sentiment; API responses include disclaimer. |
| **BR-082** | Phase 3 / #11 | STS-Weighted Priority Window Allocation (restructured from Lottery) — DETERMINISTIC, NOT random. Phase 1 STS≥50, Phase 2 STS≥35. One allocation per phase per user. | priority-allocation.ts + enforcePriorityWindowAllocation exist; no random/lottie code path. |
| **BR-083** | Phase 4 / #12 | AI Consensus Oracle Network — external query API, Ed25519-signed verdicts, per-query pricing. Disclaimer: "Consensus output is not financial/investment advice". | oracle-network.ts + /api/v1/oracle/consensus exist; disclaimer in every response. |
| **BR-084** | Phase 4 / #13 | Offline CRE / Mobile PWA — offline validation, offline signing (queued + synced), USSD fallback, SMS notifications. | offline-pwa-config.ts + offline-cre.ts exist; service worker registered; queued transactions sync when online. |
| **BR-085** | Phase 4 / #14 | Soulbound Constitutional Credentials — non-transferable NFT identity credentials. isTransferable always false. L1+ verified user required. One per user. | soulbound-credential.ts + enforceSoulboundCredential exist; isTransferable=false enforced at CRE level. |
| **BR-086** | Phase 4 / #15 | Risk Profile API (restructured from Health Insurance) — data service for insurers. AURIENTA provides data only. Disclaimer accepted before query. | risk-profile.ts + enforceRiskProfileQuery exist; /api/v1/risk-profile requires disclaimer acceptance. |

---

# 2. INTERFACE REQUIREMENTS (UI-001 .. UI-022)

## 2.1 Constitutional Terminology (terminology.ts) — enforced on every UI label & AI output

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **UI-001** | terminology.ts / AM-001 | 20 approved constitutional terms must be used in all UI labels: Capital Partner, Capital Participation, Capital Formation, Equity Units, Enterprise, Founding Operator, Law Firm Client Account, Constitutional Holdings, Enterprise Registry, Constitutional Partner, Constitutional Infrastructure, Graduation, Constitutional Runtime Engine, Brain AI, Constitutional Charter, Capital Participation Goal, Capital Participated, Equity Unit Price, Constitutional Workspace, Structural Trust. | Every UI string passes `validateTerminology().valid === true`; APPROVED_TERMS dictionary consulted in i18n. |
| **UI-002** | terminology.ts / FORBIDDEN_PATTERNS | 10 forbidden patterns enforced in UI + AI output: escrow, fundrais*, investor, investment, startup, shareholder, crowdfunding, backer, donate, marketplace. | CI step runs `validateTerminology` against all UI strings + AI artifacts; zero matches allowed. |
| **UI-003** | terminology.ts | Database field naming: `lawFirmClientAccountBalanceEgp` (never `escrowBalanceEgp`), `equityUnitPriceEgp` (never `sharePriceEgp`), `totalEquityUnits` (never `totalShares`), `OwnershipRecord` (never `Shareholding`). | Prisma schema fields match the constitutional names; legacy names retained only via `@map`. |
| **UI-004** | CONSTITUTIONAL_SYSTEM_PROMPT TONE | Institutional tone comparable to World Bank / OECD / BIS / McKinsey. Never use crowdfunding/retail/startup/fintech language. | Manual review confirms tone; terminology validator blocks fintech/retail/startup keywords. |
| **UI-005** | ai.ts FOUNDER | "Layla" or "Layla Mostafa" must NEVER appear as Founder. She is a demo Capital Partner. | DB seed / demo data clearly tags Layla as demo_capital_partner; no UI label calls her Founder. |

## 2.2 Enterprise Profile System (Institutional Due-Diligence — /dashboard/enterprise-profile)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **UI-006** | Enterprise Profile SECTION A | Founder Identity: legal name, founder role, biography, statement, verification status. Never fabricate. Unknown = UNKNOWN. | All 5 fields rendered; verification badge reflects actual verificationLevel. |
| **UI-007** | SECTION B | Enterprise Profile: name, website, logo, mission, vision, problem, solution, product/service, target market, revenue model, current customers (0 if pre-revenue), tier, constitutional status. Every commercial claim tagged E0-E9. | UI renders evidence-level badges next to each commercial claim. |
| **UI-008** | SECTION C | Pitch Deck: founder-attached PDF/PPT URL. Pre-revenue NOT disadvantaged (0 customers allowed). No fabricated metrics. | Upload widget accepts PDF/PPTX; preview renders; pre-revenue allowed without forcing metrics. |
| **UI-009** | SECTION D | Document Room: EnterpriseDocument model with 18+ document types; each has evidence level (E0-E9), verification status (unverified/founder_provided/evidence_backed/verified), visibility classification (public/enterprise_members/governance/authorized_reviewers/private_confidential). "verified" only if actually verified. | Document upload form exposes all 4 metadata fields; visibility enforced on retrieval. |
| **UI-010** | SECTION E | Workforce Transparency: position, department, employment type, compensation band, exact salary, NOSI status, key person flag, equity conversion %. Salary transparency is tier-aware, role-aware, privacy-constrained (nosiNumber, nationalId, home address, phone, medical NEVER exposed outside board/self). | Employee list endpoint applies sanitizeEmployeeForViewer() per viewer role. |
| **UI-011** | SECTION F | Capital Transparency: capital formation goal, capital participated, remaining, Equity Unit Price (CPP), total Equity Units, Law Firm Client Account balance, ownership records. Zero Custody preserved. | Public view of enterprise shows Law Firm Client Account balance (not AURIENTA-held). |
| **UI-012** | SECTION G | Governance Transparency: structure, roles, proposal types, voting, quorum, supermajority, cooling-off, decision history. "NOT YET ESTABLISHED" if not activated — do NOT invent governance. | Empty governance renders "NOT YET ESTABLISHED" instead of placeholder rows. |
| **UI-013** | SECTION H | Tier System: current tier (A-F) with definition, requirements, evidence, next tier, progress. Tier is evidence-driven, not marketing. | Tier badge reflects DB record; "next tier" progress bar based on actual gate completion. |
| **UI-014** | SECTION I | Constitutional Health: CRE status, Zero Custody status, Ownership Ledger status, Fundamental Pricing status, Governance status, Workforce transparency status, Evidence level, Graduation readiness. | Health endpoint aggregates 8 sub-scores into a single panel. |
| **UI-015** | SECTION J | Capital Partner Due-Diligence: structured info for legitimate Capital Partners (NOT crowdfunding marketplace, NOT speculative). All claims evidence-tagged. | UI shows disclaimer: "Not a crowdfunding marketplace; not a speculative investment platform." |
| **UI-016** | SECTION K | Founder Request: Capital / Workforce / Strategic Partner / Law/Accounting / Governance / Enterprise Formation / Market Access / Technical / Regulatory / Other. Does NOT assume every founder seeks capital. | Form exposes all 11 options as multi-select. |

## 2.3 Landing Page Slogan (Audit verified)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **UI-017** | LANDING-BLUEPRINT worklog / CONSTITUTIONAL_SYSTEM_PROMPT | Hero slogan: "Rules, Not Trust. Capital That Builds. Enterprises That Graduate." Eyebrow: "CONSTITUTIONAL ENTERPRISE INFRASTRUCTURE GROUP". | Landing page hero.tsx renders exact strings; VLM verification scores ≥90/100. |
| **UI-018** | LANDING-BLUEPRINT | 4 Constitutional Pillars displayed: Zero Custody, CRE-Enforced, Fundamental Pricing, Graduation Doctrine. | hero.tsx renders all 4 pillar cards. |
| **UI-019** | LANDING-BLUEPRINT | 6-Tier System section visible on landing (A→B→C→D→E→F→Sovereign Independence). | tier-system.tsx component renders all 6 tier cards + graduation path bar. |

## 2.4 Public vs Private + Disclosure Controls

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **UI-020** | ai.ts PUBLIC vs PRIVATE | Public profile shows: founder, enterprise, mission, product, tier, evidence status, pitch deck (if founder chooses), video, website, GitHub, X. Restricted: detailed financials, salary, sensitive ownership, legal documents, contracts, regulatory correspondence, private employee info. | Public endpoint sanitizes via visibility classification; founder controls optional public disclosure subject to constitutional + legal requirements. |
| **UI-021** | legal-disclaimer §31 | Checkbox must NOT be pre-selected. Electronic acceptance records: userId, timestamp, document version, SHA-256 hash of accepted document, IP, device/session, acceptance type. | /signup renders unchecked checkbox; terms-acceptance API persists all 7 evidentiary fields. |
| **UI-022** | legal-disclaimer §34 | User must affirm: "I HAVE READ AND UNDERSTOOD THE AURIENTA PLATFORM TERMS… MANDATORY EGYPTIAN LAW PREVAILS…" — verbatim text required. | Affirmation text matches EXACT string from legal-disclaimer.ts AFFIRMATION_TEXT_EN/AR. |

---

# 3. WORKFLOW REQUIREMENTS (WF-001 .. WF-025)

## 3.1 CRE Policy Enforcement Workflows

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **WF-001** | cre.ts enforceZeroCustody | Block ANY beneficiary matching `/aurienta/i` (case-insensitive substring). | Test: enforceZeroCustody("AURIENTA Holding") returns allowed=false. |
| **WF-002** | cre.ts enforceExpenseAuthority | Expense authority tiers: <1% (manager OR founding_operator solo), 1-10% (DUAL SIGNATURE: manager + accounting_firm_rep), >10% (board_member). | Test matrix for each tier returns correct requiredApproverRoles. |
| **WF-003** | cre.ts enforcePriceBand | Phase 1/2: orderPrice === fundamentalPrice (exact). Phase 3: within ±5% band. | Unit tests for each phase pass. |
| **WF-004** | cre.ts enforcePoliceClearance | Required for roles: manager, founding_operator, board_member, law_firm_rep, accounting_firm_rep. Blocks appointment if clearance invalid/missing/expired. | Test for each required role returns allowed=false when clearance invalid. |
| **WF-005** | cre.ts enforceKycGate | L0 anonymous: no transactions. L1: observation only. L2: capped at 10,000 EGP per transaction. L3: Founding Operator actions allowed. Tier F founding requires L4. | Each level test returns expected verdict for each action type. |
| **WF-006** | cre.ts enforceFamilyConsent | Family member capital participation >50,000 EGP requires family consent. | Test returns allowed=false when family member + >50K + no consent. |
| **WF-007** | cre.ts enforceConsultingOptOut | Prerequisites: 3 consecutive profitable quarters OR 2 years of consultancy. | Test scenarios: 3 profitable quarters → allowed; <2 years + <3 profitable → blocked. |
| **WF-008** | cre.ts enforceLawFirmReplacement | Replacement firm: active status, frLicenseNumber present, insurance ≥100M EGP, expertise ≥75. | All 4 criteria validated; missing any returns allowed=false. |
| **WF-009** | cre.ts enforceEmergencyFreeze | Can be invoked (allowed=true). Idempotent (already-frozen noted). | Test: invoking on frozen enterprise returns allowed=true with note. |
| **WF-010** | cre.ts enforceNotFrozen | Blocks all money-moving actions when enterprise.status === "frozen". | Test: status="frozen" → allowed=false; status="active" → allowed=true. |
| **WF-011** | cre.ts enforceFundFlow | Law firm status must be "active" AND releaseAmount ≤ lawFirmBalance (Law Firm Client Account balance). | Both checks tested. |
| **WF-012** | cre.ts enforceAccountantGate | Milestone release requires: accountingFirmStatus="active" + evidenceVerified=true + milestoneStatus ∈ {board_review, approved}. | All 3 conditions tested. |
| **WF-013** | cre.ts enforceDividendLock | Dividend amount ≤ realized profits (Law Firm Client Account NOT distributable) AND 30-day cooling-off since last dividend. | Test scenarios: >profits → blocked; within 30d → blocked; valid → allowed. |
| **WF-014** | cre.ts enforceFounderEquityCap | Tier floors: A=5%, B=5%, C=10%, D=51%, E=0%, F=0%. Rejects dilution below floor. | Test for each tier returns allowed=false when proposedFounderEquityPct < required. |
| **WF-015** | cre.ts enforceTierMigration | Order: A → B → C → D → F. Cannot skip. Tier E (University) is a separate track (exempt from sequential rule). | Test: A→C rejected; A→B allowed; A→E allowed (exempt); E→A allowed (exempt). |
| **WF-016** | cre.ts enforceNosiRegistration | 5 states: compliant (registered), approaching (≤30d warning), overdue (31-60d violation), frozen (60d+ expenses blocked), unknown (hire date unknown). | Each state testable via daysSinceHire boundary. |
| **WF-017** | cre.ts enforceNosiExpenseFreeze | If ANY employee is past 60-day NOSI deadline (not registered), ALL expense approvals blocked. | Test: 1 frozen employee → allowed=false for any expense approval. |
| **WF-018** | cre.ts enforceSalaryToEquity | 7 rules: salary known+positive, conversion 0-10%, fundamental price known+positive, workforce consent required, anti-duplicate (no same-cycle double), 15% discount applied (price × 0.85), equity units = floor(convertedAmount/discountedPrice). | Each rule has a test case returning allowed=false on violation. |
| **WF-019** | cre.ts enforceEquityLockUp | Salary-derived Equity Units have restrictedUntil period. Transfer blocked until expiry. | Test: now < restrictedUntil → allowed=false; now ≥ restrictedUntil → allowed=true. |
| **WF-020** | cre.ts enforceSalaryConstitutionality | 4 rules: ≥4,000 EGP AURIENTA floor; board override ≥75%; ratio >2.0 → shareholder notification; ratio >3.0 → hard cap reject. | All 4 rules tested. |
| **WF-021** | cre.ts enforceStatusTransition | Valid transitions: draft→{fundraising_active,frozen}; fundraising_active→{active,frozen,draft}; active→{frozen,graduation_pending}; frozen→{active,draft,fundraising_active}; graduation_pending→{graduated,active,frozen}; graduated→[] (terminal). | Test matrix for all transitions. |
| **WF-022** | cre.ts enforceManagerRemoval (Art. 118) | Requires shareholder vote (ART118_NO_VOTE if missing); simple majority to pass (ART118_VOTE_FAILED if fails); on success ART118_APPROVED. Cooling 48h, voting 72h. | 3 outcome codes tested. |
| **WF-023** | cre.ts enforceVerificationGate | capital_reservation + trade_order require L2 minimum; enterprise_founding requires L3 (A-D) or L4 (F). Rejected status blocks ALL capital deployment. | Test matrix for each action × level combination. |
| **WF-024** | cre.ts enforceSuccessionGate | check_filed: required partners (Founding Operator, Manager, Board Member, >10% Capital Partner) must file declaration before capital deployment. check_active: deceased/incapacitated blocks ALL normal ops; voting proxy takes over. | Both actions tested with each code (SUCCESSION_REQUIRED_NOT_FILED, SUCCESSION_NOT_ACTIVATED, SUCCESSION_PROXY_ACTIVE, SUCCESSION_OK). |
| **WF-025** | cre.ts enforcePriorityWindow + enforcePriorityWindowAllocation + enforceQuadraticVote + enforceSoulboundCredential + enforceConstitutionalEndorsement + enforceProfitShareAgreement + enforceGaasDecision + enforceRiskProfileQuery + enforceCircuitBreaker + enforceScreeningGate | Modified roadmap policies enforce their respective rules (see BR-072..086). | Each policy has unit tests in cre.test.ts. |

---

# 4. API REQUIREMENTS (API-001 .. API-030)

## 4.1 Core Constitutional APIs

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **API-001** | Invariant #2 / cre.ts | Every state-changing API route must call an `enforce*` policy and persist a `CreVerdict` decision token + ledger event before commit. | Audit all POST/PATCH/DELETE routes; each must invoke a CRE function + appendLedgerEvent in db.$transaction. |
| **API-002** | cre.ts appendLedgerEvent | Ledger append MUST be transactional (db.$transaction) with per-enterprise monotonic sequence. PayloadHash = SHA3-256(payload + eventType + prevHash + sequence). DecisionToken signed via Ed25519. | appendLedgerEvent invoked only inside tx; sequence increments correctly under concurrent writes. |
| **API-003** | cre.ts verifyLedgerChain | Endpoint to verify integrity of any enterprise's ledger chain. Returns intact:boolean + eventsChecked + brokenAt:{sequence,id,reason} on tamper. | GET /api/enterprises/[id]/ledger/verify returns the verdict. |
| **API-004** | cre.ts computeGraduationReadiness | Endpoint returns readiness score (0-100) + 9-gate checklist. | GET /api/enterprises/[id]/graduation-readiness returns score + gates[]. |
| **API-005** | cre.ts computeDynamicMinimum | Dynamic minimum Capital Participation per remaining goal / remaining slots / tier. Tier D factor 0.8; others 0.7. Floors: 50 (A/B/C/E), 50,000 (D), 1 (F). | Function exported; GET /api/enterprises/[id]/dynamic-minimum returns computed value. |

## 4.2 Amendment-Driven APIs (AM-010..016)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **API-006** | AM-010 | POST /api/orders — FIFO matching engine runs after order creation; matches within ±5% band; partial fills supported; atomic Trade + Order updates + OwnershipRecord + ledgerEvent `trade_matched` in one transaction. | Integration test: place buy + sell with crossing price → Trade created, ownership transferred, ledger event logged. |
| **API-007** | AM-010 | GET /api/orders — returns order book. | Returns open buy/sell orders sorted by price-time priority. |
| **API-008** | AM-011 | POST/GET /api/verification — manual upload fallback for GAFI/NOSI/Tax/Police; 48h SLA. GET/PATCH /api/verification/[id] — institutional roles approve/reject. | Endpoints exist; GovApiVerification model persists submission; police clearance auto-expiry 6 months enforced. |
| **API-009** | AM-012 | GET/POST /api/vault, POST /api/vault/loan, GET/PATCH /api/vault/loan/[id] — anti-fragility vault. 0.5% deduction per close; loans ≤20% last raise; 24mo; 10% of milestone release; non-recourse; board simple-majority. | All 4 endpoints exist; InsuranceVault + VaultLoan models persist. |
| **API-010** | AM-013 | GET/POST /api/solvency — 3-level health flags with assertion hash. Level 3 (>10% variance or unauthorized withdrawal) auto-triggers enforceEmergencyFreeze + regulator notification. | Endpoint exists; SolvencyAssertion model records level + hash + variance. |
| **API-011** | AM-014 | POST /api/ai/eve — AI evidence verification (vendor consistency, amount reasonableness, date consistency, related-party, missing docs). Returns verified/confidence/findings/redFlags. | Endpoint exists; output schema matches. |
| **API-012** | AM-014 | POST /api/reality-sync — 6-check internal consistency (NOSI compliance, ledger integrity via verifyLedgerChain, ownership consistency, milestone staleness, expense freeze, health score drift). Returns healthy/warning/critical. | Endpoint exists; output returns overall + per-check status. |
| **API-013** | AM-015 | POST /api/graduation/export — returns full data package: profile, cap table (OwnershipRecords), full immutable ledger (ordered by sequence), quarterly reports, milestones, employees (anonymised — no nationalId/nosiNumber), proposals+votes, charter hash. SHA-256 package hash for third-party verification. | Endpoint exists; output excludes nationalId/nosiNumber; package hash verifiable. |
| **API-014** | AM-015 | GET/POST /api/proxies + POST /api/proxies/[id]/revoke — voting proxy delegation. Scope: all/specific proposal/proposal type. Delegatee must be enterprise member. Revocable at any time. | Endpoints exist; VotingProxy model persists scope + revocation timestamp. |
| **API-015** | AM-016 | POST /api/proposals/[id]/vote — wired to enforcePoliceClearance on manager_appointment. If invalid/expired, proposal placed in `evidence_submitted` status pending renewal. | Integration test: manager appointment with expired clearance → proposal status = evidence_submitted. |
| **API-016** | AM-016 | GET /api/expenses/budget — Constitutional Expenses Dashboard. Budget vs actual by category, summary cards (total month/quarter, budget utilization %, pending approvals), category breakdown with role-aware visibility (salary aggregated for non-board), status indicators (🟢≤80% / 🟡80-100% / 🔴>100%). | Endpoint exists; salary categories aggregated when viewer role ≠ board_member. |

## 4.3 Constitutional Public APIs (Modified Roadmap)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **API-017** | BR-074 GaaS | /api/v1/gaas/* — Governance-as-a-Service endpoints. External orgs register rules; CRE validates decisions. | Endpoints registered; per-decision/subscription pricing recordable. |
| **API-018** | BR-077 AREI | /api/v1/arei — daily real-economy index, weighted by Constitutional Health Score. Disclaimer "Not investment advice" in every response. | Endpoint exists; disclaimer string present. |
| **API-019** | BR-083 Oracle | /api/v1/oracle/consensus — AI consensus query (multi-provider, Ed25519-signed verdict, per-query pricing). Disclaimer: "Consensus output is not financial/investment advice". | Endpoint exists; signed verdict + disclaimer present. |
| **API-020** | BR-086 Risk Profile | /api/v1/risk-profile — data service for insurers. Disclaimer must be accepted before query. | Endpoint requires `disclaimerAccepted:true`; returns data only. |
| **API-021** | BR-079 Genome | /api/v1/genome/predict — ML prediction endpoint. Disclaimer "Predictions are not guarantees of success". | Endpoint exists; disclaimer string present. |
| **API-022** | BR-080 Quadratic Vote | /api/v1/quadratic-vote — voice credits = floor(STS/5), capped 20. | Endpoint exists; enforceQuadraticVote wired. |
| **API-023** | BR-081 Zeitgeist | /api/v1/zeitgeist — daily sentiment score. Disclaimer required. | Endpoint exists; daily cron computes; disclaimer present. |
| **API-024** | BR-085 Soulbound | /api/v1/soulbound/credential — mint non-transferable credential. isTransferable=false enforced at CRE level. One per user. L1+ verified required. | Endpoint exists; enforceSoulboundCredential wired. |

## 4.4 Auth APIs

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **API-025** | AUTH-UPGRADE worklog | POST /api/auth — password login with Argon2id + account lockout (5 attempts, 15min cooldown, HTTP 423 Locked + Retry-After). Email-keyed to eliminate user-exists timing oracle. Transparent scrypt→Argon2id upgrade on success. | 5 wrong passwords → 423; correct password after upgrade → hash rewritten to argon2id$. |
| **API-026** | AUTH-UPGRADE worklog | 6 passkey endpoints: register/start, register/finish, authenticate/start, authenticate/finish, list, delete. WebAuthn server v14. Challenge cookie HMAC-SHA256 signed, HttpOnly, short-lived. Constant-time verification. | All 6 routes exist; passkey registration + auth ceremonies complete successfully. |
| **API-027** | cre.ts enforceScreeningGate | AML screening block halts downstream fund flow at CRE level. | Test: screeningEvent.resolution="blocked" → enforceScreeningGate returns allowed=false. |

## 4.5 Health/Readiness/Metrics

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **API-028** | PH-ER Observability | GET /api/health — DB ping + uptime. GET /api/ready — DB + CRE config + AI providers + ledger integrity check; 503 if down. GET /api/metrics — Prometheus format (uptime, users, enterprises, ledger events, active sessions). | All 3 endpoints exist; /ready returns 503 when any critical check fails. |
| **API-029** | cre.ts | Every `CreVerdict` carries a `decisionToken` (Ed25519-signed) that is independently verifiable offline. | verifyCreDecisionToken() succeeds on any token issued in last 24h. |
| **API-030** | legal-disclaimer §31 | Terms-acceptance API records: userId, timestamp, documentVersion, SHA-256 hash of accepted document, IP, device/session, acceptance type, document hash/version. | All 7 fields persisted on acceptance; LEGAL_DISCLAIMER_HASH_EN/AR match accepted hash. |

---

# 5. DATA REQUIREMENTS (DB-001 .. DB-018)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **DB-001** | BLUEPRINT_VERSION.json implementation_status | 51 Prisma models (44 in v3.1 + 7 new in v3.2: Trade, GovApiVerification, InsuranceVault, VaultLoan, SolvencyAssertion, VotingProxy + 1 more). | `prisma/schema.prisma` declares exactly 51+ models; `prisma migrate` produces the count. |
| **DB-002** | BLUEPRINT_VERSION.json | 89 API routes (76 in v3.1 + 13 new). | `find src/app/api -name route.ts \| wc -l` ≥ 89. |
| **DB-003** | BLUEPRINT_VERSION.json | 93 pages, 187 components, 16 institutional systems. | Counts match. |
| **DB-004** | BLUEPRINT_VERSION.json | 20/25 CRE functions wired (5 unwired: enforceZeroCustody [invariant preserved by architecture], enforceLawFirmReplacement, enforceDividendLock, enforceTierMigration, enforceEquityLockUp). Note AM-016 wired enforcePoliceClearance. | grep for each function name across /api routes; 20 invoked. |
| **DB-005** | cre.ts appendLedgerEvent | LedgerEvent model: per-enterprise sequence (monotonic), prevHash, payloadHash (SHA3-256), payload (JSON string), eventType, creDecisionToken, actorId. | Schema matches; appendLedgerEvent enforces prevHash linkage. |
| **DB-006** | AM-001 terminology_migration | `@map` annotations preserve legacy column names (e.g., shares→equityUnits) while exposing constitutional names in code. | Schema inspection confirms @map on renamed fields. |
| **DB-007** | cre.ts OwnershipRecord | OwnershipRecord model includes restrictedUntil field for salary-derived Equity Units (lock-up). | Field present and enforced via enforceEquityLockUp. |
| **DB-008** | BLUEPRINT_VERSION.json | Constitutional Hash field: `0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A` — used for ledger genesis + charter verification. | CONSTITUTIONAL_HASH constant matches BLUEPRINT_VERSION.json. |
| **DB-009** | constants.ts FEE_STRUCTURE | Fee recipients split: OpCo LLC (5%), Advisory LLC (2.5%), Law Firm fiduciary (0.5% antifragility). | Each fee disbursement ledgerEvent references correct recipient entity. |
| **DB-010** | ai.ts Evidence Hierarchy E0-E9 | Every claim/record carries evidenceLevel ∈ {E0,E1,E2,E3,E4,E5,E6,E7,E8,E9}. No promotion En→Em (m>n) without linked evidence + verification + timestamp + audit log. | DB schema includes evidenceLevel enum on all claim-bearing tables. |
| **DB-011** | legal-disclaimer §17 | Personal Data Protection Law 151/2020 compliance: 4 classification levels (Restricted, Confidential, Internal, Public). Residency: Egypt. Cross-border: no personal data outside Egypt. Retention: 10 years default, indefinite for ledger/constitutional/audit. | Schema includes dataClassification field; deployment config ensures Egypt residency. |
| **DB-012** | PH-ER Security Hardening | AES-256-GCM field encryption (FIELD_ENCRYPTION_KEY); Ed25519 signing; hash-chain immutable ledger; audit logging on all state changes. | encryption.ts + signing.ts implement these; tests cover round-trip. |
| **DB-013** | cre.ts verifyLedgerChain | Ledger chain tamper-evidence: payloadHash recomputed on read; prevHash linkage verified; CRE decision token signature verified. | verifyLedgerChain detects tampering at any of 3 levels (prevHash, payloadHash, signature). |
| **DB-014** | AM-010 Trade model | Trade model fields: buyOrderId, sellOrderId, price, quantity, buyerUserId, sellerUserId, ownershipTransferLedgerEventId, createdAt. Created atomically with order updates. | Schema + matching-engine.ts use db.$transaction. |
| **DB-015** | AM-011 GovApiVerification | GovApiVerification model: verificationType, status (pending/in_review/approved/rejected), reviewerId, reviewedAt, evidenceUrl, expiresAt (for police clearance). | Schema matches; 48h SLA timer enforceable. |
| **DB-016** | AM-012 InsuranceVault + VaultLoan | InsuranceVault: enterpriseId, balanceEgp, totalDeductedEgp. VaultLoan: enterpriseId, amountEgp, requestedAt, boardVoteProposalId, status (requested/approved/repaid/forgiven), repaymentSchedule. | Schema persists both models; loans repayable over 24mo. |
| **DB-017** | AM-013 SolvencyAssertion | SolvencyAssertion: enterpriseId, lawFirmBalanceEgp, internalBalanceEgp, variancePct, healthLevel (1/2/3), assertionHash (SHA-256), createdAt. | Schema persists; Level 3 triggers emergencyFreeze. |
| **DB-018** | AM-015 VotingProxy | VotingProxy: delegatorId, delegateeId, scope (all/specific/type), scopeTargetId?, active, revokedAt, createdAt. Delegatee must be enterprise member. | Schema persists; activation + revocation enforceable. |

---

# 6. SECURITY REQUIREMENTS (SEC-001 .. SEC-028)

## 6.1 Authentication (State of the Art)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **SEC-001** | AUTH-UPGRADE worklog / password-v2.ts | Argon2id password hashing. OWASP params: memoryCost=19456 KiB (19 MiB), timeCost=2, parallelism=1. Hash format: `argon2id$<PHC-string>`. | verifyPasswordV2() succeeds on argon2id$ hashes; test hash decodes to OWASP params. |
| **SEC-002** | password-v2.ts | Backward-compatible scrypt verification + transparent upgrade to Argon2id on next successful login. | Legacy `scrypt$...` hash verified, then DB row updated to `argon2id$...` after successful login. |
| **SEC-003** | account-lockout.ts | Account lockout: 5 failed attempts → 15-minute lockout. Keyed by email (not userId) to eliminate user-exists timing oracle. HTTP 423 Locked + Retry-After header. Successful auth clears counter. | Test: 5 wrong passwords → 423; correct password after lockout expiry → 200. |
| **SEC-004** | passkey.ts | WebAuthn/Passkey support (@simplewebauthn/server v14). Registration + authentication ceremonies. Challenge cookie HMAC-SHA256 signed, HttpOnly, short-lived. Constant-time verification. Counter + lastUsedAt updated. Ownership-scoped delete. | passkey.ts + 6 API routes; ceremony completes; counter increments; cross-user delete rejected. |
| **SEC-005** | PH-ER Security Hardening | CSRF: same-origin + double-submit cookie pattern. | csrf-client.ts implements double-submit; tests cover missing/invalid token rejection. |
| **SEC-006** | cre.ts / signing.ts | Ed25519 cryptographic signatures for CRE decision tokens + identity anchors. Real signatures (not mocked base64). | signing.ts uses tweetnacl or @noble/ed25519; test vector passes. |
| **SEC-007** | PH-ER Security Hardening | Server-side sessions with 24h rotation + revocation. | auth.ts sessions table; rotation on activity; revocation endpoint exists. |
| **SEC-008** | PH-ER Security Hardening | Rate limiting per-IP + per-user. | rate-limit.ts enforces both; 429 returned on threshold. |
| **SEC-009** | PH-ER Security Hardening | AES-256-GCM field encryption (FIELD_ENCRYPTION_KEY) for PII fields. | encryption.ts implements AES-256-GCM; key rotation strategy documented. |
| **SEC-010** | PH-ER Security Hardening | RBAC requireRole() enforcement on all role-gated routes. | Route handlers call requireRole("..."); tests cover wrong-role rejection. |
| **SEC-011** | PH-ER Security Hardening | Audit logging on ALL state changes (AuditLog model). | Every POST/PATCH/DELETE writes an AuditLog row. |
| **SEC-012** | PH-ER (PENDING) | MFA / otplib — installed, enrollment flows PENDING. | otplib in package.json; enrollment UI on roadmap. |
| **SEC-013** | PH-ER (PENDING) | WebAuthn/passkeys (now IMPLEMENTED per AUTH-UPGRADE worklog — supersedes the PH-ER PENDING status). | Status updated to IMPLEMENTED. |
| **SEC-014** | PH-ER (PENDING) | CSP/HSTS headers (to add). Brute-force lockout (now IMPLEMENTED per SEC-003). | Partial: lockout done; CSP/HSTS still pending. |
| **SEC-015** | PH-ER DevSecOps | GitHub Actions CI: lint + typecheck + build + dependency scan + secret scan + SAST (CodeQL). Release workflow (tag→build→deploy). Dependabot configured. | .github/workflows/* files exist; CI runs on PR. |
| **SEC-016** | PH-ER DevSecOps (PENDING) | Branch protection (to configure). Pre-commit hooks (pending). DAST/Container scanning (pending). | GitHub branch protection rules documented. |
| **SEC-017** | cre.ts enforceKycGate + enforceVerificationGate | KYC gating: L0 (anonymous) blocked from transactions; L1 observation only; L2 capped 10K EGP; L3 founding; L4 Tier F. Rejected verification blocks capital deployment. | Both CRE functions tested for each level/action. |

## 6.2 Cryptography

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **SEC-018** | cre.ts | SHA3-256 for payload hashing (hashPayload function). | Used for all CreVerdict payloadHash + ledger events. |
| **SEC-019** | cre.ts | Hash-chain ledger: each event's prevHash = previous event's payloadHash. | verifyLedgerChain walks chain via prevHash linkage. |
| **SEC-020** | AM-013 SolvencyAssertion | SHA-256 assertion hash for solvency assertions. | SolvencyAssertion.assertionHash field uses SHA-256. |
| **SEC-021** | AM-015 Graduation Export | SHA-256 package hash for graduation export (third-party verifiable). | /api/graduation/export response includes sha256PackageHash. |
| **SEC-022** | legal-disclaimer §31 | E-Signature Law 15/2004 compliance — qualified e-signature when required by law. Simple checkbox NOT a substitute for qualified signature. | Terms-acceptance flow escalates to qualified e-signature workflow when legally required. |

## 6.3 Cybersecurity Frameworks

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **SEC-023** | ai.ts Cybersecurity | NIST CSF 2.0 + ISO 27001 + CIS Controls. 6 functions (Govern, Identify, Protect, Detect, Respond, Recover). Current maturity Level 2, Target Level 4. | enterprise-risk-security.ts implements 6 functions; maturity score documented. |
| **SEC-024** | ai.ts Compliance | PDPL (Level 3→5), ISO 27001 (2→5), SOC 2 (1→5), ISO 22301 (1→4), ISO 31000 (3→5), ISO 42001 AI (2→4). | Each framework has documented current/target levels + applicable controls. |
| **SEC-025** | ai.ts Business Continuity | RTO 4h critical / 24h non-critical. RPO 24h (backup) / 0 min (ledger). Oracle Mirror protocol for constitutional continuity. Annual testing. | BCP/DR plan documents RTO/RPO; annual test scheduled. |
| **SEC-026** | ai.ts AI Governance | Model approval (AI Ethics Committee), provider onboarding/removal, consensus monitoring, bias monitoring (quarterly), hallucination monitoring (<1% target), prompt governance (non-overridable system prompt), fallback policy, human override (AI cannot override CRE), audit trail (10-year retention). | ai-router.ts implements 5-provider consensus; ai.ts has non-overridable system prompt; AiArtifact table retains prompts/responses. |
| **SEC-027** | ai.ts Data Governance | 4 classification levels (Restricted, Confidential, Internal, Public). Retention 10 years default, indefinite for ledger. Residency: Egypt. Cross-border: no personal data outside Egypt. | Schema has dataClassification field; deployment config ensures Egypt residency. |
| **SEC-028** | ai.ts Certification Roadmap | SOC 2 (Q2 2027), ISO 27001 (Q4 2027), ISO 22301 (Q2 2028), ISO 31000 (Q1 2027), ISO 42001 (Q3 2027). | Roadmap documented; readiness scores: SOC 2 46→100, ISO 27001 46→100. |

---

# 7. INTEGRATION REQUIREMENTS (INT-001 .. INT-022)

## 7.1 Platform Infrastructure

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **INT-001** | PH-ER Database Modernization | Turso (libSQL) as primary DB. Schema is provider-agnostic (String enums for SQLite compat; native enums on PostgreSQL cutover). | prisma/schema.prisma uses String enums; DATABASE_URL points to Turso in production. |
| **INT-002** | PH-ER | Vercel hosting (Next.js 16.3.5 Turbopack). Auto-deploy on GitHub push. | vercel.json + GitHub integration confirmed; aurienta.vercel.app live. |
| **INT-003** | PH-ER | GitHub source control. Branch protection (to configure). Conventional commits. | git remote origin points to GitHub; commit history visible. |
| **INT-004** | inngest.ts | Inngest handles 5 long-running workflows: Dispute Resolution (6-stage, 72h/7d/14d/90d timers), Graduation Protocol (readiness check + 75% vote), Succession Activation (90-day threshold), Verification SLA (48h timer), Circuit Breaker (15min/30min/24h halts). | inngest.ts defines 5 InngestEvent types; INNGEST_EVENT_KEY configured in production. |
| **INT-005** | neon.ts | Neon PostgreSQL analytics (OPTIONAL read-replica). Falls back to Turso when NEON_DATABASE_URL not configured. | analyticsQuery() returns source: "neon" or "turso-fallback" or "error". |

## 7.2 AI Providers (5 in consensus)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **INT-006** | ai-router.ts | Google Gemini (gemini-2.0-flash + gemini-2.5-flash). | Provider callable; API key in env. |
| **INT-007** | ai-router.ts | Groq (llama-3.3-70b-versatile + llama-3.1-8b-instant). | Provider callable. |
| **INT-008** | ai-router.ts | OpenRouter (multi-model gateway: claude-3.5-sonnet, gpt-4o-mini, deepseek-r1). | Provider callable. |
| **INT-009** | ai-router.ts | NVIDIA NIM (llama-3.1-nemotron-70b-instruct + mixtral-8x22b). | Provider callable. |
| **INT-010** | ai-router.ts | HuggingFace (Meta-Llama-3.1-70B-Instruct + Mixtral-8x7B-Instruct). | Provider callable. |
| **INT-011** | ai.ts | NO z.ai / NO OpenAI direct — OpenAI accessed via OpenRouter gateway only. | grep -ri "z\.ai\|openai.com" src/ returns zero z.ai refs; OpenAI only via OpenRouter. |
| **INT-012** | ai-router.ts | CONSENSUS MODE: critical tasks query multiple providers + models in PARALLEL, synthesize one answer. | askMultiModel() runs N providers concurrently; synthesis returns combined result. |
| **INT-013** | ai.ts | Constitutional system prompt is ALWAYS sent first and CANNOT be overridden. User-controlled text wrapped in UNTRUSTED delimiters ("BEGIN UNTRUSTED USER CONTENT" / "END UNTRUSTED USER CONTENT") with guard instruction. | askConstitutionalAI prepends CONSTITUTIONAL_SYSTEM_PROMPT; userContext wrapped. |
| **INT-014** | ai.ts | Every AI call (prompt + response + provider + model + tokens) persisted to AiArtifact table for audit. | AiArtifact rows created with full payload (systemPrompt, userMessage, userContext, provider, model, latency, tokens). |

## 7.3 Government / Regulatory Integrations

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **INT-015** | AM-011 / gov-api.ts | GAFI (General Authority for Investment) — commercial registration + UBO verification. Manual upload fallback with 48h SLA when automated API unavailable. | /api/verification accepts GAFI types; gov-api.ts implements adapter. |
| **INT-016** | AM-011 / gov-api.ts | NOSI (National Organization for Social Insurance) — social insurance registration verification. Manual upload fallback. | Same as INT-015. |
| **INT-017** | AM-011 / gov-api.ts | ETA (Egyptian Tax Authority) — tax clearance verification. Manual upload fallback. | Same as INT-015. |
| **INT-018** | cre.ts enforcePoliceClearance | Police clearance verification (Add-on 27) — auto-expires after 6 months. Roles required: manager, founding_operator, board_member, law_firm_rep, accounting_firm_rep. | /api/verification accepts police_clearance type; expiresAt updated to +6mo on approval. |
| **INT-019** | crcica.ts | CRCICA arbitration — Cairo Regional Centre for International Commercial Arbitration. Dispute resolution fallback. | crcica.ts module exists; legal-disclaimer §29 references Egyptian courts or agreed mechanism. |
| **INT-020** | law-firm-webhook.ts | Law firm webhooks — notify law firm of pending milestone releases, verification requests, escalation events. | law-firm-webhook.ts fires events; tests cover delivery + retry. |

## 7.4 IPFS / Oracle (PENDING)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **INT-021** | PH-ER Technical Debt / ipfs.ts | IPFS integration for document storage (currently mockCid/mockHash documented placeholders). | ipfs.ts has TODO; production deployment must replace mocks. |
| **INT-022** | oracle-network.ts / fx-oracle.ts | FX Oracle (4-source median for multi-currency). AI Consensus Oracle Network for external queries. | fx-oracle.ts implements 4-source median; /api/v1/oracle/consensus exposes signed verdicts. |

---

# 8. OPERATIONAL REQUIREMENTS (OPS-001 .. OPS-026)

## 8.1 AURIENTA Operating System (AOS v1.0)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **OPS-001** | ai.ts AOS | 5 Level-0 domains: Govern, Operate, Advise, Support, Improve — decomposed into 21 Level-1 groups, 44 Level-2 processes. | operating-system.ts defines hierarchy; aligned with APQC. |
| **OPS-002** | ai.ts AOS | 24 processes (PRC-001..024): Enterprise Onboarding, Capital Formation, Constitution Creation, CRE Activation, Law Firm Onboarding, Accountant Onboarding, Partner Onboarding, Brain AI Review, Graduation, CAaaS Certification, Dispute Resolution, Feature Delivery, Release Management, Incident Management, Vendor Approval, Government Engagement, Contract Lifecycle, Financial Close, Strategic Planning, Architecture Review, Change Management, Knowledge Publishing, Quarterly Planning, Policy Updates. | operating-system.ts exports 24 process definitions. |
| **OPS-003** | ai.ts AOS | SOPs (13 mandatory fields each): Purpose, Owner, Trigger, Inputs, Outputs, Steps, Controls, Evidence, KPIs, Escalation, Exceptions, Automation Opportunities. 6 SOPs exist: Enterprise Onboarding, Capital Formation, Brain AI Review, Graduation, Incident Management, Financial Close. | operating-system.ts exports 6 SOPs with all 13 fields. |
| **OPS-004** | ai.ts AOS | 20 Operating Metrics (KPIs): Lead time ≤10d, cycle time ≤2d, deployment frequency ≥3/wk, change failure rate <5%, partner onboarding ≤30d, enterprise onboarding ≤5d, AI response quality ≥95%, AI hallucination <1%, CRE execution <50ms, ledger integrity 100%, support first response ≤4h, support resolution ≤2d, knowledge freshness ≥90%, documentation coverage 100%, automation % ≥70%, operational efficiency +15% YoY, employee productivity +10% YoY, CSAT ≥4.5/5, partner satisfaction NPS ≥50, MTTR Sev1 ≤4h. | KPI dashboard queries each metric; thresholds enforced. |

## 8.2 Commercialization System (ACS v1.0)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **OPS-005** | ai.ts ACS | Commercial Funnel (18 stages): Awareness → Education → Discovery → Qualification → Assessment → Constitution Review → Demo → AI Analysis → Proposal → Legal Review → Pilot → Implementation → Monitoring → Graduation → Alumni → Certification → Government/Enterprise Expansion → Renewal. | commercialization-system.ts defines 18-stage funnel. |
| **OPS-006** | ai.ts ACS | Pricing Architecture (13 lines): Subscription, Implementation, Certification, Training, Government, Enterprise (Tier D-F), University (Tier E 1%), Brain AI, API, Partner, Marketplace (future), Support, Premium. All constitutional-compliant: never % of capital; success fees only on graduation. | 13 pricing lines documented; none charges % of capital raised. |
| **OPS-007** | ai.ts ACS | 110 Commercial KPIs across 12 categories (Sales 15, Marketing 15, Advisory 10, Operations 10, Partner 8, Government 8, Customer 10, Certification 6, AI 6, Commercial & Financial 12, Institutional & Mission 10). Includes ARR, NRR ≥110%, GRR ≥90%, gross margin ≥60%, CAC payback ≤18mo, LTV/CAC ≥3x, graduation rate ≥20%/yr, zero custody compliance 0 violations. | KPI dashboard exposes 110 metrics with targets. |
| **OPS-008** | ai.ts ACS | Competitive Positioning (13 competitors): SAP, Oracle, Salesforce, Stripe, Carta, AngelList, Gust, SeedLegals, Notion, Microsoft, AWS, OpenAI, Palantir. AURIENTA moat: Zero Custody + CRE + Graduation + Fundamental Pricing — no competitor matches all four. | competitive-positioning.md / ai.ts documents all 13. |

## 8.3 Production Hardening (PH-ER v1.0)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **OPS-009** | ai.ts PH-ER | 12 Workstreams: Database Modernization, Security Hardening, DevSecOps, Observability, Enterprise Identity, Quality Engineering, Performance, Enterprise Operations, Compliance Evidence, Documentation, Pilot Readiness, Technical Debt. | PH-ER scorecard tracks each workstream PASS/PARTIAL/PENDING. |
| **OPS-010** | ai.ts PH-ER | Performance: Core Web Vitals targets LCP <2.5s, FID <100ms, CLS <0.1. CRE enforcement ~35ms (target <50ms). API latency P95 read ~200ms / write ~350ms. | Lighthouse + k6 load tests pass. |
| **OPS-011** | ai.ts PH-ER | Readiness Scores: Overall 42/100 (target 85). SOC 2 46/100. ISO 27001 46/100. Security: 0 critical findings (3 high, 6 medium). Go-Live Checklist: 32 items. | Documented scores; remediation backlog tracked. |
| **OPS-012** | ai.ts PH-ER | Pilot Readiness: Onboarding SOP, escalation L1→L2→L3→Founder, SLA ≤4h first response / ≤2d resolution, bug triage Sev1-4, release cadence bi-weekly+weekly. | Pilot handbook + SLA dashboard exist. |

## 8.4 Pilot Deployment (PE v1.0)

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **OPS-013** | ai.ts PE | Pilot PMO (10 functions): governance, planning, milestone tracking, risk tracking, issue management, change requests, weekly executive reporting, decision logs, lessons learned, pilot scorecards. | pilot-execution.ts implements 10 functions. |
| **OPS-014** | ai.ts PE | Pilot Selection Framework (10 weighted criteria, threshold 3.5/5): founder quality, business viability, governance maturity, legal readiness, financial readiness, sector, technology adoption, feedback willingness, strategic value, reference potential. | Selection scoring documented; threshold enforced. |
| **OPS-015** | ai.ts PE | Onboarding Factory (10 steps, 5-business-day target, 90% success rate): constitutional onboarding → identity verification (Ed25519) → charter creation → law firm onboarding → accountant onboarding → Capital Partner onboarding → Brain AI training → CRE activation → dashboard setup → go-live checklist. | Onboarding workflow implemented; 5-day target met. |
| **OPS-016** | ai.ts PE | Pilot Success Metrics (15 KPIs): time to launch ≤5d, time to first milestone ≤30d, governance compliance 100%, Brain AI usage ≥4/week, CRE accuracy 100%, CSAT ≥4.5, constitutional adherence 0 violations, graduation trajectory +5/mo, support tickets ≤2/week, uptime ≥99.9%, issue resolution ≤2d, NPS ≥50, capital formation ≥50% goal/90 days, vote participation ≥80%, pilot retention 100%. | KPI dashboard exposes 15 metrics. |

## 8.5 Institutional Governance v1.0

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **OPS-017** | ai.ts Governance / AM-003 | 11 Committees: Executive, Constitutional, Risk, Audit, AI Ethics, Advisory, Investment, Security, Compliance, Architecture Review Board, Partnership. Founder as chair until executives appointed. | institutional-governance.ts defines 11 committees. |
| **OPS-018** | ai.ts Governance | Constitutional Council: NOT yet constituted. Activates at institutional maturity (50+ employees, 500+ enterprises, or Founder's declaration). 7 members: 3 independent, 2 Founder-appointed, 1 Operations-appointed, 1 Advisory-appointed. 4-year staggered terms. | institutional-governance.ts defines activation triggers + composition. |
| **OPS-019** | ai.ts Governance | Delegation of Authority: 22 decision types with RACI, approval thresholds, escalation triggers. Standard hiring delegated to COO. Vendor approval <100K EGP delegated. Expenditures >1M EGP require Founder approval. | institutional-governance.ts exports RACI_MATRIX with 22 decision types. |
| **OPS-020** | ai.ts Governance | Change Management: 8-step process (propose → impact assessment → Founder review → version bump → changelog entry → amendment registry → commit → tag). Major changes require 75% supermajority. | BLUEPRINT_CHANGELOG.md + AMENDMENT_REGISTRY.md follow the process. |
| **OPS-021** | ai.ts Governance | Operating Rhythm: daily ops standup, weekly executive committee, monthly risk/AI/advisory reviews, quarterly strategy/audit/ARB, annual constitutional/risk/governance reviews. | Calendar + meeting templates documented. |
| **OPS-022** | ai.ts Governance | 14 Corporate KPIs: governance maturity, enterprise success, graduation rate, institutional trust, compliance, audit readiness, CRE reliability, Brain AI reliability, advisory effectiveness, risk exposure, financial sustainability, documentation completeness, decision speed, global expansion readiness. | KPI dashboard exposes 14 metrics. |

## 8.6 Risk, Compliance & Evidence Hierarchy

| ID | Blueprint Ref | Requirement | Acceptance Criterion |
|---|---|---|---|
| **OPS-023** | ai.ts Enterprise Risk | 28 risks across 16 categories. Each risk has: owner, likelihood, impact, velocity, early warning, mitigation, residual risk, recovery plan, risk appetite, board reporting frequency. | enterprise-risk-security.ts exports 28 risks with all fields. |
| **OPS-024** | ai.ts Three Lines of Defense | First Line (Operations — owns/manages risk), Second Line (Compliance/Risk/Security Committees — monitors/challenges), Third Line (Audit Committee/Holding Group/External Auditors — independent assurance). | enterprise-risk-security.ts defines 3 lines. |
| **OPS-025** | ai.ts Evidence Hierarchy E0-E9 | 10 evidence levels: E0 Founder assumption, E1 Market hypothesis, E2 Customer conversation, E3 Qualified opportunity, E4 Proposal, E5 Signed agreement, E6 Active deployment, E7 Measured outcome, E8 Collected revenue, E9 Repeatable outcome. No skipping. No auto-promotion. Each promotion requires linked evidence + verification + timestamp + audit log. | Schema enforces evidenceLevel enum; promotion requires evidence artifact. |
| **OPS-026** | ai.ts Founder Identity | Founder & Sole Owner: Mohamed Eltonsy, 100% ownership. No second owner. No board controlling Founder. No external shareholder structure. Any reference to "Layla" as Founder is a DEFECT. | User table identifies Founder record; ai.ts enforces canonical answer. |

---

## Acceptance Criteria Definition

Each requirement above specifies an **observable acceptance criterion** — a test, audit query, configuration check, or behavioral verification that a downstream audit phase can execute to confirm conformance. Criteria are designed to be:

1. **Deterministic** — produce a pass/fail result, not subjective judgment.
2. **Source-traceable** — reference the specific source file + line.
3. **Automatable** — executable as a unit test, integration test, or static analysis check.
4. **Audit-evidenced** — produce a written artifact that can be appended to the audit file.

---

## Audit Limitations & Notes

1. **AM-008 REJECTED** — The v3.0 audit's tier-capital recommendations (100K/500K/2M EGP floors for Tiers A/B/C) were reclassified as audit recommendations improperly constitutionalized. Original blueprint tier minimums stand (Tier A: 5,000 EGP LLC minimum per Companies Law 159/1981; 50 EGP minimum participation per Capital Partner). The tier floors in TIER_META reflect the original blueprint, NOT the rejected audit recommendations.

2. **AM-009 CORRECTED** — CRE function count corrected from 26 to 25 (the type `CreVerdict` was miscounted as a function). Unwired count: 6 (not 10). The 6 unwired functions: enforceZeroCustody (invariant preserved by architecture), enforcePoliceClearance (now wired per AM-016), enforceLawFirmReplacement, enforceDividendLock, enforceTierMigration, enforceEquityLockUp. After AM-016 wiring, only 5 remain unwired.

3. **Minimum Wage** — The 4,000 EGP figure in `enforceSalaryConstitutionality` is reclassified as "AURIENTA CONSTITUTIONAL FLOOR — REQUIRES LEGAL VERIFICATION". It is NOT a claim about current Egyptian statutory minimum wage.

4. **Norway-Grade Transparency REJECTED** — Blueprint §8.6.2 and Egyptian PDPL (Law 151/2020) govern transparency, not foreign norms.

5. **This register is a snapshot** — Requirements may evolve through formal amendment. Always cross-check AMENDMENT_REGISTRY.md before relying on any specific criterion.

6. **Sources consulted (all 10):**
   - `docs/blueprint/AMENDMENT_REGISTRY.md` (251 lines)
   - `docs/blueprint/BLUEPRINT_CHANGELOG.md` (306 lines)
   - `docs/blueprint/BLUEPRINT_VERSION.json` (122 lines)
   - `src/lib/aurienta/ai.ts` (CONSTITUTIONAL_SYSTEM_PROMPT ~886 lines + helper functions)
   - `src/lib/aurienta/terminology.ts` (63 lines)
   - `src/lib/aurienta/legal-disclaimer.ts` (360 lines)
   - `src/lib/aurienta/constants.ts` (118 lines)
   - `src/lib/aurienta/cre.ts` (1,896 lines, 37 enforce/verify functions)
   - `LEGAL_COMPLIANCE_AUDIT.md` (349 lines)
   - `STRATEGIC_ANALYSIS.md` (285 lines)

---

*"Your capital, your work, your company — no speculation required."*

**End of Blueprint Requirements Register — Phase 2 Forensic Audit.**
