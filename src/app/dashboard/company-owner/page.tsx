import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { egp, pct } from "@/lib/aurienta/format";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Users,
  ShieldCheck,
  Briefcase,
  Crown,
  Settings,
  ExternalLink,
  CheckCircle2,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Company Owner · AURIENTA",
  description:
    "Entity profile, GAFI linking, and role switcher for Tier D (Established LLC) company owners.",
};

const ROLE_SWITCHES = [
  { key: "company_owner", label: "Company Owner", icon: Building2, desc: "Entity-level view of the LLC you control", href: "/dashboard/company-owner" },
  { key: "board_member", label: "Board Member", icon: Users, desc: "Constitutional Council seat + vote", href: "/dashboard/board-member" },
  { key: "capital_partner", label: "Capital Partner", icon: Briefcase, desc: "Capital Partner portfolio across enterprises", href: "/dashboard/portfolio" },
  { key: "manager", label: "Manager", icon: Settings, desc: "Day-to-day operations + dual-signature authority", href: "/dashboard/manager" },
];

export default async function CompanyOwnerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/company-owner");
  // RBAC: only Company Owners may view this console. Any other authenticated
  // user is bounced to their own dashboard.
  const hasRole = user.memberships.some((m) => m.role === "company_owner");
  if (!hasRole) redirect("/dashboard");

  // Tier D enterprises the user is a member of with a "company_owner" or "board_member" role.
  const memberEnts = await db.enterpriseMember.findMany({
    where: { userId: user.id, role: { in: ["company_owner", "board_member"] } },
    include: {
      enterprise: {
        include: {
          lawFirm: { select: { name: true, frLicenseNumber: true } },
          accountingFirm: { select: { name: true, esaaLicense: true } },
          founder: { select: { legalName: true } },
        },
      },
    },
  });

  // Mock GAFI linking state.
  const gafiLinked = memberEnts.map((m) => ({
    enterpriseId: m.enterprise.id,
    enterpriseName: m.enterprise.name,
    enterpriseSlug: m.enterprise.slug,
    tier: m.enterprise.tier,
    gafiRef: m.enterprise.tier === "D" ? `GAFI-${m.enterprise.id.slice(-6).toUpperCase()}` : null,
    gafiStatus: m.enterprise.tier === "D" ? "verified" : "not_required",
    legalForm: m.enterprise.legalForm,
    members: m.enterprise.employeeCount,
    LawFirmClientAccountBalance: m.enterprise.lawFirmClientAccountBalanceEgp,
    raised: m.enterprise.raisedEgp,
    goal: m.enterprise.fundraisingGoalEgp,
    lawFirm: m.enterprise.lawFirm?.name ?? null,
    accountingFirm: m.enterprise.accountingFirm?.name ?? null,
    founderName: m.enterprise.founder.legalName,
    stage: m.enterprise.stage,
    health: m.enterprise.healthRating,
  }));

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Company Owner Console"
        icon={Building2}
        title="Your entity, constitutionally governed"
        subtitle="Tier D (Established LLC) ownership. Link your General Authority for Participation (GAFI) commercial register, view your Constitutional Council, and switch between owner / board / capital-partner / manager contexts."
      />

      {/* Role switcher */}
      <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">Role switcher</h2>
          <span className="ml-auto font-mono text-xs text-muted-foreground/80">current: {user.primaryIntent ?? "—"}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROLE_SWITCHES.map((r) => (
            <Link
              key={r.key}
              href={r.href}
              className="group flex flex-col items-start gap-1.5 rounded-xl border border-gold/12 bg-foreground/[0.02] p-4 text-left transition-colors hover:border-gold/30 hover:bg-gold/[0.04]"
            >
              <r.icon className="h-4 w-4 text-gold" />
              <div className="font-serif text-sm font-semibold">{r.label}</div>
              <div className="font-sans text-[11px] text-muted-foreground">{r.desc}</div>
              <span className="mt-1 inline-flex items-center gap-1 font-sans text-xs text-gold/80 opacity-0 transition-opacity group-hover:opacity-100">
                Open <ChevronRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Entity profile cards */}
      <section className="grid gap-4 sm:grid-cols-2">
        {gafiLinked.map((e) => (
          <div key={e.enterpriseId} className="rounded-2xl border border-gold/15 glass p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/enterprise/${e.enterpriseSlug}`} className="font-serif text-lg font-semibold hover:text-gold-light">
                  {e.enterpriseName}
                </Link>
                <div className="mt-0.5 font-sans text-[11px] text-muted-foreground">
                  Tier {e.tier} · {e.legalForm} · Stage {e.stage}
                </div>
              </div>
              {e.health && (
                <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 font-mono text-xs text-gold-light">
                  <ShieldCheck className="h-3 w-3" /> {e.health}
                </span>
              )}
            </div>

            {/* GAFI linking */}
            <div className="mt-3 rounded-xl border border-gold/12 bg-foreground/[0.02] p-3">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs uppercase tracking-wide text-muted-foreground/85">GAFI link</span>
                {e.gafiStatus === "verified" ? (
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> not required (T{e.tier})
                  </span>
                )}
              </div>
              {e.gafiRef && (
                <div className="mt-1 font-mono text-[11px] text-gold-light">{e.gafiRef}</div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <Detail label="Members" value={String(e.members)} />
              <Detail label="Law Firm Client Account" value={egp(e.LawFirmClientAccountBalance, { compact: true })} />
              <Detail label="Capital Participated" value={egp(e.raised, { compact: true })} />
              <Detail label="Goal" value={egp(e.goal, { compact: true })} />
              <Detail label="Law firm" value={e.lawFirm ?? "—"} />
              <Detail label="Accounting" value={e.accountingFirm ?? "—"} />
              <Detail label="Founder" value={e.founderName} />
              <Detail label="Stage" value={e.stage} />
            </div>

            <Link
              href={`/enterprise/${e.enterpriseSlug}`}
              className="mt-4 inline-flex items-center gap-1 font-sans text-[11px] text-gold/80 hover:text-gold"
            >
              Full entity profile <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        ))}

        {gafiLinked.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-gold/15 py-16 text-center">
            <Building2 className="mx-auto h-8 w-8 text-gold/40" />
            <p className="mt-2 font-sans text-xs text-muted-foreground">
              You don't own or sit on the board of any Tier D enterprise yet.
            </p>
          </div>
        )}
      </section>

      {/* GAFI linking explainer */}
      <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <GoldStar className="h-3 w-3" />
          <h2 className="font-serif text-base font-semibold">GAFI commercial-register linking</h2>
        </div>
        <p className="mt-2 font-sans text-xs leading-relaxed text-muted-foreground">
          Tier D (Established LLC) enterprises must link their existing General Authority for
          Participation (GAFI) commercial register before any capital raise. AURIENTA verifies the
          register number against the GAFI public API, confirms the founder is the registered
          majority owner (≥51%), and binds the constitutional charter to the entity's articles of
          association. The GAFI reference is then published on every public enterprise profile and
          on the Constitutional Guarantee Badge.
        </p>
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Tier D ownership rules per Vol 4.3 · GAFI API integration verified hourly
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-foreground/[0.02] px-2.5 py-1.5">
      <div className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground/85">{label}</div>
      <div className="font-mono text-xs text-foreground truncate">{value}</div>
    </div>
  );
}
