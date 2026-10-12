import { redirect } from "next/navigation";
import { createHash } from "crypto";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { OracleClient } from "@/components/dashboard/roadmap/oracle-client";
import { platformPublicKeyHex } from "@/lib/aurienta/oracle-network";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Consensus Oracle Network · AURIENTA",
  description:
    "External queries to AURIENTA's 5-provider AI consensus. Ed25519-signed verdicts. Per-query pricing. Technology service, NOT financial advice.",
};

/**
 * Derive a deterministic per-user demo API key for the dashboard console.
 * This lets a non-aurienta_rep user see their own query history without
 * needing to manage a real API key. Real keys (POST /api/oracle/keys) are
 * still issued for external/curl usage.
 */
function deriveDemoApiKey(email: string): string {
  return `aur_oracle-demo-${email}`;
}

export default async function OraclePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/oracle");

  const isAurientaRep = user.memberships.some((m) => m.role === "aurienta_rep");

  // Fetch the user's query history.
  // - aurienta_rep: see all queries (most recent 50).
  // - Otherwise: only queries made via the dashboard console (whose
  //   apiKeyHash = SHA-256 of the demo key).
  const demoApiKey = deriveDemoApiKey(user.email);
  const demoKeyHash = createHash("sha256").update(demoApiKey).digest("hex");

  const history = await db.oracleQuery.findMany({
    where: isAurientaRep ? {} : { apiKeyHash: demoKeyHash },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <OracleClient
      userEmail={user.email}
      isAurientaRep={isAurientaRep}
      demoApiKey={demoApiKey}
      platformPublicKey={platformPublicKeyHex()}
      history={history.map((h) => ({
        id: h.id,
        queryText: h.queryText,
        queryHash: h.queryHash,
        verdict: h.consensusVerdict,
        decisionToken: h.decisionToken ?? null,
        modelsConsulted: h.modelsConsulted,
        responseTimeMs: h.responseTimeMs,
        disclaimerShown: h.disclaimerShown,
        createdAt: h.createdAt.toISOString(),
      }))}
    />
  );
}
