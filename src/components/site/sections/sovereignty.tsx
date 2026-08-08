import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { GoldStar } from "@/components/aurienta-logo";
import { Sprout, TrendingUp, Building2, Crown } from "lucide-react";

const STAGES = [
  {
    n: "Stage 1",
    icon: Sprout,
    title: "Protected Formation",
    duration: "0–12 months",
    role: "Full CRE enforcement",
    body: "Every action validated against constitutional rules. The enterprise is formed, Capital Formation closes, and milestones release from the Law Firm Client Account under dual signature.",
  },
  {
    n: "Stage 2",
    icon: TrendingUp,
    title: "Structured Growth",
    duration: "12–24 months",
    role: "Alerting only",
    body: "Triggered automatically once governance score ≥ 70. The CRE moves from blocking to alerting — the enterprise demonstrates self-discipline while oversight remains.",
  },
  {
    n: "Stage 3",
    icon: Building2,
    title: "Institutional Independence",
    duration: "24–36 months",
    role: "Read-only auditor",
    body: "Requires score ≥ 90, four profitable quarters, a clean audit, 100% social-insurance compliance, and valid police clearance. The CRE observes without intervening.",
  },
  {
    n: "Stage 4",
    icon: Crown,
    title: "Sovereign Enterprise",
    duration: "Graduated",
    role: "No Constitutional Infrastructure role",
    body: "A 75% Constitutional Partner vote graduates the enterprise. The AURIENTA board seat resigns, fees cease, and the full ledger exports. The enterprise may run its own CRE instance — forever independent.",
  },
];

const ALUMNI = [
  { name: "Street Bites", tier: "A → F", note: "Food stall to EGX-listed JSC · 6 years" },
  { name: "EcoPack Solutions", tier: "B → Sovereign", note: "Sustainable packaging · 4 years" },
  { name: "SmartFarm Egypt", tier: "C → F", note: "Agritech · EGX IPO" },
  { name: "Nile Brew Café", tier: "D → Sovereign", note: "Café chain · self-hosted CRE" },
];

export function Sovereignty() {
  return (
    <section id="sovereignty" className="relative overflow-hidden py-28 sm:py-36">
      <div className="absolute inset-0 -z-10 aurienta-radial opacity-40" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Graduation & Sovereignty"
          title={
            <>
              Dependency is transitional.
              <br />
              <span className="text-gold-gradient">Sovereignty is the destination.</span>
            </>
          }
          description="A successful constitutional launchpad makes itself unnecessary. AURIENTA exists to create sovereign enterprises that no longer require its infrastructure. Graduation is not an exit — it is the climax of the journey."
        />

        {/* stages */}
        <div className="mt-16 grid gap-5 lg:grid-cols-4">
          {STAGES.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="group relative h-full overflow-hidden rounded-2xl glass p-6 transition-all duration-500 hover:border-gold/30">
                <div className="absolute right-4 top-4 font-serif text-5xl font-semibold text-gold/10">
                  0{i + 1}
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                  <s.icon className="h-5 w-5 text-gold" />
                </div>
                <span className="mt-5 block font-mono text-xs uppercase tracking-wider text-gold/60">
                  {s.n} · {s.duration}
                </span>
                <h3 className="mt-1.5 font-serif text-xl font-semibold">{s.title}</h3>
                <span className="mt-1 block font-sans text-xs font-medium text-gold-light/80">
                  {s.role}
                </span>
                <p className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
                {i < STAGES.length - 1 && (
                  <div className="mt-5 hidden h-px w-full bg-gradient-to-r from-gold/30 to-transparent lg:block" />
                )}
              </div>
            </Reveal>
          ))}
        </div>

        {/* readiness + alumni */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <div className="h-full rounded-2xl border border-gold/12 bg-gradient-to-br from-gold/[0.05] to-transparent p-8">
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/80">
                Graduation Readiness Score
              </span>
              <div className="mt-4 flex items-end gap-4">
                <span className="font-serif text-6xl font-semibold text-gold-gradient">94</span>
                <span className="mb-2 font-sans text-sm text-muted-foreground">/ 100 · eligible to call vote</span>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { label: "Governance maturity", val: 98, w: "30%" },
                  { label: "Financial stability", val: 91, w: "25%" },
                  { label: "Operational independence", val: 89, w: "20%" },
                  { label: "Compliance history", val: 100, w: "15%" },
                  { label: "Platform dependency reduction", val: 78, w: "10%" },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex items-center justify-between font-sans text-xs">
                      <span className="text-muted-foreground">{r.label} <span className="text-muted-foreground/75">({r.w})</span></span>
                      <span className="font-mono text-gold/80">{r.val}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gold/10">
                      <div
                        className="h-full rounded-full bg-gold-gradient"
                        style={{ width: `${r.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 font-sans text-xs text-muted-foreground">
                Vote requires 75% supermajority · 30-day cooling · 14-day voting · 51% quorum.
                The enterprise exports its full ledger and may self-host CRE in 4–8 hours.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-2xl border border-gold/12 bg-background/40 p-8">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-gold" />
                <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/80">
                  Alumni Hall
                </span>
              </div>
              <h3 className="mt-3 font-serif text-2xl font-semibold">Graduated sovereigns</h3>
              <p className="mt-2 font-sans text-sm text-muted-foreground">
                A public, read-only directory of enterprises that outgrew the Constitutional Infrastructure —
                with compliance badges and final health ratings.
              </p>
              <ul className="mt-6 space-y-3">
                {ALUMNI.map((a) => (
                  <li
                    key={a.name}
                    className="flex items-center justify-between rounded-xl border border-gold/10 bg-background/40 px-4 py-3"
                  >
                    <div>
                      <p className="font-serif text-base font-semibold">{a.name}</p>
                      <p className="font-sans text-xs text-muted-foreground">{a.note}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-gold/20 bg-gold/5 px-2.5 py-1 font-mono text-xs text-gold-light/80">
                        {a.tier}
                      </span>
                      <GoldStar className="h-3.5 w-3.5" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
