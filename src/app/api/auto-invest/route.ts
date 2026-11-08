import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { configureAutoInvest, getAutoInvestHistory } from "@/lib/aurienta/auto-invest";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const history = await getAutoInvestHistory(user.id);
  return NextResponse.json({ history });
});
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const config = await configureAutoInvest({ userId: user.id, ...body });
  return NextResponse.json(config);
});
