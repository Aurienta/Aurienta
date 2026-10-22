// AURIENTA — ERP Purchase Order Detail API
// GET  /api/erp/purchase-orders/[poId] — fetch one PO with lines.
// PATCH /api/erp/purchase-orders/[poId] — approve (CRE) or receive.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpPurchaseOrderPatchSchema } from "@/lib/aurienta/validation";
import { getPurchaseOrder, approvePurchaseOrder, receivePurchaseOrder } from "@/lib/aurienta/erp";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ poId: string }> };

export const GET = withErrorHandler(async (_req: NextRequest, ctx: Params) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const { poId } = await ctx.params;
  const result = await getPurchaseOrder(poId);
  if (!result) {
    return NextResponse.json(
      { error: "Purchase order not found", code: "not_found" },
      { status: 404 }
    );
  }
  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === result.po.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isRep) {
    return NextResponse.json(
      { error: "Forbidden", code: "forbidden" },
      { status: 403 }
    );
  }
  return NextResponse.json(result);
}, "GET /api/erp/purchase-orders/[poId]");

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: Params) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const { poId } = await ctx.params;
  const body = await parseBody(req, erpPurchaseOrderPatchSchema);
  if (body instanceof NextResponse) return body;

  const result = await getPurchaseOrder(poId);
  if (!result) {
    return NextResponse.json(
      { error: "Purchase order not found", code: "not_found" },
      { status: 404 }
    );
  }
  const membership = (user.memberships ?? []).find(
    (m) => m.enterpriseId === result.po.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");

  try {
    if (body.action === "approve") {
      const isApprover =
        membership &&
        ["manager", "founding_operator", "board_member", "company_owner"].includes(
          membership.role
        );
      if (!isApprover && !isRep) {
        return NextResponse.json(
          { error: "Only an enterprise operator may approve purchase orders.", code: "forbidden" },
          { status: 403 }
        );
      }
      // Pull enterprise capital for the CRE policy threshold check.
      const ent = await db.enterprise.findUnique({
        where: { id: result.po.enterpriseId },
        select: { fundraisingGoalEgp: true },
      });
      const capital = ent?.fundraisingGoalEgp ?? 1_000_000;
      const { po, verdict } = await approvePurchaseOrder(
        poId,
        membership?.role ?? "manager",
        user.id,
        capital
      );
      if (!verdict.allowed) {
        return NextResponse.json(
          {
            error: verdict.reason ?? "Purchase order denied by CRE policy.",
            code: "cre_denied",
            verdict,
            po,
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ po, verdict });
    }

    // action === "receive"
    if (!membership && !isRep) {
      return NextResponse.json(
        { error: "Forbidden", code: "forbidden" },
        { status: 403 }
      );
    }
    const po = await receivePurchaseOrder(poId, user.id);
    return NextResponse.json({ po });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not update purchase order.";
    return NextResponse.json(
      { error: msg, code: "invalid_state" },
      { status: 409 }
    );
  }
}, "PATCH /api/erp/purchase-orders/[poId]");
