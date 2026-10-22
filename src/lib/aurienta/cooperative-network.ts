// AURIENTA — REC-4: Enterprise Cooperative Network (B2B transactions)
//
// Constitutional B2B exchange between Aurienta enterprises. A cooperative
// transaction is a recorded purchase/sale of goods or services between two
// Network-member enterprises. Every transaction is gated by the
// `enforceCooperativeTransaction` CRE policy (REC-4) and anchored to the
// immutable ledger via `appendLedgerEvent`.
//
// Constitutional invariants honoured here:
//   - Real Economy Only (I 1.8) — buyer + seller must both be existing
//     Enterprise rows. No synthetic counterparties.
//   - Anti-Capture (I 1.5) — a single transaction may not exceed 10% of the
//     buyer's working capital (enforced by enforceCooperativeTransaction).
//   - Zero Custody (I 1.1) — AURIENTA never holds the transaction amount.
//     The amount is a PLEDGE to settle via regulated bank rails; this module
//     records the agreement, it does NOT move money.
//
// Lifecycle:
//   pending → cre_verified → completed
//   pending → cre_verified → disputed  (not implemented in this gap)
//   pending → denied (CRE rejected — row never created)

import { db } from "@/lib/db";
import type { PrismaTransaction } from "@/lib/db";
import {
  appendLedgerEvent,
  enforceCooperativeTransaction,
} from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

// ── Types ──────────────────────────────────────────────────────────────────

