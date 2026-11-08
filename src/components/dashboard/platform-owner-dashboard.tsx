"use client";

/**
 * Platform Owner Control Center — State-of-the-art dashboard
 * for the aurienta_rep role. Real-time visibility + control over
 * every aspect of the AURIENTA platform.
 *
 * Features:
 *   - Real-time platform metrics (auto-refresh every 15s)
 *   - System health monitoring (DB, AI, daemons, memory)
 *   - User management (suspend, role override)
 *   - Enterprise management (freeze/unfreeze, view valuations)
 *   - Audit log viewer (live feed)
 *   - Financial overview (total platform valuation, escrow)
 *   - AI provider status (free Pollinations fallback)
 *   - Compliance overview (10 Egyptian laws)
 *   - API route inventory (234+ routes)
 *   - Quick actions (clear cache, sync data)
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Building2, Activity, Cpu, DollarSign, Brain,
  Scale, Server, AlertTriangle, CheckCircle2, Loader2, RefreshCw,
  Snowflake, Play, Trash2, Download, Zap, Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Section = "overview" | "users" | "enterprises" | "system" | "audit" | "financial" | "ai" | "compliance" | "apis";

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "users", label: "Users", icon: Users },
  { id: "enterprises", label: "Enterprises", icon: Building2 },
  { id: "system", label: "System", icon: Cpu },
  { id: "audit", label: "Audit Log", icon: Scale },
  { id: "financial", label: "Financial", icon: DollarSign },
  { id: "ai", label: "AI Providers", icon: Brain },
  { id: "compliance", label: "Compliance", icon: Shield },
  { id: "apis", label: "API Routes", icon: Server },
];

export function PlatformOwnerDashboard({ userName }: { userName: string }) {
  const [section, setSection] = React.useState<Section>("overview");
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  const fetchData = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/platform-owner?section=${section}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
    setLastUpdate(new Date());
  }, [section]);

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAction = async (action: string, params: Record<string, unknown>) => {
    const res = await fetch("/api/platform-owner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...params }),
    });
    if (res.ok) {
      fetchData(); // Refresh data after action
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-50 border-b border-gold/15 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30">
              <Shield className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold">Platform Owner Control Center</h1>
              <p className="text-xs text-muted-foreground">
                Welcome, {userName} · Last update: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchData} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </Badge>
          </div>
        </div>
        {/* ── Section Tabs ── */}
        <div className="flex gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSection(s.id); setLoading(true); }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                section === s.id
                  ? "bg-gold/10 border border-gold/30 text-gold"
                  : "text-muted-foreground hover:bg-foreground/5"
              )}
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
              </div>
            ) : (
              <SectionContent section={section} data={data} onAction={handleAction} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function SectionContent({ section, data, onAction }: { section: Section; data: any; onAction: (action: string, params: Record<string, unknown>) => void }) {
  switch (section) {
    case "overview": return <OverviewSection data={data} />;
    case "users": return <UsersSection data={data} onAction={onAction} />;
    case "enterprises": return <EnterprisesSection data={data} onAction={onAction} />;
    case "system": return <SystemSection data={data} />;
    case "audit": return <AuditSection data={data} />;
    case "financial": return <FinancialSection data={data} />;
    case "ai": return <AiSection data={data} />;
    case "compliance": return <ComplianceSection data={data} />;
    case "apis": return <ApisSection data={data} />;
    default: return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW SECTION
// ═══════════════════════════════════════════════════════════════
function OverviewSection({ data }: { data: any }) {
  const m = data?.metrics || {};
  const health = data?.enterpriseHealth || {};
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard icon={Users} label="Total Users" value={m.totalUsers ?? 0} color="text-blue-600" />
        <MetricCard icon={Building2} label="Enterprises" value={m.totalEnterprises ?? 0} color="text-purple-600" />
        <MetricCard icon={Activity} label="Audit Events" value={m.totalAuditEvents ?? 0} color="text-amber-600" />
        <MetricCard icon={Zap} label="Active Sessions" value={m.activeSessions24h ?? 0} color="text-emerald-600" />
        <MetricCard icon={Globe} label="Activity (24h)" value={m.recentActivity24h ?? 0} color="text-cyan-600" />
      </div>

      {/* System Health */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-gold" /> System Health</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HealthIndicator label="Database" status={data?.systemHealth?.database} />
            <HealthIndicator label="AI Provider" status={data?.systemHealth?.aiProvider} />
            <HealthIndicator label="Env Guardian" status={data?.systemHealth?.envGuardian} />
            <HealthIndicator label="Keepalive" status={data?.systemHealth?.keepalive} />
          </div>
        </CardContent>
      </Card>

      {/* Enterprise Health Distribution */}
      <Card>
        <CardHeader><CardTitle>Enterprise Health Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <HealthBucket label="Healthy" count={health.healthy ?? 0} color="text-emerald-600" bg="bg-emerald-500/10" />
            <HealthBucket label="Attention" count={health.attention ?? 0} color="text-amber-600" bg="bg-amber-500/10" />
            <HealthBucket label="Critical" count={health.critical ?? 0} color="text-red-600" bg="bg-red-500/10" />
          </div>
        </CardContent>
      </Card>

      {/* Platform Info */}
      <Card>
        <CardHeader><CardTitle>Platform Info</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <InfoRow label="Version" value={data?.platform?.version} />
          <InfoRow label="Environment" value={data?.platform?.environment} />
          <InfoRow label="Database" value={data?.platform?.database} />
          <InfoRow label="Uptime" value={`${Math.floor((data?.platform?.uptime ?? 0) / 3600)}h ${Math.floor(((data?.platform?.uptime ?? 0) % 3600) / 60)}m`} />
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// USERS SECTION
// ═══════════════════════════════════════════════════════════════
function UsersSection({ data, onAction }: { data: any; onAction: (a: string, p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">User Management ({data?.totalUsers ?? 0})</h2>
      </div>
      <div className="space-y-2">
        {data?.users?.map((u: any) => (
          <Card key={u.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-medium">
                {u.legalName?.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{u.legalName}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="outline" className="text-[10px]">{u.stsLevel}</Badge>
                  <Badge variant="outline" className="text-[10px]">STS {u.sovereignTrustScore}</Badge>
                  {u.mfaEnabled && <Badge variant="outline" className="text-[10px] text-emerald-600">MFA</Badge>}
                  {u.roles?.map((r: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px] text-gold">{r}</Badge>
                  ))}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => onAction("suspend-user", { userId: u.id })}>
                <AlertTriangle className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ENTERPRISES SECTION
// ═══════════════════════════════════════════════════════════════
function EnterprisesSection({ data, onAction }: { data: any; onAction: (a: string, p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-lg font-semibold">Enterprise Management ({data?.total ?? 0})</h2>
      <div className="space-y-2">
        {data?.enterprises?.map((e: any) => (
          <Card key={e.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gold" />
                  <span className="font-medium">{e.name}</span>
                  <Badge variant="outline" className="text-[10px]">Tier {e.tier}</Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">{e.sector}</Badge>
                </div>
                <Badge variant={e.status === "frozen" ? "destructive" : "outline"} className="text-[10px] capitalize">
                  {e.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div><span className="text-muted-foreground">Members:</span> {e.memberCount}</div>
                <div><span className="text-muted-foreground">Holders:</span> {e.holderCount}</div>
                <div><span className="text-muted-foreground">Valuation:</span> {e.valuation?.toLocaleString()} EGP</div>
                <div><span className="text-muted-foreground">Health:</span> {e.healthScore ?? 75}</div>
              </div>
              <div className="flex gap-2 mt-3">
                {e.status === "frozen" ? (
                  <Button size="sm" variant="outline" onClick={() => onAction("unfreeze-enterprise", { enterpriseId: e.id })}>
                    <Play className="h-3.5 w-3.5 mr-1" /> Unfreeze
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => onAction("freeze-enterprise", { enterpriseId: e.id })}>
                    <Snowflake className="h-3.5 w-3.5 mr-1" /> Freeze
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM SECTION
// ═══════════════════════════════════════════════════════════════
function SystemSection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-gold" /> Process</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <InfoRow label="PID" value={data?.process?.pid} />
          <InfoRow label="Platform" value={data?.process?.platform} />
          <InfoRow label="Node Version" value={data?.process?.nodeVersion} />
          <InfoRow label="Uptime" value={data?.process?.uptimeHuman} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Memory Usage</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <InfoRow label="RSS" value={data?.memory?.rss} />
          <InfoRow label="Heap Used" value={data?.memory?.heapUsed} />
          <InfoRow label="Heap Total" value={data?.memory?.heapTotal} />
          <InfoRow label="External" value={data?.memory?.external} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Environment Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <InfoRow label="DATABASE_URL" value={data?.environment?.databaseUrl} />
          <InfoRow label="NODE_ENV" value={data?.environment?.nodeEnv} />
          <InfoRow label="ALLOW_DEMO_SIGNIN" value={data?.environment?.allowDemoSignIn ? "true" : "false"} />
          <InfoRow label="FRED_KEY" value={data?.environment?.fredKeyConfigured ? "configured" : "not set"} />
          <InfoRow label="FIELD_ENCRYPTION_KEY" value={data?.environment?.fieldEncryptionKey ? "configured" : "not set"} />
          <InfoRow label="AI Providers" value={`${data?.environment?.aiProvidersConfigured} configured`} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Daemons</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <HealthIndicator label="Keepalive" status={data?.daemons?.keepalive} />
            <HealthIndicator label="Env Guardian" status={data?.daemons?.envGuardian} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AUDIT LOG SECTION
// ═══════════════════════════════════════════════════════════════
function AuditSection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-lg font-semibold">Audit Log ({data?.total ?? 0} events)</h2>
      <div className="space-y-1 max-h-[600px] overflow-y-auto">
        {data?.events?.map((e: any) => (
          <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gold/8 hover:bg-gold/[0.02] text-sm">
            <div className={cn("h-2 w-2 rounded-full shrink-0", e.result === "allowed" ? "bg-emerald-500" : "bg-red-500")} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{e.action}</p>
              <p className="text-xs text-muted-foreground">
                {e.actorName} · {e.target} · {new Date(e.timestamp).toLocaleString()}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">{e.result}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FINANCIAL SECTION
// ═══════════════════════════════════════════════════════════════
function FinancialSection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Platform Valuation</p>
          <p className="font-serif text-4xl font-bold text-gold mt-2">{(data?.totalPlatformValuation ?? 0).toLocaleString()} EGP</p>
          <Badge variant="outline" className="mt-3 border-emerald-500/30 text-emerald-600">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Zero Custody
          </Badge>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard icon={DollarSign} label="FX Rates" value={data?.totalFxRates ?? 0} color="text-emerald-600" />
        <MetricCard icon={Scale} label="Law Firms" value={data?.lawFirms ?? 0} color="text-purple-600" />
        <MetricCard icon={Activity} label="Expenses" value={data?.totalExpenses ?? 0} color="text-amber-600" />
        <MetricCard icon={Building2} label="Valuations" value={data?.totalValuations ?? 0} color="text-blue-600" />
      </div>
      <Card>
        <CardContent className="p-4">
          <InfoRow label="Escrow Status" value={data?.escrowStatus} />
          <InfoRow label="Zero Custody" value={data?.zeroCustody ? "Active" : "Inactive"} />
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AI SECTION
// ═══════════════════════════════════════════════════════════════
function AiSection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 mx-auto text-gold mb-3" />
          <p className="font-serif text-2xl font-semibold">{data?.totalConfigured} AI Provider(s) Configured</p>
          <p className="text-sm text-muted-foreground mt-1">{data?.cost}</p>
          <Badge variant="outline" className="mt-3 border-emerald-500/30 text-emerald-600">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Free Pollinations.AI fallback active
          </Badge>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.entries(data?.providers || {}).map(([name, info]: [string, any]) => (
          <Card key={name}>
            <CardContent className="p-4 text-center">
              <p className="font-medium text-sm capitalize">{name}</p>
              <Badge variant={info.status === "active" || info.status === "configured" ? "outline" : "secondary"} className="mt-2 text-[10px]">
                {info.status}
              </Badge>
              {info.free && <p className="text-[10px] text-emerald-600 mt-1">Free</p>}
              {info.keyRequired === false && <p className="text-[10px] text-muted-foreground">No key needed</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPLIANCE SECTION
// ═══════════════════════════════════════════════════════════════
function ComplianceSection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto text-gold mb-3" />
          <p className="font-serif text-2xl font-semibold">{data?.legalClauses} Legal Clauses</p>
          <p className="text-sm text-muted-foreground">across {data?.categories} categories</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Egyptian Laws Complied With</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.laws?.map((law: string) => (
              <div key={law} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{law}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 space-y-1">
          <InfoRow label="PSP Status" value={data?.pspStatus} />
          <InfoRow label="Data Protection" value={data?.dataProtection} />
          <InfoRow label="Zero Custody" value={data?.zeroCustody ? "Active" : "Inactive"} />
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APIS SECTION
// ═══════════════════════════════════════════════════════════════
function ApisSection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 text-center">
          <Server className="h-12 w-12 mx-auto text-gold mb-3" />
          <p className="font-serif text-2xl font-semibold">{data?.totalRoutes} API Routes</p>
          <p className="text-sm text-muted-foreground">{(data?.totalSize / 1024).toFixed(0)} KB total</p>
          <Badge variant="outline" className="mt-3 border-emerald-500/30 text-emerald-600">
            <CheckCircle2 className="h-3 w-3 mr-1" /> {data?.status}
          </Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Largest Routes (by file size)</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {data?.routes?.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-gold/5">
                <span className="font-mono">{r.path}</span>
                <span className="text-muted-foreground">{(r.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════
function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function HealthIndicator({ label, status }: { label: string; status: string }) {
  const isHealthy = status === "connected" || status === "running" || status === "pollinations (free)" || status === "active";
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-gold/8">
      {isHealthy ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
      <div>
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}

function HealthBucket({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  return (
    <div className={cn("rounded-xl border border-gold/8 p-4 text-center", bg)}>
      <p className={cn("text-3xl font-bold", color)}>{count}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value ?? "—"}</span>
    </div>
  );
}
