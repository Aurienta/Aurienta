"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Vote,
  FlagTriangleRight,
  CheckSquare,
  ShieldAlert,
  TrendingUp,
  CircleDot,
  ArrowRight,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addDays,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type CalCategory = "vote" | "milestone" | "task" | "compliance" | "valuation";

export type CalEvent = {
  id: string;
  date: string; // ISO date
  title: string;
  category: CalCategory;
  enterprise?: string;
  href?: string;
  meta?: string;
};

const CATEGORY_META: Record<
  CalCategory,
  { label: string; color: string; bg: string; border: string; ring: string; icon: React.ComponentType<{ className?: string }> }
> = {
  vote: {
    label: "Votes",
    color: "#f4d676",
    bg: "rgba(212,175,55,0.16)",
    border: "rgba(212,175,55,0.4)",
    ring: "rgba(212,175,55,0.6)",
    icon: Vote,
  },
  milestone: {
    label: "Milestones",
    color: "#fbbf24",
    bg: "rgba(245,158,11,0.16)",
    border: "rgba(245,158,11,0.4)",
    ring: "rgba(245,158,11,0.6)",
    icon: FlagTriangleRight,
  },
  task: {
    label: "Tasks",
    color: "#d4af37",
    bg: "rgba(201,160,61,0.14)",
    border: "rgba(201,160,61,0.35)",
    ring: "rgba(201,160,61,0.55)",
    icon: CheckSquare,
  },
  compliance: {
    label: "Compliance",
    color: "#f87171",
    bg: "rgba(224,88,75,0.16)",
    border: "rgba(224,88,75,0.4)",
    ring: "rgba(224,88,75,0.6)",
    icon: ShieldAlert,
  },
  valuation: {
    label: "Valuation",
    color: "#34d399",
    bg: "rgba(52,211,153,0.14)",
    border: "rgba(52,211,153,0.36)",
    ring: "rgba(52,211,153,0.55)",
    icon: TrendingUp,
  },
};

