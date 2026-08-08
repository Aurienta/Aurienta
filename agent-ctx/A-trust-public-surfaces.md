# Task A — Trust & Public surfaces

Agent: Full-stack developer (Trust & Public surfaces)
Task: Build #13 Zero-Custody Proof + #28 Public Trust Dashboard + #29 Constitutional Guarantee Badge + #32 Open Constitutional API + #15 Live Evidence Streaming to IPFS.

## Work Log

1. Read `/home/z/my-project/worklog.md` (last ~250 lines) to absorb the existing foundation: Prisma schema (15+ models incl. IpfsEvidence, GraduationRecord, LawFirm, Enterprise, LedgerEvent, User), the `lib/aurienta/*` helpers (auth, constants, format, cre, ai with `mockCid()`/`mockHash()`), the luxury gold-on-near-black design system in `globals.css`, and the AurientaMark/Wordmark/Logo/GoldStar components.
2. Inspected existing patterns: `src/app/api/proposals/route.ts` (auth-gated POST pattern + `appendLedgerEvent` usage), `src/app/signin/page.tsx` + `auth-footer.tsx` (sticky footer pattern), `src/components/site/site-header.tsx` + `section-heading.tsx` + `reveal.tsx` (public surface styling).
3. Created `src/app/api/public/stats/route.ts` — the Open Constitutional API (#32): public GET, no auth, CORS-enabled (`Access-Control-Allow-Origin: *`), aggregates from Enterprise + LawFirm + User + GraduationRecord. Returns the exact JSON shape specified: `constitutionalHash`, `zeroCustody.{aurientaHeldEgp=0, escrowTotalEgp, firms[], lastReconciliation}`, `capitalDeployedEgp`, `enterprises.{total,active,graduated,byTier}`, `partners`, `jobsCreated`, `creUptimePct=99.95`, `aiHealth.{hallucinationRate=0.004,biasDisparity=0.12,driftKl=0.06}`, `lastUpdated`. Includes OPTIONS preflight handler.
4. Created `src/app/api/evidence/route.ts` (#15) — POST: validates body `{enterpriseId, milestoneId?, filename, mimeType, sizeBytes, description?}`, requires auth, enforces membership OR trusted-role (law_firm_rep/accounting_firm_rep/aurienta_rep), validates milestone belongs to enterprise, enforces 1B–250MB size, calls `mockCid()` to mint an IPFS CID, creates an `IpfsEvidence` record, appends a hash-chained `evidence_published` or `milestone_released` ledger event via `appendLedgerEvent()` (payload includes the CID, file metadata, IPFS gateway URI, Filecoin deal ID, 10-year retention). Also supports GET (list recent evidence, with `?enterpriseId=` and `?limit=` query params, CORS-enabled — radical transparency).
5. Created `src/app/api/evidence/[cid]/route.ts` (#15) — GET: returns full evidence metadata by CID, including the joined enterprise (name, slug, tier, healthRating, stage), the `ipfsUri`, `pinned: true`, `filecoinDeal`, `retentionYears: 10`. Public, no auth. CORS-enabled. Returns 404 when CID not found.
6. Created `src/components/trust/evidence-stream.tsx` (#15) — client component taking `enterpriseId` + optional `milestoneId` + `enterpriseName` props. Drag-and-drop upload zone with file input, optional description textarea, fake progress bar while the POST is in flight, success/error states, framer-motion transitions, Sonner toasts on success/failure. After upload, prepends the new evidence to a list and re-fetches `/api/evidence?enterpriseId=…` for consistency. Each evidence item shows the file icon (image/PDF/generic), filename, size, mime, CID (truncated), relative timestamp, optional description, milestone tag when present, and a "View on IPFS" link to the public `ipfs.io` gateway. Includes the IPFS pinning + 10-year Filecoin deal footer note. Mounts its own SonnerToaster so it works in any host page.
7. Created `src/components/trust/public-shell.tsx` — shared `PublicTrustHeader` (sticky glass nav with AurientaMark + wordmark + tagline, Trust/Sign in/Back-to-overview links, `active` prop highlights the current surface) and `PublicTrustFooter` (sticky `mt-auto`, gold hash tagline, founding-principle quote "Dependency is transitional. Sovereignty is the destination.", Zero Custody / AI Enforced / Law-firm escrow badges, FRA no-action-letter footer line). Both pair with `<div className="min-h-screen flex flex-col">` + `<main className="flex-1">` so the footer sticks on short pages and pushes naturally on long pages.
8. Created `src/app/trust/page.tsx` (#13 + #28) — public, no-auth, server-component Trust Dashboard. Sections:
   - **Hero**: large glowing AurientaMark, "Constitutional Trust — Proven, Not Promised." headline, founding-principle blockquote (Vol I §1.1), constitutional hash + "Live · reconciled 2m ago" pill.
   - **Zero-Custody Proof Panel** (centerpiece): two giant stat cards — `AURIENTA-held funds: 0.00 EGP` (emerald, always zero, `zero_custody.rego` + Zero-Custody Linter badges) and `Escrow held by licensed law firms: 16.78M EGP` (gold, with FRA-licensed + 100M-insurance badges). Live reconciliation banner with pulsing emerald dot linking to `/api/public/stats`. Zero-Custody Linter note. Per-law-firm breakdown grid — Nile Legal + Cairo Trust each show name, FRA license, insurance (120M / 100M EGP), expertise score, escrow under custody (4.38M / 12.4M EGP), enterprise count.
   - **Platform KPIs**: 6 stat cards (capital deployed 280.5M EGP, active enterprises 3, graduated 1, jobs created 290, CRE uptime 99.95%, constitutional partners 5) + by-tier grid (A/C/D/F).
   - **AI Health Panel**: Gemma 2 7B oversight tag, enforcement model tag (GLM-4.6 + Mixtral 8x22B), 3 metric cards — Hallucination rate 0.4% (green), Bias disparity 12% (green), Drift KL 0.06 (green) — each with a 30-day detail line and color-coded CheckCircle2/AlertCircle indicator.
   - **Compliance Integrations**: 6-card grid — FRA (no-action letter), GAFI, NOSI, MOI (police clearance), ETA (10% CGT), ESAA — each with its regulator icon, full name, integration detail, and a pulsing "API connected" green dot.
   - **Recent Graduations**: SmartFarm Egypt graduation record — Tier C → sovereign, health 96, readiness 100, sovereign-certified badge, testimonial, "View constitutional badge" CTA linking to `/badge/smartfarm-egypt`.
   - **CTA strip**: "Verify any enterprise on the constitutional badge" with sample-badge + JSON API buttons.
9. Created `src/components/trust/embed-snippet.tsx` — client component for the badge embed code. Shows the iframe snippet in a monospace box, with a "Copy snippet" button that uses `navigator.clipboard.writeText` and shows a Sonner toast. Falls back gracefully if clipboard is unavailable.
10. Created `src/app/badge/[slug]/page.tsx` (#29) — public, no-auth, server-component badge page. Looks up enterprise by slug (404 via `notFound()` if missing). Renders:
    - Badge card with glowing AurientaMark, "AURIENTA Constitutional Guarantee Badge" eyebrow, enterprise name + tagline, Tier pill (Tier letter + tier name + legal form from `TIER_META`), Health rating pill (color-coded by AAA/AA/A/BBB/BB/B/CCC), Score pill, constitutional hash + enterprise ID pills.
    - **Sovereign Survivability Certified** badge (emerald) when `enterprise.status === "graduated"` OR a graduationRecord exists — shows final health, maturity, readiness scores, graduation date, export hash.
    - **Compliance badges grid**: Zero Custody (always on), AI Enforced (always on), NOSI Compliant (on when `nosiCompliantPct >= 100`), Police Clearance Verified (on when `policeClearanceValid`). Each badge is emerald when on, red "pending" when off.
    - **Quick stats**: capital raised, escrow held, workforce, stage.
    - **Service providers**: escrow law firm (name + license + insurance), accounting firm (name + ESAA license).
    - **Verify on ledger**: latest 3 `LedgerEvent`s with numbered dots, event type, ISO timestamp, parsed JSON payload in a mono box, payload hash, prev hash (chain link), cre decision token.
    - **Embed snippet**: `<iframe src="https://…/badge/{slug}" …>` with copy button.
    - CTA strip linking back to `/trust` and `/api/public/stats`.
11. Ran `bun run db:generate` + `bun run db:push` to regenerate the Prisma client with the `IpfsEvidence` + `GraduationRecord` model accessors (the running dev server had a stale singleton in `globalForPrisma.prisma`).
12. Fixed two schema-edge-case bugs: (a) `GraduationRecord` has no Prisma relation back to `Enterprise` (only a bare `enterpriseId` FK) — switched `/trust` to query enterprises separately and merge by ID; (b) `Enterprise` has no `graduationRecord` relation either — switched `/badge/[slug]` to query `graduationRecord` separately after the enterprise lookup.
13. Restarted the dev server with `nohup setsid bash -c 'exec bun run dev'` to pick up the freshly-generated Prisma client (the `globalForPrisma` cache held the old client instance that lacked `ipfsEvidence`/`graduationRecord` accessors).
14. Ran `bun run lint` — exit 0, no errors, no warnings on any of my owned files.
15. End-to-end verified with curl:
    - `GET /api/public/stats` → 200 with the exact specified JSON shape (constitutionalHash, zeroCustody.aurientaHeldEgp=0, escrowTotalEgp=16780000, firms[2], capitalDeployedEgp=280500000, enterprises.byTier={A:1,C:1,D:1,F:1}, partners=5, jobsCreated=290, creUptimePct=99.95, aiHealth).
    - CORS preflight `OPTIONS /api/public/stats` → 204 with `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`.
    - `GET /api/evidence?enterpriseId=x` → 200 (empty list before any uploads).
    - `GET /api/evidence/invalid` → 404.
    - `GET /trust` → 200; HTML contains "Constitutional Trust", "Zero-Custody", "AURIENTA-held", "Nile Legal", "Cairo Trust", "FRA", "GAFI", "NOSI", "Hallucination rate", "Constitutional Hash", "Graduation".
    - `GET /badge/street-bites` → 200; HTML contains "Constitutional Guarantee Badge", "Tier A", "BBB", "Zero Custody", "AI Enforced", "NOSI", "Police Clearance", "Verify on ledger", "Embed this badge".
    - `GET /badge/ecopack-solutions` → 200.
    - `GET /badge/nile-brew-cafe` → 200.
    - `GET /badge/smartfarm-egypt` → 200; HTML contains "Sovereign Survivability Certified", "Tier F", "AAA", "graduated".
    - `GET /badge/nonexistent` → 404.
    - `POST /api/evidence` (auth as Layla, Street Bites) → 201 with `cid`, `record`, `ledgerEvent: "evidence_published"`. Ledger event appended with hash-chain: new `payloadHash` matches the previous event's hash.
    - `POST /api/evidence` with `milestoneId` → 201 with `ledgerEvent: "milestone_released"`.
    - `POST /api/evidence` (no auth) → 401 "Not authenticated".
    - `POST /api/evidence` (invalid body `{}`) → 400 "enterpriseId, filename, mimeType and sizeBytes are required".
    - `POST /api/evidence` (non-member enterprise) → 404 "Enterprise not found".
    - `POST /api/evidence` (foreign milestoneId) → 400 "Milestone not found or does not belong to this enterprise".
    - `POST /api/evidence` (sizeBytes > 250MB) → 400 "sizeBytes must be between 1 and 262144000 (250 MB)".
    - `GET /api/evidence/[cid]` after upload → 200 with full metadata + `enterprise` relation + `ipfsUri` + `pinned: true` + `filecoinDeal` + `retentionYears: 10`.
16. Cleaned up all test evidence + ledger events from the DB so the demo state is pristine (0 IpfsEvidence records remain).

## Stage Summary

### Files created (7):
- `src/app/api/public/stats/route.ts` — Open Constitutional API (#32): public GET, no auth, CORS-enabled, aggregate platform health JSON.
- `src/app/api/evidence/route.ts` — POST upload evidence to mock IPFS + GET list recent evidence (#15). Auth-gated POST, public GET, both CORS-enabled.
- `src/app/api/evidence/[cid]/route.ts` — GET fetch evidence metadata by CID (#15). Public, CORS-enabled, returns 404 when not found.
- `src/components/trust/evidence-stream.tsx` — Client component: drag-and-drop upload zone + recent-evidence list (#15). Takes `enterpriseId` + optional `milestoneId` props. Will be wired into the Founder Studio by the orchestrator later.
- `src/components/trust/public-shell.tsx` — Shared `PublicTrustHeader` + `PublicTrustFooter` for the standalone public surfaces.
- `src/components/trust/embed-snippet.tsx` — Client component: iframe embed code with copy-to-clipboard button + Sonner toast.
- `src/app/trust/page.tsx` — Public Trust & Zero-Custody Proof Dashboard (#13 + #28): 7 sections (Hero, Zero-Custody Proof Panel, Platform KPIs, AI Health, Compliance Integrations, Recent Graduations, CTA strip).
- `src/app/badge/[slug]/page.tsx` — Constitutional Guarantee Badge (#29): badge card with tier/health/compliance badges, sovereign-survivability certified badge for graduated enterprises, verify-on-ledger section with latest 3 hash-chained events, embed snippet with copy button.

### Strict boundaries respected
- Did NOT modify any existing file. Only CREATED new files under `src/app/{trust,badge,api/public,api/evidence}/` and `src/components/trust/`.
- Did NOT modify `src/lib/db.ts`, `src/lib/aurienta/*`, `prisma/schema.prisma`, `src/app/globals.css`, `src/components/aurienta-logo.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`, or any dashboard/site/auth file.
- Ran `bun run db:generate` + `bun run db:push` to refresh the Prisma client (the schema already had all needed models — IpfsEvidence, GraduationRecord, LawFirm, etc. — but the cached client instance in the dev server's `globalForPrisma.prisma` singleton was stale).

### Key decisions
- Public pages (`/trust`, `/badge/[slug]`) do NOT require auth and render standalone (no dashboard shell). They use `PublicTrustHeader` + `PublicTrustFooter` from `src/components/trust/public-shell.tsx` for a consistent minimal gold-on-near-black luxury treatment with sticky footer (`min-h-screen flex flex-col` + `mt-auto`).
- The `EvidenceStream` client component mounts its own `SonnerToaster` so it works in any host page (the root layout only mounts the radix Toaster).
- The Open Constitutional API uses `Cache-Control: no-store` and `dynamic = "force-dynamic"` so the public stats always reflect the live ledger state — no caching of stale escrow balances.
- The evidence POST endpoint accepts `milestoneId` and switches the ledger event type from `evidence_published` to `milestone_released` accordingly, matching the spec.
- Per-law-firm escrow breakdown is computed by iterating enterprises and aggregating by `lawFirmId` — a single extra query, not an N+1.
- The badge page's compliance badges are dynamic (NOSI/police-clearance flip to red "pending" if the enterprise doesn't meet the rule) — Zero Custody + AI Enforced are always on because they're platform-wide constitutional rules, not per-enterprise state.
- The embed snippet uses `window.location.origin` so the iframe URL is correct in any deployment.
- GraduationRecord has no Prisma relation on Enterprise (the schema uses a bare `enterpriseId` FK) — queries resolve slugs separately via a single enterprise lookup, then merge.

### How to view
- **Public Trust Dashboard**: Preview Panel → navigate to `/trust` (no sign-in needed). See the glowing AurientaMark hero, the zero-custody proof panel (0.00 EGP AURIENTA-held vs 16.78M EGP escrow across Nile Legal + Cairo Trust), platform KPIs (280.5M EGP deployed, 3 active / 1 graduated, 290 jobs, 99.95% CRE uptime, 5 partners), AI Health panel (Gemma 2 7B oversight, 0.4% hallucination, 12% bias, 0.06 drift), 6-card compliance integrations grid with pulsing "API connected" dots, and the SmartFarm graduation card linking to its badge.
- **Constitutional Guarantee Badge**: Preview Panel → navigate to `/badge/street-bites` (or `/ecopack-solutions`, `/nile-brew-cafe`, `/smartfarm-egypt`). See the tier + health rating + compliance badges + (for SmartFarm) the emerald "Sovereign Survivability Certified" badge, the latest 3 hash-chained ledger events, and the iframe embed snippet with copy button.
- **Open Constitutional API**: `GET /api/public/stats` — returns the aggregate platform health JSON. CORS-enabled for cross-origin embedding.
- **IPFS Evidence API**: `POST /api/evidence` (auth required) uploads evidence and mints a CID; `GET /api/evidence/[cid]` returns the metadata. The `EvidenceStream` client component (in `src/components/trust/evidence-stream.tsx`) provides the drag-and-drop UI — orchestrator will wire it into the Founder Studio.
