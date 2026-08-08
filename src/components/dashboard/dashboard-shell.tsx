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
import { CommandPalette } from "@/components/dashboard/ux/command-palette";
import { Breadcrumbs, EnterpriseSwitcher, OnboardingTour, HelpButton, QuickActions } from "@/components/dashboard/ux/enhancements";
import {
  EnterpriseProvider,
  type EnterpriseContextValue,
} from "@/components/dashboard/enterprise-context";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = { href: string; label: string; icon: React.ElementType; group: string };

const NAV: NavItem[] = [
  // ── Workspace (6) ──
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, group: "Workspace" },
  { href: "/dashboard/portfolio", label: "Constitutional Holdings", icon: Wallet, group: "Workspace" },
  { href: "/dashboard/opportunities", label: "Capital Participation", icon: Compass, group: "Workspace" },
  { href: "/dashboard/market", label: "Enterprise Registry", icon: LineChart, group: "Workspace" },
  { href: "/dashboard/priority-windows", label: "Priority Windows", icon: Hourglass, group: "Workspace" },
  { href: "/dashboard/calendar", label: "Constitutional Calendar", icon: CalendarDays, group: "Workspace" },
  { href: "/dashboard/updates", label: "Enterprise Updates", icon: Newspaper, group: "Workspace" },

  // ── Capital & Workforce (5) ──
  { href: "/dashboard/syndicates", label: "Syndicates", icon: Users, group: "Capital & Workforce" },
  { href: "/dashboard/career-ledger", label: "Career Ledger", icon: HardHat, group: "Capital & Workforce" },
  { href: "/dashboard/mentorship", label: "Mentorship", icon: UserCheck, group: "Capital & Workforce" },
  { href: "/dashboard/skill-equity", label: "Skill-to-Equity", icon: Award, group: "Capital & Workforce" },
  { href: "/dashboard/diaspora", label: "Diaspora Bridge", icon: Globe, group: "Capital & Workforce" },

  // ── Enterprise (8) ──
  { href: "/dashboard/governance", label: "Governance", icon: Scale, group: "Enterprise" },
  { href: "/dashboard/manager", label: "Manager Console", icon: Settings2, group: "Enterprise" },
  { href: "/dashboard/founder", label: "Founding Operator Studio", icon: Rocket, group: "Enterprise" },
  { href: "/dashboard/pitch-deck", label: "Pitch Deck Generator", icon: Presentation, group: "Enterprise" },
  { href: "/dashboard/milestone-designer", label: "Milestone Designer", icon: Target, group: "Enterprise" },
  { href: "/dashboard/board-member", label: "Board Member Console", icon: Gavel, group: "Enterprise" },
  { href: "/dashboard/board-briefings", label: "Board Briefings", icon: ClipboardList, group: "Enterprise" },
  { href: "/dashboard/succession", label: "Succession Planner", icon: UserCheck, group: "Enterprise" },
  { href: "/dashboard/partner-crm", label: "Partner CRM", icon: Contact, group: "Enterprise" },

  // ── Intelligence (8) ──
  { href: "/dashboard/brain-ai", label: "Brain AI Status", icon: Brain, group: "Intelligence" },
  { href: "/dashboard/precedents", label: "Precedent Engine", icon: FileSearch, group: "Intelligence" },
  { href: "/dashboard/drift", label: "Drift Detector", icon: TrendingUp, group: "Intelligence" },
  { href: "/dashboard/anomalies", label: "Anomaly Narration", icon: AlertTriangle, group: "Intelligence" },
  { href: "/dashboard/charter-diff", label: "Charter Diff", icon: GitCompare, group: "Intelligence" },
  { href: "/dashboard/constitution", label: "Constitution Guide", icon: Languages, group: "Intelligence" },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, group: "Intelligence" },
  { href: "/dashboard/copilot", label: "AI Copilot", icon: Bot, group: "Intelligence" },

  // ── Compliance & Transparency (6) ──
  { href: "/dashboard/compliance", label: "Compliance", icon: ShieldCheck, group: "Compliance & Transparency" },
  { href: "/dashboard/workforce", label: "Workforce Registry", icon: Users, group: "Compliance & Transparency" },
  { href: "/dashboard/whistleblower", label: "Whistleblower", icon: ShieldAlert, group: "Compliance & Transparency" },
  { href: "/dashboard/appeals", label: "Appeal Court", icon: Gavel, group: "Compliance & Transparency" },
  { href: "/dashboard/risk-disclosure", label: "Risk Disclosure", icon: AlertTriangle, group: "Compliance & Transparency" },
  { href: "/dashboard/vendor-portal", label: "Vendor Portal", icon: Truck, group: "Compliance & Transparency" },

  // ── Treasury & Infrastructure (5) ──
  { href: "/dashboard/escrow", label: "Law Firm Client Accounts", icon: Vault, group: "Treasury & Infrastructure" },
  { href: "/dashboard/antifragility", label: "Anti-Fragility Vault", icon: Database, group: "Treasury & Infrastructure" },
  { href: "/dashboard/oracle-mirror", label: "Oracle Mirror", icon: FileText, group: "Treasury & Infrastructure" },
  { href: "/dashboard/reality-sync", label: "Reality Sync", icon: Activity, group: "Treasury & Infrastructure" },
  { href: "/dashboard/institutional-memory", label: "Institutional Memory", icon: Layers, group: "Treasury & Infrastructure" },

  // ── Graduation & Sovereignty (5) ──
  { href: "/dashboard/graduation", label: "Graduation", icon: GraduationCap, group: "Graduation & Sovereignty" },
  { href: "/dashboard/graduation-coach", label: "Graduation Coach", icon: TrendingUp, group: "Graduation & Sovereignty" },
  { href: "/dashboard/graduation-simulator", label: "Graduation Simulator", icon: FlaskConical, group: "Graduation & Sovereignty" },
  { href: "/dashboard/survival-drill", label: "Survival Drill", icon: HeartPulse, group: "Graduation & Sovereignty" },
  { href: "/dashboard/alumni", label: "Alumni Hall", icon: Award, group: "Graduation & Sovereignty" },

  // ── Platform Admin (10) ──
  { href: "/dashboard/admin/users", label: "Partner Management", icon: Users, group: "Platform Admin" },
  { href: "/dashboard/admin/enterprises", label: "Enterprise Management", icon: Building2, group: "Platform Admin" },
  { href: "/dashboard/steward", label: "Steward Dashboard", icon: Cpu, group: "Platform Admin" },
  { href: "/dashboard/architecture", label: "Institutional Architecture", icon: Building2, group: "Platform Admin" },
  { href: "/dashboard/governance-model", label: "Governance System", icon: ScrollText, group: "Platform Admin" },
  { href: "/dashboard/institutional-readiness", label: "Institutional Readiness", icon: Shield, group: "Platform Admin" },
  { href: "/dashboard/operating-system", label: "Operating System (AOS)", icon: Workflow, group: "Platform Admin" },
  { href: "/dashboard/commercialization", label: "Commercialization (ACS)", icon: TrendingUp, group: "Platform Admin" },
  { href: "/dashboard/production-readiness", label: "Production Readiness", icon: ShieldCheck, group: "Platform Admin" },
  { href: "/dashboard/pilot-execution", label: "Pilot Execution", icon: ClipboardCheck, group: "Platform Admin" },
  { href: "/dashboard/global-launch", label: "Global Launch (GLS)", icon: Flag, group: "Platform Admin" },
  { href: "/dashboard/founder-office", label: "Founder Office (FOCC)", icon: Crown, group: "Platform Admin" },
  { href: "/dashboard/institutional-trust", label: "Institutional Trust (ITDB)", icon: BadgeCheck, group: "Platform Admin" },
  { href: "/dashboard/market-execution", label: "Market Execution (MES)", icon: Zap, group: "Platform Admin" },
  { href: "/dashboard/market-activation", label: "Market Activation", icon: Megaphone, group: "Platform Admin" },
  { href: "/dashboard/customer-conversion", label: "Customer Conversion", icon: GitBranch, group: "Platform Admin" },
  { href: "/dashboard/strategic-partners", label: "Strategic Partners", icon: Handshake, group: "Platform Admin" },
  { href: "/dashboard/execution-war-room", label: "Execution War Room", icon: Crosshair, group: "Platform Admin" },
  { href: "/dashboard/first-research", label: "First 25 Research", icon: Target, group: "Platform Admin" },
  { href: "/dashboard/constitutional-audit", label: "Constitutional Audit", icon: Scale, group: "Platform Admin" },
  { href: "/dashboard/admin/audit", label: "Audit Log Viewer", icon: ScrollText, group: "Platform Admin" },
  { href: "/dashboard/admin/settings", label: "Institutional Settings", icon: SlidersHorizontal, group: "Platform Admin" },
  { href: "/dashboard/fra", label: "FRA Regulatory", icon: Landmark, group: "Platform Admin" },
  { href: "/dashboard/company-owner", label: "Company Owner", icon: Building2, group: "Platform Admin" },
  { href: "/dashboard/law-firm", label: "Law Firm Rep", icon: Scale, group: "Platform Admin" },
  { href: "/dashboard/accounting", label: "Accounting Firm", icon: Calculator, group: "Platform Admin" },
  { href: "/dashboard/industry", label: "Industry Modules", icon: FlaskConical, group: "Platform Admin" },
  { href: "/dashboard/federation", label: "Federation", icon: Network, group: "Platform Admin" },
  { href: "/dashboard/credentials", label: "VC Wallet", icon: KeyRound, group: "Platform Admin" },
  { href: "/dashboard/university", label: "University Rep Console", icon: GraduationCap, group: "Platform Admin" },

  // ── Institutional Services (3) ──
  { href: "/dashboard/tax", label: "Tax Optimizer", icon: Calculator, group: "Institutional Services" },
  { href: "/dashboard/ir", label: "Capital Partner Relations", icon: MessageSquare, group: "Institutional Services" },
  { href: "/dashboard/drip", label: "DRIP (Dividend Reinvest)", icon: TrendingUp, group: "Institutional Services" },
];

