"use client";

import * as React from "react";
import {
  Users,
  Brain,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Crown,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type Partner = {
  userId: string;
  name: string;
  ownershipPct: number;
  engagementScore: number;
  churnRisk: "low" | "medium" | "high";
  recommendation: string;
  votesParticipated: number;
  sessionCount: number;
  copilotQueries: number;
  equityUnits: number;
};

type EnterpriseOption = {
  id: string;
  name: string;
  slug: string;
  tier: string;
};

type Props = {
  enterprises: EnterpriseOption[];
  initialEnterpriseId: string | null;
  initialPartners: Partner[];
  initialSummary: { total: number; avgEngagement: number; highRisk: number };
};

/**
 * PartnerCRMClient — gold-themed CRM for capital partner engagement.
 * Founding operators + company owners can refresh Brain AI insights
 * on-demand. Each partner row shows ownership %, engagement score
 * (color-coded), churn risk badge, and the AI recommendation.
 */
export function PartnerCRMClient({
  enterprises,
  initialEnterpriseId,
  initialPartners,
  initialSummary,
}: Props) {
  const [enterpriseId, setEnterpriseId] = React.useState(
    initialEnterpriseId ?? enterprises[0]?.id ?? ""
  );
  const [partners, setPartners] = React.useState<Partner[]>(initialPartners);
  const [summary, setSummary] = React.useState(initialSummary);
  const [loading, setLoading] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  const refresh = React.useCallback(
    async (entId: string, silent = false) => {
      setLoading(true);
      try {
        const res = await fetch("/api/ai/partner-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enterpriseId: entId }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error ?? "Failed to refresh insights");
        }
        setPartners(data.partners ?? []);
        setSummary(
          data.summary ?? { total: 0, avgEngagement: 0, highRisk: 0 }
        );
        setLastUpdated(new Date());
        if (!silent) {
          toast.success(
            `Brain AI analysed ${data.partners?.length ?? 0} partners${
              data.fellBack ? " (fallback mode)" : ""
            }.`
          );
        }
      } catch (e) {
        if (!silent) {
          toast.error(e instanceof Error ? e.message : "Failed to refresh");
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleEnterpriseChange = async (entId: string) => {
    setEnterpriseId(entId);
    await refresh(entId, true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header row — enterprise selector + refresh button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/8">
            <Users className="h-4 w-4 text-gold" />
          </span>
          <div>
            <h2 className="font-serif text-lg font-semibold">Partner CRM</h2>
            <p className="font-sans text-xs text-muted-foreground">
              Brain AI engagement scores, churn risk, and per-partner recommendations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {enterprises.length > 0 && (
            <Select value={enterpriseId} onValueChange={handleEnterpriseChange}>
              <SelectTrigger className="h-9 w-48 border-gold/20 text-xs">
                <SelectValue placeholder="Select enterprise" />
              </SelectTrigger>
              <SelectContent>
                {enterprises.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} · T{e.tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() => refresh(enterpriseId)}
            disabled={loading || !enterpriseId}
            size="sm"
            className="bg-gold-gradient text-black hover:opacity-90"
          >
            {loading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Refresh AI insights
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={Users}
          label="Total partners"
          value={summary.total.toString()}
          sub="Constitutional capital partners"
        />
        <SummaryCard
          icon={Sparkles}
          label="Avg engagement"
          value={`${summary.avgEngagement}`}
          sub="0–100 Brain AI score"
          tone={scoreTone(summary.avgEngagement)}
        />
        <SummaryCard
          icon={ShieldAlert}
          label="High churn risk"
          value={summary.highRisk.toString()}
          sub="Partners needing re-engagement"
          tone={summary.highRisk > 0 ? "negative" : "positive"}
        />
      </div>

      {/* Partner table */}
      <Card className="border-gold/12 bg-background/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-gold" />
              <h3 className="font-serif text-base font-semibold">
                Partner engagement table
              </h3>
            </div>
            {lastUpdated && (
              <span className="font-mono text-[10px] text-muted-foreground/80">
                Last refreshed {formatTimeAgo(lastUpdated)}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {partners.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Users className="h-8 w-8 text-gold/30" />
              <p className="font-sans text-xs text-muted-foreground">
                No capital partners on file for this enterprise yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gold/15 hover:bg-transparent">
                    <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Partner
                    </TableHead>
                    <TableHead className="text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Ownership
                    </TableHead>
                    <TableHead className="text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Engagement
                    </TableHead>
                    <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Churn risk
                    </TableHead>
                    <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Activity
                    </TableHead>
                    <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Brain AI recommendation
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((p) => (
                    <TableRow
                      key={p.userId}
                      className="border-gold/8 transition-colors hover:bg-gold/[0.02]"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                            style={{
                              background: `linear-gradient(135deg, #d4af37, #8a6d1f)`,
                              color: "#0a0a0b",
                            }}
                          >
                            {p.name.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-serif text-sm font-medium">
                              {p.name}
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground/80">
                              {p.equityUnits.toLocaleString()} units
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-gold-light">
                        {p.ownershipPct.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <EngagementScore score={p.engagementScore} />
                      </TableCell>
                      <TableCell>
                        <ChurnRiskBadge risk={p.churnRisk} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 font-mono text-[10px] text-muted-foreground/85">
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-2.5 w-2.5 text-gold/60" />
                            {p.votesParticipated} votes
                          </span>
                          <span>
                            {p.sessionCount} sessions · {p.copilotQueries} copilot
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-sans text-xs leading-relaxed text-foreground/85">
                          {p.recommendation}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Summary card ──
function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const valueColor =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
        ? "text-red-400"
        : "text-gold-light";
  return (
    <Card className="border-gold/12 bg-background/40 py-4">
      <CardContent>
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gold/15 bg-gold/5">
            <Icon className="h-3.5 w-3.5 text-gold" />
          </span>
          <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
        <p className={cn("font-serif text-2xl font-semibold", valueColor)}>{value}</p>
        {sub && <p className="mt-0.5 font-mono text-xs text-muted-foreground/85">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Engagement score pill ──
function EngagementScore({ score }: { score: number }) {
  const tone = scoreTone(score);
  const color =
    tone === "positive"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : tone === "negative"
        ? "border-red-400/30 bg-red-400/10 text-red-300"
        : "border-amber-400/30 bg-amber-400/10 text-amber-300";
  const Icon = tone === "positive" ? TrendingUp : tone === "negative" ? TrendingDown : Sparkles;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs font-semibold",
        color
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {score}
    </span>
  );
}

// ── Churn risk badge ──
function ChurnRiskBadge({ risk }: { risk: "low" | "medium" | "high" }) {
  const config = {
    low: {
      label: "Low",
      className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
      icon: Sparkles,
    },
    medium: {
      label: "Medium",
      className: "border-amber-400/30 bg-amber-400/10 text-amber-300",
      icon: AlertTriangle,
    },
    high: {
      label: "High",
      className: "border-red-400/30 bg-red-400/10 text-red-300",
      icon: ShieldAlert,
    },
  }[risk];
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        config.className
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </Badge>
  );
}

function scoreTone(score: number): "positive" | "negative" | "neutral" {
  if (score >= 70) return "positive";
  if (score >= 40) return "neutral";
  return "negative";
}

function formatTimeAgo(d: Date): string {
  const ms = Date.now() - d.getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Suppress unused-import warning for Crown — kept for future "owner" indicator.
void Crown;
