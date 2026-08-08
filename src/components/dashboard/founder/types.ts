// Shared serializable types for the Founder Studio client components.
// The server page queries Prisma and passes plain data shaped by these types.

export type FounderEnterprise = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  sector: string;
  tier: string;
  stage: string;
  legalForm: string;
  healthRating: string | null;
  healthScore: number;
  fundraisingGoalEgp: number;
  raisedEgp: number;
  minParticipationEgp: number;
  investorCap: number | null;
  equityUnitPriceEgp: number;
  totalEquityUnits: number;
  founderEquityPct: number;
  platformFeePct: number;
  consultingFeePct: number;
  consultingOptOut: boolean;
  monthlyRevenueEgp: number;
  monthlyBurnEgp: number;
  lawFirmClientAccountBalanceEgp: number;
  grossMarginPct: number;
  revenueGrowthPct: number;
  employeeCount: number;
  nosiCompliantPct: number;
  status: string;
  graduationReadiness: number;
  createdAt: string;
  // related
  milestones: FounderMilestone[];
  investorCount: number;
  ledgerEvents: FounderLedgerEvent[];
};

export type FounderMilestone = {
  id: string;
  title: string;
  description: string;
  amountEgp: number;
  status: string; // pending, evidence_submitted, board_review, approved, released, rejected
  eveConfidence: number;
  evidenceNote: string | null;
  dueAt: string | null;
  releasedAt: string | null;
  createdAt: string;
};

export type FounderLedgerEvent = {
  id: string;
  eventType: string;
  payload: string; // JSON
  timestamp: string;
};

export type FounderStudioData = {
  enterprises: FounderEnterprise[];
  constitutionalHash: string;
};

// Wizard state shape.
export type WizardState = {
  name: string;
  tagline: string;
  description: string;
  sector: string;
  tier: string;
  fundraisingGoalEgp: string;
  equityUnitPriceEgp: string;
  investorCapEnabled: boolean;
  investorCap: string;
  feasibilityScore: number | null;
  feasibilityRun: boolean;
  feasibilityReport: FeasibilityReport | null;
  acceptedCharter: boolean;
};

// Blueprint §4.1.1 — Constitutional Evaluation Report
export type FeasibilityReport = {
  evaluationId: string;
  feasibilityScore: number;
  tierDViabilityScore: number | null;
  rawMandatoryScore: number;
  optionalBonus: number;
  sanityAdjustment: number;
  passed: boolean;
  stepBreakdown: Record<string, { name: string; status: string; score?: number; detail: string }>;
  aiJustifications: Record<string, string>;
  redFlags: string[];
  recommendations: string[];
  remediationPlan?: string[];
  timestamp: string;
};

export const INITIAL_WIZARD_STATE: WizardState = {
  name: "",
  tagline: "",
  description: "",
  sector: "",
  tier: "",
  fundraisingGoalEgp: "",
  equityUnitPriceEgp: "50",
  investorCapEnabled: false,
  investorCap: "",
  feasibilityScore: null,
  feasibilityRun: false,
  feasibilityReport: null,
  acceptedCharter: false,
};
