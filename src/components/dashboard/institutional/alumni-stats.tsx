import * as React from "react";
import { Award, TrendingUp, Coins, CalendarClock } from "lucide-react";
import { egp } from "@/lib/aurienta/format";

export function AlumniStats({
  total,
  avgReadiness,
  totalCapitalGraduatedEgp,
  avgYearsToGraduation,
}: {
  total: number;
  avgReadiness: number;
  totalCapitalGraduatedEgp: number;
  avgYearsToGraduation: number;
}) {
  const stats = [
    { icon: Award, label: "Sovereign alumni", value: `${total}`, detail: "graduated enterprises" },
    {
      icon: TrendingUp,
      label: "Avg readiness at graduation",
      value: `${avgReadiness.toFixed(0)}/100`,
      detail: "all six gates cleared",
    },
    {
      icon: Coins,
      label: "Capital graduated",
      value: egp(totalCapitalGraduatedEgp, { compact: totalCapitalGraduatedEgp >= 1_000_000 }),
      detail: "moved off-platform into self-host",
    },
    {
      icon: CalendarClock,
      label: "Avg years to graduation",
      value: `${avgYearsToGraduation.toFixed(1)} yr`,
      detail: "from formation to sovereignty",
    },
  ];
  return (
    <section
      aria-label="Alumni statistics"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-3 rounded-xl border border-gold/12 glass p-4"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gold/20 bg-gold/5">
            <s.icon className="h-4 w-4 text-gold" />
          </span>
          <div className="min-w-0">
            <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="font-serif text-lg font-semibold text-gold-light">{s.value}</p>
            <p className="truncate font-mono text-[11px] text-muted-foreground/85">{s.detail}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
