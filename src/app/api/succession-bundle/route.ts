import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { generateSuccessionBundle } from "@/lib/aurienta/succession-bundle";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const bundle = await generateSuccessionBundle(user.id);
  return NextResponse.json(bundle);
});
