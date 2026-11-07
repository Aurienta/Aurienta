"use client";
import * as React from "react";
import { Building2, Loader2, Check, AlertCircle, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function BankReconClient({ enterpriseId }: { enterpriseId?: string }) {
  const [status, setStatus] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!enterpriseId) { setLoading(false); return; }
    fetch(`/api/bank-reconciliation?enterpriseId=${enterpriseId}`).then(r => r.json()).then(d => {
      setStatus(d); setLoading(false);
    });
  }, [enterpriseId]);

  if (!enterpriseId) return <p className="text-sm text-muted-foreground">No enterprise selected.</p>;
  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Bank Reconciliation</h1>
          <p className="text-sm text-muted-foreground mt-1">Match bank statements against ledger transactions (EAS)</p>
        </div>
        <Button><Upload className="h-4 w-4 mr-2" /> Import Statement</Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{status?.totalBankTransactions ?? 0}</p>
          <p className="text-xs text-muted-foreground">Total Transactions</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{status?.matched ?? 0}</p>
          <p className="text-xs text-muted-foreground">Matched</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{status?.unmatched ?? 0}</p>
          <p className="text-xs text-muted-foreground">Unmatched</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{status?.netFlow?.toLocaleString() ?? 0}</p>
          <p className="text-xs text-muted-foreground">Net Flow (EGP)</p>
        </CardContent></Card>
      </div>
    </div>
  );
}
