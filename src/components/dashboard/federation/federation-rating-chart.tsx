"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export type RatingBucket = {
  rating: string;
  count: number;
  tone: "green" | "amber" | "red" | "gold";
};

const TONE_COLORS: Record<RatingBucket["tone"], string> = {
  green: "#34d399",
  amber: "#f4d676",
  red: "#ef4444",
  gold: "#d4af37",
};

type Props = {
  data: RatingBucket[];
  height?: number;
};

export function FederationRatingChart({ data, height = 240 }: Props) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-gold/15 bg-foreground/[0.01] text-center font-sans text-[12px] text-muted-foreground"
        style={{ height }}
      >
        No federation health ratings yet.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(212,175,55,0.08)" vertical={false} />
          <XAxis
            dataKey="rating"
            tick={{ fill: "#a89f86", fontSize: 10, fontFamily: "monospace" }}
            stroke="rgba(212,175,55,0.15)"
          />
          <YAxis
            tick={{ fill: "#a89f86", fontSize: 10, fontFamily: "monospace" }}
            stroke="rgba(212,175,55,0.15)"
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(212,175,55,0.05)" }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={500}>
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={TONE_COLORS[entry.tone]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const v = payload[0].value;
  return (
    <div
      style={{
        background: "rgba(16,16,18,0.95)",
        border: "1px solid rgba(212,175,55,0.25)",
        borderRadius: 8,
        padding: "10px 12px",
        fontSize: 11,
        fontFamily: "monospace",
        color: "#f3eedd",
        backdropFilter: "blur(8px)",
      }}
    >
      <p style={{ fontSize: 10, color: "#a89f86", marginBottom: 4 }}>Health rating · {label}</p>
      <p style={{ color: "#f4d676", fontWeight: 600 }}>{v} federated member(s)</p>
    </div>
  );
}
