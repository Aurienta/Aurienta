"use client";

// Cap Table Client — interactive viewer for the constitutional cap table.
//
// Renders three panels:
//   1. Cap Table Table       — stakeholder × shares × % × value × vested
//   2. Dilution Simulator    — slider for newShares → per-stakeholder deltas
//   3. Waterfall Simulator   — slider for exitAmount → tier-by-tier payout
//
// Plus an OCF export button that hits /api/cap-table/export and downloads
// the resulting JSON file.
//
// All data is fetched via the API routes (which enforce auth + role gates).
// The initial cap table is pre-fetched server-side and passed as a prop so
// the page renders with data on first paint — no loading flash.

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PieChart,
  Download,
  Loader2,
  ShieldCheck,
  Lock,
  TrendingDown,
  Droplets,
  AlertTriangle,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { egp, pct, shortHash } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

// ─── Types (mirror src/lib/aurienta/cap-table.ts) ───────────────────

type ShareClass = "preferred" | "common_founder" | "common_restricted";

interface CapTableEntry {
  userId: string;
  legalName: string;
  role: string | null;
  shareClass: ShareClass;
  equityUnits: number;
  avgPriceEgp: number;
  ownershipPct: number;
  valueEgp: number;
  restrictedUntil: string | null;
  vestedUnits: number;
  unvestedUnits: number;
  pctVested: number;
  liquidationPreferenceEgp: number;
  antiDilutionProtection: "none" | "weighted_average" | "full_ratchet";
  dragAlongEligible: boolean;
  tagAlongEligible: boolean;
}

interface CapTable {
  enterpriseId: string;
  enterpriseName: string;
  slug: string;
  tier: string;
  stage: string;
  totalEquityUnits: number;
  issuedEquityUnits: number;
  fullyDilutedEquityUnits: number;
  equityUnitPriceEgp: number;
  preMoneyValuationEgp: number;
  postMoneyValuationEgp: number;
  raisedEgp: number;
  founderEquityPct: number;
  stakeholderCount: number;
  stakeholders: CapTableEntry[];
  ledgerAnchor: {
    sequence: number;
    payloadHash: string;
    eventType: string;
    timestamp: string;
  } | null;
  constitutionalHash: string;
  generatedAt: string;
}

interface DilutionResult {
  enterpriseId: string;
  newShares: number;
  newPriceEgp: number;
  preMoneyValuationEgp: number;
  postMoneyValuationEgp: number;
  capitalRaisedEgp: number;
  newInvestorOwnershipPct: number;
  dilutedStakeholders: Array<{
    userId: string;
    legalName: string;
    shareClass: ShareClass;
    unitsBefore: number;
    unitsAfter: number;
    pctBefore: number;
    pctAfter: number;
    dilutionPct: number;
    antiDilutionAdjustmentUnits: number;
    antiDilutionMode: "none" | "weighted_average" | "full_ratchet";
  }>;
  verdict: {
    allowed: boolean;
    reason?: string;
    policy: string;
    decisionToken: string;
  };
}

interface WaterfallTier {
  rank: number;
  label: string;
  mechanism: "liquidation_preference" | "participating_preferred" | "common_pro_rata";
  participantCount: number;
  poolEgp: number;
  paidOutEgp: number;
  remainingEgp: number;
}

interface WaterfallResult {
  enterpriseId: string;
  exitAmountEgp: number;
  tiers: WaterfallTier[];
  payouts: Array<{
    userId: string;
    legalName: string;
    shareClass: ShareClass;
    tier: number;
    payoutEgp: number;
    payoutBasis: string;
  }>;
  totalPaidOutEgp: number;
  residualEgp: number;
  preferredConversionElected: boolean;
}

interface EnterpriseOption {
  id: string;
  name: string;
  slug: string;
  tier: string;
  stage: string;
  role: string;
}

interface Props {
  enterprises: EnterpriseOption[];
  initialEnterpriseId: string;
  initialCapTable: CapTable | null;
  isPlatformAdmin: boolean;
}

// ─── Share class styling ────────────────────────────────────────────

const SHARE_CLASS_META: Record<
  ShareClass,
  { label: string; cls: string; dot: string }
