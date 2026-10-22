// AURIENTA — ERP Quality Check Detail API
// PATCH /api/erp/quality-checks/[checkId] — record quality check result (CRE).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpQualityCheckResultSchema } from "@/lib/aurienta/validation";
import { recordQualityResult } from "@/lib/aurienta/erp";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ checkId: string }> };

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: Params) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const { checkId } = await ctx.params;
  const body = await parseBody(req, erpQualityCheckResultSchema);
  if (body instanceof NextResponse) return body;

  const check = await db.erpQualityCheck.findUnique({
    where: { id: checkId },
    select: { enterpriseId: true, status: true },
  });
  if (!check) {
    return NextResponse.json(
      { error: "Quality check not found", code: "not_found" },
      { status: 404 }
    );
  }
  const membership = (user.memberships ?? []).find(
    (m) => m.enterpriseId === check.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  const isOperator =
    membership &&
    ["manager", "founding_operator", "board_member", "company_owner"].includes(
      membership.role
    );
  if (!isOperator && !isRep) {
    return NextResponse.json(
      { error: "Only an enterprise operator may record quality check results.", code: "forbidden" },
      { status: 403 }
    );
  }

  try {
    const { check: updated, verdict } = await recordQualityResult(
      checkId,
      body.passRate,
      body.defects,
      body.notes,
      user.id
    );
    if (!verdict.allowed) {
      return NextResponse.json(
        {
          error: verdict.reason ?? "Quality check failed by CRE policy.",
          code: "cre_denied",
          verdict,
          check: updated,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ check: updated, verdict });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not record quality result.";
    return NextResponse.json(
      { error: msg, code: "invalid_state" },
      { status: 409 }
    );
  }
}, "PATCH /api/erp/quality-checks/[checkId]");
