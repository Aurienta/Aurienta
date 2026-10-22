// AURIENTA — ERP Assets API
// GET  /api/erp/assets  — list fixed assets for caller's enterprises.
// POST /api/erp/assets  — register a new asset (auto AST-NNN code).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpAssetCreateSchema } from "@/lib/aurienta/validation";
import { createAsset, listAssets } from "@/lib/aurienta/erp";

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
    const assets = await listAssets(enterpriseId);
    return NextResponse.json({ assets });
  }

  const entIds = isRep ? null : memberships.map((m) => m.enterpriseId);
  if (!entIds || entIds.length === 0) {
    return NextResponse.json({ assets: [] });
  }
  const { db } = await import("@/lib/db");
  const assets = await db.erpAsset.findMany({
    where: { enterpriseId: { in: entIds } },
    orderBy: { acquisitionDate: "desc" },
    take: 300,
  });
  return NextResponse.json({ assets });
}, "GET /api/erp/assets");

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const body = await parseBody(req, erpAssetCreateSchema);
  if (body instanceof NextResponse) return body;

  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === body.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isRep) {
    return NextResponse.json(
      { error: "You must be a member of the enterprise to register an asset.", code: "forbidden" },
      { status: 403 }
    );
  }

  const asset = await createAsset({
    enterpriseId: body.enterpriseId,
    name: body.name,
    category: body.category,
    acquisitionDate: new Date(body.acquisitionDate),
    acquisitionCostEgp: body.acquisitionCostEgp,
    depreciationMethod: body.depreciationMethod,
    depreciationRate: body.depreciationRate,
    location: body.location,
    assignedTo: body.assignedTo,
    warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : undefined,
    insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry) : undefined,
  });
  return NextResponse.json({ asset }, { status: 201 });
}, "POST /api/erp/assets");
