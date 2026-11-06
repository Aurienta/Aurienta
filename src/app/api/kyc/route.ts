import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { initiateKyc, getKycStatus } from "@/lib/aurienta/kyc-provider";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const status = await getKycStatus(user.id);
  return NextResponse.json({ status });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const result = await initiateKyc({
    userId: user.id,
    idType: body.idType || "national_id",
    idNumber: body.idNumber || "0000",
    legalName: user.legalName,
  });
  return NextResponse.json(result);
});
