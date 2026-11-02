# Phase 1-E — Mock / Placeholder / False-Success Scan Register

**Mandate:** PLATFORM-FULL-AUDIT-AND-REMEDIATION-001 (Section 13)
**Agent:** `mock-placeholder-scan` (Audit Agent 1-E)
**Scope:** `src/**` excluding `src/components/ui/` (shadcn primitives) and `src/app/api/health/**`
**Total scanned source:** 900 files · ~171,917 LoC (TS+TSX)
**Tools:** ripgrep 14.x · 9 mandated pattern groups · manual call-site verification
**Date:** 2026-10-23

---

## 1. Summary counts (per classification)

| Classification | Count |
|---|---:|
| (1) Intentional mock in tests only | 0 |
| (2) Approved demonstration feature (flag for review) | 18 |
| (3) Incomplete implementation (P2) | 14 |
| (4) Production-breaking defect (P1) | 6 |
| (5) Security or integrity risk (P0) | 5 |
| (6) Requires clarification against approved spec | 3 |
| **Total findings** | **46** |

Pattern hit totals (raw, before triage):

| Pattern | Hits | Filtered-to-finding |
|---|---:|---:|
| `TODO\|FIXME\|XXX\|HACK` | 7 | 4 |
| `mock\|Mock\|MOCK` | 139 | 26 |
| `placeholder\|stub\|fake\|simulated` | 264 | 12 (167 are HTML `placeholder=` attrs — not findings) |
| `hardcoded\|hard-coded` | 6 | 1 |
| `NODE_ENV.*!==.*production\|NODE_ENV.*===.*development` | 0 | 0 |
| `catch { return { ok: true … } }` (single-line) | 0 | 0 |
| `return { ok: true }` (anywhere) | 3 | 0 (all legitimate success returns) |
| `alert(\|console.log(` | 2 | 2 |
| `process.env.NODE_ENV.*test\|jest\|vitest` | 0 | 0 |

**TODO/FIXME density:** 4 actionable TODOs ÷ 171,917 LoC ≈ 1 per 43,000 LoC — very low.

---

## 2. Findings table

> Severity scale: **P0** (production-breaking or security risk, ship-blocker) → **P3** (cosmetic / minor tech-debt).

