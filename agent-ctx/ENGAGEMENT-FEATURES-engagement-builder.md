# ENGAGEMENT-FEATURES — Engagement Layer Build Record

**Task ID:** ENGAGEMENT-FEATURES
**Agent:** Engagement Features Builder
**Date:** 2026-07-13
**Scope:** 5 engagement features (GoFundMe-inspired, constitutional model) — updates feed, social share, partner CRM, live ticker, milestone celebrations + partner wall.

## Files Created

### APIs (4)
- `src/app/api/enterprise-updates/route.ts` — GET (list) + POST (create). RBAC: founding_operator / manager / board_member / company_owner. Brain AI generates summary + sentiment (`kind: "advisory"`, persisted). Notifications fanned out to all capital partners. Wrapped in `db.$transaction` with `appendLedgerEvent`. Auto-creates milestone celebration update on 25/50/75/100% crossing.
- `src/app/api/ai/share-message/route.ts` — POST. Brain AI composes a 280-char constitutional share message from the enterprise's live fundraising state. Returns message + 6 channels.
- `src/app/api/ai/partner-insights/route.ts` — POST. Brain AI (consensus mode) analyses every shareholder: engagement score (0–100), churn risk (low/medium/high), per-partner recommendation. Persists scores to PartnerEngagement via upsert. Heuristic fallback if AI returns no parseable JSON.
- `src/app/api/ledger/ticker/route.ts` — GET. Returns last 20 ledger events (enterprise-scoped or platform-wide). Each event is Brain-AI-narrated on-the-fly using fast mode (`kind: "explain"`, `persist: false`). JSON-lines response parsed per-event.

### Dashboard Pages (2)
- `src/app/dashboard/updates/page.tsx` — Cross-enterprise updates feed (Workspace nav group). Server component fetches 30 most recent updates across user's enterprises. Renders `UpdatesFeed` client component + `LiveLedgerTicker` in a sticky sidebar.
- `src/app/dashboard/partner-crm/page.tsx` — Capital Partner CRM (Enterprise nav group). RBAC: founding_operator + company_owner only (redirects otherwise). Initial fetch via Prisma groupBy queries for votes/sessions/copilot. Renders `PartnerCRMClient` + `LiveLedgerTicker`.

### Client Components (4)
- `src/components/dashboard/engagement/updates-feed.tsx` — Updates feed with collapsible body cards, Brain AI summary badge, sentiment indicator (green/amber/red), milestone trophy badge, post-update dialog (enterprise selector + title + body → POST /api/enterprise-updates).
- `src/components/dashboard/engagement/partner-crm-client.tsx` — Partner table (shadcn Table) with engagement score pill, churn risk badge, AI recommendation column. Summary cards (total / avg engagement / high-risk). Enterprise selector + "Refresh AI insights" button → POST /api/ai/partner-insights.
- `src/components/dashboard/live-ticker.tsx` — Polls `/api/ledger/ticker` every 15s. Animated vertical ticker (framer-motion). Glass-gold cards. Respects prefers-reduced-motion. Each line: Brain AI narration + event type + enterprise link + time-ago.
- `src/components/dashboard/share-button.tsx` — Dialog with 6 social-share channels (WhatsApp, Twitter, Facebook, LinkedIn, Telegram, Email). On open, calls Brain AI to generate a share message. Profile URL is `${window.location.origin}/enterprise/${slug}`. Copy-to-clipboard + regenerate button.

## Files Modified

- `src/components/dashboard/dashboard-shell.tsx` — Added `Newspaper` + `Contact` icons to imports. Added `/dashboard/updates` (Workspace group) + `/dashboard/partner-crm` (Enterprise group) to NAV array.
- `src/app/dashboard/page.tsx` — Mounted `<LiveLedgerTicker maxVisible={6} />` between portfolio summary cards and the main grid.
- `src/app/enterprise/[slug]/page.tsx` — Added `ShareButton` in the hero section. Added "Constitutional Partners" section (partner wall): total partner count, total raised, gold-themed animated progress bar (raised/goal) with 25/50/75/100% milestone markers. Added `<LiveLedgerTicker enterpriseId={ent.id} />` after the static ledger preview.

## Schema (unchanged)

Used the existing `EnterpriseUpdate` + `PartnerEngagement` models already in `prisma/schema.prisma` (added by the previous agent). No schema changes were required — the spec mentioned adding `showOnWall Boolean @default(false)` to Shareholding but explicitly said "since we can't change the schema now, just show the count." The Partner Wall displays the partner count + total raised + progress bar without exposing individual partner names.

## Brain AI Integration Summary

All 5 features use `askConstitutionalAI` from `@/lib/aurienta/ai`:
1. **Updates feed** — `kind: "advisory"`, persisted, generates 1-sentence summary + sentiment label.
2. **Milestone celebrations** — `kind: "advisory"`, persisted, generates 2-sentence celebratory message.
3. **Share messages** — `kind: "advisory"`, persisted, generates 280-char share message from live enterprise context.
4. **Partner insights** — `kind: "advisory"`, persisted, consensus-mode analysis of every partner (JSON-lines output parsed).
5. **Ledger ticker narration** — `kind: "explain"`, NOT persisted (fast mode), batches 20 events into one AI call.

User-controlled text (titles, bodies, enterprise names, taglines) is passed via `userContext` (UNTRUSTED-DATA delimiters) per the constitutional prompt-injection hardening pattern.

## RBAC Summary

- `enterprise-updates` POST: founding_operator / manager / board_member / company_owner
- `partner-insights` POST: founding_operator / company_owner
- `share-message` POST: any authenticated user
- `ledger/ticker` GET: any authenticated user (enterprise-scoped requires member/shareholder)
- `/dashboard/partner-crm` page: founding_operator + company_owner (server-side redirect)

## Verification

- `bun run lint` — 0 errors ✓
- Dev server compiles all new routes:
  - `GET /dashboard/updates` → 200 (9.5s compile, 49KB) ✓
  - `GET /dashboard/partner-crm` → 200 (5.1s compile, 49KB) ✓
  - `GET /api/ledger/ticker` → 401 (correct — requires auth) ✓
  - `GET /enterprise/street-bites` → 200 (5.0s compile, 163KB) ✓

## Notes for Next Agent

- The `EnterpriseUpdate` model has `aiAudienceCompliance` field — I store the same summary there (the spec only mentioned `aiSummary`, `aiAudienceCapital`, `aiSentiment` but the field exists for FRA-facing summaries; left as the same value for now — a future agent could prompt the Brain AI separately for a compliance-audience summary).
- The `PartnerEngagement` table is upserted on every `partner-insights` call, so the CRM dashboard reads fast on subsequent loads.
- The `LiveLedgerTicker` silently fails (shows "No ledger events yet") for unauthenticated viewers on the public enterprise profile page — the static ledger preview above it remains visible to everyone.
- Nav items: `Updates` is in the universal Workspace group (visible to all signed-in partners); `Partner CRM` is in the Enterprise group (visible to manager / founding_operator / board_member / company_owner / accounting_firm_rep) — the page itself enforces the stricter founding_operator + company_owner RBAC via server-side redirect.
