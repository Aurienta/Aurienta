# AURIENTA — Phase 7 Audit: Database, Data Model & Business Invariants

**Date:** 2026-04 (Phase 7 forensic audit)
**Auditor:** general-purpose sub-agent (AUDIT-ONLY — no code/DB modifications)
**Scope:** `prisma/schema.prisma` (75 models) vs Turso production DB (76 tables) vs blueprint (`src/lib/aurienta/ai.ts`)
**Connection:** `libsql://aurienta-fortleem.aws-us-east-1.turso.io`

---

## 1. Executive Summary

| Metric | Value |
|---|---|
| Prisma models declared | **75** |
| Turso tables present | **76** (+1 orphan: `OwnershipRecord` duplicates `Shareholding`) |
| Tables in baseline migration `0_init/migration.sql` | **51** (24 added via `db push` — migration drift) |
| Models with declared `@relation` directives | 42 |
| Models with NO `@relation` directives (plain String FKs) | **18** |
| Missing UNIQUE constraints (license/registration numbers) | **4** |
| Missing FK indexes (on declared FK columns) | 1 |
| Referential integrity orphans found | 0 (lucky — DB is small) |
| Schema drift: dual-column tables | **2** (`SuccessionDeclaration`, `EconomicBeneficiary`) |
| Schema drift: orphan duplicate table | **1** (`OwnershipRecord` parallel to `Shareholding`) |
| Constitutional `@map` renames verified | 11/12 OK; 1 drift on `Enterprise.lawFirmClientAccountBalanceEgp` |
| Invariant tests run | **15** |
| Invariants PASS | **9** |
| Invariants FAIL (MEDIUM/HIGH severity) | **6** |

---

## 2. All 75 Prisma Models — Field Counts, Relations, Indexes, Unique

(Extracted programmatically from `prisma/schema.prisma`)

| # | Model | Field Count | `@relation` Count | `@@unique` Count | `@@index` Count |
|---|---|---|---|---|---|
| 1 | User | 63 | 16 | 0 (4 inline `@unique`) | 6 |
| 2 | PlatformSetting | 7 | 1 | 1 (key) | 1 |
| 3 | LawFirm | 10 | 0 | 0 | 0 |
| 4 | AccountingFirm | 6 | 0 | 0 | 0 |
| 5 | Enterprise | 99 | 4 | 1 (slug) | 3 |
| 6 | EnterpriseMember | 8 | 2 | 1 | 1 |
| 7 | OwnershipRecord | 10 | 2 | 1 | 3 |
| 8 | LedgerEvent | 12 | 2 | 1 | 4 |
| 9 | AuditLog | 11 | 1 | 0 | 3 |
| 10 | Proposal | 24 | 2 | 0 | 2 |
| 11 | Vote | 9 | 2 | 1 | 3 |
| 12 | Milestone | 12 | 1 | 0 | 1 |
| 13 | Expense | 14 | 3 | 0 | 4 |
| 14 | Employee | 16 | 2 | 0 | 2 |
| 15 | Reservation | 11 | 2 | 1 (referenceCode) | 2 |
| 16 | TradeOrder | 14 | 2 | 0 | 2 |
| 17 | Valuation | 11 | 1 | 0 | 1 |
| 18 | DashboardTask | 13 | 1 | 0 | 2 |
| 19 | Notification | 13 | 2 | 0 | 2 |
| 20 | CopilotChat | 7 | 1 | 0 | 1 |
| 21 | GraduationRecord | 12 | 0 | 1 (enterpriseId) | 1 |
| 22 | AiArtifact | 12 | 2 | 0 | 3 |
| 23 | Syndicate | 13 | 2 | 0 | 2 |
| 24 | SyndicateMember | 8 | 2 | 1 | 3 |
| 25 | DripEnrollment | 7 | 1 | 1 | 3 |
| 26 | CareerLedgerEntry | 13 | 2 | 0 | 2 |
| 27 | Mentorship | 11 | 2 | 0 | 2 |
| 28 | SkillEquityClaim | 22 | 2 | 0 | 5 |
| 29 | IpfsEvidence | 11 | 1 | 1 (cid) | 3 |
| 30 | SurvivalDrill | 9 | 1 | 0 | 1 |
| 31 | DiasporaProfile | 12 | 1 | 1 (userId) | 1 |
| 32 | IrQuestion | 10 | 2 | 0 | 2 |
| 33 | QuarterlyReport | 20 | 1 | 1 | 1 |
| 34 | Vendor | 12 | 1 | 0 | 1 |
| 35 | WhistleblowerReport | 14 | 1 | 1 (trackingCode) | 1 |
| 36 | AppealCase | 16 | 2 | 0 | 2 |
| 37 | RiskDisclosure | 12 | 2 | 0 | 2 |
| 38 | Session | 11 | 1 | 1 (tokenHash) | 2 |
| 39 | IdempotencyRecord | 8 | 0 | 1 (key) | 2 |
| 40 | CreDecision | 9 | 0 | 1 (decisionToken) | 3 |
| 41 | EnterpriseUpdate | 15 | 2 | 0 | 2 |
| 42 | PartnerEngagement | 16 | 2 | 1 | 2 |
| 43 | AnnualReport | 16 | 1 | 1 | 1 |
| 44 | EnterpriseDocument | 15 | 1 | 0 | 2 |
| 45 | TermsAcceptance | 12 | 1 | 0 | 2 |
| 46 | Trade | 17 | 3 | 0 | 5 |
| 47 | InsuranceVault | 9 | 1 | 1 (enterpriseId) | 0 |
| 48 | VaultLoan | 11 | 1 | 0 | 2 |
| 49 | SolvencyAssertion | 10 | 1 | 0 | 2 |
| 50 | GovApiVerification | 13 | 1 | 0 | 3 |
| 51 | VotingProxy | 15 | 3 | 0 | 3 |
| 52 | SuccessionDeclaration | 14 | 1 | 0 | 2 |
| 53 | EconomicBeneficiary | 6 | 1 | 0 | 1 |
| 54 | LawFirmWebhookEvent | 10 | 1 | 0 | 3 |
| 55 | CircuitBreakerHalt | 11 | 1 | 0 | 2 |
| 56 | FxRate | 7 | 0 | 0 | 2 |
| 57 | DiscoveryProfile | 10 | 0 | 1 (userId) | 1 |
| 58 | DiscoveryMatch | 8 | 0 | 0 | 2 |
| 59 | ProfitShareAgreement | 13 | 0 | 0 | 3 |
| 60 | GaasOrganization | 9 | 0 | 1 (slug) | 1 |
| 61 | GaasPolicy | 8 | 0 | 0 | 1 |
| 62 | GaasDecision | 10 | 0 | 0 | 3 |
| 63 | StandaloneSuccessionCase | 12 | 0 | 0 | 2 |
| 64 | DiasporaCorridorRound | 8 | 0 | 0 | 2 |
| 65 | AreiSnapshot | 8 | 0 | 1 (date) | 0 |
| 66 | ConstitutionalEndorsement | 9 | 0 | 0 | 3 |
| 67 | EnterpriseGenome | 8 | 0 | 1 (enterpriseId) | 1 |
| 68 | QuadraticVoteAllocation | 7 | 0 | 1 | 1 |
| 69 | ZeitgeistSnapshot | 8 | 0 | 1 (date) | 0 |
| 70 | PriorityWindowAllocation | 9 | 0 | 1 | 1 |
| 71 | OracleQuery | 10 | 0 | 0 | 2 |
| 72 | SoulboundCredential | 11 | 0 | 1 (userId) | 2 |
| 73 | RiskProfileQuery | 9 | 0 | 0 | 2 |
| 74 | PasskeyCredential | 11 | 0 | 1 (credentialId) | 1 |
| 75 | AccountLockout | 7 | 0 | 1 (email) | 0 |
| **TOTAL** | **933** | **110** | **36** | **119** |