const DEFAULT_GROUP_ORDER = [
  "Workspace",
  "Capital & Workforce",
  "Enterprise",
  "Intelligence",
  "Compliance & Transparency",
  "Treasury & Infrastructure",
  "Graduation & Sovereignty",
  "Institutional Services",
  "Platform Admin",
];

function groupOrderForRoles(roles: Set<string>): string[] {
  const isOperator = roles.has("manager") || roles.has("founding_operator");
  if (isOperator) {
    return ["Enterprise", "Workspace", "Intelligence", "Capital & Workforce", "Compliance & Transparency", "Treasury & Infrastructure", "Graduation & Sovereignty", "Institutional Services", "Platform Admin"];
  }
  return DEFAULT_GROUP_ORDER;
}

/**
 * REMED-1D — Role-based nav FILTERING (not just reorder).
 *
 * Returns the set of nav groups a user with the given roles is allowed to see.
 * Groups not in the returned set are hidden entirely from the sidebar.
 *
 * Rules (from the CTO audit remediation spec):
 *  - Workspace / Capital & Workforce / Intelligence / Compliance & Transparency /
 *    Institutional Services → visible to everyone (universal partner tools).
 *  - Enterprise → only if user holds a manager / founding_operator / board_member /
 *    company_owner / accounting_firm_rep seat.
 *  - Treasury & Infrastructure → only if user holds a manager / founding_operator /
 *    board_member / company_owner / law_firm_rep seat.
 *  - Graduation & Sovereignty → only if user holds a founding_operator /
 *    company_owner / board_member seat.
 *  - Platform Admin → only if user holds an aurienta_rep / law_firm_rep /
 *    accounting_firm_rep / company_owner seat.
 *
 * A pure capital_partner sees 5 groups (27 routes) instead of 51.
 */
