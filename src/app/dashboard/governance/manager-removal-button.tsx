"use client";

// Art. 118 Manager Removal Protocol — client component.
//
// Renders a "Remove Manager" button on the governance page for enterprises
// that have an active manager. Visible ONLY to users holding one of the
// founding_operator, company_owner, or board_member roles in the enterprise
// (per the Art. 118 protocol — the founding operator / owner / board are the
// parties that may convene a removal vote).
//
// On click, opens a confirmation dialog explaining the Art. 118 process:
//   • 48h cooling-off period (no votes during this window)
//   • 72h voting window (after cooling)
//   • 50% pass threshold (simple majority of votes cast, 51% quorum)
//   • CRE policy art118_manager_removal.rego gates the actual unbind at
//     execution time — the manager role is NOT removed until the vote passes.
//
// On confirm, POSTs a manager_removal proposal to /api/proposals. The
// proposal enters the standard cooling/voting lifecycle. The unbind itself
// happens via the proposal executor (which calls enforceManagerRemoval()
// from cre.ts).

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShieldAlert, Scale, Clock, Vote } from "lucide-react";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { PROPOSAL_TYPES } from "@/lib/aurienta/constants";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ManagerRemovalButtonProps = {
  enterpriseId: string;
  enterpriseName: string;
  /** The active manager to remove. When null/undefined, the button is hidden. */
  manager?: { id: string; name: string } | null;
  /** The current user's role in this enterprise. The button is only rendered
   *  for founding_operator, company_owner, or board_member. */
  userRole?: string;
  /** Optional className override for the trigger button. */
  triggerClassName?: string;
};

const AUTHORIZED_ROLES = new Set([
  "founding_operator",
  "company_owner",
  "board_member",
]);

export function ManagerRemovalButton({
  enterpriseId,
  enterpriseName,
  manager,
  userRole,
  triggerClassName,
}: ManagerRemovalButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [reason, setReason] = React.useState("");

  // ── Visibility gate (defense-in-depth — server should also gate) ──
  if (!manager || (userRole && !AUTHORIZED_ROLES.has(userRole))) {
    return null;
  }

  const meta = PROPOSAL_TYPES.manager_removal;

  async function handleConfirm() {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10) {
      toast.error("Grounds for removal required", {
        description:
          "Provide a brief constitutional basis for the removal (minimum 10 characters).",
      });
      return;
    }
    if (!manager) return;
    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId,
          type: "manager_removal",
          title: `Remove Manager: ${manager.name}`,
          description: [
            `Constitutional basis: Art. 118 (Manager Removal Protocol).`,
            `Target manager: ${manager.name} (user:${manager.id}).`,
            `Enterprise: ${enterpriseName}.`,
            ``,
            `Grounds for removal:`,
            trimmedReason,
            ``,
            `This proposal is gated by the CRE policy art118_manager_removal.rego — the manager role will not be unbound unless the shareholder vote passes by simple majority (≥50% of votes cast, 51% quorum).`,
          ].join("\n"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Manager-removal proposal rejected", {
          description:
            res.status === 403
              ? "You are not a member of this enterprise."
              : data?.error || "Please try again.",
        });
        return;
      }
      toast.success("Art. 118 removal proposal published", {
        description: `Cooling ${meta.cooling} · Voting ${meta.voting} · Pass ${meta.threshold}%. CRE verdict recorded on the ledger.`,
      });
      setOpen(false);
      setReason("");
      router.refresh();
    } catch {
      toast.error("Network error", {
        description: "Could not reach the constitutional ledger.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setReason("");
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 w-full gap-2 rounded-xl border-red-500/40 bg-red-500/[0.04] text-red-200 hover:bg-red-500/10 hover:text-red-100",
            triggerClassName
          )}
        >
          <ShieldAlert className="h-4 w-4" />
          Remove Manager
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="max-w-xl border-red-500/30 bg-popover/95 p-0 backdrop-blur-xl sm:max-w-xl">
        <AlertDialogHeader className="space-y-2 border-b border-red-500/15 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-red-300" />
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Art. 118 · Manager Removal Protocol
            </span>
          </div>
          <AlertDialogTitle className="font-serif text-xl">
            Remove Manager — {manager.name}
          </AlertDialogTitle>
          <AlertDialogDescription className="font-sans text-[12px] text-muted-foreground">
            Initiating a manager-removal proposal is a constitutional action. The proposal will
            enter a cooling-off period, then a shareholder vote. The manager role is{" "}
            <span className="font-semibold text-foreground">not</span> unbound until the vote
            passes — the CRE policy <code className="font-mono text-[11px]">art118_manager_removal.rego</code>{" "}
            gates the actual role unbind at execution time.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[55vh] overflow-y-auto px-5 py-4 sm:px-6">
          {/* Process timeline */}
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-gold/10 bg-gold/[0.04] p-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gold/80" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Cooling
                </span>
              </div>
              <p className="mt-1 font-serif text-sm font-semibold text-gold-light">
                {meta.cooling}
              </p>
              <p className="font-sans text-[11px] text-muted-foreground/80">
                No votes during this window.
              </p>
            </div>
            <div className="rounded-lg border border-gold/10 bg-gold/[0.04] p-3">
              <div className="flex items-center gap-1.5">
                <Vote className="h-3.5 w-3.5 text-gold/80" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Voting
                </span>
              </div>
              <p className="mt-1 font-serif text-sm font-semibold text-gold-light">
                {meta.voting}
              </p>
              <p className="font-sans text-[11px] text-muted-foreground/80">
                Shareholders cast votes.
              </p>
            </div>
            <div className="rounded-lg border border-gold/10 bg-gold/[0.04] p-3">
              <div className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-gold/80" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Threshold
                </span>
              </div>
              <p className="mt-1 font-serif text-sm font-semibold text-gold-light">
                {meta.threshold}%
              </p>
              <p className="font-sans text-[11px] text-muted-foreground/80">
                Simple majority · 51% quorum.
              </p>
            </div>
          </div>

          {/* Manager info */}
          <div className="mt-4 rounded-lg border border-red-500/15 bg-red-500/[0.04] p-3">
            <p className="font-sans text-[12px] text-muted-foreground">
              Target manager
            </p>
            <p className="mt-0.5 font-serif text-sm font-semibold text-red-100">
              {manager.name}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground/80">
              {manager.id}
            </p>
          </div>

          {/* Reason input */}
          <div className="mt-4 space-y-2">
            <Label
              htmlFor="removal-reason"
              className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
            >
              Grounds for removal
            </Label>
            <Textarea
              id="removal-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Cite the constitutional basis (Art. 118) and the evidence summary supporting the removal."
              maxLength={1000}
              className="min-h-24 resize-none border-gold/15 bg-foreground/[0.02] font-sans text-sm"
            />
            <p className="text-right font-mono text-[11px] text-muted-foreground/80">
              {reason.length}/1000
            </p>
          </div>
        </div>

        <AlertDialogFooter className="border-t border-red-500/15 p-5 sm:px-6">
          <AlertDialogCancel
            className="h-10 rounded-lg text-muted-foreground hover:text-foreground"
            disabled={submitting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              // Prevent the default AlertDialog auto-close so we control it.
              e.preventDefault();
              void handleConfirm();
            }}
            disabled={submitting || reason.trim().length < 10}
            className="h-10 gap-2 rounded-lg border-red-500/40 bg-red-500/15 text-red-100 hover:bg-red-500/25 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" />
                Create removal proposal
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
