# AURIENTA — Deliverable G: Change and Remediation Log

**Mandate:** §16-G
**Purpose:** Modified files, configuration changes, migrations, dependency changes, new tests, reasons for each change, and the relevant finding IDs.

---

## Files modified (5 patched + 1 new helper = 6 files)

| # | File | Change type | Finding ID | Reason |
|---|---|---|---|---|
| 1 | `src/lib/aurienta/cron-auth.ts` | **NEW** | 1B-P0-1, 1B-P1-2 | Shared helper for cron/FRA token auth. Constant-time comparison, fail-closed when env var unset, no hardcoded fallback. Eliminates the `undefined !== undefined` bypass class. |
| 2 | `src/app/api/cron/health-rating/route.ts` | PATCHED | 1B-P0-1 | Replaced inline `token !== process.env.CRON_SECRET` with `requireCronToken(req)`. |
| 3 | `src/app/api/cron/verification-sla/route.ts` | PATCHED | 1B-P0-1 | Same fix as #2. |
| 4 | `src/app/api/cron/crcica-arbitration/route.ts` | PATCHED | 1B-P0-1 | Same fix as #2. |
| 5 | `src/app/api/cron/stage-transition/route.ts` | PATCHED | 1B-P0-1 | Same fix as #2. |
| 6 | `src/app/api/cron/proposal-expiry/route.ts` | PATCHED | 1B-P1-2 | Removed `DEV_FALLBACK_SECRET = "dev-cron-secret"`. Now uses `requireCronToken(req)`. |
| 7 | `src/app/api/cron/reservation-expiry/route.ts` | PATCHED | 1B-P1-2 | Same fix as #6. |
| 8 | `src/app/api/v1/regulatory/fra/dashboard/route.ts` | PATCHED | 1B-P0-1 (FRA variant) | Replaced inline check with `requireFraToken(req)` (separate secret, same hardening). |
| 9 | `src/app/api/verification/kyc/route.ts` | PATCHED | 1E-001 (P0) | Removed defensive defaults on `livenessScore`/`faceMatchScore`/`documentAuthenticity`. Body now required; all three scores must be explicit numbers in [0, 1]. |
| 10 | `src/lib/aurienta/env.ts` | PATCHED | 1E-008 (P0) | Removed hardcoded `"aurienta-dev-field-key-32bytes!!"` fallback for `FIELD_ENCRYPTION_KEY`. Field stays empty when env var missing; `encryption.ts` `getKey()` throws loudly on first use. |

## Configuration changes

- **None** — no `.env`, `next.config.ts`, `tsconfig.json`, or `package.json` modifications.
- `.env` is `chmod 444` (read-only) per prior hardening; not touched.

## Migrations

- **None added, none modified, none run.** Per mandate §7: "Never run destructive migrations, delete production data, or perform an uncontrolled restore during the audit."

## Dependency changes

- **None** — no `bun install`, no `package.json` additions, no version bumps. All fixes use existing imports (`NextRequest`, `NextResponse`, `crypto`).

## New tests added

- **None** — the project has no test suite, and adding one is out of audit-remediation scope. Each fix was verified by live HTTP probe (see Deliverable F).

## Commit / change-control references

- No git commits made in this audit (would require explicit authorization per mandate §14: "Use an auditable branch or equivalent change-control process"). All changes are present in the working tree; commit + push deferred to user.
- Diff summary:
  - 1 new file (`src/lib/aurienta/cron-auth.ts`, ~110 lines including comments)
  - 9 patched files (each ~5-15 lines changed; net delta small)
  - Net new code: ~150 lines (helper + comments)
  - Net removed code: ~50 lines (inline auth checks + `DEV_FALLBACK_SECRET` constants + KYC defaults)

## Traceability

Every change is traceable to a finding ID:
- `cron-auth.ts` → 1B-P0-1, 1B-P1-2 (root-cause fix for the bypass class)
- 4 cron POST route patches → 1B-P0-1
- 2 cron GET route patches → 1B-P1-2
- 1 FRA dashboard route patch → 1B-P0-1 (FRA variant)
- 1 KYC route patch → 1E-001
- 1 env.ts patch → 1E-008

## Security-sensitive changes reviewed before deployment

- **Constant-time token comparison** in `cron-auth.ts` prevents timing-based token discovery.
- **No hardcoded fallback secrets** — every secret MUST come from env, with fail-closed 503 otherwise.
- **Lazy-throw on missing `FIELD_ENCRYPTION_KEY`** — module load stays green, runtime refuses to silently use a public key.
- **Body validation tightened on KYC** — no more defensive defaults that satisfy thresholds.
- **No new dependencies** — fixes use only what's already in `package.json`.

## Items NOT changed (intentionally)

| Item | Why not changed |
|---|---|
| Migration drift (23 missing tables) | Destructive migration work — requires DBA authorization |
| Float-for-money (47 fields) | Schema migration with data backfill — requires authorization |
| 5 mock endpoints in trust paths | Each requires real provider integration — out of audit scope |
| 81 TSX files with gold/amber classes | Theme cleanup pass — out of audit scope (cosmetic) |
| `platform-health/route.ts` hardcoded "56 models" string | Cosmetic — should be computed dynamically |
| `/api/health` misleading "db:connected" on local fallback | Should distinguish real DB from fallback — out of audit scope |
| `.env` provisioning | Ops/DevOps action — out of audit scope |
| Git commit/push | Would require explicit authorization per mandate §14 |

