// AURIENTA request validation — Zod schemas for every public API surface.
// One source of truth: handlers import { schema, parseBody } and get a typed
// result or a 400 with a structured error body.

import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// ── Auth ──
// `password` accepts an empty string so the demo sign-in flow (which sends
// `{ email }` or `{ email, password: "" }`) can pass validation. The auth
// route treats an absent/empty password as a demo sign-in request when
// ALLOW_DEMO_SIGNIN=true.
export const authSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().max(256).optional(),
  action: z.enum(["signout"]).optional(),
});

// ── Registration ──
// Mirrors the User model's identity columns. verificationLevel defaults to L1
// (email/mobile verified) — KYC (L2+) is a separate upgrade flow.
export const registerSchema = z.object({
  email: z.string().email().max(254),
  mobile: z
    .string()
    .min(8)
    .max(20)
    .regex(/^[+\d\s()-]+$/, "Enter a valid mobile number"),
  legalName: z.string().min(2).max(120),
  password: z.string().min(8, "Password must be at least 8 characters").max(256),
  nationalIdLast4: z
    .string()
    .length(4)
    .regex(/^\d{4}$/, "Last 4 of national ID must be 4 digits")
    .optional(),
  verificationLevel: z.enum(["L0", "L1", "L2", "L3", "L4"]).default("L1"),
  nationality: z.string().max(8).default("EG"),
  primaryIntent: z
    .enum(["capital_partner", "founding_operator", "workforce_partner", "institution"])
    .optional(),
});

// ── Proposal (governance) ──
export const proposalSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(8000),
  type: z.string().min(1).max(64),
  votingDurationHours: z.number().int().min(1).max(336).optional(),
});

// ── Vote ──
export const voteSchema = z.object({
  choice: z.enum(["for", "against", "abstain"]),
  reason: z.string().max(1000).optional(),
  votingPower: z.number().int().min(1).optional(),
});

// ── Expense ──
export const expenseSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  amountEgp: z.number().int().min(1).max(1_000_000_000),
  category: z.string().min(1).max(64),
  description: z.string().min(3).max(1000),
  vendorName: z.string().max(200).optional(),
  receiptCid: z.string().max(100).optional(),
});

// ── Trade order ──
export const orderSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  side: z.enum(["buy", "sell"]),
  phase: z.enum(["phase_1", "phase_2", "phase_3"]),
  shares: z.number().int().min(1).max(10_000_000),
  priceEgp: z.number().min(0.01).max(1_000_000),
});

// ── Enterprise (founder wizard) ──
export const enterpriseSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "slug must be lowercase + dashes"),
  tagline: z.string().max(200).optional(),
  description: z.string().min(20).max(6000),
  sector: z.string().min(1).max(40),
  tier: z.enum(["A", "B", "C", "D", "E", "F"]),
  fundraisingGoalEgp: z.number().int().min(50_000).max(500_000_000),
  equityUnitPriceEgp: z.number().int().min(1).max(100_000),
  totalEquityUnits: z.number().int().min(1).max(1_000_000_000),
  founderEquityPct: z.number().min(0).max(100).optional(),
});

// ── Reservation ──
export const reservationSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  shares: z.number().int().min(1).max(1_000_000),
  amountEgp: z.number().int().min(50).max(50_000_000),
});

// ── Whistleblower report ──
export const whistleblowerSchema = z.object({
  enterpriseId: z.string().max(64).optional(),
  category: z.enum([
    "conflict_of_interest",
    "threshold_gaming",
    "fraud",
    "discrimination",
    "safety_violation",
    "regulatory_breach",
    "other",
  ]),
  description: z.string().min(20).max(8000),
  attachmentsCid: z.string().max(100).optional(),
});

// ── Appeal case ──
export const appealSchema = z.object({
  enterpriseId: z.string().max(64).optional(),
  caseType: z.enum([
    "expense_dispute",
    "vote_challenge",
    "manager_removal",
    "graduation_dispute",
    "charter_amendment",
    "other",
  ]),
  description: z.string().min(20).max(8000),
});

