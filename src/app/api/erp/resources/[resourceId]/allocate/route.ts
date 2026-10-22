// AURIENTA — ERP Resource Allocate API
// POST /api/erp/resources/[resourceId]/allocate — allocate resource to project/task.
// Calls enforceResourceAllocation CRE policy.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpResourceAllocateSchema } from "@/lib/aurienta/validation";
import { allocateResource } from "@/lib/aurienta/erp";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ resourceId: string }> };

export const POST = withErrorHandler(async (req: NextRequest, ctx: Params) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const { resourceId } = await ctx.params;
  const body = await parseBody(req, erpResourceAllocateSchema);
  if (body instanceof NextResponse) return body;

  const resource = await db.erpResource.findUnique({
    where: { id: resourceId },
    select: { enterpriseId: true },
  });
  if (!resource) {
    return NextResponse.json(
      { error: "Resource not found", code: "not_found" },
      { status: 404 }
    );
  }

  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === resource.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isRep) {
    return NextResponse.json(
      { error: "Forbidden", code: "forbidden" },
      { status: 403 }
    );
  }

  const { allocation, verdict } = await allocateResource({
    resourceId,
    projectId: body.projectId,
    taskId: body.taskId,
    enterpriseId: resource.enterpriseId,
    quantity: body.quantity,
    startDate: new Date(body.startDate),
    endDate: body.endDate ? new Date(body.endDate) : undefined,
    notes: body.notes,
    actorId: user.id,
  });

  if (!verdict.allowed) {
    return NextResponse.json(
      {
        error: verdict.reason ?? "Resource allocation denied by CRE policy.",
        code: "cre_denied",
        verdict,
        allocation,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ allocation, verdict }, { status: 201 });
}, "POST /api/erp/resources/[resourceId]/allocate");
