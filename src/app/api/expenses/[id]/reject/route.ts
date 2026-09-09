import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent, enforceNotFrozen } from "@/lib/aurienta/cre";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

// POST /api/expenses/[id]/reject
// Body: { reason: string }
//
// DE-15 — Previously expenses could only be approved (or auto-flagged by the
// CRE); there was no endpoint for a manager to formally REJECT a submitted
// expense. This left pending expenses stuck in `pending` /
// `dual_signature_pending` with no constitutional exit path beyond approval.
//
// This route mirrors /api/expenses/[id]/approve:
//   - RBAC: the caller must hold a manager / board_member /
//     accounting_firm_rep / founding_operator role in the expense's
//     enterprise (membership-based, same gate as approve).
//   - The CRE is consulted to ensure the enterprise is not frozen.
//   - The submitter cannot reject their own expense (separation of duties).
//   - On success: expense.status → "rejected", a `cre_decision` ledger event
//     is appended, audit() records the decision, and a Notification is
//     created for the submitter.
type Params = { params: Promise<{ id: string }> };

export const POST = withErrorHandler(
  async (
    req: NextRequest,
    ctx: Params
  ) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }

    // ── Rate limit (same bucket as approve) ──
    const rl = limiters.expenses(user.id);
    if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

    const { params } = ctx;
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const reason =
      typeof body?.reason === "string" ? body.reason.trim() : "";

    if (reason.length < 3) {
      return NextResponse.json(
        {
          error: "A reason (≥ 3 characters) is required to reject an expense.",
          code: "invalid_body",
        },
        { status: 400 }
      );
    }
    if (reason.length > 2000) {
      return NextResponse.json(
        { error: "Reason must be ≤ 2000 characters.", code: "invalid_body" },
        { status: 400 }
      );
    }

    const expense = await db.expense.findUnique({
      where: { id },
      include: { enterprise: true },
    });
    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found", code: "not_found" },
        { status: 404 }
      );
    }

    // ── CRE: enterprise must not be frozen. ──
    const freeze = enforceNotFrozen(expense.enterprise);
    if (!freeze.allowed) {
      await audit({
        actorId: user.id,
        action: "expense.reject",
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

    // ── RBAC: manager / board_member / accounting_firm_rep / founding_operator. ──
    const memberships = user.memberships.filter(
      (m) => m.enterpriseId === expense.enterpriseId
    );
    const userRoles = memberships.map((m) => m.role);
    const canReject = userRoles.some((r) =>
      ["manager", "board_member", "accounting_firm_rep", "founding_operator"].includes(r)
    );
    if (!canReject) {
      await audit({
        actorId: user.id,
        action: "expense.reject",
        target: `expense:${id}`,
        result: "denied",
        reason: "not_authorized_rejecter",
        metadata: { userRoles },
      });
      return NextResponse.json(
        {
          error: "Not authorised to reject expenses in this enterprise.",
          code: "forbidden",
        },
        { status: 403 }
      );
    }

    // Submitter cannot self-reject (prevents a bad actor from clearing their
    // own flagged expense from the queue without oversight).
    if (expense.submittedById === user.id) {
      await audit({
        actorId: user.id,
        action: "expense.reject",
        target: `expense:${id}`,
        result: "denied",
        reason: "submitter_cannot_self_reject",
      });
      return NextResponse.json(
        {
          error: "You submitted this expense and cannot self-reject it.",
          code: "forbidden",
        },
        { status: 403 }
      );
    }

    // Already-rejected / approved / flagged → 409.
    if (expense.status === "rejected") {
      return NextResponse.json(
        { error: "Expense already rejected", code: "conflict" },
        { status: 409 }
      );
    }
    if (expense.status === "approved") {
      return NextResponse.json(
        {
          error: "Cannot reject an expense that has already been approved.",
          code: "conflict",
        },
        { status: 409 }
      );
    }

    // ── Update expense + ledger event + notification inside ONE transaction ──
    const updated = await db.$transaction(async (tx) => {
      const u = await tx.expense.update({
        where: { id },
        data: {
          status: "rejected",
          // Reuse the existing `receiptNote` field as the rejection reason
          // scratchpad (the schema has no dedicated rejectionReason column).
          // Prefix with [REJECTED] so the note is unambiguous on read.
          receiptNote: `[REJECTED] ${reason}`.slice(0, 1000),
        },
      });

      await appendLedgerEvent(tx, {
        enterpriseId: expense.enterpriseId,
        eventType: "cre_decision",
        payload: {
          action: "expense_rejected",
          expenseId: id,
          category: expense.category,
          vendor: expense.vendor,
          amount: expense.amountEgp,
          rejectedBy: user.id,
          reason,
        },
        actorId: user.id,
      });

      // Notify the submitter that their expense was rejected (with the reason).
      // Best-effort — the unique constraint on (userId, enterpriseId) is not
      // involved here, so a notification failure is non-fatal to the reject.
      await tx.notification.create({
        data: {
          userId: expense.submittedById,
          enterpriseId: expense.enterpriseId,
          category: "treasury",
          title: "Expense rejected",
          body:
            `Your expense "${expense.vendor}" (${expense.amountEgp.toLocaleString()} EGP) ` +
            `for ${expense.enterprise.name} was rejected. Reason: ${reason.slice(0, 280)}`,
          aiPriority: "high",
        },
      });

      return u;
    });

    await audit({
      actorId: user.id,
      action: "expense.reject",
      target: `expense:${id}`,
      result: "allowed",
      metadata: {
        status: updated.status,
        rejectedBy: user.id,
        submitterId: expense.submittedById,
        enterpriseId: expense.enterpriseId,
        reason,
      },
    });

    return NextResponse.json({ ok: true, expense: updated });
  },
  "POST /api/expenses/[id]/reject"
);
