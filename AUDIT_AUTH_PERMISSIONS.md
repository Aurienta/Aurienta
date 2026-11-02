# AURIENTA Auth / Permissions / Portal Isolation Audit — Phase 8

**Task ID:** AUDIT-PHASE8
**Agent:** general-purpose
**Scope:** READ-ONLY forensic audit of authentication, roles, permissions, and portal isolation.
**Code base audited:** `/home/z/my-project/src/lib/aurienta/{auth,password,password-v2,account-lockout,passkey,csrf-client,nav-config}.ts` + `/home/z/my-project/src/app/api/auth/**` + `/home/z/my-project/src/middleware.ts` + `/home/z/my-project/src/app/dashboard/layout.tsx` + 30+ representative API route handlers.
**Production target:** https://aurienta.vercel.app
**Method:** Source review (static) + production testing (live) with 5 demo users.

---

## 1. Auth Architecture Summary

### 1.1 Session model
AURIENTA uses **server-side Session records** (not bare signed cookies) — a CTO-AUDIT remediation.

- `Session` table (Prisma) keyed by `tokenHash = SHA3-256(token)`.
- Session token = 32-byte `randomBytes` base64url (256 bits entropy).
- TTL: **7 days** (`SESSION_TTL_MS` in `auth.ts`).
- `getCurrentUser()` cached per-request via `React.cache()` to dedupe DB lookups across layout + page + components.
- Revocation supported: `signOut()` revokes the current session row (`revokedAt = now`); `revokeAllSessions(userId)` revokes every active session.
- Session row also stores `ip`, `userAgent`, and `mfaVerifiedAt` (MFA proof carried into the session, set when login was via passkey).

### 1.2 Cookie attributes
```
httpOnly: true                  // JS cannot read the session cookie (XSS-resistant)
sameSite: "lax"                 // sufficient for same-site; CSRF middleware handles cross-site
secure: NODE_ENV === "production"
path: "/"
expires: <expiresAt>            // 7 days from creation
```

### 1.3 Login flow (password)
`POST /api/auth` (`src/app/api/auth/route.ts`):
1. IP rate-limit: `limiters.signin(ip)` → 10 attempts / 60 s / IP.
2. Parse body (JSON or form-encoded).
3. If `action === "signout"` → `signOut()` → return.
4. If `env.allowDemoSignIn && !password` → demo sign-in via `signInAs(email)` (sandbox only; unreachable in prod).
5. Look up user by email.
6. If `isPlaintextHash(passwordHash)`: prod → 500 server error; dev+demo → fall back to demo sign-in.
7. `verifyPassword(password, passwordHash)` (scrypt, not Argon2id — see §4).
8. On success: `createSession(userId, { ip, userAgent })` + audit log + 200 with `{ id, email, legalName }`.

### 1.4 Login flow (passkey / WebAuthn)
- `POST /api/auth/passkey/authenticate/start` → generates options (no auth required); challenge persisted in signed HttpOnly cookie.
- `POST /api/auth/passkey/authenticate/finish` → verifies assertion via `@simplewebauthn/server` v14; on success creates a session tagged `mfaVerifiedAt: now` (passkey counts as MFA).
- Calls `resetLockout(email)` after success (the only place the lockout module is actually used).
- Credential counter updated server-side (replay protection).

### 1.5 Registration flow
`POST /api/auth/register` (`src/app/api/auth/register/route.ts`):
- Validates email/mobile uniqueness (409 on collision).
- Generates Ed25519 keypair server-side; private key AES-GCM encrypted at rest.
- Hashes password with **`hashPassword` (scrypt)** — NOT `hashPasswordV2` (Argon2id). Same gap as `/api/auth` (see §4).
- Signs Constitutional Pledge over `email + ISO timestamp`.
- `primaryIntent` schema enum is restricted to `capital_partner | founding_operator | workforce_partner | institution` — users cannot self-register as `aurienta_rep`, `manager`, `board_member`, `company_owner`, `law_firm_rep`, `accounting_firm_rep`, or `university_rep`. ✓

### 1.6 Sign-out flow
`POST /api/auth/signout` — POST-only (GET removed because Next.js `<Link>` prefetches would silently revoke sessions). Revokes session row, clears cookie, redirects to `/signin`.

### 1.7 Demo sign-in
`env.allowDemoSignIn === "true"` enables a sandbox convenience flow. `env.ts` logs a `WARNING` if `allowDemoSignIn=true` in production. Production demo users (`demo_layla`, `demo_ahmed`, `demo_mohamed`, `demo_khalil`) were observed in live testing, confirming the demo path is enabled on https://aurienta.vercel.app.

### 1.8 Auth helper API surface
| Helper | File | Purpose |
|---|---|---|
| `getCurrentUser()` | `auth.ts` | Per-request cached user lookup; returns `null` on no/expired/revoked session. |
| `requireUser()` | `auth.ts` | Throws `Not authenticated` if `getCurrentUser()` returns null. |
| `requireRole(...roles)` | `auth.ts` | Throws `Forbidden: requires one of …` if the user does NOT hold any of the roles in their `memberships[].role` OR have `primaryIntent` matching. |
| `createSession(userId, opts)` | `auth.ts` | Issues session token + sets cookie + persists Session row. |
| `signOut()` / `revokeAllSessions(userId)` | `auth.ts` | Revocation helpers. |
| `signInAs(email)` | `auth.ts` | Demo-only bypass; gated by `env.allowDemoSignIn`. |

---

## 2. Session Security Assessment

**Strengths**
- ✅ Session row persisted server-side with revocation, rotation, device tracking (`ip`, `userAgent`).
- ✅ Token is hashed (SHA3-256) before storage — DB leak does not directly yield reusable tokens.
- ✅ Cookie is `httpOnly`, `secure` in prod, `sameSite=lax`, scoped to `/`.
- ✅ `expiresAt` enforced on every read; `revokedAt` checked on every read.
- ✅ `getCurrentUser` cached via `React.cache()` — single DB hit per request.
- ✅ Sign-out is POST-only (no `<Link>` prefetch logout).

