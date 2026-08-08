# Task 7 — Capital Partner workspace

**Agent:** Full-stack developer (Capital Partner workspace)
**Task ID:** 7
**Scope:** Build the Capital Partner's three workspace pages (`/dashboard/portfolio`, `/dashboard/opportunities`, `/dashboard/market`) and two API routes (`/api/orders`, `/api/reservations`) on top of the seeded Aurienta foundation (Task IDs 4–6 + 7-orchestrator).

## What was built

### Pages (server components by default, with small client islands)
1. **`src/app/dashboard/portfolio/page.tsx`** — Consolidated holdings view.
   - Hero summary: total portfolio value, unrealised gain/loss (green/red), dividends received (mock SmartFarm 1,420 EGP to Layla with 10% WHT → 1,278 net), # enterprises held.
   - Equity holdings table: enterprise (name + tier badge + health rating + sector), shares, avg price, AI price, value, unrealised return %, **Trade** button → `/dashboard/market?enterprise=<slug>`.
   - Right column: recharts donut chart of sector allocation (gold-toned palette), dividend history card (mock SmartFarm payment with WHT breakdown), **Priority window entitlements** card listing Sarah's open Phase 1 sell order on EcoPack with Layla's pro-rata (4200/210526 × 1000 ≈ 19 shares) and a Buy button.
   - Constitutional hash footer (Zero Custody · CRE-enforced · Immutable ledger · `0xB4F8…E7D1A`).

2. **`src/app/dashboard/opportunities/page.tsx`** — Capital Coordination Layer.
   - Server queries all enterprises where `status NOT IN [draft, graduated]` and computes the **CRE dynamic minimum** (Add-on 19) using `computeDynamicMinimum(remainingGoal, slots, tier)` from `lib/aurienta/cre.ts` when an `investorCap` is set.
   - Intro band explaining the 4 phases of capital flow (interest → active fundraising → closed escrow → milestone unlock).
   - Client grid (`OpportunitiesGrid`) with phase filter tabs (All / Active fundraising / Closed escrow / Milestone unlock) backed by `enterprise.status`. Each card: name, tagline, sector icon, tier badge, health rating, % raised progress bar, AI price, min investment, status label, **Reserve shares** button + **View on market** link.
   - **Reserve dialog** (`ReserveSharesDialog`): shares input, live amount computation, reference code preview (`AURI-2026-{slug}-XXXX-{base36}`), Zero Custody note, **Confirm reservation** → `POST /api/reservations`. On success shows the actual server-generated reference code with a copy-to-clipboard button and a 48h wire deadline.
   - Empty state per phase filter.

