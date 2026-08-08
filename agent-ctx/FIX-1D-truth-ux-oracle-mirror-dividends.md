# FIX-1D — Truth-in-UX, Oracle Mirror, fake-dividend fix

Task ID: FIX-1D
Agent: Remediation Agent (truth-in-UX + Oracle Mirror + dividends)
Date: 2026-07-XX

## Scope

Three coordinated remediations on the AURIENTA platform:

1. **Truth-in-UX** — relabel mocked government integrations as "roadmap / pilot"
   across the compliance and accounting surfaces so no UI claims a live
   government API that does not exist in code.
2. **Oracle Mirror** — replace the static UI on
   `/dashboard/oracle-mirror` with real data (real last-sync timestamp,
   real mirror status computed from latest LedgerEvent age, real
   "Generate physical copy" button that seals an `oracle_mirror_sync`
   ledger event), and add the supporting `POST /api/ledger/sync` route.
3. **Fake dividend data** — remove the hardcoded dividend history on
   `/dashboard/portfolio` (which only fired for `layla@streetbites.eg`)
   and replace it with a real query against `dividend_paid` ledger
   events, with an honest empty state when no events exist.

## Files read (pre-edit)

- `/home/z/my-project/worklog.md` (lines 1-80 + tail) — loaded prior audit context.
- `/home/z/my-project/src/components/dashboard/institutional/regulatory-integrations.tsx`
- `/home/z/my-project/src/components/dashboard/institutional/compliance-matrix.tsx`
- `/home/z/my-project/src/app/dashboard/accounting/page.tsx`
- `/home/z/my-project/src/app/dashboard/compliance/page.tsx`
- `/home/z/my-project/src/app/dashboard/oracle-mirror/page.tsx`
- `/home/z/my-project/src/app/dashboard/portfolio/page.tsx`
- `/home/z/my-project/src/lib/aurienta/cre.ts` (appendLedgerEvent signature)
- `/home/z/my-project/src/lib/aurienta/auth.ts` (getCurrentUser)
- `/home/z/my-project/src/lib/aurienta/audit.ts` (audit helper)
- `/home/z/my-project/src/lib/aurienta/format.ts` (timeAgo / shortHash signatures)
- `/home/z/my-project/prisma/schema.prisma` (LedgerEvent, AuditLog models)
- `/home/z/my-project/src/app/api/ledger/verify/route.ts` (existing pattern)

## Edits

### 1. Truth-in-UX

**`src/components/dashboard/institutional/regulatory-integrations.tsx`**
- GAFI: `mode: "Registry sync (roadmap)"` (already qualified — verified).
- NOSI: `mode: "Status tracking (roadmap)"` (already qualified — verified).
- ETA: `mode: "Auto-filing (roadmap)"` (already qualified — verified).
- AML: `mode: "Audit-log (provider integration pending)"` (already qualified — verified).
- MOI: was `mode: "Police clearance API"` with detail "Manager clearance attestation · 7-day re-verify" → qualified to `mode: "Police clearance attestation (pilot)"` with detail "Manager clearance status recorded on-platform; live MOI API integration is roadmap" (MOI was not in the explicit GAFI/NOSI/ETA/AML list but had an unqualified "live API" claim, fixed for thoroughness).
- FRA: kept as "Regulatory Shadow Mode / No-action letter in force" — this is the platform's actual regulatory posture per the blueprint, not a live-API claim.
- Section header badge kept: "Pilot — integrations roadmap" + per-card "pilot" tag.

**`src/components/dashboard/institutional/compliance-matrix.tsx`**
- "Tax filing" column header now reads `Tax filing (roadmap)`.
- NOSI status badge detail: was `Social insurance compliance — NOSI registered employees` → `Tracked on-platform — NOSI live API verification is roadmap`.
- Police clearance status badge detail: was `Manager + key-person police clearance (Ministry of Interior API)` → `Manager + key-person police clearance (MOI live API is roadmap)`.
- Tax filing status badge: was `label="Current" detail="Auto-filed via Egyptian Tax Authority API"` → `label="Computed" detail="Returns computed on-platform; live ETA auto-submit is roadmap"`.

**`src/app/dashboard/accounting/page.tsx`**
- Statutory deadlines section header: "Egyptian Tax Authority" tag upgraded to include a `roadmap` pill badge + sub-text "Returns computed on-platform; live auto-submit via ETA is roadmap. Manual filing by the accounting firm until integration ships."
- This qualifies every row in the deadlines list (VAT Q2 2026, payroll tax, statutory audit, corporate tax advance) without breaking the UI.
- The "filed" status badges for past items now read as "manually filed by the accounting firm" rather than implying auto-submission.

**`src/app/dashboard/compliance/page.tsx`**
- PageHeader subtitle appended: "Live GAFI/NOSI/ETA/MOI API integrations are roadmap; on-platform attestation is in pilot."
- KPI strip:
  - Police clearance: `MOI API · 7-day re-verify` → `MOI API (roadmap) · on-platform re-verify`
  - NOSI aggregate: `Across monitored enterprises` → `On-platform tracking · live API is roadmap`
  - AML / sanctions: `OFAC + EU + EG · 30d` → `OFAC + EU + EG · screening events logged (live provider is roadmap)`

### 2. Oracle Mirror

