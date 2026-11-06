"use client";
import * as React from "react";
import { Banknote, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PaymentsClient() {
  const [amount, setAmount] = React.useState("10000");
  const [method, setMethod] = React.useState<"fawry" | "paymob">("fawry");
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const handlePay = async () => {
    setLoading(true);
    const res = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: parseFloat(amount), method, description: "Capital participation" }) });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">Fawry & Paymob integration — funds go to law-firm escrow (Zero Custody)</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-gold" /> Initiate Payment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (EGP)</Label>
            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant={method === "fawry" ? "default" : "outline"} onClick={() => setMethod("fawry")}>Fawry</Button>
            <Button variant={method === "paymob" ? "default" : "outline"} onClick={() => setMethod("paymob")}>Paymob</Button>
          </div>
          <Button onClick={handlePay} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Banknote className="h-4 w-4 mr-2" />}
            Pay {amount} EGP via {method}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader><CardTitle>Payment Result</CardTitle></CardHeader>
          <CardContent>
            <p>Reference: <code>{result.reference}</code></p>
            <p>Status: {result.status}</p>
            <p>Amount: {result.amount} {result.currency}</p>
            {result.payUrl && <a href={result.payUrl} target="_blank" rel="noopener" className="text-gold underline flex items-center gap-1 mt-2"><ExternalLink className="h-3 w-3" /> Complete Payment</a>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
