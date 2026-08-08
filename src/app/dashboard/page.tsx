import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { OverviewHero } from "@/components/dashboard/overview-hero";
import { TaskList } from "@/components/dashboard/task-list";
import { LiveLedgerTicker } from "@/components/dashboard/live-ticker";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoldStar } from "@/components/aurienta-logo";
import { egp, timeAgo } from "@/lib/aurienta/format";
import { TIER_META, SECTORS } from "@/lib/aurienta/constants";
import {
  Compass,
  Wallet,
  Scale,
  Bot,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Coins,
  Building2,
  ShieldCheck,
  Sparkles,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Overview · AURIENTA" };

// REMED-1D — fixes the CTO audit CRITICAL #2: `/dashboard` previously
// redirected to `/dashboard/portfolio`, which meant the "Overview" nav item
// never highlighted (the active-check is `pathname === item.href`, and no one
// ever landed on `/dashboard`). This is now a real landing page that surfaces
// the most useful post-signin information at a glance: portfolio summary,
// urgent tasks, recent notifications, and quick-action shortcuts.
//
// Reuses data already hydrated by getCurrentUser() (memberships,
// shareholdings, tasks, notifications) — no extra DB hits.

export default async function OverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard");

  // ── Portfolio summary (derived from the user's shareholdings) ──
  const holdings = user.ownershipRecords.filter((s) => s.equityUnits > 0);
  const portfolioValue = holdings.reduce(
    (s, h) => s + h.equityUnits * h.enterprise.equityUnitPriceEgp,
    0
  );
  const costBasis = holdings.reduce((s, h) => s + h.equityUnits * h.avgPriceEgp, 0);
  const unrealised = portfolioValue - costBasis;
  const unrealisedPct = costBasis > 0 ? (unrealised / costBasis) * 100 : 0;

  // Enterprises the user is a member of (vs. just holds shares in).
  const memberEnterprises = user.memberships.map((m) => ({
    id: m.enterprise.id,
    name: m.enterprise.name,
    slug: m.enterprise.slug,
    tier: m.enterprise.tier,
    role: m.role,
    sector: m.enterprise.sector,
    equityUnitPriceEgp: m.enterprise.equityUnitPriceEgp,
  }));

  // Unique enterprises across memberships + shareholdings.
  const enterprisesCount = new Set([
    ...user.memberships.map((m) => m.enterprise.id),
    ...holdings.map((h) => h.enterprise.id),
  ]).size;

  // Tasks are already filtered to `done: false`, ordered by priority desc, take 6.
  const urgentTasks = user.tasks;

  // Notifications are already filtered to `read: false`, ordered by createdAt desc, take 5.
  const recentNotifications = user.notifications;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Welcome hero — shows legal name, STS gauge, portfolio value, role count */}
      <OverviewHero user={user} portfolioValue={portfolioValue} />

      {/* Portfolio summary cards */}
      <section
        aria-label="Portfolio summary"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <SummaryStat
          icon={Wallet}
          label="Portfolio value"
          value={egp(portfolioValue, {
            compact: portfolioValue >= 1_000_000,
          })}
          sub="Mark-to-AI-fundamental-price"
          accent
        />
        <SummaryStat
          icon={unrealised >= 0 ? ArrowUpRight : ArrowRight}
          label="Unrealised P/L"
          value={`${unrealised >= 0 ? "+" : "−"}${egp(Math.abs(unrealised), {
            compact: Math.abs(unrealised) >= 1_000_000,
          })}`}
          sub={`${unrealised >= 0 ? "+" : "−"}${Math.abs(unrealisedPct).toFixed(1)}% vs cost`}
          tone={unrealised >= 0 ? "positive" : "negative"}
        />
        <SummaryStat
          icon={Building2}
          label="Enterprises"
          value={`${enterprisesCount}`}
          sub={`${memberEnterprises.length} seat${memberEnterprises.length === 1 ? "" : "s"} · ${holdings.length} holding${holdings.length === 1 ? "" : "s"}`}
        />
        <SummaryStat
          icon={Coins}
          label="Equity Units held"
          value={holdings.reduce((s, h) => s + h.equityUnits, 0).toLocaleString()}
          sub="Hash-anchored on ledger"
        />
      </section>

      {/* Live ledger ticker — infrastructure-wide constitutional events, Brain AI narrated */}
      <LiveLedgerTicker maxVisible={6} />

      {/* Main grid: tasks + notifications / quick actions */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left column — urgent tasks + quick actions */}
        <div className="flex flex-col gap-6">
          <TaskList tasks={urgentTasks} />

          {/* Quick-action cards */}
          <section aria-label="Quick actions" className="flex flex-col gap-4">
            <header className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-gold" />
              <h2 className="font-serif text-lg font-semibold">Quick actions</h2>
            </header>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickAction
                href="/dashboard/opportunities"
                icon={Compass}
                title="Discover opportunities"
                desc="Browse vetted enterprises raising capital."
              />
              <QuickAction
                href="/dashboard/portfolio"
                icon={Wallet}
                title="View portfolio"
                desc="Equity Units, allocation, dividends."
              />
              <QuickAction
                href="/dashboard/governance"
                icon={Scale}
                title="Open governance"
                desc="Active proposals and constitutional votes."
              />
              <QuickAction
                href="/dashboard/copilot"
                icon={Bot}
                title="Ask the AI Copilot"
                desc="Constitutional Q&A grounded in the ledger."
              />
            </div>
          </section>
        </div>

        {/* Right column — notifications + your enterprises */}
        <div className="flex flex-col gap-6">
          {/* Recent notifications */}
          <section
            aria-label="Recent notifications"
            className="rounded-2xl border border-gold/12 glass p-5 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-gold" />
                <h2 className="font-serif text-base font-semibold">
                  Recent notifications
                </h2>
              </div>
              <Link
                href="/dashboard/notifications"
                className="inline-flex items-center gap-1 font-sans text-[11px] text-gold hover:text-gold-light"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Bell className="h-7 w-7 text-gold/30" />
                <p className="font-sans text-xs text-muted-foreground">
                  No unread notifications.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {recentNotifications.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-xl border border-gold/10 bg-background/40 p-3.5 transition-colors hover:bg-gold/[0.03]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-sans text-sm font-medium text-foreground">
                        {n.title}
                      </p>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-gold/20 bg-transparent text-[11px] uppercase tracking-wider text-muted-foreground"
                      >
                        {n.category}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 font-sans text-xs text-muted-foreground">
                      {n.body}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/85">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo(n.createdAt)}
                      {n.aiPriority && (
                        <>
                          <span className="text-gold/30">·</span>
                          <span className="uppercase tracking-wider text-gold/70">
                            {n.aiPriority}
                          </span>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Your enterprises */}
          <section
            aria-label="Your enterprises"
            className="rounded-2xl border border-gold/12 glass p-5 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-gold" />
                <h2 className="font-serif text-base font-semibold">
                  Your enterprises
                </h2>
              </div>
              <span className="font-mono text-xs text-muted-foreground/85">
                {memberEnterprises.length} seat{memberEnterprises.length === 1 ? "" : "s"}
              </span>
            </div>
            {memberEnterprises.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Building2 className="h-7 w-7 text-gold/30" />
                <p className="font-sans text-xs text-muted-foreground">
                  You&apos;re not yet a member of any enterprise.
                </p>
                <Link
                  href="/dashboard/opportunities"
                  className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-3 py-1.5 font-sans text-xs font-semibold text-black"
                >
                  Explore <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                {memberEnterprises.map((e) => {
                  const tier = TIER_META[e.tier];
                  return (
                    <li key={`${e.id}-${e.role}`}>
                      <Link
                        href={`/dashboard/market?enterprise=${e.slug}`}
                        className="group flex items-center gap-3 rounded-xl border border-gold/10 bg-background/40 p-3 transition-colors hover:bg-gold/[0.03]"
                      >
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gold/20 bg-gold/8">
                          <Building2 className="h-4 w-4 text-gold" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-serif text-sm font-medium text-foreground group-hover:text-gold-light">
                            {e.name}
                          </p>
                          <p className="font-sans text-xs text-muted-foreground">
                            {tier?.name ?? e.tier} · {SECTORS[e.sector]?.label ?? e.sector}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 border-gold/25 bg-transparent text-[11px] uppercase tracking-wider text-gold-light"
                        >
                          {e.role.replace(/_/g, " ")}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Constitutional footer */}
      <footer className="mt-2 flex flex-col items-start gap-2 border-t border-gold/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground/85">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-gold/60" /> Zero Custody
          </span>
          <span className="hidden sm:inline text-gold/15">|</span>
          <span className="inline-flex items-center gap-1">
            <Scale className="h-3 w-3 text-gold/60" /> CRE-enforced
          </span>
          <span className="hidden sm:inline text-gold/15">|</span>
          <span className="inline-flex items-center gap-1">
            <GoldStar className="h-2.5 w-2.5 text-gold/60" /> Sovereign trust
            operationalised
          </span>
        </div>
      </footer>
    </div>
  );
}

// ── Local presentational helpers (gold-themed, dashboard-consistent) ──

function SummaryStat({
  icon: Icon,
  label,
  value,
  sub,
  tone = "neutral",
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  tone?: "positive" | "negative" | "neutral";
  accent?: boolean;
}) {
  const valueColor =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
        ? "text-red-400"
        : accent
          ? "text-gold-light"
          : "text-foreground";
  return (
    <Card
      className={
        accent
          ? "border-gold/25 bg-gold/[0.05] py-4"
          : "border-gold/12 bg-background/40 py-4"
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${
              accent ? "border-gold/30 bg-gold/8" : "border-gold/15 bg-gold/5"
            }`}
          >
            <Icon className="h-3.5 w-3.5 text-gold" />
          </span>
          <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className={`font-serif text-xl font-semibold sm:text-2xl ${valueColor}`}>
          {value}
        </p>
        {sub && (
          <p
            className={`mt-0.5 font-mono text-xs ${
              tone === "positive"
                ? "text-emerald-400/80"
                : tone === "negative"
                  ? "text-red-400/80"
                  : "text-muted-foreground/85"
            }`}
          >
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-gold/12 glass p-4 transition-all hover:border-gold/30 hover:bg-gold/[0.04]"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/8">
          <Icon className="h-4 w-4 text-gold" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-sm font-semibold text-foreground group-hover:text-gold-light">
            {title}
          </p>
          <p className="mt-0.5 font-sans text-[11px] leading-relaxed text-muted-foreground">
            {desc}
          </p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/75 transition-all group-hover:translate-x-0.5 group-hover:text-gold" />
      </div>
    </Link>
  );
}
