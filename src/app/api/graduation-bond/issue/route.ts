// AURIENTA — REC-6 Graduation Bond API · POST /api/graduation-bond/issue
//
// Body: { enterpriseId }
//
// Issues a Graduation Bond for an enterprise. The CRE policy
// `enforceGraduationBond` is enforced BEFORE the row is created — denials
// are surfaced as 400 with the CRE reason. Auth required: the caller
// must be a member of the enterprise (any role) OR an aurienta_rep.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { audit } from "@/lib/aurienta/audit";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { issueBond } from "@/lib/aurienta/graduation-bond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const rl = limiters.governance(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  let body: { enterpriseId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body must be valid JSON" },
      { status: 400 }
    );
  }
  const enterpriseId = (body.enterpriseId ?? "").trim();
  if (!enterpriseId) {
    return NextResponse.json(
      { error: "enterpriseId is required" },
      { status: 400 }
    );
  }

  // Authorization: caller must be a member of the enterprise OR aurienta_rep.
  const isMember = user.memberships.some(
    (m) => m.enterpriseId === enterpriseId
  );
  const isPlatformAdmin =
    user.primaryIntent === "aurienta_rep" ||
    user.memberships.some((m) => m.role === "aurienta_rep");
  if (!isMember && !isPlatformAdmin) {
    await audit({
      actorId: user.id,
      action: "graduation_bond.issue",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "not_enterprise_member",
    });
    return NextResponse.json(
      {
        error: "Only enterprise members may issue a graduation bond.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  try {
    const bond = await issueBond(enterpriseId, user.id);
    return NextResponse.json({ bond }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "CRE denied";
    const status = message.includes("already issued") ? 409
      : message.includes("not_found") ? 404
      : 400;
    return NextResponse.json(
      { error: message, code: "graduation_bond_failed" },
      { status }
    );
  }
}, "POST /api/graduation-bond/issue");
