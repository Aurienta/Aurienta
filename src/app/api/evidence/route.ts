import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { mockCid } from "@/lib/aurienta/ai";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { evidenceSchema, parseBody } from "@/lib/aurienta/validation";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

// Live Evidence Streaming to IPFS — #15
// POST /api/evidence — upload evidence metadata to mock IPFS.
//
// Body: { enterpriseId, milestoneId?, filename, mimeType, sizeBytes, description? }
// Auth required (only members/operators should publish evidence on behalf of an enterprise).
// Generates a mock CID, creates an IpfsEvidence record, and appends a hash-chained
// `evidence_published` (or `milestone_released` when milestoneId is present) ledger event.

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await parseBody(req, evidenceSchema);
  if (body instanceof NextResponse) return body;
  const { enterpriseId, milestoneId, filename, mimeType, sizeBytes, description } = body;

  // Schema enforces required + types + size range; this is defence-in-depth.
  if (!enterpriseId || !filename || !mimeType || typeof sizeBytes !== "number") {
    return NextResponse.json(
      { error: "enterpriseId, filename, mimeType and sizeBytes are required" },
      { status: 400 }
    );
  }
  if (sizeBytes <= 0 || sizeBytes > 250 * 1024 * 1024) {
    return NextResponse.json(
      { error: "sizeBytes must be between 1 and 262144000 (250 MB)" },
      { status: 400 }
    );
  }

  // Validate enterprise exists
  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: { id: true, name: true, slug: true, lawFirmId: true },
  });
  if (!enterprise) {
    return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
  }

  // Authorization: must be a member of the enterprise OR a law_firm_rep/accounting_firm_rep/aurienta_rep.
  const isMember = user.memberships.some((m) => m.enterpriseId === enterpriseId);
  const trustedRole = user.memberships.some(
    (m) =>
      m.role === "law_firm_rep" ||
      m.role === "accounting_firm_rep" ||
      m.role === "aurienta_rep"
  );
  if (!isMember && !trustedRole) {
    return NextResponse.json(
      { error: "Not authorized to publish evidence for this enterprise" },
      { status: 403 }
    );
  }

  // Optional: validate milestone belongs to the enterprise
  if (milestoneId) {
    const ms = await db.milestone.findUnique({
      where: { id: milestoneId },
      select: { id: true, enterpriseId: true, title: true },
    });
    if (!ms || ms.enterpriseId !== enterpriseId) {
      return NextResponse.json(
        { error: "Milestone not found or does not belong to this enterprise" },
        { status: 400 }
      );
    }
  }

  // Generate mock IPFS CID
  const cid = mockCid();

  const record = await db.ipfsEvidence.create({
    data: {
      enterpriseId,
      milestoneId: milestoneId ?? null,
      uploadedById: user.id,
      cid,
      filename: String(filename).slice(0, 255),
      mimeType: String(mimeType).slice(0, 127),
      sizeBytes: Math.floor(sizeBytes),
      description: description ? String(description).slice(0, 1000) : null,
    },
  });

  // Append a hash-chained ledger event
  const eventType = milestoneId ? "milestone_released" : "evidence_published";
  await db.$transaction(async (tx) => {
    await appendLedgerEvent(tx, {
      enterpriseId,
      eventType,
      payload: {
        cid,
        filename: record.filename,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes,
        milestoneId: record.milestoneId ?? null,
        description: record.description ?? null,
        uploadedBy: user.id,
        ipfsGateway: `ipfs://aurienta.gateway/${cid}`,
        pinned: true,
        filecoinDeal: `deal_${cid.slice(2, 10)}`,
        retentionYears: 10,
      },
      actorId: user.id,
    });
  });

  return NextResponse.json(
    {
      cid: record.cid,
      record: {
        id: record.id,
        cid: record.cid,
        filename: record.filename,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes,
        description: record.description,
        milestoneId: record.milestoneId,
        enterpriseId: record.enterpriseId,
        uploadedAt: record.uploadedAt.toISOString(),
        ipfsUri: `ipfs://aurienta.gateway/${record.cid}`,
      },
      ledgerEvent: eventType,
    },
    { status: 201 }
  );
}, "POST /api/evidence");

// GET /api/evidence — list recent evidence across the platform (radical transparency).
// Optional query: ?enterpriseId=...&limit=...
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam ?? "20", 10) || 20, 1), 100);

  const where = enterpriseId ? { enterpriseId } : {};
  const items = await db.ipfsEvidence.findMany({
    where,
    orderBy: { uploadedAt: "desc" },
    take: limit,
    include: {
      enterprise: { select: { id: true, name: true, slug: true, tier: true } },
    },
  });

  const data = items.map((e) => ({
    id: e.id,
    cid: e.cid,
    filename: e.filename,
    mimeType: e.mimeType,
    sizeBytes: e.sizeBytes,
    description: e.description,
    milestoneId: e.milestoneId,
    enterpriseId: e.enterpriseId,
    enterpriseName: e.enterprise.name,
    enterpriseSlug: e.enterprise.slug,
    enterpriseTier: e.enterprise.tier,
    uploadedAt: e.uploadedAt.toISOString(),
    ipfsUri: `ipfs://aurienta.gateway/${e.cid}`,
  }));

  return NextResponse.json(
    { count: data.length, items: data },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}, "GET /api/evidence");

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
