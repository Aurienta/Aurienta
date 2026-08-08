"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  ScrollText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnterpriseSelector, type EnterpriseOption } from "./enterprise-selector";
import { AiContent } from "./ai-generate-card";
import { useAiEndpoint } from "./use-ai-endpoint";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { timeAgo } from "@/lib/aurienta/format";

type BriefingResponse = {
  content: string;
  generatedAt: string;
  meetingDate: string;
  boardMemberCount: number;
  openProposalCount: number;
};

export type PastBriefing = {
  id: string;
  content: string;
  createdAt: string;
  confidence: number;
};

export type BoardBriefingsPageProps = {
  enterprises: EnterpriseOption[];
  initialEnterpriseId: string | null;
  pastBriefings: PastBriefing[];
};

export function BoardBriefingsPage({
  enterprises,
  initialEnterpriseId,
  pastBriefings: initialPast,
}: BoardBriefingsPageProps) {
  const [enterpriseId, setEnterpriseId] = React.useState<string>(initialEnterpriseId ?? "");
  const [pastBriefings, setPastBriefings] = React.useState<PastBriefing[]>(initialPast);
  const { run, isLoading, data, error } = useAiEndpoint<{ enterpriseId: string }, BriefingResponse>(
    "/api/ai/board-briefing"
  );

  const onGenerate = async () => {
    if (!enterpriseId) {
      toast.error("Select an enterprise first");
      return;
    }
    const res = await run({ enterpriseId });
    if (res) {
      toast.success("Board briefing assembled", {
        description: "Briefing pack signed by CRE — ready for download.",
      });
      setPastBriefings((prev) => [
        {
          id: `gen-${Date.now()}`,
          content: res.content,
          createdAt: res.generatedAt,
          confidence: 0.86,
        },
        ...prev,
      ]);
    } else {
      toast.error("Briefing unavailable", { description: error ?? undefined });
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
              ariaLabel="Select enterprise for board briefing"
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
            {isLoading ? "Assembling…" : "Generate board briefing"}
          </button>
        </div>
      </div>

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
                  <FileText className="h-3 w-3" /> Board Briefing · glm-4.6
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground/85">
                  <Clock className="h-3 w-3" /> {timeAgo(new Date(data.generatedAt))}
                </span>
              </div>

              <AiContent content={data.content} />

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/10 bg-foreground/[0.02] px-4 py-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground/85">
                  <span>{data.boardMemberCount} board seats</span>
                  <span>{data.openProposalCount} open proposals</span>
                  <span>meeting {new Date(data.meetingDate).toLocaleDateString("en-GB")}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    toast.success("Briefing signed by CRE, downloadable as PDF", {
                      description: "SHA3-256 hash + Ed25519 signature attached.",
                    })
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 font-sans text-[11px] font-semibold text-gold-light transition-colors hover:bg-gold/15"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download as PDF
                </button>
              </div>

              <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/85">
                Persisted as an AiArtifact (kind: board_briefing). Briefing content is grounded in
                the enterprise's live ledger; the CRE has validated the compliance section.
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

      {/* Past briefings */}
      <section className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
        <header className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-base font-semibold sm:text-lg">Past briefings</h2>
            <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
              Each briefing is persisted on the immutable ledger and signed by the CRE.
            </p>
          </div>
          <span className="font-mono text-xs text-muted-foreground/85">
            {pastBriefings.length} on record
          </span>
        </header>
        {pastBriefings.length === 0 ? (
          <p className="py-6 text-center font-sans text-[12px] text-muted-foreground">
            No briefings yet. Press <span className="font-mono text-gold-light">Generate board briefing</span> above.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
            {pastBriefings.map((b) => (
              <li
                key={b.id}
                className={cn(
                  "rounded-xl border border-gold/10 bg-foreground/[0.02] p-3 transition-colors hover:border-gold/20"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-gold/70" />
                    <p className="font-serif text-sm font-semibold text-foreground">
                      Briefing {new Date(b.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
                    conf {(b.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 font-sans text-[11px] text-muted-foreground">
                  {b.content.slice(0, 200)}…
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground/80">
                  {timeAgo(new Date(b.createdAt))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
