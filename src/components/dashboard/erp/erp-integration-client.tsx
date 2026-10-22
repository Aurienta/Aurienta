"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Database, Layers, Building2, Webhook, Workflow, CheckCircle2, AlertTriangle, Loader2, ArrowRightLeft, Zap, Clock, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/dashboard/ux/empty-state";
import { toast } from "sonner";

const PROVIDERS = [
  { id: "native", label: "AURIENTA Native ERP", icon: ShieldCheck, color: "#4F46E5", description: "Built-in constitutional ERP. No external setup. CRE enforcement on every transaction." },
  { id: "netsuite", label: "Oracle NetSuite", icon: Database, color: "#7C3AED", description: "REST API (OAuth 2.0). Bidirectional sync with CRE enforcement." },
  { id: "odoo", label: "Odoo", icon: Layers, color: "#06B6D4", description: "JSON-RPC API. Sync projects, inventory, procurement." },
  { id: "sap", label: "SAP", icon: Building2, color: "#10B981", description: "OData API. Sync procurement and manufacturing." },
  { id: "custom_rest", label: "Custom REST API", icon: Webhook, color: "#F59E0B", description: "Any REST-based ERP system via API key." },
  { id: "custom_graphql", label: "Custom GraphQL API", icon: Workflow, color: "#818CF8", description: "Any GraphQL-based ERP system." },
];

const PROVIDER_FIELDS: Record<string, { key: string; label: string; type: string; placeholder?: string }[]> = {
  native: [],
  netsuite: [
    { key: "accountId", label: "Account ID", type: "text", placeholder: "TSTDRV123456" },
    { key: "consumerKey", label: "Consumer Key", type: "password" },
    { key: "consumerSecret", label: "Consumer Secret", type: "password" },
    { key: "tokenId", label: "Token ID", type: "password" },
    { key: "tokenSecret", label: "Token Secret", type: "password" },
    { key: "realm", label: "Realm", type: "text", placeholder: "1234567" },
  ],
  odoo: [
    { key: "url", label: "Odoo URL", type: "text", placeholder: "https://mycompany.odoo.com" },
    { key: "database", label: "Database", type: "text", placeholder: "mycompany" },
    { key: "username", label: "Username", type: "text", placeholder: "admin" },
    { key: "password", label: "Password / API Key", type: "password" },
  ],
  sap: [
    { key: "baseUrl", label: "SAP Base URL", type: "text", placeholder: "https://mycompany.sap.com" },
    { key: "apiKey", label: "API Key", type: "password" },
    { key: "odataUrl", label: "OData Service URL", type: "text", placeholder: "/sap/opu/odata/sap/ZERP_SRV/" },
  ],
  custom_rest: [
    { key: "apiUrl", label: "API Base URL", type: "text", placeholder: "https://erp.mycompany.com/api" },
    { key: "apiKey", label: "API Key", type: "password" },
    { key: "authHeader", label: "Auth Header Name", type: "text", placeholder: "Authorization" },
  ],
  custom_graphql: [
    { key: "apiUrl", label: "GraphQL Endpoint URL", type: "text", placeholder: "https://erp.mycompany.com/graphql" },
    { key: "apiKey", label: "API Key / Token", type: "password" },
  ],
};

const MODULES = ["projects", "tasks", "inventory", "procurement", "assets", "production", "quality", "timesheets"];

