import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ProfitSharingClient } from "@/components/dashboard/roadmap/profit-sharing-client";
import {
  listAgreementsForUser,
  type AgreementWithEnterprise,
} from "@/lib/aurienta/profit-sharing";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Profit-Sharing Agreements · AURIENTA",
  description:
    "Constitutional profit-share contracts (مشاركة في الأرباح) — NOT securities. CRE enforces profit distribution from enterprise revenue. No fixed coupon, no secondary market, no trading. Compliant with Egyptian Capital Market Law 95/1992.",
};

// ─────────────────────────────────────────────────────────────────────────────
// /dashboard/profit-sharing — Phase 1 of the Modified Implementation Roadmap.
//
// Lists the current user's profit-share agreements and presents a "New
// Agreement" form bound to the enterprises the user is a member of.
// Server-rendered; client component handles form submit, terminate, and
// ledger drawer.
// ─────────────────────────────────────────────────────────────────────────────
export default async function ProfitSharingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/profit-sharing");

  // ── Agreements where the current user is the partner ──
  const agreements: AgreementWithEnterprise[] = await listAgreementsForUser(
    user.id
  );

  // ── Enterprises the user may form an agreement for (any membership) ──
  const memberEntIds = user.memberships.map((m) => m.enterpriseId);
  const enterprisesForForm = memberEntIds.length
    ? await db.enterprise.findMany({
        where: {
          id: { in: memberEntIds },
          status: { notIn: ["draft", "graduated"] },
        },
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

  return (
    <div className="relative">
      <SonnerToaster
        position="top-center"
        toastOptions={{
          style: {
            border: "1px solid rgba(99, 102, 241, 0.25)",
            background: "rgba(255, 255, 255, 0.95)",
            color: "#1E1B4B",
          },
        }}
      />
      <ProfitSharingClient
        userId={user.id}
        agreements={agreements}
        enterprises={enterprisesForForm}
      />
    </div>
  );
}
