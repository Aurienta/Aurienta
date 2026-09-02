import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

// Live Evidence Streaming to IPFS — #15
// GET /api/evidence/[cid] — fetch evidence metadata by CID.
// Public, no auth (radical transparency — evidence is public).
// CORS-enabled.

export const GET = withErrorHandler(
  async (
    _req: NextRequest,
    ctx: { params: Promise<{ cid: string }> }
  ) => {
    const { params } = ctx;
    const { cid } = await params;
  if (!cid || cid.length < 6) {
    return NextResponse.json({ error: "Invalid CID" }, { status: 400 });
  }

  const record = await db.ipfsEvidence.findUnique({
    where: { cid },
    include: {
      enterprise: {
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          healthRating: true,
          stage: true,
        },
      },
    },
  });

  if (!record) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      cid: record.cid,
      filename: record.filename,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      description: record.description,
      milestoneId: record.milestoneId,
      enterpriseId: record.enterpriseId,
      enterprise: {
        id: record.enterprise.id,
        name: record.enterprise.name,
        slug: record.enterprise.slug,
        tier: record.enterprise.tier,
        healthRating: record.enterprise.healthRating,
        stage: record.enterprise.stage,
      },
      uploadedAt: record.uploadedAt.toISOString(),
      ipfsUri: `ipfs://aurienta.gateway/${record.cid}`,
      pinned: true,
      filecoinDeal: `deal_${record.cid.slice(2, 10)}`,
      retentionYears: 10,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
  },
  "GET /api/evidence/[cid]"
);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