| Finding ID | File:Line | Pattern matched | Snippet (redacted) | Classification | Sev | Remediation |
|---|---|---|---|---|---|---|
| 1E-001 | `src/app/api/verification/kyc/route.ts:14-76` | mock / false-success | `// SANDBOX MOCK: Accept the client-submitted liveness result.` … default scores `0.97/0.95/0.98` → server grants `verificationLevel = "L3"`. | (5) Security/integrity risk | **P0** | Wire real TrOCR + facenet + DFDC services. Until then, hard-block L3 elevation when caller omits scores or send `L1` default. Persist `method: "sandbox_mock_liveness"` only in audit metadata, not in user record. |
| 1E-002 | `src/lib/aurienta/gov-api.ts:34-156` (and consumers `src/app/api/v1/gov/{gafi,nosi,eta}/route.ts`) | mock | `// SANDBOX MOCK: deterministic verification based on the CR number.` `verifyGafiEnterprise/Nosi/Eta` return `verified: true` for any 6+/14/9-digit input. Public GET routes (no auth) expose mock verification. | (5) Security/integrity risk | **P0** | Either gate behind `env.allowDemoSignIn` and return 503 in production, OR add a `sandbox: true` field to the response payload. Refuse to issue `verified: true` when no real upstream was contacted. |
| 1E-003 | `src/lib/aurienta/eve.ts:42-65` (and `verifyInvoice` 186-263) | mock / simulated payment verification | `mockBankApiLookup` synthesises `found: true`, `beneficiaryName: "Law Firm Client Account"`, `amountEgp ≈ expected` for 70 % of invoice refs. `verifyInvoice` then issues `verified: true` when confidence ≥ 0.7. | (4) Production-breaking | **P1** | Either require `NODE_ENV !== production` OR have `verifyInvoice` return `verified: false, discrepancies: ["Bank API not configured"]` when `mockBankApiLookup` is the only source. Add a startup warning if EVE is wired without a real bank adapter. |
| 1E-004 | `src/app/api/enterprises/[id]/milestones/route.ts:101-110` | mock / simulated verification | `// Mock EVE (Evidence Verification Engine) confidence — deterministic but varied.` `const eveConfidence = 0.7 + (Math.floor(Math.random()*18)/100);` Always ≥ 0.70 threshold. Persisted to `Milestone.eveConfidence` + ledger event. | (4) Production-breaking | **P1** | Replace with real `verifyInvoice()` / `verifyPayroll()` call against the milestone's evidence packages. Until then, store `eveConfidence: null` + `status: "evidence_pending_review"` and surface an admin review queue. |
| 1E-005 | `src/app/api/proposals/route.ts:262-265` | mock / simulated AI | `// Mock Mixtral 8x22B risk assessment.` `aiRiskScore = Math.floor(Math.random()*33)+8; aiConfidence = 0.80 + Math.random()*0.15;` Persisted to `Proposal.aiRiskScore / aiRecommendation / aiConfidence`. | (4) Production-breaking | **P1** | Wire `askConstitutionalAI()` (already implemented in `ai.ts`) into the proposal creation path. Mark mock fields as `null` when AI is unavailable — do not store fabricated scores as if real. |
| 1E-006 | `src/lib/aurienta/ipfs.ts:106-122` (`verifyPin`) | false-success | `// SANDBOX MOCK: Always returns true if the CID format is valid.` `pinned: isValidCid, retrievable: isValidCid` | (4) Production-breaking | **P1** | Make `verifyPin` actually HEAD `https://gateway.pinata.cloud/ipfs/{cid}` (or configured gateway). Until then return `pinned: false, retrievable: false` — never claim retrievability that does not exist. |
| 1E-007 | `src/lib/aurienta/erp-integration.ts:352-381` (`syncModule`) | mock / stub / false-success | `// ── Sync Engine (stub for external ERPs, real for native)` … `// For now, log the attempt and return a stub result` … `return { success: true, recordsIn: 0, recordsOut: 0, … }` — silently writes `lastSyncStatus: "success"` to `ErpIntegration` for NetSuite/Odoo/SAP/Custom REST/GraphQL providers without calling any external API. | (4) Production-breaking | **P1** | Either (a) implement provider adapters, or (b) return `{ success: false, errors: ["external_provider_adapter_not_implemented"] }` and refuse to write `lastSyncStatus: "success"`. Today the audit trail falsely claims every external ERP sync succeeded. |
| 1E-008 | `src/lib/aurienta/env.ts:33-45` | hardcoded fallback / silent fallback | When `FIELD_ENCRYPTION_KEY` is unset, falls back to hardcoded `aurienta-dev-field-key-32bytes!!` even in production (only `console.error`s). | (5) Security/integrity risk | **P0** | Throw at first use (`encryption.getKey()`) instead of silently substituting a known-plaintext key. Do not return a fallback key — fail loudly. |
| 1E-009 | `src/app/api/whistleblower/route.ts:36-38, 85-86` | mock (encrypted, custody, bond) | `// Files an encrypted (mock), tracking-coded report.` … `// Lock a 5,000 EGP integrity bond (mock — Zero Custody, no real funds move).` Bond amount is persisted but never actually debited/escrowed. | (6) Requires clarification | **P2** | Confirm with spec: if whistleblower bond is "Zero Custody" by design, add a UI warning and a `bondStatus: "nominal"` field. If real escrow is required, integrate law-firm escrow. |
| 1E-010 | `src/lib/aurienta/crcica.ts:46-107, 113-125` | mock | `// SANDBOX MOCK: create the case record with "filed" status.` `// SANDBOCK MOCK: deterministic status progression.` Fabricates `CRCICA-` case IDs, tribunal constitution, hearings, and awards with no external filing. | (2) Approved demonstration feature | **P2** | Acceptable for sandbox; add a `sandbox: true` flag to `CrcicaCase` so the UI can label cases "Simulated — not filed with CRCICA." |
| 1E-011 | `src/lib/aurienta/tax-engine.ts:113-135` (`submitToTaxAuthority`) | mock | `// ── Mock Tax Authority e-filing interface ──` Always returns `accepted: true` + deterministic ack ID. | (2) Approved demonstration feature | **P2** | Acceptable for sandbox; persist `method: "mock_ack"` in audit metadata so downstream `verifyTaxFiling` (which checks audit log) can distinguish mock ack from real ETA ack. |
| 1E-012 | `src/lib/aurienta/eve.ts:90-127` (`mockTaxAuthorityApiLookup`) | mock | Reads `AuditLog` rows for `tax.filing.generated` events and treats them as ETA confirmation. The mock is documented but conflates "we computed a filing" with "ETA accepted it." | (3) Incomplete | **P2** | Rename to `findLocalFilingRecord` and require explicit ETA ack receipt before returning `filed: true`. |
| 1E-013 | `src/lib/aurienta/fx-oracle.ts:33-89` | mock / simulated | Five `mockRate()`-driven exchange-rate generators for non-USD/EGP pairs. Real oracle exists in `fx-oracle-real.ts` but is USD/EGP-only. | (2) Approved demonstration feature | **P3** | Document in UI that non-USD/EGP FX rates are simulated; or extend `fx-oracle-real.ts` to fetch additional pairs from CoinGecko / Binance. |
| 1E-014 | `src/app/api/fx/refresh/route.ts:62-104` and `src/app/api/fx/consensus/route.ts:41-54` | silent fallback | `// FALLBACK: the mocked oracle` … re-persists last cached rate with `sourceRef: "sim-refresh@… (sandbox fallback)"`. Caller is told `oracle: "mock_fallback"` and a `note` explaining the fallback. | (6) Requires clarification | **P3** | Fallback is honest (response surfaces `oracle` field). Acceptable if spec allows cached fallback for USD/EGP; otherwise return HTTP 503. |
| 1E-015 | `src/components/auth/steps/step-kyc.tsx:90-100` | mock (client side) | Posts `liveness: { dfdcScore: 0.02, facenetMatch: 0.97, livenessPassed: true }` (hardcoded). The server then derives level from `body.livenessScore` (default 0.97) — schema mismatch between client payload and server reader means real liveness score is never inspected. | (5) Security/integrity risk | **P0** | Fix schema mismatch: server should read `body.liveness.dfdcScore` etc. (or client should send `body.livenessScore`). Until real SDK wired, fail to `L1` instead of defaulting to L3. (Combines with 1E-001.) |
| 1E-016 | `src/app/dashboard/anomalies/page.tsx:24-118` | test fixture in prod path | `const MOCK_ANOMALIES: Omit<Anomaly, "id"|"enterpriseId">[] = […]` then `const all = [...realAnomalies, ...mockWithIds];` — supplementary mock anomalies are merged into the live dashboard view. | (3) Incomplete | **P2** | Remove the `MOCK_ANOMALIES` merge or gate behind `env.allowDemoSignIn`. Production users see fabricated anomaly rows with `id: "mock-anomaly-N"`. |
| 1E-017 | `src/app/dashboard/charter-diff/page.tsx:24, 167-172` | test fixture in prod path | `const MOCK_AMENDMENTS: Omit<CharterAmendment,"id">[] = […]` then `const all = [...realAmendments, ...mockAmendments];` — mock charter amendments with `id: "mock-amendment-N"` are shown alongside real ones. | (3) Incomplete | **P2** | Gate behind `env.allowDemoSignIn` or remove. Constitution-affecting text must not be mocked in production dashboards. |
| 1E-018 | `src/app/dashboard/antifragility/page.tsx:25-32, 42` | mock / simulated | `const SCENARIOS = [ … 10 000 Monte-Carlo iterations … ]` — hardcoded "Monte Carlo" results presented as real simulations. `vaultDeployedEgp = vaultTargetEgp * 0.18 // mock: 18% currently deployed` | (3) Incomplete | **P2** | Either run real Monte Carlo (cpu-bound, offload to cron) or label the section "Illustrative scenarios" in the UI. The 18 % deployed figure is fabricated. |
| 1E-019 | `src/app/dashboard/federation/page.tsx:25-34` | mock | `// Mock federation members — in production these are real AURIENTA-compatible networks.` + mock proposals. | (3) Incomplete | **P3** | Add `data-testid="mock-federation"` and a UI banner. |
| 1E-020 | `src/app/dashboard/reality-sync/page.tsx:26-47` | mock | Mock list of 9 banks + mock reconciliation log + mock webhook integrations. | (3) Incomplete | **P3** | Add UI banner "Sandbox integrations — not connected to live banks." |
| 1E-021 | `src/app/dashboard/institutional-memory/page.tsx:36` | mock | `// Mock IPFS pin list (in production: pulled from Pinata / own IPFS node).` | (3) Incomplete | **P3** | Replace with `db.ipfsEvidence.findMany` or label "Simulated pin list." |
| 1E-022 | `src/app/dashboard/calendar/page.tsx:63, 123` | mock | `// Mock compliance deadlines: police clearance expiry + next quarterly valuation` | (3) Incomplete | **P3** | Pull from `Enterprise.policeClearanceExpiresAt` + `QuarterlyReport.dueDate`. |
| 1E-023 | `src/app/dashboard/alumni/page.tsx:44-45` | mock / hardcoded | `totalCapitalGraduatedEgp = total > 0 ? 250_000_000 : 0; // mock — based on SmartFarm raise` and `avgYearsToGraduation = total > 0 ? 2.6 : 0;` | (3) Incomplete | **P3** | Compute real alumni aggregates from `Enterprise` where `stage === "graduated"`. |
| 1E-024 | `src/app/dashboard/accounting/page.tsx:97` | mock | `// Mock statutory deadlines.` | (3) Incomplete | **P3** | Compute from `enterprise.reportingCadence` + ETA calendar. |
| 1E-025 | `src/app/dashboard/steward/page.tsx:83` | mock | `// from the last 90 days. Mock list replaced per ADMIN-4-5 task brief.` | (3) Incomplete | **P3** | Pull real steward actions from `AuditLog` filtered to `aurienta_rep` actors. |
| 1E-026 | `src/app/dashboard/company-owner/page.tsx:59-77` | mock | `// Mock GAFI linking state.` Hardcodes `gafiStatus: "verified"` for every Tier D enterprise. | (3) Incomplete | **P2** | Persist a real `Enterprise.gafiVerifiedAt` field; surface `verified` only when set. Today every Tier D enterprise falsely claims GAFI verification. |
| 1E-027 | `src/app/dashboard/credentials/page.tsx:26` | mock | `// Mock VCs derived from the user's memberships + shareholdings.` | (3) Incomplete | **P3** | Issue real Soulbound VCs via `soulbound-credential.ts` instead of deriving client-side. |
| 1E-028 | `src/components/dashboard/workforce/mentorship-board.tsx:606-628` | mock | `function mockGapsForMentee(mentee: MenteeForUi): string[]` — deterministic fake readiness gaps. | (3) Incomplete | **P3** | Pull real gaps from `Employee.skillMatrix` vs `Mentorship.requiredSkills`. |
| 1E-029 | `src/components/dashboard/capital2/drip-card.tsx:68` | mock | `// Mock projected next dividend: 4% annual yield on cost basis.` | (3) Incomplete | **P3** | Compute real projection from `DividendDistribution` history. |
| 1E-030 | `src/components/dashboard/credentials/present-externally-button.tsx:9-34` | mock / simulated | `// fires a mock … to a verifier; in this mock, the verifier endpoint is not contacted` … `description: \`Type: ${vcType} · Subject: ${subjectLabel} · Verifier handshake simulated.\`` | (2) Approved demonstration feature | **P3** | Acceptable; toast already says "simulated." |
| 1E-031 | `src/components/dashboard/workforce/career-ledger-timeline.tsx:132-135` | stub / mock | `const cidStub = "Qm" + Math.random().toString(36)…` … `description: \`Pinned to IPFS: ${cidStub}…\`` — client fabricates a CID and toasts "pinned to IPFS" without any server call. | (4) Production-breaking | **P2** | Call POST `/api/evidence` (real `computeCid`) and toast the returned CID. Do not fabricate CIDs client-side. |
| 1E-032 | `src/components/trust/evidence-stream.tsx:118` | fake / mock | `// Fake progress while we POST metadata (no actual bytes are streamed — mock IPFS)` — UI shows fake upload progress bar that completes regardless of upload status. | (3) Incomplete | **P3** | Use XHR `progress` event for real upload percentage, or label the bar "Preparing metadata…". |
| 1E-033 | `src/components/dashboard/manager/manager-summary-cards.tsx:7` | mock | `monthlyBudget: number; // mock monthly budget = monthly burn` | (3) Incomplete | **P3** | Pull real budget from `Expense.budget` aggregate. |
| 1E-034 | `src/components/auth/register-types.ts:116-117` + `step-activation.tsx:24-27` | mock (display only) | `/** Mock Ed25519 anchor hash — generated client-side for display only. */ export function mockAnchorHash(seed: string): string` Used as a fallback display when the wizard opens directly on the Activation step. | (2) Approved demonstration feature | **P3** | Acceptable (display only; server does real Ed25519). Rename to `displayAnchorHash` to remove "mock" framing. |
| 1E-035 | `src/lib/aurienta/ai.ts:891-905` (`mockCid`, `mockHash`) | mock (dead code) | Two exported mock generators. Not called by any consumer (verified by ripgrep). The real `computeCid()` in `ipfs.ts` is used instead. | (1) Test-only / dead code | **P3** | Delete `mockCid` and `mockHash` exports to prevent future accidental use. |
| 1E-036 | `src/lib/aurienta/smart-db-router.ts:57` | TODO | `analytics: neonConfigured ? tursoDb : tursoDb, // TODO: wire Neon client when SDK installed` — both branches return the same DB (no analytics router). | (3) Incomplete | **P2** | Either install `@neondatabase/serverless` and route analytics reads to Neon, or remove the dead branch + TODO. |
| 1E-037 | `src/lib/aurienta/health-rating.ts:218` | TODO | `trend: "stable", // TODO: compare with previous calculation` — trend is always "stable". | (3) Incomplete | **P3** | Compare current score to previous `HealthRating` row; emit `improving \| stable \| declining`. |
| 1E-038 | `src/lib/aurienta/cre.ts:1440` | TODO (in comment only) | `// — TODO in a future task). In this sandbox, this is always false unless` — comment text mentions TODO; not an actionable TODO marker in code. | (1) Intentional / documentation | **P3** | Rephrase comment to remove the word "TODO" so it does not show in audits. |
| 1E-039 | `src/lib/aurienta/fx-oracle-real.ts:220` | false positive | `// Parse the ECB XML — find <Cube currency="XXX" rate="N.NNNN"/>` — "XXX" is the ISO 4217 placeholder currency code in the ECB feed, not a TODO marker. | (1) False positive | **P3** | No action. |
| 1E-040 | `src/components/dashboard/capital/reserve-shares-dialog.tsx:73-75` | mock / placeholder | `// Reference code preview (mock; actual code generated server-side on confirm).` Preview shows `AURI-2026-${slug}-XXXX-${ts}` — the `XXXX` is a placeholder slot for a server-generated hash. Acceptable. | (2) Approved demonstration feature | **P3** | Acceptable. |
| 1E-041 | `src/lib/aurienta/production-readiness.ts:287-289` | self-audit inaccuracy | The self-audit claims: `TD-04 TODOs/FIXMEs = PASS, evidence: "rg scan: 1 TODO in codebase"` — actual scan shows 4 actionable TODOs. `TD-05 = PARTIAL` and `TD-06 = PARTIAL` correctly admit deferred mock work, but `TD-08 Console.log removal = PASS` is correct (only 2 hits, both benign). | (6) Requires clarification | **P2** | Refresh the production-readiness evidence counts: 4 TODOs (not 1), 5 P0/P1 mocks still in production paths (1E-001…1E-008). |
| 1E-042 | `src/lib/aurienta/offline-cre.ts:696-698` | stub | `// ── SMS notification stubs ──` `// STUB: In production, queued SMS would be dispatched via Twilio/Vonage when` | (3) Incomplete | **P3** | Acceptable deferred feature; document in spec that SMS dispatch is Phase-5. |
| 1E-043 | `src/components/dashboard/sovereignty2/tax-page.tsx:94` | mock (display) | `{/* Current tax status (mock) */}` — UI panel shows mock tax status. | (3) Incomplete | **P3** | Pull real ETA filing status via `verifyTaxFiling()` (currently mocked) or label "Demo data." |
| 1E-044 | `src/app/api/skill-equity/route.ts:34, 144` | mock | `// generates a mock CID + hash for the uploaded document, creates a SkillEquityClaim` — uses real `computeCid` (per `ipfs.ts`) but the comment says "mock". Misleading comment; actual code is fine. | (1) Documentation-only | **P3** | Update comment to reflect that `computeCid()` is a real SHA-256 computation (only the IPFS *pinning* is mocked). |
| 1E-045 | `src/app/api/expenses/budget/route.ts:129` | placeholder | `// For now, use a placeholder derived from fundraising goal.` | (3) Incomplete | **P3** | Replace with real budget table or label "Estimated (proportional to raise)." |
| 1E-046 | `src/lib/aurienta/ai-prompt-tiers.ts:181` + `src/instrumentation-node.ts:20` | console.log | `console.log(\`[brain-ai] Tiered prompt: …\`)` (gated behind `LOG_LEVEL === "debug"`) and `console.log("[instrumentation] Global error handlers registered.")` (startup banner). | (2) Approved demonstration feature | **P3** | Both benign — debug-gated + startup banner. Self-audit TD-08 claim is correct. |

