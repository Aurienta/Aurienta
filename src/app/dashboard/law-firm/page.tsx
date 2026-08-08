import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { egp, timeAgo } from "@/lib/aurienta/format";
import Link from "next/link";
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Building2,
  Award,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Law Firm Console · AURIENTA",
  description:
    "Pending duties, law firm client account management, and Verified Law Firm badge for licensed Egyptian law firms holding escrow.",
};

export default async function LawFirmPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/law-firm");
  // RBAC: only licensed Egyptian law-firm representatives (law_firm_rep) may
  // view the escrow / dual-sig console. Any other authenticated user is
  // bounced to their own dashboard — no fallback to "any of the user's
  // enterprises" (that pattern previously leaked privileged escrow data).
  const hasRole = user.memberships.some((m) => m.role === "law_firm_rep");
  if (!hasRole) redirect("/dashboard");

  // Find enterprises where this user is a law_firm_rep (via membership role).
  const memberEnts = await db.enterpriseMember.findMany({
    where: { userId: user.id, role: "law_firm_rep" },
    include: {
      enterprise: {
        include: {
          lawFirm: true,
          expenses: {
            where: { status: "pending_approval" },
            orderBy: { createdAt: "desc" },
            take: 8,
            select: { id: true, amountEgp: true, description: true, category: true, createdAt: true },
          },
          milestones: {
            where: { status: "pending_release" },
            orderBy: { createdAt: "desc" },
            take: 6,
            select: { id: true, title: true, dueAt: true, status: true },
          },
        },
      },
    },
  });

  const enterprises = memberEnts.map((m) => m.enterprise);

  const totalEscrow = enterprises.reduce((s, e) => s + e.lawFirmClientAccountBalanceEgp, 0);
  const pendingExpenses = enterprises.flatMap((e) => e.expenses.map((x) => ({ ...x, enterpriseName: e.name })));
  const pendingMilestones = enterprises.flatMap((e) => e.milestones.map((m) => ({ ...m, enterpriseName: e.name })));

  // Pull a representative law firm for the badge.
  const firm = enterprises.find((e) => e.lawFirm)?.lawFirm;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Law Firm Console"
        icon={Scale}
        title="Constitutional law firm client account, under your license"
        subtitle="Pending duties, law firm client account management, and your Verified Law Firm badge. Every Egyptian law firm holding AURIENTA law firm client accounts must hold a valid FRA law firm client account license, carry 100M+ EGP professional insurance, and pass quarterly variance audits."
      />

      {/* Verified Law Firm badge */}
      {firm && (
        <section className="overflow-hidden rounded-3xl border border-gold/30 glass-gold p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-5">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10">
              <Award className="h-7 w-7 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-sans text-[11px] uppercase tracking-[0.24em] text-gold-light/85">Verified Law Firm</div>
              <h2 className="mt-1 font-serif text-2xl font-semibold">{firm.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
                <span>FRA Lic. {firm.frLicenseNumber}</span>
                <span>·</span>
                <span className="text-gold-light">Insured {egp(firm.insuranceEgp, { compact: true })}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> {firm.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Badge label="FRA-licensed" ok />
              <Badge label="Insured ≥100M" ok />
              <Badge label="Q2 variance audit" ok />
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Held by law firm" value={egp(totalEscrow, { compact: true })} icon={ShieldCheck} />
        <KPI label="Pending expense approvals" value={String(pendingExpenses.length)} icon={Clock} />
        <KPI label="Pending milestone releases" value={String(pendingMilestones.length)} icon={FileText} />
        <KPI label="Enterprises served" value={String(enterprises.length)} icon={Building2} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending expenses */}
        <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
          <div className="border-b border-gold/12 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-gold" />
              <h2 className="font-serif text-base font-semibold">Pending dual-sig approvals</h2>
              <span className="ml-auto font-mono text-xs text-muted-foreground/80">{pendingExpenses.length}</span>
            </div>
          </div>
          <ul className="divide-y divide-gold/8">
            {pendingExpenses.length === 0 ? (
              <li className="px-5 py-12 text-center font-sans text-xs text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-300/60" />
                No expenses awaiting your signature.
              </li>
            ) : (
              pendingExpenses.map((x) => (
                <li key={x.id} className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gold-light">{x.category}</span>
                    <span className="font-sans text-xs text-muted-foreground/80">· {x.enterpriseName}</span>
                    <span className="ml-auto font-mono text-xs text-gold-light">{egp(x.amountEgp)}</span>
                  </div>
                  <p className="mt-1 font-sans text-xs text-foreground/90 line-clamp-2">{x.description}</p>
                  <div className="mt-1 font-sans text-xs text-muted-foreground/80">
                    filed {timeAgo(x.createdAt)}
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Pending milestone releases */}
        <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
          <div className="border-b border-gold/12 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-gold" />
              <h2 className="font-serif text-base font-semibold">Pending milestone evidence</h2>
              <span className="ml-auto font-mono text-xs text-muted-foreground/80">{pendingMilestones.length}</span>
            </div>
          </div>
          <ul className="divide-y divide-gold/8">
            {pendingMilestones.length === 0 ? (
              <li className="px-5 py-12 text-center font-sans text-xs text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-300/60" />
                No milestones awaiting evidence review.
              </li>
            ) : (
              pendingMilestones.map((m) => (
                <li key={m.id} className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm font-medium">{m.title}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground/85">
                      target {m.dueAt ? new Date(m.dueAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div className="mt-1 font-sans text-xs text-muted-foreground/85">· {m.enterpriseName}</div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {/* Per-enterprise law firm client account management */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <GoldStar className="h-3 w-3" />
            <h2 className="font-serif text-base font-semibold">Law Firm Client Account accounts under your custody</h2>
          </div>
        </div>
        <ul className="divide-y divide-gold/8">
          {enterprises.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <Link href={`/enterprise/${e.slug}`} className="font-serif text-sm font-semibold hover:text-gold-light">
                {e.name}
              </Link>
              <span className="font-mono text-xs text-muted-foreground">Tier {e.tier} · {e.legalForm}</span>
              <span className="ml-auto font-mono text-xs text-gold-light">{egp(e.lawFirmClientAccountBalanceEgp, { compact: true })}</span>
              <Link href={`/dashboard/escrow`} className="inline-flex items-center gap-1 rounded-full border border-gold/20 px-3 py-1 font-sans text-xs text-muted-foreground hover:text-foreground">
                Manage <AlertTriangle className="h-3 w-3" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Law-firm duties per Vol 6.4 · FRA law firm client account license + 100M EGP insurance required · quarterly variance audit
        </p>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border border-gold/15 glass p-4">
      <Icon className="h-4 w-4 text-gold" />
      <div className="mt-2 font-serif text-xl font-semibold">{value}</div>
      <div className="font-sans text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function Badge({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide ${
      ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-gold/20 text-muted-foreground"
    }`}>
      {ok && <CheckCircle2 className="h-3 w-3" />} {label}
    </span>
  );
}
