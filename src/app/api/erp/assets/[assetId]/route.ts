// AURIENTA — ERP Asset Detail API
// PATCH /api/erp/assets/[assetId] — dispose (CRE) or depreciate an asset.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpAssetPatchSchema } from "@/lib/aurienta/validation";
import { disposeAsset, depreciateAsset } from "@/lib/aurienta/erp";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ assetId: string }> };

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: Params) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const { assetId } = await ctx.params;
  const body = await parseBody(req, erpAssetPatchSchema);
  if (body instanceof NextResponse) return body;

  const asset = await db.erpAsset.findUnique({
    where: { id: assetId },
    select: { enterpriseId: true },
  });
  if (!asset) {
    return NextResponse.json(
      { error: "Asset not found", code: "not_found" },
      { status: 404 }
    );
  }
  const membership = (user.memberships ?? []).find(
    (m) => m.enterpriseId === asset.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  const isOperator =
    membership &&
    ["manager", "founding_operator", "board_member", "company_owner"].includes(
      membership.role
    );
  if (!isOperator && !isRep) {
    return NextResponse.json(
      { error: "Only an enterprise operator may modify assets.", code: "forbidden" },
      { status: 403 }
    );
  }

  try {
    if (body.action === "depreciate") {
      const updated = await depreciateAsset(assetId);
      return NextResponse.json({ asset: updated });
    }

    // action === "dispose"
    const approverRole = membership?.role ?? "manager";
    const { asset: disposed, verdict } = await disposeAsset(
      assetId,
      approverRole,
      user.id
    );
    if (!verdict.allowed) {
      return NextResponse.json(
        {
          error: verdict.reason ?? "Asset disposal denied by CRE policy.",
          code: "cre_denied",
          verdict,
          asset: disposed,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ asset: disposed, verdict });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not update asset.";
    return NextResponse.json(
      { error: msg, code: "invalid_state" },
      { status: 409 }
    );
  }
}, "PATCH /api/erp/assets/[assetId]");
