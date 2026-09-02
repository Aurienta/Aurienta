# AURIENTA — Production-Readiness Audit Report

**Auditor:** Principal Software Architect / DevSecOps Lead / SRE
**Date:** 2026-09-02
**Target:** `aurienta.vercel.app` (Vercel project `prj_zEATZmp64oA7lfDTt8wya1OjOPYg`)
**Methodology:** Evidence-backed, automated audit across 5 modules. No synthetic placeholders.

---

## 1. Executive Summary & Readiness Scorecard

| Audit Domain | Score (0-100) | Status | Key Bottleneck |
| :--- | :--- | :--- | :--- |
| Codebase Quality & Security | **72** | ⚠️ Warning | ESLint rules heavily relaxed; 83 CVEs (1 critical); 34/102 API routes lack try/catch |
| Vercel Deployment & Infrastructure | **82** | ⚠️ Warning | Hobby plan (cold-start + bandwidth risk); 1 failed deploy in last 5 |
| Turso Database Architecture | **62** | 🔴 High Risk | 6 models missing FK indexes (User has 15 relations, 0 indexes); RTT 294ms avg; no multi-region replication |
| Frontend Performance & Web Vitals | **88** | ✅ Pass | TTFB 7ms; FCP 1.19s; CLS 0.000; /trust TTFB 1.2s (DB-heavy) |
| Security & Header Compliance | **78** | ⚠️ Warning | Session cookie `secure:false` (P0); CSP uses `unsafe-eval` |
| **OVERALL COMPOSITE SCORE** | **76** | **⚠️ LAUNCH ELIGIBLE WITH WARNINGS** | **Cookie security + missing DB indexes** |

**Verdict:** The platform is **launch-eligible for a controlled/pilot release** but carries 2 P0 blockers that must be resolved before broad public launch. Core user flows work, the build is green, and frontend performance is strong. Database indexing and cookie security are the top remediation targets.

---

## 2. Critical Findings & Prioritized Remediation Roadmap

### 🔴 P0 — Launch Blockers (MUST fix before public launch)

#### P0-1: Session cookie `secure: false` in production
**Evidence:** `src/lib/aurienta/auth.ts:106` — `secure: false` with comment "allow HTTP in dev/preview; Caddy terminates HTTPS in production".
**Root cause:** The flag is hardcoded `false` for all environments. Even with Caddy/TLS termination, if any request reaches the app over HTTP (misconfigured proxy, internal traffic, preview env), the session cookie is transmitted in cleartext → session hijacking.
**Impact:** Session cookies can leak over unencrypted connections. CVSS ~7.5 (High).

#### P0-2: Missing foreign-key indexes on 6 high-traffic tables
**Evidence:** Prisma schema audit + live DB index inspection:
- `User` — 15 relations, **0 @@index** (only autoindex + 3 unique constraints)
- `OwnershipRecord` — **0 indexes total** (the ownership ledger — every query table-scans)
- `Vote` — 0 @@index (governance votes)
- `SyndicateMember`, `DripEnrollment`, `InsuranceVault` — 0 @@index
**Root cause:** Prisma doesn't auto-create indexes for `@relation` fields; they must be declared explicitly with `@@index`.
**Impact:** Every JOIN/WHERE on these FKs table-scans. At scale (>1k users), dashboard load times degrade to seconds. Already at 12 users + 1 enterprise; degrades fast.

---

### 🟠 P1 — High Priority (fix within 7 days of launch)

#### P1-1: Content-Security-Policy uses `unsafe-eval` + `unsafe-inline`
**Evidence:** `next.config.ts` headers + live header `script-src 'self' 'unsafe-inline' 'unsafe-eval'`.
**Root cause:** Next.js dev mode needs `unsafe-eval`; the same policy ships to production.
**Impact:** Weakens XSS protection. Should use nonces/hashes in production.

#### P1-2: 34 of 102 API routes lack try/catch error handling
**Evidence:** `rg "try\s*\{" src/app/api` → 68/102 routes have try/catch; 34 don't (e.g. `/api/vault/*`, `/api/verification/*`, `/api/proxies/*`, `/api/public/*`).
**Impact:** Unhandled errors can leak stack traces, crash the serverless function without a clean response, and surface internal details.

