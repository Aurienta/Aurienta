"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { BrainCircuit, ShieldCheck, Check, AlertTriangle } from "lucide-react";

type Metric = {
  label: string;
  value: string;
  threshold: string;
  pass: boolean;
  trend?: string;
};

const METRICS: Metric[] = [
  { label: "Hallucination rate", value: "0.4%", threshold: "< 1%", pass: true, trend: "-0.1pp" },
  { label: "Bias disparity", value: "12%", threshold: "< 20%", pass: true, trend: "stable" },
  { label: "Concept drift (KL)", value: "0.06", threshold: "alert > 0.10", pass: true, trend: "+0.01" },
  { label: "PII leakage", value: "0 / 1,204 prompts", threshold: "0", pass: true },
];

const CONFIDENCE = [
  { t: "07d", v: 0.91, lower: 0.86 },
  { t: "06d", v: 0.93, lower: 0.88 },
  { t: "05d", v: 0.9, lower: 0.85 },
  { t: "04d", v: 0.94, lower: 0.89 },
  { t: "03d", v: 0.95, lower: 0.91 },
  { t: "02d", v: 0.93, lower: 0.9 },
  { t: "today", v: 0.96, lower: 0.93 },
];

export function AiOversightPanel() {
  return (
    <section
      aria-label="AI model oversight"
      className="relative overflow-hidden rounded-2xl border border-gold/12 glass-gold p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <BrainCircuit className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-lg font-semibold">AI Oversight</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold/80">
            <ShieldCheck className="h-3 w-3" /> Gemma 2 7B oversight
          </span>
        </div>

        <ul className="grid gap-2.5 sm:grid-cols-2">
          {METRICS.map((m) => (
            <li
              key={m.label}
              className={`flex items-start gap-2.5 rounded-xl border p-3 ${
                m.pass
                  ? "border-emerald-400/20 bg-emerald-400/[0.04]"
                  : "border-red-400/25 bg-red-400/[0.05]"
              }`}
            >
              <span
                className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                  m.pass ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"
                }`}
              >
                {m.pass ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
                <p className="font-serif text-base font-semibold text-foreground">{m.value}</p>
                <p className="font-mono text-[11px] text-muted-foreground/85">
                  target {m.threshold}
                  {m.trend ? ` · ${m.trend}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-xl border border-gold/10 bg-background/40 p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="font-sans text-xs font-medium text-foreground/90">AI confidence trend (7d)</p>
            <p className="font-mono text-xs text-muted-foreground/85">rolling · p50 / p10</p>
          </div>
          <div className="h-32 w-full" aria-label="Confidence trend chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CONFIDENCE} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#b8860b" />
                    <stop offset="0.5" stopColor="#d4af37" />
                    <stop offset="1" stopColor="#f4d676" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(212,175,55,0.08)" vertical={false} />
                <XAxis
                  dataKey="t"
                  tick={{ fill: "#a89f86", fontSize: 9, fontFamily: "var(--font-mono)" }}
                  axisLine={{ stroke: "rgba(212,175,55,0.15)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0.8, 1]}
                  tick={{ fill: "#a89f86", fontSize: 9, fontFamily: "var(--font-mono)" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  tickFormatter={(v: number) => v.toFixed(2)}
                />
                <Tooltip
                  cursor={{ stroke: "rgba(212,175,55,0.3)" }}
                  contentStyle={{
                    background: "rgba(16,16,20,0.96)",
                    border: "1px solid rgba(212,175,55,0.25)",
                    borderRadius: 10,
                    color: "#f3eedd",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                  formatter={(v: number) => [(v as number).toFixed(3), "confidence"]}
                />
                <ReferenceLine y={0.9} stroke="rgba(248,113,113,0.4)" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="lower"
                  stroke="rgba(212,175,55,0.35)"
                  strokeWidth={1.2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="url(#goldLine)"
                  strokeWidth={2.4}
                  dot={{ r: 2.5, fill: "#f4d676", stroke: "#b8860b", strokeWidth: 1 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground/85">
          Oversight model monitors Mixtral 8x22B (governance) + Llama 3.2 70B (risk) outputs.
          Adversarial probe set re-evaluated every 6h. Failures trip soft-quarantine → human review.
        </p>
      </div>
    </section>
  );
}
