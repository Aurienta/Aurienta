// AURIENTA — ERP Resources API
// GET  /api/erp/resources  — list resources for caller's enterprises.
// POST /api/erp/resources  — register a new ErpResource.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpResourceCreateSchema } from "@/lib/aurienta/validation";
import { createResource, listResources } from "@/lib/aurienta/erp";

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
    const resources = await listResources(enterpriseId);
    return NextResponse.json({ resources });
  }

  const entIds = isRep ? null : memberships.map((m) => m.enterpriseId);
  if (!entIds || entIds.length === 0) {
    return NextResponse.json({ resources: [] });
  }
  const { db } = await import("@/lib/db");
  const resources = await db.erpResource.findMany({
    where: { enterpriseId: { in: entIds } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ resources });
}, "GET /api/erp/resources");

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const body = await parseBody(req, erpResourceCreateSchema);
  if (body instanceof NextResponse) return body;

  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === body.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isRep) {
    return NextResponse.json(
      { error: "You must be a member of the enterprise to register a resource.", code: "forbidden" },
      { status: 403 }
    );
  }

  const resource = await createResource({
    enterpriseId: body.enterpriseId,
    name: body.name,
    type: body.type,
    category: body.category,
    capacity: body.capacity,
    costPerUnitEgp: body.costPerUnitEgp,
    unit: body.unit,
    location: body.location,
    skills: body.skills,
  });
  return NextResponse.json({ resource }, { status: 201 });
}, "POST /api/erp/resources");
