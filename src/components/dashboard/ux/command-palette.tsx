"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command as CommandPrimitive } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CornerDownLeft,
  LayoutDashboard,
  Wallet,
  Compass,
  LineChart,
  Scale,
  Settings2,
  Rocket,
  ShieldCheck,
  GraduationCap,
  Award,
  Bot,
  CalendarDays,
  Bell,
  Hourglass,
  Vote,
  HandCoins,
  CandlestickChart,
  Sparkles,
  ScrollText,
  HelpCircle,
  Coins,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CmdGroup = "Navigation" | "Actions" | "Constitutional queries";

type Command = {
  id: string;
  label: string;
  group: CmdGroup;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  hint?: string;
  keywords?: string;
};

const COMMANDS: Command[] = [
  // ── Navigation ──
  { id: "nav-overview", label: "Go to Overview", group: "Navigation", icon: LayoutDashboard, href: "/dashboard", keywords: "home dashboard main" },
  { id: "nav-portfolio", label: "Go to Portfolio", group: "Navigation", icon: Wallet, href: "/dashboard/portfolio", keywords: "holdings equity ownership value" },
  { id: "nav-opportunities", label: "Go to Opportunities", group: "Navigation", icon: Compass, href: "/dashboard/opportunities", keywords: "invest capital formation reserve" },
  { id: "nav-market", label: "Go to Secondary Market", group: "Navigation", icon: LineChart, href: "/dashboard/market", keywords: "trade buy sell orders" },
  { id: "nav-governance", label: "Go to Governance", group: "Navigation", icon: Scale, href: "/dashboard/governance", keywords: "vote proposals consensus" },
  { id: "nav-manager", label: "Go to Manager Console", group: "Navigation", icon: Settings2, href: "/dashboard/manager", keywords: "manage enterprise expenses payroll" },
  { id: "nav-founder", label: "Go to Founder Studio", group: "Navigation", icon: Rocket, href: "/dashboard/founder", keywords: "found enterprise enterprise" },
  { id: "nav-compliance", label: "Go to Compliance", group: "Navigation", icon: ShieldCheck, href: "/dashboard/compliance", keywords: "fra kyc regulatory" },
  { id: "nav-graduation", label: "Go to Graduation", group: "Navigation", icon: GraduationCap, href: "/dashboard/graduation", keywords: "sovereign exit independence" },
  { id: "nav-alumni", label: "Go to Alumni Hall", group: "Navigation", icon: Award, href: "/dashboard/alumni", keywords: "graduated enterprises" },
  { id: "nav-copilot", label: "Go to AI Copilot", group: "Navigation", icon: Bot, href: "/dashboard/copilot", keywords: "ai assistant chat" },
  { id: "nav-calendar", label: "Go to Constitutional Calendar", group: "Navigation", icon: CalendarDays, href: "/dashboard/calendar", keywords: "schedule timeline dates milestones votes" },
  { id: "nav-notifications", label: "Go to Notifications", group: "Navigation", icon: Bell, href: "/dashboard/notifications", keywords: "inbox triage alerts" },
  { id: "nav-priority-windows", label: "Go to Priority Windows", group: "Navigation", icon: Hourglass, href: "/dashboard/priority-windows", keywords: "pro-rata sell entitlement window" },

  // ── Actions ──
  { id: "act-vote", label: "Vote on open proposals", group: "Actions", icon: Vote, href: "/dashboard/governance", keywords: "cast governance" },
  { id: "act-reserve", label: "Reserve Equity Units", group: "Actions", icon: HandCoins, href: "/dashboard/opportunities", keywords: "invest commit" },
  { id: "act-trade", label: "Place a trade", group: "Actions", icon: CandlestickChart, href: "/dashboard/market", keywords: "buy sell order" },
  { id: "act-graduation", label: "View graduation status", group: "Actions", icon: GraduationCap, href: "/dashboard/graduation", keywords: "sovereign readiness exit" },
  { id: "act-copilot", label: "Ask the AI Copilot", group: "Actions", icon: Sparkles, href: "/dashboard/copilot", keywords: "question assistant" },
  { id: "act-calendar", label: "View constitutional calendar", group: "Actions", icon: CalendarDays, href: "/dashboard/calendar", keywords: "schedule today" },
  { id: "act-triage", label: "Triage notifications with AI", group: "Actions", icon: Bell, href: "/dashboard/notifications", keywords: "priority inbox" },
  { id: "act-windows", label: "View priority windows", group: "Actions", icon: Hourglass, href: "/dashboard/priority-windows", keywords: "pro-rata entitlement" },

  // ── Constitutional queries ──
  { id: "q-portfolio", label: "Explain my portfolio", group: "Constitutional queries", icon: Wallet, href: "/dashboard/copilot", keywords: "holdings allocation" },
  { id: "q-cre", label: "Show recent CRE decisions", group: "Constitutional queries", icon: ScrollText, href: "/dashboard/compliance", keywords: "ledger runtime engine" },
  { id: "q-sts", label: "What is my sovereign trust score?", group: "Constitutional queries", icon: HelpCircle, href: "/dashboard/copilot", keywords: "sts reputation" },
  { id: "q-graduate", label: "How do I graduate my enterprise?", group: "Constitutional queries", icon: GraduationCap, href: "/dashboard/graduation", keywords: "sovereign exit independence" },
  { id: "q-dividends", label: "Show my dividend history", group: "Constitutional queries", icon: Coins, href: "/dashboard/portfolio", keywords: "payouts withholding" },
  { id: "q-valuation", label: "Explain my enterprise valuation", group: "Constitutional queries", icon: TrendingUp, href: "/dashboard/copilot", keywords: "fundamental price eps pe" },
];

