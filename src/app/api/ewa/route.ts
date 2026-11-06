import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { calculateAvailableWage, requestEwa, getEwaHistory } from "@/lib/aurienta/ewa";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "available") {
    const available = await calculateAvailableWage(user.id);
    return NextResponse.json(available);
  }
  const history = await getEwaHistory(user.id);
  return NextResponse.json({ history });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const result = await requestEwa({
    employeeId: user.id,
    enterpriseId: body.enterpriseId,
    amount: body.amount,
  });
  return NextResponse.json(result);
});
