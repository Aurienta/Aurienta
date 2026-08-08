# Task REMED-1B — AURIENTA Money-Moving & Governance API Hardening

**Agent:** Remediation Agent (CTO-AUDIT P0 follow-up)
**Task ID:** REMED-1B
**Scope:** Harden 10 API route groups against the CTO-AUDIT findings — apply
`parseBody`, rate limiting, `getCurrentUser`, RBAC, transactional ledger
append (`db.$transaction` + `appendLedgerEvent(tx, ...)`), and audit-log calls.
Fix the specific bugs called out in the task brief.

## Files Touched (10 routes + 1 lib)

| # | Route | Hardening Applied |
|---|-------|-------------------|
| 1 | `src/app/api/orders/route.ts` | `parseBody(orderSchema)` + `limiters.orders` + `enforceKycGate` + `enforceNotFrozen` + `enforcePriceBand` + `db.$transaction` for order+ledger + `audit()` + RBAC (member-only). |
| 2 | `src/app/api/reservations/route.ts` | `parseBody(reservationSchema)` + `limiters.reservations` + `enforceKycGate` + `enforceNotFrozen` + `enforceFamilyConsent` (EG + capital_partner heuristic) + `computeDynamicMinimum` (replaces inline duplicate) + `db.$transaction` for reservation+`raisedEgp` increment+ledger + `audit()`. |
| 3a | `src/app/api/expenses/route.ts` | `parseBody(expenseSchema)` + `limiters.expenses` + `enforceNotFrozen` + `enforceExpenseAuthority` + auto-approve only when sole required-approver-role matches submitter AND pct<1% (submitter can't self-approve otherwise) + `db.$transaction` + `audit()`. |
| 3b | `src/app/api/expenses/[id]/approve/route.ts` | `limiters.expenses` + `enforceNotFrozen` + `enforceExpenseAuthority` to compute `requiredApproverRoles` + role-membership check + dual-sig distinct-approver guard preserved + submitter-cannot-self-approve + `db.$transaction` for update+ledger + `audit()`. |
| 4 | `src/app/api/proposals/route.ts` | `parseBody(proposalSchema)` + `limiters.governance` + RBAC (board_member required for `constitutional_amendment` + `emergency_freeze`) + `enforceConsultingOptOut` for `consulting_optout` type + comment noting `manager_appointment` police-clearance enforced at execution + `db.$transaction` for proposal+ledger + `audit()`. |
| 5 | `src/app/api/proposals/[id]/vote/route.ts` | `parseBody(voteSchema)` + `limiters.governance` + **TALLY RACE FIX**: replaced read-modify-write on votesFor/votesAgainst/votesAbstain with atomic `{ increment: votingPower }` inside `db.$transaction`; tally recomputed from a fresh read after the increment; P2002 (concurrent double-vote) → 409. |
| 6 | `src/app/api/whistleblower/route.ts` | `limiters.whistleblower` + **GET LEAK FIX**: returns `[]` when caller has no memberships (was returning ALL reports) + prompt-injection defense via `askConstitutionalAI({ userContext: body.description })` (foundational AI helper wraps in BEGIN/END UNTRUSTED USER CONTENT markers + guard instruction) + `db.$transaction` for report+ledger + `audit()`. |
| 7 | `src/app/api/appeals/route.ts` | `limiters.appeals` + same prompt-injection defense via `userContext` + `db.$transaction` for case+ledger + `audit()` + GET leak fix (returns only filed-by-self when no memberships). |
| 8 | `src/app/api/drip/route.ts` | New `dripSchema` + `parseBody` + `limiters.orders` + `db.$transaction` for find-then-create (closes TOCTOU race) + P2002 → 409 + `audit()`. |
| 9 | `src/app/api/diaspora/route.ts` | New `diasporaSchema` + `parseBody` + `limiters.diaspora` + **REAL FX RATE**: replaces `Math.random()` with `db.fxRate.findFirst({ where: { fromCurrency, toCurrency: "EGP" }, orderBy: { fetchedAt: "desc" } })`, USD→EGP fallback, then 48.7 EGP/USD hardcoded fallback + `db.$transaction` for find-then-create (TOCTOU) + P2002 → 409 + `audit()`. |
| 10a | `src/app/api/syndicates/route.ts` | New `syndicateSchema` + `parseBody` + `limiters.governance` + `db.$transaction` for syndicate+ledger (ledger was outside) + `audit()`. |
| 10b | `src/app/api/syndicates/[id]/join/route.ts` | New `syndicateJoinSchema` + `parseBody` + `limiters.governance` + ledger append moved INSIDE the existing `db.$transaction` (was outside) + P2002 → 409 for concurrent join + `audit()`. |
| - | `src/lib/aurienta/validation.ts` | Added `dripSchema`, `diasporaSchema`, `syndicateSchema`, `syndicateJoinSchema`. |

## Foundational Layer Used

- `appendLedgerEvent(tx, params)` — called with `tx` (PrismaTransaction) inside every `db.$transaction` block.
- `enforceKycGate`, `enforceNotFrozen`, `enforceFamilyConsent`, `enforceConsultingOptOut`, `enforceExpenseAuthority`, `enforcePriceBand` — applied at the appropriate checkpoints.
- `computeDynamicMinimum` — replaces the inline duplicate formula in reservations.
- `limiters.{orders,reservations,expenses,governance,whistleblower,appeals,diaspora}` + `rateLimitedResponse()`.
- `parseBody(req, schema)` + new Zod schemas.
- `audit()` for every state-changing outcome (allowed + denied).
- `askConstitutionalAI({ userContext })` — foundational prompt-injection defense leveraged for whistleblower + appeals.

## Pre-existing Issues Observed (out of scope)

- `src/app/api/drip/route.ts` GET endpoint (lines 19–31) uses `include: { enterprise: ... }` but `DripEnrollment` has no `enterprise` relation in the Prisma schema — pre-existing TypeScript error from a schema refactor, NOT introduced by this task.
- `src/app/api/fx/route.ts` returns 500 with `db.fxRate is undefined` — caused by the Prisma client not being regenerated after the `FxRate` model was added to the schema. I ran `bun run db:generate` to regenerate; the dev server needs a restart to load the new `@prisma/client`. Pre-existing — not in scope but the regenerate fixes it for next dev-server restart.
- `src/app/api/ai/*` routes have type errors (`AiCallResult` not assignable to `string`) — pre-existing across ~15 AI routes from a separate AI-helper refactor. Not in scope.
- `SigninForm is not defined` in `src/app/signin/page.tsx` — pre-existing.

## Validation

- `bun run lint` → exit 0, no errors.
- `bunx tsc --noEmit` → 0 errors in any file I touched (orders, reservations, expenses, proposals, whistleblower, appeals, drip [POST only], diaspora, syndicates, validation.ts). The 2 drip/route.ts errors are pre-existing in the GET handler I left unchanged.
- `bun run db:generate` → regenerated Prisma client to include `FxRate` model so `db.fxRate.findFirst` resolves (needed for diaspora route).

## Call-site Verification

Every `appendLedgerEvent` call site now passes a `tx` as the first argument, inside a `db.$transaction(async (tx) => { ... })` block. No old-signature call sites remain in the 10 routes I touched.
