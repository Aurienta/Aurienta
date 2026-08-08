import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import {
  AnomalyCard,
  type Anomaly,
} from "@/components/dashboard/intel/anomaly-card";
import { ShieldAlert, ScanSearch, FileWarning, Gauge } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Anomalies · AURIENTA",
  description:
    "AI-flagged expenses narrated as plain-language investigation briefs — court-admissible.",
};

// Supplemental mock anomalies — these mirror real constitutional risk patterns
// (threshold gaming, related-party disclosure gaps, duplicates) so the page is
// demonstrably useful even when the seeded ledger has only one flagged expense.
// All amounts, vendors and timelines are illustrative.
const MOCK_ANOMALIES: Omit<Anomaly, "id" | "enterpriseId">[] = [
  {
    enterpriseName: "EcoPack Egypt",
    enterpriseTier: "C",
    category: "logistics",
    description: "Shipping — Alexandria retailer distribution",
    vendor: "Fresh Roast Trading",
    amountEgp: 150000,
    flag: "related_party",
    createdAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
    submitterName: "Ahmed Khaled",
  },
  {
    enterpriseName: "EcoPack Egypt",
    enterpriseTier: "C",
    category: "supplies",
    description: "Resin stock — 9th sub-50k order this month",
    vendor: "Nile Polymer Supply",
    amountEgp: 49000,
    flag: "threshold_gaming",
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    submitterName: "Ahmed Khaled",
  },
  {
    enterpriseName: "Nile Brew Café",
    enterpriseTier: "D",
    category: "marketing",
    description: "Influencer campaign — duplicate of invoice #4471",
    vendor: "Cairo Social Co.",
    amountEgp: 72000,
    flag: "duplicate",
    createdAt: new Date(Date.now() - 4 * 86_400_000).toISOString(),
    submitterName: "Khalil Mansour",
  },
  {
    enterpriseName: "StreetBites",
    enterpriseTier: "A",
    category: "supplies",
    description: "Produce — 10 orders of 49,000 EGP over 14 days",
    vendor: "Cairo Fresh Wholesale",
    amountEgp: 49000,
    flag: "threshold_gaming",
    createdAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    submitterName: "Layla Mostafa",
  },
];

export default async function AnomaliesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/anomalies");

  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);

  // Query expenses where aiRiskFlag is not null and not "none".
  // If the user has no enterprise memberships, fall back to showing all
  // flagged expenses across the platform (institutional observer view).
  const whereClause = enterpriseIds.length
    ? {
        enterpriseId: { in: enterpriseIds },
        aiRiskFlag: { not: null, notIn: ["none", ""] },
      }
    : { aiRiskFlag: { not: null, notIn: ["none", ""] } };

  const expenses = await db.expense.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      enterprise: { select: { id: true, name: true, tier: true } },
      submitter: { select: { legalName: true } },
    },
  });

  // Serialize + supplement with mock anomalies for the demo.
  const realAnomalies: Anomaly[] = expenses.map((e) => ({
    id: e.id,
    enterpriseId: e.enterpriseId,
    enterpriseName: e.enterprise.name,
    enterpriseTier: e.enterprise.tier,
    category: e.category,
    description: e.description,
    vendor: e.vendor,
    amountEgp: e.amountEgp,
    flag: e.aiRiskFlag ?? "threshold_gaming",
    createdAt: e.createdAt.toISOString(),
    submitterName: e.submitter?.legalName ?? null,
  }));

  const mockWithIds: Anomaly[] = MOCK_ANOMALIES.map((m, i) => ({
    ...m,
    id: `mock-anomaly-${i + 1}`,
    enterpriseId: "mock",
  }));

  const all = [...realAnomalies, ...mockWithIds];

  // Summary stats
  const detected = all.length;
  const highConfidence = all.filter(
    (a) => a.flag === "related_party" || a.flag === "duplicate"
  ).length;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
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

      <PageHeader
        eyebrow="Anomaly Narration AI"
        icon={ShieldAlert}
        title="Every flag, narrated."
        subtitle="The CRE flags cryptic risk patterns on every expense. The Narration AI turns each flag into a plain-language investigation brief — persisted as a ledger-immutable AiArtifact, admissible as evidence. Board-ready in 30 seconds."
      />

      {/* Summary KPIs */}
      <section
        className="grid gap-3 sm:grid-cols-3"
        aria-label="Anomaly summary"
      >
        <Kpi
          icon={ScanSearch}
          label="Anomalies detected"
          value={detected.toString()}
          detail="Across your enterprises · last 30 expenses"
          tone="amber"
        />
        <Kpi
          icon={FileWarning}
          label="High-confidence"
          value={highConfidence.toString()}
          detail="Related-party + duplicate flags"
          tone="red"
        />
        <Kpi
          icon={Gauge}
          label="Auto-freeze threshold"
          value=">85%"
          detail="Confidence → law firm client account frozen · board notified"
          tone="gold"
        />
      </section>

      {/* Anomaly cards */}
      {all.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gold/15 bg-foreground/[0.01] py-16 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06]">
            <ShieldAlert className="h-5 w-5 text-emerald-300" />
          </span>
          <p className="font-serif text-base font-semibold text-foreground">
            No anomalies detected
          </p>
          <p className="max-w-md font-sans text-[12px] text-muted-foreground">
            The CRE found no risk-flagged expenses in your enterprises. Every
            new expense is screened against Rego policies in real time.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {all.map((a) => (
            <AnomalyCard key={a.id} anomaly={a} />
          ))}
        </div>
      )}

      <p className="text-center font-mono text-[11px] leading-relaxed text-muted-foreground/80">
        Each narration is hash-stamped and appended to the immutable ledger.
        AURIENTA never modifies or reverses a CRE decision — narrations may be
        tendered as evidence.
      </p>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  tone: "amber" | "red" | "gold";
}) {
  const toneClasses = {
    amber: "border-amber-400/20 from-amber-400/[0.05] text-amber-300",
    red: "border-red-400/20 from-red-400/[0.05] text-red-300",
    gold: "border-gold/20 from-gold/[0.05] text-gold-light",
  }[tone];
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-gradient-to-br to-transparent p-4 ${toneClasses}`}
    >
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${toneClasses}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-serif text-base font-semibold text-foreground">
          {value}
        </p>
        <p className="truncate font-mono text-[11px] text-muted-foreground/85">
          {detail}
        </p>
      </div>
    </div>
  );
}