// ── Risk disclosure ──
export const riskDisclosureSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  amountEgp: z.number().int().min(50).max(50_000_000),
  riskProfile: z.enum(["conservative", "balanced", "aggressive", "founder_aligned"]),
  stressScenario: z.string().max(200).optional(),
});

// ── Copilot chat ──
export const copilotSchema = z.object({
  message: z.string().min(1).max(8000),
  enterpriseId: z.string().max(64).optional(),
  conversationId: z.string().max(64).optional(),
});

// ── Explain number ──
export const explainSchema = z.object({
  label: z.string().min(1).max(120),
  value: z.union([z.string().max(200), z.number()]),
  enterpriseId: z.string().max(64).optional(),
});

// ── DRIP enroll / update ──
// Note: reinvestPct + action are validated separately in the route handler
// because the DRIP endpoint supports enroll / unenroll / update actions on
// the same body. This schema covers the bare minimum common fields.
export const dripSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  reinvestPct: z.number().min(0).max(100).optional(),
  action: z.enum(["enroll", "unenroll", "update"]),
});

// ── Diaspora Participation Bridge ──
export const diasporaSchema = z.object({
  countryOfResidence: z.enum(["UAE", "UK", "US", "Canada", "Saudi Arabia", "Other"]),
  remittanceIntentEgp: z.number().int().min(0).max(50_000_000),
  preferredLanguage: z.enum(["en", "ar", "fr", "sw"]),
  sourceOfFundsDeclared: z.literal(true),
});

// ── Syndicate formation ──
export const syndicateSchema = z.object({
  name: z.string().min(2).max(120),
  enterpriseId: z.string().min(1).max(64),
  targetShares: z.number().int().min(1).max(10_000_000),
  riskProfile: z.enum(["conservative", "balanced", "aggressive", "founder_aligned"]).optional(),
  description: z.string().max(1200).optional(),
});

// ── Syndicate join ──
export const syndicateJoinSchema = z.object({
  shares: z.number().int().min(1).max(10_000_000),
  amount: z.number().int().min(0).max(500_000_000).optional(),
});

// ── Mentorship proposal ──
// Used by both the founder-request path (menteeEnterpriseId + focusAreas) and
// the mentor-offer path (mentorId + menteeEnterpriseId + focusAreas).
export const mentorshipSchema = z.object({
  menteeEnterpriseId: z.string().min(1).max(64),
  mentorId: z.string().min(1).max(64).optional(),
  focusAreas: z.array(z.string().min(1).max(80)).max(6).optional(),
});

// ── Skill-to-Equity claim ──
export const skillEquitySchema = z.object({
  employeeId: z.string().min(1).max(64),
  credentialType: z.enum([
    "certification",
    "degree",
    "training_course",
    "professional_license",
  ]),
  credentialName: z.string().min(1).max(200),
  issuer: z.string().min(1).max(200),
  credentialId: z.string().max(120).optional(),
  issueDate: z.string().min(1).max(40),
  documentName: z.string().min(1).max(200),
  documentMime: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  documentSizeBytes: z.number().int().min(1).max(20 * 1024 * 1024),
});

// ── IPFS evidence upload ──
export const evidenceSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  milestoneId: z.string().min(1).max(64).nullable().optional(),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(127),
  sizeBytes: z.number().int().min(1).max(250 * 1024 * 1024),
  description: z.string().max(1000).nullable().optional(),
});

