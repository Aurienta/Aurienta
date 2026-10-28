# AURIENTA — Implementation Remediation Plan
## Ordered Corrections and Acceptance Criteria
**Status:** AWAITING APPROVAL — Do NOT implement until explicitly approved.

---

## Stage A — Critical Security + Data Integrity (P0)
**Priority:** Immediate (before any real capital/PII)
**Estimated effort:** 3-5 days

| # | Finding | Correction | Acceptance Test |
|---|---------|-------------|-----------------|
| A1 | AUD-001: Argon2id not wired | Switch `/api/auth` + `/api/auth/register` to `verifyPasswordV2` + `hashPasswordV2` | Login with scrypt hash → verify passes + upgrades to argon2id |
| A2 | AUD-002: Account lockout not wired | Wire `checkLockout`/`recordFailedAttempt`/`resetLockout` into `/api/auth` POST | 7 bad attempts → HTTP 423 + Retry-After |
| A3 | AUD-003: MFA commented out | Implement MFA enrollment flow + uncomment gate in `dashboard/layout.tsx` | Manager login without MFA → redirected to enrollment |
| A4 | AUD-006: Next.js RCE | `bun update next --latest` (≥16.3.8) | Next.js version ≥ 16.3.8 |
| A5 | AUD-007: Turso token leaked | Remove token from `scripts/audit-db-*.ts`; use `process.env.TURSO_AUTH_TOKEN` | grep for token in src/ → 0 results |
| A6 | AUD-008: /api/ready misleading | Fix to actually ping AI providers (like brain-status) | /api/ready reports ai_providers: 0/5 when providers fail |
| A7 | AUD-005: HSM dead code | Wire HSM module OR document software-key signing as accepted risk with sign-off | CRE signatures verifiable against published public key |
| A8 | AUD-004: AI providers fail | Fix API keys + model IDs (llama-3.3-70b-versatile → correct ID) + add credits | /api/ai/explain returns real AI response |

---

## Stage B — Foundational Architecture, Data Model, Integration
**Priority:** High (1-2 weeks)
**Estimated effort:** 5-7 days

| # | Finding | Correction | Acceptance Test |
|---|---------|-------------|-----------------|
| B1 | AUD-009: /api/vault no membership check | Add `user.memberships.includes(enterpriseId)` check | Capital partner A → POST to enterprise B vault → 403 |
| B2 | AUD-010: 9 components bypass CSRF | Replace all plain `fetch()` with `csrfFetch()` in 9 components | grep 'fetch(' for POST/PATCH in components → 0 |
| B3 | AUD-019: requireRole() accepts primaryIntent | Fix to check `memberships[].role` instead of `primaryIntent` | User with 0 memberships fails requireRole |
| B4 | AUD-020: Role changes don't revoke sessions | Add `revokeAllSessions(userId)` in `/api/admin/users/[id]/role` | Role change → all sessions revoked |
| B5 | AUD-023: SuccessionDeclaration schema drift | Fix column: make `declarantId` nullable or align with Prisma | SuccessionDeclaration insert succeeds |
| B6 | AUD-013: CRE Decision ledger empty | Add `CreDecision.create()` in each `enforce*` function | After CRE call → CreDecision row exists |
| B7 | AUD-027: Migration baseline missing 24 models | Create proper migration baseline for all 75 models | `prisma migrate deploy` → 75 tables |
| B8 | AUD-015: Inngest sandbox-stubbed | Install `@inngest/core` + wire event senders OR document cron-only approach | Inngest event → workflow executes |
| B9 | AUD-028: Unauthenticated endpoints | Add `getCurrentUser()` + membership to `/api/enterprises/[id]/health` + `/api/circuit-breaker/[enterpriseId]` | Unauthenticated → 401 |
| B10 | AUD-030: Rate limiter broken in serverless | Use Upstash Redis for persistent rate limiting | 12 rapid requests → 429 |
| B11 | AUD-031: 77 routes missing rate limiter | Add rate limiter to all state-changing routes | All POST/PATCH/DELETE have rate limiter |

---

## Stage C — Missing/Broken Core Functionality + Workflows
**Priority:** High (1-2 weeks)
**Estimated effort:** 5-7 days

