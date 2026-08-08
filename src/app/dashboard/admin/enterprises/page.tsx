import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { egp, pct, timeAgo, shortHash } from "@/lib/aurienta/format";
import { TIER_META, STAGE_META, SECTORS } from "@/lib/aurienta/constants";
import {
  Building2,
  Lock,
  ShieldCheck,
  Users,
  TrendingUp,
  Coins,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
} from "lucide-react";
import { EnterpriseFreezeButton, EnterpriseRowLink } from "./enterprise-freeze-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Enterprise Management Console · AURIENTA",
  description:
    "AURIENTA Rep — search, filter, and govern every constitutional enterprise on the constitutional infrastructure. Freeze, unfreeze, audit, and review graduation readiness from one institutional console.",
};

type SearchParams = {
  search?: string;
  tier?: string;
  stage?: string;
  status?: string;
  sector?: string;
  page?: string;
  pageSize?: string;
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "fundraising_active", label: "Capital Formation" },
  { value: "fundraising_closed", label: "Capital Formation Closed" },
  { value: "active", label: "Active" },
  { value: "frozen", label: "Frozen" },
  { value: "graduation_pending", label: "Graduation Pending" },
  { value: "graduated", label: "Graduated" },
];

function statusBadge(status: string) {
  const cls: Record<string, string> = {
    draft: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
    fundraising_active: "border-gold/30 bg-gold/10 text-gold-light",
    fundraising_closed: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    frozen: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    graduation_pending: "border-violet-400/30 bg-violet-400/10 text-violet-300",
    graduated: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${cls[status] ?? cls.draft}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function healthColor(rating?: string | null, score?: number) {
  if (score === undefined || score === null) return "text-muted-foreground";
  if (score >= 85) return "text-emerald-300";
  if (score >= 70) return "text-gold-light";
  if (score >= 50) return "text-amber-300";
  return "text-rose-300";
}

export default async function AdminEnterprisesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/admin/enterprises");
  const hasRole = user.memberships.some((m) => m.role === "aurienta_rep");
  if (!hasRole) redirect("/dashboard");

  const sp = await searchParams;
  const search = sp.search?.trim() ?? "";
  const tier = sp.tier?.trim() ?? "";
  const stage = sp.stage?.trim() ?? "";
  const status = sp.status?.trim() ?? "";
  const sector = sp.sector?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.pageSize ?? "20", 10) || 20));

  // Build filter for server-side query (mirrors the API route).
  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [{ name: { contains: search } }, { slug: { contains: search } }];
  }
  if (tier) where.tier = tier;
  if (stage) where.stage = stage;
  if (status) where.status = status;
  if (sector) where.sector = sector;

  const [rows, total, totalEnterprises, byTierAgg, byStageAgg, byStatusAgg] = await Promise.all([
    db.enterprise.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        tier: true,
        stage: true,
        status: true,
        sector: true,
        healthRating: true,
        healthScore: true,
        raisedEgp: true,
        fundraisingGoalEgp: true,
        lawFirmClientAccountBalanceEgp: true,
        employeeCount: true,
        nosiCompliantPct: true,
        graduationReadiness: true,
        frozenAt: true,
        createdAt: true,
        founder: { select: { id: true, legalName: true } },
        lawFirm: { select: { id: true, name: true } },
        accountingFirm: { select: { id: true, name: true } },
        _count: {
          select: {
            members: true,
            ownershipRecords: true,
            ledgerEvents: true,
          },
        },
      },
    }),
    db.enterprise.count({ where }),
    db.enterprise.count(),
    db.enterprise.groupBy({ by: ["tier"], _count: { _all: true } }),
    db.enterprise.groupBy({ by: ["stage"], _count: { _all: true } }),
    db.enterprise.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const byTier: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  for (const r of byTierAgg) byTier[r.tier] = (byTier[r.tier] ?? 0) + r._count._all;
  const byStage: Record<string, number> = {};
  for (const r of byStageAgg) byStage[r.stage] = r._count._all;
  const byStatus: Record<string, number> = {};
  for (const r of byStatusAgg) byStatus[r.status] = r._count._all;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(search || tier || stage || status || sector);

  // Build the query string for pagination links (preserve filters).
  const qs = (p: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (tier) params.set("tier", tier);
    if (stage) params.set("stage", stage);
    if (status) params.set("status", status);
    if (sector) params.set("sector", sector);
    params.set("page", String(p));
    params.set("pageSize", String(pageSize));
    return params.toString();
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Enterprise Management Console"
        icon={Building2}
        title="Every constitutional enterprise, governed"
        subtitle="AURIENTA Reps search, filter, freeze, and audit every enterprise on the constitutional infrastructure — the institutional vantage point over the constitutional network."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <SummaryCard
          label="Total enterprises"
          value={String(totalEnterprises)}
          icon={Building2}
        />
        <SummaryCard
          label="Active"
          value={String(byStatus["active"] ?? 0)}
          icon={CheckCircle2}
          tone="green"
        />
        <SummaryCard
          label="Frozen"
          value={String(byStatus["frozen"] ?? 0)}
          icon={Lock}
          tone={byStatus["frozen"] ? "red" : "neutral"}
        />
        <SummaryCard
          label="Graduated"
          value={String(byStatus["graduated"] ?? 0)}
          icon={ShieldCheck}
          tone="green"
        />
        <SummaryCard
          label="Capital Formation"
          value={String(byStatus["fundraising_active"] ?? 0)}
          icon={TrendingUp}
        />
        <SummaryCard
          label="Filtered view"
          value={String(total)}
          icon={Filter}
          tone={hasFilters ? "gold" : "neutral"}
        />
      </div>

      {/* Tier breakdown strip */}
      <section className="rounded-2xl border border-gold/15 glass-gold p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
            By Tier
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            {(["A", "B", "C", "D", "E", "F"] as const).map((t) => (
              <Link
                key={t}
                href={
                  tier === t
                    ? buildQs({ search, stage, status, sector, pageSize })
                    : buildQs({ search, tier: t, stage, status, sector, pageSize })
                }
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-sans text-xs transition-colors ${
                  tier === t
                    ? "border-gold/50 bg-gold/20 text-gold-light"
                    : "border-gold/15 bg-foreground/[0.02] text-foreground hover:border-gold/30"
                }`}
              >
                <span className="font-mono font-semibold">{t}</span>
                <span className="text-muted-foreground">{TIER_META[t].name}</span>
                <span className="ml-1 rounded-md bg-gold/15 px-1.5 py-0.5 font-mono text-[11px] text-gold-light">
                  {byTier[t]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <form
        className="rounded-2xl border border-gold/15 glass p-4 sm:p-5"
        action="/dashboard/admin/enterprises"
        method="GET"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gold" />
            <span className="font-serif text-sm font-semibold">Filter enterprises</span>
            {hasFilters && (
              <Link
                href="/dashboard/admin/enterprises"
                className="ml-auto font-sans text-xs text-muted-foreground hover:text-foreground"
              >
                clear all
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex flex-col gap-1.5">
              <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">
                Search
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="name or slug"
                  className="h-9 w-full rounded-md border border-gold/15 bg-background/60 pl-8 pr-3 font-sans text-sm placeholder:text-muted-foreground/60 focus:border-gold/40 focus:outline-none"
                />
              </div>
            </label>
            <SelectField name="tier" label="Tier" value={tier} options={[["", "All tiers"], ...(["A", "B", "C", "D", "E", "F"] as const).map((t) => [t, `${t} · ${TIER_META[t].name}`] as [string, string])]} />
            <SelectField
              name="stage"
              label="Stage"
              value={stage}
              options={[
                ["", "All stages"],
                ...Object.entries(STAGE_META).map(([k, v]) => [k, v.name] as [string, string]),
              ]}
            />
            <SelectField
              name="status"
              label="Status"
              value={status}
              options={[["", "All statuses"], ...STATUS_OPTIONS.map((s) => [s.value, s.label] as [string, string])]}
            />
            <SelectField
              name="sector"
              label="Sector"
              value={sector}
              options={[
                ["", "All sectors"],
                ...Object.entries(SECTORS).map(([k, v]) => [k, v.label] as [string, string]),
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/15 px-3 py-1.5 font-sans text-xs font-medium text-gold-light transition-colors hover:bg-gold/25"
            >
              <Search className="h-3.5 w-3.5" />
              Apply filters
            </button>
            <span className="font-mono text-[11px] text-muted-foreground/80">
              page {page} of {totalPages} · {total.toLocaleString()} result{total === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </form>

      {/* Table */}
      <section className="rounded-2xl border border-gold/15 glass p-2 sm:p-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gold/12">
                <Th>Enterprise</Th>
                <Th>Tier</Th>
                <Th>Stage</Th>
                <Th>Status</Th>
                <Th>Health</Th>
                <Th className="text-right">Capital Participated / Goal</Th>
                <Th className="text-right">Law Firm Client Account</Th>
                <Th className="text-right">Members</Th>
                <Th>Founder</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center font-sans text-sm text-muted-foreground">
                    No enterprises match the current filters.
                  </td>
                </tr>
              ) : (
                rows.map((e) => {
                  const goalPct = e.fundraisingGoalEgp > 0
                    ? Math.min(100, (e.raisedEgp / e.fundraisingGoalEgp) * 100)
                    : 0;
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-gold/8 transition-colors hover:bg-gold/[0.04]"
                    >
                      <Td>
                        <div className="flex flex-col">
                          <Link
                            href={`/dashboard/admin/enterprises/${e.id}`}
                            className="font-serif text-sm font-semibold text-foreground hover:text-gold-light"
                          >
                            {e.name}
                          </Link>
                          <span className="font-mono text-[11px] text-muted-foreground/80">
                            /{e.slug} · {e.sector}
                          </span>
                          {e.frozenAt && (
                            <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 font-mono text-[10px] uppercase text-rose-300">
                              <Lock className="h-2.5 w-2.5" /> frozen {timeAgo(e.frozenAt)}
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <span className="inline-flex items-center gap-1 rounded-md border border-gold/15 bg-gold/8 px-2 py-0.5 font-mono text-[11px] font-semibold text-gold-light">
                          {e.tier}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-sans text-xs">
                          {STAGE_META[e.stage]?.name ?? e.stage}
                        </span>
                      </Td>
                      <Td>{statusBadge(e.status)}</Td>
                      <Td>
                        <div className="flex flex-col gap-0.5">
                          <span className={`font-mono text-xs ${healthColor(e.healthRating, e.healthScore)}`}>
                            {e.healthRating ?? "—"} · {e.healthScore}
                          </span>
                          <span className="font-sans text-[10px] text-muted-foreground/80">
                            grad {(e.graduationReadiness ?? 0).toString()}%
                          </span>
                        </div>
                      </Td>
                      <Td className="text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-mono text-xs text-foreground">
                            {egp(e.raisedEgp, { compact: true })}
                          </span>
                          <span className="font-sans text-[10px] text-muted-foreground/80">
                            of {egp(e.fundraisingGoalEgp, { compact: true })}
                          </span>
                          <div className="mt-0.5 h-1 w-20 overflow-hidden rounded-full bg-foreground/10">
                            <div
                              className="h-full bg-gold/60"
                              style={{ width: `${goalPct}%` }}
                            />
                          </div>
                        </div>
                      </Td>
                      <Td className="text-right font-mono text-xs text-foreground">
                        {egp(e.lawFirmClientAccountBalanceEgp, { compact: true })}
                      </Td>
                      <Td className="text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-foreground">
                            <Users className="h-3 w-3 text-muted-foreground/70" />
                            {e._count.members}
                          </span>
                          <span className="font-sans text-[10px] text-muted-foreground/80">
                            {e._count.ownershipRecords} holders · {e._count.ledgerEvents} events
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <span className="font-sans text-xs text-muted-foreground">
                          {e.founder?.legalName ?? "—"}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-1.5">
                          <EnterpriseRowLink id={e.id}>View</EnterpriseRowLink>
                          <EnterpriseFreezeButton
                            enterprise={{ id: e.id, name: e.name, slug: e.slug, status: e.status }}
                          />
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-2 p-3">
          <span className="font-mono text-[11px] text-muted-foreground/80">
            showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <PageLink
              href={`/dashboard/admin/enterprises?${qs(Math.max(1, page - 1))}`}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </PageLink>
            <PageLink
              href={`/dashboard/admin/enterprises?${qs(Math.min(totalPages, page + 1))}`}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </PageLink>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AlertTriangle className="h-3 w-3 text-gold/70" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Freeze / unfreeze is wrapped in <code>db.$transaction</code> with an appended ledger event + audit log.
        </p>
      </div>
    </div>
  );
}

function buildQs(opts: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(opts)) {
    if (v) params.set(k, v);
  }
  return `/dashboard/admin/enterprises?${params.toString()}`;
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: "neutral" | "green" | "red" | "gold";
}) {
  const toneCls = {
    neutral: "text-gold",
    green: "text-emerald-300",
    red: "text-rose-300",
    gold: "text-gold-light",
  }[tone];
  return (
    <div className="rounded-2xl border border-gold/15 glass p-4">
      <div className="flex items-center justify-between">
        <Icon className={`h-4 w-4 ${toneCls}`} />
        {tone !== "neutral" && (
          tone === "green" ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> :
          tone === "red" ? <AlertTriangle className="h-3 w-3 text-rose-400" /> :
          <HeartPulse className="h-3 w-3 text-gold-light" />
        )}
      </div>
      <div className="mt-2 font-serif text-xl font-semibold">{value}</div>
      <div className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function SelectField({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: [string, string][];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground/80">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value}
        className="h-9 w-full rounded-md border border-gold/15 bg-background/60 px-2 font-sans text-sm focus:border-gold/40 focus:outline-none"
      >
        {options.map(([v, lbl]) => (
          <option key={v + lbl} value={v}>
            {lbl}
          </option>
        ))}
      </select>
    </label>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-3 py-2.5 font-sans text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-top ${className}`}>{children}</td>;
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-gold/8 bg-foreground/[0.02] px-2 py-1 font-sans text-[11px] text-muted-foreground/50">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-md border border-gold/15 bg-foreground/[0.02] px-2 py-1 font-sans text-[11px] text-foreground transition-colors hover:border-gold/30 hover:bg-gold/8"
    >
      {children}
    </Link>
  );
}
