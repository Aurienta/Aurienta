"use client";

/**
 * ErpProcurementClient — Purchase Orders list + create dialog.
 *
 * Lists POs with number, vendor, total, status, expected date.
 * "New PO" dialog (vendor + lines with quantity + price).
 * "Approve" / "Receive" buttons (CRE-enforced).
 *
 * Theme: indigo. csrfFetch for every state-changing call.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Truck,
  Loader2,
  Plus,
  X,
  ShieldCheck,
  CheckCircle2,
  PackageCheck,
  Trash2,
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
import { egp } from "@/lib/aurienta/format";
import { EmptyState } from "@/components/dashboard/ux/empty-state";

type PO = {
  id: string;
  enterpriseId: string;
  poNumber: string;
  vendorName: string;
  status: string;
  totalEgp: number;
  currency: string;
  expectedDate: string | null;
  approvedAt: string | null;
  projectId: string | null;
};

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  fundraisingGoalEgp: number;
};

type Props = {
  purchaseOrders: PO[];
  enterprises: Enterprise[];
  canApprove: boolean;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "text-slate-700 border-slate-400/40 bg-slate-50" },
  submitted: { label: "Submitted", cls: "text-indigo-700 border-indigo-500/40 bg-indigo-50" },
  approved: { label: "Approved", cls: "text-violet-700 border-violet-500/40 bg-violet-50" },
  sent: { label: "Sent", cls: "text-indigo-700 border-indigo-500/40 bg-indigo-50" },
  partial: { label: "Partial", cls: "text-amber-700 border-amber-500/40 bg-amber-50" },
  received: { label: "Received", cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50" },
  cancelled: { label: "Cancelled", cls: "text-rose-700 border-rose-500/40 bg-rose-50" },
};

type Line = {
  description: string;
  quantity: string;
  unitPriceEgp: string;
};

export function ErpProcurementClient({
  purchaseOrders: initialPOs,
  enterprises,
  canApprove,
}: Props) {
  const router = useRouter();
  const [pos, setPos] = React.useState<PO[]>(initialPOs);
  const [activeEntId, setActiveEntId] = React.useState(enterprises[0]?.id ?? "");
  const [showNew, setShowNew] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    vendorName: "",
    expectedDate: "",
    notes: "",
  });
  const [lines, setLines] = React.useState<Line[]>([
    { description: "", quantity: "", unitPriceEgp: "" },
  ]);

  const filtered = activeEntId
    ? pos.filter((p) => p.enterpriseId === activeEntId)
    : pos;

  function addLine() {
    setLines((prev) => [...prev, { description: "", quantity: "", unitPriceEgp: "" }]);
  }
  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateLine(idx: number, field: keyof Line, value: string) {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l))
    );
  }

  async function handleCreate() {
    if (!activeEntId) {
      toast.error("Select an enterprise first.");
      return;
    }
    if (form.vendorName.trim().length < 1) {
      toast.error("Vendor name is required.");
      return;
    }
    const validLines = lines.filter(
      (l) =>
        l.description.trim().length > 0 &&
        Number.parseFloat(l.quantity) > 0 &&
        Number.parseFloat(l.unitPriceEgp) >= 0
    );
    if (validLines.length === 0) {
      toast.error("Add at least one valid line item (description, quantity, unit price).");
      return;
    }

    setCreating(true);
    try {
      const res = await csrfFetch("/api/erp/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: activeEntId,
          vendorName: form.vendorName.trim(),
          expectedDate: form.expectedDate || undefined,
          notes: form.notes.trim() || undefined,
          lines: validLines.map((l) => ({
            description: l.description.trim(),
            quantity: Number.parseFloat(l.quantity),
            unitPriceEgp: Number.parseFloat(l.unitPriceEgp),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Create failed", { description: data?.error });
        return;
      }
      toast.success("Purchase order created", {
        description: data.po?.poNumber,
      });
      setPos((prev) => [data.po, ...prev]);
      setForm({ vendorName: "", expectedDate: "", notes: "" });
      setLines([{ description: "", quantity: "", unitPriceEgp: "" }]);
      setShowNew(false);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not create PO", { description: msg });
    } finally {
      setCreating(false);
    }
  }

  async function handleApprove(poId: string) {
    setActingId(poId);
    try {
      const res = await csrfFetch(`/api/erp/purchase-orders/${poId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Approve failed", { description: data?.error ?? "CRE / RBAC denied." });
        return;
      }
      toast.success("PO approved", { description: data.po?.poNumber });
      setPos((prev) => prev.map((p) => (p.id === poId ? data.po : p)));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not approve", { description: msg });
    } finally {
      setActingId(null);
    }
  }

  async function handleReceive(poId: string) {
    setActingId(poId);
    try {
      const res = await csrfFetch(`/api/erp/purchase-orders/${poId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "receive" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Receive failed", { description: data?.error });
        return;
      }
      toast.success("PO received", { description: "Inventory updated + movements logged." });
      setPos((prev) => prev.map((p) => (p.id === poId ? data.po : p)));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not receive", { description: msg });
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
                <Truck className="h-5 w-5 text-indigo-600" />
                <span className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-indigo-700/80">
                  ERP · Procurement
                </span>
              </div>
              <h1 className="mt-3 font-serif text-3xl font-semibold text-indigo-950 sm:text-4xl">
                Purchase Orders
              </h1>
              <p className="mt-2 max-w-2xl font-sans text-sm text-indigo-950/70">
                CRE-enforced purchase authority. POs above 10% of capital
                require manager+ approval; above 25% require board approval.
                Goods receipt auto-updates inventory.
              </p>
            </div>
            <Button
              onClick={() => setShowNew(true)}
              disabled={!activeEntId}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" /> New PO
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
              icon={Truck}
              title="No Purchase Orders"
              description="Create a new PO to procure goods from a vendor."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expected</TableHead>
                    {canApprove && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const meta = STATUS_META[p.status] ?? STATUS_META.draft;
                    const canApproveRow = canApprove && (p.status === "draft" || p.status === "submitted");
                    const canReceiveRow = p.status === "approved" || p.status === "sent" || p.status === "partial";
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs text-indigo-700">
                          {p.poNumber}
                        </TableCell>
                        <TableCell className="font-sans text-sm text-indigo-950">
                          {p.vendorName}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {egp(p.totalEgp, { compact: true })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={meta.cls}>
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-sans text-xs text-slate-500">
                          {p.expectedDate
                            ? new Date(p.expectedDate).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        {canApprove && (
                          <TableCell className="text-right">
                            {(canApproveRow || canReceiveRow) ? (
                              <div className="flex justify-end gap-1.5">
                                {canApproveRow && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-indigo-500/40 text-indigo-700 hover:bg-indigo-50"
                                    disabled={actingId === p.id}
                                    onClick={() => handleApprove(p.id)}
                                  >
                                    {actingId === p.id ? (
                                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                    ) : (
                                      <ShieldCheck className="mr-1.5 h-3 w-3" />
                                    )}
                                    Approve
                                  </Button>
                                )}
                                {canReceiveRow && (
                                  <Button
                                    size="sm"
                                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                                    disabled={actingId === p.id}
                                    onClick={() => handleReceive(p.id)}
                                  >
                                    {actingId === p.id ? (
                                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                    ) : (
                                      <PackageCheck className="mr-1.5 h-3 w-3" />
                                    )}
                                    Receive
                                  </Button>
                                )}
                              </div>
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

        {/* New PO dialog */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl border border-indigo-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  <h2 className="font-serif text-lg font-semibold text-indigo-950">
                    New Purchase Order
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
                      Vendor Name
                    </Label>
                    <Input
                      className="mt-1.5"
                      placeholder="e.g. Egypt Steel Co."
                      value={form.vendorName}
                      onChange={(e) => setForm((f) => ({ ...f, vendorName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Expected Date
                    </Label>
                    <Input
                      className="mt-1.5"
                      type="date"
                      value={form.expectedDate}
                      onChange={(e) => setForm((f) => ({ ...f, expectedDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Notes (optional)
                  </Label>
                  <Textarea
                    className="mt-1.5 min-h-[60px]"
                    placeholder="Delivery instructions, payment terms, etc."
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Line Items
                    </Label>
                    <Button size="sm" variant="outline" onClick={addLine}>
                      <Plus className="mr-1 h-3 w-3" /> Add Line
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {lines.map((l, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          className="flex-1"
                          placeholder="Description"
                          value={l.description}
                          onChange={(e) => updateLine(idx, "description", e.target.value)}
                        />
                        <Input
                          className="w-24"
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Qty"
                          value={l.quantity}
                          onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                        />
                        <Input
                          className="w-32"
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Unit Price"
                          value={l.unitPriceEgp}
                          onChange={(e) => updateLine(idx, "unitPriceEgp", e.target.value)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeLine(idx)}
                          disabled={lines.length === 1}
                          className="border-rose-500/40 text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
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
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Create PO
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
