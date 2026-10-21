// AURIENTA — REC-4 Cooperative Network API · PATCH /api/cooperative/transactions/[transactionId]
//
// Body: { action: "complete" }
//
// Marks a cooperative transaction as completed (settled). The caller must
// be a member of either the buyer OR seller enterprise. Sets status='completed'
// and completedAt=now, then appends a `cooperative_transaction_completed`
// ledger event so the settlement timestamp is tamper-evident.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { completeTransaction } from "@/lib/aurienta/cooperative-network";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ transactionId: string }> }) => {
    const { transactionId } = await params;
    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId is required" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }

    const rl = limiters.governance(user.id);
    if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

    let body: { action?: string };
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    if (body.action !== "complete") {
      return NextResponse.json(
        { error: "action must be 'complete'" },
        { status: 400 }
      );
    }

    // Authorization: caller must be a member of buyer OR seller.
    const tx = await db.cooperativeTransaction.findUnique({
      where: { id: transactionId },
      select: { buyerEnterpriseId: true, sellerEnterpriseId: true },
    });
    if (!tx) {
      return NextResponse.json(
        { error: "Transaction not found", code: "not_found" },
        { status: 404 }
      );
    }
    const isAuthorized =
      user.memberships.some((m) => m.enterpriseId === tx.buyerEnterpriseId) ||
      user.memberships.some((m) => m.enterpriseId === tx.sellerEnterpriseId);
    const isPlatformAdmin =
      user.primaryIntent === "aurienta_rep" ||
      user.memberships.some((m) => m.role === "aurienta_rep");
    if (!isAuthorized && !isPlatformAdmin) {
      await audit({
        actorId: user.id,
        action: "cooperative.transaction.complete",
        target: `cooperative_transaction:${transactionId}`,
        result: "denied",
        reason: "not_counterparty_member",
      });
      return NextResponse.json(
        {
          error: "Only members of the buyer or seller enterprise may complete this transaction.",
          code: "forbidden",
        },
        { status: 403 }
      );
    }

    try {
      const updated = await completeTransaction(transactionId, user.id);
      return NextResponse.json({ transaction: updated });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to complete transaction";
      const status = message.includes("not_found") ? 404
        : message.includes("already_completed") ? 409
        : 400;
      return NextResponse.json(
        { error: message, code: "complete_failed" },
        { status }
      );
    }
  },
  "PATCH /api/cooperative/transactions/[transactionId]"
);