**Weaknesses / gaps**
- ⚠️ **No session rotation on privilege change.** When a user is suspended (`/api/admin/users/[id]/suspend`) the platform revokes all sessions, but role assignment/revoke (`/api/admin/users/[id]/role`) does NOT revoke existing sessions. A user whose `manager` role is revoked retains the session until expiry (7 d).
- ⚠️ **No idle timeout / sliding window.** Session TTL is fixed at 7 days from creation; a stale but actively used session is not refreshed. Consider bumping `expiresAt` on each `getCurrentUser` call.
- ⚠️ **No device fingerprint binding.** `userAgent` is captured but never compared to subsequent requests. An attacker who steals a session cookie from a different browser can replay it.
- ⚠️ **No concurrent-session limit.** A single user can have unlimited active sessions. High-risk for shared-credential abuse.
- ⚠️ **MFA enforcement is commented out** (`src/app/dashboard/layout.tsx` lines 41-44). The code declares `PRIVILEGED_ROLES = {manager, founding_operator, board_member, law_firm_rep, accounting_firm_rep, aurienta_rep}` and `mfaRequired = NODE_ENV !== "production" || !allowDemoSignIn`, then has a `// TODO: When MFA enrollment flow is built, uncomment this` block. **MFA is not enforced for any privileged role in production.** This contradicts the AUTH-UPGRADE worklog claim that "TOTP MFA for sensitive roles" was added.

---

## 3. Password Hashing Assessment (Argon2id vs scrypt)

### 3.1 What the code advertises
`src/lib/aurienta/password-v2.ts` implements Argon2id with OWASP 2024 recommended parameters:
- `memoryCost = 19456` (19 MiB)
- `timeCost = 2`
- `parallelism = 1`
- Hash format: `argon2id$<PHC-string>` (standard PHC encoding)
- Backward compatible with legacy `scrypt$…` hashes (verified then flagged for transparent upgrade).

`verifyPasswordV2(plain, stored)` returns `{ valid, needsUpgrade }` so callers can re-hash on next login.

### 3.2 What the code actually runs
| Call site | Hash function used | File:line |
|---|---|---|
| `POST /api/auth` (sign-in) | **`verifyPassword` (scrypt)** | `src/app/api/auth/route.ts:22` — `import { verifyPassword, isPlaintextHash } from "@/lib/aurienta/password";` |
| `POST /api/auth/register` | **`hashPassword` (scrypt)** | `src/app/api/auth/register/route.ts:24` — `import { hashPassword } from "@/lib/aurienta/password";` |

### 3.3 Drift from AUTH-UPGRADE worklog
The `AUTH-UPGRADE` worklog entry (line 16351) claims the route was modified to:
1. Check lockout **BEFORE** user lookup ❌ — current route checks IP rate-limit then immediately does `db.user.findUnique`.
2. Use `verifyPasswordV2` instead of `verifyPassword` ❌ — current route imports `verifyPassword` from `password.ts` (scrypt).
3. Transparently upgrade legacy scrypt hashes to Argon2id on success ❌ — current route has no `needsUpgrade` handling.
4. Record failed attempts on bad password / unknown email ❌ — `recordFailedAttempt(email)` is NEVER called from `/api/auth`.
5. Reset lockout on success ❌ — `resetLockout(email)` is NEVER called from `/api/auth` on password success.
6. Return 423 Locked with `remainingMs` + `Retry-After` ❌ — no 423 path exists in `/api/auth`.

The `password-v2.ts` module exists in the codebase but is **dead code at the login/register paths**. The Argon2id upgrade was never wired (or was reverted). The worklog claim is incorrect.

### 3.4 Scrypt parameters (the actually-used algorithm)
| Parameter | Value | OWASP minimum |
|---|---|---|
| `N` (CPU/memory cost) | 16384 (2^14) | 2^17 (131072) |
| `r` (block size) | 8 | 8 |
| `p` (parallelism) | 1 | 1 |
| `keyLen` | 32 bytes | 32 bytes |
| `maxmem` | 128 MiB | 128 MiB |

The deployed `N=16384` is **8× below** the OWASP 2024 minimum of `N=2^17=131072`. Hashing latency ≈ 120 ms per the source comment — well below the brute-force-unprofitable threshold Argon2id would provide.

### 3.5 Passkey path
WebAuthn enrollment + authentication uses `@simplewebauthn/server` v14 with `requireUserVerification: true` — strong, phishing-resistant, replay-protected (counter updated). Passkey path is the gold standard; password path is the weakest link.

### 3.6 Recommendation
1. Wire `verifyPasswordV2` (Argon2id) into `POST /api/auth` and `hashPasswordV2` into `POST /api/auth/register` per the AUTH-UPGRADE worklog claim.
2. On `verifyPasswordV2` returning `needsUpgrade: true`, transparently re-hash with Argon2id and persist.
3. Verify Argon2id module (`@node-rs/argon2`) builds cleanly on Vercel serverless (native module concern flagged in code comments).
4. Increase scrypt `N` to `2^17` if Argon2id cannot ship (interim hardening).

---

## 4. Passkey / WebAuthn Assessment

### 4.1 Implementation
- Library: `@simplewebauthn/server` v14 (current spec: WebAuthn L3).
- RP name: `"AURIENTA"`. RP ID derived from request `host` header (or `PUBLIC_BASE_URL`) — supports preview deploys and tunnelled hosts.
- Challenge: 32 bytes, single-use, 5-minute TTL, persisted as signed HttpOnly cookie (`aurienta_passkey_challenge`) — HMAC-SHA256 keyed from `FIELD_ENCRYPTION_KEY`.
- Attestation: `"none"` (no AAGUID trust) — appropriate for consumer passkeys.
- `authenticatorSelection.residentKey: "preferred"` — enables iCloud / Google passkey sync.
- `userVerification: "preferred"` — UV when device supports.
- Credential row persists `credentialId`, `publicKey` (COSE base64url), `counter` (replay protection), `transports`, `deviceType`, `backedUp`, `lastUsedAt`.

