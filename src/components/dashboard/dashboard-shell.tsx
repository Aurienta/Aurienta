"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard, Wallet, Compass, LineChart, Scale, Settings2, Rocket,
  ShieldCheck, GraduationCap, Award, Bot, User as UserIcon, Bell, Search,
  Menu, X, ChevronDown, LogOut, ExternalLink, CalendarDays, Hourglass,
  Users, HardHat, Globe, Brain, GitCompare, Languages, FileSearch,
  AlertTriangle, TrendingUp, Target, ClipboardList, UserCheck, Calculator,
  MessageSquare, FlaskConical, HeartPulse, Building2, Landmark, Database,
  Vault, FileText, Gavel, Truck, Cpu, ShieldAlert, KeyRound, Network, Presentation,
  Layers, Activity, SlidersHorizontal, ScrollText,
  Newspaper, Contact, Workflow, Shield, ClipboardCheck, Flag, Crown, BadgeCheck, Zap, Megaphone, GitBranch, Handshake, Crosshair,
  UserCircle,
  // P3-005: Diversified icons to eliminate duplicates across NAV items.
  Building, Castle, FileCheck, Factory,
  Banknote, Receipt, BarChart3, Gauge, PieChart, CheckCircle2, Briefcase,
} from "lucide-react";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { stsLevel } from "@/lib/aurienta/constants";
import { egp } from "@/lib/aurienta/format";
import {
  NAV,
  NAV_I18N,
  GROUP_I18N,
  DEFAULT_GROUP_ORDER,
  groupOrderForRoles,
  visibleGroupsForRoles,
  type NavIconName,
} from "@/lib/aurienta/nav-config";
import { CommandPalette } from "@/components/dashboard/ux/command-palette";
import { Breadcrumbs, EnterpriseSwitcher, OnboardingTour, HelpButton, QuickActions } from "@/components/dashboard/ux/enhancements";
import { RoleContextBar } from "@/components/dashboard/role-context-bar";
import { RoleSwitcher } from "@/components/dashboard/role-switcher";
import {
  EnterpriseProvider,
  type EnterpriseContextValue,
} from "@/components/dashboard/enterprise-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLanguage } from "@/lib/i18n/language-context";