// ── Employee enroll / equity update ──
// Two modes are supported on the same route (detected at runtime by which
// fields are present), so all fields are optional and the route handler does
// the mode-specific required-field checks. The schema still enforces type +
// length + range constraints on every field individually.
export const employeeSchema = z
  .object({
    // Mode 1 — update equity conversion
    employeeId: z.string().min(1).max(64).optional(),
    equityConversionPct: z.number().min(0).max(10).optional(),
    // Mode 2 — enroll new employee
    enterpriseId: z.string().min(1).max(64).optional(),
    userId: z.string().min(1).max(64).optional(),
    email: z.string().email().max(254).optional(),
    position: z.string().min(1).max(120).optional(),
    department: z.string().min(1).max(120).optional(),
    monthlySalaryEgp: z.union([z.number(), z.string()]).optional(),
    compensationBand: z.string().max(120).optional(),
    employmentType: z.string().max(40).optional(),
  })
  .passthrough();

// ── Milestone evidence submission ──
export const milestoneEvidenceSchema = z.object({
  milestoneId: z.string().min(1).max(64),
  evidenceNote: z.string().min(12).max(5000),
});

/**
 * parseBody — wraps schema.safeParse, returns either the typed value or
 * responds with a structured 400 error.  Handlers do:
 *
 *   const body = await parseBody(req, proposalSchema);
 *   if (body instanceof NextResponse) return body;
 *   // body is now typed
 */
export async function parseBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T | NextResponse> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body must be valid JSON" },
      { status: 400 }
    );
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return NextResponse.json(
      {
        error: "invalid_body",
        message: "Request body failed validation",
        issues: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }
  return result.data;
}

// ── Trade instrument schema (for /api/trade-instruments) ──
export const tradeInstrumentSchema = z.object({
  enterpriseId: z.string().min(1, "Enterprise ID is required"),
  symbol: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  tier: z.string().min(1),
  bankPartnerId: z.string().optional(),
  type: z.string().optional(),
  currency: z.string().optional(),
  instrumentNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  status: z.string().optional(),
  underlyingRule: z.string().optional(),
  amount: z.number().optional(),
  counterparty: z.string().optional(),
  counterpartyCountry: z.string().optional(),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  incoterms: z.string().optional(),
  hsCode: z.string().optional(),
});

