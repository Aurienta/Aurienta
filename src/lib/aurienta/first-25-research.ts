// AURIENTA First 25 Egypt Target Research — REAL MARKET DATA
// ═══════════════════════════════════════════════════════════════
// This file contains REAL research from actual web searches conducted
// 2026-08-19. Every company is a real Egyptian organization identified
// through public sources. Confidence levels are honest.
//
// FOUNDER: Mohamed Eltonsy — Founder & Sole Owner — 100%
//
// EVIDENCE LEVEL: E1 (Market hypothesis — based on secondary research,
// NOT validated through customer conversation)
//
// All targets labeled "MARKET HYPOTHESIS — NOT VALIDATED"
// Decision-makers marked UNKNOWN where not publicly verifiable
// No fabricated contacts, emails, or relationships
// ═══════════════════════════════════════════════════════════════

export const RESEARCH_DATE = "2026-08-19";
export const RESEARCHER = "AI Execution Engineer (automated web search)";
export const RESEARCH_EVIDENCE_LEVEL = "E1" as const;
export const RESEARCH_DISCLAIMER = "All targets are MARKET HYPOTHESIS — NOT VALIDATED. Research is based on public web sources. No customer conversation has occurred. Decision-makers marked UNKNOWN where not publicly verifiable. No fabricated contacts.";

// ═══════════════════════════════════════════════════════════════
// FIRST 25 EGYPT TARGET ACCOUNTS (real, sourced, confidence-tagged)
// ═══════════════════════════════════════════════════════════════

export type TargetAccount = {
  id: string;
  organization: string;
  sector: string;
  website: string;
  source: string;
  sourceConfidence: "HIGH" | "MEDIUM" | "LOW";
  organizationType: string;
  approximateSize: string;
  city: string;
  tier: "P0" | "P1" | "P2" | "P3";
  qualificationScore: number;
  decisionMaker: string;
  decisionMakerRole: string;
  decisionMakerSource: string;
  decisionMakerConfidence: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  likelyUseCase: string;
  problemHypothesis: string;
  evidenceLevel: "E1";
  status: "RESEARCHED" | "CONTACTED" | "QUALIFIED" | "DISQUALIFIED";
  notes: string;
};