const ALL_CATEGORIES: CalCategory[] = ["vote", "milestone", "task", "compliance", "valuation"];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({ events }: { events: CalEvent[] }) {
  const [cursor, setCursor] = React.useState<Date>(new Date());
  const [active, setActive] = React.useState<Set<CalCategory>>(new Set(ALL_CATEGORIES));

  const toggleCat = (c: CalCategory) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const filtered = React.useMemo(
    () => events.filter((e) => active.has(e.category)),
    [events, active]
  );

  // Group events by date string for quick lookup
  const byDay = React.useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of filtered) {
      const key = format(new Date(e.date), "yyyy-MM-dd");
      const arr = m.get(key) ?? [];
      arr.push(e);
      m.set(key, arr);
    }
    // Sort each day's events by category priority
    const order: Record<CalCategory, number> = { compliance: 0, vote: 1, milestone: 2, task: 3, valuation: 4 };
    for (const arr of m.values()) {
      arr.sort((a, b) => order[a.category] - order[b.category]);
    }
    return m;
  }, [filtered]);

  // Build month grid (6 weeks for stable layout)
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  // Pad to 6 rows (42 cells) for stable height
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  while (days.length < 42) days.push(addDays(days[days.length - 1], 1));

  // Today's schedule
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const todayEvents = byDay.get(todayKey) ?? [];

  // Next 30 days list (from today)
  const next30 = React.useMemo(() => {
    const now = new Date();
    const horizon = addDays(now, 30);
    return filtered
      .filter((e) => {
        const d = new Date(e.date);
        return d >= startOfDay(now) && d <= horizon;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filtered]);

  // Group next30 by date
  const next30Grouped = React.useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of next30) {
      const key = format(new Date(e.date), "yyyy-MM-dd");
      const arr = m.get(key) ?? [];
      arr.push(e);
      m.set(key, arr);
    }
    return Array.from(m.entries());
  }, [next30]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header: month nav + filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(subMonths(cursor, 1))}
            className="h-8 w-8 border-gold/20 bg-transparent hover:bg-gold/5"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[160px] text-center">
            <p className="font-serif text-lg font-semibold text-foreground">
              {format(cursor, "MMMM yyyy")}
            </p>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
              Constitutional Calendar
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(addMonths(cursor, 1))}
            className="h-8 w-8 border-gold/20 bg-transparent hover:bg-gold/5"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(new Date())}
            className="ml-2 h-8 border border-gold/20 bg-gold/[0.03] font-sans text-xs text-muted-foreground hover:bg-gold/10 hover:text-foreground"
          >
            Today
          </Button>
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          {ALL_CATEGORIES.map((c) => {
            const meta = CATEGORY_META[c];
            const on = active.has(c);
            const Icon = meta.icon;
            return (
              <button
                key={c}
                onClick={() => toggleCat(c)}
                aria-pressed={on}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-sans text-[11px] transition-all",
                  on
                    ? "text-foreground"
                    : "border-gold/10 bg-transparent text-muted-foreground/75 hover:text-muted-foreground"
                )}
                style={
                  on
                    ? { borderColor: meta.border, background: meta.bg, color: meta.color }
                    : undefined
                }
              >
                <Icon className="h-3 w-3" />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's constitutional schedule */}
      <TodayScheduleCard events={todayEvents} />

      {/* Month grid + next-30-days list */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Month grid */}
        <div className="rounded-2xl glass p-4">
          {/* Weekday header */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-1 text-center font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground/80"
              >
                {d}
              </div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const dayEvents = byDay.get(key) ?? [];
              const inMonth = isSameMonth(d, cursor);
              const today = isToday(d);
              return (
                <div
                  key={key}
                  className={cn(
                    "relative flex min-h-[84px] flex-col gap-1 rounded-md border p-1.5 transition-colors",
                    inMonth ? "border-gold/10 bg-gold/[0.02]" : "border-transparent bg-transparent opacity-40",
                    today && "border-gold/50 bg-gold/[0.06] ring-1 ring-gold/40"
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-[11px]",
                      today ? "font-bold text-gold" : inMonth ? "text-muted-foreground" : "text-muted-foreground/75"
                    )}
                  >
                    {format(d, "d")}
                    {today && <span className="ml-1 hidden font-sans text-[11px] uppercase tracking-wider sm:inline">today</span>}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {dayEvents.slice(0, 3).map((e) => {
                      const meta = CATEGORY_META[e.category];
                      return (
                        <EventChip key={e.id} e={e} meta={meta} compact />
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="font-mono text-[11px] text-muted-foreground/80">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next 30 days list */}
        <div className="rounded-2xl glass-gold p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gold" />
              <h3 className="font-serif text-sm font-semibold text-foreground">
                Next 30 days
              </h3>
            </div>
            <span className="font-mono text-xs text-muted-foreground/80">
              {next30.length} event{next30.length === 1 ? "" : "s"}
            </span>
          </div>
          {next30Grouped.length === 0 ? (
            <div className="py-10 text-center">
              <CircleDot className="mx-auto h-6 w-6 text-muted-foreground/30" />
              <p className="mt-2 font-sans text-xs text-muted-foreground/85">
                No upcoming constitutional events in the next 30 days.
              </p>
            </div>
          ) : (
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {next30Grouped.map(([day, evs]) => (
                <div key={day}>
                  <p className="mb-1.5 px-1 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
                    {format(new Date(day), "EEE, MMM d")}
                    {isToday(new Date(day)) && (
                      <span className="ml-2 text-gold">· today</span>
                    )}
                  </p>
                  <div className="space-y-1.5">
                    {evs.map((e) => (
                      <EventRow key={e.id} e={e} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventChip({
  e,
  meta,
  compact,
}: {
  e: CalEvent;
  meta: (typeof CATEGORY_META)[CalCategory];
  compact?: boolean;
}) {
  const Icon = meta.icon;
  const inner = (
    <span
      className={cn(
        "flex items-center gap-1 rounded-sm border px-1 py-0.5 font-sans text-xs leading-tight transition-colors",
        compact ? "truncate" : ""
      )}
      style={{ borderColor: meta.border, background: meta.bg, color: meta.color }}
      title={e.title}
    >
      <Icon className="h-2.5 w-2.5 shrink-0" />
      <span className={cn("truncate", compact ? "max-w-[68px]" : "")}>{e.title}</span>
    </span>
  );
  if (e.href) {
    return (
      <Link href={e.href} className="block transition-transform hover:scale-[1.02]">
        {inner}
      </Link>
    );
  }
  return inner;
}

function EventRow({ e }: { e: CalEvent }) {
  const meta = CATEGORY_META[e.category];
  const Icon = meta.icon;
  const inner = (
    <div
      className="group flex items-start gap-2.5 rounded-lg border bg-background/40 px-2.5 py-2 transition-colors hover:bg-background/70"
      style={{ borderColor: meta.border }}
    >
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded"
        style={{ background: meta.bg, color: meta.color }}
      >
        <Icon className="h-3 w-3" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-xs text-foreground">{e.title}</p>
        <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-muted-foreground/85">
          <span style={{ color: meta.color }}>{meta.label}</span>
          {e.enterprise && <span className="truncate">· {e.enterprise}</span>}
          {e.meta && <span>· {e.meta}</span>}
        </div>
      </div>
      {e.href && (
        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/85 transition-all group-hover:translate-x-0.5 group-hover:text-gold" />
      )}
    </div>
  );
  if (e.href) {
    return <Link href={e.href}>{inner}</Link>;
  }
  return inner;
}

function TodayScheduleCard({ events }: { events: CalEvent[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/[0.08] via-background to-background p-5"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
            Today's constitutional schedule
          </p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-foreground">
            {format(new Date(), "EEEE, MMMM d")}
          </h2>
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            {events.length === 0
              ? "Nothing scheduled today — your constitutional obligations are current."
              : `${events.length} event${events.length === 1 ? "" : "s"} due today across your enterprises.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((c) => {
            const meta = CATEGORY_META[c];
            const n = events.filter((e) => e.category === c).length;
            if (n === 0) return null;
            return (
              <div
                key={c}
                className="flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-xs"
                style={{ borderColor: meta.border, background: meta.bg, color: meta.color }}
              >
                <meta.icon className="h-3 w-3" />
                {n} {meta.label.toLowerCase().replace(/s$/, "")}
                {n === 1 ? "" : "s"}
              </div>
            );
          })}
          {events.length === 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-300">
              <CheckSquare className="h-3 w-3" />
              All clear
            </div>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {events.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative mt-4 grid gap-2 border-t border-gold/10 pt-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {events.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
