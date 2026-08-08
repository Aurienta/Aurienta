"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from "recharts";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnterpriseSelector, type EnterpriseOption } from "./enterprise-selector";
import { AiGenerateCard, AiContent } from "./ai-generate-card";
import { useAiEndpoint } from "./use-ai-endpoint";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { egp, timeAgo } from "@/lib/aurienta/format";

type SimResponse = {
  content: string;
  financials: {
    annualRevenue: number;
    platformFeeAnnual: number;
    consultingFeeAnnual: number;
    totalFeesAnnual: number;
    escrowReleased: number;
    annualBurn: number;
    monthlyRevenue: number;
    monthlyBurn: number;
    grossMarginPct: number;
    revenueGrowthPct: number;
    readinessScore: number;
    stage: string;
  };
  generatedAt: string;
};

export type SimulatorPageProps = {
  enterprises: EnterpriseOption[];
  initialEnterpriseId: string | null;
};

export function GraduationSimulatorPage({ enterprises, initialEnterpriseId }: SimulatorPageProps) {
  const [enterpriseId, setEnterpriseId] = React.useState<string>(initialEnterpriseId ?? "");
  const { run, isLoading, data, error } = useAiEndpoint<{ enterpriseId: string }, SimResponse>(
    "/api/ai/graduation-simulator"
  );

  const onGenerate = async () => {
    if (!enterpriseId) {
      toast.error("Select an enterprise first");
      return;
    }
    const res = await run({ enterpriseId });
    if (res) {
      toast.success("Simulation complete", {
        description: "Before/after diff + 12-month forecast persisted to ledger.",
      });
    } else {
      toast.error("Simulator unavailable", { description: error ?? undefined });
    }
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SonnerToaster
        position="top-center"
        toastOptions={{
          style: {
            border: "1px solid rgba(212,175,55,0.25)",
            background: "rgba(16,16,18,0.95)",
            color: "#f3eedd",
          },
        }}
      />

      <div className="rounded-2xl border border-gold/12 glass p-4 sm:p-5">
        <label className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Enterprise to simulate
        </label>
        <EnterpriseSelector
          options={enterprises}
          value={enterpriseId}
          onChange={setEnterpriseId}
          ariaLabel="Select enterprise for graduation simulation"
        />
      </div>

      <AiGenerateCard
        title="Graduation Simulation"
        description="Before calling the 75% graduation vote, model what changes post-graduation: Constitutional Infrastructure fees → 0, CRE enforcement → off, AURIENTA board seat resigned, Law Firm Client Account balance released, ledger exported. Includes a 12-month operational independence forecast with three stress scenarios."
        buttonLabel="Run simulation"
        isGenerating={isLoading}
        hasContent={!!data?.content}
        onGenerate={onGenerate}
        buttonDisabled={!enterpriseId}
        disabledReason={!enterpriseId ? "Select an enterprise to enable the simulator." : undefined}
      >
        {data && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/8 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold/80">
                <Sparkles className="h-3 w-3" /> Graduation Simulator · glm-4.6
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground/85">
                <Clock className="h-3 w-3" /> {timeAgo(new Date(data.generatedAt))}
              </span>
            </div>

            {/* Before / After cards */}
            <BeforeAfterCards financials={data.financials} />

            {/* 12-month forecast chart */}
            <ForecastChart financials={data.financials} />

            {/* Verdict banner */}
            <VerdictBanner readinessScore={data.financials.readinessScore} />

            {/* Full AI text */}
            <AiContent content={data.content} />

            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/85">
              Persisted as an AiArtifact (kind: graduation_simulation). Simulation is advisory — the
              75% Constitutional Partner vote is the constitutional climax.
            </p>
          </div>
        )}
      </AiGenerateCard>

      {error && (
        <div className="rounded-xl border border-red-400/25 bg-red-400/[0.05] px-4 py-3 text-[12px] text-red-300">
          <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5 align-text-bottom" />
          {error}
        </div>
      )}

      <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-4 py-3">
        <p className="font-mono text-xs leading-relaxed text-amber-200/80">
          <AlertTriangle className="mr-1.5 inline h-3 w-3 align-text-bottom" />
          Simulation is advisory. The 75% Constitutional Partner vote is the constitutional climax — this tool
          prepares, not replaces, it.
        </p>
      </div>
    </div>
  );
}

function BeforeAfterCards({
  financials,
}: {
  financials: SimResponse["financials"];
}) {
  const items = [
    {
      label: "Platform fee",
      before: `${financials.monthlyRevenue > 0 ? ((financials.platformFeeAnnual / (financials.monthlyRevenue * 12)) * 100).toFixed(0) : "5"}%`,
      after: "0%",
      note: `saves ${egp(financials.platformFeeAnnual, { compact: true })}/yr`,
      tone: "good" as const,
    },
    {
      label: "Consulting fee",
      before: `${financials.monthlyRevenue > 0 ? ((financials.consultingFeeAnnual / (financials.monthlyRevenue * 12)) * 100).toFixed(1) : "2.5"}%`,
      after: "0%",
      note: `saves ${egp(financials.consultingFeeAnnual, { compact: true })}/yr`,
      tone: "good" as const,
    },
    {
      label: "CRE enforcement",
      before: "ON (AURIENTA-hosted)",
      after: "OFF (self-hosted, 4–8h transfer)",
      note: "Rego policies now run on enterprise nodes",
      tone: "neutral" as const,
    },
    {
      label: "AURIENTA board seat",
      before: "1 seat",
      after: "Resigned",
      note: "Full board control to enterprise",
      tone: "good" as const,
    },
    {
      label: "Data hosting",
      before: "AURIENTA IPFS + Filecoin",
      after: "Self-hosted IPFS pinning",
      note: "Pins transfer to enterprise nodes",
      tone: "neutral" as const,
    },
    {
      label: "Law Firm Client Account",
      before: egp(financials.escrowReleased, { compact: true }),
      after: "Released to treasury",
      note: "Law-firm client account closes on graduation",
      tone: "good" as const,
    },
    {
      label: "Ledger",
      before: "Live on platform",
      after: "Exported (SHA3-256 + Ed25519)",
      note: "Downloadable sovereign package",
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <div
          key={it.label}
          className={cn(
            "rounded-xl border p-3",
            it.tone === "good"
              ? "border-emerald-400/20 bg-emerald-400/[0.04]"
              : "border-gold/12 bg-foreground/[0.02]"
          )}
        >
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {it.label}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-sans text-[11px] text-muted-foreground line-through decoration-red-400/40">
              {it.before}
            </span>
            <span className="text-gold/40">→</span>
            <span className="font-serif text-sm font-semibold text-foreground">{it.after}</span>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/85">{it.note}</p>
        </div>
      ))}
    </div>
  );
}

