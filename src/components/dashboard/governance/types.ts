// Shared types for the Governance workspace.
// Server components fetch with Prisma, then serialize into these plain shapes
// before handing them to client components.

export type Choice = "for" | "against" | "abstain";

export type ProposalForUi = {
  id: string;
  enterpriseId: string;
  title: string;
  description: string;
  type: string; // key into PROPOSAL_TYPES
  status: string; // voting_open | executed | expired | rejected | published
  feeEgp: number;
  coolingEndsAt: string | null;
  votingEndsAt: string;
  quorumPct: number;
  passThreshold: number;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotingPower: number;
  aiRiskScore: number;
  aiRecommendation: string | null;
  aiConfidence: number;
  executedAt: string | null;
  createdAt: string;
  enterprise: {
    id: string;
    name: string;
    tier: string;
    slug: string;
    sector: string;
  };
  userVote?: {
    choice: Choice;
    votingPower: number;
    reason: string | null;
  } | null;
};

export type EnterpriseForUi = {
  id: string;
  name: string;
  tier: string;
  slug: string;
  userVotingPower: number; // Equity Units held by the user
  totalVotingPower: number; // total Equity Units outstanding
};

export type CouncilMemberForUi = {
  id: string;
  legalName: string;
  role: string;
  avatarColor: string;
  sovereignTrustScore: number;
  tier: string;
  primaryIntent: string | null;
  enterpriseName: string;
  enterpriseTier: string;
};

// AI risk bands — lower is better.
export function riskBand(score: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
  text: string;
} {
  if (score <= 30) {
    return {
      label: "Low",
      color: "#34d399",
      bg: "rgba(52, 211, 153, 0.12)",
      border: "rgba(52, 211, 153, 0.35)",
      text: "#34d399",
    };
  }
  if (score <= 60) {
    return {
      label: "Moderate",
      color: "#f4d676",
      bg: "rgba(244, 214, 118, 0.12)",
      border: "rgba(244, 214, 118, 0.35)",
      text: "#f4d676",
    };
  }
  return {
    label: "High",
    color: "#f87171",
    bg: "rgba(248, 113, 113, 0.12)",
    border: "rgba(248, 113, 113, 0.4)",
    text: "#f87171",
  };
}

export function recommendationLabel(r?: string | null): string {
  if (r === "approve") return "Approve";
  if (r === "review") return "Review";
  if (r === "reject") return "Reject";
  return "—";
}

export function statusMeta(status: string): {
  label: string;
  color: string;
  bg: string;
  border: string;
  pulse?: boolean;
} {
  switch (status) {
    case "voting_open":
      return {
        label: "Voting open",
        color: "#f4d676",
        bg: "rgba(244, 214, 118, 0.14)",
        border: "rgba(244, 214, 118, 0.4)",
        pulse: true,
      };
    case "executed":
      return {
        label: "Executed",
        color: "#34d399",
        bg: "rgba(52, 211, 153, 0.12)",
        border: "rgba(52, 211, 153, 0.35)",
      };
    case "rejected":
      return {
        label: "Rejected",
        color: "#f87171",
        bg: "rgba(248, 113, 113, 0.12)",
        border: "rgba(248, 113, 113, 0.35)",
      };
    case "expired":
      return {
        label: "Expired",
        color: "#9ca3af",
        bg: "rgba(156, 163, 175, 0.10)",
        border: "rgba(156, 163, 175, 0.3)",
      };
    case "published":
      return {
        label: "Cooling",
        color: "#d4af37",
        bg: "rgba(212, 175, 55, 0.10)",
        border: "rgba(212, 175, 55, 0.3)",
      };
    default:
      return {
        label: status.replace(/_/g, " "),
        color: "#9ca3af",
        bg: "rgba(156, 163, 175, 0.10)",
        border: "rgba(156, 163, 175, 0.3)",
      };
  }
}

// Has the voting window ended?
export function isExpired(votingEndsAt: string): boolean {
  return new Date(votingEndsAt).getTime() <= Date.now();
}
