// Unit tests for the Constitutional Runtime Engine (CRE) pure policy functions.
// Run with: bun test src/lib/__tests__/cre.test.ts
//
// We test only the deterministic policy guards — the DB-touching functions
// (appendLedgerEvent, computeGraduationReadiness) are out of scope here.

import { describe, expect, it } from "bun:test";
import {
  enforceZeroCustody,
  enforceExpenseAuthority,
  computeDynamicMinimum,
  enforcePriceBand,
  checkQuorum,
  enforcePoliceClearance,
} from "../aurienta/cre";

describe("enforceZeroCustody (Non-amendable Rule I 1.1)", () => {
  it("allows transfers to ordinary beneficiaries", () => {
    const v = enforceZeroCustody("Nile Legal Law Firm Client Account #1234");
    expect(v.allowed).toBe(true);
    expect(v.policy).toBe("zero_custody.rego");
    expect(v.reason).toBeUndefined();
    expect(v.decisionToken).toMatch(/^cre\./);
  });

  it("blocks transfers to AURIENTA-owned accounts (case-insensitive)", () => {
    const v = enforceZeroCustody("AURIENTA Operating Account");
    expect(v.allowed).toBe(false);
    expect(v.reason).toMatch(/Zero Custody/);
  });

  it("blocks transfers to AURIENTA_ with underscore separator", () => {
    const v = enforceZeroCustody("AURIENTA_Holding");
    expect(v.allowed).toBe(false);
  });

  it("blocks lowercase 'aurienta' prefix", () => {
    const v = enforceZeroCustody("aurienta treasury");
    expect(v.allowed).toBe(false);
  });

  it("does NOT block beneficiaries that merely contain 'aur' substring", () => {
    const v = enforceZeroCustody("Aura Lighting Supplies LLC");
    expect(v.allowed).toBe(true);
  });

  it("issues a unique-looking decision token per beneficiary", () => {
    const a = enforceZeroCustody("Beneficiary A");
    const b = enforceZeroCustody("Beneficiary B");
    expect(a.decisionToken).not.toBe(b.decisionToken);
  });
});

describe("enforceExpenseAuthority (Art. 118 / tier rules)", () => {
  const capital = 1_000_000;

  it("allows manager to authorise expenses <1% of capital", () => {
    const v = enforceExpenseAuthority(5_000, capital, "manager");
    expect(v.allowed).toBe(true);
    expect(v.policy).toBe("expense_authority.rego");
  });

  it("blocks non-managers from authorising <1% expenses", () => {
    const v = enforceExpenseAuthority(5_000, capital, "capital_partner");
    expect(v.allowed).toBe(false);
    expect(v.reason).toMatch(/manager or founding_operator role/);
  });

  it("allows founding_operator for <1% expenses", () => {
    const v = enforceExpenseAuthority(5_000, capital, "founding_operator");
    expect(v.allowed).toBe(true);
  });

  it("requires dual signature for 1–10% expenses (no single role satisfies dual-sig)", () => {
    const v = enforceExpenseAuthority(50_000, capital, "manager"); // 5%
    expect(v.allowed).toBe(false);
    expect(v.reason).toMatch(/dual signature/);
    expect(v.requiredApproverRoles).toEqual(["manager", "accounting_firm_rep"]);
  });

  it("blocks accounting_firm_rep acting alone in the 1–10% band (dual-sig required)", () => {
    const v = enforceExpenseAuthority(80_000, capital, "accounting_firm_rep"); // 8%
    expect(v.allowed).toBe(false);
  });

  it("blocks board_member acting alone in the 1–10% band (dual-sig required)", () => {
    const v = enforceExpenseAuthority(100_000, capital, "board_member"); // 10%
    expect(v.allowed).toBe(false);
  });

  it("blocks capital_partner from the 1–10% band", () => {
    const v = enforceExpenseAuthority(50_000, capital, "capital_partner"); // 5%
    expect(v.allowed).toBe(false);
  });

  it("requires board approval for expenses >10% of capital", () => {
    const v = enforceExpenseAuthority(150_000, capital, "manager"); // 15%
    expect(v.allowed).toBe(false);
    expect(v.reason).toMatch(/board approval/);
  });

  it("allows board_member to authorise >10% expenses", () => {
    const v = enforceExpenseAuthority(500_000, capital, "board_member"); // 50%
    expect(v.allowed).toBe(true);
  });

  it("treats exactly-1% as the dual-sig band boundary (denied to single role)", () => {
    const v = enforceExpenseAuthority(10_000, capital, "manager"); // exactly 1%
    expect(v.allowed).toBe(false);
    expect(v.reason).toMatch(/dual signature/);
  });

  it("treats exactly-10% as still the dual-sig band (inclusive; denied to single role)", () => {
    const v = enforceExpenseAuthority(100_000, capital, "manager"); // exactly 10%
    expect(v.allowed).toBe(false);
  });
});

