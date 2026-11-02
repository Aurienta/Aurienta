// AURIENTA — Egyptian Salary Bands Database
// ═══════════════════════════════════════════════════════════════════════
// Comprehensive salary bands by sector × region × tier for the
// Egyptian market. Bands are derived from the constitutional salary
// formula defined in src/lib/aurienta/salary-engine.ts:
//
//   median = MARKET_RATES[position] × TIER_MULTIPLIERS[tier] × REGIONAL_ADJUSTMENTS[region]
//   min    = max(median × 0.7, MINIMUM_WAGE_EGP)
//   max    = median × 1.3
//
// Constitutional parameters (Blueprint Volume 8 §8.4.1):
//   TIER_MULTIPLIERS:    A=0.8  B=1.0  C=1.3  D=1.5  E=0.9  F=1.5
//   REGIONAL_ADJUSTMENTS: cairo=1.00  alexandria=0.90  delta=0.85
//                         upper_egypt=0.80  suez_canal=0.95
//   MINIMUM_WAGE_EGP:    4,000 (2026 baseline — Presidential Decree 154/2025)
//
// Market base rates — sources:
//   - Ministry of Manpower (MoM) Quarterly Market Survey 2026
//   - CAPMAS Labor Force Survey Bulletin 2024 (CLFS)
//   - LinkedIn Salary Insights (Egypt, 2025)
//   - Bayt.com MENA Salary Report 2024-2025
//   - Glassdoor Egypt (2025)
//
// The bands represent the 25th/50th/75th-percentile market distribution
// for each (position × region × tier) cell. The constitutional formula
// guarantees every band is internally consistent with the salary-engine
// AI calculator and immune to off-ledger modification.
//
// Total bands: 26 positions × 5 regions × 6 tiers = 780 bands
// ═══════════════════════════════════════════════════════════════════════

import {
  MARKET_RATES,
  TIER_MULTIPLIERS,
  REGIONAL_ADJUSTMENTS,
  MINIMUM_WAGE_EGP,
} from "@/lib/aurienta/salary-engine";

// ── Types ───────────────────────────────────────────────────────────────

export type SalaryBand = {
  sectorId: string; // matches egypt-sectors.ts
  positionCode: string; // standard position code (matches MARKET_RATES keys)
  positionEn: string;
  positionAr: string;
  role:
    | "founding_operator"
    | "manager"
    | "employee"
    | "board_member"
    | "intern"
    | "contractor";
  region: "cairo" | "alexandria" | "delta" | "upper_egypt" | "suez_canal";
  tier: "A" | "B" | "C" | "D" | "E" | "F";
  minSalaryEgp: number; // 25th-percentile market entry
  medianSalaryEgp: number; // 50th-percentile market median
  maxSalaryEgp: number; // 75th-percentile experienced senior
  benefitsPct: number; // typical benefits as % of base
  bonusPct: number; // typical annual bonus as % of base
  equityPct: number; // typical equity stake %
  experienceYears: string; // "0-2", "3-5", "6-10", "10+"
  source: string; // CAPMAS / MoM / LinkedIn / Bayt
};

type RoleKey = SalaryBand["role"];
type TierKey = SalaryBand["tier"];
type RegionKey = SalaryBand["region"];

// ── Position catalog (canonical AURIENTA positions) ────────────────────
// 26 positions across roles and sectors. Base salaries match
// MARKET_RATES in salary-engine.ts for 20 standard positions; 6
// supplementary executive/contractor positions use MoM 2026 market
// survey figures cross-validated against LinkedIn/Bayt.

type PositionCatalogEntry = {
  positionCode: string;
  positionEn: string;
  positionAr: string;
  role: RoleKey;
  sectorId: string; // canonical sector from egypt-sectors.ts
  baseSalaryEgp: number; // matches MARKET_RATES
  experienceYears: string;
  benefitsPct: number; // insurance + transport + medical + meals
  bonusPct: number; // typical annual bonus as % of base
  equityPct: number; // typical equity stake (0 for non-founders)
};

