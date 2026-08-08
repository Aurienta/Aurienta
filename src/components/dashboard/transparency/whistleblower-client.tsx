"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ShieldAlert,
  Loader2,
  Lock,
  Sparkles,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { egp, pct, timeAgo } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

export type WhistleblowerReport = {
  id: string;
  trackingCode: string;
  enterpriseId: string | null;
  enterpriseName: string | null;
  enterpriseTier: string | null;
  category: string;
  description: string;
  attachmentsCid: string | null;
  credibilityScore: number | null;
  aiSummary: string | null;
  status: string;
  bondEgp: number;
  bountyPaidEgp: number;
  createdAt: string;
  resolvedAt: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  conflict_of_interest: "Conflict of interest",
  threshold_gaming: "Threshold gaming",
  fraud: "Fraud / misappropriation",
  discrimination: "Discrimination",
  safety_violation: "Safety violation",
  regulatory_breach: "Regulatory breach",
  other: "Other",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  submitted: { label: "Submitted", cls: "text-muted-foreground border-gold/20 bg-foreground/5" },
  investigating: { label: "Investigating", cls: "text-amber-300 border-amber-400/30 bg-amber-400/10" },
  validated: { label: "Validated", cls: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" },
  dismissed: { label: "Dismissed", cls: "text-rose-300 border-rose-400/30 bg-rose-400/10" },
  resolved: { label: "Resolved", cls: "text-gold-light border-gold/40 bg-gold/12" },
};

export function WhistleblowerClient({
  userId,
  enterprises,
  reports,
  stats,
}: {
  userId: string;
  enterprises: { id: string; name: string; slug: string; tier: string }[];
  reports: WhistleblowerReport[];
  stats: { total: number; validated: number; investigating: number; bountyPaid: number };
}) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    enterpriseId: "",
    category: "conflict_of_interest",
    description: "",
  });
  const [reveal, setReveal] = React.useState<Set<string>>(new Set());

  async function submit() {
    if (form.description.trim().length < 20) {
      toast.error("Description too short", { description: "Provide at least 20 characters of detail." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/whistleblower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: form.enterpriseId || undefined,
          category: form.category,
          description: form.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? "submit failed");
      toast.success("Report filed", {
        description: `Tracking code: ${data.trackingCode}. Save this — it is your only key to the report.`,
      });
      setOpen(false);
      setForm({ enterpriseId: "", category: "conflict_of_interest", description: "" });
      // Reload to surface the new report.
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      toast.error("Could not file report", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  }

  function toggleReveal(id: string) {
    setReveal((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active channel", value: String(stats.total), icon: ShieldAlert },
          { label: "Validated", value: String(stats.validated), icon: CheckCircle2 },
          { label: "Investigating", value: String(stats.investigating), icon: AlertTriangle },
          { label: "Bounties paid", value: egp(stats.bountyPaid, { compact: true }), icon: Coins },
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

      {/* File a report */}
      <div className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-gold" />
              <h2 className="font-serif text-lg font-semibold">File an encrypted report</h2>
            </div>
            <p className="mt-1.5 max-w-xl font-sans text-sm text-muted-foreground">
              Reports are encrypted at rest, indexed only by a tracking code, and triaged by the
              Constitutional AI. A 5,000 EGP cryptographic bond locks your credibility; validated
              findings earn up to 25,000 EGP from the integrity fund.
            </p>
          </div>
          <Button
            onClick={() => setOpen((o) => !o)}
            variant="outline"
            className="border-gold/30 hover:bg-gold/5"
          >
            {open ? "Cancel" : "File report"}
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
                    <SelectValue placeholder="Not enterprise-specific" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not enterprise-specific</SelectItem>
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
                  Category
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger className="border-gold/20 bg-background/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                Detailed description
              </Label>
              <Textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe what you observed. Include dates, amounts, and parties. The Constitutional AI will redact third-party PII before any human reviewer sees the text."
                className="border-gold/20 bg-background/40 font-sans text-sm"
              />
              <p className="font-mono text-xs text-muted-foreground/80">
                Min 20 chars · Max 8,000 chars · Encrypted on submit
              </p>
            </div>
            <div className="flex items-center gap-2 self-end">
              <Button
                onClick={submit}
                disabled={submitting}
                className="bg-gold-gradient text-[#0a0a0b] hover:opacity-90"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                File encrypted report
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Reports list */}
      <div className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <GoldStar className="h-3 w-3" />
            <h2 className="font-serif text-base font-semibold">Channel ledger</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">
              {reports.length} entr{reports.length === 1 ? "y" : "ies"} · tracking-coded · AI-triaged
            </span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {reports.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-gold/50" />
              <p className="mt-3 font-serif text-base font-semibold">No reports yet</p>
              <p className="mx-auto mt-1 max-w-sm font-sans text-xs text-muted-foreground">
                The channel is empty. File the first encrypted report above — the Constitutional
                AI will triage within seconds of submission.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gold/8">
              {reports.map((r) => {
                const isRevealed = reveal.has(r.id);
                const status = STATUS_META[r.status] ?? STATUS_META.submitted;
                return (
                  <li key={r.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-gold-light">{r.trackingCode}</span>
                      {r.enterpriseName && (
                        <span className="font-sans text-[11px] text-muted-foreground">
                          · {r.enterpriseName} {r.enterpriseTier && `· T${r.enterpriseTier}`}
                        </span>
                      )}
                      <Badge variant="outline" className="border-gold/20 bg-foreground/5 text-xs">
                        {CATEGORY_LABELS[r.category] ?? r.category}
                      </Badge>
                      <span className={cn("inline-flex rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide", status.cls)}>
                        {status.label}
                      </span>
                      <span className="ml-auto font-sans text-xs text-muted-foreground/80">
                        {timeAgo(new Date(r.createdAt))}
                      </span>
                    </div>

                    <p
                      className={cn(
                        "mt-2 font-sans text-sm leading-relaxed",
                        isRevealed ? "text-foreground" : "text-muted-foreground/75 blur-[3px] select-none"
                      )}
                    >
                      {r.description}
                    </p>

                    {r.aiSummary && (
                      <div className="mt-3 rounded-xl border border-gold/12 bg-gold/[0.04] p-3">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-gold" />
                          <span className="font-sans text-xs uppercase tracking-wide text-gold-light/80">
                            Constitutional AI triage
                          </span>
                          {r.credibilityScore != null && (
                            <span className="ml-auto font-mono text-xs text-muted-foreground">
                              credibility {pct(r.credibilityScore * 100, 0)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 font-sans text-xs leading-relaxed text-foreground/90">{r.aiSummary}</p>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground/85">
                        <Lock className="h-3 w-3" /> bond {egp(r.bondEgp)}
                      </span>
                      {r.bountyPaidEgp > 0 && (
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-300">
                          <Coins className="h-3 w-3" /> bounty paid {egp(r.bountyPaidEgp)}
                        </span>
                      )}
                      <button
                        onClick={() => toggleReveal(r.id)}
                        className="ml-auto inline-flex items-center gap-1 rounded-full border border-gold/15 px-3 py-1 font-sans text-xs text-muted-foreground hover:text-foreground"
                      >
                        {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {isRevealed ? "Re-hide text" : "Reveal text"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <p className="text-center font-mono text-[11px] leading-relaxed text-muted-foreground/80">
        Whistleblower protections follow Egyptian Labour Law 12/2003 Art. 122 and the platform's
        Vol 9 Integrity Bond framework.  Tracking codes are the only key — AURIENTA cannot decrypt
        report text without the filer's reveal action.
      </p>
    </div>
  );
}
