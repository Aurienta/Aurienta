import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { createTenderOffer, getTenderOffers, respondToTender } from "@/lib/aurienta/tender-offer";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  if (!enterpriseId) return NextResponse.json({ error: "enterpriseId required" }, { status: 400 });
  const offers = await getTenderOffers(enterpriseId);
  return NextResponse.json({ offers });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body.action === "respond") {
    const response = await respondToTender({
      tenderId: body.tenderId,
      stakeholderId: user.id,
      stakeholderName: user.legalName,
      unitsOffered: body.unitsOffered,
    });
    return NextResponse.json(response);
  }
  const offer = await createTenderOffer({
    enterpriseId: body.enterpriseId,
    initiatorId: user.id,
    offerType: body.offerType || "buyback",
    pricePerUnitEgp: body.pricePerUnitEgp,
    maxUnits: body.maxUnits,
    minUnits: body.minUnits,
    closesInDays: body.closesInDays,
  });
  return NextResponse.json(offer);
});