// ── Export readiness schema (for /api/export-readiness) ──
export const exportReadinessSchema = z.object({
  enterpriseId: z.string().min(1, "Enterprise ID is required"),
  market: z.string().min(1).max(100),
  productDescription: z.string().min(1).max(2000),
  hsCode: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

// ── Trade document schema (for /api/trade-documents) ──
export const tradeDocumentSchema = z.object({
  enterpriseId: z.string().min(1, "Enterprise ID is required"),
  documentType: z.enum(["commercial_invoice", "packing_list", "certificate_of_origin", "bill_of_lading", "other"]),
  documentNumber: z.string().min(1).max(100),
  tradeInstrumentId: z.string().optional(),
  issueDate: z.string().optional(),
  ipfsCid: z.string().optional(),
  type: z.string().optional(),
  nafezaAciNumber: z.string().optional(),
  issuingAuthority: z.string().optional(),
  contentHash: z.string().optional(),
  verified: z.boolean().optional(),
  currency: z.string().optional(),
  amount: z.number().optional(),
});

// ── Screening schema (for /api/screening) ──
export const screeningSchema = z.object({
  enterpriseId: z.string().min(1, "Enterprise ID is required"),
  screeningType: z.enum(["aml", "sanctions", "pep", "adverse_media"]),
  searchTerm: z.string().min(1).max(500),
  counterpartyName: z.string().optional(),
  counterpartyCountry: z.string().optional(),
  provider: z.string().optional(),
  listsChecked: z.array(z.string()).optional(),
  hits: z.number().optional(),
  hitDetails: z.string().optional(),
  resolution: z.string().optional(),
});

// ── Profit-Sharing Agreement (ROADMAP-02) ──
// Constitutional CONTRACT (not a security). No fixed coupon, no secondary
// market, no trading. CRE enforces distribution from enterprise revenue.
// Compliant with Egyptian Capital Market Law 95/1992 (contractual profit-share,
// not a tradable instrument).
export const profitShareCreateSchema = z.object({
  enterpriseId: z.string().min(1, "Enterprise is required").max(64),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  contributionEgp: z.number().int().min(50, "Minimum contribution is 50 EGP").max(500_000_000),
  profitSharePct: z.number().min(1, "Profit share must be at least 1%").max(30, "Profit share cannot exceed 30%"),
  termMonths: z.number().int().min(1, "Term must be at least 1 month").max(60, "Term cannot exceed 60 months"),
});

// PATCH body for /api/profit-sharing/[agreementId]
// action = "terminate" sets the agreement status to "terminated".
export const profitSharePatchSchema = z.object({
  action: z.enum(["terminate"]),
  reason: z.string().max(500).optional(),
});

// ── STS Priority Window Allocation (ROADMAP-11) ──
// Deterministic, STS-weighted priority access to capital formation rounds.
// NOT a lottery — compliant with Egyptian Gambling Law 10/1956.
// POST body for /api/priority-allocation — register interest in a phase.
export const priorityAllocationRegisterSchema = z.object({
  enterpriseId: z.string().min(1, "Enterprise is required").max(64),
  windowPhase: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

// PATCH body for /api/priority-allocation/[allocationId] — execute allocation
// (manager only). Sets allocatedEgp + allocatedAt=now.
export const priorityAllocationExecuteSchema = z.object({
  amountEgp: z.number().int().min(0, "Amount must be a non-negative integer").max(500_000_000),
});

// GET query params for /api/priority-allocation/rankings
export const priorityAllocationRankingsQuerySchema = z.object({
  enterpriseId: z.string().min(1, "Enterprise is required").max(64),
  windowPhase: z
    .union([z.literal("1"), z.literal("2"), z.literal("3")])
    .transform((v) => Number.parseInt(v, 10) as 1 | 2 | 3),
});

// ─── REC-1: Constitutional Takaful Pool ──────────────────────────────
// POST /api/takaful/claims — submit a new claim against the pool.
export const takafulClaimSubmitSchema = z.object({
  enterpriseId: z.string().min(1, "Enterprise is required").max(64),
  claimType: z.enum([
    "milestone_failure",
    "supply_disruption",
    "force_majeure",
    "key_person_loss",
  ]),
  description: z.string().min(10, "Description must be at least 10 characters").max(8000),
  amountRequested: z
    .number()
    .int("Amount must be an integer")
    .min(1, "Amount must be positive")
    .max(500_000, "Amount exceeds 500,000 EGP cap"),
  evidenceCid: z.string().max(200).optional(),
});

// PATCH /api/takaful/claims/[claimId]
// action = "approve" (AURIENTA Rep sets amountApproved)
// action = "pay"      (law firm disburses from escrow)
export const takafulClaimPatchSchema = z.object({
  action: z.enum(["approve", "pay"]),
  amountApproved: z
    .number()
    .int("Approved amount must be an integer")
    .min(1, "Approved amount must be positive")
    .max(500_000, "Approved amount exceeds 500,000 EGP cap")
    .optional(),
}).refine(
  (v) => v.action !== "approve" || (typeof v.amountApproved === "number"),
  { message: "amountApproved is required when action is 'approve'" }
);

// ─── REC-3: Constitutional Supply Chain Finance ──────────────────────
// POST /api/supply-chain/advances — request a new milestone advance.
export const supplyChainAdvanceRequestSchema = z.object({
  enterpriseId: z.string().min(1, "Enterprise is required").max(64),
  milestoneId: z.string().max(64).optional(),
  advanceAmountEgp: z
    .number()
    .int("Amount must be an integer")
    .min(1, "Amount must be positive")
    .max(100_000_000, "Amount exceeds 100M EGP sanity cap"),
  constitutionalRate: z
    .number()
    .min(0, "Rate cannot be negative")
    .max(8, "Constitutional rate cannot exceed 8% APR"),
  termDays: z.number().int().min(1, "Term must be at least 1 day").max(365, "Term cannot exceed 365 days"),
});

// PATCH /api/supply-chain/advances/[advanceId]
// action = "fund"  (capital partner wires principal through escrow)
// action = "repay" (enterprise repays principal + interest through escrow)
export const supplyChainAdvancePatchSchema = z.object({
  action: z.enum(["fund", "repay"]),
});

// ─── STAGE A: Dividend Distribution ──────────────────────────────────
// POST /api/dividends — declare a new dividend distribution.
export const dividendDeclareSchema = z.object({
  enterpriseId: z.string().min(1, "Enterprise is required").max(64),
  totalDividendEgp: z
    .number()
    .int("Total dividend must be an integer")
    .min(1, "Total dividend must be positive")
    .max(1_000_000_000, "Total dividend exceeds 1B EGP sanity cap"),
  perShareDividendEgp: z
    .number()
    .min(0, "Per-share dividend cannot be negative")
    .max(1_000_000, "Per-share dividend exceeds sanity cap"),
  partnerCount: z
    .number()
    .int("Partner count must be an integer")
    .min(1, "Partner count must be at least 1")
    .max(1_000_000, "Partner count exceeds sanity cap"),
});

// PATCH /api/dividends/[distributionId]
// action = "pay" (law firm disburses the dividend to capital partners)
export const dividendPatchSchema = z.object({
  action: z.enum(["pay"]),
});

// ─── STAGE A: Secondary Market Trade Matching ────────────────────────
// POST /api/trades/match — trigger a matching pass for an enterprise.
export const tradeMatchSchema = z.object({
  enterpriseId: z.string().min(1, "Enterprise is required").max(64),
});

// ════════════════════════════════════════════════════════════════════
// AURIENTA ERP — Zod schemas
// ════════════════════════════════════════════════════════════════════

// ── Projects ──
export const erpProjectCreateSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  description: z.string().min(3).max(8000),
  type: z.enum(["internal", "client", "r_and_d", "construction", "manufacturing"]).default("internal"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budgetEgp: z.number().int().min(0).max(1_000_000_000).default(0),
  managerId: z.string().max(64).optional(),
  clientId: z.string().max(64).optional(),
});

export const erpProjectListSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  status: z.string().max(40).optional(),
  priority: z.string().max(40).optional(),
});

export const erpProjectPatchSchema = z.object({
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]),
});