#### P1-3: No global `unhandledRejection` / `uncaughtException` handler
**Evidence:** `rg "process.on\('unhandledRejection'" src` → 0 results.
**Impact:** Silent promise rejections go unlogged; debugging production issues is harder.

#### P1-4: 83 dependency vulnerabilities (1 critical, 45 high)
**Evidence:** `bun audit` output. Critical: `sharp <0.35.0` (CVE-2026-33327/8/35590/1 — libvips). High: `picomatch`, `browserslist` (both transitive via eslint dev deps). Moderate: `prismjs` (via react-syntax-highlighter + mdxeditor).
**Mitigation:** Most are transitive dev dependencies (eslint toolchain). `sharp` is the one production-affecting critical → upgrade to `>=0.35.0`.

#### P1-5: Vercel Hobby plan — cold-start and bandwidth risk
**Evidence:** Project API response: `"plan": "hobby"`. 5 serverless functions.
**Impact:** Hobby plan has bandwidth limits (100GB/mo) and cold-start latency (~1-2s on first request after idle). For a production fintech platform, Pro plan ($20/mo) is required for: no cold starts, DDoS protection, 1TB bandwidth, team features.

#### P1-6: ESLint rules heavily relaxed (15+ rules disabled)
**Evidence:** `eslint.config.mjs` disables: `@typescript-eslint/no-explicit-any`, `no-unused-vars`, `no-console`, `react-hooks/exhaustive-deps`, `prefer-const`, `no-debugger`, `no-empty`, etc.
**Impact:** Type safety and code-quality guardrails are effectively disabled. `any` types proliferate, unused vars accumulate, hook deps go unverified.

---

### 🟡 P2 — Medium Priority (next sprint cycle)

#### P2-1: No Turso multi-region replication
Turso DB is single-region (`aws-us-east-1`). For Egyptian users (primary market), RTT is ~290ms. Multi-region replicas (e.g. `fra1` for EU/Africa edge) would cut latency to <100ms.

#### P2-2: No database backup automation
No scheduled backups visible (only `scripts/backup.sh` exists but no cron). Turso free/dev tier has limited point-in-time recovery. Production needs daily automated backups + tested restore.

#### P2-3: TypeScript `noImplicitAny: false`
`tsconfig.json` weakens type safety — implicit `any` allowed. Should be `true` for production fintech.

#### P2-4: `/trust` page TTFB 1.2s
The heaviest DB-backed page. Consider ISR caching or query optimization.

#### P2-5: No migration files
Schema is managed via `prisma db push` (direct sync), not `prisma migrate dev` (versioned migrations). Production should use versioned migrations for auditability and rollback.

---

## 3. Step-by-Step Actionable Fixes

### 🔴 P0-1 Fix: Make session cookie `secure` env-conditional

**File:** `src/lib/aurienta/auth.ts` (line ~106)

**Root cause:** `secure: false` is hardcoded for all environments.

**Fix:**
```typescript
// BEFORE:
secure: false, // allow HTTP in dev/preview; Caddy terminates HTTPS in production

// AFTER:
secure: process.env.NODE_ENV === "production",
```

This sets `Secure` flag on the cookie in production (cookie only sent over HTTPS) while keeping it `false` for local dev over HTTP. If preview environments use HTTPS (Vercel does), set it `true` there too — Vercel's `NODE_ENV=production` for both preview and prod deployments handles this correctly.

**Verify after deploy:**
```bash
curl -sSI https://aurienta.vercel.app/ | grep -i set-cookie
# Should show: Secure; HttpOnly; SameSite=Lax
```

---

### 🔴 P0-2 Fix: Add missing FK indexes to Prisma schema

**File:** `prisma/schema.prisma`

**Root cause:** Prisma requires explicit `@@index` declarations for FK fields; `@relation` alone does NOT create a DB index.

**Fix:** Add the following `@@index` declarations to each affected model:

