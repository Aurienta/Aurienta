import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import {
  parseBody,
  profitShareCreateSchema,
} from "@/lib/aurienta/validation";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import {
  createAgreement,
  listAgreementsForUser,
  type AgreementWithEnterprise,
} from "@/lib/aurienta/profit-sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/profit-sharing
// Returns all profit-share agreements where the current user is the partner.
// Each agreement is enriched with the enterprise name/slug/tier.
export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const agreements: AgreementWithEnterprise[] = await listAgreementsForUser(
    user.id
  );

  return NextResponse.json({ agreements });
}, "GET /api/profit-sharing");

// POST /api/profit-sharing
// Body: { enterpriseId, title, contributionEgp, profitSharePct, termMonths }
//
// Creates a new profit-share agreement. The CRE policy `enforceProfitShareAgreement`
// validates the terms (beneficiary != AURIENTA, profitSharePct <= 30,
// termMonths 1-60, contributionEgp >= 50). If denied, returns 400 with the
// CRE verdict reason so the UI can show exactly why the agreement was rejected.
//
// The partner must be a member of the enterprise (any role). This is a
// contractual agreement between an enterprise and one of its partners —
// not a security issuance.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // ── Rate limit: governance-level (20/min) ──
  const rl = limiters.governance(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  // ── Validate body ──
  const body = await parseBody(req, profitShareCreateSchema);
  if (body instanceof NextResponse) return body;
  const { enterpriseId, title, contributionEgp, profitSharePct, termMonths } =
    body;

  // ── Authorization: must be a member of the enterprise ──
  const membership = user.memberships.find((m) => m.enterpriseId === enterpriseId);
  if (!membership) {
    await audit({
      actorId: user.id,
      action: "profit_share.create",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "not_enterprise_member",
    });
    return NextResponse.json(
      {
        error:
          "Only enterprise members may enter into a profit-share agreement with this enterprise.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  // ── Verify the enterprise exists and is not in draft/graduated ──
  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { id: true, name: true, slug: true, tier: true, status: true },
  });
  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found", code: "not_found" },
      { status: 404 }
    );
  }
  if (enterprise.status === "draft" || enterprise.status === "graduated") {
    return NextResponse.json(
      {
        error: `Enterprise is in status '${enterprise.status}' — profit-share agreements require an active enterprise.`,
        code: "wrong_enterprise_status",
      },
      { status: 400 }
    );
  }

  // ── Create the agreement (CRE-validated + ledger-anchored) ──
  try {
    const { agreement, verdict } = await createAgreement({
      enterpriseId,
      partnerId: user.id,
      title,
      contributionEgp,
      profitSharePct,
      termMonths,
    });

    return NextResponse.json(
      {
        agreement: {
          ...agreement,
          enterprise: {
            id: enterprise.id,
            name: enterprise.name,
            slug: enterprise.slug,
            tier: enterprise.tier,
          },
        },
        verdict: {
          allowed: verdict.allowed,
          policy: verdict.policy,
          decisionToken: verdict.decisionToken,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    // createAgreement throws Error with verdict.reason when CRE denies.
    const message = e instanceof Error ? e.message : "CRE denied";
    return NextResponse.json(
      {
        error: message,
        code: "cre_denied",
        policy: "profit_share_agreement.rego",
      },
      { status: 400 }
    );
  }
}, "POST /api/profit-sharing");