// ── Tasks ──
export const erpTaskCreateSchema = z.object({
  projectId: z.string().min(1).max(64),
  parentId: z.string().max(64).optional(),
  title: z.string().min(2).max(200),
  description: z.string().max(4000).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  assigneeId: z.string().max(64).optional(),
  estimatedHours: z.number().min(0).max(10000).default(0),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.string().max(500).optional(),
});

export const erpTaskPatchSchema = z.object({
  status: z.enum(["todo", "in_progress", "review", "done", "blocked"]),
});

// ── Resources ──
export const erpResourceCreateSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  name: z.string().min(2).max(200),
  type: z.enum(["human", "equipment", "material", "facility", "financial"]),
  category: z.string().min(1).max(120),
  capacity: z.number().min(0).max(1_000_000).default(1),
  costPerUnitEgp: z.number().min(0).max(1_000_000).default(0),
  unit: z.string().max(40).default("hour"),
  location: z.string().max(200).optional(),
  skills: z.string().max(500).optional(),
});

export const erpResourceAllocateSchema = z.object({
  projectId: z.string().max(64).optional(),
  taskId: z.string().max(64).optional(),
  quantity: z.number().min(0.01).max(1_000_000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

// ── Timesheets ──
export const erpTimesheetCreateSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  projectId: z.string().max(64).optional(),
  taskId: z.string().max(64).optional(),
  date: z.string().datetime(),
  hours: z.number().min(0.1).max(24),
  description: z.string().min(2).max(2000),
  billable: z.boolean().default(false),
  hourlyRateEgp: z.number().min(0).max(100000).default(0),
});

export const erpTimesheetPatchSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

// ── Inventory ──
export const erpInventoryCreateSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  sku: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(80),
  unit: z.string().max(40).default("piece"),
  reorderPoint: z.number().min(0).max(1_000_000).default(0),
  maxStock: z.number().min(0).max(1_000_000).default(0),
  costPerUnitEgp: z.number().min(0).max(1_000_000).default(0),
  sellPriceEgp: z.number().min(0).max(1_000_000).default(0),
  warehouseLocation: z.string().max(200).optional(),
  barcode: z.string().max(100).optional(),
  supplierId: z.string().max(64).optional(),
});

