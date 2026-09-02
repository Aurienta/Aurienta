// Accountant milestone-release endpoint (Amendment IX).
// The certified accounting firm verifies milestone evidence and authorizes
// the release of funds from the law firm's client account to the vendor/
// enterprise operating account.
//
// Flow: escrow → accounting firm verification → vendor
// The accountant is the final gate before funds leave the law firm's custody.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent, enforceFundFlow, enforceAccountantGate, enforceZeroCustody } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rlHit = limiters.expenses(user.id);
  if (!rlHit.allowed) return rateLimitedResponse(rlHit.resetAt);

  const { params } = ctx;
  const { id: milestoneId } = await params;
  const body = await req.json().catch(() => ({}));
  const { action, verificationNote } = body as { action: "verify" | "reject"; verificationNote?: string };

  if (action !== "verify" && action !== "reject") {
    return NextResponse.json({ error: "invalid_action", message: "action must be 'verify' or 'reject'" }, { status: 400 });
  }

  // Fetch the milestone with enterprise + accounting firm.
  const milestone = await db.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      enterprise: {
        select: {
          id: true, name: true, lawFirmClientAccountBalanceEgp: true, status: true,
          accountingFirmId: true,
          accountingFirm: { select: { id: true, name: true, status: true, esaaLicense: true } },
          lawFirm: { select: { id: true, name: true, status: true } },
          platformFeePct: true, consultingFeePct: true, consultingOptOut: true,
        },
      },
    },
  });

  if (!milestone) {
    return NextResponse.json({ error: "not_found", message: "Milestone not found" }, { status: 404 });
  }

  // RBAC: only the accounting firm rep for this enterprise can verify.
  const isAccountant = user.memberships.some(
    (m) => m.role === "accounting_firm_rep" && m.enterpriseId === milestone.enterprise.id
  );
  if (!isAccountant) {
    return NextResponse.json(
      { error: "forbidden", message: "Only the assigned accounting firm representative can verify milestone evidence" },
      { status: 403 }
    );
  }

  if (action === "reject") {
    const updated = await db.milestone.update({
      where: { id: milestoneId },
      data: { status: "rejected", evidenceNote: verificationNote ? `Accountant rejected: ${verificationNote}` : undefined },
    });
    await db.$transaction(async (tx) => {
      await appendLedgerEvent(tx, {
        enterpriseId: milestone.enterprise.id,
        eventType: "milestone_rejected",
        payload: { milestoneId, title: milestone.title, amount: milestone.amountEgp, reason: verificationNote ?? "accountant_rejected", verifiedBy: user.id },
        actorId: user.id,
      });
    });
    await audit({ actorId: user.id, action: "milestone.accountant_reject", target: `milestone:${milestoneId}`, result: "allowed", metadata: { reason: verificationNote } });
    return NextResponse.json({ ok: true, milestone: { id: updated.id, status: updated.status } });
  }

  // action === "verify" — enforce the accountant gate + fund flow
  const accountingFirm = milestone.enterprise.accountingFirm;
  if (!accountingFirm) {
    return NextResponse.json({ error: "no_accounting_firm", message: "No accounting firm assigned to this enterprise" }, { status: 400 });
  }

  const gate = enforceAccountantGate({
    accountingFirmStatus: accountingFirm.status,
    evidenceVerified: true, // the accountant is verifying by calling this endpoint
    milestoneStatus: milestone.status,
  });
  if (!gate.allowed) {
    return NextResponse.json({ error: "accountant_gate_denied", message: gate.reason, policy: gate.policy }, { status: 403 });
  }

  const fundFlow = enforceFundFlow({
    lawFirmStatus: milestone.enterprise.lawFirm?.status ?? "active",
    releaseAmount: milestone.amountEgp,
    lawFirmBalance: milestone.enterprise.lawFirmClientAccountBalanceEgp, // field name kept for compat; semantically "law firm client account balance"
  });
  if (!fundFlow.allowed) {
    return NextResponse.json({ error: "fund_flow_denied", message: fundFlow.reason, policy: fundFlow.policy }, { status: 403 });
  }

  // ── CRE: Zero Custody (Non-amendable Rule I 1.1) ──
  // The beneficiary of a fund release is the enterprise (or its law firm
  // client account). AURIENTA must NEVER be the beneficiary/custodian —
  // verify the enterprise name does not contain "aurienta".
  const zc = enforceZeroCustody(milestone.enterprise.name);
  if (!zc.allowed) {
    return NextResponse.json(
      { error: zc.reason, code: "cre_denied", policy: zc.policy },
      { status: 400 }
    );
  }

  // All checks passed — release the funds.
  // Calculate fees: 5% platform + 2.5% consulting (unless opted out)
  const platformFeePct = milestone.enterprise.platformFeePct ?? 5;
  const consultingFeePct = milestone.enterprise.consultingOptOut ? 0 : (milestone.enterprise.consultingFeePct ?? 2.5);
  const platformFeeEgp = Math.round(milestone.amountEgp * platformFeePct / 100);
  const consultingFeeEgp = Math.round(milestone.amountEgp * consultingFeePct / 100);
  const totalFeesEgp = platformFeeEgp + consultingFeeEgp;
  const netReleasedEgp = milestone.amountEgp - totalFeesEgp;

  const result = await db.$transaction(async (tx) => {
    // Update milestone status to "released".
    const updated = await tx.milestone.update({
      where: { id: milestoneId },
      data: { status: "released", releasedAt: new Date() },
    });

    // Decrement the law firm client account balance by the full milestone amount.
    // Fees are deducted from the release — net goes to enterprise operations.
    await tx.enterprise.update({
      where: { id: milestone.enterprise.id },
      data: { lawFirmClientAccountBalanceEgp: { decrement: milestone.amountEgp } },
    });

    // Ledger event: milestone released by accountant with fee breakdown.
    await appendLedgerEvent(tx, {
      enterpriseId: milestone.enterprise.id,
      eventType: "milestone_released",
      payload: {
        milestoneId,
        title: milestone.title,
        grossAmount: milestone.amountEgp,
        platformFeeEgp,
        platformFeePct,
        consultingFeeEgp,
        consultingFeePct,
        consultingOptOut: milestone.enterprise.consultingOptOut,
        totalFeesEgp,
        netReleasedEgp,
        flow: "law_firm_client_account → accounting_firm_verification → enterprise_operating_account",
        verifiedBy: user.id,
        accountingFirmId: accountingFirm.id,
        accountingFirmName: accountingFirm.name,
        esaaLicense: accountingFirm.esaaLicense,
        verificationNote: verificationNote ?? "accountant_verified",
        amendment: "IX",
      },
      actorId: user.id,
    });

    return updated;
  });

  await audit({
    actorId: user.id,
    action: "milestone.accountant_release",
    target: `milestone:${milestoneId}`,
    result: "allowed",
    metadata: { amount: milestone.amountEgp, accountingFirm: accountingFirm.name },
  });

  return NextResponse.json({
    ok: true,
    milestone: { id: result.id, status: result.status, releasedAt: result.releasedAt },
    flow: "law_firm_client_account → accounting_firm → vendor",
    amendment: "IX — direct law-firm transfer + accountant verification",
  });
}, "POST /api/milestones/[id]/accountant-release");
