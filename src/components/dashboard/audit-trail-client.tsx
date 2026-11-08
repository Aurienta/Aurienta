"use client";
import * as React from "react";
import { ScrollText, Loader2, Shield, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AuditTrailClient() {
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/admin/audit?limit=50").then(r => r.json()).then(d => {
      setEvents(d.events || d.entries || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-gold" />
          Constitutional Audit Trail
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every action on the platform is recorded in the constitutional ledger.
          SHA3-256 hash-chained, CRE-signed, immutable.
        </p>
      </div>

      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : events.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <ScrollText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No audit events found.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {events.map((event, i) => (
            <Card key={event.id || i}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-4 w-4 text-gold mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {event.timestamp ? new Date(event.timestamp).toLocaleString() : ""}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{event.action}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{event.result}</Badge>
                    </div>
                    {event.target && <p className="text-xs mt-1 font-mono text-muted-foreground">{event.target}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4" /> Audit Trail Integrity</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            The audit trail is SHA3-256 hash-chained. Each event's hash links to the previous
            event's hash, creating an immutable chain. Any tampering would break the chain and
            be immediately detectable. The chain is anchored by the CRE (Constitutional Runtime
            Engine) using Ed25519 signatures.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
