"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Bot, User as UserIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string; // ISO
};

const SUGGESTED_PROMPTS = [
  "Can I approve 150,000 EGP for marketing?",
  "What's my portfolio concentration by sector?",
  "Explain the graduation gates.",
  "Is my police clearance valid?",
  "Show recent CRE decisions on my enterprises.",
  "What's the difference between Tier C and Tier D?",
];

export function CopilotChat({ history }: { history: ChatMessage[] }) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(history);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to the latest message when messages change.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);

    const userMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "request failed");
      }
      const reply: string = data?.reply ?? "No reply.";
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      // error handled by toast
      setError("The CRE could not sign this response. Please retry — your ledger is intact.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <section
      aria-label="Constitutional Copilot chat"
      className="flex h-[calc(100vh-13rem)] min-h-[34rem] flex-col overflow-hidden rounded-2xl border border-gold/15 glass-gold"
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-gold/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
            <Bot className="h-4 w-4 text-gold" />
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]"
            />
          </span>
          <div>
            <p className="font-serif text-sm font-semibold leading-tight">Constitutional Copilot</p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
              grounded in the immutable ledger
            </p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold/70 sm:inline-flex">
          <Sparkles className="h-3 w-3" /> CRE-sealed
        </span>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Copilot conversation"
        className="flex-1 overflow-y-auto px-3 py-4 sm:px-5"
      >
        {messages.length === 0 ? (
          <EmptyState onPick={send} />
        ) : (
          <ul className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "assistant" && (
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
                      <Bot className="h-3.5 w-3.5 text-gold" />
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                      m.role === "user"
                        ? "bg-gold-gradient text-black shadow-[0_8px_24px_-8px_rgba(212,175,55,0.6)]"
                        : "border border-gold/15 bg-background/60 text-foreground/90 backdrop-blur-sm"
                    )}
                  >
                    <p className="whitespace-pre-wrap font-sans">{m.content}</p>
                    <p
                      className={cn(
                        "mt-1.5 font-mono text-[11px] uppercase tracking-wider",
                        m.role === "user" ? "text-black/60" : "text-muted-foreground/80"
                      )}
                    >
                      {new Date(m.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      {m.role === "assistant" ? " · CRE-sealed" : ""}
                    </p>
                  </div>
                  {m.role === "user" && (
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
                      <UserIcon className="h-3.5 w-3.5 text-gold-light" />
                    </span>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
            {sending && (
              <li className="flex gap-2.5">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
                  <Bot className="h-3.5 w-3.5 text-gold" />
                </span>
                <div className="max-w-[78%] rounded-2xl border border-gold/15 bg-background/60 px-3.5 py-2.5">
                  <TypingDots />
                </div>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Suggested prompts */}
      {messages.length > 0 && (
        <div className="border-t border-gold/8 px-3 py-2 sm:px-5">
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.slice(0, 3).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => void send(p)}
                disabled={sending}
                className="rounded-full border border-gold/15 bg-gold/[0.04] px-2.5 py-1 font-sans text-[11px] text-muted-foreground transition-colors hover:border-gold/30 hover:text-foreground disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error strip */}
      {error && (
        <div className="flex items-center gap-2 border-t border-red-400/20 bg-red-400/[0.06] px-4 py-2 font-sans text-[11px] text-red-300">
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 border-t border-gold/12 bg-background/40 p-3 sm:px-4 sm:py-3.5"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          aria-label="Ask the Constitutional Copilot"
          placeholder="Ask about expenses, gates, portfolio, CRE decisions…"
          className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl border border-gold/15 bg-background/60 px-3.5 py-2.5 font-sans text-[13px] text-foreground placeholder:text-muted-foreground/80 focus:border-gold/35 focus:outline-none focus:ring-1 focus:ring-gold/30"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          aria-label="Send message"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-black shadow-[0_6px_22px_-6px_rgba(212,175,55,0.55)] transition-all hover:shadow-[0_8px_28px_-6px_rgba(212,175,55,0.75)] disabled:opacity-40 disabled:shadow-none"
        >
          {sending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </section>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-8 text-center">
      <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/25 bg-gold/5">
        <Bot className="h-6 w-6 text-gold" />
        <span
          aria-hidden
          className="absolute inset-0 rounded-2xl border border-gold/20 animate-pulse"
        />
      </span>
      <h3 className="mt-4 font-serif text-lg font-semibold">Constitutional Copilot</h3>
      <p className="mt-1.5 max-w-md font-sans text-[12px] leading-relaxed text-muted-foreground">
        Deterministic answers grounded in your immutable ledger, your shareholdings, and the
        constitutional rules the CRE enforces. Ask anything — nothing here executes; high-risk
        actions always route back to the relevant workspace.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p)}
            className="rounded-full border border-gold/15 bg-gold/[0.04] px-3 py-1.5 font-sans text-[11px] text-muted-foreground transition-colors hover:border-gold/35 hover:text-foreground"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="assistant typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-gold/70"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}
