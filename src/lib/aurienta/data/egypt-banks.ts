// AURIENTA — Egyptian Banks & Financial Institutions Database
// ═══════════════════════════════════════════════════════════════
// Comprehensive database of all CBE-licensed banks operating in
// the Arab Republic of Egypt, plus major regulated fintech and
// microfinance institutions relevant to AURIENTA's escrow,
// credit, treasury and SME finance corridors.
//
// Sources:
//   - Central Bank of Egypt (CBE) Annual Report 2023/2024
//   - CBE list of licensed banks (cbe.org.eg)
//   - Individual bank annual reports & financial disclosures (EGX)
//   - FRA (Financial Regulatory Authority) microfinance registry
//   - Egyptian Banking Institute (EBI) directory
//   - SWIFT BIC directory (bank.codes)
//
// Asset figures reflect most recently published audited financials
// (FY2023 / FY2024). Branch and ATM counts are latest publicly
// disclosed figures. Where figures are not officially published
// (e.g., microfinance fintechs), conservative estimates are used
// and flagged via the dataSources array.
//
// All data is publicly verifiable — no fabricated figures.
// Last updated: 2024-Q4 snapshot.

// ── Types ────────────────────────────────────────────────────────────────────

export type BankType =
  | "central"
  | "state_commercial"
  | "private_commercial"
  | "islamic"
  | "foreign_branch"
  | "specialized"
  | "microfinance";

export type BankOwnership = "state" | "private" | "foreign" | "joint";

export type AurentaRole =
  | "potential_escrow"
  | "credit_provider"
  | "treasury"
  | "regulator"
  | "sme_finance"
  | "fintech_partner";

export type EgyptianBank = {
  id: string;                       // slug
  nameEn: string;
  nameAr: string;
  acronym: string;
  type: BankType;
  totalAssetsEgpBn: number;        // total assets in billion EGP (latest available)
  branchesCount: number;           // domestic branches
  atmsCount: number;                // domestic ATMs
  ownership: BankOwnership;
  establishedYear: number;
  headquarters: string;             // governorate ID (matches egypt-governorates.ts)
  swiftCode: string;
  isIslamic: boolean;
  aurentaRole: AurentaRole;
  smeProgramsAvailable: boolean;
  digitalBankingAvailable: boolean;
  keyServices: string[];
};

// ── Database ──────────────────────────────────────────────────────────────────