export type CooperativeTransactionRow = {
  id: string;
  buyerEnterpriseId: string;
  sellerEnterpriseId: string;
  description: string;
  amountEgp: number;
  status: string;
  creDecisionToken: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type NetworkStats = {
  totalPartners: number;
  totalVolume: number;
  activeTransactions: number;
};

export type TransactionWithEnterprises = CooperativeTransactionRow & {
  buyerName: string;
  buyerTier: string;
  sellerName: string;
  sellerTier: string;
};

export type CreateTransactionParams = {
  buyerEnterpriseId: string;
  sellerEnterpriseId: string;
  description: string;
  amountEgp: number;
  actorId: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function toExternal(r: {
  id: string;
  buyerEnterpriseId: string;
  sellerEnterpriseId: string;
  description: string;
  amountEgp: number;
  status: string;
  creDecisionToken: string | null;
  createdAt: Date;
  completedAt: Date | null;
}): CooperativeTransactionRow {
  return {
    id: r.id,
    buyerEnterpriseId: r.buyerEnterpriseId,
    sellerEnterpriseId: r.sellerEnterpriseId,
    description: r.description,
    amountEgp: r.amountEgp,
    status: r.status,
    creDecisionToken: r.creDecisionToken,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Create a new cooperative B2B transaction. The CRE policy
 * `enforceCooperativeTransaction` is enforced BEFORE the row is written —
 * denials are audit-logged and surfaced as thrown Errors (the API route
 * translates to HTTP 400).
 *
 * On success, the row is persisted with status='cre_verified' and the CRE
 * decision token, and a `cooperative_transaction_created` ledger event is
 * appended to the buyer enterprise's hash-chain.
 */
export async function createTransaction(
  params: CreateTransactionParams
): Promise<CooperativeTransactionRow> {
  if (params.buyerEnterpriseId === params.sellerEnterpriseId) {
    throw new Error("Buyer and seller cannot be the same enterprise");
  }
  if (params.amountEgp <= 0) {
    throw new Error("Transaction amount must be positive");
  }
  if (params.description.trim().length < 3) {
    throw new Error("Description must be at least 3 characters");
  }

  // Real Economy Only — both counterparties must exist.
  const [buyer, seller] = await Promise.all([
    db.enterprise.findUnique({
      where: { id: params.buyerEnterpriseId },
      select: {
        id: true,
        name: true,
        tier: true,
        raisedEgp: true,
        lawFirmClientAccountBalanceEgp: true,
      },
    }),
    db.enterprise.findUnique({
      where: { id: params.sellerEnterpriseId },
      select: { id: true, name: true, tier: true },
    }),
  ]);
  if (!buyer) throw new Error("buyer_not_found");
  if (!seller) throw new Error("seller_not_found");

  // Buyer "capital" for the 10% cap = max(working cash, raised capital).
  // This prevents shell enterprises with empty cash accounts from bypassing
  // the cap by pointing at a 0-EGP denominator.
  const buyerCapitalEgp = Math.max(
    buyer.lawFirmClientAccountBalanceEgp ?? 0,
    buyer.raisedEgp ?? 0,
    1
  );

  const verdict = enforceCooperativeTransaction({
    buyerEnterpriseId: params.buyerEnterpriseId,
    sellerEnterpriseId: params.sellerEnterpriseId,
    amountEgp: params.amountEgp,
    buyerCapitalEgp,
  });

  if (!verdict.allowed) {
    await audit({
      actorId: params.actorId,
      action: "cooperative.transaction.create",
      target: `enterprise:${params.buyerEnterpriseId}`,
      result: "denied",
      reason: verdict.reason,
      metadata: {
        buyerEnterpriseId: params.buyerEnterpriseId,
        sellerEnterpriseId: params.sellerEnterpriseId,
        amountEgp: params.amountEgp,
        buyerCapitalEgp,
        policy: verdict.policy,
      },
    });
    logger.warn("cooperative.transaction_denied", {
      buyerId: params.buyerEnterpriseId,
      sellerId: params.sellerEnterpriseId,
      amountEgp: params.amountEgp,
      reason: verdict.reason,
    });
    throw new Error(verdict.reason ?? "Cooperative transaction denied by CRE");
  }

  const created = await db.$transaction(async (tx: PrismaTransaction) => {
    const row = await tx.cooperativeTransaction.create({
      data: {
        buyerEnterpriseId: params.buyerEnterpriseId,
        sellerEnterpriseId: params.sellerEnterpriseId,
        description: params.description.trim(),
        amountEgp: params.amountEgp,
        status: "cre_verified",
        creDecisionToken: verdict.decisionToken,
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: params.buyerEnterpriseId,
      eventType: "cooperative_transaction_created",
      payload: {
        transactionId: row.id,
        buyerEnterpriseId: params.buyerEnterpriseId,
        buyerName: buyer.name,
        sellerEnterpriseId: params.sellerEnterpriseId,
        sellerName: seller.name,
        amountEgp: row.amountEgp,
        description: row.description,
        creDecisionToken: row.creDecisionToken,
        note:
          "REC-4 Cooperative Network B2B transaction recorded. Zero Custody " +
          "(I 1.1) — AURIENTA does not hold the transaction amount; " +
          "settlement occurs via regulated bank rails between the two " +
          "enterprises directly.",
      },
      actorId: params.actorId,
    });

    return row;
  });

  await audit({
    actorId: params.actorId,
    action: "cooperative.transaction.create",
    target: `cooperative_transaction:${created.id}`,
    result: "allowed",
    metadata: {
      buyerEnterpriseId: params.buyerEnterpriseId,
      sellerEnterpriseId: params.sellerEnterpriseId,
      amountEgp: params.amountEgp,
      buyerCapitalEgp,
    },
  });

  logger.info("cooperative.transaction_created", {
    transactionId: created.id,
    buyerEnterpriseId: params.buyerEnterpriseId,
    sellerEnterpriseId: params.sellerEnterpriseId,
    amountEgp: params.amountEgp,
  });

  return toExternal(created);
}

/**
 * List B2B transactions where the given enterprise is either the buyer OR
 * the seller. Newest first. Each row is enriched with the counterparty
 * enterprise's display name + tier.
 */
export async function listTransactions(
  enterpriseId: string
): Promise<TransactionWithEnterprises[]> {
  const rows = await db.cooperativeTransaction.findMany({
    where: {
      OR: [
        { buyerEnterpriseId: enterpriseId },
        { sellerEnterpriseId: enterpriseId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  if (rows.length === 0) return [];

  // Plain-String FKs — join the counterparty names manually.
  const entIds = new Set<string>();
  for (const r of rows) {
    entIds.add(r.buyerEnterpriseId);
    entIds.add(r.sellerEnterpriseId);
  }
  const enterprises = await db.enterprise.findMany({
    where: { id: { in: Array.from(entIds) } },
    select: { id: true, name: true, tier: true },
  });
  const byId = new Map(enterprises.map((e) => [e.id, e]));

  return rows.map((r) => {
    const buyer = byId.get(r.buyerEnterpriseId);
    const seller = byId.get(r.sellerEnterpriseId);
    return {
      ...toExternal(r),
      buyerName: buyer?.name ?? "Unknown enterprise",
      buyerTier: buyer?.tier ?? "?",
      sellerName: seller?.name ?? "Unknown enterprise",
      sellerTier: seller?.tier ?? "?",
    };
  });
}

/**
 * Mark a transaction as completed (settled). Sets status='completed' and
 * completedAt=now. Appends a `cooperative_transaction_completed` ledger
 * event so the settlement timestamp is tamper-evident.
 */
export async function completeTransaction(
  transactionId: string,
  actorId: string
): Promise<CooperativeTransactionRow> {
  const existing = await db.cooperativeTransaction.findUnique({
    where: { id: transactionId },
  });
  if (!existing) throw new Error("transaction_not_found");
  if (existing.status === "completed") {
    throw new Error("Transaction is already completed");
  }

  const updated = await db.$transaction(async (tx: PrismaTransaction) => {
    const row = await tx.cooperativeTransaction.update({
      where: { id: transactionId },
      data: { status: "completed", completedAt: new Date() },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: row.buyerEnterpriseId,
      eventType: "cooperative_transaction_completed",
      payload: {
        transactionId: row.id,
        buyerEnterpriseId: row.buyerEnterpriseId,
        sellerEnterpriseId: row.sellerEnterpriseId,
        amountEgp: row.amountEgp,
        completedAt: row.completedAt!.toISOString(),
      },
      actorId,
    });

    return row;
  });

  await audit({
    actorId,
    action: "cooperative.transaction.complete",
    target: `cooperative_transaction:${transactionId}`,
    result: "allowed",
    metadata: {
      amountEgp: updated.amountEgp,
      buyerEnterpriseId: updated.buyerEnterpriseId,
      sellerEnterpriseId: updated.sellerEnterpriseId,
    },
  });

  return toExternal(updated);
}

/**
 * Network stats for an enterprise: unique counterparty enterprises, total
 * transaction volume (sum of all amounts), and count of transactions in
 * the active pipeline (pending or cre_verified, not yet completed).
 */
export async function getNetworkStats(
  enterpriseId: string
): Promise<NetworkStats> {
  const rows = await db.cooperativeTransaction.findMany({
    where: {
      OR: [
        { buyerEnterpriseId: enterpriseId },
        { sellerEnterpriseId: enterpriseId },
      ],
    },
    select: {
      buyerEnterpriseId: true,
      sellerEnterpriseId: true,
      amountEgp: true,
      status: true,
    },
  });

  const partners = new Set<string>();
  let totalVolume = 0;
  let activeTransactions = 0;

  for (const r of rows) {
    if (r.buyerEnterpriseId !== enterpriseId) {
      partners.add(r.buyerEnterpriseId);
    }
    if (r.sellerEnterpriseId !== enterpriseId) {
      partners.add(r.sellerEnterpriseId);
    }
    totalVolume += r.amountEgp;
    if (r.status === "pending" || r.status === "cre_verified") {
      activeTransactions += 1;
    }
  }

  return {
    totalPartners: partners.size,
    totalVolume,
    activeTransactions,
  };
}
