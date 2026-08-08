import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { GoldStar } from "@/components/aurienta-logo";
import { timeAgo } from "@/lib/aurienta/format";
import { Prisma } from "@prisma/client";
import {
  ScrollText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Activity,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Server,
  AlertTriangle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AuditActivityFeed,
  type AuditFeedEntry,
} from "@/components/dashboard/admin/audit-activity-feed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Audit Log Viewer · AURIENTA Admin",
  description:
    "AURIENTA Steward audit console — searchable, exportable immutable audit trail of every constitutional infrastructure action: sign-ins, CRE decisions, AI calls, governance votes.",
};

const PAGE_SIZE = 50;

type SearchParams = {
  actor?: string;
  action?: string;
  result?: string;
  target?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: string;
};

/**
 * Build a Prisma where clause from the URL filter params. Shared between the
 * page query and the summary aggregations so the dashboard reflects the SAME
 * slice the user is currently viewing.
 */
function buildWhere(p: SearchParams): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  const actor = p.actor?.trim();
  const action = p.action?.trim();
  const result = p.result?.trim();
  const target = p.target?.trim();
  const from = p.from?.trim();
  const to = p.to?.trim();
  const search = p.search?.trim();

  if (actor) where.actorId = actor;
  if (action) where.action = action;
  if (result === "allowed" || result === "denied") where.result = result;
  if (target) where.target = { contains: target };

  if (search) {
    where.OR = [
      { action: { contains: search } },
      { target: { contains: search } },
      { reason: { contains: search } },
    ];
  }

  const tsRange: Prisma.DateTimeFilter = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) tsRange.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) tsRange.lte = d;
  }
  if (Object.keys(tsRange).length > 0) where.timestamp = tsRange;
  return where;
}

