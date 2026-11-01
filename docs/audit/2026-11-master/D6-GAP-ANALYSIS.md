# DELIVERABLE 6 — GAP ANALYSIS
Every missing / incomplete / disconnected / duplicated component, with blocker and action. Classifications per directive §20.

## 1. External blockers (BLOCKED — no code action possible)

| ID | Gap | Blocker | Action to resolve |
|---|---|---|---|
| B1 | Production deployment down | Vercel billing (HTTP 402 DEPLOYMENT_DISABLED) | Pay/restore Vercel account — code is deploy-ready (prior deployment verified: HTTP 200, db connected, Groq 1,189ms) |
| B2 | Local AI provider verification (Groq/NVIDIA/HF/OpenRouter) | Keys live only on Vercel (encrypted-at-rest; sandbox geo-blocked for several providers anyway) | Verify via production after B1, or re-supply keys for local testing |
| B5 | Real GAFI / NOSI / ETA / bank / Pinata / external-ERP integrations | No provider credentials | Obtain keys; mock-gate automatically switches to real mode (isProviderConfigured) |
| B6 | Live Inngest orchestration | Placeholder signing key | Set real INNGEST_SIGNING_KEY (format sign_...) on Vercel + local |

## 2. Deferred with authorization required (schema changes on live DB)

| ID | Gap | Risk | Proposed change |
|---|---|---|---|
| B4a | LawFirmWebhookEvent cascade-deletes with LawFirm | Contradicts append-only forensic purpose | onDelete: Restrict (needs Turso migration) |
| B4b | 47/99 models have no DB-level FK (deliberate plain-string design incl. all 15 Erp*) | Orphan prevention rests on app code (0 orphans today, verified) | Optional: add FKs in a coordinated migration — large DDL, needs approval + backup |
| B4c | User delete cascades to 23 tables (incl. cap-table, votes) | Latent (no user-delete path exists) | Add soft-delete or Restrict before any user-deletion feature ships |

## 3. Known incomplete (PARTIAL — documented, not blocking pilot)

| ID | Item | Detail |
|---|---|---|
| G1 | Eval harness for AI telemetry (hallucination/bias/drift) | Roadmap; fake metrics removed this cycle, real proxies published |
| G2 | Neon analytics replica | Stub (commented driver) — Turso serves all reads; documented |
| G3 | HSM key custody (AUD-005) | Software Ed25519 keys (seeded from FIELD_ENCRYPTION_KEY); HSM module removed as dead code this cycle — re-introduce before real capital ops |
| G4 | Enterprise nosiNumber encryption | Listed as encryption target; no encryptField call at write sites found (PII policy decision needed: encrypt-at-rest vs. hash) |
| G5 | Vote-on-open-proposal live test | Seed has no voting_open proposal (data condition) — logic unit-tested |
| G6 | Mobile horizontal overflow on /dashboard (P3) | Needs per-table overflow-x-auto pass |
| G7 | rate limiting on remaining read-GETs (148 routes without) | Mutations + credential + AI + money routes covered (68 + 9 added this cycle); GETs are lower risk — progressive hardening |
| G8 | /api/legal-templates open | Reviewed-accepted (public legal library); revisit if templates gain sensitive variables |
| G9 | `requireUser()` helper has 0 callers | Dead-ish helper (pages use getCurrentUser + redirect) — harmless |
| G10 | ai/salary vs ai/salary-engine duplication | Kept deliberately: deterministic constitutional formula vs AI-consensus engine — different products, both now validated |

## 4. Disclosed mock displays (intentional, workspace visualizations)
federation members · reality-sync bank list · institutional-memory IPFS list · company-owner GAFI linking state · antifragility Monte Carlo scenarios · credentials VC list (derived from memberships) · accounting statutory deadlines · calendar compliance deadlines · alumni aggregate totals · manager budget=burn note · tax current-status · mentorship gap analysis · career-ledger CID placeholder · drip projected-dividend · reserve-shares dialog code · KYC sandbox liveness scores · evidence-stream upload progress animation · step-kyc sandbox verification levels · anomalies/charter-diff mock seeds merged with real feeds.
All are presentation-layer placeholders for external pipelines (B5-class) or deterministic visualizations — none are presented as completed integrations on public surfaces.

## 5. Verified NON-gaps (directive: don't assume missing)
- NO missing pages: all 135 exist, none empty.
- NO broken imports (951 files checked).
- NO orphan API consumed by frontend (134 call patterns all resolve post-fix).
- NO dead nav links (115/115 hrefs → real pages).
- NO data loss (Turso 99/94/280.5M verified).
- NO duplicate services (duplicates were deleted: 22 site components, 9 lib modules; salary/salary-engine distinct purposes).

## 6. Gap counts
MISSING (code-fixable now): 0 · PARTIAL: 10 (G1–G10) · BLOCKED: 6 (B1–B6) · NOT APPLICABLE: Arabic-native OCR KYC (sandbox by design), multi-region Turso, Neo4j graph DB, K8s/Kafka (out-of-scope per prior D-D register).
