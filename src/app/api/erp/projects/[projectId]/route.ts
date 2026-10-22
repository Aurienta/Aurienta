// AURIENTA — ERP Project Detail API
// GET  /api/erp/projects/[projectId]  — fetch one project (with task count + spent).
// PATCH /api/erp/projects/[projectId] — transition project status.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpProjectPatchSchema } from "@/lib/aurienta/validation";
import { getProject, updateProjectStatus } from "@/lib/aurienta/erp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ projectId: string }> };

// ─── GET ─────────────────────────────────────────────────────────────

export const GET = withErrorHandler(async (_req: NextRequest, ctx: Params) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const { projectId } = await ctx.params;
  const project = await getProject(projectId);
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

  return NextResponse.json({ project });
}, "GET /api/erp/projects/[projectId]");

// ─── PATCH ──────────────────────────────────────────────────────────

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: Params) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const { projectId } = await ctx.params;
  const body = await parseBody(req, erpProjectPatchSchema);
  if (body instanceof NextResponse) return body;

  const existing = await getProject(projectId);
  if (!existing) {
    return NextResponse.json(
      { error: "Project not found", code: "not_found" },
      { status: 404 }
    );
  }

  const membership = (user.memberships ?? []).find(
    (m) => m.enterpriseId === existing.enterpriseId
  );
  const isOperator =
    membership &&
    ["founding_operator", "manager", "board_member", "company_owner"].includes(
      membership.role
    );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isOperator && !isRep) {
    return NextResponse.json(
      { error: "Only an enterprise operator may change project status.", code: "forbidden" },
      { status: 403 }
    );
  }

  try {
    const updated = await updateProjectStatus(projectId, body.status, user.id);
    return NextResponse.json({ project: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not update project status.";
    return NextResponse.json(
      { error: msg, code: "invalid_state" },
      { status: 409 }
    );
  }
}, "PATCH /api/erp/projects/[projectId]");