3. **`src/app/dashboard/market/page.tsx`** — Constitutional secondary market.
   - Reads `?enterprise=<slug>` to preselect.
   - Intro card: 3-phase priority window system (Phase 1 pro-rata 48h → Phase 2 employee/founder 24h → Phase 3 general ±5% band), plus the 3 governing Rego policies (`fundamental_pricing.rego`, `no_speculation.rego`, `priority_windows.rego`).
   - For each holding: aggregate depth (counts of buy/sell open orders + total shares) via `db.tradeOrder.groupBy`.
   - Client `MarketWorkspace` with:
     - **Enterprise selector** (horizontal tabs of the user's holdings, sticky gold highlight on active).
     - **Price band card** showing AI fundamental price (big), ±5% band min/mid/max, user's holding with ownership % progress bar.
     - **Order form**: side toggle (Buy green / Sell red), phase selector tabs (Phase 1/2/3 with per-phase note), shares input, read-only price field (= fundamental), live gross + platform fee 0.5% + CGT 10% on sells, net total, **Place order** button → `POST /api/orders`. Validates `shares ≤ owned` before submitting (no-speculation rule).
     - **Market depth card**: aggregate buy-side vs sell-side counts + shares + imbalance bar + est. fill time (FIFO). Note: "no order book — anti-speculation rule".
     - **Your open orders**: list across all enterprises with side icon, shares, price, phase, status, filled count, time ago.
     - **Recent trades ledger**: last 5 `share_transferred` events parsed from the immutable ledger, table with side / enterprise / shares / price / gross / when.

### API routes
4. **`src/app/api/orders/route.ts`** (POST)
   - Body: `{ enterpriseId, side, shares, priceEgp, phase }`.
   - Validates body, fetches enterprise, blocks sells exceeding the user's holding (`no_speculation.rego`).
   - Calls `enforcePriceBand(priceEgp, fundamentalPrice, phase)` from the CRE. Returns 400 with `{ error, code: "cre_denied", policy, decisionToken }` if denied.
   - Computes fees (0.5% platform + 10% CGT for sells), creates `TradeOrder` (status `open`), appends a hash-chained `share_transferred` ledger event via `appendLedgerEvent`, returns the order + CRE decision token.

5. **`src/app/api/reservations/route.ts`** (POST)
   - Body: `{ enterpriseId, shares }`.
   - Validates body, rejects graduated/draft enterprises.
   - Computes **dynamic minimum** shares when `investorCap` set (`remaining_goal / (slots × 0.7)`), enforces max remaining cap (no over-issuance).
   - Computes amount = shares × `sharePriceEgp`, generates reference code `AURI-2026-{slug}-{uid-prefix}-{base36-timestamp}`, sets `expiresAt = now + 48h`, creates Reservation (status `reserved`).
   - Appends a `funds_received` ledger event noting "Funds routed directly to the constitutional escrow vault — AURIENTA never touches capital."

### Client components (under `src/components/dashboard/capital/`)
- `portfolio-allocation-chart.tsx` — recharts PieChart donut, gold palette, sector legend.
- `reserve-shares-dialog.tsx` — Dialog with live amount + reference preview + Zero Custody note + confirmed-state with copy-to-clipboard.
- `opportunities-grid.tsx` — phase-filtered card grid with framer-motion transitions + dialog trigger.
- `market-workspace.tsx` — enterprise selector + price band + order form + depth + open orders + recent trades (one client island for the whole workspace to keep state local).

## Verified

- `bun run lint` — clean for all my files (the only remaining error is a pre-existing `@typescript-eslint/no-require-imports` in `src/lib/aurienta/cre.ts`, which is in the DO-NOT-MODIFY list and not in any file I touched).
- All three pages return HTTP 200 (signed in as Layla); `?enterprise=` query is honoured.
- API tests (signed in as Layla):
  - Reservation on EcoPack 5u @ 57 = 285 EGP → returns `AURI-2026-ecopack-solutions-p85c-MQRS2U4Q`, expiresAt +48h.
  - Reservation on graduated SmartFarm → 400 `{code: "closed"}`.
  - Reservation with 0 shares → 400 `{code: "invalid_body"}`.
  - Buy phase_3 EcoPack 10u @ 57 → success, platform fee 2.85 EGP, CRE decision token.
  - Sell phase_1 EcoPack 10u @ 57 → success, fees 59.85 EGP (2.85 platform + 57 CGT).
  - Sell phase_3 @ 70 EGP (outside ±5% band) → 400 `{code: "cre_denied", policy: "fundamental_pricing.rego"}`.
  - Sell phase_1 @ 57.5 (not exactly fundamental) → 400 `{code: "cre_denied"}`.
  - Sell 999999u (more than owned 4200) → 400 `{code: "cre_denied", policy: "no_speculation.rego"}`.
- HTML inspection: portfolio page renders 4 holdings, sector allocation (Food 500 / Manufacturing 239,400 / Retail 180,024 / Agriculture 4,999,660), SmartFarm dividend (1,420 → 142 WHT → 1,278 net), and the EcoPack pro-rata entitlement (Sarah's 1,000-share sell order → Layla's 19-share slice, "You hold 4,200 / 210,526 (2.00%)"). Market page renders all 4 holdings as selector tabs with correct depth counts and Layla's open orders.

## Files created
- `src/app/api/orders/route.ts`
- `src/app/api/reservations/route.ts`
- `src/app/dashboard/portfolio/page.tsx` (replaced placeholder)
- `src/app/dashboard/opportunities/page.tsx` (replaced placeholder)
- `src/app/dashboard/market/page.tsx` (replaced placeholder)
- `src/components/dashboard/capital/portfolio-allocation-chart.tsx`
- `src/components/dashboard/capital/reserve-shares-dialog.tsx`
- `src/components/dashboard/capital/opportunities-grid.tsx`
- `src/components/dashboard/capital/market-workspace.tsx`

## Boundaries respected
Did NOT modify any file in the DO-NOT-MODIFY list: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `src/app/dashboard/layout.tsx`, `src/components/dashboard/dashboard-shell.tsx`, `src/components/aurienta-logo.tsx`, `src/lib/*`, `prisma/*`, any auth file, any route outside the ones listed.

## How to view
Sign in as **Layla** (`layla@streetbites.eg`) via the demo sign-in picker, then:
- **Portfolio** → `/dashboard/portfolio` — hero stats, holdings table, allocation donut, SmartFarm dividend, EcoPack pro-rata entitlement.
- **Opportunities** → `/dashboard/opportunities` — phase tabs, enterprise cards (Street Bites, EcoPack, Nile Brew), reserve dialog.
- **Secondary Market** → `/dashboard/market?enterprise=ecopack-solutions` — intro to 3-phase system, enterprise selector, price band card, order form (place a phase_3 buy or sell and watch it appear in "Your open orders" + "Recent trades ledger"), depth, and the recent share_transferred events from the immutable ledger.
