import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { getUserAllocations } from "@/lib/aurienta/priority-allocation";
import { PriorityAllocationClient } from "@/components/dashboard/roadmap/priority-allocation-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "STS Priority Allocation · AURIENTA",
  description:
    "Deterministic, STS-weighted priority access to capital formation rounds. Compliant with Egyptian law (Gambling Law 10/1956).",
};

// Server component — fetches the calling user's allocations and the list of
// enterprises currently in fundraising_active status, then passes them to the
// client component for rendering.
export default async function PriorityAllocationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/priority-allocation");

  // ── User's existing priority allocations (all phases) ──
  const allocations = await getUserAllocations(user.id);

  // ── Active fundraising enterprises ──
  // Only enterprises in fundraising_active status are eligible for new
  // priority-window registrations. Frozen, closed, or graduated enterprises
  // are excluded.
  const enterprises = await db.enterprise.findMany({
    where: { status: "fundraising_active" },
    select: {
      id: true,
      name: true,
      slug: true,
      tier: true,
      sector: true,
      fundraisingGoalEgp: true,
      raisedEgp: true,
      equityUnitPriceEgp: true,
    },
    orderBy: { raisedEgp: "desc" },
    take: 50,
  });

  return (
    <PriorityAllocationClient
      user={{
        id: user.id,
        legalName: user.legalName,
        sovereignTrustScore: user.sovereignTrustScore,
        tier: user.tier,
      }}
      allocations={allocations}
      enterprises={enterprises.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        tier: e.tier,
        sector: e.sector,
        fundraisingGoalEgp: e.fundraisingGoalEgp,
        raisedEgp: e.raisedEgp,
        equityUnitPriceEgp: e.equityUnitPriceEgp,
      }))}
    />
  );
}
