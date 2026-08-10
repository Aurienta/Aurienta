"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Info,
} from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { egp } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

type SalaryResult = {
  baseEgp: number;
  tierMultiplier: number;
  performanceScore: number;
  regionalAdjustment: number;
  profitFactor: number;
  calculatedSalaryEgp: number;
  finalSalaryEgp: number;
  compensationBand: string;
  aiValidation: {
    validated: boolean;
    response: string;
    adjusted: boolean;
  };
  formula: string;
};

const POSITION_OPTIONS: { value: string; label: string }[] = [
  { value: "chief_executive_officer", label: "Chief Executive Officer" },
  { value: "chief_technology_officer", label: "Chief Technology Officer" },
  { value: "chief_financial_officer", label: "Chief Financial Officer" },
  { value: "operations_manager", label: "Operations Manager" },
  { value: "project_manager", label: "Project Manager" },
  { value: "sales_manager", label: "Sales Manager" },
  { value: "marketing_specialist", label: "Marketing Specialist" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "accountant", label: "Accountant" },
  { value: "lawyer", label: "Lawyer" },
  { value: "consultant", label: "Consultant" },
  { value: "engineer", label: "Engineer" },
  { value: "software_engineer", label: "Software Engineer" },
  { value: "graphic_designer", label: "Graphic Designer" },
  { value: "customer_service", label: "Customer Service" },
  { value: "warehouse_worker", label: "Warehouse Worker" },
  { value: "factory_worker", label: "Factory Worker" },
  { value: "driver", label: "Driver" },
  { value: "intern", label: "Intern" },
  { value: "other", label: "Other" },
];

const TIER_OPTIONS: { value: string; label: string; multiplier: number }[] = [
  { value: "A", label: "Tier A · Foundational", multiplier: 0.8 },
  { value: "B", label: "Tier B · Growth", multiplier: 1.0 },
  { value: "C", label: "Tier C · Expansion", multiplier: 1.3 },
  { value: "D", label: "Tier D · Industrial", multiplier: 1.5 },
  { value: "E", label: "Tier E · Service", multiplier: 0.9 },
  { value: "F", label: "Tier F · Sovereign", multiplier: 1.5 },
];

const REGION_OPTIONS: {
  value: string;
  label: string;
  adjustment: number;
}[] = [
  { value: "cairo", label: "Cairo", adjustment: 1.0 },
  { value: "alexandria", label: "Alexandria", adjustment: 0.9 },
  { value: "delta", label: "Delta", adjustment: 0.85 },
  { value: "upper_egypt", label: "Upper Egypt", adjustment: 0.8 },
  { value: "suez_canal", label: "Suez Canal", adjustment: 0.95 },
];

const FORMULA_LITERAL =
  "Salary = Base × Tier_multiplier × Performance × Regional × Profit";

