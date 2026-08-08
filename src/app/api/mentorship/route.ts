import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { mentorshipSchema, parseBody } from "@/lib/aurienta/validation";

// GET /api/mentorship
// Returns mentors (STS ≥ 85), mentees (Tier A/B in stage 1/2), and the caller's active mentorships.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Mentors — STS ≥ 85 with founding_operator intent
  const mentors = await db.user.findMany({
    where: {
      sovereignTrustScore: { gte: 85 },
      primaryIntent: "founding_operator",
    },
    take: 6,
    select: {
      id: true,
      legalName: true,
      sovereignTrustScore: true,
      tier: true,
      avatarColor: true,
      primaryIntent: true,
      memberships: {
        where: { role: "founding_operator" },
        take: 1,
        select: { enterprise: { select: { id: true, name: true, sector: true, tier: true } } },
      },
    },
  });

  // Mentees — enterprises tier A/B in stage 1/2
  const mentees = await db.enterprise.findMany({
    where: {
      tier: { in: ["A", "B"] },
      stage: { in: ["stage_1", "stage_2"] },
      status: { notIn: ["graduated", "draft"] },
    },
    take: 6,
    include: {
      founder: {
        select: {
          id: true,
          legalName: true,
          sovereignTrustScore: true,
          avatarColor: true,
          tier: true,
        },
      },
    },
  });

  // Caller's active mentorships (as mentor or as mentee-founder)
  const mentorships = await db.mentorship.findMany({
    where: {
      OR: [
        { mentorId: user.id },
        { menteeEnterprise: { founderId: user.id } },
      ],
    },
    include: {
      mentor: {
        select: {
          id: true,
          legalName: true,
          sovereignTrustScore: true,
          avatarColor: true,
          tier: true,
        },
      },
      menteeEnterprise: {
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          sector: true,
          stage: true,
          founder: { select: { id: true, legalName: true, avatarColor: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    mentors: mentors.map((m) => ({
      id: m.id,
      legalName: m.legalName,
      sovereignTrustScore: m.sovereignTrustScore,
      tier: m.tier,
      avatarColor: m.avatarColor,
      primaryIntent: m.primaryIntent,
      enterprise: m.memberships[0]?.enterprise ?? null,
    })),
    mentees: mentees.map((e) => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      tier: e.tier,
      sector: e.sector,
      stage: e.stage,
      founder: e.founder,
    })),
    mentorships: mentorships.map((mr) => ({
      id: mr.id,
      status: mr.status,
      equityGrantPct: mr.equityGrantPct,
      focusAreas: JSON.parse(mr.focusAreas || "[]"),
      startedAt: mr.startedAt?.toISOString() ?? null,
      endedAt: mr.endedAt?.toISOString() ?? null,
      createdAt: mr.createdAt.toISOString(),
      mentor: mr.mentor,
      menteeEnterprise: mr.menteeEnterprise,
      role: mr.mentorId === user.id ? "mentor" : "mentee",
    })),
  });
}

// POST /api/mentorship
// Body (founder requesting): { menteeEnterpriseId, focusAreas }
// Body (mentor offering):    { mentorId, menteeEnterpriseId, focusAreas }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await parseBody(req, mentorshipSchema);
  if (body instanceof NextResponse) return body;
  const { menteeEnterpriseId, mentorId, focusAreas } = body;

  if (!menteeEnterpriseId) {
    return NextResponse.json(
      { error: "menteeEnterpriseId is required" },
      { status: 400 }
    );
  }

  const enterprise = await db.enterprise.findUnique({
    where: { id: menteeEnterpriseId },
    include: { founder: { select: { id: true, legalName: true } } },
  });
  if (!enterprise) {
    return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
  }

  // Determine whether this is a "request" (founder) or an "offer" (mentor)
  let finalMentorId: string;
  let finalFocusAreas: string[];

  if (mentorId) {
    // Offer to mentor — caller IS the mentor
    finalMentorId = user.id;
    finalFocusAreas = Array.isArray(focusAreas) ? focusAreas.slice(0, 6) : [];
    if (user.sovereignTrustScore < 85) {
      return NextResponse.json(
        {
          error: "Only Founding Operators with Sovereign Trust Score ≥ 85 may offer mentorship.",
          code: "sts_too_low",
        },
        { status: 403 }
      );
    }
  } else {
    // Founder requesting mentorship — caller must be the mentee's founder
    if (enterprise.founderId !== user.id) {
      return NextResponse.json(
        {
          error: "Only the founding operator of this enterprise may request a mentor.",
          code: "not_founder",
        },
        { status: 403 }
      );
    }
    finalMentorId = ""; // No mentor selected yet — placeholder, status proposed
    finalFocusAreas = Array.isArray(focusAreas) ? focusAreas.slice(0, 6) : [];
  }

  // If the founder is requesting, set status "proposed" with no mentor — wait for offers.
  // If a mentor is offering, set status "proposed" with the caller as mentor — wait for founder acceptance.
  const mentorship = await db.mentorship.create({
    data: {
      mentorId: finalMentorId || user.id, // provisionally the caller if founder-request; the caller if mentor-offer
      menteeEnterpriseId,
      status: "proposed",
      focusAreas: JSON.stringify(finalFocusAreas),
    },
    include: {
      mentor: { select: { id: true, legalName: true, sovereignTrustScore: true, avatarColor: true } },
      menteeEnterprise: { select: { id: true, name: true, tier: true, sector: true, slug: true } },
    },
  });

  await db.$transaction(async (tx) => {
    await appendLedgerEvent(tx, {
      enterpriseId: menteeEnterpriseId,
      eventType: "cre_decision",
      payload: {
        action: "mentorship_proposed",
        mentorshipId: mentorship.id,
        mentorId: mentorship.mentorId,
        menteeEnterpriseId,
        mode: mentorId ? "mentor_offer" : "founder_request",
        focusAreas: finalFocusAreas,
        note: "Constitutional mentorship proposal. Mentor earns a small equity grant from the mentee's founder pool on activation.",
      },
      actorId: user.id,
    });
  });

  return NextResponse.json({ mentorship }, { status: 201 });
}
