// AURIENTA — Anti-Fragility Vault Loan Request (Blueprint §5.4.3)
//
// An enterprise hit by an exogenous shock (pandemic, currency devaluation,
// war, natural disaster) may petition the Anti-Fragility Vault for an
// interest-free loan. The loan is:
//   - capped at 20% of Capital Participated (enterprise.raisedEgp),
//   - backed by a simple-majority board vote (≥ 50%),
//   - bounded by the vault's current available balance,
//   - filed as `status="pending"` for AURIENTA review.
//
// Repayment flows from future profits over 24 months (handled by the
// /api/vault/loan/[id] PATCH endpoint).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { parseBody } from "@/lib/aurienta/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Blueprint §5.4.3 — loan cap and board-vote thresholds.
const LOAN_CAP_PCT = 20;
const MIN_BOARD_VOTE_PCT = 50; // simple majority

// Roles authorised to file a vault-loan petition on behalf of the enterprise.
const ELIGIBLE_REQUEST_ROLES = [
  "founding_operator",
  "company_owner",
  "board_member",
];

const loanRequestSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  amountEgp: z.number().min(1).max(50_000_000_000),
  reason: z.enum([
    "pandemic",
    "currency_devaluation",
    "war",
    "natural_disaster",
  ]),
  boardVotePct: z.number().min(0).max(100),
});

// POST /api/vault/loan — request an interest-free loan from the
// Anti-Fragility Insurance Vault. Auth required
// (founding_operator, company_owner, board_member only).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const body = await parseBody(req, loanRequestSchema);
  if (body instanceof NextResponse) return body;
  const { enterpriseId, amountEgp, reason, boardVotePct } = body;

  // ── RBAC: only Founding Operator / Company Owner / Board Member may file ──
  const memberships = user.memberships.filter((m) => m.enterpriseId === enterpriseId);
  const userRoles = memberships.map((m) => m.role);
  const eligible = userRoles.some((r) => ELIGIBLE_REQUEST_ROLES.includes(r));
  if (!eligible) {
    await audit({
      actorId: user.id,
      action: "vault.loan.request",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "role_not_eligible_for_vault_loan",
      metadata: { userRoles },
    });
    return NextResponse.json(
      {
        error:
          "Only the Founding Operator, Company Owner, or a Board Member may request an Anti-Fragility Vault loan.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  // ── CRE: simple-majority board vote (≥ 50%) — Blueprint §5.4.3 ──
  if (boardVotePct < MIN_BOARD_VOTE_PCT) {
    await audit({
      actorId: user.id,
      action: "vault.loan.request",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "board_vote_below_simple_majority",
      metadata: { boardVotePct, required: MIN_BOARD_VOTE_PCT },
    });
    return NextResponse.json(
      {
        error: `Board vote must reach simple majority (≥ ${MIN_BOARD_VOTE_PCT}%). Received ${boardVotePct}%.`,
        code: "cre_denied",
        policy: "vault_loan_board_majority.rego",
      },
      { status: 400 }
    );
  }

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { id: true, name: true, raisedEgp: true, status: true },
  });
  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found", code: "not_found" },
      { status: 404 }
    );
  }

  // ── CRE: loan cap = 20% of Capital Participated (Blueprint §5.4.3) ──
  const cap = (enterprise.raisedEgp * LOAN_CAP_PCT) / 100;
  if (amountEgp > cap) {
    await audit({
      actorId: user.id,
      action: "vault.loan.request",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "loan_exceeds_twenty_pct_cap",
      metadata: { amountEgp, capEgp: cap, raisedEgp: enterprise.raisedEgp },
    });
    return NextResponse.json(
      {
        error: `Vault loans are capped at ${LOAN_CAP_PCT}% of Capital Participated (${cap.toLocaleString()} EGP).`,
        code: "cre_denied",
        policy: "vault_loan_cap.rego",
        capEgp: cap,
      },
      { status: 400 }
    );
  }

  // ── CRE: the vault must hold sufficient reserves to disburse the loan ──
  const vault = await db.insuranceVault.findUnique({ where: { enterpriseId } });
  const available = vault?.currentBalanceEgp ?? 0;
  if (available < amountEgp) {
    await audit({
      actorId: user.id,
      action: "vault.loan.request",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "insufficient_vault_balance",
      metadata: { requestedEgp: amountEgp, availableEgp: available },
    });
    return NextResponse.json(
      {
        error:
          "The Anti-Fragility Vault does not currently hold sufficient reserves to disburse this loan.",
        code: "cre_denied",
        policy: "vault_loan_solvency.rego",
        availableEgp: available,
      },
      { status: 400 }
    );
  }

  // ── Persist the loan petition + ledger event inside ONE transaction ──
  const loan = await db.$transaction(async (tx) => {
    const created = await tx.vaultLoan.create({
      data: {
        enterpriseId,
        amountEgp,
        reason,
        boardVotePct,
        status: "pending",
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId,
      eventType: "vault_loan_requested",
      payload: {
        action: "anti_fragility_loan_requested",
        loanId: created.id,
        amountEgp,
        reason,
        boardVotePct,
        vaultBalanceEgp: available,
        capEgp: cap,
        requestedById: user.id,
      },
      actorId: user.id,
    });

    return created;
  });

  await audit({
    actorId: user.id,
    action: "vault.loan.request",
    target: `vault_loan:${loan.id}`,
    result: "allowed",
    metadata: { enterpriseId, amountEgp, reason, boardVotePct },
  });

  return NextResponse.json({ ok: true, loan }, { status: 201 });
}
