"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Building2, Shield, Crown, Wallet, HardHat, Settings, Users, Scale, GraduationCap, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TIER_META, STAGE_META } from "@/lib/aurienta/constants";
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
 * RoleContextBar — a slim global bar that shows the user's current
 * role context: active role(s), active enterprise, tier, stage, and
 * constitutional health. Always visible at the top of the workspace.
 *
 * This answers the user's first question: "Who am I acting as, and
 * which enterprise am I acting within?"
 */
export function RoleContextBar({
  user,
  selectedEntId,
  activeRole,
}: {
  user: {
    legalName: string;
    sovereignTrustScore: number;
    tier: string;
    memberships: { role: string; enterprise: { id: string; name: string; slug: string; tier: string; stage?: string; healthScore?: number | null } }[];
  };
  selectedEntId: string | null;
  activeRole: string | null;
}) {
  const { t } = useLanguage();
  const pathname = usePathname();

  // Find the active enterprise
  const activeEnterprise = selectedEntId
    ? user.memberships.find((m) => m.enterprise.id === selectedEntId)?.enterprise
    : user.memberships[0]?.enterprise;

  // Get the active role (single role, not all roles)
  const displayRole = activeRole ||
    (selectedEntId
      ? user.memberships.find((m) => m.enterprise.id === selectedEntId)?.role
      : user.memberships[0]?.role);

  if (!activeEnterprise || !displayRole) return null;

  const tierMeta = TIER_META[activeEnterprise.tier];
  const stageMeta = STAGE_META[activeEnterprise.stage ?? "stage_1"] ?? STAGE_META.stage_1;
  const healthScore = activeEnterprise.healthScore ?? 75;
  const healthColor = healthScore >= 90 ? "text-emerald-400" : healthScore >= 70 ? "text-amber-400" : "text-red-400";
  const healthLabel = healthScore >= 90 ? "Healthy" : healthScore >= 70 ? "Attention" : "Action Required";

  const RoleIcon = ROLE_ICONS[displayRole] ?? Users;
  const roleLabel = t(`role.${displayRole}`) || displayRole.replace(/_/g, " ");

  return (
    <div className="flex items-center gap-2 border-b border-gold/10 bg-background/60 px-3 py-1.5 text-xs backdrop-blur-sm sm:px-4">
      {/* Mobile compact: role + enterprise only */}
      <div className="flex items-center gap-1.5 sm:hidden">
        <RoleIcon className="h-3 w-3 text-gold/70" />
        <span className="font-medium text-foreground">{roleLabel}</span>
        <span className="text-gold/20">·</span>
        <span className="truncate text-muted-foreground">{activeEnterprise.name}</span>
        <span className={cn("ml-auto font-mono", healthColor)}>{healthScore}</span>
      </div>

      {/* Desktop full: role + enterprise + tier + stage + health + STS */}
      <div className="hidden items-center gap-2 sm:flex">
        {/* Role */}
        <div className="flex items-center gap-1.5">
          <Shield className="h-3 w-3 text-gold/60" />
          <span className="text-muted-foreground">{t("ui.role") || "Role"}:</span>
          <Badge variant="outline" className="border-gold/20 px-1.5 py-0 text-[10px] font-medium">
            <RoleIcon className="mr-1 h-2.5 w-2.5 text-gold/70" />
            {roleLabel}
          </Badge>
        </div>

        {/* Divider */}
        <span className="text-gold/20">|</span>

        {/* Enterprise */}
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3 w-3 text-gold/60" />
          <span className="font-medium text-foreground">{activeEnterprise.name}</span>
        </div>

        {/* Tier */}
        {tierMeta && (
          <>
            <span className="text-gold/20">|</span>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">{t("ui.tier") || "Tier"}:</span>
              <Badge variant="outline" className="border-gold/20 px-1.5 py-0 text-[10px]">
                {activeEnterprise.tier} — {tierMeta.name}
              </Badge>
            </div>
          </>
        )}

        {/* Stage */}
        <span className="text-gold/20">|</span>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">{t("ui.stage") || "Stage"}:</span>
          <span className="text-foreground">{stageMeta.name}</span>
        </div>

        {/* Health */}
        <span className="text-gold/20">|</span>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">{t("ui.health") || "Health"}:</span>
          <span className={cn("font-medium", healthColor)}>{healthLabel}</span>
          <span className={cn("font-mono", healthColor)}>{healthScore}</span>
        </div>

        {/* STS score */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-muted-foreground">STS:</span>
          <span className="font-mono text-gold">{user.sovereignTrustScore}</span>
        </div>
      </div>
    </div>
  );
}
