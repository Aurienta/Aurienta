# AUDIT-PHASE6 — Frontend-to-Backend Wiring Audit Summary

**Scope:** All client components under `src/components/dashboard/`, `src/components/auth/`, `src/components/transparency/`, `src/components/trust/`, `src/components/legal/`, plus dashboard-page client components under `src/app/dashboard/**`. All API routes under `src/app/api/`.

**Approach:** AUDIT-ONLY — no code modifications. Read each client component's `fetch()`/`csrfFetch()` calls, traced them to the corresponding `src/app/api/**/route.ts`, verified request/response shape alignment, RBAC consistency, and field-name agreement between client and server. For every API route, checked whether any UI client actually invokes it.

---

## Counts

| Metric | Count |
|---|---|
| Total components audited | **76** client components |
| Total API calls traced (UI → backend) | **104** distinct fetch sites |
| Total API route files inspected | **120** route handlers across 90 route files |
| **Wired correctly** | **78** |
| **Broken / disconnected (UI present, backend absent or wrong)** | **6** |
| **Unreachable backend endpoints** (route exists, no UI caller) | **47** (excluding legitimate cron/webhook/ops probes = 17) |
| **Dead UI buttons** (button visible but no fetch fires, OR text-only mention) | **3** (soulbound-revoke mention, GaaS decision button, succession execute) |
| **Field-name mismatches** | **2** (expense vendor/receiptNote, proposals votingDurationHours) |
| **Mock services in live flows** | **3** (proposals AI risk score, milestone EVE confidence, KYC sandbox-mock) |
| **Hardcoded values in UI** | **2** (DEMO_PASSWORD 'aurienta2026' in 2 files) |
| **CSRF bypass smells** (plain fetch for state-changing POST/PATCH/DELETE outside middleware exclusion) | **9** admin/dialog components |

---

## Top 10 Findings by Priority

### P0 — Critical (data corruption / capital-flow breakage)

1. **`/api/reservations/[id]/confirm` has ZERO UI caller — capital formation loop broken.**
   The endpoint exists at `src/app/api/reservations/[id]/confirm/route.ts` with a 290-line implementation that moves capital into the Law Firm Client Account, appends the `funds_confirmed` ledger event, and triggers the 0.5% Anti-Fragility Vault contribution. Its own header comment calls itself *"the missing link between 'reservation created' and 'funds actually in the law firm account.'"* No dashboard component fetches it — partners can create reservations forever but the enterprise's `lawFirmClientAccountBalanceEgp` never reflects received funds, and ownership records are never minted. This is a blueprint §5 critical path.

2. **Expense form sends `vendor` + `receiptNote`; schema expects `vendorName` + `receiptCid`.**
   `src/components/dashboard/manager/submit-expense-dialog.tsx` line 148–155 sends `{ vendor, receiptNote }` but `expenseSchema` in `src/lib/aurienta/validation.ts` line 60–68 only accepts `vendorName` and `receiptCid`. The route falls back to `"unspecified"` for vendor (line 169) and writes `null` for receiptNote. Every submitted expense in production silently loses the vendor name. Audit trail on the ledger shows `vendor: "unspecified"` regardless of user input.

### P1 — High (lifecycle endpoints with no UI entry point)

3. **`/api/expenses/[id]/reject` has no UI caller — managers can only approve.**
   The route is fully implemented (227 lines) but `src/components/dashboard/manager/approve-expense-button.tsx` only renders an "Approve" button. There is no "Reject" button anywhere. Expenses stuck in `pending` / `dual_signature_pending` can never be closed negatively — they linger until they expire.

4. **`/api/whistleblower/[id]/resolve` has no UI caller.**
   Whistleblower reports can be filed but AURIENTA Reps have no dashboard view to resolve them. The route exists (209 lines, admin-gated) but no `WhistleblowerClient` resolution button calls it.

5. **`/api/enterprises/[id]/close-capital-formation` has no UI caller.**
   Founders can list an enterprise for capital formation (`/api/enterprises/[id]/list` is wired) but cannot close it. The fundraising goal can be hit but the enterprise status never transitions from `fundraising_active` → `active` via a UI action.

6. **`/api/milestones/[id]/accountant-release` has no UI caller.**
   Milestones can reach `evidence_submitted` via the milestone-evidence dialog, but the accounting-firm release step (which moves milestone funds to the enterprise) has no UI button. Milestones are stuck post-evidence.

7. **Succession lifecycle stops at "filed".**
   `src/components/dashboard/succession/succession-declaration-client.tsx` only calls `POST /api/succession`. The route file `src/app/api/succession/[id]/execute/route.ts` and `src/app/api/succession/[id]/activate/route.ts` exist but no UI invokes them. Declarations filed today remain in `filed` status forever — the CRE-gated "activate succession on death / incapacitation" trigger has no UI surface.

8. **`/api/gaas/organizations/[orgId]/decisions` has no UI caller.**
   GaaS organizations and policies can be created but no "record decision" button exists in `gaas-client.tsx`. The decision history endpoint is unreachable.

9. **Mock EVE confidence uses `Math.random()` in production path.**
   `src/app/api/enterprises/[id]/milestones/route.ts` line 102: `const eveConfidence = 0.7 + (Math.floor(Math.random() * 18) / 100)`. The Evidence Verification Engine verdict is fabricated, not computed. The real `/api/ai/eve` endpoint exists but is never called. Milestones approved based on this score carry an unverifiable confidence value on the immutable ledger.

