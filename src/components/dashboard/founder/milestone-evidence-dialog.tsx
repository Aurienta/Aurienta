"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { FounderMilestone } from "./types";

export function MilestoneEvidenceDialog({
  milestone,
  enterpriseId,
  open,
  onOpenChange,
  onSubmitted,
}: {
  milestone: FounderMilestone | null;
  enterpriseId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitted?: (updated: FounderMilestone) => void;
}) {
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setNote("");
  }, [open, milestone?.id]);

  if (!milestone) return null;

  const submit = async () => {
    if (note.trim().length < 12) {
      toast.error("Evidence note too short", {
        description: "Provide at least 12 characters of detail.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/enterprises/${enterpriseId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId: milestone.id, evidenceNote: note.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error ?? "Submission failed");
      }
      toast.success("Evidence submitted to CRE", {
        description: `EVE confidence: ${(data.milestone.eveConfidence * 100).toFixed(0)}% · board review queued.`,
      });
      onSubmitted?.({
        ...milestone,
        status: data.milestone.status,
        evidenceNote: data.milestone.evidenceNote,
        eveConfidence: data.milestone.eveConfidence,
      });
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed";
      toast.error("Could not submit evidence", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gold/20 bg-popover sm:max-w-[540px]">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2 text-gold">
            <FileText className="h-4 w-4" />
            <span className="font-sans text-xs uppercase tracking-[0.22em] text-gold-light">
              Evidence submission
            </span>
          </div>
          <DialogTitle className="font-serif text-xl">{milestone.title}</DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground">
            {milestone.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 rounded-xl border border-gold/12 bg-background/40 p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono uppercase tracking-wider text-muted-foreground">
              Milestone amount
            </span>
            <span className="font-serif text-sm font-semibold text-gold-light">
              {milestone.amountEgp.toLocaleString("en-US")} EGP
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono uppercase tracking-wider text-muted-foreground">
              Current EVE confidence
            </span>
            <span className="font-mono text-sm text-foreground">
              {(milestone.eveConfidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="evidence-note" className="font-sans text-xs text-muted-foreground">
            Evidence note
          </Label>
          <Textarea
            id="evidence-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe the evidence — geotagged photos, invoices, signed receipts, EVE-verified files…"
            className="min-h-[120px] resize-y border-gold/15 bg-background/60 font-sans text-sm"
            aria-describedby="evidence-note-help"
          />
          <p
            id="evidence-note-help"
            className="flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground/80"
          >
            <Sparkles className="h-3 w-3 text-gold/70" />
            The Evidence Verification Engine (Gemma 2 27B) will re-score this milestone on submission.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="h-10 text-muted-foreground hover:bg-gold/5 hover:text-gold-light"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="h-10 bg-gold-gradient px-5 text-sm font-semibold text-black shadow-[0_10px_30px_-12px_rgba(212,175,55,0.65)]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>Submit evidence</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
