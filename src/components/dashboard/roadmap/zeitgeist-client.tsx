"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Waves,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Signal,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { toast } from "sonner";

// ── Types ──
type Snapshot = {
  date: string;
  sentimentScore: number; // -1..1
  confidencePct: number; // 0..100
  signalCount: number;
  topTheme: string;
  summaryText?: string;
  computedAt?: string;
};

// ── Helpers ──
function mood(score: number): {
  label: string;
  color: string;
  icon: React.ElementType;
} {
  if (score > 0.4) return { label: "Bullish", color: "#10b981", icon: TrendingUp };
  if (score > 0.1) return { label: "Cautiously positive", color: "#84cc16", icon: TrendingUp };
  if (score > -0.1) return { label: "Neutral", color: "#4F46E5", icon: Activity };
  if (score > -0.4) return { label: "Cautiously negative", color: "#f59e0b", icon: TrendingDown };
  return { label: "Bearish", color: "#ef4444", icon: TrendingDown };
}

// ── Semicircular gauge ──
// A semicircle from -1 (left, red) to +1 (right, green). The needle points
// to the current sentimentScore.
function SentimentGauge({ score, confidence }: { score: number; confidence: number }) {
  const size = 220;
  const cx = size / 2;
  const cy = size - 20;
  const radius = 90;
  const strokeWidth = 14;

  // Map score (-1..1) → angle (180°..0°)
  const angle = ((1 - (score + 1) / 2) * 180 * Math.PI) / 180;
  const needleX = cx + Math.cos(angle) * (radius - 6);
  const needleY = cy - Math.sin(angle) * (radius - 6);

  // Build the gradient arc background.
  // We render three colored segments: red (-1..-0.3), amber (-0.3..0.3), green (0.3..1).
  function arcPath(start: number, end: number): string {
    const a1 = ((1 - (start + 1) / 2) * 180 * Math.PI) / 180;
    const a2 = ((1 - (end + 1) / 2) * 180 * Math.PI) / 180;
    const x1 = cx + Math.cos(a1) * radius;
    const y1 = cy - Math.sin(a1) * radius;
    const x2 = cx + Math.cos(a2) * radius;
    const y2 = cy - Math.sin(a2) * radius;
    const largeArc = Math.abs(a1 - a2) > Math.PI ? 1 : 0;
    // Sweep flag: 0 for clockwise (decreasing angle).
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`;
  }

  const m = mood(score);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size - 20} viewBox={`0 0 ${size} ${size - 20}`}>
        {/* Background arcs */}
        <path
          d={arcPath(-1, -0.3)}
          stroke="#ef4444"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          opacity={0.85}
        />
        <path
          d={arcPath(-0.3, 0.3)}
          stroke="#f59e0b"
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.85}
        />
        <path
          d={arcPath(0.3, 1)}
          stroke="#10b981"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          opacity={0.85}
        />
        {/* Needle */}
        <motion.line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={m.color}
          strokeWidth={3}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
        {/* Center hub */}
        <circle cx={cx} cy={cy} r={6} fill={m.color} />
        {/* Tick labels */}
        <text x={cx - radius - 4} y={cy + 14} fontSize="9" fontFamily="monospace" fill="currentColor" className="text-rose-400">
          -1
        </text>
        <text x={cx - 4} y={cy - radius - 4} fontSize="9" fontFamily="monospace" fill="currentColor" className="text-amber-400">
          0
        </text>
        <text x={cx + radius - 6} y={cy + 14} fontSize="9" fontFamily="monospace" fill="currentColor" className="text-emerald-400">
          +1
        </text>
      </svg>

      <div className="-mt-6 flex flex-col items-center">
        <div className="flex items-center gap-2">
          <m.icon className="h-4 w-4" style={{ color: m.color }} />
          <span className="font-serif text-xl font-semibold" style={{ color: m.color }}>
            {m.label}
          </span>
        </div>
        <div className="mt-1 font-mono text-2xl font-semibold text-foreground">
          {(score * 100).toFixed(0)}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/80">
          net sentiment · {confidence.toFixed(0)}% confidence
        </div>
      </div>
    </div>
  );
}

// ── History line chart ──
function HistoryChart({ history }: { history: Snapshot[] }) {
  const width = 720;
  const height = 180;
  const padding = { top: 16, right: 16, bottom: 24, left: 32 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-gold/15 glass p-6 text-center">
        <Activity className="mx-auto h-8 w-8 text-gold/40" />
        <p className="mt-2 font-sans text-xs text-muted-foreground">
          No history yet — sentiment will appear here once snapshots are computed.
        </p>
      </div>
    );
  }

  const n = history.length;
  const xStep = n > 1 ? chartW / (n - 1) : 0;
  const x = (i: number) => padding.left + i * xStep;
  const y = (v: number) =>
    padding.top + chartH / 2 - (v * chartH) / 2; // -1..1 → bottom..top

  // Build polyline points (chronological).
  const points = history
    .map((h, i) => `${x(i).toFixed(1)},${y(h.sentimentScore).toFixed(1)}`)
    .join(" ");

  // Zero line y.
  const zeroY = y(0);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="block"
    >
      {/* Background grid */}
      <line
        x1={padding.left}
        y1={zeroY}
        x2={width - padding.right}
        y2={zeroY}
        stroke="currentColor"
        className="text-muted/40"
        strokeDasharray="3 3"
      />
      <line
        x1={padding.left}
        y1={padding.top}
        x2={width - padding.right}
        y2={padding.top}
        stroke="currentColor"
        className="text-muted/20"
        strokeDasharray="2 4"
      />
      <line
        x1={padding.left}
        y1={padding.top + chartH}
        x2={width - padding.right}
        y2={padding.top + chartH}
        stroke="currentColor"
        className="text-muted/20"
        strokeDasharray="2 4"
      />
      {/* Y labels */}
      <text x={padding.left - 6} y={padding.top + 4} fontSize="9" fontFamily="monospace" fill="currentColor" textAnchor="end" className="text-emerald-400">
        +1
      </text>
      <text x={padding.left - 6} y={zeroY + 3} fontSize="9" fontFamily="monospace" fill="currentColor" textAnchor="end" className="text-muted-foreground">
        0
      </text>
      <text x={padding.left - 6} y={padding.top + chartH + 3} fontSize="9" fontFamily="monospace" fill="currentColor" textAnchor="end" className="text-rose-400">
        -1
      </text>
      {/* Polyline */}
      <motion.polyline
        points={points}
        fill="none"
        stroke="#4F46E5"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
      {/* Data points */}
      {history.map((h, i) => (
        <motion.circle
          key={h.date}
          cx={x(i)}
          cy={y(h.sentimentScore)}
          r={3}
          fill={
            h.sentimentScore > 0.1
              ? "#10b981"
              : h.sentimentScore < -0.1
              ? "#ef4444"
              : "#4F46E5"
          }
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.02 }}
        />
      ))}
      {/* X labels (every 5th) */}
      {history.map((h, i) =>
        i % 5 === 0 || i === n - 1 ? (
          <text
            key={`x-${h.date}`}
            x={x(i)}
            y={height - 6}
            fontSize="8"
            fontFamily="monospace"
            fill="currentColor"
            textAnchor="middle"
            className="text-muted-foreground/70"
          >
            {h.date.slice(5)}
          </text>
        ) : null
      )}
    </svg>
  );
}

// ── Main component ──
export function ZeitgeistClient({
  latest,
  history,
}: {
  latest: Snapshot | null;
  history: Snapshot[];
}) {
  const [refreshing, setRefreshing] = React.useState(false);
  const [latestState, setLatestState] = React.useState(latest);
  const [historyState, setHistoryState] = React.useState(history);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await csrfFetch("/api/zeitgeist?refresh=1&days=30");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Refresh failed");
      if (data.latest) {
        setLatestState({
          date: data.latest.date,
          sentimentScore: data.latest.sentimentScore,
          confidencePct: data.latest.confidencePct,
          signalCount: data.latest.signalCount,
          topTheme: data.latest.topTheme ?? "Quiet day",
          summaryText: data.latest.summaryText,
          computedAt: data.latest.computedAt,
        });
      }
      if (Array.isArray(data.history)) {
        setHistoryState(
          data.history.map((h: Snapshot) => ({
            date: h.date,
            sentimentScore: h.sentimentScore,
            confidencePct: h.confidencePct,
            signalCount: h.signalCount,
            topTheme: h.topTheme ?? "Quiet day",
          }))
        );
      }
      toast.success("Zeitgeist refreshed", {
        description: `Snapshot for ${data.latest?.date ?? "today"} recomputed from last 24h of signals.`,
      });
    } catch (e) {
      toast.error("Refresh failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setRefreshing(false);
    }
  }

  // toast import — make sure it's used (avoids unused import warning)
  void toast;

  return (
    <div className="flex flex-col gap-6">
      {/* Amber disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div>
          <p className="font-sans text-sm font-medium text-amber-700 dark:text-amber-300">
            Sentiment is informational, NOT investment advice.
          </p>
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            The Constitutional Zeitgeist is a descriptive snapshot of past
            platform activity. It does not predict future returns or guarantee
            any outcome. Treat it as a temperature reading, not a forecast.
          </p>
        </div>
      </div>

      {/* Top: gauge + refresh */}
      <section className="relative overflow-hidden rounded-2xl border border-gold/30 glass-gold p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-3 lg:items-center">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <Waves className="h-4 w-4 text-gold" />
              <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-gold-light/85">
                Daily snapshot
              </span>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-semibold">
              Constitutional Zeitgeist
            </h2>
            <p className="mt-1 font-sans text-xs text-muted-foreground">
              {latestState
                ? `Date ${latestState.date} · ${latestState.signalCount} signals · ${latestState.confidencePct.toFixed(0)}% confidence`
                : "No snapshot computed yet"}
            </p>
            <Button
              onClick={refresh}
              disabled={refreshing}
              variant="outline"
              className="mt-4 border-gold/30 hover:bg-gold/5"
            >
              {refreshing ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
              )}
              Refresh
            </Button>
          </div>
          <div className="lg:col-span-2">
            {latestState ? (
              <SentimentGauge
                score={latestState.sentimentScore}
                confidence={latestState.confidencePct}
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-gold/10 bg-foreground/[0.02] p-6 text-center">
                <p className="font-sans text-xs text-muted-foreground">
                  Click &quot;Refresh&quot; to compute today&apos;s sentiment snapshot.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Summary text + top theme */}
      {latestState && (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-gold/15 glass p-5">
            <div className="flex items-center gap-2">
              <Signal className="h-3.5 w-3.5 text-gold" />
              <h3 className="font-serif text-base font-semibold">Summary</h3>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground/80">
                computed {latestState.computedAt ? new Date(latestState.computedAt).toLocaleString() : "—"}
              </span>
            </div>
            <p className="mt-3 font-sans text-sm leading-relaxed text-foreground/90">
              {latestState.summaryText ?? "No summary available."}
            </p>
          </div>
          <div className="rounded-2xl border border-gold/15 glass-gold p-5">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-gold" />
              <h3 className="font-serif text-base font-semibold">Top theme</h3>
            </div>
            <div className="mt-3 font-serif text-xl font-semibold text-gold-gradient">
              {latestState.topTheme}
            </div>
            <p className="mt-1 font-sans text-xs text-muted-foreground">
              The most frequent event type observed in the last 24 hours.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gold/10 bg-foreground/[0.02] p-3 text-center">
                <div className="font-serif text-lg font-semibold text-gold-light">
                  {latestState.signalCount}
                </div>
                <div className="font-mono text-[9px] uppercase text-muted-foreground/80">
                  signals
                </div>
              </div>
              <div className="rounded-lg border border-gold/10 bg-foreground/[0.02] p-3 text-center">
                <div className="font-serif text-lg font-semibold text-gold-light">
                  {latestState.confidencePct.toFixed(0)}%
                </div>
                <div className="font-mono text-[9px] uppercase text-muted-foreground/80">
                  confidence
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* History line chart */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-gold" />
            <h3 className="font-serif text-base font-semibold">
              30-day sentiment history
            </h3>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">
              {historyState.length} snapshots
            </span>
          </div>
        </div>
        <div className="p-5">
          <HistoryChart history={historyState} />
        </div>
      </section>

      {/* Signal count breakdown */}
      <section className="overflow-hidden rounded-2xl border border-gold/15 glass">
        <div className="border-b border-gold/12 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Signal className="h-3.5 w-3.5 text-gold" />
            <h3 className="font-serif text-base font-semibold">
              Signal count breakdown
            </h3>
          </div>
        </div>
        <div className="p-5">
          <p className="font-sans text-xs text-muted-foreground">
            Each daily snapshot aggregates signals from the last 24 hours.
            Below is the historical signal volume — high signal density
            correlates with higher confidence scores.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {historyState.slice(-8).reverse().map((h) => {
              const m = mood(h.sentimentScore);
              return (
                <div
                  key={h.date}
                  className="rounded-lg border border-gold/10 bg-foreground/[0.02] p-3"
                >
                  <div className="font-mono text-[10px] text-muted-foreground/80">
                    {h.date}
                  </div>
                  <div
                    className="mt-1 font-serif text-lg font-semibold"
                    style={{ color: m.color }}
                  >
                    {h.signalCount}
                  </div>
                  <div className="font-mono text-[9px] uppercase text-muted-foreground/80">
                    signals
                  </div>
                  <div className="mt-1 font-mono text-[10px]" style={{ color: m.color }}>
                    {(h.sentimentScore * 100).toFixed(0)} net
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
