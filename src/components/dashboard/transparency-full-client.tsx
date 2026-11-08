"use client";
import * as React from "react";
import { Eye, Shield, FileText, Scale, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TransparencyFullClient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold flex items-center gap-2">
          <Eye className="h-6 w-6 text-gold" />
          Public Transparency Portal
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Constitutional transparency — §8.6.2 + §44.6.1. This page provides
          public visibility into platform health, constitutional compliance,
          and enterprise governance per Egyptian PDPL Law 151/2020 Art. 22.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gold" />
            Platform Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">99.9%</p>
              <p className="text-xs text-muted-foreground">Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gold">CRE Online</p>
              <p className="text-xs text-muted-foreground">Constitutional Runtime</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">0xB4F8…E7D1A</p>
              <p className="text-xs text-muted-foreground">Ledger Hash</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">SHA3-256</p>
              <p className="text-xs text-muted-foreground">Hash Chain</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gold" />
            Enterprise Registry (Public)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            All constitutional enterprises and their public health scores.
          </p>
          <div className="space-y-2">
            {[
              { name: "EcoPack Solutions", tier: "C — Growth", health: 91, sector: "Manufacturing" },
              { name: "Nile Brew Café", tier: "D — Established", health: 93, sector: "Retail" },
              { name: "SmartFarm Egypt", tier: "F — Graduated JSC", health: 95, sector: "Agriculture" },
              { name: "Street Bites", tier: "A — Micro", health: 80, sector: "Food & Beverage" },
            ].map((e) => (
              <div key={e.name} className="flex items-center justify-between p-3 rounded-lg border border-gold/10">
                <div>
                  <p className="font-medium text-sm">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.tier} · {e.sector}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={e.health >= 90 ? "text-emerald-600" : "text-amber-600"}>
                    Health: {e.health}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-gold" />
            Zero Custody Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            AURIENTA operates under a Zero Custody principle. All funds are
            held in law-firm escrow accounts at CBE-regulated banks.
            AURIENTA never holds, clears, or settles any funds.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-gold/25 text-gold">Law 17/1983 Art. 47</Badge>
            <Badge variant="outline" className="border-gold/25 text-gold">Law 194/2020 Art. 3</Badge>
            <Badge variant="outline" className="border-gold/25 text-gold">Law 5/2022</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gold" />
            Legal Framework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            AURIENTA operates under Egyptian law. The following legal clauses
            govern all platform activities:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Law 159/1981 (Companies Law)",
              "Law 95/1992 (Capital Market Law)",
              "Law 12/2003 (Labour Law)",
              "Law 151/2020 (PDPL)",
              "Law 80/2002 (AML)",
              "Law 15/2004 (E-Signature)",
              "Law 17/1983 (Lawyers' Code)",
              "Law 194/2020 (Banking Law)",
            ].map((law) => (
              <Badge key={law} variant="outline" className="text-[10px] justify-center py-1">
                {law}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
