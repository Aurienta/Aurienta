# AURIENTA — Deliverable D: Requirements and Vision Alignment Matrix

**Mandate:** §2, §16-D
**Purpose:** Map every approved requirement to its actual implementation, test evidence, deviation, and resolution status.

---

## Alignment summary

| Requirement area | Approved vision | Implementation evidence | Verification | Result |
|---|---|---|---|---|
| Non-custodial enterprise formation | Vol 1 §1.2 | `Enterprise` model + `/dashboard/enterprise-profile` + `/api/enterprises` routes | Live HTTP 200, Prisma read confirmed | PASS |
| CRE constitutional engine | Vol 3 §3.x | `src/lib/aurienta/cre.ts` (55 policies, 97 KB) | Code review + `/api/cre/*` routes HTTP 200 | PASS (code) — functional test BLOCKED on AI keys |
| AI multi-provider consensus | Vol 4 §4.x | `src/lib/aurienta/ai-router.ts` (37 KB, 5 providers) | `/api/ai/router-status` HTTP 200; providers UNAUTHENTICATED in sandbox | PARTIAL — code complete, env BLOCKED |
| Argon2id password hashing | Vol 7 §7.2 | `src/lib/aurienta/password-v2.ts` (`@node-rs/argon2`) | Code review | PASS |
| WebAuthn/Passkeys | Vol 7 §7.5 | `src/lib/aurienta/passkey.ts` + `/api/auth/webauthn/*` routes | Code review + routes HTTP 200 | PASS (code) — functional test not executed |
| Account lockout | Vol 7 §7.6 | `src/lib/aurienta/account-lockout.ts` | Code review | PASS (code) |
| MFA gate | Vol 7 §7.7 | `src/app/dashboard/layout.tsx` MFA banner | Phase 1-A: gate works but uses soft banner not hard redirect for privileged roles | PARTIAL — soft banner is a P2 finding |
| ERP engine (13 modules) | Vol 8 §8.x | `src/lib/aurienta/erp.ts` (80 KB) + 21 API routes + 9 dashboard pages | Phase 1-A: all routes HTTP 200, real Prisma reads | PASS |
| 8 strategic economic models | Vol 9 §9.x | Takaful, Productive EGP, Supply Chain Finance, Cooperative, Constitutional Wages, Graduation Bond, Dividends, Trade Matching libs | Code review | PASS (code) — financial integrity PARTIAL (float-for-money P1-C) |
| CRCICA arbitration | Vol 10 §10.x | `src/lib/aurienta/crcica.ts` + `/api/cron/crcica-arbitration` | Phase 1-B: P0 auth bypass found + FIXED | PASS after fix |
| Diaspora corridor | Vol 11 §11.x | `src/lib/aurienta/diaspora-corridor.ts` + routes | Code review | PASS (code) |
| FRA regulator shadow mode | Vol 12 §12.4 | `/api/v1/regulatory/fra/dashboard` | Phase 1-B: P0 auth bypass found + FIXED | PASS after fix |
| Ed25519 signed decisions | Vol 14 §14.x | `src/lib/aurienta/cre.ts` `signVerdict()` | Code review | PASS (code) |
| Stage transitions | Vol 15 §15.1 | `/api/cron/stage-transition` | Phase 1-B: P0 auth bypass found + FIXED | PASS after fix |
| Field-level encryption | Vol 16 §16.x | `src/lib/aurienta/encryption.ts` (AES-256-GCM) | Phase 1-E: P0 hardcoded fallback found + FIXED | PASS after fix |
| KYC verification | Vol 6 §6.x | `/api/verification/kyc` + dashboard page | Phase 1-E: P0 self-elevation found + FIXED | PASS after fix (sandbox mock still flagged) |
| Constitution page | Vol 2 §2.x | `/dashboard/constitution` | Live HTTP 200 | PASS |
| 118 dashboard pages | (various) | `src/app/dashboard/**/page.tsx` | Phase 1-A: 30/30 probed HTTP 200, real Prisma data | PASS |
| 215 API endpoints | (various) | `src/app/api/**/route.ts` | Phase 1-B: 27/27 probed; 7 critical defects fixed | PASS after fixes |

## Unauthorized design deviations

| Dev ID | Description | Severity | Resolution |
|---|---|---|---|
| DEV-1 | 23 Prisma models exist in `schema.prisma` but not in `migrations/0_complete_init/migration.sql` (all 14 Erp* models + 9 strategic-economic models). Schema expanded silently without migration. | Critical | Documented; remediation requires authorized DBA action. |
| DEV-2 | 81 TSX files still use `text-gold`/`bg-gold`/`amber-*` Tailwind classes despite worklog claim of "100% indigo (0 amber/gold)". | Low | Documented; theme cleanup pass required. |
| DEV-3 | `platform-health/route.ts` hardcodes `"models": 56` and `"56 models, 109+ indexes."` strings — actual counts are 99 models and 182 indexes. | Medium | Documented; should be computed dynamically. |
| DEV-4 | `production-readiness.ts` self-audit module understates the mock surface (claims 1 TODO, actual 4; does not enumerate 5 P0/P1 mocks wired to live routes). | Medium | Documented; should be reconciled with actual scan results. |

## Missing required functionality

| Missing ID | Description | Required by | Status |
|---|---|---|---|
| MISS-1 | Real KYC liveness SDK integration (TrOCR/facenet/DFDC) | Vol 6 §6.x | Currently sandbox mock — explicitly flagged in code comment |
| MISS-2 | Real government API integrations (GAFI/NOSI/ETA) | Vol 12 §12.x | Currently return hardcoded `verified:true` — P0 mock surface |
| MISS-3 | Real bank verification API (EVE) | Vol 9 §9.x | Currently `mockBankApiLookup` fabricates transactions |
| MISS-4 | Real ERP provider integrations (NetSuite/Odoo/SAP) | Vol 8 §8.x | `syncModule` always returns success without actually syncing |
| MISS-5 | Real milestone AI confidence scoring | Vol 9 §9.x | Currently `eveConfidence = Math.random()` |
| MISS-6 | Real proposal AI risk scoring | Vol 9 §9.x | Currently `aiRisk = Math.random()` |
| MISS-7 | Real PIN verification for vault access | Vol 16 §16.x | Currently `verifyPin` always returns true |

All 7 missing items are **documented in source code as `SANDBOX MOCK` or `TODO`** — they are not unauthorized deviations, they are unimplemented production integrations. The mandate requires these be either implemented or explicitly gated behind `NODE_ENV !== 'production'` with documentation.
