import { egp, pct, shortHash, vitalSign } from "../aurienta/format";

describe("Format: EGP", () => {
  it("formats basic amounts", () => { expect(egp(1000)).toBe("1,000 EGP"); });
  it("formats compact amounts", () => { expect(egp(1_500_000, { compact: true })).toBe("1.5M EGP"); });
});

describe("Format: Percentage", () => {
  it("formats with default 1 decimal", () => { expect(pct(33.333)).toBe("33.3%"); });
  it("formats with 0 decimals", () => { expect(pct(50, 0)).toBe("50%"); });
});

describe("Format: Short Hash", () => {
  it("returns dash for null", () => { expect(shortHash(null)).toBe("—"); });
  it("returns dash for non-string", () => { expect(shortHash(undefined as unknown as string)).toBe("—"); });
  it("truncates long hashes", () => {
    const r = shortHash("0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A");
    expect(r).toContain("…"); expect(r.length).toBeLessThan(42);
  });
});

describe("Format: Vital Sign", () => {
  it("returns green for healthy", () => { expect(vitalSign(15, 12, 6)).toBe("green"); });
  it("returns yellow for alert", () => { expect(vitalSign(8, 12, 6)).toBe("yellow"); });
  it("returns red for critical", () => { expect(vitalSign(3, 12, 6)).toBe("red"); });
  it("handles inverted metrics", () => { expect(vitalSign(10, 15, 25, true)).toBe("green"); expect(vitalSign(28, 15, 25, true)).toBe("red"); });
});
