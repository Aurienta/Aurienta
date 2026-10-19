"use client";

import { csrfFetch } from "@/lib/aurienta/csrf-client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  expenseId: string;
  status: string;
  variant?: "default" | "compact";
};

/**
 * Per-row reject button for an expense (DE-15 / AUD-022).
 *
 * Mirrors ApproveExpenseButton but calls POST
 * /api/expenses/[id]/reject with a reason (≥3 chars). The CRE enforces
 * separation-of-duties: the submitter cannot reject their own expense.
 *
 * Hidden when the expense is in a terminal state (approved/rejected/flagged).
 */
export function RejectExpenseButton({
  expenseId,
  status,
  variant = "default",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [reason, setReason] = React.useState("");

  // Hide entirely when the expense is in a terminal state — there is
  // nothing for the reviewer to reject.
  if (
    status === "approved" ||
    status === "rejected" ||
    status === "flagged"
  ) {
    return null;
  }

  async function onReject() {
    if (reason.trim().length < 3) {
      toast.error("Reason required", {
        description: "Provide at least 3 characters explaining the rejection.",
      });
      return;
    }
    setBusy(true);
    try {
      const res = await csrfFetch(`/api/expenses/${expenseId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Rejection failed.", {
          description: json.policy ? `Policy: ${json.policy}` : undefined,
        });
        return;
      }
      toast.success("Expense rejected.", {
        description: "The submitter has been notified with your reason.",
      });
      setOpen(false);
      setReason("");
      router.refresh();
    } catch {
      toast.error("Network error reaching the CRE.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setReason("");
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={variant === "compact" ? "sm" : "default"}
          className={cn(
            "h-9 gap-1.5 rounded-lg border border-destructive/40 bg-transparent font-sans text-xs font-medium text-destructive hover:bg-destructive/10",
            variant === "compact" && "h-8 px-3"
          )}
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            Reject expense
          </DialogTitle>
          <DialogDescription className="font-sans text-xs leading-relaxed">
            Provide a reason for rejecting this expense. The Constitutional
            Runtime Engine will record the decision on the immutable ledger and
            notify the submitter. This action is irrevocable.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor={`reject-reason-${expenseId}`}
            className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground"
          >
            Reason (≥ 3 characters)
          </Label>
          <Textarea
            id={`reject-reason-${expenseId}`}
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Vendor invoice does not match the board-approved budget line — please re-submit with corrected GL code."
            maxLength={2000}
            className="border-gold/20 bg-background/40 font-sans text-sm"
          />
          <p className="font-mono text-[11px] text-muted-foreground/80">
            {reason.length}/2000 chars
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={busy}
            className="font-sans text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onReject}
            disabled={busy || reason.trim().length < 3}
            className="gap-1.5 rounded-lg border border-destructive/40 bg-transparent font-sans text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            Reject expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
