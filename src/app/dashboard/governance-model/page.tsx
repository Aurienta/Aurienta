import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { GOVERNANCE_MANUAL, DELEGATION_OF_AUTHORITY, COMMITTEES, CONSTITUTIONAL_COUNCIL, RISK_REGISTER, INTERNAL_CONTROLS, OPERATING_RHYTHM, CORPORATE_KPIS, CHANGE_MANAGEMENT, GOVERNANCE_VERSION } from "@/lib/aurienta/institutional-governance";
import { INSTITUTIONAL_ARCHITECTURE, RACI_MATRIX } from "@/lib/aurienta/institutional-architecture";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Users, Shield, AlertTriangle, Calendar, BarChart3, GitBranch, Crown, Scale, Lock } from "lucide-react";

export const metadata = { title: "Institutional Governance · AURIENTA" };
export const dynamic = "force-dynamic";

export default async function GovernancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/governance-model");

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            Institutional Governance System — Constitution v{GOVERNANCE_VERSION}
          </span>
          <Badge variant="outline" className="border-gold/30 bg-gold/10 font-mono text-[11px] text-gold-light">
            <Lock className="mr-1 h-3 w-3" /> FROZEN
          </Badge>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Corporate Governance Manual</h1>
        <p className="font-sans text-sm text-muted-foreground">
          The complete institutional governance system — decision hierarchy, delegation, committees, risk, controls, and operating rhythm.
        </p>
      </header>

      {/* Mission/Vision/Purpose */}
      <Card className="mb-6 border-gold/15 glass-gold">
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div><p className="font-mono text-[11px] uppercase text-muted-foreground">Mission</p><p className="mt-1 font-sans text-xs">{GOVERNANCE_MANUAL.mission}</p></div>
            <div><p className="font-mono text-[11px] uppercase text-muted-foreground">Vision</p><p className="mt-1 font-sans text-xs">{GOVERNANCE_MANUAL.vision}</p></div>
            <div><p className="font-mono text-[11px] uppercase text-muted-foreground">Purpose</p><p className="mt-1 font-sans text-xs">{GOVERNANCE_MANUAL.purpose}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Governing Principles */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Shield className="h-4 w-4 text-gold" /> Governing Principles</CardTitle></CardHeader>
        <CardContent><ul className="grid gap-1.5 sm:grid-cols-2">{GOVERNANCE_MANUAL.governingPrinciples.map((p, i) => <li key={i} className="flex items-start gap-2 font-sans text-xs"><span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-gold" /><span>{p}</span></li>)}</ul></CardContent>
      </Card>

      {/* Decision Hierarchy */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Crown className="h-4 w-4 text-gold" /> Decision Hierarchy</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead><tr className="border-b border-gold/10"><th className="pb-2 pr-4 font-medium">Level</th><th className="pb-2 pr-4 font-medium">Authority</th><th className="pb-2 font-medium">Override</th></tr></thead>
              <tbody>{GOVERNANCE_MANUAL.decisionHierarchy.map(d => <tr key={d.level} className="border-b border-gold/5"><td className="py-1.5 pr-4 font-mono text-gold-light">{d.level}</td><td className="py-1.5 pr-4">{d.authority}</td><td className="py-1.5 text-muted-foreground">{d.override}</td></tr>)}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Committees */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Users className="h-4 w-4 text-gold" /> Executive Committees (11)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COMMITTEES.map(c => (
              <div key={c.name} className="rounded-lg border border-gold/10 bg-background/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-medium text-foreground">{c.name}</span>
                  {c.activeNow ? <Badge variant="outline" className="border-emerald-400/30 font-mono text-[11px] text-emerald-300">Active</Badge> : <Badge variant="outline" className="border-gold/20 font-mono text-[11px] text-muted-foreground">Future</Badge>}
                </div>
                <p className="mt-1 font-sans text-[11px] text-muted-foreground">{c.purpose}</p>
                <p className="mt-1 font-mono text-[11px] text-gold-light">Chair: {c.chair}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{c.meetingFrequency}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Constitutional Council */}
      <Card className="mb-6 border-gold/15 glass-gold">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Scale className="h-4 w-4 text-gold" /> Constitutional Council (Future)</CardTitle></CardHeader>
        <CardContent>
          <Badge variant="outline" className="border-gold/20 font-mono text-[11px] text-gold-light mb-3">{CONSTITUTIONAL_COUNCIL.status}</Badge>
          <p className="mb-2 font-sans text-xs text-muted-foreground"><strong>Activation:</strong> {CONSTITUTIONAL_COUNCIL.activationTrigger}</p>
          <p className="mb-2 font-sans text-xs text-muted-foreground"><strong>Membership:</strong> {CONSTITUTIONAL_COUNCIL.membership.size} members — {CONSTITUTIONAL_COUNCIL.membership.composition}</p>
          <div className="flex flex-wrap gap-1.5">{CONSTITUTIONAL_COUNCIL.responsibilities.map((r, i) => <Badge key={i} variant="outline" className="border-gold/15 font-mono text-[11px]">{r}</Badge>)}</div>
        </CardContent>
      </Card>

      {/* Risk Register */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><AlertTriangle className="h-4 w-4 text-gold" /> Enterprise Risk Register (13 risks)</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead><tr className="border-b border-gold/10"><th className="pb-2 pr-4 font-medium">Risk</th><th className="pb-2 px-2 font-medium">L</th><th className="pb-2 px-2 font-medium">I</th><th className="pb-2 px-2 font-medium">Owner</th></tr></thead>
              <tbody>{RISK_REGISTER.map((r, i) => <tr key={i} className="border-b border-gold/5"><td className="py-1.5 pr-4">{r.risk}</td><td className="py-1.5 px-2 font-mono text-[11px]">{r.likelihood}</td><td className="py-1.5 px-2 font-mono text-[11px]">{r.impact}</td><td className="py-1.5 px-2 text-muted-foreground">{r.owner}</td></tr>)}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Corporate KPIs */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><BarChart3 className="h-4 w-4 text-gold" /> Corporate KPIs (14)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">{CORPORATE_KPIS.map((k, i) => <div key={i} className="rounded border border-gold/8 bg-background/30 p-2"><p className="font-sans text-xs font-medium text-foreground">{k.kpi}</p><p className="font-mono text-[11px] text-gold-light">{k.target}</p></div>)}</div>
        </CardContent>
      </Card>

      {/* Change Management */}
      <Card className="mb-6 border-gold/15 glass-gold">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><GitBranch className="h-4 w-4 text-gold" /> Change Management — Constitution v{CHANGE_MANAGEMENT.version}</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 font-sans text-xs text-muted-foreground">{CHANGE_MANAGEMENT.principle}</p>
          <ol className="flex flex-col gap-1">{CHANGE_MANAGEMENT.process.map((step, i) => <li key={i} className="font-sans text-[11px] text-muted-foreground">{step}</li>)}</ol>
        </CardContent>
      </Card>
    </div>
  );
}
