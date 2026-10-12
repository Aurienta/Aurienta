// ROADMAP-03: Governance-as-a-Service (GaaS)
// ═══════════════════════════════════════════════════════════════════
// External organizations (cooperatives, NGOs, family offices, DAOs)
// register governance policies as hashed rule text + structured
// enforcementLogic ({threshold, quorum}). The Constitutional Runtime
// Engine (CRE) validates submitted decisions against the policy's
// enforcementLogic and emits a signed decision token.
//
// Pure technology infrastructure — AURIENTA does NOT manage funds,
// securities, or custody. Subscription pricing only (free / standard /
// enterprise). Decisions are CRE-enforced and hash-chained on the
// immutable ledger.
//
// Layered on top of:
//   - db.GaasOrganization (id, name, slug @unique, type, contactEmail,
//     subscriptionPlan, monthlyFeeEgp, active, createdAt)
//   - db.GaasPolicy (id, organizationId, name, ruleText, ruleHash,
//     enforcementLogic JSON string, active, createdAt)
//   - db.GaasDecision (id, organizationId, policyId, decisionText,
//     decisionHash, verdict, reason, decisionToken, actorEmail, createdAt)
//   - cre.enforceGaasDecision ({ ruleHash, decisionHash,
//     enforcementLogic: { threshold, quorum, approverCount } })
//   - cre.appendLedgerEvent (transactional, hash-chained)
//
// All exports are pure data-flow functions: read → CRE verdict → tx write →
// ledger event. The caller (API route / server component) is responsible
// for auth + HTTP response shaping + audit logging.

import { createHash } from "crypto";
import { db } from "@/lib/db";
import type { PrismaTransaction } from "@/lib/db";
import {
  appendLedgerEvent,
  enforceGaasDecision,
} from "@/lib/aurienta/cre";
import type { CreVerdict } from "@/lib/aurienta/cre";

// ── Types ──

export type SubscriptionPlan = "free" | "standard" | "enterprise";

export type OrganizationType =
  | "cooperative"
  | "ngo"
  | "family_office"
  | "dao"
  | "other";

export type Verdict = "allowed" | "denied" | "pending";

export type EnforcementLogic = {
  threshold: number; // 0–100 — approval ratio required
  quorum: number; // minimum approvers required to participate
};

export type GaasOrganizationRow = {
  id: string;
  name: string;
  slug: string;
  type: string;
  contactEmail: string;
  subscriptionPlan: string;
  monthlyFeeEgp: number;
  active: boolean;
  createdAt: Date;
};

export type GaasPolicyRow = {
  id: string;
  organizationId: string;
  name: string;
  ruleText: string;
  ruleHash: string;
  enforcementLogic: string; // JSON string of EnforcementLogic
  active: boolean;
  createdAt: Date;
};

export type GaasDecisionRow = {
  id: string;
  organizationId: string;
  policyId: string;
  decisionText: string;
  decisionHash: string;
  verdict: string; // "allowed" | "denied" | "pending"
  reason: string | null;
  decisionToken: string | null;
  actorEmail: string;
  createdAt: Date;
};

export type EvaluateDecisionResult = {
  decision: GaasDecisionRow;
  verdict: Verdict;
  reason: string | undefined;
  decisionToken: string | undefined;
  cre: CreVerdict;
};

// ── Pricing ──
// Pure subscription SaaS — flat monthly fee in EGP. NO commissions on
// assets, NO custody, NO revenue share. Uniform Fee (I 1.4) compliant.
export const PLAN_FEE_EGP: Record<SubscriptionPlan, number> = {
  free: 0,
  standard: 2500,
  enterprise: 10000,
};

export const ORGANIZATION_TYPES: readonly OrganizationType[] = [
  "cooperative",
  "ngo",
  "family_office",
  "dao",
  "other",
] as const;

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  "free",
  "standard",
  "enterprise",
] as const;

