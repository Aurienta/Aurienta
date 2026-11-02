# AURIENTA — Deliverable B: System Architecture and Dependency Map

**Mandate:** §16-B
**Purpose:** Actual frontend, backend, databases, AI components, APIs, third-party providers, queues, workers, event flows, and deployment environment boundaries. Mark verified connections differently from configured-only or unverified connections.

**Connection status legend:**
- ✅ **VERIFIED** — live probe confirmed end-to-end
- 🟡 **CONFIGURED** — code is present, integration not verified
- 🔴 **UNVERIFIED** — env var / credential missing in sandbox
- ❌ **FAILED** — live probe returned failure
- ⚫ **ABSENT** — confirmed not present

---

## 1. Frontend layer

```
┌─────────────────────────────────────────────────────────────┐
│ Next.js 16.4.2 (App Router, webpack dev mode)                │
│ Port 3000 (sandbox) / aurienta.vercel.app (prod)              │
└─────────────────────────────────────────────────────────────┘
        │
        ├── 17 public pages (signin, register, legal/, trust/, badge/[slug], enterprise/[slug], registry, etc.)
        │   ✅ All HTTP 200 verified (Phase 1-A)
        │
        ├── 118 dashboard pages under /dashboard/** (11 nav groups, 119 nav items)
        │   ✅ All HTTP 200 verified (Phase 1-A: 30/30 sampled)
        │
        └── Layouts:
            ├── src/app/layout.tsx (root, ThemeProvider, Toaster)
            ├── src/app/dashboard/layout.tsx (MFA gate + sidebar + footer)
            └── src/components/dashboard/dashboard-shell.tsx (sidebar + content)
```

**Frontend status:** ✅ All routes reachable and rendering. No 404s, no blank screens, no infinite loading. 100% nav-config ↔ file-system consistency.

## 2. Backend API layer

```
┌─────────────────────────────────────────────────────────────┐
│ 215 API route handlers under src/app/api/**/route.ts          │
│ 84 distinct sub-domains (largest: ai 27, erp 21, admin 11)    │
└─────────────────────────────────────────────────────────────┘
        │
        ├── Auth (9 routes): /api/auth/[...nextauth], /api/auth/webauthn/*, /api/verification/kyc
        │   ✅ HTTP 200; POST /api/verification/kyc FIXED (was P0 self-elevation)
        │
        ├── Cron (6 routes): /api/cron/{health-rating,verification-sla,crcica-arbitration,stage-transition,proposal-expiry,reservation-expiry}
        │   ✅ All 6 FIXED (was P0/P1 auth bypass)
        │
        ├── CRE (multiple): /api/cre/* — 55 policies
        │   🟡 Code present; functional test BLOCKED on AI keys
        │
        ├── AI (27 routes): /api/ai/* — router, consensus, fallback
        │   🟡 Code present; 0/5 providers authenticated in sandbox
        │
        ├── ERP (21 routes): /api/erp/* — projects, tasks, inventory, procurement, assets, manufacturing, quality, integration
        │   ✅ HTTP 200 (Phase 1-B); real Prisma reads
        │
        ├── Regulatory: /api/v1/regulatory/fra/dashboard
        │   ✅ FIXED (was P0 auth bypass)
        │
        ├── Government APIs: /api/v1/gov/{gafi,nosi,eta}
        │   ❌ FAILED — return hardcoded verified:true (P0 mock)
        │
        └── Webhooks: /api/v1/webhook/payment, /api/v1/ipfs/pin
            🟡 Code present; /payment blocked by CSRF middleware (P1); /ipfs/pin no auth (P1)
```

## 3. Database layer

