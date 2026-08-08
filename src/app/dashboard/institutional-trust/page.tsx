import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  ITDB_VERSION, ITDB_FROZEN_AT,
  DATA_ROOM, DOCUMENT_METADATA, BOARD_MANAGEMENT, BOARD_NOTE,
  DD_AUTOMATION, DD_AUTOMATION_PROPERTIES, TRUST_CLAIMS, EVIDENCE_ENGINE,
  EXECUTIVE_REPORTS, REPORTING_PROPERTIES, INSTITUTIONAL_SCORECARDS, INSTITUTIONAL_TRUST_INDEX,
  EXTERNAL_AUDIT_CENTER, AUDIT_TRACKING, ASSURANCE_FRAMEWORK,
  TRANSPARENCY_PORTAL, TRANSPARENCY_PRINCIPLE, BOARD_COMMAND_DASHBOARD,
  COO_RECOMMENDATIONS_IT, EXECUTIVE_CERTIFICATION_ITDB, COO_POST_ITDB_ROADMAP, ITDB_SYNCHRONIZATION,
} from "@/lib/aurienta/institutional-trust";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Archive, ClipboardList, FileSearch, ShieldCheck, FileText, BarChart3,
  Search, GitBranch, Globe, Crosshair, Trophy, CheckCircle2, Crown, TrendingUp,
} from "lucide-react";

export const metadata = { title: "Institutional Trust · AURIENTA" };
export const dynamic = "force-dynamic";

const scoreColor = (s: number) =>
  s >= 80 ? "text-emerald-300" : s >= 70 ? "text-amber-300" : "text-rose-300";
const riskColor = (r: string) =>
  r === "Low" ? "text-emerald-300" : r === "Medium" ? "text-amber-300" : "text-rose-300";
const trendIcon = (t: string) => t === "Up" ? "↑" : t === "Down" ? "↓" : "→";

