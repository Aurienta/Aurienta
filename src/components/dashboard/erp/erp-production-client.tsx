"use client";

/**
 * ErpProductionClient — Production orders + BOM viewer.
 *
 * Lists: number, product, qty, status, progress.
 * "New Production Order" dialog.
 * "Release" button (calls enforceProductionRelease CRE policy).
 * Expandable BOM viewer per order.
 *
 * Theme: indigo. csrfFetch for every state-changing call.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Cpu,
  Loader2,
  Plus,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Rocket,
  CheckCircle2,
  Layers,
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
import { EmptyState } from "@/components/dashboard/ux/empty-state";

type Order = {
  id: string;
  enterpriseId: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  priority: string;
  completedQty: number;
  startDate: string | null;
  endDate: string | null;
};

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
};

type BomItem = {
  id: string;
  description: string;
  quantityRequired: number;
  unit: string;
  quantityIssued: number;
  costPerUnitEgp: number;
  totalCostEgp: number;
};

type Props = {
  orders: Order[];
  enterprises: Enterprise[];
  bomByOrder: Record<string, BomItem[]>;
  canManage: boolean;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  planned: { label: "Planned", cls: "text-slate-700 border-slate-400/40 bg-slate-50" },
  released: { label: "Released", cls: "text-indigo-700 border-indigo-500/40 bg-indigo-50" },
  in_progress: { label: "In Progress", cls: "text-violet-700 border-violet-500/40 bg-violet-50" },
  completed: { label: "Completed", cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50" },
  cancelled: { label: "Cancelled", cls: "text-rose-700 border-rose-500/40 bg-rose-50" },
};

const PRIORITY_META: Record<string, string> = {
  low: "text-slate-600 border-slate-400/40 bg-slate-50",
  medium: "text-indigo-700 border-indigo-500/40 bg-indigo-50",
  high: "text-amber-700 border-amber-500/40 bg-amber-50",
  critical: "text-rose-700 border-rose-500/40 bg-rose-50",
};

export function ErpProductionClient({
  orders: initialOrders,
  enterprises,
  bomByOrder,
  canManage,
}: Props) {
  const router = useRouter();
  const [orders, setOrders] = React.useState<Order[]>(initialOrders);
  const [activeEntId, setActiveEntId] = React.useState(enterprises[0]?.id ?? "");
  const [showNew, setShowNew] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    productName: "",
    quantity: "",
    unit: "piece",
    priority: "medium" as "low" | "medium" | "high" | "critical",
  });

  const filtered = activeEntId
    ? orders.filter((o) => o.enterpriseId === activeEntId)
    : orders;

  async function handleCreate() {
    if (!activeEntId) {
      toast.error("Select an enterprise first.");
      return;
    }
    if (form.productName.trim().length < 1) {
      toast.error("Product name is required.");
      return;
    }
    const qty = Number.parseFloat(form.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Quantity must be a positive number.");
      return;
    }
    setCreating(true);
    try {
      const res = await csrfFetch("/api/erp/production-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: activeEntId,
          productName: form.productName.trim(),
          quantity: qty,
          unit: form.unit,
          priority: form.priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Create failed", { description: data?.error });
        return;
      }
      toast.success("Production order created", { description: data.order?.orderNumber });
      setOrders((prev) => [data.order, ...prev]);
      setForm({ productName: "", quantity: "", unit: "piece", priority: "medium" });
      setShowNew(false);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not create order", { description: msg });
    } finally {
      setCreating(false);
    }
  }

  async function handleRelease(orderId: string) {
    setActingId(orderId);
    try {
      // Optionally pass a BOM. For now, no BOM at release time — the CRE
      // policy will reject if no BOM was added (the dialog would need to
      // support adding BOM items first). For demo: simply release.
      const res = await csrfFetch(`/api/erp/production-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Release failed", { description: data?.error ?? "CRE / RBAC denied." });
        return;
      }
      toast.success("Production order released", {
        description: data.verdict?.reason ?? "BOM verified, materials issued.",
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not release", { description: msg });
    } finally {
      setActingId(null);
    }
  }

  async function handleComplete(orderId: string) {
    const input = window.prompt("Enter completed quantity:", "");
    if (input === null) return;
    const qty = Number.parseFloat(input);
    if (!Number.isFinite(qty) || qty < 0) {
      toast.error("Invalid completed quantity.");
      return;
    }
    setActingId(orderId);
    try {
      const res = await csrfFetch(`/api/erp/production-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", completedQty: qty }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Complete failed", { description: data?.error });
        return;
      }
      toast.success("Production completed", { description: `${qty} units finished.` });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not complete", { description: msg });
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
                <Cpu className="h-5 w-5 text-indigo-600" />
                <span className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-indigo-700/80">
                  ERP · Manufacturing
                </span>
              </div>
              <h1 className="mt-3 font-serif text-3xl font-semibold text-indigo-950 sm:text-4xl">
                Production Orders
              </h1>
              <p className="mt-2 max-w-2xl font-sans text-sm text-indigo-950/70">
                CRE-enforced release gate. Verifies BOM exists and all required
                materials are in stock before issuing them to production.
                Completed goods auto-restock into inventory.
              </p>
            </div>
            <Button
              onClick={() => setShowNew(true)}
              disabled={!activeEntId}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" /> New Production Order
            </Button>
          </div>
        </header>

        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
            Enterprise
          </Label>
          <Select value={activeEntId} onValueChange={setActiveEntId}>
            <SelectTrigger className="mt-1.5 w-full sm:w-[360px]">
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
          {filtered.length === 0 ? (
            <EmptyState
              icon={Cpu}
              title="No Production Orders"
              description="Create a production order to start manufacturing finished goods."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((o) => {
                const meta = STATUS_META[o.status] ?? STATUS_META.planned;
                const bom = bomByOrder[o.id] ?? [];
                const progressPct = o.quantity > 0 ? Math.round((o.completedQty / o.quantity) * 100) : 0;
                const isExpanded = expandedId === o.id;
                const canRelease = o.status === "planned";
                const canComplete = o.status === "released" || o.status === "in_progress";
                return (
                  <div
                    key={o.id}
                    className="rounded-xl border border-indigo-200/70 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : o.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-indigo-600 hover:bg-indigo-50"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-indigo-700">
                            {o.orderNumber}
                          </span>
                          <Badge variant="outline" className={meta.cls}>
                            {meta.label}
                          </Badge>
                          <Badge variant="outline" className={PRIORITY_META[o.priority] ?? PRIORITY_META.medium}>
                            {o.priority}
                          </Badge>
                        </div>
                        <p className="mt-1 font-sans text-sm font-semibold text-indigo-950">
                          {o.productName} — {o.quantity} {o.unit}
                        </p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
                          <div
                            className="h-full bg-indigo-600"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-slate-500">
                          {progressPct}% complete ({o.completedQty}/{o.quantity} {o.unit})
                        </p>
                      </div>
                      {canManage && (
                        <div className="flex gap-1.5">
                          {canRelease && (
                            <Button
                              size="sm"
                              className="bg-indigo-600 text-white hover:bg-indigo-700"
                              disabled={actingId === o.id}
                              onClick={() => handleRelease(o.id)}
                            >
                              {actingId === o.id ? (
                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                              ) : (
                                <Rocket className="mr-1.5 h-3 w-3" />
                              )}
                              Release
                            </Button>
                          )}
                          {canComplete && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-500/40 text-emerald-700 hover:bg-emerald-50"
                              disabled={actingId === o.id}
                              onClick={() => handleComplete(o.id)}
                            >
                              {actingId === o.id ? (
                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1.5 h-3 w-3" />
                              )}
                              Complete
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="mt-3 border-t border-indigo-100 pt-3">
                        <div className="mb-2 flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-indigo-600" />
                          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-indigo-900/70">
                            Bill of Materials
                          </p>
                        </div>
                        {bom.length === 0 ? (
                          <p className="font-sans text-xs text-slate-500">
                            No BOM items. Release will be denied by CRE (BOM
                            verification gate) — add BOM items via the API
                            before releasing.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Description</TableHead>
                                  <TableHead className="text-right">Required</TableHead>
                                  <TableHead className="text-right">Issued</TableHead>
                                  <TableHead className="text-right">Unit Cost</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {bom.map((b) => (
                                  <TableRow key={b.id}>
                                    <TableCell className="font-sans text-xs text-indigo-950">
                                      {b.description}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">
                                      {b.quantityRequired} {b.unit}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs text-emerald-700">
                                      {b.quantityIssued}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">
                                      {b.costPerUnitEgp.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">
                                      {b.totalCostEgp.toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* New production order dialog */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-indigo-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  <h2 className="font-serif text-lg font-semibold text-indigo-950">
                    New Production Order
                  </h2>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4">
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Product Name
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="e.g. Steel Beam 6m"
                    value={form.productName}
                    onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Quantity
                    </Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={0.01}
                      step="0.01"
                      placeholder="e.g. 100"
                      value={form.quantity}
                      onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Unit
                    </Label>
                    <Select
                      value={form.unit}
                      onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="piece">piece</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="liter">liter</SelectItem>
                        <SelectItem value="meter">meter</SelectItem>
                        <SelectItem value="box">box</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Priority
                  </Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm((f) => ({ ...f, priority: v as typeof f.priority }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <Cpu className="mr-2 h-4 w-4" />
                    )}
                    Create Order
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
