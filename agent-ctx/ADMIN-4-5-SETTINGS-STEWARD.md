# ADMIN-4-5-SETTINGS-STEWARD — Settings console + Steward mock-data purge

**Agent:** Settings/Steward implementation agent
**Task ID:** ADMIN-4-5-SETTINGS-STEWARD
**Scope:** (A) new Platform Settings console (`/dashboard/admin/settings` + `/api/admin/settings`) and (B) replacing every hardcoded mock value on the Steward health console with real Prisma queries.

---

## Part A — Platform Settings console

### A.1 Prisma schema (`prisma/schema.prisma`)
- Added `PlatformSetting` model:
  - `id String @id @default(cuid())`
  - `key String @unique` (e.g. `fee.platformPct`, `tier.A.maxRaise`)
  - `value String` (JSON-encoded)
  - `category String` (`fee | tier | timing | feature_flag | general`)
  - `updatedById String?` + `updatedBy User? @relation("SettingUpdater", …)`
  - `updatedAt DateTime @updatedAt`
  - `@@index([category])`
- Added reverse relation `settings PlatformSetting[] @relation("SettingUpdater")` to the `User` model.
- Ran `bun run db:push` — schema applied cleanly; Prisma Client regenerated.

### A.2 API route — `src/app/api/admin/settings/route.ts`
- `GET /api/admin/settings` — returns all settings grouped by category. Requires `aurienta_rep` via `requireRole("aurienta_rep")`. Seeds 30 default knobs on first read via `seedDefaults()` (upsert each missing key).
- `PATCH /api/admin/settings` — body `{ key, value }`. Validates the value is a scalar (number/boolean/string ≤ 256 chars). Infers the category from the key prefix. Upserts the row, stamps `updatedById` with the Steward's user id, writes a `admin.settings.update` AuditLog entry capturing `{ key, previous, next, category }`.
- All errors are translated to JSON `{ error, code }` with the right HTTP status (401 unauthenticated / 403 forbidden / 400 bad_request / 500 server_error).

### A.3 Page — `src/app/dashboard/admin/settings/page.tsx` (server component)
- RBAC: `getCurrentUser()` + redirect to `/signin` if unauthenticated; redirect to `/dashboard` if the user lacks the `aurienta_rep` membership.
- Fetches all `PlatformSetting` rows via Prisma directly (not via the API — avoids a 401 redirect loop on the very first render when the DB is empty).
- Merges with the same seed-defaults table used by the API so a fresh DB still renders every knob. DB rows win on conflict.
- Renders the `<SettingsConsole>` client component with the grouped initial settings.

### A.4 Client component — `src/app/dashboard/admin/settings/settings-console.tsx`
- Four sections, each its own shadcn `Card` with a Save button that issues sequential `PATCH /api/admin/settings` calls for every knob in the section:
  1. **Fee configuration** — platform fee %, consulting fee %, anti-fragility vault % (numeric inputs).
  2. **Tier caps** — table with max raise + min investment per tier A–F (`0` = unlimited).
  3. **Timing rules** — 12 cooling-period + voting-duration knobs + session expiry (numeric inputs with `h` / `d` suffixes).
  4. **Feature flags** — 5 `Switch` toggles: AI features, Diaspora bridge, Graduation, Constitutional syndicates, Oracle Mirror armed.
- Every saved knob shows a green "saved" pill until the next edit; the section's Save button shows a spinner while in flight.
- Toasts (sonner) report per-section success / partial-failure / failure counts.

### A.5 Nav entry
- Added `{ href: "/dashboard/admin/settings", label: "Platform Settings", icon: SlidersHorizontal, group: "Platform Admin" }` to `src/components/dashboard/dashboard-shell.tsx`, placed between *Steward Dashboard* and *FRA Regulatory* in the Platform Admin group. Imported `SlidersHorizontal` from `lucide-react`.

---

## Part B — Steward mock-data purge (`src/app/dashboard/steward/page.tsx`)

Replaced every mocked metric with a real Prisma query. The visual layout, KPI strip, and gold theme are unchanged.

