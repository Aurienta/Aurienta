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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  reportId: string;
  trackingCode: string;
  variant?: "default" | "compact";
};

/**
 * Whistleblower Resolve button (AUD-022).
 *
 * AURIENTA Representatives close out an Integrity-Bond case via
 * POST /api/whistleblower/[id]/resolve. This button is the missing UI
 * caller — previously reports could only be filed, never resolved.
 *
 * Body: { resolution: "resolved" | "dismissed", bountyEgp?: number }
 *
 * On success:
 *   - WhistleblowerReport.status flips to resolved / dismissed.
 *   - Optional bountyEgp recorded on the report row.
 *   - A `whistleblower_resolved` ledger event is appended.
 *   - The original filer is notified (looked up via the whistleblower.file
 *     audit log entry).
 */
export function WhistleblowerResolveButton({
  reportId,
  trackingCode,
  variant = "default",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [resolution, setResolution] = React.useState<"resolved" | "dismissed">(
    "resolved"
  );
  const [bountyEgp, setBountyEgp] = React.useState<string>("");

  async function onResolve() {
    setBusy(true);
    try {
      const body: { resolution: string; bountyEgp?: number } = { resolution };
      if (resolution === "resolved" && bountyEgp.trim()) {
        const n = Math.floor(Number(bountyEgp));
        if (!Number.isFinite(n) || n < 0) {
          toast.error("Bounty must be a non-negative integer (EGP).");
          setBusy(false);
          return;
        }
        body.bountyEgp = n;
      }

      const res = await csrfFetch(`/api/whistleblower/${reportId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Resolution failed.", {
          description: json.code ? `Code: ${json.code}` : undefined,
        });
        return;
      }
      toast.success(
        resolution === "resolved"
          ? "Report resolved."
          : "Report dismissed.",
        {
          description:
            resolution === "resolved" && body.bountyEgp
              ? `Bounty of ${body.bountyEgp.toLocaleString()} EGP recorded. The filer has been notified.`
              : `${trackingCode} closed. The filer has been notified.`,
        }
      );
      setOpen(false);
      setBountyEgp("");
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
          setBountyEgp("");
          setResolution("resolved");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={variant === "compact" ? "sm" : "default"}
          className={cn(
            "h-8 gap-1.5 rounded-lg border border-gold/30 bg-transparent font-sans text-xs font-medium text-gold-light hover:bg-gold/8",
            variant === "compact" && "h-7 px-3"
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Resolve
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            Resolve whistleblower report
          </DialogTitle>
          <DialogDescription className="font-sans text-xs leading-relaxed">
            Close out Integrity-Bond case <code className="font-mono text-gold-light">{trackingCode}</code>.
            The Constitutional Runtime Engine will append a{" "}
            <code className="font-mono">whistleblower_resolved</code> ledger event
            and notify the original filer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`wb-resolution-${reportId}`}
              className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground"
            >
              Resolution
            </Label>
            <Select
              value={resolution}
              onValueChange={(v) =>
                setResolution(v as "resolved" | "dismissed")
              }
            >
              <SelectTrigger
                id={`wb-resolution-${reportId}`}
                className="border-gold/20 bg-background/40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resolved">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Resolved — finding validated
                  </span>
                </SelectItem>
                <SelectItem value="dismissed">
                  <span className="flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-rose-500" />
                    Dismissed — no bounty
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {resolution === "resolved" && (
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor={`wb-bounty-${reportId}`}
                className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground"
              >
                Bounty award (EGP, optional)
              </Label>
              <Input
                id={`wb-bounty-${reportId}`}
                type="number"
                inputMode="numeric"
                min={0}
                value={bountyEgp}
                onChange={(e) => setBountyEgp(e.target.value)}
                placeholder="0 — leave blank to award no bounty"
                className="border-gold/20 bg-background/40 font-mono text-sm"
              />
              <p className="font-mono text-[11px] text-muted-foreground/80">
                Paid from the platform&apos;s 1% integrity fund. Capped at
                25,000 EGP per validated finding.
              </p>
            </div>
          )}
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
            onClick={onResolve}
            disabled={busy}
            className="gap-1.5 rounded-lg bg-gold-gradient font-sans text-xs font-semibold text-black hover:opacity-95 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : resolution === "resolved" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            {resolution === "resolved" ? "Resolve report" : "Dismiss report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
