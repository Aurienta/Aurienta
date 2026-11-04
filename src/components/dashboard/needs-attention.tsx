"use client";

/**
 * NeedsAttention — COO-FIX-2: Surface urgent/actionable items at the TOP of
 * the dashboard so users immediately see what needs their attention.
 *
 * Pulls from: urgent tasks, unread notifications, expired proposals,
 * pending votes, MFA enrollment gaps.
 *
 * Design principles (COO audit):
 *   - Above the fold, right after the hero
 *   - Color-coded by urgency (red=urgent, amber=soon, blue=info)
 *   - One-click action (each item links to the relevant page)
 *   - Collapsible for returning users who have seen it
 */

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Vote,
  ShieldAlert,
  Bell,
  CheckCircle2,
  ChevronDown,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AttentionItem = {
  id: string;
  kind: "urgent" | "soon" | "info";
  category: "task" | "vote" | "notification" | "security" | "proposal";
  title: string;
  description?: string;
  href: string;
  dueIn?: string;
};

const KIND_STYLES: Record<
  AttentionItem["kind"],
  { bg: string; border: string; icon: string; label: string }
> = {
  urgent: {
    bg: "bg-red-500/[0.06]",
    border: "border-red-500/25",
    icon: "text-red-500",
    label: "Urgent",
  },
  soon: {
    bg: "bg-amber-500/[0.06]",
    border: "border-amber-500/25",
    icon: "text-amber-600",
    label: "Due soon",
  },
  info: {
    bg: "bg-blue-500/[0.06]",
    border: "border-blue-500/25",
    icon: "text-blue-600",
    label: "For your attention",
  },
};

const CATEGORY_ICONS: Record<AttentionItem["category"], React.ElementType> = {
  task: CheckCircle2,
  vote: Vote,
  notification: Bell,
  security: ShieldAlert,
  proposal: Vote,
};

export function NeedsAttention({ items }: { items: AttentionItem[] }) {
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = React.useState(false);

  // Persist dismissal in sessionStorage so it survives navigation but resets
  // on a new session (so users see fresh items the next day).
  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem("aurienta_attention_dismissed");
      if (stored) setDismissed(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      sessionStorage.setItem(
        "aurienta_attention_dismissed",
        JSON.stringify([...next])
      );
    } catch {}
  };

  const visibleItems = items.filter((i) => !dismissed.has(i.id));

  if (visibleItems.length === 0) {
    // Positive empty state — celebrate "all clear"
    return (
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 sm:p-5"
        aria-label="Needs your attention — all clear"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/25">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-serif text-sm font-semibold text-foreground">
              All clear — no urgent actions pending
            </p>
            <p className="font-sans text-xs text-muted-foreground">
              You&apos;re up to date. New tasks and proposals will appear here.
            </p>
          </div>
        </div>
      </motion.section>
    );
  }

  const urgentCount = visibleItems.filter((i) => i.kind === "urgent").length;

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gold/15 glass"
      aria-label={`Needs your attention — ${visibleItems.length} item${visibleItems.length === 1 ? "" : "s"}`}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-3 px-4 py-3 sm:px-5 text-left transition-colors hover:bg-gold/[0.02]"
        aria-expanded={!collapsed}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 border border-gold/25">
          <AlertTriangle className="h-4 w-4 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-sm font-semibold text-foreground">
            Needs your attention
          </p>
          <p className="font-sans text-xs text-muted-foreground">
            {visibleItems.length} item{visibleItems.length === 1 ? "" : "s"}
            {urgentCount > 0 && (
              <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                {urgentCount} urgent
              </span>
            )}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            collapsed && "rotate-180"
          )}
        />
      </button>

      {/* Items list */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gold/10"
          >
            <ul className="divide-y divide-gold/[0.06]">
              {visibleItems.slice(0, 5).map((item) => {
                const style = KIND_STYLES[item.kind];
                const CatIcon = CATEGORY_ICONS[item.category];
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="group flex items-start gap-3 px-4 py-3 sm:px-5 transition-colors hover:bg-gold/[0.03]"
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                          style.bg,
                          style.border
                        )}
                      >
                        <CatIcon className={cn("h-3.5 w-3.5", style.icon)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-sans text-sm font-medium text-foreground">
                            {item.title}
                          </p>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                              style.bg,
                              style.icon
                            )}
                          >
                            {style.label}
                          </span>
                        </div>
                        {item.description && (
                          <p className="mt-0.5 line-clamp-1 font-sans text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        {item.dueIn && (
                          <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-muted-foreground/80">
                            <Clock className="h-2.5 w-2.5" />
                            {item.dueIn}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:text-gold group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            {visibleItems.length > 5 && (
              <div className="border-t border-gold/[0.06] px-4 py-2 sm:px-5">
                <p className="font-sans text-[11px] text-muted-foreground/70">
                  +{visibleItems.length - 5} more — see all in your{" "}
                  <Link href="/dashboard/notifications" className="text-gold hover:text-gold-light underline">
                    notifications
                  </Link>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
