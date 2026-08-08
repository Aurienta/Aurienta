import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { timeAgo } from "@/lib/aurienta/format";
import {
  ShieldCheck,
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Ban,
  ShieldAlert,
  Fingerprint,
  Crown,
  Wallet,
  HardHat,
  Settings,
  Gavel,
  Building2,
  Scale,
  Calculator,
  GraduationCap,
  HeartPulse,
  KeyRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User Management Console · AURIENTA",
  description:
    "AURIENTA Rep — search, filter, suspend, and re-role every partner on the constitutional network. Identity, verification, STS, and session governance from one institutional console.",
};

type SearchParams = {
  search?: string;
  role?: string;
  verificationLevel?: string;
  tier?: string;
  page?: string;
  pageSize?: string;
};

const VERIFICATION_LEVELS: { value: string; label: string }[] = [
  { value: "L0", label: "L0 · Anonymous (Suspended)" },
  { value: "L1", label: "L1 · Email/Mobile verified" },
  { value: "L2", label: "L2 · Basic KYC" },
  { value: "L3", label: "L3 · Enhanced KYC" },
  { value: "L4", label: "L4 · Institutional" },
];

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "capital_partner", label: "Capital Partner" },
  { value: "founding_operator", label: "Founding Operator" },
  { value: "workforce_partner", label: "Workforce Partner" },
  { value: "manager", label: "Manager" },
  { value: "board_member", label: "Board Member" },
  { value: "company_owner", label: "Company Owner" },
  { value: "law_firm_rep", label: "Law Firm Rep" },
  { value: "accounting_firm_rep", label: "Accounting Firm Rep" },
  { value: "aurienta_rep", label: "AURIENTA Rep" },
  { value: "university_rep", label: "University Rep" },
];

const TIER_OPTIONS: { value: string; label: string }[] = [
  { value: "Constitutional Pillar", label: "Constitutional Pillar" },
  { value: "Ecosystem Builder", label: "Ecosystem Builder" },
  { value: "Trusted Contributor", label: "Trusted Contributor" },
  { value: "Active Member", label: "Active Member" },
  { value: "Emerging Participant", label: "Emerging Participant" },
];

const ROLE_ICON: Record<string, React.ElementType> = {
  capital_partner: Wallet,
  founding_operator: Crown,
  workforce_partner: HardHat,
  manager: Settings,
  board_member: Gavel,
  company_owner: Building2,
  law_firm_rep: Scale,
  accounting_firm_rep: Calculator,
  aurienta_rep: ShieldCheck,
  university_rep: GraduationCap,
};

