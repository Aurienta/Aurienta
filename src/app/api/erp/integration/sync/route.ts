import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { fullSync, syncModule } from "@/lib/aurienta/erp-integration";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { integrationId, module, full } = await req.json();
  if (!integrationId) return NextResponse.json({ error: "integrationId required" }, { status: 400 });

  if (full || !module) {
    const result = await fullSync(integrationId);
    return NextResponse.json(result);
  } else {
    const result = await syncModule(integrationId, module);
    return NextResponse.json(result);
  }
});
