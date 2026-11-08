"use client";
import * as React from "react";
import { Shield, Loader2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PricingClient({ enterpriseId }: { enterpriseId?: string; userId?: string }) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!enterpriseId) { setLoading(false); return; }
    fetch(`/api/pricing?enterpriseId=${enterpriseId}&healthScore=75`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [enterpriseId]);
  if (!enterpriseId) return <p className="text-sm text-muted-foreground">No enterprise selected.</p>;
  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;
  return (
    <div className="space-y-6">
      <div><h1 className="font-serif text-2xl font-semibold">Insurance & Bond Pricing</h1>
      <p className="text-sm text-muted-foreground mt-1">Health score → dynamic premium & yield (advisory only)</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-gold" /> Insurance Pricing</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p>Health Score: <span className="font-medium">{data?.insurance?.healthScore}/100</span></p>
          <p>Base Premium: <span className="font-medium">{data?.insurance?.basePremiumRate}%</span></p>
          <p>Adjusted Premium: <span className="font-medium text-gold">{data?.insurance?.adjustedPremiumRate}%</span></p>
          <p>Risk Multiplier: <span className="font-medium">{data?.insurance?.riskMultiplier}x</span></p>
          <p>Max Insurable: <span className="font-medium">{data?.insurance?.maxInsurableAmount?.toLocaleString()} EGP</span></p>
          <p>Deductible: <span className="font-medium">{data?.insurance?.deductibleRate}%</span></p>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-gold" /> Bond Pricing</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p>Health Score: <span className="font-medium">{data?.bond?.healthScore}/100</span></p>
          <p>Base Yield: <span className="font-medium">{data?.bond?.baseYield}%</span></p>
          <p>Adjusted Yield: <span className="font-medium text-gold">{data?.bond?.adjustedYield}%</span></p>
          <p>Credit Spread: <span className="font-medium">{data?.bond?.creditSpread} bps</span></p>
          <p>Bond Rating: <Badge variant="outline" className="text-gold">{data?.bond?.bondRating}</Badge></p>
          <p>Max Bond Amount: <span className="font-medium">{data?.bond?.maxBondAmount?.toLocaleString()} EGP</span></p>
        </CardContent></Card>
      </div>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">⚠️ Advisory pricing model only. NOT insurance underwriting (Law 10/1981) or securities offering (Law 95/1992). AURIENTA is not a licensed insurer or broker.</p></CardContent></Card>
    </div>
  );
}
