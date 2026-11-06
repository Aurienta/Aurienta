"use client";
import * as React from "react";
import { Shield, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function KycClient({ user }: { user: { id: string; legalName: string; verificationLevel: string } }) {
  const [status, setStatus] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [initiating, setInitiating] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/kyc").then(r => r.json()).then(d => { setStatus(d); setLoading(false); });
  }, []);

  const handleInitiate = async () => {
    setInitiating(true);
    const res = await fetch("/api/kyc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idType: "national_id" }) });
    const data = await res.json();
    setStatus(data);
    setInitiating(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Identity Verification (KYC)</h1>
        <p className="text-sm text-muted-foreground mt-1">Verify your identity per Law 151/2020 (PDPL) + Law 80/2002 (AML)</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-gold" /> Current Status</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : status?.status ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {status.status.status === "verified" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
                <span className="font-medium capitalize">{status.status.status}</span>
                {status.status.score && <Badge variant="outline">Score: {status.status.score}/100</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">Reference: {status.status.reference}</p>
              <p className="text-xs text-muted-foreground">Legal basis: Law 151/2020 (PDPL) + Law 80/2002 (AML)</p>
            </div>
          ) : <p className="text-sm text-muted-foreground">Not yet verified</p>}
        </CardContent>
      </Card>
      <Button onClick={handleInitiate} disabled={initiating}>
        {initiating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
        {status?.status?.status === "verified" ? "Re-verify" : "Start KYC Verification"}
      </Button>
    </div>
  );
}
