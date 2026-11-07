import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { uploadDocument, listDocuments, grantAccess } from "@/lib/aurienta/data-room";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  if (!enterpriseId) return NextResponse.json({ error: "enterpriseId required" }, { status: 400 });
  const docs = await listDocuments(enterpriseId);
  return NextResponse.json({ documents: docs });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const doc = await uploadDocument({
    enterpriseId: body.enterpriseId,
    name: body.name,
    category: body.category || "other",
    uploadedBy: user.id,
    ipfsHash: body.ipfsHash,
    accessLevel: body.accessLevel,
    fileSizeBytes: body.fileSizeBytes,
    mimeType: body.mimeType,
  });
  return NextResponse.json(doc);
});
