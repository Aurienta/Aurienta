import Link from "next/link";
import { Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { timeRemaining } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<string, { dot: string; label: string; ring: string }> = {
  urgent: { dot: "bg-red-400", label: "Urgent", ring: "border-red-400/30" },
  high: { dot: "bg-gold", label: "High", ring: "border-gold/30" },
  medium: { dot: "bg-blue-300/70", label: "Medium", ring: "border-gold/15" },
  low: { dot: "bg-muted-foreground/50", label: "Low", ring: "border-gold/10" },
};

const TYPE_ICON: Record<string, React.ElementType> = {
  vote: CheckCircle2,
  milestone: Clock,
  police_clearance: AlertCircle,
  nosi: AlertCircle,
  review: AlertCircle,
  signature: CheckCircle2,
  dividend: CheckCircle2,
};

export function TaskList({
  tasks,
}: {
  tasks: {
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    dueAt: Date | null;
    ctaLabel: string | null;
    ctaHref: string | null;
    enterpriseId: string | null;
  }[];
}) {
  return (
    <div className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">AI Task List</h2>
        <span className="font-mono text-xs text-muted-foreground">{tasks.length} pending</span>
      </div>
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-gold/40" />
          <p className="font-sans text-sm text-muted-foreground">All clear. No pending constitutional actions.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {tasks.map((t) => {
            const ps = PRIORITY_STYLES[t.priority] ?? PRIORITY_STYLES.medium;
            const Icon = TYPE_ICON[t.type] ?? AlertCircle;
            return (
              <div
                key={t.id}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border bg-background/40 p-3.5 transition-colors hover:bg-gold/[0.03]",
                  ps.ring
                )}
              >
                <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/15 bg-gold/5">
                  <Icon className="h-4 w-4 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-sans text-sm font-medium text-foreground">{t.title}</p>
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", ps.dot)} />
                  </div>
                  <p className="mt-0.5 line-clamp-2 font-sans text-xs text-muted-foreground">{t.description}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
                      {ps.label}
                    </span>
                    {t.dueAt && (
                      <span className="font-mono text-xs text-gold/70">⏳ {timeRemaining(t.dueAt)}</span>
                    )}
                    {t.ctaLabel && t.ctaHref && (
                      <Link
                        href={t.ctaHref}
                        className="ml-auto inline-flex items-center gap-1 font-sans text-xs font-medium text-gold hover:text-gold-light"
                      >
                        {t.ctaLabel}
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
