import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { egp, timeAgo } from "@/lib/aurienta/format";
import Link from "next/link";
import {
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Award,
  PenLine,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accounting Firm Console · AURIENTA",
  description:
    "Dual-signature queue, statutory deadlines, ESAA license verification, and fee caps for Egyptian accounting firms.",
};

const FEE_CAPS = [
  { tier: "A", cap: "5,000 EGP / quarter", desc: "Compilation review" },
  { tier: "B", cap: "15,000 EGP / quarter", desc: "Limited review" },
  { tier: "C", cap: "35,000 EGP / quarter", desc: "Statutory audit" },
  { tier: "D", cap: "75,000 EGP / quarter", desc: "Statutory audit + consolidated" },
  { tier: "E", cap: "8,000 EGP / year", desc: "Grant accounting" },
  { tier: "F", cap: "250,000 EGP / quarter", desc: "FRA statutory + EGX-aligned" },
];

export default async function AccountingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/accounting");
  // RBAC: only ESAA-licensed accounting-firm representatives may view the
  // dual-sig / statutory-deadline console. Any other authenticated user is
  // bounced to their own dashboard — no fallback to "any of the user's
  // enterprises" (that pattern previously leaked privileged fee + escrow data).
  const hasRole = user.memberships.some((m) => m.role === "accounting_firm_rep");
  if (!hasRole) redirect("/dashboard");

  const memberEnts = await db.enterpriseMember.findMany({
    where: { userId: user.id, role: "accounting_firm_rep" },
    include: {
      enterprise: {
        include: {
          accountingFirm: true,
          expenses: {
            where: { status: "pending_approval" },
            orderBy: { createdAt: "desc" },
            take: 8,
            select: { id: true, amountEgp: true, description: true, category: true, createdAt: true, submittedById: true },
          },
        },
      },
    },
  });

  const enterprises = memberEnts.map((m) => m.enterprise);

  const firm = enterprises.find((e) => e.accountingFirm)?.accountingFirm;
  const pendingExpenses = enterprises.flatMap((e) => e.expenses.map((x) => ({ ...x, enterpriseName: e.name, enterpriseTier: e.tier, enterpriseId: e.id })));

  // Mock statutory deadlines.
  const deadlines = [
    { id: "Q2-2026-VAT", enterprise: enterprises[0]?.name ?? "—", type: "VAT Q2 2026 return", due: "2026-07-15", status: "upcoming", daysLeft: 23 },
    { id: "Q2-2026-PAYROLL", enterprise: enterprises[0]?.name ?? "—", type: "Payroll tax Q2 2026", due: "2026-07-31", status: "upcoming", daysLeft: 39 },
    { id: "2025-STAT-AUDIT", enterprise: enterprises[1]?.name ?? "—", type: "2025 statutory audit", due: "2026-04-30", status: "filed", daysLeft: 0 },
    { id: "Q1-2026-CTA", enterprise: enterprises[1]?.name ?? "—", type: "Corporate tax advance Q1", due: "2026-04-30", status: "filed", daysLeft: 0 },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Accounting Firm Console"
        icon={Calculator}
        title="Dual-signature authority, statutory cadence, fee caps"
        subtitle="Accounting firms hold the second signature on every 1–10% expense, file statutory returns on the enterprise's behalf, and operate under Egyptian Society of Accountants and Auditors (ESAA) licenses with constitutionally-capped fees."
      />

      {/* ESAA badge */}
      {firm && (
        <section className="overflow-hidden rounded-3xl border border-gold/30 glass-gold p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-5">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10">
              <Award className="h-7 w-7 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-sans text-[11px] uppercase tracking-[0.24em] text-gold-light/85">ESAA-Licensed Accounting Firm</div>
              <h2 className="mt-1 font-serif text-2xl font-semibold">{firm.name}</h2>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                ESAA License {firm.esaaLicense}
                <span className="mx-2">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> {firm.status}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Pending 2nd signatures" value={String(pendingExpenses.length)} icon={PenLine} />
        <KPI label="Enterprises served" value={String(enterprises.length)} icon={FileText} />
        <KPI label="Upcoming deadlines" value={String(deadlines.filter((d) => d.status === "upcoming").length)} icon={Clock} />
        <KPI label="Filed (last 90d)" value={String(deadlines.filter((d) => d.status === "filed").length)} icon={CheckCircle2} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dual-sig queue */}
        <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
          <div className="border-b border-gold/12 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <PenLine className="h-3.5 w-3.5 text-gold" />
              <h2 className="font-serif text-base font-semibold">Dual-signature queue</h2>
              <span className="ml-auto font-mono text-xs text-muted-foreground/80">{pendingExpenses.length}</span>
            </div>
          </div>
          <ul className="divide-y divide-gold/8">
            {pendingExpenses.length === 0 ? (
              <li className="px-5 py-12 text-center font-sans text-xs text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-300/60" />
                Nothing in the dual-sig queue.
              </li>
            ) : (
              pendingExpenses.map((x) => (
                <li key={x.id} className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gold-light">{x.category}</span>
                    <span className="font-sans text-xs text-muted-foreground/80">· {x.enterpriseName} · T{x.enterpriseTier}</span>
                    <span className="ml-auto font-mono text-xs text-gold-light">{egp(x.amountEgp)}</span>
                  </div>
                  <p className="mt-1 font-sans text-xs text-foreground/90 line-clamp-2">{x.description}</p>
                  <div className="mt-1 font-sans text-xs text-muted-foreground/80">filed {timeAgo(x.createdAt)}</div>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Statutory deadlines */}
        <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
          <div className="border-b border-gold/12 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-gold" />
              <h2 className="font-serif text-base font-semibold">Statutory deadlines</h2>
              <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground/80">
                Egyptian Tax Authority
                <span className="rounded-full border border-gold/20 bg-gold/5 px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-gold-light/80">roadmap</span>
              </span>
            </div>
            <p className="mt-1.5 font-sans text-xs leading-relaxed text-muted-foreground/80">
              Returns computed on-platform; live auto-submit via ETA is roadmap. Manual filing by the accounting firm until integration ships.
            </p>
          </div>
          <ul className="divide-y divide-gold/8">
            {deadlines.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-2 px-5 py-3">
                <div>
                  <div className="font-serif text-sm font-medium">{d.type}</div>
                  <div className="font-sans text-xs text-muted-foreground/85">· {d.enterprise} · due {new Date(d.due).toLocaleDateString()}</div>
                </div>
                <span className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${
                  d.status === "filed"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : d.daysLeft <= 14
                    ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
                    : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                }`}>
                  {d.status === "filed" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {d.status === "filed" ? "filed" : `${d.daysLeft}d left`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Fee caps table */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <GoldStar className="h-3 w-3" />
            <h2 className="font-serif text-base font-semibold">Constitutional fee caps (per quarter)</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">non-amendable Vol 6.5</span>
          </div>
        </div>
        <table className="w-full text-left font-sans text-xs">
          <thead className="border-b border-gold/12 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Tier</th>
              <th className="px-4 py-2.5 font-medium">Cap</th>
              <th className="px-4 py-2.5 font-medium">Scope</th>
            </tr>
          </thead>
          <tbody>
            {FEE_CAPS.map((c) => (
              <tr key={c.tier} className="border-b border-gold/8 hover:bg-gold/[0.03]">
                <td className="px-4 py-2.5 font-mono text-gold-light">Tier {c.tier}</td>
                <td className="px-4 py-2.5 font-mono">{c.cap}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Accounting duties per Vol 6.5 · ESAA license + statutory cadence + constitutional fee caps
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
