# Task ID: B — Agent: Full-stack developer (Dashboard UX)

## Scope
Build 5 dashboard UX features for AURIENTA:
- #19 Constitutional Command Palette (Cmd+K)
- #20 Role-Contextual Navigation
- #21 Constitutional Calendar (`/dashboard/calendar`)
- #22 Unified Notification Center with AI Triage (`/dashboard/notifications`)
- #9 Cross-Enterprise Priority Window Aggregator (`/dashboard/priority-windows`)

## Foundation read
- `src/components/dashboard/dashboard-shell.tsx` — existing sidebar (Workspace/Enterprise/Institutional groups) + topbar.
- `src/lib/aurienta/auth.ts` — `getCurrentUser()` returns user + memberships + shareholdings + tasks + notifications.
- `src/lib/aurienta/ai.ts` — `askConstitutionalAI()` wraps z-ai-web-dev-sdk.
- `src/lib/aurienta/{constants,format}.ts` — helpers (TIER_META, STS_LEVELS, egp, timeRemaining, timeAgo).
- `prisma/schema.prisma` — Notification (has `aiPriority`, `aiSummary`), Proposal (`votingEndsAt`), Milestone (`dueAt`), DashboardTask (`dueAt`, `done`), TradeOrder (`phase`, `side`, `status`, `createdAt`).
- Seeded: Layla (founding_operator + capital_partner) — qualifies for Enterprise-first nav.
- Seeded: Sarah's EcoPack phase_1 sell order of 1000 shares → Layla's pro-rata = 19 shares (for #9).
- Seeded: 5 notifications for Layla (governance/milestone/dividend/system) — for #22.

## Files I will create / modify (ownership log)
- MODIFY: `src/components/dashboard/dashboard-shell.tsx`
- CREATE: `src/components/dashboard/ux/command-palette.tsx`
- CREATE: `src/components/dashboard/ux/calendar-grid.tsx`
- CREATE: `src/app/dashboard/calendar/page.tsx`
- CREATE: `src/components/dashboard/ux/notification-center.tsx`
- CREATE: `src/app/dashboard/notifications/page.tsx`
- CREATE: `src/app/api/notifications/[id]/read/route.ts`
- CREATE: `src/app/api/ai/triage/route.ts`
- CREATE: `src/components/dashboard/ux/priority-windows.tsx`
- CREATE: `src/app/dashboard/priority-windows/page.tsx`

## Status
IN PROGRESS.
