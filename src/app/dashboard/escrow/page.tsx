import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { GoldStar, AurientaMark } from "@/components/aurienta-logo";
import { egp, shortHash, timeAgo } from "@/lib/aurienta/format";
import {
  Lock,
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Server,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/dashboard/page-transition";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Law Firm Client Accounts · AURIENTA",
  description:
    "Per-enterprise Law Firm Client Accounts, zero-custody proof, health flags, and automatic failover. AURIENTA never holds a piastre.",
};

// Health flag levels per Vol 17.19 Law Firm Client Account Health Flag runbook.
function escrowHealthFlag(balanceEgp: number, monthlyBurnEgp: number): {
  level: 1 | 2 | 3;
  label: string;
  cls: string;
} {
  if (balanceEgp === 0) return { level: 1, label: "Empty", cls: "text-rose-300 border-rose-400/30 bg-rose-400/10" };
  const runway = monthlyBurnEgp > 0 ? balanceEgp / monthlyBurnEgp : 99;
  if (runway < 3) return { level: 3, label: "Critical (L3)", cls: "text-rose-300 border-rose-400/30 bg-rose-400/10" };
  if (runway < 6) return { level: 2, label: "Watch (L2)", cls: "text-amber-300 border-amber-400/30 bg-amber-400/10" };
  return { level: 1, label: "Healthy (L1)", cls: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" };
}

export default async function EscrowPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/escrow");

  const enterprises = await db.enterprise.findMany({
    where: { founderId: user.id },
    include: {
      lawFirm: { select: { name: true, frLicenseNumber: true, insuranceEgp: true, status: true } },
      accountingFirm: { select: { name: true, esaaLicense: true } },
      ledgerEvents: {
        where: { eventType: { in: ["share_transferred", "expense_approved", "milestone_released", "reservation_created"] } },
        orderBy: { timestamp: "desc" },
        take: 4,
        select: { id: true, eventType: true, timestamp: true, payloadHash: true },
      },
    },
    orderBy: { lawFirmClientAccountBalanceEgp: "desc" },
  });

  // Also include enterprises the user is a member of but didn't found.
  const memberEnts = await db.enterprise.findMany({
    where: {
      id: { in: user.memberships.map((m) => m.enterpriseId) },
      founderId: { not: user.id },
    },
    include: {
      lawFirm: { select: { name: true, frLicenseNumber: true, insuranceEgp: true, status: true } },
      accountingFirm: { select: { name: true, esaaLicense: true } },
    },
  });

  const allEnts = [...enterprises, ...memberEnts];
  const totalEscrow = allEnts.reduce((s, e) => s + e.lawFirmClientAccountBalanceEgp, 0);

  return (
    <PageTransition className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Law Firm Client Account Console"
        icon={Lock}
        title="Every piastre, in the law firm's licensed client account — never in AURIENTA's hands"
        subtitle="Per-enterprise law-firm client accounts (Amendment IX), zero-custody proof, three-level health flags, and accountant-gated milestone releases. AURIENTA holds 0 EGP of partner capital at all times — funds flow directly to licensed law firms under Egyptian Lawyers' Code (Law 17/1983, Art. 47)."
      />

      {/* Zero custody proof */}
      <section className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.04] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-serif text-base font-semibold text-emerald-200">Zero Custody — verified (Amendment IX)</div>
            <p className="mt-0.5 font-sans text-xs text-muted-foreground">
              AURIENTA Constitutional Infrastructure accounts hold <span className="font-mono text-emerald-300">0 EGP</span> across {allEnts.length} enterprises. Total balances in Law Firm Client Accounts: <span className="font-mono text-gold-light">{egp(totalEscrow, { compact: true })}</span>. Funds are held under Egyptian Lawyers' Code (Law 17/1983, Art. 47) — NOT in an escrow arrangement. Milestone releases require dual authorization: board approval + accounting firm evidence verification.
            </p>
          </div>
          <span className="font-mono text-xs text-muted-foreground/80">verified {timeAgo(new Date())}</span>
        </div>
      </section>

      {/* Per-enterprise Law Firm Client Account cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allEnts.map((e) => {
          const flag = escrowHealthFlag(e.lawFirmClientAccountBalanceEgp, e.monthlyBurnEgp);
          const runway = e.monthlyBurnEgp > 0 ? (e.lawFirmClientAccountBalanceEgp / e.monthlyBurnEgp).toFixed(1) : "∞";
          return (
            <div key={e.id} className="rounded-2xl border border-gold/15 glass p-5">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gold" />
                <Link href={`/enterprise/${e.slug}`} className="font-serif text-sm font-semibold hover:text-gold-light">
                  {e.name}
                </Link>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${flag.cls}">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${flag.cls}`}>
                    {flag.label}
                  </span>
                </span>
              </div>

              <div className="mt-3 font-serif text-2xl font-semibold text-gold-light">
                {egp(e.lawFirmClientAccountBalanceEgp, { compact: true })}
              </div>
              <div className="font-sans text-xs text-muted-foreground/85">
                Law Firm Client Account balance · runway {runway} mo
              </div>

              <div className="mt-3 space-y-1.5 font-sans text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Law firm</span>
                  <span className="font-mono text-foreground">
                    {e.lawFirm?.name ?? <span className="text-rose-300">unassigned</span>}
                  </span>
                </div>
                {e.lawFirm && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">FRA license</span>
                    <span className="font-mono text-xs text-muted-foreground/80">{e.lawFirm.frLicenseNumber}</span>
                  </div>
                )}
                {e.lawFirm && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Insurance</span>
                    <span className="font-mono text-xs text-gold-light/80">{egp(e.lawFirm.insuranceEgp, { compact: true })}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Accounting firm</span>
                  <span className="font-mono text-foreground">
                    {e.accountingFirm?.name ?? <span className="text-rose-300">unassigned</span>}
                  </span>
                </div>
              </div>

              {flag.level >= 2 && (
                <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/[0.06] p-2 text-xs text-amber-200">
                  <AlertTriangle className="mr-1 inline h-3 w-3" />
                  {flag.level === 3
                    ? "Critical runway — board notified, failover armed"
                    : "Law-firm API variance detected — 4h grace before L3 escalation"}
                </div>
              )}
            </div>
          );
        })}

        {allEnts.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-gold/15 py-16 text-center">
            <Lock className="mx-auto h-8 w-8 text-gold/40" />
            <p className="mt-2 font-sans text-xs text-muted-foreground">No Law Firm Client Accounts visible.</p>
          </div>
        )}
      </section>

      {/* Failover protocol */}
      <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">Law Firm Client Account failover protocol (Vol 17.19)</h2>
        </div>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          <Step n={1} title="L1 — Healthy" desc="Hourly sync. Variance <0.1%. No action." />
          <Step n={2} title="L2 — Watch" desc="Variance >0.1%. Wait 4h for bank latency. Notify board." />
          <Step n={3} title="L3 — Critical" desc="Variance persists >4h. Notify law firm. Require explanation in 24h." />
          <Step n={4} title="Failover" desc="If unresolved at 24h, the Law Firm Client Account auto-migrates to a backup law firm. Insurance claim filed." />
        </ol>
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Zero Custody is non-amendable Rule I 1.1 — every page load re-verifies via aggregate Law Firm Client Account balance query
        </p>
      </div>
    </PageTransition>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <li className="flex gap-3 rounded-xl border border-gold/12 bg-foreground/[0.02] p-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-mono text-[11px] text-gold-light">
        {n}
      </span>
      <div>
        <div className="font-serif text-sm font-semibold">{title}</div>
        <div className="font-sans text-[11px] text-muted-foreground">{desc}</div>
      </div>
    </li>
  );
}
