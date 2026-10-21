"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Network,
  ArrowRight,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  Users,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { egp, timeAgo } from "@/lib/aurienta/format";
import { EmptyState } from "@/components/dashboard/ux/empty-state";
import type { TransactionWithEnterprises } from "@/lib/aurienta/cooperative-network";

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  sector: string;
  status: string;
};

type Stats = {
  totalPartners: number;
  totalVolume: number;
  activeTransactions: number;
};

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  pending: {
    label: "Pending",
    cls: "text-slate-600 border-slate-400/40 bg-slate-100",
    dot: "bg-slate-400",
  },
  cre_verified: {
    label: "CRE Verified",
    cls: "text-indigo-700 border-indigo-500/40 bg-indigo-50",
    dot: "bg-indigo-500",
  },
  completed: {
    label: "Completed",
    cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50",
    dot: "bg-emerald-500",
  },
  disputed: {
    label: "Disputed",
    cls: "text-rose-700 border-rose-500/40 bg-rose-50",
    dot: "bg-rose-500",
  },
};

export function CooperativeNetworkClient({
  enterprises,
  initialTransactions,
  initialStats,
  initialEnterpriseId,
}: {
  enterprises: Enterprise[];
  initialTransactions: TransactionWithEnterprises[];
  initialStats: Stats;
  initialEnterpriseId: string;
}) {
  const [selectedEntId, setSelectedEntId] = React.useState(initialEnterpriseId);
  const [transactions, setTransactions] = React.useState(initialTransactions);
  const [stats, setStats] = React.useState(initialStats);
  const [refreshing, setRefreshing] = React.useState(false);

  // New transaction form
  const [form, setForm] = React.useState({
    buyerEnterpriseId: initialEnterpriseId,
    sellerEnterpriseId: "",
    description: "",
    amountEgp: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [completingId, setCompletingId] = React.useState<string | null>(null);

  async function refresh(enterpriseId: string) {
    if (!enterpriseId) return;
    setRefreshing(true);
    try {
      const res = await fetch(
        `/api/cooperative/transactions?enterpriseId=${encodeURIComponent(enterpriseId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to load transactions");
      const data = await res.json();
      setTransactions(data.transactions ?? []);
      setStats(data.stats ?? { totalPartners: 0, totalVolume: 0, activeTransactions: 0 });
    } catch (e) {
      toast.error("Could not load transactions", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setRefreshing(false);
    }
  }

  React.useEffect(() => {
    if (selectedEntId) {
      refresh(selectedEntId);
      setForm((f) => ({
        ...f,
        buyerEnterpriseId: selectedEntId,
        sellerEnterpriseId: "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntId]);

  async function handleSubmit() {
    if (!form.buyerEnterpriseId || !form.sellerEnterpriseId) {
      toast.error("Select both buyer and seller enterprises");
      return;
    }
    if (form.buyerEnterpriseId === form.sellerEnterpriseId) {
      toast.error("Buyer and seller cannot be the same enterprise");
      return;
    }
    if (form.description.trim().length < 3) {
      toast.error("Description must be at least 3 characters");
      return;
    }
    const amount = parseInt(form.amountEgp, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Amount must be a positive integer (EGP)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/cooperative/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerEnterpriseId: form.buyerEnterpriseId,
          sellerEnterpriseId: form.sellerEnterpriseId,
          description: form.description.trim(),
          amountEgp: amount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create transaction");
      toast.success("Cooperative transaction created", {
        description: `${egp(amount)} · CRE verified`,
      });
      setForm({ ...form, sellerEnterpriseId: "", description: "", amountEgp: "" });
      await refresh(form.buyerEnterpriseId);
    } catch (e) {
      toast.error("Transaction denied by CRE", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete(transactionId: string) {
    setCompletingId(transactionId);
    try {
      const res = await csrfFetch(
        `/api/cooperative/transactions/${encodeURIComponent(transactionId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete" }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to complete");
      toast.success("Transaction marked as completed");
      await refresh(selectedEntId);
    } catch (e) {
      toast.error("Could not complete transaction", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setCompletingId(null);
    }
  }

  if (enterprises.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <EmptyState
          icon={Network}
          title="No enterprises yet"
          description="Join or found an enterprise to participate in the cooperative B2B network."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-200/40 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-300/60 bg-indigo-100">
            <Network className="h-5 w-5 text-indigo-700" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-indigo-700">
              REC-4 · Cooperative Network
            </p>
            <h1 className="mt-1.5 font-serif text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
              Constitutional B2B exchange
            </h1>
            <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-slate-600">
              B2B transactions between Aurienta enterprises are CRE-validated
              (10% capital cap, anti-self-dealing), ledger-anchored, and
              tamper-evident. Zero custody — settlement via regulated banks.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Enterprise selector + stats */}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Card className="border-indigo-200 bg-white">
          <CardHeader className="border-b border-indigo-100 pb-3">
            <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
              <Building2 className="h-4 w-4 text-indigo-600" /> Active enterprise
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Select value={selectedEntId} onValueChange={setSelectedEntId}>
              <SelectTrigger className="border-slate-300 bg-white">
                <SelectValue placeholder="Select an enterprise" />
              </SelectTrigger>
              <SelectContent>
                {enterprises.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="font-sans">{e.name}</span>
                    <span className="ml-2 font-mono text-[11px] text-slate-500">
                      T{e.tier} · {e.sector}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
          <StatCard
            icon={<Users className="h-4 w-4 text-indigo-600" />}
            label="Partners"
            value={stats.totalPartners.toString()}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4 text-indigo-600" />}
            label="Volume"
            value={egp(stats.totalVolume, { compact: true })}
          />
          <StatCard
            icon={<Activity className="h-4 w-4 text-indigo-600" />}
            label="Active"
            value={stats.activeTransactions.toString()}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* New transaction form */}
        <Card className="border-indigo-200 bg-white">
          <CardHeader className="border-b border-indigo-100">
            <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
              <ArrowRight className="h-4 w-4 text-indigo-600" /> New B2B Transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div>
              <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                Buyer enterprise
              </Label>
              <Select
                value={form.buyerEnterpriseId}
                onValueChange={(v) => setForm({ ...form, buyerEnterpriseId: v })}
              >
                <SelectTrigger className="mt-1.5 border-slate-300 bg-white">
                  <SelectValue placeholder="Select buyer" />
                </SelectTrigger>
                <SelectContent>
                  {enterprises.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} (T{e.tier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                Seller enterprise
              </Label>
              <Select
                value={form.sellerEnterpriseId}
                onValueChange={(v) => setForm({ ...form, sellerEnterpriseId: v })}
              >
                <SelectTrigger className="mt-1.5 border-slate-300 bg-white">
                  <SelectValue placeholder="Select seller" />
                </SelectTrigger>
                <SelectContent>
                  {enterprises
                    .filter((e) => e.id !== form.buyerEnterpriseId)
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} (T{e.tier})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                Description
              </Label>
              <Input
                className="mt-1.5 border-slate-300 bg-white"
                placeholder="e.g. Q1 raw materials supply"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={500}
              />
            </div>
            <div>
              <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                Amount (EGP)
              </Label>
              <Input
                className="mt-1.5 border-slate-300 bg-white"
                type="number"
                min={1}
                placeholder="e.g. 50000"
                value={form.amountEgp}
                onChange={(e) => setForm({ ...form, amountEgp: e.target.value })}
              />
              <p className="mt-1 font-sans text-[11px] text-slate-500">
                CRE caps each transaction at 10% of the buyer's working capital.
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.sellerEnterpriseId}
              className="w-full bg-purple-600 text-white hover:bg-purple-700"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              {submitting ? "Creating…" : "Create transaction"}
            </Button>
          </CardContent>
        </Card>

        {/* Transaction list */}
        <Card className="border-indigo-200 bg-white">
          <CardHeader className="border-b border-indigo-100">
            <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
              <Activity className="h-4 w-4 text-indigo-600" /> Transactions
              <span className="ml-auto font-mono text-[11px] font-normal text-slate-500">
                {transactions.length} {refreshing ? "· loading…" : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {transactions.length === 0 ? (
              <EmptyState
                icon={Network}
                title="No transactions yet"
                description="B2B transactions between this enterprise and other Aurienta enterprises will appear here."
              />
            ) : (
              <div className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
                {transactions.map((t) => {
                  const status = STATUS_META[t.status] ?? STATUS_META.pending;
                  const isCounterparty = t.buyerEnterpriseId === selectedEntId;
                  return (
                    <div key={t.id} className="py-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={status.cls}>
                              <span className={`mr-1 h-1.5 w-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </Badge>
                            <span className="font-sans text-xs text-slate-500">
                              {isCounterparty ? "→ " : "← "}
                              {isCounterparty ? t.sellerName : t.buyerName}
                            </span>
                          </div>
                          <p className="mt-1 truncate font-sans text-sm text-slate-800">
                            {t.description}
                          </p>
                          <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-900">
                              {egp(t.amountEgp)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {timeAgo(new Date(t.createdAt))}
                            </span>
                          </div>
                        </div>
                        {t.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleComplete(t.id)}
                            disabled={completingId === t.id}
                            className="h-7 border-indigo-300 bg-white px-2 text-[11px] text-indigo-700 hover:bg-indigo-50"
                          >
                            {completingId === t.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                            )}
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-white p-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-sans text-[10px] uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <p className="mt-1 font-serif text-lg font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}