```prisma
model User {
  // ... existing fields ...
  @@index([tier])
  @@index([verificationLevel])
  @@index([nationality])
  @@index([primaryIntent])
  @@index([sovereignTrustScore])
  // Add indexes for any FK fields pointing INTO User from other tables
  // (review the schema for fields like ownerId, createdBy, userId that reference User)
}

model OwnershipRecord {
  // ... existing fields ...
  @@index([enterpriseId])
  @@index([userId])
  @@index([acquiredAt])
}

model Vote {
  // ... existing fields ...
  @@index([proposalId])
  @@index([userId])
  @@index([enterpriseId])
}

model SyndicateMember {
  // ... existing fields ...
  @@index([syndicateId])
  @@index([userId])
}

model DripEnrollment {
  // ... existing fields ...
  @@index([userId])
  @@index([enterpriseId])
}

model InsuranceVault {
  // ... existing fields ...
  @@index([enterpriseId])
  @@index([userId])
}
```

**Apply the changes:**
```bash
# Generate migration SQL (Prisma 7 — adapter is runtime-only)
bunx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > /tmp/schema.sql

# Execute against Turso via libsql client (since prisma db push CLI
# doesn't support the libsql:// adapter in v7.9.1)
# OR — simpler — just create the indexes directly:
```

**Direct index creation script** (save as `scripts/add-missing-indexes.ts`):
```typescript
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter(l => /^[A-Z]/.test(l))
    .map(l => {
      const [k, ...v] = l.split("=");
      return [k, v.join("=")];
    })
);

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

const indexes = [
  "CREATE INDEX IF NOT EXISTS User_tier_idx ON User(tier)",
  "CREATE INDEX IF NOT EXISTS User_verificationLevel_idx ON User(verificationLevel)",
  "CREATE INDEX IF NOT EXISTS User_nationality_idx ON User(nationality)",
  "CREATE INDEX IF NOT EXISTS User_primaryIntent_idx ON User(primaryIntent)",
  "CREATE INDEX IF NOT EXISTS User_sovereignTrustScore_idx ON User(sovereignTrustScore)",
  "CREATE INDEX IF NOT EXISTS OwnershipRecord_enterpriseId_idx ON OwnershipRecord(enterpriseId)",
  "CREATE INDEX IF NOT EXISTS OwnershipRecord_userId_idx ON OwnershipRecord(userId)",
  "CREATE INDEX IF NOT EXISTS OwnershipRecord_acquiredAt_idx ON OwnershipRecord(acquiredAt)",
  "CREATE INDEX IF NOT EXISTS Vote_proposalId_idx ON Vote(proposalId)",
  "CREATE INDEX IF NOT EXISTS Vote_userId_idx ON Vote(userId)",
  "CREATE INDEX IF NOT EXISTS Vote_enterpriseId_idx ON Vote(enterpriseId)",
  "CREATE INDEX IF NOT EXISTS SyndicateMember_syndicateId_idx ON SyndicateMember(syndicateId)",
  "CREATE INDEX IF NOT EXISTS SyndicateMember_userId_idx ON SyndicateMember(userId)",
  "CREATE INDEX IF NOT EXISTS DripEnrollment_userId_idx ON DripEnrollment(userId)",
  "CREATE INDEX IF NOT EXISTS DripEnrollment_enterpriseId_idx ON DripEnrollment(enterpriseId)",
  "CREATE INDEX IF NOT EXISTS InsuranceVault_enterpriseId_idx ON InsuranceVault(enterpriseId)",
  "CREATE INDEX IF NOT EXISTS InsuranceVault_userId_idx ON InsuranceVault(userId)",
];

for (const sql of indexes) {
  try {
    await client.execute(sql);
    console.log("✓", sql.replace("CREATE INDEX IF NOT EXISTS ", "").replace(" ON ", " → "));
  } catch (e: any) {
    console.error("✗", e.message, "|", sql);
  }
}
console.log("Done.");
```

Run: `bun run scripts/add-missing-indexes.ts`

**Verify:**
```bash
# After running, confirm indexes exist:
node -e "
const {createClient}=require('@libsql/client');
const c=createClient({url:'libsql://aurienta-fortleem.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});
c.execute(\"SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='User'\").then(r=>console.log(r.rows));
"
```