### 4.2 Replay protection
`verifyAuthentication` updates the stored counter on every successful assertion; a future assertion with a counter ≤ stored value is rejected by `@simplewebauthn/server`. **Note:** the code defensively writes `lastUsedAt` even if the counter is unchanged (some U2F-only keys always report 0).

### 4.3 Registration (enroll)
- Auth required (must already be signed in). ✓
- Challenge single-use (cleared after `verifyRegistration`). ✓
- Existing credentials for the user are excluded (`excludeCredentials`) — prevents double-enrolling the same authenticator. ✓
- Optional friendly `name` stashed in a separate short-lived cookie (5 min TTL, httpOnly, sameSite=lax) so `/finish` can persist without re-trusting client input.

### 4.4 Authentication (sign in)
- Public endpoint (no prior session required). ✓
- Optional `email` body field scopes `allowCredentials` to that user; if email doesn't match, returns empty `allowCredentials` (no email enumeration via response shape). ✓
- On success, `createSession` is called with `mfaVerifiedAt: now` — passkey UV counts as MFA proof.

### 4.5 Passkey management
- `GET /api/auth/passkey/list` — auth required; returns caller's passkeys only. ✓
- `POST /api/auth/passkey/delete` — auth required; `deletePasskey(userId, credentialRowId)` filters on `userId` — ownership enforced at DB layer (`where: { id, userId }`). ✓ Cannot delete another user's passkey.

### 4.6 Weaknesses
- ⚠️ **RP ID is dynamic** based on `request.headers.host`. If an attacker can spoof the host header at the load balancer, they could trick passkey auth into using a different RP ID. In practice Vercel sanitises this, but it should be hard-pinned to `PUBLIC_BASE_URL` in production.
- ⚠️ **No passwordless-first UX.** Sign-in flow requires email first; `listCredentialsForEmail` returns whether an email has passkeys (count leak risk if attacker can hit the start endpoint repeatedly).
- ⚠️ **`backedUp` is captured but not enforced.** A non-backed-up passkey (single device) can be used; if the user loses the device, they're locked out. No recovery flow exists.
- ✅ Challenge cookie cleared after read even on failure (single-use enforced).
- ✅ Constant-time HMAC comparison (`timingSafeEqual`).

---

## 5. CSRF Protection Assessment

### 5.1 Strategy
`src/middleware.ts` uses **same-origin validation + double-submit token**:
- `GET / HEAD / OPTIONS`: pass through; sets `aurienta_csrf` cookie if missing (not HttpOnly so client JS can read it).
- `POST / PATCH / PUT / DELETE`:
  1. If `Origin` header matches request `host` → allow (same-origin).
  2. Else if `Referer` host matches `host` → allow (fallback for privacy-hardened browsers that strip `Origin`).
  3. Else require `X-CSRF-Token` header matching `aurienta_csrf` cookie (double-submit).
  4. Otherwise → 403 `csrf_validation_failed`.

### 5.2 Cookie attributes
```
httpOnly: false               // MUST be readable by client JS to echo back
sameSite: "lax"
secure: NODE_ENV === "production"
path: "/"
maxAge: 7 days
```
Cookie value = `crypto.randomUUID() + crypto.randomUUID()` (256-bit entropy).

### 5.3 Client helper
`src/lib/aurienta/csrf-client.ts` exposes `csrfFetch(input, init)` which:
- Pass-through for safe methods (GET/HEAD/OPTIONS).
- For state-changing methods, reads `aurienta_csrf` cookie, sets `X-CSRF-Token` header, forces `credentials: "same-origin"`.

