import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  GLS_VERSION, GLS_FROZEN_AT,
  COUNTRY_READINESS_DIMENSIONS, GLOBAL_EXPANSION_SEQUENCE,
  STRATEGIC_PARTNER_TYPES, PARTNERSHIP_LIFECYCLE,
  GOVERNMENT_STAKEHOLDERS, GOV_ENGAGEMENT_PLAYBOOK_TEMPLATE,
  INSTITUTIONAL_SALES, INSTITUTIONAL_SALES_STAGES,
  EXPANSION_OFFICE, ALLIANCE_INSTRUMENTS,
  INSTITUTIONAL_COMMS, MESSAGING_HIERARCHY,
  GLOBAL_EVENTS, CERTIFICATION_ROADMAP,
  DD_CENTER, TRUST_CENTER, GLOBAL_DEPLOYMENT_DASHBOARD,
  COO_RECOMMENDATIONS_GL, EXECUTIVE_CERTIFICATION_GLS, GLS_SYNCHRONIZATION,
} from "@/lib/aurienta/global-launch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe, Handshake, Landmark, Briefcase, Network, GitMerge,
  MessageSquare, CalendarDays, Award, FileSearch, ShieldCheck,
  Crosshair, Trophy, Map, CheckCircle2, Rocket, TrendingUp,
} from "lucide-react";

export const metadata = { title: "Global Launch · AURIENTA" };
export const dynamic = "force-dynamic";

const scoreColor = (s: number) =>
  s >= 75 ? "text-emerald-300" : s >= 65 ? "text-amber-300" : "text-rose-300";
const priorityColor = (p: string) =>
  p === "P0" ? "text-rose-300" : p === "P1" ? "text-amber-300" : p === "P2" ? "text-sky-300" : "text-muted-foreground";

