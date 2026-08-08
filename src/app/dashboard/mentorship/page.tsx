import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { MentorshipBoard } from "@/components/dashboard/workforce/mentorship-board";
import {
  type MentorForUi,
  type MenteeForUi,
  type ActiveMentorshipForUi,
  type AiMatchForMentorship,
} from "@/components/dashboard/workforce/mentorship-types";
import { askConstitutionalAI } from "@/lib/aurienta/ai";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentorship · AURIENTA" };

export default async function MentorshipPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/mentorship");

  const userCanOffer = user.sovereignTrustScore >= 85;

  // ── Mentors: STS ≥ 85 with founding_operator intent ──
  const mentorRows = await db.user.findMany({
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
        select: {
          enterprise: { select: { id: true, name: true, sector: true, tier: true } },
        },
      },
    },
  });
  const mentors: MentorForUi[] = mentorRows.map((m) => ({
    id: m.id,
    legalName: m.legalName,
    sovereignTrustScore: m.sovereignTrustScore,
    tier: m.tier,
    avatarColor: m.avatarColor,
    primaryIntent: m.primaryIntent,
    enterprise: m.memberships[0]?.enterprise ?? null,
  }));

  // ── Mentees: tier A/B in stage 1/2 ──
  const menteeRows = await db.enterprise.findMany({
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
  const mentees: MenteeForUi[] = menteeRows.map((e) => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    tier: e.tier,
    sector: e.sector,
    stage: e.stage,
    founder: e.founder,
  }));

  // ── Active mentorships (as mentor OR as mentee-founder) ──
  const mentorshipRows = await db.mentorship.findMany({
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
  const activeMentorships: ActiveMentorshipForUi[] = mentorshipRows.map((mr) => ({
    id: mr.id,
    status: mr.status,
    equityGrantPct: mr.equityGrantPct,
    focusAreas: JSON.parse(mr.focusAreas || "[]"),
    startedAt: mr.startedAt?.toISOString() ?? null,
    endedAt: mr.endedAt?.toISOString() ?? null,
    createdAt: mr.createdAt.toISOString(),
    role: mr.mentorId === user.id ? "mentor" : "mentee",
    mentor: mr.mentor,
    menteeEnterprise: mr.menteeEnterprise,
  }));

  // ── Enterprises the user is the founder of (so they can request mentorship) ──
  const founderEnts = await db.enterprise.findMany({
    where: { founderId: user.id },
    select: { id: true },
  });
  const userFounderEntIds = founderEnts.map((e) => e.id);

  // ── AI matching ──
  let aiMatches: AiMatchForMentorship[] = [];
  if (mentors.length > 0 && mentees.length > 0) {
    const mentorSummary = mentors
      .map(
        (m) =>
          `- id=${m.id} name="${m.legalName}" STS=${m.sovereignTrustScore} sector=${m.enterprise?.sector ?? "n/a"} tier=${m.enterprise?.tier ?? "n/a"}`
      )
      .join("\n");
    const menteeSummary = mentees
      .map(
        (e) =>
          `- id=${e.id} name="${e.name}" tier=${e.tier} sector=${e.sector} stage=${e.stage} founderSTS=${e.founder.sovereignTrustScore}`
      )
      .join("\n");

    // Clean, developer-authored system instructions — NO user-controlled text.
    // Mentor/mentee summaries (which contain user-controlled names) flow
    // through `userContext` as UNTRUSTED DATA.
    const systemPrompt =
      `Constitutional mentorship matching. Pair Founding Operator mentors with Tier A/B mentee enterprises.\n\n` +
      `Score each viable mentor→mentee pair 0-100 on sector fit, readiness-gap overlap, and mentor STS seniority. ` +
      `Return ONLY a JSON array (max 3 entries) sorted by score desc, exact shape:\n` +
      `[{"mentorId":"<id>","menteeEnterpriseId":"<id>","matchScore":<0-100>,"rationale":"<one sentence>"}]\n` +
      `No other text. JSON must be valid.`;

    const userContext =
      `MENTORS (STS ≥ 85):\n${mentorSummary}\n\n` +
      `MENTEES (Tier A/B, stage 1/2):\n${menteeSummary}`;

    const userMessage = `Score each viable mentor→mentee pair from the untrusted-data context. Return ONLY the JSON array described in the system instructions.`;

    const aiResult = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "mentorship_match",
      userId: user.id,
      persist: false,
      confidence: 0.84,
    });
    const reply = aiResult.content;

    try {
      const match = reply.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) {
          aiMatches = parsed
            .filter(
              (x) =>
                x &&
                typeof x.mentorId === "string" &&
                typeof x.menteeEnterpriseId === "string" &&
                typeof x.matchScore === "number" &&
                typeof x.rationale === "string"
            )
            .slice(0, 3)
            .map((x) => ({
              mentorId: String(x.mentorId),
              menteeEnterpriseId: String(x.menteeEnterpriseId),
              matchScore: Math.max(0, Math.min(100, Math.round(x.matchScore))),
              rationale: String(x.rationale).slice(0, 220),
            }))
            .filter(
              (m) =>
                mentors.some((mo) => mo.id === m.mentorId) &&
                mentees.some((me) => me.id === m.menteeEnterpriseId)
            );
        }
      }
    } catch {
      aiMatches = [];
    }
  }

  return (
    <div className="relative">
      <SonnerToaster
        position="top-center"
        toastOptions={{
          style: {
            border: "1px solid rgba(212,175,55,0.25)",
            background: "rgba(16,16,18,0.95)",
            color: "#f3eedd",
          },
        }}
      />

      <MentorshipBoard
        mentors={mentors}
        mentees={mentees}
        activeMentorships={activeMentorships}
        aiMatches={aiMatches}
        currentUser={{
          id: user.id,
          legalName: user.legalName,
          sovereignTrustScore: user.sovereignTrustScore,
        }}
        userCanOffer={userCanOffer}
        userFounderEntIds={userFounderEntIds}
      />
    </div>
  );
}
