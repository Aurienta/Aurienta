// AURIENTA — ERP Production Orders API
// GET  /api/erp/production-orders  — list production orders.
// POST /api/erp/production-orders  — create a new order (auto PROD-YYYY-NNN).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpProductionOrderCreateSchema } from "@/lib/aurienta/validation";
import { createProductionOrder, listProductionOrders } from "@/lib/aurienta/erp";

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
    const orders = await listProductionOrders(enterpriseId);
    return NextResponse.json({ orders });
  }

  const entIds = isRep ? null : memberships.map((m) => m.enterpriseId);
  if (!entIds || entIds.length === 0) {
    return NextResponse.json({ orders: [] });
  }
  const { db } = await import("@/lib/db");
  const orders = await db.erpProductionOrder.findMany({
    where: { enterpriseId: { in: entIds } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ orders });
}, "GET /api/erp/production-orders");

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const body = await parseBody(req, erpProductionOrderCreateSchema);
  if (body instanceof NextResponse) return body;

  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === body.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isRep) {
    return NextResponse.json(
      { error: "You must be a member of the enterprise to create a production order.", code: "forbidden" },
      { status: 403 }
    );
  }

  const order = await createProductionOrder({
    enterpriseId: body.enterpriseId,
    productId: body.productId,
    productName: body.productName,
    quantity: body.quantity,
    unit: body.unit,
    priority: body.priority,
    startDate: body.startDate ? new Date(body.startDate) : undefined,
    endDate: body.endDate ? new Date(body.endDate) : undefined,
    projectId: body.projectId,
  });
  return NextResponse.json({ order }, { status: 201 });
}, "POST /api/erp/production-orders");
