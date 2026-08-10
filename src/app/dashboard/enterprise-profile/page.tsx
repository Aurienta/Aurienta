import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { TIER_META, STAGE_META, SECTORS, CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnterpriseProfileClient } from "@/components/dashboard/founder/enterprise-profile-client";
import {
  Building2, Crown, Globe, Github, Linkedin, Twitter, FileText,
  Video, Users, Wallet, Scale, GraduationCap, ShieldCheck,
  ExternalLink, AlertTriangle,
} from "lucide-react";

export const metadata = { title: "Enterprise Profile · AURIENTA" };
export const dynamic = "force-dynamic";

export default async function EnterpriseProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/enterprise-profile");

  const { id } = await searchParams;

  // If no enterprise ID, show the enterprise picker
  if (!id) {
    const enterprises = await db.enterprise.findMany({
      where: {
        OR: [
          { founderId: user.id },
          { members: { some: { userId: user.id, role: { in: ["founding_operator", "company_owner"] } } } },
        ],
      },
      select: { id: true, name: true, slug: true, tier: true, sector: true, tagline: true },
      orderBy: { createdAt: "desc" },
    });

    if (enterprises.length === 0) {
      return (
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Building2 className="h-12 w-12 text-gold/50" />
            <h1 className="mt-4 font-serif text-2xl font-semibold">No enterprises yet</h1>
            <p className="mt-2 max-w-md font-sans text-sm text-muted-foreground">
              Create an enterprise from the Founding Operator Studio to access the institutional profile.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gold" />
            <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
              Institutional Enterprise Profile — Select Enterprise
            </span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-semibold">Enterprise Profile</h1>
          <p className="font-sans text-sm text-muted-foreground">
            Present your enterprise at institutional standard for Capital Partners, law firms, accounting firms, and institutional reviewers.
          </p>
        </header>

        <div className="grid gap-3">
          {enterprises.map((e) => (
            <a
              key={e.id}
              href={`/dashboard/enterprise-profile?id=${e.id}`}
              className="group flex items-center justify-between rounded-xl border border-gold/12 bg-background/40 p-4 transition hover:border-gold/30 hover:bg-gold/5"
            >
              <div>
                <p className="font-serif text-lg font-semibold">{e.name}</p>
                {e.tagline && <p className="font-sans text-sm text-muted-foreground">{e.tagline}</p>}
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className="border-gold/20 font-mono text-[10px]">Tier {e.tier}</Badge>
                  <span className="font-sans text-[11px] text-muted-foreground">{SECTORS[e.sector]?.label ?? e.sector}</span>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-gold" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Fetch the full enterprise profile
  const enterprise = await db.enterprise.findUnique({
    where: { id },
    select: {
      id: true, name: true, slug: true, tagline: true, description: true,
      sector: true, tier: true, stage: true, legalForm: true,
      fundraisingGoalEgp: true, raisedEgp: true, equityUnitPriceEgp: true,
      totalEquityUnits: true, founderEquityPct: true,
      lawFirmClientAccountBalanceEgp: true, graduationReadiness: true,
      healthScore: true, healthRating: true, nosiCompliantPct: true,
      policeClearanceValid: true, consultingOptOut: true, status: true,
      monthlyRevenueEgp: true, monthlyBurnEgp: true, employeeCount: true,
      // Extended profile
      website: true, logoUrl: true, mission: true, vision: true,
      problem: true, solution: true, productService: true, targetMarket: true,
      revenueModel: true, currentCustomers: true, pitchDeckUrl: true,
      founderVideoUrl: true, githubUrl: true, linkedinUrl: true, twitterUrl: true,
      founderBio: true, founderStatement: true, founderRequest: true,
      evidenceLevel: true, submissionStatus: true,
      founder: { select: { id: true, legalName: true, sovereignTrustScore: true } },
      _count: { select: { ownershipRecords: true, employees: true, proposals: true, ledgerEvents: true, documents: true } },
    },
  });

  if (!enterprise) {
    redirect("/dashboard/enterprise-profile");
  }

  // Verify the user has access
  const isFounder = enterprise.founder?.id === user.id;
  const membership = user.memberships.find(
    (m) => m.enterpriseId === id && (m.role === "founding_operator" || m.role === "company_owner")
  );
  const canEdit = isFounder || !!membership;

  const tierMeta = TIER_META[enterprise.tier];
  const stageMeta = STAGE_META[enterprise.stage];

  return (
    <div className="mx-auto max-w-6xl">
      <EnterpriseProfileClient
        enterprise={JSON.parse(JSON.stringify(enterprise))}
        tierMeta={tierMeta ?? null}
        stageMeta={stageMeta ?? null}
        sectorLabel={SECTORS[enterprise.sector]?.label ?? enterprise.sector}
        canEdit={canEdit}
        constitutionalHash={CONSTITUTIONAL_HASH}
      />
    </div>
  );
}
