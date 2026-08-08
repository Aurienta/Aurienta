"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Bell,
  Sparkles,
  Filter,
  CheckCheck,
  Clock3,
  Scale,
  Wallet,
  ShieldAlert,
  FlagTriangleRight,
  Coins,
  Server,
  ArrowRight,
  RefreshCw,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isYesterday, subDays, parseISO } from "date-fns";

export type NotifPriority = "urgent" | "high" | "medium" | "low";
export type NotifCategory =
  | "governance"
  | "treasury"
  | "compliance"
  | "milestone"
  | "dividend"
  | "system";

export type NotifForUi = {
  id: string;
  title: string;
  body: string;
  category: NotifCategory;
  read: boolean;
  aiPriority: NotifPriority | null;
  aiSummary: string | null;
  createdAt: string; // ISO
  enterpriseName?: string | null;
};

const CATEGORY_META: Record<
  NotifCategory,
  { label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string }
> = {
  governance: { label: "Governance", icon: Scale, color: "#d4af37" },
  treasury: { label: "Treasury", icon: Wallet, color: "#c9a03d" },
  compliance: { label: "Compliance", icon: ShieldAlert, color: "#e0584b" },
  milestone: { label: "Milestone", icon: FlagTriangleRight, color: "#fbbf24" },
  dividend: { label: "Dividend", icon: Coins, color: "#34d399" },
  system: { label: "System", icon: Server, color: "#a89f86" },
};

const PRIORITY_META: Record<
  NotifPriority,
  { label: string; color: string; bg: string; ring: string; order: number }
> = {
  urgent: { label: "Urgent", color: "#f87171", bg: "rgba(224,88,75,0.18)", ring: "rgba(224,88,75,0.55)", order: 0 },
  high: { label: "High", color: "#f4d676", bg: "rgba(212,175,55,0.18)", ring: "rgba(212,175,55,0.55)", order: 1 },
  medium: { label: "Medium", color: "#c9a03d", bg: "rgba(201,160,61,0.14)", ring: "rgba(201,160,61,0.45)", order: 2 },
  low: { label: "Low", color: "#a89f86", bg: "rgba(168,159,134,0.12)", ring: "rgba(168,159,134,0.35)", order: 3 },
};

const ALL_CATEGORIES: (NotifCategory | "all")[] = [
  "all",
  "governance",
  "treasury",
  "compliance",
  "milestone",
  "dividend",
  "system",
];

const ALL_PRIORITIES: (NotifPriority | "all")[] = ["all", "urgent", "high", "medium", "low"];

