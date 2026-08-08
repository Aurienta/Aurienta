// Shared plain-shape types for the Syndicates workspace (serializable from server → client).

export type SyndicateEnterpriseForUi = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  sector: string;
  equityUnitPriceEgp: number;
  healthRating: string | null;
  healthScore: number;
  status: string;
};

export type SyndicateLeadForUi = {
  id: string;
  legalName: string;
  sovereignTrustScore: number;
  tier: string;
  avatarColor: string;
  primaryIntent: string | null;
};

export type SyndicateMemberForUi = {
  id: string;
  userId: string;
  equityUnits: number;
  amountEgp: number;
  joinedAt: string;
  legalName: string;
  sovereignTrustScore: number;
  avatarColor: string;
};

export type SyndicateForUi = {
  id: string;
  name: string;
  description: string | null;
  riskProfile: string;
  status: string;
  targetShares: number;
  committedShares: number;
  createdAt: string;
  enterprise: SyndicateEnterpriseForUi;
  leadPartner: SyndicateLeadForUi;
  members: SyndicateMemberForUi[];
  isMember: boolean;
  isLead: boolean;
};

export type EnterpriseForSyndicate = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  sector: string;
  equityUnitPriceEgp: number;
  healthRating: string | null;
  status: string;
};

export const RISK_PROFILES = [
  {
    key: "conservative",
    label: "Conservative",
    desc: "Lower-risk enterprises, health ≥ AA, law-firm-client-account-backed.",
  },
  {
    key: "balanced",
    label: "Balanced",
    desc: "Mixed tiers A–C with strong fundamentals.",
  },
  {
    key: "aggressive",
    label: "Aggressive",
    desc: "Growth-stage Tier C/D with higher upside.",
  },
  {
    key: "founder_aligned",
    label: "Founder-aligned",
    desc: "Mirror the founder's vesting schedule & milestones.",
  },
] as const;

export function riskMeta(key: string) {
  return (
    RISK_PROFILES.find((r) => r.key === key) ?? {
      key,
      label: key,
      desc: "",
    }
  );
}

export function statusMeta(status: string) {
  switch (status) {
    case "forming":
      return { label: "Forming", color: "#f4d676", pulse: true };
    case "active":
      return { label: "Active", color: "#34d399", pulse: false };
    case "completed":
      return { label: "Completed", color: "#a89f86", pulse: false };
    case "dissolved":
      return { label: "Dissolved", color: "#e0584b", pulse: false };
    default:
      return { label: status, color: "#a89f86", pulse: false };
  }
}

export function sectorLabel(sector: string) {
  const map: Record<string, string> = {
    food: "Food & Beverage",
    manufacturing: "Manufacturing",
    tourism: "Tourism",
    technology: "Technology",
    retail: "Retail",
    logistics: "Logistics",
    agriculture: "Agriculture",
  };
  return map[sector] ?? sector;
}
