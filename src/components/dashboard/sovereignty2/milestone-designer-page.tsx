"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Clock, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EnterpriseSelector, type EnterpriseOption } from "./enterprise-selector";
import { AiContent } from "./ai-generate-card";
import { useAiEndpoint } from "./use-ai-endpoint";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { egp, timeAgo } from "@/lib/aurienta/format";

type DesignResponse = {
  content: string;
  sector: string;
  suggestedAnchor: number;
  generatedAt: string;
};

export type ExistingMilestone = {
  id: string;
  title: string;
  description: string;
  amountEgp: number;
  status: string;
  dueAt: string | null;
  releasedAt: string | null;
  createdAt: string;
};

export type MilestoneDesignerPageProps = {
  enterprises: EnterpriseOption[];
  initialEnterpriseId: string | null;
  initialSector: string;
  milestones: ExistingMilestone[];
};

export function MilestoneDesignerPage({
  enterprises,
  initialEnterpriseId,
  initialSector,
  milestones: initialMilestones,
}: MilestoneDesignerPageProps) {
  const [enterpriseId, setEnterpriseId] = React.useState<string>(initialEnterpriseId ?? "");
  const [sector] = React.useState<string>(initialSector);
  const [milestones, setMilestones] = React.useState<ExistingMilestone[]>(initialMilestones);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const { run, isLoading, data, error } = useAiEndpoint<
    { enterpriseId: string; title: string; description: string; sector: string },
    DesignResponse
  >("/api/ai/milestone-designer");

  const onDesign = async (title: string, description: string) => {
    if (!enterpriseId || !title || !description) {
      toast.error("Title + description are required");
      return;
    }
    const res = await run({ enterpriseId, title, description, sector });
    if (res) {
      toast.success("Milestone design ready", {
        description: "Review the AI-suggested amount, evidence, and sector gate.",
      });
      setDialogOpen(false);
    } else {
      toast.error("Designer unavailable", { description: error ?? undefined });
    }
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SonnerToaster
        position="top-center"
        toastOptions={{
          style: {
            border: "1px solid rgba(212,175,55,0.25)",
            background: "rgba(16,16,18,0.95)",
            color: "#f3eedd",
          },
        }}
      />

      <div className="rounded-2xl border border-gold/12 glass p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Enterprise (founder / manager / board)
            </label>
            <EnterpriseSelector
              options={enterprises}
              value={enterpriseId}
              onChange={setEnterpriseId}
              emptyLabel="No founding/manager seats"
              ariaLabel="Select enterprise for milestone design"
            />
          </div>
          <Button
            type="button"
            onClick={() => setDialogOpen(true)}
            disabled={!enterpriseId}
            className="h-11 gap-2 rounded-xl bg-gold-gradient px-5 font-sans text-[13px] font-semibold text-black shadow-[0_8px_30px_-6px_rgba(212,175,55,0.5)] hover:shadow-[0_10px_38px_-6px_rgba(212,175,55,0.7)] disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Design a new milestone
          </Button>
        </div>
      </div>

      {/* AI design output */}
      <AnimatePresence>
        {data && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative overflow-hidden rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/8 blur-3xl" />
            <div className="relative flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/8 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold/80">
                  <Sparkles className="h-3 w-3" /> Milestone Designer · glm-4.6
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground/85">
                  <Clock className="h-3 w-3" /> {timeAgo(new Date(data.generatedAt))}
                </span>
              </div>

              <AiContent content={data.content} />

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/10 bg-foreground/[0.02] px-4 py-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Suggested amount anchor
                  </p>
                  <p className="font-serif text-lg font-semibold text-gold-gradient">
                    {egp(data.suggestedAnchor)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    toast.success("Milestone draft created in Founder Studio", {
                      description: "Open Founder Studio to finalize + submit for board review.",
                    })
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 font-sans text-[12px] font-semibold text-gold-light transition-colors hover:bg-gold/15"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Use this design
                </button>
              </div>

              <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/85">
                Persisted as an AiArtifact (kind: milestone_design). The CRE has not yet released
                funds — evidence submission + board approval still required.
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {error && (
        <div className="rounded-xl border border-red-400/25 bg-red-400/[0.05] px-4 py-3 text-[12px] text-red-300">
          <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5 align-text-bottom" />
          {error}
        </div>
      )}

      {/* Existing milestones */}
      <section className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
        <header className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-base font-semibold sm:text-lg">Existing milestones</h2>
            <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
              Dependency ordering is informed by these open + released milestones.
            </p>
          </div>
          <span className="font-mono text-xs text-muted-foreground/85">
            {milestones.length} on record
          </span>
        </header>
        {milestones.length === 0 ? (
          <p className="py-6 text-center font-sans text-[12px] text-muted-foreground">
            No milestones yet. Use the designer above to draft the first one.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
            {milestones.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-gold/10 bg-foreground/[0.02] p-3 transition-colors hover:border-gold/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-sm font-semibold text-foreground">{m.title}</p>
                    <p className="mt-0.5 line-clamp-2 font-sans text-[11px] text-muted-foreground">
                      {m.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider",
                      m.status === "released"
                        ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : m.status === "approved"
                        ? "border border-gold/30 bg-gold/10 text-gold-light"
                        : m.status === "flagged" || m.status === "rejected"
                        ? "border border-red-400/30 bg-red-400/10 text-red-300"
                        : "border border-gold/15 bg-foreground/[0.04] text-muted-foreground"
                    )}
                  >
                    {m.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground/85">
                  <span>{egp(m.amountEgp)}</span>
                  {m.dueAt && <span>due {new Date(m.dueAt).toLocaleDateString("en-GB")}</span>}
                  {m.releasedAt && (
                    <span>released {new Date(m.releasedAt).toLocaleDateString("en-GB")}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DesignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={onDesign}
        isLoading={isLoading}
        sector={sector}
      />
    </div>
  );
}

function DesignDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  sector,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (title: string, description: string) => void;
  isLoading: boolean;
  sector: string;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const submit = () => {
    if (!title.trim() || !description.trim()) return;
    onSubmit(title.trim(), description.trim());
    setTitle("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-gold/20 bg-background/95">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Design a new milestone</DialogTitle>
          <DialogDescription className="font-sans text-[12px]">
            The AI suggests evidence requirements, a realistic amount grounded in your financials,
            dependency ordering, and the {sector}-specific gate.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ms-title" className="font-mono text-xs uppercase tracking-wider">
              Milestone title
            </Label>
            <Input
              id="ms-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Greenhouse expansion — New Delta"
              className="border-gold/20 bg-foreground/[0.02]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="ms-desc"
              className="font-mono text-xs uppercase tracking-wider"
            >
              Description
            </Label>
            <Textarea
              id="ms-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the deliverable, scope, and intended use of funds."
              rows={4}
              className="border-gold/20 bg-foreground/[0.02]"
            />
          </div>
          <div className="rounded-lg border border-gold/10 bg-foreground/[0.02] px-3 py-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Sector (auto-filled)
            </p>
            <p className="mt-0.5 font-serif text-sm font-semibold capitalize">{sector}</p>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-10 gap-1.5"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={isLoading || !title.trim() || !description.trim()}
            className="h-10 gap-2 rounded-lg bg-gold-gradient font-sans text-[12px] font-semibold text-black hover:opacity-90 disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isLoading ? "Designing…" : "Design milestone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