export function ErpIntegrationClient({ user, currentIntegration, allIntegrations }: {
  user: { legalName: string; enterpriseId: string | null; role: string | null };
  currentIntegration: { id: string; provider: string; name: string; status: string; isPrimary: boolean; syncDirection: string; syncInterval: string; lastSyncAt: string | null; lastSyncStatus: string | null; creEnforcementEnabled: boolean; modules: string[] } | null;
  allIntegrations: { id: string; provider: string; name: string; status: string; isPrimary: boolean; lastSyncAt: string | null; recordsSynced: number }[];
}) {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = React.useState<string>(currentIntegration?.provider || "native");
  const [configValues, setConfigValues] = React.useState<Record<string, string>>({});
  const [syncDirection, setSyncDirection] = React.useState<string>(currentIntegration?.syncDirection || "bidirectional");
  const [syncInterval, setSyncInterval] = React.useState<string>(currentIntegration?.syncInterval || "hourly");
  const [selectedModules, setSelectedModules] = React.useState<string[]>(currentIntegration?.modules || MODULES);
  const [creEnabled, setCreEnabled] = React.useState<boolean>(currentIntegration?.creEnforcementEnabled ?? true);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);

  const handleSave = async () => {
    if (!user.enterpriseId) { toast.error("No enterprise found"); return; }
    setSaving(true);
    try {
      const res = await csrfFetch("/api/erp/integration", {
        method: "POST",
        body: JSON.stringify({
          enterpriseId: user.enterpriseId,
          provider: selectedProvider,
          name: PROVIDERS.find(p => p.id === selectedProvider)?.label || "ERP",
          config: configValues,
          syncDirection,
          syncInterval,
          modules: selectedModules,
          creEnforcementEnabled: creEnabled,
        }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("ERP integration configured successfully"); router.refresh(); }
      else toast.error(data.error || "Configuration failed");
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    if (!currentIntegration) return;
    setTesting(true);
    try {
      const res = await csrfFetch("/api/erp/integration/test", {
        method: "POST",
        body: JSON.stringify({ integrationId: currentIntegration.id }),
      });
      const data = await res.json();
      if (data.success) toast.success(data.message + ` (${data.latencyMs}ms)`);
      else toast.error(data.message);
    } catch { toast.error("Test failed"); }
    finally { setTesting(false); }
  };

  const handleSync = async () => {
    if (!currentIntegration) return;
    setSyncing(true);
    try {
      const res = await csrfFetch("/api/erp/integration/sync", {
        method: "POST",
        body: JSON.stringify({ integrationId: currentIntegration.id, full: true }),
      });
      const data = await res.json();
      if (data.success) toast.success(`Sync complete: ${data.recordsIn} in, ${data.recordsOut} out, ${data.creDecisions} CRE checks`);
      else toast.error("Sync failed");
      router.refresh();
    } catch { toast.error("Sync failed"); }
    finally { setSyncing(false); }
  };

  const toggleModule = (mod: string) => {
    setSelectedModules(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
  };

  if (!user.enterpriseId) {
    return <EmptyState icon={Database} title="No Enterprise" description="Join an enterprise to configure ERP integration." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E1B4B]">ERP Integration</h1>
        <p className="mt-1 text-sm text-slate-500">Choose your ERP: use AURIENTA&apos;s built-in constitutional ERP, or connect an external system (Oracle NetSuite, Odoo, SAP, or custom API).</p>
      </div>

      {/* Current Integration Status */}
      {currentIntegration && (
        <Card className="border-indigo-200 bg-indigo-50/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-[#1E1B4B]">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                Active Integration
              </CardTitle>
              <Badge className={currentIntegration.status === "active" ? "bg-indigo-600 text-white" : "bg-amber-500 text-white"}>
                {currentIntegration.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div><p className="text-xs text-slate-500">Provider</p><p className="font-semibold text-[#1E1B4B]">{currentIntegration.name}</p></div>
              <div><p className="text-xs text-slate-500">Sync Direction</p><p className="font-semibold text-[#1E1B4B]">{currentIntegration.syncDirection}</p></div>
              <div><p className="text-xs text-slate-500">Interval</p><p className="font-semibold text-[#1E1B4B]">{currentIntegration.syncInterval}</p></div>
              <div><p className="text-xs text-slate-500">Last Sync</p><p className="font-semibold text-[#1E1B4B]">{currentIntegration.lastSyncAt ? new Date(currentIntegration.lastSyncAt).toLocaleString() : "Never"}</p></div>
            </div>
            <div className="flex items-center gap-2">
              {currentIntegration.creEnforcementEnabled && (
                <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200"><ShieldCheck className="mr-1 h-3 w-3" /> CRE Enforcement Active</Badge>
              )}
              {currentIntegration.modules.map((m: string) => (
                <Badge key={m} variant="outline" className="border-indigo-200 text-indigo-600">{m}</Badge>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleTest} disabled={testing} variant="outline" size="sm">
                {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                Test Connection
              </Button>
              <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
                {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Sync Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Selection */}
      <Card>
        <CardHeader><CardTitle className="text-[#1E1B4B]">Choose ERP Provider</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROVIDERS.map((p) => {
              const Icon = p.icon;
              const isSelected = selectedProvider === p.id;
              const isCurrent = currentIntegration?.provider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProvider(p.id); setConfigValues({}); }}
                  className={`rounded-xl border p-4 text-left transition-all ${isSelected ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: p.color + "15" }}>
                      <Icon className="h-5 w-5" style={{ color: p.color }} />
                    </div>
                    {isCurrent && <Badge className="bg-indigo-600 text-white text-xs">Current</Badge>}
                  </div>
                  <h3 className="mt-2 font-semibold text-[#1E1B4B]">{p.label}</h3>
                  <p className="mt-1 text-xs text-slate-500">{p.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuration (only for non-native) */}
      {selectedProvider !== "native" && PROVIDER_FIELDS[selectedProvider] && (
        <Card>
          <CardHeader><CardTitle className="text-[#1E1B4B]">Connection Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {PROVIDER_FIELDS[selectedProvider].map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label htmlFor={field.key} className="text-sm text-slate-600">{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={configValues[field.key] || ""}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="border-slate-200 focus:border-indigo-400"
                  />
                </div>
              ))}
            </div>

            <Separator />

            {/* Sync Settings */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-sm text-slate-600">Sync Direction</Label>
                <Select value={syncDirection} onValueChange={setSyncDirection}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bidirectional"><ArrowRightLeft className="mr-2 h-4 w-4 inline" /> Bidirectional</SelectItem>
                    <SelectItem value="one_way_in">One-way (Import to AURIENTA)</SelectItem>
                    <SelectItem value="one_way_out">One-way (Export from AURIENTA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-slate-600">Sync Interval</Label>
                <Select value={syncInterval} onValueChange={setSyncInterval}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime"><Zap className="mr-2 h-4 w-4 inline" /> Realtime</SelectItem>
                    <SelectItem value="hourly"><Clock className="mr-2 h-4 w-4 inline" /> Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="manual">Manual only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Module Selection */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Modules to Sync</Label>
              <div className="flex flex-wrap gap-2">
                {MODULES.map(mod => (
                  <button
                    key={mod}
                    onClick={() => toggleModule(mod)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${selectedModules.includes(mod) ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-indigo-300"}`}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>

            {/* CRE Enforcement Toggle */}
            <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1E1B4B]">CRE Enforcement (Recommended)</p>
                <p className="text-xs text-slate-500">All external ERP data is validated by the Constitutional Runtime Engine before sync. Budget overruns, unauthorized purchases, and quality failures are blocked — even from external systems.</p>
              </div>
              <button
                onClick={() => setCreEnabled(!creEnabled)}
                className={`relative h-6 w-11 rounded-full transition-colors ${creEnabled ? "bg-indigo-600" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${creEnabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-[#4F46E5] hover:bg-[#3730A3]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Save Integration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Native ERP — no config needed */}
      {selectedProvider === "native" && (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                <ShieldCheck className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#1E1B4B]">AURIENTA Native ERP</h3>
                <p className="text-sm text-slate-500">Built-in constitutional ERP with CRE enforcement on every transaction. No external setup needed. Projects, inventory, procurement, assets, manufacturing, and quality control — all governed by the Constitutional Runtime Engine.</p>
              </div>
              <Button onClick={handleSave} disabled={saving} className="bg-[#4F46E5] hover:bg-[#3730A3]">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Use Native ERP
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Integrations History */}
      {allIntegrations.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-[#1E1B4B]">Integration History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allIntegrations.map((int) => (
                <div key={int.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                      {int.provider === "native" ? <ShieldCheck className="h-4 w-4 text-indigo-600" /> : <Database className="h-4 w-4 text-indigo-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1E1B4B]">{int.name}</p>
                      <p className="text-xs text-slate-500">{int.provider} · {int.status} · {int.recordsSynced} records synced</p>
                    </div>
                  </div>
                  {int.isPrimary && <Badge className="bg-indigo-600 text-white">Primary</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