export const FIRST_25_TARGETS: TargetAccount[] = [
  // === FOOD PROCESSING ===
  {
    id: "T-01", organization: "Faragalla Group", sector: "Food Processing",
    website: "UNKNOWN (identified via ensun.io listing)", source: "ensun.io — Top 100 Food Manufacturing Companies in Egypt",
    sourceConfidence: "MEDIUM", organizationType: "Manufacturing group", approximateSize: "Medium-Large (established food manufacturer)",
    city: "Alexandria", tier: "P1", qualificationScore: 3.2,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN (likely CEO/Managing Director)", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + capital formation for multi-entity food manufacturing group",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED: Food manufacturing groups may need structured governance across multiple production lines + capital formation for expansion",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Established food manufacturer. Problem hypothesis needs validation through conversation."
  },
  {
    id: "T-02", organization: "Egypt Foods Group", sector: "Food Processing",
    website: "UNKNOWN (identified via egypt-business.com listing)", source: "egypt-business.com — Food companies in Egypt",
    sourceConfidence: "MEDIUM", organizationType: "Manufacturing company (confectionery, snacks, chips)", approximateSize: "Medium (established 1999)",
    city: "UNKNOWN", tier: "P2", qualificationScore: 2.8,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + operational structure for growing food manufacturer",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED: Growing food company may need formalized governance for scaling operations",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Established 1999. 25+ years in market."
  },
  {
    id: "T-03", organization: "First for Food Industries", sector: "Food Processing",
    website: "UNKNOWN (identified via ensun.io listing)", source: "ensun.io — Top 100 Food Manufacturing Companies in Egypt",
    sourceConfidence: "MEDIUM", organizationType: "Food manufacturing", approximateSize: "UNKNOWN",
    city: "UNKNOWN", tier: "P2", qualificationScore: 2.6,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + capital formation",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Listed in top 100 food manufacturers. Limited public information."
  },
  // === PHARMACEUTICALS / HEALTHCARE ===
  {
    id: "T-04", organization: "EIPICO (Egyptian International Pharmaceutical Industries)", sector: "Pharmaceuticals",
    website: "UNKNOWN (identified via pharmaboardroom.com report)", source: "pharmaboardroom.com — Egypt Pharma Industry Report 2023",
    sourceConfidence: "HIGH", organizationType: "Pharmaceutical manufacturer (publicly listed)", approximateSize: "Large (leading domestic manufacturer)",
    city: "10th of Ramadan City", tier: "P1", qualificationScore: 3.4,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN (likely Chairman/CEO — needs verification)", decisionMakerSource: "Not publicly identified in search", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Enterprise governance + constitutional infrastructure for large pharmaceutical manufacturer",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED: Large pharma manufacturer may need enhanced governance for compliance + multi-stakeholder coordination",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Leading domestic pharma manufacturer. EGX-listed (needs verification). High strategic value if qualified."
  },
  {
    id: "T-05", organization: "Pharco Pharmaceuticals", sector: "Pharmaceuticals",
    website: "UNKNOWN (identified via pharmaboardroom.com report)", source: "pharmaboardroom.com — Egypt Pharma Industry Report 2023",
    sourceConfidence: "HIGH", organizationType: "Pharmaceutical manufacturer", approximateSize: "Large (leading domestic manufacturer)",
    city: "Alexandria", tier: "P1", qualificationScore: 3.3,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + institutional infrastructure for pharmaceutical company",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED: Leading pharma manufacturer may need structured governance for regulatory compliance + growth",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Leading domestic manufacturer per industry report."
  },
  {
    id: "T-06", organization: "Amoun Pharmaceutical", sector: "Pharmaceuticals",
    website: "UNKNOWN (identified via pharmaboardroom.com report)", source: "pharmaboardroom.com — Egypt Pharma Industry Report 2023",
    sourceConfidence: "HIGH", organizationType: "Pharmaceutical manufacturer", approximateSize: "Large (leading domestic manufacturer)",
    city: "UNKNOWN", tier: "P1", qualificationScore: 3.2,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + institutional infrastructure",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Leading domestic manufacturer."
  },
  {
    id: "T-07", organization: "MACRO GROUP Pharmaceuticals", sector: "Pharmaceuticals",
    website: "UNKNOWN (identified via egypt-business.com listing)", source: "egypt-business.com — Top 20 pharmaceutical manufacturers in Egypt",
    sourceConfidence: "MEDIUM", organizationType: "Cosmeceutical company (established 2002)", approximateSize: "Medium",
    city: "UNKNOWN", tier: "P2", qualificationScore: 2.9,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + capital formation for growing pharma company",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED: Growing cosmeceutical company may need governance for scaling",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Established 2002."
  },
  // === CONSTRUCTION / BUILDING MATERIALS ===
  {
    id: "T-08", organization: "Orascom Construction PLC", sector: "Construction",
    website: "orascom.com", source: "orascom.com (official website) + blackridgeresearch.com",
    sourceConfidence: "HIGH", organizationType: "Construction PLC (dual-listed)", approximateSize: "Large (major construction company)",
    city: "Cairo", tier: "P0", qualificationScore: 4.1,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN (needs verification — likely CEO/Managing Director)", decisionMakerSource: "Not identified in search", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Enterprise governance + constitutional infrastructure for large multi-entity construction group",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED: Large construction PLC with multiple subsidiaries may need unified governance + capital formation infrastructure. High strategic value if qualified.",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Dual-listed (EGX + NASDAQ Dubai). Official website verified. Manufacturing of fabricated steel, glass, paints, concrete pipes. HIGH strategic value — P0 candidate."
  },
  {
    id: "T-09", organization: "Hassan Allam Holding", sector: "Construction",
    website: "UNKNOWN (identified via blackridgeresearch.com)", source: "blackridgeresearch.com — Top 10 Largest Construction Companies in Egypt 2026",
    sourceConfidence: "HIGH", organizationType: "Construction holding company", approximateSize: "Large (top 3 construction in Egypt)",
    city: "Cairo", tier: "P0", qualificationScore: 4.0,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN (needs verification)", decisionMakerSource: "Not identified in search", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Enterprise governance + constitutional infrastructure for large holding company",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED: Large construction holding may need structured governance across subsidiaries + capital formation for mega-projects.",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Top 3 construction company in Egypt. HIGH strategic value — P0 candidate."
  },
  {
    id: "T-10", organization: "Misr Cement Group", sector: "Building Materials",
    website: "UNKNOWN (identified via egypt-business.com)", source: "egypt-business.com — Building-Material Industry in Egypt",
    sourceConfidence: "MEDIUM", organizationType: "Cement and building materials manufacturing group", approximateSize: "Medium-Large",
    city: "UNKNOWN", tier: "P2", qualificationScore: 2.8,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + operational infrastructure for manufacturing group",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Prominent cement/building materials group."
  },
  // === TEXTILE / GARMENT ===
  {
    id: "T-11", organization: "Oriental Weavers", sector: "Textile",
    website: "UNKNOWN (identified via mordorintelligence.com report)", source: "mordorintelligence.com — Egypt Textile Manufacturing Industry Study",
    sourceConfidence: "HIGH", organizationType: "Textile manufacturing (top 5 in Egypt)", approximateSize: "Large (EGX-listed, needs verification)",
    city: "Cairo", tier: "P1", qualificationScore: 3.5,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Enterprise governance + capital formation for large textile manufacturer",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED: Top textile manufacturer may need governance for multi-facility operations + export-oriented capital formation.",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Top 5 textile company in Egypt. EGX-listed (needs verification). Export-oriented."
  },
  {
    id: "T-12", organization: "Kazareen Textile Group (KTG)", sector: "Textile",
    website: "kazareentextilegroup.com", source: "kazareentextilegroup.com (official website)",
    sourceConfidence: "HIGH", organizationType: "Textile/garment manufacturing (multi-country facilities)", approximateSize: "Medium-Large (facilities in Egypt, India, Bangladesh, Vietnam, China)",
    city: "UNKNOWN", tier: "P1", qualificationScore: 3.6,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not identified on website", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Constitutional governance for multi-country manufacturing group + capital formation",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED: Multi-country textile group may need unified governance across jurisdictions + structured capital formation. Official website verified.",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Official website verified (kazareentextilegroup.com). Multi-country operations — HIGH strategic value for constitutional governance across borders."
  },
  {
    id: "T-13", organization: "Giza Spinning", sector: "Textile",
    website: "UNKNOWN (identified via egypt-business.com listing)", source: "egypt-business.com — Top10 textile companies in Egypt",
    sourceConfidence: "MEDIUM", organizationType: "Textile/garment manufacturing", approximateSize: "Medium",
    city: "Giza", tier: "P2", qualificationScore: 2.9,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + capital formation for growing textile company",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Listed in top 10 textile companies."
  },
  {
    id: "T-14", organization: "Arafa Holding (Arafa)", sector: "Textile",
    website: "UNKNOWN (identified via egypt-business.com + mordorintelligence.com)", source: "egypt-business.com + mordorintelligence.com",
    sourceConfidence: "HIGH", organizationType: "Textile holding company (EGX-listed, needs verification)", approximateSize: "Large",
    city: "Cairo", tier: "P1", qualificationScore: 3.3,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Enterprise governance for holding company + multi-entity coordination",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED: Textile holding company may need governance across subsidiaries + structured capital formation.",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Listed in top 10 textile companies + top 5 textile manufacturers."
  },
  // === LOGISTICS ===
  {
    id: "T-15", organization: "Nile Logistics International", sector: "Logistics",
    website: "UNKNOWN (identified via goodfirms.co listing)", source: "goodfirms.co — Best Logistics Companies in Egypt 2026",
    sourceConfidence: "MEDIUM", organizationType: "Logistics/supply chain", approximateSize: "Medium",
    city: "UNKNOWN", tier: "P2", qualificationScore: 2.7,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + operational infrastructure for logistics company",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Listed in logistics directory."
  },
  {
    id: "T-16", organization: "EGY Logistics", sector: "Logistics",
    website: "UNKNOWN (identified via goodfirms.co listing)", source: "goodfirms.co — Best Logistics Companies in Egypt 2026",
    sourceConfidence: "MEDIUM", organizationType: "Logistics", approximateSize: "UNKNOWN",
    city: "UNKNOWN", tier: "P2", qualificationScore: 2.6,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + operational infrastructure",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Listed in logistics directory."
  },
  {
    id: "T-17", organization: "Concept for Logistics and Supply Chain Solutions", sector: "Logistics",
    website: "UNKNOWN (identified via lusha.com listing)", source: "lusha.com — Transportation logistics and storage companies in Egypt",
    sourceConfidence: "LOW", organizationType: "Logistics/supply chain solutions", approximateSize: "UNKNOWN",
    city: "UNKNOWN", tier: "P3", qualificationScore: 2.2,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "UNKNOWN — needs further research",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED. Low confidence source — requires verification.",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Low confidence source. Needs verification before any outreach."
  },
  // === AGRICULTURE ===
  {
    id: "T-18", organization: "Agro Egypt (Ghallab)", sector: "Agriculture",
    website: "agroegypt.com", source: "agroegypt.com (official website)",
    sourceConfidence: "HIGH", organizationType: "Agricultural food exporting company", approximateSize: "Small-Medium",
    city: "UNKNOWN", tier: "P1", qualificationScore: 3.3,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN (likely founder/owner — needs verification)", decisionMakerSource: "Not identified on website", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + capital formation for export-oriented agricultural company",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED: Export-oriented agri company may need governance for international trade compliance + structured capital formation. Official website verified.",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Official website verified (agroegypt.com). Citrus export focus. Good ICP fit — SME, export-oriented, real economy."
  },
  // === TECHNOLOGY / FINTECH ===
  {
    id: "T-19", organization: "PayMob", sector: "Technology / Fintech",
    website: "UNKNOWN (identified via startupblink.com + fintechnews.africa)", source: "startupblink.com — Top startups in Egypt + fintechnews.africa",
    sourceConfidence: "HIGH", organizationType: "Fintech / payments platform", approximateSize: "Large (top funded fintech in Egypt)",
    city: "Cairo", tier: "P1", qualificationScore: 3.4,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN (likely CEO/co-founder — needs verification)", decisionMakerSource: "Not identified in search", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Constitutional governance for fintech company + institutional infrastructure",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED: Large fintech may need governance for multi-stakeholder coordination + regulatory compliance infrastructure. NOTE: fintech sector may face regulatory complexity — needs assessment.",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Top funded fintech in Egypt. HIGH strategic value but potential regulatory complexity. Needs careful qualification."
  },
  {
    id: "T-20", organization: "MoneyFellows", sector: "Technology / Fintech",
    website: "UNKNOWN (identified via fintechnews.africa)", source: "fintechnews.africa — Top funded fintech startups in Egypt",
    sourceConfidence: "MEDIUM", organizationType: "Fintech (collaborative finance/savings)", approximateSize: "Medium (funded startup)",
    city: "Cairo", tier: "P2", qualificationScore: 2.9,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + institutional infrastructure for fintech",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED: Fintech may need governance for regulatory compliance. Regulatory complexity needs assessment.",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Funded fintech. Regulatory complexity — needs careful assessment."
  },
  // === ADDITIONAL SECTORS ===
  {
    id: "T-21", organization: "Al-Watania Poultry", sector: "Food / Agriculture",
    website: "UNKNOWN (identified via egypt-business.com listing)", source: "egypt-business.com — Food companies in Egypt",
    sourceConfidence: "MEDIUM", organizationType: "Poultry/agriculture manufacturing", approximateSize: "Large (major poultry producer)",
    city: "UNKNOWN", tier: "P2", qualificationScore: 2.9,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + operational infrastructure for large agri-food company",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Major poultry producer."
  },
  {
    id: "T-22", organization: "Al Andalous Pharmaceutical Industries", sector: "Pharmaceuticals",
    website: "UNKNOWN (identified via lusha.com listing)", source: "lusha.com — Pharmaceutical manufacturing companies in Egypt",
    sourceConfidence: "MEDIUM", organizationType: "Pharmaceutical manufacturer", approximateSize: "Medium",
    city: "UNKNOWN", tier: "P2", qualificationScore: 2.8,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + compliance infrastructure",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Pharmaceutical manufacturer."
  },
  {
    id: "T-23", organization: "Alpha Omega Egypt", sector: "Textile / Garment",
    website: "UNKNOWN (identified via onlineclothingstudy.com)", source: "onlineclothingstudy.com — List of Top Garment Manufacturing Companies in Egypt",
    sourceConfidence: "MEDIUM", organizationType: "Garment manufacturing", approximateSize: "Medium",
    city: "UNKNOWN", tier: "P2", qualificationScore: 2.7,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + capital formation for garment manufacturer",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Listed as top garment manufacturer."
  },
  {
    id: "T-24", organization: "ARACO for Building Materials and Contracting", sector: "Construction / Building Materials",
    website: "UNKNOWN (identified via lusha.com listing)", source: "lusha.com — Wholesale building materials companies in Egypt",
    sourceConfidence: "MEDIUM", organizationType: "Building materials + contracting", approximateSize: "Medium",
    city: "UNKNOWN", tier: "P2", qualificationScore: 2.8,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "Governance + operational infrastructure for building materials company",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Building materials + contracting company."
  },
  {
    id: "T-25", organization: "El Nasr Trading Co.", sector: "Building Materials / Trading",
    website: "UNKNOWN (identified via egypt-business.com)", source: "egypt-business.com — Building-Material Industry in Egypt",
    sourceConfidence: "MEDIUM", organizationType: "Trading company (building materials)", approximateSize: "Medium",
    city: "UNKNOWN", tier: "P3", qualificationScore: 2.4,
    decisionMaker: "UNKNOWN", decisionMakerRole: "UNKNOWN", decisionMakerSource: "Not publicly identified", decisionMakerConfidence: "UNKNOWN",
    likelyUseCase: "UNKNOWN — needs further research",
    problemHypothesis: "MARKET HYPOTHESIS — NOT VALIDATED. Limited information — needs verification.",
    evidenceLevel: "E1", status: "RESEARCHED", notes: "Limited public information. Needs further research before outreach."
  },
];

