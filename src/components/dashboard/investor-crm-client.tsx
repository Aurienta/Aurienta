"use client";
import * as React from "react";
import { Users, Loader2, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const STAGES = ["intro", "interested", "diligence", "committed", "wired", "passed"];

export function InvestorCrmClient({ enterpriseId }: { enterpriseId?: string }) {
  const [pipeline, setPipeline] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [showAdd, setShowAdd] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");

  const load = () => {
    if (!enterpriseId) { setLoading(false); return; }
    fetch(`/api/investor-crm?enterpriseId=${enterpriseId}`).then(r => r.json()).then(d => { setPipeline(d); setLoading(false); });
  };

  React.useEffect(load, [enterpriseId]);

  const handleAdd = async () => {
    await fetch("/api/investor-crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enterpriseId, name, email }) });
    setName(""); setEmail(""); setShowAdd(false); load();
  };

  if (!enterpriseId) return <p className="text-sm text-muted-foreground">No enterprise selected.</p>;
  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Investor CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Fundraising pipeline: intro → diligence → wire</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}><UserPlus className="h-4 w-4 mr-2" /> Add Investor</Button>
      </div>
      {showAdd && (
        <Card><CardContent className="p-4 space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <Button onClick={handleAdd}>Save</Button>
        </CardContent></Card>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map(stage => (
          <Card key={stage}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{pipeline?.byStage?.[stage] ?? 0}</p>
              <p className="text-xs text-muted-foreground capitalize">{stage}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Contacts ({pipeline?.contacts?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {pipeline?.contacts?.length === 0 ? <p className="text-sm text-muted-foreground">No investors yet. Add your first contact above.</p> : (
            <div className="space-y-2">
              {pipeline?.contacts?.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-gold/10">
                  <div><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></div>
                  <Badge variant="outline" className="capitalize">{c.stage}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
