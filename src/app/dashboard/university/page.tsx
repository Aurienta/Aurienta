import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, FlaskConical, FileText, Award, Building2, BookOpen } from "lucide-react";

export const metadata = { title: "University Representative Console · AURIENTA" };
export const dynamic = "force-dynamic";

export default async function UniversityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/university");
  // RBAC: only University Representatives may view the Tier E governance
  // console. Any other authenticated user is bounced to their own dashboard.
  const hasRole = user.memberships.some((m) => m.role === "university_rep");
  if (!hasRole) redirect("/dashboard");

  // Tier E (University SPV) enterprises — these are research spinouts.
  const tierEEnterprises = await db.enterprise.findMany({
    where: { tier: "E" },
    select: {
      id: true, name: true, slug: true, sector: true, description: true,
      fundraisingGoalEgp: true, raisedEgp: true, equityUnitPriceEgp: true, totalEquityUnits: true,
      status: true, stage: true, healthRating: true, healthScore: true,
      founderId: true, createdAt: true,
      founder: { select: { legalName: true, email: true } },
      milestones: { take: 3, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true, amountEgp: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Grants (simulated as capital participation goals for Tier E).
  const totalGrantCapital = tierEEnterprises.reduce((s, e) => s + e.fundraisingGoalEgp, 0);
  const totalRaised = tierEEnterprises.reduce((s, e) => s + e.raisedEgp, 0);

  // All alumni/graduated enterprises (research that made it to sovereignty).
  const alumni = await db.graduationRecord.findMany({
    where: { tierAtGraduation: "E" },
    take: 5,
    orderBy: { graduationDate: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            University Representative Console · Tier E SPV Governance
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">{user.legalName}</h1>
        <p className="font-sans text-sm text-muted-foreground">
          University research spinout governance · grant accounting · IP-assignment oversight · {tierEEnterprises.length} active Tier E enterprises
        </p>
      </header>

      {/* Summary cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={Building2} label="Tier E enterprises" value={tierEEnterprises.length} />
        <SummaryCard icon={FlaskConical} label="Total grant capital" value={`${totalGrantCapital.toLocaleString()} EGP`} />
        <SummaryCard icon={Award} label="Capital deployed" value={`${totalRaised.toLocaleString()} EGP`} />
        <SummaryCard icon={BookOpen} label="Graduated spinouts" value={alumni.length} />
      </div>

      {/* Tier E governance rules */}
      <Card className="mb-6 border-gold/15 glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <FileText className="h-4 w-4 text-gold" /> Tier E constitutional rules (University SPV)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <RuleCard
              title="Legal form"
              value="SPV (Special Purpose Vehicle)"
              desc="Tier E enterprises are structured as SPVs for university research spinouts, separating IP risk from the parent institution."
            />
            <RuleCard
              title="Max raise"
              value="5,000,000 EGP"
              desc="Capped at 5M EGP to keep university spinouts focused and manageable. Larger raises require migration to Tier C."
            />
            <RuleCard
              title="Service fee"
              value="1% (reduced)"
              desc="University spinouts pay a reduced 1% platform service fee (no consulting fee) — educational support doctrine."
            />
            <RuleCard
              title="Founder equity"
              value="0% (grant model)"
              desc="No founder equity grant — the university retains IP ownership. Capital partners receive equity units; the researcher is compensated via salary + milestone bonuses."
            />
            <RuleCard
              title="University endorsement"
              value="Required"
              desc="Every Tier E enterprise must have a signed university endorsement letter (verified by the law firm) before the feasibility assessment runs."
            />
            <RuleCard
              title="IP assignment"
              value="University → SPV license"
              desc="The university grants the SPV an exclusive license to commercialize the IP. Revenue share (typically 10-20%) flows back to the university."
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Tier E enterprises */}
      <h2 className="mb-3 font-serif text-xl font-semibold">Active research spinouts</h2>
      {tierEEnterprises.length === 0 ? (
        <Card className="border-gold/12 glass-gold">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <FlaskConical className="h-10 w-10 text-gold/40" />
            <p className="font-serif text-lg font-semibold">No active Tier E enterprises</p>
            <p className="font-sans text-sm text-muted-foreground max-w-md">
              There are no university research spinouts currently on the constitutional infrastructure. When a researcher
              submits a Tier E proposal, it will appear here after passing the feasibility assessment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tierEEnterprises.map((ent) => (
            <Card key={ent.id} className="border-gold/12 glass-gold">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-serif text-lg">{ent.name}</CardTitle>
                    <p className="mt-1 font-sans text-xs text-muted-foreground">
                      Founded by {ent.founder.legalName} · {ent.sector} · {new Date(ent.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-gold/25 bg-gold/5 font-mono text-[11px] text-gold-light">
                      Tier E · SPV
                    </Badge>
                    <Badge variant="outline" className="border-gold/15 font-mono text-[11px]">
                      {ent.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-sans text-sm text-muted-foreground line-clamp-2">{ent.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Grant goal" value={`${ent.fundraisingGoalEgp.toLocaleString()} EGP`} />
                  <Stat label="Capital Participated" value={`${ent.raisedEgp.toLocaleString()} EGP`} />
                  <Stat label="Health" value={`${ent.healthRating ?? "—"} (${ent.healthScore})`} />
                  <Stat label="Stage" value={ent.stage} />
                </div>
                {ent.milestones.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 font-sans text-[11px] uppercase tracking-wider text-muted-foreground">Recent milestones</p>
                    <div className="flex flex-col gap-1.5">
                      {ent.milestones.map((m) => (
                        <div key={m.id} className="flex items-center justify-between rounded border border-gold/8 bg-background/30 px-2.5 py-1.5">
                          <span className="font-sans text-xs text-foreground">{m.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gold-light">{m.amountEgp.toLocaleString()} EGP</span>
                            <Badge variant="outline" className="border-gold/15 font-mono text-xs">{m.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Alumni (graduated spinouts) */}
      {alumni.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 font-serif text-xl font-semibold">Graduated spinouts</h2>
          <Card className="border-gold/12 glass-gold">
            <CardContent className="flex flex-col gap-2 p-4">
              {alumni.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded border border-gold/8 bg-background/30 px-3 py-2">
                  <div>
                    <p className="font-sans text-sm font-medium text-foreground">{a.enterpriseName}</p>
                    <p className="font-sans text-[11px] text-muted-foreground">Graduated from Tier {a.tierAtGraduation} · readiness {a.readinessScore}/100</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-300 font-mono text-[11px]">
                    Sovereign
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <Card className="border-gold/12 bg-background/40">
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-5 w-5 text-gold/70" />
        <div>
          <p className="font-serif text-xl font-semibold text-foreground">{value}</p>
          <p className="font-sans text-[11px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RuleCard({ title, value, desc }: { title: string; value: string; desc: string }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-background/40 p-3">
      <p className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-0.5 font-serif text-base font-semibold text-gold-light">{value}</p>
      <p className="mt-1 font-sans text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-gold/8 bg-background/30 p-2">
      <p className="font-mono text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-sans text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}
