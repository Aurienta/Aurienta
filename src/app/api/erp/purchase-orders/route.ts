// AURIENTA — ERP Purchase Orders API
// GET  /api/erp/purchase-orders  — list POs for caller's enterprises.
// POST /api/erp/purchase-orders  — create a new PO (auto PO-YYYY-NNN code).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpPurchaseOrderCreateSchema } from "@/lib/aurienta/validation";
import { createPurchaseOrder, listPurchaseOrders } from "@/lib/aurienta/erp";

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
  const status = url.searchParams.get("status") ?? undefined;
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
    const purchaseOrders = await listPurchaseOrders(enterpriseId, { status });
    return NextResponse.json({ purchaseOrders });
  }

  const entIds = isRep ? null : memberships.map((m) => m.enterpriseId);
  if (!entIds || entIds.length === 0) {
    return NextResponse.json({ purchaseOrders: [] });
  }
  const { db } = await import("@/lib/db");
  const purchaseOrders = await db.erpPurchaseOrder.findMany({
    where: { enterpriseId: { in: entIds }, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ purchaseOrders });
}, "GET /api/erp/purchase-orders");

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const body = await parseBody(req, erpPurchaseOrderCreateSchema);
  if (body instanceof NextResponse) return body;

  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === body.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isRep) {
    return NextResponse.json(
      { error: "You must be a member of the enterprise to create a purchase order.", code: "forbidden" },
      { status: 403 }
    );
  }

  const { po, lines } = await createPurchaseOrder({
    enterpriseId: body.enterpriseId,
    vendorId: body.vendorId,
    vendorName: body.vendorName,
    expectedDate: body.expectedDate ? new Date(body.expectedDate) : undefined,
    projectId: body.projectId,
    notes: body.notes,
    lines: body.lines.map((l) => ({
      description: l.description,
      inventoryId: l.inventoryId,
      quantity: l.quantity,
      unit: l.unit,
      unitPriceEgp: l.unitPriceEgp,
    })),
    createdById: user.id,
  });
  return NextResponse.json({ po, lines }, { status: 201 });
}, "POST /api/erp/purchase-orders");