export function NotificationCenter({ initial }: { initial: NotifForUi[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState<NotifForUi[]>(initial);
  const [catFilter, setCatFilter] = React.useState<NotifCategory | "all">("all");
  const [priFilter, setPriFilter] = React.useState<NotifPriority | "all">("all");
  const [triaging, setTriaging] = React.useState(false);
  const [triageProgress, setTriageProgress] = React.useState<string | null>(null);

  // Auto-triage on first mount if any notifications lack aiPriority.
  const needsTriage = React.useMemo(
    () => items.some((n) => !n.aiPriority),
    [items]
  );
  const triageRan = React.useRef(false);

  const runTriage = React.useCallback(
    async (forceIds?: string[]) => {
      setTriaging(true);
      setTriageProgress("Constitutional AI is reading your inbox…");
      try {
        const ids = forceIds ?? items.filter((n) => !n.aiPriority).map((n) => n.id);
        if (ids.length === 0 && !forceIds) {
          setTriageProgress(null);
          setTriaging(false);
          return;
        }
        const res = await fetch("/api/ai/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(forceIds ? { ids: forceIds } : {}),
        });
        if (!res.ok) throw new Error("triage failed");
        const data = (await res.json()) as {
          triaged: { id: string; priority: NotifPriority; summary: string }[];
          fallbackUsed?: boolean;
        };
        setItems((prev) =>
          prev.map((n) => {
            const t = data.triaged.find((x) => x.id === n.id);
            return t ? { ...n, aiPriority: t.priority, aiSummary: t.summary } : n;
          })
        );
        if (data.fallbackUsed) {
          toast.success("Triage complete (rule-based fallback — AI was unavailable).");
        } else {
          toast.success(`AI triaged ${data.triaged.length} notification${data.triaged.length === 1 ? "" : "s"}.`);
        }
      } catch {
        toast.error("Couldn't reach the constitutional AI for triage. Please retry.");
      } finally {
        setTriaging(false);
        setTriageProgress(null);
      }
    },
    [items]
  );

  React.useEffect(() => {
    if (triageRan.current) return;
    if (!needsTriage) return;
    triageRan.current = true;
    void runTriage();
  }, [needsTriage, runTriage]);

  const markRead = React.useCallback(async (id: string) => {
    // Optimistic update
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (!res.ok) throw new Error("mark-read failed");
      // No toast for read — too noisy. Just refresh the unread count via router.refresh.
      router.refresh();
    } catch {
      // Revert on failure
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
      toast.error("Couldn't mark as read.");
    }
  }, [router]);

  const markAllRead = React.useCallback(async () => {
    const unread = items.filter((n) => !n.read);
    if (unread.length === 0) return;
    // Optimistic
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await Promise.all(
        unread.map((n) =>
          fetch(`/api/notifications/${n.id}/read`, { method: "POST" })
        )
      );
      toast.success(`Marked ${unread.length} notification${unread.length === 1 ? "" : "s"} as read.`);
      router.refresh();
    } catch {
      toast.error("Some notifications couldn't be marked as read.");
    }
  }, [items, router]);

  const snooze = React.useCallback((id: string) => {
    toast("Snoozed for 24h", {
      description: "The notification will resurface tomorrow.",
      style: {
        border: "1px solid rgba(212,175,55,0.25)",
        background: "rgba(16,16,18,0.95)",
        color: "#f3eedd",
      },
      icon: <Clock3 className="h-4 w-4 text-gold" />,
    });
  }, []);

  // Filter + group
  const filtered = React.useMemo(() => {
    return items
      .filter((n) => catFilter === "all" || n.category === catFilter)
      .filter((n) => {
        if (priFilter === "all") return true;
        // Untriaged items (no aiPriority) show in "all" only.
        if (!n.aiPriority) return false;
        return n.aiPriority === priFilter;
      })
      .sort((a, b) => {
        // Priority first, then recency.
        const pa = a.aiPriority ? PRIORITY_META[a.aiPriority].order : 99;
        const pb = b.aiPriority ? PRIORITY_META[b.aiPriority].order : 99;
        if (pa !== pb) return pa - pb;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [items, catFilter, priFilter]);

  const groups = React.useMemo(() => {
    const today: NotifForUi[] = [];
    const yesterday: NotifForUi[] = [];
    const earlier: NotifForUi[] = [];
    const yDate = subDays(new Date(), 1);
    for (const n of filtered) {
      const d = parseISO(n.createdAt);
      if (isToday(d)) today.push(n);
      else if (isYesterday(d) || isSameDay(d, yDate)) yesterday.push(n);
      else earlier.push(n);
    }
    return [
      { label: "Today", items: today },
      { label: "Yesterday", items: yesterday },
      { label: "Earlier", items: earlier },
    ].filter((g) => g.items.length > 0);
  }, [filtered]);

  const unreadCount = items.filter((n) => !n.read).length;
  const urgentCount = items.filter((n) => n.aiPriority === "urgent").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
            <Bell className="h-3 w-3" />
            Unified Notification Center
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-gold-gradient sm:text-4xl">
            Constitutional Inbox
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-sm text-muted-foreground">
            Every signal across governance, treasury, compliance, milestones, dividends,
            and the platform itself — triaged by the constitutional AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runTriage(items.map((n) => n.id))}
            disabled={triaging}
            className="h-9 border-gold/25 bg-gold/[0.03] font-sans text-xs text-muted-foreground hover:bg-gold/10 hover:text-foreground"
          >
            {triaging ? (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-gold" />
            )}
            {triaging ? "Triaging…" : "Re-triage with AI"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="h-9 font-sans text-xs text-muted-foreground hover:text-foreground"
          >
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>
      </header>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile label="Total" value={items.length} accent="gold" />
        <SummaryTile label="Unread" value={unreadCount} accent={unreadCount > 0 ? "gold" : "muted"} />
        <SummaryTile label="Urgent" value={urgentCount} accent={urgentCount > 0 ? "red" : "muted"} />
        <SummaryTile
          label="AI triage"
          value={`${items.filter((n) => n.aiPriority).length}/${items.length}`}
          accent="emerald"
        />
      </div>

      {triageProgress && (
        <div className="flex items-center gap-2 rounded-lg border border-gold/20 bg-gold/[0.04] px-3 py-2 font-sans text-xs text-gold/90">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          {triageProgress}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground/80" />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
            Category
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              active={catFilter === c}
              onClick={() => setCatFilter(c)}
              label={c === "all" ? "All" : CATEGORY_META[c].label}
              icon={c === "all" ? Inbox : CATEGORY_META[c].icon}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground/80" />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
            AI priority
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_PRIORITIES.map((p) => (
            <FilterChip
              key={p}
              active={priFilter === p}
              onClick={() => setPriFilter(p)}
              label={p === "all" ? "All" : PRIORITY_META[p].label}
              dotColor={p === "all" ? null : PRIORITY_META[p].color}
            />
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState hasItems={items.length > 0} />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <div className="mb-2 flex items-center gap-2">
                <h2 className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground/85">
                  {group.label}
                </h2>
                <span className="font-mono text-xs text-muted-foreground/85">
                  · {group.items.length}
                </span>
                <div className="ml-2 h-px flex-1 bg-gradient-to-r from-gold/15 to-transparent" />
              </div>
              <div className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {group.items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      n={n}
                      onMarkRead={() => markRead(n.id)}
                      onSnooze={() => snooze(n.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  n,
  onMarkRead,
  onSnooze,
}: {
  n: NotifForUi;
  onMarkRead: () => void;
  onSnooze: () => void;
}) {
  const cat = CATEGORY_META[n.category];
  const pri = n.aiPriority ? PRIORITY_META[n.aiPriority] : null;
  const CatIcon = cat.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative flex gap-3 rounded-xl border bg-background/40 p-3 transition-colors hover:bg-background/70 sm:p-4",
        n.read ? "border-gold/8 opacity-75" : "border-gold/15",
        pri && pri.color === "#f87171" && "border-red-500/25"
      )}
    >
      {/* Priority dot */}
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            !n.read && "shadow-[0_0_8px_2px_var(--tw-shadow-color)]"
          )}
          style={{
            background: pri ? pri.color : "transparent",
            border: pri ? "none" : "1px solid rgba(212,175,55,0.25)",
            boxShadow: pri && !n.read ? `0 0 8px 2px ${pri.ring}` : undefined,
          }}
          aria-label={pri ? `${pri.label} priority` : "Not yet triaged"}
        />
        <CatIcon className="mt-1 h-3.5 w-3.5" style={{ color: cat.color }} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={cn(
                  "truncate font-sans text-sm font-semibold",
                  n.read ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {n.title}
              </p>
              {!n.read && (
                <span className="rounded-full bg-gold/15 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold">
                  new
                </span>
              )}
            </div>
            <p className="mt-1 font-sans text-xs text-muted-foreground/85">
              {n.body}
            </p>
            {n.aiSummary && (
              <p
                className="mt-2 border-l-2 pl-2 font-serif text-xs italic"
                style={{
                  borderColor: pri ? pri.color : "rgba(212,175,55,0.3)",
                  color: "var(--foreground)",
                  opacity: 0.85,
                }}
              >
                <Sparkles className="mr-1 inline h-3 w-3" style={{ color: pri ? pri.color : "#d4af37" }} />
                {n.aiSummary}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground/80">
              <Badge
                variant="outline"
                className="border-gold/15 bg-transparent px-1.5 py-0 font-mono text-xs"
                style={{ color: cat.color }}
              >
                {cat.label}
              </Badge>
              {pri && (
                <Badge
                  variant="outline"
                  className="border-gold/15 bg-transparent px-1.5 py-0 font-mono text-xs"
                  style={{ color: pri.color }}
                >
                  {pri.label}
                </Badge>
              )}
              {n.enterpriseName && <span>· {n.enterpriseName}</span>}
              <span>· {format(parseISO(n.createdAt), "MMM d, h:mm a")}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {!n.read && (
              <button
                onClick={onMarkRead}
                className="inline-flex items-center gap-1 rounded-md border border-gold/15 bg-gold/[0.04] px-2 py-1 font-sans text-xs text-muted-foreground transition-colors hover:border-gold/30 hover:text-foreground"
              >
                <CheckCheck className="h-3 w-3" />
                Mark read
              </button>
            )}
            <button
              onClick={onSnooze}
              className="inline-flex items-center gap-1 rounded-md border border-gold/10 bg-transparent px-2 py-1 font-sans text-xs text-muted-foreground/85 transition-colors hover:border-gold/25 hover:text-foreground"
            >
              <Clock3 className="h-3 w-3" />
              Snooze
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  icon: Icon,
  dotColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  dotColor?: string | null;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-sans text-[11px] transition-all",
        active
          ? "border-gold/30 bg-gold/[0.1] text-foreground"
          : "border-gold/10 bg-transparent text-muted-foreground/80 hover:text-muted-foreground"
      )}
    >
      {dotColor && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: dotColor }}
          aria-hidden
        />
      )}
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </button>
  );
}

function SummaryTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: "gold" | "red" | "emerald" | "muted";
}) {
  const colorMap: Record<typeof accent, string> = {
    gold: "border-gold/25 text-gold-light",
    red: "border-red-500/30 text-red-300",
    emerald: "border-emerald-500/30 text-emerald-300",
    muted: "border-gold/10 text-muted-foreground",
  };
  return (
    <div className={cn("rounded-xl border bg-gold/[0.03] p-3", colorMap[accent])}>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl font-semibold">{value}</p>
    </div>
  );
}

function EmptyState({ hasItems }: { hasItems: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-gold/12 bg-gold/[0.02] px-6 py-16 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.05]">
        {hasItems ? <AlertCircle className="h-5 w-5 text-muted-foreground/80" /> : <Inbox className="h-5 w-5 text-gold/60" />}
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
        {hasItems ? "No notifications match your filters" : "Inbox zero"}
      </h3>
      <p className="mt-1 max-w-sm font-sans text-xs text-muted-foreground">
        {hasItems
          ? "Try clearing the category or priority filters to see more notifications."
          : "You're all caught up. New constitutional events will appear here as they happen."}
      </p>
      {hasItems && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 h-8 font-sans text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="mr-1.5 h-3 w-3" />
          Clear filters
        </Button>
      )}
    </motion.div>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
