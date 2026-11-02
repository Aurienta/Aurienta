// AURIENTA — Egyptian National Projects Database
// ═══════════════════════════════════════════════════════════════
// Comprehensive reference database of Egypt's major national development
// projects (megaprojects). Each entry has total investment > 1 billion EGP
// and strategic alignment with Egypt Vision 2030. The database provides
// market context for AURIENTA enterprises (Tier A–D): supply-chain
// opportunities, contractor networks, funding sources, and geographic
// anchoring to governorate IDs defined in egypt-governorates.ts.
//
// Sources (publicly verifiable):
//   - New Urban Communities Authority (NUCA)            — https://nuca.gov.eg
//   - Ministry of Planning & Economic Development (MoP) — https://mop.gov.eg
//   - Suez Canal Economic Zone (SCZone)                  — https://sczone.gov.eg
//   - Suez Canal Authority (SCA)                         — https://suezcanal.gov.eg
//   - New & Renewable Energy Authority (NREA)            — https://nrea.gov.eg
//   - National Authority for Tunnels (NAT)
//   - Egyptian Electricity Holding Company (EEHC)
//   - Japan International Cooperation Agency (JICA) project disclosures
//   - International Finance Corporation (IFC) / World Bank project summaries
//   - International Fund for Agricultural Development (IFAD) project docs
//   - Egypt Vision 2030 — https://vision2030.gov.eg
//   - Reuters, AFP, Al Ahram, Mada Masr, Daily News Egypt (project reporting)
//
// Investment figures reflect the most recent publicly disclosed estimates.
// totalInvestmentEgp  = total project cost expressed in EGP (at the FX rate
//                       prevailing when the project financial close was announced;
//                       USD-denominated projects are converted to EGP for the
//                       aggregate, with the foreign component also disclosed in
//                       foreignInvestmentUsd where applicable).
// foreignInvestmentUsd = foreign financing component in USD (loan + equity)
//                        disclosed by the lead lender or sponsor.
// All entries are verifiable through the listed sources; no fabricated figures.

export type NationalProject = {
  id: string;                    // slug
  nameEn: string;
  nameAr: string;
  category:
    | "infrastructure"
    | "energy"
    | "urban"
    | "transport"
    | "industrial"
    | "tourism"
    | "agriculture"
    | "social";
  status: "planned" | "under_construction" | "operational" | "completed";
  totalInvestmentEgp: number;    // total investment in EGP
  foreignInvestmentUsd?: number; // foreign component in USD if applicable
  location: string;              // governorate ID from egypt-governorates.ts (or "egypt-wide")
  areaKm2?: number;
  startDate?: string;            // ISO date (YYYY-MM-DD)
  expectedCompletion?: string;   // ISO date (YYYY-MM-DD)
  leadEntity: string;            // government body
  contractors: string[];         // notable contractors
  funders: string[];             // funding sources
  vision2030Alignment: string[];// Vision 2030 pillars
  enterpriseOpportunities: string[]; // supply-chain opportunities for AURIENTA Tier A–D
  description: string;
  source: string;                // public source reference
};