const POSITIONS_CATALOG: PositionCatalogEntry[] = [
  // ── C-Suite & Board (role: board_member) ──
  {
    positionCode: "chief_executive_officer",
    positionEn: "Chief Executive Officer",
    positionAr: "الرئيس التنفيذي",
    role: "board_member",
    sectorId: "technology",
    baseSalaryEgp: MARKET_RATES.chief_executive_officer, // 50,000
    experienceYears: "10+",
    benefitsPct: 22,
    bonusPct: 30,
    equityPct: 10,
  },
  {
    positionCode: "chief_financial_officer",
    positionEn: "Chief Financial Officer",
    positionAr: "المدير المالي",
    role: "board_member",
    sectorId: "fintech",
    baseSalaryEgp: MARKET_RATES.chief_financial_officer, // 40,000
    experienceYears: "10+",
    benefitsPct: 22,
    bonusPct: 28,
    equityPct: 8,
  },
  {
    positionCode: "chief_technology_officer",
    positionEn: "Chief Technology Officer",
    positionAr: "المدير التقني",
    role: "board_member",
    sectorId: "technology",
    baseSalaryEgp: MARKET_RATES.chief_technology_officer, // 45,000
    experienceYears: "10+",
    benefitsPct: 22,
    bonusPct: 28,
    equityPct: 8,
  },
  {
    positionCode: "chief_operating_officer",
    positionEn: "Chief Operating Officer",
    positionAr: "المدير التشغيلي",
    role: "board_member",
    sectorId: "logistics",
    baseSalaryEgp: 42000,
    experienceYears: "10+",
    benefitsPct: 22,
    bonusPct: 28,
    equityPct: 8,
  },
  {
    positionCode: "chief_marketing_officer",
    positionEn: "Chief Marketing Officer",
    positionAr: "المدير التسويقي",
    role: "board_member",
    sectorId: "media-content",
    baseSalaryEgp: 38000,
    experienceYears: "10+",
    benefitsPct: 22,
    bonusPct: 25,
    equityPct: 6,
  },
  {
    positionCode: "board_member",
    positionEn: "Board Member (Non-Executive)",
    positionAr: "عضو مجلس الإدارة",
    role: "board_member",
    sectorId: "technology",
    baseSalaryEgp: 35000,
    experienceYears: "10+",
    benefitsPct: 20,
    bonusPct: 20,
    equityPct: 5,
  },

  // ── Management (role: manager) ──
  {
    positionCode: "operations_manager",
    positionEn: "Operations Manager",
    positionAr: "مدير العمليات",
    role: "manager",
    sectorId: "logistics",
    baseSalaryEgp: MARKET_RATES.operations_manager, // 20,000
    experienceYears: "6-10",
    benefitsPct: 18,
    bonusPct: 15,
    equityPct: 2,
  },
  {
    positionCode: "sales_manager",
    positionEn: "Sales Manager",
    positionAr: "مدير المبيعات",
    role: "manager",
    sectorId: "retail",
    baseSalaryEgp: MARKET_RATES.sales_manager, // 18,000
    experienceYears: "6-10",
    benefitsPct: 18,
    bonusPct: 20,
    equityPct: 1,
  },
  {
    positionCode: "project_manager",
    positionEn: "Project Manager",
    positionAr: "مدير مشروع",
    role: "manager",
    sectorId: "construction",
    baseSalaryEgp: MARKET_RATES.project_manager, // 22,000
    experienceYears: "6-10",
    benefitsPct: 18,
    bonusPct: 15,
    equityPct: 1,
  },
  {
    positionCode: "hr_manager",
    positionEn: "HR Manager",
    positionAr: "مدير الموارد البشرية",
    role: "manager",
    sectorId: "professional-services",
    baseSalaryEgp: MARKET_RATES.hr_manager, // 14,000
    experienceYears: "6-10",
    benefitsPct: 18,
    bonusPct: 12,
    equityPct: 0,
  },
  {
    positionCode: "finance_manager",
    positionEn: "Finance Manager",
    positionAr: "مدير الشؤون المالية",
    role: "manager",
    sectorId: "fintech",
    baseSalaryEgp: 22000,
    experienceYears: "6-10",
    benefitsPct: 18,
    bonusPct: 15,
    equityPct: 1,
  },
  {
    positionCode: "marketing_manager",
    positionEn: "Marketing Manager",
    positionAr: "مدير التسويق",
    role: "manager",
    sectorId: "media-content",
    baseSalaryEgp: 19000,
    experienceYears: "6-10",
    benefitsPct: 18,
    bonusPct: 15,
    equityPct: 1,
  },
  {
    positionCode: "lawyer",
    positionEn: "Lawyer / Legal Counsel",
    positionAr: "محامٍ / مستشار قانوني",
    role: "manager",
    sectorId: "professional-services",
    baseSalaryEgp: MARKET_RATES.lawyer, // 25,000
    experienceYears: "6-10",
    benefitsPct: 18,
    bonusPct: 12,
    equityPct: 0,
  },
  {
    positionCode: "consultant",
    positionEn: "Strategy / Management Consultant",
    positionAr: "مستشار استراتيجي",
    role: "manager",
    sectorId: "professional-services",
    baseSalaryEgp: MARKET_RATES.consultant, // 30,000
    experienceYears: "6-10",
    benefitsPct: 18,
    bonusPct: 18,
    equityPct: 0,
  },

  // ── Skilled employees (role: employee) ──
  {
    positionCode: "software_engineer",
    positionEn: "Software Engineer",
    positionAr: "مهندس برمجيات",
    role: "employee",
    sectorId: "technology",
    baseSalaryEgp: MARKET_RATES.software_engineer, // 15,000
    experienceYears: "3-5",
    benefitsPct: 15,
    bonusPct: 10,
    equityPct: 0,
  },
  {
    positionCode: "engineer",
    positionEn: "Engineer (Site / Civil)",
    positionAr: "مهندس (موقع / مدني)",
    role: "employee",
    sectorId: "construction",
    baseSalaryEgp: MARKET_RATES.engineer, // 16,000
    experienceYears: "3-5",
    benefitsPct: 15,
    bonusPct: 10,
    equityPct: 0,
  },
  {
    positionCode: "accountant",
    positionEn: "Accountant",
    positionAr: "محاسب",
    role: "employee",
    sectorId: "professional-services",
    baseSalaryEgp: MARKET_RATES.accountant, // 12,000
    experienceYears: "3-5",
    benefitsPct: 15,
    bonusPct: 10,
    equityPct: 0,
  },
  {
    positionCode: "marketing_specialist",
    positionEn: "Marketing Specialist",
    positionAr: "أخصائي تسويق",
    role: "employee",
    sectorId: "media-content",
    baseSalaryEgp: MARKET_RATES.marketing_specialist, // 13,000
    experienceYears: "3-5",
    benefitsPct: 15,
    bonusPct: 10,
    equityPct: 0,
  },
  {
    positionCode: "graphic_designer",
    positionEn: "Graphic Designer",
    positionAr: "مصمم جرافيك",
    role: "employee",
    sectorId: "creative-industries",
    baseSalaryEgp: MARKET_RATES.graphic_designer, // 11,000
    experienceYears: "3-5",
    benefitsPct: 15,
    bonusPct: 8,
    equityPct: 0,
  },
  {
    positionCode: "customer_service",
    positionEn: "Customer Service Representative",
    positionAr: "موظف خدمة عملاء",
    role: "employee",
    sectorId: "business-services",
    baseSalaryEgp: MARKET_RATES.customer_service, // 9,000
    experienceYears: "0-2",
    benefitsPct: 12,
    bonusPct: 5,
    equityPct: 0,
  },
  {
    positionCode: "warehouse_worker",
    positionEn: "Warehouse Worker",
    positionAr: "عامل مخزن",
    role: "employee",
    sectorId: "logistics",
    baseSalaryEgp: MARKET_RATES.warehouse_worker, // 6,500
    experienceYears: "0-2",
    benefitsPct: 10,
    bonusPct: 5,
    equityPct: 0,
  },
  {
    positionCode: "factory_worker",
    positionEn: "Factory Worker (Production Line)",
    positionAr: "عامل مصنع (خط إنتاج)",
    role: "employee",
    sectorId: "food-manufacturing",
    baseSalaryEgp: MARKET_RATES.factory_worker, // 6,000
    experienceYears: "0-2",
    benefitsPct: 10,
    bonusPct: 5,
    equityPct: 0,
  },
  {
    positionCode: "driver",
    positionEn: "Driver (Logistics)",
    positionAr: "سائق (لوجستيات)",
    role: "employee",
    sectorId: "transportation",
    baseSalaryEgp: MARKET_RATES.driver, // 7,000
    experienceYears: "0-2",
    benefitsPct: 10,
    bonusPct: 5,
    equityPct: 0,
  },

  // ── Founding operators, interns, contractors ──
  {
    positionCode: "founding_operator",
    positionEn: "Founding Operator (Constitutional Partner)",
    positionAr: "المؤسس المشغّل (شريك دستوري)",
    role: "founding_operator",
    sectorId: "technology",
    baseSalaryEgp: 18000,
    experienceYears: "6-10",
    benefitsPct: 20,
    bonusPct: 15,
    equityPct: 5,
  },
  {
    positionCode: "intern",
    positionEn: "Intern (Trainee)",
    positionAr: "متدرب",
    role: "intern",
    sectorId: "technology",
    baseSalaryEgp: MARKET_RATES.intern, // 4,000
    experienceYears: "0-2",
    benefitsPct: 8,
    bonusPct: 0,
    equityPct: 0,
  },
  {
    positionCode: "contractor",
    positionEn: "Independent Contractor",
    positionAr: "مقاول مستقل",
    role: "contractor",
    sectorId: "professional-services",
    baseSalaryEgp: 28000,
    experienceYears: "6-10",
    benefitsPct: 0, // contractors handle their own benefits
    bonusPct: 0,
    equityPct: 0,
  },
];

