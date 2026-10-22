// AURIENTA — ERP Inventory API
// GET  /api/erp/inventory  — list inventory items for caller's enterprises.
// POST /api/erp/inventory  — register a new inventory SKU.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpInventoryCreateSchema } from "@/lib/aurienta/validation";
import { createInventoryItem, listInventory } from "@/lib/aurienta/erp";

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
    const items = await listInventory(enterpriseId);
    return NextResponse.json({ items });
  }

  const entIds = isRep ? null : memberships.map((m) => m.enterpriseId);
  if (!entIds || entIds.length === 0) {
    return NextResponse.json({ items: [] });
  }
  const { db } = await import("@/lib/db");
  const items = await db.erpInventory.findMany({
    where: { enterpriseId: { in: entIds } },
    orderBy: { name: "asc" },
    take: 500,
  });
  return NextResponse.json({ items });
}, "GET /api/erp/inventory");

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const body = await parseBody(req, erpInventoryCreateSchema);
  if (body instanceof NextResponse) return body;

  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === body.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isRep) {
    return NextResponse.json(
      { error: "You must be a member of the enterprise to register inventory.", code: "forbidden" },
      { status: 403 }
    );
  }

  const item = await createInventoryItem({
    enterpriseId: body.enterpriseId,
    sku: body.sku,
    name: body.name,
    description: body.description,
    category: body.category,
    unit: body.unit,
    reorderPoint: body.reorderPoint,
    maxStock: body.maxStock,
    costPerUnitEgp: body.costPerUnitEgp,
    sellPriceEgp: body.sellPriceEgp,
    warehouseLocation: body.warehouseLocation,
    barcode: body.barcode,
    supplierId: body.supplierId,
  });
  return NextResponse.json({ item }, { status: 201 });
}, "POST /api/erp/inventory");
