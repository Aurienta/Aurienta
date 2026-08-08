# TRANSPARENCY-LEGAL — Egypt PDPL-Compliant Transparency Features

Task ID: **TRANSPARENCY-LEGAL**
Agent: Transparency-Legal Builder
Scope: Implement Egypt-legal transparency features (PDPL Law 151/2020 compliant) — public registry, real-time financial dashboard, CRE decision log, trade log, annual report, transparency score.

## PDPL Compliance Approach

Egyptian PDPL (Law 151/2020) restricts publication of personal data (names, IDs, contact details) without consent. AURIENTA's constitutional charter (Article XIV) provides the enterprise-level consent basis for publishing enterprise financials, governance, and aggregate data. This implementation:

- **NEVER** publishes personal names, emails, mobile numbers, or national IDs on public pages.
- **Anonymizes** partner references as `Partner #NNNN` (stable, sequential index per enterprise — same user always gets the same index within an enterprise).
- **Anonymizes** CRE decision actors as `"Constitutional Partner"` (if actorId is set) or `"System"` (if null) — never resolves actorId to a personal name.
- Returns only **enterprise-level** data (financials, governance, compliance counts) on public APIs.
- Law firm + accounting firm names are returned (these are **institutions**, not personal data).
- Every public page and every public API response includes:
  - PDPL notice: "Personal data is protected under Egyptian PDPL Law 151/2020. Enterprise data is published per constitutional charter Article XIV."
  - Disclaimer: "AURIENTA is a constitutional infrastructure platform, not an official government registry. Data is self-reported by enterprises and verified by the CRE."

## Schema Changes (prisma/schema.prisma)

1. Added `transparencyScore Int @default(0)` to `Enterprise` (0-100 PDPL-aware score).
2. Added `annualReports AnnualReport[]` relation to `Enterprise`.
3. New `AnnualReport` model:
   - `enterpriseId`, `year` (unique pair), `fiscalYearEnd`, `revenueEgp`, `netProfitEgp`, `totalAssetsEgp`, `totalLiabilitiesEgp`, `auditStatus` (pending/audited/published), `auditorName`, `auditorLicense`, `brainAiAssessment`, `ipfsCid`, `publishedAt`, `createdAt`.
   - `@@unique([enterpriseId, year])`, `@@index([enterpriseId])`, `onDelete: Restrict`.

`bun run db:push` ran cleanly; Prisma Client regenerated.

## New API Routes (all public, no auth, CORS-open, `X-Aurienta-PDPL-Compliant: 151/2020` header)

1. **`/api/public/registry`** (GET) — paginated public registry. Query params: `q` (search), `tier`, `sector`, `status`, `limit`, `cursor`. Returns enterprise-level data only: name, slug, tier, stage, sector, legal form, health rating/score, raised/goal/share price/total shares, partner count (COUNT ONLY), employee count, NOSI %, police clearance (boolean), graduation readiness, transparency score, status, createdAt, law firm (name + license), accounting firm (name + ESAA license). Cursor-based pagination on `createdAt`.

2. **`/api/public/enterprise/[slug]/transparency`** (GET) — computes the 0-100 transparency score live. Breakdown: quarterly reports filed (20), CRE decision log exists (15), annual report published (20), real-time financial dashboard accessible (10, always true), trade log exists (10), partner count visible (10, always true if >0 partners), Brain AI assessment exists (15). Returns tier (Platinum/Gold/Silver/Bronze). Persists the computed score to `Enterprise.transparencyScore` (best-effort, non-blocking).

3. **`/api/public/enterprise/[slug]/cre-decisions`** (GET) — paginated CRE decision log. Reads `LedgerEvent` where `eventType = "cre_decision"`. Parses payload for `policy`, `decision` (allowed/denied), `reason`. Anonymizes `actorId` as `"Constitutional Partner"` or `"System"` — never resolves to a name. Truncates Ed25519 decision token to `head(16)…tail(6)` for display; full token remains verifiable via the API payload hash.

4. **`/api/public/enterprise/[slug]/trades`** (GET) — paginated filled-order trade log. Builds a **stable partner index** per enterprise: queries all filled orders ascending by `createdAt`, maps `userId → Partner #NNNN` (sequential, 4-digit padded). Returns timestamp, side (buy/sell), units, price, total value, fees, phase, anonymized `partnerRef`, and CRE price-band verification result (`verified` / `exceeded_upper_band` / `breached_lower_band`) with deviation % vs the constitutional CPP (±5% band per Rule I 1.5). Also returns `totalTrades` and `uniquePartners` aggregates.

