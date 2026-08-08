import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { GoldStar, AurientaMark } from "@/components/aurienta-logo";
import { egp, pct, timeAgo } from "@/lib/aurienta/format";
import {
  ShieldPlus,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Dice5,
  Scroll,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Antifragility Vault · AURIENTA",
  description:
    "0.5% sovereign antifragility vault, Monte Carlo stress tests, and emergency loan rules — the constitutional buffer that turns shocks into strength.",
};

// Mock Monte Carlo scenarios — in production these are real simulations.
const SCENARIOS = [
  { name: "EGP 30% devaluation", iterations: 10000, p95_loss_egp: 8_400_000, recovery_months: 18, vault_draw_egp: 2_100_000, outcome: "vault covers all affected enterprises with 41% headroom" },
  { name: "Sector-wide demand contraction (food)", iterations: 10000, p95_loss_egp: 4_200_000, recovery_months: 12, vault_draw_egp: 1_050_000, outcome: "vault covers 100% of affected enterprises" },
  { name: "Two graduated enterprises default simultaneously", iterations: 5000, p95_loss_egp: 6_800_000, recovery_months: 24, vault_draw_egp: 1_700_000, outcome: "vault covers all affected enterprises with 22% headroom" },
  { name: "Law-firm client account failure (Nile Legal)", iterations: 5000, p95_loss_egp: 12_400_000, recovery_months: 30, vault_draw_egp: 3_100_000, outcome: "vault + law-firm insurance + re-insurance covers 96%" },
  { name: "Cyber incident — ledger tampering attempt", iterations: 8000, p95_loss_egp: 0, recovery_months: 1, vault_draw_egp: 0, outcome: "SHA3-256 hash chain detected + blocked; no funds touched" },
];

export default async function AntifragilityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/antifragility");

  // Compute vault size — 0.5% of total raised.
  const raisedSum = await db.enterprise.aggregate({ _sum: { raisedEgp: true } });
  const totalRaised = raisedSum._sum.raisedEgp ?? 0;
  const vaultTargetEgp = Math.round(totalRaised * 0.005);
  const vaultDeployedEgp = Math.round(vaultTargetEgp * 0.18); // mock: 18% currently deployed
  const vaultAvailableEgp = vaultTargetEgp - vaultDeployedEgp;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Antifragility Vault"
        icon={ShieldPlus}
        title="Shocks make the network stronger"
        subtitle="The 0.5% sovereign antifragility vault is funded by a constitutional levy on every Equity-Unit raise. It backstops enterprises through currency shocks, sector contractions, and rare law-firm failures — converting crises into survivable events rather than existential ones."
      />

      {/* Vault hero */}
      <section className="overflow-hidden rounded-3xl border border-gold/30 glass-gold p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-3 lg:items-center">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-gold" />
              <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-gold-light/85">Sovereign Vault</span>
            </div>
            <div className="mt-3 font-serif text-4xl font-semibold text-gold-gradient">
              {egp(vaultTargetEgp, { compact: true })}
            </div>
            <p className="mt-1 font-sans text-xs text-muted-foreground">
              0.5% levy on {egp(totalRaised, { compact: true })} total raised
            </p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-3 gap-3">
            <VaultStat label="Deployed" value={egp(vaultDeployedEgp, { compact: true })} />
            <VaultStat label="Available" value={egp(vaultAvailableEgp, { compact: true })} accent />
            <VaultStat label="Buffer ratio" value={pct(((vaultAvailableEgp / Math.max(vaultTargetEgp, 1)) * 100), 1)} />
          </div>
        </div>
      </section>

      {/* Monte Carlo scenarios */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Dice5 className="h-3.5 w-3.5 text-gold" />
            <h2 className="font-serif text-base font-semibold">Monte Carlo stress scenarios</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">95th percentile · {SCENARIOS.length} scenarios</span>
          </div>
        </div>
        <ul className="divide-y divide-gold/8">
          {SCENARIOS.map((s) => (
            <li key={s.name} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-serif text-sm font-semibold">{s.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-gold/20 bg-foreground/5 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {s.iterations.toLocaleString()} iterations
                </span>
                <span className="ml-auto inline-flex items-center gap-1 font-mono text-xs text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> {s.outcome}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat label="P95 loss" value={`−${egp(s.p95_loss_egp, { compact: true })}`} danger />
                <Stat label="Vault draw" value={egp(s.vault_draw_egp, { compact: true })} />
                <Stat label="Recovery" value={`${s.recovery_months} mo`} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Emergency loan rules */}
      <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Scroll className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">Emergency loan rules (Vol 7.5)</h2>
        </div>
        <ol className="mt-4 space-y-3 font-sans text-xs leading-relaxed text-foreground/90">
          <Rule n={1}>
            <strong>Eligibility:</strong> Vault loans available only to enterprises in Stage 1–2 with health rating ≥ BBB and at least 6 months of operating history on the constitutional infrastructure.
          </Rule>
          <Rule n={2}>
            <strong>Trigger:</strong> An "antifragility event" requires (a) a &gt;25% drawdown in monthly revenue OR (b) a &gt;40% currency move OR (c) a Steward-declared sector emergency.
          </Rule>
          <Rule n={3}>
            <strong>Size:</strong> Maximum 3× monthly burn, capped at 12% of vault available balance per enterprise per event.
          </Rule>
          <Rule n={4}>
            <strong>Rate:</strong> 0% for the first 6 months, then 4% above the Central Bank of Egypt overnight rate. No compounding.
          </Rule>
          <Rule n={5}>
            <strong>Repayment:</strong> 24-month amortisation, auto-deducted from the law firm client account before any dividend distribution.
          </Rule>
          <Rule n={6}>
            <strong>Default:</strong> If an enterprise misses 3 consecutive repayments, the Constitutional Council may vote (50% threshold) to convert outstanding principal to constitutional infrastructure equity at the AI fundamental price.
          </Rule>
          <Rule n={7}>
            <strong>Sunset:</strong> The vault is dissolved 36 months after the last enterprise graduates. Residual funds distribute pro-rata to graduates as a sovereignty bonus.
          </Rule>
        </ol>
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Antifragility framework per Vol 7.5 — every shock the vault survives becomes a precedent in the institutional memory
        </p>
      </div>
    </div>
  );
}

function VaultStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? "border-gold/30 bg-gold/10" : "border-gold/12 bg-foreground/[0.02]"}`}>
      <div className={`font-mono text-sm ${accent ? "text-gold-light" : "text-foreground"}`}>{value}</div>
      <div className="mt-0.5 font-sans text-xs uppercase tracking-wide text-muted-foreground/85">{label}</div>
    </div>
  );
}

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-foreground/[0.02] p-2.5">
      <div className={`font-mono text-xs ${danger ? "text-rose-300" : "text-gold-light"}`}>{value}</div>
      <div className="mt-0.5 font-sans text-xs text-muted-foreground/85">{label}</div>
    </div>
  );
}

function Rule({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-mono text-xs text-gold-light">
        {n}
      </span>
      <div className="pt-0.5">{children}</div>
    </li>
  );
}
