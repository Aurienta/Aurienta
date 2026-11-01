# DELIVERABLE 7 — SECURITY & PERFORMANCE REPORT

## A. SECURITY AUDIT

### A1. Authentication & session management — PASS
- Passwords: Argon2id (OWASP 19MiB/t=2/p=1) with transparent scrypt legacy upgrade on login. (password-v2.ts)
- Sessions: opaque 32-byte tokens, HttpOnly+SameSite=Lax+Secure cookies; DB stores only SHA3-256 hashes; revocation + expiry + "sign out everywhere"; per-request React.cache. Live-verified: 5/5 sign-ins, wrong-password 401, post-signout 401.
- Brute force: DB-backed per-email lockout (5 tries/15 min) + DB rate limits on auth flows (10/min/IP) + passkey ceremonies (15/min). Sign-in timing safe (same error for unknown user/wrong password).
- Passkeys: full WebAuthn (registration + auth ceremonies, sign-count clone detection, HMAC-signed challenge cookies 5-min TTL).
- MFA: hard gate (privileged roles without mfaVerifiedAt → forced to /dashboard/passkeys) + soft banner. Live-observed banner.

### A2. Authorization — PASS
- 13 requireRole routes (admin + sensitive ops) check real EnterpriseMember roles with aurienta_rep bypass.
- requireRole uses actual memberships (AUD-019 fixed previously — verified).
- Live-verified: member → 4 admin APIs = 403; hidden buttons are backed by server-side checks (probe proves API-level enforcement).
- 20 pages add AccessRestricted role gates beyond login.

### A3. Input validation & injection — PASS
- Zod on 87 routes + manual on 62; CSRF double-submit middleware on all state-changing requests (54×403 on unauthenticated POSTs proves enforcement).
- Prisma parameterized queries throughout — 0 raw SQL string interpolation (prior D-C register confirmed; unchanged).
- XSS: React escaping; no dangerouslySetInnerHTML in audited surfaces.
- SSRF: ERP test-connection fetches admin-configured URLs (rep-only + rate-limited now); AI router fetches fixed provider URLs only.

### A4. Secrets & configuration — PASS (with environment caveats)
- No secrets in code (SEC-002 scrubbed git history previously — re-verified: no tokens in `git log -p -S`).
- FIELD_ENCRYPTION_KEY: no hardcoded fallback (P0-3), lazy-throw; 19 env vars verified present on Vercel (encrypted-at-rest).
- CRON_SECRET: fail-closed (503 if unset) — 6 cron routes verified 401/503 unauthenticated.
- Turso JWT: valid, production DB reachable.
- Local sandbox: .env repeatedly reset by environment — mitigated with canonical-env self-healing wrapper (scripts/ops/dev-start.sh); canonical file is gitignored (verified).

### A5. Encryption & PII — PASS with 1 finding
- AES-256-GCM (`enc$v1$` format, tamper-detecting) on: nationalIdLast4, identitySecretEnc, totpSecretEnc, beneficiaryNationalId, beneficiary nationalIdLast4.
- Ed25519 signing: platform key (CRE tokens, ledger), per-user keypairs (pledges) — private keys encrypted at rest.
- **Finding S-1 (P2, open):** `Employee.nosiNumber` — intended encryption target, no encryptField call found at write sites. Action: decide encrypt-at-rest policy and patch write/read paths (data currently seeded values only).

### A6. Rate limiting & abuse — IMPROVED this cycle
- Before: 68/216 routes. After: +api-keys (10/min), +4 admin mutations (30/min), +erp-integration-test (10/min) → 74/216 including all credential-issuance, money-moving, AI, auth, and admin-mutation routes.
- Remaining gaps: read-only GETs (progressive hardening — G7).

### A7. Open endpoints — RESOLVED
- /api/ai/diagnose (provider config + HF account identity) → rep-only 403. Live-verified.
- /api/metrics (platform counts) → cron-token-or-rep 401. Live-verified.
- Reviewed-and-accepted open: health/ready/platform-health (ops), fx/consensus (public data), cre/policies (auditor transparency), legal-templates (public legal library), evidence list (no-PII metadata), public/* (constitutional API matching public pages).

### A8. Headers & transport
- middleware.ts: CSRF + same-origin, security headers, no-store on dynamic; HSTS/TLS at Vercel edge (production).

### A9. Prior security register status
All P0/P1 items from previous phases remain fixed (re-verified by probe): CRON_SECRET fail-closed ✓, KYC no-self-elevation ✓, no FEK fallback ✓, mock-gate production fail-safe ✓, Turso token not in repo ✓.

### Security findings summary
| ID | Sev | Finding | Status |
|---|---|---|---|
| S-1 | P2 | Employee.nosiNumber unencrypted | OPEN (G4 — policy decision) |
| S-2 | P3 | 142 GET routes without rate limits | PROGRESSIVE (G7) |
| S-3 | P3 | LawFirmWebhookEvent cascade | BLOCKED-B4a (migration approval) |
| — | P1/P2 | diagnose + metrics open | **FIXED this cycle** |
| — | P1 | admin/api-keys no rate limit | **FIXED this cycle** |
| 0 critical outstanding | | | |

## B. PERFORMANCE MEASUREMENTS

### B1. API latency (dev sandbox, webpack compile included — worst case)
p50 443ms · p90 1,207ms · p99 2,639ms · max 6,459ms. Compiled routes respond in 180–800ms.
Production reference (prior cycle, Vercel + Turso): DB RTT 238ms · health endpoint ~300ms · Groq AI 1,189ms.

### B2. Database
- Connection: Turso 1.1s cold / ~240ms warm RTT (geography: sandbox US → Turso us-east-1).
- 99 tables, 256 indexes; heavy models indexed (enterprise ×96 refs, user ×33).
- Parallel query batching in hot pages (Promise.all — trust page comment: 4 sequential → 1 RTT batch).
- 0 FK violations; clone integrity checks ran < 1s for 15 joins.

### B3. Frontend
- Landing page: loads clean, 0 console errors; sections lazy-render (Reveal pattern).
- Dashboard pages: 0 page errors on all 22 tested; server components stream data (no client waterfalls on core pages).
- Bundle: dev-mode only measured; production build optimization deferred until B1 (Vercel billing) restored — prior production deployment served HTTP 200 with acceptable TTFB.

### B4. Resource constraints observed (sandbox)
- 3.9GB RAM machine: dev server OOMs after ~60 route compiles → self-healing restart (supervisor + probe retry). Production (Vercel serverless) unaffected — no persistent process.
- No memory leaks observed in production patterns (per-request caches, singleton Prisma).

### B5. Targets (for production phase)
| Metric | Target | Current evidence |
|---|---|---|
| API p95 (warm, prod) | < 500ms | DB RTT 238ms + handler ~100ms (achievable) |
| Page TTFB (prod) | < 800ms | ISR 300s on public pages; force-dynamic on dashboard |
| AI consensus | < 6s | Groq 1.2s ×4-5 parallel + synthesis |
| DB orphans | 0 | 0 (verified) |
| Error rate | < 0.1% | 0/216 routes 5xx post-fix |
