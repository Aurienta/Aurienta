import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import {
  getWageBands,
  getSectorBenchmarks,
  type WageBand,
  type SectorBenchmark,
} from "@/lib/aurienta/constitutional-wages";
import { ConstitutionalWagesClient } from "@/components/dashboard/capital/constitutional-wages-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Constitutional Wages · AURIENTA",
  description:
    "REC-5 — AI-generated salary bands per role, transparently published. Constitutional Wage Floor (≥ national minimum wage) enforced by CRE.",
};

export default async function ConstitutionalWagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/constitutional-wages");

  // Enterprises the user is a member of.
  const memberEntIds = user.memberships.map((m) => m.enterpriseId);
  const enterprises = memberEntIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: memberEntIds } },
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          sector: true,
          status: true,
        },
        orderBy: { name: "asc" },
      })
    : [];

  const primaryEnterpriseId = enterprises[0]?.id ?? "";
  const primarySector = enterprises[0]?.sector ?? "";

  // Fetch bands (include unpublished — the manager is viewing their own bands)
  // + sector benchmarks (published only) for the primary enterprise's sector.
  const [bands, benchmarks] = primaryEnterpriseId
    ? await Promise.all([
        getWageBands(primaryEnterpriseId, { includeUnpublished: true }),
        primarySector ? getSectorBenchmarks(primarySector) : Promise.resolve([]),
      ])
    : ([[], []] as [WageBand[], SectorBenchmark[]]);

  return (
    <ConstitutionalWagesClient
      enterprises={enterprises}
      initialBands={bands}
      initialBenchmarks={benchmarks}
      initialEnterpriseId={primaryEnterpriseId}
    />
  );
}
