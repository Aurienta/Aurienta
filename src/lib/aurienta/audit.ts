// AURIENTA audit logging — every state-changing action is recorded.
// AuditLog is the non-ledger audit trail (logins, role changes, KYC updates,
// CRE denials, rate-limit hits). The immutable LedgerEvent chain is for
// financial events; AuditLog is for everything else.

import { db } from "@/lib/db";

export type AuditEntry = {
  actorId?: string;
  action: string; // e.g. "auth.signin", "proposal.create", "cre.deny"
  target?: string; // e.g. "enterprise:abc123", "user:def456"
  result: "allowed" | "denied";
  reason?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        target: entry.target,
        result: entry.result,
        reason: entry.reason,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        ip: entry.ip,
        userAgent: entry.userAgent,
      },
    });
  } catch (e) {
    // Audit logging must never break the request flow.
    console.error("[audit] failed to write audit log:", e);
  }
}
