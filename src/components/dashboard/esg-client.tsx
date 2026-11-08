"use client";
import * as React from "react";
import { Leaf, Users, Scale, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CAT_ICONS = { environmental: Leaf, social: Users, governance: Scale };
const CAT_COLORS = { environmental: "text-emerald-600", social: "text-blue-600", governance: "text-purple-600" };

export function EsgClient({ enterpriseId }: { enterpriseId?: string; userId?: string }) {
  const [report, setReport] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!enterpriseId) { setLoading(false); return; }
    fetch(`/api/esg?enterpriseId=${enterpriseId}`).then(r => r.json()).then(d => { setReport(d); setLoading(false); });
  }, [enterpriseId]);
  if (!enterpriseId) return <p className="text-sm text-muted-foreground">No enterprise selected.</p>;
  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;
  return (
    <div className="space-y-6">
      <div><h1 className="font-serif text-2xl font-semibold">ESG Compliance</h1>
      <p className="text-sm text-muted-foreground mt-1">Environmental, Social & Governance metrics (Law 4/1994 + Vision 2030)</p></div>
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Environmental", score: report?.environmentalScore, icon: Leaf, color: "text-emerald-600" },
          { label: "Social", score: report?.socialScore, icon: Users, color: "text-blue-600" },
          { label: "Governance", score: report?.governanceScore, icon: Scale, color: "text-purple-600" }].map(s => (
          <Card key={s.label}><CardContent className="p-4 text-center">
            <s.icon className={`h-8 w-8 mx-auto mb-2 ${s.color}`} />
            <p className="text-2xl font-bold">{s.score ?? 0}%</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>
      <Card><CardHeader><CardTitle>Overall ESG Score: {report?.overallScore ?? 0}/100</CardTitle></CardHeader>
      <CardContent>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${report?.overallScore ?? 0}%` }} />
        </div>
      </CardContent></Card>
      <div className="grid gap-3">
        {report?.metrics?.map((m: any) => {
          const Icon = CAT_ICONS[m.category as keyof typeof CAT_ICONS] || Scale;
          const color = CAT_COLORS[m.category as keyof typeof CAT_COLORS] || "text-muted-foreground";
          return (
            <Card key={m.id}><CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-5 w-5 ${color}`} />
              <div className="flex-1"><p className="font-medium text-sm">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.description}</p></div>
              <div className="text-right"><p className="text-sm font-medium">{m.current} {m.unit}</p>
              <p className="text-xs text-muted-foreground">Target: {m.target} {m.unit}</p>
              <Badge variant="outline" className={`text-[10px] mt-1 capitalize ${m.status === "compliant" ? "text-emerald-600" : m.status === "warning" ? "text-amber-600" : "text-red-600"}`}>{m.status}</Badge></div>
            </CardContent></Card>
          );
        })}
      </div>
    </div>
  );
}
