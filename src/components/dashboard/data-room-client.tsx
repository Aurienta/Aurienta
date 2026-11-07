"use client";
import * as React from "react";
import { FolderOpen, FileText, Upload, Loader2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DataRoomClient({ enterpriseId }: { enterpriseId?: string }) {
  const [docs, setDocs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!enterpriseId) { setLoading(false); return; }
    fetch(`/api/data-room?enterpriseId=${enterpriseId}`).then(r => r.json()).then(d => {
      setDocs(d.documents || []); setLoading(false);
    });
  }, [enterpriseId]);

  if (!enterpriseId) return <p className="text-sm text-muted-foreground">No enterprise selected.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Data Room</h1>
          <p className="text-sm text-muted-foreground mt-1">Secure document sharing for investor due diligence</p>
        </div>
        <Button><Upload className="h-4 w-4 mr-2" /> Upload Document</Button>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : docs.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No documents yet. Upload your first due diligence document.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {docs.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-gold" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline" className="capitalize">{doc.category}</Badge>
                <Badge variant="outline" className="capitalize">{doc.accessLevel}</Badge>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
