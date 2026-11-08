import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { generatePricingReport } from "@/lib/aurienta/insurance-bond-pricing";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  const healthScore = parseInt(url.searchParams.get("healthScore") || "75");
  const insuredAmount = parseInt(url.searchParams.get("insuredAmount") || "1000000");
  if (!enterpriseId) return NextResponse.json({ error: "enterpriseId required" }, { status: 400 });
  const report = await generatePricingReport(enterpriseId, healthScore, insuredAmount);
  return NextResponse.json(report);
});
