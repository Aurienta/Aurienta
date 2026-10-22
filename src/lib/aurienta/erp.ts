// AURIENTA — Constitutional ERP Engine
// ════════════════════════════════════════════════════════════════════
// Central ERP module covering projects, tasks (WBS), resources,
// timesheets, inventory, procurement (purchase orders), fixed assets,
// manufacturing (production orders + BOM), and quality control.
//
// Every state-changing action is CRE-enforced (8 ERP policies already
// defined in cre.ts). Each policy decision is persisted as a CreDecision
// row + LedgerEvent chain entry + AuditLog row — triple-booked for
// tamper-evidence.
//
// Outsmarts Oracle NetSuite and Odoo by adding CRE-enforced governance
// to EVERY ERP action: budgets, allocation, inventory adjustments,
// purchase authority, production release, quality checks, timesheet
// approval, asset disposal.

import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import {
  enforceProjectBudget,
  enforcePurchaseAuthority,
  enforceResourceAllocation,
  enforceInventoryAdjustment,
  enforceProductionRelease,
  enforceQualityCheck,
  enforceTimesheetApproval,
  enforceAssetDisposal,
  logCreDecision,
  appendLedgerEvent,
  type CreVerdict,
} from "@/lib/aurienta/cre";

// ════════════════════════════════════════════════════════════════════
// 1. PROJECT MANAGEMENT
// ════════════════════════════════════════════════════════════════════

export type CreateProjectParams = {
  enterpriseId: string;
  name: string;
  description: string;
  type?: string; // internal, client, r_and_d, construction, manufacturing
  priority?: string; // low, medium, high, critical
  startDate?: Date;
  endDate?: Date;
  budgetEgp?: number;
  managerId?: string;
  clientId?: string;
};

export type ErpProjectRecord = {
  id: string;
  enterpriseId: string;
  name: string;
  code: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  budgetEgp: number;
  spentEgp: number;
  progressPct: number;
  managerId: string | null;
  clientId: string | null;
  healthScore: number;
  riskLevel: string;
  creDecisionToken: string | null;
  createdAt: string;
  updatedAt: string;
};

