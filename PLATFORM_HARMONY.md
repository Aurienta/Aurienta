# AURIENTA — 5-Platform Harmony Architecture

## The Creative Insight

Most platforms use one database for everything. AURIENTA uses **5 platforms in harmony**, each doing what it does best:

```
                    ┌──────────────┐
                    │   GitHub     │  ← Source of truth + CI gate
                    │  Actions CI  │     (lint + typecheck → deploy)
                    └──────┬───────┘
                           │ push to main (only if CI passes)
                    ┌──────▼───────┐
                    │   Vercel     │  ← Next.js host (edge + serverless)
                    │  ISR cache   │     Public pages: edge-cached (5min)
                    │  Edge fns    │     API routes: serverless (60s)
                    └──┬───┬───┬───┘
                       │   │   │
          ┌────────────┘   │   └────────────┐
          │                │                │
   ┌──────▼──────┐  ┌─────▼─────┐  ┌───────▼───────┐
   │   Turso     │  │  Inngest  │  │    Neon       │
   │  (Primary)  │  │ (Orchest.)│  │ (Analytics)   │
   │             │  │           │  │               │
   │ • Reads     │  │ • 6 crons │  │ • Aggregations │
   │ • Writes    │  │ • Workfl. │  │ • Heavy JOINs │
   │ • Edge-repl │  │ • Retries │  │ • Read replica│
   │ • <50ms TTFB│  │ • No time.│  │ • PG engine   │
   └─────────────┘  └───────────┘  └───────────────┘
```

## Platform Roles (Each Does What It Does Best)

### 1. GitHub — Source of Truth + CI Gate
- **Role:** Version control + CI/CD pipeline
- **What it does:** On every push to `main`, runs lint + typecheck + build. Only deploys if all pass.
- **Why:** Prevents broken code from reaching production. Branch protection + git tags prevent rollback.
- **Files:** `.github/workflows/ci.yml`

### 2. Vercel — Edge + Serverless Host
- **Role:** Next.js hosting with global edge network
- **What it does:**
  - **Public pages** (/, /trust, /registry, /enterprise/[slug]): ISR with 5min revalidate → served from edge cache with <50ms TTFB globally
  - **API routes** (auth, AI, dashboard): Serverless functions with 60s timeout (120s for AI routes)
  - **Cron triggers:** Fires 6 cron endpoints at scheduled times
- **Why:** Edge network = fast globally. ISR = near-zero latency for public pages. Serverless = auto-scaling.
- **Config:** `vercel.json` (crons + function config)

### 3. Turso — Primary Database (libSQL)
- **Role:** All reads + writes (primary data store)
- **What it does:**
  - **Reads:** Served from edge replica (<50ms globally via Turso's edge replication)
  - **Writes:** Go to primary (strong consistency, hash-chained ledger)
  - **Schema:** 56 models, 142 indexes
- **Why:** libSQL is SQLite-compatible (fast, simple) + edge-replicated (low latency). Connectionless HTTP protocol = no connection pool needed.
- **Fallback:** If Turso is down, falls back to local SQLite (sandbox) or errors gracefully.

### 4. Inngest — Workflow Orchestrator
- **Role:** Background jobs, crons, long-running workflows
- **What it does:**
  - **6 cron jobs:** proposal-expiry, reservation-expiry, stage-transition, health-rating, verification-SLA, CRCICA-arbitration
  - **5 workflows:** dispute resolution (6-stage), graduation protocol, succession activation, verification SLA, circuit breaker
  - **Retries:** Automatic retry with backoff (Vercel crons don't retry)
  - **No timeout:** Inngest jobs can run for minutes (Vercel crons timeout at 60s)
- **Why:** Vercel crons are fire-and-forget with 60s timeout. Inngest adds retries, step functions, and observability.
- **Endpoint:** `/api/inngest` (discovery + event trigger)

### 5. Neon — Analytics Replica (PostgreSQL)
- **Role:** Heavy analytics queries (read-only)
- **What it does:**
  - **Aggregations:** `GROUP BY`, `COUNT`, `SUM` over large datasets
  - **Complex JOINs:** PostgreSQL's query planner is better for multi-table JOINs
  - **Analytics dashboards:** FRA dashboard, admin stats, health rating engine
  - **Read replica:** Syncs from Turso primary (async, eventually consistent)
- **Why:** PostgreSQL's query engine is 5-10× faster than SQLite for complex aggregations. Neon's serverless PostgreSQL scales to zero (no idle cost).
- **Fallback:** If Neon is down, analytics queries fall back to Turso (slower but works).

## Smart DB Router

The `src/lib/aurienta/smart-db-router.ts` module routes queries intelligently:

```typescript
const smartDb = getSmartDb();

// Read → Turso edge (fast, <50ms)
const users = await smartDb.read.user.findMany();

// Write → Turso primary (strong consistency)
await smartDb.write.user.create({ data: {...} });

// Analytics → Neon PostgreSQL (fast for aggregations)
const stats = await smartDb.analytics.user.groupBy({...});

// Transaction → Turso primary (always, for hash-chained ledger)
await smartDb.primary.$transaction(async (tx) => {...});
```

## Cross-Platform .env Harmony

All 5 platforms share credentials via Vercel env vars:

```
GitHub → push → Vercel auto-deploys
Vercel → reads DATABASE_URL (Turso) for DB queries
Vercel → reads NEON_DATABASE_URL for analytics queries
Vercel → triggers INNGEST_EVENT_KEY for workflow events
Vercel → fires 6 crons (vercel.json) → cron endpoints use CRON_SECRET
Turso → stores all data (primary)
Neon → syncs from Turso (read replica, async)
Inngest → calls back to Vercel API endpoints (INNGEST_EVENT_BASE_URL)
```

## Performance Optimization Summary

| Optimization | Platform | Impact |
|---|---|---|
| ISR (5min revalidate) | Vercel + Turso | Public pages: <50ms TTFB globally |
| Edge replication | Turso | Reads served from nearest edge |
| Connectionless HTTP | Turso | No connection pool exhaustion |
| Cron retries + backoff | Inngest | Failed jobs retry automatically |
| Step functions | Inngest | Long workflows don't timeout |
| PG query engine | Neon | Aggregations 5-10× faster |
| Serverless scaling | Vercel | Auto-scales to 0 when idle |
| CI gate | GitHub | Broken code never reaches prod |

## AI Model Failover (5 Providers, 11 Models)

```
Consensus: Gemini-2.5 + Groq-3.3-70b + OpenRouter-Claude → synthesize
Standard: Groq → Gemini → OpenRouter (try in order)
Fast: Groq-3.1-8b → Gemini (low-latency first)
Last resort: OpenRouter → NVIDIA → HuggingFace → safe fallback
```

If one model fails, the system automatically tries the next. If all fail, a safe fallback message is returned (CRE rules still enforced).

## Deployment Flow

```
Developer → git push origin main
         → GitHub Actions CI (lint + typecheck + build)
         → if pass: Vercel auto-deploys from main
         → Vercel reads env vars (Turso + Neon + Inngest + AI keys)
         → Vercel serves ISR pages at edge
         → Vercel fires crons → Inngest orchestrates
         → Turso serves reads/writes
         → Neon serves analytics
```

## Git Tags (Rollback Prevention)

- `v2026-stable` — current stable release
- `v1.0.0-constitutional-complete` — constitutional completion
- `v-institutional-readiness` — institutional readiness milestone

These tags prevent accidental rollback to older versions.
