// Shared types for the Career Ledger UI.

export type CareerEnterpriseForUi = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  sector: string;
};

export type CareerEntryForUi = {
  id: string;
  enterpriseId: string;
  role: string;
  entryType: string; // milestone, contribution, promotion, equity_grant, training
  title: string;
  description: string;
  vcCid: string | null;
  vcIssuedAt: string;
  valueEgp: number | null;
  metadata: Record<string, unknown>;
  enterprise: CareerEnterpriseForUi;
};

export const ENTRY_TYPE_META: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  milestone: { label: "Milestone", icon: "Flag", color: "#818CF8" },
  contribution: { label: "Contribution", icon: "HandCoins", color: "#4F46E5" },
  promotion: { label: "Promotion", icon: "TrendingUp", color: "#34d399" },
  equity_grant: { label: "Equity Grant", icon: "Award", color: "#818CF8" },
  training: { label: "Training", icon: "GraduationCap", color: "#6366F1" },
};

export function entryMeta(key: string) {
  return (
    ENTRY_TYPE_META[key] ?? {
      label: key,
      icon: "Circle",
      color: "#a89f86",
    }
  );
}
