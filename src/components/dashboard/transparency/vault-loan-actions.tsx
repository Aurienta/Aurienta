"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandCoins, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { egp } from "@/lib/aurienta/format";

type Loan = {
  id: string;
  enterpriseId: string;
  enterpriseName: string | null;
  amountEgp: number;
  reason: string;
  status: string;
  repaidEgp: number;
};

type Membership = { enterpriseId: string; role: string };

// Roles authorised to record a repayment (kept in sync with
// /api/vault/loan/[id] REPAY_ROLES).
const REPAY_ROLES = new Set([
  "aurienta_rep",
  "accounting_firm_rep",
  "founding_operator",
  "company_owner",
  "board_member",
  "manager",
]);

type Props = {
  loan: Loan;
  userMemberships: Membership[];
  /** Called after a successful PATCH so the parent can re-fetch / re-render. */
  onUpdated?: () => void;
};

/**
 * VaultLoanActions — DE-23 fix.
 *
 * The PATCH /api/vault/loan/[id] endpoint supports `repay` and `forgive`
 * actions, but the vault page only surfaced a "request loan" form — there
 * was no UI caller for repayment or forgiveness, so approved loans were
 * stuck in `approved` status forever.
 *
 * This component renders:
 *   - A "Repay" button (visible to managers, board members, accounting firm
 *     reps, founders, company owners, and AURIENTA reps) — opens a small
 *     dialog asking for the EGP amount to record as a partial or full
 *     repayment.
 *   - A "Forgive" button (visible ONLY to AURIENTA reps) — one-click action
 *     that extinguishes the outstanding principal as a non-recourse loss
 *     for the vault.
 *
 * Both calls go through `csrfFetch` (double-submit CSRF token) and surface
 * API errors verbatim via sonner toasts.
 */
export function VaultLoanActions({
  loan,
  userMemberships,
  onUpdated,
}: Props) {
  const router = useRouter();
  const [repayOpen, setRepayOpen] = React.useState(false);
  const [repayAmount, setRepayAmount] = React.useState("");
  const [busy, setBusy] = React.useState<"repay" | "forgive" | null>(null);

  // Only "approved" loans (i.e. disbursed and outstanding) can be repaid or
  // forgiven. Pending / rejected / repaid / forgiven loans show no actions.
  const isActive = loan.status === "approved";
  if (!isActive) return null;

  const rolesForEnterprise = userMemberships
    .filter((m) => m.enterpriseId === loan.enterpriseId)
    .map((m) => m.role);
  const canRepay = rolesForEnterprise.some((r) => REPAY_ROLES.has(r));
  const canForgive = rolesForEnterprise.includes("aurienta_rep");

  if (!canRepay && !canForgive) return null;

  const remaining = Math.max(0, loan.amountEgp - loan.repaidEgp);

  // After a successful action, both refresh the local view (onUpdated →
  // refreshVaultBalance) AND trigger a server refresh so the loans list is
  // re-fetched with the latest status / repaidEgp.
  function afterAction() {
    onUpdated?.();
    router.refresh();
  }

  async function submitRepay() {
    const amount = Number(repayAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Invalid amount", {
        description: "Enter a positive EGP amount to record as a repayment.",
      });
      return;
    }
    if (amount > remaining + 0.001) {
      toast.error("Repayment exceeds remaining balance", {
        description: `Remaining on this loan: ${egp(remaining, { compact: true })}.`,
      });
      return;
    }

    setBusy("repay");
    try {
      const res = await csrfFetch(`/api/vault/loan/${loan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "repay", amountEgp: amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? data?.message ?? "Repayment failed");
      }
      toast.success("Repayment recorded", {
        description: `${egp(amount)} returned to the Anti-Fragility Vault.`,
      });
      setRepayOpen(false);
      setRepayAmount("");
      afterAction();
    } catch (e) {
      toast.error("Could not record repayment", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function submitForgive() {
    setBusy("forgive");
    try {
      const res = await csrfFetch(`/api/vault/loan/${loan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forgive" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? data?.message ?? "Forgive failed");
      }
      toast.success("Loan forgiven", {
        description: `Outstanding ${egp(remaining, { compact: true })} extinguished as non-recourse loss.`,
      });
      afterAction();
    } catch (e) {
      toast.error("Could not forgive loan", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {canRepay && (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setRepayOpen(true)}
            disabled={busy !== null}
            className={cn(
              "h-7 gap-1.5 rounded-md border-gold/25 px-2.5 text-[11px] font-medium text-gold-light hover:bg-gold/8",
              busy === "repay" && "opacity-70"
            )}
          >
            {busy === "repay" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RotateCcw className="h-3 w-3" />
            )}
            Repay
          </Button>
          <Dialog open={repayOpen} onOpenChange={setRepayOpen}>
            <DialogContent className="border-gold/20 bg-card sm:max-w-sm">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <HandCoins className="h-4 w-4 text-gold" />
                  <DialogTitle className="font-serif text-base font-semibold">
                    Record a repayment
                  </DialogTitle>
                </div>
                <DialogDescription className="font-sans text-xs text-muted-foreground">
                  {loan.enterpriseName ?? "Enterprise"} · remaining{" "}
                  {egp(remaining, { compact: true })} of{" "}
                  {egp(loan.amountEgp, { compact: true })}.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-1.5">
                <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                  Amount (EGP)
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0.01}
                  max={remaining}
                  step="0.01"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder={`Up to ${remaining.toLocaleString()}`}
                  className="border-gold/20 bg-background/40 font-mono text-sm"
                />
                <span className="font-mono text-[10px] text-muted-foreground/80">
                  Capital returns to the vault · interest-free, non-recourse.
                </span>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRepayOpen(false)}
                  className="border-gold/20 hover:bg-gold/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitRepay}
                  disabled={busy !== null}
                  className="bg-gold-gradient text-[#0a0a0b] hover:opacity-90"
                >
                  {busy === "repay" ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  )}
                  Record repayment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {canForgive && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={submitForgive}
          disabled={busy !== null}
          className={cn(
            "h-7 gap-1.5 rounded-md border-rose-400/30 px-2.5 text-[11px] font-medium text-rose-300 hover:bg-rose-400/10",
            busy === "forgive" && "opacity-70"
          )}
          title="Forgive the outstanding principal as a non-recourse loss (AURIENTA Rep only)."
        >
          {busy === "forgive" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ShieldCheck className="h-3 w-3" />
          )}
          Forgive
        </Button>
      )}
    </div>
  );
}
