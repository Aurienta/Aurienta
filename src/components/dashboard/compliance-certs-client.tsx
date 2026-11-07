"use client";
import * as React from "react";
import { ShieldCheck, Award, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ComplianceCertsClient({ enterpriseId }: { enterpriseId?: string }) {
  const [certs, setCerts] = React.useState<any[]>([]);
  const [standards, setStandards] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!enterpriseId) { setLoading(false); return; }
    fetch(`/api/compliance-certs?enterpriseId=${enterpriseId}`).then(r => r.json()).then(d => {
      setCerts(d.certifications || []); setStandards(d.availableStandards || []); setLoading(false);
    });
  }, [enterpriseId]);

  if (!enterpriseId) return <p className="text-sm text-muted-foreground">No enterprise selected.</p>;
  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Compliance Certifications</h1>
        <p className="text-sm text-muted-foreground mt-1">SOC 2, ISO 27001, PDPL readiness tracking</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {standards.map((std) => {
          const cert = certs.find((c) => c.standard === std);
          return (
            <Card key={std}>
              <CardContent className="p-4 text-center">
                <Award className={`h-8 w-8 mx-auto mb-2 ${cert ? "text-gold" : "text-muted-foreground/30"}`} />
                <p className="font-medium text-sm">{std}</p>
                {cert ? (
                  <>
                    <p className="text-lg font-bold mt-1">{cert.readinessScore}%</p>
                    <Badge variant="outline" className="text-[10px] mt-1 capitalize">{cert.status}</Badge>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Not started</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader><CardTitle>Assess Readiness</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {standards.map((std) => (
              <Button key={std} variant="outline" onClick={async () => {
                await fetch("/api/compliance-certs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enterpriseId, standard: std }) });
                const res = await fetch(`/api/compliance-certs?enterpriseId=${enterpriseId}`);
                const d = await res.json(); setCerts(d.certifications || []);
              }}>
                <ShieldCheck className="h-4 w-4 mr-2" /> Assess {std}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
