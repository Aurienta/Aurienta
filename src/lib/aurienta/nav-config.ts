/**
 * FIX-P2-NAV-CENTRALIZE — Single source of truth for AURIENTA navigation.
 *
 * This module is a PURE DATA module. It contains NO React / JSX imports.
 * Each nav item stores the icon by NAME (string) — consuming components
 * (dashboard-shell, command-palette, etc.) import the icon component
 * themselves and resolve it via the shared `NAV_ICON_REGISTRY` or by
 * passing their own lookup. This keeps the data module framework-agnostic
 * and tree-shakeable from server code (breadcrumbs, server components,
 * tests, etc.).
 *
 * Exports:
 *  - NavItem, NavIconName        (types)
 *  - NAV                          (the flat array of nav items)
 *  - NAV_I18N                     (label → i18n key map)
 *  - GROUP_I18N                   (group name → i18n key map)
 *  - NAV_GROUPS                   (ordered list of all group names)
 *  - DEFAULT_GROUP_ORDER          (canonical ordering of groups)
 *  - visibleGroupsForRoles(roles) (which groups a user can see)
 *  - groupOrderForRoles(roles)    (reordered group list per role)
 *  - getNavLabel(href)            (label for a given href, or undefined)
 *  - getNavIconName(href)         (icon name for a given href, or undefined)
 *  - getNavGroup(href)            (group name for a given href, or undefined)
 *  - getAllNavRoutes()            (all unique hrefs from NAV)
 *  - navItemsForGroups(groups)    (NAV items filtered to a group set)
 *
 * Audit findings addressed:
 *  - P2-001: command palette now derives from NAV → 100% coverage.
 *  - P2-002: breadcrumbs now use getNavLabel() → matches sidebar labels.
 *  - P3-002: onboarding copy now uses NAV_GROUPS.length / NAV.length.
 */

// ─── Types ──────────────────────────────────────────────────────────────

export type NavIconName =
  | "LayoutDashboard"
  | "Wallet"
  | "Compass"
  | "LineChart"
  | "Scale"
  | "Settings2"
  | "Rocket"
  | "ShieldCheck"
  | "GraduationCap"
  | "Award"
  | "Bot"
  | "User"
  | "Bell"
  | "Search"
  | "Menu"
  | "X"
  | "ChevronDown"
  | "LogOut"
  | "ExternalLink"
  | "CalendarDays"
  | "Hourglass"
  | "Users"
  | "HardHat"
  | "Globe"
  | "Brain"
  | "GitCompare"
  | "Languages"
  | "FileSearch"
  | "AlertTriangle"
  | "TrendingUp"
  | "Target"
  | "ClipboardList"
  | "UserCheck"
  | "Calculator"
  | "MessageSquare"
  | "FlaskConical"
  | "HeartPulse"
  | "Building2"
  | "Landmark"
  | "Database"
  | "Vault"
  | "FileText"
  | "Gavel"
  | "Truck"
  | "Cpu"
  | "ShieldAlert"
  | "KeyRound"
  | "Network"
  | "Presentation"
  | "Layers"
  | "Activity"
  | "SlidersHorizontal"
  | "ScrollText"
  | "Newspaper"
  | "Contact"
  | "Workflow"
  | "Shield"
  | "ClipboardCheck"
  | "Flag"
  | "Crown"
  | "BadgeCheck"
  | "Zap"
  | "Megaphone"
  | "GitBranch"
  | "Handshake"
  | "Crosshair"
  | "UserCircle"
  // P3-005: Diversified icons — eliminate duplicate icon usage across NAV items.
  | "Building"
  | "Landmark"
  | "Castle"
  | "FileCheck"
  | "Factory"
  | "Banknote"
  | "Receipt"
  | "BarChart3"
  | "Gauge"
  | "PieChart"
  | "CheckCircle2"
  | "Briefcase";

export type NavItem = {
  href: string;
  label: string;
  /** Lucide icon component name (string) — resolved by the consumer. */
  icon: NavIconName;
  group: string;
};

