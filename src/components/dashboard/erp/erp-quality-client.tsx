"use client";

/**
 * ErpQualityClient — Quality check list + stats + record result dialog.
 *
 * Lists: type, description, status, pass rate, defects.
 * Stats: overall pass rate, by type.
 * "New Check" dialog + "Record Result" dialog (calls enforceQualityCheck CRE).
 *
 * Theme: indigo. csrfFetch for every state-changing call.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  Plus,
  X,
  ShieldCheck,
  ClipboardCheck,
  TrendingUp,
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
import { timeAgo } from "@/lib/aurienta/format";
import { EmptyState } from "@/components/dashboard/ux/empty-state";

type Check = {
  id: string;
  enterpriseId: string;
  productionOrderId: string | null;
  projectId: string | null;
  inventoryId: string | null;
  checkType: string;
  description: string;
  inspectorId: string | null;
  status: string;
  defectsFound: number;
  passRate: number;
  notes: string | null;
  checkedAt: string | null;
  createdAt: string;
};

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
};

type Stats = {
  totalChecks: number;
  passed: number;
  failed: number;
  overallPassRate: number;
  byType: Record<string, { total: number; passed: number; passRate: number }>;
};

type Props = {
  checks: Check[];
  enterprises: Enterprise[];
  statsByEnterprise: Record<string, Stats>;
  canRecord: boolean;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "text-slate-700 border-slate-400/40 bg-slate-50" },
  passed: { label: "Passed", cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50" },
  failed: { label: "Failed", cls: "text-rose-700 border-rose-500/40 bg-rose-50" },
  rework: { label: "Rework", cls: "text-amber-700 border-amber-500/40 bg-amber-50" },
};

const TYPE_LABELS: Record<string, string> = {
  incoming: "Incoming",
  in_process: "In-Process",
  final: "Final",
  audit: "Audit",
};

export function ErpQualityClient({
  checks: initialChecks,
  enterprises,
  statsByEnterprise,
  canRecord,
}: Props) {
  const router = useRouter();
  const [checks, setChecks] = React.useState<Check[]>(initialChecks);
  const [activeEntId, setActiveEntId] = React.useState(enterprises[0]?.id ?? "");
  const [showNew, setShowNew] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [recordDialog, setRecordDialog] = React.useState<Check | null>(null);
  const [actingId, setActingId] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    checkType: "incoming" as "incoming" | "in_process" | "final" | "audit",
    description: "",
    productionOrderId: "",
    inventoryId: "",
  });

  const [resultForm, setResultForm] = React.useState({
    passRate: "",
    defects: "0",
    notes: "",
  });

  const stats = activeEntId ? statsByEnterprise[activeEntId] : undefined;
  const filtered = activeEntId
    ? checks.filter((c) => c.enterpriseId === activeEntId)
    : checks;

  async function handleCreate() {
    if (!activeEntId) {
      toast.error("Select an enterprise first.");
      return;
    }
    if (form.description.trim().length < 2) {
      toast.error("Description must be at least 2 characters.");
      return;
    }
    setCreating(true);
    try {
      const res = await csrfFetch("/api/erp/quality-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: activeEntId,
          checkType: form.checkType,
          description: form.description.trim(),
          productionOrderId: form.productionOrderId.trim() || undefined,
          inventoryId: form.inventoryId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Create failed", { description: data?.error });
        return;
      }
      toast.success("Quality check created", { description: data.check?.id?.slice(0, 8) });
      setChecks((prev) => [data.check, ...prev]);
      setForm({ checkType: "incoming", description: "", productionOrderId: "", inventoryId: "" });
      setShowNew(false);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not create check", { description: msg });
    } finally {
      setCreating(false);
    }
  }

  async function handleRecord() {
    if (!recordDialog) return;
    const passRate = Number.parseFloat(resultForm.passRate);
    if (!Number.isFinite(passRate) || passRate < 0 || passRate > 100) {
      toast.error("Pass rate must be between 0 and 100.");
      return;
    }
    const defects = Number.parseInt(resultForm.defects, 10) || 0;
    setActingId(recordDialog.id);
    try {
      const res = await csrfFetch(`/api/erp/quality-checks/${recordDialog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passRate,
          defects,
          notes: resultForm.notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Record failed", { description: data?.error ?? "CRE / RBAC denied." });
        return;
      }
      toast.success(`Quality check ${data.verdict?.allowed ? "passed" : "failed"}`, {
        description: data.verdict?.reason ?? `Pass rate ${passRate}%`,
      });
      setChecks((prev) => prev.map((c) => (c.id === recordDialog.id ? data.check : c)));
      setRecordDialog(null);
      setResultForm({ passRate: "", defects: "0", notes: "" });
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not record result", { description: msg });
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="light">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-1 py-2">
        <header className="rounded-2xl border border-indigo-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                <span className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-indigo-700/80">
                  ERP · Quality Control
                </span>
              </div>
              <h1 className="mt-3 font-serif text-3xl font-semibold text-indigo-950 sm:text-4xl">
                Quality Checks
              </h1>
              <p className="mt-2 max-w-2xl font-sans text-sm text-indigo-950/70">
                CRE-enforced quality gate. Pass rate must meet the
                constitutional minimum (90%) before a check is marked as
                &quot;passed&quot; — otherwise the CRE denies and status becomes
                &quot;failed&quot;.
              </p>
            </div>
            <Button
              onClick={() => setShowNew(true)}
              disabled={!activeEntId}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" /> New Check
            </Button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Checks" value={String(stats?.totalChecks ?? 0)} />
          <StatCard label="Passed" value={String(stats?.passed ?? 0)} hint="CRE-verified" />
          <StatCard label="Failed" value={String(stats?.failed ?? 0)} alert={(stats?.failed ?? 0) > 0} />
          <StatCard label="Overall Pass Rate" value={`${stats?.overallPassRate ?? 0}%`} />
        </div>

        {/* Enterprise + by-type stats */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
            <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
              Enterprise
            </Label>
            <Select value={activeEntId} onValueChange={setActiveEntId}>
              <SelectTrigger className="mt-1.5 w-full">
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
          <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <h2 className="font-serif text-sm font-semibold text-indigo-950">
                Pass Rate by Type
              </h2>
            </div>
            {stats && Object.keys(stats.byType).length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {Object.entries(stats.byType).map(([type, t]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="font-sans text-xs text-slate-700">
                      {TYPE_LABELS[type] ?? type}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500">
                        {t.passed}/{t.total}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          t.passRate >= 90
                            ? "border-emerald-500/40 bg-emerald-50 text-emerald-700"
                            : "border-rose-500/40 bg-rose-50 text-rose-700"
                        }
                      >
                        {t.passRate}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-sans text-xs text-slate-400">
                No completed checks yet.
              </p>
            )}
          </div>
        </div>

        {/* Checks list */}
        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          {filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No Quality Checks"
              description="Create a new quality check to start tracking pass rates and defects."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Pass Rate</TableHead>
                    <TableHead className="text-right">Defects</TableHead>
                    <TableHead>Checked</TableHead>
                    {canRecord && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const meta = STATUS_META[c.status] ?? STATUS_META.pending;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-sans text-xs font-semibold text-indigo-700">
                          {TYPE_LABELS[c.checkType] ?? c.checkType}
                        </TableCell>
                        <TableCell className="font-sans text-xs text-indigo-950">
                          {c.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={meta.cls}>
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {c.passRate > 0 ? `${c.passRate}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {c.defectsFound > 0 ? c.defectsFound : "—"}
                        </TableCell>
                        <TableCell className="font-sans text-xs text-slate-500">
                          {c.checkedAt ? timeAgo(new Date(c.checkedAt)) : "—"}
                        </TableCell>
                        {canRecord && (
                          <TableCell className="text-right">
                            {c.status === "pending" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-indigo-500/40 text-indigo-700 hover:bg-indigo-50"
                                disabled={actingId === c.id}
                                onClick={() => {
                                  setRecordDialog(c);
                                  setResultForm({ passRate: "", defects: "0", notes: "" });
                                }}
                              >
                                Record Result
                              </Button>
                            ) : (
                              <span className="font-sans text-xs text-slate-400">—</span>
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

        {/* New check dialog */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-indigo-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  <h2 className="font-serif text-lg font-semibold text-indigo-950">
                    New Quality Check
                  </h2>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4">
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Check Type
                  </Label>
                  <Select
                    value={form.checkType}
                    onValueChange={(v) => setForm((f) => ({ ...f, checkType: v as typeof f.checkType }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incoming">Incoming</SelectItem>
                      <SelectItem value="in_process">In-Process</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                      <SelectItem value="audit">Audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Description
                  </Label>
                  <Textarea
                    className="mt-1.5 min-h-[80px]"
                    placeholder="What is being inspected?"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Production Order ID (optional)
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="cuid…"
                    value={form.productionOrderId}
                    onChange={(e) => setForm((f) => ({ ...f, productionOrderId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Inventory Item ID (optional)
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="cuid…"
                    value={form.inventoryId}
                    onChange={(e) => setForm((f) => ({ ...f, inventoryId: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNew(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {creating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                    )}
                    Create Check
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Record result dialog */}
        {recordDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-indigo-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  <h2 className="font-serif text-lg font-semibold text-indigo-950">
                    Record Quality Result
                  </h2>
                </div>
                <Button size="sm" variant="outline" onClick={() => setRecordDialog(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="mb-4 font-sans text-xs text-slate-600">
                {recordDialog.description}
              </p>
              <div className="grid gap-4">
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Pass Rate (%)
                  </Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    placeholder="e.g. 95"
                    value={resultForm.passRate}
                    onChange={(e) => setResultForm((f) => ({ ...f, passRate: e.target.value }))}
                  />
                  <p className="mt-1 font-mono text-[10px] text-slate-500">
                    Minimum 90% required by CRE policy.
                  </p>
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Defects Found
                  </Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    min={0}
                    step={1}
                    value={resultForm.defects}
                    onChange={(e) => setResultForm((f) => ({ ...f, defects: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Notes
                  </Label>
                  <Textarea
                    className="mt-1.5 min-h-[60px]"
                    placeholder="Inspector observations, root cause, follow-up actions…"
                    value={resultForm.notes}
                    onChange={(e) => setResultForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRecordDialog(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRecord}
                    disabled={actingId === recordDialog.id}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {actingId === recordDialog.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Record Result
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, alert }: { label: string; value: string; hint?: string; alert?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${alert ? "border-rose-300 bg-rose-50" : "border-indigo-200/70 bg-white"}`}>
      <p className="font-sans text-xs uppercase tracking-wider text-indigo-900/70">{label}</p>
      <p className={`mt-2 font-serif text-2xl font-semibold ${alert ? "text-rose-700" : "text-indigo-950"}`}>
        {value}
      </p>
      {hint && (
        <p className="mt-1 font-mono text-[10px] text-indigo-900/60">{hint}</p>
      )}
    </div>
  );
}