> = {
  preferred: {
    label: "Preferred",
    cls: "text-amber-700 border-amber-500/40 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-400/30",
    dot: "bg-amber-500",
  },
  common_founder: {
    label: "Founders' Common",
    cls: "text-emerald-700 border-emerald-500/40 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-400/30",
    dot: "bg-emerald-500",
  },
  common_restricted: {
    label: "Restricted Common",
    cls: "text-slate-600 border-slate-400/40 bg-slate-100 dark:text-slate-300 dark:bg-slate-500/10 dark:border-slate-400/30",
    dot: "bg-slate-400",
  },
};

const ANTI_DILUTION_LABEL: Record<string, string> = {
  none: "None",
  weighted_average: "Weighted Avg",
  full_ratchet: "Full Ratchet",
};

// ─── Component ──────────────────────────────────────────────────────

export function CapTableClient({
  enterprises,
  initialEnterpriseId,
  initialCapTable,
  isPlatformAdmin,
}: Props) {
  const router = useRouter();
  const [enterpriseId, setEnterpriseId] = React.useState(initialEnterpriseId);
  const [capTable, setCapTable] = React.useState<CapTable | null>(initialCapTable);
  const [loadingTable, setLoadingTable] = React.useState(false);
  const [tableError, setTableError] = React.useState<string | null>(null);

  // ── Dilution simulator state ──
  const [dilutionNewShares, setDilutionNewShares] = React.useState(1000);
  const [dilutionResult, setDilutionResult] = React.useState<DilutionResult | null>(null);
  const [loadingDilution, setLoadingDilution] = React.useState(false);

  // ── Waterfall simulator state ──
  const [exitAmount, setExitAmount] = React.useState(10_000_000);
  const [waterfall, setWaterfall] = React.useState<WaterfallResult | null>(null);
  const [loadingWaterfall, setLoadingWaterfall] = React.useState(false);

  // ── OCF export state ──
  const [exportingOcf, setExportingOcf] = React.useState(false);

  // ── Refetch cap table when enterprise changes ──
  const fetchCapTable = React.useCallback(async (entId: string) => {
    setLoadingTable(true);
    setTableError(null);
    try {
      const res = await fetch(`/api/cap-table?enterpriseId=${encodeURIComponent(entId)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = await res.json();
      setCapTable(body.capTable as CapTable);
    } catch (e) {
      setTableError(e instanceof Error ? e.message : "Failed to load cap table");
      setCapTable(null);
    } finally {
      setLoadingTable(false);
    }
  }, []);

  const handleEnterpriseChange = React.useCallback(
    (entId: string) => {
      setEnterpriseId(entId);
      setDilutionResult(null);
      setWaterfall(null);
      router.replace(`/dashboard/cap-table?enterpriseId=${encodeURIComponent(entId)}`);
      void fetchCapTable(entId);
    },
    [fetchCapTable, router]
  );

  // ── Dilution simulator — re-run when slider or enterprise changes ──
  React.useEffect(() => {
    if (!capTable) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingDilution(true);
      try {
        const res = await fetch(
          `/api/cap-table?enterpriseId=${encodeURIComponent(
            enterpriseId
          )}&scenario=dilution&newShares=${dilutionNewShares}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (!cancelled) setDilutionResult(body.result as DilutionResult);
      } catch {
        if (!cancelled) setDilutionResult(null);
      } finally {
        if (!cancelled) setLoadingDilution(false);
      }
    }, 250); // debounce slider drags
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enterpriseId, dilutionNewShares, capTable]);

  // ── Waterfall simulator — re-run when slider or enterprise changes ──
  React.useEffect(() => {
    if (!capTable) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingWaterfall(true);
      try {
        const res = await fetch(
          `/api/cap-table?enterpriseId=${encodeURIComponent(
            enterpriseId
          )}&scenario=waterfall&exitAmount=${exitAmount}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (!cancelled) setWaterfall(body.result as WaterfallResult);
      } catch {
        if (!cancelled) setWaterfall(null);
      } finally {
        if (!cancelled) setLoadingWaterfall(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enterpriseId, exitAmount, capTable]);

  // ── OCF export download ──
  const handleExportOcf = React.useCallback(async () => {
    setExportingOcf(true);
    try {
      const res = await fetch(
        `/api/cap-table/export?enterpriseId=${encodeURIComponent(
          enterpriseId
        )}&download=1`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cap-table-${capTable?.slug ?? enterpriseId}-ocf-${new Date()
        .toISOString()
        .split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("OCF document exported", {
        description: "Open Cap Table Format v1.0.0 — constitutional anchor embedded",
      });
    } catch (e) {
      toast.error("OCF export failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setExportingOcf(false);
    }
  }, [enterpriseId, capTable]);

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <>
      {/* Enterprise selector + actions */}
      <Card className="border-gold/15">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="font-serif text-lg">Active Enterprise</CardTitle>
              <CardDescription className="mt-1">
                {isPlatformAdmin
                  ? "AURIENTA Rep — full platform access to every cap table"
                  : "Select an enterprise you're a Capital Partner, Founding Operator, Board Member, or Company Owner of."}
              </CardDescription>
            </div>
            <Button
              onClick={handleExportOcf}
              disabled={exportingOcf || !capTable}
              variant="outline"
              className="shrink-0"
            >
              {exportingOcf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export OCF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={enterpriseId} onValueChange={handleEnterpriseChange}>
            <SelectTrigger className="w-full sm:max-w-md">
              <SelectValue placeholder="Select enterprise" />
            </SelectTrigger>
            <SelectContent>
              {enterprises.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  <span className="font-medium">{e.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    · Tier {e.tier} · {e.role.replace(/_/g, " ")}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {tableError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to load cap table</AlertTitle>
          <AlertDescription>{tableError}</AlertDescription>
        </Alert>
      )}

      {/* ─── Cap Table Summary + Table ─── */}
      {loadingTable && !capTable ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-muted-foreground" />
            <span className="font-sans text-sm text-muted-foreground">
              Loading cap table…
            </span>
          </CardContent>
        </Card>
      ) : capTable ? (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat
              label="Issued Equity Units"
              value={capTable.issuedEquityUnits.toLocaleString("en-US")}
              sub={`of ${capTable.totalEquityUnits.toLocaleString("en-US")} authorized`}
            />
            <SummaryStat
              label="Equity Unit Price"
              value={egp(capTable.equityUnitPriceEgp, { decimals: 2 })}
              sub={capTable.preMoneyValuationEgp > 0 ? `pre-money ${egp(capTable.preMoneyValuationEgp, { compact: true })}` : "no valuation yet"}
            />
            <SummaryStat
              label="Capital Participated"
              value={egp(capTable.raisedEgp, { compact: true })}
              sub={`post-money ${egp(capTable.postMoneyValuationEgp, { compact: true })}`}
            />
            <SummaryStat
              label="Stakeholders"
              value={String(capTable.stakeholderCount)}
              sub={`founder floor ${pct(capTable.founderEquityPct, 0)}`}
            />
          </div>

          {/* Cap table table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-serif text-lg">Cap Table</CardTitle>
                  <CardDescription className="mt-1">
                    {capTable.enterpriseName} · Tier {capTable.tier} ·{" "}
                    {capTable.stage.replace("_", " ")}
                  </CardDescription>
                </div>
                <LedgerAnchorBadge capTable={capTable} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-gold/10">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead>Stakeholder</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Equity Units</TableHead>
                      <TableHead className="text-right">Ownership</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Vested</TableHead>
                      <TableHead className="text-right">Liquidation Pref</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {capTable.stakeholders.map((s) => {
                      const meta = SHARE_CLASS_META[s.shareClass];
                      return (
                        <TableRow key={s.userId}>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{s.legalName}</span>
                              {s.role && (
                                <span className="font-sans text-[11px] text-muted-foreground">
                                  {s.role.replace(/_/g, " ")}
                                </span>
                              )}
                              <div className="mt-1 flex flex-wrap gap-1">
                                {s.dragAlongEligible && (
                                  <Badge
                                    variant="outline"
                                    className="border-gold/30 bg-gold/5 px-1.5 py-0 text-[10px] text-gold-light"
                                  >
                                    <Users className="mr-1 h-2.5 w-2.5" /> drag
                                  </Badge>
                                )}
                                {s.tagAlongEligible && (
                                  <Badge
                                    variant="outline"
                                    className="border-gold/30 bg-gold/5 px-1.5 py-0 text-[10px] text-gold-light"
                                  >
                                    <Users className="mr-1 h-2.5 w-2.5" /> tag
                                  </Badge>
                                )}
                                {s.antiDilutionProtection !== "none" && (
                                  <Badge
                                    variant="outline"
                                    className="border-amber-500/30 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                                  >
                                    <ShieldCheck className="mr-1 h-2.5 w-2.5" />
                                    {ANTI_DILUTION_LABEL[s.antiDilutionProtection]}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("gap-1", meta.cls)}
                            >
                              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                              {meta.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {s.equityUnits.toLocaleString("en-US")}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-medium">
                            {pct(s.ownershipPct, 2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {egp(s.valueEgp, { compact: true })}
                          </TableCell>
                          <TableCell className="text-right">
                            {s.shareClass === "common_restricted" ? (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="font-mono text-xs">
                                  {pct(s.pctVested * 100, 1)}
                                </span>
                                <span className="font-sans text-[10px] text-muted-foreground">
                                  {s.vestedUnits.toLocaleString("en-US")} / {s.equityUnits.toLocaleString("en-US")}
                                </span>
                              </div>
                            ) : (
                              <span className="font-mono text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {s.liquidationPreferenceEgp > 0
                              ? egp(s.liquidationPreferenceEgp, { compact: true })
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {capTable.stakeholders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center">
                          <PieChart className="mx-auto h-8 w-8 text-muted-foreground/40" />
                          <p className="mt-2 font-sans text-sm text-muted-foreground">
                            No stakeholders yet — capital formation hasn&apos;t begun.
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* ─── Dilution Simulator ─── */}
      {capTable && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-gold" />
              <CardTitle className="font-serif text-lg">Dilution Simulator</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Model the impact of issuing new equity units. Anti-dilution adjustments
              (weighted-average / full ratchet) are auto-calculated for preferred holders
              on down rounds. CRE validates against the Founder Equity Cap floor.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                  New shares issued
                </span>
                <span className="font-mono text-sm text-foreground">
                  {dilutionNewShares.toLocaleString("en-US")} units
                </span>
              </div>
              <Slider
                min={100}
                max={Math.max(capTable.issuedEquityUnits * 2, 100_000)}
                step={100}
                value={[dilutionNewShares]}
                onValueChange={(v) => setDilutionNewShares(v[0] ?? 0)}
                className="py-2"
              />
              <div className="flex justify-between font-mono text-[10px] text-muted-foreground/80">
                <span>100</span>
                <span>{Math.round(capTable.issuedEquityUnits / 2).toLocaleString("en-US")}</span>
                <span>{(Math.max(capTable.issuedEquityUnits * 2, 100_000)).toLocaleString("en-US")} (2× issued)</span>
              </div>
            </div>

            {loadingDilution && !dilutionResult ? (
              <div className="flex items-center gap-2 py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="font-sans text-sm text-muted-foreground">Computing…</span>
              </div>
            ) : dilutionResult ? (
              <>
                {/* Dilution summary */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <SummaryStat
                    label="Capital Raised"
                    value={egp(dilutionResult.capitalRaisedEgp, { compact: true })}
                    sub={`@ ${egp(dilutionResult.newPriceEgp, { decimals: 2 })}/unit`}
                  />
                  <SummaryStat
                    label="Post-Money Valuation"
                    value={egp(dilutionResult.postMoneyValuationEgp, { compact: true })}
                    sub={`pre-money ${egp(dilutionResult.preMoneyValuationEgp, { compact: true })}`}
                  />
                  <SummaryStat
                    label="New Investor Stake"
                    value={pct(dilutionResult.newInvestorOwnershipPct, 2)}
                    sub="post-round"
                  />
                  <SummaryStat
                    label="CRE Verdict"
                    value={dilutionResult.verdict.allowed ? "Allowed" : "Blocked"}
                    sub={dilutionResult.verdict.policy}
                    accent={dilutionResult.verdict.allowed ? "good" : "bad"}
                  />
                </div>

                {dilutionResult.verdict.reason && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>CRE: Dilution blocked</AlertTitle>
                    <AlertDescription>{dilutionResult.verdict.reason}</AlertDescription>
                  </Alert>
                )}

                {/* Per-stakeholder dilution table */}
                <div className="max-h-80 overflow-y-auto rounded-lg border border-gold/10">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card">
                      <TableRow>
                        <TableHead>Stakeholder</TableHead>
                        <TableHead className="text-right">Units Before → After</TableHead>
                        <TableHead className="text-right">% Before</TableHead>
                        <TableHead className="text-right">% After</TableHead>
                        <TableHead className="text-right">Δ</TableHead>
                        <TableHead className="text-right">Anti-Dilution Bonus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dilutionResult.dilutedStakeholders.map((d) => {
                        const isNegative = d.dilutionPct < 0;
                        return (
                          <TableRow key={d.userId}>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium">{d.legalName}</span>
                                <span className="font-sans text-[11px] text-muted-foreground">
                                  {SHARE_CLASS_META[d.shareClass].label}
                                  {d.antiDilutionMode !== "none" && d.antiDilutionAdjustmentUnits > 0 && (
                                    <span className="ml-1 text-amber-600 dark:text-amber-400">
                                      · {ANTI_DILUTION_LABEL[d.antiDilutionMode]}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {d.unitsBefore.toLocaleString("en-US")} →{" "}
                              {d.unitsAfter.toLocaleString("en-US")}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                              {pct(d.pctBefore, 2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-medium">
                              {pct(d.pctAfter, 2)}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-mono text-xs font-medium",
                                isNegative
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              )}
                            >
                              {d.dilutionPct > 0 ? "+" : ""}
                              {pct(d.dilutionPct, 2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {d.antiDilutionAdjustmentUnits > 0 ? (
                                <span className="text-amber-600 dark:text-amber-400">
                                  +{d.antiDilutionAdjustmentUnits.toLocaleString("en-US")}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* ─── Waterfall Simulator ─── */}
      {capTable && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-gold" />
              <CardTitle className="font-serif text-lg">Liquidation Waterfall</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Simulate the distribution of an exit amount across the cap table.
              Preferred holders receive their 1x non-participating liquidation
              preference first; the residual flows pro-rata to common holders.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                  Exit amount
                </span>
                <span className="font-mono text-sm text-foreground">
                  {egp(exitAmount, { compact: true })}
                </span>
              </div>
              <Slider
                min={0}
                max={Math.max(capTable.postMoneyValuationEgp * 5, 100_000_000)}
                step={1_000_000}
                value={[exitAmount]}
                onValueChange={(v) => setExitAmount(v[0] ?? 0)}
                className="py-2"
              />
              <div className="flex justify-between font-mono text-[10px] text-muted-foreground/80">
                <span>0 EGP</span>
                <span>{egp(Math.round(capTable.postMoneyValuationEgp / 2), { compact: true })} (½ post-money)</span>
                <span>{egp(Math.max(capTable.postMoneyValuationEgp * 5, 100_000_000), { compact: true })} (5× post-money)</span>
              </div>
            </div>

            {loadingWaterfall && !waterfall ? (
              <div className="flex items-center gap-2 py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="font-sans text-sm text-muted-foreground">Computing waterfall…</span>
              </div>
            ) : waterfall ? (
              <>
                {/* Waterfall summary */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <SummaryStat
                    label="Exit Amount"
                    value={egp(waterfall.exitAmountEgp, { compact: true })}
                    sub="acquisition / IPO proceeds"
                  />
                  <SummaryStat
                    label="Total Paid Out"
                    value={egp(waterfall.totalPaidOutEgp, { compact: true })}
                    sub={`to ${waterfall.payouts.length} stakeholders`}
                  />
                  <SummaryStat
                    label="Residual"
                    value={egp(waterfall.residualEgp, { compact: true })}
                    sub="leftover (usually 0)"
                  />
                  <SummaryStat
                    label="Conversion Election"
                    value={waterfall.preferredConversionElected ? "Convert" : "Preference"}
                    sub="preferred strategy"
                    accent={waterfall.preferredConversionElected ? "good" : "default"}
                  />
                </div>

                {/* Tier visualization */}
                <div className="flex flex-col gap-3">
                  {waterfall.tiers.map((tier) => (
                    <WaterfallTierRow key={tier.rank} tier={tier} />
                  ))}
                </div>

                {/* Payouts table */}
                <div className="max-h-80 overflow-y-auto rounded-lg border border-gold/10">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card">
                      <TableRow>
                        <TableHead>Tier</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">Payout</TableHead>
                        <TableHead>Basis</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waterfall.payouts.map((p, idx) => (
                        <TableRow key={`${p.userId}-${idx}`}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              T{p.tier}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{p.legalName}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("gap-1", SHARE_CLASS_META[p.shareClass].cls)}
                            >
                              <span className={cn("h-1.5 w-1.5 rounded-full", SHARE_CLASS_META[p.shareClass].dot)} />
                              {SHARE_CLASS_META[p.shareClass].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium">
                            {egp(p.payoutEgp, { compact: true })}
                          </TableCell>
                          <TableCell className="font-sans text-[11px] text-muted-foreground">
                            {p.payoutBasis}
                          </TableCell>
                        </TableRow>
                      ))}
                      {waterfall.payouts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-12 text-center">
                            <Droplets className="mx-auto h-8 w-8 text-muted-foreground/40" />
                            <p className="mt-2 font-sans text-sm text-muted-foreground">
                              No payouts at this exit amount.
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* ─── Constitutional footer ─── */}
      {capTable && (
        <div className="flex items-center justify-center gap-2 text-center">
          <ShieldCheck className="h-3.5 w-3.5 text-gold/60" />
          <p className="font-mono text-[11px] text-muted-foreground/80">
            Hash-anchored to the immutable ledger · CRE-signed ·{" "}
            {capTable.ledgerAnchor
              ? `snapshot #${capTable.ledgerAnchor.sequence} · ${shortHash(capTable.ledgerAnchor.payloadHash, 10, 4)}`
              : "no snapshot yet"}
          </p>
        </div>
      )}
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function SummaryStat({
  label,
  value,
  sub,
  accent = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "default" | "good" | "bad";
}) {
  const valueCls =
    accent === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "bad"
        ? "text-rose-600 dark:text-rose-400"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-gold/10 bg-foreground/[0.02] p-3">
      <div className={cn("font-mono text-sm", valueCls)}>{value}</div>
      <div className="mt-0.5 font-sans text-[11px] uppercase tracking-wide text-muted-foreground/85">
        {label}
      </div>
      {sub && (
        <div className="mt-0.5 font-sans text-[10px] text-muted-foreground/70">{sub}</div>
      )}
    </div>
  );
}

