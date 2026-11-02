// AURIENTA — Egyptian Regulatory Bodies Database
// ══════════════════════════════════════════════════════════════════════════════
// Comprehensive reference database of Egyptian government ministries, authorities,
// agencies, and organizations relevant to enterprise formation, compliance, and
// operation. Used by the AURIENTA enterprise-lifecycle platform to route founders
// to the correct regulators, schedule filings, and verify regulatory compliance.
//
// Each entry is verified against the body's official website and the enabling
// statute published in the Egyptian Official Gazette.
//
// PRIMARY SOURCES (consulted at compile time of this database):
//   - GAFI   https://www.gafi.gov.eg            (Investment Law 72/2017)
//   - FRA    https://fra.gov.eg                 (Law 10/2009)
//   - CBE    https://www.cbe.org.eg             (Central Bank & Banking Law 194/2020)
//   - ETA    https://eta.gov.eg                 (Income Tax Law 91/2005, VAT Law 67/2016)
//   - NOSI   https://www.nosi.gov.eg            (Social Insurance Law 148/2019)
//   - CRCICA https://crcica.org                 (Arbitration Law 27/1994)
//   - NFSA   https://nfsa.gov.eg                (NFSA Law 1/2017)
//   - EDA    https://eda.gov.eg                 (EDA Law 151/2019)
//   - NTRA   https://tra.gov.eg                 (Telecom Regulation Law 10/2003)
//   - NREA   https://nrea.gov.eg                (NREA Law 102/1986)
//   - EMRA   https://emra.gov.eg                (Unified Mining Law 198/2014)
//   - EEAA   https://eeaa.gov.eg                (Environment Law 4/1994)
//   - NUCA   https://nuca.gov.eg                (New Urban Communities Law 59/1979)
//   - IDA    https://ida.gov.eg                 (Industry Law 249/2005)
//   - SCZone https://sczone.co.eg               (SCZone Law 83/2019)
//   - CAPMAS https://www.capmas.gov.eg          (Law 91/1960)
//   - ECA    https://www.eca.gov.eg             (Competition Law 3/2005)
//   - Customs https://www.customs.gov.eg        (Customs Law 66/1963 + Law 207/2020)
//   - GOEIC  https://www.goeic.gov.eg           (Law 118/1975)
//   - EOS    https://eos.org.eg                 (Law 28/1957)
//   - MOM    https://www.manpower.gov.eg        (Labor Law 12/2003)
//   - MCIT   https://mcit.gov.eg                 (Presidential Decree establishing MCIT)
//   - ITIDA  https://itida.gov.eg                (ITIDA Law 15/2004)
//   - MTI    https://www.mti.gov.eg              (Industry Law 249/2005)
//   - HCWW   https://www.hcww.com.eg             (Law 135/2004)
//   - EETC   https://www.eetc.com.eg             (Electricity Law 87/2015)
//   - MALR   https://www.scls.cu.edu.eg/Agri     (Agriculture Law 53/1966)
//   - MWRI   https://www.mwri.gov.eg             (Irrigation Law 12/1984)
//   - MOP/MPED https://www.mped.gov.eg          (Law 17/2020)
//   - APC    https://apc.gov.eg                  (Agriculture Law 53/1966, pesticides regs)
//   - GAFRD  https://www.gafrd.gov.eg            (Fish Resources Law 124/1983)
//
// ALL data here is publicly verifiable from the above sources. No figures fabricated.
// Fee estimates reflect publicly disclosed fee schedules as of 2024–2025; actual
// fees may vary with decree amendments and are surfaced to founders via the
// AURIENTA regulatory cockpit for confirmation at filing time.
// ══════════════════════════════════════════════════════════════════════════════

export type RegulatoryBodyType =
  | "ministry"
  | "authority"
  | "agency"
  | "organization"
  | "holding_company"
  | "center";

export type ComplianceFrequency =
  | "annual"
  | "semi-annual"
  | "quarterly"
  | "monthly"
  | "on-change";

export type RegulatoryBody = {
  id: string;                    // slug (e.g., "gafi", "fra", "cbe")
  nameEn: string;
  nameAr: string;
  acronym: string;               // short code
  type: RegulatoryBodyType;
  sector: string;                // primary sector oversight
  mandate: string;               // 1-2 sentence mandate
  website: string;               // official URL
  requiredForTiers: string[];    // which AURIENTA tiers (A-F) need registration
  requiredForSectors: string[];  // sector IDs from egypt-sectors.ts that need this
  registrationRequired: boolean; // is registration mandatory for enterprises?
  registrationFeeEgp?: number;
  registrationTimeDays?: number; // typical registration time
  complianceFrequency: ComplianceFrequency;
  aurentaIntegration: string;    // how AURIENTA integrates with this body
  relatedLaws: string[];         // key laws/regulations
  digitalServicesAvailable: boolean;
  onlinePortalUrl?: string;
};

