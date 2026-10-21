// AURIENTA — REC-6 Graduation Bond API · GET /api/graduation-bond/[enterpriseId]
//
// Auth required. Returns the Graduation Bond for the given enterprise, or
// 404 if no bond has been issued.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { getBond } from "@/lib/aurienta/graduation-bond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(
  async (_req: NextRequest, { params }: { params: Promise<{ enterpriseId: string }> }) => {
    const { enterpriseId } = await params;
    if (!enterpriseId) {
      return NextResponse.json(
        { error: "enterpriseId is required" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }

    // Authorization: must be a member of this enterprise OR aurienta_rep.
    const isMember = user.memberships.some(
      (m) => m.enterpriseId === enterpriseId
    );
    const isPlatformAdmin =
      user.primaryIntent === "aurienta_rep" ||
      user.memberships.some((m) => m.role === "aurienta_rep");
    if (!isMember && !isPlatformAdmin) {
      return NextResponse.json(
        { error: "Only enterprise members may view the graduation bond." },
        { status: 403 }
      );
    }

    const bond = await getBond(enterpriseId);
    if (!bond) {
      // Also return the enterprise's current graduation context so the UI
      // can render the eligibility check + Issue Bond button.
      const enterprise = await db.enterprise.findUnique({
        where: { id: enterpriseId },
        select: {
          id: true,
          name: true,
          status: true,
          stage: true,
          healthScore: true,
          raisedEgp: true,
          fundraisingGoalEgp: true,
          monthlyRevenueEgp: true,
          monthlyBurnEgp: true,
          employeeCount: true,
          nosiCompliantPct: true,
          policeClearanceValid: true,
          transparencyScore: true,
          stageSince: true,
        },
      });
      return NextResponse.json(
        {
          bond: null,
          enterprise: enterprise
            ? {
                id: enterprise.id,
                name: enterprise.name,
                status: enterprise.status,
                stage: enterprise.stage,
                healthScore: enterprise.healthScore,
                raisedEgp: enterprise.raisedEgp,
                fundraisingGoalEgp: enterprise.fundraisingGoalEgp,
                monthlyRevenueEgp: enterprise.monthlyRevenueEgp,
                monthlyBurnEgp: enterprise.monthlyBurnEgp,
                employeeCount: enterprise.employeeCount,
                nosiCompliantPct: enterprise.nosiCompliantPct,
                policeClearanceValid: enterprise.policeClearanceValid,
                transparencyScore: enterprise.transparencyScore,
                stageSince: enterprise.stageSince.toISOString(),
              }
            : null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ bond });
  },
  "GET /api/graduation-bond/[enterpriseId]"
);
