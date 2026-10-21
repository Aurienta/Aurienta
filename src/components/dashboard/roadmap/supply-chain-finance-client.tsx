"use client";

/**
 * SupplyChainFinanceClient — REC-3 Constitutional Supply Chain Finance.
 *
 * Renders:
 *   - Portfolio stats (total advances, active / repaid, total funded, outstanding).
 *   - Request-advance form (enterprise select, optional milestone select,
 *     advance amount, constitutional rate, term days).
 *   - Advances list with status badges + fund / repay actions.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Truck,
  ShieldCheck,
  Loader2,
  ChevronRight,
  Banknote,
  Activity,
  CheckCircle2,
  AlertCircle,
  Info,
  Wallet,
  Receipt,
} from "lucide-react";

import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { egp, timeAgo } from "@/lib/aurienta/format";
import { EmptyState } from "@/components/dashboard/ux/empty-state";

// ── Types ──

type Advance = {
  id: string;
  enterpriseId: string;
  partnerId: string;
  milestoneId: string | null;
  advanceAmountEgp: number;
  constitutionalRate: number;
  termDays: number;
  status: string;
  creDecisionToken: string | null;
  fundedAt: string | null;
  repaidAt: string | null;
  createdAt: string;
};

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
};

type Milestone = {
  id: string;
  enterpriseId: string;
  title: string;
  amountEgp: number;
};

type Stats = {
  totalAdvances: number;
  activeAdvances: number;
  repaidAdvances: number;
  totalFundedEgp: number;
  totalOutstandingEgp: number;
};

type Props = {
  advances: Advance[];
  enterprises: Enterprise[];
  milestones: Milestone[];
  statsByEnterprise: Record<string, Stats>;
  canFund: boolean; // capital partner / Rep
  canRepay: boolean; // operator / Rep
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "Pending",
    cls: "text-indigo-700 border-indigo-500/40 bg-indigo-50",
  },
  cre_approved: {
    label: "CRE Approved",
    cls: "text-violet-700 border-violet-500/40 bg-violet-50",
  },
  funded: {
    label: "Funded",
    cls: "text-amber-700 border-amber-500/40 bg-amber-50",
  },
  repaid: {
    label: "Repaid",
    cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50",
  },
  defaulted: {
    label: "Defaulted / Denied",
    cls: "text-rose-700 border-rose-500/40 bg-rose-50",
  },
};

export function SupplyChainFinanceClient({
  advances: initialAdvances,
  enterprises,
  milestones,
  statsByEnterprise,
  canFund,
  canRepay,
}: Props) {
  const router = useRouter();
  const [advances, setAdvances] = React.useState<Advance[]>(initialAdvances);
  const [submitting, setSubmitting] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);
  const [verdictError, setVerdictError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    enterpriseId: enterprises[0]?.id ?? "",
    milestoneId: "",
    advanceAmountEgp: "",
    constitutionalRate: "5",
    termDays: "30",
  });

  const activeEnt = form.enterpriseId;
  const stats = activeEnt ? statsByEnterprise[activeEnt] : undefined;
  const entMilestones = milestones.filter(
    (m) => m.enterpriseId === activeEnt
  );

  // ── Submit handler ──

  async function handleSubmit() {
    setVerdictError(null);
    if (!form.enterpriseId) {
      setVerdictError("Select an enterprise first.");
      return;
    }
    const amount = Number.parseInt(form.advanceAmountEgp, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      setVerdictError("Enter a positive integer amount (EGP).");
      return;
    }
    const rate = Number.parseFloat(form.constitutionalRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 8) {
      setVerdictError("Constitutional rate must be between 0 and 8% APR.");
      return;
    }
    const term = Number.parseInt(form.termDays, 10);
    if (!Number.isFinite(term) || term < 1 || term > 365) {
      setVerdictError("Term must be between 1 and 365 days.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/supply-chain/advances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: form.enterpriseId,
          milestoneId: form.milestoneId || undefined,
          advanceAmountEgp: amount,
          constitutionalRate: rate,
          termDays: term,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const reason = data?.error ?? "Advance denied by CRE policy.";
        setVerdictError(reason);
        toast.error("Advance denied", { description: reason });
        return;
      }
      toast.success("Advance requested", {
        description: `Advance ${data.advance?.id?.slice(0, 8) ?? ""} filed.`,
      });
      setAdvances((prev) => [data.advance, ...prev]);
      setForm((f) => ({ ...f, advanceAmountEgp: "" }));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setVerdictError(msg);
      toast.error("Could not request advance", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Fund / Repay handlers ──

  async function handleFund(advanceId: string) {
    setActingId(advanceId);
    try {
      const res = await csrfFetch(`/api/supply-chain/advances/${advanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fund" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Fund failed", {
          description: data?.error ?? "CRE / RBAC denied.",
        });
        return;
      }
      toast.success("Advance funded", {
        description: "Principal wired through the law firm escrow.",
      });
      setAdvances((prev) =>
        prev.map((a) => (a.id === advanceId ? data.advance : a))
      );
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not fund", { description: msg });
    } finally {
      setActingId(null);
    }
  }

  async function handleRepay(advanceId: string) {
    setActingId(advanceId);
    try {
      const res = await csrfFetch(`/api/supply-chain/advances/${advanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "repay" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Repay failed", {
          description: data?.error ?? "CRE / RBAC denied.",
        });
        return;
      }
      toast.success("Advance repaid", {
        description: "Principal + interest returned through escrow.",
      });
      setAdvances((prev) =>
        prev.map((a) => (a.id === advanceId ? data.advance : a))
      );
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not repay", { description: msg });
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="light">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-1 py-2">
        {/* ── Header ── */}
        <header className="rounded-2xl border border-indigo-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div className="flex items-center gap-2.5">
            <Truck className="h-5 w-5 text-indigo-600" />
            <span className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-indigo-700/80">
              REC-3 · Constitutional Supply Chain Finance
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-indigo-950 sm:text-4xl">
            Supply Chain Finance
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-sm text-indigo-950/70">
            Milestone-backed working-capital advances with a constitutional
            usury cap of 8% APR. Principal flows through the Law Firm
            Client Account — Zero Custody.
          </p>
        </header>

        {/* ── Compliance banner ── */}
        <div className="rounded-xl border border-indigo-300/60 bg-indigo-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
            <div className="flex-1">
              <p className="font-sans text-sm font-semibold text-indigo-900">
                Constitutional guardrails
              </p>
              <p className="mt-1 font-sans text-xs leading-relaxed text-indigo-900/80">
                Rate ≤ 8% APR (usury cap). Advance ≤ 80% of milestone value.
                Enterprise runway ≥ 3 months. Repayment: principal +
                constitutional interest through the law firm escrow.
              </p>
            </div>
          </div>
        </div>

        {/* ── Portfolio stats ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Activity className="h-4 w-4 text-indigo-600" />}
            label="Active Advances"
            value={String(stats?.activeAdvances ?? 0)}
            hint={`${stats?.totalAdvances ?? 0} total`}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-indigo-600" />}
            label="Repaid"
            value={String(stats?.repaidAdvances ?? 0)}
            hint="Closed advances"
          />
          <StatCard
            icon={<Wallet className="h-4 w-4 text-indigo-600" />}
            label="Total Funded"
            value={egp(stats?.totalFundedEgp ?? 0, { compact: true })}
            hint="Lifetime principal"
          />
          <StatCard
            icon={<Receipt className="h-4 w-4 text-indigo-600" />}
            label="Outstanding"
            value={egp(stats?.totalOutstandingEgp ?? 0, { compact: true })}
            hint="Principal still owed"
          />
        </div>

        {/* ── Request-advance form ── */}
        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-indigo-600" />
            <h2 className="font-serif text-lg font-semibold text-indigo-950">
              Request an Advance
            </h2>
          </div>

          {enterprises.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-indigo-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="font-sans text-xs">
                You are not an operator of any enterprise. Found or join an
                enterprise to request a working-capital advance.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                  Enterprise
                </Label>
                <Select
                  value={form.enterpriseId}
                  onValueChange={(v) => {
                    setForm((f) => ({ ...f, enterpriseId: v, milestoneId: "" }));
                    setVerdictError(null);
                  }}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select enterprise" />
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

              <div>
                <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                  Milestone (optional)
                </Label>
                <Select
                  value={form.milestoneId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, milestoneId: v === "__none__" ? "" : v }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select milestone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No milestone</SelectItem>
                    {entMilestones.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.title} · {egp(m.amountEgp, { compact: true })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                  Amount (EGP)
                </Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="e.g. 50000"
                  value={form.advanceAmountEgp}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, advanceAmountEgp: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                  Constitutional Rate (% APR)
                </Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  min={0}
                  max={8}
                  step={0.5}
                  value={form.constitutionalRate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, constitutionalRate: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                  Term (days)
                </Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  min={1}
                  max={365}
                  step={1}
                  value={form.termDays}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, termDays: e.target.value }))
                  }
                />
              </div>

              {verdictError && (
                <div className="lg:col-span-3 flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-rose-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="font-sans text-xs">{verdictError}</p>
                </div>
              )}

              <div className="lg:col-span-3 flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Truck className="mr-2 h-4 w-4" />
                  )}
                  Request Advance
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Advances list ── */}
        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-indigo-600" />
              <h2 className="font-serif text-lg font-semibold text-indigo-950">
                Advances
              </h2>
            </div>
            <Badge
              variant="outline"
              className="border-indigo-500/40 bg-indigo-50 text-indigo-700"
            >
              {advances.length} visible
            </Badge>
          </div>

          {advances.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No Working-Capital Advances"
              description="Request an advance above to bridge cash between milestone approval and customer payment. Principal flows through the law firm escrow (Zero Custody)."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    {(canFund || canRepay) && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advances.map((a) => {
                    const meta = STATUS_META[a.status] ?? {
                      label: a.status,
                      cls: "text-slate-700 border-slate-400/40 bg-slate-50",
                    };
                    const canFundRow = canFund && a.status === "pending";
                    const canRepayRow = canRepay && a.status === "funded";
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs">
                          {egp(a.advanceAmountEgp, { compact: true })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {a.constitutionalRate.toFixed(2)}%
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {a.termDays}d
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={meta.cls}>
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-sans text-xs text-slate-500">
                          {timeAgo(new Date(a.createdAt))}
                        </TableCell>
                        {(canFund || canRepay) && (
                          <TableCell className="text-right">
                            {canFundRow || canRepayRow ? (
                              <div className="flex justify-end gap-2">
                                {canFundRow && (
                                  <Button
                                    size="sm"
                                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                                    disabled={actingId === a.id}
                                    onClick={() => handleFund(a.id)}
                                  >
                                    {actingId === a.id ? (
                                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                    ) : (
                                      <Banknote className="mr-1.5 h-3 w-3" />
                                    )}
                                    Fund
                                  </Button>
                                )}
                                {canRepayRow && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-indigo-500/40 text-indigo-700 hover:bg-indigo-50"
                                    disabled={actingId === a.id}
                                    onClick={() => handleRepay(a.id)}
                                  >
                                    {actingId === a.id ? (
                                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="mr-1.5 h-3 w-3" />
                                    )}
                                    Repay
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="font-sans text-xs text-slate-400">
                                —
                              </span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-sans text-xs uppercase tracking-wider text-indigo-900/70">
          {label}
        </span>
      </div>
      <p className="mt-2 font-serif text-2xl font-semibold text-indigo-950">
        {value}
      </p>
      {hint && (
        <p className="mt-1 font-mono text-[11px] text-indigo-900/60">{hint}</p>
      )}
    </div>
  );
}
