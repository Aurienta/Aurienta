import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { shortHash, timeAgo } from "@/lib/aurienta/format";
import {
  Landmark,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowRightLeft,
  Webhook,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reality Sync · AURIENTA",
  description:
    "Nine Egyptian banks, daily reconciliation log, and webhook health — the off-chain ↔ on-chain integrity bridge.",
};

// Mock list of 9 Egyptian banks (in production: real integration partners).
const BANKS = [
  { code: "CBE", name: "Central Bank of Egypt", type: "Central bank", lastSync: "2026-06-22T08:00:00Z", status: "healthy", latencyMs: 412 },
  { code: "NBE", name: "National Bank of Egypt", type: "Commercial", lastSync: "2026-06-22T07:59:00Z", status: "healthy", latencyMs: 380 },
  { code: "BM", name: "Banque Misr", type: "Commercial", lastSync: "2026-06-22T07:58:00Z", status: "healthy", latencyMs: 425 },
  { code: "BI", name: "Bank of Alexandria", type: "Commercial", lastSync: "2026-06-22T07:57:00Z", status: "healthy", latencyMs: 510 },
  { code: "CIB", name: "Commercial International Bank", type: "Commercial", lastSync: "2026-06-22T07:59:30Z", status: "healthy", latencyMs: 290 },
  { code: "AAIB", name: "Arab African International Bank", type: "Commercial", lastSync: "2026-06-22T07:56:00Z", status: "degraded", latencyMs: 1820 },
  { code: "EGB", name: "Egyptian Gulf Bank", type: "Commercial", lastSync: "2026-06-22T07:58:30Z", status: "healthy", latencyMs: 460 },
  { code: "EDB", name: "Egyptian Development Bank", type: "Development", lastSync: "2026-06-22T07:55:00Z", status: "healthy", latencyMs: 720 },
  { code: "CAE", name: "Crédit Agricole Egypt", type: "Commercial", lastSync: "2026-06-22T07:59:00Z", status: "healthy", latencyMs: 340 },
];

