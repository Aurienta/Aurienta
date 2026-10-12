import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, priorityAllocationExecuteSchema } from "@/lib/aurienta/validation";
import { executeAllocation } from "@/lib/aurienta/priority-allocation";

// PATCH /api/priority-allocation/[allocationId]
// Body: { amountEgp }
// Executes a priority allocation — sets allocatedEgp + allocatedAt=now.
// MANAGER ONLY. The caller must be a manager (or founding_operator, board_member,
// accounting_firm_rep — same dual-sig cohort as expenses) of the enterprise
// the allocation belongs to.
//
// Returns 200 on success, 403 if not authorised, 404 if allocation missing,
// 409 if already executed.
export const PATCH = withErrorHandler(
  async (
    req: NextRequest,
    ctx: { params: Promise<{ allocationId: string }> }
  ) => {
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
    const body = await parseBody(req, priorityAllocationExecuteSchema);
    if (body instanceof NextResponse) return body;
    const { amountEgp } = body;

    // ── Resolve allocation + check enterprise membership ──
    const { params } = ctx;
    const { allocationId } = await params;

    const allocation = await db.priorityWindowAllocation.findUnique({
      where: { id: allocationId },
      select: {
        id: true,
        enterpriseId: true,
        userId: true,
        windowPhase: true,
        allocationRank: true,
        allocatedAt: true,
      },
    });
    if (!allocation) {
      return NextResponse.json(
        { error: "Allocation not found", code: "not_found" },
        { status: 404 }
      );
    }

    // Authorisation — caller must hold a manager-equivalent role in the
    // allocation's enterprise. Same role set as expense approvals.
    const memberships = user.memberships.filter(
      (m) => m.enterpriseId === allocation.enterpriseId
    );
    const userRoles = memberships.map((m) => m.role);
    const canExecute = userRoles.some((r) =>
      ["manager", "board_member", "accounting_firm_rep", "founding_operator"].includes(r)
    );
    if (!canExecute) {
      await audit({
        actorId: user.id,
        action: "priority_allocation.execute",
        target: `allocation:${allocationId}`,
        result: "denied",
        reason: "not_authorized_manager",
        metadata: { userRoles, enterpriseId: allocation.enterpriseId },
      });
      return NextResponse.json(
        { error: "Only managers may execute priority allocations", code: "forbidden" },
        { status: 403 }
      );
    }

    if (allocation.allocatedAt) {
      return NextResponse.json(
        { error: "Allocation already executed", code: "conflict" },
        { status: 409 }
      );
    }

    try {
      await executeAllocation(allocationId, amountEgp, user.id);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to execute allocation";
      const status = message.includes("not found")
        ? 404
        : message.includes("already executed")
          ? 409
          : 500;
      return NextResponse.json(
        { error: message, code: status === 500 ? "internal" : "conflict" },
        { status }
      );
    }

    return NextResponse.json({ ok: true, allocationId });
  },
  "PATCH /api/priority-allocation/[allocationId]"
);