// FIX-P2-NAV-CENTRALIZE: ICON REGISTRY
//
// nav-config.ts stores nav icons by NAME (string) so the data module stays
// free of React/JSX imports and can be consumed from server code (breadcrumbs,
// server components). This registry is the consumer-side resolver that maps a
// NavIconName string back to the actual Lucide icon component, so the sidebar
// can still render `<Icon className=.../>`.
//
// If you add a new icon to a NAV item, add the corresponding entry here too.
const NAV_ICON_REGISTRY: Record<NavIconName, React.ElementType> = {
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
  Menu,
  X,
  ChevronDown,
  LogOut,
  ExternalLink,
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
  // P3-005: Diversified icons — must be registered so NAV items that
  // reference them by name resolve correctly via resolveNavIcon().
  Building,
  Landmark,
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

// Helper: resolve a NavIconName to a React component (with a safe fallback).
function resolveNavIcon(name: NavIconName): React.ElementType {
  return NAV_ICON_REGISTRY[name] ?? LayoutDashboard;
}

export function DashboardShell({
  user,
  children,
}: {
  user: {
    id: string;
    legalName: string;
    email: string;
    sovereignTrustScore: number;
    tier: string;
    avatarColor: string;
    memberships: { role: string; enterprise: { id: string; name: string; slug: string; tier: string } }[];
    ownershipRecords: { equityUnits: number; enterprise: { id: string; name: string; slug: string; equityUnitPriceEgp: number } }[];
    tasks: { id: string; priority: string }[];
    notifications: { id: string }[];
  };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { t } = useLanguage();

  // Helper: translate a nav label via the NAV_I18N map
  const tNav = (label: string) => {
    const key = NAV_I18N[label];
    return key ? t(key) : label;
  };
  // Helper: translate a group name via the GROUP_I18N map
  const tGroup = (group: string) => {
    const key = GROUP_I18N[group];
    return key ? t(key) : group;
  };
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const level = stsLevel(user.sovereignTrustScore);

  const portfolioValue = user.ownershipRecords.reduce(
    (sum, s) => sum + s.equityUnits * s.enterprise.equityUnitPriceEgp,
    0
  );

  const roles = React.useMemo(
    () => new Set(user.memberships.map((m) => m.role)),
    [user.memberships]
  );
  const activeRoles = roles.size;
  const groupOrder = React.useMemo(() => groupOrderForRoles(roles), [roles]);
  const reordered = groupOrder[0] !== DEFAULT_GROUP_ORDER[0];

  // I2: Enterprise switcher — selectedEntId is the active enterprise for the
  // entire dashboard. REMED-1D: this state is now consumed via EnterpriseContext
  // (see useEnterprise()) so per-enterprise pages can read/switch it.
  const userEnterprises = user.memberships.map((m) => ({ id: m.enterprise.id, name: m.enterprise.name, tier: m.enterprise.tier }));
  const [selectedEntId, setSelectedEntId] = React.useState<string | null>(userEnterprises[0]?.id ?? null);

  // P1.1: Active role state — tracks which constitutional role the user
  // is currently acting as. This affects navigation filtering, dashboard
  // content, and available actions. Server-side authorization always
  // validates the actual role — this is a client convenience only.
  const rolesForActiveEnt = selectedEntId
    ? user.memberships.filter((m) => m.enterprise.id === selectedEntId).map((m) => m.role)
    : user.memberships.map((m) => m.role);
  const [activeRole, setActiveRole] = React.useState<string | null>(rolesForActiveEnt[0] ?? null);

  // REMED-1D: persist the active enterprise to localStorage so navigation
  // between routes (and full reloads) preserve the user's choice. We hydrate
  // on mount from `aurienta_active_ent` and write on every change. The stored
  // id is validated against the user's actual enterprises to avoid pointing
  // at a stale enterprise the user has since left.
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("aurienta_active_ent");
      if (stored && userEnterprises.some((e) => e.id === stored)) {
        setSelectedEntId(stored);
      }
      const storedRole = localStorage.getItem("aurienta_active_role");
      if (storedRole && rolesForActiveEnt.includes(storedRole)) {
        setActiveRole(storedRole);
      }
    } catch {
      // localStorage may be unavailable (private mode, sandbox) — fail silently.
    }
  }, []);

  // When enterprise changes, reset active role to the first role in the new enterprise
  React.useEffect(() => {
    const newRoles = selectedEntId
      ? user.memberships.filter((m) => m.enterprise.id === selectedEntId).map((m) => m.role)
      : user.memberships.map((m) => m.role);
    if (newRoles.length > 0 && !newRoles.includes(activeRole ?? "")) {
      setActiveRole(newRoles[0]);
    }
  }, [selectedEntId]);

  // Persist active role
  React.useEffect(() => {
    if (activeRole) {
      try { localStorage.setItem("aurienta_active_role", activeRole); } catch {}
    }
  }, [activeRole]);

  // a11y: respect prefers-reduced-motion for framer-motion (WAAPI) animations.
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    try {
      if (selectedEntId) {
        localStorage.setItem("aurienta_active_ent", selectedEntId);
      }
    } catch {
      // ignore persistence failures
    }
  }, [selectedEntId]);

  // Memoise the context value so consumers only re-render when the selection
  // actually changes (the setter identity is stable across renders).
  const enterpriseContextValue = React.useMemo<EnterpriseContextValue>(
    () => ({ selectedEntId, setSelectedEntId }),
    [selectedEntId]
  );

  // I4: Onboarding — show on first visit
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  React.useEffect(() => {
    try {
      const onboarded = localStorage.getItem("aurienta_onboarded");
      if (!onboarded) setShowOnboarding(true);
    } catch {}
  }, []);
  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    try { localStorage.setItem("aurienta_onboarded", "true"); } catch {}
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initials = user.legalName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} roles={roles} />

      {/* Skip-to-content link for keyboard users (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:rounded focus:bg-gold focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:font-semibold focus:text-black"
      >
        Skip to content
      </a>

      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gold/10 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/15 text-foreground lg:hidden"
            aria-label="Toggle sidebar"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <AurientaMark className="h-8 w-8" />
            <span className="font-serif text-base font-semibold uppercase tracking-[0.3em] text-gold-gradient">
              Aurienta
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="hidden h-9 items-center gap-2 rounded-lg border border-gold/15 bg-gold/[0.03] px-2.5 font-sans text-xs text-muted-foreground transition-colors hover:border-gold/30 hover:text-foreground sm:flex"
                  aria-label="Open constitutional command palette (Cmd+K)"
                >
                  <Search className="h-3.5 w-3.5 text-gold/70" />
                  <span className="hidden md:inline">Search constitution…</span>
                  <kbd className="ml-1 rounded border border-gold/20 bg-gold/[0.06] px-1.5 py-0.5 font-mono text-xs text-gold/80">
                    ⌘K
                  </kbd>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-gold/15 bg-popover">
                <p className="font-sans text-xs text-muted-foreground">
                  Constitutional console — <span className="font-mono text-gold">⌘K</span> / <span className="font-mono text-gold">Ctrl+K</span>
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-gold sm:hidden"
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* I2: Enterprise Switcher */}
          {userEnterprises.length > 0 && (
            <div className="hidden sm:block">
              <EnterpriseSwitcher enterprises={userEnterprises} selectedId={selectedEntId} onSelect={setSelectedEntId} />
            </div>
          )}

          {/* P1.1: Role Switcher — explicit multi-role context selection */}
          <RoleSwitcher
            memberships={user.memberships}
            selectedEntId={selectedEntId}
            activeRole={activeRole}
            onSelectRole={setActiveRole}
          />

          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 text-muted-foreground hover:text-gold"
            aria-label="Notifications"
            asChild
          >
            <Link href="/dashboard/notifications">
              <Bell className="h-4 w-4" />
              {user.notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold shadow-[0_0_8px_2px_rgba(212,175,55,0.6)]" />
              )}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-gold/15 bg-gold/5 py-1 pl-1 pr-3 transition-colors hover:border-gold/30">
                <Avatar className="h-7 w-7 border border-gold/20">
                  <AvatarFallback
                    className="text-xs font-semibold"
                    style={{ background: `linear-gradient(135deg, ${user.avatarColor}, #b8860b)`, color: "#0a0a0b" }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden font-sans text-xs font-medium text-foreground sm:inline">
                  {user.legalName.split(" ")[0]}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 border-gold/15 bg-popover">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-sm font-semibold">{user.legalName}</span>
                  <span className="font-sans text-[11px] text-muted-foreground">{user.email}</span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-xs"
                      style={{ background: `${level.color}22`, color: level.color }}
                    >
                      <GoldStar className="h-2.5 w-2.5" /> STS {user.sovereignTrustScore}
                    </span>
                    <span className="font-sans text-xs text-muted-foreground">{user.tier}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gold/10" />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" /> Profile & Identity
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Public site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gold/10" />
              <DropdownMenuItem asChild>
                {/* POST form — NOT a <Link>. A <Link href="/api/auth/signout">
                    would be prefetched by Next.js, silently revoking the session. */}
                <form action="/api/auth/signout" method="post" className="w-full cursor-pointer text-destructive focus:text-destructive">
                  <button type="submit" className="flex w-full items-center">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar — desktop */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-gold/10 bg-background/50 lg:block">
          <SidebarContent user={user} pathname={pathname} portfolioValue={portfolioValue} activeRoles={activeRoles} level={level} groupOrder={groupOrder} reordered={reordered} />
        </aside>

        {/* Sidebar — mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: reduceMotion ? 1 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", damping: 28, stiffness: 260 }}
                className="fixed inset-y-0 left-0 z-50 w-72 border-r border-gold/15 bg-background lg:hidden"
              >
                <SidebarContent
                  user={user}
                  pathname={pathname}
                  portfolioValue={portfolioValue}
                  activeRoles={activeRoles}
                  level={level}
                  groupOrder={groupOrder}
                  reordered={reordered}
                  onNavigate={() => setMobileOpen(false)}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main */}
        <main id="main-content" className="min-w-0 flex-1">
          {/* Role Context Bar — shows active role, enterprise, tier, stage, health */}
          <RoleContextBar user={user} selectedEntId={selectedEntId} activeRole={activeRole} />
          {/* I2: Breadcrumbs */}
          <div className="border-b border-gold/[0.06] px-4 py-2 sm:px-6">
            <Breadcrumbs pathname={pathname} />
          </div>
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            {/* REMED-1D: expose the active enterprise to every page rendered
                inside the dashboard. Pages call useEnterprise() to read or
                switch it. */}
            <EnterpriseProvider value={enterpriseContextValue}>
              {children}
            </EnterpriseProvider>
          </div>
        </main>
      </div>

      {/* I4: Onboarding Tour */}
      {showOnboarding && <OnboardingTour onClose={handleOnboardingClose} />}

      {/* I4: Help Button */}
      <HelpButton onOpenTour={() => setShowOnboarding(true)} />

      {/* I5: Quick Actions */}
      <QuickActions roles={roles} />
    </div>
  );
}