// Mock reconciliation log entries.
const RECONCILIATION_LOG = [
  { ts: "2026-06-22T08:00:00Z", bank: "CBE", matched: 1247, unmatched: 0, drift_pct: 0.0, hash: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2" },
  { ts: "2026-06-22T07:00:00Z", bank: "CBE", matched: 1198, unmatched: 0, drift_pct: 0.0, hash: "0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3" },
  { ts: "2026-06-22T06:00:00Z", bank: "CBE", matched: 1156, unmatched: 1, drift_pct: 0.086, hash: "0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4" },
  { ts: "2026-06-22T05:00:00Z", bank: "CBE", matched: 1112, unmatched: 0, drift_pct: 0.0, hash: "0xd4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5" },
];

// Mock webhook integrations.
const WEBHOOKS = [
  { name: "NOSI (Social Insurance)", url: "/webhooks/nosi", status: "healthy", lastDelivery: "2026-06-22T07:58:00Z", deliveryRate: 0.998 },
  { name: "GAFI (Commercial Register)", url: "/webhooks/gafi", status: "healthy", lastDelivery: "2026-06-22T07:30:00Z", deliveryRate: 1.0 },
  { name: "FRA (Financial Regulator)", url: "/webhooks/fra", status: "healthy", lastDelivery: "2026-06-22T08:00:00Z", deliveryRate: 1.0 },
  { name: "ETA (Egyptian Tourism Authority)", url: "/webhooks/eta", status: "degraded", lastDelivery: "2026-06-22T06:14:00Z", deliveryRate: 0.942 },
  { name: "ETA Tax Authority", url: "/webhooks/eta-tax", status: "healthy", lastDelivery: "2026-06-22T07:45:00Z", deliveryRate: 0.999 },
  { name: "Ministry of Interior (Police Clearance)", url: "/webhooks/moi", status: "healthy", lastDelivery: "2026-06-22T04:00:00Z", deliveryRate: 1.0 },
];

export default async function RealitySyncPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/reality-sync");

  const healthyBanks = BANKS.filter((b) => b.status === "healthy").length;
  const degradedBanks = BANKS.filter((b) => b.status === "degraded").length;
  const healthyWebhooks = WEBHOOKS.filter((w) => w.status === "healthy").length;
  const totalReconciled = RECONCILIATION_LOG.reduce((s, r) => s + r.matched, 0);
  const totalDrift = RECONCILIATION_LOG.reduce((s, r) => s + r.unmatched, 0);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Reality Sync"
        icon={Landmark}
        title="The off-chain world, reconciled hourly"
        subtitle="Nine Egyptian banks, six government webhooks, and an hourly reconciliation log. Every Law Firm Client Account balance, every NOSI registration, every police clearance — verified against the source-of-truth external system, not just trusted on the ledger."
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Banks connected" value={`${healthyBanks}/${BANKS.length}`} icon={Building2} ok={degradedBanks === 0} />
        <KPI label="Webhooks healthy" value={`${healthyWebhooks}/${WEBHOOKS.length}`} icon={Webhook} ok={healthyWebhooks === WEBHOOKS.length} />
        <KPI label="Records reconciled (24h)" value={totalReconciled.toLocaleString()} icon={RefreshCw} />
        <KPI label="Drift records (24h)" value={String(totalDrift)} icon={AlertTriangle} ok={totalDrift === 0} />
      </div>

      {/* Banks grid */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-gold" />
            <h2 className="font-serif text-base font-semibold">Egyptian bank integrations</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">{BANKS.length} banks</span>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {BANKS.map((b) => (
            <div key={b.code} className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gold-light">{b.code}</span>
                <span className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${
                  b.status === "healthy"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                }`}>
                  {b.status === "healthy" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {b.status}
                </span>
              </div>
              <div className="mt-1 font-serif text-sm font-semibold">{b.name}</div>
              <div className="font-sans text-xs text-muted-foreground/85">{b.type}</div>
              <div className="mt-2 flex items-center justify-between font-mono text-xs text-muted-foreground/85">
                <span>{b.latencyMs}ms latency</span>
                <span>{timeAgo(new Date(b.lastSync))}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Reconciliation log */}
        <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
          <div className="border-b border-gold/12 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-3.5 w-3.5 text-gold" />
              <h2 className="font-serif text-base font-semibold">Reconciliation log</h2>
              <span className="ml-auto font-mono text-xs text-muted-foreground/80">hourly · SHA3-chained</span>
            </div>
          </div>
          <ul className="divide-y divide-gold/8">
            {RECONCILIATION_LOG.map((r, i) => (
              <li key={i} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-gold-light">{r.bank}</span>
                  <span className="font-sans text-xs text-muted-foreground/85">{new Date(r.ts).toLocaleString()}</span>
                  <span className={`ml-auto inline-flex items-center gap-1 font-mono text-xs ${
                    r.unmatched === 0 ? "text-emerald-300" : "text-amber-300"
                  }`}>
                    {r.unmatched === 0 ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    drift {r.drift_pct.toFixed(3)}%
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between font-mono text-xs text-muted-foreground/85">
                  <span>{r.matched.toLocaleString()} matched · {r.unmatched} unmatched</span>
                  <span>{shortHash(r.hash, 12, 6)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Webhooks */}
        <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
          <div className="border-b border-gold/12 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Webhook className="h-3.5 w-3.5 text-gold" />
              <h2 className="font-serif text-base font-semibold">Government webhook health</h2>
              <span className="ml-auto font-mono text-xs text-muted-foreground/80">{WEBHOOKS.length} integrations</span>
            </div>
          </div>
          <ul className="divide-y divide-gold/8">
            {WEBHOOKS.map((w) => (
              <li key={w.name} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-sm font-medium">{w.name}</span>
                  <span className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${
                    w.status === "healthy"
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                  }`}>
                    {w.status === "healthy" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {w.status}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between font-mono text-xs text-muted-foreground/85">
                  <span>delivery {(w.deliveryRate * 100).toFixed(1)}%</span>
                  <span>{timeAgo(new Date(w.lastDelivery))}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Reality Sync per Vol 13 · 9 banks · hourly reconciliation · drift &gt;0.1% triggers L2 law firm client account flag
        </p>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, ok }: { label: string; value: string; icon: React.ElementType; ok?: boolean }) {
  return (
    <div className="rounded-2xl border border-gold/15 glass p-4">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-gold" />
        {ok !== undefined && (ok ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <AlertTriangle className="h-3 w-3 text-amber-400" />)}
      </div>
      <div className="mt-2 font-serif text-xl font-semibold">{value}</div>
      <div className="font-sans text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