| # | Finding | Correction | Acceptance Test |
|---|---------|-------------|-----------------|
| C1 | AUD-011: Capital formation loop broken | Wire `/api/reservations/[id]/confirm` to UI button | Reservation → confirm → ownership record + vault contribution |
| C2 | AUD-012: Expense form field mismatch | Fix form to send `vendorName` + `receiptCid` | Expense submission preserves vendor name |
| C3 | AUD-022: 30 unreachable endpoints | Wire each lifecycle endpoint to its UI button | Each lifecycle endpoint has a UI caller |
| C4 | AUD-016: IPFS pinning mocked | Implement Pinata/Infura pinning | curl `ipfs://{cid}` → content resolves |
| C5 | AUD-017: FX Oracle mocked | Implement real HTTP fetchers for CBE/ECB/Chainlink/Binance | FX rate matches CBE published rate |
| C6 | AUD-018: Webhook no idempotency | Add `reference` uniqueness check + idempotency key | Duplicate webhook → single ledger event |
| C7 | AUD-014: InsuranceVault empty | Wire 0.5% vault contribution on capital formation | After capital formation → InsuranceVault row exists |
| C8 | AUD-024: Tier caps not enforced | Add CRE enforcement on capital formation | Tier A raising >3M → CRE denies |
| C9 | AUD-025: Anti-capture not enforced | Add CRE enforcement on ownership changes | Ownership >50% → CRE denies |
| C10 | AUD-026: ±5% pricing band not enforced | Add CRE enforcement on all trade submissions | Trade at >5% deviation → CRE denies |

---

## Stage D — Secondary Functions, Dashboards, Reports
**Priority:** Medium (2-3 weeks)
**Estimated effort:** 3-5 days

| # | Finding | Correction | Acceptance Test |
|---|---------|-------------|-----------------|
| D1 | AUD-036: 4 amber/gold theme violations | Replace amber with indigo/rose in AREI, Discovery, Zeitgeist | VLM: no amber/gold in any page |
| D2 | AUD-038: 4 orphan pages | Add succession-declaration to NAV | All pages in NAV or documented |
| D3 | AUD-040: No custom 404 | Create branded 404 page | /nonexistent → branded 404 |
| D4 | AUD-034: Dead dependencies | Remove next-auth/next-intl/otplib | bun install → no unused deps |
| D5 | AUD-035: Permissive CSP | Restrict connect-src to known domains | CSP connect-src lists only known domains |
| D6 | AUD-032: PII in logs | Redact email (hash) + IP (last octet) | Logs contain no plaintext email/IP |
| D7 | AUD-033: Webhook no replay protection | Add timestamp + nonce verification | Replayed webhook → rejected |
| D8 | AUD-029: Permissive CORS | Restrict to same-origin | CORS from foreign origin → blocked |

---

## Stage E — UI/UX, Responsive, Accessibility
**Priority:** Medium (2-3 weeks)
**Estimated effort:** 2-3 days

| # | Finding | Correction | Acceptance Test |
|---|---------|-------------|-----------------|
| E1 | AUD-037: 5 mobile UI issues | Fix FAB positioning + touch target sizes | VLM mobile score ≥ 90 for all pages |
| E2 | AUD-021: Demo password in client JS | Gate behind NEXT_PUBLIC_ALLOW_DEMO_SIGNIN + remove from bundle | grep aurienta2026 in client bundle → 0 |
| E3 | AUD-039: Duplicate icons | Assign unique icons to each nav item | 0 duplicate icon names in NAV |
| E4 | AUD-048: FAB touch targets <44px | Increase icon sizes to ≥44px | All touch targets ≥44px |
| E5 | AUD-049: Long-hash horizontal scroll | Add word-break: break-all or truncate | No horizontal scroll on mobile 375px |

---

## Stage F — Final Regression, Integration, Security, Production-Readiness
**Priority:** Final (3-4 weeks)
**Estimated effort:** 5-7 days

| # | Finding | Correction | Acceptance Test |
|---|---------|-------------|-----------------|
| F1 | AUD-041: No E2E tests | Write Playwright E2E for top 10 workflows | E2E tests pass in CI |
| F2 | AUD-041: No integration tests | Write integration tests for API contracts | Integration tests pass in CI |
| F3 | AUD-041: No component tests | Write component tests for dashboard | Component tests pass in CI |
| F4 | AUD-045: CI workflow typo | Fix `branches: ain]` → `branches: [main]` | CI triggers on main push |
| F5 | AUD-045: CI masks audit failures | Remove `|| true` from `bun audit` | CI fails on dependency vulnerability |
| F6 | AUD-043: 6 routes lack audit() | Add `audit()` to all state-changing routes | All POST/PATCH/DELETE call audit() |
| F7 | AUD-044: ESLint rule disabled | Re-enable `react/no-danger` | ESLint enforces react/no-danger |
| F8 | AUD-042: Health endpoints leak | Return generic ok without details | /api/health → {status: ok} only |

---

## Dependency Order
```
Stage A (security) → Stage B (architecture) → Stage C (functionality) → Stage D (secondary) → Stage E (UI/UX) → Stage F (regression)
```
Stages A and B are prerequisites for C. Stage C is prerequisite for D. D and E can run in parallel. F is final.

## Total Estimated Effort: 24-34 days

**AWAITING APPROVAL — Do NOT implement until explicitly approved.**