function ForecastChart({ financials }: { financials: SimResponse["financials"] }) {
  // Deterministic 12-month forecast based on current revenue, burn, growth.
  const months = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12"];
  const data = React.useMemo(() => {
    const start = financials.escrowReleased + financials.monthlyRevenue;
    const growth = Math.max(0.001, financials.revenueGrowthPct / 100);
    const margin = Math.max(0.05, financials.grossMarginPct / 100);
    const burn = financials.monthlyBurn;
    let baseline = start;
    let stressA = start;
    let stressB = start;
    let stressC = start;
    return months.map((m, i) => {
      const revBase = financials.monthlyRevenue * Math.pow(1 + growth / 12, i);
      const revStressA = financials.monthlyRevenue * 0.8 * Math.pow(1 + growth / 12, i);
      const revStressB =
        i < 2
          ? financials.monthlyRevenue * 0.5 * Math.pow(1 + growth / 12, i)
          : financials.monthlyRevenue * 0.85 * Math.pow(1 + growth / 12, i);
      const revStressC = financials.monthlyRevenue * 0.65 * Math.pow(1 + growth / 12, i);
      baseline += revBase * margin - burn;
      stressA += revStressA * margin - burn;
      stressB += revStressB * margin - burn;
      stressC += revStressC * margin - burn;
      return {
        m,
        baseline: Math.round(baseline / 1_000_000),
        stressA: Math.round(stressA / 1_000_000),
        stressB: Math.round(stressB / 1_000_000),
        stressC: Math.round(stressC / 1_000_000),
      };
    });
  }, [financials]);

  return (
    <div className="rounded-xl border border-gold/12 bg-background/40 p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-sans text-xs font-medium text-foreground/90">
          12-month operational forecast (treasury cash, M EGP)
        </p>
        <p className="font-mono text-xs text-muted-foreground/85">
          baseline · stress A (rev −20%) · stress B (key person) · stress C (combined)
        </p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="lineBase" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#b8860b" />
                <stop offset="0.5" stopColor="#d4af37" />
                <stop offset="1" stopColor="#f4d676" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(212,175,55,0.08)" vertical={false} />
            <XAxis
              dataKey="m"
              tick={{ fill: "#a89f86", fontSize: 9, fontFamily: "var(--font-mono)" }}
              axisLine={{ stroke: "rgba(212,175,55,0.15)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#a89f86", fontSize: 9, fontFamily: "var(--font-mono)" }}
              axisLine={false}
              tickLine={false}
              width={42}
              tickFormatter={(v: number) => `${v}M`}
            />
            <Tooltip
              cursor={{ stroke: "rgba(212,175,55,0.3)" }}
              contentStyle={{
                background: "rgba(16,16,20,0.96)",
                border: "1px solid rgba(212,175,55,0.25)",
                borderRadius: 10,
                color: "#f3eedd",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
              }}
              formatter={(v: number, name: string) => [`${v}M EGP`, name]}
            />
            <ReferenceLine y={0} stroke="rgba(248,113,113,0.45)" strokeDasharray="3 3" />
            <Legend
              wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#a89f86" }}
              iconType="line"
            />
            <Line type="monotone" dataKey="baseline" stroke="url(#lineBase)" strokeWidth={2.4} dot={false} />
            <Line type="monotone" dataKey="stressA" stroke="#f4d676" strokeWidth={1.6} strokeDasharray="4 3" dot={false} />
            <Line type="monotone" dataKey="stressB" stroke="#c9a03d" strokeWidth={1.6} strokeDasharray="2 2" dot={false} />
            <Line type="monotone" dataKey="stressC" stroke="#e0584b" strokeWidth={1.8} strokeDasharray="6 2" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function VerdictBanner({ readinessScore }: { readinessScore: number }) {
  const verdict =
    readinessScore >= 90 ? "READY" : readinessScore >= 70 ? "NEEDS WORK" : "NOT READY";
  const tone =
    readinessScore >= 90
      ? "border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-200"
      : readinessScore >= 70
      ? "border-amber-400/30 bg-amber-400/[0.06] text-amber-200"
      : "border-red-400/30 bg-red-400/[0.06] text-red-200";
  return (
    <div className={cn("rounded-xl border px-4 py-3", tone)}>
      <p className="font-mono text-xs uppercase tracking-[0.18em] opacity-80">
        Graduation readiness verdict
      </p>
      <p className="mt-1 font-serif text-2xl font-semibold">{verdict}</p>
      <p className="mt-1 font-sans text-[12px] opacity-80">
        Current readiness score: {readinessScore}/100 · 90+ required to call the 75% vote.
      </p>
    </div>
  );
}