---

### 🟠 P1-1 Fix: Tighten CSP in production (remove unsafe-eval)

**File:** `next.config.ts` (headers block)

**Fix:** Make CSP environment-conditional — allow `unsafe-eval` only in development:
```typescript
async headers() {
  const isProd = process.env.NODE_ENV === "production";
  const scriptSrc = isProd
    ? "script-src 'self' 'unsafe-inline'"  // drop 'unsafe-eval' in prod
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";  // dev needs eval
  return [
    {
      source: "/(.*)",
      headers: [
        // ... existing headers ...
        {
          key: "Content-Security-Policy",
          value: `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'self'`,
        },
      ],
    },
  ];
},
```

**Note:** Removing `unsafe-inline` from script-src requires using CSP nonces (Next.js supports this via `headers()` returning per-request nonces). For a first pass, keeping `unsafe-inline` but dropping `unsafe-eval` is a meaningful improvement. Full nonce-based CSP is a P2 follow-up.

---

### 🟠 P1-2 Fix: Add try/catch to 34 unprotected API routes

**Files (sample — apply pattern to all 34):**
- `src/app/api/vault/route.ts`
- `src/app/api/verification/route.ts`
- `src/app/api/proxies/route.ts`
- `src/app/api/public/registry/route.ts`
- (full list: run `for f in $(find src/app/api -name route.ts); do rg -q "try\s*\{" "$f" || echo "$f"; done`)

