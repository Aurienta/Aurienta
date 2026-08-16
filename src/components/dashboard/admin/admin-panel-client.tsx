"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users, Building2, Database, Wallet, Receipt, HardHat,
  ShieldAlert, Activity, Clock, TrendingUp, AlertCircle,
  CheckCircle2, Settings, FileText, Scale, Cpu, Lock,
  ChevronRight, RefreshCw, Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Stats = {
  totalUsers: number;
  totalEnterprises: number;
  totalLedgerEvents: number;
  totalReservations: number;
  totalExpenses: number;
  totalEmployees: number;
  activeSessions: number;
  frozenEnterprises: number;
  pendingVerifications: number;
};

type RecentUser = {
  id: string;
  email: string;
  legalName: string;
  verificationLevel: string;
  sovereignTrustScore: number;
  createdAt: Date;
  primaryIntent: string | null;
};

type RecentEnterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  stage: string;
  status: string;
  healthScore: number | null;
  createdAt: Date;
  founder: { legalName: string };
};

type LedgerEvent = {
  id: string;
  eventType: string;
  sequence: number;
  timestamp: Date;
  actorId: string | null;
  payload: string;
  enterpriseId: string | null;
};

type HealthCheck = {
  name: string;
  count: number;
  status: "ok" | "warning";
};

const ADMIN_SECTIONS = [
  { title: "User Management", icon: Users, href: "/dashboard/admin/users", description: "Manage Constitutional Partners, roles, verification levels, suspensions" },
  { title: "Enterprise Management", icon: Building2, href: "/dashboard/admin/enterprises", description: "View, freeze, unfreeze, edit enterprises" },
  { title: "Audit Log Viewer", icon: FileText, href: "/dashboard/admin/audit", description: "Search and export audit logs" },
  { title: "Institutional Settings", icon: Settings, href: "/dashboard/admin/settings", description: "Platform configuration, fees, tiers, features" },
  { title: "Steward Dashboard", icon: ShieldAlert, href: "/dashboard/steward", description: "CRE enforcement overview, compliance monitoring" },
  { title: "Constitutional Audit", icon: Scale, href: "/dashboard/constitutional-audit", description: "Full constitutional fidelity audit" },
  { title: "FRA Regulatory", icon: Lock, href: "/dashboard/fra", description: "Regulatory compliance dashboard" },
  { title: "Verification Queue", icon: CheckCircle2, href: "/dashboard/compliance", description: "Government verification reviews (GAFI, NOSI, Tax, Police)" },
  { title: "Proof-of-Solvency", icon: Activity, href: "/dashboard/solvency", description: "Law firm balance reconciliation, health flags" },
  { title: "Insurance Vault", icon: Database, href: "/dashboard/vault", description: "Anti-fragility vault, loans, contributions" },
  { title: "Reality Sync", icon: RefreshCw, href: "/dashboard/reality-sync", description: "Cross-system consistency checks" },
  { title: "Brain AI Status", icon: Cpu, href: "/dashboard/brain-ai", description: "AI provider health, model status, fallback" },
];