const GROUP_ORDER: CmdGroup[] = ["Navigation", "Actions", "Constitutional queries"];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();

  // Close on Escape — cmdk handles its own arrow-key navigation, but
  // we need to wire Escape since we're not using a Radix Dialog wrapper.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  const handleSelect = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      // Slight delay so the palette close animation can start before the
      // route transition — keeps things visually smooth.
      requestAnimationFrame(() => router.push(href));
    },
    [onOpenChange, router]
  );

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh] sm:pt-[15vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Constitutional command palette"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative flex max-h-[75vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gold/22 bg-popover/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          >
            {/* Aurora top-edge */}
            <div className="pointer-events-none absolute -top-px left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

            <CommandPrimitive
              className="flex h-full w-full flex-col"
              loop
            >
              {/* Input */}
              <div className="flex h-14 items-center gap-3 border-b border-gold/12 px-4">
                <Search className="h-4 w-4 shrink-0 text-gold/70" />
                <CommandPrimitive.Input
                  autoFocus
                  placeholder="Type a command or search the constitution…"
                  className="flex-1 bg-transparent font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground/85"
                />
                <kbd
                  className="hidden shrink-0 rounded border border-gold/15 bg-gold/[0.04] px-1.5 py-0.5 font-mono text-xs text-muted-foreground sm:inline"
                  aria-hidden
                >
                  ESC
                </kbd>
              </div>

              {/* List */}
              <CommandPrimitive.List className="max-h-[55vh] overflow-y-auto p-2">
                <CommandPrimitive.Empty className="py-10 text-center font-sans text-sm text-muted-foreground">
                  No commands match. Try “vote”, “portfolio”, or “calendar”.
                </CommandPrimitive.Empty>

                {GROUP_ORDER.map((group) => {
                  const items = COMMANDS.filter((c) => c.group === group);
                  if (!items.length) return null;
                  return (
                    <CommandPrimitive.Group
                      key={group}
                      heading={group}
                      className={cn(
                        "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.22em] [&_[cmdk-group-heading]]:text-muted-foreground/80"
                      )}
                    >
                      {items.map((c) => (
                        <CommandPrimitive.Item
                          key={c.id}
                          value={`${c.label} ${c.keywords ?? ""}`}
                          onSelect={() => handleSelect(c.href)}
                          className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm text-foreground/90 outline-none data-[selected=true]:bg-gold/[0.08] data-[selected=true]:text-foreground"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gold/12 bg-gold/[0.04] text-gold transition-colors group-data-[selected=true]:border-gold/30 group-data-[selected=true]:bg-gold/10">
                            <c.icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="flex-1 truncate">{c.label}</span>
                          {c.hint && (
                            <span className="font-mono text-xs text-muted-foreground">
                              {c.hint}
                            </span>
                          )}
                          <CornerDownLeft className="h-3 w-3 shrink-0 text-muted-foreground/85 opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                        </CommandPrimitive.Item>
                      ))}
                    </CommandPrimitive.Group>
                  );
                })}
              </CommandPrimitive.List>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gold/12 px-4 py-2.5">
                <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground/85">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-gold/15 bg-gold/[0.04] px-1 py-0.5">↑↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-gold/15 bg-gold/[0.04] px-1 py-0.5">↵</kbd>
                    select
                  </span>
                </div>
                <span className="font-mono text-xs uppercase tracking-[0.22em] text-gold/60">
                  AURIENTA · Constitutional Console
                </span>
              </div>
            </CommandPrimitive>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