**`src/app/api/ledger/sync/route.ts`** (NEW)
- `POST /api/ledger/sync` — auth-gated endpoint that appends an
  `oracle_mirror_sync` LedgerEvent inside `db.$transaction` via the
  existing `appendLedgerEvent` helper (so the new event is hash-chained
  to the previous tip and signed with the platform Ed25519 key).
- Membership gate: if `enterpriseId` is supplied, the caller must be a
  member or shareholder of that enterprise (prevents cross-enterprise
  chain pollution).
- Audit-log entry on every call (allowed + denied).
- Returns `{ ok, hash, sequence, timestamp }` on success; 401 if
  unauthenticated, 403 if membership gate fails.

**`src/components/dashboard/oracle-mirror/oracle-mirror-sync-button.tsx`** (NEW)
- Client component ("use client") with a single button that POSTs to
  `/api/ledger/sync`.
- Loading state, success toast (with returned hash), error toast.
- Shows the most recently sealed hash inline with a green check.
- Includes an honest disclaimer: "Physical notarisation in a notary
  vault is roadmap — this records the digital checkpoint only."

**`src/app/dashboard/oracle-mirror/page.tsx`** (REWRITE)
- Removed hardcoded `PHYSICAL_COPIES` mock and `DRILLS` mock as static
  "real" data.
- New `computeMirrorStatus(latestEventAt)` — `FRESH` (<1h), `SYNCED`
  (<24h), `STALE` (≥24h), `EMPTY` (no events).
- Mirror status now displayed live in the activation-threshold banner
  and in the Latest snapshot header — colored dot + label + age.
- Per-enterprise last-sync: server-side query for the latest
  LedgerEvent per enterprise the user belongs to (memberships ∪
  shareholdings); rendered in a scrollable list under "Latest
  snapshot".
- Physical copies section: relabeled as
  `Protocol (roadmap — physical notarization pending)` with a roadmap
  pill and explanatory paragraph; the three vault sites are now
  described as "designated custodians" with "pending notarisation"
  amber pill (not "sealed"). The "last sync" timestamp is the real
  latest ledger event timestamp.
- New "Seal Oracle Mirror checkpoint" button (the new client
  component) at the bottom of the Physical copies card.
- "Latest snapshot" card retains the global total + latest event hash
  (already real) and now also shows the live mirror status badge.
- New "Recent sync checkpoints" section: real `oracle_mirror_sync`
  LedgerEvents (parsed payload + hash + sequence + actor). Empty
  state: "No Oracle Mirror checkpoints sealed yet. Use the 'Seal
  Oracle Mirror checkpoint' button above to record the first digital
  checkpoint on the immutable ledger."
- Drill history section relabeled as `protocol reference (roadmap)`
  with an explanatory paragraph: "Drills are scheduled quarterly per
  Vol 17.19. The first live reconciliation drill will run once
  physical notarisation is operational. The entries below are the
  protocol's planned cadence, not historical results." Outcomes
  reworded to "Target: 0 drift" with an amber alert icon.
- Footer note appended with `· physical notarisation is roadmap`.

### 3. Fake dividend data

**`src/app/dashboard/portfolio/page.tsx`**
- Removed the hardcoded `dividends` array that fired only for
  `user.email === "layla@streetbites.eg"`.
- Replaced with a real `db.ledgerEvent.findMany` query:
  - `where: { eventType: "dividend_paid", enterpriseId: { in: userHoldings } }`
  - `orderBy: { timestamp: "desc" }`
- Each ledger event's `payload` JSON is parsed defensively (try/catch);
  fields extracted: `grossEgp` (or `amountEgp` fallback), `withholdingEgp`
  (default = gross × 10%), `netEgp` (default = gross − withholding),
  `date` (default = event timestamp ISO date), `quarter` (default =
  `{year} Q{floor(month/3)+1}`).
- Malformed events (grossEgp ≤ 0) are filtered out.
- Enterprise name/slug resolved from the user's holdings map.
- SummaryStat "Dividends received" sub-label now switches:
  `dividends.length ? "Net of 10% withholding" : "No distributions yet"`.
- Empty state rewritten honestly: "No dividends distributed yet."
  followed by "Dividends are paid from realized profits after the
  enterprise reaches profitability — they appear here as
  `dividend_paid` ledger events sealed by the manager / board."
- Existing row rendering retained (gross / WHT / net breakdown) — it
  works unchanged with the real `DividendRow` shape.

## Lint / smoke

- `bun run lint` → exit 0, no errors.
- Dev log: `GET /dashboard/oracle-mirror 200`, `GET /dashboard/portfolio 200`
  (both render cleanly).
- No new Prisma errors introduced by the changes (an unrelated
  pre-existing `graduationRecord.findMany` ordering error on the
  university/Tier-E page was observed in the log but is not in scope
  for FIX-1D and was not touched).

## Honest-state summary

After FIX-1D:

- No UI surface claims a live government integration without a
  `(pilot)` or `(roadmap)` qualifier. Verified across:
  regulatory-integrations.tsx, compliance-matrix.tsx,
  accounting/page.tsx, compliance/page.tsx.
- The Oracle Mirror page now shows real data (real latest ledger
  event, real per-enterprise last sync, real mirror status, real
  recent `oracle_mirror_sync` checkpoints) and offers a real action
  that seals a hash-chained ledger event. Physical notarisation is
  labelled as roadmap.
- The portfolio page no longer fabricates dividend data. Dividends
  are pulled from real `dividend_paid` ledger events; if none exist,
  the user sees an honest empty state explaining when dividends are
  paid.
