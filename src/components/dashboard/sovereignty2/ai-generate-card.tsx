"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Wrapper around an AI-generate button + the (initially hidden) AI response card.
 * Handles loading + error states uniformly across all sovereignty2 pages.
 */
export function AiGenerateCard({
  title,
  description,
  buttonLabel,
  isGenerating,
  hasContent,
  onGenerate,
  children,
  buttonDisabled,
  disabledReason,
  className,
}: {
  title: string;
  description?: string;
  buttonLabel: string;
  isGenerating: boolean;
  hasContent: boolean;
  onGenerate: () => void;
  children: React.ReactNode;
  buttonDisabled?: boolean;
  disabledReason?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gold/12 glass-gold p-5 sm:p-6",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/8 blur-3xl" />
      <div className="relative flex flex-col gap-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-serif text-lg font-semibold sm:text-xl">{title}</h2>
            {description && (
              <p className="mt-1 max-w-2xl font-sans text-[12px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || buttonDisabled}
            aria-busy={isGenerating}
            className={cn(
              "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 font-sans text-[13px] font-semibold text-black shadow-[0_8px_30px_-6px_rgba(212,175,55,0.5)] transition-all hover:shadow-[0_10px_38px_-6px_rgba(212,175,55,0.7)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            )}
            title={disabledReason}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating ? "Generating…" : buttonLabel}
          </button>
        </header>

        {disabledReason && buttonDisabled && !hasContent && (
          <p className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2 font-mono text-xs leading-relaxed text-amber-200/80">
            <AlertTriangle className="mr-1.5 inline h-3 w-3 align-text-bottom" />
            {disabledReason}
          </p>
        )}

        <AnimatePresence mode="wait">
          {hasContent ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          ) : (
            !isGenerating && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-dashed border-gold/15 bg-foreground/[0.02] px-5 py-10 text-center"
              >
                <p className="font-serif text-sm font-medium text-muted-foreground">
                  No {title.toLowerCase()} generated yet.
                </p>
                <p className="mt-1 font-sans text-[11px] text-muted-foreground/85">
                  Press <span className="font-mono text-gold-light">{buttonLabel}</span> to assemble a
                  constitutional-grade response.
                </p>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/** Rendered markdown-ish AI text content (preserves paragraphs + bullet lists). */
export function AiContent({ content }: { content: string }) {
  const blocks = React.useMemo(() => splitBlocks(content), [content]);
  return (
    <article className="rounded-xl border border-gold/10 bg-background/40 p-5 font-sans text-[13px] leading-relaxed text-foreground/90">
      {blocks.map((b, i) => {
        if (b.kind === "h") {
          return (
            <h3 key={i} className="mb-2 mt-4 font-serif text-base font-semibold text-gold-light first:mt-0">
              {b.text}
            </h3>
          );
        }
        if (b.kind === "ul") {
          return (
            <ul key={i} className="mb-3 ml-4 flex list-disc flex-col gap-1.5">
              {b.items.map((it, j) => (
                <li key={j} className="leading-relaxed">
                  {renderInline(it)}
                </li>
              ))}
            </ul>
          );
        }
        if (b.kind === "ol") {
          return (
            <ol key={i} className="mb-3 ml-4 flex list-decimal flex-col gap-1.5">
              {b.items.map((it, j) => (
                <li key={j} className="leading-relaxed">
                  {renderInline(it)}
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i} className="mb-3 last:mb-0">
            {renderInline(b.text)}
          </p>
        );
      })}
    </article>
  );
}

function renderInline(text: string): React.ReactNode {
  // Highlight **bold** and `code` spans
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-gold/12 px-1 py-0.5 font-mono text-[11px] text-gold-light"
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

function splitBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: "p", text: para.join(" ").trim() });
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      flushList();
      blocks.push({ kind: "h", text: h[2] });
      continue;
    }
    const ul = /^[-•*]\s+(.*)$/.exec(line);
    const ol = /^\d+[.)]\s+(.*)$/.exec(line);
    if (ul) {
      flushPara();
      if (!list || list.kind !== "ul") {
        flushList();
        list = { kind: "ul", items: [] };
      }
      list.items.push(ul[1]);
      continue;
    }
    if (ol) {
      flushPara();
      if (!list || list.kind !== "ol") {
        flushList();
        list = { kind: "ol", items: [] };
      }
      list.items.push(ol[1]);
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return blocks;
}
