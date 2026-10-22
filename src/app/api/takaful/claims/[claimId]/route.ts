// AURIENTA — Takaful Claim Detail API
// ════════════════════════════════════════════════════════════════════
// GET  /api/takaful/claims/[claimId]  — fetch one claim.
// PATCH /api/takaful/claims/[claimId] — approve or pay a claim.
//
// PATCH body:
//   { action: "approve", amountApproved: 12345 }  — AURIENTA Rep / board
//                                                      member sets the
//                                                      CRE-approved payout.
//   { action: "pay" }                              — Law firm marks the
//                                                      disbursement done.
//
// RBAC:
//   - approve: caller must be an AURIENTA Rep or board_member of the
//     enterprise the claim was filed against.
//   - pay: caller must be a law_firm_rep (the only role authorised to
//     disburse from a Law Firm Client Account).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, takafulClaimPatchSchema } from "@/lib/aurienta/validation";
import { audit } from "@/lib/aurienta/audit";
import {
  getClaim,
  approveClaim,
  payClaim,
} from "@/lib/aurienta/takaful-pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ claimId: string }> };

// ─── GET ─────────────────────────────────────────────────────────────

export const GET = withErrorHandler(async (_req: NextRequest, ctx: Params) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const { claimId } = await ctx.params;

  const claim = await getClaim(claimId);
  if (!claim) {
    return NextResponse.json(
      { error: "Claim not found", code: "not_found" },
      { status: 404 }
    );
  }

  // Visibility: claimant, enterprise members, or AURIENTA Reps.
  const isClaimant = claim.claimantId === user.id;
  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === claim.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isClaimant && !isMember && !isRep) {
    return NextResponse.json(
      { error: "Forbidden", code: "forbidden" },
      { status: 403 }
    );
  }

  return NextResponse.json({ claim });
}, "GET /api/takaful/claims/[claimId]");

// ─── PATCH ──────────────────────────────────────────────────────────

export const PATCH = withErrorHandler(
  async (req: NextRequest, ctx: Params) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }
    const { claimId } = await ctx.params;

    const body = await parseBody(req, takafulClaimPatchSchema);
    if (body instanceof NextResponse) return body;

    const existing = await getClaim(claimId);
    if (!existing) {
      return NextResponse.json(
        { error: "Claim not found", code: "not_found" },
        { status: 404 }
      );
    }

    const roles = (user.memberships ?? []).filter(
      (m) => m.enterpriseId === existing.enterpriseId
    );
    const roleSet = new Set(roles.map((m) => m.role));
    const isRep =
      roleSet.has("aurienta_rep") ||
      (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
    const isBoard = roleSet.has("board_member");
    const isLawFirm =
      roleSet.has("law_firm_rep") ||
      (user.memberships ?? []).some((m) => m.role === "law_firm_rep");

    try {
      if (body.action === "approve") {
        if (!isRep && !isBoard) {
          await audit({
            actorId: user.id,
            action: "takaful.claim.approve",
            target: `takaful_claim:${claimId}`,
            result: "denied",
            reason: "aurienta_rep_or_board_required",
          });
          return NextResponse.json(
            {
              error:
                "Only an AURIENTA Representative or board member may approve claims.",
              code: "forbidden",
            },
            { status: 403 }
          );
        }
        // The schema's refine() guarantees amountApproved is present when
        // action === "approve"; re-check here so TS narrows without a
        // non-null assertion.
        const amountApproved = body.amountApproved;
        if (typeof amountApproved !== "number") {
          return NextResponse.json(
            { error: "amountApproved is required.", code: "invalid_body" },
            { status: 400 }
          );
        }
        const updated = await approveClaim(claimId, amountApproved, user.id);
        return NextResponse.json({ claim: updated });
      }

      // action === "pay"
      if (!isLawFirm && !isRep) {
        await audit({
          actorId: user.id,
          action: "takaful.claim.pay",
          target: `takaful_claim:${claimId}`,
          result: "denied",
          reason: "law_firm_rep_required",
        });
        return NextResponse.json(
          {
            error:
              "Only a Law Firm Representative may disburse a claim (Zero Custody).",
            code: "forbidden",
          },
          { status: 403 }
        );
      }
      const updated = await payClaim(claimId, user.id);
      return NextResponse.json({ claim: updated });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not update claim.";
      return NextResponse.json(
        { error: msg, code: "invalid_state" },
        { status: 409 }
      );
    }
  },
  "PATCH /api/takaful/claims/[claimId]"
);