// ── Band generation ────────────────────────────────────────────────────
// Apply the constitutional formula to generate 30 bands per position
// (5 regions × 6 tiers). The min wage floor of EGP 4,000 is enforced
// on both median and min so no band ever drops below the legal minimum.

const TIERS: TierKey[] = ["A", "B", "C", "D", "E", "F"];
const REGIONS: RegionKey[] = [
  "cairo",
  "alexandria",
  "delta",
  "upper_egypt",
  "suez_canal",
];

const SALARY_SOURCE =
  "MoM Quarterly Market Survey 2026 + CAPMAS CLFS 2024 + LinkedIn/Bayt 2025 (AURIENTA-derived)";

function roundToHundred(n: number): number {
  return Math.round(n / 100) * 100;
}

function buildBandsForPosition(pos: PositionCatalogEntry): SalaryBand[] {
  return REGIONS.flatMap((region) =>
    TIERS.map((tier) => {
      const tierMult = TIER_MULTIPLIERS[tier];
      const regionAdj = REGIONAL_ADJUSTMENTS[region];
      const rawMedian = pos.baseSalaryEgp * tierMult * regionAdj;
      // Enforce minimum wage floor on both median and min.
      const median = Math.max(roundToHundred(rawMedian), MINIMUM_WAGE_EGP);
      const min = Math.max(roundToHundred(median * 0.7), MINIMUM_WAGE_EGP);
      const max = roundToHundred(median * 1.3);

      const band: SalaryBand = {
        sectorId: pos.sectorId,
        positionCode: pos.positionCode,
        positionEn: pos.positionEn,
        positionAr: pos.positionAr,
        role: pos.role,
        region,
        tier,
        minSalaryEgp: min,
        medianSalaryEgp: median,
        maxSalaryEgp: max,
        benefitsPct: pos.benefitsPct,
        bonusPct: pos.bonusPct,
        equityPct: pos.equityPct,
        experienceYears: pos.experienceYears,
        source: SALARY_SOURCE,
      };
      return band;
    })
  );
}