// ─── Translation maps ───────────────────────────────────────────────────

/** Translation map: English label → i18n key. */
export const NAV_I18N: Record<string, string> = {
  "Overview": "nav.overview",
  "Constitutional Holdings": "nav.portfolio",
  "Capital Participation": "nav.opportunities",
  "Enterprise Registry": "nav.market",
  "Priority Windows": "nav.priorityWindows",
  "Constitutional Calendar": "nav.calendar",
  "Enterprise Updates": "nav.updates",
  "Syndicates": "nav.syndicates",
  "Career Ledger": "nav.careerLedger",
  "Mentorship": "nav.mentorship",
  "Skill-to-Equity": "nav.skillEquity",
  "AI Salary Engine": "nav.salary",
  "Diaspora Bridge": "nav.diaspora",
  "Governance": "nav.governance",
  "Manager Console": "nav.manager",
  "Founding Operator Studio": "nav.founder",
  "Enterprise Profile": "nav.enterpriseProfile",
  "Pitch Deck Generator": "nav.pitchDeck",
  "Milestone Designer": "nav.milestoneDesigner",
  "Board Member Console": "nav.boardMember",
  "Board Briefings": "nav.boardBriefings",
  "Succession Planner": "nav.succession",
  "Partner CRM": "nav.partnerCrm",
  "Brain AI Status": "nav.brainAi",
  "Precedent Engine": "nav.precedents",
  "Drift Detector": "nav.drift",
  "Anomaly Narration": "nav.anomalies",
  "Charter Diff": "nav.charterDiff",
  "Constitution Guide": "nav.constitutionGuide",
  "Notifications": "nav.notifications",
  "AI Copilot": "nav.copilot",
  "Compliance": "nav.compliance",
  "Workforce Registry": "nav.workforce",
  "Whistleblower": "nav.whistleblower",
  "Appeal Court": "nav.appeals",
  "Risk Disclosure": "nav.riskDisclosure",
  "Vendor Portal": "nav.vendorPortal",
  "Law Firm Client Accounts": "nav.escrow",
  "Anti-Fragility Vault": "nav.antifragility",
  "Insurance Vault": "nav.vault",
  "Proof-of-Solvency": "nav.solvency",
  "Oracle Mirror": "nav.oracleMirror",
  "Reality Sync": "nav.realitySync",
  "Institutional Memory": "nav.institutionalMemory",
  "Graduation": "nav.graduation",
  "Graduation Coach": "nav.graduationCoach",
  "Graduation Simulator": "nav.graduationSimulator",
  "Survival Drill": "nav.survivalDrill",
  "Alumni Hall": "nav.alumni",
  "Tax Optimizer": "nav.tax",
  "Capital Partner Relations": "nav.ir",
  "DRIP (Dividend Reinvest)": "nav.drip",
  "Partner Management": "nav.adminUsers",
  "Enterprise Management": "nav.adminEnterprises",
  "Steward Dashboard": "nav.steward",
  "Institutional Architecture": "nav.architecture",
  "Governance System": "nav.governanceModel",
  "Institutional Readiness": "nav.institutionalReadiness",
  "Operating System (AOS)": "nav.operatingSystem",
  "Commercialization (ACS)": "nav.commercialization",
  "Production Readiness": "nav.productionReadiness",
  "Pilot Execution": "nav.pilotExecution",
  "Global Launch (GLS)": "nav.globalLaunch",
  "Founder Landmark (FOCC)": "nav.founderOffice",
  "Institutional Trust (ITDB)": "nav.institutionalTrust",
  "Market Execution (MES)": "nav.marketExecution",
  "Market Activation": "nav.marketActivation",
  "Customer Conversion": "nav.customerConversion",
  "Strategic Partners": "nav.strategicPartners",
  "Execution War Room": "nav.executionWarRoom",
  "First 25 Research": "nav.firstResearch",
  "Constitutional Audit": "nav.constitutionalAudit",
  "Audit Log Viewer": "nav.auditLog",
  "Institutional Settings": "nav.adminSettings",
  "Platform Admin Panel": "nav.adminPanel",
  "FRA Regulatory": "nav.fra",
  "Company Owner": "nav.companyOwner",
  "Law Firm Rep": "nav.lawFirm",
  "Accounting Firm": "nav.accounting",
  "Industry Modules": "nav.industry",
  "Federation": "nav.federation",
  "VC Wallet": "nav.credentials",
  "University Rep Console": "nav.university",
  "Profile & Identity": "nav.profile",
};