/** Stringify the current filter params back into a query string (page omitted). */
function filterQs(p: SearchParams, extra: Record<string, string | number> = {}): string {
  const sp = new URLSearchParams();
  for (const k of ["actor", "action", "result", "target", "from", "to", "search"] as const) {
    const v = p[k]?.trim();
    if (v) sp.set(k, v);
  }
  for (const [k, v] of Object.entries(extra)) sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default async function AuditLogViewerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/admin/audit");
  const hasRole = user.memberships.some((m) => m.role === "aurienta_rep");
  if (!hasRole) redirect("/dashboard");

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where = buildWhere(sp);

  // ── Parallel queries: filtered page + summaries + live feed ──
  const [
    rows,
    total,
    byResultAgg,
    byActionAgg,
    deniedCount,
    liveFeedRaw,
    distinctActions,
  ] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { timestamp: "desc" },
      include: {
        actor: { select: { id: true, legalName: true, email: true } },
      },
    }),
    db.auditLog.count({ where }),
    db.auditLog.groupBy({ by: ["result"], _count: { _all: true }, where }),
    db.auditLog.groupBy({
      by: ["action"],
      _count: { _all: true },
      where,
      orderBy: { _count: { action: "desc" } },
      take: 10,
    }),
    db.auditLog.count({ where: { ...where, result: "denied" } }),
    // Live feed — last 50 across ALL actions (unfiltered).
    db.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 50,
      select: {
        id: true,
        action: true,
        target: true,
        result: true,
        reason: true,
        actorId: true,
        timestamp: true,
        ip: true,
        actor: { select: { legalName: true } },
      },
    }),
    db.auditLog.findMany({
      distinct: ["action"],
      orderBy: { action: "asc" },
      select: { action: true },
      take: 200,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const byResult: Record<string, number> = { allowed: 0, denied: 0 };
  for (const r of byResultAgg) {
    if (r.result === "allowed" || r.result === "denied") {
      byResult[r.result] = r._count._all;
    } else {
      byResult.denied += r._count._all;
    }
  }
  const byAction = byActionAgg.map((r) => ({ action: r.action, count: r._count._all }));

  const liveFeed: AuditFeedEntry[] = liveFeedRaw.map((e) => ({
    id: e.id,
    action: e.action,
    target: e.target,
    result: e.result,
    reason: e.reason,
    actorId: e.actorId,
    actorName: e.actor?.legalName ?? null,
    timestamp: e.timestamp.toISOString(),
    ip: e.ip,
  }));

  const filtersActive = Boolean(
    sp.actor || sp.action || sp.result || sp.target || sp.from || sp.to || sp.search
  );

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Admin · Audit Console"
        icon={ScrollText}
        title="Every action, on the record"
        subtitle="The Steward watches the watchers. Searchable, exportable, immutable trail of every sign-in, CRE decision, AI call, and governance action across the constitutional network."
      />

      {/* Live platform activity feed */}
      <AuditActivityFeed initial={liveFeed} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Total entries (filtered)"
          value={total.toLocaleString()}
          icon={Activity}
          tone="gold"
        />
        <SummaryCard
          label="Allowed"
          value={byResult.allowed.toLocaleString()}
          icon={CheckCircle2}
          tone="emerald"
        />
        <SummaryCard
          label="Denied"
          value={byResult.denied.toLocaleString()}
          icon={XCircle}
          tone="rose"
        />
        <SummaryCard
          label="Top action (filtered)"
          value={byAction[0]?.action ?? "—"}
          sub={byAction[0] ? `${byAction[0].count.toLocaleString()}×` : "no events"}
          icon={ScrollText}
          tone="gold"
        />
      </div>

      {/* Filter bar + export */}
      <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">Filter the audit log</h2>
          {filtersActive && (
            <Link
              href="/dashboard/admin/audit"
              className="ml-auto inline-flex items-center gap-1 rounded-md border border-gold/15 bg-background/40 px-2 py-1 font-sans text-[11px] uppercase tracking-wider text-muted-foreground transition hover:bg-gold/8 hover:text-gold"
            >
              <XCircle className="h-3 w-3" /> Clear filters
            </Link>
          )}
        </div>

        <form method="get" action="/dashboard/admin/audit" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
              Search (action · target · reason)
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                name="search"
                defaultValue={sp.search ?? ""}
                placeholder="auth.signin, EcoPack, denied…"
                className="pl-8"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
              Result
            </span>
            <select
              name="result"
              defaultValue={sp.result ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
            >
              <option value="">all results</option>
              <option value="allowed">allowed</option>
              <option value="denied">denied</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
              Action (exact)
            </span>
            <select
              name="action"
              defaultValue={sp.action ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
            >
              <option value="">all actions</option>
              {distinctActions.map((a) => (
                <option key={a.action} value={a.action}>
                  {a.action}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1.5">
              <span className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
                From
              </span>
              <Input
                name="from"
                type="date"
                defaultValue={sp.from ?? ""}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
                To
              </span>
              <Input
                name="to"
                type="date"
                defaultValue={sp.to ?? ""}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="submit" className="bg-gold/90 text-black hover:bg-gold">
              <Search className="h-3.5 w-3.5" /> Apply filters
            </Button>
            {sp.actor && <input type="hidden" name="actor" value={sp.actor} />}
            {sp.target && <input type="hidden" name="target" value={sp.target} />}
            <Link
              href={`/api/admin/audit/export${filterQs(sp)}`}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-gold/30 bg-gold/5 px-4 text-sm font-medium text-gold transition hover:bg-gold/10"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
              <span className="font-mono text-[10px] uppercase tracking-wider text-gold/60">
                {total.toLocaleString()} rows
              </span>
            </Link>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground/80">
              page {page} of {totalPages} · {total.toLocaleString()} entries match
            </span>
          </div>
        </form>

        {/* Top actions inline summary */}
        {byAction.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gold/8 pt-4">
            <span className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
              Top actions (filtered window)
            </span>
            {byAction.map((a) => (
              <span
                key={a.action}
                className="inline-flex items-center gap-1.5 rounded-md border border-gold/15 bg-background/40 px-2 py-0.5 font-mono text-[11px] text-foreground/85"
              >
                <code className="text-gold-light">{a.action}</code>
                <span className="text-muted-foreground/70">{a.count.toLocaleString()}×</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Audit table */}
      <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-base font-semibold">Audit log entries</h2>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground/80">
            showing {rows.length} of {total.toLocaleString()} · page {page}/{totalPages}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gold/15 bg-background/30 py-12 text-center">
            <AlertTriangle className="h-6 w-6 text-gold/60" />
            <p className="font-serif text-sm font-semibold">No audit entries match this filter</p>
            <p className="max-w-md font-sans text-xs text-muted-foreground">
              Try widening the date range or clearing the search. The audit log is append-only —
              every Steward view of this page is itself recorded as <code>admin.audit.view</code>.
            </p>
            <Link
              href="/dashboard/admin/audit"
              className="mt-2 inline-flex items-center gap-1 rounded-md border border-gold/20 bg-gold/5 px-3 py-1.5 font-sans text-xs text-gold transition hover:bg-gold/10"
            >
              <XCircle className="h-3 w-3" /> Clear filters
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="font-sans text-sm">
                <TableHeader>
                  <TableRow className="border-gold/15 hover:bg-transparent">
                    <TableHead className="text-gold-light/85">Timestamp</TableHead>
                    <TableHead className="text-gold-light/85">Actor</TableHead>
                    <TableHead className="text-gold-light/85">Action</TableHead>
                    <TableHead className="text-gold-light/85">Target</TableHead>
                    <TableHead className="text-gold-light/85">Result</TableHead>
                    <TableHead className="text-gold-light/85">Reason</TableHead>
                    <TableHead className="text-gold-light/85">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const ok = r.result === "allowed";
                    return (
                      <TableRow key={r.id} className="border-gold/8">
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-[11px] text-foreground/90">
                              {new Date(r.timestamp).toISOString().slice(0, 19).replace("T", " ")}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground/70">
                              <Clock className="h-2.5 w-2.5" /> {timeAgo(r.timestamp)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-sans text-[12px] text-foreground/90">
                              {r.actor?.legalName ?? "system"}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground/70">
                              {r.actorId ? r.actorId.slice(-8) : "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="font-mono text-[11px] text-gold-light">
                            {r.action}
                          </code>
                        </TableCell>
                        <TableCell className="max-w-[18rem]">
                          <span className="block truncate font-sans text-[12px] text-foreground/80" title={r.target ?? undefined}>
                            {r.target ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                              ok
                                ? "border-emerald-400/30 bg-emerald-400/8 text-emerald-300"
                                : "border-rose-400/30 bg-rose-400/8 text-rose-300"
                            )}
                          >
                            {ok ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                            {r.result}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[22rem]">
                          <span
                            className="block truncate font-sans text-[11px] text-muted-foreground"
                            title={r.reason ?? undefined}
                          >
                            {r.reason ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground/80">
                            <Globe className="h-2.5 w-2.5 text-gold/50" />
                            {r.ip ?? "—"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <nav
              aria-label="Audit log pagination"
              className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gold/8 pt-4"
            >
              <div className="font-mono text-[11px] text-muted-foreground/80">
                page <span className="text-gold-light">{page}</span> of {totalPages} ·{" "}
                {total.toLocaleString()} entries
              </div>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link
                    href={`/dashboard/admin/audit${filterQs(sp, { page: page - 1 })}`}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-gold/15 bg-background/40 px-3 font-sans text-xs text-foreground/80 transition hover:bg-gold/8 hover:text-gold"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </Link>
                ) : (
                  <span className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-md border border-gold/8 px-3 font-sans text-xs text-muted-foreground/40">
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </span>
                )}
                {page < totalPages ? (
                  <Link
                    href={`/dashboard/admin/audit${filterQs(sp, { page: page + 1 })}`}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-gold/15 bg-background/40 px-3 font-sans text-xs text-foreground/80 transition hover:bg-gold/8 hover:text-gold"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <span className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-md border border-gold/8 px-3 font-sans text-xs text-muted-foreground/40">
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </nav>
          </>
        )}
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaFootnoteMark />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          AuditLog is append-only · every Steward view + export is itself recorded as{" "}
          <code>admin.audit.view</code> / <code>admin.audit.export</code>
        </p>
      </div>
    </div>
  );
}

function AurientaFootnoteMark() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Server className="h-3 w-3 text-gold/60" />
      <GoldStar className="h-3 w-3" />
    </span>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  tone: "gold" | "emerald" | "rose";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-300"
      : tone === "rose"
      ? "text-rose-300"
      : "text-gold";
  const ringClass =
    tone === "emerald"
      ? "border-emerald-400/20"
      : tone === "rose"
      ? "border-rose-400/20"
      : "border-gold/15";
  return (
    <div className={cn("rounded-2xl border glass p-4", ringClass)}>
      <div className="flex items-center justify-between">
        <Icon className={cn("h-4 w-4", toneClass)} />
        {tone === "emerald" && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
        {tone === "rose" && <XCircle className="h-3 w-3 text-rose-400" />}
        {tone === "gold" && <GoldStar className="h-3 w-3 text-gold/70" />}
      </div>
      <div className="mt-2 font-serif text-xl font-semibold">{value}</div>
      <div className="font-sans text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 font-mono text-[11px] text-muted-foreground/80">{sub}</div>}
    </div>
  );
}
