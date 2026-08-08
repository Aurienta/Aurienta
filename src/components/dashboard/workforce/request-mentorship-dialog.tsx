"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { FOCUS_AREA_OPTIONS, type MentorForUi, type MenteeForUi } from "./mentorship-types";

// Two modes: "request" (founder picks focus areas for their enterprise's mentor)
//            "offer" (mentor offers to mentor a mentee enterprise)
export function RequestMentorshipDialog({
  mode,
  open,
  onOpenChange,
  mentor,
  mentee,
  canOffer, // STS ≥ 85 (for offer mode)
}: {
  mode: "request" | "offer";
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mentor?: MentorForUi | null;
  mentee?: MenteeForUi | null;
  canOffer: boolean;
}) {
  const router = useRouter();
  const [focusAreas, setFocusAreas] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setFocusAreas([]);
      setSubmitting(false);
    }
  }, [open]);

  const targetMentee = mentee;

  async function handleSubmit() {
    if (!targetMentee) return;
    if (mode === "offer" && !canOffer) {
      toast.error("Only Founding Operators with STS ≥ 85 may offer mentorship.");
      return;
    }
    setSubmitting(true);
    try {
      const body =
        mode === "offer"
          ? { mentorId: "self", menteeEnterpriseId: targetMentee.id, focusAreas }
          : { menteeEnterpriseId: targetMentee.id, focusAreas };
      const res = await fetch("/api/mentorship", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not submit", {
          description: data.code ? `code: ${data.code}` : undefined,
        });
        return;
      }
      toast.success(
        mode === "offer" ? "Mentorship offer submitted" : "Mentorship request submitted",
        {
          description:
            mode === "offer"
              ? `${targetMentee.name}'s founder will be notified.`
              : "Available mentors will be notified of your request.",
        }
      );
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
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span className="font-mono text-xs uppercase tracking-wider text-gold-light/80">
              {mode === "offer" ? "Offer to mentor" : "Request mentorship"}
            </span>
          </div>
          <DialogTitle className="font-serif text-lg">
            {mode === "offer"
              ? `Offer to mentor ${targetMentee?.name ?? ""}`
              : `Request a mentor for ${targetMentee?.name ?? ""}`}
          </DialogTitle>
          <DialogDescription className="font-sans text-xs leading-relaxed">
            {mode === "offer"
              ? `You will earn a small equity grant from the mentee's founder pool upon activation. Your STS qualifies you.`
              : "An available Founding Operator (STS ≥ 85) will be matched to your enterprise. Focus areas help the AI suggest the best mentor."}
          </DialogDescription>
        </DialogHeader>

        {mode === "offer" && !canOffer && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.04] p-2.5">
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
            <p className="font-sans text-[11px] leading-relaxed text-red-300">
              Your Sovereign Trust Score is below 85. Only Ecosystem Builders and Constitutional
              Pillars may offer mentorship.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="grid gap-1.5">
            <Label className="font-sans text-xs text-muted-foreground">
              Focus areas (select at least one)
            </Label>
            <ToggleGroup
              type="multiple"
              value={focusAreas}
              onValueChange={(v) => setFocusAreas(v)}
              className="flex flex-wrap justify-start gap-1.5"
            >
              {FOCUS_AREA_OPTIONS.map((area) => (
                <ToggleGroupItem
                  key={area}
                  value={area}
                  aria-label={area}
                  className="rounded-full border border-gold/15 px-2.5 py-1 font-sans text-xs data-[state=on]:bg-gold-gradient data-[state=on]:text-black data-[state=on]:border-gold/40"
                >
                  {area}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="font-mono text-xs text-muted-foreground/85">
              {focusAreas.length} selected · {focusAreas.length === 0 ? "Select at least one" : "Looks good"}
            </p>
          </div>

          <Separator className="bg-gold/10" />

          {mode === "offer" && targetMentee && (
            <div className="rounded-lg border border-gold/12 bg-gold/[0.03] p-3 font-sans text-[11px] leading-relaxed text-muted-foreground">
              <p>
                <span className="text-foreground font-medium">{targetMentee.name}</span> · Tier{" "}
                {targetMentee.tier} · {targetMentee.sector} · {targetMentee.stage.replace("_", " ")}
              </p>
              <p className="mt-1">
                Founder: {targetMentee.founder.legalName} · STS {targetMentee.founder.sovereignTrustScore}
              </p>
            </div>
          )}
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
            disabled={submitting || focusAreas.length === 0 || (mode === "offer" && !canOffer)}
            onClick={handleSubmit}
            className="bg-gold-gradient font-sans text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" /> Submit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
