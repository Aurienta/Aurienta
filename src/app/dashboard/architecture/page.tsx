import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { INSTITUTIONAL_ARCHITECTURE, RACI_MATRIX } from "@/lib/aurienta/institutional-architecture";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Network, Shield, Crown, Layers, GitBranch } from "lucide-react";

export const metadata = { title: "Institutional Architecture · AURIENTA" };
export const dynamic = "force-dynamic";

export default async function ArchitecturePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/architecture");

  const arch = INSTITUTIONAL_ARCHITECTURE;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            Institutional Architecture — Canonical Corporate Structure
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">AURIENTA Constitutional Enterprise Infrastructure Group</h1>
        <p className="font-sans text-sm text-muted-foreground">
          {arch.group} · Founder & Sole Owner: {arch.founder} · {arch.ownership}
        </p>
      </header>

      {/* Founder card */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="flex items-center gap-4 p-5">
          <Crown className="h-8 w-8 text-gold" />
          <div>
            <p className="font-serif text-lg font-semibold">{arch.founder}</p>
            <p className="font-sans text-xs text-muted-foreground">{arch.founderTitle} · {arch.ownership}</p>
          </div>
        </CardContent>
      </Card>

      {/* Three entities */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Holding Group */}
        <Card className="border-gold/15 glass-gold">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gold" />
              <CardTitle className="font-serif text-base">AURIENTA Holding Group</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2 font-sans text-[11px] text-muted-foreground">Holding Company (non-operating)</p>
            <p className="mb-3 font-sans text-xs text-muted-foreground">Owns all subsidiaries, IP, trademarks, patents, investments, and licenses.</p>
            <div className="flex flex-wrap gap-1.5">
              {arch.entities.holding.responsibilities.slice(0, 6).map(r => (
                <Badge key={r} variant="outline" className="border-gold/20 font-mono text-[11px]">{r}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Operations */}
        <Card className="border-gold/15 glass-gold">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gold" />
              <CardTitle className="font-serif text-base">AURIENTA Operations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2 font-sans text-[11px] text-muted-foreground">Operating Company (Technology + Operations combined)</p>
            <p className="mb-3 font-sans text-xs text-muted-foreground">Engineering, Brain AI, CRE, infrastructure, operations, regional companies.</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="border-gold/20 font-mono text-[11px]">CRE</Badge>
              <Badge variant="outline" className="border-gold/20 font-mono text-[11px]">Brain AI</Badge>
              <Badge variant="outline" className="border-gold/20 font-mono text-[11px]">Engineering</Badge>
              <Badge variant="outline" className="border-gold/20 font-mono text-[11px]">Cloud</Badge>
              <Badge variant="outline" className="border-gold/20 font-mono text-[11px]">DevOps</Badge>
              <Badge variant="outline" className="border-gold/20 font-mono text-[11px]">Regional: Egypt, GCC, Africa, Europe, Asia, Americas</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Advisory */}
        <Card className="border-gold/15 glass-gold">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-gold" />
              <CardTitle className="font-serif text-base">AURIENTA Advisory</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2 font-sans text-[11px] text-muted-foreground">Advisory Company (institutional ecosystem)</p>
            <p className="mb-3 font-sans text-xs text-muted-foreground">Partnerships, certification, professional network. Never develops software.</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="border-gold/20 font-mono text-[11px]">Law Firms</Badge>
              <Badge variant="outline" className="border-gold/20 font-mono text-[11px]">Accounting Firms</Badge>
              <Badge variant="outline" className="border-gold/20 font-mono text-[11px]">Banks</Badge>
              <Badge variant="outline" className="border-gold/20 font-mono text-[11px]">Universities</Badge>
              <Badge variant="outline" className="border-gold/20 font-mono text-[11px]">Big Four</Badge>
              <Badge variant="outline" className="border-gold/20 font-mono text-[11px]">Certification</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scalability Principle */}
      <Card className="mt-6 border-gold/15 glass-gold">
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-gold" />
            <CardTitle className="font-serif text-base">Constitutional Scalability Principle</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-sans text-xs leading-relaxed text-muted-foreground">{arch.scalabilityPrinciple.text}</p>
        </CardContent>
      </Card>

      {/* RACI Matrix */}
      <Card className="mt-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="font-serif text-base">RACI Responsibility Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-gold/10">
                  <th className="pb-2 pr-4 font-medium">Responsibility</th>
                  <th className="pb-2 px-2 font-medium text-center">Holding</th>
                  <th className="pb-2 px-2 font-medium text-center">Operations</th>
                  <th className="pb-2 px-2 font-medium text-center">Advisory</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(RACI_MATRIX).map(([key, val]) => (
                  <tr key={key} className="border-b border-gold/5">
                    <td className="py-1.5 pr-4 text-muted-foreground">{key}</td>
                    <td className="py-1.5 px-2 text-center font-mono text-[11px]">{val.holding}</td>
                    <td className="py-1.5 px-2 text-center font-mono text-[11px]">{val.operations}</td>
                    <td className="py-1.5 px-2 text-center font-mono text-[11px]">{val.advisory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-sans text-[11px] text-muted-foreground">R = Responsible · A = Accountable · C = Consulted · I = Informed</p>
        </CardContent>
      </Card>
    </div>
  );
}
