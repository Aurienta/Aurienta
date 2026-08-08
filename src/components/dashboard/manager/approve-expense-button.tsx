"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  expenseId: string;
  status: string;
  hasMySignature: boolean; // current user already on the expense as approver1/2
  variant?: "default" | "compact";
};

/**
 * Per-row approve / co-sign button for an expense.
 *  - pending            → "Approve (board)"
 *  - dual_signature_pending, hasMySignature=false → "Co-sign"
 *  - dual_signature_pending, hasMySignature=true  → "Awaiting 2nd" (disabled)
 *  - approved / flagged / rejected                → none
 */
export function ApproveExpenseButton({
  expenseId,
  status,
  hasMySignature,
  variant = "default",
}: Props) {
  const [busy, setBusy] = React.useState(false);
  const router = useRouter();

  // Hide entirely when there is nothing for the user to do.
  if (status === "approved" || status === "rejected" || status === "flagged") {
    return null;
  }
  if (status === "dual_signature_pending" && hasMySignature) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-gold/5 px-3 py-1 font-sans text-[11px] text-muted-foreground",
          variant === "compact" && "px-2 py-0.5 text-xs"
        )}
        title="Your signature is recorded; the constitutional dual-signature policy is awaiting the counterparty"
      >
        <PenLine className="h-3 w-3 text-gold/70" /> Awaiting 2nd signature
      </span>
    );
  }

  const label =
    status === "pending"
      ? "Approve (board)"
      : status === "dual_signature_pending"
      ? "Co-sign"
      : "Approve";

  async function onApprove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Approval failed.", {
          description: json.policy ? `Policy: ${json.policy}` : undefined,
        });
        return;
      }
      const finalised = json.expense?.status === "approved";
      toast.success(
        finalised ? "Expense approved & ledgered." : "Signature recorded — awaiting counterparty.",
        {
          description: finalised
            ? "Funds release authorised by CRE."
            : "Dual signature in progress.",
        }
      );
      router.refresh();
    } catch {
      toast.error("Network error reaching the CRE.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      size={variant === "compact" ? "sm" : "default"}
      onClick={onApprove}
      disabled={busy}
      className={cn(
        "h-9 bg-gold-gradient text-black hover:opacity-95",
        variant === "compact" && "h-8 px-3"
      )}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}
