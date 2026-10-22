"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Banknote,
  Loader2,
  Calculator,
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  PiggyBank,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { egp, pct } from "@/lib/aurienta/format";
import { EmptyState } from "@/components/dashboard/ux/empty-state";
import type { SnapshotWithEnterprise } from "@/lib/aurienta/productive-egp";

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  sector: string;
  status: string;
};

export function ProductiveEgpClient({
  enterprises,
  initialSnapshot,
  initialHistory,
  initialEnterpriseId,
}: {
  enterprises: Enterprise[];
  initialSnapshot: SnapshotWithEnterprise | null;
  initialHistory: SnapshotWithEnterprise[];
  initialEnterpriseId: string;
}) {
  const [selectedEntId, setSelectedEntId] = React.useState(initialEnterpriseId);
  const [snapshot, setSnapshot] = React.useState(initialSnapshot);
  const [history, setHistory] = React.useState(initialHistory);
  const [computing, setComputing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function refresh(enterpriseId: string) {
    if (!enterpriseId) return;
    setLoading(true);
    try {
      const [snapRes, histRes] = await Promise.all([
        fetch(
          `/api/productive-egp/snapshot?enterpriseId=${encodeURIComponent(enterpriseId)}`,
          { cache: "no-store" }
        ),
        fetch(
          `/api/productive-egp/history?enterpriseId=${encodeURIComponent(enterpriseId)}&days=30`,
          { cache: "no-store" }
        ),
      ]);
      if (snapRes.ok) {
        const data = await snapRes.json();
        setSnapshot(data.snapshot ?? null);
      } else if (snapRes.status === 404) {
        setSnapshot(null);
      }
      if (histRes.ok) {
        const data = await histRes.json();
        setHistory(data.history ?? []);
      }
    } catch (e) {
      toast.error("Failed to load snapshot", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh(selectedEntId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntId]);

  async function handleCompute() {
    if (!selectedEntId) return;
    setComputing(true);
    try {
      const res = await csrfFetch("/api/productive-egp/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterpriseId: selectedEntId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Compute failed");
      setSnapshot(data.snapshot);
      toast.success("Snapshot computed", {
        description: `Real return ${pct(data.snapshot.realReturnPct)}`,
      });
      await refresh(selectedEntId);
    } catch (e) {
      toast.error("Compute failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setComputing(false);
    }
  }

  if (enterprises.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <EmptyState
          icon={Banknote}
          title="No enterprises available"
          description="Join or found an enterprise to view its Productive EGP snapshot."
        />
      </div>
    );
  }

  const realReturn = snapshot?.realReturnPct ?? 0;
  const bankRealReturn = snapshot?.bankDepositRealReturnPct ?? -3;
  const advantage = Number((realReturn - bankRealReturn).toFixed(2));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-200/40 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-300/60 bg-indigo-100">
            <Banknote className="h-5 w-5 text-indigo-700" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-indigo-700">
              REC-2 · Productive EGP
            </p>
            <h1 className="mt-1.5 font-serif text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
              Don&apos;t save EGP. Own EGP.
            </h1>
            <p className="mt-1 font-serif text-base text-indigo-700" dir="rtl" lang="ar">
              احفظ جنيهك. امتلك جنيهك.
            </p>
            <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-slate-600">
              Aurienta Equity Units give a real return = enterprise revenue
              growth − inflation. Compare to a bank deposit whose real return
              is currently negative.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Enterprise selector + compute button */}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Card className="border-indigo-200 bg-white">
          <CardHeader className="border-b border-indigo-100 pb-3">
            <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
              <Building2 className="h-4 w-4 text-indigo-600" /> Enterprise
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Select value={selectedEntId} onValueChange={setSelectedEntId}>
              <SelectTrigger className="border-slate-300 bg-white">
                <SelectValue placeholder="Select an enterprise" />
              </SelectTrigger>
              <SelectContent>
                {enterprises.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="font-sans">{e.name}</span>
                    <span className="ml-2 font-mono text-[11px] text-slate-500">
                      T{e.tier} · {e.sector}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-white">
          <CardContent className="flex h-full flex-col justify-center p-4">
            <Button
              onClick={handleCompute}
              disabled={computing || !selectedEntId}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              {computing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="mr-2 h-4 w-4" />
              )}
              {computing ? "Computing…" : "Compute Snapshot"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Snapshot or empty state */}
      {!snapshot ? (
        <Card className="border-indigo-200 bg-white">
          <CardContent className="pt-5">
            <EmptyState
              icon={Sparkles}
              title="No snapshot yet"
              description="Click 'Compute Snapshot' to capture the current EGP price, USD-equivalent, FX rate, inflation rate, and real return."
              action={
                <Button
                  onClick={handleCompute}
                  disabled={computing || !selectedEntId}
                  className="bg-purple-600 text-white hover:bg-purple-700"
                >
                  {computing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Calculator className="mr-2 h-4 w-4" />
                  )}
                  Compute now
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Real return headline */}
          <Card className="border-indigo-300 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <CardContent className="pt-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    <span className="font-mono text-[11px] uppercase tracking-wide text-slate-500">
                      Aurienta real return
                    </span>
                  </div>
                  <p
                    className={
                      "mt-1.5 font-serif text-4xl font-bold " +
                      (realReturn >= 0 ? "text-emerald-600" : "text-rose-600")
                    }
                  >
                    {realReturn >= 0 ? "+" : ""}
                    {pct(realReturn)}
                  </p>
                  <p className="mt-1 font-sans text-xs text-slate-500">
                    {snapshot.enterpriseName} · Tier {snapshot.enterpriseTier} · {snapshot.enterpriseSector}
                  </p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-rose-500" />
                    <span className="font-mono text-[11px] uppercase tracking-wide text-slate-500">
                      Bank deposit real return
                    </span>
                  </div>
                  <p className="mt-1.5 font-serif text-3xl font-bold text-rose-600">
                    {bankRealReturn >= 0 ? "+" : ""}
                    {pct(bankRealReturn)}
                  </p>
                  <p className="mt-1 font-sans text-xs text-slate-500">
                    {pct(snapshot.bankDepositNominalPct, 0)} nominal − {pct(snapshot.inflationRatePct, 0)} inflation
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-300 bg-white/70 px-4 py-3">
                <Badge variant="outline" className="border-indigo-300 bg-indigo-50 text-indigo-700">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Aurienta advantage: {advantage >= 0 ? "+" : ""}
                  {pct(advantage)} vs bank deposit
                </Badge>
                <span className="font-sans text-xs text-slate-600">
                  Snapshot from {new Date(snapshot.createdAt).toLocaleString("en-GB")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pricing breakdown */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              icon={<Banknote className="h-4 w-4 text-indigo-600" />}
              label="EGP Price (per unit)"
              value={egp(snapshot.equityUnitPriceEgp)}
              hint="Equity Unit Price (CPP)"
            />
            <StatTile
              icon={<DollarSign className="h-4 w-4 text-indigo-600" />}
              label="USD Equivalent"
              value={`$${snapshot.equityUnitPriceUsd.toFixed(2)}`}
              hint="EGP price ÷ FX rate"
            />
            <StatTile
              icon={<Activity className="h-4 w-4 text-indigo-600" />}
              label="FX Rate (USD→EGP)"
              value={snapshot.fxRateUsdToEgp.toFixed(2)}
              hint="Latest FxRate (consensus median)"
            />
            <StatTile
              icon={<TrendingDown className="h-4 w-4 text-indigo-600" />}
              label="Inflation Rate"
              value={pct(snapshot.inflationRatePct, 0)}
              hint="Monthly CPI (2026 baseline)"
            />
          </div>

          {/* History chart */}
          <Card className="border-indigo-200 bg-white">
            <CardHeader className="border-b border-indigo-100">
              <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
                <Activity className="h-4 w-4 text-indigo-600" /> Real Return History
                <span className="ml-auto font-mono text-[11px] font-normal text-slate-500">
                  {history.length} snapshots {loading ? "· loading…" : ""}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              {history.length < 2 ? (
                <EmptyState
                  icon={Activity}
                  title="No history yet"
                  description="Compute 2+ snapshots to render the real-return trend line."
                />
              ) : (
                <RealReturnChart history={history} bankRealReturn={bankRealReturn} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-white p-4">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-sans text-[10px] uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <p className="mt-1.5 font-serif text-xl font-semibold text-slate-900">
        {value}
      </p>
      <p className="mt-0.5 font-sans text-[11px] text-slate-500">{hint}</p>
    </div>
  );
}

function RealReturnChart({
  history,
  bankRealReturn,
}: {
  history: SnapshotWithEnterprise[];
  bankRealReturn: number;
}) {
  // SVG line chart — real return over time, with bank deposit reference line.
  const width = 720;
  const height = 240;
  const padX = 48;
  const padY = 24;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const realReturns = history.map((h) => h.realReturnPct);
  const allValues = [...realReturns, bankRealReturn, 0];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = Math.max(max - min, 1);

  const xFor = (i: number) =>
    padX + (i / Math.max(history.length - 1, 1)) * innerW;
  const yFor = (v: number) =>
    padY + innerH - ((v - min) / range) * innerH;

  const linePath = realReturns
    .map((v, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`)
    .join(" ");

  const yBank = yFor(bankRealReturn);
  const yZero = yFor(0);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full min-w-[480px]"
        role="img"
        aria-label="Real return history chart"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padY + innerH * t;
          const val = max - t * range;
          return (
            <g key={t}>
              <line
                x1={padX}
                y1={y}
                x2={padX + innerW}
                y2={y}
                stroke="currentColor"
                strokeWidth={1}
                className="text-slate-200"
              />
              <text
                x={padX - 6}
                y={y + 3}
                textAnchor="end"
                className="font-mono text-[9px] fill-slate-500"
              >
                {val.toFixed(1)}%
              </text>
            </g>
          );
        })}

        {/* Zero line */}
        <line
          x1={padX}
          y1={yZero}
          x2={padX + innerW}
          y2={yZero}
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="2 3"
          className="text-slate-400"
        />

        {/* Bank deposit reference line */}
        <line
          x1={padX}
          y1={yBank}
          x2={padX + innerW}
          y2={yBank}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          className="text-rose-400"
        />
        <text
          x={padX + innerW - 4}
          y={yBank - 4}
          textAnchor="end"
          className="font-mono text-[10px] fill-rose-600"
        >
          Bank deposit {bankRealReturn.toFixed(1)}%
        </text>

        {/* Real return line */}
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className="text-indigo-600"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {realReturns.map((v, i) => (
          <circle
            key={i}
            cx={xFor(i)}
            cy={yFor(v)}
            r={3}
            className="fill-indigo-600"
          />
        ))}

        {/* X-axis labels (first + last) */}
        <text
          x={xFor(0)}
          y={height - 4}
          textAnchor="middle"
          className="font-mono text-[9px] fill-slate-500"
        >
          {new Date(history[0].createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </text>
        <text
          x={xFor(history.length - 1)}
          y={height - 4}
          textAnchor="middle"
          className="font-mono text-[9px] fill-slate-500"
        >
          {new Date(history[history.length - 1].createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </text>
      </svg>
    </div>
  );
}
