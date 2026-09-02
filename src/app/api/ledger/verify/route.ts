import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { verifyLedgerChain } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ledger/verify?enterpriseId=...    OR    ?slug=...
// Public-trust endpoint: walks the immutable hash-chain for an enterprise
// and reports whether it is intact.  Returns the number of events checked
// and the first broken link (if any).
//
// In a future revision this endpoint can be made fully public (no auth) so
// that external auditors, regulators, and law-firm reps can verify any
// enterprise's ledger at any time.  For now it is restricted to members
// of the enterprise (membership check below) while the surface stabilises.
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  const slug = url.searchParams.get("slug");

  if (!enterpriseId && !slug) {
    return NextResponse.json(
      { error: "Either 'enterpriseId' or 'slug' query parameter is required" },
      { status: 400 }
    );
  }

  // Resolve enterprise by id or slug.
  let enterprise: { id: string; name: string; slug: string } | null = null;
  if (enterpriseId) {
    enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: { id: true, name: true, slug: true },
    });
  } else if (slug) {
    enterprise = await db.enterprise.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
  }

  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found" },
      { status: 404 }
    );
  }

  // Membership check (could be relaxed later to make this fully public).
  const isMember = user.memberships.some(
    (m) => m.enterpriseId === enterprise.id
  );
  if (!isMember) {
    await audit({
      actorId: user.id,
      action: "ledger.verify",
      target: `enterprise:${enterprise.id}`,
      result: "denied",
      reason: "not_a_member",
    });
    return NextResponse.json(
      { error: "Not a member of this enterprise" },
      { status: 403 }
    );
  }

  const verification = await verifyLedgerChain(enterprise.id);

  await audit({
    actorId: user.id,
    action: "ledger.verify",
    target: `enterprise:${enterprise.id}`,
    result: "allowed",
    metadata: {
      intact: verification.intact,
      eventsChecked: verification.eventsChecked,
      brokenAt: verification.brokenAt
        ? {
            sequence: verification.brokenAt.sequence,
            id: verification.brokenAt.id,
            reason: verification.brokenAt.reason,
          }
        : null,
    },
  });

  return NextResponse.json({
    enterpriseId: enterprise.id,
    enterpriseName: enterprise.name,
    enterpriseSlug: enterprise.slug,
    intact: verification.intact,
    eventsChecked: verification.eventsChecked,
    brokenAt: verification.brokenAt ?? null,
    verifiedAt: new Date().toISOString(),
  });
}, "GET /api/ledger/verify");
