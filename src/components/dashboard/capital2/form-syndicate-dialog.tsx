"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Users, Scale, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { egp } from "@/lib/aurienta/format";
import { RISK_PROFILES, type EnterpriseForSyndicate } from "./types";

export function FormSyndicateDialog({
  enterprises,
  userRiskProfile,
  triggerClassName,
}: {
  enterprises: EnterpriseForSyndicate[];
  userRiskProfile: string | null;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [name, setName] = React.useState("");
  const [enterpriseId, setEnterpriseId] = React.useState<string>(
    enterprises[0]?.id ?? ""
  );
  const [targetShares, setTargetShares] = React.useState<string>("");
  const [riskProfile, setRiskProfile] = React.useState<string>(
    userRiskProfile && RISK_PROFILES.some((r) => r.key === userRiskProfile)
      ? userRiskProfile
      : "balanced"
  );
  const [description, setDescription] = React.useState("");

  const selectedEnterprise = enterprises.find((e) => e.id === enterpriseId);
  const sharesNum = Math.max(0, Math.floor(Number(targetShares) || 0));
  const projectedAmount = selectedEnterprise
    ? sharesNum * selectedEnterprise.equityUnitPriceEgp
    : 0;

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!enterpriseId) {
      toast.error("Select an enterprise");
      return;
    }
    if (sharesNum <= 0) {
      toast.error("Target Equity Units must be a positive integer");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/syndicates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          enterpriseId,
          targetShares: sharesNum,
          riskProfile,
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not form syndicate");
        return;
      }
      toast.success("Syndicate formed", {
        description: `${name.trim()} — ${sharesNum.toLocaleString()} target ownership stake.`,
      });
      setOpen(false);
      setName("");
      setTargetShares("");
      setDescription("");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            triggerClassName ??
            "inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 font-sans text-xs font-semibold text-black transition-transform hover:scale-[1.02]"
          }
        >
          <Plus className="h-3.5 w-3.5" /> Form a syndicate
        </button>
      </DialogTrigger>
      <DialogContent className="border-gold/20 bg-background sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-gold" />
            <span className="font-mono text-xs uppercase tracking-wider text-gold-light/80">
              Constitutional Syndicate Formation
            </span>
          </div>
          <DialogTitle className="font-serif text-xl">Form a syndicate</DialogTitle>
          <DialogDescription className="font-sans text-xs leading-relaxed">
            Coordinate pre-emptive rights and co-Participation with other investors.
            Each partner&apos;s funds still flow to the law firm client account individually with unique
            references — this is <strong>coordination, not pooled custody</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="syn-name" className="font-sans text-xs text-muted-foreground">
              Syndicate name
            </Label>
            <Input
              id="syn-name"
              placeholder="e.g. EcoPack Pre-emptive Coalition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              className="font-sans text-sm"
            />
          </div>

          {/* Enterprise */}
          <div className="grid gap-1.5">
            <Label htmlFor="syn-ent" className="font-sans text-xs text-muted-foreground">
              Enterprise
            </Label>
            <Select value={enterpriseId} onValueChange={setEnterpriseId}>
              <SelectTrigger id="syn-ent" className="font-sans text-sm">
                <SelectValue placeholder="Select an enterprise" />
              </SelectTrigger>
              <SelectContent className="border-gold/15 bg-popover">
                {enterprises.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No enterprises available.
                  </div>
                ) : (
                  enterprises.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="font-sans text-sm">
                      <span className="inline-flex items-center gap-2">
                        <span className="rounded border border-gold/25 bg-gold/8 px-1 py-0.5 font-mono text-[11px] text-gold-light">
                          T{e.tier}
                        </span>
                        {e.name}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Target Equity Units */}
          <div className="grid gap-1.5">
            <Label htmlFor="syn-equity-units" className="font-sans text-xs text-muted-foreground">
              Target Equity Units (collective)
            </Label>
            <Input
              id="syn-equity-units"
              type="number"
              inputMode="numeric"
              min={1}
              value={targetShares}
              onChange={(e) => setTargetShares(e.target.value)}
              className="font-mono text-sm"
            />
            {selectedEnterprise && sharesNum > 0 && (
              <p className="font-mono text-xs text-muted-foreground/85">
                At AI fundamental price {egp(selectedEnterprise.equityUnitPriceEgp)} · total commitment{" "}
                <span className="text-gold-light">{egp(projectedAmount)}</span>
              </p>
            )}
          </div>

          {/* Risk profile */}
          <div className="grid gap-1.5">
            <Label className="font-sans text-xs text-muted-foreground">Risk profile</Label>
            <Select value={riskProfile} onValueChange={setRiskProfile}>
              <SelectTrigger className="font-sans text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-gold/15 bg-popover">
                {RISK_PROFILES.map((r) => (
                  <SelectItem key={r.key} value={r.key} className="font-sans text-sm">
                    <div className="flex flex-col items-start">
                      <span>{r.label}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {r.desc}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="syn-desc" className="font-sans text-xs text-muted-foreground">
              Description (optional)
            </Label>
            <Textarea
              id="syn-desc"
              rows={3}
              placeholder="Why is this syndicate forming? What pre-emptive rights or co-Participation opportunity are you coordinating?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1200}
              className="font-sans text-sm"
            />
          </div>

          <Separator className="bg-gold/10" />

          <div className="flex items-start gap-2 rounded-lg border border-gold/12 bg-gold/[0.03] p-2.5">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
            <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
              Zero Custody applies. AURIENTA never holds syndicate capital — each partner wires
              funds directly to the law firm client account with their unique reference code. The CRE
              enforces the ±5% price band on every individual reservation.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="font-sans text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting || !name.trim() || sharesNum <= 0}
            onClick={handleSubmit}
            className="bg-gold-gradient font-sans text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Forming…
              </>
            ) : (
              <>
                <Scale className="mr-1.5 h-3.5 w-3.5" /> Form syndicate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
