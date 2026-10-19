"use client";

import { csrfFetch } from "@/lib/aurienta/csrf-client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  milestoneId: string;
  milestoneTitle: string;
  amountEgp: number;
  enterpriseName?: string;
  variant?: "default" | "compact";
};

/**
 * Accountant Milestone Release button (Amendment IX / AUD-022).
 *
 * The certified accounting firm verifies milestone evidence and authorizes
 * the release of funds from the Law Firm Client Account to the enterprise's
 * operating account via POST /api/milestones/[id]/accountant-release.
 *
 * Body:
 *   { action: "verify" | "reject", verificationNote?: string }
 *
 * On "verify": the CRE enforces the accountant gate + fund flow + zero
 * custody. If all checks pass, the milestone status moves to "released",
 * the Law Firm Client Account is decremented, fees (5% platform + 2.5%
 * consulting unless opted out) are deducted, and the net amount is
 * credited to enterprise operations. A `milestone_released` ledger event
 * is appended.
 *
 * On "reject": the milestone is moved to "rejected" with the verification
 * note, and a `milestone_rejected` ledger event is appended.
 *
 * Only accounting_firm_rep roles scoped to the milestone's enterprise may
 * call this endpoint — the API enforces RBAC server-side.
 */
export function MilestoneAccountantReleaseButton({
  milestoneId,
  milestoneTitle,
  amountEgp,
  enterpriseName,
  variant = "default",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [action, setAction] = React.useState<"verify" | "reject">("verify");
  const [verificationNote, setVerificationNote] = React.useState("");

  async function onSubmit() {
    if (busy) return;
    if (action === "reject" && verificationNote.trim().length < 3) {
      toast.error("Verification note required", {
        description:
          "When rejecting, provide at least 3 characters of explanation for the founder.",
      });
      return;
    }
    setBusy(true);
    try {
      const res = await csrfFetch(
        `/api/milestones/${milestoneId}/accountant-release`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            verificationNote: verificationNote.trim() || undefined,
          }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? json.message ?? "Release failed.", {
          description: json.policy ? `Policy: ${json.policy}` : undefined,
        });
        return;
      }
      toast.success(
        action === "verify"
          ? "Milestone funds released."
          : "Milestone rejected.",
        {
          description:
            action === "verify"
              ? `Net amount credited to enterprise operations (5% platform + 2.5% consulting fees deducted). The founder has been notified.`
              : `${milestoneTitle} moved to "rejected" status. The founder has been notified with your verification note.`,
        }
      );
      setOpen(false);
      setVerificationNote("");
      setAction("verify");
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
        if (!v) {
          setVerificationNote("");
          setAction("verify");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          size={variant === "compact" ? "sm" : "default"}
          className={cn(
            "h-9 gap-1.5 rounded-lg bg-gold-gradient font-sans text-xs font-semibold text-black hover:opacity-95",
            variant === "compact" && "h-8 px-3"
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Accountant release
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            Accountant milestone release
          </DialogTitle>
          <DialogDescription className="font-sans text-xs leading-relaxed">
            Verify evidence for <strong>{milestoneTitle}</strong>
            {enterpriseName ? <> · {enterpriseName}</> : null} and authorize
            release of {amountEgp.toLocaleString()} EGP from the Law Firm
            Client Account. The CRE enforces the accountant gate, fund flow,
            and zero-custody rules (Amendment IX).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`ms-action-${milestoneId}`}
              className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground"
            >
              Action
            </Label>
            <Select
              value={action}
              onValueChange={(v) => setAction(v as "verify" | "reject")}
            >
              <SelectTrigger
                id={`ms-action-${milestoneId}`}
                className="border-gold/20 bg-background/40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verify">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Verify &amp; release funds
                  </span>
                </SelectItem>
                <SelectItem value="reject">
                  <span className="flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-rose-500" />
                    Reject evidence
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`ms-note-${milestoneId}`}
              className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground"
            >
              Verification note {action === "reject" ? "(required, ≥ 3 chars)" : "(optional)"}
            </Label>
            <Textarea
              id={`ms-note-${milestoneId}`}
              rows={4}
              value={verificationNote}
              onChange={(e) => setVerificationNote(e.target.value)}
              placeholder={
                action === "verify"
                  ? "e.g. Evidence pack reviewed — invoices, photos, and third-party confirmation match the milestone specification."
                  : "e.g. Evidence pack missing the board-approved vendor invoice. Please re-submit with corrected GL code."
              }
              maxLength={2000}
              className="border-gold/20 bg-background/40 font-sans text-sm"
            />
            <p className="font-mono text-[11px] text-muted-foreground/80">
              {verificationNote.length}/2000 chars
            </p>
          </div>
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
            onClick={onSubmit}
            disabled={busy || (action === "reject" && verificationNote.trim().length < 3)}
            className={cn(
              "gap-1.5 rounded-lg font-sans text-xs font-semibold disabled:opacity-50",
              action === "verify"
                ? "bg-gold-gradient text-black hover:opacity-95"
                : "border border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10"
            )}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : action === "verify" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            {action === "verify" ? "Verify & release" : "Reject evidence"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
