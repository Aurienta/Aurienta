// AURIENTA Institutional Architecture — Egypt-Fortress Production v2.0
// ═══════════════════════════════════════════════════════════════
// This file is the single source of truth for the AURIENTA corporate
// structure. Every document, AI prompt, UI label, legal agreement, and
// developer reference must align with this file.
//
// STRUCTURE VERSION: 2.0 ("Egypt-Fortress Production")
// Adopted: 2026-09-02
// Authority: Founder & Sole Owner — Mohamed Eltonsy
//
// KEY CHANGES vs v1.0:
//   • Holding is now an Egyptian Joint Stock Company (JSC, Law 159/1981),
//     not a generic "Holding Group". Enables dual-class shares + capital raise.
//   • Split the single "Operations" entity into FOUR direct sister
//     subsidiaries: Tech LLC, OpCo LLC, Advisory LLC, Middleware LLC.
//     Rationale: bankruptcy-remote isolation. OpCo insolvency cannot reach
//     Tech (IP), Advisory (human risk), or Middleware (API relay).
//   • Added Class A / Class B share structure with constitutional veto.
//   • Added the "Hash-Only" non-custodial settlement architecture.
//   • Added FRA Outsourcing Register positioning (avoids CBE PSP license).
//
// DO NOT modify without Founder & Sole Owner approval.
// ═══════════════════════════════════════════════════════════════

export const ARCHITECTURE_VERSION = "2.0-egypt-fortress" as const;

