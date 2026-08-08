"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Clock,
  AlertTriangle,
  Users,
  Flag,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnterpriseSelector, type EnterpriseOption } from "./enterprise-selector";
import { AiContent } from "./ai-generate-card";
import { useAiEndpoint } from "./use-ai-endpoint";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { timeAgo } from "@/lib/aurienta/format";
import { stsLevel } from "@/lib/aurienta/constants";

type Candidate = {
  id: string;
  legalName: string;
  sts: number;
  tier: string;
  role: string;
  avatarColor: string;
};

type KeyPerson = {
  position: string;
  department: string;
  incumbentName: string;
  incumbentSts: number;
};

type SuccessionResponse = {
  content: string;
  generatedAt: string;
  lastPlanAt: string | null;
  planStaleDays: number | null;
  keyPersonCount: number;
  candidateCount: number;
  keyPeople: KeyPerson[];
  candidates: Candidate[];
};

export type SuccessionPageProps = {
  enterprises: EnterpriseOption[];
  initialEnterpriseId: string | null;
  keyPeople: KeyPerson[];
};

export function SuccessionPage({
  enterprises,
  initialEnterpriseId,
  keyPeople: initialKeyPeople,
}: SuccessionPageProps) {
  const [enterpriseId, setEnterpriseId] = React.useState<string>(initialEnterpriseId ?? "");
  const { run, isLoading, data, error } = useAiEndpoint<{ enterpriseId: string }, SuccessionResponse>(
    "/api/ai/succession"
  );

  const onGenerate = async () => {
    if (!enterpriseId) {
      toast.error("Select an enterprise first");
      return;
    }
    const res = await run({ enterpriseId });
    if (res) {
      toast.success("Succession plan generated", {
        description: "Plan persisted + Ed25519-registered on the immutable ledger.",
      });
    } else {
      toast.error("Planner unavailable", { description: error ?? undefined });
    }
  };

  const isStale =
    (data?.planStaleDays ?? (initialKeyPeople.length > 0 ? 120 : null)) !== null &&
    ((data?.planStaleDays ?? 120) as number) > 90;

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
              ariaLabel="Select enterprise for succession planning"
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
            {isLoading ? "Generating…" : "Generate succession plan"}
          </button>
        </div>
      </div>

      {/* Stale plan banner */}
      {isStale && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.05] px-4 py-3">
          <div className="flex items-start gap-2.5">
            <Flag className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              <p className="font-serif text-sm font-semibold text-amber-200">
                Succession plan is stale
              </p>
              <p className="font-sans text-[12px] text-amber-200/80">
                Last reviewed {data?.planStaleDays ?? 120}+ days ago. The constitution requires
                quarterly review.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              toast.success("Flagged for review", {
                description: "Board notified — succession review added to the next board agenda.",
              })
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 font-sans text-[11px] font-semibold text-amber-200 transition-colors hover:bg-amber-400/15"
          >
            <Flag className="h-3.5 w-3.5" />
            Flag for review
          </button>
        </div>
      )}

      {/* Succession matrix */}
      {initialKeyPeople.length > 0 && (
        <section className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
          <header className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-base font-semibold sm:text-lg">Key-person roles</h2>
          </header>
          <ul className="grid gap-2">
            {initialKeyPeople.map((kp) => {
              const sts = stsLevel(kp.incumbentSts);
              return (
                <li
                  key={kp.position}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/10 bg-foreground/[0.02] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-sm font-semibold text-foreground">{kp.position}</p>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
                      department {kp.department} · incumbent {kp.incumbentName}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-xs"
                    style={{ background: `${sts.color}18`, color: sts.color }}
                  >
                    STS {kp.incumbentSts}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* AI plan output */}
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
                  <Sparkles className="h-3 w-3" /> Succession Planner · glm-4.6
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground/85">
                  <Clock className="h-3 w-3" /> {timeAgo(new Date(data.generatedAt))}
                </span>
              </div>

              {/* Candidate chips */}
              {data.candidates.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Internal candidate pool ({data.candidateCount} total)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.candidates.map((c) => {
                      const sts = stsLevel(c.sts);
                      return (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-2 rounded-full border border-gold/15 bg-foreground/[0.04] py-1 pl-1 pr-3"
                        >
                          <span
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-semibold text-black"
                            style={{
                              background: `linear-gradient(135deg, ${c.avatarColor}, #b8860b)`,
                            }}
                          >
                            {c.legalName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                          </span>
                          <span className="font-sans text-[11px] font-medium text-foreground">
                            {c.legalName}
                          </span>
                          <span
                            className="font-mono text-[11px]"
                            style={{ color: sts.color }}
                          >
                            STS {c.sts}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <AiContent content={data.content} />

              {/* Constitutional note */}
              <div className="rounded-xl border border-gold/15 bg-foreground/[0.02] p-4">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <p className="font-sans text-[12px] leading-relaxed text-foreground/85">
                    <strong className="font-semibold text-foreground">Cryptographic succession.</strong>{" "}
                    Succession paths are registered cryptographically (Ed25519). On verified
                    incapacity of a key person, the CRE transfers voting rights within{" "}
                    <span className="font-mono text-gold-light">1 hour</span>.
                  </p>
                </div>
              </div>

              <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/85">
                Persisted as an AiArtifact (kind: succession_plan). Plan is grounded in the
                enterprise's live member + employee records.
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
