"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles, ShieldCheck, AlertTriangle } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { PROPOSAL_TYPES, CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { egp } from "@/lib/aurienta/format";
import type { EnterpriseForUi } from "./types";

type Props = {
  enterprises: EnterpriseForUi[];
  triggerClassName?: string;
};

type FieldKey = "amount" | "manager" | "readiness" | "rationale";

const DYNAMIC_FIELDS: Partial<Record<string, { key: FieldKey; label: string; placeholder: string; optional?: boolean }[]>> = {
  budget: [
    {
      key: "amount",
      label: "Budget amount (EGP)",
      placeholder: "e.g. 350000",
    },
  ],
  manager_appointment: [
    {
      key: "manager",
      label: "Nominee name",
      placeholder: "Full legal name",
    },
    {
      key: "rationale",
      label: "Police clearance & expertise note",
      placeholder: "Reference the police clearance date + AI Expertise Score.",
    },
  ],
  manager_removal: [
    {
      key: "rationale",
      label: "Grounds for removal",
      placeholder: "Constitutional grounds + evidence summary.",
    },
  ],
  dividend: [
    {
      key: "amount",
      label: "Dividend per Equity Unit (EGP)",
      placeholder: "e.g. 12.50",
    },
  ],
  graduation: [
    {
      key: "readiness",
      label: "Readiness note",
      placeholder: "Stage, health score, NOSI, runway — cite the readiness gates.",
    },
  ],
  consulting_optout: [
    {
      key: "rationale",
      label: "Profitability evidence",
      placeholder: "Quarterly track record supporting the opt-out.",
    },
  ],
  law_firm_replacement: [
    {
      key: "manager",
      label: "Incoming law firm",
      placeholder: "Law firm name + FRA license #",
    },
  ],
  constitutional_amendment: [
    {
      key: "rationale",
      label: "Amendment text & rationale",
      placeholder: "Article number, current text, proposed text, justification.",
    },
  ],
  emergency_freeze: [
    {
      key: "rationale",
      label: "Emergency basis",
      placeholder: "Cite the triggering condition (Art. 87 emergency powers).",
    },
  ],
};

