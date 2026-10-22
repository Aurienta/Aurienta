// AURIENTA — Dividend Distribution Detail API
// ════════════════════════════════════════════════════════════════════
// PATCH /api/dividends/[distributionId] — pay a declared dividend.
//
// PATCH body:
//   { action: "pay" } — Law Firm Rep disburses the dividend to capital
//                        partners from the Law Firm Client Account.
//
// RBAC:
//   - pay: caller must be a law_firm_rep (the only role authorised to
//     disburse from a Law Firm Client Account, per Zero Custody) or an
//     AURIENTA Rep.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, dividendPatchSchema } from "@/lib/aurienta/validation";
import { audit } from "@/lib/aurienta/audit";
import { getDividend, payDividend } from "@/lib/aurienta/dividend-distribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ distributionId: string }> };

export const PATCH = withErrorHandler(
  async (req: NextRequest, ctx: Params) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }
    const { distributionId } = await ctx.params;

    const body = await parseBody(req, dividendPatchSchema);
    if (body instanceof NextResponse) return body;

    const existing = await getDividend(distributionId);
    if (!existing) {
      return NextResponse.json(
        { error: "Dividend distribution not found", code: "not_found" },
        { status: 404 }
      );
    }

    const roles = (user.memberships ?? []).filter(
      (m) => m.enterpriseId === existing.enterpriseId
    );
    const roleSet = new Set(roles.map((m) => m.role));
    const isLawFirm =
      roleSet.has("law_firm_rep") ||
      (user.memberships ?? []).some((m) => m.role === "law_firm_rep");
    const isRep =
      roleSet.has("aurienta_rep") ||
      (user.memberships ?? []).some((m) => m.role === "aurienta_rep");

    if (!isLawFirm && !isRep) {
      await audit({
        actorId: user.id,
        action: "dividend.pay",
        target: `dividend:${distributionId}`,
        result: "denied",
        reason: "law_firm_rep_required",
      });
      return NextResponse.json(
        {
          error:
            "Only a Law Firm Representative may disburse dividends (Zero Custody).",
          code: "forbidden",
        },
        { status: 403 }
      );
    }

    try {
      const updated = await payDividend(distributionId, user.id);
      return NextResponse.json({ distribution: updated });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not pay dividend.";
      return NextResponse.json(
        { error: msg, code: "invalid_state" },
        { status: 409 }
      );
    }
  },
  "PATCH /api/dividends/[distributionId]"
);
