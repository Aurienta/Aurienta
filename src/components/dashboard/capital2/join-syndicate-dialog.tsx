"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Users, ShieldCheck, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { egp } from "@/lib/aurienta/format";
import { type SyndicateForUi } from "./types";

export function JoinSyndicateDialog({
  syndicate,
  open,
  onOpenChange,
}: {
  syndicate: SyndicateForUi | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [shares, setShares] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setShares("");
      setSubmitting(false);
    }
  }, [open]);

  if (!syndicate) return null;

  const price = syndicate.enterprise.equityUnitPriceEgp;
  const sharesNum = Math.max(0, Math.floor(Number(shares) || 0));
  const expectedAmount = Math.round(sharesNum * price);
  const remaining = Math.max(
    syndicate.targetShares - syndicate.committedShares,
    0
  );
  const meetsCap = sharesNum <= remaining;

  async function handleJoin() {
    if (!syndicate) return;
    if (sharesNum <= 0) {
      toast.error("Shares must be a positive integer");
      return;
    }
    if (!meetsCap) {
      toast.error(`Only ${remaining.toLocaleString()} Equity Units remain in this syndicate.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/syndicates/${syndicate.id}/join`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shares: sharesNum,
          amount: expectedAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not join syndicate", {
          description: data.policy
            ? `CRE policy: ${data.policy}`
            : data.code
              ? `code: ${data.code}`
              : undefined,
        });
        return;
      }
      toast.success("Joined syndicate", {
        description: `${sharesNum.toLocaleString()} Equity Units · ${egp(expectedAmount)} — your funds will route to law firm client account individually.`,
      });
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gold/20 bg-background sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-gold" />
            <span className="font-mono text-xs uppercase tracking-wider text-gold-light/80">
              Join syndicate
            </span>
          </div>
          <DialogTitle className="font-serif text-xl">{syndicate.name}</DialogTitle>
          <DialogDescription className="font-sans text-xs leading-relaxed">
            {syndicate.enterprise.name} · Tier {syndicate.enterprise.tier} · AI fundamental price{" "}
            {egp(price)} per share.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="join-equity-units" className="font-sans text-xs text-muted-foreground">
              Equity Units to commit
            </Label>
            <Input
              id="join-equity-units"
              type="number"
              inputMode="numeric"
              min={1}
              max={remaining}
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="font-mono text-xs text-muted-foreground/85">
              {remaining.toLocaleString()} Equity Units remaining in this syndicate.
            </p>
          </div>

          <Separator className="bg-gold/10" />

          <dl className="grid grid-cols-2 gap-y-2 font-sans text-xs">
            <dt className="text-muted-foreground">AI fundamental price</dt>
            <dd className="text-right font-mono text-foreground">{egp(price)}</dd>
            <dt className="text-muted-foreground">Your commitment</dt>
            <dd className="text-right font-mono font-semibold text-gold-light">
              {egp(expectedAmount)}
            </dd>
            <dt className="text-muted-foreground">±5% band (CRE)</dt>
            <dd className="text-right font-mono text-muted-foreground">
              {egp(Math.round(price * 0.95))} – {egp(Math.round(price * 1.05))}
            </dd>
          </dl>

          <div className="flex items-start gap-2 rounded-lg border border-gold/12 bg-gold/[0.025] p-2.5">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
            <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
              You will receive a unique reference code. Wire {egp(expectedAmount)} to the
              law firm client account within 48h. <strong>No pooled custody</strong> — AURIENTA never
              touches your capital.
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
            disabled={submitting || sharesNum <= 0 || !meetsCap}
            onClick={handleJoin}
            className="bg-gold-gradient font-sans text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Joining…
              </>
            ) : (
              <>
                Join <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