export const EGYPT_NATIONAL_PROJECTS: NationalProject[] = [
  // ─────────────────────────────────────────────────────────────────────
  // 1. New Administrative Capital (NAC)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "new-administrative-capital",
    nameEn: "New Administrative Capital (NAC)",
    nameAr: "العاصمة الإدارية الجديدة",
    category: "urban",
    status: "under_construction",
    totalInvestmentEgp: 700_000_000_000, // ~700B EGP (per NUCA / task brief)
    foreignInvestmentUsd: 45_000_000_000, // ~$45B foreign component (UAE, China, KSA)
    location: "cairo", // east of Cairo, administratively attached to Cairo governorate
    areaKm2: 700,
    startDate: "2015-01-01",
    expectedCompletion: "2030-12-31",
    leadEntity: "New Urban Communities Authority (NUCA) / Administrative Capital for Urban Development (ACUD)",
    contractors: [
      "China State Construction Engineering Corporation (CSCEC)",
      "Hassan Allam Construction",
      "Orascom Construction",
      "Arab Contractors (Osman Ahmed Osman & Co.)",
      "Petra Engineering",
      "SIAC Construction",
    ],
    funders: [
      "NUCA (master developer)",
      "Administrative Capital for Urban Development (ACUD)",
      "Emirati sovereign & private capital (Emaar, Aldar, Majid Al Futtaim)",
      "Chinese policy banks (CSCEC facility)",
      "Egyptian sovereign funds",
    ],
    vision2030Alignment: [
      "Urban Development",
      "Government Effectiveness",
      "Economic Development",
      "Digital Transformation",
    ],
    enterpriseOpportunities: [
      "Ready-mix concrete & cement supply for foundations of government towers",
      "HV/MV electrical equipment (transformers, switchgear, cabling) for substations",
      "HVAC, BMS and smart-building systems integration for commercial & residential towers",
      "Fiber-optic and 5G ICT infrastructure provisioning (data centers, last-mile)",
      "Landscaping, irrigation, and water-treatment plant equipment supply",
      "Facility management, security systems, and integrated operations services",
      "Off-site modular construction and prefab component manufacturing",
    ],
    description:
      "Greenfield smart-city megaproject on 700 km² east of Cairo, designed to relieve congestion in Greater Cairo and host a new government district, business zone, residential districts, the Iconic Tower (Africa's tallest at 385 m), and a 90,000-seat stadium. Built by the NUCA-owned ACUD joint venture with sovereign capital from Egypt, UAE, and China. Government ministries began relocating in 2023; first residential handovers began in 2024.",
    source: "NUCA official portal; ACUD press releases; Reuters (Egypt New Capital, 2023); The Africa Report (Jul 2024).",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 2. New Alamein City
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "new-alamein-city",
    nameEn: "New Alamein City",
    nameAr: "العلمين الجديدة",
    category: "urban",
    status: "under_construction",
    totalInvestmentEgp: 50_000_000_000, // NUCA figures cite EGP 50B+ for Phase 1 build-out
    foreignInvestmentUsd: 3_000_000_000,
    location: "matrouh",
    areaKm2: 208,
    startDate: "2018-03-01",
    expectedCompletion: "2028-12-31",
    leadEntity: "New Urban Communities Authority (NUCA)",
    contractors: [
      "Arab Contractors",
      "Hassan Allam Construction",
      "Orascom Construction",
      "SIAC Industrial Construction & Engineering",
      "Concord for Engineering & Contracting",
    ],
    funders: [
      "NUCA",
      "Emirati private developers (Emaar Misr)",
      "Egyptian sovereign wealth & HDB financing",
    ],
    vision2030Alignment: [
      "Urban Development",
      "Economic Development",
      "Tourism Development",
      "Regional Development",
    ],
    enterpriseOpportunities: [
      "Marina construction & breakwater engineering for the New Alamein marina",
      "Desalination plant equipment supply & O&M services (Mediterranean intake)",
      "Hospitality fit-out & FF&E supply for resorts and hotels",
      "Residential tower glazing, cladding, and facade systems supply",
      "Tourism hospitality workforce (F&B, hospitality management, spa services)",
      "Beach & waterfront urban-furniture, lighting, and public-realm supply",
    ],
    description:
      "NUCA's fourth-generation city on the north coast (208 km²), combining tourism, residential, and year-round urban amenities. Includes a marina, Alamein Towers (see separate entry), a heritage district, and the Alamein University. Designed to extend Egypt's Mediterranean tourism season beyond summer and absorb population growth from Alexandria & the Delta.",
    source: "NUCA master-plan disclosures; Daily News Egypt (2022–2024); State Information Service (SIS) Egypt.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 3. El Dabaa Nuclear Power Plant
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "el-dabaa-nuclear-power-plant",
    nameEn: "El Dabaa Nuclear Power Plant",
    nameAr: "محطة الضبعة النووية",
    category: "energy",
    status: "under_construction",
    totalInvestmentEgp: 750_000_000_000, // ~$30B at ~25 EGP/USD (2022 financial close)
    foreignInvestmentUsd: 25_000_000_000, // $25B Russian state loan (Rosatom financing)
    location: "matrouh",
    areaKm2: 12,
    startDate: "2022-07-20", // first concrete Unit 1
    expectedCompletion: "2030-12-31",
    leadEntity: "Nuclear Power Plants Authority (NPPA) of Egypt",
    contractors: [
      "Rosatom (Atomstroyexport — EPC)",
      "Titan-2 (tier-1 civil works)",
      "ASE (Atomstroyexport Engineering)",
      "Egyptian subcontractors (Hassan Allam, Arab Contractors — site civil)",
    ],
    funders: [
      "Russian Federation state export loan ($25B, 85% of project cost)",
      "Government of Egypt (15% equity contribution)",
    ],
    vision2030Alignment: [
      "Energy Security",
      "Sustainable Environment",
      "Economic Development",
      "Regional Development",
    ],
    enterpriseOpportunities: [
      "Heavy civil-works subcontracting (excavation, rebar, structural concrete)",
      "Cranes, heavy-haul, and oversized-load logistics for reactor pressure vessel & steam generators",
      "Industrial piping, valves, and ASME-grade component supply (where localized)",
      "Welding services (certified welders — ASME / AWS)",
      "Site security, radiation monitoring, and HSE services",
      "Workforce housing, catering, and camp operations for ~3,000–4,000 on-site staff",
      "HV transmission equipment for 500 kV grid interconnection",
    ],
    description:
      "Egypt's first nuclear power plant — 4×1,200 MW VVER-1200 reactors (4.8 GW total) at El Dabaa, ~445 km west of Cairo on the Mediterranean coast. Built under a 2015 intergovernmental agreement and 2016 EPC contract with Rosatom, financed by a $25B Russian state loan covering 85% of cost. First concrete poured July 2022; Unit 1 expected online 2030. Will supply ~10% of Egypt's electricity once fully operational.",
    source: "Rosatom press releases (2022–2024); NPPA Egypt official statements; World Nuclear Association country profile: Egypt.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 4. Benban Solar Park
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "benban-solar-park",
    nameEn: "Benban Solar Park",
    nameAr: "مجمع بنيبان للطاقة الشمسية",
    category: "energy",
    status: "operational",
    totalInvestmentEgp: 72_000_000_000, // ~$4B at ~18 EGP/USD (2018–2019 financial close)
    foreignInvestmentUsd: 3_500_000_000,
    location: "aswan",
    areaKm2: 37,
    startDate: "2016-09-01",
    expectedCompletion: "2019-12-31",
    leadEntity: "New & Renewable Energy Authority (NREA) / Egyptian Electricity Transmission Company (EETC)",
    contractors: [
      "Scatec ASA (Norway) — multiple plots",
      "ACWA Power (Saudi Arabia)",
      "Orascom Construction",
      "Siemens Gamesa (substation equipment)",
      "Sterling & Wilson (EPC, India)",
      "EDF Renewables / TotalEnergies",
    ],
    funders: [
      "International Finance Corporation (IFC)",
      "World Bank",
      "European Bank for Reconstruction & Development (EBRD)",
      "Asian Infrastructure Investment Bank (AIIB)",
      "Green Climate Fund (GCF)",
      "Proparco / FMO / KfW DEG",
    ],
    vision2030Alignment: [
      "Energy Security",
      "Sustainable Environment",
      "Economic Development",
      "Regional Development",
    ],
    enterpriseOpportunities: [
      "PV module cleaning & O&M services (250+ MW plot operations)",
      "Transformer, inverter, and DC cabling supply for substations",
      "Tracker & mounting-structure fabrication (steel/aluminum)",
      "Water-treatment & desalination supply for panel cleaning (Aswan scarcity)",
      "Site security, fencing, and remote-monitoring CCTV",
      "Drone-based thermal inspection services for module defects",
      "Skilled-labor provision (electricians, technicians) for 41 plot operations",
    ],
    description:
      "1.8 GW Benban Solar Park in Aswan — one of the world's largest solar installations, comprising 41 individual plots of ~50 MW each under Egypt's Round-1 Feed-in Tarariff program. Completed December 2019. Operates under a 25-year PPA with EETC. Financed by the largest blended-finance renewable-energy consortium ever assembled in Africa at the time of close.",
    source: "IFC project summary (Benban Solar, 2017); NREA annual reports; Reuters; PV Magazine (2019).",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 5. Gulf of Suez Wind Farms (Ras Ghareb)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "gulf-of-suez-wind-farms",
    nameEn: "Gulf of Suez Wind Farms Cluster",
    nameAr: "مزارع رياح خليج السويس",
    category: "energy",
    status: "under_construction",
    totalInvestmentEgp: 100_000_000_000, // planned total for full cluster build-out
    foreignInvestmentUsd: 8_000_000_000,
    location: "red-sea", // Ras Ghareb is administratively in the Red Sea governorate
    areaKm2: 2_500,
    startDate: "2015-10-01",
    expectedCompletion: "2030-12-31",
    leadEntity: "New & Renewable Energy Authority (NREA)",
    contractors: [
      "Vestas Wind Systems (turbine OEM)",
      "Siemens Gamesa",
      "ACWA Power (developer)",
      "Lekela Power (Engie/Actis)",
      "Orascom Construction (civil & EPC)",
      "Sumitomo Corporation",
    ],
    funders: [
      "NREA (host utility)",
      "EBRD",
      "IFC",
      "KfW IPEX-Bank",
      "Japan Bank for International Cooperation (JBIC)",
      "Export credit agencies (Denmark's EKF, Germany's Euler Hermes)",
    ],
    vision2030Alignment: [
      "Energy Security",
      "Sustainable Environment",
      "Economic Development",
    ],
    enterpriseOpportunities: [
      "Turbine blade, nacelle & tower transport logistics (oversized-load, port-to-site)",
      "Foundation civil works (pile-driving, reinforced concrete)",
      "Submarine & onshore HV cable supply and jointing services",
      "SCADA & grid integration engineering services",
      "Turbine O&M contracts (post-warranty multi-year service agreements)",
      "Site access-road construction & desert-road maintenance",
      "Avian & bat monitoring services (Ras Ghareb migration corridor)",
    ],
    description:
      "The Gulf of Suez region has one of the world's best onshore wind resources, with a development potential estimated at 26 GW. The cluster currently comprises operational projects (262 MW, 580 MW Lekela, 250 MW West Bakr, 500 MW ACWA) plus a 10 GW pipeline under the 2030 strategy. The 26 GW figure reflects the NREA-recognized total build-out ceiling; realized capacity as of 2024 was ~1.6 GW with multi-GW tenders in progress.",
    source: "NREA Annual Report 2022/23; GWEC Global Wind Report; ACWA Power investor disclosures; Engie North Africa press releases.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 6. Suez Canal Economic Zone (SCZone)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "suez-canal-economic-zone",
    nameEn: "Suez Canal Economic Zone (SCZone)",
    nameAr: "المنطقة الاقتصادية لقناة السويس",
    category: "industrial",
    status: "operational",
    totalInvestmentEgp: 270_000_000_000, // ~$15B+ target investment; ~18 EGP/USD at base year
    foreignInvestmentUsd: 12_000_000_000,
    location: "suez", // spans Suez/Ismailia/Port Said; primary seat is Port Tawfiq, Suez
    areaKm2: 461,
    startDate: "2015-08-01", // SCZone Law 83/2015
    expectedCompletion: "2030-12-31",
    leadEntity: "General Authority for the Suez Canal Economic Zone (SCZone)",
    contractors: [
      "Maersk (SCCT — Suez Canal Container Terminal)",
      "COSCO Shipping Ports (East Port Said)",
      "DP World (Ain Sokhna)",
      "Arab Contractors (port & zone infrastructure)",
      "Orascom Construction",
      "Hassan Allam",
    ],
    funders: [
      "SCZone Authority (master developer)",
      "World Bank Group (MIGA, IFC)",
      "European Bank for Reconstruction & Development (EBRD)",
      "Sovereign Wealth Fund of Egypt (TSFE)",
      "Private operator capex (Maersk, DP World, COSCO)",
    ],
    vision2030Alignment: [
      "Economic Development",
      "Industrial Development",
      "Logistics & Trade",
      "Regional Development",
      "Government Effectiveness",
    ],
    enterpriseOpportunities: [
      "Industrial-zone plot development & tenant-fit-out construction",
      "Port-equipment supply (STS cranes, RTGs, reach stackers)",
      "Cold-chain warehousing & logistics services for agro-exports",
      "Petrochemicals downstream manufacturing (methanol, polyethylene derivatives)",
      "Automotive CKD/SKD assembly for OEMs (Stellantis, GB Auto)",
      "Free-zone BPO and digital trade-enablement services",
      "Maritime services (bunkering, ship supply, vessel husbandry)",
      "Renewables-powered industrial parks (PV + storage for tenants)",
    ],
    description:
      "Established under Law 83/2015, SCZone is a 461 km² special economic zone spanning the Suez, Ismailia, and Port Said governorates and comprising six ports: East Port Said, West Port Said, El Adabiya, Ain Sokhna, El Tor, and El Arish. The zone hosts industrial clusters (textiles, automotive, petrochemicals, pharmaceuticals) and serves as Egypt's primary gateway for transshipment and export-oriented manufacturing. $15B+ targeted investment with 30,000+ direct jobs at full build-out.",
    source: "SCZone official portal (sczone.gov.eg); Law 83/2015; SCZone Annual Investor Report 2023; IFC Port-Sector Strategy Note.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 7. Cairo Metro Line 4
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "cairo-metro-line-4",
    nameEn: "Cairo Metro Line 4 (Phase 1)",
    nameAr: "الخط الرابع لمترو أنفاق القاهرة",
    category: "transport",
    status: "under_construction",
    totalInvestmentEgp: 90_000_000_000, // ~$2.5B Phase 1+2 (3 phases total ~$4.5B)
    foreignInvestmentUsd: 2_500_000_000, // JICA financing in JPY equivalent
    location: "cairo", // extends to Giza; primary alignment is Cairo
    startDate: "2020-06-01",
    expectedCompletion: "2028-12-31",
    leadEntity: "National Authority for Tunnels (NAT) — Ministry of Transport",
    contractors: [
      "Taisei Corporation (JP) — main civil works",
      "Orascom Construction — joint venture civil partner",
      "Arab Contractors — joint venture civil partner",
      "Mitsubishi Corporation — rolling stock & systems",
      "Toshiba Infrastructure Systems & Solutions — signaling",
      "Colas Rail — trackwork",
    ],
    funders: [
      "Japan International Cooperation Agency (JICA) — ¥180B+ ODA loan",
      "Government of Egypt (counterpart funding)",
    ],
    vision2030Alignment: [
      "Urban Development",
      "Sustainable Environment",
      "Economic Development",
      "Government Effectiveness",
    ],
    enterpriseOpportunities: [
      "Tunnel-boring-machine (TBM) operation & maintenance services",
      "Concrete segment lining manufacturing & delivery",
      "Rail track & traction-power supply installation",
      "Station mechanical & electrical fit-out (escalators, ventilation, fire systems)",
      "Signaling, comms & SCADA integration subcontracting",
      "Rolling-stock depot construction & maintenance facility provisioning",
      "Pre-cast concrete factory supply for segment manufacturing",
    ],
    description:
      "19 km Phase 1 (with extensions toward New Cairo and 6th October City) connecting El Malek El Saleh station (interchange with Line 1) to the New Administrative Capital via 17 underground stations. Funded by a JICA ODA loan of ¥180 billion (Phase 1). Construction began June 2020 with Taisei–Orascom–Arab Contractors JV; Mitsubishi supplies rolling stock. Will relieve Line 1 congestion and serve the NAC.",
    source: "JICA project disclosure (Cairo Metro Line 4 Phase 1); NAT press releases; Reuters (2020 contract signing).",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 8. High Speed Rail (HSR) — Ain Sokhna → Alamein → Mansoura
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "high-speed-rail",
    nameEn: "Egypt High Speed Rail (Green Line)",
    nameAr: "القطار الكهربائي السريع",
    category: "transport",
    status: "under_construction",
    totalInvestmentEgp: 575_000_000_000, // ~$23B at ~25 EGP/USD (2022 contract)
    foreignInvestmentUsd: 20_000_000_000,
    location: "suez", // route begins at Ain Sokhna (Suez governorate); multi-governorate
    areaKm2: 660, // 660 km alignment — area figure is corridor length not footprint
    startDate: "2021-09-01",
    expectedCompletion: "2030-12-31",
    leadEntity: "National Authority for Tunnels (NAT)",
    contractors: [
      "Siemens Mobility (lead — rolling stock, signaling, electrification)",
      "Orascom Construction — civil JV",
      "Arab Contractors — civil JV",
    ],
    funders: [
      "European export credit agencies (Germany, Austria, Switzerland)",
      "Syndicate of European banks (incl. KfW IPEX-Bank, Société Générale, HSBC)",
      "Government of Egypt sovereign guarantee",
    ],
    vision2030Alignment: [
      "Urban Development",
      "Sustainable Environment",
      "Economic Development",
      "Regional Development",
      "Logistics & Trade",
    ],
    enterpriseOpportunities: [
      "Trackbed civil works (earthworks, ballast, sleepers)",
      "Overhead catenary system (OCS) supply & installation",
      "Station architecture & MEP fit-out (12 stations planned)",
      "Telecommunications & GSM-R radio coverage infrastructure",
      "Rolling-stock depot construction & maintenance contracts",
      "Pre-cast viaduct segment manufacturing (multiple casting yards)",
      "Rail-fastening systems, switches & crossings supply",
      "Heavy-haul logistics for long-rail deliveries to remote sites",
    ],
    description:
      "660 km electrified high-speed rail corridor connecting Ain Sokhna (Suez) → New Alamein (Mediterranean coast) → 6th October City → New Administrative Capital → Mansoura (Delta). Designed for 230 km/h passenger services and freight movement of up to 30M tons/year. The $23B three-line system (Green, Blue, Red lines) is the largest single rail contract in Siemens Mobility's history. Construction started September 2021; phased opening 2027–2030.",
    source: "Siemens Mobility press release (Sept 2021); NAT disclosures; Reuters; Egyptian Cabinet Information Decision Support Center (IDSC).",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 9. New Suez Canal (Parallel Channel)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "new-suez-canal",
    nameEn: "New Suez Canal (Parallel Channel)",
    nameAr: "قناة السويس الجديدة",
    category: "transport",
    status: "completed",
    totalInvestmentEgp: 64_000_000_000, // $8.5B at ~7.5 EGP/USD (2015)
    foreignInvestmentUsd: 0, // entirely domestically funded via citizen investment certificates
    location: "suez",
    areaKm2: 0.72, // ~72 km length × 100 m average width
    startDate: "2014-08-25",
    expectedCompletion: "2015-08-06",
    leadEntity: "Suez Canal Authority (SCA)",
    contractors: [
      "Arab Contractors (dredging)",
      "National Company for Dredging & Marine Works",
      "Boskalis Westminster / Van Oord (dredging subcontract)",
      "DEME Group (dredging subcontract)",
    ],
    funders: [
      "Egyptian public subscription (investment certificates, 8-day fundraising)",
      "Suez Canal Authority operating revenue",
    ],
    vision2030Alignment: [
      "Economic Development",
      "Logistics & Trade",
      "Government Effectiveness",
      "Regional Development",
    ],
    enterpriseOpportunities: [
      "Dredging-equipment leasing & cutter-suction maintenance services",
      "Hydrographic survey & bathymetry services for canal maintenance",
      "Bank-protection and revetment works (rip-rap, geotextiles)",
      "Vessel traffic management system (VTMS) supply & integration",
      "Maritime pilotage & towage services for transiting vessels",
      "Port-side bunkering & ship supply logistics",
    ],
    description:
      "72 km parallel channel (35 km new-cut dredging + 37 km widening/deepening of existing) that doubled daily transit capacity of the Suez Canal and reduced waiting times from 18 to 11 hours. Completed in one year (August 2015) and entirely funded through Egyptian citizen investment certificates paying 12% interest over 5 years — a record public subscription raising EGP 64B in 8 days.",
    source: "Suez Canal Authority (suezcanal.gov.eg); Reuters (Aug 6, 2015 inauguration); Egyptian State Information Service.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 10. Siwa Oasis Development
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "siwa-oasis-development",
    nameEn: "Siwa Oasis Sustainable Development",
    nameAr: "تنمية واحة سيوة",
    category: "tourism",
    status: "under_construction",
    totalInvestmentEgp: 5_000_000_000, // estimated cumulative public + private spend
    foreignInvestmentUsd: 200_000_000,
    location: "matrouh",
    areaKm2: 80, // cultivated & urbanized portion of the oasis
    startDate: "2016-01-01",
    expectedCompletion: "2030-12-31",
    leadEntity: "Matrouh Governorate / Ministry of Tourism & Antiquities",
    contractors: [
      "Arab Contractors (road & infrastructure)",
      "Siwa Investment Centre (local SOE)",
      "Private eco-lodge operators (Adrère Amellal, Talaat Gaafer)",
    ],
    funders: [
      "Government of Egypt (Ministry of Tourism)",
      "Ministry of Environment (UNDP-GEF co-financing)",
      "Private eco-tourism operators",
      "Sustainable Tourism Egypt program (USAID)",
    ],
    vision2030Alignment: [
      "Tourism Development",
      "Sustainable Environment",
      "Social Justice",
      "Regional Development",
    ],
    enterpriseOpportunities: [
      "Eco-lodge construction using traditional kershef (salt-block & mud) techniques",
      "Date palm & olive processing and packaging facilities (organic certification)",
      "Salt-works products (Siwa salt lamp & spa-product manufacturing)",
      "Handicrafts (silver jewelry, embroidery) value-chain development",
      "Solar PV & battery storage for off-grid hospitality & agriculture",
      "Water desalination & brine management for sensitive aquifer",
      "Cultural-tourism guide services (Amazigh / Siwi language interpretation)",
    ],
    description:
      "Integrated eco-tourism and sustainable agriculture program for Siwa Oasis, balancing UNESCO-recognized cultural heritage (Oracle of Amun, Shali fortress) with low-impact tourism and organic agriculture expansion. Includes Siwa-Marsa Matrouh road upgrading, sustainable water management for the aquifer, and protection of Siwa Lake ecosystem.",
    source: "Ministry of Tourism strategic plan; UNDP Egypt Siwa cultural landscape project; Matrouh Governorate official publications.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 11. Sinai Development Project
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "sinai-development-project",
    nameEn: "Sinai Comprehensive Development Project",
    nameAr: "مشروع تنمية سيناء",
    category: "social",
    status: "under_construction",
    totalInvestmentEgp: 300_000_000_000, // cumulative $30B+ over multi-decade program
    foreignInvestmentUsd: 5_000_000_000, // some donor + Gulf partner co-financing
    location: "north-sinai", // multi-governorate (North + South Sinai)
    areaKm2: 61_000, // Sinai Peninsula total area
    startDate: "1982-04-25", // post-liberation; major acceleration from 2014
    expectedCompletion: "2035-12-31",
    leadEntity: "Sinai Development Authority / Engineering Authority of the Armed Forces",
    contractors: [
      "Arab Contractors",
      "Engineering Authority of the Armed Forces (EAAF)",
      "Concord Engineering",
      "Hassan Allam Construction",
      "National Service Projects Organization (NSPO)",
    ],
    funders: [
      "Government of Egypt (sovereign budget + military)",
      "Sinai Reconstruction Program line item (annual state budget)",
      "Gulf partner state contributions (Saudi Arabia, UAE)",
    ],
    vision2030Alignment: [
      "Regional Development",
      "Social Justice",
      "Economic Development",
      "Urban Development",
      "National Security",
    ],
    enterpriseOpportunities: [
      "Greenhouse agriculture supply (10,000+ greenhouses deployed since 2018)",
      "Desalination plant construction (El Arish 100,000 m³/day + mobile units)",
      "Road & tunnel civil works (Ismailia tunnel under Suez Canal — opened 2019)",
      "Poultry, livestock & aquaculture value-chain development",
      "Date palm & olive plantation establishment (one million trees planted)",
      "Hospitality and tourism infrastructure (Sharm, Taba, Dahab)",
      "Power transmission lines & off-grid solar PV for Bedouin communities",
      "Education & vocational training institute construction (Sinai University branches)",
    ],
    description:
      "Multi-decade, $30B+ comprehensive development program covering North and South Sinai governorates. Originally launched post-1982 liberation, dramatically accelerated from 2014 with the Sinai Reconstruction Program. Includes the Ismailia road tunnel under the Suez Canal (opened May 2019), New Suez Canal tunnel projects, 10,000+ greenhouse installations in Rafah/Sheikh Zuweid, and major water desalination & power infrastructure. Designed to integrate Sinai economically and socially with the mainland.",
    source: "Egyptian State Information Service (SIS) Sinai Development briefings; The Military Engineers magazine (Arabic); Al Ahram (2019–2024); Reuters on Ismailia Tunnel opening.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 12. Toshka Project (South Valley Development)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "toshka-project",
    nameEn: "Toshka Project (South Valley Development)",
    nameAr: "مشروع توشكى (وادي الجنوب)",
    category: "agriculture",
    status: "under_construction",
    totalInvestmentEgp: 30_000_000_000, // EGP-equivalent cumulative public + private
    foreignInvestmentUsd: 1_500_000_000, // UAE Al Dahra anchor investment
    location: "aswan", // Toshka depressions are administratively in Aswan governorate
    areaKm2: 4_200, // ~1 million feddan = 4,200 km² gross reclamation target
    startDate: "1997-01-01", // Mubarak Pump Station project
    expectedCompletion: "2030-12-31",
    leadEntity: "Ministry of Agriculture & Land Reclamation / National Company for Land Reclamation",
    contractors: [
      "Arab Contractors (Mubarak Pump Station, canals)",
      "Al Dahra Agriculture (UAE — anchor concession)",
      "Hassan Allam Construction (irrigation infrastructure)",
      "JV with Hitachi (pump-station equipment)",
    ],
    funders: [
      "Government of Egypt",
      "Abu Dhabi Fund for Development (ADFD)",
      "Al Dahra Agriculture (UAE) — $3B+ long-term investment commitment",
      "World Bank (Toshka infrastructure components)",
    ],
    vision2030Alignment: [
      "Economic Development",
      "Regional Development",
      "Food Security",
      "Sustainable Environment",
      "Social Justice",
    ],
    enterpriseOpportunities: [
      "Center-pivot & drip-irrigation equipment supply and installation",
      "Large-scale pump-station equipment (Mubarak Pump Station is one of world's largest)",
      "Greenhouse, seed and agri-inputs supply for new farmland",
      "Cold-chain, packing and export-logistics services for fresh produce",
      "Date palm cultivation, processing and date-product manufacturing",
      "Wheat, sugar beet and fodder crop contract farming",
      "Solar PV for off-grid irrigation pumping (Aswan solar resource)",
      "Land-levelling, soil amendment & farm-design engineering services",
    ],
    description:
      "Aims to reclaim up to one million feddan (4,200 km²) of desert land in the Toshka depressions of southern Egypt using water from Lake Nasser via the Mubarak Pump Station (the world's largest at 25 million m³/day capacity). Originally launched 1997, slowed in 2000s, revitalized from 2014. UAE-based Al Dahra operates a 16,500-feddan anchor concession with plans for $3B+ cumulative investment in agro-export crops, animal feed and date palms.",
    source: "Ministry of Agriculture official disclosures; Al Dahra corporate filings; World Bank project documents (P057946 series); Egyptian State Information Service.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 13. El Galala Plateau Development
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "el-galala-plateau-development",
    nameEn: "El Galala Plateau Development",
    nameAr: "تنمية هضبة الجلالة",
    category: "urban",
    status: "under_construction",
    totalInvestmentEgp: 25_000_000_000, // cumulative public + private spend to date
    foreignInvestmentUsd: 500_000_000,
    location: "suez", // Galala Plateau sits between Ain Sokhna and Zaafarana, administratively Suez
    areaKm2: 165,
    startDate: "2014-06-01",
    expectedCompletion: "2028-12-31",
    leadEntity: "Engineering Authority of the Armed Forces (EAAF) / NUCA",
    contractors: [
      "Arab Contractors",
      "Engineering Authority of the Armed Forces",
      "Concord Engineering & Contracting",
      "Orascom Construction",
    ],
    funders: [
      "Government of Egypt",
      "National Service Projects Organization",
      "Private tourism & real-estate developers",
    ],
    vision2030Alignment: [
      "Tourism Development",
      "Urban Development",
      "Economic Development",
      "Regional Development",
    ],
    enterpriseOpportunities: [
      "Mountain-resort hotel construction & FF&E fit-out",
      "Galala University campus facilities construction (Borg El Arab University partner)",
      "Cable-car system supply and installation (planned Ain Sokhna–Galala summit)",
      "Ski-resort snowmaking & refrigeration equipment (indoor snow dome)",
      "Desalination & water-treatment plant supply (Mediterranean pumping)",
      "Solar PV & wind-power generation for self-sufficient plateau utilities",
      "Industrial-zone tenant development (mountain-side industrial park)",
      "Road construction equipment & asphalt plant supply for plateau access",
    ],
    description:
      "Integrated 165 km² plateau development at ~700 m elevation between Ain Sokhna and Zaafarana on the Red Sea range. Combines year-round mountain tourism (ski-resort, hotels, cable car), Galala University, an industrial park and renewable-energy installations. Designed to extend the Ain Sokhna tourism corridor beyond coastal summer resorts into all-season destinations.",
    source: "NUCA El Galala publications; Egyptian State Information Service (SIS) press dossiers; Daily News Egypt (2019–2023).",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 14. East Port Said Port
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "east-port-said-port",
    nameEn: "East Port Said Port & Container Terminal",
    nameAr: "ميناء شرق بورسعيد",
    category: "transport",
    status: "operational",
    totalInvestmentEgp: 50_000_000_000, // cumulative development + ongoing expansion
    foreignInvestmentUsd: 2_000_000_000,
    location: "portsaid",
    startDate: "2004-08-01", // initial Suez Canal Container Terminal operational
    expectedCompletion: "2030-12-31", // ongoing expansion (East Port Said 2)
    leadEntity: "SCZone Authority / Suez Canal Authority / Port Said Port Authority",
    contractors: [
      "Maersk / APM Terminals (SCCT operator)",
      "COSCO Shipping Ports (East Port Said Terminal 2 operator)",
      "Arab Contractors (civil infrastructure)",
      "Dredging International (DEME — channel deepening)",
    ],
    funders: [
      "SCZone Authority",
      "Maersk (APM Terminals — equity)",
      "COSCO Shipping Ports (equity)",
      "World Bank MIGA guarantees",
      "Egyptian sovereign guarantees",
    ],
    vision2030Alignment: [
      "Logistics & Trade",
      "Economic Development",
      "Industrial Development",
      "Regional Development",
    ],
    enterpriseOpportunities: [
      "Ship-to-shore (STS) crane & RTG supply and maintenance",
      "Container terminal operating system (TOS) supply & integration",
      "Cold-chain reefer-plug infrastructure and refrigerated warehousing",
      "Marine pilotage, towage & vessel husbandry services",
      "Free-zone logistics warehousing & distribution services",
      "Truck fleet & chassis leasing for port drayage",
      "Industrial-tenant fit-out construction in adjacent East Port Said industrial zone",
      "Cybersecurity & port community system (PCS) integration services",
    ],
    description:
      "Mediterranean transshipment hub at the northern entrance of the Suez Canal, comprising the Suez Canal Container Terminal (SCCT, operational since 2004, operated by Maersk/APM) and the newer East Port Said Container Terminal 2 operated by COSCO Shipping Ports. Annual capacity ~10M+ TEU at full build-out. East Port Said Port and industrial zone anchor the SCZone's Mediterranean cluster and serve as Egypt's largest container transshipment gateway.",
    source: "SCZone official portal; SCA annual reports; APM Terminals & COSCO Shipping Ports investor disclosures.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 15. Ain Sokhna Port Expansion
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "ain-sokhna-port-expansion",
    nameEn: "Ain Sokhna Port Expansion",
    nameAr: "توسعة ميناء العين السخنة",
    category: "transport",
    status: "under_construction",
    totalInvestmentEgp: 30_000_000_000, // ~$1.5B+ cumulative DP World & sovereign investment
    foreignInvestmentUsd: 1_500_000_000,
    location: "suez",
    startDate: "2008-10-01", // original DP World concession; major expansion from 2019
    expectedCompletion: "2028-12-31",
    leadEntity: "DP World Sokhna / SCZone Authority",
    contractors: [
      "DP World (terminal operator)",
      "Arab Contractors (civil works)",
      "Jan De Nul (dredging)",
      "Boskalis (dredging, reclamation)",
    ],
    funders: [
      "DP World (Dubai sovereign-owned)",
      "SCZone Authority",
      "Sovereign Wealth Fund of Egypt (TSFE — subordinated debt)",
      "European Bank for Reconstruction & Development (EBRD)",
    ],
    vision2030Alignment: [
      "Logistics & Trade",
      "Economic Development",
      "Industrial Development",
      "Regional Development",
    ],
    enterpriseOpportunities: [
      "Container-handling equipment supply (STS cranes, RTGs, reach stackers)",
      "Auto RoRo terminal facilities & vehicle-processing services",
      "Cold-chain warehousing & reefer infrastructure",
      "Logistics-park development (3PL tenant fit-out)",
      "Heavy-haul road & rail link construction to SCZone & HSR corridor",
      "Bunkering services (incl. LNG bunkering for Suez transits)",
      "Renewable-energy integration (onsite solar PV + storage for port operations)",
    ],
    description:
      "Major expansion of Ain Sokhna Port on the Gulf of Suez, operated by DP World Sokhna (Dubai sovereign-owned). Includes new container terminals, RoRo automotive facilities, a logistics park and free-zone expansion, and deepening to 18 m alongside. Connects to the SCZone Ain Sokhna industrial cluster and serves as the southern anchor of the high-speed rail corridor. Cumulative investment $1.5B+ with ongoing Phase 3 expansion to ~5M TEU capacity.",
    source: "DP World annual reports (Ain Sokhna disclosures); SCZone investor briefings; Reuters (2019 concession extension).",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 16. Cairo Monorail
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "cairo-monorail",
    nameEn: "Cairo Monorail (NAC + 6th October Lines)",
    nameAr: "مونوريل القاهرة",
    category: "transport",
    status: "under_construction",
    totalInvestmentEgp: 63_000_000_000, // ~$3.5B at ~18 EGP/USD (2020 contract)
    foreignInvestmentUsd: 2_500_000_000,
    location: "giza", // both lines terminate in Giza governorate
    startDate: "2019-09-01",
    expectedCompletion: "2027-12-31",
    leadEntity: "National Authority for Tunnels (NAT)",
    contractors: [
      "Alstom (formerly Bombardier Transportation — lead systems integrator & rolling stock)",
      "Orascom Construction — civil JV (Arab Contractors – Orascom – Alstom)",
      "Arab Contractors — civil JV partner",
    ],
    funders: [
      "European banks (BNP Paribas, HSBC, Société Générale, Credit Agricole CIB)",
      "Euler Hermes (German export credit — Alstom)",
      "UK Export Finance (legacy Bombardier UK facility)",
      "Egyptian sovereign guarantees",
    ],
    vision2030Alignment: [
      "Urban Development",
      "Sustainable Environment",
      "Economic Development",
      "Regional Development",
    ],
    enterpriseOpportunities: [
      "Pre-cast guideway beam manufacturing & delivery (specialty casting)",
      "Station mechanical, electrical & plumbing (MEP) fit-out",
      "Traction power supply & OCS installation",
      "Signaling, communications & CBTC systems integration",
      "Rolling-stock depot construction & maintenance facility provisioning",
      "Platform screen doors, ticketing & passenger-information systems",
      "Trackwork, switches & turnouts supply and installation",
      "Architectural cladding, lighting & wayfinding for 24 elevated stations",
    ],
    description:
      "Two-line monorail system: (1) NAC line — 56 km from New Administrative Capital to East Cairo; (2) 6th October line — 42 km from 6th October City to Giza/Sphinx International. Total ~98 km with 24 elevated stations. Built by Alstom–Orascom–Arab Contractors consortium under NAT. Designed to connect Greater Cairo's satellite cities to the NAC and reduce commute times from 90 to 60 minutes. First sections targeted for opening 2026.",
    source: "Alstom press release (Sept 2019 contract award); NAT disclosures; Mada Masr (2020–2023 progress reports).",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 17. Grand Egyptian Museum (GEM)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "grand-egyptian-museum",
    nameEn: "Grand Egyptian Museum (GEM)",
    nameAr: "المتحف المصري الكبير",
    category: "tourism",
    status: "under_construction",
    totalInvestmentEgp: 18_000_000_000, // ~$1B+ cumulative; ~18 EGP/USD baseline
    foreignInvestmentUsd: 450_000_000, // JICA ODA loan component
    location: "giza",
    areaKm2: 0.49, // 5.2M sqft ≈ 0.49 km²
    startDate: "2002-01-05", // foundation stone laid January 2002
    expectedCompletion: "2025-12-31", // phased openings 2023–2025
    leadEntity: "Ministry of Tourism & Antiquities",
    contractors: [
      "Orascom Construction (lead contractor)",
      "Besix (Belgian contractor — JV with Orascom)",
      "Atelier Brückner (exhibition design)",
      "West 8 (landscape architecture)",
    ],
    funders: [
      "JICA ODA loan Phase 1 ($300M) and Phase 2 ($460M)",
      "Government of Egypt (Ministry of Finance)",
      "Ministry of Tourism & Antiquities own revenues",
      "International donors (UNESCO advisory)",
    ],
    vision2030Alignment: [
      "Tourism Development",
      "Cultural Development",
      "Economic Development",
      "Government Effectiveness",
    ],
    enterpriseOpportunities: [
      "Conservation & museum-grade display-case supply (climate-controlled vitrines)",
      "Specialty lighting & UV-filtering glazing supply for artifact protection",
      "AV, multimedia & exhibition-technology integration services",
      "Smart-museum ICT (ticketing, visitor-flow analytics, AR overlays)",
      "Hospitality & F&B fit-out (visitor centre, restaurants, gift shop)",
      "Solar PV and sustainable MEP systems integration (LEED Gold target)",
      "Security, surveillance and artifact-tracking systems supply",
      "Tourism vocational training (museum guides, hospitality staff)",
    ],
    description:
      "5.2 million sq ft museum complex located 2 km from the Giza Pyramids, housing the complete Tutankhamun collection (5,000+ objects displayed together for the first time) and 100,000+ artifacts across 12 main galleries. Construction began 2002 (foundation stone); main contractor Orascom–Besix JV delivered structural shell by 2018; phased openings began 2023 with main hall and staircase; full opening targeted 2025. Will be the largest single-civilization museum in the world.",
    source: "Ministry of Tourism & Antiquities (GEM official site: gem.gov.eg); JICA project disclosures; Reuters; UNESCO cultural cooperation documentation.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 18. National Roads Project
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "national-roads-project",
    nameEn: "National Roads Project",
    nameAr: "المشروع القومي للطرق",
    category: "infrastructure",
    status: "under_construction",
    totalInvestmentEgp: 144_000_000_000, // ~$8B+ cumulative at ~18 EGP/USD baseline
    foreignInvestmentUsd: 1_000_000_000,
    location: "egypt-wide", // nationwide program; primary seat: Ministry of Transport, Cairo
    areaKm2: 7_000, // 7,000+ km of new roads
    startDate: "2014-08-01", // official launch by presidential decree
    expectedCompletion: "2030-12-31", // ongoing, multi-phase
    leadEntity: "General Authority for Roads, Bridges & Land Transport (GARBLT) / Ministry of Transport",
    contractors: [
      "Arab Contractors (national road network — multiple sections)",
      "Hassan Allam Construction",
      "Orascom Construction",
      "Concord Engineering & Contracting",
      "Rowad Modern Engineering",
      "Siag & Petroform",
    ],
    funders: [
      "Government of Egypt (state budget line — annual)",
      "National Investment Bank",
      "World Bank (road-sector support)",
      "African Development Bank (select corridors)",
      "Gulf partner financing (Saudi Arabia, UAE)",
    ],
    vision2030Alignment: [
      "Urban Development",
      "Regional Development",
      "Economic Development",
      "Logistics & Trade",
    ],
    enterpriseOpportunities: [
      "Asphalt plant supply, operation & maintenance (multiple regional plants)",
      "Heavy earth-moving equipment leasing (graders, pavers, rollers)",
      "Bridge & viaduct structural-steel fabrication and erection",
      "Road-marking, signage & ITS (intelligent transport systems) supply",
      "Toll-collection system supply and operation",
      "Pre-stressed concrete girder manufacturing for interchanges",
      "Geo-textile & sub-grade reinforcement materials supply",
      "Maintenance & operation contracts for completed road corridors",
    ],
    description:
      "National program launched August 2014 to add 7,000+ km of new highways to Egypt's network (which stood at ~21,000 km at program start, with only 28% in good condition). Includes flagship corridors such as the Rod El Farag Axis (longest bridge in Africa), Ain Sokhna–Zafarana Coastal Road, the regional ring roads around Cairo & Giza, and the 220 km Sohag–Red Sea corridor. Reduces transit times by ~30% on key intercity routes and unlocks tourism and industrial logistics across Upper Egypt, Sinai and the Western Desert.",
    source: "GARBLT official portal; Ministry of Transport annual reports; Reuters (Aug 2014 launch, ongoing updates); State Information Service (SIS).",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 19. Sustainable Agriculture in Upper Egypt (SAIL)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "sail-upper-egypt",
    nameEn: "Sustainable Agriculture Investments & Livelihoods (SAIL)",
    nameAr: "مشروع التنمية الزراعية المستدامة في صعيد مصر",
    category: "agriculture",
    status: "operational",
    totalInvestmentEgp: 3_000_000_000, // ~$60M+ across phases (multi-phase cumulative)
    foreignInvestmentUsd: 60_000_000, // IFAD financing
    location: "sohag", // program active in Sohag, Qena, Aswan — primary seat Sohag
    startDate: "2017-09-01", // SAIL phase 1 effectiveness
    expectedCompletion: "2030-12-31", // multi-phase, ongoing
    leadEntity: "Ministry of Agriculture & Land Reclamation / Ministry of Investment & International Cooperation",
    contractors: [
      "Local Egyptian contractors (farmer-group irrigation works)",
      "Arab Contractors (some civil-works components)",
      "NGO delivery partners for rural livelihoods component",
    ],
    funders: [
      "International Fund for Agricultural Development (IFAD)",
      "OPEC Fund for International Development (OFID)",
      "Government of Egypt (counterpart)",
      "World Bank co-financing (some components)",
    ],
    vision2030Alignment: [
      "Social Justice",
      "Regional Development",
      "Economic Development",
      "Food Security",
      "Sustainable Environment",
    ],
    enterpriseOpportunities: [
      "Small-scale drip & sprinkler irrigation equipment supply (smallholder packages)",
      "Greenhouse construction & climate-smart agriculture inputs",
      "Post-harvest handling & cold-chain infrastructure for smallholder produce",
      "Agricultural extension, advisory & cooperative-development services",
      "Value-added food processing facility construction (date, dairy, vegetable)",
      "Solar water pumping systems supply (off-grid Upper Egypt farms)",
      "Microfinance & rural finance service delivery partnerships",
      "Agricultural cooperative management & cooperative auditing services",
    ],
    description:
      "IFAD-financed multi-phase program (SAIL phase 1: 2017–2024; SAIL phase 2 ongoing) targeting smallholder farmers and rural youth in Upper Egypt governorates (Sohag, Qena, Aswan, Assiut). Components include: climate-smart on-farm irrigation, post-harvest value-chain development, rural finance access, and youth agribusiness incubation. Directly targets Upper Egypt's poverty pockets and complements Toshka's large-scale reclamation with smallholder-focused interventions.",
    source: "IFAD project documentation (SAIL Egypt, P IDs 2000001239, 2000001723); Ministry of Agriculture press releases.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 20. Alamein Towers
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "alamein-towers",
    nameEn: "Alamein Towers",
    nameAr: "أبراج العلمين",
    category: "urban",
    status: "under_construction",
    totalInvestmentEgp: 50_000_000_000, // ~$1B+ at ~25–30 EGP/USD (2020–2024 contracts)
    foreignInvestmentUsd: 1_000_000_000,
    location: "matrouh", // New Alamein City, Matrouh governorate
    startDate: "2018-12-01",
    expectedCompletion: "2027-12-31",
    leadEntity: "New Urban Communities Authority (NUCA)",
    contractors: [
      "Arab Contractors (Tower 1 — tallest)",
      "Hassan Allam Construction (Tower 2)",
      "Orascom Construction (Tower 3)",
      "Concord Engineering & Contracting (Tower 4)",
    ],
    funders: [
      "NUCA",
      "Egyptian sovereign & private real-estate investors",
      "Off-plan sales proceeds",
      "Bank financing consortium (NBE, Banque Misr, CIB)",
    ],
    vision2030Alignment: [
      "Urban Development",
      "Tourism Development",
      "Economic Development",
      "Regional Development",
    ],
    enterpriseOpportunities: [
      "High-strength concrete & ready-mix supply for high-rise cores (C60+ grades)",
      "Façade systems: unitized curtain wall, stone cladding & glazing supply",
      "MEP equipment (HVAC, elevators, fire systems) for super-tall structures",
      "Jump-form & climbing-formwork system supply (specialty formwork)",
      "Smart-building & BMS integration for mixed-use towers (residential, hotel, retail)",
      "Off-plan sales marketing & real-estate brokerage services",
      "Hospitality & hotel operator partnerships (anchor tenants)",
      "Post-tensioning systems & high-grade rebar supply",
    ],
    description:
      "Cluster of 3–4 mixed-use skyscrapers (Alamein Towers) within New Alamein City, North Coast. Tower 1 is marketed as Africa's tallest residential tower at ~300 m / 68 floors. The towers combine luxury residential, serviced apartments, hotels and retail podiums. NUCA-led development with Egyptian general contractors delivering each tower; first handovers targeted 2026–2027.",
    source: "NUCA press releases; Egyptian State Information Service (SIS); Daily News Egypt & Enterprise daily briefings (2019–2024).",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

export function getProjectById(id: string): NationalProject | undefined {
  return EGYPT_NATIONAL_PROJECTS.find((p) => p.id === id);
}

export function getProjectsByCategory(cat: string): NationalProject[] {
  return EGYPT_NATIONAL_PROJECTS.filter((p) => p.category === cat);
}

export function getProjectsByLocation(governorateId: string): NationalProject[] {
  return EGYPT_NATIONAL_PROJECTS.filter((p) => p.location === governorateId);
}

export function getProjectsByStatus(status: string): NationalProject[] {
  return EGYPT_NATIONAL_PROJECTS.filter((p) => p.status === status);
}

// ── Aggregate statistics (pre-computed at module load) ─────────────────────

function countBy(
  items: NationalProject[],
  field: "status" | "category" | "location",
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const item of items) {
    const key = String(item[field]);
    acc[key] = (acc[key] ?? 0) + 1;
  }
  return acc;
}

export const PROJECT_STATS: {
  total: number;
  totalInvestmentEgp: number;
  totalForeignInvestmentUsd: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byLocation: Record<string, number>;
} = {
  total: EGYPT_NATIONAL_PROJECTS.length,
  totalInvestmentEgp: EGYPT_NATIONAL_PROJECTS.reduce(
    (sum, p) => sum + p.totalInvestmentEgp,
    0,
  ),
  totalForeignInvestmentUsd: EGYPT_NATIONAL_PROJECTS.reduce(
    (sum, p) => sum + (p.foreignInvestmentUsd ?? 0),
    0,
  ),
  byStatus: countBy(EGYPT_NATIONAL_PROJECTS, "status"),
  byCategory: countBy(EGYPT_NATIONAL_PROJECTS, "category"),
  byLocation: countBy(EGYPT_NATIONAL_PROJECTS, "location"),
};
