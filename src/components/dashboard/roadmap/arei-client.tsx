"use client";

// AURIENTA Real-Economy Index (AREI) — Dashboard client component.
// Phase 2 informational benchmark. NOT investment advice.
//
// Indigo / purple theme on a light background. Displays the latest
// snapshot value + 30-day SVG line chart + sortable constituents table.
// The "Recompute" button is shown only to aurienta_rep and POSTs to
// /api/arei/compute (CSRF-protected via csrfFetch).

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChartColumn,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertTriangle,
  Building2,
  Activity,
} from "lucide-react";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { egp } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";
import type { AreiSnapshot } from "@prisma/client";
import type { AreiConstituent } from "@/lib/aurienta/arei";

type SortKey = "weight" | "healthScore" | "contribution" | "name";
type SortDir = "asc" | "desc";

type ChartPoint = { date: string; value: number };

type Props = {
  snapshot: AreiSnapshot | null;
  history: AreiSnapshot[];
  constituents: AreiConstituent[];
  canRecompute: boolean;
};

const DISCLAIMER =
  "AREI is an informational benchmark, NOT investment advice. Past performance does not indicate future results.";

const HEALTH_RATING_TONE: Record<string, string> = {
  AAA: "border-violet-300 bg-violet-100 text-violet-800",
  AA: "border-indigo-300 bg-indigo-100 text-indigo-800",
  A: "border-indigo-200 bg-indigo-50 text-indigo-700",
  BBB: "border-emerald-300 bg-emerald-100 text-emerald-800",
  BB: "border-emerald-200 bg-emerald-50 text-emerald-700",
  B: "border-amber-300 bg-amber-100 text-amber-800",
  CCC: "border-amber-200 bg-amber-50 text-amber-700",
  CC: "border-rose-300 bg-rose-100 text-rose-800",
  C: "border-rose-400 bg-rose-200 text-rose-900",
};

function ratingTone(rating: string | null): string {
  if (!rating) return "border-slate-300 bg-slate-100 text-slate-600";
  return HEALTH_RATING_TONE[rating] ?? "border-slate-300 bg-slate-100 text-slate-600";
}

