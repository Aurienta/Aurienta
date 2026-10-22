"use client";

/**
 * ErpInventoryClient — Inventory table with stock-in/out + low-stock alerts.
 *
 * Columns: SKU, name, category, on hand, reserved, available, reorder,
 * unit value, total value.
 * Low-stock rows are highlighted red. Stock In / Stock Out buttons per row.
 * "New Item" dialog for SKU registration.
 *
 * Theme: indigo. csrfFetch for every state-changing call.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Database,
  Loader2,
  Plus,
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { egp } from "@/lib/aurienta/format";
import { EmptyState } from "@/components/dashboard/ux/empty-state";

type Item = {
  id: string;
  enterpriseId: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  costPerUnitEgp: number;
  sellPriceEgp: number;
  warehouseLocation: string | null;
};

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
};

type Status = {
  totalSkus: number;
  lowStockAlerts: Array<{ id: string; sku: string; name: string; onHand: number; reorderPoint: number }>;
  totalValueEgp: number;
  movementsToday: number;
};

type Props = {
  items: Item[];
  enterprises: Enterprise[];
  statusByEnterprise: Record<string, Status>;
};

export function ErpInventoryClient({
  items: initialItems,
  enterprises,
  statusByEnterprise,
}: Props) {
  const router = useRouter();
  const [items, setItems] = React.useState<Item[]>(initialItems);
  const [activeEntId, setActiveEntId] = React.useState(enterprises[0]?.id ?? "");
  const [showNew, setShowNew] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);
  const [moveDialog, setMoveDialog] = React.useState<{ item: Item; type: "in" | "out" } | null>(null);

  const [form, setForm] = React.useState({
    sku: "",
    name: "",
    category: "",
    unit: "piece",
    reorderPoint: "",
    costPerUnitEgp: "",
    sellPriceEgp: "",
    warehouseLocation: "",
  });

  const [moveForm, setMoveForm] = React.useState({ quantity: "", reference: "" });

  const stats = activeEntId ? statusByEnterprise[activeEntId] : undefined;
  const filtered = activeEntId
    ? items.filter((i) => i.enterpriseId === activeEntId)
    : items;

  async function handleCreate() {
    if (!activeEntId) {
      toast.error("Select an enterprise first.");
      return;
    }
    if (form.sku.trim().length < 1 || form.name.trim().length < 1 || form.category.trim().length < 1) {
      toast.error("SKU, name, and category are required.");
      return;
    }
    setCreating(true);
    try {
      const res = await csrfFetch("/api/erp/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: activeEntId,
          sku: form.sku.trim(),
          name: form.name.trim(),
          category: form.category.trim(),
          unit: form.unit,
          reorderPoint: Number.parseFloat(form.reorderPoint) || 0,
          costPerUnitEgp: Number.parseFloat(form.costPerUnitEgp) || 0,
          sellPriceEgp: Number.parseFloat(form.sellPriceEgp) || 0,
          warehouseLocation: form.warehouseLocation.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Create failed", { description: data?.error });
        return;
      }
      toast.success("Inventory item created", { description: data.item?.sku });
      setItems((prev) => [data.item, ...prev]);
      setForm({ sku: "", name: "", category: "", unit: "piece", reorderPoint: "", costPerUnitEgp: "", sellPriceEgp: "", warehouseLocation: "" });
      setShowNew(false);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not create item", { description: msg });
    } finally {
      setCreating(false);
    }
  }

  async function handleMove() {
    if (!moveDialog) return;
    const qty = Number.parseFloat(moveForm.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Quantity must be a positive number.");
      return;
    }
    if (moveForm.reference.trim().length < 1) {
      toast.error("Reference is required (e.g. PO number, sales order).");
      return;
    }
    setActingId(moveDialog.item.id);
    try {
      const res = await csrfFetch(`/api/erp/inventory/${moveDialog.item.id}/movement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: moveDialog.type,
          quantity: qty,
          reference: moveForm.reference.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(`${moveDialog.type === "in" ? "Stock In" : "Stock Out"} failed`, {
          description: data?.error ?? "CRE / RBAC denied.",
        });
        return;
      }
      toast.success(`Stock ${moveDialog.type === "in" ? "in" : "out"} recorded`);
      setItems((prev) =>
        prev.map((it) => (it.id === moveDialog.item.id ? data.item : it))
      );
      setMoveDialog(null);
      setMoveForm({ quantity: "", reference: "" });
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Movement failed", { description: msg });
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
                <Database className="h-5 w-5 text-indigo-600" />
                <span className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-indigo-700/80">
                  ERP · Inventory Management
                </span>
              </div>
              <h1 className="mt-3 font-serif text-3xl font-semibold text-indigo-950 sm:text-4xl">
                Inventory
              </h1>
              <p className="mt-2 max-w-2xl font-sans text-sm text-indigo-950/70">
                Warehouse stock with low-stock alerts, valuation, and
                CRE-enforced stock-out (blocks over-removal + large
                adjustments require manager approval).
              </p>
            </div>
            <Button
              onClick={() => setShowNew(true)}
              disabled={!activeEntId}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" /> New Item
            </Button>
          </div>
        </header>

        {/* Enterprise selector + stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total SKUs" value={String(stats?.totalSkus ?? 0)} />
          <StatCard
            label="Low-Stock Alerts"
            value={String(stats?.lowStockAlerts.length ?? 0)}
            alert={(stats?.lowStockAlerts.length ?? 0) > 0}
          />
          <StatCard label="Total Value" value={egp(stats?.totalValueEgp ?? 0, { compact: true })} />
          <StatCard label="Movements Today" value={String(stats?.movementsToday ?? 0)} />
        </div>

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

        {/* Items table */}
        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No Inventory Items"
              description="Register your first SKU to start tracking stock levels and valuations."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">On Hand</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Reorder Pt</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((it) => {
                    const low = it.reorderPoint > 0 && it.quantityOnHand <= it.reorderPoint;
                    const value = it.quantityOnHand * it.costPerUnitEgp;
                    return (
                      <TableRow key={it.id} className={low ? "bg-rose-50/50" : ""}>
                        <TableCell className="font-mono text-xs text-indigo-700">
                          {it.sku}
                        </TableCell>
                        <TableCell>
                          <div className="font-sans text-sm font-medium text-indigo-950">
                            {it.name}
                          </div>
                          {it.warehouseLocation && (
                            <div className="font-mono text-[10px] text-slate-400">
                              {it.warehouseLocation}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-sans text-xs text-slate-600">
                          {it.category}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-xs ${low ? "text-rose-700 font-bold" : "text-indigo-950"}`}>
                          {it.quantityOnHand} {it.unit}
                          {low && (
                            <AlertTriangle className="ml-1 inline h-3 w-3 text-rose-600" />
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-amber-700">
                          {it.quantityReserved}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-emerald-700">
                          {it.quantityAvailable}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-600">
                          {it.reorderPoint}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {egp(value, { compact: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-500/40 text-emerald-700 hover:bg-emerald-50"
                              disabled={actingId === it.id}
                              onClick={() => {
                                setMoveDialog({ item: it, type: "in" });
                                setMoveForm({ quantity: "", reference: "" });
                              }}
                            >
                              <ArrowDownToLine className="mr-1 h-3 w-3" /> In
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-rose-500/40 text-rose-700 hover:bg-rose-50"
                              disabled={actingId === it.id || it.quantityOnHand <= 0}
                              onClick={() => {
                                setMoveDialog({ item: it, type: "out" });
                                setMoveForm({ quantity: "", reference: "" });
                              }}
                            >
                              <ArrowUpFromLine className="mr-1 h-3 w-3" /> Out
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* New item dialog */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-indigo-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  <h2 className="font-serif text-lg font-semibold text-indigo-950">
                    New Inventory Item
                  </h2>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      SKU
                    </Label>
                    <Input
                      className="mt-1.5"
                      placeholder="e.g. STEEL-ROD-12"
                      value={form.sku}
                      onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Category
                    </Label>
                    <Input
                      className="mt-1.5"
                      placeholder="e.g. raw_material"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Name
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="e.g. Steel Rod 12mm"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Reorder Point
                    </Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={0}
                      placeholder="e.g. 50"
                      value={form.reorderPoint}
                      onChange={(e) => setForm((f) => ({ ...f, reorderPoint: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Cost / Unit (EGP)
                    </Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="e.g. 25"
                      value={form.costPerUnitEgp}
                      onChange={(e) => setForm((f) => ({ ...f, costPerUnitEgp: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Sell Price (EGP)
                    </Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="e.g. 35"
                      value={form.sellPriceEgp}
                      onChange={(e) => setForm((f) => ({ ...f, sellPriceEgp: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Warehouse Location (optional)
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="e.g. Aisle A-3"
                    value={form.warehouseLocation}
                    onChange={(e) => setForm((f) => ({ ...f, warehouseLocation: e.target.value }))}
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
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Create Item
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Movement dialog */}
        {moveDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-indigo-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-indigo-950">
                  Stock {moveDialog.type === "in" ? "In" : "Out"} — {moveDialog.item.sku}
                </h2>
                <Button size="sm" variant="outline" onClick={() => setMoveDialog(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3">
                <p className="font-sans text-xs text-slate-600">
                  {moveDialog.item.name} — on hand: {moveDialog.item.quantityOnHand} {moveDialog.item.unit}
                </p>
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
                    value={moveForm.quantity}
                    onChange={(e) => setMoveForm((f) => ({ ...f, quantity: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Reference
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder={moveDialog.type === "in" ? "e.g. PO-2026-001" : "e.g. SO-2026-005"}
                    value={moveForm.reference}
                    onChange={(e) => setMoveForm((f) => ({ ...f, reference: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setMoveDialog(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleMove}
                    disabled={actingId === moveDialog.item.id}
                    className={
                      moveDialog.type === "in"
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-rose-600 text-white hover:bg-rose-700"
                    }
                  >
                    {actingId === moveDialog.item.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : moveDialog.type === "in" ? (
                      <ArrowDownToLine className="mr-2 h-4 w-4" />
                    ) : (
                      <ArrowUpFromLine className="mr-2 h-4 w-4" />
                    )}
                    Confirm
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

function StatCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${alert ? "border-rose-300 bg-rose-50" : "border-indigo-200/70 bg-white"}`}>
      <p className="font-sans text-xs uppercase tracking-wider text-indigo-900/70">{label}</p>
      <p className={`mt-2 font-serif text-2xl font-semibold ${alert ? "text-rose-700" : "text-indigo-950"}`}>
        {value}
      </p>
    </div>
  );
}
