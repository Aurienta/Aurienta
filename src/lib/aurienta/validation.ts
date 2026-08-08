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
