"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Gold-toned palette — no blue/indigo.
const GOLD_PALETTE = [
  "#f4d676",
  "#d4af37",
  "#c9a03d",
  "#b8860b",
  "#8a6d1f",
  "#6b5314",
  "#e8c860",
  "#a67c1a",
];

export type AllocationSlice = {
  sector: string;
  label: string;
  value: number;
};

export function PortfolioAllocationChart({
  data,
}: {
  data: AllocationSlice[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-center font-sans text-xs text-muted-foreground">
        No allocation to display.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={56}
              outerRadius={80}
              paddingAngle={2}
              stroke="rgba(8,8,10,0.6)"
              strokeWidth={1.5}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={GOLD_PALETTE[i % GOLD_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgba(16,16,20,0.95)",
                border: "1px solid rgba(212,175,55,0.25)",
                borderRadius: 12,
                fontSize: 12,
                color: "#f3eedd",
              }}
              formatter={(value: number, _name, item) => {
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                return [`${(item.payload as AllocationSlice).label} · ${pct}%`, ""];
              }}
              labelFormatter={() => ""}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Allocation
          </span>
          <span className="font-serif text-base font-semibold text-gold-gradient">
            {data.length} sectors
          </span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-1.5">
        {data
          .slice()
          .sort((a, b) => b.value - a.value)
          .map((d, i) => {
            const pct = total > 0 ? (d.value / total) * 100 : 0;
            return (
              <li
                key={d.sector}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1 transition-colors hover:bg-gold/5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{
                      background: GOLD_PALETTE[i % GOLD_PALETTE.length],
                    }}
                  />
                  <span className="truncate font-sans text-xs text-foreground">
                    {d.label}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {pct.toFixed(1)}%
                </span>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
