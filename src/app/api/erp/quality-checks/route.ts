// AURIENTA — ERP Quality Checks API
// GET  /api/erp/quality-checks  — list quality checks for caller's enterprises.
// POST /api/erp/quality-checks  — create a new quality check (pending).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpQualityCheckCreateSchema } from "@/lib/aurienta/validation";
import { createQualityCheck, listQualityChecks } from "@/lib/aurienta/erp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const memberships = user.memberships ?? [];
  const isRep = memberships.some((m) => m.role === "aurienta_rep");

  if (enterpriseId) {
    const isMember = memberships.some((m) => m.enterpriseId === enterpriseId);
    if (!isMember && !isRep) {
      return NextResponse.json(
        { error: "Forbidden", code: "forbidden" },
        { status: 403 }
      );
    }
    const checks = await listQualityChecks(enterpriseId);
    return NextResponse.json({ checks });
  }

  const entIds = isRep ? null : memberships.map((m) => m.enterpriseId);
  if (!entIds || entIds.length === 0) {
    return NextResponse.json({ checks: [] });
  }
  const { db } = await import("@/lib/db");
  const checks = await db.erpQualityCheck.findMany({
    where: { enterpriseId: { in: entIds } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ checks });
}, "GET /api/erp/quality-checks");

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const body = await parseBody(req, erpQualityCheckCreateSchema);
  if (body instanceof NextResponse) return body;

  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === body.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isRep) {
    return NextResponse.json(
      { error: "You must be a member of the enterprise to create a quality check.", code: "forbidden" },
      { status: 403 }
    );
  }

  const check = await createQualityCheck({
    enterpriseId: body.enterpriseId,
    productionOrderId: body.productionOrderId,
    projectId: body.projectId,
    inventoryId: body.inventoryId,
    checkType: body.checkType,
    description: body.description,
    inspectorId: body.inspectorId ?? user.id,
    minPassRate: body.minPassRate,
  });
  return NextResponse.json({ check }, { status: 201 });
}, "POST /api/erp/quality-checks");
