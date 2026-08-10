// AURIENTA Industry Modules — Blueprint Volume 20
// ═══════════════════════════════════════════════════════════════
// Four specialised industry modules that provide sector-specific
// data sources, benchmarks, vital signs, and AI model adjustments.
//
// An enterprise may activate any module at formation (or later by
// board vote, simple majority). Once activated, the CRE automatically
// adjusts dashboards, valuation inputs, and compliance monitoring.

export type IndustryModule = {
  id: string;
  name: string;
  blueprintRef: string;
  description: string;
  sectors: string[];
  vitalSigns: { key: string; label: string; unit: string; healthy: number; alert: number; inverted?: boolean }[];
  benchmarks: { label: string; value: string; source: string }[];
  complianceRequirements: string[];
  valuationInputs: { label: string; description: string }[];
  dataSources: { name: string; description: string; frequency: string }[];
  activated: boolean;
};

export const INDUSTRY_MODULES: IndustryModule[] = [
  // ── Module 1: Agriculture & Agri-Tech (§20.1) ──
  {
    id: "agriculture",
    name: "Agriculture & Agri-Tech",
    blueprintRef: "§20.1",
    description:
      "For enterprises in crop production, livestock, aquaculture, agro-processing, or agricultural technology. Connects to weather APIs, commodity price feeds, and the GAFI agricultural subsidy database.",
    sectors: ["agriculture"],
    vitalSigns: [
      { key: "cropYield", label: "Crop Yield", unit: "ton/acre", healthy: 15, alert: 8 },
      { key: "waterEfficiency", label: "Water Usage Efficiency", unit: "kg/m³", healthy: 12, alert: 5 },
      { key: "inputCostRatio", label: "Input Cost Ratio", unit: "%", healthy: 40, alert: 60, inverted: true },
      { key: "subsidyCompliance", label: "Subsidy Compliance", unit: "%", healthy: 100, alert: 80 },
    ],
    benchmarks: [
      { label: "Avg wheat yield (Egypt)", value: "18.1 ton/acre", source: "CAPMAS/MALR" },
      { label: "Water cost", value: "2.5 EGP/m³", source: "MWRI" },
      { label: "Fertilizer cost (urea)", value: "12,000 EGP/ton", source: "NRC" },
    ],
    complianceRequirements: [
      "MALR registration (Ministry of Agriculture)",
      "Water usage permit (MWRI)",
      "Pesticide compliance (APC)",
      "Export phytosanitary certificate (for export enterprises)",
    ],
    valuationInputs: [
      { label: "Crop Yield Forecast", description: "AI Growth Potential multiplier incorporates crop yield forecasts and irrigation efficiency" },
      { label: "Commodity Price Feed", description: "Sector P/E adjusted for commodity price cycles" },
      { label: "Weather Risk Factor", description: "Drought/flood risk reduces valuation by up to 15%" },
    ],
    dataSources: [
      { name: "Egyptian Meteorological Authority", description: "Weather forecasts and historical data", frequency: "Daily" },
      { name: "CAPMAS Agricultural Statistics", description: "Crop yields, input costs, land prices", frequency: "Quarterly" },
      { name: "GAFI Agricultural Subsidies", description: "Subsidy eligibility and amounts", frequency: "Annual" },
      { name: "MALR Land Registry", description: "Land ownership and usage rights", frequency: "On-change" },
    ],
    activated: true,
  },

  // ── Module 2: Tourism & Hospitality (§20.2) ──
  {
    id: "tourism",
    name: "Tourism & Hospitality",
    blueprintRef: "§20.2",
    description:
      "For enterprises in hotels, restaurants, tour operators, travel tech, and entertainment. Connects to tourism statistics, occupancy benchmarks, and visa/permit databases.",
    sectors: ["tourism"],
    vitalSigns: [
      { key: "occupancyRate", label: "Occupancy Rate", unit: "%", healthy: 70, alert: 40 },
      { key: "revpar", label: "RevPAR", unit: "EGP", healthy: 800, alert: 400 },
      { key: "customerSatisfaction", label: "Customer Satisfaction", unit: "/10", healthy: 8, alert: 6 },
      { key: "staffTurnover", label: "Staff Turnover", unit: "%", healthy: 20, alert: 40, inverted: true },
    ],
    benchmarks: [
      { label: "Avg hotel occupancy (Cairo)", value: "65%", source: "ETA" },
      { label: "Avg RevPAR (5-star)", value: "950 EGP", source: "STR Global" },
      { label: "Tourist arrivals (Egypt)", value: "15M/year", source: "MOT" },
    ],
    complianceRequirements: [
      "ETA registration (Egyptian Tourism Authority)",
      "Ministry of Tourism license",
      "Health & safety inspection certificate",
      "Fire safety compliance",
    ],
    valuationInputs: [
      { label: "Seasonal Revenue Pattern", description: "AI valuation adjusts for tourism seasonality (peak: Oct-Apr)" },
      { label: "Occupancy Forecast", description: "Growth Potential multiplier incorporates booking trends" },
      { label: "Security Risk Factor", description: "Regional security advisories reduce valuation by up to 20%" },
    ],
    dataSources: [
      { name: "Egyptian Tourism Authority", description: "Tourist arrivals, occupancy rates", frequency: "Monthly" },
      { name: "STR Global", description: "Hotel performance benchmarks", frequency: "Monthly" },
      { name: "Ministry of Tourism", description: "Sector statistics and policies", frequency: "Quarterly" },
      { name: "CBE Tourism Index", description: "Tourism revenue index", frequency: "Monthly" },
    ],
    activated: true,
  },

  // ── Module 3: Technology & SaaS (§20.3) ──
  {
    id: "technology",
    name: "Technology & SaaS",
    blueprintRef: "§20.3",
    description:
      "For enterprises in software, SaaS, AI/ML, fintech, and digital platforms. Tracks MRR, churn, burn rate, and developer productivity metrics.",
    sectors: ["technology"],
    vitalSigns: [
      { key: "mrr", label: "Monthly Recurring Revenue", unit: "EGP", healthy: 100000, alert: 30000 },
      { key: "churnRate", label: "Churn Rate", unit: "%", healthy: 3, alert: 8, inverted: true },
      { key: "burnRate", label: "Monthly Burn Rate", unit: "EGP", healthy: 200000, alert: 500000, inverted: true },
      { key: "runway", label: "Runway", unit: "months", healthy: 18, alert: 6 },
    ],
    benchmarks: [
      { label: "Avg SaaS churn (Egypt)", value: "5.2%", source: "ITIDA" },
      { label: "Avg developer salary", value: "25,000 EGP/mo", source: "Wuzzuf" },
      { label: "Cloud cost (AWS ae1)", value: "15,000 EGP/mo", source: "AWS" },
    ],
    complianceRequirements: [
      "ITIDA registration (Information Technology Industry Development Agency)",
      "PDPL compliance (Law 151/2020)",
      "Data protection impact assessment",
      "Cybersecurity framework (NIST CSF or ISO 27001)",
    ],
    valuationInputs: [
      { label: "MRR Growth Rate", description: "Growth Potential multiplier = (MRR_growth / sector_avg) × 1.2" },
      { label: "Churn-Adjusted Valuation", description: "Valuation reduced by (churn - 3%) × 10x" },
      { label: "Developer Team Score", description: "Team experience and retention factor" },
    ],
    dataSources: [
      { name: "ITIDA", description: "Tech sector statistics and incentives", frequency: "Quarterly" },
      { name: "Wuzzuf Index", description: "Tech salary benchmarks", frequency: "Monthly" },
      { name: "GitHub API", description: "Repository activity and developer productivity", frequency: "Daily" },
      { name: "Cloud Cost API", description: "AWS/Azure/GCP billing", frequency: "Daily" },
    ],
    activated: true,
  },

  // ── Module 4: Healthcare (§20.4) ──
  {
    id: "healthcare",
    name: "Healthcare",
    blueprintRef: "§20.4",
    description:
      "For enterprises in clinics, hospitals, pharma, medical devices, and health-tech. Tracks patient outcomes, compliance, and medical quality metrics.",
    sectors: ["healthcare"],
    vitalSigns: [
      { key: "patientSatisfaction", label: "Patient Satisfaction", unit: "/10", healthy: 8.5, alert: 6 },
      { key: "bedOccupancy", label: "Bed Occupancy Rate", unit: "%", healthy: 75, alert: 50 },
      { key: "infectionRate", label: "Hospital-Acquired Infection Rate", unit: "%", healthy: 2, alert: 5, inverted: true },
      { key: "staffCertification", label: "Staff Certification Rate", unit: "%", healthy: 100, alert: 90 },
    ],
    benchmarks: [
      { label: "Avg patient satisfaction (Egypt)", value: "7.2/10", source: "MoH" },
      { label: "Avg bed occupancy (private)", value: "68%", source: "CAPMAS" },
      { label: "Healthcare spending per capita", value: "6,500 EGP/year", source: "WHO" },
    ],
    complianceRequirements: [
      "Ministry of Health license",
      "Egyptian Drug Authority registration (for pharma/devices)",
      "Medical malpractice insurance",
      "Infection control certification",
      "Patient data protection (PDPL + MoH guidelines)",
    ],
    valuationInputs: [
      { label: "Patient Outcome Score", description: "Clinical quality metrics affect valuation by ±10%" },
      { label: "Regulatory Compliance Factor", description: "Non-compliance reduces valuation by up to 25%" },
      { label: "Healthcare Demand Forecast", description: "Population health trends and demographic shifts" },
    ],
    dataSources: [
      { name: "Ministry of Health", description: "Healthcare statistics and regulations", frequency: "Monthly" },
      { name: "Egyptian Drug Authority", description: "Drug and device registrations", frequency: "On-change" },
      { name: "CAPMAS Health Statistics", description: "Population health data", frequency: "Quarterly" },
      { name: "WHO Egypt Office", description: "International health benchmarks", frequency: "Annual" },
    ],
    activated: true,
  },
];

/** Get a module by ID */
export function getIndustryModule(id: string): IndustryModule | undefined {
  return INDUSTRY_MODULES.find((m) => m.id === id);
}

/** Get the module for a given sector */
export function getModuleForSector(sector: string): IndustryModule | undefined {
  return INDUSTRY_MODULES.find((m) => m.sectors.includes(sector));
}

/** Get all activated modules */
export function getActivatedModules(): IndustryModule[] {
  return INDUSTRY_MODULES.filter((m) => m.activated);
}
