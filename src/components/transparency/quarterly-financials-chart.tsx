"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { egp } from "@/lib/aurienta/format";

type Report = {
  quarter: string;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  grossMarginPct: number;
};

const GOLD = "#d4af37";
const GOLD_LIGHT = "#f4d676";
const GOLD_DARK = "#8a6d1f";

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string | number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gold/25 bg-[#101014]/95 p-3 backdrop-blur">
      <div className="font-mono text-xs uppercase tracking-wide text-gold-light/80">{label}</div>
      <ul className="mt-2 space-y-1">
        {payload?.map((p: { name?: string; value?: number; color?: string; dataKey?: string | number }) => (
          <li key={p.dataKey ?? p.name} className="flex items-center justify-between gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1.5" style={{ color: p.color }}>
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="text-foreground">{egp(p.value ?? 0, { compact: true })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuarterlyFinancialsChart({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-gold/15 glass text-center">
        <div>
          <TrendingUp className="mx-auto h-8 w-8 text-gold/40" />
          <p className="mt-2 font-sans text-xs text-muted-foreground">No quarterly reports published yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-gold" />
        <h2 className="font-serif text-lg font-semibold">Quarterly financials</h2>
        <span className="ml-auto font-mono text-xs text-muted-foreground/80">
          {reports.length} quarter{reports.length === 1 ? "" : "s"} · ledger-anchored
        </span>
      </div>

      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={reports} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.55} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gross" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD_LIGHT} stopOpacity={0.45} />
                <stop offset="100%" stopColor={GOLD_LIGHT} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="net" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD_DARK} stopOpacity={0.35} />
                <stop offset="100%" stopColor={GOLD_DARK} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(212,175,55,0.08)" strokeDasharray="2 4" />
            <XAxis
              dataKey="quarter"
              tick={{ fill: "#a89f86", fontSize: 10, fontFamily: "ui-monospace, monospace" }}
              axisLine={{ stroke: "rgba(212,175,55,0.18)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#a89f86", fontSize: 10, fontFamily: "ui-monospace, monospace" }}
              tickFormatter={(v) => egp(v, { compact: true })}
              axisLine={{ stroke: "rgba(212,175,55,0.18)" }}
              tickLine={false}
              width={70}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(212,175,55,0.4)", strokeWidth: 1 }} />
            <Legend
              wrapperStyle={{ fontFamily: "ui-sans-serif, system-ui", fontSize: 11, paddingTop: 8 }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={GOLD}
              strokeWidth={2}
              fill="url(#rev)"
            />
            <Area
              type="monotone"
              dataKey="grossProfit"
              name="Gross profit"
              stroke={GOLD_LIGHT}
              strokeWidth={1.8}
              fill="url(#gross)"
            />
            <Area
              type="monotone"
              dataKey="netProfit"
              name="Net profit"
              stroke={GOLD_DARK}
              strokeWidth={1.6}
              fill="url(#net)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {reports.slice(-3).map((r) => (
          <div key={r.quarter} className="rounded-lg border border-gold/12 bg-foreground/[0.02] p-2.5 text-center">
            <div className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground/85">{r.quarter}</div>
            <div className="mt-0.5 font-mono text-xs text-gold-light">{egp(r.revenue, { compact: true })}</div>
            <div className="font-mono text-[11px] text-muted-foreground/80">margin {r.grossMarginPct.toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
