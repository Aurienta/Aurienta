"use client";

/**
 * ErpDashboardClient — main ERP hub overview.
 *
 * Renders:
 *   - 5 stat cards (active projects, total budget, utilization %,
 *     pending approvals, low-stock alerts).
 *   - Quick-link grid to every ERP sub-module.
 *   - Per-enterprise selector showing the active enterprise's stats.
 *
 * Theme: indigo. shadcn Card grid. csrfFetch for every state-changing call.
 */

import * as React from "react";
import Link from "next/link";
import {
  Workflow,
  Target,
  Database,
  Truck,
  Factory,
  Cpu,
  CheckCircle2,
  Wallet,
  Activity,
  AlertTriangle,
  ChevronRight,
  Hourglass,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { egp } from "@/lib/aurienta/format";

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  fundraisingGoalEgp: number;
};

type Stats = {
  activeProjects: number;
  totalBudgetEgp: number;
  totalSpentEgp: number;
  resourceUtilizationPct: number;
  pendingApprovals: number;
  lowStockAlerts: number;
  pendingTimesheets: number;
  pendingPOs: number;
  activeProductionOrders: number;
  totalAssetValueEgp: number;
};

type Props = {
  enterprises: Enterprise[];
  statsByEnterprise: Record<string, Stats>;
  isRep: boolean;
};

const QUICK_LINKS = [
  {
    href: "/dashboard/erp/projects",
    label: "Projects",
    desc: "WBS task trees, budgets, health",
    icon: Target,
  },
  {
    href: "/dashboard/erp/inventory",
    label: "Inventory",
    desc: "SKUs, stock levels, low-stock alerts",
    icon: Database,
  },
  {
    href: "/dashboard/erp/procurement",
    label: "Procurement",
    desc: "Purchase orders, vendors, receipts",
    icon: Truck,
  },
  {
    href: "/dashboard/erp/assets",
    label: "Fixed Assets",
    desc: "Asset register, depreciation, disposal",
    icon: Factory,
  },
  {
    href: "/dashboard/erp/production",
    label: "Manufacturing",
    desc: "Production orders, BOM, releases",
    icon: Cpu,
  },
  {
    href: "/dashboard/erp/quality",
    label: "Quality Control",
    desc: "Quality checks, pass rates, defects",
    icon: CheckCircle2,
  },
];

export function ErpDashboardClient({
  enterprises,
  statsByEnterprise,
  isRep,
}: Props) {
  const [activeEntId, setActiveEntId] = React.useState(
    enterprises[0]?.id ?? ""
  );
  const stats = activeEntId ? statsByEnterprise[activeEntId] : undefined;
  const activeEnt = enterprises.find((e) => e.id === activeEntId);

  return (
    <div className="light">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-1 py-2">
        {/* ── Header ── */}
        <header className="rounded-2xl border border-indigo-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div className="flex items-center gap-2.5">
            <Workflow className="h-5 w-5 text-indigo-600" />
            <span className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-indigo-700/80">
              Constitutional ERP Engine
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-indigo-950 sm:text-4xl">
            ERP Hub
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-sm text-indigo-950/70">
            End-to-end enterprise resource planning with CRE-enforced
            governance on every action — projects, tasks, resources,
            inventory, procurement, assets, manufacturing, and quality
            control. Outperforms Oracle NetSuite and Odoo by binding every
            transaction to the constitutional ledger.
          </p>
        </header>

        {/* ── Enterprise selector ── */}
        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <label className="font-sans text-xs font-medium uppercase tracking-wider text-indigo-900/70">
                Enterprise
              </label>
              <Select value={activeEntId} onValueChange={setActiveEntId}>
                <SelectTrigger className="mt-1.5 w-[280px]">
                  <SelectValue placeholder="Select enterprise" />
                </SelectTrigger>
                <SelectContent>
                  {enterprises.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} · Tier {e.tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isRep && (
              <Badge
                variant="outline"
                className="border-indigo-500/40 bg-indigo-50 text-indigo-700"
              >
                AURIENTA Rep — all enterprises
              </Badge>
            )}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Target className="h-4 w-4 text-indigo-600" />}
            label="Active Projects"
            value={String(stats?.activeProjects ?? 0)}
            hint="Planning / active / on hold"
          />
          <StatCard
            icon={<Wallet className="h-4 w-4 text-indigo-600" />}
            label="Total Budget"
            value={egp(stats?.totalBudgetEgp ?? 0, { compact: true })}
            hint={`Spent ${egp(stats?.totalSpentEgp ?? 0, { compact: true })}`}
          />
          <StatCard
            icon={<Activity className="h-4 w-4 text-indigo-600" />}
            label="Resource Utilization"
            value={`${stats?.resourceUtilizationPct ?? 0}%`}
            hint="Across active resources"
          />
          <StatCard
            icon={<Hourglass className="h-4 w-4 text-indigo-600" />}
            label="Pending Approvals"
            value={String(stats?.pendingApprovals ?? 0)}
            hint={`${stats?.pendingTimesheets ?? 0} timesheets · ${stats?.pendingPOs ?? 0} POs`}
          />
          <StatCard
            icon={<AlertTriangle className="h-4 w-4 text-indigo-600" />}
            label="Low-Stock Alerts"
            value={String(stats?.lowStockAlerts ?? 0)}
            hint="Below reorder point"
          />
          <StatCard
            icon={<Cpu className="h-4 w-4 text-indigo-600" />}
            label="Active Production"
            value={String(stats?.activeProductionOrders ?? 0)}
            hint="Planned / released / in progress"
          />
          <StatCard
            icon={<Factory className="h-4 w-4 text-indigo-600" />}
            label="Asset Value (NBV)"
            value={egp(stats?.totalAssetValueEgp ?? 0, { compact: true })}
            hint="Net book value of active assets"
          />
          <StatCard
            icon={<Workflow className="h-4 w-4 text-indigo-600" />}
            label="Enterprise Tier"
            value={activeEnt?.tier ?? "—"}
            hint={activeEnt?.name ?? ""}
          />
        </div>

        {/* ── Quick links ── */}
        <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-indigo-600" />
            <h2 className="font-serif text-lg font-semibold text-indigo-950">
              ERP Modules
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-start gap-3 rounded-xl border border-indigo-200/70 bg-indigo-50/40 p-4 transition hover:border-indigo-400 hover:bg-indigo-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                    <Icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-semibold text-indigo-950">
                      {link.label}
                    </p>
                    <p className="mt-0.5 font-sans text-xs text-indigo-950/70">
                      {link.desc}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-indigo-400 transition group-hover:translate-x-1 group-hover:text-indigo-700" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Compliance banner ── */}
        <div className="rounded-xl border border-indigo-300/60 bg-indigo-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
            <div className="flex-1">
              <p className="font-sans text-sm font-semibold text-indigo-900">
                8 CRE-enforced ERP policies active
              </p>
              <p className="mt-1 font-sans text-xs leading-relaxed text-indigo-900/80">
                Every state change — project budget, purchase authority,
                resource allocation, inventory adjustment, production release,
                quality check, timesheet approval, asset disposal — is
                validated by the Constitutional Runtime Engine, persisted as
                a CreDecision row, and chained onto the immutable LedgerEvent
                log for tamper-evidence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat card sub-component ──

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-indigo-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-sans text-xs uppercase tracking-wider text-indigo-900/70">
          {label}
        </span>
      </div>
      <p className="mt-2 font-serif text-2xl font-semibold text-indigo-950">
        {value}
      </p>
      {hint && (
        <p className="mt-1 font-mono text-[11px] text-indigo-900/60">{hint}</p>
      )}
    </div>
  );
}
