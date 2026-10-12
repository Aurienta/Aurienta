// GET /api/genome/[enterpriseId] — fetch (or compute) a single enterprise genome.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { getGenome, upsertGenome } from "@/lib/aurienta/enterprise-genome";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(
  async (
    _req: NextRequest,
    ctx: { params: Promise<{ enterpriseId: string }> }
  ) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "unauthenticated" },
        { status: 401 }
      );
    }

    const { enterpriseId } = await ctx.params;
    if (!enterpriseId) {
      return NextResponse.json(
        { error: "enterpriseId is required", code: "invalid_body" },
        { status: 400 }
      );
    }

    // Try cached genome first.
    let genome = await getGenome(enterpriseId);

    // Compute on-demand if missing.
    if (!genome) {
      try {
        genome = await upsertGenome(enterpriseId);
      } catch {
        // Enterprise does not exist (or DB read failed) — surface a 404.
        return NextResponse.json(
          { error: "Enterprise not found", code: "not_found" },
          { status: 404 }
        );
      }
    }

    await audit({
      actorId: user.id,
      action: "genome.read",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      metadata: {
        graduationProbability: genome.graduationProbability,
        riskScore: genome.riskScore,
        modelVersion: genome.modelVersion,
      },
    });

    return NextResponse.json({
      genome: {
        ...genome,
        attributes: JSON.parse(genome.attributesJson),
        predictedAt: genome.predictedAt.toISOString(),
      },
      disclaimer:
        "Predictions are statistical estimates, NOT guarantees of success. " +
        "Based on internal model v1.",
    });
  },
  "GET /api/genome/[enterpriseId]"
);
