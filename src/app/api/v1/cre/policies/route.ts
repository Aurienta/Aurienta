import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/cre/policies
// Lists all available CRE policies — the "constitution in code" (Vol 2 §2.3).
// External auditors and regulators can enumerate the rules the CRE enforces.
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const policies = [
    {
      name: "zero_custody",
      regoFile: "zero_custody.rego",
      description: "Blocks any transfer to an AURIENTA-owned account (Non-amendable Rule I-1.1).",
      params: ["beneficiary"],
    },
    {
      name: "expense_authority",
      regoFile: "expense_authority.rego",
      description: "Enforces tiered expense approval: <1% solo, 1-10% dual-sig, >10% board (Art. 118).",
      params: ["amountEgp", "capitalEgp", "role"],
    },
    {
      name: "price_band",
      regoFile: "price_band.rego",
      description: "Enforces ±5% standard price band (±3% for block trades) around fundamental value.",
      params: ["proposedPrice", "fundamentalPrice", "blockTrade"],
    },
    {
      name: "priority_windows",
      regoFile: "priority_windows.rego",
      description: "Phase 1 (48h pro-rata), Phase 2 (24h employees), Phase 3 (general). Server assigns phase by role (Vol 9 §9.3).",
      params: ["userRole", "requestedPhase"],
    },
    {
      name: "circuit_breaker",
      regoFile: "circuit_breaker.rego",
      description: "3-level price halt: ±8%/15min, ±12%/30min, ±20%/24h (Vol 9 §9.7).",
      params: ["enterpriseId", "proposedPrice"],
    },
    {
      name: "screening_gate",
      regoFile: "aml_screening_gate.rego",
      description: "Blocks downstream fund flow when AML screening result is 'blocked' (DE-NEW-2).",
      params: ["userId", "enterpriseId", "action"],
    },
    {
      name: "succession_gate",
      regoFile: "succession_gate.rego",
      description: "Enforces cryptographic succession: declaration filed, voting proxy activated, emergency manager appointed (Vol 16 §16.1).",
      params: ["userId", "action"],
    },
    {
      name: "verification_gate",
      regoFile: "verification_gate.rego",
      description: "Blocks capital deployment until user verification is L2+, enterprise founding until L3 (DE-NEW-3).",
      params: ["userId", "action"],
    },
    {
      name: "manager_removal",
      regoFile: "art118_manager_removal.rego",
      description: "Enforces Art. 118 manager removal: 48h cooling, 72h voting, 50% threshold.",
      params: ["managerId", "enterpriseId", "reason", "hasShareholderVote", "votePassed"],
    },
    {
      name: "dynamic_minimum",
      regoFile: "dynamic_minimum.rego",
      description: "Computes the dynamic minimum capital participation (Add-on 19).",
      params: ["tier", "enterpriseCapital"],
    },
    {
      name: "kyc_gate",
      regoFile: "kyc_gate.rego",
      description: "Blocks enterprise founding until KYC verification is complete (Non-amendable Rule I-1.6).",
      params: ["verificationLevel", "action"],
    },
    {
      name: "family_consent",
      regoFile: "family_consent.rego",
      description: "Requires family consent for users under 21 (Art. 31 Civil Code).",
      params: ["userAge", "hasFamilyConsent"],
    },
    {
      name: "consulting_optout",
      regoFile: "consulting_optout.rego",
      description: "Allows consulting opt-out after 3 profitable quarters or 2 years (§4.11).",
      params: ["enterpriseId"],
    },
    {
      name: "founder_equity_cap",
      regoFile: "founder_equity_cap.rego",
      description: "Caps founder equity at 49% (anti-capture, Non-amendable Rule I-1.3).",
      params: ["founderEquityPct"],
    },
    {
      name: "salary_to_equity",
      regoFile: "salary_to_equity.rego",
      description: "Converts salary to equity at 10%/15% discount, 12-month vesting (Vol 8 §8.3).",
      params: ["salaryEgp", "enterpriseId"],
    },
    {
      name: "tier_migration",
      regoFile: "tier_migration.rego",
      description: "Validates tier upgrade eligibility (A→B→C→D→E→F).",
      params: ["fromTier", "toTier", "enterpriseId"],
    },
    {
      name: "nosi_registration",
      regoFile: "nosi_registration.rego",
      description: "Requires NOSI registration for all employees before payroll (Vol 8 §8.4).",
      params: ["employeeId"],
    },
    {
      name: "equity_lockup",
      regoFile: "equity_lockup.rego",
      description: "12-month lock-up on equity units (Vol 9 §9.2).",
      params: ["userId", "enterpriseId", "acquiredAt"],
    },
  ];

  return NextResponse.json({
    engineVersion: "CRE-TS-1.0",
    totalPolicies: policies.length,
    policies,
    note: "Each policy is enforced as an inline TypeScript guard function mirroring the corresponding Rego policy from Volume 18. Decision tokens are Ed25519-signed for tamper-evidence.",
  });
});
