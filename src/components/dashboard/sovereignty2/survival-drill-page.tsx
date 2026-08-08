"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Check,
  X,
  AlertTriangle,
  Clock,
  Award,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnterpriseSelector, type EnterpriseOption } from "./enterprise-selector";
import { AiContent } from "./ai-generate-card";
import { useAiEndpoint } from "./use-ai-endpoint";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { timeAgo } from "@/lib/aurienta/format";

type Finding = {
  key: string;
  name: string;
  detail: string;
  verdict: "PASS" | "FAIL" | "WARNING";
  finding: string;
};

type DrillRecord = {
  id: string;
  result: "passed" | "failed" | "warning";
  passedCount: number;
  totalCount: number;
  certificateExpiry: string | null;
  drillDate: string;
  findings: Finding[];
};

type DrillResponse = {
  content: string;
  drill: DrillRecord;
  generatedAt: string;
};

export type PastDrill = {
  id: string;
  result: string;
  drillDate: string;
  certificateExpiry: string | null;
  findings: string;
};

export type SurvivalDrillPageProps = {
  enterprises: EnterpriseOption[];
  initialEnterpriseId: string | null;
  pastDrills: PastDrill[];
  activeCertificate: { expiry: string; drillDate: string } | null;
};

export function SurvivalDrillPage({
  enterprises,
  initialEnterpriseId,
  pastDrills: initialPastDrills,
  activeCertificate,
}: SurvivalDrillPageProps) {
  const [enterpriseId, setEnterpriseId] = React.useState<string>(initialEnterpriseId ?? "");
  const [pastDrills, setPastDrills] = React.useState<PastDrill[]>(initialPastDrills);
  const { run, isLoading, data, error } = useAiEndpoint<{ enterpriseId: string }, DrillResponse>(
    "/api/ai/survival-drill"
  );

  const onGenerate = async () => {
    if (!enterpriseId) {
      toast.error("Select an enterprise first");
      return;
    }
    const res = await run({ enterpriseId });
    if (res) {
      toast.success("Survival drill complete", {
        description:
          res.drill.result === "passed"
            ? "Sovereign Survivability Certificate issued (1 year)."
            : res.drill.result === "warning"
            ? "Drill completed with warnings — certificate withheld."
            : "Drill failed — remediate findings and re-run.",
      });
      // Prepend the new drill to the past list.
      setPastDrills((prev) => [
        {
          id: res.drill.id,
          result: res.drill.result,
          drillDate: res.drill.drillDate,
          certificateExpiry: res.drill.certificateExpiry,
          findings: JSON.stringify(res.drill.findings),
        },
        ...prev,
      ]);
    } else {
      toast.error("Drill unavailable", { description: error ?? undefined });
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
          Graduated enterprise
        </label>
        <EnterpriseSelector
          options={enterprises}
          value={enterpriseId}
          onChange={setEnterpriseId}
          emptyLabel="No graduated enterprises"
          ariaLabel="Select enterprise for survival drill"
        />
      </div>

      {/* Sovereign Survivability Certificate */}
      {activeCertificate && (
        <CertificateCard
          expiry={activeCertificate.expiry}
          drillDate={activeCertificate.drillDate}
        />
      )}

      {/* Run drill */}
      <section className="relative overflow-hidden rounded-2xl border border-gold/12 glass-gold p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/8 blur-3xl" />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-serif text-lg font-semibold sm:text-xl">Run Survival Drill</h2>
              <p className="mt-1 max-w-2xl font-sans text-[12px] leading-relaxed text-muted-foreground">
                A quarterly drill that simulates a 7-day AURIENTA platform outage. Tests:
                self-hosted CRE availability, paper-ballot governance, offline ledger
                reconciliation, emergency board protocol, treasury continuity. Pass = 1-year
                Sovereign Survivability Certificate.
              </p>
            </div>
            <button
              type="button"
              onClick={onGenerate}
              disabled={isLoading || !enterpriseId}
              aria-busy={isLoading}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 font-sans text-[13px] font-semibold text-black shadow-[0_8px_30px_-6px_rgba(212,175,55,0.5)] transition-all hover:shadow-[0_10px_38px_-6px_rgba(212,175,55,0.7)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Play className="h-4 w-4" />
              {isLoading ? "Running drill…" : "Run survival drill"}
            </button>
          </div>

          {data && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <DrillVerdictBanner drill={data.drill} />

              <div>
                <h3 className="mb-3 font-serif text-base font-semibold">Test Findings</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {data.drill.findings.map((f) => (
                    <FindingRow key={f.key} finding={f} />
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-serif text-base font-semibold">Full Drill Report</h3>
                <AiContent content={data.content} />
              </div>

              <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/85">
                Drill persisted as a SurvivalDrill record + an AiArtifact (kind: survival_drill) +
                a `survival_drill` CRE ledger event with hash-chained Ed25519 token.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-400/25 bg-red-400/[0.05] px-4 py-3 text-[12px] text-red-300">
          <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5 align-text-bottom" />
          {error}
        </div>
      )}

      {/* Past drills */}
      <section className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
        <header className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-serif text-base font-semibold sm:text-lg">Past Drills</h2>
          <span className="font-mono text-xs text-muted-foreground/85">
            {pastDrills.length} on record
          </span>
        </header>
        {pastDrills.length === 0 ? (
          <p className="py-6 text-center font-sans text-[12px] text-muted-foreground">
            No drills have been run yet. Press <span className="font-mono text-gold-light">Run survival drill</span> above to begin.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
            {pastDrills.map((d) => (
              <PastDrillRow key={d.id} drill={d} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CertificateCard({ expiry, drillDate }: { expiry: string; drillDate: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.04] p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10">
            <Award className="h-6 w-6 text-emerald-300" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-200/80">
              Sovereign Survivability Certificate
            </p>
            <h3 className="mt-1 font-serif text-xl font-semibold text-foreground">
              Valid · expires {new Date(expiry).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </h3>
            <p className="mt-1 font-sans text-[12px] text-muted-foreground">
              Last drill {timeAgo(new Date(drillDate))} · quarterly re-test required.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" /> Sovereign-grade
        </span>
      </div>
    </motion.section>
  );
}

function DrillVerdictBanner({ drill }: { drill: DrillRecord }) {
  const meta =
    drill.result === "passed"
      ? {
          icon: ShieldCheck,
          label: "PASSED",
          tone: "border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-200",
          note: "Sovereign Survivability Certificate issued — valid for 1 year.",
        }
      : drill.result === "warning"
      ? {
          icon: ShieldAlert,
          label: "WARNING",
          tone: "border-amber-400/30 bg-amber-400/[0.06] text-amber-200",
          note: "Drill completed with warnings — certificate withheld until remediation.",
        }
      : {
          icon: ShieldX,
          label: "FAILED",
          tone: "border-red-400/30 bg-red-400/[0.06] text-red-200",
          note: "Drill failed — remediate findings and re-run within 30 days.",
        };
  const Icon = meta.icon;
  return (
    <div className={cn("rounded-xl border px-4 py-3", meta.tone)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6" />
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] opacity-80">
              Drill Result
            </p>
            <p className="font-serif text-2xl font-semibold">{meta.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[11px]">
            {drill.passedCount}/{drill.totalCount} tests passed
          </p>
          <p className="font-mono text-xs opacity-80">168 hours simulated</p>
        </div>
      </div>
      <p className="mt-2 font-sans text-[12px] opacity-90">{meta.note}</p>
    </div>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  const meta =
    finding.verdict === "PASS"
      ? { icon: Check, tone: "border-emerald-400/20 bg-emerald-400/[0.04]", color: "text-emerald-300" }
      : finding.verdict === "FAIL"
      ? { icon: X, tone: "border-red-400/20 bg-red-400/[0.04]", color: "text-red-300" }
      : { icon: AlertTriangle, tone: "border-amber-400/20 bg-amber-400/[0.04]", color: "text-amber-300" };
  const Icon = meta.icon;
  return (
    <li className={cn("flex items-start gap-2.5 rounded-lg border p-3", meta.tone)}>
      <span
        className={cn(
          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/[0.05]",
          meta.color
        )}
      >
        <Icon className="h-3 w-3" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-sans text-[12px] font-semibold text-foreground">
          {finding.name}
          <span className={cn("ml-2 font-mono text-xs", meta.color)}>{finding.verdict}</span>
        </p>
        <p className="mt-0.5 font-sans text-[11px] leading-relaxed text-muted-foreground">
          {finding.finding}
        </p>
      </div>
    </li>
  );
}

function PastDrillRow({ drill }: { drill: PastDrill }) {
  const meta =
    drill.result === "passed"
      ? { icon: ShieldCheck, label: "Passed", tone: "text-emerald-300" }
      : drill.result === "warning"
      ? { icon: ShieldAlert, label: "Warning", tone: "text-amber-300" }
      : { icon: ShieldX, label: "Failed", tone: "text-red-300" };
  const Icon = meta.icon;
  let findings: Finding[] = [];
  try {
    findings = JSON.parse(drill.findings);
  } catch {
    findings = [];
  }
  const passed = findings.filter((f) => f.verdict === "PASS").length;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-gold/10 bg-foreground/[0.02] p-3">
      <Icon className={cn("h-5 w-5 shrink-0", meta.tone)} />
      <div className="min-w-0 flex-1">
        <p className="font-sans text-[12px] font-medium text-foreground">
          {meta.label}
          {findings.length > 0 && (
            <span className="ml-2 font-mono text-xs text-muted-foreground/85">
              {passed}/{findings.length} tests passed
            </span>
          )}
        </p>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
          {new Date(drill.drillDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          {drill.certificateExpiry
            ? ` · cert valid until ${new Date(drill.certificateExpiry).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
            : ""}
        </p>
      </div>
      <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/75" />
    </li>
  );
}
