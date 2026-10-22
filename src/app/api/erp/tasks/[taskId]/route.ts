// AURIENTA — ERP Task Detail API
// PATCH /api/erp/tasks/[taskId] — transition task status (with validation).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpTaskPatchSchema } from "@/lib/aurienta/validation";
import { updateTaskStatus } from "@/lib/aurienta/erp";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ taskId: string }> };

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: Params) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const { taskId } = await ctx.params;
  const body = await parseBody(req, erpTaskPatchSchema);
  if (body instanceof NextResponse) return body;

  const task = await db.erpTask.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });
  if (!task) {
    return NextResponse.json(
      { error: "Task not found", code: "not_found" },
      { status: 404 }
    );
  }
  const project = await db.erpProject.findUnique({
    where: { id: task.projectId },
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

  try {
    const updated = await updateTaskStatus(taskId, body.status, user.id);
    return NextResponse.json({ task: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not update task status.";
    return NextResponse.json(
      { error: msg, code: "invalid_state" },
      { status: 409 }
    );
  }
}, "PATCH /api/erp/tasks/[taskId]");
