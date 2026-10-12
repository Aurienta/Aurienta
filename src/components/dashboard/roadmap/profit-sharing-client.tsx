"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  HandCoins,
  Inbox,
  Loader2,
  Plus,
  ShieldCheck,
  Scale,
  Lock,
  Copy,
  Check,
  FileText,
  Ban,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { egp, pct, shortHash } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";
import type {
  AgreementWithEnterprise,
  AgreementStatus,
} from "@/lib/aurienta/profit-sharing";

// ── Types ──
type EnterpriseForForm = {
  id: string;
  name: string;
  slug: string;
  tier: string;
};

type LedgerEvent = {
  id: string;
  sequence: number;
  eventType: string;
  payloadHash: string;
  prevHash?: string | null;
  timestamp: string;
};

// ── Status badge styling ──
const STATUS_META: Record<
  AgreementStatus,
  { label: string; cls: string; dot: string }
> = {
  active: {
    label: "Active",
    cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50",
    dot: "bg-emerald-500",
  },
  fulfilled: {
    label: "Fulfilled",
    cls: "text-indigo-700 border-indigo-500/40 bg-indigo-50",
    dot: "bg-indigo-500",
  },
  terminated: {
    label: "Terminated",
    cls: "text-slate-600 border-slate-400/40 bg-slate-100",
    dot: "bg-slate-400",
  },
};