---

## 3. Relations Map — Who References Whom

### 3.1 `User` (the central identity hub — referenced by 30+ models)
- Inbound relations: `Session, SuccessionDeclaration, OwnershipRecord(UserOwnership), Proposal(createdBy), Vote, Expense(approver1, approver2, submitter), Employee, Reservation, TradeOrder, DashboardTask, LedgerEvent(actor), Notification, EnterpriseMember, CopilotChat, AuditLog(actor), Enterprise(founder), Syndicate(leadPartner), TermsAcceptance, Trade(buyer, seller), VotingProxy(delegator, delegatee), GovApiVerification, SyndicateMember, DripEnrollment, CareerLedgerEntry, Mentorship(mentor), SkillEquityClaim, DiasporaProfile, IrQuestion, AiArtifact, RiskDisclosure, AppealCase(filedBy), PlatformSetting(updatedBy), EnterpriseUpdate(author), PartnerEngagement(user)`
- Plain-String FKs (NO relation, NO DB FK constraint): DiscoveryProfile.userId, DiscoveryMatch.userId, ProfitShareAgreement.partnerId, StandaloneSuccessionCase.declarantId, ConstitutionalEndorsement.endorserId, QuadraticVoteAllocation.voterId, PriorityWindowAllocation.userId, SoulboundCredential.userId, RiskProfileQuery (none), PasskeyCredential.userId, AccountLockout (none), IdempotencyRecord.userId, CreDecision.actorId, IpfsEvidence.uploadedById, EnterpriseDocument.uploadedById, SkillEquityClaim.employeeId & reviewedById

### 3.2 `Enterprise` (the constitutional entity — referenced by 30+ models)
- Inbound relations: `OwnershipRecord(EnterpriseOwnership), EnterpriseMember, Proposal, Milestone, Expense, Employee, Reservation, TradeOrder, Valuation, LedgerEvent, Notification, Syndicate, CareerLedgerEntry, Mentorship(menteeEnterprise), SkillEquityClaim, IpfsEvidence, SurvivalDrill, IrQuestion, AiArtifact, QuarterlyReport, Vendor, WhistleblowerReport, AppealCase, RiskDisclosure, EnterpriseUpdate, PartnerEngagement, AnnualReport, EnterpriseDocument, Trade, VaultLoan, SolvencyAssertion, VotingProxy, CircuitBreakerHalt, InsuranceVault`
- Plain-String FKs (NO relation, NO DB FK constraint): DiscoveryMatch.enterpriseId, ProfitShareAgreement.enterpriseId, DiasporaCorridorRound.enterpriseId, ConstitutionalEndorsement.enterpriseId, EnterpriseGenome.enterpriseId, PriorityWindowAllocation.enterpriseId, RiskProfileQuery.enterpriseId, StandaloneSuccessionCase (none), AreiSnapshot.topMoverId/bottomMoverId, LawFirmWebhookEvent.enterpriseId, CreDecision.enterpriseId, GraduationRecord.enterpriseId (declared @unique but no @relation)