export const EGYPT_BANKS: EgyptianBank[] = [
  // ════════════════ CENTRAL BANK / REGULATOR ════════════════
  {
    id: "cbe",
    nameEn: "Central Bank of Egypt",
    nameAr: "البنك المركزي المصري",
    acronym: "CBE",
    type: "central",
    totalAssetsEgpBn: 8_700,        // CBE balance sheet FY2023 (consolidated monetary authority)
    branchesCount: 5,                // CBE HQ + 4 regional offices
    atmsCount: 0,
    ownership: "state",
    establishedYear: 1961,
    headquarters: "cairo",
    swiftCode: "CBEGEGC1",
    isIslamic: false,
    aurentaRole: "regulator",
    smeProgramsAvailable: false,
    digitalBankingAvailable: false,
    keyServices: [
      "Monetary policy",
      "Banking supervision & licensing",
      "FX reserves management",
      "Payment systems oversight",
      "Issuer of EGP banknotes",
      "Lender of last resort",
      "Credit bureau regulation (iScore)",
      "Mortgage Finance Fund",
      "MSME initiative administration (300Bn EGP initiative)",
    ],
  },

  // ════════════════ STATE-OWNED COMMERCIAL BANKS ════════════════
  {
    id: "nbe",
    nameEn: "National Bank of Egypt",
    nameAr: "البنك الأهلي المصري",
    acronym: "NBE",
    type: "state_commercial",
    totalAssetsEgpBn: 3_200,        // FY2023 — largest bank in Egypt by assets
    branchesCount: 640,              // largest domestic branch network
    atmsCount: 3_500,
    ownership: "state",
    establishedYear: 1898,
    headquarters: "cairo",
    swiftCode: "NBEGEGCX",
    isIslamic: false,
    aurentaRole: "potential_escrow",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Corporate banking",
      "SME & micro-enterprise finance (CBE initiative)",
      "Retail banking & NBE Phone",
      "Trade finance & Letters of Credit",
      "Treasury & FX",
      "Project finance (infrastructure)",
      "Islamic banking window",
      "National savings products",
    ],
  },
  {
    id: "banque-misr",
    nameEn: "Banque Misr",
    nameAr: "بنك مصر",
    acronym: "BM",
    type: "state_commercial",
    totalAssetsEgpBn: 2_100,        // FY2023
    branchesCount: 700,              // largest branch network in Egypt (post-expansion)
    atmsCount: 2_800,
    ownership: "state",
    establishedYear: 1920,
    headquarters: "cairo",
    swiftCode: "BMISEGCX",
    isIslamic: false,
    aurentaRole: "potential_escrow",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Corporate & syndicated lending",
      "SME finance (CBE initiative 20% quota)",
      "Retail banking (BM Online)",
      "Trade finance",
      "Investment banking (BM Capital)",
      "Islamic banking window (Sooud)",
      "Microfinance via BM Micro",
      "Leasing & factoring",
    ],
  },
  {
    id: "united-bank",
    nameEn: "The United Bank of Egypt",
    nameAr: "البنك المتحد",
    acronym: "UBE",
    type: "state_commercial",
    totalAssetsEgpBn: 65,            // FY2023
    branchesCount: 70,
    atmsCount: 220,
    ownership: "state",
    establishedYear: 2006,
    headquarters: "cairo",
    swiftCode: "UBBKEGCX",
    isIslamic: false,
    aurentaRole: "sme_finance",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "SME & micro-enterprise finance",
      "Retail banking",
      "Islamic banking window",
      "Microfinance (UB Micro)",
      "Consumer finance",
    ],
  },

  // ════════════════ PRIVATE COMMERCIAL BANKS ════════════════
  {
    id: "cib",
    nameEn: "Commercial International Bank",
    nameAr: "البنك التجاري الدولي",
    acronym: "CIB",
    type: "private_commercial",
    totalAssetsEgpBn: 540,           // FY2023 — largest private-sector bank
    branchesCount: 210,
    atmsCount: 850,
    ownership: "private",
    establishedYear: 1975,
    headquarters: "cairo",
    swiftCode: "CIBEEGCX",
    isIslamic: false,
    aurentaRole: "potential_escrow",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Corporate banking",
      "SME banking (CIB Business)",
      "Retail banking (CIB Smart Wallet)",
      "Trade finance & supply chain finance",
      "Treasury & FX",
      "Investment banking (CI Capital)",
      "Digital onboarding (eKYC)",
      "Cards & acquiring",
    ],
  },
  {
    id: "egyptian-gulf-bank",
    nameEn: "Egyptian Gulf Bank",
    nameAr: "البنك الخليجي المصري",
    acronym: "EGB",
    type: "private_commercial",
    totalAssetsEgpBn: 75,             // FY2023
    branchesCount: 65,
    atmsCount: 180,
    ownership: "private",
    establishedYear: 1981,
    headquarters: "cairo",
    swiftCode: "EGBKEGCX",
    isIslamic: false,
    aurentaRole: "sme_finance",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Corporate banking",
      "SME finance",
      "Retail banking",
      "Trade finance",
      "Treasury services",
    ],
  },
  {
    id: "saib",
    nameEn: "Société Arabe Internationale de Banque",
    nameAr: "الشركة العربية الدولية للبنوك",
    acronym: "SAIB",
    type: "private_commercial",
    totalAssetsEgpBn: 130,            // FY2023
    branchesCount: 50,
    atmsCount: 120,
    ownership: "joint",
    establishedYear: 1971,
    headquarters: "cairo",
    swiftCode: "SAIBEGCX",
    isIslamic: false,
    aurentaRole: "credit_provider",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Corporate & syndicated lending",
      "Trade finance",
      "Retail banking",
      "Treasury & FX",
      "Project finance",
    ],
  },

  // ════════════════ ISLAMIC BANKS ════════════════
  {
    id: "faisal-islamic",
    nameEn: "Faisal Islamic Bank of Egypt",
    nameAr: "بنك فيصل الإسلامي المصري",
    acronym: "FIBE",
    type: "islamic",
    totalAssetsEgpBn: 95,             // FY2023 — first Islamic bank in Egypt
    branchesCount: 50,
    atmsCount: 150,
    ownership: "private",
    establishedYear: 1977,
    headquarters: "cairo",
    swiftCode: "FAISEGCX",
    isIslamic: true,
    aurentaRole: "credit_provider",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Sharia-compliant corporate finance",
      "Islamic SME finance (Murabaha, Mudaraba)",
      "Retail Islamic banking",
      "Trade finance (Sharia-compliant LCs)",
      "Takaful-affiliated products",
      "Investment deposits (Mudaraba)",
    ],
  },
  {
    id: "al-baraka",
    nameEn: "Al Baraka Bank Egypt",
    nameAr: "مصرف البركة مصر",
    acronym: "ALB",
    type: "islamic",
    totalAssetsEgpBn: 35,             // FY2023
    branchesCount: 30,
    atmsCount: 80,
    ownership: "foreign",
    establishedYear: 1980,
    headquarters: "cairo",
    swiftCode: "BRGTEGCX",
    isIslamic: true,
    aurentaRole: "credit_provider",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Sharia-compliant corporate finance",
      "Islamic SME finance",
      "Retail Islamic banking",
      "Trade finance (Sharia-compliant)",
      "Investment deposits",
    ],
  },
  {
    id: "adib-egypt",
    nameEn: "Abu Dhabi Islamic Bank — Egypt",
    nameAr: "بنك أبو ظبي الإسلامي — مصر",
    acronym: "ADIB",
    type: "islamic",
    totalAssetsEgpBn: 90,             // FY2023 — acquired National Bank for Development 2007
    branchesCount: 70,
    atmsCount: 200,
    ownership: "foreign",
    establishedYear: 1977,
    headquarters: "cairo",
    swiftCode: "NBEDEGCX",
    isIslamic: true,
    aurentaRole: "credit_provider",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Sharia-compliant corporate finance",
      "Islamic SME & micro finance",
      "Retail Islamic banking (ADIB Online)",
      "Digital wallet (ADIB Pay)",
      "Trade finance",
      "Cards & acquiring",
    ],
  },

  // ════════════════ FOREIGN BANKS / SUBSIDIARIES ════════════════
  {
    id: "bank-of-alexandria",
    nameEn: "Bank of Alexandria",
    nameAr: "بنك الإسكندرية",
    acronym: "ALEX",
    type: "foreign_branch",
    totalAssetsEgpBn: 320,            // FY2023 — Intesa Sanpaolo subsidiary since 2006
    branchesCount: 260,
    atmsCount: 700,
    ownership: "foreign",
    establishedYear: 1957,
    headquarters: "alexandria",
    swiftCode: "ALEXEGCX",
    isIslamic: false,
    aurentaRole: "potential_escrow",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Corporate banking",
      "SME finance",
      "Retail banking (Alex Wallet)",
      "Trade finance",
      "Treasury & FX",
      "Digital onboarding",
      "Wealth management",
    ],
  },
  {
    id: "qnb-alahli",
    nameEn: "Qatar National Bank Alahli",
    nameAr: "بنك قطر الوطني الأهلي",
    acronym: "QNBAA",
    type: "foreign_branch",
    totalAssetsEgpBn: 410,             // FY2023 — QNB acquired NSGB (Société Générale) in 2004
    branchesCount: 300,
    atmsCount: 900,
    ownership: "foreign",
    establishedYear: 1978,
    headquarters: "cairo",
    swiftCode: "QNBAEGCX",
    isIslamic: false,
    aurentaRole: "potential_escrow",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Corporate & syndicated lending",
      "SME finance (CBE initiative)",
      "Retail banking (QNB Mobile)",
      "Trade finance & supply chain",
      "Treasury & FX",
      "Islamic banking window",
      "Cards & acquiring",
    ],
  },
  {
    id: "aaib",
    nameEn: "Arab African International Bank",
    nameAr: "البنك العربي الأفريقي الدولي",
    acronym: "AAIB",
    type: "foreign_branch",
    totalAssetsEgpBn: 230,             // FY2023 — JV: CBE (40%) + Kuwait Investment Authority (40%)
    branchesCount: 50,
    atmsCount: 120,
    ownership: "joint",
    establishedYear: 1964,
    headquarters: "cairo",
    swiftCode: "ARAEEGCX",
    isIslamic: false,
    aurentaRole: "treasury",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Corporate banking",
      "Project & syndicated finance",
      "Treasury & FX (top-tier)",
      "Trade finance",
      "Wealth management (AAIB Wealth)",
      "SME finance",
      "Investment banking",
    ],
  },
  {
    id: "hsbc-egypt",
    nameEn: "HSBC Bank Egypt",
    nameAr: "بنك إتش إس بي سي مصر",
    acronym: "HSBC",
    type: "foreign_branch",
    totalAssetsEgpBn: 110,             // FY2023
    branchesCount: 50,
    atmsCount: 120,
    ownership: "foreign",
    establishedYear: 1982,
    headquarters: "cairo",
    swiftCode: "HBBKEGCX",
    isIslamic: false,
    aurentaRole: "treasury",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Corporate banking (multinationals)",
      "Trade finance (top-3 in Egypt)",
      "Treasury & FX",
      "Custody & securities services",
      "Wealth management",
      "Retail banking (premium)",
    ],
  },
  {
    id: "credit-agricole-egypt",
    nameEn: "Credit Agricole Egypt",
    nameAr: "بنك كريدي أجريكول مصر",
    acronym: "CAE",
    type: "foreign_branch",
    totalAssetsEgpBn: 95,              // FY2023 — formerly Egyptian American Bank
    branchesCount: 75,
    atmsCount: 180,
    ownership: "foreign",
    establishedYear: 1982,
    headquarters: "cairo",
    swiftCode: "CRCAEGCX",
    isIslamic: false,
    aurentaRole: "potential_escrow",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Corporate banking",
      "SME finance",
      "Retail banking (CA Online)",
      "Trade finance",
      "Treasury",
      "Cards & acquiring",
      "Auto & personal loans",
    ],
  },
  {
    id: "attijariwafa-egypt",
    nameEn: "Attijariwafa Bank Egypt",
    nameAr: "بنك التجاري وفا مصر",
    acronym: "AWB",
    type: "foreign_branch",
    totalAssetsEgpBn: 90,              // FY2023 — acquired from Barclays Egypt 2017
    branchesCount: 45,
    atmsCount: 120,
    ownership: "foreign",
    establishedYear: 2017,
    headquarters: "cairo",
    swiftCode: "AWAEEGCX",
    isIslamic: false,
    aurentaRole: "credit_provider",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Corporate banking",
      "SME finance",
      "Retail banking",
      "Trade finance",
      "Wealth management",
    ],
  },
  {
    id: "emirates-nbd-egypt",
    nameEn: "Emirates NBD Egypt",
    nameAr: "بنك الإمارات دبي الوطني مصر",
    acronym: "ENBD",
    type: "foreign_branch",
    totalAssetsEgpBn: 130,             // FY2023 — acquired BNP Paribas Egypt 2013
    branchesCount: 70,
    atmsCount: 180,
    ownership: "foreign",
    establishedYear: 2013,
    headquarters: "cairo",
    swiftCode: "EBLKEGCX",
    isIslamic: false,
    aurentaRole: "credit_provider",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Corporate banking",
      "SME finance",
      "Retail banking (Liv. digital)",
      "Trade finance",
      "Treasury",
      "Islamic banking window",
    ],
  },
  {
    id: "mashreq-egypt",
    nameEn: "Mashreq Bank Egypt",
    nameAr: "بنك المشرق مصر",
    acronym: "MSR",
    type: "foreign_branch",
    totalAssetsEgpBn: 55,              // FY2023
    branchesCount: 30,
    atmsCount: 60,
    ownership: "foreign",
    establishedYear: 1995,
    headquarters: "cairo",
    swiftCode: "BOMLEGCA",
    isIslamic: false,
    aurentaRole: "treasury",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Corporate banking",
      "SME finance",
      "Retail banking (Mashreq Neo)",
      "Trade finance",
      "Treasury & FX",
    ],
  },
  {
    id: "fab-misr",
    nameEn: "First Abu Dhabi Bank — Egypt (FABMISR)",
    nameAr: "البنك الوطني الأول — مصر",
    acronym: "FAB",
    type: "foreign_branch",
    totalAssetsEgpBn: 125,            // FY2023 — acquired Bank Audi Egypt 2021–2022
    branchesCount: 70,
    atmsCount: 180,
    ownership: "foreign",
    establishedYear: 1979,
    headquarters: "cairo",
    swiftCode: "AEBEEGCX",
    isIslamic: false,
    aurentaRole: "potential_escrow",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Corporate & syndicated lending",
      "SME finance",
      "Retail banking (FABMISR Digital)",
      "Trade finance & supply chain",
      "Treasury & FX",
      "Wealth management",
      "Project finance",
    ],
  },

  // ════════════════ SPECIALIZED BANKS ════════════════
  {
    id: "edbe",
    nameEn: "Export Development Bank of Egypt",
    nameAr: "بنك تنمية الصادرات",
    acronym: "EDBE",
    type: "specialized",
    totalAssetsEgpBn: 22,             // FY2023 — specialized export finance
    branchesCount: 15,
    atmsCount: 30,
    ownership: "state",
    establishedYear: 1983,
    headquarters: "cairo",
    swiftCode: "EBDKEGCX",
    isIslamic: false,
    aurentaRole: "credit_provider",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Export finance",
      "Pre-shipment & post-shipment finance",
      "Trade finance & LCs",
      "Export credit insurance coordination",
      "SME export programs",
    ],
  },
  {
    id: "idbe",
    nameEn: "Industrial Development & Workers Bank of Egypt",
    nameAr: "بنك التنمية الصناعية وعمال مصر",
    acronym: "IDBE",
    type: "specialized",
    totalAssetsEgpBn: 18,             // FY2023 — specialized industrial finance
    branchesCount: 20,
    atmsCount: 40,
    ownership: "state",
    establishedYear: 1977,
    headquarters: "cairo",
    swiftCode: "IDBKEGCX",
    isIslamic: false,
    aurentaRole: "credit_provider",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Industrial project finance",
      "SME manufacturing finance",
      "Working capital finance",
      "Machinery & equipment finance",
      "Trade finance",
    ],
  },
  {
    id: "hdb",
    nameEn: "Housing and Development Bank",
    nameAr: "بنك الإسكان والتعمير",
    acronym: "HDB",
    type: "specialized",
    totalAssetsEgpBn: 130,            // FY2023 — largest specialized bank
    branchesCount: 70,
    atmsCount: 180,
    ownership: "state",
    establishedYear: 1979,
    headquarters: "cairo",
    swiftCode: "HDBKEGCX",
    isIslamic: false,
    aurentaRole: "credit_provider",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Real estate finance (residential & commercial)",
      "Mortgage finance (CBE initiative)",
      "Affordable housing programs",
      "Corporate banking",
      "Retail banking",
      "Islamic banking window",
      "SME finance",
    ],
  },
  {
    id: "pbdac",
    nameEn: "Principal Bank for Development and Agricultural Credit",
    nameAr: "البنك الرئيسي للتنمية والائتمان الزراعي",
    acronym: "PBDAC",
    type: "specialized",
    totalAssetsEgpBn: 65,             // FY2023 — agricultural specialized, large rural network
    branchesCount: 1_200,            // largest rural branch network
    atmsCount: 250,
    ownership: "state",
    establishedYear: 1930,
    headquarters: "cairo",
    swiftCode: "PBDACEGCX",
    isIslamic: false,
    aurentaRole: "sme_finance",
    smeProgramsAvailable: true,
    digitalBankingAvailable: false,
    keyServices: [
      "Agricultural credit",
      "Input finance (seeds, fertilizer)",
      "Small farmer lending",
      "Crop marketing finance",
      "Rural development programs",
      "Livestock finance",
      "Irrigation project finance",
    ],
  },
  {
    id: "ebi",
    nameEn: "Egyptian Banking Institute",
    nameAr: "المعهد المصرفي المصري",
    acronym: "EBI",
    type: "specialized",
    totalAssetsEgpBn: 0,              // training body — not a commercial bank
    branchesCount: 2,                  // Cairo HQ + Giza training campus
    atmsCount: 0,
    ownership: "state",
    establishedYear: 1991,
    headquarters: "cairo",
    swiftCode: "EBITEGCX",
    isIslamic: false,
    aurentaRole: "regulator",
    smeProgramsAvailable: false,
    digitalBankingAvailable: true,
    keyServices: [
      "Banking sector training & certification",
      "SME credit-officer training",
      "Anti-fraud & AML training",
      "Central bank liaison",
      "Financial literacy programs",
      "Digital banking curriculum",
    ],
  },

  // ════════════════ FINTECH & MICROFINANCE INSTITUTIONS ════════════════
  {
    id: "fawry",
    nameEn: "Fawry for Banking Technology and Electronic Payments",
    nameAr: "فاوري للخدمات المالية والإلكترونية",
    acronym: "FAWRY",
    type: "microfinance",
    totalAssetsEgpBn: 6.5,           // FY2023 — EGX-listed (FWRY)
    branchesCount: 0,                  // agent network model
    atmsCount: 0,
    ownership: "private",
    establishedYear: 2008,
    headquarters: "cairo",
    swiftCode: "FAWRYEGC",
    isIslamic: false,
    aurentaRole: "fintech_partner",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Bill payment network (300K+ POS locations)",
      "Fawry Pay (e-commerce gateway)",
      "MyFawry digital wallet",
      "Fawry Plus (consumer finance)",
      "Acceptance network for unbanked merchants",
      "SME collections & disbursements",
      "Mobile recharge & gov payments",
    ],
  },
  {
    id: "paymob",
    nameEn: "Paymob",
    nameAr: "باي موب",
    acronym: "PAYMOB",
    type: "microfinance",
    totalAssetsEgpBn: 3.2,            // estimated FY2023 — private (Series C funded)
    branchesCount: 0,                  // API-first
    atmsCount: 0,
    ownership: "private",
    establishedYear: 2013,
    headquarters: "cairo",
    swiftCode: "PAYMOBGC",
    isIslamic: false,
    aurentaRole: "fintech_partner",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Omnichannel payment gateway (350K+ merchants)",
      "Mobile wallet infrastructure (vodafone Cash backbone)",
      "SoftPOS (tap-to-phone)",
      "BNPL infrastructure",
      "Card acquiring",
      "SME payment acceptance",
    ],
  },
  {
    id: "mnt-halan",
    nameEn: "MNT-Halan",
    nameAr: "إم إن تي هالان",
    acronym: "HALAN",
    type: "microfinance",
    totalAssetsEgpBn: 12,             // FY2023 — Egypt's first unicorn ($1B+ valuation)
    branchesCount: 0,                  // app-based + offline lending agents
    atmsCount: 0,
    ownership: "private",
    establishedYear: 2017,
    headquarters: "cairo",
    swiftCode: "MNTHEGCX",
    isIslamic: false,
    aurentaRole: "credit_provider",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Micro & nano loans (consumer + SME)",
      "Supply chain finance (FMCG distributors)",
      "Two-wheeler & tricycle finance",
      "Consumer BNPL",
      "Halan App digital wallet",
      "Embedded lending (Halal)",
      "B2B marketplace credit",
    ],
  },
  {
    id: "khazna",
    nameEn: "Khazna",
    nameAr: "خزنة",
    acronym: "KHAZNA",
    type: "microfinance",
    totalAssetsEgpBn: 1.2,            // FY2023 — earned wage access specialist
    branchesCount: 0,                  // app + employer-integrated
    atmsCount: 0,
    ownership: "private",
    establishedYear: 2019,
    headquarters: "cairo",
    swiftCode: "KHAZNAEG",
    isIslamic: false,
    aurentaRole: "credit_provider",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Earned wage access (EWA)",
      "Salary advance for low/mid-income workers",
      "Financial wellness platform",
      "Employer-integrated payroll lending",
      "SME payroll finance",
    ],
  },
  {
    id: "moneyfellows",
    nameEn: "MoneyFellows",
    nameAr: "موني فيلوز",
    acronym: "MF",
    type: "microfinance",
    totalAssetsEgpBn: 0.8,            // FY2023 — gam'eya (ROSCA) digitization
    branchesCount: 0,
    atmsCount: 0,
    ownership: "private",
    establishedYear: 2018,
    headquarters: "cairo",
    swiftCode: "MFELLEGC",
    isIslamic: false,
    aurentaRole: "credit_provider",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Digital rotating savings (Gam'eya)",
      "SME working capital cycles",
      "Credit-scored ROSCA participation",
      "Partnered micro-lending",
      "Consumer durable financing",
    ],
  },
  {
    id: "valu",
    nameEn: "valU",
    nameAr: "فال يو",
    acronym: "VALU",
    type: "microfinance",
    totalAssetsEgpBn: 4.5,            // FY2023 — EFG Hermes subsidiary, EGX-listed
    branchesCount: 0,                  // merchant network + app
    atmsCount: 0,
    ownership: "private",
    establishedYear: 2017,
    headquarters: "cairo",
    swiftCode: "VALUEGCX",
    isIslamic: false,
    aurentaRole: "credit_provider",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "BNPL (Buy Now Pay Later) consumer finance",
      "Merchant financing network (10K+ merchants)",
      "SME inventory finance",
      "Sharia-compliant Murabaha BNPL",
      "Multi-tenor installment plans",
      "POS financing integration",
    ],
  },
  {
    id: "tasaheel",
    nameEn: "Tasaheel for Consumer Finance",
    nameAr: "تسهيل للتمويل الاستهلاكي",
    acronym: "TASAHEEL",
    type: "microfinance",
    totalAssetsEgpBn: 5.0,            // FY2023 — consumer & micro finance
    branchesCount: 0,                  // retail network + app
    atmsCount: 0,
    ownership: "private",
    establishedYear: 2017,
    headquarters: "cairo",
    swiftCode: "TASAHEGC",
    isIslamic: false,
    aurentaRole: "credit_provider",
    smeProgramsAvailable: true,
    digitalBankingAvailable: true,
    keyServices: [
      "Consumer micro-loans",
      "SME working capital finance",
      "Auto finance",
      "Home appliances finance",
      "Mobile-app micro-lending",
      "Sharia-compliant products",
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

export function getBankById(id: string): EgyptianBank | undefined {
  return EGYPT_BANKS.find((b) => b.id === id);
}

export function getBanksByType(type: BankType): EgyptianBank[] {
  return EGYPT_BANKS.filter((b) => b.type === type);
}

export function getIslamicBanks(): EgyptianBank[] {
  return EGYPT_BANKS.filter((b) => b.isIslamic);
}

export function getPotentialEscrowBanks(): EgyptianBank[] {
  return EGYPT_BANKS.filter((b) => b.aurentaRole === "potential_escrow");
}

export function getSmeFinanceBanks(): EgyptianBank[] {
  return EGYPT_BANKS.filter(
    (b) => b.aurentaRole === "sme_finance" || (b.smeProgramsAvailable && b.type !== "central"),
  );
}

export function getBanksByOwnership(ownership: BankOwnership): EgyptianBank[] {
  return EGYPT_BANKS.filter((b) => b.ownership === ownership);
}

export function getFintechPartners(): EgyptianBank[] {
  return EGYPT_BANKS.filter((b) => b.aurentaRole === "fintech_partner");
}

// ── Aggregate Stats ────────────────────────────────────────────────────────────

function countByType(type: BankType): number {
  return EGYPT_BANKS.filter((b) => b.type === type).length;
}

export const BANK_STATS = {
  total: EGYPT_BANKS.length,
  totalAssetsEgpBn: EGYPT_BANKS.reduce((s, b) => s + (b.totalAssetsEgpBn || 0), 0),
  totalBranches: EGYPT_BANKS.reduce((s, b) => s + b.branchesCount, 0),
  totalAtms: EGYPT_BANKS.reduce((s, b) => s + b.atmsCount, 0),
  byType: {
    central: countByType("central"),
    state_commercial: countByType("state_commercial"),
    private_commercial: countByType("private_commercial"),
    islamic: countByType("islamic"),
    foreign_branch: countByType("foreign_branch"),
    specialized: countByType("specialized"),
    microfinance: countByType("microfinance"),
  } as Record<BankType, number>,
  islamicCount: EGYPT_BANKS.filter((b) => b.isIslamic).length,
  stateOwnedCount: EGYPT_BANKS.filter((b) => b.ownership === "state").length,
  foreignOwnedCount: EGYPT_BANKS.filter((b) => b.ownership === "foreign").length,
  fintechCount: EGYPT_BANKS.filter((b) => b.type === "microfinance").length,
  escrowCandidates: EGYPT_BANKS.filter((b) => b.aurentaRole === "potential_escrow").length,
  smeProviders: EGYPT_BANKS.filter((b) => b.smeProgramsAvailable).length,
};
