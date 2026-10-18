"use client";

import { csrfFetch } from "@/lib/aurienta/csrf-client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  reservationId: string;
  referenceCode: string;
  amountEgp: number;
  equityUnits: number;
  enterpriseName?: string;
  variant?: "default" | "compact";
};

/**
 * Confirm Reservation button (AUD-011 / AUD-022).
 *
 * The Capital Partner files a reservation via /api/reservations, but the
 * capital does not actually enter the Law Firm Client Account until a Law
 * Firm Representative (or AURIENTA Representative) confirms receipt of the
 * wired funds. This button is the missing caller for
 * POST /api/reservations/[id]/confirm.
 *
 * On success the API atomically:
 *   1. Flips reservation.status → "confirmed"
 *   2. Increments enterprise.lawFirmClientAccountBalanceEgp
 *   3. Upserts the partner's OwnershipRecord (weighted-avg cost basis)
 *   4. Bumps enterprise.raisedEgp (Capital Formation progress bar)
 *   5. Appends the `funds_confirmed` ledger event
 *   6. Contributes 0.5% to the Anti-Fragility InsuranceVault
 *
 * The server enforces RBAC: only law_firm_rep / aurienta_rep roles scoped
 * to the reservation's enterprise can call this endpoint. Errors are
 * surfaced verbatim via toast.
 */
export function ConfirmReservationButton({
  reservationId,
  referenceCode,
  amountEgp,
  equityUnits,
  enterpriseName,
  variant = "default",
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function onConfirm() {
    if (busy) return;
    const ok = window.confirm(
      `Confirm receipt of funds for reservation ${referenceCode}?\n\n` +
        `This action is IRREVERSIBLE. It will:\n` +
        `  • Move ${equityUnits.toLocaleString()} Equity Units into the partner's portfolio\n` +
        `  • Increment the Law Firm Client Account balance\n` +
        `  • Contribute 0.5% to the Anti-Fragility Vault\n` +
        `  • Append a funds_confirmed ledger event`
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await csrfFetch(`/api/reservations/${reservationId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Confirmation failed.", {
          description: json.policy ? `Policy: ${json.policy}` : undefined,
        });
        return;
      }
      toast.success("Reservation confirmed.", {
        description:
          `${equityUnits.toLocaleString()} Equity Units credited. ` +
          `0.5% (${Math.round(amountEgp * 0.005).toLocaleString()} EGP) contributed to the Anti-Fragility Vault.`,
      });
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
      onClick={onConfirm}
      disabled={busy}
      title={enterpriseName ? `Confirm receipt of funds — ${enterpriseName}` : "Confirm receipt of funds"}
      className={cn(
        "h-9 gap-1.5 rounded-lg bg-gold-gradient font-sans text-xs font-semibold text-black hover:opacity-95",
        variant === "compact" && "h-8 px-3"
      )}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Check className="h-3.5 w-3.5" />
      )}
      Confirm receipt
    </Button>
  );
}
