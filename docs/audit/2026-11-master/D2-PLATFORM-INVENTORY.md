# DELIVERABLE 2 — PLATFORM INVENTORY REGISTER
**Source:** 4 parallel discovery agents (full-repo read) + live probes. All counts machine-verified.

## A. Frontend — 135 pages

| Section | Count | Pages |
|---|---|---|
| `/` landing | 1 | landing sections (hero, modules, tiers, impact, security, FAQ) |
| `/dashboard` | 118 | full workspace (see group breakdown below) |
| `/enterprise` | 6 | directory, [slug] profile, trades, financials, annual-report, governance-log (all public) |
| `/legal` | 5 | index, terms, privacy, cookies, constitution |
| Other public | 5 | /signin, /register, /registry, /trust, /badge/[slug] |

**Dashboard groups (nav-config.ts, 115 items / 11 groups):**
My Workspace (6) · Capital (11) · Capital & Workforce (7) · Enterprise (11) · ERP (9) · Intelligence (12) · Compliance & Transparency (6) · Treasury & Infrastructure (9) · Graduation & Sovereignty (7) · Institutional Services (6) · Platform Admin (37, rep-gated, 6 sub-groups)

**Auth model:** dashboard layout redirects unauthenticated → `/signin?next=` (all 118); 20 pages add role gates (AccessRestricted); public pages ISR 300s. MFA: hard gate for privileged roles w/o mfaVerifiedAt; soft banner otherwise.

**Page status:** all 135 statically verified (imports resolve, no empty shells); 22 browser-verified (titles + 0 page errors): /, /signin, /dashboard, /dashboard/{portfolio, brain-ai, governance, market, opportunities, erp, copilot, graduation, admin-panel, steward, profile, passkeys, notifications, fra, law-firm}, /registry, /trust, /enterprise, /enterprise/street-bites, /legal/terms.

**Known-intentional mock displays (disclosed, not defects — see D6 §4):** federation members, reality-sync bank list, institutional-memory IPFS list, company-owner GAFI state, antifragility Monte Carlo, credentials VC list, accounting deadlines, calendar deadlines, alumni totals, manager budget note, tax status, mentorship gaps, career-ledger CID, drip projection, reserve-shares code, KYC sandbox liveness, evidence-stream progress.

## B. Backend — 216 API routes / 299 handlers

| Group | Routes | Notes |
|---|---|---|
| admin | 11 | rep-only (requireRole), audit-logged, now rate-limited (mutations) |
| ai | 28 | session + ai limiter 30/min; diagnose now rep-only |
| auth + passkey | 9 | DB-backed rate limits; scrypt→Argon2id transparent upgrade |
| erp | 22 | 21 + NEW integration/test |
| enterprises + milestones | 6 | |
| cron | 6 | CRON_SECRET fail-closed |
| v1 (public constitutional API) | 10 | CRE policies (open by design), gov (mock-gated), FRA (bearer), webhook (Ed25519) |
| public | 6 | registry/stats/enterprise transparency (CORS *) |
| Domain groups | 118 | proposals, orders, vault, dividends, takaful, succession, gaas, graduation, fx, oracle, etc. (full list in api-probe-results.jsonl) |

**Auth distribution (measured):** 161 session · 13 session+RBAC · 6 cron-token · 1 FRA-token · 1 API-key (v1 enterprise data) · 2 body/header API-key (oracle, risk-profile) · 1 Ed25519 webhook · 2 auth-flow-open · 15 public-by-design (health/ready/platform-health/fx-consensus/cre-policies/legal-templates/evidence-list/public×6) — all public routes reviewed; sensitive ones (diagnose, metrics) now gated.

**Validation:** 87 zod / 62 manual / 67 no-body (GET). Error handling: 215/216 wrapped (withErrorHandler or try/catch).

## C. Lib layer — 85 modules (94 − 9 dead deleted)