/** Group translation map: group name → i18n key. */
export const GROUP_I18N: Record<string, string> = {
  "Workspace": "group.workspace",
  "Capital & Workforce": "group.capitalWorkforce",
  "Enterprise": "group.enterprise",
  "Intelligence": "group.intelligence",
  "Compliance & Transparency": "group.compliance",
  "Treasury & Infrastructure": "group.treasury",
  "Graduation & Sovereignty": "group.graduation",
  "Institutional Services": "group.services",
  "Platform Admin": "group.admin",
};

// ─── NAV array ──────────────────────────────────────────────────────────

export const NAV: NavItem[] = [
  // ── Workspace ──
  { href: "/dashboard", label: "Overview", icon: "LayoutDashboard", group: "Workspace" },
  { href: "/dashboard/portfolio", label: "Constitutional Holdings", icon: "Wallet", group: "Workspace" },
  { href: "/dashboard/opportunities", label: "Capital Participation", icon: "Compass", group: "Workspace" },
  { href: "/dashboard/market", label: "Enterprise Registry", icon: "LineChart", group: "Workspace" },
  { href: "/dashboard/priority-windows", label: "Priority Windows", icon: "Hourglass", group: "Workspace" },
  { href: "/dashboard/calendar", label: "Constitutional Calendar", icon: "CalendarDays", group: "Workspace" },
  { href: "/dashboard/updates", label: "Enterprise Updates", icon: "Newspaper", group: "Workspace" },
  // P1-002: Profile entry in the sidebar so it is discoverable on mobile
  // (previously only reachable via the avatar dropdown).
  { href: "/dashboard/profile", label: "Profile & Identity", icon: "UserCircle", group: "Workspace" },

  // ── Capital & Workforce ──
  { href: "/dashboard/syndicates", label: "Syndicates", icon: "Users", group: "Capital & Workforce" },
  { href: "/dashboard/career-ledger", label: "Career Ledger", icon: "HardHat", group: "Capital & Workforce" },
  { href: "/dashboard/mentorship", label: "Mentorship", icon: "UserCheck", group: "Capital & Workforce" },
  { href: "/dashboard/skill-equity", label: "Skill-to-Equity", icon: "Award", group: "Capital & Workforce" },
  { href: "/dashboard/salary", label: "AI Salary Engine", icon: "Calculator", group: "Capital & Workforce" },
  { href: "/dashboard/diaspora", label: "Diaspora Bridge", icon: "Globe", group: "Capital & Workforce" },

  // ── Enterprise ──
  { href: "/dashboard/governance", label: "Governance", icon: "Scale", group: "Enterprise" },
  { href: "/dashboard/manager", label: "Manager Console", icon: "Settings2", group: "Enterprise" },
  { href: "/dashboard/founder", label: "Founding Operator Studio", icon: "Rocket", group: "Enterprise" },
  { href: "/dashboard/enterprise-profile", label: "Enterprise Profile", icon: "Building2", group: "Enterprise" },
  { href: "/dashboard/pitch-deck", label: "Pitch Deck Generator", icon: "Presentation", group: "Enterprise" },
  { href: "/dashboard/milestone-designer", label: "Milestone Designer", icon: "Target", group: "Enterprise" },
  { href: "/dashboard/board-member", label: "Board Member Console", icon: "Gavel", group: "Enterprise" },
  { href: "/dashboard/board-briefings", label: "Board Briefings", icon: "ClipboardList", group: "Enterprise" },
  { href: "/dashboard/succession", label: "Succession Planner", icon: "UserCheck", group: "Enterprise" },
  { href: "/dashboard/partner-crm", label: "Partner CRM", icon: "Contact", group: "Enterprise" },

  // ── Intelligence ──
  { href: "/dashboard/brain-ai", label: "Brain AI Status", icon: "Brain", group: "Intelligence" },
  { href: "/dashboard/precedents", label: "Precedent Engine", icon: "FileSearch", group: "Intelligence" },
  { href: "/dashboard/drift", label: "Drift Detector", icon: "TrendingUp", group: "Intelligence" },
  { href: "/dashboard/anomalies", label: "Anomaly Narration", icon: "AlertTriangle", group: "Intelligence" },
  { href: "/dashboard/charter-diff", label: "Charter Diff", icon: "GitCompare", group: "Intelligence" },
  { href: "/dashboard/constitution", label: "Constitution Guide", icon: "Languages", group: "Intelligence" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "Bell", group: "Intelligence" },
  { href: "/dashboard/copilot", label: "AI Copilot", icon: "Bot", group: "Intelligence" },

  // ── Compliance & Transparency ──
  { href: "/dashboard/compliance", label: "Compliance", icon: "ShieldCheck", group: "Compliance & Transparency" },
  { href: "/dashboard/workforce", label: "Workforce Registry", icon: "Users", group: "Compliance & Transparency" },
  { href: "/dashboard/whistleblower", label: "Whistleblower", icon: "ShieldAlert", group: "Compliance & Transparency" },
  { href: "/dashboard/appeals", label: "Appeal Court", icon: "Gavel", group: "Compliance & Transparency" },
  { href: "/dashboard/risk-disclosure", label: "Risk Disclosure", icon: "AlertTriangle", group: "Compliance & Transparency" },
  { href: "/dashboard/vendor-portal", label: "Vendor Portal", icon: "Truck", group: "Compliance & Transparency" },

  // ── Treasury & Infrastructure ──
  { href: "/dashboard/escrow", label: "Law Firm Client Accounts", icon: "Vault", group: "Treasury & Infrastructure" },
  { href: "/dashboard/antifragility", label: "Anti-Fragility Vault", icon: "Database", group: "Treasury & Infrastructure" },
  { href: "/dashboard/vault", label: "Insurance Vault", icon: "Database", group: "Treasury & Infrastructure" },
  // P3-005: ShieldCheck is reserved for Compliance; Proof-of-Solvency uses FileCheck to avoid icon duplication.
  { href: "/dashboard/solvency", label: "Proof-of-Solvency", icon: "FileCheck", group: "Treasury & Infrastructure" },
  { href: "/dashboard/oracle-mirror", label: "Oracle Mirror", icon: "FileText", group: "Treasury & Infrastructure" },
  { href: "/dashboard/reality-sync", label: "Reality Sync", icon: "Activity", group: "Treasury & Infrastructure" },
  { href: "/dashboard/institutional-memory", label: "Institutional Memory", icon: "Layers", group: "Treasury & Infrastructure" },

  // ── Graduation & Sovereignty ──
  { href: "/dashboard/graduation", label: "Graduation", icon: "GraduationCap", group: "Graduation & Sovereignty" },
  // P3-005: TrendingUp is reserved for Drift Detector; Graduation Coach uses BarChart3.
  { href: "/dashboard/graduation-coach", label: "Graduation Coach", icon: "BarChart3", group: "Graduation & Sovereignty" },
  { href: "/dashboard/graduation-simulator", label: "Graduation Simulator", icon: "FlaskConical", group: "Graduation & Sovereignty" },
  { href: "/dashboard/survival-drill", label: "Survival Drill", icon: "HeartPulse", group: "Graduation & Sovereignty" },
  { href: "/dashboard/alumni", label: "Alumni Hall", icon: "Award", group: "Graduation & Sovereignty" },

  // ── Platform Admin ──
  { href: "/dashboard/admin/users", label: "Partner Management", icon: "Users", group: "Platform Admin" },
  // P3-005: Building2 is reserved for Enterprise Profile; Enterprise Management uses Building.
  { href: "/dashboard/admin/enterprises", label: "Enterprise Management", icon: "Building", group: "Platform Admin" },
  { href: "/dashboard/steward", label: "Steward Dashboard", icon: "Cpu", group: "Platform Admin" },
  // P3-005: Institutional Architecture uses Landmark (distinct from Building2/Building/Landmark).
  { href: "/dashboard/architecture", label: "Institutional Architecture", icon: "Landmark", group: "Platform Admin" },
  { href: "/dashboard/governance-model", label: "Governance System", icon: "ScrollText", group: "Platform Admin" },
  { href: "/dashboard/institutional-readiness", label: "Institutional Readiness", icon: "Shield", group: "Platform Admin" },
  { href: "/dashboard/operating-system", label: "Operating System (AOS)", icon: "Workflow", group: "Platform Admin" },
  // P3-005: Commercialization uses Gauge (progress dial) instead of TrendingUp.
  { href: "/dashboard/commercialization", label: "Commercialization (ACS)", icon: "Gauge", group: "Platform Admin" },
  // P3-005: Production Readiness uses Factory (semantic match) instead of ShieldCheck.
  { href: "/dashboard/production-readiness", label: "Production Readiness", icon: "Factory", group: "Platform Admin" },
  { href: "/dashboard/pilot-execution", label: "Pilot Execution", icon: "ClipboardCheck", group: "Platform Admin" },
  { href: "/dashboard/global-launch", label: "Global Launch (GLS)", icon: "Flag", group: "Platform Admin" },
  { href: "/dashboard/founder-office", label: "Founder Landmark (FOCC)", icon: "Crown", group: "Platform Admin" },
  { href: "/dashboard/institutional-trust", label: "Institutional Trust (ITDB)", icon: "BadgeCheck", group: "Platform Admin" },
  { href: "/dashboard/market-execution", label: "Market Execution (MES)", icon: "Zap", group: "Platform Admin" },
  { href: "/dashboard/market-activation", label: "Market Activation", icon: "Megaphone", group: "Platform Admin" },
  { href: "/dashboard/customer-conversion", label: "Customer Conversion", icon: "GitBranch", group: "Platform Admin" },
  { href: "/dashboard/strategic-partners", label: "Strategic Partners", icon: "Handshake", group: "Platform Admin" },
  { href: "/dashboard/execution-war-room", label: "Execution War Room", icon: "Crosshair", group: "Platform Admin" },
  { href: "/dashboard/first-research", label: "First 25 Research", icon: "Target", group: "Platform Admin" },
  // P3-005: Scale is reserved for Governance; Constitutional Audit uses CheckCircle2.
  { href: "/dashboard/constitutional-audit", label: "Constitutional Audit", icon: "CheckCircle2", group: "Platform Admin" },
  { href: "/dashboard/admin/audit", label: "Audit Log Viewer", icon: "ScrollText", group: "Platform Admin" },
  { href: "/dashboard/admin/settings", label: "Institutional Settings", icon: "SlidersHorizontal", group: "Platform Admin" },
  { href: "/dashboard/admin-panel", label: "Platform Admin Panel", icon: "ShieldAlert", group: "Platform Admin" },
  { href: "/dashboard/fra", label: "FRA Regulatory", icon: "Landmark", group: "Platform Admin" },
  // P3-005: Company Owner uses Castle (distinct sovereign-enterprise metaphor) instead of Building2.
  { href: "/dashboard/company-owner", label: "Company Owner", icon: "Castle", group: "Platform Admin" },
  // P3-005: Scale is reserved for Governance; Law Firm Rep uses Briefcase (professional services).
  { href: "/dashboard/law-firm", label: "Law Firm Rep", icon: "Briefcase", group: "Platform Admin" },
  // P3-005: Calculator is reserved for AI Salary Engine; Accounting Firm uses Banknote.
  { href: "/dashboard/accounting", label: "Accounting Firm", icon: "Banknote", group: "Platform Admin" },
  { href: "/dashboard/industry", label: "Industry Modules", icon: "FlaskConical", group: "Platform Admin" },
  { href: "/dashboard/federation", label: "Federation", icon: "Network", group: "Platform Admin" },
  { href: "/dashboard/credentials", label: "VC Wallet", icon: "KeyRound", group: "Platform Admin" },
  { href: "/dashboard/university", label: "University Rep Console", icon: "GraduationCap", group: "Platform Admin" },

  // ── Institutional Services ──
  // P3-005: Calculator is reserved for AI Salary Engine; Tax Optimizer uses Receipt (tax-receipt metaphor).
  { href: "/dashboard/tax", label: "Tax Optimizer", icon: "Receipt", group: "Institutional Services" },
  { href: "/dashboard/ir", label: "Capital Partner Relations", icon: "MessageSquare", group: "Institutional Services" },
  // P3-005: TrendingUp is reserved for Drift Detector; DRIP uses PieChart (dividend share of holdings).
  { href: "/dashboard/drip", label: "DRIP (Dividend Reinvest)", icon: "PieChart", group: "Institutional Services" },
];

