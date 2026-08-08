import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { CareerLedgerTimeline } from "@/components/dashboard/workforce/career-ledger-timeline";
import { type CareerEntryForUi } from "@/components/dashboard/workforce/career-ledger-types";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { shortHash } from "@/lib/aurienta/format";
import { Scale as ScaleIcon, Lock as LockIcon, ShieldCheck as ShieldCheckIcon } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Career Ledger · AURIENTA" };

export default async function CareerLedgerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/career-ledger");

  // Fetch all career ledger entries for this user, include enterprise.
  const entries = await db.careerLedgerEntry.findMany({
    where: { userId: user.id },
    include: {
      enterprise: { select: { id: true, name: true, slug: true, tier: true, sector: true } },
    },
    orderBy: { vcIssuedAt: "desc" },
  });

  // ── Demo seeding: if the user has no entries, synthesize a portable record
  // (this is a no-op if entries already exist). Demonstrates the W3C VC badge + value flow.
  let demoEntries = entries;
  if (entries.length === 0 && user.memberships.length > 0) {
    const target = user.memberships[0];
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 86400000);
    const oneYearAgo = new Date(now.getTime() - 365 * 86400000);
    const twoYearsAgo = new Date(now.getTime() - 730 * 86400000);

    await db.careerLedgerEntry.createMany({
      data: [
        {
          userId: user.id,
          enterpriseId: target.enterpriseId,
          role: target.role,
          entryType: "training",
          title: "Constitutional Stewardship Programme",
          description:
            "Completed the 40-hour constitutional stewardship curriculum covering CRE policy enforcement, Law Firm Client Account reconciliation, and graduation governance.",
          vcCid: "QmCareerVC1" + user.id.slice(-8) + "Training",
          vcIssuedAt: twoYearsAgo,
          valueEgp: 0,
          metadata: JSON.stringify({ provider: "AURIENTA Academy", hours: 40, certId: "ACSP-2024-001" }),
        },
        {
          userId: user.id,
          enterpriseId: target.enterpriseId,
          role: target.role,
          entryType: "milestone",
          title: "Q1 milestone — capital deployment closed",
          description:
            "First close of the law firm client account reached. Funds reconciled against law-firm receipts with zero variance.",
          vcCid: "QmCareerVC2" + user.id.slice(-8) + "Milestone",
          vcIssuedAt: oneYearAgo,
          valueEgp: 0,
          metadata: JSON.stringify({ closeType: "first_close", varianceEgp: 0 }),
        },
        {
          userId: user.id,
          enterpriseId: target.enterpriseId,
          role: target.role,
          entryType: "contribution",
          title: "Quarterly contribution — governance participation",
          description:
            "Cast 4 governance votes with attached reasoning. AI-rated reasoning quality: 8.4/10. Quorum + threshold contributions tracked.",
          vcCid: "QmCareerVC3" + user.id.slice(-8) + "Contrib",
          vcIssuedAt: sixMonthsAgo,
          valueEgp: 120000,
          metadata: JSON.stringify({ votesCast: 4, avgReasoningQuality: 8.4 }),
        },
        {
          userId: user.id,
          enterpriseId: target.enterpriseId,
          role: target.role,
          entryType: "promotion",
          title: "Promoted to Senior Capital Partner",
          description:
            "Sovereign Trust Score increased from 71 to 78 in recognition of consistent governance participation and milestone support. New tier: Trusted Contributor.",
          vcCid: "QmCareerVC4" + user.id.slice(-8) + "Promo",
          vcIssuedAt: now,
          valueEgp: 0,
          metadata: JSON.stringify({ stsFrom: 71, stsTo: 78, newTier: "Trusted Contributor" }),
        },
      ],
    });
    // Re-fetch.
    demoEntries = await db.careerLedgerEntry.findMany({
      where: { userId: user.id },
      include: {
        enterprise: { select: { id: true, name: true, slug: true, tier: true, sector: true } },
      },
      orderBy: { vcIssuedAt: "desc" },
    });
  }

  const entriesForUi: CareerEntryForUi[] = demoEntries.map((e) => ({
    id: e.id,
    enterpriseId: e.enterpriseId,
    role: e.role,
    entryType: e.entryType,
    title: e.title,
    description: e.description,
    vcCid: e.vcCid,
    vcIssuedAt: e.vcIssuedAt.toISOString(),
    valueEgp: e.valueEgp,
    metadata: JSON.parse(e.metadata || "{}"),
    enterprise: {
      id: e.enterprise.id,
      name: e.enterprise.name,
      slug: e.enterprise.slug,
      tier: e.enterprise.tier,
      sector: e.enterprise.sector,
    },
  }));

  const totalValue = entriesForUi.reduce((s, e) => s + (e.valueEgp ?? 0), 0);
  const enterpriseCount = new Set(entriesForUi.map((e) => e.enterpriseId)).size;
  const vcCount = entriesForUi.filter((e) => e.vcCid).length;

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

      <header className="mb-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold/60" />
          <span className="font-mono text-xs uppercase tracking-[0.28em] text-gold-light/80">
            Workforce Partner · Career Ledger
          </span>
        </div>
        <h1 className="font-serif text-3xl font-semibold leading-tight text-gold-gradient sm:text-4xl">
          Your portable reputation
        </h1>
        <p className="max-w-2xl font-sans text-sm text-muted-foreground">
          A private, portable record of your contributions across every AURIENTA enterprise.
          Every entry is a W3C Verifiable Credential anchored to the immutable ledger —
          you own it, you present it, no constitutional authorization required.
        </p>
      </header>

      <CareerLedgerTimeline
        entries={entriesForUi}
        totalValue={totalValue}
        enterpriseCount={enterpriseCount}
        vcCount={vcCount}
      />

      <footer className="mt-8 flex flex-col items-start gap-2 border-t border-gold/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground/85">
          <span className="inline-flex items-center gap-1">
            <ShieldCheckIcon className="h-3 w-3 text-gold/60" /> W3C VC anchored
          </span>
          <span className="hidden text-gold/15 sm:inline">|</span>
          <span className="inline-flex items-center gap-1">
            <ScaleIcon className="h-3 w-3 text-gold/60" /> CRE-validated entries
          </span>
          <span className="hidden text-gold/15 sm:inline">|</span>
          <span className="inline-flex items-center gap-1">
            <LockIcon className="h-3 w-3 text-gold/60" /> You own the credential
          </span>
        </div>
        <span className="font-mono text-xs text-muted-foreground/80">
          Constitutional Hash: {shortHash(CONSTITUTIONAL_HASH, 14, 6)}
        </span>
      </footer>
    </div>
  );
}
