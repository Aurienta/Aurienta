// AURIENTA — ERP Tasks API
// GET  /api/erp/tasks  — list tasks for a project (hierarchical WBS tree).
// POST /api/erp/tasks  — create a new ErpTask with auto WBS code (1.2.3 format).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpTaskCreateSchema } from "@/lib/aurienta/validation";
import { createTask, listTasks } from "@/lib/aurienta/erp";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET ─────────────────────────────────────────────────────────────

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") ?? "";
  if (!projectId) {
    return NextResponse.json(
      { error: "projectId query parameter is required", code: "invalid_request" },
      { status: 400 }
    );
  }

  // Visibility: caller must be a member of the enterprise that owns the project.
  const project = await db.erpProject.findUnique({
    where: { id: projectId },
    select: { enterpriseId: true },
  });
  if (!project) {
    return NextResponse.json(
      { error: "Project not found", code: "not_found" },
      { status: 404 }
    );
  }
  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === project.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isRep) {
    return NextResponse.json(
      { error: "Forbidden", code: "forbidden" },
      { status: 403 }
    );
  }

  const tasks = await listTasks(projectId);
  return NextResponse.json({ tasks });
}, "GET /api/erp/tasks");

// ─── POST ───────────────────────────────────────────────────────────

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const body = await parseBody(req, erpTaskCreateSchema);
  if (body instanceof NextResponse) return body;

  const project = await db.erpProject.findUnique({
    where: { id: body.projectId },
    select: { enterpriseId: true },
  });
  if (!project) {
    return NextResponse.json(
      { error: "Project not found", code: "not_found" },
      { status: 404 }
    );
  }
  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === project.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isRep) {
    return NextResponse.json(
      { error: "You must be a member of the enterprise to create a task.", code: "forbidden" },
      { status: 403 }
    );
  }

  const task = await createTask({
    projectId: body.projectId,
    parentId: body.parentId,
    title: body.title,
    description: body.description,
    priority: body.priority,
    assigneeId: body.assigneeId,
    estimatedHours: body.estimatedHours,
    startDate: body.startDate ? new Date(body.startDate) : undefined,
    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    tags: body.tags,
  });
  return NextResponse.json({ task }, { status: 201 });
}, "POST /api/erp/tasks");