---

## 3. Top 10 highest-severity findings (highlighted)

1. **1E-001 — KYC liveness accepts client-submitted scores (P0).** `src/app/api/verification/kyc/route.ts:14-76`. Any signed-in user can POST `{}` and receive `verificationLevel: "L3"` because the server defaults missing scores to `0.97/0.95/0.98` — all above the L3 threshold. The persisted `User.verificationLevel` is the basis for downstream KYC-gated actions.
2. **1E-015 — KYC client/server schema mismatch compounds 1E-001 (P0).** `src/components/auth/steps/step-kyc.tsx:90-100`. Client posts `liveness.dfdcScore / facenetMatch`; server reads `body.livenessScore / faceMatchScore`. They never line up, so the default-L3 path is exercised on every wizard completion.
3. **1E-002 — Public gov-API routes return `verified: true` for any well-formed ID (P0).** `src/lib/aurienta/gov-api.ts` + `src/app/api/v1/gov/{gafi,nosi,eta}/route.ts`. No authentication; any caller gets a "verified" GAFI / NOSI / ETA record with a fabricated `reference` number.
4. **1E-008 — `FIELD_ENCRYPTION_KEY` falls back to a hardcoded dev key in production (P0).** `src/lib/aurienta/env.ts:33-45`. Only `console.error`s; does not throw. A misconfigured prod deployment silently encrypts PII with a public-plaintext key.
5. **1E-003 — `verifyInvoice()` trusts a mock bank API that fabricates fund-movement evidence (P1).** `src/lib/aurienta/eve.ts:42-65`. 70 % of invoice refs deterministically return `found: true, beneficiaryName: "Law Firm Client Account"`. EVE then issues `verified: true` based on this fabricated evidence.
6. **1E-004 — Milestone evidence submission fabricates `eveConfidence` (P1).** `src/app/api/enterprises/[id]/milestones/route.ts:101-110`. `0.7 + Math.random()*0.18` is persisted as if real Evidence Verification Engine output, then used by milestone-release gates.
7. **1E-005 — Constitutional proposal AI risk assessment is `Math.random()` (P1).** `src/app/api/proposals/route.ts:262-265`. `aiRiskScore`, `aiRecommendation`, `aiConfidence` all fabricated despite the platform having a real `askConstitutionalAI()` available.
8. **1E-006 — `verifyPin()` always returns `pinned: true, retrievable: true` (P1).** `src/lib/aurienta/ipfs.ts:106-122`. Constitutional evidence is claimed retrievable when no real IPFS pinning happened.
9. **1E-007 — External ERP `syncModule()` always returns `success: true` (P1).** `src/lib/aurienta/erp-integration.ts:352-381`. NetSuite / Odoo / SAP / Custom REST / Custom GraphQL providers never actually receive a request, yet the `ErpIntegration.lastSyncStatus` is recorded as `"success"`.
10. **1E-026 — `/dashboard/company-owner` falsely claims GAFI verification for every Tier D enterprise (P2).** `src/app/dashboard/company-owner/page.tsx:59-77`. `gafiStatus: "verified"` is hardcoded for every Tier D enterprise.

