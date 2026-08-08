import { db } from "../src/lib/db";
import { createHash } from "crypto";
import { hashPassword } from "../src/lib/aurienta/password";
import { encryptField } from "../src/lib/aurienta/encryption";
import { generateUserKeypair, signWithUserKey, issueCreDecisionToken } from "../src/lib/aurienta/signing";

function sha(s: string) {
  return createHash("sha3-256").update(s).digest("hex");
}

async function main() {
  console.log("🌱 Seeding AURIENTA (hardened)…");

  // ── Service providers ──
  const nileLegal = await db.lawFirm.create({
    data: {
      name: "Nile Legal — Constitutional Escrow Partners",
      frLicenseNumber: "FRA-ESC-2026-0142",
      insuranceEgp: 120_000_000,
      expertiseScore: 88,
      status: "active",
    },
  });
  const cairoTrust = await db.lawFirm.create({
    data: {
      name: "Cairo Trust Law Group",
      frLicenseNumber: "FRA-ESC-2026-0089",
      insuranceEgp: 100_000_000,
      expertiseScore: 82,
      status: "active",
    },
  });
  const deltaAudit = await db.accountingFirm.create({
    data: { name: "Delta Audit & Assurance (ESAA)", esaaLicense: "ESAA-2019-3341", status: "active" },
  });
  const nileAudit = await db.accountingFirm.create({
    data: { name: "Nile Assurance Accountants", esaaLicense: "ESAA-2017-2210", status: "active" },
  });

  // ── Users (the cast of the blueprint) — REAL scrypt hashes + Ed25519 keys ──
  const commonPassword = hashPassword("aurienta2026"); // all demo users share a password for convenience

  function makeUser(overrides: Record<string, unknown> & { email: string; legalName: string; mobile: string }) {
    const kp = generateUserKeypair();
    const pledgeMsg = `AURIENTA Constitutional Pledge — ${overrides.email} — ${new Date().toISOString()}`;
    const pledgeSig = signWithUserKey(kp.secretEnc, pledgeMsg);
    return {
      passwordHash: commonPassword,
      identityAnchor: kp.publicKeyHex,
      identitySecretEnc: kp.secretEnc,
      pledgeSignedAt: new Date("2026-01-12"),
      pledgeSignature: pledgeSig,
      policeClearanceValid: true,
      policeClearanceExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      ...overrides,
      // Encrypt nationalIdLast4 LAST so it overrides any plaintext from `...overrides`
      nationalIdLast4: overrides.nationalIdLast4 ? encryptField(String(overrides.nationalIdLast4)) : null,
    };
  }

  const layla = await db.user.create({
    data: makeUser({
      email: "layla@streetbites.eg",
      mobile: "+201001234567",
      legalName: "Layla Mostafa",
      verificationLevel: "L2",
      nationality: "EG",
      nationalIdLast4: "4321",
      identityHash: sha("layla-29201011234567"),
      sovereignTrustScore: 78,
      tier: "Trusted Contributor",
      primaryIntent: "capital_partner",
      riskProfile: "balanced",
      pledgeSignedAt: new Date("2026-01-12"),
    }),
  });

  const ahmed = await db.user.create({
    data: makeUser({
      email: "ahmed@ecopack.eg",
      mobile: "+201122334455",
      legalName: "Ahmed Khaled",
      verificationLevel: "L3",
      nationality: "EG",
      identityHash: sha("ahmed-29209055667788"),
      sovereignTrustScore: 92,
      tier: "Constitutional Pillar",
      primaryIntent: "founding_operator",
      pledgeSignedAt: new Date("2025-11-02"),
    }),
  });

  const sarah = await db.user.create({
    data: makeUser({
      email: "sarah@investor.eg",
      mobile: "+201233344466",
      legalName: "Sarah Ibrahim",
      verificationLevel: "L3",
      nationality: "EG",
      identityHash: sha("sarah-29206077889900"),
      sovereignTrustScore: 85,
      tier: "Ecosystem Builder",
      primaryIntent: "capital_partner",
      riskProfile: "aggressive",
      pledgeSignedAt: new Date("2025-12-18"),
    }),
  });

  const mohamed = await db.user.create({
    data: makeUser({
      email: "mohamed@smartfarm.eg",
      mobile: "+201244455577",
      legalName: "Mohamed Adel",
      verificationLevel: "L3",
      nationality: "EG",
      identityHash: sha("mohamed-29205066778899"),
      sovereignTrustScore: 90,
      tier: "Constitutional Pillar",
      primaryIntent: "founding_operator",
      pledgeSignedAt: new Date("2025-10-05"),
    }),
  });

  const khalil = await db.user.create({
    data: makeUser({
      email: "khalil@holding.eg",
      mobile: "+201255566688",
      legalName: "Khalil Mansour",
      verificationLevel: "L4",
      nationality: "EG",
      identityHash: sha("khalil-29204055667788"),
      sovereignTrustScore: 81,
      tier: "Ecosystem Builder",
      primaryIntent: "institution",
      pledgeSignedAt: new Date("2025-09-12"),
    }),
  });

  // ── Enterprises ──
  const streetBites = await db.enterprise.create({
    data: {
      slug: "street-bites",
      name: "Street Bites",
      tagline: "Constitutional street food — Cairo's first token-free food network",
      description:
        "A Tier A microenterprise serving authentic Egyptian street food from three kiosks across Cairo. Founded by a first-time operator, it converts everyday capital into real-economy ownership — no speculation required.",
      sector: "food",
      tier: "A",
      stage: "stage_2",
      stageSince: new Date("2026-01-01"),
      legalForm: "LLC",
      healthRating: "BBB",
      healthScore: 80,
      fundraisingGoalEgp: 500_000,
      raisedEgp: 500_000,
      minInvestmentEgp: 50,
      investorCap: 100,
      equityUnitPriceEgp: 50,
      totalEquityUnits: 10_000,
      founderEquityPct: 5,
      monthlyRevenueEgp: 180_000,
      monthlyBurnEgp: 120_000,
      lawFirmClientAccountBalanceEgp: 180_000,
      grossMarginPct: 42,
      revenueGrowthPct: 28,
      employeeCount: 6,
      nosiCompliantPct: 100,
      graduationReadiness: 48,
      status: "active",
      founderId: layla.id,
      lawFirmId: nileLegal.id,
      accountingFirmId: deltaAudit.id,
    },
  });

  const ecoPack = await db.enterprise.create({
    data: {
      slug: "ecopack-solutions",
      name: "EcoPack Solutions",
      tagline: "Sustainable packaging for a sovereign Egyptian supply chain",
      description:
        "A Tier C growth enterprise producing compostable packaging for Egyptian retailers. ERP-integrated, AI-valued, governed by constitutional consensus — on the path to sovereign graduation.",
      sector: "manufacturing",
      tier: "C",
      stage: "stage_3",
      stageSince: new Date("2025-06-01"),
      legalForm: "LLC",
      healthRating: "AA",
      healthScore: 91,
      fundraisingGoalEgp: 12_000_000,
      raisedEgp: 12_000_000,
      minInvestmentEgp: 50,
      equityUnitPriceEgp: 57,
      totalEquityUnits: 210_526,
      founderEquityPct: 10,
      monthlyRevenueEgp: 2_400_000,
      monthlyBurnEgp: 1_600_000,
      lawFirmClientAccountBalanceEgp: 4_200_000,
      grossMarginPct: 34,
      revenueGrowthPct: 38,
      employeeCount: 42,
      nosiCompliantPct: 100,
      graduationReadiness: 94,
      status: "active",
      founderId: ahmed.id,
      lawFirmId: nileLegal.id,
      accountingFirmId: deltaAudit.id,
    },
  });

  const nileBrew = await db.enterprise.create({
    data: {
      slug: "nile-brew-cafe",
      name: "Nile Brew Café",
      tagline: "Specialty coffee chain — graduated to sovereign operation",
      description:
        "A Tier D established café chain that expanded across Cairo and Alexandria. Now in Stage 3 Institutional Independence with a readiness score of 96 — preparing for the graduation vote.",
      sector: "retail",
      tier: "D",
      stage: "stage_3",
      stageSince: new Date("2025-03-01"),
      legalForm: "LLC",
      healthRating: "AA",
      healthScore: 93,
      fundraisingGoalEgp: 18_000_000,
      raisedEgp: 18_000_000,
      minInvestmentEgp: 50_000,
      equityUnitPriceEgp: 312,
      totalEquityUnits: 57_692,
      founderEquityPct: 51,
      monthlyRevenueEgp: 6_800_000,
      monthlyBurnEgp: 4_900_000,
      lawFirmClientAccountBalanceEgp: 12_400_000,
      grossMarginPct: 38,
      revenueGrowthPct: 24,
      employeeCount: 88,
      nosiCompliantPct: 100,
      graduationReadiness: 96,
      status: "graduation_pending",
      founderId: khalil.id,
      lawFirmId: cairoTrust.id,
      accountingFirmId: nileAudit.id,
    },
  });

  const smartFarm = await db.enterprise.create({
    data: {
      slug: "smartfarm-egypt",
      name: "SmartFarm Egypt",
      tagline: "AI-irrigated agriculture — from Tier C to a sovereign EGX listing",
      description:
        "An agritech enterprise combining weather-indexed milestones with AI irrigation algorithms. Graduated to sovereign independence, then converted to a Tier F Joint Stock Company preparing for EGX listing.",
      sector: "agriculture",
      tier: "F",
      stage: "graduated",
      stageSince: new Date("2025-01-01"),
      legalForm: "JSC",
      healthRating: "AAA",
      healthScore: 96,
      fundraisingGoalEgp: 250_000_000,
      raisedEgp: 250_000_000,
      minInvestmentEgp: 100,
      equityUnitPriceEgp: 1180,
      totalEquityUnits: 211_864,
      founderEquityPct: 0,
      monthlyRevenueEgp: 38_000_000,
      monthlyBurnEgp: 24_000_000,
      lawFirmClientAccountBalanceEgp: 0,
      grossMarginPct: 41,
      revenueGrowthPct: 46,
      employeeCount: 154,
      nosiCompliantPct: 100,
      graduationReadiness: 100,
      status: "graduated",
      founderId: mohamed.id,
      lawFirmId: cairoTrust.id,
      accountingFirmId: nileAudit.id,
    },
  });

  // ── Memberships (roles) ──
  await db.enterpriseMember.createMany({
    data: [
      { enterpriseId: streetBites.id, userId: layla.id, role: "founding_operator", boardSeat: true },
      { enterpriseId: ecoPack.id, userId: ahmed.id, role: "founding_operator", boardSeat: true },
      { enterpriseId: ecoPack.id, userId: ahmed.id, role: "manager", boardSeat: false },
      { enterpriseId: ecoPack.id, userId: sarah.id, role: "capital_partner", boardSeat: false },
      { enterpriseId: ecoPack.id, userId: layla.id, role: "capital_partner", boardSeat: false },
      { enterpriseId: ecoPack.id, userId: khalil.id, role: "board_member", boardSeat: true },
      { enterpriseId: ecoPack.id, userId: mohamed.id, role: "workforce_partner", boardSeat: false },
      { enterpriseId: nileBrew.id, userId: khalil.id, role: "founding_operator", boardSeat: true },
      { enterpriseId: nileBrew.id, userId: khalil.id, role: "manager", boardSeat: false },
      { enterpriseId: nileBrew.id, userId: sarah.id, role: "capital_partner", boardSeat: false },
      { enterpriseId: nileBrew.id, userId: layla.id, role: "capital_partner", boardSeat: false },
      { enterpriseId: nileBrew.id, userId: ahmed.id, role: "board_member", boardSeat: true },
      { enterpriseId: smartFarm.id, userId: mohamed.id, role: "founding_operator", boardSeat: true },
      { enterpriseId: smartFarm.id, userId: sarah.id, role: "capital_partner", boardSeat: false },
      { enterpriseId: smartFarm.id, userId: layla.id, role: "capital_partner", boardSeat: false },
    ],
  });

  // ── Shareholdings ──
  await db.ownershipRecord.createMany({
    data: [
      { enterpriseId: streetBites.id, userId: layla.id, equityUnits: 10, avgPriceEgp: 50 },
      { enterpriseId: streetBites.id, userId: sarah.id, equityUnits: 2000, avgPriceEgp: 50 },
      { enterpriseId: streetBites.id, userId: khalil.id, equityUnits: 1500, avgPriceEgp: 50 },
      { enterpriseId: ecoPack.id, userId: ahmed.id, equityUnits: 21053, avgPriceEgp: 57 },
      { enterpriseId: ecoPack.id, userId: sarah.id, equityUnits: 12000, avgPriceEgp: 57 },
      { enterpriseId: ecoPack.id, userId: layla.id, equityUnits: 4200, avgPriceEgp: 57 },
      { enterpriseId: ecoPack.id, userId: khalil.id, equityUnits: 8500, avgPriceEgp: 57 },
      { enterpriseId: ecoPack.id, userId: mohamed.id, equityUnits: 0, avgPriceEgp: 57 },
      { enterpriseId: nileBrew.id, userId: khalil.id, equityUnits: 28846, avgPriceEgp: 312 },
      { enterpriseId: nileBrew.id, userId: sarah.id, equityUnits: 1731, avgPriceEgp: 312 },
      { enterpriseId: nileBrew.id, userId: layla.id, equityUnits: 577, avgPriceEgp: 312 },
      { enterpriseId: nileBrew.id, userId: ahmed.id, equityUnits: 0, avgPriceEgp: 312 },
      { enterpriseId: smartFarm.id, userId: mohamed.id, equityUnits: 105932, avgPriceEgp: 1180 },
      { enterpriseId: smartFarm.id, userId: sarah.id, equityUnits: 21186, avgPriceEgp: 1180 },
      { enterpriseId: smartFarm.id, userId: layla.id, equityUnits: 4237, avgPriceEgp: 1180 },
    ],
  });

  // ── Employees ──
  await db.employee.createMany({
    data: [
      { enterpriseId: ecoPack.id, userId: mohamed.id, position: "Operations Lead", department: "Production", compensationBand: "18,000-24,000 EGP", monthlySalaryEgp: 22000, nosiStatus: "registered", nosiRegisteredAt: new Date("2025-12-01"), equityConversionPct: 5 },
      { enterpriseId: nileBrew.id, userId: ahmed.id, position: "Board Observer", department: "Governance", compensationBand: "n/a", monthlySalaryEgp: 0, nosiStatus: "registered", nosiRegisteredAt: new Date("2025-11-15") },
    ],
  });

  // ── Milestones ──
  await db.milestone.createMany({
    data: [
      { enterpriseId: streetBites.id, title: "Kiosk 3 launch — Nasr City", description: "Open third kiosk with equipment and initial inventory", amountEgp: 120_000, status: "released", eveConfidence: 0.92, evidenceNote: "Geotagged photos + invoices verified", releasedAt: new Date("2026-02-10") },
      { enterpriseId: streetBites.id, title: "Q1 marketing campaign", description: "Social media + local flyer distribution", amountEgp: 45_000, status: "evidence_submitted", eveConfidence: 0.78, evidenceNote: "Awaiting board review", dueAt: new Date(Date.now() + 7 * 86400000) },
      { enterpriseId: ecoPack.id, title: "Production line 2 commissioning", description: "Install and commission second compostable packaging line", amountEgp: 1_800_000, status: "approved", eveConfidence: 0.88, dueAt: new Date(Date.now() + 14 * 86400000) },
      { enterpriseId: ecoPack.id, title: "R&D — seaweed resin pilot", description: "3-month pilot for seaweed-based resin alternative", amountEgp: 650_000, status: "pending", dueAt: new Date(Date.now() + 30 * 86400000) },
    ],
  });

  // ── Expenses ──
  await db.expense.createMany({
    data: [
      { enterpriseId: streetBites.id, category: "supplies", description: "Weekly produce — tomatoes, onions, bread", vendor: "Cairo Fresh Wholesale", amountEgp: 8400, status: "approved", submittedById: layla.id, approver1Id: layla.id, receiptNote: "Receipt #4471", createdAt: new Date(Date.now() - 2 * 86400000) },
      { enterpriseId: streetBites.id, category: "marketing", description: "Instagram ads — month of June", vendor: "Digital Ads Co.", amountEgp: 25000, status: "pending", submittedById: layla.id, aiRiskFlag: "none", createdAt: new Date(Date.now() - 1 * 86400000) },
      { enterpriseId: ecoPack.id, category: "payroll", description: "May payroll — 42 workforce partners", vendor: "Internal", amountEgp: 980000, status: "approved", submittedById: ahmed.id, approver1Id: ahmed.id, approver2Id: khalil.id, receiptNote: "EVE-verified payroll file", createdAt: new Date(Date.now() - 5 * 86400000) },
      { enterpriseId: ecoPack.id, category: "logistics", description: "Shipping — Alexandria retailer distribution", vendor: "Fresh Roast Trading", amountEgp: 150000, status: "flagged", submittedById: ahmed.id, aiRiskFlag: "related_party", receiptNote: "UBO overlap detected — board review required", createdAt: new Date(Date.now() - 1 * 86400000) },
      { enterpriseId: nileBrew.id, category: "rent", description: "Alexandria branch — June rent", vendor: "Alex Commercial Properties", amountEgp: 85000, status: "approved", submittedById: khalil.id, approver1Id: khalil.id, approver2Id: ahmed.id, createdAt: new Date(Date.now() - 3 * 86400000) },
    ],
  });

  // ── Proposals (governance) ──
  await db.proposal.createMany({
    data: [
      {
        enterpriseId: ecoPack.id,
        title: "Approve Q3 Marketing Budget — increase to 350,000 EGP",
        description: "Increase marketing from 200k to 350k EGP. Expected ROI: 3x. Funds allocated to retail partnerships, trade show presence, and a sustainability PR campaign. CRE-validated against budget cap (10% of capital = 1.2M EGP).",
        type: "budget",
        status: "voting_open",
        votingEndsAt: new Date(Date.now() + 4 * 3600000),
        quorumPct: 51,
        passThreshold: 50,
        votesFor: 125000,
        votesAgainst: 45000,
        votesAbstain: 5000,
        totalVotingPower: 210526,
        aiRiskScore: 23,
        aiRecommendation: "approve",
        aiConfidence: 0.88,
        createdById: ahmed.id,
      },
      {
        enterpriseId: nileBrew.id,
        title: "Graduation to Sovereign Independence",
        description: "Nile Brew Café has reached Stage 3 Institutional Independence with a readiness score of 96/100. This proposal calls the 75% supermajority graduation vote. On passage: AURIENTA board seat resigns, all fees cease, full ledger exports, and the enterprise may self-host CRE in 4–8 hours.",
        type: "graduation",
        status: "voting_open",
        votingEndsAt: new Date(Date.now() + 12 * 86400000),
        quorumPct: 51,
        passThreshold: 75,
        votesFor: 41000,
        votesAgainst: 3200,
        votesAbstain: 800,
        totalVotingPower: 57692,
        aiRiskScore: 8,
        aiRecommendation: "approve",
        aiConfidence: 0.95,
        createdById: khalil.id,
      },
      {
        enterpriseId: ecoPack.id,
        title: "Consulting Opt-Out — discontinue 2.5% consulting fee",
        description: "EcoPack has achieved 5 consecutive profitable quarters. Per the constitutional opt-out rule, this shareholder vote (simple majority) would discontinue the 2.5% consulting fee from the next fiscal year. No refund for the prior period.",
        type: "consulting_optout",
        status: "voting_open",
        votingEndsAt: new Date(Date.now() + 6 * 86400000),
        quorumPct: 51,
        passThreshold: 50,
        votesFor: 98000,
        votesAgainst: 22000,
        votesAbstain: 3000,
        totalVotingPower: 210526,
        aiRiskScore: 31,
        aiRecommendation: "approve",
        aiConfidence: 0.82,
        createdById: sarah.id,
      },
      {
        enterpriseId: streetBites.id,
        title: "Appoint Independent Manager — Post-12-month founder ban",
        description: "Per Tier A rules, the founder is banned from the manager seat for 12 months. The board nominates Mariam Hassan (police clearance verified, AI Expertise Score 84) as independent manager.",
        type: "manager_appointment",
        status: "voting_open",
        votingEndsAt: new Date(Date.now() + 2 * 86400000),
        quorumPct: 51,
        passThreshold: 50,
        votesFor: 4200,
        votesAgainst: 600,
        votesAbstain: 200,
        totalVotingPower: 10000,
        aiRiskScore: 15,
        aiRecommendation: "approve",
        aiConfidence: 0.91,
        createdById: layla.id,
      },
    ],
  });

  // ── Votes ──
  const ecoPackBudgetProposal = await db.proposal.findFirst({ where: { enterpriseId: ecoPack.id, type: "budget" } });
  if (ecoPackBudgetProposal) {
    await db.vote.createMany({
      data: [
        { proposalId: ecoPackBudgetProposal.id, userId: layla.id, choice: "for", votingPower: 4200, reason: "ROI projection is sound and within budget cap." },
        { proposalId: ecoPackBudgetProposal.id, userId: sarah.id, choice: "for", votingPower: 12000 },
        { proposalId: ecoPackBudgetProposal.id, userId: khalil.id, choice: "against", votingPower: 8500, reason: "Prefer reallocating to R&D." },
      ],
    });
  }

  // ── Trade orders ──
  await db.tradeOrder.createMany({
    data: [
      { enterpriseId: ecoPack.id, userId: sarah.id, side: "sell", equityUnits: 1000, priceEgp: 57.12, phase: "phase_1", status: "open" },
      { enterpriseId: ecoPack.id, userId: khalil.id, side: "buy", equityUnits: 250, priceEgp: 57.12, phase: "phase_1", status: "partially_filled", filledEquityUnits: 120, feesEgp: 0.5 },
      { enterpriseId: nileBrew.id, userId: layla.id, side: "sell", equityUnits: 100, priceEgp: 312, phase: "phase_3", status: "open" },
    ],
  });

  // ── Valuations ──
  await db.valuation.createMany({
    data: [
      { enterpriseId: streetBites.id, preMoneyEgp: 500_000, equityUnitPriceEgp: 50, cppEgp: 5000, growthMultiplier: 1.2, founderPremium: 0.04, aiConfidence: 0.86 },
      { enterpriseId: ecoPack.id, preMoneyEgp: 12_000_000, equityUnitPriceEgp: 57, cppEgp: 120000, growthMultiplier: 1.45, founderPremium: 0.08, aiConfidence: 0.91 },
      { enterpriseId: nileBrew.id, preMoneyEgp: 18_000_000, equityUnitPriceEgp: 312, cppEgp: 180000, growthMultiplier: 1.3, founderPremium: 0.06, aiConfidence: 0.93 },
      { enterpriseId: smartFarm.id, preMoneyEgp: 250_000_000, equityUnitPriceEgp: 1180, cppEgp: 2500000, growthMultiplier: 1.7, founderPremium: 0.1, aiConfidence: 0.95 },
    ],
  });

  // ── Quarterly reports (for consulting opt-out + graduation prerequisites) ──
  await db.quarterlyReport.createMany({
    data: [
      { enterpriseId: ecoPack.id, quarter: "Q1", year: 2025, revenueEgp: 5_800_000, cogsEgp: 3_900_000, grossProfitEgp: 1_900_000, opexEgp: 1_200_000, netProfitEgp: 700_000, lawFirmClientAccountBalanceEgp: 3_800_000, monthlyBurnEgp: 1_500_000, runwayMonths: 2.5, grossMarginPct: 33, revenueGrowthPct: 22 },
      { enterpriseId: ecoPack.id, quarter: "Q2", year: 2025, revenueEgp: 6_400_000, cogsEgp: 4_200_000, grossProfitEgp: 2_200_000, opexEgp: 1_400_000, netProfitEgp: 800_000, lawFirmClientAccountBalanceEgp: 4_000_000, monthlyBurnEgp: 1_550_000, runwayMonths: 2.6, grossMarginPct: 34, revenueGrowthPct: 28 },
      { enterpriseId: ecoPack.id, quarter: "Q3", year: 2025, revenueEgp: 7_100_000, cogsEgp: 4_700_000, grossProfitEgp: 2_400_000, opexEgp: 1_500_000, netProfitEgp: 900_000, lawFirmClientAccountBalanceEgp: 4_100_000, monthlyBurnEgp: 1_580_000, runwayMonths: 2.6, grossMarginPct: 34, revenueGrowthPct: 35 },
      { enterpriseId: ecoPack.id, quarter: "Q4", year: 2025, revenueEgp: 7_200_000, cogsEgp: 4_750_000, grossProfitEgp: 2_450_000, opexEgp: 1_550_000, netProfitEgp: 900_000, lawFirmClientAccountBalanceEgp: 4_200_000, monthlyBurnEgp: 1_600_000, runwayMonths: 2.6, grossMarginPct: 34, revenueGrowthPct: 38 },
    ],
  });

  // ── Ledger events (hash chain) — with proper per-enterprise sequencing ──
  const entEvents: Record<string, { eventType: string; payload: Record<string, unknown>; actorId: string }[]> = {
    [streetBites.id]: [
      { eventType: "share_issued", payload: { userId: layla.id, shares: 10, price: 50 }, actorId: layla.id },
      { eventType: "funds_received", payload: { amount: 500, reference: "AURI-2026-sb-layla-1" }, actorId: layla.id },
      { eventType: "milestone_released", payload: { title: "Kiosk 3 launch", amount: 120000 }, actorId: layla.id },
    ],
    [ecoPack.id]: [
      { eventType: "share_issued", payload: { userId: sarah.id, shares: 12000, price: 57 }, actorId: sarah.id },
      { eventType: "expense_approved", payload: { category: "payroll", amount: 980000, dualSignature: true }, actorId: ahmed.id },
    ],
    [nileBrew.id]: [
      { eventType: "cre_decision", payload: { action: "validate_expense", allowed: true, policy: "dual_signature.rego" }, actorId: khalil.id },
    ],
    [smartFarm.id]: [
      { eventType: "graduation", payload: { readiness: 100, votePct: 0.87, exportHash: "sha3:9f2a…b1c2" }, actorId: mohamed.id },
    ],
  };

  for (const [entId, evs] of Object.entries(entEvents)) {
    let prevHash: string | null = null;
    let sequence = 0;
    for (const ev of evs) {
      sequence += 1;
      const payloadStr = JSON.stringify(ev.payload);
      const payloadHash = sha(payloadStr + ev.eventType + (prevHash ?? "") + sequence);
      const decisionToken = issueCreDecisionToken({
        policy: "ledger.append",
        payloadHash,
        allowed: true,
        actorId: ev.actorId,
      });
      await db.ledgerEvent.create({
        data: {
          enterpriseId: entId,
          eventType: ev.eventType,
          prevHash,
          payloadHash,
          payload: payloadStr,
          creDecisionToken: decisionToken,
          actorId: ev.actorId,
          sequence,
        },
      });
      prevHash = payloadHash;
    }
  }

  // ── Graduation record (SmartFarm alumni) ──
  await db.graduationRecord.create({
    data: {
      enterpriseId: smartFarm.id,
      enterpriseName: "SmartFarm Egypt",
      tierAtGraduation: "C",
      finalHealthScore: 96,
      finalMaturityScore: 98,
      readinessScore: 100,
      sovereignCert: true,
      testimonial: "AURIENTA gave us the constitutional backbone to scale from a Tier C agritech startup to a sovereign EGX-bound JSC. The CRE enforced discipline; graduation gave us independence.",
      website: "smartfarm.eg",
      exportHash: "sha3:9f2a…b1c2",
    },
  });

  // ── Dashboard tasks ──
  await db.dashboardTask.createMany({
    data: [
      { userId: layla.id, enterpriseId: ecoPack.id, title: "Vote on EcoPack Q3 Budget", description: "Proposal ends in 4h. AI risk: low (23/100). Recommendation: approve.", type: "vote", priority: "urgent", dueAt: new Date(Date.now() + 4 * 3600000), ctaLabel: "Vote now", ctaHref: "/dashboard/governance" },
      { userId: layla.id, enterpriseId: nileBrew.id, title: "Nile Brew Graduation Vote", description: "75% supermajority required. 12 days remaining. Your voting power: 577 shares.", type: "vote", priority: "high", dueAt: new Date(Date.now() + 12 * 86400000), ctaLabel: "Cast vote", ctaHref: "/dashboard/governance" },
      { userId: layla.id, enterpriseId: streetBites.id, title: "Review Q1 marketing milestone", description: "Evidence submitted. EVE confidence 0.78. Board review required.", type: "milestone", priority: "medium", dueAt: new Date(Date.now() + 7 * 86400000), ctaLabel: "Review", ctaHref: "/dashboard/manager" },
      { userId: layla.id, title: "Claim dividend from SmartFarm", description: "1,420 EGP dividend ready. Withholding tax 10% applied.", type: "dividend", priority: "medium", ctaLabel: "Claim", ctaHref: "/dashboard/portfolio" },
      { userId: layla.id, title: "Diversification alert", description: "AI insight: 60% of your portfolio is concentrated in agriculture. Consider tech or manufacturing.", type: "review", priority: "low", ctaHref: "/dashboard/portfolio" },
    ],
  });

  // ── Notifications ──
  await db.notification.createMany({
    data: [
      { userId: layla.id, enterpriseId: ecoPack.id, title: "New proposal open", body: "EcoPack Q3 Marketing Budget — vote ends in 4h.", category: "governance" },
      { userId: layla.id, enterpriseId: streetBites.id, title: "Milestone evidence submitted", body: "Q1 marketing campaign awaiting board review.", category: "milestone" },
      { userId: layla.id, enterpriseId: smartFarm.id, title: "Dividend distributed", body: "1,420 EGP dividend from SmartFarm Egypt is ready to claim.", category: "dividend" },
      { userId: layla.id, title: "Sovereign Trust Score +5", body: "Your governance participation this quarter raised your score to 78.", category: "system" },
      { userId: layla.id, enterpriseId: nileBrew.id, title: "Graduation vote live", body: "Nile Brew Café is calling the 75% supermajority graduation vote.", category: "governance" },
    ],
  });

  console.log("✅ Seed complete (hardened).");
  console.log("   Users: Layla, Ahmed, Sarah, Mohamed, Khalil (password: aurienta2026, scrypt-hashed)");
  console.log("   Enterprises: Street Bites (A), EcoPack (C), Nile Brew (D→grad), SmartFarm (F graduated)");
  console.log("   Constitutional core: 2 law firms, 2 accounting firms, 4 enterprises, real Ed25519 keys, hash-chained ledger");
  console.log("   Login as Layla: layla@streetbites.eg / aurienta2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
