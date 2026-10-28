# AURIENTA Repository Integrity Policy

**Version:** 1.0.0
**Effective Date:** 2026-08-08
**Authority:** Founder & Sole Owner — Mohamed Eltonsy
**Constitutional Hash (Root):** `0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A`

---

## 1. Purpose

This document defines the canonical repository integrity policy for the AURIENTA Constitutional Enterprise Infrastructure codebase. It establishes:

1. **What must never be removed** (essential artifacts)
2. **How the structure is hardened** (branch + tag strategy)
3. **How backups are maintained** (remote + local)
4. **How rollback to older git history is prevented** (protected refs)

This policy is binding on every agent, contributor, and operator that touches the repository.

---

## 2. Essential Artifacts — MUST NEVER BE REMOVED

The following artifacts constitute the constitutional core of the platform. Removing, renaming, or stubbing any of them is a **P0 integrity violation** and MUST be rejected in review.

### 2.1 Constitutional Runtime Engine (CRE)
- `src/lib/aurienta/cre.ts` — 916 lines, 25 exported functions
- Includes the 4 P1 enforcement functions: `enforceNosiRegistration`, `enforceNosiExpenseFreeze`, `enforceSalaryToEquity`, `enforceEquityLockUp`
- Includes the hash-chain ledger: `appendLedgerEvent`, `verifyLedgerChain`
- **Zero Custody** enforcement: `enforceZeroCustody`, `enforceFundFlow`, `enforceAccountantGate`

### 2.2 Brain AI
- `src/lib/aurienta/ai.ts` — 900-line system prompt with 8-level constitutional hierarchy
- `src/lib/aurienta/ai-router.ts` — 5-provider consensus (Gemini, OpenAI, Groq, HuggingFace, OpenRouter)
- **ZERO ZAI** — the `z-ai-web-dev-sdk` must never be re-introduced into the AI router or Brain AI

### 2.3 Constitutional Standards
- `src/lib/aurienta/terminology.ts` — 20 approved terms + forbidden patterns
- `src/lib/aurienta/constants.ts` — TIER_META (A–F), STAGE_META, ROLE_META, CONSTITUTIONAL_HASH
- `src/lib/aurienta/institutional-architecture.ts` — 3-entity structure + RACI

### 2.4 Sixteen Institutional Systems
| # | System | File | Volume |
|---|--------|------|--------|
| 1 | Institutional Governance v1.0 | `institutional-governance.ts` | 22 |
| 2 | Enterprise Risk/Security/Compliance | `enterprise-risk-security.ts` | 23 |
| 3 | AURIENTA Operating System (AOS) | `operating-system.ts` | 24 |
| 4 | Commercialization System (ACS) | `commercialization-system.ts` | 25 |
| 5 | Production Hardening (PH-ER) | `production-readiness.ts` | 26 |
| 6 | Pilot Execution (PE) | `pilot-execution.ts` | 27 |
| 7 | Global Launch Sequence (GLS) | `global-launch.ts` | 28 |
| 8 | Founder Office (FOCC) | `founder-office.ts` | 29 |
| 9 | Institutional Trust (ITDB) | `institutional-trust.ts` | 30 |
| 10 | Market Execution (MES) | `market-execution.ts` | 31 |
| 11 | Market Activation (MAS) | `market-activation.ts` | 32 |
| 12 | Customer Conversion (CPR) | `customer-conversion.ts` | 33 |
| 13 | Strategic Partners (SPRRE) | `strategic-partners.ts` | 34 |
| 14 | Execution War Room (FIEW) | `execution-war-room.ts` | 35 |
| 15 | First-25 Real Market Research | `first-25-research.ts` | 36 |
| 16 | Constitutional Audit | `constitutional-audit.ts` | 37 |

### 2.5 Data Layer
- `prisma/schema.prisma` — 51 models with constitutional `@map` terminology (7 models use `@map` to bridge forbidden legacy DB column names like `shares`/`Shareholding`/`escrowBalanceEgp` to constitutional terminology like `Equity Units`/`OwnershipRecord`)
- `db/` — SQLite database (gitignored, but schema is canonical)

### 2.6 Application Layer
- 74 API routes (`src/app/api/**/route.ts`)
- 93 pages (`src/app/**/page.tsx`)
- 187 components (`src/components/**/*.tsx`)

### 2.7 Founder Identity
- The platform MUST identify **Mohamed Eltonsy** as Founder & Sole Owner (100% ownership).
- Any reference to "Layla" as Founder is a **DEFECT**. "Layla Mostafa" is a demo Capital Partner — NOT the Founder.
- This is enforced in `ai.ts`, `execution-war-room.ts`, and `demo-user-picker.tsx`.