export const INSTITUTIONAL_ARCHITECTURE = {
  version: ARCHITECTURE_VERSION,
  group: "AURIENTA Holding S.A.E.",
  founder: "Mohamed Eltonsy",
  founderTitle: "Founder & Sole Owner",
  ownership: "100% — no co-founders, no shareholders, no investors, no equity dilution",
  constitutionalHash: "0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A",

  // ───────────────────────────────────────────────────────────────
  // CORPORATE LEGAL HIERARCHY — "The Fortress Chassis"
  // ───────────────────────────────────────────────────────────────
  // Holding JSC owns 4 direct sister LLCs. None is a child of another.
  // This is the bankruptcy-remote design: OpCo's creditors cannot reach
  // Tech (IP), Advisory (humans), or Middleware (API relay).
  entities: {
    holding: {
      name: "AURIENTA Holding S.A.E.",
      legalForm: "Joint Stock Company (Law 159/1981)",
      ownership: "100% owned by Founder",
      responsibilities: [
        "Group Strategy",
        "Corporate Governance",
        "Constitutional Oversight (Class B veto)",
        "Capital Allocation",
        "Group Legal & Enterprise Risk",
        "Internal Audit",
        "Long-Term Institutional Direction",
      ],
      owns: [
        "AURIENTA Tech LLC (100%)",
        "AURIENTA OpCo LLC (100%)",
        "AURIENTA Advisory LLC (100%)",
        "AURIENTA Middleware LLC (100%)",
      ],
      doesNotDo: "Day-to-day operations; no client-facing activity",
      shareClasses: {
        classA: {
          name: "Class A Ordinary Shares",
          holders: "Investors, future employees",
          rights: "Economic rights (dividends, liquidation). Freely transferable subject to pre-emption.",
        },
        classB: {
          name: "Class B Constitutional Shares (Golden)",
          holders: "Founder / Core Stewards",
          rights: "Veto power ONLY over amendments to the non-amendable constitutional rules",
          nonAmendableRules: [
            "Zero Custody (funds never touch AURIENTA)",
            "Fundamental Pricing (±5% band, no speculation)",
            "AI-Enforced Governance (CRE determinism)",
            "Anti-Speculation doctrine",
            "Art. 118 manager removal by shareholders",
          ],
          legalBasis: "Law 159/1981 Art. 83 — different classes of shares with varying rights, defined in the Articles of Association.",
        },
      },
    },

    tech: {
      name: "AURIENTA Tech LLC",
      legalForm: "LLC (Law 159/1981)",
      parent: "Holding (direct subsidiary, 100%)",
      responsibilities: [
        "Owns ALL intellectual property",
        "CRE source code",
        "Rego policy engine",
        "JOZOUR v3 valuation model",
        "EVE (Economic Value Engine)",
        "Graph models & Knowledge Base",
        "Constitutional Blueprint (source document)",
        "Trademarks & AI routing logic",
        "Licenses IP to OpCo (arm's-length royalty, Law 91/2005)",
      ],
      revenueModel: "Royalty from OpCo (arm's-length, transfer-priced)",
      doesNotDo: "Client-facing operations; regulatory interfaces",
    },

    opco: {
      name: "AURIENTA OpCo LLC",
      legalForm: "LLC (Law 159/1981)",
      parent: "Holding (direct subsidiary, 100%)",
      responsibilities: [
        "FRA Outsourcing Register holder (Decree 141/2023)",
        "FRA Sandbox applicant (Law 5/2022)",
        "Signs Master Service Agreements with Enterprise SPVs",
        "Employs compliance & core platform staff",
        "Hosts the CRE logic (licensed from Tech LLC)",
        "Contracts via SLAs with Advisory and Middleware (pure vendor relationship)",
      ],
      revenueModel: "Receives ONLY the 5% platform fee (net of VAT)",
      doesNotDo: "Hold client funds; initiate bank payments; develop software IP",
      regulatoryPath: {
        primary: "FRA Outsourcing Register (Decree 141/2023)",
        secondary: "FRA Regulatory Sandbox (Law 5/2022) — optional, recommended",
        avoided: "CBE PSP license (EGP 20M capital) — AURIENTA never holds/initiates payments",
      },
    },

    advisory: {
      name: "AURIENTA Advisory LLC",
      legalForm: "LLC (Law 159/1981)",
      parent: "Holding (direct subsidiary, 100%)",
      responsibilities: [
        "Employs human Stewards",
        "Police-clearance reviews (Add-on 27)",
        "NOSI registration facilitation & coordination (Add-on 26)",
        "Governance consulting",
        "Constitutional certification & training",
      ],
      revenueModel: "Receives the 2.5% consulting fee",
      doesNotDo: "Software development; bank API relay; client fund custody",
      isolationPurpose: "Isolates professional negligence (E&O) liability from OpCo and Tech",
    },

    middleware: {
      name: "AURIENTA Middleware LLC",
      legalForm: "LLC (Law 159/1981)",
      parent: "Holding (direct subsidiary, 100%)",
      responsibilities: [
        "Stateless API relay ONLY",
        "Generates cryptographic attestations (SHA3-256 hashes)",
        "Holds HSM-protected API credentials (GAFI, NOSI, MOI)",
        "Routes signed payloads to Law Firm HSM for co-signing",
      ],
      revenueModel: "Intercompany service fee from OpCo",
      doesNotDo: "Hold bank API credentials; hold client funds databases; initiate payments to banks",
      nonCustodialPurity: "NEVER holds, moves, or controls client funds. NEVER initiates a payment order to the bank. ONLY generates a cryptographic hash that the Law Firm's HSM chooses to act upon.",
      bindingRecordClause: "Middleware's duty is discharged on successful transmission of the signed payload to the Law Firm's HSM endpoint. It bears no liability for subsequent bank or law-firm execution latency, rejection, or processing delays.",
    },
  },

  // ───────────────────────────────────────────────────────────────
  // NON-CUSTODIAL SETTLEMENT ARCHITECTURE — "Hash-Only + FRA Outsourcing"
  // ───────────────────────────────────────────────────────────────
  settlementArchitecture: {
    name: "Hash-Only + FRA Outsourcing",
    purpose: "Avoid CBE classification as a Payment Initiation Service Provider (PSP) and the EGP 20M capital requirement",
    flow: [
      {
        step: 1,
        actor: "Client Enterprise SPV",
        action: "Deposits funds into CBE-regulated Partner Bank Master Escrow Account",
      },
      {
        step: 2,
        actor: "Constitutional Runtime Engine (CRE)",
        action: "Calculates atomic fee split: Principal + 5% Platform + 2.5% Advisory + 0.5% Reserve + Taxes",
      },
      {
        step: 3,
        actor: "AURIENTA Middleware LLC",
        action: "Signs the instruction payload with CRE Private Key (Key 1), generates SHA3-256 hash. Does NOT transmit to bank.",
      },
      {
        step: 4,
        actor: "Law Firm Fiduciary HSM (Key 2)",
        action: "Verifies the SHA3-256 payload against pre-signed fiduciary parameters (max limits, whitelisted IBANs, regulatory status). Auto-co-signs if valid.",
      },
      {
        step: 5,
        actor: "CBE-Regulated Partner Bank",
        action: "Receives dual-signed payload via mTLS. Executes atomic multi-destination sweep (same-day batch).",
      },
      {
        step: 6,
        actor: "Immutable Ledger",
        action: "CRE hash persisted as the sole binding record of the transaction instruction.",
      },
    ],
    legalConsequence: [
      "AURIENTA NEVER holds, moves, or controls funds.",
      "AURIENTA NEVER initiates a payment order to the bank.",
      "AURIENTA ONLY generates a cryptographic attestation (hash) that the Law Firm's HSM chooses to act upon.",
      "Liability Shift: The Law Firm is the principal initiating the payment. The CBE regulates the Law Firm's bank account, not AURIENTA's software.",
    ],
    antifragilityVault: {
      legal: "Segregated fiduciary account at CBE Partner Bank",
      owner: "Law Firm (fiduciary) on behalf of Enterprise SPVs as beneficiaries",
      aurientaClaim: "NONE — AURIENTA has zero legal claim on the Antifragility Vault",
      contribution: "0.5% of each milestone release",
      purpose: "Insurance against enterprise failure, systemic shocks, and graduation-gap coverage",
    },
  },

  // ───────────────────────────────────────────────────────────────
  // REGULATORY POSITIONING — "FRA Only" Strategy
  // ───────────────────────────────────────────────────────────────
  regulatoryPositioning: {
    primaryPath: {
      name: "FRA Outsourcing Register",
      entity: "AURIENTA OpCo LLC",
      basis: "Decree No. 141 of 2023",
      classification: "Outsourcing Services Provider for Non-Banking Financial Institutions (Law Firms)",
      requirement: "Egyptian JSC (already have) or commitment to convert within 12 months",
      implication: "Legitimizes AURIENTA as a tech vendor to law firms, explicitly excluding it from the CBE's Payment Initiation definition.",
    },
    secondaryPath: {
      name: "FRA Regulatory Sandbox",
      entity: "AURIENTA OpCo LLC",
      basis: "Law 5/2022",
      scope: "Testing of Constitutional Governance Algorithms (price band enforcement, deterministic voting, zero-custody instruction generation)",
      framing: "Explicitly software testing, NOT financial intermediation",
    },
    cbePath: {
      name: "CBE PSP License — DELIBERATELY AVOIDED",
      reason: "AURIENTA does not hold funds (Law Firm does) and does not initiate payments (Law Firm's HSM does). AURIENTA is a data attester.",
    },
  },

  // ───────────────────────────────────────────────────────────────
  // BLUEPRINT MAPPING — which entity implements which volume
  // ───────────────────────────────────────────────────────────────
  blueprintMapping: [
    { feature: "Constitutional Runtime Engine (CRE)", volume: "Vol 2", implementer: "Software Logic", entity: "Tech LLC (licensed to OpCo)" },
    { feature: "Zero-Custody Escrow Vault", volume: "Vol 5", implementer: "Bank Account", entity: "Law Firm (external fiduciary)" },
    { feature: "Police Clearance", volume: "Vol 12 (Add-on 27)", implementer: "Human Review", entity: "Advisory LLC" },
    { feature: "Social Insurance (NOSI)", volume: "Vol 12 (Add-on 26)", implementer: "API / Consulting", entity: "Middleware + Advisory LLC" },
    { feature: "Anti-Fragility Vault", volume: "Vol 5 (Add-on 8)", implementer: "Segregated Trust", entity: "Independent Trust Account (NOT AURIENTA owned)" },
    { feature: "Manager Removal (Art. 118)", volume: "Vol 7", implementer: "CRE Enforcement", entity: "OpCo (hosts CRE logic)" },
    { feature: "JOZOUR v3 Valuation", volume: "Vol 6", implementer: "AI Software", entity: "Tech LLC" },
    { feature: "Oracle Mirror Survival", volume: "Vol 12", implementer: "Physical Docs", entity: "Law Firm / OpCo" },
    { feature: "FRA Regulatory Shadow Mode", volume: "Vol 12", implementer: "Dashboard", entity: "OpCo (FRA Interface)" },
    { feature: "Graduation & Export", volume: "Vol 15", implementer: "Data Logic", entity: "Tech LLC" },
  ],

  // ───────────────────────────────────────────────────────────────
  // SCALABILITY / PHASED STANDUP PRINCIPLE
  // ───────────────────────────────────────────────────────────────
  scalabilityPrinciple: {
    title: "Phased Entity Standup Principle",
    text: "The 5-entity structure (Holding JSC + 4 LLCs) is the TARGET END-STATE, adopted at architecture-version 2.0. Execution is phased to match scale and capital efficiency: Phase 1 (Pilot) operates Holding + OpCo with IP/Advisory/Middleware as internal cost-centers; Phase 2 spins out Middleware LLC when real funds flow; Phase 3 spins out Tech LLC when external investors enter the cap table; Phase 4 spins out Advisory LLC when the Stewards team exceeds ~5 FTEs. The constitutional governance, enterprise architecture, and operating philosophy do not change across phases — only the legal entity count evolves.",
    phases: [
      { phase: "Phase 1 (Pilot, 2026 Q1)", entities: ["Holding JSC", "OpCo LLC"], note: "IP, Advisory, Middleware as internal cost-centers inside OpCo" },
      { phase: "Phase 2 (Volume trigger, ~Q3-Q4 2026)", entities: ["Holding JSC", "OpCo LLC", "Middleware LLC"], note: "Middleware spun out — regulatory isolation becomes valuable when real funds flow" },
      { phase: "Phase 3 (External investors)", entities: ["Holding JSC", "OpCo LLC", "Middleware LLC", "Tech LLC"], note: "Tech spun out — IP ring-fence matters when external capital enters the cap table" },
      { phase: "Phase 4 (Advisory scale)", entities: ["Holding JSC", "OpCo LLC", "Middleware LLC", "Tech LLC", "Advisory LLC"], note: "Advisory spun out when Stewards team exceeds ~5 FTEs — full 5-entity structure" },
    ],
  },

  governanceModel: {
    holding: "Strategic ownership, capital allocation, constitutional veto (Class B)",
    tech: "IP ownership & licensing — no client operations",
    opco: "Regulatory interface, MSA signatory, CRE host — no fund custody",
    advisory: "Human stewards, consulting, certification — no software dev",
    middleware: "Stateless API relay, hash generation — no fund access",
    principle: "No responsibility overlap between entities; each entity's revenue matches its function and its risk",
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// RACI RESPONSIBILITY MATRIX — 5-entity (v2.0)
// R = Responsible · A = Accountable · C = Consulted · I = Informed
// ═══════════════════════════════════════════════════════════════
export const RACI_MATRIX: Record<
  string,
  { holding: string; tech: string; opco: string; advisory: string; middleware: string }
> = {
  "Group Strategy": { holding: "A/R", tech: "C", opco: "C", advisory: "C", middleware: "I" },
  "Corporate Governance": { holding: "A/R", tech: "I", opco: "I", advisory: "I", middleware: "I" },
  "Constitutional Oversight (Class B Veto)": { holding: "A/R", tech: "I", opco: "C", advisory: "C", middleware: "I" },
  "IP Ownership & Licensing": { holding: "A", tech: "R", opco: "C", advisory: "I", middleware: "I" },
  "CRE Development": { holding: "I", tech: "A/R", opco: "C", advisory: "I", middleware: "I" },
  "CRE Hosting & Execution": { holding: "I", tech: "C", opco: "A/R", advisory: "I", middleware: "I" },
  "Brain AI": { holding: "I", tech: "A/R", opco: "C", advisory: "I", middleware: "I" },
  "JOZOUR v3 Valuation": { holding: "I", tech: "A/R", opco: "C", advisory: "I", middleware: "I" },
  "FRA Outsourcing Register": { holding: "A", tech: "I", opco: "R", advisory: "I", middleware: "I" },
  "FRA Sandbox Application": { holding: "A", tech: "I", opco: "R", advisory: "C", middleware: "I" },
  "Master Service Agreements (Enterprise SPVs)": { holding: "I", tech: "C", opco: "A/R", advisory: "C", middleware: "I" },
  "Compliance Operations": { holding: "A", tech: "I", opco: "R", advisory: "C", middleware: "I" },
  "Steward Employment": { holding: "I", tech: "I", opco: "I", advisory: "A/R", middleware: "I" },
  "Police Clearance Reviews": { holding: "I", tech: "I", opco: "C", advisory: "A/R", middleware: "I" },
  "NOSI Facilitation": { holding: "I", tech: "I", opco: "C", advisory: "R", middleware: "A" },
  "GAFI / MOI API Integration": { holding: "I", tech: "C", opco: "C", advisory: "I", middleware: "A/R" },
  "Cryptographic Hash Generation": { holding: "I", tech: "C", opco: "I", advisory: "I", middleware: "A/R" },
  "Settlement Payload Relay to Law Firm HSM": { holding: "I", tech: "I", opco: "I", advisory: "I", middleware: "A/R" },
  "Bank API Credentials (HSM)": { holding: "I", tech: "I", opco: "I", advisory: "I", middleware: "A" },
  "Client Fund Custody": { holding: "I", tech: "I", opco: "I", advisory: "I", middleware: "I" },
  "Antifragility Vault (Fiduciary)": { holding: "I", tech: "I", opco: "I", advisory: "C", middleware: "I" },
  "Constitutional Certification": { holding: "A", tech: "I", opco: "C", advisory: "R", middleware: "I" },
  "Partner Network": { holding: "I", tech: "I", opco: "C", advisory: "A/R", middleware: "I" },
  "Internal Audit": { holding: "A/R", tech: "C", opco: "C", advisory: "C", middleware: "C" },
  "Enterprise Risk": { holding: "A/R", tech: "C", opco: "C", advisory: "C", middleware: "C" },
  "Regional Expansion": { holding: "A", tech: "C", opco: "R", advisory: "C", middleware: "I" },
};

// ═══════════════════════════════════════════════════════════════
// IMPLEMENTATION ROADMAP — 90 days (from architecture adoption)
// ═══════════════════════════════════════════════════════════════
export const IMPLEMENTATION_ROADMAP_90D: Array<{
  weeks: string;
  action: string;
  responsible: string;
  phase: "Phase 1" | "Phase 2" | "Phase 3" | "Phase 4";
}> = [
  { weeks: "1-2", action: "Incorporate JSC & LLCs. File with GAFI. Draft Articles with Class A/B shares.", responsible: "Legal Counsel", phase: "Phase 1" },
  { weeks: "3-4", action: "Execute IP Assignment to Tech LLC. Execute intercompany IP License (Tech → OpCo).", responsible: "Founders + Tech LLC", phase: "Phase 1" },
  { weeks: "5-6", action: "Draft Legal Contracts. Embed Binding Record clause in all MSA templates. Draft Law Firm Partnership Agreements (Law Firm = Principal).", responsible: "OpCo + Law Firms", phase: "Phase 1" },
  { weeks: "7-8", action: "Apply to FRA Outsourcing Register (OpCo). Apply to FRA Sandbox (OpCo).", responsible: "OpCo + FRA Counsel", phase: "Phase 1" },
  { weeks: "9-10", action: "Onboard Pilot Law Firms (Min 3). Set up HSM nodes. Test Hash-Only relay in controlled environment.", responsible: "Middleware + Law Firms", phase: "Phase 2" },
  { weeks: "11-12", action: "Run End-to-End Simulation. Test Atomic Split-Settlement with dummy funds (no real investors) to validate CBE avoidance logic.", responsible: "OpCo + Bank + Law Firms", phase: "Phase 2" },
];
