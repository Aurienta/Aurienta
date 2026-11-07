import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { assessReadiness, getCertifications, STANDARD_CONTROLS } from "@/lib/aurienta/compliance-certs";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  if (!enterpriseId) return NextResponse.json({ error: "enterpriseId required" }, { status: 400 });
  const certs = await getCertifications(enterpriseId);
  return NextResponse.json({ certifications: certs, availableStandards: Object.keys(STANDARD_CONTROLS) });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const track = await assessReadiness({
    enterpriseId: body.enterpriseId,
    standard: body.standard,
    assessedBy: user.id,
  });
  return NextResponse.json(track);
});
