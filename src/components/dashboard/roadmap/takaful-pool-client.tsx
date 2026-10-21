"use client";

/**
 * TakafulPoolClient — REC-1 Constitutional Takaful Pool dashboard.
 *
 * Renders:
 *   - Pool header stats (vault balance, total / active / paid claims, paid out).
 *   - Submit-claim form (type, description, amount, optional evidence CID).
 *   - Claims list with status badges + approve / pay actions (RBAC-gated on the
 *     server; here we only show buttons the user is likely permitted to call).
 *
 * Theme: indigo. Uses csrfFetch for every state-changing call.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Shield,
  ShieldCheck,
  Loader2,
  ChevronRight,
  Vault,
  Activity,
  CheckCircle2,
  Banknote,
  AlertCircle,
  Info,
} from "lucide-react";

import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type Claim = {
  id: string;
  enterpriseId: string;
  claimantId: string;
  claimType: string;
  description: string;
  evidenceCid: string | null;
  amountRequested: number;
  amountApproved: number;
  status: string;
  creDecisionToken: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
};

type Stats = {
  vaultBalanceEgp: number;
  totalClaims: number;
  activeClaims: number;
  paidClaims: number;
  totalPaidOutEgp: number;
};

type Props = {
  claims: Claim[];
  enterprises: Enterprise[];
  statsByEnterprise: Record<string, Stats>;
  canApprove: boolean; // AURIENTA Rep / board_member
  canPay: boolean; // law_firm_rep / AURIENTA Rep
};

// ── Status meta ──

const STATUS_META: Record<string, { label: string; cls: string }> = {
  submitted: {
    label: "Submitted",
    cls: "text-indigo-700 border-indigo-500/40 bg-indigo-50",
  },
  cre_verified: {
    label: "CRE Verified",
    cls: "text-violet-700 border-violet-500/40 bg-violet-50",
  },
  voting: {
    label: "Voting",
    cls: "text-amber-700 border-amber-500/40 bg-amber-50",
  },
  approved: {
    label: "Approved",
    cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50",
  },
  rejected: {
    label: "Rejected",
    cls: "text-rose-700 border-rose-500/40 bg-rose-50",
  },
  paid: {
    label: "Paid",
    cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50",
  },
};

const CLAIM_TYPE_LABELS: Record<string, string> = {
  milestone_failure: "Milestone Failure",
  supply_disruption: "Supply Disruption",
  force_majeure: "Force Majeure",
  key_person_loss: "Key Person Loss",
};

// ── Component ──

export function TakafulPoolClient({
  claims: initialClaims,
  enterprises,
  statsByEnterprise,
  canApprove,
  canPay,
}: Props) {
  const router = useRouter();
  const [claims, setClaims] = React.useState<Claim[]>(initialClaims);
  const [submitting, setSubmitting] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);
  const [verdictError, setVerdictError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    enterpriseId: enterprises[0]?.id ?? "",
    claimType: "milestone_failure" as
      | "milestone_failure"
      | "supply_disruption"
      | "force_majeure"
      | "key_person_loss",
    description: "",
    amountRequested: "",
    evidenceCid: "",
  });

  const activeEnt = form.enterpriseId;
  const stats = activeEnt ? statsByEnterprise[activeEnt] : undefined;

  // ── Submit handler ──

  async function handleSubmit() {
    setVerdictError(null);
    if (!form.enterpriseId) {
      setVerdictError("Select an enterprise first.");
      return;
    }
    const amount = Number.parseInt(form.amountRequested, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      setVerdictError("Enter a positive integer amount (EGP).");
      return;
    }
    if (form.description.trim().length < 10) {
      setVerdictError("Description must be at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await csrfFetch("/api/takaful/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: form.enterpriseId,
          claimType: form.claimType,
          description: form.description.trim(),
          amountRequested: amount,
          evidenceCid: form.evidenceCid.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const reason = data?.error ?? "Claim denied by CRE policy.";
        setVerdictError(reason);
        toast.error("Takaful claim denied", { description: reason });
        return;
      }
      toast.success("Claim submitted", {
        description: `Claim ${data.claim?.id?.slice(0, 8) ?? ""} filed.`,
      });
      setClaims((prev) => [data.claim, ...prev]);
      setForm((f) => ({
        ...f,
        description: "",
        amountRequested: "",
        evidenceCid: "",
      }));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setVerdictError(msg);
      toast.error("Could not submit claim", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Approve / Pay handlers ──

  async function handleApprove(claimId: string, amountRequested: number) {
    const input = window.prompt(
      `Approve this claim for how much (EGP)? Requested: ${amountRequested.toLocaleString()}`,
      String(amountRequested)
    );
    if (input === null) return;
    const amountApproved = Number.parseInt(input, 10);
    if (!Number.isFinite(amountApproved) || amountApproved <= 0) {
      toast.error("Invalid amount");
      return;
    }
    if (amountApproved > amountRequested) {
      toast.error("Approved amount cannot exceed requested amount.");
      return;
    }

    setActingId(claimId);
    try {
      const res = await csrfFetch(`/api/takaful/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", amountApproved }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Approve failed", {
          description: data?.error ?? "CRE / RBAC denied.",
        });
        return;
      }
      toast.success("Claim approved", {
        description: `Approved for ${egp(amountApproved)}.`,
      });
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? data.claim : c))
      );
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not approve", { description: msg });
    } finally {
      setActingId(null);
    }
  }

  async function handlePay(claimId: string) {
    setActingId(claimId);
    try {
      const res = await csrfFetch(`/api/takaful/claims/${claimId}`, {
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
      toast.success("Claim paid", {
        description: "Law firm disbursed the claim (Zero Custody).",
      });
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? data.claim : c))
      );
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not pay", { description: msg });
    } finally {
      setActingId(null);
    }
  }

  // ── Render ──

  return (
    <div className="light">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-1 py-2">
        {/* ── Header ── */}
        <header className="rounded-2xl border border-indigo-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div className="flex items-center gap-2.5">
            <Shield className="h-5 w-5 text-indigo-600" />
            <span className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-indigo-700/80">
              REC-1 · Constitutional Takaful
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-indigo-950 sm:text-4xl">
            Takaful Pool
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-sm text-indigo-950/70">
            Cooperative risk pool backed by the enterprise Law Firm Client
            Account. Claims are CRE-verified, board-approved, and disbursed
            by the law firm — Zero Custody, no AURIENTA-held funds.
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
                Max payout = min(30% of vault balance, 500,000 EGP). Valid
                claim types: milestone_failure, supply_disruption,
                force_majeure, key_person_loss. Disbursement flows through
                the Law Firm Client Account (Amendment IX).
              </p>
            </div>
          </div>
        </div>

        {/* ── Pool stats ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Vault className="h-4 w-4 text-indigo-600" />}
            label="Vault Balance"
            value={egp(stats?.vaultBalanceEgp ?? 0, { compact: true })}
            hint="Law Firm Client Account"
          />
          <StatCard
            icon={<Activity className="h-4 w-4 text-indigo-600" />}
            label="Active Claims"
            value={String(stats?.activeClaims ?? 0)}
            hint={`${stats?.totalClaims ?? 0} total`}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-indigo-600" />}
            label="Paid Claims"
            value={String(stats?.paidClaims ?? 0)}
            hint="Resolved & disbursed"
          />
          <StatCard
            icon={<Banknote className="h-4 w-4 text-indigo-600" />}
            label="Paid Out"
            value={egp(stats?.totalPaidOutEgp ?? 0, { compact: true })}
            hint="Lifetime disbursements"
          />
        </div>

        {/* ── Submit-claim form ── */}
        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-indigo-600" />
            <h2 className="font-serif text-lg font-semibold text-indigo-950">
              Submit a Claim
            </h2>
          </div>

          {enterprises.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-indigo-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="font-sans text-xs">
                You are not a member of any enterprise. Join or found an
                enterprise to file a takaful claim.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
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
                  Claim Type
                </Label>
                <Select
                  value={form.claimType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, claimType: v as typeof f.claimType }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CLAIM_TYPE_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                  Amount Requested (EGP)
                </Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  min={1}
                  max={500000}
                  step={1}
                  placeholder="e.g. 25000"
                  value={form.amountRequested}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amountRequested: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                  Evidence CID (optional)
                </Label>
                <Input
                  className="mt-1.5"
                  placeholder="ipfs://…"
                  value={form.evidenceCid}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, evidenceCid: e.target.value }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                  Description
                </Label>
                <Textarea
                  className="mt-1.5 min-h-[96px]"
                  placeholder="Describe the loss event, supporting evidence, and impact on the enterprise."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              {verdictError && (
                <div className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-rose-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="font-sans text-xs">{verdictError}</p>
                </div>
              )}

              <div className="sm:col-span-2 flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  Submit Claim
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Claims list ── */}
        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-indigo-600" />
              <h2 className="font-serif text-lg font-semibold text-indigo-950">
                Claims
              </h2>
            </div>
            <Badge
              variant="outline"
              className="border-indigo-500/40 bg-indigo-50 text-indigo-700"
            >
              {claims.length} visible
            </Badge>
          </div>

          {claims.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No Takaful Claims Yet"
              description="Submit a claim above to draw on the constitutional risk pool when a milestone fails, supply is disrupted, or a key person is lost."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Requested</TableHead>
                    <TableHead className="text-right">Approved</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Filed</TableHead>
                    {(canApprove || canPay) && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((c) => {
                    const meta = STATUS_META[c.status] ?? {
                      label: c.status,
                      cls: "text-slate-700 border-slate-400/40 bg-slate-50",
                    };
                    const canApproveRow =
                      canApprove && c.status === "submitted";
                    const canPayRow = canPay && c.status === "cre_verified";
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-sans text-sm font-medium text-indigo-950">
                            {CLAIM_TYPE_LABELS[c.claimType] ?? c.claimType}
                          </div>
                          <div className="mt-0.5 max-w-[28ch] truncate font-mono text-[11px] text-slate-500">
                            {c.description}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {egp(c.amountRequested, { compact: true })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {c.amountApproved > 0
                            ? egp(c.amountApproved, { compact: true })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={meta.cls}
                          >
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-sans text-xs text-slate-500">
                          {timeAgo(new Date(c.createdAt))}
                        </TableCell>
                        {(canApprove || canPay) && (
                          <TableCell className="text-right">
                            {(canApproveRow || canPayRow) ? (
                              <div className="flex justify-end gap-2">
                                {canApproveRow && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-indigo-500/40 text-indigo-700 hover:bg-indigo-50"
                                    disabled={actingId === c.id}
                                    onClick={() =>
                                      handleApprove(c.id, c.amountRequested)
                                    }
                                  >
                                    {actingId === c.id ? (
                                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                    ) : (
                                      <ShieldCheck className="mr-1.5 h-3 w-3" />
                                    )}
                                    Approve
                                  </Button>
                                )}
                                {canPayRow && (
                                  <Button
                                    size="sm"
                                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                                    disabled={actingId === c.id}
                                    onClick={() => handlePay(c.id)}
                                  >
                                    {actingId === c.id ? (
                                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                    ) : (
                                      <Banknote className="mr-1.5 h-3 w-3" />
                                    )}
                                    Pay
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

// ── Stat card sub-component ──

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
