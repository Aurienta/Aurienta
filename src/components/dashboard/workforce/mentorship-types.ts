// Shared types for the Mentorship workspace.

export type MentorForUi = {
  id: string;
  legalName: string;
  sovereignTrustScore: number;
  tier: string;
  avatarColor: string;
  primaryIntent: string | null;
  enterprise: {
    id: string;
    name: string;
    sector: string;
    tier: string;
  } | null;
};

export type MenteeForUi = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  sector: string;
  stage: string;
  founder: {
    id: string;
    legalName: string;
    sovereignTrustScore: number;
    avatarColor: string;
    tier: string;
  };
};

export type ActiveMentorshipForUi = {
  id: string;
  status: string;
  equityGrantPct: number;
  focusAreas: string[];
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  role: "mentor" | "mentee";
  mentor: {
    id: string;
    legalName: string;
    sovereignTrustScore: number;
    avatarColor: string;
    tier: string;
  };
  menteeEnterprise: {
    id: string;
    name: string;
    slug: string;
    tier: string;
    sector: string;
    stage: string;
    founder: { id: string; legalName: string; avatarColor: string };
  };
};

export type AiMatchForMentorship = {
  mentorId: string;
  menteeEnterpriseId: string;
  matchScore: number;
  rationale: string;
};

export const FOCUS_AREA_OPTIONS = [
  "Operations",
  "Capital Strategy",
  "Governance",
  "Compliance",
  "Financial Reporting",
  "Technology",
  "Go-to-Market",
  "Talent & NOSI",
  "Capital Formation",
  "Graduation Readiness",
] as const;

export function statusMeta(status: string) {
  switch (status) {
    case "proposed":
      return { label: "Proposed", color: "#f4d676", pulse: true };
    case "active":
      return { label: "Active", color: "#34d399", pulse: false };
    case "completed":
      return { label: "Completed", color: "#a89f86", pulse: false };
    case "declined":
      return { label: "Declined", color: "#e0584b", pulse: false };
    default:
      return { label: status, color: "#a89f86", pulse: false };
  }
}
