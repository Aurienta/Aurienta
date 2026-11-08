"use client";
import * as React from "react";
import { TrendingUp, Loader2, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AutoInvestClient({ userId }: { enterpriseId?: string; userId: string }) {
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch("/api/auto-invest").then(r => r.json()).then(d => { setHistory(d.history || []); setLoading(false); });
  }, []);
  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;
  return (
    <div className="space-y-6">
      <div><h1 className="font-serif text-2xl font-semibold">Auto-Invest Loop</h1>
      <p className="text-sm text-muted-foreground mt-1">Automatically invest EWA proceeds into productive enterprises</p></div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-gold" /> Configure Auto-Invest</CardTitle></CardHeader>
      <CardContent><p className="text-sm text-muted-foreground">Set the percentage of your EWA net amount to auto-invest. Each investment requires your explicit consent — this is NOT automated trading.</p>
      <Button className="mt-3" onClick={async () => {
        await fetch("/api/auto-invest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ percentageToInvest: 20 }) });
        alert("Auto-invest configured: 20% of EWA will be invested.");
      }}><TrendingUp className="h-4 w-4 mr-2" /> Enable Auto-Invest (20%)</Button></CardContent></Card>
      {history.length > 0 && (
        <Card><CardHeader><CardTitle>Investment History ({history.length})</CardTitle></CardHeader>
        <CardContent><div className="space-y-2">{history.map((h: any) => (
          <div key={h.id} className="flex items-center justify-between p-3 rounded-lg border border-gold/10">
            <div><p className="font-medium text-sm">{h.equityUnits} units @ {h.pricePerUnit} EGP</p>
            <p className="text-xs text-muted-foreground">{new Date(h.executedAt).toLocaleDateString()}</p></div>
            <Badge variant="outline" className="text-gold">{h.investedAmount} EGP</Badge>
          </div>))}</div></CardContent></Card>
      )}
    </div>
  );
}
