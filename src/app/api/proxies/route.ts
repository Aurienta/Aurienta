// AURIENTA Voting Proxy API — Blueprint §16.2
// Allows a Constitutional Partner to delegate their voting power
// to another partner for a specified scope (all proposals, a specific
// proposal type, or a specific proposal).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { z } from "zod";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const proxySchema = z.object({
  enterpriseId: z.string().min(1),
  delegateeId: z.string().min(1),
  scope: z.enum(["all", "specific_proposal", "proposal_type"]).default("all"),
  proposalId: z.string().optional(),
  proposalType: z.string().optional(),
  endsAt: z.string().datetime().optional(),
});

// POST /api/proxies — Create a voting proxy delegation
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = proxySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { enterpriseId, delegateeId, scope, proposalId, proposalType, endsAt } = parsed.data;

  // Must be a member of the enterprise
  const membership = user.memberships.find((m) => m.enterpriseId === enterpriseId);
  if (!membership) {
    return NextResponse.json(
      { error: "Not a member of this enterprise" },
      { status: 403 }
    );
  }

  // Can't delegate to yourself
  if (delegateeId === user.id) {
    return NextResponse.json(
      { error: "Cannot delegate voting power to yourself" },
      { status: 400 }
    );
  }

  // Delegatee must also be a member
  const delegateeMember = await db.enterpriseMember.findFirst({
    where: { enterpriseId, userId: delegateeId },
  });
  if (!delegateeMember) {
    return NextResponse.json(
      { error: "Delegatee is not a member of this enterprise" },
      { status: 400 }
    );
  }

  // Get the delegator's voting power (equity units)
  const holding = await db.ownershipRecord.findUnique({
    where: { enterpriseId_userId: { enterpriseId, userId: user.id } },
  });
  const votingPower = holding?.equityUnits ?? 0;
  if (votingPower <= 0) {
    return NextResponse.json(
      { error: "You have no voting power to delegate (0 Equity Units)" },
      { status: 400 }
    );
  }

  // Check for existing active proxy (can't have two active "all" proxies)
  if (scope === "all") {
    const existing = await db.votingProxy.findFirst({
      where: {
        enterpriseId,
        delegatorId: user.id,
        scope: "all",
        revokedAt: null,
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have an active 'all' proxy. Revoke it first." },
        { status: 409 }
      );
    }
  }

  const proxy = await db.$transaction(async (tx) => {
    const created = await tx.votingProxy.create({
      data: {
        enterpriseId,
        delegatorId: user.id,
        delegateeId,
        scope,
        proposalId: scope === "specific_proposal" ? proposalId : null,
        proposalType: scope === "proposal_type" ? proposalType : null,
        votingPowerDelegated: votingPower,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId,
      eventType: "voting_proxy_created",
      payload: {
        proxyId: created.id,
        delegatorId: user.id,
        delegateeId,
        scope,
        proposalId: created.proposalId,
        proposalType: created.proposalType,
        votingPowerDelegated: votingPower,
        endsAt: created.endsAt,
      },
      actorId: user.id,
    });

    return created;
  });

  await audit({
    actorId: user.id,
    action: "voting_proxy.create",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: { proxyId: proxy.id, delegateeId, scope, votingPower },
  });

  return NextResponse.json({ ok: true, proxy });
}, "POST /api/proxies");

// GET /api/proxies?enterpriseId=xxx — List the user's proxies (delegated + received)
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");

  const where = enterpriseId
    ? {
        enterpriseId,
        revokedAt: null,
        OR: [
          { endsAt: null },
          { endsAt: { gt: new Date() } },
        ],
        AND: [
          {
            OR: [
              { delegatorId: user.id },
              { delegateeId: user.id },
            ],
          },
        ],
      }
    : {
        revokedAt: null,
        OR: [
          { endsAt: null },
          { endsAt: { gt: new Date() } },
        ],
        AND: [
          {
            OR: [
              { delegatorId: user.id },
              { delegateeId: user.id },
            ],
          },
        ],
      };

  const proxies = await db.votingProxy.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      delegator: { select: { id: true, legalName: true } },
      delegatee: { select: { id: true, legalName: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    delegated: proxies.filter((p) => p.delegatorId === user.id),
    received: proxies.filter((p) => p.delegateeId === user.id),
  });
}, "GET /api/proxies");
