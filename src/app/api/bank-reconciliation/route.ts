import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { importBankStatement, getReconciliationStatus, reconcileTransaction } from "@/lib/aurienta/bank-reconciliation";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  if (!enterpriseId) return NextResponse.json({ error: "enterpriseId required" }, { status: 400 });
  const status = await getReconciliationStatus(enterpriseId);
  return NextResponse.json(status);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body.action === "reconcile") {
    await reconcileTransaction({
      bankTransactionId: body.bankTransactionId,
      ledgerEventId: body.ledgerEventId,
      reconciledBy: user.id,
    });
    return NextResponse.json({ reconciled: true });
  }
  const result = await importBankStatement({
    enterpriseId: body.enterpriseId,
    transactions: body.transactions || [],
    importedBy: user.id,
  });
  return NextResponse.json(result);
});
