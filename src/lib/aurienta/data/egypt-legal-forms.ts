// AURIENTA — Egyptian Legal Forms Database
// ═══════════════════════════════════════════════════════════════════════
// Comprehensive registry of all Egyptian legal entity types relevant
// to AURIENTA tiers (A through F). Each form is mapped to:
//   - Primary governing law (with article citation)
//   - Constitutional tier eligibility (which tiers can adopt it)
//   - Minimum paid-in capital (statutory)
//   - Shareholder limits (min/max)
//   - Liability regime (limited / unlimited / mixed)
//   - Capital-market eligibility (can it list on EGX?)
//   - Statutory auditor & escrow (law-firm client account) requirements
//   - GAFI / SCZone / Cooperatives Authority registration
//   - Corporate tax rate & VAT registration threshold
//   - Governance requirements (board composition, audit committee, etc.)
//   - Registration fee & lead time
//
// Primary sources:
//   - Companies Law No. 159/1981 (as amended by Law 17/2018)
//   - Investment Law No. 72/2017 (Unified Investment Law)
//   - Commercial Register Law No. 34/1976
//   - Civil Code No. 131/1948 (Civil Companies)
//   - Civil Work Law No. 149/2019 (Foundations & Associations)
//   - Cooperatives Law No. 109/1975 + Unified Cooperatives Law 2020
//   - SCZone Law No. 83/2019 (Suez Canal Economic Zone)
//   - Income Tax Law No. 91/2005 (corporate tax 22.5%)
//   - VAT Law No. 67/2016 (14% standard rate)
//   - GAFI Egypt 2024 Investment Report — registration statistics
//   - World Bank Doing Business — Egypt historical data
//
// All figures reflect 2024-2025 statutory requirements. Capital minimums
// are paid-in (issued) capital, not authorized capital.
// ═══════════════════════════════════════════════════════════════════════

export type LegalForm = {
  id: string;
  nameEn: string;
  nameAr: string;
  lawRef: string; // Egyptian law citation
  aurentaTier: string[]; // applicable tiers A-F
  minCapitalEgp: number; // minimum statutory paid-in capital
  minShareholders: number;
  maxShareholders: number | null; // null = unlimited
  liabilityType: "limited" | "unlimited" | "mixed";
  canGoPublic: boolean; // eligible for EGX listing?
  requiresAuditor: boolean;
  requiresLawFirm: boolean; // escrow (law-firm client account) required?
  requiresGafiRegistration: boolean;
  taxRate: number; // corporate tax rate %
  vatRegistered: boolean;
  governanceRequirements: string[];
  registrationFeeEgp: number;
  registrationTimeDays: number;
  publishedInGazette: boolean; // Al-Waqa'i'a al-Misriyya
  description: string;
};

// ── The 15 Egyptian legal forms relevant to AURIENTA tiers ─────────────