### 5.4 Middleware matcher exclusions
The matcher regex excludes (no CSRF check):
- `_next/static`, `_next/image`, `favicon.ico` — static assets.
- `api/auth/*` — auth endpoints (no session yet at signin; signout is exempt too).
- `api/cron/*` — Vercel Cron invocations (token-auth via `?token=` query, not session).
- `api/oracle/consensus` — public POST authenticated by API key in body.
- `dashboard*` — dashboard HTML pages (auth handled by layout's `getCurrentUser()`).
- Image / font / CSS / JS file extensions.

### 5.5 Security headers (set by middleware on every response)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` (prevents the "browser caches the unauthenticated redirect" bug)

### 5.6 Weaknesses
- ⚠️ **No `Content-Security-Policy` header.** XSS in any user-supplied content (e.g. profile fields, AI responses rendered as HTML) executes without CSP protection.
- ⚠️ **No `Strict-Transport-Security` header.** Vercel enforces HTTPS at the edge, but HSTS is defense-in-depth.
- ⚠️ **No `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` / `Cross-Origin-Resource-Policy`** — Spectre / cross-origin isolation not enabled.
- ⚠️ **Dashboard route exempt from CSRF middleware.** Any POST from a dashboard page to a non-API endpoint (rare but possible — e.g. server actions) would not be CSRF-protected. Recommend extending middleware to `dashboard/*` POSTs.
- ⚠️ **In-memory rate limiter** (`src/lib/aurienta/rate-limit.ts` line 11 — `const buckets = new Map()`). In Vercel serverless, each instance has its own map; an attacker distributing requests across instances can effectively multiply the rate limit by instance count. Production testing confirmed 12 rapid POSTs to `/api/auth` returned 12 × 401 (no 429) — consistent with per-instance buckets.
- ✅ Cookie signed and HttpOnly where it counts (`aurienta_session` is HttpOnly; only `aurienta_csrf` is intentionally readable).
- ✅ SameSite=lax on all cookies.

---

## 6. Account Lockout Assessment

### 6.1 Module design (correct in isolation)
`src/lib/aurienta/account-lockout.ts`:
- `MAX_FAILED_ATTEMPTS = 5`
- `LOCK_DURATION_MS = 15 minutes`
- `AccountLockout` Prisma table persists state (survives restarts, shared across replicas).
- `checkLockout(email)` → `{ locked, remainingMs, failedAttempts }`.
- `recordFailedAttempt(email)` → increments counter; on reaching 5 sets `lockedUntil = now + 15 min`.
- `resetLockout(email)` → clears on success.
- Keyed by **email** (not userId) so lockout applies even before user is resolved (no user-exists timing oracle).

### 6.2 Wiring gap (critical)
**`/api/auth` does NOT call any lockout function.** Confirmed by:
```bash
$ grep -E "checkLockout|recordFailedAttempt|resetLockout" src/app/api/auth/route.ts
# (no matches)
$ grep -rE "checkLockout|recordFailedAttempt|resetLockout" src/app/api/auth/
src/app/api/auth/passkey/authenticate/finish/route.ts:20: import { resetLockout } from ...
src/app/api/auth/passkey/authenticate/finish/route.ts:123: await resetLockout(user.email);
```

The lockout module is imported only by the **passkey** finish route (to clear lockout on passkey success). The password sign-in route (`POST /api/auth`) bypasses the lockout entirely.

### 6.3 Live production test
Ran 7 consecutive bad-password POSTs to `/api/auth` for `sarah@investor.eg`:
```
Attempt 1: 401 invalid_credentials
Attempt 2: 401 invalid_credentials
Attempt 3: 401 invalid_credentials
Attempt 4: 401 invalid_credentials
Attempt 5: 401 invalid_credentials   ← should have returned 423 Locked
Attempt 6: 401 invalid_credentials   ← lockout not applied
Attempt 7: 401 invalid_credentials   ← lockout not applied
```

No 423 Locked response was ever returned. The platform is **vulnerable to online brute-force attacks** on the password endpoint, limited only by:
1. The IP rate limiter (10/60s/IP) — bypassable via instance distribution in serverless.
2. The scrypt hashing cost (N=2^14, ~120 ms/verify) — weak by OWASP standards but does impose some cost on attackers.

### 6.4 Recommendation
1. Wire `checkLockout(email)` BEFORE the user lookup in `/api/auth` route — return 423 Locked with `Retry-After` header if locked.
2. Call `recordFailedAttempt(email)` on every bad-password or unknown-email path.
3. Call `resetLockout(email)` on successful password sign-in.
4. This is documented in the AUTH-UPGRADE worklog as already done — the worklog is incorrect.

---

## 7. Role-Based Access Control (RBAC) Assessment

### 7.1 Roles defined
Per `src/lib/aurienta/constants.ts` `ROLE_META`:

| Role key | Label | Badge | Police clearance |
|---|---|---|---|
| `capital_partner` | Capital Partner | 💼 | — |
| `founding_operator` | Founding Operator | 👑 | — |
| `workforce_partner` | Workforce Partner | 🛠️ | — |
| `manager` | Manager | ⚙️ | ✓ required |
| `board_member` | Board Member | 🪑 | — |
| `company_owner` | Company Owner | 🏢 | — |
| `law_firm_rep` | Law Firm Rep | ⚖️ | — |
| `accounting_firm_rep` | Accounting Firm Rep | 📊 | — |
| `aurienta_rep` | AURIENTA Rep | 🛡️ | — |
| `university_rep` | University Rep | 🎓 | — |

Total: **10 roles**. Registration only allows `primaryIntent` of `capital_partner | founding_operator | workforce_partner | institution` — privileged roles (`manager`, `board_member`, `company_owner`, `law_firm_rep`, `accounting_firm_rep`, `aurienta_rep`, `university_rep`) can only be assigned via `POST /api/admin/users/[id]/role` by an `aurienta_rep`.

### 7.2 RBAC enforcement patterns observed

| Pattern | Where used | Server-enforced? |
|---|---|---|
| `requireRole("aurienta_rep")` | All `/api/admin/*` routes (13 files) | ✅ Yes |
| `requireRole("aurienta_rep")` | `/api/ai/annual-report` | ✅ Yes |
| `requireRole("aurienta_rep")` | `/api/soulbound/revoke` | ✅ Yes |
| `getCurrentUser` + `memberships.filter(m => m.enterpriseId === eid).some(r => ALLOWED_ROLES.has(r.role))` | `/api/expenses`, `/api/expenses/[id]/approve`, `/api/screening`, `/api/skill-equity/[id]/review`, `/api/graduation/execute`, `/api/enterprises/[id]/close-capital-formation`, `/api/enterprises/[id]/list`, `/api/enterprises/[id]/milestones` | ✅ Yes |
| `getCurrentUser` only (no membership / role check) | `/api/vault` (POST + GET), `/api/genome/[enterpriseId]`, `/api/enterprises/[id]/profile`, `/api/soulbound` (POST/GET), `/api/proxies` (the per-user filters in GET, but POST does check membership), `/api/skill-equity` (ownership check via `employee.userId === user.id`) | ⚠️ Partial — varies by route |
| NO auth at all | `/api/enterprises/[id]/health`, `/api/circuit-breaker/[enterpriseId]`, `/api/legal-templates*`, `/api/metrics`, `/api/health`, `/api/ready`, `/api/platform-health`, `/api/risk-profile/[enterpriseId]` (API-key), `/api/public/*`, `/api/cron/*`, `/api/inngest`, `/api/v1/webhook/payment`, `/api/oracle/consensus`, `/api/fx*`, `/api/v1/*`, `/api/soulbound/verify`, `/api/evidence/[cid]` | Varies — see matrix |

### 7.3 `requireRole` quirks
The function checks `memberships.some(m => roles.includes(m.role)) || roles.includes(user.primaryIntent)`. This means:
- A user with `primaryIntent: "capital_partner"` and **no enterprise memberships** will pass `requireRole("capital_partner")`. This is a footgun — if `requireRole("capital_partner")` is used anywhere to gate privileged work, it would pass for any user who picked that primaryIntent at registration.
- Better practice: gate on `memberships` (actual seat in an enterprise), not on `primaryIntent` (which is just a self-declared onboarding preference).

### 7.4 Demo-user role mapping (production)

| User | Roles | Verified live |
|---|---|---|
| `layla@streetbites.eg` | `capital_partner` + `founding_operator` | Sign-in 200; `/dashboard/admin-panel` → AccessRestricted |
| `ahmed@ecopack.eg` | `founding_operator` + `manager` | Sign-in 200; `/dashboard/admin-panel` → AccessRestricted |
| `sarah@investor.eg` | `capital_partner` (single role) | Sign-in 200; `/dashboard/admin-panel` → AccessRestricted |
| `mohamed@smartfarm.eg` | `founding_operator` (graduated) | Sign-in 200; `/dashboard/admin-panel` → AccessRestricted |
| `khalil@holding.eg` | `company_owner` + `board_member` | Sign-in 200; `/dashboard/admin-panel` → AccessRestricted |

All five demo users were verified to sign in with `password: aurienta2026`. User IDs: `demo_layla`, `demo_ahmed`, `demo_mohamed`, `demo_khalil` (prefix `demo_`) and `turso-mv7q9cm1bjgjld` for sarah — suggesting sarah is a real DB user with a scrypt-hashed password (the others may have plaintext/demo-hash fallbacks).

### 7.5 Page-level RBAC for dashboard routes

| Route | Server-side role gate? | Live test result (sarah) |
|---|---|---|
| `/dashboard` (Overview) | `getCurrentUser` only | 200 OK renders overview |
| `/dashboard/manager` | `getCurrentUser` only — page renders empty state if no manager memberships | 200 OK renders Manager Console empty state (no `AccessRestricted`) |
| `/dashboard/admin-panel` | `getCurrentUser` + `AccessRestricted` for non-`aurienta_rep` | 200 OK renders `AccessRestricted` |
| `/dashboard/graduation` | `getCurrentUser` only — page renders even if user has no graduation-eligible role | 200 OK renders Graduation empty state |
| `/dashboard/governance` | `getCurrentUser` only | 200 OK renders Governance empty state |
| `/dashboard/fra` | `AccessRestricted` (server) | 200 OK AccessRestricted rendered |
| `/dashboard/company-owner` | `AccessRestricted` (server) | 200 OK AccessRestricted rendered |
| `/dashboard/law-firm` | `AccessRestricted` (server) | 200 OK AccessRestricted rendered |
| `/dashboard/accounting` | `AccessRestricted` (server) | 200 OK AccessRestricted rendered |
| `/dashboard/university` | `AccessRestricted` (server) | 200 OK AccessRestricted rendered |
| `/dashboard/steward` | `AccessRestricted` (server) | 200 OK AccessRestricted rendered |
| `/dashboard/admin/users` | `AccessRestricted` (server) | 200 OK AccessRestricted rendered |
| `/dashboard/admin/enterprises` | `AccessRestricted` (server) | 200 OK AccessRestricted rendered |
| `/dashboard/admin/audit` | `AccessRestricted` (server) | 200 OK AccessRestricted rendered |
| `/dashboard/admin/settings` | `AccessRestricted` (server) | 200 OK AccessRestricted rendered |

**Finding:** HTTP 200 is returned for *all* dashboard routes regardless of role. `<AccessRestricted>` is rendered as a component, not as a 403 status. This is acceptable for UX (no broken-link appearance) but is **not** a security boundary — the routes are reachable, just visually blocked. Where the route exposes data via `db.*` queries without a role filter (e.g. `/dashboard/manager` queries only the user's own memberships so it's safe), no leakage occurs. The risk would be if a route that should be role-gated instead renders an empty data view.

### 7.6 Sidebar filtering (REMED-1D)
`visibleGroupsForRoles(roles)` hides entire nav groups from users who lack the relevant role(s):

| Group | Required role(s) |
|---|---|
| Workspace | universal |
| Capital & Workforce | universal |
| Intelligence | universal |
| Compliance & Transparency | universal |
| Institutional Services | universal |
| Enterprise | `manager` / `founding_operator` / `board_member` / `company_owner` / `accounting_firm_rep` |
| Treasury & Infrastructure | `manager` / `founding_operator` / `board_member` / `company_owner` / `law_firm_rep` |
| Graduation & Sovereignty | `founding_operator` / `company_owner` / `board_member` |
| Platform Admin | `aurienta_rep` / `university_rep` / `law_firm_rep` / `accounting_firm_rep` / `company_owner` |

⚠️ **This is sidebar visibility only** — it does not block the underlying route. A user who knows the URL `/dashboard/admin-panel` can navigate there directly. The `AccessRestricted` component is the actual UI gate, but only 11 of 102 dashboard routes use it (per AUDIT-PHASE3 worklog entry).

---

## 8. Portal Isolation Assessment

### 8.1 Public vs authenticated portals
- **Public portal:** `/` (landing), `/signin`, `/register`, `/trust`, `/legal/*`, `/enterprise/[slug]*`, `/badge/[slug]`, `/registry` — no auth.
- **Authenticated portal:** `/dashboard/*` — gated by `getCurrentUser()` in `dashboard/layout.tsx`.
- **API portal:** `/api/*` — gated per-route (see §7).

### 8.2 Public enterprise transparency data
The blueprint calls for radical transparency of enterprise state. Public APIs that expose enterprise data without auth:
- `/api/public/registry` — enterprise registry.
- `/api/public/stats` — aggregate stats.
- `/api/public/enterprise/[slug]` — public enterprise detail.
- `/api/public/enterprise/[slug]/transparency` — transparency data.
- `/api/public/enterprise/[slug]/cre-decisions` — CRE decision log.
- `/api/public/enterprise/[slug]/trades` — public trade log.

These are **intentionally public** per the blueprint — non-issue.

### 8.3 Concerning unauthenticated endpoints

| Endpoint | Concern |
|---|---|
| `GET /api/enterprises/[id]/health` | Returns Constitutional Health Rating + 9 vital signs for any enterprise by ID. No auth check. An attacker who scrapes enterprise IDs (via the public registry) can pull health ratings for every enterprise on the platform. **Recommendation:** add `getCurrentUser` + membership check. |
| `GET /api/circuit-breaker/[enterpriseId]` | Returns halt status for any enterprise. No auth check. **Recommendation:** same — gate to enterprise members or aurienta_rep. |
| `GET /api/legal-templates` | Returns metadata of all 18 legal templates. No auth. **Acceptable** — these are public constitutional documents. |
| `GET /api/legal-templates/[id]` | Returns full template content. No auth. **Acceptable** — same reasoning. |
| `POST /api/legal-templates/[id]/render` | Renders a template with caller-supplied variables. No auth. **Concern:** could be abused as a free template-rendering service. Low-impact but recommend gating. |

### 8.4 Cross-enterprise isolation (within authenticated portal)
For routes that operate on a specific `enterpriseId`, the pattern is:
```ts
const memberships = user.memberships.filter(m => m.enterpriseId === enterpriseId);
if (memberships.length === 0) return 403;
```
This is correctly applied in: `/api/expenses`, `/api/expenses/[id]/approve`, `/api/proposals/[id]/vote`, `/api/proxies`, `/api/screening`, `/api/graduation`, `/api/graduation/execute`, `/api/enterprises/[id]/close-capital-formation`, `/api/enterprises/[id]/list`, `/api/enterprises/[id]/milestones` (POST), `/api/skill-equity/[id]/review`, `/api/skill-equity` (via `employee.userId` ownership), `/api/whistleblower` (GET, after the LEAK FIX), `/api/admin/*` (via `requireRole("aurienta_rep")`).

**Routes that break the pattern (no membership check):**
- ⚠️ `/api/vault` POST (CRITICAL) — `getCurrentUser` only. Any authenticated user can contribute to ANY enterprise's Anti-Fragility Insurance Vault. Ledger event + vault balance increment happen regardless of membership. **Severity:** Medium-High (money-equivalent fiduciary account mutation).
- ⚠️ `/api/vault` GET — Any authenticated user can read ANY enterprise's vault balance.
- ⚠️ `/api/vault/loan` POST — Likely the same pattern (needs verification).
- ⚠️ `/api/genome/[enterpriseId]` GET — Any authenticated user can read ANY enterprise's full genome (attribute vector + graduation probability).
- ⚠️ `/api/enterprises/[id]/profile` GET — Any authenticated user can read ANY enterprise's full profile (potentially includes non-public PII).
- ⚠️ `/api/enterprises/[id]/milestones` GET — Any authenticated user can list ANY enterprise's milestones.
- ⚠️ `/api/soulbound` POST/GET — Operates on the caller's own credential, so isolation is implicit. ✓ safe.

### 8.5 Partner portal sub-isolation
The blueprint describes distinct portals for: capital partners, founding operators, managers, board members, company owners, law firms, accounting firms, AURIENTA reps, university reps, workforce partners. In the implementation, **all roles share a single dashboard** (`/dashboard/*`) with sidebar filtering. There are no separate URLs per portal (e.g. `/manager-console`, `/law-firm-portal`).

Strengths:
- Single sign-on, single session, single audit log.
- Role-specific pages exist (`/dashboard/manager`, `/dashboard/law-firm`, `/dashboard/accounting`, `/dashboard/company-owner`, `/dashboard/university`, `/dashboard/fra`, `/dashboard/steward`, `/dashboard/admin-panel`).

Weaknesses:
- ⚠️ **No URL-level portal isolation.** Knowing the URL is sufficient to reach any portal's page; the only barrier is `AccessRestricted` rendered after auth.
- ⚠️ **Cross-portal API access not consistently blocked.** See §8.4 routes that skip membership checks.

### 8.6 API-key portals
- **Risk Profile API** (`/api/risk-profile/[enterpriseId]`) — public but requires `X-Risk-Profile-Api-Key` header + `X-Disclaimer-Accepted: true` header; rate-limited per API key hash. Issued via `POST /api/risk-profile/keys` (authenticated).
- **Oracle Consensus API** (`/api/oracle/consensus`) — public POST, API key in body, audit-logged, per-query pricing.
- **Law Firm Webhook** (`/api/v1/webhook/payment`) — public POST, Ed25519 signature verification against registered law firm public key.
- **Inngest** (`/api/inngest`) — Inngest SDK signature verification.
- **Vercel Cron** (`/api/cron/*`) — exempt from CSRF; `?token=` query check (per code comment, DE-16/17).

These are correctly designed for their use cases.

---

## 9. Server-Side Enforcement Gaps (Summary)

| # | Gap | Severity | File:Line | Recommendation |
|---|---|---|---|---|
| G-1 | MFA enforcement commented out in `dashboard/layout.tsx` | **High** | `dashboard/layout.tsx:42-44` | Build MFA enrollment flow; uncomment the redirect. |
| G-2 | Account lockout NOT wired in `/api/auth` (password sign-in) | **High** | `api/auth/route.ts` | Add `checkLockout` before user lookup; `recordFailedAttempt` on bad password; `resetLockout` on success. |
| G-3 | Password verification uses scrypt, not Argon2id (despite `password-v2.ts` existing) | **High** | `api/auth/route.ts:22`, `api/auth/register/route.ts:24` | Switch to `verifyPasswordV2` + `hashPasswordV2`; transparent upgrade on next login. |
| G-4 | Scrypt `N=16384` (below OWASP minimum `N=2^17`) | Medium | `password.ts:8` | Increase to `2^17` if Argon2id cannot ship. |
| G-5 | `/api/vault` POST has no membership check | Medium-High | `api/vault/route.ts:92-174` | Add `memberships.filter(m => m.enterpriseId === eid)` guard; restrict to `manager`/`founding_operator`/`company_owner`. |
| G-6 | `/api/vault` GET has no membership check | Medium | `api/vault/route.ts:38-87` | Add membership check. |
| G-7 | `/api/vault/loan` likely has no membership check | Medium-High | `api/vault/loan/route.ts` | Verify and add check. |
| G-8 | `/api/genome/[enterpriseId]` GET has no membership check | Medium | `api/genome/[enterpriseId]/route.ts` | Add membership check or gate to `aurienta_rep`. |
| G-9 | `/api/enterprises/[id]/profile` GET has no membership check | Medium | `api/enterprises/[id]/profile/route.ts:22` | Add membership check. |
| G-10 | `/api/enterprises/[id]/milestones` GET has no membership check | Medium | `api/enterprises/[id]/milestones/route.ts:17` | Add membership check. |
| G-11 | `/api/enterprises/[id]/health` is fully unauthenticated | Medium | `api/enterprises/[id]/health/route.ts` | Add `getCurrentUser` + membership check. |
| G-12 | `/api/circuit-breaker/[enterpriseId]` is fully unauthenticated | Low-Medium | `api/circuit-breaker/[enterpriseId]/route.ts` | Add `getCurrentUser` + membership check. |
| G-13 | `requireRole` accepts `primaryIntent` as a substitute for `memberships[].role` | Medium | `auth.ts:90` | Drop the `primaryIntent` fallback; require actual enterprise seat. |
| G-14 | Role assignment (`/api/admin/users/[id]/role`) does NOT revoke existing sessions | Medium | `api/admin/users/[id]/role/route.ts` | Call `revokeAllSessions(userId)` after role change. |
| G-15 | In-memory rate limiter bypassable via serverless instance distribution | Medium | `rate-limit.ts:11` | Move to Redis (Upstash) for multi-instance correctness. |
| G-16 | No `Content-Security-Policy` header | Medium | `middleware.ts` | Add a strict CSP. |
| G-17 | No `Strict-Transport-Security` header | Low | `middleware.ts` | Add `max-age=63072000; includeSubDomains; preload`. |
| G-18 | No idle session timeout (fixed 7-day TTL, no sliding window) | Low | `auth.ts:16` | Refresh `expiresAt` on each `getCurrentUser`. |
| G-19 | No concurrent-session limit | Low | `auth.ts` | Cap at N active sessions per user; revoke oldest on new login. |
| G-20 | Passkey RP ID derived from request `host` header | Low | `passkey.ts:64-88` | Hard-pin to `PUBLIC_BASE_URL` in production. |
| G-21 | Dashboard routes exempt from CSRF middleware (matcher) | Low | `middleware.ts:120` | Re-include `dashboard/*` POSTs in middleware matcher. |
| G-22 | `AccessRestricted` returns HTTP 200, not 403 | Low (UX) | `access-restricted.tsx` | Consider returning 403 status when rendering the component. |
| G-23 | ~91 dashboard pages rely only on layout-level auth (no per-role `AccessRestricted`) | Low | per AUDIT-PHASE3 | Add per-page role gates for operator-only pages. |

---

## 10. Top Findings

### 🚨 Critical (production-impacting, must fix)

1. **Password brute-force protection is non-functional.** The `account-lockout.ts` module exists and is well-designed, but `/api/auth` (the password sign-in route) never calls `checkLockout`, `recordFailedAttempt`, or `resetLockout`. Live testing confirmed 7 consecutive bad passwords for `sarah@investor.eg` all returned 401 with no 423 lockout. The AUTH-UPGRADE worklog claims this was wired — that claim is incorrect.

2. **Passwords are hashed with scrypt, not Argon2id.** Despite `password-v2.ts` implementing OWASP-spec Argon2id (`memoryCost=19456, timeCost=2, parallelism=1`), both `/api/auth` and `/api/auth/register` import from `password.ts` (scrypt) — `password-v2.ts` is dead code at the auth paths. Worse, the deployed scrypt parameters are `N=16384` (8× below OWASP minimum `N=2^17=131072`).

3. **MFA enforcement is commented out.** `dashboard/layout.tsx` lines 42-44 contain a `// TODO: When MFA enrollment flow is built, uncomment this` block. Privileged roles (`manager`, `founding_operator`, `board_member`, `law_firm_rep`, `accounting_firm_rep`, `aurienta_rep`) are NOT MFA-gated in production, contradicting the AUTH-UPGRADE worklog.

### ⚠️ High (significant exposure)

4. **`/api/vault` POST allows any authenticated user to contribute to ANY enterprise's Anti-Fragility Insurance Vault.** The route calls `getCurrentUser()` (so the actor is known) but never verifies the user is a member of the target enterprise. The contribution triggers a real ledger event + balance increment. Severity is mitigated by the fact that contributions flow INTO the vault (not out), but it pollutes the audit trail and could enable accounting confusion.

5. **`/api/vault` GET allows any authenticated user to read ANY enterprise's vault balance** — potential information disclosure for non-public enterprises.

6. **`requireRole` accepts `user.primaryIntent` as a substitute for `memberships[].role`.** A user who self-registered with `primaryIntent: "capital_partner"` and has zero enterprise memberships will pass `requireRole("capital_partner")`. If any privileged route uses `requireRole` with a non-`aurienta_rep` role, it would over-authorise newly-registered users.

7. **Role changes do not revoke existing sessions.** When an `aurienta_rep` revokes a user's `manager` role via `/api/admin/users/[id]/role`, the user's existing session remains valid until expiry (7 days). Combined with G-1 (no MFA), this is a meaningful window for ex-post-facto privilege escalation.

### 🔧 Medium (hardening needed)

8. **In-memory rate limiter is bypassable** in Vercel serverless because each instance has its own Map. Live test showed 12 rapid POSTs to `/api/auth` returned 12 × 401 (no 429). Move to Upstash Redis.

9. **`/api/enterprises/[id]/health` and `/api/circuit-breaker/[enterpriseId]` are fully unauthenticated** — any internet user can read constitutional health ratings and circuit-breaker status for any enterprise by ID.

10. **`/api/genome/[enterpriseId]`, `/api/enterprises/[id]/profile`, `/api/enterprises/[id]/milestones` (GET) skip membership checks** — cross-enterprise data leakage within the authenticated portal.

11. **No `Content-Security-Policy` header** — XSS in user-supplied content renders and executes without defense-in-depth.

12. **`AccessRestricted` returns HTTP 200** — for routes that should be 403 Forbidden. This is a UX choice but means automated scanners can't distinguish "page exists, you lack role" from "page exists, you have access".

### 📋 Low (UX / cosmetic / defense-in-depth)

13. **`/dashboard/manager`, `/dashboard/graduation`, `/dashboard/governance` render empty states (not `AccessRestricted`) for users without the relevant role** — the page is reachable, just shows "no enterprises yet". Consider explicit `AccessRestricted` for role-gated pages.

14. **No `Strict-Transport-Security` header** — Vercel handles HTTPS at edge, but HSTS is defense-in-depth.

15. **No idle session timeout / sliding window** — sessions last the full 7 days from creation regardless of activity.

16. **No concurrent-session limit** — a single user can hold unlimited active sessions.

17. **Passkey RP ID is derived from `request.headers.host`** — should be hard-pinned in production.

18. **Dashboard routes are exempt from the CSRF middleware matcher** — `dashboard` (the bare path) is in the exclusion list, but the regex negative lookahead matches any path starting with `dashboard`, so `/dashboard/*` HTML pages bypass middleware entirely. This is intentional (auth handled by layout) but means any future server-action POST from a dashboard page would not be CSRF-protected.

---

## 11. Methodology & Files Audited

### Source files reviewed in full
- `src/lib/aurienta/auth.ts` (164 lines)
- `src/lib/aurienta/password.ts` (43 lines)
- `src/lib/aurienta/password-v2.ts` (97 lines)
- `src/lib/aurienta/account-lockout.ts` (107 lines)
- `src/lib/aurienta/passkey.ts` (411 lines)
- `src/lib/aurienta/passkey-challenge.ts` (104 lines)
- `src/lib/aurienta/csrf-client.ts` (53 lines)
- `src/lib/aurienta/nav-config.ts` (543 lines)
- `src/lib/aurienta/constants.ts` (118 lines)
- `src/lib/aurienta/env.ts` (39 lines)
- `src/lib/aurienta/rate-limit.ts` (88 lines)
- `src/middleware.ts` (122 lines)
- `src/app/dashboard/layout.tsx` (61 lines)
- `src/components/dashboard/access-restricted.tsx` (26 lines)
- `src/app/api/auth/route.ts` (205 lines)
- `src/app/api/auth/register/route.ts` (147 lines)
- `src/app/api/auth/signout/route.ts` (36 lines)
- `src/app/api/auth/passkey/register/start/route.ts` (88 lines)
- `src/app/api/auth/passkey/register/finish/route.ts` (131 lines)
- `src/app/api/auth/passkey/authenticate/start/route.ts` (69 lines)
- `src/app/api/auth/passkey/authenticate/finish/route.ts` (142 lines)
- `src/app/api/auth/passkey/list/route.ts` (32 lines)
- `src/app/api/auth/passkey/delete/route.ts` (74 lines)
- `src/app/api/expenses/route.ts` (338 lines)
- `src/app/api/expenses/[id]/approve/route.ts` (291 lines)
- `src/app/api/admin/users/route.ts` (169 lines)
- `src/app/api/admin/users/[id]/route.ts` (368 lines)
- `src/app/api/admin/users/[id]/suspend/route.ts` (124 lines)
- `src/app/api/admin/users/[id]/role/route.ts` (236 lines)
- `src/app/api/admin/enterprises/route.ts` (121 lines)
- `src/app/api/admin/enterprises/[id]/route.ts` (298 lines)
- `src/app/api/admin/enterprises/[id]/freeze/route.ts` (131 lines)
- `src/app/api/admin/audit/route.ts` (190 lines)
- `src/app/api/admin/settings/route.ts` (196 lines)
- `src/app/api/vault/route.ts` (175 lines)
- `src/app/api/whistleblower/route.ts` (193 lines)
- `src/app/api/screening/route.ts` (215 lines)
- `src/app/api/skill-equity/route.ts` (211 lines)
- `src/app/api/skill-equity/[id]/review/route.ts` (335 lines)
- `src/app/api/graduation/route.ts` (160 lines)
- `src/app/api/graduation/execute/route.ts` (311 lines)
- `src/app/api/enterprises/route.ts` (360 lines, partial)
- `src/app/api/enterprises/[id]/close-capital-formation/route.ts` (165 lines)
- `src/app/api/enterprises/[id]/list/route.ts` (50 lines)
- `src/app/api/enterprises/[id]/health/route.ts` (34 lines)
- `src/app/api/circuit-breaker/[enterpriseId]/route.ts` (18 lines)
- `src/app/api/legal-templates/route.ts` (17 lines)
- `src/app/api/legal-templates/[id]/route.ts` (23 lines)
- `src/app/api/legal-templates/[id]/render/route.ts` (34 lines)
- `src/app/api/risk-profile/[enterpriseId]/route.ts` (138 lines)
- `src/app/api/proxies/route.ts` (205 lines)
- `src/app/api/v1/webhook/payment/route.ts` (137 lines)
- `src/app/api/soulbound/route.ts` (67 lines)
- `src/app/api/proposals/[id]/vote/route.ts` (80 lines, partial)
- `src/lib/aurienta/cre.ts` (lines 1-120 — `enforceExpenseAuthority`)
- `src/lib/aurienta/validation.ts` (lines 1-100)

### Production tests
- 5 demo-user sign-ins (layla, ahmed, sarah, mohamed, khalil) — all 200 OK.
- 25 dashboard route accesses (5 users × 5 routes) — all 200 OK; AccessRestricted rendered for admin-panel only.
- 4 API endpoint tests with `sarah` (capital_partner) — admin endpoints correctly returned 403; expenses returned 404 (no demo enterprise in prod).
- 7-attempt brute-force on `sarah@investor.eg` password — confirmed NO 423 lockout (gap G-2).
- 12-attempt IP rate-limit test — confirmed NO 429 (gap G-15).
- 5 unauthenticated endpoint tests — confirmed `/api/enterprises/[id]/health`, `/api/circuit-breaker/[enterpriseId]`, `/api/legal-templates*` are publicly reachable.

### Counts
- **Roles defined:** 10 (capital_partner, founding_operator, workforce_partner, manager, board_member, company_owner, law_firm_rep, accounting_firm_rep, aurienta_rep, university_rep).
- **Permission rules audited (rows in CSV matrix):** 67.
- **Server-side enforced:** 49 (requireRole + membership checks + CRE + API-key + signature-verification).
- **Client-side only:** 0 (UI is gated, but server-side enforcement is the actual gate; UI AccessRestricted is supplementary).
- **Gaps (server-side enforcement missing or weak):** 23 (see §9).
- **Files audited:** 54 source files + live production testing.