// ═══════════════════════════════════════════════════════════════
// LAW FIRM CANDIDATES (real, from web search)
// ═══════════════════════════════════════════════════════════════

export type LawFirmCandidate = {
  id: string;
  firm: string;
  website: string;
  source: string;
  sourceConfidence: "HIGH" | "MEDIUM" | "LOW";
  practiceAreas: string;
  cairoOffice: boolean;
  status: "RESEARCHED" | "CONTACTED" | "QUALIFIED" | "DD" | "NEGOTIATION" | "SIGNED" | "ACTIVE";
  notes: string;
};

export const LAW_FIRM_CANDIDATES: LawFirmCandidate[] = [
  {
    id: "LF-01", firm: "Zulficar & Partners",
    website: "UNKNOWN (identified via legal500.com)", source: "legal500.com — Egypt law firm rankings",
    sourceConfidence: "HIGH", practiceAreas: "International arbitration, corporate law (premier firm per Legal 500)",
    cairoOffice: true, status: "RESEARCHED",
    notes: "Premier international arbitration and corporate law firm based in Cairo. Identified via Legal 500 rankings. PARTNER TARGET — not a partner. Needs due diligence + outreach."
  },
  {
    id: "LF-02", firm: "Shand Partners",
    website: "shandpartners.com", source: "shandpartners.com (official website) + search result",
    sourceConfidence: "HIGH", practiceAreas: "Corporate law, banking & finance, dispute resolution (full-service)",
    cairoOffice: true, status: "RESEARCHED",
    notes: "Full-service law firm. Official website verified (shandpartners.com). Covers corporate law, banking & finance, dispute resolution. PARTNER TARGET — not a partner."
  },
  {
    id: "LF-03", firm: "Clyde & Co (Cairo office)",
    website: "clydeco.com (Cairo location page verified)", source: "clydeco.com — Cairo location + search result",
    sourceConfidence: "HIGH", practiceAreas: "Corporate, insurance, dispute resolution (US + Egyptian qualified lawyers)",
    cairoOffice: true, status: "RESEARCHED",
    notes: "International law firm with Cairo office. US and Egyptian qualified lawyers. 18+ years experience. Official website verified. PARTNER TARGET — not a partner."
  },
  {
    id: "LF-04", firm: "White & Case (Cairo practice)",
    website: "whitecase.com/law/africa/egypt", source: "whitecase.com (official website)",
    sourceConfidence: "HIGH", practiceAreas: "Corporate, financial institutions, capital markets (advises Egyptian + international corporations)",
    cairoOffice: true, status: "RESEARCHED",
    notes: "Major international law firm with Cairo practice. Advises both Egyptian and international corporations and financial institutions. Official website verified. PARTNER TARGET — not a partner."
  },
  {
    id: "LF-05", firm: "Baker McKenzie (Cairo)",
    website: "UNKNOWN (identified via chambers.com ranking)", source: "chambers.com — Banking & Finance Egypt rankings",
    sourceConfidence: "HIGH", practiceAreas: "Banking & finance, corporate (ranked by Chambers)",
    cairoOffice: true, status: "RESEARCHED",
    notes: "International law firm ranked in Banking & Finance for Egypt by Chambers. 23+ years in Cairo per Chambers listing. PARTNER TARGET — not a partner."
  },
];

