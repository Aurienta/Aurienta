// AURIENTA — ERP Projects API
// ════════════════════════════════════════════════════════════════════
// GET  /api/erp/projects        — list projects for caller's enterprises.
// POST /api/erp/projects        — create a new ErpProject (auto PRJ-YYYY-NNN code).
//
// Every action is CRE-enforced (enforceProjectBudget) + audit-logged +
// persisted as CreDecision + LedgerEvent for tamper-evidence.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpProjectCreateSchema } from "@/lib/aurienta/validation";
import { createProject, listProjects } from "@/lib/aurienta/erp";

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
  const enterpriseId = url.searchParams.get("enterpriseId") ?? "";
  const status = url.searchParams.get("status") ?? undefined;
  const priority = url.searchParams.get("priority") ?? undefined;

  const memberships = user.memberships ?? [];
  const isRep = memberships.some((m) => m.role === "aurienta_rep");

  // If a specific enterpriseId is provided, the caller must be a member
  // (unless they're a Rep). If none is provided, return projects for every
  // enterprise the user is a member of.
  if (enterpriseId) {
    const isMember = memberships.some((m) => m.enterpriseId === enterpriseId);
    if (!isMember && !isRep) {
      return NextResponse.json(
        { error: "Forbidden", code: "forbidden" },
        { status: 403 }
      );
    }
    const projects = await listProjects(enterpriseId, { status, priority });
    return NextResponse.json({ projects });
  }

  // No enterprise filter — return projects for all enterprises the user
  // is a member of (or all if Rep).
  const entIds = isRep ? null : memberships.map((m) => m.enterpriseId);
  if (!entIds || entIds.length === 0) {
    return NextResponse.json({ projects: [] });
  }

  const { db } = await import("@/lib/db");
  const projects = await db.erpProject.findMany({
    where: { enterpriseId: { in: entIds }, ...(status ? { status } : {}), ...(priority ? { priority } : {}) },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ projects });
}, "GET /api/erp/projects");

// ─── POST ───────────────────────────────────────────────────────────

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const body = await parseBody(req, erpProjectCreateSchema);
  if (body instanceof NextResponse) return body;

  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === body.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isRep) {
    return NextResponse.json(
      { error: "You must be a member of the enterprise to create a project.", code: "forbidden" },
      { status: 403 }
    );
  }

  const project = await createProject({
    enterpriseId: body.enterpriseId,
    name: body.name,
    description: body.description,
    type: body.type,
    priority: body.priority,
    startDate: body.startDate ? new Date(body.startDate) : undefined,
    endDate: body.endDate ? new Date(body.endDate) : undefined,
    budgetEgp: body.budgetEgp,
    managerId: body.managerId ?? user.id,
    clientId: body.clientId,
  });

  return NextResponse.json({ project }, { status: 201 });
}, "POST /api/erp/projects");
