"use client";

/**
 * DividendsClient — STAGE A Dividend Distribution dashboard.
 *
 * Renders:
 *   - Distribution stats (total / paid / pending distributions, paid out).
 *   - Declare-dividend form (enterprise select, total amount, per-share,
 *     partner count).
 *   - Distributions list with status badges + pay action (RBAC-gated).
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PieChart,
  ShieldCheck,
  Loader2,
  ChevronRight,
  Banknote,
  Activity,
  CheckCircle2,
  AlertCircle,
  Info,
  Wallet,
  Coins,
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

type Distribution = {
  id: string;
  enterpriseId: string;
  totalDividendEgp: number;
  perShareDividendEgp: number;
  partnerCount: number;
  status: string;
  creDecisionToken: string | null;
  declaredAt: string;
  paidAt: string | null;
  recordDate: string;
};

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
};

type Stats = {
  totalDistributions: number;
  paidDistributions: number;
  pendingDistributions: number;
  totalPaidOutEgp: number;
};

type Props = {
  distributions: Distribution[];
  enterprises: Enterprise[];
  statsByEnterprise: Record<string, Stats>;
  canDeclare: boolean; // operator / board_member / company_owner
  canPay: boolean; // law_firm_rep / aurienta_rep
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  declared: {
    label: "Declared",
    cls: "text-indigo-700 border-indigo-500/40 bg-indigo-50",
  },
  cre_approved: {
    label: "CRE Approved",
    cls: "text-violet-700 border-violet-500/40 bg-violet-50",
  },
  paid: {
    label: "Paid",
    cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50",
  },
  completed: {
    label: "Completed",
    cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50",
  },
  rejected: {
    label: "Rejected",
    cls: "text-rose-700 border-rose-500/40 bg-rose-50",
  },
};

export function DividendsClient({
  distributions: initialDistributions,
  enterprises,
  statsByEnterprise,
  canDeclare,
  canPay,
}: Props) {
  const router = useRouter();
  const [distributions, setDistributions] = React.useState<Distribution[]>(
    initialDistributions
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);
  const [verdictError, setVerdictError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    enterpriseId: enterprises[0]?.id ?? "",
    totalDividendEgp: "",
    perShareDividendEgp: "",
    partnerCount: "1",
  });

  const activeEnt = form.enterpriseId;
  const stats = activeEnt ? statsByEnterprise[activeEnt] : undefined;

  // ── Declare handler ──

  async function handleDeclare() {
    setVerdictError(null);
    if (!form.enterpriseId) {
      setVerdictError("Select an enterprise first.");
      return;
    }
    const total = Number.parseInt(form.totalDividendEgp, 10);
    if (!Number.isFinite(total) || total <= 0) {
      setVerdictError("Total dividend must be a positive integer (EGP).");
      return;
    }
    const perShare = Number.parseFloat(form.perShareDividendEgp);
    if (!Number.isFinite(perShare) || perShare < 0) {
      setVerdictError("Per-share dividend must be ≥ 0.");
      return;
    }
    const partnerCount = Number.parseInt(form.partnerCount, 10);
    if (!Number.isFinite(partnerCount) || partnerCount < 1) {
      setVerdictError("Partner count must be at least 1.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/dividends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: form.enterpriseId,
          totalDividendEgp: total,
          perShareDividendEgp: perShare,
          partnerCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const reason = data?.error ?? "Dividend denied by CRE policy.";
        setVerdictError(reason);
        toast.error("Dividend denied", { description: reason });
        return;
      }
      toast.success("Dividend declared", {
        description: `Distribution ${data.distribution?.id?.slice(0, 8) ?? ""} created.`,
      });
      setDistributions((prev) => [data.distribution, ...prev]);
      setForm((f) => ({ ...f, totalDividendEgp: "", perShareDividendEgp: "" }));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setVerdictError(msg);
      toast.error("Could not declare dividend", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Pay handler ──

  async function handlePay(distributionId: string) {
    setActingId(distributionId);
    try {
      const res = await csrfFetch(`/api/dividends/${distributionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Pay failed", {
          description: data?.error ?? "CRE / RBAC denied.",
        });
        return;
      }
      toast.success("Dividend paid", {
        description: "Law firm disbursed to capital partners (Zero Custody).",
      });
      setDistributions((prev) =>
        prev.map((d) => (d.id === distributionId ? data.distribution : d))
      );
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not pay", { description: msg });
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
            <PieChart className="h-5 w-5 text-indigo-600" />
            <span className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-indigo-700/80">
              STAGE A · Dividend Distribution
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-indigo-950 sm:text-4xl">
            Dividends
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-sm text-indigo-950/70">
            Constitutional dividend distribution from realized enterprise
            profit. Disbursed by the law firm from the Law Firm Client
            Account — Zero Custody, never AURIENTA-held.
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
                Total dividend &gt; 0. Enterprise profit &gt; 0 (no dividends
                from losses). Total ≤ 50% of profit (retain ≥ 50% for
                reinvestment). Total ≤ Law Firm Client Account balance (cash
                on hand for disbursement).
              </p>
            </div>
          </div>
        </div>

        {/* ── Distribution stats ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Activity className="h-4 w-4 text-indigo-600" />}
            label="Pending Distributions"
            value={String(stats?.pendingDistributions ?? 0)}
            hint={`${stats?.totalDistributions ?? 0} total`}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-indigo-600" />}
            label="Paid"
            value={String(stats?.paidDistributions ?? 0)}
            hint="Distributions disbursed"
          />
          <StatCard
            icon={<Wallet className="h-4 w-4 text-indigo-600" />}
            label="Paid Out"
            value={egp(stats?.totalPaidOutEgp ?? 0, { compact: true })}
            hint="Lifetime disbursements"
          />
          <StatCard
            icon={<Coins className="h-4 w-4 text-indigo-600" />}
            label="Enterprises"
            value={String(enterprises.length)}
            hint="You can declare for"
          />
        </div>

        {/* ── Declare form ── */}
        {canDeclare && (
          <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-indigo-600" />
              <h2 className="font-serif text-lg font-semibold text-indigo-950">
                Declare a Dividend
              </h2>
            </div>

            {enterprises.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-indigo-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="font-sans text-xs">
                  You are not an operator of any enterprise. Found or join
                  an enterprise to declare dividends.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Enterprise
                  </Label>
                  <Select
                    value={form.enterpriseId}
                    onValueChange={(v) => {
                      setForm((f) => ({ ...f, enterpriseId: v }));
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
                    Total Dividend (EGP)
                  </Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    min={1}
                    step={1}
                    placeholder="e.g. 100000"
                    value={form.totalDividendEgp}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, totalDividendEgp: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Per-Share (EGP)
                  </Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="e.g. 1.25"
                    value={form.perShareDividendEgp}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        perShareDividendEgp: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Partner Count
                  </Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    min={1}
                    step={1}
                    value={form.partnerCount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, partnerCount: e.target.value }))
                    }
                  />
                </div>

                {verdictError && (
                  <div className="lg:col-span-4 flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-rose-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="font-sans text-xs">{verdictError}</p>
                  </div>
                )}

                <div className="lg:col-span-4 flex justify-end">
                  <Button
                    onClick={handleDeclare}
                    disabled={submitting}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PieChart className="mr-2 h-4 w-4" />
                    )}
                    Declare Dividend
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Distributions list ── */}
        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-indigo-600" />
              <h2 className="font-serif text-lg font-semibold text-indigo-950">
                Distributions
              </h2>
            </div>
            <Badge
              variant="outline"
              className="border-indigo-500/40 bg-indigo-50 text-indigo-700"
            >
              {distributions.length} visible
            </Badge>
          </div>

          {distributions.length === 0 ? (
            <EmptyState
              icon={PieChart}
              title="No Dividend Distributions Yet"
              description="Declare a dividend above to distribute realized enterprise profit to your capital partners. The CRE policy enforces a 50%-of-profit cap and a Law Firm Client Account balance check."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Per-Share</TableHead>
                    <TableHead className="text-right">Partners</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Declared</TableHead>
                    {canPay && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions.map((d) => {
                    const meta = STATUS_META[d.status] ?? {
                      label: d.status,
                      cls: "text-slate-700 border-slate-400/40 bg-slate-50",
                    };
                    const canPayRow =
                      canPay &&
                      (d.status === "declared" || d.status === "cre_approved");
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="text-right font-mono text-xs">
                          {egp(d.totalDividendEgp, { compact: true })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {d.perShareDividendEgp.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {d.partnerCount}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={meta.cls}>
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-sans text-xs text-slate-500">
                          {timeAgo(new Date(d.declaredAt))}
                        </TableCell>
                        {canPay && (
                          <TableCell className="text-right">
                            {canPayRow ? (
                              <Button
                                size="sm"
                                className="bg-indigo-600 text-white hover:bg-indigo-700"
                                disabled={actingId === d.id}
                                onClick={() => handlePay(d.id)}
                              >
                                {actingId === d.id ? (
                                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                ) : (
                                  <Banknote className="mr-1.5 h-3 w-3" />
                                )}
                                Pay
                              </Button>
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
