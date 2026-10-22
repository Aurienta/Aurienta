// AURIENTA — REC-4 Cooperative Network API.
//
// GET  /api/cooperative/transactions?enterpriseId=<id>
//      → list B2B transactions for an enterprise (as buyer OR seller),
//        enriched with counterparty enterprise name/tier.
//
// POST /api/cooperative/transactions
//      Body: { buyerEnterpriseId, sellerEnterpriseId, description, amountEgp }
//      → creates a new cooperative transaction, gated by the CRE policy
//        `enforceCooperativeTransaction`. Returns the created row.
//
// Auth: session cookie. The caller must be a member of the buyer
// enterprise (any role) — B2B transactions are entered into by the buyer's
// operator seat.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { audit } from "@/lib/aurienta/audit";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import {
  createTransaction,
  listTransactions,
  getNetworkStats,
} from "@/lib/aurienta/cooperative-network";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — list transactions for an enterprise
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  if (!enterpriseId) {
    return NextResponse.json(
      { error: "enterpriseId query param is required", code: "missing_param" },
      { status: 400 }
    );
  }

  // Authorization: must be a member of this enterprise OR an aurienta_rep.
  const isMember = user.memberships.some(
    (m) => m.enterpriseId === enterpriseId
  );
  const isPlatformAdmin =
    user.primaryIntent === "aurienta_rep" ||
    user.memberships.some((m) => m.role === "aurienta_rep");
  if (!isMember && !isPlatformAdmin) {
    await audit({
      actorId: user.id,
      action: "cooperative.transactions.list",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "not_enterprise_member",
    });
    return NextResponse.json(
      {
        error: "Only enterprise members may view cooperative transactions.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  const [transactions, stats] = await Promise.all([
    listTransactions(enterpriseId),
    getNetworkStats(enterpriseId),
  ]);

  return NextResponse.json({ transactions, stats });
}, "GET /api/cooperative/transactions");

// POST — create a new cooperative transaction
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const rl = limiters.governance(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  let body: {
    buyerEnterpriseId?: string;
    sellerEnterpriseId?: string;
    description?: string;
    amountEgp?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body must be valid JSON" },
      { status: 400 }
    );
  }

  const buyerEnterpriseId = (body.buyerEnterpriseId ?? "").trim();
  const sellerEnterpriseId = (body.sellerEnterpriseId ?? "").trim();
  const description = (body.description ?? "").trim();
  const amountEgp = Math.floor(Number(body.amountEgp) || 0);

  if (!buyerEnterpriseId || !sellerEnterpriseId) {
    return NextResponse.json(
      { error: "buyerEnterpriseId and sellerEnterpriseId are required" },
      { status: 400 }
    );
  }
  if (description.length < 3) {
    return NextResponse.json(
      { error: "description must be at least 3 characters" },
      { status: 400 }
    );
  }
  if (amountEgp <= 0) {
    return NextResponse.json(
      { error: "amountEgp must be a positive integer" },
      { status: 400 }
    );
  }

  // Authorization: caller must be a member of the BUYER enterprise (the
  // party initiating the purchase). AURIENTA Reps may create on behalf of
  // any enterprise (e.g. for reconciliation).
  const isBuyerMember = user.memberships.some(
    (m) => m.enterpriseId === buyerEnterpriseId
  );
  const isPlatformAdmin =
    user.primaryIntent === "aurienta_rep" ||
    user.memberships.some((m) => m.role === "aurienta_rep");
  if (!isBuyerMember && !isPlatformAdmin) {
    await audit({
      actorId: user.id,
      action: "cooperative.transaction.create",
      target: `enterprise:${buyerEnterpriseId}`,
      result: "denied",
      reason: "not_buyer_member",
    });
    return NextResponse.json(
      {
        error:
          "Only members of the buyer enterprise may initiate a cooperative transaction.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  try {
    const transaction = await createTransaction({
      buyerEnterpriseId,
      sellerEnterpriseId,
      description,
      amountEgp,
      actorId: user.id,
    });
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "CRE denied";
    return NextResponse.json(
      { error: message, code: "cre_denied", policy: "cooperative_transaction.rego" },
      { status: 400 }
    );
  }
}, "POST /api/cooperative/transactions");
