"use client";

/**
 * ErpProjectsClient — Kanban-style project board.
 *
 * Columns: planning / active / review (on_hold) / done (completed).
 * Cards: name, code, budget vs spent, progress %, health, risk.
 * Includes a "New Project" dialog. Click a card → detail view with
 * WBS task tree (fetched lazily from /api/erp/tasks?projectId=).
 *
 * Theme: indigo. csrfFetch for every state-changing call.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Target,
  Loader2,
  ChevronRight,
  Plus,
  ShieldCheck,
  X,
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
import { egp } from "@/lib/aurienta/format";
import { EmptyState } from "@/components/dashboard/ux/empty-state";

type Project = {
  id: string;
  enterpriseId: string;
  name: string;
  code: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  budgetEgp: number;
  spentEgp: number;
  progressPct: number;
  healthScore: number;
  riskLevel: string;
  managerId: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
};

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
};

type Health = {
  projectId: string;
  healthScore: number;
  riskLevel: string;
  budgetUtilizationPct: number;
  progressPct: number;
  taskCount: number;
  completedTasks: number;
  overdueTasks: number;
  budgetRemainingEgp: number;
};

type TaskNode = {
  id: string;
  title: string;
  wbsCode: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  progressPct: number;
  dueDate: string | null;
  children: TaskNode[];
};

type Props = {
  projects: Project[];
  enterprises: Enterprise[];
  healthByProject: Record<string, Health>;
};

const COLUMNS = [
  { key: "planning", label: "Planning", cls: "text-indigo-700" },
  { key: "active", label: "Active", cls: "text-violet-700" },
  { key: "on_hold", label: "On Hold", cls: "text-amber-700" },
  { key: "completed", label: "Completed", cls: "text-emerald-700" },
];

const PRIORITY_META: Record<string, string> = {
  low: "text-slate-600 border-slate-400/40 bg-slate-50",
  medium: "text-indigo-700 border-indigo-500/40 bg-indigo-50",
  high: "text-amber-700 border-amber-500/40 bg-amber-50",
  critical: "text-rose-700 border-rose-500/40 bg-rose-50",
};

const RISK_META: Record<string, string> = {
  low: "text-emerald-700 border-emerald-500/40 bg-emerald-50",
  medium: "text-amber-700 border-amber-500/40 bg-amber-50",
  high: "text-rose-700 border-rose-500/40 bg-rose-50",
  critical: "text-rose-800 border-rose-600/60 bg-rose-100",
};

export function ErpProjectsClient({
  projects: initialProjects,
  enterprises,
  healthByProject,
}: Props) {
  const router = useRouter();
  const [projects] = React.useState<Project[]>(initialProjects);
  const [showNew, setShowNew] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [tasks, setTasks] = React.useState<TaskNode[]>([]);
  const [loadingTasks, setLoadingTasks] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    enterpriseId: enterprises[0]?.id ?? "",
    name: "",
    description: "",
    type: "internal" as "internal" | "client" | "r_and_d" | "construction" | "manufacturing",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    budgetEgp: "",
  });

  // ── Create project ──
  async function handleCreate() {
    if (!form.enterpriseId) {
      toast.error("Select an enterprise first.");
      return;
    }
    if (form.name.trim().length < 2) {
      toast.error("Project name must be at least 2 characters.");
      return;
    }
    if (form.description.trim().length < 3) {
      toast.error("Description must be at least 3 characters.");
      return;
    }
    const budget = Number.parseInt(form.budgetEgp, 10);
    if (!Number.isFinite(budget) || budget < 0) {
      toast.error("Budget must be a non-negative integer.");
      return;
    }

    setCreating(true);
    try {
      const res = await csrfFetch("/api/erp/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: form.enterpriseId,
          name: form.name.trim(),
          description: form.description.trim(),
          type: form.type,
          priority: form.priority,
          budgetEgp: budget,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Create failed", { description: data?.error ?? "CRE / RBAC denied." });
        return;
      }
      toast.success("Project created", {
        description: `${data.project?.code} — ${data.project?.name}`,
      });
      setForm((f) => ({ ...f, name: "", description: "", budgetEgp: "" }));
      setShowNew(false);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not create project", { description: msg });
    } finally {
      setCreating(false);
    }
  }

  // ── Load WBS tasks for selected project ──
  async function loadTasks(projectId: string) {
    setSelectedId(projectId);
    setLoadingTasks(true);
    setTasks([]);
    try {
      const res = await fetch(`/api/erp/tasks?projectId=${projectId}`);
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks ?? []);
      } else {
        toast.error("Could not load tasks", { description: data?.error });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not load tasks", { description: msg });
    } finally {
      setLoadingTasks(false);
    }
  }

  // ── Transition task status (checkbox in detail view) ──
  async function handleTaskStatus(taskId: string, status: string) {
    setActingId(taskId);
    try {
      const res = await csrfFetch(`/api/erp/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Status change failed", { description: data?.error });
        return;
      }
      toast.success(`Task → ${status}`);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not update task", { description: msg });
    } finally {
      setActingId(null);
    }
  }

  const selectedProject = projects.find((p) => p.id === selectedId);
  const selectedHealth = selectedId ? healthByProject[selectedId] : undefined;

  return (
    <div className="light">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-1 py-2">
        {/* Header */}
        <header className="rounded-2xl border border-indigo-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Target className="h-5 w-5 text-indigo-600" />
                <span className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-indigo-700/80">
                  ERP · Project Board
                </span>
              </div>
              <h1 className="mt-3 font-serif text-3xl font-semibold text-indigo-950 sm:text-4xl">
                Projects
              </h1>
              <p className="mt-2 max-w-2xl font-sans text-sm text-indigo-950/70">
                Kanban board with CRE-enforced budget governance. Each project
                carries a WBS task tree, budget vs spent tracker, and a
                computed health + risk score.
              </p>
            </div>
            <Button
              onClick={() => setShowNew(true)}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </div>
        </header>

        {projects.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No Projects Yet"
            description="Create your first project to start tracking budgets, tasks, and resource allocations."
            action={
              <Button
                onClick={() => setShowNew(true)}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Plus className="mr-2 h-4 w-4" /> New Project
              </Button>
            }
          />
        ) : (
          <>
            {/* Kanban board */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {COLUMNS.map((col) => {
                const items = projects.filter((p) => p.status === col.key);
                return (
                  <div
                    key={col.key}
                    className="rounded-2xl border border-indigo-200/70 bg-white/60 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between px-1">
                      <span className={`font-sans text-xs font-semibold uppercase tracking-wider ${col.cls}`}>
                        {col.label}
                      </span>
                      <Badge variant="outline" className="border-indigo-500/40 bg-indigo-50 text-indigo-700">
                        {items.length}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map((p) => {
                        const h = healthByProject[p.id];
                        return (
                          <button
                            key={p.id}
                            onClick={() => loadTasks(p.id)}
                            className="rounded-xl border border-indigo-200/70 bg-white p-3 text-left shadow-sm transition hover:border-indigo-400 hover:shadow-md"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[10px] uppercase tracking-wider text-indigo-600">
                                {p.code}
                              </span>
                              <Badge
                                variant="outline"
                                className={PRIORITY_META[p.priority] ?? PRIORITY_META.medium}
                              >
                                {p.priority}
                              </Badge>
                            </div>
                            <p className="mt-1 font-sans text-sm font-semibold text-indigo-950">
                              {p.name}
                            </p>
                            <p className="mt-0.5 line-clamp-2 font-sans text-xs text-slate-600">
                              {p.description}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="font-mono text-[11px] text-indigo-700">
                                {egp(p.spentEgp, { compact: true })} / {egp(p.budgetEgp, { compact: true })}
                              </span>
                              {h && (
                                <Badge
                                  variant="outline"
                                  className={RISK_META[h.riskLevel] ?? RISK_META.low}
                                >
                                  {h.riskLevel} risk
                                </Badge>
                              )}
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
                              <div
                                className="h-full bg-indigo-600"
                                style={{ width: `${h?.progressPct ?? p.progressPct}%` }}
                              />
                            </div>
                            <p className="mt-1 font-mono text-[10px] text-slate-500">
                              {h?.progressPct ?? p.progressPct}% progress · health {h?.healthScore ?? p.healthScore}
                            </p>
                          </button>
                        );
                      })}
                      {items.length === 0 && (
                        <p className="px-2 py-4 text-center font-sans text-xs text-slate-400">
                          No projects
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail / WBS tree */}
            {selectedProject && (
              <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs uppercase tracking-wider text-indigo-600">
                        {selectedProject.code}
                      </span>
                      <Badge variant="outline" className={PRIORITY_META[selectedProject.priority] ?? PRIORITY_META.medium}>
                        {selectedProject.priority}
                      </Badge>
                    </div>
                    <h2 className="mt-1 font-serif text-xl font-semibold text-indigo-950">
                      {selectedProject.name}
                    </h2>
                    <p className="mt-1 max-w-2xl font-sans text-sm text-slate-600">
                      {selectedProject.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedId(null)}
                    className="border-indigo-500/40 text-indigo-700 hover:bg-indigo-50"
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" /> Close
                  </Button>
                </div>

                {/* Health summary */}
                {selectedHealth && (
                  <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <HealthStat label="Health Score" value={`${selectedHealth.healthScore}/100`} />
                    <HealthStat label="Budget Used" value={`${selectedHealth.budgetUtilizationPct}%`} />
                    <HealthStat label="Tasks" value={`${selectedHealth.completedTasks}/${selectedHealth.taskCount}`} />
                    <HealthStat label="Overdue" value={String(selectedHealth.overdueTasks)} alert={selectedHealth.overdueTasks > 0} />
                  </div>
                )}

                {/* WBS tree */}
                <div className="mt-4 border-t border-indigo-100 pt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-indigo-600" />
                    <h3 className="font-serif text-base font-semibold text-indigo-950">
                      Work Breakdown Structure
                    </h3>
                  </div>
                  {loadingTasks ? (
                    <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> Loading tasks…
                    </div>
                  ) : tasks.length === 0 ? (
                    <p className="font-sans text-xs text-slate-500">
                      No tasks yet — create tasks via the Tasks page.
                    </p>
                  ) : (
                    <div className="ml-2 flex flex-col gap-1">
                      {tasks.map((t) => (
                        <TaskRow
                          key={t.id}
                          node={t}
                          depth={0}
                          actingId={actingId}
                          onStatus={handleTaskStatus}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* New project dialog */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-indigo-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  <h2 className="font-serif text-lg font-semibold text-indigo-950">
                    New Project
                  </h2>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNew(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4">
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Enterprise
                  </Label>
                  <Select
                    value={form.enterpriseId}
                    onValueChange={(v) => setForm((f) => ({ ...f, enterpriseId: v }))}
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
                    Project Name
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="e.g. New Factory Buildout"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Description
                  </Label>
                  <Textarea
                    className="mt-1.5 min-h-[80px]"
                    placeholder="Brief description of scope and objectives."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Type
                    </Label>
                    <Select
                      value={form.type}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, type: v as typeof f.type }))
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="r_and_d">R&D</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Priority
                    </Label>
                    <Select
                      value={form.priority}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, priority: v as typeof f.priority }))
                      }
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
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Budget (EGP)
                  </Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    min={0}
                    placeholder="e.g. 500000"
                    value={form.budgetEgp}
                    onChange={(e) => setForm((f) => ({ ...f, budgetEgp: e.target.value }))}
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
                      <TrendingUp className="mr-2 h-4 w-4" />
                    )}
                    Create Project
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

// ── TaskRow (recursive WBS tree node) ──

function TaskRow({
  node,
  depth,
  actingId,
  onStatus,
}: {
  node: TaskNode;
  depth: number;
  actingId: string | null;
  onStatus: (taskId: string, status: string) => void;
}) {
  const isDone = node.status === "done";
  const nextStatus = node.status === "todo" ? "in_progress" : "done";
  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-indigo-50/60"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <input
          type="checkbox"
          checked={isDone}
          disabled={actingId === node.id}
          onChange={() => onStatus(node.id, nextStatus)}
          className="h-3.5 w-3.5 accent-indigo-600"
        />
        <span className="font-mono text-[10px] text-indigo-500">{node.wbsCode}</span>
        <span className={`font-sans text-xs ${isDone ? "text-slate-400 line-through" : "text-indigo-950"}`}>
          {node.title}
        </span>
        <Badge variant="outline" className="ml-auto border-indigo-500/40 bg-indigo-50 text-[10px] text-indigo-700">
          {node.status}
        </Badge>
      </div>
      {node.children.map((c) => (
        <TaskRow
          key={c.id}
          node={c}
          depth={depth + 1}
          actingId={actingId}
          onStatus={onStatus}
        />
      ))}
    </div>
  );
}

function HealthStat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`rounded-lg border p-2 ${alert ? "border-rose-300 bg-rose-50" : "border-indigo-200/70 bg-indigo-50/40"}`}>
      <p className="font-sans text-[10px] uppercase tracking-wider text-indigo-900/70">
        {label}
      </p>
      <p className={`mt-0.5 font-serif text-base font-semibold ${alert ? "text-rose-700" : "text-indigo-950"}`}>
        {value}
      </p>
    </div>
  );
}
