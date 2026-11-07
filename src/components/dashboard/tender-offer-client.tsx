"use client";
import * as React from "react";
import { Handshake, Loader2, Clock, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TenderOfferClient({ enterpriseId }: { enterpriseId?: string }) {
  const [offers, setOffers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!enterpriseId) { setLoading(false); return; }
    fetch(`/api/tender-offer?enterpriseId=${enterpriseId}`).then(r => r.json()).then(d => {
      setOffers(d.offers || []); setLoading(false);
    });
  }, [enterpriseId]);

  if (!enterpriseId) return <p className="text-sm text-muted-foreground">No enterprise selected.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Tender Offers</h1>
        <p className="text-sm text-muted-foreground mt-1">Secondary market liquidity — buybacks & tender offers</p>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : offers.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Handshake className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No tender offers yet.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Handshake className="h-5 w-5 text-gold" />
                    <span className="font-medium capitalize">{offer.offerType}</span>
                  </div>
                  <Badge variant="outline" className="capitalize">{offer.status}</Badge>
                </div>
                <p>Price: <span className="font-medium">{offer.pricePerUnitEgp} EGP/unit</span></p>
                <p>Max units: {offer.maxUnits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  Closes: {new Date(offer.closesAt).toLocaleDateString()}
                </p>
                {offer.responses?.length > 0 && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                    <Check className="h-3 w-3" />
                    {offer.responses.length} response(s)
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
