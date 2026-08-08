"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Sparkles, FileText, Cpu, AlertTriangle, ChevronDown, ChevronUp, Presentation } from "lucide-react";
import type { WizardState, FeasibilityReport } from "../types";

export function StepFeasibility({
  state,
  update,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}) {
  const [running, setRunning] = React.useState(false);
  const [stageIndex, setStageIndex] = React.useState(0);
  const [expandedStep, setExpandedStep] = React.useState<string | null>(null);
  // Optional material inputs
  const [feasibilityStudyText, setFeasibilityStudyText] = React.useState("");
  const [pitchDeckText, setPitchDeckText] = React.useState("");
  const [showOptional, setShowOptional] = React.useState(false);

  const STAGES = [
    "Charter parsing (tier + sector validation)",
    "1-year expense feasibility",
    "Financial consistency check",
    "Founder credibility assessment",
    "Fraud & duplicate detection",
    "Optional material scoring",
    "Sanity check & final score",
  ];

  const runAssessment = async () => {
    if (running) return;
    setRunning(true);
    setStageIndex(0);

    // Animate through the 7 stages while the API call runs in parallel.
    let i = 0;
    const tick = () => {
      i += 1;
      if (i >= STAGES.length) return; // wait for API
      setStageIndex(i);
      window.setTimeout(tick, 600);
    };
    window.setTimeout(tick, 600);

    try {
      const payload = {
        name: state.name,
        description: state.description,
        sector: state.sector,
        tier: state.tier,
        fundraisingGoalEgp: Number(state.fundraisingGoalEgp),
        equityUnitPriceEgp: Number(state.equityUnitPriceEgp),
        monthlyExpensesEgp: Math.round(Number(state.fundraisingGoalEgp) / 12),
        contingencyPct: 5,
        feasibilityStudyText: feasibilityStudyText || undefined,
        pitchDeckText: pitchDeckText || undefined,
        founderBackground: state.description,
      };

      const res = await fetch("/api/ai/feasibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      setStageIndex(STAGES.length);
      setRunning(false);

      if (!res.ok || !data.ok) {
        toast.error("Feasibility assessment failed", {
          description: data?.error ?? "The CRE could not complete the evaluation.",
        });
        return;
      }

      const report = data.report as FeasibilityReport;
      update({
        feasibilityRun: true,
        feasibilityScore: report.feasibilityScore,
        feasibilityReport: report,
      });

      if (report.passed) {
        toast.success(`Feasibility PASSED — ${report.feasibilityScore}/100`, {
          description: "Your enterprise meets the constitutional threshold (≥35). Proceed to charter review.",
        });
      } else {
        toast.error(`Feasibility BELOW THRESHOLD — ${report.feasibilityScore}/100`, {
          description: "Review the remediation plan and resubmit after improvements.",
        });
      }
    } catch (e) {
      setRunning(false);
      toast.error("Assessment failed", {
        description: e instanceof Error ? e.message : "Network error",
      });
    }
  };

  const score = state.feasibilityScore;
  const report = state.feasibilityReport;
  const passed = score !== null && score >= 35;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-gold/15 glass-gold p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-gold">
              <Cpu className="h-4 w-4" />
              <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
                Constitutional Project Evaluation Engine · §4.1.1
              </span>
            </div>
            <h3 className="font-serif text-xl font-semibold">Constitutional feasibility assessment</h3>
            <p className="font-sans text-xs text-muted-foreground">
              The CRE runs your charter through a 7-stage AI evaluation pipeline. A score of <span className="text-gold-light font-medium">≥35</span> is required to proceed to the Pre-Partnership Constitutional Consensus Phase.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-gold/25 bg-gold/5 font-mono text-[11px] text-gold-light"
          >
            7-stage AI
          </Badge>
        </div>

        <Button
          type="button"
          onClick={runAssessment}
          disabled={running}
          className="mt-4 h-11 w-full bg-gold-gradient px-5 text-sm font-semibold text-black shadow-[0_12px_36px_-14px_rgba(212,175,55,0.65)] sm:w-auto"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running {STAGES[stageIndex] ?? "stages"}…
            </>
          ) : state.feasibilityRun ? (
            <>
              <Sparkles className="h-4 w-4" /> Re-run assessment
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Run AI feasibility assessment
            </>
          )}
        </Button>
      </div>

      {/* Optional materials (collapsible) */}
      <div className="rounded-xl border border-gold/10 bg-background/40">
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <span className="flex items-center gap-2 font-sans text-xs font-medium text-foreground">
            <FileText className="h-3.5 w-3.5 text-gold/70" />
            Optional materials (up to +25 bonus points)
          </span>
          {showOptional ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {showOptional && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-4 px-4 pb-4">
                <div>
                  <Label htmlFor="feas-study" className="font-sans text-xs text-muted-foreground">
                    Feasibility study (max +10 pts) — paste text or summary
                  </Label>
                  <Textarea
                    id="feas-study"
                    value={feasibilityStudyText}
                    onChange={(e) => setFeasibilityStudyText(e.target.value)}
                    placeholder="Paste your feasibility study content here. The AI scores depth of market research, risk analysis, regulatory assessment, sensitivity analysis, and scenario planning."
                    className="mt-1 min-h-[80px] border-gold/15 bg-background/60 font-sans text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="pitch-deck-text" className="font-sans text-xs text-muted-foreground">
                    Pitch deck (max +8 pts) — paste slide content or summary
                  </Label>
                  <Textarea
                    id="pitch-deck-text"
                    value={pitchDeckText}
                    onChange={(e) => setPitchDeckText(e.target.value)}
                    placeholder="Paste your pitch deck content here. Or use the AI Pitch Deck Generator after this assessment."
                    className="mt-1 min-h-[80px] border-gold/15 bg-background/60 font-sans text-xs"
                  />
                </div>
                <p className="font-sans text-[11px] text-muted-foreground/80">
                  No penalty for omission. Total bonus capped at +25 points. Final score cannot exceed 100.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stage pipeline */}
      <AnimatePresence>
        {(running || state.feasibilityRun) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-gold/12 bg-background/40 p-4">
              <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                7-stage pipeline
              </p>
              <ol className="grid gap-2 sm:grid-cols-2">
                {STAGES.map((s, i) => {
                  const stageDone = state.feasibilityRun || i < stageIndex;
                  const stageActive = running && i === stageIndex;
                  return (
                    <li
                      key={s}
                      className="flex items-center gap-2 rounded-lg border border-gold/8 bg-background/30 px-3 py-2"
                    >
                      {stageDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      ) : stageActive ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-gold" />
                      ) : (
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-gold/20" />
                      )}
                      <span className={`font-sans text-xs ${stageDone ? "text-foreground" : "text-muted-foreground"}`}>
                        {s}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full evaluation report */}
      <AnimatePresence>
        {state.feasibilityRun && report && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-gold/20 bg-gold/[0.05] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
                  Feasibility score
                </p>
                <p className="mt-1 font-serif text-4xl font-semibold text-gold-light">
                  {report.feasibilityScore}
                  <span className="ml-1 font-sans text-base text-muted-foreground">/ 100</span>
                </p>
              </div>
              <Badge
                className={passed
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : "border-destructive/30 bg-destructive/10 text-destructive"}
                variant="outline"
              >
                {passed ? "PASSED · ≥35" : "BELOW THRESHOLD"}
              </Badge>
            </div>
            <Progress value={report.feasibilityScore} className="mt-3 h-2 bg-gold/10" />

            {/* Score breakdown */}
            <div className="mt-4 grid gap-2">
              <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Step breakdown
              </p>
              {Object.entries(report.stepBreakdown).map(([key, step]) => (
                <div key={key} className="rounded-lg border border-gold/10 bg-background/40">
                  <button
                    type="button"
                    onClick={() => setExpandedStep(expandedStep === key ? null : key)}
                    className="flex w-full items-center justify-between px-3 py-2"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        step.status === "PASS" || step.status === "CLEAN" ? "bg-emerald-400" :
                        step.status === "FAIL" ? "bg-destructive" : "bg-gold"
                      }`} />
                      <span className="font-sans text-xs font-medium text-foreground">{step.name}</span>
                      {typeof step.score === "number" && (
                        <span className="font-mono text-[11px] text-gold-light">{step.score}</span>
                      )}
                    </span>
                    {expandedStep === key ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {expandedStep === key && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="px-3 pb-2 font-sans text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Score composition */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-gold/10 bg-background/40 p-3">
                <p className="font-mono text-xs uppercase text-muted-foreground">Raw mandatory</p>
                <p className="font-serif text-lg font-semibold text-foreground">{report.rawMandatoryScore}</p>
              </div>
              <div className="rounded-lg border border-gold/10 bg-background/40 p-3">
                <p className="font-mono text-xs uppercase text-muted-foreground">Optional bonus</p>
                <p className="font-serif text-lg font-semibold text-emerald-300">+{report.optionalBonus}</p>
              </div>
              <div className="rounded-lg border border-gold/10 bg-background/40 p-3">
                <p className="font-mono text-xs uppercase text-muted-foreground">Sanity adjustment</p>
                <p className={`font-serif text-lg font-semibold ${report.sanityAdjustment >= 0 ? "text-emerald-300" : "text-destructive"}`}>
                  {report.sanityAdjustment >= 0 ? "+" : ""}{report.sanityAdjustment}
                </p>
              </div>
              {report.tierDViabilityScore !== null && (
                <div className="rounded-lg border border-gold/10 bg-background/40 p-3">
                  <p className="font-mono text-xs uppercase text-muted-foreground">Tier D viability</p>
                  <p className="font-serif text-lg font-semibold text-foreground">{report.tierDViabilityScore}</p>
                </div>
              )}
            </div>

            {/* Red flags */}
            {report.redFlags.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
                <p className="flex items-center gap-1.5 font-sans text-xs font-medium text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> Red flags ({report.redFlags.length})
                </p>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {report.redFlags.map((flag, i) => (
                    <li key={i} className="font-sans text-[11px] text-amber-200/80">• {flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Remediation plan */}
            {report.remediationPlan && report.remediationPlan.length > 0 && (
              <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="font-sans text-xs font-medium text-destructive">Remediation plan</p>
                <ol className="mt-1.5 flex list-decimal flex-col gap-1 pl-4">
                  {report.remediationPlan.map((step, i) => (
                    <li key={i} className="font-sans text-[11px] text-foreground/80">{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Audit trail */}
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-gold/10 bg-background/40 p-3">
              <FileText className="h-3.5 w-3.5 shrink-0 text-gold/70" />
              <span className="font-sans text-[11px] text-muted-foreground">
                Constitutional Evaluation Report — ID{" "}
                <span className="font-mono text-gold-light">{report.evaluationId}</span>
                {" · "}signed by CRE{" · "}sealed on immutable ledger
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
