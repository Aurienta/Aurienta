// AURIENTA — Takaful Pool Claims API
// ════════════════════════════════════════════════════════════════════
// GET  /api/takaful/claims        — list claims visible to the caller.
// POST /api/takaful/claims        — submit a new claim against the pool.
//
// Visibility (GET):
//   - AURIENTA Reps see all claims for every enterprise.
//   - Operators / board members see claims filed against their enterprises.
//   - Capital partners see claims they themselves submitted.
//
// Submission (POST):
//   - Caller must be authenticated.
//   - The CRE policy `enforceTakafulClaim` validates amount, type, vault
//     balance, and enterprise health before the claim is recorded.
//   - On denial, the claim row is still persisted with status=`rejected`
//     for the audit trail.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, takafulClaimSubmitSchema } from "@/lib/aurienta/validation";
import {
  submitClaim,
  listClaimsVisibleToUser,
  type TakafulClaimRecord,
} from "@/lib/aurienta/takaful-pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET /api/takaful/claims ────────────────────────────────────────

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const enterpriseIds = (user.memberships ?? []).map((m) => m.enterpriseId);
  const isAurientaRep = (user.memberships ?? []).some(
    (m) => m.role === "aurienta_rep"
  );

  let claims: TakafulClaimRecord[];
  if (isAurientaRep) {
    // Reps see everything — bypass the membership filter.
    const { db } = await import("@/lib/db");
    const rows = await db.takafulClaim.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    claims = rows as TakafulClaimRecord[];
  } else {
    claims = await listClaimsVisibleToUser(user.id, enterpriseIds, 100);
  }

  return NextResponse.json({ claims });
}, "GET /api/takaful/claims");

// ─── POST /api/takaful/claims ───────────────────────────────────────

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const body = await parseBody(req, takafulClaimSubmitSchema);
  if (body instanceof NextResponse) return body;

  // Caller must be a member of the enterprise they're filing against.
  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === body.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isRep) {
    return NextResponse.json(
      {
        error:
          "You must be a member of the enterprise to file a takaful claim against it.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  const { claim, verdict } = await submitClaim({
    enterpriseId: body.enterpriseId,
    claimantId: user.id,
    claimType: body.claimType,
    description: body.description,
    amountRequested: body.amountRequested,
    evidenceCid: body.evidenceCid,
  });

  if (!verdict.allowed) {
    return NextResponse.json(
      {
        error: verdict.reason ?? "Takaful claim denied by CRE policy.",
        code: "cre_denied",
        verdict,
        claim,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ claim, verdict }, { status: 201 });
}, "POST /api/takaful/claims");