describe("computeDynamicMinimum (Add-on 19)", () => {
  it("honours the 50 EGP floor for Tier A/B/C", () => {
    const v = computeDynamicMinimum(100_000, 10_000, "A");
    expect(v).toBeGreaterThanOrEqual(50);
  });

  it("honours the 50,000 EGP floor for Tier D", () => {
    const v = computeDynamicMinimum(100, 10_000, "D");
    expect(v).toBeGreaterThanOrEqual(50_000);
  });

  it("honours the 1 EGP floor for Tier F", () => {
    const v = computeDynamicMinimum(0, 10_000, "F");
    expect(v).toBeGreaterThanOrEqual(1);
  });

  it("rounds up to the nearest 100 EGP", () => {
    const v = computeDynamicMinimum(500_000, 1_000, "C");
    expect(v % 100).toBe(0);
    expect(v).toBeGreaterThanOrEqual(100);
  });

  it("returns a higher minimum when fewer slots remain", () => {
    const many = computeDynamicMinimum(1_000_000, 1_000, "C");
    const few = computeDynamicMinimum(1_000_000, 10, "C");
    expect(few).toBeGreaterThan(many);
  });

  it("does not divide by zero when remainingSlots is 0", () => {
    const v = computeDynamicMinimum(1_000_000, 0, "C");
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(50);
  });
});

describe("enforcePriceBand (fundamental pricing)", () => {
  const fundamental = 100;

  it("allows Phase 1 orders at exactly the fundamental price", () => {
    const v = enforcePriceBand(100, fundamental, "phase_1");
    expect(v.allowed).toBe(true);
    expect(v.policy).toBe("fundamental_pricing.rego");
  });

  it("blocks Phase 1 orders even 0.01 EGP above fundamental", () => {
    const v = enforcePriceBand(100.01, fundamental, "phase_1");
    expect(v.allowed).toBe(false);
    expect(v.reason).toMatch(/Phase 1\/2/);
  });

  it("blocks Phase 1 orders below fundamental", () => {
    const v = enforcePriceBand(99.99, fundamental, "phase_1");
    expect(v.allowed).toBe(false);
  });

  it("allows Phase 2 orders at exactly fundamental", () => {
    const v = enforcePriceBand(100, fundamental, "phase_2");
    expect(v.allowed).toBe(true);
  });

  it("allows Phase 3 orders within +5% band", () => {
    const v = enforcePriceBand(105, fundamental, "phase_3");
    expect(v.allowed).toBe(true);
  });

  it("allows Phase 3 orders within -5% band", () => {
    const v = enforcePriceBand(95, fundamental, "phase_3");
    expect(v.allowed).toBe(true);
  });

  it("blocks Phase 3 orders above +5%", () => {
    const v = enforcePriceBand(105.01, fundamental, "phase_3");
    expect(v.allowed).toBe(false);
    expect(v.reason).toMatch(/±5%/);
  });

  it("blocks Phase 3 orders below -5%", () => {
    const v = enforcePriceBand(94.99, fundamental, "phase_3");
    expect(v.allowed).toBe(false);
  });

  it("allows Phase 3 order at exactly +5% boundary", () => {
    const v = enforcePriceBand(105, fundamental, "phase_3");
    expect(v.allowed).toBe(true);
  });
});

describe("checkQuorum", () => {
  it("returns true when votes cast meet the quorum percentage", () => {
    expect(checkQuorum(51, 100, 50)).toBe(true);
  });

  it("returns true at exactly the quorum threshold", () => {
    expect(checkQuorum(50, 100, 50)).toBe(true);
  });

  it("returns false below the quorum threshold", () => {
    expect(checkQuorum(49, 100, 50)).toBe(false);
  });

  it("handles a 75% supermajority quorum (constitutional amendment)", () => {
    expect(checkQuorum(75, 100, 75)).toBe(true);
    expect(checkQuorum(74, 100, 75)).toBe(false);
  });

  it("returns true when no votes are needed (quorum 0)", () => {
    expect(checkQuorum(0, 100, 0)).toBe(true);
  });

  it("handles zero total voting power safely (no division-by-zero crash)", () => {
    expect(checkQuorum(0, 0, 50)).toBe(false);
  });
});

describe("enforcePoliceClearance (Add-on 27)", () => {
  it("blocks manager appointment when clearance is invalid", () => {
    const v = enforcePoliceClearance("manager", false);
    expect(v.allowed).toBe(false);
    expect(v.policy).toBe("police_clearance.rego");
    expect(v.reason).toMatch(/police clearance/);
  });

  it("allows manager appointment when clearance is valid", () => {
    const v = enforcePoliceClearance("manager", true);
    expect(v.allowed).toBe(true);
  });

  it("does not require clearance for non-manager roles", () => {
    const v = enforcePoliceClearance("capital_partner", false);
    expect(v.allowed).toBe(true);
  });

  it("does require clearance for board_member (denied when invalid)", () => {
    const v = enforcePoliceClearance("board_member", false);
    expect(v.allowed).toBe(false);
  });

  it("issues a decision token in every verdict", () => {
    const v = enforcePoliceClearance("manager", true);
    expect(v.decisionToken).toMatch(/^cre\./);
  });
});