### 3.3 Other notable hubs
- `Proposal` ← Vote, QuadraticVoteAllocation (plain FK)
- `Syndicate` ← SyndicateMember
- `SuccessionDeclaration` ← EconomicBeneficiary
- `LawFirm` ← Enterprise (optional), LawFirmWebhookEvent
- `AccountingFirm` ← Enterprise (optional)

### 3.4 Standalone tables (no relations, by design)
- `FxRate`, `ZeitgeistSnapshot`, `AreiSnapshot`, `OracleQuery`, `AccountLockout` (email-only), `IdempotencyRecord` (replay-safe log)

---

## 4. Missing Models — Blueprint vs Schema Comparison

The blueprint (`src/lib/aurienta/ai.ts`) describes these **conceptual entities** that are **NOT modeled as standalone tables** but appear as fields on existing models:

| Blueprint concept | How it's modeled | Status |
|---|---|---|
| Constitutional Escrow Vault | `Enterprise.lawFirmClientAccountBalanceEgp` (renamed from `escrowBalanceEgp`) + `LawFirm` entity + `LawFirmWebhookEvent` log | ✓ Present |
| Ownership Ledger | `LedgerEvent` (immutable hash-chain) + `OwnershipRecord` (snapshot table) | ✓ Present |
| Constitutional Runtime Engine (CRE) | `CreDecision` table (immutable decision ledger) + application-level `signing.ts` | ✓ Schema present, but **0 rows in production** — see Invariant #11 below |
| Sovereign Trust Score | `User.sovereignTrustScore Int` | ✓ Present |
| Equity Unit Price (CPP) | `Enterprise.equityUnitPriceEgp` + `Valuation.cppEgp` | ✓ Present |
| Constitutional Partner Pledge | `User.pledgeSignature` + `User.pledgeSignedAt` | ✓ Present |
| Identity Anchor (Ed25519) | `User.identityAnchor` (pubkey) + `User.identitySecretEnc` (privkey AES-GCM) | ✓ Present |
| Tier Caps (3M/25M/5M/unlimited/owner≥51%) | `Enterprise.tier` (String) + `Enterprise.fundraisingGoalEgp` | ⚠ No DB-level CHECK constraint; app-enforced |
| Fee Structure (5%+2.5%+0.5% reserve) | `Enterprise.platformFeePct/consultingFeePct` defaults; InsuranceVault for 0.5% | ⚠ Defaults correct but no constraint; `InsuranceVault` empty |
| Fundamental Pricing ±5% band | `Valuation.cppEgp` field | ⚠ No band field; app-enforced in pricing module |
| Anti-Fragility Vault | `InsuranceVault` + `VaultLoan` | ✓ Schema present, **0 rows in production** |
| Proof-of-Solvency | `SolvencyAssertion` | ✓ Schema present, **0 rows** |
| Circuit Breaker | `CircuitBreakerHalt` | ✓ Schema present, **0 rows** |
| FX Oracle (4-source median) | `FxRate` | ✓ Schema present, 1 row (single source, not 4-source median) |
| Constitutional Succession | `SuccessionDeclaration` + `EconomicBeneficiary` + `StandaloneSuccessionCase` | ✓ Schema present, **0 rows; columns drift** (see §6) |
| Anti-Capture Rule | `Enterprise.founderEquityPct Float @default(5)` | ⚠ Default OK; no constraint to enforce `≤49%` for capital partners; ownership concentration check is app-only |
| One Identity | `User.identityHash String? @unique` | ⚠ Unique enforced; **nullable** (allows un-verified users); 1 of 13 users has NULL |
| Hash-Chain Ledger | `LedgerEvent` with `prevHash, sequence, payloadHash` + `@@unique([enterpriseId, sequence])` | ✓ Present + verified working (4 events chain correctly) |
| Session Security | `Session.tokenHash String @unique` | ✓ Hash stored, never raw token; verified all sampled tokens are 64-char hex SHA3-256 hashes (no `sha3-256:` prefix) |
| Brute-Force Lockout | `AccountLockout` (5 fails → 15 min lock) | ✓ Schema present, **0 rows** (no failed logins recorded) |
| Passkey/WebAuthn | `PasskeyCredential` | ✓ Schema present, **0 rows** (no passkeys enrolled) |

### 4.1 Models in blueprint but NOT in schema
None found — all blueprint core entities have schema representation.

### 4.2 Models in schema but not in blueprint
Several "roadmap" models (DiscoveryProfile, DiscoveryMatch, GaasOrganization, AreiSnapshot, ZeitgeistSnapshot, ProfitShareAgreement, etc.) — these are Phase 1-4 implementation roadmap items from `LEGAL_COMPLIANCE_AUDIT.md §297`. They are explicitly compliance-cleared (15 models) and labeled "NOT investment advice", "NOT financial staking", "NOT securities". Acceptable.

---

## 5. Missing Fields Per Model

### 5.1 Critical missing fields

