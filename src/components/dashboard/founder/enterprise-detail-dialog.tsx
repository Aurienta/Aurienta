"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { egp, pct, timeAgo, timeRemaining } from "@/lib/aurienta/format";
import { computeDynamicMinimum } from "@/lib/aurienta/cre";
import {
  Activity,
  Banknote,
  ChevronRight,
  Clock,
  FileCheck,
  FileText,
  Flag,
  GraduationCap,
  Layers,
  ScrollText,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { FounderEnterprise, FounderMilestone } from "./types";
import {
  enterpriseStatus,
  HealthPill,
  milestoneStatus,
  TierBadge,
} from "./badges";
import { MilestoneEvidenceDialog } from "./milestone-evidence-dialog";

const LEDGER_ICONS: Record<string, React.ElementType> = {
  share_issued: Share2,
  funds_received: Banknote,
  milestone_released: FileCheck,
  expense_approved: FileCheck,
  proposal_executed: Flag,
  cre_decision: Activity,
  graduation: GraduationCap,
  share_transferred: Share2,
  dividend_paid: Banknote,
};

const LEDGER_LABELS: Record<string, string> = {
  share_issued: "Equity units issued",
  funds_received: "Funds received in Law Firm Client Account",
  milestone_released: "Milestone activity",
  expense_approved: "Expense approved",
  proposal_executed: "Proposal executed",
  cre_decision: "CRE decision logged",
  graduation: "Enterprise graduated",
  share_transferred: "Units transferred",
  dividend_paid: "Dividend distributed",
};

export function EnterpriseDetailDialog({
  enterprise,
  open,
  onOpenChange,
  onMilestoneSubmitted,
}: {
  enterprise: FounderEnterprise | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onMilestoneSubmitted: (updated: FounderMilestone) => void;
}) {
  const [evidenceTarget, setEvidenceTarget] = React.useState<FounderMilestone | null>(null);
  const [evidenceOpen, setEvidenceOpen] = React.useState(false);

  if (!enterprise) return null;

  const raisedPct = enterprise.fundraisingGoalEgp > 0
    ? Math.min(100, (enterprise.raisedEgp / enterprise.fundraisingGoalEgp) * 100)
    : 0;
  const remainingGoal = Math.max(0, enterprise.fundraisingGoalEgp - enterprise.raisedEgp);
  const remainingSlots = enterprise.investorCap
    ? Math.max(0, enterprise.investorCap - enterprise.investorCount)
    : 999;
  const dynamicMin = computeDynamicMinimum(
    remainingGoal,
    remainingSlots,
    enterprise.tier
  );
  const runway =
    enterprise.monthlyBurnEgp > 0
      ? enterprise.lawFirmClientAccountBalanceEgp / enterprise.monthlyBurnEgp
      : 0;

  const openEvidence = (m: FounderMilestone) => {
    setEvidenceTarget(m);
    setEvidenceOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-h-[92vh] overflow-y-auto border-gold/20 bg-popover sm:max-w-3xl"
          showCloseButton
        >
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2.5">
              <TierBadge tier={enterprise.tier} />
              <HealthPill rating={enterprise.healthRating} />
              <StatusBadge status={enterprise.status} />
              <Badge
                variant="outline"
                className="border-gold/15 bg-transparent text-xs text-muted-foreground"
              >
                {enterprise.sector}
              </Badge>
            </div>
            <DialogTitle className="font-serif text-2xl">{enterprise.name}</DialogTitle>
            {enterprise.tagline && (
              <DialogDescription className="font-sans text-sm text-muted-foreground">
                {enterprise.tagline}
              </DialogDescription>
            )}
          </DialogHeader>

          <Tabs defaultValue="overview" className="gap-4">
            <TabsList className="h-10 w-full justify-start gap-1 rounded-lg border border-gold/10 bg-background/40 p-1">
              <TabsTrigger value="overview" className="h-8 flex-1 sm:flex-none sm:px-4">
                <Layers className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="milestones" className="h-8 flex-1 sm:flex-none sm:px-4">
                <Target className="h-3.5 w-3.5" /> Milestones
              </TabsTrigger>
              <TabsTrigger value="capital formation" className="h-8 flex-1 sm:flex-none sm:px-4">
                <Wallet className="h-3.5 w-3.5" /> Capital Formation
              </TabsTrigger>
              <TabsTrigger value="ledger" className="h-8 flex-1 sm:flex-none sm:px-4">
                <ScrollText className="h-3.5 w-3.5" /> Ledger
              </TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="flex flex-col gap-4">
              <div className="rounded-xl border border-gold/12 bg-background/40 p-4">
                <p className="font-sans text-sm leading-relaxed text-foreground/85">
                  {enterprise.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile
                  icon={Wallet}
                  label="Law Firm Client Account"
                  value={egp(enterprise.lawFirmClientAccountBalanceEgp, { compact: true })}
                />
                <StatTile
                  icon={TrendingUp}
                  label="Revenue / mo"
                  value={egp(enterprise.monthlyRevenueEgp, { compact: true })}
                />
                <StatTile
                  icon={Clock}
                  label="Runway"
                  value={runway > 0 ? `${runway.toFixed(1)} mo` : "—"}
                />
                <StatTile
                  icon={Users}
                  label="Workforce"
                  value={`${enterprise.employeeCount}`}
                />
                <StatTile
                  icon={Sparkles}
                  label="Gross margin"
                  value={pct(enterprise.grossMarginPct, 0)}
                />
                <StatTile
                  icon={TrendingUp}
                  label="Rev. growth"
                  value={pct(enterprise.revenueGrowthPct, 0)}
                />
                <StatTile
                  icon={FileCheck}
                  label="NOSI"
                  value={pct(enterprise.nosiCompliantPct, 0)}
                />
                <StatTile
                  icon={GraduationCap}
                  label="Readiness"
                  value={`${enterprise.graduationReadiness}/100`}
                />
              </div>
              <div className="rounded-xl border border-gold/10 bg-gold/[0.03] p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono uppercase tracking-wider text-muted-foreground">
                    Capital Formation progress
                  </span>
                  <span className="font-mono text-gold-light">
                    {raisedPct.toFixed(1)}%
                  </span>
                </div>
                <Progress value={raisedPct} className="mt-2 h-2 bg-gold/10" />
                <div className="mt-2 flex items-center justify-between font-sans text-[11px] text-muted-foreground">
                  <span>{egp(enterprise.raisedEgp, { compact: true })} raised</span>
                  <span>{egp(enterprise.fundraisingGoalEgp, { compact: true })} goal</span>
                </div>
              </div>
            </TabsContent>

            {/* Milestones */}
            <TabsContent value="milestones" className="flex flex-col gap-3">
              {enterprise.milestones.length === 0 ? (
                <div className="rounded-xl border border-gold/12 bg-background/40 p-8 text-center">
                  <Target className="mx-auto h-8 w-8 text-gold/40" />
                  <p className="mt-3 font-sans text-sm text-muted-foreground">
                    No milestones have been constituted yet.
                  </p>
                </div>
              ) : (
                enterprise.milestones.map((m) => (
                  <MilestoneRow
                    key={m.id}
                    milestone={m}
                    onSubmit={() => openEvidence(m)}
                  />
                ))
              )}
            </TabsContent>

            {/* Capital Formation */}
            <TabsContent value="capital formation" className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <StatTile
                  icon={Wallet}
                  label="Capital Participated"
                  value={egp(enterprise.raisedEgp)}
                />
                <StatTile
                  icon={Target}
                  label="Goal"
                  value={egp(enterprise.fundraisingGoalEgp)}
                />
                <StatTile
                  icon={Share2}
                  label="Share price"
                  value={`${enterprise.equityUnitPriceEgp.toLocaleString()} EGP`}
                />
                <StatTile
                  icon={Layers}
                  label="Total units"
                  value={enterprise.totalEquityUnits.toLocaleString()}
                />
                <StatTile
                  icon={Users}
                  label="investors"
                  value={`${enterprise.investorCount}${enterprise.investorCap ? ` / ${enterprise.investorCap}` : ""}`}
                />
                <StatTile
                  icon={Sparkles}
                  label="Dynamic minimum"
                  value={egp(dynamicMin)}
                />
                <StatTile
                  icon={TrendingUp}
                  label="Founder equity"
                  value={pct(enterprise.founderEquityPct, 0)}
                />
                <StatTile
                  icon={ScrollText}
                  label="Platform fee"
                  value={pct(enterprise.platformFeePct, 1)}
                />
              </div>

              <div className="rounded-xl border border-gold/12 bg-background/40 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-sans text-xs font-medium text-foreground">
                    Consulting fee
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      enterprise.consultingOptOut
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : "border-gold/20 bg-gold/5 text-gold-light"
                    }
                  >
                    {enterprise.consultingOptOut ? "Opted out" : pct(enterprise.consultingFeePct, 1)}
                  </Badge>
                </div>
                <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
                  After 3 profitable quarters or 2 years, Constitutional Partners may vote (simple majority) to opt out of the consulting fee.
                </p>
              </div>
            </TabsContent>

            {/* Ledger */}
            <TabsContent value="ledger" className="flex flex-col gap-3">
              {enterprise.ledgerEvents.length === 0 ? (
                <div className="rounded-xl border border-gold/12 bg-background/40 p-8 text-center">
                  <ScrollText className="mx-auto h-8 w-8 text-gold/40" />
                  <p className="mt-3 font-sans text-sm text-muted-foreground">
                    No ledger events yet.
                  </p>
                </div>
              ) : (
                <ol className="relative flex flex-col gap-3 border-l border-gold/10 pl-4">
                  {enterprise.ledgerEvents.map((e) => {
                    const Icon = LEDGER_ICONS[e.eventType] ?? Activity;
                    let detail = "";
                    try {
                      const p = JSON.parse(e.payload);
                      if (p.amount) detail = egp(p.amount, { compact: p.amount > 100_000 });
                      else if (p.equityUnits) detail = `${p.equityUnits.toLocaleString()} units`;
                      else if (p.title) detail = p.title;
                      else if (p.action) detail = p.action;
                    } catch {}
                    return (
                      <li key={e.id} className="relative">
                        <span className="absolute -left-[1.4rem] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-gold/20 bg-background">
                          <Icon className="h-2.5 w-2.5 text-gold" />
                        </span>
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-sans text-xs font-medium text-foreground">
                            {LEDGER_LABELS[e.eventType] ?? e.eventType}
                          </p>
                          <span className="shrink-0 font-mono text-[11px] text-muted-foreground/80">
                            {timeAgo(new Date(e.timestamp))}
                          </span>
                        </div>
                        {detail && (
                          <p className="font-sans text-[11px] text-muted-foreground">
                            {detail}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <MilestoneEvidenceDialog
        milestone={evidenceTarget}
        enterpriseId={enterprise.id}
        open={evidenceOpen}
        onOpenChange={setEvidenceOpen}
        onSubmitted={(updated) => {
          onMilestoneSubmitted(updated);
        }}
      />
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = enterpriseStatus(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-background/50 px-2.5 py-0.5 font-sans text-xs font-medium",
        s.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gold/10 bg-background/40 p-3">
      <div className="flex items-center justify-between">
        <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <Icon className="h-3.5 w-3.5 text-gold/70" />
      </div>
      <p className="mt-1 font-serif text-base font-semibold">{value}</p>
    </div>
  );
}

function MilestoneRow({
  milestone,
  onSubmit,
}: {
  milestone: FounderMilestone;
  onSubmit: () => void;
}) {
  const s = milestoneStatus(milestone.status);
  const canSubmit =
    milestone.status === "pending" ||
    milestone.status === "rejected" ||
    milestone.status === "board_review";
  return (
    <div
      className={cn(
        "rounded-xl border bg-background/40 p-4 transition-colors",
        s.ring
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", s.dot)} />
            <p className="font-serif text-sm font-semibold text-foreground">
              {milestone.title}
            </p>
          </div>
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            {milestone.description}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-serif text-sm font-semibold text-gold-light">
            {egp(milestone.amountEgp, { compact: milestone.amountEgp > 100_000 })}
          </span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider",
              s.ring,
              s.text
            )}
          >
            {s.label}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gold/8 pt-3">
        <span className="font-mono text-xs text-muted-foreground">
          EVE {(milestone.eveConfidence * 100).toFixed(0)}%
        </span>
        {milestone.dueAt && (
          <span className="font-mono text-xs text-gold/70">
            ⏳ due {timeRemaining(new Date(milestone.dueAt))}
          </span>
        )}
        {milestone.releasedAt && (
          <span className="font-mono text-xs text-emerald-300">
            released {timeAgo(new Date(milestone.releasedAt))}
          </span>
        )}
        {milestone.evidenceNote && (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground/80">
            <FileText className="h-3 w-3" /> evidence on file
          </span>
        )}
        {canSubmit && (
          <Button
            onClick={onSubmit}
            size="sm"
            className="ml-auto h-8 bg-gold-gradient px-3 text-xs font-semibold text-black shadow-[0_8px_24px_-10px_rgba(212,175,55,0.6)]"
          >
            Submit evidence <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
