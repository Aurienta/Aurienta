import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { syndicateSchema, parseBody } from "@/lib/aurienta/validation";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";

// GET /api/syndicates
// Returns all active/forming syndicates (with members + enterprise) the viewer may consider.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const syndicates = await db.syndicate.findMany({
    where: { status: { in: ["forming", "active"] } },
    include: {
      enterprise: {
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          sector: true,
          equityUnitPriceEgp: true,
          healthRating: true,
          healthScore: true,
          status: true,
        },
      },
      leadPartner: {
        select: {
          id: true,
          legalName: true,
          sovereignTrustScore: true,
          tier: true,
          avatarColor: true,
          primaryIntent: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              legalName: true,
              sovereignTrustScore: true,
              avatarColor: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    syndicates: syndicates.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      riskProfile: s.riskProfile,
      status: s.status,
      targetShares: s.targetShares,
      committedShares: s.committedShares,
      createdAt: s.createdAt.toISOString(),
      enterprise: s.enterprise,
      leadPartner: s.leadPartner,
      members: s.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        equityUnits: m.equityUnits,
        amountEgp: m.amountEgp,
        joinedAt: m.joinedAt.toISOString(),
        legalName: m.user.legalName,
        sovereignTrustScore: m.user.sovereignTrustScore,
        avatarColor: m.user.avatarColor,
      })),
      isMember: s.members.some((m) => m.userId === user.id),
      isLead: s.leadPartnerId === user.id,
    })),
  });
}

// POST /api/syndicates — form a new syndicate.
// Body: { name, enterpriseId, targetShares, riskProfile?, description? }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // ── Rate limit ──
  const rl = limiters.governance(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  // ── Validate body ──
  const body = await parseBody(req, syndicateSchema);
  if (body instanceof NextResponse) return body;
  const { name, enterpriseId, targetShares, description } = body;
  const shares = targetShares;
  const profile = body.riskProfile ?? "balanced";

  const enterprise = await db.enterprise.findUnique({ where: { id: enterpriseId } });
  if (!enterprise) {
    return NextResponse.json({ error: "Enterprise not found", code: "not_found" }, { status: 404 });
  }

  // The lead partner must be a capital_partner or founding_operator of the enterprise
  // (or simply a verified AURIENTA member with capital intent).
  const isMember = user.memberships.some((m) => m.enterpriseId === enterpriseId);
  if (!isMember && user.primaryIntent !== "capital_partner") {
    return NextResponse.json(
      {
        error:
          "Only enterprise members or capital partners may form a syndicate for this enterprise.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  // ── Persist syndicate + ledger event inside ONE transaction ──
  const syndicate = await db.$transaction(async (tx) => {
    const created = await tx.syndicate.create({
      data: {
        name: String(name).trim().slice(0, 120),
        description: description ? String(description).trim().slice(0, 1200) : null,
        leadPartnerId: user.id,
        enterpriseId,
        targetShares: shares,
        riskProfile: profile,
        status: "forming",
      },
      include: {
        enterprise: { select: { id: true, name: true, slug: true, tier: true } },
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId,
      eventType: "cre_decision",
      payload: {
        action: "syndicate_formed",
        syndicateId: created.id,
        name: created.name,
        targetShares: shares,
        riskProfile: profile,
        leadPartnerId: user.id,
        note: "Constitutional syndicate formed — coordinates pre-emptive rights; custody remains individual.",
      },
      actorId: user.id,
    });

    return created;
  });

  await audit({
    actorId: user.id,
    action: "syndicate.form",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      syndicateId: syndicate.id,
      targetShares: shares,
      riskProfile: profile,
    },
  });

  return NextResponse.json({ syndicate }, { status: 201 });
}