---

## 4. Density metrics

| Metric | Value |
|---|---|
| Total source files in scope | 900 |
| Total source lines in scope | 171,917 |
| Actionable TODO/FIXME/XXX/HACK markers | 4 |
| TODO density | 1 per 42,979 LoC |
| Mock-related findings (after triage) | 26 |
| False-success / silent-fallback findings | 7 |
| P0 findings | 5 |
| P1 findings | 6 |
| P2 findings | 8 |
| P3 findings | 27 |

The codebase has very low TODO density, but a non-trivial concentration of *documented-as-sandbox* mocks that are reachable from production-facing API routes without an env gate. The self-audit in `production-readiness.ts` (TD-04/05/06/08) understates the residual mock surface — particularly the KYC, gov-API, EVE-bank, milestone-EVE, and proposal-AI mocks that fabricate verification / risk data persisted to the database.

---

## 5. Notes & exclusions

- The 167 `placeholder=` HTML attribute hits are not findings — they are legitimate form-field placeholders.
- The 12 `return { ok: true }`-shaped hits were all legitimate success returns (type-discriminated unions or end-of-`cancelOrder`); none were false-success states.
- The 689 raw `catch { … }` blocks were spot-checked; the few empty `catch { return null }` instances are documented defensive fallbacks (JSON.parse on UI-side payloads, etc.) and surface `fallbackUsed` to callers.
- `src/components/ui/` (shadcn primitives) and `src/app/api/health/` were excluded per mandate.
- `examples/websocket/`, `scripts/`, `skills/`, `prisma/seed.ts` were out of scope (outside `src/`).
- No `alert(` browser-modal calls were found in scope.
- No `process.env.NODE_ENV === "test"` / `jest` / `vitest` imports appear in `src/` — test fixtures live exclusively in `src/lib/__tests__/` and were not in scope per the mandate exclusion list.
- **No code was modified.** Inspect-only as required by the mandate.
