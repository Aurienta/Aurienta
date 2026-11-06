"use client";
import * as React from "react";
import { Wallet, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EwaClient({ userId }: { userId: string }) {
  const [available, setAvailable] = React.useState<any>(null);
  const [amount, setAmount] = React.useState("2000");
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [requesting, setRequesting] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/ewa?action=available").then(r => r.json()).then(d => { setAvailable(d); setLoading(false); });
  }, []);

  const handleRequest = async () => {
    setRequesting(true);
    const res = await fetch("/api/ewa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: parseFloat(amount), enterpriseId: "ewa" }) });
    const data = await res.json();
    setResult(data);
    setRequesting(false);
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Earned Wage Access (EWA)</h1>
        <p className="text-sm text-muted-foreground mt-1">Access your earned-but-unpaid wages before payday</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-gold" /> Available Wage</CardTitle></CardHeader>
        <CardContent>
          {available && (
            <div className="space-y-2">
              <p>Daily rate: <span className="font-medium">{available.dailyRate} EGP</span></p>
              <p>Days since last pay: <span className="font-medium">{available.daysSinceLastPay}</span></p>
              <p>Earned amount: <span className="font-medium">{available.earnedAmount} EGP</span></p>
              <p className="text-lg font-semibold text-gold">Max accessible: {available.maxAccessible} EGP</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Request EWA</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Amount (EGP)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <Button onClick={handleRequest} disabled={requesting}>
            {requesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
            Request EWA
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader><CardTitle>EWA Approved</CardTitle></CardHeader>
          <CardContent>
            <p>Amount: {result.requestedAmount} EGP</p>
            <p>Fee (1.5%): {result.fee} EGP</p>
            <p className="font-semibold">Net: {result.netAmount} EGP</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
