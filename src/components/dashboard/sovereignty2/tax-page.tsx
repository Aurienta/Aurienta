"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Clock,
  AlertTriangle,
  Receipt,
  FileCheck,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnterpriseSelector, type EnterpriseOption } from "./enterprise-selector";
import { AiContent } from "./ai-generate-card";
import { useAiEndpoint } from "./use-ai-endpoint";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { egp, timeAgo } from "@/lib/aurienta/format";

type TaxResponse = {
  content: string;
  generatedAt: string;
  annualRevenue: number;
  annualProfit: number;
};

export type TaxPageProps = {
  enterprises: EnterpriseOption[];
  initialEnterpriseId: string | null;
};

export function TaxPage({ enterprises, initialEnterpriseId }: TaxPageProps) {
  const [enterpriseId, setEnterpriseId] = React.useState<string>(initialEnterpriseId ?? "");
  const { run, isLoading, data, error } = useAiEndpoint<{ enterpriseId: string }, TaxResponse>(
    "/api/ai/tax"
  );

  const onGenerate = async () => {
    if (!enterpriseId) {
      toast.error("Select an enterprise first");
      return;
    }
    const res = await run({ enterpriseId });
    if (res) {
      toast.success("Tax surface generated", {
        description: "Each suggestion is advisory — accountant must confirm.",
      });
    } else {
      toast.error("Optimizer unavailable", { description: error ?? undefined });
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
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Enterprise
            </label>
            <EnterpriseSelector
              options={enterprises}
              value={enterpriseId}
              onChange={setEnterpriseId}
              ariaLabel="Select enterprise for tax optimization"
            />
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={isLoading || !enterpriseId}
            aria-busy={isLoading}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 font-sans text-[13px] font-semibold text-black shadow-[0_8px_30px_-6px_rgba(212,175,55,0.5)] transition-all hover:shadow-[0_10px_38px_-6px_rgba(212,175,55,0.7)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Sparkles className="h-4 w-4" />
            {isLoading ? "Analyzing…" : "Analyze tax surface"}
          </button>
        </div>
      </div>

      {/* Current tax status (mock) */}
      <section className="grid gap-3 sm:grid-cols-3">
        <TaxStatusCard
          icon={Receipt}
          label="VAT filings"
          status="Current"
          detail="Form 10 filed monthly · next due 25 Mar"
          tone="good"
        />
        <TaxStatusCard
          icon={FileCheck}
          label="Form 41 (corporate income tax)"
          status="Filed Q2"
          detail="Filed by Delta Audit · 2025-Q2 return"
          tone="good"
        />
        <TaxStatusCard
          icon={Building2}
          label="Withholding tax"
          status="Remitted"
          detail="Art. 59 WHT · monthly remittance on file"
          tone="good"
        />
      </section>

      <AnimatePresence>
        {data && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative overflow-hidden rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/8 blur-3xl" />
            <div className="relative flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/8 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold/80">
                  <Sparkles className="h-3 w-3" /> Tax Optimizer · glm-4.6
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground/85">
                  <Clock className="h-3 w-3" /> {timeAgo(new Date(data.generatedAt))}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-xl border border-gold/10 bg-foreground/[0.02] px-4 py-3 font-mono text-xs text-muted-foreground/80">
                <span>Annual revenue (run-rate): <span className="text-gold-light">{egp(data.annualRevenue, { compact: true })}</span></span>
                <span>Est. annual profit: <span className="text-gold-light">{egp(data.annualProfit, { compact: true })}</span></span>
              </div>

              <AiContent content={data.content} />

              <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-4 py-3">
                <p className="font-mono text-xs leading-relaxed text-amber-200/85">
                  <ShieldCheck className="mr-1.5 inline h-3 w-3 align-text-bottom" />
                  Every suggestion is advisory and must be confirmed by the independent accountant.
                  AURIENTA does not provide tax advice — it surfaces legal optimizations.
                </p>
              </div>

              <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/85">
                Persisted as an AiArtifact (kind: tax_suggestion). Each suggestion CRE-validated
                against the No-Speculation rule.
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {error && (
        <div className="rounded-xl border border-red-400/25 bg-red-400/[0.05] px-4 py-3 text-[12px] text-red-300">
          <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5 align-text-bottom" />
          {error}
        </div>
      )}
    </div>
  );
}

function TaxStatusCard({
  icon: Icon,
  label,
  status,
  detail,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  status: string;
  detail: string;
  tone: "good" | "warn" | "bad";
}) {
  const cls =
    tone === "good"
      ? "border-emerald-400/20 bg-emerald-400/[0.04]"
      : tone === "warn"
      ? "border-amber-400/25 bg-amber-400/[0.05]"
      : "border-red-400/25 bg-red-400/[0.05]";
  return (
    <div className={cn("rounded-xl border p-4", cls)}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-gold/70" />
      </div>
      <p className="mt-2 font-serif text-base font-semibold text-foreground">{status}</p>
      <p className="mt-0.5 font-mono text-xs text-muted-foreground/85">{detail}</p>
    </div>
  );
}