function LedgerAnchorBadge({ capTable }: { capTable: CapTable }) {
  if (!capTable.ledgerAnchor) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <Lock className="h-3 w-3" />
        No snapshot
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 border-gold/30 bg-gold/5 text-gold-light"
    >
      <ShieldCheck className="h-3 w-3" />
      Ledger #{capTable.ledgerAnchor.sequence}
      <span className="ml-1 font-mono text-[10px] opacity-70">
        {shortHash(capTable.ledgerAnchor.payloadHash, 6, 4)}
      </span>
    </Badge>
  );
}

function WaterfallTierRow({ tier }: { tier: WaterfallTier }) {
  const [expanded, setExpanded] = React.useState(false);
  const pctPaid =
    tier.poolEgp > 0 ? Math.min(100, (tier.paidOutEgp / tier.poolEgp) * 100) : 0;
  return (
    <div className="rounded-lg border border-gold/12 bg-foreground/[0.02] p-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
      >
        <Badge
          variant="outline"
          className="font-mono text-[10px] border-gold/30 bg-gold/5 text-gold-light"
        >
          Tier {tier.rank}
        </Badge>
        <span className="font-serif text-sm font-medium">{tier.label}</span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {egp(tier.paidOutEgp, { compact: true })} / {egp(tier.poolEgp, { compact: true })}
        </span>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/5">
        <div
          className="h-full rounded-full bg-gold/60"
          style={{ width: `${pctPaid}%` }}
        />
      </div>
      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniStat label="Participants" value={String(tier.participantCount)} />
          <MiniStat label="Pool" value={egp(tier.poolEgp, { compact: true })} />
          <MiniStat label="Paid Out" value={egp(tier.paidOutEgp, { compact: true })} />
          <MiniStat label="Residual → Next" value={egp(tier.remainingEgp, { compact: true })} />
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gold/10 bg-card/50 p-2">
      <div className="font-mono text-xs text-foreground">{value}</div>
      <div className="mt-0.5 font-sans text-[10px] uppercase tracking-wide text-muted-foreground/85">
        {label}
      </div>
    </div>
  );
}
