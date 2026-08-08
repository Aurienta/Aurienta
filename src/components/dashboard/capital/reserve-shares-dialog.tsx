"use client";

import * as React from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck,
  Scale,
  Lock,
  Loader2,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { egp } from "@/lib/aurienta/format";

export type ReserveTarget = {
  id: string;
  slug: string;
  name: string;
  tier: string;
  equityUnitPriceEgp: number;
  minShares: number;
  sectorLabel: string;
};

type ReservedResult = {
  referenceCode: string;
  equityUnits: number;
  amountEgp: number;
  expiresAt: string;
};

export function ReserveSharesDialog({
  target,
  open,
  onOpenChange,
  onReserved,
}: {
  target: ReserveTarget | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onReserved?: (r: ReservedResult) => void;
}) {
  const [shares, setShares] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState<ReservedResult | null>(null);

  // Reset state when the target changes.
  React.useEffect(() => {
    if (open) {
      setShares(target ? String(target.minShares) : "");
      setConfirmed(null);
      setSubmitting(false);
    }
  }, [open, target]);

  const sharesNum = Math.max(0, Math.floor(Number(shares) || 0));
  const amount = target ? sharesNum * target.equityUnitPriceEgp : 0;
  const meetsMin = target ? sharesNum >= target.minShares : false;

  // Reference code preview (mock; actual code generated server-side on confirm).
  const previewCode = target
    ? `AURI-2026-${target.slug}-XXXX-${Date.now().toString(36).toUpperCase()}`
    : "";

  async function handleConfirm() {
    if (!target) return;
    if (!meetsMin) {
      toast.error("Dynamic minimum", {
        description: `Reserve at least ${target.minShares} unit${target.minShares === 1 ? "" : "s"} (${egp(target.minShares * target.equityUnitPriceEgp)}).`,
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          enterpriseId: target.id,
          shares: sharesNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Reservation failed", {
          description: data.policy
            ? `CRE policy: ${data.policy}`
            : "Please review and retry.",
        });
        setSubmitting(false);
        return;
      }
      const result: ReservedResult = {
        referenceCode: data.reservation.referenceCode,
        equityUnits: data.reservation.equityUnits,
        amountEgp: data.reservation.amountEgp,
        expiresAt: data.reservation.expiresAt,
      };
      setConfirmed(result);
      onReserved?.(result);
      toast.success("Reservation confirmed", {
        description: `${result.equityUnits.toLocaleString()} units reserved · ${result.referenceCode}`,
      });
    } catch {
      toast.error("Network error", {
        description: "Could not reach the constitutional runtime.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gold/20 bg-background sm:max-w-md">
        {target && (
          <>
            <DialogHeader>
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded border border-gold/25 bg-gold/8 px-1.5 py-0.5 font-mono text-[11px] text-gold-light">
                  T{target.tier}
                </span>
                <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                  {target.sectorLabel}
                </span>
              </div>
              <DialogTitle className="font-serif text-xl">
                Reserve Equity Units in {target.name}
              </DialogTitle>
              <DialogDescription className="font-sans text-xs leading-relaxed">
                Funds flow directly to the Law Firm Client Account — AURIENTA never touches
                your capital.
              </DialogDescription>
            </DialogHeader>

            {confirmed ? (
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-5 text-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  <p className="font-serif text-base font-semibold">
                    Reservation confirmed
                  </p>
                  <p className="font-sans text-[11px] text-muted-foreground">
                    {confirmed.equityUnits.toLocaleString()} units ·{" "}
                    {egp(confirmed.amountEgp)}
                  </p>
                </div>
                <div className="rounded-lg border border-gold/12 bg-gold/[0.03] p-3">
                  <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                    Reference code
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 truncate font-mono text-xs text-gold-light">
                      {confirmed.referenceCode}
                    </code>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-gold"
                      onClick={() => {
                        navigator.clipboard?.writeText(confirmed.referenceCode);
                        toast.success("Reference code copied");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="mt-2 font-mono text-xs text-muted-foreground/85">
                    Wire {egp(confirmed.amountEgp)} within 48h using this reference.
                    The law firm reconciles funds against this code.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="bg-gold-gradient font-sans text-xs font-semibold text-black hover:opacity-90"
                  >
                    Done
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="equityUnits" className="font-sans text-xs text-muted-foreground">
                      Equity Units to reserve
                    </Label>
                    <Input
                      id="equityUnits"
                      type="number"
                      inputMode="numeric"
                      min={target.minShares}
                      value={shares}
                      onChange={(e) => setShares(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="font-mono text-xs text-muted-foreground/85">
                      Minimum: {target.minShares.toLocaleString()} units ·{" "}
                      {egp(target.minShares * target.equityUnitPriceEgp)} (CRE dynamic minimum)
                    </p>
                  </div>

                  <Separator className="bg-gold/10" />

                  <dl className="grid grid-cols-2 gap-y-2 font-sans text-xs">
                    <dt className="text-muted-foreground">AI fundamental price per unit</dt>
                    <dd className="text-right font-mono text-foreground">
                      {egp(target.equityUnitPriceEgp)}
                    </dd>
                    <dt className="text-muted-foreground">Equity Units</dt>
                    <dd className="text-right font-mono text-foreground">
                      {sharesNum.toLocaleString()}
                    </dd>
                    <dt className="text-muted-foreground">Amount to wire</dt>
                    <dd className="text-right font-mono font-semibold text-gold-light">
                      {egp(amount)}
                    </dd>
                  </dl>

                  <div className="rounded-lg border border-gold/10 bg-gold/[0.025] p-2.5">
                    <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                      Reference code preview
                    </p>
                    <code className="mt-1 block truncate font-mono text-[11px] text-gold-light/90">
                      {previewCode}
                    </code>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-gold/12 bg-background/40 p-2.5">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
                      Funds route to the licensed law firm&apos;s Law Firm Client
                      Account. AURIENTA has zero custody — non-amendable Rule I
                      1.1.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    className="font-sans text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={!meetsMin || submitting}
                    onClick={handleConfirm}
                    className="bg-gold-gradient font-sans text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Reserving…
                      </>
                    ) : (
                      <>Confirm reservation</>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ReserveNoteIcons() {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground/80">
      <span className="inline-flex items-center gap-1">
        <Scale className="h-3 w-3 text-gold/60" /> CRE
      </span>
      <span className="text-gold/15">·</span>
      <span className="inline-flex items-center gap-1">
        <Lock className="h-3 w-3 text-gold/60" /> Hash-anchored
      </span>
    </div>
  );
}
