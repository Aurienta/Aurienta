"use client";

import * as React from "react";
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from "recharts";
import { GoldStar } from "@/components/aurienta-logo";
import { egp } from "@/lib/aurienta/format";

type Slice = { label: string; value: number; color: string };

interface ActiveShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: { label: string };
  percent: number;
  value: number;
}

function ActiveShape(props: ActiveShapeProps) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text
        x={cx}
        y={cy - 14}
        textAnchor="middle"
        fill="#f4d676"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 14, fontWeight: 600 }}
      >
        {payload.label}
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        fill="#f3eedd"
        style={{ fontFamily: "ui-monospace, monospace", fontSize: 11 }}
      >
        {value.toLocaleString()} u
      </text>
      <text
        x={cx}
        y={cy + 26}
        textAnchor="middle"
        fill="#a89f86"
        style={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }}
      >
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="rgba(8,8,10,0.6)"
        strokeWidth={2}
      />
    </g>
  );
}

export function OwnershipSunburst({ slices, totalEquityUnits }: { slices: Slice[]; totalEquityUnits: number }) {
  const [active, setActive] = React.useState<number>(0);

  return (
    <div className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <GoldStar className="h-3 w-3" />
        <h2 className="font-serif text-base font-semibold">Ownership ledger</h2>
        <span className="ml-auto font-mono text-xs text-muted-foreground/80">
          {totalEquityUnits.toLocaleString()} units total
        </span>
      </div>

      <div className="mt-2 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={2}
              stroke="rgba(8,8,10,0.6)"
              strokeWidth={2}
              activeIndex={active}
              activeShape={(props: unknown) => ActiveShape(props as unknown as ActiveShapeProps)}
              onMouseEnter={(_, i) => setActive(i)}
            >
              {slices.map((s, i) => (
                <Cell key={i} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-3 space-y-1.5">
        {slices.map((s, i) => (
          <li
            key={s.label}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gold/[0.04]"
            onMouseEnter={() => setActive(i)}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="font-sans text-xs">{s.label}</span>
            <span className="ml-auto font-mono text-xs text-gold-light">
              {s.value.toLocaleString()} u
            </span>
            <span className="w-12 text-right font-mono text-xs text-muted-foreground/85">
              {((s.value / totalEquityUnits) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