export default async function InstitutionalTrustPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/institutional-trust");

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            Institutional Trust, Due Diligence & Board Readiness · ITDB v{ITDB_VERSION} · Frozen {ITDB_FROZEN_AT} · Final Platform-Management Phase
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Institutional Trust & Due Diligence</h1>
        <p className="font-sans text-sm text-muted-foreground">
          {DATA_ROOM.length} data room repositories · {BOARD_MANAGEMENT.length} board modules · {DD_AUTOMATION.length} DD audiences · {TRUST_CLAIMS.length} claim types · {EXECUTIVE_REPORTS.length} report types · {INSTITUTIONAL_SCORECARDS.length} scorecards · {EXTERNAL_AUDIT_CENTER.length} audit types · {ASSURANCE_FRAMEWORK.length} assurance capabilities · {TRANSPARENCY_PORTAL.length} transparency sections · {BOARD_COMMAND_DASHBOARD.length} board panels
        </p>
      </header>

      {/* Executive Certification + Trust Index */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-gold" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{EXECUTIVE_CERTIFICATION_ITDB.title}</p>
                <p className="font-serif text-xl font-semibold text-gold-gradient">{EXECUTIVE_CERTIFICATION_ITDB.verdict}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className={`font-serif text-3xl font-semibold ${scoreColor(INSTITUTIONAL_TRUST_INDEX)}`}>{INSTITUTIONAL_TRUST_INDEX}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Institutional Trust Index /100</p>
              </div>
            </div>
          </div>
          <p className="mt-3 font-sans text-sm italic text-gold-gradient">{EXECUTIVE_CERTIFICATION_ITDB.conclusion}</p>
        </CardContent>
      </Card>

      {/* Part 6 — Institutional Scorecards (early, high visibility) */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <BarChart3 className="h-4 w-4 text-gold" /> Part 6 · Institutional Scorecards ({INSTITUTIONAL_SCORECARDS.length} · Trust Index {INSTITUTIONAL_TRUST_INDEX}/100)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {INSTITUTIONAL_SCORECARDS.map(s => (
              <div key={s.scorecardId} className="rounded border border-gold/8 bg-background/30 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-medium">{s.dimension}</span>
                  <span className={`font-mono text-[10px] ${s.trend === "Up" ? "text-emerald-300" : s.trend === "Down" ? "text-rose-300" : "text-muted-foreground"}`}>{trendIcon(s.trend)}</span>
                </div>
                <p className={`mt-0.5 font-serif text-lg font-semibold ${scoreColor(s.score)}`}>{s.score}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background/50">
                  <div className={`h-full ${s.score >= 80 ? "bg-emerald-400" : s.score >= 70 ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${s.score}%` }} />
                </div>
                <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">{s.evidenceBase}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Part 10 — Board Command Dashboard */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Crosshair className="h-4 w-4 text-gold" /> Part 10 · Board & Founder Command Dashboard ({BOARD_COMMAND_DASHBOARD.length} panels)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {BOARD_COMMAND_DASHBOARD.map(p => (
              <div key={p.panelId} className="rounded border border-gold/10 bg-background/30 p-2">
                <p className="font-sans text-[11px] font-medium">{p.panel}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{p.source}</p>
                <p className="font-sans text-[10px] text-amber-300">Alert: {p.alertThreshold}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Part 1 — Data Room + Part 2 — Board Management */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Archive className="h-4 w-4 text-gold" /> Part 1 · Institutional Data Room ({DATA_ROOM.length} repositories)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {DATA_ROOM.map(r => (
                <div key={r.repoId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{r.repository}</span>
                    <Badge variant="outline" className={`font-mono text-[10px] ${r.classification === "Public" ? "border-emerald-400/30 text-emerald-300" : r.classification === "Internal" ? "border-sky-400/30 text-sky-300" : r.classification === "Confidential" ? "border-amber-400/30 text-amber-300" : "border-rose-400/30 text-rose-300"}`}>{r.classification}</Badge>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{r.owner} · {r.documentCount}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground"><span className="text-gold-light">Per document:</span> {DOCUMENT_METADATA.fields.join(", ")}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><ClipboardList className="h-4 w-4 text-gold" /> Part 2 · Board Management System ({BOARD_MANAGEMENT.length} modules)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {BOARD_MANAGEMENT.map(m => (
                <div key={m.moduleId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{m.module}</span>
                    <span className="font-mono text-[10px] text-gold-light">{m.cadence}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{m.purpose}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground"><span className="text-gold-light">Current:</span> {BOARD_NOTE.current}</p>
          </CardContent>
        </Card>
      </div>

      {/* Part 3 — DD Automation + Part 4 — Trust Evidence Engine */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><FileSearch className="h-4 w-4 text-gold" /> Part 3 · Due Diligence Automation ({DD_AUTOMATION.length} audiences)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {DD_AUTOMATION.map(d => (
                <div key={d.ddId} className="border-b border-gold/5 py-1">
                  <span className="font-sans text-[11px] font-medium">{d.audience}</span>
                  <p className="font-sans text-[10px] text-muted-foreground">Focus: {d.focus}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground"><span className="text-gold-light">Principle:</span> {DD_AUTOMATION_PROPERTIES.principle}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><ShieldCheck className="h-4 w-4 text-gold" /> Part 4 · Trust Evidence Engine ({TRUST_CLAIMS.length} claim types)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {TRUST_CLAIMS.map(c => (
                <div key={c.claimId} className="border-b border-gold/5 py-1">
                  <span className="font-sans text-[11px] font-medium">{c.claim}</span>
                  <p className="font-sans text-[10px] text-muted-foreground">Evidence: {c.evidenceSources}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground"><span className="text-gold-light">Principle:</span> {EVIDENCE_ENGINE.principle}</p>
          </CardContent>
        </Card>
      </div>

      {/* Part 5 — Executive Reporting + Part 7 — External Audit Center */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><FileText className="h-4 w-4 text-gold" /> Part 5 · Executive Reporting ({EXECUTIVE_REPORTS.length} types)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {EXECUTIVE_REPORTS.map(r => (
                <div key={r.reportId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{r.report}</span>
                    <span className="font-mono text-[10px] text-gold-light">{r.cadence}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{r.audience}: {r.contents}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground"><span className="text-gold-light">Brain AI:</span> {REPORTING_PROPERTIES.principle}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Search className="h-4 w-4 text-gold" /> Part 7 · External Audit Center ({EXTERNAL_AUDIT_CENTER.length} audit types)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {EXTERNAL_AUDIT_CENTER.map(a => (
                <div key={a.auditId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{a.auditType}</span>
                    <span className="font-mono text-[10px] text-gold-light">{a.frequency}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{a.currentStatus}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground"><span className="text-gold-light">Per finding:</span> {AUDIT_TRACKING.perFinding}</p>
          </CardContent>
        </Card>
      </div>

      {/* Part 8 — Enterprise Assurance + Part 9 — Transparency Portal */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><GitBranch className="h-4 w-4 text-gold" /> Part 8 · Enterprise Assurance ({ASSURANCE_FRAMEWORK.length} capabilities)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {ASSURANCE_FRAMEWORK.map(a => (
                <div key={a.capId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{a.capability}</span>
                    <span className="font-mono text-[10px]">
                      <span className={riskColor(a.residualRisk)}>{a.residualRisk}</span>
                      <span className="text-muted-foreground"> · L{a.maturity}</span>
                    </span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{a.owner} · {a.control} · {a.auditFrequency}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Globe className="h-4 w-4 text-gold" /> Part 9 · Institutional Transparency Portal ({TRANSPARENCY_PORTAL.length} sections)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {TRANSPARENCY_PORTAL.map(t => (
                <div key={t.sectionId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{t.section}</span>
                    <Badge variant="outline" className={`font-mono text-[10px] ${t.access === "Public" ? "border-emerald-400/30 text-emerald-300" : "border-amber-400/30 text-amber-300"}`}>{t.access}</Badge>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{t.content}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground"><span className="text-gold-light">Principle:</span> {TRANSPARENCY_PRINCIPLE.separation}</p>
          </CardContent>
        </Card>
      </div>

      {/* COO Recommendations */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><TrendingUp className="h-4 w-4 text-gold" /> COO Additional Recommendations ({COO_RECOMMENDATIONS_IT.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {COO_RECOMMENDATIONS_IT.map(r => (
              <div key={r.recId} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-sans text-[11px] font-medium"><span className="font-mono text-[10px] text-gold-light">{r.recId}</span> {r.name}</p>
                <p className="font-sans text-[10px] text-muted-foreground">{r.purpose}</p>
                <p className="font-sans text-[10px] text-muted-foreground">{r.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* COO Post-ITDB Roadmap */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Crown className="h-4 w-4 text-gold" /> COO Post-ITDB Roadmap (market execution — internal architecture complete)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {COO_POST_ITDB_ROADMAP.map(s => (
              <div key={s.step} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-sans text-[11px] font-medium"><span className="font-mono text-[10px] text-gold-light">{s.step}</span> {s.action}</p>
                <p className="font-sans text-[10px] text-muted-foreground">{s.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Executive Certification full */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" />
            <p className="font-serif text-lg font-semibold text-gold-gradient">{EXECUTIVE_CERTIFICATION_ITDB.title}</p>
          </div>
          <p className="mt-2 font-sans text-sm text-muted-foreground">{EXECUTIVE_CERTIFICATION_ITDB.statement}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {EXECUTIVE_CERTIFICATION_ITDB.criteria.map(c => (
              <div key={c} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-sans text-[11px]"><CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-300" />{c}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 font-serif text-sm italic text-gold-gradient">{EXECUTIVE_CERTIFICATION_ITDB.conclusion}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-gold/30 font-mono text-xs text-gold">{EXECUTIVE_CERTIFICATION_ITDB.verdict}</Badge>
            <span className="font-mono text-[11px] text-muted-foreground">Certified by: {EXECUTIVE_CERTIFICATION_ITDB.certifiedBy} · {EXECUTIVE_CERTIFICATION_ITDB.certifiedAt}</span>
          </div>
        </CardContent>
      </Card>

      {/* Synchronization */}
      <Card className="border-gold/12 glass">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <p className="font-serif text-base font-semibold text-gold-gradient">ITDB v{ITDB_VERSION} Synchronization</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(ITDB_SYNCHRONIZATION).map(([k, v]) => (
              <div key={k} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-mono text-[10px] uppercase text-gold-light">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                <p className="font-sans text-[11px] text-muted-foreground">{v}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
