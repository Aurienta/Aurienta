import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import {
  appendLedgerEvent,
  enforceKycGate,
  enforceNotFrozen,
  enforcePriceBand,
} from "@/lib/aurienta/cre";
import { orderSchema, parseBody } from "@/lib/aurienta/validation";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import {
  checkIdempotency,
  getIdempotencyContext,
  storeIdempotency,
} from "@/lib/aurienta/idempotency";

// POST /api/orders
// Body: { enterpriseId, side, shares, priceEgp, phase }
// Validates the order against the CRE fundamental_pricing.rego price band,
// KYC level gating, enterprise freeze state, and (if allowed) creates the
// TradeOrder + appends a ledger event inside a single transaction.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // ── Rate limit ──
  const rl = limiters.orders(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  // ── Validate body ──
  const body = await parseBody(req, orderSchema);
  if (body instanceof NextResponse) return body;
  const { enterpriseId, side, shares, priceEgp, phase } = body;

  // ── Idempotency (replay-safe POST for money-moving endpoint) ──
  // If the client sends an Idempotency-Key header, we replay the cached
  // response on retry. Without the header, the request is treated as a
  // normal non-idempotent POST (backward-compatible).
  const idemCtx = await getIdempotencyContext(req, user.id, body);
  if (idemCtx) {
    const cached = await checkIdempotency(idemCtx, "orders");
    if (cached) return cached;
  }

  // ── Fetch enterprise ──
  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
  });
  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found", code: "not_found" },
      { status: 404 }
    );
  }

  // ── RBAC: must be a member of the enterprise to place an order ──
  const isMember = user.memberships.some((m) => m.enterpriseId === enterpriseId);
  if (!isMember) {
    await audit({
      actorId: user.id,
      action: "order.create",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "not_a_member",
    });
    return NextResponse.json(
      { error: "Not a member of this enterprise", code: "forbidden" },
      { status: 403 }
    );
  }

  const amountEgp = priceEgp * shares;

  // ── CRE: KYC gate (CTO-AUDIT P0-8) ──
  const kyc = enforceKycGate(user.verificationLevel, "order", amountEgp);
  if (!kyc.allowed) {
    await audit({
      actorId: user.id,
      action: "order.create",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: kyc.reason,
      metadata: { policy: kyc.policy, decisionToken: kyc.decisionToken },
    });
    return NextResponse.json(
      {
        error: kyc.reason ?? "KYC gate denied the order",
        code: "cre_denied",
        policy: kyc.policy,
        decisionToken: kyc.decisionToken,
      },
      { status: 400 }
    );
  }

  // ── CRE: enterprise must not be frozen ──
  const freeze = enforceNotFrozen(enterprise);
  if (!freeze.allowed) {
    await audit({
      actorId: user.id,
      action: "order.create",
      target: `enterprise:${enterpriseId}`,
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

  // Sells must be backed by an existing holding (no shorting — non-amendable Rule I 1.8).
  if (side === "sell") {
    const holding = await db.ownershipRecord.findUnique({
      where: {
        enterpriseId_userId: { enterpriseId, userId: user.id },
      },
    });
    const owned = holding?.equityUnits ?? 0;
    if (owned < shares) {
      await audit({
        actorId: user.id,
        action: "order.create",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: "no_speculation_insufficient_units",
        metadata: { owned, requested: shares },
      });
      return NextResponse.json(
        {
          error: `No-speculation rule: you own ${owned} units, cannot sell ${shares}.`,
          code: "cre_denied",
          policy: "no_speculation.rego",
        },
        { status: 400 }
      );
    }
  }

  // ── CRE: enforce the fundamental_pricing.rego price band ──
  const verdict = enforcePriceBand(priceEgp, enterprise.equityUnitPriceEgp, phase);
  if (!verdict.allowed) {
    await audit({
      actorId: user.id,
      action: "order.create",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: verdict.reason,
      metadata: { policy: verdict.policy, decisionToken: verdict.decisionToken },
    });
    return NextResponse.json(
      {
        error: verdict.reason ?? "CRE denied the order",
        code: "cre_denied",
        policy: verdict.policy,
        decisionToken: verdict.decisionToken,
      },
      { status: 400 }
    );
  }

  // ── Fees: 0.5% platform fee always; 10% CGT on sells (capital gains) ──
  const gross = priceEgp * shares;
  const platformFee = +(gross * 0.005).toFixed(2);
  const cgt = side === "sell" ? +(gross * 0.1).toFixed(2) : 0;
  const feesEgp = +(platformFee + cgt).toFixed(2);

  // ── Persist order + ledger event inside ONE transaction ──
  const order = await db.$transaction(async (tx) => {
    const created = await tx.tradeOrder.create({
      data: {
        enterpriseId,
        userId: user.id,
        side,
        equityUnits: shares,
        priceEgp,
        phase,
        status: "open",
        feesEgp,
      },
      include: { enterprise: true },
    });

    await appendLedgerEvent(tx, {
      enterpriseId,
      eventType: "share_transferred",
      payload: {
        orderId: created.id,
        side,
        equityUnits: shares,
        priceEgp,
        phase,
        feesEgp,
        platformFee,
        cgt,
        gross,
        userId: user.id,
        counterparty: null,
        note:
          side === "sell"
            ? "Sell order listed on constitutional secondary market"
            : "Buy order listed on constitutional secondary market",
      },
      actorId: user.id,
    });

    return created;
  });

  await audit({
    actorId: user.id,
    action: "order.create",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      orderId: order.id,
      side,
      equityUnits: shares,
      priceEgp,
      phase,
      feesEgp,
      policy: verdict.policy,
      decisionToken: verdict.decisionToken,
    },
  });

  const responseBody = {
    ok: true,
    order: {
      id: order.id,
      side: order.side,
      equityUnits: order.equityUnits,
      priceEgp: order.priceEgp,
      phase: order.phase,
      status: order.status,
      feesEgp: order.feesEgp,
      enterprise: {
        id: order.enterprise.id,
        name: order.enterprise.name,
        slug: order.enterprise.slug,
      },
      createdAt: order.createdAt,
    },
    cre: {
      policy: verdict.policy,
      decisionToken: verdict.decisionToken,
    },
  };
  const status = 200;
  if (idemCtx) {
    await storeIdempotency(idemCtx, "orders", user.id, status, responseBody);
  }
  return NextResponse.json(responseBody, { status });
}
