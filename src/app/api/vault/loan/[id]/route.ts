// AURIENTA — Vault Loan Lifecycle (Blueprint §5.4.3)
//
//   GET   /api/vault/loan/[id]            → fetch a single VaultLoan record.
//
//   PATCH /api/vault/loan/[id]
//        { action: "approve", note? }     → AURIENTA Rep finalises the loan:
//                                            sets status="approved",
//                                            approvedAt=now, repaymentDueAt
//                                            = now + 24 months, moves capital
//                                            out of the vault
//                                            (currentBalanceEgp -= amount,
//                                             totalLoanedEgp  += amount).
//
//        { action: "reject",  note? }     → AURIENTA Rep closes a pending
//                                            petition without payout.
//
//        { action: "repay", amountEgp, note? }
//                                          → Records a repayment from future
//                                            profits. Returns capital to the
//                                            vault (currentBalanceEgp += amount,
//                                            totalRepaidEgp  += amount). When
//                                            repaidEgp >= amountEgp the loan
//                                            transitions to status="repaid".

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { parseBody } from "@/lib/aurienta/validation";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Blueprint §5.4.3 — loans are repayable over 24 months from approval.
const TWENTY_FOUR_MONTHS_MS = 24 * 30 * 24 * 60 * 60 * 1000;

// Roles authorised to record a repayment (capital flowing back into the vault).
const REPAY_ROLES = [
  "aurienta_rep",
  "accounting_firm_rep",
  "founding_operator",
  "company_owner",
  "board_member",
];

const patchSchema = z.object({
  action: z.enum(["approve", "reject", "repay", "forgive"]),
  amountEgp: z.number().min(0.01).max(50_000_000_000).optional(),
  note: z.string().max(2000).optional(),
});

type Params = { params: Promise<{ id: string }> };

