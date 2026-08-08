"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Clock,
  AlertTriangle,
  Sparkles,
  Quote,
  FileText,
  Users,
  ScrollText,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EnterpriseSelector, type EnterpriseOption } from "./enterprise-selector";
import { AiContent } from "./ai-generate-card";
import { useAiEndpoint } from "./use-ai-endpoint";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { timeAgo } from "@/lib/aurienta/format";

type Source = { type: string; description: string; ref?: string };

type IrResponse = {
  id: string;
  question: string;
  answer: string;
  sources: Source[];
  createdAt: string;
};

export type PastIrQuestion = {
  id: string;
  question: string;
  answer: string | null;
  sources: string;
  status: string;
  createdAt: string;
};

export type IrPageProps = {
  enterprises: EnterpriseOption[];
  initialEnterpriseId: string | null;
  pastQuestions: PastIrQuestion[];
};

const SUGGESTED_QUESTIONS = [
  "What's the current CPP?",
  "Show recent dividend history",
  "What's the graduation readiness?",
  "Who are the board members?",
  "What was Q3 revenue vs guidance?",
];

const SOURCE_ICON: Record<string, React.ElementType> = {
  "Ledger event": ScrollText,
  "Valuation record": TrendingUp,
  "Board roster": Users,
  "Financial summary": FileText,
  "Compliance status": GraduationCap,
};

export function IrPage({
  enterprises,
  initialEnterpriseId,
  pastQuestions: initialPast,
}: IrPageProps) {
  const [enterpriseId, setEnterpriseId] = React.useState<string>(initialEnterpriseId ?? "");
  const [question, setQuestion] = React.useState("");
  const [pastQuestions, setPastQuestions] = React.useState<PastIrQuestion[]>(initialPast);
  const { run, isLoading, data, error } = useAiEndpoint<
    { enterpriseId: string; question: string },
    IrResponse
  >("/api/ai/ir");

  const onSubmit = async (q?: string) => {
    const text = (q ?? question).trim();
    if (!enterpriseId) {
      toast.error("Select an enterprise first");
      return;
    }
    if (!text) {
      toast.error("Type a question first");
      return;
    }
    const res = await run({ enterpriseId, question: text });
    if (res) {
      toast.success("Answer grounded in public disclosures", {
        description: "Q&A persisted as an IrQuestion on the ledger.",
      });
      setQuestion("");
      setPastQuestions((prev) => [
        {
          id: res.id,
          question: res.question,
          answer: res.answer,
          sources: JSON.stringify(res.sources),
          status: "answered",
          createdAt: res.createdAt,
        },
        ...prev,
      ]);
    } else {
      toast.error("IR assistant unavailable", { description: error ?? undefined });
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
          Graduated enterprise (sovereign JSC)
        </label>
        <EnterpriseSelector
          options={enterprises}
          value={enterpriseId}
          onChange={setEnterpriseId}
          emptyLabel="No graduated enterprises"
          ariaLabel="Select enterprise for IR Q&A"
        />
      </div>

      {/* Question box */}
      <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
        <div className="pointer-events-none absolute" />
        <label className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-gold-light/80">
          Ask the IR assistant
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSubmit();
              }
            }}
            rows={3}
            placeholder="Ask about SmartFarm's performance, governance, or financials…"
            className="min-h-[88px] flex-1 resize-none rounded-xl border border-gold/20 bg-background/60 px-4 py-3 font-sans text-[13px] text-foreground placeholder:text-muted-foreground/80 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/30"
          />
          <button
            type="button"
            onClick={() => onSubmit()}
            disabled={isLoading || !enterpriseId || !question.trim()}
            aria-busy={isLoading}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 font-sans text-[13px] font-semibold text-black shadow-[0_8px_30px_-6px_rgba(212,175,55,0.5)] transition-all hover:shadow-[0_10px_38px_-6px_rgba(212,175,55,0.7)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:self-end"
          >
            <Send className="h-4 w-4" />
            {isLoading ? "Answering…" : "Ask"}
          </button>
        </div>

        {/* Suggested questions */}
        <div className="mt-3">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
            Suggested
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onSubmit(q)}
                disabled={isLoading || !enterpriseId}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-foreground/[0.02] px-3 py-1 font-sans text-[11px] text-foreground/85 transition-colors hover:border-gold/30 hover:bg-gold/8 disabled:opacity-40"
              >
                <Quote className="h-3 w-3 text-gold/60" />
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Latest answer */}
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
                  <Sparkles className="h-3 w-3" /> IR Assistant · glm-4.6
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground/85">
                  <Clock className="h-3 w-3" /> {timeAgo(new Date(data.createdAt))}
                </span>
              </div>

              <div className="rounded-xl border border-gold/15 bg-foreground/[0.02] p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Question
                </p>
                <p className="mt-1 font-serif text-sm font-semibold text-foreground">
                  {data.question}
                </p>
              </div>

              <AiContent content={data.answer} />

              {/* Sources */}
              {data.sources.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Sources
                  </p>
                  <ul className="flex flex-col gap-2">
                    {data.sources.map((s, i) => {
                      const Icon = SOURCE_ICON[s.type] ?? FileText;
                      return (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 rounded-lg border border-gold/10 bg-foreground/[0.02] p-2.5"
                        >
                          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gold/15 bg-gold/8">
                            <Icon className="h-3 w-3 text-gold" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-sans text-[11px] font-semibold text-foreground">
                              {s.type}
                            </p>
                            <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
                              {s.description}
                            </p>
                            {s.ref && (
                              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/80">
                                ref: {s.ref}…
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/85">
                Persisted as an IrQuestion record. Past performance is not indicative of future
                results. Forward-looking projections are out of scope.
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

      {/* Past Q&A */}
      <section className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
        <header className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-base font-semibold sm:text-lg">Past Q&A</h2>
            <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
              Each question is persisted with its answer + grounded source citations.
            </p>
          </div>
          <span className="font-mono text-xs text-muted-foreground/85">
            {pastQuestions.length} on record
          </span>
        </header>
        {pastQuestions.length === 0 ? (
          <p className="py-6 text-center font-sans text-[12px] text-muted-foreground">
            No questions yet. Type a question above to begin.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
            {pastQuestions.map((q) => (
              <li
                key={q.id}
                className={cn(
                  "rounded-xl border border-gold/10 bg-foreground/[0.02] p-3 transition-colors hover:border-gold/20"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-sm font-semibold text-foreground">{q.question}</p>
                    {q.answer && (
                      <p className="mt-1 line-clamp-2 font-sans text-[11px] text-muted-foreground">
                        {q.answer.slice(0, 220)}…
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider",
                      q.status === "answered"
                        ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : "border border-amber-400/30 bg-amber-400/10 text-amber-300"
                    )}
                  >
                    {q.status}
                  </span>
                </div>
                <p className="mt-1.5 font-mono text-[11px] text-muted-foreground/80">
                  {timeAgo(new Date(q.createdAt))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
