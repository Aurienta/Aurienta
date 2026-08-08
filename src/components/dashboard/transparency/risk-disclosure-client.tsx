"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ShieldCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HeartPulse,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { egp, pct, timeAgo } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

export type Disclosure = {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  enterpriseTier: string;
  enterpriseSector: string;
  enterpriseHealth: string | null;
  amountEgp: number;
  riskProfile: string;
  stressLossEstimateEgp: number;
  stressScenario: string;
  coolingEndsAt: string;
  acknowledged: boolean;
  createdAt: string;
};

type Investable = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  sector: string;
  healthRating: string | null;
  equityUnitPriceEgp: number;
  raisedEgp: number;
  fundraisingGoalEgp: number;
  lawFirmClientAccountBalanceEgp: number;
  monthlyBurnEgp: number;
};

const RISK_LABELS: Record<string, { label: string; lossPct: number }> = {
  conservative: { label: "Conservative", lossPct: 35 },
  balanced: { label: "Balanced", lossPct: 55 },
  aggressive: { label: "Aggressive", lossPct: 75 },
  founder_aligned: { label: "Founder-aligned", lossPct: 90 },
};

function stressScenarioFor(profile: string, entName: string, sector: string) {
  const p = RISK_LABELS[profile] ?? RISK_LABELS.balanced;
  return `${p.lossPct}% drawdown scenario · ${entName} (${sector}) under sector-wide demand contraction`;
}