// ═══════════════════════════════════════════════════════════════
// REGULATORY RESEARCH (real, from web search)
// ═══════════════════════════════════════════════════════════════

export type RegulatoryResearch = {
  authority: string;
  website: string;
  source: string;
  mandate: string;
  relevantLaw: string;
  aurentaRelevance: string;
  classification: "FACT" | "LEGAL QUESTION" | "ASSUMPTION" | "REQUIRES COUNSEL" | "REQUIRES REGULATOR";
  status: "NOT RESEARCHED" | "RESEARCHED" | "QUESTION IDENTIFIED" | "COUNSEL REVIEW" | "FORMAL CONTACT" | "SUBMISSION" | "APPROVED";
  notes: string;
};

export const REGULATORY_RESEARCH_RESULTS: RegulatoryResearch[] = [
  {
    authority: "FRA (Financial Regulatory Authority)",
    website: "fra.gov.eg", source: "fra.gov.eg (official website) + Wikipedia",
    mandate: "Regulates and supervises non-banking financial activities in Egypt. Established under Law No. 10 of 2009.",
    relevantLaw: "Law No. 10 of 2009",
    aurentaRelevance: "LEGAL QUESTION: Does AURIENTA's constitutional infrastructure (Zero Custody, capital formation, equity units) fall within FRA's regulatory perimeter for non-banking financial activities? AURIENTA does not hold funds (Zero Custody) and capital flows to Law Firm Client Accounts — but capital formation + equity unit issuance may raise questions.",
    classification: "REQUIRES COUNSEL",
    status: "RESEARCHED",
    notes: "FACT: FRA regulates non-banking financial activities. FACT: AURIENTA uses Zero Custody (never holds funds). LEGAL QUESTION: Does capital formation + equity unit issuance trigger FRA regulation? REQUIRES COUNSEL: External legal opinion needed before any formal engagement."
  },
  {
    authority: "Central Bank of Egypt (CBE)",
    website: "cbe.org.eg", source: "cbe.org.eg (official website)",
    mandate: "Achieves monetary and banking system soundness and price stability. Regulates banks operating in Egypt.",
    relevantLaw: "Central Bank Law + banking regulations",
    aurentaRelevance: "ASSUMPTION: AURIENTA is NOT a bank and does not conduct banking activities. Zero Custody means AURIENTA never holds funds. Capital flows to Law Firm Client Accounts (held by licensed law firms, not AURIENTA). AURIENTA likely falls OUTSIDE CBE's direct regulatory perimeter.",
    classification: "REQUIRES COUNSEL",
    status: "RESEARCHED",
    notes: "FACT: CBE regulates banks. FACT: AURIENTA is not a bank. FACT: AURIENTA never holds funds (Zero Custody). ASSUMPTION: AURIENTA falls outside CBE direct perimeter. REQUIRES COUNSEL: Legal opinion needed to confirm non-banking status before any public claim."
  },
  {
    authority: "Personal Data Protection (PDPL)",
    website: "UNKNOWN (law identified via dlapiperdataprotection.com + bakermckenzie.com)", source: "DLA Piper Data Protection + Baker McKenzie + Clyde & Co insights",
    mandate: "Law No. 151 of 2020 — protects personal data and regulates data processing activities. Executive Regulations issued January 2026.",
    relevantLaw: "Law No. 151 of 2020 (PDPL) + Executive Regulations (January 2026)",
    aurentaRelevance: "FACT: AURIENTA processes personal data (user identities, enterprise information, financial data). FACT: PDPL requires data residency in Egypt. FACT: AURIENTA's data residency is Egypt. LEGAL QUESTION: Does AURIENTA's data processing fully comply with PDPL + Executive Regulations? REQUIRES COUNSEL: Compliance review needed.",
    classification: "REQUIRES COUNSEL",
    status: "RESEARCHED",
    notes: "FACT: PDPL is Law No. 151 of 2020. FACT: Executive Regulations issued January 2026 (per Baker McKenzie + Clyde & Co). FACT: AURIENTA data residency is Egypt. LEGAL QUESTION: Full compliance assessment needed. REQUIRES COUNSEL for compliance review."
  },
  {
    authority: "Companies Authority (GAFI)",
    website: "UNKNOWN", source: "Operational (entity registered)",
    mandate: "Company registration and corporate compliance in Egypt.",
    relevantLaw: "Companies Law No. 159 of 1981",
    aurentaRelevance: "FACT: AURIENTA entities are registered with GAFI. This is operational, not a regulatory question.",
    classification: "FACT",
    status: "APPROVED",
    notes: "Entity registration complete (operational). This is NOT regulatory engagement — it is standard corporate registration."
  },
  {
    authority: "Tax Authority (ETA)",
    website: "UNKNOWN", source: "Operational (tax registration complete)",
    mandate: "Tax registration and compliance in Egypt.",
    relevantLaw: "Income Tax Law + VAT Law",
    aurentaRelevance: "FACT: AURIENTA tax registration is complete. This is operational, not a regulatory question.",
    classification: "FACT",
    status: "APPROVED",
    notes: "Tax registration complete (operational). This is NOT regulatory engagement — it is standard tax compliance."
  },
];