export function SalaryCalculatorClient({
  user,
}: {
  user: { id: string; legalName: string };
}) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [position, setPosition] = React.useState("software_engineer");
  const [tier, setTier] = React.useState("C");
  const [region, setRegion] = React.useState("cairo");
  const [performance, setPerformance] = React.useState(1.0);
  const [profit, setProfit] = React.useState(1.0);
  const [customBase, setCustomBase] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<SalaryResult | null>(null);

  const tierMeta = TIER_OPTIONS.find((t) => t.value === tier)!;
  const regionMeta = REGION_OPTIONS.find((r) => r.value === region)!;
  const positionMeta = POSITION_OPTIONS.find((p) => p.value === position);

  async function handleCalculate() {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        position,
        tier,
        region,
        performanceScore: Number(performance.toFixed(2)),
        profitFactor: Number(profit.toFixed(2)),
      };
      const parsedBase = Number(customBase);
      if (customBase.trim() !== "" && !Number.isNaN(parsedBase) && parsedBase > 0) {
        payload.customBaseEgp = Math.round(parsedBase);
      }

      const res = await fetch("/api/ai/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Salary calculation failed");
      }
      setResult(data.result);
      toast({
        title: "Salary calculated",
        description: data.result.aiValidation.adjusted
          ? "AI flagged the figure — fell back to neutral performance."
          : "Constitutional Brain AI validated the salary.",
      });
    } catch (e) {
      toast({
        title: "Calculation failed",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-gold/20 glass-gold p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
                <Calculator className="h-3.5 w-3.5 text-gold" />
              </span>
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.24em] text-gold-light/85">
                AI Salary Engine
              </span>
            </div>
            <h1 className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl">
              Compensation, constitutionally computed
            </h1>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-muted-foreground sm:text-base">
              The Constitutional Brain AI validates every salary against the 2026
              Egyptian market and the constitutional minimum wage. Below-AI
              salaries are permitted at manager discretion; above-AI requires a
              75% board override.
            </p>
          </div>
          <div className="hidden shrink-0 flex-col items-end gap-1.5 lg:flex">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
              Signed in as
            </span>
            <span className="font-sans text-xs text-gold/80">{user.legalName}</span>
            <span className="font-sans text-xs text-muted-foreground/80">
              Blueprint §8.4 · CRE-enforced
            </span>
          </div>
        </div>
      </section>

      {/* Formula banner */}
      <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <span className="font-sans text-[11px] font-medium uppercase tracking-wide text-gold-light/85">
            Constitutional Formula
          </span>
        </div>
        <code className="mt-2 block font-mono text-sm text-foreground sm:text-base">
          {FORMULA_LITERAL}
        </code>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calculator form */}
        <Card className="border-gold/20 bg-card/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GoldStar className="h-3.5 w-3.5" />
              <CardTitle className="font-serif text-base font-semibold">
                Compensation inputs
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Position */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                {t("salary.position")}
              </Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="border-gold/20 bg-background/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tier + Region */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                  Tier
                </Label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger className="border-gold/20 bg-background/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIER_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label} · ×{t.multiplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t("salary.region")}
                </Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="border-gold/20 bg-background/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGION_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label} · ×{r.adjustment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Performance slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t("salary.performance")}
                </Label>
                <span className="font-mono text-sm text-gold-light">
                  ×{performance.toFixed(2)}
                </span>
              </div>
              <Slider
                min={0.5}
                max={1.5}
                step={0.05}
                value={[performance]}
                onValueChange={(v) => setPerformance(v[0] ?? 1)}
                className="py-2"
              />
              <div className="flex justify-between font-mono text-[10px] text-muted-foreground/80">
                <span>0.5 · underperforming</span>
                <span>1.0 · neutral</span>
                <span>1.5 · exceptional</span>
              </div>
            </div>

            {/* Profit slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t("salary.profitFactor")}
                </Label>
                <span className="font-mono text-sm text-gold-light">
                  ×{profit.toFixed(2)}
                </span>
              </div>
              <Slider
                min={0.8}
                max={1.2}
                step={0.05}
                value={[profit]}
                onValueChange={(v) => setProfit(v[0] ?? 1)}
                className="py-2"
              />
              <div className="flex justify-between font-mono text-[10px] text-muted-foreground/80">
                <span>0.8 · below sector</span>
                <span>1.0 · at sector</span>
                <span>1.2 · above sector</span>
              </div>
            </div>

            {/* Custom base (optional) */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                Custom base EGP <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                min={1000}
                max={1000000}
                value={customBase}
                onChange={(e) => setCustomBase(e.target.value)}
                placeholder="Override Ministry of Manpower market rate"
                className="border-gold/20 bg-background/40 font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleCalculate}
              disabled={submitting}
              className="self-stretch bg-gold-gradient text-[#0a0a0b] hover:opacity-90 sm:self-end"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {submitting ? t("misc.loading") : t("salary.calculate")}
            </Button>
          </CardContent>
        </Card>

        {/* Result card */}
        <div className="flex flex-col gap-4">
          <Card className="border-gold/20 bg-card/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gold" />
                <CardTitle className="font-serif text-base font-semibold">
                  AI-validated result
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calculator className="h-10 w-10 text-gold/50" />
                  <p className="mt-3 font-serif text-base font-semibold">
                    No calculation yet
                  </p>
                  <p className="mx-auto mt-1 max-w-sm font-sans text-xs text-muted-foreground">
                    Set the inputs and press{" "}
                    <span className="text-gold-light">Calculate salary</span>. The
                    Constitutional Brain AI will validate the result in seconds.
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-5"
                >
                  {/* Headline figure */}
                  <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                    <span className="font-sans text-[11px] uppercase tracking-wide text-gold-light/85">
                      Final monthly salary
                    </span>
                    <div className="mt-1 font-serif text-3xl font-semibold text-gold-gradient sm:text-4xl">
                      {egp(result.finalSalaryEgp)}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-gold/30 bg-gold/10 text-[11px] text-gold-light"
                      >
                        Band · {result.compensationBand}
                      </Badge>
                      <ValidationBadge result={result} />
                    </div>
                  </div>

                  {/* Formula breakdown */}
                  <div className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-4">
                    <div className="flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-gold/80" />
                      <span className="font-sans text-xs uppercase tracking-wide text-gold-light/80">
                        Formula breakdown
                      </span>
                    </div>
                    <code className="mt-2 block font-mono text-xs leading-relaxed text-foreground/90">
                      {result.formula}
                    </code>
                  </div>

                  {/* Factor grid */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Factor label="Base" value={egp(result.baseEgp, { compact: true })} />
                    <Factor label="Tier multiplier" value={`×${result.tierMultiplier}`} />
                    <Factor label="Performance" value={`×${result.performanceScore.toFixed(2)}`} />
                    <Factor label="Regional" value={`×${result.regionalAdjustment}`} />
                    <Factor label="Profit factor" value={`×${result.profitFactor.toFixed(2)}`} />
                    <Factor
                      label="Pre-AI figure"
                      value={egp(result.calculatedSalaryEgp, { compact: true })}
                    />
                  </div>

                  {/* AI response */}
                  <div className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-4">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-gold" />
                      <span className="font-sans text-xs uppercase tracking-wide text-gold-light/80">
                        Constitutional Brain AI · verdict
                      </span>
                    </div>
                    <p className="mt-1.5 font-sans text-xs leading-relaxed text-foreground/90">
                      {result.aiValidation.response || "—"}
                    </p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Constitutional bounds */}
          <Card className="border-gold/12 bg-card/40">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gold/80" />
                <CardTitle className="font-serif text-sm font-semibold">
                  Constitutional bounds
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 font-sans text-xs leading-relaxed text-muted-foreground">
                <li>
                  • Tier multipliers are <span className="text-foreground">fixed</span>{" "}
                  per charter — A=0.8, B=1.0, C=1.3, D=1.5, E=0.9, F=1.5.
                </li>
                <li>
                  • Performance clamped to{" "}
                  <span className="text-foreground">[0.5, 1.5]</span>; profit factor
                  to <span className="text-foreground">[0.8, 1.2]</span>.
                </li>
                <li>
                  • Minimum wage floor:{" "}
                  <span className="text-foreground">4,000 EGP/month</span> (2026).
                </li>
                <li>
                  • Board overrides require{" "}
                  <span className="text-foreground">≥75% vote</span>; above 200%
                  triggers shareholder notification.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Factor({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gold/12 bg-foreground/[0.02] p-3">
      <div className="font-mono text-sm text-gold-light">{value}</div>
      <div className="mt-0.5 font-sans text-[11px] uppercase tracking-wide text-muted-foreground/85">
        {label}
      </div>
    </div>
  );
}

function ValidationBadge({ result }: { result: SalaryResult }) {
  const v = result.aiValidation;
  if (v.validated && !v.adjusted) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-emerald-400/30 bg-emerald-400/10 text-[11px] text-emerald-300"
        )}
      >
        <CheckCircle2 className="mr-1 h-3 w-3" /> AI validated
      </Badge>
    );
  }
  if (v.adjusted) {
    return (
      <Badge
        variant="outline"
        className="border-amber-400/30 bg-amber-400/10 text-[11px] text-amber-300"
      >
        <AlertTriangle className="mr-1 h-3 w-3" /> AI adjusted · fallback to neutral
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-rose-400/30 bg-rose-400/10 text-[11px] text-rose-300"
    >
      <AlertTriangle className="mr-1 h-3 w-3" /> AI rejected
    </Badge>
  );
}
