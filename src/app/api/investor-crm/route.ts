import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { addInvestorContact, getFundraisingPipeline, updateInvestorStage } from "@/lib/aurienta/investor-crm";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  if (!enterpriseId) return NextResponse.json({ error: "enterpriseId required" }, { status: 400 });
  const pipeline = await getFundraisingPipeline(enterpriseId);
  return NextResponse.json(pipeline);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const contact = await addInvestorContact({
    enterpriseId: body.enterpriseId,
    name: body.name,
    email: body.email,
    phone: body.phone,
    firm: body.firm,
    notes: body.notes,
  });
  return NextResponse.json(contact);
});
