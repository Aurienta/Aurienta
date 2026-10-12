// AURIENTA Dashboard — Governance-as-a-Service (GaaS)
// ═══════════════════════════════════════════════════════════════════
// Phase 1 of the Modified Implementation Roadmap.
//
// External organizations (cooperatives, NGOs, family offices, DAOs) register
// governance rules; the CRE validates decisions. Pure technology
// infrastructure — AURIENTA does NOT manage funds, securities, or custody.
// Subscription pricing model.
// ═══════════════════════════════════════════════════════════════════

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  listOrganizations,
  listPolicies,
  listDecisions,
} from "@/lib/aurienta/gaas";
import { GaasClient } from "@/components/dashboard/roadmap/gaas-client";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Governance-as-a-Service · AURIENTA",
  description:
    "Register governance rules; CRE validates decisions. Pure technology infrastructure — no funds, no securities, no custody.",
};

// ── Serialization helpers ──
// Next.js Server Components can only pass POJOs to Client Components. These
// mappers convert Date fields to ISO strings so the data crosses the boundary
// without triggering the "only plain objects can be passed" error.

type ClientOrganization = {
  id: string;
  name: string;
  slug: string;
  type: string;
  contactEmail: string;
  subscriptionPlan: string;
  monthlyFeeEgp: number;
  active: boolean;
  createdAt: string;
};

type ClientPolicy = {
  id: string;
  organizationId: string;
  name: string;
  ruleText: string;
  ruleHash: string;
  enforcementLogic: string;
  active: boolean;
  createdAt: string;
};

type ClientDecision = {
  id: string;
  organizationId: string;
  policyId: string;
  decisionText: string;
  decisionHash: string;
  verdict: string;
  reason: string | null;
  decisionToken: string | null;
  actorEmail: string;
  createdAt: string;
};

export default async function GaasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/gaas");

  const isAurientaRep = user.memberships.some((m) => m.role === "aurienta_rep");

  // ── 1. List the user's organizations ──
  const organizations = await listOrganizations({
    id: user.id,
    email: user.email,
    isAurientaRep,
  });

  // ── 2. Pull all policies + decisions for those organizations in parallel ──
  // For users with many orgs, this issues 2 × N queries. Acceptable for now
  // (Phase 1); a single grouped query can replace it once the dashboard
  // supports pagination per org.
  const orgIds = organizations.map((o) => o.id);
  const [policiesByOrg, decisionsByOrg] = await Promise.all([
    Promise.all(
      orgIds.map((id) =>
        listPolicies(id).then((rows) => [id, rows] as const).catch(() => [id, []] as const)
      )
    ),
    Promise.all(
      orgIds.map((id) =>
        listDecisions(id).then((rows) => [id, rows] as const).catch(() => [id, []] as const)
      )
    ),
  ]);

  const policies = policiesByOrg.flatMap(([, rows]) => rows);
  const decisions = decisionsByOrg.flatMap(([, rows]) => rows);

  // ── 3. Convert to client-safe shape ──
  const clientOrgs: ClientOrganization[] = organizations.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    type: o.type,
    contactEmail: o.contactEmail,
    subscriptionPlan: o.subscriptionPlan,
    monthlyFeeEgp: o.monthlyFeeEgp,
    active: o.active,
    createdAt: o.createdAt.toISOString(),
  }));

  const clientPolicies: ClientPolicy[] = policies.map((p) => ({
    id: p.id,
    organizationId: p.organizationId,
    name: p.name,
    ruleText: p.ruleText,
    ruleHash: p.ruleHash,
    enforcementLogic: p.enforcementLogic,
    active: p.active,
    createdAt: p.createdAt.toISOString(),
  }));

  const clientDecisions: ClientDecision[] = decisions.map((d) => ({
    id: d.id,
    organizationId: d.organizationId,
    policyId: d.policyId,
    decisionText: d.decisionText,
    decisionHash: d.decisionHash,
    verdict: d.verdict,
    reason: d.reason,
    decisionToken: d.decisionToken,
    actorEmail: d.actorEmail,
    createdAt: d.createdAt.toISOString(),
  }));

  // Top-level stats for the summary header.
  const stats = {
    organizations: clientOrgs.length,
    policies: clientPolicies.length,
    decisions: clientDecisions.length,
    allowed: clientDecisions.filter((d) => d.verdict === "allowed").length,
    denied: clientDecisions.filter((d) => d.verdict === "denied").length,
    pending: clientDecisions.filter((d) => d.verdict === "pending").length,
  };

  return (
    <GaasClient
      user={{
        legalName: user.legalName,
        email: user.email,
        isAurientaRep,
      }}
      organizations={clientOrgs}
      policies={clientPolicies}
      decisions={clientDecisions}
      stats={stats}
      constitutionalHash={CONSTITUTIONAL_HASH}
    />
  );
}
