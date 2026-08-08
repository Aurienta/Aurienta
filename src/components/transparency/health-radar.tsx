"use client";

import * as React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { HeartPulse } from "lucide-react";

type Axis = { axis: string; value: number };

export function HealthRadar({ axes, healthScore }: { axes: Axis[]; healthScore: number }) {
  const rating = healthScore >= 90 ? "AAA" : healthScore >= 80 ? "AA" : healthScore >= 70 ? "A" : healthScore >= 60 ? "BBB" : "BB";

  return (
    <div className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <HeartPulse className="h-4 w-4 text-gold" />
        <h2 className="font-serif text-base font-semibold">Health radar</h2>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 font-mono text-xs text-gold-light">
          {rating} · {healthScore}/100
        </span>
      </div>

      <div className="mt-3 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={axes} cx="50%" cy="50%" outerRadius="72%">
            <PolarGrid stroke="rgba(212,175,55,0.18)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "#a89f86", fontSize: 10, fontFamily: "ui-sans-serif, system-ui" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 1]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Health"
              dataKey="value"
              stroke="#d4af37"
              strokeWidth={2}
              fill="#d4af37"
              fillOpacity={0.28}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-1.5">
        {axes.map((a) => (
          <li key={a.axis} className="flex items-center justify-between gap-2 rounded-lg border border-gold/10 bg-foreground/[0.02] px-2.5 py-1.5">
            <span className="font-sans text-xs text-muted-foreground">{a.axis}</span>
            <span className="font-mono text-xs text-gold-light">{(a.value * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