| Domain | Modules |
|---|---|
| Core infra | db, env, logger, audit, api-handler, validation (682-line zod), rate-limit (hybrid DB), idempotency, constants, format, nav-config, csrf-client, offline-cre, offline-pwa-config, mock-gate, cron-auth |
| Auth/crypto | auth, password-v2 (Argon2id), password (legacy, seeds only), passkey, passkey-challenge, account-lockout, encryption (AES-256-GCM), signing (Ed25519), law-firm-webhook |
| CRE | cre (2,378 lines, 52 policies), constitutional-endorsement, gaas |
| AI | ai, ai-router (5 providers/28 models/27 tasks), oracle-network |
| ERP | erp (2,820 lines), erp-integration (NetSuite/Odoo/SAP/custom), industry-modules |
| Markets/econ | matching-engine (FIFO §9.6), trade-matching, circuit-breaker, priority-allocation, enterprise-discovery, arei, zeitgeist, fx-oracle-real (CBE/ECB/CoinGecko/Binance), fx-oracle (mock fallback), dividend-distribution, productive-egp, profit-sharing, supply-chain-finance, takaful-pool, cooperative-network |
| Governance/compliance | quadratic-voting, gov-api (mock-gated), risk-profile, soulbound-credential, graduation-bond, standalone-succession (Shamir k-of-n), transparency (§8.6.2 sanitization), constitutional-wages, salary-engine, health-rating, enterprise-genome, intelligence-graph, diaspora-corridor, ipfs |
| Docs-as-code (frozen registers) | 21 modules (FOCC, AOS, governance, architecture, risk, readiness, GLS, PE, ITDB, MES, MAS, CPR, SPRRE, FIEW, ACS, first-25, constitutional-audit, legal-disclaimer, legal-clauses, legal-templates, terminology) |
| Workflow | inngest (2 wired functions, defensive init), neon (stub, documented) |

## D. Database — 99 models / 99 tables

Domain map: Identity 6 · Platform-infra 6 · Enterprise core 7 · Governance 7 · Treasury 10 · HR 5 · Fundraising/market 13 · Ledger/records 8 · Succession/legal 6 · AI/analytics 15 · ERP 15 · Compliance 1 = **99** ✓

Production Turso (verified this cycle): 99 tables · 94 rows · 256 indexes · 0 FK orphans (15 checks) · capital 280,500,000 EGP exact · ledger chain 7 events hash-linked · 5 users (L2–L4) · 4 enterprises (tiers A/C/D/F) · 2 law firms · 2 accounting firms.

## E. Integrations (13 external)

| Integration | Status | Evidence |
|---|---|---|
| Turso (primary DB) | **LIVE** | connected, 99 tables, 1.1s RTT from sandbox |
| Groq / NVIDIA / Gemini / HuggingFace / OpenRouter | **CONFIGURED (Vercel)** — keys verified present (19 env vars, encrypted-at-rest); Groq+Gemini verified working in prior production cycle; local sandbox geo-blocked for 4 | Vercel API env listing |
| CBE / ECB / CoinGecko / Binance (FX oracle) | **LIVE** | /api/fx/consensus 200 with real 4-source median |
| Inngest | SANDBOX (placeholder keys — SDK crash fixed, degrades safely) | /api/inngest 200 sandbox payload |
| Neon (analytics replica) | STUB (documented, falls back to Turso) | neon.ts commented driver |
| GitHub (CI/CD source) | **LIVE** | platform-health: connected, repo Aurienta/Aurienta |
| Vercel (host) | **BLOCKED — billing (HTTP 402)** | curl evidence |
| GAFI / NOSI / ETA / Bank(EVE) / Pinata / ext-ERP sync | MOCK-GATED fail-safe (no credentials — B5) | mock-gate.ts |

## F. Cross-reference findings (backend w/o frontend & vice versa)
- Frontend calls a missing endpoint: **1 found → FIXED** (erp/integration/test).
- Backend endpoints never called by frontend: majority of REST surface is used by pages OR is public/constitutional API (external consumers) — no orphan internal API found (134 distinct frontend call patterns, 133 pre-existed + 1 created).
- Dead frontend tree (site/, 22 files) → deleted (0 importers).