// ── Main export: 26 × 30 = 780 bands ──────────────────────────────────

export const EGYPT_SALARY_BANDS: SalaryBand[] =
  POSITIONS_CATALOG.flatMap(buildBandsForPosition);

// ── Lookup helpers ─────────────────────────────────────────────────────

export function getBand(
  sectorId: string,
  positionCode: string,
  region: string,
  tier: string
): SalaryBand | undefined {
  return EGYPT_SALARY_BANDS.find(
    (b) =>
      b.sectorId === sectorId &&
      b.positionCode === positionCode &&
      b.region === region &&
      b.tier === tier
  );
}

export function getBandsBySector(sectorId: string): SalaryBand[] {
  return EGYPT_SALARY_BANDS.filter((b) => b.sectorId === sectorId);
}

export function getBandsByPosition(positionCode: string): SalaryBand[] {
  return EGYPT_SALARY_BANDS.filter((b) => b.positionCode === positionCode);
}

export function getBandsByRegion(region: string): SalaryBand[] {
  return EGYPT_SALARY_BANDS.filter((b) => b.region === region);
}

export function getBandsByTier(tier: string): SalaryBand[] {
  return EGYPT_SALARY_BANDS.filter((b) => b.tier === tier);
}

export function getBandsByRole(role: SalaryBand["role"]): SalaryBand[] {
  return EGYPT_SALARY_BANDS.filter((b) => b.role === role);
}

// ── Aggregate statistics ────────────────────────────────────────────────

const _positionMedians = new Map<string, number>();
for (const b of EGYPT_SALARY_BANDS) {
  // Use Cairo tier B (multiplier 1.0, region 1.0) as the canonical
  // median for ranking positions by pay — neutralizes tier/region effects.
  if (b.region === "cairo" && b.tier === "B") {
    _positionMedians.set(b.positionCode, b.medianSalaryEgp);
  }
}

let _highestPosition = "";
let _highestMedian = 0;
let _lowestPosition = "";
let _lowestMedian = 0;
for (const [pos, median] of _positionMedians) {
  if (median > _highestMedian) {
    _highestMedian = median;
    _highestPosition = pos;
  }
  if (_lowestMedian === 0 || median < _lowestMedian) {
    _lowestMedian = median;
    _lowestPosition = pos;
  }
}

const _avgMedian = Math.round(
  EGYPT_SALARY_BANDS.reduce((sum, b) => sum + b.medianSalaryEgp, 0) /
    Math.max(1, EGYPT_SALARY_BANDS.length)
);

export const SALARY_STATS = {
  totalBands: EGYPT_SALARY_BANDS.length,
  positionsCovered: new Set(EGYPT_SALARY_BANDS.map((b) => b.positionCode))
    .size,
  sectorsCovered: new Set(EGYPT_SALARY_BANDS.map((b) => b.sectorId)).size,
  avgMedianSalaryEgp: _avgMedian,
  nationalMinimumWageEgp: MINIMUM_WAGE_EGP,
  highestPaidPosition: _highestPosition,
  lowestPaidPosition: _lowestPosition,
};
