import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { ENTERPRISE_RISK_REGISTER, ENTERPRISE_CONTROLS, THREE_LINES_OF_DEFENSE, CYBERSECURITY_FRAMEWORK, COMPLIANCE_FRAMEWORK, BCP_DR, AI_GOVERNANCE, DATA_GOVERNANCE, CERTIFICATION_ROADMAP, MATURITY_MODEL, CONTINUOUS_READINESS, ADR_TEMPLATE } from "@/lib/aurienta/enterprise-risk-security";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Lock, Globe, Cpu, Database, GitBranch, Activity, Award } from "lucide-react";

export const metadata = { title: "Institutional Readiness · AURIENTA" };
export const dynamic = "force-dynamic";

export default async function ReadinessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/institutional-readiness");
  const cr = CONTINUOUS_READINESS;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">Enterprise Risk, Security, Compliance & Institutional Readiness</span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Institutional Readiness Assessment</h1>
        <p className="font-sans text-sm text-muted-foreground">28 risks · 30 controls · 3 lines of defense · 6 compliance frameworks · certification roadmap</p>
      </header>

      {/* Continuous Readiness Score */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase text-muted-foreground">Continuous Readiness Score</p>
              <p className="font-serif text-4xl font-semibold text-gold-gradient">{cr.overallScore}<span className="text-lg text-muted-foreground">/100</span></p>
              <p className="font-sans text-xs text-muted-foreground">Target: {cr.targetScore}/100 by Q4 2027</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {Object.entries(cr.subScores).map(([k, v]) => (
                <div key={k} className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                  <p className={`font-serif text-lg font-semibold ${v >= 70 ? "text-emerald-300" : v >= 50 ? "text-amber-300" : "text-rose-300"}`}>{v}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{k}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Register */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><AlertTriangle className="h-4 w-4 text-gold" /> Enterprise Risk Register ({ENTERPRISE_RISK_REGISTER.length} risks)</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead><tr className="border-b border-gold/10"><th className="pb-2 pr-3 font-medium">ID</th><th className="pb-2 pr-3 font-medium">Risk</th><th className="pb-2 px-2 font-medium">L</th><th className="pb-2 px-2 font-medium">I</th><th className="pb-2 px-2 font-medium">Residual</th><th className="pb-2 font-medium">Owner</th></tr></thead>
              <tbody>{ENTERPRISE_RISK_REGISTER.map(r => <tr key={r.id} className="border-b border-gold/5"><td className="py-1.5 pr-3 font-mono text-gold-light">{r.id}</td><td className="py-1.5 pr-3">{r.risk}</td><td className="py-1.5 px-2 font-mono text-[11px]">{r.likelihood}</td><td className="py-1.5 px-2 font-mono text-[11px]">{r.impact}</td><td className="py-1.5 px-2 font-mono text-[11px]">{r.residualRisk}</td><td className="py-1.5 text-muted-foreground">{r.owner}</td></tr>)}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Controls + Three Lines */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Lock className="h-4 w-4 text-gold" /> Enterprise Controls ({ENTERPRISE_CONTROLS.length})</CardTitle></CardHeader>
          <CardContent><div className="max-h-64 overflow-y-auto"><ul className="flex flex-col gap-1">{ENTERPRISE_CONTROLS.map(c => <li key={c.id} className="flex items-center gap-2 font-sans text-[11px]"><span className="font-mono text-gold-light">{c.id}</span><span className="text-muted-foreground">{c.control}</span><Badge variant="outline" className="border-gold/15 font-mono text-[10px]">{c.automation}</Badge></li>)}</ul></div></CardContent>
        </Card>
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Shield className="h-4 w-4 text-gold" /> Three Lines of Defense</CardTitle></CardHeader>
          <CardContent><div className="flex flex-col gap-3">{Object.values(THREE_LINES_OF_DEFENSE).map(line => <div key={line.name}><p className="font-sans text-xs font-medium text-foreground">{line.name}</p><p className="font-sans text-[11px] text-muted-foreground">{line.entities.join(", ")}</p></div>)}</div></CardContent>
        </Card>
      </div>

      {/* Compliance + Certification */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Globe className="h-4 w-4 text-gold" /> Compliance Frameworks ({COMPLIANCE_FRAMEWORK.length})</CardTitle></CardHeader>
          <CardContent>{COMPLIANCE_FRAMEWORK.map(c => <div key={c.framework} className="mb-2 border-b border-gold/5 pb-2"><div className="flex items-center justify-between"><span className="font-sans text-xs font-medium">{c.framework}</span><Badge variant="outline" className="border-gold/20 font-mono text-[11px]">{c.currentMaturity}→{c.targetMaturity}</Badge></div><p className="font-sans text-[11px] text-muted-foreground">Gap: {c.gap}</p></div>)}</CardContent>
        </Card>
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Award className="h-4 w-4 text-gold" /> Certification Roadmap</CardTitle></CardHeader>
          <CardContent>{CERTIFICATION_ROADMAP.map(c => <div key={c.certification} className="mb-2 flex items-center justify-between border-b border-gold/5 pb-2"><div><span className="font-sans text-xs font-medium">{c.certification}</span><p className="font-mono text-[11px] text-gold-light">{c.targetDate}</p></div><Badge variant="outline" className="border-gold/20 font-mono text-[11px]">L{c.currentMaturity}→L{c.targetMaturity}</Badge></div>)}</CardContent>
        </Card>
      </div>

      {/* Maturity Model */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Activity className="h-4 w-4 text-gold" /> Operational Maturity Model</CardTitle></CardHeader>
        <CardContent><div className="grid gap-2 sm:grid-cols-2">{MATURITY_MODEL.map(m => <div key={m.capability} className="rounded border border-gold/8 bg-background/30 p-2"><div className="flex items-center justify-between"><span className="font-sans text-xs font-medium">{m.capability}</span><Badge variant="outline" className="border-gold/20 font-mono text-[11px]">L{m.currentLevel}→L{m.targetLevel}</Badge></div></div>)}</div></CardContent>
      </Card>

      {/* ADRs */}
      <Card className="border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><GitBranch className="h-4 w-4 text-gold" /> Architecture Decision Records ({ADR_TEMPLATE.registry.length})</CardTitle></CardHeader>
        <CardContent><ul className="flex flex-col gap-1">{ADR_TEMPLATE.registry.map((adr, i) => <li key={i} className="font-mono text-[11px] text-muted-foreground">{adr}</li>)}</ul></CardContent>
      </Card>
    </div>
  );
}