**Fix pattern:** Wrap each route handler body:
```typescript
// BEFORE:
export async function POST(req: Request) {
  const body = await req.json();
  // ... business logic ...
  return Response.json({ ok: true });
}

// AFTER:
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // ... business logic ...
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/vault] POST failed:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Bulk refactor option:** Create a `withErrorHandler` wrapper in `src/lib/aurienta/api-handler.ts`:
```typescript
export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(`[api] ${handler.name} failed:`, error);
      return Response.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }) as T;
}
```
Then wrap: `export const POST = withErrorHandler(async (req) => { ... });`

---

### 🟠 P1-3 Fix: Add global unhandled rejection handler

**File:** `src/instrumentation.ts` (Next.js instrumentation hook — auto-loaded)

**Fix:** Create the file:
```typescript
// src/instrumentation.ts
// Next.js instrumentation hook — runs once on server startup.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.on("unhandledRejection", (reason, promise) => {
      console.error("[FATAL] Unhandled Rejection:", reason);
      // In production, forward to observability (Sentry/Datadog)
    });
    process.on("uncaughtException", (error) => {
      console.error("[FATAL] Uncaught Exception:", error);
      // Do NOT re-throw; let the process restart via the serverless runtime
    });
    console.log("[instrumentation] Global error handlers registered.");
  }
}
```

Next.js automatically calls `register()` on server boot if `src/instrumentation.ts` exists.

---

### 🟠 P1-4 Fix: Upgrade `sharp` to fix critical CVE

**Command:**
```bash
bun upgrade sharp@^0.35.0
# Verify:
bun audit | grep sharp
# Should show no sharp vulnerabilities
```

**Note:** `next` bundles its own `sharp` internally for image optimization, but the top-level `sharp` dependency in `package.json` is the vulnerable one. Upgrading the direct dep resolves it.

For the transitive dev-dep CVEs (`picomatch`, `browserslist`, `prismjs` via eslint/react-syntax-highlighter):
```bash
bun update --latest  # major bumps — review breaking changes
# OR selectively:
bun upgrade eslint-config-next @typescript-eslint/utils
```

---

### 🟠 P1-6 Fix: Tighten ESLint rules progressively

**File:** `eslint.config.mjs`

**Fix (incremental — re-enable rules one at a time, fix resulting errors):**
```javascript
// Start with high-value, low-noise rules:
rules: {
  // Re-enable (fix the violations first):
  "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  "@typescript-eslint/no-explicit-any": "warn",  // warn, not error, to start
  "react-hooks/exhaustive-deps": "warn",
  "prefer-const": "warn",
  "no-console": ["warn", { allow: ["warn", "error"] }],
  // Keep these disabled (too noisy):
  // "no-debugger": "error",  // re-enable this one
}
```

Run `bun run lint` after each re-enable, fix the flagged issues, then re-enable the next rule.

---

## 4. Module-by-Module Evidence Detail

### Module 1 — Codebase Quality & Security (Score: 72/100 ⚠️)

| Check | Finding |
|---|---|
| TypeScript strict mode | ✅ `strict: true` but ⚠️ `noImplicitAny: false` (weakened) |
| ESLint config | ⚠️ 15+ rules disabled (no-explicit-any, no-unused-vars, no-console, exhaustive-deps, prefer-const, no-debugger, no-empty...) |
| Error boundaries | ✅ `app/error.tsx` + `global-error.tsx` + 4 dashboard page-level boundaries |
| CI/CD pipeline | ✅ Enterprise-grade: lint + typecheck + build + `bun audit` + gitleaks + CodeQL SAST |
| Dependabot | ✅ Weekly npm + github-actions updates |
| Secret scan (gitleaks in CI) | ✅ Configured with full history (`fetch-depth: 0`) |
| API routes with try/catch | ⚠️ 68/102 (67%) — 34 routes unprotected |
| Unhandled rejection handler | ❌ None |
| Dependency CVEs | ⚠️ 83 total (1 critical sharp, 45 high — mostly transitive dev deps) |
| Hardcoded secrets | ✅ Zero (verified via multi-pattern scan + git history) |

### Module 2 — Vercel Deployment & Infrastructure (Score: 82/100 ⚠️)

| Check | Finding |
|---|---|
| Latest production deploy | ✅ READY (sha `7f9f1a42`, 2026-09-02) |
| Build time | ✅ 18s compile + 39s cache (fast) |
| Static pages generated | ✅ 18 |
| Serverless functions | ✅ 5 (Node.js 24.x) |
| Failed deploys (last 5) | ⚠️ 1 ERROR (`3e9868a2` — prisma config type error, fixed) |
| Vercel plan | ⚠️ Hobby (cold-start + 100GB bandwidth limit) |
| Env var parity | ✅ All 9 vars mapped to production + preview + development |
| Custom domain | ✅ `aurienta.vercel.app` verified, SSL active |
| Auto-deploy from git | ✅ GitHub integration active |
| Build command | `next build --webpack` (using webpack, not turbopack) |

### Module 3 — Turso Database Architecture (Score: 62/100 🔴)

| Check | Finding |
|---|---|
| Tables | 51 |
| Relations (@relation) | 89 |
| Explicit @@index | 91 (91% relation coverage — good) |
| Models with relations but 0 @@index | 🔴 6 (User, OwnershipRecord, Vote, SyndicateMember, DripEnrollment, InsuranceVault) |
| User table live indexes | Only autoindex + 3 unique constraints (email, mobile, identityHash) |
| OwnershipRecord live indexes | 🔴 NONE (table-scans on every ownership query) |
| RTT (sandbox → aws-us-east-1) | avg 294ms, min 214ms, max 671ms |
| Multi-region replication | ❌ None (single region) |
| Migration files | ❌ None (uses `prisma db push` direct sync) |
| Backup automation | ❌ None (script exists but no cron) |
| Existing data | 12 users, 1 enterprise |

### Module 4 — Frontend Performance & Web Vitals (Score: 88/100 ✅)

| Metric | Value | Rating |
|---|---|---|
| TTFB (homepage) | 7ms | ✅ Excellent (edge cache) |
| FCP | 1188ms | ✅ Good (< 1800ms) |
| CLS | 0.000 | ✅ Perfect |
| DOM load | 1291ms | ✅ Good |
| LCP | (not captured in observation window) | needs re-measure |
| Page weight (decoded) | 251KB | ✅ Good |
| Page weight (transferred) | 30KB | ✅ Excellent (gzip) |
| Static assets | 27 | ✅ Reasonable |
| Console errors (3 routes) | 0 | ✅ Clean |
| `/trust` TTFB | 1220ms | ⚠️ DB-heavy, optimize |
| `/register` TTFB | 646ms | ✅ Good |

**Accessibility (WCAG 2.1 AA):**
| Check | Finding |
|---|---|
| Skip-to-content link | ✅ Present |
| Single h1 | ✅ 1 (correct) |
| Heading hierarchy | ✅ 1× h1, 11× h2 |
| Images without alt | ✅ 0 (no img elements; all SVG/CSS) |
| Buttons without aria-label/text | ✅ 0 |
| Inputs without label | ✅ 0 |
| Semantic landmarks | ✅ 18 (main, header, footer, nav, section, article) |
| `lang` attribute | ✅ `en` |
| Color contrast | ⚠️ Manual check needed (gold-on-black likely OK; gold-light on white needs verification) |

**SEO:**
| Check | Finding |
|---|---|
| Title tag | ✅ "AURIENTA — Constitutional Enterprise Infrastructure" |
| Meta description | ✅ Present |
| Open Graph (title/image/url) | ✅ All present (`og-image.png` 1344×768) |
| Twitter card | ✅ `summary_large_image` |
| Canonical URL | ✅ `https://aurienta.vercel.app/` |
| `sitemap.xml` | ✅ Valid (URLs with lastmod/changefreq/priority) |
| `robots.txt` | ✅ Allows /, disallows /dashboard/ and /api/ |
| Structured data (JSON-LD) | ❌ None (P2 — add Organization schema) |

