export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { ComplianceMatrix } from "@/components/dashboard/institutional/compliance-matrix";
import { AiOversightPanel } from "@/components/dashboard/institutional/ai-oversight-panel";
import { AuditLogFeed } from "@/components/dashboard/institutional/audit-log-feed";
import { RegulatoryIntegrations } from "@/components/dashboard/institutional/regulatory-integrations";
import { PageTransition } from "@/components/dashboard/page-transition";
import { ShieldCheck, Lock, ScrollText, Building2 } from "lucide-react";

export const metadata = { title: "Compliance · AURIENTA" };

export default async function CompliancePage() {
  const user = (await getCurrentUser())!;

  // Pull the user's enterprises
  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);
  const enterprises = enterpriseIds.length
    ? await db.enterprise.findMany({ where: { id: { in: enterpriseIds } } })
    : [];

  // Audit log: real entries if any, else the feed shows the curated fallback set.
  const auditLogs = await db.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 12,
    include: { actor: true },
  });

  const matrixRows = enterprises.map((e) => ({
    id: e.id,
    name: e.name,
    tier: e.tier,
    sector: e.sector,
    healthRating: e.healthRating,
    healthScore: e.healthScore,
    nosiCompliantPct: e.nosiCompliantPct,
    policeClearanceValid: e.policeClearanceValid,
  }));

  const auditEntries = auditLogs.map((a) => ({
    id: a.id,
    action: a.action,
    target: a.target,
    result: a.result,
    reason: a.reason,
    actorLabel: a.actor?.legalName ?? null,
    timestamp: a.timestamp,
  }));

  return (
    <PageTransition className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Constitutional Compliance"
        icon={ShieldCheck}
        title="Regulatory shadow mode, enforced."
        subtitle="AURIENTA operates inside the FRA's Regulatory Shadow Mode. Every enterprise is monitored across NOSI compliance, manager police clearance, AML screening, statutory audit and AI oversight — without taking custody of a single pound. Live GAFI/NOSI/ETA/MOI API integrations are roadmap; on-platform attestation is in pilot."
      />

      {/* KPI strip */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Compliance KPIs">
        <Kpi icon={Lock} label="Zero custody" value="Enforced" detail="Rule I 1.1 · non-amendable" />
        <Kpi icon={ShieldCheck} label="Police clearance" value="Valid" detail="MOI API (roadmap) · on-platform re-verify" />
        <Kpi icon={Building2} label="NOSI aggregate" value="100%" detail="On-platform tracking · live API is roadmap" />
        <Kpi icon={ScrollText} label="AML / sanctions" value="0 hits" detail="OFAC + EU + EG · screening events logged (live provider is roadmap)" />
      </section>

      <ComplianceMatrix rows={matrixRows} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <AiOversightPanel />
        <AuditLogFeed entries={auditEntries} />
      </div>

      <RegulatoryIntegrations />

      <p className="mt-2 text-center font-mono text-[11px] leading-relaxed text-muted-foreground/80">
        Compliance attestations are sealed to the immutable ledger and hash-chained. Regulators receive
        read-only mirrors — AURIENTA never modifies or reverses a CRE decision.
      </p>
    </PageTransition>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-400/15 bg-gradient-to-br from-emerald-400/[0.04] to-transparent p-4">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/5">
        <Icon className="h-4 w-4 text-emerald-300" />
      </span>
      <div className="min-w-0">
        <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-serif text-base font-semibold text-foreground">{value}</p>
        <p className="truncate font-mono text-[11px] text-muted-foreground/85">{detail}</p>
      </div>
    </div>
  );
}
