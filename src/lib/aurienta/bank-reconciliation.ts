// AURIENTA — Bank Reconciliation Module (ERP Accounting)
// Matches bank statements against ledger transactions.
// Legal: Not a licensed accounting service. Uses Egyptian Accounting Standards (EAS).

import { db } from "@/lib/db";
import { audit } from "./audit";
import { logger } from "./logger";

export type BankTransaction = {
  id: string;
  enterpriseId: string;
  date: Date;
  description: string;
  amount: number; // positive = credit, negative = debit
  matchedLedgerId?: string;
  status: "unmatched" | "matched" | "ignored";
};

export type ReconciliationResult = {
  totalBankTransactions: number;
  matched: number;
  unmatched: number;
  totalCredits: number;
  totalDebits: number;
  netFlow: number;
};

export async function importBankStatement(params: {
  enterpriseId: string;
  transactions: { date: string; description: string; amount: number }[];
  importedBy: string;
}): Promise<{ imported: number }> {
  let count = 0;
  for (const tx of params.transactions) {
    const id = `bank-${Date.now()}-${count}`;
    const bankTx: BankTransaction = {
      id,
      enterpriseId: params.enterpriseId,
      date: new Date(tx.date),
      description: tx.description,
      amount: tx.amount,
      status: "unmatched",
    };

    await audit({
      actorId: params.importedBy,
      action: "bank_transaction_imported",
      target: `bank_recon:${id}`,
      result: "allowed",
      metadata: { ...bankTx, legalBasis: "Egyptian Accounting Standards (EAS) — bank reconciliation" },
    });
    count++;
  }

  logger.info("Bank statement imported", { enterpriseId: params.enterpriseId, count });
  return { imported: count };
}

export async function reconcileTransaction(params: {
  bankTransactionId: string;
  ledgerEventId: string;
  reconciledBy: string;
}): Promise<void> {
  await audit({
    actorId: params.reconciledBy,
    action: "bank_reconciliation_matched",
    target: `bank_recon:${params.bankTransactionId}`,
    result: "allowed",
    metadata: { bankTransactionId: params.bankTransactionId, ledgerEventId: params.ledgerEventId },
  });

  logger.info("Transaction reconciled", params);
}

export async function getReconciliationStatus(enterpriseId: string): Promise<ReconciliationResult> {
  const records = await db.auditLog.findMany({
    where: { action: "bank_transaction_imported", target: { contains: "bank_recon:" } },
    take: 500,
  });

  const transactions = records.map((r) => {
    const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata as any;
    return meta as BankTransaction;
  }).filter((t) => t.enterpriseId === enterpriseId);

  const matched = transactions.filter((t) => t.status === "matched").length;
  const credits = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const debits = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return {
    totalBankTransactions: transactions.length,
    matched,
    unmatched: transactions.length - matched,
    totalCredits: credits,
    totalDebits: debits,
    netFlow: credits - debits,
  };
}