function visibleGroupsForRoles(roles: Set<string>): Set<string> {
  const has = (r: string) => roles.has(r);

  // Universal groups — every signed-in partner gets these.
  const visible = new Set<string>([
    "Workspace",
    "Capital & Workforce",
    "Intelligence",
    "Compliance & Transparency",
    "Institutional Services",
  ]);

  // Enterprise tools — operator/accounting seats only.
  if (
    has("manager") ||
    has("founding_operator") ||
    has("board_member") ||
    has("company_owner") ||
    has("accounting_firm_rep")
  ) {
    visible.add("Enterprise");
  }

  // Treasury & Infrastructure — operator + law-firm seats.
  if (
    has("manager") ||
    has("founding_operator") ||
    has("board_member") ||
    has("company_owner") ||
    has("law_firm_rep")
  ) {
    visible.add("Treasury & Infrastructure");
  }

  // Graduation & Sovereignty — sovereignty-class seats only.
  if (
    has("founding_operator") ||
    has("company_owner") ||
    has("board_member")
  ) {
    visible.add("Graduation & Sovereignty");
  }

  // Platform Admin — institutional reps + company owners.
  if (
    has("aurienta_rep") ||
    has("law_firm_rep") ||
    has("accounting_firm_rep") ||
    has("company_owner")
  ) {
    visible.add("Platform Admin");
  }

  return visible;
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
    } catch {
      // localStorage may be unavailable (private mode, sandbox) — fail silently.
    }
  }, []);

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
    <div className="flex min-h-screen flex-col bg-background">
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

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
                <Link href="/api/auth/signout" className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </Link>
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
  // I1: Collapsible groups — collapsed by default, active group auto-expands
  const activeGroup = NAV.find((n) => n.href === pathname)?.group;
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(
    () => new Set(groupOrder.filter((g) => g !== activeGroup))
  );

  // REMED-1D: Role-based nav FILTERING (not just reorder). Compute the set of
  // groups the user is allowed to see based on their role set, then intersect
  // with `groupOrder` so the operator reordering (Enterprise first) still wins
  // for users who can see that group. A pure capital_partner sees only the 5
  // universal groups (27 routes) instead of all 51.
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
                <span>{group}</span>
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
                            <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-black" : "text-gold/70 group-hover:text-gold")} />
                            <span className="truncate">{item.label}</span>
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