// ── slugify(name): lowercase hyphenated trim ──
// "Acme Cooperative (Cairo)" → "acme-cooperative-cairo"
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── hashRule(ruleText): SHA-256 hex ──
// Canonical content hash of the rule text. Stored on GaasPolicy.ruleHash
// and included in the CRE payload so any post-registration mutation is
// detectable.
export function hashRule(ruleText: string): string {
  return createHash("sha256").update(ruleText, "utf8").digest("hex");
}

// ── hashDecision(decisionText): SHA-256 hex ──
// Canonical content hash of the decision text. Paired with ruleHash in
// the CRE payload so the policy→decision binding is tamper-evident.
export function hashDecision(decisionText: string): string {
  return createHash("sha256").update(decisionText, "utf8").digest("hex");
}

// ── registerOrganization ──
// Creates a GaasOrganization row. Auto-derives slug from name; throws
// Prisma P2002 if the slug already exists (caller should surface a 409).
// monthlyFeeEgp is derived from subscriptionPlan via PLAN_FEE_EGP — never
// accepted from the client (uniform fee invariant).
export async function registerOrganization(params: {
  name: string;
  type: OrganizationType;
  contactEmail: string;
  subscriptionPlan: SubscriptionPlan;
}): Promise<GaasOrganizationRow> {
  const name = params.name.trim();
  const slug = slugify(name);
  const contactEmail = params.contactEmail.trim().toLowerCase();
  const monthlyFeeEgp = PLAN_FEE_EGP[params.subscriptionPlan];

  return db.gaasOrganization.create({
    data: {
      name,
      slug,
      type: params.type,
      contactEmail,
      subscriptionPlan: params.subscriptionPlan,
      monthlyFeeEgp,
      active: true,
    },
  });
}

// ── registerPolicy ──
// Creates a GaasPolicy row. Hashes the ruleText (SHA-256) and stores
// enforcementLogic as JSON.stringify({threshold, quorum}) so the CRE can
// re-derive the payload hash at decision time and detect tampering.
export async function registerPolicy(params: {
  organizationId: string;
  name: string;
  ruleText: string;
  enforcementLogic: EnforcementLogic;
}): Promise<GaasPolicyRow> {
  const name = params.name.trim();
  const ruleHash = hashRule(params.ruleText);
  const enforcementLogic = JSON.stringify({
    threshold: Math.floor(params.enforcementLogic.threshold),
    quorum: Math.floor(params.enforcementLogic.quorum),
  });

  return db.gaasPolicy.create({
    data: {
      organizationId: params.organizationId,
      name,
      ruleText: params.ruleText,
      ruleHash,
      enforcementLogic,
      active: true,
    },
  });
}

