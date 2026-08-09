import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import {
  appendLedgerEvent,
  enforceExpenseAuthority,
  enforceNotFrozen,
  enforceNosiExpenseFreeze,
} from "@/lib/aurienta/cre";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

// POST /api/expenses/[id]/approve
// Applies the next signature in the dual-signature chain, or finalises a
// board-pending expense.
//   - If expense.status === "pending"            → board approval → approved
//   - If expense.status === "dual_signature_pending":
//        * first signature (approver1 empty)   → set approver1, remain dual_signature_pending
//        * second signature (approver2 empty)  → set approver2, transition to approved
//   - Already approved / rejected / flagged     → 409
// The CRE requiredApproverRoles is consulted so the right role signs in each
// bracket. The existing code blocks re-signing by the same approver — preserved.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // ── Rate limit ──
  const rl = limiters.expenses(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  const { id } = await params;
  const expense = await db.expense.findUnique({
    where: { id },
    include: { enterprise: true },
  });
  if (!expense) {
    return NextResponse.json({ error: "Expense not found", code: "not_found" }, { status: 404 });
  }

  // ── CRE: enterprise must not be frozen ──
  const freeze = enforceNotFrozen(expense.enterprise);
  if (!freeze.allowed) {
    await audit({
      actorId: user.id,
      action: "expense.approve",
      target: `expense:${id}`,
      result: "denied",
      reason: freeze.reason,
      metadata: { policy: freeze.policy },
    });
    return NextResponse.json(
      {
        error: freeze.reason ?? "Enterprise is frozen",
        code: "cre_denied",
        policy: freeze.policy,
        decisionToken: freeze.decisionToken,
      },
      { status: 400 }
    );
  }

  // Authorisation: must be manager, board_member, accounting_firm_rep, or
  // founding_operator of the enterprise.
  const memberships = user.memberships.filter((m) => m.enterpriseId === expense.enterpriseId);
  const userRoles = memberships.map((m) => m.role);
  const canApprove = userRoles.some((r) =>
    ["manager", "board_member", "accounting_firm_rep", "founding_operator"].includes(r)
  );
  if (!canApprove) {
    await audit({
      actorId: user.id,
      action: "expense.approve",
      target: `expense:${id}`,
      result: "denied",
      reason: "not_authorized_approver",
    });
    return NextResponse.json(
      { error: "Not authorised to approve expenses in this enterprise", code: "forbidden" },
      { status: 403 }
    );
  }

  // ── CRE: NOSI Expense Freeze enforcement (Blueprint §8.5, Add-on 26) ──
  // If any employee in the enterprise has been hired >60 days without NOSI
  // registration, ALL expense approvals are FROZEN until compliance is restored.
  const unregisteredEmployees = await db.employee.findMany({
    where: { enterpriseId: expense.enterpriseId, nosiStatus: { not: "registered" } },
    select: { hireDate: true, nosiStatus: true },
  });
  if (unregisteredEmployees.length > 0) {
    const nosiFreeze = enforceNosiExpenseFreeze({ employees: unregisteredEmployees });
    if (!nosiFreeze.allowed) {
      await audit({
        actorId: user.id,
        action: "expense.approve",
        target: `expense:${id}`,
        result: "denied",
        reason: nosiFreeze.reason,
        metadata: { policy: nosiFreeze.policy, frozenEmployeeCount: nosiFreeze.frozenEmployeeCount },
      });
      return NextResponse.json(
        {
          error: nosiFreeze.reason ?? "NOSI expense freeze active",
          code: "cre_denied",
          policy: nosiFreeze.policy,
          decisionToken: nosiFreeze.decisionToken,
        },
        { status: 400 }
      );
    }
  }

  // Submitter cannot self-approve (only the auto-approved <1% path bypasses
  // this rule, and that's handled at submit time, not here).
  if (expense.submittedById === user.id && expense.status !== "approved") {
    await audit({
      actorId: user.id,
      action: "expense.approve",
      target: `expense:${id}`,
      result: "denied",
      reason: "submitter_cannot_self_approve",
    });
    return NextResponse.json(
      { error: "You submitted this expense and cannot self-approve it.", code: "forbidden" },
      { status: 403 }
    );
  }

  if (expense.status === "approved") {
    return NextResponse.json({ error: "Expense already approved", code: "conflict" }, { status: 409 });
  }
  if (expense.status === "rejected" || expense.status === "flagged") {
    return NextResponse.json(
      { error: `Cannot approve an expense that is ${expense.status}`, code: "conflict" },
      { status: 409 }
    );
  }

  // ── CRE: compute requiredApproverRoles for this expense bracket ──
  const capital = expense.enterprise.totalEquityUnits * expense.enterprise.equityUnitPriceEgp;
  const pct = (expense.amountEgp / capital) * 100;
  // Evaluate the CRE using the user's first eligible role.
  const roleForCre = userRoles.find((r) =>
    ["manager", "board_member", "accounting_firm_rep", "founding_operator"].includes(r)
  ) ?? userRoles[0];
  const verdict = enforceExpenseAuthority(expense.amountEgp, capital, roleForCre);
  const requiredApproverRoles = verdict.requiredApproverRoles ?? [];

  // Verify the approver's role is in the required approver list for this bracket.
  const roleOk =
    requiredApproverRoles.length === 0 ||
    userRoles.some((r) => requiredApproverRoles.includes(r));
  if (!roleOk) {
    await audit({
      actorId: user.id,
      action: "expense.approve",
      target: `expense:${id}`,
      result: "denied",
      reason: "role_not_in_required_approvers",
      metadata: { requiredApproverRoles, userRoles, pct },
    });
    return NextResponse.json(
      {
        error: `Your role(s) (${userRoles.join(", ")}) are not in the required approver set (${requiredApproverRoles.join(", ")}) for this expense bracket.`,
        code: "cre_denied",
        policy: verdict.policy,
        decisionToken: verdict.decisionToken,
      },
      { status: 403 }
    );
  }

  const data: {
    approver1Id?: string;
    approver2Id?: string;
    status?: string;
    approvedAt?: Date;
  } = {};

  if (expense.status === "pending") {
    // Board-level approval — one signature finalises.
    if (!expense.approver1Id) {
      data.approver1Id = user.id;
    } else if (!expense.approver2Id && expense.approver1Id !== user.id) {
      data.approver2Id = user.id;
    } else if (expense.approver1Id === user.id) {
      return NextResponse.json(
        {
          error: "You already signed as primary approver; a second board member is required",
          code: "conflict",
        },
        { status: 409 }
      );
    }
    data.status = "approved";
    data.approvedAt = new Date();
  } else if (expense.status === "dual_signature_pending") {
    if (!expense.approver1Id) {
      data.approver1Id = user.id;
      // Stays dual_signature_pending awaiting second signature.
    } else if (!expense.approver2Id && expense.approver1Id !== user.id) {
      // For dual-sig (1-10%), require TWO DISTINCT approvers. The existing
      // approver1Id !== user.id check above ensures distinctness.
      data.approver2Id = user.id;
      data.status = "approved";
      data.approvedAt = new Date();
    } else if (expense.approver1Id === user.id && !expense.approver2Id) {
      return NextResponse.json(
        {
          error: "You already signed — awaiting the second signature from another approver",
          code: "conflict",
        },
        { status: 409 }
      );
    } else if (expense.approver2Id) {
      return NextResponse.json(
        { error: "Both signatures already collected", code: "conflict" },
        { status: 409 }
      );
    }
  }

  // ── Update expense + append ledger event inside ONE transaction ──
  const updated = await db.$transaction(async (tx) => {
    const u = await tx.expense.update({
      where: { id },
      data,
    });

    if (u.status === "approved") {
      await appendLedgerEvent(tx, {
        enterpriseId: expense.enterpriseId,
        eventType: "expense_approved",
        payload: {
          expenseId: id,
          category: expense.category,
          vendor: expense.vendor,
          amount: expense.amountEgp,
          approver1Id: u.approver1Id,
          approver2Id: u.approver2Id,
          finalisedById: user.id,
          dualSignature: Boolean(u.approver1Id && u.approver2Id),
        },
        actorId: user.id,
      });
    } else {
      await appendLedgerEvent(tx, {
        enterpriseId: expense.enterpriseId,
        eventType: "cre_decision",
        payload: {
          action: "expense_signature_added",
          expenseId: id,
          signerId: user.id,
          status: u.status,
        },
        actorId: user.id,
      });
    }

    return u;
  });

  await audit({
    actorId: user.id,
    action: "expense.approve",
    target: `expense:${id}`,
    result: "allowed",
    metadata: {
      status: updated.status,
      approver1Id: updated.approver1Id,
      approver2Id: updated.approver2Id,
      pct: Number(pct.toFixed(4)),
    },
  });

  return NextResponse.json({ ok: true, expense: updated });
}