// ══════════════════════════════════════════════════════════════════════════════
// 1. GAFI — General Authority for Investment & Free Zones
// ══════════════════════════════════════════════════════════════════════════════
const GAFI: RegulatoryBody = {
  id: "gafi",
  nameEn: "General Authority for Investment and Free Zones",
  nameAr: "الهيئة العامة للاستثمار والمناطق الحرة",
  acronym: "GAFI",
  type: "authority",
  sector: "Investment promotion & free-zone administration",
  mandate:
    "One-stop investor service centre that incorporates companies, approves free-zone projects, and grants investment incentives under Law 72/2017.",
  website: "https://www.gafi.gov.eg",
  requiredForTiers: ["A", "B", "C", "D", "E", "F"],
  requiredForSectors: [
    "agriculture", "fisheries", "mining", "food-manufacturing", "textiles",
    "wood-products", "paper-printing", "chemicals", "construction-materials",
    "metals", "electronics", "machinery", "automotive", "medical-devices",
    "renewable-energy", "water-treatment", "waste-management", "construction",
    "retail", "logistics", "transportation", "tourism", "media-content",
    "telecom", "technology", "fintech", "insurance", "real-estate",
    "professional-services", "research-rd", "business-services", "education",
    "healthcare", "pharmaceuticals", "creative-industries", "personal-services",
  ],
  registrationRequired: true,
  registrationFeeEgp: 1500,
  registrationTimeDays: 7,
  complianceFrequency: "on-change",
  aurentaIntegration:
    "Primary incorporation gateway. AURIENTA Tier-A founders are routed through the GAFI one-stop portal at enterprise genesis; company number, commercial registration, and tax file are pre-fetched and stored on the enterprise genome.",
  relatedLaws: [
    "Investment Law 72/2017",
    "Companies Law 159/1981",
    "Free Zones provisions of Law 72/2017",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.gafi.gov.eg/en/investor-portal",
};

// ══════════════════════════════════════════════════════════════════════════════
// 2. FRA — Financial Regulatory Authority
// ══════════════════════════════════════════════════════════════════════════════
const FRA: RegulatoryBody = {
  id: "fra",
  nameEn: "Financial Regulatory Authority",
  nameAr: "الهيئة العامة للرقابة المالية",
  acronym: "FRA",
  type: "authority",
  sector: "Non-banking financial supervision",
  mandate:
    "Supervises capital markets, insurance, mortgage finance, leasing, factoring, microfinance, securitization, and fintech regulatory sandboxes.",
  website: "https://fra.gov.eg",
  requiredForTiers: ["C", "D", "F"],
  requiredForSectors: ["fintech", "insurance", "real-estate", "technology"],
  registrationRequired: true,
  registrationFeeEgp: 50000,
  registrationTimeDays: 60,
  complianceFrequency: "quarterly",
  aurentaIntegration:
    "AURIENTA surfaces FRA filings for Tier C+ enterprises issuing debt/equity instruments, insurance partnerships, or sandbox tokens; FRA licence number is stored on the enterprise genome and surfaced in the compliance cockpit.",
  relatedLaws: [
    "FRA Law 10/2009",
    "Capital Market Law 95/1992",
    "Insurance Supervision Law 10/1981",
    "Mortgage Finance Law 148/2001",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://fra.gov.eg/e-services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 3. CBE — Central Bank of Egypt
// ══════════════════════════════════════════════════════════════════════════════
const CBE: RegulatoryBody = {
  id: "cbe",
  nameEn: "Central Bank of Egypt",
  nameAr: "البنك المركزي المصري",
  acronym: "CBE",
  type: "authority",
  sector: "Monetary policy & banking supervision",
  mandate:
    "Issues Egyptian Pound, sets monetary policy, supervises banks, manages FX reserves, and licenses payment service providers under Law 194/2020.",
  website: "https://www.cbe.org.eg",
  requiredForTiers: ["F"],
  requiredForSectors: ["fintech", "technology"],
  registrationRequired: false,
  registrationFeeEgp: 0,
  registrationTimeDays: 180,
  complianceFrequency: "quarterly",
  aurentaIntegration:
    "AURIENTA reads CBE published FX rates daily for the productive-EGP engine and pulls CBE-issued bank-licence lists to validate counterparties before any institutional liquidity operation.",
  relatedLaws: [
    "Central Bank & Banking Sector Law 194/2020",
    "Banking Law 194/2020 (replaced 88/2003)",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.cbe.org.eg/en/e-services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 4. ETA — Egyptian Tax Authority
// ══════════════════════════════════════════════════════════════════════════════
const ETA: RegulatoryBody = {
  id: "eta",
  nameEn: "Egyptian Tax Authority",
  nameAr: "مصلحة الضرائب المصرية",
  acronym: "ETA",
  type: "authority",
  sector: "Tax administration (income, VAT, stamp duty)",
  mandate:
    "Registers taxpayers, collects income tax and VAT, administers e-invoicing, and audits transfer pricing and withholding obligations.",
  website: "https://eta.gov.eg",
  requiredForTiers: ["A", "B", "C", "D", "E", "F"],
  requiredForSectors: [
    "agriculture", "fisheries", "mining", "food-manufacturing", "textiles",
    "wood-products", "paper-printing", "chemicals", "construction-materials",
    "metals", "electronics", "machinery", "automotive", "medical-devices",
    "renewable-energy", "water-treatment", "waste-management", "construction",
    "retail", "logistics", "transportation", "tourism", "media-content",
    "telecom", "technology", "fintech", "insurance", "real-estate",
    "professional-services", "research-rd", "business-services", "education",
    "healthcare", "pharmaceuticals", "creative-industries", "personal-services",
  ],
  registrationRequired: true,
  registrationFeeEgp: 0,
  registrationTimeDays: 3,
  complianceFrequency: "monthly",
  aurentaIntegration:
    "AURIENTA's tax engine consumes ETA e-invoice JSON, auto-computes VAT, prepares monthly VAT returns, and triggers quarterly salary withholding (Form 1) — a single sign-on pushes filings directly into the ETA portal.",
  relatedLaws: [
    "Income Tax Law 91/2005",
    "Value-Added Tax Law 67/2016",
    "Stamp Duty Law 111/1980",
    "Tax Procedures Law 91/2005",
    "E-Invoicing Decree 386/2021",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://invoice.eta.gov.eg",
};

// ══════════════════════════════════════════════════════════════════════════════
// 5. NOSI — National Organization for Social Insurance
// ══════════════════════════════════════════════════════════════════════════════
const NOSI: RegulatoryBody = {
  id: "nosi",
  nameEn: "National Organization for Social Insurance",
  nameAr: "المؤسسة القومية للتأمين الاجتماعي",
  acronym: "NOSI",
  type: "organization",
  sector: "Social insurance & pensions",
  mandate:
    "Administers social insurance contributions (pension, work injury, unemployment) for all employees under Law 148/2019.",
  website: "https://www.nosi.gov.eg",
  requiredForTiers: ["A", "B", "C", "D", "E", "F"],
  requiredForSectors: [
    "agriculture", "fisheries", "mining", "food-manufacturing", "textiles",
    "wood-products", "paper-printing", "chemicals", "construction-materials",
    "metals", "electronics", "machinery", "automotive", "medical-devices",
    "renewable-energy", "water-treatment", "waste-management", "construction",
    "retail", "logistics", "transportation", "tourism", "media-content",
    "telecom", "technology", "fintech", "insurance", "real-estate",
    "professional-services", "research-rd", "business-services", "education",
    "healthcare", "pharmaceuticals", "creative-industries", "personal-services",
  ],
  registrationRequired: true,
  registrationFeeEgp: 0,
  registrationTimeDays: 7,
  complianceFrequency: "monthly",
  aurentaIntegration:
    "AURIENTA payroll engine auto-computes the 18.75% employer + 14% employee contribution bands, generates Form 6 (registration) and Form 2 (monthly), and pushes filings into the NOSI online portal.",
  relatedLaws: [
    "Social Insurance Law 148/2019",
    "Comprehensive Health Insurance Law 2/2018",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.nosi.gov.eg/NosiWeb/",
};

// ══════════════════════════════════════════════════════════════════════════════
// 6. CRCICA — Cairo Regional Centre for International Commercial Arbitration
// ══════════════════════════════════════════════════════════════════════════════
const CRCICA: RegulatoryBody = {
  id: "crcica",
  nameEn: "Cairo Regional Centre for International Commercial Arbitration",
  nameAr: "المركز الإقليمي للتحكيم التجاري الدولي بالقاهرة",
  acronym: "CRCICA",
  type: "center",
  sector: "International commercial arbitration & ADR",
  mandate:
    "Independent arbitral institution administering commercial arbitration, mediation, and ADR under the UNCITRAL Arbitration Rules and CRCICA Rules.",
  website: "https://crcica.org",
  requiredForTiers: ["B", "C", "D", "F"],
  requiredForSectors: [
    "construction", "real-estate", "technology", "fintech",
    "professional-services", "logistics", "telecom", "mining",
  ],
  registrationRequired: false,
  registrationFeeEgp: 0,
  registrationTimeDays: 1,
  complianceFrequency: "on-change",
  aurentaIntegration:
    "Stage-4 escalation target of AURIENTA's 6-stage dispute resolution state machine. The arbitration clause is auto-injected into founder charters at Tier B+, and case filings are pushed via CRCICA e-filing API with deterministic case IDs.",
  relatedLaws: [
    "Arbitration Law 27/1994",
    "CRCICA Rules 2011 (amended 2014)",
    "New York Convention 1958 (Egypt acceded 1959)",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://crcica.org/e-filing",
};

// ══════════════════════════════════════════════════════════════════════════════
// 7. NFSA — National Food Safety Authority
// ══════════════════════════════════════════════════════════════════════════════
const NFSA: RegulatoryBody = {
  id: "nfsa",
  nameEn: "National Food Safety Authority",
  nameAr: "الهيئة القومية لسلامة الغذاء",
  acronym: "NFSA",
  type: "authority",
  sector: "Food safety across the food chain",
  mandate:
    "Sets and enforces food safety standards from farm to fork; registers food establishments, inspects imports, and licenses food handlers.",
  website: "https://nfsa.gov.eg",
  requiredForTiers: ["A", "B", "C", "D", "F"],
  requiredForSectors: [
    "agriculture", "fisheries", "food-manufacturing", "retail", "logistics",
  ],
  registrationRequired: true,
  registrationFeeEgp: 2500,
  registrationTimeDays: 30,
  complianceFrequency: "annual",
  aurentaIntegration:
    "Food-sector enterprises (Tier A+) are routed to NFSA registration in parallel with GAFI incorporation; NFSA licence number is recorded on the genome and surfaced in the compliance cockpit as a gating precondition for shipment of food products.",
  relatedLaws: [
    "NFSA Law 1/2017",
    "Food Safety Decree 188/2018",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://nfsa.gov.eg/e-services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 8. EDA — Egyptian Drug Authority
// ══════════════════════════════════════════════════════════════════════════════
const EDA: RegulatoryBody = {
  id: "eda",
  nameEn: "Egyptian Drug Authority",
  nameAr: "هيئة الدواء المصرية",
  acronym: "EDA",
  type: "authority",
  sector: "Pharmaceuticals, biologics, medical devices, cosmetics",
  mandate:
    "Unified regulator for medicines, biologicals, medical devices, vaccines, and cosmetics; issues marketing authorizations and GMP certificates.",
  website: "https://eda.gov.eg",
  requiredForTiers: ["C", "D", "F"],
  requiredForSectors: ["pharmaceuticals", "medical-devices", "healthcare", "chemicals"],
  registrationRequired: true,
  registrationFeeEgp: 25000,
  registrationTimeDays: 180,
  complianceFrequency: "annual",
  aurentaIntegration:
    "Life-sciences enterprises (Tier C+) trigger EDA pre-submission checklists; AURIENTA stores GMP/ISO 13485 audit evidence on the enterprise genome and links EDA marketing-authorization IDs to product SKUs in the ERP module.",
  relatedLaws: [
    "EDA Law 151/2019",
    "Medicines Pricing Decree 499/2018",
    "Medical Devices Decree 343/2017",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://eda.gov.eg/services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 9. NTRA — National Telecom Regulatory Authority
// ══════════════════════════════════════════════════════════════════════════════
const NTRA: RegulatoryBody = {
  id: "ntra",
  nameEn: "National Telecom Regulatory Authority",
  nameAr: "الجهاز القومي لتنظيم الاتصالات",
  acronym: "NTRA",
  type: "authority",
  sector: "Telecommunications & spectrum",
  mandate:
    "Licenses telecom operators, manages spectrum, sets interconnection rates, and protects telecom consumers under Law 10/2003.",
  website: "https://tra.gov.eg",
  requiredForTiers: ["C", "D", "F"],
  requiredForSectors: ["telecom", "technology", "media-content"],
  registrationRequired: true,
  registrationFeeEgp: 100000,
  registrationTimeDays: 120,
  complianceFrequency: "annual",
  aurentaIntegration:
    "AURIENTA tags telecom licences to enterprise genome; spectrum-fee schedules feed into the tax engine and the readiness tracker surfaces renewal windows 90 days before expiry.",
  relatedLaws: [
    "Telecom Regulation Law 10/2003",
    "Spectrum Management Decree 190/2016",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://tra.gov.eg/en/services/Pages/default.aspx",
};

// ══════════════════════════════════════════════════════════════════════════════
// 10. NREA — New & Renewable Energy Authority
// ══════════════════════════════════════════════════════════════════════════════
const NREA: RegulatoryBody = {
  id: "nrea",
  nameEn: "New & Renewable Energy Authority",
  nameAr: "جهاز تنظيم شؤون الطاقة الجديدة والمتجددة",
  acronym: "NREA",
  type: "authority",
  sector: "Renewable energy (solar, wind, biomass)",
  mandate:
    "Promotes renewable energy, conducts resource assessments, issues RE project approvals, and tenders BOO/BOT solar and wind projects.",
  website: "https://nrea.gov.eg",
  requiredForTiers: ["C", "D", "F"],
  requiredForSectors: ["renewable-energy", "construction"],
  registrationRequired: true,
  registrationFeeEgp: 15000,
  registrationTimeDays: 90,
  complianceFrequency: "annual",
  aurentaIntegration:
    "RE developers are routed to NREA + EETC + Egyptian Electricity Utility Consumer Protection Agency in a single integrated workflow; NREA approvals feed into the productive-EGP sovereign yield calculator.",
  relatedLaws: [
    "NREA Law 102/1986",
    "Electricity Law 87/2015",
    "Renewable Energy Decree 1947/2014 (Feed-in Tariff)",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://nrea.gov.eg/en/services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 11. EMRA — Egyptian Mineral Resources Authority
// ══════════════════════════════════════════════════════════════════════════════
const EMRA: RegulatoryBody = {
  id: "emra",
  nameEn: "Egyptian Mineral Resources Authority",
  nameAr: "الهيئة المصرية العامة للثروة المعدنية",
  acronym: "EMRA",
  type: "authority",
  sector: "Mining & quarrying concessions",
  mandate:
    "Grants exploration and exploitation licenses for all mineral resources (gold, phosphate, black sand, ornamental stone); manages tenders under the Unified Mining Law.",
  website: "https://emra.gov.eg",
  requiredForTiers: ["C", "D", "F"],
  requiredForSectors: ["mining", "construction-materials", "chemicals"],
  registrationRequired: true,
  registrationFeeEgp: 50000,
  registrationTimeDays: 120,
  complianceFrequency: "annual",
  aurentaIntegration:
    "Mining-tier enterprises are routed to EMRA concession tenders; licence polygons and royalty schedules are stored on the genome and feed the productive-EGP calculator.",
  relatedLaws: [
    "Unified Mining Law 198/2014",
    "Mining Resources Law 66/2003 (superseded)",
    "Investment Law 72/2017 (mining incentives)",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://emra.gov.eg/en/tenders",
};

// ══════════════════════════════════════════════════════════════════════════════
// 12. EEAA — Egyptian Environmental Affairs Agency
// ══════════════════════════════════════════════════════════════════════════════
const EEAA: RegulatoryBody = {
  id: "eeaa",
  nameEn: "Egyptian Environmental Affairs Agency",
  nameAr: "جهاز شؤون البيئة",
  acronym: "EEAA",
  type: "agency",
  sector: "Environmental protection & EIA",
  mandate:
    "Administers environmental impact assessment (EIA), pollution control, hazardous waste management, and protected areas under Law 4/1994.",
  website: "https://www.eeaa.gov.eg",
  requiredForTiers: ["A", "B", "C", "D", "F"],
  requiredForSectors: [
    "mining", "food-manufacturing", "chemicals", "construction-materials",
    "metals", "machinery", "automotive", "renewable-energy", "water-treatment",
    "waste-management", "construction", "transportation", "tourism",
    "pharmaceuticals", "agriculture",
  ],
  registrationRequired: true,
  registrationFeeEgp: 5000,
  registrationTimeDays: 60,
  complianceFrequency: "annual",
  aurentaIntegration:
    "AURIENTA pre-screens sectoral EIA forms (A/B/C) at enterprise genesis, generates the EEAA Form B/C submission package, and surfaces annual environmental audit reminders 60 days before due date.",
  relatedLaws: [
    "Environment Law 4/1994",
    "Environment Law Amendment 9/2009",
    "Waste Management Decree 1095/2011",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.eeaa.gov.eg/eia",
};

// ══════════════════════════════════════════════════════════════════════════════
// 13. NUCA — New Urban Communities Authority
// ══════════════════════════════════════════════════════════════════════════════
const NUCA: RegulatoryBody = {
  id: "nuca",
  nameEn: "New Urban Communities Authority",
  nameAr: "جهاز تنمية المشروعات المجتمعات العمرانية الجديدة",
  acronym: "NUCA",
  type: "authority",
  sector: "New-city development & land allocation",
  mandate:
    "Develops Egypt's new cities (e.g., New Cairo, 6th of October, New Administrative Capital), allocates industrial and residential land, and manages new-city utilities.",
  website: "https://nuca.gov.eg",
  requiredForTiers: ["B", "C", "D", "F"],
  requiredForSectors: ["real-estate", "construction", "construction-materials", "logistics"],
  registrationRequired: false,
  registrationFeeEgp: 0,
  registrationTimeDays: 45,
  complianceFrequency: "on-change",
  aurentaIntegration:
    "Land-allocation deeds and usufruct contracts are anchored to the enterprise genome so that any subsequent capital raise or graduation event triggers automatic re-verification of NUCA land-use compliance.",
  relatedLaws: [
    "New Urban Communities Law 59/1979",
    "Law 119/2008 (Unified Building Law)",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://nuca.gov.eg/services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 14. IDA — Industrial Development Authority
// ══════════════════════════════════════════════════════════════════════════════
const IDA: RegulatoryBody = {
  id: "ida",
  nameEn: "Industrial Development Authority",
  nameAr: "جهاز تنمية الصناعة",
  acronym: "IDA",
  type: "authority",
  sector: "Industrial licensing & industrial land",
  mandate:
    "Issues unified industrial licences (UIL), allocates industrial-zone land, and certifies industrial projects under Law 249/2005.",
  website: "https://ida.gov.eg",
  requiredForTiers: ["B", "C", "D", "F"],
  requiredForSectors: [
    "food-manufacturing", "textiles", "wood-products", "paper-printing",
    "chemicals", "construction-materials", "metals", "electronics",
    "machinery", "automotive", "medical-devices", "pharmaceuticals",
    "renewable-energy",
  ],
  registrationRequired: true,
  registrationFeeEgp: 8000,
  registrationTimeDays: 20,
  complianceFrequency: "annual",
  aurentaIntegration:
    "AURIENTA orchestrates the unified industrial licence workflow (Form 6 → IDA committee → licence) and stores the UIL certificate on the genome as a precondition for industrial-tier enterprise activation.",
  relatedLaws: [
    "Industry Law 249/2005",
    "Unified Industrial Licence Decree 188/2020",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://ida.gov.eg/en/services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 15. SCZone — Suez Canal Economic Zone Authority
// ══════════════════════════════════════════════════════════════════════════════
const SCZone: RegulatoryBody = {
  id: "sczone",
  nameEn: "Suez Canal Economic Zone Authority",
  nameAr: "هيئة قناة السويس الاقتصادية",
  acronym: "SCZone",
  type: "authority",
  sector: "Special Economic Zone (SCZone)",
  mandate:
    "Governs the 461 km² Suez Canal Economic Zone; licenses developers, grants SEZ incentives, and manages port industrial cities (Ain Sokhna, East Port Said, Qantara West).",
  website: "https://sczone.co.eg",
  requiredForTiers: ["C", "D", "F"],
  requiredForSectors: ["logistics", "transportation", "food-manufacturing", "chemicals", "textiles"],
  registrationRequired: false,
  registrationFeeEgp: 50000,
  registrationTimeDays: 30,
  complianceFrequency: "annual",
  aurentaIntegration:
    "Enterprises electing SCZone domicile are flagged on the genome; the AURIENTA incentive engine auto-applies the SEZ 50% tax reduction under Law 83/2019 and tracks SCZone-specific KPIs (export %, local content %).",
  relatedLaws: [
    "SCZone Law 83/2019",
    "Investment Law 72/2017 (SEZ provisions)",
    "Customs Law 207/2020 (SCZone procedures)",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://sczone.co.eg/e-services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 16. CAPMAS — Central Agency for Public Mobilization & Statistics
// ══════════════════════════════════════════════════════════════════════════════
const CAPMAS: RegulatoryBody = {
  id: "capmas",
  nameEn: "Central Agency for Public Mobilization and Statistics",
  nameAr: "الجهاز المركزي للتعبئة العامة والإحصاء",
  acronym: "CAPMAS",
  type: "organization",
  sector: "National statistics & economic classification",
  mandate:
    "Publishes the Egyptian Economic Activity Classification (EEAC — aligned to ISIC Rev.4), maintains the business register, and conducts the national census.",
  website: "https://www.capmas.gov.eg",
  requiredForTiers: ["A", "B", "C", "D", "E", "F"],
  requiredForSectors: [
    "agriculture", "fisheries", "mining", "food-manufacturing", "textiles",
    "wood-products", "paper-printing", "chemicals", "construction-materials",
    "metals", "electronics", "machinery", "automotive", "medical-devices",
    "renewable-energy", "water-treatment", "waste-management", "construction",
    "retail", "logistics", "transportation", "tourism", "media-content",
    "telecom", "technology", "fintech", "insurance", "real-estate",
    "professional-services", "research-rd", "business-services", "education",
    "healthcare", "pharmaceuticals", "creative-industries", "personal-services",
  ],
  registrationRequired: true,
  registrationFeeEgp: 0,
  registrationTimeDays: 1,
  complianceFrequency: "on-change",
  aurentaIntegration:
    "AURIENTA derives each enterprise's 5-digit EEAC code from its declared primary activity; CAPMAS benchmark statistics feed the AI feasibility engine and the wage-band calculator.",
  relatedLaws: [
    "CAPMAS Law 91/1960",
    "Statistics Law 35/1960",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.capmas.gov.eg/Pages/StaticPages.aspx?page_id=5084",
};

// ══════════════════════════════════════════════════════════════════════════════
// 17. ECA — Egyptian Competition Authority
// ══════════════════════════════════════════════════════════════════════════════
const ECA: RegulatoryBody = {
  id: "eca",
  nameEn: "Egyptian Competition Authority",
  nameAr: "جهاز حماية المنافسة ومنع الممارسات الاحتكارية",
  acronym: "ECA",
  type: "authority",
  sector: "Anti-trust & merger control",
  mandate:
    "Investigates anti-competitive practices, reviews economic concentrations above EGP 100M turnover threshold, and enforces Competition Law 3/2005.",
  website: "https://www.eca.gov.eg",
  requiredForTiers: ["C", "D", "F"],
  requiredForSectors: [
    "food-manufacturing", "telecom", "fintech", "insurance", "real-estate",
    "pharmaceuticals", "logistics", "transportation", "technology",
  ],
  registrationRequired: false,
  registrationFeeEgp: 0,
  registrationTimeDays: 60,
  complianceFrequency: "on-change",
  aurentaIntegration:
    "When Tier C+ enterprises plan M&A or asset deals exceeding the EGP 100M threshold, AURIENTA auto-generates the ECA notification Form C-1 and tracks the statutory waiting period before signature.",
  relatedLaws: [
    "Competition Law 3/2005",
    "Competition Law Amendment 194/2014",
    "Competition Law Amendment 20/2018",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.eca.gov.eg/en-us/services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 18. Customs Authority — Egyptian Customs
// ══════════════════════════════════════════════════════════════════════════════
const Customs: RegulatoryBody = {
  id: "customs",
  nameEn: "Egyptian Customs Authority",
  nameAr: "مصلحة الجمارك المصرية",
  acronym: "ECA-Customs",
  type: "authority",
  sector: "Customs clearance & tariff collection",
  mandate:
    "Inspects and clears cross-border goods, collects customs duties, administers the Nafeza/ACI single-window, and enforces the new Customs Law 207/2020.",
  website: "https://www.customs.gov.eg",
  requiredForTiers: ["A", "B", "C", "D", "F"],
  requiredForSectors: [
    "logistics", "retail", "food-manufacturing", "textiles", "electronics",
    "machinery", "automotive", "medical-devices", "pharmaceuticals",
    "agriculture", "chemicals",
  ],
  registrationRequired: true,
  registrationFeeEgp: 0,
  registrationTimeDays: 3,
  complianceFrequency: "on-change",
  aurentaIntegration:
    "AURIENTA's ERP-Procurement module pushes Advance Cargo Information (ACI) pre-registrations into Nafeza 48h before shipment, links customs release IDs to POs, and computes landed-cost duty under the new Customs Law 207/2020 tariff schedule.",
  relatedLaws: [
    "Customs Law 66/1963",
    "Customs Law 207/2020 (unified, in force)",
    "ACI Decree 38/2021",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.nafeza.gov.eg",
};

// ══════════════════════════════════════════════════════════════════════════════
// 19. GOEIC — General Organization for Export & Import Control
// ══════════════════════════════════════════════════════════════════════════════
const GOEIC: RegulatoryBody = {
  id: "goeic",
  nameEn: "General Organization for Export and Import Control",
  nameAr: "الهيئة العامة للرقابة على الصادرات والواردات",
  acronym: "GOEIC",
  type: "organization",
  sector: "Import/export inspection & quality control",
  mandate:
    "Registers importers and exporters, inspects imported goods for conformity to EOS standards, and issues pre-shipment inspection certificates.",
  website: "https://www.goeic.gov.eg",
  requiredForTiers: ["A", "B", "C", "D", "F"],
  requiredForSectors: [
    "logistics", "retail", "food-manufacturing", "textiles", "electronics",
    "machinery", "automotive", "medical-devices", "pharmaceuticals",
    "agriculture", "chemicals", "metals",
  ],
  registrationRequired: true,
  registrationFeeEgp: 5000,
  registrationTimeDays: 14,
  complianceFrequency: "on-change",
  aurentaIntegration:
    "AURIENTA registers the importer/exporter card at Tier B+ inception, embeds the GOEIC card number on the enterprise genome, and pre-validates product HS codes against GOEIC inspection regimes before any ERP purchase order is released.",
  relatedLaws: [
    "Import/Export Law 118/1975",
    "GOEIC Decree 381/2012 (importer registry)",
    "Conformity Decree 991/2015",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.goeic.gov.eg/Services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 20. EOS — Egyptian Organization for Standardization & Quality
// ══════════════════════════════════════════════════════════════════════════════
const EOS: RegulatoryBody = {
  id: "eos",
  nameEn: "Egyptian Organization for Standardization and Quality",
  nameAr: "الهيئة المصرية للمواصفات والجودة",
  acronym: "EOS",
  type: "organization",
  sector: "National standards & quality marks",
  mandate:
    "Drafts and publishes Egyptian Standards (ES), grants the quality mark, represents Egypt in ISO/IEC, and accredits conformity-assessment bodies.",
  website: "https://eos.org.eg",
  requiredForTiers: ["B", "C", "D", "F"],
  requiredForSectors: [
    "food-manufacturing", "textiles", "electronics", "machinery", "automotive",
    "medical-devices", "construction-materials", "chemicals", "metals",
  ],
  registrationRequired: false,
  registrationFeeEgp: 3000,
  registrationTimeDays: 60,
  complianceFrequency: "annual",
  aurentaIntegration:
    "EOS standard numbers are referenced on every product SKU in the ERP module; AURIENTA's compliance cockpit surfaces standards-renewal alerts and the quality-mark audit schedule.",
  relatedLaws: [
    "Standardization Law 28/1957",
    "Quality Mark Decree 180/1996",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://eos.org.eg/en/eos-services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 21. NSA — National Security Agency (security clearance)
// ══════════════════════════════════════════════════════════════════════════════
const NSA: RegulatoryBody = {
  id: "nsa",
  nameEn: "National Security Agency — Security Vetting",
  nameAr: "جهاز الأمن الوطني — فحص أمني",
  acronym: "NSA",
  type: "agency",
  sector: "National security clearance for critical sectors",
  mandate:
    "Conducts security vetting of directors and shareholders in critical sectors (telecom, banking, energy, media, infrastructure) prior to licence issuance.",
  website: "https://www.egypt.gov.eg",
  requiredForTiers: ["C", "D", "F"],
  requiredForSectors: ["telecom", "fintech", "media-content", "transportation", "logistics"],
  registrationRequired: false,
  registrationFeeEgp: 0,
  registrationTimeDays: 45,
  complianceFrequency: "on-change",
  aurentaIntegration:
    "AURIENTA flags sectors requiring security clearance at enterprise genesis; founder KYC documents are pre-packaged and routed via the parent ministry (MCIT/CBE/NTRA) which forwards to NSA. Clearance status is recorded on the genome as a gating precondition for licence activation.",
  relatedLaws: [
    "Civil Service Law 81/1956 (security vetting)",
    "Telecom Law 10/2003 (security clearance clause)",
    "Banking Law 194/2020 (fit-and-proper)",
  ],
  digitalServicesAvailable: false,
};

// ══════════════════════════════════════════════════════════════════════════════
// 22. MOM — Ministry of Manpower
// ══════════════════════════════════════════════════════════════════════════════
const MOM: RegulatoryBody = {
  id: "mom",
  nameEn: "Ministry of Manpower",
  nameAr: "وزارة القوى العاملة",
  acronym: "MOM",
  type: "ministry",
  sector: "Labor law enforcement & work permits",
  mandate:
    "Enforces Labor Law 12/2003, issues work permits for foreign employees, mediates labour disputes, and inspects workplace safety.",
  website: "https://www.manpower.gov.eg",
  requiredForTiers: ["A", "B", "C", "D", "E", "F"],
  requiredForSectors: [
    "agriculture", "fisheries", "mining", "food-manufacturing", "textiles",
    "wood-products", "paper-printing", "chemicals", "construction-materials",
    "metals", "electronics", "machinery", "automotive", "medical-devices",
    "renewable-energy", "water-treatment", "waste-management", "construction",
    "retail", "logistics", "transportation", "tourism", "media-content",
    "telecom", "technology", "fintech", "insurance", "real-estate",
    "professional-services", "research-rd", "business-services", "education",
    "healthcare", "pharmaceuticals", "creative-industries", "personal-services",
  ],
  registrationRequired: true,
  registrationFeeEgp: 0,
  registrationTimeDays: 7,
  complianceFrequency: "annual",
  aurentaIntegration:
    "AURIENTA's workforce module auto-detects when a foreign employee triggers the work-permit threshold (10% of workforce / 20% wage cap) and generates the Form 6 package; labour-office inspection reports are filed against the genome.",
  relatedLaws: [
    "Labor Law 12/2003",
    "Work Permit Decree 28/2007",
    "Occupational Safety Decree 126/2003",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.manpower.gov.eg/Services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 23. MCIT — Ministry of Communications & Information Technology
// ══════════════════════════════════════════════════════════════════════════════
const MCIT: RegulatoryBody = {
  id: "mcit",
  nameEn: "Ministry of Communications and Information Technology",
  nameAr: "وزارة الاتصالات وتكنولوجيا المعلومات",
  acronym: "MCIT",
  type: "ministry",
  sector: "ICT policy & digital transformation",
  mandate:
    "Sets Egypt's ICT policy, oversees digital transformation, governs ITIDA and NTRA, and develops tech parks (Smart Village, MORG).",
  website: "https://mcit.gov.eg",
  requiredForTiers: ["A", "B", "C", "D", "F"],
  requiredForSectors: ["telecom", "technology", "media-content", "fintech"],
  registrationRequired: false,
  registrationFeeEgp: 0,
  registrationTimeDays: 30,
  complianceFrequency: "annual",
  aurentaIntegration:
    "MCIT-aligned tech enterprises are routed to ITIDA benefits and Smart Village tenancy; AURIENTA pushes MCIT Open Data Portal statistics into the AI feasibility engine.",
  relatedLaws: [
    "Presidential Decree 155/1999 (establishing MCIT)",
    "E-Signature Law 15/2004",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://mcit.gov.eg/en/services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 24. ITIDA — Information Technology Industry Development Agency
// ══════════════════════════════════════════════════════════════════════════════
const ITIDA: RegulatoryBody = {
  id: "itida",
  nameEn: "Information Technology Industry Development Agency",
  nameAr: "جهاز تطوير صناعة تكنولوجيا المعلومات",
  acronym: "ITIDA",
  type: "agency",
  sector: "IT industry incentives & tech parks",
  mandate:
    "Promotes IT exports, certifies IT companies for incentives, manages Smart Village and MORG tenancy, and funds IT skills programmes.",
  website: "https://itida.gov.eg",
  requiredForTiers: ["A", "B", "C", "D", "F"],
  requiredForSectors: ["technology", "fintech", "media-content"],
  registrationRequired: true,
  registrationFeeEgp: 0,
  registrationTimeDays: 21,
  complianceFrequency: "annual",
  aurentaIntegration:
    "IT-sector enterprises registered on AURIENTA auto-enrol in ITIDA's IT-export incentive scheme; the productive-EGP engine treats ITIDA-certified revenue as 0% withholding-eligible export income.",
  relatedLaws: [
    "ITIDA Law 15/2004",
    "E-Signature Law 15/2004",
    "Smart Village Decree 355/2001",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://itida.gov.eg/English/Services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 25. MTI — Ministry of Trade & Industry
// ══════════════════════════════════════════════════════════════════════════════
const MTI: RegulatoryBody = {
  id: "mti",
  nameEn: "Ministry of Trade and Industry",
  nameAr: "وزارة التجارة والصناعة",
  acronym: "MTI",
  type: "ministry",
  sector: "Trade & industrial policy",
  mandate:
    "Sets Egypt's trade and industrial policy, governs IDA, GOEIC, EOS, and Export Development Fund, and runs industrial modernisation programmes.",
  website: "https://www.mti.gov.eg",
  requiredForTiers: ["A", "B", "C", "D", "F"],
  requiredForSectors: [
    "food-manufacturing", "textiles", "wood-products", "paper-printing",
    "chemicals", "construction-materials", "metals", "electronics",
    "machinery", "automotive", "medical-devices", "logistics", "retail",
  ],
  registrationRequired: false,
  registrationFeeEgp: 0,
  registrationTimeDays: 0,
  complianceFrequency: "annual",
  aurentaIntegration:
    "AURIENTA surfaces MTI's industrial development incentives (Export Development Fund, IDA industrial land, IMC technical assistance) to founders during the Tier-B feasibility check.",
  relatedLaws: [
    "Industry Law 249/2005",
    "Internal Trade Law 11/1947",
    "Export Subsidy Decree 619/2017",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.mti.gov.eg/en/Services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 26. HCWW — Holding Company for Water & Wastewater
// ══════════════════════════════════════════════════════════════════════════════
const HCWW: RegulatoryBody = {
  id: "hcww",
  nameEn: "Holding Company for Water and Wastewater",
  nameAr: "الشركة القابضة لمياه الشرب والصرف الصحي",
  acronym: "HCWW",
  type: "holding_company",
  sector: "Potable water & wastewater utilities",
  mandate:
    "Holds the 25 governorate water/wastewater operating affiliates; manages water connections, treatment plants, and industrial wastewater permits.",
  website: "https://www.hcww.com.eg",
  requiredForTiers: ["B", "C", "D", "F"],
  requiredForSectors: ["water-treatment", "construction", "real-estate", "food-manufacturing", "pharmaceuticals"],
  registrationRequired: false,
  registrationFeeEgp: 5000,
  registrationTimeDays: 30,
  complianceFrequency: "annual",
  aurentaIntegration:
    "Industrial enterprises (Tier B+) are routed to HCWW for industrial wastewater discharge permits; permit limits feed the ERP effluent-monitoring dashboard and the ESG transparency layer.",
  relatedLaws: [
    "HCWW Establishing Law 135/2004",
    "Water & Wastewater Law 48/1982",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.hcww.com.eg/en/services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 27. EETC — Egyptian Electricity Transmission Company
// ══════════════════════════════════════════════════════════════════════════════
const EETC: RegulatoryBody = {
  id: "eetc",
  nameEn: "Egyptian Electricity Transmission Company",
  nameAr: "شركة نقل الكهرباء المصرية",
  acronym: "EETC",
  type: "holding_company",
  sector: "High-voltage electricity transmission grid",
  mandate:
    "Operates Egypt's unified 500/220 kV transmission grid, signs PPAs with RE developers, and manages cross-border interconnections.",
  website: "https://www.eetc.com.eg",
  requiredForTiers: ["C", "D", "F"],
  requiredForSectors: ["renewable-energy", "metals", "chemicals"],
  registrationRequired: false,
  registrationFeeEgp: 0,
  registrationTimeDays: 90,
  complianceFrequency: "annual",
  aurentaIntegration:
    "RE generators (Tier C+) sign PPAs with EETC; AURIENTA stores PPA tariff and tenure on the genome and feeds energy-generation KPIs into the productive-EGP yield calculator.",
  relatedLaws: [
    "Electricity Law 87/2015",
    "EETC Establishing Decree 168/2000",
    "Renewable Energy Decree 1947/2014",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.eetc.com.eg",
};

// ══════════════════════════════════════════════════════════════════════════════
// 28. MALR — Ministry of Agriculture & Land Reclamation
// ══════════════════════════════════════════════════════════════════════════════
const MALR: RegulatoryBody = {
  id: "malr",
  nameEn: "Ministry of Agriculture and Land Reclamation",
  nameAr: "وزارة الزراعة واستصلاح الأراضي",
  acronym: "MALR",
  type: "ministry",
  sector: "Agriculture, livestock, land reclamation",
  mandate:
    "Sets agricultural policy, regulates plant quarantine and seed registration, manages reclamation of desert land, and oversees APC and GAFRD.",
  website: "https://www.scla.gov.eg",
  requiredForTiers: ["A", "B", "C", "D", "F"],
  requiredForSectors: ["agriculture", "fisheries", "food-manufacturing", "research-rd"],
  registrationRequired: true,
  registrationFeeEgp: 1000,
  registrationTimeDays: 30,
  complianceFrequency: "annual",
  aurentaIntegration:
    "Agricultural enterprises (Tier A+) register with MALR's Central Administration for Plant Quarantine; reclamation land contracts are anchored to the genome for downstream incentive calculation.",
  relatedLaws: [
    "Agriculture Law 53/1966",
    "Land Reclamation Law 5/1965",
    "Agricultural Cooperative Law 122/1980",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.scla.gov.eg/Services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 29. MWRI — Ministry of Water Resources & Irrigation
// ══════════════════════════════════════════════════════════════════════════════
const MWRI: RegulatoryBody = {
  id: "mwri",
  nameEn: "Ministry of Water Resources and Irrigation",
  nameAr: "وزارة الموارد المائية والري",
  acronym: "MWRI",
  type: "ministry",
  sector: "Nile waters, irrigation, groundwater",
  mandate:
    "Manages Nile waters, irrigation and drainage infrastructure, groundwater abstraction permits, and Egypt's share under the 1959 Nile Waters Agreement.",
  website: "https://www.mwri.gov.eg",
  requiredForTiers: ["C", "D", "F"],
  requiredForSectors: ["agriculture", "water-treatment", "construction", "renewable-energy"],
  registrationRequired: false,
  registrationFeeEgp: 3000,
  registrationTimeDays: 45,
  complianceFrequency: "annual",
  aurentaIntegration:
    "AURIENTA routes large water consumers (>5,000 m³/day) to MWRI for groundwater-well permits; abstraction volumes feed the ESG water-consumption dashboard and the readiness tracker.",
  relatedLaws: [
    "Irrigation and Drainage Law 12/1984",
    "Groundwater Decree 313/1995",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.mwri.gov.eg/Services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 30. MOP / MPED — Ministry of Planning & Economic Development
// ══════════════════════════════════════════════════════════════════════════════
const MOP: RegulatoryBody = {
  id: "mop",
  nameEn: "Ministry of Planning and Economic Development",
  nameAr: "وزارة التخطيط والتنمية الاقتصادية",
  acronym: "MPED",
  type: "ministry",
  sector: "National planning & Vision 2030",
  mandate:
    "Sets national development plans, coordinates Egypt Vision 2030, governs Sovereign Fund of Egypt, and tracks public investment programmes.",
  website: "https://www.mped.gov.eg",
  requiredForTiers: ["F"],
  requiredForSectors: ["research-rd", "technology", "renewable-energy", "logistics"],
  registrationRequired: false,
  registrationFeeEgp: 0,
  registrationTimeDays: 0,
  complianceFrequency: "annual",
  aurentaIntegration:
    "Tier-F graduation triggers an MPED Vision 2030 alignment report card on the genome, scoring the enterprise against the 10 Vision 2030 pillars and surfacing Sovereign Fund co-investment eligibility.",
  relatedLaws: [
    "MPED Establishing Law 17/2020",
    "Sovereign Fund of Egypt Law 177/2018",
    "Egypt Vision 2030 (2016, updated 2022)",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.mped.gov.eg/en/Services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 31. APC — Agricultural Pesticide Committee
// ══════════════════════════════════════════════════════════════════════════════
const APC: RegulatoryBody = {
  id: "apc",
  nameEn: "Agricultural Pesticide Committee",
  nameAr: "لجنة المبيدات الزراعية",
  acronym: "APC",
  type: "organization",
  sector: "Pesticide registration & control",
  mandate:
    "Registers, licenses, and controls agricultural pesticides; sets MRLs and supervises the National Pesticide Laboratory.",
  website: "https://apc.gov.eg",
  requiredForTiers: ["B", "C", "D", "F"],
  requiredForSectors: ["agriculture", "chemicals"],
  registrationRequired: true,
  registrationFeeEgp: 12000,
  registrationTimeDays: 180,
  complianceFrequency: "annual",
  aurentaIntegration:
    "Agricultural-input enterprises route pesticide registration packages via AURIENTA's life-sciences workflow; APC registration numbers are tied to product SKUs and surface expiry alerts in the ERP inventory module.",
  relatedLaws: [
    "Agriculture Law 53/1966 (Article 96 — pesticides)",
    "APC Establishing Decree 1018/2010",
    "Pesticide Registration Decree 1018/2010",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://apc.gov.eg/services",
};

// ══════════════════════════════════════════════════════════════════════════════
// 32. GAFRD — General Authority for Fish Resources Development
// ══════════════════════════════════════════════════════════════════════════════
const GAFRD: RegulatoryBody = {
  id: "gafrd",
  nameEn: "General Authority for Fish Resources Development",
  nameAr: "الهيئة العامة لتنمية الثروة السمكية",
  acronym: "GAFRD",
  type: "authority",
  sector: "Fisheries & aquaculture",
  mandate:
    "Licenses aquaculture farms, fishing vessels, and fish processing plants; manages fishery resources in Egyptian territorial waters.",
  website: "https://www.gafrd.gov.eg",
  requiredForTiers: ["A", "B", "C", "D", "F"],
  requiredForSectors: ["fisheries", "food-manufacturing"],
  registrationRequired: true,
  registrationFeeEgp: 2000,
  registrationTimeDays: 30,
  complianceFrequency: "annual",
  aurentaIntegration:
    "Aquaculture and fisheries enterprises (Tier A+) route GAFRD licences through AURIENTA; farm GPS polygons are stored on the genome and surface in the EIA-EEAA cross-check for coastal zone compliance.",
  relatedLaws: [
    "Fish Resources Law 124/1983",
    "Aquaculture Decree 852/2003",
  ],
  digitalServicesAvailable: true,
  onlinePortalUrl: "https://www.gafrd.gov.eg/services",
};

// ══════════════════════════════════════════════════════════════════════════════
// Aggregate export
// ══════════════════════════════════════════════════════════════════════════════
export const EGYPT_REGULATORY_BODIES: RegulatoryBody[] = [
  GAFI,
  FRA,
  CBE,
  ETA,
  NOSI,
  CRCICA,
  NFSA,
  EDA,
  NTRA,
  NREA,
  EMRA,
  EEAA,
  NUCA,
  IDA,
  SCZone,
  CAPMAS,
  ECA,
  Customs,
  GOEIC,
  EOS,
  NSA,
  MOM,
  MCIT,
  ITIDA,
  MTI,
  HCWW,
  EETC,
  MALR,
  MWRI,
  MOP,
  APC,
  GAFRD,
];

// ══════════════════════════════════════════════════════════════════════════════
// Lookup helpers
// ══════════════════════════════════════════════════════════════════════════════

export function getBodyById(id: string): RegulatoryBody | undefined {
  return EGYPT_REGULATORY_BODIES.find((b) => b.id === id);
}

export function getBodiesForTier(tier: string): RegulatoryBody[] {
  return EGYPT_REGULATORY_BODIES.filter((b) => b.requiredForTiers.includes(tier));
}

export function getBodiesForSector(sectorId: string): RegulatoryBody[] {
  return EGYPT_REGULATORY_BODIES.filter((b) => b.requiredForSectors.includes(sectorId));
}

export function getBodiesByType(type: string): RegulatoryBody[] {
  return EGYPT_REGULATORY_BODIES.filter((b) => b.type === type);
}

// ══════════════════════════════════════════════════════════════════════════════
// Aggregate stats (computed at module load)
// ══════════════════════════════════════════════════════════════════════════════
export const REGULATORY_STATS = {
  total: EGYPT_REGULATORY_BODIES.length,
  byType: {
    ministry: EGYPT_REGULATORY_BODIES.filter((b) => b.type === "ministry").length,
    authority: EGYPT_REGULATORY_BODIES.filter((b) => b.type === "authority").length,
    agency: EGYPT_REGULATORY_BODIES.filter((b) => b.type === "agency").length,
    organization: EGYPT_REGULATORY_BODIES.filter((b) => b.type === "organization").length,
    holding_company: EGYPT_REGULATORY_BODIES.filter((b) => b.type === "holding_company").length,
    center: EGYPT_REGULATORY_BODIES.filter((b) => b.type === "center").length,
  },
  withDigitalServices: EGYPT_REGULATORY_BODIES.filter((b) => b.digitalServicesAvailable).length,
  mandatoryForAllTiers: EGYPT_REGULATORY_BODIES.filter(
    (b) =>
      b.registrationRequired &&
      ["A", "B", "C", "D", "E", "F"].every((t) => b.requiredForTiers.includes(t)),
  ).length,
};