// ── evaluateDecision ──
// Loads the policy, parses its enforcementLogic JSON, hashes the decision
// text, and calls cre.enforceGaasDecision. The CRE verdict is then
// persisted as a GaasDecision row inside a db.$transaction together with
// a hash-chained ledger event (eventType='gaas_decision_evaluated'). The
// ledger event records the policy + decision hashes, the verdict, the
// approver count, the threshold/quorum, the CRE policy name, and the
// decision token — so any downstream tampering with the row is
// detectable via verifyLedgerChain().
//
// Returns { decision, verdict, reason, decisionToken, cre }. The caller
// is responsible for audit logging (the API route does this).
export async function evaluateDecision(params: {
  organizationId: string;
  policyId: string;
  decisionText: string;
  actorEmail: string;
  approverCount: number;
}): Promise<EvaluateDecisionResult> {
  // ── 1. Load + validate the policy ──
  const policy = await db.gaasPolicy.findUnique({
    where: { id: params.policyId },
  });
  if (!policy) {
    throw new Error("Policy not found");
  }
  if (policy.organizationId !== params.organizationId) {
    throw new Error("Policy does not belong to this organization");
  }
  if (!policy.active) {
    throw new Error("Policy is inactive — cannot evaluate decisions against it");
  }

  // ── 2. Parse enforcementLogic JSON (defence-in-depth) ──
  let parsed: { threshold?: unknown; quorum?: unknown };
  try {
    parsed = JSON.parse(policy.enforcementLogic);
  } catch {
    throw new Error("Policy enforcementLogic is malformed");
  }
  const threshold =
    typeof parsed.threshold === "number" && Number.isFinite(parsed.threshold)
      ? Math.max(0, Math.min(100, Math.floor(parsed.threshold)))
      : 0;
  const quorum =
    typeof parsed.quorum === "number" && Number.isFinite(parsed.quorum)
      ? Math.max(1, Math.floor(parsed.quorum))
      : 1;

  // ── 3. Hash the decision text ──
  const decisionHash = hashDecision(params.decisionText);
  const approverCount = Math.max(0, Math.floor(params.approverCount));

  // ── 4. Run the CRE policy ──
  const cre = enforceGaasDecision({
    ruleHash: policy.ruleHash,
    decisionHash,
    enforcementLogic: {
      threshold,
      quorum,
      approverCount,
    },
  });

  const verdict: Verdict = cre.allowed ? "allowed" : "denied";

  // ── 5. Persist the decision row + ledger event inside a transaction ──
  const decision = await db.$transaction(async (tx: PrismaTransaction) => {
    const row = await tx.gaasDecision.create({
      data: {
        organizationId: params.organizationId,
        policyId: params.policyId,
        decisionText: params.decisionText,
        decisionHash,
        verdict,
        reason: cre.reason ?? null,
        decisionToken: cre.decisionToken,
        actorEmail: params.actorEmail.trim().toLowerCase(),
      },
    });

    // Global hash chain (enterpriseId=null) — GaaS has no enterprise.
    // The event records everything needed to re-verify the verdict
    // offline: ruleHash, decisionHash, threshold, quorum, approverCount,
    // the CRE policy name, and the Ed25519 decision token.
    await appendLedgerEvent(tx, {
      enterpriseId: undefined,
      eventType: "gaas_decision_evaluated",
      payload: {
        organizationId: params.organizationId,
        policyId: params.policyId,
        decisionId: row.id,
        ruleHash: policy.ruleHash,
        decisionHash,
        verdict,
        reason: cre.reason ?? null,
        approverCount,
        threshold,
        quorum,
        policy: cre.policy,
        decisionToken: cre.decisionToken,
        actorEmail: params.actorEmail,
        note:
          "GaaS decision evaluated by CRE. Pure technology infrastructure — " +
          "no funds, no securities, no custody.",
      },
      actorId: undefined,
    });

    return row;
  });

  return {
    decision,
    verdict,
    reason: cre.reason,
    decisionToken: cre.decisionToken,
    cre,
  };
}

// ── listOrganizations ──
// Returns organizations visible to the caller.
//   - AURIENTA reps see ALL organizations (oversight role).
//   - Other callers see only organizations whose contactEmail matches
//     their own email.
// Mirrors the spec's "orgs where contactEmail matches OR all if empty"
// but uses the role flag (rather than empty-email sentinel) so the
// caller cannot elevate by submitting an empty string.
export async function listOrganizations(params: {
  id: string;
  email: string;
  isAurientaRep: boolean;
}): Promise<GaasOrganizationRow[]> {
  const where = params.isAurientaRep
    ? {}
    : { contactEmail: params.email.toLowerCase() };

  return db.gaasOrganization.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

// ── listPolicies(organizationId) ──
// All policies for an organization, newest-first.
export async function listPolicies(
  organizationId: string
): Promise<GaasPolicyRow[]> {
  return db.gaasPolicy.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

// ── listDecisions(organizationId) ──
// All decisions for an organization, newest-first.
export async function listDecisions(
  organizationId: string
): Promise<GaasDecisionRow[]> {
  return db.gaasDecision.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

// ── parseEnforcementLogic ──
// Safe parser for the JSON string stored on GaasPolicy.enforcementLogic.
// Returns the structural {threshold, quorum} shape or null if malformed.
// Used by the client component via the page.tsx mapper.
export function parseEnforcementLogic(
  raw: string
): EnforcementLogic | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed &&
      typeof parsed.threshold === "number" &&
      typeof parsed.quorum === "number"
    ) {
      return {
        threshold: parsed.threshold,
        quorum: parsed.quorum,
      };
    }
    return null;
  } catch {
    return null;
  }
}