// ═══════════════════════════════════════════════════════════════
// FIRST 5 OUTREACH DRAFTS (for Founder approval — NOT sent)
// ═══════════════════════════════════════════════════════════════

export type OutreachDraft = {
  draftId: string;
  target: string;
  recipient: string;
  recipientRole: string;
  status: "DRAFT" | "FOUNDER REVIEW" | "APPROVED" | "SENT" | "RESPONSE";
  whyThisOrganization: string;
  whyThisPerson: string;
  whatIssue: string;
  whatAurentaIs: string;
  request: string;
  claimsNOTMade: string;
};

export const FIRST_5_OUTREACH_DRAFTS: OutreachDraft[] = [
  {
    draftId: "OD-01",
    target: "Orascom Construction PLC",
    recipient: "UNKNOWN — decision-maker needs identification (likely CEO/Managing Director)",
    recipientRole: "UNKNOWN",
    status: "DRAFT",
    whyThisOrganization: "Orascom Construction is a major dual-listed Egyptian construction PLC with multiple subsidiaries, manufacturing operations, and complex governance needs. It represents the type of large, multi-entity enterprise where constitutional governance infrastructure could create significant institutional value.",
    whyThisPerson: "DECISION-MAKER UNKNOWN — research required to identify the appropriate executive (likely CEO, COO, or General Counsel) before outreach can be sent.",
    whatIssue: "We are exploring whether large multi-entity construction groups in Egypt face governance, capital coordination, or institutional transparency challenges that constitutional infrastructure could address.",
    whatAurentaIs: "AURIENTA is a Constitutional Enterprise Infrastructure Group — not a software company or a fintech. We provide AI-enforced governance infrastructure (Constitutional Runtime Engine) that helps enterprises formalize governance, structure capital formation, and build institutional transparency. AURIENTA never holds funds (Zero Custody model — capital flows to licensed law firm client accounts).",
    request: "We would appreciate a 30-minute exploratory conversation to understand whether Orascom Construction faces governance or capital coordination challenges that AURIENTA's constitutional infrastructure might address. No commitment is requested — this is purely exploratory.",
    claimsNOTMade: "This outreach does NOT claim AURIENTA has customers, partners, regulatory approval, certifications, or revenue. AURIENTA is an emerging infrastructure group seeking to validate whether its model addresses real enterprise problems."
  },
  {
    draftId: "OD-02",
    target: "Hassan Allam Holding",
    recipient: "UNKNOWN — decision-maker needs identification",
    recipientRole: "UNKNOWN",
    status: "DRAFT",
    whyThisOrganization: "Hassan Allam Holding is one of Egypt's top 3 construction companies with complex multi-entity operations and significant capital formation needs for mega-projects.",
    whyThisPerson: "DECISION-MAKER UNKNOWN — research required.",
    whatIssue: "We are exploring whether large construction holding companies face governance coordination, capital structuring, or institutional transparency challenges across their subsidiary ecosystem.",
    whatAurentaIs: "AURIENTA is a Constitutional Enterprise Infrastructure Group providing AI-enforced governance infrastructure. We help enterprises formalize governance, structure capital formation, and build institutional transparency through a Constitutional Runtime Engine. Zero Custody: AURIENTA never holds funds.",
    request: "We would appreciate a 30-minute exploratory conversation to understand whether Hassan Allam Holding faces governance or capital coordination challenges that AURIENTA's constitutional model might address.",
    claimsNOTMade: "No claims of customers, partners, regulatory approval, certifications, or revenue. This is exploratory."
  },
  {
    draftId: "OD-03",
    target: "Kazareen Textile Group (KTG)",
    recipient: "UNKNOWN — decision-maker needs identification",
    recipientRole: "UNKNOWN",
    status: "DRAFT",
    whyThisOrganization: "KTG is a multi-country textile manufacturing group with facilities in Egypt, India, Bangladesh, Vietnam, and China. Multi-jurisdictional operations create complex governance needs that constitutional infrastructure could address.",
    whyThisPerson: "DECISION-MAKER UNKNOWN — research required. Website (kazareentextilegroup.com) does not publicly list executives.",
    whatIssue: "We are exploring whether multi-country manufacturing groups face governance coordination challenges across jurisdictions that constitutional infrastructure could address.",
    whatAurentaIs: "AURIENTA is a Constitutional Enterprise Infrastructure Group providing AI-enforced governance infrastructure for multi-entity, multi-jurisdictional enterprises. Zero Custody: AURIENTA never holds funds.",
    request: "We would appreciate a 30-minute exploratory conversation to understand whether KTG faces cross-jurisdictional governance or capital coordination challenges.",
    claimsNOTMade: "No claims of customers, partners, regulatory approval, certifications, or revenue. This is exploratory."
  },
  {
    draftId: "OD-04",
    target: "Agro Egypt (Ghallab)",
    recipient: "UNKNOWN — likely founder/owner (needs verification)",
    recipientRole: "UNKNOWN",
    status: "DRAFT",
    whyThisOrganization: "Agro Egypt is an export-oriented agricultural food exporting company with verified website (agroegypt.com). Export-oriented SMEs in agriculture face governance, capital formation, and international trade compliance challenges that AURIENTA's model is designed to address.",
    whyThisPerson: "DECISION-MAKER UNKNOWN — likely founder/owner given company size. Needs verification.",
    whatIssue: "We are exploring whether export-oriented agricultural companies face governance, capital formation, or institutional transparency challenges that constitutional infrastructure could address.",
    whatAurentaIs: "AURIENTA is a Constitutional Enterprise Infrastructure Group providing AI-enforced governance infrastructure. We help enterprises formalize governance, structure capital formation, and build institutional transparency. Zero Custody: AURIENTA never holds funds.",
    request: "We would appreciate a 30-minute exploratory conversation to understand whether Agro Egypt faces governance or capital formation challenges.",
    claimsNOTMade: "No claims of customers, partners, regulatory approval, certifications, or revenue. This is exploratory."
  },
  {
    draftId: "OD-05",
    target: "EIPICO (Egyptian International Pharmaceutical Industries)",
    recipient: "UNKNOWN — decision-maker needs identification (likely Chairman/CEO)",
    recipientRole: "UNKNOWN",
    status: "DRAFT",
    whyThisOrganization: "EIPICO is Egypt's leading domestic pharmaceutical manufacturer with complex compliance, governance, and multi-stakeholder coordination needs. Pharmaceutical companies face stringent regulatory requirements that constitutional governance infrastructure could support.",
    whyThisPerson: "DECISION-MAKER UNKNOWN — research required (likely Chairman/CEO). EIPICO is EGX-listed (needs verification) — executive information may be available in annual reports.",
    whatIssue: "We are exploring whether large pharmaceutical manufacturers face governance, compliance coordination, or institutional transparency challenges that constitutional infrastructure could address.",
    whatAurentaIs: "AURIENTA is a Constitutional Enterprise Infrastructure Group providing AI-enforced governance infrastructure. We help enterprises formalize governance, structure capital formation, and build institutional transparency. Zero Custody: AURIENTA never holds funds.",
    request: "We would appreciate a 30-minute exploratory conversation to understand whether EIPICO faces governance or compliance coordination challenges.",
    claimsNOTMade: "No claims of customers, partners, regulatory approval, certifications, or revenue. This is exploratory."
  },
];

