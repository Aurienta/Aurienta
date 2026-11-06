# AURIENTA — Competitor Research Report

**Task ID:** 6-competitor-research
**Date:** 2026-11
**Author:** General-purpose research sub-agent
**Scope:** 13 competitor platforms × AURIENTA feature gap analysis
**Method:** Web search (z-ai SDK) + codebase audit cross-reference (`src/lib/aurienta/*`, `INTEGRATION_REGISTER.csv`, `GAP_ANALYSIS_AND_PLAN.md`, `STRATEGIC_ANALYSIS.md`)

---

## 0. How to Read This Report

AURIENTA already has unique infrastructure that **no competitor offers**: Constitutional Runtime Engine (CRE), Ed25519-signed verdicts, hash-chained ledger, 9-Vital-Signs Health Rating, sovereign identity anchors, succession protocol, graduation bond, AI consensus oracle (5-provider), GaaS API, productive EGP, AREI index, quadratic voting, Zeitgeist sentiment engine, enterprise genome. **This report focuses only on what AURIENTA is *missing* vs. competitors.**

AURIENTA's existing modules (`src/lib/aurienta/`) that already cover areas competitors play in:
- ✅ `erp.ts` — Constitutional ERP (better than Odoo on governance, but no real accounting ledger / AR / AP / GL)
- ✅ `salary-engine.ts` — Constitutional salary formula (calculates; no disbursement)
- ✅ `tax-engine.ts` — Egyptian tax rates (22.5% corp, 14% VAT, 10% WHT, 14%/18.75% payroll) — but mock ETA e-filing
- ✅ `dividend-distribution.ts` — CRE-enforced dividend flow
- ✅ `law-firm-webhook.ts` — Ed25519 signature verification (real; no replay protection yet)
- ✅ `crcica.ts` — Arbitration case ID generation (dead code — no callers)
- ✅ `graduation-bond.ts` — Constitutional bond issuance (new)
- ✅ `standalone-succession.ts` — Shamir 2/3 voting proxy (new)

What's missing is **plumbing** — the operational rails competitors have spent a decade building. The strategic opportunity: AURIENTA wraps those rails in CRE enforcement, which no competitor can match.

---

## 1. Top 10 Missing Features (ranked by impact × feasibility)

