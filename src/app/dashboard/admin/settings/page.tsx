import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { AurientaMark } from "@/components/aurienta-logo";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { SettingsConsole, type GroupedSettings } from "./settings-console";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Platform Settings · AURIENTA",
  description:
    "AURIENTA Steward console — fee configuration, tier caps, timing rules, and feature flags. Every change is audit-logged and stamped with the constitutional anchor.",
};

// Default values mirrored from /api/admin/settings/route.ts so the page renders
// correctly even before the API seeds the DB. The settings API upserts these on
// first GET, but the server component fetches them directly via Prisma.
const SEED_DEFAULTS: { key: string; value: string; category: string }[] = [
  { key: "fee.platformPct",         value: "5",     category: "fee" },
  { key: "fee.consultingPct",       value: "2.5",   category: "fee" },
  { key: "fee.antifragilityPct",    value: "1",     category: "fee" },
  { key: "tier.A.maxRaise",         value: "3000000",  category: "tier" },
  { key: "tier.A.minInvest",        value: "50",       category: "tier" },
  { key: "tier.B.maxRaise",         value: "25000000", category: "tier" },
  { key: "tier.B.minInvest",        value: "50",       category: "tier" },
  { key: "tier.C.maxRaise",         value: "0",        category: "tier" },
  { key: "tier.C.minInvest",        value: "50",       category: "tier" },
  { key: "tier.D.maxRaise",         value: "0",        category: "tier" },
  { key: "tier.D.minInvest",        value: "50000",    category: "tier" },
  { key: "tier.E.maxRaise",         value: "5000000",  category: "tier" },
  { key: "tier.E.minInvest",        value: "50",       category: "tier" },
  { key: "tier.F.maxRaise",         value: "0",        category: "tier" },
  { key: "tier.F.minInvest",        value: "1",        category: "tier" },
  { key: "timing.coolingBudgetHours",          value: "48",  category: "timing" },
  { key: "timing.coolingManagerAppointmentH",  value: "24",  category: "timing" },
  { key: "timing.coolingManagerRemovalH",      value: "48",  category: "timing" },
  { key: "timing.coolingDividendDays",         value: "7",   category: "timing" },
  { key: "timing.coolingConstitutionalDays",   value: "90",  category: "timing" },
  { key: "timing.coolingGraduationDays",       value: "30",  category: "timing" },
  { key: "timing.votingBudgetHours",           value: "48",  category: "timing" },
  { key: "timing.votingManagerRemovalHours",   value: "72",  category: "timing" },
  { key: "timing.votingDividendHours",         value: "24",  category: "timing" },
  { key: "timing.votingConstitutionalDays",    value: "14",  category: "timing" },
  { key: "timing.votingGraduationDays",        value: "14",  category: "timing" },
  { key: "timing.sessionExpiryHours",          value: "168", category: "timing" },
  { key: "feature.aiEnabled",         value: "true",  category: "feature_flag" },
  { key: "feature.diasporaEnabled",   value: "true",  category: "feature_flag" },
  { key: "feature.graduationEnabled", value: "true",  category: "feature_flag" },
  { key: "feature.syndicatesEnabled", value: "true",  category: "feature_flag" },
  { key: "feature.oracleMirrorArmed", value: "true",  category: "feature_flag" },
];

function parseValue(raw: string): number | boolean | string {
  try {
    const v = JSON.parse(raw);
    if (typeof v === "number" || typeof v === "boolean" || typeof v === "string") return v;
    return raw;
  } catch {
    return raw;
  }
}

export default async function PlatformSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/admin/settings");
  // RBAC: only AURIENTA Stewards (aurienta_rep) may tune platform settings.
  const hasRole = user.memberships.some((m) => m.role === "aurienta_rep");
  if (!hasRole) redirect("/dashboard");

  // Fetch all settings directly via Prisma. The settings API upserts defaults
  // on first read, but we mirror the seeds here so a fresh DB still renders.
  const rows = await db.platformSetting.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }],
    include: { updatedBy: { select: { legalName: true, email: true } } },
  });

  // Merge with seed defaults — DB rows win when present.
  const merged: Record<string, { key: string; value: string; category: string; updatedAt: Date; updatedBy?: string }> = {};
  for (const seed of SEED_DEFAULTS) {
    merged[seed.key] = { ...seed, updatedAt: new Date(0) };
  }
  for (const r of rows) {
    merged[r.key] = {
      key: r.key,
      value: r.value,
      category: r.category,
      updatedAt: r.updatedAt,
      updatedBy: r.updatedBy?.legalName,
    };
  }

  const grouped: GroupedSettings = {};
  for (const r of Object.values(merged)) {
    const cat = grouped[r.category] ?? (grouped[r.category] = []);
    cat.push({
      key: r.key,
      value: parseValue(r.value),
      updatedAt: r.updatedAt.toISOString(),
      updatedBy: r.updatedBy,
    });
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Platform Settings Console"
        icon={ShieldCheck}
        title="Tune the constitutional operating system"
        subtitle="Fees, tier caps, timing rules, and feature flags — every knob the Steward can turn without a code deploy. Each change is audit-logged, stamped with the constitutional anchor, and applied network-wide on the next CRE decision."
      />

      {/* Audit-log banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/[0.06] p-4 sm:p-5">
        <div className="mt-0.5">
          <ShieldCheck className="h-5 w-5 text-gold" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-base font-semibold text-gold-light">Every change is audit-logged</span>
          </div>
          <p className="mt-1 max-w-3xl font-sans text-xs leading-relaxed text-muted-foreground">
            Steward edits to platform settings are recorded as <span className="font-mono text-gold-light/90">admin.settings.update</span> entries
            in the AuditLog, capturing the previous value, the new value, and the Steward who made the change. Changes
            do <strong className="text-foreground">not</strong> rewrite history — they create new audit rows. The constitutional
            anchor itself cannot be edited from this console.
          </p>
        </div>
      </div>

      <SettingsConsole initial={grouped} />

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Constitutional anchor is read-only · all knob edits are reversible · escalation requires two-Steward quorum
        </p>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-center">
        <AlertCircle className="h-3 w-3 text-gold/60" />
        <p className="font-sans text-[11px] text-muted-foreground/70">
          Tip: changes apply network-wide on the next CRE decision. There is no per-enterprise override.
        </p>
      </div>
    </div>
  );
}
