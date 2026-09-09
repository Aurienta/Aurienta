"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command as CommandPrimitive } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  // FIX-P2-NAV-CENTRALIZE: full icon set so the palette can resolve any
  // icon NAME stored in nav-config.ts back to its Lucide component.
  // The registry below mirrors the NAV_ICON_REGISTRY in dashboard-shell.tsx;
  // when you add an icon to a NAV item, add the corresponding entry here.
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
  User as UserIcon,
  Bell,
  CalendarDays,
  Hourglass,
  Users,
  HardHat,
  Globe,
  Brain,
  GitCompare,
  Languages,
  FileSearch,
  AlertTriangle,
  TrendingUp,
  Target,
  ClipboardList,
  UserCheck,
  Calculator,
  MessageSquare,
  FlaskConical,
  HeartPulse,
  Building2,
  Landmark,
  Database,
  Vault,
  FileText,
  Gavel,
  Truck,
  Cpu,
  ShieldAlert,
  KeyRound,
  Network,
  Presentation,
  Layers,
  Activity,
  SlidersHorizontal,
  ScrollText,
  Newspaper,
  Contact,
  Workflow,
  Shield,
  ClipboardCheck,
  Flag,
  Crown,
  BadgeCheck,
  Zap,
  Megaphone,
  GitBranch,
  Handshake,
  Crosshair,
  UserCircle,
  // P3-005: Diversified icons — must be imported here too so the registry
  // below can resolve them when the new NAV items reference them by name.
  Building,
  Castle,
  FileCheck,
  Factory,
  Banknote,
  Receipt,
  BarChart3,
  Gauge,
  PieChart,
  CheckCircle2,
  Briefcase,
  // Static action/query icons (kept for the non-nav command groups).
  Vote,
  HandCoins,
  CandlestickChart,
  Sparkles,
  HelpCircle,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NAV_GROUPS,
  visibleGroupsForRoles,
  navItemsForGroups,
  type NavIconName,
} from "@/lib/aurienta/nav-config";

// ─── Icon registry ──────────────────────────────────────────────────────
//
// nav-config.ts stores icons by NAME (string) so the data module has zero
// React/JSX imports. This registry is the consumer-side resolver for the
// command palette. Keeping it in lock-step with the NAV_ICON_REGISTRY in
// dashboard-shell.tsx — when you add a new icon to a NAV item, add an entry
// here too (and to the dashboard-shell registry).
const NAV_ICON_REGISTRY: Record<NavIconName, React.ComponentType<{ className?: string }>> = {
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
  User: UserIcon,
  Bell,
  Search,
  Menu: Search,            // not used by NAV; alias for type completeness
  X: Search,               // not used by NAV; alias for type completeness
  ChevronDown: Search,     // not used by NAV; alias for type completeness
  LogOut: Search,          // not used by NAV; alias for type completeness
  ExternalLink: Search,   // not used by NAV; alias for type completeness
  CalendarDays,
  Hourglass,
  Users,
  HardHat,
  Globe,
  Brain,
  GitCompare,
  Languages,
  FileSearch,
  AlertTriangle,
  TrendingUp,
  Target,
  ClipboardList,
  UserCheck,
  Calculator,
  MessageSquare,
  FlaskConical,
  HeartPulse,
  Building2,
  Landmark,
  Database,
  Vault,
  FileText,
  Gavel,
  Truck,
  Cpu,
  ShieldAlert,
  KeyRound,
  Network,
  Presentation,
  Layers,
  Activity,
  SlidersHorizontal,
  ScrollText,
  Newspaper,
  Contact,
  Workflow,
  Shield,
  ClipboardCheck,
  Flag,
  Crown,
  BadgeCheck,
  Zap,
  Megaphone,
  GitBranch,
  Handshake,
  Crosshair,
  UserCircle,
  // P3-005: Diversified icons — registered here so NAV items that reference
  // them by name resolve correctly via resolveNavIcon().
  Building,
  Castle,
  FileCheck,
  Factory,
  Banknote,
  Receipt,
  BarChart3,
  Gauge,
  PieChart,
  CheckCircle2,
  Briefcase,
};

function resolveNavIcon(name: NavIconName): React.ComponentType<{ className?: string }> {
  return NAV_ICON_REGISTRY[name] ?? Search;
}

// ─── Types ──────────────────────────────────────────────────────────────

type Command = {
  id: string;
  label: string;
  /** Display group heading (sidebar group name, or "Actions" / "Constitutional queries"). */
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  hint?: string;
  /** Additional searchable tokens appended to the cmdk value. */
  keywords?: string;
};

// ─── Static (non-nav) commands ──────────────────────────────────────────
//
// These are functional shortcuts that don't map 1:1 to a sidebar route — they
// exist alongside the dynamically-generated nav commands so users still get
// verb-style actions ("Vote on open proposals") and AI queries.

