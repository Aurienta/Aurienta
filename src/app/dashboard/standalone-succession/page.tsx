export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { listCasesForUser } from "@/lib/aurienta/standalone-succession";
import { listOpenRounds } from "@/lib/aurienta/diaspora-corridor";
import { StandaloneSuccessionClient } from "@/components/dashboard/roadmap/standalone-succession-client";

export const metadata = { title: "Standalone Succession Protocol · AURIENTA" };

export default async function StandaloneSuccessionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/standalone-succession");

  // Fetch the caller's filed succession cases + the currently-open diaspora
  // corridor rounds in parallel. The diaspora corridor section is shown below
  // the succession section because both features target family-business +
  // diaspora-capital use cases that overlap heavily.
  const [cases, rounds] = await Promise.all([
    listCasesForUser(user.id),
    listOpenRounds(),
  ]);

  return (
    <StandaloneSuccessionClient
      user={{
        id: user.id,
        legalName: user.legalName,
        email: user.email,
      }}
      cases={cases.map((c) => ({
        id: c.id,
        businessName: c.businessName,
        businessType: c.businessType,
        jurisdiction: c.jurisdiction,
        declarationHash: c.declarationHash,
        shamirThreshold: c.shamirThreshold,
        shamirShares: c.shamirShares,
        activationDate: c.activationDate?.toISOString() ?? null,
        status: c.status as "drafted" | "activated" | "executing" | "completed",
        feeEgp: c.feeEgp,
        createdAt: c.createdAt.toISOString(),
      }))}
      rounds={rounds.map((r) => ({
        id: r.id,
        enterpriseId: r.enterpriseId,
        enterpriseName: r.enterpriseName,
        enterpriseSlug: r.enterpriseSlug,
        enterpriseTier: r.enterpriseTier,
        enterpriseSector: r.enterpriseSector,
        totalPledgedEgp: r.totalPledgedEgp,
        participantCount: r.participantCount,
        fxRateLocked: r.fxRateLocked,
        status: r.status as "open" | "closed" | "settled",
        closesAt: r.closesAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
