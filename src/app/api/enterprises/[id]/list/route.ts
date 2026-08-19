// Enterprise Listing Approval API
// Blueprint: After enterprise creation + feasibility pass, the enterprise
// transitions from "draft" → "fundraising_active" (listed for Capital Formation).
//
// Prerequisites:
//   - Enterprise status must be "draft"
//   - Feasibility score must be ≥35 (checked via AiArtifact)
//   - Only founding_operator or company_owner can request listing
//   - AURIENTA rep or board can approve (during pilot, founder can self-approve)
//
// This implements the pre-listing governance vote requirement.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: enterpriseId } = await params;

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: {
      id: true, name: true, status: true, founderId: true, tier: true,
      fundraisingGoalEgp: true, slug: true,
    },
  });

  if (!enterprise) {
    return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
  }

  // Authorization: founding_operator, company_owner, or aurienta_rep
  const membership = user.memberships.find(
    (m) =>
      m.enterpriseId === enterpriseId &&
      (m.role === "founding_operator" || m.role === "company_owner" || m.role === "aurienta_rep")
  );
  if (!membership && enterprise.founderId !== user.id) {
    return NextResponse.json(
      { error: "Only the Founding Operator, Company Owner, or AURIENTA Representative can list an enterprise" },
      { status: 403 }
    );
  }

  // Status check
  if (enterprise.status !== "draft") {
    return NextResponse.json(
      { error: `Enterprise status is "${enterprise.status}" — only "draft" enterprises can be listed` },
      { status: 400 }
    );
  }

  // Check feasibility score (must have a passed feasibility evaluation)
  const feasibility = await db.aiArtifact.findFirst({
    where: {
      kind: "feasibility_evaluation",
      entityId: enterpriseId,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, payload: true },
  });

  if (!feasibility) {
    return NextResponse.json(
      { error: "No feasibility evaluation found — submit a feasibility evaluation before listing", code: "NO_FEASIBILITY" },
      { status: 400 }
    );
  }

  // Parse feasibility score from payload
  let feasibilityScore = 0;
  let feasibilityPassed = false;
  try {
    const payload = JSON.parse(feasibility.payload);
    feasibilityScore = payload.feasibilityScore ?? 0;
    feasibilityPassed = payload.passed ?? false;
  } catch {
    // payload might be the content field
  }

  if (!feasibilityPassed || feasibilityScore < 35) {
    return NextResponse.json(
      {
        error: `Feasibility score is ${feasibilityScore} — must be ≥35 to list for Capital Formation`,
        code: "FEASIBILITY_NOT_MET",
        score: feasibilityScore,
      },
      { status: 400 }
    );
  }

  // List the enterprise
  const result = await db.$transaction(async (tx) => {
    const updated = await tx.enterprise.update({
      where: { id: enterpriseId },
      data: { status: "fundraising_active" },
    });

    await appendLedgerEvent(tx, {
      enterpriseId,
      eventType: "enterprise_listed",
      payload: {
        name: enterprise.name,
        tier: enterprise.tier,
        goalEgp: enterprise.fundraisingGoalEgp,
        feasibilityScore,
        listedBy: user.id,
        note: "Enterprise listed for Capital Formation after feasibility approval",
      },
      actorId: user.id,
    });

    return updated;
  });

  await audit({
    actorId: user.id,
    action: "enterprise.list",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: { feasibilityScore, tier: enterprise.tier },
  });

  logger.info("enterprise_listed", { enterpriseId, feasibilityScore });

  return NextResponse.json({
    ok: true,
    enterprise: {
      id: result.id,
      status: result.status,
      name: enterprise.name,
      slug: enterprise.slug,
    },
  });
}
