// AURIENTA constitutional constants — the single source of truth for tier/role metadata.

export const TIER_META: Record<
  string,
  {
    name: string;
    legalForm: string;
    maxRaise: string;
    minInvest: string;
    founderEquity: string;
    fee: string;
    erp: string;
    audit: string;
    trait: string;
  }
> = {
  A: { name: "Micro", legalForm: "LLC", maxRaise: "3M EGP", minInvest: "50 EGP", founderEquity: "5% + 5%", fee: "5% + 2.5%", erp: "Lite", audit: "Compilation", trait: "First-time founders" },
  B: { name: "Small", legalForm: "LLC", maxRaise: "25M EGP", minInvest: "50 EGP", founderEquity: "5% + 5%", fee: "5% + 2.5%", erp: "Optional", audit: "Review", trait: "Experienced operators" },
  C: { name: "Growth", legalForm: "LLC", maxRaise: "Unlimited", minInvest: "50 EGP", founderEquity: "10% + 25% vest", fee: "5% + 2.5%", erp: "Mandatory", audit: "Statutory", trait: "ERP mandatory" },
  D: { name: "Established", legalForm: "LLC", maxRaise: "Unlimited", minInvest: "50,000 EGP", founderEquity: "Owner ≥51%", fee: "5% + 2.5%", erp: "Mandatory", audit: "Statutory", trait: "Existing companies" },
  E: { name: "University", legalForm: "SPV", maxRaise: "5M EGP", minInvest: "50 EGP", founderEquity: "0%", fee: "1%", erp: "—", audit: "Grant", trait: "Research spinouts" },
  F: { name: "Joint Stock", legalForm: "JSC", maxRaise: "Unlimited", minInvest: "1 share", founderEquity: "By bylaws", fee: "5% + 2.5%", erp: "Mandatory", audit: "FRA statutory", trait: "EGX listing" },
};

export const ROLE_META: Record<
  string,
  { label: string; badge: string; icon: string; policeClearance?: boolean }
> = {
  capital_partner: { label: "Capital Partner", badge: "💼", icon: "Wallet" },
  founding_operator: { label: "Founding Operator", badge: "👑", icon: "Crown" },
  workforce_partner: { label: "Workforce Partner", badge: "🛠️", icon: "HardHat" },
  manager: { label: "Manager", badge: "⚙️", icon: "Settings", policeClearance: true },
  board_member: { label: "Board Member", badge: "🪑", icon: "Users" },
  company_owner: { label: "Company Owner", badge: "🏢", icon: "Building2" },
  law_firm_rep: { label: "Law Firm Rep", badge: "⚖️", icon: "Scale" },
  accounting_firm_rep: { label: "Accounting Firm Rep", badge: "📊", icon: "Calculator" },
  aurienta_rep: { label: "AURIENTA Rep", badge: "🛡️", icon: "ShieldCheck" },
  university_rep: { label: "University Rep", badge: "🎓", icon: "GraduationCap" },
};

export const STAGE_META: Record<string, { name: string; role: string; duration: string }> = {
  stage_1: { name: "Protected Formation", role: "Full CRE enforcement", duration: "0–12 months" },
  stage_2: { name: "Structured Growth", role: "Alerting only", duration: "12–24 months" },
  stage_3: { name: "Institutional Independence", role: "Read-only auditor", duration: "24–36 months" },
  stage_4: { name: "Sovereign Enterprise", role: "No platform role", duration: "Graduated" },
  graduated: { name: "Sovereign Enterprise", role: "No platform role", duration: "Graduated" },
};

export const STS_LEVELS = [
  { min: 90, name: "Constitutional Pillar", color: "#f4d676" },
  { min: 80, name: "Ecosystem Builder", color: "#d4af37" },
  { min: 65, name: "Trusted Contributor", color: "#c9a03d" },
  { min: 50, name: "Active Member", color: "#8a6d1f" },
  { min: 0, name: "Emerging Participant", color: "#6b5314" },
];

export function stsLevel(score: number) {
  return STS_LEVELS.find((l) => score >= l.min) ?? STS_LEVELS[STS_LEVELS.length - 1];
}

export const HEALTH_RATINGS = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC", "CC", "C"];

export const SECTORS: Record<string, { label: string; icon: string }> = {
  food: { label: "Food & Beverage", icon: "UtensilsCrossed" },
  manufacturing: { label: "Manufacturing", icon: "Factory" },
  tourism: { label: "Tourism & Hospitality", icon: "Palmtree" },
  technology: { label: "Technology", icon: "Cpu" },
  retail: { label: "Retail", icon: "ShoppingBag" },
  logistics: { label: "Logistics", icon: "Truck" },
  agriculture: { label: "Agriculture", icon: "Wheat" },
};

export const CONSTITUTIONAL_HASH = "0xB4F8D3E2F6A0B5D9E7F2A1C4B8E3D6A0F2C5B9E7D1A";

export const PROPOSAL_TYPES: Record<string, { label: string; threshold: number; cooling: string; voting: string }> = {
  budget: { label: "Budget >10%", threshold: 50, cooling: "48h", voting: "48h" },
  manager_appointment: { label: "Manager Appointment", threshold: 50, cooling: "24h", voting: "48h" },
  manager_removal: { label: "Manager Removal", threshold: 50, cooling: "48h", voting: "72h" },
  dividend: { label: "Dividend Declaration", threshold: 50, cooling: "7 days", voting: "24h" },
  constitutional_amendment: { label: "Constitutional Amendment", threshold: 75, cooling: "90 days", voting: "14 days" },
  graduation: { label: "Graduation", threshold: 75, cooling: "30 days", voting: "14 days" },
  consulting_optout: { label: "Consulting Opt-Out", threshold: 50, cooling: "14 days", voting: "7 days" },
  law_firm_replacement: { label: "Law Firm Replacement", threshold: 50, cooling: "14 days", voting: "7 days" },
  emergency_freeze: { label: "Emergency Freeze", threshold: 75, cooling: "0", voting: "24h" },
};

export const VITAL_SIGNS = [
  { key: "runway", label: "Runway", healthy: 12, alert: 6, unit: "mo", desc: "Law Firm Client Account / monthly burn" },
  { key: "revenueGrowth", label: "Revenue growth", healthy: 20, alert: 0, unit: "%", desc: "YoY" },
  { key: "grossMargin", label: "Gross margin", healthy: 30, alert: 15, unit: "%", desc: "(Rev − COGS)/Rev" },
  { key: "turnover", label: "Employee turnover", healthy: 15, alert: 25, unit: "%", desc: "Voluntary / 12mo", inverted: true },
  { key: "voteTurnout", label: "Vote turnout", healthy: 40, alert: 20, unit: "%", desc: "Votes cast / power" },
  { key: "nosi", label: "Social insurance", healthy: 100, alert: 90, unit: "%", desc: "NOSI registered" },
];