// GET /api/vault/loan/[id] — fetch a single VaultLoan. Auth required.
export const GET = withErrorHandler(async (_req: NextRequest, ctx: Params) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const { params } = ctx;
  const { id } = await params;
  const loan = await db.vaultLoan.findUnique({
    where: { id },
    include: {
      enterprise: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!loan) {
    return NextResponse.json(
      { error: "Vault loan not found", code: "not_found" },
      { status: 404 }
    );
  }

  // P1 IDOR fix: only members of the loan's enterprise may fetch it.
  const hasAccess = user.memberships.some(
    (m) => m.enterpriseId === loan.enterpriseId
  );
  if (!hasAccess) {
    return NextResponse.json(
      { error: "forbidden", code: "forbidden" },
      { status: 403 }
    );
  }

  return NextResponse.json({ loan });
}, "GET /api/vault/loan/[id]");

// PATCH /api/vault/loan/[id] — approve / reject / record a repayment.
export const PATCH = withErrorHandler(async (req: NextRequest, ctx: Params) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const { params } = ctx;
  const { id } = await params;
  const body = await parseBody(req, patchSchema);
  if (body instanceof NextResponse) return body;
  const { action, amountEgp, note } = body;

  const loan = await db.vaultLoan.findUnique({
    where: { id },
    include: { enterprise: true },
  });
  if (!loan) {
    return NextResponse.json(
      { error: "Vault loan not found", code: "not_found" },
      { status: 404 }
    );
  }

  // ── RBAC ──
  const memberships = user.memberships.filter(
    (m) => m.enterpriseId === loan.enterpriseId
  );
  const userRoles = memberships.map((m) => m.role);
  const isAurientaRep = userRoles.includes("aurienta_rep");
  const isManager = userRoles.includes("manager");
  const canRepay = userRoles.some((r) => REPAY_ROLES.includes(r));

  // Approve, reject, and forgive are AURIENTA-Rep-only (Blueprint §5.4.3 —
  // only the platform steward may extinguish a loan). Repay is open to the
  // broader managerial set.
  if (
    (action === "approve" || action === "reject" || action === "forgive") &&
    !isAurientaRep
  ) {
    await audit({
      actorId: user.id,
      action: `vault.loan.${action}`,
      target: `vault_loan:${id}`,
      result: "denied",
      reason: "aurienta_rep_required",
      metadata: { userRoles },
    });
    return NextResponse.json(
      {
        error:
          "Only an AURIENTA Representative may approve, reject, or forgive Vault loans.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  if (action === "repay" && !canRepay && !isManager) {
    await audit({
      actorId: user.id,
      action: "vault.loan.repay",
      target: `vault_loan:${id}`,
      result: "denied",
      reason: "role_not_eligible_for_repayment",
      metadata: { userRoles },
    });
    return NextResponse.json(
      {
        error:
          "You do not hold a role authorised to record loan repayments for this enterprise.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  // ── APPROVE ──
  if (action === "approve") {
    if (loan.status !== "pending") {
      return NextResponse.json(
        {
          error: `Loan is already ${loan.status}; cannot approve.`,
          code: "conflict",
        },
        { status: 409 }
      );
    }

    // Re-check the vault still holds enough to disburse. (A concurrent
    // approval or vault contribution reversal could have drained it.)
    const vault = await db.insuranceVault.findUnique({
      where: { enterpriseId: loan.enterpriseId },
    });
    const available = vault?.currentBalanceEgp ?? 0;
    if (available < loan.amountEgp) {
      await audit({
        actorId: user.id,
        action: "vault.loan.approve",
        target: `vault_loan:${id}`,
        result: "denied",
        reason: "insufficient_vault_balance",
        metadata: { requestedEgp: loan.amountEgp, availableEgp: available },
      });
      return NextResponse.json(
        {
          error:
            "The Anti-Fragility Vault no longer holds sufficient reserves to disburse this loan.",
          code: "cre_denied",
          policy: "vault_loan_solvency.rego",
          availableEgp: available,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const repaymentDueAt = new Date(now.getTime() + TWENTY_FOUR_MONTHS_MS);

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.vaultLoan.update({
        where: { id },
        data: {
          status: "approved",
          approvedAt: now,
          repaymentDueAt,
        },
      });

      // Move capital out of the vault and onto the enterprise's books.
      await tx.insuranceVault.update({
        where: { enterpriseId: loan.enterpriseId },
        data: {
          currentBalanceEgp: { decrement: loan.amountEgp },
          totalLoanedEgp: { increment: loan.amountEgp },
        },
      });

      await appendLedgerEvent(tx, {
        enterpriseId: loan.enterpriseId,
        eventType: "vault_loan_approved",
        payload: {
          action: "anti_fragility_loan_approved",
          loanId: id,
          amountEgp: loan.amountEgp,
          reason: loan.reason,
          approvedAt: now.toISOString(),
          repaymentDueAt: repaymentDueAt.toISOString(),
          actorId: user.id,
          note: note ?? null,
        },
        actorId: user.id,
      });

      return updated;
    });

    await audit({
      actorId: user.id,
      action: "vault.loan.approve",
      target: `vault_loan:${id}`,
      result: "allowed",
      metadata: { amountEgp: loan.amountEgp, repaymentDueAt },
    });

    return NextResponse.json({ ok: true, loan: result });
  }

  // ── REJECT ──
  if (action === "reject") {
    if (loan.status !== "pending") {
      return NextResponse.json(
        {
          error: `Loan is already ${loan.status}; cannot reject.`,
          code: "conflict",
        },
        { status: 409 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.vaultLoan.update({
        where: { id },
        data: { status: "rejected" },
      });

      await appendLedgerEvent(tx, {
        enterpriseId: loan.enterpriseId,
        eventType: "vault_loan_rejected",
        payload: {
          action: "anti_fragility_loan_rejected",
          loanId: id,
          amountEgp: loan.amountEgp,
          reason: loan.reason,
          actorId: user.id,
          note: note ?? null,
        },
        actorId: user.id,
      });

      return updated;
    });

    await audit({
      actorId: user.id,
      action: "vault.loan.reject",
      target: `vault_loan:${id}`,
      result: "allowed",
      metadata: { amountEgp: loan.amountEgp },
    });

    return NextResponse.json({ ok: true, loan: result });
  }

  // ── FORGIVE ──
  // Blueprint §5.4.3: Vault loans are NON-RECOURSE — if the enterprise cannot
  // repay (insolvency, graduation failure, force-majeure), an AURIENTA Rep
  // may forgive the outstanding balance. The remaining principal is removed
  // from the enterprise's books (no capital returns to the vault — the
  // reserve absorbs the loss).
  if (action === "forgive") {
    if (loan.status !== "approved") {
      return NextResponse.json(
        {
          error: `Cannot forgive a loan that is ${loan.status}. Only outstanding (approved) loans may be forgiven.`,
          code: "conflict",
        },
        { status: 409 }
      );
    }

    const forgivenAmount = loan.amountEgp - loan.repaidEgp;
    if (forgivenAmount <= 0) {
      return NextResponse.json(
        {
          error: "Loan is already fully repaid — nothing to forgive.",
          code: "conflict",
        },
        { status: 409 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.vaultLoan.update({
        where: { id },
        data: { status: "forgiven" },
      });

      // Capital does NOT return to the vault — the reserve absorbs the loss.
      // Decrement totalLoanedEgp by the forgiven principal so the outstanding-
      // loan tally reflects reality (currentBalanceEgp unchanged).
      await tx.insuranceVault.update({
        where: { enterpriseId: loan.enterpriseId },
        data: {
          totalLoanedEgp: { decrement: forgivenAmount },
        },
      });

      await appendLedgerEvent(tx, {
        enterpriseId: loan.enterpriseId,
        eventType: "vault_loan_forgiven",
        payload: {
          action: "anti_fragility_loan_forgiven",
          loanId: id,
          originalAmountEgp: loan.amountEgp,
          repaidEgp: loan.repaidEgp,
          forgivenAmountEgp: forgivenAmount,
          reason: loan.reason,
          note: note ?? null,
          actorId: user.id,
        },
        actorId: user.id,
      });

      return updated;
    });

    await audit({
      actorId: user.id,
      action: "vault.loan.forgive",
      target: `vault_loan:${id}`,
      result: "allowed",
      metadata: {
        originalAmountEgp: loan.amountEgp,
        repaidEgp: loan.repaidEgp,
        forgivenAmountEgp: forgivenAmount,
      },
    });

    return NextResponse.json({ ok: true, loan: result });
  }

  // ── REPAY ──
  if (loan.status !== "approved") {
    return NextResponse.json(
      {
        error: `Cannot record a repayment on a loan that is ${loan.status}.`,
        code: "conflict",
      },
      { status: 409 }
    );
  }

  if (!amountEgp || amountEgp <= 0) {
    return NextResponse.json(
      {
        error: "amountEgp (positive) is required to record a repayment.",
        code: "invalid_body",
      },
      { status: 400 }
    );
  }

  const remaining = loan.amountEgp - loan.repaidEgp;
  // Allow a tiny epsilon for floating-point drift on the cumulative tally.
  if (amountEgp > remaining + 0.001) {
    return NextResponse.json(
      {
        error: `Repayment of ${amountEgp} EGP exceeds the remaining balance of ${remaining.toFixed(4)} EGP.`,
        code: "invalid_body",
        remainingEgp: remaining,
      },
      { status: 400 }
    );
  }

  const result = await db.$transaction(async (tx) => {
    const newRepaid = loan.repaidEgp + amountEgp;
    const fullyRepaid = newRepaid >= loan.amountEgp - 0.001;

    const updated = await tx.vaultLoan.update({
      where: { id },
      data: {
        repaidEgp: { increment: amountEgp },
        status: fullyRepaid ? "repaid" : loan.status,
      },
    });

    // Capital returns to the vault — both current balance and the cumulative
    // repaid tally move up by the repayment amount.
    await tx.insuranceVault.update({
      where: { enterpriseId: loan.enterpriseId },
      data: {
        currentBalanceEgp: { increment: amountEgp },
        totalRepaidEgp: { increment: amountEgp },
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: loan.enterpriseId,
      eventType: fullyRepaid
        ? "vault_loan_repaid"
        : "vault_loan_partial_repayment",
      payload: {
        action: fullyRepaid
          ? "anti_fragility_loan_repaid"
          : "anti_fragility_loan_partial_repayment",
        loanId: id,
        amountEgp,
        cumulativeRepaidEgp: newRepaid,
        originalAmountEgp: loan.amountEgp,
        fullyRepaid,
        actorId: user.id,
        note: note ?? null,
      },
      actorId: user.id,
    });

    return updated;
  });

  await audit({
    actorId: user.id,
    action: "vault.loan.repay",
    target: `vault_loan:${id}`,
    result: "allowed",
    metadata: {
      amountEgp,
      cumulativeRepaidEgp: result.repaidEgp,
      status: result.status,
    },
  });

  return NextResponse.json({ ok: true, loan: result });
}, "PATCH /api/vault/loan/[id]");
