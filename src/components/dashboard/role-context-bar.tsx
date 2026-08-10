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
}: {
  user: {
    legalName: string;
    sovereignTrustScore: number;
    tier: string;
    memberships: { role: string; enterprise: { id: string; name: string; slug: string; tier: string; stage: string; healthScore: number | null } }[];
  };
  selectedEntId: string | null;
}) {
  const { t } = useLanguage();
  const pathname = usePathname();

  // Find the active enterprise
  const activeEnterprise = selectedEntId
    ? user.memberships.find((m) => m.enterprise.id === selectedEntId)?.enterprise
    : user.memberships[0]?.enterprise;

  // Get the user's roles for the active enterprise
  const activeRoles = selectedEntId
    ? user.memberships.filter((m) => m.enterprise.id === selectedEntId).map((m) => m.role)
    : user.memberships.map((m) => m.role);

  if (!activeEnterprise) return null;

  const tierMeta = TIER_META[activeEnterprise.tier];
  const stageMeta = STAGE_META[activeEnterprise.stage] ?? STAGE_META.stage_1;
  const healthScore = activeEnterprise.healthScore ?? 75;
  const healthColor = healthScore >= 90 ? "text-emerald-400" : healthScore >= 70 ? "text-amber-400" : "text-red-400";
  const healthLabel = healthScore >= 90 ? "Healthy" : healthScore >= 70 ? "Attention" : "Action Required";

  return (
    <div className="flex items-center gap-2 border-b border-gold/10 bg-background/60 px-4 py-1.5 text-xs backdrop-blur-sm">
      {/* Role badges */}
      <div className="flex items-center gap-1.5">
        <Shield className="h-3 w-3 text-gold/60" />
        <span className="text-muted-foreground">{t("ui.role") || "Role"}:</span>
        <div className="flex flex-wrap items-center gap-1">
          {activeRoles.slice(0, 3).map((role) => {
            const Icon = ROLE_ICONS[role] ?? Users;
            const roleKey = `role.${role}`;
            return (
              <Badge key={role} variant="outline" className="border-gold/20 px-1.5 py-0 text-[10px] font-medium">
                <Icon className="mr-1 h-2.5 w-2.5 text-gold/70" />
                {t(roleKey) || role.replace(/_/g, " ")}
              </Badge>
            );
          })}
          {activeRoles.length > 3 && (
            <span className="text-muted-foreground">+{activeRoles.length - 3}</span>
          )}
        </div>
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
  );
}
