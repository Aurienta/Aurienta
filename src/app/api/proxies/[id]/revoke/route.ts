// AURIENTA Voting Proxy Revoke API — Blueprint §16.2
// Allows a delegator to revoke an active proxy at any time.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/proxies/[id]/revoke — Revoke a voting proxy
export const POST = withErrorHandler(
  async (
    _req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
  ) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { params } = ctx;
    const { id } = await params;

  const proxy = await db.votingProxy.findUnique({ where: { id } });
  if (!proxy) {
    return NextResponse.json({ error: "Proxy not found" }, { status: 404 });
  }

  // Only the delegator can revoke
  if (proxy.delegatorId !== user.id) {
    return NextResponse.json(
      { error: "Only the delegator can revoke this proxy" },
      { status: 403 }
    );
  }

  if (proxy.revokedAt) {
    return NextResponse.json(
      { error: "Proxy already revoked" },
      { status: 400 }
    );
  }

  await db.$transaction(async (tx) => {
    await tx.votingProxy.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: proxy.enterpriseId,
      eventType: "voting_proxy_revoked",
      payload: {
        proxyId: id,
        delegatorId: user.id,
        delegateeId: proxy.delegateeId,
        scope: proxy.scope,
        votingPowerDelegated: proxy.votingPowerDelegated,
      },
      actorId: user.id,
    });
  });

  await audit({
    actorId: user.id,
    action: "voting_proxy.revoke",
    target: `proxy:${id}`,
    result: "allowed",
  });

  return NextResponse.json({ ok: true });
  },
  "POST /api/proxies/[id]/revoke"
);