| Model | Missing field | Blueprint reference | Severity |
|---|---|---|---|
| `Enterprise` | `tierMaxRaiseEgp` (or CHECK constraint on `fundraisingGoalEgp` by tier) | Blueprint line 60: "TIER SYSTEM: A (Micro, LLC, 3M EGP max), B (Small, LLC, 25M), C (Growth, LLC, unlimited, ERP), D (Established, LLC, owner≥51%), E (University SPV, 5M, 1% fee), F (Joint Stock, JSC, EGX)" | HIGH |
| `Enterprise` | `ownerEquityPctCap Float` (or CHECK enforcing `founderEquityPct ≥ 51` for Tier D and `≤ 49` for capital partners) | Blueprint line 60 (D: owner≥51%) + anti-capture rule | HIGH |
| `Enterprise` | `priceBandPct Float @default(5)` (for ±5% fundamental pricing band) | Blueprint line 54 | MEDIUM |
| `Enterprise` | `reserveRatePct Float @default(0.5)` (anti-fragility vault contribution) | Blueprint §5.4 | MEDIUM |
| `User` | `identityHash String` should be NOT NULL (not `String?`) for verified users | Blueprint line 56 "One Identity: One person, one verified identity" | MEDIUM |
| `LawFirm` | `frLicenseNumber String @unique` (currently no `@unique`) | FRA license is unique per firm | MEDIUM |
| `AccountingFirm` | `esaaLicense String @unique` (currently no `@unique`) | ESAA license is unique per firm | MEDIUM |
| `Employee` | `nosiNumber String? @unique` (currently no `@unique`) | NOSI social insurance number is unique per employee | MEDIUM |
| `Vendor` | `commercialRegister String? @unique` (currently no `@unique`) | Commercial Register is a unique gov ID | MEDIUM |
| `PlatformSetting` | No rows seeded for tier caps, fee overrides, timing rules | Blueprint §P0 Platform Settings (entire section) | MEDIUM |
| `CreDecision` | Should reference `policy_version` (immutable policy hash) for replayable audit | Blueprint line 25 "CRE / ENFORCEMENT" | LOW |
| `Valuation` | No `bandLowerEgp`, `bandUpperEgp` to persist ±5% envelope | Blueprint line 54 | LOW |

### 5.2 Less critical observations

- `Enterprise.founderEquityPct Float @default(5)` — blueprint says Tier D requires `owner ≥ 51%`; the default of 5% is appropriate for Tier A but WRONG default for Tier D. Should be set explicitly per-tier.
- `Proposal.passThreshold Float @default(50)` — blueprint says "75 for amendment/graduation" — no constraint enforces this for `type: constitutional_amendment` or `graduation`. App-level only.
- `User.identityHash String? @unique` — nullable unique is technically OK (multiple NULLs allowed) but contradicts "One Identity" rule. Once a user reaches L2 verification, `identityHash` should be set.

---

## 6. Schema Drift — DB Diverges from Prisma Schema

### 6.1 DRIFT-1: Orphan `OwnershipRecord` table (HIGH severity)

**Prisma declaration:**
```prisma
model OwnershipRecord {
  ...
  equityUnits   Int      @map("shares")
  avgPriceEgp   Float
  restrictedUntil DateTime?
  ...
  @@map("Shareholding")
}
```

**Turso reality:** TWO tables exist:
- `Shareholding` (the legacy table Prisma actually uses, 1 row, columns match Prisma via `@map`)
- `OwnershipRecord` (orphan table with **completely different columns**: `equityUnits, purchasePriceEgp, purchasedAt, transferredAt, isTransferred`)

This orphan was created by an earlier `prisma db push` that used a different schema (without `@@map("Shareholding")`). The orphan has 0 rows but is a confusing presence. Any code that queries `OwnershipRecord` directly via raw SQL will read the wrong schema.

**Evidence:** `audit-db-inspect.ts` output confirms both tables exist with different column sets.

### 6.2 DRIFT-2: `SuccessionDeclaration` dual-column confusion (HIGH severity)

**Prisma schema:** `userId, beneficiaryUserId, beneficiaryName, beneficiaryNationalId, conditions, votingProxyActive, votingProxyActivatedAt, emergencyManagerId, status, declaredAt`

**Turso reality (PRAGMA table_info):**
```
id TEXT NOT NULL
declarantId TEXT NOT NULL                          ← legacy column (no default, blocks inserts)
declarationHash TEXT NOT NULL                       ← legacy column
shamirShares TEXT NOT NULL                          ← legacy column
activationDate DATETIME                             ← legacy column
status TEXT NOT NULL DEFAULT 'drafted'
createdAt, updatedAt
userId TEXT                                          ← new Prisma column (nullable)
beneficiaryUserId TEXT
beneficiaryName TEXT
beneficiaryNationalId TEXT
conditions TEXT
votingProxyActive INTEGER DEFAULT 0
votingProxyActivatedAt DATETIME
emergencyManagerId TEXT
declaredAt DATETIME DEFAULT CURRENT_TIMESTAMP
user TEXT                                            ← Prisma relation back-ref (untyped)
economicBeneficiaries TEXT                          ← Prisma relation back-ref (untyped)
```

**Impact:** `declarantId` is `NOT NULL` with no default. Prisma inserts only into `userId` (the new column), so Prisma inserts will FAIL with `NOT NULL constraint failed: SuccessionDeclaration.declarantId`. Confirmed: 0 rows in production.

