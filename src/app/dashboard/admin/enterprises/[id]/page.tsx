import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { egp, pct, timeAgo, shortHash } from "@/lib/aurienta/format";
import { TIER_META, STAGE_META, ROLE_META } from "@/lib/aurienta/constants";
import {
  Building2,
  Lock,
  ShieldCheck,
  Users,
  Coins,
  TrendingUp,
  TrendingDown,
  HeartPulse,
  Landmark,
  Calculator,
  User,
  FileText,
  Milestone as MilestoneIcon,
  Activity,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
  Banknote,
} from "lucide-react";
import { EnterpriseFreezeButton } from "../enterprise-freeze-button";
import { RecomputeReadinessButton } from "../recompute-readiness-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Enterprise Detail · AURIENTA Admin",
  description: "AURIENTA Rep — full enterprise detail, governance, financials, members, ledger, freeze / unfreeze.",
};

type Params = { params: Promise<{ id: string }> };

function statusBadge(status: string) {
  const cls: Record<string, string> = {
    draft: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
    fundraising_active: "border-gold/30 bg-gold/10 text-gold-light",
    fundraising_closed: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    frozen: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    graduation_pending: "border-violet-400/30 bg-violet-400/10 text-violet-300",
    graduated: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${cls[status] ?? cls.draft}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default async function AdminEnterpriseDetailPage({ params }: Params) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const hasRole = user.memberships.some((m) => m.role === "aurienta_rep");
  if (!hasRole) redirect("/dashboard");

  const { id } = await params;

  const enterprise = await db.enterprise.findUnique({
    where: { id },
    include: {
      founder: {
        select: {
          id: true,
          legalName: true,
          email: true,
          mobile: true,
          verificationLevel: true,
          sovereignTrustScore: true,
        },
      },
      lawFirm: { select: { id: true, name: true, frLicenseNumber: true, insuranceEgp: true, expertiseScore: true, status: true } },
      accountingFirm: { select: { id: true, name: true, esaaLicense: true, status: true } },
      members: {
        orderBy: { joinedAt: "asc" },
        include: {
          user: { select: { id: true, legalName: true, email: true, sovereignTrustScore: true, verificationLevel: true } },
        },
      },
      ledgerEvents: {
        orderBy: { timestamp: "desc" },
        take: 20,
        select: {
          id: true,
          eventType: true,
          payloadHash: true,
          actorId: true,
          sequence: true,
          timestamp: true,
        },
      },
      proposals: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          votesFor: true,
          votesAgainst: true,
          passThreshold: true,
          votingEndsAt: true,
          createdAt: true,
        },
      },
      milestones: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          amountEgp: true,
          eveConfidence: true,
          dueAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!enterprise) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader
          eyebrow="Enterprise Management Console"
          icon={Building2}
          title="Enterprise not found"
          subtitle="The requested enterprise record does not exist or has been archived."
        />
        <Link
          href="/dashboard/admin/enterprises"
          className="inline-flex items-center gap-1.5 font-sans text-sm text-gold-light hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to enterprise list
        </Link>
      </div>
    );
  }

  const goalPct = enterprise.fundraisingGoalEgp > 0
    ? Math.min(100, (enterprise.raisedEgp / enterprise.fundraisingGoalEgp) * 100)
    : 0;
  const runway = enterprise.monthlyBurnEgp > 0
    ? enterprise.lawFirmClientAccountBalanceEgp / enterprise.monthlyBurnEgp
    : 0;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Enterprise Management Console"
        icon={Building2}
        title={enterprise.name}
        subtitle={`${TIER_META[enterprise.tier]?.name ?? enterprise.tier} · ${STAGE_META[enterprise.stage]?.name ?? enterprise.stage} · /${enterprise.slug}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {statusBadge(enterprise.status)}
          {enterprise.frozenAt && (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-0.5 font-mono text-[10px] uppercase text-rose-300">
              <Lock className="h-2.5 w-2.5" /> frozen {timeAgo(enterprise.frozenAt)}
            </span>
          )}
          <Link
            href="/dashboard/admin/enterprises"
            className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-gold/15 bg-foreground/[0.02] px-2 py-1 font-sans text-[11px] text-foreground transition-colors hover:border-gold/30 hover:bg-gold/8"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to list
          </Link>
        </div>
      </PageHeader>

      {/* Freeze / Unfreeze action bar */}
      <section className="rounded-2xl border border-gold/15 glass-gold p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <div className="flex flex-col">
              <span className="font-serif text-sm font-semibold">Emergency freeze controls</span>
              <span className="font-sans text-[11px] text-muted-foreground/80">
                Freezing blocks ALL money-moving actions infrastructure-wide — the CRE's <code>enforceNotFrozen</code> policy already enforces this everywhere.
              </span>
            </div>
          </div>
          <EnterpriseFreezeButton
            enterprise={{ id: enterprise.id, name: enterprise.name, slug: enterprise.slug, status: enterprise.status }}
            variant="detail"
          />
        </div>
      </section>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KPI label="Health" value={`${enterprise.healthRating ?? "—"} · ${enterprise.healthScore}`} icon={HeartPulse} ok={enterprise.healthScore >= 70} />
        <KPI label="Capital Participated" value={egp(enterprise.raisedEgp, { compact: true })} icon={Coins} />
        <KPI label="Law Firm Client Account" value={egp(enterprise.lawFirmClientAccountBalanceEgp, { compact: true })} icon={Banknote} />
        <KPI label="Runway" value={`${runway.toFixed(1)} mo`} icon={TrendingUp} ok={runway >= 12} />
        <KPI label="Employees" value={String(enterprise.employeeCount)} icon={Users} />
        <KPI label="NOSI" value={pct(enterprise.nosiCompliantPct, 0)} icon={CheckCircle2} ok={enterprise.nosiCompliantPct >= 100} />
      </div>

      {/* Capital Formation progress */}
      <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-base font-semibold">Capital Formation</h2>
          <span className="font-mono text-xs text-muted-foreground/80">
            {pct(goalPct, 1)} of goal
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full bg-gradient-to-r from-gold/50 to-gold"
            style={{ width: `${goalPct}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Row k="Capital Participated" v={egp(enterprise.raisedEgp)} />
          <Row k="Goal" v={egp(enterprise.fundraisingGoalEgp)} />
          <Row k="Share price" v={egp(enterprise.equityUnitPriceEgp)} />
          <Row k="Total shares" v={enterprise.totalEquityUnits.toLocaleString()} />
          <Row k="Founder equity" v={pct(enterprise.founderEquityPct, 1)} />
          <Row k="Min Participation" v={egp(enterprise.minParticipationEgp)} />
          <Row k="Platform fee" v={pct(enterprise.platformFeePct, 1)} />
          <Row k="Consulting fee" v={pct(enterprise.consultingFeePct, 1)} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Financials */}
        <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-base font-semibold">Financials</h2>
          </div>
          <ul className="mt-4 space-y-2 font-sans text-xs">
            <Row k="Monthly revenue" v={egp(enterprise.monthlyRevenueEgp)} />
            <Row k="Monthly burn" v={egp(enterprise.monthlyBurnEgp)} />
            <Row k="Gross margin" v={pct(enterprise.grossMarginPct, 1)} />
            <Row k="Revenue growth" v={pct(enterprise.revenueGrowthPct, 1)} ok={enterprise.revenueGrowthPct >= 20} />
            <Row k="Law Firm Client Account balance" v={egp(enterprise.lawFirmClientAccountBalanceEgp)} />
            <Row k="Runway" v={`${runway.toFixed(1)} months`} ok={runway >= 12} />
            <Row k="NOSI compliant" v={pct(enterprise.nosiCompliantPct, 0)} ok={enterprise.nosiCompliantPct >= 100} />
            <Row k="Police clearance" v={enterprise.policeClearanceValid ? "valid" : "expired"} ok={enterprise.policeClearanceValid} />
            <Row k="Consulting opt-out" v={enterprise.consultingOptOut ? "active" : "no"} />
            <Row k="Graduation readiness" v={`${enterprise.graduationReadiness}%`} ok={enterprise.graduationReadiness >= 75} />
          </ul>
        </section>

        {/* Founder */}
        <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-base font-semibold">Founder</h2>
          </div>
          {enterprise.founder ? (
            <ul className="mt-4 space-y-2 font-sans text-xs">
              <Row k="Legal name" v={enterprise.founder.legalName} />
              <Row k="Email" v={enterprise.founder.email} />
              <Row k="Mobile" v={enterprise.founder.mobile} />
              <Row k="KYC level" v={enterprise.founder.verificationLevel} />
              <Row k="Sovereign trust" v={String(enterprise.founder.sovereignTrustScore)} />
              <Row k="Founder ID" v={<span className="font-mono">{shortHash(enterprise.founder.id, 8, 4)}</span>} />
            </ul>
          ) : (
            <p className="mt-4 font-sans text-xs text-muted-foreground">No founder linked.</p>
          )}
        </section>

        {/* Service firms */}
        <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-base font-semibold">Service firms</h2>
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">
                <Landmark className="h-3 w-3" /> Law firm
              </div>
              {enterprise.lawFirm ? (
                <ul className="mt-1.5 space-y-1 font-sans text-xs">
                  <Row k="Name" v={enterprise.lawFirm.name} />
                  <Row k="License" v={enterprise.lawFirm.frLicenseNumber} />
                  <Row k="Insurance" v={egp(enterprise.lawFirm.insuranceEgp, { compact: true })} />
                  <Row k="Expertise" v={String(enterprise.lawFirm.expertiseScore)} />
                  <Row k="Status" v={enterprise.lawFirm.status} ok={enterprise.lawFirm.status === "active"} />
                </ul>
              ) : (
                <p className="mt-1.5 font-sans text-xs text-muted-foreground">Not appointed.</p>
              )}
            </div>
            <div className="border-t border-gold/8 pt-3">
              <div className="flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">
                <Calculator className="h-3 w-3" /> Accounting firm
              </div>
              {enterprise.accountingFirm ? (
                <ul className="mt-1.5 space-y-1 font-sans text-xs">
                  <Row k="Name" v={enterprise.accountingFirm.name} />
                  <Row k="ESAA license" v={enterprise.accountingFirm.esaaLicense} />
                  <Row k="Status" v={enterprise.accountingFirm.status} ok={enterprise.accountingFirm.status === "active"} />
                </ul>
              ) : (
                <p className="mt-1.5 font-sans text-xs text-muted-foreground">Not appointed.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Graduation readiness */}
      <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">Graduation readiness</h2>
          <span className="ml-auto font-mono text-xs text-muted-foreground/80">
            stored: {enterprise.graduationReadiness}%
          </span>
        </div>
        <p className="mt-1 font-sans text-xs text-muted-foreground/80">
          The 9 constitutional gates an enterprise must clear before it graduates to sovereign independence. Recompute runs the live CRE function against the latest quarterly reports, runway, and proposal history.
        </p>
        <div className="mt-4">
          <RecomputeReadinessButton enterpriseId={enterprise.id} />
        </div>
      </section>

      {/* Members */}
      <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">Members</h2>
          <span className="ml-auto font-mono text-xs text-muted-foreground/80">
            {enterprise.members.length} total
          </span>
        </div>
        <div className="mt-3 max-h-96 overflow-y-auto pr-1">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-background/95 backdrop-blur">
              <tr className="border-b border-gold/12">
                <th className="px-3 py-2 font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">User</th>
                <th className="px-3 py-2 font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">Role</th>
                <th className="px-3 py-2 font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">KYC</th>
                <th className="px-3 py-2 text-right font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">STS</th>
                <th className="px-3 py-2 text-right font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">Board</th>
                <th className="px-3 py-2 text-right font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">Joined</th>
              </tr>
            </thead>
            <tbody>
              {enterprise.members.map((m) => (
                <tr key={m.id} className="border-b border-gold/8 hover:bg-gold/[0.04]">
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="font-sans text-xs text-foreground">{m.user.legalName}</span>
                      <span className="font-mono text-[10px] text-muted-foreground/70">{m.user.email}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 rounded-md border border-gold/15 bg-gold/8 px-2 py-0.5 font-sans text-[11px] text-gold-light">
                      {ROLE_META[m.role]?.badge} {ROLE_META[m.role]?.label ?? m.role}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{m.user.verificationLevel}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{m.user.sovereignTrustScore}</td>
                  <td className="px-3 py-2 text-right">
                    {m.boardSeat ? (
                      <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="ml-auto h-3.5 w-3.5 text-muted-foreground/40" />
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-sans text-[11px] text-muted-foreground/80">
                    {timeAgo(m.joinedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent proposals */}
        <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-base font-semibold">Recent proposals</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">last 5</span>
          </div>
          <ul className="mt-3 divide-y divide-gold/8">
            {enterprise.proposals.length === 0 ? (
              <li className="py-4 text-center font-sans text-xs text-muted-foreground">No proposals yet.</li>
            ) : (
              enterprise.proposals.map((p) => (
                <li key={p.id} className="flex flex-col gap-1 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-sm text-foreground">{p.title}</span>
                    <span className={`inline-flex rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase ${
                      p.status === "executed" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" :
                      p.status === "rejected" || p.status === "expired" ? "border-rose-400/30 bg-rose-400/10 text-rose-300" :
                      "border-gold/30 bg-gold/10 text-gold-light"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground/80">
                    <span>{p.type.replace(/_/g, " ")}</span>
                    <span>✓ {p.votesFor} / ✗ {p.votesAgainst}</span>
                    <span>threshold {p.passThreshold}%</span>
                    <span>{timeAgo(p.createdAt)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Recent milestones */}
        <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <MilestoneIcon className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-base font-semibold">Recent milestones</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">last 5</span>
          </div>
          <ul className="mt-3 divide-y divide-gold/8">
            {enterprise.milestones.length === 0 ? (
              <li className="py-4 text-center font-sans text-xs text-muted-foreground">No milestones yet.</li>
            ) : (
              enterprise.milestones.map((m) => (
                <li key={m.id} className="flex flex-col gap-1 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-sm text-foreground">{m.title}</span>
                    <span className={`inline-flex rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase ${
                      m.status === "released" || m.status === "approved" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" :
                      m.status === "rejected" ? "border-rose-400/30 bg-rose-400/10 text-rose-300" :
                      "border-gold/30 bg-gold/10 text-gold-light"
                    }`}>
                      {m.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground/80">
                    <span>{egp(m.amountEgp, { compact: true })}</span>
                    <span>EVE {(m.eveConfidence * 100).toFixed(0)}%</span>
                    {m.dueAt && <span>due {timeAgo(m.dueAt)}</span>}
                    <span>{timeAgo(m.createdAt)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {/* Recent ledger events */}
      <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">Recent ledger events</h2>
          <span className="ml-auto font-mono text-xs text-muted-foreground/80">
            hash-chained · SHA3-256 · last 20
          </span>
        </div>
        <div className="mt-3 max-h-96 overflow-y-auto pr-1">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-background/95 backdrop-blur">
              <tr className="border-b border-gold/12">
                <th className="px-3 py-2 font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">Seq</th>
                <th className="px-3 py-2 font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">Event</th>
                <th className="px-3 py-2 font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">Hash</th>
                <th className="px-3 py-2 text-right font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">When</th>
              </tr>
            </thead>
            <tbody>
              {enterprise.ledgerEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center font-sans text-xs text-muted-foreground">
                    No ledger events recorded.
                  </td>
                </tr>
              ) : (
                enterprise.ledgerEvents.map((ev) => (
                  <tr key={ev.id} className="border-b border-gold/8 hover:bg-gold/[0.04]">
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground/80">
                      #{ev.sequence}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs text-gold-light">{ev.eventType}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground/80">
                      {shortHash(ev.payloadHash, 14, 6)}
                    </td>
                    <td className="px-3 py-2 text-right font-sans text-[11px] text-muted-foreground/80">
                      {timeAgo(ev.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AlertTriangle className="h-3 w-3 text-gold/70" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Every freeze / unfreeze wraps the status change + a <code>cre_decision</code> ledger event in <code>db.$transaction</code> and writes an <code>admin.enterprise.freeze|unfreeze</code> audit entry.
        </p>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, ok }: { label: string; value: string; icon: React.ElementType; ok?: boolean }) {
  return (
    <div className="rounded-2xl border border-gold/15 glass p-4">
      <div className="flex items-center justify-between">
        <Icon className={`h-4 w-4 ${ok === false ? "text-rose-400" : "text-gold"}`} />
        {ok !== undefined && (
          ok ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <AlertTriangle className="h-3 w-3 text-rose-400" />
        )}
      </div>
      <div className="mt-2 font-serif text-xl font-semibold">{value}</div>
      <div className="font-sans text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ k, v, ok }: { k: string; v: React.ReactNode; ok?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-gold/8 pb-1.5 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className={`text-right font-mono text-[11px] ${ok === undefined ? "text-foreground" : ok ? "text-emerald-300" : "text-rose-300"}`}>
        {v}
      </span>
    </li>
  );
}