```
┌─────────────────────────────────────────────────────────────┐
│ Prisma 7.10.0 ORM (@prisma/client + @prisma/adapter-libsql)  │
└─────────────────────────────────────────────────────────────┘
        │
        ├── src/lib/db.ts (Prisma client construction)
        │   Falls back to local SQLite if DATABASE_URL doesn't start with libsql://
        │   🔴 UNVERIFIED — Turso env var not set in sandbox; using local fallback
        │
        ├── prisma/schema.prisma (99 models, 215 @@index, 11 @@unique)
        │   ✅ VERIFIED — 99 models counted
        │
        ├── prisma/migrations/0_complete_init/migration.sql
        │   ❌ FAILED — 23 tables missing (migration drift P0-C)
        │
        └── Production target: libsql://aurienta-fortleem.aws-us-east-1.turso.io
            🔴 UNVERIFIED — token not in sandbox env
```

## 4. AI layer

```
┌─────────────────────────────────────────────────────────────┐
│ src/lib/aurienta/ai-router.ts (37 KB, 5-provider consensus)   │
│ src/lib/aurienta/ai.ts (121 KB)                               │
│ src/lib/aurienta/ai-prompt-tiers.ts                           │
└─────────────────────────────────────────────────────────────┘
        │
        ├── Groq      (GROQ_API_KEY)      🔴 UNVERIFIED (key missing)
        ├── OpenRouter (OPENROUTER_API_KEY) 🔴 UNVERIFIED (key missing)
        ├── NVIDIA    (NVIDIA_API_KEY)    🔴 UNVERIFIED (key missing)
        ├── Gemini    (GEMINI_API_KEY, native REST) 🔴 UNVERIFIED (key missing)
        ├── HuggingFace (HUGGINGFACE_API_KEY) 🔴 UNVERIFIED (key missing)
        │
        └── Fallback behavior: deterministic responses (no AI)
            ✅ VERIFIED — `/api/ai/router-status` HTTP 200 reports fallback mode
```

## 5. External integrations

```
┌─────────────────────────────────────────────────────────────┐
│ Third-party providers                                         │
└─────────────────────────────────────────────────────────────┘
        │
        ├── Turso (libSQL cloud DB)
        │   ├── Endpoint: libsql://aurienta-fortleem.aws-us-east-1.turso.io
        │   ├── DNS: ✅ reachable (Phase 1-D)
        │   └── Auth: 🔴 UNVERIFIED (token not in sandbox env)
        │
        ├── GitHub (repo management)
        │   ├── Endpoint: api.github.com/repos/Aurienta/Aurienta
        │   ├── DNS: ✅ reachable
        │   └── Auth: 🔴 UNVERIFIED (token not in sandbox env)
        │
        ├── Vercel (deploy/host)
        │   ├── Endpoint: api.vercel.com/v9/projects/prj_zEATZmp64oA7lfDTt8wya1OjOPYg
        │   ├── DNS: ✅ reachable
        │   └── Auth: 🔴 UNVERIFIED (token not in sandbox env)
        │
        ├── Government APIs (GAFI, NOSI, ETA)
        │   └── ❌ FAILED — code returns hardcoded verified:true (no real integration)
        │
        ├── Bank API (EVE)
        │   └── ❌ FAILED — mockBankApiLookup fabricates transactions (no real integration)
        │
        ├── Liveness SDK (TrOCR/facenet/DFDC for KYC)
        │   └── ⚫ ABSENT — KYC endpoint accepts client-supplied scores (sandbox mock)
        │
        ├── External ERP providers (NetSuite/Odoo/SAP)
        │   └── ❌ FAILED — syncModule always returns success (no real sync)
        │
        └── z-ai-web-dev-sdk
            └── ⚫ ABSENT (confirmed removed per worklog)
```

## 6. Background processes / workers

```
┌─────────────────────────────────────────────────────────────┐
│ Cron jobs (6) — invoked via Vercel Cron or external scheduler │
└─────────────────────────────────────────────────────────────┘
        │
        ├── /api/cron/health-rating (POST, daily)
        ├── /api/cron/verification-sla (POST, hourly)
        ├── /api/cron/crcica-arbitration (POST, hourly)
        ├── /api/cron/stage-transition (POST, daily)
        ├── /api/cron/proposal-expiry (GET, hourly)
        └── /api/cron/reservation-expiry (GET, hourly)
        
        ✅ All 6 now use requireCronToken() helper (fail-closed 503 if CRON_SECRET unset)
        🔴 UNVERIFIED in sandbox (CRON_SECRET not set); production Vercel Cron MUST set it
```

