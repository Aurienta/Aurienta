// AURIENTA — ERP Production Order Detail API
// PATCH /api/erp/production-orders/[orderId] — release (CRE) or complete.
// release: calls enforceProductionRelease (BOM + materials check).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpProductionOrderPatchSchema } from "@/lib/aurienta/validation";
import { releaseProductionOrder, completeProductionOrder, createBom } from "@/lib/aurienta/erp";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ orderId: string }> };

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: Params) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const { orderId } = await ctx.params;
  const body = await parseBody(req, erpProductionOrderPatchSchema);
  if (body instanceof NextResponse) return body;

  const order = await db.erpProductionOrder.findUnique({
    where: { id: orderId },
    select: { enterpriseId: true },
  });
  if (!order) {
    return NextResponse.json(
      { error: "Production order not found", code: "not_found" },
      { status: 404 }
    );
  }
  const membership = (user.memberships ?? []).find(
    (m) => m.enterpriseId === order.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  const isOperator =
    membership &&
    ["manager", "founding_operator", "board_member", "company_owner"].includes(
      membership.role
    );
  if (!isOperator && !isRep) {
    return NextResponse.json(
      { error: "Only an enterprise operator may modify production orders.", code: "forbidden" },
      { status: 403 }
    );
  }

  try {
    if (body.action === "release") {
      // Optionally accept a BOM alongside release (creates BOM items first).
      if (body.bom && body.bom.length > 0) {
        await createBom(orderId, body.bom);
      }
      const { order: updated, verdict } = await releaseProductionOrder(orderId, user.id);
      if (!verdict.allowed) {
        return NextResponse.json(
          {
            error: verdict.reason ?? "Production release denied by CRE policy.",
            code: "cre_denied",
            verdict,
            order: updated,
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ order: updated, verdict });
    }

    // action === "complete"
    const completedQty = body.completedQty ?? 0;
    const updated = await completeProductionOrder(orderId, completedQty, user.id);
    return NextResponse.json({ order: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not update production order.";
    return NextResponse.json(
      { error: msg, code: "invalid_state" },
      { status: 409 }
    );
  }
}, "PATCH /api/erp/production-orders/[orderId]");
