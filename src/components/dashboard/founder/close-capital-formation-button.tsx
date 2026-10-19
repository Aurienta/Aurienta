"use client";

import { csrfFetch } from "@/lib/aurienta/csrf-client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Loader2, LockKeyhole } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { egp } from "@/lib/aurienta/format";

type Props = {
  enterpriseId: string;
  enterpriseName: string;
  raisedEgp: number;
  goalEgp: number;
  variant?: "default" | "compact";
};

/**
 * Close Capital Formation button (AUD-022).
 *
 * The Founding Operator / Company Owner transitions the enterprise from
 * fundraising_active → active via POST /api/enterprises/[id]/close-capital-formation.
 * Until this fires the enterprise cannot create milestones, expenses, or
 * distributions — capital formation is a precondition for operations.
 *
 * Body:
 *   { earlyClose?: boolean, adjustedGoalEgp?: number }
 *
 * If `earlyClose` is true the founder is closing before the goal was met;
 * they may optionally supply an `adjustedGoalEgp` (≤ original goal) that the
 * CRE persists as the new fundraising target before the transition.
 */
export function CloseCapitalFormationButton({
  enterpriseId,
  enterpriseName,
  raisedEgp,
  goalEgp,
  variant = "default",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [earlyClose, setEarlyClose] = React.useState(false);
  const [adjustedGoalEgp, setAdjustedGoalEgp] = React.useState<string>("");

  const goalMet = raisedEgp >= goalEgp;
  const adjustedN = Number(adjustedGoalEgp);
  const adjustedValid =
    !earlyClose ||
    (Number.isFinite(adjustedN) && adjustedN > 0 && adjustedN <= goalEgp);

  async function onClose() {
    if (busy) return;
    setBusy(true);
    try {
      const body: { earlyClose?: boolean; adjustedGoalEgp?: number } = {};
      if (earlyClose) {
        body.earlyClose = true;
        if (adjustedGoalEgp.trim()) {
          body.adjustedGoalEgp = Math.floor(adjustedN);
        }
      }
      const res = await csrfFetch(
        `/api/enterprises/${enterpriseId}/close-capital-formation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Capital Formation close failed.", {
          description: json.code ? `Code: ${json.code}` : undefined,
        });
        return;
      }
      toast.success("Capital Formation closed.", {
        description: `${enterpriseName} is now operational. The CRE has sealed the transition on the immutable ledger.`,
      });
      setOpen(false);
      setEarlyClose(false);
      setAdjustedGoalEgp("");
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
          setEarlyClose(false);
          setAdjustedGoalEgp("");
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
          <Lock className="h-3.5 w-3.5" />
          Close Capital Formation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-lg">
            <LockKeyhole className="h-4 w-4 text-gold" />
            Close Capital Formation
          </DialogTitle>
          <DialogDescription className="font-sans text-xs leading-relaxed">
            Transition <strong>{enterpriseName}</strong> from fundraising to
            operations. The CRE will append a <code className="font-mono">capital_formation_closed</code>{" "}
            ledger event and the enterprise will become operational.
            {goalMet
              ? " The fundraising goal has been met — this is the standard close."
              : " The fundraising goal has NOT been met — you must close early with an adjusted goal."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 rounded-lg border border-gold/12 bg-background/40 p-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Raised</span>
            <span className="text-gold-light">{egp(raisedEgp)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Goal</span>
            <span className="text-foreground">{egp(goalEgp)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Progress</span>
            <span className={cn(goalMet ? "text-emerald-300" : "text-indigo-300")}>
              {goalEgp > 0 ? `${((raisedEgp / goalEgp) * 100).toFixed(1)}%` : "—"}
            </span>
          </div>
        </div>

        {!goalMet && (
          <div className="flex flex-col gap-3 rounded-lg border border-indigo-400/30 bg-indigo-400/[0.04] p-3">
            <label className="flex items-start gap-2 font-sans text-xs text-foreground">
              <Checkbox
                checked={earlyClose}
                onCheckedChange={(v) => setEarlyClose(!!v)}
                disabled={busy}
              />
              <span>
                <strong>Close early</strong> with an adjusted goal. The
                Constitutional Runtime Engine will record the partial raise and
                transition the enterprise to <code className="font-mono">active</code> status.
              </span>
            </label>
            {earlyClose && (
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor={`close-adj-goal-${enterpriseId}`}
                  className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground"
                >
                  Adjusted goal (EGP) — must be ≤ original
                </Label>
                <Input
                  id={`close-adj-goal-${enterpriseId}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={goalEgp}
                  value={adjustedGoalEgp}
                  onChange={(e) => setAdjustedGoalEgp(e.target.value)}
                  placeholder={String(goalEgp)}
                  className="border-gold/20 bg-background/40 font-mono text-sm"
                />
              </div>
            )}
          </div>
        )}

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
            onClick={onClose}
            disabled={busy || (earlyClose && !adjustedValid)}
            className="gap-1.5 rounded-lg bg-gold-gradient font-sans text-xs font-semibold text-black hover:opacity-95 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
            Close Capital Formation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