export function AdminPanelClient({
  stats,
  recentUsers,
  recentEnterprises,
  recentLedgerEvents,
  healthChecks,
}: {
  stats: Stats;
  recentUsers: RecentUser[];
  recentEnterprises: RecentEnterprise[];
  recentLedgerEvents: LedgerEvent[];
  healthChecks: HealthCheck[];
}) {
  const [search, setSearch] = React.useState("");

  const filteredSections = ADMIN_SECTIONS.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="border-b border-gold/10 bg-gradient-to-b from-gold/5 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 ring-1 ring-gold/25">
              <ShieldAlert className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
                Platform Admin
              </h1>
              <p className="text-sm text-muted-foreground">
                Comprehensive platform administration — build mode (no password required)
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-500" />
            <p className="text-xs text-amber-200/90">
              <span className="font-semibold">BUILD MODE:</span> Admin panel is accessible without password during development. Add a hidden admin gate before production.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
          <StatCard icon={Building2} label="Enterprises" value={stats.totalEnterprises} />
          <StatCard icon={Database} label="Ledger Events" value={stats.totalLedgerEvents} />
          <StatCard icon={Wallet} label="Reservations" value={stats.totalReservations} />
          <StatCard icon={Receipt} label="Expenses" value={stats.totalExpenses} />
          <StatCard icon={HardHat} label="Employees" value={stats.totalEmployees} />
          <StatCard icon={Activity} label="Active Sessions" value={stats.activeSessions} />
          <StatCard icon={ShieldAlert} label="Frozen Enterprises" value={stats.frozenEnterprises} alert={stats.frozenEnterprises > 0} />
          <StatCard icon={Clock} label="Pending Verifications" value={stats.pendingVerifications} alert={stats.pendingVerifications > 0} />
        </div>

        {/* Health Checks */}
        <Card className="mb-8 border-gold/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <Activity className="h-5 w-5 text-gold" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {healthChecks.map(hc => (
                <div key={hc.name} className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 px-4 py-3">
                  <span className="text-sm text-muted-foreground">{hc.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground">{hc.count}</span>
                    <span className={cn("h-2 w-2 rounded-full", hc.status === "ok" ? "bg-emerald-500" : "bg-amber-500")} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Admin Sections Grid */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-serif text-xl font-semibold text-foreground">Administration</h2>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search admin sections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSections.map(section => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group rounded-xl border border-gold/15 bg-background/40 p-5 transition-all hover:border-gold/30 hover:bg-gold/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/20">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-sm font-medium text-foreground">{section.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{section.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-gold" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Two-column: Recent Users + Recent Enterprises */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Users */}
          <Card className="border-gold/15">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-base">
                <Users className="h-4 w-4 text-gold" />
                Recent Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users registered yet.</p>
                ) : (
                  recentUsers.map(u => (
                    <Link
                      key={u.id}
                      href={`/dashboard/admin/users/${u.id}`}
                      className="flex items-center justify-between rounded-lg border border-border/20 px-3 py-2 transition-colors hover:bg-gold/5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-xs font-medium text-gold">
                          {u.legalName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{u.legalName}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{u.verificationLevel}</Badge>
                        <span className="font-mono text-xs text-gold">{u.sovereignTrustScore}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Enterprises */}
          <Card className="border-gold/15">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-base">
                <Building2 className="h-4 w-4 text-gold" />
                Recent Enterprises
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentEnterprises.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No enterprises created yet.</p>
                ) : (
                  recentEnterprises.map(e => (
                    <Link
                      key={e.id}
                      href={`/dashboard/admin/enterprises/${e.id}`}
                      className="flex items-center justify-between rounded-lg border border-border/20 px-3 py-2 transition-colors hover:bg-gold/5"
                    >
                      <div>
                        <div className="text-sm font-medium text-foreground">{e.name}</div>
                        <div className="text-xs text-muted-foreground">Founder: {e.founder.legalName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">Tier {e.tier}</Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            e.status === "active" ? "border-emerald-500/30 text-emerald-500" :
                            e.status === "frozen" ? "border-red-500/30 text-red-500" :
                            "border-amber-500/30 text-amber-500"
                          )}
                        >
                          {e.status}
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Ledger Events */}
        <Card className="mt-6 border-gold/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Database className="h-4 w-4 text-gold" />
              Recent Ledger Events (Immutable)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b border-gold/10 text-left text-muted-foreground">
                    <th className="py-2 pr-4">#</th>
                    <th className="py-2 pr-4">Event Type</th>
                    <th className="py-2 pr-4">Timestamp</th>
                    <th className="py-2 pr-4">Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLedgerEvents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground">No ledger events yet.</td>
                    </tr>
                  ) : (
                    recentLedgerEvents.map(ev => (
                      <tr key={ev.id} className="border-b border-border/10">
                        <td className="py-2 pr-4 font-mono text-muted-foreground">{ev.sequence}</td>
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className="text-[10px]">{ev.eventType}</Badge>
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {new Date(ev.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4 font-mono text-muted-foreground">
                          {ev.actorId ? ev.actorId.slice(-8) : "system"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-auto border-t border-gold/10 py-6 text-center text-xs text-muted-foreground">
        AURIENTA Platform Admin · Build Mode · Constitutional Hash: 0xB4F8…E7D1A
      </footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, alert }: { icon: React.ElementType; label: string; value: number; alert?: boolean }) {
  return (
    <Card className={cn("border-gold/15", alert && "border-amber-500/30 bg-amber-500/5")}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", alert ? "text-amber-500" : "text-gold/70")} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <div className={cn("mt-2 font-serif text-2xl font-bold", alert ? "text-amber-500" : "text-foreground")}>
          {value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
