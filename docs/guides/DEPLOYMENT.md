# AURIENTA — Multi-Platform Deployment Guide

## Platform Architecture

```
                    ┌──────────────┐
                    │   GitHub     │ (source of truth)
                    │  CI/CD       │
                    └──────┬───────┘
                           │ push to main
                    ┌──────▼───────┐
                    │   Vercel      │ (Next.js host)
                    │  aurienta.     │
                    │  vercel.app   │
                    └──┬───┬───┬───┘
                       │   │   │
          ┌────────────┘   │   └────────────┐
          │                │                │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
   │   Turso      │  │   Inngest    │  │    Neon     │
   │  (libSQL)    │  │  (workflows) │  │ (PG replica)│
   │  Primary DB  │  │  Crons/Jobs  │  │  Analytics  │
   └──────────────┘  └──────────────┘  └─────────────┘
```

## Platform Connections

### 1. GitHub (Source of Truth)
- Repo: `github.com/Aurienta/Aurienta`
- Branch: `main` (protected)
- CI: GitHub Actions (lint + typecheck + build)

### 2. Vercel (Next.js Host)
- URL: `aurienta.vercel.app`
- vercel.json: cron jobs configured
- Env vars: all set in Vercel dashboard
- Auto-deploy from `main` branch

### 3. Turso (Primary Database — libSQL)
- URL: `libsql://aurienta-fortleem.aws-us-east-1.turso.io`
- Auth: `TURSO_AUTH_TOKEN`
- 56 models, 109+ indexes
- Backup: daily (scripts/backup-turso.sh)

### 4. Inngest (Serverless Workflows)
- URL: `https://api.inngest.com`
- Key: `INNGEST_EVENT_KEY`
- Workflows: dispute resolution (6-stage), graduation, succession, verification SLA
- Crons: stage-transition, CRCICA, health-rating, verification-SLA

### 5. Neon (PostgreSQL Analytics Replica)
- URL: `NEON_DATABASE_URL` (PostgreSQL)
- Pooler: `NEON_DATABASE_POOLER_URL` (PgBouncer)
- Purpose: read-heavy analytics (dashboard stats, audit aggregation)
- Sync: Turso → Neon via Prisma multi-datasource

### 6. AI Providers (6-model failover)
- Gemini (complex reasoning)
- OpenAI GPT-4 (conversational)
- Groq Llama 3.2 (low-latency)
- HuggingFace Mixtral 8x7B (sanity check)
- OpenRouter (multi-model gateway)
- NVIDIA NIM Nemotron 70B (enterprise)
- Failover: if one fails → next in task-specific order → OpenRouter → NVIDIA → safe fallback

## AI Model Failover Logic
1. Task-specific provider order (e.g., feasibility: Gemini → OpenAI → Groq)
2. If primary fails → try next provider
3. If all task providers fail → try OpenRouter (multi-model gateway)
4. If OpenRouter fails → try NVIDIA
5. If ALL fail → return safe fallback message (CRE rules still enforced)

## Cross-Platform .env Connections
- `DATABASE_URL` (Turso) → used by Vercel + local dev
- `INNGEST_EVENT_KEY` → used by Vercel functions to trigger Inngest workflows
- `NEON_DATABASE_URL` → used by Vercel for analytics queries
- `GITHUB_TOKEN` → auto-set by GitHub Actions for Vercel deploy
- All secrets set in Vercel dashboard (Settings → Environment Variables)

## Deployment Checklist
- [ ] GitHub: push to main triggers CI
- [ ] Vercel: auto-deploy from main
- [ ] Turso: DATABASE_URL + TURSO_AUTH_TOKEN set in Vercel
- [ ] Inngest: INNGEST_EVENT_KEY set in Vercel + Inngest dashboard points to Vercel
- [ ] Neon: NEON_DATABASE_URL set in Vercel (optional, analytics only)
- [ ] AI: at least one AI provider key set (GEMINI_API_KEY recommended)
- [ ] FIELD_ENCRYPTION_KEY set (32-byte base64)
- [ ] SESSION_SECRET set (32-byte base64)
- [ ] CRON_SECRET set (for cron endpoints)
- [ ] FRA_ACCESS_TOKEN set (for regulatory dashboard)
