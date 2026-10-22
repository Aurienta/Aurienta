import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { getSyncLogs } from "@/lib/aurienta/erp-integration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const integrationId = new URL(req.url).searchParams.get("integrationId");
  if (!integrationId) return NextResponse.json({ error: "integrationId required" }, { status: 400 });

  const logs = await getSyncLogs(integrationId, 50);
  return NextResponse.json({ logs });
});