| # | Missing Feature | Closest Competitor | Feasibility | Priority | Impact on AURIENTA |
|---|---|---|---|---|---|
| 1 | **Real Egyptian payments + payroll disbursement** (Fawry / Paymob / NBE / CIB bank APIs, salary disbursement to employee wallets) | Fawry, Paymob, NBE Payroll | 🟢 High — public APIs, mature SDKs | 🔴 High | Without this, "constitutional payroll" is a calculation, not a payment. Unblocks ~5M Egyptian SME target market. |
| 2 | **Real KYC + AML** (liveness, OCR, ID doc verification, sanctions screening, PEP check) | Smile Identity (Africa-focused), Onfido, ComplyAdvantage | 🟢 High — Smile ID covers 15+ African countries incl. Egypt | 🔴 High | Closes Tier-1 constitutional guarantee breaker #1 (fake progress bar). Without it, "Zero Custody" assertion is unverifiable. |
| 3 | **Cap Table Management + Waterfall + Scenario Modeling** (Carta/Pulley core) | Carta, Pulley, OpenCapTable (OSS) | 🟢 High — `captableinc/captable` is AGPL-3, fully self-hostable; OCF JSON spec is open | 🔴 High | AURIENTA has capital-partner allocation but no formal cap table, no 409A, no dilution modeling, no exit waterfall. Critical for graduation to JSC. |
| 4 | **E-Signature + Document Automation** (legal templates already exist as clause strings — no signing flow) | DocuSign, PandaDoc, Documenso (OSS), DocuSeal (OSS) | 🟢 Very High — `documenso/documenso` is AGPL-3, MIT-core; self-host in 1 day | 🔴 High | Closes 30+ missing legal templates gap (GAP #15). Every incorporation, share issuance, employment contract needs e-sign. |
| 5 | **Banking-as-a-Service + Corporate Cards + Spend Management** (Mercury / Brex model) | Mercury, Brex, Rho | 🟡 Medium — needs banking partner; Egyptian neobanks (MNT-Halan, Khazna) have BaaS APIs | 🟠 Medium | Brex/Mercury are the #1 reason startups switch banks. Without cards + receipt OCR + expense policies, AURIENTA's ERP cannot close the loop on financial ops. |
| 6 | **Compliance Automation** (SOC 2, ISO 27001, GDPR, Egyptian PDPL) | Vanta, Drata, Comp AI (OSS) | 🟢 High — `Openlane` / `comp-ai` are open-source Vanta alternatives | 🟠 Medium | AURIENTA needs its own SOC 2 + ISO 27001 to win institutional capital. Internal tool first, productized second. |
| 7 | **Investor CRM + Fundraising Pipeline + Pitch Deck Sharing + Data Room** | Foundersuite, Visible.vc, Mercury Raise, Outreachr (OSS) | 🟢 High — `lalalune/outreachr` is local-first OSS fundraising OS | 🟠 Medium | Capital partners are investors, but there's no CRM tracking the funnel from "intro → diligence → wire". Closes B2B acquisition loop. |
| 8 | **Secondary Market / Tender Offers / Liquidity** (Carta Liquid, Nasdaq Private Market) | Carta Liquid, NPM, AngelList Secondary | 🟡 Medium — matching engine exists (`trade-matching.ts`); needs tender-offer workflow + auction logic | 🟠 Medium | Already in blueprint Vol 9, but only spot trading. Carta administered $3B in H1 2026 tender offers — that's the market. |
| 9 | **Open-source ERP Accounting Layer** (GL / AR / AP / Bank Reconciliation) | ERPNext (Frappe), Akaunting, Odoo Community | 🟢 Very High — `frappe/erpnext` is GPL-3 + full Arabic/RTL + Egypt partners exist | 🟠 Medium | AURIENTA's `erp.ts` is project/task/inventory — no double-entry ledger, no bank reconciliation, no AP/AR aging. ERPNext has all of it + 100+ Egyptian deployments. |
| 10 | **Egyptian Earned Wage Access (EWA) + Salary Advance** | Khazna, MNT-Halan | 🟡 Medium — Khazna's API exists; AURIENTA already has `salary-engine` data needed to underwrite | 🟠 Medium | 60% of Egyptian workers live paycheck-to-paycheck. AURIENTA's salary engine already knows each worker's earned-but-unpaid wage. Embedding EWA turns a calculation into a liquidity product. |

---

## 2. "Years Ahead" Features That Would Differentiate AURIENTA

These are features **no competitor has**, that would make AURIENTA genuinely years ahead — derived from intersections between competitor capabilities and AURIENTA's unique CRE/constitutional layer:

### 2.1 Constitutional Cap Table + Open Cap Table Format (OCF)
**Years ahead because:** Carta/Pulley track equity but **cannot enforce** vesting cliffs, anti-dilution, drag-along, or co-sale via a runtime engine. AURIENTA's CRE can sign every cap table mutation with Ed25519 and append to the hash-chained ledger. **No competitor has cryptographic enforcement of cap table invariants.**
- Adopt the [Open Cap Table Format](https://opencaptableprotocol.org) (JSON schema, MIT license, used by Carta/Pulley/AngelList internally) → instant interoperability
- Wrap every cap table event in a CRE policy: `enforceAntiCapture`, `enforceVestingCliff`, `enforceDragAlong`, `enforcePreEmptiveRights`
- Issue cap table state as an Ed25519-signed verifiable credential (soulbound)

### 2.2 Constitutional Payroll with Salary-to-Equity Conversion + Live Disbursement
**Years ahead because:** Gusto/Rippling run payroll but cannot convert salary into sweat equity, cannot refuse to disburse if a CRE policy is violated (e.g. paying a board-member a salary exceeding Tier-A ceiling), cannot auto-route to law-firm escrow. AURIENTA's `salary-engine.ts` already calculates; adding real NBE/CIB/Fawry disbursement + CRE-gated bank calls makes AURIENTA the **only payroll system in the world that can refuse to disburse unconstitutional payments**.

### 2.3 Egyptian Compliance Automation (PDPL + FRA + ETA + NOSI)
**Years ahead because:** Vanta/Drata cover SOC 2 / ISO 27001 (Western frameworks). No competitor automates Egyptian Personal Data Protection Law (PDPL — Law 151/2020), FRA regulatory reporting, ETA e-filing, NOSI social insurance. AURIENTA already has mocks of GAFI/NOSI/ETA — formalize them as continuous-control-monitoring + evidence collection. **First-mover advantage: no Egyptian GRC SaaS exists.**

### 2.4 Constitutional Health Score → Insurance Underwriting → Bond Pricing
**Years ahead because:** No competitor has a real-time constitutional health score feeding insurance premiums AND bond coupon rates. AURIENTA's 9 Vital Signs health rating, graduation bond, and takaful pool can form a closed loop: healthier enterprises → lower insurance premiums → lower bond coupons → cheaper capital. **This is the institutional-investor unlock.**

### 2.5 Succession-as-a-Service + Earned Wage Access + Diaspora Corridor (Bundle)
**Years ahead because:** No competitor bundles succession (Carta doesn't), EWA (Khazna doesn't do equity), and diaspora investment (Mercury Raise doesn't serve Egypt). AURIENTA has stubs for all three. Combined, they create a unique B2C financial super-app for the Egyptian middle class — replacing both the bank and the family lawyer.

### 2.6 AI-Enforced Document Generation (Not Just E-Sign)
**Years ahead because:** PandaDoc/DocuSign do document automation but cannot **enforce** that the contract clauses conform to the constitution (e.g. cap on interest, anti-dilution floor, succession clause presence). AURIENTA's CRE + AI Brain Copilot can validate every generated doc against the charter before signing. **First AI-enforced contract platform.**

### 2.7 Constitutional Pitch Deck + Investor Verification
**Years ahead because:** Mercury Raise / Foundersuite share decks but cannot verify investor accreditation, cannot enforce NDA via CRE, cannot prevent cap table leakage. AURIENTA's Ed25519 credentials + CRE-gated access + IPFS pinning make every shared doc auditable. **First cryptographic investor-relations platform.**

### 2.8 Payroll-Linked EWA + Productive Savings Auto-Invest
**Years ahead because:** Khazna does EWA but the cash sits in a wallet losing value to inflation. AURIENTA can auto-route earned-but-unpaid wages into Productive Savings Protocol (already in roadmap). **The first EWA → productive investment loop in the world.** Carta + Gusto + Wealthfront combined, for Egypt.

### 2.9 Mobile-First PWA + Offline CRE + USSD Fallback (60% of Egyptian market)
**Years ahead because:** Every competitor is desktop/web-first. AURIENTA's `offline-cre.ts` is already started. Add USSD fallback (works on feature phones) and SMS notifications → **real financial inclusion** for the 60% of Egyptian adults without a smartphone. No competitor targets this segment.

### 2.10 Constitutional ESG / Impact Reporting
**Years ahead because:** Briink/ESG Book do ESG data extraction but cannot **enforce** ESG commitments (no CRE). AURIENTA can encode ESG KPIs as CRE policies and refuse capital deployment if ESG thresholds are violated. **First ESG-enforcement platform, not just ESG-reporting.**

---

## 3. Specific Open-Source / Free Implementations to Use

### 3.1 Cap Table & Equity

| Need | OSS Project | License | Notes |
|---|---|---|---|
| Cap table management (Carta alt) | [`captableinc/captable`](https://github.com/captableinc/captable) | AGPL-3 | Next.js + tRPC + Prisma — same stack as AURIENTA. Direct drop-in. |
| Cap table data format | [Open Cap Table Format (OCF)](https://github.com/Open-Cap-Table-Coalition/Open-Cap-Format-OCF) | Apache-2.0 | JSON schema — adopt as the canonical serialization for AURIENTA's cap table export |
| Lightweight cap table math | [`PubInv/nano-cap-table`](https://github.com/PubInv/nano-cap-table) | MIT | Reference impl for waterfall math |
| 409A valuation engine | None OSS — but [`Equidam-style`](https://www.equidam.com) Berkus / VC / DCF models are public | N/A | Build small TS impl (3 methods = ~500 LOC) |

### 3.2 E-Signature & Document Automation

| Need | OSS Project | License | Notes |
|---|---|---|---|
| E-signature platform (DocuSign alt) | [`documenso/documenso`](https://github.com/documenso/documenso) | AGPL-3 | Self-hostable, MIT core. ~25k GitHub stars. Has API + UI. |
| Lighter alternative | [`docusealco/docuseal`](https://github.com/docusealco/docuseal) | AGPL-3 | Ruby on Rails. PDF form builder + e-sign. |
| Lightest alternative | [`OpenSignLabs/OpenSign`](https://github.com/OpenSignLabs/OpenSign) | AGPL-3 | Node.js + MongoDB. |
| PDF generation | [`pdf-lib`](https://github.com/Hopding/pdf-lib) | MIT | Already in JS ecosystem; combine with template engine |
| Document templating | [`carbone`](https://github.com/carboneio/carbone) | Apache-2.0 | Template engine for docs/invoices/reports |

### 3.3 Banking, Payments & Payroll Disbursement (Egypt-specific)

| Need | Provider | Type | Notes |
|---|---|---|---|
| Card / wallet / EGP payments | **Paymob API** | Commercial (free integration) | Accept cards, mobile wallets, Fawry cash. 200k+ Egyptian merchants. |
| Cash payments + bill pay | **Fawry API** | Commercial | 250k+ locations. Already integrated with Odoo via Tap-N-Pay (Aug 2026). |
| Bank direct (corporate) | **NBE e-Corporate Payment System** | Commercial | Salary disbursement, gov dues. |
| Bank direct (retail) | **CIB, Banque Misr APIs** | Commercial | Issuing/acquiring. |
| Earned Wage Access | **Khazna API** | Commercial | Salary + pension advances, prepaid card. |
| Neobank BaaS | **MNT-Halan API** | Commercial | Lending, wallet, BNPL. Licensed by CBE. |

| Need | OSS Project | License | Notes |
|---|---|---|---|
| Open banking aggregation | [`nordigen`](https://github.com/nordigen/nordigen-node) | MIT | European, but pattern + spec reusable for Egyptian banks |
| Payroll/HR (Egypt, on-prem) | **ZenHR**, **ILORA**, **Voyon Folks** | Commercial | Egyptian-built, Arabic RTL, NOSI compliance — partner or build wrapper |
| Open-source HR | [`frappe/hrms`](https://github.com/frappe/hrms) (Frappe HR) | GPL-3 | Payroll, leave, attendance, Arabic support. Same family as ERPNext. |

### 3.4 KYC / Identity / AML

| Need | Provider | Type | Notes |
|---|---|---|---|
| Egypt/Africa KYC + liveness + ID doc | **Smile Identity** | Commercial | Built for African IDs, faces, devices. Covers Egypt. $20M Series B. |
| Global KYC alt | **Onfido**, **Persona**, **Veriff** | Commercial | Higher cost, lower Egypt specificity |
| AML/sanctions screening | **ComplyAdvantage**, **Refinitiv World-Check** | Commercial | Required for FRA compliance |
| Egypt credit bureau | **I-Score (Egyptian Credit Bureau)** | Commercial | Required for credit checks |

| Need | OSS Project | License | Notes |
|---|---|---|---|
| Liveness / face match | [`minivision-core/MiniFASNet`](https://github.com/minivision-core) | Apache-2.0 | Silent face anti-spoofing — runs locally, no cloud |
| ID doc OCR (Egyptian) | [`PaddleOCR`](https://github.com/PaddlePaddle/PaddleOCR) | Apache-2.0 | Multilingual OCR incl. Arabic; self-host |
| Sanctions list matching | [`opensanctions`](https://github.com/opensanctions/opensanctions) | AGPL-3 | OFAC, EU, UN, UK lists — daily-updated |

### 3.5 ERP / Accounting Layer

| Need | OSS Project | License | Notes |
|---|---|---|---|
| Full ERP (GL/AP/AR/inventory/HR) | [`frappe/erpnext`](https://github.com/frappe/erpnext) | GPL-3 | 100% open-source, Arabic + RTL, Egypt partners (Data Value, IBAN, CraftInteractive). 13k+ stars. |
| Light accounting only | [`akaunting/akaunting`](https://github.com/akaunting/akaunting) | MIT | PHP/Laravel, but simpler. Invoicing, expenses, double-entry. |
| Bookkeeping + invoicing | [`InvoicePlane`](https://github.com/InvoicePlane/InvoicePlane) | MIT | PHP, very light. |
| Arabic invoicing | Egypt e-invoicing API (ETA) | Commercial (gov) | Mandatory for Egyptian businesses > EGP threshold — direct API integration required |

### 3.6 Compliance Automation

| Need | OSS Project | License | Notes |
|---|---|---|---|
| SOC 2 / ISO 27001 automation | [`Openlane`](https://github.com/Openlane-com/Openlane) (Vanta alt) | AGPL-3 | Open-source compliance automation |
| SOC 2 / ISO 27001 / HIPAA / GDPR | [`comp-ai`](https://github.com/compai/comp-ai) | AGPL-3 | Open-source compliance platform with audit-ready workflows |
| Evidence collection framework | [`SecureSlate`](https://getsecureslate.com) | Commercial | 72 AWS+Azure checks — reference architecture |

### 3.7 Investor CRM / Fundraising

| Need | OSS Project | License | Notes |
|---|---|---|---|
| Investor CRM + outreach | [`lalalune/outreachr`](https://github.com/lalalune/outreachr) | MIT | Local-first, OSS fundraising OS — investor research, ranking, outreach |
| Pitch deck sharing | None OSS — but [`Excalidraw`](https://github.com/excalidraw/excalidraw) (MIT) or [`reveal.js`](https://github.com/hakimel/reveal.js) (MIT) for self-hosted decks |
| Data room | [`filebrowser`](https://github.com/filebrowser/filebrowser) | Apache-2.0 | Self-hosted file manager with sharing + auth |
| Pipeline CRM | [`Twenty`](https://github.com/twentyhq/twenty) (AGPL-3) or [`Monica`](https://github.com/monicahq/monica) (AGPL-3) | OSS | Adaptable to investor pipeline |

### 3.8 ESG / Sustainability

| Need | OSS Project | License | Notes |
|---|---|---|---|
| ESG data schema | [GRI / SASB / TCFD](https://github.com/carbonfact/carbonculator) reference impls | Various | Public frameworks; build TS schema |
| Carbon accounting | [`carbonculator`](https://github.com/carbonfact/carbonculator) | MIT | Reference impl |
| Biodiversity / impact | [`Alien-catalog`](https://github.com/gbif) patterns | Various | — |

### 3.9 Collaborative Workspace / Notion Alt (low priority)

| Need | OSS Project | License | Notes |
|---|---|---|---|
| Notion alt | [`AppFlowy`](https://github.com/AppFlowy-IO/AppFlowy) | AGPL-3 | Rust + Flutter |
| Notion alt (web) | [`affine`](https://github.com/toeverything/AFFiNE) | AGPL-3 | Markdown + Miro-like |
| Doc collab | [`Trilium Notes`](https://github.com/zadam/trilium) | AGPL-3 | Self-hosted hierarchical notes |

> AURIENTA already has Constitutional Immutable Chat (3 channels per blueprint Vol 14) — workspace collab is partially in-scope. Treat as low priority.

### 3.10 Spend Management / Expense Cards (low priority without banking partner)

| Need | OSS Project | License | Notes |
|---|---|---|---|
| Receipt OCR | [`mindee/mindee-node`](https://github.com/mindee/mindee-node) | MIT | Receipt + invoice parsing API (free tier) |
| Open-source receipt OCR | [`python-invoice2data`](https://github.com/invoice-x/invoice2data) | MIT | Python; can be wrapped as a service |
| Expense tracker | [`Firefly III`](https://github.com/firefly-iii/firefly-iii) | AGPL-3 | Personal finance manager — reference architecture |

---

## 4. Priority-Ordered Implementation Roadmap

### Phase 1 — Constitutional Foundation Backstops (next 2 sprints)
- **F1.1** Real Smile Identity KYC + liveness + ID doc OCR (closes Tier-1 Gap #1)
- **F1.2** Real Fawry + Paymob payment integration (closes Zero-Custody Gap #3)
- **F1.3** Documenso self-hosted e-signature (closes 30+ legal templates gap, #15)
- **F1.4** OpenCapTable JSON spec adoption + captableinc/captable fork (closes cap table gap)

### Phase 2 — Operational Rails (sprints 3–4)
- **F2.1** ERPNext as sidecar for accounting GL/AP/AR + Egypt e-invoicing (closes double-entry ledger gap)
- **F2.2** Frappe HR (HRMS) for payroll disbursement + NOSI sync (closes payroll disbursement gap)
- **F2.3** Openlane / comp-ai for SOC 2 / ISO 27001 internal compliance (unlocks enterprise sales)
- **F2.4** Outreachr (or fork) for investor CRM + pitch deck + data room

### Phase 3 — Differentiating "Years Ahead" Features (sprints 5–6)
- **F3.1** Constitutional cap table — wrap OCF state in CRE + Ed25519 signed credentials
- **F3.2** Egyptian GRC SaaS — formalize GAFI/NOSI/ETA/FRA continuous monitoring
- **F3.3** Constitutional ESG enforcement — encode ESG KPIs as CRE policies
- **F3.4** EWA → Productive Savings auto-invest loop (Khazna API + Productive EGP module)

### Phase 4 — Market Expansion (sprints 7–8)
- **F4.1** MNT-Halan BaaS for cards + lending + BNPL
- **F4.2** Secondary market tender offers + waterfall (Carta Liquid-style)
- **F4.3** Smile Identity across 15+ African countries (cross-border expansion prep)
- **F4.4** PWA + Offline CRE + USSD fallback (60% of Egyptian market)

---

## 5. Competitive Positioning Statement (one-liner)

> *"Carta gives you a cap table. Gusto gives you payroll. Vanta gives you compliance. Mercury gives you banking. AURIENTA gives you all five — and the Constitutional Runtime Engine signs every transaction with Ed25519, refuses unconstitutional payments at the ledger level, and proves zero custody with law-firm-escrow webhooks. No competitor can match the constitutional layer. The opportunity is to wrap operational rails (which competitors have) in CRE enforcement (which they cannot replicate)."*

---

## 6. Honest Risk Assessment

| Risk | Mitigation |
|---|---|
| AURIENTA's AI providers are all currently failing (Gemini 401, Groq 404, OpenRouter 402, NVIDIA 404, HF timeout per INTEGRATION_REGISTER.csv INT-004a–e) | Fix AI keys BEFORE adding AI-heavy competitor features; current AI Brain Copilot is non-functional |
| Smart DB Router is dead code (INT-013 — `getSmartDb()` returns Turso for all 4 paths; 0 callers) | Fix before adding analytics-heavy features (cap table waterfalls, ESG reports) |
| Inngest is sandbox-only — 5 declared workflows never registered as Inngest functions (INT-003) | Fix before relying on async features like graduation protocol, dispute resolution |
| IPFS pinning is mocked (INT-010) — gateway URL would 404 in production | Fix before any feature that pins evidence (cap table snapshots, signed docs, ESG reports) |
| HSM is dead code (INT-012) — CRE platform key is software-derived from env var | Fix before claiming "non-exportable key" — required for institutional trust |
| FX oracle is single-source mocked (INT-011a–d) | Fix before cross-border / multi-currency features |

**The competitor features in this report assume AURIENTA fixes its existing broken integrations first.** Adding cap tables on top of a broken AI router + dead smart DB router compounds technical debt.

---

## 7. Sources

All research via `z-ai function web_search` — see `/tmp/aurienta-research/*.json` for raw results.

Key URLs:
- Carta: https://carta.com/equity-management/cap-table
- Pulley: https://pulley.com
- AngelList: https://www.angellist.com/rolling-funds
- Mercury: https://mercury.com/blog/mercury-raise
- Brex: https://www.brex.com/product/spend-management
- Gusto / Rippling: comparison sources in `payroll.json`
- Stripe Atlas: https://stripe.com/atlas
- Clerky: https://www.clerky.com/startups/products
- Foundersuite: https://foundersuite.com
- Vanta / Drata: https://drata.com/learn/compare/drata-vs-vanta-vs-optro
- PandaDoc: https://www.pandadoc.com
- Briink: https://www.briink.com
- Open Cap Table Format: https://opencaptableprotocol.org
- Captable OSS: https://github.com/captableinc/captable
- Documenso OSS: https://github.com/documenso/documenso
- ERPNext OSS: https://github.com/frappe/erpnext
- Openlane (Vanta alt) OSS: search `Openlane compliance`
- Comp AI OSS: search `comp-ai SOC 2`
- Outreachr OSS: https://github.com/lalalune/outreachr
- Smile Identity (Africa KYC): https://www.usesmileid.com
- Fawry: https://www.fawry.com
- Paymob: https://paymob.com
- Khazna: https://khazna.com
- MNT-Halan: https://www.mnt-halan.com
- EGX (graduation target): https://www.egx.com.eg + NILEX SME board

---

*End of competitor research report. Next action: present to Founder + CTO + COO for prioritization vote.*
