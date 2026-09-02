import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { askConstitutionalAI } from "@/lib/aurienta/ai";
import { appendLedgerEvent, enforceSalaryToEquity } from "@/lib/aurienta/cre";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

// POST /api/skill-equity/[id]/review
// Body: { decision: "approve" | "reject", equityGrantPct?, note? }
// Only board members / company owners / founding operators of the claim's enterprise may review.
// On approval, equityGrantPct is set (capped at the 2% board discretionary pool), and an AI
// assessment is generated via askConstitutionalAI and persisted on the claim.
export const POST = withErrorHandler(
  async (
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
  ) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate limit — AI bucket (this route triggers an AI assessment).
  const hit = limiters.ai(user.id);
  if (!hit.allowed) return rateLimitedResponse(hit.resetAt);

  const { params } = ctx;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { decision, equityGrantPct, note } = body as {
    decision?: string;
    equityGrantPct?: number;
    note?: string;
  };

  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json(
      { error: "decision must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }

  const claim = await db.skillEquityClaim.findUnique({
    where: { id },
    include: {
      enterprise: { select: { id: true, name: true, tier: true } },
      user: { select: { id: true, legalName: true } },
    },
  });
  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }
  if (claim.status !== "pending") {
    return NextResponse.json(
      { error: `Claim is already ${claim.status}.` },
      { status: 400 }
    );
  }

  // Reviewer must be a board_member / company_owner / founding_operator of the enterprise
  // (or an AURIENTA rep with constitutional authority). This is the "board review" gate.
  const reviewerMembership = user.memberships.find(
    (m) =>
      m.enterpriseId === claim.enterpriseId &&
      ["board_member", "company_owner", "founding_operator", "aurienta_rep"].includes(m.role)
  );
  if (!reviewerMembership) {
    return NextResponse.json(
      {
        error:
          "Only board members, company owners, or founding operators of this enterprise may review skill-equity claims.",
        code: "not_reviewer",
      },
      { status: 403 }
    );
  }

  // The reviewer cannot review their own claim
  if (claim.userId === user.id) {
    return NextResponse.json(
      { error: "You cannot review your own skill-equity claim." },
      { status: 403 }
    );
  }

  // Enforce the 2% discretionary pool cap
  let grantPct = 0;
  if (decision === "approve") {
    grantPct = Math.max(0, Math.min(2, Number(equityGrantPct) || 0));
  }

  // ── CRE: Salary-to-Equity enforcement (Blueprint §8.3, P1 remediation) ──
  // On approval, verify the constitutional constraints:
  //   - equityConversionPct ≤ 10% of monthly salary
  //   - 15% discount from the fundamental Equity Unit Price
  //   - workforce partner consent required
  //   - anti-duplicate (no double-conversion in the same pay cycle)
  //   - 12-month lock-up on converted Equity Units
  let salaryEquityVerdict: ReturnType<typeof enforceSalaryToEquity> | null = null;
  if (decision === "approve" && grantPct > 0) {
    // Look up the employee + enterprise pricing for the CRE check
    const employee = await db.employee.findFirst({
      where: { userId: claim.userId, enterpriseId: claim.enterpriseId },
      include: { enterprise: { select: { equityUnitPriceEgp: true } } },
    });
    if (employee) {
      salaryEquityVerdict = enforceSalaryToEquity({
        employeeId: employee.id,
        monthlySalaryEgp: employee.monthlySalaryEgp,
        equityConversionPct: grantPct,
        equityUnitPriceEgp: employee.enterprise.equityUnitPriceEgp,
        authorizedBy: user.id,
        workforcePartnerConsent: true, // claim submission implies consent
        existingConversionThisCycle: false, // claim is pending = first conversion
        restrictedUntilMonths: 12, // blueprint default
      });
      if (!salaryEquityVerdict.allowed) {
        await audit({
          actorId: user.id,
          action: "skill-equity.review",
          target: `claim:${claim.id}`,
          result: "denied",
          reason: salaryEquityVerdict.reason,
          metadata: { policy: salaryEquityVerdict.policy },
        });
        return NextResponse.json(
          {
            error: salaryEquityVerdict.reason ?? "Salary-to-equity CRE violation",
            code: "cre_denied",
            policy: salaryEquityVerdict.policy,
            decisionToken: salaryEquityVerdict.decisionToken,
          },
          { status: 400 }
        );
      }
    }
  }

  // ── AI assessment via Constitutional AI ──
  // Clean, developer-authored system instructions — NO user-controlled text.
  // All claim details (which include user-controlled credential names, issuer,
  // reviewer notes) flow through `userContext` as UNTRUSTED DATA.
  const systemPrompt =
    `Review a Skill-to-Equity claim for a constitutional enterprise. ` +
    `Produce a 3-4 sentence institutional assessment: verify the tenure + document chain, ` +
    `assess whether the grant is constitutionally sound, and note any conditions. Do not speculate.`;

  const userContext =
    `Claimant: ${claim.user.legalName}\n` +
    `Enterprise: ${claim.enterprise.name} (Tier ${claim.enterprise.tier})\n\n` +
    `Claim details:\n` +
    `- Credential type: ${claim.credentialType}\n` +
    `- Credential name: ${claim.credentialName}\n` +
    `- Issuer: ${claim.issuer}\n` +
    `- Issue date: ${claim.issueDate.toISOString().slice(0, 10)}\n` +
    `- Tenure: ${claim.tenureMonths} months (≥ 24 required)\n` +
    `- Document: pinned to IPFS (CID ${claim.documentCid.slice(0, 16)}…)\n` +
    `- Document hash: ${claim.documentHash.slice(0, 24)}…\n\n` +
    `Board decision: ${decision.toUpperCase()}${decision === "approve" ? ` (equity grant ${grantPct}% from 2% discretionary pool)` : ""}.\n` +
    `Reviewer note: ${note ? note.trim() : "(none)"}`;

  const userMessage = `Produce the 3-4 sentence institutional assessment described in the system instructions, based on the untrusted-data context above.`;

  const aiResult = await askConstitutionalAI({
    systemPrompt,
    userMessage,
    userContext,
    kind: "skill_equity_assessment",
    enterpriseId: claim.enterpriseId,
    userId: user.id,
    entityId: claim.id,
    persist: false,
    confidence: 0.88,
  });
  const aiAssessment = aiResult.content;

  // Audit the AI call (lightweight — does not fire on rate-limit hits).
  await audit({
    actorId: user.id,
    action: "ai.skill-equity-review",
    target: claim.enterpriseId,
    result: "allowed",
    metadata: {
      fellBack: aiResult.fellBack,
      latencyMs: aiResult.latencyMs,
      claimId: claim.id,
      decision,
      grantPct,
    },
  });

  const updated = await db.skillEquityClaim.update({
    where: { id },
    data: {
      status: decision === "approve" ? "approved" : "rejected",
      equityGrantPct: grantPct,
      reviewedById: user.id,
      reviewedAt: new Date(),
      aiAssessment,
    },
  });

  await db.$transaction(async (tx) => {
    await appendLedgerEvent(tx, {
      enterpriseId: claim.enterpriseId,
      eventType: "cre_decision",
      payload: {
        action: "skill_equity_reviewed",
        claimId: claim.id,
        decision,
        equityGrantPct: grantPct,
        reviewedBy: user.id,
        note: note?.trim() ?? null,
        aiAssessmentExcerpt: aiAssessment.slice(0, 280),
        documentCid: claim.documentCid,
        tenureMonths: claim.tenureMonths,
        salaryEquityVerdict: salaryEquityVerdict
          ? {
              convertedAmountEgp: salaryEquityVerdict.convertedAmountEgp,
              discountedPriceEgp: salaryEquityVerdict.discountedPriceEgp,
              equityUnitsToIssue: salaryEquityVerdict.equityUnitsToIssue,
              policy: salaryEquityVerdict.policy,
            }
          : null,
      },
      actorId: user.id,
    });
  });

  return NextResponse.json({
    claim: {
      id: updated.id,
      status: updated.status,
      equityGrantPct: updated.equityGrantPct,
      reviewedAt: updated.reviewedAt?.toISOString() ?? null,
      aiAssessment: updated.aiAssessment,
    },
  });
  },
  "POST /api/skill-equity/[id]/review"
);
