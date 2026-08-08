import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { CalendarGrid, type CalEvent } from "@/components/dashboard/ux/calendar-grid";
import { CalendarDays, Scale, Hourglass } from "lucide-react";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Constitutional Calendar · AURIENTA",
  description:
    "A unified calendar of every constitutional deadline — votes, milestones, compliance windows — across all your enterprises.",
};

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/calendar");

  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);

  // 1. Open proposals with voting end dates
  const proposals = enterpriseIds.length
    ? await db.proposal.findMany({
        where: {
          enterpriseId: { in: enterpriseIds },
          status: "voting_open",
        },
        include: { enterprise: { select: { name: true, slug: true } } },
      })
    : [];

  // 2. Upcoming milestones (dueAt in the future)
  const milestones = enterpriseIds.length
    ? await db.milestone.findMany({
        where: {
          enterpriseId: { in: enterpriseIds },
          dueAt: { gt: new Date() },
        },
        include: { enterprise: { select: { name: true, slug: true } } },
      })
    : [];

  // 3. Dashboard tasks with due dates that aren't done
  const tasks = await db.dashboardTask.findMany({
    where: {
      userId: user.id,
      done: false,
      dueAt: { not: null },
    },
  });
  const taskEntIds = Array.from(
    new Set(tasks.map((t) => t.enterpriseId).filter(Boolean) as string[])
  );
  const taskEnts = taskEntIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: taskEntIds } },
        select: { id: true, name: true, slug: true },
      })
    : [];
  const taskEntById = new Map(taskEnts.map((e) => [e.id, e]));

  // 4. Compliance deadlines (mock): police clearance expiry + quarterly valuation
  const enterprises = enterpriseIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: enterpriseIds } },
        select: { id: true, name: true, slug: true, policeClearanceValid: true, tier: true },
      })
    : [];

  const events: CalEvent[] = [];

  // Vote events (gold)
  for (const p of proposals) {
    events.push({
      id: `vote-${p.id}`,
      date: p.votingEndsAt.toISOString(),
      title: `Vote ends: ${p.title}`,
      category: "vote",
      enterprise: p.enterprise.name,
      href: "/dashboard/governance",
      meta: p.passThreshold > 50 ? "supermajority" : "simple majority",
    });
  }

  // Milestone events (amber)
  for (const m of milestones) {
    if (!m.dueAt) continue;
    events.push({
      id: `milestone-${m.id}`,
      date: m.dueAt.toISOString(),
      title: `Milestone due: ${m.title}`,
      category: "milestone",
      enterprise: m.enterprise.name,
      href: "/dashboard/manager",
      meta: `EVE ${(m.eveConfidence * 100).toFixed(0)}%`,
    });
  }

  // Task events
  for (const t of tasks) {
    if (!t.dueAt) continue;
    const cat: CalEvent["category"] =
      t.type === "police_clearance" || t.type === "nosi"
        ? "compliance"
        : t.type === "vote"
        ? "vote"
        : t.type === "milestone"
        ? "milestone"
        : "task";
    const ent = t.enterpriseId ? taskEntById.get(t.enterpriseId) : null;
    events.push({
      id: `task-${t.id}`,
      date: t.dueAt.toISOString(),
      title: t.title,
      category: cat,
      enterprise: ent?.name,
      href: t.ctaHref ?? "/dashboard",
      meta: t.priority,
    });
  }

  // Mock compliance deadlines: police clearance expiry + next quarterly valuation
  const now = new Date();
  for (const e of enterprises) {
    // Police clearance: if invalid → expired (today); if valid → expiry in 120 days
    const policeExpiry = new Date(now);
    if (e.policeClearanceValid) {
      policeExpiry.setDate(policeExpiry.getDate() + 120);
    }
    events.push({
      id: `police-${e.id}`,
      date: policeExpiry.toISOString(),
      title: `Police clearance ${e.policeClearanceValid ? "expires" : "expired"} — ${e.name}`,
      category: "compliance",
      enterprise: e.name,
      href: "/dashboard/compliance",
      meta: e.policeClearanceValid ? "120 days" : "expired",
    });

    // Quarterly valuation: next quarter end
    const qEnd = nextQuarterEnd(now);
    events.push({
      id: `valuation-${e.id}`,
      date: qEnd.toISOString(),
      title: `Quarterly valuation — ${e.name}`,
      category: "valuation",
      enterprise: e.name,
      href: "/dashboard/portfolio",
      meta: `Tier ${e.tier}`,
    });
  }

  // Stats summary
  const now30 = new Date(now);
  now30.setDate(now30.getDate() + 30);
  const upcoming = events.filter((e) => {
    const d = new Date(e.date);
    return d >= now && d <= now30;
  });
  const overdue = events.filter((e) => new Date(e.date) < now);
  const votes = events.filter((e) => e.category === "vote").length;
  const compliance = events.filter((e) => e.category === "compliance").length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
            <CalendarDays className="h-3 w-3" />
            Constitutional Calendar
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-gold-gradient sm:text-4xl">
            Timeline of Obligations
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-sm text-muted-foreground">
            Every constitutional deadline across your enterprises — votes, milestones,
            compliance windows, and quarterly valuations — on a single ledger of time.
          </p>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatChip icon={Hourglass} label="Next 30 days" value={upcoming.length} accent="gold" />
          <StatChip icon={Scale} label="Open votes" value={votes} accent="vote" />
          <StatChip icon={CalendarDays} label="Compliance" value={compliance} accent="compliance" />
          <StatChip icon={CalendarDays} label="Overdue" value={overdue.length} accent="overdue" />
        </div>
      </header>

      <CalendarGrid events={events} />

      {/* Constitutional hash footer */}
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gold/10 pt-4 font-mono text-xs text-muted-foreground/80">
        <span>Constitution live · hash {CONSTITUTIONAL_HASH.slice(0, 18)}…</span>
        <span>{events.length} constitutional events tracked</span>
      </footer>
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: "gold" | "vote" | "compliance" | "overdue";
}) {
  const colorMap: Record<typeof accent, string> = {
    gold: "border-gold/25 text-gold-light",
    vote: "border-gold/40 text-gold-light",
    compliance: "border-red-500/30 text-red-300",
    overdue: "border-red-500/40 text-red-300",
  };
  return (
    <div className={`rounded-xl border bg-gold/[0.03] p-3 ${colorMap[accent]}`}>
      <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 font-serif text-2xl font-semibold">{value}</p>
    </div>
  );
}

function nextQuarterEnd(from: Date): Date {
  const m = from.getMonth();
  const y = from.getFullYear();
  // Q1=Mar end, Q2=Jun, Q3=Sep, Q4=Dec
  let endMonth: number;
  if (m <= 2) endMonth = 2;
  else if (m <= 5) endMonth = 5;
  else if (m <= 8) endMonth = 8;
  else endMonth = 11;
  const d = new Date(y, endMonth + 1, 0, 23, 59, 59, 0); // last day of quarter month
  return d;
}
