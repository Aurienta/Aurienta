"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Scale,
  Loader2,
  Sparkles,
  Gavel,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { egp, timeAgo } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

export type AppealCase = {
  id: string;
  filedById: string;
  filedByName: string;
  filedByAvatar: string;
  filedBySts: number;
  enterpriseId: string | null;
  enterpriseName: string | null;
  enterpriseTier: string | null;
  caseType: string;
  description: string;
  feeEgp: number;
  stage: number;
  status: string;
  aiRuling: string | null;
  humanRuling: string | null;
  finalRuling: string | null;
  precedentNote: string | null;
  filedAt: string;
  resolvedAt: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  expense_dispute: "Expense dispute",
  vote_challenge: "Vote challenge",
  manager_removal: "Manager removal",
  graduation_dispute: "Graduation dispute",
  charter_amendment: "Charter amendment",
  other: "Other",
};

const STAGE_NAMES = ["AI Ruling", "Human Panel", "Final Binding"];

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  filed: { label: "Filed", cls: "text-muted-foreground border-gold/20 bg-foreground/5", icon: Clock },
  ai_ruling: { label: "AI ruling", cls: "text-gold-light border-gold/30 bg-gold/10", icon: Sparkles },
  human_panel: { label: "Human panel", cls: "text-amber-300 border-amber-400/30 bg-amber-400/10", icon: Gavel },
  resolved: { label: "Resolved", cls: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10", icon: CheckCircle2 },
  final_ruling: { label: "Final ruling", cls: "text-gold-light border-gold/40 bg-gold/12", icon: Gavel },
  dismissed: { label: "Dismissed", cls: "text-rose-300 border-rose-400/30 bg-rose-400/10", icon: Scale },
};

