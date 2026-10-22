"use client";

/**
 * ErpAssetsClient — Fixed asset register + depreciation/disposal.
 *
 * Table: code, name, category, acquisition cost, NBV, status, location.
 * "New Asset" dialog. "Depreciate" + "Dispose" buttons per row.
 *
 * Theme: indigo. csrfFetch for every state-changing call.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Factory,
  Loader2,
  Plus,
  X,
  ShieldCheck,
  TrendingDown,
  Trash2,
  Banknote,
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
import { egp } from "@/lib/aurienta/format";
import { EmptyState } from "@/components/dashboard/ux/empty-state";

type Asset = {
  id: string;
  enterpriseId: string;
  assetCode: string;
  name: string;
  category: string;
  acquisitionDate: string;
  acquisitionCostEgp: number;
  netBookValueEgp: number;
  accumulatedDepreciationEgp: number;
  status: string;
  location: string | null;
  assignedTo: string | null;
};

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
};

type Props = {
  assets: Asset[];
  enterprises: Enterprise[];
  canDispose: boolean;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50" },
  maintenance: { label: "Maintenance", cls: "text-amber-700 border-amber-500/40 bg-amber-50" },
  disposed: { label: "Disposed", cls: "text-rose-700 border-rose-500/40 bg-rose-50" },
  retired: { label: "Retired", cls: "text-slate-700 border-slate-400/40 bg-slate-50" },
};

export function ErpAssetsClient({
  assets: initialAssets,
  enterprises,
  canDispose,
}: Props) {
  const router = useRouter();
  const [assets, setAssets] = React.useState<Asset[]>(initialAssets);
  const [activeEntId, setActiveEntId] = React.useState(enterprises[0]?.id ?? "");
  const [showNew, setShowNew] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    name: "",
    category: "equipment" as "equipment" | "vehicle" | "property" | "software" | "furniture",
    acquisitionDate: "",
    acquisitionCostEgp: "",
    depreciationRate: "0.1",
    location: "",
    assignedTo: "",
  });

  const filtered = activeEntId
    ? assets.filter((a) => a.enterpriseId === activeEntId)
    : assets;
  const totalNbv = filtered.reduce((s, a) => s + a.netBookValueEgp, 0);

  async function handleCreate() {
    if (!activeEntId) {
      toast.error("Select an enterprise first.");
      return;
    }
    if (form.name.trim().length < 2) {
      toast.error("Asset name must be at least 2 characters.");
      return;
    }
    if (!form.acquisitionDate) {
      toast.error("Acquisition date is required.");
      return;
    }
    const cost = Number.parseInt(form.acquisitionCostEgp, 10);
    if (!Number.isFinite(cost) || cost < 0) {
      toast.error("Acquisition cost must be a non-negative integer.");
      return;
    }
    setCreating(true);
    try {
      const res = await csrfFetch("/api/erp/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: activeEntId,
          name: form.name.trim(),
          category: form.category,
          acquisitionDate: new Date(form.acquisitionDate).toISOString(),
          acquisitionCostEgp: cost,
          depreciationRate: Number.parseFloat(form.depreciationRate) || 0.1,
          location: form.location.trim() || undefined,
          assignedTo: form.assignedTo.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Create failed", { description: data?.error });
        return;
      }
      toast.success("Asset registered", { description: data.asset?.assetCode });
      setAssets((prev) => [data.asset, ...prev]);
      setForm({ name: "", category: "equipment", acquisitionDate: "", acquisitionCostEgp: "", depreciationRate: "0.1", location: "", assignedTo: "" });
      setShowNew(false);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not register asset", { description: msg });
    } finally {
      setCreating(false);
    }
  }

  async function handleDepreciate(assetId: string) {
    setActingId(assetId);
    try {
      const res = await csrfFetch(`/api/erp/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "depreciate" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Depreciation failed", { description: data?.error });
        return;
      }
      toast.success("Depreciation applied", { description: data.asset?.assetCode });
      setAssets((prev) => prev.map((a) => (a.id === assetId ? data.asset : a)));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not depreciate", { description: msg });
    } finally {
      setActingId(null);
    }
  }

  async function handleDispose(assetId: string) {
    if (!confirm("Dispose this asset? This action is CRE-enforced and irreversible.")) return;
    setActingId(assetId);
    try {
      const res = await csrfFetch(`/api/erp/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dispose" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Disposal failed", { description: data?.error ?? "CRE / RBAC denied." });
        return;
      }
      toast.success("Asset disposed", { description: data.asset?.assetCode });
      setAssets((prev) => prev.map((a) => (a.id === assetId ? data.asset : a)));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not dispose", { description: msg });
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
                <Factory className="h-5 w-5 text-indigo-600" />
                <span className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-indigo-700/80">
                  ERP · Fixed Asset Register
                </span>
              </div>
              <h1 className="mt-3 font-serif text-3xl font-semibold text-indigo-950 sm:text-4xl">
                Fixed Assets
              </h1>
              <p className="mt-2 max-w-2xl font-sans text-sm text-indigo-950/70">
                CRE-enforced asset disposal. Assets with NBV above 100,000 EGP
                require board or company_owner approval before disposal.
              </p>
            </div>
            <Button
              onClick={() => setShowNew(true)}
              disabled={!activeEntId}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" /> New Asset
            </Button>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Assets" value={String(filtered.length)} />
          <StatCard label="Total NBV" value={egp(totalNbv, { compact: true })} />
          <StatCard
            label="Active"
            value={String(filtered.filter((a) => a.status === "active").length)}
          />
          <StatCard
            label="Disposed"
            value={String(filtered.filter((a) => a.status === "disposed").length)}
          />
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

        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Factory}
              title="No Assets Registered"
              description="Register your first fixed asset to start tracking depreciation and net book value."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Acc. Depr.</TableHead>
                    <TableHead className="text-right">NBV</TableHead>
                    <TableHead>Status</TableHead>
                    {canDispose && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => {
                    const meta = STATUS_META[a.status] ?? STATUS_META.active;
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs text-indigo-700">
                          {a.assetCode}
                        </TableCell>
                        <TableCell>
                          <div className="font-sans text-sm font-medium text-indigo-950">
                            {a.name}
                          </div>
                          {a.location && (
                            <div className="font-mono text-[10px] text-slate-400">
                              {a.location}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-sans text-xs text-slate-600">
                          {a.category}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {egp(a.acquisitionCostEgp, { compact: true })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-amber-700">
                          {egp(a.accumulatedDepreciationEgp, { compact: true })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-emerald-700 font-bold">
                          {egp(a.netBookValueEgp, { compact: true })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={meta.cls}>
                            {meta.label}
                          </Badge>
                        </TableCell>
                        {canDispose && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-indigo-500/40 text-indigo-700 hover:bg-indigo-50"
                                disabled={actingId === a.id || a.status !== "active"}
                                onClick={() => handleDepreciate(a.id)}
                              >
                                {actingId === a.id ? (
                                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                ) : (
                                  <TrendingDown className="mr-1.5 h-3 w-3" />
                                )}
                                Depreciate
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-rose-500/40 text-rose-700 hover:bg-rose-50"
                                disabled={actingId === a.id || a.status === "disposed"}
                                onClick={() => handleDispose(a.id)}
                              >
                                {actingId === a.id ? (
                                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-1.5 h-3 w-3" />
                                )}
                                Dispose
                              </Button>
                            </div>
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

        {/* New asset dialog */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-indigo-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  <h2 className="font-serif text-lg font-semibold text-indigo-950">
                    New Fixed Asset
                  </h2>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4">
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Asset Name
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="e.g. Forklift Model X"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Category
                    </Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm((f) => ({ ...f, category: v as typeof f.category }))}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="vehicle">Vehicle</SelectItem>
                        <SelectItem value="property">Property</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Acquisition Date
                    </Label>
                    <Input
                      className="mt-1.5"
                      type="date"
                      value={form.acquisitionDate}
                      onChange={(e) => setForm((f) => ({ ...f, acquisitionDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Acquisition Cost (EGP)
                    </Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="e.g. 250000"
                      value={form.acquisitionCostEgp}
                      onChange={(e) => setForm((f) => ({ ...f, acquisitionCostEgp: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Annual Depr. Rate
                    </Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={0}
                      max={1}
                      step="0.05"
                      placeholder="e.g. 0.1 (10%)"
                      value={form.depreciationRate}
                      onChange={(e) => setForm((f) => ({ ...f, depreciationRate: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Location (optional)
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="e.g. Warehouse A"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
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
                      <Banknote className="mr-2 h-4 w-4" />
                    )}
                    Register Asset
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm">
      <p className="font-sans text-xs uppercase tracking-wider text-indigo-900/70">{label}</p>
      <p className="mt-2 font-serif text-2xl font-semibold text-indigo-950">{value}</p>
    </div>
  );
}
