# AURIENTA — Project Structure

**Last reorganized:** 2026-10-28 (COO/CTO/PM full-platform reorganization)
**Purpose:** Single source of truth for where everything lives. No fragmentation.

---

## Root layout

```
/ (root)
├── src/                        # Application code (Next.js 16 App Router)
│   ├── app/                    # Routes: 135 pages + 215 API endpoints
│   │   ├── (public)/           # Landing, signin, register, legal, trust
│   │   ├── dashboard/          # 118 authenticated dashboard pages
│   │   └── api/                # 215 API route handlers
│   ├── components/             # 289 React components (shadcn/ui + custom)
│   │   ├── ui/                 # shadcn/ui primitives (do not edit)
│   │   ├── dashboard/          # Dashboard feature components
│   │   ├── landing/            # Landing page components
│   │   └── ultra/              # GPU-accelerated Three.js components
│   ├── lib/                    # 100 modules
│   │   ├── db.ts               # Prisma client (Turso adapter)
│   │   └── aurienta/           # 94 platform modules (CRE, ERP, AI router…)
│   └── hooks/                  # React hooks
│
├── prisma/                     # Database
│   ├── schema.prisma           # 99 models
│   ├── migrations/             # Migration history
│   └── seed.ts                 # Demo data seeder
│
├── public/                     # Static assets (favicon, images)
│
├── docs/                       # ALL documentation (single home)
│   ├── blueprint/              # Authoritative platform blueprint + amendments
│   ├── legal/                  # Legal agreement documents (.docx)
│   ├── audit/
│   │   ├── 2026-10-master/     # Master audit cycle (Phases 1–8 + COO audit)
│   │   │   ├── registers/      # Phase 1 registers (routes/API/DB/AI/mocks)
│   │   │   ├── coo-audit/      # COO end-to-end audit + stress test data
│   │   │   └── screenshots/    # Current-cycle evidence screenshots
│   │   ├── reports/            # 21 historical audit reports (Oct 12–22)
│   │   └── registers/          # 7 CSV registers (wiring, roles, screens…)
│   ├── guides/                 # DEPLOYMENT.md, PLATFORM_HARMONY.md
│   ├── examples/               # websocket demo code
│   └── worklog.md              # Cumulative engineering worklog (2.2 MB)
│
├── scripts/                    # Operational scripts (all executable via bun)
│   ├── db/                     # DB ops (apply-schema, turso-setup, seed…)
│   ├── audit/                  # DB audit scanners
│   ├── ops/                    # Backup, restore, keepalive, prewarm, CI checks
│   └── blueprint/              # Historical blueprint generators
│
├── .github/                    # CI (lint + typecheck + build + security scans)
│
└── (config files)              # package.json, tsconfig, eslint, tailwind,
                                # next.config, prisma.config, vercel.json,
                                # components.json, Caddyfile, .env.example
```

## What was reorganized (2026-10-28)

| Before | After | Why |
|---|---|---|
| 30 audit/report files in root | `docs/audit/reports/` + `docs/audit/registers/` | Root was unreadable; reports now grouped |
| `AUDIT/` (46 files, mixed cycles) | `docs/audit/2026-10-master/` | Current audit cycle, clearly dated |
| `screenshots/` (189 files, 67 MB) | Removed (backed up to `.backups/`) | Stale evidence; repo leaner by 67 MB |
| `audit-screenshots/` (53 files, 18 MB) | Removed (backed up to `.backups/`) | Stale evidence |
| `skills/` (1075 files) | Untracked (local-only) | Dev tooling, not app code — 42% of repo weight |
| `agent-ctx/`, `.zscripts/` | Untracked (local-only) | Sandbox-local working files |
| `download/*.docx` | `docs/blueprint/` + `docs/legal/` | Documents belong in docs |
| `scripts/` (26 flat files) | `scripts/{db,audit,ops,blueprint}/` | Grouped by purpose |
| `worklog.md` (root, 2.2 MB) | `docs/worklog.md` | Documentation home |
| `Dockerfile` | Deleted | Unused — Vercel is the deploy target |
| `examples/` | `docs/examples/` | Reference code belongs in docs |
| `keepalive.sh` (root) | `scripts/ops/` | Ops script grouping |

## Rules going forward

1. **No new files in root.** New reports → `docs/audit/reports/`. New ops scripts → `scripts/ops/`.
2. **`src/` is route-driven.** Next.js App Router conventions apply — page.tsx/route.ts placement is non-negotiable.
3. **Screenshots are evidence, not repo content.** Store in `.backups/` or the current audit cycle folder only; never commit 100+ MB of images.
4. **The blueprint is authoritative.** `docs/blueprint/BLUEPRINT_VERSION.json` tracks the canonical version. All implementation references cite volume/section.
5. **Local-only tooling stays local.** `skills/`, `.zscripts/`, `agent-ctx/` are gitignored — never commit them.

## Cloud topology

```
GitHub (Aurienta/Aurienta)  →  source of truth; push triggers CI
Vercel (aurienta.vercel.app) →  auto-deploy from main; env vars managed in dashboard
Turso (aurienta-fortleem)    →  primary DB (libsql, 99 tables)
```

All three verified in harmony — see `docs/audit/2026-10-master/PHASE-7-REMEDIATION-REPORT.md`.