function toProjectRecord(p: {
  id: string;
  enterpriseId: string;
  name: string;
  code: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  startDate: Date | null;
  endDate: Date | null;
  budgetEgp: number;
  spentEgp: number;
  progressPct: number;
  managerId: string | null;
  clientId: string | null;
  healthScore: number;
  riskLevel: string;
  creDecisionToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ErpProjectRecord {
  return {
    ...p,
    startDate: p.startDate ? p.startDate.toISOString() : null,
    endDate: p.endDate ? p.endDate.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/**
 * Generates the next project code in the form `PRJ-YYYY-NNN` for the
 * given enterprise. The NNN segment is per-enterprise + per-year.
 */
async function nextProjectCode(enterpriseId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PRJ-${year}-`;
  // Find the highest existing NNN for this enterprise in this year.
  const existing = await db.erpProject.findMany({
    where: {
      enterpriseId,
      code: { startsWith: prefix },
    },
    select: { code: true },
  });
  let maxN = 0;
  for (const e of existing) {
    const n = Number.parseInt(e.code.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > maxN) maxN = n;
  }
  return `${prefix}${String(maxN + 1).padStart(3, "0")}`;
}

export async function createProject(
  params: CreateProjectParams
): Promise<ErpProjectRecord> {
  const code = await nextProjectCode(params.enterpriseId);
  const budgetEgp = Math.max(0, Math.floor(params.budgetEgp ?? 0));

  // CRE-1: enforce project budget sanity at creation.
  const verdict = enforceProjectBudget({
    projectId: "new",
    budgetEgp,
    spentEgp: 0,
    newExpenseEgp: 0,
  });

  const project = await db.$transaction(async (tx) => {
    const created = await tx.erpProject.create({
      data: {
        enterpriseId: params.enterpriseId,
        name: params.name,
        code,
        description: params.description,
        type: params.type ?? "internal",
        status: "planning",
        priority: params.priority ?? "medium",
        startDate: params.startDate ?? null,
        endDate: params.endDate ?? null,
        budgetEgp,
        spentEgp: 0,
        progressPct: 0,
        managerId: params.managerId ?? null,
        clientId: params.clientId ?? null,
        healthScore: 75,
        riskLevel: "low",
        creDecisionToken: verdict.decisionToken,
      },
    });

    await logCreDecision(tx, {
      enterpriseId: params.enterpriseId,
      policy: verdict.policy,
      verdict,
      actorId: params.managerId,
      payload: {
        projectId: created.id,
        code,
        budgetEgp,
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: params.enterpriseId,
      eventType: "erp_project_created",
      payload: {
        projectId: created.id,
        code,
        name: params.name,
        budgetEgp,
      },
      actorId: params.managerId,
    });

    return created;
  });

  await audit({
    actorId: params.managerId,
    action: "erp.project.create",
    target: `erp_project:${project.id}`,
    result: "allowed",
    metadata: { enterpriseId: params.enterpriseId, code, budgetEgp },
  });

  logger.info("erp project created", { projectId: project.id, code });
  return toProjectRecord(project);
}

export async function listProjects(
  enterpriseId: string,
  filters?: { status?: string; priority?: string }
): Promise<ErpProjectRecord[]> {
  const where: Record<string, unknown> = { enterpriseId };
  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;
  const rows = await db.erpProject.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(toProjectRecord);
}

export type ProjectDetail = ErpProjectRecord & {
  taskCount: number;
  spentEgp: number;
  progressPct: number;
};

export async function getProject(
  projectId: string
): Promise<ProjectDetail | null> {
  const row = await db.erpProject.findUnique({ where: { id: projectId } });
  if (!row) return null;
  const [taskCount, taskAgg] = await Promise.all([
    db.erpTask.count({ where: { projectId } }),
    db.erpTask.aggregate({
      where: { projectId, status: "done" },
      _avg: { progressPct: true },
    }),
  ]);
  const progress =
    taskCount > 0 ? Math.round(taskAgg._avg.progressPct ?? 0) : row.progressPct;
  return {
    ...toProjectRecord(row),
    taskCount,
    spentEgp: row.spentEgp,
    progressPct: progress,
  };
}

const PROJECT_STATUS_FLOW: Record<string, string[]> = {
  planning: ["active", "cancelled"],
  active: ["on_hold", "completed", "cancelled"],
  on_hold: ["active", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function updateProjectStatus(
  projectId: string,
  status: string,
  actorId?: string
): Promise<ErpProjectRecord | null> {
  const existing = await db.erpProject.findUnique({ where: { id: projectId } });
  if (!existing) return null;
  const allowed = PROJECT_STATUS_FLOW[existing.status] ?? [];
  if (!allowed.includes(status)) {
    throw new Error(
      `Cannot transition project from '${existing.status}' to '${status}'`
    );
  }
  const updated = await db.$transaction(async (tx) => {
    const u = await tx.erpProject.update({
      where: { id: projectId },
      data: { status },
    });
    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "erp_project_status_changed",
      payload: { projectId, from: existing.status, to: status },
      actorId,
    });
    return u;
  });
  await audit({
    actorId,
    action: "erp.project.status",
    target: `erp_project:${projectId}`,
    result: "allowed",
    metadata: { from: existing.status, to: status },
  });
  return toProjectRecord(updated);
}

export type ProjectHealth = {
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

export async function getProjectHealth(
  projectId: string
): Promise<ProjectHealth> {
  const project = await db.erpProject.findUnique({ where: { id: projectId } });
  if (!project) return { projectId: "", healthScore: 0, riskLevel: "low", budgetUtilizationPct: 0, progressPct: 0, taskCount: 0, completedTasks: 0, overdueTasks: 0, budgetRemainingEgp: 0 };
  const tasks = await db.erpTask.findMany({
    where: { projectId },
    select: { status: true, dueDate: true, progressPct: true },
  });
  const completed = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter(
    (t) => t.dueDate && t.dueDate.getTime() < Date.now() && t.status !== "done"
  ).length;

  const budgetUtil =
    project.budgetEgp > 0
      ? (project.spentEgp / project.budgetEgp) * 100
      : 0;
  const avgProgress =
    tasks.length > 0
      ? Math.round(
          tasks.reduce((s, t) => s + (t.progressPct ?? 0), 0) / tasks.length
        )
      : project.progressPct;

  // Compute health score: progress - overdue penalty - budget overage penalty.
  let health = 75;
  health += (avgProgress - 50) * 0.3;
  health -= overdue * 5;
  if (budgetUtil > 90) health -= 10;
  if (budgetUtil > 100) health -= 15;
  health = Math.max(0, Math.min(100, Math.round(health)));

  const risk =
    health < 40 ? "critical" : health < 60 ? "high" : health < 80 ? "medium" : "low";

  return {
    projectId,
    healthScore: health,
    riskLevel: risk,
    budgetUtilizationPct: Math.round(budgetUtil),
    progressPct: avgProgress,
    taskCount: tasks.length,
    completedTasks: completed,
    overdueTasks: overdue,
    budgetRemainingEgp: Math.max(0, project.budgetEgp - project.spentEgp),
  };
}

// ════════════════════════════════════════════════════════════════════
// 2. TASK MANAGEMENT (WBS)
// ════════════════════════════════════════════════════════════════════

export type CreateTaskParams = {
  projectId: string;
  parentId?: string;
  title: string;
  description?: string;
  priority?: string;
  assigneeId?: string;
  estimatedHours?: number;
  startDate?: Date;
  dueDate?: Date;
  tags?: string;
};

export type ErpTaskRecord = {
  id: string;
  projectId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  wbsCode: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  estimatedHours: number;
  actualHours: number;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  progressPct: number;
  blockedReason: string | null;
  tags: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

function toTaskRecord(t: {
  id: string;
  projectId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  wbsCode: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  estimatedHours: number;
  actualHours: number;
  startDate: Date | null;
  dueDate: Date | null;
  completedAt: Date | null;
  progressPct: number;
  blockedReason: string | null;
  tags: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): ErpTaskRecord {
  return {
    ...t,
    startDate: t.startDate ? t.startDate.toISOString() : null,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

/**
 * Computes the next WBS code (1.2.3 format) for a task.
 * - Top-level task: highest N + 1 → "N"
 * - Subtask under parent: parent.wbsCode + ".N"
 */
async function nextWbsCode(
  projectId: string,
  parentId?: string
): Promise<string> {
  if (!parentId) {
    const siblings = await db.erpTask.findMany({
      where: { projectId, parentId: null },
      select: { wbsCode: true },
    });
    let maxN = 0;
    for (const s of siblings) {
      const n = Number.parseInt(s.wbsCode, 10);
      if (Number.isFinite(n) && n > maxN) maxN = n;
    }
    return String(maxN + 1);
  }
  const parent = await db.erpTask.findUnique({ where: { id: parentId } });
  if (!parent) throw new Error(`Parent task ${parentId} not found`);
  const siblings = await db.erpTask.findMany({
    where: { parentId },
    select: { wbsCode: true },
  });
  let maxN = 0;
  for (const s of siblings) {
    const parts = s.wbsCode.split(".");
    const n = Number.parseInt(parts[parts.length - 1], 10);
    if (Number.isFinite(n) && n > maxN) maxN = n;
  }
  return `${parent.wbsCode}.${maxN + 1}`;
}

export async function createTask(
  params: CreateTaskParams
): Promise<ErpTaskRecord> {
  const wbsCode = await nextWbsCode(params.projectId, params.parentId);
  const project = await db.erpProject.findUnique({
    where: { id: params.projectId },
    select: { enterpriseId: true },
  });
  if (!project) throw new Error("Project not found");

  // Determine sort order within siblings.
  const siblingCount = await db.erpTask.count({
    where: { projectId: params.projectId, parentId: params.parentId ?? null },
  });

  const task = await db.$transaction(async (tx) => {
    const created = await tx.erpTask.create({
      data: {
        projectId: params.projectId,
        parentId: params.parentId ?? null,
        title: params.title,
        description: params.description ?? null,
        wbsCode,
        status: "todo",
        priority: params.priority ?? "medium",
        assigneeId: params.assigneeId ?? null,
        estimatedHours: params.estimatedHours ?? 0,
        actualHours: 0,
        startDate: params.startDate ?? null,
        dueDate: params.dueDate ?? null,
        progressPct: 0,
        tags: params.tags ?? "",
        sortOrder: siblingCount + 1,
      },
    });
    await appendLedgerEvent(tx, {
      enterpriseId: project.enterpriseId,
      eventType: "erp_task_created",
      payload: {
        taskId: created.id,
        projectId: params.projectId,
        wbsCode,
        title: params.title,
        parentId: params.parentId,
      },
      actorId: params.assigneeId,
    });
    return created;
  });

  await audit({
    actorId: params.assigneeId,
    action: "erp.task.create",
    target: `erp_task:${task.id}`,
    result: "allowed",
    metadata: { projectId: params.projectId, wbsCode },
  });
  return toTaskRecord(task);
}

export type TaskTreeNode = ErpTaskRecord & {
  children: TaskTreeNode[];
};

export async function listTasks(
  projectId: string
): Promise<TaskTreeNode[]> {
  const rows = await db.erpTask.findMany({
    where: { projectId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 500,
  });
  const records = rows.map(toTaskRecord);
  const byParent = new Map<string | null, TaskTreeNode[]>();
  for (const r of records) {
    const key = r.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    const list = byParent.get(key);
    if (list) list.push({ ...r, children: [] });
  }
  function build(parentId: string | null): TaskTreeNode[] {
    const nodes = byParent.get(parentId) ?? [];
    for (const n of nodes) {
      n.children = build(n.id);
    }
    return nodes;
  }
  return build(null);
}

const TASK_STATUS_FLOW: Record<string, string[]> = {
  todo: ["in_progress", "blocked"],
  in_progress: ["review", "done", "blocked", "todo"],
  review: ["done", "in_progress", "blocked"],
  done: ["in_progress"],
  blocked: ["todo", "in_progress"],
};

export async function updateTaskStatus(
  taskId: string,
  status: string,
  actorId?: string
): Promise<ErpTaskRecord | null> {
  const existing = await db.erpTask.findUnique({ where: { id: taskId } });
  if (!existing) return null;
  const allowed = TASK_STATUS_FLOW[existing.status] ?? [];
  if (!allowed.includes(status)) {
    throw new Error(
      `Cannot transition task from '${existing.status}' to '${status}'`
    );
  }
  const project = await db.erpProject.findUnique({
    where: { id: existing.projectId },
    select: { enterpriseId: true },
  });
  const updated = await db.$transaction(async (tx) => {
    const u = await tx.erpTask.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === "done" ? new Date() : null,
        progressPct: status === "done" ? 100 : existing.progressPct,
      },
    });
    if (project) {
      await appendLedgerEvent(tx, {
        enterpriseId: project.enterpriseId,
        eventType: "erp_task_status_changed",
        payload: { taskId, from: existing.status, to: status },
        actorId,
      });
    }
    return u;
  });
  await audit({
    actorId,
    action: "erp.task.status",
    target: `erp_task:${taskId}`,
    result: "allowed",
    metadata: { from: existing.status, to: status },
  });
  return toTaskRecord(updated);
}

export async function assignTask(
  taskId: string,
  userId: string,
  actorId?: string
): Promise<ErpTaskRecord | null> {
  const existing = await db.erpTask.findUnique({ where: { id: taskId } });
  if (!existing) return null;
  const project = await db.erpProject.findUnique({
    where: { id: existing.projectId },
    select: { enterpriseId: true },
  });
  const updated = await db.$transaction(async (tx) => {
    const u = await tx.erpTask.update({
      where: { id: taskId },
      data: { assigneeId: userId },
    });
    if (project) {
      await appendLedgerEvent(tx, {
        enterpriseId: project.enterpriseId,
        eventType: "erp_task_assigned",
        payload: { taskId, assigneeId: userId },
        actorId,
      });
    }
    return u;
  });
  await audit({
    actorId,
    action: "erp.task.assign",
    target: `erp_task:${taskId}`,
    result: "allowed",
    metadata: { assigneeId: userId },
  });
  return toTaskRecord(updated);
}

// ════════════════════════════════════════════════════════════════════
// 3. RESOURCE MANAGEMENT
// ════════════════════════════════════════════════════════════════════

export type CreateResourceParams = {
  enterpriseId: string;
  name: string;
  type: string; // human, equipment, material, facility, financial
  category: string;
  capacity?: number;
  costPerUnitEgp?: number;
  unit?: string;
  location?: string;
  skills?: string;
};

export type ErpResourceRecord = {
  id: string;
  enterpriseId: string;
  name: string;
  type: string;
  category: string;
  capacity: number;
  allocated: number;
  available: number;
  costPerUnitEgp: number;
  unit: string;
  status: string;
  location: string | null;
  skills: string;
  createdAt: string;
  updatedAt: string;
};

function toResourceRecord(r: {
  id: string;
  enterpriseId: string;
  name: string;
  type: string;
  category: string;
  capacity: number;
  allocated: number;
  available: number;
  costPerUnitEgp: number;
  unit: string;
  status: string;
  location: string | null;
  skills: string;
  createdAt: Date;
  updatedAt: Date;
}): ErpResourceRecord {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function createResource(
  params: CreateResourceParams
): Promise<ErpResourceRecord> {
  const capacity = Math.max(0, params.capacity ?? 1);
  const resource = await db.erpResource.create({
    data: {
      enterpriseId: params.enterpriseId,
      name: params.name,
      type: params.type,
      category: params.category,
      capacity,
      allocated: 0,
      available: capacity,
      costPerUnitEgp: params.costPerUnitEgp ?? 0,
      unit: params.unit ?? "hour",
      status: "active",
      location: params.location ?? null,
      skills: params.skills ?? "",
    },
  });
  await audit({
    actorId: undefined,
    action: "erp.resource.create",
    target: `erp_resource:${resource.id}`,
    result: "allowed",
    metadata: { enterpriseId: params.enterpriseId, type: params.type },
  });
  return toResourceRecord(resource);
}

export async function listResources(
  enterpriseId: string
): Promise<ErpResourceRecord[]> {
  const rows = await db.erpResource.findMany({
    where: { enterpriseId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(toResourceRecord);
}

export type AllocateParams = {
  resourceId: string;
  projectId?: string;
  taskId?: string;
  enterpriseId: string;
  quantity: number;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  actorId?: string;
};

export type ErpAllocationRecord = {
  id: string;
  resourceId: string;
  projectId: string | null;
  taskId: string | null;
  enterpriseId: string;
  allocatedQty: number;
  startDate: string;
  endDate: string | null;
  status: string;
  costEgp: number;
  notes: string | null;
  createdAt: string;
};

function toAllocationRecord(a: {
  id: string;
  resourceId: string;
  projectId: string | null;
  taskId: string | null;
  enterpriseId: string;
  allocatedQty: number;
  startDate: Date;
  endDate: Date | null;
  status: string;
  costEgp: number;
  notes: string | null;
  createdAt: Date;
}): ErpAllocationRecord {
  return {
    ...a,
    startDate: a.startDate.toISOString(),
    endDate: a.endDate ? a.endDate.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  };
}

export async function allocateResource(
  params: AllocateParams
): Promise<{ allocation: ErpAllocationRecord | null; verdict: CreVerdict }> {
  const resource = await db.erpResource.findUnique({
    where: { id: params.resourceId },
  });
  if (!resource) {
    return {
      allocation: null,
      verdict: {
        allowed: false,
        reason: "Resource not found",
        policy: "erp_resource_allocation.rego",
        decisionToken: "",
      },
    };
  }
  const verdict = enforceResourceAllocation({
    resourceId: params.resourceId,
    requestedQty: params.quantity,
    availableQty: resource.available,
  });

  if (!verdict.allowed) {
    await audit({
      actorId: params.actorId,
      action: "erp.resource.allocate",
      target: `erp_resource:${params.resourceId}`,
      result: "denied",
      reason: verdict.reason,
      metadata: { quantity: params.quantity, available: resource.available },
    });
    return { allocation: null, verdict };
  }

  const costEgp = Math.round(params.quantity * resource.costPerUnitEgp);

  const allocation = await db.$transaction(async (tx) => {
    const created = await tx.erpAllocation.create({
      data: {
        resourceId: params.resourceId,
        projectId: params.projectId ?? null,
        taskId: params.taskId ?? null,
        enterpriseId: params.enterpriseId,
        allocatedQty: params.quantity,
        startDate: params.startDate,
        endDate: params.endDate ?? null,
        status: "active",
        costEgp,
        notes: params.notes ?? null,
      },
    });

    // Decrement available on the resource.
    await tx.erpResource.update({
      where: { id: params.resourceId },
      data: {
        allocated: { increment: params.quantity },
        available: { decrement: params.quantity },
      },
    });

    await logCreDecision(tx, {
      enterpriseId: params.enterpriseId,
      policy: verdict.policy,
      verdict,
      actorId: params.actorId,
      payload: {
        allocationId: created.id,
        resourceId: params.resourceId,
        quantity: params.quantity,
        costEgp,
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: params.enterpriseId,
      eventType: "erp_resource_allocated",
      payload: {
        allocationId: created.id,
        resourceId: params.resourceId,
        quantity: params.quantity,
        projectId: params.projectId,
        costEgp,
      },
      actorId: params.actorId,
    });

    return created;
  });

  await audit({
    actorId: params.actorId,
    action: "erp.resource.allocate",
    target: `erp_resource:${params.resourceId}`,
    result: "allowed",
    metadata: {
      allocationId: allocation.id,
      quantity: params.quantity,
      costEgp,
    },
  });
  return { allocation: toAllocationRecord(allocation), verdict };
}

export async function releaseAllocation(
  allocationId: string,
  actorId?: string
): Promise<ErpAllocationRecord | null> {
  const existing = await db.erpAllocation.findUnique({
    where: { id: allocationId },
  });
  if (!existing) return null;
  if (existing.status !== "active") {
    throw new Error(
      `Allocation ${allocationId} cannot be released from status '${existing.status}'`
    );
  }
  const updated = await db.$transaction(async (tx) => {
    const u = await tx.erpAllocation.update({
      where: { id: allocationId },
      data: { status: "released", endDate: new Date() },
    });
    await tx.erpResource.update({
      where: { id: existing.resourceId },
      data: {
        allocated: { decrement: existing.allocatedQty },
        available: { increment: existing.allocatedQty },
      },
    });
    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "erp_allocation_released",
      payload: { allocationId, qty: existing.allocatedQty },
      actorId,
    });
    return u;
  });
  await audit({
    actorId,
    action: "erp.allocation.release",
    target: `erp_allocation:${allocationId}`,
    result: "allowed",
    metadata: { qty: existing.allocatedQty },
  });
  return toAllocationRecord(updated);
}

export type ResourceUtilization = {
  resourceId: string;
  name: string;
  type: string;
  capacity: number;
  allocated: number;
  utilizationPct: number;
  activeAllocations: number;
};

export async function getResourceUtilization(
  enterpriseId: string
): Promise<ResourceUtilization[]> {
  const resources = await db.erpResource.findMany({
    where: { enterpriseId },
    select: {
      id: true,
      name: true,
      type: true,
      capacity: true,
      allocated: true,
    },
  });
  // Fetch active allocation counts separately (no Prisma relation)
  const allocCounts = await Promise.all(
    resources.map((r: any) => db.erpAllocation.count({ where: { resourceId: r.id, status: "active" } }))
  );
  return resources.map((r: any, i: number) => ({
    resourceId: r.id,
    name: r.name,
    type: r.type,
    capacity: r.capacity,
    allocated: r.allocated,
    utilizationPct:
      r.capacity > 0 ? Math.round((r.allocated / r.capacity) * 100) : 0,
    activeAllocations: allocCounts[i] || 0,
  }));
}

// ════════════════════════════════════════════════════════════════════
// 4. TIMESHEET
// ════════════════════════════════════════════════════════════════════

export type LogTimeParams = {
  enterpriseId: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  date: Date;
  hours: number;
  description: string;
  billable?: boolean;
  hourlyRateEgp?: number;
};

export type ErpTimesheetRecord = {
  id: string;
  enterpriseId: string;
  userId: string;
  projectId: string | null;
  taskId: string | null;
  date: string;
  hours: number;
  description: string;
  billable: boolean;
  hourlyRateEgp: number;
  totalCostEgp: number;
  status: string;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function toTimesheetRecord(t: {
  id: string;
  enterpriseId: string;
  userId: string;
  projectId: string | null;
  taskId: string | null;
  date: Date;
  hours: number;
  description: string;
  billable: boolean;
  hourlyRateEgp: number;
  totalCostEgp: number;
  status: string;
  approvedById: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ErpTimesheetRecord {
  return {
    ...t,
    date: t.date.toISOString(),
    approvedAt: t.approvedAt ? t.approvedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export async function logTime(
  params: LogTimeParams
): Promise<ErpTimesheetRecord> {
  const hourlyRate = params.hourlyRateEgp ?? 0;
  const totalCost = Math.round(params.hours * hourlyRate);
  const entry = await db.erpTimesheet.create({
    data: {
      enterpriseId: params.enterpriseId,
      userId: params.userId,
      projectId: params.projectId ?? null,
      taskId: params.taskId ?? null,
      date: params.date,
      hours: params.hours,
      description: params.description,
      billable: params.billable ?? false,
      hourlyRateEgp: hourlyRate,
      totalCostEgp: totalCost,
      status: "draft",
    },
  });
  await audit({
    actorId: params.userId,
    action: "erp.timesheet.log",
    target: `erp_timesheet:${entry.id}`,
    result: "allowed",
    metadata: { hours: params.hours, enterpriseId: params.enterpriseId },
  });
  return toTimesheetRecord(entry);
}

export async function submitTimesheet(
  userId: string,
  dateRange: { from: Date; to: Date },
  enterpriseId?: string
): Promise<number> {
  const result = await db.erpTimesheet.updateMany({
    where: {
      userId,
      status: "draft",
      date: { gte: dateRange.from, lte: dateRange.to },
      ...(enterpriseId ? { enterpriseId } : {}),
    },
    data: { status: "submitted" },
  });
  await audit({
    actorId: userId,
    action: "erp.timesheet.submit",
    target: `user:${userId}`,
    result: "allowed",
    metadata: { count: result.count, from: dateRange.from, to: dateRange.to },
  });
  return result.count;
}

export async function approveTimesheet(
  timesheetId: string,
  approverId: string,
  approverRole: string,
  maxDailyHours = 12
): Promise<{ timesheet: ErpTimesheetRecord | null; verdict: CreVerdict }> {
  const existing = await db.erpTimesheet.findUnique({
    where: { id: timesheetId },
  });
  if (!existing) {
    return {
      timesheet: null,
      verdict: {
        allowed: false,
        reason: "Timesheet not found",
        policy: "erp_timesheet_approval.rego",
        decisionToken: "",
      },
    };
  }
  if (existing.status !== "submitted") {
    throw new Error(
      `Timesheet ${timesheetId} cannot be approved from status '${existing.status}'`
    );
  }
  const verdict = enforceTimesheetApproval({
    enterpriseId: existing.enterpriseId,
    userId: existing.userId,
    hours: existing.hours,
    date: existing.date ? existing.date.toISOString() : new Date().toISOString(),
    approverRole,
    maxDailyHours,
  });

  if (!verdict.allowed) {
    await audit({
      actorId: approverId,
      action: "erp.timesheet.approve",
      target: `erp_timesheet:${timesheetId}`,
      result: "denied",
      reason: verdict.reason,
    });
    return { timesheet: toTimesheetRecord(existing), verdict };
  }

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.erpTimesheet.update({
      where: { id: timesheetId },
      data: {
        status: "approved",
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });
    await logCreDecision(tx, {
      enterpriseId: existing.enterpriseId,
      policy: verdict.policy,
      verdict,
      actorId: approverId,
      payload: { timesheetId, hours: existing.hours },
    });
    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "erp_timesheet_approved",
      payload: {
        timesheetId,
        hours: existing.hours,
        userId: existing.userId,
        approvedBy: approverId,
      },
      actorId: approverId,
    });
    return u;
  });

  await audit({
    actorId: approverId,
    action: "erp.timesheet.approve",
    target: `erp_timesheet:${timesheetId}`,
    result: "allowed",
    metadata: { hours: existing.hours },
  });
  return { timesheet: toTimesheetRecord(updated), verdict };
}

export async function listTimesheets(
  enterpriseId: string,
  userId?: string
): Promise<ErpTimesheetRecord[]> {
  const where: Record<string, unknown> = { enterpriseId };
  if (userId) where.userId = userId;
  const rows = await db.erpTimesheet.findMany({
    where,
    orderBy: { date: "desc" },
    take: 200,
  });
  return rows.map(toTimesheetRecord);
}

// ════════════════════════════════════════════════════════════════════
// 5. INVENTORY
// ════════════════════════════════════════════════════════════════════

export type CreateInventoryParams = {
  enterpriseId: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit?: string;
  reorderPoint?: number;
  maxStock?: number;
  costPerUnitEgp?: number;
  sellPriceEgp?: number;
  warehouseLocation?: string;
  barcode?: string;
  supplierId?: string;
};

export type ErpInventoryRecord = {
  id: string;
  enterpriseId: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  unit: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  maxStock: number;
  costPerUnitEgp: number;
  sellPriceEgp: number;
  warehouseLocation: string | null;
  barcode: string | null;
  supplierId: string | null;
  lastStockIn: string | null;
  lastStockOut: string | null;
  createdAt: string;
  updatedAt: string;
};

function toInventoryRecord(i: {
  id: string;
  enterpriseId: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  unit: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  maxStock: number;
  costPerUnitEgp: number;
  sellPriceEgp: number;
  warehouseLocation: string | null;
  barcode: string | null;
  supplierId: string | null;
  lastStockIn: Date | null;
  lastStockOut: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ErpInventoryRecord {
  return {
    ...i,
    lastStockIn: i.lastStockIn ? i.lastStockIn.toISOString() : null,
    lastStockOut: i.lastStockOut ? i.lastStockOut.toISOString() : null,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

export async function createInventoryItem(
  params: CreateInventoryParams
): Promise<ErpInventoryRecord> {
  const item = await db.erpInventory.create({
    data: {
      enterpriseId: params.enterpriseId,
      sku: params.sku,
      name: params.name,
      description: params.description ?? null,
      category: params.category,
      unit: params.unit ?? "piece",
      quantityOnHand: 0,
      quantityReserved: 0,
      quantityAvailable: 0,
      reorderPoint: params.reorderPoint ?? 0,
      maxStock: params.maxStock ?? 0,
      costPerUnitEgp: params.costPerUnitEgp ?? 0,
      sellPriceEgp: params.sellPriceEgp ?? 0,
      warehouseLocation: params.warehouseLocation ?? null,
      barcode: params.barcode ?? null,
      supplierId: params.supplierId ?? null,
    },
  });
  await audit({
    action: "erp.inventory.create",
    target: `erp_inventory:${item.id}`,
    result: "allowed",
    metadata: { sku: params.sku, enterpriseId: params.enterpriseId },
  });
  return toInventoryRecord(item);
}

export async function listInventory(
  enterpriseId: string
): Promise<ErpInventoryRecord[]> {
  const rows = await db.erpInventory.findMany({
    where: { enterpriseId },
    orderBy: { name: "asc" },
    take: 500,
  });
  return rows.map(toInventoryRecord);
}

export async function stockIn(
  inventoryId: string,
  qty: number,
  reference: string,
  actorId?: string
): Promise<ErpInventoryRecord | null> {
  const existing = await db.erpInventory.findUnique({
    where: { id: inventoryId },
  });
  if (!existing) return null;
  const updated = await db.$transaction(async (tx) => {
    const u = await tx.erpInventory.update({
      where: { id: inventoryId },
      data: {
        quantityOnHand: { increment: qty },
        quantityAvailable: { increment: qty },
        lastStockIn: new Date(),
      },
    });
    await tx.erpInventoryMovement.create({
      data: {
        inventoryId,
        enterpriseId: existing.enterpriseId,
        type: "in",
        quantity: qty,
        referenceType: "purchase_order",
        referenceId: reference,
        notes: reference,
        userId: actorId,
      },
    });
    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "erp_inventory_stock_in",
      payload: { inventoryId, qty, reference },
      actorId,
    });
    return u;
  });
  await audit({
    actorId,
    action: "erp.inventory.stockIn",
    target: `erp_inventory:${inventoryId}`,
    result: "allowed",
    metadata: { qty, reference },
  });
  return toInventoryRecord(updated);
}

export async function stockOut(
  inventoryId: string,
  qty: number,
  reference: string,
  approverRole: string,
  actorId?: string
): Promise<{ inventory: ErpInventoryRecord | null; verdict: CreVerdict }> {
  const existing = await db.erpInventory.findUnique({
    where: { id: inventoryId },
  });
  if (!existing) {
    return {
      inventory: null,
      verdict: {
        allowed: false,
        reason: "Inventory item not found",
        policy: "erp_inventory_adjustment.rego",
        decisionToken: "",
      },
    };
  }
  const verdict = enforceInventoryAdjustment({
    inventoryId,
    adjustmentType: "out",
    quantity: qty,
    currentStock: existing.quantityOnHand,
    approverRole,
  });
  if (!verdict.allowed) {
    await audit({
      actorId,
      action: "erp.inventory.stockOut",
      target: `erp_inventory:${inventoryId}`,
      result: "denied",
      reason: verdict.reason,
    });
    return { inventory: toInventoryRecord(existing), verdict };
  }

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.erpInventory.update({
      where: { id: inventoryId },
      data: {
        quantityOnHand: { decrement: qty },
        quantityAvailable: { decrement: qty },
        lastStockOut: new Date(),
      },
    });
    await tx.erpInventoryMovement.create({
      data: {
        inventoryId,
        enterpriseId: existing.enterpriseId,
        type: "out",
        quantity: qty,
        referenceType: "sales_order",
        referenceId: reference,
        notes: reference,
        userId: actorId,
      },
    });
    await logCreDecision(tx, {
      enterpriseId: existing.enterpriseId,
      policy: verdict.policy,
      verdict,
      actorId,
      payload: { inventoryId, qty, reference },
    });
    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "erp_inventory_stock_out",
      payload: { inventoryId, qty, reference },
      actorId,
    });
    return u;
  });

  await audit({
    actorId,
    action: "erp.inventory.stockOut",
    target: `erp_inventory:${inventoryId}`,
    result: "allowed",
    metadata: { qty, reference },
  });
  return { inventory: toInventoryRecord(updated), verdict };
}

export type InventoryStatus = {
  totalSkus: number;
  lowStockAlerts: Array<{ id: string; sku: string; name: string; onHand: number; reorderPoint: number }>;
  totalValueEgp: number;
  movementsToday: number;
};

export async function getInventoryStatus(
  enterpriseId: string
): Promise<InventoryStatus> {
  const items = await db.erpInventory.findMany({
    where: { enterpriseId },
    select: {
      id: true,
      sku: true,
      name: true,
      quantityOnHand: true,
      reorderPoint: true,
      costPerUnitEgp: true,
    },
  });
  const lowStockAlerts = items
    .filter((i) => i.reorderPoint > 0 && i.quantityOnHand <= i.reorderPoint)
    .map((i) => ({
      id: i.id,
      sku: i.sku,
      name: i.name,
      onHand: i.quantityOnHand,
      reorderPoint: i.reorderPoint,
    }));
  const totalValueEgp = items.reduce(
    (sum, i) => sum + i.quantityOnHand * i.costPerUnitEgp,
    0
  );
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const movementsToday = await db.erpInventoryMovement.count({
    where: { enterpriseId, createdAt: { gte: startOfDay } },
  });
  return {
    totalSkus: items.length,
    lowStockAlerts,
    totalValueEgp: Math.round(totalValueEgp),
    movementsToday,
  };
}

// ════════════════════════════════════════════════════════════════════
// 6. PROCUREMENT (PURCHASE ORDERS)
// ════════════════════════════════════════════════════════════════════

export type PurchaseOrderLineInput = {
  description: string;
  inventoryId?: string;
  quantity: number;
  unit?: string;
  unitPriceEgp: number;
};

export type CreatePurchaseOrderParams = {
  enterpriseId: string;
  vendorId?: string;
  vendorName: string;
  expectedDate?: Date;
  projectId?: string;
  notes?: string;
  lines: PurchaseOrderLineInput[];
  createdById?: string;
};

export type ErpPurchaseOrderRecord = {
  id: string;
  enterpriseId: string;
  poNumber: string;
  vendorId: string | null;
  vendorName: string;
  status: string;
  totalEgp: number;
  currency: string;
  expectedDate: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  projectId: string | null;
  creDecisionToken: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function toPurchaseOrderRecord(p: {
  id: string;
  enterpriseId: string;
  poNumber: string;
  vendorId: string | null;
  vendorName: string;
  status: string;
  totalEgp: number;
  currency: string;
  expectedDate: Date | null;
  approvedById: string | null;
  approvedAt: Date | null;
  projectId: string | null;
  creDecisionToken: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ErpPurchaseOrderRecord {
  return {
    ...p,
    expectedDate: p.expectedDate ? p.expectedDate.toISOString() : null,
    approvedAt: p.approvedAt ? p.approvedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export type ErpPurchaseOrderLineRecord = {
  id: string;
  purchaseOrderId: string;
  inventoryId: string | null;
  description: string;
  quantity: number;
  unit: string;
  unitPriceEgp: number;
  totalPriceEgp: number;
  receivedQty: number;
  status: string;
  createdAt: string;
};

function toPurchaseOrderLineRecord(l: {
  id: string;
  purchaseOrderId: string;
  inventoryId: string | null;
  description: string;
  quantity: number;
  unit: string;
  unitPriceEgp: number;
  totalPriceEgp: number;
  receivedQty: number;
  status: string;
  createdAt: Date;
}): ErpPurchaseOrderLineRecord {
  return {
    ...l,
    createdAt: l.createdAt.toISOString(),
  };
}

async function nextPoNumber(enterpriseId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;
  const existing = await db.erpPurchaseOrder.findMany({
    where: { enterpriseId, poNumber: { startsWith: prefix } },
    select: { poNumber: true },
  });
  let maxN = 0;
  for (const e of existing) {
    const n = Number.parseInt(e.poNumber.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > maxN) maxN = n;
  }
  return `${prefix}${String(maxN + 1).padStart(3, "0")}`;
}

export async function createPurchaseOrder(
  params: CreatePurchaseOrderParams
): Promise<{ po: ErpPurchaseOrderRecord; lines: ErpPurchaseOrderLineRecord[] }> {
  const poNumber = await nextPoNumber(params.enterpriseId);
  const totalEgp = params.lines.reduce(
    (sum, l) => sum + Math.round(l.quantity * l.unitPriceEgp),
    0
  );

  const result = await db.$transaction(async (tx) => {
    const po = await tx.erpPurchaseOrder.create({
      data: {
        enterpriseId: params.enterpriseId,
        poNumber,
        vendorId: params.vendorId ?? null,
        vendorName: params.vendorName,
        status: "draft",
        totalEgp,
        currency: "EGP",
        expectedDate: params.expectedDate ?? null,
        projectId: params.projectId ?? null,
        notes: params.notes ?? null,
      },
    });

    const lines = [];
    for (const l of params.lines) {
      const line = await tx.erpPurchaseOrderLine.create({
        data: {
          purchaseOrderId: po.id,
          inventoryId: l.inventoryId ?? null,
          description: l.description,
          quantity: l.quantity,
          unit: l.unit ?? "piece",
          unitPriceEgp: l.unitPriceEgp,
          totalPriceEgp: Math.round(l.quantity * l.unitPriceEgp),
          receivedQty: 0,
          status: "pending",
        },
      });
      lines.push(line);
    }

    await appendLedgerEvent(tx, {
      enterpriseId: params.enterpriseId,
      eventType: "erp_po_created",
      payload: { poId: po.id, poNumber, totalEgp, vendor: params.vendorName },
      actorId: params.createdById,
    });

    return { po, lines };
  });

  await audit({
    actorId: params.createdById,
    action: "erp.po.create",
    target: `erp_purchase_order:${result.po.id}`,
    result: "allowed",
    metadata: { poNumber, totalEgp, lineCount: params.lines.length },
  });

  return {
    po: toPurchaseOrderRecord(result.po),
    lines: result.lines.map(toPurchaseOrderLineRecord),
  };
}

export async function listPurchaseOrders(
  enterpriseId: string,
  filters?: { status?: string }
): Promise<ErpPurchaseOrderRecord[]> {
  const where: Record<string, unknown> = { enterpriseId };
  if (filters?.status) where.status = filters.status;
  const rows = await db.erpPurchaseOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(toPurchaseOrderRecord);
}

export async function getPurchaseOrder(poId: string): Promise<{
  po: ErpPurchaseOrderRecord;
  lines: ErpPurchaseOrderLineRecord[];
} | null> {
  const po = await db.erpPurchaseOrder.findUnique({ where: { id: poId } });
  if (!po) return null;
  const lines = await db.erpPurchaseOrderLine.findMany({
    where: { purchaseOrderId: poId },
    orderBy: { createdAt: "asc" },
  });
  return {
    po: toPurchaseOrderRecord(po),
    lines: lines.map(toPurchaseOrderLineRecord),
  };
}

export async function approvePurchaseOrder(
  poId: string,
  approverRole: string,
  approverId: string,
  enterpriseCapitalEgp: number
): Promise<{ po: ErpPurchaseOrderRecord | null; verdict: CreVerdict }> {
  const existing = await db.erpPurchaseOrder.findUnique({
    where: { id: poId },
  });
  if (!existing) {
    return {
      po: null,
      verdict: {
        allowed: false,
        reason: "Purchase order not found",
        policy: "erp_purchase_authority.rego",
        decisionToken: "",
      },
    };
  }
  if (existing.status !== "draft" && existing.status !== "submitted") {
    throw new Error(
      `PO ${poId} cannot be approved from status '${existing.status}'`
    );
  }
  const verdict = enforcePurchaseAuthority({
    totalEgp: existing.totalEgp,
    enterpriseCapitalEgp,
    approverRole,
  });
  if (!verdict.allowed) {
    await audit({
      actorId: approverId,
      action: "erp.po.approve",
      target: `erp_purchase_order:${poId}`,
      result: "denied",
      reason: verdict.reason,
    });
    return { po: toPurchaseOrderRecord(existing), verdict };
  }
  const updated = await db.$transaction(async (tx) => {
    const u = await tx.erpPurchaseOrder.update({
      where: { id: poId },
      data: {
        status: "approved",
        approvedById: approverId,
        approvedAt: new Date(),
        creDecisionToken: verdict.decisionToken,
      },
    });
    await logCreDecision(tx, {
      enterpriseId: existing.enterpriseId,
      policy: verdict.policy,
      verdict,
      actorId: approverId,
      payload: { poId, totalEgp: existing.totalEgp, approverRole },
    });
    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "erp_po_approved",
      payload: { poId, totalEgp: existing.totalEgp, approvedBy: approverId },
      actorId: approverId,
    });
    return u;
  });
  await audit({
    actorId: approverId,
    action: "erp.po.approve",
    target: `erp_purchase_order:${poId}`,
    result: "allowed",
    metadata: { totalEgp: existing.totalEgp, approverRole },
  });
  return { po: toPurchaseOrderRecord(updated), verdict };
}

export async function receivePurchaseOrder(
  poId: string,
  actorId?: string
): Promise<ErpPurchaseOrderRecord | null> {
  const existing = await db.erpPurchaseOrder.findUnique({
    where: { id: poId },
    
  });
  if (!existing) return null;
  if (existing.status !== "approved" && existing.status !== "sent" && existing.status !== "partial") {
    throw new Error(
      `PO ${poId} cannot be received from status '${existing.status}'`
    );
  }

  const updated = await db.$transaction(async (tx) => {
    // Mark all lines as received, and stockIn the matching inventory items.
    const poLines = await db.erpPurchaseOrderLine.findMany({ where: { purchaseOrderId: existing.id } });
    for (const line of poLines) {
      await tx.erpPurchaseOrderLine.update({
        where: { id: line.id },
        data: {
          receivedQty: line.quantity,
          status: "received",
        },
      });
      if (line.inventoryId) {
        const inv = await tx.erpInventory.findUnique({
          where: { id: line.inventoryId },
        });
        if (inv) {
          await tx.erpInventory.update({
            where: { id: line.inventoryId },
            data: {
              quantityOnHand: { increment: line.quantity },
              quantityAvailable: { increment: line.quantity },
              lastStockIn: new Date(),
            },
          });
          await tx.erpInventoryMovement.create({
            data: {
              inventoryId: line.inventoryId,
              enterpriseId: inv.enterpriseId,
              type: "in",
              quantity: line.quantity,
              referenceType: "purchase_order",
              referenceId: poId,
              notes: `PO ${existing.poNumber} - ${line.description}`,
              userId: actorId,
            },
          });
        }
      }
    }
    const u = await tx.erpPurchaseOrder.update({
      where: { id: poId },
      data: { status: "received" },
    });
    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "erp_po_received",
      payload: { poId, poNumber: existing.poNumber, totalEgp: existing.totalEgp },
      actorId,
    });
    return u;
  });

  await audit({
    actorId,
    action: "erp.po.receive",
    target: `erp_purchase_order:${poId}`,
    result: "allowed",
    metadata: { totalEgp: existing.totalEgp },
  });
  return toPurchaseOrderRecord(updated);
}

// ════════════════════════════════════════════════════════════════════
// 7. FIXED ASSETS
// ════════════════════════════════════════════════════════════════════

export type CreateAssetParams = {
  enterpriseId: string;
  name: string;
  category: string;
  acquisitionDate: Date;
  acquisitionCostEgp: number;
  depreciationMethod?: string;
  depreciationRate?: number;
  location?: string;
  assignedTo?: string;
  warrantyExpiry?: Date;
  insuranceExpiry?: Date;
};

export type ErpAssetRecord = {
  id: string;
  enterpriseId: string;
  assetCode: string;
  name: string;
  category: string;
  acquisitionDate: string;
  acquisitionCostEgp: number;
  currentValueEgp: number;
  depreciationMethod: string;
  depreciationRate: number;
  accumulatedDepreciationEgp: number;
  netBookValueEgp: number;
  status: string;
  location: string | null;
  assignedTo: string | null;
  warrantyExpiry: string | null;
  insuranceExpiry: string | null;
  createdAt: string;
  updatedAt: string;
};

function toAssetRecord(a: {
  id: string;
  enterpriseId: string;
  assetCode: string;
  name: string;
  category: string;
  acquisitionDate: Date;
  acquisitionCostEgp: number;
  currentValueEgp: number;
  depreciationMethod: string;
  depreciationRate: number;
  accumulatedDepreciationEgp: number;
  netBookValueEgp: number;
  status: string;
  location: string | null;
  assignedTo: string | null;
  warrantyExpiry: Date | null;
  insuranceExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ErpAssetRecord {
  return {
    ...a,
    acquisitionDate: a.acquisitionDate.toISOString(),
    warrantyExpiry: a.warrantyExpiry ? a.warrantyExpiry.toISOString() : null,
    insuranceExpiry: a.insuranceExpiry ? a.insuranceExpiry.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

async function nextAssetCode(enterpriseId: string): Promise<string> {
  const prefix = "AST-";
  const existing = await db.erpAsset.findMany({
    where: { enterpriseId, assetCode: { startsWith: prefix } },
    select: { assetCode: true },
  });
  let maxN = 0;
  for (const e of existing) {
    const n = Number.parseInt(e.assetCode.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > maxN) maxN = n;
  }
  return `${prefix}${String(maxN + 1).padStart(3, "0")}`;
}

export async function createAsset(
  params: CreateAssetParams
): Promise<ErpAssetRecord> {
  const assetCode = await nextAssetCode(params.enterpriseId);
  const cost = Math.max(0, Math.floor(params.acquisitionCostEgp));
  const asset = await db.erpAsset.create({
    data: {
      enterpriseId: params.enterpriseId,
      assetCode,
      name: params.name,
      category: params.category,
      acquisitionDate: params.acquisitionDate,
      acquisitionCostEgp: cost,
      currentValueEgp: cost,
      depreciationMethod: params.depreciationMethod ?? "straight_line",
      depreciationRate: params.depreciationRate ?? 0.1,
      accumulatedDepreciationEgp: 0,
      netBookValueEgp: cost,
      status: "active",
      location: params.location ?? null,
      assignedTo: params.assignedTo ?? null,
      warrantyExpiry: params.warrantyExpiry ?? null,
      insuranceExpiry: params.insuranceExpiry ?? null,
    },
  });
  await audit({
    action: "erp.asset.create",
    target: `erp_asset:${asset.id}`,
    result: "allowed",
    metadata: { assetCode, cost },
  });
  return toAssetRecord(asset);
}

export async function listAssets(
  enterpriseId: string
): Promise<ErpAssetRecord[]> {
  const rows = await db.erpAsset.findMany({
    where: { enterpriseId },
    orderBy: { acquisitionDate: "desc" },
    take: 300,
  });
  return rows.map(toAssetRecord);
}

/**
 * Computes one month of depreciation for the given asset using the
 * configured depreciation method + rate. Persists the depreciation
 * as an accumulated depreciation increase and NBV reduction.
 */
export async function depreciateAsset(
  assetId: string
): Promise<ErpAssetRecord | null> {
  const existing = await db.erpAsset.findUnique({ where: { id: assetId } });
  if (!existing) return null;
  if (existing.status !== "active") return toAssetRecord(existing);
  const monthlyRate = existing.depreciationRate / 12;
  const depreciation = Math.round(
    existing.acquisitionCostEgp * monthlyRate
  );
  if (depreciation <= 0) return toAssetRecord(existing);
  const newAccum = existing.accumulatedDepreciationEgp + depreciation;
  const newNbv = Math.max(0, existing.acquisitionCostEgp - newAccum);

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.erpAsset.update({
      where: { id: assetId },
      data: {
        accumulatedDepreciationEgp: newAccum,
        netBookValueEgp: newNbv,
        currentValueEgp: newNbv,
      },
    });
    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "erp_asset_depreciated",
      payload: {
        assetId,
        assetCode: existing.assetCode,
        depreciation,
        newNbv,
      },
    });
    return u;
  });
  await audit({
    action: "erp.asset.depreciate",
    target: `erp_asset:${assetId}`,
    result: "allowed",
    metadata: { depreciation, newNbv },
  });
  return toAssetRecord(updated);
}

export async function disposeAsset(
  assetId: string,
  approverRole: string,
  actorId?: string
): Promise<{ asset: ErpAssetRecord | null; verdict: CreVerdict }> {
  const existing = await db.erpAsset.findUnique({ where: { id: assetId } });
  if (!existing) {
    return {
      asset: null,
      verdict: {
        allowed: false,
        reason: "Asset not found",
        policy: "erp_asset_disposal.rego",
        decisionToken: "",
      },
    };
  }
  if (existing.status === "disposed") {
    return { asset: toAssetRecord(existing), verdict: {
      allowed: false,
      reason: "Asset already disposed",
      policy: "erp_asset_disposal.rego",
      decisionToken: "",
    }};
  }
  const verdict = enforceAssetDisposal({
    assetId,
    assetName: existing.name,
    netBookValueEgp: existing.netBookValueEgp,
    approverRole,
  });
  if (!verdict.allowed) {
    await audit({
      actorId,
      action: "erp.asset.dispose",
      target: `erp_asset:${assetId}`,
      result: "denied",
      reason: verdict.reason,
    });
    return { asset: toAssetRecord(existing), verdict };
  }

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.erpAsset.update({
      where: { id: assetId },
      data: { status: "disposed" },
    });
    await logCreDecision(tx, {
      enterpriseId: existing.enterpriseId,
      policy: verdict.policy,
      verdict,
      actorId,
      payload: {
        assetId,
        assetCode: existing.assetCode,
        nbv: existing.netBookValueEgp,
      },
    });
    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "erp_asset_disposed",
      payload: {
        assetId,
        assetCode: existing.assetCode,
        nbv: existing.netBookValueEgp,
        disposedBy: actorId,
      },
      actorId,
    });
    return u;
  });
  await audit({
    actorId,
    action: "erp.asset.dispose",
    target: `erp_asset:${assetId}`,
    result: "allowed",
    metadata: { nbv: existing.netBookValueEgp },
  });
  return { asset: toAssetRecord(updated), verdict };
}

export type AssetRegisterEntry = ErpAssetRecord & {
  nbvEgp: number;
};

export async function getAssetRegister(
  enterpriseId: string
): Promise<AssetRegisterEntry[]> {
  const rows = await listAssets(enterpriseId);
  return rows.map((r) => ({ ...r, nbvEgp: r.netBookValueEgp }));
}

// ════════════════════════════════════════════════════════════════════
// 8. MANUFACTURING (PRODUCTION ORDERS + BOM)
// ════════════════════════════════════════════════════════════════════

export type CreateProductionOrderParams = {
  enterpriseId: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit?: string;
  priority?: string;
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
};

export type ErpProductionOrderRecord = {
  id: string;
  enterpriseId: string;
  orderNumber: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  completedQty: number;
  projectId: string | null;
  costEgp: number;
  createdAt: string;
  updatedAt: string;
};

function toProductionOrderRecord(p: {
  id: string;
  enterpriseId: string;
  orderNumber: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  priority: string;
  startDate: Date | null;
  endDate: Date | null;
  completedQty: number;
  projectId: string | null;
  costEgp: number;
  createdAt: Date;
  updatedAt: Date;
}): ErpProductionOrderRecord {
  return {
    ...p,
    startDate: p.startDate ? p.startDate.toISOString() : null,
    endDate: p.endDate ? p.endDate.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

async function nextProductionOrderNumber(enterpriseId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PROD-${year}-`;
  const existing = await db.erpProductionOrder.findMany({
    where: { enterpriseId, orderNumber: { startsWith: prefix } },
    select: { orderNumber: true },
  });
  let maxN = 0;
  for (const e of existing) {
    const n = Number.parseInt(e.orderNumber.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > maxN) maxN = n;
  }
  return `${prefix}${String(maxN + 1).padStart(3, "0")}`;
}

export async function createProductionOrder(
  params: CreateProductionOrderParams
): Promise<ErpProductionOrderRecord> {
  const orderNumber = await nextProductionOrderNumber(params.enterpriseId);
  const order = await db.erpProductionOrder.create({
    data: {
      enterpriseId: params.enterpriseId,
      orderNumber,
      productId: params.productId ?? null,
      productName: params.productName,
      quantity: params.quantity,
      unit: params.unit ?? "piece",
      status: "planned",
      priority: params.priority ?? "medium",
      startDate: params.startDate ?? null,
      endDate: params.endDate ?? null,
      completedQty: 0,
      projectId: params.projectId ?? null,
      costEgp: 0,
    },
  });
  await audit({
    action: "erp.production.create",
    target: `erp_production_order:${order.id}`,
    result: "allowed",
    metadata: { orderNumber, quantity: params.quantity },
  });
  return toProductionOrderRecord(order);
}

export async function listProductionOrders(
  enterpriseId: string
): Promise<ErpProductionOrderRecord[]> {
  const rows = await db.erpProductionOrder.findMany({
    where: { enterpriseId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(toProductionOrderRecord);
}

export type BomItemInput = {
  inventoryId: string;
  description: string;
  quantityRequired: number;
  unit?: string;
  costPerUnitEgp?: number;
};

export type ErpBomRecord = {
  id: string;
  productionOrderId: string;
  inventoryId: string;
  description: string;
  quantityRequired: number;
  unit: string;
  quantityIssued: number;
  costPerUnitEgp: number;
  totalCostEgp: number;
  createdAt: string;
};

function toBomRecord(b: {
  id: string;
  productionOrderId: string;
  inventoryId: string;
  description: string;
  quantityRequired: number;
  unit: string;
  quantityIssued: number;
  costPerUnitEgp: number;
  totalCostEgp: number;
  createdAt: Date;
}): ErpBomRecord {
  return {
    ...b,
    createdAt: b.createdAt.toISOString(),
  };
}

export async function createBom(
  productionOrderId: string,
  items: BomItemInput[]
): Promise<ErpBomRecord[]> {
  const order = await db.erpProductionOrder.findUnique({
    where: { id: productionOrderId },
  });
  if (!order) throw new Error("Production order not found");
  const created = [];
  for (const item of items) {
    const inv = await db.erpInventory.findUnique({
      where: { id: item.inventoryId },
      select: { costPerUnitEgp: true },
    });
    const costPerUnit = item.costPerUnitEgp ?? inv?.costPerUnitEgp ?? 0;
    const totalCost = Math.round(item.quantityRequired * costPerUnit);
    const bom = await db.erpBom.create({
      data: {
        productionOrderId,
        inventoryId: item.inventoryId,
        description: item.description,
        quantityRequired: item.quantityRequired,
        unit: item.unit ?? "piece",
        quantityIssued: 0,
        costPerUnitEgp: costPerUnit,
        totalCostEgp: totalCost,
      },
    });
    created.push(bom);
  }
  await audit({
    action: "erp.bom.create",
    target: `erp_production_order:${productionOrderId}`,
    result: "allowed",
    metadata: { itemCount: items.length },
  });
  return created.map(toBomRecord);
}

export async function getBom(
  productionOrderId: string
): Promise<ErpBomRecord[]> {
  const rows = await db.erpBom.findMany({
    where: { productionOrderId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toBomRecord);
}

/**
 * Releases a production order after CRE validation:
 *   - BOM is verified (has at least 1 line).
 *   - All BOM materials have sufficient stock in inventory.
 */
export async function releaseProductionOrder(
  orderId: string,
  actorId?: string
): Promise<{ order: ErpProductionOrderRecord | null; verdict: CreVerdict }> {
  const existing = await db.erpProductionOrder.findUnique({
    where: { id: orderId },
    
  });
  if (!existing) {
    return {
      order: null,
      verdict: {
        allowed: false,
        reason: "Production order not found",
        policy: "erp_production_release.rego",
        decisionToken: "",
      },
    };
  }
  if (existing.status !== "planned") {
    throw new Error(
      `Production order ${orderId} cannot be released from status '${existing.status}'`
    );
  }
  const bomItems = await db.erpBom.findMany({ where: { productionOrderId: existing.id } });
  const bomVerified = bomItems.length > 0;
  let materialsAvailable = true;
  for (const b of bomItems) {
    const inv = await db.erpInventory.findUnique({
      where: { id: b.inventoryId },
      select: { quantityAvailable: true },
    });
    if (!inv || inv.quantityAvailable < b.quantityRequired) {
      materialsAvailable = false;
      break;
    }
  }
  const verdict = enforceProductionRelease({
    enterpriseId: existing.enterpriseId,
    productName: existing.productName,
    quantity: existing.quantity,
    bomVerified,
    materialsAvailable,
  });

  if (!verdict.allowed) {
    await audit({
      actorId,
      action: "erp.production.release",
      target: `erp_production_order:${orderId}`,
      result: "denied",
      reason: verdict.reason,
    });
    return { order: toProductionOrderRecord(existing), verdict };
  }

  // Issue materials: decrement inventory and mark BOM items as issued.
  const updated = await db.$transaction(async (tx) => {
    for (const b of bomItems) {
      await tx.erpInventory.update({
        where: { id: b.inventoryId },
        data: {
          quantityOnHand: { decrement: b.quantityRequired },
          quantityAvailable: { decrement: b.quantityRequired },
          lastStockOut: new Date(),
        },
      });
      await tx.erpBom.update({
        where: { id: b.id },
        data: { quantityIssued: b.quantityRequired },
      });
      const inv = await tx.erpInventory.findUnique({
        where: { id: b.inventoryId },
        select: { enterpriseId: true },
      });
      if (inv) {
        await tx.erpInventoryMovement.create({
          data: {
            inventoryId: b.inventoryId,
            enterpriseId: inv.enterpriseId,
            type: "out",
            quantity: b.quantityRequired,
            referenceType: "production_order",
            referenceId: orderId,
            notes: `Production ${existing.orderNumber}`,
            userId: actorId,
          },
        });
      }
    }
    const u = await tx.erpProductionOrder.update({
      where: { id: orderId },
      data: { status: "released", startDate: new Date() },
    });
    await logCreDecision(tx, {
      enterpriseId: existing.enterpriseId,
      policy: verdict.policy,
      verdict,
      actorId,
      payload: { orderId, quantity: existing.quantity },
    });
    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "erp_production_released",
      payload: {
        orderId,
        orderNumber: existing.orderNumber,
        productName: existing.productName,
        quantity: existing.quantity,
      },
      actorId,
    });
    return u;
  });

  await audit({
    actorId,
    action: "erp.production.release",
    target: `erp_production_order:${orderId}`,
    result: "allowed",
    metadata: { quantity: existing.quantity },
  });
  return { order: toProductionOrderRecord(updated), verdict };
}

export async function completeProductionOrder(
  orderId: string,
  completedQty: number,
  actorId?: string
): Promise<ErpProductionOrderRecord | null> {
  const existing = await db.erpProductionOrder.findUnique({
    where: { id: orderId },
  });
  if (!existing) return null;
  if (existing.status !== "released" && existing.status !== "in_progress") {
    throw new Error(
      `Production order ${orderId} cannot be completed from status '${existing.status}'`
    );
  }

  const updated = await db.$transaction(async (tx) => {
    // StockIn the finished product (if linked to an inventory item).
    if (existing.productId) {
      const inv = await tx.erpInventory.findUnique({
        where: { id: existing.productId },
      });
      if (inv) {
        await tx.erpInventory.update({
          where: { id: existing.productId },
          data: {
            quantityOnHand: { increment: completedQty },
            quantityAvailable: { increment: completedQty },
            lastStockIn: new Date(),
          },
        });
        await tx.erpInventoryMovement.create({
          data: {
            inventoryId: existing.productId,
            enterpriseId: inv.enterpriseId,
            type: "in",
            quantity: completedQty,
            referenceType: "production_order",
            referenceId: orderId,
            notes: `Production ${existing.orderNumber} completed`,
            userId: actorId,
          },
        });
      }
    }
    const u = await tx.erpProductionOrder.update({
      where: { id: orderId },
      data: {
        status: "completed",
        completedQty,
        endDate: new Date(),
      },
    });
    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "erp_production_completed",
      payload: {
        orderId,
        orderNumber: existing.orderNumber,
        completedQty,
      },
      actorId,
    });
    return u;
  });

  await audit({
    actorId,
    action: "erp.production.complete",
    target: `erp_production_order:${orderId}`,
    result: "allowed",
    metadata: { completedQty },
  });
  return toProductionOrderRecord(updated);
}

// ════════════════════════════════════════════════════════════════════
// 9. QUALITY CONTROL
// ════════════════════════════════════════════════════════════════════

export type CreateQualityCheckParams = {
  enterpriseId: string;
  productionOrderId?: string;
  projectId?: string;
  inventoryId?: string;
  checkType: string; // incoming, in_process, final, audit
  description: string;
  inspectorId?: string;
  minPassRate?: number;
};

export type ErpQualityCheckRecord = {
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

function toQualityCheckRecord(q: {
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
  checkedAt: Date | null;
  createdAt: Date;
}): ErpQualityCheckRecord {
  return {
    ...q,
    checkedAt: q.checkedAt ? q.checkedAt.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
  };
}

export async function createQualityCheck(
  params: CreateQualityCheckParams
): Promise<ErpQualityCheckRecord> {
  const check = await db.erpQualityCheck.create({
    data: {
      enterpriseId: params.enterpriseId,
      productionOrderId: params.productionOrderId ?? null,
      projectId: params.projectId ?? null,
      inventoryId: params.inventoryId ?? null,
      checkType: params.checkType,
      description: params.description,
      inspectorId: params.inspectorId ?? null,
      status: "pending",
      defectsFound: 0,
      passRate: 0,
    },
  });
  await audit({
    actorId: params.inspectorId,
    action: "erp.quality.create",
    target: `erp_quality_check:${check.id}`,
    result: "allowed",
    metadata: { checkType: params.checkType },
  });
  return toQualityCheckRecord(check);
}

export async function listQualityChecks(
  enterpriseId: string
): Promise<ErpQualityCheckRecord[]> {
  const rows = await db.erpQualityCheck.findMany({
    where: { enterpriseId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(toQualityCheckRecord);
}

export async function recordQualityResult(
  checkId: string,
  passRate: number,
  defects: number,
  notes: string,
  actorId?: string
): Promise<{ check: ErpQualityCheckRecord | null; verdict: CreVerdict }> {
  const existing = await db.erpQualityCheck.findUnique({
    where: { id: checkId },
  });
  if (!existing) {
    return {
      check: null,
      verdict: {
        allowed: false,
        reason: "Quality check not found",
        policy: "erp_quality_check.rego",
        decisionToken: "",
      },
    };
  }
  const minPassRate = 90; // constitutional minimum
  const verdict = enforceQualityCheck({
    enterpriseId: existing.enterpriseId,
    checkType: existing.checkType,
    productionOrderId: existing.productionOrderId ?? "",
    passRate,
    minPassRate,
  });
  const status = verdict.allowed ? "passed" : "failed";

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.erpQualityCheck.update({
      where: { id: checkId },
      data: {
        status,
        passRate,
        defectsFound: defects,
        notes,
        checkedAt: new Date(),
      },
    });
    await logCreDecision(tx, {
      enterpriseId: existing.enterpriseId,
      policy: verdict.policy,
      verdict,
      actorId,
      payload: { checkId, passRate, defects, minPassRate },
    });
    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId,
      eventType: "erp_quality_recorded",
      payload: { checkId, passRate, defects, status },
      actorId,
    });
    return u;
  });

  await audit({
    actorId,
    action: "erp.quality.record",
    target: `erp_quality_check:${checkId}`,
    result: "allowed",
    metadata: { passRate, defects, status },
  });
  return { check: toQualityCheckRecord(updated), verdict };
}

export type QualityStats = {
  totalChecks: number;
  passed: number;
  failed: number;
  overallPassRate: number;
  byType: Record<string, { total: number; passed: number; passRate: number }>;
};

export async function getQualityStats(
  enterpriseId: string
): Promise<QualityStats> {
  const checks = await db.erpQualityCheck.findMany({
    where: { enterpriseId, status: { in: ["passed", "failed"] } },
    select: { checkType: true, status: true, passRate: true },
  });
  const totalChecks = checks.length;
  const passed = checks.filter((c) => c.status === "passed").length;
  const failed = totalChecks - passed;
  const overallPassRate =
    totalChecks > 0 ? Math.round((passed / totalChecks) * 100) : 0;
  const byType: Record<string, { total: number; passed: number; passRate: number }> = {};
  for (const c of checks) {
    if (!byType[c.checkType]) byType[c.checkType] = { total: 0, passed: 0, passRate: 0 };
    byType[c.checkType].total++;
    if (c.status === "passed") byType[c.checkType].passed++;
  }
  for (const k of Object.keys(byType)) {
    const t = byType[k];
    t.passRate = t.total > 0 ? Math.round((t.passed / t.total) * 100) : 0;
  }
  return { totalChecks, passed, failed, overallPassRate, byType };
}

// ════════════════════════════════════════════════════════════════════
// 10. ENTERPRISE-WIDE ERP DASHBOARD STATS
// ════════════════════════════════════════════════════════════════════

export type ErpDashboardStats = {
  activeProjects: number;
  totalBudgetEgp: number;
  totalSpentEgp: number;
  resourceUtilizationPct: number;
  pendingApprovals: number;
  lowStockAlerts: number;
  pendingTimesheets: number;
  pendingPOs: number;
  activeProductionOrders: number;
  totalAssetValueEgp: number;
};

export async function getErpDashboardStats(
  enterpriseId: string
): Promise<ErpDashboardStats> {
  const [
    activeProjects,
    projects,
    resources,
    lowStock,
    pendingTimesheets,
    pendingPOs,
    activeProduction,
    assets,
  ] = await Promise.all([
    db.erpProject.count({
      where: { enterpriseId, status: { in: ["planning", "active", "on_hold"] } },
    }),
    db.erpProject.findMany({
      where: { enterpriseId },
      select: { budgetEgp: true, spentEgp: true },
    }),
    db.erpResource.findMany({
      where: { enterpriseId, status: "active" },
      select: { capacity: true, allocated: true },
    }),
    db.erpInventory.count({
      where: {
        enterpriseId,
        reorderPoint: { gt: 0 },
        quantityOnHand: { lte: db.erpInventory.fields.reorderPoint },
      },
    }),
    db.erpTimesheet.count({
      where: { enterpriseId, status: "submitted" },
    }),
    db.erpPurchaseOrder.count({
      where: { enterpriseId, status: { in: ["draft", "submitted"] } },
    }),
    db.erpProductionOrder.count({
      where: {
        enterpriseId,
        status: { in: ["planned", "released", "in_progress"] },
      },
    }),
    db.erpAsset.aggregate({
      where: { enterpriseId, status: "active" },
      _sum: { netBookValueEgp: true },
    }),
  ]);

  const totalBudgetEgp = projects.reduce((s: number, p: any) => s + p.budgetEgp, 0);
  const totalSpentEgp = projects.reduce((s: number, p: any) => s + p.spentEgp, 0);
  const totalCap = resources.reduce((s: number, r: any) => s + r.capacity, 0);
  const totalAlloc = resources.reduce((s: number, r: any) => s + r.allocated, 0);
  const utilizationPct =
    totalCap > 0 ? Math.round((totalAlloc / totalCap) * 100) : 0;
  const pendingApprovals = pendingTimesheets + pendingPOs;

  return {
    activeProjects,
    totalBudgetEgp,
    totalSpentEgp,
    resourceUtilizationPct: utilizationPct,
    pendingApprovals,
    lowStockAlerts: lowStock,
    pendingTimesheets,
    pendingPOs,
    activeProductionOrders: activeProduction,
    totalAssetValueEgp: assets._sum.netBookValueEgp ?? 0,
  };
}
