"use client";

/**
 * ErpTasksClient — Hierarchical WBS task tree.
 *
 * Renders a recursive task tree per project. Each task row shows:
 * title, WBS code, assignee, status badge, hours, due date.
 * Checkbox-based status transitions (no drag-drop).
 * Includes a "New Task" dialog.
 *
 * Theme: indigo. csrfFetch for every state-changing call.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ClipboardList,
  Loader2,
  ChevronRight,
  Plus,
  X,
  CalendarDays,
  Clock,
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
import { EmptyState } from "@/components/dashboard/ux/empty-state";

type Project = {
  id: string;
  name: string;
  code: string;
  enterpriseId: string;
};

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
};

type TaskNode = {
  id: string;
  title: string;
  description: string | null;
  wbsCode: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  estimatedHours: number;
  actualHours: number;
  dueDate: string | null;
  progressPct: number;
  children: TaskNode[];
};

type Props = {
  projects: Project[];
  enterprises: Enterprise[];
  treesByProject: Record<string, TaskNode[]>;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  todo: { label: "To Do", cls: "text-slate-700 border-slate-400/40 bg-slate-50" },
  in_progress: { label: "In Progress", cls: "text-indigo-700 border-indigo-500/40 bg-indigo-50" },
  review: { label: "Review", cls: "text-violet-700 border-violet-500/40 bg-violet-50" },
  done: { label: "Done", cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50" },
  blocked: { label: "Blocked", cls: "text-rose-700 border-rose-500/40 bg-rose-50" },
};

const PRIORITY_META: Record<string, string> = {
  low: "text-slate-600 border-slate-400/40 bg-slate-50",
  medium: "text-indigo-700 border-indigo-500/40 bg-indigo-50",
  high: "text-amber-700 border-amber-500/40 bg-amber-50",
  critical: "text-rose-700 border-rose-500/40 bg-rose-50",
};

export function ErpTasksClient({
  projects,
  enterprises: _enterprises,
  treesByProject,
}: Props) {
  const router = useRouter();
  const [activeProjectId, setActiveProjectId] = React.useState(
    projects[0]?.id ?? ""
  );
  const [showNew, setShowNew] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    estimatedHours: "",
    assigneeId: "",
  });

  const tree = activeProjectId ? treesByProject[activeProjectId] ?? [] : [];
  const activeProject = projects.find((p) => p.id === activeProjectId);

  async function handleCreate() {
    if (!activeProjectId) {
      toast.error("Select a project first.");
      return;
    }
    if (form.title.trim().length < 2) {
      toast.error("Task title must be at least 2 characters.");
      return;
    }
    const hours = Number.parseFloat(form.estimatedHours);
    if (!Number.isFinite(hours) || hours < 0) {
      toast.error("Estimated hours must be a non-negative number.");
      return;
    }
    setCreating(true);
    try {
      const res = await csrfFetch("/api/erp/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProjectId,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          priority: form.priority,
          estimatedHours: hours,
          assigneeId: form.assigneeId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Create failed", { description: data?.error ?? "CRE / RBAC denied." });
        return;
      }
      toast.success("Task created", { description: data.task?.wbsCode });
      setForm({ title: "", description: "", priority: "medium", estimatedHours: "", assigneeId: "" });
      setShowNew(false);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not create task", { description: msg });
    } finally {
      setCreating(false);
    }
  }

  async function handleStatus(taskId: string, current: string) {
    const next =
      current === "todo"
        ? "in_progress"
        : current === "in_progress"
        ? "review"
        : current === "review"
        ? "done"
        : "todo";
    setActingId(taskId);
    try {
      const res = await csrfFetch(`/api/erp/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Status change failed", { description: data?.error });
        return;
      }
      toast.success(`Task → ${next}`);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast.error("Could not update task", { description: msg });
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="light">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-1 py-2">
        <header className="rounded-2xl border border-indigo-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <ClipboardList className="h-5 w-5 text-indigo-600" />
                <span className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-indigo-700/80">
                  ERP · Work Breakdown Structure
                </span>
              </div>
              <h1 className="mt-3 font-serif text-3xl font-semibold text-indigo-950 sm:text-4xl">
                Tasks
              </h1>
              <p className="mt-2 max-w-2xl font-sans text-sm text-indigo-950/70">
                Hierarchical task tree with auto-generated WBS codes (1.2.3
                format). Use the checkbox on each row to advance the status
                (todo → in_progress → review → done).
              </p>
            </div>
            <Button
              onClick={() => setShowNew(true)}
              disabled={!activeProjectId}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
          </div>
        </header>

        {/* Project selector */}
        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
            Project
          </Label>
          <Select value={activeProjectId} onValueChange={setActiveProjectId}>
            <SelectTrigger className="mt-1.5 w-full sm:w-[360px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Task tree */}
        {projects.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No Projects Available"
            description="Create a project first, then add WBS tasks to track work."
          />
        ) : tree.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No Tasks Yet"
            description="Click 'New Task' to create your first WBS task for this project."
          />
        ) : (
          <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-indigo-600" />
                <h2 className="font-serif text-lg font-semibold text-indigo-950">
                  {activeProject?.code} — Task Tree
                </h2>
              </div>
              <Badge variant="outline" className="border-indigo-500/40 bg-indigo-50 text-indigo-700">
                {countTasks(tree)} tasks
              </Badge>
            </div>
            <div className="flex flex-col gap-1">
              {tree.map((t) => (
                <TaskRow
                  key={t.id}
                  node={t}
                  depth={0}
                  actingId={actingId}
                  onStatus={handleStatus}
                />
              ))}
            </div>
          </div>
        )}

        {/* New task dialog */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-indigo-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-indigo-600" />
                  <h2 className="font-serif text-lg font-semibold text-indigo-950">
                    New Task
                  </h2>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4">
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Title
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="e.g. Site preparation"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Description
                  </Label>
                  <Textarea
                    className="mt-1.5 min-h-[80px]"
                    placeholder="What needs to be done?"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                      Estimated Hours
                    </Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={0}
                      step="0.5"
                      placeholder="e.g. 8"
                      value={form.estimatedHours}
                      onChange={(e) => setForm((f) => ({ ...f, estimatedHours: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                    Assignee User ID (optional)
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="cuid…"
                    value={form.assigneeId}
                    onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
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
                    Create Task
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

function countTasks(nodes: TaskNode[]): number {
  let n = 0;
  for (const node of nodes) {
    n += 1;
    n += countTasks(node.children);
  }
  return n;
}

function TaskRow({
  node,
  depth,
  actingId,
  onStatus,
}: {
  node: TaskNode;
  depth: number;
  actingId: string | null;
  onStatus: (taskId: string, current: string) => void;
}) {
  const meta = STATUS_META[node.status] ?? STATUS_META.todo;
  const isDone = node.status === "done";
  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-indigo-50/60"
        style={{ paddingLeft: `${depth * 18 + 8}px` }}
      >
        <input
          type="checkbox"
          checked={isDone}
          disabled={actingId === node.id}
          onChange={() => onStatus(node.id, node.status)}
          className="h-3.5 w-3.5 accent-indigo-600"
        />
        <span className="font-mono text-[10px] text-indigo-500">{node.wbsCode}</span>
        <span className={`font-sans text-sm ${isDone ? "text-slate-400 line-through" : "text-indigo-950"}`}>
          {node.title}
        </span>
        <Badge variant="outline" className={`ml-auto ${meta.cls}`}>
          {meta.label}
        </Badge>
        <Badge variant="outline" className={PRIORITY_META[node.priority] ?? PRIORITY_META.medium}>
          {node.priority}
        </Badge>
        <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
          <Clock className="h-3 w-3" /> {node.estimatedHours}h
        </span>
        {node.dueDate && (
          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
            <CalendarDays className="h-3 w-3" /> {new Date(node.dueDate).toLocaleDateString()}
          </span>
        )}
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