// ─── Groups ─────────────────────────────────────────────────────────────

/**
 * Canonical ordered list of all sidebar group names.
 * Used by the sidebar, command palette, and onboarding copy.
 */
export const NAV_GROUPS: string[] = [
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

/** Default group ordering (capital partner view). */
export const DEFAULT_GROUP_ORDER: string[] = NAV_GROUPS;

// ─── Role-based helpers ─────────────────────────────────────────────────

/**
 * Returns the group order to display for a given role set.
 * Operator seats (manager / founding_operator) see Enterprise first.
 */
export function groupOrderForRoles(roles: Set<string>): string[] {
  const isOperator = roles.has("manager") || roles.has("founding_operator");
  if (isOperator) {
    return [
      "Enterprise",
      "Workspace",
      "Intelligence",
      "Capital & Workforce",
      "Compliance & Transparency",
      "Treasury & Infrastructure",
      "Graduation & Sovereignty",
      "Institutional Services",
      "Platform Admin",
    ];
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
 *  - Platform Admin → only if user holds an aurienta_rep / university_rep /
 *    law_firm_rep / accounting_firm_rep / company_owner seat.
 */
export function visibleGroupsForRoles(roles: Set<string>): Set<string> {
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

  // Platform Admin — institutional reps + company owners + university reps.
  // P1-001: university_rep added so university reps can reach /dashboard/university.
  if (
    has("aurienta_rep") ||
    has("university_rep") ||
    has("law_firm_rep") ||
    has("accounting_firm_rep") ||
    has("company_owner")
  ) {
    visible.add("Platform Admin");
  }

  return visible;
}

// ─── Lookup helpers ─────────────────────────────────────────────────────

/**
 * Returns the canonical sidebar label for a given href, or `undefined` if no
 * matching nav item exists. Used by breadcrumbs (P2-002) and other surfaces
 * that need to display the same label the sidebar uses.
 *
 * Note: this returns the English source label. Consumers wanting the localized
 * version should pass this label through their i18n `t()` lookup using
 * `NAV_I18N[label]` (see dashboard-shell.tNav).
 */
export function getNavLabel(href: string): string | undefined {
  return NAV.find((n) => n.href === href)?.label;
}

/** Returns the icon NAME (string) for a given href, or undefined. */
export function getNavIconName(href: string): NavIconName | undefined {
  return NAV.find((n) => n.href === href)?.icon;
}

/** Returns the group name for a given href, or undefined. */
export function getNavGroup(href: string): string | undefined {
  return NAV.find((n) => n.href === href)?.group;
}

/**
 * Returns all unique hrefs present in NAV.
 * Useful for sanity checks (e.g. confirming command palette coverage).
 */
export function getAllNavRoutes(): string[] {
  return NAV.map((n) => n.href);
}

/**
 * Returns NAV items whose `group` is in the given set.
 * Preserves the canonical NAV ordering.
 */
export function navItemsForGroups(groups: Set<string>): NavItem[] {
  return NAV.filter((n) => groups.has(n.group));
}
