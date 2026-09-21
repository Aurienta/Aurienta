import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/trade-instruments/[id]
// Fetches a single trade instrument with its documents and bank partner.
// Auth + membership: the caller must belong to the same enterprise as the
// instrument.
// @ts-ignore
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const instrument = await (db as any).tradeInstrument.findUnique({
    where: { id },
    include: {
      bankPartner: true,
      documents: { orderBy: { createdAt: "desc" } },
      enterprise: {
        select: { id: true, name: true, slug: true, tier: true, status: true },
      },
    },
  });

  if (!instrument) {
    return NextResponse.json(
      { error: "Trade instrument not found" },
      { status: 404 }
    );
  }

  // Membership check.
  const isMember = user.memberships.some(
    (m) => m.enterpriseId === instrument.enterpriseId
  );
  if (!isMember) {
    return NextResponse.json(
      { error: "Not a member of this enterprise" },
      { status: 403 }
    );
  }

  return NextResponse.json({ instrument });
}