export const EGYPT_LEGAL_FORMS: LegalForm[] = [
  // 1 ── Sole Proprietorship ──────────────────────────────────────────────
  {
    id: "sole_proprietorship",
    nameEn: "Sole Proprietorship",
    nameAr: "منشأة فردية",
    lawRef: "Commercial Law 17/1999 (Code of Commerce) Art. 1-30 + Civil Code 131/1948",
    aurentaTier: ["A"],
    minCapitalEgp: 1_000,
    minShareholders: 1,
    maxShareholders: 1,
    liabilityType: "unlimited",
    canGoPublic: false,
    requiresAuditor: false,
    requiresLawFirm: false,
    requiresGafiRegistration: true,
    taxRate: 22.5, // commercial activities; personal income tax for small traders
    vatRegistered: false, // optional — only if annual turnover > EGP 500,000
    governanceRequirements: [
      "Commercial Register entry",
      "Tax card from Egyptian Tax Authority (ETA)",
      "Social insurance registration if employees ≥ 1",
    ],
    registrationFeeEgp: 1_050,
    registrationTimeDays: 3,
    publishedInGazette: true,
    description:
      "Single-owner commercial establishment. Simplest legal form; owner bears unlimited personal liability for all business debts. Ideal for Tier A micro-enterprises and individual traders.",
  },

  // 2 ── Civil Company ────────────────────────────────────────────────────
  {
    id: "civil_company",
    nameEn: "Civil Company",
    nameAr: "شركة مدنية",
    lawRef: "Civil Code 131/1948 Art. 505-540 (Civil Partnerships)",
    aurentaTier: ["A", "B"],
    minCapitalEgp: 5_000,
    minShareholders: 2,
    maxShareholders: 50,
    liabilityType: "unlimited",
    canGoPublic: false,
    requiresAuditor: false,
    requiresLawFirm: true, // typically established via law firm for partnership deed
    requiresGafiRegistration: true,
    taxRate: 22.5,
    vatRegistered: false,
    governanceRequirements: [
      "Notarized partnership agreement",
      "Syndicate registration for licensed professions (lawyers, doctors, engineers)",
      "Commercial Register entry",
      "Annual tax filing (ETA Form 41 للأشخاص الاعتبارية)",
    ],
    registrationFeeEgp: 500,
    registrationTimeDays: 7,
    publishedInGazette: true,
    description:
      "Partnership of licensed professionals (lawyers, doctors, engineers, accountants) jointly practising their profession. Joint and several unlimited liability. Cannot conduct commercial activities — restricted to professional services.",
  },

  // 3 ── Limited Liability Company (LLC) ─────────────────────────────────
  {
    id: "llc",
    nameEn: "Limited Liability Company (LLC)",
    nameAr: "شركة ذات مسؤولية محدودة",
    lawRef: "Companies Law 159/1981 Art. 1-39 (as amended by Law 17/2018)",
    aurentaTier: ["A", "B", "C", "D", "E", "F"],
    minCapitalEgp: 50_000,
    minShareholders: 2,
    maxShareholders: 50,
    liabilityType: "limited",
    canGoPublic: false, // LLCs cannot offer shares to the public
    requiresAuditor: true,
    requiresLawFirm: true, // formation via law firm strongly recommended
    requiresGafiRegistration: true,
    taxRate: 22.5,
    vatRegistered: true, // mandatory if turnover > EGP 500,000
    governanceRequirements: [
      "Notarized Articles of Association (عقد التأسيس)",
      "Manager(s) — at least one appointed manager",
      "Annual audited financial statements (registered auditor)",
      "Annual General Assembly meeting",
      "Commercial Register + Tax card + Social insurance",
      "GAFI company file (commercial registration number)",
    ],
    registrationFeeEgp: 5_500,
    registrationTimeDays: 10,
    publishedInGazette: true,
    description:
      "Most common Egyptian corporate vehicle. Liability limited to each partner's capital contribution. Cannot issue negotiable shares or offer equity to the public — for public listing it must convert to JSC. Maximum 50 partners.",
  },

  // 4 ── Joint Stock Company (JSC) ────────────────────────────────────────
  {
    id: "jsc",
    nameEn: "Joint Stock Company (JSC)",
    nameAr: "شركة مساهمة مصرية",
    lawRef: "Companies Law 159/1981 Art. 76-148 (as amended by Law 17/2018)",
    aurentaTier: ["F"],
    minCapitalEgp: 1_000_000, // 250K closed / 1M public offering
    minShareholders: 3,
    maxShareholders: null,
    liabilityType: "limited",
    canGoPublic: true, // eligible for EGX listing
    requiresAuditor: true,
    requiresLawFirm: true,
    requiresGafiRegistration: true,
    taxRate: 22.5,
    vatRegistered: true,
    governanceRequirements: [
      "Notarized Articles of Association & Statutes",
      "Board of Directors (min 3, max 11 directors)",
      "Independent directors ≥ 1/3 of board (FRA Code of Governance)",
      "Audit Committee (≥ 3 directors, majority independent)",
      "Annual audited financial statements (registered auditor)",
      "Annual General Assembly of shareholders",
      "Quarterly financial disclosures to GAFI (if listed: to EGX/FRA)",
      "Egyptian Corporate Governance Code (OECD-aligned) compliance",
    ],
    registrationFeeEgp: 12_000,
    registrationTimeDays: 60,
    publishedInGazette: true,
    description:
      "Public-listing-capable corporate vehicle. Minimum issued capital EGP 250,000 (closed JSC) or EGP 1,000,000 (public offering). Tier F graduation target — required for EGX listing and for any public equity raise. Subject to FRA disclosure rules.",
  },

  // 5 ── General Partnership ──────────────────────────────────────────────
  {
    id: "general_partnership",
    nameEn: "General Partnership",
    nameAr: "شركة تضامن",
    lawRef: "Companies Law 159/1981 Art. 21-42",
    aurentaTier: ["A", "B"],
    minCapitalEgp: 5_000,
    minShareholders: 2,
    maxShareholders: 20,
    liabilityType: "unlimited",
    canGoPublic: false,
    requiresAuditor: true,
    requiresLawFirm: true,
    requiresGafiRegistration: true,
    taxRate: 22.5,
    vatRegistered: true,
    governanceRequirements: [
      "Notarized partnership deed",
      "Joint & several unlimited liability of all partners",
      "Trade name registration",
      "Annual audited financial statements",
      "Consensus or 2/3 majority for major decisions",
    ],
    registrationFeeEgp: 2_500,
    registrationTimeDays: 10,
    publishedInGazette: true,
    description:
      "Oldest form of partnership. All partners bear joint and several unlimited personal liability for partnership debts. Partners are jointly managing the business unless the deed provides otherwise. Rare in modern Egyptian practice — used mainly for family businesses and traditional trading houses.",
  },

  // 6 ── Limited Partnership ──────────────────────────────────────────────
  {
    id: "limited_partnership",
    nameEn: "Limited Partnership",
    nameAr: "شركة توصية بسيطة",
    lawRef: "Companies Law 159/1981 Art. 43-50",
    aurentaTier: ["A", "B", "C"],
    minCapitalEgp: 10_000,
    minShareholders: 2, // 1 general + 1 limited
    maxShareholders: 50,
    liabilityType: "mixed", // general = unlimited, limited = limited
    canGoPublic: false,
    requiresAuditor: true,
    requiresLawFirm: true,
    requiresGafiRegistration: true,
    taxRate: 22.5,
    vatRegistered: true,
    governanceRequirements: [
      "Notarized partnership deed specifying general vs limited partners",
      "At least 1 general partner with unlimited liability",
      "At least 1 limited partner (capital contribution only, no management authority)",
      "Limited partners cannot participate in management (loss of limited status if they do)",
      "Annual audited financial statements",
    ],
    registrationFeeEgp: 2_500,
    registrationTimeDays: 10,
    publishedInGazette: true,
    description:
      "Hybrid partnership with both general (unlimited liability, manages business) and limited (limited to capital contribution, passive) partners. Common for family offices and professional services firms accepting outside investors without giving them management authority.",
  },

  // 7 ── Holding Company ──────────────────────────────────────────────────
  {
    id: "holding_company",
    nameEn: "Holding Company",
    nameAr: "شركة قابضة",
    lawRef: "Investment Law 72/2017 Art. 4 + Companies Law 159/1981 Art. 76-148",
    aurentaTier: ["F"],
    minCapitalEgp: 5_000_000,
    minShareholders: 3,
    maxShareholders: null,
    liabilityType: "limited",
    canGoPublic: true,
    requiresAuditor: true,
    requiresLawFirm: true,
    requiresGafiRegistration: true,
    taxRate: 22.5,
    vatRegistered: false, // typically no own trading activity → not VAT-registered
    governanceRequirements: [
      "Structured as JSC (always)",
      "Minimum EGP 5M paid-in capital",
      "Board of Directors (min 5, with independent directors)",
      "Audit Committee + Risk Committee mandatory",
      "Annual consolidated audited financial statements",
      "Quarterly reports to FRA on subsidiary performance",
      "Compliance with FRA Holding Company Code (Decree 107/2018)",
      "Disclosure of ultimate beneficial owner (UBO)",
    ],
    registrationFeeEgp: 50_000,
    registrationTimeDays: 60,
    publishedInGazette: true,
    description:
      "JSC whose primary activity is owning ≥ 51% of shares in one or more operating subsidiaries. Required minimum capital EGP 5,000,000. Must register as a holding company with FRA. Used for group consolidation, tax optimization, and EGX listing of holding entity separately from operating companies.",
  },

  // 8 ── SPV (Special Purpose Vehicle) ─────────────────────────────────────
  {
    id: "spv",
    nameEn: "Special Purpose Vehicle (SPV)",
    nameAr: "شركة ذات غرض خاص",
    lawRef: "Companies Law 159/1981 Art. 1-39 (LLC-structured) or Art. 76-148 (JSC-structured)",
    aurentaTier: ["E", "D", "F"],
    minCapitalEgp: 50_000,
    minShareholders: 1, // can be a One-Person Company
    maxShareholders: 50,
    liabilityType: "limited",
    canGoPublic: false, // by definition a single-purpose vehicle
    requiresAuditor: true,
    requiresLawFirm: true, // mandatory for SPV formation per AURIENTA escrow protocol
    requiresGafiRegistration: true,
    taxRate: 22.5,
    vatRegistered: false,
    governanceRequirements: [
      "Articles restricting activities to the specific SPV purpose",
      "Independent director (recommended for bankruptcy-remote structures)",
      "Annual audited financial statements",
      "Segregated bank account (no commingling with parent)",
      "FRA notification if issuing securities",
    ],
    registrationFeeEgp: 5_500,
    registrationTimeDays: 20,
    publishedInGazette: true,
    description:
      "Single-purpose subsidiary structured as LLC or JSC, used for project finance, securitization, M&A ring-fencing, and university spinouts (Tier E). Bankruptcy-remote: SPV insolvency does not propagate to parent. Common for AURIENTA graduation bond issuance.",
  },

  // 9 ── Branch of Foreign Company ─────────────────────────────────────────
  {
    id: "foreign_branch",
    nameEn: "Branch of Foreign Company",
    nameAr: "فرع شركة أجنبية",
    lawRef: "Investment Law 72/2017 Art. 50 + Companies Law 159/1981 Art. 368-373",
    aurentaTier: ["B", "C", "D", "E", "F"],
    minCapitalEgp: 15_000, // effective setup; no statutory minimum but practical floor
    minShareholders: 1, // foreign parent
    maxShareholders: 1,
    liabilityType: "limited", // parent's liability is limited to branch assets in practice
    canGoPublic: false,
    requiresAuditor: true,
    requiresLawFirm: true,
    requiresGafiRegistration: true,
    taxRate: 22.5, // + 10% branch remittance tax on after-tax profits repatriated = effective 32.5% (tax treaties may reduce)
    vatRegistered: true,
    governanceRequirements: [
      "FRA approval to operate in Egypt (for financial services)",
      "GAFI commercial register entry for branch",
      "Annual audited financial statements (Egyptian branch only)",
      "Annual General Authority for Investment (GAFI) renewal",
      "Disclosure of parent company audited financials",
      "Appointment of Egyptian-resident branch manager",
    ],
    registrationFeeEgp: 5_000,
    registrationTimeDays: 45,
    publishedInGazette: true,
    description:
      "Egyptian branch of a foreign legal entity. Subject to Egyptian law on all Egypt-source activities. Cannot issue equity locally but parent can be listed abroad. Branch remittance tax (10%) applies on top of corporate tax when profits are repatriated — reduced under double-taxation treaties (e.g., Netherlands, UK, Mauritius).",
  },

  // 10 ── Free Zone Company ───────────────────────────────────────────────
  {
    id: "free_zone_company",
    nameEn: "Free Zone Company",
    nameAr: "شركة منطقة حرة",
    lawRef: "Investment Law 72/2017 + SCZone Law 83/2019",
    aurentaTier: ["C", "D", "E", "F"],
    minCapitalEgp: 1_000_000, // ~$20K USD equivalent minimum for public free zone
    minShareholders: 2,
    maxShareholders: 50,
    liabilityType: "limited",
    canGoPublic: false, // cannot list directly but parent can
    requiresAuditor: true,
    requiresLawFirm: true,
    requiresGafiRegistration: true, // via SCZone Authority
    taxRate: 0, // 0% on exports; 5% on domestic sales (special SCZone rate)
    vatRegistered: false, // exports zero-rated; domestic sales subject to VAT
    governanceRequirements: [
      "SCZone Authority approval (board resolution)",
      "Environmental impact assessment (EEAA)",
      "Annual audited financial statements (registered auditor)",
      "Annual SCZone operating report",
      "Customs clearance compliance (free-zone customs regime)",
      "Minimum 70% of output exported (public free zone rule)",
    ],
    registrationFeeEgp: 50_000,
    registrationTimeDays: 60,
    publishedInGazette: true,
    description:
      "Company established inside a public or private Free Zone (SCZone, East Port Said, Ain Sokhna, Damietta). Enjoys 0% corporate tax on exports and 5% on domestic sales. Cannot serve the domestic market freely — must export ≥ 70% of production. Capital minimum ~$20K USD equivalent for public free zones.",
  },

  // 11 ── Offshore Company ────────────────────────────────────────────────
  {
    id: "offshore_company",
    nameEn: "Offshore Company (Investment Free Zone)",
    nameAr: "شركة استثمار في المناطق الحرة",
    lawRef: "Investment Law 72/2017 Art. 53 + Executive Regulations Art. 96-101",
    aurentaTier: ["E", "F"],
    minCapitalEgp: 2_500_000, // ~$50K USD equivalent
    minShareholders: 1,
    maxShareholders: null,
    liabilityType: "limited",
    canGoPublic: false,
    requiresAuditor: true,
    requiresLawFirm: true,
    requiresGafiRegistration: true,
    taxRate: 0, // fully exempt on foreign-source income
    vatRegistered: false,
    governanceRequirements: [
      "Cannot conduct business within Egyptian domestic market",
      "Annual audited financial statements (English language acceptable)",
      "Annual GAFI renewal + SCZone fee",
      "Disclosure of ultimate beneficial owner (UBO)",
      "Egyptian-resident agent mandatory (Article 96 ER)",
      "Bank account at Egyptian bank in foreign currency",
    ],
    registrationFeeEgp: 25_000, // ~$500 USD equivalent
    registrationTimeDays: 60,
    publishedInGazette: false,
    description:
      "Special offshore entity under Investment Law Art. 53 — incorporated in Egypt but conducts all business abroad. Fully tax-exempt on foreign-source income. Used by multinational groups for holding IP, finance subsidiaries, and regional treasury operations. Cannot serve Egyptian customers.",
  },

  // 12 ── One-Person Company ──────────────────────────────────────────────
  {
    id: "one_person_company",
    nameEn: "One-Person Company",
    nameAr: "شركة شخص واحد",
    lawRef: "Companies Law 159/1981 Art. 4 bis (introduced by Law 17/2018)",
    aurentaTier: ["A", "B", "C"],
    minCapitalEgp: 50_000,
    minShareholders: 1,
    maxShareholders: 1,
    liabilityType: "limited",
    canGoPublic: false,
    requiresAuditor: true,
    requiresLawFirm: false, // simpler formation, can be self-filed via GAFI portal
    requiresGafiRegistration: true,
    taxRate: 22.5,
    vatRegistered: false, // only if turnover > EGP 500,000
    governanceRequirements: [
      "Single shareholder (natural or legal person)",
      "Sole director (can be the shareholder)",
      "Annual audited financial statements",
      "Separation of company assets from personal assets (piercing the corporate veil on commingling)",
      "Annual shareholder resolution (sole shareholder)",
    ],
    registrationFeeEgp: 5_500,
    registrationTimeDays: 10,
    publishedInGazette: true,
    description:
      "Single-shareholder limited-liability vehicle introduced by the 2018 Companies Law amendment. Combines LLC liability protection with sole-proprietorship simplicity. Cannot have more than one shareholder — if a second shareholder joins, must convert to LLC within 90 days. Popular with solo founders and wholly-owned subsidiaries.",
  },

  // 13 ── Cooperative Society ──────────────────────────────────────────────
  {
    id: "cooperative_society",
    nameEn: "Cooperative Society",
    nameAr: "جمعية تعاونية",
    lawRef: "Cooperatives Law 109/1975 + Unified Cooperatives Law 2020 (Law 20/2022)",
    aurentaTier: ["A", "B", "C", "D"],
    minCapitalEgp: 10_000,
    minShareholders: 10, // founding members
    maxShareholders: null,
    liabilityType: "limited",
    canGoPublic: false,
    requiresAuditor: true,
    requiresLawFirm: false,
    requiresGafiRegistration: false, // registered with Cooperatives Authority, not GAFI
    taxRate: 0, // cooperative activities tax-exempt under Income Tax Law 91/2005 Art. 30
    vatRegistered: false, // cooperative member transactions exempt; commercial activities taxed
    governanceRequirements: [
      "General Assembly of all members (1 member = 1 vote, regardless of capital)",
      "Board of Directors elected by General Assembly (min 5 members)",
      "Annual audited financial statements (registered auditor)",
      "Cooperatives Authority registration + annual reporting",
      "Profit distribution capped (50% to reserves, 10% to social fund, 40% to members)",
    ],
    registrationFeeEgp: 1_500,
    registrationTimeDays: 45,
    publishedInGazette: true,
    description:
      "Member-owned cooperative operating on democratic 1-member-1-vote principle. Tax-exempt on cooperative activities (member transactions). Subject to Unified Cooperatives Law 2022 reform. Common in agriculture (vegetable growers), consumer retail (consumer cooperatives), and housing.",
  },

  // 14 ── Foundation / NGO ────────────────────────────────────────────────
  {
    id: "foundation_ngo",
    nameEn: "Foundation / NGO",
    nameAr: "مؤسسة / جمعية",
    lawRef: "Civil Work Law 149/2019",
    aurentaTier: ["A", "B", "C", "D", "E"],
    minCapitalEgp: 50_000, // endowment capital for foundation (single governorate)
    minShareholders: 1, // for foundation; 10 for association
    maxShareholders: null,
    liabilityType: "limited",
    canGoPublic: false,
    requiresAuditor: true,
    requiresLawFirm: true, // escrow of endowment capital via law firm recommended
    requiresGafiRegistration: false, // registered with Ministry of Solidarity
    taxRate: 0, // civil work activities tax-exempt; commercial activities taxed at 22.5%
    vatRegistered: false,
    governanceRequirements: [
      "Founding deed registered with Ministry of Solidarity",
      "Board of Trustees (min 3, max 11)",
      "Annual audited financial statements",
      "Annual activity report to Ministry of Solidarity",
      "Foreign-funding notification (30-day notice for any foreign contribution)",
      "Endowment capital preserved (only income spent on activities)",
    ],
    registrationFeeEgp: 1_000,
    registrationTimeDays: 60,
    publishedInGazette: true,
    description:
      "Civil society entity under Civil Work Law 149/2019. Foundations (مؤسسة) can be established by a single founder with EGP 50,000 endowment (single governorate) or EGP 250,000 (multi-governorate). Associations (جمعية) require 10 founding members. Tax-exempt on civil work activities; commercial activities subject to standard corporate tax.",
  },

  // 15 ── Société Anonyme Égyptienne (S.A.E.) ──────────────────────────────
  {
    id: "sae",
    nameEn: "Société Anonyme Égyptienne (S.A.E.)",
    nameAr: "شركة مساهمة مصرية",
    lawRef: "Companies Law 159/1981 Art. 76-148 (identical to JSC; 'S.A.E.' is the historical French term retained in bilingual contracts)",
    aurentaTier: ["F"],
    minCapitalEgp: 1_000_000,
    minShareholders: 3,
    maxShareholders: null,
    liabilityType: "limited",
    canGoPublic: true,
    requiresAuditor: true,
    requiresLawFirm: true,
    requiresGafiRegistration: true,
    taxRate: 22.5,
    vatRegistered: true,
    governanceRequirements: [
      "Identical to JSC requirements (see id: 'jsc')",
      "Bilingual Articles of Association (Arabic + French/English)",
      "Board of Directors (min 3, max 11)",
      "Annual audited financial statements",
      "Annual General Assembly",
    ],
    registrationFeeEgp: 12_000,
    registrationTimeDays: 60,
    publishedInGazette: true,
    description:
      "Historical French-language designation for the Joint Stock Company (JSC). Equivalent in every respect to id 'jsc' — same legal regime under Companies Law 159/1981 Art. 76-148. The 'S.A.E.' label is retained in legacy bilingual contracts, joint-venture agreements with French-speaking partners, and historical EGX listings. AURIENTA treats 'jsc' and 'sae' as the same legal form with two accepted identifiers for international compatibility.",
  },
];

