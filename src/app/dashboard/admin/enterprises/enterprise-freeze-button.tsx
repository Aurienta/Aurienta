"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Unlock, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type RowEnterprise = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export function EnterpriseFreezeButton({
  enterprise,
  variant = "row",
}: {
  enterprise: RowEnterprise;
  variant?: "row" | "detail";
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const isFrozen = enterprise.status === "frozen";
  const action = isFrozen ? "unfreeze" : "freeze";

  const submit = async () => {
    if (action === "freeze" && reason.trim().length < 4) {
      toast.error("Please provide a reason (≥ 4 chars) for the freeze.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/enterprises/${enterprise.id}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            action === "freeze"
              ? { reason: reason.trim() }
              : { reason: reason.trim() || "Lifted by AURIENTA Rep" }
          ),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data?.error ?? `Failed to ${action} enterprise.`);
        return;
      }
      if (data.alreadyFrozen) {
        toast.info("Enterprise was already frozen.");
      } else if (data.notFrozen) {
        toast.info("Enterprise was not frozen.");
      } else {
        toast.success(
          action === "freeze"
            ? `Frozen: ${enterprise.name} — all money-moving actions blocked.`
            : `Unfrozen: ${enterprise.name} is now active.`
        );
      }
      setOpen(false);
      setReason("");
      router.refresh();
    } catch (e) {
      toast.error(`Network error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {variant === "row" ? (
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 font-sans text-[11px] font-medium transition-colors",
              isFrozen
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                : "border-rose-400/30 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20"
            )}
          >
            {isFrozen ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {isFrozen ? "Unfreeze" : "Freeze"}
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-sans text-sm font-medium transition-colors",
              isFrozen
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                : "border-rose-400/40 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20"
            )}
          >
            {isFrozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {isFrozen ? "Unfreeze Enterprise" : "Emergency Freeze"}
          </button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="border-gold/20 bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-lg">
            {action === "freeze" ? "Emergency Freeze" : "Lift Emergency Freeze"} — {enterprise.name}
          </AlertDialogTitle>
          <AlertDialogDescription className="font-sans text-sm text-muted-foreground">
            {action === "freeze"
              ? "Freezing the enterprise sets status=\"frozen\" and blocks ALL money-moving actions infrastructure-wide (the CRE's enforceNotFrozen policy already enforces this everywhere — share issuance, expenses, dividends, milestones). The action is audit-logged with your user ID."
              : "Unfreezing restores the enterprise to status=\"active\" and clears frozenAt. All transactions will be permitted again. The action is audit-logged."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="freeze-reason" className="font-sans text-xs">
            Reason {action === "unfreeze" && "(optional)"}
          </Label>
          <Textarea
            id="freeze-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              action === "freeze"
                ? "e.g. Whistleblower report WBR-0042 under investigation; capital-flow halt required pending FRA review."
                : "e.g. Investigation concluded (WBR-0042 resolved); enterprise cleared to resume operations."
            }
            rows={3}
            className="font-sans text-sm"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy} className="font-sans text-sm">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void submit();
            }}
            disabled={busy}
            className={cn(
              "font-sans text-sm",
              action === "freeze"
                ? "bg-rose-500 text-white hover:bg-rose-600"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            )}
          >
            {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {action === "freeze" ? "Freeze now" : "Unfreeze now"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function EnterpriseRowLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Link
      href={`/dashboard/admin/enterprises/${id}`}
      className="inline-flex items-center gap-1 rounded-md border border-gold/25 bg-gold/8 px-2 py-1 font-sans text-[11px] font-medium text-gold-light transition-colors hover:bg-gold/15"
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </Link>
  );
}