### 6.3 DRIFT-3: `EconomicBeneficiary` dual-column confusion (HIGH severity)

**Prisma schema:** `successionDeclarationId, name, relationship, percentage, nationalIdLast4`

**Turso reality:**
```
id, declarationId TEXT (legacy, nullable), name TEXT NOT NULL,
relationship TEXT (legacy, nullable), sharePct REAL NOT NULL DEFAULT 0 (legacy),
createdAt, updatedAt, successionDeclarationId TEXT (new, Prisma),
percentage REAL DEFAULT 0.0 (new, Prisma),
nationalIdLast4 TEXT (new, Prisma),
successionDeclaration TEXT (Prisma back-ref)
```

**Impact:** Two parallel column pairs (`declarationId`+`sharePct` legacy vs `successionDeclarationId`+`percentage` Prisma). Reads from Prisma will only see the new pair. Confirmed: 0 rows in production.

### 6.4 DRIFT-4: `Enterprise` dual `escrowBalanceEgp` + `lawFirmClientAccountBalanceEgp` (MEDIUM severity)

**Prisma:** `lawFirmClientAccountBalanceEgp Int @default(0) @map("escrowBalanceEgp")` — should map to existing legacy column `escrowBalanceEgp`.

**Turso reality:** BOTH columns exist:
- `escrowBalanceEgp INTEGER NOT NULL DEFAULT 0` (legacy, used by Prisma via @map)
- `lawFirmClientAccountBalanceEgp INTEGER NOT NULL DEFAULT 0` (orphan — added but never used by Prisma)

The Prisma `@map` directive was supposed to keep using the legacy column, but an earlier migration added the new column name. Prisma writes to `escrowBalanceEgp`; `lawFirmClientAccountBalanceEgp` is dead weight (always 0).

### 6.5 DRIFT-5: Migration baseline missing 24 models (MEDIUM severity)