// ── Lookup helpers ──────────────────────────────────────────────────────

export function getLegalFormById(id: string): LegalForm | undefined {
  return EGYPT_LEGAL_FORMS.find((f) => f.id === id);
}

export function getLegalFormsByTier(tier: string): LegalForm[] {
  return EGYPT_LEGAL_FORMS.filter((f) => f.aurentaTier.includes(tier));
}

export function getLegalFormsByLiability(
  liabilityType: string
): LegalForm[] {
  return EGYPT_LEGAL_FORMS.filter(
    (f) => f.liabilityType === liabilityType
  );
}

export function getLegalFormsByLawRef(lawRefSubstring: string): LegalForm[] {
  return EGYPT_LEGAL_FORMS.filter((f) =>
    f.lawRef.toLowerCase().includes(lawRefSubstring.toLowerCase())
  );
}

export function getPublicListingEligibleForms(): LegalForm[] {
  return EGYPT_LEGAL_FORMS.filter((f) => f.canGoPublic);
}

// ── Aggregate statistics ─────────────────────────────────────────────────

function countByTier(tier: string): number {
  return EGYPT_LEGAL_FORMS.filter((f) => f.aurentaTier.includes(tier)).length;
}

export const LEGAL_FORM_STATS = {
  total: EGYPT_LEGAL_FORMS.length,
  byTier: {
    A: countByTier("A"),
    B: countByTier("B"),
    C: countByTier("C"),
    D: countByTier("D"),
    E: countByTier("E"),
    F: countByTier("F"),
  },
  withLimitedLiability: EGYPT_LEGAL_FORMS.filter(
    (f) => f.liabilityType === "limited"
  ).length,
  withUnlimitedLiability: EGYPT_LEGAL_FORMS.filter(
    (f) => f.liabilityType === "unlimited"
  ).length,
  withMixedLiability: EGYPT_LEGAL_FORMS.filter(
    (f) => f.liabilityType === "mixed"
  ).length,
  withPublicListing: EGYPT_LEGAL_FORMS.filter((f) => f.canGoPublic).length,
  withGafiRegistration: EGYPT_LEGAL_FORMS.filter(
    (f) => f.requiresGafiRegistration
  ).length,
  requiringLawFirmEscrow: EGYPT_LEGAL_FORMS.filter(
    (f) => f.requiresLawFirm
  ).length,
  requiringAuditor: EGYPT_LEGAL_FORMS.filter(
    (f) => f.requiresAuditor
  ).length,
  averageRegistrationDays: Math.round(
    EGYPT_LEGAL_FORMS.reduce((s, f) => s + f.registrationTimeDays, 0) /
      Math.max(1, EGYPT_LEGAL_FORMS.length)
  ),
  highestMinCapitalEgp: Math.max(
    ...EGYPT_LEGAL_FORMS.map((f) => f.minCapitalEgp)
  ),
  lowestMinCapitalEgp: Math.min(
    ...EGYPT_LEGAL_FORMS.map((f) => f.minCapitalEgp)
  ),
};
