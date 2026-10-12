// /dashboard/endorsements — Constitutional Endorsement surface.
//
// Reputation-as-collateral, NOT financial staking. Partners ENDORSE
// enterprises with their Sovereign Trust Score (reputation only). On
// resolution, the endorser gains or loses STS — no financial value, no
// dividends, no derivatives.
//
// This server component fetches:
//   1. The current user's existing endorsements (active + resolved).
//   2. Active enterprises they can endorse (status='active', not already
//      endorsed by them, not founded by them — no self-endorsement).
//   3. The set of enterprises they manage / founded / own so the client can
//      render Resolve buttons only for those.
//
// The client component owns all interaction.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import {
  ENDORSEMENT_MAX_PER_USER,
  ENDORSEMENT_STAKE_CAP,
  ENDORSEMENT_MIN_STS,
} from "@/lib/aurienta/constitutional-endorsement";
import { EndorsementsClient } from "@/components/dashboard/roadmap/endorsements-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Constitutional Endorsement · AURIENTA",
  description:
    "Reputation-as-collateral. Endorse enterprises with your Sovereign Trust Score. No financial staking, no dividends, no derivatives.",
};

// ── Roles that may resolve an endorsement on an enterprise ──
const RESOLVE_ROLES = new Set([
  "founding_operator",
  "manager",
  "company_owner",
  "board_member",
  "aurienta_rep",
]);

export default async function EndorsementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/endorsements");

  // ── 1. The user's existing endorsements ──
  const myEndorsements = await db.constitutionalEndorsement.findMany({
    where: { endorserId: user.id },
    include: {
      enterprise: { select: { id: true, name: true, tier: true, slug: true } },
    },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  // IDs the user has already actively endorsed (for filtering the "can
  // endorse" list).
  const alreadyEndorsedIds = new Set(
    myEndorsements.filter((e) => e.active).map((e) => e.enterpriseId)
  );

  // ── 2. Enterprises the user manages / founded / owns ──
  // (Used by the client to render Resolve buttons + show manager stats.)
  const managedEnterprises = await db.enterpriseMember.findMany({
    where: {
      userId: user.id,
      role: { in: Array.from(RESOLVE_ROLES) },
    },
    include: {
      enterprise: { select: { id: true, name: true, tier: true, slug: true, status: true } },
    },
  });

  // For each managed enterprise, fetch its endorsements + stats in parallel.
  // (These power the "Resolve" UI on the manager's side of the page.)
  const managedEnterpriseIds = managedEnterprises.map((m) => m.enterprise.id);
  const endorsementsByEnterprise = managedEnterpriseIds.length
    ? await db.constitutionalEndorsement.findMany({
        where: { enterpriseId: { in: managedEnterpriseIds } },
        include: {
          enterprise: { select: { id: true, name: true, tier: true, slug: true } },
        },
        orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      })
    : [];

  // ── 3. Active enterprises this user CAN endorse ──
  // Status active, not already endorsed (active) by them, not founded by them.
  const activeEnterprises = await db.enterprise.findMany({
    where: {
      status: "active",
      id: { notIn: Array.from(alreadyEndorsedIds) },
      founderId: { not: user.id },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      tier: true,
      sector: true,
      tagline: true,
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  // ── Map to client-friendly shapes (ISO dates, no Date objects) ──
  const myEndorsementsForClient = myEndorsements.map((e) => ({
    id: e.id,
    endorserId: e.endorserId,
    enterpriseId: e.enterpriseId,
    enterpriseName: e.enterprise.name,
    enterpriseTier: e.enterprise.tier,
    enterpriseSlug: e.enterprise.slug,
    stakeSts: e.stakeSts,
    active: e.active,
    outcome: e.outcome,
    stsDelta: e.stsDelta,
    createdAt: e.createdAt.toISOString(),
    resolvedAt: e.resolvedAt ? e.resolvedAt.toISOString() : null,
  }));

  const managedForClient = managedEnterprises.map((m) => ({
    id: m.enterprise.id,
    name: m.enterprise.name,
    slug: m.enterprise.slug,
    tier: m.enterprise.tier,
    status: m.enterprise.status,
    role: m.role,
  }));

  const endorsementsByEnterpriseForClient = endorsementsByEnterprise.map((e) => ({
    id: e.id,
    endorserId: e.endorserId,
    enterpriseId: e.enterpriseId,
    enterpriseName: e.enterprise.name,
    enterpriseTier: e.enterprise.tier,
    enterpriseSlug: e.enterprise.slug,
    stakeSts: e.stakeSts,
    active: e.active,
    outcome: e.outcome,
    stsDelta: e.stsDelta,
    createdAt: e.createdAt.toISOString(),
    resolvedAt: e.resolvedAt ? e.resolvedAt.toISOString() : null,
  }));

  const activeEnterprisesForClient = activeEnterprises.map((e) => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    tier: e.tier,
    sector: e.sector,
    tagline: e.tagline ?? "",
  }));

  return (
    <EndorsementsClient
      user={{
        id: user.id,
        legalName: user.legalName,
        sovereignTrustScore: user.sovereignTrustScore,
        tier: user.tier,
      }}
      myEndorsements={myEndorsementsForClient}
      managedEnterprises={managedForClient}
      endorsementsOnManagedEnterprises={endorsementsByEnterpriseForClient}
      activeEnterprises={activeEnterprisesForClient}
      constants={{
        maxPerUser: ENDORSEMENT_MAX_PER_USER,
        stakeCap: ENDORSEMENT_STAKE_CAP,
        minSts: ENDORSEMENT_MIN_STS,
      }}
    />
  );
}
