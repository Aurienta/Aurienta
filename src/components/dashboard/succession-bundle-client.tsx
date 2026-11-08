"use client";
import * as React from "react";
import { Package, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SuccessionBundleClient({ userId }: { enterpriseId?: string; userId: string }) {
  const [bundle, setBundle] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch("/api/succession-bundle").then(r => r.json()).then(d => { setBundle(d); setLoading(false); });
  }, []);
  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;
  return (
    <div className="space-y-6">
      <div><h1 className="font-serif text-2xl font-semibold">Financial Bundle</h1>
      <p className="text-sm text-muted-foreground mt-1">Succession + EWA + Diaspora — your complete financial picture</p></div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-gold" /> Bundle Score: {bundle?.bundleScore ?? 0}/100</CardTitle></CardHeader>
      <CardContent><div className="h-3 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gold-gradient" style={{ width: `${bundle?.bundleScore ?? 0}%` }} /></div></CardContent></Card>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{ label: "Net Worth", value: bundle?.totalNetWorthEgp, unit: "EGP" },
          { label: "Liquid Assets", value: bundle?.liquidAssetsEgp, unit: "EGP" },
          { label: "Equity Holdings", value: bundle?.equityHoldingsEgp, unit: "EGP" },
          { label: "Insurance", value: bundle?.insuranceCoverageEgp, unit: "EGP" }].map(s => (
          <Card key={s.label}><CardContent className="p-4 text-center">
            <p className="text-lg font-bold">{s.value?.toLocaleString() ?? 0}</p>
            <p className="text-xs text-muted-foreground">{s.label} ({s.unit})</p>
          </CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Succession Plan", active: bundle?.hasSuccessionPlan },
          { label: "EWA Access", active: bundle?.hasEwaAccess },
          { label: "Diaspora Profile", active: bundle?.hasDiasporaProfile }].map(s => (
          <Card key={s.label}><CardContent className="p-4 flex items-center gap-2">
            {s.active ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
            <span className="text-sm font-medium">{s.label}</span>
          </CardContent></Card>
        ))}
      </div>
      <Card><CardHeader><CardTitle>Recommendations</CardTitle></CardHeader>
      <CardContent><ul className="space-y-2">{bundle?.recommendations?.map((r: string, i: number) => (
        <li key={i} className="flex items-start gap-2 text-sm"><span className="text-gold mt-0.5">→</span> {r}</li>
      ))}</ul></CardContent></Card>
    </div>
  );
}
