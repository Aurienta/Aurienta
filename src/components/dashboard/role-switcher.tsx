"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Wallet, HardHat, Settings, Users, Building2, Scale, Shield,
  Cpu, GraduationCap, ChevronDown, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

const ROLE_ICONS: Record<string, React.ElementType> = {
  capital_partner: Wallet,
  founding_operator: Crown,
  workforce_partner: HardHat,
  manager: Settings,
  board_member: Users,
  company_owner: Building2,
  law_firm_rep: Scale,
  accounting_firm_rep: Shield,
  aurienta_rep: Cpu,
  university_rep: GraduationCap,
};

/**
 * RoleSwitcher — an explicit role selector for users with multiple roles.
 *
 * Shows the active role prominently. When clicked, reveals all available
 * roles for the current enterprise. Selecting a role updates the
 * RoleContext, which triggers nav filtering, dashboard changes, and
 * permission scoping.
 *
 * SECURITY: The client selection is a convenience only. Every API call
 * independently verifies the user's actual role via EnterpriseMember
 * records server-side. Switching to a role the user doesn't hold has
 * no effect — APIs will deny access.
 */
export function RoleSwitcher({
  memberships,
  selectedEntId,
  activeRole,
  onSelectRole,
}: {
  memberships: { role: string; enterprise: { id: string; name: string } }[];
  selectedEntId: string | null;
  activeRole: string | null;
  onSelectRole: (role: string) => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Get roles for the active enterprise
  const activeEntRoles = selectedEntId
    ? memberships.filter((m) => m.enterprise.id === selectedEntId).map((m) => m.role)
    : memberships.map((m) => m.role);

  // Deduplicate roles (user may have same role in multiple enterprises)
  const uniqueRoles = [...new Set(activeEntRoles)];

  // If only one role, don't show the switcher — just the badge
  if (uniqueRoles.length <= 1) {
    const role = activeRole || uniqueRoles[0];
    if (!role) return null;
    const Icon = ROLE_ICONS[role] ?? Users;
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-gold/15 bg-gold/[0.03] px-2.5 py-1 text-xs">
        <Icon className="h-3.5 w-3.5 text-gold/70" />
        <span className="font-medium text-foreground">{t(`role.${role}`) || role.replace(/_/g, " ")}</span>
      </div>
    );
  }

  const currentIcon = ROLE_ICONS[activeRole ?? uniqueRoles[0]] ?? Users;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-gold/20 bg-gold/[0.05] px-2.5 py-1 text-xs transition-colors hover:border-gold/40 hover:bg-gold/10"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("ui.role") || "Switch role"}
      >
        <currentIcon className="h-3.5 w-3.5 text-gold" />
        <span className="font-medium text-foreground">
          {activeRole ? (t(`role.${activeRole}`) || activeRole.replace(/_/g, " ")) : "Select role"}
        </span>
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-1 min-w-[200px] overflow-hidden rounded-xl border border-gold/20 bg-background shadow-xl"
            role="listbox"
          >
            <div className="border-b border-gold/10 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("ui.role") || "Active Role"}
            </div>
            <div className="py-1">
              {uniqueRoles.map((role) => {
                const Icon = ROLE_ICONS[role] ?? Users;
                const isActive = role === activeRole;
                return (
                  <button
                    key={role}
                    onClick={() => {
                      onSelectRole(role);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-gold/5",
                      isActive && "bg-gold/10"
                    )}
                    role="option"
                    aria-selected={isActive}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isActive ? "text-gold" : "text-muted-foreground")} />
                    <span className={cn("flex-1", isActive ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {t(`role.${role}`) || role.replace(/_/g, " ")}
                    </span>
                    {isActive && <Check className="h-3.5 w-3.5 text-gold" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