export const erpInventoryMovementSchema = z.object({
  type: z.enum(["in", "out"]),
  quantity: z.number().min(0.01).max(1_000_000),
  reference: z.string().min(1).max(200),
});

// ── Purchase Orders ──
export const erpPurchaseOrderCreateSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  vendorId: z.string().max(64).optional(),
  vendorName: z.string().min(1).max(200),
  expectedDate: z.string().datetime().optional(),
  projectId: z.string().max(64).optional(),
  notes: z.string().max(2000).optional(),
  lines: z.array(
    z.object({
      description: z.string().min(1).max(500),
      inventoryId: z.string().max(64).optional(),
      quantity: z.number().min(0.01).max(1_000_000),
      unit: z.string().max(40).default("piece"),
      unitPriceEgp: z.number().min(0).max(1_000_000),
    })
  ).min(1, "At least one line item is required").max(100),
});

export const erpPurchaseOrderPatchSchema = z.object({
  action: z.enum(["approve", "receive"]),
});

// ── Assets ──
export const erpAssetCreateSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  name: z.string().min(2).max(200),
  category: z.enum(["equipment", "vehicle", "property", "software", "furniture"]),
  acquisitionDate: z.string().datetime(),
  acquisitionCostEgp: z.number().int().min(0).max(1_000_000_000),
  depreciationMethod: z.enum(["straight_line", "declining_balance", "none"]).default("straight_line"),
  depreciationRate: z.number().min(0).max(1).default(0.1),
  location: z.string().max(200).optional(),
  assignedTo: z.string().max(64).optional(),
  warrantyExpiry: z.string().datetime().optional(),
  insuranceExpiry: z.string().datetime().optional(),
});

export const erpAssetPatchSchema = z.object({
  action: z.enum(["dispose", "depreciate"]),
});

// ── Production Orders ──
export const erpProductionOrderCreateSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  productId: z.string().max(64).optional(),
  productName: z.string().min(1).max(200),
  quantity: z.number().min(0.01).max(1_000_000),
  unit: z.string().max(40).default("piece"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  projectId: z.string().max(64).optional(),
});

export const erpProductionOrderPatchSchema = z.object({
  action: z.enum(["release", "complete"]),
  completedQty: z.number().min(0).max(1_000_000).optional(),
  bom: z.array(
    z.object({
      inventoryId: z.string().min(1).max(64),
      description: z.string().min(1).max(500),
      quantityRequired: z.number().min(0.01).max(1_000_000),
      unit: z.string().max(40).default("piece"),
      costPerUnitEgp: z.number().min(0).max(1_000_000).optional(),
    })
  ).max(100).optional(),
}).refine(
  (v) => v.action !== "complete" || (typeof v.completedQty === "number"),
  { message: "completedQty is required when action is 'complete'" }
);

// ── Quality Checks ──
export const erpQualityCheckCreateSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  productionOrderId: z.string().max(64).optional(),
  projectId: z.string().max(64).optional(),
  inventoryId: z.string().max(64).optional(),
  checkType: z.enum(["incoming", "in_process", "final", "audit"]),
  description: z.string().min(2).max(2000),
  inspectorId: z.string().max(64).optional(),
  minPassRate: z.number().min(0).max(100).default(90),
});

export const erpQualityCheckResultSchema = z.object({
  passRate: z.number().min(0).max(100),
  defects: z.number().int().min(0).max(1_000_000),
  notes: z.string().max(4000),
});
