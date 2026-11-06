"use client";
import * as React from "react";
import { ShieldCheck, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_ICONS = { compliant: ShieldCheck, warning: AlertTriangle, non_compliant: XCircle, not_applicable: ShieldCheck };
const STATUS_COLORS = { compliant: "text-emerald-600", warning: "text-amber-600", non_compliant: "text-red-600", not_applicable: "text-muted-foreground" };

export function ComplianceClient({ enterpriseId }: { enterpriseId?: string }) {
  const [report, setReport] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!enterpriseId) { setLoading(false); return; }
    fetch(`/api/compliance?enterpriseId=${enterpriseId}`).then(r => r.json()).then(d => { setReport(d); setLoading(false); });
  }, [enterpriseId]);

  if (!enterpriseId) return <p className="text-sm text-muted-foreground">No enterprise selected.</p>;
  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Compliance Automation</h1>
        <p className="text-sm text-muted-foreground mt-1">Egyptian regulatory checks: PDPL, FRA, ETA, NOSI, AML</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Overall Score: {report?.overallScore ?? 0}/100</CardTitle></CardHeader>
        <CardContent>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gold-gradient transition-all" style={{ width: `${report?.overallScore ?? 0}%` }} />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {report?.checks?.map((check: any) => {
          const Icon = STATUS_ICONS[check.status as keyof typeof STATUS_ICONS];
          const color = STATUS_COLORS[check.status as keyof typeof STATUS_COLORS];
          return (
            <Card key={check.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 ${color} shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm">{check.title}</h3>
                      <Badge variant="outline" className="text-[10px] uppercase">{check.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{check.description}</p>
                    {check.details && <p className="text-xs mt-1">{check.details}</p>}
                    {check.remediation && <p className="text-xs text-amber-600 mt-1">→ {check.remediation}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