5. **`/api/ai/annual-report`** (POST, auth required) — Brain AI generates the annual assessment. Body: `{ enterpriseId, year }`. RBAC: founding_operator / company_owner / board_member / accounting_firm_rep / aurienta_rep (also requires EnterpriseMember). Pulls a full year of: ledger events, proposals, expenses, milestones, quarterly reports, valuations, filled orders. Aggregates total revenue, net profit, approved expenses, released milestones. Calls `askConstitutionalAI` (kind=`advisory`, consensus mode, persisted as AiArtifact) with a strict 7-section system prompt (Executive Summary, Financial Performance, Governance Activity, Treasury & Capital Discipline, Compliance Posture, Constitutional Maturity, Brain AI Recommendations). All user-controlled text wrapped in UNTRUSTED-DATA delimiters. Upserts the AnnualReport row inside a `db.$transaction` and appends a `cre_decision` ledger event recording the report generation. Audits via `audit()`.

## New Pages

1. **`/app/registry/page.tsx`** — public registry page (no login). Client component with debounced search + tier/sector/status filters + cursor pagination + "Load more". Gold-themed cards showing enterprise summary, progress bar, compliance badges (Police, NOSI, Transparency), and counterparty (law firm + accounting firm). PDPL + disclaimer notices at top. "JSON API" external link. `PublicTrustHeader active="registry"` + `PublicTrustFooter`.

2. **`/app/enterprise/[slug]/financials/page.tsx`** — real-time financial dashboard. Server component fetches enterprise + quarterly reports. Vital signs row (monthly revenue, monthly burn, escrow balance, runway). Health rating block (AAA-CCC). Vital metrics grid (gross margin, revenue growth, NOSI, police clearance, employees, share price, raised, goal). `<QuarterlyFinancialsChart>` (existing component). `<BrainAiFinancialNarrative>` (new client component — calls `/api/ai/explain` with the financial snapshot; falls back to a deterministic local summary if 401). Counterparty cards. Disclaimer block with "Data updated per milestone release. Audited annually per constitutional charter." PDPL notice at top.

3. **`/app/enterprise/[slug]/governance-log/page.tsx`** — public CRE decision log. Server component computes summary stats (total, allowed, denied counts via `payload.contains` heuristic for `allowed:true`/`allowed:false`). `<PublicCreDecisionLog>` (new client component) fetches from the public CRE-decisions API, supports filter pills (all/allowed/denied) + policy search + cursor pagination + custom gold scrollbar. Each decision shows: policy name, decision badge (green check / red X), reason, anonymized actor (`Constitutional Partner` / `System`), truncated decision token, payload hash. PDPL + disclaimer blocks.

4. **`/app/enterprise/[slug]/trades/page.tsx`** — public trade log. Server component computes summary stats (total trades, unique partners, CPP, price band). `<PublicTradeLog>` (new client component) fetches from the public trades API. Filter pills (all/buy/sell + all/verified/flagged). Each trade shows: side badge (B/S), units, price, total value, fees, anonymized `Partner #NNNN`, phase, CRE price-band verification result with deviation %. PDPL + disclaimer blocks.

5. **`/app/enterprise/[slug]/annual-report/page.tsx`** — public annual report. Server component fetches latest + prior AnnualReport rows + auditor info. If no report exists, shows a "no annual report published yet" card with `<AnnualReportGenerator>` (new client component — POSTs to `/api/ai/annual-report`; handles 401 with sign-in prompt, 403 with role explanation). If latest report exists, shows: financial summary grid (annual revenue, net profit, total assets, total liabilities), auditor + audit status cards, full Brain AI assessment (scrollable article), prior reports list, and a regenerate button. PDPL + disclaimer blocks.

## New Client Components (in `src/components/transparency/`)

1. **`brain-ai-financial-narrative.tsx`** — fetches `/api/ai/explain` with the enterprise financials snapshot; falls back to a deterministic local summary on 401 (no login wall). Gold-themed card with Brain icon, loading spinner, advisory disclaimer.