// ── Props ──
export function ProfitSharingClient({
  userId,
  agreements: initialAgreements,
  enterprises,
}: {
  userId: string;
  agreements: AgreementWithEnterprise[];
  enterprises: EnterpriseForForm[];
}) {
  const [agreements, setAgreements] = React.useState<AgreementWithEnterprise[]>(
    initialAgreements
  );
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [ledgerAgreementId, setLedgerAgreementId] = React.useState<string | null>(
    null
  );
  const [ledgerEvents, setLedgerEvents] = React.useState<LedgerEvent[]>([]);
  const [ledgerLoading, setLedgerLoading] = React.useState(false);
  const [terminatingId, setTerminatingId] = React.useState<string | null>(null);

  // ── New-agreement form state ──
  const [form, setForm] = React.useState({
    enterpriseId: enterprises[0]?.id ?? "",
    title: "",
    contributionEgp: 5000,
    profitSharePct: 10,
    termMonths: 12,
  });

  // ── Refresh agreements from API (after create / terminate) ──
  async function refresh() {
    setLoading(true);
    try {
      const res = await csrfFetch("/api/profit-sharing");
      if (!res.ok) throw new Error("Failed to load agreements");
      const data = (await res.json()) as { agreements: AgreementWithEnterprise[] };
      setAgreements(data.agreements);
    } catch (e) {
      toast.error("Could not refresh agreements", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  // ── Submit new agreement ──
  async function submit() {
    if (!form.enterpriseId) {
      toast.error("Select an enterprise", {
        description: "A profit-share agreement must be bound to one of your enterprises.",
      });
      return;
    }
    if (form.title.trim().length < 3) {
      toast.error("Title too short", {
        description: "Use at least 3 characters.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/profit-sharing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: form.enterpriseId,
          title: form.title.trim(),
          contributionEgp: form.contributionEgp,
          profitSharePct: form.profitSharePct,
          termMonths: form.termMonths,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Show CRE verdict reason on rejection
        throw new Error(data.error ?? data.message ?? "CRE denied");
      }
      toast.success("Agreement created", {
        description: `"${data.agreement.title}" — CRE verdict: allowed. Ledger anchored.`,
      });
      setDialogOpen(false);
      setForm((f) => ({
        ...f,
        title: "",
        contributionEgp: 5000,
        profitSharePct: 10,
        termMonths: 12,
      }));
      // Refresh the list to include the new agreement.
      await refresh();
    } catch (e) {
      toast.error("CRE denied agreement", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Terminate an agreement ──
  async function terminate(agreementId: string) {
    setTerminatingId(agreementId);
    try {
      const res = await csrfFetch(
        `/api/profit-sharing/${encodeURIComponent(agreementId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "terminate" }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? data.message ?? "terminate failed");
      }
      toast.success("Agreement terminated", {
        description: "Status set to terminated. Ledger event recorded.",
      });
      await refresh();
    } catch (e) {
      toast.error("Could not terminate", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setTerminatingId(null);
    }
  }

  // ── View ledger for an agreement ──
  async function viewLedger(agreement: AgreementWithEnterprise) {
    setLedgerAgreementId(agreement.id);
    setLedgerEvents([]);
    setLedgerLoading(true);
    try {
      // Pull the live ticker for the enterprise — returns the last 20
      // ledger events with payload hash + sequence + timestamp. We
      // surface them generically (no AI narration needed here).
      const url = `/api/ledger/ticker?enterpriseId=${encodeURIComponent(
        agreement.enterpriseId
      )}`;
      const res = await csrfFetch(url);
      if (!res.ok) throw new Error("Failed to load ledger");
      const data = await res.json();
      const allEvents: LedgerEvent[] = (data.events ?? []).map(
        (e: Record<string, unknown>) => ({
          id: String(e.id ?? ""),
          sequence: Number(e.sequence ?? 0),
          eventType: String(e.eventType ?? ""),
          payloadHash: String(e.payloadHash ?? ""),
          prevHash: e.prevHash ? String(e.prevHash) : null,
          timestamp: e.timestamp
            ? new Date(e.timestamp as string).toISOString()
            : new Date(0).toISOString(),
        })
      );
      setLedgerEvents(allEvents.slice(0, 60));
    } catch (e) {
      toast.error("Could not load ledger", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
      setLedgerAgreementId(null);
    } finally {
      setLedgerLoading(false);
    }
  }

  // ── Stats strip ──
  const stats = React.useMemo(() => {
    const active = agreements.filter((a) => a.status === "active").length;
    const fulfilled = agreements.filter((a) => a.status === "fulfilled").length;
    const totalContrib = agreements.reduce(
      (s, a) => s + a.contributionEgp,
      0
    );
    const totalDistributed = agreements.reduce(
      (s, a) => s + a.totalDistributedEgp,
      0
    );
    return { active, fulfilled, totalContrib, totalDistributed };
  }, [agreements]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-indigo-500/60" />
              <span className="font-mono text-xs uppercase tracking-[0.28em] text-indigo-700/80">
                Constitutional Contracts · ROADMAP-02
              </span>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-indigo-950 sm:text-4xl">
              Profit-Sharing Agreements
            </h1>
            <p className="mt-2 max-w-2xl font-sans text-sm text-slate-600">
              Constitutional contracts — NOT securities. CRE enforces profit
              distribution from enterprise revenue.
            </p>
          </div>
          {enterprises.length > 0 && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-indigo-600 text-white shadow-[0_10px_40px_-12px_rgba(79,70,229,0.65)] hover:bg-indigo-700 hover:-translate-y-0.5"
                  size="lg"
                >
                  <Plus className="h-4 w-4" />
                  New Agreement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">
                    New profit-share agreement
                  </DialogTitle>
                  <DialogDescription>
                    A contractual profit-share (مشاركة في الأرباح). No fixed coupon, no
                    secondary market, no trading. CRE validates and anchors the
                    agreement to the immutable ledger.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                  {/* Enterprise select */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                      Enterprise
                    </Label>
                    <Select
                      value={form.enterpriseId}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, enterpriseId: v }))
                      }
                    >
                      <SelectTrigger className="border-indigo-200 bg-white">
                        <SelectValue placeholder="Select an enterprise" />
                      </SelectTrigger>
                      <SelectContent>
                        {enterprises.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name} · Tier {e.tier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                      Agreement title
                    </Label>
                    <Input
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="e.g. Q4 revenue share — distribution partner"
                      maxLength={200}
                      className="border-indigo-200 bg-white"
                    />
                  </div>

                  {/* Contribution */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                      Contribution (EGP) — minimum 50
                    </Label>
                    <Input
                      type="number"
                      min={50}
                      max={500_000_000}
                      value={form.contributionEgp}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          contributionEgp: Number(e.target.value) || 0,
                        }))
                      }
                      className="border-indigo-200 bg-white"
                    />
                    <p className="font-mono text-[11px] text-slate-500">
                      {egp(form.contributionEgp)} committed at agreement start.
                    </p>
                  </div>

                  {/* Profit share % */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                        Profit share %
                      </Label>
                      <span className="font-mono text-sm font-semibold text-indigo-700">
                        {pct(form.profitSharePct, 0)}
                      </span>
                    </div>
                    <Slider
                      min={1}
                      max={30}
                      step={1}
                      value={[form.profitSharePct]}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          profitSharePct: v[0] ?? 10,
                        }))
                      }
                      className="[&_[data-slot=slider-track]]:bg-indigo-100 [&_[data-slot=slider-range]]:bg-indigo-600 [&_[data-slot=slider-thumb]]:border-indigo-600"
                    />
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span>1% (floor)</span>
                      <span className="text-indigo-600">
                        anti-capture cap: 30%
                      </span>
                    </div>
                  </div>

                  {/* Term months */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                      Term (months) — 1 to 60
                    </Label>
                    <Select
                      value={String(form.termMonths)}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, termMonths: Number(v) }))
                      }
                    >
                      <SelectTrigger className="border-indigo-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {TERM_OPTIONS.map((t) => (
                          <SelectItem key={t} value={String(t)}>
                            {t} month{t === 1 ? "" : "s"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submit}
                    disabled={submitting}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    Submit to CRE
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* ── Compliance banner (indigo) ── */}
        <div className="flex items-start gap-3 rounded-xl border border-indigo-300/50 bg-indigo-50 px-4 py-3">
          <Scale className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
          <p className="font-sans text-[12px] leading-relaxed text-indigo-900">
            These are contractual profit-share agreements (
            <span className="font-medium">مشاركة في الأرباح</span>), not bonds or
            securities. No fixed coupon, no secondary market, no trading.
            Compliant with Egyptian Capital Market Law 95/1992.
          </p>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Active",
              value: String(stats.active),
              icon: TrendingUp,
            },
            {
              label: "Fulfilled",
              value: String(stats.fulfilled),
              icon: Check,
            },
            {
              label: "Contributed",
              value: egp(stats.totalContrib, { compact: true }),
              icon: HandCoins,
            },
            {
              label: "Distributed",
              value: egp(stats.totalDistributed, { compact: true }),
              icon: Scale,
            },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-indigo-200/60 bg-white p-4 shadow-sm"
            >
              <kpi.icon className="h-4 w-4 text-indigo-600" />
              <div className="mt-2 font-serif text-2xl font-semibold text-indigo-950">
                {kpi.value}
              </div>
              <div className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                {kpi.label}
              </div>
            </motion.div>
          ))}
        </div>
      </header>

      {/* ── Agreements list ── */}
      {loading && agreements.length === 0 ? (
        <AgreementsSkeleton />
      ) : agreements.length === 0 ? (
        <EmptyState
          hasEnterprises={enterprises.length > 0}
          onNew={() => setDialogOpen(true)}
        />
      ) : (
        <div className="max-h-[28rem] overflow-y-auto rounded-2xl border border-indigo-200/40 bg-white/60 p-1 [scrollbar-width:thin]">
          <div className="flex flex-col gap-3 p-1">
            <AnimatePresence mode="popLayout">
              {agreements.map((a) => (
                <AgreementCard
                  key={a.id}
                  agreement={a}
                  isPartner={a.partnerId === userId}
                  onTerminate={() => terminate(a.id)}
                  onViewLedger={() => viewLedger(a)}
                  terminating={terminatingId === a.id}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="mt-2 flex flex-wrap items-center gap-3 border-t border-indigo-200/40 pt-4 font-mono text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Scale className="h-3 w-3 text-indigo-600" /> CRE-enforced
        </span>
        <span className="text-indigo-300">·</span>
        <span className="inline-flex items-center gap-1">
          <Lock className="h-3 w-3 text-indigo-600" /> Hash-anchored
        </span>
        <span className="text-indigo-300">·</span>
        <span className="inline-flex items-center gap-1">
          <HandCoins className="h-3 w-3 text-indigo-600" /> Egyptian CML 95/1992 compliant
        </span>
      </footer>

      {/* ── Ledger drawer ── */}
      <Dialog
        open={ledgerAgreementId !== null}
        onOpenChange={(v) => {
          if (!v) setLedgerAgreementId(null);
        }}
      >
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Agreement ledger
            </DialogTitle>
            <DialogDescription>
              Immutable hash-anchored events for this profit-share agreement.
              Each entry is signed by the CRE platform key and chained via
              SHA-256.
            </DialogDescription>
          </DialogHeader>

          {ledgerLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            </div>
          ) : ledgerEvents.length === 0 ? (
            <p className="py-8 text-center font-sans text-sm text-slate-500">
              No ledger events found for this agreement.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-indigo-200/40 bg-white">
              <ul className="flex flex-col divide-y divide-indigo-100">
                {ledgerEvents.map((ev) => (
                  <li key={ev.id} className="flex flex-col gap-1 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-indigo-700">
                        #{ev.sequence} · {ev.eventType}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      hash {shortHash(ev.payloadHash, 14, 6)}
                    </div>
                    {ev.prevHash && (
                      <div className="font-mono text-[10px] text-slate-400">
                        prev {shortHash(ev.prevHash, 8, 4)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLedgerAgreementId(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Agreement card ──
function AgreementCard({
  agreement,
  isPartner,
  onTerminate,
  onViewLedger,
  terminating,
}: {
  agreement: AgreementWithEnterprise;
  isPartner: boolean;
  onTerminate: () => void;
  onViewLedger: () => void;
  terminating: boolean;
}) {
  const meta = STATUS_META[agreement.status] ?? STATUS_META.active;
  const fulfillTarget = agreement.contributionEgp * 2;
  const progressPct = Math.min(
    100,
    (agreement.totalDistributedEgp / Math.max(1, fulfillTarget)) * 100
  );
  const maturesAt = new Date(agreement.maturesAt);
  const isPastMaturity = maturesAt.getTime() < Date.now();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-2xl border border-indigo-200/60 bg-white p-4 shadow-sm transition-colors hover:border-indigo-400/60 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {/* Title + status badge */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-lg font-semibold text-indigo-950">
              {agreement.title}
            </h3>
            <Badge className={cn("border", meta.cls)}>
              <span className={cn("mr-1 h-1.5 w-1.5 rounded-full", meta.dot)} />
              {meta.label}
            </Badge>
          </div>
          {/* Enterprise line */}
          <p className="mt-0.5 font-sans text-[12px] text-slate-500">
            {agreement.enterprise
              ? `${agreement.enterprise.name} · Tier ${agreement.enterprise.tier}`
              : "Unknown enterprise"}
          </p>

          {/* Metric grid */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Contribution" value={egp(agreement.contributionEgp)} />
            <Metric label="Profit share" value={pct(agreement.profitSharePct, 0)} />
            <Metric label="Term" value={`${agreement.termMonths} mo`} />
            <Metric
              label="Matures"
              value={maturesAt.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
              alert={isPastMaturity && agreement.status === "active"}
            />
          </div>

          {/* Distribution progress toward contribution*2 (fulfillment target) */}
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-sans text-[11px]">
              <span className="text-slate-500">
                Distributions: {egp(agreement.totalDistributedEgp)} of{" "}
                {egp(fulfillTarget)} target
              </span>
              <span className="font-mono text-indigo-700">
                {progressPct.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={progressPct}
              className="h-1.5 bg-indigo-100 [&>[data-slot=progress-indicator]]:bg-indigo-600"
            />
          </div>

          {/* CRE decision token */}
          {agreement.creDecisionToken && (
            <CreTokenRow token={agreement.creDecisionToken} />
          )}
        </div>

        {/* Action column */}
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewLedger}
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <FileText className="h-3.5 w-3.5" />
            View Ledger
          </Button>
          {isPartner && agreement.status === "active" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTerminate}
              disabled={terminating}
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
            >
              {terminating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Ban className="h-3.5 w-3.5" />
              )}
              Terminate
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── CRE decision token row with copy button ──
function CreTokenRow({ token }: { token: string }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (e.g. insecure origin).
    }
  }
  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-2.5 py-1.5">
      <Lock className="h-3 w-3 shrink-0 text-indigo-600" />
      <span className="font-mono text-[10px] text-slate-500">CRE token</span>
      <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-indigo-900">
        {shortHash(token, 14, 6)}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy CRE decision token"
        className="inline-flex h-5 w-5 items-center justify-center rounded text-indigo-600 transition-colors hover:bg-indigo-100"
      >
        {copied ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}

// ── Metric chip ──
function Metric({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 px-2.5 py-1.5">
      <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div
        className={cn(
          "font-sans text-sm font-semibold",
          alert ? "text-rose-700" : "text-indigo-950"
        )}
      >
        {value}
      </div>
    </div>
  );
}

// ── Empty state ──
function EmptyState({
  hasEnterprises,
  onNew,
}: {
  hasEnterprises: boolean;
  onNew: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-indigo-300/60 bg-white/70 py-16 text-center"
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 rounded-full bg-indigo-200/40 blur-xl" />
        <Inbox className="relative h-8 w-8 text-indigo-500" />
      </div>
      <p className="font-serif text-base font-semibold text-indigo-950">
        No profit-share agreements yet
      </p>
      <p className="max-w-sm font-sans text-[12px] text-slate-600">
        {hasEnterprises
          ? "Enter into a constitutional profit-share contract with one of your enterprises. The CRE will validate every term before anchoring to the ledger."
          : "You need to be a member of an enterprise before entering into a profit-share agreement. Join or found an enterprise to continue."}
      </p>
      {hasEnterprises && (
        <Button
          onClick={onNew}
          className="bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Create first agreement
        </Button>
      )}
    </motion.div>
  );
}

// ── Loading skeleton ──
function AgreementsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-indigo-200/40 bg-white p-5"
        >
          <Skeleton className="h-5 w-1/3 bg-indigo-100/80" />
          <Skeleton className="mt-2 h-3 w-1/4 bg-indigo-100/60" />
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-10 bg-indigo-100/60" />
            ))}
          </div>
          <Skeleton className="mt-3 h-2 w-full bg-indigo-100/60" />
        </div>
      ))}
    </div>
  );
}

// ── Term-month options (1..60) ──
const TERM_OPTIONS: number[] = Array.from(
  { length: 60 },
  (_, i) => i + 1
);