export function RiskDisclosureClient({
  userId,
  riskProfile,
  disclosures,
  investable,
  stats,
}: {
  userId: string;
  riskProfile: string;
  disclosures: Disclosure[];
  investable: Investable[];
  stats: { total: number; acknowledged: number; pending: number; totalStressLoss: number };
}) {
  const [selectedEnt, setSelectedEnt] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [acknowledging, setAcknowledging] = React.useState<string | null>(null);

  const selected = investable.find((e) => e.id === selectedEnt) ?? null;
  const amountNum = Number(amount) || 0;
  const stressPct = (RISK_LABELS[riskProfile] ?? RISK_LABELS.balanced).lossPct;
  const stressLoss = Math.round((amountNum * stressPct) / 100);
  const coolingEnds = new Date(Date.now() + 72 * 3600 * 1000);

  async function generateDisclosure() {
    if (!selectedEnt || amountNum < 50) {
      toast.error("Pick an enterprise and amount ≥ 50 EGP");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/risk-disclosure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: selectedEnt,
          amountEgp: amountNum,
          riskProfile,
          stressScenario: stressScenarioFor(riskProfile, selected?.name ?? "", selected?.sector ?? ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? "submit failed");
      toast.success("Risk disclosure generated", {
        description: `Cooling-off ends ${coolingEnds.toLocaleString()}. Acknowledge after reviewing.`,
      });
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      toast.error("Could not generate disclosure", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function acknowledge(id: string) {
    setAcknowledging(id);
    try {
      const res = await fetch("/api/risk-disclosure", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, acknowledge: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? "patch failed");
      toast.success("Disclosure acknowledged", {
        description: "You may now proceed with the Law Firm Client Account transfer.",
      });
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      toast.error("Could not acknowledge", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setAcknowledging(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Disclosures", value: String(stats.total), icon: ShieldCheck },
          { label: "Acknowledged", value: String(stats.acknowledged), icon: CheckCircle2 },
          { label: "In cooling-off", value: String(stats.pending), icon: Clock },
          { label: "Stress-loss tracked", value: egp(stats.totalStressLoss, { compact: true }), icon: TrendingDown },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-gold/15 glass-gold p-4"
          >
            <kpi.icon className="h-4 w-4 text-gold" />
            <div className="mt-2 font-serif text-2xl font-semibold">{kpi.value}</div>
            <div className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Generate */}
      <div className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">Generate a new risk disclosure</h2>
        </div>
        <p className="mt-1.5 font-sans text-sm text-muted-foreground">
          Your risk profile is <span className="font-mono text-gold-light">{RISK_LABELS[riskProfile]?.label ?? riskProfile}</span>.
          The stress-loss estimate is {(RISK_LABELS[riskProfile] ?? RISK_LABELS.balanced).lossPct}% of your commitment —
          the platform refuses to transfer escrowed capital until you acknowledge it in writing.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
              Enterprise
            </Label>
            <Select value={selectedEnt} onValueChange={(v) => { setSelectedEnt(v); setAmount(""); }}>
              <SelectTrigger className="border-gold/20 bg-background/40">
                <SelectValue placeholder="Select an enterprise" />
              </SelectTrigger>
              <SelectContent>
                {investable.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} · T{e.tier} · {e.healthRating ?? "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
              Amount (EGP)
            </Label>
            <Input
              type="number"
              min={50}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50,000"
              className="border-gold/20 bg-background/40 font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
              Stress-loss estimate
            </Label>
            <div className="flex h-9 items-center rounded-md border border-rose-400/30 bg-rose-400/10 px-3 font-mono text-sm text-rose-300">
              −{egp(stressLoss, { compact: true })}
            </div>
          </div>
        </div>

        {selected && (
          <div className="mt-4 rounded-xl border border-gold/12 bg-foreground/[0.02] p-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Detail label="Health rating" value={selected.healthRating ?? "—"} />
              <Detail label="Share price" value={egp(selected.equityUnitPriceEgp)} />
              <Detail label="Law Firm Client Account balance" value={egp(selected.lawFirmClientAccountBalanceEgp, { compact: true })} />
              <Detail label="Runway" value={`${selected.monthlyBurnEgp > 0 ? (selected.lawFirmClientAccountBalanceEgp / selected.monthlyBurnEgp).toFixed(1) : "∞"} mo`} />
            </div>
          </div>
        )}

        <Button
          onClick={generateDisclosure}
          disabled={submitting || !selectedEnt || amountNum < 50}
          className="mt-5 bg-gold-gradient text-[#0a0a0b] hover:opacity-90"
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
          Generate disclosure + start 72h cooling-off
        </Button>
      </div>

      {/* Existing disclosures */}
      <div className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <GoldStar className="h-3 w-3" />
            <h2 className="font-serif text-base font-semibold">Your disclosure log</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">
              {disclosures.length} entr{disclosures.length === 1 ? "y" : "ies"}
            </span>
          </div>
        </div>
        {disclosures.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-gold/50" />
            <p className="mt-3 font-serif text-base font-semibold">No disclosures yet</p>
            <p className="mx-auto mt-1 max-w-sm font-sans text-xs text-muted-foreground">
              Generate your first risk disclosure above. The CRE will refuse any Law Firm Client Account
              transfer you attempt without one.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gold/8">
            {disclosures.map((d) => {
              const coolingOver = new Date(d.coolingEndsAt).getTime() < Date.now();
              const canAck = !d.acknowledged && coolingOver;
              return (
                <li key={d.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-sm font-semibold">{d.enterpriseName}</span>
                    <Badge variant="outline" className="border-gold/20 bg-foreground/5 text-xs">
                      T{d.enterpriseTier} · {d.enterpriseSector}
                    </Badge>
                    {d.enterpriseHealth && (
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-gold-light/80">
                        <HeartPulse className="h-3 w-3" /> {d.enterpriseHealth}
                      </span>
                    )}
                    <span className="ml-auto font-sans text-xs text-muted-foreground/80">
                      {timeAgo(new Date(d.createdAt))}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Detail label="Commitment" value={egp(d.amountEgp)} />
                    <Detail label="Risk profile" value={RISK_LABELS[d.riskProfile]?.label ?? d.riskProfile} />
                    <Detail label="Stress loss" value={"-" + egp(d.stressLossEstimateEgp, { compact: true })} danger />
                    <Detail label="Cooling ends" value={new Date(d.coolingEndsAt).toLocaleString()} />
                  </div>

                  <p className="mt-2 font-sans text-[11px] leading-relaxed text-muted-foreground">
                    <Sparkles className="mr-1 inline h-3 w-3 text-gold" />
                    {d.stressScenario}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    {d.acknowledged ? (
                      <Badge variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Acknowledged — Law Firm Client Account unlocked
                      </Badge>
                    ) : coolingOver ? (
                      <Button
                        size="sm"
                        onClick={() => acknowledge(d.id)}
                        disabled={acknowledging === d.id}
                        className="bg-gold-gradient text-[#0a0a0b] hover:opacity-90"
                      >
                        {acknowledging === d.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                        Acknowledge
                      </Button>
                    ) : (
                      <Badge variant="outline" className="border-amber-400/30 bg-amber-400/10 text-amber-300">
                        <Clock className="mr-1 h-3 w-3" /> Cooling-off active
                      </Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-center font-mono text-[11px] leading-relaxed text-muted-foreground/80">
        Cooling-off is 72 hours by constitutional rule (Vol 7.3 Capital Partner Protection). Stress-loss
        percentages map to declared risk profiles — change yours in Profile settings.  The CRE
        hard-blocks any Law Firm Client Account transfer attempted without an acknowledged disclosure on file.
      </p>
    </div>
  );
}

function Detail({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <div className="font-sans text-xs uppercase tracking-wide text-muted-foreground/85">{label}</div>
      <div className={cn("mt-0.5 font-mono text-xs", danger ? "text-rose-300" : "text-foreground")}>{value}</div>
    </div>
  );
}

