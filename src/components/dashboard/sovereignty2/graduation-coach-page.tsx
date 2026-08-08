"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, X, RefreshCw, Sparkles, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnterpriseSelector, type EnterpriseOption } from "./enterprise-selector";
import { AiGenerateCard, AiContent } from "./ai-generate-card";
import { useAiEndpoint } from "./use-ai-endpoint";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { timeAgo } from "@/lib/aurienta/format";

type Gate = { label: string; passed: boolean };

type CoachResponse = {
  content: string;
  readinessScore: number;
  gates: Gate[];
  generatedAt: string;
  previousAt: string | null;
};

export type CoachPageProps = {
  enterprises: EnterpriseOption[];
  initialEnterpriseId: string | null;
  initialReadiness: { score: number; gates: Gate[] } | null;
  initialPrevious: { content: string; createdAt: string } | null;
};

export function GraduationCoachPage({
  enterprises,
  initialEnterpriseId,
  initialReadiness,
  initialPrevious,
}: CoachPageProps) {
  const [enterpriseId, setEnterpriseId] = React.useState<string>(initialEnterpriseId ?? "");
  const { run, isLoading, data, error } = useAiEndpoint<{ enterpriseId: string }, CoachResponse>(
    "/api/ai/graduation-coach"
  );

  const current = data ?? null;
  const readiness = current?.gates
    ? { score: current.readinessScore, gates: current.gates }
    : initialReadiness && (!current || !current.content)
    ? initialReadiness
    : null;

  const shownContent = current?.content ?? initialPrevious?.content ?? "";
  const shownGeneratedAt = current?.generatedAt ?? initialPrevious?.createdAt ?? null;

  const onGenerate = async () => {
    if (!enterpriseId) {
      toast.error("Select an enterprise first");
      return;
    }
    const res = await run({ enterpriseId });
    if (res) {
      toast.success("Quarterly roadmap generated", {
        description: "Plan persisted as an AiArtifact on the immutable ledger.",
      });
    } else {
      toast.error("Coach unavailable", { description: error ?? undefined });
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

      {/* Enterprise selector */}
      <div className="rounded-2xl border border-gold/12 glass p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Stage 2 / 3 enterprise
            </label>
            <EnterpriseSelector
              options={enterprises}
              value={enterpriseId}
              onChange={setEnterpriseId}
              emptyLabel="No Stage 2/3 enterprises"
              ariaLabel="Select enterprise for graduation coach"
            />
          </div>
          <div className="hidden sm:block">
            {shownGeneratedAt && (
              <p className="font-mono text-xs text-muted-foreground/85">
                Last roadmap {timeAgo(new Date(shownGeneratedAt))}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Readiness gauge + gates */}
      {readiness && (
        <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <GaugeCard score={readiness.score} />
          <GatesCard gates={readiness.gates} />
        </section>
      )}

      {/* Generate roadmap */}
      <AiGenerateCard
        title="Quarterly Graduation Roadmap"
        description="The Graduation Coach produces a 90-day personalized plan to close the gap between this enterprise's current readiness score and the 90+ threshold required to call the 75% graduation vote."
        buttonLabel="Generate new roadmap"
        isGenerating={isLoading}
        hasContent={!!shownContent}
        onGenerate={onGenerate}
        buttonDisabled={!enterpriseId}
        disabledReason={!enterpriseId ? "Select an enterprise to enable the coach." : undefined}
      >
        {shownContent && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/8 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold/80">
                <Sparkles className="h-3 w-3" /> Graduation Coach · glm-4.6
              </span>
              {shownGeneratedAt && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground/85">
                  <Clock className="h-3 w-3" /> {timeAgo(new Date(shownGeneratedAt))}
                </span>
              )}
            </div>
            <AiContent content={shownContent} />
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/85">
                Persisted as an AiArtifact (kind: graduation_coach) · grounded in the enterprise's
                live ledger state.
              </p>
              <button
                type="button"
                onClick={onGenerate}
                disabled={isLoading || !enterpriseId}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gold/20 bg-foreground/[0.02] px-3 font-sans text-[11px] font-medium text-gold-light transition-colors hover:border-gold/40 hover:bg-gold/8 disabled:opacity-40"
              >
                <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                Regenerate
              </button>
            </div>
          </div>
        )}
      </AiGenerateCard>

      {error && (
        <div className="rounded-xl border border-red-400/25 bg-red-400/[0.05] px-4 py-3 text-[12px] text-red-300">
          <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5 align-text-bottom" />
          {error}
        </div>
      )}

      <p className="mt-2 text-center font-mono text-[11px] leading-relaxed text-muted-foreground/80">
        The coach advises; the CRE enforces. The 75% Constitutional Partner vote remains the constitutional climax.
      </p>
    </div>
  );
}

function GaugeCard({ score }: { score: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const verdict =
    score >= 90 ? "Graduation-eligible" : score >= 75 ? "Approaching readiness" : "Foundational phase";

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gold/15 glass-gold p-6">
      <div className="relative inline-flex items-center justify-center">
        <svg width="160" height="160" viewBox="0 0 180 180" className="-rotate-90">
          <defs>
            <linearGradient id="coachGauge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f7e9a6" />
              <stop offset="0.5" stopColor="#d4af37" />
              <stop offset="1" stopColor="#b8860b" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="9" />
          <motion.circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="url(#coachGauge)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dash} ${circumference}` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ filter: "drop-shadow(0 0 8px rgba(212,175,55,0.4))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            readiness
          </span>
          <span className="font-serif text-4xl font-semibold text-gold-gradient">{score}</span>
          <span className="font-mono text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <p
        className={cn(
          "font-serif text-sm font-semibold",
          score >= 90 ? "text-emerald-300" : score >= 75 ? "text-amber-300" : "text-foreground"
        )}
      >
        {verdict}
      </p>
    </div>
  );
}

function GatesCard({ gates }: { gates: Gate[] }) {
  const passed = gates.filter((g) => g.passed).length;
  return (
    <div className="rounded-2xl border border-gold/12 glass p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-base font-semibold">CRE Graduation Gates</h3>
        <span className="font-mono text-xs text-muted-foreground/80">
          {passed}/{gates.length} passed
        </span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {gates.map((g) => (
          <li
            key={g.label}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border p-2.5",
              g.passed
                ? "border-emerald-400/25 bg-emerald-400/[0.05]"
                : "border-red-400/25 bg-red-400/[0.05]"
            )}
          >
            <span
              className={cn(
                "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                g.passed ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"
              )}
            >
              {g.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            </span>
            <span className="font-sans text-[12px] leading-tight text-foreground/90">{g.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
