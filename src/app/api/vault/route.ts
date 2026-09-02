// AURIENTA — Anti-Fragility Insurance Vault (Blueprint §5.4)
//
// The vault is the collective constitutional reserve funded by 0.5% of each
// Capital Formation close. It provides interest-free loans to enterprises
// hit by exogenous shocks (pandemic, currency devaluation, war, natural
// disaster). This route exposes two surfaces:
//
//   GET  /api/vault?enterpriseId=xxx
//        → read the InsuranceVault record for an enterprise.
//
//   POST /api/vault
//        → contribute 0.5% of a Capital Formation close. Called internally
//          by the Capital Formation close flow. Creates or updates the
//          InsuranceVault, then appends a tamper-evident ledger event.

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

// Blueprint §5.4 — 0.5% of every Capital Formation close flows into the vault.
const VAULT_CONTRIBUTION_PCT = 0.5;

const contributeSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  amountEgp: z.number().min(0).max(50_000_000_000),
});

// GET /api/vault?enterpriseId=xxx — read the Anti-Fragility Insurance Vault
// balance for the named enterprise. Auth required.
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const enterpriseId = req.nextUrl.searchParams.get("enterpriseId");
  if (!enterpriseId) {
    return NextResponse.json(
      {
        error: "enterpriseId query parameter is required",
        code: "invalid_body",
      },
      { status: 400 }
    );
  }

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { id: true, name: true, slug: true, raisedEgp: true },
  });
  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found", code: "not_found" },
      { status: 404 }
    );
  }

  const vault = await db.insuranceVault.findUnique({
    where: { enterpriseId },
  });

  // Return a zero-balance placeholder when no vault exists yet so callers can
  // render the constitutional reserve summary without a null-check.
  const summary = vault ?? {
    id: null,
    enterpriseId,
    totalContributedEgp: 0,
    currentBalanceEgp: 0,
    totalLoanedEgp: 0,
    totalRepaidEgp: 0,
    createdAt: null,
    updatedAt: null,
  };

  return NextResponse.json({ vault: summary, enterprise });
}, "GET /api/vault");

// POST /api/vault — contribute 0.5% of a Capital Formation close to the
// Anti-Fragility Insurance Vault. Creates the vault record on first
// contribution. Appends a tamper-evident ledger event. Auth required.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const body = await parseBody(req, contributeSchema);
  if (body instanceof NextResponse) return body;
  const { enterpriseId, amountEgp } = body;

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

  // Constitutional deduction: 0.5% of the closed Capital Formation amount.
  const contribution = Math.round((amountEgp * VAULT_CONTRIBUTION_PCT) / 100);

  // ── Atomic upsert + ledger event inside ONE transaction ──
  const vault = await db.$transaction(async (tx) => {
    const updated = await tx.insuranceVault.upsert({
      where: { enterpriseId },
      create: {
        enterpriseId,
        totalContributedEgp: contribution,
        currentBalanceEgp: contribution,
        totalLoanedEgp: 0,
        totalRepaidEgp: 0,
      },
      update: {
        totalContributedEgp: { increment: contribution },
        currentBalanceEgp: { increment: contribution },
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId,
      eventType: "vault_contribution",
      payload: {
        action: "anti_fragility_contribution",
        closeAmountEgp: amountEgp,
        contributionPct: VAULT_CONTRIBUTION_PCT,
        contributionEgp: contribution,
        newTotalContributedEgp: updated.totalContributedEgp,
        newCurrentBalanceEgp: updated.currentBalanceEgp,
        actorId: user.id,
      },
      actorId: user.id,
    });

    return updated;
  });

  await audit({
    actorId: user.id,
    action: "vault.contribute",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      closeAmountEgp: amountEgp,
      contributionEgp: contribution,
      currentBalanceEgp: vault.currentBalanceEgp,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      vault,
      contribution: { amountEgp: contribution, pct: VAULT_CONTRIBUTION_PCT },
    },
    { status: 201 }
  );
}, "POST /api/vault");
