import { Reveal } from "@/components/site/reveal";
import { GoldStar } from "@/components/aurienta-logo";
import { BookOpen, Scale, ShieldCheck } from "lucide-react";

const GUARANTEES = [
  {
    icon: ShieldCheck,
    title: "Money Protection",
    body: "Funds flow directly to a licensed law firm's Law Firm Client Account — never to AURIENTA. Failed transfers and unclaimed dividends are held in segregated trust, indefinitely.",
  },
  {
    icon: Scale,
    title: "Governance Integrity",
    body: "Every decision is validated by the Constitutional Runtime Engine — deterministic, fail-secure policy-as-code. No human, not even AURIENTA's Founding Operators, can override the rules.",
  },
  {
    icon: BookOpen,
    title: "Constitutional Continuity",
    body: "All state is derived from immutable, hash-chained events. The Oracle Mirror protocol preserves governance even after seven days of total platform downtime.",
  },
];

export function Constitution() {
  return (
    <section id="constitution" className="relative overflow-hidden py-28 sm:py-36">
      <div className="absolute inset-0 -z-10 aurienta-radial opacity-50" />
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Reveal className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/50" />
            <GoldStar className="h-4 w-4" />
            <span className="font-sans text-[11px] font-medium uppercase tracking-[0.26em] text-gold-light/80">
              The Constitutional Launchpad
            </span>
            <GoldStar className="h-4 w-4" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold/50" />
          </div>

          <blockquote className="mt-10 font-serif text-3xl font-medium leading-[1.2] sm:text-4xl lg:text-[2.9rem]">
            “Ownership without governance becomes speculation.
            <span className="text-gold-gradient"> Governance without enforcement becomes institutional theatre.</span>”
          </blockquote>

          <p className="mt-10 max-w-3xl font-sans text-base leading-relaxed text-muted-foreground sm:text-lg">
            AURIENTA is a noncustodial constitutional infrastructure of structural trust. It
            eliminates corporate friction through AI-enforced governance so partners can build,
            own, and scale real businesses until they graduate into sovereign independence. Not
            crowdfunding. Not speculation. Not platform dependency.
          </p>
        </Reveal>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {GUARANTEES.map((g, i) => (
            <Reveal key={g.title} delay={i * 0.1}>
              <div className="group relative h-full overflow-hidden rounded-2xl glass-gold p-7 transition-all duration-500 hover:gold-glow-sm">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold/5 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                    <g.icon className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-semibold">{g.title}</h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
                    {g.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15}>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-gold/10 bg-background/40 px-6 py-5 text-center">
            <span className="font-sans text-sm text-muted-foreground">Five Constitutional Guarantees:</span>
            {["Money Protection", "Governance Integrity", "Transparency", "Fairness", "Legal Compliance"].map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 font-sans text-sm text-foreground/80">
                <GoldStar className="h-3 w-3" />
                {c}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
