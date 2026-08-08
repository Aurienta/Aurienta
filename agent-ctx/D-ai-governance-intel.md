# Task D — AI Governance Intelligence (6 features)

**Agent:** Full-stack developer (AI Governance Intel)
**Scope:** Build 5 dashboard pages + 6 API routes + 6 reusable components implementing
AURIENTA's constitutional intelligence layer.

## Features

| #  | Name                                | Route                     | API                         | Component                           |
|----|-------------------------------------|---------------------------|-----------------------------|-------------------------------------|
| 1  | Constitutional Precedent Engine     | /dashboard/precedents     | /api/ai/precedent           | intel/precedent-panel.tsx           |
| 2  | "Explain This Number" AI            | (reusable, no page)       | /api/ai/explain             | intel/explain-number.tsx            |
| 3  | Anomaly Narration AI                | /dashboard/anomalies      | /api/ai/anomaly             | intel/anomaly-card.tsx              |
| 4  | Constitutional Drift Detector       | /dashboard/drift          | /api/ai/drift               | intel/drift-panel.tsx               |
| 14 | Constitutional Diff Viewer          | /dashboard/charter-diff   | /api/ai/charter-diff        | intel/charter-diff-viewer.tsx       |
| 6  | Multilingual Constitutional Assistant | /dashboard/constitution | /api/ai/multilingual        | intel/multilingual-toggle.tsx       |

## Foundation used

- `src/lib/aurienta/ai.ts` — `askConstitutionalAI`, `buildEnterpriseContext`, `buildUserContext`
- `src/lib/aurienta/auth.ts` — `getCurrentUser`
- `src/lib/aurienta/constants.ts` — `PROPOSAL_TYPES`, `CONSTITUTIONAL_HASH`
- `src/lib/aurienta/format.ts` — `egp`, `pct`, `timeAgo`, `shortHash`
- `src/lib/db.ts` — Prisma client
- `src/components/aurienta-logo.tsx` — `AurientaMark`, `GoldStar`
- Design system: `text-gold-gradient`, `bg-gold-gradient`, `glass`, `glass-gold`,
  `gold-glow-sm` classes; `font-serif`, `font-sans`, `font-mono`.

## Patterns

- Server component by default; `"use client"` for interactive bits.
- AI calls go through `askConstitutionalAI({ kind, userMessage, persist: true, ... })` — never import `z-ai-web-dev-sdk` directly.
- All AI artifacts persisted as `AiArtifact` rows (court-admissible / ledger-immutable).
- Gold-on-near-black luxury aesthetic. NO blue/indigo. Responsive + accessible.
- Mount `<SonnerToaster />` per page so toasts work without root-layout changes.

## Status

In progress — see worklog Task ID: D entry for final summary.