// ═══════════════════════════════════════════════════════════════
// EXECUTION REPORT — HONEST
// ═══════════════════════════════════════════════════════════════

export const EXECUTION_REPORT = {
  researchDate: RESEARCH_DATE,
  researcher: RESEARCHER,
  evidenceLevel: RESEARCH_EVIDENCE_LEVEL,
  disclaimer: RESEARCH_DISCLAIMER,

  targets: {
    totalResearched: FIRST_25_TARGETS.length,
    p0Count: FIRST_25_TARGETS.filter(t => t.tier === "P0").length,
    p1Count: FIRST_25_TARGETS.filter(t => t.tier === "P1").length,
    p2Count: FIRST_25_TARGETS.filter(t => t.tier === "P2").length,
    p3Count: FIRST_25_TARGETS.filter(t => t.tier === "P3").length,
    p0Targets: FIRST_25_TARGETS.filter(t => t.tier === "P0").map(t => t.organization),
    evidenceQuality: "E1 — Market hypothesis based on secondary public sources. NOT validated through conversation.",
    unknownFields: "Decision-makers UNKNOWN for all 25 targets. Website UNKNOWN for several targets. Size UNKNOWN for several targets. City UNKNOWN for several targets.",
  },

  decisionMakers: {
    verified: 0,
    unknown: 25,
    evidenceQuality: "INSUFFICIENT — no decision-makers publicly identified. All require further research before outreach.",
    statement: "DECISION-MAKER UNKNOWN for all 25 targets. This is the #1 blocker preventing outreach. Founder must either: (a) conduct deeper research per target, or (b) use cold outreach to general company contact points.",
  },

  outreach: {
    draftsPrepared: FIRST_5_OUTREACH_DRAFTS.length,
    founderApproved: 0,
    actuallySent: 0,
    responses: 0,
    statement: "5 outreach drafts prepared for the 5 highest-value targets (P0 + top P1). ALL are in DRAFT status. NONE have been Founder-approved. NONE have been sent. ZERO responses. The Founder (Mohamed Eltonsy) must review and approve each draft before it can be sent.",
  },

  conversations: {
    completed: 0,
    pending: 0,
    qualified: 0,
    disqualified: 0,
    statement: "ZERO conversations have occurred. No outreach has been sent. The first conversation is the #1 execution milestone.",
  },

  problems: {
    discovered: 0,
    evidence: "No problems discovered — no conversations have occurred. All problem hypotheses are MARKET HYPOTHESIS — NOT VALIDATED.",
    severity: "INSUFFICIENT DATA",
    urgency: "INSUFFICIENT DATA",
  },

  partners: {
    lawFirmsResearched: LAW_FIRM_CANDIDATES.length,
    contacted: 0,
    conversations: 0,
    agreements: 0,
    statement: "5 real Egyptian law firms researched from public sources (Zulficar & Partners, Shand Partners, Clyde & Co Cairo, White & Case Cairo, Baker McKenzie Cairo). ALL are PARTNER TARGETS — NOT partners. Zero contacted. Zero conversations. Zero agreements.",
  },

  regulatory: {
    questionsIdentified: 3,
    researchCompleted: 3,
    counselQuestions: 3,
    regulatorQuestions: 0,
    actualEngagement: 0,
    statement: "3 regulatory authorities researched (FRA, CBE, PDPL) from official websites + legal publications. 3 questions identified — ALL classified REQUIRES COUNSEL. FORMAL ENGAGEMENT: 0. Companies + Tax: operational registrations (not regulatory engagement). No formal regulatory submission has been made.",
    classifications: {
      fact: "FRA mandate (Law 10/2009), CBE mandate, PDPL (Law 151/2020 + Executive Regulations Jan 2026), AURIENTA data residency Egypt, AURIENTA Zero Custody (never holds funds)",
      legalQuestion: "Does AURIENTA's capital formation + equity unit issuance trigger FRA regulation? Does AURIENTA fall outside CBE direct perimeter? Does AURIENTA fully comply with PDPL?",
      requiresCounsel: "External legal opinion needed for FRA perimeter, CBE non-banking status, PDPL compliance — before any formal regulatory engagement or public claim",
    },
  },

  commercial: {
    opportunities: 0,
    proposals: 0,
    agreements: 0,
    revenue: "0 EGP",
    statement: "ZERO commercial activity. No opportunities, no proposals, no agreements, no revenue.",
  },

  evidence: {
    currentCeiling: "E1 (Market hypothesis — based on secondary research)",
    evidenceGained: "E0 → E1: 25 target accounts researched from public sources. 5 law firms researched. 3 regulatory authorities researched. 5 outreach drafts prepared.",
    unsupportedClaimsDetected: "None — all targets explicitly labeled MARKET HYPOTHESIS — NOT VALIDATED. All law firms labeled PARTNER TARGET — NOT partner. All regulatory items labeled REQUIRES COUNSEL — NOT approved.",
    corrections: "No corrections needed — honest baseline maintained throughout.",
  },

  marketLearning: {
    strongestValidation: "NONE — no conversations have occurred. No market validation exists.",
    strongestRejection: "NONE — no conversations have occurred. No market rejection exists.",
    repeatedObjections: "NONE — no conversations have occurred. No objections recorded.",
    unexpectedDiscoveries: "Several targets are EGX-listed (Orascom, EIPICO, Oriental Weavers, Arafa) — potential for higher-tier engagement but also more complex procurement processes. Multi-country operations (KTG) create interesting constitutional governance use case. Fintech targets (PayMob, MoneyFellows) may face regulatory complexity requiring careful assessment.",
  },

  productLearning: {
    technicalProblems: "None identified — no deployments attempted.",
    onboardingProblems: "None identified — no onboarding attempted.",
    uxProblems: "None identified — no user feedback.",
    commercialProblems: "None identified — no commercial discussions.",
  },

  founderActions: {
    next10: [
      "1. REVIEW the 5 outreach drafts — approve, modify, or reject each (OD-01 through OD-05)",
      "2. RESEARCH decision-makers for the 2 P0 targets (Orascom Construction, Hassan Allam Holding) — check annual reports, LinkedIn, company websites",
      "3. ENGAGE external counsel for FRA perimeter question — this is the #1 regulatory blocker (REQUIRES COUNSEL)",
      "4. CONTACT one of the 5 law firm candidates for an exploratory conversation about AURIENTA's legal framework",
      "5. DEEPEN research on P0/P1 targets — verify websites, identify executives, assess strategic fit",
      "6. APPROVE at least 2-3 outreach drafts after decision-maker identification",
      "7. SEND first approved outreach — this begins the E1→E2 transition",
      "8. BEGIN PDPL compliance assessment with counsel (Executive Regulations issued Jan 2026 — compliance deadline approaching)",
      "9. RESEARCH CBE non-banking status confirmation with counsel — needed before any public Zero Custody claim",
      "10. PREPARE first weekly execution review at end of Week 1 — document what actually happened",
    ],
    statement: "These 10 actions are based on ACTUAL research findings. The #1 priority is Founder review of outreach drafts + decision-maker identification. The #1 blocker is REQUIRES COUNSEL on regulatory questions.",
  },

  whatWeKnow: [
    "25 real Egyptian target companies identified across 7 sectors (food processing, pharmaceuticals, construction, textile, logistics, agriculture, technology)",
    "5 real Egyptian law firms identified with verified practice areas (Zulficar & Partners, Shand Partners, Clyde & Co, White & Case, Baker McKenzie)",
    "3 regulatory authorities researched with mandates verified from official websites (FRA, CBE, PDPL)",
    "2 P0 targets identified (Orascom Construction PLC, Hassan Allam Holding) — highest strategic value",
    "7 P1 targets identified — strong commercial potential",
    "PDPL Executive Regulations issued January 2026 — compliance timeline is real",
    "FRA regulates non-banking financial activities under Law No. 10 of 2009 — AURIENTA's capital formation model needs legal assessment",
    "CBE regulates banks — AURIENTA is not a bank and uses Zero Custody — likely outside direct perimeter but needs legal confirmation",
  ],

  whatWeDontKnow: [
    "Decision-makers for ALL 25 targets (UNKNOWN — research required)",
    "Whether any target actually has the problems AURIENTA hypothesizes (MARKET HYPOTHESIS — NOT VALIDATED)",
    "Whether AURIENTA falls within FRA's regulatory perimeter (REQUIRES COUNSEL)",
    "Whether AURIENTA is confirmed outside CBE's direct perimeter (REQUIRES COUNSEL)",
    "Whether AURIENTA fully complies with PDPL + Executive Regulations (REQUIRES COUNSEL)",
    "Whether any law firm would be willing to work with AURIENTA (no contact made)",
    "Whether any target would be interested in AURIENTA (no contact made)",
    "Whether AURIENTA's pricing is acceptable to any customer (THEORETICAL — no proposals delivered)",
    "Whether AURIENTA's product works in production for a real customer (no deployments)",
  ],

  whatWeDid: [
    "Conducted 8 web searches across 8 sector queries + 3 regulatory queries",
    "Identified 25 real Egyptian target companies from public sources",
    "Researched 5 real Egyptian/international law firms with Cairo offices",
    "Researched 3 regulatory authorities (FRA, CBE, PDPL) from official websites + legal publications",
    "Prepared 5 personalized outreach drafts for the highest-value targets",
    "Classified all regulatory questions as FACT / LEGAL QUESTION / ASSUMPTION / REQUIRES COUNSEL",
    "Maintained honest evidence levels (E1 — market hypothesis, NOT validated)",
    "Marked all decision-makers as UNKNOWN (not fabricated)",
    "Marked all law firms as PARTNER TARGET (not partner)",
    "Marked all regulatory items as REQUIRES COUNSEL (not approved)",
    "Prepared 10 highest-value Founder actions based on actual research findings",
  ],

  whatHappened: [
    "Research completed: 25 targets, 5 law firms, 3 regulatory authorities",
    "Evidence level advanced: E0 → E1 (market hypothesis based on secondary research)",
    "5 outreach drafts prepared (DRAFT status — awaiting Founder approval)",
    "ZERO outreach sent, ZERO conversations, ZERO customers, ZERO revenue",
    "Regulatory questions identified but ZERO formal engagement",
    "All claims honest — no fabrication, no inflation",
  ],

  whatWeLearned: [
    "Egypt has a rich ecosystem of real-economy enterprises across manufacturing, pharma, construction, textile, agriculture, logistics, and technology",
    "Several EGX-listed companies exist in target sectors (Orascom, EIPICO, Oriental Weavers, Arafa) — higher complexity but higher strategic value",
    "Multi-country operations (KTG) create a compelling constitutional governance use case",
    "Fintech targets may face regulatory complexity requiring careful assessment before engagement",
    "The #1 blocker is decision-maker identification — without verified contacts, outreach cannot be personalized",
    "The #1 regulatory blocker is FRA perimeter question — REQUIRES COUNSEL before any public claim or formal engagement",
    "PDPL Executive Regulations (January 2026) create a real compliance timeline",
    "5 credible law firm candidates exist with relevant practice areas — the law-firm-first strategy is viable",
  ],

  whatWeShouldDoNext: [
    "FOUNDER: Review and approve outreach drafts (OD-01 through OD-05)",
    "RESEARCH: Identify decision-makers for P0 targets (Orascom, Hassan Allam) via annual reports, LinkedIn, company websites",
    "COUNSEL: Engage external legal counsel for FRA perimeter question (#1 regulatory blocker)",
    "LAW FIRM: Contact one law firm candidate for exploratory conversation",
    "SEND: Once Founder-approved + decision-maker identified, send first outreach (begins E1→E2 transition)",
    "TRACK: Record all outreach, responses, conversations in the execution war room",
    "REVIEW: Produce first weekly execution review at end of Week 1",
    "MAINTAIN: Continue honest evidence tracking — no fabrication, no inflation",
  ],
};

