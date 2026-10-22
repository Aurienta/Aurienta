// AURIENTA — ERP Inventory Movement API
// POST /api/erp/inventory/[inventoryId]/movement — stock in/out movement.
// stock-out calls enforceInventoryAdjustment CRE policy.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpInventoryMovementSchema } from "@/lib/aurienta/validation";
import { stockIn, stockOut } from "@/lib/aurienta/erp";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ inventoryId: string }> };

export const POST = withErrorHandler(async (req: NextRequest, ctx: Params) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const { inventoryId } = await ctx.params;
  const body = await parseBody(req, erpInventoryMovementSchema);
  if (body instanceof NextResponse) return body;

  const item = await db.erpInventory.findUnique({
    where: { id: inventoryId },
    select: { enterpriseId: true },
  });
  if (!item) {
    return NextResponse.json(
      { error: "Inventory item not found", code: "not_found" },
      { status: 404 }
    );
  }
  const membership = (user.memberships ?? []).find(
    (m) => m.enterpriseId === item.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  const isOperator =
    membership &&
    ["manager", "founding_operator", "board_member", "company_owner"].includes(
      membership.role
    );
  if (!membership && !isRep) {
    return NextResponse.json(
      { error: "Forbidden", code: "forbidden" },
      { status: 403 }
    );
  }

  if (body.type === "in") {
    const updated = await stockIn(inventoryId, body.quantity, body.reference, user.id);
    return NextResponse.json({ item: updated });
  }

  // type === "out" — require operator role (for large adjustments) + CRE check.
  const approverRole = membership?.role ?? "member";
  if (!isOperator && !isRep) {
    return NextResponse.json(
      { error: "Only enterprise operators may perform stock-out.", code: "forbidden" },
      { status: 403 }
    );
  }

  const { inventory, verdict } = await stockOut(
    inventoryId,
    body.quantity,
    body.reference,
    approverRole,
    user.id
  );

  if (!verdict.allowed) {
    return NextResponse.json(
      {
        error: verdict.reason ?? "Inventory adjustment denied by CRE policy.",
        code: "cre_denied",
        verdict,
        item: inventory,
      },
      { status: 400 }
    );
  }
  return NextResponse.json({ item: inventory, verdict });
}, "POST /api/erp/inventory/[inventoryId]/movement");
