"use client";
import * as React from "react";
import { FileText, PenLine, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ESignatureClient({ userId }: { userId: string }) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/e-signature").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">E-Signature</h1>
        <p className="text-sm text-muted-foreground mt-1">Ed25519-signed documents — Law 15/2004 compliant</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-gold" /> Document Templates</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.templates?.map((t: any) => (
              <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-gold/10">
                <PenLine className="h-4 w-4 text-gold mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {data?.documents?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Your Documents ({data.documents.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-gold/10">
                  <div>
                    <p className="font-medium text-sm">{doc.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{doc.documentHash?.slice(0, 16)}...</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.signers?.length > 0 && <span className="flex items-center gap-1 text-xs text-emerald-600"><Check className="h-3 w-3" /> {doc.signers.length} signed</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