### 2.8 Blueprints
- `upload/AURIENTA text.txt` — original 953KB blueprint (gitignored, preserved locally)
- `download/AURIENTA_Blueprint_Modified.docx` — expanded modified blueprint (committed)

---

## 3. Protected References (Rollback Prevention)

### 3.1 Protected Tag
**`v1.0.0-constitutional-complete`** — annotated tag marking the constitutional-complete state.

- This tag is **IMMUTABLE**. It must never be deleted, moved, or overwritten.
- Rolling back the `main` branch below this tag is **FORBIDDEN**.
- If a regression is detected, the fix MUST be a forward commit on top of the current state, never a reset to an older commit.

### 3.2 Protected Branches
| Branch | Protection Level | Purpose |
|--------|------------------|---------|
| `main` | Protected | Production-ready constitutional code |
| `backup/pre-expansion-*` | Archive | Point-in-time backups before major changes |

### 3.3 Rollback Prevention Rules
1. **No `git reset --hard` to commits older than `v1.0.0-constitutional-complete`.**
2. **No `git revert` of commits that remove constitutional artifacts** (Section 2).
3. **No force-push to `main`** unless explicitly authorized by the Founder.
4. **No deletion of protected tags or backup branches.**
5. All regressions are fixed via **forward commits** with conventional commit messages.

### 3.4 GitHub Branch Protection (Recommended Settings)
Configure on GitHub (Settings → Branches → Branch protection rules):
- Branch name pattern: `main`
- ✓ Require pull request before merging
- ✓ Require approvals (minimum: 1 — the Founder)
- ✓ Require status checks to pass before merging (`bun run lint`)
- ✓ Require branches to be up to date before merging
- ✓ Do not allow bypassing the above settings
- ✓ Restrict who can push to matching branches (Founder only)

---

## 4. Backup Strategy

### 4.1 Remote Backups
- **Primary remote:** `https://github.com/Aurienta/Aurienta`
- **Backup branches:** `backup/pre-expansion-<timestamp>` pushed before every major change
- **Tags:** Every stable release is tagged (e.g., `v1.0.0-constitutional-complete`)

### 4.2 Local Backups
- `.backups/` directory (gitignored) holds point-in-time tar.gz archives
- Created before every major expansion

### 4.3 Backup Cadence
- Before any commit that adds/removes > 5 files
- Before any blueprint expansion
- Before any schema migration
- Weekly snapshot

---

## 5. Pre-Commit Verification Checklist

Before any commit to `main`, verify:

- [ ] `src/lib/aurienta/cre.ts` is intact (25 functions, 916+ lines)
- [ ] `src/lib/aurienta/ai.ts` is intact (8-level hierarchy, Founder = Mohamed Eltonsy)
- [ ] `src/lib/aurienta/ai-router.ts` has ZERO `z-ai-web-dev-sdk` imports
- [ ] All 16 institutional system files exist in `src/lib/aurienta/`
- [ ] `prisma/schema.prisma` has 51 models with `@map` constitutional names
- [ ] No "Layla as Founder" references
- [ ] No forbidden terminology in new code (`escrowBalanceEgp`, `sharePriceEgp`, `totalShares`, `Shareholding`, `shares` — except in `@map` annotations and audit reports)
- [ ] `bun run lint` passes

---

## 6. Integrity Verification Commands

Run these to verify repository integrity at any time:

```bash
# Essential files exist
for f in src/lib/aurienta/cre.ts src/lib/aurienta/ai.ts src/lib/aurienta/ai-router.ts \
         src/lib/aurienta/terminology.ts src/lib/aurienta/constants.ts; do
  [ -f "$f" ] && echo "OK  $f" || echo "MISSING  $f"
done

# CRE function count (must be >= 25)
grep -c "^export " src/lib/aurienta/cre.ts

# Zero ZAI in router
grep -c "z-ai-web-dev-sdk" src/lib/aurienta/ai-router.ts  # must be 0

# No Layla-as-Founder defects
grep -rn "Layla.*Founder" src/ | grep -v "NOT the Founder\|DEFECT\|demo"  # must be empty

# Stable tag exists
git tag -l | grep v1.0.0-constitutional-complete

# Model count (must be 51)
grep -c "^model " prisma/schema.prisma
```

---

## 7. Change Management

All changes to this policy must be:
1. Proposed in writing
2. Reviewed by the Founder
3. Approved in writing
4. Version-bumped (this document's header)

Unauthorized changes to this policy are void.

---

## 8. Certification

This policy is certified as binding on the AURIENTA repository as of the effective date above.

**Founder & Sole Owner:** Mohamed Eltonsy
**Ownership:** 100%
**Constitutional Hash:** `0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A`

*"Your capital, your work, your company — no speculation required."*