2. **`public-cre-decision-log.tsx`** — fetches `/api/public/enterprise/[slug]/cre-decisions`, supports filter pills + policy search + load-more, custom gold scrollbar via styled-jsx.

3. **`public-trade-log.tsx`** — fetches `/api/public/enterprise/[slug]/trades`, supports filter pills + load-more, color-coded side/verify badges.

4. **`annual-report-generator.tsx`** — POSTs to `/api/ai/annual-report` to trigger Brain AI annual report generation. Handles 401 (sign-in prompt) and 403 (role explanation). Auto-reloads on success.

5. **`transparency-score-badge.tsx`** — fetches `/api/public/enterprise/[slug]/transparency` and renders a tiered badge (Platinum/Gold/Silver/Bronze) with progress bar + expandable breakdown. Two variants: `default` (full card) and `compact` (pill).

## Modifications to Existing Files

1. **`src/components/site/site-header.tsx`** — added "Registry" link to NAV (uses `Link` for the external route vs `<a>` for in-page anchors). Visible in both desktop and mobile menus.

2. **`src/components/trust/public-shell.tsx`** — `PublicTrustHeader` now accepts `active?: "trust" | "badge" | "registry"` and includes a "Registry" nav link before "Trust".

3. **`src/app/enterprise/[slug]/page.tsx`** — added PDPL compliance notice to the Constitutional Partners section, added a 4-card grid linking to the 4 new public pages (financials, governance-log, trades, annual-report), and mounted `<TransparencyScoreBadge slug={ent.slug} />`. Added `PublicLinkCard` helper. Imports: `FileText, ScrollText, Activity` from lucide-react; `TransparencyScoreBadge` from `@/components/transparency/transparency-score-badge`.

4. **`src/app/badge/[slug]/page.tsx`** — added `<TransparencyScoreBadge slug variant="compact" />` under the constitutional hash, plus a PDPL notice block before the CTA.

5. **`src/app/trust/page.tsx`** — added "Browse the Constitutional Registry" CTA button (primary) + a PDPL compliance notice paragraph.

## Verification

- `bun run db:push` — clean.
- `bun run lint` — 0 errors, 0 warnings.
- HTTP checks (all 200):
  - `GET /api/public/registry?limit=2` — returns enterprises with `transparencyScore`, `partnerCount`, anonymized counterparties.
  - `GET /api/public/enterprise/street-bites/transparency` — returns score=20 (Bronze), full breakdown.
  - `GET /api/public/enterprise/street-bites/cre-decisions?limit=2` — empty list (no cre_decision events yet for Street Bites).
  - `GET /api/public/enterprise/street-bites/trades?limit=2` — empty list (no filled orders yet).
  - `GET /registry` — 200.
  - `GET /enterprise/street-bites/financials` — 200.
  - `GET /enterprise/street-bites/governance-log` — 200.
  - `GET /enterprise/street-bites/trades` — 200.
  - `GET /enterprise/street-bites/annual-report` — 200 (with AnnualReportGenerator button since no report exists yet).
  - `GET /enterprise/street-bites` (profile) — 200 with new transparency sections.
  - `GET /badge/street-bites` — 200 with transparency badge.
  - `GET /trust` — 200 with registry CTA.
  - `GET /` (home) — 200 with Registry nav link.

## Notes

- The annual-report page initially failed with a 500 due to a `<style jsx>` block inside a Server Component (styled-jsx requires "use client"). Removed the styled-jsx block; the scroll container now uses default browser styling. Lint clean.
- The `AnnualReport.brainAiAssessment` text is rendered with `whitespace-pre-line` so the AI's newlines are preserved.
- The transparency score API is non-blocking on the `Enterprise.update` write — if the write fails (e.g., race), the response still returns the freshly-computed score so the user sees correct data.
- Partner anonymization is **stable per enterprise** — the same `userId` always maps to the same `Partner #NNNN` within an enterprise (because we sort by `createdAt: asc` and assign sequential indices). Across enterprises the same user gets different indices (intentional — no cross-enterprise correlation).
- The `cre_decision` event payload heuristic for `allowed:true` / `allowed:false` counts works because the existing freeze/unfreeze/feasibility/survival-drill/mentorship endpoints all write the boolean in that exact JSON form. If a future writer uses a different shape, the count heuristic may undercount — but the per-event `decision` field is parsed correctly from either `parsed.decision` (string) or `parsed.allowed` (boolean).