## 7. Event flows

```
USER ACTION → FRONTEND → API → AUTHORIZATION → BUSINESS LOGIC → DATABASE → EXTERNAL → BACKGROUND → FINAL STATE → UI CONFIRMATION

Traceable flows (code present):
  1. Sign-in → /api/auth/[...nextauth] → Argon2id verify → session cookie → /dashboard
  2. KYC submit → /api/verification/kyc → body validation → User.verificationLevel update → audit log → response
     ✅ FIXED (was self-elevation)
  3. Cron invocation → CRON_SECRET check → recalc/sweep → DB update → audit log → response
     ✅ FIXED (was bypass)
  4. CRE decision → /api/cre/* → policy eval → Ed25519 sign → LedgerEvent append → response
     🟡 Code present; AI-dependent policies fall back to deterministic mode
  5. ERP sync → /api/erp/integration/sync → syncModule (mock) → ErpSyncLog → response
     ❌ FAILED — syncModule always returns success without actually syncing
```

## 8. Trust boundaries

```
┌──────────┐   HTTPS    ┌──────────┐   libSQL   ┌──────────┐
│ Browser  │ ─────────→ │ Next.js  │ ─────────→ │ Turso    │
│ (anon)   │            │ (portal) │            │ (cloud)  │
└──────────┘            └──────────┘            └──────────┘
                              │
                              │ Bearer token
                              ↓
                        ┌──────────┐
                        │ AI       │  (5 providers)
                        │ Routers  │
                        └──────────┘
                              │
                              │ Bearer token
                              ↓
                        ┌──────────┐
                        │ External │  (GitHub, Vercel, gov, bank)
                        │ APIs     │
                        └──────────┘
```

**Trust boundary integrity:**
- ✅ Browser → Next.js: HTTPS enforced; CSRF middleware active (with documented exclusions for cron routes)
- ✅ Next.js → Turso: Prisma parameterized queries (no SQL injection)
- 🔴 Next.js → AI providers: keys missing in sandbox — UNVERIFIED
- 🔴 Next.js → External APIs (gov, bank): NOT integrated (mocks return hardcoded data)
- ✅ Cron → Next.js: now requires CRON_SECRET (was bypass, FIXED)

## 9. Failure points (identified)

| Failure point | Impact | Mitigation |
|---|---|---|
| `CRON_SECRET` unset | Cron jobs return 503 (silent fail) | Vercel env var must be set; documented in Deliverable H |
| `FIELD_ENCRYPTION_KEY` unset | PII endpoints throw 500 | Lazy-throw on first use; documented |
| `FRA_ACCESS_TOKEN` unset | FRA dashboard returns 503 | Vercel env var must be set |
| AI provider keys missing | AI router falls back to deterministic | `/api/ready` honestly reports HTTP 503 |
| Turso unreachable | App falls back to local SQLite | `/api/health` misleadingly reports `connected` (P2-D-009) |
| Mock gov/bank APIs | Trust signals are fabricated | Documented; real integrations required |

## 10. Deployment environment

```
Sandbox (this audit):
  - Bun + next dev --webpack on port 3000
  - Local SQLite fallback DB
  - 0/5 AI providers authenticated
  - No production secrets in .env

Production (per worklog — NOT verified in this audit):
  - Vercel deployment at aurienta.vercel.app
  - Vercel project ID: prj_zEATZmp64oA7lfDTt8wya1OjOPYg
  - GitHub repo: github.com/Aurienta/Aurienta
  - Turso: libsql://aurienta-fortleem.aws-us-east-1.turso.io
  - All 12 integration env vars claimed configured (NOT VERIFIED here)
```

**Deployment boundary integrity:**
- 🔴 Sandbox env ≠ production env — claims of "production LIVE" cannot be verified from sandbox
- ✅ No code-level dev/prod bypass (Phase 1-E confirmed: 0 `NODE_ENV !== production` bypass patterns in production paths)
- ✅ `.env` is `chmod 444` (read-only, hardened)