export default async function GlobalLaunchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/global-launch");

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            Global Institutional Launch & Strategic Partnership System · GLS v{GLS_VERSION} · Frozen {GLS_FROZEN_AT} · Globally Deployable
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Global Launch System</h1>
        <p className="font-sans text-sm text-muted-foreground">
          {GLOBAL_EXPANSION_SEQUENCE.length} countries · {STRATEGIC_PARTNER_TYPES.length} partner types · {GOVERNMENT_STAKEHOLDERS.length} government stakeholders · {INSTITUTIONAL_SALES.length} sales segments · {EXPANSION_OFFICE.length} expansion roles · {ALLIANCE_INSTRUMENTS.length} alliance instruments · {CERTIFICATION_ROADMAP.length} certifications · {DD_CENTER.length} DD packages · {TRUST_CENTER.length} trust pillars · {COO_RECOMMENDATIONS_GL.length} COO recommendations
        </p>
      </header>

      {/* Executive Certification banner */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-gold" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{EXECUTIVE_CERTIFICATION_GLS.title}</p>
                <p className="font-serif text-xl font-semibold text-gold-gradient">{EXECUTIVE_CERTIFICATION_GLS.verdict}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-2xl font-semibold text-gold">{GLOBAL_EXPANSION_SEQUENCE.length}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Countries</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-2xl font-semibold text-gold">{STRATEGIC_PARTNER_TYPES.length}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Partner types</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-2xl font-semibold text-gold">{CERTIFICATION_ROADMAP.length}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Certifications</p>
              </div>
            </div>
          </div>
          <p className="mt-3 font-sans text-sm italic text-gold-gradient">{EXECUTIVE_CERTIFICATION_GLS.conclusion}</p>
        </CardContent>
      </Card>

      {/* Part 1 — Global Market Entry (country readiness + sequence) */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Map className="h-4 w-4 text-gold" /> Part 1 · Global Market Entry ({GLOBAL_EXPANSION_SEQUENCE.length} countries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 font-mono text-[10px] uppercase text-gold-light">Country Readiness Dimensions ({COUNTRY_READINESS_DIMENSIONS.length})</p>
          <div className="mb-3 flex flex-wrap gap-1">
            {COUNTRY_READINESS_DIMENSIONS.map(d => (
              <Badge key={d.dimension} variant="outline" className="border-gold/15 font-mono text-[10px]">{d.dimension} (w{d.weight})</Badge>
            ))}
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-gold/15">
                  <th className="pb-2 pr-2 font-medium">#</th><th className="pb-2 pr-2 font-medium">Region</th>
                  <th className="pb-2 pr-2 font-medium">Country</th><th className="pb-2 pr-2 font-medium">Score</th>
                  <th className="pb-2 pr-2 font-medium">Trigger</th><th className="pb-2 font-medium">Timeline</th>
                </tr>
              </thead>
              <tbody>
                {GLOBAL_EXPANSION_SEQUENCE.map(c => (
                  <tr key={c.rank} className="border-b border-gold/5">
                    <td className="py-1.5 pr-2 font-mono text-gold-light">{c.rank}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{c.region}</td>
                    <td className="py-1.5 pr-2 font-medium">{c.country}</td>
                    <td className={`py-1.5 pr-2 font-mono ${scoreColor(c.readinessScore)}`}>{c.readinessScore}</td>
                    <td className="py-1.5 pr-2 font-mono text-[10px] text-muted-foreground">{c.activationTrigger}</td>
                    <td className="py-1.5 font-mono text-[10px] text-gold-light">{c.timeline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Part 2 — Partnership OS + Part 3 — Government Engagement */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Handshake className="h-4 w-4 text-gold" /> Part 2 · Strategic Partnership OS ({STRATEGIC_PARTNER_TYPES.length} types)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {STRATEGIC_PARTNER_TYPES.map(p => (
                <div key={p.typeId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{p.partnerType}</span>
                    <span className={`font-mono text-[10px] ${priorityColor(p.priority)}`}>{p.priority}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{p.valueProposition}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">Lifecycle ({PARTNERSHIP_LIFECYCLE.length} stages)</p>
            <p className="font-sans text-[10px] text-muted-foreground">{PARTNERSHIP_LIFECYCLE.map(s => s.stage).join(" → ")}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Landmark className="h-4 w-4 text-gold" /> Part 3 · Government Engagement ({GOVERNMENT_STAKEHOLDERS.length} stakeholders)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {GOVERNMENT_STAKEHOLDERS.map(g => (
                <div key={g.stakeholderId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{g.stakeholder}</span>
                    <span className="font-mono text-[10px] text-gold-light">{g.cadence}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{g.engagementObjective}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground"><span className="text-gold-light">Principle:</span> {GOV_ENGAGEMENT_PLAYBOOK_TEMPLATE.principle}</p>
          </CardContent>
        </Card>
      </div>

      {/* Part 4 — Institutional Sales + Part 5 — Expansion Office */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Briefcase className="h-4 w-4 text-gold" /> Part 4 · Institutional Sales ({INSTITUTIONAL_SALES.length} segments)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {INSTITUTIONAL_SALES.map(s => (
                <div key={s.segmentId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{s.segment}</span>
                    <span className="font-mono text-[10px] text-gold-light">{s.cycle}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">Buyer: {s.buyer}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">Sales Stages ({INSTITUTIONAL_SALES_STAGES.length})</p>
            <p className="font-sans text-[10px] text-muted-foreground">{INSTITUTIONAL_SALES_STAGES.join(" → ")}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Network className="h-4 w-4 text-gold" /> Part 5 · Expansion Office ({EXPANSION_OFFICE.length} roles)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {EXPANSION_OFFICE.map(r => (
                <div key={r.roleId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{r.role}</span>
                    <span className="font-mono text-[10px] text-gold-light">{r.activatesAt}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">Reports: {r.reportsTo}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Part 6 — Alliances + Part 7 — Comms */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><GitMerge className="h-4 w-4 text-gold" /> Part 6 · Alliance Management ({ALLIANCE_INSTRUMENTS.length} instruments)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {ALLIANCE_INSTRUMENTS.map(a => (
                <div key={a.instrumentId} className="border-b border-gold/5 py-1">
                  <span className="font-sans text-[11px] font-medium">{a.instrument}</span>
                  <p className="font-sans text-[10px] text-muted-foreground">{a.purpose}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><MessageSquare className="h-4 w-4 text-gold" /> Part 7 · Institutional Communications ({INSTITUTIONAL_COMMS.length} tracks)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto">
              {INSTITUTIONAL_COMMS.map(c => (
                <div key={c.trackId} className="border-b border-gold/5 py-1">
                  <span className="font-sans text-[11px] font-medium">{c.track}</span>
                  <p className="font-sans text-[10px] text-muted-foreground">{c.audience}: {c.principle}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">Messaging Hierarchy ({MESSAGING_HIERARCHY.length} tiers)</p>
            <div className="max-h-24 overflow-y-auto">
              {MESSAGING_HIERARCHY.map((m, i) => <p key={i} className="font-sans text-[10px] text-muted-foreground">• {m}</p>)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Part 8 — Events + Part 9 — Certifications */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><CalendarDays className="h-4 w-4 text-gold" /> Part 8 · Global Events ({GLOBAL_EVENTS.length} types)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {GLOBAL_EVENTS.map(e => (
                <div key={e.eventId} className="border-b border-gold/5 py-1">
                  <span className="font-sans text-[11px] font-medium">{e.eventType}</span>
                  <p className="font-sans text-[10px] text-muted-foreground">{e.strategy}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Award className="h-4 w-4 text-gold" /> Part 9 · International Certifications ({CERTIFICATION_ROADMAP.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {CERTIFICATION_ROADMAP.map(c => (
                <div key={c.certId} className="flex items-center justify-between border-b border-gold/5 py-1">
                  <div>
                    <span className="font-sans text-[11px] font-medium">{c.certification}</span>
                    <p className="font-sans text-[10px] text-muted-foreground">{c.dependencies}</p>
                  </div>
                  <span className="font-mono text-[10px] text-gold">{c.target}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Part 10 — DD Center + Part 11 — Trust Center */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><FileSearch className="h-4 w-4 text-gold" /> Part 10 · Due Diligence Center ({DD_CENTER.length} packages)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {DD_CENTER.map(d => (
                <div key={d.ddId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{d.package}</span>
                    <Badge variant="outline" className={`font-mono text-[10px] ${d.access === "Public" ? "border-emerald-400/30 text-emerald-300" : d.access === "Restricted" ? "border-amber-400/30 text-amber-300" : "border-rose-400/30 text-rose-300"}`}>{d.access}</Badge>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{d.audience}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><ShieldCheck className="h-4 w-4 text-gold" /> Part 11 · Institutional Trust Center ({TRUST_CENTER.length} pillars)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {TRUST_CENTER.map(t => (
                <div key={t.pillarId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{t.pillar}</span>
                    <Badge variant="outline" className={`font-mono text-[10px] ${t.access === "Public" ? "border-emerald-400/30 text-emerald-300" : "border-amber-400/30 text-amber-300"}`}>{t.access}</Badge>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{t.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Part 12 — Global Deployment Dashboard + COO Recommendations */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Crosshair className="h-4 w-4 text-gold" /> Part 12 · Global Deployment Dashboard</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground">{GLOBAL_DEPLOYMENT_DASHBOARD.purpose}</p>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {GLOBAL_DEPLOYMENT_DASHBOARD.panels.map(p => (
                <div key={p} className="rounded border border-gold/8 bg-background/30 p-1.5">
                  <p className="font-sans text-[10px]">{p}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Refresh:</span> {GLOBAL_DEPLOYMENT_DASHBOARD.refresh}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><TrendingUp className="h-4 w-4 text-gold" /> COO Recommendations ({COO_RECOMMENDATIONS_GL.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {COO_RECOMMENDATIONS_GL.map(r => (
                <div key={r.recId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{r.name}</span>
                    <span className="font-mono text-[10px] text-gold-light">{r.recId}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{r.scope}</p>
                  <p className="font-sans text-[10px] text-muted-foreground">Owner: {r.owner}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Certification full */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" />
            <p className="font-serif text-lg font-semibold text-gold-gradient">{EXECUTIVE_CERTIFICATION_GLS.title}</p>
          </div>
          <p className="mt-2 font-sans text-sm text-muted-foreground">{EXECUTIVE_CERTIFICATION_GLS.statement}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {EXECUTIVE_CERTIFICATION_GLS.criteria.map(c => (
              <div key={c} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-sans text-[11px]"><CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-300" />{c}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 font-serif text-sm italic text-gold-gradient">{EXECUTIVE_CERTIFICATION_GLS.conclusion}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-gold/30 font-mono text-xs text-gold">{EXECUTIVE_CERTIFICATION_GLS.verdict}</Badge>
            <span className="font-mono text-[11px] text-muted-foreground">Certified by: {EXECUTIVE_CERTIFICATION_GLS.certifiedBy} · {EXECUTIVE_CERTIFICATION_GLS.certifiedAt}</span>
          </div>
        </CardContent>
      </Card>

      {/* Synchronization */}
      <Card className="border-gold/12 glass">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-gold" />
            <p className="font-serif text-base font-semibold text-gold-gradient">GLS v{GLS_VERSION} Synchronization</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(GLS_SYNCHRONIZATION).map(([k, v]) => (
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