10. **Mock AI risk scoring in proposals route.**
    `src/app/api/proposals/route.ts` lines 227–229: `const aiRiskScore = Math.floor(Math.random() * 33) + 8;` and `aiConfidence = 0.8 + Math.random() * 0.15`. The "Mixtral 8x22B" risk badge shown to voters in `voting-modal.tsx` is fabricated. Voters see `recommendation: "approve" | "review"` based on a coin flip.

---

## P2 — Medium (security smells, dead buttons, unreachable admin/ops features)

11. **Plain `fetch()` used for state-changing POST/PATCH in 9 components** instead of the project's `csrfFetch()` double-submit helper. Affected: `oracle-mirror-sync-button.tsx`, `copilot/chat-interface.tsx`, `engagement/updates-feed.tsx`, `engagement/partner-crm-client.tsx`, `share-button.tsx`, `admin/settings/settings-console.tsx`, `admin/users/[id]/user-admin.tsx`, `admin/enterprises/recompute-readiness-button.tsx`, `admin/enterprises/enterprise-freeze-button.tsx`, `capital2/join-syndicate-dialog.tsx`, `capital2/form-syndicate-dialog.tsx`. The `/dashboard/*` path is excluded from middleware, but `/api/admin/*` and `/api/copilot` are NOT excluded — they rely on the browser's same-origin Origin header to pass. Works today but bypasses the X-CSRF-Token layer the codebase intentionally added (CTO-AUDIT P0-2 remediation).

12. **Hardcoded `DEMO_PASSWORD = "aurienta2026"`** in `src/components/auth/demo-user-picker.tsx` line 9, and reused as the default fill in `signin-form.tsx` line 126. The password is also rendered as visible helper text in the demo picker UI (line 85). If demo sign-in is enabled in production (`ALLOW_DEMO_SIGNIN=true`), this is a credential leak in client-shipped source.

13. **`CallVoteButton` sends `votingDurationHours` field that the API silently ignores.**
    `src/components/dashboard/institutional/call-vote-button.tsx` line 51 sends `votingDurationHours: 336`. `proposalSchema` and the `/api/proposals` POST handler never read this field — voting window is computed from `PROPOSAL_TYPES[type].voting` constant. The 336-hour (14-day) graduation voting window the UI promises is not actually applied; the route always uses the constant's value (currently `"14 days"` per `PROPOSAL_TYPES.graduation.voting`).

14. **`/api/soulbound/revoke` is mentioned in UI text but no button calls it.**
    `src/components/dashboard/roadmap/soulbound-client.tsx` line 352–353 displays static text *"to revoke a credential, call POST /api/soulbound/revoke"*. AURIENTA Reps have no actual UI to perform the revocation — they would have to hand-craft a curl call.

15. **`/api/graduation/export` has no UI caller.**
    The Sovereign Export Package endpoint (cap table + ledger + verification script per blueprint Article VII) is implemented but unreachable. The "Export Package" card in `institutional/export-package-card.tsx` only links to documentation, not the API.

16. **`/api/documents/[id]/sign` has no UI caller.**
    Cryptographic document signing is implemented but no dashboard view exposes a "Sign Document" button. Legal agreements cannot be signed from the UI.

17. **`/api/legal-templates` (list / render) has no UI caller.**
    The entire legal-template subsystem (catalog of constitutional agreement templates + variable rendering) is unreachable from any dashboard page.

18. **`/api/export-readiness` has no UI caller.**
    Graduation export-readiness report (GET and POST) has no dashboard entry point.

19. **`/api/api-keys` and `/api/api-keys/[id]` have no UI caller.**
    Platform API key management is unreachable from the admin panel.

20. **KYC step sends `method: "sandbox-mock"` with fabricated `dfdcScore`, `facenetMatch`, `livenessPassed: true` directly into the production verification pipeline.**
    `src/components/auth/steps/step-kyc.tsx` line 95–99. Even though the route handles the missing-provider case gracefully (fail-secure to L1), the hard-coded "liveness passed" boolean is sent to the server which may then upgrade the verification level — a malicious user could just call the API directly with the same payload.

---

## P3 — Low (informational / cosmetic / by-design unreachable)

- 17 unreachable endpoints are intentionally server-only (cron jobs, webhooks, ops probes): `/api/cron/*`, `/api/v1/webhook/payment`, `/api/inngest`, `/api/health`, `/api/ready`, `/api/metrics`, `/api/benchmark`, `/api/platform-health`, `/api/route`. Not flagged as findings.
- `/api/admin/audit/export` and `/api/public/stats` are reached via `<a href>` rather than `fetch()` — correct for file downloads / linkable resources.
- `OracleClient` uses plain `fetch` for `POST /api/oracle/consensus` — intentional, since the route is explicitly exempted from CSRF middleware (it's a public API-key-authenticated endpoint).
- `NotificationCenter.markAllRead` fans out N parallel POSTs to `/api/notifications/[id]/read` instead of a batch endpoint. Works but inefficient at scale.
- 30+ additional unreachable endpoints covering: GAFI/ETA/NOSI government integrations, public CRE policy catalog, IPFS pinning, FRA dashboard, intelligence conflicts, trade instruments, FX oracle, proxies, Q&A, reality-sync, circuit-breaker, AI brain-status / EVE / evidence-verification / mentor-matching / salary-override. All implemented but with no UI surface — see the CSV for the complete list.

---

## Files Created
- `/home/z/my-project/FRONTEND_BACKEND_WIRING.csv` — full per-component wiring matrix (115 rows)
- `/home/z/my-project/AUDIT_WIRING_SUMMARY.md` — this file