export function AppealsClient({
  userId,
  userLegalName,
  enterprises,
  cases,
  stats,
}: {
  userId: string;
  userLegalName: string;
  enterprises: { id: string; name: string; slug: string; tier: string }[];
  cases: AppealCase[];
  stats: { total: number; filed: number; humanPanel: number; resolved: number; feesCollected: number };
}) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    enterpriseId: "",
    caseType: "expense_dispute",
    description: "",
  });
  const [expanded, setExpanded] = React.useState<string | null>(null);

  async function submit() {
    if (form.description.trim().length < 20) {
      toast.error("Description too short", { description: "Provide at least 20 characters." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: form.enterpriseId || undefined,
          caseType: form.caseType,
          description: form.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? "submit failed");
      toast.success("Appeal filed", {
        description: `Case ID ${data.caseId.slice(0, 10)} · 500 EGP fee locked · AI ruling pending.`,
      });
      setOpen(false);
      setForm({ enterpriseId: "", caseType: "expense_dispute", description: "" });
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      toast.error("Could not file appeal", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total cases", value: String(stats.total), icon: Scale },
          { label: "Awaiting AI", value: String(stats.filed), icon: Clock },
          { label: "In human panel", value: String(stats.humanPanel), icon: Gavel },
          { label: "Fees locked", value: egp(stats.feesCollected, { compact: true }), icon: FileText },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-gold/15 glass-gold p-4"
          >
            <kpi.icon className="h-4 w-4 text-gold" />
            <div className="mt-2 font-serif text-2xl font-semibold">{kpi.value}</div>
            <div className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* File appeal */}
      <div className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-gold" />
              <h2 className="font-serif text-lg font-semibold">File an appeal</h2>
            </div>
            <p className="mt-1.5 max-w-xl font-sans text-sm text-muted-foreground">
              A 500 EGP filing fee locks your appeal. The Constitutional AI issues a ruling in
              seconds; you can escalate to a human partner panel, and finally request binding
              arbitration. Every ruling becomes a precedent for future cases.
            </p>
          </div>
          <Button
            onClick={() => setOpen((o) => !o)}
            variant="outline"
            className="border-gold/30 hover:bg-gold/5"
          >
            {open ? "Cancel" : "File appeal"}
          </Button>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-5 flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                  Enterprise (optional)
                </Label>
                <Select
                  value={form.enterpriseId || "none"}
                  onValueChange={(v) => setForm((f) => ({ ...f, enterpriseId: v === "none" ? "" : v }))}
                >
                  <SelectTrigger className="border-gold/20 bg-background/40">
                    <SelectValue placeholder="Platform-level appeal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Platform-level appeal</SelectItem>
                    {enterprises.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} · T{e.tier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                  Case type
                </Label>
                <Select
                  value={form.caseType}
                  onValueChange={(v) => setForm((f) => ({ ...f, caseType: v }))}
                >
                  <SelectTrigger className="border-gold/20 bg-background/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                Description
              </Label>
              <Textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe the CRE decision you are appealing. Reference the original expense ID, vote ID, or action timestamp. Cite the constitutional article you believe was misapplied."
                className="border-gold/20 bg-background/40 font-sans text-sm"
              />
              <div className="flex items-center justify-between font-mono text-xs text-muted-foreground/80">
                <span>Min 20 chars · Max 8,000 chars</span>
                <span>Filing fee: 500 EGP (Law Firm Client Account-held)</span>
              </div>
            </div>
            <Button
              onClick={submit}
              disabled={submitting}
              className="self-end bg-gold-gradient text-[#0a0a0b] hover:opacity-90"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scale className="mr-2 h-4 w-4" />}
              File 500 EGP appeal
            </Button>
          </motion.div>
        )}
      </div>

      {/* Cases */}
      <div className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <GoldStar className="h-3 w-3" />
            <h2 className="font-serif text-base font-semibold">Docket</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">
              {cases.length} case{cases.length === 1 ? "" : "s"} · precedent-chained
            </span>
          </div>
        </div>

        {cases.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Scale className="mx-auto h-10 w-10 text-gold/50" />
            <p className="mt-3 font-serif text-base font-semibold">No appeals on the docket</p>
            <p className="mx-auto mt-1 max-w-sm font-sans text-xs text-muted-foreground">
              When you or a partner file an appeal, it will appear here with its AI ruling,
              human-panel status, and final binding decision.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gold/8">
            {cases.map((c) => {
              const meta = STATUS_META[c.status] ?? STATUS_META.filed;
              const isMine = c.filedById === userId;
              const isOpen = expanded === c.id;
              return (
                <li key={c.id} className="px-5 py-4">
                  <button
                    onClick={() => setExpanded(isOpen ? null : c.id)}
                    className="flex w-full flex-wrap items-center gap-2 text-left"
                  >
                    <span className="font-mono text-xs text-gold-light">
                      #{c.id.slice(-8).toUpperCase()}
                    </span>
                    <Badge variant="outline" className="border-gold/20 bg-foreground/5 text-xs">
                      {TYPE_LABELS[c.caseType] ?? c.caseType}
                    </Badge>
                    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide", meta.cls)}>
                      <meta.icon className="h-3 w-3" /> {meta.label}
                    </span>
                    {isMine && (
                      <Badge variant="outline" className="border-gold/40 bg-gold/12 text-[11px] text-gold-light">
                        Your case
                      </Badge>
                    )}
                    <span className="ml-auto font-sans text-xs text-muted-foreground/80">
                      filed {timeAgo(new Date(c.filedAt))} · fee {egp(c.feeEgp)}
                    </span>
                  </button>

                  <p className="mt-2 font-sans text-sm leading-relaxed text-foreground/90">
                    {c.description}
                  </p>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 flex flex-col gap-3"
                    >
                      {/* Stage tracker */}
                      <div className="flex items-center gap-2">
                        {STAGE_NAMES.map((name, i) => {
                          const stageIdx = i; // 0,1,2
                          const reached = c.stage > stageIdx;
                          const current = c.stage === stageIdx + 1;
                          return (
                            <React.Fragment key={name}>
                              <div className="flex flex-col items-center gap-1">
                                <div
                                  className={cn(
                                    "flex h-7 w-7 items-center justify-center rounded-full border font-mono text-xs",
                                    reached || current
                                      ? "border-gold/40 bg-gold/15 text-gold-light"
                                      : "border-gold/15 text-muted-foreground/80"
                                  )}
                                >
                                  {stageIdx + 1}
                                </div>
                                <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                                  {name}
                                </span>
                              </div>
                              {stageIdx < 2 && (
                                <ArrowRight className="h-3 w-3 text-muted-foreground/85" />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {c.precedentNote && (
                        <div className="rounded-xl border border-gold/12 bg-gold/[0.04] p-3">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-gold" />
                            <span className="font-sans text-xs uppercase tracking-wide text-gold-light/80">
                              Precedent
                            </span>
                          </div>
                          <p className="mt-1 font-sans text-xs text-foreground/90">{c.precedentNote}</p>
                        </div>
                      )}

                      {c.aiRuling && (
                        <RulingBlock label="AI Ruling" icon={Sparkles} text={c.aiRuling} />
                      )}
                      {c.humanRuling && (
                        <RulingBlock label="Human Panel Ruling" icon={Gavel} text={c.humanRuling} />
                      )}
                      {c.finalRuling && (
                        <RulingBlock label="Final Binding Ruling" icon={CheckCircle2} text={c.finalRuling} accent />
                      )}

                      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground/80">
                        <span>Filed by {c.filedByName} (STS {c.filedBySts})</span>
                        {c.enterpriseName && (
                          <span>· {c.enterpriseName}{c.enterpriseTier && ` · T${c.enterpriseTier}`}</span>
                        )}
                        {c.resolvedAt && <span>· resolved {timeAgo(new Date(c.resolvedAt))}</span>}
                      </div>
                    </motion.div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-center font-mono text-[11px] leading-relaxed text-muted-foreground/80">
        Three-stage appeal follows Vol 14 Due Process framework. AI rulings cite the precedent
        library (anonymised dispute resolutions, IPFS-pinned). Final binding arbitration requires
        a 75% Constitutional Council supermajority.
      </p>
    </div>
  );
}

function RulingBlock({
  label,
  icon: Icon,
  text,
  accent,
}: {
  label: string;
  icon: React.ElementType;
  text: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        accent ? "border-gold/30 bg-gold/[0.06]" : "border-gold/12 bg-foreground/[0.02]"
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3.5 w-3.5", accent ? "text-gold" : "text-gold/80")} />
        <span className="font-sans text-xs uppercase tracking-wide text-gold-light/80">{label}</span>
      </div>
      <p className="mt-1 font-sans text-xs leading-relaxed text-foreground/90">{text}</p>
    </div>
  );
}
