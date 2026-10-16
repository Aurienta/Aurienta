# AURIENTA — Phase 11 Security / Privacy / Dependency Review

**Audit date:** 2026-10-16
**Agent:** general-purpose (forensic, READ-ONLY)
**Scope:** Source code under `/home/z/my-project/src/`, `/home/z/my-project/prisma/`, `/home/z/my-project/scripts/`, `/home/z/my-project/.github/`, plus production endpoints at `https://aurienta.vercel.app`.
**Method:** Static source review + read-only production probes (curl). No code or data was modified.
**Cross-reference:** Builds on Phase 8 (Auth/Permissions) and Phase 7 (Data Model) findings.

---

## Executive Summary

The AURIENTA codebase shows a thoughtful, layered security architecture — sessions persisted in the DB with revocation + rotation, CSRF middleware with same-origin + double-submit fallback, AES-256-GCM PII field encryption, Ed25519 webhook signatures, structured JSON logging, withErrorHandler wrapper that suppresses stack traces, audit logging on most state-changing routes, and CI/CD with gitleaks + CodeQL.

**However, the security posture is materially weakened by 5 categories of issue**:

1. **Dead-code password hardening** — `password-v2.ts` (Argon2id, OWASP-recommended) exists but is never imported; the production auth path uses `password.ts` (scrypt N=16384, **8× below OWASP's 64 MiB minimum**).
2. **A leaked Turso production DB token** (read-write scope, valid until ~2026-08-10) is embedded in three local audit scripts (`scripts/audit-db-*.ts`). Although NOT committed to git (verified via `git ls-files`), the file lives on disk in plaintext and any process or backup that captures the workspace exfiltrates prod-DB write access.
3. **CSRF middleware intentionally excludes `/dashboard/*`** — relying entirely on the client-side `csrfFetch()` helper. **13 components** (incl. all 5 admin pages) use plain `fetch()` for state-changing requests, leaving them with zero CSRF protection.
4. **Next.js 16.3.5 is vulnerable to a CRITICAL remote code execution** in `next/og` `ImageResponse` (GHSA-vcvr-r3jv-pc5j). Fixed in 16.3.8. `next` is a direct dependency + transitive via `next-auth` (which itself is unused dead code).
5. **61 npm audit advisories** (1 critical, 38 high, 19 moderate, 3 low) across direct + transitive dependencies.

**Overall security verdict: NOT production-ready for institutional capital handling** — must remediate the 7 CRITICAL/HIGH items below before any real capital or PII flows through the system.

---

## Findings Index

| ID | Severity | Title | File/Endpoint |
|----|----------|-------|---------------|
| SEC-001 | **CRITICAL** | Next.js 16.3.5 RCE in `next/og` ImageResponse | `package.json` (next ^16.3.5) |
| SEC-002 | **CRITICAL** | Leaked Turso production DB token (read-write) in audit scripts | `scripts/audit-db-inspect.ts`, `audit-db-invariants.ts`, `audit-db-extras.ts` |
| SEC-003 | **CRITICAL** | Password sign-in uses scrypt (N=16384, ~16 MiB), not the wired Argon2id module | `src/app/api/auth/route.ts:22`, `src/lib/aurienta/password.ts:8` |
| SEC-004 | HIGH | Demo password `aurienta2026` hard-coded in client JS bundle, valid on production | `src/components/auth/demo-user-picker.tsx:5`, `src/components/auth/signin-form.tsx` |
| SEC-005 | HIGH | `/api/vault` POST/GET has no enterprise-membership check (Phase 8) | `src/app/api/vault/route.ts` |
| SEC-006 | HIGH | `/dashboard/*` excluded from CSRF middleware; 13 components use plain `fetch()` for POST/PATCH/DELETE | `src/middleware.ts:120`, 13 component files (listed below) |
| SEC-007 | HIGH | `/api/metrics` exposes platform telemetry without authentication | `src/app/api/metrics/route.ts` |
| SEC-008 | HIGH | `requireRole()` accepts `user.primaryIntent` as substitute for `memberships[].role` (Phase 8) | `src/lib/aurienta/auth.ts:90` |
| SEC-009 | HIGH | Role changes do NOT revoke existing sessions — up to 7-day stale access (Phase 8) | `src/app/api/admin/users/[id]/role/route.ts` |
| SEC-010 | HIGH | `bun audit --level high \|\| true` in CI — vulnerabilities don't fail the build | `.github/workflows/ci.yml` |
| SEC-011 | HIGH | `flatted`, `minimatch`, `brace-expansion`, `picomatch` advisories chain back to ESLint dev deps — DoS/prototype-pollution at lint time | devDependencies |
| SEC-012 | HIGH | `mysql2` <=3.23.0 (transitive via prisma) — Auth Plugin downgrade leaks plaintext credentials | `node_modules/mysql2@3.15.3` |
| SEC-013 | HIGH | `lodash` 4.17.x prototype-pollution + code injection via `_.template` (transitive via `recharts`) | runtime dep |
| SEC-014 | HIGH | `sharp` <0.35.5 — librsvg CVE-2026-96889 (direct + via Next.js) | `package.json` (sharp ^0.35.4) |
| SEC-015 | MEDIUM | `/api/enterprises/[id]/health` and `/api/circuit-breaker/[id]` are unauthenticated (Phase 8) | `src/app/api/enterprises/[id]/health/route.ts`, `src/app/api/circuit-breaker/[enterpriseId]/route.ts` |
| SEC-016 | MEDIUM | `/api/evidence` GET exposes evidence metadata with `Access-Control-Allow-Origin: *` (cross-tenant) | `src/app/api/evidence/route.ts:177` |
| SEC-017 | MEDIUM | In-memory rate-limit buckets are per-instance — broken in Vercel serverless (Phase 8) | `src/lib/aurienta/rate-limit.ts:11` |
| SEC-018 | MEDIUM | 77 state-changing routes have no rate limiter (only 38 of 115 are covered) | see coverage table below |
| SEC-019 | MEDIUM | PII (email + IP) logged via `logger.info` in auth failure paths | `src/app/api/auth/route.ts:125,180`; `src/app/api/auth/register/route.ts:140` |
| SEC-020 | MEDIUM | Webhook signature verification has no replay-protection (no nonce / timestamp-window check) | `src/app/api/v1/webhook/payment/route.ts:67` |
| SEC-021 | MEDIUM | Dead dependencies: `next-auth` (brings vulnerable `next`), `otplib` (text-only), `next-intl` — bloats attack surface | `package.json` |
| SEC-022 | MEDIUM | Permissive `connect-src 'self' https: wss:` in CSP — any HTTPS endpoint can be called from the browser | `next.config.ts:45` |
| SEC-023 | MEDIUM | Account lockout module exists but is NEVER called by `/api/auth` (Phase 8) | `src/app/api/auth/route.ts` (no `checkLockout` call) |
| SEC-024 | LOW | `/api/health`, `/api/ready`, `/api/platform-health` leak deployment topology (Turso URL, Neon URL, AI provider count) | various |
| SEC-025 | LOW | 6 state-changing routes lack `audit()` calls (enterprises/[id]/profile, risk-disclosure, employees, ai/mentor-matching, ai/evidence-verification, ai/salary-engine) | see audit-trail coverage |
| SEC-026 | LOW | `react/no-danger` ESLint rule is NOT enabled; 2 `dangerouslySetInnerHTML` usages are safe today but unguarded | `src/components/ui/chart.tsx:83`, `src/app/layout.tsx:122` |
| SEC-027 | LOW | No `Secure` flag on `aurienta_csrf` cookie in development (production sets it) | `src/middleware.ts:25` |
| SEC-028 | LOW | CI workflow has typo `branches: ain]` (missing opening bracket) | `.github/workflows/ci.yml:8,11` |
| SEC-029 | LOW | Dev-only `DEV_FALLBACK_SECRET = "dev-cron-secret"` is hard-coded (acceptable in dev only) | `src/app/api/cron/reservation-expiry/route.ts:5`, `src/app/api/cron/proposal-expiry/route.ts:5` |

**Totals: 3 CRITICAL, 11 HIGH, 11 MEDIUM, 4 LOW = 29 findings**

---

## 1. Exposed Credentials

### SEC-001 (CRITICAL) — Next.js RCE in `next/og`
- `package.json` declares `"next": "^16.3.5"` and `bun.lock` pins installed version to **16.3.5**.
- The advisory **GHSA-vcvr-r3jv-pc5j** (Next.js: Remote Code Execution in `next/og` `ImageResponse`) affects `next >= 16.0.0 < 16.3.8`. The platform uses `next/og` indirectly through `opengraph-image` and metadata routes (Next.js auto-discovers these).
- **Remediation:** bump `next` to `^16.3.8` (or latest 16.x). Also bump `eslint-config-next` to match.

### SEC-002 (CRITICAL) — Leaked Turso production DB token (read-write scope)
- **Location:** `scripts/audit-db-inspect.ts`, `scripts/audit-db-invariants.ts`, `scripts/audit-db-extras.ts` (all created by Phase 7 audit).
- The token is a base64-URL EdDSA JWT: `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnci...`.
- Decoded payload:
  ```json
  {"a":"rw","iat":1786323925,"id":"019fe932-e201-7360-ade5-12658d76e292","kid":"2SFn1AfURu5LQykLdsGw...","rid":"ec37b272-09f2-48e7-b1f1-0dee161367d1"}
  ```
  - `"a":"rw"` → read-write scope.
  - `iat: 1786323925` → 2026-08-10 01:05 UTC. Turso tokens by default do NOT expire for years.
- The token grants `libsql://aurienta-fortleem.aws-us-east-1.turso.io` read-write access — the production database.
- **Mitigating factor:** `git ls-files scripts/` confirms these files are NOT committed to git — they exist only on the sandbox local filesystem. But any backup, screenshot, or workspace export captures the token.
- **Remediation:** (1) rotate the Turso auth token immediately in the Turso dashboard; (2) replace the hardcoded token in the 3 audit scripts with `process.env.TURSO_AUTH_TOKEN` and load from `.env`; (3) add `scripts/audit-db-*.ts` to `.gitignore` to prevent accidental commits; (4) verify in `git log --all -p scripts/` that no historical commit ever contained the token.

### SEC-004 (HIGH) — Demo password hard-coded in client bundle
- `src/components/auth/demo-user-picker.tsx:5`:
  ```ts
  const DEMO_PASSWORD = "aurienta2026";
  ```
- `src/components/auth/signin-form.tsx:13`:
  ```ts
  form.setValue("password", password ?? "aurienta2026", { shouldValidate: true });
  ```
- Both files are client components (`"use client"`), so the password is shipped in the public JS bundle and visible to anyone who downloads `/_next/static/chunks/*.js`.
- Production sign-in for `layla@streetbites.eg`, `ahmed@ecopack.eg`, `sarah@investor.eg`, `mohamed@smartfarm.eg`, `khalil@holding.eg` was confirmed working with `aurienta2026` in Phase 8.
- **Remediation:** gate the demo-user-picker UI behind `process.env.NEXT_PUBLIC_ALLOW_DEMO_SIGNIN === "true"` (and refuse the password on the server when the flag is off). Force-reset all 5 demo accounts with random 32-byte passwords before any production data is loaded.

---

## 2. Authentication Review

### SEC-003 (CRITICAL) — Argon2id module is dead code; scrypt (N=16384, ~16 MiB) is what runs in production

**Source review:**

`src/app/api/auth/route.ts:22`:
```ts
import { verifyPassword, isPlaintextHash } from "@/lib/aurienta/password";
```
Line 170:
```ts
const passwordOk = password ? verifyPassword(password, user.passwordHash) : false;
```

`src/lib/aurienta/password.ts:8`:
```ts
const N = 16384; // CPU/memory cost — ~64 MiB.
```

> **Note the misleading comment:** scrypt with N=16384, r=8, p=1 actually allocates `N * r * 128 bytes = 16384 × 8 × 128 = 16,777,216 bytes = 16 MiB` — NOT 64 MiB as the comment claims. The OWASP minimum for scrypt is N=2^15 (32768) → 32 MiB, with N=2^16/2^17 recommended for new deployments. The current value is **half the OWASP scrypt minimum** and **8× below the Argon2id m=19456 KiB** that the dead `password-v2.ts` already specifies.

`src/lib/aurienta/password-v2.ts` (Argon2id, OWASP-recommended):
```ts
const ARGON2_OPTIONS = {
  memoryCost: 19456, // 19 MiB — OWASP recommended minimum
  timeCost: 2,
  parallelism: 1,
};
export async function hashPasswordV2(plain: string): Promise<string> { ... }
export async function verifyPasswordV2(plain, stored): Promise<{valid, needsUpgrade}> { ... }
```

**Verification that v2 is dead code:**
```bash
$ rg -l "verifyPasswordV2|hashPasswordV2" src/ --type ts
src/lib/aurienta/password-v2.ts   # only the file itself references its exports
```

`/api/auth/register/route.ts` also imports `hashPassword` (scrypt) from `password.ts`, not `hashPasswordV2`.

**Remediation:**
1. Swap `/api/auth/route.ts` line 22 import → `verifyPasswordV2` from `password-v2.ts`.
2. Swap `/api/auth/register/route.ts` → `hashPasswordV2`.
3. On the next successful login of any user with a `scrypt$` hash, transparently re-hash with Argon2id and persist (`password-v2.ts` already returns `needsUpgrade: true` for scrypt hashes).
4. Delete `src/lib/aurienta/password.ts` after migration is complete.

### SEC-008 (HIGH) — `requireRole()` accepts `primaryIntent` as substitute for `memberships[].role`

`src/lib/aurienta/auth.ts:84-94`:
```ts
export async function requireRole(...roles: string[]): Promise<...> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  const hasRole = user.memberships.some((m) => roles.includes(m.role));
  if (!hasRole && !roles.includes(user.primaryIntent ?? "")) {
    throw new Error(`Forbidden: requires one of ${roles.join(", ")}`);
  }
  return user;
}
```

**Problem:** `user.primaryIntent` is a self-declared string set at registration time (`/api/auth/register/route.ts` accepts it from the request body). A freshly registered user with `primaryIntent="aurienta_rep"` passes the `requireRole("aurienta_rep")` check on `/api/admin/*` without any admin action.

**Remediation:** remove the `|| !roles.includes(user.primaryIntent ?? "")` branch; require an actual `EnterpriseMember` row with the role.

### SEC-009 (HIGH) — Role changes do NOT revoke existing sessions

Phase 8 already documented this. A role-elevated or role-revoked user retains the prior session until natural expiry (7 days). `revokeAllSessions(userId)` exists in `auth.ts:141` but is never called by `/api/admin/users/[id]/role`.

**Remediation:** call `revokeAllSessions(userId)` after every successful role change.

### SEC-023 (MEDIUM) — Account lockout module is dead code on the password path

`src/lib/aurienta/account-lockout.ts` exists (Phase 8 confirmed), with `checkLockout`, `recordFailedAttempt`, `resetLockout`. Phase 8 verified on production that **7 consecutive bad-password attempts against `sarah@investor.eg` returned 401 every time and never returned 423 Locked**. The module is imported only by `/api/auth/passkey/authenticate/finish/route.ts` (to clear lockout on passkey success).

**Remediation:** call `checkLockout(email)` early in `/api/auth` and `recordFailedAttempt(email)` on every wrong-password denial, `resetLockout(email)` on success.

---

## 3. Authorization / Cross-Tenant Data Leakage

### SEC-005 (HIGH) — `/api/vault` POST/GET has no enterprise-membership check

`src/app/api/vault/route.ts` (POST handler, lines 87+):
```ts
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) { return 401; }
  // ← no membership check on enterpriseId
  const vault = await db.insuranceVault.upsert({
    where: { enterpriseId },
    ...increment currentBalanceEgp by amountEgp...
  });
  await appendLedgerEvent(tx, { enterpriseId, eventType: "vault_contribution", ... });
});
```

Any authenticated user can:
- POST a vault contribution to ANY enterprise (with a real hash-chained ledger event), inflating its anti-fragility reserve.
- GET any enterprise's vault balance + totalContributedEgp + totalLoanedEgp + totalRepaidEgp.

**Remediation:** add `user.memberships.some(m => m.enterpriseId === enterpriseId)` (or `requireRole("aurienta_rep")`) before the DB write.

### SEC-015 (MEDIUM) — Unauthenticated enterprise-status endpoints

- `GET /api/enterprises/[id]/health` — returns health rating for any enterprise by ID (Phase 8).
- `GET /api/circuit-breaker/[enterpriseId]` — returns halt status (verified: `curl https://aurienta.vercel.app/api/circuit-breaker/cmr98gulx000ao5xp0x5tzndp` → `{"enterpriseId":"...","halted":false}`).

**Remediation:** require at least `getCurrentUser()` (authenticated partner). Health rating + circuit-breaker state are enterprise-private operational signals.

### SEC-016 (MEDIUM) — `/api/evidence` GET exposes cross-tenant evidence metadata with `Access-Control-Allow-Origin: *`

`src/app/api/evidence/route.ts:141-183` (GET handler):
- No authentication required.
- Returns evidence records for ALL enterprises with `filename`, `mimeType`, `sizeBytes`, `description`, `cid`, `enterpriseName`, `enterpriseSlug`, `enterpriseTier`.
- Response carries `Access-Control-Allow-Origin: *` (any web origin can read).

Phase 6 noted that POST `/api/evidence` accepts metadata only (filename/mimeType/sizeBytes) — no actual file bytes are stored. So the leak is metadata only, not document content. But filenames + descriptions may be commercially sensitive.

**Remediation:** restrict to authenticated partners; tighten CORS to a known allow-list (or drop it entirely — same-origin is sufficient for the dashboard).

---

## 4. Injection Vulnerabilities

**Result: NO injection vulnerabilities found.**

- Searched for `queryRawUnsafe`, `executeRawUnsafe`, `$queryRaw`, `$executeRaw` — **zero matches** in `src/`.
- All DB access goes through Prisma Client (parameterized queries).
- `src/lib/aurienta/neon.ts:30` accepts a raw `query: string` parameter for an `analyticsQuery()` helper, but the actual execution path is stubbed (`// await sql\`SELECT 1\`` is commented out) — sandbox-only.
- No `eval()` or `new Function()` calls found in API routes.

---

## 5. XSS

**Result: NO exploitable XSS found.** Two `dangerouslySetInnerHTML` usages are safe:

1. `src/components/ui/chart.tsx:83` — injects CSS theme strings (`THEMES` constant). No user input.
2. `src/app/layout.tsx:122` — injects JSON-LD structured data via `JSON.stringify({...})`. Static schema.org metadata, no user input.

**Caveat (SEC-026):** the ESLint `react/no-danger` rule is NOT enabled. If a future developer adds a `dangerouslySetInnerHTML` with user input, lint won't catch it.

**Remediation:** add `"react/no-danger": "warn"` (or `"error"`) to `eslint.config.mjs` `rules` block.

---

## 6. CSRF

### SEC-006 (HIGH) — `/dashboard/*` excluded from CSRF middleware; 13 components use plain `fetch()` for state-changing requests

`src/middleware.ts:120`:
```ts
matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|api/cron|api/oracle/consensus|dashboard|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2)$).*)"],
```

The `dashboard` exclusion means: **any POST/PATCH/PUT/DELETE issued from a `/dashboard/*` page is NOT validated by middleware**. CSRF protection for these requests depends ENTIRELY on the calling component using `csrfFetch()` (which sets `X-CSRF-Token`) instead of native `fetch()`.

**Components using plain `fetch()` for state-changing requests from `/dashboard/*`:**

| Component | Method | Endpoint |
|-----------|--------|----------|
| `src/app/dashboard/admin/settings/settings-console.tsx` | PATCH | `/api/admin/settings` |
| `src/app/dashboard/admin/users/[id]/user-admin.tsx` | PATCH ×2, POST ×3 | `/api/admin/users/[id]/role`, `/api/admin/users/[id]/suspend`, `/api/admin/users/[id]/passkey`, `/api/admin/users/[id]/reset-mfa`, `/api/admin/users/[id]/sessions` |
| `src/app/dashboard/admin/enterprises/recompute-readiness-button.tsx` | PATCH | `/api/admin/enterprises/[id]/recompute-readiness` |
| `src/app/dashboard/admin/enterprises/enterprise-freeze-button.tsx` | POST | `/api/admin/enterprises/[id]/freeze` |
| `src/components/dashboard/oracle-mirror/oracle-mirror-sync-button.tsx` | POST | `/api/ledger/sync` |
| `src/components/dashboard/roadmap/oracle-client.tsx` | POST | `/api/oracle/consensus` |
| `src/components/dashboard/copilot/chat-interface.tsx` | POST | `/api/copilot` |
| `src/components/dashboard/share-button.tsx` | POST | `/api/ai/share-message` |
| `src/components/dashboard/capital2/join-syndicate-dialog.tsx` | POST | `/api/syndicates/[id]/join` |
| `src/components/dashboard/capital2/form-syndicate-dialog.tsx` | POST | `/api/syndicates` |
| `src/components/dashboard/engagement/partner-crm-client.tsx` | POST | `/api/ai/partner-insights` |
| `src/components/dashboard/engagement/updates-feed.tsx` | POST | `/api/enterprise-updates` |

**Attack vector:** A malicious third-party page (`https://attacker.example`) can craft a `<form method="POST" action="https://aurienta.vercel.app/api/admin/users/<victim>/role">` with hidden fields, submit it via JS, and the browser will send the user's `aurienta_session` cookie (SameSite=Lax permits this for top-level navigations). Because the request comes from a cross-site form post and the dashboard-exclusion means middleware doesn't validate Origin/CSRF token, the POST reaches the handler with the victim's session attached.

**Mitigating factor:** `SameSite=Lax` blocks the cookie on cross-site fetch/XHR POSTs, but DOES send it on top-level `<form>` POSTs (and `<a>` navigations). For non-GET state changes, this is still an exposure: a victim who clicks a malicious "Click here for $5" button can have their admin role reassigned.

**Remediation (priority order):**
1. Remove `dashboard` from the middleware exclusion list (best fix — middleware then validates Origin for ALL state-changing requests).
2. Replace every `fetch(` call above with `csrfFetch(` (low-effort fix that secures each call individually).
3. Add an ESLint rule banning `fetch(` in `src/components/dashboard/**` and `src/app/dashboard/**` — enforce `csrfFetch` instead.

### SEC-007 (HIGH) — `/api/metrics` exposes platform telemetry without authentication

`src/app/api/metrics/route.ts`:
```ts
export async function GET() {
  // NO auth check
  const [userCount, enterpriseCount, ledgerCount, sessionCount] = await Promise.all([
    db.user.count(),
    db.enterprise.count(),
    db.ledgerEvent.count(),
    db.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
  ]);
  // Returns Prometheus-format metrics
}
```

Verified on production: `curl https://aurienta.vercel.app/api/metrics` → HTTP 200 with body:
```
aurenta_users_total 13
aurenta_enterprises_total 1
aurenta_active_sessions_total 32
...
```

**Remediation:** require `aurienta_rep` role, OR restrict by IP allow-list (Vercel's `VERCEL_IP`), OR move metrics to a separate authenticated `/api/admin/metrics` route.

---

## 7. File Uploads

**Result: no actual file upload endpoints found.**

`/api/evidence` (POST) accepts metadata only — `{ enterpriseId, milestoneId, filename, mimeType, sizeBytes, description }` — validated by `evidenceSchema` (zod). The 250 MB size cap on `sizeBytes` is enforced at schema level, and the value is stored, not a file buffer. A mock CID is generated via `computeCid(JSON.stringify(body))`.

`req.formData()` is used only by `/api/auth` (POST) to parse native HTML form submissions (email + password) — not file uploads.

**Verdict:** no upload-attack surface exists today. If real file uploads are added later, enforce: (1) magic-byte signature check, (2) filename sanitization, (3) size cap at server-side, (4) virus scan, (5) isolate by content-type.

---

## 8. CORS Configuration

### SEC-022 (MEDIUM) — Permissive `connect-src` in CSP; permissive `Access-Control-Allow-Origin: *` on 13 API routes

**`next.config.ts:45`** CSP:
```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self' https: wss:;     ← allows ANY https:// endpoint
frame-ancestors 'self'
```

This is permissive — any HTTPS API endpoint can be called from the browser. Defensible for AI provider endpoints (OpenAI/Gemini/Groq), but allows a malicious script (if XSS ever happens) to exfiltrate to any HTTPS host.

**Routes setting `Access-Control-Allow-Origin: *`:**
- `/api/evidence` (GET, OPTIONS)
- `/api/evidence/[cid]` (GET, OPTIONS)
- `/api/v1/enterprise/[slug]/data` (OPTIONS)
- `/api/succession` (OPTIONS)
- `/api/succession/[id]/execute` (OPTIONS)
- `/api/succession/[id]/activate` (OPTIONS)
- `/api/verification` (OPTIONS)
- `/api/verification/[id]` (OPTIONS)
- `/api/standalone-succession` (OPTIONS)
- `/api/standalone-succession/[caseId]` (OPTIONS)
- `/api/diaspora-corridor` (OPTIONS)
- `/api/public/*` (GET — 5 routes, intentionally public)

The `/api/public/*` routes are by design public (radical-transparency endpoints); the others' permissive ACAO on OPTIONS preflight is fine because the actual GET/POST handlers don't echo the header (so the browser blocks reading the response cross-origin). But the preflight approval for POST on `/api/verification`, `/api/succession`, etc. means a cross-origin script can SEND a state-changing POST even if it can't read the response — combined with the dashboard CSRF gap (SEC-006), this enlarges the attack surface.

**Remediation:** (1) tighten CSP `connect-src` to specific AI provider hosts; (2) drop permissive ACAO from non-public routes.

---

## 9. Sensitive Information in Logs

### SEC-019 (MEDIUM) — PII (email + IP) in auth-failure logs

`src/app/api/auth/route.ts`:
```ts
:125  logger.info("auth failed: unknown email", { email, ip });
:180  logger.info("auth failed: bad password", { email, ip });
```

`src/app/api/auth/register/route.ts:140`:
```ts
logger.info("register success", { userId: newUser.id, email, ip });
```

The `logger` (src/lib/aurienta/logger.ts) writes JSON to stdout, intended for Loki/Datadog/CloudWatch ingestion. PII (email + IP) ends up in those logs, accessible to operators with log-reader access. Under PDPL (Egyptian law 151/2020) and GDPR, email + IP together constitute personal data; logging them in plaintext requires a lawful basis + retention limits.

**Remediation:** mask the email (`l***@investor.eg`) and truncate the IP (`192.168.x.x` or last octet only) in log fields, OR keep full values in an isolated audit-only log with restricted access.

---

## 10. Webhook Verification

### SEC-020 (MEDIUM) — Ed25519 signature is verified, but no replay protection

`src/app/api/v1/webhook/payment/route.ts` (reviewed in full):
- ✅ Reads raw body via `req.text()` — no JSON parsing before signature verification (correct — signature covers the wire bytes).
- ✅ Looks up law firm's public key from DB (`db.lawFirm.findUnique`).
- ✅ Returns 401 if signature fails + audit-logs `lawfirm.webhook.signature_failed`.
- ✅ Persists every received event in `LawFirmWebhookEvent` with `signatureValid: true`.
- ❌ No nonce check — the same signed payload can be replayed indefinitely.
- ❌ No timestamp-window check — `payload.timestamp` is read but never compared to server time.

`src/lib/aurienta/law-firm-webhook.ts:14-47` — signature verification itself is correct Ed25519 (via Node `crypto.verify(null, ...)`, SPKI prefix `302a300506032b6570032100`).

**Remediation:**
1. Add `if (Date.now() - Date.parse(payload.timestamp) > 5 * 60_000) return 401` (5-minute window).
2. Persist `payload.reference` (or a nonce) in `LawFirmWebhookEvent.reference` with a UNIQUE index; reject duplicates.

---

## 11. Rate-Limit Coverage

### SEC-017 (MEDIUM) — In-memory limiter is per-instance (broken in serverless)

`src/lib/aurienta/rate-limit.ts:11`:
```ts
const buckets = new Map<string, Bucket>();
```

Vercel serverless spins up new instances per cold-start; each gets its own empty Map. Phase 8 confirmed on production: 12 rapid POSTs to `/api/auth` from one IP → all returned 401, none returned 429.

**Remediation:** swap the in-memory Map for Redis (`@upstash/redis` or `@vercel/kv`).

### SEC-018 (MEDIUM) — 77 of 115 state-changing routes have no rate limiter

**Coverage analysis** (counted by `rg "POST\|PATCH\|PUT\|DELETE" route.ts` minus `rg "limiters\."`):
- Total state-changing routes: 115
- Routes with `limiters.*` call: 38 (33%)
- Routes WITHOUT `limiters.*`: 77 (67%)

Worst-offenders (sensitive routes missing rate limiting):
- `/api/vault` POST/GET (money-moving)
- `/api/auth/signout` POST (allows logout-DoS by CSRF)
- `/api/auth/passkey/{authenticate,register}/{start,finish}` (brute-force surface)
- `/api/enterprises/[id]/{profile,milestones,list,close-capital-formation}` PATCH/POST
- `/api/employees` POST
- `/api/verification` POST + `/api/verification/[id]` PATCH
- `/api/succession/[id]/{activate,execute}` POST
- `/api/soulbound/{revoke,verify}` POST
- `/api/whistleblower/[id]/resolve` POST (Phase 6 noted unreachable but exists)
- `/api/notifications/[id]/read` POST
- `/api/reality-sync` POST

**Remediation:** add the appropriate `limiters.*` call to each state-changing handler. The pre-configured limiters (signin, ai, copilot, orders, reservations, expenses, governance, whistleblower, appeals, diaspora, priorityAllocation) cover the main categories — extend as needed.

---

## 12. Error Messages / Stack Traces

**Result: SAFE.** The `withErrorHandler` wrapper (src/lib/aurienta/api-handler.ts) catches all errors and returns:
- Zod validation errors → 400 with first issue message only.
- HTTP errors (custom `statusCode`) → matching status + message.
- Prisma errors → 409/404/400/500 with generic message.
- Unknown errors → `{"error": "Internal server error"}` with status 500. **No stack trace leaked.**

The original error + stack IS logged to console (server-side only) via `console.error(\`[api] ${tag} failed:\`, error)`.

**Coverage:** 98 of 177 API routes (55%) use `withErrorHandler`. The other 79 routes handle errors manually — most return generic JSON errors, but a few may leak Prisma error messages. Phase 6 noted `parseBody` (zod-validation helper) is used by only 3 routes (`whistleblower`, `appeals`, `risk-disclosure`).

**Remediation:** wrap the remaining 79 routes with `withErrorHandler` for defense-in-depth.

---

## 13. Dependency Vulnerabilities (`bun audit`)

**Run:** `bun audit` (Bun v1.3.14)
**Result: 61 vulnerabilities — 1 critical, 38 high, 19 moderate, 3 low**

### Critical
| Package | Installed | Fixed in | Path | Advisory |
|---------|-----------|----------|------|----------|
| **next** | 16.3.5 | 16.3.8 | (direct + via next-auth + next-intl) | GHSA-vcvr-r3jv-pc5j — RCE in `next/og` ImageResponse |

### High (38 advisories, 11 unique packages)
| Package | Installed | Path | Worst advisory |
|---------|-----------|------|----------------|
| **next** | 16.3.5 | direct | (also GHSA-cjq9-62q9-8jv4 — SSRF in Image Optimization) |
| **sharp** | 0.35.4 | direct + via next | GHSA-wq5f-xc86-pv6w — librsvg CVE-2026-96889 |
| **mysql2** | 3.15.3 | transitive via prisma | GHSA-3f6p-5ww8-9rcr — Auth Plugin downgrade leaks plaintext credentials |
| **lodash** | 4.17.x | transitive via recharts | GHSA-r5fr-rjxr-66jc — Code injection via `_.template` |
| **lodash-es** | 4.17.x | transitive via @reactuses/core | (same as lodash) |
| **deepmerge-ts** | <8.0.0 | transitive via prisma/@prisma/config | GHSA-ggr8-5vv4-36mx — Stack exhaustion |
| **brace-expansion** | <1.1.17 | transitive via eslint typescript-eslint | GHSA-rgw5-rvv9-x895 — DoS |
| **braces** | <=3.0.3 | transitive via eslint-config-next | GHSA-vfj7-8cjw-p6xm — Stack-exhaustion DoS |
| **flatted** | <3.4.0 | transitive via eslint | GHSA-25h7-pfq9-p65f — Prototype Pollution |
| **minimatch** | <3.1.3 | transitive via eslint typescript-eslint | GHSA-23c5-xmqv-rm74 — ReDoS |
| **source-map-js** | <1.2.2 | transitive via next/postcss | GHSA-68fv-2mgg-jv7q — Event-loop DoS |
| **js-cookie** | <=3.0.5 | transitive via @reactuses/core | GHSA-qjx8-664m-686j — Prototype hijack |
| **fast-uri** | <3.1.6 | transitive via @hookform/resolvers ajv + prisma | 4× SSRF / host-confusion advisories |
| **picomatch** | <2.3.2 | transitive via next-intl/@parcel/watcher + eslint | GHSA-c2c7-rcm5-vvqj — ReDoS |
| **browserslist** | <=4.28.6 | transitive via eslint-config-next | 2× OOM advisories |

### Medium / Low
| Package | Path | Advisory count | Severity |
|---------|------|----------------|----------|
| @humanfs/node | eslint | 1 | moderate (symlink copy) |
| baseline-browser-mapping | next + eslint | 1 | moderate (DoS) |
| diff | @mdxeditor/editor | 1 | low (DoS parsePatch) |
| @babel/core | eslint-config-next | 1 | low (arbitrary file read via sourceMappingURL) |

### Dead dependencies (unnecessary attack surface)
| Package | Used in src/? | Notes |
|---------|--------------|-------|
| **next-auth** | NO (`rg -l "next-auth\|NextAuth" src/` returns 0) | Brings vulnerable transitive `next` dep |
| **otplib** | NO (only referenced in string literals in ai.ts + production-readiness.ts) | TOTP not actually wired |
| **next-intl** | NO (`rg -l "next-intl\|useTranslations" src/` returns 0) | i18n not used; pulls in `@parcel/watcher` + `picomatch` |
| **huggingface/inference** | likely yes (in AI router) | direct dep — check if actually called |
| **tweetnacl** | yes (signing.ts) | OK |

**Remediation (priority order):**
1. `bun update next --latest` to 16.3.8+ (eliminates the critical RCE + 6 high advisories).
2. `bun update sharp --latest` to 0.35.5+ (eliminates librsvg CVE).
3. `bun remove next-auth next-intl otplib` (removes 3 dead deps + their transitive vulns).
4. `bun update --latest` for everything else (or accept staged rollouts).
5. Replace the in-line `|| true` in `.github/workflows/ci.yml` with a hard fail on high+ advisories (see SEC-010).

---

## 14. Audit-Trail Coverage

### SEC-025 (LOW) — 6 state-changing routes lack `audit()` calls

| Route | Method | Why this matters |
|-------|--------|------------------|
| `/api/enterprises/[id]/profile` | PATCH | Enterprise profile fields updated — no audit trail for who changed what |
| `/api/risk-disclosure` | POST | Cooling-off disclosure created — not audited |
| `/api/employees` | POST | Employee record created — not audited |
| `/api/ai/mentor-matching` | POST | AI call (read-only), low impact |
| `/api/ai/evidence-verification` | POST | AI call (read-only), low impact |
| `/api/ai/salary-engine` | POST | AI call (read-only), low impact |

**Coverage summary:**
- Total state-changing routes: 115
- Routes with `audit()` call: 109 (95%)
- Routes without: 6 (5%)

This is **good coverage** — most state-changing operations are audited. The 3 AI routes (mentor-matching, evidence-verification, salary-engine) are read-only AI inference calls that don't change DB state; auditing them is optional. The 3 non-AI routes (`enterprises/[id]/profile`, `risk-disclosure`, `employees`) should add `audit()` calls.

**Note:** Even routes that don't call `audit()` may still append `LedgerEvent` rows (e.g., `risk-disclosure` calls `appendLedgerEvent`) — that's a different, immutable, hash-chained trail for financial events. `audit()` is for non-financial operational events (logins, role changes, KYC updates, CRE denials).

---

## 15. Prioritized Remediation

### P0 — Block any further production traffic until fixed
1. **SEC-001**: `bun update next --latest` (16.3.8+). Eliminates the critical RCE.
2. **SEC-002**: Rotate Turso auth token; remove hardcoded tokens from `scripts/audit-db-*.ts`; load from `process.env.TURSO_AUTH_TOKEN`.
3. **SEC-003**: Switch `/api/auth` + `/api/auth/register` from `verifyPassword` (scrypt) to `verifyPasswordV2` (Argon2id) + transparent upgrade-on-login.
4. **SEC-004**: Force-reset all 5 demo account passwords; gate the demo-user-picker UI behind `NEXT_PUBLIC_ALLOW_DEMO_SIGNIN`.
5. **SEC-006**: Remove `dashboard` from the middleware matcher exclusion OR replace every plain `fetch(` call in the 13 listed components with `csrfFetch(`.

### P1 — Fix before pilot deployments
6. **SEC-005**: Add enterprise-membership check to `/api/vault` POST + GET.
7. **SEC-007**: Add auth (or IP allow-list) to `/api/metrics`.
8. **SEC-008**: Remove `primaryIntent` branch from `requireRole()`.
9. **SEC-009**: Call `revokeAllSessions(userId)` after every role change.
10. **SEC-010**: Remove `|| true` from `bun audit` step in CI; fail builds on high+ advisories.
11. **SEC-014**: `bun update sharp --latest` (0.35.5+).
12. **SEC-017**: Swap in-memory rate-limit Map for Redis (`@upstash/redis`).
13. **SEC-018**: Add `limiters.*` calls to the 77 uncovered state-changing routes.
14. **SEC-021**: `bun remove next-auth next-intl otplib`.
15. **SEC-023**: Wire `account-lockout.ts` into `/api/auth` (checkLockout + recordFailedAttempt + resetLockout).

### P2 — Fix during pilot phase
16. **SEC-011/012/013**: Run `bun update --latest` for the dev-only chains (eslint, typescript-eslint, eslint-config-next) — eliminates brace-expansion / minimatch / flatted / picomatch / browserslist advisories.
17. **SEC-015**: Require authentication on `/api/enterprises/[id]/health` + `/api/circuit-breaker/[id]`.
18. **SEC-016**: Tighten CORS on `/api/evidence` GET (drop `Access-Control-Allow-Origin: *`).
19. **SEC-019**: Mask email + IP in auth-failure logs.
20. **SEC-020**: Add replay-protection (timestamp window + nonce UNIQUE) to webhook handler.
21. **SEC-022**: Tighten CSP `connect-src` to specific AI provider hosts.

### P3 — Hygiene
22. **SEC-024**: Restrict `/api/health`, `/api/ready`, `/api/platform-health` to authenticated callers OR return only operational status (no topology).
23. **SEC-025**: Add `audit()` calls to the 3 non-AI routes lacking them.
24. **SEC-026**: Enable ESLint `react/no-danger` rule.
25. **SEC-027**: Document dev-only behavior of CSRF cookie Secure flag.
26. **SEC-028**: Fix CI workflow typo `branches: ain]` → `branches: [main]`.
27. **SEC-029**: Document dev-only `DEV_FALLBACK_SECRET = "dev-cron-secret"`.

---

## Methodology

1. Read `worklog.md` to load prior Phase 7 + Phase 8 audit context (data-model drift, auth gaps).
2. Read every auth-related source file in full: `auth.ts`, `password.ts`, `password-v2.ts`, `csrf-client.ts`, `middleware.ts`, `rate-limit.ts`, `logger.ts`, `audit.ts`, `api-handler.ts`, `account-lockout.ts`, `law-firm-webhook.ts`.
3. Read auth API routes in full: `/api/auth/route.ts`, `/api/auth/register/route.ts`, `/api/auth/passkey/*`.
4. Grepped for `ghp_|vcp_|sk-|eyJhbGci|password.*=.*['"][a-zA-Z0-9]+|api[_-]?key.*=.*['"][a-zA-Z0-9]+` across `src/` — found the leaked Turso JWT in `scripts/audit-db-*.ts`.
5. Grepped for `dangerouslySetInnerHTML`, `queryRawUnsafe`, `executeRawUnsafe`, `$queryRaw`, `console.log.*password|token|secret`, `fetch(` in `src/components/` + `src/app/`.
6. Ran `bun audit` and decoded each advisory to its package path.
7. Confirmed production posture with `curl` against `https://aurienta.vercel.app`:
   - `/api/health` → 200
   - `/api/platform-health` → 200 (with deployment topology)
   - `/api/ready` → 200
   - `/api/metrics` → 200 (no auth — exposes user/session counts)
   - `/api/circuit-breaker/<enterpriseId>` → 200 (no auth)
   - `/api/public/stats` → 200 (intentional public)
   - `POST /api/auth` with `{email, password:""}` → 401 (demo sign-in correctly off in production)
8. Verified CI/CD configs (`.github/workflows/ci.yml`, `release.yml`, `dependabot.yml`).
9. **No code or data was modified.** All commands were read-only (curl, rg, cat, ls, bun audit, bun run lint, bun run build, bun test, npx tsc --noEmit).

---

## Files Created
- `/home/z/my-project/AUDIT_SECURITY.md` (this file)
- `/home/z/my-project/TEST_EXECUTION_REPORT.md` (Phase 12 report)

## Files Read (non-destructive)
- `src/lib/aurienta/{auth,password,password-v2,csrf-client,rate-limit,logger,audit,api-handler,env,law-firm-webhook,neon,production-readiness}.ts`
- `src/middleware.ts`, `next.config.ts`, `package.json`, `.env`, `.env.example`, `.github/workflows/{ci,release}.yml`, `.github/dependabot.yml`
- `src/app/api/auth/route.ts`, `src/app/api/auth/register/route.ts`
- `src/app/api/v1/webhook/payment/route.ts`
- `src/app/api/evidence/route.ts`
- `src/app/api/vault/route.ts` (first 100 lines)
- `src/app/api/verification/route.ts`
- `src/app/api/metrics/route.ts`
- `scripts/audit-db-inspect.ts`, `audit-db-invariants.ts`, `audit-db-extras.ts`
- `prisma/migrations/0_init/migration.sql`, `prisma/migrations/migration_lock.toml`
- All components under `src/components/dashboard/`, `src/components/auth/`, `src/app/dashboard/admin/` (via rg)

## Cross-References
- Phase 7 (AUDIT_DATA_MODEL.md) — schema drift, migration gaps, missing CHECK constraints
- Phase 8 (AUDIT_AUTH_PERMISSIONS.md) — RBAC matrix, lockout + rate-limit + MFA gaps
- Phase 6 (AUDIT_WIRING_SUMMARY.md) — wiring gaps + admin fetch() pattern