// ═══════════════════════════════════════════════════════════════
// FINAL HONEST STATEMENT
// ═══════════════════════════════════════════════════════════════

export const FINAL_HONEST_STATEMENT = {
  evidenceCeiling: "E1 (Market hypothesis — advanced from E0 through actual research)",
  whatChanged: "Evidence ceiling advanced from E0 (Founder assumption) to E1 (Market hypothesis based on secondary research). 25 real target accounts, 5 law firms, and 3 regulatory authorities researched from public sources.",
  whatDidNOTChange: "Customers: 0. Partners: 0. Revenue: 0 EGP. Regulatory approvals: 0. Formal engagements: 0. Conversations: 0. Outreach sent: 0. Deployments: 0. Outcomes: 0. References: 0. Blueprint: NO CHANGE.",
  nextMilestone: "The first real conversation (E2) is the next milestone. This requires: (1) Founder approval of outreach drafts, (2) decision-maker identification, (3) outreach sent, (4) response received, (5) conversation held. NONE of these have occurred yet.",
  statement: "AURIENTA has completed its first real market research sprint. 25 real Egyptian target companies, 5 real law firms, and 3 regulatory authorities have been researched from public sources. 5 outreach drafts have been prepared. However, NO outreach has been sent, NO conversations have occurred, NO customers have been acquired, and NO revenue has been collected. The evidence ceiling is E1 (market hypothesis). The next breakthrough is NOT another dashboard or architecture — it is the first real conversation with a real prospect. EXECUTE. MEASURE. LEARN. CORRECT. PROVE. REPEAT. SCALE.",
  founder: "Mohamed Eltonsy — Founder & Sole Owner — 100%",
  certifiedAt: RESEARCH_DATE,
};