| Mock (before) | Real source (after) |
|---|---|
| `incidents` array — 3 hardcoded SEV rows | `db.auditLog.findMany({ where: { OR: [{ result: "denied" }, { action: { contains: "error" } }], timestamp: { gte: last90d } }, orderBy: { timestamp: "desc" }, take: 5 })`. Each row is mapped to a SEV-{1,2,3} severity via a best-effort classifier on the action/reason strings. When empty, a green "No SEV incidents in the last 90 days" card is shown instead of an empty list. |
| `creUptimePct = 99.95` | `db.ledgerEvent.findMany({ where: { eventType: "cre_decision", timestamp: { gte: last90d } } })`. Buckets each event by `hourKey(timestamp)` (YYYY-MM-DDTHH). `creUptimePct = distinctHours.size / (90*24) * 100`. The row also displays `${distinctHours.size}/${2160}h active` so the methodology is visible. KPI `ok` flag is now `creUptimePct >= 99.9` (was hardcoded `ok`). |
| `aiHallucinationPct = 0.4` | `db.aiArtifact.findMany({ select: { content, kind, confidence, createdAt } })`. Counts artifacts whose `content` starts with `[AI_FALLBACK]` (the prefix the AI router stamps on every fallback in `src/lib/aurienta/ai.ts`). `aiHallucinationPct = fallbackCount / totalArtifacts * 100`. The row also displays `${fallbackCount}/${total} fallbacks`. |
| `aiBiasPct = 12.0` | Replaced with the literal string `"Quarterly audit pending"` — bias requires a calibrated baseline distribution that the platform does not yet store. The KPI shows the string and the row reads `Quarterly audit pending` (amber). |
| `aiDrift = 0.06` | All `AiArtifact` rows ordered by `createdAt`, grouped by `kind`. For each consecutive same-kind pair, accumulate `|conf[i+1] - conf[i]|` and a pair counter. `aiDrift = driftSum / driftPairs`. The row also displays `${driftPairs} consecutive pairs`. |
| `"Policy pack v2026.06.21 · 47 Rego files"` | `"v2026.06.21 · 16 policy functions"` — the 16 exported policy functions in `src/lib/aurienta/cre.ts` (enforceZeroCustody, enforceExpenseAuthority, computeDynamicMinimum, enforcePriceBand, checkQuorum, enforcePoliceClearance, enforceKycGate, enforceFamilyConsent, enforceConsultingOptOut, enforceLawFirmReplacement, enforceEmergencyFreeze, enforceNotFrozen, enforceFundFlow, enforceDividendLock, enforceFounderEquityCap, enforceTierMigration). The 3 utility exports (appendLedgerEvent, verifyLedgerChain, computeGraduationReadiness) are not counted. |
| `"Decisions / day ~14,200"` | `db.auditLog.count({ where: { action: { contains: "cre" }, timestamp: { gte: last24h } } })`. The row reads `${count} (last 24h, audit-tagged "cre")`. |
| `"Oracle Mirror armed · 7-day activation"` | `db.ledgerEvent.findFirst({ where: { eventType: "oracle_mirror_sync" }, orderBy: { timestamp: "desc" } })`. The row reads `armed · last sync ${timeAgo(ts)}` (emerald) when a sync event exists, or `disarmed · no sync recorded` (amber) when none. |

---

## Files touched

- `prisma/schema.prisma` — added `PlatformSetting` model + `User.settings` relation.
- `src/app/api/admin/settings/route.ts` — new (GET + PATCH, 30 seed defaults).
- `src/app/dashboard/admin/settings/page.tsx` — new server component (RBAC + initial fetch).
- `src/app/dashboard/admin/settings/settings-console.tsx` — new client component (4 sections, per-section Save).
- `src/components/dashboard/dashboard-shell.tsx` — added `Platform Settings` nav entry under Platform Admin (+ `SlidersHorizontal` import).
- `src/app/dashboard/steward/page.tsx` — replaced 8 mock values with real Prisma queries (incidents, CRE uptime, AI hallucination, AI bias, AI drift, policy-pack count, decisions/day, Oracle Mirror status). Layout and gold theme unchanged.

## Verification

- `bun run db:push` — schema applied cleanly, Prisma Client regenerated.
- `bun run lint` — 0 errors.
- Signed in as `layla@streetbites.eg` (the only seeded `aurienta_rep`):
  - `GET /api/admin/settings` → 200, returns 30 settings grouped by `fee`, `tier`, `timing`, `feature_flag`.
  - `PATCH /api/admin/settings` body `{ key:"fee.platformPct", value:4.5 }` → 200, returns the updated row with `updatedBy:"Layla Mostafa"`. AuditLog gains an `admin.settings.update` entry capturing `previous:5, next:4.5`.
  - `GET /dashboard/admin/settings` → 200, renders all four sections with the seeded defaults.
  - `GET /dashboard/steward` → 200, renders `CRE uptime`, `Decisions / day`, `Quarterly audit pending`, `armed · last sync …`, `16 policy functions`, `0 fallbacks`, `No SEV incidents in the last 90 days` (with the seeded audit log containing no `denied`/`error` rows in the last 90d).
- Reverted the test PATCH back to `fee.platformPct = 5` so the DB is left clean.

## Notes / decisions

- **Audit on GET removed.** The task spec asked for audit-logging "every change" — i.e. PATCH. The initial GET implementation also wrote `admin.settings.read` audit entries; this was removed to keep the audit trail focused on state changes (every page view was producing an audit row, which would have drowned out real changes).
- **`PlatformSetting.value` is JSON-encoded.** This lets the single column store numbers, booleans, and short strings without a per-type migration. The API validates the decoded value is a scalar before persisting.
- **`seedDefaults()` runs inside the GET handler.** This means a fresh DB is fully populated the first time any Steward opens the console. The page also mirrors the same defaults so the initial server-side render (which queries Prisma directly, not the API) shows every knob even before the first API call.
- **CRE uptime methodology.** The spec asked for `distinct cre_decision hours / total hours`. With the sandbox's sparse ledger (5 cre_decision events in 90 days), the literal ratio is well under the 99.9% SLA — the KPI now correctly shows a red flag (`ok=false`) instead of the prior hardcoded `99.95%` green. The methodology (active-hours / 2160) is shown inline so the Steward understands why.
- **AI bias ratio.** Bias requires a calibrated baseline distribution (quarterly fairness audit). The platform has none, so the literal string `"Quarterly audit pending"` is shown rather than inventing a number. The KPI stays amber.
- **AI drift.** Computed as the average `|Δconfidence|` between consecutive same-kind AiArtifact rows. With 11 artifacts across 4 kinds (copilot:5, feasibility_evaluation:4, pitch_deck:1, pitch_deck_generation:1), the metric uses 7 consecutive pairs. If the platform has fewer than 2 artifacts of any kind, drift is 0 (no pairs to compare).
- **Decisions/day.** The spec said "AuditLog entries with action containing 'cre' in last 24h". The seeded audit log has actions like `auth.signin`, `oracle_mirror.sync`, `ai.explain`, etc. — none contain the literal substring `cre`. The count is therefore 0 in the current sandbox. The row label explicitly notes the filter (`audit-tagged "cre"`) so the Steward can see why it's 0.