export function NewProposalDialog({ enterprises, triggerClassName }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [type, setType] = React.useState<string>("");
  const [enterpriseId, setEnterpriseId] = React.useState<string>(
    enterprises[0]?.id ?? ""
  );
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dynamic, setDynamic] = React.useState<Record<string, string>>({});

  const meta = type ? PROPOSAL_TYPES[type] : null;
  const selectedEnterprise = enterprises.find((e) => e.id === enterpriseId);

  React.useEffect(() => {
    if (open && enterprises.length > 0 && !enterpriseId) {
      setEnterpriseId(enterprises[0].id);
    }
  }, [open, enterprises, enterpriseId]);

  function reset() {
    setType("");
    setTitle("");
    setDescription("");
    setDynamic({});
    setEnterpriseId(enterprises[0]?.id ?? "");
  }

  async function handleSubmit() {
    if (!type || !enterpriseId || !title.trim() || !description.trim()) {
      toast.error("Missing fields", {
        description: "Type, enterprise, title and description are required.",
      });
      return;
    }
    setSubmitting(true);
    try {
      // Compose a richer description with the dynamic fields appended.
      const extra = DYNAMIC_FIELDS[type] ?? [];
      const extraLines = extra
        .map((f) => {
          const v = dynamic[f.key]?.trim();
          return v ? `${f.label}: ${v}` : null;
        })
        .filter(Boolean) as string[];
      const composed =
        extraLines.length > 0
          ? `${description.trim()}\n\n${extraLines.join("\n")}`
          : description.trim();

      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId,
          type,
          title: title.trim(),
          description: composed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Proposal rejected", {
          description:
            res.status === 403
              ? "You are not a member of this enterprise."
              : data?.error || "Please try again.",
        });
        return;
      }
      toast.success("Proposal published — cooling period begins", {
        description: `AI risk scored by Mixtral 8x22B · cooling ${meta?.cooling} · voting ${meta?.voting}.`,
      });
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      toast.error("Network error", {
        description: "Could not reach the constitutional ledger.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const dynamicFields = type ? DYNAMIC_FIELDS[type] ?? [] : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          className={cn(
            "h-10 gap-2 rounded-full bg-gold-gradient px-5 text-black hover:opacity-95",
            triggerClassName
          )}
        >
          <Plus className="h-4 w-4" />
          New proposal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl gap-0 border-gold/20 bg-popover/95 p-0 backdrop-blur-xl sm:max-w-2xl">
        <DialogHeader className="space-y-2 border-b border-gold/10 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Constitutional proposal
            </span>
          </div>
          <DialogTitle className="font-serif text-xl">Raise a constitutional proposal</DialogTitle>
          <DialogDescription className="font-sans text-[12px] text-muted-foreground">
            Every proposal is AI-risk-scored by Mixtral 8x22B, enters a constitutional cooling period,
            and is recorded on the immutable hash-chained ledger.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 sm:px-6">
          {/* Type select */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Proposal type
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-10 w-full border-gold/15 bg-foreground/[0.02]">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent className="max-h-72 border-gold/15 bg-popover">
                  {Object.entries(PROPOSAL_TYPES).map(([key, m]) => (
                    <SelectItem key={key} value={key}>
                      <span className="font-sans text-sm">{m.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Enterprise
              </Label>
              <Select value={enterpriseId} onValueChange={setEnterpriseId}>
                <SelectTrigger className="h-10 w-full border-gold/15 bg-foreground/[0.02]">
                  <SelectValue placeholder="Select enterprise…" />
                </SelectTrigger>
                <SelectContent className="max-h-72 border-gold/15 bg-popover">
                  {enterprises.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <span className="font-sans text-sm">{e.name}</span>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        Tier {e.tier}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Period preview */}
          {meta && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-gold/10 bg-gold/[0.04] p-3">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" />
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Cooling {meta.cooling} · Voting {meta.voting} · Pass {meta.threshold}%
              </span>
              {meta.threshold > 50 && (
                <span className="ml-auto inline-flex items-center gap-1 font-mono text-xs text-amber-300">
                  <AlertTriangle className="h-3 w-3" />
                  Supermajority required
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <div className="mt-4 space-y-2">
            <Label htmlFor="prop-title" className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Title
            </Label>
            <Input
              id="prop-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A concise, action-oriented title."
              maxLength={140}
              className="h-10 border-gold/15 bg-foreground/[0.02] font-sans text-sm"
            />
            <p className="text-right font-mono text-[11px] text-muted-foreground/80">
              {title.length}/140
            </p>
          </div>

          {/* Description */}
          <div className="mt-2 space-y-2">
            <Label htmlFor="prop-desc" className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="prop-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the proposal, the rationale, and any constitutional basis (article numbers where applicable)."
              maxLength={2000}
              className="min-h-28 resize-none border-gold/15 bg-foreground/[0.02] font-sans text-sm"
            />
            <p className="text-right font-mono text-[11px] text-muted-foreground/80">
              {description.length}/2000
            </p>
          </div>

          {/* Dynamic fields per type */}
          {dynamicFields.length > 0 && (
            <>
              <Separator className="my-4 bg-gold/10" />
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {PROPOSAL_TYPES[type]?.label} specifics
              </p>
              <div className="grid gap-3">
                {dynamicFields.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="font-sans text-[12px] text-foreground">
                      {f.label}
                      {f.optional && (
                        <span className="ml-1 font-mono text-[11px] text-muted-foreground/80">
                          optional
                        </span>
                      )}
                    </Label>
                    <Textarea
                      value={dynamic[f.key] ?? ""}
                      onChange={(e) =>
                        setDynamic((d) => ({ ...d, [f.key]: e.target.value }))
                      }
                      placeholder={f.placeholder}
                      maxLength={500}
                      className="min-h-16 resize-none border-gold/15 bg-foreground/[0.02] font-sans text-sm"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Voting power note */}
          {selectedEnterprise && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-gold/10 bg-foreground/[0.02] p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-gold/70" />
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Your voting power · {selectedEnterprise.name}
                </span>
              </div>
              <span className="font-serif text-sm font-semibold text-gold-light">
                {egp(selectedEnterprise.userVotingPower, { compact: true })}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-gold/10 p-5 sm:px-6">
          <div className="mr-auto hidden items-center gap-2 sm:flex">
            <span className="font-mono text-[11px] text-muted-foreground/80">
              constitution {CONSTITUTIONAL_HASH.slice(0, 10)}…
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false);
              reset();
            }}
            className="h-10 rounded-lg text-muted-foreground hover:text-foreground"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !type || !title.trim() || !description.trim()}
            className="h-10 gap-2 rounded-lg bg-gold-gradient px-5 text-black hover:opacity-95 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Submit proposal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
