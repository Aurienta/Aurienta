import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/cre/validate
// Constitutional Runtime Engine validation endpoint (Vol 2 §2.4).
// Allows external callers (law firms, regulators, auditors) to validate an
// action against the constitutional rules BEFORE executing it.
//
// Request body:
//   { policy: "priority_windows" | "zero_custody" | "expense_authority" | ...,
//     params: { ...policy-specific params... } }
//
// Response:
//   { allowed: boolean, reason?: string, policy: string, decisionToken: string }
//
// This exposes the CRE as a runtime engine endpoint — external systems can
// ask "would this action be constitutional?" and get a signed verdict.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { policy, params } = body;

  if (!policy || !params) {
    return NextResponse.json(
      { error: "Missing required fields: policy, params" },
      { status: 400 }
    );
  }

  // Dynamically import the CRE module + dispatch to the right policy
  const cre = await import("@/lib/aurienta/cre");
  let verdict: any;

  switch (policy) {
    case "zero_custody":
      if (!params.beneficiary) {
        return NextResponse.json({ error: "Missing params.beneficiary" }, { status: 400 });
      }
      verdict = cre.enforceZeroCustody(params.beneficiary);
      break;

    case "expense_authority":
      if (params.amountEgp === undefined || params.capitalEgp === undefined || !params.role) {
        return NextResponse.json(
          { error: "Missing params: amountEgp, capitalEgp, role" },
          { status: 400 }
        );
      }
      verdict = cre.enforceExpenseAuthority(params.amountEgp, params.capitalEgp, params.role);
      break;

    case "price_band":
      if (params.proposedPrice === undefined || params.fundamentalPrice === undefined) {
        return NextResponse.json(
          { error: "Missing params: proposedPrice, fundamentalPrice" },
          { status: 400 }
        );
      }
      verdict = cre.enforcePriceBand(params.proposedPrice, params.fundamentalPrice, params.blockTrade ?? false);
      break;

    case "priority_windows":
      if (!params.userRole || params.requestedPhase === undefined) {
        return NextResponse.json(
          { error: "Missing params: userRole, requestedPhase" },
          { status: 400 }
        );
      }
      verdict = cre.enforcePriorityWindow({ userRole: params.userRole, requestedPhase: params.requestedPhase });
      break;

    case "circuit_breaker":
      if (!params.enterpriseId || params.proposedPrice === undefined) {
        return NextResponse.json(
          { error: "Missing params: enterpriseId, proposedPrice" },
          { status: 400 }
        );
      }
      verdict = await cre.enforceCircuitBreaker({
        enterpriseId: params.enterpriseId,
        proposedPrice: params.proposedPrice,
      });
      break;

    case "screening_gate":
      if (!params.userId || !params.action) {
        return NextResponse.json(
          { error: "Missing params: userId, action" },
          { status: 400 }
        );
      }
      verdict = await cre.enforceScreeningGate({
        userId: params.userId,
        enterpriseId: params.enterpriseId,
        action: params.action,
      });
      break;

    case "succession_gate":
      if (!params.userId || !params.action) {
        return NextResponse.json(
          { error: "Missing params: userId, action" },
          { status: 400 }
        );
      }
      verdict = await cre.enforceSuccessionGate({ userId: params.userId, action: params.action });
      break;

    case "verification_gate":
      if (!params.verificationLevel || !params.verificationStatus) {
        return NextResponse.json(
          { error: "Missing params: verificationLevel, verificationStatus" },
          { status: 400 }
        );
      }
      verdict = cre.enforceVerificationGate({
        verificationLevel: params.verificationLevel,
        verificationStatus: params.verificationStatus,
        action: params.action,
      });
      break;

    case "manager_removal":
      if (!params.managerId || !params.enterpriseId) {
        return NextResponse.json(
          { error: "Missing params: managerId, enterpriseId" },
          { status: 400 }
        );
      }
      verdict = await cre.enforceManagerRemoval({
        managerId: params.managerId,
        enterpriseId: params.enterpriseId,
        reason: params.reason ?? "no_reason_given",
        hasShareholderVote: params.hasShareholderVote ?? false,
        votePassed: params.votePassed ?? false,
      });
      break;

    default:
      return NextResponse.json(
        {
          error: `Unknown policy: ${policy}`,
          availablePolicies: [
            "zero_custody",
            "expense_authority",
            "price_band",
            "priority_windows",
            "circuit_breaker",
            "screening_gate",
            "succession_gate",
            "verification_gate",
            "manager_removal",
          ],
        },
        { status: 400 }
      );
  }

  return NextResponse.json({
    policy: verdict.policy,
    allowed: verdict.allowed,
    reason: verdict.reason,
    decisionToken: verdict.decisionToken,
    // Include any policy-specific fields (assignedPhase, haltLevel, etc.)
    ...Object.fromEntries(
      Object.entries(verdict).filter(
        ([k]) => !["policy", "allowed", "reason", "decisionToken", "requiredApproverRoles"].includes(k)
      )
    ),
    requiredApproverRoles: verdict.requiredApproverRoles,
    validatedAt: new Date().toISOString(),
    engineVersion: "CRE-TS-1.0",
  });
});
