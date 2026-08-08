"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Coins,
  Loader2,
  ShieldCheck,
  Scale,
  TrendingUp,
  Info,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { GoldStar } from "@/components/aurienta-logo";
import { egp, pct } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

export type DripShareholding = {
  equityUnits: number;
  avgPriceEgp: number;
};

export type DripEnterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  sector: string;
  equityUnitPriceEgp: number;
};

export type DripEnrollmentForUi = {
  id: string;
  enterpriseId: string;
  reinvestPct: number;
  active: boolean;
  enrolledAt: string;
} | null;

export function DripCard({
  userId,
  enterpriseId,
  shareholding,
  enterprise,
  enrollment,
}: {
  userId: string;
  enterpriseId: string;
  shareholding: DripShareholding;
  enterprise: DripEnterprise;
  enrollment: DripEnrollmentForUi;
}) {
  const router = useRouter();
  const [active, setActive] = React.useState<boolean>(enrollment?.active ?? false);
  const [pctValue, setPctValue] = React.useState<number>(enrollment?.reinvestPct ?? 100);
  const [submitting, setSubmitting] = React.useState(false);

  // Sync from props if the parent re-fetches (e.g. after router.refresh()).
  React.useEffect(() => {
    setActive(enrollment?.active ?? false);
    setPctValue(enrollment?.reinvestPct ?? 100);
  }, [enrollment]);

  // Mock projected next dividend: 4% annual yield on cost basis.
  const annualDividendPerShare = shareholding.avgPriceEgp * 0.04;
  const nextDividendGross = Math.round(annualDividendPerShare * shareholding.equityUnits * 0.25); // quarterly
  const nextDividendNet = Math.round(nextDividendGross * 0.9); // 10% WHT
  const reinvestAmount = Math.round((nextDividendNet * pctValue) / 100);
  const resultingShares = Math.floor(reinvestAmount / enterprise.equityUnitPriceEgp);
  const remainingCash = nextDividendNet - resultingShares * enterprise.equityUnitPriceEgp;

  async function toggle(active: boolean) {
    setSubmitting(true);
    try {
      const action = active ? "enroll" : "unenroll";
      const res = await fetch("/api/drip", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          enterpriseId,
          reinvestPct: pctValue,
          action,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not update DRIP", {
          description: data.code ? `code: ${data.code}` : undefined,
        });
        setActive(!active); // revert
        return;
      }
      setActive(active);
      toast.success(
        active
          ? "DRIP enrolled"
          : "DRIP unenrolled — dividends will be paid in cash",
        {
          description: active
            ? `${pctValue}% of future dividends reinvest at ${egp(enterprise.equityUnitPriceEgp)}/share.`
            : undefined,
        }
      );
      router.refresh();
    } catch {
      toast.error("Network error");
      setActive(!active);
    } finally {
      setSubmitting(false);
    }
  }

  async function updatePct(next: number) {
    setPctValue(next);
    if (!active) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/drip", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          enterpriseId,
          reinvestPct: next,
          action: "update",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not update reParticipation %");
        return;
      }
      toast.success(`ReParticipation set to ${next}%`);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 sm:p-6",
        active ? "border-gold/30 glass-gold" : "border-gold/12 glass"
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-gold" />
              <span className="font-mono text-xs uppercase tracking-[0.22em] text-gold-light/80">
                Dividend ReParticipation Plan
              </span>
            </div>
            <h3 className="mt-1.5 font-serif text-base font-semibold sm:text-lg">
              {enterprise.name}
              <span className="ml-2 rounded border border-gold/25 bg-gold/8 px-1.5 py-0.5 font-mono text-[11px] text-gold-light">
                T{enterprise.tier}
              </span>
            </h3>
            <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
              You hold{" "}
              <span className="font-mono text-foreground">
                {shareholding.equityUnits.toLocaleString()}
              </span>{" "}
              units · AI fundamental price {egp(enterprise.equityUnitPriceEgp)}/share
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-mono text-xs",
                active ? "text-emerald-400" : "text-muted-foreground"
              )}
            >
              {active ? "Enrolled" : "Not enrolled"}
            </span>
            <Switch
              checked={active}
              disabled={submitting}
              onCheckedChange={toggle}
              aria-label="Toggle DRIP enrollment"
            />
          </div>
        </div>

        {/* ReParticipation slider */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <label className="font-sans text-[11px] text-muted-foreground">
              Reinvest %
            </label>
            <span className="font-serif text-lg font-semibold text-gold-light">
              {pctValue}%
            </span>
          </div>
          <Slider
            value={[pctValue]}
            min={0}
            max={100}
            step={5}
            disabled={!active || submitting}
            onValueChange={(v) => setPctValue(v[0])}
            onValueCommit={(v) => updatePct(v[0])}
            className="data-[disabled]:opacity-50"
          />
          <div className="mt-1 flex justify-between font-mono text-[11px] text-muted-foreground/85">
            <span>Cash all</span>
            <span>Reinvest all</span>
          </div>
        </div>

        {/* Projection */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gold/12 bg-background/40 p-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Projected next dividend (net)
            </p>
            <p className="mt-1 font-serif text-base font-semibold text-foreground">
              {egp(nextDividendNet)}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/85">
              Gross {egp(nextDividendGross)} − 10% WHT
            </p>
          </div>
          <div className="rounded-lg border border-gold/22 bg-gold/[0.06] p-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-gold-light/80">
              Reinvested at AI fundamental price
            </p>
            <p className="mt-1 font-serif text-base font-semibold text-gold-light">
              +{resultingShares.toLocaleString()} units
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/85">
              {egp(reinvestAmount)} deployed · cash back {egp(remainingCash)}
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-gold/12 bg-gold/[0.03] p-3">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
          <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
            Auto-reinvest dividends into the same enterprise at the AI fundamental price
            ({egp(enterprise.equityUnitPriceEgp)}/share), within the <strong className="text-foreground">±5% CRE band</strong>,
            through the standard law firm client account + CRE path. <strong className="text-foreground">No speculation</strong> — every
            reParticipation is a real capital deployment with a unique law firm client account reference.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground/85">
          <span className="inline-flex items-center gap-1">
            <Scale className="h-3 w-3 text-gold/60" /> CRE ±5% band enforced
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-gold/60" /> Zero Custody · Law Firm Client Account
          </span>
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-gold/60" /> {pct(active ? pctValue : 0, 0)} reinvested
          </span>
        </div>

        {submitting && (
          <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Syncing…
          </div>
        )}

        {enrollment && (
          <div className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/80">
            <GoldStar className="h-2.5 w-2.5 text-gold/60" />
            Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()} · user {userId.slice(-6)}
          </div>
        )}
      </div>
    </motion.article>
  );
}