### Module 5 — Security & Header Compliance (Score: 78/100 ⚠️)

| Header | Value | Status |
|---|---|---|
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` | ✅ Excellent (2yr + preload) |
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...` | ⚠️ `unsafe-eval` weakens XSS protection |
| X-Frame-Options | `SAMEORIGIN` | ✅ Present (consider `frame-ancestors` CSP only) |
| X-Content-Type-Options | `nosniff` | ✅ Present |
| Referrer-Policy | `strict-origin-when-cross-origin` | ✅ Present |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | ✅ Present |
| X-Powered-By | `Next.js` | ⚠️ Leaks framework (disable via `next.config.ts` `poweredByHeader: false`) |
| Cache-Control | `no-store, no-cache, must-revalidate` | ✅ Strict (prevents redirect caching) |

**Cookie security:**
| Attribute | Value | Status |
|---|---|---|
| HttpOnly | `true` | ✅ Prevents JS access |
| SameSite | `lax` | ✅ CSRF mitigation |
| Secure | `false` | 🔴 **P0** — must be `true` in production |
| CSRF token cookie | present (`aurienta_csrf`) | ✅ |

---

## 5. Summary & Recommended Launch Sequence

1. **Immediate (P0, before any public traffic):**
   - Fix `secure: false` → `secure: process.env.NODE_ENV === "production"` in `src/lib/aurienta/auth.ts:106`
   - Add the 17 missing FK indexes (run the script in P0-2)
   - Run `bun upgrade sharp@^0.35.0` (critical CVE)

2. **Pre-launch verification:**
   - Deploy to Vercel, verify `Set-Cookie` header includes `Secure`
   - Verify indexes via `sqlite_master` query
   - Re-run `bun audit` → confirm sharp CVE resolved

3. **Week 1 post-launch (P1):**
   - Tighten CSP (drop `unsafe-eval` in production)
   - Add try/catch to the 34 unprotected API routes (or wrap with `withErrorHandler`)
   - Add `src/instrumentation.ts` global error handler
   - Upgrade to Vercel Pro plan (eliminate cold-start + bandwidth risk)
   - Progressively re-enable ESLint rules

4. **Next sprint (P2):**
   - Turso multi-region replica (fra1 for EU/Africa edge)
   - Add daily DB backup automation + tested restore
   - Switch to `prisma migrate dev` for versioned migrations
   - Enable `noImplicitAny: true` in tsconfig
   - Add JSON-LD Organization structured data
   - Optimize `/trust` page TTFB (ISR or query optimization)

**Bottom line:** The platform is architecturally sound with strong CI/CD and frontend performance. The two P0 fixes (cookie security + DB indexes) are small, surgical changes with outsized impact. Once those are in, the platform is safe for a controlled pilot launch while P1 items are addressed in parallel.