const ACTION_COMMANDS: Command[] = [
  { id: "act-vote", label: "Vote on open proposals", group: "Actions", icon: Vote, href: "/dashboard/governance", keywords: "cast governance" },
  { id: "act-reserve", label: "Reserve Equity Units", group: "Actions", icon: HandCoins, href: "/dashboard/opportunities", keywords: "invest commit" },
  { id: "act-trade", label: "Place a trade", group: "Actions", icon: CandlestickChart, href: "/dashboard/market", keywords: "buy sell order" },
  { id: "act-graduation", label: "View graduation status", group: "Actions", icon: GraduationCap, href: "/dashboard/graduation", keywords: "sovereign readiness exit" },
  { id: "act-copilot", label: "Ask the AI Copilot", group: "Actions", icon: Sparkles, href: "/dashboard/copilot", keywords: "question assistant" },
  { id: "act-calendar", label: "View constitutional calendar", group: "Actions", icon: CalendarDays, href: "/dashboard/calendar", keywords: "schedule today" },
  { id: "act-triage", label: "Triage notifications with AI", group: "Actions", icon: Bell, href: "/dashboard/notifications", keywords: "priority inbox" },
  { id: "act-windows", label: "View priority windows", group: "Actions", icon: Hourglass, href: "/dashboard/priority-windows", keywords: "pro-rata entitlement" },
];

const QUERY_COMMANDS: Command[] = [
  { id: "q-portfolio", label: "Explain my portfolio", group: "Constitutional queries", icon: Wallet, href: "/dashboard/copilot", keywords: "holdings allocation" },
  { id: "q-cre", label: "Show recent CRE decisions", group: "Constitutional queries", icon: ScrollText, href: "/dashboard/compliance", keywords: "ledger runtime engine" },
  { id: "q-sts", label: "What is my sovereign trust score?", group: "Constitutional queries", icon: HelpCircle, href: "/dashboard/copilot", keywords: "sts reputation" },
  { id: "q-graduate", label: "How do I graduate my enterprise?", group: "Constitutional queries", icon: GraduationCap, href: "/dashboard/graduation", keywords: "sovereign exit independence" },
  { id: "q-dividends", label: "Show my dividend history", group: "Constitutional queries", icon: Coins, href: "/dashboard/portfolio", keywords: "payouts withholding" },
  { id: "q-valuation", label: "Explain my enterprise valuation", group: "Constitutional queries", icon: TrendingUp, href: "/dashboard/copilot", keywords: "fundamental price eps pe" },
];

// ─── Component ───────────────────────────────────────────────────────────

/**
 * FIX-P2-NAV-CENTRALIZE: The command palette now derives its Navigation
 * commands directly from the centralized NAV config in
 * `@/lib/aurienta/nav-config`. This means every sidebar route is searchable
 * via Cmd+K — coverage went from 28/83 routes to 83/83 (100%).
 *
 * Role-based filtering uses `visibleGroupsForRoles(roles)` so unauthorized
 * routes never appear in the palette (same rules as the sidebar).
 *
 * The two non-nav groups ("Actions" and "Constitutional queries") are kept
 * as static arrays — they are functional verb-style shortcuts that don't
 * correspond 1:1 to a sidebar route (e.g. "Vote on open proposals" routes
 * to /dashboard/governance, but the label is action-oriented, not nav).
 */
export function CommandPalette({
  open,
  onOpenChange,
  roles,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /**
   * Optional set of role strings (e.g. `new Set(["capital_partner", "manager"])`).
   * When provided, only NAV items whose sidebar group is visible for these
   * roles are surfaced — matching the sidebar exactly. When omitted (e.g.
   * if the palette is ever used outside the dashboard), all NAV items are
   * shown as a safe default.
   */
  roles?: Set<string>;
}) {
  const router = useRouter();

  // Build the command list from the centralized NAV config — always in sync
  // with the sidebar. Filter by role using visibleGroupsForRoles so
  // unauthorized routes don't appear.
  const commands = React.useMemo<Command[]>(() => {
    const visibleGroups = roles ? visibleGroupsForRoles(roles) : new Set(NAV_GROUPS);
    const navItems = navItemsForGroups(visibleGroups);

    const navCommands: Command[] = navItems.map((item) => {
      const Icon = resolveNavIcon(item.icon);
      // Make the URL slug searchable too (e.g. "career-ledger" → "career ledger")
      // so users can find routes by typing the path.
      const slug = item.href.split("/").pop() ?? "";
      const slugReadable = slug.split("-").join(" ");
      return {
        id: item.href,
        label: item.label,
        href: item.href,
        group: item.group,
        icon: Icon,
        keywords: slugReadable,
      };
    });

    return [...navCommands, ...ACTION_COMMANDS, ...QUERY_COMMANDS];
  }, [roles]);

  // Group order: sidebar groups first (in canonical NAV_GROUPS order, only
  // those that actually have commands), then Actions, then Constitutional
  // queries.
  const groupOrder = React.useMemo<string[]>(() => {
    const present = new Set(commands.map((c) => c.group));
    const ordered = NAV_GROUPS.filter((g) => present.has(g));
    if (present.has("Actions")) ordered.push("Actions");
    if (present.has("Constitutional queries")) ordered.push("Constitutional queries");
    return ordered;
  }, [commands]);

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

                {groupOrder.map((group) => {
                  const items = commands.filter((c) => c.group === group);
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
