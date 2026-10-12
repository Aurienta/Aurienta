// GET /api/genome — list top enterprise genomes by graduation probability.
// Public-ish surface (auth required) for the dashboard's genome overview.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { listTopGenomes } from "@/lib/aurienta/enterprise-genome";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

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
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? "12", 10) || 12, 1),
    100
  );

  const genomes = await listTopGenomes(limit);

  await audit({
    actorId: user.id,
    action: "genome.list",
    target: "platform",
    result: "allowed",
    metadata: { count: genomes.length, limit },
  });

  return NextResponse.json({
    genomes: genomes.map((g) => ({
      id: g.id,
      enterpriseId: g.enterpriseId,
      enterpriseName: g.enterpriseName,
      enterpriseSlug: g.enterpriseSlug,
      tier: g.tier,
      stage: g.stage,
      healthRating: g.healthRating,
      graduationProbability: g.graduationProbability,
      riskScore: g.riskScore,
      modelVersion: g.modelVersion,
      trainedOnCount: g.trainedOnCount,
      predictedAt: g.predictedAt.toISOString(),
      // NOTE: attributesJson is intentionally omitted from the list endpoint
      // to keep payloads small. Fetch /api/genome/[enterpriseId] for the full
      // attribute vector.
    })),
    count: genomes.length,
    disclaimer:
      "Predictions are statistical estimates, NOT guarantees of success.",
  });
}, "GET /api/genome");
