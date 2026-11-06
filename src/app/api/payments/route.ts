import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { initiateFawryPayment, initiatePaymobPayment } from "@/lib/aurienta/payments-provider";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const method = body.method || "fawry";
  
  if (method === "fawry") {
    const result = await initiateFawryPayment({
      userId: user.id,
      amount: body.amount,
      description: body.description || "Capital participation",
      merchantRefNum: `ref-${Date.now()}`,
    });
    return NextResponse.json(result);
  } else if (method === "paymob") {
    const result = await initiatePaymobPayment({
      userId: user.id,
      amount: body.amount,
      description: body.description || "Capital participation",
    });
    return NextResponse.json(result);
  }
  return NextResponse.json({ error: "invalid method" }, { status: 400 });
});
