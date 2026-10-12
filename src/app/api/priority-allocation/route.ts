import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, priorityAllocationRegisterSchema } from "@/lib/aurienta/validation";
import {
  getUserAllocations,
  registerInterest,
} from "@/lib/aurienta/priority-allocation";

// GET /api/priority-allocation
// Returns the calling user's priority allocations (all phases, all
// enterprises) with enterprise names joined. Sorted by createdAt DESC.
export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const allocations = await getUserAllocations(user.id);

  return NextResponse.json({ allocations });
}, "GET /api/priority-allocation");

// POST /api/priority-allocation
// Body: { enterpriseId, windowPhase }
// Registers the calling user's interest in a priority window allocation.
// CRE policy `enforcePriorityWindowAllocation` validates phase eligibility
// (Phase 1 STS>=50, Phase 2 STS>=35) and uniqueness (one per phase per user).
// On denial, returns 400 with the CRE verdict's reason.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // ── Rate limit ──
  const rl = limiters.priorityAllocation(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  // ── Validate body ──
  const body = await parseBody(req, priorityAllocationRegisterSchema);
  if (body instanceof NextResponse) return body;
  const { enterpriseId, windowPhase } = body;

  // ── Verify the enterprise is fundraising-active ──
  // Registration is only allowed against enterprises that are currently in
  // the capital formation phase (status = "fundraising_active"). Closed,
  // frozen, or graduated enterprises reject new registrations.
  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { id: true, status: true, name: true },
  });
  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found", code: "not_found" },
      { status: 404 }
    );
  }
  if (enterprise.status !== "fundraising_active") {
    await audit({
      actorId: user.id,
      action: "priority_allocation.register",
      target: `enterprise:${enterpriseId}:phase:${windowPhase}`,
      result: "denied",
      reason: "enterprise_not_fundraising_active",
      metadata: { status: enterprise.status },
    });
    return NextResponse.json(
      {
        error: `Enterprise is not in fundraising_active state (current: ${enterprise.status})`,
        code: "cre_denied",
      },
      { status: 400 }
    );
  }

  const { allocation, verdict } = await registerInterest(
    user.id,
    enterpriseId,
    windowPhase
  );

  if (!allocation || !verdict.allowed) {
    return NextResponse.json(
      {
        error: verdict.reason ?? "Priority allocation denied",
        code: "cre_denied",
        policy: verdict.policy,
        decisionToken: verdict.decisionToken,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ allocation, verdict }, { status: 200 });
}, "POST /api/priority-allocation");
