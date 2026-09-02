import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PROPOSAL_TYPES } from "@/lib/aurienta/constants";
import { appendLedgerEvent, enforceConsultingOptOut, enforceDividendLock, enforceLawFirmReplacement } from "@/lib/aurienta/cre";
import { proposalSchema, parseBody } from "@/lib/aurienta/validation";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

// Parse durations like "48h", "14 days", "7 days", "0".
function parseDuration(input: string): number {
  if (!input || input === "0") return 0;
  const m = input.match(/^(\d+)\s*(h|hours?|d|days?|m|mins?|min)$/i);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("h")) return n * 3_600_000;
  if (unit.startsWith("d")) return n * 86_400_000;
  if (unit.startsWith("m")) return n * 60_000;
  return 0;
}

// Proposal types that require board-member role to create (CTO-AUDIT P0 governance).
const BOARD_ONLY_TYPES = new Set(["constitutional_amendment", "emergency_freeze"]);

// POST /api/proposals — create a constitutional proposal.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // ── Rate limit ──
  const rl = limiters.governance(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  // ── Validate body ──
  const body = await parseBody(req, proposalSchema);
  if (body instanceof NextResponse) return body;
  const { enterpriseId, type, title, description } = body;

  const meta = PROPOSAL_TYPES[type];
  if (!meta) {
    return NextResponse.json({ error: "Invalid proposal type", code: "invalid_body" }, { status: 400 });
  }

  // Validate membership — the user must belong to the enterprise.
  const userMemberships = user.memberships.filter((m) => m.enterpriseId === enterpriseId);
  if (userMemberships.length === 0) {
    return NextResponse.json(
      { error: "Not a member of this enterprise", code: "forbidden" },
      { status: 403 }
    );
  }

  // ── RBAC: constitutional_amendment + emergency_freeze require board_member ──
  // (Per blueprint: 25% voting power or board seat — using board_member for simplicity.)
  const userRoles = userMemberships.map((m) => m.role);
  if (BOARD_ONLY_TYPES.has(type) && !userRoles.includes("board_member")) {
    await audit({
      actorId: user.id,
      action: "proposal.create",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "board_member_required",
      metadata: { type, userRoles },
    });
    return NextResponse.json(
      {
        error: `Proposal type '${type}' requires board_member role.`,
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    include: {
      quarterlyReports: {
        orderBy: { year: "asc" },
        take: 6,
        select: { netProfitEgp: true },
      },
    },
  });
  if (!enterprise) {
    return NextResponse.json({ error: "Enterprise not found", code: "not_found" }, { status: 404 });
  }

  // ── CRE: consulting_optout prerequisites (3 profitable quarters OR 2 years) ──
  if (type === "consulting_optout") {
    const optout = enforceConsultingOptOut(enterprise);
    if (!optout.allowed) {
      await audit({
        actorId: user.id,
        action: "proposal.create",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: optout.reason,
        metadata: { policy: optout.policy, type },
      });
      return NextResponse.json(
        {
          error: optout.reason ?? "Consulting opt-out prerequisites not met",
          code: "cre_denied",
          policy: optout.policy,
          decisionToken: optout.decisionToken,
        },
        { status: 400 }
      );
    }
  }

  // ── CRE: dividend_lock — dividends paid from realized profits only ──
  // At proposal creation we verify the enterprise has positive retained
  // earnings (sum of quarterly net profits). The dividend amount is not
  // carried on the proposal body, so we probe with a minimal amount of 1 EGP
  // — this enforces realizedProfits ≥ 1 (i.e. positive). The 30-day cooling
  // check is skipped here (lastDividendAt unknown at creation time) and is
  // enforced at execution instead.
  if (type === "dividend") {
    const realizedProfits = enterprise.quarterlyReports.reduce(
      (sum, q) => sum + (q.netProfitEgp ?? 0),
      0
    );
    const dividendLock = enforceDividendLock({
      dividendAmount: 1,
      realizedProfits,
      lastDividendAt: null,
    });
    if (!dividendLock.allowed) {
      await audit({
        actorId: user.id,
        action: "proposal.create",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: dividendLock.reason,
        metadata: { policy: dividendLock.policy, type, realizedProfits },
      });
      return NextResponse.json(
        {
          error: dividendLock.reason ?? "Dividend blocked by dividend_lock policy",
          code: "cre_denied",
          policy: dividendLock.policy,
          decisionToken: dividendLock.decisionToken,
        },
        { status: 400 }
      );
    }
  }

  // ── CRE: law_firm_replacement — a qualifying replacement must exist ──
  // The proposal body does not carry a target law-firm ID, so we verify that
  // at least one active law firm (other than the enterprise's current firm)
  // meets the constitutional bar: active, licensed, insured ≥100M EGP,
  // expertise ≥75. If no qualifying candidate exists, the replacement
  // proposal is premature and blocked.
  if (type === "law_firm_replacement") {
    const candidates = await db.lawFirm.findMany({
      where: {
        status: "active",
        ...(enterprise.lawFirmId ? { id: { not: enterprise.lawFirmId } } : {}),
      },
      take: 20,
    });
    const validCandidate = candidates.find((f) =>
      enforceLawFirmReplacement({
        status: f.status,
        frLicenseNumber: f.frLicenseNumber,
        insuranceEgp: f.insuranceEgp,
        expertiseScore: f.expertiseScore,
      }).allowed
    );
    if (!validCandidate) {
      const sample = candidates[0]
        ? enforceLawFirmReplacement({
            status: candidates[0].status,
            frLicenseNumber: candidates[0].frLicenseNumber,
            insuranceEgp: candidates[0].insuranceEgp,
            expertiseScore: candidates[0].expertiseScore,
          })
        : null;
      await audit({
        actorId: user.id,
        action: "proposal.create",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: sample?.reason ?? "No qualifying replacement law firm available",
        metadata: {
          policy: sample?.policy ?? "law_firm_replacement.rego",
          type,
          candidatesChecked: candidates.length,
        },
      });
      return NextResponse.json(
        {
          error: sample?.reason ?? "No qualifying replacement law firm available",
          code: "cre_denied",
          policy: sample?.policy ?? "law_firm_replacement.rego",
          decisionToken: sample?.decisionToken,
        },
        { status: 400 }
      );
    }
  }

  // ── manager_appointment: police clearance is enforced at EXECUTION, not creation ──
  // The target user (and their police-clearance status) is not known at proposal
  // creation time. We allow creation here; the executor of an approved
  // manager_appointment proposal MUST call enforcePoliceClearance("manager",
  // targetUser.policeClearanceValid, targetUser.policeClearanceExpiresAt) before
  // binding the manager role. See the executor hook in the proposals/[id]/execute route.

  const now = Date.now();
  const coolingMs = parseDuration(meta.cooling);
  const votingMs = parseDuration(meta.voting);
  const coolingEndsAt = coolingMs > 0 ? new Date(now + coolingMs) : null;
  // Voting window opens immediately for the demo (cooling runs concurrently, displayed as a phase badge).
  const votingEndsAt = new Date(now + coolingMs + votingMs);

  // Mock Mixtral 8x22B risk assessment.
  const aiRiskScore = Math.floor(Math.random() * 33) + 8; // 8-40
  const aiRecommendation: string = aiRiskScore < 30 ? "approve" : "review";
  const aiConfidence = Math.round((0.8 + Math.random() * 0.15) * 100) / 100; // 0.80-0.95

  // ── Persist proposal + ledger event inside ONE transaction ──
  const proposal = await db.$transaction(async (tx) => {
    const created = await tx.proposal.create({
      data: {
        enterpriseId,
        title: String(title).trim(),
        description: String(description).trim(),
        type,
        status: "voting_open",
        votingEndsAt,
        coolingEndsAt,
        quorumPct: 51,
        passThreshold: meta.threshold,
        totalVotingPower: enterprise.totalEquityUnits,
        aiRiskScore,
        aiRecommendation,
        aiConfidence,
        createdById: user.id,
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId,
      eventType: "proposal_created",
      payload: {
        proposalId: created.id,
        title: created.title,
        type: created.type,
        threshold: meta.threshold,
        cooling: meta.cooling,
        voting: meta.voting,
        aiRiskScore,
        aiRecommendation,
        creatorId: user.id,
      },
      actorId: user.id,
    });

    return created;
  });

  await audit({
    actorId: user.id,
    action: "proposal.create",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      proposalId: proposal.id,
      type,
      threshold: meta.threshold,
    },
  });

  return NextResponse.json({ proposal }, { status: 201 });
}, "POST /api/proposals");
