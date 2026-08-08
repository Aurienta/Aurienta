import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { syndicateJoinSchema, parseBody } from "@/lib/aurienta/validation";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

// POST /api/syndicates/[id]/join
// Body: { shares, amount? }
// Joins a forming syndicate. Funds still flow to the Law Firm Client Account individually — this just
// registers the partner's commitment in the syndicate's coordination record.
//
// FIX (CTO-AUDIT): the ledger append was OUTSIDE the db.$transaction. It's now
// INSIDE so the committed-shares increment + member row + ledger event commit
// atomically. P2002 on (syndicateId, userId) → 409 (already a member).
export async function POST(
  req: NextRequest,
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
  const rl = limiters.governance(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  const { id } = await params;

  // ── Validate body ──
  const body = await parseBody(req, syndicateJoinSchema);
  if (body instanceof NextResponse) return body;
  const sharesNum = body.shares;

  const syndicate = await db.syndicate.findUnique({
    where: { id },
    include: {
      enterprise: {
        select: { id: true, name: true, slug: true, equityUnitPriceEgp: true, tier: true },
      },
      members: true,
    },
  });

  if (!syndicate) {
    return NextResponse.json({ error: "Syndicate not found", code: "not_found" }, { status: 404 });
  }

  if (syndicate.status !== "forming") {
    return NextResponse.json(
      { error: `Syndicate is ${syndicate.status} — join window closed.`, code: "conflict" },
      { status: 400 }
    );
  }

  // Lead partner cannot join (they're already counted as the founder).
  if (syndicate.leadPartnerId === user.id) {
    return NextResponse.json(
      { error: "You are already the lead partner of this syndicate.", code: "conflict" },
      { status: 400 }
    );
  }

  // Unique constraint guard — only one membership per syndicate.
  const existing = syndicate.members.find((m) => m.userId === user.id);
  if (existing) {
    return NextResponse.json(
      { error: "You are already a member of this syndicate.", code: "conflict" },
      { status: 409 }
    );
  }

  // Validate amount against the enterprise's AI fundamental price.
  const fundamentalPrice = syndicate.enterprise.equityUnitPriceEgp;
  const expectedAmount = Math.round(sharesNum * fundamentalPrice);
  const submittedAmount = Math.round(Number(body.amount ?? expectedAmount));
  const drift = Math.abs(submittedAmount - expectedAmount) / expectedAmount;
  if (drift > 0.05) {
    return NextResponse.json(
      {
        error: `Amount must be within ±5% of the AI fundamental price (${expectedAmount} EGP).`,
        code: "cre_denied",
        policy: "fundamental_pricing.rego",
        expectedAmount,
      },
      { status: 400 }
    );
  }

  // Cap against target shares (no over-commitment).
  const remaining = Math.max(syndicate.targetShares - syndicate.committedShares, 0);
  if (sharesNum > remaining) {
    return NextResponse.json(
      {
        error: `Only ${remaining} shares remain in this syndicate (target ${syndicate.targetShares}).`,
        remaining,
        code: "conflict",
      },
      { status: 400 }
    );
  }

  // ── Create membership + bump committed total + ledger event inside ONE tx ──
  let member;
  try {
    [member] = await db.$transaction(async (tx) => {
      const created = await tx.syndicateMember.create({
        data: {
          syndicateId: id,
          userId: user.id,
          equityUnits: sharesNum,
          amountEgp: submittedAmount,
        },
      });

      await tx.syndicate.update({
        where: { id },
        data: {
          committedShares: { increment: sharesNum },
          status:
            syndicate.committedShares + sharesNum >= syndicate.targetShares
              ? "active"
              : "forming",
        },
      });

      await appendLedgerEvent(tx, {
        enterpriseId: syndicate.enterpriseId,
        eventType: "cre_decision",
        payload: {
          action: "syndicate_join",
          syndicateId: id,
          syndicateName: syndicate.name,
          memberId: created.id,
          userId: user.id,
          equityUnits: sharesNum,
          amountEgp: submittedAmount,
          note: "Partner joined syndicate. Each partner's funds still flow to the Law Firm Client Account individually with a unique reference.",
        },
        actorId: user.id,
      });

      return [created];
    });
  } catch (e: unknown) {
    // P2002 = unique constraint on (syndicateId, userId) — concurrent join.
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      await audit({
        actorId: user.id,
        action: "syndicate.join",
        target: `syndicate:${id}`,
        result: "denied",
        reason: "duplicate_concurrent_join",
      });
      return NextResponse.json(
        { error: "You are already a member of this syndicate.", code: "conflict" },
        { status: 409 }
      );
    }
    throw e;
  }

  await audit({
    actorId: user.id,
    action: "syndicate.join",
    target: `syndicate:${id}`,
    result: "allowed",
    metadata: {
      memberId: member.id,
      equityUnits: sharesNum,
      amountEgp: submittedAmount,
    },
  });

  return NextResponse.json({ member, ok: true });
}