function SidebarContent({
  user,
  pathname,
  portfolioValue,
  activeRoles,
  level,
  groupOrder,
  reordered,
  onNavigate,
}: {
  user: { legalName: string; sovereignTrustScore: number; tier: string; memberships: { role: string; enterprise: { name: string } }[] };
  pathname: string;
  portfolioValue: number;
  activeRoles: number;
  level: { name: string; color: string };
  groupOrder: string[];
  reordered: boolean;
  onNavigate?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const tNav = (label: string) => {
    const key = NAV_I18N[label];
    return key ? t(key) : label;
  };
  const tGroup = (group: string) => {
    const key = GROUP_I18N[group];
    return key ? t(key) : group;
  };
  // I1: Collapsible groups — collapsed by default, active group auto-expands
  const activeGroup = NAV.find((n) => n.href === pathname)?.group;
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(
    () => new Set(groupOrder.filter((g) => g !== activeGroup))
  );

  // REMED-1D: Role-based nav FILTERING (not just reorder). Compute the set of
  // groups the user is allowed to see based on their role set, then intersect
  // with `groupOrder` so the operator reordering (Enterprise first) still wins
  // for users who can see that group. A pure capital_partner sees only the 5
  // universal groups (Workspace / Capital & Workforce / Intelligence /
  // Compliance & Transparency / Institutional Services) — a subset of all
  // routes defined in nav-config.ts. Counts are computed dynamically from
  // NAV, so do not hardcode them here.
  const userRoles = React.useMemo(
    () => new Set(user.memberships.map((m) => m.role)),
    [user.memberships]
  );
  const visibleGroupsSet = React.useMemo(
    () => visibleGroupsForRoles(userRoles),
    [userRoles]
  );
  const visibleGroups = groupOrder.filter((g) => visibleGroupsSet.has(g));

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Identity card */}
      <div className="border-b border-gold/10 p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full font-serif text-sm font-semibold text-black"
            style={{ background: `linear-gradient(135deg, #d4af37, #b8860b)` }}
          >
            {user.legalName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-sm font-semibold">{user.legalName}</p>
            <p className="font-sans text-[11px] text-muted-foreground">{user.tier}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-gold/10 bg-gold/[0.03] p-2.5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Constitutional Holdings</p>
            <p className="font-serif text-sm font-semibold text-gold-light">{egp(portfolioValue, { compact: true })}</p>
          </div>
          <div className="rounded-lg border border-gold/10 bg-gold/[0.03] p-2.5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Trust Score</p>
            <p className="font-serif text-sm font-semibold" style={{ color: level.color }}>
              {user.sovereignTrustScore}/100
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <TooltipProvider delayDuration={250}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-default border-gold/20 bg-transparent text-xs text-muted-foreground">
                  {activeRoles} active role{activeRoles === 1 ? "" : "s"}
                  {reordered && (
                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-gold/70" aria-hidden />
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="right" className="border-gold/15 bg-popover">
                {reordered ? (
                  <p className="max-w-[220px] font-sans text-xs text-muted-foreground">
                    Reordered for your active role — Enterprise surfaces first because you hold a manager or founding-operator seat.
                  </p>
                ) : (
                  <p className="max-w-[220px] font-sans text-xs text-muted-foreground">
                    Workspace first — you are signed in as a capital partner.
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Nav — collapsible groups with gold hairline dividers */}
      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Primary">
        {visibleGroups.map((group, idx) => {
          const items = NAV.filter((n) => n.group === group);
          if (items.length === 0) return null;
          const isCollapsed = collapsedGroups.has(group);
          const isActiveGroup = group === activeGroup;
          return (
            <div key={group} className={cn("mb-2", idx > 0 && "mt-1 border-t border-gold/[0.06] pt-2")}>
              <button
                onClick={() => toggleGroup(group)}
                className="group flex w-full items-center justify-between px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75 transition-colors hover:text-gold/70"
                aria-expanded={!isCollapsed}
                aria-label={`Toggle ${group} section`}
              >
                <span>{tGroup(group)}</span>
                <span className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-muted-foreground/85">{items.length}</span>
                  <ChevronDown className={cn("h-3 w-3 transition-transform", isCollapsed ? "-rotate-90" : "")} />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-0.5 pb-1">
                      {items.map((item) => {
                        const active = pathname === item.href;
                        const Icon = resolveNavIcon(item.icon);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                              "group flex items-center gap-3 rounded-lg px-3 py-2 font-sans text-sm transition-all",
                              active
                                ? "bg-gold-gradient text-black shadow-[0_4px_20px_-6px_rgba(212,175,55,0.5)]"
                                : "text-muted-foreground hover:bg-gold/5 hover:text-foreground"
                            )}
                          >
                            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-black" : "text-gold/70 group-hover:text-gold")} />
                            <span className="truncate">{tNav(item.label)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gold/10 p-3">
        <div className="flex items-center gap-2 rounded-lg bg-gold/[0.03] px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]" />
          <span className="font-mono text-[11px] text-muted-foreground/85">CRE online · 0xB4F8…E7D1A</span>
        </div>
      </div>
    </div>
  );
}