function formatDateTime(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortDate(yyyyMmDd: string): string {
  // "2026-03-04" -> "Mar 04"
  const [y, m, d] = yyyyMmDd.split("-");
  if (!y || !m || !d) return yyyyMmDd;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mi = parseInt(m, 10) - 1;
  if (mi < 0 || mi > 11) return yyyyMmDd;
  return `${monthNames[mi]} ${d}`;
}

export function AreiClient({ snapshot, history, constituents, canRecompute }: Props) {
  const [recomputing, setRecomputing] = React.useState(false);
  const [sortKey, setSortKey] = React.useState<SortKey>("weight");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  // Chart data — derived from the 30-day history (oldest-first).
  const chartPoints: ChartPoint[] = React.useMemo(
    () => history.map((h) => ({ date: h.date, value: h.indexValue })),
    [history],
  );

  const indexValue = snapshot?.indexValue ?? 0;
  const changePct = snapshot?.changePct ?? 0;
  const constituentCount = snapshot?.constituentCount ?? constituents.length;
  const computedAt = snapshot?.computedAt ?? null;
  const date = snapshot?.date ?? null;

  // Live recompute via POST /api/arei/compute.
  async function handleRecompute() {
    setRecomputing(true);
    try {
      const res = await csrfFetch("/api/arei/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; snapshot?: AreiSnapshot };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Recompute failed");
      }
      toast.success("AREI recomputed", {
        description: `Index value ${data.snapshot?.indexValue?.toFixed(2)} · ${data.snapshot?.constituentCount} constituents`,
      });
      // Reload to surface the fresh server-rendered snapshot + constituents.
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Recompute failed";
      toast.error("Recompute failed", { description: msg });
    } finally {
      setRecomputing(false);
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const sortedConstituents = React.useMemo(() => {
    const list = [...constituents];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "healthScore":
          return (a.healthScore - b.healthScore) * dir;
        case "contribution":
          return (a.contribution - b.contribution) * dir;
        case "weight":
        default:
          return (a.weight - b.weight) * dir;
      }
    });
    return list;
  }, [constituents, sortKey, sortDir]);

  const changePositive = changePct > 0.0001;
  const changeNegative = changePct < -0.0001;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Compliance banner (amber) ─────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="font-sans text-sm leading-relaxed">
          <span className="font-semibold">⚠️ {DISCLAIMER}</span>
        </p>
      </div>

      {/* ── Big index display + chart ────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Big index card */}
        <div className="flex flex-col justify-between rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50">
              <ChartColumn className="h-4 w-4 text-indigo-600" />
            </span>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-indigo-500">
                AREI · {date ?? "—"}
              </div>
              <div className="font-serif text-sm font-medium text-slate-700">
                Current index value
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="font-serif text-5xl font-semibold tracking-tight text-indigo-950 sm:text-6xl">
              {indexValue.toFixed(2)}
            </div>
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-medium",
                changePositive && "border-emerald-300 bg-emerald-50 text-emerald-700",
                changeNegative && "border-rose-300 bg-rose-50 text-rose-700",
                !changePositive && !changeNegative && "border-slate-300 bg-slate-100 text-slate-600",
              )}
            >
              {changePositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : changeNegative ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              {changePct >= 0 ? "+" : ""}
              {changePct.toFixed(2)}%
            </div>
            <p className="mt-1.5 font-sans text-xs text-slate-500">
              change vs. prior snapshot
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-indigo-100 pt-4">
            <Metric label="Constituents" value={String(constituentCount)} icon={Building2} />
            <Metric label="Last computed" value={formatDateTime(computedAt)} icon={Activity} />
          </div>
        </div>

        {/* 30-day history chart */}
        <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-semibold text-indigo-950">
                30-day history
              </h2>
              <p className="font-sans text-xs text-slate-500">
                Daily index value (Africa/Cairo)
              </p>
            </div>
            <span className="font-mono text-xs text-indigo-500">
              {chartPoints.length} points
            </span>
          </div>
          <div className="mt-4">
            <AreiLineChart points={chartPoints} />
          </div>
        </div>
      </section>

      {/* ── Recompute bar (aurienta_rep only) ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
        <div className="font-sans text-sm text-slate-600">
          <span className="font-medium text-slate-800">Last computed:</span>{" "}
          <span className="font-mono text-xs text-slate-700">
            {formatDateTime(computedAt)}
          </span>
        </div>
        {canRecompute && (
          <button
            type="button"
            onClick={handleRecompute}
            disabled={recomputing}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-white px-3.5 py-2 text-sm font-medium text-indigo-700 shadow-sm transition",
              "hover:border-indigo-400 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <RefreshCw className={cn("h-4 w-4", recomputing && "animate-spin")} />
            {recomputing ? "Recomputing…" : "Recompute now"}
          </button>
        )}
      </div>

      {/* ── Constituents table ───────────────────────────────────────── */}
      <section className="rounded-2xl border border-indigo-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-indigo-100 px-5 py-3.5">
          <div>
            <h2 className="font-serif text-base font-semibold text-indigo-950">
              Index constituents
            </h2>
            <p className="font-sans text-xs text-slate-500">
              Active enterprises, weighted by Constitutional Health Score
            </p>
          </div>
          <span className="font-mono text-xs text-indigo-500">
            {constituents.length} enterprises
          </span>
        </div>

        {constituents.length === 0 ? (
          <div className="px-5 py-12 text-center font-sans text-sm text-slate-500">
            No active enterprises to index yet. AREI will populate once the first
            enterprise reaches <code className="font-mono text-indigo-600">active</code> status.
          </div>
        ) : (
          <div className="arei-scroll max-h-[28rem] overflow-y-auto">
            <table className="w-full border-collapse text-left font-sans text-sm">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                <tr className="border-b border-indigo-100 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2.5 font-medium">
                    <SortButton
                      label="Enterprise"
                      active={sortKey === "name"}
                      dir={sortDir}
                      onClick={() => toggleSort("name")}
                    />
                  </th>
                  <th className="px-3 py-2.5 font-medium">Rating</th>
                  <th className="px-3 py-2.5 font-medium">
                    <SortButton
                      label="Health"
                      active={sortKey === "healthScore"}
                      dir={sortDir}
                      onClick={() => toggleSort("healthScore")}
                    />
                  </th>
                  <th className="px-3 py-2.5 font-medium">
                    <SortButton
                      label="Weight"
                      active={sortKey === "weight"}
                      dir={sortDir}
                      onClick={() => toggleSort("weight")}
                    />
                  </th>
                  <th className="px-5 py-2.5 text-right font-medium">
                    <SortButton
                      label="Contribution"
                      active={sortKey === "contribution"}
                      dir={sortDir}
                      onClick={() => toggleSort("contribution")}
                      align="right"
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedConstituents.map((c) => (
                  <tr
                    key={c.enterpriseId}
                    className="border-b border-indigo-50 transition-colors hover:bg-indigo-50/40"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/enterprise/${c.slug}`}
                        className="font-medium text-indigo-900 hover:underline"
                      >
                        {c.name}
                      </Link>
                      <div className="font-mono text-[11px] text-slate-400">
                        {c.slug}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide",
                          ratingTone(c.healthRating),
                        )}
                      >
                        {c.healthRating ?? "NR"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${Math.min(100, Math.max(0, c.healthScore))}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-slate-700">
                          {c.healthScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-sm font-medium text-indigo-700">
                        {(c.weight * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-slate-700">
                      {egp(c.contribution, { decimals: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Methodology footer ───────────────────────────────────────── */}
      <footer className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-5 py-4 font-sans text-xs text-slate-600">
        <p className="font-semibold text-indigo-900">Methodology</p>
        <p className="mt-1 leading-relaxed">
          AREI = prior index value + Σ(contribution<sub>i</sub>) ÷ 1000, where
          contribution<sub>i</sub> = (monthlyRevenueEgp + raisedEgp ÷ 12) × weight<sub>i</sub>
          and weight<sub>i</sub> = healthScore<sub>i</sub> ÷ Σ(healthScores). Base value
          is 1000 on first run. Recomputed daily at midnight Africa/Cairo.
        </p>
      </footer>

      <style jsx>{`
        .arei-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgb(99 102 241 / 0.4) transparent;
        }
        .arei-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .arei-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .arei-scroll::-webkit-scrollbar-thumb {
          background-color: rgb(99 102 241 / 0.35);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .arei-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgb(79 70 229 / 0.6);
        }
      `}</style>
    </div>
  );
}

// ── Small building blocks ───────────────────────────────────────────────

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 font-mono text-sm text-slate-800">{value}</div>
    </div>
  );
}

function SortButton({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 transition-colors",
        align === "right" ? "justify-end" : "justify-start",
        active ? "text-indigo-700" : "text-slate-500 hover:text-indigo-600",
      )}
    >
      {label}
      <span className="font-mono text-[10px] text-indigo-400">
        {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}

// ── Inline SVG line chart ────────────────────────────────────────────────

function AreiLineChart({ points }: { points: ChartPoint[] }) {
  // Layout constants
  const width = 720;
  const height = 240;
  const padTop = 12;
  const padRight = 16;
  const padBottom = 28;
  const padLeft = 56;

  if (points.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-indigo-200 bg-indigo-50/30 text-center font-sans text-xs text-slate-500">
        No history yet — the first snapshot seeds the chart.
      </div>
    );
  }

  if (points.length === 1) {
    return (
      <div className="flex h-[240px] flex-col items-center justify-center gap-1 rounded-lg border border-indigo-100 bg-indigo-50/20 text-center">
        <div className="font-serif text-3xl font-semibold text-indigo-950">
          {points[0].value.toFixed(2)}
        </div>
        <div className="font-sans text-xs text-slate-500">
          First snapshot — {shortDate(points[0].date)}. Trend appears tomorrow.
        </div>
      </div>
    );
  }

  // Y range — pad 5% above and below so the line never touches the edges.
  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = rawMax - rawMin || 1;
  const pad = span * 0.08;
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;
  const yRange = yMax - yMin || 1;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const xFor = (i: number) =>
    padLeft + (i / (points.length - 1)) * innerW;
  const yFor = (v: number) =>
    padTop + (1 - (v - yMin) / yRange) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(2)} ${yFor(p.value).toFixed(2)}`)
    .join(" ");

  const areaPath =
    `M ${xFor(0).toFixed(2)} ${(padTop + innerH).toFixed(2)} ` +
    points
      .map((p, i) => `L ${xFor(i).toFixed(2)} ${yFor(p.value).toFixed(2)}`)
      .join(" ") +
    ` L ${xFor(points.length - 1).toFixed(2)} ${(padTop + innerH).toFixed(2)} Z`;

  // Y ticks — 5 evenly spaced.
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const v = yMin + (yRange * i) / 4;
    return { v, y: yFor(v) };
  });

  // X labels — start, middle, end.
  const xLabelIdxs = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  const lastPoint = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="AREI 30-day line chart"
    >
      <defs>
        <linearGradient id="arei-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Horizontal gridlines + Y labels */}
      {yTicks.map((t, i) => (
        <g key={`y-${i}`}>
          <line
            x1={padLeft}
            y1={t.y}
            x2={width - padRight}
            y2={t.y}
            stroke="rgb(226 232 240)"
            strokeWidth={1}
            strokeDasharray={i === 0 || i === yTicks.length - 1 ? undefined : "3 4"}
          />
          <text
            x={padLeft - 8}
            y={t.y + 3}
            textAnchor="end"
            fontSize={10}
            fontFamily="monospace"
            fill="rgb(100 116 139)"
          >
            {t.v.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Area + line */}
      <path d={areaPath} fill="url(#arei-area)" />
      <path
        d={linePath}
        fill="none"
        stroke="#4F46E5"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Last-point dot */}
      <circle
        cx={xFor(points.length - 1)}
        cy={yFor(lastPoint.value)}
        r={4}
        fill="#4F46E5"
        stroke="white"
        strokeWidth={2}
      />

      {/* X-axis labels */}
      {xLabelIdxs.map((idx) => (
        <text
          key={`x-${idx}`}
          x={xFor(idx)}
          y={height - 8}
          textAnchor={idx === 0 ? "start" : idx === points.length - 1 ? "end" : "middle"}
          fontSize={10}
          fontFamily="monospace"
          fill="rgb(100 116 139)"
        >
          {shortDate(points[idx].date)}
        </text>
      ))}
    </svg>
  );
}