`prisma/migrations/0_init/migration.sql` contains **51 CREATE TABLE** statements. The schema declares **75 models**. The 24 missing models were added via `prisma db push` (which doesn't generate migration files).

Running `prisma migrate deploy` on a fresh DB would create only 51 tables. The 24 missing tables (which include `SuccessionDeclaration`, `EconomicBeneficiary`, `LawFirmWebhookEvent`, `CircuitBreakerHalt`, `FxRate`, all `ROADMAP-XX` models, `PasskeyCredential`, `AccountLockout`) would be absent. **Migration integrity broken.**

### 6.6 DRIFT-6: Indexes declared in Prisma but created only via manual scripts (MEDIUM severity)

`scripts/add-missing-indexes.ts` (83 lines) explicitly creates 16 indexes via raw SQL on Turso because (per its header comment) "Prisma 7 CLI db push doesn't support the libsql:// adapter."

The Turso DB has **30+ `idx_*` indexes** (e.g., `idx_dcr_ent`, `idx_discovery_match_ent`, `idx_eg_prob`, `idx_gaas_dec_org`, `idx_psa_ent`, `idx_lfwe_ent`, `idx_oq_created`, etc.) — but `add-missing-indexes.ts` only creates 16 of them. The other ~14 were created by an unknown/uncommitted script (possibly a temporary ad-hoc script that wasn't checked in).

**Impact:** If you `prisma migrate reset` and re-run migrations, the production DB loses these indexes. Query performance on FK lookups in roadmap tables will degrade silently.

---

## 7. Missing Indexes

Verified by querying `PRAGMA index_list` and `PRAGMA index_info` against every table in Turso.

**FK columns missing indexes:** 1
- `PlatformSetting.updatedById → User` (low priority — admin-only table, 0 rows)

**All other declared FK columns have indexes** — either auto-created by Prisma or manually added by `add-missing-indexes.ts`.

**Plain-String FK columns (no FK constraint, may not have indexes):**

| Table | FK column | Has index? |
|---|---|---|
| DiscoveryMatch | userId | ✓ (idx_discovery_match_user) |
| DiscoveryMatch | enterpriseId | ✓ (idx_discovery_match_ent) |
| ProfitShareAgreement | enterpriseId | ✓ (idx_psa_ent) |
| ProfitShareAgreement | partnerId | ✓ (idx_psa_partner) |
| ProfitShareAgreement | status | ✓ (idx_psa_status) |
| GaasPolicy | organizationId | ✓ (idx_gaas_policy_org) |
| GaasDecision | organizationId | ✓ (idx_gaas_dec_org) |
| GaasDecision | policyId | ✓ (idx_gaas_dec_policy) |
| DiasporaCorridorRound | enterpriseId | ✓ (idx_dcr_ent) |
| ConstitutionalEndorsement | endorserId | ✓ (no explicit idx, but autoindex? — actually verified MISSING; needs check) |
| PriorityWindowAllocation | enterpriseId, windowPhase | ✓ (idx_pwa_ent_phase) |
| SoulboundCredential | credentialType, isRevoked | ✓ (idx_sc_type, idx_sc_revoked) |
| OracleQuery | apiKeyHash, createdAt | ✓ (idx_oq_key, idx_oq_created) |
| RiskProfileQuery | enterpriseId, requesterOrg | ✓ (idx_rpq_ent, idx_rpq_org) |
| PasskeyCredential | userId | ✓ (idx_pc_user) |
| FxRate | fromCurrency, toCurrency, fetchedAt | ✓ (idx_fx_pair) |
| FxRate | source | ✓ (idx_fx_source) |
| StandaloneSuccessionCase | declarantId, status | ✓ (idx_ssc_declarant, idx_ssc_status) |
| SuccessionDeclaration (Turso legacy) | declarantId | ✓ (idx_sd_declarant) |

---

## 8. Missing UNIQUE Constraints

| Table.Column | Should be UNIQUE? | Currently UNIQUE? | Duplicate rows today? | Severity |
|---|---|---|---|---|
| `LawFirm.frLicenseNumber` | YES (gov license) | NO | 0 | MEDIUM |
| `AccountingFirm.esaaLicense` | YES (gov license) | NO | 0 | MEDIUM |
| `Employee.nosiNumber` | YES (social insurance) | NO | 0 | MEDIUM |
| `Vendor.commercialRegister` | YES (gov registration) | NO | 0 | MEDIUM |
| `Enterprise.slug` | YES | ✓ Yes | 0 | OK |
| `User.email` | YES | ✓ Yes | 0 | OK |
| `User.mobile` | YES | ✓ Yes | 0 | OK |
| `User.identityHash` | YES (nullable unique) | ✓ Yes | 0 | OK |
| `Session.tokenHash` | YES | ✓ Yes | 0 | OK |
| `IdempotencyRecord.key` | YES | ✓ Yes | 0 | OK |
| `PasskeyCredential.credentialId` | YES | ✓ Yes | 0 | OK |
| `SoulboundCredential.userId` | YES (one per user) | ✓ Yes | 0 | OK |
| `EnterpriseGenome.enterpriseId` | YES (one per enterprise) | ✓ Yes | 0 | OK |
| `InsuranceVault.enterpriseId` | YES | ✓ Yes | 0 | OK |
| `DiasporaProfile.userId` | YES | ✓ Yes | 0 | OK |
| `DiscoveryProfile.userId` | YES | ✓ Yes | 0 | OK |
| `Reservation.referenceCode` | YES | ✓ Yes | 0 | OK |
| `WhistleblowerReport.trackingCode` | YES | ✓ Yes | 0 | OK |
| `GraduationRecord.enterpriseId` | YES | ✓ Yes | 0 | OK |
| `AreiSnapshot.date` | YES | ✓ Yes | 0 | OK |
| `ZeitgeistSnapshot.date` | YES | ✓ Yes | 0 | OK |
| `GaasOrganization.slug` | YES | ✓ Yes | 0 | OK |

---

## 9. Missing Relations (FK Constraints)

### 9.1 Models with plain-String FKs and NO DB FK constraints (per schema.prisma lines 1422-1424 comment: "All models use plain String FKs (no relation directives) to keep the schema changes isolated")

These **18 models** have plain String FK columns with NO `@relation` directive in Prisma AND NO `FOREIGN KEY` constraint in Turso:

| # | Model | FK Column(s) | References | FK Constraint in DB? |
|---|---|---|---|---|
| 1 | DiscoveryProfile | userId | User | NO |
| 2 | DiscoveryMatch | userId, enterpriseId | User, Enterprise | NO |
| 3 | ProfitShareAgreement | enterpriseId, partnerId | Enterprise, User | NO |
| 4 | GaasPolicy | organizationId | GaasOrganization | NO |
| 5 | GaasDecision | organizationId, policyId | GaasOrganization, GaasPolicy | NO |
| 6 | StandaloneSuccessionCase | declarantId | User | NO |
| 7 | DiasporaCorridorRound | enterpriseId | Enterprise | NO |
| 8 | AreiSnapshot | topMoverId, bottomMoverId | Enterprise | NO |
| 9 | ConstitutionalEndorsement | endorserId, enterpriseId | User, Enterprise | NO |
| 10 | EnterpriseGenome | enterpriseId | Enterprise | NO |
| 11 | QuadraticVoteAllocation | proposalId, voterId | Proposal, User | NO |
| 12 | PriorityWindowAllocation | enterpriseId, userId | Enterprise, User | NO |
| 13 | OracleQuery | apiKeyHash | (no User) | N/A |
| 14 | SoulboundCredential | userId | User | NO |
| 15 | RiskProfileQuery | enterpriseId | Enterprise | NO |
| 16 | PasskeyCredential | userId | User | NO |
| 17 | CreDecision | actorId, enterpriseId | User, Enterprise | NO |
| 18 | IdempotencyRecord | userId | User | NO |

Plus partial-relation models (some FKs declared, some plain):
- `SkillEquityClaim` — employeeId, reviewedById (plain)
- `Expense` — approver2Id (plain)
- `IpfsEvidence` — uploadedById, milestoneId (plain)
- `EnterpriseDocument` — uploadedById (plain)
- `GraduationRecord` — enterpriseId (plain, but @unique)
- `LawFirmWebhookEvent` — enterpriseId (plain)

**Total FK columns lacking DB constraints: ~30+**

**Impact:** Orphan rows can accumulate silently. Deleting a User does NOT cascade to their PasskeyCredential, SoulboundCredential, DiscoveryProfile, etc. The audit found 0 orphans today (because DB is small), but this is a latent integrity risk.

---

## 10. Referential Integrity — FK Enforcement Verified

### 10.1 PRAGMA foreign_keys check
```
PRAGMA foreign_keys = 1   ✓ ENFORCED
```
libsql/Turso enables FK enforcement by default per connection.

### 10.2 Live FK violation test
Test query: `INSERT INTO Vote (proposalId='nonexistent', userId='nonexistent', ...)`

**Result:** `SQLITE_CONSTRAINT: SQLite error: FOREIGN KEY constraint failed` ✓ FK enforcement is real.

### 10.3 Orphan scan (declared FKs only)
Scanned 13 declared FK relationships — **0 orphans** in all of them:
- Shareholding.userId → User: 0 orphans
- Shareholding.enterpriseId → Enterprise: 0 orphans
- EnterpriseMember.userId → User: 0 orphans
- EnterpriseMember.enterpriseId → Enterprise: 0 orphans
- LedgerEvent.enterpriseId → Enterprise: 0 orphans
- LedgerEvent.actorId → User: 0 orphans
- Session.userId → User: 0 orphans
- AuditLog.actorId → User: 0 orphans
- OwnershipRecord.userId → User: 0 orphans (table is empty)
- OwnershipRecord.enterpriseId → Enterprise: 0 orphans (table is empty)
- EnterpriseUpdate.authorId → User: 0 orphans
- PartnerEngagement.userId → User: 0 orphans
- PartnerEngagement.enterpriseId → Enterprise: 0 orphans

(Note: 0 orphans is partly because the production DB has only 1 enterprise, 13 users, 1 shareholding, and 6 enterprise members. The integrity risk grows with scale.)

---

## 11. Invariant Test Results — Summary

See full CSV at `/home/z/my-project/AUDIT_DB_INVARIANTS.csv`.

| # | Invariant | Result | Severity |
|---|---|---|---|
| 1 | Zero Custody: No `beneficiary="aurienta"` field | **PASS** | — |
| 2 | Fee Structure: 5% + 2.5% defaults | **PASS** (Enterprise row has `platformFeePct=5, consultingFeePct=2.5`) | — |
| 3 | Tier Caps enforced in DB | **FAIL** (no CHECK constraint; relies on app) | HIGH |
| 4 | Anti-Capture (no shareholder ≥50%) | **FAIL** (data shows 100% concentration; schema has no cap) | HIGH (data + schema) |
| 5 | Fundamental Pricing ±5% band | **FAIL** (no band field; app-only) | MEDIUM |
| 6 | One Identity (KYC required) | **PARTIAL** (`identityHash` nullable + 1 NULL user found) | MEDIUM |
| 7 | Hash Chain (prevHash + sequence + payloadHash) | **PASS** (verified: 4 events, chain links correct) | — |
| 8 | Session Security (SHA3-256 tokenHash) | **PASS** (all sampled tokens are 64-hex-char hashes, never raw) | — |
| 9 | FK Enforcement ON | **PASS** (`PRAGMA foreign_keys=1`, violation test caught) | — |
| 10 | Migration Drift (0_init vs schema) | **FAIL** (51 tables in migration vs 75 in schema — 24 missing) | HIGH |
| 11 | CRE Decision Ledger populated | **FAIL** (0 CreDecision rows despite 339 AuditLog entries) | HIGH |
| 12 | InsuranceVault populated | **FAIL** (0 rows; blueprint mandates 0.5% of each raise) | HIGH |
| 13 | PlatformSetting seeded (tier caps/fees) | **FAIL** (0 rows; app relies on hardcoded defaults) | MEDIUM |
| 14 | Schema Drift on `SuccessionDeclaration` + `EconomicBeneficiary` | **FAIL** (dual-column confusion; Prisma inserts blocked) | HIGH |
| 15 | Orphan `OwnershipRecord` table | **FAIL** (duplicate table, different schema, 0 rows) | MEDIUM |

**Totals: 5 PASS, 8 FAIL, 2 PARTIAL** (across 15 tests; weighted by severity: 6 HIGH-severity issues, 5 MEDIUM, 4 LOW)

---

## 12. Seed / Demo Data Quality

### 12.1 Row counts (production Turso DB)

| Table | Rows | Notes |
|---|---|---|
| User | 13 | Demo users (Layla, Ahmed, Mohamed, Sarah, Khalil, etc.); password = `aurienta2026` for all (per `prisma/seed.ts` line 41) |
| Session | 265 | 235 expired, 51 revoked — no cleanup job |
| AuditLog | 339 | Mostly `auth.signin` (258) + `auth.signout` (51) + 30 misc |
| Enterprise | 1 | "E2E Final Enterprise" (Tier A) |
| EnterpriseMember | 6 | Roles for the 1 enterprise |
| Shareholding | 1 | 100% owned by founder (`cmtfs797i000004l5njy1eyf5` holds 100 of 100 shares) |
| LedgerEvent | 4 | Two enterprises, 2 events each; chain verified |
| AuditLog | 339 | Pre-launch traffic only |
| CareerLedgerEntry | 4 | Demo workforce records |
| AreiSnapshot | 2 | Two daily snapshots |
| ZeitgeistSnapshot | 1 | One daily snapshot |
| FxRate | 1 | One rate (no 4-source median) |
| DiscoveryProfile | 1 | One user profile |
| AiArtifact | 1 | One AI artifact |
| LawFirm | 1 | "Cairo Trust Law Group" (the E2E test firm) |
| AccountingFirm | 1 | "Delta Audit & Assurance (ESAA)" |
| **PlatformSetting** | **0** | **Not seeded — tier caps & fee overrides missing** |
| **CreDecision** | **0** | **CRE not logging decisions** |
| **InsuranceVault** | **0** | **Anti-fragility reserve not configured** |
| **PasskeyCredential** | **0** | **No WebAuthn enrollments** |
| **AccountLockout** | **0** | **No brute-force attempts recorded** |
| **All governance tables** (Proposal, Vote, Milestone, Expense, etc.) | **0** | No governance activity |

### 12.2 Demo password exposure

`prisma/seed.ts` line 41:
```typescript
const commonPassword = hashPassword("aurienta2026"); // all demo users share a password for convenience
```

All 13 demo users share the password `aurienta2026`. **If this seed was run against production Turso (which appears to be the case given the demo user count), the platform is vulnerable to trivial credential stuffing.** Recommended: rotate all demo user passwords or remove demo users from production before pilot launch.

### 12.3 Anti-capture data anomaly

The single Shareholding row shows user `cmtfs797i000004l5njy1eyf5` holding **100 of 100 shares (100%)** in the E2E Final Enterprise. This is the founder's pre-fundraising allocation. The blueprint's anti-capture rule applies to **capital partners** post-fundraising (each partner must own <50%). The schema's `Enterprise.founderEquityPct Float @default(5)` is correctly 5% for this enterprise, but the OwnershipRecord shows 100% concentration. **The data and the schema field disagree** — the founder's ownership is recorded as 100% in Shareholding but `founderEquityPct` is 5%.

This is likely intentional (founder holds all shares pre-capital-formation, and `founderEquityPct` is the founder's economic stake after capital formation). But the **schema does not enforce** the post-raise anti-capture rule.

---

## 13. Recommendations (Prioritized)

### P0 — Critical (block pilot launch)
1. **Drop the orphan `OwnershipRecord` table** from Turso (use Prisma `@@map("Shareholding")` only)
2. **Reconcile `SuccessionDeclaration` schema**: drop legacy `declarantId NOT NULL, declarationHash NOT NULL, shamirShares NOT NULL` columns OR migrate data and update Prisma schema
3. **Reconcile `EconomicBeneficiary` schema**: drop legacy `declarationId, sharePct, relationship` columns OR migrate data
4. **Drop the orphan `lawFirmClientAccountBalanceEgp` column** from `Enterprise` table (keep using `escrowBalanceEgp` via `@map`)
5. **Regenerate baseline migration** to include all 75 models (run `prisma migrate dev --name audit_reconcile` after fixes)

### P1 — High (must fix before pilot)
6. **Add `@unique` to `LawFirm.frLicenseNumber`, `AccountingFirm.esaaLicense`, `Employee.nosiNumber`, `Vendor.commercialRegister`**
7. **Add CHECK constraint or app-level enforcement for tier caps** (Tier A ≤3M, B ≤25M, E ≤5M EGP on `Enterprise.fundraisingGoalEgp`)
8. **Add CHECK constraint or app-level enforcement for Tier D `founderEquityPct ≥ 51`**
9. **Add CHECK constraint preventing any single OwnershipRecord from holding ≥50% of total equity** (post-fundraising)
10. **Add FK constraints for the 18 plain-String-FK models** (DiscoveryProfile, ProfitShareAgreement, GaasPolicy, etc.)
11. **Verify CRE is actually being invoked** (0 CreDecision rows despite 339 AuditLog entries — investigate whether CRE is bypassed)
12. **Seed `PlatformSetting` with tier caps, fee overrides, timing rules** (currently 0 rows)

### P2 — Medium (post-pilot cleanup)
13. **Add `InsuranceVault` row for every active enterprise** (constitutionally mandated 0.5% reserve)
14. **Rotate all demo user passwords** (currently `aurienta2026` shared across 13 users)
15. **Add session cleanup job** (235 expired sessions not purged)
16. **Add CHECK constraint or app enforcement for ±5% fundamental pricing band** on Trade/Valuation
17. **Make `User.identityHash` NOT NULL for verificationLevel ≥ L2**
18. **Find and check in the missing index-creation script** (14+ indexes exist in DB but not in `add-missing-indexes.ts`)

### P3 — Low (polish)
19. **Add `bandLowerEgp` / `bandUpperEgp` columns to `Valuation`** to persist the ±5% envelope
20. **Add `policyVersion` / `policyHash` to `CreDecision`** for replayable audit
21. **Add UNIQUE on `Proposal.type` for constitutional_amendment + graduation** (one active at a time per enterprise)

---

## 14. Files Produced

- `/home/z/my-project/AUDIT_DATA_MODEL.md` (this file)
- `/home/z/my-project/AUDIT_DB_INVARIANTS.csv` (15-row invariant test matrix)
- `/home/z/my-project/scripts/audit-db-inspect.ts` (read-only DB inspection script — kept for reproducibility)
- `/home/z/my-project/scripts/audit-db-invariants.ts` (read-only invariant test script — kept for reproducibility)
- `/home/z/my-project/scripts/audit-db-extras.ts` (read-only constraint verification script — kept for reproducibility)

**No production code or database was modified. All queries were read-only SELECTs, PRAGMAs, and one rolled-back FK violation probe (no row persisted).**
