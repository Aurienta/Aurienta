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
  // ConstitutionalEndorsement uses a plain String FK (no Prisma relation),
  // so we join manually via a batched enterprise lookup (same pattern as
  // `listEndorsementsByUser` in src/lib/aurienta/constitutional-endorsement.ts).
  const myEndorsementRows = await db.constitutionalEndorsement.findMany({
    where: { endorserId: user.id },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });
  const myEndorsementEntIds = [...new Set(myEndorsementRows.map((e) => e.enterpriseId))];
  const myEndorsementEnterprises = myEndorsementEntIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: myEndorsementEntIds } },
        select: { id: true, name: true, tier: true, slug: true },
      })
    : [];
  const myEndorsementEntMap = new Map(myEndorsementEnterprises.map((e) => [e.id, e]));
  const myEndorsements = myEndorsementRows.map((r) => ({
    row: r,
    enterprise: myEndorsementEntMap.get(r.enterpriseId) ?? null,
  }));

  // IDs the user has already actively endorsed (for filtering the "can
  // endorse" list).
  const alreadyEndorsedIds = new Set(
    myEndorsements.filter((e) => e.row.active).map((e) => e.row.enterpriseId)
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
  // ConstitutionalEndorsement has no Prisma relation to Enterprise (plain
  // String FK), so we fetch rows first, then batch-join enterprises.
  const managedEnterpriseIds = managedEnterprises.map((m) => m.enterprise.id);
  const managedEndorsementRows = managedEnterpriseIds.length
    ? await db.constitutionalEndorsement.findMany({
        where: { enterpriseId: { in: managedEnterpriseIds } },
        orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      })
    : [];
  const managedEndorsementEntIds = [...new Set(managedEndorsementRows.map((e) => e.enterpriseId))];
  const managedEndorsementEnterprises = managedEndorsementEntIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: managedEndorsementEntIds } },
        select: { id: true, name: true, tier: true, slug: true },
      })
    : [];
  const managedEndorsementEntMap = new Map(managedEndorsementEnterprises.map((e) => [e.id, e]));
  const endorsementsByEnterprise = managedEndorsementRows.map((r) => ({
    row: r,
    enterprise: managedEndorsementEntMap.get(r.enterpriseId) ?? null,
  }));

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
    id: e.row.id,
    endorserId: e.row.endorserId,
    enterpriseId: e.row.enterpriseId,
    enterpriseName: e.enterprise?.name ?? "Unknown",
    enterpriseTier: e.enterprise?.tier ?? "?",
    enterpriseSlug: e.enterprise?.slug ?? "",
    stakeSts: e.row.stakeSts,
    active: e.row.active,
    outcome: e.row.outcome as "pending" | "success" | "failure",
    stsDelta: e.row.stsDelta,
    createdAt: e.row.createdAt.toISOString(),
    resolvedAt: e.row.resolvedAt ? e.row.resolvedAt.toISOString() : null,
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
    id: e.row.id,
    endorserId: e.row.endorserId,
    enterpriseId: e.row.enterpriseId,
    enterpriseName: e.enterprise?.name ?? "Unknown",
    enterpriseTier: e.enterprise?.tier ?? "?",
    enterpriseSlug: e.enterprise?.slug ?? "",
    stakeSts: e.row.stakeSts,
    active: e.row.active,
    outcome: e.row.outcome as "pending" | "success" | "failure",
    stsDelta: e.row.stsDelta,
    createdAt: e.row.createdAt.toISOString(),
    resolvedAt: e.row.resolvedAt ? e.row.resolvedAt.toISOString() : null,
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