function verificationBadge(level: string) {
  const cls: Record<string, string> = {
    L0: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    L1: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
    L2: "border-gold/30 bg-gold/10 text-gold-light",
    L3: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    L4: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  };
  const label: Record<string, string> = {
    L0: "L0 · Suspended",
    L1: "L1 · Email",
    L2: "L2 · KYC",
    L3: "L3 · Enhanced",
    L4: "L4 · Institutional",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${cls[level] ?? cls.L1}`}
    >
      {label[level] ?? level}
    </span>
  );
}

function stsColor(score: number) {
  if (score >= 90) return "text-gold-light";
  if (score >= 65) return "text-gold";
  if (score >= 50) return "text-amber-300";
  return "text-rose-300";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/admin/users");
  const hasRole = user.memberships.some((m) => m.role === "aurienta_rep");
  if (!hasRole) redirect("/dashboard");

  const sp = await searchParams;
  const search = sp.search?.trim() ?? "";
  const role = sp.role?.trim() ?? "";
  const verificationLevel = sp.verificationLevel?.trim() ?? "";
  const tier = sp.tier?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.pageSize ?? "25", 10) || 25));

  // Build filter (mirrors the API route).
  type Clause =
    | { OR: ({ legalName: { contains: string } } | { email: { contains: string } } | { mobile: { contains: string } })[] }
    | { verificationLevel: string }
    | { tier: string }
    | { memberships: { some: { role: string } } };
  const where: { AND: Clause[] } = { AND: [] };
  if (search) {
    where.AND.push({
      OR: [
        { legalName: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
      ],
    });
  }
  if (verificationLevel) where.AND.push({ verificationLevel });
  if (tier) where.AND.push({ tier });
  if (role) where.AND.push({ memberships: { some: { role } } });

  const [rows, totalMatching, totalUsers, byLevelAgg, byTierAgg] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        mobile: true,
        legalName: true,
        verificationLevel: true,
        sovereignTrustScore: true,
        tier: true,
        primaryIntent: true,
        mfaEnabled: true,
        policeClearanceValid: true,
        pledgeSignedAt: true,
        avatarColor: true,
        createdAt: true,
        memberships: {
          select: { role: true, enterprise: { select: { id: true, name: true } } },
          orderBy: { joinedAt: "desc" },
        },
        _count: {
          select: {
            memberships: true,
            sessions: true,
            ownershipRecords: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.user.count({ where }),
    db.user.count(),
    db.user.groupBy({ by: ["verificationLevel"], _count: { _all: true } }),
    db.user.groupBy({ by: ["tier"], _count: { _all: true } }),
  ]);

  const byLevel: Record<string, number> = { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0 };
  for (const r of byLevelAgg) byLevel[r.verificationLevel] = r._count._all;
  const byTier: Record<string, number> = {};
  for (const r of byTierAgg) byTier[r.tier] = r._count._all;

  const totalPages = Math.max(1, Math.ceil(totalMatching / pageSize));
  const hasFilters = Boolean(search || role || verificationLevel || tier);

  const qs = (p: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    if (verificationLevel) params.set("verificationLevel", verificationLevel);
    if (tier) params.set("tier", tier);
    params.set("page", String(p));
    params.set("pageSize", String(pageSize));
    return params.toString();
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="User Management Console"
        icon={ShieldCheck}
        title="Every partner on the constitutional network"
        subtitle="AURIENTA Reps search, filter, suspend, and re-role every user — identity, verification level, Sovereign Trust Score, and active sessions governed from a single institutional console."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard label="Total users" value={String(totalUsers)} icon={Users} />
        <SummaryCard
          label="Suspended (L0)"
          value={String(byLevel.L0)}
          icon={Ban}
          tone={byLevel.L0 ? "red" : "neutral"}
        />
        <SummaryCard
          label="Verified (L2+)"
          value={String(byLevel.L2 + byLevel.L3 + byLevel.L4)}
          icon={CheckCircle2}
          tone="green"
        />
        <SummaryCard
          label="Enhanced (L3+)"
          value={String(byLevel.L3 + byLevel.L4)}
          icon={Fingerprint}
          tone="gold"
        />
        <SummaryCard
          label="Institutional (L4)"
          value={String(byLevel.L4)}
          icon={ShieldAlert}
        />
        <SummaryCard
          label="Filtered view"
          value={String(totalMatching)}
          icon={Filter}
          tone={hasFilters ? "gold" : "neutral"}
        />
      </div>

      {/* Verification level breakdown strip */}
      <section className="rounded-2xl border border-gold/15 glass-gold p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
            By Verification Level
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            {VERIFICATION_LEVELS.map((lvl) => (
              <Link
                key={lvl.value}
                href={
                  verificationLevel === lvl.value
                    ? `/dashboard/admin/users?${qsNo({ verificationLevel, search, role, tier, pageSize })}`
                    : `/dashboard/admin/users?${qsNo({ verificationLevel: lvl.value, search, role, tier, pageSize })}`
                }
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-sans text-xs transition-colors ${
                  verificationLevel === lvl.value
                    ? "border-gold/50 bg-gold/20 text-gold-light"
                    : "border-gold/15 bg-foreground/[0.02] text-foreground hover:border-gold/30"
                }`}
              >
                <span className="font-mono font-semibold">{lvl.value}</span>
                <span className="text-muted-foreground">
                  {lvl.label.split("·")[1]?.trim()}
                </span>
                <span className="ml-1 rounded-md bg-gold/15 px-1.5 py-0.5 font-mono text-[11px] text-gold-light">
                  {byLevel[lvl.value]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <form
        className="rounded-2xl border border-gold/15 glass p-4 sm:p-5"
        action="/dashboard/admin/users"
        method="GET"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gold" />
            <span className="font-serif text-sm font-semibold">Filter partners</span>
            {hasFilters && (
              <Link
                href="/dashboard/admin/users"
                className="ml-auto font-sans text-xs text-muted-foreground hover:text-foreground"
              >
                clear all
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                  placeholder="name, email, or mobile"
                  className="h-9 w-full rounded-md border border-gold/15 bg-background/60 pl-8 pr-3 font-sans text-sm placeholder:text-muted-foreground/60 focus:border-gold/40 focus:outline-none"
                />
              </div>
            </label>
            <SelectField
              name="role"
              label="Role"
              value={role}
              options={[["", "All roles"], ...ROLE_OPTIONS.map((r) => [r.value, r.label] as [string, string])]}
            />
            <SelectField
              name="verificationLevel"
              label="Verification"
              value={verificationLevel}
              options={[["", "All levels"], ...VERIFICATION_LEVELS.map((l) => [l.value, l.label] as [string, string])]}
            />
            <SelectField
              name="tier"
              label="Tier"
              value={tier}
              options={[["", "All tiers"], ...TIER_OPTIONS.map((t) => [t.value, t.label] as [string, string])]}
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
              page {page} of {totalPages} · {totalMatching.toLocaleString()} result{totalMatching === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </form>

      {/* Table */}
      <section className="rounded-2xl border border-gold/15 glass p-2 sm:p-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gold/12">
                <Th>Partner</Th>
                <Th>Verification</Th>
                <Th className="text-right">STS</Th>
                <Th>Tier</Th>
                <Th>Roles</Th>
                <Th className="text-right">Sessions</Th>
                <Th>Joined</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center font-sans text-sm text-muted-foreground">
                    No partners match the current filters.
                  </td>
                </tr>
              ) : (
                rows.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gold/8 transition-colors hover:bg-gold/[0.04]"
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full font-mono text-xs font-semibold text-background"
                          style={{ background: u.avatarColor || "#d4af37" }}
                          aria-hidden
                        >
                          {initials(u.legalName)}
                        </span>
                        <div className="flex flex-col">
                          <Link
                            href={`/dashboard/admin/users/${u.id}`}
                            className="font-serif text-sm font-semibold text-foreground hover:text-gold-light"
                          >
                            {u.legalName}
                          </Link>
                          <span className="font-mono text-[11px] text-muted-foreground/80">
                            {u.email}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground/70">
                            {u.mobile}
                          </span>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col gap-1">
                        {verificationBadge(u.verificationLevel)}
                        {u.mfaEnabled && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] uppercase text-emerald-300">
                            <KeyRound className="h-2.5 w-2.5" /> MFA
                          </span>
                        )}
                        {u.verificationLevel === "L0" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 font-mono text-[10px] uppercase text-rose-300">
                            <Ban className="h-2.5 w-2.5" /> suspended
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td className="text-right">
                      <span className={`font-mono text-sm font-semibold ${stsColor(u.sovereignTrustScore)}`}>
                        {u.sovereignTrustScore}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-sans text-xs text-muted-foreground">
                        {u.tier}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1 max-w-[260px]">
                        {u.memberships.length === 0 ? (
                          <span className="font-sans text-[11px] text-muted-foreground/70">—</span>
                        ) : (
                          u.memberships.slice(0, 3).map((m, idx) => {
                            const Icon = ROLE_ICON[m.role] ?? Users;
                            return (
                              <span
                                key={`${m.enterprise.id}-${m.role}-${idx}`}
                                className="inline-flex items-center gap-1 rounded-md border border-gold/12 bg-foreground/[0.02] px-1.5 py-0.5 font-mono text-[10px] text-foreground"
                                title={`${m.role} · ${m.enterprise.name}`}
                              >
                                <Icon className="h-2.5 w-2.5 text-gold/80" />
                                {m.role.replace(/_/g, " ")}
                              </span>
                            );
                          })
                        )}
                        {u.memberships.length > 3 && (
                          <span className="inline-flex items-center rounded-md border border-gold/8 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            +{u.memberships.length - 3}
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td className="text-right">
                      <span className="font-mono text-xs text-foreground">{u._count.sessions}</span>
                    </Td>
                    <Td>
                      <span className="font-sans text-[11px] text-muted-foreground/80">
                        {timeAgo(u.createdAt)}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/admin/users/${u.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-gold/30 bg-gold/15 px-2.5 py-1 font-sans text-[11px] font-medium text-gold-light transition-colors hover:bg-gold/25"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Manage
                        </Link>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-2 p-3">
          <span className="font-mono text-[11px] text-muted-foreground/80">
            showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalMatching)} of {totalMatching.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <PageLink
              href={`/dashboard/admin/users?${qs(Math.max(1, page - 1))}`}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </PageLink>
            <PageLink
              href={`/dashboard/admin/users?${qs(Math.min(totalPages, page + 1))}`}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </PageLink>
          </div>
        </div>
      </section>

      {/* Tier breakdown */}
      <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">By Tier</h2>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {TIER_OPTIONS.map((t) => (
            <Link
              key={t.value}
              href={
                tier === t.value
                  ? `/dashboard/admin/users?${qsNo({ tier, search, role, verificationLevel, pageSize })}`
                  : `/dashboard/admin/users?${qsNo({ tier: t.value, search, role, verificationLevel, pageSize })}`
              }
              className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
                tier === t.value
                  ? "border-gold/50 bg-gold/20 text-gold-light"
                  : "border-gold/12 bg-foreground/[0.02] hover:border-gold/30"
              }`}
            >
              <span className="font-sans text-xs">{t.label}</span>
              <span className="font-mono text-xs font-semibold text-gold-light">
                {byTier[t.value] ?? 0}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AlertTriangle className="h-3 w-3 text-gold/70" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Every action — verification change, role assign/revoke, session revoke, suspend — is wrapped in a transaction and audit-logged.
        </p>
      </div>
    </div>
  );
}

function qsNo(opts: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(opts)) {
    if (v) params.set(k, v);
  }
  return params.toString();
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
